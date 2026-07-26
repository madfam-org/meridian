/**
 * One page, one language.
 *
 * This portal used to render English and Spanish into the same elements. The
 * argument for it was that the catalog authors both halves together and neither
 * is subordinate — which is true of the *data* and stays true. Every `Bi` below,
 * every `{ en, es }` in `@meridian/pathways`, is unchanged. What was not true
 * was the *page*: a screen-reader user heard every sentence twice, the document
 * was about twice as long as it needed to be, every reader paid scanning cost to
 * discard half of it, and `<html lang>` could not be honest because the document
 * was two languages at once. A reader in their own language, with a one-click
 * switch to the other, serves a mixed-language household better.
 *
 * So the catalog still carries both halves and the page picks one. The picking
 * happens here.
 *
 * ## The idiom
 *
 * A component that renders text takes the served `Locale` and binds a
 * translator once:
 *
 * ```tsx
 * export function Something({ locale }: { readonly locale: Locale }) {
 *   const t = translator(locale);
 *   return <h2>{t('The problem', 'El problema')}</h2>;
 * }
 * ```
 *
 * `t` is overloaded so the two shapes that actually occur both read naturally:
 * an inline pair authored at the call site, and a `Bi` that came from the
 * catalog or from `lib/`. It also accepts `Bi | undefined` and passes the
 * absence through, because `issueFor` returns an optional message and forcing
 * every caller to branch would be noise.
 *
 * A component that is handed its text — a badge, a callout title, a field label
 * — takes a resolved `string` instead, and the caller runs `t` on it. Only
 * components that own copy, or that walk a structure of `Bi` values, take a
 * `Locale`. That keeps the leaf presentation components free of any opinion
 * about language.
 *
 * ## What does not go through `t`
 *
 * **Legal instrument names and provisions.** "Código Civil", "art. 22.1",
 * "Immigration and Refugee Protection Act", "s.91" — those are the identity of a
 * source, not prose about it, and translating one produces a citation that names
 * an instrument which does not exist under that title. They render verbatim with
 * a `lang` attribute of their own; see `instrumentLang` and
 * `components/Citations.tsx`.
 *
 * **Engine output.** `@meridian/core`, `@meridian/pathways`, `@meridian/presence`
 * and `@meridian/mrtd` write their `detail`, `reason` and `message` strings in
 * English. They are quoted with `lang="en"` rather than paraphrased, because a
 * paraphrase of a compliance determination or of an arithmetic trace is a
 * different statement.
 */

import type { Locale } from '@meridian/i18n';
import { pick } from '@meridian/i18n';

export type { AlternatePaths, Locale, LocalizedText, ResolvedText } from '@meridian/i18n';
export {
  DEFAULT_LOCALE,
  LANG_ATTR,
  LOCALES,
  LOCALE_ENDONYM,
  LOCALE_PREFIX,
  alternatePaths,
  htmlLang,
  instrumentLang,
  isLocale,
  localizedPath,
  otherLocale,
  parseLocale,
  pick,
  resolveText,
  splitLocalePath,
} from '@meridian/i18n';

/**
 * A string authored in both languages.
 *
 * Structurally identical to `LocalizedText` in `@meridian/i18n` and to the
 * catalog's own shape, so a `Pathway`'s `name` and a `Criterion`'s `label`
 * satisfy it with no adaptation.
 */
export interface Bi {
  readonly en: string;
  readonly es: string;
}

export function bi(en: string, es: string): Bi {
  return { en, es };
}

/**
 * Selects one half of a bilingual string, in the locale it was bound to.
 *
 * Three call shapes, one function:
 *
 * - `t(text)` — a `Bi` from the catalog or from `lib/`.
 * - `t(maybeText)` — the same, optional, absence passed through untouched.
 * - `t('English', 'Español')` — a pair authored at the call site. This is the
 *   common case in a page, and writing it inline keeps the two languages of a
 *   sentence next to each other, where a reviewer can compare them.
 */
export interface Translate {
  (text: Bi): string;
  (text: Bi | undefined): string | undefined;
  (en: string, es: string): string;
}

/**
 * Bind a translator to a locale.
 *
 * Call it once per component rather than threading a locale into every
 * expression. It holds no state and allocates one closure, so it is cheap
 * enough to call in a render.
 */
export function translator(locale: Locale): Translate {
  function translate(a: Bi | string | undefined, b?: string): string | undefined {
    if (a === undefined) return undefined;
    if (typeof a === 'string') return locale === 'en' ? a : (b ?? a);
    return pick(a, locale);
  }
  return translate as Translate;
}

/** The chrome. Kept here rather than inline so the two languages stay in step. */
export const UI = {
  siteName: bi('Meridian', 'Meridian'),
  siteTagline: bi(
    'Migration law and logistics, with the arithmetic shown',
    'Derecho y logística migratoria, con la aritmética a la vista',
  ),
  skipToContent: bi('Skip to main content', 'Saltar al contenido principal'),
  navHome: bi('Overview', 'Resumen'),
  navMatters: bi('Matters', 'Expedientes'),
  navPathways: bi('Pathways', 'Vías'),
  matterOverview: bi('Matter', 'Expediente'),
  matterPresence: bi('Day counters', 'Cómputo de días'),
  matterDocuments: bi('Documents', 'Documentos'),
  workedExample: bi('Worked example', 'Ejemplo resuelto'),
  asOf: bi('Assessed as at', 'Evaluado a fecha de'),
  citation: bi('Source', 'Fuente'),
  citations: bi('Sources', 'Fuentes'),
  verifiedOn: bi('Last verified', 'Última verificación'),
  arithmetic: bi('The arithmetic', 'La aritmética'),
  noneRecorded: bi('None recorded', 'Sin registros'),
  notAssessed: bi('Not assessed', 'No evaluado'),
  representative: bi('Authorised representative', 'Representante autorizado'),
  /**
   * The switcher's landmark name. The options inside it are not translated —
   * see `LOCALE_ENDONYM` and `VIEW_IN_LOCALE`, which name each language in
   * itself.
   */
  languageNav: bi('Language', 'Idioma'),
  footerLicence: bi(
    'Meridian is free software released under the AGPL-3.0.',
    'Meridian es software libre publicado bajo la licencia AGPL-3.0.',
  ),
  footerNotAdvice: bi(
    'Meridian is software. It is not a law firm and it does not give legal advice.',
    'Meridian es software. No es un despacho de abogados y no presta asesoramiento jurídico.',
  ),
} as const;

/**
 * The switcher link's accessible name, one per language, written *in* that
 * language.
 *
 * A whole sentence rather than the bare endonym, because a screen reader
 * announcing "Español, link" leaves its purpose to be guessed. It is not spelled
 * out visibly: four words of Spanish in an English header buy nothing that the
 * endonym does not already say.
 */
export const VIEW_IN_LOCALE: Readonly<Record<Locale, string>> = {
  en: 'View this page in English',
  es: 'Ver esta página en español',
};
