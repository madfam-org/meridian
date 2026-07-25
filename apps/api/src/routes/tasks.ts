/**
 * The task list for a matter.
 *
 * Tasks are checklist items with dependencies, and `@meridian/core` owns both
 * the unlocking rule and cycle detection. This file does not re-implement
 * either: it calls `unlockTasks` after anything that could change what is
 * reachable, and it calls `findTaskCycles` on read so a deadlocked checklist is
 * *reported* rather than silently presenting a list where nothing ever becomes
 * available.
 *
 * One rule is enforced here because it is about data integrity rather than
 * ordering: a task cannot be completed while something it depends on is not.
 * "Apostille the birth certificate" completed before "obtain the birth
 * certificate" is not a workflow state, it is a mistake, and accepting it means
 * the checklist stops describing reality.
 */

import { findTaskCycles, unlockTasks } from '@meridian/core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { WRITE_ROLES } from '../auth/context.js';
import { conflict, notFound, parseOrThrow } from '../http/errors.js';
import { isoDateSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { MATTER_PHASE_VALUES, declare, requireMatter, respond } from './helpers.js';

const taskStatusSchema = z.enum([
  'locked',
  'available',
  'in_progress',
  'submitted',
  'complete',
  'waived',
]);

const assigneeSchema = z.enum(['applicant', 'representative', 'employer', 'platform', 'authority']);

const newTaskSchema = z.object({
  phase: z.enum(MATTER_PHASE_VALUES),
  title: z.string().min(1).max(300),
  assignee: assigneeSchema,
  dependsOn: z.array(z.string().min(1)).max(50).optional(),
  dueOn: isoDateSchema.optional(),
  /**
   * Why this task exists at all. Required and non-empty: a step Meridian asks a
   * person to take is a step some rule demands, and a task with no cited basis
   * is one nobody can justify when the applicant asks why.
   */
  citationIds: z.array(z.string().min(1)).min(1).max(20),
});

const taskPatchSchema = z
  .object({
    status: taskStatusSchema.optional(),
    title: z.string().min(1).max(300).optional(),
    dueOn: isoDateSchema.nullable().optional(),
  })
  .refine((p) => Object.values(p).some((v) => v !== undefined), {
    message: 'a patch must change at least one field',
  });

const taskOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  matterId: z.string(),
  phase: z.enum(MATTER_PHASE_VALUES),
  title: z.string(),
  assignee: assigneeSchema,
  dependsOn: z.array(z.string()),
  status: taskStatusSchema,
  dueOn: z.string().optional(),
  citationIds: z.array(z.string()),
});

const taskParamsSchema = z.object({ id: z.string().min(1), taskId: z.string().min(1) });

/** Statuses that satisfy a dependency. Waived counts: someone decided it was not needed. */
const SATISFYING: readonly string[] = ['complete', 'waived'];

export function registerTaskRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/matters/:id/tasks',
    declare({
      summary: 'Tasks for a matter, with any dependency cycles reported.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(z.object({ id: z.string().min(1) }), request.params, 'params');
      const matter = await requireMatter(ctx, id);

      const stored = await ctx.repositories.tasks.listForMatter(id);
      const unlocked = unlockTasks(stored, matter.phase);
      const changed = unlocked
        .filter((t, i) => t.status !== stored[i]?.status)
        .map((t) => ({ id: t.id, status: t.status }));
      if (changed.length > 0) await ctx.repositories.tasks.applyStatuses(changed);

      // Reported, never repaired. A cycle is an authoring error in whatever
      // produced the checklist, and quietly dropping an edge to make the list
      // usable would hide the fault while changing what the checklist means.
      const cycles = findTaskCycles(unlocked);

      return respond(
        z.object({ tasks: z.array(taskOut), cycles: z.array(z.array(z.string())) }),
        { tasks: unlocked, cycles },
      );
    },
  );

  app.post(
    '/v1/matters/:id/tasks',
    declare({
      summary: 'Add a task to a matter.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(z.object({ id: z.string().min(1) }), request.params, 'params');
      const matter = await requireMatter(ctx, id);
      const body = parseOrThrow(newTaskSchema, request.body, 'body');

      const dependsOn = body.dependsOn ?? [];
      if (dependsOn.length > 0) {
        const existing = new Set((await ctx.repositories.tasks.listForMatter(id)).map((t) => t.id));
        const dangling = dependsOn.filter((d) => !existing.has(d));
        if (dangling.length > 0) {
          throw conflict('A task cannot depend on tasks that do not exist in this matter.', {
            dangling,
          });
        }
      }

      const created = await ctx.repositories.tasks.create({
        id: services.newId(),
        matterId: id,
        phase: body.phase,
        title: body.title,
        assignee: body.assignee,
        dependsOn,
        // Always born locked. `unlockTasks` decides what is reachable, so a
        // caller cannot hand itself an available task in a future phase.
        status: 'locked',
        citationIds: body.citationIds,
        ...(body.dueOn === undefined ? {} : { dueOn: body.dueOn }),
      });

      const all = await ctx.repositories.tasks.listForMatter(id);
      const unlocked = unlockTasks(all, matter.phase);
      const changed = unlocked
        .filter((t, i) => t.status !== all[i]?.status)
        .map((t) => ({ id: t.id, status: t.status }));
      if (changed.length > 0) await ctx.repositories.tasks.applyStatuses(changed);

      await ctx.audit.record({
        action: 'task.created',
        targetType: 'task',
        targetId: created.id,
        outcome: 'success',
        detail: { matterId: id, phase: created.phase, assignee: created.assignee },
      });

      reply.code(201);
      const stored = await ctx.repositories.tasks.get(created.id);
      return respond(taskOut, stored ?? created);
    },
  );

  app.patch(
    '/v1/matters/:id/tasks/:taskId',
    declare({
      summary: 'Change a task status, title, or due date.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id, taskId } = parseOrThrow(taskParamsSchema, request.params, 'params');
      const matter = await requireMatter(ctx, id);
      const patch = parseOrThrow(taskPatchSchema, request.body, 'body');

      const all = await ctx.repositories.tasks.listForMatter(id);
      const task = all.find((t) => t.id === taskId);
      if (task === undefined) throw notFound('task', taskId);

      if (patch.status === 'complete') {
        const byId = new Map(all.map((t) => [t.id, t]));
        const blocking = task.dependsOn.filter((depId) => {
          const dep = byId.get(depId);
          return dep === undefined || !SATISFYING.includes(dep.status);
        });
        if (blocking.length > 0) {
          throw conflict(
            'A task cannot be completed while a task it depends on is outstanding.',
            { blocking },
          );
        }
      }

      const updated = await ctx.repositories.tasks.update(taskId, patch);
      if (updated === null) throw notFound('task', taskId);

      const after = await ctx.repositories.tasks.listForMatter(id);
      const unlocked = unlockTasks(after, matter.phase);
      const changed = unlocked
        .filter((t, i) => t.status !== after[i]?.status)
        .map((t) => ({ id: t.id, status: t.status }));
      if (changed.length > 0) await ctx.repositories.tasks.applyStatuses(changed);

      await ctx.audit.record({
        action: 'task.updated',
        targetType: 'task',
        targetId: taskId,
        outcome: 'success',
        detail: {
          matterId: id,
          from: task.status,
          to: updated.status,
          tasksUnlocked: changed.length,
        },
      });

      const stored = await ctx.repositories.tasks.get(taskId);
      return respond(taskOut, stored ?? updated);
    },
  );
}
