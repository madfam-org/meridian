/**
 * A structural description of the generated Prisma client.
 *
 * **Why this file exists.** The Prisma client is *generated* from
 * `prisma/schema.prisma`, and generation is a build step that has deliberately
 * not been run in this working tree. Importing `@prisma/client` for its types
 * would therefore make `tsc --noEmit` depend on a code-generation step, which
 * means the type check either fails on a clean checkout or silently passes
 * against a stale client someone generated last month. Neither is acceptable in
 * a repository where the type check is the gate.
 *
 * So the adapter depends on the *shape* it uses — the seven delegate methods and
 * the row columns — and the composition root loads the real client at runtime
 * and checks it satisfies that shape. This is ports and adapters applied one
 * level down: the Prisma adapter is written against a port too.
 *
 * The row interfaces below mirror `prisma/schema.prisma` column for column. If
 * they drift, `assertPrismaClientShape` still passes (it checks delegates, not
 * columns) but the mapping functions in `prisma.ts` will read `undefined` — so
 * the mappers validate what they read rather than trusting it. See the note on
 * civil dates there.
 *
 * `select`/`include` are deliberately absent from the delegate type. Every query
 * this adapter issues returns whole rows, so there is no shape a caller could
 * ask for that the row interfaces do not describe.
 */

/** Prisma's `where` argument. Untyped by necessity — see the file note. */
export type PrismaWhere = Readonly<Record<string, unknown>>;

export interface PrismaFindManyArgs {
  readonly where?: PrismaWhere;
  readonly orderBy?: unknown;
  readonly take?: number;
  readonly skip?: number;
}

/**
 * The subset of a Prisma model delegate this adapter uses.
 *
 * Note what is *not* here: `update`, `delete`, `deleteMany` on their own. Single
 * -row `update({ where: { id } })` cannot express a tenant predicate — Prisma
 * requires a unique selector — so a tenant-scoped update written that way would
 * have to check ownership in application code first, and a check in application
 * code is a check somebody eventually skips. `updateMany` takes an arbitrary
 * `where`, so `{ id, tenantId }` goes into the statement itself: an update aimed
 * at another tenant's row matches zero rows and reports it.
 */
export interface PrismaDelegate<Row> {
  findMany(args?: PrismaFindManyArgs): Promise<Row[]>;
  findFirst(args: { where: PrismaWhere }): Promise<Row | null>;
  create(args: { data: Record<string, unknown> }): Promise<Row>;
  updateMany(args: { where: PrismaWhere; data: Record<string, unknown> }): Promise<{ count: number }>;
  deleteMany(args: { where: PrismaWhere }): Promise<{ count: number }>;
  count(args?: { where?: PrismaWhere }): Promise<number>;
}

// ---------------------------------------------------------------------------
// Rows. One interface per model in prisma/schema.prisma.
//
// Enum columns are typed as their domain unions. Postgres enforces the enum, so
// a value outside the set cannot be stored; a value outside the *code's* set can
// still arrive after a migration that adds one, which is why the mappers narrow
// rather than cast.
//
// Civil-date columns are `string` because that is what they are: `YYYY-MM-DD`
// text, not an instant. `Char(10)` does not make them valid calendar dates —
// `2025-02-30` fits in ten characters — so the mappers run them through core's
// `isoDate`, which rejects it.
// ---------------------------------------------------------------------------

export interface TenantRow {
  id: string;
  kind: string;
  displayName: string;
  homeJurisdiction: string;
}

export interface RepresentativeRow {
  id: string;
  tenantId: string;
  jurisdiction: string;
  credential: string;
  licenceNumber: string;
  verifiedOn: string;
  expiresOn: string | null;
}

export interface ApplicantRow {
  id: string;
  tenantId: string;
  reference: string | null;
  givenNames: string | null;
  familyNames: string | null;
  nationalities: string[];
  claimedNationality: string | null;
  dateOfBirth: string | null;
}

export interface MatterRow {
  id: string;
  tenantId: string;
  applicantId: string;
  pathwayId: string;
  targetJurisdiction: string;
  claimedNationality: string;
  status: string;
  phase: string;
  openedOn: string;
  closedOn: string | null;
  representativeId: string | null;
}

export interface TaskRow {
  id: string;
  tenantId: string;
  matterId: string;
  phase: string;
  title: string;
  assignee: string;
  status: string;
  dependsOn: string[];
  dueOn: string | null;
  citationIds: string[];
}

