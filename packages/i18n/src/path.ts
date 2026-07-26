/**
 * Locale in the URL.
 *
 * `/` and `/pricing` are English; `/es` and `/es/pricing` are Spanish. Locale
 * lives in the path rather than in a cookie for three reasons, in order: a link
 * someone sends to a Spanish speaker has to stay Spanish on the recipient's
 * English browser; both variants have to be independently indexable with
 * `hreflang`; and these pages are statically generated, so a cookie-only toggle
 * would either flash the wrong language on hydration or force every page
 * dynamic.
 *
 * **The asymmetry is the whole point of this module.** English is unprefixed
 * and Spanish is `/es`, so "add the locale" and "remove the locale" are not
 * inverses, and a hand-rolled `path.startsWith('/es')` in three different apps
 * gets it wrong in three different ways. `/estimate` is not Spanish. `/es/` and
 * `/es` are the same page. `/es` with the locale removed is `/`, not `''` — an
 * empty `href` reloads the current URL, which is a switcher that appears to do
 * nothing.
 *
 * These functions operate on **public URL paths** — what is in the address bar
 * and what goes in an `href`. If an app rewrites internally to `/en/...` for a
 * `[locale]` segment, that rewritten form is not what these read or produce.
 */

import type { Locale } from './locale.js';
import { DEFAULT_LOCALE, LOCALES } from './locale.js';

/**
 * The path prefix each locale is served under. The default locale's prefix is
 * empty: it owns the bare paths.
 *
 * Adding a locale is an entry here plus an entry in `LOCALES`, and every
 * function in this module follows. Do not encode `/es` as a literal anywhere
 * else.
 */
export const LOCALE_PREFIX: Readonly<Record<Locale, string>> = {
  en: '',
  es: '/es',
};

export interface SplitPath {
  /** The locale the path is served in. The default when there is no prefix. */
  readonly locale: Locale;
  /**
   * Whether the URL actually carried a locale prefix. `/pricing` is English by
   * default, not by declaration — worth distinguishing when deciding whether a
   * reader has expressed a preference or merely arrived.
   */
  readonly explicit: boolean;
  /**
   * The path with the locale prefix removed. Always starts with `/`, never ends
   * with one except at the root, and has no empty segments.
   */
  readonly path: string;
  /**
   * The query string and fragment, verbatim, including the leading `?` or `#`.
   * Empty when there is neither. Kept so a switcher can carry a reader's
   * filters and form state across the language change instead of dumping them.
   */
  readonly suffix: string;
}

/**
 * Split off the query and fragment, then canonicalise the path: one leading
 * slash, no duplicate slashes, no trailing slash except at the root.
 *
 * Trailing slashes are removed rather than preserved because Next's default
 * `trailingSlash: false` redirects `/pricing/` to `/pricing` anyway; emitting
 * the pre-redirect form in an `href` costs the reader a round trip and gives
 * search engines two URLs for one page.
 */
function normalize(input: string): { path: string; suffix: string } {
  const raw = typeof input === 'string' ? input : '';
  const question = raw.indexOf('?');
  const hash = raw.indexOf('#');
  const cut =
    question === -1 ? hash : hash === -1 ? question : Math.min(question, hash);

  const rawPath = cut === -1 ? raw : raw.slice(0, cut);
  const suffix = cut === -1 ? '' : raw.slice(cut);

  const segments = rawPath.split('/').filter((segment) => segment.length > 0);
  return { path: segments.length === 0 ? '/' : `/${segments.join('/')}`, suffix };
}

/**
 * Read the locale out of a path and return the locale-free remainder.
 *
 * Prefix matching is on segment boundaries, so `/estimate`, `/españa` and
 * `/escalation` are ordinary English paths and only `/es` and `/es/...` are
 * Spanish. Accepts a path with or without a query string, with or without a
 * leading slash, and with any number of trailing slashes.
 *
 * `/en/pricing` is *not* treated as a locale-prefixed path: English is
 * unprefixed, so `/en` is an ordinary first segment. Recognising it would
 * publish every English page under two addresses.
 */
export function splitLocalePath(input: string): SplitPath {
  const { path, suffix } = normalize(input);

  for (const locale of LOCALES) {
    const prefix = LOCALE_PREFIX[locale];
    if (prefix === '') continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      const rest = path.slice(prefix.length);
      return { locale, explicit: true, path: rest === '' ? '/' : rest, suffix };
    }
  }

  return { locale: DEFAULT_LOCALE, explicit: false, path, suffix };
}

/**
 * The same page, in another locale.
 *
 * This is what the language switcher's `href` is: the *current* path in the
 * other language, never the home page. Sending a reader who is halfway through
 * the day counter back to `/` because they wanted to read it in Spanish loses
 * their place and everything they typed.
 *
 * Idempotent — converting a path to the locale it is already in returns it
 * canonicalised and otherwise unchanged. The query string and fragment are
 * carried across verbatim.
 */
export function localizedPath(input: string, locale: Locale): string {
  const { path, suffix } = splitLocalePath(input);
  const prefix = LOCALE_PREFIX[locale];
  const base = path === '/' ? (prefix === '' ? '/' : prefix) : `${prefix}${path}`;
  return `${base}${suffix}`;
}

/** Keyed by locale, plus the `x-default` alternate search engines expect. */
export type AlternatePaths = Readonly<Record<Locale | 'x-default', string>>;

/**
 * Every `hreflang` alternate for a page, including `x-default`.
 *
 * `x-default` points at the default locale — the variant served to a reader
 * whose language we have no basis to guess.
 *
 * The query string is deliberately dropped. `hreflang` describes documents, and
 * the document at `/pricing?ref=x` is the document at `/pricing`; listing the
 * parameterised form invites a search engine to index one reader's query as a
 * page. Use {@link localizedPath} for the switcher, which does keep it.
 *
 * These are paths. Search engines require absolute URLs in `hreflang`, so the
 * caller prepends its own origin — this package has no business knowing the
 * hostname, and three apps have three different ones.
 */
export function alternatePaths(input: string): AlternatePaths {
  const { path } = splitLocalePath(input);
  return {
    en: localizedPath(path, 'en'),
    es: localizedPath(path, 'es'),
    'x-default': localizedPath(path, DEFAULT_LOCALE),
  };
}
