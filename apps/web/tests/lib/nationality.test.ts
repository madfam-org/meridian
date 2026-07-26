/**
 * `lib/tools/nationality.ts` — the computation behind `/tools/nationality-es`.
 *
 * This is the surface where a wrong answer does the most damage: the difference
 * between the two-year regime and the ten-year one is eight years of somebody's
 * life, and the difference between "unmet" and "not recorded" is the difference
 * between telling a person they do not qualify and telling them a question is
 * still open. Both mistakes are acted on.
 *
 * The tests below are grouped by the defect each one exists to catch rather than
 * by function.
 */

import { describe, expect, it } from 'vitest';

import type { CriterionStatus } from '@meridian/pathways';

import {
  EMPTY_ANSWERS,
  FIELD,
  NATIONALITY_EXAMPLES,
  NO,
  NO_SECOND_NATIONALITY,
  OTHER_COUNTRY,
  RESIDENCE_UNDER_CLAIMED,
  RESIDENCE_UNDER_SECOND,
  UNANSWERED,
  YES,
  readNationalityAnswers,
  runNationalityCheck,
  type NationalityAnswers,
  type NationalityAssessment,
} from '@/lib/tools/nationality';

const REDUCED = 'es-nationality-residence-reduced';
const GENERAL = 'es-nationality-residence-general';
const TWO_YEARS = 'es-nat-red-two-years-continuous-residence';

/** A fully answered file: Mexican by origin, resident since 2024-03-01. */
const ANSWERED: NationalityAnswers = {
  ...EMPTY_ANSWERS,
  claimed: 'MX',
  acquisition: 'by_origin',
  second: NO_SECOND_NATIONALITY,
  residenceUnder: RESIDENCE_UNDER_CLAIMED,
  residenceSince: '2024-03-01',
  status: 'resident',
  ageYears: '34',
  ccse: YES,
  certificates: YES,
};

/** Read and evaluate in one step. Fails loudly if the form did not parse. */
function assess(answers: NationalityAnswers): NationalityAssessment {
  const reading = readNationalityAnswers(answers);
  expect(reading.issues).toEqual([]);
  const { facts, asOf } = reading;
  if (facts === null || asOf === null) throw new Error('the form did not parse');
  return runNationalityCheck(facts, asOf);
}

function example(id: string): NationalityAnswers {
  const found = NATIONALITY_EXAMPLES.find((e) => e.id === id);
  if (found === undefined) throw new Error(`no such example: ${id}`);
  return found.answers;
}

function verdictOf(assessment: NationalityAssessment, pathwayId: string): string {
  const route = assessment.routes.find((r) => r.pathway.id === pathwayId);
  if (route === undefined) throw new Error(`route not evaluated: ${pathwayId}`);
  return route.report.verdict;
}

function criterion(assessment: NationalityAssessment, id: string): CriterionStatus {
  for (const route of assessment.routes) {
    const found = route.criteria.find((c) => c.id === id);
    if (found !== undefined) return found.status;
  }
  throw new Error(`criterion not evaluated: ${id}`);
}

// ---------------------------------------------------------------------------
// The three headline cases
// ---------------------------------------------------------------------------

