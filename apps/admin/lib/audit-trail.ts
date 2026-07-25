/**
 * The append-only trail, and the filters over it.
 *
 * Two properties make a trail evidence rather than a log, and both are enforced
 * here rather than promised:
 *
 * **Sequence numbers are assigned over the whole trail, once, before filtering.**
 * Entry 17 is entry 17 on every screen, in every filter, forever. Numbering
 * after filtering would produce a page where the same event is #4 under one
 * filter and #11 under another, which is exactly how a reader loses the ability
 * to say "that entry is missing".
 *
 * **Filtering removes rows from the view, never from the trail, and the page
 * always says how many were removed.** A filtered audit view that does not
 * report its own suppression is a view that can be screenshotted to prove
 * something untrue.
 *
 * Disclosure downgrades are first-class here. `canRelease` refuses advice
 * quietly and correctly — the applicant simply sees an assessment — and the only
 * record that a recommendation ever existed is the entry the gate wrote. That is
 * the entry a regulator asks about, so it is filterable on its own.
 */

import { compareDates, diffDays, tryIsoDate, type IsoDate } from '@meridian/core';
import type { AuditActorKind, AuditEventKind, AuditRecord, FirmRecords } from '@/lib/records';
import { auditInOrder } from '@/lib/records';

/** Canonical display order for the kind filter. Every kind, so a zero reads as a zero. */
export const AUDIT_EVENT_KINDS: readonly AuditEventKind[] = [
  'matter_opened',
  'phase_advanced',
  'status_changed',
  'representative_assigned',
  'representative_unassigned',
  'credential_verified',
  'task_completed',
  'document_received',
  'document_status_changed',
  'disclosure_released',
  'disclosure_downgraded',
  'catalog_review_recorded',
  'integration_refused',
];

export const AUDIT_ACTOR_KINDS: readonly AuditActorKind[] = [
  'representative',
  'staff',
  'applicant',
  'platform',
  'authority',
];

/** One entry with its permanent position in the trail. */
export interface NumberedAuditEntry {
  readonly seq: number;
  readonly entry: AuditRecord;
  /** Days between the entry and the reference date. Negative for the future. */
  readonly ageDays: number;
}

export interface AuditFilter {
  readonly kind?: AuditEventKind;
  readonly actorKind?: AuditActorKind;
  readonly actorId?: string;
  readonly matterId?: string;
  readonly from?: IsoDate;
  readonly to?: IsoDate;
  /** Restrict to entries that carry a disclosure decision. */
  readonly disclosureOnly?: boolean;
  /** Free text over summary, detail and actor. Case-insensitive substring. */
  readonly query?: string;
}

export interface AuditView {
  /** The whole trail, numbered. Never filtered. */
  readonly all: readonly NumberedAuditEntry[];
  /** The rows the current filter admits, newest first. */
  readonly visible: readonly NumberedAuditEntry[];
  readonly suppressed: number;
  readonly filter: AuditFilter;
  readonly facets: AuditFacets;
}

export interface Facet<T extends string> {
  readonly value: T;
  readonly count: number;
}

export interface AuditFacets {
  readonly kinds: readonly Facet<AuditEventKind>[];
  readonly actorKinds: readonly Facet<AuditActorKind>[];
  readonly actors: readonly Facet<string>[];
  readonly matters: readonly Facet<string>[];
  readonly disclosures: number;
  readonly downgrades: number;
}

function numberTrail(records: FirmRecords, asOf: IsoDate): NumberedAuditEntry[] {
  return auditInOrder(records).map((entry, index) => ({
    seq: index + 1,
    entry,
    ageDays: diffDays(entry.on, asOf),
  }));
}

/**
 * Facets are counted over the *whole* trail, not the filtered view.
 *
 * A facet list that shrinks as you filter cannot tell you what else is there,
 * which defeats the point of offering it. Counts here answer "how many of these
 * exist", and the filter answers "show me those".
 */
