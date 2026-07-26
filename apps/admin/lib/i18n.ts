/**
 * One page, one language — for the firm console.
 *
 * The other two applications had a different problem from this one. They
 * rendered English and Spanish into the same elements and had to be un-merged.
 * This console had no localisation at all: every string was an English literal
 * inline in a component, across eight routes. So there was nothing to take
 * apart, and this file is the capability that was missing.
 *
 * That gap was not cosmetic. Half of what this platform serves runs out of a
 * Spanish-speaking corridor, and the buyer in it is a gestoría or a small
 * despacho whose caseworkers are not obliged to read English to see that a
 * colleague's credential lapsed last week. An English-only console tells them
 * to.
 *
 * ## What lives here and what does not
 *
 * This file holds the mechanics and the **product copy** — the sentences the
 * console writes about itself. The **domain vocabulary** is next door in
 * `lib/labels.ts`, because the two fail differently: a clumsy sentence is a
 * clumsy sentence, whereas a wrong term of art asserts something false about a
 * regulator. Read that file's header before touching a label in it.
 *
 * Three kinds of string never appear in either file, and each is deliberate:
 *
 *  - **Catalog text.** A `Pathway` carries `{ en, es }`, both halves authored
 *    together, and the page selects one with `pick` from `@meridian/i18n`. It is
 *    not copied here and it is not translated here.
 *  - **Instrument names.** Never translated at all, in any direction. See
 *    `@meridian/i18n`'s `instrument.ts` for why a translated statute title is a
 *    mis-citation rather than a translation.
 *  - **Record content.** Matter titles, task titles, audit summaries and the
 *    regulator names on the roster are what somebody wrote into the record.
 *    They are rendered verbatim and marked with the language they are in, the
 *    same treatment an instrument name gets. Translating a file reference or a
 *    firm's own one-line description of a matter would be editing the evidence.
 *
 * ## Interpolation
 *
 * Templated strings carry `{name}` placeholders and go through {@link fill}
 * rather than being assembled from fragments at the call site. Assembling them
 * at the call site is how a translation ends up with English word order: "3
 * expedientes coinciden" and "coinciden 3 expedientes" are not the same
 * sentence, and only the language that owns the string can decide which it is.
 *
 * Strings that need a code identifier or emphasis inside them use a light
 * markup — `` `code` `` renders as `<Mono>` and `*emphasis*` as `<strong>` —
 * read by the `Rich` component. That keeps the table flat and reviewable
 * instead of splitting one sentence into four exported fragments.
 */

import {
  DEFAULT_LOCALE,
  LANG_ATTR,
  LOCALES,
  LOCALE_ENDONYM,
  type Locale,
  type LocalizedText,
  alternatePaths,
  htmlLang,
  isLocale,
  localizedPath,
  otherLocale,
  parseLocale,
  pick,
  splitLocalePath,
} from '@meridian/i18n';
import type { AsOf } from '@/lib/clock';
import { withAsOf } from '@/lib/clock';
import { SELF_URL } from '@/lib/links';

export type { Locale };
export {
  DEFAULT_LOCALE,
  LANG_ATTR,
  LOCALES,
  LOCALE_ENDONYM,
  alternatePaths,
  htmlLang,
  isLocale,
  localizedPath,
  otherLocale,
  parseLocale,
  pick,
  splitLocalePath,
};

/**
 * A string in both languages.
 *
 * Structurally the catalog's `LocalizedText`, so `pick` works on either without
 * adaptation and a catalog value can be dropped into a table of console copy if
 * that ever makes sense.
 */
export type Bi = LocalizedText;

export function bi(en: string, es: string): Bi {
  return { en, es };
}

/** `t(UI.thing)` at a call site that already knows its locale. */
export type Translate = (text: Bi) => string;

export function translator(locale: Locale): Translate {
  return (text) => pick(text, locale);
}

/**
 * Substitute `{name}` placeholders.
 *
 * A missing value is left as the literal placeholder rather than rendered as
 * `undefined` or silently dropped. A visible `{count}` on the page is a defect
 * somebody reports; a sentence that quietly lost its number is one nobody does.
 */
export function fill(
  text: Bi,
  locale: Locale,
  values: Readonly<Record<string, string | number>>,
): string {
  return pick(text, locale).replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = values[key];
    return value === undefined ? whole : String(value);
  });
}

/* -------------------------------------------------------------------------- */
/* Counting                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A noun phrase in singular and plural, in both languages.
 *
 * Both forms are supplied per language rather than derived, for the same reason
 * the English-only helper it replaces did: neither language pluralises by rule
 * often enough to trust a rule, and several call sites carry a verb along with
 * the noun — "1 live matter *has*" against "3 live matters *have*", "1 asiento
 * *está*" against "3 asientos *están*". A pluraliser that only knew about the
 * noun would produce an ungrammatical sentence in both languages.
 */
export interface BiCount {
  readonly en: readonly [one: string, many: string];
  readonly es: readonly [one: string, many: string];
}

export function biCount(
  enOne: string,
  enMany: string,
  esOne: string,
  esMany: string,
): BiCount {
  return { en: [enOne, enMany], es: [esOne, esMany] };
}

/** The noun phrase alone, without the number. */
export function plural(locale: Locale, count: number, forms: BiCount): string {
  const [one, many] = forms[locale];
  return count === 1 ? one : many;
}

/** `3 expedientes`, `1 expediente`. */
export function countOf(locale: Locale, count: number, forms: BiCount): string {
  return `${count} ${plural(locale, count, forms)}`;
}

/**
 * A signed day count in words.
 *
 * `days` is `diffDays(asOf, target)`: positive means the target is ahead. Zero
 * is "today" rather than "in 0 days", because a deadline falling today is the
 * one a practitioner most needs to read correctly at a glance.
 *
 * Spanish distinguishes *dentro de* (ahead) from *hace* (behind) with different
 * word order, which is why this is a function per locale rather than a template
 * with a sign.
 */
