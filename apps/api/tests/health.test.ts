/**
 * Liveness and readiness.
 *
 * The test that matters is the one where a dependency is *down*. A readiness
 * probe nobody has ever seen fail is a readiness probe that reports ready when
 * the database is gone, and the load balancer keeps routing to it because it
 * said it was fine.
 *
 * The second half of this file tests the Prisma provider's own probe against a
 * fake client. The adapter is otherwise covered by nothing but `tsc`, and the
 * defect being guarded against here — a check that proves a socket and calls it
 * a schema — is invisible to a type checker and invisible to any test that runs
 * against the in-memory store.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { safeReason } from '../src/routes/health.js';
import { buildApp } from '../src/app.js';
import { createVerifier } from '../src/auth/verifier.js';
import { fixedClock } from '../src/clock.js';
import { InMemoryRepositoryProvider } from '../src/repositories/memory.js';
import { PrismaRepositoryProvider } from '../src/repositories/prisma.js';
import type { MeridianPrismaClient, PrismaDelegate } from '../src/repositories/prisma-client.js';
import type { StoreHealth } from '../src/repositories/types.js';
import { defaultRegistry } from '@meridian/govtech';
import { err } from '@meridian/core';
import { createLocalJWKSet } from 'jose';
import type { FastifyInstance } from 'fastify';

import {
  AUDIENCE,
  ISSUER,
  TODAY,
  createHarness,
  testConfig,
  testKeys,
  type Harness,
} from './harness.js';

let harness: Harness;

beforeEach(async () => {
  harness = await createHarness();
});

afterEach(async () => {
  await harness.close();
});

interface ReadyBody {
  ready: boolean;
  asOf: string;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    state: string;
    detail: string;
    reason?: string;
  }[];
}

function databaseCheck(body: ReadyBody): ReadyBody['checks'][number] {
  const check = body.checks.find((c) => c.name === 'database');
  if (check === undefined) throw new Error('readiness payload carried no database check');
  return check;
}

describe('health', () => {
  it('liveness answers without touching a dependency', async () => {
    // Deliberately independent of the database: a liveness probe that fails on a
    // slow query gets the container killed and restarted into the same slow
    // database, turning a degradation into an outage.
    harness.provider.setHealth('unreachable', 'database is unreachable');
    const response = await harness.app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', asOf: TODAY });
  });

  it('readiness passes when every dependency answers', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
    const body = response.json<ReadyBody>();
    expect(body.ready).toBe(true);
    expect(body.checks.map((c) => c.name).sort()).toEqual([
      'database',
      'govtech_registry',
      'identity',
    ]);
    expect(body.checks.every((c) => c.status === 'pass')).toBe(true);
    expect(body.checks.every((c) => c.state === 'healthy')).toBe(true);
  });

  it('readiness returns 503 and names the dependency that is down', async () => {
    harness.provider.setHealth('unreachable', 'connection refused to the primary');
    const response = await harness.app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json<ReadyBody>();
    expect(body.ready).toBe(false);
    const database = databaseCheck(body);
    expect(database.status).toBe('fail');
    expect(database.state).toBe('unreachable');
    expect(database.reason).toContain('connection refused');
    // The other checks still report their own state rather than being
    // short-circuited: an operator wants to know whether one thing is broken or
    // three.
    expect(body.checks.find((c) => c.name === 'identity')?.status).toBe('pass');
  });

  it('readiness fails, and says so as a schema fault, when the store has no schema', async () => {
    // The two failures have different owners and different fixes. `unreachable`
    // may heal on its own; this one will not — nothing changes until somebody
    // applies a migration — so the payload has to distinguish them.
    harness.provider.setHealth(
      'schema_unavailable',
      'could not read "tenant": relation "tenant" does not exist',
    );
    const response = await harness.app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json<ReadyBody>();
    expect(body.ready).toBe(false);
    const database = databaseCheck(body);
    expect(database.status).toBe('fail');
    expect(database.state).toBe('schema_unavailable');
    expect(database.reason).toContain('relation "tenant" does not exist');
    expect(database.detail).toContain('migrations');
  });

  it('readiness fails when the identity provider key source is unreachable', async () => {
    // The failure mode this catches: an instance that reports ready, then 401s
    // every authenticated request the moment its key cache expires.
    const { jwks } = await testKeys();
    const provider = new InMemoryRepositoryProvider();
    const app: FastifyInstance = await buildApp({
      logger: false,
      services: {
        config: testConfig(),
        clock: fixedClock(TODAY),
        repositories: provider,
        verifier: createVerifier(
          createLocalJWKSet(jwks),
          { issuer: ISSUER, audience: AUDIENCE },
          'unreachable-jwks',
          async () => err(new Error('getaddrinfo ENOTFOUND auth.madfam.io')),
        ),
        govtech: defaultRegistry(),
        catalog: [],
        newId: () => 'id-static',
      },
    });

    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(503);
    const identity = response.json<ReadyBody>().checks.find((c) => c.name === 'identity');
    expect(identity?.status).toBe('fail');
    expect(identity?.reason).toContain('ENOTFOUND');
    await app.close();
  });

  it('never publishes a connection string in a readiness reason', () => {
    // Driver errors quote connection strings, and this endpoint is readable by
    // anything that can reach the port.
    const reason = safeReason(
      new Error(
        'Cannot connect to postgresql://meridian:hunter2@db.internal:5432/meridian — timeout',
      ),
    );
    expect(reason).not.toContain('hunter2');
    expect(reason).not.toContain('db.internal');
    expect(reason).toContain('[url]');
  });

  it('truncates a very long driver error rather than echoing it whole', () => {
    const reason = safeReason(new Error('x'.repeat(5000)));
    expect(reason.length).toBeLessThanOrEqual(200);
  });

  it('falls back to the error name when the message is empty', () => {
    const error = new Error('');
    error.name = 'ConnectionTimeout';
    expect(safeReason(error)).toBe('ConnectionTimeout');
  });

  it('health endpoints need no token', async () => {
    // A probe that needs a credential is a credential in a config nobody
    // rotates.
    for (const url of ['/health', '/health/ready']) {
      const response = await harness.app.inject({ method: 'GET', url });
      expect(response.statusCode).toBeLessThan(500);
    }
  });
});

// ---------------------------------------------------------------------------
// The Prisma provider's own probe.
// ---------------------------------------------------------------------------

/** Delegate names, in the order `SCHEMA_PROBES` reads them. */
const DELEGATE_NAMES = [
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
] as const;

