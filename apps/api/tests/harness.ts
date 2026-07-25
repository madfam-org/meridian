/**
 * The test harness.
 *
 * It builds the *real* application: the real auth chain verifying real RS256
 * signatures against a real (locally generated) key pair, the real disclosure
 * gate, the real audit writer, every real route. The only substitutions are the
 * ones that would otherwise require infrastructure — the in-memory repository
 * adapter and a static key set instead of a JWKS endpoint — and both are
 * complete implementations of their ports rather than stubs.
 *
 * That matters for what the suite is worth. A test that stubs the verifier
 * proves nothing about verification; a test that stubs the repository proves
 * nothing about tenant scoping. Here, an assertion that a cross-tenant read
 * returns 404 is an assertion about the code that will run in production.
 *
 * The clock is frozen at 2026-07-25 and ids are a counter, so every assertion
 * about a date or an audit row is reproducible.
 */

import { InMemoryRepositoryProvider } from '../src/repositories/memory.js';
import { buildApp } from '../src/app.js';
import { createStaticVerifier } from '../src/auth/verifier.js';
import { fixedClock } from '../src/clock.js';
import { loadConfig, type ApiConfig } from '../src/config.js';
import type { AppServices } from '../src/services.js';
import { defaultRegistry } from '@meridian/govtech';
import { isoDate, type CountryCode, type IsoDate } from '@meridian/core';
import { parsePathway, type Pathway } from '@meridian/pathways';
import type { FastifyInstance } from 'fastify';
import { SignJWT, exportJWK, generateKeyPair, type JSONWebKeySet, type KeyLike } from 'jose';

export const TODAY: IsoDate = isoDate('2026-07-25');
export const ISSUER = 'https://janua.test.invalid/realms/meridian';
export const AUDIENCE = 'meridian-api';
export const KEY_ID = 'test-key-1';

export const TEST_ENV: Readonly<Record<string, string>> = {
  DATABASE_URL: 'postgresql://meridian:not-a-real-password@localhost:5432/meridian_test',
  JANUA_JWKS_URL: 'https://janua.test.invalid/realms/meridian/protocol/openid-connect/certs',
  JANUA_ISSUER: ISSUER,
  JANUA_AUDIENCE: AUDIENCE,
  PORT: '8000',
  NODE_ENV: 'test',
  CORS_ALLOWED_ORIGINS: 'https://app.meridian.test,https://admin.meridian.test',
  LOG_LEVEL: 'silent',
  // High enough that the limiter never fires inside a suite; the limiter itself
  // is configuration, not behaviour under test.
  RATE_LIMIT_MAX: '100000',
};

export function testConfig(overrides: Readonly<Record<string, string>> = {}): ApiConfig {
  return loadConfig({ ...TEST_ENV, ...overrides });
}

/**
 * One key pair for the whole run.
 *
 * RSA generation is slow enough that doing it per test would dominate the suite,
 * and nothing under test depends on the key being distinct.
 */
let keyPairPromise: Promise<{ publicKey: KeyLike; privateKey: KeyLike; jwks: JSONWebKeySet }> | null =
  null;

export async function testKeys(): Promise<{
  publicKey: KeyLike;
  privateKey: KeyLike;
  jwks: JSONWebKeySet;
}> {
  if (keyPairPromise === null) {
    keyPairPromise = (async () => {
      const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
      const jwk = await exportJWK(publicKey);
      return {
        publicKey,
        privateKey,
        jwks: { keys: [{ ...jwk, kid: KEY_ID, alg: 'RS256', use: 'sig' }] },
      };
    })();
  }
  return keyPairPromise;
}

export interface TokenClaims {
  readonly tenantId?: string;
  readonly sub?: string;
  readonly roles?: readonly string[];
  readonly issuer?: string;
  readonly audience?: string;
  /** Seconds from now. Negative produces an already-expired token. */
  readonly expiresInSeconds?: number;
  readonly notBeforeSeconds?: number;
  /** Omit the tenant claim entirely, to exercise the malformed-claims path. */
  readonly omitTenant?: boolean;
}

