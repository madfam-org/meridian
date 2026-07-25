/**
 * Catalog integrity, run in CI.
 *
 * The checks here are cheap and the failures they catch are not. A criterion
 * that cites `es-cc-art-22-1` when the pathway only declares `es-cc-art-22`
 * produces a report with a dangling reference — the rule still evaluates, the
 * user still sees a verdict, and the provenance quietly evaporates. A `leadsTo`
 * pointing at a pathway that was renamed produces a broken journey nobody
 * notices until a client asks why their permit leads nowhere. A citation nobody
 * has verified in seven months produces confident statements about a rule that
 * may have been repealed, which is exactly what happened to Spain's investor
 * route.
 *
 * Staleness is an *error*, not a warning. `staleness()` in `@meridian/core`
 * puts the boundary at 180 days, and a build that goes red because somebody has
 * to re-read a statute is the cheapest possible version of that problem.
 */

import { staleness, type Citation, type IsoDate } from '@meridian/core';
import { KNOWN_DERIVED_KEYS, KNOWN_FACT_ROOTS } from './facts.js';
import {
  safeParsePathway,
  walkSpecs,
  type EvaluatorSpec,
  type Pathway,
} from './schema.js';

export type IntegrityCode =
  | 'schema_invalid'
  | 'duplicate_pathway_id'
  | 'unresolved_citation_id'
  | 'unused_citation'
  | 'unknown_leads_to'
  | 'citation_stale'
  | 'citation_aging'
  | 'unknown_fact_path'
  | 'malformed_duration_spec'
  | 'counsel_review_stale';

export interface IntegrityIssue {
  readonly severity: 'error' | 'warning';
  readonly code: IntegrityCode;
  readonly pathwayId?: string;
  readonly criterionId?: string;
  readonly citationId?: string;
  readonly message: string;
}

export interface CatalogValidation {
  /** True when there are no `error`-severity issues. Warnings do not fail a build. */
  readonly ok: boolean;
  readonly issues: readonly IntegrityIssue[];
  /** Pathways that parsed successfully, in input order. */
  readonly pathways: readonly Pathway[];
}

/** Every fact path a spec tree reads, tagged with whether it resolves from the root. */
function collectPaths(spec: EvaluatorSpec): { path: string; rootScope: boolean }[] {
  const out: { path: string; rootScope: boolean }[] = [];
  walkSpecs(spec, (s, rootScope) => {
    if ('path' in s) out.push({ path: s.path, rootScope });
    if ('otherPath' in s) out.push({ path: s.otherPath, rootScope });
  });
  return out;
}

/**
 * Whether a path names something the facts model actually has.
 *
 * Only root-scoped paths are checked. Inside a `collection_any` the scope is an
 * array element whose shape varies by collection, and inventing a per-collection
 * schema to validate against would be more machinery than the bug is worth —
 * a typo there fails loudly in the tests for that pathway. Paths prefixed `$.`
 * are checked wherever they appear, because they always mean the root.
 */
function isKnownFactPath(path: string, rootScope: boolean): boolean {
  const explicit = path.startsWith('$.');
  if (!explicit && !rootScope) return true;
  const bare = explicit ? path.slice(2) : path;
  const segments = bare.split('.');
  const root = segments[0];
  if (root === undefined || !KNOWN_FACT_ROOTS.includes(root)) return false;
  if (root === 'derived') {
    const key = segments[1];
    return key !== undefined && KNOWN_DERIVED_KEYS.includes(key);
  }
  return true;
}

/**
 * Validate a catalog.
 *
 * `catalog` is `unknown[]` rather than `Pathway[]` on purpose: the whole point
 * of the schema check is to run against records that have not been through the
 * TypeScript compiler, such as rows loaded from the review database.
 */
