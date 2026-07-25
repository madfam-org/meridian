import { describe, expect, it } from 'vitest';
import {
  MeridianError,
  addDays,
  countryCode,
  rangeLengthDays,
  schengenAccessionAmbiguity,
} from '@meridian/core';
import { presenceLedger } from '../src/ledger.js';
import {
  SCHENGEN_MAX_DAYS,
  SCHENGEN_WINDOW_DAYS,
  schengenDaysUntilEligible,
  schengenNextEntryDate,
  schengenStatusOn,
  schengenWorstDay,
} from '../src/schengen.js';
import { d, shuffle, stayRec } from './helpers.js';

describe('the window itself', () => {
  it('is 180 days long and includes the reference day', () => {
    const status = schengenStatusOn(presenceLedger([]), d('2025-06-30'));
    expect(status.windowEnd).toBe('2025-06-30');
    expect(status.windowStart).toBe('2025-01-02');
    expect(
      rangeLengthDays({ start: d(status.windowStart), end: d(status.windowEnd) }),
    ).toBe(SCHENGEN_WINDOW_DAYS);
  });

  it('reports zero for an empty ledger rather than failing', () => {
    const status = schengenStatusOn(presenceLedger([]), d('2025-06-30'));
    expect(status.daysUsed).toBe(0);
    expect(status.daysRemaining).toBe(SCHENGEN_MAX_DAYS);
    expect(status.compliant).toBe(true);
    expect(status.contributingStays).toEqual([]);
  });
});

describe('the 90/91 boundary', () => {
  // 2025-01-01 to 2025-03-31 is 31 + 28 + 31 = exactly 90 days.
  const ninety = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
  const ninetyOne = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-04-01')]);

  it('treats exactly 90 days as compliant, with nothing left', () => {
    const status = schengenStatusOn(ninety, d('2025-03-31'));
    expect(status.daysUsed).toBe(90);
    expect(status.daysRemaining).toBe(0);
    expect(status.daysOverLimit).toBe(0);
    expect(status.compliant).toBe(true);
  });

  it('treats 91 days as a breach of exactly one day', () => {
    const status = schengenStatusOn(ninetyOne, d('2025-04-01'));
    expect(status.daysUsed).toBe(91);
    expect(status.daysRemaining).toBe(0);
    expect(status.daysOverLimit).toBe(1);
    expect(status.compliant).toBe(false);
  });

  it('counts a same-day entry and exit as one day, not zero', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-05-05', '2025-05-05')]);
    expect(schengenStatusOn(ledger, d('2025-05-05')).daysUsed).toBe(1);
  });
});

describe('window edges', () => {
  const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-01-10')]);

  it('counts the last day of a stay while it is still the first day of the window', () => {
    const lastCounted = addDays(d('2025-01-10'), SCHENGEN_WINDOW_DAYS - 1);
    const status = schengenStatusOn(ledger, lastCounted);
    expect(status.windowStart).toBe('2025-01-10');
    expect(status.daysUsed).toBe(1);
  });

  it('drops the stay entirely one day later', () => {
    const firstUncounted = addDays(d('2025-01-10'), SCHENGEN_WINDOW_DAYS);
    expect(schengenStatusOn(ledger, firstUncounted).daysUsed).toBe(0);
  });

  it('counts only the part of a straddling stay that is inside the window', () => {
    // 59-day stay; the window opening on 2025-01-02 clips the first day off.
    const straddle = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-02-28')]);
    const status = schengenStatusOn(straddle, d('2025-06-30'));
    expect(status.windowStart).toBe('2025-01-02');
    expect(status.daysUsed).toBe(58);
    expect(status.countedRanges).toEqual([{ start: '2025-01-02', end: '2025-02-28' }]);
  });

  it('counts a leap day like any other day', () => {
    const leap = presenceLedger([stayRec('a', 'ES', '2024-02-01', '2024-02-29')]);
    expect(schengenStatusOn(leap, d('2024-02-29')).daysUsed).toBe(29);
  });
});

