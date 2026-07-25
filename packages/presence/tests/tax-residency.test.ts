import { describe, expect, it } from 'vitest';
import { MeridianError, addDays, rangeLengthDays } from '@meridian/core';
import { presenceLedger } from '../src/ledger.js';
import {
  CANADA_SOJOURNER_DAY_COUNT,
  SPAIN_IRPF_DAY_COUNT,
  dayCountThreshold,
  daysPresentInCalendarYear,
  evaluateDayCountThreshold,
  requiredDays,
  windowForThreshold,
  type DayCountThreshold,
} from '../src/tax-residency.js';
import { c, d, shuffle, stayRec } from './helpers.js';

describe('daysPresentInCalendarYear', () => {
  it('splits a stay that crosses new year across both years', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2024-12-20', '2025-01-10')]);
    expect(daysPresentInCalendarYear(ledger, c('ES'), 2024)).toBe(12);
    expect(daysPresentInCalendarYear(ledger, c('ES'), 2025)).toBe(10);
  });

  it('counts the leap day', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2024-01-01', '2024-12-31')]);
    expect(daysPresentInCalendarYear(ledger, c('ES'), 2024)).toBe(366);
  });

  it('does not double-count overlapping records', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-06-30'),
      stayRec('b', 'ES', '2025-06-01', '2025-07-31'),
    ]);
    expect(daysPresentInCalendarYear(ledger, c('ES'), 2025)).toBe(212);
  });

  it('ignores presence in other countries', () => {
    const ledger = presenceLedger([stayRec('a', 'MX', '2025-01-01', '2025-12-31')]);
    expect(daysPresentInCalendarYear(ledger, c('ES'), 2025)).toBe(0);
  });

  it('rejects a non-integer year rather than producing an odd window', () => {
    expect(() => daysPresentInCalendarYear(presenceLedger([]), c('ES'), 2025.5)).toThrow(MeridianError);
  });
});

describe('windows', () => {
  it('draws a calendar year from the reference date', () => {
    expect(windowForThreshold(SPAIN_IRPF_DAY_COUNT, d('2025-07-04'))).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    });
  });

  it('draws twelve calendar months for a rolling basis, stretching over a leap day', () => {
    const rolling = dayCountThreshold({
      ...SPAIN_IRPF_DAY_COUNT,
      id: 'test-rolling',
      basis: 'rolling_12_months',
    });
    const leap = windowForThreshold(rolling, d('2024-03-01'));
    expect(leap).toEqual({ start: '2023-03-02', end: '2024-03-01' });
    expect(rangeLengthDays({ start: d(leap.start), end: d(leap.end) })).toBe(366);

    const common = windowForThreshold(rolling, d('2025-03-01'));
    expect(common).toEqual({ start: '2024-03-02', end: '2025-03-01' });
    expect(rangeLengthDays({ start: d(common.start), end: d(common.end) })).toBe(365);
  });
});

describe('the "more than" / "at least" distinction', () => {
  it('encodes the statutory figure, not the first qualifying count', () => {
    expect(SPAIN_IRPF_DAY_COUNT.thresholdDays).toBe(183);
    expect(requiredDays(SPAIN_IRPF_DAY_COUNT)).toBe(184);
    expect(CANADA_SOJOURNER_DAY_COUNT.thresholdDays).toBe(183);
    expect(requiredDays(CANADA_SOJOURNER_DAY_COUNT)).toBe(183);
  });

  it('leaves Spain unmet at exactly 183 days and met at 184', () => {
    const start = d('2025-01-01');
    const at183 = presenceLedger([stayRec('a', 'ES', '2025-01-01', addDays(start, 182))]);
    const at184 = presenceLedger([stayRec('a', 'ES', '2025-01-01', addDays(start, 183))]);

    const under = evaluateDayCountThreshold(at183, SPAIN_IRPF_DAY_COUNT, d('2025-12-31'));
    expect(under.daysPresent).toBe(183);
    expect(under.met).toBe(false);
    expect(under.marginDays).toBe(1);
    expect(under.metOn).toBeNull();

    const over = evaluateDayCountThreshold(at184, SPAIN_IRPF_DAY_COUNT, d('2025-12-31'));
    expect(over.daysPresent).toBe(184);
    expect(over.met).toBe(true);
    expect(over.marginDays).toBe(0);
    expect(over.metOn).toBe(addDays(start, 183));
  });

  it('meets the Canadian rule at exactly 183 days', () => {
    const at183 = presenceLedger([stayRec('a', 'CA', '2025-01-01', addDays(d('2025-01-01'), 182))]);
    const result = evaluateDayCountThreshold(at183, CANADA_SOJOURNER_DAY_COUNT, d('2025-12-31'));
    expect(result.daysPresent).toBe(183);
    expect(result.met).toBe(true);
    expect(result.metOn).toBe('2025-07-02');
  });
});

