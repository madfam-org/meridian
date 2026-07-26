/**
 * The government-integration status board.
 *
 * Nothing on this board is asserted by the console — each adapter computes its
 * own state from its own preconditions — so the tests are about the properties
 * that would let the board lie by accident:
 *
 *  - a probe count, so "no findings" can never quietly mean "nothing was
 *    checked";
 *  - key *names* only, never values, so showing an operator exactly which
 *    preconditions are missing stays safe on a public deployment;
 *  - `refused_by_policy` kept apart from `not_provisioned` and
 *    `not_implemented`, because they have different owners and only one of them
 *    is a gap.
 */

import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_STATE_ORDER,
  integrationsView,
  refusalsByPolicy,
} from '@/lib/integrations';
import { ASOF } from './fixtures';

/** Built once: `verifyNoSyntheticSuccess` actually runs every probe. */
const view = await integrationsView(ASOF);

describe('display order', () => {
  it('puts settled decisions below open problems', () => {
    // `refused_by_policy` is the only state that is not an open question.
    // Ranking it above one would misrepresent where attention belongs.
    expect(CAPABILITY_STATE_ORDER[0]).toBe('degraded');
    expect(CAPABILITY_STATE_ORDER.at(-1)).toBe('refused_by_policy');
    expect([...CAPABILITY_STATE_ORDER].sort()).toEqual(
      ['available', 'degraded', 'not_implemented', 'not_provisioned', 'refused_by_policy'].sort(),
    );
  });

  it('sorts each adapter’s capabilities by state, then by id, totally', () => {
    for (const adapter of view.adapters) {
      const ranks = adapter.capabilities.map((c) =>
        CAPABILITY_STATE_ORDER.indexOf(c.capability.state),
      );
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
      expect(ranks.every((r) => r >= 0)).toBe(true);
    }
  });
});

describe('the board', () => {
  it('reports at least one adapter and gives every capability a state', () => {
    expect(view.adapters.length).toBeGreaterThan(0);
    const capabilities = view.adapters.flatMap((a) => a.capabilities);
    expect(capabilities.length).toBeGreaterThan(0);
    for (const { capability } of capabilities) {
      expect(CAPABILITY_STATE_ORDER).toContain(capability.state);
      expect(capability.reason.length).toBeGreaterThan(0);
    }
  });

  it('tallies each adapter’s states to the number of capabilities it has', () => {
    // A total that does not add up is how a wall of green hides a row.
    for (const adapter of view.adapters) {
      const summed = CAPABILITY_STATE_ORDER.reduce((n, s) => n + adapter.totals[s], 0);
      expect(summed).toBe(adapter.report.capabilities.length);
    }
  });

  it('shows no government system as available while nothing is provisioned', () => {
    // The wall-of-green defect, stated precisely. Local computation — a
    // readiness checklist, a handoff packet — is genuinely available with
    // nothing configured. Anything that would *talk to a government* is not,
    // and a board that let one drift into `available` is the board that tells
    // an operator a filing route works when it does not.
    const government = view.adapters
      .flatMap((a) => a.capabilities)
      .filter((c) => c.capability.surface === 'government_system');
    expect(government.length).toBeGreaterThan(0);
    expect(government.filter((c) => c.capability.state === 'available')).toEqual([]);
    expect(view.board.totals.not_provisioned + view.board.totals.not_implemented).toBeGreaterThan(0);
  });

  it('never calls a capability available while a precondition is outstanding', () => {
    for (const { capability, outstanding } of view.adapters.flatMap((a) => a.capabilities)) {
      if (capability.state === 'available') expect(outstanding).toEqual([]);
    }
  });

  it('agrees with the adapters’ own consistency check', () => {
    // `capabilityDefects` is the govtech package auditing itself. A defect here
    // means an adapter contradicted its own declared preconditions, which no
    // amount of careful rendering in this console would make safe.
    expect(view.board.defects).toEqual([]);
    expect(view.board.consistent).toBe(true);
    for (const adapter of view.adapters) expect(adapter.defects).toEqual([]);
  });

  it('reports how many probes ran, so "no findings" cannot mean "nothing checked"', () => {
    // The read-proof. A synthetic-success check that scanned zero operations
    // and a check that scanned forty and found nothing must not print the same
    // thing.
    expect(view.probesRun).toBeGreaterThan(0);
    expect(view.syntheticSuccess).toEqual([]);
  });
});

