/**
 * The United States procedural layer: adjustment versus consular processing,
 * naturalisation by residence, and the § 1182(a)(9) inadmissibility bars.
 *
 * Two of these records are not routes at all. `us-unlawful-presence-bar-screening`
 * and `us-permanent-bar-screening` exist to raise a question, and the only
 * honest answer software can give to it is "take this to a person". Each
 * therefore carries an unconditional escalation, which means `evaluate` can only
 * ever return `requires_human_review` for them. That polarity is the feature:
 * an engine that told somebody the ten-year bar does not apply to them, on facts
 * that do not include when they left the country, would be handing out the most
 * expensive wrong answer in this corridor. These tests pin it so that nobody
 * later "fixes" a record that appears never to decide anything.
 *
 * The naturalisation records are the opposite case, and the contrast is why they
 * are tested together. Continuous residence and physical presence are civil-date
 * arithmetic on dates Meridian actually holds, so those criteria decide — down
 * to the day. What still escalates is the three months in a State or USCIS
 * district, because the facts model has no sub-national residence unit at all.
 */

import { dateRange } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  US_STATUS_AND_BARS_PATHWAYS,
  usAdjustmentOfStatus,
  usConsularProcessingImmigrantVisa,
  usNaturalizationFiveYear,
  usNaturalizationSpouseThreeYear,
  usPermanentBarScreening,
  usProvisionalWaiverUnlawfulPresence,
  usUnlawfulPresenceBarScreening,
} from '../src/catalog/us-status-bars.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import type { Pathway } from '../src/schema.js';
import { d, TODAY, usLawfulPermanentResident, usUnlawfullyPresent } from './fixtures.js';

const SCREENINGS: readonly Pathway[] = [usUnlawfulPresenceBarScreening, usPermanentBarScreening];

const nat5 = (facts: ApplicantFacts) => evaluate(usNaturalizationFiveYear, facts, TODAY);
const nat3 = (facts: ApplicantFacts) => evaluate(usNaturalizationSpouseThreeYear, facts, TODAY);

