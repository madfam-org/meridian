/**
 * Accumulating qualifying work experience inside a rolling lookback window.
 *
 * The Canadian Experience Class requires, at s. 87.1(2)(a) of the Immigration
 * and Refugee Protection Regulations, at least one year of full-time skilled
 * work experience in Canada — or the equivalent in part-time work — within the
 * three years before the application. Two features of that rule shape this
 * module.
 *
 * **The operative unit is hours, not days.** "Full-time work" is defined at
 * s. 73(1) of the Regulations as at least 30 hours of work per week, and IRCC's
 * published equivalence for one year of it is 1,560 hours (30 x 52). Part-time
 * work counts: fifteen hours a week for two years reaches the same 1,560. A
 * module that only counted calendar days would tell a part-time worker they
 * qualified when they had banked half the hours. So this returns both — days,
 * because the ledger is a calendar object and callers need to show the periods,
 * and capped hours, because that is the figure the requirement is measured in.
 *
 * **Hours above the full-time rate do not accumulate.** Sixty hours a week for
 * six months is not a year of experience. The cap is applied to the aggregate
 * across concurrent jobs, not per job, which is why overlapping periods have to
 * be resolved day by day rather than summed.
 *
 * Whether a period qualifies at all — authorised work, a skilled occupation,
 * not self-employment, not work during full-time study — is a legal
 * characterisation this module does not attempt. It is carried in
 * {@link WorkPeriod.qualifying}, decided upstream by whoever is accountable for
 * that judgement, and periods marked otherwise are excluded and reported by id.
 */

