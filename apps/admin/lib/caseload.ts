/**
 * Caseload derivations: what is where, what is stuck and on whom, and what runs
 * out soonest.
 *
 * Every number this module produces is computed from the records at call time.
 * There is no stored total anywhere, which is the only way a count on a console
 * can be trusted — a cached "12 active matters" is a number that was true once.
 *
 * Three triage bands appear here and none of them is law. They are the console's
 * own thresholds for how loudly to speak, and the screens say so:
 *
 *  - `CRITICAL_WINDOW_DAYS` (14) — inside two weeks, on the front page.
 *  - `APPROACHING_WINDOW_DAYS` (45) — visible, not shouted.
 *  - anything further out is `scheduled`.
 *
 * The *dates* themselves are not invented. An authorisation expiry is a date the
 * authority set. A document acceptance window is computed by
 * `@meridian/documents` from a cited rule. A task due date is one a human on the
 * file entered. The bands only decide typography.
 */

import {
  MATTER_PHASE_ORDER,
  diffDays,
  isTerminal,
  unlockTasks,
  findTaskCycles,
  type IsoDate,
  type MatterPhase,
  type MatterStatus,
  type Task,
  type TaskAssignee,
} from '@meridian/core';
import {
  EXPIRY_GOVERNED_KINDS,
  isDocumentPresent,
  projectFreshness,
  type Document,
  type FreshnessProjection,
} from '@meridian/documents';
import { pathwayById, statusOn, type Pathway } from '@meridian/pathways';
import type { Bi, Locale } from '@/lib/i18n';
import { COUNTS, UI, countOf, fill, pick } from '@/lib/i18n';
import {
  DOCUMENT_KIND_LABEL,
  MATTER_PHASE_LABEL,
  MATTER_STATUS_LABEL,
  TASK_ASSIGNEE_LABEL,
  TASK_STATUS_LABEL,
} from '@/lib/labels';
import type { AuditRecord, FirmRecords, MatterRecord } from '@/lib/records';
import type { RepresentativeStanding } from '@/lib/roster';

export const CRITICAL_WINDOW_DAYS = 14;
export const APPROACHING_WINDOW_DAYS = 45;

/* -------------------------------------------------------------------------- */
/* Distribution                                                               */
/* -------------------------------------------------------------------------- */

/** Every status, in a fixed order, so a zero is visible as a zero. */
export const MATTER_STATUS_ORDER: readonly MatterStatus[] = [
  'draft',
  'active',
  'awaiting_applicant',
  'awaiting_authority',
  'awaiting_representative_review',
  'submitted',
  'granted',
  'refused',
  'withdrawn',
  'abandoned',
];

export interface PhaseRow {
  readonly phase: MatterPhase;
  readonly total: number;
  /** Count per status, aligned to `MATTER_STATUS_ORDER`. */
  readonly byStatus: Readonly<Record<MatterStatus, number>>;
}

export interface Distribution {
  readonly rows: readonly PhaseRow[];
  readonly statusTotals: Readonly<Record<MatterStatus, number>>;
  /** Statuses that actually occur, in canonical order. Empty columns are not rendered. */
  readonly occupiedStatuses: readonly MatterStatus[];
  readonly total: number;
  readonly live: number;
  readonly closed: number;
}

function emptyStatusCounts(): Record<MatterStatus, number> {
  const out = {} as Record<MatterStatus, number>;
  for (const s of MATTER_STATUS_ORDER) out[s] = 0;
  return out;
}

/**
 * Phase x status, including every phase even when nothing is in it.
 *
 * A phase with no matters is information — it means nothing is at that stage —
 * and dropping the row would make an empty pipeline look like a short one.
 */
export function distribution(matters: readonly MatterRecord[]): Distribution {
  const statusTotals = emptyStatusCounts();
  const rows: PhaseRow[] = MATTER_PHASE_ORDER.map((phase) => {
    const byStatus = emptyStatusCounts();
    let total = 0;
    for (const record of matters) {
      if (record.matter.phase !== phase) continue;
      byStatus[record.matter.status] += 1;
      statusTotals[record.matter.status] += 1;
      total += 1;
    }
    return { phase, total, byStatus };
  });

  const occupiedStatuses = MATTER_STATUS_ORDER.filter((s) => statusTotals[s] > 0);
  const live = matters.filter((m) => !isTerminal(m.matter.status)).length;

  return {
    rows,
    statusTotals,
    occupiedStatuses,
    total: matters.length,
    live,
    closed: matters.length - live,
  };
}

