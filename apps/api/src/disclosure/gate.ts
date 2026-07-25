/**
 * The gate itself.
 *
 * `canRelease` in `@meridian/core` makes the decision; this module builds the
 * context it decides on, applies the downgrade when the answer is no, and
 * produces the envelope. It is deliberately small and free of Fastify — the
 * whole thing is a pure function of (engine output, release context), which is
 * what makes it testable without an HTTP request.
 *
 * The one judgement made here that is not core's: `forConsideration` is always
 * `true`. Meridian is a paid platform, and s.91 of IRPA turns on consideration.
 * Setting it from a billing flag would mean a free trial silently widening what
 * an unlicensed audience may be told — and core's own note says a free product
 * is not a loophole: an unlicensed recommendation that happens to be lawful is
 * still one nobody is accountable for.
 */

import {
  audienceFor,
  canRelease,
  compareDisclosure,
  representativeFor,
  type AuthorizedRepresentative,
  type DisclosureClass,
  type IsoDate,
  type ReleaseContext,
  type ReleaseDecision,
  type Tenant,
} from '@meridian/core';

import type { DisclosureEnvelope, EngineOutput, WithheldExplanation } from './envelope.js';

export interface GateInput {
  readonly tenant: Tenant;
  /** The matter's assigned representative, already resolved. `null` when none. */
  readonly matterRepresentative: AuthorizedRepresentative | null;
  readonly asOf: IsoDate;
}

export interface GateOutcome {
  readonly envelope: DisclosureEnvelope;
  readonly decision: ReleaseDecision;
  /** True when the reader received less than the engine produced. Drives the audit event. */
  readonly downgraded: boolean;
}

/**
 * Assemble the context `canRelease` decides on.
 *
 * The representative is the matter's assigned one when there is a matter. Only
 * when the output belongs to no matter — a catalog listing, a recommendation run
 * before any matter exists — does it fall back to any live representative the
 * tenant holds for that jurisdiction. The order matters: a firm with a Spanish
 * abogado on staff does not thereby make every Canadian matter represented, and
 * `representativeFor` filters on jurisdiction and expiry for exactly that reason.
 */
export function releaseContextFor(
  input: GateInput,
  jurisdiction: string,
  hasMatter: boolean,
): ReleaseContext {
  const representative = hasMatter
    ? input.matterRepresentative
    : representativeFor(input.tenant, jurisdiction, input.asOf);

  return {
    audience: audienceFor(input.tenant.kind),
    jurisdiction,
    representative,
    forConsideration: true,
    asOf: input.asOf,
  };
}

/**
 * Apply the gate to one engine output.
 *
 * When release is refused and the route supplied a downgrade, the downgraded
 * value is *re-checked*: a downgrade that still returns `advice` would otherwise
 * walk straight past the boundary it was written to respect. If it does, the
 * value is withheld entirely rather than trusted, because at that point the
 * route's own idea of "safe" has been shown to be wrong.
 */
export function applyGate<T>(output: EngineOutput<T>, input: GateInput): GateOutcome {
  const context = releaseContextFor(input, output.jurisdiction, output.matterId !== null);
  const produced = output.disclosable.classification;
  const decision = canRelease(produced, context);

  if (decision.allowed) {
    return {
      decision,
      downgraded: false,
      envelope: {
        classification: produced,
        producedClassification: produced,
        released: true,
        subject: output.subject,
        jurisdiction: output.jurisdiction,
        matterId: output.matterId,
        citationIds: output.disclosable.citationIds,
        withheld: null,
        value: output.disclosable.value,
      },
    };
  }

  const explanation = (
    downgradedTo: DisclosureClass,
    removedFields: readonly string[],
  ): WithheldExplanation => ({
    code: 'ADVICE_BOUNDARY',
    reason: decision.reason,
    downgradedTo,
    requiredAction:
      'Attach a representative authorised in ' +
      `${output.jurisdiction} to this matter, or read the assessment below, which sets out the ` +
      'same figures and the rules they were measured against.',
    audience: context.audience,
    jurisdiction: output.jurisdiction,
    representativeAttached: context.representative !== null,
    removedFields,
  });

  if (output.downgrade !== undefined) {
    const safe = output.downgrade(output.disclosable.value);
    const stillTooHigh = compareDisclosure(safe.classification, decision.downgradeTo) > 0;
    if (!stillTooHigh) {
      return {
        decision,
        downgraded: true,
        envelope: {
          classification: safe.classification,
          producedClassification: produced,
          released: false,
          subject: output.subject,
          jurisdiction: output.jurisdiction,
          matterId: output.matterId,
          citationIds: safe.citationIds,
          withheld: explanation(safe.classification, describeRemoval(output.subject)),
          value: safe.value,
        },
      };
    }
  }

  return {
    decision,
    downgraded: true,
    envelope: {
      classification: decision.downgradeTo,
      producedClassification: produced,
      released: false,
      subject: output.subject,
      jurisdiction: output.jurisdiction,
      matterId: output.matterId,
      // The citations belonged to the withheld content. Repeating them beside a
      // null value would suggest something was measured and shown; nothing was.
      citationIds: [],
      withheld: explanation(decision.downgradeTo, ['value']),
      value: null,
    },
  };
}

/**
 * Which fields a downgrade removes, per subject.
 *
 * Stated rather than computed by diffing: a client needs to know what it is not
 * being shown even when the downgraded payload happens to be structurally
 * similar, and a diff would report nothing for a subject whose downgrade removes
 * meaning rather than keys.
 */
function describeRemoval(subject: EngineOutput<unknown>['subject']): readonly string[] {
  switch (subject) {
    case 'pathway_recommendation':
      // `assessments` survives with every verdict and citation intact. What goes
      // is the opinion: the order, the rank, the rationale, and the reasons
      // pathways were held out of an ordering that no longer exists.
      return ['ranked', 'excluded'];
    default:
      return ['value'];
  }
}
