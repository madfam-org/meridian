import { dateRange } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import { caCusmaProfessional, caExpressEntryCec } from '../src/catalog/ca.js';
import {
  CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS,
  CUSMA_PROFESSIONS,
  cusmaProfession,
} from '../src/catalog/cusma-professions.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { CA, cecCandidate, cusmaEngineer, cusmaManagementConsultant, d, MX, TODAY, US } from './fixtures.js';

const cusma = (facts: ApplicantFacts) => evaluate(caCusmaProfessional, facts, TODAY);
const cec = (facts: ApplicantFacts) => evaluate(caExpressEntryCec, facts, TODAY);

describe('CUSMA profession table', () => {
  it('has unique ids and a credential level for every entry', () => {
    const ids = CUSMA_PROFESSIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of CUSMA_PROFESSIONS) {
      expect(p.minimumEducationLevel.length).toBeGreaterThan(0);
      expect(p.title.en.length).toBeGreaterThan(0);
      expect(p.title.es.length).toBeGreaterThan(0);
    }
  });

  it('gives every heightened-scrutiny entry an explanation', () => {
    expect(CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS).toContain('management_consultant');
    for (const id of CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS) {
      expect(cusmaProfession(id)?.note?.en.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('returns null rather than throwing for an unknown id', () => {
    expect(cusmaProfession('astronaut')).toBeNull();
  });

  it('holds the professions with a higher bar than a plain baccalaureate', () => {
    expect(cusmaProfession('lawyer')?.minimumEducationLevel).toBe('professional_degree');
    expect(cusmaProfession('physician')?.minimumEducationLevel).toBe('professional_degree');
    expect(cusmaProfession('librarian')?.minimumEducationLevel).toBe('master');
  });
});

describe('ca-cusma-professional', () => {
  it('admits a Mexican engineer with a written Canadian offer and a degree', () => {
    const report = cusma(cusmaEngineer);
    expect(report.verdict).toBe('eligible');
    expect(report.blockingFailures).toEqual([]);
  });

  it('routes a management consultant to human review rather than issuing a verdict', () => {
    const report = cusma(cusmaManagementConsultant);
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('ca-cusma-listed-profession');
    const escalated = report.criteria.find((c) => c.criterionId === 'ca-cusma-listed-profession');
    expect(escalated?.status).toBe('requires_human_review');
    expect(escalated?.humanReviewReason).toContain('Appendix 2');
  });

  it('routes an occupation missing from the catalog subset to review, never to "unmet"', () => {
    // The table is a subset of Appendix 2. Reporting "not a listed profession"
    // for something we simply have not encoded would be a false negative on
    // someone's job.
    const report = cusma({
      ...cusmaEngineer,
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'quantity_surveyor' },
    });
    expect(report.verdict).toBe('requires_human_review');
    expect(report.blockingFailures).not.toContain('ca-cusma-listed-profession');
  });

  it('applies each profession’s own credential minimum', () => {
    // A baccalaureate does not satisfy Lawyer. With no credential list on file
    // the bar-membership alternative is unrecorded, so the honest answer is
    // "undecided", not "no".
    const lawyerWithBachelor = cusma({
      ...cusmaEngineer,
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'lawyer' },
    });
    expect(lawyerWithBachelor.verdict).toBe('indeterminate');
    expect(lawyerWithBachelor.unknowns).toContain('ca-cusma-credentials');

    // Once the applicant states they hold no credentials at all, the same
    // profile is a definite failure.
    const lawyerWithNothingElse = cusma({
      ...cusmaEngineer,
      professionalCredentials: [],
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'lawyer' },
    });
    expect(lawyerWithNothingElse.blockingFailures).toContain('ca-cusma-credentials');

    const lawyerWithLawDegree = cusma({
      ...cusmaEngineer,
      educationLevel: 'professional_degree',
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'lawyer' },
    });
    expect(lawyerWithLawDegree.verdict).toBe('eligible');
  });

  it('accepts a Canadian provincial licence in place of the degree where the entry allows it', () => {
    const nurseByLicence = cusma({
      ...cusmaEngineer,
      educationLevel: 'secondary',
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'registered_nurse' },
      professionalCredentials: [{ kind: 'licence', issuingCountry: CA, issuer: 'provincial regulator' }],
    });
    expect(nurseByLicence.verdict).toBe('eligible');
  });

  it('accepts a diploma plus three years where the entry allows it, and not otherwise', () => {
    const base: ApplicantFacts = {
      ...cusmaEngineer,
      educationLevel: 'post_secondary_diploma',
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'graphic_designer' },
    };
    expect(cusma({ ...base, professionalExperienceYears: 3 }).verdict).toBe('eligible');
    expect(cusma({ ...base, professionalExperienceYears: 2 }).blockingFailures).toContain(
      'ca-cusma-credentials',
    );
    // Economist has no diploma alternative in the Appendix.
    const economist = cusma({
      ...base,
      professionalExperienceYears: 10,
      jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'economist' },
    });
    expect(economist.blockingFailures).toContain('ca-cusma-credentials');
  });

  it('requires citizenship of a party, not permanent residence in one', () => {
    // Someone who lives in the United States but is a citizen elsewhere cannot
    // claim US citizenship into this route.
    const report = cusma({ ...cusmaEngineer, nationalities: [MX], claimedNationality: US });
    expect(report.blockingFailures).toContain('ca-cusma-citizenship');
  });

  it('excludes Canadian citizens, who need no permit', () => {
    const canadian = cusma({ ...cusmaEngineer, nationalities: [CA], claimedNationality: CA });
    expect(canadian.blockingFailures).toContain('ca-cusma-citizenship');
  });

  it('excludes self-employment dressed up as a job offer', () => {
    const report = cusma({
      ...cusmaEngineer,
      jobOffer: { ...cusmaEngineer.jobOffer, selfEmployment: true },
    });
    expect(report.blockingFailures).toContain('ca-cusma-pre-arranged-employment');
  });

  it('is indeterminate — not negative — when intent has not been recorded', () => {
    const report = cusma({ ...cusmaEngineer, intent: undefined });
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('ca-cusma-temporary-intent');
  });

  it('bridges to the Canadian Experience Class', () => {
    expect(caCusmaProfessional.leadsTo).toEqual(['ca-express-entry-cec']);
  });
});

