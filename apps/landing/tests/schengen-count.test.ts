/**
 * `countSchengenDays` — the most consequential function on this site.
 *
 * A stranger's first interaction with Meridian is typing two dates into the
 * counter at the top of the landing page. The number that comes back is the
 * difference between a lawful stay and an overstay, and nobody licensed is
 * accountable for it, so the arithmetic has to be right on its own.
 *
 * Three classes of test live here, in descending order of how badly a
 * regression would hurt someone:
 *
 *  1. **The re-exported thresholds and citation are the ones
 *     `@meridian/presence` holds** — object identity, not equal values. They
 *     were briefly hand-copied into this app, and the failure mode of a copy is
 *     silent: a `verifiedOn` moves in one file and a landing page goes on
 *     printing a stale verification date beside a legal rule.
 *  2. **The boundaries.** Exactly 90 compliant and 91 not; the first and last
 *     day of the window; both endpoints of a stay; a leap day; an empty record.
 *  3. **The refusals.** Croatia before 2023-01-01 consuming nothing, and the
 *     Bulgaria/Romania staged-accession window producing `undetermined` rather
 *     than a number the reader would act on.
 */

import { describe, expect, it, vi } from 'vitest';
import { SCHENGEN_MEMBERSHIP, countryCode, isoDate } from '@meridian/core';
import {
  SCHENGEN_MAX_DAYS as PRESENCE_MAX_DAYS,
  SCHENGEN_SHORT_STAY_CITATION as PRESENCE_CITATION,
  SCHENGEN_WINDOW_DAYS as PRESENCE_WINDOW_DAYS,
} from '@meridian/presence';

import { AS_OF } from '@/lib/as-of';
import {
  DEFAULT_REFERENCE_DATE,
  MAX_STAYS,
  SCHENGEN_CITATION,
  SCHENGEN_MAX_DAYS,
  SCHENGEN_STATES,
  SCHENGEN_WINDOW_DAYS,
  countSchengenDays,
  schengenState,
} from '@/lib/schengen';

import { bruteForceDaysUsed, countOn, seededShuffle, stayFacts } from './helpers.js';

/** The window the site's default reference date produces. Both ends included. */
const WINDOW_START = '2026-01-27';
const REFERENCE = '2026-07-25';

describe('the rule, its thresholds and its source', () => {
  it('re-exports the very objects @meridian/presence holds, not copies of them', () => {
    // `toBe`, deliberately. Structural equality would still pass the day
    // somebody re-introduced a hand-written duplicate that happened to match on
    // the day it was written — which is exactly what happened here once, and
    // exactly the guarantee that decays the first time a `verifiedOn` moves.
    expect(SCHENGEN_CITATION).toBe(PRESENCE_CITATION);
    expect(SCHENGEN_MAX_DAYS).toBe(PRESENCE_MAX_DAYS);
    expect(SCHENGEN_WINDOW_DAYS).toBe(PRESENCE_WINDOW_DAYS);
  });

  it('holds the two numbers the page prints beside the answer', () => {
    expect(SCHENGEN_MAX_DAYS).toBe(90);
    expect(SCHENGEN_WINDOW_DAYS).toBe(180);
  });

  it('carries the citation fields the result region renders', () => {
    // The result renders the URL and the note only when they are present, so
    // their disappearance would not break a render — it would silently remove
    // the reader's route to the source text and the caveat on the count.
    expect(SCHENGEN_CITATION.instrument).toContain('2016/399');
    expect(SCHENGEN_CITATION.provision).toBe('art. 6(1)-(2)');
    expect(SCHENGEN_CITATION.url).toMatch(/^https:\/\//);
    expect(SCHENGEN_CITATION.note).toBeTypeOf('string');
    expect(SCHENGEN_CITATION.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(SCHENGEN_CITATION.jurisdiction).toBe('X-SCHENGEN');
  });

  it('pre-fills the reference field from the build date rather than a clock', () => {
    expect(DEFAULT_REFERENCE_DATE).toBe(AS_OF);

    // Move the system clock four years and the default does not follow it.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2030-03-01T00:00:00Z'));
      expect(DEFAULT_REFERENCE_DATE).toBe(AS_OF);
      expect(countOn(REFERENCE, ['a', 'ES', '2026-04-27', REFERENCE]).daysUsed).toBe(90);
    } finally {
      vi.useRealTimers();
    }
  });

  it('caps the form at a number of rows the error summary can still summarise', () => {
    expect(MAX_STAYS).toBe(12);
    expect(Number.isInteger(MAX_STAYS)).toBe(true);
  });
});

describe('the ninety days', () => {
  it('counts exactly ninety as inside the allowance', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-04-27', REFERENCE]);
    expect(count.daysUsed).toBe(90);
    expect(count.outcome).toBe('within');
    expect(count.daysRemaining).toBe(0);
    expect(count.daysOverLimit).toBe(0);
  });

  it('counts ninety-one as over, by one day', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-04-26', REFERENCE]);
    expect(count.daysUsed).toBe(91);
    expect(count.outcome).toBe('over');
    expect(count.daysOverLimit).toBe(1);
    // Never negative: the page prints `daysRemaining` in the compliant branch
    // and "-1 days remain unused" would be a sentence somebody acts on.
    expect(count.daysRemaining).toBe(0);
  });

  it('counts eighty-nine as inside, with one day left', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-04-28', REFERENCE]);
    expect(count.daysUsed).toBe(89);
    expect(count.outcome).toBe('within');
    expect(count.daysRemaining).toBe(1);
  });
});

