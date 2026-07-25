import { describe, expect, it } from 'vitest';
import type { IsoDate } from '@meridian/core';
import { defaultRegistry } from '../src/index.js';
import {
  adapterContext,
  createRegistry,
  noCredentials,
  presenceFrom,
  requireCapability,
  verifyNoSyntheticSuccess,
} from '../src/adapter.js';
import { capabilityDefects } from '../src/capability.js';
import { createClaveAdapter, CLAVE_CAPABILITY, CLAVE_CONFIG_KEYS } from '../src/adapters/clave.js';
import { createDiciregAdapter, DICIREG_CAPABILITY, DICIREG_CONFIG_KEYS } from '../src/adapters/dicireg.js';
import { createIrccAdapter, IRCC_CAPABILITY } from '../src/adapters/ircc.js';
import type { CivilRegistryTransport } from '../src/adapters/dicireg.js';

const ASOF = '2026-07-25' as IsoDate;
const bare = adapterContext(ASOF, noCredentials);

/** Everything an operator could set. Still not enough, and that is the point. */
const allEnvSet = adapterContext(
  ASOF,
  presenceFrom({
    [CLAVE_CONFIG_KEYS.agreement]: 'ref',
    [CLAVE_CONFIG_KEYS.signingKey]: 'ref',
    [CLAVE_CONFIG_KEYS.endpoint]: 'https://example.invalid',
    [DICIREG_CONFIG_KEYS.agreement]: 'ref',
    [DICIREG_CONFIG_KEYS.clientCertificate]: 'ref',
    [DICIREG_CONFIG_KEYS.endpoint]: 'https://example.invalid',
  }),
);

describe('the registry', () => {
  it('lists every adapter and resolves them by id', () => {
    const registry = defaultRegistry();
    expect(registry.adapters.map((a) => a.id).sort()).toEqual(['ca-ircc', 'es-clave', 'es-dicireg']);
    expect(registry.get('es-clave')?.displayName).toBe('Cl@ve (Spain)');
    expect(registry.get('nope')).toBeNull();
  });

  it('refuses to be assembled with duplicate ids', () => {
    expect(() => createRegistry([createClaveAdapter(), createClaveAdapter()])).toThrow(/duplicate adapter id/);
  });

  it('produces a status board that is internally consistent', () => {
    const board = defaultRegistry().statusBoard(bare);
    expect(board.defects).toEqual([]);
    expect(board.consistent).toBe(true);
    expect(board.generatedOn).toBe(ASOF);
    expect(board.reports).toHaveLength(3);
  });

  it('reports the estate honestly: nothing green, and the refusals visible', () => {
    const board = defaultRegistry().statusBoard(bare);
    expect(board.totals.not_provisioned).toBeGreaterThan(0);
    expect(board.totals.not_implemented).toBeGreaterThan(0);
    expect(board.totals.refused_by_policy).toBeGreaterThan(0);
    // The only `available` capabilities are local computations.
    const availableRemote = board.reports
      .flatMap((r) => r.capabilities)
      .filter((c) => c.state === 'available' && c.surface === 'government_system');
    expect(availableRemote).toEqual([]);
  });
});

