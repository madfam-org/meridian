/**
 * A ledger of defects this suite found and was not allowed to fix.
 *
 * These tests may only write to `apps/web/tests/**`, so real findings had to be
 * recorded rather than repaired. Dropping the assertions would leave the suite
 * green and the defects invisible; asserting the correct behaviour would leave
 * the suite red and get the file skipped. Neither is honest.
 *
 * The third finding — two lists rendered without React keys — lives in
 * `react-warnings.test.tsx`, because React warns once per component per process
 * and a survey that ran after any other render would find nothing.
 *
 * So each defect is recorded as the *exact* set of places it occurs, which
 * fails in both directions — the property that matters:
 *
 *  - a new occurrence fails, because the set grew;
 *  - a fix fails, because the set shrank, and the message says to delete the
 *    entry.
 *
 * Same shape as `JURISDICTIONS_WITHOUT_REGISTER` in `lib/coverage`: an empty
 * list and a list nobody wrote are different states, and silence must not read
 * as compliance.
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/navigation');
  return { ...actual, usePathname: () => '/en/matters/mtr-sample-es' };
});

import { ROUTES, danglingAnchors, headingSkips } from '../support/routes';

const REMOVE_WHEN_FIXED =
  'This entry is on the known-defect ledger in tests/pages/known-defects.test.tsx. ' +
  'If the defect has been fixed, delete the entry; if a new one appeared, fix it.';

/** Render every route once and hand the container to a probe. */
async function surveyRoutes(probe: (container: HTMLElement) => boolean): Promise<string[]> {
  const hits: string[] = [];
  for (const route of ROUTES) {
    const { container } = render(await route.mount('en'));
    if (probe(container)) hits.push(route.path);
    document.body.innerHTML = '';
  }
  return hits;
}

// ---------------------------------------------------------------------------
// 1. Heading levels
// ---------------------------------------------------------------------------

/**
 * Routes whose document outline jumps a level.
 *
 * Four of them place a `Callout` — whose title is an `h3` — directly beneath
 * the page `h1`, with no `h2` between. The two matter routes jump `h2 → h4`
 * inside a section instead.
 *
 * The rendered page looks right in every case. The outline a screen-reader user
 * navigates by does not, which is exactly why nobody noticed.
 */
const SKIPS_A_HEADING_LEVEL: readonly string[] = [
  '/pricing',
  '/for',
  '/matters/[id]',
  '/matters/[id]/presence',
  '/pathways',
  '/pathways/[id]',
];

describe('heading levels', () => {
  it('are skipped on exactly the routes already known to skip them', async () => {
    const offenders = await surveyRoutes((container) => headingSkips(container).length > 0);

    expect(offenders, REMOVE_WHEN_FIXED).toEqual([...SKIPS_A_HEADING_LEVEL]);
  });

  it('jump straight from the page heading to a callout on the two marketing routes', async () => {
    // Recorded precisely, so the entry can be checked against a fix rather than
    // taken on trust.
    const route = ROUTES.find((r) => r.path === '/pricing');
    if (route === undefined) throw new Error('no /pricing route');
    const { container } = render(await route.mount('en'));

    expect(headingSkips(container)).toEqual(['h1 → h3']);
  });
});

// ---------------------------------------------------------------------------
// 2. Citation references that resolve to nothing
// ---------------------------------------------------------------------------

/**
 * Routes rendering an in-page anchor no element on the page answers.
 *
 * One route, one cause. `app/[locale]/matters/[id]/documents/page.tsx` calls
 * `resolveCitations(ids, null)` and renders only `resolved.found`, dropping
 * `resolved.missing` — while the inline `CitationRefs` still emit a `#cite-<id>`
 * link for every id, including the missing ones.
 *
 * This is the exact state `components/Citations.tsx` provides
 * `UnresolvedCitation` for, and the reason that component exists: a rule shown
 * with no way to check its source is what the `Citation` type is arranged to
 * prevent. The dropped ids are `es-cc-art-22-3` and `es-cc-art-22-4` — two of
 * the provisions the Spanish nationality route actually turns on.
 */
const DANGLING_IN_PAGE_ANCHORS: readonly string[] = ['/matters/[id]/documents'];

describe('in-page references', () => {
  it('dangle on exactly the routes already known to dangle', async () => {
    const offenders = await surveyRoutes((container) => danglingAnchors(container).length > 0);

    expect(offenders, REMOVE_WHEN_FIXED).toEqual([...DANGLING_IN_PAGE_ANCHORS]);
  });

  it('name the two Civil Code provisions the documents page silently drops', async () => {
    const route = ROUTES.find((r) => r.path === '/matters/[id]/documents');
    if (route === undefined) throw new Error('no documents route');
    const { container } = render(await route.mount('en'));

    expect(danglingAnchors(container)).toEqual(['cite-es-cc-art-22-3', 'cite-es-cc-art-22-4']);
  });
});
