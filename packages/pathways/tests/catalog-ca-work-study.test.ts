/**
 * Canada's temporary routes: the LMIA permit, the three non-professional CUSMA
 * categories, the study permit and the post-graduation work permit.
 *
 * The chain these records describe is the one most people actually walk —
 * study permit, then post-graduation work permit, then the Canadian Experience
 * Class — and the trap in it is that the middle step is *not optional*. Work
 * done while studying full time does not count toward the class, because IRPR
 * s. 87.1(3) excludes it. A record that let a graduate think their campus job
 * built the qualifying year would cost them a year.
 *
 * The CUSMA categories are the other theme. Trader, investor and intra-company
 * transferee all turn on qualifiers the Agreement states and does not define —
 * "substantial" trade, "a substantial amount of capital", a "specialized"
 * skill. There is no threshold to encode, so none is invented.
 */

import { dateRange } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  CA_WORK_STUDY_PATHWAYS,
  caCusmaIntraCompanyTransferee,
  caCusmaInvestor,
  caCusmaTrader,
  caLmiaWorkPermit,
  caPostGraduationWorkPermit,
  caStudyPermit,
} from '../src/catalog/ca-work-study.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { CA, d, ES, MX, TODAY, US } from './fixtures.js';

const canadianOffer: ApplicantFacts = {
  applicantId: 'fixture-ca-worker',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: CA,
  dateOfBirth: d('1990-10-20'),
  currentStatus: 'none',
  educationLevel: 'bachelor',
  professionalExperienceYears: 8,
  jobOffer: {
    employerName: 'Fixture Employer',
    employerCountry: CA,
    writtenOffer: true,
    fullTime: true,
    annualSalaryMinorUnits: 9_000_000,
    currency: 'CAD',
    occupationTaxonomy: 'noc_2021',
    occupationCode: '21301',
    nocTeer: 1,
  },
  intent: { temporary: true },
  travelHistory: { priorOverstays: 0 },
};

describe('the module', () => {
  it('holds the six routes, in declaration order', () => {
    expect(CA_WORK_STUDY_PATHWAYS.map((p) => p.id)).toEqual([
      'ca-lmia-work-permit',
      'ca-cusma-trader',
      'ca-cusma-investor',
      'ca-cusma-intra-company-transferee',
      'ca-study-permit',
      'ca-post-graduation-work-permit',
    ]);
  });

  it('describes the study-to-permanence chain with the work permit in the middle', () => {
    expect(caStudyPermit.leadsTo).toEqual(['ca-post-graduation-work-permit']);
    expect(caPostGraduationWorkPermit.leadsTo).toEqual(['ca-express-entry-cec']);
    for (const pathway of [caLmiaWorkPermit, caCusmaTrader, caCusmaInvestor, caCusmaIntraCompanyTransferee]) {
      expect(pathway.leadsTo, pathway.id).toEqual(['ca-express-entry-cec']);
    }
  });

  it('states no permit length anywhere, because an officer sets each one', () => {
    for (const pathway of CA_WORK_STUDY_PATHWAYS) {
      expect(pathway.durations.initialGrantMonths, pathway.id).toBeUndefined();
      expect(pathway.durations.publishedProcessingDays, pathway.id).toBeUndefined();
    }
  });
});

