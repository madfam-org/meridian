/**
 * Running the day counters.
 *
 * Every figure the presence page shows comes from here, and every one of these
 * calls returns a `Disclosable` classified `assessment` — the applicant's own
 * recorded facts measured against a cited rule, with the ranges that produced
 * the total attached. None of it ranks anything, recommends anything, or
 * predicts an outcome; a day counter has no business doing those.
 *
 * The ledger is built first and its inconsistency report is produced alongside
 * the counts rather than instead of them. A contradiction in the record does
 * not suppress the arithmetic — silence would be worse — but the reader is told
 * exactly which days the total rests on.
 */

import type { Disclosable, IsoDate } from '@meridian/core';
import type {
  ContinuityAssessment,
  DayCountEvaluation,
  DayCountThreshold,
  LedgerInconsistency,
  PresenceLedger,
  SchengenStatus,
} from '@meridian/presence';
import {
  assessContinuousResidence,
  assessDayCountThreshold,
  assessSchengenStatus,
  buildLedger,
  detectInconsistencies,
  ledgerSpan,
} from '@meridian/presence';

import type { PresenceScope } from '@/lib/sample/presence';

export interface ThresholdReport {
  readonly threshold: DayCountThreshold;
  readonly assessment: Disclosable<DayCountEvaluation>;
}

export interface PresenceReport {
  readonly ledger: PresenceLedger;
  readonly span: ReturnType<typeof ledgerSpan>;
  readonly inconsistencies: readonly LedgerInconsistency[];
  /** `null` when the Schengen allowance does not bear on this matter at all. */
  readonly schengen: Disclosable<SchengenStatus> | null;
  readonly thresholds: readonly ThresholdReport[];
  readonly continuity: Disclosable<ContinuityAssessment> | null;
}

export function buildPresenceReport(scope: PresenceScope, asOf: IsoDate): PresenceReport {
  // An open-ended stay has no correct end date, so the caller supplies one
  // explicitly instead of the engine reaching for a clock. The resulting stay
  // is marked, and `detectInconsistencies` reports the imputation.
  const ledger = buildLedger(scope.stays, { openStaysEndOn: asOf });

  return {
    ledger,
    span: ledgerSpan(ledger),
    inconsistencies: detectInconsistencies(ledger, {
      asOf,
      expectedCoverage: scope.expectedCoverage,
    }),
    schengen: scope.schengen ? assessSchengenStatus(ledger, asOf) : null,
    thresholds: scope.thresholds.map((threshold) => ({
      threshold,
      assessment: assessDayCountThreshold(ledger, threshold, asOf),
    })),
    continuity:
      scope.continuity === null
        ? null
        : assessContinuousResidence(
            ledger,
            scope.continuity.policy.country,
            scope.continuity.window,
            scope.continuity.policy,
          ),
  };
}
