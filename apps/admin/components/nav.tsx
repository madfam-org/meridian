'use client';

/**
 * Primary navigation.
 *
 * A client component only because it needs `usePathname` to mark the current
 * item. The current item is distinguished three ways — `aria-current="page"`, a
 * heavier weight, and a visible border — because a highlight carried by
 * background colour alone disappears in high-contrast mode and in print.
 *
 * Each item also shows its keyboard chord. Discoverability is the hard part of
 * keyboard navigation: a shortcut nobody can see is a shortcut nobody uses.
 *
 * The locale is read out of the path rather than passed in as a prop. It has to
 * be: this component re-renders on every client navigation while the layout that
 * would supply the prop does not, so a prop would go stale the moment a reader
 * crossed between locales. `publicPath` runs first, because `usePathname()`
 * under a middleware rewrite may report either the public path or the rewritten
 * one, and nothing here should have to care which.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONSOLE_ROUTES, activeRoute } from '@/components/routes';
import { UI, localizedPath, pick, publicPath, splitLocalePath } from '@/lib/i18n';
import styles from '@/components/shell.module.css';

export function Nav({ asOfQuery }: { asOfQuery: string }) {
  const { locale, path } = splitLocalePath(publicPath(usePathname()));
  const current = activeRoute(path);

  return (
    <nav className={styles.nav} aria-label={pick(UI.navLabel, locale)}>
      <ul className={styles.navList}>
        {CONSOLE_ROUTES.map((route) => {
          const isCurrent = current !== null && current.href === route.href;
          return (
            <li key={route.href}>
              <Link
                className={styles.navLink}
                href={`${localizedPath(route.href, locale)}${asOfQuery}`}
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
              >
                {pick(route.label, locale)}
                <span className={styles.navKey} aria-hidden="true">
                  g {route.key}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
