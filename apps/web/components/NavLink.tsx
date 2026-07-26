'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cx } from '@/lib/ui';
import { publicPath } from '@/lib/locale';

import styles from './NavLink.module.css';

/**
 * A navigation link that knows whether it is the current page.
 *
 * It exists for an accessibility reason rather than an interaction one:
 * `aria-current="page"` is how a screen-reader user knows where they are in the
 * site, and computing it needs the active path.
 *
 * `exact` distinguishes a section root from its children. `/matters` should not
 * claim to be current while the reader is on `/matters/abc/presence`, but the
 * matter-level tabs do want prefix matching so `Day counters` stays marked
 * while a nested route is open.
 *
 * `href` is a public, locale-correct path — the caller builds it with
 * `localizedPath`. `usePathname` reports the *routed* path, which for English is
 * the internal `/en/...` form the middleware rewrote to, so it is converted back
 * before the comparison. Without that, every English nav link would compare
 * `/en/matters` against `/matters` and no item would ever be marked current.
 */
export function NavLink({
  href,
  label,
  exact = false,
  variant = 'primary',
}: {
  readonly href: string;
  /** Already resolved to the served locale by the caller. */
  readonly label: string;
  readonly exact?: boolean;
  readonly variant?: 'primary' | 'tab';
}) {
  const pathname = publicPath(usePathname());
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(styles.link, variant === 'tab' && styles.tab, active && styles.active)}
    >
      {label}
    </Link>
  );
}
