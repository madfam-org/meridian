/**
 * The Postgres adapter.
 *
 * Every method here is real: it issues the query, maps the row, and returns the
 * domain record. There is no branch that returns fixture data and no method that
 * throws "not implemented" — the in-memory adapter exists so that tests need no
 * database, not so that this one can be a sketch.
 *
 * Two properties are worth reading the code for.
 *
 * **The tenant predicate is in the statement, always.** Every repository holds
 * `tenantId` from construction and puts it in `where`. Updates go through
 * `updateMany({ where: { id, tenantId } })` rather than `update({ where: { id }})`,
 * because Prisma's single-row `update` only accepts a unique selector and would
 * force the ownership check up into application code. Doing it in SQL means an
 * update aimed at another tenant's row matches zero rows and says so, with no
 * read-then-write race in between.
 *
 * **Rows are validated on the way out, not trusted.** `@db.Char(10)` accepts
 * `2025-02-30`; core's `isoDate` does not. A malformed civil date reaching the
 * day-counting engines would produce a wrong number rather than an error, so it
 * is rejected here, at the boundary, with the column named.
 */

import {
  MeridianError,
  err,
  isoDate,
  ok,
  type CountryCode,
  type DisclosureClass,
  type IsoDate,
  type MatterPhase,
  type MatterStatus,
  type Result,
  type TaskAssignee,
  type TaskStatus,
  type TenantKind,
} from '@meridian/core';
import type {
  Document,
  DocumentKind,
  DocumentStatus,
  LegalisationRoute,
  TranslatorStandard,
} from '@meridian/documents';
import { languageTag } from '@meridian/documents';
import type { PresenceConfidence, PresenceSource } from '@meridian/presence';

