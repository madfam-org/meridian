/**
 * Documents: what is held, what is required, and the difference.
 *
 * **Why the checklist endpoints take the requirements in the request body.**
 * The pathway catalog in `@meridian/pathways` encodes eligibility criteria; it
 * does not yet encode which pieces of paper each route demands. This API will
 * not invent them. Making up "a Spanish non-lucrative visa needs these nine
 * documents" would be fabricating law, and it would be fabricated in the exact
 * place a user is least able to check it.
 *
 * So a firm supplies its own requirement set — each one carrying a `Citation`,
 * on the same terms the catalog holds itself to — and Meridian does the work
 * that is genuinely hard and genuinely general: apostille versus consular
 * routing, whether a sworn translation is needed and whose, whether a police
 * certificate issued today will still be inside its acceptance window on the day
 * the file is lodged, and what order to do it all in. When the catalog grows
 * document requirements, this endpoint reads them from the pathway instead and
 * the body becomes an override.
 *
 * **Freshness is projected to the submission date, not to today.** A certificate
 * that is valid now and expires two weeks before the appointment is the single
 * most common way a file is rejected for a reason that was entirely
 * foreseeable. `projectFreshness` has a distinct verdict for it, and the gap
 * report surfaces "we could not check" separately from "we checked and it is
 * fine" — a route that rendered those the same would let an unchecked document
 * pass as verified.
 */

import {
  DOCUMENT_KINDS,
  NOT_LEGALISED,
  analyseGaps,
  buildChecklist,
  checklistDisclosure,
  parseDocument,
  transitionDocument,
  type Document,
  type DocumentKind,
  type DocumentRequirement,
  type PathwayLike,
} from '@meridian/documents';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { WRITE_ROLES } from '../auth/context.js';
import { engineOutput } from '../disclosure/envelope.js';
import { notFound, parseOrThrow } from '../http/errors.js';
import {
  citationSchema,
  countryCodeSchema,
  isoDateSchema,
  languageTagSchema,
} from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { declare, requireMatter, resolveAsOf, respond } from './helpers.js';

const matterParams = z.object({ id: z.string().min(1) });
const documentParams = z.object({ id: z.string().min(1), documentId: z.string().min(1) });

const documentKindSchema = z.enum(DOCUMENT_KINDS as [DocumentKind, ...DocumentKind[]]);

const documentStatusSchema = z.enum([
  'required',
  'provided',
  'under_review',
  'accepted',
  'rejected',
  'expired',
]);

const legalisationRouteSchema = z.enum(['none', 'apostille', 'consular', 'unknown']);

const translatorStandardSchema = z.enum([
  'none',
  'sworn_traductor_jurado',
  'certified_translator',
  'affidavit_translation',
  'perito_traductor',
  'translator_certification',
  'unknown',
]);

const newDocumentSchema = z.object({
  kind: documentKindSchema,
  /**
   * The state whose authority issued it — not the applicant's nationality. A
   * Mexican national's police certificate covering three years in Canada is
   * issued by Canada, and routing it as Mexican sends them to the wrong ministry.
   */
  issuingCountry: countryCodeSchema,
  issuedOn: isoDateSchema.optional(),
  expiresOn: isoDateSchema.optional(),
  status: documentStatusSchema.optional(),
  legalisation: z
    .object({
      /** `null` means nothing has been done. `'none'` means nothing is required. */
      route: legalisationRouteSchema.nullable(),
      completedOn: isoDateSchema.optional(),
      reference: z.string().min(1).max(200).optional(),
    })
    .optional(),
  translation: z.object({
    /** Mandatory: there is no safe default, and guessing from the issuing country bills
     * applicants for translations they never needed. */
    sourceLanguage: languageTagSchema,
    intoLanguage: languageTagSchema.optional(),
    standard: translatorStandardSchema.optional(),
    completedOn: isoDateSchema.optional(),
    translatorReference: z.string().min(1).max(200).optional(),
  }),
  verifiedBy: z.string().min(1).max(120).optional(),
});

const transitionSchema = z.object({
  to: documentStatusSchema,
  verifiedBy: z.string().min(1).max(120).optional(),
});

