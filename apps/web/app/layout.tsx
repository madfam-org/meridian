import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { UI } from '@/lib/i18n';
import { T, TInline } from '@/components/Bilingual';
import { NavLink } from '@/components/NavLink';
import { REPO_URL, SELF_URL } from '@/lib/links';

import './globals.css';
import styles from './layout.module.css';

const TITLE = 'Meridian — applicant portal';

const DESCRIPTION =
  'Meridian is software for migration law and logistics. It shows an applicant their own day counts, ' +
  'document requirements and eligibility assessment against cited sources, with the arithmetic exposed. ' +
  'It is not a law firm and does not give legal advice.';

/**
 * The short form, for a link preview.
 *
 * A card in a chat window truncates at roughly two lines. This says what the
 * portal is and what it withholds, which are the two things a reader deciding
 * whether to open it needs; it claims nothing the long description does not.
 */
const SHARE_DESCRIPTION =
  'Your own day counts, document sequence and eligibility measured against cited rules, with the ' +
  'arithmetic shown. Software, not a law firm: no recommendation without an accountable representative.';

export const metadata: Metadata = {
  // Absolute URLs for anything a crawler or a chat client resolves. Without it
  // Next emits relative og:url values, which unfurl to nothing.
  metadataBase: new URL(SELF_URL),
  title: {
    default: TITLE,
    template: '%s · Meridian',
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Meridian',
    url: SELF_URL,
    title: TITLE,
    description: SHARE_DESCRIPTION,
    // Every page renders both languages at once rather than negotiating one;
    // the pair is declared so a client does not infer a monolingual document.
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
              <a href={REPO_URL} rel="noreferrer noopener" target="_blank">
                github.com/madfam-org/meridian
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
