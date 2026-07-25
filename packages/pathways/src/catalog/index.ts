/**
 * The shipped catalog.
 *
 * Two jurisdictions today. The order of this array is the order assessments are
 * returned in, and it is stable on purpose: a list whose order changed with the
 * applicant's facts would be a ranking, and ranking is advice.
 *
 * Every record here is `reviewStatus: 'unreviewed'`. Nothing in this catalog is
 * eligible to appear in an advice-class recommendation until a licensed person
 * has read it and their name is on the record.
 */

import type { Pathway } from '../schema.js';
import { CA_PATHWAYS } from './ca.js';
import { ES_PATHWAYS } from './es.js';

export * from './cusma-professions.js';
export * from './ca.js';
export * from './es.js';

export const MERIDIAN_PATHWAY_CATALOG: readonly Pathway[] = [...ES_PATHWAYS, ...CA_PATHWAYS];

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
