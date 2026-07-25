/**
 * The presence ledger: what we believe about where a person physically was,
 * where that belief came from, and how much of it is actually evidenced.
 *
 * Everything else in this package is arithmetic over this structure, so the
 * structure has to be honest about two things the naive version gets wrong.
 *
 * **Provenance travels with the day.** A day sourced from a passport stamp and
 * a day sourced from a phone's location history are not the same evidentiary
 * object, even though both produce the integer 1. When a tribunal asks why the
 * count says 89 rather than 92, the answer has to be traceable to a record with
 * a source and a confidence, not to an opaque total. Hence {@link Stay.source}
 * and {@link Stay.confidence} are required fields rather than optional
 * annotations.
 *
 * **Contradictions are surfaced, never resolved.** If the record says the
 * person was in Spain and in Mexico on the same Tuesday, one of those records
 * is wrong, and the engine has no basis for guessing which. A tracker that
 * quietly prefers the border stamp, or the later entry, or the higher
 * confidence, produces a number that looks authoritative and cannot be
 * defended, because the person defending it does not know a choice was made.
 * {@link detectInconsistencies} reports the conflict and leaves the resolution
 * to whoever holds the underlying documents.
 */

import type { CountryCode, DateRange, IsoDate } from '@meridian/core';
import {
  MeridianError,
  addDays,
  compareDates,
  complementRanges,
  dateRange,
  intersectRanges,
  maxDate,
  mergeRanges,
  rangeContains,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';

/**
 * Where a presence record came from. This is deliberately not a boolean
 * "verified" flag: the difference between an itinerary (what the person
 * intended) and a border stamp (what a state recorded) is the difference
 * between a plan and evidence, and both belong in the ledger.
 */
export type PresenceSource =
  /** An entry or exit stamp, or an equivalent official border record. */
  | 'border_stamp'
  /** Device location history supplied by the person. */
  | 'gps'
  /** The person's own statement of where they were. */
  | 'declared'
  /** A booking, boarding pass, or planned trip — including future travel. */
  | 'itinerary'
  /** Derived by the platform from surrounding records rather than observed. */
  | 'inferred';

/**
 * How much weight the record can bear.
 *
 * `assumed` days still count in every total this package produces — omitting
 * them would understate exposure — but a total that rests on them is a
 * different thing from one that rests on stamps, and callers are expected to
 * say so to the user.
 */
export type PresenceConfidence = 'confirmed' | 'probable' | 'assumed';

/** A single continuous period of physical presence in one country. */
export interface Stay {
  readonly id: string;
  readonly country: CountryCode;
  /** Closed at both ends: entry day and exit day are both days of presence. */
  readonly range: DateRange;
  readonly source: PresenceSource;
  readonly confidence: PresenceConfidence;
  /**
   * True when the record had no departure date and `range.end` was imputed
   * from an "as of" date rather than recorded. The count is still produced,
   * but {@link detectInconsistencies} reports it so nobody mistakes the
   * imputed end for a known one.
   */
  readonly openEnded?: boolean;
  /**
   * Set when the traveller held *that State's own* residence permit or
   * long-stay (type D) visa for the whole of this stay.
   *
   * The 90/180 rule in the Schengen Borders Code governs **short** stays. Days
   * spent in the Member State that issued the permit or long-stay visa are not
   * short-stay days and must not be charged against the 90-day allowance —
   * counting a Spanish resident's days at home against their Schengen quota
   * produces a terrifying and completely wrong number. Days spent in *other*
   * Schengen States on the strength of that permit are still short stays and
   * must not be flagged here.
   */
  readonly exemptFromSchengenShortStay?: boolean;
}

/** Input shape for {@link buildLedger}, where a stay may not have ended yet. */
export interface StayInput {
  readonly id: string;
  readonly country: CountryCode;
  readonly start: IsoDate;
  /** `null` when the person has not left — see {@link LedgerOptions.openStaysEndOn}. */
  readonly end: IsoDate | null;
  readonly source: PresenceSource;
  readonly confidence: PresenceConfidence;
  readonly exemptFromSchengenShortStay?: boolean;
}

export interface LedgerOptions {
  /**
   * The date an open-ended stay is treated as running to — normally "today".
   *
   * There is no correct answer for the end of a stay that has not ended, so the
   * caller supplies one explicitly rather than the engine reaching for a clock.
   * The resulting stay is marked {@link Stay.openEnded} so the imputation is
   * visible downstream instead of being laundered into a total.
   */
  readonly openStaysEndOn: IsoDate;
}

/**
 * An ordered, validated set of stays.
 *
 * Ordering is normalised at construction (start, then end, then id) so that
 * every derived figure is independent of the order records happened to arrive
 * in. Two ledgers built from the same stays in different orders are equal, and
 * the tests assert exactly that.
 */
export interface PresenceLedger {
  readonly stays: readonly Stay[];
}

function compareStays(a: Stay, b: Stay): number {
  const byStart = compareDates(a.range.start, b.range.start);
  if (byStart !== 0) return byStart;
  const byEnd = compareDates(a.range.end, b.range.end);
  if (byEnd !== 0) return byEnd;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Build a ledger from already-closed {@link Stay} records. */
export function presenceLedger(stays: readonly Stay[]): PresenceLedger {
  const seen = new Set<string>();
  for (const s of stays) {
    if (s.id.trim().length === 0) {
      throw new MeridianError('INVALID_INPUT', 'stay id must not be empty');
    }
    if (seen.has(s.id)) {
      throw new MeridianError('INVALID_INPUT', `duplicate stay id ${JSON.stringify(s.id)}`, {
        stayId: s.id,
      });
    }
    seen.add(s.id);
    // Re-validate rather than trust: a caller-built DateRange may have skipped
    // the constructor, and an inverted range silently produces negative days.
    dateRange(s.range.start, s.range.end);
  }
  return { stays: [...stays].sort(compareStays) };
}

/**
 * Build a ledger from raw records, closing any stay that has no departure date
 * at {@link LedgerOptions.openStaysEndOn}.
 */
export function buildLedger(inputs: readonly StayInput[], options: LedgerOptions): PresenceLedger {
  const stays = inputs.map((input): Stay => {
    if (input.end === null) {
      if (compareDates(input.start, options.openStaysEndOn) > 0) {
        throw new MeridianError(
          'INVALID_INPUT',
          `open-ended stay ${JSON.stringify(input.id)} starts on ${input.start}, after the date it is being closed at (${options.openStaysEndOn})`,
          { stayId: input.id, start: input.start, openStaysEndOn: options.openStaysEndOn },
        );
      }
      return {
        id: input.id,
        country: input.country,
        range: dateRange(input.start, options.openStaysEndOn),
        source: input.source,
        confidence: input.confidence,
        openEnded: true,
        exemptFromSchengenShortStay: input.exemptFromSchengenShortStay === true,
      };
    }
    return {
      id: input.id,
      country: input.country,
      range: dateRange(input.start, input.end),
      source: input.source,
      confidence: input.confidence,
      openEnded: false,
      exemptFromSchengenShortStay: input.exemptFromSchengenShortStay === true,
    };
  });
  return presenceLedger(stays);
}

/** The full span the ledger says anything about, or `null` when it is empty. */
export function ledgerSpan(ledger: PresenceLedger): DateRange | null {
  const first = ledger.stays[0];
  if (first === undefined) return null;
  let end = first.range.end;
  for (const s of ledger.stays) end = maxDate(end, s.range.end);
  return { start: first.range.start, end };
}

/** Stays with at least one day inside `within`, in ledger order. */
export function staysOverlapping(ledger: PresenceLedger, within: DateRange): Stay[] {
  return ledger.stays.filter((s) => intersectRanges(s.range, within) !== null);
}

/** Stays claiming `date`, in ledger order. More than one is a contradiction, not a merge. */
export function staysOn(ledger: PresenceLedger, date: IsoDate): Stay[] {
  return ledger.stays.filter((s) => rangeContains(s.range, date));
}

/** Distinct countries the ledger places the person in on `date`, sorted. */
export function countriesOn(ledger: PresenceLedger, date: IsoDate): CountryCode[] {
  const set = new Set<CountryCode>();
  for (const s of staysOn(ledger, date)) set.add(s.country);
  return [...set].sort();
}

/**
 * Merged, de-duplicated presence in one country, optionally clipped to a window.
 *
 * Overlapping stays in the same country — a common artefact of combining a
 * border stamp with an itinerary — must collapse to one day, not two.
 */
export function countryPresenceRanges(
  ledger: PresenceLedger,
  country: CountryCode,
  within?: DateRange,
): DateRange[] {
  const raw: DateRange[] = [];
  for (const s of ledger.stays) {
    if (s.country !== country) continue;
    const clipped = within === undefined ? s.range : intersectRanges(s.range, within);
    if (clipped !== null) raw.push(clipped);
  }
  return mergeRanges(raw);
}

/** Days of presence in one country inside `within`, counting each day at most once. */
export function daysPresentIn(
  ledger: PresenceLedger,
  country: CountryCode,
  within: DateRange,
): number {
  return totalDays(countryPresenceRanges(ledger, country, within));
}

/**
 * Upper bound on any day-by-day scan, ~100 years.
 *
 * Scanning is how rules that change mid-stay (Schengen accession dates) are
 * evaluated exactly, but an unbounded scan driven by a mistyped year turns into
 * a hung request. Refusing loudly beats looping.
 */
export const MAX_LEDGER_SCAN_DAYS = 36_600;

/**
 * Merged ranges of the days inside `within` on which at least one stay both
 * covers the day and satisfies `include`.
 *
 * The per-day predicate exists because membership of a bloc is time-varying:
 * a single Croatian stay running from 2022-12-25 to 2023-01-05 contributes only
 * its 2023 tail to the Schengen count. Splitting the stay by range arithmetic
 * would require this module to know the shape of every such rule; asking the
 * rule about each day does not.
 */
export function presenceRangesWhere(
  ledger: PresenceLedger,
  within: DateRange,
  include: (stay: Stay, day: IsoDate) => boolean,
): DateRange[] {
  const span = rangeLengthDays(within);
  if (span > MAX_LEDGER_SCAN_DAYS) {
    throw new MeridianError(
      'INVALID_INPUT',
      `refusing to scan ${span} days; the maximum is ${MAX_LEDGER_SCAN_DAYS}`,
      { start: within.start, end: within.end, days: span },
    );
  }
  const candidates = staysOverlapping(ledger, within);
  const out: DateRange[] = [];
  let runStart: IsoDate | null = null;
  let runEnd: IsoDate | null = null;
  for (let i = 0; i < span; i++) {
    const day = addDays(within.start, i);
    const hit = candidates.some((s) => rangeContains(s.range, day) && include(s, day));
    if (hit) {
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

/** What is wrong with the record. */
export type InconsistencyKind =
  /** Two different countries claim the same calendar day. Physically impossible. */
  | 'conflicting_location'
  /** No stay covers these days, so the person's location is unrecorded. */
  | 'unknown_location'
  /** A stay records presence after the date the assessment is being made for. */
  | 'future_presence'
  /** The departure date was imputed because the record had none. */
  | 'imputed_departure';

export interface LedgerInconsistency {
  readonly kind: InconsistencyKind;
  /** The exact days affected. */
  readonly range: DateRange;
  readonly days: number;
  /** Stays implicated, in ledger order. Empty for a gap — that is the point of a gap. */
  readonly stayIds: readonly string[];
  readonly countries: readonly CountryCode[];
  /** Human-readable statement of the contradiction, safe to show to the person. */
  readonly detail: string;
}

export interface InconsistencyOptions {
  /** The date the assessment is being made for. Presence after it is flagged as future. */
  readonly asOf: IsoDate;
  /**
   * The window the record is expected to account for. Defaults to the ledger's
   * own span, which by construction has no leading or trailing gap — supply a
   * wider window (a residence period, a lookback) to find the gaps that matter
   * for a particular rule.
   */
  readonly expectedCoverage?: DateRange;
}

const KIND_ORDER: Record<InconsistencyKind, number> = {
  conflicting_location: 0,
  future_presence: 1,
  unknown_location: 2,
  imputed_departure: 3,
};

/**
 * Every contradiction and hole in the record, in a stable order.
 *
 * This is the function that keeps the rest of the package defensible. Each
 * later module counts days on the assumption that the ledger describes one
 * person in one place at a time; where that assumption fails, the count is
 * still produced (silence would be worse) but the caller has been told exactly
 * which days it rests on.
 */
export function detectInconsistencies(
  ledger: PresenceLedger,
  options: InconsistencyOptions,
): LedgerInconsistency[] {
  const out: LedgerInconsistency[] = [];

  // --- Two countries on one day -------------------------------------------
  const byCountry = new Map<CountryCode, DateRange[]>();
  for (const s of ledger.stays) {
    const list = byCountry.get(s.country);
    if (list === undefined) byCountry.set(s.country, [s.range]);
    else list.push(s.range);
  }
  const countries = [...byCountry.keys()].sort();
  const rawConflicts: DateRange[] = [];
  for (let i = 0; i < countries.length; i++) {
    for (let j = i + 1; j < countries.length; j++) {
      const a = mergeRanges(byCountry.get(countries[i] as CountryCode) ?? []);
      const b = mergeRanges(byCountry.get(countries[j] as CountryCode) ?? []);
      for (const ra of a) {
        for (const rb of b) {
          const hit = intersectRanges(ra, rb);
          if (hit !== null) rawConflicts.push(hit);
        }
      }
    }
  }
  // Merging is safe here: two conflict intervals only merge when they overlap
  // or touch, so every day of a merged interval is itself a conflict day.
  for (const conflict of mergeRanges(rawConflicts)) {
    const implicated = staysOverlapping(ledger, conflict);
    const involved = [...new Set(implicated.map((s) => s.country))].sort();
    out.push({
      kind: 'conflicting_location',
      range: conflict,
      days: rangeLengthDays(conflict),
      stayIds: implicated.map((s) => s.id),
      countries: involved,
      detail:
        `The record places this person in ${involved.join(', ')} on the same day(s). ` +
        'At most one can be true. Resolve the underlying records before relying on any count over this period.',
    });
  }

  // --- Days nobody accounts for -------------------------------------------
  const coverage = options.expectedCoverage ?? ledgerSpan(ledger);
  if (coverage !== null) {
    for (const gap of complementRanges(
      ledger.stays.map((s) => s.range),
      coverage,
    )) {
      out.push({
        kind: 'unknown_location',
        range: gap,
        days: rangeLengthDays(gap),
        stayIds: [],
        countries: [],
        detail:
          'No stay covers these days, so the record does not say where this person was. ' +
          'Absence-based rules will treat them as time outside the country in question.',
      });
    }
  }

  // --- Presence recorded after the assessment date -------------------------
  for (const s of ledger.stays) {
    if (compareDates(s.range.end, options.asOf) <= 0) continue;
    const futureStart = maxDate(s.range.start, addDays(options.asOf, 1));
    const range = { start: futureStart, end: s.range.end };
    out.push({
      kind: 'future_presence',
      range,
      days: rangeLengthDays(range),
      stayIds: [s.id],
      countries: [s.country],
      detail:
        `Stay ${s.id} records presence in ${s.country} after ${options.asOf}. ` +
        'These are planned days, not elapsed ones; a count that includes them is a projection.',
    });
  }

  // --- Departure dates the engine invented ---------------------------------
  for (const s of ledger.stays) {
    if (s.openEnded !== true) continue;
    out.push({
      kind: 'imputed_departure',
      range: s.range,
      days: rangeLengthDays(s.range),
      stayIds: [s.id],
      countries: [s.country],
      detail:
        `Stay ${s.id} has no recorded departure from ${s.country}; it was closed at ${s.range.end}. ` +
        'If the person is still there the count will grow every day, and if they have left the count is already wrong.',
    });
  }

  return out.sort((x, y) => {
    const byStart = compareDates(x.range.start, y.range.start);
    if (byStart !== 0) return byStart;
    const byKind = KIND_ORDER[x.kind] - KIND_ORDER[y.kind];
    if (byKind !== 0) return byKind;
    return x.stayIds.join(',') < y.stayIds.join(',') ? -1 : 1;
  });
}

/**
 * Throw when the ledger contains a physical impossibility.
 *
 * Callers that are about to file something — as opposed to showing a person
 * their own working — should gate on this. A gap is a known unknown and can be
 * disclosed; two countries on one Tuesday means a document is wrong.
 */
export function assertNoLocationConflicts(
  ledger: PresenceLedger,
  options: InconsistencyOptions,
): void {
  const conflicts = detectInconsistencies(ledger, options).filter(
    (i) => i.kind === 'conflicting_location',
  );
  const first = conflicts[0];
  if (first === undefined) return;
  throw new MeridianError(
    'PRESENCE_LEDGER_INCONSISTENT',
    `the ledger places this person in more than one country on ${first.range.start}`,
    {
      conflicts: conflicts.map((c) => ({
        start: c.range.start,
        end: c.range.end,
        countries: c.countries,
        stayIds: c.stayIds,
      })),
    },
  );
}
