/**
 * Domain state to visual tone, and domain state to words.
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
 *
 * Every badge now takes a `locale`, and the words come from `lib/labels.ts`
 * rather than from a `humanise()` over the enum token. That helper turned
 * `awaiting_authority` into "Awaiting authority", which was passable English and
 * no Spanish at all: a Spanish page rendering "Awaiting authority" would be the
 * same defect the bilingual pages had, only one-sided.
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
import type { Locale } from '@/lib/i18n';
import { UI, fill, pick } from '@/lib/i18n';
import {
  CAPABILITY_STATE_LABEL,
  MATTER_STATUS_LABEL,
  PATHWAY_STATUS_LABEL,
  REVIEW_STATUS_LABEL,
  STALENESS_LABEL,
  TASK_STATUS_LABEL,
  credentialLabel,
} from '@/lib/labels';
import { Badge, type Tone } from '@/components/ui';

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

export function MatterStatusBadge({
  status,
  locale,
}: {
  status: MatterStatus;
  locale: Locale;
}) {
  return <Badge tone={matterStatusTone(status)}>{pick(MATTER_STATUS_LABEL[status], locale)}</Badge>;
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

export function TaskStatusBadge({ status, locale }: { status: TaskStatus; locale: Locale }) {
  return <Badge tone={taskStatusTone(status)}>{pick(TASK_STATUS_LABEL[status], locale)}</Badge>;
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
export function StalenessBadge({
  band,
  ageDays,
  locale,
}: {
  band: Staleness;
  ageDays: number;
  locale: Locale;
}) {
  if (ageDays < 0) {
    return (
      <Badge tone="info" title={pick(UI.stalenessVerifiedLaterTitle, locale)}>
        {fill(UI.stalenessVerifiedLater, locale, { days: Math.abs(ageDays) })}
      </Badge>
    );
  }
  return (
    <Badge tone={stalenessTone(band)} title={pick(UI.stalenessBandTitle, locale)}>
      {fill(UI.stalenessWithAge, locale, {
        band: pick(STALENESS_LABEL[band], locale),
        days: ageDays,
      })}
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

export function ReviewStatusBadge({ status, locale }: { status: ReviewStatus; locale: Locale }) {
  return <Badge tone={reviewStatusTone(status)}>{pick(REVIEW_STATUS_LABEL[status], locale)}</Badge>;
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

export function PathwayStatusBadge({ status, locale }: { status: PathwayStatus; locale: Locale }) {
  return (
    <Badge tone={pathwayStatusTone(status)}>{pick(PATHWAY_STATUS_LABEL[status], locale)}</Badge>
  );
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

export function CapabilityStateBadge({
  state,
  locale,
}: {
  state: CapabilityState;
  locale: Locale;
}) {
  return (
    <Badge tone={capabilityStateTone(state)}>{pick(CAPABILITY_STATE_LABEL[state], locale)}</Badge>
  );
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
 * A representative's standing, rendered in the language its own regulator uses.
 *
 * The `lang` this carries is not the page locale and is not decoration — see the
 * note on `credentialLabel` in `lib/labels.ts`. Rendering it through a component
 * rather than as a bare string is what puts the attribute on an element instead
 * of leaving each call site to remember it.
 */
export function CredentialName({
  credential,
  locale,
}: {
  credential: RepresentativeCredential;
  locale: Locale;
}) {
  const label = credentialLabel(credential, locale);
  return <span lang={label.lang}>{label.text}</span>;
}
