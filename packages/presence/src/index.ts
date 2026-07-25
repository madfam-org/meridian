/**
 * `@meridian/presence` — the jurisdictional day-counting engine.
 *
 * This package tells a person whether they are about to lose their status, so
 * two properties are load-bearing and everything else is detail.
 *
 * **Every number shows its work.** Each assessment returns not just a total but
 * the de-duplicated ranges that produced it, the window it was measured over,
 * and the per-record attribution. A figure a person cannot reconstruct is a
 * figure they cannot defend to an officer, and a figure nobody can audit is one
 * nobody can correct.
 *
 * **Nothing here is advice.** The public entry points are all classified
 * `assessment`: the user's own recorded facts, measured against a cited rule,
 * with the arithmetic exposed. This package counts days. It never ranks
 * options, never says which route to take, and never predicts an outcome —
 * those are the regulated acts described in `@meridian/core`'s disclosure
 * module, and a day counter has no business performing them.
 *
 * The distinction is not cosmetic. "You have 87 of your 90 days" is an
 * assessment. "You should leave before the 3rd" is advice, and it belongs to
 * someone licensed to give it. The wrappers below exist so that boundary is
 * enforced by the type of every value crossing the package boundary rather
 * than by anyone remembering.
 */

import type { Citation, CountryCode, DateRange, Disclosable, IsoDate } from '@meridian/core';
import { MeridianError, disclosable } from '@meridian/core';

import type { PresenceLedger } from './ledger.js';
import type { ContinuityAssessment, ContinuityPolicy } from './continuity.js';
import type { NextEntryOptions, SchengenStatus, SchengenWorstDay } from './schengen.js';
import type { DayCountEvaluation, DayCountThreshold, EvaluationOptions } from './tax-residency.js';
import type {
  AccumulationOptions,
  CecOptions,
  CecWorkAssessment,
  WorkAccumulation,
  WorkPeriod,
} from './work-experience.js';

import { CONTINUITY_POLICIES, continuousResidence } from './continuity.js';
import {
  SCHENGEN_SHORT_STAY_CITATION,
  schengenDaysUntilEligible,
  schengenNextEntryDate,
  schengenStatusOn,
  schengenWorstDay,
} from './schengen.js';
import { TAX_DAY_COUNT_THRESHOLDS, evaluateDayCountThreshold } from './tax-residency.js';
import {
  CEC_CITATIONS,
  accumulateQualifyingWork,
  evaluateCanadianExperienceClass,
} from './work-experience.js';

// ---------------------------------------------------------------------------
// The ledger, its queries, and its inconsistency report.
//
// `detectInconsistencies` is exported raw rather than wrapped in a
// `Disclosable`, and the exception is deliberate. It applies no legal rule and
// cites none: it reports contradictions in the person's own record — two
// countries on one Tuesday, days nobody accounts for, a departure date the
// engine imputed — which is a data-quality finding, not a measurement against
// law. Wrapping it as an assessment would mean handing it an empty citation
// list, and `@meridian/core` is explicit that an assessment with no citation is
// a defect. Everything the ledger exposes here is likewise query surface, not
// conclusion.
// ---------------------------------------------------------------------------

export type {
  InconsistencyKind,
  InconsistencyOptions,
  LedgerInconsistency,
  LedgerOptions,
  PresenceConfidence,
  PresenceLedger,
  PresenceSource,
  Stay,
  StayInput,
} from './ledger.js';
export {
  MAX_LEDGER_SCAN_DAYS,
  assertNoLocationConflicts,
  buildLedger,
  countriesOn,
  countryPresenceRanges,
  daysPresentIn,
  detectInconsistencies,
  ledgerSpan,
  presenceLedger,
  presenceRangesWhere,
  staysOn,
  staysOverlapping,
} from './ledger.js';

// ---------------------------------------------------------------------------
// Rule catalog: constants, citations, policies. Data, not conclusions.
// ---------------------------------------------------------------------------

export { CATALOG_VERIFIED_ON } from './catalog-meta.js';

