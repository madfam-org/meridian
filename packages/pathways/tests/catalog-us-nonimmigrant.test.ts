/**
 * The United States nonimmigrant block.
 *
 * This is the half of the corridor where the engine can actually decide
 * something, and the reason is worth stating: TN and B-1/B-2 turn on facts about
 * the applicant — citizenship, the occupation, the offer, the intent — while
 * H-1B, L-1 and O-1 turn on an adjudicator's *characterisation* of a job.
 * Specialty occupation, managerial capacity, specialized knowledge and
 * extraordinary ability are all judgements a person makes, so those records are
 * built to escalate exactly when they would otherwise green-tick, which leaves
 * them able to say "no" and unable to say "yes". These tests pin that
 * asymmetry, because a later change that made H-1B return `eligible` would look
 * like an improvement and would be the product asserting something it cannot
 * know.
 *
 * TN is the mirror of `ca-cusma-professional` and reuses `CUSMA_PROFESSIONS`
 * rather than re-transcribing Appendix 2 — 8 CFR 214.6(c) reproduces the
 * Appendix verbatim in US regulation, so a second copy would be a second thing
 * to keep in step. The test that the two agree is therefore load-bearing rather
 * than decorative.
 */

import { describe, expect, it } from 'vitest';
import { CUSMA_PROFESSIONS } from '../src/catalog/cusma-professions.js';
import {
  US_NONIMMIGRANT_PATHWAYS,
  usB1B2Visitor,
  usE1TreatyTrader,
  usE2TreatyInvestor,
  usF1AcademicStudent,
  usH1bSpecialtyOccupation,
  usL1aManagerOrExecutive,
  usL1bSpecializedKnowledge,
  usO1aExtraordinaryAbility,
  usTnUsmcaProfessional,
} from '../src/catalog/us-nonimmigrant.js';
import { evaluate } from '../src/evaluate.js';
import type { ApplicantFacts } from '../src/facts.js';
import { BR, CA, MX, TODAY, US, usTnEngineer } from './fixtures.js';

const tn = (facts: ApplicantFacts) => evaluate(usTnUsmcaProfessional, facts, TODAY);
const visitor = (facts: ApplicantFacts) => evaluate(usB1B2Visitor, facts, TODAY);

/** The same person, applying as a Canadian rather than a Mexican. */
const asCanadian = (facts: ApplicantFacts): ApplicantFacts => ({
  ...facts,
  nationalities: [CA],
  claimedNationality: CA,
});

const mexicanVisitor: ApplicantFacts = {
  applicantId: 'fixture-us-visitor',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: US,
  intent: { temporary: true },
};

