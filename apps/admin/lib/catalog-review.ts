/**
 * The review queue.
 *
 * This is the narrowest point in the whole product. `recommend()` in
 * `@meridian/pathways` refuses to rank a pathway that is not
 * `counsel_reviewed`, and every record in the shipped catalog is `unreviewed` —
 * so today the engine ranks nothing at all. That is the correct live state, not
 * a placeholder, and this queue is the only thing that changes it.
 *
 * Which makes the design question here a narrow one: what does a reviewer need
 * in front of them to sign a record off, and what would let them sign one off
 * they should not have?
 *
 * What they need is the encoded rule (see `spec-language.ts`), the provenance
 * with its age, and every integrity failure the linter already knows about.
 * What would let them sign off wrongly is a screen that shows a green tick
 * derived from anything other than those three things. So there is no summary
 * score here, no completeness percentage, and no ordering by "readiness" — the
 * queue is ordered by how much of the live caseload is resting on the record,
 * which is a fact about the firm rather than a judgement about the law.
 *
 * `previewSignOff` is the other half. It does not record a review — this console
 * has no write path into the catalog, which is compiled TypeScript inside
 * `@meridian/pathways` — but it does something more useful than a button that
 * lies: it constructs the record a sign-off *would* produce, runs the real
 * `validateCatalog` over the resulting catalog, and reports whether the sign-off
 * would be accepted. A reviewer finds out that their signature would trip
 * `counsel_review_stale` before they go and write it into a pull request.
 */

import {
  citationAgeDays,
  staleness,
  type Citation,
  type IsoDate,
  type Staleness,
} from '@meridian/core';
import {
  isCounselReviewed,
  notYetOpenOn,
  statusOn,
  validateCatalog,
  type CatalogValidation,
  type CriterionWeight,
  type IntegrityIssue,
  type Pathway,
  type PathwayStatus,
} from '@meridian/pathways';
import type { MatterRecord } from '@/lib/records';

export interface CitationStanding {
  readonly citation: Citation;
  readonly band: Staleness;
  readonly ageDays: number;
  /** Cited by at least one criterion or by the durations block. */
  readonly referenced: boolean;
}

export interface CriterionCounts {
  readonly blocking: number;
  readonly material: number;
  readonly informational: number;
}

export interface PathwayReview {
  readonly pathway: Pathway;
  /** Status *as at* the reference date, which can differ from the stored status. */
  readonly statusAsOf: PathwayStatus;
  readonly notYetOpen: boolean;
  readonly reviewed: boolean;
  readonly citations: readonly CitationStanding[];
  /** The worst band across the record's citations. Drives the queue's alert level. */
  readonly worstBand: Staleness;
  /**
   * Age of the least recently verified citation. Not floored at zero: asked
   * about a date before the citation was verified the age is genuinely negative,
   * and clamping it would render a record as freshly checked on a date when
   * nobody had checked it yet.
   */
  readonly oldestCitationAgeDays: number;
  readonly staleCount: number;
  readonly agingCount: number;
  readonly counts: CriterionCounts;
  /** Criteria that can never be decided by software, conditionally or otherwise. */
  readonly escalatingCriterionIds: readonly string[];
  readonly issues: readonly IntegrityIssue[];
  readonly errorCount: number;
  readonly warningCount: number;
  /** Live matters in this firm's caseload resting on the record. */
  readonly liveMatters: readonly MatterRecord[];
}

function referencedCitationIds(pathway: Pathway): Set<string> {
  const ids = new Set<string>(pathway.durations.citationIds);
  for (const criterion of pathway.criteria) {
    for (const id of criterion.citationIds) ids.add(id);
  }
  return ids;
}

function worstOf(bands: readonly Staleness[]): Staleness {
  if (bands.includes('stale')) return 'stale';
  if (bands.includes('aging')) return 'aging';
  return 'fresh';
}

function countWeights(pathway: Pathway): CriterionCounts {
  const counts: Record<CriterionWeight, number> = { blocking: 0, material: 0, informational: 0 };
  for (const criterion of pathway.criteria) counts[criterion.weight] += 1;
  return counts;
}

/**
 * The queue.
 *
 * `validateCatalog` is run once over the whole catalog rather than per record,
 * because some of its checks are cross-record — a `leadsTo` naming a pathway
 * that is not in the catalog cannot be found by looking at one record alone.
 */
