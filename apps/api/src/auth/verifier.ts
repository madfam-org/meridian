/**
 * Janua token verification.
 *
 * Three things here are load-bearing, and all three are attacks that have
 * actually been used against JWT-protected APIs rather than theoretical ones.
 *
 * **RS256 only, checked twice.** The algorithm is read out of the protected
 * header and compared against the permitted set *before* verification, and the
 * permitted set is passed to `jwtVerify` as well. The pre-check exists so the
 * refusal is explicit and testable; the option exists so a future refactor that
 * loses the pre-check does not silently open the door. What it closes:
 *
 *   - `alg: "none"` — the unsecured JWT. A token with no signature at all,
 *     which a naive verifier that "checks the signature if present" accepts.
 *   - `alg: "HS256"` — algorithm confusion. The attacker takes our *public*
 *     RSA key, which is published at the JWKS endpoint by design, and uses it
 *     as an HMAC secret. A verifier that picks the algorithm from the token
 *     rather than from its own policy validates it.
 *
 * **Issuer and audience are both required.** Issuer alone is not enough: inside
 * one Janua realm every service's tokens share an issuer, so a token minted for
 * a different Meridian service would authenticate here and arrive carrying a
 * tenant id we would then trust. That is the confused deputy, and `aud` is what
 * stops it.
 *
 * **Failures are opaque to the client and specific in the log.** The response
 * says the token was not accepted. The `reason` field on the failure — carried
 * in the error's details for our own logs and audit trail — says which check
 * failed. Telling an unauthenticated caller *why* their token was rejected
 * turns the endpoint into an oracle for forging a better one.
 */

import { err, ok, type Result } from '@meridian/core';
import {
  createLocalJWKSet,
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JSONWebKeySet,
  type JWTVerifyGetKey,
} from 'jose';
import { z } from 'zod';

import { unauthenticated, type ApiError } from '../http/errors.js';
import { isRole, type AuthContext, type Role } from './context.js';

/**
 * The only signature algorithm Meridian accepts.
 *
 * A single-element list rather than a configurable one: every extra algorithm is
 * an extra way to be wrong, and an operator who can widen this in an environment
 * variable will eventually widen it at 02:00 to make an integration work.
 */
export const PERMITTED_ALGORITHMS: readonly string[] = ['RS256'];

/** Why a token was refused. Logged and audited; never returned to the caller. */
export type AuthFailureReason =
  | 'missing_token'
  | 'malformed_token'
  | 'unsupported_algorithm'
  | 'signature_invalid'
  | 'expired'
  | 'not_yet_valid'
  | 'wrong_issuer'
  | 'wrong_audience'
  | 'malformed_claims'
  | 'key_source_unavailable';

export interface TokenVerifier {
  /** Human-readable description of the key source, for the readiness report. Never a secret. */
  readonly keySource: string;
  verify(token: string): Promise<Result<AuthContext, ApiError>>;
  /**
   * Confirm the key source can actually be reached and parsed.
   *
   * Readiness calls this. A service that reports ready while its JWKS endpoint
   * is unreachable will 401 every request the moment its key cache expires, and
   * the load balancer will keep sending it traffic because it said it was fine.
   */
  checkKeySource(): Promise<Result<void, Error>>;
}

export interface VerifierOptions {
  readonly issuer: string;
  readonly audience: string;
  /** Seconds of leeway on `exp`/`nbf`. Zero by default — clock skew is an ops problem, not a policy. */
  readonly clockToleranceSeconds?: number;
}

/**
 * Claims Meridian requires.
 *
 * `tenant_id` is the snake_case form Janua issues; `tenantId` is accepted as an
 * alias so a differently-configured issuer does not silently authenticate a user
 * into no tenant at all. Exactly one of them must be present and non-empty.
 */
const claimsSchema = z
  .object({
    sub: z.string().min(1),
    tenant_id: z.string().min(1).optional(),
    tenantId: z.string().min(1).optional(),
    roles: z.union([z.array(z.string()), z.string()]).optional(),
    jti: z.string().min(1).optional(),
  })
  .refine((c) => c.tenant_id !== undefined || c.tenantId !== undefined, {
    message: 'token carries no tenant_id claim',
  });

/** `roles` may arrive as an array or as a space-delimited string, depending on the mapper. */
function splitRoles(raw: readonly string[] | string | undefined): string[] {
  if (raw === undefined) return [];
  if (typeof raw === 'string') return raw.split(/\s+/).filter((s) => s.length > 0);
  return [...raw];
}

function refuse(reason: AuthFailureReason): ApiError {
  return unauthenticated('The presented token was not accepted.', { reason });
}

/**
 * Build a verifier over any key source.
 *
 * The key source is injected rather than constructed here so tests exercise the
 * *real* verification path — same algorithm policy, same issuer and audience
 * checks, same claim parsing — against a locally generated key pair. A test that
 * stubs out verification proves nothing about verification.
 */
