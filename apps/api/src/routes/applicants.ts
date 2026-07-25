/**
 * Applicants.
 *
 * `nationalities` and `claimedNationality` are separate fields, and the API
 * keeps them separate all the way to storage. Spain's reduced-residency route is
 * conferred on nationals of named states; a dual national who entered and holds
 * residence on the *other* passport cannot claim it. An API that accepted a list
 * and let the engine pick the most favourable member would be building the bug
 * that costs someone eight extra years of residence.
 *
 * Names are optional. A firm that keeps identity in its own practice-management
 * system should not be made to duplicate personal data here to use the engine.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { WRITE_ROLES } from '../auth/context.js';
import { conflict, notFound, parseOrThrow } from '../http/errors.js';
import { countryCodeSchema, idParamSchema, isoDateSchema, paginationSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { declare, respond } from './helpers.js';

const newApplicantSchema = z.object({
  reference: z.string().min(1).max(120).optional(),
  givenNames: z.string().min(1).max(200).optional(),
  familyNames: z.string().min(1).max(200).optional(),
  nationalities: z.array(countryCodeSchema).min(1).max(10),
  claimedNationality: countryCodeSchema.optional(),
  dateOfBirth: isoDateSchema.optional(),
});

const applicantPatchSchema = newApplicantSchema.partial().refine(
  (patch) => Object.values(patch).some((v) => v !== undefined),
  { message: 'a patch must change at least one field' },
);

const applicantOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  reference: z.string().optional(),
  givenNames: z.string().optional(),
  familyNames: z.string().optional(),
  nationalities: z.array(z.string()),
  claimedNationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

/**
 * A claimed nationality the applicant does not hold is a data error, not a legal
 * question — and catching it here is the difference between a rejected form and
 * an application filed under a nationality that cannot support it.
 */
function assertClaimedIsHeld(
  claimed: string | undefined,
  held: readonly string[],
): void {
  if (claimed !== undefined && !held.includes(claimed)) {
    throw conflict(
      'claimedNationality must be one of the nationalities the applicant holds.',
      { claimedNationality: claimed, nationalities: held },
    );
  }
}

export function registerApplicantRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/applicants',
    declare({
      summary: 'List applicants in this tenant.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const page = parseOrThrow(paginationSchema, request.query, 'query');
      const applicants = await ctx.repositories.applicants.list(page);
      return respond(z.object({ applicants: z.array(applicantOut) }), { applicants });
    },
  );

  app.post(
    '/v1/applicants',
    declare({
      summary: 'Create an applicant.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(newApplicantSchema, request.body, 'body');
      assertClaimedIsHeld(body.claimedNationality, body.nationalities);

      const created = await ctx.repositories.applicants.create({ id: services.newId(), ...body });
      await ctx.audit.record({
        action: 'applicant.created',
        targetType: 'applicant',
        targetId: created.id,
        outcome: 'success',
        // Counts and codes, never names or a date of birth.
        detail: { nationalityCount: created.nationalities.length },
      });

      reply.code(201);
      return respond(applicantOut, created);
    },
  );

  app.get(
    '/v1/applicants/:id',
    declare({
      summary: 'Read one applicant.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(idParamSchema, request.params, 'params');
      const applicant = await ctx.repositories.applicants.get(id);
      if (applicant === null) throw notFound('applicant', id);
      return respond(applicantOut, applicant);
    },
  );

  app.patch(
    '/v1/applicants/:id',
    declare({
      summary: 'Amend an applicant.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(idParamSchema, request.params, 'params');
      const patch = parseOrThrow(applicantPatchSchema, request.body, 'body');

      const current = await ctx.repositories.applicants.get(id);
      if (current === null) throw notFound('applicant', id);

      const nationalities = patch.nationalities ?? current.nationalities;
      const claimed = patch.claimedNationality ?? current.claimedNationality;
      assertClaimedIsHeld(claimed, nationalities);

      const updated = await ctx.repositories.applicants.update(id, patch);
      if (updated === null) throw notFound('applicant', id);

      await ctx.audit.record({
        action: 'applicant.updated',
        targetType: 'applicant',
        targetId: id,
        outcome: 'success',
        detail: { fields: Object.keys(patch).sort().join(',') },
      });
      return respond(applicantOut, updated);
    },
  );
}
