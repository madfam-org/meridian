import { describe, expect, it } from 'vitest';
import type { Citation, CountryCode, IsoDate } from '@meridian/core';
import { countryCode } from '@meridian/core';
import type { Capability, CapabilityDefectCode, CapabilitySpec } from '../src/capability.js';
import {
  capability,
  capabilityDefects,
  capabilityReport,
  findCapability,
  requirement,
  stateFromRequirements,
  summariseStates,
  unsatisfiedRequirements,
} from '../src/capability.js';

const ASOF = '2026-07-25' as IsoDate;
const ES: CountryCode = countryCode('ES');

const citation: Citation = {
  id: 'test-citation',
  kind: 'official_guidance',
  instrument: 'Example published procedure',
  jurisdiction: 'ES',
  verifiedOn: ASOF,
};

const base: CapabilitySpec = {
  id: 'x.capability',
  title: 'Example capability',
  surface: 'local_computation',
  state: 'available',
  reason: 'Works locally with no preconditions.',
  citations: [citation],
};

const reportOf = (...capabilities: Capability[]) =>
  capabilityReport('test-adapter', 'Test Adapter', ES, ASOF, capabilities);

const codesFor = (...capabilities: Capability[]): CapabilityDefectCode[] =>
  capabilityDefects(reportOf(...capabilities)).map((d) => d.code);

describe('stateFromRequirements', () => {
  const satisfied = requirement('K1', 'endpoint', 'configured', true);
  const missing = requirement('K2', 'agreement', 'not configured', false);

  it('is available only when every requirement is met', () => {
    expect(stateFromRequirements([satisfied], 'not_provisioned')).toBe('available');
    expect(stateFromRequirements([satisfied, missing], 'not_provisioned')).toBe('not_provisioned');
    expect(stateFromRequirements([missing], 'not_provisioned')).toBe('not_provisioned');
  });

  it('refuses to call an empty requirement set available', () => {
    // The vacuous-truth trap: `[].every(...)` is true, and a remote capability
    // that declared nothing would otherwise report itself as working.
    expect(stateFromRequirements([], 'not_provisioned')).toBe('not_provisioned');
  });

  it('lists what is still outstanding, by key name only', () => {
    const c = capability({ ...base, surface: 'government_system', requirements: [satisfied, missing] });
    expect(unsatisfiedRequirements(c).map((r) => r.key)).toEqual(['K2']);
  });
});

