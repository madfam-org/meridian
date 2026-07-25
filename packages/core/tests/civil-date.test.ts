import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  calendarYearRange,
  compareDates,
  complementRanges,
  daysInMonth,
  diffDays,
  eachDay,
  fromDayNumber,
  fromParts,
  intersectRanges,
  InvalidDateError,
  isIsoDate,
  isLeapYear,
  isoDate,
  lookbackWindow,
  mergeRanges,
  overlapDays,
  rangeContains,
  rangeLengthDays,
  toDayNumber,
  totalDays,
  type DayNumber,
  type IsoDate,
} from '../src/civil-date.js';

const d = (s: string): IsoDate => isoDate(s);

describe('isoDate', () => {
  it('accepts valid dates', () => {
    expect(isoDate('2025-01-01')).toBe('2025-01-01');
    expect(isoDate('2024-02-29')).toBe('2024-02-29');
  });

  it('rejects dates that do not exist instead of rolling over', () => {
    expect(() => isoDate('2025-02-29')).toThrow(InvalidDateError);
    expect(() => isoDate('2025-04-31')).toThrow(InvalidDateError);
    expect(() => isoDate('2025-13-01')).toThrow(InvalidDateError);
    expect(() => isoDate('2025-00-10')).toThrow(InvalidDateError);
  });

  it('rejects malformed input', () => {
    expect(() => isoDate('2025-1-1')).toThrow(InvalidDateError);
    expect(() => isoDate('01/01/2025')).toThrow(InvalidDateError);
    expect(() => isoDate('')).toThrow(InvalidDateError);
  });

  it('isIsoDate is a total predicate', () => {
    expect(isIsoDate('2025-02-28')).toBe(true);
    expect(isIsoDate('2025-02-30')).toBe(false);
    expect(isIsoDate(20250228)).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe('leap years', () => {
  it('follows the Gregorian rule including the century exceptions', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
  });
});

describe('day numbers', () => {
  it('anchors the epoch at 1970-01-01', () => {
    expect(toDayNumber(d('1970-01-01'))).toBe(0);
    expect(toDayNumber(d('1970-01-02'))).toBe(1);
    expect(toDayNumber(d('1969-12-31'))).toBe(-1);
  });

  it('round-trips across a wide range', () => {
    for (let n = -40000; n <= 40000; n += 137) {
      expect(toDayNumber(fromDayNumber(n as DayNumber))).toBe(n);
    }
  });

  it('agrees with UTC Date over a decade, without ever using Date internally', () => {
    for (let n = 16000; n < 20000; n += 7) {
      const expected = new Date(n * 86400000).toISOString().slice(0, 10);
      expect(fromDayNumber(n as DayNumber)).toBe(expected);
    }
  });
});

describe('addDays / diffDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays(d('2025-01-31'), 1)).toBe('2025-02-01');
    expect(addDays(d('2024-02-28'), 1)).toBe('2024-02-29');
    expect(addDays(d('2025-02-28'), 1)).toBe('2025-03-01');
    expect(addDays(d('2025-12-31'), 1)).toBe('2026-01-01');
    expect(addDays(d('2025-01-01'), -1)).toBe('2024-12-31');
  });

  it('is exact over a leap year', () => {
    expect(diffDays(d('2024-01-01'), d('2025-01-01'))).toBe(366);
    expect(diffDays(d('2025-01-01'), d('2026-01-01'))).toBe(365);
  });

  it('is antisymmetric', () => {
    expect(diffDays(d('2025-03-01'), d('2025-01-01'))).toBe(-diffDays(d('2025-01-01'), d('2025-03-01')));
  });

  it('rejects fractional shifts', () => {
    expect(() => addDays(d('2025-01-01'), 1.5)).toThrow(RangeError);
  });
});

describe('addMonths', () => {
  it('clamps to the end of a shorter target month', () => {
    expect(addMonths(d('2025-01-31'), 1)).toBe('2025-02-28');
    expect(addMonths(d('2024-01-31'), 1)).toBe('2024-02-29');
    expect(addMonths(d('2025-03-31'), -1)).toBe('2025-02-28');
    expect(addMonths(d('2025-05-31'), 1)).toBe('2025-06-30');
  });

  it('handles year rollover in both directions', () => {
    expect(addMonths(d('2025-11-15'), 3)).toBe('2026-02-15');
    expect(addMonths(d('2025-02-15'), -3)).toBe('2024-11-15');
    expect(addYears(d('2024-02-29'), 1)).toBe('2025-02-28');
  });
});

