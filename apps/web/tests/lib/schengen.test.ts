/**
 * `lib/tools/schengen.ts` and `lib/tools/schengen-form.ts` — the 90/180 count.
 *
 * The portal's calculator answers two questions the landing page's deliberately
 * omits: the worst day across a range, and the earliest date a stay of a given
 * length fits. Both exist because the 180-day window slides underneath a
 * traveller, so the day somebody flies home is not the day that decides whether
 * the trip was lawful — and every calculator that checks only the departure date
 * answers a question nobody asked.
 *
 * On this rule one day is the whole difference between a lawful stay and an
 * overstay, and undercounting is the dangerous direction. The tests below are
 * written against that.
 */

import { describe, expect, it } from 'vitest';

import type { DateRange, IsoDate } from '@meridian/core';
import { addDays, countryCode, dateRange, isoDate } from '@meridian/core';
import {
  SCHENGEN_MAX_DAYS,
  SCHENGEN_MAX_SCAN_DAYS,
  SCHENGEN_WINDOW_DAYS,
} from '@meridian/presence';

import {
  MAX_PROPOSED_STAY_DAYS,
  SCHENGEN_EXAMPLES,
  SCHENGEN_STATES,
  runSchengenCheck,
  schengenState,
  type SchengenQuery,
  type SchengenReport,
  type StayFacts,
} from '@/lib/tools/schengen';
import {
  FIELD,
  answersFromExample,
  blankStayRow,
  readSchengenForm,
  stayFieldId,
  stayRowKey,
  type SchengenAnswers,
  type StayRow,
} from '@/lib/tools/schengen-form';

const REFERENCE = isoDate('2026-07-25');

function stay(id: string, country: string, start: string, end: string, exempt = false): StayFacts {
  return {
    id,
    country: countryCode(country),
    range: dateRange(isoDate(start), isoDate(end)),
    exempt,
  };
}

function query(stays: readonly StayFacts[], extra: Partial<SchengenQuery> = {}): SchengenQuery {
  return {
    stays,
    referenceDate: REFERENCE,
    plannedRange: null,
    proposedStayDays: null,
    proposedNotBefore: null,
    ...extra,
  };
}

function run(q: SchengenQuery): SchengenReport {
  const outcome = runSchengenCheck(q);
  if (!outcome.ok) throw new Error(`the day counter refused the query: ${outcome.message}`);
  return outcome.report;
}

/** Load one of the invented itineraries the way the form does. */
function fromExample(id: string): SchengenReport {
  const found = SCHENGEN_EXAMPLES.find((e) => e.id === id);
  if (found === undefined) throw new Error(`no such example: ${id}`);
  const reading = readSchengenForm(answersFromExample(found, 1).answers);
  expect(reading.issues).toEqual([]);
  if (reading.query === null) throw new Error('the example did not parse');
  return run(reading.query);
}

// ---------------------------------------------------------------------------
// The allowance, at its edge
// ---------------------------------------------------------------------------

describe('ninety days, exactly', () => {
  it('counts both endpoints, so an unbroken 90-day stay is within and 91 is over', () => {
    const ninety = fromExample('ninety');
    const ninetyOne = fromExample('ninety-one');

    expect(ninety.status.value.daysUsed).toBe(SCHENGEN_MAX_DAYS);
    expect(ninety.outcome).toBe('within');
    expect(ninety.status.value.daysRemaining).toBe(0);

    // The two itineraries differ by a single day at the start.
    expect(ninetyOne.status.value.daysUsed).toBe(SCHENGEN_MAX_DAYS + 1);
    expect(ninetyOne.outcome).toBe('over');
    expect(ninetyOne.status.value.daysOverLimit).toBe(1);
  });

  it('counts a same-day trip as one day of presence, not none', () => {
    const report = run(query([stay('s1', 'ES', '2026-07-20', '2026-07-20')]));

    expect(report.status.value.daysUsed).toBe(1);
    expect(report.stays[0]?.stayDays).toBe(1);
  });
});

