/**
 * The catalog, the evaluator, and the one endpoint that produces advice.
 *
 * `POST /v1/pathways/recommend` is the reason the disclosure gate exists.
 * `recommend` in `@meridian/pathways` returns a ranking, and a ranking tells a
 * person what to do — a regulated act under IRPA s.91 and Spain's
 * reserved-activity rules. It is born `advice`, and this route hands the gate a
 * `downgrade` so that when release is refused the caller still receives every
 * pathway, every verdict, every citation and every piece of arithmetic. What
 * they lose is the opinion about which one to pursue.
 *
 * Note what the route does *not* do: it does not decide. It never inspects the
 * tenant kind, never checks for a representative, and never chooses between the
 * ranked and unranked forms. All of that is the gate's, in one place, because a
 * per-route decision about whether something "counts as advice" is a decision
 * somebody eventually gets wrong under deadline.
 *
 * The catalog listing is `information` — a neutral restatement of published
 * rules, not applied to anyone's facts — and it still goes through the gate. Not
 * because `information` could ever be refused, but because every response
 * carrying citations leaves by the same door. Two doors is one door too many.
 */

import { type DisclosureClass, type Disclosable, disclosable } from '@meridian/core';
import {
  assess,
  assessmentOf,
  downgradeToAssessment,
  evaluate,
  recommend,
  statusOn,
  type AssessmentSet,
  type Pathway,
  type RecommendationSet,
} from '@meridian/pathways';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { engineOutput } from '../disclosure/envelope.js';
import { conflict, notFound, parseOrThrow } from '../http/errors.js';
import { countryCodeSchema, isoDateSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { RequestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { applicantFactsSchema } from './facts-schema.js';
import { declare, requireMatter, resolveAsOf } from './helpers.js';

const listQuerySchema = z.object({
  jurisdiction: countryCodeSchema.optional(),
  kind: z
    .enum([
      'residence_permit',
      'work_permit',
      'naturalization',
      'permanent_residence',
      'entry_facilitation',
    ])
    .optional(),
  asOf: isoDateSchema.optional(),
});

const evaluateSchema = z.object({
  pathwayId: z.string().min(1),
  facts: applicantFactsSchema,
  asOf: isoDateSchema.optional(),
  /**
   * When supplied, the matter's representative decides the release and the
   * report is stored against the matter.
   */
  matterId: z.string().min(1).optional(),
});

const recommendSchema = z
  .object({
    facts: applicantFactsSchema,
    asOf: isoDateSchema.optional(),
    matterId: z.string().min(1).optional(),
    /** Required when there is no matter: the gate matches a representative on it. */
    jurisdiction: countryCodeSchema.optional(),
  })
  .refine((b) => b.matterId !== undefined || b.jurisdiction !== undefined, {
    message: 'supply either matterId or jurisdiction so the advice boundary can be evaluated',
  });

/** Citation ids across a set of pathways, deduplicated and ordered. */
function catalogCitationIds(pathways: readonly Pathway[]): string[] {
  const ids = new Set<string>();
  for (const p of pathways) for (const c of p.citations) ids.add(c.id);
  return [...ids].sort();
}

/**
 * Resolve the jurisdiction and matter the gate should decide against.
 *
 * A matter always wins: an assessment produced for a matter is accountable to
 * that matter's representative, not to whichever representative the tenant
 * happens to hold for the country named in the body.
 */
async function releaseTarget(
  ctx: RequestContext,
  matterId: string | undefined,
  fallbackJurisdiction: string | undefined,
): Promise<{ jurisdiction: string; matterId: string | null }> {
  if (matterId !== undefined) {
    const matter = await requireMatter(ctx, matterId);
    return { jurisdiction: matter.targetJurisdiction, matterId };
  }
  if (fallbackJurisdiction === undefined) {
    throw conflict('A jurisdiction is required when no matter is supplied.');
  }
  return { jurisdiction: fallbackJurisdiction, matterId: null };
}

export function registerPathwayRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/pathways',
    declare({
      summary: 'The pathway catalog, as published rules.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const query = parseOrThrow(listQuerySchema, request.query, 'query');
      const asOf = resolveAsOf(ctx, query.asOf);

      const pathways = services.catalog.filter(
        (p) =>
          (query.jurisdiction === undefined || p.jurisdiction === query.jurisdiction) &&
          (query.kind === undefined || p.kind === query.kind),
      );

      // `statusOn` answers historically: a route repealed last April is `open`
      // on a date before the repeal, so a matter opened under the old rules can
      // still be explained. Reporting today's status against a past date would
      // make every pre-repeal decision look unjustifiable.
      const value = {
        asOf,
        pathways: pathways.map((p) => ({ ...p, statusOn: statusOn(p, asOf) })),
      };

      return engineOutput({
        subject: 'pathway_catalog',
        disclosable: disclosable('information', value, catalogCitationIds(pathways)),
        jurisdiction: query.jurisdiction ?? ctx.tenant.homeJurisdiction,
        matterId: null,
      });
    },
  );

  app.get(
    '/v1/pathways/:pathwayId',
    declare({
      summary: 'One pathway, with its criteria and citations.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { pathwayId } = parseOrThrow(
        z.object({ pathwayId: z.string().min(1) }),
        request.params,
        'params',
      );
      const query = parseOrThrow(z.object({ asOf: isoDateSchema.optional() }), request.query, 'query');
      const asOf = resolveAsOf(ctx, query.asOf);

      const pathway = services.catalog.find((p) => p.id === pathwayId);
      if (pathway === undefined) throw notFound('pathway', pathwayId);

      return engineOutput({
        subject: 'pathway_catalog',
        disclosable: disclosable(
          'information',
          { asOf, pathway: { ...pathway, statusOn: statusOn(pathway, asOf) } },
          catalogCitationIds([pathway]),
        ),
        jurisdiction: pathway.jurisdiction,
        matterId: null,
      });
    },
  );

  app.post(
    '/v1/pathways/evaluate',
    declare({
      summary: "Measure an applicant's facts against one pathway.",
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(evaluateSchema, request.body, 'body');
      const asOf = resolveAsOf(ctx, body.asOf);

      const pathway = services.catalog.find((p) => p.id === body.pathwayId);
      if (pathway === undefined) throw notFound('pathway', body.pathwayId);

      const target = await releaseTarget(ctx, body.matterId, pathway.jurisdiction);
      const matterId = target.matterId;
      const report = evaluate(pathway, body.facts, asOf);

      return engineOutput({
        subject: 'pathway_evaluation',
        disclosable: assessmentOf(report),
        jurisdiction: target.jurisdiction,
        matterId,
        // Stored after the gate decides, so the record says what the reader was
        // actually shown rather than what the engine produced.
        onRelease:
          matterId === null
            ? undefined
            : async (result) => {
                await ctx.repositories.evaluations.append({
                  id: services.newId(),
                  tenantId: ctx.auth.tenantId,
                  matterId,
                  pathwayId: pathway.id,
                  pathwayVersion: pathway.version,
                  asOf,
                  verdict: report.verdict,
                  classification: result.classification,
                  released: result.released,
                  report,
                  createdAt: services.clock.now(),
                });
              },
      });
    },
  );

  app.post(
    '/v1/pathways/recommend',
    declare({
      summary: 'Rank the counsel-reviewed pathways an applicant may pursue. Regulated advice.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(recommendSchema, request.body, 'body');
      const asOf = resolveAsOf(ctx, body.asOf);
      const target = await releaseTarget(ctx, body.matterId, body.jurisdiction);

      const ranked: Disclosable<RecommendationSet> = recommend(body.facts, services.catalog, asOf);

      return engineOutput({
        subject: 'pathway_recommendation',
        disclosable: ranked,
        jurisdiction: target.jurisdiction,
        matterId: target.matterId,
        // The safe form: the same pathways as neutral assessments, in catalog
        // order, with no rank and no rationale.
        downgrade: (set: RecommendationSet): Disclosable<AssessmentSet> =>
          downgradeToAssessment(set),
      });
    },
  );

  app.post(
    '/v1/pathways/assess',
    declare({
      summary: 'Every pathway as a neutral assessment. Never ranked, never a recommendation.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(recommendSchema, request.body, 'body');
      const asOf = resolveAsOf(ctx, body.asOf);
      const target = await releaseTarget(ctx, body.matterId, body.jurisdiction);

      // The direct route to the unranked form, for a client that never wants the
      // ranking and should not have to receive a downgrade notice to be told so.
      const result: Disclosable<AssessmentSet> = assess(body.facts, services.catalog, asOf);
      const classification: DisclosureClass = result.classification;

      return engineOutput({
        subject: 'pathway_evaluation',
        disclosable: disclosable(classification, result.value, result.citationIds),
        jurisdiction: target.jurisdiction,
        matterId: target.matterId,
      });
    },
  );
}
