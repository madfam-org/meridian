/**
 * Government integrations: what they can do, and the hand-off packs that stand
 * in for what they cannot.
 *
 * Every government integration Meridian ships is `not_provisioned`. The
 * capability endpoint says so out loud, per adapter and per capability, with the
 * reason and the specific thing an operator would have to obtain — a service
 * agreement, a signing key, an endpoint. There is no fixture data behind any of
 * these routes and no code path that returns a plausible-looking government
 * response nobody obtained from a government.
 *
 * Two capabilities on every adapter are refusals rather than gaps, and no amount
 * of provisioning changes them: Meridian does not take custody of a person's
 * government credential, and does not act before an authority while presenting
 * as them. The replacement is the hand-off — a pack of steps, documents,
 * pre-computed field values and things to bring back, pointing at an
 * allowlisted official host over https with no query string. The applicant
 * performs the legal act and keeps the audit trail, which is better for them
 * than the alternative and not merely more cautious for us.
 */

import { adapterContext, type AssistedHandoff, type GovTechAdapter } from '@meridian/govtech';
import { disclosable, maxDisclosureOf, type DisclosureClass } from '@meridian/core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { WRITE_ROLES } from '../auth/context.js';
import { engineOutput } from '../disclosure/envelope.js';
import { conflict, notFound, parseOrThrow } from '../http/errors.js';
import { isoDateSchema, paginationSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import type { AppServices } from '../services.js';
import { declare, requireMatter } from './helpers.js';

/**
 * Structural narrowing over a heterogeneous registry.
 *
 * `AdapterRegistry` holds `GovTechAdapter`, which is all the status board needs.
 * Building a hand-off needs the adapter's own builder, and the registry is
 * deliberately not generic over its members — so the narrowing happens here, at
 * the one boundary that needs it, and returns `null` rather than casting blind.
 */
interface ClaveLike {
  buildRegistrationHandoff(input: {
    readonly matterId: string;
    readonly route: 'in_person_office' | 'video_call' | 'invitation_letter' | 'electronic_certificate';
    readonly fullName: string;
    readonly identityDocumentNumber?: string;
    readonly generatedOn: ReturnType<AppServices['clock']['today']>;
  }): { ok: true; value: AssistedHandoff } | { ok: false; error: Error };
}

interface DiciregLike {
  buildConsularHandoff(input: {
    readonly matterId: string;
    readonly event: 'birth' | 'marriage' | 'death';
    readonly form: 'literal' | 'extract_plain' | 'extract_multilingual';
    readonly subjectFullName: string;
    readonly dateOfEvent?: ReturnType<AppServices['clock']['today']>;
    readonly placeOfEvent?: string;
    readonly consularPost?: string;
    readonly generatedOn: ReturnType<AppServices['clock']['today']>;
  }): { ok: true; value: AssistedHandoff } | { ok: false; error: Error };
}

interface IrccLike {
  buildEmployerPortalHandoff(input: {
    readonly matterId: string;
    readonly employerLegalName: string;
    readonly employerBusinessNumber: string;
    readonly positionTitle: string;
    readonly nocCode: string;
    readonly startOn: ReturnType<AppServices['clock']['today']>;
    readonly endOn?: ReturnType<AppServices['clock']['today']>;
    readonly generatedOn: ReturnType<AppServices['clock']['today']>;
  }): { ok: true; value: AssistedHandoff } | { ok: false; error: Error };
}

function hasMethod<K extends string>(
  adapter: GovTechAdapter,
  method: K,
): adapter is GovTechAdapter & Record<K, (...args: never[]) => unknown> {
  return typeof (adapter as unknown as Record<string, unknown>)[method] === 'function';
}

const handoffBodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('es_clave_registration'),
    matterId: z.string().min(1),
    route: z.enum(['in_person_office', 'video_call', 'invitation_letter', 'electronic_certificate']),
    fullName: z.string().min(1).max(300),
    /** The user's own DNI or NIE, so they can copy it rather than misremember it. */
    identityDocumentNumber: z.string().min(1).max(40).optional(),
  }),
  z.object({
    kind: z.literal('es_dicireg_consular'),
    matterId: z.string().min(1),
    event: z.enum(['birth', 'marriage', 'death']),
    form: z.enum(['literal', 'extract_plain', 'extract_multilingual']),
    subjectFullName: z.string().min(1).max(300),
    dateOfEvent: isoDateSchema.optional(),
    placeOfEvent: z.string().min(1).max(200).optional(),
    consularPost: z.string().min(1).max(200).optional(),
  }),
  z.object({
    kind: z.literal('ca_ircc_employer_portal'),
    matterId: z.string().min(1),
    employerLegalName: z.string().min(1).max(300),
    employerBusinessNumber: z.string().min(1).max(40),
    positionTitle: z.string().min(1).max(200),
    nocCode: z.string().min(1).max(10),
    startOn: isoDateSchema,
    endOn: isoDateSchema.optional(),
  }),
]);

