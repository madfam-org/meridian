import { describe, expect, it } from 'vitest';
import { MeridianError, calendarYearRange, isMeridianError } from '@meridian/core';
import {
  assertNoLocationConflicts,
  buildLedger,
  countriesOn,
  countryPresenceRanges,
  daysPresentIn,
  detectInconsistencies,
  ledgerSpan,
  presenceLedger,
  presenceRangesWhere,
  staysOn,
  staysOverlapping,
} from '../src/ledger.js';
import { c, d, shuffle, stayIn, stayRec } from './helpers.js';

describe('ledger construction', () => {
  it('normalises order so identical facts produce an identical ledger', () => {
    const stays = [
      stayRec('c', 'MX', '2025-05-01', '2025-05-10'),
      stayRec('a', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('b', 'FR', '2025-03-01', '2025-03-10'),
    ];
    expect(presenceLedger(stays)).toEqual(presenceLedger(shuffle(stays, 7)));
    expect(presenceLedger(stays).stays.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('breaks ties on end date, then id, so ordering is total', () => {
    const stays = [
      stayRec('z', 'ES', '2025-01-01', '2025-01-05'),
      stayRec('a', 'ES', '2025-01-01', '2025-01-05'),
      stayRec('m', 'ES', '2025-01-01', '2025-01-03'),
    ];
    expect(presenceLedger(shuffle(stays, 3)).stays.map((s) => s.id)).toEqual(['m', 'a', 'z']);
  });

  it('rejects duplicate ids rather than silently keeping one', () => {
    const dup = [stayRec('x', 'ES', '2025-01-01', '2025-01-05'), stayRec('x', 'FR', '2025-02-01', '2025-02-05')];
    expect(() => presenceLedger(dup)).toThrow(MeridianError);
  });

  it('rejects an inverted range instead of producing negative days', () => {
    expect(() => presenceLedger([stayRec('x', 'ES', '2025-01-10', '2025-01-01')])).toThrow(RangeError);
  });

  it('closes an open-ended stay at the supplied date and marks it imputed', () => {
    const ledger = buildLedger([stayIn('open', 'ES', '2025-06-01', null)], {
      openStaysEndOn: d('2025-07-25'),
    });
    const stay = ledger.stays[0];
    expect(stay?.range).toEqual({ start: '2025-06-01', end: '2025-07-25' });
    expect(stay?.openEnded).toBe(true);
  });

  it('refuses an open-ended stay that starts after the date it would be closed at', () => {
    expect(() =>
      buildLedger([stayIn('open', 'ES', '2025-09-01', null)], { openStaysEndOn: d('2025-07-25') }),
    ).toThrow(MeridianError);
  });

  it('has no span when empty', () => {
    expect(ledgerSpan(presenceLedger([]))).toBeNull();
  });

  it('spans from the earliest start to the latest end, even when nested', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-12-31'),
      stayRec('b', 'FR', '2025-03-01', '2025-03-10'),
    ]);
    expect(ledgerSpan(ledger)).toEqual({ start: '2025-01-01', end: '2025-12-31' });
  });
});

describe('ledger queries', () => {
  const ledger = presenceLedger([
    stayRec('a', 'ES', '2025-01-01', '2025-01-10'),
    stayRec('b', 'ES', '2025-01-08', '2025-01-20'),
    stayRec('e', 'MX', '2025-03-01', '2025-03-01'),
  ]);

  it('counts a single-day stay as one day', () => {
    expect(daysPresentIn(ledger, c('MX'), calendarYearRange(2025))).toBe(1);
  });

  it('collapses overlapping stays in the same country', () => {
    expect(countryPresenceRanges(ledger, c('ES'))).toEqual([{ start: '2025-01-01', end: '2025-01-20' }]);
    expect(daysPresentIn(ledger, c('ES'), calendarYearRange(2025))).toBe(20);
  });

  it('clips to the requested window', () => {
    expect(
      daysPresentIn(ledger, c('ES'), { start: d('2025-01-15'), end: d('2025-02-28') }),
    ).toBe(6);
  });

  it('reports every stay claiming a day', () => {
    expect(staysOn(ledger, d('2025-01-09')).map((s) => s.id)).toEqual(['a', 'b']);
    expect(staysOn(ledger, d('2025-02-01'))).toEqual([]);
    expect(countriesOn(ledger, d('2025-01-09'))).toEqual(['ES']);
  });

  it('selects only stays that touch the window', () => {
    expect(
      staysOverlapping(ledger, { start: d('2025-01-20'), end: d('2025-01-20') }).map((s) => s.id),
    ).toEqual(['b']);
  });

  it('counts leap day as a real day', () => {
    const leap = presenceLedger([stayRec('l', 'ES', '2024-02-28', '2024-03-01')]);
    expect(daysPresentIn(leap, c('ES'), calendarYearRange(2024))).toBe(3);
    const common = presenceLedger([stayRec('l', 'ES', '2025-02-28', '2025-03-01')]);
    expect(daysPresentIn(common, c('ES'), calendarYearRange(2025))).toBe(2);
  });

  it('splits a stay that crosses a year boundary across both years', () => {
    const ledger2 = presenceLedger([stayRec('ny', 'ES', '2024-12-20', '2025-01-10')]);
    expect(daysPresentIn(ledger2, c('ES'), calendarYearRange(2024))).toBe(12);
    expect(daysPresentIn(ledger2, c('ES'), calendarYearRange(2025))).toBe(10);
  });

  it('returns nothing for a country with no stays', () => {
    expect(countryPresenceRanges(ledger, c('JP'))).toEqual([]);
    expect(daysPresentIn(ledger, c('JP'), calendarYearRange(2025))).toBe(0);
  });
});

describe('presenceRangesWhere', () => {
  it('applies the predicate per day, splitting a stay in two', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-01-01', '2025-01-10')]);
    const ranges = presenceRangesWhere(
      ledger,
      { start: d('2025-01-01'), end: d('2025-01-10') },
      (_s, day) => day !== '2025-01-05',
    );
    expect(ranges).toEqual([
      { start: '2025-01-01', end: '2025-01-04' },
      { start: '2025-01-06', end: '2025-01-10' },
    ]);
  });

  it('refuses an absurd scan rather than hanging', () => {
    const ledger = presenceLedger([]);
    expect(() =>
      presenceRangesWhere(ledger, { start: d('1000-01-01'), end: d('3000-01-01') }, () => true),
    ).toThrow(MeridianError);
  });
});