/* -------------------------------------------------------------------------- */
/* Blockers                                                                   */
/* -------------------------------------------------------------------------- */

/** Who has to move for the file to move. */
export type BlockerOwner =
  | 'applicant'
  | 'authority'
  | 'representative'
  | 'employer'
  | 'platform'
  | 'firm';

export type BlockerCode =
  | 'awaiting_applicant'
  | 'awaiting_authority'
  | 'awaiting_representative_review'
  | 'unstarted_draft'
  | 'no_representative'
  | 'representative_not_on_roster'
  | 'advice_downgraded'
  | 'pathway_not_in_catalog'
  | 'pathway_closed'
  | 'task_dependency_cycle';

export interface Blocker {
  readonly id: string;
  readonly matterId: string;
  readonly matterReference: string;
  /**
   * The firm's own one-line description of the objective, verbatim.
   *
   * Record content, not copy: it is rendered in the language it was written in
   * and never translated. `FirmRecords.recordLanguage` says which language that
   * is, so the page can mark it.
   */
  readonly matterTitle: string;
  readonly owner: BlockerOwner;
  readonly code: BlockerCode;
  /** Already in the reader's language. `blockers()` takes the locale. */
  readonly summary: string;
  readonly detail: string;
  /** When the file entered this state, read off the audit trail. Absent when unrecorded. */
  readonly since?: IsoDate;
  readonly ageDays?: number;
}

/**
 * When a matter last changed state, according to the trail.
 *
 * Read from the audit records rather than stored on the matter, because the
 * trail is the thing that is actually authoritative about what happened when —
 * and because a `statusChangedOn` field would be one more thing that can drift
 * out of agreement with the evidence.
 */
export function lastStateChange(audit: readonly AuditRecord[], matterId: string): IsoDate | null {
  let latest: IsoDate | null = null;
  for (const entry of audit) {
    if (entry.matterId !== matterId) continue;
    if (entry.kind !== 'status_changed' && entry.kind !== 'matter_opened' && entry.kind !== 'phase_advanced') {
      continue;
    }
    if (latest === null || entry.on > latest) latest = entry.on;
  }
  return latest;
}

const STATUS_BLOCKERS: Partial<
  Record<
    MatterStatus,
    { readonly owner: BlockerOwner; readonly code: BlockerCode; readonly summary: Bi }
  >
> = {
  awaiting_applicant: {
    owner: 'applicant',
    code: 'awaiting_applicant',
    summary: UI.blockerAwaitingApplicant,
  },
  awaiting_authority: {
    owner: 'authority',
    code: 'awaiting_authority',
    summary: UI.blockerAwaitingAuthority,
  },
  awaiting_representative_review: {
    owner: 'representative',
    code: 'awaiting_representative_review',
    summary: UI.blockerAwaitingReview,
  },
  draft: {
    owner: 'firm',
    code: 'unstarted_draft',
    summary: UI.blockerDraft,
  },
};

/**
 * `locale` reaches this far down because a blocker's summary is a sentence, and
 * a sentence has to be assembled in the language that owns its word order.
 * Returning a code for the page to translate would move the same table one file
 * up and lose the interpolated values on the way.
 */
