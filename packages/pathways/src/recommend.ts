/**
 * The review gate.
 *
 * {@link evaluate} produces an assessment. This file produces a *ranking*, and
 * a ranking is a different kind of statement entirely: "these are your options,
 * best first" tells a person what to do. Under s.91 of Canada's Immigration and
 * Refugee Protection Act and Spain's reserved-activity rules for legal advice,
 * that is a regulated act. So everything here is born `advice` and two gates
 * apply.
 *
 * **Gate one: the catalog gate.** A pathway whose `reviewStatus` is not
 * `counsel_reviewed` never enters a ranking. It may still appear in an
 * assessment — restating a published rule and doing arithmetic against the
 * user's own record is not reserved anywhere Meridian operates — but
 * recommending a route that no licensed person has read is the exact failure
 * mode the whole disclosure system exists to prevent. The excluded pathways are
 * returned with a reason rather than silently dropped, because an empty list
 * with no explanation looks like a bug and gets "fixed".
 *
 * **Gate two: the release gate.** The returned value carries
 * `classification: 'advice'`, so `canRelease` from `@meridian/core` decides
 * whether it may reach a given audience and, when it may not, downgrades it.
 * {@link downgradeToAssessment} produces that downgraded form: the same
 * pathways, no order, no rationale, no recommendation language.
 *
 * Note what is deliberately absent. There is no score, no percentage, and no
 * estimate of the chance of success. A number like that is a prediction of
 * outcome, which is the most heavily regulated thing an unlicensed adviser can
 * say, and it would be fabricated besides — no authority publishes the data
 * that would make it true.
 */

import {
  canRelease,
  disclosable,
  type Disclosable,
  type IsoDate,
  type ReleaseContext,
  type ReleaseDecision,
} from '@meridian/core';
import { evaluate, type EligibilityReport, type Verdict } from './evaluate.js';
import type { ApplicantFacts } from './facts.js';
import { isCounselReviewed, statusOn, type Pathway } from './schema.js';

export interface Recommendation {
  readonly pathwayId: string;
  /** 1-based position. Ties are broken deterministically, never randomly. */
  readonly rank: number;
  readonly report: EligibilityReport;
  /** Why this pathway sits where it does. Advice-class language lives only here. */
  readonly rationale: string;
}

export interface ExcludedPathway {
  readonly pathwayId: string;
  readonly reason: string;
  readonly code: 'not_counsel_reviewed' | 'not_open' | 'ineligible';
}

export interface RecommendationSet {
  /** Counsel-reviewed pathways, best first. Empty is a legitimate and common answer. */
  readonly ranked: readonly Recommendation[];
  /** Pathways held out of the ranking, with the reason. */
  readonly excluded: readonly ExcludedPathway[];
  /**
   * Every pathway assessed, in catalog order and unranked — including the ones
   * excluded above. This is what survives a downgrade.
   */
  readonly assessments: readonly EligibilityReport[];
  readonly asOf: IsoDate;
}

export interface AssessmentSet {
  readonly assessments: readonly EligibilityReport[];
  readonly asOf: IsoDate;
}

/**
 * Ordering of verdicts for ranking purposes.
 *
 * `requires_human_review` sits above `ineligible` but below anything the engine
 * could actually decide: it means "a person needs to look", which is more
 * useful to surface than a definite no and less useful than a definite yes.
 */
const VERDICT_ORDER: Record<Verdict, number> = {
  eligible: 0,
  indeterminate: 1,
  requires_human_review: 2,
  ineligible: 3,
};

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

function rationaleFor(report: EligibilityReport): string {
  switch (report.verdict) {
    case 'eligible': {
      const blocking = report.criteria.filter((c) => c.weight === 'blocking').length;
      return `Meets all ${plural(blocking, 'blocking criterion', 'blocking criteria')} on the recorded facts.`;
    }
    case 'indeterminate': {
      const unresolved = `${plural(report.unknowns.length, 'criterion is', 'criteria are')} unresolved`;
      const unmet =
        report.materialFailures.length > 0
          ? ` and ${plural(report.materialFailures.length, 'criterion is', 'criteria are')} unmet`
          : '';
      return `Not decidable on the recorded facts: ${unresolved}${unmet}.`;
    }
    case 'requires_human_review':
      return `Requires review by a licensed representative: ${report.humanReviewCriterionIds.join(', ')}.`;
    case 'ineligible':
      return report.pathwayStatus !== 'open'
        ? 'Not open to new applications as at the assessment date.'
        : `Blocked by ${plural(report.blockingFailures.length, 'criterion', 'criteria')}: ${report.blockingFailures.join(', ')}.`;
  }
}

/**
 * Rank pathways for an applicant.
 *
 * The comparator, in order: verdict quality, then fewest unknowns, then fewest
 * blocking failures, then pathway id. That last tie-break is not cosmetic —
 * without it the same facts could produce different orders on different runs,
 * and a person comparing two sessions would have no way to tell whether the law
 * changed or the software did.
 */
