/**
 * The in-memory adapter.
 *
 * This is not a test double. It is a complete implementation of every port,
 * used by the whole test suite and by local development, and the reason the test
 * suite is honest: every route, the auth chain, the disclosure gate and the audit
 * trail are exercised end to end with no database, so nothing is mocked out at
 * the exact layer a bug would hide in.
 *
 * It enforces the same invariant the Prisma adapter does, by the same means: a
 * repository is bound to one tenant at construction, every read filters on that
 * tenant, and every write stamps it. A cross-tenant read here returns `null` for
 * the same structural reason it returns zero rows in Postgres — the predicate is
 * not optional.
 *
 * Records are stored frozen and copied on write, so a caller that mutates a
 * returned object cannot corrupt the store. That matters more than it sounds:
 * the engines take readonly inputs, and a silently shared reference would make a
 * test pass for the wrong reason.
 */

import { err, ok, type Result } from '@meridian/core';
import type { Document } from '@meridian/documents';

import type {
  ApplicantPatch,
  ApplicantRecord,
  ApplicantRepository,
  AuditEventRecord,
  AuditQuery,
  AuditRepository,
  DocumentRecord,
  DocumentRepository,
  EvaluationRepository,
  HandoffRecord,
  HandoffRepository,
  MatterFilter,
  MatterPatch,
  MatterRecord,
  MatterRepository,
  NewApplicant,
  NewMatter,
  NewStay,
  NewTask,
  NewTenant,
  Page,
  PathwayEvaluationRecord,
  Repositories,
  RepositoryProvider,
  RepresentativeRecord,
  RepresentativeRepository,
  StayRecord,
  StayRepository,
  TaskPatch,
  TaskRecord,
  TaskRepository,
  TenantDirectory,
  TenantRecord,
} from './types.js';

interface Row {
  readonly tenantId: string;
}

/** Insertion order, so listings are stable without depending on a wall clock. */
interface Sequenced {
  readonly seq: number;
}

interface StoredTenant {
  readonly id: string;
  readonly kind: TenantRecord['kind'];
  readonly displayName: string;
  readonly homeJurisdiction: string;
}

type Stored<T> = T & Sequenced;

function page<T>(items: readonly T[], p: Page): T[] {
  return items.slice(p.offset, p.offset + p.limit);
}

/**
 * The shared store.
 *
 * Exported so a test can assert on what was persisted — in particular, the MRZ
 * test asserts that nothing at all was written, which is only checkable if the
 * store is inspectable.
 */
export class MemoryStore {
  private seq = 0;

  readonly tenants = new Map<string, StoredTenant>();
  readonly representatives = new Map<string, Stored<RepresentativeRecord & Row>>();
  readonly applicants = new Map<string, Stored<ApplicantRecord>>();
  readonly matters = new Map<string, Stored<MatterRecord>>();
  readonly tasks = new Map<string, Stored<TaskRecord>>();
  readonly documents = new Map<string, Stored<DocumentRecord>>();
  readonly stays = new Map<string, Stored<StayRecord>>();
  readonly evaluations = new Map<string, Stored<PathwayEvaluationRecord>>();
  readonly handoffs = new Map<string, Stored<HandoffRecord>>();
  readonly auditEvents = new Map<string, Stored<AuditEventRecord>>();

  next(): number {
    this.seq += 1;
    return this.seq;
  }

  /** Total rows across every case-data table. Used by the MRZ non-persistence test. */
  caseDataRowCount(): number {
    return (
      this.applicants.size +
      this.matters.size +
      this.tasks.size +
      this.documents.size +
      this.stays.size +
      this.evaluations.size +
      this.handoffs.size
    );
  }
}

function sortedBySeq<T extends Sequenced>(map: ReadonlyMap<string, T>, tenantId: string): T[] {
  const out: T[] = [];
  for (const value of map.values()) {
    if ((value as unknown as Row).tenantId === tenantId) out.push(value);
  }
  return out.sort((a, b) => a.seq - b.seq);
}

function stripSeq<T extends Sequenced>(value: T): Omit<T, 'seq'> {
  const { seq: _seq, ...rest } = value;
  return rest;
}

/**
 * Project a stored row onto the domain shape, dropping `tenantId` and `seq`.
 *
 * Explicit rather than a spread: a representative goes into API responses and
 * into `ReleaseContext`, and neither has any business carrying storage
 * bookkeeping. Listing the fields also means a new column cannot leak outward by
 * accident.
 */
