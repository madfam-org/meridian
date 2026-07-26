/**
 * `components/CoverageBoundary` — the statement whose absence is the defect.
 *
 * These tests assert presence, not prose. The boundary exists because a reader
 * who receives "not met" on a small catalog has been told nothing about the
 * routes they might actually have, and the routes most people in Spain without
 * status use are not encoded here at all. If a redesign quietly drops this
 * region, or softens it into "other routes may exist", the product goes back to
 * being dishonest about its edges and nothing else would notice.
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  COVERED_JURISDICTIONS,
  JURISDICTIONS_WITHOUT_REGISTER,
  UNCOVERED_ROUTES,
  coveredIn,
  uncoveredIn,
} from '@/lib/coverage';
import {
  COVERAGE_BOUNDARY_ID,
  CoverageBoundary,
  CoverageResultNotice,
} from '@/components/CoverageBoundary';

describe('the full coverage statement', () => {
  it('is a landmark region with a heading, not a coloured rectangle', () => {
    // A screen-reader user must meet it in the document outline rather than
    // walk past it.
    const { container } = render(<CoverageBoundary locale="en" />);
    const section = container.querySelector(`#${COVERAGE_BOUNDARY_ID}`);

    expect(section).not.toBeNull();
    expect(section?.tagName).toBe('SECTION');
    expect(
      screen.getByRole('heading', { name: /What this does not cover/ }),
    ).toBeInTheDocument();
  });

  it('says a negative result is not a verdict on the reader', () => {
    render(<CoverageBoundary locale="en" />);

    expect(
      screen.getByText(/It does not mean you have no immigration route/),
    ).toBeInTheDocument();
  });

  it('names every route it knows is missing, rather than gesturing at them', () => {
    // "Other routes exist" is useless. A named route is something a reader can
    // take to a lawyer.
    render(<CoverageBoundary locale="en" />);

    expect(UNCOVERED_ROUTES.length).toBeGreaterThan(0);
    for (const route of UNCOVERED_ROUTES) {
      expect(screen.getByText(route.name.en), `${route.key} is not named`).toBeInTheDocument();
      expect(screen.getByText(route.source.en), `${route.key} has no source`).toBeInTheDocument();
    }
  });

  it('counts what is encoded from the catalog', () => {
    render(<CoverageBoundary locale="en" />);

    for (const code of COVERED_JURISDICTIONS) {
      const count = coveredIn(code).length;
      expect(screen.getByText(`${count} routes encoded`)).toBeInTheDocument();
    }
  });

  it('reports a jurisdiction nobody has assessed as unknown, not as complete', () => {
    // An empty gap list has two possible causes and they mean opposite things.
    render(<CoverageBoundary locale="en" />);

    expect(JURISDICTIONS_WITHOUT_REGISTER.length).toBeGreaterThan(0);
    const statement = screen.getByText(/as unknown rather than complete/);

    // The jurisdictions are named in the same sentence, so the reader knows
    // which ones the warning is about.
    for (const code of JURISDICTIONS_WITHOUT_REGISTER) {
      expect(statement.textContent).toContain(code);
    }
    expect(statement.textContent).toContain('nobody has written down what is missing');
  });

  it('says the list of omissions is not a survey of either country', () => {
    render(<CoverageBoundary locale="en" />);

    expect(screen.getByText(/not a complete map of either country/)).toBeInTheDocument();
  });

  it('names protection claims as permanently out of scope, and says where to go', () => {
    render(<CoverageBoundary locale="en" />);

    expect(screen.getByText(/asylum, refugee status and subsidiary protection/)).toBeInTheDocument();
    expect(screen.getByText(/Colegio de Abogados/)).toBeInTheDocument();
    expect(screen.getByText(/names no firm, refers you to nobody/)).toBeInTheDocument();
  });

  it('narrows to the jurisdiction the page is about', () => {
    // Listing Canadian omissions under a Spanish nationality result is noise,
    // and noise is what a reader learns to skip.
    render(<CoverageBoundary locale="en" jurisdictions={['ES']} />);

    for (const route of uncoveredIn(['ES'])) {
      expect(screen.getByText(route.name.en)).toBeInTheDocument();
    }
    for (const route of uncoveredIn(['CA'])) {
      expect(screen.queryByText(route.name.en), `${route.key} leaked in`).toBeNull();
    }
  });

  it('renders in Spanish without falling back to the English half', () => {
    render(<CoverageBoundary locale="es" jurisdictions={['ES']} />);

    expect(screen.getByRole('heading', { name: /Qué no cubre esto/ })).toBeInTheDocument();
    for (const route of uncoveredIn(['ES'])) {
      expect(screen.getByText(route.name.es)).toBeInTheDocument();
      expect(screen.queryByText(route.name.en)).toBeNull();
    }
  });
});

describe('the copy that travels inside a result panel', () => {
  it('is titled and tinted rather than being a footnote', () => {
    // The reader has just been told a rule was not met, and this is the
    // correction to the conclusion they are about to draw from that.
    render(<CoverageResultNotice locale="en" jurisdictions={['ES']} />);

    const notice = screen.getByRole('note');
    expect(
      within(notice).getByRole('heading', { name: /not the whole of the law/ }),
    ).toBeInTheDocument();
  });

  it('names the missing routes there too, not only at the top of the page', () => {
    // The boundary at the top of the page is off screen by the time a verdict
    // appears, and the verdict is the moment a wrong conclusion gets drawn.
    render(<CoverageResultNotice locale="en" jurisdictions={['ES']} />);
    const notice = screen.getByRole('note');

    for (const route of uncoveredIn(['ES'])) {
      expect(within(notice).getByText(route.name.en)).toBeInTheDocument();
    }
  });

  it('links back to the full statement on the same page', () => {
    render(<CoverageResultNotice locale="en" jurisdictions={['ES']} />);

    const link = screen.getByRole('link', { name: /full coverage statement/ });
    expect(link).toHaveAttribute('href', `#${COVERAGE_BOUNDARY_ID}`);
  });

  it('repeats the protection exclusion, because it is the one nobody may miss', () => {
    render(<CoverageResultNotice locale="es" jurisdictions={['ES']} />);

    expect(screen.getByText(/protección internacional/)).toBeInTheDocument();
  });
});

describe('the anchor the two halves share', () => {
  it('is owned by the full statement and referenced by the notice', () => {
    const { container } = render(
      <>
        <CoverageBoundary locale="en" jurisdictions={['ES']} />
        <CoverageResultNotice locale="en" jurisdictions={['ES']} />
      </>,
    );

    // One target per page, or the link jumps to whichever came first.
    expect(container.querySelectorAll(`#${COVERAGE_BOUNDARY_ID}`)).toHaveLength(1);
    const link = screen.getByRole('link', { name: /full coverage statement/ });
    expect(container.querySelector(link.getAttribute('href') ?? '')).not.toBeNull();
  });
});
