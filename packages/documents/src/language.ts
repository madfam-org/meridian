/**
 * Language tags, and why a bare `string` will not do.
 *
 * Two failure modes make this worth a branded type.
 *
 * The first is casing and region subtags. A document recorded as `es-MX` is
 * written in Spanish; if the translation check compares the raw string against
 * `'es'` it concludes the document is in a foreign language and bills the
 * applicant for a sworn translation they never needed. Comparison must happen
 * on the *primary* subtag.
 *
 * The second is Spain. `es` is not "the language of Spain" — it is Castilian,
 * one of several official languages, and which of them an authority accepts
 * depends on which authority and where it sits. Modelling that honestly needs
 * the language to be a first-class value rather than an implied default, which
 * is why nothing in this package ever assumes Castilian.
 *
 * The shape is a conservative subset of BCP 47: a two- or three-letter primary
 * subtag, optionally followed by hyphen-separated subtags. That covers every
 * tag the catalog uses (`es`, `ca`, `ca-valencia`, `eu`, `gl`, `oc`, `en`,
 * `fr`, `pt-BR`) without pulling in a registry we would then have to maintain.
 */

/** A normalised, lowercase BCP 47-style language tag. Branded so it cannot be confused with a display name. */
export type LanguageTag = string & { readonly __brand: 'LanguageTag' };

const LANGUAGE_TAG_RE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

/**
 * Parse and normalise a language tag. Case and surrounding whitespace are
 * discarded — `'ES-mx'` and `'es-MX'` are the same language and must compare
 * equal, because whether an applicant's file is typed by a caseworker or
 * imported from a government feed is not a legal fact.
 */
export function languageTag(value: string): LanguageTag {
  const normalised = value.trim().toLowerCase();
  if (!LANGUAGE_TAG_RE.test(normalised)) {
    throw new RangeError(`invalid language tag: ${JSON.stringify(value)}`);
  }
  return normalised as LanguageTag;
}

/** Non-throwing variant of {@link languageTag}. */
export function tryLanguageTag(value: string): LanguageTag | null {
  try {
    return languageTag(value);
  } catch {
    return null;
  }
}

/** True when `value` parses as a language tag. Accepts unnormalised casing. */
export function isLanguageTag(value: unknown): value is LanguageTag {
  return typeof value === 'string' && tryLanguageTag(value) !== null;
}

/**
 * The primary subtag — `'es'` for `'es-MX'`, `'ca'` for `'ca-valencia'`.
 *
 * All language *acceptance* decisions in this package are made on the primary
 * subtag. A Mexican birth certificate is in Spanish whether it is tagged `es`
 * or `es-MX`, and a Valencian document is in Catalan for translation purposes
 * whichever variant subtag it carries.
 */
export function primaryLanguage(tag: LanguageTag): LanguageTag {
  const cut = tag.indexOf('-');
  return (cut === -1 ? tag : tag.slice(0, cut)) as LanguageTag;
}

/** True when two tags share a primary subtag. */
export function sameLanguage(a: LanguageTag, b: LanguageTag): boolean {
  return primaryLanguage(a) === primaryLanguage(b);
}

/** True when `tag`'s primary subtag matches any tag in `accepted`. */
export function languageAccepted(tag: LanguageTag, accepted: readonly LanguageTag[]): boolean {
  return accepted.some((a) => sameLanguage(a, tag));
}

/** Castilian — the official language of the Spanish State (Constitución Española, art. 3.1). */
export const CASTILIAN: LanguageTag = languageTag('es');
/**
 * Catalan. Officially denominated *valencià* in the Comunitat Valenciana; the
 * two are recorded here under one tag because ISO 639 and BCP 47 treat
 * Valencian as a variant of Catalan (`ca-valencia`). That is a coding
 * normalisation for translation routing, not a position on the naming question.
 */
export const CATALAN: LanguageTag = languageTag('ca');
/** Galician — co-official in Galicia. */
export const GALICIAN: LanguageTag = languageTag('gl');
/** Basque (euskara) — co-official in the País Vasco and, by zone, in Navarre. */
export const BASQUE: LanguageTag = languageTag('eu');
/** Occitan — the Aranese variety is official in Catalonia. */
export const OCCITAN: LanguageTag = languageTag('oc');
export const ENGLISH: LanguageTag = languageTag('en');
export const FRENCH: LanguageTag = languageTag('fr');
export const PORTUGUESE: LanguageTag = languageTag('pt');