describe('the edges of the 180-day window', () => {
  it('opens the window 179 days before the reference date, both ends included', () => {
    const count = countOn(REFERENCE);
    expect(count.window).toEqual({ start: isoDate(WINDOW_START), end: isoDate(REFERENCE) });
  });

  it('charges the first day of the window', () => {
    const count = countOn(REFERENCE, ['a', 'ES', WINDOW_START, WINDOW_START]);
    expect(count.daysUsed).toBe(1);
  });

  it('charges nothing for the day before the window opens', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-01-26', '2026-01-26']);
    expect(count.daysUsed).toBe(0);
    expect(count.outcome).toBe('within');
    expect(count.stays[0]?.uncounted.map((u) => u.key)).toContain('outside-window');
  });

  it('clips a stay that straddles the opening edge, and says how much it dropped', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-01-26', '2026-01-30']);
    const line = count.stays[0];
    expect(line?.stayDays).toBe(5);
    expect(line?.daysInsideWindow).toBe(4);
    expect(line?.countedDays).toBe(4);
    expect(count.daysUsed).toBe(4);

    const aged = line?.uncounted.find((u) => u.key === 'outside-window');
    expect(aged?.days).toBe(1);
    // The reason names the window it fell out of, in both languages, because a
    // trip the reader knows they took showing zero charged days is the line
    // they will look hardest at.
    expect(aged?.text.en).toContain(REFERENCE);
    expect(aged?.text.es).toContain(REFERENCE);
  });

  it('charges the reference day itself', () => {
    const count = countOn(REFERENCE, ['a', 'ES', REFERENCE, REFERENCE]);
    expect(count.daysUsed).toBe(1);
  });

  it('charges nothing for a stay that has not entered the window yet', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-08-01', '2026-08-10']);
    expect(count.daysUsed).toBe(0);
    expect(count.stays[0]?.daysInsideWindow).toBe(0);
  });
});

describe('both endpoints of a stay count', () => {
  it('treats a same-day trip as one day, not none', () => {
    const count = countOn(REFERENCE, ['a', 'ES', '2026-07-20', '2026-07-20']);
    expect(count.stays[0]?.stayDays).toBe(1);
    expect(count.daysUsed).toBe(1);
  });

  it('counts a two-day trip as two', () => {
    expect(countOn(REFERENCE, ['a', 'ES', '2026-07-20', '2026-07-21']).daysUsed).toBe(2);
  });
});