export async function signToken(claims: TokenClaims = {}): Promise<string> {
  const { privateKey } = await testKeys();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    roles: [...(claims.roles ?? ['tenant_admin', 'caseworker'])],
  };
  if (claims.omitTenant !== true) payload['tenant_id'] = claims.tenantId ?? 'tenant-firm';

  let jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setSubject(claims.sub ?? 'user-1')
    .setIssuedAt(nowSeconds)
    .setIssuer(claims.issuer ?? ISSUER)
    .setAudience(claims.audience ?? AUDIENCE)
    .setExpirationTime(nowSeconds + (claims.expiresInSeconds ?? 300));

  if (claims.notBeforeSeconds !== undefined) {
    jwt = jwt.setNotBefore(nowSeconds + claims.notBeforeSeconds);
  }
  return jwt.sign(privateKey);
}

/** Base64url without padding, for hand-built tokens the signing library refuses to produce. */
function b64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

/**
 * An unsecured JWT: `alg: "none"`, no signature.
 *
 * `jose` will not produce one, which is the correct posture for a signing
 * library and exactly why the test has to build it by hand. This is the token a
 * verifier that reads the algorithm out of the token instead of out of its own
 * policy will happily accept.
 */
export function unsignedToken(payload: Record<string, unknown>): string {
  return `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}.`;
}

const C = (s: string): CountryCode => s as CountryCode;

/**
 * A counsel-reviewed pathway.
 *
 * The shipped catalog is entirely `unreviewed`, which is the honest live state
 * and therefore the wrong fixture for testing that a *reviewed* pathway can be
 * ranked. Built through `parsePathway` so the fixture is held to the same schema
 * the catalog is — including the rule that `counsel_reviewed` requires an
 * attributed reviewer.
 */
export const REVIEWED_PATHWAY: Pathway = parsePathway({
  id: 'es-test-reviewed',
  version: '1.0.0',
  jurisdiction: 'ES',
  name: { en: 'Test reviewed route', es: 'Ruta de prueba revisada' },
  summary: {
    en: 'A fixture route used to exercise the release gate. Not a real legal route.',
    es: 'Ruta ficticia para probar la barrera de divulgación. No es una vía legal real.',
  },
  kind: 'residence_permit',
  status: 'open',
  citations: [
    {
      id: 'test-fixture-citation',
      kind: 'secondary',
      instrument: 'Meridian test fixture — not a legal instrument',
      jurisdiction: 'ES',
      verifiedOn: '2026-07-25',
      discretionary: true,
      note: 'Fixture data. Carries no legal meaning and must never appear in a shipped catalog.',
    },
  ],
  criteria: [
    {
      id: 'test-claimed-nationality-present',
      label: { en: 'A nationality is claimed', es: 'Se declara una nacionalidad' },
      kind: 'nationality',
      citationIds: ['test-fixture-citation'],
      // Presence is knowable: an absent field means "no nationality claimed",
      // which is a definite false rather than an unknown.
      evaluator: { op: 'is_present', path: 'claimedNationality' },
      weight: 'blocking',
    },
    {
      id: 'test-temporary-intent',
      label: { en: 'The stay is asserted to be temporary', es: 'La estancia se declara temporal' },
      kind: 'intent',
      citationIds: ['test-fixture-citation'],
      // Absence here is genuinely unknown — nobody has been asked. It is
      // `material`, so it can hold back a yes but can never produce a no.
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      weight: 'material',
    },
  ],
  durations: { citationIds: ['test-fixture-citation'] },
  leadsTo: [],
  reviewStatus: 'counsel_reviewed',
  reviewedBy: 'fixture-reviewer',
  reviewedOn: '2026-07-25',
});

export const UNREVIEWED_PATHWAY: Pathway = parsePathway({
  ...REVIEWED_PATHWAY,
  id: 'es-test-unreviewed',
  reviewStatus: 'unreviewed',
  reviewedBy: undefined,
  reviewedOn: undefined,
});

