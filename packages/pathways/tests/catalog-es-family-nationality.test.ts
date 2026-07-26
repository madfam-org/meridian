/**
 * Spain's family routes and the nationality routes that are not the residence ones.
 *
 * Two themes run through this module and both are about what the engine
 * declines to do.
 *
 * The family routes turn on facts about a *second person* — a sponsor, a Union
 * citizen, a parent. Meridian's facts model holds one applicant, so every one
 * of those criteria escalates rather than guessing, and the tests below assert
 * that it escalates *with a reason* rather than with a shrug.
 *
 * The nationality routes here are the discretionary ones. `carta de
 * naturaleza` prescribes no criteria at all, and a route with no criteria
 * cannot be scored; saying so is the only honest output.
 */

import { dateRange, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  ES_FAMILY_NATIONALITY_PATHWAYS,
  esEuFamilyMemberCard,
  esEuFamilyPermanentResidence,
  esFamilyReunification,
  esNationalityCartaDeNaturaleza,
  esNationalityDemocraticMemoryOption,
  esNationalityOption,
  esNationalityResidenceSephardic,
  EU_EEA_NATIONALITIES,
} from '../src/catalog/es-family-nationality.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { statusOn } from '../src/schema.js';
import { BR, d, ES, IT, MX, TODAY } from './fixtures.js';

const baseApplicant: ApplicantFacts = {
  applicantId: 'fixture-es-family',
  nationalities: [MX],
  claimedNationality: MX,
  dateOfBirth: d('1990-06-15'),
  targetJurisdiction: ES,
  currentStatus: 'resident',
  criminalRecord: { certificates: [{ jurisdiction: ES, clear: true }] },
};

describe('the module', () => {
  it('holds the seven routes, in declaration order', () => {
    expect(ES_FAMILY_NATIONALITY_PATHWAYS.map((p) => p.id)).toEqual([
      'es-family-reunification',
      'es-eu-family-member-card',
      'es-eu-family-permanent-residence',
      'es-nationality-option',
      'es-nationality-democratic-memory-option',
      'es-nationality-carta-de-naturaleza',
      'es-nationality-residence-sephardic',
    ]);
  });

  it('names the EU and EEA states as data rather than hiding the list in a rule', () => {
    expect(EU_EEA_NATIONALITIES).toContain(IT);
    expect(EU_EEA_NATIONALITIES).toContain(ES);
    expect(EU_EEA_NATIONALITIES).not.toContain(MX);
    expect(EU_EEA_NATIONALITIES).not.toContain(BR);
    expect(new Set(EU_EEA_NATIONALITIES).size).toBe(EU_EEA_NATIONALITIES.length);
  });
});

