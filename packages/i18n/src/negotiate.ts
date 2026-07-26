/**
 * `Accept-Language` negotiation.
 *
 * Used in exactly one place: deciding where to send a reader who asked for `/`
 * with no stated preference. Once they are on a locale URL the URL is the
 * authority — negotiation must never override an explicit `/es/...`, or a link
 * someone sends to a Spanish speaker renders in English on the recipient's
 * English browser, which is the failure this whole design exists to prevent.
 *
 * Pure functions over a string. No `Request`, no `Headers`, no framework type,
 * so this is testable with a literal and usable from middleware, a route
 * handler, or a script.
 *
 * The header is client-supplied and frequently malformed — proxies concatenate
 * it, extensions rewrite it, bots send garbage. Every parse failure here
 * degrades to "ignore that entry", never to a throw: failing to guess a
 * language is not a reason to fail a request.
 */

import type { Locale } from './locale.js';
import { DEFAULT_LOCALE, LOCALES } from './locale.js';

/** One entry of an `Accept-Language` header, after parsing. */
export interface LanguageRange {
  /** The language range, lowercased. `'*'` is the wildcard. */
  readonly range: string;
  /** Quality value in `[0, 1]`. Absent `q` means 1. `0` means "not acceptable". */
  readonly quality: number;
}

/** RFC 4647 language range: subtags of 1-8 alphanumerics, or the wildcard. */
const RANGE_RE = /^(?:\*|[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*)$/;

/** RFC 9110 qvalue: 0-1 with at most three decimal places. `q=2` and `q=abc` are not qvalues. */
const QVALUE_RE = /^(?:0(?:\.\d{1,3})?|1(?:\.0{1,3})?)$/;

/**
 * Parse an `Accept-Language` header into ranges, best first.
 *
 * Sorted by quality descending, ties broken by the order the client sent them —
 * that order is the client's own preference signal and discarding it would make
 * `es,en` and `en,es` mean the same thing.
 *
 * An entry is dropped when its range is not a well-formed language range, or
 * when it carries a `q` parameter that is not a well-formed qvalue. Dropping a
 * malformed `q` rather than defaulting it to 1 is the conservative choice: an
 * entry the client marked as low-priority in a way we cannot read must not be
 * promoted to the top of the list.
 *
 * Returns `[]` for a missing, empty, or entirely malformed header. The caller
 * decides what that means; {@link negotiateLocale} treats it as "no preference".
 */
export function parseAcceptLanguage(header: string | null | undefined): readonly LanguageRange[] {
  if (typeof header !== 'string') return [];

  const parsed: { range: string; quality: number; order: number }[] = [];
  let order = 0;

  for (const entry of header.split(',')) {
    const parts = entry.split(';');
    const range = (parts[0] ?? '').trim();
    if (range === '' || !RANGE_RE.test(range)) continue;

    let quality = 1;
    let malformed = false;

    for (const parameter of parts.slice(1)) {
      const equals = parameter.indexOf('=');
      if (equals === -1) continue;
      if (parameter.slice(0, equals).trim().toLowerCase() !== 'q') continue;
      const value = parameter.slice(equals + 1).trim();
      if (!QVALUE_RE.test(value)) {
        malformed = true;
        break;
      }
      quality = Number(value);
    }

    if (malformed) continue;
    parsed.push({ range: range.toLowerCase(), quality, order: order++ });
  }

  parsed.sort((a, b) => b.quality - a.quality || a.order - b.order);
  return parsed.map(({ range, quality }) => ({ range, quality }));
}

export interface NegotiationOptions {
  /** Locales the caller can actually serve. Defaults to every locale. */
  readonly supported?: readonly Locale[];
  /** Returned when nothing matches. Defaults to {@link DEFAULT_LOCALE}. */
  readonly fallback?: Locale;
}

/**
 * A range matches a locale when it *is* that locale or is a more specific form
 * of it: `es-MX` and `es-419` both match `es`.
 *
 * Truncation is one-way. `es` does not match a hypothetical `es-MX` locale,
 * because a reader who asked for generic Spanish has not asked for a regional
 * variant that may differ in law-adjacent vocabulary.
 */
function matches(range: string, locale: Locale): boolean {
  return range === locale || range.startsWith(`${locale}-`);
}

/**
 * Best supported locale for a header, or the fallback.
 *
 * `q=0` is honoured as an explicit refusal: `en;q=0, *` means "anything but
 * English", and returning English there would be reading the header backwards.
 * A wildcard at `q=0` is *not* treated as refusing locales the header names
 * positively — `*;q=0, es;q=0.5` is the standard way to say "Spanish only", and
 * the explicit entry wins over the catch-all.
 *
 * Always returns a locale. A page has to render in some language, and a 406 is
 * not a thing to serve a human being who typed a domain name.
 */
export function negotiateLocale(
  header: string | null | undefined,
  options: NegotiationOptions = {},
): Locale {
  const supported = options.supported ?? LOCALES;
  const fallback = options.fallback ?? DEFAULT_LOCALE;
  if (supported.length === 0) return fallback;

  const ranges = parseAcceptLanguage(header);

  const refused = new Set<Locale>();
  for (const { range, quality } of ranges) {
    if (quality !== 0 || range === '*') continue;
    for (const locale of supported) {
      if (matches(range, locale)) refused.add(locale);
    }
  }

  for (const { range, quality } of ranges) {
    if (quality === 0) continue;

    if (range === '*') {
      if (supported.includes(fallback) && !refused.has(fallback)) return fallback;
      const any = supported.find((locale) => !refused.has(locale));
      if (any !== undefined) return any;
      continue;
    }

    const hit = supported.find((locale) => matches(range, locale) && !refused.has(locale));
    if (hit !== undefined) return hit;
  }

  // Nothing matched positively. If the header went out of its way to refuse the
  // fallback, respect that much of it rather than serving the one language the
  // reader said they did not want.
  if (refused.has(fallback)) {
    const alternative = supported.find((locale) => !refused.has(locale));
    if (alternative !== undefined) return alternative;
  }

  return fallback;
}
