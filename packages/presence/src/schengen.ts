/**
 * The Schengen short-stay rule: 90 days of presence in any 180-day period.
 *
 * The rule is stated at art. 6(1) of the Schengen Borders Code as a stay "not
 * exceeding 90 days in any 180-day period, which entails considering the
 * 180-day period preceding each day of stay". Two consequences of that wording
 * drive every design choice in this file.
 *
 * **The window is rolling and backward-looking.** There is no "reset date". The
 * question is asked afresh for each day of the stay, against the 180 days
 * ending on and including that day. So a trip that is compliant on its first
 * day can breach on its twelfth, and the only honest answer for a planned trip
 * is the *worst* day in it — which is why {@link schengenWorstDay} exists and
 * why a single {@link schengenStatusOn} call is not enough to clear an
 * itinerary.
 *
 * **Both endpoint days count.** Art. 6(2) makes the date of entry the first day
 * of stay and the date of exit the last. A same-day in-and-out is one day of
 * presence, not zero. This is why every range in Meridian is closed at both
 * ends; a half-open interval would understate every trip by exactly one day.
 *
 * Membership is time-varying and is resolved per day through `isSchengenOn`
 * from `@meridian/core`. Croatia joined on 2023-01-01; Bulgaria and Romania
 * fully acceded on 2025-01-01, having had internal air and sea controls lifted
 * on 2024-03-31. Days spent in those states before accession did not consume
 * the allowance, and a tracker that treats the membership table as timeless
 * will tell a traveller to leave a country they are entitled to be in.
 *
 * Days falling inside a staged-accession window are not resolved here. Use
 * `schengenAccessionAmbiguity` from `@meridian/core` to detect them and put the
 * question to a human: whether such a stay consumed allowance depends on how
 * the border was crossed, and a day count cannot recover that from a ledger.
 *
 * Nothing here decides whether a person is *admissible*. Border officers apply
 * conditions beyond the day count — funds, purpose, and the rest of art. 6(1) —
 * and a compliant count is not an entitlement to enter.
 */

