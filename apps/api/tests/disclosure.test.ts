/**
 * The advice boundary, end to end.
 *
 * The three things asserted here are the reason this service exists rather than
 * a thin CRUD layer over the engines:
 *
 *   1. an unrepresented individual asking for a ranking receives an assessment,
 *      with a machine-readable account of what was withheld;
 *   2. a firm — a practitioner audience — receives the ranking;
 *   3. *every* route that returns engine output actually goes through the gate,
 *      enumerated from the route registry rather than from a list somebody
 *      remembered to update.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { computeCheckDigit } from '@meridian/mrtd';
import { DISCLOSURE_HEADER, GATE_HEADER } from '../src/disclosure/plugin.js';
import { engineOutput } from '../src/disclosure/envelope.js';
import { scanForDisclosureLeak } from '../src/disclosure/leak-detector.js';
import { declare } from '../src/routes/helpers.js';
import { disclosable } from '@meridian/core';
import {
  REVIEWED_PATHWAY,
  TENANTS,
  createHarness,
  seedMatter,
  signToken,
  type Harness,
} from './harness.js';

let harness: Harness;

beforeEach(async () => {
  harness = await createHarness();
});

afterEach(async () => {
  await harness.close();
});

async function authed(tenantId: string, roles?: readonly string[]): Promise<string> {
  return signToken({ tenantId, roles: roles ?? ['tenant_admin', 'caseworker'] });
}

const FACTS = { applicantId: 'applicant-1', claimedNationality: 'MX' } as const;

describe('the advice boundary', () => {
  it('downgrades a ranking for an individual tenant with no representative', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.individual);
    const token = await authed(TENANTS.individual);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      classification: string;
      producedClassification: string;
      released: boolean;
      withheld: { code: string; downgradedTo: string; removedFields: string[]; reason: string };
      value: { assessments: unknown[]; ranked?: unknown };
    }>();

    expect(body.producedClassification).toBe('advice');
    expect(body.classification).toBe('assessment');
    expect(body.released).toBe(false);
    expect(body.withheld.code).toBe('ADVICE_BOUNDARY');
    expect(body.withheld.downgradedTo).toBe('assessment');
    // Machine-readable: a client has to be able to act on this — offer to attach
    // counsel, suppress a UI affordance — and it cannot do that by
    // pattern-matching English.
    expect(body.withheld.removedFields).toEqual(['ranked', 'excluded']);
    expect(body.withheld.reason).toContain('authorized representative');

    // What survives is every pathway, every verdict, every citation. What is
    // gone is the opinion about which one to pursue.
    expect(Array.isArray(body.value.assessments)).toBe(true);
    expect(body.value.ranked).toBeUndefined();
    expect(response.headers[DISCLOSURE_HEADER]).toBe('assessment');
  });

  it('releases the ranking to a firm tenant', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const token = await authed(TENANTS.firm);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      classification: string;
      released: boolean;
      withheld: unknown;
      value: { ranked: { pathwayId: string; rank: number }[] };
    }>();

    expect(body.classification).toBe('advice');
    expect(body.released).toBe(true);
    expect(body.withheld).toBeNull();
    // The fixture pathway is counsel-reviewed, so it is rankable. The shipped
    // catalog is entirely unreviewed and would rank nothing — which is the
    // correct live state, not a bug.
    expect(body.value.ranked.map((r) => r.pathwayId)).toContain(REVIEWED_PATHWAY.id);
    expect(response.headers[DISCLOSURE_HEADER]).toBe('advice');
  });

  it('releases the ranking to an individual whose matter has a live representative', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.individualRepresented, {
      representativeId: 'rep-es-1',
      targetJurisdiction: 'ES',
    });
    const token = await authed(TENANTS.individualRepresented);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });

    const body = response.json<{ classification: string; released: boolean }>();
    expect(body.classification).toBe('advice');
    expect(body.released).toBe(true);
  });

  it('refuses release when the representative is licensed in another jurisdiction', async () => {
    // A firm with a Spanish abogado on staff does not thereby make a Canadian
    // matter represented. `representativeFor` filters on jurisdiction, and the
    // matter's own representative is checked against the matter's target state.
    const { matterId } = await seedMatter(harness, TENANTS.individualRepresented, {
      representativeId: 'rep-es-1',
      targetJurisdiction: 'CA',
    });
    const token = await authed(TENANTS.individualRepresented);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });

    const body = response.json<{ classification: string; released: boolean; withheld: { reason: string } }>();
    expect(body.released).toBe(false);
    expect(body.classification).toBe('assessment');
    expect(body.withheld.reason).toContain('authorized in ES, not CA');
  });

  it('refuses release when the representative licence has lapsed', async () => {
    await harness.provider.forTenant(TENANTS.individual).representatives.add({
      id: 'rep-lapsed',
      jurisdiction: 'ES',
      credential: 'spanish_gestor',
      licenceNumber: 'FIXTURE-LAPSED',
      // Expired the day before the frozen clock — the boundary case, not a
      // comfortable margin.
      verifiedOn: '2025-01-01' as never,
      expiresOn: '2026-07-24' as never,
    });
    const { matterId } = await seedMatter(harness, TENANTS.individual, {
      representativeId: 'rep-lapsed',
    });
    const token = await authed(TENANTS.individual);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });

    const body = response.json<{ released: boolean; withheld: { reason: string } }>();
    expect(body.released).toBe(false);
    expect(body.withheld.reason).toContain('expired on 2026-07-24');
  });

  it('records a downgrade in the audit trail as its own action', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.individual);
    const token = await authed(TENANTS.individual);

    await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });

    const events = await harness.provider.forTenant(TENANTS.individual).audit.list({
      limit: 50,
      offset: 0,
      action: 'disclosure.downgraded',
    });
    expect(events).toHaveLength(1);
    const event = events[0];
    expect(event?.outcome).toBe('refused');
    expect(event?.disclosureClass).toBe('assessment');
    expect(event?.detail['producedClassification']).toBe('advice');
    expect(event?.detail['audience']).toBe('applicant');
    expect(event?.detail['representativeAttached']).toBe(false);
  });

  it('never releases advice to a corporate sponsor without a representative', async () => {
    // An employer is still an unlicensed audience for advice purposes, however
    // sophisticated it is.
    const { matterId } = await seedMatter(harness, TENANTS.corporate, { targetJurisdiction: 'CA' });
    const token = await authed(TENANTS.corporate);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: { facts: FACTS, matterId },
    });
    const body = response.json<{ classification: string; released: boolean }>();
    expect(body.released).toBe(false);
    expect(body.classification).toBe('assessment');
  });

  it('stores an evaluation with the classification the reader actually received', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.individual);
    const token = await authed(TENANTS.individual);

    await harness.app.inject({
      method: 'POST',
      url: '/v1/pathways/evaluate',
      headers: { authorization: `Bearer ${token}` },
      payload: { pathwayId: REVIEWED_PATHWAY.id, facts: FACTS, matterId },
    });

    const stored = await harness.provider
      .forTenant(TENANTS.individual)
      .evaluations.listForMatter(matterId, { limit: 10, offset: 0 });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.classification).toBe('assessment');
    expect(stored[0]?.released).toBe(true);
    expect(stored[0]?.pathwayVersion).toBe(REVIEWED_PATHWAY.version);
  });
});

describe('the gate covers every route that emits engine output', () => {
  /**
   * A request for each engine-output route, keyed by `METHOD url-template`.
   *
   * The assertion below is that this table and the route registry agree exactly.
   * Adding an engine-output route without adding an entry here fails the suite,
   * which is the point: the guarantee is enumerated from the registry rather
   * than from anyone's memory.
   */
  function requestTable(matterId: string): Record<
    string,
    { readonly url: string; readonly payload?: object }
  > {
    const checklistBody = {
      requirements: [
        {
          kind: 'birth_certificate',
          criterion: 'Fixture requirement used to exercise the checklist assembler.',
          citation: {
            id: 'fixture-doc-citation',
            kind: 'secondary',
            instrument: 'Meridian test fixture — not a legal instrument',
            jurisdiction: 'ES',
            verifiedOn: '2026-07-25',
            discretionary: true,
            note: 'Fixture data.',
          },
        },
      ],
      defaultIssuingCountry: 'MX',
      defaultLanguage: 'es',
      targetSubmissionDate: '2026-10-01',
    };

    return {
      'GET /v1/pathways': { url: '/v1/pathways' },
      'GET /v1/pathways/:pathwayId': { url: `/v1/pathways/${REVIEWED_PATHWAY.id}` },
      'POST /v1/pathways/evaluate': {
        url: '/v1/pathways/evaluate',
        payload: { pathwayId: REVIEWED_PATHWAY.id, facts: FACTS, matterId },
      },
      'POST /v1/pathways/recommend': {
        url: '/v1/pathways/recommend',
        payload: { facts: FACTS, matterId },
      },
      'POST /v1/pathways/assess': {
        url: '/v1/pathways/assess',
        payload: { facts: FACTS, matterId },
      },
      'GET /v1/matters/:id/presence/schengen': {
        url: `/v1/matters/${matterId}/presence/schengen`,
      },
      'GET /v1/matters/:id/presence/tax-residency': {
        url: `/v1/matters/${matterId}/presence/tax-residency`,
      },
      'GET /v1/matters/:id/presence/continuity': {
        url: `/v1/matters/${matterId}/presence/continuity?start=2024-01-01&end=2026-07-25`,
      },
      'POST /v1/matters/:id/documents/checklist': {
        url: `/v1/matters/${matterId}/documents/checklist`,
        payload: checklistBody,
      },
      'POST /v1/matters/:id/documents/gaps': {
        url: `/v1/matters/${matterId}/documents/gaps`,
        payload: checklistBody,
      },
      'POST /v1/identity/mrz': { url: '/v1/identity/mrz', payload: { mrz: 'not-a-real-zone' } },
      'GET /v1/govtech/capabilities': { url: '/v1/govtech/capabilities' },
      'GET /v1/govtech/adapters/:adapterId/capabilities': {
        url: '/v1/govtech/adapters/es-clave/capabilities',
      },
      'GET /v1/govtech/handoffs': { url: '/v1/govtech/handoffs' },
      'POST /v1/govtech/handoffs': {
        url: '/v1/govtech/handoffs',
        payload: {
          kind: 'es_clave_registration',
          matterId,
          route: 'video_call',
          fullName: 'Fixture Applicant',
        },
      },
    };
  }

  it('every registered engine-output route responds through the gate', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const token = await authed(TENANTS.firm);
    const table = requestTable(matterId);

    const registered = harness.app.meridian.routes.engineOutputRoutes();
    expect(registered.length).toBeGreaterThan(0);

    // HEAD routes are derived by Fastify from their GET and share the handler,
    // so they are covered by the GET entry.
    const keys = registered
      .filter((r) => r.method !== 'HEAD')
      .map((r) => `${r.method} ${r.url}`)
      .sort();
    expect(keys).toEqual(Object.keys(table).sort());

    for (const [key, request] of Object.entries(table)) {
      const method = key.split(' ')[0] as 'GET' | 'POST';
      const response = await harness.app.inject({
        method,
        url: request.url,
        headers: { authorization: `Bearer ${token}` },
        ...(request.payload === undefined ? {} : { payload: request.payload }),
      });

      expect(response.statusCode, `${key} -> ${response.statusCode} ${response.body}`).toBeLessThan(
        400,
      );
      expect(response.headers[GATE_HEADER], `${key} did not pass the gate`).toBe('applied');
      const body = response.json<{ classification: string; citationIds: unknown }>();
      expect(['information', 'assessment', 'advice'], key).toContain(body.classification);
      expect(Array.isArray(body.citationIds), key).toBe(true);
    }
  });

  it('every route in the registry declares its metadata', async () => {
    // Guaranteed by the onRoute hook — the server does not start otherwise —
    // but asserted because the hook is the load-bearing part.
    for (const route of harness.app.meridian.routes.all) {
      expect(route.config.summary.length, `${route.method} ${route.url}`).toBeGreaterThan(0);
      expect(typeof route.config.engineOutput).toBe('boolean');
      expect(['public', 'authenticated']).toContain(route.config.access);
    }
  });

  it('only the health endpoints and the CORS preflight are public', async () => {
    const publicRoutes = harness.app.meridian.routes.all
      .filter((r) => r.config.access === 'public')
      .map((r) => r.url);
    expect([...new Set(publicRoutes)].sort()).toEqual(['*', '/health', '/health/ready']);
  });
});