describe('time-varying membership', () => {
  it('ignores Croatian days before accession and counts them after', () => {
    const ledger = presenceLedger([stayRec('hr', 'HR', '2022-12-25', '2023-01-05')]);
    expect(schengenStatusOn(ledger, d('2022-12-31')).daysUsed).toBe(0);
    // Only 2023-01-01 through 2023-01-05 fall inside the area.
    const after = schengenStatusOn(ledger, d('2023-01-05'));
    expect(after.daysUsed).toBe(5);
    expect(after.countedRanges).toEqual([{ start: '2023-01-01', end: '2023-01-05' }]);
    expect(after.contributingStays).toHaveLength(1);
    expect(after.contributingStays[0]?.countedRange).toEqual({
      start: '2023-01-01',
      end: '2023-01-05',
    });
  });

  it('applies the same treatment to Romania at its full accession date', () => {
    const ledger = presenceLedger([stayRec('ro', 'RO', '2024-12-25', '2025-01-05')]);
    expect(schengenStatusOn(ledger, d('2024-12-31')).daysUsed).toBe(0);
    // Only 2025-01-01 through 2025-01-05 fall inside the area.
    expect(schengenStatusOn(ledger, d('2025-01-05')).daysUsed).toBe(5);
  });

  it('does not count Romanian days in the staged-accession window', () => {
    // Internal air and sea controls were lifted on 2024-03-31, but full
    // accession — and internal land borders — followed on 2025-01-01. Whether a
    // stay in between consumed allowance turns on how the person crossed, which
    // a ledger cannot recover. `isSchengenOn` answers the full-membership
    // question and returns false; `schengenAccessionAmbiguity` is what callers
    // use to escalate the period to a human instead of resolving it silently.
    const ledger = presenceLedger([stayRec('ro', 'RO', '2024-06-01', '2024-06-30')]);
    expect(schengenStatusOn(ledger, d('2024-06-30')).daysUsed).toBe(0);
    expect(schengenAccessionAmbiguity(countryCode('RO'), d('2024-06-15'))).toBe(true);
    expect(schengenAccessionAmbiguity(countryCode('RO'), d('2025-01-15'))).toBe(false);
    expect(schengenAccessionAmbiguity(countryCode('ES'), d('2024-06-15'))).toBe(false);
  });

  it('never counts a state outside the area', () => {
    const ledger = presenceLedger([
      stayRec('gb', 'GB', '2025-01-01', '2025-06-30'),
      stayRec('mx', 'MX', '2025-07-01', '2025-07-31'),
    ]);
    expect(schengenStatusOn(ledger, d('2025-07-31')).daysUsed).toBe(0);
  });
});

