/**
 * The Schengen 90/180 short-stay count, for the calculator on this page.
 *
 * ── Why this file exists at all ──────────────────────────────────────────────
 *
 * The rule already has an implementation: `@meridian/presence`, exercised by
 * the portal at `apps/web/app/tools/schengen/`. **Nothing with legal content is
 * duplicated here.** The two thresholds and the citation are imported from that
 * package and re-exported, so a re-verification there moves this page with it.
 *
 * They were briefly copied, when this app did not yet declare
 * `@meridian/presence` as a dependency. A differential test over twelve cases
 * confirmed the copies agreed on the day they were written — which is precisely
 * the guarantee that decays. Nothing would have failed when a `verifiedOn` moved
 * in one file and not the other, and a landing page showing a stale verification
 * date beside a legal rule is the exact defect `staleness()` exists to catch.
 *
 * What remains local is {@link countSchengenDays}: a faithful port of
 * `schengenStatusOn` — clip each stay to the window, keep the runs of days on
 * which that State was in the area, merge the runs across stays so no day is
 * spent twice, total. It is arithmetic, not law, and it is written against the
 * same `@meridian/core` primitives `@meridian/presence` itself uses:
 * `SCHENGEN_MEMBERSHIP` for per-State accession dates, `isSchengenOn` to resolve
 * membership for one day, `schengenAccessionAmbiguity` to flag the staged
 * window, and civil-date arithmetic throughout with no `Date` and no timezone
 * anywhere in it.
 *
 * ── What it computes, and what it refuses to ─────────────────────────────────
 *
 * One question: how many of the ninety days the record has consumed inside the
 * 180 days ending on a named day, and which stays consumed them. That is
 * `assessment`-class under `@meridian/core` — the reader's own facts measured
 * against a cited rule with the arithmetic exposed — which is why it can be
 * offered to anyone, with no account and no representative attached.
 *
 * It does not say whether the traveller will be admitted, when they should fly,
 * which of two dates is better, or what to do about an overstay. The portal's
 * tool answers two further *measurement* questions this one deliberately omits
 * — the worst day across a planned range, and the earliest date a stay of a
 * given length fits — because a landing page should do one thing perfectly and
 * point at the rest.
 *
 * The whole module is a fold over its arguments: no clock, no I/O, no storage.
 * That is what makes "this runs in your browser and nothing is transmitted" a
 * property of the code rather than an undertaking.
 */

import type { CountryCode, DateRange, IsoDate } from '@meridian/core';
import {
  SCHENGEN_MEMBERSHIP,
  addDays,
  compareDates,
  intersectRanges,
  isSchengenOn,
  lookbackWindow,
  mergeRanges,
  minDate,
  rangeLengthDays,
  schengenAccessionAmbiguity,
  totalDays,
} from '@meridian/core';

// `lib/as-of.ts`, never `lib/catalog-facts.ts`. This module is imported by a
// `'use client'` component, and catalog-facts reaches `@meridian/pathways` —
// the whole rule catalog plus zod — for the sake of one date. See `lib/as-of.ts`.
import { AS_OF } from '@/lib/as-of';
import { bi, type LocalizedText } from '@/lib/i18n';

/**
 * The three legally-loaded values come straight from `@meridian/presence`.
 *
 * They were briefly duplicated here — the thresholds and the citation copied
 * verbatim — because this app did not declare `@meridian/presence` and adding a
 * workspace dependency means regenerating the root lockfile. A differential test
 * over twelve cases confirmed the copies matched on the day they were written,
 * which is exactly the guarantee that decays: nothing would have failed when the
 * citation's `verifiedOn` moved in one file and not the other, and a stale
 * `verifiedOn` on a legal citation is the specific lie this repository is built
 * to prevent.
 *
 * Importing costs nothing at the bundle level. `@meridian/presence` depends on
 * `@meridian/core` alone — no zod, no catalog — unlike `@meridian/pathways`,
 * which is why the rule about what a `'use client'` module may reach still
 * stands and still names pathways specifically.
 */
import {
  SCHENGEN_MAX_DAYS,
  SCHENGEN_SHORT_STAY_CITATION as SCHENGEN_CITATION,
  SCHENGEN_WINDOW_DAYS,
} from '@meridian/presence';

export { SCHENGEN_CITATION, SCHENGEN_MAX_DAYS, SCHENGEN_WINDOW_DAYS };

/** The civil date the reference field is pre-filled with. Never a clock read. */
export const DEFAULT_REFERENCE_DATE: IsoDate = AS_OF;

/**
 * How many stay rows the form holds.
 *
 * Not a licence tier and not a performance limit — the count is computed over a
 * 180-day window whatever the input size. It caps how much typing can be lost
 * at once and how long the error summary can get before it stops being a
 * summary. The portal's tool takes forty.
 */
