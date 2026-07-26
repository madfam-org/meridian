/**
 * Liveness and readiness, told honestly.
 *
 * `/health` answers one question: is this process running and able to serve a
 * response. It checks nothing else, deliberately — a liveness probe that fails
 * because the database is slow gets the container killed and restarted into the
 * same slow database, which turns a degradation into an outage.
 *
 * `/health/ready` actually calls its dependencies. A read of every table the
 * request path uses, a real fetch of Janua's JWKS. It reports which check failed
 * and returns 503, so a load balancer stops sending traffic to an instance that
 * would 401 every authenticated request the moment its key cache expires. A
 * readiness endpoint that returns `{"ready": true}` unconditionally is worse than
 * none: it removes the operator's ability to tell a broken instance from a
 * healthy one, while looking like diligence.
 *
 * That applies per dimension, not just to the endpoint as a whole. A database
 * check of `SELECT 1` passes against an instance with no tables in it, which is
 * unconditional readiness wearing a query — see `RepositoryProvider.checkHealth`
 * in `src/repositories/types.ts`. Each check therefore reports a `state`
 * as well as a `status`, so "the database is not reachable" and "the database
 * has no schema" do not arrive as the same word.
 *
 * Both are public. Requiring a token to answer "are you alive" means the probe
 * needs a credential, and a credential in a probe config is a credential in a
 * place nobody rotates.
 */

import type { FastifyInstance } from 'fastify';

import { adapterContext } from '@meridian/govtech';

import type { StoreHealth } from '../repositories/types.js';
import type { AppServices } from '../services.js';
import { declare } from './helpers.js';

export type CheckStatus = 'pass' | 'fail';

/**
 * The machine-readable sub-state of a check.
 *
 * `status` tells a load balancer what to do; `state` tells a human which of
 * several unrelated faults produced the same `fail`. For the database those two
 * faults have different owners and different fixes — a network problem that may
 * heal, versus a migration nobody applied, which will not — and a payload that
 * says only `fail` makes the operator go and find out by hand.
 */
export type CheckState =
  | 'healthy'
  /** Database: reached, but a table the request path reads is not there. */
  | 'schema_unavailable'
  /** Database: no usable round trip at all. */
  | 'unreachable'
  /** Identity: the JWKS could not be read, so tokens will stop verifying. */
  | 'key_source_unreachable'
  /** GovTech: the in-process capability board contradicts itself. */
  | 'capability_defects';

export interface DependencyCheck {
  readonly name: string;
  readonly status: CheckStatus;
  /** Which specific state produced {@link DependencyCheck.status}. */
  readonly state: CheckState;
  /** What was actually checked. Never a URL with credentials — see {@link safeReason}. */
  readonly detail: string;
  readonly reason?: string;
}

/**
 * Reduce an error to something safe to publish on an unauthenticated endpoint.
 *
 * Driver errors quote connection strings. Postgres will happily put
 * `postgresql://meridian:hunter2@db:5432/meridian` in a message, and this
 * response is readable by anything that can reach the port. So: strip anything
 * that looks like a URL or embedded credentials, then truncate.
 */
export function safeReason(error: Error): string {
  const withoutUrls = error.message
    .replace(/[a-z][a-z0-9+.-]*:\/\/\S*/gi, '[url]')
    .replace(/\b[\w.-]+:[^\s@/]+@\S*/g, '[credentials]');
  const trimmed = withoutUrls.trim();
  const capped = trimmed.length > 200 ? `${trimmed.slice(0, 197)}...` : trimmed;
  return capped.length > 0 ? capped : error.name;
}

/**
 * Turn a store probe into the check an operator reads.
 *
 * Three inputs, three distinguishable outputs. The detail line for
 * `schema_unavailable` names the remedy, because the operator reading it at
 * 03:00 has a pod that will never become ready on its own and needs to know that
 * before they restart it a third time.
 */
export function describeStoreHealth(kind: string, health: StoreHealth): DependencyCheck {
  switch (health.status) {
    case 'healthy':
      return {
        name: 'database',
        status: 'pass',
        state: 'healthy',
        detail: `${kind} store answered a read of every table the request path uses`,
      };
    case 'schema_unavailable':
      return {
        name: 'database',
        status: 'fail',
        state: 'schema_unavailable',
        detail: `${kind} store is reachable but a table the request path reads is missing or unreadable — migrations may not have been applied`,
        reason: safeReason(health.error),
      };
    case 'unreachable':
      return {
        name: 'database',
        status: 'fail',
        state: 'unreachable',
        detail: `${kind} store did not answer`,
        reason: safeReason(health.error),
      };
  }
}

export function registerHealthRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/health',
    declare({
      summary: 'Liveness. Answers only whether this process can serve a response.',
      engineOutput: false,
      access: 'public',
    }),
    async () => ({
      status: 'ok' as const,
      service: 'meridian-api',
      asOf: services.clock.today(),
    }),
  );

  app.get(
    '/health/ready',
    declare({
      summary: 'Readiness. Calls every dependency and reports which one is down.',
      engineOutput: false,
      access: 'public',
    }),
    async (_request, reply) => {
      const checks: DependencyCheck[] = [];

      const database = await services.repositories.checkHealth();
      checks.push(describeStoreHealth(services.repositories.kind, database));

      const identity = await services.verifier.checkKeySource();
      checks.push(
        identity.ok
          ? {
              name: 'identity',
              status: 'pass',
              state: 'healthy',
              detail: `signing keys readable from ${services.verifier.keySource}`,
            }
          : {
              name: 'identity',
              status: 'fail',
              state: 'key_source_unreachable',
              detail: `signing keys unreadable from ${services.verifier.keySource}`,
              reason: safeReason(identity.error),
            },
      );

      // The govtech registry is in-process, so this cannot fail for network
      // reasons — but an internally inconsistent capability board means the
      // status page would be lying about what the platform can do, and serving
      // that is worse than serving nothing.
      const board = services.govtech.statusBoard(adapterContext(services.clock.today()));
      checks.push(
        board.consistent
          ? {
              name: 'govtech_registry',
              status: 'pass',
              state: 'healthy',
              detail: `${board.reports.length} adapters, no capability defects`,
            }
          : {
              name: 'govtech_registry',
              status: 'fail',
              state: 'capability_defects',
              detail: `${board.defects.length} capability defects across ${board.reports.length} adapters`,
              reason: board.defects[0]?.message ?? 'capability report is internally inconsistent',
            },
      );

      const ready = checks.every((c) => c.status === 'pass');
      reply.code(ready ? 200 : 503);
      return { ready, asOf: services.clock.today(), checks };
    },
  );
}