describe('the three cases the tool exists to tell apart', () => {
  it('a Mexican national by origin with two years meets the reduced criteria', () => {
    const assessment = assess(example('by-origin'));

    expect(verdictOf(assessment, REDUCED)).toBe('eligible');
    expect(assessment.byOriginStatus).toBe('met');
    expect(assessment.residenceNationalityStatus).toBe('met');
    expect(criterion(assessment, TWO_YEARS)).toBe('met');
  });

  it('the same person residing under an Italian passport does not reach the reduction', () => {
    const assessment = assess(example('dual-national'));

    expect(verdictOf(assessment, REDUCED)).not.toBe('eligible');
    // The reduction fails on the nationality the residence is held under, not
    // on how the Mexican nationality was acquired — which is still by origin.
    // Attributing the refusal to the wrong criterion would send the reader off
    // to prove something that was never in doubt.
    expect(assessment.residenceNationalityStatus).toBe('unmet');
    expect(assessment.byOriginStatus).toBe('met');
  });

  it('the two cases differ by exactly one answer', () => {
    const byOrigin = example('by-origin');
    const dual = example('dual-national');
    const changed = (Object.keys(byOrigin) as (keyof NationalityAnswers)[]).filter(
      (key) => byOrigin[key] !== dual[key],
    );

    // `second`, `secondOtherCode` and `residenceUnder` are one answer: naming a
    // second nationality and saying the residence is held under it. Nothing
    // about the residence period, the exams or the status moves.
    expect(changed.sort()).toEqual(['residenceUnder', 'second', 'secondOtherCode']);
    expect(byOrigin.residenceSince).toBe(dual.residenceSince);
    expect(byOrigin.acquisition).toBe(dual.acquisition);
  });

  it('an unrecorded acquisition mode is indeterminate, not a refusal and not a pass', () => {
    const assessment = assess(example('acquisition-unstated'));

    expect(verdictOf(assessment, REDUCED)).toBe('indeterminate');
    expect(assessment.byOriginStatus).toBe('unknown');
    expect(assessment.unknownCount).toBeGreaterThan(0);
  });

  it('leaving the acquisition mode blank never records the literal "unknown"', () => {
    // `NationalityAcquisition` has an `'unknown'` member and it is a trap: it
    // compares unequal to `'by_origin'`, so recording it would produce `unmet`
    // — a definitive no — where the honest answer is that nothing was said.
    const reading = readNationalityAnswers({ ...ANSWERED, acquisition: UNANSWERED });

    expect(reading.facts?.claimedNationalityAcquisition).toBeUndefined();
    expect(criterion(assess({ ...ANSWERED, acquisition: UNANSWERED }), 'es-nat-red-nationality-by-origin')).toBe(
      'unknown',
    );
  });

  it('no unanswered question turns the reduced route into a definitive no', () => {
    const optional: (keyof NationalityAnswers)[] = [
      'claimed',
      'acquisition',
      'second',
      'residenceUnder',
      'residenceSince',
      'status',
      'ageYears',
      'ccse',
      'dele',
      'certificates',
    ];

    for (const field of optional) {
      const blanked: NationalityAnswers = { ...ANSWERED, [field]: field === 'ageYears' || field === 'residenceSince' ? '' : UNANSWERED };
      const reading = readNationalityAnswers(blanked);
      // Blanking `second` alone leaves "residence under the other nationality"
      // pointing at nothing, which is a real complaint about the form rather
      // than a verdict. Everything else must parse and stay undecided.
      if (reading.issues.length > 0) {
        expect(field).toBe('second');
        continue;
      }
      const assessment = assess(blanked);
      expect(
        verdictOf(assessment, REDUCED),
        `blanking ${field} produced a definitive answer`,
      ).not.toBe('ineligible');
    }
  });

  it('an empty form is undecided on both regimes and complains about nothing', () => {
    const reading = readNationalityAnswers(EMPTY_ANSWERS);
    expect(reading.issues).toEqual([]);

    const assessment = assess(EMPTY_ANSWERS);
    expect(verdictOf(assessment, REDUCED)).toBe('indeterminate');
    expect(verdictOf(assessment, GENERAL)).toBe('indeterminate');
  });
});

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

describe('the two-year period, at its edge', () => {
  /**
   * `duration_since_at_least` completes on `addYears(start, 2) - 1 day`, so a
   * residence beginning on 2024-07-26 completes on exactly 2026-07-25. One day
   * later and it does not. This is the assertion that catches an off-by-one in
   * either direction, and an off-by-one here is eight years of difference to a
   * reader who acts on it.
   */
  it('is met on the last day of the period and unmet the day before it completes', () => {
    const at = (since: string): CriterionStatus =>
      criterion(assess({ ...ANSWERED, residenceSince: since, assessAsOf: '2026-07-25' }), TWO_YEARS);

    expect(at('2024-07-26')).toBe('met');
    expect(at('2024-07-27')).toBe('unmet');
  });

  it('clamps a 29 February start to 28 February, and completes the day before', () => {
    const at = (asOf: string): CriterionStatus =>
      criterion(assess({ ...ANSWERED, residenceSince: '2024-02-29', assessAsOf: asOf }), TWO_YEARS);

    // 2024-02-29 + 2 years clamps to 2026-02-28; the period completes on the
    // 27th. A `new Date()`-based calculation rolls the leap day to 1 March and
    // moves the answer by a day.
    expect(at('2026-02-27')).toBe('met');
    expect(at('2026-02-26')).toBe('unmet');
  });

  it('a residence that does not reach the assessment date is not recorded at all', () => {
    // The form models one closed period ending at the assessment date, so this
    // is enforced upstream: a start after the assessment date is rejected
    // rather than silently producing a run that ends in the past.
    const reading = readNationalityAnswers({
      ...ANSWERED,
      residenceSince: '2026-07-26',
      assessAsOf: '2026-07-25',
    });

    expect(reading.facts).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toContain(FIELD.residenceSince);
  });

  it('an age of exactly 18 does not reach the minor exemption', () => {
    const under = assess({ ...ANSWERED, ageYears: '17', ccse: NO, dele: NO });
    const at18 = assess({ ...ANSWERED, ageYears: '18', ccse: NO, dele: NO });

    expect(criterion(under, 'es-nat-red-ccse')).toBe('met');
    expect(criterion(at18, 'es-nat-red-ccse')).toBe('unmet');
  });
});

