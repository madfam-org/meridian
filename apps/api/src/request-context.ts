/**
 * What one authenticated request has access to.
 *
 * Assembled once, in the auth hook, from a verified token: the tenant is loaded,
 * the repositories are bound to its id, the audit writer is bound to the actor,
 * and `asOf` is fixed for the whole request. Handlers read it and never
 * re-derive any of it.
 *
 * Fixing `asOf` per request is not tidiness. A request that computes a Schengen
 * status against one date and writes an audit row stamped with another has
 * produced a figure nobody can reproduce, and at midnight UTC the two really do
 * differ.
 */

import { MeridianError, type IsoDate } from '@meridian/core';
import type { FastifyRequest } from 'fastify';

import type { AuthContext } from './auth/context.js';
import type { AuditWriter } from './audit/writer.js';
import type { Repositories, TenantRecord } from './repositories/types.js';

export interface RequestContext {
  readonly auth: AuthContext;
  readonly tenant: TenantRecord;
  /** Bound to `auth.tenantId`. There is no way to obtain another tenant's. */
  readonly repositories: Repositories;
  readonly audit: AuditWriter;
  /** The civil date this request is evaluated against. Fixed at the start. */
  readonly asOf: IsoDate;
}

/**
 * Read the context, or fail loudly.
 *
 * A missing context on a handler that needs one means the route was registered
 * with `access: 'public'` by mistake. That is a programming error, not a client
 * error, and it must not degrade into "treat the request as anonymous" — which
 * is how an unauthenticated caller ends up reading a matter.
 */
export function requestContext(request: FastifyRequest): RequestContext {
  const ctx = request.ctx;
  if (ctx === null || ctx === undefined) {
    throw new MeridianError(
      'INVALID_INPUT',
      'This route requires an authenticated context but was registered as public.',
      { url: request.url },
    );
  }
  return ctx;
}