import type {
  ApplicantRow,
  AuditEventRow,
  DocumentRow,
  GovTechHandoffRow,
  MatterRow,
  MeridianPrismaClient,
  PathwayEvaluationRow,
  RepresentativeRow,
  StayRow,
  TaskRow,
  TenantRow,
} from './prisma-client.js';
import type {
  ApplicantPatch,
  ApplicantRecord,
  ApplicantRepository,
  AuditEventRecord,
  AuditOutcome,
  AuditQuery,
  AuditRepository,
  DocumentRecord,
  DocumentRepository,
  EligibilityVerdict,
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

// ---------------------------------------------------------------------------
// Column decoding
// ---------------------------------------------------------------------------

function invalidColumn(column: string, reason: string): MeridianError {
  // The value is deliberately not included: rows carry personal data and this
  // message reaches logs.
  return new MeridianError('INVALID_INPUT', `stored column ${column} is unusable: ${reason}`, {
    column,
  });
}

/** A civil date column. Rejects text that fits the column but is not a date. */
function civil(value: string, column: string): IsoDate {
  try {
    return isoDate(value);
  } catch {
    throw invalidColumn(column, 'not a valid YYYY-MM-DD calendar date');
  }
}

function civilOrNull(value: string | null, column: string): IsoDate | null {
  return value === null ? null : civil(value, column);
}

/**
 * Narrow an enum column against the set the code knows.
 *
 * Postgres will not store a value outside the type, but it will happily store
 * one this build has never heard of after a migration that adds a variant and a
 * deploy that lags it. Failing here names the column; casting would let the
 * unknown value flow into a `switch` that silently falls through.
 */
function oneOf<T extends string>(value: string, allowed: readonly T[], column: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw invalidColumn(column, `unrecognised enum value (build knows ${allowed.length} variants)`);
}

function country(value: string, column: string): CountryCode {
  if (!/^[A-Z]{2}$/.test(value)) throw invalidColumn(column, 'not an ISO 3166-1 alpha-2 code');
  return value as CountryCode;
}

const TENANT_KINDS: readonly TenantKind[] = ['firm', 'individual', 'corporate', 'madfam_represented'];
const MATTER_STATUSES: readonly MatterStatus[] = [
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
const MATTER_PHASES: readonly MatterPhase[] = [
  'intake',
  'identity_validation',
  'document_assembly',
  'submission',
  'post_arrival_tracking',
  'status_transition',
];
const TASK_ASSIGNEES: readonly TaskAssignee[] = [
  'applicant',
  'representative',
  'employer',
  'platform',
  'authority',
];
const TASK_STATUSES: readonly TaskStatus[] = [
  'locked',
  'available',
  'in_progress',
  'submitted',
  'complete',
  'waived',
];
const DOCUMENT_KIND_VALUES: readonly DocumentKind[] = [
  'passport',
  'national_id',
  'birth_certificate',
  'marriage_certificate',
  'criminal_record',
  'proof_of_income',
  'proof_of_accommodation',
  'health_insurance',
  'degree_certificate',
  'academic_transcript',
  'professional_licence',
  'employment_offer',
  'employment_contract',
  'cv',
  'photograph',
  'application_form',
  'payment_receipt',
  'biometrics_confirmation',
  'prior_visa',
  'travel_itinerary',
];
const DOCUMENT_STATUS_VALUES: readonly DocumentStatus[] = [
  'required',
  'provided',
  'under_review',
  'accepted',
  'rejected',
  'expired',
];
const LEGALISATION_ROUTES: readonly LegalisationRoute[] = ['none', 'apostille', 'consular', 'unknown'];
const TRANSLATOR_STANDARDS: readonly TranslatorStandard[] = [
  'none',
  'sworn_traductor_jurado',
  'certified_translator',
  'affidavit_translation',
  'perito_traductor',
  'translator_certification',
  'unknown',
];
const PRESENCE_SOURCES: readonly PresenceSource[] = [
  'border_stamp',
  'gps',
  'declared',
  'itinerary',
  'inferred',
];
const PRESENCE_CONFIDENCES: readonly PresenceConfidence[] = ['confirmed', 'probable', 'assumed'];
const DISCLOSURE_CLASSES: readonly DisclosureClass[] = ['information', 'assessment', 'advice'];
const VERDICTS: readonly EligibilityVerdict[] = [
  'eligible',
  'ineligible',
  'indeterminate',
  'requires_human_review',
];
const AUDIT_OUTCOMES: readonly AuditOutcome[] = ['success', 'refused', 'failure'];

const REPRESENTATIVE_CREDENTIALS: readonly RepresentativeRecord['credential'][] = [
  'rcic',
  'canadian_lawyer',
  'canadian_paralegal',
  'quebec_notary',
  'spanish_abogado',
  'spanish_gestor',
  'other_regulated',
];

// ---------------------------------------------------------------------------
// Row -> domain
// ---------------------------------------------------------------------------

function toRepresentative(row: RepresentativeRow): RepresentativeRecord {
  return {
    id: row.id,
    jurisdiction: row.jurisdiction,
    credential: oneOf(row.credential, REPRESENTATIVE_CREDENTIALS, 'representative.credential'),
    licenceNumber: row.licenceNumber,
    verifiedOn: civil(row.verifiedOn, 'representative.verifiedOn'),
    ...(row.expiresOn === null
      ? {}
      : { expiresOn: civil(row.expiresOn, 'representative.expiresOn') }),
  };
}

function toTenant(row: TenantRow, representatives: readonly RepresentativeRecord[]): TenantRecord {
  return {
    id: row.id,
    kind: oneOf(row.kind, TENANT_KINDS, 'tenant.kind'),
    displayName: row.displayName,
    homeJurisdiction: row.homeJurisdiction,
    representatives,
  };
}

function toApplicant(row: ApplicantRow): ApplicantRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ...(row.reference === null ? {} : { reference: row.reference }),
    ...(row.givenNames === null ? {} : { givenNames: row.givenNames }),
    ...(row.familyNames === null ? {} : { familyNames: row.familyNames }),
    nationalities: row.nationalities.map((n, i) => country(n, `applicant.nationalities[${i}]`)),
    ...(row.claimedNationality === null
      ? {}
      : { claimedNationality: country(row.claimedNationality, 'applicant.claimedNationality') }),
    ...(row.dateOfBirth === null
      ? {}
      : { dateOfBirth: civil(row.dateOfBirth, 'applicant.dateOfBirth') }),
  };
}