function toRepresentative(row: RepresentativeRecord & Row): RepresentativeRecord {
  return {
    id: row.id,
    jurisdiction: row.jurisdiction,
    credential: row.credential,
    licenceNumber: row.licenceNumber,
    verifiedOn: row.verifiedOn,
    ...(row.expiresOn === undefined ? {} : { expiresOn: row.expiresOn }),
  };
}

class MemoryRepresentativeRepository implements RepresentativeRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async list(): Promise<RepresentativeRecord[]> {
    return sortedBySeq(this.store.representatives, this.tenantId).map(toRepresentative);
  }

  async get(id: string): Promise<RepresentativeRecord | null> {
    const found = this.store.representatives.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return toRepresentative(found);
  }

  async add(representative: RepresentativeRecord): Promise<RepresentativeRecord> {
    const row = Object.freeze({
      ...representative,
      tenantId: this.tenantId,
      seq: this.store.next(),
    });
    this.store.representatives.set(representative.id, row);
    return toRepresentative(row);
  }
}

class MemoryApplicantRepository implements ApplicantRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async list(p: Page): Promise<ApplicantRecord[]> {
    return page(sortedBySeq(this.store.applicants, this.tenantId), p).map(stripSeq);
  }

  async get(id: string): Promise<ApplicantRecord | null> {
    const found = this.store.applicants.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return stripSeq(found);
  }

  async create(input: NewApplicant): Promise<ApplicantRecord> {
    const row = Object.freeze({
      ...input,
      tenantId: this.tenantId,
      nationalities: [...input.nationalities],
      seq: this.store.next(),
    });
    this.store.applicants.set(input.id, row);
    return stripSeq(row);
  }

  async update(id: string, patch: ApplicantPatch): Promise<ApplicantRecord | null> {
    const found = this.store.applicants.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    const next = Object.freeze({
      ...found,
      ...definedOnly(patch),
      // tenantId is re-applied last so a patch can never move a row between
      // tenants, even if a future field name collides.
      tenantId: this.tenantId,
    });
    this.store.applicants.set(id, next);
    return stripSeq(next);
  }
}

class MemoryMatterRepository implements MatterRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async list(filter: MatterFilter, p: Page): Promise<MatterRecord[]> {
    const all = sortedBySeq(this.store.matters, this.tenantId).filter(
      (m) =>
        (filter.status === undefined || m.status === filter.status) &&
        (filter.phase === undefined || m.phase === filter.phase) &&
        (filter.applicantId === undefined || m.applicantId === filter.applicantId),
    );
    return page(all, p).map(stripSeq);
  }

  async get(id: string): Promise<MatterRecord | null> {
    const found = this.store.matters.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return stripSeq(found);
  }

  async create(input: NewMatter): Promise<MatterRecord> {
    const row = Object.freeze({
      ...input,
      tenantId: this.tenantId,
      seq: this.store.next(),
    });
    this.store.matters.set(input.id, row);
    return stripSeq(row);
  }

  async update(id: string, patch: MatterPatch): Promise<MatterRecord | null> {
    const found = this.store.matters.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    // `closedOn` is tri-state on the wire: absent means "leave it", `null` means
    // "reopen this matter", a date means "close it on that day". Folding null
    // into the generic patch would store a null where the domain expects an
    // absent optional, and every later `closedOn ?? …` would read it as set.
    const { closedOn, ...rest } = patch;
    const next: Stored<MatterRecord> = Object.freeze({
      ...found,
      ...definedOnly(rest),
      ...(closedOn === undefined ? {} : closedOn === null ? { closedOn: undefined } : { closedOn }),
      tenantId: this.tenantId,
    });
    this.store.matters.set(id, next);
    return stripSeq(next);
  }
}

class MemoryTaskRepository implements TaskRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string): Promise<TaskRecord[]> {
    return sortedBySeq(this.store.tasks, this.tenantId)
      .filter((t) => t.matterId === matterId)
      .map(stripSeq);
  }

  async get(id: string): Promise<TaskRecord | null> {
    const found = this.store.tasks.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return stripSeq(found);
  }

  async create(input: NewTask): Promise<TaskRecord> {
    const row = Object.freeze({
      ...input,
      dependsOn: [...input.dependsOn],
      citationIds: [...input.citationIds],
      tenantId: this.tenantId,
      seq: this.store.next(),
    });
    this.store.tasks.set(input.id, row);
    return stripSeq(row);
  }

  async update(id: string, patch: TaskPatch): Promise<TaskRecord | null> {
    const found = this.store.tasks.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    const { dueOn, ...rest } = patch;
    const next: Stored<TaskRecord> = Object.freeze({
      ...found,
      ...definedOnly(rest),
      ...(dueOn === undefined ? {} : dueOn === null ? { dueOn: undefined } : { dueOn }),
      tenantId: this.tenantId,
    });
    this.store.tasks.set(id, next);
    return stripSeq(next);
  }

  async applyStatuses(
    updates: readonly { readonly id: string; readonly status: TaskRecord['status'] }[],
  ): Promise<void> {
    for (const u of updates) {
      const found = this.store.tasks.get(u.id);
      if (found === undefined || found.tenantId !== this.tenantId) continue;
      if (found.status === u.status) continue;
      this.store.tasks.set(u.id, Object.freeze({ ...found, status: u.status }));
    }
  }
}

