'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import { TInline } from '@/components/Bilingual';

import styles from './NavLink.module.css';

/**
 * A navigation link that knows whether it is the current page.
 *
 * This is the only client component in the portal, and it exists for an
 * accessibility reason rather than an interaction one: `aria-current="page"` is
 * how a screen-reader user knows where they are in the site, and computing it
 * needs the active path. Everything else here renders on the server.
 *
 * `exact` distinguishes a section root from its children. `/matters` should not
 * claim to be current while the reader is on `/matters/abc/presence`, but the
 * matter-level tabs do want prefix matching so `Day counters` stays marked
 * while a nested route is open.
 */
export function NavLink({
  href,
  label,
  exact = false,
  variant = 'primary',
}: {
  readonly href: string;
  readonly label: Bi;
  readonly exact?: boolean;
  readonly variant?: 'primary' | 'tab';
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(styles.link, variant === 'tab' && styles.tab, active && styles.active)}
    >
      <TInline text={label} />
    </Link>
  );
}
