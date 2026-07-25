/**
 * The capability model: what an adapter can actually do, right now, truthfully.
 *
 * Integration status boards lie by default. The lie is structural rather than
 * malicious — someone writes the adapter, someone else writes the status page,
 * and the status page renders a green tick for "the module exists" because that
 * is the only fact it has. Six months later an operator is looking at a wall of
 * green while every government integration in the estate is unprovisioned, and
 * the first person to discover this is a client whose filing did not happen.
 *
 * So capability state is not a display concern here. It is the thing the adapter
 * computes from its own preconditions, and it is what gates every operation.
 * Three invariants carry the weight:
 *
 *   1. A capability that talks to a government system may only be `available`
 *      when every one of its declared requirements is satisfied. There is no
 *      path in this package that hard-codes `available`.
 *   2. Refusals must name a policy and must offer an honest alternative. "No"
 *      without "instead, do this" is not an answer we ship.
 *   3. Everything unavailable is unavailable for a stated, human-actionable
 *      reason. `not_provisioned` and `not_implemented` are different problems
 *      with different owners, and collapsing them into "error" wastes the time
 *      of whoever is trying to fix it.
 */

import type { Citation, CountryCode, IsoDate } from '@meridian/core';
import { isCitationWellFormed, staleness } from '@meridian/core';

/**
 * What state a single capability is in.
 *
 * - `available` — it works, now, with the credentials and agreements currently
 *   in place. Reachable only by satisfying every declared requirement.
 * - `not_provisioned` — the integration exists in code but no credential,
 *   endpoint or agreement is in place. This is the honest state of every
 *   government integration in this repository today, and it is an *operator*
 *   problem: someone must sign something or provision something.
 * - `not_implemented` — there is no integration, because none can be built
 *   responsibly right now (no public interface, or automating it would raise a
 *   terms-of-service question). This is an *engineering and legal* problem, and
 *   it is deliberately distinct from `not_provisioned`.
 * - `degraded` — it works, partially or unreliably, and the caller should know
 *   before depending on it.
 * - `refused_by_policy` — we will not build this. Custody of a citizen's
 *   government authentication credential is the case this state exists for.
 */
export type CapabilityState =
  | 'available'
  | 'not_provisioned'
  | 'not_implemented'
  | 'degraded'
  | 'refused_by_policy';

/**
 * Whether a capability crosses the wire into a government system or is computed
 * locally from data we already hold.
 *
 * The distinction is what makes the "never green without a credential" invariant
 * checkable. Building a handoff document is genuinely available with no
 * credentials at all; retrieving a civil registry certificate is not, and any
 * adapter claiming otherwise is either lying or about to return fabricated data.
 */
export type CapabilitySurface = 'government_system' | 'local_computation';

/** Why we refuse. Kept as a closed set so the refusals can be audited as a group. */
export type PolicyRefusal =
  /**
   * Holding a user's government authentication secret — Cl@ve PIN, Cl@ve
   * Permanente password, e.firma private key, portal account password.
   */
  | 'no_credential_custody'
  /**
   * Performing a legal act while presenting as the user. Requires credential
   * custody in practice, and separately makes the operator the actor in a
   * proceeding that is supposed to be the user's own.
   */
  | 'no_impersonation';

/** What kind of precondition a capability is waiting on. */
export type RequirementKind =
  /**
   * A secret belonging to *Meridian as a service* — a service-provider signing
   * key, an API token issued to the platform. Not the user's credential. The
   * distinction matters: refusing to hold a citizen's authenticator does not
   * mean refusing to hold our own service identity.
   */
  | 'service_secret'
  /** A signed agreement, accreditation or scheme enrolment with the authority. */
  | 'agreement'
  /** A configured endpoint or environment target. */
  | 'endpoint'
  /** A wired transport implementation. Absent until someone writes and injects one. */
  | 'transport';

