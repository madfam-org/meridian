import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import {
  DEFAULT_LOCALE,
  LOCALES,
  UI,
  htmlLang,
  localizedPath,
  parseLocale,
  translator,
  type Locale,
} from '@/lib/i18n';
import { LocaleSwitch } from '@/components/LocaleSwitch';
import { PORTAL_URL, REPO_URL, SITE_URL } from '@/lib/links';
import { CATALOG, NOTHING_IS_COUNSEL_REVIEWED } from '@/lib/catalog-facts';

import '../globals.css';
import styles from './layout.module.css';

/**
 * The locale segment.
 *
 * Both variants are prerendered, and they are the only two this site publishes.
 * `/fr`, `/EN` and `/es-MX` are refused by `middleware.ts` before they reach
 * the router, because publishing one document at several addresses splits its
 * search ranking and makes `hreflang` self-contradictory.
 *
 * English is served at `/`, not at `/en`. The rewrite that does it is in
 * `next.config.mjs`, and it is one line: `/` renders the `/en` route. That
 * asymmetry is the whole reason `@meridian/i18n`'s path helpers exist, and it
 * must not be re-derived here.
 */
export function generateStaticParams(): { readonly locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

interface LocaleParams {
  readonly params: Promise<{ readonly locale: string }>;
}

/**
 * The served locale, or the default.
 *
 * `generateStaticParams` and the middleware between them mean only `en` and
 * `es` ever arrive, so the fallback is a belt on top of braces — but this is
 * the value that becomes `<html lang>`, and a route param is attacker-supplied
 * string data until something has looked at it. `parseLocale` is what looks:
 * strict about case and region subtags, so `/ES` and `/es-MX` could not become
 * a third and fourth address for the Spanish document even if they reached
 * here.
 */
async function localeOf({ params }: LocaleParams): Promise<Locale> {
  return parseLocale((await params).locale) ?? DEFAULT_LOCALE;
}

const TITLE = {
  en: 'Meridian — migration law and logistics, with the arithmetic shown',
  es: 'Meridian — derecho y logística migratoria, con la aritmética a la vista',
} as const satisfies Record<Locale, string>;

/**
 * The qualification that follows the description, counted rather than asserted.
 *
 * The previous wording ended "Nothing is deployed and no pathway has been
 * reviewed by counsel yet", and the first half of that sentence would have
 * become false at the moment it was first read by anybody, since a description
 * is only fetched from a host that is answering. The second half is a fact about
 * the shipped catalog, so it is counted from the catalog and moves on its own
 * when a licensed person signs a record off.
 */
const REVIEW_STATE = {
  en: NOTHING_IS_COUNSEL_REVIEWED
    ? 'No pathway in the shipped catalog has been reviewed by counsel'
    : `${CATALOG.counselReviewed} of ${CATALOG.pathways} pathways in the shipped catalog carry a counsel sign-off`,
  es: NOTHING_IS_COUNSEL_REVIEWED
    ? 'Ninguna vía del catálogo publicado ha sido revisada por letrado'
    : `${CATALOG.counselReviewed} de ${CATALOG.pathways} vías del catálogo publicado cuentan con validación de letrado`,
} as const satisfies Record<Locale, string>;

const DESCRIPTION = {
  en:
    'Meridian is an engine for the migration lifecycle: eligibility assessment against a versioned, ' +
    'cited catalog of pathways, document assembly with legalisation and sworn-translation routing, ' +
    'ICAO 9303 travel-document validation, and cross-border presence tracking. It states what a rule ' +
    'says and measures your own facts against it; it withholds recommendations unless an authorised ' +
    `representative is accountable for them. ${REVIEW_STATE.en}, and no government integration is provisioned.`,
  es:
    'Meridian es un motor para el ciclo de vida migratorio: evaluación de elegibilidad frente a un ' +
    'catálogo de vías versionado y con citas, preparación documental con enrutado de legalización y ' +
    'traducción jurada, validación de documentos de viaje conforme al Doc 9303 de OACI y seguimiento ' +
    'de presencia transfronteriza. Expone lo que dice una norma y mide sus propios datos frente a ' +
    'ella; retiene toda recomendación salvo que un representante autorizado responda de ella. ' +
    `${REVIEW_STATE.es}, y no hay ninguna integración pública aprovisionada.`,
} as const satisfies Record<Locale, string>;

/**
 * The short form, for a link preview.
 *
 * A card in a chat window truncates at roughly two lines, so this is the one
 * sentence worth keeping rather than the opening of the long description. It
 * claims nothing the long form does not.
 */
const SHARE_DESCRIPTION = {
  en:
    'A working Schengen 90/180 day counter, free and with no account, that runs in your browser and ' +
    'shows its arithmetic and its source. Plus eligibility against a cited catalog of migration ' +
    'pathways, document sequencing and ICAO 9303 checks. Software, not a law firm.',
  es:
    'Un cómputo Schengen 90/180 que funciona, gratuito y sin cuenta, que se ejecuta en su navegador ' +
    'y muestra su aritmética y su fuente. Además, elegibilidad frente a un catálogo de vías ' +
    'migratorias con citas, secuencia documental y comprobaciones del Doc 9303 de OACI. Software, ' +
    'no un despacho de abogados.',
} as const satisfies Record<Locale, string>;

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await localeOf(props);
  const other = LOCALES.filter((candidate) => candidate !== locale);

  return {
    // Absolute URLs for anything a crawler or a chat client resolves. Without it
    // Next emits relative og:url values, which unfurl to nothing.
    metadataBase: new URL(SITE_URL),
    title: TITLE[locale],
    description: DESCRIPTION[locale],
    openGraph: {
      type: 'website',
      siteName: 'Meridian',
      url: `${SITE_URL}${localizedPath('/', locale)}`,
      title: TITLE[locale],
      description: SHARE_DESCRIPTION[locale],
      // The served locale, singular — this document is in one language now, and
      // saying otherwise would tell a chat client to expect text it will not
      // find. The other language is a separate document, declared as an
      // alternate here and as `hreflang` on the route.
      locale,
      alternateLocale: [...other],
    },
    twitter: {
      // `summary`, not `summary_large_image`: no image ships, and declaring a
      // large-image card without one produces the empty grey banner this metadata
      // exists to avoid.
      card: 'summary',
      title: TITLE[locale],
      description: SHARE_DESCRIPTION[locale],
    },
    // No `alternates` here. Layout metadata is inherited by every route beneath
    // it, and a canonical of `/` on the not-found page would tell a crawler the
    // address it failed to resolve is the home page. `page.tsx` declares its
    // own, where the claim is true of exactly one route.
  };
}

