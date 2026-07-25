/**
 * Jurisdictions and the blocs that change how days are counted.
 *
 * Country codes are ISO 3166-1 alpha-2. Bloc codes are namespaced with `X-` so
 * they can never collide with a real country code.
 */

import type { IsoDate } from './civil-date.js';
import { compareDates } from './civil-date.js';

/** ISO 3166-1 alpha-2, uppercase. Not exhaustively enumerated — the world changes. */
export type CountryCode = string & { readonly __brand: 'CountryCode' };

/** A supranational area that has its own presence arithmetic. */
export type BlocCode = 'X-SCHENGEN' | 'X-EU' | 'X-EEA' | 'X-CTA';

export type JurisdictionCode = CountryCode | BlocCode;

const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

export function countryCode(value: string): CountryCode {
  const upper = value.toUpperCase();
  if (!COUNTRY_CODE_RE.test(upper)) {
    throw new RangeError(`invalid ISO 3166-1 alpha-2 country code: ${JSON.stringify(value)}`);
  }
  return upper as CountryCode;
}

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && COUNTRY_CODE_RE.test(value);
}

export function isBlocCode(value: unknown): value is BlocCode {
  return value === 'X-SCHENGEN' || value === 'X-EU' || value === 'X-EEA' || value === 'X-CTA';
}

/** Membership of a bloc, with the date it took effect for that member. */
export interface BlocMembership {
  readonly country: CountryCode;
  /** First date on which the member's territory fully counted as part of the bloc. */
  readonly since: IsoDate;
  /**
   * Set when accession happened in stages: the date partial effects began,
   * ahead of `since`. Bulgaria and Romania had internal air and sea border
   * controls lifted on 2024-03-31 but did not fully accede until 2025-01-01.
   *
   * A stay falling between `partialSince` and `since` is genuinely ambiguous
   * for 90/180 purposes and this library will not resolve it silently — see
   * {@link schengenAccessionAmbiguity}. Guessing is harmful in both directions:
   * counting those days invents an overstay, and not counting them hands the
   * traveller days they may not have.
   */
  readonly partialSince?: IsoDate;
  /** Set when a member left, e.g. the United Kingdom leaving the EU. */
  readonly until?: IsoDate;
}

const C = (s: string) => s as CountryCode;
const D = (s: string) => s as IsoDate;

/**
 * Schengen area membership, with per-state effective dates.
 *
 * Dates matter: a stay in Croatia in 2022 did not consume Schengen days. A
 * tracker that treats membership as timeless will over-count and tell a client
 * to leave a country they are entitled to be in.
 *
 * Bulgaria and Romania acceded in two steps: internal air and sea border
 * controls were lifted on 2024-03-31, and full accession — including internal
 * land borders — followed on 2025-01-01 by Council decision of 2024-12-12.
 * `since` records the full accession; the earlier step is `partialSince`, and
 * stays landing between the two are surfaced as ambiguous rather than resolved.
 *
 * @see docs/LEGAL_CATALOG_REVIEW.md — this table is `unreviewed` until counsel signs off.
 */
export const SCHENGEN_MEMBERSHIP: readonly BlocMembership[] = [
  { country: C('AT'), since: D('1997-12-01') },
  { country: C('BE'), since: D('1995-03-26') },
  { country: C('BG'), since: D('2025-01-01'), partialSince: D('2024-03-31') },
  { country: C('CH'), since: D('2008-12-12') },
  { country: C('CZ'), since: D('2007-12-21') },
  { country: C('DE'), since: D('1995-03-26') },
  { country: C('DK'), since: D('2001-03-25') },
  { country: C('EE'), since: D('2007-12-21') },
  { country: C('ES'), since: D('1995-03-26') },
  { country: C('FI'), since: D('2001-03-25') },
  { country: C('FR'), since: D('1995-03-26') },
  { country: C('GR'), since: D('2000-03-26') },
  { country: C('HR'), since: D('2023-01-01') },
  { country: C('HU'), since: D('2007-12-21') },
  { country: C('IS'), since: D('2001-03-25') },
  { country: C('IT'), since: D('1997-10-26') },
  { country: C('LI'), since: D('2011-12-19') },
  { country: C('LT'), since: D('2007-12-21') },
  { country: C('LU'), since: D('1995-03-26') },
  { country: C('LV'), since: D('2007-12-21') },
  { country: C('MT'), since: D('2007-12-21') },
  { country: C('NL'), since: D('1995-03-26') },
  { country: C('NO'), since: D('2001-03-25') },
  { country: C('PL'), since: D('2007-12-21') },
  { country: C('PT'), since: D('1995-03-26') },
  { country: C('RO'), since: D('2025-01-01'), partialSince: D('2024-03-31') },
  { country: C('SE'), since: D('2001-03-25') },
  { country: C('SI'), since: D('2007-12-21') },
  { country: C('SK'), since: D('2007-12-21') },
];

/** True when `country` was fully inside the Schengen area on `on`. */
export function isSchengenOn(country: CountryCode, on: IsoDate): boolean {
  const m = SCHENGEN_MEMBERSHIP.find((x) => x.country === country);
  if (!m) return false;
  if (compareDates(on, m.since) < 0) return false;
  if (m.until && compareDates(on, m.until) > 0) return false;
  return true;
}

/**
 * True when `on` falls in a staged-accession window — after partial effects
 * began but before full accession.
 *
 * Callers counting days against the 90/180 rule must escalate these to a human
 * rather than resolve them. Whether time spent in Bulgaria or Romania between
 * 2024-03-31 and 2025-01-01 consumed Schengen allowance depends on how the
 * person entered and which controls applied to that crossing, which is not
 * something a day count can recover from a ledger.
 */
