/**
 * Who is asking, as a typed value rather than a bag of claims.
 *
 * The `tenantId` on this object is the *only* source of tenancy in the whole
 * service. It comes from a verified token and is handed to the repository
 * factory; no route reads a tenant id from a path, a body, or a query string,
 * because a tenant id a client can type is a tenant id a client can change.
 */

/** Roles Meridian recognises. Anything else in the token is ignored, not trusted. */
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
