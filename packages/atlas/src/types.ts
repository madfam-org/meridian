/**
 * The migration atlas — the shape of the whole problem, so we can measure how
 * much of it we have actually solved.
 *
 * ## Why this is not a list of corridors
 *
 * The obvious model is every ordered pair of countries: roughly 200 × 199, near
 * forty thousand corridors. That model is wrong, and adopting it would make the
 * coverage number meaningless — we would report a fraction of a percent forever
 * while doing real work.
 *
 * Immigration rules are overwhelmingly **destination-side**. Spain decides who
 * may reside in Spain. What the origin nationality changes is not the existence
 * of the rules but their *terms*: whether a visa is required at all, whether a
 * reduced qualifying period applies, whether a bilateral instrument creates a
 * route that would not otherwise exist. A Mexican and a Moroccan applying in
 * Spain meet the same statute; art. 22.1 gives one of them a two-year period and
 * the other ten.
 *
 * So the universe is:
 *
 *     ~200 destination systems  ×  a few dozen agreements that modify them
 *
 * and a corridor is *derived* from a destination plus an origin, not stored.
 * That is both the truthful model and the tractable one.
 *
 * ## Why there are two coverage numbers
 *
 * Migration is extremely concentrated. A handful of corridors carry an enormous
 * share of the world's migrants; most ordered pairs carry almost nobody. A
 * purely structural count — systems encoded over systems that exist — treats
 * Mexico-to-United States and Tuvalu-to-San Marino as equal units of progress,
 * which is a good way to feel busy while helping no one.
 *
 * So {@link CoverageReport} carries both: `structural`, which measures the
 * engineering surface, and `weighted`, which measures the share of actual human
 * beings whose corridor we can speak to. They should be read together, and when
 * they diverge sharply the weighted number is the one that matters.
 */

import type { IsoDate } from '@meridian/core';

/** ISO 3166-1 alpha-2, uppercase. Territories with their own system get their own code. */
export type JurisdictionCode = string & { readonly __brand: 'JurisdictionCode' };

export function jurisdictionCode(value: string): JurisdictionCode {
  const upper = value.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    throw new RangeError(`invalid jurisdiction code: ${JSON.stringify(value)}`);
  }
  return upper as JurisdictionCode;
}

/**
 * Whether a place runs its own immigration system.
 *
 * Sovereignty and immigration control do not always coincide, in both
 * directions, and a registry that assumed they did would be wrong about dozens
 * of places. Hong Kong and Macau run their own systems. Several European
 * microstates delegate control to a neighbour. Some territories of a sovereign
 * state legislate independently on migration.
 */
export type SystemAutonomy =
  /** Legislates and administers its own immigration control. */
  | 'autonomous'
  /** Immigration controlled by another jurisdiction; see `controlledBy`. */
  | 'delegated'
  /** Runs its own system inside a wider free-movement area it cannot opt out of. */
  | 'autonomous_within_bloc'
  /** Not yet established by research. */
  | 'unknown';

/**
 * How well we actually know a jurisdiction.
 *
 * Mirrors `reviewStatus` on a pathway, and for the same reason: a record that
 * does not say how much it has been checked invites the reader to assume it has
 * been. Coverage arithmetic counts only `researched` and above.
 */
export type ResearchStatus =
  /** Listed because it exists. Nothing about it has been verified. */
  | 'stub'
  /** Basic facts verified against an official or authoritative source. */
  | 'researched'
  /** Its pathways are encoded in the Meridian catalog. */
  | 'encoded'
  /** Encoded and reviewed by counsel — the only state that permits advice-class output. */
  | 'counsel_reviewed';

/** A mobility agreement or common area that changes the terms between its members. */
export interface MobilityBloc {
  readonly id: string;
  readonly name: string;
  readonly kind: BlocKind;
  /** Members, with the date membership took effect for each. */
  readonly members: readonly BlocMembershipRecord[];
  /** What it actually confers. Free movement and visa-waiver are very different things. */
  readonly confers: readonly BlocEffect[];
  readonly citationUrl?: string;
  readonly verifiedOn?: IsoDate;
  readonly note?: string;
}

export type BlocKind =
  | 'free_movement'
  | 'common_travel_area'
  | 'economic_union'
  | 'trade_agreement_mobility'
  | 'visa_waiver'
  | 'bilateral_treaty'
  | 'residence_agreement';

export type BlocEffect =
  /** Members' nationals may reside and work without a permit. */
  | 'residence_and_work'
  /** Entry without a visa, without any right to reside. */
  | 'visa_free_entry'
  /** A defined occupational route, e.g. CUSMA professionals. */
  | 'facilitated_professional_entry'
  /** A reduced qualifying period for naturalisation. */
  | 'reduced_naturalisation_period'
  /** Exemption from renouncing an existing nationality. */
  | 'dual_nationality_permitted'
  /** A reciprocal youth-mobility or working-holiday scheme. */
  | 'youth_mobility';

