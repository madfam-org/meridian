/**
 * Turning what a person typed into facts, or into the list of things wrong.
 *
 * The dangerous direction on this rule is *smaller*. A form that counted
 * whichever rows happened to parse would report fewer days than the truth and
 * tell somebody they are inside an allowance they have already spent, so the
 * contract is all-or-nothing: `readSchengenForm` returns a query or `null`,
 * never a partial one. These tests are mostly about the ways a record can be
 * silently shortened.
 */

import { describe, expect, it } from 'vitest';

import {
  EMPTY_ANSWERS,
  FIELD,
  NEXT_STAY_KEY,
  answersFromExample,
  atStayLimit,
  blankStayRow,
  readSchengenForm,
  stateOptions,
  stayFieldId,
  stayRowKey,
  type SchengenAnswers,
  type StayRow,
} from '@/lib/schengen-form';
import {
  MAX_STAYS,
  SCHENGEN_EXAMPLES,
  SCHENGEN_STATES,
  countSchengenDays,
} from '@/lib/schengen';

function answers(stays: readonly Partial<StayRow>[], referenceDate = '2026-07-25'): SchengenAnswers {
  return {
    referenceDate,
    stays: stays.map((row, i) => ({
      key: row.key ?? stayRowKey(i + 1),
      country: row.country ?? '',
      start: row.start ?? '',
      end: row.end ?? '',
    })),
  };
}

const ONE_TRIP = { country: 'ES', start: '2026-04-27', end: '2026-07-25' } as const;

