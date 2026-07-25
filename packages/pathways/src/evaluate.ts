/**
 * The evaluator.
 *
 * Generic over the catalog by construction: this file contains no country
 * names, no thresholds, and no legal knowledge whatsoever. It interprets
 * {@link EvaluatorSpec} against {@link EvaluationScope} and combines the
 * results into a verdict. Adding Portugal means adding a record in
 * `src/catalog/`, not editing anything here.
 *
 * **Three-valued, not boolean.** Every spec resolves to `true`, `false`, or
 * `unknown`, combined with Kleene's strong three-valued logic: a conjunction is
 * false as soon as one conjunct is false, but it is *unknown* — never false —
 * while a conjunct is merely unrecorded. This asymmetry is the entire safety
 * property. An engine that treated absence as failure would tell a half-way
 * through onboarding applicant that they are ineligible for a route they
 * qualify for, and people act on that.
 *
 * **The output is an `assessment`, never `advice`.** A report states the
 * applicant's own figures against a cited rule and shows the arithmetic. It
 * ranks nothing and recommends nothing. The moment you want ordering, you are
 * in {@link import('./recommend.js').recommend} and under the review gate.
 */

import {
  addDays,
  addMonths,
  addYears,
  compareDates,
  disclosable,
  isIsoDate,
  type Disclosable,
  type IsoDate,
} from '@meridian/core';
import type { ApplicantFacts, EvaluationScope } from './facts.js';
import { evaluationScope } from './facts.js';
import type { Criterion, EvaluatorSpec, Pathway, PathwayCitation, PathwayStatus } from './schema.js';
import { notYetOpenOn, statusOn } from './schema.js';

/** Kleene truth value. `unknown` means "the facts do not say", not "false". */
export type Ternary = 'true' | 'false' | 'unknown';

export type CriterionStatus = 'met' | 'unmet' | 'unknown' | 'requires_human_review';

export type Verdict = 'eligible' | 'ineligible' | 'indeterminate' | 'requires_human_review';

/** A fact path that was consulted and what was found there. Language-neutral, for audit. */
export interface Evidence {
  readonly path: string;
  readonly observed: unknown;
}

export interface CriterionResult {
  readonly criterionId: string;
  readonly status: CriterionStatus;
  readonly weight: Criterion['weight'];
  readonly kind: Criterion['kind'];
  readonly citationIds: readonly string[];
  /** Plain-English trace of the comparison performed. Localise from `label` and `evidence`. */
  readonly detail: string;
  readonly evidence: readonly Evidence[];
  /** Populated when `status` is `requires_human_review`. */
  readonly humanReviewReason?: string;
}

export interface ReportNote {
  readonly code: 'discretionary_source' | 'pathway_closed' | 'pathway_not_yet_open' | 'unreviewed_rule';
  readonly citationId?: string;
  readonly criterionId?: string;
  readonly text: string;
}

export interface EligibilityReport {
  readonly pathwayId: string;
  readonly pathwayVersion: string;
  readonly jurisdiction: string;
  readonly asOf: IsoDate;
  /** Always `assessment`: the applicant's facts measured against a cited rule. */
  readonly classification: 'assessment';
  readonly verdict: Verdict;
  /** The pathway's status *as at `asOf`*, which may differ from its recorded status. */
  readonly pathwayStatus: PathwayStatus;
  readonly reviewStatus: Pathway['reviewStatus'];
  readonly criteria: readonly CriterionResult[];
  /** Ids of blocking criteria that are definitively unmet. */
  readonly blockingFailures: readonly string[];
  /** Ids of criteria the facts could not decide. */
  readonly unknowns: readonly string[];
  /** Ids of material criteria that are unmet — relevant, but never decisive on their own. */
  readonly materialFailures: readonly string[];
  readonly humanReviewCriterionIds: readonly string[];
  readonly citations: readonly PathwayCitation[];
  readonly notes: readonly ReportNote[];
}

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Property names that must never be traversed.
 *
 * The catalog is data and will one day be loaded from a database or a review
 * workflow rather than a TypeScript literal. A path of `constructor.prototype`
 * in that data would be a prototype-pollution primitive, so resolution refuses
 * to walk these regardless of where the rule came from.
 */