describe('a day cannot be spent twice', () => {
  it('merges overlapping stays instead of summing them into an invented overstay', () => {
    const count = countOn(
      REFERENCE,
      ['a', 'ES', '2026-07-01', '2026-07-10'],
      ['b', 'FR', '2026-07-05', '2026-07-15'],
    );
    // 10 + 11 = 21 if you add the column up. The union is 15.
    expect(count.daysUsed).toBe(15);
    expect(count.countedRanges).toHaveLength(1);
    expect(count.countedRanges[0]).toEqual({
      start: isoDate('2026-07-01'),
      end: isoDate('2026-07-15'),
    });
    // Each stay still reports its own days, so the working table shows why the
    // total is smaller than the column.
    expect(count.stays[0]?.countedDays).toBe(10);
    expect(count.stays[1]?.countedDays).toBe(11);
  });

  it('joins two stays that meet with no gap into one counted range', () => {
    const count = countOn(
      REFERENCE,
      ['a', 'ES', '2026-07-01', '2026-07-05'],
      ['b', 'FR', '2026-07-06', '2026-07-10'],
    );
    expect(count.daysUsed).toBe(10);
    expect(count.countedRanges).toHaveLength(1);
  });

  it('keeps a real gap between two runs', () => {
    const count = countOn(
      REFERENCE,
      ['a', 'ES', '2026-07-01', '2026-07-05'],
      ['b', 'FR', '2026-07-07', '2026-07-10'],
    );
    expect(count.daysUsed).toBe(9);
    expect(count.countedRanges).toHaveLength(2);
  });

  it('counts a stay entered twice once', () => {
    const count = countOn(
      REFERENCE,
      ['a', 'ES', '2026-07-01', '2026-07-10'],
      ['b', 'ES', '2026-07-01', '2026-07-10'],
    );
    expect(count.daysUsed).toBe(10);
  });
});

describe('ordering independence', () => {
  const trips = [
    ['t1', 'ES', '2026-02-01', '2026-02-20'],
    ['t2', 'FR', '2026-03-15', '2026-04-02'],
    ['t3', 'PT', '2026-04-01', '2026-04-10'],
    ['t4', 'IT', '2026-06-01', '2026-06-30'],
    ['t5', 'DE', '2026-07-20', '2026-07-25'],
  ] as const;

  it('produces the same total and the same working under every seeded permutation', () => {
    const canonical = countOn(REFERENCE, ...trips);
    for (const seed of [1, 7, 42, 1337, 99991]) {
      const shuffled = countOn(REFERENCE, ...seededShuffle(trips, seed));
      expect(shuffled.daysUsed, `seed ${seed}`).toBe(canonical.daysUsed);
      expect(shuffled.countedRanges, `seed ${seed}`).toEqual(canonical.countedRanges);
      expect(shuffled.outcome, `seed ${seed}`).toBe(canonical.outcome);
    }
  });

  it('lists the per-trip lines in the order the reader entered them', () => {
    // The working table is the reader checking their own rows against ours. A
    // table sorted by anything other than input order makes that impossible,
    // and a sort by outcome would be a ranking.
    const reversed = countOn(REFERENCE, ...[...trips].reverse());
    expect(reversed.stays.map((s) => s.id)).toEqual(['t5', 't4', 't3', 't2', 't1']);
  });
});

