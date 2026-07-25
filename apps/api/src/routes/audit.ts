/**
 * Reading the append-only trail.
 *
 * Read-only by construction: `AuditRepository` has `append` and `list`, so there
 * is no method this route could call that would change a row even if someone
 * wanted it to. There is deliberately no `DELETE` and no `PATCH` here, and a
 * retention policy that eventually requires deletion belongs in a separate,
 * separately-authorised administrative path with its own trail — not as a verb
 * on the endpoint every caseworker already has.
 *
 * The filter that matters is `action=disclosure.downgraded`. That is the query a
 * regulator, or a firm's own compliance review, actually runs: show me every
 * time this platform computed a recommendation and refused to release it,
 * because the reader had nobody licensed standing behind it.
 *
 * Events are newest first. An audit reader is nearly always asking "what just
 * happened", and paginating from the oldest event of a busy tenant is a useless
 * default.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { parseOrThrow } from '../http/errors.js';
import { paginationSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import { declare, respond } from './helpers.js';

const auditQuerySchema = paginationSchema.extend({
  action: z.string().min(1).max(120).optional(),
  targetType: z.string().min(1).max(60).optional(),
  targetId: z.string().min(1).max(128).optional(),
});

/**
 * `disclosureClass`, not `classification`.
 *
 * The field name is load-bearing: the disclosure gate's leak detector treats a
 * `classification` property as evidence that ungated engine output is escaping,
 * and an audit row legitimately records what a reader was shown. Naming it
 * differently keeps the detector strict instead of forcing an exemption that
 * would then apply to everything.
 */
const auditEventOut = z.object({
  id: z.string(),
  occurredAt: z.string(),
  actorUserId: z.string(),
  actorRoles: z.array(z.string()),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  disclosureClass: z.enum(['information', 'assessment', 'advice']).nullable(),
  outcome: z.enum(['success', 'refused', 'failure']),
  detail: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export function registerAuditRoutes(app: FastifyInstance): void {
  app.get(
    '/v1/audit',
    declare({
      summary: 'The append-only audit trail for this tenant, newest first.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const query = parseOrThrow(auditQuerySchema, request.query, 'query');
      const events = await ctx.repositories.audit.list(query);
      return respond(z.object({ events: z.array(auditEventOut) }), { events });
    },
  );
}
