/**
 * Coverage arithmetic, and the integrity checks that protect its denominator.
 *
 * ## Why the integrity checks live next to the metric
 *
 * Coverage is a fraction, and every defect in this package moves it. A
 * jurisdiction listed twice inflates the denominator and double-counts a status.
 * A jurisdiction missing altogether shrinks the denominator and raises the
 * percentage. A bloc id that resolves to nothing quietly removes an effect from
 * every corridor that touches it. None of that surfaces as an exception; it
 * surfaces as a slightly better number, which is the failure mode nobody
 * investigates.
 *
 * So {@link checkAtlasIntegrity} is not a linter. It is the part of the metric
 * that says whether the metric can be trusted, and its findings belong on the
 * same page as the percentage.
 *
 * ## Two numbers, read together
 *
 * `structural` counts systems: encoded over total. It measures engineering
 * surface and it treats Mexico-to-United States and Tuvalu-to-San Marino as
 * equal units of progress.
 *
 * `weighted` counts people, using the migrant-stock table. It is the one that
 * answers "whose problem have we actually solved". When the two diverge sharply
 * the weighted number is the one that matters — and today they diverge about as
 * sharply as they can, because the two encoded jurisdictions do not appear as
 * both ends of any single corridor in the stock table.
 *
 * ## `stockTableCompleteness`, and the reason it exists
 *
 * `coveredFraction` is a share of the corridors the stock table happens to
 * contain. If the table held one corridor and we covered it, `coveredFraction`
 * would be 1.0 and would mean nothing. `stockTableCompleteness` is the guard
 * against that: the share of the world's migrants the table accounts for at all.
 * It is `null` — never 1, never omitted — when the global total is unavailable,
 * because a completeness of 1 asserted without a denominator is the same lie
 * told more confidently.
 */

import type { IsoDate } from '@meridian/core';

import type {
  CorridorStock,
  CoverageReport,
  Jurisdiction,
  JurisdictionCode,
  MobilityBloc,
  ResearchStatus,
} from './types.js';
import type { JurisdictionRegistry } from './corridor.js';
import {
  RESEARCH_STATUS_ORDER,
  isEncodedOrBetter,
  isResearchedOrBetter,
  mergeJurisdictionRegistries,
} from './corridor.js';

// ---------------------------------------------------------------------------
// Integrity
// ---------------------------------------------------------------------------

/**
 * The rules, in the order findings are reported.
 *
 * Every one of these is a way the atlas can be wrong without anything throwing.
 */
export type IntegrityRule =
  /** The same code supplied by two region files. Inflates the denominator. */
  | 'duplicate_jurisdiction_code'
  /** First-wins dedupe discarded a record with a higher research status. */
  | 'collision_lost_research'
  /** A jurisdiction cites a bloc id that is not in the bloc registry. */
  | 'unresolved_bloc_reference'
  /** A jurisdiction claims a bloc that exists but does not list it as a member. */
  | 'bloc_membership_disagreement'
  /** A bloc lists a member code that is not a jurisdiction in the atlas. */
  | 'unresolved_bloc_member'
  /** Two blocs share an id. */
  | 'duplicate_bloc_id'
  /** One bloc lists the same jurisdiction twice. */
  | 'duplicate_bloc_membership'
  /** A membership ends before it begins. */
  | 'membership_dates_inverted'
  /** A stock row names a jurisdiction the atlas does not have. */
  | 'unresolved_stock_endpoint'
  /** A stock row's origin and destination are the same place. */
  | 'stock_row_self_corridor'
  /** The same ordered pair appears twice in the stock table. */
  | 'duplicate_stock_row'
  /** A stock figure that is not a finite, non-negative number. */
  | 'invalid_stock_value'
  /** Above `stub` without the `sourceUrl` and `verifiedOn` that promotion requires. */
  | 'missing_source_above_stub'
  /** `autonomy: 'delegated'` without `controlledBy`. */
  | 'delegated_without_controller'
  /** `controlledBy` names a jurisdiction the atlas does not have. */
  | 'unresolved_controller'
  /** `controlledBy` points at the jurisdiction itself. */
  | 'controller_self_reference';

const RULE_ORDER: readonly IntegrityRule[] = [
  'duplicate_jurisdiction_code',
  'collision_lost_research',
  'unresolved_bloc_reference',
  'bloc_membership_disagreement',
  'unresolved_bloc_member',
  'duplicate_bloc_id',
  'duplicate_bloc_membership',
  'membership_dates_inverted',
  'unresolved_stock_endpoint',
  'stock_row_self_corridor',
  'duplicate_stock_row',
  'invalid_stock_value',
  'missing_source_above_stub',
  'delegated_without_controller',
  'unresolved_controller',
  'controller_self_reference',
];

