/**
 * `@meridian/atlas` — the map of the whole migration problem, so we can measure
 * how much of it we have actually solved.
 *
 * The catalog covers two destination systems. This package is what tells us what
 * two is a fraction *of*, and it is deliberately built so that the answer cannot
 * be improved by looking away.
 *
 * ## What `ALL_JURISDICTIONS` is, and what it is not
 *
 * It is every place the five region files list that has, or plausibly has, its
 * own immigration control, keyed by ISO 3166-1 alpha-2. It is **not** a count of
 * immigration systems in the world, and quoting it as one would misstate the
 * denominator in both directions:
 *
 * - It **includes** places with no permanent population and no residence route —
 *   Bouvet Island, Heard and McDonald, the French Southern Territories, the US
 *   Minor Outlying Islands. They are present so a consumer can exclude them
 *   explicitly; a place that is absent cannot be excluded, it can only be
 *   forgotten. They permanently depress structural coverage.
 * - It **excludes** authorities that control entry to territory but have no ISO
 *   alpha-2 code: Somaliland, Northern Cyprus, Abkhazia, South Ossetia, the UK
 *   Sovereign Base Areas, Transnistria, Mount Athos. Each is recorded as a note
 *   on the nearest coded entry rather than given an invented code, because a
 *   fabricated key in a standard-keyed registry propagates into every corridor
 *   derived from it. The atlas therefore understates the number of
 *   entry-controlling authorities by roughly seven.
 * - Three codes hide more than one control each. `SH` covers Saint Helena,
 *   Ascension and Tristan da Cunha, which run separate systems. `SO` speaks only
 *   to the federal Somali system. `ES` carries Ceuta and Melilla, whose border
 *   regime is distinct.
 *
 * ## Known defects, today
 *
 * `ATLAS_INTEGRITY` is computed at load and is **not empty**. It is exported
 * rather than suppressed because a denominator with a known fault is still
 * usable, and a denominator with a hidden one is not:
 *
 * - `AM`, `AZ`, `GE`, `TR` are supplied by both `regions/asia.ts` and
 *   `regions/europe.ts`. Both agents included the transcontinental cases
 *   deliberately, reasoning that a duplicate is loud and an omission is silent.
 *   Merging keeps the Asia record — first-wins, in registry order — and neither
 *   dropped record carries research the kept one lacks. The fix is for one file
 *   to drop the entry; deduplication here is a repair.
 * - Six Middle African jurisdictions cite bloc `cemac`, which the bloc registry
 *   does not carry. Those corridors derive today with no CEMAC effect.
 * - `CO`, `EC` and `PE` claim `mercosur-residence`; the bloc registry lists six
 *   members and not those three, because their accession dates could not be
 *   verified. The two records disagree and corridor derivation follows the
 *   registry, so those corridors understate the rights that exist.
 *
 * `blocCrossReferenceGaps` reports the opposite direction — memberships the bloc
 * registry records that a jurisdiction entry does not mention — which is a
 * documentation gap rather than a defect, since derivation reads the registry.
 * It is large, mostly stub EU and EEA states, and is reported separately so it
 * cannot bury the errors.
 *
 * @see ./types.ts for why the atlas is destination-first rather than a list of
 * forty thousand ordered country pairs.
 */

import { MOBILITY_BLOCS } from './blocs.js';
import { AFRICA_JURISDICTIONS } from './regions/africa.js';
import { AMERICAS_JURISDICTIONS } from './regions/americas.js';
import { ASIA_JURISDICTIONS } from './regions/asia.js';
import { EUROPE_JURISDICTIONS } from './regions/europe.js';
import { OCEANIA_JURISDICTIONS } from './regions/oceania.js';
import { CORRIDOR_STOCK } from './stock.js';
import { mergeJurisdictionRegistries } from './corridor.js';
import type { Atlas, JurisdictionCollision, JurisdictionRegistry } from './corridor.js';
import { checkAtlasIntegrity } from './coverage.js';
import type { IntegrityFinding } from './coverage.js';
import type { Jurisdiction } from './types.js';

export * from './types.js';
export * from './corridor.js';
export * from './coverage.js';
export { MOBILITY_BLOCS } from './blocs.js';
export * from './stock.js';
export { AFRICA_JURISDICTIONS } from './regions/africa.js';
export { AMERICAS_JURISDICTIONS } from './regions/americas.js';
export { ASIA_JURISDICTIONS } from './regions/asia.js';
export { EUROPE_JURISDICTIONS } from './regions/europe.js';
export { OCEANIA_JURISDICTIONS } from './regions/oceania.js';

/**
 * The region files, unmerged and labelled.
 *
 * The order is the merge order, and therefore decides which record survives a
 * duplicate code. It is alphabetical, which is the point: an ordering with no
 * relationship to research depth cannot be accused of having been chosen to
 * improve the number.
 */
export const JURISDICTION_REGISTRIES: readonly JurisdictionRegistry[] = [
  { source: 'regions/africa.ts', jurisdictions: AFRICA_JURISDICTIONS },
  { source: 'regions/americas.ts', jurisdictions: AMERICAS_JURISDICTIONS },
  { source: 'regions/asia.ts', jurisdictions: ASIA_JURISDICTIONS },
  { source: 'regions/europe.ts', jurisdictions: EUROPE_JURISDICTIONS },
  { source: 'regions/oceania.ts', jurisdictions: OCEANIA_JURISDICTIONS },
];

const MERGED = mergeJurisdictionRegistries(JURISDICTION_REGISTRIES);

/** Every jurisdiction in the atlas, deduplicated. The denominator. */
export const ALL_JURISDICTIONS: readonly Jurisdiction[] = MERGED.jurisdictions;

/** Codes supplied by more than one region file. Empty is the only correct value. */
export const JURISDICTION_CODE_COLLISIONS: readonly JurisdictionCollision[] = MERGED.collisions;

/** The assembled atlas: jurisdictions plus the agreements that modify corridors. */
export const ATLAS: Atlas = { jurisdictions: ALL_JURISDICTIONS, blocs: MOBILITY_BLOCS };

/**
 * Integrity findings for the atlas as shipped, computed at load.
 *
 * Not empty today. See the module doc above for what is in it and why each entry
 * is reported rather than repaired in place.
 */
export const ATLAS_INTEGRITY: readonly IntegrityFinding[] = checkAtlasIntegrity({
  registries: JURISDICTION_REGISTRIES,
  blocs: MOBILITY_BLOCS,
  stock: CORRIDOR_STOCK,
});