describe('ranges', () => {
  it('counts a single-day range as one day, not zero', () => {
    expect(rangeLengthDays({ start: d('2025-01-01'), end: d('2025-01-01') })).toBe(1);
  });

  it('is inclusive at both ends', () => {
    const r = { start: d('2025-01-01'), end: d('2025-01-10') };
    expect(rangeLengthDays(r)).toBe(10);
    expect(rangeContains(r, d('2025-01-01'))).toBe(true);
    expect(rangeContains(r, d('2025-01-10'))).toBe(true);
    expect(rangeContains(r, d('2024-12-31'))).toBe(false);
    expect(rangeContains(r, d('2025-01-11'))).toBe(false);
  });

  it('intersects and returns null when disjoint', () => {
    const a = { start: d('2025-01-01'), end: d('2025-01-31') };
    const b = { start: d('2025-01-20'), end: d('2025-02-10') };
    expect(intersectRanges(a, b)).toEqual({ start: '2025-01-20', end: '2025-01-31' });
    expect(overlapDays(a, b)).toBe(12);
    expect(intersectRanges(a, { start: d('2025-03-01'), end: d('2025-03-05') })).toBeNull();
  });

  it('treats touching ranges as overlapping by one day', () => {
    const a = { start: d('2025-01-01'), end: d('2025-01-10') };
    const b = { start: d('2025-01-10'), end: d('2025-01-20') };
    expect(overlapDays(a, b)).toBe(1);
  });
});

describe('mergeRanges', () => {
  it('merges overlapping ranges', () => {
    expect(
      mergeRanges([
        { start: d('2025-01-01'), end: d('2025-01-10') },
        { start: d('2025-01-05'), end: d('2025-01-20') },
      ]),
    ).toEqual([{ start: '2025-01-01', end: '2025-01-20' }]);
  });

  it('merges adjacent ranges so a seam is not double-counted', () => {
    expect(
      mergeRanges([
        { start: d('2025-01-01'), end: d('2025-01-10') },
        { start: d('2025-01-11'), end: d('2025-01-20') },
      ]),
    ).toEqual([{ start: '2025-01-01', end: '2025-01-20' }]);
    expect(
      totalDays([
        { start: d('2025-01-01'), end: d('2025-01-10') },
        { start: d('2025-01-11'), end: d('2025-01-20') },
      ]),
    ).toBe(20);
  });

  it('keeps a one-day gap separate', () => {
    const merged = mergeRanges([
      { start: d('2025-01-01'), end: d('2025-01-10') },
      { start: d('2025-01-12'), end: d('2025-01-20') },
    ]);
    expect(merged).toHaveLength(2);
  });

  it('does not double-count overlapping stays', () => {
    expect(
      totalDays([
        { start: d('2025-01-01'), end: d('2025-01-31') },
        { start: d('2025-01-15'), end: d('2025-02-14') },
      ]),
    ).toBe(45);
  });

  it('is order-independent', () => {
    const rs = [
      { start: d('2025-03-01'), end: d('2025-03-10') },
      { start: d('2025-01-01'), end: d('2025-01-10') },
      { start: d('2025-02-01'), end: d('2025-02-10') },
    ];
    expect(mergeRanges(rs)).toEqual(mergeRanges([...rs].reverse()));
  });

  it('returns an empty list for no input', () => {
    expect(mergeRanges([])).toEqual([]);
    expect(totalDays([])).toBe(0);
  });
});

describe('complementRanges', () => {
  it('finds the absences between stays', () => {
    const year = calendarYearRange(2025);
    const stays = [
      { start: d('2025-01-01'), end: d('2025-03-31') },
      { start: d('2025-07-01'), end: d('2025-12-31') },
    ];
    expect(complementRanges(stays, year)).toEqual([{ start: '2025-04-01', end: '2025-06-30' }]);
  });

  it('reports leading and trailing gaps', () => {
    const gaps = complementRanges([{ start: d('2025-06-01'), end: d('2025-06-30') }], calendarYearRange(2025));
    expect(gaps).toEqual([
      { start: '2025-01-01', end: '2025-05-31' },
      { start: '2025-07-01', end: '2025-12-31' },
    ]);
  });

  it('returns the whole window when there are no stays', () => {
    expect(complementRanges([], calendarYearRange(2025))).toEqual([
      { start: '2025-01-01', end: '2025-12-31' },
    ]);
  });

  it('returns nothing when the window is fully covered', () => {
    expect(complementRanges([calendarYearRange(2025)], calendarYearRange(2025))).toEqual([]);
  });
});

describe('lookbackWindow', () => {
  it('includes the endpoint in the count', () => {
    const w = lookbackWindow(d('2025-06-30'), 180);
    expect(rangeLengthDays(w)).toBe(180);
    expect(w.end).toBe('2025-06-30');
    expect(w.start).toBe('2025-01-02');
  });

  it('rejects non-positive windows', () => {
    expect(() => lookbackWindow(d('2025-01-01'), 0)).toThrow(RangeError);
  });
});

describe('misc', () => {
  it('compareDates sorts ascending', () => {
    const xs = [d('2025-03-01'), d('2025-01-01'), d('2025-02-01')].sort(compareDates);
    expect(xs).toEqual(['2025-01-01', '2025-02-01', '2025-03-01']);
  });

  it('calendarYearRange spans a full year', () => {
    expect(rangeLengthDays(calendarYearRange(2024))).toBe(366);
    expect(rangeLengthDays(calendarYearRange(2025))).toBe(365);
  });

  it('eachDay enumerates inclusively', () => {
    expect(eachDay({ start: d('2025-01-01'), end: d('2025-01-03') })).toEqual([
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
    ]);
  });

  it('fromParts validates', () => {
    expect(fromParts(2025, 2, 28)).toBe('2025-02-28');
    expect(() => fromParts(2025, 2, 30)).toThrow(InvalidDateError);
  });
});