describe('consistency checking catches each way a report can lie', () => {
  it('accepts a well-formed report', () => {
    expect(codesFor(capability(base))).toEqual([]);
  });

  it('rejects an empty report', () => {
    expect(capabilityDefects(reportOf()).map((d) => d.code)).toEqual(['EMPTY_REPORT']);
  });

  it('rejects duplicate capability ids', () => {
    expect(codesFor(capability(base), capability(base))).toContain('DUPLICATE_CAPABILITY_ID');
  });

  it('rejects a state with no reason a human can act on', () => {
    expect(codesFor(capability({ ...base, reason: '   ' }))).toContain('MISSING_REASON');
  });

  it('rejects a remote capability that is available with no credential at all', () => {
    expect(codesFor(capability({ ...base, surface: 'government_system' }))).toContain(
      'AVAILABLE_WITHOUT_CREDENTIAL',
    );
  });

  it('rejects a capability available while a requirement is unmet', () => {
    const defects = codesFor(
      capability({
        ...base,
        surface: 'government_system',
        requirements: [requirement('K', 'agreement', 'missing', false)],
      }),
    );
    expect(defects).toContain('AVAILABLE_WITH_UNSATISFIED_REQUIREMENT');
  });

  it('rejects a local capability that claims to need a credential', () => {
    const defects = codesFor(
      capability({ ...base, requirements: [requirement('K', 'service_secret', 'x', true)] }),
    );
    expect(defects).toContain('LOCAL_CAPABILITY_DECLARES_CREDENTIAL');
  });

  it('rejects a local capability reported as unprovisioned', () => {
    const defects = codesFor(capability({ ...base, state: 'not_provisioned' }));
    expect(defects).toContain('LOCAL_CAPABILITY_NOT_PROVISIONED');
  });

  it('rejects unprovisioned with nothing outstanding for an operator to do', () => {
    const defects = codesFor(
      capability({ ...base, surface: 'government_system', state: 'not_provisioned' }),
    );
    expect(defects).toContain('NOT_PROVISIONED_WITHOUT_REQUIREMENT');
  });

  it('rejects a hard-coded unprovisioned state when every requirement is met', () => {
    const defects = codesFor(
      capability({
        ...base,
        surface: 'government_system',
        state: 'not_provisioned',
        requirements: [requirement('K', 'endpoint', 'configured', true)],
      }),
    );
    expect(defects).toContain('NOT_PROVISIONED_WITH_REQUIREMENTS_MET');
  });

  it('rejects a policy refusal that publishes a way around itself', () => {
    const defects = codesFor(
      capability({
        ...base,
        surface: 'government_system',
        state: 'refused_by_policy',
        policy: 'no_credential_custody',
        alternative: { capabilityId: null, description: 'Use a handoff.' },
        unblockPath: ['Ask nicely.'],
      }),
    );
    expect(defects).toContain('REFUSAL_HAS_UNBLOCK_PATH');
  });

  it('rejects a refusal with no policy and no alternative', () => {
    const defects = codesFor(
      capability({ ...base, surface: 'government_system', state: 'refused_by_policy' }),
    );
    expect(defects).toContain('REFUSAL_WITHOUT_POLICY');
    expect(defects).toContain('REFUSAL_WITHOUT_ALTERNATIVE');
  });

  it('rejects a policy named on something that is not a refusal', () => {
    expect(codesFor(capability({ ...base, policy: 'no_impersonation' }))).toContain('POLICY_ON_NON_REFUSAL');
  });

  it('rejects an unimplemented capability that leaves the caller nowhere to go', () => {
    const defects = codesFor(
      capability({ ...base, surface: 'government_system', state: 'not_implemented' }),
    );
    expect(defects).toContain('UNIMPLEMENTED_WITHOUT_ALTERNATIVE');
  });

  it('rejects an alternative pointing at a capability that does not exist', () => {
    const defects = codesFor(
      capability({
        ...base,
        surface: 'government_system',
        state: 'not_implemented',
        alternative: { capabilityId: 'x.does_not_exist', description: 'Go there.' },
      }),
    );
    expect(defects).toContain('DANGLING_ALTERNATIVE');
  });

  it('accepts an alternative that resolves within the same report', () => {
    const target = capability({ ...base, id: 'x.handoff' });
    const source = capability({
      ...base,
      id: 'x.remote',
      surface: 'government_system',
      state: 'not_implemented',
      alternative: { capabilityId: 'x.handoff', description: 'Go there.' },
    });
    expect(codesFor(target, source)).toEqual([]);
  });

  it('rejects a capability that cites nothing', () => {
    expect(codesFor(capability({ ...base, citations: [] }))).toContain('CAPABILITY_WITHOUT_CITATION');
  });

  it('rejects a malformed citation', () => {
    const malformed: Citation = { ...citation, instrument: '  ' };
    expect(codesFor(capability({ ...base, citations: [malformed] }))).toContain('MALFORMED_CITATION');
  });

  it('flags a citation nobody has verified in over six months', () => {
    const stale: Citation = { ...citation, verifiedOn: '2025-01-01' as IsoDate };
    expect(codesFor(capability({ ...base, citations: [stale] }))).toContain('STALE_CITATION');
  });

  it('does not flag a citation verified within the freshness window', () => {
    const aging: Citation = { ...citation, verifiedOn: '2026-05-01' as IsoDate };
    expect(codesFor(capability({ ...base, citations: [aging] }))).not.toContain('STALE_CITATION');
  });
});

describe('summaries', () => {
  it('counts every state, including the ones at zero', () => {
    const totals = summariseStates([reportOf(capability(base))]);
    expect(totals).toEqual({
      available: 1,
      not_provisioned: 0,
      not_implemented: 0,
      degraded: 0,
      refused_by_policy: 0,
    });
  });

  it('sums across adapters', () => {
    const totals = summariseStates([reportOf(capability(base)), reportOf(capability(base))]);
    expect(totals.available).toBe(2);
  });

  it('returns null for an unknown capability rather than guessing', () => {
    expect(findCapability(reportOf(capability(base)), 'nope')).toBeNull();
  });
});
