/**
 * The routes where a government other than IRCC does the selecting.
 *
 * These four records are frameworks, and they say so. A provincial nominee
 * stream is written by the province, revised without notice and opened and
 * closed on the province's own timetable; Quebec's programs run on invitation
 * rounds published in the Gazette officielle and on a French scale Meridian
 * does not hold. Encoding any of that would be encoding a snapshot that is
 * wrong by the next quarter, so what is encoded is the *shape*: selection and
 * admissibility are separate decisions taken by separate governments, and the
 * selection half is not something this engine can reach.
 *
 * The one thing these records do decide crisply is the Quebec fork, and it
 * cuts both ways: a federal economic class needs an intention to settle outside
 * Quebec, and every Quebec route needs the opposite. Getting that backwards is
 * the cheapest possible way to send somebody down a route that cannot work.
 */

import { isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  CA_PROVINCIAL_QUEBEC_PATHWAYS,
  caProvincialNomineeProgram,
  caQuebecExperiencePeq,
  caQuebecSelectionCsq,
  caQuebecSkilledWorkerPstq,
} from '../src/catalog/ca-provincial-quebec.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { CA, d, MX, TODAY } from './fixtures.js';

const quebecBound: ApplicantFacts = {
  applicantId: 'fixture-ca-quebec',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: CA,
  dateOfBirth: d('1993-05-05'),
  currentStatus: 'worker',
  languageCertifications: [{ language: 'fr', framework: 'nclc', level: '7' }],
  intent: { intendsToResideOutsideQuebec: false },
  criminalRecord: { selfDeclaredClear: true },
};

const restOfCanadaBound: ApplicantFacts = {
  ...quebecBound,
  applicantId: 'fixture-ca-pnp',
  intent: { intendsToResideOutsideQuebec: true },
};

describe('the module', () => {
  it('holds the four frameworks, in declaration order', () => {
    expect(CA_PROVINCIAL_QUEBEC_PATHWAYS.map((p) => p.id)).toEqual([
      'ca-provincial-nominee-program',
      'ca-quebec-selection-csq',
      'ca-quebec-skilled-worker-pstq',
      'ca-quebec-experience-peq',
    ]);
  });

  it('routes both Quebec selection programs to the certificate, and nowhere else', () => {
    expect(caQuebecSkilledWorkerPstq.leadsTo).toEqual(['ca-quebec-selection-csq']);
    expect(caQuebecExperiencePeq.leadsTo).toEqual(['ca-quebec-selection-csq']);
    expect(caProvincialNomineeProgram.leadsTo).toEqual([]);
  });

  it('records that a selection certificate is not permanent residence', () => {
    // A Quebec program produces a selection decision; the federal application
    // is a separate one, and the certificate expires while it is pending.
    expect(caQuebecSkilledWorkerPstq.durations.countsTowardNaturalisation).toBe(false);
    expect(caQuebecExperiencePeq.durations.countsTowardNaturalisation).toBe(false);
    expect(caQuebecSelectionCsq.durations.countsTowardNaturalisation).toBe(true);
  });
});

describe('the Quebec fork', () => {
  it('blocks a Quebec route for somebody intending to settle elsewhere', () => {
    for (const pathway of [caQuebecSelectionCsq, caQuebecSkilledWorkerPstq, caQuebecExperiencePeq]) {
      const report = evaluate(pathway, restOfCanadaBound, TODAY);
      const failed = report.blockingFailures.find((id) => id.endsWith('intent-to-reside-in-quebec'));
      expect(failed, pathway.id).toBeDefined();
    }
  });

  it('blocks the provincial nominee framework for somebody destined for Quebec', () => {
    expect(evaluate(caProvincialNomineeProgram, quebecBound, TODAY).blockingFailures).toContain(
      'ca-pnp-not-destined-for-quebec',
    );
  });

  it('is unknown rather than negative when the intention is not on file', () => {
    const noIntent: ApplicantFacts = { ...quebecBound, intent: undefined };
    const quebec = evaluate(caQuebecSelectionCsq, noIntent, TODAY);
    expect(quebec.blockingFailures).not.toContain('ca-qc-csq-intent-to-reside-in-quebec');
    expect(quebec.unknowns).toContain('ca-qc-csq-intent-to-reside-in-quebec');

    const federal = evaluate(caProvincialNomineeProgram, noIntent, TODAY);
    expect(federal.unknowns).toContain('ca-pnp-not-destined-for-quebec');
  });
});