describe('detectInconsistencies', () => {
  const asOf = d('2025-12-31');

  it('surfaces two countries claiming the same day instead of picking one', () => {
    const ledger = presenceLedger([
      stayRec('es', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('mx', 'MX', '2025-01-05', '2025-01-15'),
    ]);
    const conflicts = detectInconsistencies(ledger, { asOf }).filter(
      (i) => i.kind === 'conflicting_location',
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.range).toEqual({ start: '2025-01-05', end: '2025-01-10' });
    expect(conflicts[0]?.days).toBe(6);
    expect(conflicts[0]?.countries).toEqual(['ES', 'MX']);
    expect(conflicts[0]?.stayIds).toEqual(['es', 'mx']);
  });

  it('does not treat back-to-back stays in different countries as a conflict', () => {
    const ledger = presenceLedger([
      stayRec('es', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('mx', 'MX', '2025-01-11', '2025-01-20'),
    ]);
    expect(detectInconsistencies(ledger, { asOf }).filter((i) => i.kind === 'conflicting_location')).toEqual([]);
  });

  it('flags a same-day country change, because a day cannot be spent in two places', () => {
    const ledger = presenceLedger([
      stayRec('es', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('fr', 'FR', '2025-01-10', '2025-01-20'),
    ]);
    const conflicts = detectInconsistencies(ledger, { asOf }).filter(
      (i) => i.kind === 'conflicting_location',
    );
    expect(conflicts[0]?.range).toEqual({ start: '2025-01-10', end: '2025-01-10' });
  });

  it('keeps two separate conflicts separate when a clean day lies between them', () => {
    const ledger = presenceLedger([
      stayRec('es1', 'ES', '2025-01-01', '2025-01-02'),
      stayRec('mx1', 'MX', '2025-01-01', '2025-01-02'),
      stayRec('es2', 'ES', '2025-01-04', '2025-01-05'),
      stayRec('mx2', 'MX', '2025-01-04', '2025-01-05'),
    ]);
    const conflicts = detectInconsistencies(ledger, { asOf }).filter(
      (i) => i.kind === 'conflicting_location',
    );
    expect(conflicts.map((x) => x.range)).toEqual([
      { start: '2025-01-01', end: '2025-01-02' },
      { start: '2025-01-04', end: '2025-01-05' },
    ]);
  });

  it('reports days where the record says nothing at all', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('b', 'ES', '2025-02-01', '2025-02-10'),
    ]);
    const gaps = detectInconsistencies(ledger, { asOf }).filter((i) => i.kind === 'unknown_location');
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.range).toEqual({ start: '2025-01-11', end: '2025-01-31' });
    expect(gaps[0]?.days).toBe(21);
    expect(gaps[0]?.stayIds).toEqual([]);
  });

  it('finds leading and trailing gaps only when a coverage window is supplied', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-06-01', '2025-06-30')]);
    expect(detectInconsistencies(ledger, { asOf }).filter((i) => i.kind === 'unknown_location')).toEqual([]);
    const withWindow = detectInconsistencies(ledger, {
      asOf,
      expectedCoverage: calendarYearRange(2025),
    }).filter((i) => i.kind === 'unknown_location');
    expect(withWindow.map((x) => x.range)).toEqual([
      { start: '2025-01-01', end: '2025-05-31' },
      { start: '2025-07-01', end: '2025-12-31' },
    ]);
  });

  it('treats an entirely empty record over an expected window as unknown, not as absence-free', () => {
    const found = detectInconsistencies(presenceLedger([]), {
      asOf,
      expectedCoverage: calendarYearRange(2025),
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.kind).toBe('unknown_location');
    expect(found[0]?.days).toBe(365);
  });

  it('reports nothing for an empty ledger with no expected coverage', () => {
    expect(detectInconsistencies(presenceLedger([]), { asOf })).toEqual([]);
  });

  it('flags only the portion of a stay that lies in the future', () => {
    const ledger = presenceLedger([stayRec('plan', 'ES', '2025-12-20', '2026-01-15')]);
    const future = detectInconsistencies(ledger, { asOf }).filter((i) => i.kind === 'future_presence');
    expect(future).toHaveLength(1);
    expect(future[0]?.range).toEqual({ start: '2026-01-01', end: '2026-01-15' });
    expect(future[0]?.days).toBe(15);
  });

  it('does not flag a stay ending exactly on the assessment date', () => {
    const ledger = presenceLedger([stayRec('a', 'ES', '2025-12-20', '2025-12-31')]);
    expect(detectInconsistencies(ledger, { asOf }).filter((i) => i.kind === 'future_presence')).toEqual([]);
  });

  it('flags an imputed departure so the end date is never mistaken for a recorded one', () => {
    const ledger = buildLedger([stayIn('open', 'ES', '2025-06-01', null)], {
      openStaysEndOn: d('2025-12-31'),
    });
    const imputed = detectInconsistencies(ledger, { asOf }).filter((i) => i.kind === 'imputed_departure');
    expect(imputed).toHaveLength(1);
    expect(imputed[0]?.stayIds).toEqual(['open']);
  });

  it('produces the same findings whatever order the stays arrived in', () => {
    const stays = [
      stayRec('es', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('mx', 'MX', '2025-01-05', '2025-01-15'),
      stayRec('fr', 'FR', '2025-03-01', '2025-03-10'),
      stayRec('plan', 'PT', '2026-02-01', '2026-02-10'),
    ];
    const a = detectInconsistencies(presenceLedger(stays), { asOf });
    const b = detectInconsistencies(presenceLedger(shuffle(stays, 42)), { asOf });
    expect(a).toEqual(b);
  });
});

describe('assertNoLocationConflicts', () => {
  it('throws with the ledger-inconsistency code when a day is claimed twice', () => {
    const ledger = presenceLedger([
      stayRec('es', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('mx', 'MX', '2025-01-05', '2025-01-15'),
    ]);
    try {
      assertNoLocationConflicts(ledger, { asOf: d('2025-12-31') });
      expect.unreachable('expected a conflict');
    } catch (e) {
      expect(isMeridianError(e)).toBe(true);
      if (isMeridianError(e)) expect(e.code).toBe('PRESENCE_LEDGER_INCONSISTENT');
    }
  });

  it('tolerates gaps, which are known unknowns rather than impossibilities', () => {
    const ledger = presenceLedger([
      stayRec('a', 'ES', '2025-01-01', '2025-01-10'),
      stayRec('b', 'ES', '2025-06-01', '2025-06-10'),
    ]);
    expect(() => assertNoLocationConflicts(ledger, { asOf: d('2025-12-31') })).not.toThrow();
  });
});