describe('metOn across broken presence', () => {
  it('lands on the day the running total first reaches the requirement', () => {
    // 100 days, a gap, then a long second stay. The 184th day falls 84 days
    // into the second stay.
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-04-10'), // 100 days
      stayRec('b', 'ES', '2025-06-01', '2025-12-31'), // 214 days
    ]);
    const result = evaluateDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-12-31'));
    expect(result.daysPresent).toBe(314);
    expect(result.met).toBe(true);
    expect(result.metOn).toBe(addDays(d('2025-06-01'), 83));
  });

  it('exposes the counted ranges so the arithmetic can be checked by hand', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2024-12-01', '2025-01-31'),
      stayRec('b', 'ES', '2025-03-01', '2025-03-10'),
    ]);
    const result = evaluateDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-06-30'));
    expect(result.countedRanges).toEqual([
      { start: '2025-01-01', end: '2025-01-31' },
      { start: '2025-03-01', end: '2025-03-10' },
    ]);
    expect(result.daysPresent).toBe(41);
  });
});

describe('projection', () => {
  it('projects the crossing date from unbroken presence after the reference date', () => {
    // 100 days to 2025-04-10; 84 more days of presence reach 184.
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-04-10')]);
    const result = evaluateDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-04-10'));
    expect(result.daysPresent).toBe(100);
    expect(result.met).toBe(false);
    expect(result.projectedCrossingOn).toBe('2025-07-03');
    expect(result.projectedCrossingOn).toBe(addDays(d('2025-04-10'), 84));
  });

  it('does not double-count a trip already booked after the reference date', () => {
    const base = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-04-10')]);
    const withPlan = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-04-10'),
      stayRec('plan', 'ES', '2025-08-01', '2025-08-20'),
    ]);
    const from = d('2025-04-10');
    expect(evaluateDayCountThreshold(withPlan, SPAIN_IRPF_DAY_COUNT, from).projectedCrossingOn).toBe(
      evaluateDayCountThreshold(base, SPAIN_IRPF_DAY_COUNT, from).projectedCrossingOn,
    );
  });

  it('reports no projection once the threshold is already met', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-12-31')]);
    const result = evaluateDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-12-31'));
    expect(result.met).toBe(true);
    expect(result.projectedCrossingOn).toBeNull();
  });

  it('rolls into the following calendar year when this one can no longer be crossed', () => {
    // Arriving on 1 December leaves 31 days in the year: nowhere near 184.
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-12-01', '2025-12-15')]);
    const result = evaluateDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-12-15'));
    expect(result.met).toBe(false);
    // The 2026 count restarts at zero on 1 January, so the 184th day of
    // continuous presence in 2026 is 3 July.
    expect(result.projectedCrossingOn).toBe('2026-07-03');
  });

  it('returns null when the horizon is too short to reach the threshold', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-01-10')]);
    const result = evaluateDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-01-10'), {
      projectionHorizonDays: 30,
    });
    expect(result.projectedCrossingOn).toBeNull();
  });

  it('projects against a sliding window on a rolling basis', () => {
    const rolling = dayCountThreshold({
      ...SPAIN_IRPF_DAY_COUNT,
      id: 'test-rolling',
      basis: 'rolling_12_months',
      comparison: 'at_least',
      thresholdDays: 100,
    });
    // 60 days ending on the reference date; 40 further days reach 100, and none
    // of the recorded days have aged out of a twelve-month window by then.
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-01')]);
    const result = evaluateDayCountThreshold(ledger, rolling, d('2025-03-01'));
    expect(result.daysPresent).toBe(60);
    expect(result.projectedCrossingOn).toBe(addDays(d('2025-03-01'), 40));
  });

  it('accounts for days dropping out of a rolling window as it slides', () => {
    const rolling = dayCountThreshold({
      ...SPAIN_IRPF_DAY_COUNT,
      id: 'test-rolling-old',
      basis: 'rolling_12_months',
      comparison: 'at_least',
      thresholdDays: 100,
    });
    // 60 days a year ago: by the time new presence accumulates they are leaving
    // the window, so the crossing is later than a naive 40 further days.
    const ledger = presenceLedger([stayRec('a', 'ES', '2024-03-15', '2024-05-13')]);
    const result = evaluateDayCountThreshold(ledger, rolling, d('2025-03-01'));
    expect(result.daysPresent).toBe(60);
    const naive = addDays(d('2025-03-01'), 40);
    expect(result.projectedCrossingOn).not.toBeNull();
    if (result.projectedCrossingOn !== null) {
      expect(result.projectedCrossingOn > naive).toBe(true);
    }
  });

  it('rejects a negative horizon', () => {
    expect(() =>
      evaluateDayCountThreshold(presenceLedger([]), SPAIN_IRPF_DAY_COUNT, d('2025-01-01'), {
        projectionHorizonDays: -1,
      }),
    ).toThrow(MeridianError);
  });
});