export function reviewQueue(
  catalog: readonly Pathway[],
  matters: readonly MatterRecord[],
  asOf: IsoDate,
): { readonly validation: CatalogValidation; readonly reviews: readonly PathwayReview[] } {
  const validation = validateCatalog(catalog, asOf);

  const reviews = catalog.map((pathway): PathwayReview => {
    const referenced = referencedCitationIds(pathway);
    const citations = pathway.citations.map((citation): CitationStanding => ({
      citation,
      band: staleness(citation, asOf),
      ageDays: citationAgeDays(citation, asOf),
      referenced: referenced.has(citation.id),
    }));
    const issues = validation.issues.filter((i) => i.pathwayId === pathway.id);
    const escalating = pathway.criteria
      .filter((c) => c.requiresHumanReview === true || c.humanReviewWhen !== undefined)
      .map((c) => c.id);

    return {
      pathway,
      statusAsOf: statusOn(pathway, asOf),
      notYetOpen: notYetOpenOn(pathway, asOf),
      reviewed: isCounselReviewed(pathway),
      citations,
      worstBand: worstOf(citations.map((c) => c.band)),
      oldestCitationAgeDays: citations.reduce(
        (oldest, c) => (c.ageDays > oldest ? c.ageDays : oldest),
        citations[0]?.ageDays ?? 0,
      ),
      staleCount: citations.filter((c) => c.band === 'stale').length,
      agingCount: citations.filter((c) => c.band === 'aging').length,
      counts: countWeights(pathway),
      escalatingCriterionIds: escalating,
      issues,
      errorCount: issues.filter((i) => i.severity === 'error').length,
      warningCount: issues.filter((i) => i.severity === 'warning').length,
      liveMatters: matters.filter((m) => m.matter.pathwayId === pathway.id),
    };
  });

  return { validation, reviews };
}

/**
 * Queue order: unreviewed records carrying the most live work first.
 *
 * Deliberately *not* ordered by how ready a record looks. Sorting by readiness
 * would put the easy ones on top and quietly bury the record that eight live
 * files depend on, which is the opposite of what a bottleneck queue is for.
 */
export function orderQueue(reviews: readonly PathwayReview[]): PathwayReview[] {
  return [...reviews].sort((a, b) => {
    if (a.reviewed !== b.reviewed) return a.reviewed ? 1 : -1;
    if (a.liveMatters.length !== b.liveMatters.length) {
      return b.liveMatters.length - a.liveMatters.length;
    }
    if (a.errorCount !== b.errorCount) return b.errorCount - a.errorCount;
    return a.pathway.id < b.pathway.id ? -1 : a.pathway.id > b.pathway.id ? 1 : 0;
  });
}

export interface QueueTotals {
  readonly pathways: number;
  readonly reviewed: number;
  readonly unreviewed: number;
  readonly needsReverification: number;
  readonly withStaleCitations: number;
  readonly withErrors: number;
  readonly citations: number;
  readonly staleCitations: number;
  readonly agingCitations: number;
  readonly discretionaryCitations: number;
}

export function queueTotals(reviews: readonly PathwayReview[]): QueueTotals {
  const citations = reviews.flatMap((r) => r.citations);
  return {
    pathways: reviews.length,
    reviewed: reviews.filter((r) => r.reviewed).length,
    unreviewed: reviews.filter((r) => r.pathway.reviewStatus === 'unreviewed').length,
    needsReverification: reviews.filter((r) => r.pathway.reviewStatus === 'needs_reverification')
      .length,
    withStaleCitations: reviews.filter((r) => r.staleCount > 0).length,
    withErrors: reviews.filter((r) => r.errorCount > 0).length,
    citations: citations.length,
    staleCitations: citations.filter((c) => c.band === 'stale').length,
    agingCitations: citations.filter((c) => c.band === 'aging').length,
    discretionaryCitations: citations.filter((c) => c.citation.discretionary === true).length,
  };
}

/* -------------------------------------------------------------------------- */
/* Sign-off preview                                                           */
/* -------------------------------------------------------------------------- */

export interface SignOffCheck {
  readonly id: string;
  readonly label: string;
  readonly met: boolean | null;
  readonly detail: string;
}

export interface SignOffPreview {
  readonly pathwayId: string;
  readonly reviewedBy: string | null;
  readonly reviewedOn: IsoDate;
  readonly checks: readonly SignOffCheck[];
  /** True when every check that can be evaluated is met. `null` checks block it. */
  readonly wouldBeAccepted: boolean;
  /**
   * The exact field changes a sign-off writes. Rendered so the reviewer can see
   * what their signature would put in the record, and so the change can be
   * transcribed into the catalog source by hand.
   */
  readonly patch: Readonly<Record<string, string>> | null;
  /** Errors the candidate catalog would raise. Empty when it validates. */
  readonly candidateErrors: readonly IntegrityIssue[];
}

/**
 * Construct the record a sign-off would produce and validate the whole catalog
 * with it in place.
 *
 * The candidate goes through `validateCatalog` — the same function CI runs —
 * rather than a re-implementation of its rules. That matters for one check in
 * particular: `counsel_review_stale` fires when a record marked
 * `counsel_reviewed` rests on a stale citation, and it is precisely the check a
 * hand-rolled readiness screen would forget.
 */