export const MAX_STAYS = 12;

// ---------------------------------------------------------------------------
// The States
// ---------------------------------------------------------------------------

/**
 * Country names, in both languages.
 *
 * Names, not law. The legal content of the table is the accession dates, and
 * those come from `@meridian/core`'s `SCHENGEN_MEMBERSHIP`. A code the
 * membership table gains before this list does falls back to the code itself,
 * which is ugly and correct.
 */
const STATE_NAMES: Readonly<Record<string, LocalizedText>> = {
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
  /** First date the State's territory fully counted as part of the area. */
  readonly since: IsoDate;
  /** Date partial effects began, where accession was staged. `null` otherwise. */
  readonly partialSince: IsoDate | null;
  readonly name: LocalizedText;
}

/**
 * The States the form offers, alphabetical by English name.
 *
 * Alphabetical is not a ranking — it is the order a person scans a list in. The
 * list *is* the membership table, so a State cannot be offered without the
 * accession date the arithmetic will use for it. Only member States appear:
 * time outside the area does not consume the allowance and is not asked for.
 */
export const SCHENGEN_STATES: readonly SchengenState[] = SCHENGEN_MEMBERSHIP.map(
  (member): SchengenState => ({
    code: member.country,
    since: member.since,
    partialSince: member.partialSince ?? null,
    name: STATE_NAMES[member.country] ?? bi(member.country, member.country),
  }),
).sort((a, b) => (a.name.en < b.name.en ? -1 : a.name.en > b.name.en ? 1 : 0));

