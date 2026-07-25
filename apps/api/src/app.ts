/**
 * Assembly.
 *
 * `buildApp` wires an already-built {@link AppServices} into a Fastify instance
 * and constructs nothing of its own — no client, no clock, no key source. That
 * is what lets the test suite run the entire service, including auth and the
 * disclosure gate, against the in-memory adapter and a locally generated key
 * pair, exercising the same code path production does.
 *
 * Order is deliberate and load-bearing:
 *
 *   1. **The route registry first.** Its `onRoute` hook has to be installed
 *      before any route exists, including the preflight route `@fastify/cors`
 *      registers, or a route could slip in without declaring whether it emits
 *      engine output.
 *   2. **Security plugins, awaited.** `await register` loads them there and
 *      then, which fixes hook order: CORS answers a preflight before
 *      authentication runs, and the rate limiter counts a request before we
 *      spend a JWKS lookup on it.
 *   3. **Auth, then the disclosure gate, then routes.**
 *
 * Logging is configured with a redaction list rather than by trusting call
 * sites. Nothing in this service logs a request body, and the `Authorization`
 * header, cookies and the fields most likely to carry personal data are censored
 * before pino writes a line. Query strings are dropped from the logged URL
 * entirely: a query string is exactly where an id or a date of birth ends up
 * when somebody is in a hurry.
 */

import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { installAuth } from './auth/plugin.js';
import { installDisclosureGate } from './disclosure/plugin.js';
import { toErrorResponse } from './http/errors.js';
import { registerApplicantRoutes } from './routes/applicants.js';
import { registerAuditRoutes } from './routes/audit.js';
import { registerDocumentRoutes } from './routes/documents.js';
import { registerGovtechRoutes } from './routes/govtech.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerIdentityRoutes } from './routes/identity.js';
import { registerMatterRoutes } from './routes/matters.js';
import { registerPathwayRoutes } from './routes/pathways.js';
import { registerPresenceRoutes } from './routes/presence.js';
import { installRouteRegistry } from './routes/registry.js';
import { registerTaskRoutes } from './routes/tasks.js';
import { registerTenantRoutes } from './routes/tenants.js';
import type { AppServices } from './services.js';

/**
 * Fields censored wherever they appear in a log line.
 *
 * pino's `redact` walks the serialised object, so this catches a value that
 * reaches a log through a path nobody anticipated — which is the only kind that
 * matters, since the anticipated paths are the ones already avoided.
 */
export const REDACTED_LOG_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["proxy-authorization"]',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'mrz',
  '*.mrz',
  '*.token',
  '*.accessToken',
  '*.givenNames',
  '*.familyNames',
  '*.fullName',
  '*.subjectFullName',
  '*.dateOfBirth',
  '*.documentNumber',
  '*.licenceNumber',
  '*.identityDocumentNumber',
];

function loggerOptions(services: AppServices): FastifyServerOptions['logger'] {
  return {
    level: services.config.LOG_LEVEL,
    redact: { paths: [...REDACTED_LOG_PATHS], censor: '[redacted]' },
    serializers: {
      req(request: { method: string; url: string; id?: string }) {
        // Path only. A query string is where an applicant id or a date of birth
        // ends up, and access logs outlive the request by years.
        const path = request.url.split('?')[0] ?? request.url;
        return { id: request.id, method: request.method, path };
      },
      res(reply: { statusCode: number }) {
        return { statusCode: reply.statusCode };
      },
    },
  };
}

export interface BuildAppOptions {
  readonly services: AppServices;
  /** Overrides the derived logger. Tests pass `false`. */
  readonly logger?: FastifyServerOptions['logger'];
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { services } = options;

  const app = Fastify({
    logger: options.logger ?? loggerOptions(services),
    // Generous enough for a presence ledger batch, small enough that a body is
    // never a memory-exhaustion vector. No route here accepts a file.
    bodyLimit: 1_048_576,
    trustProxy: services.config.TRUST_PROXY,
  });

  const routes = installRouteRegistry(app);
  app.decorate('meridian', { services, routes });

  await app.register(helmet, {
    // No route serves HTML, so a permissive CSP would be pointless and a strict
    // one costs nothing.
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  });

  await app.register(cors, {
    /**
     * Allowlist only. `origin: true` reflects whatever the caller sent, which on
     * a credentialed API means any page on the internet can act as a logged-in
     * caseworker. The config parser already refuses a wildcard, so this cannot
     * be widened by environment either.
     */
    origin(origin, callback) {
      // No Origin header: a server-to-server call or a same-origin request.
      // There is no browser to protect, so there is nothing to refuse.
      if (origin === undefined) {
        callback(null, true);
        return;
      }
      callback(null, services.config.CORS_ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['authorization', 'content-type'],
    exposedHeaders: ['x-meridian-disclosure', 'x-meridian-disclosure-gate'],
    maxAge: 600,
  });

  await app.register(rateLimit, {
    max: services.config.RATE_LIMIT_MAX,
    timeWindow: services.config.RATE_LIMIT_WINDOW,
    // Per authenticated user where possible, per address otherwise. Keyed on the
    // token's subject rather than the raw header so the key is not a credential.
    keyGenerator(request) {
      return request.ctx?.auth.userId ?? request.ip;
    },
  });

  installAuth(app, services);
  installDisclosureGate(app);

  registerHealthRoutes(app, services);
  registerTenantRoutes(app, services);
  registerApplicantRoutes(app, services);
  registerMatterRoutes(app, services);
  registerTaskRoutes(app, services);
  registerPresenceRoutes(app, services);
  registerDocumentRoutes(app, services);
  registerPathwayRoutes(app, services);
  registerIdentityRoutes(app);
  registerGovtechRoutes(app, services);
  registerAuditRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    const { status, body } = toErrorResponse(error);
    if (status >= 500) {
      request.log.error({ err: error, code: body.error.code }, 'request failed');
    } else {
      // Refusals are expected traffic — an expired token, a wrong id, an illegal
      // document transition. Logged, not alarmed on.
      request.log.warn({ code: body.error.code, status }, 'request refused');
    }
    reply.code(status).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND' as const, message: `No route for ${request.method} ${request.url}.` },
    });
  });

  // Deliberately not booted here. The security plugins are already loaded — each
  // `register` above is awaited — and route registration is synchronous, so
  // there is nothing left to fail eagerly. Leaving the instance unbooted lets a
  // caller add a route before start, which the disclosure suite needs in order
  // to prove that a *misdeclared* route is refused. `listen` and `inject` both
  // boot on their own.
  return app;
}