export function blockers(
  records: FirmRecords,
  standings: readonly RepresentativeStanding[],
  asOf: IsoDate,
  locale: Locale,
): Blocker[] {
  const out: Blocker[] = [];
  const rosterIds = new Set(records.representatives.map((r) => r.credential.id));
  const downgradedMatterIds = new Set(
    standings.flatMap((s) => s.downgrading.map((d) => d.matterId)),
  );

  for (const record of records.matters) {
    const { matter } = record;
    if (isTerminal(matter.status)) continue;

    // `since` is the last time the file moved at all, read off the trail. It is
    // attached to every blocker on the matter rather than only to the status
    // one: a reader asking "how long has this been stuck" means the file, not
    // the individual finding, and omitting it elsewhere rendered a recorded date
    // as "not recorded".
    const since = lastStateChange(records.audit, matter.id);
    const base = {
      matterId: matter.id,
      matterReference: record.reference,
      matterTitle: record.title,
      ...(since === null ? {} : { since, ageDays: diffDays(since, asOf) }),
    };

    const statusBlocker = STATUS_BLOCKERS[matter.status];
    if (statusBlocker !== undefined) {
      out.push({
        id: `${matter.id}:${statusBlocker.code}`,
        ...base,
        owner: statusBlocker.owner,
        code: statusBlocker.code,
        summary: pick(statusBlocker.summary, locale),
        // Lower-cased because both labels are sentence-case standing alone and
        // neither contains a proper noun. `toLocaleLowerCase` rather than
        // `toLowerCase`, since the console serves two languages and the rule for
        // which is which is the locale's, not the runtime's default.
        detail: fill(UI.blockerStatusDetail, locale, {
          status: pick(MATTER_STATUS_LABEL[matter.status], locale).toLocaleLowerCase(locale),
          phase: pick(MATTER_PHASE_LABEL[matter.phase], locale).toLocaleLowerCase(locale),
        }),
      });
    }

    if (matter.representativeId === null) {
      out.push({
        id: `${matter.id}:no_representative`,
        ...base,
        owner: 'firm',
        code: 'no_representative',
        summary: pick(UI.blockerNoRepresentative, locale),
        detail: pick(UI.blockerNoRepresentativeDetail, locale),
      });
    } else if (!rosterIds.has(matter.representativeId)) {
      out.push({
        id: `${matter.id}:representative_not_on_roster`,
        ...base,
        owner: 'firm',
        code: 'representative_not_on_roster',
        summary: fill(UI.blockerNotOnRoster, locale, { id: matter.representativeId }),
        detail: pick(UI.blockerNotOnRosterDetail, locale),
      });
    } else if (downgradedMatterIds.has(matter.id)) {
      out.push({
        id: `${matter.id}:advice_downgraded`,
        ...base,
        owner: 'firm',
        code: 'advice_downgraded',
        summary: pick(UI.blockerAdviceDowngraded, locale),
        detail: pick(UI.blockerAdviceDowngradedDetail, locale),
      });
    }

    const pathway = pathwayById(matter.pathwayId);
    if (pathway === null) {
      out.push({
        id: `${matter.id}:pathway_not_in_catalog`,
        ...base,
        owner: 'firm',
        code: 'pathway_not_in_catalog',
        summary: fill(UI.blockerPathwayMissing, locale, { id: matter.pathwayId }),
        detail: pick(UI.blockerPathwayMissingDetail, locale),
      });
    } else if (statusOn(pathway, asOf) === 'closed') {
      out.push({
        id: `${matter.id}:pathway_closed`,
        ...base,
        owner: 'representative',
        code: 'pathway_closed',
        summary: fill(UI.blockerPathwayClosed, locale, { date: asOf }),
        detail: pick(UI.blockerPathwayClosedDetail, locale),
      });
    }

    for (const cycle of findTaskCycles(record.tasks)) {
      out.push({
        id: `${matter.id}:task_dependency_cycle:${cycle.join('>')}`,
        ...base,
        owner: 'platform',
        code: 'task_dependency_cycle',
        summary: pick(UI.blockerCycle, locale),
        detail: fill(UI.blockerCycleDetail, locale, { cycle: cycle.join(' → ') }),
      });
    }
  }

  return out;
}

export function blockersByOwner(list: readonly Blocker[]): { owner: BlockerOwner; blockers: Blocker[] }[] {
  const order: readonly BlockerOwner[] = [
    'firm',
    'representative',
    'applicant',
    'authority',
    'employer',
    'platform',
  ];
  return order
    .map((owner) => ({ owner, blockers: list.filter((b) => b.owner === owner) }))
    .filter((group) => group.blockers.length > 0);
}

/* -------------------------------------------------------------------------- */
/* Work in hand                                                               */
/* -------------------------------------------------------------------------- */

export interface WorkInHand {
  readonly assignee: TaskAssignee;
  readonly available: number;
  readonly inProgress: number;
  readonly locked: number;
}

export const TASK_ASSIGNEE_ORDER: readonly TaskAssignee[] = [
  'applicant',
  'representative',
  'employer',
  'platform',
  'authority',
];

/**
 * Tasks by owner, after `unlockTasks` has been applied per matter.
 *
 * Applying the unlock is the whole point: a raw count of `locked` tasks tells a
 * practitioner nothing, because most of them are locked for a good reason. What
 * is actionable is what became *available* once the phase and the dependencies
 * were resolved.
 */
