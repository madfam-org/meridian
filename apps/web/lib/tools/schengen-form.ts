/**
 * What the 90/180 form holds, and how it becomes a query the engine will accept.
 *
 * Split from `lib/tools/schengen.ts` because the two answer different questions.
 * That module is the view model: given facts, what does the rule say. This one
 * is everything between a person typing and those facts existing — the field
 * ids, the shape of the rows, and the reading that turns strings into
 * `IsoDate`s or into a list of complaints.
 *
 * Three properties are load-bearing here.
 *
 * **No `Date`, anywhere.** Every date field goes through `readDateField`, which
 * parses with `@meridian/core`'s `tryIsoDate`. `new Date('2026-02-30')` rolls
 * silently to 1 March and `new Date('2026-07-25')` is midnight UTC — which is
 * 2026-07-24 in Mexico City, and one day is the entire difference between a
 * lawful 90-day stay and an overstay. Nothing in this file constructs a `Date`.
 *
 * **A blank row is not an error.** A row with nothing in it is skipped, so a
 * stray empty row left behind by "add a stay" does not block a submission. A
 * row with *something* in it must be complete, because a half-entered stay
 * would silently shorten a travel history, and a day count that quietly
 * discards a trip is worse than one that refuses to run.
 *
 * **Every complaint names its row.** An error summary listing "Enter a date"
 * four times tells a reader nothing. Each message carries the stay it belongs
 * to and links to the control that holds it.
 *
 * The output is a `SchengenQuery` or `null`; there is no partial query. A form
 * that computed a total from the fields that happened to parse would report a
 * smaller number than the truth, and on this rule a smaller number is the
 * dangerous direction.
 */

import type { DateRange, IsoDate } from '@meridian/core';
import { compareDates, dateRange, diffDays } from '@meridian/core';
import { SCHENGEN_MAX_SCAN_DAYS } from '@meridian/presence';

import { bi, type Bi } from '@/lib/i18n';
import {
  DEFAULT_REFERENCE_DATE,
  MAX_PROPOSED_STAY_DAYS,
  MAX_STAYS,
  SCHENGEN_STATES,
  schengenState,
  type SchengenExample,
  type SchengenQuery,
  type StayFacts,
} from '@/lib/tools/schengen';
import type { SelectOption } from '@/components/tools/Field';
import {
  collect,
  issue,
  readDateField,
  readIntegerField,
  type FieldIssue,
} from '@/lib/tools/validation';

// ---------------------------------------------------------------------------
// Field identity
// ---------------------------------------------------------------------------

/**
 * DOM ids for the fields there is exactly one of.
 *
 * Stable strings rather than generated ones: the error summary links to
 * `#id`, and a link into a control whose id changed between renders lands
 * nowhere.
 */
export const FIELD = {
  reference: 'schengen-reference-date',
  plannedStart: 'schengen-planned-start',
  plannedEnd: 'schengen-planned-end',
  proposedDays: 'schengen-proposed-days',
  proposedFrom: 'schengen-proposed-from',
} as const;

/** The four controls a stay row carries. */
export type StayFieldPart = 'country' | 'start' | 'end' | 'exempt';

/** DOM id of one control inside one stay row. Unique because row keys are. */
export function stayFieldId(rowKey: string, part: StayFieldPart): string {
  return `schengen-${rowKey}-${part}`;
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
  /** Stable per-row key. Drives the React key, the DOM ids, and the ledger id. */
  readonly key: string;
  /** ISO 3166-1 alpha-2, or the empty string before a State is chosen. */
  readonly country: string;
  readonly start: string;
  readonly end: string;
  /** The traveller held that State's own residence permit or long-stay visa. */
  readonly exempt: boolean;
}

export interface SchengenAnswers {
  readonly stays: readonly StayRow[];
  readonly referenceDate: string;
  readonly plannedStart: string;
  readonly plannedEnd: string;
  readonly proposedDays: string;
  readonly proposedFrom: string;
}

export function blankStayRow(key: string): StayRow {
  return { key, country: '', start: '', end: '', exempt: false };
}

/** Prefix for generated row keys. `stay-1`, `stay-2`, and so on. */
const KEY_PREFIX = 'stay';

export function stayRowKey(n: number): string {
  return `${KEY_PREFIX}-${n}`;
}