describe('ca-express-entry-cec', () => {
  it('admits a candidate with over a year of full-time TEER 1 work in the window', () => {
    const report = cec(cecCandidate);
    expect(report.verdict).toBe('eligible');
  });

  it('counts the three-year window as closed at both ends', () => {
    // A year of work that ended the day the window opens still counts; one day
    // earlier and it does not.
    const insideWindow = cec({
      ...cecCandidate,
      workExperience: [
        {
          country: CA,
          period: dateRange(d('2022-07-01'), d('2023-07-26')),
          nocTeer: 1,
          fullTime: true,
          authorized: true,
        },
      ],
    });
    expect(insideWindow.blockingFailures).toContain('ca-cec-one-year-canadian-experience');
  });

  it('escalates a part-time history instead of converting the hours itself', () => {
    const report = cec({
      ...cecCandidate,
      workExperience: [{ ...cecCandidate.workExperience?.[0], fullTime: false }],
    });
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('ca-cec-one-year-canadian-experience');
  });

  it('applies the higher language benchmark to TEER 0 and 1 work', () => {
    const teer1WithClb5 = cec({
      ...cecCandidate,
      languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    });
    expect(teer1WithClb5.blockingFailures).toContain('ca-cec-language');

    const teer3WithClb5 = cec({
      ...cecCandidate,
      workExperience: [{ ...cecCandidate.workExperience?.[0], nocTeer: 3 }],
      languageCertifications: [{ language: 'en', framework: 'clb', level: '5' }],
    });
    expect(teer3WithClb5.verdict).toBe('eligible');
  });

  it('does not compare a CEFR level against a Canadian benchmark', () => {
    const report = cec({
      ...cecCandidate,
      languageCertifications: [{ language: 'en', framework: 'cefr', level: 'C2' }],
    });
    expect(report.blockingFailures).toContain('ca-cec-language');
  });

  it('rejects unauthorised Canadian work outright', () => {
    const report = cec({
      ...cecCandidate,
      workExperience: [{ ...cecCandidate.workExperience?.[0], authorized: false }],
    });
    expect(report.blockingFailures).toContain('ca-cec-authorized-work');
  });

  it('is indeterminate when there is no work history at all', () => {
    const report = cec({ ...cecCandidate, workExperience: undefined });
    expect(report.verdict).toBe('indeterminate');
    expect(report.blockingFailures).toEqual([]);
  });

  it('refuses to predict a selection cut-off, and says so in the durations note', () => {
    expect(caExpressEntryCec.durations.note?.en).toContain('does not predict');
  });
});