function toMatter(row: MatterRow): MatterRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    applicantId: row.applicantId,
    pathwayId: row.pathwayId,
    targetJurisdiction: country(row.targetJurisdiction, 'matter.targetJurisdiction'),
    claimedNationality: country(row.claimedNationality, 'matter.claimedNationality'),
    status: oneOf(row.status, MATTER_STATUSES, 'matter.status'),
    phase: oneOf(row.phase, MATTER_PHASES, 'matter.phase'),
    openedOn: civil(row.openedOn, 'matter.openedOn'),
    representativeId: row.representativeId,
    ...(row.closedOn === null ? {} : { closedOn: civil(row.closedOn, 'matter.closedOn') }),
  };
}

function toTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    matterId: row.matterId,
    phase: oneOf(row.phase, MATTER_PHASES, 'task.phase'),
    title: row.title,
    assignee: oneOf(row.assignee, TASK_ASSIGNEES, 'task.assignee'),
    dependsOn: [...row.dependsOn],
    status: oneOf(row.status, TASK_STATUSES, 'task.status'),
    citationIds: [...row.citationIds],
    ...(row.dueOn === null ? {} : { dueOn: civil(row.dueOn, 'task.dueOn') }),
  };
}

function toDocument(row: DocumentRow): DocumentRecord {
  const legalisation = {
    route:
      row.legalisationRoute === null
        ? null
        : oneOf(row.legalisationRoute, LEGALISATION_ROUTES, 'document.legalisationRoute'),
    ...(row.legalisationDate === null
      ? {}
      : { completedOn: civil(row.legalisationDate, 'document.legalisationDate') }),
    ...(row.legalisationReference === null ? {} : { reference: row.legalisationReference }),
  };
  const translation = {
    sourceLanguage: languageTag(row.sourceLanguage),
    ...(row.translationLanguage === null
      ? {}
      : { intoLanguage: languageTag(row.translationLanguage) }),
    ...(row.translatorStandard === null
      ? {}
      : {
          standard: oneOf(row.translatorStandard, TRANSLATOR_STANDARDS, 'document.translatorStandard'),
        }),
    ...(row.translationDate === null
      ? {}
      : { completedOn: civil(row.translationDate, 'document.translationDate') }),
    ...(row.translatorReference === null ? {} : { translatorReference: row.translatorReference }),
  };
  return {
    id: row.id,
    tenantId: row.tenantId,
    matterId: row.matterId,
    kind: oneOf(row.kind, DOCUMENT_KIND_VALUES, 'document.kind'),
    issuingCountry: country(row.issuingCountry, 'document.issuingCountry'),
    status: oneOf(row.status, DOCUMENT_STATUS_VALUES, 'document.status'),
    legalisation,
    translation,
    ...(row.issuedOn === null ? {} : { issuedOn: civil(row.issuedOn, 'document.issuedOn') }),
    ...(row.expiresOn === null ? {} : { expiresOn: civil(row.expiresOn, 'document.expiresOn') }),
    ...(row.verifiedBy === null ? {} : { verifiedBy: row.verifiedBy }),
  };
}

function toStay(row: StayRow): StayRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    matterId: row.matterId,
    country: country(row.country, 'stay.country'),
    start: civil(row.startOn, 'stay.startOn'),
    end: civilOrNull(row.endOn, 'stay.endOn'),
    source: oneOf(row.source, PRESENCE_SOURCES, 'stay.source'),
    confidence: oneOf(row.confidence, PRESENCE_CONFIDENCES, 'stay.confidence'),
    exemptFromSchengenShortStay: row.exemptFromSchengenShortStay,
  };
}

function toEvaluation(row: PathwayEvaluationRow): PathwayEvaluationRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    matterId: row.matterId,
    pathwayId: row.pathwayId,
    pathwayVersion: row.pathwayVersion,
    asOf: civil(row.asOf, 'pathway_evaluation.asOf'),
    verdict: oneOf(row.verdict, VERDICTS, 'pathway_evaluation.verdict'),
    classification: oneOf(row.classification, DISCLOSURE_CLASSES, 'pathway_evaluation.classification'),
    released: row.released,
    report: row.report,
    createdAt: row.createdAt.toISOString(),
  };
}

