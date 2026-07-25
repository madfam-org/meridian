import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { UI } from '@/lib/i18n';
import { T, TInline } from '@/components/Bilingual';
import { PORTAL_URL, REPO_URL } from '@/lib/links';

import './globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Meridian — migration law and logistics, with the arithmetic shown',
  description:
    'Meridian is an engine for the migration lifecycle: eligibility assessment against a versioned, ' +
    'cited catalog of pathways, document assembly with legalisation and sworn-translation routing, ' +
    'ICAO 9303 travel-document validation, and cross-border presence tracking. It states what a rule ' +
    'says and measures your own facts against it; it withholds recommendations unless an authorised ' +
    'representative is accountable for them. Nothing is deployed and no pathway has been reviewed by counsel yet.',
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
              <a className={styles.navLink} href="#what-it-is">
                <T text={UI.navWhatItIs} />
              </a>
              <a className={styles.navLink} href="#corridors">
                <T text={UI.navCorridors} />
              </a>
              <a className={styles.navLink} href="#advice-boundary">
                <T text={UI.navBoundary} />
              </a>
              <a className={styles.navLink} href="#refused">
                <T text={UI.navRefused} />
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
