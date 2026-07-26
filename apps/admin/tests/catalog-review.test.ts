/**
 * The review queue.
 *
 * `recommend()` refuses to rank a pathway that is not `counsel_reviewed`, and
 * every record in the shipped catalog is `unreviewed`. That makes this the
 * narrowest point in the product, and it makes one property load-bearing above
 * all the others: nothing here may ever imply that an unreviewed record can be
 * used for advice.
 *
 * The negative citation age is the other one. Asked about a date before a
 * citation was verified — which the as-at control makes trivially easy — the age
 * is genuinely negative, and clamping it would render a record as freshly
 * checked on a date when nobody had checked it.
 */

import { isoDate } from '@meridian/core';
import { MERIDIAN_PATHWAY_CATALOG, isCounselReviewed } from '@meridian/pathways';
import { describe, expect, it } from 'vitest';
import {
  orderQueue,
  previewSignOff,
  queueTotals,
  reverificationQueue,
  reviewQueue,
} from '@/lib/catalog-review';
import { ASOF, citation, matterRecord, pathway } from './fixtures';

/** Citation ages measured back from `ASOF`, so the bands are pinned. */
const FRESH = citation({ id: 'fx-fresh', verifiedOn: isoDate('2026-07-01') }); // 25d
const AGING = citation({ id: 'fx-aging', verifiedOn: isoDate('2026-03-01') }); // 147d
const STALE = citation({ id: 'fx-stale', verifiedOn: isoDate('2025-01-01') }); // 571d

describe('reviewQueue', () => {
  it('bands each citation and reports the worst one for the record', () => {
    const record = pathway({ citations: [FRESH, AGING, STALE] });
    const [review] = reviewQueue([record], [], ASOF).reviews;
    expect(review?.citations.map((c) => c.band)).toEqual(['fresh', 'aging', 'stale']);
    expect(review?.worstBand).toBe('stale');
    expect(review?.staleCount).toBe(1);
    expect(review?.agingCount).toBe(1);
  });

  it('marks a citation nothing cites as unreferenced', () => {
    // An unreferenced citation is provenance that supports no rule. The linter
    // warns about it; the queue has to show the reviewer which one.
    const record = pathway({ citations: [FRESH, AGING] });
    const [review] = reviewQueue([record], [], ASOF).reviews;
    expect(review?.citations.find((c) => c.citation.id === 'fx-fresh')?.referenced).toBe(true);
    expect(review?.citations.find((c) => c.citation.id === 'fx-aging')?.referenced).toBe(false);
  });

  it('does not clamp a negative citation age to zero', () => {
    // Asked about a date before the citation was verified, nobody had checked
    // it yet. Flooring the age at zero would say it was freshly checked.
    const record = pathway({ citations: [FRESH] });
    const [review] = reviewQueue([record], [], isoDate('2025-04-02')).reviews;
    expect(review?.oldestCitationAgeDays).toBeLessThan(0);
    expect(review?.worstBand).toBe('fresh');
  });

  it('reports the status as at the reference date, not the stored status', () => {
    // The catalog is answerable about the past on purpose: a route that opened
    // in 2026 was not open in 2025, and a console that cannot say so cannot
    // explain a decision taken before it opened.
    const record = pathway({ openedOn: isoDate('2026-01-01') });
    const [asked2025] = reviewQueue([record], [], isoDate('2025-04-02')).reviews;
    const [asked2026] = reviewQueue([record], [], ASOF).reviews;
    expect(asked2025?.notYetOpen).toBe(true);
    expect(asked2026?.notYetOpen).toBe(false);
  });

  it('counts criteria by weight and names the ones no software can decide', () => {
    const record = pathway({
      citations: [FRESH],
      criteria: [
        {
          id: 'c-blocking',
          label: { en: 'Adult', es: 'Mayor de edad' },
          kind: 'procedural',
          citationIds: ['fx-fresh'],
          evaluator: { op: 'gte', path: 'ageYears', value: 18 },
          weight: 'blocking',
        },
        {
          id: 'c-human',
          label: { en: 'Good character', es: 'Buena conducta' },
          kind: 'character',
          citationIds: ['fx-fresh'],
          evaluator: { op: 'is_present', path: 'applicantId' },
          weight: 'material',
          requiresHumanReview: true,
          humanReviewReason: { en: 'Discretionary.', es: 'Discrecional.' },
        },
      ],
    });
    const [review] = reviewQueue([record], [], ASOF).reviews;
    expect(review?.counts).toEqual({ blocking: 1, material: 1, informational: 0 });
    expect(review?.escalatingCriterionIds).toEqual(['c-human']);
  });

  it('attaches the linter’s own findings to the record they name', () => {
    // A stale citation is a warning the reviewer has to see before signing.
    const record = pathway({ id: 'es-stale-route', citations: [STALE] });
    const { reviews, validation } = reviewQueue([record], [], ASOF);
    expect(validation.issues.some((i) => i.code === 'citation_stale')).toBe(true);
    expect(reviews[0]?.issues.every((i) => i.pathwayId === 'es-stale-route')).toBe(true);
    expect((reviews[0]?.errorCount ?? 0) + (reviews[0]?.warningCount ?? 0)).toBe(
      reviews[0]?.issues.length,
    );
  });

  it('attaches the firm’s live matters to the record they rest on', () => {
    const record = pathway({ id: 'es-fixture-route' });
    const matters = [
      matterRecord({ matter: { id: 'm1', pathwayId: 'es-fixture-route' } }),
      matterRecord({ matter: { id: 'm2', pathwayId: 'es-other-route' } }),
    ];
    const [review] = reviewQueue([record], matters, ASOF).reviews;
    expect(review?.liveMatters.map((m) => m.matter.id)).toEqual(['m1']);
  });
});

