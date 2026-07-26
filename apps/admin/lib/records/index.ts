/**
 * The read side of the record store.
 *
 * There is no write side, and that is the point for the audit trail: the trail
 * is append-only because this module exposes no way to append to it, edit it, or
 * remove from it. When this console is wired to `apps/api` the same shape holds
 * — `loadRecords` becomes a query and every consumer below it is unchanged.
 *
 * The tenant is *built* from the roster rather than declared alongside it, so
 * `representativeFor(tenant, …)` and the roster page can never disagree about
 * who is on the books.
 */

import { audienceFor, type Audience, type Tenant } from '@meridian/core';
import type { Locale } from '@/lib/i18n';
import { UI, pick } from '@/lib/i18n';
import { DATASETS, isDatasetId, type DatasetId } from '@/lib/records/dataset';
import type {
  ApplicantRecord,
  AuditRecord,
  FirmRecords,
  MatterRecord,
  RepresentativeRecord,
} from '@/lib/records/types';

export type {
  ApplicantRecord,
  AuditActorKind,
  AuditDisclosure,
  AuditEventKind,
  AuditRecord,
  FirmRecords,
  MatterRecord,
  RepresentativeRecord,
} from '@/lib/records/types';
export { DATASET_IDS, auditDateBounds } from '@/lib/records/dataset';
export type { DatasetId } from '@/lib/records/dataset';

/**
 * Which dataset the console is serving.
 *
 * An unrecognised `MERIDIAN_ADMIN_DATASET` falls back to `working` rather than
 * failing the render — but the fallback is visible, because `FirmRecords`
 * carries its own `datasetId` and the shell prints it.
 */
export function activeDatasetId(): DatasetId {
  const raw = process.env.MERIDIAN_ADMIN_DATASET?.trim();
  if (raw !== undefined && raw.length > 0 && isDatasetId(raw)) return raw;
  return 'working';
}

export function loadRecords(): FirmRecords {
  return DATASETS[activeDatasetId()];
}

/**
 * The tenant as `@meridian/core` sees it.
 *
 * `kind` is `'firm'`, which is what makes `audienceFor` resolve to
 * `'practitioner'` — and that, in turn, is why advice is releasable in this
 * console at all. It is worth stating out loud: the firm console is not a
 * relaxed version of the applicant portal, it is a *different audience* under
 * the same gate.
 */
export function firmTenant(records: FirmRecords): Tenant {
  return {
    id: records.tenantId,
    kind: 'firm',
    displayName: records.tenantDisplayName,
    homeJurisdiction: records.homeJurisdiction,
    representatives: records.representatives.map((r) => r.credential),
  };
}

/** The audience this console renders for. Derived, never hard-coded at a call site. */
export function consoleAudience(records: FirmRecords): Audience {
  return audienceFor(firmTenant(records).kind);
}

export function findMatter(records: FirmRecords, matterId: string): MatterRecord | null {
  return records.matters.find((m) => m.matter.id === matterId) ?? null;
}

export function findApplicant(records: FirmRecords, applicantId: string): ApplicantRecord | null {
  return records.applicants.find((a) => a.id === applicantId) ?? null;
}

export function findRepresentative(
  records: FirmRecords,
  representativeId: string | null,
): RepresentativeRecord | null {
  if (representativeId === null) return null;
  return records.representatives.find((r) => r.credential.id === representativeId) ?? null;
}

/**
 * `Rivas Peredo, Camila` — family name first, because that is how a file is
 * filed.
 *
 * A person's name is never translated or reordered per locale. Only the *absence*
 * of one is console copy, which is the whole reason this takes a locale: an
 * English "Unknown applicant" sitting in a Spanish table is a seam, and it
 * appears exactly where a record is missing, which is where a reader most needs
 * to understand what they are looking at.
 */
export function applicantName(applicant: ApplicantRecord | null, locale: Locale): string {
  if (applicant === null) return pick(UI.applicantUnknown, locale);
  return `${applicant.familyName}, ${applicant.givenNames}`;
}

/**
 * The trail in a stable, total order: date, then wall-clock time, then id.
 *
 * The id tiebreak matters. Two entries recorded in the same minute would
 * otherwise sort differently between renders, and an audit trail whose order
 * changes when you reload it is not evidence of anything.
 */
export function auditInOrder(records: FirmRecords): readonly AuditRecord[] {
  return [...records.audit].sort((a, b) => {
    if (a.on !== b.on) return a.on < b.on ? -1 : 1;
    if (a.at !== b.at) return a.at < b.at ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