describe('no capability is green without a configured credential source', () => {
  it.each(defaultRegistry().adapters.map((a) => [a.id, a] as const))(
    '%s declares no available government capability with nothing configured',
    (_id, adapter) => {
      const report = adapter.describeCapabilities(bare);
      for (const c of report.capabilities) {
        if (c.surface !== 'government_system') continue;
        expect(c.state).not.toBe('available');
      }
    },
  );

  it.each(defaultRegistry().adapters.map((a) => [a.id, a] as const))(
    '%s stays unavailable even with every environment key set, because the transport is missing',
    (_id, adapter) => {
      const report = adapter.describeCapabilities(allEnvSet);
      for (const c of report.capabilities) {
        if (c.surface !== 'government_system') continue;
        expect(c.state).not.toBe('available');
      }
    },
  );

  it.each(defaultRegistry().adapters.map((a) => [a.id, a] as const))(
    '%s reports a reason and a citation for every capability',
    (_id, adapter) => {
      const report = adapter.describeCapabilities(bare);
      expect(report.capabilities.length).toBeGreaterThan(0);
      for (const c of report.capabilities) {
        expect(c.reason.trim().length).toBeGreaterThan(0);
        expect(c.citations.length).toBeGreaterThan(0);
      }
      expect(capabilityDefects(report)).toEqual([]);
    },
  );

  it('every refusal names its policy and points somewhere real', () => {
    for (const adapter of defaultRegistry().adapters) {
      const report = adapter.describeCapabilities(bare);
      const ids = new Set(report.capabilities.map((c) => c.id));
      for (const c of report.capabilities.filter((x) => x.state === 'refused_by_policy')) {
        expect(c.policy).not.toBeNull();
        expect(c.alternative).not.toBeNull();
        expect(c.unblockPath).toEqual([]);
        if (c.alternative?.capabilityId != null) expect(ids.has(c.alternative.capabilityId)).toBe(true);
      }
    }
  });
});

describe('no synthetic success', () => {
  it('finds nothing fabricated across the shipped registry', async () => {
    expect(await verifyNoSyntheticSuccess(defaultRegistry(), bare)).toEqual([]);
  });

  it('finds nothing fabricated even with every environment key set', async () => {
    expect(await verifyNoSyntheticSuccess(defaultRegistry(), allEnvSet)).toEqual([]);
  });

  it('every government operation fails with a code that names an owner', async () => {
    for (const adapter of defaultRegistry().adapters) {
      for (const operation of adapter.governmentOperations) {
        const result = await operation.probe(bare);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect([
            'ADAPTER_NOT_PROVISIONED',
            'ADAPTER_UNAVAILABLE',
            'CREDENTIAL_CUSTODY_REFUSED',
          ]).toContain(result.error.code);
        }
      }
    }
  });

  it('catches an adapter that does fabricate, so the check is not vacuous', async () => {
    const liar = {
      ...createIrccAdapter(),
      governmentOperations: [
        {
          capabilityId: IRCC_CAPABILITY.statusPolling,
          description: 'a fabricating status poll',
          probe: async () => ({ ok: true as const, value: { status: 'Approved' } }),
        },
      ],
    };
    const findings = await verifyNoSyntheticSuccess(createRegistry([liar]), bare);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/fabricated/);
  });
});

describe('requireCapability maps state to the owner of the problem', () => {
  const claveReport = createClaveAdapter().describeCapabilities(bare);
  const irccReport = createIrccAdapter().describeCapabilities(bare);

  it('passes an available capability through', () => {
    const gate = requireCapability(claveReport, CLAVE_CAPABILITY.registrationHandoff);
    expect(gate.ok).toBe(true);
  });

  it('maps unprovisioned to an operator problem', () => {
    const gate = requireCapability(claveReport, CLAVE_CAPABILITY.identityAssertion);
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.error.code).toBe('ADAPTER_NOT_PROVISIONED');
      expect(gate.error.details['outstandingRequirements']).toBeInstanceOf(Array);
      expect(gate.error.details['unblockPath']).toBeInstanceOf(Array);
    }
  });

  it('names the missing keys without ever holding their values', () => {
    const gate = requireCapability(claveReport, CLAVE_CAPABILITY.identityAssertion);
    if (gate.ok) throw new Error('expected a refusal');
    const outstanding = gate.error.details['outstandingRequirements'] as { key: string }[];
    expect(outstanding.map((r) => r.key)).toContain(CLAVE_CONFIG_KEYS.agreement);
  });

  it('maps not-implemented to an engineering-and-legal problem', () => {
    const gate = requireCapability(irccReport, IRCC_CAPABILITY.employerPortalSubmission);
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.error.code).toBe('ADAPTER_UNAVAILABLE');
      expect(gate.error.message).toMatch(/terms-of-service/);
    }
  });

  it('maps a policy refusal to the credential custody refusal, with the alternative attached', () => {
    const gate = requireCapability(claveReport, CLAVE_CAPABILITY.credentialCustody);
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
      expect(gate.error.details['policyId']).toBe('meridian-no-credential-custody');
      expect(gate.error.details['alternative']).toBeTruthy();
    }
  });

  it('treats acting as the user as the same refusal as holding their credential', () => {
    const gate = requireCapability(claveReport, CLAVE_CAPABILITY.actAsUser);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('refuses an unknown capability rather than assuming it works', () => {
    const gate = requireCapability(claveReport, 'clave.invented');
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error.code).toBe('ADAPTER_UNAVAILABLE');
  });
});

