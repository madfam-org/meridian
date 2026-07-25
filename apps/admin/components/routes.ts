/**
 * The console's routes, in one place.
 *
 * Shared by the navigation, the keyboard shortcuts and the footer legend, so
 * that a shortcut can never point somewhere the navigation does not, and a route
 * added to one is added to all three.
 */

export interface ConsoleRoute {
  readonly href: string;
  readonly label: string;
  /** Second key of the `g`-prefixed navigation chord. */
  readonly key: string;
  readonly description: string;
}

export const CONSOLE_ROUTES: readonly ConsoleRoute[] = [
  {
    href: '/',
    label: 'Caseload',
    key: 'o',
    description: 'Distribution, blockers, and what runs out soonest.',
  },
  {
    href: '/matters',
    label: 'Matters',
    key: 'm',
    description: 'Every file, filterable by phase, status, jurisdiction and representative.',
  },
  {
    href: '/representatives',
    label: 'Representatives',
    key: 'r',
    description: 'Standing, expiry, and which matters each credential is gating.',
  },
  {
    href: '/catalog',
    label: 'Catalog review',
    key: 'c',
    description: 'The review queue between the rules engine and the product.',
  },
  {
    href: '/integrations',
    label: 'Integrations',
    key: 'i',
    description: 'Government adapter capability, honestly stated.',
  },
  {
    href: '/audit',
    label: 'Audit',
    key: 'a',
    description: 'The append-only trail, including every disclosure downgrade.',
  },
];

/** Longest-prefix match, so `/matters/mat-0001` highlights `Matters`. */
export function activeRoute(pathname: string): ConsoleRoute | null {
  let best: ConsoleRoute | null = null;
  for (const route of CONSOLE_ROUTES) {
    if (route.href === '/') {
      if (pathname === '/') best = route;
      continue;
    }
    if (pathname === route.href || pathname.startsWith(`${route.href}/`)) {
      if (best === null || route.href.length > best.href.length) best = route;
    }
  }
  return best;
}
