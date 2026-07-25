/**
 * Two-digit years, resolved without a pivot.
 *
 * MRZ dates are six characters, `YYMMDD`, with no century. Recovering the
 * century is guesswork constrained by context, and the context differs for the
 * two date fields a travel document carries: a birth date is in the past, an
 * expiry date is mostly in the future. So they get separate rules.
 *
 * The rules are *sliding windows anchored to a reference date*, never a
 * hard-coded pivot year. A pivot ("years below 30 are 20xx") is a dated bug: it
 * is correct when written, degrades silently, and fires years later on somebody
 * else's shift. A window anchored to the reference date is correct for as long
 * as the code runs, and — just as important — it is reproducible. Passing the
 * same reference date always yields the same answer, which is what lets an
 * assessment made in 2026 be re-derived identically in 2031 when a tribunal
 * asks how the number was reached.
 *
 * Neither window can be right in every case, because the format genuinely
 * throws the information away. Both limitations are stated below rather than
 * hidden, because a caseworker who knows the rule can override it and one who
 * does not cannot.
 *
 * Nothing in this file uses `Date` for arithmetic. Calendar dates are compared
 * as zero-padded `YYYY-MM-DD` strings, which is exact calendar order for
 * four-digit years, and the leap-year rule is the proleptic Gregorian one.
 */

import type { MrzDateFailure, MrzDateReading } from './types.js';

/**
 * The birth window is the 100 years ending on (and including) the reference
 * date: a birth date resolves to the most recent century that does not put the
 * person in the future.
 *
 * The cost of this rule is that someone aged over 100 is read as a newborn.
 * That is unavoidable — `YY` cannot distinguish 1924 from 2024 — and it is the
 * behaviour every border system exhibits. The alternative, biasing the window
 * backwards, misreads every infant instead, and infants with travel documents
 * vastly outnumber centenarians with them.
 */
export const BIRTH_WINDOW_YEARS = 100;

/**
 * The expiry window is the 100 years starting 30 years before the reference
 * date: `[reference - 30y, reference + 70y)`.
 *
 * Thirty years of lookback because no state issues a travel document with more
 * than about ten years of validity, so a document that expired more than three
 * decades ago is not one anybody is presenting at a counter — while an expired
 * passport from a few years ago is presented constantly, as proof of past
 * status or of a prior identity, and must resolve into the past rather than
 * seventy years into the future.
 *
 * The cost is at the far edge: an expiry of, say, `960101` read on 2026-07-25
 * falls just outside the lookback and resolves to 2096 rather than 1996. That
 * is the documented consequence of choosing a boundary at all, and it is why
 * `validateMrz` reports the resolved date instead of quietly using it.
 */
export const EXPIRY_LOOKBACK_YEARS = 30;

/** The forward half of the expiry window. Together with the lookback, 100 years. */
export const EXPIRY_LOOKAHEAD_YEARS = 100 - EXPIRY_LOOKBACK_YEARS;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Reference dates are constrained to four-digit years well inside the range
 * where `YYYY-MM-DD` string comparison is exact, so the window bounds can never
 * grow a fifth digit and break ordering.
 */
const MIN_REFERENCE_YEAR = 1900;
const MAX_REFERENCE_YEAR = 2900;

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] as number;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

/**
 * A zero-padded `YYYY-MM-DD` ordering key.
 *
 * This is used for window bounds as well as for real dates, and a bound is not
 * required to be a date that exists: the 100-years-before key for a reference
 * of 2000-02-29 is the string `1900-02-29`, which never happened. As a
 * comparison key it is still exactly right, and treating it as one avoids
 * having to shift a date by a century — an operation that would itself need a
 * clamping rule and a reason for choosing it.
 */
function key(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface ReferenceParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly key: string;
}

function parseReference(referenceDate: string): ReferenceParts {
  const m = ISO_DATE_RE.exec(referenceDate);
  if (!m) {
    throw new RangeError(
      `reference date must be YYYY-MM-DD, got ${JSON.stringify(referenceDate)}`,
    );
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isRealDate(year, month, day)) {
    throw new RangeError(`reference date ${referenceDate} is not a calendar date`);
  }
  if (year < MIN_REFERENCE_YEAR || year > MAX_REFERENCE_YEAR) {
    throw new RangeError(
      `reference date year must be between ${MIN_REFERENCE_YEAR} and ${MAX_REFERENCE_YEAR}, got ${year}`,
    );
  }
  return { year, month, day, key: key(year, month, day) };
}

type RawDate =
  | { readonly kind: 'digits'; readonly yy: number; readonly month: number; readonly day: number }
  | { readonly kind: 'failure'; readonly reason: MrzDateFailure };

