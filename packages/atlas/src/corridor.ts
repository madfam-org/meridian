/**
 * Corridor derivation, and the assembly rule that turns five region files into
 * one registry.
 *
 * ## A corridor is computed, not stored
 *
 * {@link Corridor} exists for the length of a question. Nothing here writes one
 * down, because writing forty thousand of them down would create the impression
 * that each is a distinct thing somebody has to research. What exists is the
 * destination's system and the agreements that modify it for a given origin —
 * see the module doc on `./types.ts` for why the atlas is shaped that way.
 *
 * ## Where membership comes from
 *
 * From {@link MobilityBloc.members}, never from {@link Jurisdiction.blocs}.
 *
 * That is not an arbitrary pick. `MobilityBloc.members` carries the effective
 * date for each member, and dates are the whole point: a stay in Croatia in 2022
 * did not consume Schengen days, and a British national's right to reside in
 * Spain in 2015 was real. `Jurisdiction.blocs` is a flat list of ids with no
 * dates, so a derivation built on it would be silently timeless. It is treated
 * here as a cross-reference to be checked — `checkAtlasIntegrity` in
 * `./coverage.ts` reports every place the two disagree — and not as an input.
 *
 * A consequence worth stating plainly: several region files leave `blocs` empty
 * on stub entries whose membership the bloc registry does record. Corridors
 * between those jurisdictions still derive correctly. The reverse case, where a
 * jurisdiction claims a membership the registry does not carry, derives *without*
 * the effect and is reported as an integrity error rather than resolved.
 *
 * ## Dates, and the one thing this will not resolve
 *
 * `asOf` is a parameter and there is no default, because no package under
 * `packages/` reads a clock. Omitting it means "membership as the registry
 * records it today" — a member counts unless it has an `until`. Passing a date
 * evaluates every membership against that date, which is the only way to answer
 * a question about the past.
 *
 * Staged accessions are left unresolved, deliberately, following
 * `schengenAccessionAmbiguity` in `@meridian/core`. A date inside a
 * `partialSince` window is genuinely ambiguous — Bulgaria's internal air and sea
 * borders opened on 2024-03-31 and its land borders on 2025-01-01 — so the bloc
 * is **excluded** from `sharedBlocs` and surfaced by {@link explainCorridor} as
 * ambiguous. Excluding understates the corridor; including it would hand someone
 * a right that may not have applied to the crossing they actually made.
 */

import type { IsoDate, Result } from '@meridian/core';
import { MeridianError, compareDates, err, ok } from '@meridian/core';

import type {
  BlocEffect,
  BlocMembershipRecord,
  Corridor,
  Jurisdiction,
  JurisdictionCode,
  MobilityBloc,
  ResearchStatus,
} from './types.js';
import { jurisdictionCode } from './types.js';

// ---------------------------------------------------------------------------
// Research status
// ---------------------------------------------------------------------------

/**
 * Ranking, weakest first. Coverage arithmetic and corridor derivation both need
 * an order over {@link ResearchStatus}, and defining it twice is how the two
 * drift apart.
 */
export const RESEARCH_STATUS_ORDER: readonly ResearchStatus[] = [
  'stub',
  'researched',
  'encoded',
  'counsel_reviewed',
];

const RESEARCH_RANK: Readonly<Record<ResearchStatus, number>> = {
  stub: 0,
  researched: 1,
  encoded: 2,
  counsel_reviewed: 3,
};

export function researchStatusRank(status: ResearchStatus): number {
  return RESEARCH_RANK[status];
}

/**
 * A corridor is only as known as its least-known end.
 *
 * Spain is `encoded`; if the origin is a stub, the corridor is a stub. Taking
 * the stronger end would let one well-researched destination make two hundred
 * unresearched corridors look answered.
 */
export function weakerResearchStatus(a: ResearchStatus, b: ResearchStatus): ResearchStatus {
  return RESEARCH_RANK[a] <= RESEARCH_RANK[b] ? a : b;
}

/** True for `encoded` and `counsel_reviewed` — the statuses coverage counts as covered. */
export function isEncodedOrBetter(status: ResearchStatus): boolean {
  return RESEARCH_RANK[status] >= RESEARCH_RANK.encoded;
}