function facetsOf(all: readonly NumberedAuditEntry[]): AuditFacets {
  const countBy = <T extends string>(pick: (e: AuditRecord) => T | null): Map<T, number> => {
    const map = new Map<T, number>();
    for (const { entry } of all) {
      const key = pick(entry);
      if (key === null) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };

  const kindCounts = countBy<AuditEventKind>((e) => e.kind);
  const actorKindCounts = countBy<AuditActorKind>((e) => e.actorKind);
  const actorCounts = countBy<string>((e) => e.actorId);
  const matterCounts = countBy<string>((e) => e.matterId);

  const byCountThenName = <T extends string>(a: Facet<T>, b: Facet<T>): number => {
    if (a.count !== b.count) return b.count - a.count;
    return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
  };

  return {
    kinds: AUDIT_EVENT_KINDS.filter((k) => kindCounts.has(k)).map((k) => ({
      value: k,
      count: kindCounts.get(k) ?? 0,
    })),
    actorKinds: AUDIT_ACTOR_KINDS.filter((k) => actorKindCounts.has(k)).map((k) => ({
      value: k,
      count: actorKindCounts.get(k) ?? 0,
    })),
    actors: [...actorCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort(byCountThenName),
    matters: [...matterCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort(byCountThenName),
    disclosures: all.filter((e) => e.entry.disclosure !== undefined).length,
    downgrades: all.filter(
      (e) =>
        e.entry.disclosure !== undefined &&
        e.entry.disclosure.released !== e.entry.disclosure.produced,
    ).length,
  };
}

function admits(entry: AuditRecord, filter: AuditFilter): boolean {
  if (filter.kind !== undefined && entry.kind !== filter.kind) return false;
  if (filter.actorKind !== undefined && entry.actorKind !== filter.actorKind) return false;
  if (filter.actorId !== undefined && entry.actorId !== filter.actorId) return false;
  if (filter.matterId !== undefined && entry.matterId !== filter.matterId) return false;
  if (filter.from !== undefined && compareDates(entry.on, filter.from) < 0) return false;
  if (filter.to !== undefined && compareDates(entry.on, filter.to) > 0) return false;
  if (filter.disclosureOnly === true && entry.disclosure === undefined) return false;
  if (filter.query !== undefined && filter.query.length > 0) {
    const needle = filter.query.toLowerCase();
    const haystack = [entry.summary, entry.detail ?? '', entry.actorId, entry.kind]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function auditView(
  records: FirmRecords,
  filter: AuditFilter,
  asOf: IsoDate,
): AuditView {
  const all = numberTrail(records, asOf);
  const visible = all.filter(({ entry }) => admits(entry, filter));
  // Newest first for reading; the sequence number preserves the written order.
  const ordered = [...visible].sort((a, b) => b.seq - a.seq);
  return {
    all,
    visible: ordered,
    suppressed: all.length - ordered.length,
    filter,
    facets: facetsOf(all),
  };
}

/** Trail entries for one matter, oldest first, as a case history reads. */
export function matterHistory(
  records: FirmRecords,
  matterId: string,
  asOf: IsoDate,
): NumberedAuditEntry[] {
  return numberTrail(records, asOf).filter(({ entry }) => entry.matterId === matterId);
}

/** True when a filter would remove anything at all. Drives the "filters active" affordance. */
export function filterIsActive(filter: AuditFilter): boolean {
  return (
    filter.kind !== undefined ||
    filter.actorKind !== undefined ||
    filter.actorId !== undefined ||
    filter.matterId !== undefined ||
    filter.from !== undefined ||
    filter.to !== undefined ||
    filter.disclosureOnly === true ||
    (filter.query !== undefined && filter.query.length > 0)
  );
}

/**
 * Read a filter out of URL search parameters.
 *
 * Unrecognised values are dropped rather than applied, so a hand-edited URL
 * cannot produce a view that silently shows nothing and looks like an empty
 * trail. Dates go through core's parser, so `?from=2026-02-30` is rejected here
 * exactly as it would be anywhere else in Meridian.
 */
export function filterFromParams(
  get: (key: string) => string | undefined,
): AuditFilter {
  const filter: {
    kind?: AuditEventKind;
    actorKind?: AuditActorKind;
    actorId?: string;
    matterId?: string;
    from?: IsoDate;
    to?: IsoDate;
    disclosureOnly?: boolean;
    query?: string;
  } = {};

  const kind = get('kind');
  if (kind !== undefined && (AUDIT_EVENT_KINDS as readonly string[]).includes(kind)) {
    filter.kind = kind as AuditEventKind;
  }

  const actorKind = get('actorKind');
  if (actorKind !== undefined && (AUDIT_ACTOR_KINDS as readonly string[]).includes(actorKind)) {
    filter.actorKind = actorKind as AuditActorKind;
  }

  const actorId = get('actor');
  if (actorId !== undefined && actorId.length > 0) filter.actorId = actorId;

  const matterId = get('matter');
  if (matterId !== undefined && matterId.length > 0) filter.matterId = matterId;

  const from = get('from');
  if (from !== undefined) {
    const parsed = tryIsoDate(from);
    if (parsed !== null) filter.from = parsed;
  }

  const to = get('to');
  if (to !== undefined) {
    const parsed = tryIsoDate(to);
    if (parsed !== null) filter.to = parsed;
  }

  if (get('disclosure') === '1') filter.disclosureOnly = true;

  const query = get('q');
  if (query !== undefined && query.trim().length > 0) filter.query = query.trim();

  return filter;
}