/**
 * The document shell, and the root layout.
 *
 * There is no `app/layout.tsx`: the root layout lives inside the locale segment
 * because `<html lang>` is a property of the served document, and the served
 * document is in exactly one language. It could not be truthful before — the
 * page was English and Spanish at once — and getting it right is most of the
 * point of this arrangement, since it is what a screen reader, a hyphenation
 * engine and a search index all read first.
 *
 * The landmark structure — `banner`, `navigation`, `main`, `contentinfo` — is
 * real, not decorative, and the skip link is the first focusable thing on the
 * page. The site explains where a legal boundary sits; it has to be readable by
 * someone who cannot use a mouse.
 */
export default async function RootLayout({
  children,
  params,
}: LocaleParams & { readonly children: ReactNode }) {
  const locale = await localeOf({ params });
  const t = translator(locale);
  const home = localizedPath('/', locale);

  return (
    <html lang={htmlLang(locale)}>
      <body>
        <a className="skipLink" href="#main">
          {t(UI.skipToContent)}
        </a>

        <header className={styles.header}>
          <div className={styles.headerInner}>
            {/* The brand goes to the home page of the current locale rather
                than to `#main`: from the not-found page an in-page anchor would
                land nowhere, and a bare `/` would drop a Spanish reader into
                English. */}
            <a href={home} className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">
                ◈
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>Meridian</span>
                <span className={styles.brandTagline}>{t(UI.siteTagline)}</span>
              </span>
            </a>

            <div className={styles.headerNav}>
              {/*
                Anchors on the home page of the current locale rather than
                routes: this site is one document, and a reader deciding whether
                to trust it should be able to jump straight to the boundary and
                the status sections without loading anything else. The locale
                prefix is carried so the same links still work from the
                not-found page, where there is nothing to anchor to.
              */}
              <nav className={styles.nav} aria-label={t('Sections', 'Secciones')}>
                <a className={styles.navLink} href={`${home}#calculator`}>
                  {t(UI.navCalculator)}
                </a>
                <a className={styles.navLink} href={`${home}#doors`}>
                  {t(UI.navDoors)}
                </a>
                <a className={styles.navLink} href={`${home}#worked-example`}>
                  {t(UI.navProof)}
                </a>
                <a className={styles.navLink} href={`${home}#coverage`}>
                  {t(UI.navCoverage)}
                </a>
                <a className={styles.navLink} href={`${home}#advice-boundary`}>
                  {t(UI.navBoundary)}
                </a>
                <a className={styles.navLink} href={`${home}#status`}>
                  {t(UI.navStatus)}
                </a>
              </nav>

              {/*
                `path="/"` because this application serves exactly one document,
                so the page the reader is on is always the home page of its
                locale. An application with more than one route must pass its
                own route path here: a switcher that goes to the home page
                instead of to the current page loses the reader's place, which
                is the most common way this control is got wrong.
              */}
              <LocaleSwitch locale={locale} path="/" />
            </div>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p className={styles.footerLine}>{t(UI.footerNotAdvice)}</p>
            <p className={styles.footerLine}>{t(UI.footerLicence)}</p>
            <p className={styles.footerLine}>{t(UI.footerComputed)}</p>
            <p className={styles.footerMeta}>
              Innovaciones MADFAM S.A.S. de C.V. · Cuernavaca, Morelos, Mexico · AGPL-3.0-only
            </p>
            <p className={styles.footerMeta}>
              <a href={REPO_URL} rel="noreferrer noopener" target="_blank">
                github.com/madfam-org/meridian
              </a>
              {' · '}
              <a href={PORTAL_URL}>meridian-app.madfam.io</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
