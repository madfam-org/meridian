/**
 * Civil (calendar) date arithmetic with no timezone, no `Date`, no drift.
 *
 * Immigration day-counting is *civil-date* arithmetic: "the day you entered
 * Spain" is a calendar day, not an instant. Using `Date` here is a correctness
 * bug waiting to happen — a UTC-vs-local off-by-one silently converts a
 * 90-day Schengen stay into 91 and costs a client their status.
 *
 * All arithmetic goes through Howard Hinnant's `days_from_civil` /
 * `civil_from_days` algorithms, which are exact for the proleptic Gregorian
 * calendar over the entire range we care about.
 *
 * @see http://howardhinnant.github.io/date_algorithms.html
 */

/** A calendar date in strict `YYYY-MM-DD` form. Branded so it cannot be confused with a plain string. */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

/** Serial day number relative to 1970-01-01 (which is day 0). Negative before that. */
export type DayNumber = number & { readonly __brand: 'DayNumber' };

const ISO_DATE_RE = /^(-?\d{4,})-(\d{2})-(\d{2})$/;

export class InvalidDateError extends Error {
  constructor(value: string, reason: string) {
    super(`Invalid civil date ${JSON.stringify(value)}: ${reason}`);
    this.name = 'InvalidDateError';
  }
}

/** True when `y` is a leap year in the proleptic Gregorian calendar. */
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Number of days in `month` (1-12) of `year`. */
export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) throw new RangeError(`month out of range: ${month}`);
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] as number;
}

/**
 * Parse and validate a `YYYY-MM-DD` string into an `IsoDate`.
 * Rejects impossible dates (`2025-02-30`) rather than silently rolling over,
 * which is what `new Date('2025-02-30')` does.
 */
export function isoDate(value: string): IsoDate {
  const m = ISO_DATE_RE.exec(value);
  if (!m) throw new InvalidDateError(value, 'expected YYYY-MM-DD');
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) throw new InvalidDateError(value, `month ${month} out of range 1-12`);
  const dim = daysInMonth(year, month);
  if (day < 1 || day > dim) {
    throw new InvalidDateError(value, `day ${day} out of range 1-${dim} for ${year}-${m[2]}`);
  }
  return value as IsoDate;
}

/** Non-throwing variant of {@link isoDate}. */
export function tryIsoDate(value: string): IsoDate | null {
  try {
    return isoDate(value);
  } catch {
    return null;
  }
}

/** True when `value` is a syntactically and calendrically valid `YYYY-MM-DD` string. */
export function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === 'string' && tryIsoDate(value) !== null;
}

/** Split an `IsoDate` into its numeric parts. */
export function partsOf(date: IsoDate): { year: number; month: number; day: number } {
  const m = ISO_DATE_RE.exec(date) as RegExpExecArray;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Build an `IsoDate` from numeric parts, validating the result. */
export function fromParts(year: number, month: number, day: number): IsoDate {
  const pad = (n: number, w: number) => String(Math.abs(n)).padStart(w, '0');
  const sign = year < 0 ? '-' : '';
  return isoDate(`${sign}${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`);
}

/** Days since the 1970-01-01 epoch. Exact, no floating point, no timezone. */
export function toDayNumber(date: IsoDate): DayNumber {
  const { year, month, day } = partsOf(date);
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400; // [0, 399]
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1; // [0, 365]
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // [0, 146096]
  return (era * 146097 + doe - 719468) as DayNumber;
}

/** Inverse of {@link toDayNumber}. */
export function fromDayNumber(n: DayNumber): IsoDate {
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097; // [0, 146096]
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)); // [0, 365]
  const mp = Math.floor((5 * doy + 2) / 153); // [0, 11]
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1; // [1, 31]
  const m = mp + (mp < 10 ? 3 : -9); // [1, 12]
  return fromParts(y + (m <= 2 ? 1 : 0), m, d);
}

/** `date` shifted by `days` (may be negative). */
export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isInteger(days)) throw new RangeError(`addDays expects an integer, got ${days}`);
  return fromDayNumber((toDayNumber(date) + days) as DayNumber);
}

/**
 * Calendar-month shift, clamping to the end of the target month.
 * `2025-01-31 + 1 month` is `2025-02-28`, matching how immigration authorities
 * read "three months from" — not `2025-03-03`.
 */
export function addMonths(date: IsoDate, months: number): IsoDate {
  if (!Number.isInteger(months)) throw new RangeError(`addMonths expects an integer, got ${months}`);
  const { year, month, day } = partsOf(date);
  const total = year * 12 + (month - 1) + months;
  const ty = Math.floor(total / 12);
  const tm = total - ty * 12 + 1;
  return fromParts(ty, tm, Math.min(day, daysInMonth(ty, tm)));
}

/** `addMonths(date, years * 12)`. */
export function addYears(date: IsoDate, years: number): IsoDate {
  return addMonths(date, years * 12);
}