function toHandoff(row: GovTechHandoffRow): HandoffRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    matterId: row.matterId,
    adapterId: row.adapterId,
    capabilityId: row.capabilityId,
    title: row.title,
    destinationUrl: row.destinationUrl,
    classification: oneOf(row.classification, DISCLOSURE_CLASSES, 'govtech_handoff.classification'),
    generatedOn: civil(row.generatedOn, 'govtech_handoff.generatedOn'),
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
  };
}

/** The audit `detail` column is a flat scalar map by contract; anything else is dropped. */
function toAuditDetail(value: unknown): Readonly<Record<string, string | number | boolean | null>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[key] = v;
    }
  }
  return out;
}

function toAuditEvent(row: AuditEventRow): AuditEventRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    occurredAt: row.occurredAt.toISOString(),
    actorUserId: row.actorUserId,
    actorRoles: [...row.actorRoles],
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    disclosureClass:
      row.disclosureClass === null
        ? null
        : oneOf(row.disclosureClass, DISCLOSURE_CLASSES, 'audit_event.disclosureClass'),
    outcome: oneOf(row.outcome, AUDIT_OUTCOMES, 'audit_event.outcome'),
    detail: toAuditDetail(row.detail),
  };
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

class PrismaRepresentativeRepository implements RepresentativeRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async list(): Promise<RepresentativeRecord[]> {
    const rows = await this.db.representative.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { id: 'asc' },
    });
    return rows.map(toRepresentative);
  }

  async get(id: string): Promise<RepresentativeRecord | null> {
    const row = await this.db.representative.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toRepresentative(row);
  }

  async add(representative: RepresentativeRecord): Promise<RepresentativeRecord> {
    const row = await this.db.representative.create({
      data: {
        id: representative.id,
        tenantId: this.tenantId,
        jurisdiction: representative.jurisdiction,
        credential: representative.credential,
        licenceNumber: representative.licenceNumber,
        verifiedOn: representative.verifiedOn,
        expiresOn: representative.expiresOn ?? null,
      },
    });
    return toRepresentative(row);
  }
}

class PrismaApplicantRepository implements ApplicantRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async list(page: Page): Promise<ApplicantRecord[]> {
    const rows = await this.db.applicant.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'asc' },
      take: page.limit,
      skip: page.offset,
    });
    return rows.map(toApplicant);
  }

  async get(id: string): Promise<ApplicantRecord | null> {
    const row = await this.db.applicant.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toApplicant(row);
  }

  async create(input: NewApplicant): Promise<ApplicantRecord> {
    const row = await this.db.applicant.create({
      data: {
        id: input.id,
        tenantId: this.tenantId,
        reference: input.reference ?? null,
        givenNames: input.givenNames ?? null,
        familyNames: input.familyNames ?? null,
        nationalities: [...input.nationalities],
        claimedNationality: input.claimedNationality ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
      },
    });
    return toApplicant(row);
  }

  async update(id: string, patch: ApplicantPatch): Promise<ApplicantRecord | null> {
    const data: Record<string, unknown> = {};
    if (patch.reference !== undefined) data['reference'] = patch.reference;
    if (patch.givenNames !== undefined) data['givenNames'] = patch.givenNames;
    if (patch.familyNames !== undefined) data['familyNames'] = patch.familyNames;
    if (patch.nationalities !== undefined) data['nationalities'] = [...patch.nationalities];
    if (patch.claimedNationality !== undefined) data['claimedNationality'] = patch.claimedNationality;
    if (patch.dateOfBirth !== undefined) data['dateOfBirth'] = patch.dateOfBirth;

    if (Object.keys(data).length > 0) {
      const result = await this.db.applicant.updateMany({
        where: { id, tenantId: this.tenantId },
        data,
      });
      if (result.count === 0) return null;
    }
    return this.get(id);
  }
}