/** Adapter that owns each hand-off kind. One place, so a typo cannot route to the wrong ministry. */
const HANDOFF_ADAPTER: Readonly<Record<string, string>> = {
  es_clave_registration: 'es-clave',
  es_dicireg_consular: 'es-dicireg',
  ca_ircc_employer_portal: 'ca-ircc',
};

/** Pull citation ids out of a stored hand-off payload, tolerating an unexpected shape. */
function citationIdsOf(payload: unknown): string[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const citations = (payload as { citations?: unknown }).citations;
  if (!Array.isArray(citations)) return [];
  const ids: string[] = [];
  for (const c of citations) {
    if (typeof c === 'object' && c !== null) {
      const id = (c as { id?: unknown }).id;
      if (typeof id === 'string') ids.push(id);
    }
  }
  return [...new Set(ids)].sort();
}

export function registerGovtechRoutes(app: FastifyInstance, services: AppServices): void {
  app.get(
    '/v1/govtech/capabilities',
    declare({
      summary: 'Honest capability board across every government adapter.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const board = services.govtech.statusBoard(adapterContext(ctx.asOf));
      const ids = new Set<string>();
      for (const report of board.reports) {
        for (const capability of report.capabilities) {
          for (const citation of capability.citations) ids.add(citation.id);
        }
      }
      return engineOutput({
        subject: 'govtech_capabilities',
        disclosable: disclosable('information', board, [...ids].sort()),
        jurisdiction: ctx.tenant.homeJurisdiction,
        matterId: null,
      });
    },
  );

  app.get(
    '/v1/govtech/adapters/:adapterId/capabilities',
    declare({
      summary: 'One adapter, its capabilities, and what each is blocked on.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const { adapterId } = parseOrThrow(
        z.object({ adapterId: z.string().min(1) }),
        request.params,
        'params',
      );
      const adapter = services.govtech.get(adapterId);
      if (adapter === null) throw notFound('govtech adapter', adapterId);

      const report = adapter.describeCapabilities(adapterContext(ctx.asOf));
      const ids = new Set<string>();
      for (const capability of report.capabilities) {
        for (const citation of capability.citations) ids.add(citation.id);
      }
      return engineOutput({
        subject: 'govtech_capabilities',
        disclosable: disclosable('information', report, [...ids].sort()),
        jurisdiction: adapter.jurisdiction,
        matterId: null,
      });
    },
  );

  app.get(
    '/v1/govtech/handoffs',
    declare({
      summary: 'Hand-off packs generated for this tenant.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const page = parseOrThrow(paginationSchema, request.query, 'query');
      const handoffs = await ctx.repositories.handoffs.list(page);

      const classification: DisclosureClass = maxDisclosureOf(handoffs.map((h) => h.classification));
      const citationIds = [...new Set(handoffs.flatMap((h) => citationIdsOf(h.payload)))].sort();

      return engineOutput({
        subject: 'govtech_handoff',
        disclosable: disclosable(classification, { handoffs }, citationIds),
        jurisdiction: ctx.tenant.homeJurisdiction,
        matterId: null,
      });
    },
  );

  app.post(
    '/v1/govtech/handoffs',
    declare({
      summary: 'Generate a hand-off pack for a government procedure the applicant performs.',
      engineOutput: true,
      access: 'authenticated',
      requiredRoles: WRITE_ROLES,
    }),
    async (request, reply) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(handoffBodySchema, request.body, 'body');
      const matter = await requireMatter(ctx, body.matterId);

      const adapterId = HANDOFF_ADAPTER[body.kind];
      const adapter = adapterId === undefined ? null : services.govtech.get(adapterId);
      if (adapter === null) throw notFound('govtech adapter', adapterId ?? body.kind);

      const built = buildHandoffFor(adapter, body, ctx.asOf);
      if (built === null) {
        throw conflict(
          `Adapter ${adapter.id} does not build ${body.kind} packs in this deployment.`,
        );
      }
      if (!built.ok) throw built.error;
      const handoff = built.value;

      const stored = await ctx.repositories.handoffs.append({
        id: services.newId(),
        tenantId: ctx.auth.tenantId,
        matterId: matter.id,
        adapterId: adapter.id,
        capabilityId: null,
        title: handoff.title,
        destinationUrl: handoff.destinationUrl,
        classification: handoff.classification,
        generatedOn: handoff.generatedOn,
        payload: handoff,
        createdAt: services.clock.now(),
      });

      await ctx.audit.record({
        action: 'govtech.handoff.generated',
        targetType: 'govtech_handoff',
        targetId: stored.id,
        outcome: 'success',
        disclosureClass: handoff.classification,
        detail: {
          matterId: matter.id,
          adapterId: adapter.id,
          kind: body.kind,
          // The destination is an allowlisted official host; recording it is how
          // the trail shows where a person was sent.
          destinationUrl: handoff.destinationUrl,
          steps: handoff.steps.length,
        },
      });

      reply.code(201);
      return engineOutput({
        subject: 'govtech_handoff',
        disclosable: disclosable(
          handoff.classification,
          { id: stored.id, handoff },
          handoff.citations.map((c) => c.id),
        ),
        jurisdiction: adapter.jurisdiction,
        matterId: matter.id,
      });
    },
  );
}

type HandoffBody = z.infer<typeof handoffBodySchema>;

function buildHandoffFor(
  adapter: GovTechAdapter,
  body: HandoffBody,
  generatedOn: ReturnType<AppServices['clock']['today']>,
): { ok: true; value: AssistedHandoff } | { ok: false; error: Error } | null {
  switch (body.kind) {
    case 'es_clave_registration': {
      if (!hasMethod(adapter, 'buildRegistrationHandoff')) return null;
      return (adapter as unknown as ClaveLike).buildRegistrationHandoff({
        matterId: body.matterId,
        route: body.route,
        fullName: body.fullName,
        ...(body.identityDocumentNumber === undefined
          ? {}
          : { identityDocumentNumber: body.identityDocumentNumber }),
        generatedOn,
      });
    }
    case 'es_dicireg_consular': {
      if (!hasMethod(adapter, 'buildConsularHandoff')) return null;
      return (adapter as unknown as DiciregLike).buildConsularHandoff({
        matterId: body.matterId,
        event: body.event,
        form: body.form,
        subjectFullName: body.subjectFullName,
        ...(body.dateOfEvent === undefined ? {} : { dateOfEvent: body.dateOfEvent }),
        ...(body.placeOfEvent === undefined ? {} : { placeOfEvent: body.placeOfEvent }),
        ...(body.consularPost === undefined ? {} : { consularPost: body.consularPost }),
        generatedOn,
      });
    }
    case 'ca_ircc_employer_portal': {
      if (!hasMethod(adapter, 'buildEmployerPortalHandoff')) return null;
      return (adapter as unknown as IrccLike).buildEmployerPortalHandoff({
        matterId: body.matterId,
        employerLegalName: body.employerLegalName,
        employerBusinessNumber: body.employerBusinessNumber,
        positionTitle: body.positionTitle,
        nocCode: body.nocCode,
        startOn: body.startOn,
        ...(body.endOn === undefined ? {} : { endOn: body.endOn }),
        generatedOn,
      });
    }
  }
}