// ---------------------------------------------------------------------------
// Absence versus an asserted negative
// ---------------------------------------------------------------------------

describe('what the form records, and what it deliberately does not', () => {
  it('an answered "no" is recorded as a fact, not as silence', () => {
    const reading = readNationalityAnswers({ ...ANSWERED, ccse: NO, dele: NO, certificates: NO });

    expect(reading.facts?.examResults).toEqual([{ code: 'CCSE', passed: false }]);
    // An empty array is the positive assertion that no certificate is held.
    // `undefined` would mean nobody asked, and the two produce different
    // verdicts.
    expect(reading.facts?.languageCertifications).toEqual([]);
    expect(reading.facts?.criminalRecord).toEqual({ certificates: [] });
  });

  it('an unanswered exam question leaves the field absent', () => {
    const reading = readNationalityAnswers({ ...ANSWERED, ccse: UNANSWERED, dele: UNANSWERED });

    expect(reading.facts?.examResults).toBeUndefined();
    expect(reading.facts?.languageCertifications).toBeUndefined();
  });

  it('naming a nationality is the assertion that it is held', () => {
    const reading = readNationalityAnswers({
      ...ANSWERED,
      second: OTHER_COUNTRY,
      secondOtherCode: 'it',
      residenceUnder: RESIDENCE_UNDER_SECOND,
    });

    expect(reading.facts?.nationalities).toEqual(['MX', 'IT']);
    expect(reading.facts?.claimedNationality).toBe('MX');
    expect(reading.facts?.residenceHeldUnderNationality).toBe('IT');
  });

  it('carries no identifying value into the facts it builds', () => {
    // The repository is public and the tool has no account, no session and no
    // storage. `applicantId` is required by the type and must stay a constant.
    const reading = readNationalityAnswers(ANSWERED);
    expect(reading.facts?.applicantId).toBe('browser-tool');
    expect(JSON.stringify(reading.facts)).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('reading the form', () => {
  it('rejects a country code that is not ISO 3166-1 alpha-2, and names the field', () => {
    const reading = readNationalityAnswers({
      ...ANSWERED,
      claimed: OTHER_COUNTRY,
      claimedOtherCode: 'MEX',
    });

    expect(reading.facts).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toEqual([FIELD.claimedOtherCode]);
    expect(reading.issues[0]?.message.en).toContain('MEX');
    expect(reading.issues[0]?.message.es).toContain('MEX');
  });

  it('accepts a lower-case code and upper-cases it', () => {
    const reading = readNationalityAnswers({
      ...ANSWERED,
      claimed: OTHER_COUNTRY,
      claimedOtherCode: ' ma ',
    });

    expect(reading.issues).toEqual([]);
    expect(reading.facts?.claimedNationality).toBe('MA');
  });

  it('refuses the same nationality in both questions', () => {
    const reading = readNationalityAnswers({ ...ANSWERED, second: 'MX' });

    expect(reading.facts).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toContain(FIELD.second);
  });

  it('refuses "residence under my other nationality" when no other is named', () => {
    const reading = readNationalityAnswers({
      ...ANSWERED,
      second: NO_SECOND_NATIONALITY,
      residenceUnder: RESIDENCE_UNDER_SECOND,
    });

    expect(reading.facts).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toContain(FIELD.second);
  });

  it('computes nothing when any field failed to read', () => {
    // A figure derived from the fields that happened to parse is worse than no
    // figure, because it looks like an answer.
    const reading = readNationalityAnswers({ ...ANSWERED, assessAsOf: '2026-02-30' });

    expect(reading.facts).toBeNull();
    expect(reading.asOf).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toContain(FIELD.assessAsOf);
  });

  it('every issue names a field that the form actually renders', () => {
    const ids: readonly string[] = Object.values(FIELD);
    const broken = readNationalityAnswers({
      ...ANSWERED,
      assessAsOf: 'not a date',
      claimed: OTHER_COUNTRY,
      claimedOtherCode: '???',
      second: OTHER_COUNTRY,
      secondOtherCode: '',
      ageYears: '1e3',
    });

    expect(broken.issues.length).toBeGreaterThan(2);
    for (const issue of broken.issues) {
      // An error summary links to `#fieldId`. An id that no control carries is
      // a link that goes nowhere.
      expect(ids, `unknown field id: ${issue.fieldId}`).toContain(issue.fieldId);
      expect(issue.message.en.length).toBeGreaterThan(0);
      expect(issue.message.es.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// The shape of the assessment
// ---------------------------------------------------------------------------

describe('the assessment it hands to the page', () => {
  it('always reports both regimes, in catalog order, whatever the outcome', () => {
    const favourable = assess(example('by-origin'));
    const unfavourable = assess(example('dual-national'));

    // The reduced route is eligible in the first and blocked in the second. If
    // the order moved with the outcome, the page would be ranking them.
    expect(favourable.routes.map((r) => r.pathway.id)).toEqual([REDUCED, GENERAL]);
    expect(unfavourable.routes.map((r) => r.pathway.id)).toEqual([REDUCED, GENERAL]);
    expect(verdictOf(favourable, REDUCED)).toBe('eligible');
    expect(verdictOf(unfavourable, REDUCED)).not.toBe('eligible');
  });

  it('reports every record as unreviewed, because that is what the catalog says', () => {
    const assessment = assess(ANSWERED);

    expect(assessment.routes.map((r) => r.report.reviewStatus)).toEqual([
      'unreviewed',
      'unreviewed',
    ]);
    expect(assessment.notes.some((n) => n.code === 'unreviewed_rule')).toBe(true);
  });

  it('renders one criterion row per criterion on the pathway', () => {
    const assessment = assess(ANSWERED);

    for (const route of assessment.routes) {
      expect(route.criteria.map((c) => c.id)).toEqual(route.pathway.criteria.map((c) => c.id));
    }
  });

  it('collapses a note raised on two routes into one entry', () => {
    const assessment = assess(ANSWERED);
    const keys = assessment.notes.map((n) => n.key);

    // Repeating a caveat verbatim trains people to skim past it, and two
    // elements with the same key make the inline reference jump to whichever
    // came first.
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('de-duplicates the criteria named by a note on their text, not their identity', () => {
    // `es-nat-red-ccse` and `es-nat-gen-ccse` are distinct criteria whose labels
    // are distinct objects with identical wording. An identity check lets the
    // same sentence through twice and then renders two children with one key.
    const assessment = assess(ANSWERED);

    for (const note of assessment.notes) {
      const wording = note.criteria.map((c) => c.en);
      expect(new Set(wording).size, `note ${note.key} repeats a criterion`).toBe(wording.length);
    }
  });

  it('lists every source once, in id order, across both regimes', () => {
    const assessment = assess(ANSWERED);
    const ids = assessment.citations.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
    expect(ids).toContain('es-cc-art-22-1');
  });

  it('marks the discretionary source as discretionary', () => {
    // The dual-national treatment is administrative practice, not statutory
    // text. A page that presented it as a threshold would be inventing law.
    const assessment = assess(example('dual-national'));
    const practice = assessment.citations.find((c) => c.id === 'es-practice-claimed-nationality');

    expect(practice?.discretionary).toBe(true);
    expect(assessment.notes.some((n) => n.code === 'discretionary_source')).toBe(true);
  });

  it('counts the criteria left undecided across both regimes', () => {
    const decided = assess(example('by-origin'));
    const undecided = assess(example('acquisition-unstated'));

    expect(decided.unknownCount).toBe(0);
    expect(undecided.unknownCount).toBe(
      undecided.routes.reduce((sum, r) => sum + r.report.unknowns.length, 0),
    );
    expect(undecided.unknownCount).toBeGreaterThan(0);
  });

  it('says whether a residence duration was decided at all', () => {
    expect(assess(ANSWERED).residenceDurationDecided).toBe(true);
    expect(assess({ ...ANSWERED, residenceSince: '' }).residenceDurationDecided).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The invented examples
// ---------------------------------------------------------------------------

describe('the invented situations', () => {
  it('carry no personal data of any kind', () => {
    // The repository is public. No name, no document number, no date of birth,
    // in fixtures or examples.
    for (const { answers } of NATIONALITY_EXAMPLES) {
      const values = Object.values(answers).join(' ');
      expect(values).not.toMatch(/[A-Z]{2}\d{6,}/);
      expect(Object.keys(answers).sort()).toEqual(Object.keys(EMPTY_ANSWERS).sort());
    }
  });

  it('all parse without complaint', () => {
    for (const { id, answers } of NATIONALITY_EXAMPLES) {
      const reading = readNationalityAnswers(answers);
      expect(reading.issues, `example ${id} does not parse`).toEqual([]);
    }
  });
});