describe('the § 1182(a)(9) bar screenings never issue a verdict', () => {
  it('returns requires_human_review for every applicant, whatever the facts say', () => {
    // Including the applicant who looks clear. "No bar applies to you" is a
    // finding, it costs three or ten years when it is wrong, and it cannot be
    // made from a fact set that holds no departure date.
    const profiles: readonly ApplicantFacts[] = [
      usUnlawfullyPresent,
      usLawfulPermanentResident,
      { applicantId: 'fixture-us-empty' },
      { ...usUnlawfullyPresent, travelHistory: { priorOverstays: 0, priorRemovals: 0 } },
      { ...usUnlawfullyPresent, currentStatus: 'visitor', travelHistory: undefined },
    ];
    for (const pathway of SCREENINGS) {
      for (const facts of profiles) {
        const report = evaluate(pathway, facts, TODAY);
        expect(report.verdict, `${pathway.id} / ${facts.applicantId}`).toBe(
          'requires_human_review',
        );
      }
    }
  });

  it('escalates unconditionally on the criterion that would otherwise answer the question', () => {
    const accrued = usUnlawfulPresenceBarScreening.criteria.find(
      (c) => c.id === 'us-upb-unlawful-presence-may-have-accrued',
    );
    expect(accrued?.requiresHumanReview).toBe(true);
    expect(accrued?.weight).toBe('blocking');

    for (const id of [
      'us-pb-aggregate-unlawful-presence-over-one-year',
      'us-pb-reentry-or-attempted-reentry-without-admission',
    ]) {
      expect(usPermanentBarScreening.criteria.find((c) => c.id === id)?.requiresHumanReview).toBe(
        true,
      );
    }
  });

  it('surfaces the day-count trap rather than performing the count', () => {
    // Unlawful presence starts the day after the authorised stay ends, not when
    // the visa expires, and the count excludes both the I-94 expiry date and the
    // day of departure — two exclusive endpoints in a world where every
    // `DateRange` is closed at both ends. A naive inclusive count overstates by
    // two days, and the record says so instead of doing it.
    const reason =
      usUnlawfulPresenceBarScreening.criteria.find(
        (c) => c.id === 'us-upb-unlawful-presence-may-have-accrued',
      )?.humanReviewReason?.en ?? '';
    expect(reason).toContain('day after');
    expect(reason).toContain('not begin when the visa expires');
    expect(reason).toContain('overstates it by two');
  });

  it('states the aggregation rules in opposite directions, because they are opposite', () => {
    // § 1182(a)(9)(B) does not aggregate across separate trips. § 1182(a)(9)(C)
    // does, across the whole history since 1 April 1997. Stating that backwards
    // is the common and expensive error.
    const bReason =
      usUnlawfulPresenceBarScreening.criteria.find(
        (c) => c.id === 'us-upb-unlawful-presence-may-have-accrued',
      )?.humanReviewReason?.en ?? '';
    expect(bReason).toContain('not cumulative across separate trips');

    const cReason =
      usPermanentBarScreening.criteria.find(
        (c) => c.id === 'us-pb-aggregate-unlawful-presence-over-one-year',
      )?.humanReviewReason?.en ?? '';
    expect(cReason).toContain('aggregate of more than one year');
    expect(cReason).toContain('opposite');
  });

  it('says the under-18 exception does not reach the permanent bar', () => {
    // A reader who has just learned that time under 18 does not count will
    // assume it carries over. It does not, so the point gets a criterion of its
    // own rather than a footnote.
    const criterion = usPermanentBarScreening.criteria.find(
      (c) => c.id === 'us-pb-under-eighteen-exception-does-not-extend-here',
    );
    expect(criterion?.weight).toBe('informational');
    expect(criterion?.guidance?.en).toContain('apply to the three- and ten-year bars and not to');
  });

  it('says the three-year bar needs a departure before proceedings and the ten-year bar does not', () => {
    const guidance =
      usUnlawfulPresenceBarScreening.criteria.find(
        (c) => c.id === 'us-upb-unlawful-presence-may-have-accrued',
      )?.guidance?.en ?? '';
    expect(guidance).toContain('before proceedings commenced');
    expect(guidance).toContain('no equivalent condition');
  });

  it('computes no end date for either period, and says why', () => {
    for (const pathway of SCREENINGS) {
      const note = pathway.durations.note?.en ?? '';
      expect(note).toContain('no departure date');
      expect(pathway.durations.publishedProcessingDays).toBeUndefined();
    }
  });

  it('flags the fixed-admission rule for a recorded student without deciding its fate', () => {
    const report = evaluate(
      usUnlawfulPresenceBarScreening,
      { ...usUnlawfullyPresent, currentStatus: 'student' },
      TODAY,
    );
    const dos = report.criteria.find(
      (c) => c.criterionId === 'us-upb-student-duration-of-status-change',
    );
    expect(dos?.status).toBe('met');
    expect(dos?.weight).toBe('informational');
    const guidance =
      usUnlawfulPresenceBarScreening.criteria.find(
        (c) => c.id === 'us-upb-student-duration-of-status-change',
      )?.guidance?.en ?? '';
    expect(guidance).toContain('91 FR 44976');
    expect(guidance).toContain('litigation status was not established');
  });
});

