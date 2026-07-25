/**
 * Legal provenance.
 *
 * Every rule Meridian applies to a human being must be traceable to a named
 * instrument. This is not documentation garnish — it is the mechanism that
 * stops the platform from asserting law it cannot source, and the reason a
 * `Citation` is a *required* field on every requirement, threshold, and
 * eligibility rule in the pathway catalog rather than an optional annotation.
 *
 * `verifiedOn` is when a human last checked the cited text against the source.
 * Immigration law changes without notice — Spain repealed the investor-residency
 * route with roughly three months' warning — so a stale citation is a defect,
 * and `staleness()` exists so CI and the admin console can say so out loud.
 */

import type { IsoDate } from './civil-date.js';
import { diffDays } from './civil-date.js';

/** What kind of instrument a rule rests on. Ranked roughly by authority. */
export type SourceKind =
  /** Constitution, treaty, or international convention. */
  | 'treaty'
  /** Primary legislation — statute, code, organic law. */
  | 'statute'
  /** Secondary legislation — regulation, royal decree, order in council. */
  | 'regulation'
  /** Binding administrative instruction or published policy manual. */
  | 'policy'
  /** Court or tribunal decision. */
  | 'case_law'
  /** A government body's own published guidance or web page. */
  | 'official_guidance'
  /** Published government statistics. */
  | 'statistics'
  /** Anything else — practitioner commentary, press. Never sufficient on its own. */
  | 'secondary';

export interface Citation {
  /** Stable slug, e.g. `es-cc-art-22`. Unique within the catalog. */
  readonly id: string;
  readonly kind: SourceKind;
  /** Instrument name as it is actually cited, e.g. "Código Civil (España), Artículo 22". */
  readonly instrument: string;
  /** The specific provision, e.g. "art. 22.1" or "Appendix 2 to Annex 16-A". */
  readonly provision?: string;
  /** Canonical URL for the text. Prefer the official gazette over a summary. */
  readonly url?: string;
  /** ISO 3166-1 alpha-2 of the issuing jurisdiction, or a bloc code. */
  readonly jurisdiction: string;
  /** When a human last verified this citation against its source. */
  readonly verifiedOn: IsoDate;
  /**
   * Set when the cited rule is administrative practice or discretionary
   * criteria rather than a bright-line statutory threshold. Consumers must
   * surface this to the user instead of presenting the number as settled law.
   */
  readonly discretionary?: boolean;
  /** Free-text caveat shown alongside any output that depends on this citation. */
  readonly note?: string;
}

/** How many days old a citation's verification is, relative to `asOf`. */
export function citationAgeDays(citation: Citation, asOf: IsoDate): number {
  return diffDays(citation.verifiedOn, asOf);
}

export type Staleness = 'fresh' | 'aging' | 'stale';

/**
 * Freshness bands. Immigration rules move fast enough that a citation nobody
 * has looked at in half a year should not be silently trusted.
 *
 * - `fresh`  — verified within 90 days
 * - `aging`  — 91-180 days; usable, flagged in the admin console
 * - `stale`  — over 180 days; CI fails and dependent rules must be re-verified
 */
export function staleness(citation: Citation, asOf: IsoDate): Staleness {
  const age = citationAgeDays(citation, asOf);
  if (age <= 90) return 'fresh';
  if (age <= 180) return 'aging';
  return 'stale';
}

/** True when a citation carries enough identity to be checked by a human. */
export function isCitationWellFormed(citation: Citation): boolean {
  return (
    citation.id.trim().length > 0 &&
    citation.instrument.trim().length > 0 &&
    citation.jurisdiction.trim().length > 0
  );
}