export function previewSignOff(
  catalog: readonly Pathway[],
  pathway: Pathway,
  reviewedBy: string | null,
  asOf: IsoDate,
): SignOffPreview {
  const trimmed = reviewedBy?.trim() ?? '';
  const reviewer = trimmed.length > 0 ? trimmed : null;

  const checks: SignOffCheck[] = [];

  checks.push({
    id: 'not_already_reviewed',
    label: 'Record is not already signed off',
    met: !isCounselReviewed(pathway),
    detail: isCounselReviewed(pathway)
      ? `Already counsel_reviewed by ${pathway.reviewedBy ?? 'an unnamed reviewer'} on ${pathway.reviewedOn ?? 'an unrecorded date'}.`
      : `Current review status is ${pathway.reviewStatus}.`,
  });

  checks.push({
    id: 'reviewer_named',
    label: 'A named reviewer is attached',
    met: reviewer !== null,
    detail:
      reviewer !== null
        ? `Sign-off would be attributed to ${reviewer}.`
        : 'The schema rejects counsel_reviewed without both reviewedBy and reviewedOn — an '
          + 'unattributed review is not a review.',
  });

  const staleCitations = pathway.citations.filter((c) => staleness(c, asOf) === 'stale');
  checks.push({
    id: 'no_stale_citations',
    label: 'No citation is stale',
    met: staleCitations.length === 0,
    detail:
      staleCitations.length === 0
        ? `All ${pathway.citations.length} citations were verified within the last 180 days as at ${asOf}.`
        : `${staleCitations.map((c) => c.id).join(', ')} must be re-read against the source first.`,
  });

  const currentErrors = validateCatalog(catalog, asOf).issues.filter(
    (i) => i.severity === 'error' && i.pathwayId === pathway.id,
  );
  checks.push({
    id: 'no_integrity_errors',
    label: 'Record passes the catalog linter today',
    met: currentErrors.length === 0,
    detail:
      currentErrors.length === 0
        ? 'No error-severity integrity issues against this record.'
        : `${currentErrors.length} error-severity ${currentErrors.length === 1 ? 'issue' : 'issues'} must be cleared first.`,
  });

  let candidateErrors: IntegrityIssue[] = [];
  if (reviewer === null) {
    checks.push({
      id: 'candidate_validates',
      label: 'Signed-off record would validate',
      met: null,
      detail: 'Cannot be evaluated until a reviewer is named.',
    });
  } else {
    const candidate: Pathway = {
      ...pathway,
      reviewStatus: 'counsel_reviewed',
      reviewedBy: reviewer,
      reviewedOn: asOf,
    };
    const candidateCatalog = catalog.map((p) => (p.id === pathway.id ? candidate : p));
    candidateErrors = validateCatalog(candidateCatalog, asOf).issues.filter(
      (i) => i.severity === 'error' && i.pathwayId === pathway.id,
    );
    checks.push({
      id: 'candidate_validates',
      label: 'Signed-off record would validate',
      met: candidateErrors.length === 0,
      detail:
        candidateErrors.length === 0
          ? 'The catalog validates with this record marked counsel_reviewed.'
          : candidateErrors.map((i) => `${i.code}: ${i.message}`).join(' · '),
    });
  }

  const wouldBeAccepted = checks.every((c) => c.met === true);

  return {
    pathwayId: pathway.id,
    reviewedBy: reviewer,
    reviewedOn: asOf,
    checks,
    wouldBeAccepted,
    patch:
      reviewer === null
        ? null
        : { reviewStatus: 'counsel_reviewed', reviewedBy: reviewer, reviewedOn: asOf },
    candidateErrors,
  };
}

/**
 * Citations across the catalog that are due or overdue for re-verification,
 * worst first.
 *
 * A citation appears once per pathway that declares it, because that is how the
 * catalog stores it — the same instrument cited by two records is two records to
 * re-verify, and collapsing them would understate the work.
 */
export interface ReverificationItem {
  readonly pathwayId: string;
  readonly standing: CitationStanding;
}

export function reverificationQueue(reviews: readonly PathwayReview[]): ReverificationItem[] {
  const out: ReverificationItem[] = [];
  for (const review of reviews) {
    for (const standing of review.citations) {
      if (standing.band === 'fresh') continue;
      out.push({ pathwayId: review.pathway.id, standing });
    }
  }
  return out.sort((a, b) => {
    if (a.standing.ageDays !== b.standing.ageDays) return b.standing.ageDays - a.standing.ageDays;
    return a.pathwayId < b.pathwayId ? -1 : a.pathwayId > b.pathwayId ? 1 : 0;
  });
}