describe('the 180-day window, at its edge', () => {
  it('opens 179 days before the reference date, inclusive of both ends', () => {
    const report = run(query([stay('s1', 'ES', '2026-07-25', '2026-07-25')]));

    expect(report.window.end).toBe(REFERENCE);
    expect(report.window.start).toBe('2026-01-27');
  });

  it('charges the first day of the window and nothing before it', () => {
    const straddling = run(query([stay('s1', 'ES', '2026-01-26', '2026-01-27')]));
    const entirelyBefore = run(query([stay('s1', 'ES', '2026-01-25', '2026-01-26')]));

    expect(straddling.status.value.daysUsed).toBe(1);
    expect(entirelyBefore.status.value.daysUsed).toBe(0);
  });

  it('says where every uncharged day went', () => {
    // "We counted fewer days than you spent" is a claim that has to be
    // checkable, or it reads as the tool losing a trip.
    const report = run(query([stay('s1', 'ES', '2026-01-26', '2026-01-27')]));
    const analysis = report.stays[0];

    expect(analysis?.stayDays).toBe(2);
    expect(analysis?.countedDays).toBe(1);
    expect(analysis?.uncounted.map((u) => u.key)).toEqual(['outside-window']);
    expect(analysis?.uncounted[0]?.days).toBe(1);
    expect(analysis?.uncounted[0]?.text.en).toContain(String(SCHENGEN_WINDOW_DAYS));
  });
});

describe('a day cannot be spent twice', () => {
  it('de-duplicates overlapping stays in the total while reporting each stay in full', () => {
    const report = run(
      query([
        stay('a', 'ES', '2026-07-01', '2026-07-10'),
        stay('b', 'FR', '2026-07-05', '2026-07-15'),
      ]),
    );

    const perStay = report.stays.reduce((sum, s) => sum + s.countedDays, 0);
    expect(perStay).toBe(21);
    // 1 July to 15 July inclusive.
    expect(report.status.value.daysUsed).toBe(15);
    // And the contradiction in the record is reported rather than smoothed over.
    expect(report.conflicts.length).toBe(1);
  });

  it('is independent of the order the stays were entered', () => {
    const stays = [
      stay('a', 'ES', '2026-03-01', '2026-03-20'),
      stay('b', 'FR', '2026-05-01', '2026-05-10'),
      stay('c', 'PT', '2026-07-01', '2026-07-05'),
    ];
    const forwards = run(query(stays));
    const backwards = run(query([...stays].reverse()));

    expect(backwards.status.value.daysUsed).toBe(forwards.status.value.daysUsed);
    expect(backwards.outcome).toBe(forwards.outcome);
    expect(backwards.daysUsedIfAmbiguousCounted).toBe(forwards.daysUsedIfAmbiguousCounted);
  });
});

// ---------------------------------------------------------------------------
// The worst day
// ---------------------------------------------------------------------------

