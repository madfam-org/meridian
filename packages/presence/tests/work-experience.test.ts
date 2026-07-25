import { describe, expect, it } from 'vitest';
import { MeridianError, addDays, rangeLengthDays } from '@meridian/core';
import {
  CEC_REQUIRED_HOURS,
  accumulateQualifyingWork,
  evaluateCanadianExperienceClass,
  type WorkPeriod,
} from '../src/work-experience.js';
import { c, d } from './helpers.js';

const APPLIED = d('2026-07-25');

function work(
  id: string,
  start: string,
  end: string,
  hoursPerWeek: number,
  over: Partial<WorkPeriod> = {},
): WorkPeriod {
  return {
    id,
    country: c('CA'),
    range: { start: d(start), end: d(end) },
    hoursPerWeek,
    qualifying: true,
    ...over,
  };
}

/** A period of `days` days ending on the application date. */
function endingAtApplication(id: string, days: number, hoursPerWeek: number): WorkPeriod {
  return work(id, addDays(APPLIED, -(days - 1)), APPLIED, hoursPerWeek);
}

describe('the lookback window', () => {
  it('is three calendar years ending on the application date', () => {
    const result = evaluateCanadianExperienceClass([], APPLIED);
    expect(result.window).toEqual({ start: '2023-07-26', end: '2026-07-25' });
    expect(rangeLengthDays({ start: d(result.window.start), end: d(result.window.end) })).toBe(1096);
  });

  it('shifts by exactly one day when the application date is excluded', () => {
    const result = evaluateCanadianExperienceClass([], APPLIED, { includeApplicationDate: false });
    expect(result.window).toEqual({ start: '2023-07-25', end: '2026-07-24' });
  });

  it('drops a period that ends the day before the window opens', () => {
    const stale = work('old', '2023-01-01', '2023-07-25', 30);
    const result = evaluateCanadianExperienceClass([stale], APPLIED);
    expect(result.accumulation.qualifyingDays).toBe(0);
    expect(result.accumulation.excludedPeriodIds).toEqual(['old']);
  });

  it('keeps the single day of a period that just reaches the window', () => {
    const edge = work('edge', '2023-01-01', '2023-07-26', 30);
    const result = evaluateCanadianExperienceClass([edge], APPLIED);
    expect(result.accumulation.qualifyingDays).toBe(1);
    expect(result.accumulation.contributions[0]?.countedRange).toEqual({
      start: '2023-07-26',
      end: '2023-07-26',
    });
  });
});

describe('the 1,560-hour boundary', () => {
  it('is reached at exactly 364 days of full-time work and missed at 363', () => {
    const met = evaluateCanadianExperienceClass([endingAtApplication('a', 364, 30)], APPLIED);
    expect(met.accumulation.cappedHours).toBe(1560);
    expect(met.meetsHoursRequirement).toBe(true);
    expect(met.hoursShort).toBe(0);

    const missed = evaluateCanadianExperienceClass([endingAtApplication('a', 363, 30)], APPLIED);
    expect(missed.accumulation.cappedHours).toBe(1555.71);
    expect(missed.meetsHoursRequirement).toBe(false);
    expect(missed.hoursShort).toBe(4.29);
  });

  it('lets part-time work reach the same total over twice the time', () => {
    const result = evaluateCanadianExperienceClass([endingAtApplication('pt', 728, 15)], APPLIED);
    expect(result.accumulation.cappedHours).toBe(CEC_REQUIRED_HOURS);
    expect(result.meetsHoursRequirement).toBe(true);
    expect(result.accumulation.qualifyingDays).toBe(728);
  });

  it('does not let extra hours substitute for elapsed time', () => {
    // Sixty hours a week for half a year is not a year of experience.
    const result = evaluateCanadianExperienceClass([endingAtApplication('crunch', 182, 60)], APPLIED);
    expect(result.accumulation.uncappedHours).toBe(1560);
    expect(result.accumulation.cappedHours).toBe(780);
    expect(result.meetsHoursRequirement).toBe(false);
  });
});

describe('concurrent and overlapping periods', () => {
  it('caps the aggregate across jobs, not each job separately', () => {
    const a = endingAtApplication('a', 364, 20);
    const b = endingAtApplication('b', 364, 20);
    const result = evaluateCanadianExperienceClass([a, b], APPLIED);
    expect(result.accumulation.uncappedHours).toBe(2080);
    expect(result.accumulation.cappedHours).toBe(1560);
    expect(result.accumulation.qualifyingDays).toBe(364);
  });

  it('counts a day once however many periods cover it', () => {
    const periods = [work('a', '2025-01-01', '2025-06-30', 30), work('b', '2025-04-01', '2025-09-30', 30)];
    const result = accumulateQualifyingWork(periods, { start: d('2024-01-01'), end: d('2026-01-01') });
    expect(result.qualifyingRanges).toEqual([{ start: '2025-01-01', end: '2025-09-30' }]);
    expect(result.qualifyingDays).toBe(273);
    expect(result.cappedHours).toBe(1170);
    // Uncapped, the overlap is double-counted — which is precisely the number
    // the cap exists to stop anyone filing.
    expect(result.uncappedHours).toBe(1560);
  });

  it('merges adjacent periods into one run of days', () => {
    const periods = [work('a', '2025-01-01', '2025-03-31', 30), work('b', '2025-04-01', '2025-06-30', 30)];
    const result = accumulateQualifyingWork(periods, { start: d('2024-01-01'), end: d('2026-01-01') });
    expect(result.qualifyingRanges).toEqual([{ start: '2025-01-01', end: '2025-06-30' }]);
    expect(result.qualifyingDays).toBe(181);
  });
});