const requirementSchema = z.object({
  kind: documentKindSchema,
  /** Distinguishes two requirements of the same kind that route differently. */
  slug: z.string().min(1).max(120).optional(),
  criterion: z.string().min(1).max(500),
  citation: citationSchema,
  optional: z.boolean().optional(),
  issuingCountry: countryCodeSchema.optional(),
  language: languageTagSchema.optional(),
  note: z.string().min(1).max(1000).optional(),
  dependsOn: z.array(z.string().min(1)).max(20).optional(),
});

const checklistRequestSchema = z.object({
  requirements: z.array(requirementSchema).min(1).max(100),
  defaultIssuingCountry: countryCodeSchema,
  defaultLanguage: languageTagSchema,
  issuingCountries: z.record(countryCodeSchema).optional(),
  documentLanguages: z.record(languageTagSchema).optional(),
  targetSubmissionDate: isoDateSchema.optional(),
  receivingRegion: z.string().min(1).max(20).optional(),
  submissionChannel: z.enum(['consular_post', 'in_country_authority', 'online']).optional(),
  asOf: isoDateSchema.optional(),
});

const documentOut = z.object({
  id: z.string(),
  tenantId: z.string(),
  matterId: z.string(),
  kind: documentKindSchema,
  issuingCountry: z.string(),
  issuedOn: z.string().optional(),
  expiresOn: z.string().optional(),
  status: documentStatusSchema,
  legalisation: z.object({
    route: legalisationRouteSchema.nullable(),
    completedOn: z.string().optional(),
    reference: z.string().optional(),
  }),
  translation: z.object({
    sourceLanguage: z.string(),
    intoLanguage: z.string().optional(),
    standard: translatorStandardSchema.optional(),
    completedOn: z.string().optional(),
    translatorReference: z.string().optional(),
  }),
  verifiedBy: z.string().optional(),
});

