/**
 * Every `console.error` React emits while rendering the portal, in one place.
 *
 * Two known missing-key warnings are recorded as a ledger — see
 * `known-defects.test.tsx` for why a defect this suite may not fix is written
 * down rather than deleted — and anything else fails outright: a hydration
 * mismatch, an invalid prop, a state update outside `act`.
 *
 * ── Why this is a file of its own ────────────────────────────────────────────
 *
 * React warns about a missing key **once per component per process**. A survey
 * that ran after any other render of the same component would find nothing and
 * report a clean bill of health it had not earned. Vitest gives each test file
 * a fresh module registry, so this file renders each route exactly once and
 * nothing else renders anything. Adding a second render pass here — or moving
 * this into a file that already mounts a page — turns it green for the wrong
 * reason.
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/navigation');
  return { ...actual, usePathname: () => '/en/matters/mtr-sample-es' };
});

import { ROUTES } from '../support/routes';

/**
 * Routes that render a list without keys.
 *
 * Two call sites, each a `.map()` over authored prose with no `key` on the
 * element it returns:
 *
 *  - `components/audience/TierCard.tsx` — `tier.notes.map(...)`, reached from
 *    `/pricing`;
 *  - `app/[locale]/for/[audience]/page.tsx` — `section.body.map(...)`.
 *
 * React falls back to the array index, so today's output is correct. It stops
 * being correct the moment a list is reordered or filtered, and the failure
 * then looks like a paragraph appearing under the wrong heading.
 */
const WARNS_ABOUT_LIST_KEYS: readonly string[] = ['/pricing', '/for/[audience]'];

describe('React warnings across the portal', () => {
  it('are exactly the two known missing-key warnings, and nothing else', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const missingKeys: string[] = [];
    const other: string[] = [];

    try {
      for (const route of ROUTES) {
        spy.mockClear();
        render(await route.mount('en'));
        for (const call of spy.mock.calls) {
          const message = call.map((arg) => String(arg)).join(' ');
          if (message.includes('unique "key" prop')) {
            if (!missingKeys.includes(route.path)) missingKeys.push(route.path);
          } else {
            other.push(`${route.path}: ${message.slice(0, 160)}`);
          }
        }
        document.body.innerHTML = '';
      }
    } finally {
      spy.mockRestore();
    }

    expect(other).toEqual([]);
    expect(
      missingKeys,
      'This entry is on the known-defect ledger. If the missing keys have been ' +
        'added, delete the route from WARNS_ABOUT_LIST_KEYS; if a new list lost ' +
        'its keys, add the key.',
    ).toEqual([...WARNS_ABOUT_LIST_KEYS]);
  });
});