export type { SchengenContribution, SchengenStatus, SchengenWorstDay, NextEntryOptions } from './schengen.js';
export {
  SCHENGEN_DEFAULT_HORIZON_DAYS,
  SCHENGEN_MAX_DAYS,
  SCHENGEN_MAX_SCAN_DAYS,
  SCHENGEN_SHORT_STAY_CITATION,
  SCHENGEN_WINDOW_DAYS,
  countsAsSchengenShortStay,
} from './schengen.js';

export type {
  DayCountEvaluation,
  DayCountThreshold,
  EvaluationOptions,
  ThresholdBasis,
  ThresholdComparison,
} from './tax-residency.js';
export {
  CANADA_SOJOURNER_DAY_COUNT,
  DEFAULT_PROJECTION_HORIZON_DAYS,
  SPAIN_IRPF_DAY_COUNT,
  TAX_DAY_COUNT_THRESHOLDS,
  dayCountThreshold,
  daysPresentInCalendarYear,
  requiredDays,
  windowForThreshold,
} from './tax-residency.js';

export type {
  ContinuityAssessment,
  ContinuityBreach,
  ContinuityLimb,
  ContinuityPolicy,
  ResidenceYear,
} from './continuity.js';
export {
  CONTINUITY_POLICIES,
  SPAIN_NATIONALITY_CONTINUITY,
  continuityPolicy,
  firstAbsenceDay,
  longestAbsence,
  residenceYears,
} from './continuity.js';

export type {
  AccumulationOptions,
  CecOptions,
  CecWorkAssessment,
  WorkAccumulation,
  WorkContribution,
  WorkPeriod,
} from './work-experience.js';
export {
  CEC_CITATIONS,
  CEC_HOURS_EQUIVALENCE_CITATION,
  CEC_LOOKBACK_YEARS,
  CEC_REGULATION_CITATION,
  CEC_REQUIRED_HOURS,
  CEC_WEEKLY_HOURS_CAP,
  DEFAULT_WEEKLY_HOURS_CAP,
  MAX_LOOKBACK_SCAN_DAYS,
} from './work-experience.js';

/** Every citation this package can rely on, so consumers can resolve an id back to its source. */
export const PRESENCE_CITATIONS: readonly Citation[] = [
  SCHENGEN_SHORT_STAY_CITATION,
  ...TAX_DAY_COUNT_THRESHOLDS.map((t) => t.citation),
  ...CONTINUITY_POLICIES.map((p) => p.citation),
  ...CEC_CITATIONS,
];

/** Resolve a citation id. `null` rather than a throw: a missing id is a caller question, not a fault. */
export function findPresenceCitation(id: string): Citation | null {
  return PRESENCE_CITATIONS.find((c) => c.id === id) ?? null;
}