type DelegateName = (typeof DELEGATE_NAMES)[number];

interface FakeClientOptions {
  /** False for a database that cannot be reached at all. */
  readonly connected?: boolean;
  /** Tables whose read fails the way Postgres fails on an unmigrated database. */
  readonly missing?: readonly DelegateName[];
  /** Drop the connection at the instant a table read fails, to exercise the race. */
  readonly dropConnectionOnReadFailure?: boolean;
}

interface FakeClient {
  readonly client: MeridianPrismaClient;
  /** Every table read, in order. Lets a test assert what was actually probed. */
  readonly reads: DelegateName[];
  readonly rawQueries: string[];
}

/**
 * A client that fails the way a real one fails.
 *
 * Every method reads through the same gate, so there is no method here that
 * throws "not implemented" — the fake is a complete, if trivial, implementation
 * of the port the adapter was written against, which is the same standard the
 * in-memory repository holds itself to.
 *
 * The missing-table message names the *delegate* (`public.auditEvent`) rather
 * than the mapped table. Real Postgres would say `audit_event`; having the fake
 * say the other one means an assertion that the reported error contains
 * `audit_event` is proof that the adapter supplied the mapped name itself, and
 * therefore that its table list has not drifted from `schema.prisma`.
 */
function fakePrismaClient(options: FakeClientOptions = {}): FakeClient {
  const reads: DelegateName[] = [];
  const rawQueries: string[] = [];
  const missing = new Set<string>(options.missing ?? []);
  let connected = options.connected ?? true;

  const readTable = (name: DelegateName): void => {
    reads.push(name);
    if (!connected) throw new Error('Server has closed the connection.');
    if (missing.has(name)) {
      if (options.dropConnectionOnReadFailure === true) connected = false;
      // Shaped like a real Prisma failure: a banner, an excerpt of the source
      // file that issued the query, and the actual cause on the last line.
      throw new Error(
        [
          `Invalid \`db.${name}.findMany()\` invocation in`,
          '/build/apps/api/src/repositories/prisma.ts:986:46',
          '',
          '  985   readonly table: string;',
          '',
          `The table \`public.${name}\` does not exist in the current database.`,
        ].join('\n'),
      );
    }
  };

  const delegate = <Row>(name: DelegateName): PrismaDelegate<Row> => ({
    async findMany() {
      readTable(name);
      return [];
    },
    async findFirst() {
      readTable(name);
      return null;
    },
    async create(args) {
      readTable(name);
      return args.data as unknown as Row;
    },
    async updateMany() {
      readTable(name);
      return { count: 0 };
    },
    async deleteMany() {
      readTable(name);
      return { count: 0 };
    },
    async count() {
      readTable(name);
      return 0;
    },
  });

  const client: MeridianPrismaClient = {
    tenant: delegate('tenant'),
    representative: delegate('representative'),
    applicant: delegate('applicant'),
    matter: delegate('matter'),
    task: delegate('task'),
    document: delegate('document'),
    stay: delegate('stay'),
    pathwayEvaluation: delegate('pathwayEvaluation'),
    govTechHandoff: delegate('govTechHandoff'),
    auditEvent: delegate('auditEvent'),
    async $queryRawUnsafe(query: string) {
      rawQueries.push(query);
      if (!connected) throw new Error('Cannot reach database server at localhost:5432');
      return [{ one: 1 }];
    },
    async $disconnect() {
      // Nothing to release.
    },
  };

  return { client, reads, rawQueries };
}

