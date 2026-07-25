/**
 * Liveness and readiness, told honestly.
 *
 * `/health` answers one question: is this process running and able to serve a
 * response. It checks nothing else, deliberately — a liveness probe that fails
 * because the database is slow gets the container killed and restarted into the
 * same slow database, which turns a degradation into an outage.
 *
 * `/health/ready` actually calls its dependencies. A round trip to Postgres, a
 * real fetch of Janua's JWKS. It reports which check failed and returns 503, so a
 * load balancer stops sending traffic to an instance that would 401 every
 * authenticated request the moment its key cache expires. A readiness endpoint
 * that returns `{"ready": true}` unconditionally is worse than none: it removes
 * the operator's ability to tell a broken instance from a healthy one, while
 * looking like diligence.
 *
 * Both are public. Requiring a token to answer "are you alive" means the probe
 * needs a credential, and a credential in a probe config is a credential in a
 * place nobody rotates.
 */

import type { FastifyInstance } from 'fastify';

import { adapterContext } from '@meridian/govtech';

import type { AppServices } from '../services.js';
import { declare } from './helpers.js';

export type CheckStatus = 'pass' | 'fail';

export interface DependencyCheck {
  readonly name: string;
  readonly status: CheckStatus;
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
      checks.push(
        database.ok
          ? {
              name: 'database',
              status: 'pass',
              detail: `${services.repositories.kind} store answered a round trip`,
            }
          : {
              name: 'database',
              status: 'fail',
              detail: `${services.repositories.kind} store did not answer`,
              reason: safeReason(database.error),
            },
      );

      const identity = await services.verifier.checkKeySource();
      checks.push(
        identity.ok
          ? {
              name: 'identity',
              status: 'pass',
              detail: `signing keys readable from ${services.verifier.keySource}`,
            }
          : {
              name: 'identity',
              status: 'fail',
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
              detail: `${board.reports.length} adapters, no capability defects`,
            }
          : {
              name: 'govtech_registry',
              status: 'fail',
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