export interface BlocMembershipRecord {
  readonly jurisdiction: JurisdictionCode;
  readonly since: IsoDate;
  /** Set where accession happened in stages; the interim period is ambiguous. */
  readonly partialSince?: IsoDate;
  readonly until?: IsoDate;
}

/** One jurisdiction in the atlas. */
export interface Jurisdiction {
  readonly code: JurisdictionCode;
  readonly name: { readonly en: string; readonly es: string };
  readonly region: Region;
  readonly autonomy: SystemAutonomy;
  /** Set when `autonomy` is 'delegated'. */
  readonly controlledBy?: JurisdictionCode;
  readonly researchStatus: ResearchStatus;
  /** Bloc ids this jurisdiction belongs to. Resolved against the bloc registry. */
  readonly blocs: readonly string[];
  /**
   * Broad categories the destination offers. Deliberately coarse — this is an
   * atlas, not a catalog. Encoding the actual criteria is the catalog's job.
   */
  readonly inbound: readonly InboundCategory[];
  /**
   * Restrictions a jurisdiction places on its own nationals LEAVING.
   *
   * Usually empty, and easy to forget exists — which is exactly why it is
   * modelled. For someone subject to an exit visa requirement or a travel ban,
   * the binding constraint is on the way out, and a platform that only ever
   * looks at the destination would give them a confidently useless answer.
   */
  readonly outboundConstraints: readonly OutboundConstraint[];
  /** Source actually consulted. Absent on a stub, required above it. */
  readonly sourceUrl?: string;
  readonly verifiedOn?: IsoDate;
  readonly note?: string;
}

export type Region =
  | 'africa'
  | 'americas'
  | 'asia'
  | 'europe'
  | 'oceania';

export type InboundCategory =
  | 'work_employed'
  | 'work_self_employed'
  | 'highly_skilled'
  | 'intra_company_transfer'
  | 'study'
  | 'family_reunification'
  | 'spouse_partner'
  | 'ancestry_or_descent'
  | 'investment_or_entrepreneur'
  | 'retirement_or_passive_income'
  | 'digital_nomad'
  | 'humanitarian_or_protection'
  | 'regularisation'
  | 'naturalisation_by_residence'
  | 'free_movement';

export type OutboundConstraint =
  | 'exit_visa_required'
  | 'exit_permit_for_some_nationals'
  | 'passport_issuance_restricted'
  | 'military_service_hold'
  | 'destination_specific_ban';

/**
 * A corridor is derived, never stored.
 *
 * Materialising forty thousand records would create the illusion that each is a
 * distinct thing to be researched. What exists is the destination's system, and
 * the agreements that modify it for a given origin.
 */
export interface Corridor {
  readonly origin: JurisdictionCode;
  readonly destination: JurisdictionCode;
  /** Bloc ids in force between the two. */
  readonly sharedBlocs: readonly string[];
  /** Effects conferred by those blocs, deduplicated. */
  readonly effects: readonly BlocEffect[];
  /** The weaker of the two research statuses — a corridor is as known as its least-known end. */
  readonly researchStatus: ResearchStatus;
}

/**
 * Estimated migrant stock on a corridor, for weighted coverage.
 *
 * Stock, not flow: flow data is patchier and more volatile, and the question
 * "how many people does this corridor concern" is better answered by how many
 * live there now. Figures are estimates from international statistics and are
 * rounded; they exist to weight a coverage metric, not to be quoted.
 */
export interface CorridorStock {
  readonly origin: JurisdictionCode;
  readonly destination: JurisdictionCode;
  /** Estimated persons born in origin, resident in destination. */
  readonly stock: number;
  readonly sourceUrl?: string;
  readonly asOfYear?: number;
}

/** What we can honestly say we cover. */
export interface CoverageReport {
  readonly asOf: IsoDate;
  readonly structural: {
    /** Jurisdictions at each research status. */
    readonly byStatus: Readonly<Record<ResearchStatus, number>>;
    readonly totalJurisdictions: number;
    /** Encoded or better, over total. 0-1. */
    readonly encodedFraction: number;
    /** Researched or better, over total. 0-1. */
    readonly researchedFraction: number;
  };
  readonly weighted: {
    /** Global migrant stock represented in the stock table. */
    readonly knownStock: number;
    /** Stock on corridors whose BOTH ends are encoded or better. */
    readonly coveredStock: number;
    /** coveredStock / knownStock. 0-1. */
    readonly coveredFraction: number;
    /**
     * What share of the world's migrants the stock table itself accounts for.
     * Without this the weighted number silently measures a subset — the
     * green-by-vacuity failure applied to a metric.
     */
    readonly stockTableCompleteness: number | null;
  };
  /** Corridors with the largest stock that we do NOT yet cover — the work queue, in value order. */
  readonly largestUncovered: readonly CorridorStock[];
}
