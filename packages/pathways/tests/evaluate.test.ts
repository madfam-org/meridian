import { dateRange, isoDate, type IsoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import { evaluateSpec, periodCompletesOn, resolvePath } from '../src/evaluate.js';
import { CEFR_SCALE, deriveFacts, evaluationScope, threeYearLookback } from '../src/facts.js';
import type { EvaluatorSpec } from '../src/schema.js';
import { CA, d, TODAY } from './fixtures.js';

const run = (spec: EvaluatorSpec, scope: unknown, asOf: IsoDate = TODAY) =>
  evaluateSpec(spec, scope, scope, asOf).value;

describe('resolvePath', () => {
  it('reads nested own properties', () => {
    expect(resolvePath({ a: { b: 1 } }, {}, 'a.b')).toEqual({ found: true, value: 1 });
  });

  it('treats absent and null alike as not found', () => {
    expect(resolvePath({ a: null }, {}, 'a').found).toBe(false);
    expect(resolvePath({}, {}, 'a').found).toBe(false);
    expect(resolvePath({ a: {} }, {}, 'a.b.c').found).toBe(false);
  });

  it('distinguishes false from absent — false is a fact, absence is not', () => {
    expect(resolvePath({ a: false }, {}, 'a')).toEqual({ found: true, value: false });
    expect(resolvePath({ a: 0 }, {}, 'a')).toEqual({ found: true, value: 0 });
    expect(resolvePath({ a: '' }, {}, 'a')).toEqual({ found: true, value: '' });
  });

  it('resolves $. against the root rather than the current scope', () => {
    expect(resolvePath({ x: 1 }, { x: 2 }, '$.x')).toEqual({ found: true, value: 2 });
  });

  it('refuses to walk prototype-pollution segments', () => {
    // The catalog is data and will one day come from a database. A rule whose
    // path reads `constructor.prototype` must find nothing, not a constructor.
    expect(resolvePath({}, {}, '__proto__').found).toBe(false);
    expect(resolvePath({}, {}, 'constructor.prototype').found).toBe(false);
    expect(resolvePath({ a: {} }, {}, 'a.__proto__.polluted').found).toBe(false);
  });

  it('does not see inherited properties', () => {
    const parent = { inherited: 'yes' };
    const child = Object.create(parent) as Record<string, unknown>;
    child['own'] = 'mine';
    expect(resolvePath(child, {}, 'own').found).toBe(true);
    expect(resolvePath(child, {}, 'inherited').found).toBe(false);
  });

  it('handles empty and malformed paths without throwing', () => {
    expect(resolvePath({}, {}, '').found).toBe(false);
    expect(resolvePath({ a: 1 }, {}, 'a..b').found).toBe(false);
    expect(resolvePath({ a: 1 }, {}, '$.').found).toBe(false);
  });

  it('indexes into arrays by numeric segment', () => {
    expect(resolvePath({ xs: ['a', 'b'] }, {}, 'xs.1')).toEqual({ found: true, value: 'b' });
    expect(resolvePath({ xs: ['a'] }, {}, 'xs.5').found).toBe(false);
  });
});

describe('three-valued logic', () => {
  it('reports unknown, never false, when a fact is simply absent', () => {
    expect(run({ op: 'gte', path: 'days', value: 730 }, {})).toBe('unknown');
    expect(run({ op: 'equals', path: 'status', value: 'resident' }, {})).toBe('unknown');
    expect(run({ op: 'one_of', path: 'nat', values: ['MX'] }, {})).toBe('unknown');
  });

  it('is_present answers false for absence rather than unknown', () => {
    expect(run({ op: 'is_present', path: 'x' }, {})).toBe('false');
    expect(run({ op: 'is_present', path: 'x' }, { x: 0 })).toBe('true');
  });

  it('all_of is false on any false, unknown only when nothing is false', () => {
    const spec = (...of: EvaluatorSpec[]): EvaluatorSpec => ({ op: 'all_of', of });
    const yes: EvaluatorSpec = { op: 'is_true', path: 'a' };
    const no: EvaluatorSpec = { op: 'is_true', path: 'b' };
    const dunno: EvaluatorSpec = { op: 'is_true', path: 'c' };
    const scope = { a: true, b: false };
    expect(run(spec(yes, no, dunno), scope)).toBe('false');
    expect(run(spec(yes, dunno), scope)).toBe('unknown');
    expect(run(spec(yes), scope)).toBe('true');
  });

  it('any_of is true on any true, unknown only when nothing is true', () => {
    const spec = (...of: EvaluatorSpec[]): EvaluatorSpec => ({ op: 'any_of', of });
    const yes: EvaluatorSpec = { op: 'is_true', path: 'a' };
    const no: EvaluatorSpec = { op: 'is_true', path: 'b' };
    const dunno: EvaluatorSpec = { op: 'is_true', path: 'c' };
    const scope = { a: true, b: false };
    expect(run(spec(no, dunno, yes), scope)).toBe('true');
    expect(run(spec(no, dunno), scope)).toBe('unknown');
    expect(run(spec(no), scope)).toBe('false');
  });

  it('not leaves unknown alone', () => {
    expect(run({ op: 'not', of: { op: 'is_true', path: 'x' } }, {})).toBe('unknown');
    expect(run({ op: 'not', of: { op: 'is_true', path: 'x' } }, { x: false })).toBe('true');
  });

  it('is unaffected by the order of the operands', () => {
    const a: EvaluatorSpec = { op: 'is_true', path: 'a' };
    const b: EvaluatorSpec = { op: 'is_true', path: 'b' };
    const c: EvaluatorSpec = { op: 'is_true', path: 'c' };
    const scope = { a: true, b: false };
    expect(run({ op: 'all_of', of: [a, b, c] }, scope)).toBe(
      run({ op: 'all_of', of: [c, b, a] }, scope),
    );
    expect(run({ op: 'any_of', of: [a, b, c] }, scope)).toBe(
      run({ op: 'any_of', of: [c, b, a] }, scope),
    );
  });
});

describe('collection_any', () => {
  const holdsA2: EvaluatorSpec = {
    op: 'collection_any',
    path: 'certs',
    where: {
      op: 'all_of',
      of: [
        { op: 'equals', path: 'language', value: 'es' },
        { op: 'ordinal_at_least', path: 'level', scale: CEFR_SCALE, value: 'A2' },
      ],
    },
  };

  it('distinguishes an empty array from an absent one', () => {
    // "I hold no certificates" is knowable. "I have not told you about my
    // certificates" is not, and must never be read as a negative.
    expect(run(holdsA2, { certs: [] })).toBe('false');
    expect(run(holdsA2, {})).toBe('unknown');
  });

  it('matches when any element satisfies the inner spec', () => {
    expect(run(holdsA2, { certs: [{ language: 'en', level: 'C1' }, { language: 'es', level: 'B1' }] })).toBe('true');
  });

  it('is unknown when no element matches but one is incomplete', () => {
    expect(run(holdsA2, { certs: [{ language: 'es' }] })).toBe('unknown');
  });

  it('resolves $. paths inside the element scope against the root facts', () => {
    const spec: EvaluatorSpec = {
      op: 'collection_any',
      path: 'certs',
      where: { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
    };
    const scope = { claimedNationality: 'MX', certs: [{ jurisdiction: 'ES' }, { jurisdiction: 'MX' }] };
    expect(run(spec, scope)).toBe('true');
    expect(run(spec, { claimedNationality: 'MX', certs: [{ jurisdiction: 'ES' }] })).toBe('false');
  });

  it('is unknown, not false, when the path holds a non-array', () => {
    expect(run(holdsA2, { certs: 'nope' })).toBe('unknown');
  });
});

describe('ordinal_at_least', () => {
  const spec: EvaluatorSpec = {
    op: 'ordinal_at_least',
    path: 'level',
    scale: CEFR_SCALE,
    value: 'A2',
  };

  it('compares by position on the declared scale, not alphabetically', () => {
    expect(run(spec, { level: 'A1' })).toBe('false');
    expect(run(spec, { level: 'A2' })).toBe('true');
    expect(run(spec, { level: 'C2' })).toBe('true');
  });

  it('answers unknown for a value that is not on the scale', () => {
    // Reporting "unmet" would assert we checked something we did not.
    expect(run(spec, { level: 'B2+' })).toBe('unknown');
    expect(run(spec, { level: 7 })).toBe('unknown');
  });
});

describe('duration_since_at_least', () => {
  const twoYears: EvaluatorSpec = { op: 'duration_since_at_least', path: 'since', years: 2 };

  it('treats the period as closed at both ends', () => {
    // Two years beginning 2024-07-26 complete on 2026-07-25, the assessment
    // date itself. One day later, they do not.
    expect(periodCompletesOn(d('2024-07-26'), { years: 2 })).toBe('2026-07-25');
    expect(run(twoYears, { since: '2024-07-26' })).toBe('true');
    expect(run(twoYears, { since: '2024-07-27' })).toBe('false');
  });

  it('lands on the leap day when the period spans one', () => {
    // 2022-03-01 through 2024-02-29 inclusive is 731 days: two calendar years
    // that happen to include 2024-02-29.
    expect(periodCompletesOn(d('2022-03-01'), { years: 2 })).toBe('2024-02-29');
  });

  it('clamps rather than overflowing when the anniversary does not exist', () => {
    // A period starting on a leap day has no anniversary in a common year;
    // core's addYears clamps to the end of February instead of rolling into March.
    expect(periodCompletesOn(d('2024-02-29'), { years: 1 })).toBe('2025-02-27');
  });

  it('supports months and days as well as years', () => {
    expect(periodCompletesOn(d('2025-01-31'), { months: 1 })).toBe('2025-02-27');
    expect(periodCompletesOn(d('2025-01-01'), { days: 90 })).toBe('2025-03-31');
  });

  it('is unknown when the start date is missing or malformed', () => {
    expect(run(twoYears, {})).toBe('unknown');
    expect(run(twoYears, { since: 'yesterday' })).toBe('unknown');
    expect(run(twoYears, { since: '2025-02-30' })).toBe('unknown');
  });

  it('is unknown, never met, when the rule states no period length', () => {
    const malformed = { op: 'duration_since_at_least', path: 'since' } as EvaluatorSpec;
    expect(run(malformed, { since: '2000-01-01' })).toBe('unknown');
  });
});

describe('date comparisons', () => {
  const before: EvaluatorSpec = { op: 'date_before', path: 'on', value: isoDate('2025-04-03') };

  it('excludes the boundary date for a strict comparison', () => {
    expect(run(before, { on: '2025-04-02' })).toBe('true');
    expect(run(before, { on: '2025-04-03' })).toBe('false');
  });

  it('includes it for the inclusive variant', () => {
    const onOrBefore: EvaluatorSpec = {
      op: 'date_on_or_before',
      path: 'on',
      value: isoDate('2025-04-03'),
    };
    expect(run(onOrBefore, { on: '2025-04-03' })).toBe('true');
  });

  it('handles the after variants symmetrically', () => {
    const after: EvaluatorSpec = { op: 'date_after', path: 'on', value: isoDate('2025-04-03') };
    const onOrAfter: EvaluatorSpec = {
      op: 'date_on_or_after',
      path: 'on',
      value: isoDate('2025-04-03'),
    };
    expect(run(after, { on: '2025-04-03' })).toBe('false');
    expect(run(onOrAfter, { on: '2025-04-03' })).toBe('true');
  });
});

describe('field-to-field comparisons', () => {
  it('set_contains_field checks membership of the value at another path', () => {
    const spec: EvaluatorSpec = {
      op: 'set_contains_field',
      path: 'nationalities',
      otherPath: 'claimedNationality',
    };
    expect(run(spec, { nationalities: ['IT', 'MX'], claimedNationality: 'MX' })).toBe('true');
    expect(run(spec, { nationalities: ['IT'], claimedNationality: 'MX' })).toBe('false');
    expect(run(spec, { nationalities: ['IT'] })).toBe('unknown');
  });

  it('equals_field is unknown when either side is unrecorded', () => {
    const spec: EvaluatorSpec = { op: 'equals_field', path: 'a', otherPath: 'b' };
    expect(run(spec, { a: 'X', b: 'X' })).toBe('true');
    expect(run(spec, { a: 'X', b: 'Y' })).toBe('false');
    expect(run(spec, { a: 'X' })).toBe('unknown');
  });
});

describe('deriveFacts', () => {
  it('merges overlapping residence periods without double counting', () => {
    const derived = deriveFacts(
      {
        applicantId: 't',
        residencePeriods: [
          dateRange(d('2024-01-01'), d('2024-06-30')),
          dateRange(d('2024-04-01'), d('2024-12-31')),
        ],
      },
      TODAY,
    );
    expect(derived.legalResidenceDaysTotal).toBe(366); // 2024 is a leap year
  });

  it('is independent of the order the periods are supplied in', () => {
    const a = dateRange(d('2023-01-01'), d('2023-06-30'));
    const b = dateRange(d('2024-01-01'), d('2024-06-30'));
    const forwards = deriveFacts({ applicantId: 't', residencePeriods: [a, b] }, TODAY);
    const backwards = deriveFacts({ applicantId: 't', residencePeriods: [b, a] }, TODAY);
    expect(forwards).toEqual(backwards);
  });

  it('only reports a continuous-residence start when the run reaches the assessment date', () => {
    const current = deriveFacts(
      { applicantId: 't', residencePeriods: [dateRange(d('2020-01-01'), TODAY)] },
      TODAY,
    );
    expect(current.continuousLegalResidenceSince).toBe('2020-01-01');

    const lapsed = deriveFacts(
      { applicantId: 't', residencePeriods: [dateRange(d('2020-01-01'), d('2024-01-01'))] },
      TODAY,
    );
    expect(lapsed.continuousLegalResidenceSince).toBeUndefined();
    expect(lapsed.legalResidenceDaysTotal).toBeGreaterThan(1000);
  });

  it('treats adjacent periods as one unbroken run', () => {
    const derived = deriveFacts(
      {
        applicantId: 't',
        residencePeriods: [
          dateRange(d('2024-01-01'), d('2024-12-31')),
          dateRange(d('2025-01-01'), TODAY),
        ],
      },
      TODAY,
    );
    expect(derived.continuousLegalResidenceSince).toBe('2024-01-01');
  });

  it('falls back to a self-reported day count but never invents continuity from it', () => {
    const derived = deriveFacts({ applicantId: 't', legalResidenceDays: 900 }, TODAY);
    expect(derived.legalResidenceDaysTotal).toBe(900);
    expect(derived.continuousLegalResidenceSince).toBeUndefined();
  });

  it('discards inverted ranges instead of throwing', () => {
    const derived = deriveFacts(
      { applicantId: 't', residencePeriods: [{ start: d('2025-01-01'), end: d('2024-01-01') }] },
      TODAY,
    );
    expect(derived.legalResidenceDaysTotal).toBe(0);
  });

  it('counts age by anniversary, including on the birthday itself', () => {
    expect(deriveFacts({ applicantId: 't', dateOfBirth: d('2008-07-25') }, TODAY).ageYears).toBe(18);
    expect(deriveFacts({ applicantId: 't', dateOfBirth: d('2008-07-26') }, TODAY).ageYears).toBe(17);
    // A leap-day birthday has no 29 February in a common year; the anniversary
    // clamps to 28 February, which is when the person turns another year older.
    expect(deriveFacts({ applicantId: 't', dateOfBirth: d('2008-02-29') }, isoDate('2026-02-28')).ageYears).toBe(18);
  });

  it('clips Canadian experience to a closed three-year window and merges concurrent jobs', () => {
    const window = threeYearLookback(TODAY);
    expect(window.start).toBe('2023-07-26');
    expect(window.end).toBe(TODAY);

    const derived = deriveFacts(
      {
        applicantId: 't',
        workExperience: [
          {
            country: CA,
            period: dateRange(d('2026-01-01'), d('2026-06-30')),
            nocTeer: 1,
            authorized: true,
          },
          {
            country: CA,
            period: dateRange(d('2026-01-01'), d('2026-06-30')),
            nocTeer: 2,
            authorized: true,
          },
        ],
      },
      TODAY,
    );
    // Two concurrent roles over the same six months are six months of calendar
    // experience, not twelve.
    expect(derived.canadianSkilledWorkDaysLastThreeYears).toBe(181);
  });

  it('excludes unauthorised and unskilled work from the Canadian count', () => {
    const derived = deriveFacts(
      {
        applicantId: 't',
        workExperience: [
          { country: CA, period: dateRange(d('2026-01-01'), d('2026-06-30')), nocTeer: 1, authorized: false },
          { country: CA, period: dateRange(d('2026-01-01'), d('2026-06-30')), nocTeer: 5, authorized: true },
        ],
      },
      TODAY,
    );
    expect(derived.canadianSkilledWorkDaysLastThreeYears).toBe(0);
  });

  it('refuses to compare income across currencies', () => {
    const matched = deriveFacts(
      {
        applicantId: 't',
        passiveIncome: { minorUnits: 4_000_000, currency: 'EUR', period: 'annual' },
        referenceIndices: { ipremAnnualMinorUnits: 800_000, currency: 'EUR' },
      },
      TODAY,
    );
    expect(matched.passiveIncomeIpremMultiple).toBe(5);

    const mismatched = deriveFacts(
      {
        applicantId: 't',
        passiveIncome: { minorUnits: 4_000_000, currency: 'MXN', period: 'annual' },
        referenceIndices: { ipremAnnualMinorUnits: 800_000, currency: 'EUR' },
      },
      TODAY,
    );
    expect(mismatched.passiveIncomeIpremMultiple).toBeUndefined();
  });

  it('will not annualise an amount with no stated period', () => {
    const derived = deriveFacts(
      {
        applicantId: 't',
        passiveIncome: { minorUnits: 4_000_000, currency: 'EUR' },
        referenceIndices: { ipremAnnualMinorUnits: 800_000, currency: 'EUR' },
      },
      TODAY,
    );
    expect(derived.passiveIncomeIpremMultiple).toBeUndefined();
  });

  it('exposes derived values on the evaluation scope', () => {
    const scope = evaluationScope({ applicantId: 't', legalResidenceDays: 10 }, TODAY);
    expect(scope.derived.asOf).toBe(TODAY);
    expect(resolvePath(scope, scope, 'derived.legalResidenceDaysTotal').value).toBe(10);
  });
});
