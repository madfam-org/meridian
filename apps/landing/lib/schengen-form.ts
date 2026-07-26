/**
 * What the calculator holds, and how it becomes a query the counter accepts.
 *
 * Split from `lib/schengen.ts` because the two answer different questions. That
 * module is the rule: given facts, what does art. 6 say. This one is everything
 * between a person typing and those facts existing — the field ids, the shape
 * of a row, and the reading that turns strings into `IsoDate`s or into a list
 * of complaints.
 *
 * Three properties are load-bearing.
 *
 * **No `Date`, anywhere.** Every date goes through `readDateField`, which parses
 * with `@meridian/core`'s `tryIsoDate`.
 *
 * **A blank row is not an error.** A row nobody touched is skipped, so the
 * second starter row does not block a one-trip submission. A row with
 * *something* in it must be complete, because a half-entered stay silently
 * shortens a travel history, and a day count that quietly drops a trip is worse
 * than one that refuses to run.
 *
 * **Every complaint names its row.** An error summary listing "Enter a date"
 * three times tells a reader nothing.
 *
 * The output is a `SchengenQuery` or `null`; there is no partial query. A form
 * that counted whichever fields happened to parse would report a smaller number
 * than the truth, and on this rule smaller is the dangerous direction.
 */

import { compareDates, dateRange } from '@meridian/core';

import { bi, pick, type Locale } from '@/lib/i18n';
import {
  DEFAULT_REFERENCE_DATE,
  MAX_STAYS,
  SCHENGEN_STATES,
  schengenState,
  type SchengenExample,
  type SchengenQuery,
  type StayFacts,
} from '@/lib/schengen';
import { collect, issue, readDateField, type FieldIssue } from '@/lib/validation';

// ---------------------------------------------------------------------------
// Field identity
// ---------------------------------------------------------------------------

/**
 * DOM ids for the fields there is exactly one of.
 *
 * Stable strings rather than generated ones: the error summary links to `#id`,
 * and a link into a control whose id changed between renders lands nowhere.
 */
export const FIELD = {
  reference: 'sch-reference-date',
} as const;

/** The three controls a stay row carries. */
export type StayFieldPart = 'country' | 'start' | 'end';

/** DOM id of one control inside one row. Unique because row keys are. */
export function stayFieldId(rowKey: string, part: StayFieldPart): string {
  return `sch-${rowKey}-${part}`;
}

// ---------------------------------------------------------------------------
// The form's own state
// ---------------------------------------------------------------------------

/**
 * One row of the travel history, exactly as typed.
 *
 * Everything is a string, including the dates: a half-typed value must survive
 * a re-render unchanged, and a field that coerces as you type takes the value
 * away from the person entering it.
 */
export interface StayRow {
  /** Stable per-row key. Drives the React key, the DOM ids and the row id. */
  readonly key: string;
  /** ISO 3166-1 alpha-2, or the empty string before a State is chosen. */
  readonly country: string;
  readonly start: string;
  readonly end: string;
}

export interface SchengenAnswers {
  readonly stays: readonly StayRow[];
  readonly referenceDate: string;
}

export function blankStayRow(key: string): StayRow {
  return { key, country: '', start: '', end: '' };
}

/** Prefix for generated row keys. `stay-1`, `stay-2`, and so on. */
export function stayRowKey(n: number): string {
  return `stay-${n}`;
}

/**
 * The state the form starts in: two empty rows and the build's reference date.
 *
 * Two rows rather than one because the rule's whole difficulty is that separate
 * trips share one window, and a form offering a single row quietly suggests
 * otherwise.
 *
 * A constant rather than a factory, so the first render is identical on the
 * server and in the browser. A key generated at mount would differ between the
 * two and produce a hydration mismatch on every load.
 */
export const EMPTY_ANSWERS: SchengenAnswers = {
  stays: [blankStayRow(stayRowKey(1)), blankStayRow(stayRowKey(2))],
  referenceDate: DEFAULT_REFERENCE_DATE,
};

/** The number the next generated key takes, given that `EMPTY_ANSWERS` used 1 and 2. */
export const NEXT_STAY_KEY = 3;

// ---------------------------------------------------------------------------
// The State picker
// ---------------------------------------------------------------------------

export interface StateOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Options for a row's State, in the served locale.
 *
 * A function rather than a constant, because the labels are country names and
 * those differ between the two languages. An `<option>` may hold only text —
 * it cannot carry a `lang` attribute on part of itself — so a list that showed
 * both names would be a list of unmarked language switches, which is exactly
 * the arrangement this application removed everywhere else.
 *
 * The order is the one `SCHENGEN_STATES` was sorted into, which is alphabetical
 * by English name. Re-sorting per locale would be more correct for a Spanish
 * reader and is deliberately not done here: the ordering is the same fact in
 * both languages, and a picker whose row order changes with the language is
 * harder to help somebody else through over the phone. Alphabetical is a scan
 * order, not a ranking, in either language.
 */
export function stateOptions(locale: Locale): readonly StateOption[] {
  return [
    { value: '', label: pick(CHOOSE_A_STATE, locale) },
    ...SCHENGEN_STATES.map((state) => ({
      value: state.code,
      label: pick(state.name, locale),
    })),
  ];
}

const CHOOSE_A_STATE = bi('Choose a State', 'Elija un Estado');

// ---------------------------------------------------------------------------
// Reading the form
// ---------------------------------------------------------------------------