const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

interface Resolution {
  readonly found: boolean;
  readonly value: unknown;
}

const NOT_FOUND: Resolution = { found: false, value: undefined };

/**
 * Resolve a dotted path against the current scope, or against the root when
 * prefixed with `$.`. Returns `found: false` for anything absent, so callers
 * can distinguish "not recorded" from "recorded as null".
 */
export function resolvePath(scope: unknown, root: unknown, path: string): Resolution {
  const fromRoot = path.startsWith('$.');
  let cursor: unknown = fromRoot ? root : scope;
  const rest = fromRoot ? path.slice(2) : path;
  if (rest.length === 0) return NOT_FOUND;

  for (const segment of rest.split('.')) {
    if (segment.length === 0 || FORBIDDEN_SEGMENTS.has(segment)) return NOT_FOUND;
    if (cursor === null || cursor === undefined) return NOT_FOUND;
    if (typeof cursor !== 'object') return NOT_FOUND;
    if (!Object.prototype.hasOwnProperty.call(cursor, segment)) return NOT_FOUND;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (cursor === undefined || cursor === null) return NOT_FOUND;
  return { found: true, value: cursor };
}

// ---------------------------------------------------------------------------
// Kleene combinators
// ---------------------------------------------------------------------------

function andAll(values: readonly Ternary[]): Ternary {
  if (values.includes('false')) return 'false';
  if (values.includes('unknown')) return 'unknown';
  return 'true';
}

function orAny(values: readonly Ternary[]): Ternary {
  if (values.includes('true')) return 'true';
  if (values.includes('unknown')) return 'unknown';
  return 'false';
}

function negate(value: Ternary): Ternary {
  if (value === 'true') return 'false';
  if (value === 'false') return 'true';
  return 'unknown';
}

function bool(value: boolean): Ternary {
  return value ? 'true' : 'false';
}

// ---------------------------------------------------------------------------
// Spec interpretation
// ---------------------------------------------------------------------------

interface SpecOutcome {
  readonly value: Ternary;
  readonly evidence: readonly Evidence[];
  readonly detail: string;
}

function outcome(value: Ternary, detail: string, evidence: readonly Evidence[] = []): SpecOutcome {
  return { value, detail, evidence };
}

/**
 * A rule generated from a table — one branch per CUSMA profession, say — can
 * carry dozens of clauses. The full trace is useless to a reader and expensive
 * to store, so composite details are capped and the remainder is counted.
 */
const MAX_DETAIL_CLAUSES = 6;

function joinDetails(details: readonly string[], separator: string): string {
  if (details.length <= MAX_DETAIL_CLAUSES) return details.join(separator);
  const shown = details.slice(0, MAX_DETAIL_CLAUSES).join(separator);
  return `${shown}${separator}… and ${details.length - MAX_DETAIL_CLAUSES} further clause(s)`;
}

function show(value: unknown): string {
  if (value === undefined) return 'not recorded';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} item(s)]`;
  return JSON.stringify(value);
}

function numberAt(res: Resolution): number | undefined {
  return typeof res.value === 'number' && Number.isFinite(res.value) ? res.value : undefined;
}

function dateAt(res: Resolution): IsoDate | undefined {
  return isIsoDate(res.value) ? res.value : undefined;
}

/**
 * Completion date of a period that began on `start`.
 *
 * The period is closed at both ends, so two years beginning 2023-01-01 complete
 * on 2024-12-31, not 2025-01-01. Years are applied before months and months
 * before days so the end-of-month clamping in `addMonths` behaves predictably.
 */
export function periodCompletesOn(
  start: IsoDate,
  spec: { readonly years?: number; readonly months?: number; readonly days?: number },
): IsoDate {
  let end = start;
  if (spec.years !== undefined) end = addYears(end, spec.years);
  if (spec.months !== undefined) end = addMonths(end, spec.months);
  if (spec.days !== undefined) end = addDays(end, spec.days);
  return addDays(end, -1);
}

/**
 * Interpret a spec. `scope` is what bare paths resolve against, `root` is what
 * `$.`-prefixed paths resolve against, and `asOf` supplies the only clock the
 * engine has.
 */
export function evaluateSpec(
  spec: EvaluatorSpec,
  scope: unknown,
  root: unknown,
  asOf: IsoDate,
): SpecOutcome {
  const at = (path: string): Resolution => resolvePath(scope, root, path);

  switch (spec.op) {
    case 'is_present': {
      const r = at(spec.path);
      return outcome(bool(r.found), `${spec.path} is ${r.found ? 'recorded' : 'not recorded'}`, [
        { path: spec.path, observed: r.value },
      ]);
    }
    case 'is_true':
    case 'is_false': {
      const r = at(spec.path);
      const want = spec.op === 'is_true';
      const ev = [{ path: spec.path, observed: r.value }];
      if (typeof r.value !== 'boolean') {
        return outcome('unknown', `${spec.path} is ${show(r.value)}, expected ${want}`, ev);
      }
      return outcome(bool(r.value === want), `${spec.path} is ${r.value}, expected ${want}`, ev);
    }
    case 'equals': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      if (!r.found) return outcome('unknown', `${spec.path} is not recorded`, ev);
      return outcome(
        bool(r.value === spec.value),
        `${spec.path} is ${show(r.value)}, rule requires ${show(spec.value)}`,
        ev,
      );
    }
    case 'one_of': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      if (!r.found) return outcome('unknown', `${spec.path} is not recorded`, ev);
      const hit = spec.values.some((v) => v === r.value);
      return outcome(
        bool(hit),
        `${spec.path} is ${show(r.value)}; rule admits ${spec.values.length} value(s)`,
        ev,
      );
    }
    case 'gte':
    case 'gt':
    case 'lte':
    case 'lt': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      const n = numberAt(r);
      if (n === undefined) return outcome('unknown', `${spec.path} is ${show(r.value)}`, ev);
      const ok =
        spec.op === 'gte'
          ? n >= spec.value
          : spec.op === 'gt'
            ? n > spec.value
            : spec.op === 'lte'
              ? n <= spec.value
              : n < spec.value;
      const symbol = spec.op === 'gte' ? '>=' : spec.op === 'gt' ? '>' : spec.op === 'lte' ? '<=' : '<';
      return outcome(bool(ok), `${spec.path} is ${n}; rule requires ${symbol} ${spec.value}`, ev);
    }
    case 'set_contains_any': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      if (!Array.isArray(r.value)) return outcome('unknown', `${spec.path} is not recorded`, ev);
      const hit = (r.value as unknown[]).some((v) => spec.values.some((w) => w === v));
      return outcome(
        bool(hit),
        `${spec.path} holds ${(r.value as unknown[]).map(show).join(', ') || 'nothing'}; rule admits ${spec.values.length} value(s)`,
        ev,
      );
    }
    case 'set_contains_field': {
      const r = at(spec.path);
      const other = at(spec.otherPath);
      const ev = [
        { path: spec.path, observed: r.value },
        { path: spec.otherPath, observed: other.value },
      ];
      if (!Array.isArray(r.value) || !other.found) {
        return outcome('unknown', `${spec.path} or ${spec.otherPath} is not recorded`, ev);
      }
      const hit = (r.value as unknown[]).some((v) => v === other.value);
      return outcome(
        bool(hit),
        `${spec.path} ${hit ? 'includes' : 'does not include'} ${show(other.value)} from ${spec.otherPath}`,
        ev,
      );
    }
    case 'equals_field': {
      const r = at(spec.path);
      const other = at(spec.otherPath);
      const ev = [
        { path: spec.path, observed: r.value },
        { path: spec.otherPath, observed: other.value },
      ];
      if (!r.found || !other.found) {
        return outcome('unknown', `${spec.path} or ${spec.otherPath} is not recorded`, ev);
      }
      return outcome(
        bool(r.value === other.value),
        `${spec.path} is ${show(r.value)}; ${spec.otherPath} is ${show(other.value)}`,
        ev,
      );
    }
    case 'date_before':
    case 'date_on_or_before':
    case 'date_after':
    case 'date_on_or_after': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      const d = dateAt(r);
      if (d === undefined) return outcome('unknown', `${spec.path} is ${show(r.value)}`, ev);
      const cmp = compareDates(d, spec.value);
      const ok =
        spec.op === 'date_before'
          ? cmp < 0
          : spec.op === 'date_on_or_before'
            ? cmp <= 0
            : spec.op === 'date_after'
              ? cmp > 0
              : cmp >= 0;
      return outcome(bool(ok), `${spec.path} is ${d}; rule compares against ${spec.value}`, ev);
    }
    case 'ordinal_at_least': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      if (typeof r.value !== 'string') return outcome('unknown', `${spec.path} is ${show(r.value)}`, ev);
      const have = spec.scale.indexOf(r.value);
      const need = spec.scale.indexOf(spec.value);
      if (have < 0 || need < 0) {
        // An off-scale value is not a failure — it is a value this rule cannot
        // read. Saying "unmet" would be asserting something we did not check.
        return outcome('unknown', `${spec.path} is ${show(r.value)}, which is not on the rule's scale`, ev);
      }
      return outcome(
        bool(have >= need),
        `${spec.path} is ${r.value}; rule requires at least ${spec.value}`,
        ev,
      );
    }
    case 'duration_since_at_least': {
      const r = at(spec.path);
      const ev = [{ path: spec.path, observed: r.value }];
      const start = dateAt(r);
      if (start === undefined) return outcome('unknown', `${spec.path} is ${show(r.value)}`, ev);
      if (spec.years === undefined && spec.months === undefined && spec.days === undefined) {
        // A malformed rule must not answer "met". The integrity linter rejects
        // this shape; if one reaches the evaluator anyway it stays undecided.
        return outcome('unknown', `${spec.path}: the rule specifies no period length`, ev);
      }
      const completesOn = periodCompletesOn(start, spec);
      const ok = compareDates(asOf, completesOn) >= 0;
      return outcome(
        bool(ok),
        `${spec.path} is ${start}; the required period completes on ${completesOn} and today is ${asOf}`,
        ev,
      );
    }
    case 'collection_any': {
      const r = at(spec.path);
      const ev: Evidence[] = [{ path: spec.path, observed: r.value }];
      if (!Array.isArray(r.value)) {
        return outcome('unknown', `${spec.path} is not recorded`, ev);
      }
      const results = (r.value as unknown[]).map((element) =>
        evaluateSpec(spec.where, element, root, asOf),
      );
      for (const res of results) ev.push(...res.evidence);
      const value = orAny(results.map((x) => x.value));
      const matched = results.filter((x) => x.value === 'true').length;
      return outcome(
        value,
        `${spec.path} has ${(r.value as unknown[]).length} entry(ies), ${matched} matching`,
        ev,
      );
    }
    case 'all_of': {
      const results = spec.of.map((s) => evaluateSpec(s, scope, root, asOf));
      const value = andAll(results.map((x) => x.value));
      // Only the details that explain the outcome are worth surfacing: the
      // false conjuncts when it failed, the unknown ones when it could not be
      // decided, everything when it passed.
      const relevant =
        value === 'false'
          ? results.filter((x) => x.value === 'false')
          : value === 'unknown'
            ? results.filter((x) => x.value === 'unknown')
            : results;
      return outcome(
        value,
        joinDetails(
          relevant.map((x) => x.detail).filter((d) => d.length > 0),
          '; ',
        ),
        results.flatMap((x) => x.evidence),
      );
    }
    case 'any_of': {
      const results = spec.of.map((s) => evaluateSpec(s, scope, root, asOf));
      const value = orAny(results.map((x) => x.value));
      const relevant =
        value === 'true'
          ? results.filter((x) => x.value === 'true')
          : value === 'unknown'
            ? results.filter((x) => x.value === 'unknown')
            : results;
      return outcome(
        value,
        joinDetails(
          relevant.map((x) => x.detail).filter((d) => d.length > 0),
          ' OR ',
        ),
        results.flatMap((x) => x.evidence),
      );
    }
    case 'not': {
      const inner = evaluateSpec(spec.of, scope, root, asOf);
      return outcome(negate(inner.value), `NOT (${inner.detail})`, inner.evidence);
    }
  }
}