class PrismaMatterRepository implements MatterRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async list(filter: MatterFilter, page: Page): Promise<MatterRecord[]> {
    const rows = await this.db.matter.findMany({
      where: {
        tenantId: this.tenantId,
        ...(filter.status === undefined ? {} : { status: filter.status }),
        ...(filter.phase === undefined ? {} : { phase: filter.phase }),
        ...(filter.applicantId === undefined ? {} : { applicantId: filter.applicantId }),
      },
      orderBy: { createdAt: 'asc' },
      take: page.limit,
      skip: page.offset,
    });
    return rows.map(toMatter);
  }

  async get(id: string): Promise<MatterRecord | null> {
    const row = await this.db.matter.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toMatter(row);
  }

  async create(input: NewMatter): Promise<MatterRecord> {
    const row = await this.db.matter.create({
      data: {
        id: input.id,
        tenantId: this.tenantId,
        applicantId: input.applicantId,
        pathwayId: input.pathwayId,
        targetJurisdiction: input.targetJurisdiction,
        claimedNationality: input.claimedNationality,
        status: input.status,
        phase: input.phase,
        openedOn: input.openedOn,
        representativeId: input.representativeId,
      },
    });
    return toMatter(row);
  }

  async update(id: string, patch: MatterPatch): Promise<MatterRecord | null> {
    const data: Record<string, unknown> = {};
    if (patch.status !== undefined) data['status'] = patch.status;
    if (patch.phase !== undefined) data['phase'] = patch.phase;
    if (patch.representativeId !== undefined) data['representativeId'] = patch.representativeId;
    // Tri-state, as in the in-memory adapter: absent leaves it, null reopens.
    if (patch.closedOn !== undefined) data['closedOn'] = patch.closedOn;

    if (Object.keys(data).length > 0) {
      const result = await this.db.matter.updateMany({
        where: { id, tenantId: this.tenantId },
        data,
      });
      if (result.count === 0) return null;
    }
    return this.get(id);
  }
}