/**
 * A single precondition, identified by the *name* of a configuration key.
 *
 * `key` is a name and never a value. This package never reads, stores, logs or
 * transmits credential material; satisfaction is determined by a presence probe
 * that answers a yes/no question about a named key. That is deliberate — a
 * status board that can render "which secrets are missing" without ever holding
 * one is a status board that is safe to expose to an operator.
 */
export interface CapabilityRequirement {
  readonly key: string;
  readonly kind: RequirementKind;
  readonly description: string;
  readonly satisfied: boolean;
}

export function requirement(
  key: string,
  kind: RequirementKind,
  description: string,
  satisfied: boolean,
): CapabilityRequirement {
  return Object.freeze({ key, kind, description, satisfied });
}

/**
 * The honest thing a caller can do instead of the capability they asked for.
 *
 * Mandatory on every refusal and every unimplemented capability. A platform that
 * says "we will not do that" and stops has moved the problem to the user without
 * helping; a platform that says "we will not do that, here is the handoff that
 * achieves the same outcome with you as the actor" has actually solved it.
 */
export interface HonestAlternative {
  /** A capability id in the same report, when the alternative is something we do. */
  readonly capabilityId: string | null;
  readonly description: string;
}

export interface Capability {
  readonly id: string;
  readonly title: string;
  readonly surface: CapabilitySurface;
  readonly state: CapabilityState;
  /** Human-readable, human-actionable. Rendered verbatim on the status board. */
  readonly reason: string;
  readonly requirements: readonly CapabilityRequirement[];
  /** Concrete steps that would move this to `available`. Empty for a policy refusal. */
  readonly unblockPath: readonly string[];
  readonly alternative: HonestAlternative | null;
  readonly policy: PolicyRefusal | null;
  readonly citations: readonly Citation[];
}

export interface CapabilitySpec {
  readonly id: string;
  readonly title: string;
  readonly surface: CapabilitySurface;
  readonly state: CapabilityState;
  readonly reason: string;
  readonly requirements?: readonly CapabilityRequirement[];
  readonly unblockPath?: readonly string[];
  readonly alternative?: HonestAlternative | null;
  readonly policy?: PolicyRefusal | null;
  readonly citations: readonly Citation[];
}

export function capability(spec: CapabilitySpec): Capability {
  return Object.freeze({
    id: spec.id,
    title: spec.title,
    surface: spec.surface,
    state: spec.state,
    reason: spec.reason,
    requirements: Object.freeze([...(spec.requirements ?? [])]),
    unblockPath: Object.freeze([...(spec.unblockPath ?? [])]),
    alternative: spec.alternative ?? null,
    policy: spec.policy ?? null,
    citations: Object.freeze([...spec.citations]),
  });
}

/**
 * Derive state from preconditions instead of asserting it.
 *
 * Every `government_system` capability in this package computes its state this
 * way. That is what makes "no adapter claims `available` without a configured
 * credential source" a property of the code rather than a promise in a comment:
 * with an empty requirement set the function cannot return `available` either,
 * because a remote capability with no requirements is itself a defect.
 */
export function stateFromRequirements(
  requirements: readonly CapabilityRequirement[],
  whenUnsatisfied: Exclude<CapabilityState, 'available'>,
): CapabilityState {
  if (requirements.length === 0) return whenUnsatisfied;
  return requirements.every((r) => r.satisfied) ? 'available' : whenUnsatisfied;
}

/** Requirements still outstanding, by name. Safe to log — these are key names. */
export function unsatisfiedRequirements(c: Capability): readonly CapabilityRequirement[] {
  return c.requirements.filter((r) => !r.satisfied);
}

export interface CapabilityReport {
  readonly adapterId: string;
  readonly displayName: string;
  readonly jurisdiction: CountryCode;
  readonly generatedOn: IsoDate;
  readonly capabilities: readonly Capability[];
}

