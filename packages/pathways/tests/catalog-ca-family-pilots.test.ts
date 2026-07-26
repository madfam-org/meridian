/**
 * Canada's family class, the start-up class, and the regional pilots.
 *
 * Three things are worth pinning here.
 *
 * **The family class is about two people and Meridian holds one.** Every
 * sponsor-side criterion escalates, and the relationship criteria escalate for
 * a second reason: IRPR s. 4 asks whether a relationship was entered into
 * primarily to acquire status, which is a credibility finding on a whole
 * evidentiary record. Software that answered it would be scoring somebody's
 * marriage.
 *
 * **Paused is not repealed, and closed is not erased.** Four of these nine
 * routes are not accepting applications. All four stay in the catalog with a
 * note, because people hold status under them, have applications in the queue,
 * and ask questions the day after intake stops.
 *
 * **The pilots are counted in hours and communities.** Meridian records TEER
 * categories and a country, not 1,560 hours in a designated community, so those
 * criteria escalate rather than approximate.
 */

import { dateRange, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  CA_FAMILY_PILOTS_PATHWAYS,
  caAgriFoodPilot,
  caAtlanticImmigration,
  caFamilyDependentChild,
  caFamilyParentGrandparent,
  caFamilySpousePartnerInland,
  caFamilySpousePartnerOutland,
  caRuralCommunityPilot,
  caRuralNorthernPilot,
  caStartUpVisa,
} from '../src/catalog/ca-family-pilots.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { statusOn } from '../src/schema.js';
import { CA, d, MX, TODAY } from './fixtures.js';

const sponsoredPartner: ApplicantFacts = {
  applicantId: 'fixture-ca-partner',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: CA,
  dateOfBirth: d('1995-12-01'),
  currentStatus: 'visitor',
  criminalRecord: { selfDeclaredClear: true },
};

describe('the module', () => {
  it('holds the nine routes, in declaration order', () => {
    expect(CA_FAMILY_PILOTS_PATHWAYS.map((p) => p.id)).toEqual([
      'ca-family-spouse-partner-outland',
      'ca-family-spouse-partner-inland',
      'ca-family-dependent-child',
      'ca-family-parent-grandparent',
      'ca-start-up-visa',
      'ca-atlantic-immigration',
      'ca-rural-community-pilot',
      'ca-rural-northern-pilot',
      'ca-agri-food-pilot',
    ]);
  });

  it('keeps every route that is not accepting applications, with a note', () => {
    const notOpen = CA_FAMILY_PILOTS_PATHWAYS.filter((p) => p.status !== 'open');
    expect(notOpen.map((p) => p.id)).toEqual([
      'ca-family-parent-grandparent',
      'ca-start-up-visa',
      'ca-rural-northern-pilot',
      'ca-agri-food-pilot',
    ]);
    for (const pathway of notOpen) {
      expect(pathway.closureNote?.en.length ?? 0, pathway.id).toBeGreaterThan(0);
      expect(pathway.closureNote?.es.length ?? 0, pathway.id).toBeGreaterThan(0);
    }
  });

  it('treats a grant of permanent residence as permanent, with no grant length', () => {
    for (const pathway of CA_FAMILY_PILOTS_PATHWAYS) {
      if (pathway.kind !== 'permanent_residence') continue;
      expect(pathway.durations.initialGrantMonths, pathway.id).toBeUndefined();
    }
  });
});