describe('the state the form starts in', () => {
  it('offers two rows, because the rule is about trips sharing one window', () => {
    expect(EMPTY_ANSWERS.stays).toHaveLength(2);
    expect(EMPTY_ANSWERS.stays.every((r) => r.country === '' && r.start === '' && r.end === ''))
      .toBe(true);
  });

  it('is a constant, so the server and the browser render the same first paint', () => {
    // A key generated at mount differs between the two renders and produces a
    // hydration mismatch on every load.
    expect(EMPTY_ANSWERS.stays.map((r) => r.key)).toEqual(['stay-1', 'stay-2']);
    expect(NEXT_STAY_KEY).toBe(3);
  });

  it('pre-fills the reference date rather than leaving it blank', () => {
    expect(EMPTY_ANSWERS.referenceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('gives every control in a row a distinct, stable DOM id', () => {
    const ids = ['country', 'start', 'end'].map((part) =>
      stayFieldId('stay-1', part as 'country' | 'start' | 'end'),
    );
    expect(new Set(ids).size).toBe(3);
    expect(ids).toEqual(['sch-stay-1-country', 'sch-stay-1-start', 'sch-stay-1-end']);
    expect(stayFieldId('stay-2', 'country')).not.toBe(stayFieldId('stay-1', 'country'));
    expect(blankStayRow('stay-9')).toEqual({ key: 'stay-9', country: '', start: '', end: '' });
  });
});

describe('a blank row is skipped; a touched row must be complete', () => {
  it('reads one trip out of a form whose second row was never touched', () => {
    const reading = readSchengenForm(answers([ONE_TRIP, {}]));
    expect(reading.issues).toEqual([]);
    expect(reading.query?.stays).toHaveLength(1);
    expect(reading.query?.stays[0]?.country).toBe('ES');
    expect(reading.query?.referenceDate).toBe('2026-07-25');
  });

  it('refuses a half-entered trip rather than quietly dropping it', () => {
    // A dropped row shortens a travel history, and a count that silently loses
    // a trip is worse than one that refuses to run.
    const reading = readSchengenForm(answers([ONE_TRIP, { country: 'FR' }]));
    expect(reading.query).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toEqual([
      'sch-stay-2-start',
      'sch-stay-2-end',
    ]);
  });

  it('refuses a row with only a date in it', () => {
    const reading = readSchengenForm(answers([ONE_TRIP, { start: '2026-05-01' }]));
    expect(reading.query).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toContain('sch-stay-2-country');
    expect(reading.issues.map((i) => i.fieldId)).toContain('sch-stay-2-end');
  });

  it('numbers each complaint by the row it belongs to', () => {
    // "Enter a date" three times tells a reader nothing about where to go.
    const reading = readSchengenForm(answers([{ country: 'ES' }, { country: 'FR' }]));
    expect(reading.issues.filter((i) => i.message.en.startsWith('Trip 1 —'))).toHaveLength(2);
    expect(reading.issues.filter((i) => i.message.en.startsWith('Trip 2 —'))).toHaveLength(2);
    for (const complaint of reading.issues) {
      expect(complaint.message.es).toMatch(/^Viaje [12] —/);
    }
  });

  it('asks for at least one trip when every row is blank', () => {
    const reading = readSchengenForm(EMPTY_ANSWERS);
    expect(reading.query).toBeNull();
    expect(reading.issues).toHaveLength(1);
    // Attached to the first row's first control, so the summary link lands
    // somewhere a person can start typing.
    expect(reading.issues[0]?.fieldId).toBe('sch-stay-1-country');
    expect(reading.issues[0]?.message.en).toContain('at least one trip');
  });

  it('falls back to the reference field when there is no row at all', () => {
    const reading = readSchengenForm({ stays: [], referenceDate: '2026-07-25' });
    expect(reading.issues[0]?.fieldId).toBe(FIELD.reference);
  });
});

describe('dates that cannot be true', () => {
  it('refuses a departure before the arrival, and says both dates back', () => {
    const reading = readSchengenForm(
      answers([{ country: 'ES', start: '2026-07-25', end: '2026-07-01' }]),
    );
    expect(reading.query).toBeNull();
    expect(reading.issues).toHaveLength(1);
    expect(reading.issues[0]?.fieldId).toBe('sch-stay-1-end');
    expect(reading.issues[0]?.message.en).toContain('2026-07-01');
    expect(reading.issues[0]?.message.en).toContain('2026-07-25');
    // And it explains the thing that made the reader type it that way.
    expect(reading.issues[0]?.message.en).toContain('same-day trip');
  });

  it('accepts a same-day trip carrying the same date twice', () => {
    const reading = readSchengenForm(
      answers([{ country: 'ES', start: '2026-07-20', end: '2026-07-20' }]),
    );
    expect(reading.issues).toEqual([]);
    expect(reading.query?.stays[0]?.range).toEqual({ start: '2026-07-20', end: '2026-07-20' });
  });

  it('refuses a malformed date without also complaining about the ordering', () => {
    const reading = readSchengenForm(
      answers([{ country: 'ES', start: '2026-02-30', end: '2026-07-01' }]),
    );
    expect(reading.issues).toHaveLength(1);
    expect(reading.issues[0]?.fieldId).toBe('sch-stay-1-start');
    expect(reading.query).toBeNull();
  });

  it('refuses a State the membership table does not hold, naming the code', () => {
    const reading = readSchengenForm(answers([{ ...ONE_TRIP, country: 'GB' }]));
    expect(reading.query).toBeNull();
    expect(reading.issues[0]?.fieldId).toBe('sch-stay-1-country');
    expect(reading.issues[0]?.message.en).toContain('GB');
  });

  it('accepts a lower-case code by normalising it, since a paste is not a mistake', () => {
    const reading = readSchengenForm(answers([{ ...ONE_TRIP, country: ' es ' }]));
    expect(reading.issues).toEqual([]);
    expect(reading.query?.stays[0]?.country).toBe('ES');
  });
});

describe('the day being measured', () => {
  it('refuses a blank reference date', () => {
    const reading = readSchengenForm(answers([ONE_TRIP], ''));
    expect(reading.query).toBeNull();
    expect(reading.issues.map((i) => i.fieldId)).toEqual([FIELD.reference]);
  });

  it('refuses a reference date that is not a calendar date', () => {
    const reading = readSchengenForm(answers([ONE_TRIP], '2026-02-30'));
    expect(reading.query).toBeNull();
    expect(reading.issues[0]?.fieldId).toBe(FIELD.reference);
  });

  it('lists trip complaints before the reference complaint, top to bottom', () => {
    // The summary is read in order; a list that jumps around the form is a list
    // somebody works through twice.
    const reading = readSchengenForm(answers([{ country: 'ES' }], 'not-a-date'));
    const ids = reading.issues.map((i) => i.fieldId);
    expect(ids[ids.length - 1]).toBe(FIELD.reference);
    expect(ids.slice(0, -1).every((id) => id.startsWith('sch-stay-'))).toBe(true);
  });
});

describe('there is no partial query', () => {
  it('returns null whenever anything is wrong, even if other rows parsed', () => {
    const reading = readSchengenForm(
      answers([ONE_TRIP, { country: 'FR', start: '2026-06-01', end: 'oops' }]),
    );
    expect(reading.issues.length).toBeGreaterThan(0);
    expect(reading.query).toBeNull();
  });

  it('returns an empty issue list whenever it returns a query', () => {
    const reading = readSchengenForm(answers([ONE_TRIP]));
    expect(reading.query).not.toBeNull();
    expect(reading.issues).toEqual([]);
  });
});

describe('the row limit', () => {
  it('is reached at MAX_STAYS rows and not before', () => {
    const rows = (n: number) =>
      answers(Array.from({ length: n }, (_, i) => ({ key: stayRowKey(i + 1) })));
    expect(atStayLimit(rows(MAX_STAYS - 1))).toBe(false);
    expect(atStayLimit(rows(MAX_STAYS))).toBe(true);
    expect(atStayLimit(rows(MAX_STAYS + 1))).toBe(true);
  });

  it('still reads a full form of MAX_STAYS trips', () => {
    // The count is taken over a 180-day window whatever the input size, so the
    // limit must not be load-bearing for correctness.
    const stays = Array.from({ length: MAX_STAYS }, (_, i) => ({
      key: stayRowKey(i + 1),
      country: 'ES',
      start: `2026-0${(i % 9) + 1}-01`,
      end: `2026-0${(i % 9) + 1}-02`,
    }));
    const reading = readSchengenForm(answers(stays));
    expect(reading.issues).toEqual([]);
    expect(reading.query?.stays).toHaveLength(MAX_STAYS);
  });
});

describe('the State picker', () => {
  it('leads with a placeholder that is not a State', () => {
    const options = stateOptions('en');
    expect(options[0]?.value).toBe('');
    expect(options[0]?.label).toBe('Choose a State');
    expect(stateOptions('es')[0]?.label).toBe('Elija un Estado');
  });

  it('offers exactly the Schengen States, because only they consume the allowance', () => {
    const values = stateOptions('en').slice(1).map((o) => o.value);
    expect(values).toEqual(SCHENGEN_STATES.map((s) => s.code));
    expect(values).not.toContain('GB');
    expect(values).not.toContain('IE');
  });

  it('names each State in the served locale', () => {
    const en = stateOptions('en');
    const es = stateOptions('es');
    expect(en.find((o) => o.value === 'ES')?.label).toBe('Spain');
    expect(es.find((o) => o.value === 'ES')?.label).toBe('España');
    expect(es.find((o) => o.value === 'DE')?.label).toBe('Alemania');
  });

  it('keeps the same row order in both languages', () => {
    // A picker whose order changes with the language is harder to help somebody
    // else through over the phone, and alphabetical is a scan order either way.
    expect(stateOptions('es').map((o) => o.value)).toEqual(stateOptions('en').map((o) => o.value));
  });
});

describe('the worked itineraries', () => {
  it('every shipped example reads cleanly and counts', () => {
    for (const example of SCHENGEN_EXAMPLES) {
      const loaded = answersFromExample(example, NEXT_STAY_KEY);
      const reading = readSchengenForm(loaded.answers);
      expect(reading.issues, example.id).toEqual([]);
      expect(reading.query, example.id).not.toBeNull();
    }
  });

  it('produces the numbers the examples claim in their own notes', () => {
    const run = (id: string) => {
      const example = SCHENGEN_EXAMPLES.find((e) => e.id === id);
      if (example === undefined) throw new Error(`no example '${id}'`);
      const reading = readSchengenForm(answersFromExample(example, NEXT_STAY_KEY).answers);
      if (reading.query === null) throw new Error(`example '${id}' did not read`);
      return countSchengenDays(reading.query);
    };

    // "Both endpoints count, so this is 90 and not 89."
    expect(run('ninety').daysUsed).toBe(90);
    expect(run('ninety').outcome).toBe('within');
    // "One day is the whole difference between a lawful stay and an overstay."
    expect(run('ninety-one').daysUsed).toBe(91);
    expect(run('ninety-one').outcome).toBe('over');
    expect(run('ninety-one').daysOverLimit).toBe(1);
    // "A stay whose first weeks have already aged out of the window."
    const edge = run('edge');
    expect(edge.stays).toHaveLength(3);
    expect(edge.stays[0]?.uncounted.map((u) => u.key)).toContain('outside-window');
    expect(edge.daysUsed).toBeLessThan(
      edge.stays.reduce((sum, s) => sum + s.stayDays, 0),
    );
  });

  it('carries no personal data — country codes and dates and nothing else', () => {
    // The repository holds no real personal data anywhere, including examples.
    for (const example of SCHENGEN_EXAMPLES) {
      for (const stay of example.stays) {
        expect(stay.country, example.id).toMatch(/^[A-Z]{2}$/);
        expect(stay.start, example.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(stay.end, example.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Object.keys(stay).sort()).toEqual(['country', 'end', 'start']);
      }
    }
  });

  it('allocates fresh row keys so no row inherits an error message or a DOM id', () => {
    const example = SCHENGEN_EXAMPLES.find((e) => e.id === 'edge');
    if (example === undefined) throw new Error('no edge example');
    const loaded = answersFromExample(example, 7);
    expect(loaded.answers.stays.map((r) => r.key)).toEqual(['stay-7', 'stay-8', 'stay-9']);
    expect(loaded.nextKey).toBe(10);
    // Loading twice in a row must not reuse a key from the first load.
    const again = answersFromExample(example, loaded.nextKey);
    expect(again.answers.stays.map((r) => r.key)).toEqual(['stay-10', 'stay-11', 'stay-12']);
  });

  it('leaves one blank row when an itinerary has no trips in it', () => {
    const loaded = answersFromExample(
      { id: 'x', label: { en: '', es: '' }, note: { en: '', es: '' }, referenceDate: '2026-07-25', stays: [] },
      4,
    );
    // A list with nothing in it offers nowhere to type and no way back.
    expect(loaded.answers.stays).toHaveLength(1);
    expect(loaded.answers.stays[0]?.key).toBe('stay-4');
    expect(loaded.nextKey).toBe(5);
  });
});
