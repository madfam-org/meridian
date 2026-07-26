/**
 * The United States family-based block.
 *
 * The property this file exists to protect is the one thing about US family
 * migration that decides how long somebody waits, and it is encoded
 * *structurally* rather than described: an immediate relative is outside the
 * numerical limits and a preference beneficiary is inside them. Section 1151(a)
 * sets the worldwide levels "Exclusive of aliens described in subsection (b)",
 * and § 1151(b)(2)(A)(i) puts the spouse, child and parent of a citizen in that
 * subsection. So the three immediate-relative records carry **no**
 * visa-availability criterion at all, and each of the five preference records
 * carries exactly one. The absence *is* the encoding of "no queue", which means
 * a test that only read the prose would not notice if somebody added the
 * criterion to an immediate relative and quietly put them in a line they are
 * not in.
 *
 * The second thing here is uncomfortable and deliberate. `ApplicantFacts`
 * models an applicant and nothing else, and every one of these routes is at
 * least half a test about a *petitioner* — their status, their income, their
 * household size, their domicile. None of that exists, so eight of nine records
 * escalate on the petitioner side no matter how complete the applicant's own
 * record is. These tests pin that as intended behaviour rather than a gap
 * somebody should paper over with a favourable default.
 */

import { describe, expect, it } from 'vitest';
import {
  US_FAMILY_PATHWAYS,
  usFamilyPreferenceF1,
  usFamilyPreferenceF2a,
  usFamilyPreferenceF2b,
  usFamilyPreferenceF3,
  usFamilyPreferenceF4,
  usFianceK1,
  usImmediateRelativeChild,
  usImmediateRelativeParent,
  usImmediateRelativeSpouse,
} from '../src/catalog/us-family.js';
import { evaluate } from '../src/evaluate.js';
import { walkSpecs, type Criterion, type Pathway } from '../src/schema.js';
import { TODAY, usSponsoredRelative } from './fixtures.js';

const IMMEDIATE_RELATIVES: readonly Pathway[] = [
  usImmediateRelativeSpouse,
  usImmediateRelativeChild,
  usImmediateRelativeParent,
];

const PREFERENCES: readonly Pathway[] = [
  usFamilyPreferenceF1,
  usFamilyPreferenceF2a,
  usFamilyPreferenceF2b,
  usFamilyPreferenceF3,
  usFamilyPreferenceF4,
];

const visaNumberCriteria = (pathway: Pathway): Criterion[] =>
  pathway.criteria.filter((c) => c.id.endsWith('-visa-number-available'));

/** Every fact path any spec on the pathway reads, root-scoped or not. */
const pathsRead = (pathway: Pathway): string[] => {
  const out: string[] = [];
  for (const criterion of pathway.criteria) {
    const specs = [criterion.evaluator];
    if (criterion.humanReviewWhen !== undefined) specs.push(criterion.humanReviewWhen);
    for (const spec of specs) {
      walkSpecs(spec, (s) => {
        if ('path' in s) out.push(s.path);
        if ('otherPath' in s) out.push(s.otherPath);
      });
    }
  }
  return out;
};

