/**
 * The locale a page is served in.
 *
 * One page, one language. Meridian used to render English and Spanish into the
 * same elements, which meant a screen-reader user heard every sentence twice, a
 * sighted reader scanned past half of what was on screen, and `<html lang>`
 * could not be truthful because the document was two languages at once. A
 * reader in their own language, with a one-click switch to the other, serves a
 * mixed-language household better and is the only arrangement that lets
 * assistive technology, hyphenation, and search engines behave correctly.
 *
 * The union is closed on purpose. A `string` locale would push a runtime check
 * into every one of the ~1,700 call sites that select text; a two-member union
 * pushes it to the boundary — the URL segment and the `Accept-Language` header —
 * where {@link parseLocale} and negotiation already have to make a decision.
 */

/**
 * A language Meridian serves a whole page in.
 *
 * This is *not* the set of languages the platform can contain. Legal instrument
 * names are rendered verbatim in whatever language they were enacted in, which
 * includes French for Québec and may include others; see `instrument.ts`. A
 * `Locale` is a choice of user-interface language, nothing more.
 */
export type Locale = 'en' | 'es';

/**
 * Every locale, in canonical order.
 *
 * The order is load-bearing in two places: it decides the order alternates are
 * emitted in, and it decides which half {@link import('./text.js').resolveText}
 * falls back to. Both want the default first.
 */
export const LOCALES: readonly Locale[] = ['en', 'es'];

/**
 * The locale served when nothing has said otherwise.
 *
 * English is also the *unprefixed* locale in URLs — `/pricing` is English,
 * `/es/pricing` is Spanish. That asymmetry lives in `path.ts`; do not infer it
 * from this constant, because a future default change must not silently move
 * every English URL.
 */
export const DEFAULT_LOCALE: Locale = 'en';

/** Narrowing guard. Accepts `unknown` so it can be used on parsed JSON and route params. */
export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'es';
}

/**
 * Parse a URL segment or route param into a locale.
 *
 * Returns `null` rather than throwing, because the input is attacker-controlled
 * and an unknown segment is a routing decision (404, or fall through to a page
 * whose first segment happens not to be a locale) rather than a fault.
 *
 * Deliberately strict about case and about region subtags. `/ES/pricing` and
 * `/es-MX/pricing` are not URLs this site serves, and quietly accepting them
 * would publish the same Spanish page under three addresses, splitting its
 * search ranking and making `hreflang` self-contradictory. Whitespace is
 * trimmed because a param can arrive with an encoded space; nothing else is
 * repaired.
 *
 * `Accept-Language` values are *not* parsed here — see `negotiate.ts`, which
 * has to do the region-subtag and quality-value work this refuses to do.
 */
export function parseLocale(value: string | null | undefined): Locale | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return isLocale(trimmed) ? trimmed : null;
}

/**
 * The BCP 47 tag for `<html lang>`, and for any element whose content is in
 * this locale.
 *
 * Unqualified `en` and `es` rather than `en-US`/`es-MX`: the catalog's Spanish
 * is not written for one country, and claiming a region we did not author for
 * would be a claim about the text that is not true. A region subtag changes how
 * a synthesiser pronounces and how a browser hyphenates; it should be added
 * only when someone has actually reviewed the copy for that region.
 */
export const LANG_ATTR: Readonly<Record<Locale, string>> = {
  en: 'en',
  es: 'es',
};

/** `LANG_ATTR` as a function, for the common `lang={htmlLang(locale)}` call site. */
export function htmlLang(locale: Locale): string {
  return LANG_ATTR[locale];
}

/**
 * The name of each language *in that language*.
 *
 * A language switcher labelled "Spanish" is useless to the person who needs it,
 * because that person is not reading English. Endonyms are also the same rule
 * the citation module applies to instrument names — a proper name in another
 * language is not translated, it is marked. Render each with
 * `lang={LANG_ATTR[locale]}` so it is pronounced correctly.
 */
export const LOCALE_ENDONYM: Readonly<Record<Locale, string>> = {
  en: 'English',
  es: 'Español',
};

/**
 * The locale a switcher on this page should point at.
 *
 * Meaningful only while exactly two locales ship. It throws rather than guesses
 * if a third is added, because the alternative is a switcher that silently
 * stops offering one of the languages — a defect nobody would see in a
 * screenshot. The throw is a programming error, not an expected failure, which
 * is why this is not a `Result`.
 */
export function otherLocale(locale: Locale): Locale {
  const others = LOCALES.filter((candidate) => candidate !== locale);
  const only = others[0];
  if (only === undefined || others.length !== 1) {
    throw new RangeError(
      `otherLocale() assumes exactly two locales; ${LOCALES.length} are configured. ` +
        'A switcher over three or more locales needs a list, not a toggle.',
    );
  }
  return only;
}