function readRaw(raw: string): RawDate {
  if (raw.length !== 6) return { kind: 'failure', reason: 'wrong_length' };
  let fillers = 0;
  for (let i = 0; i < 6; i++) {
    const c = raw.charCodeAt(i);
    if (c === 60) {
      fillers++;
      continue;
    }
    if (c < 48 || c > 57) return { kind: 'failure', reason: 'non_numeric' };
  }
  if (fillers === 6) return { kind: 'failure', reason: 'all_filler' };
  if (fillers > 0) return { kind: 'failure', reason: 'partial_filler' };
  return {
    kind: 'digits',
    yy: Number(raw.slice(0, 2)),
    month: Number(raw.slice(2, 4)),
    day: Number(raw.slice(4, 6)),
  };
}

/**
 * Find the century that puts `yy/month/day` inside the window.
 *
 * A window exactly 100 years wide admits at most one candidate, so this is
 * deterministic. Three centuries are tried because a window can straddle a
 * century boundary; `anchorYear` is the window's lower bound.
 *
 * When the only in-window candidate is not a real date — `000229` inside a
 * window that admits 1900 but not 2000 — no candidate qualifies and the caller
 * reports `not_a_calendar_date`. That is the correct answer: 1900-02-29 never
 * existed, and silently sliding to the next century would invent a birth date
 * a century away from the one on the document.
 */
function resolveCentury(
  yy: number,
  month: number,
  day: number,
  anchorYear: number,
  inWindow: (candidateKey: string) => boolean,
): string | null {
  const base = Math.floor(anchorYear / 100) * 100;
  for (const century of [base - 100, base, base + 100]) {
    const year = century + yy;
    if (year < MIN_REFERENCE_YEAR - 100 || !isRealDate(year, month, day)) continue;
    const candidate = key(year, month, day);
    if (inWindow(candidate)) return candidate;
  }
  return null;
}

/**
 * Read a `YYMMDD` date of birth as `YYYY-MM-DD`.
 *
 * Resolves into the 100 years ending on `referenceDate` inclusive: a birth date
 * equal to the reference date is a newborn and is accepted; one day later is
 * read as a century earlier, because nobody is born tomorrow.
 *
 * @param referenceDate `YYYY-MM-DD`. Pass the date the assessment is being made
 *   on, not the current wall clock, if you need the result to be reproducible.
 * @throws {RangeError} when `referenceDate` is not a calendar date in range —
 *   that is a caller bug, not a document defect, and must not be swallowed.
 */
export function interpretBirthDate(yymmdd: string, referenceDate: string): MrzDateReading {
  const ref = parseReference(referenceDate);
  const raw = readRaw(yymmdd);
  if (raw.kind === 'failure') return { ok: false, reason: raw.reason };

  const lowBound = key(ref.year - BIRTH_WINDOW_YEARS, ref.month, ref.day);
  const resolved = resolveCentury(
    raw.yy,
    raw.month,
    raw.day,
    ref.year - BIRTH_WINDOW_YEARS,
    (candidate) => candidate > lowBound && candidate <= ref.key,
  );
  return resolved === null ? { ok: false, reason: 'not_a_calendar_date' } : { ok: true, value: resolved };
}

/**
 * Read a `YYMMDD` date of expiry as `YYYY-MM-DD`.
 *
 * Resolves into `[referenceDate - 30 years, referenceDate + 70 years)`. See
 * {@link EXPIRY_LOOKBACK_YEARS} for why the window is not centred on the
 * reference date: expired documents are presented all the time, and a rule that
 * pushed every one of them a century into the future would report a lapsed
 * passport as valid.
 *
 * @throws {RangeError} when `referenceDate` is not a calendar date in range.
 */
export function interpretExpiryDate(yymmdd: string, referenceDate: string): MrzDateReading {
  const ref = parseReference(referenceDate);
  const raw = readRaw(yymmdd);
  if (raw.kind === 'failure') return { ok: false, reason: raw.reason };

  const lowBound = key(ref.year - EXPIRY_LOOKBACK_YEARS, ref.month, ref.day);
  const highBound = key(ref.year + EXPIRY_LOOKAHEAD_YEARS, ref.month, ref.day);
  const resolved = resolveCentury(
    raw.yy,
    raw.month,
    raw.day,
    ref.year - EXPIRY_LOOKBACK_YEARS,
    (candidate) => candidate >= lowBound && candidate < highBound,
  );
  return resolved === null ? { ok: false, reason: 'not_a_calendar_date' } : { ok: true, value: resolved };
}

/**
 * Today's date in UTC, as `YYYY-MM-DD`.
 *
 * The default reference date when a caller supplies none. UTC rather than local
 * time so that two servers in different regions resolve the same MRZ the same
 * way. The residual risk is genuinely small: the reference date is used only to
 * choose a century, so being one day off changes an answer only for a birth
 * date falling exactly on the boundary — and it changes it by exactly one
 * century, which is visible rather than subtle. Callers who need reproducible
 * output should still pass `referenceDate` explicitly.
 */
export function todayUtc(): string {
  const now = new Date();
  return key(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
}
