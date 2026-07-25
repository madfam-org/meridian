/**
 * The console frame.
 *
 * Landmarks are explicit and there is exactly one of each: `banner`,
 * `navigation`, `main`, `contentinfo`. `main` carries `tabIndex={-1}` so the
 * skip link can actually move focus into it rather than merely scrolling the
 * viewport, which is the usual way a skip link ends up being decorative.
 *
 * The footer is not chrome. It states where the records came from and what the
 * console is entitled to release, because a console whose data source is
 * ambiguous is a console whose numbers cannot be relied on — and because
 * `apps/api` does not exist yet, so the honest answer today is "an in-process
 * store", and that belongs on every screen rather than buried in a README.
 */

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { CONSOLE_ROUTES } from '@/components/routes';
import { Nav } from '@/components/nav';
import { KeyboardShortcuts, NavWithAsOf } from '@/components/shell';
import { THEME_STORAGE_KEY } from '@/components/constants';
import { ThemeToggle } from '@/components/theme-toggle';
import { activeDatasetId, consoleAudience, loadRecords } from '@/lib/records';
import styles from '@/components/shell.module.css';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Meridian firm console',
    template: '%s · Meridian firm console',
  },
  description:
    'Caseload, representative standing, catalog review and integration status for a licensed practice.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Both schemes are genuinely supported, so the UA is told and native controls follow.
  colorScheme: 'light dark',
};

/**
 * Applied before first paint so an explicit dark choice does not flash light.
 * Reads one key, writes one attribute, and swallows storage errors — a console
 * that failed to render because private browsing blocked `localStorage` would be
 * a poor trade for a theme preference.
 */
const THEME_BOOTSTRAP = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(v==='light'||v==='dark'){document.documentElement.setAttribute('data-theme',v);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  const records = loadRecords();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <a className={styles.skip} href="#main">
          Skip to main content
        </a>

        <header className={styles.banner}>
          <div className={styles.bannerInner}>
            <div className={styles.brand}>
              <a className={styles.brandName} href="/">
                Meridian firm console
              </a>
              <span className={styles.brandTenant}>{records.tenantDisplayName}</span>
            </div>

            <Suspense fallback={<Nav asOfQuery="" />}>
              <NavWithAsOf />
            </Suspense>

            <div className={styles.bannerTools}>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>

        <footer className={styles.contentinfo}>
          <div className={styles.contentinfoInner}>
            <section aria-labelledby="footer-source">
              <h2 id="footer-source">Record source</h2>
              <dl>
                <dt>Store</dt>
                <dd>in-process ({activeDatasetId()})</dd>
                <dt>Tenant</dt>
                <dd>
                  {records.tenantDisplayName} · {records.homeJurisdiction}
                </dd>
                <dt>Matters</dt>
                <dd>{records.matters.length}</dd>
                <dt>Representatives</dt>
                <dd>{records.representatives.length}</dd>
                <dt>Audit entries</dt>
                <dd>{records.audit.length}</dd>
              </dl>
              <p>{records.datasetDescription}</p>
            </section>

            <section aria-labelledby="footer-disclosure">
              <h2 id="footer-disclosure">Disclosure posture</h2>
              <p>
                This console renders for a <strong>{consoleAudience(records)}</strong> audience —
                derived from the tenant kind by <code>audienceFor</code>, never hard-coded at a call
                site. Advice-class
                output is released here because the reader is the professional, not the protected
                party. The same output reaching an applicant without a live representative in the
                right jurisdiction is downgraded to an assessment, and every downgrade is written to
                the audit trail.
              </p>
            </section>

            <section aria-labelledby="footer-keys">
              <h2 id="footer-keys">Keyboard</h2>
              <ul className={styles.shortcutList}>
                {CONSOLE_ROUTES.map((route) => (
                  <li key={route.href}>
                    <span className={styles.shortcutKeys}>
                      <kbd>g</kbd> <kbd>{route.key}</kbd>
                    </span>
                    <span>{route.label}</span>
                  </li>
                ))}
                <li>
                  <span className={styles.shortcutKeys}>
                    <kbd>/</kbd>
                  </span>
                  <span>Focus the filter on this page</span>
                </li>
              </ul>
            </section>
          </div>
        </footer>

        <Suspense fallback={null}>
          <KeyboardShortcuts />
        </Suspense>
      </body>
    </html>
  );
}