describe('es-family-reunification', () => {
  it('cannot be decided, because half the facts belong to somebody else', () => {
    const report = evaluate(esFamilyReunification, baseApplicant, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toEqual(
      expect.arrayContaining([
        'es-fr-qualifying-family-member',
        'es-fr-sponsor-resources',
        'es-fr-adequate-housing',
      ]),
    );
  });

  it('still decides the sponsor-side criterion it can', () => {
    const notResident: ApplicantFacts = { ...baseApplicant, currentStatus: 'visitor' };
    const report = evaluate(esFamilyReunification, notResident, TODAY);
    expect(report.blockingFailures).toContain('es-fr-sponsor-is-resident');
  });

  it('measures the sponsor’s year of residence from an unbroken run that reaches today', () => {
    const oneYear: ApplicantFacts = {
      ...baseApplicant,
      residencePeriods: [dateRange(d('2025-07-26'), TODAY)],
    };
    const criterion = evaluate(esFamilyReunification, oneYear, TODAY).criteria.find(
      (c) => c.criterionId === 'es-fr-sponsor-one-year-residence',
    );
    expect(criterion?.status).toBe('met');

    const oneDayShort: ApplicantFacts = {
      ...baseApplicant,
      residencePeriods: [dateRange(d('2025-07-27'), TODAY)],
    };
    expect(
      evaluate(esFamilyReunification, oneDayShort, TODAY).criteria.find(
        (c) => c.criterionId === 'es-fr-sponsor-one-year-residence',
      )?.status,
    ).toBe('unmet');
  });

  it('states no grant length, because the relative’s permit tracks the sponsor’s', () => {
    expect(esFamilyReunification.durations.initialGrantMonths).toBeUndefined();
    expect(esFamilyReunification.durations.note?.es).toBeDefined();
  });
});

describe('es-eu-family-member-card', () => {
  it('excludes an applicant who is themselves an EU national', () => {
    const italian: ApplicantFacts = { ...baseApplicant, nationalities: [IT], claimedNationality: IT };
    expect(evaluate(esEuFamilyMemberCard, italian, TODAY).blockingFailures).toContain(
      'es-eufm-not-eu-eea-national',
    );
  });

  it('excludes a dual national who holds an EU nationality alongside a third-country one', () => {
    // The route exists for family members who are *not* Union citizens. Holding
    // one at all takes a person out of it, whichever passport they claim.
    const dual: ApplicantFacts = { ...baseApplicant, nationalities: [MX, IT], claimedNationality: MX };
    expect(evaluate(esEuFamilyMemberCard, dual, TODAY).blockingFailures).toContain(
      'es-eufm-not-eu-eea-national',
    );
  });

  it('lets a third-country national past that criterion and then asks for a person', () => {
    const report = evaluate(esEuFamilyMemberCard, baseApplicant, TODAY);
    expect(report.criteria.find((c) => c.criterionId === 'es-eufm-not-eu-eea-national')?.status).toBe(
      'met',
    );
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toEqual(
      expect.arrayContaining(['es-eufm-family-tie', 'es-eufm-citizen-meets-article-7']),
    );
  });

  it('reports the three-month application window without letting it decide anything', () => {
    const justArrived: ApplicantFacts = {
      ...baseApplicant,
      travelHistory: { lastEntryOn: d('2026-06-01') },
    };
    const report = evaluate(esEuFamilyMemberCard, justArrived, TODAY);
    const window = report.criteria.find((c) => c.criterionId === 'es-eufm-application-window');
    expect(window?.weight).toBe('informational');
    expect(report.blockingFailures).not.toContain('es-eufm-application-window');
  });

  it('caps the card at five years, which is a ceiling and not a guarantee', () => {
    expect(esEuFamilyMemberCard.durations.initialGrantMonths).toBe(60);
  });
});

describe('es-eu-family-permanent-residence', () => {
  it('counts five continuous years to today, and not five that lapsed', () => {
    const current: ApplicantFacts = {
      ...baseApplicant,
      residencePeriods: [dateRange(d('2021-07-26'), TODAY)],
    };
    expect(
      evaluate(esEuFamilyPermanentResidence, current, TODAY).criteria.find(
        (c) => c.criterionId === 'es-eufp-five-years-continuous-residence',
      )?.status,
    ).toBe('met');

    const lapsed: ApplicantFacts = {
      ...baseApplicant,
      residencePeriods: [dateRange(d('2012-01-01'), d('2020-01-01'))],
    };
    expect(
      evaluate(esEuFamilyPermanentResidence, lapsed, TODAY).criteria.find(
        (c) => c.criterionId === 'es-eufp-five-years-continuous-residence',
      )?.status,
    ).toBe('unknown');
  });

  it('escalates whether those years were spent as a Union citizen’s family member', () => {
    const report = evaluate(esEuFamilyPermanentResidence, baseApplicant, TODAY);
    expect(report.humanReviewCriterionIds).toContain('es-eufp-residence-as-family-member');
  });
});

describe('es-nationality-option', () => {
  it('escalates which limb of art. 20.1 applies', () => {
    const report = evaluate(esNationalityOption, baseApplicant, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('es-opt-qualifying-ground');
  });

  it('reports the age window and the renunciation position as information only', () => {
    const report = evaluate(esNationalityOption, baseApplicant, TODAY);
    for (const id of ['es-opt-age-window', 'es-opt-renunciation-required']) {
      expect(report.criteria.find((c) => c.criterionId === id)?.weight).toBe('informational');
    }
    expect(report.blockingFailures).toEqual([]);
  });

  it('does not treat time on an option as counting toward a residence clock', () => {
    expect(esNationalityOption.durations.countsTowardNaturalisation).toBe(false);
  });
});

describe('es-nationality-democratic-memory-option (closed)', () => {
  it('answers ineligible today and keeps the closure note', () => {
    const report = evaluate(esNationalityDemocraticMemoryOption, baseApplicant, TODAY);
    expect(report.verdict).toBe('ineligible');
    expect(report.pathwayStatus).toBe('closed');
    expect(report.notes.some((n) => n.code === 'pathway_closed')).toBe(true);
  });

  it('was open on the last day of the extended window and shut the day after', () => {
    expect(statusOn(esNationalityDemocraticMemoryOption, isoDate('2025-10-22'))).toBe('open');
    expect(statusOn(esNationalityDemocraticMemoryOption, isoDate('2025-10-23'))).toBe('closed');
  });

  it('had not opened before the Act commenced', () => {
    expect(statusOn(esNationalityDemocraticMemoryOption, isoDate('2022-10-20'))).toBe('suspended');
  });

  it('marks a declaration lodged after the deadline as unmet, assessed inside the window', () => {
    const insideWindow = isoDate('2025-06-01');
    const late: ApplicantFacts = { ...baseApplicant, applicationLodgedOn: isoDate('2025-10-24') };
    const report = evaluate(esNationalityDemocraticMemoryOption, late, insideWindow);
    expect(report.pathwayStatus).toBe('open');
    expect(report.blockingFailures).toContain('es-dmo-declaration-within-window');
  });
});

describe('es-nationality-carta-de-naturaleza', () => {
  it('says there is nothing to measure rather than measuring something else', () => {
    const report = evaluate(esNationalityCartaDeNaturaleza, baseApplicant, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    const criterion = report.criteria.find(
      (c) => c.criterionId === 'es-cdn-exceptional-circumstances',
    );
    expect(criterion?.status).toBe('requires_human_review');
    expect(criterion?.humanReviewReason).toContain('discretionary');
  });

  it('carries no criterion that could produce an eligible verdict on its own', () => {
    const blocking = esNationalityCartaDeNaturaleza.criteria.filter((c) => c.weight === 'blocking');
    expect(blocking).toHaveLength(1);
    expect(blocking[0]?.requiresHumanReview).toBe(true);
  });
});

describe('es-nationality-residence-sephardic', () => {
  const resident: ApplicantFacts = {
    ...baseApplicant,
    residencePeriods: [dateRange(d('2024-07-26'), TODAY)],
    examResults: [{ code: 'CCSE', passed: true }],
  };

  it('escalates the Sephardic condition itself, which no instrument tells it how to prove', () => {
    const report = evaluate(esNationalityResidenceSephardic, resident, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('es-sef-sephardic-condition');
  });

  it('applies the same two-year clock as the reduced regime, at the same boundary', () => {
    const exact = evaluate(esNationalityResidenceSephardic, resident, TODAY).criteria.find(
      (c) => c.criterionId === 'es-sef-two-years-continuous-residence',
    );
    expect(exact?.status).toBe('met');

    const oneDayShort = evaluate(
      esNationalityResidenceSephardic,
      { ...resident, residencePeriods: [dateRange(d('2024-07-27'), TODAY)] },
      TODAY,
    ).criteria.find((c) => c.criterionId === 'es-sef-two-years-continuous-residence');
    expect(oneDayShort?.status).toBe('unmet');
  });

  it('still requires the CCSE and the language evidence the general regime requires', () => {
    const noCcse: ApplicantFacts = { ...resident, examResults: [] };
    const report = evaluate(esNationalityResidenceSephardic, noCcse, TODAY);
    expect(report.blockingFailures).toContain('es-sef-ccse');
  });

  it('waives the language evidence for a Spanish-speaking nationality and not otherwise', () => {
    const mexican = evaluate(esNationalityResidenceSephardic, resident, TODAY).criteria.find(
      (c) => c.criterionId === 'es-sef-dele-a2',
    );
    expect(mexican?.status).toBe('met');

    const brazilian = evaluate(
      esNationalityResidenceSephardic,
      { ...resident, nationalities: [BR], claimedNationality: BR },
      TODAY,
    ).criteria.find((c) => c.criterionId === 'es-sef-dele-a2');
    expect(brazilian?.status).toBe('unknown');
  });
});
