import { dateRange, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  esGoldenVisa,
  esNationalityResidenceGeneral,
  esNationalityResidenceReduced,
  esNonLucrativeVisa,
  SPANISH_OFFICIAL_LANGUAGE_COUNTRIES,
} from '../src/catalog/es.js';
import { assessmentOf, evaluate, evaluateAll, reportCitationIds } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { statusOn } from '../src/schema.js';
import {
  BR,
  d,
  ES,
  IT,
  italianMexicanEnteredOnItalianPassport,
  mexicanTwoYearResident,
  mexicanWithUnknownResidenceDays,
  MX,
  TODAY,
} from './fixtures.js';

const criterion = (facts: ApplicantFacts, id: string) => {
  const report = evaluate(esNationalityResidenceReduced, facts, TODAY);
  const result = report.criteria.find((c) => c.criterionId === id);
  if (!result) throw new Error(`no criterion ${id}`);
  return result;
};

describe('es-nationality-residence-reduced', () => {
  it('finds a Mexican national with two years of continuous residence eligible', () => {
    const report = evaluate(esNationalityResidenceReduced, mexicanTwoYearResident, TODAY);
    expect(report.verdict).toBe('eligible');
    expect(report.blockingFailures).toEqual([]);
    expect(report.unknowns).toEqual([]);
    expect(report.classification).toBe('assessment');
  });

  it('exempts the Mexican applicant from the DELE without any certificate on file', () => {
    expect(criterion(mexicanTwoYearResident, 'es-nat-red-dele-a2').status).toBe('met');
  });

  it('does NOT extend the reduction to a dual national who resides under the other passport', () => {
    // The headline correctness case. An Italian-Mexican admitted to Spain and
    // holding residence as an EU citizen cannot reach back for the two-year
    // period on the strength of the Mexican passport she did not enter on.
    const report = evaluate(
      esNationalityResidenceReduced,
      italianMexicanEnteredOnItalianPassport,
      TODAY,
    );
    expect(report.verdict).toBe('ineligible');
    expect(report.blockingFailures).toContain('es-nat-red-nationality-of-residence');
  });

  it('does NOT extend the reduction to a qualifying nationality acquired by residence', () => {
    // Art. 22.1 says *nacionales de origen*. Someone born elsewhere who later
    // obtained a listed nationality by residence is on the ten-year general
    // regime. Reading the passport alone puts them eight years out.
    const naturalizedByResidence: ApplicantFacts = {
      ...mexicanTwoYearResident,
      applicantId: 'fixture-acquired-by-residence',
      claimedNationalityAcquisition: 'by_residence',
    };
    const report = evaluate(esNationalityResidenceReduced, naturalizedByResidence, TODAY);
    expect(report.verdict).toBe('ineligible');
    expect(report.blockingFailures).toContain('es-nat-red-nationality-by-origin');
  });

  it('is indeterminate, not eligible, when the acquisition mode is not on file', () => {
    const { claimedNationalityAcquisition: _omitted, ...withoutAcquisition } =
      mexicanTwoYearResident;
    const report = evaluate(
      esNationalityResidenceReduced,
      { ...withoutAcquisition, applicantId: 'fixture-acquisition-unknown' },
      TODAY,
    );
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('es-nat-red-nationality-by-origin');
    expect(report.blockingFailures).toEqual([]);
  });

  it('still ineligible when the same dual national claims the Italian nationality instead', () => {
    // Switching the claim does not help: Italy is not on the art. 22.1 list.
    const claimingItalian: ApplicantFacts = {
      ...italianMexicanEnteredOnItalianPassport,
      claimedNationality: IT,
      residenceHeldUnderNationality: IT,
    };
    const report = evaluate(esNationalityResidenceReduced, claimingItalian, TODAY);
    expect(report.verdict).toBe('ineligible');
    expect(report.blockingFailures).toContain('es-nat-red-qualifying-nationality');
  });

  it('surfaces the discretionary basis of the dual-nationality rule in the report notes', () => {
    const report = evaluate(esNationalityResidenceReduced, mexicanTwoYearResident, TODAY);
    const note = report.notes.find((n) => n.citationId === 'es-practice-claimed-nationality');
    expect(note?.code).toBe('discretionary_source');
    expect(note?.text).toContain('NOT A STATUTORY RULE');
  });

  it('marks every report from this catalog as resting on unreviewed rules', () => {
    const report = evaluate(esNationalityResidenceReduced, mexicanTwoYearResident, TODAY);
    expect(report.notes.some((n) => n.code === 'unreviewed_rule')).toBe(true);
  });

  it('reports indeterminate — not ineligible — when residence is not recorded', () => {
    const report = evaluate(esNationalityResidenceReduced, mexicanWithUnknownResidenceDays, TODAY);
    expect(report.verdict).toBe('indeterminate');
    expect(report.blockingFailures).toEqual([]);
    expect(report.unknowns).toEqual(['es-nat-red-two-years-continuous-residence']);
  });

  it('counts the two years inclusively at the boundary', () => {
    const exactlyTwoYears: ApplicantFacts = {
      ...mexicanTwoYearResident,
      residencePeriods: [dateRange(d('2024-07-26'), TODAY)],
    };
    const oneDayShort: ApplicantFacts = {
      ...mexicanTwoYearResident,
      residencePeriods: [dateRange(d('2024-07-27'), TODAY)],
    };
    expect(evaluate(esNationalityResidenceReduced, exactlyTwoYears, TODAY).verdict).toBe('eligible');
    expect(evaluate(esNationalityResidenceReduced, oneDayShort, TODAY).verdict).toBe('ineligible');
  });

  it('does not accept two years of residence that ended before the application', () => {
    // Art. 22.3 requires residence immediately prior to the application.
    const lapsed: ApplicantFacts = {
      ...mexicanTwoYearResident,
      residencePeriods: [dateRange(d('2018-01-01'), d('2023-01-01'))],
    };
    const report = evaluate(esNationalityResidenceReduced, lapsed, TODAY);
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('es-nat-red-two-years-continuous-residence');
  });

  it('is unmoved by the order residence periods arrive in', () => {
    const a = dateRange(d('2023-01-01'), d('2024-06-30'));
    const b = dateRange(d('2024-07-01'), TODAY);
    const forwards = evaluate(
      esNationalityResidenceReduced,
      { ...mexicanTwoYearResident, residencePeriods: [a, b] },
      TODAY,
    );
    const backwards = evaluate(
      esNationalityResidenceReduced,
      { ...mexicanTwoYearResident, residencePeriods: [b, a] },
      TODAY,
    );
    expect(forwards.verdict).toBe(backwards.verdict);
    expect(forwards.blockingFailures).toEqual(backwards.blockingFailures);
  });

  it('requires a police certificate from the country of the claimed nationality, not just Spain', () => {
    const spainOnly: ApplicantFacts = {
      ...mexicanTwoYearResident,
      criminalRecord: { certificates: [{ jurisdiction: ES, clear: true }] },
    };
    const report = evaluate(esNationalityResidenceReduced, spainOnly, TODAY);
    expect(report.blockingFailures).toContain('es-nat-red-civic-conduct');
  });

  it('treats a declared but non-clear certificate as a failure, and a missing one as unknown', () => {
    const notClear: ApplicantFacts = {
      ...mexicanTwoYearResident,
      criminalRecord: {
        certificates: [
          { jurisdiction: ES, clear: false },
          { jurisdiction: MX, clear: true },
        ],
      },
    };
    expect(criterion(notClear, 'es-nat-red-civic-conduct').status).toBe('unmet');

    const noRecord: ApplicantFacts = { ...mexicanTwoYearResident, criminalRecord: undefined };
    expect(criterion(noRecord, 'es-nat-red-civic-conduct').status).toBe('unknown');
  });
});

