/**
 * The ports.
 *
 * **Tenant scoping is structural, not remembered.** There is no method on any
 * interface in this file that accepts a tenant id. A repository is obtained from
 * {@link RepositoryProvider.forTenant} with the id taken from a verified token,
 * and every query it issues carries that id in its predicate. A handler
 * therefore *cannot* read another tenant's row by forgetting a `where` clause,
 * because there is no call it could make that would.
 *
 * This is the difference between a convention and a defence. Convention says
 * "always filter by tenantId"; it survives until the third urgent fix at the end
 * of a quarter. The compiler saying "there is no such parameter" survives
 * indefinitely.
 *
 * **`AuditRepository` has `append` and `list`. That is the whole interface.**
 * No update, no delete, no upsert — not "we do not call them", but they do not
 * exist to be called. A trail that can be edited is not evidence of anything.
 *
 * The domain record types are re-exports of the domain packages' own shapes
 * wherever one exists (`Matter`, `Task`, `Document`, `Tenant`), so a row read out
 * of Postgres and a value handed to the engine are the same type and there is no
 * translation layer to drift.
 */

import type {
  AuthorizedRepresentative,
  CountryCode,
  DisclosureClass,
  IsoDate,
  Matter,
  MatterPhase,
  MatterStatus,
  Result,
  Task,
  TaskStatus,
  Tenant,
  TenantKind,
} from '@meridian/core';
import type { Document } from '@meridian/documents';
import type { PresenceConfidence, PresenceSource } from '@meridian/presence';

export type TenantRecord = Tenant;
export type RepresentativeRecord = AuthorizedRepresentative;
export type MatterRecord = Matter;

/** A `Task` with the tenant it belongs to, which core's `Task` does not carry. */
export interface TaskRecord extends Task {
  readonly tenantId: string;
}

/** A `Document` bound to a matter and a tenant. */
export interface DocumentRecord extends Document {
  readonly tenantId: string;
  readonly matterId: string;
}

/**
 * The applicant.
 *
 * `givenNames` and `familyNames` are personal data and optional: a firm that
 * keeps names in its own practice-management system should not be forced to
 * duplicate them here. They never appear in an audit event and are redacted from
 * every log line.
 */
export interface ApplicantRecord {
  readonly id: string;
  readonly tenantId: string;
  /** Caseworker-facing file reference. */
  readonly reference?: string;
  readonly givenNames?: string;
  readonly familyNames?: string;
  readonly nationalities: readonly CountryCode[];
  readonly claimedNationality?: CountryCode;
  readonly dateOfBirth?: IsoDate;
}

/**
 * One row of the presence ledger.
 *
 * `end` is `null` for a stay that has not ended. It stays null in storage: the
 * engine closes an open stay at an explicitly supplied date and flags the result
 * `openEnded`, and writing that imputed date back into the record would launder
 * a guess into a fact.
 */
export interface StayRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly matterId: string;
  readonly country: CountryCode;
  /** Inclusive first day of presence. */
  readonly start: IsoDate;
  /** Inclusive last day of presence, or `null` while the stay is open. */
  readonly end: IsoDate | null;
  readonly source: PresenceSource;
  readonly confidence: PresenceConfidence;
  /** True only for days in the State that issued the traveller's own permit. */
  readonly exemptFromSchengenShortStay: boolean;
}

export type EligibilityVerdict =
  | 'eligible'
  | 'ineligible'
  | 'indeterminate'
  | 'requires_human_review';

/**
 * A stored eligibility report.
 *
 * `pathwayVersion` sits beside `pathwayId` because the catalog is versioned and
 * the law moves. An assessment produced under last quarter's rules has to stay
 * explicable after the rules change, and "which version said that" is the first
 * question anyone asks.
 */
export interface PathwayEvaluationRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly matterId: string;
  readonly pathwayId: string;
  readonly pathwayVersion: string;
  readonly asOf: IsoDate;
  readonly verdict: EligibilityVerdict;
  /** What the disclosure gate produced, which is not always what the engine produced. */
  readonly classification: DisclosureClass;
  readonly released: boolean;
  readonly report: unknown;
  readonly createdAt: string;
}

