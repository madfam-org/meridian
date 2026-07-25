/**
 * The single point every response carrying engine output passes through.
 *
 * A `preSerialization` hook, not `onSend`: `preSerialization` receives the
 * payload as an object, before it becomes a string. `onSend` would see JSON, and
 * a gate that has to parse its own output to decide what it is has already lost.
 *
 * What happens on each response:
 *
 *   - the payload is an `EngineOutput` → build the release context from the
 *     authenticated tenant and the matter's representative, apply `canRelease`,
 *     replace the payload with the envelope, and — when the answer was no —
 *     write the downgrade to the audit trail;
 *   - the route declared `engineOutput: true` but returned something else → 500.
 *     A handler that was supposed to produce a gated value and produced a bare
 *     object is a handler whose output nobody classified;
 *   - the route declared `engineOutput: false` → scan for engine-shaped content
 *     and 500 if any is found.
 *
 * The last two are what make the guarantee hold under maintenance. It is not "we
 * reviewed every route"; it is "a route that gets this wrong fails loudly on its
 * first request, in development, with the offending path named".
 */

import { audienceFor, type AuthorizedRepresentative } from '@meridian/core';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ApiError } from '../http/errors.js';
import { requestContext } from '../request-context.js';
import { isEngineOutput, type DisclosureEnvelope, type EngineOutput } from './envelope.js';
import { applyGate, type GateOutcome } from './gate.js';
import { scanForDisclosureLeak } from './leak-detector.js';

/** Set on every gated response so a client — and a test — can see the gate ran. */
export const DISCLOSURE_HEADER = 'x-meridian-disclosure';
/** `applied` on every response the gate produced. Never set by a handler. */
export const GATE_HEADER = 'x-meridian-disclosure-gate';

function routeLabel(request: FastifyRequest): string {
  return `${request.method} ${request.routeOptions.url ?? request.url}`;
}

/**
 * The representative accountable for this output.
 *
 * Resolved here rather than passed in by the handler. The handler that assembles
 * a Schengen count has no reason to think about representation, and a gate that
 * depends on every handler remembering to look one up is a gate that fails on
 * the route somebody adds next quarter.
 */
async function matterRepresentative(
  request: FastifyRequest,
  matterId: string | null,
): Promise<AuthorizedRepresentative | null> {
  if (matterId === null) return null;
  const ctx = requestContext(request);
  const matter = await ctx.repositories.matters.get(matterId);
  if (matter === null || matter.representativeId === null) return null;
  return ctx.repositories.representatives.get(matter.representativeId);
}

export function installDisclosureGate(app: FastifyInstance): void {
  app.addHook('preSerialization', async (request, reply, payload: unknown) => {
    const config = request.routeOptions.config?.meridian;
    if (config === undefined) return payload;

    // An error body is not engine output and never will be. Without this, a
    // 404 thrown inside an `engineOutput: true` route would fail the "must
    // return an EngineOutput" check, be re-thrown from the hook, and be handled
    // by the error handler — which serialises another error body through the
    // same hook. The leak scan below still runs on error bodies.
    const isErrorResponse = reply.statusCode >= 400;

    if (isEngineOutput(payload)) {
      if (!config.engineOutput) {
        // A route producing gated output without declaring it would be missing
        // from the registry's engine-output list, so the enumeration test would
        // never check it. Refuse rather than quietly gate it.
        throw new ApiError(
          500,
          'DISCLOSURE_GATE_BYPASSED',
          'This route returned engine output but is declared engineOutput: false.',
          { route: routeLabel(request) },
        );
      }
      return gateResponse(request, reply, payload);
    }

    if (config.engineOutput && !isErrorResponse) {
      throw new ApiError(
        500,
        'DISCLOSURE_GATE_BYPASSED',
        'This route is declared engineOutput: true but returned a value the gate cannot classify.',
        { route: routeLabel(request) },
      );
    }

    const scan = scanForDisclosureLeak(payload);
    if (scan.outcome === 'leak') {
      throw new ApiError(
        500,
        'DISCLOSURE_GATE_BYPASSED',
        'This route returned content carrying a disclosure classification or a legal citation ' +
          'without passing the advice-boundary gate.',
        { route: routeLabel(request), path: scan.path, shape: scan.shape },
      );
    }
    if (scan.outcome === 'inconclusive') {
      throw new ApiError(
        500,
        'DISCLOSURE_GATE_BYPASSED',
        'This route returned a payload too large or too deep to check for ungated engine output.',
        { route: routeLabel(request), limit: scan.limit },
      );
    }

    return payload;
  });
}

async function gateResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  output: EngineOutput<unknown>,
): Promise<DisclosureEnvelope> {
  const ctx = requestContext(request);
  const representative = await matterRepresentative(request, output.matterId);

  const outcome: GateOutcome = applyGate(output, {
    tenant: ctx.tenant,
    matterRepresentative: representative,
    asOf: ctx.asOf,
  });

  reply.header(DISCLOSURE_HEADER, outcome.envelope.classification);
  reply.header(GATE_HEADER, 'applied');

  // Persistence happens here, after the decision, so a stored report records
  // what the reader was actually shown rather than what the engine produced.
  if (output.onRelease !== undefined) {
    await output.onRelease({
      classification: outcome.envelope.classification,
      producedClassification: outcome.envelope.producedClassification,
      released: outcome.envelope.released,
    });
  }

  await ctx.audit.record({
    // A downgrade is its own action, not a flavour of "read". It is the event a
    // regulator asks about, and it has to be findable by name in the trail.
    action: outcome.downgraded ? 'disclosure.downgraded' : 'disclosure.released',
    targetType: outcome.envelope.subject,
    targetId: output.matterId,
    outcome: outcome.downgraded ? 'refused' : 'success',
    disclosureClass: outcome.envelope.classification,
    detail: {
      producedClassification: outcome.envelope.producedClassification,
      jurisdiction: outcome.envelope.jurisdiction,
      audience: audienceFor(ctx.tenant.kind),
      representativeAttached: representative !== null,
      route: routeLabel(request),
    },
  });

  return outcome.envelope;
}
