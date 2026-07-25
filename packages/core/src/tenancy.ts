/**
 * Tenancy and the representation model.
 *
 * Meridian runs one engine under three commercial shapes, which is the whole
 * point of the hybrid posture: the same rules engine serves a law firm's
 * caseload, an individual managing their own move, and (once licensing exists)
 * MADFAM acting as the representative itself. What differs between them is not
 * the arithmetic — it is who is accountable for the recommendation, and
 * therefore what {@link import('./disclosure.js').canRelease} will let through.
 */

import type { AuthorizedRepresentative } from './disclosure.js';

export type TenantKind =
  /** A law firm, consultancy, or gestoría. Its own licensed staff are the representatives. */
  | 'firm'
  /** A single migrant self-serving. No representative unless they attach their own. */
  | 'individual'
  /** An employer moving its own staff. Still an unlicensed audience for advice purposes. */
  | 'corporate'
  /**
   * MADFAM operating as the regulated representative. Gated on real licensing —
   * a tenant of this kind must carry at least one verified representative or the
   * engine treats it as `individual`.
   */
  | 'madfam_represented';

export interface Tenant {
  readonly id: string;
  readonly kind: TenantKind;
  readonly displayName: string;
  /** ISO 3166-1 alpha-2 of the tenant's own seat, for data-residency routing. */
  readonly homeJurisdiction: string;
  /** Representatives this tenant can attach to matters. */
  readonly representatives: readonly AuthorizedRepresentative[];
}

/**
 * Whether a tenant may attach a representative authorised in `jurisdiction`.
 *
 * A `madfam_represented` tenant with no live credential is not a licensed
 * tenant — it is an aspiration, and the engine refuses to treat it as one.
 */
export function representativeFor(
  tenant: Tenant,
  jurisdiction: string,
  asOf: string,
): AuthorizedRepresentative | null {
  const target = jurisdiction.toUpperCase();
  return (
    tenant.representatives.find(
      (r) => r.jurisdiction.toUpperCase() === target && (!r.expiresOn || r.expiresOn >= asOf),
    ) ?? null
  );
}

/** The audience a tenant kind maps to when releasing engine output. */
export function audienceFor(kind: TenantKind): 'applicant' | 'practitioner' | 'corporate_sponsor' {
  switch (kind) {
    case 'firm':
      return 'practitioner';
    case 'corporate':
      return 'corporate_sponsor';
    case 'individual':
    case 'madfam_represented':
      return 'applicant';
  }
}
