/**
 * Day counts against tax-residence thresholds.
 *
 * **This module answers "how many days". It never answers "are you tax
 * resident."** That distinction is the whole reason the file is shaped the way
 * it is, and collapsing it is the difference between an assessment and
 * negligent advice.
 *
 * A day count is one limb of a residence test, and in both jurisdictions in
 * this catalog it is not the only one:
 *
 * - Spain. Art. 9.1 of Ley 35/2006 makes a person resident if they spend more
 *   than 183 days of the calendar year in Spanish territory **or** if the main
 *   base of their activities or economic interests sits in Spain. The second
 *   limb stands on its own: someone can fail the day count comfortably and
 *   still be resident. The same provision also counts *sporadic absences*
 *   toward the 183 unless residence in another country is evidenced by a tax
 *   certificate, so the raw ledger count can understate the statutory figure.
 * - Canada. s. 250(1)(a) of the Income Tax Act deems a person resident for the
 *   whole year if they *sojourned* here for 183 days or more. "Sojourn" is a
 *   term of art for a temporary stay, so days on which the person was already
 *   a factual resident are not sojourning days and the raw count can overstate.
 *   Factual residency is a separate, fact-driven test, and a tax treaty
 *   tie-breaker can displace either result.
 *
 * So the output of this module is arithmetic plus a citation, deliberately
 * without a conclusion. The conclusion belongs to someone licensed to reach it.
 */

