/**
 * The shipped catalog.
 *
 * Two jurisdictions, nine source modules. Every record here is
 * `reviewStatus: 'unreviewed'`. Nothing in this catalog is eligible to appear
 * in an advice-class recommendation until a licensed person has read it and
 * their name is on the record.
 *
 * ## Why the order is what it is
 *
 * The order of {@link MERIDIAN_PATHWAY_CATALOG} is fixed at module load and
 * derived from exactly one thing: the position of a pathway inside
 * {@link MERIDIAN_CATALOG_MODULES}, and its position inside its own module's
 * array. Two properties follow, and both are load-bearing.
 *
 * **It cannot vary with the applicant.** A list whose order changed with
 * somebody's facts would be a ranking, and a ranking is advice — see
 * `recommend.ts`, which is the only thing in this package allowed to produce
 * one, and only from counsel-reviewed records. `evaluateAll` and `assess`
 * return reports in this order, so the order has to mean nothing about merit,
 * likelihood or priority. A concatenation of source files manifestly does not.
 *
 * **It is append-stable.** Modules are listed in the order they were added and
 * new ones go on the end of their jurisdiction's block; new pathways go on the
 * end of their module's array. Adding a route therefore never renumbers an
 * existing one, so a person comparing two sessions months apart sees the same
 * routes in the same places and can tell that something was *added* rather
 * than that everything moved.
 *
 * Sorting by id was the obvious alternative and was rejected for the second
 * property: alphabetical order re-shuffles the whole catalog every time a slug
 * is chosen, which turns an editorial decision about a name into a change in
 * what every reader sees first. Sorting by anything substantive — kind, status,
 * how many criteria a route has — would be worse still, because each of those
 * is a claim about importance.
 *
 * Jurisdiction blocks stay in the order the catalog originally shipped in (ES,
 * then CA) for the same reason.
 */

import type { Pathway } from '../schema.js';
import { CA_PATHWAYS } from './ca.js';
import { CA_FAMILY_PILOTS_PATHWAYS } from './ca-family-pilots.js';
import { CA_FEDERAL_ECONOMIC_PATHWAYS } from './ca-federal-economic.js';
import { CA_PROVINCIAL_QUEBEC_PATHWAYS } from './ca-provincial-quebec.js';
import { CA_WORK_STUDY_PATHWAYS } from './ca-work-study.js';
import { ES_PATHWAYS } from './es.js';
import { ES_ARRAIGO_PATHWAYS } from './es-arraigo.js';
import { ES_FAMILY_NATIONALITY_PATHWAYS } from './es-family-nationality.js';
import { ES_WORK_STUDY_PATHWAYS } from './es-work-study.js';

export * from './cusma-professions.js';
export * from './ca.js';
export * from './ca-family-pilots.js';
export * from './ca-federal-economic.js';
export * from './ca-provincial-quebec.js';
export * from './ca-work-study.js';
export * from './es.js';
export * from './es-arraigo.js';
export * from './es-family-nationality.js';
export * from './es-work-study.js';

/**
 * One source file's worth of pathways.
 *
 * `source` is the file the records are declared in, without the extension. It
 * exists so a linter or a failing test can name the file somebody has to open,
 * rather than making a reader grep 49 ids to find out where one lives.
 */
export interface CatalogModule {
  readonly source: string;
  readonly pathways: readonly Pathway[];
}

/**
 * The shipped catalog: nine module arrays, spread in the documented order.
 *
 * Written out as a literal spread rather than flattened from
 * {@link MERIDIAN_CATALOG_MODULES}, because `scripts/check-pathway-citations.mjs`
 * reads this file as *text*. That guard runs on plain `node` with nothing
 * installed — which is why it runs on every push and never gets skipped — and
 * it anchors itself on this array to prove that the pathways it parsed are the
 * pathways that actually ship. A computed catalog would leave it with nothing
 * to follow, and a policy check that cannot see the shipped set is a policy
 * check that passes by examining nothing.
 *
 * The two declarations are kept in step by `tests/catalog-index.test.ts`, which
 * asserts this array equals the concatenation of the module list, module by
 * module and in order.
 */
export const MERIDIAN_PATHWAY_CATALOG: readonly Pathway[] = [
  ...ES_PATHWAYS,
  ...ES_ARRAIGO_PATHWAYS,
  ...ES_WORK_STUDY_PATHWAYS,
  ...ES_FAMILY_NATIONALITY_PATHWAYS,
  ...CA_PATHWAYS,
  ...CA_FEDERAL_ECONOMIC_PATHWAYS,
  ...CA_PROVINCIAL_QUEBEC_PATHWAYS,
  ...CA_WORK_STUDY_PATHWAYS,
  ...CA_FAMILY_PILOTS_PATHWAYS,
];

/**
 * The same nine modules, each paired with the file it lives in.
 *
 * This list *is* the ordering decision documented at the top of this file, in a
 * form code can read: it is what `catalogSourceOf` answers from and what the
 * tests measure the shipped array against. Reordering it without reordering the
 * spread above fails those tests rather than silently disagreeing.
 */
export const MERIDIAN_CATALOG_MODULES: readonly CatalogModule[] = [
  { source: 'es', pathways: ES_PATHWAYS },
  { source: 'es-arraigo', pathways: ES_ARRAIGO_PATHWAYS },
  { source: 'es-work-study', pathways: ES_WORK_STUDY_PATHWAYS },
  { source: 'es-family-nationality', pathways: ES_FAMILY_NATIONALITY_PATHWAYS },
  { source: 'ca', pathways: CA_PATHWAYS },
  { source: 'ca-federal-economic', pathways: CA_FEDERAL_ECONOMIC_PATHWAYS },
  { source: 'ca-provincial-quebec', pathways: CA_PROVINCIAL_QUEBEC_PATHWAYS },
  { source: 'ca-work-study', pathways: CA_WORK_STUDY_PATHWAYS },
  { source: 'ca-family-pilots', pathways: CA_FAMILY_PILOTS_PATHWAYS },
];

const BY_ID = new Map(MERIDIAN_PATHWAY_CATALOG.map((p) => [p.id, p]));

/** `null` rather than a throw: an unknown id is an expected input, not a fault. */
export function pathwayById(id: string): Pathway | null {
  return BY_ID.get(id) ?? null;
}

/** Every pathway for one jurisdiction, in catalog order. */
export function pathwaysForJurisdiction(jurisdiction: string): Pathway[] {
  const target = jurisdiction.toUpperCase();
  return MERIDIAN_PATHWAY_CATALOG.filter((p) => p.jurisdiction.toUpperCase() === target);
}

/**
 * Which source file a pathway is declared in, or `null` for an unknown id.
 *
 * The catalog is nine files and growing. When an integrity check names a
 * pathway, the next question is always "where do I edit that", and answering it
 * from data beats answering it from memory.
 */
export function catalogSourceOf(id: string): string | null {
  for (const module of MERIDIAN_CATALOG_MODULES) {
    if (module.pathways.some((p) => p.id === id)) return module.source;
  }
  return null;
}
