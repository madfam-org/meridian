/**
 * The presence ledger, and the day counts derived from it.
 *
 * Every count here is an *assessment*: the applicant's own recorded stays,
 * measured against a cited rule, with the arithmetic shown. `@meridian/presence`
 * returns the de-duplicated ranges and the per-stay attribution alongside each
 * total, and this API passes them through untouched. A figure a person cannot
 * reconstruct is a figure they cannot defend to an officer.
 *
 * Nothing here recommends. "You have used 87 of your 90 days" is an assessment;
 * "you should leave before the 3rd" is advice, and it belongs to someone
 * licensed to give it. The engine deliberately offers no function that says the
 * second thing, so there is no endpoint here that could.
 *
 * Two details that would otherwise be easy to get wrong:
 *
 *   - **Open stays are closed at an explicit date, never at "now".** The ledger
 *     is built with `openStaysEndOn: asOf`, the imputed end is flagged
 *     `openEnded`, and the record itself keeps `end: null`. Writing the imputed
 *     date back into storage would launder a guess into a fact.
 *   - **`exemptFromSchengenShortStay` is a per-stay flag with a narrow meaning.**
 *     It marks days in the State that issued the traveller's own residence
 *     permit or long-stay visa, which are not short-stay days. Days in *other*
 *     Schengen States on the strength of that permit are still short stays. The
 *     API takes the flag rather than inferring it, because the inference needs a
 *     fact about the permit that no stay record carries.
 */

import {
  dateRange,
  disclosable,
  maxDisclosureOf,
  type DisclosureClass,
  type IsoDate,
} from '@meridian/core';
import {
  CONTINUITY_POLICIES,
  TAX_DAY_COUNT_THRESHOLDS,
  assessContinuousResidence,
  assessDayCountThreshold,
  assessSchengenStatus,
  buildLedger,
  detectInconsistencies,
  type DayCountEvaluation,
  type StayInput,
} from '@meridian/presence';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { WRITE_ROLES } from '../auth/context.js';
import { engineOutput } from '../disclosure/envelope.js';
import { conflict, notFound, parseOrThrow } from '../http/errors.js';
import { asOfQuerySchema, countryCodeSchema, isoDateSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { RequestContext } from '../request-context.js';
import type { StayRecord } from '../repositories/types.js';
import type { AppServices } from '../services.js';
import { declare, requireMatter, resolveAsOf, respond } from './helpers.js';

const matterParams = z.object({ id: z.string().min(1) });
const stayParams = z.object({ id: z.string().min(1), stayId: z.string().min(1) });

const sourceSchema = z.enum(['border_stamp', 'gps', 'declared', 'itinerary', 'inferred']);
const confidenceSchema = z.enum(['confirmed', 'probable', 'assumed']);

const stayInputSchema = z
  .object({
    country: countryCodeSchema,
    /** Inclusive first day of presence. */
    start: isoDateSchema,
    /** Inclusive last day, or null while the stay is open. */
    end: isoDateSchema.nullable(),
    source: sourceSchema,
    confidence: confidenceSchema,
    exemptFromSchengenShortStay: z.boolean().optional(),
  })
  .refine((s) => s.end === null || s.start <= s.end, {
    message: 'a stay cannot end before it starts',
  });

const newStaysSchema = z.object({ stays: z.array(stayInputSchema).min(1).max(200) });

const stayOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  matterId: z.string(),
  country: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  source: sourceSchema,
  confidence: confidenceSchema,
  exemptFromSchengenShortStay: z.boolean(),
});

/** Records to engine inputs. The imputed close happens in `buildLedger`, not here. */
function toStayInputs(records: readonly StayRecord[]): StayInput[] {
  return records.map((r) => ({
    id: r.id,
    country: r.country,
    start: r.start,
    end: r.end,
    source: r.source,
    confidence: r.confidence,
    exemptFromSchengenShortStay: r.exemptFromSchengenShortStay,
  }));
}

