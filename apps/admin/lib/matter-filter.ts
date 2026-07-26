/**
 * Matter list filtering.
 *
 * Filters live entirely in the query string. That is not a shortcut around
 * client state — it is the property that makes a filtered view *sendable*. A
 * practitioner who finds the three files blocked on a lapsed credential can
 * paste the URL to a colleague and the colleague sees the same three files, on
 * the same reference date. A filter held in component state produces a screen
 * that only exists for the person looking at it.
 *
 * Unrecognised values are dropped rather than applied. A hand-edited or stale
 * URL that named a phase which no longer exists would otherwise render an empty
 * table that is indistinguishable from an empty caseload.
 */

import {
  MATTER_PHASE_ORDER,
  isTerminal,
  type CountryCode,
  type MatterPhase,
  type MatterStatus,
} from '@meridian/core';
import { MATTER_STATUS_ORDER } from '@/lib/caseload';
import { findApplicant, type FirmRecords, type MatterRecord } from '@/lib/records';

export type OpenState = 'live' | 'closed';

export interface MatterFilter {
  readonly phase?: MatterPhase;
  readonly status?: MatterStatus;
  readonly jurisdiction?: CountryCode;
  readonly representativeId?: string;
  /** `unassigned` is a real filter value, not the absence of one. */
  readonly unassigned?: boolean;
  readonly openState?: OpenState;
  readonly query?: string;
}

export function matterFilterFromParams(
  get: (key: string) => string | undefined,
): MatterFilter {
  const filter: {
    phase?: MatterPhase;
    status?: MatterStatus;
    jurisdiction?: CountryCode;
    representativeId?: string;
    unassigned?: boolean;
    openState?: OpenState;
    query?: string;
  } = {};

  const phase = get('phase');
  if (phase !== undefined && (MATTER_PHASE_ORDER as readonly string[]).includes(phase)) {
    filter.phase = phase as MatterPhase;
  }

  const status = get('status');
  if (status !== undefined && (MATTER_STATUS_ORDER as readonly string[]).includes(status)) {
    filter.status = status as MatterStatus;
  }

  const jurisdiction = get('jurisdiction');
  if (jurisdiction !== undefined && /^[A-Za-z]{2}$/.test(jurisdiction)) {
    filter.jurisdiction = jurisdiction.toUpperCase() as CountryCode;
  }

  const rep = get('rep');
  if (rep === 'unassigned') filter.unassigned = true;
  else if (rep !== undefined && rep.length > 0) filter.representativeId = rep;

  const openState = get('state');
  if (openState === 'live' || openState === 'closed') filter.openState = openState;

  const query = get('q');
  if (query !== undefined && query.trim().length > 0) filter.query = query.trim();

  return filter;
}

export function matterFilterIsActive(filter: MatterFilter): boolean {
  return (
    filter.phase !== undefined ||
    filter.status !== undefined ||
    filter.jurisdiction !== undefined ||
    filter.representativeId !== undefined ||
    filter.unassigned === true ||
    filter.openState !== undefined ||
    filter.query !== undefined
  );
}

/** Round-trips a filter back to search parameters, for links that keep it. */
export function matterFilterToParams(filter: MatterFilter): Record<string, string | undefined> {
  return {
    phase: filter.phase,
    status: filter.status,
    jurisdiction: filter.jurisdiction,
    rep: filter.unassigned === true ? 'unassigned' : filter.representativeId,
    state: filter.openState,
    q: filter.query,
  };
}

/**
 * The searchable text of one matter.
 *
 * Built from the record's own fields rather than from `applicantName`, which now
 * takes a locale so that a *missing* applicant reads correctly in the reader's
 * language. That is right for display and wrong here: a search index whose
 * contents change with the interface language would make the same query return
 * different matters to two colleagues, and "Unknown applicant" is not something
 * anybody searches for. A person's name is the same string in both locales, so
 * reading the fields directly loses nothing.
 */
function haystackFor(records: FirmRecords, record: MatterRecord): string {
  const applicant = findApplicant(records, record.matter.applicantId);
  return [
    record.reference,
    record.title,
    record.matter.id,
    record.matter.pathwayId,
    record.matter.targetJurisdiction,
    record.matter.claimedNationality,
    applicant === null ? '' : `${applicant.familyName} ${applicant.givenNames} ${applicant.reference}`,
  ]
    .join(' ')
    .toLowerCase();
}

export function applyMatterFilter(
  records: FirmRecords,
  filter: MatterFilter,
): MatterRecord[] {
  return records.matters.filter((record) => {
    const { matter } = record;
    if (filter.phase !== undefined && matter.phase !== filter.phase) return false;
    if (filter.status !== undefined && matter.status !== filter.status) return false;
    if (filter.jurisdiction !== undefined && matter.targetJurisdiction !== filter.jurisdiction) {
      return false;
    }
    if (filter.unassigned === true && matter.representativeId !== null) return false;
    if (
      filter.representativeId !== undefined &&
      matter.representativeId !== filter.representativeId
    ) {
      return false;
    }
    if (filter.openState === 'live' && isTerminal(matter.status)) return false;
    if (filter.openState === 'closed' && !isTerminal(matter.status)) return false;
    if (filter.query !== undefined) {
      if (!haystackFor(records, record).includes(filter.query.toLowerCase())) return false;
    }
    return true;
  });
}

/**
 * Sort order: live work first, then by phase position, then by reference.
 *
 * Deliberately not "most urgent first". Ordering a list of options by how urgent
 * the software thinks they are is a ranking, and ranking is the thing the advice
 * boundary reserves. The time-critical view on the caseload page is a *filter*
 * on a stated threshold, which is a different act — it shows everything past a
 * published line rather than deciding which file matters most.
 */
export function orderMatters(matters: readonly MatterRecord[]): MatterRecord[] {
  return [...matters].sort((a, b) => {
    const aLive = isTerminal(a.matter.status) ? 1 : 0;
    const bLive = isTerminal(b.matter.status) ? 1 : 0;
    if (aLive !== bLive) return aLive - bLive;
    const byPhase =
      MATTER_PHASE_ORDER.indexOf(a.matter.phase) - MATTER_PHASE_ORDER.indexOf(b.matter.phase);
    if (byPhase !== 0) return byPhase;
    return a.reference < b.reference ? -1 : a.reference > b.reference ? 1 : 0;
  });
}

/** Jurisdictions present in the record set, so the filter offers only real options. */
export function jurisdictionsIn(records: FirmRecords): string[] {
  return [...new Set(records.matters.map((m) => m.matter.targetJurisdiction))].sort();
}