export interface HandoffRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly matterId: string | null;
  readonly adapterId: string;
  readonly capabilityId: string | null;
  readonly title: string;
  readonly destinationUrl: string;
  readonly classification: DisclosureClass;
  readonly generatedOn: IsoDate;
  readonly payload: unknown;
  readonly createdAt: string;
}

export type AuditOutcome = 'success' | 'refused' | 'failure';

/** Flat scalars only — see {@link AuditEventRecord.detail}. */
export type AuditDetail = Readonly<Record<string, string | number | boolean | null>>;

export interface AuditEventRecord {
  readonly id: string;
  readonly tenantId: string;
  /** ISO 8601 instant. The one place in this service where an instant, not a civil date, is right. */
  readonly occurredAt: string;
  readonly actorUserId: string;
  readonly actorRoles: readonly string[];
  /** Dotted verb: `matter.phase.advanced`, `disclosure.downgraded`. */
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string | null;
  /** What the actor was actually shown. The question a regulator asks. */
  readonly disclosureClass: DisclosureClass | null;
  readonly outcome: AuditOutcome;
  /**
   * Flat map of scalars. Not nested JSON, and the shallowness is a containment
   * rule rather than a style choice: it makes it structurally impossible to
   * smuggle an engine payload, an MRZ, or a document number into the trail as an
   * opaque blob.
   */
  readonly detail: AuditDetail;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface NewTenant {
  readonly id: string;
  readonly kind: TenantKind;
  readonly displayName: string;
  readonly homeJurisdiction: string;
}

export interface NewApplicant {
  readonly id: string;
  readonly reference?: string;
  readonly givenNames?: string;
  readonly familyNames?: string;
  readonly nationalities: readonly CountryCode[];
  readonly claimedNationality?: CountryCode;
  readonly dateOfBirth?: IsoDate;
}

export interface ApplicantPatch {
  readonly reference?: string;
  readonly givenNames?: string;
  readonly familyNames?: string;
  readonly nationalities?: readonly CountryCode[];
  readonly claimedNationality?: CountryCode;
  readonly dateOfBirth?: IsoDate;
}

export interface NewMatter {
  readonly id: string;
  readonly applicantId: string;
  readonly pathwayId: string;
  readonly targetJurisdiction: CountryCode;
  readonly claimedNationality: CountryCode;
  readonly status: MatterStatus;
  readonly phase: MatterPhase;
  readonly openedOn: IsoDate;
  readonly representativeId: string | null;
}

export interface MatterPatch {
  readonly status?: MatterStatus;
  readonly phase?: MatterPhase;
  readonly representativeId?: string | null;
  readonly closedOn?: IsoDate | null;
}

export interface MatterFilter {
  readonly status?: MatterStatus;
  readonly phase?: MatterPhase;
  readonly applicantId?: string;
}

export interface NewTask {
  readonly id: string;
  readonly matterId: string;
  readonly phase: MatterPhase;
  readonly title: string;
  readonly assignee: Task['assignee'];
  readonly dependsOn: readonly string[];
  readonly status: TaskStatus;
  readonly dueOn?: IsoDate;
  readonly citationIds: readonly string[];
}

export interface TaskPatch {
  readonly status?: TaskStatus;
  readonly dueOn?: IsoDate | null;
  readonly title?: string;
}

export interface NewStay {
  readonly id: string;
  readonly matterId: string;
  readonly country: CountryCode;
  readonly start: IsoDate;
  readonly end: IsoDate | null;
  readonly source: PresenceSource;
  readonly confidence: PresenceConfidence;
  readonly exemptFromSchengenShortStay: boolean;
}

export interface AuditQuery {
  readonly action?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface Page {
  readonly limit: number;
  readonly offset: number;
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

export interface RepresentativeRepository {
  list(): Promise<RepresentativeRecord[]>;
  get(id: string): Promise<RepresentativeRecord | null>;
  add(representative: RepresentativeRecord): Promise<RepresentativeRecord>;
}

export interface ApplicantRepository {
  list(page: Page): Promise<ApplicantRecord[]>;
  get(id: string): Promise<ApplicantRecord | null>;
  create(input: NewApplicant): Promise<ApplicantRecord>;
  /** `null` when no row in *this tenant* has that id. Never another tenant's row. */
  update(id: string, patch: ApplicantPatch): Promise<ApplicantRecord | null>;
}

export interface MatterRepository {
  list(filter: MatterFilter, page: Page): Promise<MatterRecord[]>;
  get(id: string): Promise<MatterRecord | null>;
  create(input: NewMatter): Promise<MatterRecord>;
  update(id: string, patch: MatterPatch): Promise<MatterRecord | null>;
}

export interface TaskRepository {
  listForMatter(matterId: string): Promise<TaskRecord[]>;
  get(id: string): Promise<TaskRecord | null>;
  create(input: NewTask): Promise<TaskRecord>;
  update(id: string, patch: TaskPatch): Promise<TaskRecord | null>;
  /** Persist a recomputed unlock pass. Only statuses move. */
  applyStatuses(updates: readonly { readonly id: string; readonly status: TaskStatus }[]): Promise<void>;
}

export interface DocumentRepository {
  listForMatter(matterId: string): Promise<DocumentRecord[]>;
  get(id: string): Promise<DocumentRecord | null>;
  create(matterId: string, document: Document): Promise<DocumentRecord>;
  replace(document: DocumentRecord): Promise<DocumentRecord | null>;
}

export interface StayRepository {
  listForMatter(matterId: string): Promise<StayRecord[]>;
  get(id: string): Promise<StayRecord | null>;
  createMany(inputs: readonly NewStay[]): Promise<StayRecord[]>;
  /** Correcting a mis-recorded stay is legitimate; the deletion is audited. */
  remove(id: string): Promise<boolean>;
}

export interface EvaluationRepository {
  listForMatter(matterId: string, page: Page): Promise<PathwayEvaluationRecord[]>;
  append(record: PathwayEvaluationRecord): Promise<PathwayEvaluationRecord>;
}

export interface HandoffRepository {
  list(page: Page): Promise<HandoffRecord[]>;
  get(id: string): Promise<HandoffRecord | null>;
  append(record: HandoffRecord): Promise<HandoffRecord>;
}

/**
 * Append and read. There is deliberately no third method.
 *
 * If a retention policy ever requires deletion, it belongs in a separate,
 * separately-authorised administrative path with its own trail — not as a method
 * on the interface every route already holds.
 */
export interface AuditRepository {
  append(event: AuditEventRecord): Promise<AuditEventRecord>;
  list(query: AuditQuery): Promise<AuditEventRecord[]>;
}

/** Everything a request can touch, already bound to one tenant. */
export interface Repositories {
  /** The tenant these repositories are bound to. Read-only; nothing can change it. */
  readonly tenantId: string;
  readonly representatives: RepresentativeRepository;
  readonly applicants: ApplicantRepository;
  readonly matters: MatterRepository;
  readonly tasks: TaskRepository;
  readonly documents: DocumentRepository;
  readonly stays: StayRepository;
  readonly evaluations: EvaluationRepository;
  readonly handoffs: HandoffRepository;
  readonly audit: AuditRepository;
}

/**
 * Reads and creates tenants themselves.
 *
 * Necessarily not tenant-scoped — something has to resolve the id in a token
 * into a tenant. It is kept to two methods and named so that its privilege is
 * obvious at every call site, and `get` returns exactly the one tenant asked
 * for: there is no "list all tenants".
 */
export interface TenantDirectory {
  get(id: string): Promise<TenantRecord | null>;
  create(input: NewTenant): Promise<TenantRecord>;
}

export interface RepositoryProvider {
  /** For the readiness report, which must say which backing store it checked. */
  readonly kind: 'memory' | 'prisma';
  readonly tenants: TenantDirectory;
  forTenant(tenantId: string): Repositories;
  /** Readiness: can this store actually be reached right now? */
  checkHealth(): Promise<Result<void, Error>>;
  close(): Promise<void>;
}