describe('cross-checked against an independent day-by-day recount', () => {
  const cases: readonly (readonly [string, string, readonly (readonly [string, string, string, string])[]])[] = [
    ['a single stay of exactly ninety', REFERENCE, [['a', 'ES', '2026-04-27', REFERENCE]]],
    ['one day over', REFERENCE, [['a', 'ES', '2026-04-26', REFERENCE]]],
    [
      'three trips, one of which has aged out',
      REFERENCE,
      [
        ['a', 'ES', '2026-01-10', '2026-02-05'],
        ['b', 'FR', '2026-06-01', '2026-06-20'],
        ['c', 'PT', '2026-07-10', REFERENCE],
      ],
    ],
    [
      'overlapping trips in two States',
      REFERENCE,
      [
        ['a', 'ES', '2026-07-01', '2026-07-10'],
        ['b', 'FR', '2026-07-05', '2026-07-15'],
      ],
    ],
    [
      'a stay straddling Croatian accession',
      '2023-03-01',
      [['a', 'HR', '2022-12-01', '2023-01-31']],
    ],
    ['a stay across 29 February', '2024-03-31', [['a', 'ES', '2024-02-01', '2024-03-05']]],
  ];

  for (const [name, reference, trips] of cases) {
    it(name, () => {
      expect(countOn(reference, ...trips).daysUsed).toBe(bruteForceDaysUsed(reference, trips));
    });
  }
});

describe('leap years', () => {
  it('counts 29 February as a day', () => {
    const count = countOn('2024-02-29', ['a', 'ES', '2024-01-01', '2024-02-29']);
    expect(count.daysUsed).toBe(60); // 31 + 29
  });

  it('counts the same calendar span in a common year as one day shorter', () => {
    const count = countOn('2026-02-28', ['a', 'ES', '2026-01-01', '2026-02-28']);
    expect(count.daysUsed).toBe(59); // 31 + 28
  });

  it('spans 29 February inside a window without losing or gaining a day', () => {
    const count = countOn('2024-03-01', ['a', 'ES', '2024-02-28', '2024-03-01']);
    expect(count.daysUsed).toBe(3); // 28 Feb, 29 Feb, 1 Mar
  });
});

describe('membership is resolved day by day', () => {
  it('charges nothing for time in Croatia before 2023-01-01', () => {
    const count = countOn('2022-12-31', ['a', 'HR', '2022-12-01', '2022-12-31']);
    expect(count.daysUsed).toBe(0);
    expect(count.daysRemaining).toBe(SCHENGEN_MAX_DAYS);
    expect(count.outcome).toBe('within');

    const reason = count.stays[0]?.uncounted.find((u) => u.key === 'before-membership');
    // Named, not silently dropped: a zero beside a trip the reader took is only
    // trustworthy if the page says why it is zero.
    expect(reason?.days).toBe(31);
    expect(reason?.text.en).toContain('2023-01-01');
    expect(reason?.text.es).toContain('2023-01-01');
  });

  it('splits a stay that straddles Croatian accession at the accession date', () => {
    const count = countOn('2023-01-05', ['a', 'HR', '2022-12-27', '2023-01-05']);
    expect(count.daysUsed).toBe(5); // 1 to 5 January only
    expect(count.stays[0]?.stayDays).toBe(10);
    expect(count.stays[0]?.uncounted.find((u) => u.key === 'before-membership')?.days).toBe(5);
    expect(count.ambiguous).toHaveLength(0);
  });

  it('charges Croatia normally after accession', () => {
    const count = countOn('2023-02-10', ['a', 'HR', '2023-02-01', '2023-02-10']);
    expect(count.daysUsed).toBe(10);
  });
});