describe('orderQueue', () => {
  it('puts unreviewed records above reviewed ones whatever the caseload says', () => {
    // A bottleneck queue exists to surface the bottleneck. A reviewed record
    // carrying eight files is not the bottleneck; an unreviewed one is.
    const reviewed = pathway({
      id: 'es-signed-route',
      reviewStatus: 'counsel_reviewed',
      reviewedBy: 'Fixture Counsel',
      reviewedOn: isoDate('2026-07-01'),
    });
    const unreviewed = pathway({ id: 'es-open-route' });
    const matters = [
      matterRecord({ matter: { id: 'm1', pathwayId: 'es-signed-route' } }),
      matterRecord({ matter: { id: 'm2', pathwayId: 'es-signed-route' } }),
    ];
    const { reviews } = reviewQueue([reviewed, unreviewed], matters, ASOF);
    expect(orderQueue(reviews).map((r) => r.pathway.id)).toEqual([
      'es-open-route',
      'es-signed-route',
    ]);
  });

  it('is not ordered by how ready a record looks', () => {
    // Sorting by readiness puts the easy ones on top and buries the record the
    // caseload depends on. Live matters decide, then error count, then id.
    const clean = pathway({ id: 'es-clean-route' });
    const loaded = pathway({ id: 'es-loaded-route', citations: [STALE] });
    const matters = [
      matterRecord({ matter: { id: 'm1', pathwayId: 'es-loaded-route' } }),
      matterRecord({ matter: { id: 'm2', pathwayId: 'es-loaded-route' } }),
      matterRecord({ matter: { id: 'm3', pathwayId: 'es-clean-route' } }),
    ];
    const { reviews } = reviewQueue([clean, loaded], matters, ASOF);
    expect(orderQueue(reviews).map((r) => r.pathway.id)).toEqual([
      'es-loaded-route',
      'es-clean-route',
    ]);
  });

  it('is total and does not mutate its input', () => {
    const a = pathway({ id: 'es-alpha-route' });
    const b = pathway({ id: 'es-beta-route' });
    const { reviews } = reviewQueue([a, b], [], ASOF);
    const input = [...reviews].reverse();
    expect(orderQueue(input).map((r) => r.pathway.id)).toEqual([
      'es-alpha-route',
      'es-beta-route',
    ]);
    expect(input.map((r) => r.pathway.id)).toEqual(['es-beta-route', 'es-alpha-route']);
  });
});