describe('the I-601A provisional waiver', () => {
  it('says a United States citizen child is not a qualifying relative', () => {
    // § 1182(a)(9)(B)(v) is narrower than almost everybody expects, and the
    // wrong belief here is the one that gets a person to leave the country.
    const reason =
      usProvisionalWaiverUnlawfulPresence.criteria.find(
        (c) => c.id === 'us-i601a-qualifying-relative',
      )?.humanReviewReason?.en ?? '';
    expect(reason).toMatch(/citizen child (is not|does not)/i);
    expect(usUnlawfulPresenceBarScreening.durations.note?.en).toContain(
      'citizen child is not a qualifying relative',
    );
  });

  it('escalates on the qualifying relative and the pending case, which are not modelled', () => {
    const report = evaluate(usProvisionalWaiverUnlawfulPresence, usUnlawfullyPresent, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('us-i601a-qualifying-relative');
    expect(report.humanReviewCriterionIds).toContain('us-i601a-pending-immigrant-visa-case');
  });

  it('bridges the screening to the waiver and the waiver to consular processing', () => {
    expect(usUnlawfulPresenceBarScreening.leadsTo).toEqual([
      'us-provisional-waiver-unlawful-presence',
    ]);
    expect(usProvisionalWaiverUnlawfulPresence.leadsTo).toEqual([
      'us-consular-processing-immigrant-visa',
    ]);
  });
});

describe('adjustment of status and consular processing', () => {
  it('escalates adjustment on the manner of last entry, which the facts model lacks', () => {
    // `currentStatus: 'irregular'` describes the present, not the entry. An
    // overstayer after a lawful admission is irregular now and *was* admitted,
    // and the § 1255(c)(2) immediate-relative exception reaches them; somebody
    // who entered without inspection fails § 1255(a) itself. Using the status as
    // a proxy would get that backwards for a large share of this corridor.
    const report = evaluate(usAdjustmentOfStatus, usUnlawfullyPresent, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('us-aos-inspected-and-admitted-or-paroled');
  });

  it('frames consular processing around the departure that fires the bar', () => {
    // Not "the other option". Leaving for the interview is the event § 1182(a)(9)(B)
    // keys on, so the central criterion asks whether departing triggers a bar.
    const report = evaluate(usConsularProcessingImmigrantVisa, usUnlawfullyPresent, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain(
      'us-cp-departure-does-not-trigger-an-unlawful-presence-bar',
    );
  });

  it('bridges both to naturalisation, and never outside the module', () => {
    const inModule = new Set(US_STATUS_AND_BARS_PATHWAYS.map((p) => p.id));
    for (const pathway of US_STATUS_AND_BARS_PATHWAYS) {
      for (const target of pathway.leadsTo) {
        expect(inModule.has(target), `${pathway.id} -> ${target}`).toBe(true);
      }
    }
    for (const pathway of [usAdjustmentOfStatus, usConsularProcessingImmigrantVisa]) {
      expect(pathway.leadsTo).toEqual([
        'us-naturalization-five-year',
        'us-naturalization-spouse-three-year',
      ]);
    }
  });

  it('cites the FAM and the BIA without a URL, because neither would serve', () => {
    // fam.state.gov's certificate chain does not verify in this environment and
    // the report was not read directly. A guessed link teaches the reader to
    // stop checking.
    for (const id of ['us-sb-fam-302-11-3', 'us-sb-bia-arrabally']) {
      const citation = usUnlawfulPresenceBarScreening.citations.find((c) => c.id === id);
      expect(citation, `${id} is not declared`).toBeDefined();
      expect(citation?.url).toBeUndefined();
    }
  });
});

describe('naturalisation by residence', () => {
  it('measures the five-year period to the day', () => {
    // The boundary that matters. A period that began on 2021-07-26 completes on
    // 2026-07-25 — a closed, inclusive five years — and one that began a day
    // later does not.
    const exactly = nat5({
      ...usLawfulPermanentResident,
      residencePeriods: [dateRange(d('2021-07-26'), TODAY)],
    });
    expect(
      exactly.criteria.find((c) => c.criterionId === 'us-nat5-five-years-continuous-residence')
        ?.status,
    ).toBe('met');

    const oneDayShort = nat5({
      ...usLawfulPermanentResident,
      residencePeriods: [dateRange(d('2021-07-27'), TODAY)],
    });
    expect(oneDayShort.blockingFailures).toContain('us-nat5-five-years-continuous-residence');
  });

  it('applies the same arithmetic at three years for the citizen-spouse route', () => {
    const exactly = nat3({
      ...usLawfulPermanentResident,
      residencePeriods: [dateRange(d('2023-07-26'), TODAY)],
    });
    expect(
      exactly.criteria.find((c) => c.criterionId === 'us-nat3-three-years-continuous-residence')
        ?.status,
    ).toBe('met');

    const oneDayShort = nat3({
      ...usLawfulPermanentResident,
      residencePeriods: [dateRange(d('2023-07-27'), TODAY)],
    });
    expect(oneDayShort.blockingFailures).toContain('us-nat3-three-years-continuous-residence');
  });

  it('reports a definite shortfall even though the verdict is an escalation', () => {
    // Escalation is not amnesty. The reviewer needs the arithmetic that already
    // failed, not a clean slate.
    const report = nat5({
      ...usLawfulPermanentResident,
      residencePeriods: [dateRange(d('2024-01-01'), TODAY)],
    });
    expect(report.verdict).toBe('requires_human_review');
    expect(report.blockingFailures).toContain('us-nat5-five-years-continuous-residence');
  });

  it('leaves the residence criteria unknown when nothing is recorded, never unmet', () => {
    // The case that keeps a half-filled profile from being told "no". An absent
    // residence history is not a short one.
    const report = nat5({
      ...usLawfulPermanentResident,
      residencePeriods: undefined,
      absences: undefined,
    });
    expect(report.blockingFailures).toEqual([]);
    expect(report.unknowns).toContain('us-nat5-five-years-continuous-residence');
    expect(report.unknowns).toContain('us-nat5-physical-presence-half-the-period');
  });

  it('distinguishes an absent absence list from an empty one', () => {
    // `absences: []` asserts there were none and makes the physical-presence
    // test decidable; `undefined` asserts nothing and must not be read as zero.
    const asserted = nat5(usLawfulPermanentResident);
    expect(
      asserted.criteria.find((c) => c.criterionId === 'us-nat5-physical-presence-half-the-period')
        ?.status,
    ).toBe('met');

    const silent = nat5({ ...usLawfulPermanentResident, absences: undefined });
    expect(
      silent.criteria.find((c) => c.criterionId === 'us-nat5-physical-presence-half-the-period')
        ?.status,
    ).toBe('unknown');
  });

  it('escalates an absence over six months instead of deciding continuity itself', () => {
    // § 1427(b): more than six months but less than a year raises a presumption
    // that can be rebutted; a year or more breaks continuity outright. The first
    // is a rebuttable presumption, so it goes to a person.
    const sixToTwelve = nat5({
      ...usLawfulPermanentResident,
      absences: [dateRange(d('2023-01-01'), d('2023-09-30'))],
    });
    expect(sixToTwelve.humanReviewCriterionIds).toContain(
      'us-nat5-absences-did-not-break-continuity',
    );
  });

  it('refuses a non-resident and a minor on bright lines', () => {
    expect(nat5({ ...usLawfulPermanentResident, currentStatus: 'worker' }).blockingFailures).toContain(
      'us-nat5-lawful-permanent-resident',
    );
    expect(
      nat5({ ...usLawfulPermanentResident, dateOfBirth: d('2010-01-01') }).blockingFailures,
    ).toContain('us-nat5-age-eighteen');
  });

  it('cannot return eligible, because no State or USCIS district is modelled', () => {
    for (const pathway of [usNaturalizationFiveYear, usNaturalizationSpouseThreeYear]) {
      const district = pathway.criteria.find((c) =>
        c.id.endsWith('-three-months-in-the-state-or-district'),
      );
      expect(district?.requiresHumanReview).toBe(true);
      expect(evaluate(pathway, usLawfulPermanentResident, TODAY).verdict).toBe(
        'requires_human_review',
      );
    }
  });

  it('makes the citizen-spouse requirement its own blocking criterion', () => {
    // The three-year rule is not "the five-year rule but shorter": it needs a
    // citizen spouse throughout the period and a marital union that subsists.
    // Neither the marriage nor the spouse's status is a field, so it escalates.
    const criterion = usNaturalizationSpouseThreeYear.criteria.find(
      (c) => c.id === 'us-nat3-citizen-spouse-and-marital-union',
    );
    expect(criterion?.weight).toBe('blocking');
    expect(criterion?.requiresHumanReview).toBe(true);
  });

  it('evaluates the English and civics exemptions rather than merely mentioning them', () => {
    // § 1423(b): 50 years with 20 years of residence, or 55 with 15, exempts the
    // English requirement; 65 with 20 attracts special consideration on civics.
    // Informational, so they cannot move a verdict, but they do fire.
    const olderApplicant = nat5({
      ...usLawfulPermanentResident,
      dateOfBirth: d('1955-01-01'),
      residencePeriods: [dateRange(d('2000-01-01'), TODAY)],
    });
    expect(
      olderApplicant.criteria.find((c) => c.criterionId === 'us-nat5-english-requirement-exemption')
        ?.status,
    ).toBe('met');
    expect(
      olderApplicant.criteria.find((c) => c.criterionId === 'us-nat5-civics-special-consideration')
        ?.status,
    ).toBe('met');

    // And they must not fire for somebody they do not reach.
    expect(
      nat5(usLawfulPermanentResident).criteria.find(
        (c) => c.criterionId === 'us-nat5-english-requirement-exemption',
      )?.status,
    ).toBe('unmet');
  });
});

describe('wiring', () => {
  it('ships seven records, all unreviewed and all open', () => {
    expect(US_STATUS_AND_BARS_PATHWAYS).toHaveLength(7);
    for (const pathway of US_STATUS_AND_BARS_PATHWAYS) {
      expect(pathway.jurisdiction).toBe('US');
      expect(pathway.reviewStatus).toBe('unreviewed');
      expect(pathway.status).toBe('open');
      expect(pathway.durations.publishedProcessingDays).toBeUndefined();
    }
  });

  it('quotes no priority date, cut-off date or waiting estimate', () => {
    // The 7 per cent per-country limit and the existence of separately listed
    // oversubscribed chargeability areas are structure and are encoded. A date
    // from the Visa Bulletin would be wrong within weeks.
    const cutOff = /\b\d{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}\b/;
    for (const pathway of US_STATUS_AND_BARS_PATHWAYS) {
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
    }
  });
});