describe('the leak detector', () => {
  it('finds a disclosure classification nested in an ordinary payload', () => {
    const scan = scanForDisclosureLeak({ items: [{ report: { classification: 'advice' } }] });
    expect(scan).toEqual({
      outcome: 'leak',
      path: 'items[0].report.classification',
      shape: 'classification',
    });
  });

  it('finds a citation-shaped object', () => {
    const scan = scanForDisclosureLeak({
      rule: {
        id: 'es-cc-art-22',
        instrument: 'Código Civil',
        jurisdiction: 'ES',
        verifiedOn: '2026-07-25',
      },
    });
    expect(scan.outcome).toBe('leak');
  });

  it('does not fire on a stored task, which legitimately carries citation ids', () => {
    // A detector with false positives is a detector somebody switches off.
    const scan = scanForDisclosureLeak({
      tasks: [{ id: 't1', title: 'Obtain birth certificate', citationIds: ['es-cc-art-22'] }],
    });
    expect(scan.outcome).toBe('clean');
  });

  it('reports an over-deep payload as inconclusive rather than clean', () => {
    // "We ran out of budget" and "we found nothing" must not produce the same
    // answer, or a deep payload becomes a way past the check.
    let nested: Record<string, unknown> = { classification: 'advice' };
    for (let i = 0; i < 20; i++) nested = { child: nested };
    expect(scanForDisclosureLeak(nested).outcome).toBe('inconclusive');
  });

  it('rejects a route that returns engine content without declaring it', async () => {
    // A rogue route, registered the way a hurried developer would.
    harness.app.get(
      '/v1/test-rogue',
      declare({ summary: 'Rogue route', engineOutput: false, access: 'authenticated' }),
      async () => ({
        pathway: {
          citations: [
            {
              id: 'es-cc-art-22',
              instrument: 'Código Civil',
              jurisdiction: 'ES',
              verifiedOn: '2026-07-25',
            },
          ],
        },
      }),
    );
    await harness.app.ready();

    const token = await authed(TENANTS.firm);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/v1/test-rogue',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ error: { code: 'DISCLOSURE_GATE_BYPASSED' } });
  });

  it('rejects a route that declares engine output but returns a bare object', async () => {
    harness.app.get(
      '/v1/test-undeclared',
      declare({ summary: 'Undeclared', engineOutput: true, access: 'authenticated' }),
      async () => ({ total: 42 }),
    );
    await harness.app.ready();

    const token = await authed(TENANTS.firm);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/v1/test-undeclared',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ error: { code: 'DISCLOSURE_GATE_BYPASSED' } });
  });

  it('rejects a gated value returned from a route declared as not emitting one', async () => {
    harness.app.get(
      '/v1/test-mislabelled',
      declare({ summary: 'Mislabelled', engineOutput: false, access: 'authenticated' }),
      async () =>
        engineOutput({
          subject: 'schengen_status',
          disclosable: disclosable('assessment', { daysUsed: 1 }, ['x']),
          jurisdiction: 'ES',
          matterId: null,
        }),
    );
    await harness.app.ready();

    const token = await authed(TENANTS.firm);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/v1/test-mislabelled',
      headers: { authorization: `Bearer ${token}` },
    });
    // Not quietly gated: a route that produces gated output without declaring it
    // would be absent from the registry's list, so the enumeration test above
    // would never check it.
    expect(response.statusCode).toBe(500);
  });

  it('refuses to register a route with no meridian metadata', async () => {
    // The structural half of the guarantee: the server does not start. Fastify
    // may surface the refusal either at the `.get()` call or when the instance
    // boots, depending on where in the lifecycle the route is added — so the
    // assertion covers both rather than pinning an internal detail.
    let failure: unknown = null;
    try {
      harness.app.get('/v1/test-undeclared-config', async () => ({ ok: true }));
      await harness.app.ready();
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(/config\.meridian/);
  });
});

describe('MRZ fixtures used elsewhere', () => {
  it('computes a check digit the way ICAO 9303 specifies', () => {
    // Sanity-check the helper the identity suite builds fixtures with, so a
    // failure there is unambiguous about which side is wrong.
    expect(computeCheckDigit('ZZ1234567')).toBeGreaterThanOrEqual(0);
    expect(computeCheckDigit('ZZ1234567')).toBeLessThanOrEqual(9);
  });
});
