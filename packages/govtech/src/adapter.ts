/**
 * The adapter contract and the registry behind the integration status board.
 *
 * Every government integration in Meridian implements {@link GovTechAdapter},
 * and the only thing the contract insists on is honesty: declare what you can do
 * right now, derive it from your actual preconditions, and route every operation
 * through the capability that authorises it.
 *
 * The registry exists so the admin console can render the estate as it really
 * is — a list of unprovisioned integrations with named missing agreements, and
 * two capabilities that will never be built — rather than a wall of green
 * checkmarks that means "the file compiles".
 */

import type { CountryCode, IsoDate, Result } from '@meridian/core';
import { MeridianError, err, isIsoDate, ok } from '@meridian/core';
import type {
  Capability,
  CapabilityDefect,
  CapabilityReport,
  CapabilityState,
} from './capability.js';
import { capabilityDefects, findCapability, summariseStates, unsatisfiedRequirements } from './capability.js';
import { credentialCustodyRefusal } from './credential-guard.js';

/**
 * Answers "is this named configuration key set?" — and nothing else.
 *
 * A probe returns a boolean, never a value. That is what lets the status board
 * report which secrets are missing without the reporting path ever touching one,
 * and it keeps this package free of ambient environment access: the caller
 * decides where configuration lives and hands in a closure over it.
 */
export type CredentialPresence = (key: string) => boolean;

/**
 * The honest default. Nothing is configured, so nothing is available.
 *
 * This is also the correct state of this repository today, which is why it is
 * the default rather than a testing convenience.
 */
export const noCredentials: CredentialPresence = () => false;

/**
 * Build a presence probe over a configuration map — typically `process.env`,
 * passed in by the application layer rather than reached for from here.
 *
 * A key present but empty counts as absent: an unset secret and a secret set to
 * the empty string are the same operational failure, and treating them
 * differently produces a green tick over a broken integration.
 */
export function presenceFrom(
  source: Readonly<Record<string, string | undefined>>,
): CredentialPresence {
  return (key: string): boolean => {
    const value = source[key];
    return typeof value === 'string' && value.trim().length > 0;
  };
}

export interface AdapterContext {
  /** The civil date the report is generated for; drives citation staleness. */
  readonly asOf: IsoDate;
  readonly hasCredential: CredentialPresence;
}

export function adapterContext(asOf: IsoDate, hasCredential: CredentialPresence = noCredentials): AdapterContext {
  if (!isIsoDate(asOf)) {
    throw new RangeError(`adapterContext requires a valid civil date, got ${String(asOf)}`);
  }
  return Object.freeze({ asOf, hasCredential });
}

/**
 * An operation that would touch a government system, paired with a probe that
 * exercises it with a minimal, credential-free payload.
 *
 * This exists so "no adapter returns synthetic success" is a property something
 * can *check* rather than a claim in a README. {@link verifyNoSyntheticSuccess}
 * runs every probe in the registry and reports any that returned data — which,
 * with nothing provisioned, means the adapter fabricated it.
 */
export interface GovernmentOperationProbe {
  readonly capabilityId: string;
  readonly description: string;
  readonly probe: (ctx: AdapterContext) => Promise<Result<unknown, MeridianError>>;
}

export interface GovTechAdapter {
  readonly id: string;
  readonly jurisdiction: CountryCode;
  readonly displayName: string;
  /** One line, factual, for the status board. */
  readonly summary: string;
  describeCapabilities(ctx: AdapterContext): CapabilityReport;
  /** Every operation that would cross into a government system. May be empty. */
  readonly governmentOperations: readonly GovernmentOperationProbe[];
}

/* -------------------------------------------------------------------------- */
/* The gate                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The single choke point every operation passes through.
 *
 * Each state maps to the error code that tells the caller *who owns the
 * problem*, because "adapter failed" sends everyone looking in the wrong place:
 *
 *  - `not_provisioned` → `ADAPTER_NOT_PROVISIONED`. An operator must provision
 *    something. Engineering has nothing to do.
 *  - `not_implemented` / `degraded` → `ADAPTER_UNAVAILABLE`. Engineering, or a
 *    prior legal question, owns it.
 *  - `refused_by_policy` → `CREDENTIAL_CUSTODY_REFUSED`. Nobody owns it; it is
 *    not going to happen. Both policy refusals map here, because acting as the
 *    user requires holding the user's authenticator — impersonation and
 *    credential custody are the same refusal seen from two ends.
 *
 * The error details carry the *names* of outstanding requirements and the honest
 * alternative, so an API can render something actionable without the caller
 * re-deriving it.
 */