export function capabilityReport(
  adapterId: string,
  displayName: string,
  jurisdiction: CountryCode,
  generatedOn: IsoDate,
  capabilities: readonly Capability[],
): CapabilityReport {
  return Object.freeze({
    adapterId,
    displayName,
    jurisdiction,
    generatedOn,
    capabilities: Object.freeze([...capabilities]),
  });
}

export function findCapability(report: CapabilityReport, capabilityId: string): Capability | null {
  return report.capabilities.find((c) => c.id === capabilityId) ?? null;
}

/** Count of capabilities in each state. Every state appears, including zeroes. */
export function summariseStates(
  reports: readonly CapabilityReport[],
): Readonly<Record<CapabilityState, number>> {
  const totals: Record<CapabilityState, number> = {
    available: 0,
    not_provisioned: 0,
    not_implemented: 0,
    degraded: 0,
    refused_by_policy: 0,
  };
  for (const report of reports) {
    for (const c of report.capabilities) totals[c.state] += 1;
  }
  return Object.freeze(totals);
}

/* -------------------------------------------------------------------------- */
/* Consistency checking                                                       */
/* -------------------------------------------------------------------------- */

export type CapabilityDefectCode =
  | 'EMPTY_REPORT'
  | 'DUPLICATE_CAPABILITY_ID'
  | 'MISSING_REASON'
  | 'AVAILABLE_WITHOUT_CREDENTIAL'
  | 'AVAILABLE_WITH_UNSATISFIED_REQUIREMENT'
  | 'LOCAL_CAPABILITY_DECLARES_CREDENTIAL'
  | 'LOCAL_CAPABILITY_NOT_PROVISIONED'
  | 'NOT_PROVISIONED_WITHOUT_REQUIREMENT'
  | 'NOT_PROVISIONED_WITH_REQUIREMENTS_MET'
  | 'REFUSAL_HAS_UNBLOCK_PATH'
  | 'REFUSAL_WITHOUT_ALTERNATIVE'
  | 'REFUSAL_WITHOUT_POLICY'
  | 'POLICY_ON_NON_REFUSAL'
  | 'UNIMPLEMENTED_WITHOUT_ALTERNATIVE'
  | 'DANGLING_ALTERNATIVE'
  | 'CAPABILITY_WITHOUT_CITATION'
  | 'MALFORMED_CITATION'
  | 'STALE_CITATION';

export interface CapabilityDefect {
  readonly code: CapabilityDefectCode;
  readonly adapterId: string;
  /** `null` when the defect is about the report as a whole. */
  readonly capabilityId: string | null;
  readonly message: string;
}

/**
 * Check a report against the invariants above and return everything wrong with
 * it. Returns defects rather than throwing: the admin console needs to render an
 * inconsistent adapter, not crash on it, and a CI job needs the full list in one
 * pass rather than the first failure.
 */
