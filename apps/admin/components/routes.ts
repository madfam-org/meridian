/**
 * The console's routes, in one place.
 *
 * Shared by the navigation, the keyboard shortcuts and the footer legend, so
 * that a shortcut can never point somewhere the navigation does not, and a route
 * added to one is added to all three.
 *
 * `href` is the **locale-free** path. Every consumer runs it through
 * `localizedPath` before it becomes an `href`, which is what keeps a Spanish
 * reader inside Spanish when they use the navigation or a keyboard chord. A
 * literal `/es/...` must never appear here: the asymmetry between the two
 * locales lives in `@meridian/i18n`'s `LOCALE_PREFIX` and nowhere else.
 *
 * The keyboard chord is not translated. `g` `m` is a position on a keyboard that
 * muscle memory learns, and rebinding it per language would mean a bilingual
 * firm's two caseworkers cannot sit down at each other's screens.
 */

import type { Bi } from '@/lib/i18n';
import { UI } from '@/lib/i18n';

export interface ConsoleRoute {
  /** Locale-free. Localise before use. */
  readonly href: string;
  readonly label: Bi;
  /** Second key of the `g`-prefixed navigation chord. Locale-independent. */
  readonly key: string;
  readonly description: Bi;
}

export const CONSOLE_ROUTES: readonly ConsoleRoute[] = [
  {
    href: '/',
    label: UI.routeCaseload,
    key: 'o',
    description: UI.routeCaseloadDescription,
  },
  {
    href: '/matters',
    label: UI.routeMatters,
    key: 'm',
    description: UI.routeMattersDescription,
  },
  {
    href: '/representatives',
    label: UI.routeRepresentatives,
    key: 'r',
    description: UI.routeRepresentativesDescription,
  },
  {
    href: '/catalog',
    label: UI.routeCatalog,
    key: 'c',
    description: UI.routeCatalogDescription,
  },
  {
    href: '/integrations',
    label: UI.routeIntegrations,
    key: 'i',
    description: UI.routeIntegrationsDescription,
  },
  {
    href: '/audit',
    label: UI.routeAudit,
    key: 'a',
    description: UI.routeAuditDescription,
  },
];

/**
 * Longest-prefix match, so `/matters/mat-0001` highlights `Matters`.
 *
 * Takes a **locale-free** path. Pass `splitLocalePath(...).path`, not the raw
 * pathname: `/es/matters` would otherwise match nothing and a Spanish reader
 * would see a navigation with no current item on every screen.
 */
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