/**
 * The state the form starts in: one empty row and the build's reference date.
 *
 * A constant rather than a factory, so the first render is identical on the
 * server and in the browser. A key generated at mount would differ between the
 * two and produce a hydration mismatch on every load.
 */
export const EMPTY_ANSWERS: SchengenAnswers = {
  stays: [blankStayRow(stayRowKey(1))],
  referenceDate: DEFAULT_REFERENCE_DATE,
  plannedStart: '',
  plannedEnd: '',
  proposedDays: '',
  proposedFrom: '',
};

/** The number the next generated key takes, given that `EMPTY_ANSWERS` used 1. */
export const NEXT_STAY_KEY = 2;

// ---------------------------------------------------------------------------
// The State picker
// ---------------------------------------------------------------------------

const CHOOSE_STATE: Bi = bi('Choose a State', 'Elija un Estado');

/**
 * The options offered for a stay's country.
 *
 * Only Schengen States appear, and the list is the membership table itself, so
 * a State cannot be offered without the accession date the arithmetic will use
 * for it. Time spent outside the area does not consume the allowance and is not
 * asked for — a form that collected it and then discarded it would be asking a
 * person to type their whole life for nothing.
 *
 * Alphabetical by English name. That is the order a person scans a list in, not
 * a ranking of anything.
 *
 * Names are flattened to a plain string rather than passed as a `Bi`, and
 * collapsed to one word where both languages spell the State identically. An
 * `<option>` may contain only text, so the pair cannot carry its own `lang`
 * attributes here in any case, and a list reading "Austria · Austria" twenty
 * times is harder to scan without being any more bilingual.
 */
function stateOptionLabel(name: Bi): string {
  return name.en === name.es ? name.en : `${name.en} · ${name.es}`;
}

export const STATE_OPTIONS: readonly SelectOption[] = [
  { value: '', label: CHOOSE_STATE },
  ...SCHENGEN_STATES.map((state): SelectOption => ({
    value: state.code,
    label: stateOptionLabel(state.name),
  })),
];

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
    row.country.trim().length === 0 &&
    row.start.trim().length === 0 &&
    row.end.trim().length === 0 &&
    !row.exempt
  );
}

/**
 * Re-issue a complaint with the row it belongs to.
 *
 * The summary shows messages, not fields, so "Enter a date in YYYY-MM-DD form"
 * repeated three times is three identical lines pointing at three different
 * controls. Naming the row is what makes the list readable.
 */
function inStay(index: number, found: FieldIssue | null): FieldIssue | null {
  if (found === null) return null;
  const n = index + 1;
  return issue(
    found.fieldId,
    bi(`Stay ${n} — ${found.message.en}`, `Estancia ${n} — ${found.message.es}`),
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
                `Stay ${index + 1} — choose the State this stay was in.`,
                `Estancia ${index + 1} — elija el Estado de esta estancia.`,
              )
            : bi(
                `Stay ${index + 1} — ${code} is not a State in the Schengen membership table this tool counts against.`,
                `Estancia ${index + 1} — ${code} no es un Estado de la tabla de pertenencia a Schengen que utiliza esta herramienta.`,
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
            `Stay ${index + 1} — the day you left (${end.date}) is before the day you entered (${start.date}). Both days count as days of presence, so a same-day trip has the same date twice.`,
            `Estancia ${index + 1} — el día de salida (${end.date}) es anterior al de entrada (${start.date}). Ambos días cuentan como días de presencia, de modo que un viaje de ida y vuelta en el día lleva dos veces la misma fecha.`,
          ),
        ),
      );
    }

    if (state !== null && start.date !== null && end.date !== null && dateIssues.length === 0) {
      if (compareDates(start.date, end.date) <= 0) {
        stays.push({
          id: row.key,
          country: state.code,
          range: dateRange(start.date, end.date),
          exempt: row.exempt,
        });
      }
    }
  });

  return { issues, stays, attempted };
}

interface PlannedReading {
  readonly issues: readonly FieldIssue[];
  readonly range: DateRange | null;
}