export interface IntegrityFinding {
  readonly rule: IntegrityRule;
  /** What the finding is about: a jurisdiction code, a bloc id, or `ORIGIN>DESTINATION`. */
  readonly subject: string;
  /** Enough detail to act without re-deriving the check. */
  readonly detail: string;
}

export interface AtlasIntegrityInput {
  /**
   * The region files as separate registries, **not** pre-merged. Duplicate codes
   * are invisible after a merge, which is exactly why the merge reports them and
   * this check takes the unmerged input.
   */
  readonly registries: readonly JurisdictionRegistry[];
  readonly blocs: readonly MobilityBloc[];
  readonly stock: readonly CorridorStock[];
}

/**
 * One membership the bloc registry records and the jurisdiction entry does not
 * mention.
 *
 * Not an integrity error: {@link MobilityBloc.members} is authoritative and
 * corridor derivation reads it, so the corridor is right either way. It is
 * reported separately because it is a real documentation gap — a reader looking
 * at Belgium's entry sees an empty `blocs` array and could conclude Belgium has
 * no free movement — and because the count is large enough that mixing it into
 * the findings would bury the errors.
 */
export interface BlocCrossReferenceGap {
  readonly jurisdiction: JurisdictionCode;
  readonly bloc: string;
}

/**
 * Check every rule. Returns findings sorted by rule then subject, so two runs
 * over the same data produce byte-identical output.
 *
 * An empty array is the only correct result, and it is a claim: it says the
 * checks ran and found nothing, which is why a caller must be able to
 * distinguish it from a check that never ran. {@link INTEGRITY_RULE_COUNT} is
 * exported so the number of rules exercised can be printed alongside the number
 * of findings.
 */
