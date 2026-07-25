/**
 * Domain state to visual tone.
 *
 * One file, so that "what colour is `awaiting_authority`" has exactly one answer
 * across six screens. Each mapping is a total function over a closed union, with
 * no default branch — adding a status to `@meridian/core` makes this file fail to
 * compile rather than silently rendering the new state as neutral grey on every
 * page at once.
 *
 * The tone choices encode a judgement worth stating. Waiting on an authority is
 * `info`, not `warn`: the clock is outside the firm's control and painting it as
 * a problem trains people to ignore the colour. Waiting on the firm's own review
 * is `warn`, because that one is theirs to move. A refusal by policy is its own
 * tone rather than a red one, because it is a settled decision and not a fault.
 */

import type {
  MatterStatus,
  RepresentativeCredential,
  Staleness,
  TaskStatus,
} from '@meridian/core';
import type { CapabilityState } from '@meridian/govtech';
import type { PathwayStatus, ReviewStatus } from '@meridian/pathways';
import type { DeadlineSeverity } from '@/lib/caseload';
import type { LicenceStanding, VerificationStanding } from '@/lib/roster';
import { Badge, type Tone } from '@/components/ui';
import { humanise } from '@/lib/format';

export function matterStatusTone(status: MatterStatus): Tone {
  switch (status) {
    case 'draft':
      return 'neutral';
    case 'active':
    case 'submitted':
      return 'info';
    case 'awaiting_applicant':
      return 'warn';
    case 'awaiting_authority':
      return 'info';
    case 'awaiting_representative_review':
      return 'warn';
    case 'granted':
      return 'ok';
    case 'refused':
      return 'danger';
    case 'withdrawn':
    case 'abandoned':
      return 'neutral';
  }
}

export function MatterStatusBadge({ status }: { status: MatterStatus }) {
  return <Badge tone={matterStatusTone(status)}>{humanise(status)}</Badge>;
}

export function taskStatusTone(status: TaskStatus): Tone {
  switch (status) {
    case 'locked':
      return 'neutral';
    case 'available':
      return 'info';
    case 'in_progress':
      return 'warn';
    case 'submitted':
      return 'info';
    case 'complete':
      return 'ok';
    case 'waived':
      return 'neutral';
  }
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={taskStatusTone(status)}>{humanise(status)}</Badge>;
}

export function severityTone(severity: DeadlineSeverity): Tone {
  switch (severity) {
    case 'passed':
      return 'danger';
    case 'critical':
      return 'danger';
    case 'approaching':
      return 'warn';
    case 'scheduled':
      return 'neutral';
  }
}

export function stalenessTone(band: Staleness): Tone {
  switch (band) {
    case 'fresh':
      return 'ok';
    case 'aging':
      return 'warn';
    case 'stale':
      return 'danger';
  }
}

/**
 * Staleness labels say the number as well as the band. "Aging" alone means
 * nothing to a reviewer deciding whether to re-read a statute this week.
 *
 * A negative age is a real case, not a bug: asked about a date before the
 * citation was verified — which the as-at control makes trivially easy — the
 * honest answer is that nobody had checked it yet. Rendering that as
 * "Fresh · -479d" would read as a defect and invite somebody to clamp it, which
 * is how a page ends up claiming a rule was verified on a date it was not.
 */
export function StalenessBadge({ band, ageDays }: { band: Staleness; ageDays: number }) {
  if (ageDays < 0) {
    return (
      <Badge tone="info" title="The reference date precedes the verification date.">
        Verified {Math.abs(ageDays)}d later
      </Badge>
    );
  }
  const label =
    band === 'fresh'
      ? `Fresh · ${ageDays}d`
      : band === 'aging'
        ? `Aging · ${ageDays}d`
        : `Stale · ${ageDays}d`;
  return (
    <Badge
      tone={stalenessTone(band)}
      title="Verified within 90 days is fresh, 91–180 aging, over 180 stale."
    >
      {label}
    </Badge>
  );
}

export function reviewStatusTone(status: ReviewStatus): Tone {
  switch (status) {
    case 'unreviewed':
      return 'warn';
    case 'counsel_reviewed':
      return 'ok';
    case 'needs_reverification':
      return 'danger';
  }
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge tone={reviewStatusTone(status)}>{humanise(status)}</Badge>;
}

export function pathwayStatusTone(status: PathwayStatus): Tone {
  switch (status) {
    case 'open':
      return 'ok';
    case 'suspended':
      return 'warn';
    case 'closed':
      return 'neutral';
  }
}

export function PathwayStatusBadge({ status }: { status: PathwayStatus }) {
  return <Badge tone={pathwayStatusTone(status)}>{humanise(status)}</Badge>;
}

export function capabilityStateTone(state: CapabilityState): Tone {
  switch (state) {
    case 'available':
      return 'ok';
    case 'degraded':
      return 'warn';
    case 'not_provisioned':
      return 'warn';
    case 'not_implemented':
      return 'info';
    case 'refused_by_policy':
      return 'refused';
  }
}

export function CapabilityStateBadge({ state }: { state: CapabilityState }) {
  return <Badge tone={capabilityStateTone(state)}>{humanise(state)}</Badge>;
}

export function licenceStandingTone(standing: LicenceStanding): Tone {
  switch (standing) {
    case 'live':
      return 'ok';
    case 'expiring':
      return 'warn';
    case 'lapsed':
      return 'danger';
    case 'no_expiry_recorded':
      return 'neutral';
    case 'unreadable_expiry':
      return 'danger';
  }
}

export function verificationTone(standing: VerificationStanding): Tone {
  switch (standing) {
    case 'current':
      return 'ok';
    case 'due':
      return 'warn';
    case 'overdue':
      return 'danger';
    case 'unreadable':
      return 'danger';
  }
}

/**
 * Credential display names.
 *
 * `humanise` would render `rcic` as "Rcic", which is not what the College calls
 * its licensees and reads to a practitioner as a typo. The regulated standings
 * are a closed set with real names, so they get real names — and the mapping is
 * total, so adding a credential type to `@meridian/core` breaks the build here
 * rather than shipping a mangled label on the roster.
 */
export function credentialLabel(credential: RepresentativeCredential): string {
  switch (credential) {
    case 'rcic':
      return 'RCIC';
    case 'canadian_lawyer':
      return 'Canadian lawyer';
    case 'canadian_paralegal':
      return 'Canadian paralegal';
    case 'quebec_notary':
      return 'Quebec notary';
    case 'spanish_abogado':
      return 'Abogado colegiado';
    case 'spanish_gestor':
      return 'Gestor administrativo';
    case 'other_regulated':
      return 'Other regulated standing';
  }
}
