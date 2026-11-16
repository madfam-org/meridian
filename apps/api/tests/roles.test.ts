/**
 * Where roles come from.
 *
 * `platform_admin` is the boolean `is_admin` claim and nothing else. Every other
 * role is a Janua application-role grant, `meridian:<role>`. Bare strings in
 * `roles` are organization membership roles and confer no Meridian role.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveRoles } from '../src/auth/context.js';
import { TENANTS, createHarness, signToken, type Harness } from './harness.js';

describe('resolveRoles', () => {
  it('reads platform_admin from is_admin: true only', () => {
    expect(resolveRoles([], true).roles).toEqual(['platform_admin']);
    for (const value of [false, 'true', 1, null, undefined, {}]) {
      expect(resolveRoles([], value).roles).toEqual([]);
    }
  });

  it('never reads platform_admin from the roles claim', () => {
    const { roles, unrecognisedRoles } = resolveRoles(
      ['platform_admin', 'meridian:platform_admin', 'admin', 'meridian:admin'],
      undefined,
    );
    expect(roles).toEqual([]);
    expect(unrecognisedRoles).toEqual([
      'platform_admin',
      'meridian:platform_admin',
      'admin',
      'meridian:admin',
    ]);
  });

  it('reads product roles from meridian: grants', () => {
    const { roles, unrecognisedRoles } = resolveRoles(
      [
        'meridian:tenant_admin',
        'meridian:representative',
        'meridian:caseworker',
        'meridian:applicant',
        'meridian:caseworker',
      ],
      undefined,
    );
    expect(roles).toEqual(['tenant_admin', 'representative', 'caseworker', 'applicant']);
    expect(unrecognisedRoles).toEqual([]);
  });

  it('treats bare role names and other apps\' grants as unrecognised', () => {
    const { roles, unrecognisedRoles } = resolveRoles(
      ['tenant_admin', 'caseworker', 'representative', 'applicant', 'hcm:caseworker', 'owner'],
      undefined,
    );
    expect(roles).toEqual([]);
    expect(unrecognisedRoles).toEqual([
      'tenant_admin',
      'caseworker',
      'representative',
      'applicant',
      'hcm:caseworker',
      'owner',
    ]);
  });
});

describe('role sources at the routes', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.close();
  });

  const newTenant = {
    id: 'tenant-new',
    kind: 'firm',
    displayName: 'New Firm',
    homeJurisdiction: 'ES',
  };

  async function createTenant(token: string): Promise<number> {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: { authorization: `Bearer ${token}` },
      payload: newTenant,
    });
    return response.statusCode;
  }

  async function createApplicant(token: string): Promise<number> {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/applicants',
      headers: { authorization: `Bearer ${token}` },
      payload: { nationalities: ['MX'] },
    });
    return response.statusCode;
  }

  async function attachRepresentative(token: string): Promise<number> {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/tenants/me/representatives',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        jurisdiction: 'ES',
        credential: 'spanish_abogado',
        licenceNumber: 'TEST-0001',
        verifiedOn: '2026-01-01',
      },
    });
    return response.statusCode;
  }

  it('lets a platform administrator create a tenant', async () => {
    expect(await createTenant(await signToken({ tenantId: TENANTS.firm, roles: [], isAdmin: true }))).toBe(201);
  });

  it.each([
    [['platform_admin']],
    [['meridian:platform_admin']],
    [['admin']],
    [['meridian:tenant_admin', 'meridian:caseworker']],
  ])('refuses tenant creation for roles %j without is_admin', async (roles) => {
    expect(await createTenant(await signToken({ tenantId: TENANTS.firm, roles }))).toBe(403);
  });

  it.each(['true', 1, false])('refuses tenant creation when is_admin is %j', async (isAdmin) => {
    expect(
      await createTenant(await signToken({ tenantId: TENANTS.firm, roles: [], isAdmin })),
    ).toBe(403);
  });

  it.each([['meridian:caseworker'], ['meridian:representative'], ['meridian:tenant_admin']])(
    'lets the %s grant write case data',
    async (role) => {
      expect(await createApplicant(await signToken({ tenantId: TENANTS.firm, roles: [role] }))).toBe(201);
    },
  );

  it.each([['caseworker'], ['representative'], ['tenant_admin'], ['platform_admin'], ['admin']])(
    'refuses case writes for the bare role %s',
    async (role) => {
      expect(await createApplicant(await signToken({ tenantId: TENANTS.firm, roles: [role] }))).toBe(403);
    },
  );

  it('lets the meridian:tenant_admin grant administer its own tenant', async () => {
    expect(
      await attachRepresentative(
        await signToken({ tenantId: TENANTS.firm, roles: ['meridian:tenant_admin'] }),
      ),
    ).toBe(201);
  });

  it.each([['tenant_admin'], ['admin'], ['owner'], ['meridian:caseworker']])(
    'refuses tenant administration for %s',
    async (role) => {
      expect(
        await attachRepresentative(await signToken({ tenantId: TENANTS.firm, roles: [role] })),
      ).toBe(403);
    },
  );
});