describe('queueTotals', () => {
  it('counts records and citations separately and never summarises readiness', () => {
    const one = pathway({ id: 'es-one-route', citations: [FRESH, STALE] });
    const two = pathway({
      id: 'es-two-route',
      citations: [citation({ id: 'fx-disc', verifiedOn: isoDate('2026-03-01'), discretionary: true })],
      criteria: [
        {
          id: 'fx-adult',
          label: { en: 'Adult', es: 'Mayor de edad' },
          kind: 'procedural',
          citationIds: ['fx-disc'],
          evaluator: { op: 'gte', path: 'ageYears', value: 18 },
          weight: 'blocking',
        },
      ],
      durations: { citationIds: ['fx-disc'] },
    });
    const totals = queueTotals(reviewQueue([one, two], [], ASOF).reviews);
    expect(totals.pathways).toBe(2);
    expect(totals.reviewed).toBe(0);
    expect(totals.unreviewed).toBe(2);
    expect(totals.citations).toBe(3);
    expect(totals.staleCitations).toBe(1);
    expect(totals.agingCitations).toBe(1);
    expect(totals.withStaleCitations).toBe(1);
    expect(totals.discretionaryCitations).toBe(1);
  });

  it('counts needs_reverification apart from unreviewed', () => {
    // Different meanings: nobody has read it, versus somebody read it and the
    // sources have since moved. Collapsing them loses the second one.
    const record = pathway({ reviewStatus: 'needs_reverification' });
    const totals = queueTotals(reviewQueue([record], [], ASOF).reviews);
    expect(totals.unreviewed).toBe(0);
    expect(totals.needsReverification).toBe(1);
    expect(totals.reviewed).toBe(0);
  });
});

describe('the shipped catalog', () => {
  it('has no record eligible to enter a recommendation', () => {
    // The live state, not a placeholder. If this ever fails, either a record
    // was signed off — in which case the queue's own copy has to change — or
    // something started reporting an unreviewed record as reviewed.
    const totals = queueTotals(reviewQueue(MERIDIAN_PATHWAY_CATALOG, [], ASOF).reviews);
    expect(totals.pathways).toBeGreaterThan(0);
    expect(totals.reviewed).toBe(0);
    expect(totals.unreviewed + totals.needsReverification).toBe(totals.pathways);
    expect(MERIDIAN_PATHWAY_CATALOG.some(isCounselReviewed)).toBe(false);
  });

  it('validates without integrity errors as at today', () => {
    const { validation } = reviewQueue(MERIDIAN_PATHWAY_CATALOG, [], ASOF);
    expect(validation.issues.filter((i) => i.severity === 'error')).toEqual([]);
  });
});

describe('reverificationQueue', () => {
  it('lists only what is not fresh, worst first', () => {
    const one = pathway({ id: 'es-one-route', citations: [FRESH, AGING] });
    const two = pathway({ id: 'es-two-route', citations: [STALE] });
    const items = reverificationQueue(reviewQueue([one, two], [], ASOF).reviews);
    expect(items.map((i) => i.standing.citation.id)).toEqual(['fx-stale', 'fx-aging']);
  });

  it('counts the same instrument once per record that declares it', () => {
    // Two records citing the same statute are two records to re-verify.
    // Collapsing them would understate the work.
    const one = pathway({ id: 'es-one-route', citations: [STALE] });
    const two = pathway({ id: 'es-two-route', citations: [STALE] });
    const items = reverificationQueue(reviewQueue([one, two], [], ASOF).reviews);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.pathwayId)).toEqual(['es-one-route', 'es-two-route']);
  });

  it('is empty when everything has been checked recently', () => {
    expect(reverificationQueue(reviewQueue([pathway()], [], ASOF).reviews)).toEqual([]);
  });
});

