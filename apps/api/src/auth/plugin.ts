/**
 * Authentication, and the assembly of the per-request context.
 *
 * One `onRequest` hook does the whole job: read the bearer token, verify it,
 * load the tenant it names, bind the repositories to that tenant, and attach an
 * audit writer bound to the actor. From that point on, no handler in this
 * service ever sees a tenant id it could have chosen.
 *
 * Note the order of the role check: the context is attached *before* roles are
 * tested, so a `403` still has an audit writer to record itself with. A refusal
 * nobody wrote down is a refusal nobody can investigate.
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';

import { createAuditWriter } from '../audit/writer.js';
import { forbidden, unauthenticated } from '../http/errors.js';
import type { AppServices } from '../services.js';
import { hasAnyRole } from './context.js';

/** `Authorization: Bearer <token>`, case-insensitively on the scheme. */
function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = /^bearer[ ]+(.+)$/i.exec(header.trim());
  return match === null ? null : (match[1] ?? null);
}

export function installAuth(app: FastifyInstance, services: AppServices): void {
  // Fastify 5 refuses reference-typed request decorators to stop instances
  // sharing one object; `null` plus assignment in the hook is the documented way.
  app.decorateRequest('ctx', null);

  app.addHook('onRequest', async (request) => {
    const config = request.routeOptions.config?.meridian;

    // No config means no route matched — Fastify is on its way to the 404
    // handler. Requiring a token to be told a URL does not exist would be
    // theatre, and it would break every uptime check.
    if (config === undefined) return;
    if (config.access === 'public') return;

    const token = bearerToken(request);
    if (token === null) {
      throw unauthenticated('An Authorization: Bearer token is required.', {
        reason: 'missing_token',
      });
    }

    const verified = await services.verifier.verify(token);
    if (!verified.ok) throw verified.error;
    const auth = verified.value;

    // A token naming a tenant this deployment has never heard of is not an
    // authorisation failure to explain to the caller — it is a token for another
    // installation, or a tenant that has been removed.
    const tenant = await services.repositories.tenants.get(auth.tenantId);
    if (tenant === null) {
      throw unauthenticated('The presented token was not accepted.', { reason: 'unknown_tenant' });
    }

    const repositories = services.repositories.forTenant(auth.tenantId);
    request.ctx = {
      auth,
      tenant,
      repositories,
      audit: createAuditWriter(repositories.audit, auth, services.clock, services.newId),
      asOf: services.clock.today(),
    };

    if (config.requiredRoles !== undefined && !hasAnyRole(auth, config.requiredRoles)) {
      await request.ctx.audit.record({
        action: 'access.refused',
        targetType: 'route',
        targetId: `${request.method} ${request.routeOptions.url ?? request.url}`,
        outcome: 'refused',
        detail: { requiredRoles: config.requiredRoles.join(','), heldRoles: auth.roles.join(',') },
      });
      throw forbidden('Your roles do not permit this operation.', {
        requiredRoles: config.requiredRoles,
      });
    }
  });
}