describe('the DELE exemption follows the language, not the region', () => {
  it('does not exempt Brazilians, who qualify for the two-year period but not the language waiver', () => {
    expect(SPANISH_OFFICIAL_LANGUAGE_COUNTRIES).not.toContain(BR);
    const brazilian: ApplicantFacts = {
      ...mexicanTwoYearResident,
      nationalities: [BR],
      claimedNationality: BR,
      residenceHeldUnderNationality: BR,
      criminalRecord: {
        certificates: [
          { jurisdiction: ES, clear: true },
          { jurisdiction: BR, clear: true },
        ],
      },
    };
    const report = evaluate(esNationalityResidenceReduced, brazilian, TODAY);
    const dele = report.criteria.find((c) => c.criterionId === 'es-nat-red-dele-a2');
    expect(dele?.status).toBe('unknown');
    expect(report.verdict).toBe('indeterminate');

    const withDele: ApplicantFacts = {
      ...brazilian,
      languageCertifications: [{ language: 'es', framework: 'cefr', level: 'B1' }],
    };
    expect(evaluate(esNationalityResidenceReduced, withDele, TODAY).verdict).toBe('eligible');
  });

  it('rejects a Spanish certificate below A2', () => {
    const brazilianA1: ApplicantFacts = {
      ...mexicanTwoYearResident,
      nationalities: [BR],
      claimedNationality: BR,
      residenceHeldUnderNationality: BR,
      languageCertifications: [{ language: 'es', framework: 'cefr', level: 'A1' }],
      criminalRecord: {
        certificates: [
          { jurisdiction: ES, clear: true },
          { jurisdiction: BR, clear: true },
        ],
      },
    };
    const report = evaluate(esNationalityResidenceReduced, brazilianA1, TODAY);
    expect(report.blockingFailures).toContain('es-nat-red-dele-a2');
  });
});

