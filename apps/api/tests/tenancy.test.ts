/**
 * Tenant isolation.
 *
 * The defence is structural: no repository method accepts a tenant id, so a
 * handler cannot construct a query that reads across tenants. These tests prove
 * the structure holds at the HTTP boundary, where an attacker actually stands —
 * with a valid token for one tenant and a well-formed id belonging to another.
 *
 * Every cross-tenant read must be indistinguishable from a read of something
 * that does not exist. A 403 confirms the row exists, which turns the id space
 * into an oracle for enumerating another firm's caseload.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TENANTS, createHarness, seedMatter, signToken, type Harness } from './harness.js';

let harness: Harness;

beforeEach(async () => {
  harness = await createHarness();
});

afterEach(async () => {
  await harness.close();
});

async function token(tenantId: string, roles: readonly string[] = ['tenant_admin', 'caseworker']) {
  return signToken({ tenantId, roles });
}

describe('cross-tenant access', () => {
  it('cannot read another tenant\'s matter, and cannot tell it apart from a missing one', async () => {
    const owned = await seedMatter(harness, TENANTS.firm);
    const attacker = await token(TENANTS.other);

    const stolen = await harness.app.inject({
      method: 'GET',
      url: `/v1/matters/${owned.matterId}`,
      headers: { authorization: `Bearer ${attacker}` },
    });
    const imaginary = await harness.app.inject({
      method: 'GET',
      url: '/v1/matters/matter-that-never-existed',
      headers: { authorization: `Bearer ${attacker}` },
    });

    expect(stolen.statusCode).toBe(404);
    expect(imaginary.statusCode).toBe(404);
    // Byte-identical but for the id: nothing in the response distinguishes
    // "belongs to someone else" from "does not exist".
    expect(stolen.json()).toMatchObject({ error: { code: 'NOT_FOUND', details: { resource: 'matter' } } });
    expect(imaginary.json()).toMatchObject({
      error: { code: 'NOT_FOUND', details: { resource: 'matter' } },
    });
  });

  it('cannot read another tenant\'s applicant', async () => {
    const owned = await seedMatter(harness, TENANTS.firm);
    const attacker = await token(TENANTS.other);
    const response = await harness.app.inject({
      method: 'GET',
      url: `/v1/applicants/${owned.applicantId}`,
      headers: { authorization: `Bearer ${attacker}` },
    });
    expect(response.statusCode).toBe(404);
  });

  it('cannot write to another tenant\'s matter', async () => {
    const owned = await seedMatter(harness, TENANTS.firm);
    const attacker = await token(TENANTS.other);
    const response = await harness.app.inject({
      method: 'PATCH',
      url: `/v1/matters/${owned.matterId}`,
      headers: { authorization: `Bearer ${attacker}` },
      payload: { status: 'withdrawn' },
    });
    expect(response.statusCode).toBe(404);

    // And the row is untouched: the update carried the tenant predicate, so it
    // matched nothing rather than matching and being rejected afterwards.
    const stored = await harness.provider.forTenant(TENANTS.firm).matters.get(owned.matterId);
    expect(stored?.status).toBe('active');
  });

  it('cannot reach another tenant\'s presence ledger through a matter id', async () => {
    const owned = await seedMatter(harness, TENANTS.firm);
    await harness.provider.forTenant(TENANTS.firm).stays.createMany([
      {
        id: 'stay-1',
        matterId: owned.matterId,
        country: 'ES' as never,
        start: '2026-01-01' as never,
        end: '2026-01-31' as never,
        source: 'border_stamp',
        confidence: 'confirmed',
        exemptFromSchengenShortStay: false,
      },
    ]);

    const attacker = await token(TENANTS.other);
    const response = await harness.app.inject({
      method: 'GET',
      url: `/v1/matters/${owned.matterId}/presence/schengen`,
      headers: { authorization: `Bearer ${attacker}` },
    });
    expect(response.statusCode).toBe(404);
  });

  it('cannot read another tenant\'s audit trail', async () => {
    const owned = await seedMatter(harness, TENANTS.firm);
    const firmToken = await token(TENANTS.firm);
    await harness.app.inject({
      method: 'PATCH',
      url: `/v1/matters/${owned.matterId}`,
      headers: { authorization: `Bearer ${firmToken}` },
      payload: { status: 'submitted' },
    });

    const attacker = await token(TENANTS.other);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: { authorization: `Bearer ${attacker}` },
    });
    expect(response.statusCode).toBe(200);
    // Not "filtered to nothing by luck": the repository is bound to the
    // attacker's tenant, so the other tenant's rows are not in the result set at
    // all.
    expect(response.json<{ events: unknown[] }>().events).toEqual([]);
  });

  it('cannot attach another tenant\'s representative to its own matter', async () => {
    // `rep-es-1` belongs to the represented-individual tenant. Attaching it here
    // would let a firm borrow somebody else's licence to release advice.
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const firmToken = await token(TENANTS.firm);
    const response = await harness.app.inject({
      method: 'PATCH',
      url: `/v1/matters/${matterId}`,
      headers: { authorization: `Bearer ${firmToken}` },
      payload: { representativeId: 'rep-es-1' },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { details: { resource: 'representative' } } });
  });

  it('stamps writes with the token\'s tenant, not one supplied in the body', async () => {
    const firmToken = await token(TENANTS.firm);
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/applicants',
      headers: { authorization: `Bearer ${firmToken}` },
      // A hopeful extra field. The schema is not strict here, but the tenant is
      // never read from a body in the first place — there is no code path that
      // could.
      payload: { nationalities: ['MX'], tenantId: TENANTS.other },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json<{ tenantId: string }>().tenantId).toBe(TENANTS.firm);

    const otherTenant = await harness.provider.forTenant(TENANTS.other).applicants.list({
      limit: 10,
      offset: 0,
    });
    expect(otherTenant).toEqual([]);
  });

  it('binds the repository to the token tenant even when both tenants hold the same id', async () => {
    // Same primary key in two tenants is the case a forgotten `where` clause
    // silently crosses. The in-memory store keys by id globally, exactly as a
    // careless schema would, so the tenant predicate is the only thing
    // separating them.
    const firmRepos = harness.provider.forTenant(TENANTS.firm);
    const otherRepos = harness.provider.forTenant(TENANTS.other);
    await firmRepos.applicants.create({ id: 'shared-id', nationalities: ['MX' as never] });

    expect(await otherRepos.applicants.get('shared-id')).toBeNull();
    expect(await firmRepos.applicants.get('shared-id')).not.toBeNull();
    expect(await otherRepos.applicants.update('shared-id', { reference: 'hijacked' })).toBeNull();
    expect((await firmRepos.applicants.get('shared-id'))?.reference).toBeUndefined();
  });
});