describe('ca-provincial-nominee-program', () => {
  it('encodes no provincial stream and says so instead of pretending to', () => {
    const report = evaluate(caProvincialNomineeProgram, restOfCanadaBound, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    const criterion = report.criteria.find(
      (c) => c.criterionId === 'ca-pnp-nomination-by-a-province',
    );
    expect(criterion?.status).toBe('requires_human_review');
    expect(criterion?.humanReviewReason).toBeDefined();
  });

  it('escalates a nomination that a recorded capital investment might taint', () => {
    // s. 87(5) excludes a nomination based on the provision of capital. The
    // engine sees that capital exists, not what the nomination rested on.
    const investor: ApplicantFacts = {
      ...restOfCanadaBound,
      qualifyingInvestment: { kind: 'business_project', minorUnits: 50_000_000, currency: 'CAD' },
    };
    const report = evaluate(caProvincialNomineeProgram, investor, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-pnp-nomination-not-based-on-capital');
  });

  it('escalates a declared criminal record rather than calling it inadmissibility', () => {
    const declared: ApplicantFacts = {
      ...restOfCanadaBound,
      criminalRecord: { selfDeclaredClear: false },
    };
    const report = evaluate(caProvincialNomineeProgram, declared, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-pnp-admissibility');
    expect(report.blockingFailures).not.toContain('ca-pnp-admissibility');
  });
});

describe('ca-quebec-skilled-worker-pstq', () => {
  it('escalates the invitation, the volet conditions and the French assessment', () => {
    const report = evaluate(caQuebecSkilledWorkerPstq, quebecBound, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toEqual(
      expect.arrayContaining([
        'ca-qc-pstq-invitation-required',
        'ca-qc-pstq-volet-conditions',
        'ca-qc-pstq-french',
      ]),
    );
  });

  it('does not convert an NCLC result onto the Quebec French scale', () => {
    const criterion = evaluate(caQuebecSkilledWorkerPstq, quebecBound, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-qc-pstq-french',
    );
    expect(criterion?.status).toBe('requires_human_review');
    expect(criterion?.humanReviewReason).toContain('Échelle québécoise');
  });

  it('applies the adult-age condition to the principal applicant', () => {
    const minor: ApplicantFacts = { ...quebecBound, dateOfBirth: d('2010-01-01') };
    const report = evaluate(caQuebecSkilledWorkerPstq, minor, TODAY);
    expect(report.materialFailures).toContain('ca-qc-pstq-principal-applicant-adult');
  });
});

describe('ca-quebec-experience-peq', () => {
  it('accepts a filing inside the reactivated reception period', () => {
    const inside: ApplicantFacts = { ...quebecBound, applicationLodgedOn: isoDate('2026-08-15') };
    const criterion = evaluate(caQuebecExperiencePeq, inside, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-qc-peq-reception-period',
    );
    expect(criterion?.status).toBe('met');
  });

  it('closes the period at both ends, inclusively', () => {
    const firstDay: ApplicantFacts = { ...quebecBound, applicationLodgedOn: isoDate('2026-07-02') };
    const lastDay: ApplicantFacts = { ...quebecBound, applicationLodgedOn: isoDate('2026-10-31') };
    const dayBefore: ApplicantFacts = { ...quebecBound, applicationLodgedOn: isoDate('2026-07-01') };
    const dayAfter: ApplicantFacts = { ...quebecBound, applicationLodgedOn: isoDate('2026-11-01') };

    const status = (facts: ApplicantFacts) =>
      evaluate(caQuebecExperiencePeq, facts, TODAY).criteria.find(
        (c) => c.criterionId === 'ca-qc-peq-reception-period',
      )?.status;

    expect(status(firstDay)).toBe('met');
    expect(status(lastDay)).toBe('met');
    expect(status(dayBefore)).toBe('unmet');
    expect(status(dayAfter)).toBe('unmet');
  });

  it('is unknown, not unmet, when no filing date is recorded', () => {
    const report = evaluate(caQuebecExperiencePeq, quebecBound, TODAY);
    expect(report.blockingFailures).not.toContain('ca-qc-peq-reception-period');
    expect(report.criteria.find((c) => c.criterionId === 'ca-qc-peq-reception-period')?.status).toBe(
      'unknown',
    );
  });

  it('escalates the reception and selection conditions in any event', () => {
    const inside: ApplicantFacts = { ...quebecBound, applicationLodgedOn: isoDate('2026-08-15') };
    const report = evaluate(caQuebecExperiencePeq, inside, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toEqual(
      expect.arrayContaining(['ca-qc-peq-reception-criteria', 'ca-qc-peq-selection-conditions']),
    );
  });
});

describe('ca-quebec-selection-csq', () => {
  it('escalates whether a certificate has actually been issued', () => {
    const report = evaluate(caQuebecSelectionCsq, quebecBound, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-qc-csq-named-in-a-selection-certificate');
  });

  it('keeps admissibility federal, and escalates a declared record rather than refusing', () => {
    const declared: ApplicantFacts = {
      ...quebecBound,
      criminalRecord: { selfDeclaredClear: false },
    };
    const report = evaluate(caQuebecSelectionCsq, declared, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-qc-csq-admissibility-is-federal');
    expect(report.blockingFailures).not.toContain('ca-qc-csq-admissibility-is-federal');
  });
});