export function createVerifier(
  getKey: JWTVerifyGetKey,
  options: VerifierOptions,
  keySource: string,
  probe: () => Promise<Result<void, Error>>,
): TokenVerifier {
  const clockTolerance = options.clockToleranceSeconds ?? 0;

  return {
    keySource,

    async verify(token: string): Promise<Result<AuthContext, ApiError>> {
      if (token.trim().length === 0) return err(refuse('missing_token'));

      // Read the algorithm before doing anything else. `decodeProtectedHeader`
      // performs no cryptography and trusts nothing — it base64-decodes the
      // header so we can refuse on our own policy rather than the token's.
      let alg: string | undefined;
      try {
        alg = decodeProtectedHeader(token).alg;
      } catch {
        return err(refuse('malformed_token'));
      }
      if (alg === undefined || !PERMITTED_ALGORITHMS.includes(alg)) {
        return err(refuse('unsupported_algorithm'));
      }

      let payload: Record<string, unknown>;
      try {
        const verified = await jwtVerify(token, getKey, {
          issuer: options.issuer,
          audience: options.audience,
          algorithms: [...PERMITTED_ALGORITHMS],
          clockTolerance,
        });
        payload = verified.payload as Record<string, unknown>;
      } catch (error) {
        return err(refuse(classifyJoseError(error)));
      }

      const claims = claimsSchema.safeParse(payload);
      if (!claims.success) return err(refuse('malformed_claims'));

      const raw = splitRoles(claims.data.roles);
      const roles: Role[] = [];
      const unrecognisedRoles: string[] = [];
      for (const r of raw) {
        if (isRole(r)) {
          if (!roles.includes(r)) roles.push(r);
        } else if (!unrecognisedRoles.includes(r)) {
          unrecognisedRoles.push(r);
        }
      }

      const tenantId = claims.data.tenant_id ?? claims.data.tenantId;
      if (tenantId === undefined) return err(refuse('malformed_claims'));

      const context: AuthContext = {
        tenantId,
        userId: claims.data.sub,
        roles,
        unrecognisedRoles,
        ...(claims.data.jti === undefined ? {} : { tokenId: claims.data.jti }),
      };
      return ok(context);
    },

    checkKeySource: probe,
  };
}

/**
 * jose signals failure by error code. Map it to our own vocabulary so the audit
 * trail distinguishes an expired token — normal, happens all day — from a bad
 * signature, which is somebody trying something.
 */
function classifyJoseError(error: unknown): AuthFailureReason {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
    case 'ERR_JWT_EXPIRED':
      return 'expired';
    case 'ERR_JWT_CLAIM_VALIDATION_FAILED': {
      const claim =
        typeof error === 'object' && error !== null && 'claim' in error
          ? String((error as { claim: unknown }).claim)
          : '';
      if (claim === 'iss') return 'wrong_issuer';
      if (claim === 'aud') return 'wrong_audience';
      if (claim === 'nbf') return 'not_yet_valid';
      return 'malformed_claims';
    }
    case 'ERR_JWKS_NO_MATCHING_KEY':
    case 'ERR_JWKS_TIMEOUT':
    case 'ERR_JWKS_MULTIPLE_MATCHING_KEYS':
      return 'key_source_unavailable';
    case 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED':
    case 'ERR_JWS_INVALID':
    case 'ERR_JWT_INVALID':
      return 'signature_invalid';
    default:
      return 'signature_invalid';
  }
}

/** The production verifier: keys fetched from Janua's JWKS endpoint. */
export function createJanuaVerifier(config: {
  readonly jwksUrl: string;
  readonly issuer: string;
  readonly audience: string;
}): TokenVerifier {
  const url = new URL(config.jwksUrl);
  const jwks = createRemoteJWKSet(url);
  return createVerifier(
    jwks,
    { issuer: config.issuer, audience: config.audience },
    // Origin and path only. A JWKS URL is not secret, but nothing is served by
    // putting a full URL with any query string into a health response.
    `${url.origin}${url.pathname}`,
    async () => {
      try {
        // Forces a fetch rather than reporting on a cached key set, which is the
        // whole point: a cached key set says nothing about whether Janua is up.
        await jwks.reload();
        return ok(undefined);
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },
  );
}

/**
 * A verifier over an in-memory key set.
 *
 * Used by the test suite, and legitimate for an air-gapped deployment that
 * distributes the key set out of band. It runs the identical code path — the
 * only difference is where the public key came from.
 */
export function createStaticVerifier(
  jwks: JSONWebKeySet,
  options: VerifierOptions & { readonly keySource?: string },
): TokenVerifier {
  const getKey = createLocalJWKSet(jwks);
  return createVerifier(getKey, options, options.keySource ?? 'static-jwks', async () =>
    jwks.keys.length > 0
      ? ok(undefined)
      : err(new Error('static key set is empty; no token can be verified')),
  );
}