describe('previewSignOff', () => {
  const catalog = [pathway()];

  it('will not accept a sign-off with nobody’s name on it', () => {
    // An unattributed review is not a review; the schema refuses it too. The
    // candidate check cannot even be evaluated, so it is `null` rather than
    // false — a check that did not run must not read as a check that passed.
    const preview = previewSignOff(catalog, pathway(), '   ', ASOF, 'en');
    expect(preview.reviewedBy).toBeNull();
    expect(preview.patch).toBeNull();
    expect(preview.wouldBeAccepted).toBe(false);
    expect(preview.checks.find((c) => c.id === 'reviewer_named')?.met).toBe(false);
    expect(preview.checks.find((c) => c.id === 'candidate_validates')?.met).toBeNull();
  });

  it('accepts a clean record with a named reviewer, and shows the exact patch', () => {
    // The console has no write path into the catalog. What it can do is
    // construct the change and say whether CI would take it.
    const preview = previewSignOff(catalog, pathway(), ' Counsel Fixture ', ASOF, 'en');
    expect(preview.reviewedBy).toBe('Counsel Fixture');
    expect(preview.wouldBeAccepted).toBe(true);
    expect(preview.patch).toEqual({
      reviewStatus: 'counsel_reviewed',
      reviewedBy: 'Counsel Fixture',
      reviewedOn: ASOF,
    });
    expect(preview.candidateErrors).toEqual([]);
  });

  it('refuses a sign-off resting on a stale citation, through the real linter', () => {
    // `counsel_review_stale` is exactly the check a hand-rolled readiness
    // screen forgets: the record passes today and the signature is invalid.
    const stale = pathway({ id: 'es-stale-route', citations: [STALE] });
    const preview = previewSignOff([stale], stale, 'Counsel Fixture', ASOF, 'en');
    expect(preview.checks.find((c) => c.id === 'no_stale_citations')?.met).toBe(false);
    expect(preview.wouldBeAccepted).toBe(false);
    expect(preview.candidateErrors.map((i) => i.code)).toContain('counsel_review_stale');
    expect(preview.checks.find((c) => c.id === 'candidate_validates')?.detail).toContain(
      'counsel_review_stale',
    );
  });

  it('refuses to sign off a record that is already signed off', () => {
    const signed = pathway({
      reviewStatus: 'counsel_reviewed',
      reviewedBy: 'Earlier Counsel',
      reviewedOn: isoDate('2026-06-01'),
    });
    const preview = previewSignOff([signed], signed, 'Counsel Fixture', ASOF, 'en');
    const check = preview.checks.find((c) => c.id === 'not_already_reviewed');
    expect(check?.met).toBe(false);
    expect(check?.detail).toContain('Earlier Counsel');
    expect(preview.wouldBeAccepted).toBe(false);
  });

  it('quotes the catalog’s own status token rather than translating it', () => {
    // The reviewer is going to type it into a TypeScript file.
    const en = previewSignOff(catalog, pathway(), 'Counsel Fixture', ASOF, 'en');
    const es = previewSignOff(catalog, pathway(), 'Counsel Fixture', ASOF, 'es');
    for (const preview of [en, es]) {
      expect(preview.checks.find((c) => c.id === 'not_already_reviewed')?.detail).toContain(
        'unreviewed',
      );
    }
  });

  it('writes its labels in the reader’s language', () => {
    const en = previewSignOff(catalog, pathway(), 'Counsel Fixture', ASOF, 'en');
    const es = previewSignOff(catalog, pathway(), 'Counsel Fixture', ASOF, 'es');
    expect(es.checks.map((c) => c.id)).toEqual(en.checks.map((c) => c.id));
    expect(es.checks.map((c) => c.label)).not.toEqual(en.checks.map((c) => c.label));
    for (const check of es.checks) expect(check.label.length).toBeGreaterThan(0);
  });
});