class PrismaTaskRepository implements TaskRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string): Promise<TaskRecord[]> {
    const rows = await this.db.task.findMany({
      where: { tenantId: this.tenantId, matterId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toTask);
  }

  async get(id: string): Promise<TaskRecord | null> {
    const row = await this.db.task.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toTask(row);
  }

  async create(input: NewTask): Promise<TaskRecord> {
    const row = await this.db.task.create({
      data: {
        id: input.id,
        tenantId: this.tenantId,
        matterId: input.matterId,
        phase: input.phase,
        title: input.title,
        assignee: input.assignee,
        status: input.status,
        dependsOn: [...input.dependsOn],
        dueOn: input.dueOn ?? null,
        citationIds: [...input.citationIds],
      },
    });
    return toTask(row);
  }

  async update(id: string, patch: TaskPatch): Promise<TaskRecord | null> {
    const data: Record<string, unknown> = {};
    if (patch.status !== undefined) data['status'] = patch.status;
    if (patch.title !== undefined) data['title'] = patch.title;
    if (patch.dueOn !== undefined) data['dueOn'] = patch.dueOn;

    if (Object.keys(data).length > 0) {
      const result = await this.db.task.updateMany({ where: { id, tenantId: this.tenantId }, data });
      if (result.count === 0) return null;
    }
    return this.get(id);
  }

  async applyStatuses(
    updates: readonly { readonly id: string; readonly status: TaskStatus }[],
  ): Promise<void> {
    // Grouped by target status so an unlock pass over a large checklist is a
    // handful of statements rather than one per task.
    const byStatus = new Map<TaskStatus, string[]>();
    for (const u of updates) {
      const bucket = byStatus.get(u.status);
      if (bucket === undefined) byStatus.set(u.status, [u.id]);
      else bucket.push(u.id);
    }
    for (const [status, ids] of byStatus) {
      await this.db.task.updateMany({
        where: { tenantId: this.tenantId, id: { in: ids } },
        data: { status },
      });
    }
  }
}

class PrismaDocumentRepository implements DocumentRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string): Promise<DocumentRecord[]> {
    const rows = await this.db.document.findMany({
      where: { tenantId: this.tenantId, matterId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDocument);
  }

  async get(id: string): Promise<DocumentRecord | null> {
    const row = await this.db.document.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toDocument(row);
  }

  async create(matterId: string, document: Document): Promise<DocumentRecord> {
    const row = await this.db.document.create({
      data: { ...documentColumns(document), id: document.id, tenantId: this.tenantId, matterId },
    });
    return toDocument(row);
  }

  async replace(document: DocumentRecord): Promise<DocumentRecord | null> {
    const result = await this.db.document.updateMany({
      where: { id: document.id, tenantId: this.tenantId },
      data: documentColumns(document),
    });
    if (result.count === 0) return null;
    return this.get(document.id);
  }
}

/** One place that knows how a `Document` flattens into columns. */
function documentColumns(document: Document): Record<string, unknown> {
  return {
    kind: document.kind,
    issuingCountry: document.issuingCountry,
    issuedOn: document.issuedOn ?? null,
    expiresOn: document.expiresOn ?? null,
    status: document.status,
    legalisationRoute: document.legalisation.route,
    legalisationDate: document.legalisation.completedOn ?? null,
    legalisationReference: document.legalisation.reference ?? null,
    sourceLanguage: document.translation.sourceLanguage,
    translationLanguage: document.translation.intoLanguage ?? null,
    translatorStandard: document.translation.standard ?? null,
    translationDate: document.translation.completedOn ?? null,
    translatorReference: document.translation.translatorReference ?? null,
    verifiedBy: document.verifiedBy ?? null,
  };
}

class PrismaStayRepository implements StayRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string): Promise<StayRecord[]> {
    const rows = await this.db.stay.findMany({
      where: { tenantId: this.tenantId, matterId },
      orderBy: [{ startOn: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toStay);
  }

  async get(id: string): Promise<StayRecord | null> {
    const row = await this.db.stay.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toStay(row);
  }

  async createMany(inputs: readonly NewStay[]): Promise<StayRecord[]> {
    const created: StayRecord[] = [];
    for (const input of inputs) {
      const row = await this.db.stay.create({
        data: {
          id: input.id,
          tenantId: this.tenantId,
          matterId: input.matterId,
          country: input.country,
          startOn: input.start,
          endOn: input.end,
          source: input.source,
          confidence: input.confidence,
          exemptFromSchengenShortStay: input.exemptFromSchengenShortStay,
        },
      });
      created.push(toStay(row));
    }
    return created;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.stay.deleteMany({ where: { id, tenantId: this.tenantId } });
    return result.count > 0;
  }
}

class PrismaEvaluationRepository implements EvaluationRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async listForMatter(matterId: string, page: Page): Promise<PathwayEvaluationRecord[]> {
    const rows = await this.db.pathwayEvaluation.findMany({
      where: { tenantId: this.tenantId, matterId },
      orderBy: { createdAt: 'desc' },
      take: page.limit,
      skip: page.offset,
    });
    return rows.map(toEvaluation);
  }

  async append(record: PathwayEvaluationRecord): Promise<PathwayEvaluationRecord> {
    const row = await this.db.pathwayEvaluation.create({
      data: {
        id: record.id,
        tenantId: this.tenantId,
        matterId: record.matterId,
        pathwayId: record.pathwayId,
        pathwayVersion: record.pathwayVersion,
        asOf: record.asOf,
        verdict: record.verdict,
        classification: record.classification,
        released: record.released,
        report: record.report,
      },
    });
    return toEvaluation(row);
  }
}

class PrismaHandoffRepository implements HandoffRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async list(page: Page): Promise<HandoffRecord[]> {
    const rows = await this.db.govTechHandoff.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: page.limit,
      skip: page.offset,
    });
    return rows.map(toHandoff);
  }

  async get(id: string): Promise<HandoffRecord | null> {
    const row = await this.db.govTechHandoff.findFirst({ where: { id, tenantId: this.tenantId } });
    return row === null ? null : toHandoff(row);
  }

  async append(record: HandoffRecord): Promise<HandoffRecord> {
    const row = await this.db.govTechHandoff.create({
      data: {
        id: record.id,
        tenantId: this.tenantId,
        matterId: record.matterId,
        adapterId: record.adapterId,
        capabilityId: record.capabilityId,
        title: record.title,
        destinationUrl: record.destinationUrl,
        classification: record.classification,
        generatedOn: record.generatedOn,
        payload: record.payload,
      },
    });
    return toHandoff(row);
  }
}