function requireCitations(ids: readonly string[], context: string): readonly string[] {
  if (ids.length === 0) {
    throw new MeridianError(
      'INVALID_INPUT',
      `${context} must carry at least one citation id; an assessment with no cited rule is not releasable`,
      { context },
    );
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Public entry points. Each returns an `assessment`, never advice.
// ---------------------------------------------------------------------------

/**
 * Schengen short-stay position on one day.
 *
 * An assessment, not advice: it reports how many of the 90 days the record has
 * consumed inside the 180-day window ending on `referenceDate`, and which stays
 * consumed them. It does not tell anyone when to fly.
 */
export function assessSchengenStatus(
  ledger: PresenceLedger,
  referenceDate: IsoDate,
): Disclosable<SchengenStatus> {
  return disclosable('assessment', schengenStatusOn(ledger, referenceDate), [
    SCHENGEN_SHORT_STAY_CITATION.id,
  ]);
}

/**
 * The day inside `range` with the highest usage — the day that decides whether
 * a planned itinerary is lawful, since the window slides under the traveller.
 */
export function assessSchengenWorstDay(
  ledger: PresenceLedger,
  range: DateRange,
): Disclosable<SchengenWorstDay> {
  return disclosable('assessment', schengenWorstDay(ledger, range), [
    SCHENGEN_SHORT_STAY_CITATION.id,
  ]);
}

/**
 * The earliest date on or after `notBefore` on which a stay of
 * `desiredStayDays` would be lawful for every one of its days, or `null` inside
 * the horizon.
 *
 * This sits right at the boundary and stays on the safe side of it. Reporting
 * the first date the arithmetic permits a stay is a measurement of the rule
 * against the record. Saying that the person should travel then, or that this
 * date is better than another, would be a recommendation, and this package does
 * not make them.
 */
export function assessSchengenNextEntry(
  ledger: PresenceLedger,
  desiredStayDays: number,
  notBefore: IsoDate,
  options: NextEntryOptions = {},
): Disclosable<IsoDate | null> {
  return disclosable(
    'assessment',
    schengenNextEntryDate(ledger, desiredStayDays, notBefore, options),
    [SCHENGEN_SHORT_STAY_CITATION.id],
  );
}

/**
 * The same answer as {@link assessSchengenNextEntry}, expressed as a wait in
 * days rather than a date. Zero means the stay is lawful starting today;
 * `null` means it is not lawful anywhere inside the search horizon.
 */
export function assessSchengenDaysUntilEligible(
  ledger: PresenceLedger,
  wantedDays: number,
  referenceDate: IsoDate,
  options: NextEntryOptions = {},
): Disclosable<number | null> {
  return disclosable(
    'assessment',
    schengenDaysUntilEligible(ledger, wantedDays, referenceDate, options),
    [SCHENGEN_SHORT_STAY_CITATION.id],
  );
}

/**
 * Days against a tax-residence day-count threshold.
 *
 * The result answers "how many days", never "are you tax resident" — see the
 * tax-residency module note for why the two are not the same question and why
 * conflating them would be negligent rather than merely wrong.
 */
export function assessDayCountThreshold(
  ledger: PresenceLedger,
  threshold: DayCountThreshold,
  referenceDate: IsoDate,
  options: EvaluationOptions = {},
): Disclosable<DayCountEvaluation> {
  return disclosable(
    'assessment',
    evaluateDayCountThreshold(ledger, threshold, referenceDate, options),
    requireCitations([threshold.citation.id], `threshold ${threshold.id}`),
  );
}

/**
 * Absences measured against a continuity policy.
 *
 * Where the policy's citation is marked `discretionary` — as Spain's is,
 * because the Civil Code sets no numeric absence limit — consumers must show
 * the citation's note alongside the figures. A breach reported here means the
 * absences would attract scrutiny under the criterion normally applied, not
 * that an application fails.
 */
export function assessContinuousResidence(
  ledger: PresenceLedger,
  country: CountryCode,
  window: DateRange,
  policy: ContinuityPolicy,
): Disclosable<ContinuityAssessment> {
  return disclosable(
    'assessment',
    continuousResidence(ledger, country, window, policy),
    requireCitations([policy.citation.id], `policy ${policy.id}`),
  );
}

/**
 * Qualifying work accumulated inside a caller-supplied lookback window.
 *
 * `citationIds` is required and must be non-empty, because the lookback window
 * *is* the rule: three years, five years, or since a particular grant date is a
 * legal choice, and an accumulation with no cited basis for its window is a
 * number with no provenance.
 */
export function assessQualifyingWork(
  periods: readonly WorkPeriod[],
  lookback: DateRange,
  citationIds: readonly string[],
  options: AccumulationOptions = {},
): Disclosable<WorkAccumulation> {
  return disclosable(
    'assessment',
    accumulateQualifyingWork(periods, lookback, options),
    requireCitations(citationIds, 'assessQualifyingWork'),
  );
}

/**
 * The Canadian Experience Class hours limb.
 *
 * Only that limb. Language results, admissibility, status in Canada and the
 * occupation classification are all separate requirements this does not test,
 * and a satisfied result is not an eligibility determination.
 */
export function assessCanadianExperienceClass(
  periods: readonly WorkPeriod[],
  applicationDate: IsoDate,
  options: CecOptions = {},
): Disclosable<CecWorkAssessment> {
  return disclosable(
    'assessment',
    evaluateCanadianExperienceClass(periods, applicationDate, options),
    CEC_CITATIONS.map((c) => c.id),
  );
}
