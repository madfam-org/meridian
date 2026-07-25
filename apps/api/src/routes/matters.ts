/**
 * Matters, and the phase model that gates their work.
 *
 * The phase transition endpoint is the interesting one. Phases are sequential —
 * intake, identity validation, document assembly, submission, post-arrival,
 * status transition — and the sequence is what makes a checklist trustworthy: a
 * task in a later phase stays locked while an earlier phase has open work, so a
 * caseworker is never shown a step they cannot yet take.
 *
 * Two rules follow, and both are enforced here rather than left to the client:
 *
 *   - **Forward one at a time.** Jumping from intake to submission would skip
 *     identity validation, which means filing on a document nobody checked.
 *     Skipping is refused, not warned about.
 *   - **Backward freely, and recorded.** Work genuinely does go back: a document
 *     is rejected, a status lapses. Moving back is allowed with a reason, and
 *     the reason goes in the audit trail, because "why did this matter reopen"
 *     is a question that gets asked months later.
 *
 * Terminal statuses — granted, refused, withdrawn, abandoned — freeze the
 * matter. Core's `isTerminal` decides that, not a list retyped here.
 */

import { isTerminal, phaseIndex, unlockTasks, type MatterPhase } from '@meridian/core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { WRITE_ROLES } from '../auth/context.js';
import { conflict, notFound, parseOrThrow } from '../http/errors.js';
import { countryCodeSchema, idParamSchema, isoDateSchema, paginationSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { MATTER_PHASE_VALUES, declare, requireMatter, respond } from './helpers.js';

const matterStatusSchema = z.enum([
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
]);

const matterPhaseSchema = z.enum(MATTER_PHASE_VALUES);

const newMatterSchema = z.object({
  applicantId: z.string().min(1),
  pathwayId: z.string().min(1),
  targetJurisdiction: countryCodeSchema,
  /**
   * The nationality the applicant actually entered and applied under. Required,
   * with no default: inferring it from the applicant's list is exactly the
   * inference that costs a dual national their reduced-residency route.
   */
  claimedNationality: countryCodeSchema,
  openedOn: isoDateSchema.optional(),
  representativeId: z.string().min(1).nullable().optional(),
});

const matterPatchSchema = z
  .object({
    status: matterStatusSchema.optional(),
    representativeId: z.string().min(1).nullable().optional(),
    closedOn: isoDateSchema.nullable().optional(),
  })
  .refine((p) => Object.values(p).some((v) => v !== undefined), {
    message: 'a patch must change at least one field',
  });

const phaseTransitionSchema = z.object({
  to: matterPhaseSchema,
  /** Required when moving backwards. See the module note. */
  reason: z.string().min(1).max(500).optional(),
});

const matterListQuerySchema = paginationSchema.extend({
  status: matterStatusSchema.optional(),
  phase: matterPhaseSchema.optional(),
  applicantId: z.string().min(1).optional(),
});

const matterOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  applicantId: z.string(),
  pathwayId: z.string(),
  targetJurisdiction: z.string(),
  claimedNationality: z.string(),
  status: matterStatusSchema,
  phase: matterPhaseSchema,
  openedOn: z.string(),
  closedOn: z.string().optional(),
  representativeId: z.string().nullable(),
});

