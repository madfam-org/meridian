/**
 * The two federal economic classes other than the Canadian Experience Class.
 *
 * Both of these are classes in the Regulations, and neither of them is Express
 * Entry. That distinction is the thing most likely to hurt somebody here: a
 * person can meet s. 75(2) in full and never be invited, because the invitation
 * is issued under ministerial instructions that set the ranking and the cut-off
 * and are re-made round by round. So the records escalate everything that
 * depends on those instructions, and neither of them scores anybody.
 *
 * The other recurring theme is *hours*. IRCC measures the experience
 * requirements in hours — a full-time-equivalent year, 3,120 hours for the
 * trades — and Meridian records periods and TEER categories. Where those two
 * do not line up, the record escalates rather than converting.
 */

import { dateRange } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  CA_FEDERAL_ECONOMIC_PATHWAYS,
  caFederalSkilledTrades,
  caFederalSkilledWorker,
} from '../src/catalog/ca-federal-economic.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { CA, d, MX, TODAY } from './fixtures.js';

const fswCandidate: ApplicantFacts = {
  applicantId: 'fixture-ca-fsw',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: CA,
  dateOfBirth: d('1991-03-08'),
  educationLevel: 'bachelor',
  educationCountry: MX,
  workExperience: [
    {
      country: MX,
      period: dateRange(d('2019-01-01'), d('2024-12-31')),
      occupationTaxonomy: 'noc_2021',
      nocTeer: 1,
      fullTime: true,
      authorized: true,
    },
  ],
  languageCertifications: [{ language: 'en', framework: 'clb', level: '8' }],
  intent: { intendsToResideOutsideQuebec: true },
  criminalRecord: { selfDeclaredClear: true },
};

const fstCandidate: ApplicantFacts = {
  ...fswCandidate,
  applicantId: 'fixture-ca-fst',
  educationLevel: 'secondary',
  workExperience: [
    {
      country: MX,
      period: dateRange(d('2022-01-01'), d('2025-12-31')),
      occupationTaxonomy: 'noc_2021',
      nocTeer: 2,
      fullTime: true,
      authorized: true,
    },
  ],
  languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
};

describe('the module', () => {
  it('holds the two classes, in declaration order', () => {
    expect(CA_FEDERAL_ECONOMIC_PATHWAYS.map((p) => p.id)).toEqual([
      'ca-federal-skilled-worker',
      'ca-federal-skilled-trades',
    ]);
  });

  it('says in both records that the class is not the invitation system', () => {
    for (const pathway of CA_FEDERAL_ECONOMIC_PATHWAYS) {
      expect(pathway.durations.note?.en, pathway.id).toContain('Express Entry');
      expect(pathway.durations.publishedProcessingDays, pathway.id).toBeUndefined();
    }
  });

  it('bridges nowhere, because meeting a class is not a step toward another one', () => {
    for (const pathway of CA_FEDERAL_ECONOMIC_PATHWAYS) {
      expect(pathway.leadsTo, pathway.id).toEqual([]);
    }
  });
});

