import { describe, expect, it } from 'vitest';
import { MeridianError, rangeLengthDays } from '@meridian/core';
import { presenceLedger } from '../src/ledger.js';
import {
  CONTINUITY_POLICIES,
  SPAIN_NATIONALITY_CONTINUITY,
  continuityPolicy,
  continuousResidence,
  firstAbsenceDay,
  longestAbsence,
  residenceYears,
  type ContinuityPolicy,
} from '../src/continuity.js';
import { c, d, shuffle, stayRec } from './helpers.js';

const window5y = { start: d('2020-01-01'), end: d('2024-12-31') };

/** A synthetic policy, used where the real catalog deliberately encodes nothing. */
function synthetic(over: Partial<ContinuityPolicy>): ContinuityPolicy {
  return continuityPolicy({
    id: 'test-policy',
    label: 'Test policy',
    country: c('ES'),
    citation: { ...SPAIN_NATIONALITY_CONTINUITY.citation, id: 'test-citation' },
    ...over,
  });
}

describe('residenceYears', () => {
  it('slices from the start of the period, not from January', () => {
    expect(residenceYears({ start: d('2020-07-01'), end: d('2022-06-30') })).toEqual([
      { start: '2020-07-01', end: '2021-06-30' },
      { start: '2021-07-01', end: '2022-06-30' },
    ]);
  });

  it('tiles the window exactly, with no overlap and no missing day', () => {
    const window = { start: d('2020-01-01'), end: d('2022-12-31') };
    const years = residenceYears(window);
    expect(years).toEqual([
      { start: '2020-01-01', end: '2020-12-31' },
      { start: '2021-01-01', end: '2021-12-31' },
      { start: '2022-01-01', end: '2022-12-31' },
    ]);
    const covered = years.reduce((n, y) => n + rangeLengthDays({ start: d(y.start), end: d(y.end) }), 0);
    expect(covered).toBe(rangeLengthDays(window));
    expect(rangeLengthDays({ start: d('2020-01-01'), end: d('2020-12-31') })).toBe(366);
  });

  it('keeps a partial trailing period rather than dropping it', () => {
    expect(residenceYears({ start: d('2020-01-01'), end: d('2021-06-30') })).toEqual([
      { start: '2020-01-01', end: '2020-12-31' },
      { start: '2021-01-01', end: '2021-06-30' },
    ]);
  });

  it('handles a period beginning on 29 February without looping or skipping', () => {
    const years = residenceYears({ start: d('2020-02-29'), end: d('2022-02-28') });
    expect(years).toEqual([
      { start: '2020-02-29', end: '2021-02-27' },
      { start: '2021-02-28', end: '2022-02-27' },
      { start: '2022-02-28', end: '2022-02-28' },
    ]);
  });

  it('returns a single period for a single day', () => {
    expect(residenceYears({ start: d('2025-01-01'), end: d('2025-01-01') })).toEqual([
      { start: '2025-01-01', end: '2025-01-01' },
    ]);
  });
});

describe('deriving absences', () => {
  it('treats gaps in the record and recorded travel identically', () => {
    const silent = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2021-06-30'),
      stayRec('b', 'ES', '2021-12-28', '2024-12-31'),
    ]);
    const explicit = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2021-06-30'),
      stayRec('away', 'MX', '2021-07-01', '2021-12-27'),
      stayRec('b', 'ES', '2021-12-28', '2024-12-31'),
    ]);
    const one = continuousResidence(silent, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY);
    const two = continuousResidence(explicit, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY);
    expect(one.absences).toEqual(two.absences);
    expect(one.absences).toEqual([{ start: '2021-07-01', end: '2021-12-27' }]);
    expect(one.totalAbsenceDays).toBe(180);
  });

  it('treats an empty record as absence throughout, which is the safe direction', () => {
    const assessment = continuousResidence(
      presenceLedger([]),
      c('ES'),
      window5y,
      SPAIN_NATIONALITY_CONTINUITY,
    );
    expect(assessment.presenceDays).toBe(0);
    expect(assessment.absences).toEqual([{ start: '2020-01-01', end: '2024-12-31' }]);
    expect(assessment.satisfied).toBe(false);
  });

  it('reports no absence at all when presence covers the window', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2020-01-01', '2024-12-31')]);
    const assessment = continuousResidence(ledger, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY);
    expect(assessment.absences).toEqual([]);
    expect(assessment.totalAbsenceDays).toBe(0);
    expect(assessment.longestAbsenceDays).toBe(0);
    expect(assessment.satisfied).toBe(true);
    expect(longestAbsence(ledger, c('ES'), window5y)).toBeNull();
    expect(firstAbsenceDay(ledger, c('ES'), window5y)).toBeNull();
  });

  it('stitches back-to-back stays in the same country into one presence', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2022-06-30'),
      stayRec('b', 'ES', '2022-07-01', '2024-12-31'),
    ]);
    expect(
      continuousResidence(ledger, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY).absences,
    ).toEqual([]);
  });
});

