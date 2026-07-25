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
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONSOLE_ROUTES, activeRoute } from '@/components/routes';
import styles from '@/components/shell.module.css';

export function Nav({ asOfQuery }: { asOfQuery: string }) {
  const pathname = usePathname() ?? '/';
  const current = activeRoute(pathname);

  return (
    <nav className={styles.nav} aria-label="Console sections">
      <ul className={styles.navList}>
        {CONSOLE_ROUTES.map((route) => {
          const isCurrent = current !== null && current.href === route.href;
          return (
            <li key={route.href}>
              <Link
                className={styles.navLink}
                href={`${route.href}${asOfQuery}`}
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
              >
                {route.label}
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