// ---------------------------------------------------------------------------
// Criteria and reports
// ---------------------------------------------------------------------------

/**
 * One entry per fact path consulted, first observation wins.
 *
 * A generated rule reads the same path once per branch; sixty copies of
 * `educationLevel: "bachelor"` is noise in an audit trail, not evidence.
 */
function dedupeEvidence(evidence: readonly Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const e of evidence) {
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    out.push(e);
  }
  return out;
}

function evaluateCriterion(
  criterion: Criterion,
  scope: EvaluationScope,
  asOf: IsoDate,
): CriterionResult {
  const base = evaluateSpec(criterion.evaluator, scope, scope, asOf);

  const conditional =
    criterion.humanReviewWhen === undefined
      ? undefined
      : evaluateSpec(criterion.humanReviewWhen, scope, scope, asOf);

  const escalate = criterion.requiresHumanReview === true || conditional?.value === 'true';

  if (escalate) {
    return {
      criterionId: criterion.id,
      status: 'requires_human_review',
      weight: criterion.weight,
      kind: criterion.kind,
      citationIds: criterion.citationIds,
      detail: base.detail,
      evidence: dedupeEvidence([...base.evidence, ...(conditional?.evidence ?? [])]),
      humanReviewReason:
        criterion.humanReviewReason?.en ??
        'This criterion cannot be decided automatically and must be reviewed by a person.',
    };
  }

  const status: CriterionStatus =
    base.value === 'true' ? 'met' : base.value === 'false' ? 'unmet' : 'unknown';

  return {
    criterionId: criterion.id,
    status,
    weight: criterion.weight,
    kind: criterion.kind,
    citationIds: criterion.citationIds,
    detail: base.detail,
    evidence: dedupeEvidence(base.evidence),
  };
}