describe('robustness', () => {
  it('handles an empty ledger without special-casing', () => {
    const result = evaluateDayCountThreshold(presenceLedger([]), SPAIN_IRPF_DAY_COUNT, d('2025-06-30'));
    expect(result.daysPresent).toBe(0);
    expect(result.met).toBe(false);
    expect(result.marginDays).toBe(184);
    expect(result.countedRanges).toEqual([]);
  });

  it('is independent of the order stays were supplied in', () => {
    const stays = [
      stayRec('a', 'ES', '2025-01-01', '2025-02-28'),
      stayRec('b', 'ES', '2025-04-01', '2025-05-31'),
      stayRec('e', 'MX', '2025-03-01', '2025-03-31'),
      stayRec('f', 'ES', '2025-07-01', '2025-08-31'),
    ];
    expect(evaluateDayCountThreshold(presenceLedger(stays), SPAIN_IRPF_DAY_COUNT, d('2025-12-31'))).toEqual(
      evaluateDayCountThreshold(
        presenceLedger(shuffle(stays, 99)),
        SPAIN_IRPF_DAY_COUNT,
        d('2025-12-31'),
      ),
    );
  });

  it('validates a caller-supplied threshold', () => {
    const bad: DayCountThreshold = { ...SPAIN_IRPF_DAY_COUNT, thresholdDays: 0 };
    expect(() => dayCountThreshold(bad)).toThrow(MeridianError);
    const uncited: DayCountThreshold = {
      ...SPAIN_IRPF_DAY_COUNT,
      citation: { ...SPAIN_IRPF_DAY_COUNT.citation, id: '  ' },
    };
    expect(() => dayCountThreshold(uncited)).toThrow(MeridianError);
  });
});

describe('the catalog says what it is', () => {
  it('carries a citation with a note that day counting is one limb only', () => {
    for (const threshold of [SPAIN_IRPF_DAY_COUNT, CANADA_SOJOURNER_DAY_COUNT]) {
      expect(threshold.citation.note).toBeTruthy();
      expect(threshold.citation.provision).toBeTruthy();
      expect(threshold.citation.note?.toLowerCase()).toContain('residence');
    }
  });

  it('flags the Canadian rule as requiring characterisation of the days', () => {
    expect(CANADA_SOJOURNER_DAY_COUNT.citation.discretionary).toBe(true);
    expect(CANADA_SOJOURNER_DAY_COUNT.citation.note?.toLowerCase()).toContain('sojourn');
  });
});
