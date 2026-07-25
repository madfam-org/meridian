import { isoDate, type AuthorizedRepresentative, type ReleaseContext } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import { esNationalityResidenceReduced, MERIDIAN_PATHWAY_CATALOG } from '../src/catalog/index.js';
import {
  assess,
  downgradeToAssessment,
  recommend,
  releaseRecommendation,
} from '../src/recommend.js';
import type { Pathway } from '../src/schema.js';
import { mexicanTwoYearResident, TODAY } from './fixtures.js';

/** The same rules, with a named human on the record. Nothing else changes. */
const reviewedReduced: Pathway = {
  ...esNationalityResidenceReduced,
  reviewStatus: 'counsel_reviewed',
  reviewedBy: 'fixture-counsel-1',
  reviewedOn: isoDate('2026-07-20'),
};

const reviewedButStale: Pathway = {
  ...esNationalityResidenceReduced,
  reviewStatus: 'needs_reverification',
  reviewedBy: 'fixture-counsel-1',
  reviewedOn: isoDate('2024-01-01'),
};

describe('the review gate', () => {
  it('refuses to rank any pathway in the shipped catalog, because none is counsel-reviewed', () => {
    const result = recommend(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(result.classification).toBe('advice');
    expect(result.value.ranked).toEqual([]);
    expect(result.value.excluded).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
    for (const excluded of result.value.excluded) {
      expect(excluded.code).toBe('not_counsel_reviewed');
    }
  });

  it('explains each exclusion instead of silently dropping the pathway', () => {
    const result = recommend(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY);
    const reduced = result.value.excluded.find(
      (e) => e.pathwayId === 'es-nationality-residence-reduced',
    );
    expect(reduced?.reason).toContain('unreviewed');
    expect(reduced?.reason).toContain('assessment');
  });

  it('still assesses every pathway, including the ones it will not recommend', () => {
    const result = recommend(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(result.value.assessments).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
    const reduced = result.value.assessments.find(
      (a) => a.pathwayId === 'es-nationality-residence-reduced',
    );
    expect(reduced?.verdict).toBe('eligible');
  });

  it('ranks a pathway once counsel has signed off on it', () => {
    const result = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    expect(result.value.ranked).toHaveLength(1);
    expect(result.value.ranked[0]?.pathwayId).toBe('es-nationality-residence-reduced');
    expect(result.value.ranked[0]?.rank).toBe(1);
    expect(result.value.ranked[0]?.rationale).toContain('blocking criteria');
  });

  it('treats needs_reverification exactly like unreviewed — a stale review is not a review', () => {
    const result = recommend(mexicanTwoYearResident, [reviewedButStale], TODAY);
    expect(result.value.ranked).toEqual([]);
    expect(result.value.excluded[0]?.code).toBe('not_counsel_reviewed');
  });

  it('holds a closed pathway out of the ranking even when it is reviewed', () => {
    const closedButReviewed: Pathway = {
      ...MERIDIAN_PATHWAY_CATALOG.filter((p) => p.id === 'es-golden-visa')[0]!,
      reviewStatus: 'counsel_reviewed',
      reviewedBy: 'fixture-counsel-1',
      reviewedOn: isoDate('2026-07-20'),
    };
    const result = recommend(mexicanTwoYearResident, [closedButReviewed], TODAY);
    expect(result.value.ranked).toEqual([]);
    expect(result.value.excluded[0]?.code).toBe('not_open');
  });
});

describe('ranking', () => {
  const reviewed = (p: Pathway): Pathway => ({
    ...p,
    reviewStatus: 'counsel_reviewed',
    reviewedBy: 'fixture-counsel-1',
    reviewedOn: isoDate('2026-07-20'),
  });

  const openReviewedCatalog = MERIDIAN_PATHWAY_CATALOG.filter(
    (p) => p.status === 'open' && p.jurisdiction === 'ES',
  ).map(reviewed);

  it('puts eligible ahead of indeterminate and both ahead of anything requiring review', () => {
    const result = recommend(mexicanTwoYearResident, openReviewedCatalog, TODAY);
    const verdicts = result.value.ranked.map((r) => r.report.verdict);
    const order = ['eligible', 'indeterminate', 'requires_human_review'];
    const positions = verdicts.map((v) => order.indexOf(v));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('numbers ranks contiguously from one', () => {
    const result = recommend(mexicanTwoYearResident, openReviewedCatalog, TODAY);
    expect(result.value.ranked.map((r) => r.rank)).toEqual(
      result.value.ranked.map((_, i) => i + 1),
    );
  });

  it('produces the same order regardless of the order the catalog arrives in', () => {
    const forwards = recommend(mexicanTwoYearResident, openReviewedCatalog, TODAY);
    const backwards = recommend(mexicanTwoYearResident, [...openReviewedCatalog].reverse(), TODAY);
    expect(forwards.value.ranked.map((r) => r.pathwayId)).toEqual(
      backwards.value.ranked.map((r) => r.pathwayId),
    );
  });

  it('never emits a score, a probability or a prediction of success', () => {
    // A number like "78% likely to be granted" would be a prediction of
    // outcome — the most heavily regulated thing an unlicensed adviser can
    // say — and fabricated besides, since no authority publishes the data that
    // would make it true. The ranking carries an ordinal position and a reason,
    // and nothing else.
    const result = recommend(mexicanTwoYearResident, openReviewedCatalog, TODAY);
    const serialised = JSON.stringify(result.value.ranked);
    expect(serialised).not.toMatch(/"score"|"probability"|"likelihood"|"successRate"|"odds"/);
    for (const recommendation of result.value.ranked) {
      expect(recommendation.rationale).not.toMatch(/%|likely|probably|chance|guarantee/i);
      expect(Object.keys(recommendation).sort()).toEqual([
        'pathwayId',
        'rank',
        'rationale',
        'report',
      ]);
    }
  });
});

describe('downgrading', () => {
  it('drops the ranking and the rationale but keeps every assessment', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const safe = downgradeToAssessment(advice.value);
    expect(safe.classification).toBe('assessment');
    expect(safe.value.assessments).toHaveLength(1);
    expect(JSON.stringify(safe.value)).not.toContain('rationale');
    expect(JSON.stringify(safe.value)).not.toContain('"rank"');
  });

  it('keeps the citations, so the reader can still check the source', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const safe = downgradeToAssessment(advice.value);
    expect(safe.citationIds).toContain('es-cc-art-22-1');
  });

  it('assess() produces the same neutral form without building a ranking first', () => {
    const direct = assess(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const viaAdvice = downgradeToAssessment(
      recommend(mexicanTwoYearResident, [reviewedReduced], TODAY).value,
    );
    expect(direct.classification).toBe('assessment');
    expect(direct.value).toEqual(viaAdvice.value);
  });

  it('preserves the catalog order rather than an outcome order', () => {
    const catalog = MERIDIAN_PATHWAY_CATALOG;
    const safe = assess(mexicanTwoYearResident, catalog, TODAY);
    expect(safe.value.assessments.map((a) => a.pathwayId)).toEqual(catalog.map((p) => p.id));
  });
});

describe('release gate', () => {
  const spanishAbogado: AuthorizedRepresentative = {
    id: 'rep-es-1',
    jurisdiction: 'ES',
    credential: 'spanish_abogado',
    licenceNumber: 'FIXTURE-0001',
    verifiedOn: '2026-07-01',
  };

  const context = (over: Partial<ReleaseContext>): ReleaseContext => ({
    audience: 'applicant',
    jurisdiction: 'ES',
    representative: null,
    forConsideration: true,
    asOf: TODAY,
    ...over,
  });

  it('downgrades advice to an applicant with no representative attached', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const released = releaseRecommendation(advice, context({}));
    expect(released.allowed).toBe(false);
    if (!released.allowed) {
      expect(released.value.classification).toBe('assessment');
      expect(released.decision.allowed).toBe(false);
    }
  });

  it('releases advice to a practitioner, who is the professional in the loop', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const released = releaseRecommendation(advice, context({ audience: 'practitioner' }));
    expect(released.allowed).toBe(true);
    if (released.allowed) expect(released.value.classification).toBe('advice');
  });

  it('releases advice to an applicant once a live representative in the jurisdiction is attached', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const released = releaseRecommendation(
      advice,
      context({ representative: spanishAbogado }),
    );
    expect(released.allowed).toBe(true);
  });

  it('does not accept a representative licensed in the wrong jurisdiction', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const released = releaseRecommendation(
      advice,
      context({ representative: { ...spanishAbogado, jurisdiction: 'CA' } }),
    );
    expect(released.allowed).toBe(false);
  });

  it('does not accept an expired credential', () => {
    const advice = recommend(mexicanTwoYearResident, [reviewedReduced], TODAY);
    const released = releaseRecommendation(
      advice,
      context({ representative: { ...spanishAbogado, expiresOn: '2026-01-01' } }),
    );
    expect(released.allowed).toBe(false);
  });
});