describe('single-absence limb', () => {
  it('permits an absence of exactly the limit and breaches one day past it', () => {
    const exact = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2021-06-30'),
      stayRec('b', 'ES', '2021-12-28', '2024-12-31'),
    ]);
    const over = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2021-06-30'),
      stayRec('b', 'ES', '2021-12-29', '2024-12-31'),
    ]);
    const okay = continuousResidence(exact, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY);
    expect(okay.longestAbsenceDays).toBe(180);
    expect(okay.breaches).toEqual([]);
    expect(okay.satisfied).toBe(true);

    const bad = continuousResidence(over, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY);
    expect(bad.longestAbsenceDays).toBe(181);
    expect(bad.breaches).toHaveLength(1);
    expect(bad.breaches[0]?.limb).toBe('single_absence');
    expect(bad.breaches[0]?.days).toBe(181);
    expect(bad.breaches[0]?.limitDays).toBe(180);
    expect(bad.breaches[0]?.range).toEqual({ start: '2021-07-01', end: '2021-12-28' });
  });

  it('reports every breaching absence, not just the longest', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2020-03-31'),
      stayRec('b', 'ES', '2021-01-01', '2021-03-31'),
      stayRec('e', 'ES', '2022-01-01', '2024-12-31'),
    ]);
    const assessment = continuousResidence(ledger, c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY);
    expect(assessment.breaches.filter((b) => b.limb === 'single_absence')).toHaveLength(2);
  });
});

describe('cumulative limbs', () => {
  const perYear = synthetic({ maxCumulativeAbsenceDaysPerYear: 90 });

  it('adds absences within one residence year', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2020-02-29'),
      stayRec('b', 'ES', '2020-04-30', '2020-07-31'),
      stayRec('e', 'ES', '2020-09-30', '2024-12-31'),
    ]);
    const assessment = continuousResidence(ledger, c('ES'), window5y, perYear);
    const breach = assessment.breaches.find((b) => b.limb === 'cumulative_per_year');
    expect(breach?.days).toBe(120);
    expect(breach?.range).toEqual({ start: '2020-01-01', end: '2020-12-31' });
    expect(breach?.contributingAbsences).toHaveLength(2);
  });

  it('does not add absences that fall in different residence years', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2020-07-31'),
      stayRec('b', 'ES', '2020-09-30', '2021-02-28'),
      stayRec('e', 'ES', '2021-04-30', '2024-12-31'),
    ]);
    const assessment = continuousResidence(ledger, c('ES'), window5y, perYear);
    expect(assessment.totalAbsenceDays).toBe(120);
    expect(assessment.breaches.filter((b) => b.limb === 'cumulative_per_year')).toEqual([]);
  });

  it('catches an absence that a calendar-year slicing would have split in half', () => {
    // Residence begins on 1 July, so the residence year runs to 30 June and a
    // 120-day absence over new year sits entirely inside it. Slicing on the
    // calendar would have scored 60 days in each of two years and passed.
    const window = { start: d('2020-07-01'), end: d('2022-06-30') };
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-07-01', '2020-11-01'),
      stayRec('b', 'ES', '2021-03-02', '2022-06-30'),
    ]);
    const assessment = continuousResidence(ledger, c('ES'), window, perYear);
    const breach = assessment.breaches.find((b) => b.limb === 'cumulative_per_year');
    expect(assessment.absences).toEqual([{ start: '2020-11-02', end: '2021-03-01' }]);
    expect(breach?.days).toBe(120);
    expect(breach?.range).toEqual({ start: '2020-07-01', end: '2021-06-30' });
  });

  it('applies a total limb across the whole period', () => {
    const total = synthetic({ maxCumulativeAbsenceDaysTotal: 100 });
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2020-07-31'),
      stayRec('b', 'ES', '2020-09-30', '2021-02-28'),
      stayRec('e', 'ES', '2021-04-30', '2024-12-31'),
    ]);
    const assessment = continuousResidence(ledger, c('ES'), window5y, total);
    const breach = assessment.breaches.find((b) => b.limb === 'cumulative_total');
    expect(breach?.days).toBe(120);
    expect(breach?.limitDays).toBe(100);
    expect(breach?.range).toEqual(window5y);
  });

  it('does not test a limb the policy leaves undefined', () => {
    const nothing = synthetic({});
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2020-01-01', '2020-01-31'),
      stayRec('b', 'ES', '2024-12-01', '2024-12-31'),
    ]);
    const assessment = continuousResidence(ledger, c('ES'), window5y, nothing);
    expect(assessment.totalAbsenceDays).toBeGreaterThan(1700);
    expect(assessment.breaches).toEqual([]);
    expect(assessment.satisfied).toBe(true);
  });
});

