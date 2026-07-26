/**
 * Accessibility invariants that regress silently, checked on every route.
 *
 * None of these is exotic. All of them break in real products constantly,
 * because nothing on the screen looks wrong when they do: a second `h1` still
 * renders, a control with a placeholder instead of a label still accepts typing,
 * a red badge with no word beside it still looks like a status. A test is the
 * only thing that notices.
 *
 * This portal tells somebody whether they have overstayed. It has to be usable
 * by somebody who cannot use a mouse.
 *
 * Heading-level order and in-page anchor resolution are checked in
 * `known-defects.test.tsx` instead: the portal does not satisfy them yet, and
 * this suite may not edit the pages. A ledger there records exactly where they
 * fail rather than letting the omission read as compliance.
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', async () => {
  // `NavLink` and `LocaleSwitch` read the routed path to mark the current page.
  // Outside a router there is none, so the tests serve one.
  const actual = await vi.importActual<Record<string, unknown>>('next/navigation');
  return { ...actual, usePathname: () => '/en/matters/mtr-sample-es' };
});

import { COVERAGE_BOUNDARY_ID } from '@/components/CoverageBoundary';
import { ROUTES, type Route } from '../support/routes';

async function mount(route: Route, locale = 'en'): Promise<HTMLElement> {
  const { container } = render(await route.mount(locale));
  return container;
}

describe('the route table', () => {
  it('covers the fourteen routes the portal publishes', () => {
    // A route added without an entry is a route with no accessibility floor.
    expect(ROUTES).toHaveLength(14);
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(ROUTES.length);
  });
});

describe('every route', () => {
  for (const route of ROUTES) {
    describe(route.path, () => {
      it('has exactly one h1, and it opens the outline', async () => {
        const container = await mount(route);
        const headings = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')];

        expect(container.querySelectorAll('h1')).toHaveLength(1);
        expect(headings[0]?.tagName).toBe('H1');
      });

      it('labels every control with a real label element', async () => {
        // Not a placeholder, not an aria-label, not a paragraph above the box.
        // A placeholder disappears the moment somebody types, which is exactly
        // when a person who has been interrupted needs it back.
        const container = await mount(route);

        for (const control of container.querySelectorAll('input, select, textarea')) {
          if (control.getAttribute('type') === 'hidden') continue;
          const id = control.getAttribute('id');
          expect(id, `control with no id: ${control.outerHTML}`).not.toBeNull();
          expect(
            container.querySelector(`label[for="${id ?? ''}"]`),
            `no label for #${id ?? ''}`,
          ).not.toBeNull();
        }
      });

      it('takes nothing out of the natural tab order', async () => {
        // A positive tabindex reorders the whole page, not just the element.
        const container = await mount(route);

        for (const element of container.querySelectorAll('[tabindex]')) {
          expect(
            Number(element.getAttribute('tabindex')),
            element.outerHTML.slice(0, 120),
          ).toBeLessThanOrEqual(0);
        }
      });

      it('resolves every aria-labelledby and aria-describedby it declares', async () => {
        const container = await mount(route);

        for (const attribute of ['aria-labelledby', 'aria-describedby']) {
          for (const element of container.querySelectorAll(`[${attribute}]`)) {
            for (const target of (element.getAttribute(attribute) ?? '').split(/\s+/)) {
              if (target === '') continue;
              expect(
                container.querySelector(`[id="${target}"]`),
                `${attribute}="${target}" resolves nowhere`,
              ).not.toBeNull();
            }
          }
        }
      });

      it('opens every external link safely', async () => {
        const container = await mount(route);

        for (const link of container.querySelectorAll('a[target="_blank"]')) {
          const rel = link.getAttribute('rel') ?? '';
          expect(rel, link.outerHTML).toContain('noopener');
          expect(rel, link.outerHTML).toContain('noreferrer');
        }
      });

      it('never leaves a status to colour alone', async () => {
        // Roughly one man in twelve has a colour vision deficiency, and a
        // border is invisible in a high-contrast theme. Every badge carries a
        // decorative glyph plus a word, and the word is what must be there.
        const container = await mount(route);

        for (const glyph of container.querySelectorAll('span[aria-hidden="true"]')) {
          const badge = glyph.parentElement;
          if (badge === null || !badge.className.includes('badge')) continue;
          const words = (badge.textContent ?? '').replace(glyph.textContent ?? '', '').trim();
          expect(words.length, `badge with no text: ${badge.outerHTML}`).toBeGreaterThan(0);
        }
      });

      it('renders the same structure in Spanish', async () => {
        // A locale that dropped a section, or that left an `undefined` in a
        // template, shows up here rather than in production.
        const english = await mount(route, 'en');
        const spanish = await mount(route, 'es');

        expect(spanish.querySelectorAll('h1')).toHaveLength(1);
        expect(spanish.querySelectorAll('h1, h2, h3, h4, h5, h6').length).toBe(
          english.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        );
        expect(spanish.textContent).not.toContain('undefined');
        expect(spanish.textContent).not.toContain('[object Object]');
      });
    });
  }
});

describe('the coverage boundary', () => {
  for (const route of ROUTES.filter((r) => r.eligibilitySurface === true)) {
    it(`renders on ${route.path}, where a reader could conclude they have no route`, async () => {
      // Its absence is the defect it exists to prevent. Assert presence, and
      // assert it names routes rather than gesturing at them.
      const container = await mount(route);
      const boundary = container.querySelector(`#${COVERAGE_BOUNDARY_ID}`);

      expect(boundary, `${route.path} has no coverage boundary`).not.toBeNull();
      expect(boundary?.textContent).toContain('It does not mean you have no immigration route');
      expect(boundary?.querySelectorAll('li').length).toBeGreaterThan(0);
    });
  }

  it('appears at most once per page, so its anchor is unambiguous', async () => {
    for (const route of ROUTES) {
      const container = await mount(route);
      expect(
        container.querySelectorAll(`#${COVERAGE_BOUNDARY_ID}`).length,
        `${route.path} renders the boundary more than once`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('is on every surface that reports an eligibility verdict', async () => {
    // Named explicitly rather than derived, so removing the flag from a route
    // fails here instead of quietly removing the requirement.
    const surfaces = ROUTES.filter((r) => r.eligibilitySurface === true).map((r) => r.path);

    expect(surfaces).toEqual([
      '/pathways',
      '/pathways/[id]',
      '/tools',
      '/tools/nationality-es',
      '/tools/schengen',
    ]);
  });
});