describe('the spousal and partner routes', () => {
  it('escalates the sponsor and the genuineness of the relationship on both', () => {
    for (const pathway of [caFamilySpousePartnerOutland, caFamilySpousePartnerInland]) {
      const report = evaluate(pathway, sponsoredPartner, TODAY);
      expect(report.verdict, pathway.id).toBe('requires_human_review');
      const escalated = report.humanReviewCriterionIds;
      expect(escalated.some((id) => id.includes('sponsor-eligibility')), pathway.id).toBe(true);
      expect(escalated.some((id) => id.includes('relationship')), pathway.id).toBe(true);
    }
  });

  it('applies the eighteen-year floor at the boundary, on both routes', () => {
    const seventeen: ApplicantFacts = { ...sponsoredPartner, dateOfBirth: d('2008-07-26') };
    const exactlyEighteen: ApplicantFacts = { ...sponsoredPartner, dateOfBirth: d('2008-07-25') };
    expect(evaluate(caFamilySpousePartnerOutland, seventeen, TODAY).blockingFailures).toContain(
      'ca-fc-outland-minimum-age',
    );
    expect(
      evaluate(caFamilySpousePartnerOutland, exactlyEighteen, TODAY).blockingFailures,
    ).not.toContain('ca-fc-outland-minimum-age');
    expect(evaluate(caFamilySpousePartnerInland, seventeen, TODAY).blockingFailures).toContain(
      'ca-sclpc-minimum-age',
    );
  });

  it('asks the in-Canada class for temporary resident status the overseas one does not', () => {
    const outlandIds = caFamilySpousePartnerOutland.criteria.map((c) => c.id);
    expect(outlandIds).not.toContain('ca-sclpc-temporary-resident-status');

    const criterion = evaluate(caFamilySpousePartnerInland, sponsoredPartner, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-sclpc-temporary-resident-status',
    );
    expect(criterion?.status).toBe('met');
  });

  it('escalates rather than refuses when the applicant is in Canada without status', () => {
    // Restoration and temporary public policies exist. Answering "no" would
    // close a door that is not necessarily shut.
    const withoutStatus: ApplicantFacts = { ...sponsoredPartner, currentStatus: 'irregular' };
    const report = evaluate(caFamilySpousePartnerInland, withoutStatus, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-sclpc-temporary-resident-status');
    expect(report.blockingFailures).not.toContain('ca-sclpc-temporary-resident-status');
  });

  it('escalates a declared record instead of calling it inadmissibility', () => {
    const declared: ApplicantFacts = {
      ...sponsoredPartner,
      criminalRecord: { selfDeclaredClear: false },
    };
    const report = evaluate(caFamilySpousePartnerOutland, declared, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-fc-outland-admissibility');
  });
});

describe('ca-family-dependent-child', () => {
  const child: ApplicantFacts = {
    ...sponsoredPartner,
    applicantId: 'fixture-ca-child',
    dateOfBirth: d('2010-01-01'),
  };

  it('decides the under-22 limb it can compute', () => {
    const criterion = evaluate(caFamilyDependentChild, child, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-dc-dependency-by-age',
    );
    expect(criterion?.status).toBe('met');
  });

  it('escalates at 22, where the definition turns on financial dependence and a condition', () => {
    const olderChild: ApplicantFacts = { ...child, dateOfBirth: d('2004-07-25') };
    const report = evaluate(caFamilyDependentChild, olderChild, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-dc-dependency-by-age');
    expect(report.blockingFailures).not.toContain('ca-dc-dependency-by-age');
  });

  it('crosses the twenty-second birthday exactly once', () => {
    const status = (dateOfBirth: string) =>
      evaluate(caFamilyDependentChild, { ...child, dateOfBirth: d(dateOfBirth) }, TODAY).criteria.find(
        (c) => c.criterionId === 'ca-dc-dependency-by-age',
      )?.status;
    expect(status('2004-07-26')).toBe('met');
    expect(status('2004-07-25')).toBe('requires_human_review');
  });

  it('escalates the second limb, because being somebody’s partner also ends dependency', () => {
    const report = evaluate(caFamilyDependentChild, child, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-dc-not-a-partner');
  });
});

describe('ca-family-parent-grandparent (intake paused)', () => {
  it('answers ineligible while intake is paused', () => {
    const report = evaluate(caFamilyParentGrandparent, sponsoredPartner, TODAY);
    expect(report.pathwayStatus).toBe('suspended');
    expect(report.verdict).toBe('ineligible');
  });

  it('keeps the explanation on the record even though the class still exists', () => {
    // `evaluate` emits a `pathway_closed` note for `closed` only, so a reader
    // of a *suspended* route gets the verdict without that note. The record
    // still carries the text, and a consumer rendering the pathway shows it.
    expect(caFamilyParentGrandparent.closureNote?.en).toContain('paused');
    const report = evaluate(caFamilyParentGrandparent, sponsoredPartner, TODAY);
    expect(report.notes.some((n) => n.code === 'pathway_closed')).toBe(false);
    expect(report.notes.some((n) => n.code === 'unreviewed_rule')).toBe(true);
  });

  it('escalates the invitation gate rather than treating it as an eligibility rule', () => {
    const criterion = evaluate(caFamilyParentGrandparent, sponsoredPartner, TODAY).criteria.find(
      (c) => c.criterionId === 'ca-pgp-invitation-to-apply',
    );
    expect(criterion?.status).toBe('requires_human_review');
  });
});

describe('ca-start-up-visa (paused)', () => {
  const founder: ApplicantFacts = {
    ...sponsoredPartner,
    applicantId: 'fixture-ca-suv',
    languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    intent: { intendsToResideOutsideQuebec: true },
  };

  it('answers ineligible on the pause, whatever the applicant looks like', () => {
    const report = evaluate(caStartUpVisa, founder, TODAY);
    expect(report.pathwayStatus).toBe('suspended');
    expect(report.verdict).toBe('ineligible');
  });

  it('reports the same status for a past date, because no reopening date is recorded', () => {
    // Unlike `es-golden-visa`, this record carries no `openedOn`/`closedOn`, so
    // it describes today rather than answering historically.
    expect(statusOn(caStartUpVisa, isoDate('2026-01-01'))).toBe('suspended');
  });

  it('decides the language threshold it can, and escalates the money it cannot', () => {
    const criteria = evaluate(caStartUpVisa, founder, TODAY).criteria;
    expect(criteria.find((c) => c.criterionId === 'ca-suv-language')?.status).toBe('met');
    for (const id of ['ca-suv-commitment-certificate', 'ca-suv-settlement-funds']) {
      expect(criteria.find((c) => c.criterionId === id)?.status).toBe('requires_human_review');
    }
  });

  it('marks a filing after the pause date as unmet', () => {
    const late: ApplicantFacts = { ...founder, applicationLodgedOn: isoDate('2026-07-01') };
    expect(evaluate(caStartUpVisa, late, TODAY).blockingFailures).toContain('ca-suv-filing-deadline');
    const onTime: ApplicantFacts = { ...founder, applicationLodgedOn: isoDate('2026-06-30') };
    expect(evaluate(caStartUpVisa, onTime, TODAY).blockingFailures).not.toContain(
      'ca-suv-filing-deadline',
    );
  });
});

describe('ca-atlantic-immigration', () => {
  const atlanticCandidate: ApplicantFacts = {
    applicantId: 'fixture-ca-aip',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: CA,
    dateOfBirth: d('1992-08-08'),
    educationLevel: 'post_secondary_diploma',
    languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    jobOffer: {
      employerCountry: CA,
      writtenOffer: true,
      fullTime: true,
      selfEmployment: false,
      nocTeer: 2,
      durationMonths: 24,
    },
  };

  it('escalates the provincial endorsement, which is the actual gate', () => {
    const report = evaluate(caAtlanticImmigration, atlanticCandidate, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-aip-endorsement');
  });

  it('applies a different language threshold to TEER 4 than to TEER 0-3', () => {
    const teer4: ApplicantFacts = {
      ...atlanticCandidate,
      jobOffer: { ...atlanticCandidate.jobOffer, nocTeer: 4 },
      languageCertifications: [{ language: 'en', framework: 'clb', level: '4' }],
    };
    expect(
      evaluate(caAtlanticImmigration, teer4, TODAY).criteria.find(
        (c) => c.criterionId === 'ca-aip-language',
      )?.status,
    ).toBe('met');

    const teer2WithClb4: ApplicantFacts = {
      ...atlanticCandidate,
      languageCertifications: [{ language: 'en', framework: 'clb', level: '4' }],
    };
    expect(evaluate(caAtlanticImmigration, teer2WithClb4, TODAY).blockingFailures).toContain(
      'ca-aip-language',
    );
  });

  it('applies a higher education floor to TEER 0-1 than to TEER 2-4', () => {
    const teer1WithSecondary: ApplicantFacts = {
      ...atlanticCandidate,
      educationLevel: 'secondary',
      jobOffer: { ...atlanticCandidate.jobOffer, nocTeer: 1 },
      languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    };
    expect(evaluate(caAtlanticImmigration, teer1WithSecondary, TODAY).blockingFailures).toContain(
      'ca-aip-education',
    );

    const teer2WithSecondary: ApplicantFacts = { ...teer1WithSecondary, jobOffer: { ...atlanticCandidate.jobOffer, nocTeer: 2 } };
    expect(
      evaluate(caAtlanticImmigration, teer2WithSecondary, TODAY).criteria.find(
        (c) => c.criterionId === 'ca-aip-education',
      )?.status,
    ).toBe('met');
  });

  it('escalates a short offer in a TEER 0-3 occupation instead of refusing it', () => {
    const shortOffer: ApplicantFacts = {
      ...atlanticCandidate,
      jobOffer: { ...atlanticCandidate.jobOffer, durationMonths: 6 },
    };
    const report = evaluate(caAtlanticImmigration, shortOffer, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-aip-job-offer');
  });
});

describe('ca-rural-community-pilot', () => {
  const ruralCandidate: ApplicantFacts = {
    applicantId: 'fixture-ca-rcip',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: CA,
    dateOfBirth: d('1990-01-01'),
    educationLevel: 'secondary',
    languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    jobOffer: { employerCountry: CA, writtenOffer: true, selfEmployment: false, nocTeer: 3 },
    workExperience: [
      {
        country: MX,
        period: dateRange(d('2022-01-01'), d('2025-12-31')),
        nocTeer: 3,
        fullTime: true,
        authorized: true,
      },
    ],
  };

  it('escalates the community, which is the whole point of the route', () => {
    const report = evaluate(caRuralCommunityPilot, ruralCandidate, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-rcip-community-job-offer');
  });

  it('bands the language requirement by the TEER of the offer', () => {
    const status = (nocTeer: number, level: string) =>
      evaluate(
        caRuralCommunityPilot,
        {
          ...ruralCandidate,
          jobOffer: { ...ruralCandidate.jobOffer, nocTeer },
          languageCertifications: [{ language: 'en', framework: 'clb', level }],
        },
        TODAY,
      ).criteria.find((c) => c.criterionId === 'ca-rcip-language')?.status;

    expect(status(1, '6')).toBe('met');
    expect(status(1, '5')).toBe('unmet');
    expect(status(3, '5')).toBe('met');
    expect(status(5, '4')).toBe('met');
    expect(status(5, '3')).toBe('unmet');
  });

  it('escalates unauthorised or unmeasured experience rather than counting hours it does not have', () => {
    const report = evaluate(caRuralCommunityPilot, ruralCandidate, TODAY);
    expect(report.humanReviewCriterionIds).toContain('ca-rcip-work-experience');
  });
});

describe('the two closed pilots', () => {
  const worker: ApplicantFacts = {
    applicantId: 'fixture-ca-closed-pilot',
    nationalities: [MX],
    claimedNationality: MX,
    targetJurisdiction: CA,
    dateOfBirth: d('1988-03-03'),
    educationLevel: 'secondary',
    languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    jobOffer: { employerCountry: CA, writtenOffer: true, fullTime: true, selfEmployment: false, nocTeer: 3 },
    workExperience: [
      {
        country: CA,
        period: dateRange(d('2022-01-01'), d('2024-06-30')),
        nocTeer: 3,
        fullTime: true,
        authorized: true,
      },
    ],
  };

  it('answers ineligible today and explains why, rather than disappearing', () => {
    for (const pathway of [caRuralNorthernPilot, caAgriFoodPilot]) {
      const report = evaluate(pathway, worker, TODAY);
      expect(report.verdict, pathway.id).toBe('ineligible');
      expect(report.pathwayStatus, pathway.id).toBe('closed');
      expect(report.notes.some((n) => n.code === 'pathway_closed'), pathway.id).toBe(true);
    }
  });

  it('shuts on the day after the last accepted application, and not before', () => {
    expect(statusOn(caRuralNorthernPilot, isoDate('2024-08-31'))).toBe('open');
    expect(statusOn(caRuralNorthernPilot, isoDate('2024-09-01'))).toBe('closed');
    expect(statusOn(caAgriFoodPilot, isoDate('2025-05-13'))).toBe('open');
    expect(statusOn(caAgriFoodPilot, isoDate('2025-05-14'))).toBe('closed');
  });

  it('still answers the question a person with a file in the queue is asking', () => {
    const insideWindow = isoDate('2024-08-01');
    const filedInTime: ApplicantFacts = { ...worker, applicationLodgedOn: isoDate('2024-07-01') };
    const report = evaluate(caRuralNorthernPilot, filedInTime, insideWindow);
    expect(report.pathwayStatus).toBe('open');
    expect(report.criteria.find((c) => c.criterionId === 'ca-rnip-application-before-closure')?.status).toBe(
      'met',
    );
  });

  it('escalates the community recommendation the closed pilot turned on', () => {
    const insideWindow = isoDate('2024-08-01');
    const report = evaluate(caRuralNorthernPilot, worker, insideWindow);
    expect(report.humanReviewCriterionIds).toContain('ca-rnip-community-recommendation');
  });

  it('states no processing figure for a closed intake', () => {
    for (const pathway of [caRuralNorthernPilot, caAgriFoodPilot]) {
      expect(pathway.durations.publishedProcessingDays, pathway.id).toBeUndefined();
    }
  });
});