/** True for `researched` and above. */
export function isResearchedOrBetter(status: ResearchStatus): boolean {
  return RESEARCH_RANK[status] >= RESEARCH_RANK.researched;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/** One region file's contribution, labelled so a collision can name both sides. */
export interface JurisdictionRegistry {
  /** Where these entries came from, e.g. `'regions/africa.ts'`. Appears in findings. */
  readonly source: string;
  readonly jurisdictions: readonly Jurisdiction[];
}

/**
 * The same code supplied by more than one region file.
 *
 * Transcontinental jurisdictions are the live case: UN M49 files Türkiye,
 * Armenia, Azerbaijan and Georgia under Western Asia, and all four are Council of
 * Europe members. Both region agents chose to include rather than exclude them,
 * on the reasoning that a duplicate is loud and an omission is silent. This is
 * the loud part.
 */
export interface JurisdictionCollision {
  readonly code: JurisdictionCode;
  /** Every registry that supplied this code, in the order they were merged. */
  readonly sources: readonly string[];
  /** The registry whose record was kept. */
  readonly keptFrom: string;
  readonly keptStatus: ResearchStatus;
  /** The statuses of the records that were dropped, paired with their source. */
  readonly dropped: readonly { readonly source: string; readonly status: ResearchStatus }[];
  /**
   * True when a dropped record carried a *higher* research status than the one
   * kept, i.e. the merge lost verified work. First-wins is neutral with respect
   * to the coverage metric on purpose, so this has to be reported rather than
   * engineered away by preferring the better record.
   */
  readonly lostResearch: boolean;
}

export interface MergedRegistries {
  /** Deduplicated, in merge order. This is the atlas denominator. */
  readonly jurisdictions: readonly Jurisdiction[];
  /** Every code supplied more than once. Empty is the only correct value. */
  readonly collisions: readonly JurisdictionCollision[];
}

/**
 * Merge region registries into one, first-wins on a duplicate code.
 *
 * **First-wins, in the order the registries are passed**, and not "the
 * better-researched record wins". The resolution rule must not reference the
 * thing being measured: a tie-break that prefers the higher research status
 * resolves every ambiguity in the direction that raises the coverage numerator,
 * which is precisely the bias this package exists to avoid. Where first-wins
 * discards a better record, {@link JurisdictionCollision.lostResearch} says so
 * and the integrity check reports it.
 *
 * Deduplicating at all is necessary — counting Türkiye twice would inflate
 * `totalJurisdictions` and double-count its status — but it is a repair, not a
 * fix. The fix is for one of the two region files to drop the entry.
 */
export function mergeJurisdictionRegistries(
  registries: readonly JurisdictionRegistry[],
): MergedRegistries {
  const kept = new Map<JurisdictionCode, { readonly source: string; readonly record: Jurisdiction }>();
  const seen = new Map<
    JurisdictionCode,
    { readonly source: string; readonly status: ResearchStatus }[]
  >();

  for (const registry of registries) {
    for (const jurisdiction of registry.jurisdictions) {
      const trail = seen.get(jurisdiction.code) ?? [];
      trail.push({ source: registry.source, status: jurisdiction.researchStatus });
      seen.set(jurisdiction.code, trail);
      if (!kept.has(jurisdiction.code)) {
        kept.set(jurisdiction.code, { source: registry.source, record: jurisdiction });
      }
    }
  }

  const collisions: JurisdictionCollision[] = [];
  for (const [code, trail] of seen) {
    if (trail.length < 2) continue;
    const winner = kept.get(code);
    // Unreachable: every code in `seen` was inserted into `kept` on first sight.
    if (winner === undefined) continue;
    const dropped = trail.slice(1);
    collisions.push({
      code,
      sources: trail.map((t) => t.source),
      keptFrom: winner.source,
      keptStatus: winner.record.researchStatus,
      dropped,
      lostResearch: dropped.some(
        (d) => RESEARCH_RANK[d.status] > RESEARCH_RANK[winner.record.researchStatus],
      ),
    });
  }
  collisions.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

  return {
    jurisdictions: [...kept.values()].map((entry) => entry.record),
    collisions,
  };
}

// ---------------------------------------------------------------------------
// The atlas, and its lookup index
// ---------------------------------------------------------------------------

/** Everything corridor derivation needs: the jurisdictions and the agreements. */
export interface Atlas {
  readonly jurisdictions: readonly Jurisdiction[];
  readonly blocs: readonly MobilityBloc[];
}

export interface AtlasIndex {
  readonly jurisdictionsByCode: ReadonlyMap<JurisdictionCode, Jurisdiction>;
  readonly blocsById: ReadonlyMap<string, MobilityBloc>;
  /** code → bloc id → the membership record, so a lookup is not a scan. */
  readonly membershipsByJurisdiction: ReadonlyMap<
    JurisdictionCode,
    ReadonlyMap<string, BlocMembershipRecord>
  >;
}

const INDEX_CACHE = new WeakMap<Atlas, AtlasIndex>();

/**
 * Build the lookup index. Pure, and cached per atlas object so enumerating an
 * origin against 249 destinations does not rebuild it 249 times.
 *
 * On a duplicate code or a duplicate membership record the first is kept, which
 * matches {@link mergeJurisdictionRegistries}. Both are integrity errors and are
 * reported as such; indexing is not the place to fail, because a caller asking
 * about Mexico should still get an answer while Türkiye is filed twice.
 */
export function indexAtlas(atlas: Atlas): AtlasIndex {
  const cached = INDEX_CACHE.get(atlas);
  if (cached !== undefined) return cached;

  const jurisdictionsByCode = new Map<JurisdictionCode, Jurisdiction>();
  for (const jurisdiction of atlas.jurisdictions) {
    if (!jurisdictionsByCode.has(jurisdiction.code)) {
      jurisdictionsByCode.set(jurisdiction.code, jurisdiction);
    }
  }

  const blocsById = new Map<string, MobilityBloc>();
  const membershipsByJurisdiction = new Map<JurisdictionCode, Map<string, BlocMembershipRecord>>();
  for (const bloc of atlas.blocs) {
    if (!blocsById.has(bloc.id)) blocsById.set(bloc.id, bloc);
    for (const membership of bloc.members) {
      let byBloc = membershipsByJurisdiction.get(membership.jurisdiction);
      if (byBloc === undefined) {
        byBloc = new Map<string, BlocMembershipRecord>();
        membershipsByJurisdiction.set(membership.jurisdiction, byBloc);
      }
      if (!byBloc.has(bloc.id)) byBloc.set(bloc.id, membership);
    }
  }

  const index: AtlasIndex = { jurisdictionsByCode, blocsById, membershipsByJurisdiction };
  INDEX_CACHE.set(atlas, index);
  return index;
}

// ---------------------------------------------------------------------------
// Membership standing
// ---------------------------------------------------------------------------

/**
 * Where a jurisdiction stood in a bloc on a given date.
 *
 * `partial` is not a weaker `in_force`. It marks a staged accession window in
 * which some effects applied and others did not, and which of them applied to a
 * particular person depends on how they crossed. It is surfaced, never resolved.
 */
export type MembershipStanding =
  /** A member, with the bloc's effects applying in full. */
  | 'in_force'
  /** Inside a staged-accession window: some effects, ambiguous which. */
  | 'partial'
  /** Membership recorded, but it had not begun on the date asked about. */
  | 'not_yet'
  /** Membership recorded, and it had ended by the date asked about. */
  | 'ended'
  /** No membership record at all. */
  | 'not_a_member';

/**
 * Evaluate one membership record.
 *
 * Both boundaries are **inclusive**, matching the closed `DateRange` convention
 * the rest of the repository uses. `since` is the first day the effect applied
 * and `until` is the last: the United Kingdom's EU record ends 2020-12-31, the
 * final day of free movement, and a question about that day answers `in_force`.
 *
 * With no `asOf`, no clock is read and no date is compared — the answer is the
 * registry's present tense, which is `in_force` unless membership has an `until`.
 */
export function membershipStanding(
  record: BlocMembershipRecord | undefined,
  asOf?: IsoDate,
): MembershipStanding {
  if (record === undefined) return 'not_a_member';
  if (asOf === undefined) return record.until === undefined ? 'in_force' : 'ended';
  if (record.until !== undefined && compareDates(asOf, record.until) > 0) return 'ended';
  if (compareDates(asOf, record.since) >= 0) return 'in_force';
  if (record.partialSince !== undefined && compareDates(asOf, record.partialSince) >= 0) {
    return 'partial';
  }
  return 'not_yet';
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

export interface CorridorOptions {
  /**
   * The date the question is about. Omit for the registry's present tense; there
   * is no default and no clock read.
   */
  readonly asOf?: IsoDate;
}

/** How one bloc stands for both ends of a corridor. */
export interface CorridorBlocStanding {
  readonly bloc: string;
  readonly origin: MembershipStanding;
  readonly destination: MembershipStanding;
  /** Both ends in force: the bloc's effects apply and it enters `sharedBlocs`. */
  readonly shared: boolean;
  /**
   * At least one end sits in a staged-accession window and the other is in force
   * or likewise partial. Excluded from `sharedBlocs` and reported here instead.
   */
  readonly ambiguous: boolean;
}

/**
 * The corridor plus the working that produced it.
 *
 * {@link Corridor} is the contract type and cannot carry ambiguity — it has a
 * flat `sharedBlocs` list. This is where a caller finds out that a bloc was left
 * out because the date fell inside an accession window, rather than because the
 * two ends have nothing between them. The difference matters to a person.
 */
export interface CorridorExplanation {
  readonly corridor: Corridor;
  readonly originJurisdiction: Jurisdiction;
  readonly destinationJurisdiction: Jurisdiction;
  /** Every bloc either end has a record in, sorted by bloc id. */
  readonly blocs: readonly CorridorBlocStanding[];
  /** Bloc ids excluded from the corridor because the date is ambiguous. */
  readonly ambiguousBlocs: readonly string[];
}

/** Declaration order of {@link BlocEffect}, so a union is ordered the same way every time. */
const BLOC_EFFECT_ORDER: readonly BlocEffect[] = [
  'residence_and_work',
  'visa_free_entry',
  'facilitated_professional_entry',
  'reduced_naturalisation_period',
  'dual_nationality_permitted',
  'youth_mobility',
];

function parseCode(value: string): JurisdictionCode | null {
  try {
    return jurisdictionCode(value);
  } catch {
    return null;
  }
}

function unknownJurisdiction(role: 'origin' | 'destination', value: string): MeridianError {
  return new MeridianError(
    'INVALID_INPUT',
    `${role} is not a jurisdiction in this atlas`,
    { role, code: value },
  );
}

/**
 * Derive the corridor from `origin` to `destination`.
 *
 * `Err` rather than a thrown error for an unknown code, because an unknown code
 * is an expected outcome and not a fault: the atlas deliberately omits entry
 * controlling authorities that have no ISO 3166-1 alpha-2 code — Somaliland,
 * Northern Cyprus, Abkhazia, South Ossetia, Akrotiri and Dhekelia — and a caller
 * asking about one of those deserves a value it can handle, not an exception
 * that a `catch` will report as a system fault.
 *
 * A corridor from a jurisdiction to itself is also an `Err`. Deriving it would
 * union a jurisdiction's own bloc effects with themselves and return something
 * that reads like an answer.
 */
export function deriveCorridor(
  atlas: Atlas,
  origin: string,
  destination: string,
  options?: CorridorOptions,
): Result<Corridor, MeridianError> {
  const explained = explainCorridor(atlas, origin, destination, options);
  return explained.ok ? ok(explained.value.corridor) : err(explained.error);
}

/** {@link deriveCorridor}, plus the per-bloc standing that produced it. */
export function explainCorridor(
  atlas: Atlas,
  origin: string,
  destination: string,
  options?: CorridorOptions,
): Result<CorridorExplanation, MeridianError> {
  const index = indexAtlas(atlas);

  const originCode = parseCode(origin);
  if (originCode === null) return err(unknownJurisdiction('origin', origin));
  const destinationCode = parseCode(destination);
  if (destinationCode === null) return err(unknownJurisdiction('destination', destination));

  const originJurisdiction = index.jurisdictionsByCode.get(originCode);
  if (originJurisdiction === undefined) return err(unknownJurisdiction('origin', originCode));
  const destinationJurisdiction = index.jurisdictionsByCode.get(destinationCode);
  if (destinationJurisdiction === undefined) {
    return err(unknownJurisdiction('destination', destinationCode));
  }

  if (originCode === destinationCode) {
    return err(
      new MeridianError('INVALID_INPUT', 'a corridor needs two different jurisdictions', {
        code: originCode,
      }),
    );
  }

  return ok(
    buildExplanation(index, originJurisdiction, destinationJurisdiction, options?.asOf),
  );
}

function buildExplanation(
  index: AtlasIndex,
  originJurisdiction: Jurisdiction,
  destinationJurisdiction: Jurisdiction,
  asOf: IsoDate | undefined,
): CorridorExplanation {
  const originMemberships =
    index.membershipsByJurisdiction.get(originJurisdiction.code) ??
    new Map<string, BlocMembershipRecord>();
  const destinationMemberships =
    index.membershipsByJurisdiction.get(destinationJurisdiction.code) ??
    new Map<string, BlocMembershipRecord>();

  const blocIds = [...new Set([...originMemberships.keys(), ...destinationMemberships.keys()])];
  blocIds.sort();

  const standings: CorridorBlocStanding[] = [];
  const sharedBlocs: string[] = [];
  const ambiguousBlocs: string[] = [];
  const effects = new Set<BlocEffect>();

  for (const blocId of blocIds) {
    const originStanding = membershipStanding(originMemberships.get(blocId), asOf);
    const destinationStanding = membershipStanding(destinationMemberships.get(blocId), asOf);
    const shared = originStanding === 'in_force' && destinationStanding === 'in_force';
    const ambiguous =
      !shared &&
      (originStanding === 'partial' || destinationStanding === 'partial') &&
      (originStanding === 'in_force' || originStanding === 'partial') &&
      (destinationStanding === 'in_force' || destinationStanding === 'partial');

    standings.push({
      bloc: blocId,
      origin: originStanding,
      destination: destinationStanding,
      shared,
      ambiguous,
    });

    if (shared) {
      sharedBlocs.push(blocId);
      const bloc = index.blocsById.get(blocId);
      if (bloc !== undefined) for (const effect of bloc.confers) effects.add(effect);
    }
    if (ambiguous) ambiguousBlocs.push(blocId);
  }

  const corridor: Corridor = {
    origin: originJurisdiction.code,
    destination: destinationJurisdiction.code,
    sharedBlocs,
    effects: BLOC_EFFECT_ORDER.filter((effect) => effects.has(effect)),
    researchStatus: weakerResearchStatus(
      originJurisdiction.researchStatus,
      destinationJurisdiction.researchStatus,
    ),
  };

  return {
    corridor,
    originJurisdiction,
    destinationJurisdiction,
    blocs: standings,
    ambiguousBlocs,
  };
}

/**
 * Every corridor out of `origin`, one per other jurisdiction in the atlas,
 * ordered by destination code.
 *
 * `Err` on an unknown origin rather than an empty array. An empty array would be
 * indistinguishable from a real answer, and "no corridors" is the most
 * comfortable wrong answer available.
 */
export function corridorsFromOrigin(
  atlas: Atlas,
  origin: string,
  options?: CorridorOptions,
): Result<readonly Corridor[], MeridianError> {
  const index = indexAtlas(atlas);
  const originCode = parseCode(origin);
  if (originCode === null) return err(unknownJurisdiction('origin', origin));
  const originJurisdiction = index.jurisdictionsByCode.get(originCode);
  if (originJurisdiction === undefined) return err(unknownJurisdiction('origin', originCode));

  const corridors = sortedCounterparts(index, originCode).map(
    (destination) =>
      buildExplanation(index, originJurisdiction, destination, options?.asOf).corridor,
  );
  return ok(corridors);
}

/** Every corridor into `destination`, ordered by origin code. */
export function corridorsToDestination(
  atlas: Atlas,
  destination: string,
  options?: CorridorOptions,
): Result<readonly Corridor[], MeridianError> {
  const index = indexAtlas(atlas);
  const destinationCode = parseCode(destination);
  if (destinationCode === null) return err(unknownJurisdiction('destination', destination));
  const destinationJurisdiction = index.jurisdictionsByCode.get(destinationCode);
  if (destinationJurisdiction === undefined) {
    return err(unknownJurisdiction('destination', destinationCode));
  }

  const corridors = sortedCounterparts(index, destinationCode).map(
    (origin) => buildExplanation(index, origin, destinationJurisdiction, options?.asOf).corridor,
  );
  return ok(corridors);
}

/** Every jurisdiction except `self`, sorted by code so enumeration is reproducible. */
function sortedCounterparts(index: AtlasIndex, self: JurisdictionCode): readonly Jurisdiction[] {
  return [...index.jurisdictionsByCode.values()]
    .filter((jurisdiction) => jurisdiction.code !== self)
    .sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
}