describe('the staged accession of Bulgaria and Romania', () => {
  /**
   * 62 charged days plus 30 days inside Bulgaria's staged window. The lower
   * bound is inside the allowance and the upper bound is over it, so the record
   * alone cannot decide the question — which is the answer, and the single most
   * important output on this site.
   */
  const staged = [
    ['a', 'ES', '2024-10-01', '2024-12-01'],
    ['b', 'BG', '2024-12-02', '2024-12-31'],
  ] as const;

  it('returns undetermined rather than a number, when the limit falls inside the range', () => {
    const count = countOn('2024-12-31', ...staged);
    expect(count.outcome).toBe('undetermined');
    expect(count.daysUsed).toBe(62);
    expect(count.daysUsedIfAmbiguousCounted).toBe(92);
  });

  it('describes the unresolvable period with the dates a person can act on', () => {
    const count = countOn('2024-12-31', ...staged);
    expect(count.ambiguous).toHaveLength(1);
    const period = count.ambiguous[0];
    expect(period?.country).toBe('BG');
    expect(period?.daysInsideWindow).toBe(30);
    expect(period?.partialSince).toBe('2024-03-31');
    expect(period?.since).toBe('2025-01-01');
  });

  it('does not charge the ambiguous days, and does not assert they are free', () => {
    const count = countOn('2024-12-31', ...staged);
    const bulgaria = count.stays.find((s) => s.country === 'BG');
    expect(bulgaria?.countedDays).toBe(0);
    const reason = bulgaria?.uncounted.find((u) => u.key === 'accession-ambiguous');
    expect(reason?.days).toBe(30);
    expect(reason?.text.en).toContain('does not assert they are free');
  });

  it('stays within when even the upper bound is exactly ninety', () => {
    // 60 charged + 30 ambiguous = 90. At the threshold, not past it.
    const count = countOn(
      '2024-12-31',
      ['a', 'ES', '2024-10-01', '2024-11-29'],
      ['b', 'BG', '2024-12-02', '2024-12-31'],
    );
    expect(count.daysUsed).toBe(60);
    expect(count.daysUsedIfAmbiguousCounted).toBe(90);
    expect(count.outcome).toBe('within');
  });

  it('becomes undetermined at ninety-one on the upper bound', () => {
    // One more charged day than the case above, and the answer stops existing.
    const count = countOn(
      '2024-12-31',
      ['a', 'ES', '2024-10-01', '2024-11-30'],
      ['b', 'BG', '2024-12-02', '2024-12-31'],
    );
    expect(count.daysUsed).toBe(61);
    expect(count.daysUsedIfAmbiguousCounted).toBe(91);
    expect(count.outcome).toBe('undetermined');
  });

  it('stays over when the charged days alone already breach', () => {
    // Ambiguity cannot rescue a record that is over on the days nobody disputes.
    const count = countOn(
      '2024-12-31',
      ['a', 'ES', '2024-08-01', '2024-11-30'],
      ['b', 'BG', '2024-12-02', '2024-12-31'],
    );
    expect(count.daysUsed).toBe(122);
    expect(count.outcome).toBe('over');
    expect(count.daysOverLimit).toBe(32);
  });

  it('treats time in Bulgaria before the staged window as outside the area entirely', () => {
    const count = countOn('2024-01-31', ['a', 'BG', '2024-01-01', '2024-01-31']);
    expect(count.daysUsed).toBe(0);
    expect(count.ambiguous).toHaveLength(0);
    expect(count.outcome).toBe('within');
    const reason = count.stays[0]?.uncounted.find((u) => u.key === 'before-membership');
    expect(reason?.days).toBe(31);
  });

  it('charges Bulgaria normally from 2025-01-01', () => {
    const count = countOn('2025-01-10', ['a', 'BG', '2025-01-01', '2025-01-10']);
    expect(count.daysUsed).toBe(10);
    expect(count.ambiguous).toHaveLength(0);
    expect(count.outcome).toBe('within');
  });
});

describe('an empty record', () => {
  it('counts nothing and claims nothing', () => {
    const count = countOn(REFERENCE);
    expect(count.daysUsed).toBe(0);
    expect(count.daysRemaining).toBe(SCHENGEN_MAX_DAYS);
    expect(count.daysOverLimit).toBe(0);
    expect(count.countedRanges).toEqual([]);
    expect(count.stays).toEqual([]);
    expect(count.ambiguous).toEqual([]);
    expect(count.daysUsedIfAmbiguousCounted).toBe(0);
    expect(count.outcome).toBe('within');
  });

  it('distinguishes an empty record from a record of days that charged nothing', () => {
    // "No trips" and "trips that consumed nothing" are different facts, and the
    // working table has to show the second.
    const count = countOn('2022-12-31', ['a', 'HR', '2022-12-01', '2022-12-31']);
    expect(count.daysUsed).toBe(0);
    expect(count.stays).toHaveLength(1);
    expect(count.stays[0]?.uncounted.length).toBeGreaterThan(0);
  });
});