async function ledgerFor(ctx: RequestContext, matterId: string, asOf: IsoDate) {
  const records = await ctx.repositories.stays.listForMatter(matterId);
  return buildLedger(toStayInputs(records), { openStaysEndOn: asOf });
}

export function registerPresenceRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/matters/:id/presence/stays',
    declare({
      summary: 'The recorded stays for a matter.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      await requireMatter(ctx, id);
      const stays = await ctx.repositories.stays.listForMatter(id);
      return respond(z.object({ stays: z.array(stayOut) }), { stays });
    },
  );

  app.post(
    '/v1/matters/:id/presence/stays',
    declare({
      summary: 'Record stays on the presence ledger.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      await requireMatter(ctx, id);
      const body = parseOrThrow(newStaysSchema, request.body, 'body');

      const created = await ctx.repositories.stays.createMany(
        body.stays.map((s) => ({
          id: services.newId(),
          matterId: id,
          country: s.country,
          start: s.start,
          end: s.end,
          source: s.source,
          confidence: s.confidence,
          exemptFromSchengenShortStay: s.exemptFromSchengenShortStay ?? false,
        })),
      );

      // Building the ledger validates the whole set: duplicate ids, inverted
      // ranges, an open stay that starts after the date it would be closed at.
      // Doing it after the write means a bad batch is reported rather than
      // silently producing a ledger that no query will ever agree with.
      await ledgerFor(ctx, id, ctx.asOf);

      await ctx.audit.record({
        action: 'presence.stays.recorded',
        targetType: 'matter',
        targetId: id,
        outcome: 'success',
        detail: {
          count: created.length,
          countries: [...new Set(created.map((s) => s.country))].sort().join(','),
          openEnded: created.filter((s) => s.end === null).length,
        },
      });

      reply.code(201);
      return respond(z.object({ stays: z.array(stayOut) }), { stays: created });
    },
  );

  app.delete(
    '/v1/matters/:id/presence/stays/:stayId',
    declare({
      summary: 'Remove a mis-recorded stay.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id, stayId } = parseOrThrow(stayParams, request.params, 'params');
      await requireMatter(ctx, id);

      const stay = await ctx.repositories.stays.get(stayId);
      if (stay === null || stay.matterId !== id) throw notFound('stay', stayId);
      await ctx.repositories.stays.remove(stayId);

      await ctx.audit.record({
        action: 'presence.stay.removed',
        targetType: 'stay',
        targetId: stayId,
        outcome: 'success',
        // The dates go in: a deleted stay changes every count derived from the
        // ledger, and the trail has to explain why a total moved.
        detail: { matterId: id, country: stay.country, start: stay.start, end: stay.end },
      });

      return respond(z.object({ removed: z.string() }), { removed: stayId });
    },
  );

  app.get(
    '/v1/matters/:id/presence/inconsistencies',
    declare({
      summary: 'Contradictions in the recorded ledger. A data-quality report, not a legal finding.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      const query = parseOrThrow(asOfQuerySchema, request.query, 'query');
      await requireMatter(ctx, id);
      const asOf = resolveAsOf(ctx, query.asOf);

      // Not engine output: it applies no rule and cites none. It reports that
      // the person's own record contradicts itself — two countries on one
      // Tuesday, days nobody accounts for — which is a data finding. Wrapping it
      // as an assessment would mean shipping an assessment with no citation,
      // which core calls a defect.
      const ledger = await ledgerFor(ctx, id, asOf);
      const inconsistencies = detectInconsistencies(ledger, { asOf });
      return respond(z.object({ asOf: z.string(), inconsistencies: z.array(z.unknown()) }), {
        asOf,
        inconsistencies,
      });
    },
  );

  app.get(
    '/v1/matters/:id/presence/schengen',
    declare({
      summary: 'Schengen 90/180 position on a date.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      const query = parseOrThrow(asOfQuerySchema, request.query, 'query');
      const matter = await requireMatter(ctx, id);
      const asOf = resolveAsOf(ctx, query.asOf);

      const ledger = await ledgerFor(ctx, id, asOf);
      return engineOutput({
        subject: 'schengen_status',
        disclosable: assessSchengenStatus(ledger, asOf),
        jurisdiction: matter.targetJurisdiction,
        matterId: id,
      });
    },
  );

  app.get(
    '/v1/matters/:id/presence/tax-residency',
    declare({
      summary: 'Day counts against catalogued tax-residence thresholds.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      const query = parseOrThrow(
        asOfQuerySchema.extend({ thresholdId: z.string().min(1).optional() }),
        request.query,
        'query',
      );
      const matter = await requireMatter(ctx, id);
      const asOf = resolveAsOf(ctx, query.asOf);

      const thresholds =
        query.thresholdId === undefined
          ? TAX_DAY_COUNT_THRESHOLDS.filter((t) => t.country === matter.targetJurisdiction)
          : TAX_DAY_COUNT_THRESHOLDS.filter((t) => t.id === query.thresholdId);

      if (query.thresholdId !== undefined && thresholds.length === 0) {
        throw notFound('day-count threshold', query.thresholdId);
      }

      const ledger = await ledgerFor(ctx, id, asOf);
      const assessments = thresholds.map((t) => assessDayCountThreshold(ledger, t, asOf));

      // Combined with `maxDisclosureOf` rather than assumed: if a future
      // threshold ever arrives at a higher classification, the combined output
      // rises with it instead of being released at the lowest member's level.
      const classification: DisclosureClass = maxDisclosureOf(
        assessments.map((a) => a.classification),
      );
      const citationIds = [...new Set(assessments.flatMap((a) => a.citationIds))].sort();
      const evaluations: DayCountEvaluation[] = assessments.map((a) => a.value);

      return engineOutput({
        subject: 'tax_day_count',
        disclosable: disclosable(
          classification,
          {
            asOf,
            country: matter.targetJurisdiction,
            evaluations,
            ...(evaluations.length === 0
              ? {
                  note:
                    `No day-count threshold is catalogued for ${matter.targetJurisdiction}. ` +
                    'That is a gap in the catalog, not a finding that no threshold exists.',
                }
              : {}),
          },
          citationIds,
        ),
        jurisdiction: matter.targetJurisdiction,
        matterId: id,
      });
    },
  );

  app.get(
    '/v1/matters/:id/presence/continuity',
    declare({
      summary: 'Absences measured against a continuous-residence policy.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      const query = parseOrThrow(
        z.object({
          start: isoDateSchema,
          end: isoDateSchema,
          policyId: z.string().min(1).optional(),
        }),
        request.query,
        'query',
      );
      const matter = await requireMatter(ctx, id);

      if (query.start > query.end) {
        throw conflict('The residence window start must not be after its end.');
      }

      const policy =
        query.policyId === undefined
          ? CONTINUITY_POLICIES.find((p) => p.country === matter.targetJurisdiction)
          : CONTINUITY_POLICIES.find((p) => p.id === query.policyId);

      if (policy === undefined) {
        throw notFound(
          'continuity policy',
          query.policyId ?? `for jurisdiction ${matter.targetJurisdiction}`,
        );
      }

      // The window can end after `asOf` — an applicant asking what a planned
      // absence would do to a period that has not finished is the normal case.
      // Open stays are still closed at `asOf`, so the tail of such a window reads
      // as absence, which overstates time away. That is the safe direction, and
      // the inconsistency report names the imputation.
      const ledger = await ledgerFor(ctx, id, ctx.asOf);
      const window = dateRange(query.start, query.end);

      return engineOutput({
        subject: 'continuous_residence',
        disclosable: assessContinuousResidence(ledger, matter.targetJurisdiction, window, policy),
        jurisdiction: matter.targetJurisdiction,
        matterId: id,
      });
    },
  );
}
