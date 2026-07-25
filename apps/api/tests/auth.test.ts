/**
 * Token verification.
 *
 * These are the attacks that have actually been used against JWT-protected
 * APIs, not hypotheticals: the unsecured token, the algorithm-confusion token
 * signed with the published public key as an HMAC secret, and the token minted
 * for a neighbouring service in the same realm.
 */

import { SignJWT } from 'jose';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AUDIENCE,
  ISSUER,
  KEY_ID,
  TENANTS,
  createHarness,
  signToken,
  testKeys,
  unsignedToken,
  type Harness,
} from './harness.js';

let harness: Harness;

beforeEach(async () => {
  harness = await createHarness();
});

afterEach(async () => {
  await harness.close();
});

const PROTECTED = '/v1/tenants/me';

async function get(token: string | null): Promise<{ status: number; body: unknown }> {
  const response = await harness.app.inject({
    method: 'GET',
    url: PROTECTED,
    headers: token === null ? {} : { authorization: `Bearer ${token}` },
  });
  return { status: response.statusCode, body: response.json() };
}

describe('authentication', () => {
  it('accepts a well-formed RS256 token and binds the request to its tenant', async () => {
    const { status, body } = await get(await signToken({ tenantId: TENANTS.firm }));
    expect(status).toBe(200);
    expect(body).toMatchObject({ id: TENANTS.firm, kind: 'firm' });
  });

  it('rejects a request with no Authorization header', async () => {
    const { status, body } = await get(null);
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });

  it('rejects alg:none — the unsecured JWT', async () => {
    // Hand-built, because `jose` will not produce one. This is the token a
    // verifier that reads the algorithm out of the token rather than out of its
    // own policy accepts: correct claims, no signature at all.
    const forged = unsignedToken({
      sub: 'attacker',
      tenant_id: TENANTS.firm,
      roles: ['platform_admin'],
      iss: ISSUER,
      aud: AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const { status, body } = await get(forged);
    expect(status).toBe(401);
    // The reason is in the response details for our own logs; what matters is
    // that the algorithm was refused before any verification was attempted.
    expect(body).toMatchObject({
      error: { code: 'UNAUTHENTICATED', details: { reason: 'unsupported_algorithm' } },
    });
  });

  it('rejects HS256 signed with the public key — algorithm confusion', async () => {
    // The public key is published at the JWKS endpoint by design. A verifier
    // that picks the algorithm from the token will happily treat that public
    // material as an HMAC secret and validate the result.
    const { jwks } = await testKeys();
    const publicMaterial = JSON.stringify(jwks.keys[0]);
    const forged = await new SignJWT({
      tenant_id: TENANTS.firm,
      roles: ['platform_admin'],
    })
      .setProtectedHeader({ alg: 'HS256', kid: KEY_ID })
      .setSubject('attacker')
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(publicMaterial));

    const { status, body } = await get(forged);
    expect(status).toBe(401);
    expect(body).toMatchObject({
      error: { code: 'UNAUTHENTICATED', details: { reason: 'unsupported_algorithm' } },
    });
  });

  it('rejects an expired token', async () => {
    const { status, body } = await get(
      await signToken({ tenantId: TENANTS.firm, expiresInSeconds: -60 }),
    );
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { details: { reason: 'expired' } } });
  });

  it('rejects a token that is not yet valid', async () => {
    const { status, body } = await get(
      await signToken({ tenantId: TENANTS.firm, notBeforeSeconds: 600 }),
    );
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { details: { reason: 'not_yet_valid' } } });
  });

  it('rejects a token minted for another audience in the same realm', async () => {
    // Same issuer, same signing key, different service. Without an audience
    // check this authenticates here and arrives carrying a tenant id we trust.
    const { status, body } = await get(
      await signToken({ tenantId: TENANTS.firm, audience: 'dhanam-api' }),
    );
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { details: { reason: 'wrong_audience' } } });
  });

  it('rejects a token from another issuer', async () => {
    const { status, body } = await get(
      await signToken({ tenantId: TENANTS.firm, issuer: 'https://not-janua.invalid/' }),
    );
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { details: { reason: 'wrong_issuer' } } });
  });

  it('rejects a token carrying no tenant claim', async () => {
    const { status, body } = await get(await signToken({ omitTenant: true }));
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { details: { reason: 'malformed_claims' } } });
  });

  it('rejects a token naming a tenant this deployment does not have', async () => {
    const { status, body } = await get(await signToken({ tenantId: 'tenant-does-not-exist' }));
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { details: { reason: 'unknown_tenant' } } });
  });

  it('rejects a syntactically broken token without leaking which part broke', async () => {
    const { status, body } = await get('not.a.jwt');
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });

  it('keeps unrecognised roles out of the role set but records them', async () => {
    const token = await signToken({
      tenantId: TENANTS.firm,
      roles: ['caseworker', 'wizard', 'tenant_admin'],
    });
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/applicants',
      headers: { authorization: `Bearer ${token}` },
      payload: { nationalities: ['MX'] },
    });
    expect(response.statusCode).toBe(201);

    const trail = await harness.app.inject({
      method: 'GET',
      url: '/v1/audit?action=applicant.created',
      headers: { authorization: `Bearer ${token}` },
    });
    const events = trail.json<{ events: { actorRoles: string[] }[] }>().events;
    expect(events).toHaveLength(1);
    // The unrecognised role is in the trail — an identity provider emitting
    // roles this build has never heard of is worth seeing — but it grants
    // nothing, because authorisation only ever consults the known set.
    expect(events[0]?.actorRoles).toContain('wizard');
    expect(events[0]?.actorRoles).toContain('caseworker');
  });

  it('refuses an operation the caller has no role for, and records the refusal', async () => {
    const token = await signToken({ tenantId: TENANTS.firm, roles: ['applicant'] });
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/applicants',
      headers: { authorization: `Bearer ${token}` },
      payload: { nationalities: ['MX'] },
    });
    expect(response.statusCode).toBe(403);

    const events = await harness.provider.forTenant(TENANTS.firm).audit.list({
      limit: 50,
      offset: 0,
      action: 'access.refused',
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.outcome).toBe('refused');
  });

  it('does not require a token to be told a route does not exist', async () => {
    // A 404 behind authentication means every uptime check needs a credential.
    const response = await harness.app.inject({ method: 'GET', url: '/v1/nope' });
    expect(response.statusCode).toBe(404);
  });

  it('accepts the tenantId claim spelling as well as tenant_id', async () => {
    const { privateKey } = await testKeys();
    const token = await new SignJWT({ tenantId: TENANTS.firm, roles: ['caseworker'] })
      .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
      .setSubject('user-alias')
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime('5m')
      .sign(privateKey);

    const { status } = await get(token);
    expect(status).toBe(200);
  });
});

describe('CORS', () => {
  it('reflects an allowlisted origin and refuses one that is not', async () => {
    const allowed = await harness.app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://app.meridian.test' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('https://app.meridian.test');

    const refused = await harness.app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://evil.example' },
    });
    expect(refused.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers a preflight without requiring a token', async () => {
    // Browsers do not send Authorization on a preflight. Requiring one here
    // breaks CORS for every client while looking like a security measure.
    const response = await harness.app.inject({
      method: 'OPTIONS',
      url: '/v1/matters',
      headers: {
        origin: 'https://app.meridian.test',
        'access-control-request-method': 'POST',
      },
    });
    expect(response.statusCode).toBeLessThan(400);
    expect(response.headers['access-control-allow-origin']).toBe('https://app.meridian.test');
  });
});
