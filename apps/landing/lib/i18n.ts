/**
 * One page, one language.
 *
 * This site used to render English and Spanish into the same elements. The
 * argument for it was that the catalog authors both halves together and neither
 * is subordinate — true of the *data*, and it stays true: every table below is
 * still `{ en, es }`, and nothing in `packages/pathways` changed. It was not
 * true of the *page*. A screen-reader user heard every sentence twice, the
 * document was about twice as long as it needed to be, every reader paid
 * scanning cost to discard half of it, and `<html lang>` could not be honest
 * because the document was two languages at once. A reader in their own
 * language, with a one-click switch to the other, serves the mixed-language
 * household this site actually has — an applicant, the relative helping them, a
 * mobility manager, a paralegal — better than making all four read both.
 *
 * So the string tables here keep both halves as data, and the page picks one.
 * The picking is {@link translator}: build one from the served locale at the top
 * of a component and every string below it resolves through it.
 *
 * The locale machinery itself is not defined here. It lives in
 * `@meridian/i18n`, which the portal and the console share, and this module
 * re-exports the parts this site uses rather than restating them — in
 * particular the path helpers, because English is *unprefixed* and Spanish is
 * `/es`, so adding and removing a locale are not inverses and a hand-rolled
 * `startsWith('/es')` decides `/estimate` is Spanish.
 */

/*
 * Re-exported rather than imported from `@meridian/i18n` at each call site, so
 * that a component reaches for one module to get a locale, a string table and a
 * path helper. The list is exactly what this application uses: the package's
 * negotiation and text-defect helpers are for the portal and the console, which
 * read locales from headers and strings from a database, and neither happens
 * here.
 */
export type { Locale, LocalizedText } from '@meridian/i18n';
export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_ENDONYM,
  htmlLang,
  instrumentLang,
  localizedPath,
  otherLocale,
  parseLocale,
  pick,
  splitLocalePath,
} from '@meridian/i18n';

import { alternatePaths, pick, type Locale, type LocalizedText } from '@meridian/i18n';

import { SITE_URL } from '@/lib/links';

/**
 * Every `hreflang` alternate for a page, as absolute URLs.
 *
 * `alternatePaths` returns paths, deliberately: three applications have three
 * hostnames and a leaf package has no business knowing any of them. Search
 * engines require absolute URLs in `hreflang`, so the origin is added here,
 * once, from the same constant the rest of the site links with.
 *
 * The keys are written out rather than derived from `LOCALES`, so that adding a
 * locale is a compile error here instead of a page that silently stops
 * declaring one of its own translations.
 */
function absoluteAlternates(path: string): Readonly<Record<Locale | 'x-default', string>> {
  const paths = alternatePaths(path);
  return {
    en: `${SITE_URL}${paths.en}`,
    es: `${SITE_URL}${paths.es}`,
    'x-default': `${SITE_URL}${paths['x-default']}`,
  };
}

/** The alternates for the one document this site serves. */
export const SITE_ALTERNATES = absoluteAlternates('/');

/**
 * A string authored in both languages.
 *
 * Kept as the terse constructor it always was, because it is written a few
 * hundred times in this application and `{ en: '…', es: '…' }` at every one of
 * them is noise. What changed is what happens to the result: it is *data* now,
 * and one half of it reaches the page.
 */
export function bi(en: string, es: string): LocalizedText {
  return { en, es };
}

/**
 * Resolve a bilingual string to the served locale.
 *
 * Two shapes, because there are two kinds of call site and both are common:
 *
 * - `t(SOME_TABLE.entry)` for a value that already exists — catalog data, a
 *   string table, a validation message.
 * - `t('Status', 'Estado')` for a string written where it is used.
 *
 * There is deliberately no one-argument string form. `t('Status')` would
 * compile, render English to a Spanish reader, and look exactly like a
 * translated call site in review.
 */
export interface Translate {
  (text: LocalizedText): string;
  (en: string, es: string): string;
}

export function translator(locale: Locale): Translate {
  function translate(first: LocalizedText | string, second?: string): string {
    if (typeof first === 'string') return pick({ en: first, es: second ?? first }, locale);
    return pick(first, locale);
  }
  return translate as Translate;
}

/** Chrome strings. Kept here rather than inline so the two languages stay in step. */
export const UI = {
  siteName: bi('Meridian', 'Meridian'),
  siteTagline: bi(
    'Migration law and logistics, with the arithmetic shown',
    'Derecho y logística migratoria, con la aritmética a la vista',
  ),
  skipToContent: bi('Skip to main content', 'Saltar al contenido principal'),

  /* First, and pointing at the working instrument rather than at prose about
     it. A reader who follows exactly one link from this header should land on
     something that answers a question about their own travel history. */
  navCalculator: bi('Try the day counter', 'Pruebe el cómputo de días'),
  navDoors: bi('Who it is for', 'Para quién es'),
  navProof: bi('See it refuse', 'Véalo negarse'),
  /* Immediately after the corridors, because that is where a reader forms the
     impression this corrects: the corridor cards are the most flattering part of
     the page and say nothing about how small the sample is. */
  navCoverage: bi('What it does not cover', 'Qué no cubre'),
  navBoundary: bi('The advice boundary', 'La frontera del asesoramiento'),
  navStatus: bi('Status', 'Estado'),
  openPortal: bi('Open the portal', 'Abrir el portal'),
  readTheSource: bi('Read the source', 'Ver el código fuente'),

  /* The switcher's own landmark label, in the language of the page it sits on.
     Every other string the switcher renders is in the language it points at —
     see LOCALE_ENDONYM and VIEW_IN_LOCALE. */
  languageNav: bi('Language', 'Idioma'),

  footerNotAdvice: bi(
    'Meridian is software. It is not a law firm and it does not give legal advice.',
    'Meridian es software. No es un despacho de abogados y no presta asesoramiento jurídico.',
  ),
  footerLicence: bi(
    'Meridian is free software released under the AGPL-3.0. The source is public, including the rule catalog and every citation in it.',
    'Meridian es software libre publicado bajo la licencia AGPL-3.0. El código es público, incluidos el catálogo de normas y todas sus citas.',
  ),
  footerComputed: bi(
    'Every figure on this page is counted from the shipped catalog when the site is built. None of them is an estimate.',
    'Todas las cifras de esta página se cuentan a partir del catálogo publicado al compilar el sitio. Ninguna es una estimación.',
  ),
} as const;

/**
 * What the language link does, written in the language it leads to.
 *
 * A switcher whose accessible name is in the language the reader is leaving is
 * useless to the person who needs it, for the same reason `LOCALE_ENDONYM`
 * exists: that person is not reading this page's language. Rendered inside an
 * element carrying `lang` for the target locale, so a synthesiser pronounces it
 * correctly rather than reading Spanish with English phonetics.
 */
export const VIEW_IN_LOCALE: Readonly<Record<Locale, string>> = {
  en: 'View this page in English',
  es: 'Ver esta página en español',
};
