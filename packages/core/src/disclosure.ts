/**
 * The advice boundary.
 *
 * This is the single most load-bearing type in Meridian, and it exists because
 * of a hard legal constraint rather than a design preference.
 *
 * Under s.91 of Canada's Immigration and Refugee Protection Act, representing
 * or advising a person **for consideration** in connection with a proceeding or
 * application is an offence unless the adviser is a lawyer or paralegal in good
 * standing of a provincial or territorial law society, a Quebec notary, or a
 * licensee of the College of Immigration and Citizenship Consultants. Spain has
 * its own reserved-activity rules for *asesoramiento jurídico*. A platform that
 * emits "you should apply under art. 22" to a paying consumer, with no
 * authorised representative attached, is not shipping a feature — it is
 * committing an offence on behalf of its operator.
 *
 * So Meridian never decides at render time whether something "counts as
 * advice". Every output the engine produces is *born* classified, and
 * {@link canRelease} is the one gate that decides whether that classification
 * may reach a given audience. Downgrading is possible; upgrading is not.
 */

/**
 * What kind of statement an output is, in ascending order of regulatory weight.
 *
 * - `information` — a neutral statement of what a published rule says, with a
 *   citation, not applied to the user's facts. "Art. 22 sets a two-year
 *   residency period for Ibero-American nationals."
 * - `assessment`  — the user's own facts measured against a published rule,
 *   with the arithmetic shown. "You have recorded 610 days of residence; the
 *   rule states 730." Factual, reproducible, no recommendation.
 * - `advice`      — a recommendation, a strategy, a prediction of outcome, or
 *   any statement that a particular course of action is the right one. This is
 *   the regulated act.
 */
export type DisclosureClass = 'information' | 'assessment' | 'advice';

const RANK: Record<DisclosureClass, number> = {
  information: 0,
  assessment: 1,
  advice: 2,
};

export function compareDisclosure(a: DisclosureClass, b: DisclosureClass): number {
  return RANK[a] - RANK[b];
}

/** The higher-weight of two classifications. Combining outputs never de-escalates. */
export function maxDisclosure(a: DisclosureClass, b: DisclosureClass): DisclosureClass {
  return RANK[a] >= RANK[b] ? a : b;
}

export function maxDisclosureOf(classes: readonly DisclosureClass[]): DisclosureClass {
  return classes.reduce<DisclosureClass>((acc, c) => maxDisclosure(acc, c), 'information');
}

/**
 * The professional standing that authorises regulated advice in a jurisdiction.
 * `null` in {@link ReleaseContext.representative} means nobody is on the hook,
 * which is exactly the case the gate exists to catch.
 */
export interface AuthorizedRepresentative {
  readonly id: string;
  /** Jurisdiction whose regulator issued the standing. ISO 3166-1 alpha-2. */
  readonly jurisdiction: string;
  readonly credential: RepresentativeCredential;
  /** Regulator-issued licence or roll number, as it appears in the public register. */
  readonly licenceNumber: string;
  /** Last date the licence was confirmed against the regulator's public register. */
  readonly verifiedOn: string;
  /** Set when the licence has a known expiry; a lapsed licence must not gate release. */
  readonly expiresOn?: string;
}

export type RepresentativeCredential =
  /** CICC-licensed Regulated Canadian Immigration Consultant. */
  | 'rcic'
  /** Lawyer in good standing of a Canadian provincial or territorial law society. */
  | 'canadian_lawyer'
  /**
   * Paralegal in good standing of a provincial or territorial law society.
   * Authorised under s.91 in their own right — omitting them would wrongly
   * downgrade advice that a licensed professional is in fact accountable for.
   */
  | 'canadian_paralegal'
  /** Member of the Chambre des notaires du Québec. */
  | 'quebec_notary'
  /** Abogado colegiado — member of a Spanish bar association. */
  | 'spanish_abogado'
  /** Gestor administrativo colegiado. */
  | 'spanish_gestor'
  /** Any other regulator-recognised standing; `licenceNumber` must identify the register. */
  | 'other_regulated';

/** Who is going to read the output. */
export type Audience =
  /** The migrant themselves. */
  | 'applicant'
  /** A licensed professional operating inside a firm tenant. */
  | 'practitioner'
  /** An employer or mobility manager acting for an employee. */
  | 'corporate_sponsor'
  /** Meridian staff performing platform operations. */
  | 'platform_operator';

export interface ReleaseContext {
  readonly audience: Audience;
  /** Jurisdiction the output concerns. ISO 3166-1 alpha-2. */
  readonly jurisdiction: string;
  /** The professional accountable for advice reaching this audience, if any. */
  readonly representative: AuthorizedRepresentative | null;
  /** Whether the reader is paying — s.91 turns on consideration. */
  readonly forConsideration: boolean;
  /** Today, for licence-expiry checks. `YYYY-MM-DD`. */
  readonly asOf: string;
}

export type ReleaseDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string; readonly downgradeTo: DisclosureClass };

/**
 * The gate. Returns whether `classification` may be shown in `context`, and if
 * not, what it must be downgraded to.
 *
 * The rules, in order:
 *
 * 1. `information` and `assessment` are always releasable. Stating what a
 *    published rule says, and doing arithmetic against the user's own record,
 *    are not reserved acts anywhere Meridian operates.
 * 2. `advice` to a `practitioner` or `platform_operator` is released — these
 *    audiences are the professionals, not the protected party. The engine is a
 *    tool in their hands and they own the judgement.
 * 3. `advice` to an `applicant` or `corporate_sponsor` requires a live,
 *    unexpired representative authorised in that jurisdiction. Absent one, the
 *    output is downgraded to `assessment` — the user still sees their numbers
 *    and the rule text, just not a recommendation.
 *
 * Note that a *free* consumer product is not a loophole. s.91 turns on
 * consideration, but the downgrade applies regardless: an unlicensed
 * recommendation that is merely lawful is still a recommendation nobody is
 * accountable for, and Meridian does not ship those.
 */
export function canRelease(
  classification: DisclosureClass,
  context: ReleaseContext,
): ReleaseDecision {
  if (classification !== 'advice') return { allowed: true };

  if (context.audience === 'practitioner' || context.audience === 'platform_operator') {
    return { allowed: true };
  }

  const rep = context.representative;
  if (rep === null) {
    return {
      allowed: false,
      reason:
        'Regulated advice requires an authorized representative attached to the matter. ' +
        'No representative is assigned, so the output is limited to the applicant\'s own ' +
        'figures measured against the cited rule.',
      downgradeTo: 'assessment',
    };
  }

  if (rep.jurisdiction.toUpperCase() !== context.jurisdiction.toUpperCase()) {
    return {
      allowed: false,
      reason: `Representative ${rep.id} is authorized in ${rep.jurisdiction}, not ${context.jurisdiction}.`,
      downgradeTo: 'assessment',
    };
  }

  if (rep.expiresOn && rep.expiresOn < context.asOf) {
    return {
      allowed: false,
      reason: `Representative ${rep.id} credential expired on ${rep.expiresOn}.`,
      downgradeTo: 'assessment',
    };
  }

  return { allowed: true };
}

/** An engine output carrying its classification and the citations it rests on. */
export interface Disclosable<T> {
  readonly classification: DisclosureClass;
  readonly value: T;
  /** Citation ids backing this output. Empty is a defect for `assessment` and `advice`. */
  readonly citationIds: readonly string[];
}

export function disclosable<T>(
  classification: DisclosureClass,
  value: T,
  citationIds: readonly string[] = [],
): Disclosable<T> {
  return { classification, value, citationIds };
}