describe('exclusions', () => {
  it('drops periods the caller has characterised as non-qualifying', () => {
    const periods = [
      endingAtApplication('good', 364, 30),
      work('study', '2025-01-01', '2025-12-31', 30, { qualifying: false }),
    ];
    const result = evaluateCanadianExperienceClass(periods, APPLIED);
    expect(result.accumulation.cappedHours).toBe(1560);
    expect(result.accumulation.excludedPeriodIds).toEqual(['study']);
  });

  it('drops work outside Canada and says so instead of losing it silently', () => {
    const periods = [
      endingAtApplication('ca', 364, 30),
      work('mx', '2025-01-01', '2025-12-31', 40, { country: c('MX') }),
    ];
    const result = evaluateCanadianExperienceClass(periods, APPLIED);
    expect(result.nonCanadianPeriodIds).toEqual(['mx']);
    expect(result.accumulation.cappedHours).toBe(1560);
  });

  it('drops a zero-hour period', () => {
    const result = evaluateCanadianExperienceClass([work('unpaid', '2025-01-01', '2025-12-31', 0)], APPLIED);
    expect(result.accumulation.qualifyingDays).toBe(0);
    expect(result.accumulation.excludedPeriodIds).toEqual(['unpaid']);
  });

  it('handles no periods at all', () => {
    const result = evaluateCanadianExperienceClass([], APPLIED);
    expect(result.accumulation.qualifyingDays).toBe(0);
    expect(result.accumulation.cappedHours).toBe(0);
    expect(result.hoursShort).toBe(CEC_REQUIRED_HOURS);
    expect(result.meetsHoursRequirement).toBe(false);
  });
});

describe('calendar edges and guards', () => {
  it('counts the leap day as a worked day', () => {
    const result = accumulateQualifyingWork([work('a', '2024-02-28', '2024-03-01', 30)], {
      start: d('2024-01-01'),
      end: d('2024-12-31'),
    });
    expect(result.qualifyingDays).toBe(3);
  });

  it('counts a single-day engagement as one day', () => {
    const result = accumulateQualifyingWork([work('a', '2025-05-05', '2025-05-05', 30)], {
      start: d('2025-01-01'),
      end: d('2025-12-31'),
    });
    expect(result.qualifyingDays).toBe(1);
    expect(result.cappedHours).toBe(4.29);
  });

  it('honours a caller-supplied weekly cap', () => {
    const result = accumulateQualifyingWork(
      [work('a', '2025-01-01', '2025-01-07', 60)],
      { start: d('2025-01-01'), end: d('2025-12-31') },
      { weeklyHoursCap: 40 },
    );
    expect(result.cappedHours).toBe(40);
    expect(result.uncappedHours).toBe(60);
  });

  it('rejects duplicate period ids', () => {
    const periods = [work('a', '2025-01-01', '2025-06-30', 30), work('a', '2025-07-01', '2025-12-31', 30)];
    expect(() =>
      accumulateQualifyingWork(periods, { start: d('2025-01-01'), end: d('2025-12-31') }),
    ).toThrow(MeridianError);
  });

  it('rejects impossible hours', () => {
    expect(() =>
      accumulateQualifyingWork([work('a', '2025-01-01', '2025-06-30', -1)], {
        start: d('2025-01-01'),
        end: d('2025-12-31'),
      }),
    ).toThrow(MeridianError);
    expect(() =>
      accumulateQualifyingWork(
        [work('a', '2025-01-01', '2025-06-30', 30)],
        { start: d('2025-01-01'), end: d('2025-12-31') },
        { weeklyHoursCap: 0 },
      ),
    ).toThrow(MeridianError);
  });

  it('refuses an absurd lookback rather than scanning forever', () => {
    expect(() =>
      accumulateQualifyingWork([], { start: d('1900-01-01'), end: d('2100-01-01') }),
    ).toThrow(MeridianError);
  });

  it('is independent of the order periods were supplied in', () => {
    const periods = [
      work('a', '2024-01-01', '2024-06-30', 30),
      work('b', '2024-06-01', '2024-12-31', 20),
      work('e', '2025-03-01', '2025-09-30', 15),
    ];
    const window = { start: d('2023-07-26'), end: d('2026-07-25') };
    expect(accumulateQualifyingWork(periods, window).cappedHours).toBe(
      accumulateQualifyingWork([...periods].reverse(), window).cappedHours,
    );
    expect(accumulateQualifyingWork(periods, window).qualifyingRanges).toEqual(
      accumulateQualifyingWork([...periods].reverse(), window).qualifyingRanges,
    );
  });
});
