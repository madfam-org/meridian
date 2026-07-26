/**
 * The five *arraigo* figures of the Reglamento, plus the closed extraordinary one.
 *
 * The single most important property of this file is negative: **no arraigo
 * route can be decided by this engine, for anybody.** Every one of them turns
 * on continuous *physical presence* in Spain, and physical presence is not a
 * fact Meridian holds — it holds legal residence, which by definition an
 * arraigo applicant does not have. So each route carries an unconditional
 * escalation and the verdict is `requires_human_review` however complete the
 * applicant's record is. A green tick here would be the platform telling
 * somebody without status that they qualify, on evidence it never saw.
 *
 * The criteria that *are* decidable are the exclusions — already holding a
 * status, or the criminal-record certificate — and those are tested for the
 * false positives they prevent.
 */

import { dateRange, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  ES_ARRAIGO_PATHWAYS,
  esArraigoExtraordinario,
  esArraigoFamiliar,
  esArraigoSegundaOportunidad,
  esArraigoSocial,
  esArraigoSociolaboral,
  esArraigoSocioformativo,
} from '../src/catalog/es-arraigo.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { statusOn } from '../src/schema.js';
import { d, ES, irregularInSpain, MX, TODAY } from './fixtures.js';

const OPEN_ARRAIGO = [
  esArraigoSegundaOportunidad,
  esArraigoSociolaboral,
  esArraigoSocial,
  esArraigoSocioformativo,
  esArraigoFamiliar,
];

describe('the arraigo family as a whole', () => {
  it('holds the six figures the Reglamento names, in one module', () => {
    expect(ES_ARRAIGO_PATHWAYS.map((p) => p.id)).toEqual([
      'es-arraigo-segunda-oportunidad',
      'es-arraigo-sociolaboral',
      'es-arraigo-social',
      'es-arraigo-socioformativo',
      'es-arraigo-familiar',
      'es-arraigo-extraordinario',
    ]);
  });

  it('refuses to decide any open arraigo route, however complete the record', () => {
    for (const pathway of OPEN_ARRAIGO) {
      const report = evaluate(pathway, irregularInSpain, TODAY);
      expect(report.verdict, pathway.id).toBe('requires_human_review');
      expect(report.humanReviewCriterionIds.length, pathway.id).toBeGreaterThan(0);
    }
  });

  it('says what the reviewer has to establish, rather than "cannot be decided"', () => {
    const report = evaluate(esArraigoSocial, irregularInSpain, TODAY);
    const escalated = report.criteria.filter((c) => c.status === 'requires_human_review');
    expect(escalated.length).toBeGreaterThan(0);
    for (const criterion of escalated) {
      expect(criterion.humanReviewReason).toBeDefined();
      expect(criterion.humanReviewReason).not.toBe(
        'This criterion cannot be decided automatically and must be reviewed by a person.',
      );
    }
  });

  it('bridges every open figure to both naturalisation routes', () => {
    for (const pathway of OPEN_ARRAIGO) {
      expect(pathway.leadsTo, pathway.id).toEqual([
        'es-nationality-residence-reduced',
        'es-nationality-residence-general',
      ]);
    }
  });

  it('marks every report as resting on rules nobody has signed off', () => {
    for (const pathway of ES_ARRAIGO_PATHWAYS) {
      const report = evaluate(pathway, irregularInSpain, TODAY);
      expect(report.notes.some((n) => n.code === 'unreviewed_rule'), pathway.id).toBe(true);
    }
  });
});