describe('deduplication and exemptions', () => {
  it('counts a day once when two Schengen states both claim it', () => {
    // Physically impossible and reported as such by the ledger, but the count
    // must not double: 15 calendar days, not 21.
    const ledger = presenceLedger([
      stayRec('es', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('fr', 'FR', '2025-01-05', '2025-01-15'),
    ]);
    const status = schengenStatusOn(ledger, d('2025-01-15'));
    expect(status.daysUsed).toBe(15);
    expect(status.countedRanges).toEqual([{ start: '2025-01-01', end: '2025-01-15' }]);
  });

  it('excludes days spent in the state that issued the residence permit', () => {
    const ledger = presenceLedger([
      stayRec('home', 'ES', '2025-01-01', '2025-05-31', { exemptFromSchengenShortStay: true }),
      stayRec('trip', 'FR', '2025-06-01', '2025-06-10'),
    ]);
    const status = schengenStatusOn(ledger, d('2025-06-10'));
    expect(status.daysUsed).toBe(10);
    expect(status.exemptStayIds).toEqual(['home']);
  });

  it('still charges travel to other Schengen states against the allowance', () => {
    const ledger = presenceLedger([
      stayRec('home', 'ES', '2025-01-01', '2025-12-31', { exemptFromSchengenShortStay: true }),
    ]);
    expect(schengenStatusOn(ledger, d('2025-06-30')).daysUsed).toBe(0);
    const withTrip = presenceLedger([
      stayRec('home', 'ES', '2025-01-01', '2025-12-31', { exemptFromSchengenShortStay: true }),
      stayRec('de', 'DE', '2025-06-01', '2025-06-20'),
    ]);
    expect(schengenStatusOn(withTrip, d('2025-06-30')).daysUsed).toBe(20);
  });
});

describe('schengenWorstDay', () => {
  it('finds a peak in the middle of the range, not at its end', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
    const worst = schengenWorstDay(ledger, { start: d('2025-03-01'), end: d('2025-12-31') });
    expect(worst.date).toBe('2025-03-31');
    expect(worst.status.daysUsed).toBe(90);
    // The last day of the range is far cheaper — checking only it would clear
    // an itinerary that breaches on the way through.
    expect(schengenStatusOn(ledger, d('2025-12-31')).daysUsed).toBe(0);
  });

  it('resolves ties to the earliest day, which is when a breach would first bite', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
    const worst = schengenWorstDay(ledger, { start: d('2025-03-31'), end: d('2025-06-29') });
    expect(worst.date).toBe('2025-03-31');
    expect(schengenStatusOn(ledger, d('2025-06-29')).daysUsed).toBe(90);
  });

  it('detects a planned trip that only breaches partway through', () => {
    const ledger = presenceLedger([
      stayRec('past', 'ES', '2025-01-01', '2025-03-11'), // 70 days
      stayRec('plan', 'FR', '2025-04-01', '2025-05-10'), // 40 days
    ]);
    const worst = schengenWorstDay(ledger, { start: d('2025-04-01'), end: d('2025-05-10') });
    expect(worst.status.compliant).toBe(false);
    expect(worst.status.daysUsed).toBeGreaterThan(SCHENGEN_MAX_DAYS);
    // The first day of the trip was fine; the traveller would not have been
    // turned around at the border, they would have been overstaying later.
    expect(schengenStatusOn(ledger, d('2025-04-01')).compliant).toBe(true);
  });

  it('returns the first day of the range for an empty ledger instead of null', () => {
    const worst = schengenWorstDay(presenceLedger([]), { start: d('2025-01-01'), end: d('2025-01-31') });
    expect(worst.date).toBe('2025-01-01');
    expect(worst.status.daysUsed).toBe(0);
  });

  it('agrees with a day-by-day recomputation over a mixed record', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2025-01-05', '2025-02-03'),
      stayRec('b', 'HR', '2025-03-01', '2025-03-20'),
      stayRec('c', 'GB', '2025-03-21', '2025-04-10'),
      stayRec('e', 'PT', '2025-05-01', '2025-06-15'),
    ]);
    const range = { start: d('2025-01-01'), end: d('2025-08-31') };
    const worst = schengenWorstDay(ledger, range);
    let best = -1;
    let bestDate = range.start;
    for (let i = 0; i < rangeLengthDays(range); i++) {
      const day = addDays(range.start, i);
      const used = schengenStatusOn(ledger, day).daysUsed;
      if (used > best) {
        best = used;
        bestDate = day;
      }
    }
    expect(worst.date).toBe(bestDate);
    expect(worst.status.daysUsed).toBe(best);
  });

  it('refuses a scan wider than the bound rather than grinding', () => {
    expect(() =>
      schengenWorstDay(presenceLedger([]), { start: d('2000-01-01'), end: d('2030-01-01') }),
    ).toThrow(MeridianError);
  });

  it('is independent of the order the stays were supplied in', () => {
    const stays = [
      stayRec('a', 'ES', '2025-01-05', '2025-02-03'),
      stayRec('b', 'FR', '2025-02-20', '2025-03-20'),
      stayRec('c', 'IT', '2025-04-01', '2025-04-30'),
    ];
    const range = { start: d('2025-01-01'), end: d('2025-08-31') };
    expect(schengenWorstDay(presenceLedger(stays), range)).toEqual(
      schengenWorstDay(presenceLedger(shuffle(stays, 11)), range),
    );
  });
});

