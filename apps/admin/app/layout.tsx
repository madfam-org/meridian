/**
 * The console frame, and the root layout.
 *
 * ## Why the locale comes from a header here
 *
 * `<html lang>` has to be the language actually served. Before this change the
 * attribute said `en` on every page because every page was English; on the other
 * two applications the same attribute could not be truthful at all, because the
 * document was two languages at once.
 *
 * The obvious way to fix it is to put `<html>` inside `app/[locale]/layout.tsx`,
 * where the segment names the locale. That was tried and measured. It is correct
 * for every page and wrong for the one screen nobody screenshots: Next resolves
 * an unmatched URL against the **root** of the tree, so with no root layout
 * `/estimate` and `/es/cualquier-cosa` rendered as bare framework documents — no
 * `lang`, no skip link, no navigation, and an English message for a Spanish
 * reader. A locale system that holds on seven screens and vanishes on the eighth
 * is not a locale system.
 *
 * So the frame lives here, and the locale arrives in a request header that
 * `middleware.ts` sets from the same `splitLocalePath` call that decides the
 * rewrite. There is one source of truth for "which language is this response",
 * and both the routing and the `lang` attribute read it. `app/not-found.tsx`
 * reads it too, which is the whole point.
 *
 * ## The case this does not fix, which predates it
 *
 * `notFound()` called from inside a page — a matter reference or a catalog id
 * that does not resolve — does not render this frame. Next serves its own error
 * shell (`<html id="__next_error__">`, no `lang`, the real UI only in the flight
 * payload) for a `notFound()` raised during a `force-dynamic` render, and every
 * page in this console is `force-dynamic` because every page reads a clock.
 *
 * That behaviour is **not new**: it was verified against this repository at
 * `34cb441`, before any locale work, by building the previous `app/` tree and
 * requesting `/matters/nope`. It produced the identical shell. The locale change
 * neither caused it nor cures it, and it is recorded here rather than left for
 * somebody to rediscover and misattribute. What did change is that the *other*
 * 404 path — any unrouted URL — now renders this frame, in the reader's
 * language, in both locales.
 *
 * ## The rest
 *
 * Landmarks are explicit and there is exactly one of each: `banner`,
 * `navigation`, `main`, `contentinfo`. `main` carries `tabIndex={-1}` so the
 * skip link can actually move focus into it rather than merely scrolling the
 * viewport, which is the usual way a skip link ends up being decorative. The
 * language switcher deliberately adds no second `navigation`; it sits beside the
 * theme control and is labelled the same way.
 *
 * The footer is not chrome. It states where the records came from and what the
 * console is entitled to release, because a console whose data source is
 * ambiguous is a console whose numbers cannot be relied on — and this console is
 * wired to no service, so the honest answer is "an in-process store", and that
 * belongs on every screen rather than buried in a README. It is rendered from
 * `activeDatasetId()` rather than written into the markup, so it keeps telling
 * the truth when the source changes.
 *
 * Record content in the footer — the practice's name, the dataset's own
 * description — carries `lang={records.recordLanguage}` rather than being
 * translated. See `FirmRecords.recordLanguage`.
 */

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { CONSOLE_ROUTES } from '@/components/routes';
import { Nav } from '@/components/nav';
import { KeyboardShortcuts, NavWithAsOf } from '@/components/shell';
import { LocaleSwitch } from '@/components/locale-switch';
import { THEME_STORAGE_KEY } from '@/components/constants';
import { ThemeToggle } from '@/components/theme-toggle';
import { Rich } from '@/components/ui';
import { AUDIENCE_LABEL } from '@/lib/labels';
import { UI, fill, htmlLang, localizedPath, pick, servedLocale } from '@/lib/i18n';
import { activeDatasetId, consoleAudience, loadRecords } from '@/lib/records';
import { SELF_URL } from '@/lib/links';
import { LOCALE_HEADER } from '@/middleware';
import styles from '@/components/shell.module.css';
import '@/app/globals.css';

