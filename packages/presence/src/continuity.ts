/**
 * Continuous residence: whether time away from a country broke the run.
 *
 * The shape of the problem is the inverse of the day count. Presence is what
 * the ledger records; *absence* is what a continuity rule measures, and absence
 * is the complement of presence over the residence period. So this module
 * derives absences with `complementRanges` rather than storing them, which
 * means a gap in the record — days where the ledger says nothing at all —
 * appears as an absence. That is the safe direction to be wrong in: it
 * overstates time away and prompts the person to produce evidence, rather than
 * assuming they were home and letting them file on a number they cannot prove.
 * Run `detectInconsistencies` alongside this to tell a real departure from a
 * hole in the record.
 *
 * The limits themselves are policy, not arithmetic, and they vary enormously.
 * A policy carries its own {@link import('@meridian/core').Citation}, and where
 * the numbers come from administrative practice rather than a statute the
 * citation says so and the note says counsel must verify. See
 * {@link SPAIN_NATIONALITY_CONTINUITY} for why that matters more here than
 * almost anywhere else in Meridian.
 */

import type { Citation, CountryCode, DateRange, IsoDate } from '@meridian/core';
import {
  MeridianError,
  addDays,
  addYears,
  compareDates,
  complementRanges,
  minDate,
  overlapDays,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';
import { CATALOG_VERIFIED_ON } from './catalog-meta.js';
import type { PresenceLedger } from './ledger.js';
import { countryPresenceRanges } from './ledger.js';

/** Which limb of a continuity policy an absence breached. */
export type ContinuityLimb =
  /** One unbroken absence exceeded the permitted length. */
  | 'single_absence'
  /** Absences within one residence year totalled more than the annual allowance. */
  | 'cumulative_per_year'
  /** Absences over the whole period totalled more than the overall allowance. */
  | 'cumulative_total';

export interface ContinuityPolicy {
  readonly id: string;
  readonly label: string;
  readonly country: CountryCode;
  /** Longest permitted single absence. Undefined means the policy does not cap one. */
  readonly maxSingleAbsenceDays?: number;
  /** Permitted absence days within any one residence year. */
  readonly maxCumulativeAbsenceDaysPerYear?: number;
  /** Permitted absence days across the whole assessed period. */
  readonly maxCumulativeAbsenceDaysTotal?: number;
  readonly citation: Citation;
}

export interface ContinuityBreach {
  readonly limb: ContinuityLimb;
  /**
   * For `single_absence`, the absence itself. For `cumulative_per_year`, the
   * residence year whose total was exceeded. For `cumulative_total`, the whole
   * assessed period. Always the exact days, never a summary.
   */
  readonly range: DateRange;
  readonly days: number;
  readonly limitDays: number;
  /** Absences contributing to this breach, for a per-year or total limb. */
  readonly contributingAbsences: readonly DateRange[];
  readonly detail: string;
}

export interface ResidenceYear {
  readonly index: number;
  readonly range: DateRange;
  readonly absenceDays: number;
}

export interface ContinuityAssessment {
  readonly policy: ContinuityPolicy;
  /** The period assessed. */
  readonly window: DateRange;
  /** In-country presence inside the window, merged. */
  readonly presenceRanges: readonly DateRange[];
  /** Everything else inside the window. */
  readonly absences: readonly DateRange[];
  readonly presenceDays: number;
  readonly totalAbsenceDays: number;
  readonly longestAbsenceDays: number;
  readonly residenceYears: readonly ResidenceYear[];
  readonly breaches: readonly ContinuityBreach[];
  /** True when no limb of the policy was breached. Not a prediction of the outcome. */
  readonly satisfied: boolean;
}

/**
 * Successive twelve-month periods measured from the start of the assessed
 * window, with a partial period at the end if the window does not divide evenly.
 *
 * Residence years run from the date residence began, not from January. Slicing
 * on the calendar year would let a four-month absence straddling New Year pass
 * two annual caps that a single residence year would have caught, and would
 * fail an applicant whose permit happened to start in October. The trailing
 * partial period is still assessed: a breach inside it is a breach.
 */
export function residenceYears(window: DateRange): DateRange[] {
  const out: DateRange[] = [];
  let start = window.start;
  while (compareDates(start, window.end) <= 0) {
    const end = minDate(addDays(addYears(start, 1), -1), window.end);
    out.push({ start, end });
    start = addDays(end, 1);
  }
  return out;
}

/**
 * Measure a ledger against a continuity policy.
 *
 * Every limb that is `undefined` on the policy is simply not tested — a policy
 * with no annual cap is not a policy with an infinite one, and inventing a
 * default here would fabricate law.
 */
export function continuousResidence(
  ledger: PresenceLedger,
  country: CountryCode,
  window: DateRange,
  policy: ContinuityPolicy,
): ContinuityAssessment {
  if (policy.country !== country) {
    throw new MeridianError(
      'INVALID_INPUT',
      `policy ${policy.id} applies to ${policy.country}, not ${country}`,
      { policyId: policy.id, policyCountry: policy.country, country },
    );
  }

  const presenceRanges = countryPresenceRanges(ledger, country, window);
  const absences = complementRanges(presenceRanges, window);
  const presenceDays = totalDays(presenceRanges);
  const totalAbsenceDays = totalDays(absences);
  const longestAbsenceDays = absences.reduce((max, a) => Math.max(max, rangeLengthDays(a)), 0);

  const years = residenceYears(window).map((range, index): ResidenceYear => {
    let days = 0;
    for (const a of absences) days += overlapDays(a, range);
    return { index, range, absenceDays: days };
  });

  const breaches: ContinuityBreach[] = [];

  const singleLimit = policy.maxSingleAbsenceDays;
  if (singleLimit !== undefined) {
    for (const a of absences) {
      const days = rangeLengthDays(a);
      if (days <= singleLimit) continue;
      breaches.push({
        limb: 'single_absence',
        range: a,
        days,
        limitDays: singleLimit,
        contributingAbsences: [a],
        detail:
          `A single absence of ${days} days (${a.start} to ${a.end}) exceeds the ${singleLimit}-day limit ` +
          `applied under ${policy.label}.`,
      });
    }
  }

  const yearLimit = policy.maxCumulativeAbsenceDaysPerYear;
  if (yearLimit !== undefined) {
    for (const year of years) {
      if (year.absenceDays <= yearLimit) continue;
      breaches.push({
        limb: 'cumulative_per_year',
        range: year.range,
        days: year.absenceDays,
        limitDays: yearLimit,
        contributingAbsences: absences.filter((a) => overlapDays(a, year.range) > 0),
        detail:
          `Absences totalling ${year.absenceDays} days fall in the residence year ${year.range.start} to ` +
          `${year.range.end}, exceeding the ${yearLimit}-day annual limit applied under ${policy.label}.`,
      });
    }
  }

  const totalLimit = policy.maxCumulativeAbsenceDaysTotal;
  if (totalLimit !== undefined && totalAbsenceDays > totalLimit) {
    breaches.push({
      limb: 'cumulative_total',
      range: window,
      days: totalAbsenceDays,
      limitDays: totalLimit,
      contributingAbsences: absences,
      detail:
        `Absences totalling ${totalAbsenceDays} days across ${window.start} to ${window.end} exceed the ` +
        `${totalLimit}-day limit applied under ${policy.label}.`,
    });
  }

  return {
    policy,
    window,
    presenceRanges,
    absences,
    presenceDays,
    totalAbsenceDays,
    longestAbsenceDays,
    residenceYears: years,
    breaches,
    satisfied: breaches.length === 0,
  };
}

/**
 * Spain — continuity of residence for nationality by residence.
 *
 * **Read the note before using this number.** Art. 22.3 of the Código Civil
 * requires the residence preceding the application to be "legal, continuada e
 * inmediatamente anterior a la petición". It fixes no figure. There is no
 * statutory absence limit for nationality by residence, and anyone who tells an
 * applicant otherwise is quoting practice as if it were law.
 *
 * The 180-day single-absence figure encoded here is the screening criterion
 * applied in administrative practice and reflected in the case law on
 * *residencia continuada*. It is a trigger for scrutiny, not a safe harbour:
 * the Dirección General de Seguridad Jurídica y Fe Pública assesses continuity
 * on the whole file, and shorter absences have broken it where they showed the
 * centre of the applicant's life had moved. That is why the citation is marked
 * `discretionary` and why no cumulative limbs are encoded at all — figures
 * circulate for those, none of them is settled enough to assert to someone who
 * would restart a ten-year clock if it were wrong.
 *
 * An assessment against this policy says "your absences would attract scrutiny
 * under the criterion normally applied". It does not say the application fails.
 */
export const SPAIN_NATIONALITY_CONTINUITY: ContinuityPolicy = {
  id: 'es-nationality-continuity',
  label: 'Spain — continuity of residence for nationality by residence (screening criterion)',
  country: 'ES' as CountryCode,
  maxSingleAbsenceDays: 180,
  citation: {
    id: 'es-cc-art-22-3-continuity',
    kind: 'statute',
    instrument: 'Código Civil (España), Artículo 22',
    provision: 'art. 22.3',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
    jurisdiction: 'ES',
    verifiedOn: CATALOG_VERIFIED_ON,
    discretionary: true,
    note:
      'Art. 22.3 requires residence that is legal, continuous and immediately prior to the application, but ' +
      'sets no numeric absence limit. The 180-day single-absence figure in this policy is the screening ' +
      'criterion applied in administrative practice and case law on "residencia continuada", not a statutory ' +
      'threshold, and it is not a safe harbour: continuity is assessed on the whole file and shorter absences ' +
      'have broken it. No cumulative limit is encoded because none is settled. Counsel must verify the ' +
      'criteria applied to the specific expediente before anyone relies on this.',
  },
};

/** Every continuity policy in this catalog. */
export const CONTINUITY_POLICIES: readonly ContinuityPolicy[] = [SPAIN_NATIONALITY_CONTINUITY];

/** Validate a caller-supplied policy. Limits must be non-negative integers where present. */
export function continuityPolicy(spec: ContinuityPolicy): ContinuityPolicy {
  const limbs: readonly [string, number | undefined][] = [
    ['maxSingleAbsenceDays', spec.maxSingleAbsenceDays],
    ['maxCumulativeAbsenceDaysPerYear', spec.maxCumulativeAbsenceDaysPerYear],
    ['maxCumulativeAbsenceDaysTotal', spec.maxCumulativeAbsenceDaysTotal],
  ];
  for (const [name, value] of limbs) {
    if (value === undefined) continue;
    if (!Number.isInteger(value) || value < 0) {
      throw new MeridianError(
        'INVALID_INPUT',
        `${name} must be a non-negative integer, got ${value}`,
        { policyId: spec.id, limb: name, value },
      );
    }
  }
  if (spec.citation.id.trim().length === 0) {
    throw new MeridianError('INVALID_INPUT', `policy ${spec.id} has no citation id`, {
      policyId: spec.id,
    });
  }
  return spec;
}

/**
 * Longest single absence in the window, for callers that want the headline
 * figure without running a full policy assessment.
 */
export function longestAbsence(
  ledger: PresenceLedger,
  country: CountryCode,
  window: DateRange,
): DateRange | null {
  const absences = complementRanges(countryPresenceRanges(ledger, country, window), window);
  let best: DateRange | null = null;
  let bestDays = 0;
  for (const a of absences) {
    const days = rangeLengthDays(a);
    if (days > bestDays) {
      best = a;
      bestDays = days;
    }
  }
  return best;
}

/** The first day of the window on which the person was outside `country`, if any. */
export function firstAbsenceDay(
  ledger: PresenceLedger,
  country: CountryCode,
  window: DateRange,
): IsoDate | null {
  const absences = complementRanges(countryPresenceRanges(ledger, country, window), window);
  return absences[0]?.start ?? null;
}
