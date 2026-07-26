/**
 * `components/DisclosureNotice` — and the release gate that drives it.
 *
 * `@meridian/core` never suppresses an output silently and never upgrades one:
 * when a recommendation cannot lawfully reach an unrepresented applicant it is
 * *downgraded* to the same facts without the opinion. A person handed the
 * downgraded version with no explanation has no way to tell it apart from a bug,
 * an empty database, or a product that has nothing to say about their case.
 *
 * So the defect these tests catch is not "the gate let something through". It is
 * the quieter one: the gate held something back and the page said nothing.
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';

import { bi } from '@/lib/i18n';
import { AS_OF } from '@/lib/sample/common';
import { SAMPLE_MATTERS } from '@/lib/sample/matters';
import {
  REMEDY_FOR_RECOMMENDATION,
  RETAINED_AFTER_DOWNGRADE,
  WITHHELD_FROM_RECOMMENDATION,
  releaseRecommendationFor,
} from '@/lib/disclosure-view';
import { DisclosureNotice, disclosureClassView } from '@/components/DisclosureNotice';

const GATE_REASON =
  'A recommendation may not be released to an applicant with no authorised representative.';

describe('a downgraded output', () => {
  function renderDowngrade() {
    return render(
      <DisclosureNotice
        locale="en"
        shown="assessment"
        requested="advice"
        reason={GATE_REASON}
        withheld={WITHHELD_FROM_RECOMMENDATION}
        remedy={REMEDY_FOR_RECOMMENDATION}
      />,
    );
  }

  it('says that something was withheld, in words rather than by styling', () => {
    renderDowngrade();

    expect(screen.getByRole('note')).toHaveAccessibleName(/withheld/i);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Part of this output was withheld');
  });

  it('names both classes, so the reader can see what became what', () => {
    renderDowngrade();
    const notice = screen.getByRole('note');

    expect(within(notice).getByText('Advice')).toBeInTheDocument();
    expect(within(notice).getByText('Assessment')).toBeInTheDocument();
  });

  it('lists exactly what is missing from the page', () => {
    renderDowngrade();

    for (const item of WITHHELD_FROM_RECOMMENDATION) {
      expect(screen.getByText(item.en)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: 'Not shown on this page' })).toBeInTheDocument();
  });

  it('quotes the gate’s own reason verbatim, tagged as English', () => {
    // A paraphrase of a compliance determination is a different statement, and
    // a Spanish reader is served the quotation rather than a translation of it.
    const { container } = render(
      <DisclosureNotice
        locale="es"
        shown="assessment"
        requested="advice"
        reason={GATE_REASON}
        withheld={WITHHELD_FROM_RECOMMENDATION}
      />,
    );

    const quote = container.querySelector('blockquote');
    expect(quote).not.toBeNull();
    expect(quote?.textContent).toBe(GATE_REASON);
    expect(quote?.getAttribute('lang')).toBe('en');
    expect(quote?.getAttribute('cite')).toBe('urn:meridian:core:canRelease');
    // The surrounding explanation is Meridian's own wording and is translated.
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Parte de este resultado se ha retenido',
    );
  });

  it('says what would change it', () => {
    renderDowngrade();

    expect(screen.getByRole('heading', { name: 'What would change this' })).toBeInTheDocument();
    for (const item of REMEDY_FOR_RECOMMENDATION) {
      expect(screen.getByText(item.en)).toBeInTheDocument();
    }
  });
});

describe('an output released as it was produced', () => {
  it('states what the reader is looking at without claiming anything was withheld', () => {
    render(<DisclosureNotice locale="en" shown="assessment" />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('What you are reading');
    expect(screen.queryByText(/withheld/i)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Reason returned by the release gate' })).toBeNull();
  });

  it('is not treated as a downgrade when the requested class matches the shown one', () => {
    render(<DisclosureNotice locale="en" shown="assessment" requested="assessment" />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('What you are reading');
  });

  it('still explains what the class means', () => {
    render(<DisclosureNotice locale="en" shown="assessment" />);

    expect(screen.getByText(disclosureClassView('assessment').meaning.en)).toBeInTheDocument();
  });

  it('omits an empty withheld list rather than rendering an empty heading', () => {
    render(<DisclosureNotice locale="en" shown="information" withheld={[]} remedy={[]} />);

    expect(screen.queryByRole('heading', { name: 'Not shown on this page' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'What would change this' })).toBeNull();
  });
});

describe('the three classes', () => {
  it('describe themselves without any of them implying a prediction', () => {
    expect(disclosureClassView('information').meaning.en).toContain('not applied to your facts');
    expect(disclosureClassView('assessment').meaning.en).toContain('not a recommendation');
    expect(disclosureClassView('advice').meaning.en).toContain('regulated act');
  });

  it('is authored in both languages', () => {
    for (const value of ['information', 'assessment', 'advice'] as const) {
      const view = disclosureClassView(value);
      expect(view.label.es.length).toBeGreaterThan(0);
      expect(view.meaning.es).not.toBe(view.meaning.en);
    }
  });
});

// ---------------------------------------------------------------------------
// The gate itself
// ---------------------------------------------------------------------------

describe('the release gate on the worked matters', () => {
  it('withholds the ranking from an applicant with no representative, and gives a reason', () => {
    for (const sample of SAMPLE_MATTERS) {
      const release = releaseRecommendationFor(sample, MERIDIAN_PATHWAY_CATALOG, AS_OF);

      expect(release.released.allowed, `${sample.matter.id} released a recommendation`).toBe(false);
      if (release.released.allowed) continue;
      expect(release.released.decision.allowed).toBe(false);
      if (release.released.decision.allowed) continue;
      expect(release.released.decision.reason.length).toBeGreaterThan(0);
      // What survives is an assessment, not nothing.
      expect(release.released.value.classification).toBe('assessment');
    }
  });

  it('holds every route out of the ranking on the catalog gate as well', () => {
    // Attaching a representative would not produce a recommendation here: no
    // record in the shipped catalog is counsel-reviewed. Both gates are real
    // and the page states both.
    for (const sample of SAMPLE_MATTERS) {
      const release = releaseRecommendationFor(sample, MERIDIAN_PATHWAY_CATALOG, AS_OF);

      expect(release.counselReviewedCount).toBe(0);
      expect(release.catalogSize).toBeGreaterThan(0);
    }
  });

  it('assesses the reader’s own facts on both branches of the union', () => {
    // The downgrade removes the opinion, not the record.
    const sample = SAMPLE_MATTERS[0];
    if (sample === undefined) throw new Error('no worked matters');
    const release = releaseRecommendationFor(sample, MERIDIAN_PATHWAY_CATALOG, AS_OF);

    expect(release.released.value.value.assessments.length).toBeGreaterThan(0);
  });

  it('states what is kept as specifically as what is lost', () => {
    // Overstating the loss is its own failure: a reader who thinks the whole
    // record was withheld stops reading the part they still have.
    expect(RETAINED_AFTER_DOWNGRADE.length).toBeGreaterThan(0);
    for (const item of [...RETAINED_AFTER_DOWNGRADE, ...WITHHELD_FROM_RECOMMENDATION]) {
      expect(item.en.length).toBeGreaterThan(20);
      expect(item.es).not.toBe(item.en);
    }
  });

  it('names the ordering, the "which route" answer and the odds as the things withheld', () => {
    const withheld = WITHHELD_FROM_RECOMMENDATION.map((w) => w.en).join(' ');

    expect(withheld).toContain('ordering');
    expect(withheld).toContain('which route you should pursue');
    expect(withheld).toContain('chance that an application would succeed');
  });
});

describe('a notice with no reason to give', () => {
  it('renders a class it was handed even when nothing was withheld', () => {
    render(<DisclosureNotice locale="en" shown="information" withheld={[bi('nothing', 'nada')]} />);

    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });
});