describe('the immediate-relative / preference divide', () => {
  it('gives no immediate relative a visa-availability criterion', () => {
    // Not cosmetic. A criterion here would put a person who is statutorily
    // outside the numerical limits into a queue, and on this corridor that is
    // the difference between months and decades.
    for (const pathway of IMMEDIATE_RELATIVES) {
      expect(visaNumberCriteria(pathway), `${pathway.id} was given a queue`).toEqual([]);
    }
  });

  it('gives every preference category exactly one, weighted so it can never say no', () => {
    for (const pathway of PREFERENCES) {
      const criteria = visaNumberCriteria(pathway);
      expect(criteria, `${pathway.id} has no visa-availability criterion`).toHaveLength(1);
      const criterion = criteria[0]!;
      // `material`, not `blocking`: a number that is not available today is a
      // wait, not a refusal, and reporting `ineligible` for it would be wrong
      // in the one direction that makes somebody give up.
      expect(criterion.weight).toBe('material');
      expect(criterion.kind).toBe('procedural');
      expect(criterion.requiresHumanReview).toBe(true);
    }
  });

  it('says in the immediate-relative note why there is no queue, in both languages', () => {
    for (const pathway of IMMEDIATE_RELATIVES) {
      const note = pathway.durations.note;
      expect(note?.en).toContain('Exclusive of aliens described in subsection (b)');
      expect(note?.en).toContain('1151(b)(2)(A)(i)');
      expect(note?.en ?? '').toMatch(/no queue/i);
      expect(note?.es.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('records that derivatives reach the preferences only', () => {
    // § 1153(d) lets a preference beneficiary's spouse and children take the
    // same classification and priority date. It does not reach subsection (b),
    // so an immediate relative has no derivatives — the surprise that catches a
    // parent who assumed the citizen's other parent travels along on the same
    // petition, and the applicant who assumed their own children do.
    for (const pathway of IMMEDIATE_RELATIVES) {
      expect(pathway.durations.note?.en).toContain('1153(d)');
      expect(pathway.durations.note?.en ?? '').toMatch(/derivativ/i);
    }
    for (const pathway of PREFERENCES) {
      expect(pathway.durations.note?.en).toContain('1153(d)');
    }
  });
});

describe('the Mexican queue, stated without a number', () => {
  it('names Mexico as oversubscribed in every preference category', () => {
    for (const pathway of PREFERENCES) {
      const guidance = visaNumberCriteria(pathway)[0]?.guidance?.en ?? '';
      expect(guidance, `${pathway.id}`).toContain('Mexico');
      // Chargeability is by place of birth, not by nationality — § 1152(b).
      // Getting that backwards is the standard error, and it changes the answer
      // for anybody born somewhere other than where they hold a passport.
      expect(guidance).toContain('1152(b)');
    }
  });

  it('keys no queue criterion to the applicant’s nationality', () => {
    // If chargeability were read off `claimedNationality` the engine would be
    // asserting the wrong rule *and* would look authoritative doing it.
    for (const pathway of PREFERENCES) {
      for (const criterion of visaNumberCriteria(pathway)) {
        const specs = [criterion.evaluator];
        if (criterion.humanReviewWhen !== undefined) specs.push(criterion.humanReviewWhen);
        for (const spec of specs) {
          walkSpecs(spec, (s) => {
            if ('path' in s) {
              expect(s.path).not.toContain('claimedNationality');
              expect(s.path).not.toContain('nationalities');
            }
          });
        }
      }
    }
  });

  it('cites the Visa Bulletin without a URL and says why', () => {
    // travel.state.gov refused automated retrieval during the sweep, and this
    // repository does not ship a link nobody fetched. The note has to carry the
    // instruction that replaces it.
    for (const pathway of PREFERENCES) {
      const bulletin = pathway.citations.find((c) => c.id === 'us-dos-visa-bulletin');
      expect(bulletin, `${pathway.id} does not cite the bulletin`).toBeDefined();
      expect(bulletin?.url).toBeUndefined();
      expect(bulletin?.discretionary).toBe(true);
      expect(bulletin?.note ?? '').toContain('MONTHLY');
    }
  });

  it('publishes no processing time anywhere in the block', () => {
    for (const pathway of US_FAMILY_PATHWAYS) {
      expect(pathway.durations.publishedProcessingDays).toBeUndefined();
    }
  });
});

describe('what the engine will and will not decide about a family case', () => {
  it('escalates every record rather than issuing a verdict on half a test', () => {
    // Eight of nine records turn on a petitioner, and `ApplicantFacts` has no
    // petitioner. Each one therefore carries at least one unconditional
    // escalation, which means `evaluate` can never return `eligible` for any of
    // them — including for an applicant whose own record is spotless.
    for (const pathway of US_FAMILY_PATHWAYS) {
      expect(
        pathway.criteria.some((c) => c.requiresHumanReview === true),
        `${pathway.id} could green-tick a case whose petitioner half is unknown`,
      ).toBe(true);
      const report = evaluate(pathway, usSponsoredRelative, TODAY);
      expect(report.verdict).toBe('requires_human_review');
    }
  });

  it('escalates an immediate relative and a preference beneficiary for different reasons', () => {
    const immediate = evaluate(usImmediateRelativeSpouse, usSponsoredRelative, TODAY);
    const preference = evaluate(usFamilyPreferenceF4, usSponsoredRelative, TODAY);

    expect(immediate.verdict).toBe('requires_human_review');
    expect(preference.verdict).toBe('requires_human_review');

    // Same verdict, different reason set — the queue is in one and not the
    // other, which is the whole point of the divide.
    expect(immediate.humanReviewCriterionIds.some((id) => id.includes('visa-number'))).toBe(false);
    expect(preference.humanReviewCriterionIds).toContain('us-f4-visa-number-available');
  });

  it('tells the reviewer what to decide, never a generic sentence', () => {
    for (const pathway of US_FAMILY_PATHWAYS) {
      const report = evaluate(pathway, usSponsoredRelative, TODAY);
      for (const result of report.criteria) {
        if (result.status !== 'requires_human_review') continue;
        expect(result.humanReviewReason).toBeDefined();
        expect(result.humanReviewReason).not.toContain('cannot be decided automatically');
      }
    }
  });

  it('keeps the age test on an immediate-relative child from reading as a refusal', () => {
    // § 1151(f)(1) fixes the child's age at the *petition filing date*, and
    // Meridian records no filing date. A 30-year-old whose petition was filed
    // at 19 is still a child for this purpose, so the criterion escalates
    // rather than reporting `unmet` for anybody over 21.
    const overTwentyOne = evaluate(usImmediateRelativeChild, usSponsoredRelative, TODAY);
    expect(overTwentyOne.blockingFailures).not.toContain('us-ir-child-under-21-and-unmarried');
    expect(overTwentyOne.humanReviewCriterionIds).toContain('us-ir-child-under-21-and-unmarried');
  });

  it('records a self-declared clean record as met without letting it settle admissibility', () => {
    // The one criterion in the block that decides on the applicant's own facts.
    // It is `material` on purpose: a self-declaration is evidence toward
    // admissibility, not the finding, and § 1182(a)(9) is not modelled at all.
    const report = evaluate(usImmediateRelativeSpouse, usSponsoredRelative, TODAY);
    const admissibility = report.criteria.find((c) => c.criterionId === 'us-ir-spouse-admissibility');
    expect(admissibility?.status).toBe('met');
    expect(admissibility?.weight).toBe('material');
  });

  it('escalates rather than clears when a record is declared', () => {
    const declared = evaluate(
      usImmediateRelativeSpouse,
      { ...usSponsoredRelative, criminalRecord: { selfDeclaredClear: false } },
      TODAY,
    );
    expect(declared.humanReviewCriterionIds).toContain('us-ir-spouse-admissibility');
    expect(declared.blockingFailures).toEqual([]);
  });
});

describe('what the block says it does not cover', () => {
  it('names VAWA self-petitions rather than leaving them looking like missing law', () => {
    // The one family route a reader would otherwise read as an omission. It is
    // named where it arises and encoded nowhere, with a pointer to a person.
    const spouseRelationship = usImmediateRelativeSpouse.criteria.find(
      (c) => c.id === 'us-ir-spouse-relationship',
    );
    expect(spouseRelationship?.guidance?.en).toContain('1154(a)(1)(A)');
    expect(spouseRelationship?.guidance?.en).toContain('accredited');

    const f2aRelationship = usFamilyPreferenceF2a.criteria.find(
      (c) => c.id === 'us-f2a-relationship',
    );
    expect(f2aRelationship?.guidance?.en).toContain('1154(a)(1)(B)');
  });

  it('says a permanent resident has no sibling category at all', () => {
    // Not a slower door — a door that does not open until naturalisation.
    const petitioner = usFamilyPreferenceF4.criteria.find(
      (c) => c.id === 'us-f4-petitioner-citizen-aged-21',
    );
    expect(petitioner?.guidance?.en).toContain('no sibling category');
  });

  it('distinguishes losing the category from converting to another one', () => {
    // An F2B beneficiary who marries loses the category outright; an F1
    // beneficiary who marries converts to F3. Two different consequences of the
    // same life event, and both are stated.
    const f2b = usFamilyPreferenceF2b.criteria.find((c) => c.id === 'us-f2b-remains-unmarried');
    const f1 = usFamilyPreferenceF1.criteria.find((c) => c.id === 'us-f1-remains-unmarried');
    expect(f2b?.guidance?.en.length ?? 0).toBeGreaterThan(0);
    expect(f1?.guidance?.en).toContain('third preference');
  });
});

describe('wiring', () => {
  it('ships nine records, all unreviewed', () => {
    expect(US_FAMILY_PATHWAYS).toHaveLength(9);
    for (const pathway of US_FAMILY_PATHWAYS) {
      expect(pathway.jurisdiction).toBe('US');
      expect(pathway.reviewStatus).toBe('unreviewed');
      expect(pathway.status).toBe('open');
    }
  });

  it('bridges K-1 to the immediate-relative spouse record and nowhere else', () => {
    // A K-1 is entry facilitation, not residence: the marriage happens after
    // admission and the adjustment that follows is conditional.
    expect(usFianceK1.kind).toBe('entry_facilitation');
    expect(usFianceK1.leadsTo).toEqual(['us-immediate-relative-spouse']);
    for (const pathway of US_FAMILY_PATHWAYS) {
      if (pathway.id === 'us-fiance-k1') continue;
      expect(pathway.leadsTo, `${pathway.id}`).toEqual([]);
      expect(pathway.kind).toBe('permanent_residence');
    }
  });

  it('reads no fact path outside the model', () => {
    // A typo here would evaluate to `unknown` for every applicant forever,
    // which reads as caution and is actually a rule that never runs.
    const roots = new Set(US_FAMILY_PATHWAYS.flatMap(pathsRead).map((p) => p.split('.')[0]));
    for (const root of roots) {
      expect(
        ['applicantId', 'targetJurisdiction', 'derived', 'criminalRecord'],
        `unexpected root ${String(root)}`,
      ).toContain(root);
    }
  });
});