import type { Citation, CountryCode, DateRange, IsoDate } from '@meridian/core';
import {
  MeridianError,
  addDays,
  addYears,
  calendarYearRange,
  compareDates,
  intersectRanges,
  maxDate,
  minDate,
  partsOf,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';
import { CATALOG_VERIFIED_ON } from './catalog-meta.js';
import type { PresenceLedger } from './ledger.js';
import { countryPresenceRanges } from './ledger.js';

/**
 * How the counting window is drawn.
 *
 * Jurisdictions genuinely differ, and hard-coding the calendar year would make
 * the engine silently wrong wherever it does not apply.
 */
export type ThresholdBasis =
  /** 1 January to 31 December of the year the reference date falls in. */
  | 'calendar_year'
  /** The twelve calendar months ending on, and including, the reference date. */
  | 'rolling_12_months';

/**
 * Whether the statutory text says "183 days or more" or "more than 183 days".
 *
 * One word, one day, and in a marginal case one tax residence. Modelling it as
 * an operator rather than baking `184` into the threshold keeps the encoded
 * number identical to the number in the instrument, which is what a reviewer
 * checking the catalog against the source will be looking for.
 */
export type ThresholdComparison = 'at_least' | 'more_than';

export interface DayCountThreshold {
  readonly id: string;
  readonly label: string;
  readonly country: CountryCode;
  readonly basis: ThresholdBasis;
  /** The figure exactly as the instrument states it. */
  readonly thresholdDays: number;
  readonly comparison: ThresholdComparison;
  readonly citation: Citation;
}

/** The first day-count that satisfies the threshold, resolving the comparison operator. */
export function requiredDays(threshold: DayCountThreshold): number {
  return threshold.comparison === 'more_than' ? threshold.thresholdDays + 1 : threshold.thresholdDays;
}

export interface DayCountEvaluation {
  readonly threshold: DayCountThreshold;
  readonly referenceDate: IsoDate;
  /** The window the days were counted over. */
  readonly window: DateRange;
  readonly daysPresent: number;
  /** The figure from the instrument, restated so the arithmetic is inspectable. */
  readonly thresholdDays: number;
  /** The first count that meets it — `thresholdDays + 1` for a "more than" test. */
  readonly requiredDays: number;
  /**
   * Further days of presence before the threshold is met. Zero or negative
   * means it is already met, and the magnitude is how far past it the count is.
   */
  readonly marginDays: number;
  readonly met: boolean;
  /** The day the running count first reached `requiredDays`, if it has. */
  readonly metOn: IsoDate | null;
  /**
   * The day the threshold would be met if the person were present every day
   * from the day after `referenceDate` onward, or `null` if it would not be
   * inside the projection horizon.
   *
   * The projection deliberately ignores stays recorded after `referenceDate`:
   * unbroken presence is a superset of any planned trip, so counting both would
   * double up. It is a what-if, not a forecast of what the person will do.
   */
  readonly projectedCrossingOn: IsoDate | null;
  /** The de-duplicated presence that produced `daysPresent`. */
  readonly countedRanges: readonly DateRange[];
}

/** The window a threshold is measured over for a given reference date. */
export function windowForThreshold(
  threshold: DayCountThreshold,
  referenceDate: IsoDate,
): DateRange {
  if (threshold.basis === 'calendar_year') {
    return calendarYearRange(partsOf(referenceDate).year);
  }
  // Twelve calendar months ending on the reference date, inclusive at both
  // ends: 2025-03-01 back to 2024-03-02. Using a fixed 365 would drift by a day
  // across a leap year, which is exactly the sort of silent error that turns a
  // 182-day count into 183.
  return { start: addDays(addYears(referenceDate, -1), 1), end: referenceDate };
}

/**
 * Days of presence in one country during a calendar year, counting each day
 * once however many overlapping records cover it.
 */
export function daysPresentInCalendarYear(
  ledger: PresenceLedger,
  country: CountryCode,
  year: number,
): number {
  if (!Number.isInteger(year)) {
    throw new MeridianError('INVALID_INPUT', `year must be an integer, got ${year}`, { year });
  }
  return totalDays(countryPresenceRanges(ledger, country, calendarYearRange(year)));
}

/** How far {@link evaluateDayCountThreshold} projects forward. Two years covers a full cycle of either basis. */
export const DEFAULT_PROJECTION_HORIZON_DAYS = 730;

export interface EvaluationOptions {
  readonly projectionHorizonDays?: number;
}

function satisfies(count: number, threshold: DayCountThreshold): boolean {
  return threshold.comparison === 'more_than'
    ? count > threshold.thresholdDays
    : count >= threshold.thresholdDays;
}

/** Days of recorded presence inside `window`, using pre-merged country ranges. */
function daysWithin(merged: readonly DateRange[], window: DateRange): number {
  let sum = 0;
  for (const r of merged) {
    const hit = intersectRanges(r, window);
    if (hit !== null) sum += rangeLengthDays(hit);
  }
  return sum;
}

/**
 * Measure a ledger against a day-count threshold and show the working.
 *
 * Presence recorded after `referenceDate` is included in `daysPresent`, because
 * a trip already booked is part of the window whether or not it has happened.
 * `detectInconsistencies` is what separates elapsed days from planned ones; a
 * caller presenting this figure to a person should say which it is.
 */
export function evaluateDayCountThreshold(
  ledger: PresenceLedger,
  threshold: DayCountThreshold,
  referenceDate: IsoDate,
  options: EvaluationOptions = {},
): DayCountEvaluation {
  const window = windowForThreshold(threshold, referenceDate);
  const allRanges = countryPresenceRanges(ledger, threshold.country);
  const countedRanges = countryPresenceRanges(ledger, threshold.country, window);
  const daysPresent = totalDays(countedRanges);
  const needed = requiredDays(threshold);
  const met = satisfies(daysPresent, threshold);

  // The day the running total first hit `needed`, found by walking the merged
  // ranges rather than the calendar — ranges are few, days are many.
  let metOn: IsoDate | null = null;
  if (met) {
    let running = 0;
    for (const r of countedRanges) {
      const len = rangeLengthDays(r);
      if (running + len >= needed) {
        metOn = addDays(r.start, needed - running - 1);
        break;
      }
      running += len;
    }
  }

  const horizon = options.projectionHorizonDays ?? DEFAULT_PROJECTION_HORIZON_DAYS;
  if (!Number.isInteger(horizon) || horizon < 0) {
    throw new MeridianError(
      'INVALID_INPUT',
      `projectionHorizonDays must be a non-negative integer, got ${horizon}`,
      { projectionHorizonDays: horizon },
    );
  }

  let projectedCrossingOn: IsoDate | null = null;
  if (!met) {
    for (let step = 1; step <= horizon; step++) {
      const day = addDays(referenceDate, step);
      const w = windowForThreshold(threshold, day);
      // Recorded days in the window up to and including the reference date.
      const recordedEnd = minDate(w.end, referenceDate);
      const recorded =
        compareDates(w.start, recordedEnd) <= 0
          ? daysWithin(allRanges, { start: w.start, end: recordedEnd })
          : 0;
      // Assumed unbroken presence from the day after the reference date.
      const assumedStart = maxDate(w.start, addDays(referenceDate, 1));
      const assumed =
        compareDates(assumedStart, day) <= 0
          ? rangeLengthDays({ start: assumedStart, end: day })
          : 0;
      if (satisfies(recorded + assumed, threshold)) {
        projectedCrossingOn = day;
        break;
      }
    }
  }

  return {
    threshold,
    referenceDate,
    window,
    daysPresent,
    thresholdDays: threshold.thresholdDays,
    requiredDays: needed,
    marginDays: needed - daysPresent,
    met,
    metOn,
    projectedCrossingOn,
    countedRanges,
  };
}

/**
 * Spain — the day-count limb of the personal income tax residence test.
 *
 * Art. 9.1.a of Ley 35/2006: a person is resident where they remain more than
 * 183 days in Spanish territory during the calendar year. "More than", not "at
 * least": 183 days is not enough, 184 is.
 */
export const SPAIN_IRPF_DAY_COUNT: DayCountThreshold = {
  id: 'es-irpf-183',
  label: 'Spain — days-of-presence limb of the IRPF residence test',
  country: 'ES' as CountryCode,
  basis: 'calendar_year',
  thresholdDays: 183,
  comparison: 'more_than',
  citation: {
    id: 'es-irpf-art-9-1-a',
    kind: 'statute',
    instrument: 'Ley 35/2006, del Impuesto sobre la Renta de las Personas Físicas',
    provision: 'art. 9.1.a',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
    jurisdiction: 'ES',
    verifiedOn: CATALOG_VERIFIED_ON,
    note:
      'One limb of a two-limb test. Art. 9.1.b independently makes a person resident where the main base of ' +
      'their activities or economic interests is in Spain, regardless of days. Art. 9.1.a also counts sporadic ' +
      'absences toward the 183 unless tax residence elsewhere is evidenced by a certificate, so a ledger count ' +
      'of physical presence can be lower than the statutory figure. This module counts recorded days; it does ' +
      'not determine residence and does not apply treaty tie-breakers.',
  },
};

/**
 * Canada — the sojourner limb of deemed residence.
 *
 * s. 250(1)(a) of the Income Tax Act deems a person resident throughout the
 * year where they sojourned in Canada for periods totalling 183 days or more.
 * "Or more", so 183 is enough.
 */
export const CANADA_SOJOURNER_DAY_COUNT: DayCountThreshold = {
  id: 'ca-sojourner-183',
  label: 'Canada — sojourner limb of deemed residence',
  country: 'CA' as CountryCode,
  basis: 'calendar_year',
  thresholdDays: 183,
  comparison: 'at_least',
  citation: {
    id: 'ca-ita-s-250-1-a',
    kind: 'statute',
    instrument: 'Income Tax Act (Canada), R.S.C. 1985, c. 1 (5th Supp.)',
    provision: 's. 250(1)(a)',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/i-3.3/',
    jurisdiction: 'CA',
    verifiedOn: CATALOG_VERIFIED_ON,
    discretionary: true,
    note:
      'The 183-day figure is statutory, but which days count is not a mechanical question: s. 250(1)(a) counts ' +
      'days *sojourning*, a temporary stay, so days on which the person was already a factual resident are ' +
      'excluded and this count can overstate. Factual residence is a separate fact-driven test, and a treaty ' +
      'tie-breaker (for example Article IV of the Canada-United States convention) can displace deemed ' +
      'residence entirely. Characterising the days requires counsel; this module only totals them.',
  },
};

/** Every day-count threshold in this catalog. Deliberately short — see the module note on inventing law. */
export const TAX_DAY_COUNT_THRESHOLDS: readonly DayCountThreshold[] = [
  SPAIN_IRPF_DAY_COUNT,
  CANADA_SOJOURNER_DAY_COUNT,
];

/**
 * Build a threshold that is not in the catalog.
 *
 * `rolling_12_months` is supported by the evaluator but no rolling threshold
 * ships here, because neither jurisdiction currently in scope uses one and
 * fabricating a plausible-looking rule for a third would be worse than the gap.
 * Callers with counsel-verified rules of their own supply them through this.
 */
export function dayCountThreshold(spec: DayCountThreshold): DayCountThreshold {
  if (!Number.isInteger(spec.thresholdDays) || spec.thresholdDays < 1) {
    throw new MeridianError(
      'INVALID_INPUT',
      `thresholdDays must be a positive integer, got ${spec.thresholdDays}`,
      { id: spec.id, thresholdDays: spec.thresholdDays },
    );
  }
  if (spec.citation.id.trim().length === 0) {
    throw new MeridianError('INVALID_INPUT', `threshold ${spec.id} has no citation id`, {
      id: spec.id,
    });
  }
  return spec;
}