describe('credential presence', () => {
  it('lists outstanding preconditions by key name and never by value', async () => {
    // `presenceFrom` answers a boolean about a named key. Nothing reads a
    // value, so an operator can be shown exactly what is missing on a public
    // deployment.
    //
    // The board is rebuilt *inside* the test with a real value in the
    // environment, because `presenceFrom` closes over `process.env` at the
    // moment the view is constructed — asserting against the module-level view
    // would be asserting that a value set afterwards did not appear, which
    // nothing could have made it do.
    const canary = 'canary-value-must-not-appear';
    process.env.MERIDIAN_CLAVE_ENDPOINT = canary;
    process.env.MERIDIAN_DICIREG_ENDPOINT = canary;
    try {
      const withSecrets = await integrationsView(ASOF);
      const capabilities = withSecrets.adapters.flatMap((a) => a.capabilities);
      const outstanding = capabilities.flatMap((c) => c.outstanding);
      expect(outstanding.length).toBeGreaterThan(0);
      for (const key of outstanding) {
        // A key name, not an assignment: nothing on the board is `KEY=value`.
        expect(key).not.toContain('=');
      }
      // Nowhere on the report — not in a reason, a requirement description, an
      // unblock step or an alternative — does the value itself appear.
      expect(JSON.stringify(withSecrets.board)).not.toContain(canary);
      expect(JSON.stringify(capabilities)).not.toContain(canary);
    } finally {
      delete process.env.MERIDIAN_CLAVE_ENDPOINT;
      delete process.env.MERIDIAN_DICIREG_ENDPOINT;
    }
  });

  it('notices a precondition that has been satisfied', () => {
    // The other side of the test above: if setting a key changed nothing, the
    // check would be asserting against a board that ignores its environment.
    const key = 'MERIDIAN_CLAVE_ENDPOINT';
    const outstanding = view.adapters.flatMap((a) => a.capabilities).flatMap((c) => c.outstanding);
    expect(outstanding).toContain(key);

    process.env[key] = 'https://example.invalid/clave';
    try {
      return integrationsView(ASOF).then((provisioned) => {
        const stillOutstanding = provisioned.adapters
          .flatMap((a) => a.capabilities)
          .flatMap((c) => c.outstanding);
        expect(stillOutstanding).not.toContain(key);
      });
    } finally {
      delete process.env[key];
    }
  });

  it('marks an unsatisfied requirement as outstanding and nothing else', () => {
    for (const adapter of view.adapters) {
      for (const { capability, outstanding } of adapter.capabilities) {
        const unsatisfied = capability.requirements.filter((r) => !r.satisfied).map((r) => r.key);
        expect([...outstanding]).toEqual(unsatisfied);
      }
    }
  });
});

describe('policy refusals', () => {
  it('carries the policy on every refused capability', () => {
    // The row that teaches a new engineer why credential custody is not on the
    // roadmap. A refusal with no policy attached reads as an unfinished
    // feature.
    const refused = view.adapters
      .flatMap((a) => a.capabilities)
      .filter((c) => c.capability.state === 'refused_by_policy');
    expect(refused.length).toBeGreaterThan(0);
    for (const { capability } of refused) {
      expect(capability.policy).not.toBeNull();
      expect(capability.reason.length).toBeGreaterThan(0);
    }
  });

  it('groups refusals by policy, sorted, naming the adapter each came from', () => {
    const groups = refusalsByPolicy(view);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.map((g) => g.policy)).toEqual([...groups.map((g) => g.policy)].sort());
    for (const group of groups) {
      expect(group.capabilities.length).toBeGreaterThan(0);
      for (const entry of group.capabilities) {
        expect(entry.adapterId.length).toBeGreaterThan(0);
        expect(entry.capability.policy).toBe(group.policy);
      }
    }
  });

  it('refuses credential custody by name, with reasons and an alternative', () => {
    expect(refusalsByPolicy(view).map((g) => g.policy)).toContain('no_credential_custody');
    expect(view.policy.summary.length).toBeGreaterThan(0);
    expect(view.policy.refuses.length).toBeGreaterThan(0);
    expect(view.policy.because.length).toBeGreaterThan(0);
    expect(view.policy.insteadDo.length).toBeGreaterThan(0);
  });

  it('offers an honest alternative on every refused capability', () => {
    // A refusal with no alternative leaves a practitioner with no route at all,
    // which is a different and worse answer than "not through us".
    for (const { capability } of view.adapters
      .flatMap((a) => a.capabilities)
      .filter((c) => c.capability.state === 'refused_by_policy')) {
      expect(capability.alternative).not.toBeNull();
      expect(capability.alternative?.description.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('says whether a named alternative resolves to a capability on the same report', () => {
    // A dangling alternative id renders as a broken cross-reference rather than
    // as a link the reader will click and find nothing behind.
    for (const adapter of view.adapters) {
      const ids = new Set(adapter.capabilities.map((c) => c.capability.id));
      for (const { capability, alternativeResolves } of adapter.capabilities) {
        const target = capability.alternative?.capabilityId ?? null;
        expect(alternativeResolves).toBe(target !== null && ids.has(target));
      }
    }
  });
});

describe('citation bands', () => {
  it('ages every cited instrument against the reference date, never a placeholder', () => {
    for (const adapter of view.adapters) {
      for (const { capability, citationBands } of adapter.capabilities) {
        expect(citationBands).toHaveLength(capability.citations.length);
        for (const band of citationBands) {
          expect(['fresh', 'aging', 'stale']).toContain(band.band);
          expect(Number.isFinite(band.ageDays)).toBe(true);
        }
      }
    }
  });

  it('re-bands when asked about a different date', async () => {
    // The board is answerable about the past like every other screen. Asked
    // about a date before a citation was verified, the age goes negative rather
    // than being clamped.
    const earlier = await integrationsView('2024-01-01' as typeof ASOF);
    const bands = earlier.adapters.flatMap((a) => a.capabilities).flatMap((c) => c.citationBands);
    expect(bands.length).toBeGreaterThan(0);
    expect(bands.some((b) => b.ageDays < 0)).toBe(true);
  });
});