describe('report packaging', () => {
  it('is born classified as an assessment, with the citations it leaned on', () => {
    const report = evaluate(esNationalityResidenceReduced, mexicanTwoYearResident, TODAY);
    const wrapped = assessmentOf(report);
    expect(wrapped.classification).toBe('assessment');
    expect(wrapped.citationIds).toEqual(reportCitationIds(report));
    expect(wrapped.citationIds).toContain('es-cc-art-22-1');
    // Sorted, so two runs of the same facts produce byte-identical output.
    expect([...wrapped.citationIds]).toEqual([...wrapped.citationIds].sort());
  });

  it('evaluateAll keeps catalog order rather than sorting by outcome', () => {
    const catalog = [esNationalityResidenceReduced, esNonLucrativeVisa, esGoldenVisa];
    const reports = evaluateAll(catalog, mexicanTwoYearResident, TODAY);
    expect(reports.map((r) => r.pathwayId)).toEqual(catalog.map((p) => p.id));
  });
});

describe('es-nationality-residence-general', () => {
  it('is the fallback: two years is not enough, ten is', () => {
    const twoYears = evaluate(esNationalityResidenceGeneral, mexicanTwoYearResident, TODAY);
    expect(twoYears.verdict).toBe('ineligible');
    expect(twoYears.blockingFailures).toContain('es-nat-gen-ten-years-continuous-residence');

    const tenYears = evaluate(
      esNationalityResidenceGeneral,
      { ...mexicanTwoYearResident, residencePeriods: [dateRange(d('2010-01-01'), TODAY)] },
      TODAY,
    );
    expect(tenYears.verdict).toBe('eligible');
  });

  it('applies to a nationality the reduced regime does not reach', () => {
    const italian: ApplicantFacts = {
      applicantId: 'it-ten-year',
      nationalities: [IT],
      claimedNationality: IT,
      residenceHeldUnderNationality: IT,
      dateOfBirth: d('1985-01-01'),
      currentStatus: 'resident',
      residencePeriods: [dateRange(d('2010-01-01'), TODAY)],
      examResults: [{ code: 'CCSE', passed: true }],
      languageCertifications: [{ language: 'es', framework: 'cefr', level: 'B2' }],
      criminalRecord: {
        certificates: [
          { jurisdiction: ES, clear: true },
          { jurisdiction: IT, clear: true },
        ],
      },
    };
    expect(evaluate(esNationalityResidenceGeneral, italian, TODAY).verdict).toBe('eligible');
  });
});