export interface Harness {
  readonly app: FastifyInstance;
  readonly provider: InMemoryRepositoryProvider;
  readonly services: AppServices;
  readonly ids: () => number;
  close(): Promise<void>;
}

export interface HarnessOptions {
  readonly catalog?: readonly Pathway[];
  readonly today?: IsoDate;
  readonly env?: Readonly<Record<string, string>>;
}

/** Tenants every suite starts with. Seeded rather than created through the API. */
export const TENANTS = {
  firm: 'tenant-firm',
  individual: 'tenant-individual',
  individualRepresented: 'tenant-individual-represented',
  corporate: 'tenant-corporate',
  other: 'tenant-other-firm',
} as const;

export async function createHarness(options: HarnessOptions = {}): Promise<Harness> {
  const { jwks } = await testKeys();
  const provider = new InMemoryRepositoryProvider();
  const today = options.today ?? TODAY;

  let counter = 0;
  const services: AppServices = {
    config: testConfig(options.env),
    clock: fixedClock(today),
    repositories: provider,
    verifier: createStaticVerifier(jwks, {
      issuer: ISSUER,
      audience: AUDIENCE,
      keySource: 'test-static-jwks',
    }),
    govtech: defaultRegistry(),
    catalog: options.catalog ?? [REVIEWED_PATHWAY, UNREVIEWED_PATHWAY],
    newId: () => {
      counter += 1;
      return `id-${counter}`;
    },
  };

  await provider.tenants.create({
    id: TENANTS.firm,
    kind: 'firm',
    displayName: 'Test Firm',
    homeJurisdiction: 'ES',
  });
  await provider.tenants.create({
    id: TENANTS.other,
    kind: 'firm',
    displayName: 'Other Firm',
    homeJurisdiction: 'ES',
  });
  await provider.tenants.create({
    id: TENANTS.individual,
    kind: 'individual',
    displayName: 'Self-serving migrant',
    homeJurisdiction: 'MX',
  });
  await provider.tenants.create({
    id: TENANTS.individualRepresented,
    kind: 'individual',
    displayName: 'Migrant with counsel',
    homeJurisdiction: 'MX',
  });
  await provider.tenants.create({
    id: TENANTS.corporate,
    kind: 'corporate',
    displayName: 'Employer',
    homeJurisdiction: 'CA',
  });

  // A live Spanish abogado on the represented individual's tenant. Expiry is in
  // the future relative to the frozen clock, because an expired licence must not
  // gate release and a fixture that quietly expires would make the suite lie.
  await provider.forTenant(TENANTS.individualRepresented).representatives.add({
    id: 'rep-es-1',
    jurisdiction: 'ES',
    credential: 'spanish_abogado',
    licenceNumber: 'FIXTURE-0001',
    verifiedOn: isoDate('2026-07-01'),
    expiresOn: isoDate('2027-07-01'),
  });

  const app = await buildApp({ services, logger: false });

  return {
    app,
    provider,
    services,
    ids: () => counter,
    close: () => app.close(),
  };
}

/** Seed an applicant and a matter directly, so route tests can start from a case file. */
export async function seedMatter(
  harness: Harness,
  tenantId: string,
  overrides: {
    readonly targetJurisdiction?: string;
    readonly representativeId?: string | null;
    readonly pathwayId?: string;
  } = {},
): Promise<{ applicantId: string; matterId: string }> {
  const repos = harness.provider.forTenant(tenantId);
  const applicant = await repos.applicants.create({
    id: `applicant-${tenantId}`,
    nationalities: [C('MX'), C('ES')],
    claimedNationality: C('MX'),
  });
  const matter = await repos.matters.create({
    id: `matter-${tenantId}`,
    applicantId: applicant.id,
    pathwayId: overrides.pathwayId ?? 'es-test-reviewed',
    targetJurisdiction: C(overrides.targetJurisdiction ?? 'ES'),
    claimedNationality: C('MX'),
    status: 'active',
    phase: 'intake',
    openedOn: TODAY,
    representativeId: overrides.representativeId ?? null,
  });
  return { applicantId: applicant.id, matterId: matter.id };
}