describe('the exclusions arraigo does decide', () => {
  it('rules out somebody who already holds a residence authorisation', () => {
    const lawfulResident: ApplicantFacts = {
      ...irregularInSpain,
      currentStatus: 'resident',
      residencePeriods: [dateRange(d('2023-01-01'), TODAY)],
    };
    for (const pathway of OPEN_ARRAIGO) {
      const report = evaluate(pathway, lawfulResident, TODAY);
      const failed = report.criteria.find((c) => c.criterionId.endsWith('no-current-authorisation'));
      expect(failed?.status, pathway.id).toBe('unmet');
      expect(report.blockingFailures, pathway.id).toContain(failed?.criterionId);
    }
  });

  it('rules out a student and a worker as well as a resident', () => {
    for (const status of ['student', 'worker', 'permanent_resident', 'citizen'] as const) {
      const report = evaluate(esArraigoSocial, { ...irregularInSpain, currentStatus: status }, TODAY);
      expect(report.blockingFailures, status).toContain('es-arr-soc-no-current-authorisation');
    }
  });

  it('holds the protection-applicant exclusion without deciding anything about protection', () => {
    // Asylum and refugee protection are out of scope for this catalog. What is
    // encoded here is only the arraigo-side exclusion: a pending protection
    // claim closes this door while it runs. Nothing about the claim itself is
    // assessed, and nothing here should be read as advice on one.
    const claimant: ApplicantFacts = { ...irregularInSpain, currentStatus: 'asylum_seeker' };
    const report = evaluate(esArraigoSocial, claimant, TODAY);
    expect(report.blockingFailures).toContain('es-arr-soc-not-protection-applicant');
  });

  it('wants a clear certificate from the country of the claimed nationality', () => {
    const spainOnly: ApplicantFacts = {
      ...irregularInSpain,
      criminalRecord: { certificates: [{ jurisdiction: ES, clear: true }] },
    };
    const report = evaluate(esArraigoSocial, spainOnly, TODAY);
    expect(report.blockingFailures).toContain('es-arr-soc-criminal-record');
  });

  it('separates "no record on file" from "a record that is not clear"', () => {
    const unknown = evaluate(
      esArraigoSocial,
      { ...irregularInSpain, criminalRecord: undefined },
      TODAY,
    );
    expect(unknown.criteria.find((c) => c.criterionId === 'es-arr-soc-criminal-record')?.status).toBe(
      'unknown',
    );
    expect(unknown.blockingFailures).not.toContain('es-arr-soc-criminal-record');

    const notClear = evaluate(
      esArraigoSocial,
      { ...irregularInSpain, criminalRecord: { certificates: [{ jurisdiction: MX, clear: false }] } },
      TODAY,
    );
    expect(notClear.blockingFailures).toContain('es-arr-soc-criminal-record');
  });
});

describe('es-arraigo-sociolaboral — the contract conditions', () => {
  const withOffer = (over: Partial<NonNullable<ApplicantFacts['jobOffer']>>): ApplicantFacts => ({
    ...irregularInSpain,
    jobOffer: {
      employerCountry: ES,
      writtenOffer: true,
      selfEmployment: false,
      fullTime: true,
      durationMonths: 12,
      annualSalaryMinorUnits: 1_800_000,
      currency: 'EUR',
      ...over,
    },
  });

  it('rejects an offer of self-employment dressed as a contract', () => {
    const report = evaluate(esArraigoSociolaboral, withOffer({ selfEmployment: true }), TODAY);
    expect(report.blockingFailures).toContain('es-arr-sl-employment-contract');
  });

  it('escalates a part-time post rather than deciding the twenty-hour threshold itself', () => {
    // The engine records "full-time or not", not weekly hours. A part-time post
    // may well clear twenty hours, so answering "no" would be inventing a fact.
    const report = evaluate(esArraigoSociolaboral, withOffer({ fullTime: false }), TODAY);
    expect(report.humanReviewCriterionIds).toContain('es-arr-sl-weekly-hours');
    const criterion = report.criteria.find((c) => c.criterionId === 'es-arr-sl-weekly-hours');
    expect(criterion?.status).toBe('requires_human_review');
  });

  it('escalates a wage below the SMI multiple instead of refusing on it', () => {
    const report = evaluate(
      esArraigoSociolaboral,
      withOffer({ annualSalaryMinorUnits: 900_000 }),
      TODAY,
    );
    expect(report.humanReviewCriterionIds).toContain('es-arr-sl-wage');
    expect(report.blockingFailures).not.toContain('es-arr-sl-wage');
  });

  it('will not measure a euro wage threshold against another currency', () => {
    const pesos = evaluate(
      esArraigoSociolaboral,
      withOffer({ annualSalaryMinorUnits: 60_000_000, currency: 'MXN' }),
      TODAY,
    );
    const wage = pesos.criteria.find((c) => c.criterionId === 'es-arr-sl-wage');
    // No SMI multiple can be computed, so the criterion is unknown — never a
    // pass on a number denominated in the wrong money.
    expect(wage?.status).not.toBe('met');
  });
});