export function registerMatterRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/matters',
    declare({ summary: 'List matters.', engineOutput: false, access: 'authenticated' }),
    async (request) => {
      const ctx = requestContext(request);
      const query = parseOrThrow(matterListQuerySchema, request.query, 'query');
      const matters = await ctx.repositories.matters.list(
        {
          ...(query.status === undefined ? {} : { status: query.status }),
          ...(query.phase === undefined ? {} : { phase: query.phase }),
          ...(query.applicantId === undefined ? {} : { applicantId: query.applicantId }),
        },
        { limit: query.limit, offset: query.offset },
      );
      return respond(z.object({ matters: z.array(matterOut) }), { matters });
    },
  );

  app.post(
    '/v1/matters',
    declare({
      summary: 'Open a matter.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(newMatterSchema, request.body, 'body');

      const applicant = await ctx.repositories.applicants.get(body.applicantId);
      if (applicant === null) throw notFound('applicant', body.applicantId);
      if (!applicant.nationalities.includes(body.claimedNationality)) {
        throw conflict(
          'claimedNationality must be one of the nationalities the applicant holds.',
          { claimedNationality: body.claimedNationality },
        );
      }

      const representativeId = body.representativeId ?? null;
      if (representativeId !== null) {
        const representative = await ctx.repositories.representatives.get(representativeId);
        if (representative === null) throw notFound('representative', representativeId);
      }

      const created = await ctx.repositories.matters.create({
        id: services.newId(),
        applicantId: body.applicantId,
        pathwayId: body.pathwayId,
        targetJurisdiction: body.targetJurisdiction,
        claimedNationality: body.claimedNationality,
        status: 'draft',
        phase: 'intake',
        openedOn: body.openedOn ?? ctx.asOf,
        representativeId,
      });

      await ctx.audit.record({
        action: 'matter.created',
        targetType: 'matter',
        targetId: created.id,
        outcome: 'success',
        detail: {
          pathwayId: created.pathwayId,
          targetJurisdiction: created.targetJurisdiction,
          representativeAttached: created.representativeId !== null,
        },
      });

      reply.code(201);
      return respond(matterOut, created);
    },
  );

  app.get(
    '/v1/matters/:id',
    declare({ summary: 'Read one matter.', engineOutput: false, access: 'authenticated' }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(idParamSchema, request.params, 'params');
      return respond(matterOut, await requireMatter(ctx, id));
    },
  );

  app.patch(
    '/v1/matters/:id',
    declare({
      summary: 'Change a matter status, representative, or closure date.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(idParamSchema, request.params, 'params');
      const patch = parseOrThrow(matterPatchSchema, request.body, 'body');
      const matter = await requireMatter(ctx, id);

      if (isTerminal(matter.status) && patch.status === undefined) {
        throw conflict(
          `Matter ${id} is ${matter.status}; reopen it by setting a non-terminal status first.`,
        );
      }
      if (patch.representativeId !== undefined && patch.representativeId !== null) {
        const representative = await ctx.repositories.representatives.get(patch.representativeId);
        if (representative === null) throw notFound('representative', patch.representativeId);
      }

      const updated = await ctx.repositories.matters.update(id, patch);
      if (updated === null) throw notFound('matter', id);

      await ctx.audit.record({
        action: 'matter.updated',
        targetType: 'matter',
        targetId: id,
        outcome: 'success',
        detail: {
          fields: Object.keys(patch).sort().join(','),
          status: updated.status,
          // Whether a representative is attached is the fact the advice boundary
          // turns on, so every change to it is legible in the trail.
          representativeAttached: updated.representativeId !== null,
        },
      });
      return respond(matterOut, updated);
    },
  );

  app.post(
    '/v1/matters/:id/phase',
    declare({
      summary: 'Advance or correct the matter phase, re-running task unlocking.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(idParamSchema, request.params, 'params');
      const body = parseOrThrow(phaseTransitionSchema, request.body, 'body');
      const matter = await requireMatter(ctx, id);

      if (isTerminal(matter.status)) {
        throw conflict(`Matter ${id} is ${matter.status}; its phase cannot change.`);
      }

      const from: MatterPhase = matter.phase;
      const to: MatterPhase = body.to;
      const delta = phaseIndex(to) - phaseIndex(from);

      if (delta === 0) throw conflict(`Matter ${id} is already in phase ${from}.`);
      if (delta > 1) {
        throw conflict(
          `Cannot advance from ${from} to ${to}: phases are sequential, and skipping one skips ` +
            'the work it gates. Advance one phase at a time.',
          { from, to },
        );
      }
      if (delta < 0 && body.reason === undefined) {
        throw conflict(
          `Moving a matter back from ${from} to ${to} requires a reason, which is recorded.`,
          { from, to },
        );
      }

      const updated = await ctx.repositories.matters.update(id, { phase: to });
      if (updated === null) throw notFound('matter', id);

      // Re-run unlocking against the new phase. `unlockTasks` honours both the
      // phase ordering and each task's explicit dependencies, so this is the
      // whole rule rather than a re-implementation of half of it.
      const tasks = await ctx.repositories.tasks.listForMatter(id);
      const unlocked = unlockTasks(tasks, to);
      const changed = unlocked
        .filter((t, i) => t.status !== tasks[i]?.status)
        .map((t) => ({ id: t.id, status: t.status }));
      if (changed.length > 0) await ctx.repositories.tasks.applyStatuses(changed);

      await ctx.audit.record({
        action: delta > 0 ? 'matter.phase.advanced' : 'matter.phase.reverted',
        targetType: 'matter',
        targetId: id,
        outcome: 'success',
        detail: {
          from,
          to,
          tasksUnlocked: changed.length,
          ...(body.reason === undefined ? {} : { reason: body.reason }),
        },
      });

      return respond(z.object({ matter: matterOut, tasksUnlocked: z.number() }), {
        matter: updated,
        tasksUnlocked: changed.length,
      });
    },
  );
}