export function validateCatalog(catalog: readonly unknown[], asOf: IsoDate): CatalogValidation {
  const issues: IntegrityIssue[] = [];
  const parsed: Pathway[] = [];

  catalog.forEach((record, index) => {
    const result = safeParsePathway(record);
    if (!result.success) {
      const id =
        typeof record === 'object' && record !== null && 'id' in record
          ? String((record as { id: unknown }).id)
          : `#${index}`;
      for (const issue of result.error.issues) {
        issues.push({
          severity: 'error',
          code: 'schema_invalid',
          pathwayId: id,
          message: `${issue.path.join('.') || '<root>'}: ${issue.message}`,
        });
      }
      return;
    }
    parsed.push(result.data);
  });

  const seenIds = new Set<string>();
  for (const pathway of parsed) {
    if (seenIds.has(pathway.id)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_pathway_id',
        pathwayId: pathway.id,
        message: `pathway id ${pathway.id} appears more than once; ids address rules and must be unique`,
      });
    }
    seenIds.add(pathway.id);
  }

  for (const pathway of parsed) {
    const citationsById = new Map<string, Citation>(pathway.citations.map((c) => [c.id, c]));
    const referenced = new Set<string>();

    for (const citation of pathway.citations) {
      const band = staleness(citation, asOf);
      if (band === 'stale') {
        issues.push({
          severity: 'error',
          code: 'citation_stale',
          pathwayId: pathway.id,
          citationId: citation.id,
          message: `${citation.id} was last verified on ${citation.verifiedOn}, which is stale as at ${asOf}; the rule must be re-read before it is applied to anyone`,
        });
      } else if (band === 'aging') {
        issues.push({
          severity: 'warning',
          code: 'citation_aging',
          pathwayId: pathway.id,
          citationId: citation.id,
          message: `${citation.id} was last verified on ${citation.verifiedOn} and is due for re-verification`,
        });
      }
    }

    for (const criterion of pathway.criteria) {
      for (const citationId of criterion.citationIds) {
        referenced.add(citationId);
        if (!citationsById.has(citationId)) {
          issues.push({
            severity: 'error',
            code: 'unresolved_citation_id',
            pathwayId: pathway.id,
            criterionId: criterion.id,
            citationId,
            message: `criterion ${criterion.id} cites ${citationId}, which is not declared on the pathway`,
          });
        }
      }

      const specs: EvaluatorSpec[] = [criterion.evaluator];
      if (criterion.humanReviewWhen !== undefined) specs.push(criterion.humanReviewWhen);
      for (const spec of specs) {
        for (const { path, rootScope } of collectPaths(spec)) {
          if (!isKnownFactPath(path, rootScope)) {
            issues.push({
              severity: 'error',
              code: 'unknown_fact_path',
              pathwayId: pathway.id,
              criterionId: criterion.id,
              message: `criterion ${criterion.id} reads ${path}, which is not a field of ApplicantFacts or DerivedFacts; it would evaluate to "unknown" for every applicant`,
            });
          }
        }
        walkSpecs(spec, (s) => {
          if (
            s.op === 'duration_since_at_least' &&
            s.years === undefined &&
            s.months === undefined &&
            s.days === undefined
          ) {
            issues.push({
              severity: 'error',
              code: 'malformed_duration_spec',
              pathwayId: pathway.id,
              criterionId: criterion.id,
              message: `criterion ${criterion.id} has a duration_since_at_least on ${s.path} with no years, months or days`,
            });
          }
        });
      }
    }

    for (const citationId of pathway.durations.citationIds) {
      referenced.add(citationId);
      if (!citationsById.has(citationId)) {
        issues.push({
          severity: 'error',
          code: 'unresolved_citation_id',
          pathwayId: pathway.id,
          citationId,
          message: `durations cite ${citationId}, which is not declared on the pathway`,
        });
      }
    }

    for (const citation of pathway.citations) {
      if (!referenced.has(citation.id)) {
        issues.push({
          severity: 'warning',
          code: 'unused_citation',
          pathwayId: pathway.id,
          citationId: citation.id,
          message: `${citation.id} is declared but no criterion or duration cites it`,
        });
      }
    }

    for (const target of pathway.leadsTo) {
      if (!seenIds.has(target)) {
        issues.push({
          severity: 'error',
          code: 'unknown_leads_to',
          pathwayId: pathway.id,
          message: `leadsTo names ${target}, which is not in the catalog`,
        });
      }
    }

    // A review of a rule whose sources have since gone stale is not a live
    // review. The record should be moved to `needs_reverification` rather than
    // continuing to unlock advice-class output.
    if (pathway.reviewStatus === 'counsel_reviewed') {
      const anyStale = pathway.citations.some((c) => staleness(c, asOf) === 'stale');
      if (anyStale) {
        issues.push({
          severity: 'error',
          code: 'counsel_review_stale',
          pathwayId: pathway.id,
          message:
            `${pathway.id} is marked counsel_reviewed but rests on stale citations; ` +
            'it must be set to needs_reverification until the sources are re-read',
        });
      }
    }
  }

  return { ok: !issues.some((i) => i.severity === 'error'), issues, pathways: parsed };
}

/** Errors only. Convenient for a CI script that wants to print and exit. */
export function integrityErrors(validation: CatalogValidation): IntegrityIssue[] {
  return validation.issues.filter((i) => i.severity === 'error');
}