describe('us-tn-usmca-professional', () => {
  it('admits a Mexican engineer with a written United States offer and a degree', () => {
    const report = tn(usTnEngineer);
    expect(report.verdict).toBe('eligible');
    expect(report.blockingFailures).toEqual([]);
    expect(report.humanReviewCriterionIds).toEqual([]);
  });

  it('reuses the shared Appendix 2 table rather than a second copy of it', () => {
    // If these ever diverge, one side of the treaty starts admitting a
    // profession the other refuses, on identical text.
    const evaluator = usTnUsmcaProfessional.criteria.find(
      (c) => c.id === 'us-tn-listed-profession',
    )?.evaluator;
    expect(evaluator?.op).toBe('one_of');
    const values = evaluator !== undefined && evaluator.op === 'one_of' ? evaluator.values : [];
    expect([...values].sort()).toEqual(CUSMA_PROFESSIONS.map((p) => p.id).sort());
  });

  it('routes an occupation the table does not hold to a person, never to "unmet"', () => {
    // This test used to use 'sylviculturist' as its unlisted example, because
    // the shared table held 61 of the 63 professions in 8 CFR 214.6(c) and that
    // was one of the two absentees. Both were verified against the regulation
    // and added on 2026-07-26, so the table now matches Appendix 2 exactly and
    // the example had to change.
    //
    // The behaviour under test did not: a job title outside Appendix 2 is a
    // question about what the work actually is, since titles and Appendix
    // entries do not map one to one. Answering "not a listed profession" would
    // be a false negative on somebody's livelihood, so it escalates instead.
    const report = tn({
      ...usTnEngineer,
      jobOffer: { ...usTnEngineer.jobOffer, occupationCode: 'plumber' },
    });
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('us-tn-listed-profession');
    expect(report.blockingFailures).not.toContain('us-tn-listed-profession');
  });

  it('holds every one of the 63 professions the regulation lists', () => {
    // The count is pinned because the table is shared with the Canadian CUSMA
    // route: an entry dropped here silently narrows eligibility on two corridors
    // at once, and an entry invented here widens it on both.
    expect(CUSMA_PROFESSIONS).toHaveLength(63);
    const ids = CUSMA_PROFESSIONS.map((p) => p.id);
    expect(ids).toContain('range_manager');
    expect(ids).toContain('sylviculturist');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('escalates a profession officers examine closely instead of green-ticking it', () => {
    const report = tn({
      ...usTnEngineer,
      jobOffer: { ...usTnEngineer.jobOffer, occupationCode: 'management_consultant' },
    });
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('us-tn-listed-profession');
  });

  it('requires citizenship of a Party, held and claimed', () => {
    // Claiming a nationality the applicant does not hold must fail, and a
    // United States citizen needs no classification at all.
    expect(tn({ ...usTnEngineer, claimedNationality: US }).blockingFailures).toContain(
      'us-tn-citizenship',
    );
    expect(
      tn({ ...usTnEngineer, nationalities: [BR], claimedNationality: BR }).blockingFailures,
    ).toContain('us-tn-citizenship');
  });

  it('refuses self-employment dressed up as an offer, and an offer from the wrong country', () => {
    expect(
      tn({ ...usTnEngineer, jobOffer: { ...usTnEngineer.jobOffer, selfEmployment: true } })
        .blockingFailures,
    ).toContain('us-tn-prearranged-employment');
    expect(
      tn({ ...usTnEngineer, jobOffer: { ...usTnEngineer.jobOffer, employerCountry: MX } })
        .blockingFailures,
    ).toContain('us-tn-prearranged-employment');
  });

  it('is indeterminate — not negative — when temporary intent has not been recorded', () => {
    // The required behaviour for an unrecorded fact. TN is not a dual-intent
    // classification, so the answer matters; that is precisely why guessing it
    // is not allowed.
    const report = tn({ ...usTnEngineer, intent: undefined });
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('us-tn-temporary-entry');
    expect(report.blockingFailures).toEqual([]);
  });

  it('is indeterminate when the credential is unrecorded, and negative when it is absent', () => {
    // The difference between "we do not know" and "there is none". Engineer
    // accepts a degree *or* a state, provincial or federal licence, so somebody
    // with a secondary education and no credential list on file has an
    // unexamined alternative and the honest answer is "undecided".
    const unrecorded = tn({ ...usTnEngineer, educationLevel: undefined });
    expect(unrecorded.verdict).toBe('indeterminate');
    expect(unrecorded.unknowns).toContain('us-tn-credentials');

    const noDegreeAlternativeUnknown = tn({ ...usTnEngineer, educationLevel: 'secondary' });
    expect(noDegreeAlternativeUnknown.verdict).toBe('indeterminate');
    expect(noDegreeAlternativeUnknown.unknowns).toContain('us-tn-credentials');

    // Once the applicant states they hold no credentials at all, the same
    // profile is a definite failure.
    const asserted = tn({
      ...usTnEngineer,
      educationLevel: 'secondary',
      professionalCredentials: [],
    });
    expect(asserted.verdict).toBe('ineligible');
    expect(asserted.blockingFailures).toContain('us-tn-credentials');
  });

  it('escalates a recorded refusal or overstay rather than deciding intent itself', () => {
    // A routing decision, not a legal rule: § 214(b) puts the burden of
    // overcoming the immigrant presumption on the applicant, and that history is
    // what an officer weighs.
    const refused = tn({ ...usTnEngineer, travelHistory: { priorRefusals: 1 } });
    expect(refused.verdict).toBe('requires_human_review');
    expect(refused.humanReviewCriterionIds).toContain('us-tn-temporary-entry');

    // And the absence of a recorded refusal must not escalate, or every
    // applicant would be sent to a person for having no history.
    expect(tn(usTnEngineer).humanReviewCriterionIds).toEqual([]);
  });

  it('treats the Mexican consular visa as procedure, not merit', () => {
    // Being Mexican is neither a qualification nor a demerit. The criterion is
    // `informational` so it cannot move the verdict, and the two applicants
    // below differ only in nationality.
    const mexican = tn(usTnEngineer);
    const canadian = tn(asCanadian(usTnEngineer));
    expect(mexican.verdict).toBe('eligible');
    expect(canadian.verdict).toBe('eligible');

    const forMexican = mexican.criteria.find((c) => c.criterionId === 'us-tn-mexican-consular-visa');
    const forCanadian = canadian.criteria.find(
      (c) => c.criterionId === 'us-tn-mexican-consular-visa',
    );
    expect(forMexican?.status).toBe('met');
    expect(forCanadian?.status).toBe('unmet');
    expect(forMexican?.weight).toBe('informational');
  });

  it('separates visa validity from the period of stay', () => {
    // The two dates a TN holder most often confuses, and confusing them is how
    // somebody overstays while holding a valid visa.
    expect(usTnUsmcaProfessional.durations.note?.en).toContain('visa validity');
    expect(usTnUsmcaProfessional.durations.note?.en).toContain('period of stay');
  });
});

describe('the classifications that can refuse but must not approve', () => {
  const escalatesOnSuccess = [
    { pathway: usH1bSpecialtyOccupation, criterion: 'us-h1b-specialty-occupation' },
    { pathway: usL1aManagerOrExecutive, criterion: 'us-l1a-managerial-or-executive-capacity' },
    { pathway: usL1bSpecializedKnowledge, criterion: 'us-l1b-specialized-knowledge-capacity' },
  ];

  it('escalates the characterisation criterion exactly when it would otherwise pass', () => {
    // `humanReviewWhen` deep-equal to `evaluator` is the idiom: a definite
    // failure still reads as a failure, and a pass goes to a person. Anything
    // else either hides refusals or invents approvals.
    for (const { pathway, criterion } of escalatesOnSuccess) {
      const target = pathway.criteria.find((c) => c.id === criterion);
      expect(target, `${pathway.id} lost ${criterion}`).toBeDefined();
      expect(target?.humanReviewWhen, `${criterion} does not escalate at all`).toBeDefined();
      expect(target?.humanReviewWhen).toEqual(target?.evaluator);
      expect(target?.weight).toBe('blocking');
    }
  });

  it('never returns eligible for a qualifying applicant, and still returns ineligible', () => {
    const qualifying: ApplicantFacts = {
      ...usTnEngineer,
      applicantId: 'fixture-us-h1b',
      educationLevel: 'master',
    };
    expect(evaluate(usH1bSpecialtyOccupation, qualifying, TODAY).verdict).toBe(
      'requires_human_review',
    );

    // Recorded as holding no degree, no United States licence and no
    // equivalence-by-experience — three positive absences rather than three
    // silences — and the same record refuses outright.
    const noSpecialtyBasis = evaluate(
      usH1bSpecialtyOccupation,
      {
        ...qualifying,
        educationLevel: 'secondary',
        professionalCredentials: [],
        professionalExperienceYears: 4,
      },
      TODAY,
    );
    expect(noSpecialtyBasis.verdict).toBe('ineligible');
    expect(noSpecialtyBasis.blockingFailures).toContain('us-h1b-specialty-occupation');
  });

  it('still lists a bright-line failure when another criterion has escalated', () => {
    // Escalation means "do not trust this verdict", not "hide the facts". An
    // offer from the wrong country is decisive and the reviewer must see it even
    // though the specialty-occupation criterion sent the report to a person.
    const report = evaluate(
      usH1bSpecialtyOccupation,
      {
        ...usTnEngineer,
        applicantId: 'fixture-us-h1b-wrong-employer',
        educationLevel: 'master',
        jobOffer: { ...usTnEngineer.jobOffer, employerCountry: MX },
      },
      TODAY,
    );
    expect(report.verdict).toBe('requires_human_review');
    expect(report.blockingFailures).toContain('us-h1b-employer-petition');
  });

  it('escalates O-1A on the extraordinary-ability standard, unconditionally', () => {
    const target = usO1aExtraordinaryAbility.criteria.find(
      (c) => c.id === 'us-o1a-extraordinary-ability-standard',
    );
    expect(target?.requiresHumanReview).toBe(true);
    expect(evaluate(usO1aExtraordinaryAbility, usTnEngineer, TODAY).verdict).toBe(
      'requires_human_review',
    );
  });

  it('leaves the L-1 qualifying year undecided rather than guessing from a bare period', () => {
    // `WorkExperience` carries a country and a period but no employer and no
    // corporate relationship, so "one continuous year with this employer or its
    // affiliate" is not measurable. With no history at all the criterion is
    // `unknown`; with a foreign period recorded it escalates. Neither is a pass.
    const noHistory = evaluate(
      usL1aManagerOrExecutive,
      { ...usTnEngineer, applicantId: 'fixture-us-l1a' },
      TODAY,
    );
    expect(noHistory.criteria.find((c) => c.criterionId === 'us-l1a-qualifying-employment-abroad')
      ?.status).toBe('unknown');
    expect(noHistory.verdict).toBe('requires_human_review');
  });
});

describe('E-1 and E-2: Mexico is a treaty country for both', () => {
  it('does not escalate on nationality for a Mexican applicant', () => {
    // Confirmed against the 9 FAM treaty-country table: Mexico E-1 01/01/1994
    // and Mexico E-2 01/01/1994. A criterion that escalated here would be
    // telling a Mexican applicant their nationality is in doubt when it is not.
    for (const pathway of [usE1TreatyTrader, usE2TreatyInvestor]) {
      const report = evaluate(
        pathway,
        { ...mexicanVisitor, applicantId: 'fixture-us-treaty-mx' },
        TODAY,
      );
      const nationality = report.criteria.find((c) => c.criterionId.endsWith('-nationality'));
      expect(nationality?.status, `${pathway.id}`).toBe('met');
    }
  });

  it('escalates on nationality for an applicant from a state whose treaty was not checked', () => {
    for (const pathway of [usE1TreatyTrader, usE2TreatyInvestor]) {
      const report = evaluate(
        pathway,
        {
          ...mexicanVisitor,
          applicantId: 'fixture-us-treaty-br',
          nationalities: [BR],
          claimedNationality: BR,
        },
        TODAY,
      );
      const nationality = report.criteria.find((c) => c.criterionId.endsWith('-nationality'));
      expect(nationality?.status, `${pathway.id}`).toBe('requires_human_review');
    }
  });

  it('encodes no E-2 dollar threshold, because none exists', () => {
    // Neither the statute nor the regulation contains a figure. A number here
    // would be invented, and the guidance says so in terms.
    const investment = usE2TreatyInvestor.criteria.find(
      (c) => c.id === 'us-e2-substantial-investment',
    );
    expect(investment?.evaluator).toEqual({
      op: 'is_present',
      path: 'qualifyingInvestment.minorUnits',
    });
    expect(investment?.requiresHumanReview).toBe(true);
    expect(investment?.guidance?.en).toContain('invented');
  });
});

describe('us-b1-b2-visitor', () => {
  it('admits an ordinary tourist with nothing else recorded', () => {
    const report = visitor(mexicanVisitor);
    expect(report.verdict).toBe('eligible');
  });

  it('treats the absence of a job offer as a positive answer, not an unknown', () => {
    // Built from `is_present` rather than a negated `equals` on purpose: a
    // negated `equals` reads an absent offer as `unknown` and leaves every
    // tourist permanently undecided on the one criterion they obviously meet.
    const report = visitor(mexicanVisitor);
    expect(report.criteria.find((c) => c.criterionId === 'us-b1-b2-no-local-employment')?.status).toBe(
      'met',
    );
  });

  it('refuses a visitor who has arranged local employment', () => {
    const report = visitor({
      ...mexicanVisitor,
      jobOffer: { employerCountry: US, writtenOffer: true },
    });
    expect(report.verdict).toBe('ineligible');
    expect(report.blockingFailures).toContain('us-b1-b2-no-local-employment');
  });

  it('is indeterminate when intent is unrecorded', () => {
    const report = visitor({ ...mexicanVisitor, intent: undefined });
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('us-b1-b2-residence-abroad-and-finite-stay');
  });

  it('escalates a recorded overstay rather than reading it as a refusal', () => {
    const report = visitor({ ...mexicanVisitor, travelHistory: { priorOverstays: 1 } });
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain(
      'us-b1-b2-residence-abroad-and-finite-stay',
    );
  });

  it('says entering as a visitor with a settled plan to remain is a misrepresentation', () => {
    // Not a shortcut and not a grey area. Somebody has to read that before they
    // act on a suggestion they heard somewhere else.
    const guidance =
      usB1B2Visitor.criteria.find((c) => c.id === 'us-b1-b2-residence-abroad-and-finite-stay')
        ?.guidance?.en ?? '';
    expect(guidance).toMatch(/not a dual-intent classification/i);
    expect(guidance).toContain('misrepresentation');
    expect(guidance).toContain('not a shortcut');
    // And that offering to leave a dependant behind does not answer the doubt.
    expect(guidance).toMatch(/leave a spouse, a child or another dependent behind/i);
  });
});

describe('us-f1-academic-student', () => {
  it('escalates on the I-20 and funds, which the facts model does not hold', () => {
    const report = evaluate(
      usF1AcademicStudent,
      { ...mexicanVisitor, applicantId: 'fixture-us-f1', currentStatus: 'student' },
      TODAY,
    );
    expect(report.verdict).toBe('requires_human_review');
    expect(report.humanReviewCriterionIds).toContain('us-f1-i20-and-financial-support');
  });

  it('bridges to the work classifications a graduate can actually reach', () => {
    expect(usF1AcademicStudent.leadsTo).toEqual([
      'us-h1b-specialty-occupation',
      'us-tn-usmca-professional',
      'us-o1a-extraordinary-ability',
    ]);
  });

  it('flags the duration-of-status change without pretending to know its fate', () => {
    // 91 FR 44976 replaces duration of status with a fixed admission period on
    // 15 September 2026. It is a major rule subject to congressional review, the
    // CFR text is not yet amended, and the litigation status was not
    // established — so the record says all three rather than picking one.
    const note = usF1AcademicStudent.durations.note?.en ?? '';
    expect(note).toContain('15 September 2026');
    expect(note).toContain('major rule subject to congressional review');
    expect(note).toContain('has not yet been amended');
    expect(note).toContain('re-verified in September 2026');
    const rule = usF1AcademicStudent.citations.find(
      (c) => c.id === 'us-fr-91-44976-fixed-period-of-admission',
    );
    // federalregister.gov refuses automated access; the citation carries no URL
    // rather than a guessed one.
    expect(rule?.url).toBeUndefined();
  });
});

describe('wiring', () => {
  it('ships nine records, all unreviewed and all open', () => {
    expect(US_NONIMMIGRANT_PATHWAYS).toHaveLength(9);
    for (const pathway of US_NONIMMIGRANT_PATHWAYS) {
      expect(pathway.jurisdiction).toBe('US');
      expect(pathway.reviewStatus).toBe('unreviewed');
      expect(pathway.status).toBe('open');
      expect(pathway.durations.publishedProcessingDays).toBeUndefined();
    }
  });

  it('bridges only from F-1, and only inside the block', () => {
    const withBridges = US_NONIMMIGRANT_PATHWAYS.filter((p) => p.leadsTo.length > 0);
    expect(withBridges.map((p) => p.id)).toEqual(['us-f1-academic-student']);
  });
});