describe('the worst day of a range', () => {
  it('is higher than the last day, and is the day that decides', () => {
    const report = fromExample('worst-day');
    const trip = report.plannedTrip;
    if (trip === null) throw new Error('the example did not scan a range');

    // Usage peaks at the start of the trip and falls as older days age out.
    // Reading the departure date understates it — which is the entire reason
    // this question is asked.
    expect(trip.assessment.value.status.daysUsed).toBeGreaterThan(trip.lastDay.value.daysUsed);
    expect(trip.assessment.value.date).toBe('2026-08-01');
    expect(trip.assessment.value.date).not.toBe(trip.range.end);
  });

  it('reports the window the worst day was measured over', () => {
    const trip = fromExample('worst-day').plannedTrip;
    if (trip === null) throw new Error('the example did not scan a range');

    expect(trip.assessment.value.status.windowEnd).toBe(trip.assessment.value.date);
    expect(trip.rangeDays).toBeGreaterThan(0);
  });

  it('names the days of the range no entered stay covers', () => {
    // A trip that is not in the record is measured as time at home, and a
    // reassuringly small number is the dangerous failure here.
    const trip = fromExample('worst-day').plannedTrip;
    if (trip === null) throw new Error('the example did not scan a range');

    expect(trip.uncoveredDays).toBe(4);
    expect(trip.uncovered.map((r: DateRange) => `${r.start}→${r.end}`)).toEqual([
      '2026-08-21→2026-08-24',
    ]);
  });

  it('reports no uncovered days when every day of the range is in the record', () => {
    const report = run(
      query([stay('a', 'ES', '2026-08-01', '2026-08-10')], {
        plannedRange: dateRange(isoDate('2026-08-01'), isoDate('2026-08-10')),
      }),
    );

    expect(report.plannedTrip?.uncoveredDays).toBe(0);
    expect(report.plannedTrip?.uncovered).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The earliest date a stay fits
// ---------------------------------------------------------------------------

describe('the earliest date an unbroken stay of a given length is inside the allowance', () => {
  it('is reported with the wait it implies', () => {
    const report = fromExample('ninety');
    const proposed = report.proposedStay;
    if (proposed === null) throw new Error('the example proposed no stay');

    // 90 days are already charged on the reference date, so a 14-day stay has
    // to wait for them to age out.
    expect(proposed.assessment.value).toBe('2026-10-24');
    expect(proposed.waitDays).toBe(90);
    expect(proposed.exceedsAllowance).toBe(false);
  });

  it('is the date given, with a wait of zero, when the stay already fits', () => {
    const report = run(
      query([stay('a', 'ES', '2026-07-01', '2026-07-05')], {
        proposedStayDays: 10,
        proposedNotBefore: isoDate('2026-08-01'),
      }),
    );

    expect(report.proposedStay?.assessment.value).toBe('2026-08-01');
    expect(report.proposedStay?.waitDays).toBe(0);
  });

  it('distinguishes "no such date exists" from "none inside the horizon"', () => {
    // A stay longer than the allowance breaches on its 91st day whenever it
    // starts. Reporting that as "not found in the next 365 days" would invite
    // the reader to try again later, and there is no later.
    const impossible = run(
      query([stay('a', 'ES', '2026-07-01', '2026-07-02')], {
        proposedStayDays: 120,
        proposedNotBefore: isoDate('2026-08-01'),
      }),
    );

    expect(impossible.proposedStay?.assessment.value).toBeNull();
    expect(impossible.proposedStay?.exceedsAllowance).toBe(true);
    expect(impossible.proposedStay?.waitDays).toBeNull();

    const possible = run(
      query([stay('a', 'ES', '2026-07-01', '2026-07-02')], {
        proposedStayDays: SCHENGEN_MAX_DAYS,
        proposedNotBefore: isoDate('2026-08-01'),
      }),
    );
    expect(possible.proposedStay?.exceedsAllowance).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Staged accession
// ---------------------------------------------------------------------------

describe('the staged-accession window', () => {
  it('escalates rather than guessing, and shows the count both ways', () => {
    const report = fromExample('staged');

    // Charging those days invents an overstay; waiving them hands the traveller
    // days they may not have. The limit sits between the two totals, so the
    // record alone does not decide it.
    expect(report.outcome).toBe('undetermined');
    expect(report.status.value.daysUsed).toBeLessThanOrEqual(SCHENGEN_MAX_DAYS);
    expect(report.daysUsedIfAmbiguousCounted).toBeGreaterThan(SCHENGEN_MAX_DAYS);
    expect(report.ambiguous).toHaveLength(1);
    expect(report.ambiguous[0]?.country).toBe('BG');
    expect(report.ambiguous[0]?.partialSince).toBe('2024-03-31');
    expect(report.ambiguous[0]?.since).toBe('2025-01-01');
  });

  it('stays within the allowance when the ambiguous days do not reach the limit', () => {
    const report = run(
      query([stay('a', 'BG', '2024-06-01', '2024-06-10')], {
        referenceDate: isoDate('2024-07-01'),
      }),
    );

    expect(report.ambiguous).toHaveLength(1);
    expect(report.outcome).toBe('within');
    expect(report.daysUsedIfAmbiguousCounted).toBe(10);
  });

  it('raises no ambiguity for a stay in the State that issued the reader’s own permit', () => {
    const report = run(
      query([stay('a', 'BG', '2024-06-01', '2024-08-20', true)], {
        referenceDate: isoDate('2024-12-15'),
      }),
    );

    expect(report.ambiguous).toEqual([]);
    expect(report.outcome).toBe('within');
  });

  it('does not charge days before a State joined the area', () => {
    const report = fromExample('accession');

    // Croatia acceded on 2023-01-01; the stay runs from 2022-11-15.
    expect(report.status.value.daysUsed).toBe(10);
    expect(report.stays[0]?.uncounted.map((u) => u.key)).toContain('before-membership');
    expect(report.stays[0]?.uncounted.find((u) => u.key === 'before-membership')?.text.en).toContain(
      '2023-01-01',
    );
  });
});

describe('an exempt stay', () => {
  it('charges nothing and says why', () => {
    // Charging a Spanish resident's days at home against their 90 would report
    // an overstay for somebody sitting in their own flat.
    const report = run(query([stay('a', 'ES', '2026-05-01', '2026-07-25', true)]));

    expect(report.status.value.daysUsed).toBe(0);
    expect(report.status.value.exemptStayIds).toEqual(['a']);
    expect(report.stays[0]?.uncounted.map((u) => u.key)).toEqual(['exempt']);
    expect(report.stays[0]?.countedRanges).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The membership table
// ---------------------------------------------------------------------------

describe('the State picker', () => {
  it('offers exactly the States the arithmetic resolves membership from', () => {
    for (const state of SCHENGEN_STATES) {
      expect(schengenState(state.code)).toBe(state);
      expect(state.since.length).toBe('YYYY-MM-DD'.length);
    }
    expect(schengenState('GB')).toBeNull();
    expect(schengenState('')).toBeNull();
  });

  it('is ordered alphabetically by English name in both locales', () => {
    // A dropdown's order states nothing, and an order that changed with the
    // language would move every row under a reader who switches part-way.
    const names = SCHENGEN_STATES.map((s) => s.name.en);
    expect([...names].sort()).toEqual(names);
  });

  it('carries the staged window only for the States that had one', () => {
    const staged = SCHENGEN_STATES.filter((s) => s.partialSince !== null).map((s) => s.code);
    expect([...staged].sort()).toEqual(['BG', 'RO']);
  });
});

// ---------------------------------------------------------------------------
// Reading the form
// ---------------------------------------------------------------------------

describe('reading the form', () => {
  const base: SchengenAnswers = {
    stays: [blankStayRow(stayRowKey(1))],
    referenceDate: '2026-07-25',
    plannedStart: '',
    plannedEnd: '',
    proposedDays: '',
    proposedFrom: '',
  };

  const row = (key: string, country: string, start: string, end: string): StayRow => ({
    key,
    country,
    start,
    end,
    exempt: false,
  });

  it('requires at least one stay, and points the complaint at a control', () => {
    const reading = readSchengenForm(base);

    expect(reading.query).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toEqual([
      stayFieldId(stayRowKey(1), 'country'),
    ]);
  });

  it('skips a row left completely alone', () => {
    const reading = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05'), blankStayRow('stay-2')],
    });

    expect(reading.issues).toEqual([]);
    expect(reading.query?.stays).toHaveLength(1);
  });

  it('refuses a row somebody started but did not finish', () => {
    // A half-entered stay would silently shorten a travel history, and a count
    // that quietly discards a trip is worse than one that refuses to run.
    const reading = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05'), row('stay-2', 'FR', '2026-08-01', '')],
    });

    expect(reading.query).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toEqual([stayFieldId('stay-2', 'end')]);
    expect(reading.issues[0]?.message.en).toMatch(/^Stay 2 —/);
    expect(reading.issues[0]?.message.es).toMatch(/^Estancia 2 —/);
  });

  it('refuses a departure before the arrival, and names both dates', () => {
    const reading = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-10', '2026-07-01')],
    });

    expect(reading.query).toBeNull();
    expect(reading.issues[0]?.message.en).toContain('2026-07-01');
    expect(reading.issues[0]?.message.en).toContain('2026-07-10');
  });

  it('rejects a State that is not in the membership table', () => {
    const reading = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'GB', '2026-07-01', '2026-07-05')],
    });

    expect(reading.query).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toContain(stayFieldId('stay-1', 'country'));
  });

  it('treats a proposed stay as optional but demands both halves once either is given', () => {
    const neither = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05')],
    });
    expect(neither.issues).toEqual([]);
    expect(neither.query?.proposedStayDays).toBeNull();

    const half = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05')],
      proposedDays: '14',
    });
    expect(half.query).toBeNull();
    expect(half.issues.map((i) => i.fieldId)).toEqual([FIELD.proposedFrom]);
  });

  it('bounds the proposed stay length inclusively', () => {
    const at = (days: string): readonly string[] =>
      readSchengenForm({
        ...base,
        stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05')],
        proposedDays: days,
        proposedFrom: '2026-08-01',
      }).issues.map((i) => i.fieldId);

    expect(at('1')).toEqual([]);
    expect(at('0')).toEqual([FIELD.proposedDays]);
    expect(at(String(MAX_PROPOSED_STAY_DAYS))).toEqual([]);
    expect(at(String(MAX_PROPOSED_STAY_DAYS + 1))).toEqual([FIELD.proposedDays]);
  });

  it('refuses a worst-day scan wider than the engine will accept, naming the width', () => {
    // Derived from the engine's own bound rather than hard-coded, so the test
    // still exercises the boundary if the bound moves. Catching the refusal as
    // a field error keeps the message beside the field that caused it.
    const start = isoDate('2026-01-01');
    const scan = (end: IsoDate): readonly string[] =>
      readSchengenForm({
        ...base,
        stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05')],
        plannedStart: start,
        plannedEnd: end,
      }).issues.map((i) => i.fieldId);

    expect(scan(addDays(start, SCHENGEN_MAX_SCAN_DAYS - 1))).toEqual([]);

    const tooWide = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05')],
      plannedStart: start,
      plannedEnd: addDays(start, SCHENGEN_MAX_SCAN_DAYS),
    });
    expect(tooWide.query).toBeNull();
    expect(tooWide.issues.map((i) => i.fieldId)).toEqual([FIELD.plannedEnd]);
    expect(tooWide.issues[0]?.message.en).toContain(String(SCHENGEN_MAX_SCAN_DAYS + 1));
  });

  it('gives every row of a loaded example a fresh key', () => {
    // A reused key lets a new row inherit an error message, a DOM id and a
    // React identity from the row that used to be in that position.
    const example = SCHENGEN_EXAMPLES[0];
    if (example === undefined) throw new Error('no examples');
    const first = answersFromExample(example, 1);
    const second = answersFromExample(example, first.nextKey);

    const keys = [...first.answers.stays, ...second.answers.stays].map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(second.nextKey).toBeGreaterThan(first.nextKey);
  });

  it('produces a status the page may show, classified and cited', () => {
    // `assessment` is the reader's own facts measured against a cited rule.
    // An empty citation list on an assessment is a defect in `@meridian/core`'s
    // own terms: it is a figure with nothing behind it.
    const reading = readSchengenForm({
      ...base,
      stays: [row('stay-1', 'ES', '2026-07-01', '2026-07-05')],
    });
    if (reading.query === null) throw new Error('the form did not parse');
    const report = run(reading.query);

    expect(report.status.value.daysUsed).toBe(5);
    expect(report.status.classification).toBe('assessment');
    expect(report.status.citationIds.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// The invented itineraries
// ---------------------------------------------------------------------------

describe('the invented itineraries', () => {
  it('are country codes and dates, and nothing else', () => {
    for (const example of SCHENGEN_EXAMPLES) {
      for (const s of example.stays) {
        expect(s.country).toMatch(/^[A-Z]{2}$/);
        expect(s.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(s.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('all parse and all compute', () => {
    for (const example of SCHENGEN_EXAMPLES) {
      const reading = readSchengenForm(answersFromExample(example, 1).answers);
      expect(reading.issues, `example ${example.id} does not parse`).toEqual([]);
      if (reading.query === null) throw new Error(`example ${example.id} produced no query`);
      const outcome = runSchengenCheck(reading.query);
      expect(outcome.ok, `example ${example.id} was refused`).toBe(true);
    }
  });

  it('cover each of the three outcomes the tool can report', () => {
    const outcomes = new Set(SCHENGEN_EXAMPLES.map((e) => fromExample(e.id).outcome));
    expect([...outcomes].sort()).toEqual(['over', 'undetermined', 'within']);
  });
});

describe('a reference date the engine cannot use', () => {
  it('comes back as a message rather than a thrown error', () => {
    // The form rejects everything the engine refuses, so this is unreachable
    // today. Rendering the message beats a blank panel and a console trace.
    const outcome = runSchengenCheck(
      query([stay('a', 'ES', '2026-07-01', '2026-07-05')], {
        proposedStayDays: 1.5 as unknown as number,
        proposedNotBefore: isoDate('2026-08-01') as IsoDate,
      }),
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message.length).toBeGreaterThan(0);
  });
});