export function capabilityDefects(report: CapabilityReport): CapabilityDefect[] {
  const defects: CapabilityDefect[] = [];
  const add = (code: CapabilityDefectCode, capabilityId: string | null, message: string): void => {
    defects.push({ code, adapterId: report.adapterId, capabilityId, message });
  };

  if (report.capabilities.length === 0) {
    add('EMPTY_REPORT', null, 'Adapter declares no capabilities; it cannot be assessed for honesty.');
    return defects;
  }

  const seen = new Set<string>();
  const ids = new Set(report.capabilities.map((c) => c.id));

  for (const c of report.capabilities) {
    if (seen.has(c.id)) {
      add('DUPLICATE_CAPABILITY_ID', c.id, `Capability id ${c.id} is declared more than once.`);
    }
    seen.add(c.id);

    if (c.reason.trim().length === 0) {
      add('MISSING_REASON', c.id, 'Every capability state must carry a reason a human can act on.');
    }

    if (c.state === 'available') {
      if (c.surface === 'government_system' && c.requirements.length === 0) {
        add(
          'AVAILABLE_WITHOUT_CREDENTIAL',
          c.id,
          'A capability that touches a government system cannot be available with no declared ' +
            'credential, endpoint or agreement. Either it is unprovisioned, or it is returning ' +
            'data it did not obtain from the authority.',
        );
      }
      const outstanding = unsatisfiedRequirements(c);
      if (outstanding.length > 0) {
        add(
          'AVAILABLE_WITH_UNSATISFIED_REQUIREMENT',
          c.id,
          `Reported available while these requirements are unmet: ${outstanding.map((r) => r.key).join(', ')}.`,
        );
      }
    }

    if (c.surface === 'local_computation') {
      if (c.requirements.length > 0) {
        add(
          'LOCAL_CAPABILITY_DECLARES_CREDENTIAL',
          c.id,
          'A local computation must not depend on a credential; if it does, it is not local.',
        );
      }
      if (c.state === 'not_provisioned') {
        add(
          'LOCAL_CAPABILITY_NOT_PROVISIONED',
          c.id,
          'A local computation cannot be unprovisioned — there is nothing to provision.',
        );
      }
    }

    if (c.state === 'not_provisioned') {
      if (c.requirements.length === 0) {
        add(
          'NOT_PROVISIONED_WITHOUT_REQUIREMENT',
          c.id,
          'Unprovisioned with nothing outstanding gives the operator nothing to do. Declare what is missing.',
        );
      } else if (c.requirements.every((r) => r.satisfied)) {
        add(
          'NOT_PROVISIONED_WITH_REQUIREMENTS_MET',
          c.id,
          'Every requirement is satisfied yet the capability reports unprovisioned; the state is stale ' +
            'or hard-coded rather than derived.',
        );
      }
    }

    if (c.state === 'refused_by_policy') {
      if (c.unblockPath.length > 0) {
        add(
          'REFUSAL_HAS_UNBLOCK_PATH',
          c.id,
          'A policy refusal has no unblock path by definition. Publishing one invites a future ' +
            'contributor to walk it.',
        );
      }
      if (c.policy === null) {
        add('REFUSAL_WITHOUT_POLICY', c.id, 'A refusal must name the policy it rests on.');
      }
      if (c.alternative === null) {
        add(
          'REFUSAL_WITHOUT_ALTERNATIVE',
          c.id,
          'A refusal must offer the honest alternative. "No" on its own moves the problem to the user.',
        );
      }
    } else if (c.policy !== null) {
      add(
        'POLICY_ON_NON_REFUSAL',
        c.id,
        `Capability names policy ${c.policy} but its state is ${c.state}; only a refusal carries a policy.`,
      );
    }

    if (c.state === 'not_implemented' && c.alternative === null) {
      add(
        'UNIMPLEMENTED_WITHOUT_ALTERNATIVE',
        c.id,
        'An unimplemented capability must say what the caller should do in the meantime.',
      );
    }

    if (c.alternative?.capabilityId != null && !ids.has(c.alternative.capabilityId)) {
      add(
        'DANGLING_ALTERNATIVE',
        c.id,
        `Alternative points at capability ${c.alternative.capabilityId}, which this adapter does not declare.`,
      );
    }

    if (c.citations.length === 0) {
      add(
        'CAPABILITY_WITHOUT_CITATION',
        c.id,
        'Every capability rests on a published rule or a published procedure; name it.',
      );
    }
    for (const citation of c.citations) {
      if (!isCitationWellFormed(citation)) {
        add('MALFORMED_CITATION', c.id, `Citation ${citation.id} is missing identity fields.`);
        continue;
      }
      if (staleness(citation, report.generatedOn) === 'stale') {
        add(
          'STALE_CITATION',
          c.id,
          `Citation ${citation.id} was last verified on ${citation.verifiedOn}; re-verify before relying on it.`,
        );
      }
    }
  }

  return defects;
}