/**
 * Append and read.
 *
 * `create` and `findMany` are the only delegate methods this class touches. The
 * database should back that up with a grant: INSERT and SELECT on `audit_event`,
 * nothing else. Defence in depth, because an ORM-level guarantee is only as good
 * as the next person to add a method.
 */
class PrismaAuditRepository implements AuditRepository {
  constructor(
    private readonly db: MeridianPrismaClient,
    private readonly tenantId: string,
  ) {}

  async append(event: AuditEventRecord): Promise<AuditEventRecord> {
    const row = await this.db.auditEvent.create({
      data: {
        id: event.id,
        tenantId: this.tenantId,
        // The one `Date` in this adapter, and it is not calendar arithmetic:
        // `occurredAt` is a genuine instant and the column is `timestamptz`, so
        // the driver needs a `Date`. Every *civil* date in this file stays a
        // ten-character string precisely so it never passes through this type.
        occurredAt: new Date(event.occurredAt),
        actorUserId: event.actorUserId,
        actorRoles: [...event.actorRoles],
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        disclosureClass: event.disclosureClass,
        outcome: event.outcome,
        detail: { ...event.detail },
      },
    });
    return toAuditEvent(row);
  }

  async list(query: AuditQuery): Promise<AuditEventRecord[]> {
    const rows = await this.db.auditEvent.findMany({
      where: {
        tenantId: this.tenantId,
        ...(query.action === undefined ? {} : { action: query.action }),
        ...(query.targetType === undefined ? {} : { targetType: query.targetType }),
        ...(query.targetId === undefined ? {} : { targetId: query.targetId }),
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: query.limit,
      skip: query.offset,
    });
    return rows.map(toAuditEvent);
  }
}

class PrismaTenantDirectory implements TenantDirectory {
  constructor(private readonly db: MeridianPrismaClient) {}

  async get(id: string): Promise<TenantRecord | null> {
    const row = await this.db.tenant.findFirst({ where: { id } });
    if (row === null) return null;
    const reps = await this.db.representative.findMany({
      where: { tenantId: id },
      orderBy: { id: 'asc' },
    });
    return toTenant(row, reps.map(toRepresentative));
  }

  async create(input: NewTenant): Promise<TenantRecord> {
    const row = await this.db.tenant.create({
      data: {
        id: input.id,
        kind: input.kind,
        displayName: input.displayName,
        homeJurisdiction: input.homeJurisdiction,
      },
    });
    return toTenant(row, []);
  }
}

class PrismaRepositories implements Repositories {
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
    db: MeridianPrismaClient,
    readonly tenantId: string,
  ) {
    this.representatives = new PrismaRepresentativeRepository(db, tenantId);
    this.applicants = new PrismaApplicantRepository(db, tenantId);
    this.matters = new PrismaMatterRepository(db, tenantId);
    this.tasks = new PrismaTaskRepository(db, tenantId);
    this.documents = new PrismaDocumentRepository(db, tenantId);
    this.stays = new PrismaStayRepository(db, tenantId);
    this.evaluations = new PrismaEvaluationRepository(db, tenantId);
    this.handoffs = new PrismaHandoffRepository(db, tenantId);
    this.audit = new PrismaAuditRepository(db, tenantId);
  }
}

export class PrismaRepositoryProvider implements RepositoryProvider {
  readonly kind = 'prisma' as const;
  readonly tenants: TenantDirectory;

  constructor(private readonly db: MeridianPrismaClient) {
    this.tenants = new PrismaTenantDirectory(db);
  }

  forTenant(tenantId: string): Repositories {
    return new PrismaRepositories(this.db, tenantId);
  }

  /**
   * A real round trip, not a connection-pool status flag.
   *
   * A pool can hold a connection to a database that has since become read-only
   * or run out of disk, and report itself healthy the entire time.
   */
  async checkHealth(): Promise<Result<void, Error>> {
    try {
      await this.db.$queryRawUnsafe('SELECT 1');
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async close(): Promise<void> {
    await this.db.$disconnect();
  }
}
