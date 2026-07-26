/**
 * The United States employment-based preferences, EB-1 through EB-5.
 *
 * Three properties are worth a test each, and all three are about refusing to
 * answer.
 *
 * **The discretionary standards never produce an outcome.** Extraordinary
 * ability, exceptional ability, specialized knowledge of a national interest —
 * each is a two-step or final-merits determination made by a named adjudicator
 * on a whole evidentiary record. A checklist cannot green-tick any of them, so
 * each sits behind an unconditional escalation with the regulatory criteria in
 * the guidance and the structure of the determination in the reason.
 *
 * **A criterion this model cannot measure must not be able to refuse.** The
 * EB-2 advanced-degree test is `material` rather than `blocking` precisely
 * because exceptional ability is an independent route into the same preference,
 * and an `ineligible` on the degree branch would be shutting a door that is
 * open.
 *
 * **No number that rots.** The 140,000 annual level, the 7 per cent per-country
 * limit and the strict priority-date order are structure and are encoded. A
 * priority date, a cut-off, a queue position or a wait estimate is not, and the
 * one figure the block does carry — the EB-5 capital minimum — is carried
 * because Congress put it in the statute, with the vacated regulation that
 * contradicts it cited explicitly so a reader who finds that paragraph is not
 * misled by it.
 */

import { describe, expect, it } from 'vitest';
import {
  US_EMPLOYMENT_PATHWAYS,
  usEb1aExtraordinaryAbility,
  usEb1bOutstandingProfessorResearcher,
  usEb1cMultinationalManagerExecutive,
  usEb2AdvancedDegreeExceptionalAbility,
  usEb2NationalInterestWaiver,
  usEb3OtherWorker,
  usEb3Professional,
  usEb3SkilledWorker,
  usEb4SpecialImmigrantReligiousWorker,
  usEb5ImmigrantInvestor,
} from '../src/catalog/us-employment.js';
import { evaluate } from '../src/evaluate.js';
import { MX, TODAY, usEmploymentSponsored } from './fixtures.js';

/** The routes that carry their own labor-certification requirement. */
const WITH_LABOR_CERTIFICATION = [
  { pathway: usEb2AdvancedDegreeExceptionalAbility, criterion: 'us-eb2-labor-certification' },
  { pathway: usEb3SkilledWorker, criterion: 'us-eb3-skilled-labor-certification' },
  { pathway: usEb3Professional, criterion: 'us-eb3-professional-labor-certification' },
  { pathway: usEb3OtherWorker, criterion: 'us-eb3-other-labor-certification' },
] as const;

/** The routes that are exempt, each of which says so as a first-class criterion. */
const WITHOUT_LABOR_CERTIFICATION = [
  { pathway: usEb1aExtraordinaryAbility, criterion: 'us-eb1a-no-labor-certification' },
  { pathway: usEb1bOutstandingProfessorResearcher, criterion: 'us-eb1b-no-labor-certification' },
  { pathway: usEb1cMultinationalManagerExecutive, criterion: 'us-eb1c-no-labor-certification' },
  {
    pathway: usEb2NationalInterestWaiver,
    criterion: 'us-niw-no-job-offer-or-labor-certification',
  },
  { pathway: usEb4SpecialImmigrantReligiousWorker, criterion: 'us-eb4-no-labor-certification' },
  { pathway: usEb5ImmigrantInvestor, criterion: 'us-eb5-no-employer-and-no-labor-certification' },
] as const;