describe('ca-lmia-work-permit', () => {
  it('hands the labour-market determination to the person who makes it', () => {
    const report = evaluate(caLmiaWorkPermit, canadianOffer, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('ca-lmia-positive-determination');
  });

  it('needs an offer from an employer in Canada', () => {
    const abroad: ApplicantFacts = {
      ...canadianOffer,
      jobOffer: { ...canadianOffer.jobOffer, employerCountry: ES },
    };
    expect(evaluate(caLmiaWorkPermit, abroad, TODAY).blockingFailures).toContain(
      'ca-lmia-offer-of-employment',
    );
  });

  it('requires an asserted temporary stay and reports absence of it as unknown', () => {
    const permanentIntent: ApplicantFacts = { ...canadianOffer, intent: { temporary: false } };
    expect(evaluate(caLmiaWorkPermit, permanentIntent, TODAY).blockingFailures).toContain(
      'ca-lmia-temporary-stay',
    );

    const noIntent: ApplicantFacts = { ...canadianOffer, intent: undefined };
    const report = evaluate(caLmiaWorkPermit, noIntent, TODAY);
    expect(report.blockingFailures).not.toContain('ca-lmia-temporary-stay');
    expect(report.unknowns).toContain('ca-lmia-temporary-stay');
  });

  it('says the fees are the employer’s, as information rather than as a test', () => {
    const criterion = evaluate(caLmiaWorkPermit, canadianOffer, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-lmia-fees-are-the-employers',
    );
    expect(criterion?.weight).toBe('informational');
  });
});

describe('the three CUSMA business categories', () => {
  const mexicanTrader: ApplicantFacts = {
    ...canadianOffer,
    applicantId: 'fixture-cusma-trader',
    employmentType: 'employee',
    qualifyingInvestment: { kind: 'business_project', minorUnits: 40_000_000, currency: 'CAD' },
    workExperience: [
      {
        country: MX,
        period: dateRange(d('2023-01-01'), TODAY),
        occupationTaxonomy: 'noc_2021',
        nocTeer: 0,
        fullTime: true,
        authorized: true,
      },
    ],
  };

  it('admits citizens of Mexico and the United States and nobody else', () => {
    for (const pathway of [caCusmaTrader, caCusmaInvestor, caCusmaIntraCompanyTransferee]) {
      const american: ApplicantFacts = {
        ...mexicanTrader,
        nationalities: [US],
        claimedNationality: US,
      };
      const citizenship = evaluate(pathway, american, TODAY).criteria.find((c) =>
        c.criterionId.endsWith('citizenship'),
      );
      expect(citizenship?.status, pathway.id).toBe('met');
    }
  });

  it('excludes a permanent resident of a Party who is a citizen of somewhere else', () => {
    const resident: ApplicantFacts = {
      ...mexicanTrader,
      nationalities: [ES],
      claimedNationality: US,
    };
    for (const pathway of [caCusmaTrader, caCusmaInvestor, caCusmaIntraCompanyTransferee]) {
      const report = evaluate(pathway, resident, TODAY);
      const failed = report.blockingFailures.find((id) => id.endsWith('citizenship'));
      expect(failed, pathway.id).toBeDefined();
    }
  });

  it('escalates every qualifier the Agreement leaves undefined', () => {
    expect(evaluate(caCusmaTrader, mexicanTrader, TODAY).humanReviewCriterionIds).toEqual(
      expect.arrayContaining(['ca-cusma-trader-substantial-trade', 'ca-cusma-trader-capacity']),
    );
    expect(evaluate(caCusmaInvestor, mexicanTrader, TODAY).humanReviewCriterionIds).toContain(
      'ca-cusma-inv-substantial-capital',
    );
    expect(
      evaluate(caCusmaIntraCompanyTransferee, mexicanTrader, TODAY).humanReviewCriterionIds,
    ).toEqual(
      expect.arrayContaining([
        'ca-cusma-ict-corporate-relationship',
        'ca-cusma-ict-one-year-in-three',
        'ca-cusma-ict-capacity',
      ]),
    );
  });

  it('states no capital figure, because the Agreement states none', () => {
    const criterion = evaluate(caCusmaInvestor, mexicanTrader, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-cusma-inv-substantial-capital',
    );
    expect(criterion?.humanReviewReason).toContain('substantial amount of capital');
    expect(criterion?.humanReviewReason).not.toMatch(/CAD\s?\d/);
  });

  it('requires a temporary stay on all three', () => {
    const permanentIntent: ApplicantFacts = { ...mexicanTrader, intent: { temporary: false } };
    for (const pathway of [caCusmaTrader, caCusmaInvestor, caCusmaIntraCompanyTransferee]) {
      const failed = evaluate(pathway, permanentIntent, TODAY).blockingFailures.find((id) =>
        id.endsWith('temporary-entry'),
      );
      expect(failed, pathway.id).toBeDefined();
    }
  });
});

describe('ca-study-permit', () => {
  const student: ApplicantFacts = {
    applicantId: 'fixture-ca-student',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: CA,
    dateOfBirth: d('2005-02-14'),
    currentStatus: 'none',
    intent: { temporary: true },
  };

  it('escalates acceptance, funds and the attestation letter rather than approximating them', () => {
    const report = evaluate(caStudyPermit, student, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toEqual(
      expect.arrayContaining([
        'ca-sp-acceptance-at-designated-institution',
        'ca-sp-financial-resources',
        'ca-sp-provincial-attestation-letter',
      ]),
    );
  });

  it('will not measure available funds against recorded income', () => {
    // s. 220 is about funds on hand. Income is a different quantity, and
    // measuring the test against the wrong one is worse than not measuring it.
    const salaried: ApplicantFacts = {
      ...student,
      passiveIncome: { minorUnits: 50_000_000, currency: 'CAD', period: 'annual' },
    };
    const criterion = evaluate(caStudyPermit, salaried, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-sp-financial-resources',
    );
    expect(criterion?.status).toBe('requires_human_review');
  });

  it('warns, as information, that study-time work does not build the CEC year', () => {
    const criterion = evaluate(caStudyPermit, { ...student, currentStatus: 'student' }, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-sp-conditions-and-what-the-time-is-worth',
    );
    expect(criterion?.weight).toBe('informational');
  });

  it('blocks a permit sought for a stay that is not asserted to be temporary', () => {
    const settling: ApplicantFacts = { ...student, intent: { temporary: false } };
    expect(evaluate(caStudyPermit, settling, TODAY).blockingFailures).toContain(
      'ca-sp-temporary-stay',
    );
  });
});

describe('ca-post-graduation-work-permit', () => {
  const graduate: ApplicantFacts = {
    applicantId: 'fixture-ca-graduate',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: CA,
    dateOfBirth: d('2000-06-01'),
    currentStatus: 'student',
    educationLevel: 'bachelor',
    educationCountry: CA,
    intent: { temporary: true },
  };

  it('does not restate criteria the Minister can change without a regulation', () => {
    const report = evaluate(caPostGraduationWorkPermit, graduate, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    const criterion = report.criteria.find(
      (c) => c.criterionId === 'ca-pgwp-minister-designated-criteria',
    );
    expect(criterion?.status).toBe('requires_human_review');
    expect(criterion?.humanReviewReason).toBeDefined();
  });

  it('notes studies completed in Canada as material rather than as a bright line', () => {
    const abroad: ApplicantFacts = { ...graduate, educationCountry: MX };
    const report = evaluate(caPostGraduationWorkPermit, abroad, TODAY);
    expect(report.materialFailures).toContain('ca-pgwp-studies-completed-in-canada');
    expect(report.blockingFailures).not.toContain('ca-pgwp-studies-completed-in-canada');
  });

  it('surfaces which Canadian work would count, as information only', () => {
    const working: ApplicantFacts = {
      ...graduate,
      workExperience: [
        {
          country: CA,
          period: dateRange(d('2025-09-01'), TODAY),
          nocTeer: 1,
          fullTime: true,
          authorized: true,
        },
      ],
    };
    const criterion = evaluate(caPostGraduationWorkPermit, working, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-pgwp-experience-that-counts',
    );
    expect(criterion?.weight).toBe('informational');
    expect(criterion?.status).toBe('met');
  });
});