describe('guards and invariants', () => {
  it('refuses to apply a policy written for another country', () => {
    const ledger = presenceLedger([stayRec('a', 'MX', '2020-01-01', '2024-12-31')]);
    expect(() =>
      continuousResidence(ledger, c('MX'), window5y, SPAIN_NATIONALITY_CONTINUITY),
    ).toThrow(MeridianError);
  });

  it('rejects a negative or fractional limit', () => {
    expect(() => synthetic({ maxSingleAbsenceDays: -1 })).toThrow(MeridianError);
    expect(() => synthetic({ maxCumulativeAbsenceDaysTotal: 10.5 })).toThrow(MeridianError);
  });

  it('rejects a policy with no citation id', () => {
    expect(() =>
      synthetic({ citation: { ...SPAIN_NATIONALITY_CONTINUITY.citation, id: '' } }),
    ).toThrow(MeridianError);
  });

  it('is independent of the order stays were supplied in', () => {
    const stays = [
      stayRec('a', 'ES', '2020-01-01', '2021-06-30'),
      stayRec('away', 'MX', '2021-07-01', '2021-12-27'),
      stayRec('b', 'ES', '2021-12-28', '2023-05-31'),
      stayRec('e', 'ES', '2023-09-01', '2024-12-31'),
    ];
    expect(
      continuousResidence(presenceLedger(stays), c('ES'), window5y, SPAIN_NATIONALITY_CONTINUITY),
    ).toEqual(
      continuousResidence(
        presenceLedger(shuffle(stays, 5)),
        c('ES'),
        window5y,
        SPAIN_NATIONALITY_CONTINUITY,
      ),
    );
  });
});

describe('the Spanish policy says what it is', () => {
  it('is marked discretionary, because the Civil Code sets no numeric limit', () => {
    expect(SPAIN_NATIONALITY_CONTINUITY.citation.discretionary).toBe(true);
    expect(SPAIN_NATIONALITY_CONTINUITY.citation.provision).toBe('art. 22.3');
    const note = SPAIN_NATIONALITY_CONTINUITY.citation.note ?? '';
    expect(note).toContain('sets no numeric absence limit');
    expect(note.toLowerCase()).toContain('counsel must verify');
  });

  it('encodes no cumulative limits, because none of them is settled', () => {
    expect(SPAIN_NATIONALITY_CONTINUITY.maxCumulativeAbsenceDaysPerYear).toBeUndefined();
    expect(SPAIN_NATIONALITY_CONTINUITY.maxCumulativeAbsenceDaysTotal).toBeUndefined();
  });

  it('is the only policy in the catalog', () => {
    expect(CONTINUITY_POLICIES).toEqual([SPAIN_NATIONALITY_CONTINUITY]);
  });
});
