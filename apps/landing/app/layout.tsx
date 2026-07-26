import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { UI } from '@/lib/i18n';
import { T, TInline } from '@/components/Bilingual';
import { PORTAL_URL, REPO_URL, SITE_URL } from '@/lib/links';
import { CATALOG, NOTHING_IS_COUNSEL_REVIEWED } from '@/lib/catalog-facts';

import './globals.css';
import styles from './layout.module.css';

const TITLE = 'Meridian — migration law and logistics, with the arithmetic shown';

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
const REVIEW_STATE = NOTHING_IS_COUNSEL_REVIEWED
  ? 'No pathway in the shipped catalog has been reviewed by counsel'
  : `${CATALOG.counselReviewed} of ${CATALOG.pathways} pathways in the shipped catalog carry a counsel sign-off`;

const DESCRIPTION =
  'Meridian is an engine for the migration lifecycle: eligibility assessment against a versioned, ' +
  'cited catalog of pathways, document assembly with legalisation and sworn-translation routing, ' +
  'ICAO 9303 travel-document validation, and cross-border presence tracking. It states what a rule ' +
  'says and measures your own facts against it; it withholds recommendations unless an authorised ' +
  `representative is accountable for them. ${REVIEW_STATE}, and no government integration is provisioned.`;

/**
 * The short form, for a link preview.
 *
 * A card in a chat window truncates at roughly two lines, so this is the one
 * sentence worth keeping rather than the opening of the long description. It
 * claims nothing the long form does not.
 */
const SHARE_DESCRIPTION =
  'A working Schengen 90/180 day counter, free and with no account, that runs in your browser and ' +
  'shows its arithmetic and its source. Plus eligibility against a cited catalog of migration ' +
  'pathways, document sequencing and ICAO 9303 checks. Software, not a law firm.';

export const metadata: Metadata = {
  // Absolute URLs for anything a crawler or a chat client resolves. Without it
  // Next emits relative og:url values, which unfurl to nothing.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Meridian',
    url: SITE_URL,
    title: TITLE,
    description: SHARE_DESCRIPTION,
    // The page renders both languages at once rather than negotiating one; the
    // pair is declared so a client does not infer a monolingual document.
    locale: 'en',
    alternateLocale: ['es'],
  },
  twitter: {
    // `summary`, not `summary_large_image`: no image ships, and declaring a
    // large-image card without one produces the empty grey banner this metadata
    // exists to avoid.
    card: 'summary',
    title: TITLE,
    description: SHARE_DESCRIPTION,
  },
  // No `alternates` here. Layout metadata is inherited by every route beneath
  // it, and a canonical of `/` on the not-found page would tell a crawler the
  // address it failed to resolve is the home page. `app/page.tsx` declares its
  // own, where the claim is true of exactly one route.
};

/**
 * The document shell.
 *
 * `lang="en"` is the document default because the chrome is authored in
 * English; every Spanish run carries its own `lang="es"`, which is how a
 * bilingual document is supposed to be marked up. See `lib/i18n.ts` for why both
 * languages are shown at once.
 *
 * The landmark structure — `banner`, `navigation`, `main`, `contentinfo` — is
 * real, not decorative, and the skip link is the first focusable thing on the
 * page. The site explains where a legal boundary sits; it has to be readable by
 * someone who cannot use a mouse.
 */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main">
          <TInline text={UI.skipToContent} />
        </a>

        <header className={styles.header}>
          <div className={styles.headerInner}>
            {/* The brand goes to `/` rather than to `#main`: from the not-found
                page an in-page anchor would land nowhere. */}
            <a href="/" className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">
                ◈
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>Meridian</span>
                <span className={styles.brandTagline}>
                  <T text={UI.siteTagline} />
                </span>
              </span>
            </a>

            {/*
              In-page anchors rather than routes: this site is one document, and
              a reader deciding whether to trust it should be able to jump
              straight to the boundary and the status sections without loading
              anything else.
            */}
            <nav className={styles.nav} aria-label="Sections">
              <a className={styles.navLink} href="#calculator">
                <T text={UI.navCalculator} />
              </a>
              <a className={styles.navLink} href="#doors">
                <T text={UI.navDoors} />
              </a>
              <a className={styles.navLink} href="#worked-example">
                <T text={UI.navProof} />
              </a>
              <a className={styles.navLink} href="#coverage">
                <T text={UI.navCoverage} />
              </a>
              <a className={styles.navLink} href="#advice-boundary">
                <T text={UI.navBoundary} />
              </a>
              <a className={styles.navLink} href="#status">
                <T text={UI.navStatus} />
              </a>
            </nav>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p className={styles.footerLine}>
              <T text={UI.footerNotAdvice} />
            </p>
            <p className={styles.footerLine}>
              <T text={UI.footerLicence} />
            </p>
            <p className={styles.footerLine}>
              <T text={UI.footerComputed} />
            </p>
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