export interface FormReading {
  readonly issues: readonly FieldIssue[];
  /** `null` whenever `issues` is non-empty. There is no partial query. */
  readonly query: SchengenQuery | null;
}

/** True when a row has been left completely alone. Such rows are skipped. */
function isBlankRow(row: StayRow): boolean {
  return (
    row.country.trim().length === 0 && row.start.trim().length === 0 && row.end.trim().length === 0
  );
}

/** Re-issue a complaint with the row it belongs to, so the summary is readable. */
function inStay(index: number, found: FieldIssue | null): FieldIssue | null {
  if (found === null) return null;
  const n = index + 1;
  return issue(
    found.fieldId,
    bi(`Trip ${n} — ${found.message.en}`, `Viaje ${n} — ${found.message.es}`),
  );
}

interface StayReading {
  readonly issues: readonly FieldIssue[];
  readonly stays: readonly StayFacts[];
  /** Rows the reader put something in, complete or not. */
  readonly attempted: number;
}

function readStays(rows: readonly StayRow[]): StayReading {
  const issues: FieldIssue[] = [];
  const stays: StayFacts[] = [];
  let attempted = 0;

  rows.forEach((row, index) => {
    if (isBlankRow(row)) return;
    attempted += 1;

    const code = row.country.trim().toUpperCase();
    const state = code.length === 0 ? null : schengenState(code);
    if (state === null) {
      issues.push(
        issue(
          stayFieldId(row.key, 'country'),
          code.length === 0
            ? bi(
                `Trip ${index + 1} — choose the State this trip was in.`,
                `Viaje ${index + 1} — elija el Estado de este viaje.`,
              )
            : bi(
                `Trip ${index + 1} — ${code} is not a State in the Schengen membership table this calculator counts against.`,
                `Viaje ${index + 1} — ${code} no es un Estado de la tabla de pertenencia a Schengen que utiliza esta calculadora.`,
              ),
        ),
      );
    }

    const startId = stayFieldId(row.key, 'start');
    const endId = stayFieldId(row.key, 'end');
    const start = readDateField(startId, row.start, { required: true });
    const end = readDateField(endId, row.end, { required: true });

    const dateIssues = collect([inStay(index, start.issue), inStay(index, end.issue)]);
    issues.push(...dateIssues);

    if (start.date !== null && end.date !== null && compareDates(start.date, end.date) > 0) {
      issues.push(
        issue(
          endId,
          bi(
            `Trip ${index + 1} — the day you left (${end.date}) is before the day you arrived (${start.date}). Both days count as days of presence, so a same-day trip carries the same date twice.`,
            `Viaje ${index + 1} — el día de salida (${end.date}) es anterior al de llegada (${start.date}). Ambos días cuentan como días de presencia, de modo que un viaje de ida y vuelta en el día lleva dos veces la misma fecha.`,
          ),
        ),
      );
      return;
    }

    if (state !== null && start.date !== null && end.date !== null && dateIssues.length === 0) {
      stays.push({
        id: row.key,
        country: state.code,
        range: dateRange(start.date, end.date),
      });
    }
  });

  return { issues, stays, attempted };
}

/**
 * Turn the form into a query, or into the list of things wrong with it.
 *
 * Issues come back in the order the fields appear on screen, because the
 * summary is read top to bottom and a list that jumps around the form is a list
 * somebody works through twice.
 */
export function readSchengenForm(answers: SchengenAnswers): FormReading {
  const stays = readStays(answers.stays);
  const issues: FieldIssue[] = [...stays.issues];

  if (stays.attempted === 0) {
    const first = answers.stays[0];
    issues.push(
      issue(
        first === undefined ? FIELD.reference : stayFieldId(first.key, 'country'),
        bi(
          'Enter at least one trip: the State, the day you arrived and the day you left.',
          'Introduzca al menos un viaje: el Estado, el día de llegada y el día de salida.',
        ),
      ),
    );
  }

  const reference = readDateField(FIELD.reference, answers.referenceDate, { required: true });
  if (reference.issue !== null) issues.push(reference.issue);

  if (issues.length > 0 || reference.date === null) return { issues, query: null };

  return {
    issues: [],
    query: { stays: stays.stays, referenceDate: reference.date },
  };
}

// ---------------------------------------------------------------------------
// Worked inputs
// ---------------------------------------------------------------------------

export interface LoadedExample {
  readonly answers: SchengenAnswers;
  /** The number the next generated key should take. */
  readonly nextKey: number;
}

/**
 * Fill the form from one of the invented itineraries.
 *
 * Fresh keys are allocated from `firstKey` rather than reused, so no row of the
 * new input can inherit an error message, a DOM id or a React identity from the
 * row that used to be in that position.
 */
export function answersFromExample(example: SchengenExample, firstKey: number): LoadedExample {
  const stays = example.stays.map((stay, index): StayRow => ({
    key: stayRowKey(firstKey + index),
    country: stay.country,
    start: stay.start,
    end: stay.end,
  }));

  return {
    answers: {
      stays: stays.length > 0 ? stays : [blankStayRow(stayRowKey(firstKey))],
      referenceDate: example.referenceDate,
    },
    nextKey: firstKey + Math.max(stays.length, 1),
  };
}

/** True once the form holds as many rows as it will take. */
export function atStayLimit(answers: SchengenAnswers): boolean {
  return answers.stays.length >= MAX_STAYS;
}