/** `b - a` in whole days. Positive when `b` is later. */
export function diffDays(a: IsoDate, b: IsoDate): number {
  return toDayNumber(b) - toDayNumber(a);
}

/** -1, 0, or 1. Suitable as an `Array.prototype.sort` comparator. */
export function compareDates(a: IsoDate, b: IsoDate): -1 | 0 | 1 {
  const d = toDayNumber(a) - toDayNumber(b);
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}

export function minDate(a: IsoDate, b: IsoDate): IsoDate {
  return compareDates(a, b) <= 0 ? a : b;
}

export function maxDate(a: IsoDate, b: IsoDate): IsoDate {
  return compareDates(a, b) >= 0 ? a : b;
}

/**
 * A closed civil-date interval: both `start` and `end` are *included*.
 *
 * Inclusivity is the whole ballgame in immigration law. Schengen counts the day
 * of entry and the day of exit as days of presence, so a 2025-01-01 → 2025-01-01
 * trip is one day present, not zero.
 */
export interface DateRange {
  readonly start: IsoDate;
  /** Inclusive. */
  readonly end: IsoDate;
}

export function dateRange(start: IsoDate, end: IsoDate): DateRange {
  if (compareDates(start, end) > 0) {
    throw new RangeError(`date range start ${start} is after end ${end}`);
  }
  return { start, end };
}

/** Inclusive length of a range, in days. A single-day range has length 1. */
export function rangeLengthDays(r: DateRange): number {
  return diffDays(r.start, r.end) + 1;
}

/** True when `date` falls inside the closed interval `r`. */
export function rangeContains(r: DateRange, date: IsoDate): boolean {
  return compareDates(r.start, date) <= 0 && compareDates(date, r.end) <= 0;
}

/** The overlapping portion of two closed intervals, or `null` when they are disjoint. */
export function intersectRanges(a: DateRange, b: DateRange): DateRange | null {
  const start = maxDate(a.start, b.start);
  const end = minDate(a.end, b.end);
  return compareDates(start, end) <= 0 ? { start, end } : null;
}

/** Number of days of `a` that fall inside `b`. Zero when disjoint. */
export function overlapDays(a: DateRange, b: DateRange): number {
  const i = intersectRanges(a, b);
  return i === null ? 0 : rangeLengthDays(i);
}

/**
 * Merge overlapping and *adjacent* ranges into a minimal disjoint set, sorted
 * ascending. Adjacent means `end + 1 === next.start`; two back-to-back stays
 * are one continuous presence, and counting the seam twice inflates totals.
 */
export function mergeRanges(ranges: readonly DateRange[]): DateRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((x, y) => compareDates(x.start, y.start));
  const out: DateRange[] = [];
  let current: DateRange = sorted[0] as DateRange;
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i] as DateRange;
    if (toDayNumber(next.start) <= toDayNumber(current.end) + 1) {
      current = { start: current.start, end: maxDate(current.end, next.end) };
    } else {
      out.push(current);
      current = next;
    }
  }
  out.push(current);
  return out;
}

/** Total days covered by `ranges` after de-duplicating overlaps. */
export function totalDays(ranges: readonly DateRange[]): number {
  return mergeRanges(ranges).reduce((sum, r) => sum + rangeLengthDays(r), 0);
}

/** The gaps between merged ranges, bounded by `within`. Used to find absences between stays. */
export function complementRanges(ranges: readonly DateRange[], within: DateRange): DateRange[] {
  const merged = mergeRanges(ranges)
    .map((r) => intersectRanges(r, within))
    .filter((r): r is DateRange => r !== null);
  const gaps: DateRange[] = [];
  let cursor = within.start;
  for (const r of merged) {
    if (compareDates(cursor, r.start) < 0) {
      gaps.push({ start: cursor, end: addDays(r.start, -1) });
    }
    cursor = maxDate(cursor, addDays(r.end, 1));
  }
  if (compareDates(cursor, within.end) <= 0) {
    gaps.push({ start: cursor, end: within.end });
  }
  return gaps;
}

/** The calendar year `date` falls in, as a closed range. */
export function calendarYearRange(year: number): DateRange {
  return { start: fromParts(year, 1, 1), end: fromParts(year, 12, 31) };
}

/**
 * A closed lookback window of `days` ending on (and including) `end`.
 * A 180-day window ending 2025-06-30 starts on 2025-01-02, not 2025-01-01 —
 * the endpoint is one of the 180.
 */
export function lookbackWindow(end: IsoDate, days: number): DateRange {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`lookback window must be a positive integer number of days, got ${days}`);
  }
  return { start: addDays(end, -(days - 1)), end };
}

/** Every date in a closed range, ascending. Guard the size before calling on wide ranges. */
export function eachDay(r: DateRange): IsoDate[] {
  const out: IsoDate[] = [];
  const last = toDayNumber(r.end);
  for (let n = toDayNumber(r.start); n <= last; n++) out.push(fromDayNumber(n as DayNumber));
  return out;
}