export function relativeDays(locale: Locale, days: number): string {
  if (locale === 'es') {
    if (days === 0) return 'hoy';
    if (days === 1) return 'mañana';
    if (days === -1) return 'ayer';
    if (days > 0) return `dentro de ${days} días`;
    return `hace ${Math.abs(days)} días`;
  }
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/* -------------------------------------------------------------------------- */
/* Paths                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The internal prefix the default locale is rewritten to.
 *
 * English is unprefixed in public URLs — `/matters` is English and `/es/matters`
 * is Spanish — but Next.js needs a concrete `[locale]` segment to route on, so
 * `middleware.ts` rewrites `/matters` to `/en/matters` internally. The address
 * bar never shows it and no `href` in this application ever produces it.
 *
 * It has to be named here anyway, because `usePathname()` under a middleware
 * rewrite is not guaranteed to report the public path rather than the rewritten
 * one, and the two components that read it — the navigation and the language
 * switcher — must not care which they got.
 */
const INTERNAL_DEFAULT_PREFIX = `/${DEFAULT_LOCALE}`;

/**
 * The public path, whichever form the router handed over.
 *
 * Strips the internal rewrite prefix if it is present. This is safe precisely
 * because `/en/...` is never a public URL of this application: the middleware
 * would rewrite a literal request for `/en/matters` to `/en/en/matters`, which
 * routes nowhere. So a leading `/en` can only be the rewrite, never a reader's
 * address.
 */
export function publicPath(pathname: string | null | undefined): string {
  const raw = typeof pathname === 'string' && pathname.length > 0 ? pathname : '/';
  if (raw === INTERNAL_DEFAULT_PREFIX) return '/';
  if (raw.startsWith(`${INTERNAL_DEFAULT_PREFIX}/`)) {
    return raw.slice(INTERNAL_DEFAULT_PREFIX.length);
  }
  return raw;
}

/**
 * The locale being served, read from the header `middleware.ts` attaches.
 *
 * For the root layout and the not-found page, which have no route params: Next
 * resolves both against the root of the tree, so neither can see the `[locale]`
 * segment even though the URL has one. Every other server component takes the
 * locale from its own params and must go on doing so — this is not a general
 * accessor, it is the one available answer in the two places params are absent.
 *
 * Falls back to the default locale rather than throwing. The header is always
 * set for a request that went through the middleware, but a page rendered
 * outside that path — a framework-internal error boundary, a future route the
 * matcher does not cover — should render in some language rather than fail.
 */
export function servedLocale(headerValue: string | null | undefined): Locale {
  return parseLocale(headerValue) ?? DEFAULT_LOCALE;
}

/**
 * The link builder every page uses.
 *
 * Two things travel with a link in this console and both have to survive every
 * navigation: the locale, and the as-at override. Dropping the first sends a
 * Spanish reader into an English page; dropping the second silently snaps a
 * caseload rendered as at 2025-04-02 back to today, which is the single most
 * confusing thing a time-travelling console can do.
 *
 * Takes a **locale-free** path — `/matters`, `/catalog/es-nat-residence` — and
 * returns a public URL. Passing an already-localised path is harmless;
 * `localizedPath` is idempotent.
 */
export function linker(locale: Locale, asOf: AsOf): (path: string) => string {
  return (path) => withAsOf(localizedPath(path, locale), asOf);
}

/**
 * `alternates` for a page's metadata: the canonical URL and every `hreflang`.
 *
 * Absolute, because search engines reject relative `hreflang` values, and built
 * from `SELF_URL` because this application knows its own host and
 * `@meridian/i18n` has no business knowing three different ones.
 *
 * Emitted even though `app/robots.ts` disallows this host in full and the root
 * layout sets `noindex`. That is not a contradiction: `hreflang` and `noindex`
 * answer different questions — "which of these documents is the same document
 * in another language" and "should any of them be in an index" — and a client
 * that fetched a page anyway, from a pasted link or an unfurl, should still be
 * able to find the reader's own language.
 */
export function localeAlternates(path: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const alternates = alternatePaths(path);
  const absolute = (value: string): string => new URL(value, SELF_URL).toString();
  return {
    canonical: absolute(alternates[DEFAULT_LOCALE]),
    languages: {
      [LANG_ATTR.en]: absolute(alternates.en),
      [LANG_ATTR.es]: absolute(alternates.es),
      'x-default': absolute(alternates['x-default']),
    },
  };
}

/**
 * The accessible name of the language switcher, written in the language it
 * switches *to*.
 *
 * A control labelled "Spanish" is useless to the person who needs it, because
 * that person is not reading English. The visible text is the endonym and this
 * is the full sentence a screen reader announces; the endonym is contained in
 * it, which is what keeps the visible label and the accessible name in
 * agreement.
 */
export const LOCALE_SWITCH_LABEL: Readonly<Record<Locale, string>> = {
  en: 'View this page in English',
  es: 'Ver esta página en español',
};

/* -------------------------------------------------------------------------- */
/* Console copy                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Every sentence this console writes about itself.
 *
 * Grouped by screen, in the order a reader meets them. Where a string states a
 * limitation — that nothing is provisioned, that no record has been signed off,
 * that a check has not run — the Spanish is written to be exactly as
 * unflattering as the English. A softened translation of an honest English
 * sentence is a lie told in one language only, and the reader who gets it is the
 * one who cannot check the other half.
 */
export const UI = {
  /* ---------------------------------------------------------------- shell */

  consoleName: bi('Meridian firm console', 'Consola de despacho de Meridian'),
  consoleDescription: bi(
    'Caseload, representative standing, catalog review and integration status for a licensed practice.',
    'Cartera de expedientes, situación de los representantes, revisión del catálogo y estado de las integraciones para un despacho habilitado.',
  ),
  skipToContent: bi('Skip to main content', 'Saltar al contenido principal'),
  navLabel: bi('Console sections', 'Secciones de la consola'),
  languageLabel: bi('Language', 'Idioma'),
  themeLabel: bi('Theme', 'Tema'),
  themeSystem: bi('System', 'Del sistema'),
  themeLight: bi('Light', 'Claro'),
  themeDark: bi('Dark', 'Oscuro'),

  footerSourceHeading: bi('Record source', 'Origen de los registros'),
  footerStore: bi('Store', 'Almacén'),
  footerStoreValue: bi('in-process ({dataset})', 'en proceso ({dataset})'),
  footerTenant: bi('Practice', 'Despacho'),
  footerMatters: bi('Matters', 'Expedientes'),
  footerRepresentatives: bi('Representatives', 'Representantes'),
  footerAuditEntries: bi('Audit entries', 'Entradas de auditoría'),

  footerDisclosureHeading: bi('Disclosure posture', 'Postura de divulgación'),
  footerDisclosureBody: bi(
    'This console renders for a *{audience}* audience — derived from the tenant kind by `audienceFor`, never hard-coded at a call site. Advice-class output is released here because the reader is the professional, not the protected party. The same output reaching an applicant without a live representative in the right jurisdiction is downgraded to an assessment, and every downgrade is written to the audit trail.',
    'Esta consola se presenta para un público *{audience}* — derivado del tipo de titular por `audienceFor`, nunca fijado a mano en un punto de llamada. Los resultados de clase asesoramiento se entregan aquí porque quien lee es el profesional, no la parte protegida. El mismo resultado, si llega a un solicitante sin representante vigente en la jurisdicción que corresponde, se rebaja a evaluación, y cada rebaja queda escrita en la traza de auditoría.',
  ),

  footerKeyboardHeading: bi('Keyboard', 'Teclado'),
  footerFilterShortcut: bi(
    'Focus the filter on this page',
    'Enfocar el filtro de esta página',
  ),

  /* --------------------------------------------------------------- routes */

  routeCaseload: bi('Caseload', 'Cartera'),
  routeCaseloadDescription: bi(
    'Distribution, blockers, and what runs out soonest.',
    'Distribución, bloqueos y lo que vence antes.',
  ),
  routeMatters: bi('Matters', 'Expedientes'),
  routeMattersDescription: bi(
    'Every file, filterable by phase, status, jurisdiction and representative.',
    'Todos los expedientes, filtrables por fase, estado, jurisdicción y representante.',
  ),
  routeRepresentatives: bi('Representatives', 'Representantes'),
  routeRepresentativesDescription: bi(
    'Standing, expiry, and which matters each credential is gating.',
    'Situación, caducidad y qué expedientes ampara cada credencial.',
  ),
  routeCatalog: bi('Catalog review', 'Revisión del catálogo'),
  routeCatalogDescription: bi(
    'The review queue between the rules engine and the product.',
    'La cola de revisión entre el motor de normas y el producto.',
  ),
  routeIntegrations: bi('Integrations', 'Integraciones'),
  routeIntegrationsDescription: bi(
    'Government adapter capability, honestly stated.',
    'Las capacidades de los adaptadores con la administración, dichas sin adornos.',
  ),
  routeAudit: bi('Audit', 'Auditoría'),
  routeAuditDescription: bi(
    'The append-only trail, including every disclosure downgrade.',
    'La traza de solo anexión, incluida cada rebaja de divulgación.',
  ),

  /* ----------------------------------------------------------- page header */

  asAt: bi('As at', 'A fecha de'),
  apply: bi('Apply', 'Aplicar'),
  today: bi('Today', 'Hoy'),
  asOfRejectedTitle: bi('As-at date ignored', 'Fecha de referencia ignorada'),
  asOfRejectedBody: bi(
    '`{raw}` from the {source} is not a valid civil date, so this page is rendered as at {today}. It was rejected rather than repaired: a typo that quietly falls back to today produces a page that looks right and answers a different question.',
    '`{raw}`, procedente de {source}, no es una fecha civil válida, así que esta página se presenta a fecha de {today}. Se ha rechazado en lugar de corregirla: una errata que vuelve en silencio a la fecha de hoy produce una página que parece correcta y responde a otra pregunta.',
  ),
  asOfSourceUrl: bi('URL', 'la dirección'),
  asOfSourceEnvironment: bi('environment', 'el entorno'),
  asOfOverriddenTitle: bi(
    'Rendered as at {date}, not {today}',
    'Presentado a fecha de {date}, no de {today}',
  ),
  asOfOverriddenBody: bi(
    'Every figure below — day counts, citation staleness, licence expiry, pathway status — is computed against {date}. Rules that opened or closed between the two dates are resolved as they stood on {date}, which is how a decision taken before a repeal can still be explained.',
    'Todas las cifras que siguen —cómputo de días, antigüedad de las citas, caducidad de licencias, situación de las vías— se calculan frente a {date}. Las normas que se abrieron o se cerraron entre ambas fechas se resuelven tal y como estaban el {date}, que es lo que permite explicar una decisión tomada antes de una derogación.',
  ),

  /* -------------------------------------------------------------- badges */

  stalenessWithAge: bi('{band} · {days}d', '{band} · {days} d'),
  stalenessVerifiedLater: bi('Verified {days}d later', 'Verificada {days} d después'),
  stalenessVerifiedLaterTitle: bi(
    'The reference date precedes the verification date.',
    'La fecha de referencia es anterior a la fecha de verificación.',
  ),
  stalenessBandTitle: bi(
    'Verified within 90 days is fresh, 91–180 aging, over 180 stale.',
    'Verificada en 90 días o menos es reciente; de 91 a 180, envejeciendo; más de 180, obsoleta.',
  ),

  /* ------------------------------------------------------------- not found */

  notFoundTitle: bi('Not found', 'No encontrado'),
  notFoundBody: bi(
    'No record answers to that address. A matter reference or catalog pathway id that used to work may have been retired — the caseload and the review queue both surface records whose target no longer resolves rather than hiding them.',
    'Ningún registro responde a esa dirección. Puede que se haya retirado una referencia de expediente o un identificador de vía del catálogo que antes funcionaba: tanto la cartera como la cola de revisión muestran los registros cuyo destino ya no resuelve, en lugar de ocultarlos.',
  ),
  notFoundSections: bi('Console sections', 'Secciones de la consola'),
  notFoundWhereInstead: bi('Where to go instead', 'A dónde ir en su lugar'),

  /* -------------------------------------------------------------- caseload */

  caseloadTitle: bi('Caseload', 'Cartera de expedientes'),
  caseloadDescription: bi(
    '{matters} on the books, {live} still running. Every figure below is counted from the records as at {date}; nothing is cached and nothing is stored pre-computed.',
    '{matters} en los libros, {live} todavía en curso. Todas las cifras que siguen se cuentan sobre los registros a fecha de {date}; nada está en caché ni almacenado ya calculado.',
  ),
  caseloadEmptyTitle: bi('No matters have been opened.', 'No se ha abierto ningún expediente.'),
  caseloadEmptyBody: bi(
    'This tenant has {representatives} on the roster and no files. The caseload views stay empty until a matter exists — they do not fill with examples.',
    'Este despacho tiene {representatives} en la lista y ningún expediente. Las vistas de la cartera siguen vacías hasta que exista un expediente: no se rellenan con ejemplos.',
  ),
  caseloadEmptyElsewhereBefore: bi('The ', 'La '),
  caseloadEmptyReviewQueue: bi('catalog review queue', 'cola de revisión del catálogo'),
  caseloadEmptyElsewhereMiddle: bi(' and the ', ' y el '),
  caseloadEmptyStatusBoard: bi('integration status board', 'panel de estado de las integraciones'),
  caseloadEmptyElsewhereAfter: bi(
    ' are populated regardless, because both describe the platform rather than the caseload.',
    ' se rellenan igualmente, porque ambos describen la plataforma y no la cartera.',
  ),

  caseloadLapsedTitle: bi(
    '{credentials} lapsed while still gating live matters',
    'Credenciales caducadas que todavía amparan expedientes en curso: {credentials}',
  ),
  caseloadLapsedExpired: bi('expired', 'caducó el'),
  caseloadLapsedGating: bi('gating', 'ampara'),
  caseloadLapsedBodyBefore: bi(
    'A lapsed standing raises no error anywhere. The advice gate simply stops releasing recommendations through it and downgrades them to assessments, silently and correctly. See the ',
    'Una credencial caducada no provoca ningún error en ninguna parte. El control de asesoramiento sencillamente deja de entregar recomendaciones a su amparo y las rebaja a evaluaciones, en silencio y correctamente. Véase la ',
  ),
  caseloadLapsedRosterLink: bi('representative roster', 'lista de representantes'),

  caseloadDowngradedTitle: bi(
    'Advice to the applicant is currently refused on {matters}',
    'Ahora mismo se rechaza el asesoramiento al solicitante en {matters}',
  ),

  caseloadUnaccountableTitle: bi(
    'Matters with nobody accountable',
    'Expedientes sin nadie que responda',
  ),
  caseloadUnrepresented: bi(
    '{matters} no representative assigned: {list}.',
    '{matters} sin representante asignado: {list}.',
  ),
  caseloadDangling: bi(
    '{matters} a representative who is not on the roster: {list}.',
    '{matters} a un representante que no está en la lista: {list}.',
  ),

  caseloadTimeCriticalTitle: bi('Time-critical', 'Urgente por fecha'),
  caseloadTimeCriticalCount: bi(
    '{urgent} at or past the line · {approaching} approaching',
    '{urgent} en la línea o pasada · {approaching} acercándose',
  ),
  caseloadTimeCriticalNote: bi(
    'Dates set by an authority, by a cited acceptance rule, or by someone on the file. The bands — {critical} days and {approaching} days — are this console’s triage thresholds, not anybody’s law. Anything already passed sorts to the top, because a missed date is more urgent than an imminent one.',
    'Fechas fijadas por una autoridad, por una regla de aceptación citada o por alguien del expediente. Las bandas —{critical} días y {approaching} días— son los umbrales de triaje de esta consola, no la norma de nadie. Lo ya vencido se ordena arriba, porque una fecha incumplida es más urgente que una inminente.',
  ),
  caseloadNothingCritical: bi(
    'Nothing is inside the critical window.',
    'Nada está dentro de la ventana crítica.',
  ),
  caseloadApproachingBody: bi(
    '{deadlines} between {from} and {to} days out; each appears on its own matter.',
    'Hay {deadlines} a entre {from} y {to} días vista; cada uno aparece en su propio expediente.',
  ),
  caseloadNothingInTwoWeeks: bi(
    'No dated obligation on any live matter falls inside the next two weeks.',
    'Ninguna obligación con fecha en un expediente en curso cae dentro de las próximas dos semanas.',
  ),
  caseloadDeadlineCaption: bi(
    'Deadlines at or inside {critical} days of {date}, plus anything already passed. Soonest first.',
    'Vencimientos a {critical} días o menos de {date}, más todo lo ya pasado. Primero lo más próximo.',
  ),

  caseloadBlockedTitle: bi('Blocked, and on whom', 'Bloqueado, y por quién'),
  caseloadBlockedCount: bi(
    '{blockers} across {live} live matters',
    '{blockers} repartidos entre {live} expedientes en curso',
  ),
  colDate: bi('Date', 'Fecha'),
  colWhat: bi('What', 'Qué'),
  colTotal: bi('Total', 'Total'),
  caseloadShare: bi('Share', 'Proporción'),
  caseloadBlockedSince: bi('File last moved', 'El expediente se movió por última vez'),
  caseloadBlockedBlocker: bi('Blocker', 'Bloqueo'),
  caseloadNoStateChange: bi(
    'no state change recorded',
    'sin cambio de estado registrado',
  ),
  caseloadBlockedNote: bi(
    'Grouped by who has to move. A file can be blocked on more than one party at once, and each is listed separately rather than collapsed into a single status.',
    'Agrupado por quién tiene que moverse. Un expediente puede estar bloqueado por más de una parte a la vez, y cada una se lista por separado en lugar de refundirlas en un solo estado.',
  ),
  caseloadNothingBlocked: bi('Nothing is blocked.', 'No hay nada bloqueado.'),
  caseloadNothingBlockedBody: bi(
    'Every live matter has an owner who can act and no outstanding defect.',
    'Todo expediente en curso tiene a alguien que puede actuar y ningún defecto pendiente.',
  ),

  caseloadDistributionTitle: bi('By phase and status', 'Por fase y estado'),
  caseloadDistributionCount: bi(
    '{total} total · {live} live · {closed} closed',
    '{total} en total · {live} en curso · {closed} cerrados',
  ),
  caseloadDistributionNote: bi(
    'Every phase is listed, including the empty ones — an empty phase means nothing is at that stage, which is information. Only statuses that actually occur get a column.',
    'Se listan todas las fases, incluidas las vacías: una fase vacía significa que no hay nada en ese punto, y eso es información. Solo tienen columna los estados que realmente se dan.',
  ),
  caseloadDistributionCaption: bi(
    'Phase order is the sequential model in `@meridian/core`: work in a later phase stays locked while an earlier one is incomplete.',
    'El orden de las fases es el modelo secuencial de `@meridian/core`: el trabajo de una fase posterior sigue bloqueado mientras una anterior esté incompleta.',
  ),
  caseloadAllPhases: bi('All phases', 'Todas las fases'),
  caseloadPhaseShare: bi('{phase} matters', 'expedientes en {phase}'),
  barOfTotal: bi('{value} of {total}', '{value} de {total}'),

  caseloadWorkTitle: bi('Work in hand', 'Trabajo en curso'),
  caseloadWorkCount: bi('{count} actionable', '{count} accionables'),
  caseloadWorkNote: bi(
    "Counted after the phase gate and the dependency graph have been resolved, so 'available' means genuinely startable now rather than merely unfinished. Terminal matters are excluded.",
    'Contado después de resolver la puerta de fase y el grafo de dependencias, de modo que «disponible» significa que se puede empezar de verdad ahora y no meramente que está sin terminar. Los expedientes terminales quedan fuera.',
  ),
  caseloadNoTasks: bi(
    'No tasks on any live matter.',
    'No hay tareas en ningún expediente en curso.',
  ),
  caseloadAvailable: bi('Available', 'Disponibles'),
  caseloadInProgress: bi('In progress', 'En curso'),
  caseloadStillLocked: bi('Still locked', 'Aún bloqueadas'),

  caseloadDependencyTitle: bi(
    'What the caseload rests on',
    'En qué se apoya la cartera',
  ),
  caseloadDependencyCount: bi('{count} in the catalog', '{count} del catálogo'),
  caseloadDependencyNote: bi(
    'Live matters grouped by the catalog record they are assessed against. A record nobody has signed off can still produce an assessment — the applicant’s own figures measured against the cited rule — but it can never appear in a recommendation.',
    'Expedientes en curso agrupados por el registro del catálogo frente al que se evalúan. Un registro que nadie ha firmado todavía puede producir una evaluación —las cifras del propio solicitante medidas frente a la norma citada— pero nunca puede aparecer en una recomendación.',
  ),
  caseloadOpenReviewQueue: bi('Open the review queue', 'Abrir la cola de revisión'),
  caseloadUnreviewedTitle: bi(
    '{matters} on catalog records nobody has signed off',
    '{matters} sobre registros del catálogo que nadie ha firmado',
  ),
  caseloadUnreviewedBody: bi(
    'This is the bottleneck, not a warning to dismiss. Until a licensed person reads a record and their name is on it, the engine will not rank it, whatever it computes.',
    'Este es el cuello de botella, no un aviso que descartar. Mientras una persona habilitada no lea un registro y su nombre no figure en él, el motor no lo clasificará, calcule lo que calcule.',
  ),
  caseloadNotInCatalog: bi(
    'Not in the catalog. No criteria or citations can be resolved for it.',
    'No está en el catálogo. No se puede resolver ningún criterio ni ninguna cita para él.',
  ),
  caseloadUnresolvable: bi('Unresolvable', 'Sin resolver'),
  caseloadClosedToNew: bi('Closed to new applications', 'Cerrada a nuevas solicitudes'),

  caseloadPhaseLegendTitle: bi('Phase model', 'Modelo de fases'),
  caseloadPhaseLegendNote: bi(
    'The sequential model every matter moves through. The ordering is what makes task unlocking meaningful: a task in a later phase stays locked while earlier work is outstanding.',
    'El modelo secuencial por el que pasa todo expediente. El orden es lo que da sentido al desbloqueo de tareas: una tarea de una fase posterior sigue bloqueada mientras quede trabajo anterior pendiente.',
  ),

  /* -------------------------------------------------------------- blockers */

  blockerAwaitingApplicant: bi(
    'Waiting on the applicant.',
    'A la espera del solicitante.',
  ),
  blockerAwaitingAuthority: bi(
    'Waiting on the authority. The clock is outside the firm’s control.',
    'A la espera de la autoridad. El reloj está fuera del control del despacho.',
  ),
  blockerAwaitingReview: bi(
    'Waiting on a licensed human to review before anything leaves the platform.',
    'A la espera de que una persona habilitada revise antes de que nada salga de la plataforma.',
  ),
  blockerDraft: bi(
    'Opened as a draft and not yet started.',
    'Abierto como borrador y todavía sin empezar.',
  ),
  blockerStatusDetail: bi(
    'Status is {status}, phase {phase}.',
    'El estado es {status} y la fase, {phase}.',
  ),
  blockerNoRepresentative: bi(
    'No representative is accountable for this matter.',
    'Ningún representante responde de este expediente.',
  ),
  blockerNoRepresentativeDetail: bi(
    'With nobody attached, `canRelease` downgrades every advice-class output on this file to assessment. The applicant sees their figures and the rule, never a recommendation.',
    'Sin nadie vinculado, `canRelease` rebaja a evaluación todo resultado de clase asesoramiento de este expediente. El solicitante ve sus cifras y la norma, nunca una recomendación.',
  ),
  blockerNotOnRoster: bi(
    'Assigned representative {id} is not on the roster.',
    'El representante asignado {id} no está en la lista.',
  ),
  blockerNotOnRosterDetail: bi(
    'A dangling assignment is not the same as an unassigned matter: the file looks covered and is not.',
    'Una asignación colgando no es lo mismo que un expediente sin asignar: el expediente parece cubierto y no lo está.',
  ),
  blockerAdviceDowngraded: bi(
    'The accountable credential does not currently authorise advice on this file.',
    'La credencial responsable no habilita ahora mismo el asesoramiento en este expediente.',
  ),
  blockerAdviceDowngradedDetail: bi(
    'The advice gate refuses release to the applicant through this standing. See the representative roster for the gate’s own reason.',
    'El control de asesoramiento rechaza la entrega al solicitante a través de esta credencial. El motivo del propio control está en la lista de representantes.',
  ),
  blockerPathwayMissing: bi(
    'Pathway {id} is not in the catalog.',
    'La vía {id} no está en el catálogo.',
  ),
  blockerPathwayMissingDetail: bi(
    'No criteria, citations or durations can be resolved for this file. It cannot be assessed until it is re-pointed at a catalog record.',
    'No se puede resolver ningún criterio, cita ni duración para este expediente. No puede evaluarse hasta que se reapunte a un registro del catálogo.',
  ),
  blockerPathwayClosed: bi(
    'The route is closed to new applications as at {date}.',
    'La vía está cerrada a nuevas solicitudes a fecha de {date}.',
  ),
  blockerPathwayClosedDetail: bi(
    'A closed route does not make an existing holder’s status invalid, but a renewal or a transition has to be planned against a different record.',
    'Una vía cerrada no invalida la situación de quien ya la tiene, pero una renovación o una transición hay que planificarla contra otro registro.',
  ),
  blockerCycle: bi(
    'Task dependencies form a cycle; nothing in it can ever unlock.',
    'Las dependencias entre tareas forman un ciclo; nada dentro de él puede desbloquearse jamás.',
  ),
  blockerCycleDetail: bi('Cycle: {cycle}.', 'Ciclo: {cycle}.'),

  /* ------------------------------------------------------------- deadlines */

  deadlineAuthorisationLabel: bi(
    'Current authorisation expires',
    'Caduca la autorización vigente',
  ),
  deadlineAuthorisationDetail: bi(
    'Permission to remain in {jurisdiction} lapses on this date.',
    'El permiso de permanencia en {jurisdiction} decae en esta fecha.',
  ),
  deadlineSubmissionLabel: bi('Planned filing date', 'Fecha de presentación prevista'),
  deadlineSubmissionDetail: bi(
    'Every freshness projection on this file is measured to this date.',
    'Toda proyección de vigencia de este expediente se mide hasta esta fecha.',
  ),
  deadlineWindowLabel: bi(
    '{document} acceptance window closes',
    'Se cierra la ventana de aceptación: {document}',
  ),
  deadlineExpiryLabel: bi('{document} expires', 'Caduca: {document}'),
  deadlineDocumentDetail: bi(
    'Document {id}, issued by {country}.',
    'Documento {id}, expedido por {country}.',
  ),
  deadlineTaskDetail: bi(
    'Assigned to the {assignee}; task is {status}.',
    'Asignada a: {assignee}. La tarea está {status}.',
  ),
  deadlineCredentialLabel: bi(
    '{name} — standing in {jurisdiction}',
    '{name} — habilitación en {jurisdiction}',
  ),
  deadlineCredentialDetail: bi(
    'Gating {matters} in {jurisdiction}. Once lapsed, advice through this standing is refused and downgraded to assessment.',
    'Ampara {matters} en {jurisdiction}. Una vez caducada, el asesoramiento a su amparo se rechaza y se rebaja a evaluación.',
  ),

  /* -------------------------------------------------------- sign-off checks */

  checkNotAlreadyReviewed: bi(
    'Record is not already signed off',
    'El registro no está ya firmado',
  ),
  checkAlreadyReviewedDetail: bi(
    'Already `counsel_reviewed` by {reviewer} on {date}.',
    'Ya está `counsel_reviewed` por {reviewer} el {date}.',
  ),
  checkCurrentStatusDetail: bi(
    'Current review status is `{status}`.',
    'La situación de revisión actual es `{status}`.',
  ),
  checkUnnamedReviewer: bi('an unnamed reviewer', 'una persona sin nombrar'),
  checkReviewerNamed: bi(
    'A named reviewer is attached',
    'Hay una persona nombrada como revisora',
  ),
  checkReviewerNamedDetail: bi(
    'Sign-off would be attributed to {reviewer}.',
    'La firma se atribuiría a {reviewer}.',
  ),
  checkNoReviewerDetail: bi(
    'The schema rejects `counsel_reviewed` without both `reviewedBy` and `reviewedOn` — an unattributed review is not a review.',
    'El esquema rechaza `counsel_reviewed` sin `reviewedBy` y `reviewedOn` a la vez: una revisión sin atribuir no es una revisión.',
  ),
  checkNoStaleCitations: bi('No citation is stale', 'Ninguna cita está obsoleta'),
  checkNoStaleDetail: bi(
    'All {count} citations were verified within the last 180 days as at {date}.',
    'Las {count} citas se verificaron en los últimos 180 días a fecha de {date}.',
  ),
  checkStaleDetail: bi(
    '{ids} must be re-read against the source first.',
    'Hay que releer {ids} contra la fuente primero.',
  ),
  checkPassesLinter: bi(
    'Record passes the catalog linter today',
    'El registro pasa hoy el verificador del catálogo',
  ),
  checkNoErrorsDetail: bi(
    'No error-severity integrity issues against this record.',
    'Ningún problema de integridad de gravedad error contra este registro.',
  ),
  checkErrorsDetail: bi(
    '{issues} must be cleared first.',
    'Hay que resolver antes {issues}.',
  ),
  checkCandidateValidates: bi(
    'Signed-off record would validate',
    'El registro firmado validaría',
  ),
  checkCandidateNoReviewer: bi(
    'Cannot be evaluated until a reviewer is named.',
    'No puede evaluarse hasta que se nombre a quien revisa.',
  ),
  checkCandidateOkDetail: bi(
    'The catalog validates with this record marked `counsel_reviewed`.',
    'El catálogo valida con este registro marcado como `counsel_reviewed`.',
  ),

  /* --------------------------------------------------------------- matters */

  mattersTitle: bi('Matters', 'Expedientes'),
  mattersDescriptionFiltered: bi(
    '{shown} the current filter, out of {total} on the books.',
    '{shown} con el filtro actual, de {total} en los libros.',
  ),
  mattersDescriptionAll: bi('{total} on the books.', '{total} en los libros.'),
  filterSearch: bi('Search', 'Buscar'),
  mattersSearchPlaceholder: bi(
    'reference, applicant, pathway',
    'referencia, solicitante, vía',
  ),
  filterAny: bi('Any', 'Cualquiera'),
  filterState: bi('State', 'Situación'),
  filterStateLive: bi('Live', 'En curso'),
  filterStateClosed: bi('Closed', 'Cerrados'),
  filterPhase: bi('Phase', 'Fase'),
  filterStatus: bi('Status', 'Estado'),
  filterJurisdiction: bi('Jurisdiction', 'Jurisdicción'),
  filterRepresentative: bi('Representative', 'Representante'),
  filterUnassigned: bi('Unassigned', 'Sin asignar'),
  filterApply: bi('Filter', 'Filtrar'),
  filterClear: bi('Clear', 'Limpiar'),

  mattersListTitle: bi('Files', 'Expedientes'),
  mattersListCount: bi('{count} shown', '{count} mostrados'),
  mattersListNote: bi(
    'Ordered by live work first, then by position in the phase model, then by reference. Not ordered by urgency — an ordering the software chose would be a ranking, and ranking is a reserved act.',
    'Ordenado primero por trabajo en curso, después por posición en el modelo de fases y después por referencia. No se ordena por urgencia: un orden elegido por el programa sería una clasificación, y clasificar es un acto reservado.',
  ),
  mattersNoneMatch: bi('No matters match this filter.', 'Ningún expediente coincide con este filtro.'),
  mattersNoneMatchBodyBefore: bi('{total} on the books. ', 'Hay {total} en los libros. '),
  mattersClearFilterLink: bi('Clear the filter', 'Limpiar el filtro'),
  mattersNoneMatchBodyAfter: bi(' to see them.', ' para verlos.'),
  mattersEmptyBody: bi(
    'The list stays empty until a file exists. It does not fill with examples.',
    'La lista sigue vacía hasta que exista un expediente. No se rellena con ejemplos.',
  ),
  mattersCaption: bi(
    'Advice release is evaluated for the *applicant* audience as at {date}, which is the question the practitioner cannot see from the file itself.',
    'La entrega de asesoramiento se evalúa para el público *solicitante* a fecha de {date}, que es la pregunta que el profesional no puede ver desde el propio expediente.',
  ),
  colReference: bi('Reference', 'Referencia'),
  colApplicant: bi('Applicant', 'Solicitante'),
  applicantUnknown: bi('Unknown applicant', 'Solicitante desconocido'),
  colPathway: bi('Pathway', 'Vía'),
  colPhase: bi('Phase', 'Fase'),
  colStatus: bi('Status', 'Estado'),
  colRepresentative: bi('Representative', 'Representante'),
  colAdviceToApplicant: bi('Advice to applicant', 'Asesoramiento al solicitante'),
  mattersApplicantMissing: bi(
    'Applicant {id} is not in the record set.',
    'El solicitante {id} no está en el conjunto de registros.',
  ),
  mattersApplicantDetail: bi(
    '{reference} · claimed {claimed} · holds {held}',
    '{reference} · alega {claimed} · posee {held}',
  ),
  mattersFiledIn: bi('Filed in {jurisdiction}', 'Se presenta en {jurisdiction}'),
  mattersNotOnRoster: bi('Not on roster', 'Fuera de la lista'),
  mattersClosed: bi('Matter closed', 'Expediente cerrado'),
  released: bi('Released', 'Entregado'),
  downgradedTo: bi('Downgraded to {class}', 'Rebajado a {class}'),

  /* ---------------------------------------------------------- matter detail */

  matterNotFound: bi('Matter not found', 'Expediente no encontrado'),
  matterDescription: bi(
    '{title}. Opened {opened}{closed}. Filed in {jurisdiction} under `{pathway}`.',
    '{title}. Abierto el {opened}{closed}. Se presenta en {jurisdiction} por la vía `{pathway}`.',
  ),
  matterClosedOn: bi(', closed {date}', ', cerrado el {date}'),
  matterPhaseBadge: bi('Phase {index}/{total} · {phase}', 'Fase {index}/{total} · {phase}'),
  matterTerminal: bi(
    'Terminal — no further automated work',
    'Terminal: no hay más trabajo automatizado',
  ),
  matterPathwayMissingTitle: bi(
    'Pathway {pathway} is not in the catalog',
    'La vía {pathway} no está en el catálogo',
  ),
  matterPathwayMissingBody: bi(
    'No criteria, citations or durations resolve for this file, so nothing on this page can be measured against a rule. The record was either renamed or retired. Re-point the matter at a catalog record before assessing it.',
    'No se resuelve ningún criterio, cita ni duración para este expediente, así que nada de esta página puede medirse frente a una norma. El registro se renombró o se retiró. Reapunte el expediente a un registro del catálogo antes de evaluarlo.',
  ),
  matterRouteClosedTitle: bi(
    'This route was closed to new applications on {date}',
    'Esta vía se cerró a nuevas solicitudes el {date}',
  ),
  matterRouteClosedBody: bi(
    'A closed route does not invalidate an existing holder’s status. Renewals and transitions have to be planned against a different record, which is why the catalog keeps closed pathways rather than deleting them.',
    'Una vía cerrada no invalida la situación de quien ya la tiene. Las renovaciones y las transiciones hay que planificarlas contra otro registro, que es la razón por la que el catálogo conserva las vías cerradas en lugar de borrarlas.',
  ),

  matterFileTitle: bi('File', 'Expediente'),
  matterFileNote: bi(
    'The claimed nationality is stored separately from the nationalities held, because they are legally distinct: a route open to a national of one state is not open to a dual national who entered and holds residence as a national of another.',
    'La nacionalidad alegada se guarda aparte de las nacionalidades que se poseen, porque son jurídicamente distintas: una vía abierta a quien es nacional de un Estado no lo está para quien, teniendo doble nacionalidad, entró y reside como nacional de otro.',
  ),
  matterId: bi('Matter id', 'Identificador del expediente'),
  matterApplicantMissing: bi(
    '{id} is not in the record set',
    '{id} no está en el conjunto de registros',
  ),
  matterHolds: bi('Holds {list}', 'Posee {list}'),
  matterNoDob: bi('; date of birth not recorded', '; sin fecha de nacimiento registrada'),
  matterBorn: bi('; born {date}', '; nacido el {date}'),
  matterClaimedNationality: bi('Claimed nationality', 'Nacionalidad alegada'),
  matterTargetJurisdiction: bi('Target jurisdiction', 'Jurisdicción de destino'),
  matterReceivingRegion: bi('Receiving region', 'Región receptora'),
  matterNotSubNational: bi('Not sub-national', 'No es subestatal'),
  matterUnassignedNobody: bi(
    'Unassigned — nobody is accountable',
    'Sin asignar: nadie responde',
  ),
  matterRepNotOnRoster: bi('{id} is not on the roster', '{id} no está en la lista'),
  matterCurrentAuthorisation: bi('Current authorisation', 'Autorización vigente'),
  matterNotEstablished: bi('Not established', 'Sin establecer'),
  matterPlannedFiling: bi('Planned filing', 'Presentación prevista'),
  matterNoFilingDate: bi(
    'Not set — freshness is projected to {date} instead, which speaks only to today',
    'Sin fijar: la vigencia se proyecta a {date} en su lugar, lo que solo habla del día de hoy',
  ),
  matterDocumentLanguage: bi('Document language', 'Idioma de los documentos'),

  matterDisclosureTitle: bi(
    'Advice boundary on this file',
    'La frontera del asesoramiento en este expediente',
  ),
  matterDisclosureNote: bi(
    'The real gate, run against this matter’s own representative and jurisdiction as at {date}. Information and assessment are releasable to everyone everywhere; only advice — a recommendation, a ranking, or a prediction of outcome — is gated.',
    'El control real, ejecutado contra el representante y la jurisdicción de este expediente a fecha de {date}. La información y la evaluación se pueden entregar a cualquiera y en cualquier lugar; solo el asesoramiento —una recomendación, una clasificación o una previsión de resultado— pasa por el control.',
  ),
  colAudience: bi('Audience', 'Público'),
  colAdvice: bi('Advice', 'Asesoramiento'),
  colGateReason: bi('Gate’s reason', 'Motivo del control'),
  matterGateProfessional: bi(
    'This audience is the professional, not the protected party.',
    'Este público es el profesional, no la parte protegida.',
  ),
  matterGateLiveRepresentative: bi(
    'A live representative authorised in this jurisdiction is attached.',
    'Hay un representante vigente y habilitado en esta jurisdicción vinculado al expediente.',
  ),

  matterPhaseTitle: bi('Phase machine', 'Máquina de fases'),
  matterPhaseCount: bi('{index} of {total}', '{index} de {total}'),
  matterPhaseNote: bi(
    'Phases are ordered and gating: a task in a later phase stays locked while an earlier phase has incomplete work. Completed phases are marked in text as well as in colour.',
    'Las fases están ordenadas y actúan como puerta: una tarea de una fase posterior sigue bloqueada mientras una fase anterior tenga trabajo sin terminar. Las fases completadas se marcan con texto además de con color.',
  ),
  matterPhasePassed: bi('passed', 'superada'),
  matterPhaseCurrent: bi('current', 'actual'),
  matterPhaseAhead: bi('ahead', 'por delante'),

  matterTasksTitle: bi('Task graph', 'Grafo de tareas'),
  matterTasksCount: bi('{tasks} · {cycles} cycles', '{tasks} · {cycles} ciclos'),
  matterTasksNote: bi(
    'Statuses shown after the phase gate and the dependency graph have been resolved. A task listed as available is genuinely startable now.',
    'Los estados se muestran una vez resueltos la puerta de fase y el grafo de dependencias. Una tarea que figura como disponible se puede empezar de verdad ahora.',
  ),
  matterCycleTitle: bi('Dependency cycle detected', 'Ciclo de dependencias detectado'),
  matterCycleBody: bi(
    'Nothing inside a cycle can ever unlock. {cycles}.',
    'Nada dentro de un ciclo puede desbloquearse jamás. {cycles}.',
  ),
  matterNoTasks: bi(
    'No tasks have been generated for this matter.',
    'No se ha generado ninguna tarea para este expediente.',
  ),
  colTask: bi('Task', 'Tarea'),
  colOwner: bi('Owner', 'Responsable'),
  colDue: bi('Due', 'Vence'),
  colDependsOn: bi('Depends on', 'Depende de'),
  colCites: bi('Cites', 'Cita'),
  matterNoCitationTitle: bi(
    'A firm-internal step with no legal rule behind it.',
    'Un paso interno del despacho sin norma jurídica detrás.',
  ),
  matterNoCitation: bi('none', 'ninguna'),

  matterDocumentsTitle: bi('Documents', 'Documentos'),
  matterDocumentsCount: bi('{present} of {held} in the folder', '{present} de {held} en la carpeta'),
  matterDocumentsNote: bi(
    'Legalisation and translation routing come from `@meridian/documents`. Freshness is projected to {date}, not to today — a certificate that is current now and out of its window on filing day passes every check except the one that matters.',
    'El encaminamiento de legalización y traducción procede de `@meridian/documents`. La vigencia se proyecta a {date}, no al día de hoy: un certificado que hoy está en plazo y fuera de su ventana el día de la presentación pasa todas las comprobaciones menos la que importa.',
  ),
  matterDocumentsNoFilingDate: bi(
    '{date} because no filing date is set',
    '{date}, porque no hay fecha de presentación fijada',
  ),
  matterFreshnessUnknownTitle: bi(
    '{documents} no acceptance window in the catalog',
    '{documents} sin ventana de aceptación en el catálogo',
  ),
  matterFreshnessUnknownBody: bi(
    'Unchecked is not the same as acceptable. These are reported separately rather than counted as fine.',
    'Sin comprobar no es lo mismo que aceptable. Estos se informan aparte en lugar de contarse como correctos.',
  ),
  matterNoDocuments: bi(
    'No documents are recorded on this matter.',
    'No hay documentos registrados en este expediente.',
  ),
  colDocument: bi('Document', 'Documento'),
  colIssued: bi('Issued', 'Expedido'),
  colLegalisation: bi('Legalisation', 'Legalización'),
  colTranslation: bi('Translation', 'Traducción'),
  colOnFilingDay: bi('On filing day', 'El día de la presentación'),
  matterDocumentDetail: bi(
    '`{id}` · issued by {country} · in {language}',
    '`{id}` · expedido por {country} · en {language}',
  ),
  matterNoPrintedExpiry: bi('no printed expiry', 'sin caducidad impresa'),
  matterExpires: bi('expires {date}', 'caduca el {date}'),
  matterDone: bi('done', 'hecho'),
  matterOutstanding: bi('outstanding', 'pendiente'),
  matterTranslationRequired: bi('required', 'requerida'),
  matterTranslationNotRequired: bi('not required', 'no requerida'),
  matterTranslationSatisfied: bi('satisfied', 'cumplida'),
  matterReplacementAfter: bi(
    'A replacement must be issued on or after `{date}` to still be inside its window on filing day.',
    'Un documento de sustitución debe expedirse el `{date}` o después para seguir dentro de su ventana el día de la presentación.',
  ),
  matterRoutingConfirmTitle: bi(
    'Routing that a human must confirm',
    'Encaminamientos que una persona debe confirmar',
  ),
  matterRoutingNoneFlagged: bi(
    'Every routing decision on this file came from a catalogued rule. None is flagged for confirmation.',
    'Toda decisión de encaminamiento en este expediente proviene de una norma catalogada. Ninguna está marcada para confirmación.',
  ),
  matterRoutingLegalisation: bi('legalisation route', 'la vía de legalización'),
  matterRoutingAnd: bi(' and ', ' y '),
  matterRoutingTranslation: bi('translation standard', 'el estándar de traducción'),
  matterRoutingNeedsConfirming: bi(
    ' needs confirming before the applicant acts on it.',
    ' necesita confirmación antes de que el solicitante actúe en consecuencia.',
  ),

  matterCatalogTitle: bi('Catalog record', 'Registro del catálogo'),
  matterCatalogCount: bi(
    '{criteria} criteria · {citations} citations',
    '{criteria} criterios · {citations} citas',
  ),
  matterCatalogAction: bi('Open in the review queue', 'Abrir en la cola de revisión'),
  matterCatalogNote: bi(
    'What this file is being measured against, and whether anybody has signed it off.',
    'Frente a qué se mide este expediente, y si alguien lo ha firmado.',
  ),
  fieldPathway: bi('Pathway', 'Vía'),
  fieldVersion: bi('Version', 'Versión'),
  fieldName: bi('Name', 'Nombre'),
  fieldKind: bi('Kind', 'Tipo'),
  fieldReview: bi('Review', 'Revisión'),
  fieldStatusAsAt: bi('Status as at {date}', 'Situación a fecha de {date}'),
  fieldCitationFreshness: bi('Citation freshness', 'Antigüedad de las citas'),

  matterHistoryTitle: bi('Audit trail', 'Traza de auditoría'),
  matterHistoryAction: bi('Open in the full trail', 'Abrir en la traza completa'),
  matterHistoryNote: bi(
    'Oldest first, as a case history reads. Sequence numbers are positions in the whole firm-wide trail, not in this extract — entry 17 is entry 17 everywhere.',
    'De lo más antiguo a lo más reciente, como se lee un historial. Los números de secuencia son posiciones en la traza completa del despacho, no en este extracto: la entrada 17 es la entrada 17 en todas partes.',
  ),
  matterHistoryEmpty: bi(
    'Nothing has been recorded against this matter.',
    'No se ha registrado nada contra este expediente.',
  ),

  /* ------------------------------------------------------- representatives */

  representativesTitle: bi('Representatives', 'Representantes'),
  representativesDescription: bi(
    '{standings} on the roster, {attention} attention as at {date}. Licence validity is decided by `canRelease` in `@meridian/core`, not re-implemented here — if the gate and this page could disagree, the page would be the one lying.',
    '{standings} en la lista, {attention} atención a fecha de {date}. La validez de la licencia la decide `canRelease` en `@meridian/core`; no se reimplementa aquí, porque si el control y esta página pudieran discrepar, sería la página la que mentiría.',
  ),
  representativesEmpty: bi(
    'No representatives are on the roster.',
    'No hay ningún representante en la lista.',
  ),
  representativesEmptyBody: bi(
    'With nobody on the roster, every advice-class output in this tenant is downgraded to an assessment before it reaches an applicant. That is the correct behaviour, not an outage.',
    'Sin nadie en la lista, todo resultado de clase asesoramiento en este despacho se rebaja a evaluación antes de llegar a un solicitante. Ese es el comportamiento correcto, no una avería.',
  ),
  representativesEmptyUnrepresented: bi(
    '{matters} currently open with no accountable representative.',
    '{matters} ahora mismo sin representante que responda.',
  ),
  representativesDowngradedTitle: bi(
    '{matters} having advice refused through the credential attached to the file',
    'En {matters} se rechaza el asesoramiento a través de la credencial vinculada al expediente',
  ),
  representativesDowngradedBody: bi(
    'Each line below is the advice gate’s own reason, verbatim. Nothing on the matter itself will show this — the file looks normal and the client simply stops receiving recommendations.',
    'Cada línea de abajo es el motivo del propio control de asesoramiento, literal. Nada en el expediente lo mostrará: el expediente parece normal y el cliente sencillamente deja de recibir recomendaciones.',
  ),
  rosterTitle: bi('Roster', 'Lista'),
  rosterCount: bi(
    '{count} · ordered by what needs doing',
    '{count} · ordenados por lo que hay que hacer',
  ),
  rosterNote: bi(
    'Renewal lead time is {warning} days and re-verification is due at {due} days, overdue at {overdue}. Those are this firm’s operational thresholds; the re-verification bands deliberately mirror the citation freshness bands in `@meridian/core` so there is one convention for how long a human-checked fact may go unchecked.',
    'El plazo de aviso de renovación es de {warning} días y la nueva verificación vence a los {due} días, y queda vencida a los {overdue}. Son los umbrales operativos de este despacho; las bandas de nueva verificación replican a propósito las bandas de antigüedad de las citas de `@meridian/core`, de modo que haya un solo criterio sobre cuánto puede pasar un hecho comprobado por una persona sin volver a comprobarse.',
  ),
  rosterCredentialNote: bi(
    'A credential name is the standing its own regulator confers, rendered in that regulator’s language and never replaced by a local equivalent. A Spanish colegiación and a Canadian law society licence are different standings, not two names for one thing.',
    'El nombre de una credencial es la habilitación que confiere su propio regulador, presentada en el idioma de ese regulador y nunca sustituida por un equivalente local. Una colegiación española y una licencia de un law society canadiense son habilitaciones distintas, no dos nombres para lo mismo.',
  ),
  colCredential: bi('Credential', 'Credencial'),
  colLicence: bi('Licence', 'Licencia'),
  colLastVerified: bi('Last verified', 'Última verificación'),
  colGating: bi('Gating', 'Ampara'),
  rosterNoExpiryPublished: bi(
    'No expiry published on the register.',
    'El registro no publica caducidad.',
  ),
  rosterUnreadableDate: bi(
    ' — not a readable civil date',
    ' — no es una fecha civil legible',
  ),
  rosterLive: bi('{count} live', '{count} en curso'),
  rosterGatingDetail: bi(
    '{closed} closed · {refusing} refusing advice',
    '{closed} cerrados · {refusing} con el asesoramiento rechazado',
  ),
  rosterRefusedOnMarked: bi(
    'Advice to the applicant is currently refused on the matters marked below.',
    'Ahora mismo se rechaza el asesoramiento al solicitante en los expedientes marcados abajo.',
  ),
  rosterReleasesOnAll: bi(
    'The advice gate releases through this standing on every live matter attached to it.',
    'El control de asesoramiento entrega a través de esta credencial en todos los expedientes en curso vinculados a ella.',
  ),
  fieldRegulator: bi('Regulator', 'Regulador'),
  fieldPublicRegister: bi('Public register', 'Registro público'),
  fieldLicenceNumber: bi('Licence number', 'Número de licencia'),
  fieldAuthorisedIn: bi('Authorised in', 'Habilitado en'),
  fieldVerifiedOn: bi('Verified on', 'Verificado el'),
  fieldExpiresOn: bi('Expires on', 'Caduca el'),
  fieldNotPublished: bi('Not published', 'No publicado'),
  rosterGatedMatters: bi(
    'Matters gated by this credential',
    'Expedientes amparados por esta credencial',
  ),
  rosterNoMattersAttached: bi(
    'No matters are attached to this representative.',
    'No hay expedientes vinculados a este representante.',
  ),
  colMatter: bi('Matter', 'Expediente'),
  colJurisdiction: bi('Jurisdiction', 'Jurisdicción'),
  rosterMatterClosed: bi(
    'Matter closed — no live output to gate',
    'Expediente cerrado: no hay salida en curso que controlar',
  ),
  unattachedTitle: bi(
    'Matters with nobody accountable',
    'Expedientes sin nadie que responda',
  ),
  unattachedCount: bi(
    '{unassigned} unassigned · {dangling} dangling',
    '{unassigned} sin asignar · {dangling} colgando',
  ),
  unattachedNote: bi(
    'Not a roster problem, but the same hole from the other side. An unassigned matter looks unassigned; a matter naming somebody who is not on the roster looks covered and is not.',
    'No es un problema de la lista, sino el mismo agujero visto desde el otro lado. Un expediente sin asignar parece sin asignar; un expediente que nombra a alguien que no está en la lista parece cubierto y no lo está.',
  ),
  unattachedNoMatters: bi(
    'No matters are open, so nothing needs an accountable representative yet.',
    'No hay expedientes abiertos, así que todavía nada necesita un representante que responda.',
  ),
  unattachedAllCovered: bi(
    'Every live matter has an accountable representative on the roster.',
    'Todo expediente en curso tiene en la lista un representante que responde.',
  ),
  colProblem: bi('Problem', 'Problema'),
  unattachedDowngradeDetail: bi(
    'Every advice-class output on this file is downgraded to an assessment before it reaches the applicant.',
    'Todo resultado de clase asesoramiento en este expediente se rebaja a evaluación antes de llegar al solicitante.',
  ),
  unattachedNames: bi(
    'Names {id}, who is not on the roster',
    'Nombra a {id}, que no está en la lista',
  ),
  unattachedDanglingDetail: bi(
    'The gate resolves no credential for this matter, so it behaves exactly like an unassigned file while appearing to be covered.',
    'El control no resuelve ninguna credencial para este expediente, así que se comporta exactamente como uno sin asignar mientras aparenta estar cubierto.',
  ),
  unattachedClosed: bi('closed', 'cerrado'),

  /* --------------------------------------------------------------- catalog */

  catalogTitle: bi('Catalog review', 'Revisión del catálogo'),
  catalogDescription: bi(
    '{records} in the shipped catalog, {reviewed} signed off. An unreviewed record can still produce an assessment — the applicant’s own figures measured against the cited rule — but it can never enter a recommendation, whatever the engine computes.',
    '{records} en el catálogo publicado, {reviewed} firmados. Un registro sin revisar todavía puede producir una evaluación —las cifras del propio solicitante medidas frente a la norma citada— pero nunca puede entrar en una recomendación, calcule lo que calcule el motor.',
  ),
  catalogNoneEligibleTitle: bi(
    'Nothing in this catalog is eligible to be recommended',
    'Nada de este catálogo puede recomendarse',
  ),
  catalogNoneEligibleBody: bi(
    'All {total} records are `unreviewed`, so `recommend()` returns an empty ranking and every output the engine produces for an applicant is capped at assessment. That is the correct live state of the platform, not a defect to route around.',
    'Los {total} registros están `unreviewed`, así que `recommend()` devuelve una clasificación vacía y todo resultado que el motor produce para un solicitante queda limitado a evaluación. Ese es el estado real y correcto de la plataforma, no un defecto que sortear.',
  ),
  catalogErrorsTitle: bi(
    '{errors} across the catalog',
    '{errors} en todo el catálogo',
  ),
  catalogErrorsBody: bi(
    'These fail the same check CI runs. A record carrying one cannot be signed off — the linter refuses it, not this console.',
    'Estos incumplen la misma comprobación que ejecuta la integración continua. Un registro que arrastre uno no puede firmarse: lo rechaza el verificador, no esta consola.',
  ),
  catalogTotalsTitle: bi('Where the catalog stands', 'Cómo está el catálogo'),
  catalogTotalsNote: bi(
    'Counted from the records at render time. Citation counts are per declaration, so an instrument cited by two pathways is two things to re-verify — collapsing them would understate the work.',
    'Contado sobre los registros en el momento de presentar la página. Las citas se cuentan por declaración, de modo que un instrumento citado por dos vías son dos cosas que volver a verificar: refundirlas rebajaría el trabajo real.',
  ),
  colMeasure: bi('Measure', 'Medida'),
  colCount: bi('Count', 'Recuento'),
  colMeaning: bi('Meaning', 'Significado'),
  catalogRowPathways: bi('Pathways', 'Vías'),
  catalogRowPathwaysMeaning: bi(
    'Records in the shipped catalog.',
    'Registros del catálogo publicado.',
  ),
  catalogRowReviewed: bi('Counsel reviewed', 'Revisadas por letrado'),
  catalogRowReviewedMeaning: bi(
    'Eligible to appear in an advice-class recommendation.',
    'Pueden aparecer en una recomendación de clase asesoramiento.',
  ),
  catalogRowUnreviewed: bi('Unreviewed', 'Sin revisar'),
  catalogRowUnreviewedMeaning: bi('Usable for assessment only.', 'Solo sirven para evaluación.'),
  catalogRowNeedsReverification: bi('Needs re-verification', 'Requieren nueva verificación'),
  catalogRowNeedsReverificationMeaning: bi(
    'Previously reviewed against text that has since moved. Treated as unreviewed.',
    'Revisadas antes contra un texto que desde entonces ha cambiado. Se tratan como sin revisar.',
  ),
  catalogRowCitations: bi('Citations', 'Citas'),
  catalogRowCitationsMeaning: bi(
    '{stale} stale, {aging} aging as at {date}.',
    '{stale} obsoletas y {aging} envejeciendo a fecha de {date}.',
  ),
  catalogRowDiscretionary: bi('Discretionary citations', 'Citas discrecionales'),
  catalogRowDiscretionaryMeaning: bi(
    'Administrative practice or a published operational equivalence rather than a bright-line statutory threshold. Must be surfaced to the reader as such.',
    'Práctica administrativa o una equivalencia operativa publicada, y no un umbral legal nítido. Debe mostrarse al lector como tal.',
  ),
  catalogRowStaleRecords: bi('Records with stale citations', 'Registros con citas obsoletas'),
  catalogRowStaleRecordsMeaning: bi(
    'A record resting on text nobody has re-read in 180 days. Marking one counsel_reviewed is refused by the linter until the sources are checked again.',
    'Un registro que se apoya en un texto que nadie ha vuelto a leer en 180 días. El verificador rechaza marcarlo como counsel_reviewed hasta que se comprueben de nuevo las fuentes.',
  ),
  catalogRowErrorRecords: bi(
    'Records with integrity errors',
    'Registros con errores de integridad',
  ),
  catalogRowErrorRecordsMeaning: bi(
    'Cannot be signed off until cleared.',
    'No pueden firmarse hasta que se resuelvan.',
  ),

  catalogQueueTitle: bi('Review queue', 'Cola de revisión'),
  catalogQueueCount: bi('{count} records', '{count} registros'),
  catalogQueueNote: bi(
    "Unreviewed records first, then by how many live matters in this firm's caseload rest on the record. Deliberately not ordered by how close a record is to being signable.",
    'Primero los registros sin revisar y después por cuántos expedientes en curso de este despacho se apoyan en cada registro. A propósito no se ordena por lo cerca que esté un registro de poder firmarse.',
  ),
  catalogEmpty: bi('The catalog is empty.', 'El catálogo está vacío.'),
  colLiveMatters: bi('Live matters', 'Expedientes en curso'),
  colCriteria: bi('Criteria', 'Criterios'),
  colProvenance: bi('Provenance', 'Procedencia'),
  colLinter: bi('Linter', 'Verificador'),
  catalogNotYetOpen: bi('Had not opened on this date.', 'No se había abierto en esta fecha.'),
  catalogBlocking: bi('{count} blocking', '{count} excluyentes'),
  catalogCriteriaDetail: bi(
    '{material} material · {informational} informational',
    '{material} relevantes · {informational} informativos',
  ),
  catalogEscalates: bi(
    'escalates to a human: {escalating} of {total}',
    'escala a una persona: {escalating} de {total}',
  ),
  catalogProvenanceDetail: bi(
    '{cited} cited · {discretionary} discretionary',
    '{cited} citadas · {discretionary} discrecionales',
  ),
  catalogErrorsBadge: bi('{count} errors', '{count} errores'),
  catalogWarningsBadge: bi('{count} warnings', '{count} avisos'),
  catalogClean: bi('Clean', 'Limpio'),

  catalogReverificationTitle: bi(
    'Citations due for re-verification',
    'Citas que toca volver a verificar',
  ),
  catalogReverificationCount: bi('{due} of {total}', '{due} de {total}'),
  catalogReverificationNote: bi(
    'Bands come from `staleness()` in `@meridian/core`: fresh to 90 days, aging to 180, stale beyond. Staleness is an error rather than a warning because immigration rules move at the tempo of Spain repealing its investor route on roughly three months’ notice.',
    'Las bandas vienen de `staleness()` en `@meridian/core`: reciente hasta 90 días, envejeciendo hasta 180 y obsoleta más allá. La obsolescencia es un error y no un aviso porque las normas migratorias se mueven al ritmo de España derogando su vía de inversores con unos tres meses de preaviso.',
  ),
  catalogAllFresh: bi(
    'Every citation in the catalog was verified within the last 90 days.',
    'Todas las citas del catálogo se verificaron en los últimos 90 días.',
  ),
  catalogNothingDue: bi(
    'Nothing is due for re-reading as at {date}.',
    'No hay nada que releer a fecha de {date}.',
  ),
  colCitation: bi('Citation', 'Cita'),
  colInstrument: bi('Instrument', 'Instrumento'),
  colVerified: bi('Verified', 'Verificada'),
  colBand: bi('Band', 'Banda'),
  discretionary: bi('Discretionary', 'Discrecional'),

  catalogLinterTitle: bi('Catalog linter', 'Verificador del catálogo'),
  catalogLinterCount: bi(
    '{errors} errors · {warnings} warnings',
    '{errors} errores · {warnings} avisos',
  ),
  catalogLinterNote: bi(
    'Produced by `validateCatalog` — the same function CI runs, not a re-implementation of its rules. A dangling citation id or a `leadsTo` naming a record that no longer exists evaluates fine and quietly loses its provenance, which is why these are checked rather than trusted.',
    'Lo produce `validateCatalog`, la misma función que ejecuta la integración continua y no una reimplementación de sus reglas. Un identificador de cita colgando o un `leadsTo` que nombra un registro inexistente se evalúa sin problema y pierde su procedencia en silencio, y por eso se comprueban en lugar de darlos por buenos.',
  ),
  catalogLinterClean: bi(
    'The catalog passes every integrity check as at this date.',
    'El catálogo supera todas las comprobaciones de integridad a esta fecha.',
  ),
  colSeverity: bi('Severity', 'Gravedad'),
  colCode: bi('Code', 'Código'),
  colMessage: bi('Message', 'Mensaje'),
  colWhere: bi('Where', 'Dónde'),

  /* --------------------------------------------------------- catalog record */

  pathwayNotFound: bi('Pathway not found', 'Vía no encontrada'),
  catalogRecordClosedTitle: bi(
    'Closed to new applications on {date}',
    'Cerrada a nuevas solicitudes el {date}',
  ),
  catalogRecordUnrecordedDate: bi('an unrecorded date', 'una fecha sin registrar'),
  catalogRecordClosedBody: bi(
    'The record stays in the catalog rather than being deleted, because people hold status under closed routes for years afterwards and a renewal question deserves an answer rather than a 404.',
    'El registro se queda en el catálogo en lugar de borrarse, porque hay personas que mantienen su situación al amparo de vías cerradas durante años después, y una pregunta sobre renovación merece una respuesta y no un 404.',
  ),
  catalogRecordTitle: bi('Record', 'Registro'),
  fieldId: bi('Id', 'Identificador'),
  catalogRecordVersionNote: bi(
    'semver of the rule content, not of the package',
    'versionado semántico del contenido de la norma, no del paquete',
  ),
  fieldOpened: bi('Opened', 'Abierta'),
  fieldClosed: bi('Closed', 'Cerrada'),
  fieldNotRecorded: bi('Not recorded', 'Sin registrar'),
  fieldStillAccepting: bi('Still accepting', 'Sigue aceptando'),
  fieldStoredStatus: bi('Stored status', 'Situación almacenada'),
  catalogRecordAsAt: bi('as at {date}: {status}', 'a fecha de {date}: {status}'),
  fieldReviewedBy: bi('Reviewed by', 'Revisado por'),
  catalogRecordNeverSigned: bi(
    'Nobody. The record has never been signed off.',
    'Nadie. El registro nunca se ha firmado.',
  ),
  catalogRecordReviewedOn: bi('{reviewer} on {date}', '{reviewer} el {date}'),
  fieldLeadsTo: bi('Leads to', 'Conduce a'),
  fieldNothingRecorded: bi('Nothing recorded', 'Nada registrado'),
  catalogRecordOtherHalf: bi(
    'Summary in Spanish',
    'Resumen en inglés',
  ),
  catalogRecordOtherHalfNote: bi(
    'The catalog authors both halves together and a reviewer signs off both. The other half is shown here for that check, not because this page renders two languages.',
    'El catálogo redacta ambas mitades a la vez y quien revisa firma las dos. La otra mitad se muestra aquí para esa comprobación, no porque esta página presente dos idiomas.',
  ),

  signOffTitle: bi('Sign-off', 'Firma de revisión'),
  signOffNote: bi(
    'This panel does not record a review. The catalog is compiled TypeScript in `@meridian/pathways` and this console has no write path into it. What it does is build the record a sign-off would produce and run the real `validateCatalog` over the resulting catalog, so a reviewer can see whether the signature would be accepted before writing it into the source.',
    'Este panel no registra ninguna revisión. El catálogo es TypeScript compilado dentro de `@meridian/pathways` y esta consola no tiene ninguna vía de escritura hacia él. Lo que hace es construir el registro que produciría una firma y ejecutar el `validateCatalog` real sobre el catálogo resultante, para que quien revisa vea si su firma sería aceptada antes de escribirla en el código.',
  ),
  signOffReviewer: bi('Reviewer', 'Quien revisa'),
  signOffReviewerPlaceholder: bi(
    'Name and standing of the licensed reviewer',
    'Nombre y habilitación de quien revisa',
  ),
  signOffCheck: bi('Check this sign-off', 'Comprobar esta firma'),
  signOffMet: bi('Met', 'Cumplido'),
  signOffNotMet: bi('Not met', 'Sin cumplir'),
  signOffNotEvaluated: bi('Not evaluated', 'Sin evaluar'),
  signOffOutcome: bi('Outcome', 'Resultado'),
  signOffWouldValidate: bi(
    'The catalog would validate with this sign-off applied.',
    'El catálogo validaría con esta firma aplicada.',
  ),
  signOffTranscribe: bi(
    'Transcribe the following onto the record in `packages/pathways/src/catalog/` and ship it. Nothing here has been written anywhere.',
    'Transcriba lo siguiente al registro en `packages/pathways/src/catalog/` y publíquelo. Nada de esto se ha escrito en ninguna parte.',
  ),
  signOffWouldNotBeAccepted: bi(
    'This sign-off would not be accepted yet.',
    'Esta firma todavía no sería aceptada.',
  ),
  signOffClearUnmet: bi(
    'Clear the unmet checks above first.',
    'Resuelva antes las comprobaciones sin cumplir de arriba.',
  ),

  criteriaTitle: bi('Criteria', 'Criterios'),
  criteriaCount: bi(
    '{blocking} blocking · {material} material · {informational} informational',
    '{blocking} excluyentes · {material} relevantes · {informational} informativos',
  ),
  criteriaNote: bi(
    '*Blocking* means failing it makes the application impossible and the engine will say so. *Material* can hold back a yes but never produces a no, because “probably refused” is a prediction and predictions are advice. *Informational* is shown and never affects the verdict.',
    '*Excluyente* significa que incumplirlo hace imposible la solicitud, y el motor lo dirá. *Relevante* puede frenar un sí pero nunca produce un no, porque «probablemente denegada» es una previsión y las previsiones son asesoramiento. *Informativo* se muestra y nunca afecta al veredicto.',
  ),
  fieldLabel: bi('Label', 'Etiqueta'),
  fieldWeight: bi('Weight', 'Peso'),
  fieldEncodedRule: bi('Encoded rule', 'Norma codificada'),
  criteriaOperators: bi(
    '{operators}. Rendered literally from the record, not paraphrased.',
    '{operators}. Presentado literalmente desde el registro, sin parafrasear.',
  ),
  fieldFactsRead: bi('Facts read', 'Datos que lee'),
  criteriaPerItem: bi(' (per item)', ' (por elemento)'),
  fieldEscalation: bi('Escalation', 'Escalado'),
  criteriaAlwaysHuman: bi('Always requires a human', 'Siempre requiere una persona'),
  fieldEscalatesWhen: bi('Escalates when', 'Escala cuando'),
  fieldGuidance: bi('Guidance', 'Orientación'),
  criteriaNotDeclared: bi('Not declared on this record', 'No declarada en este registro'),

  provenanceTitle: bi('Provenance', 'Procedencia'),
  provenanceCount: bi(
    '{total} · {stale} stale · {aging} aging',
    '{total} · {stale} obsoletas · {aging} envejeciendo',
  ),
  provenanceNote: bi(
    'Every applied rule carries a citation, and `verifiedOn` is when a human last checked the cited text against the source. A citation nobody has read in six months is a defect rather than a nuisance — the freshness bands exist because Spain repealed its investor route on roughly three months’ notice.',
    'Toda norma aplicada lleva una cita, y `verifiedOn` es la fecha en que una persona comprobó por última vez el texto citado contra la fuente. Una cita que nadie ha leído en seis meses es un defecto y no una molestia: las bandas de antigüedad existen porque España derogó su vía de inversores con unos tres meses de preaviso.',
  ),
  provenanceNoUrl: bi(
    'No canonical URL recorded. A wrong link teaches the reader to stop checking, so none is guessed.',
    'No hay URL canónica registrada. Un enlace equivocado enseña al lector a dejar de comprobar, así que no se adivina ninguno.',
  ),
  colUsed: bi('Used', 'Uso'),
  provenanceCited: bi('Cited', 'Citada'),
  provenanceNeverCited: bi('Declared, never cited', 'Declarada, nunca citada'),

  durationsTitle: bi('Durations', 'Duraciones'),
  durationsNote: bi(
    'Deliberately sparse. A processing-time figure appears only where the authority publishes a service standard; an applicant who books a flight on an invented number pays for the invention.',
    'Deliberadamente escueto. Una cifra de plazo de tramitación aparece solo donde la autoridad publica un compromiso de servicio; quien reserva un vuelo fiándose de un número inventado paga la invención.',
  ),
  durationsInitialGrant: bi('Initial grant', 'Concesión inicial'),
  durationsRenewal: bi('Renewal', 'Renovación'),
  durationsMaxRenewals: bi('Maximum renewals', 'Renovaciones máximas'),
  durationsMonths: bi('{count} months', '{count} meses'),
  durationsCountsToward: bi(
    'Counts toward naturalisation',
    'Computa para la naturalización',
  ),
  durationsNotAsserted: bi('Not asserted', 'Sin afirmar'),
  yes: bi('Yes', 'Sí'),
  no: bi('No', 'No'),
  durationsPublishedProcessing: bi(
    'Published processing time',
    'Plazo de tramitación publicado',
  ),
  durationsNonePublished: bi(
    'None published by the authority, so none is shown. No estimate is invented here.',
    'La autoridad no publica ninguno, así que no se muestra ninguno. Aquí no se inventa ninguna estimación.',
  ),
  durationsDays: bi('{min}–{max} days', '{min}–{max} días'),
  fieldNote: bi('Note', 'Nota'),

  recordLinterTitle: bi(
    'Linter findings for this record',
    'Hallazgos del verificador sobre este registro',
  ),
  recordLinterClean: bi(
    'No integrity findings against this record as at this date.',
    'Ningún hallazgo de integridad contra este registro a esta fecha.',
  ),
  dependentMattersTitle: bi(
    'Matters resting on this record',
    'Expedientes que se apoyan en este registro',
  ),
  dependentMattersCount: bi('{live} live of {total}', '{live} en curso de {total}'),
  dependentMattersNote: bi(
    'What the firm is currently measuring against these rules. This is what makes a sign-off urgent rather than tidy.',
    'Lo que el despacho está midiendo ahora mismo contra estas normas. Esto es lo que hace que una firma sea urgente y no un acto de orden.',
  ),
  dependentMattersEmpty: bi(
    'No matter in this tenant is assessed against this record.',
    'Ningún expediente de este despacho se evalúa contra este registro.',
  ),
  colDocuments: bi('Documents', 'Documentos'),

  /* ---------------------------------------------------------- integrations */

  integrationsTitle: bi('Integrations', 'Integraciones'),
  integrationsDescription: bi(
    '{adapters} declaring {capabilities} as at {date}. Each state is computed by the adapter from its own preconditions; this page renders it unchanged.',
    '{adapters} que declaran {capabilities} a fecha de {date}. Cada estado lo calcula el adaptador a partir de sus propias condiciones previas; esta página lo presenta sin cambiarlo.',
  ),
  integrationsNoneLiveTitle: bi(
    'No government integration is live',
    'No hay ninguna integración con la administración en funcionamiento',
  ),
  integrationsNoneLiveBody: bi(
    'Every capability that would cross into a government system is unavailable, and the reasons below say which are waiting on an operator, which are waiting on engineering, and which are settled refusals. That is the honest state of this repository.',
    'Toda capacidad que cruzaría hacia un sistema de la administración está no disponible, y los motivos de abajo dicen cuáles esperan a un operador, cuáles a ingeniería y cuáles son rechazos ya decididos. Ese es el estado honesto de este repositorio.',
  ),
  integrationsDefectsTitle: bi(
    '{defects} in the reports themselves',
    '{defects} en los propios informes',
  ),
  integrationsDefectsBody: bi(
    'An adapter is describing itself in a way that breaks the honesty invariants — for example claiming availability with an unmet requirement. The board renders the adapter rather than crashing on it, and lists the defect below.',
    'Un adaptador se está describiendo de un modo que rompe los invariantes de honestidad: por ejemplo, declararse disponible con una condición sin cumplir. El panel presenta el adaptador en lugar de romperse con él, y enumera el defecto abajo.',
  ),
  integrationsStatesTitle: bi('Capability states', 'Estados de las capacidades'),
  integrationsStatesNote: bi(
    "Counted across every adapter. States are ordered by how much attention they deserve, with settled refusals last — putting a decision above an open problem would misrepresent where an operator's time belongs.",
    'Contado sobre todos los adaptadores. Los estados se ordenan por la atención que merecen, con los rechazos ya decididos al final: poner una decisión por encima de un problema abierto tergiversaría dónde debe ir el tiempo de un operador.',
  ),
  colState: bi('State', 'Estado'),
  colWhoOwnsIt: bi('Who owns it', 'De quién depende'),
  ownerAvailable: bi(
    'Working now, with the credentials and agreements currently in place.',
    'Funciona ahora, con las credenciales y los convenios que hay actualmente.',
  ),
  ownerNotProvisioned: bi(
    'An operator. Something must be signed, issued or configured.',
    'De un operador. Algo tiene que firmarse, expedirse o configurarse.',
  ),
  ownerNotImplemented: bi(
    'Engineering, or a legal question that has to be answered first.',
    'De ingeniería, o de una cuestión jurídica que hay que responder antes.',
  ),
  ownerDegraded: bi(
    'Engineering. It works partially and callers should know before depending on it.',
    'De ingeniería. Funciona en parte y quien la llame debería saberlo antes de depender de ella.',
  ),
  ownerRefused: bi(
    'Nobody. This is a decision, not a gap.',
    'De nadie. Esto es una decisión, no una carencia.',
  ),
  integrationsAdapterCount: bi(
    '{jurisdiction} · {capabilities} capabilities',
    '{jurisdiction} · {capabilities} capacidades',
  ),
  integrationsAdapterDefectTitle: bi(
    "This adapter's self-description is inconsistent",
    'La autodescripción de este adaptador es incoherente',
  ),
  fieldCapability: bi('Capability', 'Capacidad'),
  fieldState: bi('State', 'Estado'),
  fieldReason: bi('Reason', 'Motivo'),
  fieldPolicy: bi('Policy', 'Política'),
  policyNoCredentialCustody: bi(
    'Meridian does not accept, store, relay or transmit a user’s government authentication credential.',
    'Meridian no acepta, guarda, retransmite ni transmite la credencial de autenticación de un usuario ante la administración.',
  ),
  policyNoImpersonation: bi(
    'Meridian does not perform acts before an authority while presenting as the user.',
    'Meridian no realiza actos ante una autoridad presentándose como el usuario.',
  ),
  fieldPreconditions: bi('Preconditions', 'Condiciones previas'),
  requirementSatisfied: bi('satisfied', 'cumplida'),
  requirementOutstanding: bi('outstanding', 'pendiente'),
  fieldOutstanding: bi('Outstanding', 'Pendiente'),
  integrationsKeyNamesOnly: bi(
    'Key names only. No value is read, stored, logged or rendered — which is what makes it safe to show an operator exactly what is missing.',
    'Solo los nombres de las claves. No se lee, guarda, registra ni presenta ningún valor, que es lo que hace seguro mostrarle a un operador exactamente qué falta.',
  ),
  fieldToUnblock: bi('To unblock', 'Para desbloquear'),
  fieldInstead: bi('Instead', 'En su lugar'),
  integrationsAlternativeMissing: bi(
    'names {id}, which this adapter does not declare',
    'nombra {id}, que este adaptador no declara',
  ),
  integrationsPolicyTitle: bi(
    'Why credential custody is refused',
    'Por qué se rechaza la custodia de credenciales',
  ),
  integrationsPolicyCount: bi(
    '{count} refused capabilities',
    '{count} capacidades rechazadas',
  ),
  integrationsPolicyNote: bi(
    "This is the block a new engineer should read before proposing to 'finish' one of the refused capabilities. It is not a backlog item.",
    'Este es el bloque que debería leer un ingeniero recién llegado antes de proponer «terminar» una de las capacidades rechazadas. No es una tarea pendiente.',
  ),
  integrationsWhatIsRefused: bi('What is refused', 'Qué se rechaza'),
  integrationsWhy: bi('Why', 'Por qué'),
  integrationsInsteadDo: bi('What is done instead', 'Qué se hace en su lugar'),
  integrationsNoRefusals: bi(
    'No capability on this board is refused by policy.',
    'Ninguna capacidad de este panel está rechazada por política.',
  ),
  colAdapter: bi('Adapter', 'Adaptador'),
  colHonestAlternative: bi('Honest alternative', 'Alternativa honesta'),
  integrationsNoAlternative: bi(
    'None offered — a refusal without an alternative is not an answer',
    'Ninguna ofrecida: un rechazo sin alternativa no es una respuesta',
  ),
  integrationsSyntheticTitle: bi(
    'No-synthetic-success check',
    'Comprobación de ausencia de éxito sintético',
  ),
  integrationsSyntheticCount: bi(
    '{probes} probes run · {findings} findings',
    '{probes} sondas ejecutadas · {findings} hallazgos',
  ),
  integrationsSyntheticNote: bi(
    'Every government operation in the registry was executed with a minimal, credential-free payload. Anything that returned data while its capability was unavailable would have fabricated it. The probe count is shown so that a clean result cannot quietly mean nothing was checked.',
    'Toda operación con la administración del registro se ejecutó con una carga mínima y sin credenciales. Cualquiera que devolviese datos mientras su capacidad estaba no disponible los habría fabricado. Se muestra el número de sondas para que un resultado limpio no pueda significar en silencio que no se comprobó nada.',
  ),
  integrationsSyntheticClean: bi(
    '{probes} probes ran and none returned data it could not have obtained.',
    'Se ejecutaron {probes} sondas y ninguna devolvió datos que no pudiera haber obtenido.',
  ),
  integrationsSyntheticCleanBody: bi(
    'This is a check that executed, not a claim on a page. With nothing provisioned, a probe returning a plausible government response is the failure it is designed to catch.',
    'Esta es una comprobación que se ejecutó, no una afirmación en una página. Sin nada aprovisionado, una sonda que devuelve una respuesta plausible de la administración es justamente el fallo que está diseñada para atrapar.',
  ),
  colFinding: bi('Finding', 'Hallazgo'),

  /* ----------------------------------------------------------------- audit */

  auditTitle: bi('Audit trail', 'Traza de auditoría'),
  auditDescription: bi(
    '{entries}, {disclosures} carrying a disclosure decision and {downgrades} of those a downgrade.',
    '{entries}, {disclosures} con una decisión de divulgación y {downgrades} de ellas una rebaja.',
  ),
  auditRecordedBetween: bi(
    ' Recorded between {first} and {last}.',
    ' Registradas entre el {first} y el {last}.',
  ),
  auditEmpty: bi('Nothing has been recorded yet.', 'Todavía no se ha registrado nada.'),
  auditEmptyBody: bi(
    'The trail is append-only and starts empty. It is not seeded, and an empty trail is rendered as empty rather than as a sample history.',
    'La traza es de solo anexión y empieza vacía. No se siembra, y una traza vacía se presenta como vacía y no como un historial de muestra.',
  ),
  auditSearchPlaceholder: bi('summary, detail, actor', 'resumen, detalle, actor'),
  auditFilterEvent: bi('Event', 'Evento'),
  auditFilterActorKind: bi('Actor type', 'Tipo de actor'),
  auditFilterActor: bi('Actor', 'Actor'),
  auditFilterMatter: bi('Matter', 'Expediente'),
  auditFilterFrom: bi('From', 'Desde'),
  auditFilterTo: bi('To', 'Hasta'),
  auditFilterDisclosure: bi('Disclosure', 'Divulgación'),
  auditFilterAllEntries: bi('All entries', 'Todas las entradas'),
  auditFilterWithDisclosure: bi(
    'With a disclosure decision ({count})',
    'Con decisión de divulgación ({count})',
  ),
  auditFilteredTitle: bi(
    'Filtered view — {shown} of {total} entries shown',
    'Vista filtrada: se muestran {shown} de {total} entradas',
  ),
  auditFilteredBody: bi(
    '{hidden} hidden by the current filter. Sequence numbers are positions in the whole trail, so they stay stable as the filter changes — a gap in the numbering is the filter, never a missing record.',
    '{hidden} por el filtro actual. Los números de secuencia son posiciones en la traza completa, así que se mantienen estables al cambiar el filtro: un hueco en la numeración es el filtro, nunca un registro que falte.',
  ),
  auditEntriesTitle: bi('Entries', 'Entradas'),
  auditEntriesCount: bi('{count} shown, newest first', '{count} mostradas, de más reciente a más antigua'),
  auditEntriesNote: bi(
    "Times are wall-clock in the recording tenant's own zone, alongside the civil date. Deliberately not an instant: an instant re-renders as a different calendar day depending on where it is read, and an audit entry that moves between days under the reader's feet is worse than useless.",
    'Las horas son de reloj de pared en la zona del propio despacho que registró, junto a la fecha civil. A propósito no es un instante: un instante se vuelve a presentar como un día distinto según dónde se lea, y una entrada de auditoría que cambia de día bajo los pies del lector es peor que inútil.',
  ),
  auditNoMatch: bi('No entry matches this filter.', 'Ninguna entrada coincide con este filtro.'),
  auditNoMatchBefore: bi('{total} in the trail. ', 'Hay {total} en la traza. '),
  auditWhen: bi('When', 'Cuándo'),
  auditFirmWide: bi('firm-wide', 'de todo el despacho'),
  auditProducedAs: bi(
    'Produced as *{produced}*, released as *{released}* to the {audience} audience',
    'Producido como *{produced}* y entregado como *{released}* al público {audience}',
  ),
  auditCites: bi(' Cites {list}.', ' Cita {list}.'),
  auditFacetsTitle: bi('What is in the trail', 'Qué hay en la traza'),
  auditFacetsNote: bi(
    'Counted over the whole trail rather than the filtered view. A facet list that shrank as you filtered could not tell you what else is there, which is the only reason to offer one.',
    'Contado sobre la traza completa y no sobre la vista filtrada. Una lista de facetas que encogiera al filtrar no podría decirle qué más hay, que es la única razón para ofrecerla.',
  ),
  colEntries: bi('Entries', 'Entradas'),
  colFilter: bi('Filter', 'Filtro'),
  auditShowOnlyThese: bi('Show only these', 'Mostrar solo estas'),

  /* ------------------------------------------------- record-language notice */

  recordLanguageNote: bi(
    'Record content — file references, matter and task titles, audit summaries, regulator names — is rendered in the language it was written in and never translated. Editing it would be editing the evidence.',
    'El contenido de los registros —referencias de expediente, títulos de expedientes y tareas, resúmenes de auditoría, nombres de reguladores— se presenta en el idioma en que se escribió y nunca se traduce. Editarlo sería editar la prueba.',
  ),
} as const;

/* -------------------------------------------------------------------------- */
/* Plural forms                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The counted noun phrases, in one place for the same reason the labels are.
 *
 * Several carry a verb because the sentence they sit in needs one to agree.
 * Spanish and English disagree about which verb and where, which is exactly why
 * these are authored per language rather than composed at the call site.
 */
export const COUNTS = {
  matter: biCount('matter', 'matters', 'expediente', 'expedientes'),
  /** `mattersNoneMatchBodyBefore`: the Spanish sentence supplies its own verb. */
  matterIs: biCount('matter is', 'matters are', 'expediente', 'expedientes'),
  /** `mattersDescriptionFiltered`. Both halves carry the verb, and they disagree about it. */
  matterMatches: biCount(
    'matter matches',
    'matters match',
    'expediente coincide',
    'expedientes coinciden',
  ),
  liveMatter: biCount(
    'live matter',
    'live matters',
    'expediente en curso',
    'expedientes en curso',
  ),
  /** `representativesDowngradedTitle`: the Spanish sentence opens with *En*. */
  liveMatterIs: biCount(
    'live matter is',
    'live matters are',
    'expediente en curso',
    'expedientes en curso',
  ),
  /** `representativesEmptyUnrepresented`: Spanish agrees the adjective, English does not have one. */
  liveMatterIsOpen: biCount(
    'live matter is',
    'live matters are',
    'expediente en curso está abierto',
    'expedientes en curso están abiertos',
  ),
  /** `caseloadUnrepresented`: the English needs a verb, the Spanish preposition does not. */
  liveMatterHas: biCount(
    'live matter has',
    'live matters have',
    'expediente en curso',
    'expedientes en curso',
  ),
  liveMatterRests: biCount(
    'live matter rests',
    'live matters rest',
    'expediente en curso se apoya',
    'expedientes en curso se apoyan',
  ),
  matterNames: biCount(
    'matter names',
    'matters name',
    'expediente nombra',
    'expedientes nombran',
  ),
  representative: biCount(
    'representative',
    'representatives',
    'representante',
    'representantes',
  ),
  standing: biCount('standing', 'standings', 'credencial', 'credenciales'),
  /** `representativesDescription`: each half places the noun *atención* differently. */
  needing: biCount('needing', 'needing', 'que requiere', 'que requieren'),
  /** `caseloadLapsedTitle`: the Spanish title is a heading with the count appended. */
  credentialHas: biCount(
    'credential has',
    'credentials have',
    'credencial',
    'credenciales',
  ),
  record: biCount('record', 'records', 'registro', 'registros'),
  criterion: biCount('criterion', 'criteria', 'criterio', 'criterios'),
  citation: biCount('citation', 'citations', 'cita', 'citas'),
  entry: biCount('entry', 'entries', 'entrada', 'entradas'),
  /** `auditNoMatchBefore`: the Spanish sentence opens with *Hay*. */
  entryIs: biCount('entry is', 'entries are', 'entrada', 'entradas'),
  /** `auditFilteredBody`: Spanish agrees *oculta* with the noun. */
  entryIsHidden: biCount(
    'entry is',
    'entries are',
    'entrada está oculta',
    'entradas están ocultas',
  ),
  deadlineIs: biCount(
    'deadline is',
    'deadlines are',
    'vencimiento',
    'vencimientos',
  ),
  issue: biCount(
    'error-severity issue',
    'error-severity issues',
    'problema de gravedad error',
    'problemas de gravedad error',
  ),
  integrityError: biCount(
    'integrity error',
    'integrity errors',
    'error de integridad',
    'errores de integridad',
  ),
  adapter: biCount('adapter', 'adapters', 'adaptador', 'adaptadores'),
  capability: biCount('capability', 'capabilities', 'capacidad', 'capacidades'),
  capabilityDefect: biCount(
    'capability defect',
    'capability defects',
    'defecto de capacidad',
    'defectos de capacidad',
  ),
  documentHas: biCount(
    'document has',
    'documents have',
    'documento',
    'documentos',
  ),
  task: biCount('task', 'tasks', 'tarea', 'tareas'),
  operator: biCount('operator', 'operators', 'operador', 'operadores'),
} as const;