describe('schengenNextEntryDate', () => {
  it('lets someone with a clean record enter immediately', () => {
    expect(schengenNextEntryDate(presenceLedger([]), 90, d('2025-01-01'))).toBe('2025-01-01');
  });

  it('finds the first day a one-day trip fits after a full 90-day stay', () => {
    // 90 days consumed 2025-01-01 to 2025-03-31. A single extra day is lawful
    // only once 2025-01-01 has dropped out of that day's window.
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
    const next = schengenNextEntryDate(ledger, 1, d('2025-04-01'));
    expect(next).toBe('2025-06-30');
    // Verified independently against the status function on both sides.
    const before = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-03-31'),
      stayRec('b', 'FR', '2025-06-29', '2025-06-29'),
    ]);
    expect(schengenStatusOn(before, d('2025-06-29')).compliant).toBe(false);
    const on = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-03-31'),
      stayRec('b', 'FR', '2025-06-30', '2025-06-30'),
    ]);
    expect(schengenStatusOn(on, d('2025-06-30')).compliant).toBe(true);
  });

  it('gives an unbroken 90-day block the same start date as a single day', () => {
    // Worth stating explicitly because it looks wrong at first glance. After a
    // solid 90-day stay the allowance regenerates at exactly one day per day,
    // so each further day of a proposed stay is paid for by the day that has
    // just aged out of the window. The block does not need to wait for the
    // whole 90 to clear.
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
    expect(schengenNextEntryDate(ledger, 1, d('2025-04-01'))).toBe('2025-06-30');
    expect(schengenNextEntryDate(ledger, 10, d('2025-04-01'))).toBe('2025-06-30');
  });

  it('checks every day of the proposed stay, not just its first', () => {
    // 80 days consumed 2025-01-01 to 2025-03-21, so on 2025-04-01 there are 10
    // days spare and none of the old days age out for months. A ten-day trip
    // fits immediately; a twenty-day trip starting the same day breaches on its
    // eleventh day, and only becomes lawful much later.
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-21')]);
    expect(schengenNextEntryDate(ledger, 10, d('2025-04-01'))).toBe('2025-04-01');
    expect(schengenNextEntryDate(ledger, 20, d('2025-04-01'))).toBe('2025-06-20');

    // What a start-day-only check would have waved through.
    const naive = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-03-21'),
      stayRec('b', 'FR', '2025-04-01', '2025-04-20'),
    ]);
    expect(schengenStatusOn(naive, d('2025-04-01')).compliant).toBe(true);
    expect(
      schengenWorstDay(naive, { start: d('2025-04-01'), end: d('2025-04-20') }).status.compliant,
    ).toBe(false);

    // And the answer the engine gives instead is compliant on every day.
    const correct = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-03-21'),
      stayRec('b', 'FR', '2025-06-20', '2025-07-09'),
    ]);
    expect(
      schengenWorstDay(correct, { start: d('2025-06-20'), end: d('2025-07-09') }).status.compliant,
    ).toBe(true);
  });

  it('returns null for a stay longer than the allowance itself', () => {
    expect(schengenNextEntryDate(presenceLedger([]), 91, d('2025-01-01'))).toBeNull();
  });

  it('returns null when nothing fits inside the horizon', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
    expect(schengenNextEntryDate(ledger, 1, d('2025-04-01'), { horizonDays: 10 })).toBeNull();
  });

  it('counts trips already booked in the future', () => {
    const ledger = presenceLedger([
      stayRec('past', 'ES', '2025-01-01', '2025-02-28'), // 59 days
      stayRec('booked', 'FR', '2025-03-15', '2025-04-14'), // 31 days, total 90
    ]);
    const next = schengenNextEntryDate(ledger, 1, d('2025-03-01'));
    expect(next).not.toBeNull();
    if (next !== null) {
      const withTrip = presenceLedger([
        stayRec('past', 'ES', '2025-01-01', '2025-02-28'),
        stayRec('booked', 'FR', '2025-03-15', '2025-04-14'),
        stayRec('new', 'IT', next, next),
      ]);
      expect(schengenStatusOn(withTrip, next).compliant).toBe(true);
    }
  });

  it('rejects a nonsensical stay length instead of guessing', () => {
    expect(() => schengenNextEntryDate(presenceLedger([]), 0, d('2025-01-01'))).toThrow(MeridianError);
    expect(() => schengenNextEntryDate(presenceLedger([]), 1.5, d('2025-01-01'))).toThrow(MeridianError);
    expect(() =>
      schengenNextEntryDate(presenceLedger([]), 1, d('2025-01-01'), { horizonDays: 0 }),
    ).toThrow(MeridianError);
  });

  it('expresses the same answer as a wait in days', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-03-31')]);
    expect(schengenDaysUntilEligible(ledger, 1, d('2025-04-01'))).toBe(90);
    expect(schengenDaysUntilEligible(presenceLedger([]), 30, d('2025-04-01'))).toBe(0);
    expect(schengenDaysUntilEligible(presenceLedger([]), 91, d('2025-04-01'))).toBeNull();
  });
});