class MemoryDocumentRepository implements DocumentRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string): Promise<DocumentRecord[]> {
    return sortedBySeq(this.store.documents, this.tenantId)
      .filter((d) => d.matterId === matterId)
      .map(stripSeq);
  }

  async get(id: string): Promise<DocumentRecord | null> {
    const found = this.store.documents.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return stripSeq(found);
  }

  async create(matterId: string, document: Document): Promise<DocumentRecord> {
    const row = Object.freeze({
      ...document,
      matterId,
      tenantId: this.tenantId,
      seq: this.store.next(),
    });
    this.store.documents.set(document.id, row);
    return stripSeq(row);
  }

  async replace(document: DocumentRecord): Promise<DocumentRecord | null> {
    const found = this.store.documents.get(document.id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    const next = Object.freeze({
      ...document,
      tenantId: this.tenantId,
      matterId: found.matterId,
      seq: found.seq,
    });
    this.store.documents.set(document.id, next);
    return stripSeq(next);
  }
}

class MemoryStayRepository implements StayRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string): Promise<StayRecord[]> {
    return sortedBySeq(this.store.stays, this.tenantId)
      .filter((s) => s.matterId === matterId)
      .map(stripSeq);
  }

  async get(id: string): Promise<StayRecord | null> {
    const found = this.store.stays.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return stripSeq(found);
  }

  async createMany(inputs: readonly NewStay[]): Promise<StayRecord[]> {
    const created: StayRecord[] = [];
    for (const input of inputs) {
      const row = Object.freeze({ ...input, tenantId: this.tenantId, seq: this.store.next() });
      this.store.stays.set(input.id, row);
      created.push(stripSeq(row));
    }
    return created;
  }

  async remove(id: string): Promise<boolean> {
    const found = this.store.stays.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return false;
    this.store.stays.delete(id);
    return true;
  }
}

class MemoryEvaluationRepository implements EvaluationRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string, p: Page): Promise<PathwayEvaluationRecord[]> {
    const all = sortedBySeq(this.store.evaluations, this.tenantId)
      .filter((e) => e.matterId === matterId)
      .reverse();
    return page(all, p).map(stripSeq);
  }

  async append(record: PathwayEvaluationRecord): Promise<PathwayEvaluationRecord> {
    const row = Object.freeze({ ...record, tenantId: this.tenantId, seq: this.store.next() });
    this.store.evaluations.set(record.id, row);
    return stripSeq(row);
  }
}

class MemoryHandoffRepository implements HandoffRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async list(p: Page): Promise<HandoffRecord[]> {
    return page(sortedBySeq(this.store.handoffs, this.tenantId).reverse(), p).map(stripSeq);
  }

  async get(id: string): Promise<HandoffRecord | null> {
    const found = this.store.handoffs.get(id);
    if (found === undefined || found.tenantId !== this.tenantId) return null;
    return stripSeq(found);
  }

  async append(record: HandoffRecord): Promise<HandoffRecord> {
    const row = Object.freeze({ ...record, tenantId: this.tenantId, seq: this.store.next() });
    this.store.handoffs.set(record.id, row);
    return stripSeq(row);
  }
}

/** Append and read. Deliberately no way to change or remove a row. */
class MemoryAuditRepository implements AuditRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly tenantId: string,
  ) {}

  async append(event: AuditEventRecord): Promise<AuditEventRecord> {
    const row = Object.freeze({
      ...event,
      tenantId: this.tenantId,
      actorRoles: [...event.actorRoles],
      detail: Object.freeze({ ...event.detail }),
      seq: this.store.next(),
    });
    this.store.auditEvents.set(event.id, row);
    return stripSeq(row);
  }

  async list(query: AuditQuery): Promise<AuditEventRecord[]> {
    const all = sortedBySeq(this.store.auditEvents, this.tenantId)
      .filter(
        (e) =>
          (query.action === undefined || e.action === query.action) &&
          (query.targetType === undefined || e.targetType === query.targetType) &&
          (query.targetId === undefined || e.targetId === query.targetId),
      )
      // Newest first: an audit reader is almost always asking "what just
      // happened", and paginating from the oldest event of a busy tenant is a
      // useless default.
      .reverse();
    return page(all, query).map(stripSeq);
  }
}