export function workInHand(matters: readonly MatterRecord[]): WorkInHand[] {
  const counts = new Map<TaskAssignee, { available: number; inProgress: number; locked: number }>();
  for (const assignee of TASK_ASSIGNEE_ORDER) {
    counts.set(assignee, { available: 0, inProgress: 0, locked: 0 });
  }

  for (const record of matters) {
    if (isTerminal(record.matter.status)) continue;
    for (const task of unlockTasks(record.tasks, record.matter.phase)) {
      const bucket = counts.get(task.assignee);
      if (bucket === undefined) continue;
      if (task.status === 'available') bucket.available += 1;
      else if (task.status === 'in_progress') bucket.inProgress += 1;
      else if (task.status === 'locked') bucket.locked += 1;
    }
  }

  return TASK_ASSIGNEE_ORDER.map((assignee) => {
    const bucket = counts.get(assignee) ?? { available: 0, inProgress: 0, locked: 0 };
    return { assignee, ...bucket };
  }).filter((row) => row.available + row.inProgress + row.locked > 0);
}

/** The unlocked view of one matter's tasks, in phase order then dependency order. */
export function resolvedTasks(record: MatterRecord): Task[] {
  const resolved = unlockTasks(record.tasks, record.matter.phase);
  return [...resolved].sort((a, b) => {
    const byPhase = MATTER_PHASE_ORDER.indexOf(a.phase) - MATTER_PHASE_ORDER.indexOf(b.phase);
    if (byPhase !== 0) return byPhase;
    if (a.dependsOn.length !== b.dependsOn.length) return a.dependsOn.length - b.dependsOn.length;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/* -------------------------------------------------------------------------- */
/* Time-critical                                                              */
/* -------------------------------------------------------------------------- */

export type DeadlineKind =
  /** The applicant's current permission to be where they are. */
  | 'authorisation_expiry'
  /** The date printed on the document itself. */
  | 'document_expiry'
  /** The last day the receiving authority will accept a document this old. */
  | 'acceptance_window'
  /** The date the file is planned to be lodged. */
  | 'target_submission'
  /** A due date a human on the file entered against a task. */
  | 'task_due'
  /** A representative standing that gates advice on live files. */
  | 'credential_expiry';

export type DeadlineSeverity = 'passed' | 'critical' | 'approaching' | 'scheduled';

export interface Deadline {
  readonly id: string;
  readonly kind: DeadlineKind;
  readonly on: IsoDate;
  /** `diffDays(asOf, on)`. Negative once past. */
  readonly daysRemaining: number;
  readonly severity: DeadlineSeverity;
  /**
   * In the reader's language, except where it quotes a record — a task's title
   * is what somebody typed on the file and is reproduced verbatim, which is why
   * `labelIsRecord` exists rather than the page having to guess.
   */
  readonly label: string;
  /** True when `label` is record content rather than console copy. */
  readonly labelIsRecord: boolean;
  readonly detail: string;
  /** True when `detail` came from a package that speaks only one language. */
  readonly detailIsForeign: boolean;
  /** `null` for roster-level deadlines that are not about one file. */
  readonly matterId: string | null;
  readonly matterReference: string | null;
  /** The firm's own description of the objective. Record content; never translated. */
  readonly matterTitle: string | null;
  readonly citationIds: readonly string[];
}

export function severityFor(daysRemaining: number): DeadlineSeverity {
  if (daysRemaining < 0) return 'passed';
  if (daysRemaining <= CRITICAL_WINDOW_DAYS) return 'critical';
  if (daysRemaining <= APPROACHING_WINDOW_DAYS) return 'approaching';
  return 'scheduled';
}

function deadline(
  parts: Omit<Deadline, 'daysRemaining' | 'severity'>,
  asOf: IsoDate,
): Deadline {
  const daysRemaining = diffDays(asOf, parts.on);
  return { ...parts, daysRemaining, severity: severityFor(daysRemaining) };
}

/**
 * The freshness picture for one matter's folder.
 *
 * `projectFreshness` is asked about the *submission* date, not today. That is
 * the difference between "this certificate is fine" and "this certificate will
 * be three weeks out of its window when we file", and only the second one is the
 * question a practitioner is actually asking.
 *
 * Where the target submission date is unknown the projection falls back to
 * `asOf`, and the result says so — an unknown filing date makes the answer
 * weaker, not absent.
 */
export interface DocumentFreshness {
  readonly document: Document;
  readonly projection: FreshnessProjection;
}

export function documentFreshness(record: MatterRecord, asOf: IsoDate): DocumentFreshness[] {
  const submissionDate = record.targetSubmissionDate ?? asOf;
  return record.documents
    .filter((document) => isDocumentPresent(document.status))
    .map((document) => ({
      document,
      projection: projectFreshness({
        document,
        receivingCountry: record.matter.targetJurisdiction,
        submissionDate,
        asOf,
      }),
    }));
}

function matterDeadlines(record: MatterRecord, asOf: IsoDate, locale: Locale): Deadline[] {
  const { matter } = record;
  if (isTerminal(matter.status)) return [];

  const out: Deadline[] = [];
  const base = {
    matterId: matter.id,
    matterReference: record.reference,
    matterTitle: record.title,
    labelIsRecord: false,
    detailIsForeign: false,
  };

  if (record.statusExpiresOn !== undefined) {
    out.push(
      deadline(
        {
          id: `${matter.id}:authorisation`,
          kind: 'authorisation_expiry',
          on: record.statusExpiresOn,
          label: pick(UI.deadlineAuthorisationLabel, locale),
          detail: fill(UI.deadlineAuthorisationDetail, locale, {
            jurisdiction: matter.targetJurisdiction,
          }),
          citationIds: [],
          ...base,
        },
        asOf,
      ),
    );
  }

  if (record.targetSubmissionDate !== undefined) {
    out.push(
      deadline(
        {
          id: `${matter.id}:submission`,
          kind: 'target_submission',
          on: record.targetSubmissionDate,
          label: pick(UI.deadlineSubmissionLabel, locale),
          detail: pick(UI.deadlineSubmissionDetail, locale),
          citationIds: [],
          ...base,
        },
        asOf,
      ),
    );
  }

  for (const { document, projection } of documentFreshness(record, asOf)) {
    // Only when the window comes from a catalogued acceptance rule. When
    // `window` is null the projection derived `acceptableUntil` from the expiry
    // printed on the document, which is already emitted as `document_expiry`
    // below — surfacing both would show a practitioner the same date twice under
    // two names and make an ordinary passport look like two obligations.
    if (projection.acceptableUntil !== undefined && projection.window !== null) {
      out.push(
        deadline(
          {
            id: `${matter.id}:window:${document.id}`,
            kind: 'acceptance_window',
            on: projection.acceptableUntil,
            label: fill(UI.deadlineWindowLabel, locale, {
              document: pick(DOCUMENT_KIND_LABEL[document.kind], locale),
            }),
            // `@meridian/documents` writes its rationale in English and nothing
            // here rewrites it: paraphrasing a package's own account of why a
            // window closes would put words in its mouth. It is marked instead.
            detail: projection.rationale,
            citationIds: projection.citations.map((c) => c.id),
            ...base,
            detailIsForeign: true,
          },
          asOf,
        ),
      );
    }

    if (document.expiresOn !== undefined && EXPIRY_GOVERNED_KINDS.includes(document.kind)) {
      out.push(
        deadline(
          {
            id: `${matter.id}:expiry:${document.id}`,
            kind: 'document_expiry',
            on: document.expiresOn,
            label: fill(UI.deadlineExpiryLabel, locale, {
              document: pick(DOCUMENT_KIND_LABEL[document.kind], locale),
            }),
            detail: fill(UI.deadlineDocumentDetail, locale, {
              id: document.id,
              country: document.issuingCountry,
            }),
            citationIds: [],
            ...base,
          },
          asOf,
        ),
      );
    }
  }

  for (const task of unlockTasks(record.tasks, matter.phase)) {
    if (task.dueOn === undefined) continue;
    if (task.status === 'complete' || task.status === 'waived') continue;
    out.push(
      deadline(
        {
          id: `${matter.id}:task:${task.id}`,
          kind: 'task_due',
          on: task.dueOn,
          // The task title is what somebody wrote on the file. Verbatim.
          label: task.title,
          detail: fill(UI.deadlineTaskDetail, locale, {
            assignee: pick(TASK_ASSIGNEE_LABEL[task.assignee], locale).toLocaleLowerCase(locale),
            status: pick(TASK_STATUS_LABEL[task.status], locale).toLocaleLowerCase(locale),
          }),
          citationIds: task.citationIds,
          ...base,
          labelIsRecord: true,
        },
        asOf,
      ),
    );
  }

  return out;
}

function credentialDeadlines(
  standings: readonly RepresentativeStanding[],
  asOf: IsoDate,
  locale: Locale,
): Deadline[] {
  const out: Deadline[] = [];
  for (const standing of standings) {
    const { expiresOn, daysRemaining } = standing.licence;
    if (expiresOn === null || daysRemaining === null) continue;
    if (standing.liveGating.length === 0 && daysRemaining >= 0) continue;
    out.push(
      deadline(
        {
          id: `credential:${standing.record.credential.id}`,
          kind: 'credential_expiry',
          on: expiresOn as IsoDate,
          // The display name is a person's name. Not translated, and not a
          // reason to mark the whole label as foreign — the rest is copy.
          label: fill(UI.deadlineCredentialLabel, locale, {
            name: standing.record.displayName,
            jurisdiction: standing.record.credential.jurisdiction,
          }),
          labelIsRecord: false,
          detail: fill(UI.deadlineCredentialDetail, locale, {
            matters: countOf(locale, standing.liveGating.length, COUNTS.liveMatter),
            jurisdiction: standing.record.credential.jurisdiction,
          }),
          detailIsForeign: false,
          citationIds: [],
          matterId: null,
          matterReference: null,
          matterTitle: null,
        },
        asOf,
      ),
    );
  }
  return out;
}

/**
 * Everything with a date on it, soonest first.
 *
 * Sorted by date rather than by severity so that a passed deadline sits above an
 * imminent one. Something already missed is more urgent than something about to
 * be, and a list that buries it under today's work is how it stays missed.
 */
export function deadlines(
  records: FirmRecords,
  standings: readonly RepresentativeStanding[],
  asOf: IsoDate,
  locale: Locale,
): Deadline[] {
  const all = [
    ...records.matters.flatMap((record) => matterDeadlines(record, asOf, locale)),
    ...credentialDeadlines(standings, asOf, locale),
  ];
  return all.sort((a, b) => {
    if (a.on !== b.on) return a.on < b.on ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function timeCritical(list: readonly Deadline[]): Deadline[] {
  return list.filter((d) => d.severity === 'passed' || d.severity === 'critical');
}

/* -------------------------------------------------------------------------- */
/* Catalog dependency                                                         */
/* -------------------------------------------------------------------------- */

export interface CatalogDependency {
  readonly pathwayId: string;
  readonly pathway: Pathway | null;
  readonly liveMatters: readonly MatterRecord[];
  readonly reviewed: boolean;
  readonly closedAsOf: boolean;
}

/**
 * Which catalog records the live caseload is resting on, and whether anybody has
 * signed them off.
 *
 * This is the link between the caseload and the review queue. Every shipped
 * pathway is `unreviewed` today, so this list is presently the whole caseload —
 * which is exactly the fact the review queue exists to change, and exactly the
 * fact that should be uncomfortable to look at.
 */
export function catalogDependencies(records: FirmRecords, asOf: IsoDate): CatalogDependency[] {
  const byPathway = new Map<string, MatterRecord[]>();
  for (const record of records.matters) {
    if (isTerminal(record.matter.status)) continue;
    const list = byPathway.get(record.matter.pathwayId) ?? [];
    list.push(record);
    byPathway.set(record.matter.pathwayId, list);
  }

  return [...byPathway.entries()]
    .map(([pathwayId, liveMatters]): CatalogDependency => {
      const pathway = pathwayById(pathwayId);
      return {
        pathwayId,
        pathway,
        liveMatters,
        reviewed: pathway !== null && pathway.reviewStatus === 'counsel_reviewed',
        closedAsOf: pathway !== null && statusOn(pathway, asOf) === 'closed',
      };
    })
    .sort((a, b) => {
      if (a.liveMatters.length !== b.liveMatters.length) {
        return b.liveMatters.length - a.liveMatters.length;
      }
      return a.pathwayId < b.pathwayId ? -1 : a.pathwayId > b.pathwayId ? 1 : 0;
    });
}