import type { Citation, CountryCode, DateRange, IsoDate } from '@meridian/core';
import {
  MeridianError,
  addDays,
  diffDays,
  intersectRanges,
  isSchengenOn,
  lookbackWindow,
  rangeContains,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';
import { CATALOG_VERIFIED_ON } from './catalog-meta.js';
import type { PresenceLedger, Stay } from './ledger.js';
import { presenceRangesWhere, staysOverlapping } from './ledger.js';

/** Length of the rolling reference period, in days, including the reference day. */
export const SCHENGEN_WINDOW_DAYS = 180;

/** Maximum days of short-stay presence permitted inside one window. */
export const SCHENGEN_MAX_DAYS = 90;

export const SCHENGEN_SHORT_STAY_CITATION: Citation = {
  id: 'eu-sbc-art-6',
  kind: 'regulation',
  instrument:
    'Regulation (EU) 2016/399 of the European Parliament and of the Council (Schengen Borders Code)',
  provision: 'art. 6(1)-(2)',
  url: 'https://eur-lex.europa.eu/eli/reg/2016/399/oj',
  jurisdiction: 'X-SCHENGEN',
  verifiedOn: CATALOG_VERIFIED_ON,
  note:
    'Art. 6(1) permits a stay not exceeding 90 days in any 180-day period, considering the 180-day period ' +
    'preceding each day of stay. Art. 6(2) makes the date of entry the first day of stay and the date of exit ' +
    'the last. This module counts days only; the remaining entry conditions in art. 6(1) (purpose, means of ' +
    'subsistence, absence of an alert) are not modelled and a compliant count is not a right of entry.',
};

/**
 * Whether a stay charges `day` against the short-stay allowance.
 *
 * Two ways a day can fail to count. The state may not have been in the area on
 * that day, or the traveller may have been in that state on its own residence
 * permit or long-stay visa, in which case the day is not a short stay at all.
 */
export function countsAsSchengenShortStay(stay: Stay, day: IsoDate): boolean {
  if (stay.exemptFromSchengenShortStay === true) return false;
  return isSchengenOn(stay.country, day);
}

/** A stay's contribution to a window, already clipped to the days that actually counted. */
export interface SchengenContribution {
  readonly stayId: string;
  readonly country: CountryCode;
  /** The portion of the stay inside the window that charged against the allowance. */
  readonly countedRange: DateRange;
  readonly days: number;
}

export interface SchengenStatus {
  readonly referenceDate: IsoDate;
  readonly windowStart: IsoDate;
  readonly windowEnd: IsoDate;
  readonly daysUsed: number;
  /** `SCHENGEN_MAX_DAYS - daysUsed`, floored at zero. Never negative — see `daysOverLimit`. */
  readonly daysRemaining: number;
  /** Days beyond the allowance. Zero when compliant. */
  readonly daysOverLimit: number;
  readonly compliant: boolean;
  /**
   * The de-duplicated days that produced `daysUsed`. This is the working: a day
   * covered by two overlapping stays appears here once, because a person cannot
   * spend a day twice.
   */
  readonly countedRanges: readonly DateRange[];
  /**
   * Per-stay attribution. Summing `days` across contributions can exceed
   * `daysUsed` when stays overlap; that is a defect in the record rather than
   * in the count, and `detectInconsistencies` reports it.
   */
  readonly contributingStays: readonly SchengenContribution[];
  /** Stays inside the window that were excluded as non-short-stay presence. */
  readonly exemptStayIds: readonly string[];
}

function countedRunsForStay(stay: Stay, window: DateRange): DateRange[] {
  const clipped = intersectRanges(stay.range, window);
  if (clipped === null) return [];
  const out: DateRange[] = [];
  const span = rangeLengthDays(clipped);
  let runStart: IsoDate | null = null;
  let runEnd: IsoDate | null = null;
  for (let i = 0; i < span; i++) {
    const day = addDays(clipped.start, i);
    if (countsAsSchengenShortStay(stay, day)) {
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

/**
 * Short-stay position on one specific day.
 *
 * The reference day is inside its own window: the 180 days ending 2025-06-30
 * begin on 2025-01-02, and presence on 2025-06-30 itself is counted.
 */
export function schengenStatusOn(ledger: PresenceLedger, referenceDate: IsoDate): SchengenStatus {
  const window = lookbackWindow(referenceDate, SCHENGEN_WINDOW_DAYS);
  const countedRanges = presenceRangesWhere(ledger, window, countsAsSchengenShortStay);
  const daysUsed = totalDays(countedRanges);

  const contributingStays: SchengenContribution[] = [];
  const exemptStayIds: string[] = [];
  for (const stay of staysOverlapping(ledger, window)) {
    if (stay.exemptFromSchengenShortStay === true) {
      exemptStayIds.push(stay.id);
      continue;
    }
    for (const run of countedRunsForStay(stay, window)) {
      contributingStays.push({
        stayId: stay.id,
        country: stay.country,
        countedRange: run,
        days: rangeLengthDays(run),
      });
    }
  }

  return {
    referenceDate,
    windowStart: window.start,
    windowEnd: window.end,
    daysUsed,
    daysRemaining: Math.max(0, SCHENGEN_MAX_DAYS - daysUsed),
    daysOverLimit: Math.max(0, daysUsed - SCHENGEN_MAX_DAYS),
    compliant: daysUsed <= SCHENGEN_MAX_DAYS,
    countedRanges,
    contributingStays,
    exemptStayIds,
  };
}

/** Upper bound on a forward scan, ~10 years. Beyond this the caller has a bug, not a trip. */
export const SCHENGEN_MAX_SCAN_DAYS = 3_660;

export interface SchengenWorstDay {
  readonly date: IsoDate;
  readonly status: SchengenStatus;
}

/**
 * The day in `range` with the highest usage — the day that actually decides
 * whether a plan is lawful.
 *
 * Checking only the last day of a trip is the classic error: usage peaks
 * wherever an old stay is still inside the window, and it can fall again before
 * departure as those older days age out. Ties resolve to the earliest day,
 * because that is the first date on which the traveller would have been in
 * breach and therefore the one that matters.
 *
 * An empty ledger still returns a day: the first day of the range, with zero
 * used. Returning `null` for "nothing to report" would push a needless
 * null-check onto every caller.
 */
export function schengenWorstDay(ledger: PresenceLedger, range: DateRange): SchengenWorstDay {
  const span = rangeLengthDays(range);
  if (span > SCHENGEN_MAX_SCAN_DAYS) {
    throw new MeridianError(
      'INVALID_INPUT',
      `refusing to scan ${span} days for a worst-day search; the maximum is ${SCHENGEN_MAX_SCAN_DAYS}`,
      { start: range.start, end: range.end, days: span },
    );
  }

  // One boolean per day over the range plus the 179 days of history the first
  // day's window reaches back into, then a sliding sum. Recomputing the window
  // from scratch for every day would be 180x the work for the same answer.
  const historyStart = addDays(range.start, -(SCHENGEN_WINDOW_DAYS - 1));
  const scan: DateRange = { start: historyStart, end: range.end };
  const total = rangeLengthDays(scan);
  const candidates = staysOverlapping(ledger, scan);
  const present: number[] = new Array<number>(total).fill(0);
  for (let i = 0; i < total; i++) {
    const day = addDays(historyStart, i);
    const hit = candidates.some(
      (s) => rangeContains(s.range, day) && countsAsSchengenShortStay(s, day),
    );
    present[i] = hit ? 1 : 0;
  }

  let used = 0;
  for (let i = 0; i < SCHENGEN_WINDOW_DAYS - 1 && i < total; i++) used += present[i] ?? 0;

  let bestIndex = SCHENGEN_WINDOW_DAYS - 1;
  let bestUsed = -1;
  for (let i = SCHENGEN_WINDOW_DAYS - 1; i < total; i++) {
    used += present[i] ?? 0;
    if (used > bestUsed) {
      bestUsed = used;
      bestIndex = i;
    }
    used -= present[i - (SCHENGEN_WINDOW_DAYS - 1)] ?? 0;
  }

  const date = addDays(historyStart, bestIndex);
  return { date, status: schengenStatusOn(ledger, date) };
}

/** How far forward {@link schengenNextEntryDate} looks before giving up. */
export const SCHENGEN_DEFAULT_HORIZON_DAYS = 730;

export interface NextEntryOptions {
  /** Days to search from `notBefore` inclusive. Defaults to {@link SCHENGEN_DEFAULT_HORIZON_DAYS}. */
  readonly horizonDays?: number;
}

/**
 * The earliest day on or after `notBefore` on which an unbroken stay of
 * `desiredStayDays` would be lawful for every one of its days.
 *
 * The test is applied to each day of the hypothetical stay, not just its start
 * or its end, because the window slides underneath the traveller as they sit
 * there. Existing ledger presence — including future trips already recorded —
 * is counted, since those days are inside the same windows.
 *
 * Returns `null` when no such day exists inside the horizon, and immediately
 * when `desiredStayDays` exceeds {@link SCHENGEN_MAX_DAYS}: a continuous stay
 * of 91 days breaches on its 91st day no matter when it starts, so there is no
 * date to find.
 */
export function schengenNextEntryDate(
  ledger: PresenceLedger,
  desiredStayDays: number,
  notBefore: IsoDate,
  options: NextEntryOptions = {},
): IsoDate | null {
  if (!Number.isInteger(desiredStayDays) || desiredStayDays < 1) {
    throw new MeridianError(
      'INVALID_INPUT',
      `desiredStayDays must be a positive integer, got ${desiredStayDays}`,
      { desiredStayDays },
    );
  }
  if (desiredStayDays > SCHENGEN_MAX_DAYS) return null;

  const horizonDays = options.horizonDays ?? SCHENGEN_DEFAULT_HORIZON_DAYS;
  if (!Number.isInteger(horizonDays) || horizonDays < 1) {
    throw new MeridianError(
      'INVALID_INPUT',
      `horizonDays must be a positive integer, got ${horizonDays}`,
      { horizonDays },
    );
  }
  if (horizonDays > SCHENGEN_MAX_SCAN_DAYS) {
    throw new MeridianError(
      'INVALID_INPUT',
      `refusing to search ${horizonDays} days ahead; the maximum is ${SCHENGEN_MAX_SCAN_DAYS}`,
      { horizonDays },
    );
  }

  const lead = SCHENGEN_WINDOW_DAYS - 1;
  const origin = addDays(notBefore, -lead);
  const total = lead + horizonDays + desiredStayDays - 1;
  const scan: DateRange = { start: origin, end: addDays(origin, total - 1) };
  const candidates = staysOverlapping(ledger, scan);

  // prefix[i] = number of counted days strictly before index i.
  const prefix: number[] = new Array<number>(total + 1).fill(0);
  for (let i = 0; i < total; i++) {
    const day = addDays(origin, i);
    const hit = candidates.some(
      (s) => rangeContains(s.range, day) && countsAsSchengenShortStay(s, day),
    );
    prefix[i + 1] = (prefix[i] ?? 0) + (hit ? 1 : 0);
  }
  const sum = (lo: number, hi: number): number =>
    hi < lo ? 0 : (prefix[hi + 1] ?? 0) - (prefix[lo] ?? 0);

  for (let k = 0; k < horizonDays; k++) {
    const stayLo = lead + k;
    const stayHi = stayLo + desiredStayDays - 1;
    let lawful = true;
    for (let t = stayLo; t <= stayHi; t++) {
      const winLo = t - lead;
      const winHi = t;
      // Recorded presence in the window, minus whatever of it lies under the
      // hypothetical stay (those days are about to be counted as present
      // anyway), plus every day of the stay that falls inside the window.
      const overlapLo = Math.max(winLo, stayLo);
      const overlapHi = Math.min(winHi, stayHi);
      const overlapDaysCount = overlapHi - overlapLo + 1;
      const used = sum(winLo, winHi) - sum(overlapLo, overlapHi) + overlapDaysCount;
      if (used > SCHENGEN_MAX_DAYS) {
        lawful = false;
        break;
      }
    }
    if (lawful) return addDays(notBefore, k);
  }
  return null;
}

/**
 * Days until the allowance recovers to at least `wantedDays`, measured from
 * `referenceDate`, or `null` if it does not inside the horizon.
 *
 * Convenience over {@link schengenNextEntryDate} for the common question
 * "when can I go back for a week?", expressed as a wait rather than a date.
 */
export function schengenDaysUntilEligible(
  ledger: PresenceLedger,
  wantedDays: number,
  referenceDate: IsoDate,
  options: NextEntryOptions = {},
): number | null {
  const date = schengenNextEntryDate(ledger, wantedDays, referenceDate, options);
  if (date === null) return null;
  // The search starts at `referenceDate`, so the result is never earlier and
  // the difference is never negative. Zero means "today".
  return diffDays(referenceDate, date);
}