describe('provisioning actually flips the state, so the gate is real', () => {
  const transport: CivilRegistryTransport = {
    endpointName: 'test-double',
    requestCertificate: async (request) => ({
      requestId: request.requestId,
      status: 'issued',
      registryOffice: 'Example office',
      issuedOn: ASOF,
      documentReference: 'REF-1',
      guidance: [],
    }),
  };

  it('stays unprovisioned with a transport but no configuration', () => {
    const adapter = createDiciregAdapter({ transport });
    const report = adapter.describeCapabilities(bare);
    const capability = report.capabilities.find((c) => c.id === DICIREG_CAPABILITY.certificateRetrieval);
    expect(capability?.state).toBe('not_provisioned');
  });

  it('becomes available only when configuration and transport are both present', () => {
    const adapter = createDiciregAdapter({ transport });
    const report = adapter.describeCapabilities(allEnvSet);
    const capability = report.capabilities.find((c) => c.id === DICIREG_CAPABILITY.certificateRetrieval);
    expect(capability?.state).toBe('available');
    expect(capabilityDefects(report)).toEqual([]);
  });

  it('returns the transport\'s answer, not one of its own', async () => {
    const adapter = createDiciregAdapter({ transport });
    const result = await adapter.requestCertificate(allEnvSet, {
      requestId: 'r-1',
      event: 'birth',
      form: 'literal',
      subject: { givenNames: 'Test', familyNames: 'Testerson' },
      delivery: 'electronic',
      requestedOn: ASOF,
      purpose: 'nationality file',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.documentReference).toBe('REF-1');
  });

  it('surfaces a transport failure as an adapter error rather than a result', async () => {
    const failing: CivilRegistryTransport = {
      endpointName: 'test-double',
      requestCertificate: async () => {
        throw new Error('endpoint refused the connection');
      },
    };
    const result = await createDiciregAdapter({ transport: failing }).requestCertificate(allEnvSet, {
      requestId: 'r-1',
      event: 'birth',
      form: 'literal',
      subject: { givenNames: 'Test', familyNames: 'Testerson' },
      delivery: 'electronic',
      requestedOn: ASOF,
      purpose: 'nationality file',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ADAPTER_UNAVAILABLE');
      expect(result.error.message).toMatch(/endpoint refused the connection/);
    }
  });
});

describe('presence probes', () => {
  it('answers only yes or no, and treats an empty value as absent', () => {
    const probe = presenceFrom({ SET: 'value', EMPTY: '', BLANK: '   ', MISSING: undefined });
    expect(probe('SET')).toBe(true);
    expect(probe('EMPTY')).toBe(false);
    expect(probe('BLANK')).toBe(false);
    expect(probe('MISSING')).toBe(false);
    expect(probe('NEVER_MENTIONED')).toBe(false);
  });

  it('defaults to nothing configured', () => {
    expect(noCredentials('ANYTHING')).toBe(false);
  });

  it('rejects a context built on an impossible date', () => {
    expect(() => adapterContext('2026-02-30' as IsoDate)).toThrow(RangeError);
  });
});