export function checkAtlasIntegrity(input: AtlasIntegrityInput): readonly IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  const add = (rule: IntegrityRule, subject: string, detail: string): void => {
    findings.push({ rule, subject, detail });
  };

  // -- assembly ------------------------------------------------------------
  const merged = mergeJurisdictionRegistries(input.registries);
  for (const collision of merged.collisions) {
    add(
      'duplicate_jurisdiction_code',
      collision.code,
      `supplied by ${collision.sources.join(' and ')}; kept the ${collision.keptFrom} record ` +
        `(${collision.keptStatus}), dropped ` +
        collision.dropped.map((d) => `${d.source} (${d.status})`).join(', ') +
        '. One of the region files must drop the entry; deduplication here is a repair, not a fix.',
    );
    if (collision.lostResearch) {
      add(
        'collision_lost_research',
        collision.code,
        `the dropped record carried a higher research status than the one kept ` +
          `(${collision.keptStatus}). First-wins is neutral with respect to the coverage ` +
          'metric on purpose, so the loss is reported rather than resolved by preferring ' +
          'the better record.',
      );
    }
  }

  const jurisdictions = merged.jurisdictions;
  const byCode = new Map<JurisdictionCode, Jurisdiction>();
  for (const jurisdiction of jurisdictions) byCode.set(jurisdiction.code, jurisdiction);

  // -- blocs ---------------------------------------------------------------
  const blocsById = new Map<string, MobilityBloc>();
  for (const bloc of input.blocs) {
    if (blocsById.has(bloc.id)) {
      add('duplicate_bloc_id', bloc.id, 'two bloc records share this id; the first is used.');
      continue;
    }
    blocsById.set(bloc.id, bloc);
  }

  const registryMembership = new Map<JurisdictionCode, Set<string>>();
  for (const bloc of blocsById.values()) {
    const seenMembers = new Set<JurisdictionCode>();
    for (const membership of bloc.members) {
      if (seenMembers.has(membership.jurisdiction)) {
        add(
          'duplicate_bloc_membership',
          `${bloc.id}/${membership.jurisdiction}`,
          'the same jurisdiction appears twice in one bloc; the first record is used.',
        );
      }
      seenMembers.add(membership.jurisdiction);

      if (!byCode.has(membership.jurisdiction)) {
        add(
          'unresolved_bloc_member',
          `${bloc.id}/${membership.jurisdiction}`,
          'bloc member does not resolve to a jurisdiction in the atlas, so no corridor can ' +
            'ever carry this membership.',
        );
      }
      if (membership.until !== undefined && membership.until < membership.since) {
        add(
          'membership_dates_inverted',
          `${bloc.id}/${membership.jurisdiction}`,
          `until ${membership.until} precedes since ${membership.since}.`,
        );
      }

      let set = registryMembership.get(membership.jurisdiction);
      if (set === undefined) {
        set = new Set<string>();
        registryMembership.set(membership.jurisdiction, set);
      }
      set.add(bloc.id);
    }
  }

  // -- jurisdictions -------------------------------------------------------
  for (const jurisdiction of jurisdictions) {
    if (jurisdiction.researchStatus !== 'stub') {
      const missing: string[] = [];
      if (jurisdiction.sourceUrl === undefined || jurisdiction.sourceUrl === '') {
        missing.push('sourceUrl');
      }
      if (jurisdiction.verifiedOn === undefined) missing.push('verifiedOn');
      if (missing.length > 0) {
        add(
          'missing_source_above_stub',
          jurisdiction.code,
          `researchStatus is '${jurisdiction.researchStatus}' but ${missing.join(' and ')} ` +
            'is absent. Promotion above stub is a claim that a source was consulted; ' +
            'without the source the claim is unverifiable.',
        );
      }
    }

    if (jurisdiction.autonomy === 'delegated' && jurisdiction.controlledBy === undefined) {
      add(
        'delegated_without_controller',
        jurisdiction.code,
        "autonomy is 'delegated' with no controlledBy, so the record says immigration is " +
          'controlled elsewhere without saying where.',
      );
    }
    if (jurisdiction.controlledBy !== undefined) {
      if (jurisdiction.controlledBy === jurisdiction.code) {
        add('controller_self_reference', jurisdiction.code, 'controlledBy points at itself.');
      } else if (!byCode.has(jurisdiction.controlledBy)) {
        add(
          'unresolved_controller',
          jurisdiction.code,
          `controlledBy '${jurisdiction.controlledBy}' is not a jurisdiction in the atlas.`,
        );
      }
    }

    for (const blocId of jurisdiction.blocs) {
      const bloc = blocsById.get(blocId);
      if (bloc === undefined) {
        add(
          'unresolved_bloc_reference',
          `${jurisdiction.code}/${blocId}`,
          `jurisdiction cites bloc '${blocId}', which is not in the bloc registry. Corridor ` +
            'derivation reads the registry, so this membership confers nothing today.',
        );
        continue;
      }
      if (!(registryMembership.get(jurisdiction.code)?.has(blocId) ?? false)) {
        add(
          'bloc_membership_disagreement',
          `${jurisdiction.code}/${blocId}`,
          `jurisdiction claims membership of '${blocId}' but the bloc registry does not list ` +
            'it as a member. The two records disagree: a reader of the jurisdiction sees the ' +
            'right, and corridor derivation does not.',
        );
      }
    }
  }

  // -- stock ---------------------------------------------------------------
  const seenRows = new Set<string>();
  for (const row of input.stock) {
    const pair = `${row.origin}>${row.destination}`;
    if (seenRows.has(pair)) {
      add('duplicate_stock_row', pair, 'the same ordered pair appears twice; both are summed.');
    }
    seenRows.add(pair);

    if (row.origin === row.destination) {
      add('stock_row_self_corridor', pair, 'origin and destination are the same jurisdiction.');
    }
    if (!Number.isFinite(row.stock) || row.stock < 0) {
      add('invalid_stock_value', pair, `stock is ${String(row.stock)}.`);
    }
    if (!byCode.has(row.origin)) {
      add(
        'unresolved_stock_endpoint',
        pair,
        `origin '${row.origin}' is not a jurisdiction in the atlas, so this corridor can never ` +
          'be counted as covered and permanently depresses weighted coverage.',
      );
    }
    if (!byCode.has(row.destination)) {
      add(
        'unresolved_stock_endpoint',
        pair,
        `destination '${row.destination}' is not a jurisdiction in the atlas, so this corridor ` +
          'can never be counted as covered and permanently depresses weighted coverage.',
      );
    }
  }

  const ruleIndex = (rule: IntegrityRule): number => RULE_ORDER.indexOf(rule);
  findings.sort((a, b) => {
    const byRule = ruleIndex(a.rule) - ruleIndex(b.rule);
    if (byRule !== 0) return byRule;
    if (a.subject !== b.subject) return a.subject < b.subject ? -1 : 1;
    return a.detail < b.detail ? -1 : a.detail > b.detail ? 1 : 0;
  });
  return findings;
}

/** How many distinct rules {@link checkAtlasIntegrity} exercises. */
export const INTEGRITY_RULE_COUNT: number = RULE_ORDER.length;

/**
 * Memberships the bloc registry records that the jurisdiction entry does not
 * mention. Sorted by jurisdiction then bloc.
 *
 * @see BlocCrossReferenceGap for why this is separate from the findings.
 */