export function schengenState(code: string): SchengenState | null {
  return SCHENGEN_STATES.find((s) => s.code === code) ?? null;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** One stay, already parsed and validated by the form. */
export interface StayFacts {
  /** Stable per-row id, so attribution in the result can be matched back. */
  readonly id: string;
  readonly country: CountryCode;
  readonly range: DateRange;
}

export interface SchengenQuery {
  readonly stays: readonly StayFacts[];
  readonly referenceDate: IsoDate;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** Why days of a stay did not charge against the allowance. */
export interface UncountedReason {
  readonly key: string;
  readonly days: number;
  readonly text: LocalizedText;
}

export interface StayLine {
  readonly id: string;
  readonly country: CountryCode;
  readonly countryName: LocalizedText;
  /** The stay exactly as entered. */
  readonly range: DateRange;
  readonly stayDays: number;
  readonly daysInsideWindow: number;
  /** The portions that charged, de-duplicated within this stay. */
  readonly countedRanges: readonly DateRange[];
  readonly countedDays: number;
  readonly uncounted: readonly UncountedReason[];
}

/**
 * A period the day count cannot resolve.
 *
 * Days between a State's `partialSince` and its `since`. Whether they consumed
 * the allowance depends on how the border was crossed and which controls
 * applied, and no record of that exists here. Surfaced as a question for a
 * person rather than answered.
 */
export interface AmbiguousPeriod {
  readonly key: string;
  readonly country: CountryCode;
  readonly countryName: LocalizedText;
  readonly range: DateRange;
  readonly daysInsideWindow: number;
  readonly partialSince: IsoDate;
  readonly since: IsoDate;
}

/**
 * Where the record sits against the ninety days.
 *
 * `undetermined` is a real answer rather than a failure: the limit falls
 * between the count with the ambiguous days excluded and the count with them
 * included, so the record alone cannot decide it.
 */
export type AllowanceOutcome = 'within' | 'over' | 'undetermined';

export interface SchengenCount {
  readonly referenceDate: IsoDate;
  readonly window: DateRange;
  readonly daysUsed: number;
  /** `SCHENGEN_MAX_DAYS - daysUsed`, floored at zero. */
  readonly daysRemaining: number;
  /** Days beyond the allowance. Zero when the record is inside it. */
  readonly daysOverLimit: number;
  /** The de-duplicated days that produced `daysUsed`. This is the working. */
  readonly countedRanges: readonly DateRange[];
  readonly stays: readonly StayLine[];
  readonly ambiguous: readonly AmbiguousPeriod[];
  /** The total if every ambiguous day charged. Equal to `daysUsed` when there are none. */
  readonly daysUsedIfAmbiguousCounted: number;
  readonly outcome: AllowanceOutcome;
}

// ---------------------------------------------------------------------------
// The computation
// ---------------------------------------------------------------------------

/** The part of `range` falling strictly before `boundary`, or `null`. */
function partBefore(range: DateRange, boundary: IsoDate): DateRange | null {
  const lastDay = addDays(boundary, -1);
  if (compareDates(range.start, lastDay) > 0) return null;
  return { start: range.start, end: minDate(range.end, lastDay) };
}

function clip(range: DateRange | null, window: DateRange): DateRange | null {
  return range === null ? null : intersectRanges(range, window);
}

function daysIn(range: DateRange | null): number {
  return range === null ? 0 : rangeLengthDays(range);
}

/**
 * The runs of days inside `window` on which this stay charged.
 *
 * Ported from `countedRunsForStay` in `packages/presence/src/schengen.ts`. The
 * day-at-a-time walk is bounded by the window: at most 180 iterations per stay
 * however wide the dates entered are, so a mistyped year produces a wrong
 * answer rather than a hung tab.
 */
function countedRunsForStay(stay: StayFacts, window: DateRange): DateRange[] {
  const clipped = intersectRanges(stay.range, window);
  if (clipped === null) return [];
  const out: DateRange[] = [];
  const span = rangeLengthDays(clipped);
  let runStart: IsoDate | null = null;
  let runEnd: IsoDate | null = null;
  for (let i = 0; i < span; i++) {
    const day = addDays(clipped.start, i);
    if (isSchengenOn(stay.country, day)) {
      if (runStart === null) runStart = day;
      runEnd = day;
    } else if (runStart !== null && runEnd !== null) {
      out.push({ start: runStart, end: runEnd });
      runStart = null;
      runEnd = null;
    }
  }
  if (runStart !== null && runEnd !== null) out.push({ start: runStart, end: runEnd });
  return out;
}

/** The ambiguous days of a stay inside `window`, as a run list. */
function ambiguousRunsForStay(stay: StayFacts, window: DateRange): DateRange[] {
  const clipped = intersectRanges(stay.range, window);
  if (clipped === null) return [];
  const out: DateRange[] = [];
  const span = rangeLengthDays(clipped);
  let runStart: IsoDate | null = null;
  let runEnd: IsoDate | null = null;
  for (let i = 0; i < span; i++) {
    const day = addDays(clipped.start, i);
    if (schengenAccessionAmbiguity(stay.country, day)) {
      if (runStart === null) runStart = day;
      runEnd = day;
    } else if (runStart !== null && runEnd !== null) {
      out.push({ start: runStart, end: runEnd });
      runStart = null;
      runEnd = null;
    }
  }
  if (runStart !== null && runEnd !== null) out.push({ start: runStart, end: runEnd });
  return out;
}

function analyseStay(
  stay: StayFacts,
  countedRanges: readonly DateRange[],
  ambiguousRanges: readonly DateRange[],
  window: DateRange,
): StayLine {
  const state = schengenState(stay.country);
  const countryName = state?.name ?? bi(stay.country, stay.country);

  const stayDays = rangeLengthDays(stay.range);
  const daysInsideWindow = daysIn(intersectRanges(stay.range, window));
  const countedDays = totalDays(countedRanges);
  const ambiguousDays = totalDays(ambiguousRanges);

  const uncounted: UncountedReason[] = [];

  const outsideWindowDays = stayDays - daysInsideWindow;
  if (outsideWindowDays > 0) {
    uncounted.push({
      key: 'outside-window',
      days: outsideWindowDays,
      text: bi(
        `Outside the 180 days ending ${window.end}. Those days have aged out of the reference period, or have not entered it yet.`,
        `Fuera de los 180 días que terminan el ${window.end}. Esos días han salido del periodo de referencia o aún no han entrado en él.`,
      ),
    });
  }

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

  if (ambiguousDays > 0 && state !== null && state.partialSince !== null) {
    uncounted.push({
      key: 'accession-ambiguous',
      days: ambiguousDays,
      text: bi(
        `Inside ${state.name.en}'s staged-accession window (${state.partialSince} to ${addDays(state.since, -1)}). Meridian does not charge these days, and does not assert they are free either.`,
        `Dentro de la ventana de adhesión escalonada de ${state.name.es} (del ${state.partialSince} al ${addDays(state.since, -1)}). Meridian no imputa estos días ni afirma que estén libres.`,
      ),
    });
  }

  const remainder = daysInsideWindow - countedDays - beforeMembershipDays - ambiguousDays;
  if (remainder > 0) {
    uncounted.push({
      key: 'not-in-area',
      days: remainder,
      text: bi(
        'The membership table does not place that State inside the Schengen area on those days, so they were not charged. Check the dates before relying on this.',
        'La tabla de pertenencia no sitúa a ese Estado dentro del espacio Schengen esos días, por lo que no se imputaron. Contraste las fechas antes de apoyarse en esto.',
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
  };
}

function outcomeOf(daysUsed: number, daysUsedIfAmbiguousCounted: number): AllowanceOutcome {
  if (daysUsed > SCHENGEN_MAX_DAYS) return 'over';
  if (daysUsedIfAmbiguousCounted > SCHENGEN_MAX_DAYS) return 'undetermined';
  return 'within';
}

/**
 * Count the days.
 *
 * Total is taken over the *merged* ranges rather than by summing per-stay
 * figures, because a person cannot spend a day twice: two overlapping stays are
 * a defect in the record, and adding their days together would invent an
 * overstay out of it.
 */
export function countSchengenDays(query: SchengenQuery): SchengenCount {
  const window = lookbackWindow(query.referenceDate, SCHENGEN_WINDOW_DAYS);

  const perStay = query.stays.map((stay) => ({
    stay,
    counted: countedRunsForStay(stay, window),
    ambiguous: ambiguousRunsForStay(stay, window),
  }));

  const countedRanges = mergeRanges(perStay.flatMap((s) => s.counted));
  const daysUsed = totalDays(countedRanges);

  const daysUsedIfAmbiguousCounted = totalDays(
    mergeRanges([...countedRanges, ...perStay.flatMap((s) => s.ambiguous)]),
  );

  const ambiguous: AmbiguousPeriod[] = [];
  for (const entry of perStay) {
    const state = schengenState(entry.stay.country);
    if (state === null || state.partialSince === null) continue;
    const days = totalDays(entry.ambiguous);
    if (days === 0) continue;
    const first = entry.ambiguous[0];
    const last = entry.ambiguous[entry.ambiguous.length - 1];
    if (first === undefined || last === undefined) continue;
    ambiguous.push({
      key: entry.stay.id,
      country: entry.stay.country,
      countryName: state.name,
      range: { start: first.start, end: last.end },
      daysInsideWindow: days,
      partialSince: state.partialSince,
      since: state.since,
    });
  }

  return {
    referenceDate: query.referenceDate,
    window,
    daysUsed,
    daysRemaining: Math.max(0, SCHENGEN_MAX_DAYS - daysUsed),
    daysOverLimit: Math.max(0, daysUsed - SCHENGEN_MAX_DAYS),
    countedRanges,
    stays: perStay.map((entry) => analyseStay(entry.stay, entry.counted, entry.ambiguous, window)),
    ambiguous,
    daysUsedIfAmbiguousCounted,
    outcome: outcomeOf(daysUsed, daysUsedIfAmbiguousCounted),
  };
}

// ---------------------------------------------------------------------------
// Worked inputs
// ---------------------------------------------------------------------------

/** One row of a worked input, in the form's own string shapes. */
export interface ExampleStay {
  readonly country: string;
  readonly start: string;
  readonly end: string;
}

/**
 * A set of facts that fills the form in one press.
 *
 * Invented itineraries: country codes and dates, nothing else. No name, no
 * document number and no date of birth appears in any of them — Meridian
 * carries no real personal data anywhere, including in its examples. Each one
 * is a case a hand calculation gets wrong.
 */
export interface SchengenExample {
  readonly id: string;
  readonly label: LocalizedText;
  readonly note: LocalizedText;
  readonly referenceDate: string;
  readonly stays: readonly ExampleStay[];
}

export const SCHENGEN_EXAMPLES: readonly SchengenExample[] = [
  {
    id: 'ninety',
    label: bi('Exactly ninety days', 'Exactamente noventa días'),
    note: bi(
      'One unbroken stay that uses the allowance to the day. Both endpoints count, so this is 90 and not 89.',
      'Una estancia ininterrumpida que agota la franquicia justo al día. Ambos extremos cuentan, de modo que son 90 y no 89.',
    ),
    referenceDate: '2026-07-25',
    stays: [{ country: 'ES', start: '2026-04-27', end: '2026-07-25' }],
  },
  {
    id: 'ninety-one',
    label: bi('The same stay, one day earlier', 'La misma estancia, un día antes'),
    note: bi(
      'Identical except that it begins on 26 April. One day is the whole difference between a lawful stay and an overstay.',
      'Idéntica salvo que empieza el 26 de abril. Un día es toda la diferencia entre una estancia conforme y una estancia irregular.',
    ),
    referenceDate: '2026-07-25',
    stays: [{ country: 'ES', start: '2026-04-26', end: '2026-07-25' }],
  },
  {
    id: 'edge',
    label: bi('Three trips, one window', 'Tres viajes, una ventana'),
    note: bi(
      'A stay whose first weeks have already aged out of the window, then two more. The window slides, so days leave it as well as enter it.',
      'Una estancia cuyas primeras semanas ya han salido de la ventana, y luego dos más. La ventana se desplaza, de modo que los días salen de ella además de entrar.',
    ),
    referenceDate: '2026-07-25',
    stays: [
      { country: 'ES', start: '2026-01-10', end: '2026-02-05' },
      { country: 'FR', start: '2026-06-01', end: '2026-06-20' },
      { country: 'PT', start: '2026-07-10', end: '2026-07-25' },
    ],
  },
];
