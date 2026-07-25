/**
 * The government-integration status board.
 *
 * Nothing on this page is asserted by this app. `@meridian/govtech` builds the
 * capability report from each adapter's own preconditions and the console
 * renders it verbatim, including the reasons and the unblock paths. That is the
 * whole design: a status page that computes its own green ticks is the standard
 * way an estate ends up showing a wall of green over an unprovisioned estate,
 * and the first person to discover it is a client whose filing did not happen.
 *
 * Two things are worth understanding before reading the page.
 *
 * **Credential presence is a yes/no question about a key name.** `presenceFrom`
 * closes over the environment and answers "is `MERIDIAN_CLAVE_ENDPOINT` set to
 * something non-empty". No value is read, stored, logged or rendered. That is
 * what makes it safe to show an operator exactly which preconditions are
 * missing.
 *
 * **`refused_by_policy` is not a failure state.** It sits beside
 * `not_provisioned` and `not_implemented` on the board because it is a different
 * kind of answer with a different owner: an operator can fix the first, an
 * engineer the second, and nobody is going to fix the third because it is a
 * decision rather than a gap. The board prints the policy against those rows so
 * that a new engineer reading it learns why, rather than filing a ticket to
 * "finish" credential custody.
 */

import {
  CREDENTIAL_CUSTODY_POLICY,
  adapterContext,
  capabilityDefects,
  defaultRegistry,
  presenceFrom,
  verifyNoSyntheticSuccess,
  type AdapterContext,
  type Capability,
  type CapabilityDefect,
  type CapabilityReport,
  type CapabilityState,
  type IntegrationStatusBoard,
  type SyntheticSuccessFinding,
} from '@meridian/govtech';
import { citationAgeDays, staleness, type IsoDate, type Staleness } from '@meridian/core';

/**
 * Display order for capability states: worst-understood first.
 *
 * `refused_by_policy` sits last deliberately. It is the only state that is not
 * an open question, and putting settled decisions above open problems would
 * misrepresent where an operator's attention belongs.
 */
export const CAPABILITY_STATE_ORDER: readonly CapabilityState[] = [
  'degraded',
  'not_provisioned',
  'not_implemented',
  'available',
  'refused_by_policy',
];

export interface CapabilityCitationStanding {
  readonly citationId: string;
  readonly band: Staleness;
  /** Days since a human last checked the cited text. Never a placeholder. */
  readonly ageDays: number;
}

export interface CapabilityView {
  readonly capability: Capability;
  readonly outstanding: readonly string[];
  readonly citationBands: readonly CapabilityCitationStanding[];
  /** True when the honest alternative names another capability on the same report. */
  readonly alternativeResolves: boolean;
}

export interface AdapterView {
  readonly report: CapabilityReport;
  readonly summary: string;
  readonly capabilities: readonly CapabilityView[];
  readonly defects: readonly CapabilityDefect[];
  readonly totals: Readonly<Record<CapabilityState, number>>;
}

export interface IntegrationsView {
  readonly board: IntegrationStatusBoard;
  readonly adapters: readonly AdapterView[];
  /** Government operations that returned data while their capability was unavailable. */
  readonly syntheticSuccess: readonly SyntheticSuccessFinding[];
  /** How many probes were actually run, so "no findings" cannot mean "nothing checked". */
  readonly probesRun: number;
  readonly context: AdapterContext;
  readonly policy: typeof CREDENTIAL_CUSTODY_POLICY;
}

function tallyStates(report: CapabilityReport): Record<CapabilityState, number> {
  const totals: Record<CapabilityState, number> = {
    available: 0,
    not_provisioned: 0,
    not_implemented: 0,
    degraded: 0,
    refused_by_policy: 0,
  };
  for (const c of report.capabilities) totals[c.state] += 1;
  return totals;
}

/**
 * Build the board.
 *
 * Async because `verifyNoSyntheticSuccess` actually runs every government
 * operation probe in the registry. It is not a static claim on a page: with
 * nothing provisioned, a probe that returns data has fabricated it, and this is
 * the check that would catch that.
 */
export async function integrationsView(asOf: IsoDate): Promise<IntegrationsView> {
  const registry = defaultRegistry();
  // `presenceFrom` only ever answers a boolean about a named key; it never
  // enumerates the environment and never reads a value out of it.
  const context = adapterContext(asOf, presenceFrom(process.env));
  const board = registry.statusBoard(context);
  const syntheticSuccess = await verifyNoSyntheticSuccess(registry, context);
  const probesRun = registry.adapters.reduce((n, a) => n + a.governmentOperations.length, 0);

  const summaries = new Map(registry.adapters.map((a) => [a.id, a.summary]));

  const adapters = board.reports.map((report): AdapterView => {
    const ids = new Set(report.capabilities.map((c) => c.id));
    return {
      report,
      summary: summaries.get(report.adapterId) ?? '',
      defects: capabilityDefects(report),
      totals: tallyStates(report),
      capabilities: [...report.capabilities]
        .sort(
          (a, b) =>
            CAPABILITY_STATE_ORDER.indexOf(a.state) - CAPABILITY_STATE_ORDER.indexOf(b.state) ||
            (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        )
        .map((capability): CapabilityView => ({
          capability,
          outstanding: capability.requirements.filter((r) => !r.satisfied).map((r) => r.key),
          citationBands: capability.citations.map((c) => ({
            citationId: c.id,
            band: staleness(c, asOf),
            ageDays: citationAgeDays(c, asOf),
          })),
          alternativeResolves:
            capability.alternative !== null &&
            capability.alternative.capabilityId !== null &&
            ids.has(capability.alternative.capabilityId),
        })),
    };
  });

  return {
    board,
    adapters,
    syntheticSuccess,
    probesRun,
    context,
    policy: CREDENTIAL_CUSTODY_POLICY,
  };
}

/** Every distinct policy refusal on the board, with the capabilities that carry it. */
export function refusalsByPolicy(
  view: IntegrationsView,
): { readonly policy: string; readonly capabilities: readonly { adapterId: string; capability: Capability }[] }[] {
  const groups = new Map<string, { adapterId: string; capability: Capability }[]>();
  for (const adapter of view.adapters) {
    for (const { capability } of adapter.capabilities) {
      if (capability.policy === null) continue;
      const list = groups.get(capability.policy) ?? [];
      list.push({ adapterId: adapter.report.adapterId, capability });
      groups.set(capability.policy, list);
    }
  }
  return [...groups.entries()]
    .map(([policy, capabilities]) => ({ policy, capabilities }))
    .sort((a, b) => (a.policy < b.policy ? -1 : a.policy > b.policy ? 1 : 0));
}