describe('es-arraigo-familiar is the one with a different clock', () => {
  it('grants five years where the other figures grant one', () => {
    expect(esArraigoFamiliar.durations.initialGrantMonths).toBe(60);
    expect(esArraigoFamiliar.durations.renewalMonths).toBe(60);
    for (const pathway of [esArraigoSegundaOportunidad, esArraigoSociolaboral, esArraigoSocial]) {
      expect(pathway.durations.initialGrantMonths, pathway.id).toBe(12);
    }
  });

  it('states that no minimum period of presence applies, as an informational criterion', () => {
    const report = evaluate(esArraigoFamiliar, irregularInSpain, TODAY);
    const criterion = report.criteria.find((c) => c.criterionId === 'es-arr-fam-no-minimum-presence');
    expect(criterion?.weight).toBe('informational');
    // Informational criteria never move the verdict, in either direction.
    expect(report.blockingFailures).not.toContain('es-arr-fam-no-minimum-presence');
    expect(report.unknowns).not.toContain('es-arr-fam-no-minimum-presence');
  });
});

describe('es-arraigo-extraordinario (closed)', () => {
  it('answers ineligible today, with the closure note attached', () => {
    const report = evaluate(esArraigoExtraordinario, irregularInSpain, TODAY);
    expect(report.verdict).toBe('ineligible');
    expect(report.pathwayStatus).toBe('closed');
    expect(report.notes.find((n) => n.code === 'pathway_closed')?.text).toContain('30 de junio');
  });

  it('was open the day before the deadline and shut on it', () => {
    expect(statusOn(esArraigoExtraordinario, isoDate('2026-06-30'))).toBe('open');
    expect(statusOn(esArraigoExtraordinario, isoDate('2026-07-01'))).toBe('closed');
  });

  it('had not opened before the Real Decreto that created it', () => {
    expect(statusOn(esArraigoExtraordinario, isoDate('2026-04-15'))).toBe('suspended');
    const report = evaluate(esArraigoExtraordinario, irregularInSpain, isoDate('2026-04-15'));
    expect(report.notes.some((n) => n.code === 'pathway_not_yet_open')).toBe(true);
  });

  it('still needs a person to look, even inside the window', () => {
    const insideWindow = isoDate('2026-05-15');
    const filedInTime: ApplicantFacts = {
      ...irregularInSpain,
      applicationLodgedOn: isoDate('2026-05-01'),
      jobOffer: { employerCountry: ES, writtenOffer: true },
    };
    const report = evaluate(esArraigoExtraordinario, filedInTime, insideWindow);
    expect(report.pathwayStatus).toBe('open');
    expect(report.verdict).toBe('requires_human_review');
  });

  it('reports the filing deadline as unmet for an application lodged after it', () => {
    const late: ApplicantFacts = { ...irregularInSpain, applicationLodgedOn: isoDate('2026-07-02') };
    const report = evaluate(esArraigoExtraordinario, late, isoDate('2026-06-20'));
    expect(report.blockingFailures).toContain('es-arr-ext-filed-within-window');
  });

  it('crosses eighteen exactly once, on a 29 February birthday', () => {
    // The fixture was born on 29 February, so her eighteenth anniversary falls
    // in a year that has no 29 February. `addYears` in core clamps to the last
    // day of the month, which puts the engine's boundary at 28 February 2010.
    //
    // This test pins the arithmetic, not a legal position: whether a person
    // born on 29 February attains majority on 28 February or on 1 March is a
    // question of civil computation that no source in this catalog settles, and
    // an applicant sitting on that exact day needs a person, not a checker.
    const ageOn = (asOf: string) =>
      evaluate(esArraigoExtraordinario, { ...irregularInSpain, applicationLodgedOn: isoDate(asOf) }, isoDate(asOf))
        .criteria.find((c) => c.criterionId === 'es-arr-ext-age')?.status;

    expect(ageOn('2010-02-27')).toBe('unmet');
    expect(ageOn('2010-02-28')).toBe('met');
    expect(ageOn('2010-03-01')).toBe('met');
    // And it does not oscillate afterwards.
    expect(ageOn('2012-02-29')).toBe('met');
  });
});
