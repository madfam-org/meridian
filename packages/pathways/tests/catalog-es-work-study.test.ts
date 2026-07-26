/**
 * Spain's ordinary work, study and long-term-residence routes.
 *
 * The cases worth writing here are the ones where a wrong answer costs
 * somebody real money or a year of their life: a euro threshold measured
 * against pesos, a five-year residence clock counted from a period that ended
 * two years ago, and the national employment situation — a screening test whose
 * catalogue is redrawn quarterly and by autonomous community, which is exactly
 * why the record escalates it rather than answering it.
 */

import { dateRange } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  ES_WORK_STUDY_PATHWAYS,
  esEntrepreneurResidence,
  esLongTermResidenceEu,
  esLongTermResidenceNational,
  esStudentStay,
  esStudentWorkModification,
  esWorkPermitEmployed,
  esWorkPermitSelfEmployed,
} from '../src/catalog/es-work-study.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { d, ES, MX, spanishJobOffer, TODAY } from './fixtures.js';

describe('the module', () => {
  it('holds the seven routes, in declaration order', () => {
    expect(ES_WORK_STUDY_PATHWAYS.map((p) => p.id)).toEqual([
      'es-work-permit-employed',
      'es-work-permit-self-employed',
      'es-student-stay',
      'es-student-work-modification',
      'es-entrepreneur-residence',
      'es-long-term-residence-eu',
      'es-long-term-residence-national',
    ]);
  });

  it('routes every work permit onward to long-term residence and naturalisation', () => {
    for (const pathway of [esWorkPermitEmployed, esWorkPermitSelfEmployed, esStudentWorkModification]) {
      expect(pathway.leadsTo, pathway.id).toEqual([
        'es-long-term-residence-eu',
        'es-long-term-residence-national',
        'es-nationality-residence-reduced',
        'es-nationality-residence-general',
      ]);
    }
  });

  it('states no grant length where the instrument fixes none', () => {
    // Art. 55.1 gives a study stay the length of the studies, not a number. An
    // invented "typically twelve months" is what an applicant books a flight on.
    expect(esStudentStay.durations.initialGrantMonths).toBeUndefined();
    expect(esStudentStay.durations.publishedProcessingDays).toBeUndefined();
    expect(esStudentStay.durations.note?.en).toBeDefined();
  });
});

