/**
 * Representative standing, and what it is silently doing to the caseload.
 *
 * A lapsed credential is not a roster hygiene problem. `canRelease` refuses
 * advice through an expired standing and downgrades the output to `assessment`,
 * which means every recommendation that representative was gating stops being a
 * recommendation — quietly, correctly, and without anybody being told unless a
 * screen like this one says so. The same is true of a representative authorised
 * in the wrong jurisdiction, which is easier to create than it sounds: assigning
 * a Canadian consultant to a Spanish file takes one click and produces no error.
 *
 * So this module does not re-implement the expiry test. It calls `canRelease`
 * once per gated matter, for the audience that actually matters — the applicant,
 * who is the protected party — and reports the gate's own decision and the
 * gate's own words. If core's rules change, this page changes with them.
 *
 * Two bands here are Meridian's operational choice rather than anybody's law,
 * and both are stated as such on screen:
 *
 *  - `CREDENTIAL_EXPIRY_WARNING_DAYS` — how long before an expiry the roster
 *    starts asking for a renewal. Sixty days is the firm's own lead time.
 *  - The re-verification bands mirror `staleness()` in `@meridian/core` (90 and
 *    180 days) on purpose. The codebase already has exactly one convention for
 *    "how long may a human-checked fact go unchecked", and inventing a second
 *    one for licences would mean two numbers nobody can keep straight.
 */

import {
  canRelease,
  diffDays,
  isTerminal,
  tryIsoDate,
  type IsoDate,
  type MatterStatus,
  type ReleaseDecision,
} from '@meridian/core';
import type { FirmRecords, MatterRecord, RepresentativeRecord } from '@/lib/records';

/** Days before expiry at which the roster asks for a renewal. Firm policy, not law. */
export const CREDENTIAL_EXPIRY_WARNING_DAYS = 60;

/** Mirrors core's citation freshness bands. See the module note. */
export const VERIFICATION_DUE_DAYS = 90;
export const VERIFICATION_OVERDUE_DAYS = 180;

export type LicenceStanding =
  /** Unexpired, and not close enough to expiry to act on. */
  | 'live'
  /** Unexpired but inside the renewal lead time. */
  | 'expiring'
  /** Expired. `canRelease` will refuse through it. */
  | 'lapsed'
  /** The register publishes no expiry. Distinct from "expires far away". */
  | 'no_expiry_recorded'
  /** An expiry is recorded that is not a civil date. A data defect, reported not guessed. */
  | 'unreadable_expiry';

export type VerificationStanding = 'current' | 'due' | 'overdue' | 'unreadable';

export interface LicenceState {
  readonly standing: LicenceStanding;
  readonly expiresOn: string | null;
  /** `diffDays(asOf, expiresOn)`. Negative once past. `null` when there is no readable expiry. */
  readonly daysRemaining: number | null;
}

export interface VerificationState {
  readonly standing: VerificationStanding;
  readonly verifiedOn: string;
  /** Days since the licence was last checked against the public register. */
  readonly ageDays: number | null;
}

/** One matter a representative is accountable for, with the gate's verdict on it. */
export interface GatedMatter {
  readonly matterId: string;
  readonly reference: string;
  readonly title: string;
  readonly jurisdiction: string;
  readonly status: MatterStatus;
  readonly terminal: boolean;
  /**
   * `canRelease('advice', …)` for the **applicant** audience.
   *
   * Not the practitioner audience: advice to a practitioner is released
   * regardless of standing, so testing that would report every credential as
   * fine and tell the reader nothing. What the roster needs to show is what the
   * client would receive.
   */
  readonly toApplicant: ReleaseDecision;
}

export interface RepresentativeStanding {
  readonly record: RepresentativeRecord;
  readonly licence: LicenceState;
  readonly verification: VerificationState;
  readonly gating: readonly GatedMatter[];
  /** Matters still running. Terminal files do not need a live credential behind them. */
  readonly liveGating: readonly GatedMatter[];
  /** Live matters where advice to the applicant is currently refused. */
  readonly downgrading: readonly GatedMatter[];
  /** True when this row needs somebody to do something. Drives sort order and the alert band. */
  readonly needsAttention: boolean;
}

function licenceState(expiresOn: string | undefined, asOf: IsoDate): LicenceState {
  if (expiresOn === undefined) {
    return { standing: 'no_expiry_recorded', expiresOn: null, daysRemaining: null };
  }
  const parsed = tryIsoDate(expiresOn);
  if (parsed === null) {
    return { standing: 'unreadable_expiry', expiresOn, daysRemaining: null };
  }
  const daysRemaining = diffDays(asOf, parsed);
  const standing: LicenceStanding =
    daysRemaining < 0 ? 'lapsed' : daysRemaining <= CREDENTIAL_EXPIRY_WARNING_DAYS ? 'expiring' : 'live';
  return { standing, expiresOn, daysRemaining };
}