export function recommend(
  facts: ApplicantFacts,
  catalog: readonly Pathway[],
  asOf: IsoDate,
): Disclosable<RecommendationSet> {
  const assessments = catalog.map((p) => evaluate(p, facts, asOf));
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const excluded: ExcludedPathway[] = [];
  const candidates: EligibilityReport[] = [];

  for (const report of assessments) {
    const pathway = byId.get(report.pathwayId);
    if (pathway === undefined) continue;

    if (!isCounselReviewed(pathway)) {
      excluded.push({
        pathwayId: pathway.id,
        code: 'not_counsel_reviewed',
        reason:
          `The rules for ${pathway.id} carry reviewStatus "${pathway.reviewStatus}". They may be shown as an ` +
          'assessment against the cited sources, but no recommendation may be built on rules that no licensed ' +
          'representative has signed off on.',
      });
      continue;
    }
    if (statusOn(pathway, asOf) !== 'open') {
      excluded.push({
        pathwayId: pathway.id,
        code: 'not_open',
        reason: `${pathway.id} was not open to new applications on ${asOf}.`,
      });
      continue;
    }
    if (report.verdict === 'ineligible') {
      excluded.push({
        pathwayId: pathway.id,
        code: 'ineligible',
        reason: `${pathway.id} is blocked on the recorded facts: ${report.blockingFailures.join(', ')}.`,
      });
      continue;
    }
    candidates.push(report);
  }

  const ordered = [...candidates].sort((a, b) => {
    const byVerdict = VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict];
    if (byVerdict !== 0) return byVerdict;
    const byUnknowns = a.unknowns.length - b.unknowns.length;
    if (byUnknowns !== 0) return byUnknowns;
    const byBlocking = a.blockingFailures.length - b.blockingFailures.length;
    if (byBlocking !== 0) return byBlocking;
    return a.pathwayId < b.pathwayId ? -1 : a.pathwayId > b.pathwayId ? 1 : 0;
  });

  const ranked: Recommendation[] = ordered.map((report, index) => ({
    pathwayId: report.pathwayId,
    rank: index + 1,
    report,
    rationale: rationaleFor(report),
  }));

  const citationIds = new Set<string>();
  for (const report of ranked.map((r) => r.report)) {
    for (const c of report.citations) citationIds.add(c.id);
  }

  return disclosable<RecommendationSet>(
    'advice',
    { ranked, excluded, assessments, asOf },
    [...citationIds].sort(),
  );
}

/**
 * The safe form of a recommendation: the same pathways as neutral assessments.
 *
 * Order follows the catalog, not the outcome. Nothing carries a rank, a
 * rationale, or an exclusion — an exclusion reason like "blocked on the
 * recorded facts" is fine, but "held out of the ranking" only makes sense if
 * there is a ranking, and there is not. What the reader keeps is every pathway,
 * every verdict, every citation and every piece of arithmetic; what they lose
 * is the opinion about which one to pursue.
 */
export function downgradeToAssessment(set: RecommendationSet): Disclosable<AssessmentSet> {
  const citationIds = new Set<string>();
  for (const report of set.assessments) {
    for (const c of report.citations) citationIds.add(c.id);
  }
  return disclosable<AssessmentSet>(
    'assessment',
    { assessments: set.assessments, asOf: set.asOf },
    [...citationIds].sort(),
  );
}

/** Produce the neutral assessment form directly, without building a ranking first. */
export function assess(
  facts: ApplicantFacts,
  catalog: readonly Pathway[],
  asOf: IsoDate,
): Disclosable<AssessmentSet> {
  const assessments = catalog.map((p) => evaluate(p, facts, asOf));
  const citationIds = new Set<string>();
  for (const report of assessments) for (const c of report.citations) citationIds.add(c.id);
  return disclosable<AssessmentSet>('assessment', { assessments, asOf }, [...citationIds].sort());
}

export type ReleasedRecommendation =
  | { readonly allowed: true; readonly value: Disclosable<RecommendationSet> }
  | {
      readonly allowed: false;
      readonly value: Disclosable<AssessmentSet>;
      readonly decision: ReleaseDecision;
    };

/**
 * Apply core's release gate and hand back whatever the audience is entitled to.
 *
 * The caller never chooses between the advice and the assessment form; the gate
 * does. That is the point — a render-time decision about whether something
 * "counts as advice" is a decision somebody will eventually get wrong under
 * deadline.
 */
export function releaseRecommendation(
  recommendation: Disclosable<RecommendationSet>,
  context: ReleaseContext,
): ReleasedRecommendation {
  const decision = canRelease(recommendation.classification, context);
  if (decision.allowed) return { allowed: true, value: recommendation };
  return { allowed: false, value: downgradeToAssessment(recommendation.value), decision };
}