export interface DocumentRow {
  id: string;
  tenantId: string;
  matterId: string;
  kind: string;
  issuingCountry: string;
  issuedOn: string | null;
  expiresOn: string | null;
  status: string;
  legalisationRoute: string | null;
  legalisationDate: string | null;
  legalisationReference: string | null;
  sourceLanguage: string;
  translationLanguage: string | null;
  translatorStandard: string | null;
  translationDate: string | null;
  translatorReference: string | null;
  verifiedBy: string | null;
}

export interface StayRow {
  id: string;
  tenantId: string;
  matterId: string;
  country: string;
  startOn: string;
  endOn: string | null;
  source: string;
  confidence: string;
  exemptFromSchengenShortStay: boolean;
}

export interface PathwayEvaluationRow {
  id: string;
  tenantId: string;
  matterId: string;
  pathwayId: string;
  pathwayVersion: string;
  asOf: string;
  verdict: string;
  classification: string;
  released: boolean;
  report: unknown;
  createdAt: Date;
}

export interface GovTechHandoffRow {
  id: string;
  tenantId: string;
  matterId: string | null;
  adapterId: string;
  capabilityId: string | null;
  title: string;
  destinationUrl: string;
  classification: string;
  generatedOn: string;
  payload: unknown;
  createdAt: Date;
}

export interface AuditEventRow {
  id: string;
  tenantId: string;
  occurredAt: Date;
  actorUserId: string;
  actorRoles: string[];
  action: string;
  targetType: string;
  targetId: string | null;
  disclosureClass: string | null;
  outcome: string;
  detail: unknown;
}

/**
 * The client this adapter needs.
 *
 * `auditEvent` intentionally exposes the same delegate type as everything else —
 * the append-only guarantee is enforced by `AuditRepository` having no method
 * that could issue an update, not by hiding `updateMany` here. Narrowing the
 * delegate would suggest the database is the enforcement point, and it is not:
 * the deployment should grant the application role INSERT and SELECT on
 * `audit_event` and nothing more.
 */
export interface MeridianPrismaClient {
  readonly tenant: PrismaDelegate<TenantRow>;
  readonly representative: PrismaDelegate<RepresentativeRow>;
  readonly applicant: PrismaDelegate<ApplicantRow>;
  readonly matter: PrismaDelegate<MatterRow>;
  readonly task: PrismaDelegate<TaskRow>;
  readonly document: PrismaDelegate<DocumentRow>;
  readonly stay: PrismaDelegate<StayRow>;
  readonly pathwayEvaluation: PrismaDelegate<PathwayEvaluationRow>;
  readonly govTechHandoff: PrismaDelegate<GovTechHandoffRow>;
  readonly auditEvent: PrismaDelegate<AuditEventRow>;
  $queryRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $disconnect(): Promise<void>;
}

const REQUIRED_DELEGATES: readonly string[] = [
  'tenant',
  'representative',
  'applicant',
  'matter',
  'task',
  'document',
  'stay',
  'pathwayEvaluation',
  'govTechHandoff',
  'auditEvent',
];

const REQUIRED_METHODS: readonly string[] = [
  'findMany',
  'findFirst',
  'create',
  'updateMany',
  'deleteMany',
  'count',
];

/**
 * Confirm a runtime-loaded client is the one this adapter was written against.
 *
 * The failure mode this catches is real and otherwise very confusing: a client
 * generated from an older schema has no `stay` delegate, and the first symptom
 * is `Cannot read properties of undefined (reading 'findMany')` at 03:00 on the
 * one route that touches presence. Failing at boot with the missing name is
 * strictly better.
 */
export function assertPrismaClientShape(candidate: unknown): MeridianPrismaClient {
  if (typeof candidate !== 'object' || candidate === null) {
    throw new TypeError(
      'The Prisma client could not be loaded. Run `pnpm --filter @meridian/api db:generate`.',
    );
  }
  const client = candidate as Record<string, unknown>;
  const missing: string[] = [];

  for (const name of REQUIRED_DELEGATES) {
    const delegate = client[name];
    if (typeof delegate !== 'object' || delegate === null) {
      missing.push(name);
      continue;
    }
    const record = delegate as Record<string, unknown>;
    for (const method of REQUIRED_METHODS) {
      if (typeof record[method] !== 'function') missing.push(`${name}.${method}`);
    }
  }
  for (const method of ['$queryRawUnsafe', '$disconnect']) {
    if (typeof client[method] !== 'function') missing.push(method);
  }

  if (missing.length > 0) {
    throw new TypeError(
      'The loaded Prisma client does not match prisma/schema.prisma. Missing: ' +
        `${missing.join(', ')}. Run \`pnpm --filter @meridian/api db:generate\` after a schema change.`,
    );
  }
  return candidate as MeridianPrismaClient;
}