describe('the discretionary standards never produce an outcome', () => {
  const alwaysHuman = [
    { pathway: usEb1aExtraordinaryAbility, criterion: 'us-eb1a-sustained-acclaim' },
    { pathway: usEb1bOutstandingProfessorResearcher, criterion: 'us-eb1b-international-recognition' },
    { pathway: usEb2AdvancedDegreeExceptionalAbility, criterion: 'us-eb2-exceptional-ability' },
    { pathway: usEb2NationalInterestWaiver, criterion: 'us-niw-national-interest' },
  ] as const;

  it('escalates unconditionally and explains what the adjudicator decides', () => {
    for (const { pathway, criterion } of alwaysHuman) {
      const target = pathway.criteria.find((c) => c.id === criterion);
      expect(target, `${pathway.id} lost ${criterion}`).toBeDefined();
      expect(target?.requiresHumanReview).toBe(true);
      expect(target?.humanReviewReason?.en.trim().length ?? 0).toBeGreaterThan(0);
      expect(target?.humanReviewReason?.es.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('marks the underlying source discretionary so a report says so out loud', () => {
    // `evaluate` emits a `discretionary_source` note for every criterion resting
    // on one. That is how a reader learns the threshold is a judgement rather
    // than a line in a statute.
    for (const { pathway, criterion } of alwaysHuman) {
      const report = evaluate(pathway, usEmploymentSponsored, TODAY);
      const notes = report.notes.filter(
        (n) => n.code === 'discretionary_source' && n.criterionId === criterion,
      );
      expect(notes.length, `${criterion} rests on nothing discretionary`).toBeGreaterThan(0);
    }
  });

  it('carries the three Dhanasar prongs and the separate discretionary act for the waiver', () => {
    const criterion = usEb2NationalInterestWaiver.criteria.find(
      (c) => c.id === 'us-niw-national-interest',
    );
    const reason = criterion?.humanReviewReason?.en ?? '';
    expect(reason).toContain('Three prongs');
    expect(reason).toContain('substantial merit and national importance');
    expect(reason).toContain('well positioned');
    // The fourth step people forget: even three satisfied prongs leave a
    // separate discretionary judgement, and no probability may be stated.
    expect(reason).toContain('separate discretionary judgement');
    expect(reason).toContain('no probability of success');

    // The framework is administrative precedent, not statute, and is cited as
    // such — `discretionary: true`, so a report says so.
    const dhanasar = usEb2NationalInterestWaiver.citations.find(
      (c) => c.id === 'us-eb-matter-of-dhanasar',
    );
    expect(dhanasar?.kind).toBe('case_law');
    expect(dhanasar?.provision).toContain('Matter of Dhanasar');
    expect(dhanasar?.discretionary).toBe(true);
    expect(criterion?.citationIds).toContain('us-eb-matter-of-dhanasar');
  });

  it('routes every record to a person on the facts this model can hold', () => {
    for (const pathway of US_EMPLOYMENT_PATHWAYS) {
      expect(evaluate(pathway, usEmploymentSponsored, TODAY).verdict).toBe(
        'requires_human_review',
      );
    }
  });
});

describe('a criterion this model cannot measure must not be able to refuse', () => {
  it('keeps the EB-2 advanced-degree test material, so it never says ineligible', () => {
    // Exceptional ability is an independent route into the same preference and
    // is not measurable here. A blocking weight on the degree branch would slam
    // a door the statute leaves open.
    const degree = usEb2AdvancedDegreeExceptionalAbility.criteria.find(
      (c) => c.id === 'us-eb2-advanced-degree',
    );
    expect(degree?.weight).toBe('material');

    const withoutDegree = evaluate(
      usEb2AdvancedDegreeExceptionalAbility,
      { ...usEmploymentSponsored, educationLevel: 'secondary' },
      TODAY,
    );
    expect(withoutDegree.materialFailures).toContain('us-eb2-advanced-degree');
    expect(withoutDegree.blockingFailures).not.toContain('us-eb2-advanced-degree');
    expect(withoutDegree.verdict).not.toBe('ineligible');
  });

  it('still refuses on a bright line the model does hold', () => {
    // § 1153(b)(2)(A) requires the services to be sought by a United States
    // employer. That is a fact, not a judgement, and it decides.
    const report = evaluate(
      usEb2AdvancedDegreeExceptionalAbility,
      { ...usEmploymentSponsored, jobOffer: { ...usEmploymentSponsored.jobOffer, employerCountry: MX } },
      TODAY,
    );
    expect(report.blockingFailures).toContain('us-eb2-services-sought-by-a-united-states-employer');
  });

  it('escalates the EB-1C qualifying year rather than reading it off a bare period', () => {
    // `WorkExperience` carries a country and a period but no employer, so "the
    // same firm, affiliate or subsidiary" is not expressible at all. The
    // criterion is `material` and unconditional, which leaves it unable to
    // refuse and unable to approve.
    const criterion = usEb1cMultinationalManagerExecutive.criteria.find(
      (c) => c.id === 'us-eb1c-qualifying-year-abroad',
    );
    expect(criterion?.weight).toBe('material');
    expect(criterion?.requiresHumanReview).toBe(true);
  });

  it('records that EB-1C excludes a new office, where the L-1A it mirrors does not', () => {
    const reason =
      usEb1cMultinationalManagerExecutive.criteria.find(
        (c) => c.id === 'us-eb1c-managerial-or-executive-job-offer',
      )?.humanReviewReason?.en ?? '';
    expect(reason).toMatch(/new office/i);
  });
});

describe('the labor-certification split is encoded, not implied', () => {
  it('states which side of § 1182(a)(5)(A) each route sits on', () => {
    for (const { pathway, criterion } of WITH_LABOR_CERTIFICATION) {
      const target = pathway.criteria.find((c) => c.id === criterion);
      expect(target, `${pathway.id} lost ${criterion}`).toBeDefined();
      expect(target?.weight).toBe('blocking');
      // The state of a labor certification — filed, certified, expired — is not
      // in the facts model, so the requirement escalates rather than assuming
      // one exists.
      expect(target?.requiresHumanReview).toBe(true);
    }

    for (const { pathway, criterion } of WITHOUT_LABOR_CERTIFICATION) {
      const target = pathway.criteria.find((c) => c.id === criterion);
      expect(target, `${pathway.id} lost ${criterion}`).toBeDefined();
      expect(target?.weight).toBe('informational');
      expect(target?.requiresHumanReview).toBeUndefined();
    }
  });

  it('gives every record exactly one statement about labor certification', () => {
    const named = new Set<string>([
      ...WITH_LABOR_CERTIFICATION.map((e) => e.pathway.id),
      ...WITHOUT_LABOR_CERTIFICATION.map((e) => e.pathway.id),
    ]);
    expect(named.size).toBe(US_EMPLOYMENT_PATHWAYS.length);
  });
});

describe('numbers that would rot, and the one that would not', () => {
  it('quotes no priority date, cut-off date or waiting estimate anywhere', () => {
    const cutOff = /\b\d{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}\b/;
    for (const pathway of US_EMPLOYMENT_PATHWAYS) {
      const text = [
        pathway.durations.note?.en,
        pathway.durations.note?.es,
        ...pathway.criteria.flatMap((c) => [
          c.guidance?.en,
          c.guidance?.es,
          c.humanReviewReason?.en,
          c.humanReviewReason?.es,
        ]),
        ...pathway.citations.map((c) => c.note),
      ].filter((s): s is string => typeof s === 'string');
      for (const value of text) {
        expect(value, `${pathway.id} quotes a Visa Bulletin cut-off`).not.toMatch(cutOff);
      }
      expect(pathway.durations.publishedProcessingDays).toBeUndefined();
    }
  });

  it('cites the Visa Bulletin on every record, with no URL and a warning in the note', () => {
    for (const pathway of US_EMPLOYMENT_PATHWAYS) {
      const bulletin = pathway.citations.find((c) => c.id === 'us-eb-visa-bulletin');
      expect(bulletin, `${pathway.id} does not cite the bulletin`).toBeDefined();
      expect(bulletin?.url).toBeUndefined();
      expect(bulletin?.discretionary).toBe(true);
      expect(bulletin?.note ?? '').toContain('NO FIGURE FROM IT IS RECORDED');
    }
  });

  it('encodes the statutory EB-5 amounts and names the regulation that contradicts them', () => {
    // 8 CFR 204.6(f) still states $1,800,000 / $900,000 from a 2019 rule that
    // USCIS records as vacated and that was never conformed to what Congress
    // enacted in 2022. The catalog encodes the statute and cites the dead
    // paragraph so a reader who finds it is not misled.
    const capital = usEb5ImmigrantInvestor.criteria.find((c) => c.id === 'us-eb5-minimum-capital');
    const evaluator = capital?.evaluator;
    expect(evaluator?.op).toBe('all_of');
    const clauses = evaluator !== undefined && evaluator.op === 'all_of' ? evaluator.of : [];
    // The reduced amount, USD 800,000, expressed in minor units.
    expect(clauses).toContainEqual({
      op: 'gte',
      path: 'qualifyingInvestment.minorUnits',
      value: 80_000_000,
    });
    expect(capital?.label.en).toContain('1,050,000');
    expect(capital?.label.en).toContain('800,000');

    const deadRegulation = usEb5ImmigrantInvestor.citations.find(
      (c) => c.id === 'us-eb-cfr-204-6-f',
    );
    expect(deadRegulation?.note ?? '').toContain('1,800,000');
    expect(deadRegulation?.note ?? '').toContain('not been conformed');

    const guidance = usEb5ImmigrantInvestor.citations.find((c) => c.id === 'us-eb-uscis-pm-6-g-2');
    expect(guidance?.note ?? '').toContain('VACATED BY A FEDERAL COURT');
    expect(guidance?.note ?? '').toContain('Behring');
  });

  it('escalates an amount between the two EB-5 thresholds instead of picking one', () => {
    // Whether the investment is in a targeted employment area is the single
    // boolean that decides which threshold applies, and it is not a field.
    const between = evaluate(
      usEb5ImmigrantInvestor,
      {
        ...usEmploymentSponsored,
        qualifyingInvestment: {
          kind: 'business_project',
          minorUnits: 90_000_000,
          currency: 'USD',
        },
      },
      TODAY,
    );
    expect(between.verdict).toBe('requires_human_review');
    expect(between.blockingFailures).not.toContain('us-eb5-minimum-capital');
  });

  it('refuses to guess whether the EB-4 religious-worker sunset has been extended', () => {
    // The codified text still reads "before September 30, 2015" and Congress
    // extends it by appropriations rider. The most recent extension visible in
    // the 2024 edition of the Code runs to 30 September 2024; whether a later one
    // is in force could not be established, so the record says exactly that.
    const branch = usEb4SpecialImmigrantReligiousWorker.criteria.find(
      (c) => c.id === 'us-eb4-minister-or-non-minister-branch',
    );
    expect(branch?.requiresHumanReview).toBe(true);
    const reason = branch?.humanReviewReason?.en ?? '';
    expect(reason).toContain('September 30, 2015');
    expect(reason).toContain('118-47');
    expect(reason).toMatch(/WHETHER A LATER EXT/i);
  });
});

describe('wiring', () => {
  it('ships ten records, all unreviewed, all open, and referencing nothing', () => {
    expect(US_EMPLOYMENT_PATHWAYS).toHaveLength(10);
    for (const pathway of US_EMPLOYMENT_PATHWAYS) {
      expect(pathway.jurisdiction).toBe('US');
      expect(pathway.kind).toBe('permanent_residence');
      expect(pathway.reviewStatus).toBe('unreviewed');
      expect(pathway.status).toBe('open');
      // Deliberately empty: nothing here names a pathway from a sibling module,
      // so the order the four US files were wired in cannot break a bridge.
      expect(pathway.leadsTo).toEqual([]);
    }
  });

  it('namespaces every citation id so it cannot collide with a sibling module', () => {
    // 373 unique citation ids across the catalog and four US files written in
    // parallel. A collision would surface as a cross-pathway warning rather than
    // an error, which is exactly the kind of thing that gets lived with.
    const ids = new Set(US_EMPLOYMENT_PATHWAYS.flatMap((p) => p.citations.map((c) => c.id)));
    for (const id of ids) {
      expect(id.startsWith('us-'), `${id} is not namespaced`).toBe(true);
    }
  });
});
