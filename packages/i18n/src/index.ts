/**
 * `@meridian/i18n` — one page, one language.
 *
 * Meridian used to render English and Spanish into the same elements. The
 * argument for it was that the catalog authors both halves together and neither
 * is subordinate, which is true of the *data* and stays true — nothing in this
 * package touches `packages/pathways` or `packages/atlas`, and a `Pathway` goes
 * on carrying `{ en, es }`. It was not true of the *page*. A screen-reader user
 * heard every sentence twice; the document was about twice as long as it needed
 * to be; every reader paid scanning cost to discard half of it; and `<html
 * lang>` could not be correct, because the page was two languages at once. A
 * reader in their own language, with a one-click switch to the other, serves a
 * mixed-language household better than making both people read both.
 *
 * This package is the resolution layer the three apps share. It holds no copy
 * and no components — those belong to the apps — only the decisions that would
 * otherwise be made slightly differently in each of them:
 *
 * - **`Locale`** (`locale.ts`) — the closed union, the canonical order, the
 *   default, the `lang` tags, and the language endonyms a switcher needs.
 * - **Text selection** (`text.ts`) — `pick` for validated catalog data,
 *   `resolveText` for anything that crossed a network or database boundary and
 *   might be missing a half.
 * - **Negotiation** (`negotiate.ts`) — `Accept-Language` with quality values,
 *   for the one decision it may make: where to send a reader who stated no
 *   preference. It must never override an explicit locale in a URL.
 * - **Paths** (`path.ts`) — English is unprefixed, Spanish is `/es`, so adding
 *   and removing a locale are not inverses. This is where a hand-rolled
 *   `startsWith('/es')` decides `/estimate` is Spanish.
 * - **Instrument names** (`instrument.ts`) — the rule with legal consequence:
 *   an instrument name is the identity of a source and is never translated, so
 *   it is marked with its own language instead.
 *
 * ## It depends on nothing
 *
 * Not even `@meridian/core`. Every one of these functions runs in a client
 * component, and the landing site already learned what happens when a client
 * module reaches into `@meridian/pathways`: the whole catalog and zod follow it
 * into the browser bundle. A leaf package cannot do that. The shapes it needs
 * from other packages — a bilingual string, a citation's jurisdiction — are
 * declared structurally, so real catalog values satisfy them with no adaptation
 * and no import.
 *
 * ## It makes no claims about content
 *
 * Nothing here translates anything, and nothing here decides what a page says.
 * Given data it selects a half and reports honestly when a half is missing;
 * given a jurisdiction it says what language an instrument name is in, or
 * `null` when it does not know. Both refusals are deliberate: a blank string
 * rendered as if it were content, and a confident wrong `lang` on a statute,
 * are each worse than a visible gap.
 */

export type { Locale } from './locale.js';
export {
  DEFAULT_LOCALE,
  LANG_ATTR,
  LOCALES,
  LOCALE_ENDONYM,
  htmlLang,
  isLocale,
  otherLocale,
  parseLocale,
} from './locale.js';

export type { LocalizedText, PartialLocalizedText, ResolvedText, TextDefect } from './text.js';
export { isComplete, missingHalves, pick, resolveText } from './text.js';

export type { LanguageRange, NegotiationOptions } from './negotiate.js';
export { negotiateLocale, parseAcceptLanguage } from './negotiate.js';

export type { AlternatePaths, SplitPath } from './path.js';
export { LOCALE_PREFIX, alternatePaths, localizedPath, splitLocalePath } from './path.js';

export type { InstrumentLanguagePolicy, InstrumentSource } from './instrument.js';
export {
  INSTRUMENT_LANGUAGES,
  instrumentLang,
  instrumentLanguagePolicy,
  isInstrumentLanguageCertain,
} from './instrument.js';
