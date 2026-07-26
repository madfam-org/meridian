/**
 * The Schengen 90/180 tool's view model.
 *
 * `@meridian/presence` answers three different questions about the short-stay
 * allowance, and a calculator that asks only the first is the calculator people
 * already have:
 *
 *  1. {@link assessSchengenStatus} — the position on one named day, with the
 *     window it was measured over and the per-stay attribution that produced
 *     the total.
 *  2. {@link assessSchengenWorstDay} — the *highest* usage across a range. The
 *     window slides underneath a traveller, so a trip that is lawful on the day
 *     it starts can breach on its twelfth day and be lawful again by the day it
 *     ends. Checking the departure date answers a question nobody asked.
 *  3. {@link assessSchengenNextEntry} — the earliest day on or after a given
 *     date on which every day of a stay of N days would be inside the
 *     allowance. Reporting the first date the arithmetic permits is a
 *     measurement; saying somebody should travel then would be advice, and this
 *     module produces neither the words nor the ordering that would make one.
 *
 * Everything here is pure computation over values the caller supplies. There is
 * no clock read, no `Date`, no I/O, and no storage: the reference date is a
 * parameter, exactly as it is in every package under `packages/`.
 *
 * ── What this module adds to the engine's answer ─────────────────────────────
 *
 * The engine returns the days that *did* charge against the allowance. A person
 * looking at a number smaller than the length of their trips needs to know
 * which days fell out and why, and there are four different reasons, which are
 * not interchangeable:
 *
 *   - the day was outside the 180-day window;
 *   - the State was not yet in the Schengen area on that day (Croatia before
 *     2023-01-01 did not consume anybody's allowance);
 *   - the day falls in a staged-accession window, where the answer is genuinely
 *     unresolved — see {@link AmbiguousPeriod};
 *   - the traveller held that State's own residence permit or long-stay visa,
 *     so the day was not a short stay at all.
 *
 * {@link StayAnalysis} separates them, using the same
 * `SCHENGEN_MEMBERSHIP` table the engine resolves membership from, so the
 * explanation cannot drift from the arithmetic it explains.
 *
 * ── The staged-accession window ──────────────────────────────────────────────
 *
 * Bulgaria and Romania had internal air and sea border controls lifted on
 * 2024-03-31 and fully acceded on 2025-01-01. `isSchengenOn` returns false for
 * days in between, so the engine does not charge them — which is a choice in one
 * direction, and `@meridian/core` is explicit that guessing is harmful in both:
 * counting those days invents an overstay, and not counting them hands the
 * traveller days they may not have.
 *
 * So this module computes the total **both ways** — the engine's figure, and the
 * figure that results if every ambiguous day charged — and reports
 * {@link AllowanceOutcome} as `undetermined` when the limit sits between them.
 * That is arithmetic rather than a guess, and it is the honest answer: those
 * days need a person who knows how the border was crossed.
 */