export function schengenAccessionAmbiguity(country: CountryCode, on: IsoDate): boolean {
  const m = SCHENGEN_MEMBERSHIP.find((x) => x.country === country);
  if (!m || !m.partialSince) return false;
  return compareDates(on, m.partialSince) >= 0 && compareDates(on, m.since) < 0;
}

/**
 * Countries treated as *iberoamericanos* for the reduced-residency route to
 * Spanish nationality, alongside the separately-named Andorra, Philippines,
 * Equatorial Guinea and Portugal.
 *
 * Membership of this set is administrative practice built on a constitutional
 * category, not a closed statutory list — treat additions as a counsel
 * decision, not a code change.
 *
 * @see es-cc-art-22 in the pathway catalog.
 */
export const IBERO_AMERICAN_COUNTRIES: readonly CountryCode[] = [
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT',
  'HN', 'MX', 'NI', 'PA', 'PE', 'PY', 'SV', 'UY', 'VE',
].map(C);

/**
 * The full set that qualifies for Spain's two-year reduced residency:
 * the Ibero-American countries plus the four named separately in art. 22.1.
 */
export const SPAIN_REDUCED_RESIDENCY_NATIONALITIES: readonly CountryCode[] = [
  ...IBERO_AMERICAN_COUNTRIES,
  C('AD'), // Andorra
  C('PH'), // Philippines
  C('GQ'), // Equatorial Guinea
  C('PT'), // Portugal
];

/**
 * How a nationality was acquired.
 *
 * This is not bookkeeping. Art. 22.1 confers the two-year period on
 * *nacionales de origen* — nationals **by origin**. Someone born in one state
 * who later acquired a qualifying nationality **by residence** is on the
 * ten-year general regime, not the two-year one. Reading the passport alone and
 * concluding otherwise tells that person they are eight years closer to Spanish
 * nationality than they are.
 */
export type NationalityAcquisition =
  /** By birth, descent, or otherwise attributed from origin — *de origen*. */
  | 'by_origin'
  /** Acquired later by residence in that state. */
  | 'by_residence'
  /** Acquired later by naturalisation on another basis, marriage, or option. */
  | 'by_naturalization'
  /** Not recorded. Must resolve to indeterminate, never to a favourable answer. */
  | 'unknown';

/**
 * Whether a nationality is one of the states named in art. 22.1.
 *
 * Membership of the *list* is only half the test — see
 * {@link spainReducedResidencyEligibility}, which also applies the *de origen*
 * requirement. This predicate is retained for callers that genuinely need the
 * list membership on its own, such as rendering the catalog.
 */
export function qualifiesForSpainReducedResidency(nationality: CountryCode): boolean {
  return SPAIN_REDUCED_RESIDENCY_NATIONALITIES.includes(nationality);
}

/** Three-valued outcome: the facts may simply not say. */
export type ReducedResidencyEligibility = 'qualifies' | 'does_not_qualify' | 'indeterminate';

/**
 * The full art. 22.1 nationality test: a named state **and** nationality by
 * origin.
 *
 * Returns `indeterminate` when the acquisition mode is unrecorded, so callers
 * ask rather than assume. Note that art. 22.1 also confers the two-year period
 * on *sefardíes originarios de España*, which rests on evidence of Sephardic
 * origin rather than on present nationality and is a separate basis this
 * function does not decide.
 */
export function spainReducedResidencyEligibility(
  nationality: CountryCode,
  acquisition: NationalityAcquisition,
): ReducedResidencyEligibility {
  if (!SPAIN_REDUCED_RESIDENCY_NATIONALITIES.includes(nationality)) return 'does_not_qualify';
  if (acquisition === 'unknown') return 'indeterminate';
  return acquisition === 'by_origin' ? 'qualifies' : 'does_not_qualify';
}

/**
 * Nationalities exempted from renouncing their existing nationality when
 * naturalising in Spain.
 *
 * Codified at art. 24.1 of the Civil Code; the same list as the reduced-residency
 * set. France is *not* on it — the France-Spain position rests on a separate
 * bilateral instrument and is deliberately excluded here rather than guessed at.
 */
export const SPAIN_NO_RENUNCIATION_NATIONALITIES: readonly CountryCode[] =
  SPAIN_REDUCED_RESIDENCY_NATIONALITIES;

export function exemptFromSpanishRenunciation(nationality: CountryCode): boolean {
  return SPAIN_NO_RENUNCIATION_NATIONALITIES.includes(nationality);
}

/** Parties to the Canada-United States-Mexico Agreement. */
export const CUSMA_PARTIES: readonly CountryCode[] = [C('CA'), C('MX'), C('US')];

export function isCusmaParty(country: CountryCode): boolean {
  return CUSMA_PARTIES.includes(country);
}

/** Parties to the 1961 Hague Apostille Convention, for document legalisation routing. */
export interface ApostilleStatus {
  readonly country: CountryCode;
  readonly isParty: boolean;
  /** Set when the country requires consular legalisation instead of an apostille. */
  readonly note?: string;
}

/**
 * Apostille status for the jurisdictions the current catalog touches. Deliberately
 * narrow: an incomplete list that says "unknown" is safe, a guessed list is not.
 */
export const APOSTILLE_STATUS: readonly ApostilleStatus[] = [
  { country: C('MX'), isParty: true },
  { country: C('ES'), isParty: true },
  { country: C('CA'), isParty: true, note: 'In force for Canada since 2024-01-11.' },
  { country: C('US'), isParty: true },
];

/** `null` when the country is outside the catalog — callers must not assume a default. */
export function apostilleStatus(country: CountryCode): ApostilleStatus | null {
  return APOSTILLE_STATUS.find((x) => x.country === country) ?? null;
}