function readPlanned(answers: SchengenAnswers): PlannedReading {
  const rawStart = answers.plannedStart.trim();
  const rawEnd = answers.plannedEnd.trim();
  if (rawStart.length === 0 && rawEnd.length === 0) return { issues: [], range: null };

  const start = readDateField(FIELD.plannedStart, answers.plannedStart, { required: true });
  const end = readDateField(FIELD.plannedEnd, answers.plannedEnd, { required: true });
  const issues = collect([start.issue, end.issue]);
  if (issues.length > 0 || start.date === null || end.date === null) {
    return { issues, range: null };
  }

  if (compareDates(start.date, end.date) > 0) {
    return {
      issues: [
        issue(
          FIELD.plannedEnd,
          bi(
            `The last day of the range (${end.date}) is before the first (${start.date}).`,
            `El último día del intervalo (${end.date}) es anterior al primero (${start.date}).`,
          ),
        ),
      ],
      range: null,
    };
  }

  // `schengenWorstDay` refuses a scan wider than this and says so by throwing.
  // Catching it as a field error keeps the message next to the field that
  // caused it instead of in a panel about something else.
  const span = diffDays(start.date, end.date) + 1;
  if (span > SCHENGEN_MAX_SCAN_DAYS) {
    return {
      issues: [
        issue(
          FIELD.plannedEnd,
          bi(
            `That range is ${span} days. The worst-day scan covers at most ${SCHENGEN_MAX_SCAN_DAYS} days at a time.`,
            `Ese intervalo es de ${span} días. El análisis del peor día abarca como máximo ${SCHENGEN_MAX_SCAN_DAYS} días cada vez.`,
          ),
        ),
      ],
      range: null,
    };
  }

  return { issues: [], range: { start: start.date, end: end.date } };
}

interface ProposedReading {
  readonly issues: readonly FieldIssue[];
  readonly days: number | null;
  readonly notBefore: IsoDate | null;
}

function readProposed(answers: SchengenAnswers): ProposedReading {
  const rawDays = answers.proposedDays.trim();
  const rawFrom = answers.proposedFrom.trim();
  if (rawDays.length === 0 && rawFrom.length === 0) {
    return { issues: [], days: null, notBefore: null };
  }

  const days = readIntegerField(FIELD.proposedDays, answers.proposedDays, {
    required: true,
    min: 1,
    max: MAX_PROPOSED_STAY_DAYS,
  });
  const from = readDateField(FIELD.proposedFrom, answers.proposedFrom, { required: true });
  const issues = collect([days.issue, from.issue]);
  if (issues.length > 0 || days.value === null || from.date === null) {
    return { issues, days: null, notBefore: null };
  }

  return { issues: [], days: days.value, notBefore: from.date };
}

/**
 * Turn the form into a query, or into the list of things wrong with it.
 *
 * Issues come back in the order the fields appear on screen, because the
 * summary is read top to bottom and a list that jumps around the form is a
 * list somebody works through twice.
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
          'Enter at least one stay: the State, the day you entered and the day you left.',
          'Introduzca al menos una estancia: el Estado, el día de entrada y el día de salida.',
        ),
      ),
    );
  }

  const reference = readDateField(FIELD.reference, answers.referenceDate, { required: true });
  if (reference.issue !== null) issues.push(reference.issue);

  const planned = readPlanned(answers);
  issues.push(...planned.issues);

  const proposed = readProposed(answers);
  issues.push(...proposed.issues);

  if (issues.length > 0 || reference.date === null) {
    return { issues, query: null };
  }

  return {
    issues: [],
    query: {
      stays: stays.stays,
      referenceDate: reference.date,
      plannedRange: planned.range,
      proposedStayDays: proposed.days,
      proposedNotBefore: proposed.notBefore,
    },
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
 * Fill the form from one of the invented itineraries in `lib/tools/schengen.ts`.
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
    exempt: stay.exempt === true,
  }));

  return {
    answers: {
      // An example with no stays would leave the form with no rows and nothing
      // to type into. None of them is empty today; the fallback costs one line
      // and removes the possibility.
      stays: stays.length > 0 ? stays : [blankStayRow(stayRowKey(firstKey))],
      referenceDate: example.referenceDate,
      plannedStart: example.plannedStart,
      plannedEnd: example.plannedEnd,
      proposedDays: example.proposedDays,
      proposedFrom: example.proposedFrom,
    },
    nextKey: firstKey + Math.max(stays.length, 1),
  };
}

/** True once the form holds as many rows as it will take. */
export function atStayLimit(answers: SchengenAnswers): boolean {
  return answers.stays.length >= MAX_STAYS;
}