describe('es-work-permit-employed', () => {
  it('escalates the national employment situation instead of guessing at the catalogue', () => {
    const report = evaluate(esWorkPermitEmployed, { ...spanishJobOffer, jobOffer: { ...spanishJobOffer.jobOffer, occupationCode: '2511' } }, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('es-ajena-national-employment-situation');
  });

  it('measures pay against the SMI supplied with the facts, not a hardcoded figure', () => {
    const belowSmi: ApplicantFacts = {
      ...spanishJobOffer,
      jobOffer: { ...spanishJobOffer.jobOffer, annualSalaryMinorUnits: 1_000_000 },
    };
    const report = evaluate(esWorkPermitEmployed, belowSmi, TODAY);
    expect(report.blockingFailures).toContain('es-ajena-remuneration-smi');
  });

  it('reports the pay test as unknown when no index for the year was supplied', () => {
    const noIndex: ApplicantFacts = { ...spanishJobOffer, referenceIndices: undefined };
    const report = evaluate(esWorkPermitEmployed, noIndex, TODAY);
    const criterion = report.criteria.find((c) => c.criterionId === 'es-ajena-remuneration-smi');
    expect(criterion?.status).toBe('unknown');
    expect(report.blockingFailures).not.toContain('es-ajena-remuneration-smi');
  });

  it('refuses to compare a euro threshold against pesos', () => {
    const pesos: ApplicantFacts = {
      ...spanishJobOffer,
      jobOffer: { ...spanishJobOffer.jobOffer, annualSalaryMinorUnits: 90_000_000, currency: 'MXN' },
    };
    const criterion = evaluate(esWorkPermitEmployed, pesos, TODAY).criteria.find(
      (c) => c.criterionId === 'es-ajena-remuneration-smi',
    );
    expect(criterion?.status).toBe('unknown');
  });

  it('needs an offer from an employer in Spain, not merely a written offer', () => {
    const elsewhere: ApplicantFacts = {
      ...spanishJobOffer,
      jobOffer: { ...spanishJobOffer.jobOffer, employerCountry: MX },
    };
    expect(evaluate(esWorkPermitEmployed, elsewhere, TODAY).blockingFailures).toContain(
      'es-ajena-employment-contract',
    );
  });

  it('applies the sixteen-year floor at the boundary', () => {
    const almost: ApplicantFacts = { ...spanishJobOffer, dateOfBirth: d('2010-07-26') };
    const exactly: ApplicantFacts = { ...spanishJobOffer, dateOfBirth: d('2010-07-25') };
    expect(evaluate(esWorkPermitEmployed, almost, TODAY).blockingFailures).toContain(
      'es-ajena-minimum-age',
    );
    expect(evaluate(esWorkPermitEmployed, exactly, TODAY).blockingFailures).not.toContain(
      'es-ajena-minimum-age',
    );
  });
});

describe('es-work-permit-self-employed', () => {
  const selfEmployed: ApplicantFacts = {
    applicantId: 'fixture-es-cuenta-propia',
    nationalities: [MX],
    claimedNationality: MX,
    dateOfBirth: d('1988-01-10'),
    targetJurisdiction: ES,
    employmentType: 'self_employed',
    professionalExperienceYears: 10,
    criminalRecord: { certificates: [{ jurisdiction: ES, clear: true }] },
  };

  it('sets an eighteen-year floor where the employed route sets sixteen', () => {
    const seventeen: ApplicantFacts = { ...selfEmployed, dateOfBirth: d('2009-01-10') };
    expect(evaluate(esWorkPermitSelfEmployed, seventeen, TODAY).blockingFailures).toContain(
      'es-propia-minimum-age',
    );
  });

  it('escalates investment sufficiency rather than inventing a threshold', () => {
    // Art. 84.c) sets no figure at all. A number here would be Meridian's, not
    // the law's.
    const withCapital: ApplicantFacts = {
      ...selfEmployed,
      qualifyingInvestment: { kind: 'business_project', minorUnits: 3_000_000, currency: 'EUR' },
    };
    const report = evaluate(esWorkPermitSelfEmployed, withCapital, TODAY);
    expect(report.humanReviewCriterionIds).toContain('es-propia-investment-sufficiency');
  });

  it('accepts a self-employment declaration on either fact', () => {
    const viaJobOffer: ApplicantFacts = {
      ...selfEmployed,
      employmentType: undefined,
      jobOffer: { selfEmployment: true },
    };
    const criterion = evaluate(esWorkPermitSelfEmployed, viaJobOffer, TODAY).criteria.find(
      (c) => c.criterionId === 'es-propia-self-employed-activity',
    );
    expect(criterion?.status).toBe('met');
  });
});

describe('es-student-stay', () => {
  const student: ApplicantFacts = {
    applicantId: 'fixture-es-student',
    nationalities: [MX],
    claimedNationality: MX,
    dateOfBirth: d('2004-09-30'),
    targetJurisdiction: ES,
    currentStatus: 'none',
    healthInsurance: { hasPrivateCoverage: true, insurerAuthorizedIn: ES, coversFullPeriod: true },
    passiveIncome: { minorUnits: 900_000, currency: 'EUR', period: 'annual' },
    referenceIndices: { ipremAnnualMinorUnits: 800_000, currency: 'EUR' },
    criminalRecord: {
      certificates: [
        { jurisdiction: ES, clear: true },
        { jurisdiction: MX, clear: true },
      ],
    },
  };

  it('accepts a complete record', () => {
    expect(evaluate(esStudentStay, student, TODAY).verdict).toBe('eligible');
  });

  it('requires cover from an insurer authorised in Spain, not just any policy', () => {
    const foreignInsurer: ApplicantFacts = {
      ...student,
      healthInsurance: { hasPrivateCoverage: true, insurerAuthorizedIn: MX, coversFullPeriod: true },
    };
    expect(evaluate(esStudentStay, foreignInsurer, TODAY).blockingFailures).toContain(
      'es-study-health-insurance',
    );
  });

  it('treats cover that does not run the whole period as a failure', () => {
    const partial: ApplicantFacts = {
      ...student,
      healthInsurance: { hasPrivateCoverage: true, insurerAuthorizedIn: ES, coversFullPeriod: false },
    };
    expect(evaluate(esStudentStay, partial, TODAY).blockingFailures).toContain(
      'es-study-health-insurance',
    );
  });

  it('holds means below the IPREM back to indeterminate rather than refusing', () => {
    const thin: ApplicantFacts = {
      ...student,
      passiveIncome: { minorUnits: 400_000, currency: 'EUR', period: 'annual' },
    };
    const report = evaluate(esStudentStay, thin, TODAY);
    expect(report.verdict).toBe('indeterminate');
    expect(report.materialFailures).toContain('es-study-economic-means');
    expect(report.blockingFailures).toEqual([]);
  });

  it('bridges only to the modification route, which is where work rights come from', () => {
    expect(esStudentStay.leadsTo).toEqual(['es-student-work-modification']);
  });
});

describe('es-student-work-modification', () => {
  const graduate: ApplicantFacts = {
    applicantId: 'fixture-es-graduate',
    nationalities: [MX],
    claimedNationality: MX,
    dateOfBirth: d('1999-04-12'),
    targetJurisdiction: ES,
    currentStatus: 'student',
    professionalCredentials: [{ kind: 'degree', issuingCountry: ES, level: 'master' }],
    jobOffer: {
      employerCountry: ES,
      writtenOffer: true,
      selfEmployment: false,
      annualSalaryMinorUnits: 2_200_000,
      currency: 'EUR',
    },
    referenceIndices: { smiAnnualMinorUnits: 1_618_000, currency: 'EUR' },
    criminalRecord: { certificates: [{ jurisdiction: ES, clear: true }] },
  };

  it('accepts a Spanish graduate moving into employment', () => {
    expect(evaluate(esStudentWorkModification, graduate, TODAY).verdict).toBe('eligible');
  });

  it('does not accept a qualification obtained outside Spain', () => {
    const abroad: ApplicantFacts = {
      ...graduate,
      professionalCredentials: [{ kind: 'degree', issuingCountry: MX, level: 'master' }],
    };
    expect(evaluate(esStudentWorkModification, abroad, TODAY).blockingFailures).toContain(
      'es-swm-qualification-obtained',
    );
  });

  it('requires the applicant to still hold the study stay', () => {
    const lapsed: ApplicantFacts = { ...graduate, currentStatus: 'none' };
    expect(evaluate(esStudentWorkModification, lapsed, TODAY).blockingFailures).toContain(
      'es-swm-current-study-stay',
    );
  });

  it('accepts the self-employed variant as an alternative work basis', () => {
    const ownBusiness: ApplicantFacts = {
      ...graduate,
      jobOffer: undefined,
      employmentType: 'self_employed',
    };
    const criterion = evaluate(esStudentWorkModification, ownBusiness, TODAY).criteria.find(
      (c) => c.criterionId === 'es-swm-work-basis',
    );
    expect(criterion?.status).toBe('met');
  });
});

describe('es-entrepreneur-residence', () => {
  const founder: ApplicantFacts = {
    applicantId: 'fixture-es-founder',
    nationalities: [MX],
    claimedNationality: MX,
    dateOfBirth: d('1986-11-02'),
    targetJurisdiction: ES,
    currentStatus: 'none',
    qualifyingInvestment: { kind: 'business_project', minorUnits: 5_000_000, currency: 'EUR' },
    healthInsurance: { hasPrivateCoverage: true, insurerAuthorizedIn: ES },
    passiveIncome: { minorUnits: 4_000_000, currency: 'EUR', period: 'annual' },
    criminalRecord: { certificates: [{ jurisdiction: MX, clear: true }] },
  };

  it('hands the innovation question to ENISA rather than answering it', () => {
    const report = evaluate(esEntrepreneurResidence, founder, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('es-ent-entrepreneurial-activity');
  });

  it('excludes somebody recorded as present without authorisation', () => {
    const irregular: ApplicantFacts = { ...founder, currentStatus: 'irregular' };
    expect(evaluate(esEntrepreneurResidence, irregular, TODAY).blockingFailures).toContain(
      'es-ent-not-irregular',
    );
  });

  it('records the three-year initial grant and two-year renewal from the same article', () => {
    expect(esEntrepreneurResidence.durations.initialGrantMonths).toBe(36);
    expect(esEntrepreneurResidence.durations.renewalMonths).toBe(24);
  });
});

describe('the two long-term residence routes', () => {
  const fiveYears: ApplicantFacts = {
    applicantId: 'fixture-es-ltr',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: ES,
    currentStatus: 'resident',
    residencePeriods: [dateRange(d('2021-07-26'), TODAY)],
    passiveIncome: { minorUnits: 2_000_000, currency: 'EUR', period: 'annual' },
    healthInsurance: { hasPrivateCoverage: true },
    criminalRecord: { certificates: [{ jurisdiction: MX, clear: true }] },
  };

  it('accepts exactly five years and refuses one day less', () => {
    // Ranges are closed at both ends, so a five-year period that began on
    // 2021-07-26 completes on 2026-07-25 — the day it is being assessed. Start
    // a day later and it has not.
    expect(evaluate(esLongTermResidenceEu, fiveYears, TODAY).verdict).toBe('eligible');
    const oneDayShort: ApplicantFacts = {
      ...fiveYears,
      residencePeriods: [dateRange(d('2021-07-27'), TODAY)],
    };
    expect(evaluate(esLongTermResidenceEu, oneDayShort, TODAY).blockingFailures).toContain(
      'es-ltr-eu-five-years',
    );
  });

  it('does not count five years that ended before the application', () => {
    const lapsed: ApplicantFacts = {
      ...fiveYears,
      residencePeriods: [dateRange(d('2012-01-01'), d('2020-01-01'))],
    };
    const report = evaluate(esLongTermResidenceEu, lapsed, TODAY);
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('es-ltr-eu-five-years');
  });

  it('is unmoved by the order the residence periods arrive in', () => {
    const a = dateRange(d('2021-07-26'), d('2023-12-31'));
    const b = dateRange(d('2024-01-01'), TODAY);
    const forwards = evaluate(esLongTermResidenceEu, { ...fiveYears, residencePeriods: [a, b] }, TODAY);
    const backwards = evaluate(esLongTermResidenceEu, { ...fiveYears, residencePeriods: [b, a] }, TODAY);
    expect(forwards.verdict).toBe(backwards.verdict);
    expect(forwards.blockingFailures).toEqual(backwards.blockingFailures);
  });

  it('asks the national route for less than the EU one does', () => {
    // The national variant carries no health-insurance or resources criterion:
    // what it gives up is the Directive's mobility, not the five-year clock.
    const nationalIds = esLongTermResidenceNational.criteria.map((c) => c.id);
    expect(nationalIds).not.toContain('es-ltr-nat-health-insurance');
    expect(esLongTermResidenceEu.criteria.map((c) => c.id)).toContain('es-ltr-eu-health-insurance');
    expect(evaluate(esLongTermResidenceNational, fiveYears, TODAY).verdict).toBe('eligible');
  });

  it('marks both as counting toward the naturalisation clock', () => {
    expect(esLongTermResidenceEu.durations.countsTowardNaturalisation).toBe(true);
    expect(esLongTermResidenceNational.durations.countsTowardNaturalisation).toBe(true);
  });
});
