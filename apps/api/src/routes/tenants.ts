/**
 * Tenants and the representatives attached to them.
 *
 * There is no `GET /v1/tenants`. A caller can read *their* tenant and nothing
 * else, because a list of tenants is a list of a competitor's clients, and the
 * only party who would ever legitimately want one is running platform
 * operations from a different tool.
 *
 * Representatives are the input to the advice boundary: attaching one is what
 * moves a matter from "assessment only" to "may receive a recommendation". So
 * every field the gate reads — jurisdiction, licence number, expiry — is
 * mandatory here, and `verifiedOn` records when a human last checked the licence
 * against the regulator's public register. A representative record nobody has
 * verified is a representative record that will eventually authorise advice on a
 * lapsed licence.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { conflict, parseOrThrow } from '../http/errors.js';
import { isoDateSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { TENANT_ADMIN_ROLES } from '../auth/context.js';
import { declare, respond } from './helpers.js';

const tenantKindSchema = z.enum(['firm', 'individual', 'corporate', 'madfam_represented']);

const credentialSchema = z.enum([
  'rcic',
  'canadian_lawyer',
  'canadian_paralegal',
  'quebec_notary',
  'spanish_abogado',
  'spanish_gestor',
  'other_regulated',
]);

const newTenantSchema = z.object({
  id: z.string().min(1).max(128),
  kind: tenantKindSchema,
  displayName: z.string().min(1).max(200),
  /** ISO 3166-1 alpha-2 of the tenant's own seat, for data-residency routing. */
  homeJurisdiction: z.string().regex(/^[A-Z]{2}$/, 'expected an ISO 3166-1 alpha-2 code'),
});

const newRepresentativeSchema = z.object({
  jurisdiction: z.string().regex(/^[A-Z]{2}$/, 'expected an ISO 3166-1 alpha-2 code'),
  credential: credentialSchema,
  /** As it appears in the regulator's public register. Public data, not a credential. */
  licenceNumber: z.string().min(1).max(120),
  verifiedOn: isoDateSchema,
  expiresOn: isoDateSchema.optional(),
});

const representativeOut = z.object({
  id: z.string(),
  jurisdiction: z.string(),
  credential: credentialSchema,
  licenceNumber: z.string(),
  verifiedOn: z.string(),
  expiresOn: z.string().optional(),
});

const tenantOut = z.object({
  id: z.string(),
  kind: tenantKindSchema,
  displayName: z.string(),
  homeJurisdiction: z.string(),
  representatives: z.array(representativeOut),
});

export function registerTenantRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/tenants/me',
    declare({
      summary: 'The calling tenant, with its representatives.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      return respond(tenantOut, ctx.tenant);
    },
  );

  app.post(
    '/v1/tenants',
    declare({
      summary: 'Create a tenant. Platform operations only.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: ['platform_admin'],
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(newTenantSchema, request.body, 'body');

      const existing = await services.repositories.tenants.get(body.id);
      if (existing !== null) {
        throw conflict(`A tenant with id ${JSON.stringify(body.id)} already exists.`);
      }

      const created = await services.repositories.tenants.create(body);
      await ctx.audit.record({
        action: 'tenant.created',
        targetType: 'tenant',
        targetId: created.id,
        outcome: 'success',
        detail: { kind: created.kind, homeJurisdiction: created.homeJurisdiction },
      });

      reply.code(201);
      return respond(tenantOut, created);
    },
  );

  app.get(
    '/v1/tenants/me/representatives',
    declare({
      summary: 'Representatives this tenant may attach to matters.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const representatives = await ctx.repositories.representatives.list();
      return respond(z.object({ representatives: z.array(representativeOut) }), {
        representatives,
      });
    },
  );

  app.post(
    '/v1/tenants/me/representatives',
    declare({
      summary: 'Attach a verified representative to this tenant.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: TENANT_ADMIN_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(newRepresentativeSchema, request.body, 'body');

      if (body.expiresOn !== undefined && body.expiresOn < body.verifiedOn) {
        throw conflict('A representative cannot expire before the date its licence was verified.');
      }

      const created = await ctx.repositories.representatives.add({
        id: services.newId(),
        jurisdiction: body.jurisdiction,
        credential: body.credential,
        licenceNumber: body.licenceNumber,
        verifiedOn: body.verifiedOn,
        ...(body.expiresOn === undefined ? {} : { expiresOn: body.expiresOn }),
      });

      await ctx.audit.record({
        action: 'representative.attached',
        targetType: 'representative',
        targetId: created.id,
        outcome: 'success',
        // The licence number is public register data, but it is still an
        // identifier for a named professional and the trail is never deleted.
        // Jurisdiction and credential type are enough to explain the event.
        detail: { jurisdiction: created.jurisdiction, credential: created.credential },
      });

      reply.code(201);
      return respond(representativeOut, created);
    },
  );
}