describe('there is no clock and no timezone in the count', () => {
  it('returns byte-identical output under a shifted system clock', () => {
    const query = {
      referenceDate: isoDate(REFERENCE),
      stays: [stayFacts('a', 'ES', '2026-04-27', REFERENCE)],
    };
    const before = JSON.stringify(countSchengenDays(query));

    vi.useFakeTimers();
    try {
      // Midnight UTC on this instant is the previous civil day in Mexico City,
      // which is precisely the hour that turns 90 into 91.
      vi.setSystemTime(new Date('2026-07-26T00:30:00Z'));
      expect(JSON.stringify(countSchengenDays(query))).toBe(before);
      vi.setSystemTime(new Date('2020-01-01T12:00:00Z'));
      expect(JSON.stringify(countSchengenDays(query))).toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the States the form offers', () => {
  it('offers exactly the membership table, so no State can be picked without an accession date', () => {
    expect(SCHENGEN_STATES).toHaveLength(SCHENGEN_MEMBERSHIP.length);
    expect([...SCHENGEN_STATES].map((s) => s.code).sort()).toEqual(
      [...SCHENGEN_MEMBERSHIP].map((m) => m.country).sort(),
    );
  });

  it('names every State in both languages rather than falling back to its code', () => {
    // The fallback in `SCHENGEN_STATES` renders a bare `LV` in the picker. That
    // is correct behaviour and an unusable option, so a State added to
    // `@meridian/core` without a name here should fail a test rather than ship.
    for (const state of SCHENGEN_STATES) {
      expect(state.name.en, state.code).not.toBe(state.code);
      expect(state.name.es, state.code).not.toBe(state.code);
      expect(state.name.en.length, state.code).toBeGreaterThan(1);
      expect(state.name.es.length, state.code).toBeGreaterThan(1);
    }
  });

  it('lists them alphabetically by English name — a scan order, not a ranking', () => {
    const names = SCHENGEN_STATES.map((s) => s.name.en);
    expect(names).toEqual([...names].sort());
  });

  it('carries the staged-accession dates for exactly the two States that have them', () => {
    const staged = SCHENGEN_STATES.filter((s) => s.partialSince !== null).map((s) => s.code);
    expect([...staged].sort()).toEqual(['BG', 'RO']);
    expect(schengenState('HR')?.since).toBe('2023-01-01');
    expect(schengenState('HR')?.partialSince).toBeNull();
  });

  it('resolves a member State and refuses everything else', () => {
    expect(schengenState('ES')?.code).toBe('ES');
    expect(schengenState('GB')).toBeNull();
    expect(schengenState('')).toBeNull();
    expect(schengenState('es')).toBeNull(); // the form upper-cases before asking
  });

  it('cannot be tricked into resolving a property of Object.prototype', () => {
    // The lookup is a `find` over an array rather than an index into an object,
    // which is what keeps these from becoming States.
    for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      expect(schengenState(key), key).toBeNull();
    }
  });
});

describe('a State outside the area is never offered, so its time is never asked for', () => {
  it('charges nothing for a country the membership table does not hold', () => {
    // Reachable only by an id that bypassed the picker — a pasted URL, a future
    // deep link. It must count zero rather than throw or charge.
    const count = countSchengenDays({
      referenceDate: isoDate(REFERENCE),
      stays: [
        {
          id: 'x',
          country: countryCode('GB'),
          range: { start: isoDate('2026-07-01'), end: isoDate('2026-07-10') },
        },
      ],
    });
    expect(count.daysUsed).toBe(0);
    expect(count.outcome).toBe('within');
    expect(count.stays[0]?.countryName.en).toBe('GB');
  });
});
