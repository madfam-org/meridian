import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { UI } from '@/lib/i18n';
import { T, TInline } from '@/components/Bilingual';
import { NavLink } from '@/components/NavLink';

import './globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: {
    default: 'Meridian — applicant portal',
    template: '%s · Meridian',
  },
  description:
    'Meridian is software for migration law and logistics. It shows an applicant their own day counts, ' +
    'document requirements and eligibility assessment against cited sources, with the arithmetic exposed. ' +
    'It is not a law firm and does not give legal advice.',
};

/**
 * The document shell.
 *
 * `lang="en"` is the document default because the chrome is authored in
 * English; every Spanish run in the page carries its own `lang="es"`, which is
 * how a bilingual document is supposed to be marked up. See `lib/i18n.ts` for
 * why both languages are shown at once.
 *
 * The landmark structure — `banner`, `navigation`, `main`, `contentinfo` — is
 * real, not decorative, and the skip link is the first focusable thing on the
 * page. A portal that tells someone whether they have overstayed has to be
 * usable by someone who cannot use a mouse.
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
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">
                ◈
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>Meridian</span>
                <span className={styles.brandTagline}>
                  <T text={UI.siteTagline} />
                </span>
              </span>
            </Link>

            <nav className={styles.nav} aria-label="Primary">
              <NavLink href="/" label={UI.navHome} exact />
              <NavLink href="/matters" label={UI.navMatters} />
              <NavLink href="/pathways" label={UI.navPathways} />
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
            <p className={styles.footerMeta}>
              Innovaciones MADFAM S.A.S. de C.V. ·{' '}
              <a
                href="https://github.com/madfam-org/meridian"
                rel="noreferrer noopener"
                target="_blank"
              >
                github.com/madfam-org/meridian
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