describe('ca-federal-skilled-worker', () => {
  it('will not issue a verdict on a candidate who appears to meet the minimums', () => {
    // Everything s. 75(2) asks for is on file, which is precisely when the
    // selection grid and the round cut-off decide the case.
    const report = evaluate(caFederalSkilledWorker, fswCandidate, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('ca-fsw-selection-points');
  });

  it('escalates the experience requirement because it is counted in hours', () => {
    const report = evaluate(caFederalSkilledWorker, fswCandidate, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-fsw-skilled-work-experience');
    const criterion = report.criteria.find((c) => c.criterionId === 'ca-fsw-skilled-work-experience');
    expect(criterion?.humanReviewReason).toBeDefined();
  });

  it('asks for a credential assessment when the education is not Canadian', () => {
    const report = evaluate(caFederalSkilledWorker, fswCandidate, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-fsw-education-credential');
  });

  it('does not ask for one when the credential is recorded as Canadian', () => {
    const canadianDegree: ApplicantFacts = { ...fswCandidate, educationCountry: CA };
    const criterion = evaluate(caFederalSkilledWorker, canadianDegree, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-fsw-education-credential',
    );
    expect(criterion?.status).toBe('met');
  });

  it('refuses a language result below the published benchmark', () => {
    const clb6: ApplicantFacts = {
      ...fswCandidate,
      languageCertifications: [{ language: 'en', framework: 'clb', level: '6' }],
    };
    expect(evaluate(caFederalSkilledWorker, clb6, TODAY).blockingFailures).toContain(
      'ca-fsw-language-threshold',
    );
  });

  it('accepts the benchmark exactly, and accepts French on the NCLC scale', () => {
    const clb7: ApplicantFacts = {
      ...fswCandidate,
      languageCertifications: [{ language: 'en', framework: 'clb', level: '7' }],
    };
    expect(
      evaluate(caFederalSkilledWorker, clb7, TODAY).criteria.find(
        (c) => c.criterionId === 'ca-fsw-language-threshold',
      )?.status,
    ).toBe('met');

    const nclc7: ApplicantFacts = {
      ...fswCandidate,
      languageCertifications: [{ language: 'fr', framework: 'nclc', level: '7' }],
    };
    expect(
      evaluate(caFederalSkilledWorker, nclc7, TODAY).criteria.find(
        (c) => c.criterionId === 'ca-fsw-language-threshold',
      )?.status,
    ).toBe('met');
  });

  it('does not read a CEFR level as a Canadian benchmark', () => {
    // C2 on the European scale is not CLB anything. Comparing them would be
    // arithmetic on two different rulers.
    const cefr: ApplicantFacts = {
      ...fswCandidate,
      languageCertifications: [{ language: 'en', framework: 'cefr', level: 'C2' }],
    };
    expect(evaluate(caFederalSkilledWorker, cefr, TODAY).blockingFailures).toContain(
      'ca-fsw-language-threshold',
    );
  });

  it('blocks a candidate destined for Quebec, which selects its own economic immigrants', () => {
    const quebecBound: ApplicantFacts = {
      ...fswCandidate,
      intent: { intendsToResideOutsideQuebec: false },
    };
    expect(evaluate(caFederalSkilledWorker, quebecBound, TODAY).blockingFailures).toContain(
      'ca-fsw-outside-quebec',
    );
  });

  it('is indeterminate, not negative, when intent has not been recorded', () => {
    const noIntent: ApplicantFacts = { ...fswCandidate, intent: undefined };
    const report = evaluate(caFederalSkilledWorker, noIntent, TODAY);
    expect(report.blockingFailures).not.toContain('ca-fsw-outside-quebec');
    expect(report.unknowns).toContain('ca-fsw-outside-quebec');
  });

  it('treats a declared record as information, not as an inadmissibility finding', () => {
    const declared: ApplicantFacts = {
      ...fswCandidate,
      criminalRecord: { selfDeclaredClear: false },
    };
    const report = evaluate(caFederalSkilledWorker, declared, TODAY);
    expect(report.criteria.find((c) => c.criterionId === 'ca-fsw-admissibility')?.weight).toBe(
      'informational',
    );
    expect(report.blockingFailures).not.toContain('ca-fsw-admissibility');
  });
});

describe('ca-federal-skilled-trades', () => {
  it('escalates rather than deciding which NOC group is a skilled trade', () => {
    const report = evaluate(caFederalSkilledTrades, fstCandidate, TODAY);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('ca-fst-skilled-trade-occupation');
  });

  it('sets a lower language bar than the skilled-worker class', () => {
    // CLB 5 fails the FSW class outright and clears the trades threshold.
    expect(evaluate(caFederalSkilledWorker, fstCandidate, TODAY).blockingFailures).toContain(
      'ca-fsw-language-threshold',
    );
    expect(evaluate(caFederalSkilledTrades, fstCandidate, TODAY).blockingFailures).not.toContain(
      'ca-fst-language-threshold',
    );
  });

  it('escalates the split reading/writing and speaking/listening thresholds', () => {
    // A single stored level cannot answer two different thresholds, and the
    // recorded CLB 4 sits between them.
    const clb4: ApplicantFacts = {
      ...fstCandidate,
      languageCertifications: [{ language: 'en', framework: 'clb', level: '4' }],
    };
    const report = evaluate(caFederalSkilledTrades, clb4, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-fst-language-threshold');
  });

  it('refuses a language result below every threshold in the class', () => {
    const clb3: ApplicantFacts = {
      ...fstCandidate,
      languageCertifications: [{ language: 'en', framework: 'clb', level: '3' }],
    };
    expect(evaluate(caFederalSkilledTrades, clb3, TODAY).blockingFailures).toContain(
      'ca-fst-language-threshold',
    );
  });

  it('accepts a Canadian certificate of qualification outright', () => {
    const certified: ApplicantFacts = {
      ...fstCandidate,
      professionalCredentials: [{ kind: 'certification', issuingCountry: CA }],
    };
    const criterion = evaluate(caFederalSkilledTrades, certified, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-fst-certificate-or-job-offer',
    );
    expect(criterion?.status).toBe('met');
  });

  it('escalates when a job offer is doing the work of a certificate', () => {
    const offerOnly: ApplicantFacts = {
      ...fstCandidate,
      professionalCredentials: [],
      jobOffer: { employerCountry: CA, fullTime: true, durationMonths: 24, writtenOffer: true },
    };
    const report = evaluate(caFederalSkilledTrades, offerOnly, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-fst-certificate-or-job-offer');
  });

  it('fails an offer shorter than a year without a certificate to fall back on', () => {
    const shortOffer: ApplicantFacts = {
      ...fstCandidate,
      professionalCredentials: [],
      jobOffer: { employerCountry: CA, fullTime: true, durationMonths: 6, writtenOffer: true },
    };
    expect(evaluate(caFederalSkilledTrades, shortOffer, TODAY).blockingFailures).toContain(
      'ca-fst-certificate-or-job-offer',
    );
  });

  it('applies the same Quebec exclusion as the skilled-worker class', () => {
    const quebecBound: ApplicantFacts = {
      ...fstCandidate,
      intent: { intendsToResideOutsideQuebec: false },
    };
    expect(evaluate(caFederalSkilledTrades, quebecBound, TODAY).blockingFailures).toContain(
      'ca-fst-outside-quebec',
    );
  });
});
