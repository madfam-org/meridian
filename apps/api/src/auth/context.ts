/**
 * Who is asking, as a typed value rather than a bag of claims.
 *
 * The `tenantId` on this object is the *only* source of tenancy in the whole
 * service. It comes from a verified token and is handed to the repository
 * factory; no route reads a tenant id from a path, a body, or a query string,
 * because a tenant id a client can type is a tenant id a client can change.
 */

/**
 * Roles Meridian recognises. Anything else in the token is ignored, not trusted.
 * How each one is read from a token: see `resolveRoles`.
 */
export const ROLES = [
  /** MADFAM platform operations. Can create tenants; still cannot read a tenant's matters. */
  'platform_admin',
  /** Administers one tenant: representatives, membership. */
  'tenant_admin',
  /** A licensed professional inside a firm tenant. */
  'representative',
  /** Unlicensed staff working a caseload under a representative. */
  'caseworker',
  /** The migrant themselves, on their own matter. */
  'applicant',
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/**
 * Where each role comes from in a Janua token.
 *
 * Janua's `roles` claim mixes two things. Bare strings (`owner`, `admin`,
 * `member`, or any name an organization gives its own custom roles) are the
 * caller's ORGANIZATION membership roles. Strings shaped `<app>:<role>` are
 * application roles, published only from an explicit per-app grant. So a bare
 * string proves nothing about Meridian, and Meridian reads none:
 *
 *   - `platform_admin` is the boolean `is_admin` claim, exactly `true`, which
 *     Janua sets for platform administrators only. It is never read from
 *     `roles`, in any spelling.
 *   - every other role is the application role `meridian:<role>`
 *     (`meridian:tenant_admin`, `meridian:representative`,
 *     `meridian:caseworker`, `meridian:applicant`), granted per organization
 *     member in Janua.
 */
export const APP_ROLE_PREFIX = 'meridian:';

/** Roles a Janua application-role grant may confer. `platform_admin` is not one of them. */
export const GRANTED_ROLES: readonly Role[] = [
  'tenant_admin',
  'representative',
  'caseworker',
  'applicant',
];

export interface ResolvedRoles {
  readonly roles: Role[];
  readonly unrecognisedRoles: string[];
}

/**
 * The roles a verified token confers, and the role strings it carried that confer nothing.
 *
 * @param rawRoles the token's `roles` claim, already split into strings.
 * @param isAdminClaim the token's `is_admin` claim, unparsed. Only the boolean
 *   `true` counts.
 */
export function resolveRoles(rawRoles: readonly string[], isAdminClaim: unknown): ResolvedRoles {
  const roles: Role[] = [];
  const unrecognisedRoles: string[] = [];
  if (isAdminClaim === true) roles.push('platform_admin');

  for (const raw of rawRoles) {
    const name = raw.startsWith(APP_ROLE_PREFIX) ? raw.slice(APP_ROLE_PREFIX.length) : null;
    const role = name !== null && (GRANTED_ROLES as readonly string[]).includes(name)
      ? (name as Role)
      : null;
    if (role !== null) {
      if (!roles.includes(role)) roles.push(role);
    } else if (!unrecognisedRoles.includes(raw)) {
      unrecognisedRoles.push(raw);
    }
  }
  return { roles, unrecognisedRoles };
}

/** Roles permitted to change case data. Reads are open to any authenticated member of the tenant. */
export const WRITE_ROLES: readonly Role[] = [
  'platform_admin',
  'tenant_admin',
  'representative',
  'caseworker',
];

/** Roles permitted to administer the tenant itself. */
export const TENANT_ADMIN_ROLES: readonly Role[] = ['platform_admin', 'tenant_admin'];

export interface AuthContext {
  /** From the verified token. Never from the request path. */
  readonly tenantId: string;
  /** Subject claim. An opaque id — never an email, and never logged. */
  readonly userId: string;
  readonly roles: readonly Role[];
  /**
   * Role strings the token carried that Meridian does not recognise.
   *
   * Kept for the audit trail rather than discarded: a token full of roles this
   * service has never heard of is worth seeing in the trail, and silently
   * dropping them makes an identity-provider misconfiguration invisible.
   */
  readonly unrecognisedRoles: readonly string[];
  /** `jti`, when the issuer sets one. Lets a specific token be traced through the audit trail. */
  readonly tokenId?: string;
}

export function hasAnyRole(auth: AuthContext, required: readonly Role[]): boolean {
  return required.some((r) => auth.roles.includes(r));
}