export function blocCrossReferenceGaps(
  input: AtlasIntegrityInput,
): readonly BlocCrossReferenceGap[] {
  const merged = mergeJurisdictionRegistries(input.registries);
  const claimed = new Map<JurisdictionCode, ReadonlySet<string>>();
  for (const jurisdiction of merged.jurisdictions) {
    claimed.set(jurisdiction.code, new Set(jurisdiction.blocs));
  }

  const gaps: BlocCrossReferenceGap[] = [];
  for (const bloc of input.blocs) {
    for (const membership of bloc.members) {
      const claims = claimed.get(membership.jurisdiction);
      if (claims === undefined) continue; // an unresolved member; reported as a finding.
      if (!claims.has(bloc.id)) gaps.push({ jurisdiction: membership.jurisdiction, bloc: bloc.id });
    }
  }
  gaps.sort((a, b) => {
    if (a.jurisdiction !== b.jurisdiction) return a.jurisdiction < b.jurisdiction ? -1 : 1;
    return a.bloc < b.bloc ? -1 : a.bloc > b.bloc ? 1 : 0;
  });
  return gaps;
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

/** Rows returned in `largestUncovered` unless the caller asks for a different number. */
export const DEFAULT_LARGEST_UNCOVERED = 25;

export interface CoverageInput {
  /** The date the report is about. A parameter, because no package here reads a clock. */
  readonly asOf: IsoDate;
  /**
   * The assembled registry. Records with a repeated code are counted **once**:
   * a duplicate would inflate `totalJurisdictions` and double-count its status,
   * and a metric must not be quietly improvable by listing a country twice.
   * The duplicate itself is an integrity finding, not something this hides.
   */
  readonly jurisdictions: readonly Jurisdiction[];
  readonly stock: readonly CorridorStock[];
  /**
   * Total international migrants worldwide, the denominator of
   * `stockTableCompleteness`. `null` when it is not available — which yields
   * `null`, never 1.
   */
  readonly globalStock: number | null;
  readonly largestUncoveredLimit?: number;
}

/**
 * Compute the coverage report.
 *
 * Fractions are `0` when their denominator is `0`. That is a deliberate choice
 * over `NaN` (which formats as "NaN%" and gets patched downstream with a
 * fallback of 1) and over `1` (which would report an empty atlas as perfectly
 * covered — the green-by-vacuity failure applied to a metric). Zero of zero is
 * reported as zero, and `totalJurisdictions` sits next to it so a reader can see
 * that the denominator is empty.
 */
export function computeCoverage(input: CoverageInput): CoverageReport {
  const distinct = new Map<JurisdictionCode, Jurisdiction>();
  for (const jurisdiction of input.jurisdictions) {
    if (!distinct.has(jurisdiction.code)) distinct.set(jurisdiction.code, jurisdiction);
  }

  const byStatus: Record<ResearchStatus, number> = {
    stub: 0,
    researched: 0,
    encoded: 0,
    counsel_reviewed: 0,
  };
  const encodedCodes = new Set<JurisdictionCode>();
  for (const jurisdiction of distinct.values()) {
    byStatus[jurisdiction.researchStatus] += 1;
    if (isEncodedOrBetter(jurisdiction.researchStatus)) encodedCodes.add(jurisdiction.code);
  }

  const totalJurisdictions = distinct.size;
  const encodedCount = RESEARCH_STATUS_ORDER.filter(isEncodedOrBetter).reduce(
    (sum, status) => sum + byStatus[status],
    0,
  );
  const researchedCount = RESEARCH_STATUS_ORDER.filter(isResearchedOrBetter).reduce(
    (sum, status) => sum + byStatus[status],
    0,
  );

  let knownStock = 0;
  let coveredStock = 0;
  const uncovered: CorridorStock[] = [];
  for (const row of input.stock) {
    knownStock += row.stock;
    if (encodedCodes.has(row.origin) && encodedCodes.has(row.destination)) {
      coveredStock += row.stock;
    } else {
      uncovered.push(row);
    }
  }

  uncovered.sort((a, b) => {
    if (a.stock !== b.stock) return b.stock - a.stock;
    if (a.origin !== b.origin) return a.origin < b.origin ? -1 : 1;
    return a.destination < b.destination ? -1 : a.destination > b.destination ? 1 : 0;
  });

  const limit = input.largestUncoveredLimit ?? DEFAULT_LARGEST_UNCOVERED;

  return {
    asOf: input.asOf,
    structural: {
      byStatus,
      totalJurisdictions,
      encodedFraction: ratio(encodedCount, totalJurisdictions),
      researchedFraction: ratio(researchedCount, totalJurisdictions),
    },
    weighted: {
      knownStock,
      coveredStock,
      coveredFraction: ratio(coveredStock, knownStock),
      stockTableCompleteness:
        input.globalStock === null || !Number.isFinite(input.globalStock) || input.globalStock <= 0
          ? null
          : knownStock / input.globalStock,
    },
    largestUncovered: uncovered.slice(0, Math.max(0, limit)),
  };
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}