function collectNotes(
  pathway: Pathway,
  results: readonly CriterionResult[],
  pathwayStatus: PathwayStatus,
  asOf: IsoDate,
): ReportNote[] {
  const notes: ReportNote[] = [];
  const byId = new Map(pathway.citations.map((c) => [c.id, c]));

  if (pathwayStatus === 'closed') {
    notes.push({
      code: 'pathway_closed',
      text:
        pathway.closureNote?.en ??
        'This route is closed to new applications. Existing holders should seek advice on their own position.',
    });
  }
  if (notYetOpenOn(pathway, asOf)) {
    notes.push({
      code: 'pathway_not_yet_open',
      text: `This route did not open until ${pathway.openedOn ?? 'a later date'}.`,
    });
  }
  if (pathway.reviewStatus !== 'counsel_reviewed') {
    notes.push({
      code: 'unreviewed_rule',
      text:
        'These rules have not been signed off by a licensed representative. They are presented as ' +
        'a restatement of the cited sources and must not be relied on as advice.',
    });
  }

  // A discretionary source is a criterion whose threshold is administrative
  // practice rather than a bright line. Presenting one as settled law is how a
  // platform ends up asserting a rule that does not exist, so every report that
  // depends on one says so out loud.
  const seen = new Set<string>();
  for (const result of results) {
    for (const citationId of result.citationIds) {
      const citation = byId.get(citationId);
      if (!citation?.discretionary) continue;
      const key = `${result.criterionId}:${citationId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      notes.push({
        code: 'discretionary_source',
        citationId,
        criterionId: result.criterionId,
        text:
          citation.note ??
          `${citation.instrument} records administrative practice rather than a statutory threshold; counsel must verify it.`,
      });
    }
  }
  return notes;
}

/**
 * Measure an applicant's facts against one pathway.
 *
 * Verdict rules, in the order they are applied and for the reasons given:
 *
 * 1. **Closed as at `asOf` ⇒ `ineligible`.** No amount of merit reopens a
 *    repealed route. The criteria are still evaluated and returned, because a
 *    person who held the status wants to know what it required, and the
 *    closure note travels with the report.
 * 2. **Any criterion escalated ⇒ `requires_human_review`**, regardless of
 *    everything else. The flag does not mean "this one point is uncertain"; it
 *    means the automated evaluation of this pathway is not trustworthy for this
 *    applicant, and issuing any verdict — including a negative one — would be
 *    dressing a guess as a finding. The blocking failures are still listed so
 *    the reviewer starts with the facts.
 * 3. **Any blocking criterion unmet ⇒ `ineligible`.**
 * 4. **Any blocking criterion unknown ⇒ `indeterminate`.** Never a guess. This
 *    is the case that keeps a half-filled profile from being told "no".
 * 5. **Any material criterion unmet or unknown ⇒ `indeterminate`.** Material
 *    criteria can hold back a `yes` but can never produce a `no`, because
 *    "likely to be refused on discretionary grounds" is a prediction, and
 *    predictions are advice.
 * 6. Otherwise `eligible` — meaning "meets the encoded criteria", not "will be
 *    granted". No authority is bound by this engine.
 */
export function evaluate(pathway: Pathway, facts: ApplicantFacts, asOf: IsoDate): EligibilityReport {
  const scope = evaluationScope(facts, asOf);
  const results = pathway.criteria.map((c) => evaluateCriterion(c, scope, asOf));
  const pathwayStatus = statusOn(pathway, asOf);

  const decisive = results.filter((r) => r.weight !== 'informational');
  const blockingFailures = decisive
    .filter((r) => r.weight === 'blocking' && r.status === 'unmet')
    .map((r) => r.criterionId);
  const materialFailures = decisive
    .filter((r) => r.weight === 'material' && r.status === 'unmet')
    .map((r) => r.criterionId);
  const unknowns = decisive.filter((r) => r.status === 'unknown').map((r) => r.criterionId);
  const humanReviewCriterionIds = results
    .filter((r) => r.status === 'requires_human_review')
    .map((r) => r.criterionId);

  const blockingUnknown = decisive.some((r) => r.weight === 'blocking' && r.status === 'unknown');
  const materialUnknown = decisive.some((r) => r.weight === 'material' && r.status === 'unknown');

  let verdict: Verdict;
  if (pathwayStatus !== 'open') {
    verdict = 'ineligible';
  } else if (humanReviewCriterionIds.length > 0) {
    verdict = 'requires_human_review';
  } else if (blockingFailures.length > 0) {
    verdict = 'ineligible';
  } else if (blockingUnknown) {
    verdict = 'indeterminate';
  } else if (materialFailures.length > 0 || materialUnknown) {
    verdict = 'indeterminate';
  } else {
    verdict = 'eligible';
  }

  return {
    pathwayId: pathway.id,
    pathwayVersion: pathway.version,
    jurisdiction: pathway.jurisdiction,
    asOf,
    classification: 'assessment',
    verdict,
    pathwayStatus,
    reviewStatus: pathway.reviewStatus,
    criteria: results,
    blockingFailures,
    unknowns,
    materialFailures,
    humanReviewCriterionIds,
    citations: pathway.citations,
    notes: collectNotes(pathway, results, pathwayStatus, asOf),
  };
}

/**
 * Evaluate a whole catalog. Ordering follows the catalog, not the outcome —
 * sorting by how good the answer is would be ranking, and ranking is advice.
 */
export function evaluateAll(
  pathways: readonly Pathway[],
  facts: ApplicantFacts,
  asOf: IsoDate,
): EligibilityReport[] {
  return pathways.map((p) => evaluate(p, facts, asOf));
}

/** Every citation id the criteria of a report actually leaned on, sorted for stable output. */
export function reportCitationIds(report: EligibilityReport): string[] {
  const ids = new Set<string>();
  for (const c of report.criteria) for (const id of c.citationIds) ids.add(id);
  return [...ids].sort();
}

/**
 * Wrap a report for release.
 *
 * The classification is fixed at `assessment` rather than passed in, so there
 * is no call site anywhere that can accidentally label an assessment as
 * information — or, worse, hand a report to a gate that will let it through as
 * something it is not.
 */
export function assessmentOf(report: EligibilityReport): Disclosable<EligibilityReport> {
  return disclosable('assessment', report, reportCitationIds(report));
}