/**
 * Assert the status and narrow to it, so `error` is reachable without a cast.
 *
 * A plain `expect(health.status).toBe(...)` proves the same thing but leaves the
 * union un-narrowed, and a cast in a test is a place a test can start asserting
 * about a shape the code no longer produces.
 */
function expectStatus<S extends StoreHealth['status']>(
  health: StoreHealth,
  status: S,
): Extract<StoreHealth, { status: S }> {
  if (health.status !== status) {
    throw new Error(`expected store health ${status}, got ${health.status}`);
  }
  return health as Extract<StoreHealth, { status: S }>;
}

describe('prisma store readiness', () => {
  it('is healthy when every table the request path reads answers, empty or not', async () => {
    // Empty is the normal state of a deployment on its first day. A check that
    // demanded a row would mean a correctly migrated cluster never comes up, so
    // every read here returns zero rows and the verdict must still be healthy.
    const fake = fakePrismaClient();
    const provider = new PrismaRepositoryProvider(fake.client);

    expect(await provider.checkHealth()).toEqual({ status: 'healthy' });
    expect(fake.reads).toEqual([...DELEGATE_NAMES]);
    expect(fake.rawQueries).toEqual(['SELECT 1']);
  });

  it('is not healthy against a database that answers SELECT 1 with no schema in it', async () => {
    // The regression. `SELECT 1` succeeds against a Postgres instance with zero
    // tables, so the check it replaced reported ready, the pod joined the
    // Service, and every authenticated request then 500ed in the auth hook.
    const fake = fakePrismaClient({ missing: DELEGATE_NAMES });
    const provider = new PrismaRepositoryProvider(fake.client);

    const health = expectStatus(await provider.checkHealth(), 'schema_unavailable');
    expect(health.error.message).toContain('could not read "tenant"');
    // The old check would have passed: the socket answered, twice.
    expect(fake.rawQueries).toEqual(['SELECT 1', 'SELECT 1']);
    // And it stopped at the first missing table rather than probing all ten.
    expect(fake.reads).toEqual(['tenant']);
  });

  it('catches a half-applied migration, not just a wholly empty database', async () => {
    // `migrate deploy` stops at the first failing statement, so "some of the
    // schema" is a real state. A mutation that cannot write its audit row is
    // exactly what this service must not serve traffic through.
    const fake = fakePrismaClient({ missing: ['auditEvent'] });
    const provider = new PrismaRepositoryProvider(fake.client);

    const health = expectStatus(await provider.checkHealth(), 'schema_unavailable');
    // The mapped table name comes from the adapter; the delegate name comes from
    // the driver. Both present means the two have not drifted apart.
    expect(health.error.message).toContain('could not read "audit_event"');
    expect(health.error.message).toContain('public.auditEvent');
    expect(fake.reads).toEqual([...DELEGATE_NAMES]);
  });

  it('reports the cause of a driver error, not an excerpt of our own source', async () => {
    // Prisma puts the call site and a slice of the file that issued the query
    // *before* the reason. Published whole on an unauthenticated endpoint, that
    // is a build path and none of the explanation, because `safeReason`
    // truncates long before the last line.
    const fake = fakePrismaClient({ missing: ['tenant'] });
    const health = expectStatus(
      await new PrismaRepositoryProvider(fake.client).checkHealth(),
      'schema_unavailable',
    );

    expect(health.error.message).toBe(
      'could not read "tenant": The table `public.tenant` does not exist in the current database.',
    );
    expect(health.error.message).not.toContain('/build/apps/api');
    expect(safeReason(health.error)).toContain('does not exist');
    // The whole thing is still there for a log reader.
    expect((health.error.cause as Error).message).toContain('/build/apps/api');
  });

  it('reports a database it cannot reach as unreachable, not as a missing schema', async () => {
    // Different fault, different owner, different fix: this one may heal on its
    // own, and nobody should be paged to run a migration for it.
    const fake = fakePrismaClient({ connected: false });
    const provider = new PrismaRepositoryProvider(fake.client);

    const health = expectStatus(await provider.checkHealth(), 'unreachable');
    expect(health.error.message).toContain('Cannot reach database server');
    // It never got as far as a table, so it cannot claim anything about the schema.
    expect(fake.reads).toEqual([]);
  });

  it('reports a connection lost mid-probe as unreachable rather than blaming the schema', async () => {
    // The race between the connectivity probe and the reads. Telling an operator
    // to apply migrations to a database that simply vanished sends them to the
    // wrong runbook.
    const fake = fakePrismaClient({
      missing: ['matter'],
      dropConnectionOnReadFailure: true,
    });
    const provider = new PrismaRepositoryProvider(fake.client);

    expectStatus(await provider.checkHealth(), 'unreachable');
    expect(fake.reads).toEqual(['tenant', 'representative', 'applicant', 'matter']);
  });
});