/**
 * The metadata that is true of every response, including a 404.
 *
 * The per-locale title, description and share metadata live in
 * `app/[locale]/layout.tsx`, which has the segment and can say them in the right
 * language. What stays here is the part that must hold even when no page
 * matched: a search engine has no business holding a page of somebody's
 * caseload, and that is as true of the 404 as of the caseload itself.
 *
 * `robots: noindex` is the second of two controls, not the only one.
 * `app/robots.ts` asks a crawler not to fetch; this tells one that arrived
 * anyway — from a pasted link, a referrer header, a certificate-transparency
 * sweep — not to index what it found. Neither is access control, and neither is
 * standing in for it.
 */
export const metadata: Metadata = {
  // Absolute URLs for anything a client resolves without a request context.
  metadataBase: new URL(SELF_URL),
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = servedLocale((await headers()).get(LOCALE_HEADER));
  const records = loadRecords();
  const audience = consoleAudience(records);

  return (
    <html lang={htmlLang(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <a className={styles.skip} href="#main">
          {pick(UI.skipToContent, locale)}
        </a>

        <header className={styles.banner}>
          <div className={styles.bannerInner}>
            <div className={styles.brand}>
              <a className={styles.brandName} href={localizedPath('/', locale)}>
                {pick(UI.consoleName, locale)}
              </a>
              <span className={styles.brandTenant} lang={records.recordLanguage}>
                {records.tenantDisplayName}
              </span>
            </div>

            <Suspense fallback={<Nav asOfQuery="" />}>
              <NavWithAsOf />
            </Suspense>

            <div className={styles.bannerTools}>
              <LocaleSwitch />
              <ThemeToggle locale={locale} />
            </div>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>

        <footer className={styles.contentinfo}>
          <div className={styles.contentinfoInner}>
            <section aria-labelledby="footer-source">
              <h2 id="footer-source">{pick(UI.footerSourceHeading, locale)}</h2>
              <dl>
                <dt>{pick(UI.footerStore, locale)}</dt>
                <dd>{fill(UI.footerStoreValue, locale, { dataset: activeDatasetId() })}</dd>
                <dt>{pick(UI.footerTenant, locale)}</dt>
                <dd lang={records.recordLanguage}>
                  {records.tenantDisplayName} · {records.homeJurisdiction}
                </dd>
                <dt>{pick(UI.footerMatters, locale)}</dt>
                <dd>{records.matters.length}</dd>
                <dt>{pick(UI.footerRepresentatives, locale)}</dt>
                <dd>{records.representatives.length}</dd>
                <dt>{pick(UI.footerAuditEntries, locale)}</dt>
                <dd>{records.audit.length}</dd>
              </dl>
              <p lang={records.recordLanguage}>{records.datasetDescription}</p>
              <p>{pick(UI.recordLanguageNote, locale)}</p>
            </section>

            <section aria-labelledby="footer-disclosure">
              <h2 id="footer-disclosure">{pick(UI.footerDisclosureHeading, locale)}</h2>
              <p>
                <Rich
                  text={fill(UI.footerDisclosureBody, locale, {
                    audience: pick(AUDIENCE_LABEL[audience], locale).toLocaleLowerCase(locale),
                  })}
                />
              </p>
            </section>

            <section aria-labelledby="footer-keys">
              <h2 id="footer-keys">{pick(UI.footerKeyboardHeading, locale)}</h2>
              <ul className={styles.shortcutList}>
                {CONSOLE_ROUTES.map((route) => (
                  <li key={route.href}>
                    <span className={styles.shortcutKeys}>
                      <kbd>g</kbd> <kbd>{route.key}</kbd>
                    </span>
                    <span>{pick(route.label, locale)}</span>
                  </li>
                ))}
                <li>
                  <span className={styles.shortcutKeys}>
                    <kbd>/</kbd>
                  </span>
                  <span>{pick(UI.footerFilterShortcut, locale)}</span>
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
