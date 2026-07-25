/**
 * The claims this site makes about itself, counted rather than written down.
 *
 * A marketing page is the one place in a codebase where a number has no
 * compiler, no test and no reviewer standing behind it, so the numbers here are
 * derived from the same catalog the engine evaluates. If a pathway is added,
 * this page says so on the next build. If counsel signs one off, the "reviewed"
 * figure moves on its own, and the sentence explaining why nothing can be
 * recommended stops applying without anybody remembering to edit copy.
 *
 * **One fixed date, not a clock.** Every figure is computed as at {@link AS_OF}.
 * `@meridian/core` deliberately provides no "today": a reference date is a
 * parameter everywhere, because `new Date('2026-07-25')` is midnight UTC, which
 * is 2026-07-24 in Mexico City, and a page that answered a day-count question
 * from the wall clock would give two readers different answers. Citation
 * freshness is a day-count question like any other. There is no `Date` anywhere
 * in this application.
 */

import { isoDate, staleness } from '@meridian/core';
import type { Citation, IsoDate } from '@meridian/core';
import { MERIDIAN_PATHWAY_CATALOG, isCounselReviewed, statusOn } from '@meridian/pathways';

/** The civil date every figure on this site is computed as at. */
export const AS_OF: IsoDate = isoDate('2026-07-25');

const catalog = MERIDIAN_PATHWAY_CATALOG;

/**
 * Citations deduplicated by id. A source cited by three pathways is one source;
 * counting it three times would inflate the only figure on this page that
 * describes how well evidenced the catalog is.
 */
const uniqueCitations: readonly Citation[] = [
  ...new Map(catalog.flatMap((p) => p.citations).map((c) => [c.id, c])).values(),
];

export interface JurisdictionCount {
  readonly code: string;
  readonly pathways: number;
}

export interface CatalogFacts {
  readonly asOf: IsoDate;
  readonly pathways: number;
  /** Pathways a licensed person has read and attached their name to. */
  readonly counselReviewed: number;
  /** Accepting applications on {@link AS_OF}. A closed route stays in the catalog. */
  readonly open: number;
  readonly criteria: number;
  readonly jurisdictions: readonly JurisdictionCount[];
  readonly citations: number;
  /** Cited rules that are administrative practice rather than a statutory threshold. */
  readonly discretionaryCitations: number;
  /** Citations carrying a URL we are confident is canonical. */
  readonly citationsWithUrl: number;
  /** Citations no longer inside the freshest verification band on {@link AS_OF}. */
  readonly agingCitations: number;
}

export const CATALOG: CatalogFacts = {
  asOf: AS_OF,
  pathways: catalog.length,
  counselReviewed: catalog.filter(isCounselReviewed).length,
  open: catalog.filter((p) => statusOn(p, AS_OF) === 'open').length,
  criteria: catalog.reduce((sum, p) => sum + p.criteria.length, 0),
  jurisdictions: [...new Set(catalog.map((p) => p.jurisdiction))]
    .sort()
    .map((code) => ({
      code,
      pathways: catalog.filter((p) => p.jurisdiction === code).length,
    })),
  citations: uniqueCitations.length,
  discretionaryCitations: uniqueCitations.filter((c) => c.discretionary === true).length,
  citationsWithUrl: uniqueCitations.filter((c) => typeof c.url === 'string').length,
  agingCitations: uniqueCitations.filter((c) => staleness(c, AS_OF) !== 'fresh').length,
};

/**
 * True while no pathway has been signed off.
 *
 * This is the switch behind the status section. It is not a feature flag: when
 * it goes false it will be because a named lawyer read a record and their name
 * went on it, and the page should stop saying that every advice-class output is
 * blocked, because it will no longer be true for that record.
 */
export const NOTHING_IS_COUNSEL_REVIEWED: boolean = CATALOG.counselReviewed === 0;

/** Pathways in one jurisdiction, for the corridor cards. */
export function pathwaysIn(code: string): number {
  return catalog.filter((p) => p.jurisdiction === code).length;
}
