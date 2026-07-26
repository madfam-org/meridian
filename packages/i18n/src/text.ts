/**
 * Selecting one half of a bilingual string.
 *
 * The catalog stores every user-visible string as `{ en, es }`, both halves
 * authored and reviewed together so neither is a translation of the other. That
 * stays exactly as it is — it is how a Spanish-speaking reviewer and an
 * English-speaking one can sign off the same rule. What changes is the
 * *presentation*: the page picks one half and marks it with the right `lang`,
 * instead of emitting both and making the reader do the filtering.
 *
 * Two entry points, for two different confidences about the data:
 *
 * - {@link pick} is for data the type system already guarantees — the catalog's
 *   `LocalizedText` is validated by zod with `min(1)` on both halves, so there
 *   is nothing to report and a check would be noise.
 * - {@link resolveText} is for everything else: rows read from the database,
 *   JSON from an API, a draft in the review console. There, a half really can
 *   be absent or blank, and the failure mode matters. A missing Spanish string
 *   rendered as `''` is a heading that vanishes, a button with no label, a
 *   sentence that ends mid-clause — a page that looks finished and is not.
 *   Falling back to the other half, marked with *its* language, is visibly
 *   wrong instead of invisibly wrong, and an English sentence a Spanish reader
 *   can at least see is strictly better than nothing at all.
 */

import type { Locale } from './locale.js';
import { LOCALES } from './locale.js';

/**
 * A string authored in both languages.
 *
 * Structurally identical to the catalog's `localizedTextSchema` output, so a
 * `Pathway`'s `name`, a `Criterion`'s `label`, and a citation's `note` satisfy
 * this with no adaptation. The `readonly` modifiers do not affect assignability
 * — the catalog's mutable `{ en: string; es: string }` is accepted here — they
 * only stop this package's callers from mutating catalog data in place.
 */
export interface LocalizedText {
  readonly en: string;
  readonly es: string;
}

/**
 * The same shape with no guarantees: either half may be absent, `null`, or
 * empty. This is what data crossing a network or a database boundary actually
 * looks like, whatever its declared type says.
 */
export type PartialLocalizedText = { readonly [K in Locale]?: string | null };

/**
 * Select one half. Total, and the whole implementation.
 *
 * Use this when the type is genuinely `LocalizedText` — validated catalog data.
 * If the value came from outside the process, you want {@link resolveText}
 * instead; a cast to `LocalizedText` to get at `pick` is how an empty half
 * reaches the page.
 */
export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

/**
 * Why a resolved string is not the one that was asked for.
 *
 * - `missing` — the half was absent or `null`. Usually a schema or seed gap.
 * - `empty` — the half was present but blank or whitespace. Usually a half-done
 *   translation that passed a `typeof === 'string'` check somewhere.
 * - `unavailable` — no half is usable. `value` is `''` and the caller must not
 *   render it as text; render nothing, or an explicit gap marker.
 */
export type TextDefect = 'missing' | 'empty' | 'unavailable';

export interface ResolvedText {
  /** The string to render. Empty only when `defect` is `'unavailable'`. */
  readonly value: string;
  /**
   * The language `value` is actually written in. Put this on the element's
   * `lang`, not the page locale — when a fallback happened they differ, and a
   * synthesiser reading English words with Spanish phonetics is the exact
   * problem this whole change exists to fix.
   */
  readonly lang: Locale;
  /** The locale that was asked for. `lang !== requested` means a fallback happened. */
  readonly requested: Locale;
  /** `null` when the requested half was present and non-blank. */
  readonly defect: TextDefect | null;
}

function usable(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Select one half, reporting what was wrong with the data.
 *
 * Falls back to another locale's half rather than to `''`, and reports the
 * language it fell back to so the caller can mark it. Callers that want to show
 * the reader that a translation is pending — "(in English)" next to the
 * paragraph — have everything they need in `lang` and `defect`; callers that do
 * not care can ignore both and render `value`.
 *
 * The returned `value` is verbatim, never trimmed. Only the emptiness *test*
 * trims, because leading whitespace can be meaningful inside a rendered string
 * and silently rewriting authored text is not this function's business.
 */
export function resolveText(
  text: PartialLocalizedText | null | undefined,
  locale: Locale,
): ResolvedText {
  const requested = text?.[locale];
  if (usable(requested)) {
    return { value: requested, lang: locale, requested: locale, defect: null };
  }

  const defect: TextDefect = requested === undefined || requested === null ? 'missing' : 'empty';

  for (const candidate of LOCALES) {
    if (candidate === locale) continue;
    const half = text?.[candidate];
    if (usable(half)) {
      return { value: half, lang: candidate, requested: locale, defect };
    }
  }

  return { value: '', lang: locale, requested: locale, defect: 'unavailable' };
}

/**
 * Which halves are missing or blank, in canonical locale order.
 *
 * The audit form of {@link resolveText}: one call answers "is this record
 * publishable" without rendering it. Intended for the review console and for
 * CI over seeded content, where a list of incomplete records is worth more than
 * a page that quietly fell back.
 */
export function missingHalves(
  text: PartialLocalizedText | null | undefined,
): readonly Locale[] {
  return LOCALES.filter((locale) => !usable(text?.[locale]));
}

/** True when both halves are present and non-blank. */
export function isComplete(text: PartialLocalizedText | null | undefined): boolean {
  return missingHalves(text).length === 0;
}