describe('es-golden-visa (closed)', () => {
  it('stays in the catalog and answers ineligible with a reason instead of disappearing', () => {
    const report = evaluate(esGoldenVisa, mexicanTwoYearResident, TODAY);
    expect(report.verdict).toBe('ineligible');
    expect(report.pathwayStatus).toBe('closed');
    const closure = report.notes.find((n) => n.code === 'pathway_closed');
    expect(closure?.text).toContain('transitional regime');
  });

  it('reports the repeal date criterion as unmet for a new application', () => {
    const applyingToday: ApplicantFacts = {
      ...mexicanTwoYearResident,
      applicationLodgedOn: TODAY,
      qualifyingInvestment: { kind: 'real_estate', minorUnits: 60_000_000, currency: 'EUR' },
    };
    const report = evaluate(esGoldenVisa, applyingToday, TODAY);
    expect(report.blockingFailures).toContain('es-gv-application-before-repeal');
  });

  it('was open the day before the repeal took effect, and evaluates historically', () => {
    const dayBefore = isoDate('2025-04-02');
    expect(statusOn(esGoldenVisa, dayBefore)).toBe('open');
    expect(statusOn(esGoldenVisa, isoDate('2025-04-03'))).toBe('closed');

    const investor: ApplicantFacts = {
      applicantId: 'investor',
      nationalities: [MX],
      claimedNationality: MX,
      applicationLodgedOn: isoDate('2024-06-01'),
      qualifyingInvestment: { kind: 'real_estate', minorUnits: 55_000_000, currency: 'EUR' },
      criminalRecord: { certificates: [{ jurisdiction: MX, clear: true }] },
    };
    expect(evaluate(esGoldenVisa, investor, dayBefore).verdict).toBe('eligible');
  });

  it('applies the investment thresholds per instrument type', () => {
    const dayBefore = isoDate('2025-04-02');
    const base: ApplicantFacts = {
      applicantId: 'investor',
      nationalities: [MX],
      claimedNationality: MX,
      applicationLodgedOn: isoDate('2024-06-01'),
      criminalRecord: { certificates: [{ jurisdiction: MX, clear: true }] },
    };
    // EUR 500,000 of real estate qualified; the same sum in public debt did not.
    const realEstate = evaluate(
      esGoldenVisa,
      { ...base, qualifyingInvestment: { kind: 'real_estate', minorUnits: 50_000_000, currency: 'EUR' } },
      dayBefore,
    );
    const publicDebt = evaluate(
      esGoldenVisa,
      { ...base, qualifyingInvestment: { kind: 'public_debt', minorUnits: 50_000_000, currency: 'EUR' } },
      dayBefore,
    );
    expect(realEstate.verdict).toBe('eligible');
    expect(publicDebt.blockingFailures).toContain('es-gv-qualifying-investment');
  });

  it('refuses to measure a euro threshold against another currency', () => {
    const dayBefore = isoDate('2025-04-02');
    const report = evaluate(
      esGoldenVisa,
      {
        applicantId: 'investor',
        nationalities: [MX],
        claimedNationality: MX,
        applicationLodgedOn: isoDate('2024-06-01'),
        qualifyingInvestment: { kind: 'real_estate', minorUnits: 900_000_000, currency: 'MXN' },
        criminalRecord: { certificates: [{ jurisdiction: MX, clear: true }] },
      },
      dayBefore,
    );
    expect(report.blockingFailures).toContain('es-gv-qualifying-investment');
  });
});

describe('es-non-lucrative-visa', () => {
  const base: ApplicantFacts = {
    applicantId: 'nlv',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: ES,
    currentStatus: 'none',
    intent: { noEconomicActivityInTargetState: true },
    healthInsurance: { hasPrivateCoverage: true, insurerAuthorizedIn: ES, coversFullPeriod: true },
    criminalRecord: { certificates: [{ jurisdiction: MX, clear: true }] },
    referenceIndices: { ipremAnnualMinorUnits: 800_000, currency: 'EUR' },
  };

  it('expresses the means test as a multiple of IPREM rather than a hardcoded euro figure', () => {
    const enough = evaluate(
      esNonLucrativeVisa,
      { ...base, passiveIncome: { minorUnits: 3_400_000, currency: 'EUR', period: 'annual' } },
      TODAY,
    );
    expect(enough.verdict).toBe('eligible');

    const notEnough = evaluate(
      esNonLucrativeVisa,
      { ...base, passiveIncome: { minorUnits: 3_000_000, currency: 'EUR', period: 'annual' } },
      TODAY,
    );
    expect(notEnough.blockingFailures).toContain('es-nlv-economic-means');
  });

  it('reports unknown when the index for the year has not been supplied', () => {
    const report = evaluate(
      esNonLucrativeVisa,
      {
        ...base,
        referenceIndices: undefined,
        passiveIncome: { minorUnits: 9_000_000, currency: 'EUR', period: 'annual' },
      },
      TODAY,
    );
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('es-nlv-economic-means');
  });

  it('leads to both naturalisation routes', () => {
    expect(esNonLucrativeVisa.leadsTo).toEqual([
      'es-nationality-residence-reduced',
      'es-nationality-residence-general',
    ]);
  });
});