export function registerDocumentRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/matters/:id/documents',
    declare({
      summary: 'Documents held for a matter.',
      engineOutput: false,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      await requireMatter(ctx, id);
      const documents = await ctx.repositories.documents.listForMatter(id);
      return respond(z.object({ documents: z.array(documentOut) }), { documents });
    },
  );

  app.post(
    '/v1/matters/:id/documents',
    declare({
      summary: 'Record a document held for a matter. Metadata only; no scan is accepted.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      await requireMatter(ctx, id);
      const body = parseOrThrow(newDocumentSchema, request.body, 'body');

      const candidate = {
        id: services.newId(),
        kind: body.kind,
        issuingCountry: body.issuingCountry,
        ...(body.issuedOn === undefined ? {} : { issuedOn: body.issuedOn }),
        ...(body.expiresOn === undefined ? {} : { expiresOn: body.expiresOn }),
        status: body.status ?? 'provided',
        legalisation: body.legalisation ?? NOT_LEGALISED,
        translation: body.translation,
        ...(body.verifiedBy === undefined ? {} : { verifiedBy: body.verifiedBy }),
      };

      // Re-validated by the domain package rather than trusted from zod alone:
      // `parseDocument` also rejects an expiry that precedes the issue date,
      // which is always a data error and otherwise produces a document that is
      // simultaneously fresh and expired depending on which check runs first.
      const parsed = parseDocument(candidate);
      if (!parsed.ok) throw parsed.error;

      const created = await ctx.repositories.documents.create(id, parsed.value);
      await ctx.audit.record({
        action: 'document.recorded',
        targetType: 'document',
        targetId: created.id,
        outcome: 'success',
        detail: {
          matterId: id,
          kind: created.kind,
          issuingCountry: created.issuingCountry,
          status: created.status,
        },
      });

      reply.code(201);
      return respond(documentOut, created);
    },
  );

  app.post(
    '/v1/matters/:id/documents/:documentId/transition',
    declare({
      summary: 'Move a document through its status machine.',
      engineOutput: false,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id, documentId } = parseOrThrow(documentParams, request.params, 'params');
      await requireMatter(ctx, id);
      const body = parseOrThrow(transitionSchema, request.body, 'body');

      const current = await ctx.repositories.documents.get(documentId);
      if (current === null || current.matterId !== id) throw notFound('document', documentId);

      // The status machine lives in `@meridian/documents` and refuses illegal
      // transitions with a `Result`, because a caseworker clicking the wrong
      // button is an expected outcome, not a system fault.
      const next = transitionDocument(
        current,
        body.to,
        body.verifiedBy === undefined ? {} : { verifiedBy: body.verifiedBy },
      );
      if (!next.ok) throw next.error;

      const updated = await ctx.repositories.documents.replace({
        ...next.value,
        tenantId: current.tenantId,
        matterId: current.matterId,
      });
      if (updated === null) throw notFound('document', documentId);

      await ctx.audit.record({
        action: 'document.transitioned',
        targetType: 'document',
        targetId: documentId,
        outcome: 'success',
        detail: { matterId: id, from: current.status, to: updated.status },
      });

      return respond(documentOut, updated);
    },
  );

  app.post(
    '/v1/matters/:id/documents/checklist',
    declare({
      summary: 'Assemble an ordered document checklist with legalisation and translation routing.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      const matter = await requireMatter(ctx, id);
      const body = parseOrThrow(checklistRequestSchema, request.body, 'body');
      const asOf = resolveAsOf(ctx, body.asOf);

      const checklist = buildChecklist(pathwayFor(matter, body), checklistFacts(id, body), asOf);

      return engineOutput({
        subject: 'document_checklist',
        disclosable: checklistDisclosure(checklist),
        jurisdiction: matter.targetJurisdiction,
        matterId: id,
      });
    },
  );

  app.post(
    '/v1/matters/:id/documents/gaps',
    declare({
      summary: 'The difference between the checklist and the documents actually held.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { id } = parseOrThrow(matterParams, request.params, 'params');
      const matter = await requireMatter(ctx, id);
      const body = parseOrThrow(checklistRequestSchema, request.body, 'body');
      const asOf = resolveAsOf(ctx, body.asOf);

      const checklist = buildChecklist(pathwayFor(matter, body), checklistFacts(id, body), asOf);
      const held: Document[] = await ctx.repositories.documents.listForMatter(id);

      return engineOutput({
        subject: 'document_gaps',
        disclosable: analyseGaps({
          checklist,
          held,
          asOf,
          ...(body.targetSubmissionDate === undefined
            ? {}
            : { targetSubmissionDate: body.targetSubmissionDate }),
        }),
        jurisdiction: matter.targetJurisdiction,
        matterId: id,
      });
    },
  );
}

type ChecklistRequest = z.infer<typeof checklistRequestSchema>;

function pathwayFor(
  matter: { readonly pathwayId: string; readonly targetJurisdiction: PathwayLike['targetJurisdiction'] },
  body: ChecklistRequest,
): PathwayLike {
  const documentRequirements: DocumentRequirement[] = body.requirements.map((r) => ({
    kind: r.kind,
    criterion: r.criterion,
    citation: r.citation,
    ...(r.slug === undefined ? {} : { slug: r.slug }),
    ...(r.optional === undefined ? {} : { optional: r.optional }),
    ...(r.issuingCountry === undefined ? {} : { issuingCountry: r.issuingCountry }),
    ...(r.language === undefined ? {} : { language: r.language }),
    ...(r.note === undefined ? {} : { note: r.note }),
    ...(r.dependsOn === undefined ? {} : { dependsOn: r.dependsOn }),
  }));

  return {
    id: matter.pathwayId,
    targetJurisdiction: matter.targetJurisdiction,
    documentRequirements,
    ...(body.receivingRegion === undefined ? {} : { receivingRegion: body.receivingRegion }),
    ...(body.submissionChannel === undefined ? {} : { submissionChannel: body.submissionChannel }),
  };
}

function checklistFacts(matterId: string, body: ChecklistRequest) {
  return {
    matterId,
    defaultIssuingCountry: body.defaultIssuingCountry,
    defaultLanguage: body.defaultLanguage,
    ...(body.issuingCountries === undefined ? {} : { issuingCountries: body.issuingCountries }),
    ...(body.documentLanguages === undefined ? {} : { documentLanguages: body.documentLanguages }),
    ...(body.targetSubmissionDate === undefined
      ? {}
      : { targetSubmissionDate: body.targetSubmissionDate }),
    ...(body.receivingRegion === undefined ? {} : { receivingRegion: body.receivingRegion }),
  };
}