export function requireCapability(
  report: CapabilityReport,
  capabilityId: string,
): Result<Capability, MeridianError> {
  const found = findCapability(report, capabilityId);
  if (found === null) {
    return err(
      new MeridianError('ADAPTER_UNAVAILABLE', `Adapter ${report.adapterId} declares no capability ${capabilityId}.`, {
        adapterId: report.adapterId,
        capabilityId,
        declared: report.capabilities.map((c) => c.id),
      }),
    );
  }

  if (found.state === 'available') return ok(found);

  const details: Record<string, unknown> = {
    adapterId: report.adapterId,
    capabilityId,
    state: found.state,
    reason: found.reason,
    outstandingRequirements: unsatisfiedRequirements(found).map((r) => ({
      key: r.key,
      kind: r.kind,
      description: r.description,
    })),
    unblockPath: found.unblockPath,
    alternative: found.alternative,
  };

  if (found.state === 'refused_by_policy') {
    const refusal = credentialCustodyRefusal({
      adapterId: report.adapterId,
      capabilityId,
      what: found.title,
    });
    return err(
      new MeridianError(refusal.code, refusal.message, { ...refusal.details, ...details }),
    );
  }

  const code = found.state === 'not_provisioned' ? 'ADAPTER_NOT_PROVISIONED' : 'ADAPTER_UNAVAILABLE';
  return err(new MeridianError(code, `${found.title}: ${found.reason}`, details));
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

export interface IntegrationStatusBoard {
  readonly generatedOn: IsoDate;
  readonly reports: readonly CapabilityReport[];
  readonly totals: Readonly<Record<CapabilityState, number>>;
  /**
   * Internal-consistency defects across every adapter. A non-empty list means
   * the board itself is not trustworthy and should say so rather than render.
   */
  readonly defects: readonly CapabilityDefect[];
  readonly consistent: boolean;
}

export interface AdapterRegistry {
  readonly adapters: readonly GovTechAdapter[];
  get(id: string): GovTechAdapter | null;
  statusBoard(ctx: AdapterContext): IntegrationStatusBoard;
}

/**
 * Duplicate ids throw rather than returning a `Result`: a registry assembled
 * wrongly is a programming error discovered at start-up, not a domain outcome a
 * caller can meaningfully handle.
 */
export function createRegistry(adapters: readonly GovTechAdapter[]): AdapterRegistry {
  const seen = new Set<string>();
  for (const adapter of adapters) {
    if (seen.has(adapter.id)) {
      throw new RangeError(`duplicate adapter id in registry: ${adapter.id}`);
    }
    seen.add(adapter.id);
  }
  const frozen = Object.freeze([...adapters]);

  return Object.freeze({
    adapters: frozen,
    get(id: string): GovTechAdapter | null {
      return frozen.find((a) => a.id === id) ?? null;
    },
    statusBoard(ctx: AdapterContext): IntegrationStatusBoard {
      const reports = frozen.map((a) => a.describeCapabilities(ctx));
      const defects = reports.flatMap((r) => capabilityDefects(r));
      return Object.freeze({
        generatedOn: ctx.asOf,
        reports: Object.freeze(reports),
        totals: summariseStates(reports),
        defects: Object.freeze(defects),
        consistent: defects.length === 0,
      });
    },
  });
}

export interface SyntheticSuccessFinding {
  readonly adapterId: string;
  readonly capabilityId: string;
  readonly message: string;
}

/**
 * Run every government operation in the registry and report any that succeeded
 * without a provisioned integration behind it.
 *
 * With no credentials configured, the correct result is that every probe fails —
 * and fails with a code that names an owner. A success here is the specific bug
 * this package is built to prevent: an adapter returning plausible data it did
 * not obtain from the authority, which reaches a client as a fact about their
 * legal status.
 *
 * Safe to run in production as a self-check; the probes carry no real payload.
 */
export async function verifyNoSyntheticSuccess(
  registry: AdapterRegistry,
  ctx: AdapterContext,
): Promise<readonly SyntheticSuccessFinding[]> {
  const findings: SyntheticSuccessFinding[] = [];
  for (const adapter of registry.adapters) {
    const report = adapter.describeCapabilities(ctx);
    for (const operation of adapter.governmentOperations) {
      const capability = findCapability(report, operation.capabilityId);
      const result = await operation.probe(ctx);
      if (result.ok && capability?.state !== 'available') {
        findings.push({
          adapterId: adapter.id,
          capabilityId: operation.capabilityId,
          message:
            `${operation.description} returned data while the capability is ` +
            `${capability?.state ?? 'undeclared'}. The adapter fabricated it.`,
        });
      }
    }
  }
  return findings;
}