import type {
  Citation,
  CountryCode,
  DateRange,
  Disclosable,
  IsoDate,
} from '@meridian/core';
import {
  SCHENGEN_MEMBERSHIP,
  addDays,
  compareDates,
  complementRanges,
  diffDays,
  intersectRanges,
  lookbackWindow,
  maxDate,
  mergeRanges,
  minDate,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';
import type {
  LedgerInconsistency,
  SchengenStatus,
  SchengenWorstDay,
  StayInput,
} from '@meridian/presence';
import {
  SCHENGEN_DEFAULT_HORIZON_DAYS,
  SCHENGEN_MAX_DAYS,
  SCHENGEN_SHORT_STAY_CITATION,
  SCHENGEN_WINDOW_DAYS,
  assessSchengenNextEntry,
  assessSchengenStatus,
  assessSchengenWorstDay,
  buildLedger,
  detectInconsistencies,
} from '@meridian/presence';

import { AS_OF } from '@/lib/sample/common';
import { bi, type Bi } from '@/lib/i18n';

/**
 * The civil date this build computes as at, and what the reference field is
 * pre-filled with.
 *
 * Taken from `lib/sample/common.ts` directly rather than through
 * `lib/tools/mrz.ts`, which re-exports the same constant: that module also
 * imports the machine-readable-zone engine, and importing it here would pull
 * `@meridian/mrtd` into this page's bundle for the sake of one date.
 */
export const DEFAULT_REFERENCE_DATE: IsoDate = AS_OF;

/** The rule this tool measures against. Re-exported so the page cites one object. */
export const SCHENGEN_CITATION: Citation = SCHENGEN_SHORT_STAY_CITATION;

/**
 * How many stays the form will hold.
 *
 * Not a licence tier and not a performance limit — every figure here is
 * computed over a 180-day window whatever the input size. It is a cap on the
 * amount of typing that can be lost in one place, and on how long the error
 * summary can get before it stops being a summary.
 */
export const MAX_STAYS = 40;

/** Upper bound on the proposed-stay length the form accepts. */
export const MAX_PROPOSED_STAY_DAYS = 365;

// ---------------------------------------------------------------------------
// The states, and their accession dates
// ---------------------------------------------------------------------------

/**
 * Country names, in both languages.
 *
 * Names, not law: the legal content of this table is the accession dates, and
 * those come from `@meridian/core`'s `SCHENGEN_MEMBERSHIP` rather than from
 * here. A code the membership table gains before this list does falls back to
 * the code itself, which is ugly and correct.
 */
const STATE_NAMES: Readonly<Record<string, Bi>> = {
  AT: bi('Austria', 'Austria'),
  BE: bi('Belgium', 'Bélgica'),
  BG: bi('Bulgaria', 'Bulgaria'),
  CH: bi('Switzerland', 'Suiza'),
  CZ: bi('Czechia', 'Chequia'),
  DE: bi('Germany', 'Alemania'),
  DK: bi('Denmark', 'Dinamarca'),
  EE: bi('Estonia', 'Estonia'),
  ES: bi('Spain', 'España'),
  FI: bi('Finland', 'Finlandia'),
  FR: bi('France', 'Francia'),
  GR: bi('Greece', 'Grecia'),
  HR: bi('Croatia', 'Croacia'),
  HU: bi('Hungary', 'Hungría'),
  IS: bi('Iceland', 'Islandia'),
  IT: bi('Italy', 'Italia'),
  LI: bi('Liechtenstein', 'Liechtenstein'),
  LT: bi('Lithuania', 'Lituania'),
  LU: bi('Luxembourg', 'Luxemburgo'),
  LV: bi('Latvia', 'Letonia'),
  MT: bi('Malta', 'Malta'),
  NL: bi('Netherlands', 'Países Bajos'),
  NO: bi('Norway', 'Noruega'),
  PL: bi('Poland', 'Polonia'),
  PT: bi('Portugal', 'Portugal'),
  RO: bi('Romania', 'Rumanía'),
  SE: bi('Sweden', 'Suecia'),
  SI: bi('Slovenia', 'Eslovenia'),
  SK: bi('Slovakia', 'Eslovaquia'),
};

export interface SchengenState {
  readonly code: CountryCode;
  readonly name: Bi;
  /** First date the State's territory fully counted as part of the area. */
  readonly since: IsoDate;
  /** Date partial effects began, where accession was staged. `null` otherwise. */
  readonly partialSince: IsoDate | null;
}

/**
 * The States the form offers, in alphabetical order of their English name.
 *
 * Alphabetical is not a ranking — it is the order a person scans a list in. The
 * list is the membership table itself, so a State cannot appear in the picker
 * without the accession date the arithmetic will use for it.
 *
 * Only member States are offered. Time spent outside the area does not consume
 * the allowance and does not need to be entered; the tool says so rather than
 * asking for a travel history it will then discard.
 */
export const SCHENGEN_STATES: readonly SchengenState[] = SCHENGEN_MEMBERSHIP.map(
  (member): SchengenState => ({
    code: member.country,
    name: STATE_NAMES[member.country] ?? bi(member.country, member.country),
    since: member.since,
    partialSince: member.partialSince ?? null,
  }),
).sort((a, b) => (a.name.en < b.name.en ? -1 : a.name.en > b.name.en ? 1 : 0));

export function schengenState(code: string): SchengenState | null {
  return SCHENGEN_STATES.find((s) => s.code === code) ?? null;
}

// ---------------------------------------------------------------------------
// Range helpers
//
// All of this is closed-range arithmetic from `@meridian/core`. Nothing walks a
// day at a time, so a mistyped year produces a wrong answer rather than a hung
// tab, and nothing constructs an inverted `DateRange` for `intersectRanges` to
// interpret.
// ---------------------------------------------------------------------------

/** The part of `range` falling strictly before `boundary`, or `null`. */
function partBefore(range: DateRange, boundary: IsoDate): DateRange | null {
  const lastDay = addDays(boundary, -1);
  if (compareDates(range.start, lastDay) > 0) return null;
  return { start: range.start, end: minDate(range.end, lastDay) };
}

/** The part of `range` inside `[from, before)`, or `null`. */
function partBetween(range: DateRange, from: IsoDate, before: IsoDate): DateRange | null {
  const start = maxDate(range.start, from);
  const end = minDate(range.end, addDays(before, -1));
  return compareDates(start, end) <= 0 ? { start, end } : null;
}

function clip(range: DateRange | null, window: DateRange): DateRange | null {
  return range === null ? null : intersectRanges(range, window);
}

function daysIn(range: DateRange | null): number {
  return range === null ? 0 : rangeLengthDays(range);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** One stay, already parsed and validated by the form. */
export interface StayFacts {
  /** Stable per-row id. Becomes the ledger's stay id, so attribution can be matched back. */
  readonly id: string;
  readonly country: CountryCode;
  readonly range: DateRange;
  /**
   * The traveller held *that State's own* residence permit or long-stay visa
   * for the whole of this stay, so its days were not short-stay days at all.
   */
  readonly exempt: boolean;
}

export interface SchengenQuery {
  readonly stays: readonly StayFacts[];
  readonly referenceDate: IsoDate;
  /** Range to scan for the worst day, or `null` when the reader asked for none. */
  readonly plannedRange: DateRange | null;
  /** Length of a hypothetical unbroken stay, or `null`. */
  readonly proposedStayDays: number | null;
  /** Earliest day the hypothetical stay could begin. Required when a length is given. */
  readonly proposedNotBefore: IsoDate | null;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** Why days of a stay inside the window did not charge against the allowance. */
export interface UncountedReason {
  readonly key: string;
  readonly days: number;
  readonly text: Bi;
}

export interface StayAnalysis {
  readonly id: string;
  readonly country: CountryCode;
  readonly countryName: Bi;
  /** The stay exactly as entered. */
  readonly range: DateRange;
  readonly stayDays: number;
  readonly daysInsideWindow: number;
  /** The portions the engine charged, already de-duplicated within this stay. */
  readonly countedRanges: readonly DateRange[];
  readonly countedDays: number;
  readonly uncounted: readonly UncountedReason[];
  readonly exempt: boolean;
}

/**
 * A period the day count cannot resolve.
 *
 * Days between a State's `partialSince` and its `since`. Whether they consumed
 * the allowance depends on how the border was crossed and which controls
 * applied to that crossing, and a ledger does not record that. Surfaced as a
 * question for a person rather than resolved.
 */
export interface AmbiguousPeriod {
  readonly key: string;
  readonly country: CountryCode;
  readonly countryName: Bi;
  /** The ambiguous portion of the stay, before clipping to the window. */
  readonly range: DateRange;
  readonly days: number;
  readonly daysInsideWindow: number;
  readonly partialSince: IsoDate;
  readonly since: IsoDate;
}

/**
 * Where the record sits against the 90-day allowance.
 *
 * `undetermined` is a real answer, not a failure: it means the limit falls
 * between the count with the ambiguous days excluded and the count with them
 * included, so the record alone cannot decide it.
 */
export type AllowanceOutcome = 'within' | 'over' | 'undetermined';

export interface PlannedTripReport {
  readonly range: DateRange;
  readonly rangeDays: number;
  readonly assessment: Disclosable<SchengenWorstDay>;
  /** Usage on the last day of the range, for comparison with the worst day. */
  readonly lastDay: Disclosable<SchengenStatus>;
  /**
   * Days of the scanned range that no entered stay covers.
   *
   * The scan measures the record. A trip that has not been entered as a stay is
   * not in the record, so scanning its dates reports the usage the traveller
   * would have while sitting at home — a number that looks reassuring and means
   * nothing. Non-empty here is almost always a missing row rather than a finding.
   */
  readonly uncovered: readonly DateRange[];
  readonly uncoveredDays: number;
}

export interface ProposedStayReport {
  readonly stayDays: number;
  readonly notBefore: IsoDate;
  readonly horizonDays: number;
  readonly assessment: Disclosable<IsoDate | null>;
  /** Days from `notBefore` to the answer. Zero means the stay is lawful from that day. */
  readonly waitDays: number | null;
  /**
   * True when the requested length exceeds the 90-day allowance, in which case
   * there is no such date at any point in the future rather than none inside
   * the horizon. The two null cases mean different things.
   */
  readonly exceedsAllowance: boolean;
}

export interface SchengenReport {
  readonly referenceDate: IsoDate;
  readonly window: DateRange;
  readonly status: Disclosable<SchengenStatus>;
  readonly stays: readonly StayAnalysis[];
  readonly ambiguous: readonly AmbiguousPeriod[];
  /** The total if every ambiguous day charged. Equal to `daysUsed` when there are none. */
  readonly daysUsedIfAmbiguousCounted: number;
  readonly outcome: AllowanceOutcome;
  /** Days on which the record places the person in two countries at once. */
  readonly conflicts: readonly LedgerInconsistency[];
  readonly plannedTrip: PlannedTripReport | null;
  readonly proposedStay: ProposedStayReport | null;
}

/**
 * Either a report or the reason there is none.
 *
 * `@meridian/presence` throws `MeridianError` for input it refuses — a
 * worst-day scan wider than ten years, a non-integer stay length. The form
 * rejects all of those before calling, so this branch is unreachable today; it
 * is here because rendering the message beats a blank panel and a console trace
 * the reader will never see, and because a future caller could reintroduce the
 * case. Nothing is swallowed.
 */
export type SchengenOutcome =
  | { readonly ok: true; readonly report: SchengenReport }
  | { readonly ok: false; readonly message: string };

// ---------------------------------------------------------------------------
// The computation
// ---------------------------------------------------------------------------

/**
 * Provenance for a stay somebody typed into a web form.
 *
 * `declared` because it is the person's own statement of where they were, and
 * `assumed` because nobody has seen a stamp. Neither field changes any figure —
 * assumed days count in every total, and omitting them would understate
 * exposure — but the ledger records evidentiary weight as a first-class field,
 * and a form that recorded typed dates as `confirmed` would be lying to the
 * next reader of that ledger.
 */
const TYPED_SOURCE = 'declared' as const;
const TYPED_CONFIDENCE = 'assumed' as const;

function toStayInput(stay: StayFacts): StayInput {
  return {
    id: stay.id,
    country: stay.country,
    start: stay.range.start,
    end: stay.range.end,
    source: TYPED_SOURCE,
    confidence: TYPED_CONFIDENCE,
    exemptFromSchengenShortStay: stay.exempt,
  };
}

function ambiguousPartOf(stay: StayFacts): DateRange | null {
  // An exempt stay is not a short stay whichever way the accession question is
  // answered, so it raises no ambiguity to escalate.
  if (stay.exempt) return null;
  const state = schengenState(stay.country);
  if (state === null || state.partialSince === null) return null;
  return partBetween(stay.range, state.partialSince, state.since);
}

function analyseStay(
  stay: StayFacts,
  status: SchengenStatus,
  window: DateRange,
): StayAnalysis {
  const state = schengenState(stay.country);
  const countryName = state?.name ?? bi(stay.country, stay.country);

  const insideWindow = intersectRanges(stay.range, window);
  const daysInsideWindow = daysIn(insideWindow);

  const countedRanges = status.contributingStays
    .filter((c) => c.stayId === stay.id)
    .map((c) => c.countedRange);
  const countedDays = totalDays(mergeRanges(countedRanges));

  const stayDays = rangeLengthDays(stay.range);
  const outsideWindowDays = stayDays - daysInsideWindow;

  const uncounted: UncountedReason[] = [];

  if (outsideWindowDays > 0) {
    uncounted.push({
      key: 'outside-window',
      days: outsideWindowDays,
      text: bi(
        `Outside the 180-day window ending ${window.end}. Those days have aged out of the reference period, or have not entered it yet.`,
        `Fuera de la ventana de 180 días que termina el ${window.end}. Esos días han salido del periodo de referencia o aún no han entrado en él.`,
      ),
    });
  }

  if (stay.exempt) {
    if (daysInsideWindow > 0) {
      uncounted.push({
        key: 'exempt',
        days: daysInsideWindow,
        text: bi(
          'Recorded as time in the State that issued your own residence permit or long-stay visa, which is not short-stay presence and is not charged against the 90 days.',
          'Registrado como tiempo en el Estado que expidió su propia autorización de residencia o visado de larga duración, que no es estancia corta y no se imputa a los 90 días.',
        ),
      });
    }
    return {
      id: stay.id,
      country: stay.country,
      countryName,
      range: stay.range,
      stayDays,
      daysInsideWindow,
      countedRanges: [],
      countedDays: 0,
      uncounted,
      exempt: true,
    };
  }

  const ambiguousInWindow = daysIn(clip(ambiguousPartOf(stay), window));

  const membershipStart = state === null ? null : (state.partialSince ?? state.since);
  const beforeMembershipDays =
    membershipStart === null ? 0 : daysIn(clip(partBefore(stay.range, membershipStart), window));

  if (beforeMembershipDays > 0 && state !== null) {
    uncounted.push({
      key: 'before-membership',
      days: beforeMembershipDays,
      text: bi(
        `${state.name.en} was outside the Schengen area on those days — its territory counted from ${state.since}. Time there did not consume the short-stay allowance.`,
        `${state.name.es} estaba fuera del espacio Schengen esos días: su territorio computa desde el ${state.since}. El tiempo allí no consumió la franquicia de estancia corta.`,
      ),
    });
  }

  if (ambiguousInWindow > 0 && state !== null && state.partialSince !== null) {
    uncounted.push({
      key: 'accession-ambiguous',
      days: ambiguousInWindow,
      text: bi(
        `Inside ${state.name.en}'s staged-accession window (${state.partialSince} to ${addDays(state.since, -1)}). Meridian does not charge these days and does not assert that they are free either — see the note below.`,
        `Dentro de la ventana de adhesión escalonada de ${state.name.es} (del ${state.partialSince} al ${addDays(state.since, -1)}). Meridian no imputa estos días ni afirma que estén libres: véase la nota más abajo.`,
      ),
    });
  }

  const explained = countedDays + beforeMembershipDays + ambiguousInWindow;
  const remainder = daysInsideWindow - explained;
  if (remainder > 0) {
    uncounted.push({
      key: 'not-in-area',
      days: remainder,
      text: bi(
        "The membership table does not place that State inside the Schengen area on those days, so they were not charged. Check the dates against the table below before relying on this.",
        'La tabla de pertenencia no sitúa a ese Estado dentro del espacio Schengen esos días, por lo que no se imputaron. Contraste las fechas con la tabla siguiente antes de apoyarse en esto.',
      ),
    });
  }

  return {
    id: stay.id,
    country: stay.country,
    countryName,
    range: stay.range,
    stayDays,
    daysInsideWindow,
    countedRanges: mergeRanges(countedRanges),
    countedDays,
    uncounted,
    exempt: false,
  };
}

function ambiguousPeriods(
  stays: readonly StayFacts[],
  window: DateRange,
): AmbiguousPeriod[] {
  const out: AmbiguousPeriod[] = [];
  for (const stay of stays) {
    const range = ambiguousPartOf(stay);
    if (range === null) continue;
    const state = schengenState(stay.country);
    if (state === null || state.partialSince === null) continue;
    out.push({
      key: stay.id,
      country: stay.country,
      countryName: state.name,
      range,
      days: rangeLengthDays(range),
      daysInsideWindow: daysIn(clip(range, window)),
      partialSince: state.partialSince,
      since: state.since,
    });
  }
  return out;
}

function outcomeOf(daysUsed: number, daysUsedIfAmbiguousCounted: number): AllowanceOutcome {
  if (daysUsed > SCHENGEN_MAX_DAYS) return 'over';
  if (daysUsedIfAmbiguousCounted > SCHENGEN_MAX_DAYS) return 'undetermined';
  return 'within';
}

/**
 * Run the three engines over a validated query.
 *
 * Nothing in here reaches for a clock, a network or a store. The whole function
 * is a fold over its arguments, which is what makes the privacy claim on the
 * page a property of the code rather than an undertaking.
 */
export function runSchengenCheck(query: SchengenQuery): SchengenOutcome {
  try {
    const { referenceDate } = query;
    const ledger = buildLedger(query.stays.map(toStayInput), {
      // Every stay this form produces has an explicit end date, so nothing is
      // imputed. The option is required by `buildLedger` and is set to the
      // reference date so that, if an open-ended stay ever reaches this call,
      // it is closed at the date the reader is asking about rather than at a
      // clock read this application does not perform.
      openStaysEndOn: referenceDate,
    });

    const status = assessSchengenStatus(ledger, referenceDate);
    const window: DateRange = lookbackWindow(referenceDate, SCHENGEN_WINDOW_DAYS);

    const ambiguous = ambiguousPeriods(query.stays, window);
    const ambiguousInWindow = ambiguous
      .map((a) => clip(a.range, window))
      .filter((r): r is DateRange => r !== null);
    // Merged with the counted ranges rather than added to the total: an
    // ambiguous day that another stay already charged must not be counted
    // twice, because a person cannot spend a day twice.
    const daysUsedIfAmbiguousCounted = totalDays(
      mergeRanges([...status.value.countedRanges, ...ambiguousInWindow]),
    );

    const conflicts = detectInconsistencies(ledger, { asOf: referenceDate }).filter(
      (i) => i.kind === 'conflicting_location',
    );

    let plannedTrip: PlannedTripReport | null = null;
    if (query.plannedRange !== null) {
      const uncovered = complementRanges(
        query.stays.map((s) => s.range),
        query.plannedRange,
      );
      plannedTrip = {
        range: query.plannedRange,
        rangeDays: rangeLengthDays(query.plannedRange),
        assessment: assessSchengenWorstDay(ledger, query.plannedRange),
        lastDay: assessSchengenStatus(ledger, query.plannedRange.end),
        uncovered,
        uncoveredDays: totalDays(uncovered),
      };
    }

    let proposedStay: ProposedStayReport | null = null;
    if (query.proposedStayDays !== null && query.proposedNotBefore !== null) {
      const notBefore = query.proposedNotBefore;
      const assessment = assessSchengenNextEntry(ledger, query.proposedStayDays, notBefore);
      const date = assessment.value;
      proposedStay = {
        stayDays: query.proposedStayDays,
        notBefore,
        horizonDays: SCHENGEN_DEFAULT_HORIZON_DAYS,
        assessment,
        // The search starts at `notBefore`, so the answer is never earlier and
        // the difference is never negative. Zero means "from that day".
        waitDays: date === null ? null : diffDays(notBefore, date),
        exceedsAllowance: query.proposedStayDays > SCHENGEN_MAX_DAYS,
      };
    }

    return {
      ok: true,
      report: {
        referenceDate,
        window,
        status,
        stays: query.stays.map((stay) => analyseStay(stay, status.value, window)),
        ambiguous,
        daysUsedIfAmbiguousCounted,
        outcome: outcomeOf(status.value.daysUsed, daysUsedIfAmbiguousCounted),
        conflicts,
        plannedTrip,
        proposedStay,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'The day counter raised an error with no message.',
    };
  }
}

// ---------------------------------------------------------------------------
// Worked inputs
// ---------------------------------------------------------------------------

/** One row of a worked input, in the form's own string shapes. */
export interface ExampleStay {
  readonly country: string;
  readonly start: string;
  readonly end: string;
  readonly exempt?: boolean;
}

/**
 * A set of facts that fills the form.
 *
 * These are invented itineraries — country codes and dates, no person, no
 * document, nothing that belongs to anybody. They exist because each one makes
 * a different property of the rule visible in a single press, and because
 * every one of them is a case a hand calculation gets wrong.
 */
export interface SchengenExample {
  readonly id: string;
  readonly label: Bi;
  /** What this input demonstrates. Shown beside the button, not as a claim about law. */
  readonly note: Bi;
  readonly referenceDate: string;
  readonly stays: readonly ExampleStay[];
  readonly plannedStart: string;
  readonly plannedEnd: string;
  readonly proposedDays: string;
  readonly proposedFrom: string;
}

export const SCHENGEN_EXAMPLES: readonly SchengenExample[] = [
  {
    id: 'edge',
    label: bi('A stay across the window edge', 'Una estancia a caballo del borde de la ventana'),
    note: bi(
      'A 27-day stay in Spain of which only the last part is inside the window, plus a planned trip to check.',
      'Una estancia de 27 días en España de la que solo la última parte queda dentro de la ventana, más un viaje previsto que comprobar.',
    ),
    referenceDate: '2026-07-25',
    stays: [
      { country: 'ES', start: '2026-01-10', end: '2026-02-05' },
      { country: 'FR', start: '2026-06-01', end: '2026-06-20' },
      { country: 'PT', start: '2026-07-10', end: '2026-07-25' },
      { country: 'IT', start: '2026-08-01', end: '2026-08-20' },
    ],
    plannedStart: '2026-08-01',
    plannedEnd: '2026-08-20',
    proposedDays: '45',
    proposedFrom: '2026-08-25',
  },
  {
    id: 'worst-day',
    label: bi(
      'The day you fly home is not the day that decides',
      'El día de regreso no es el día que decide',
    ),
    note: bi(
      'An earlier stay, then a two-leg trip with a short gap between the legs. Usage is at its highest at the start of the trip and falls as the older days age out of the window, so reading the day of departure understates it.',
      'Una estancia anterior y después un viaje de dos tramos con un breve intervalo entre ellos. El consumo es máximo al principio del viaje y baja a medida que los días antiguos salen de la ventana, de modo que leer el día de salida lo subestima.',
    ),
    referenceDate: '2026-07-25',
    stays: [
      { country: 'ES', start: '2026-02-01', end: '2026-04-01' },
      { country: 'IT', start: '2026-08-01', end: '2026-08-20' },
      { country: 'GR', start: '2026-08-25', end: '2026-09-05' },
    ],
    plannedStart: '2026-08-01',
    plannedEnd: '2026-09-05',
    proposedDays: '30',
    proposedFrom: '2026-09-06',
  },
  {
    id: 'ninety',
    label: bi('Exactly ninety days', 'Exactamente noventa días'),
    note: bi(
      'One unbroken stay that uses the allowance to the day. Both endpoints count, so this is 90 and not 89.',
      'Una estancia ininterrumpida que agota la franquicia justo al día. Ambos extremos cuentan, de modo que son 90 y no 89.',
    ),
    referenceDate: '2026-07-25',
    stays: [{ country: 'ES', start: '2026-04-27', end: '2026-07-25' }],
    plannedStart: '',
    plannedEnd: '',
    proposedDays: '14',
    proposedFrom: '2026-07-26',
  },
  {
    id: 'ninety-one',
    label: bi('The same stay, one day earlier', 'La misma estancia, un día antes'),
    note: bi(
      'Identical to the previous input except that it begins on 26 April. One day is the whole difference between a lawful stay and an overstay.',
      'Idéntica a la anterior salvo que empieza el 26 de abril. Un día es toda la diferencia entre una estancia conforme y una estancia irregular.',
    ),
    referenceDate: '2026-07-25',
    stays: [{ country: 'ES', start: '2026-04-26', end: '2026-07-25' }],
    plannedStart: '',
    plannedEnd: '',
    proposedDays: '14',
    proposedFrom: '2026-07-26',
  },
  {
    id: 'accession',
    label: bi('Croatia before it joined', 'Croacia antes de su adhesión'),
    note: bi(
      'A 57-day stay spanning 1 January 2023. Membership is time-varying, so only the days from the accession date charge against the allowance.',
      'Una estancia de 57 días a caballo del 1 de enero de 2023. La pertenencia varía en el tiempo, de modo que solo los días desde la fecha de adhesión se imputan a la franquicia.',
    ),
    referenceDate: '2023-01-15',
    stays: [{ country: 'HR', start: '2022-11-15', end: '2023-01-10' }],
    plannedStart: '',
    plannedEnd: '',
    proposedDays: '',
    proposedFrom: '',
  },
  {
    id: 'staged',
    label: bi('Bulgaria mid-accession', 'Bulgaria en plena adhesión'),
    note: bi(
      'A stay inside the window between the lifting of air and sea controls and full accession. This is the case where the count alone cannot decide, and the tool says so.',
      'Una estancia dentro de la ventana entre el levantamiento de los controles aéreos y marítimos y la adhesión plena. Es el caso en que el cómputo por sí solo no puede decidir, y la herramienta lo dice.',
    ),
    referenceDate: '2024-12-15',
    stays: [
      { country: 'BG', start: '2024-06-01', end: '2024-08-20' },
      { country: 'ES', start: '2024-10-01', end: '2024-11-20' },
    ],
    plannedStart: '',
    plannedEnd: '',
    proposedDays: '',
    proposedFrom: '',
  },
];