function verificationState(verifiedOn: string, asOf: IsoDate): VerificationState {
  const parsed = tryIsoDate(verifiedOn);
  if (parsed === null) return { standing: 'unreadable', verifiedOn, ageDays: null };
  const ageDays = diffDays(parsed, asOf);
  const standing: VerificationStanding =
    ageDays <= VERIFICATION_DUE_DAYS
      ? 'current'
      : ageDays <= VERIFICATION_OVERDUE_DAYS
        ? 'due'
        : 'overdue';
  return { standing, verifiedOn, ageDays };
}

function gatedMatter(
  record: RepresentativeRecord,
  matterRecord: MatterRecord,
  asOf: IsoDate,
): GatedMatter {
  const { matter } = matterRecord;
  return {
    matterId: matter.id,
    reference: matterRecord.reference,
    title: matterRecord.title,
    jurisdiction: matter.targetJurisdiction,
    status: matter.status,
    terminal: isTerminal(matter.status),
    toApplicant: canRelease('advice', {
      audience: 'applicant',
      jurisdiction: matter.targetJurisdiction,
      representative: record.credential,
      forConsideration: true,
      asOf,
    }),
  };
}

/**
 * Sort key. Rows that need a human come first, worst first, and the order is
 * total so the page does not reshuffle between renders.
 */
function attentionRank(s: RepresentativeStanding): number {
  if (s.licence.standing === 'lapsed' && s.liveGating.length > 0) return 0;
  if (s.downgrading.length > 0) return 1;
  if (s.licence.standing === 'lapsed') return 2;
  if (s.licence.standing === 'unreadable_expiry') return 3;
  if (s.licence.standing === 'expiring') return 4;
  if (s.verification.standing === 'overdue' || s.verification.standing === 'unreadable') return 5;
  if (s.verification.standing === 'due') return 6;
  if (s.licence.standing === 'no_expiry_recorded') return 7;
  return 8;
}

export function representativeStandings(
  records: FirmRecords,
  asOf: IsoDate,
): RepresentativeStanding[] {
  const standings = records.representatives.map((record): RepresentativeStanding => {
    const gating = records.matters
      .filter((m) => m.matter.representativeId === record.credential.id)
      .map((m) => gatedMatter(record, m, asOf));
    const liveGating = gating.filter((g) => !g.terminal);
    const downgrading = liveGating.filter((g) => !g.toApplicant.allowed);
    const licence = licenceState(record.credential.expiresOn, asOf);
    const verification = verificationState(record.credential.verifiedOn, asOf);
    const needsAttention =
      licence.standing === 'lapsed' ||
      licence.standing === 'expiring' ||
      licence.standing === 'unreadable_expiry' ||
      verification.standing === 'overdue' ||
      verification.standing === 'unreadable' ||
      downgrading.length > 0;
    return { record, licence, verification, gating, liveGating, downgrading, needsAttention };
  });

  return standings.sort((a, b) => {
    const byRank = attentionRank(a) - attentionRank(b);
    if (byRank !== 0) return byRank;
    return a.record.displayName.localeCompare(b.record.displayName, 'en');
  });
}

/**
 * Matters with nobody accountable.
 *
 * These are not a representative's problem, so they do not belong on any roster
 * row — but they are the same failure seen from the other side, and leaving them
 * off the page would let a file with no representative look like a file that is
 * simply between owners.
 */
export function unrepresentedLiveMatters(records: FirmRecords): MatterRecord[] {
  return records.matters.filter(
    (m) => m.matter.representativeId === null && !isTerminal(m.matter.status),
  );
}

/**
 * A representative id on a matter that is not on the roster.
 *
 * Distinct from "no representative": one is a gap, the other is a dangling
 * reference, and the fix is different.
 */
export function danglingRepresentativeAssignments(
  records: FirmRecords,
): { readonly matter: MatterRecord; readonly representativeId: string }[] {
  const known = new Set(records.representatives.map((r) => r.credential.id));
  const out: { matter: MatterRecord; representativeId: string }[] = [];
  for (const matter of records.matters) {
    const id = matter.matter.representativeId;
    if (id !== null && !known.has(id)) out.push({ matter, representativeId: id });
  }
  return out;
}