import type { Citation, CountryCode, DateRange, IsoDate } from '@meridian/core';
import {
  MeridianError,
  addDays,
  addYears,
  intersectRanges,
  mergeRanges,
  rangeContains,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';
import { CATALOG_VERIFIED_ON } from './catalog-meta.js';

export interface WorkPeriod {
  readonly id: string;
  readonly country: CountryCode;
  /** Closed at both ends: the first and last day worked are both days worked. */
  readonly range: DateRange;
  /** Contracted or actual hours per week over this period. */
  readonly hoursPerWeek: number;
  /**
   * Whether the occupation, authorisation and employment relationship make this
   * experience count. A legal characterisation, decided upstream.
   */
  readonly qualifying: boolean;
  readonly employer?: string;
  /** NOC TEER category, where the caller has classified the occupation. */
  readonly nocTeer?: number;
}

export interface WorkContribution {
  readonly periodId: string;
  /** The part of the period that fell inside the lookback window. */
  readonly countedRange: DateRange;
  readonly days: number;
  readonly hoursPerWeek: number;
}

export interface WorkAccumulation {
  readonly window: DateRange;
  /** Calendar days inside the window on which at least one qualifying period was running. */
  readonly qualifyingDays: number;
  /** Those days as merged ranges, so overlapping jobs collapse to one timeline. */
  readonly qualifyingRanges: readonly DateRange[];
  readonly weeklyHoursCap: number;
  /**
   * Hours inside the window, with the aggregate weekly rate capped. Rounded to
   * two decimals — the underlying figure is a rate times a number of days and
   * reporting sixteen decimal places of float noise would be false precision.
   */
  readonly cappedHours: number;
  /** Hours before the cap, for showing what was disallowed and why. */
  readonly uncappedHours: number;
  readonly contributions: readonly WorkContribution[];
  /** Periods that contributed nothing: not qualifying, zero hours, or outside the window. */
  readonly excludedPeriodIds: readonly string[];
}

/** Default aggregate weekly cap, matching the full-time definition at IRPR s. 73(1). */
export const DEFAULT_WEEKLY_HOURS_CAP = 30;

/** Upper bound on the lookback a single call will scan, ~30 years. */
export const MAX_LOOKBACK_SCAN_DAYS = 11_000;

export interface AccumulationOptions {
  /** Aggregate hours per week beyond which extra work stops accruing. */
  readonly weeklyHoursCap?: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Total qualifying work inside `lookback`.
 *
 * Overlapping periods are resolved per day: the day appears once in
 * `qualifyingDays`, and its hours are the aggregate weekly rate of every period
 * covering it, capped. Two concurrent 20-hour jobs are 30 hours a week, not 40.
 */
export function accumulateQualifyingWork(
  periods: readonly WorkPeriod[],
  lookback: DateRange,
  options: AccumulationOptions = {},
): WorkAccumulation {
  const cap = options.weeklyHoursCap ?? DEFAULT_WEEKLY_HOURS_CAP;
  if (!Number.isFinite(cap) || cap <= 0) {
    throw new MeridianError('INVALID_INPUT', `weeklyHoursCap must be positive, got ${cap}`, {
      weeklyHoursCap: cap,
    });
  }
  const span = rangeLengthDays(lookback);
  if (span > MAX_LOOKBACK_SCAN_DAYS) {
    throw new MeridianError(
      'INVALID_INPUT',
      `refusing to scan a ${span}-day lookback; the maximum is ${MAX_LOOKBACK_SCAN_DAYS}`,
      { start: lookback.start, end: lookback.end, days: span },
    );
  }

  const seen = new Set<string>();
  for (const p of periods) {
    if (seen.has(p.id)) {
      throw new MeridianError('INVALID_INPUT', `duplicate work period id ${JSON.stringify(p.id)}`, {
        periodId: p.id,
      });
    }
    seen.add(p.id);
    if (!Number.isFinite(p.hoursPerWeek) || p.hoursPerWeek < 0) {
      throw new MeridianError(
        'INVALID_INPUT',
        `work period ${JSON.stringify(p.id)} has hoursPerWeek ${p.hoursPerWeek}`,
        { periodId: p.id, hoursPerWeek: p.hoursPerWeek },
      );
    }
  }

  const contributions: WorkContribution[] = [];
  const excludedPeriodIds: string[] = [];
  const counted: { period: WorkPeriod; range: DateRange }[] = [];

  for (const p of periods) {
    const clipped = p.qualifying && p.hoursPerWeek > 0 ? intersectRanges(p.range, lookback) : null;
    if (clipped === null) {
      excludedPeriodIds.push(p.id);
      continue;
    }
    counted.push({ period: p, range: clipped });
    contributions.push({
      periodId: p.id,
      countedRange: clipped,
      days: rangeLengthDays(clipped),
      hoursPerWeek: p.hoursPerWeek,
    });
  }

  const qualifyingRanges = mergeRanges(counted.map((c) => c.range));
  const qualifyingDays = totalDays(qualifyingRanges);

  // Sum the daily aggregate weekly rate over every worked day, then divide by
  // seven once at the end. Capping the weekly rate per day is equivalent to a
  // 30-hour weekly cap for a steady schedule; an irregular schedule has to be
  // evidenced by the employer's statement of hours in any event, and this
  // module has no basis for reconstructing it.
  let cappedRateDays = 0;
  let uncappedRateDays = 0;
  for (const range of qualifyingRanges) {
    const len = rangeLengthDays(range);
    for (let i = 0; i < len; i++) {
      const day = addDays(range.start, i);
      let rate = 0;
      for (const c of counted) {
        if (rangeContains(c.range, day)) rate += c.period.hoursPerWeek;
      }
      uncappedRateDays += rate;
      cappedRateDays += Math.min(rate, cap);
    }
  }

  return {
    window: lookback,
    qualifyingDays,
    qualifyingRanges,
    weeklyHoursCap: cap,
    cappedHours: round2(cappedRateDays / 7),
    uncappedHours: round2(uncappedRateDays / 7),
    contributions,
    excludedPeriodIds: excludedPeriodIds.sort(),
  };
}

/** Years of lookback for the Canadian Experience Class. */
export const CEC_LOOKBACK_YEARS = 3;

/** Aggregate weekly hours cap: the full-time definition at IRPR s. 73(1). */
export const CEC_WEEKLY_HOURS_CAP = 30;

/** IRCC's published equivalence for one year of full-time skilled work. */
export const CEC_REQUIRED_HOURS = 1560;

export const CEC_REGULATION_CITATION: Citation = {
  id: 'ca-irpr-s-87-1',
  kind: 'regulation',
  instrument: 'Immigration and Refugee Protection Regulations (SOR/2002-227)',
  provision: 's. 87.1(2)(a); "full-time work" defined at s. 73(1)',
  url: 'https://laws-lois.justice.gc.ca/eng/regulations/sor-2002-227/',
  jurisdiction: 'CA',
  verifiedOn: CATALOG_VERIFIED_ON,
  note:
    'The Canadian Experience Class requires at least one year of full-time skilled work experience in Canada, ' +
    'or the equivalent in part-time work, acquired in the three years before the application. Full-time work ' +
    'is defined as at least 30 hours per week. Whether particular experience qualifies also turns on the ' +
    'occupation, on the work being authorised, and on exclusions (self-employment, and work performed while a ' +
    'full-time student) that this module does not evaluate.',
};

export const CEC_HOURS_EQUIVALENCE_CITATION: Citation = {
  id: 'ca-cec-1560-hours',
  kind: 'official_guidance',
  instrument: 'Immigration, Refugees and Citizenship Canada — Canadian Experience Class work experience',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/canadian-experience-class.html',
  jurisdiction: 'CA',
  verifiedOn: CATALOG_VERIFIED_ON,
  discretionary: true,
  note:
    'The 1,560-hour figure is the operational equivalence IRCC publishes for one year of full-time work ' +
    '(30 hours per week over 52 weeks), not a number stated in the Regulations, which express the requirement ' +
    'as one year of full-time experience or the part-time equivalent. Hours worked above 30 per week do not ' +
    'accrue. Counsel should confirm the current published calculation before an application is filed on it.',
};

export const CEC_CITATIONS: readonly Citation[] = [
  CEC_REGULATION_CITATION,
  CEC_HOURS_EQUIVALENCE_CITATION,
];

export interface CecOptions {
  /**
   * Whether the application date itself is inside the three-year window.
   *
   * s. 87.1(2)(a) frames the period as the three years *before* the date the
   * application is made, which reads as excluding that date; IRCC's own intake
   * treats experience up to submission as countable. The difference is one day
   * and it is surfaced rather than buried, because a single boundary day at the
   * 1,560-hour line decides applications. Defaults to including it.
   */
  readonly includeApplicationDate?: boolean;
}

export interface CecWorkAssessment {
  readonly applicationDate: IsoDate;
  readonly window: DateRange;
  readonly accumulation: WorkAccumulation;
  readonly requiredHours: number;
  /** Hours still needed. Zero once the requirement is reached. */
  readonly hoursShort: number;
  /** Whether the hours limb is satisfied. The other eligibility limbs are not tested here. */
  readonly meetsHoursRequirement: boolean;
  /** Periods dropped because the work was not in Canada. */
  readonly nonCanadianPeriodIds: readonly string[];
}

/**
 * Measure work periods against the Canadian Experience Class hours limb.
 *
 * Experience outside Canada is excluded before counting and reported
 * separately — it may well support a different program, and silently dropping
 * it would leave the applicant unable to see why their total looks short.
 */
export function evaluateCanadianExperienceClass(
  periods: readonly WorkPeriod[],
  applicationDate: IsoDate,
  options: CecOptions = {},
): CecWorkAssessment {
  const includeApplicationDate = options.includeApplicationDate ?? true;
  const end = includeApplicationDate ? applicationDate : addDays(applicationDate, -1);
  const window: DateRange = {
    start: addDays(addYears(end, -CEC_LOOKBACK_YEARS), 1),
    end,
  };

  const canadian: WorkPeriod[] = [];
  const nonCanadianPeriodIds: string[] = [];
  for (const p of periods) {
    if (p.country === 'CA') canadian.push(p);
    else nonCanadianPeriodIds.push(p.id);
  }

  const accumulation = accumulateQualifyingWork(canadian, window, {
    weeklyHoursCap: CEC_WEEKLY_HOURS_CAP,
  });

  return {
    applicationDate,
    window,
    accumulation,
    requiredHours: CEC_REQUIRED_HOURS,
    hoursShort: round2(Math.max(0, CEC_REQUIRED_HOURS - accumulation.cappedHours)),
    meetsHoursRequirement: accumulation.cappedHours >= CEC_REQUIRED_HOURS,
    nonCanadianPeriodIds: nonCanadianPeriodIds.sort(),
  };
}