class MemoryTenantDirectory implements TenantDirectory {
  constructor(private readonly store: MemoryStore) {}

  async get(id: string): Promise<TenantRecord | null> {
    const found = this.store.tenants.get(id);
    if (found === undefined) return null;
    const representatives = sortedBySeq(this.store.representatives, id).map(
      (r) => stripSeq(r) as RepresentativeRecord,
    );
    return {
      id: found.id,
      kind: found.kind,
      displayName: found.displayName,
      homeJurisdiction: found.homeJurisdiction,
      representatives,
    };
  }

  async create(input: NewTenant): Promise<TenantRecord> {
    this.store.tenants.set(input.id, Object.freeze({ ...input }));
    return {
      id: input.id,
      kind: input.kind,
      displayName: input.displayName,
      homeJurisdiction: input.homeJurisdiction,
      representatives: [],
    };
  }
}

class MemoryRepositories implements Repositories {
  readonly representatives: RepresentativeRepository;
  readonly applicants: ApplicantRepository;
  readonly matters: MatterRepository;
  readonly tasks: TaskRepository;
  readonly documents: DocumentRepository;
  readonly stays: StayRepository;
  readonly evaluations: EvaluationRepository;
  readonly handoffs: HandoffRepository;
  readonly audit: AuditRepository;

  constructor(
    store: MemoryStore,
    readonly tenantId: string,
  ) {
    this.representatives = new MemoryRepresentativeRepository(store, tenantId);
    this.applicants = new MemoryApplicantRepository(store, tenantId);
    this.matters = new MemoryMatterRepository(store, tenantId);
    this.tasks = new MemoryTaskRepository(store, tenantId);
    this.documents = new MemoryDocumentRepository(store, tenantId);
    this.stays = new MemoryStayRepository(store, tenantId);
    this.evaluations = new MemoryEvaluationRepository(store, tenantId);
    this.handoffs = new MemoryHandoffRepository(store, tenantId);
    this.audit = new MemoryAuditRepository(store, tenantId);
  }
}

export interface MemoryProviderOptions {
  /**
   * Makes {@link RepositoryProvider.checkHealth} fail.
   *
   * Readiness has to be testable, and a readiness probe nobody has ever seen
   * fail is a readiness probe that reports ready when the database is gone.
   */
  readonly healthy?: boolean;
  readonly unhealthyReason?: string;
}

export class InMemoryRepositoryProvider implements RepositoryProvider {
  readonly kind = 'memory' as const;
  readonly tenants: TenantDirectory;
  readonly store: MemoryStore;

  private healthy: boolean;
  private unhealthyReason: string;

  constructor(options: MemoryProviderOptions = {}) {
    this.store = new MemoryStore();
    this.tenants = new MemoryTenantDirectory(this.store);
    this.healthy = options.healthy ?? true;
    this.unhealthyReason = options.unhealthyReason ?? 'in-memory store marked unavailable';
  }

  forTenant(tenantId: string): Repositories {
    return new MemoryRepositories(this.store, tenantId);
  }

  /** Flip health at runtime so a test can take the dependency down mid-suite. */
  setHealthy(healthy: boolean, reason?: string): void {
    this.healthy = healthy;
    if (reason !== undefined) this.unhealthyReason = reason;
  }

  async checkHealth(): Promise<Result<void, Error>> {
    return this.healthy ? ok(undefined) : err(new Error(this.unhealthyReason));
  }

  async close(): Promise<void> {
    // Nothing to release. Present because the port requires it and a provider
    // that cannot be closed would force every caller to special-case it.
  }
}

/**
 * Drop keys whose value is `undefined`.
 *
 * A patch built from a JSON body has `undefined` for every field the client did
 * not send. Spreading it raw would overwrite stored values with `undefined` —
 * silently clearing a matter's representative because the client sent a status
 * change is precisely the kind of quiet data loss that shows up as an advice
 * boundary failure three weeks later.
 */
function definedOnly<T extends object>(patch: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<T>;
}
