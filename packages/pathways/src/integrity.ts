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
 *
 * ## Error or warning
 *
 * An **error** is a defect in what the engine will *do*: a rule that cannot
 * resolve, a fact path that answers "unknown" for everybody, a verdict the
 * engine could reach on nothing decisive. It fails the build.
 *
 * A **warning** is a defect in what a reader will *see* when several pathways
 * are shown side by side, where each pathway on its own is still internally
 * sound. Those are real and somebody must reconcile them, but failing a build
 * on them would block every other pathway in the catalog on an editorial
 * disagreement between two records that each work.
 */

import { staleness, type Citation, type IsoDate } from '@meridian/core';
import { KNOWN_DERIVED_KEYS, KNOWN_FACT_ROOTS } from './facts.js';
import {
  safeParsePathway,
  walkSpecs,
  type Criterion,
  type EvaluatorSpec,
  type LocalizedText,
  type Pathway,
} from './schema.js';

export type IntegrityCode =
  | 'schema_invalid'
  | 'duplicate_pathway_id'
  | 'unresolved_citation_id'
  | 'unused_citation'
  | 'unknown_leads_to'
  | 'duplicate_leads_to'
  | 'citation_stale'
  | 'citation_aging'
  | 'citation_id_conflict'
  | 'citation_note_divergence'
  | 'unknown_fact_path'
  | 'malformed_duration_spec'
  | 'counsel_review_stale'
  | 'no_blocking_criterion'
  | 'missing_human_review_reason'
  | 'blank_localized_text'
  | 'jurisdiction_prefix_mismatch';

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
 * The fields that establish *which source* a citation id names.
 *
 * `note` is excluded deliberately. A note is commentary written for the
 * pathway it sits on — the same regulation genuinely says something different
 * about a student's work than about a skilled worker's, and forcing one wording
 * onto both would make the notes worse. Everything in this list is the source's
 * identity, and two records claiming the same id must agree on all of it.
 */
const CITATION_IDENTITY_FIELDS = [
  'kind',
  'instrument',
  'provision',
  'url',
  'jurisdiction',
  'verifiedOn',
  'discretionary',
] as const;

/**
 * Compare one identity field of two citations sharing an id.
 *
 * `discretionary` is normalised because absent and `false` mean the same thing
 * to every consumer — `if (!citation.discretionary)` — and reporting them as a
 * conflict would be a false positive, which is the fastest way to teach a
 * reader to ignore this check.
 */
function citationFieldsThatDiffer(a: Citation, b: Citation): string[] {
  return CITATION_IDENTITY_FIELDS.filter((field) => {
    if (field === 'discretionary') return (a.discretionary === true) !== (b.discretionary === true);
    return a[field] !== b[field];
  });
}

/**
 * Whether both halves of a bilingual string carry something a human can read.
 *
 * `localizedTextSchema` already rejects the empty string, so this is only about
 * what slips past `.min(1)`: a value of `'   '` is a string of length three and
 * renders as nothing at all. Spanish is not an afterthought in this catalog and
 * a blank `es` is an inaccessible rule for most of the people it is for.
 */
function blankHalves(text: LocalizedText): string[] {
  const blank: string[] = [];
  if (text.en.trim() === '') blank.push('en');
  if (text.es.trim() === '') blank.push('es');
  return blank;
}

/** True when the criterion can escalate at all, conditionally or otherwise. */
function canEscalate(criterion: Criterion): boolean {
  return criterion.requiresHumanReview === true || criterion.humanReviewWhen !== undefined;
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

    // A pathway with no blocking criterion can never return `ineligible`, which
    // means it answers "eligible" on the strength of nothing decisive. That is
    // not a lenient route, it is a route whose bright lines were never encoded,
    // and it reads to an applicant exactly like a green light.
    if (!pathway.criteria.some((c) => c.weight === 'blocking')) {
      issues.push({
        severity: 'error',
        code: 'no_blocking_criterion',
        pathwayId: pathway.id,
        message:
          `${pathway.id} has no blocking criterion, so the engine can never rule it out; ` +
          'either a bright-line requirement is missing or one that exists is mis-weighted',
      });
    }

    // The id prefix is what a reader greps on and what a filename is chosen
    // from. An `es-` id filed under CA is a record nobody will find again.
    const prefix = pathway.id.slice(0, 2).toUpperCase();
    if (prefix !== pathway.jurisdiction.toUpperCase()) {
      issues.push({
        severity: 'error',
        code: 'jurisdiction_prefix_mismatch',
        pathwayId: pathway.id,
        message: `${pathway.id} is filed under jurisdiction ${pathway.jurisdiction}; the id prefix says ${prefix}`,
      });
    }

    const localized: { field: string; text: LocalizedText | undefined; criterionId?: string }[] = [
      { field: 'name', text: pathway.name },
      { field: 'summary', text: pathway.summary },
      { field: 'closureNote', text: pathway.closureNote },
      { field: 'durations.note', text: pathway.durations.note },
      ...pathway.criteria.flatMap((c) => [
        { field: 'label', text: c.label, criterionId: c.id },
        { field: 'guidance', text: c.guidance, criterionId: c.id },
        { field: 'humanReviewReason', text: c.humanReviewReason, criterionId: c.id },
      ]),
    ];
    for (const entry of localized) {
      if (entry.text === undefined) continue;
      const blank = blankHalves(entry.text);
      if (blank.length === 0) continue;
      issues.push({
        severity: 'error',
        code: 'blank_localized_text',
        pathwayId: pathway.id,
        criterionId: entry.criterionId,
        message: `${entry.field} is blank in ${blank.join(' and ')}; a rule nobody can read in their own language is not a rule they can check`,
      });
    }

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
      // An escalating criterion hands the whole report to a person. What that
      // person is being asked to decide has to be written down: `evaluate`
      // surfaces `humanReviewReason.en` and, when it is absent, falls back to
      // "this criterion cannot be decided automatically", which tells the
      // reviewer nothing and tells the applicant less. `guidance` is not a
      // substitute — the evaluator does not read it on this path.
      if (canEscalate(criterion) && criterion.humanReviewReason === undefined) {
        issues.push({
          severity: 'error',
          code: 'missing_human_review_reason',
          pathwayId: pathway.id,
          criterionId: criterion.id,
          message:
            `criterion ${criterion.id} escalates to human review but carries no humanReviewReason; ` +
            'the report would fall back to a generic sentence that says nothing about what the reviewer must decide',
        });
      }

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

    // A self-referential `leadsTo` never reaches this loop: `pathwaySchema`
    // rejects the record outright, so it surfaces as `schema_invalid` above and
    // the pathway is not parsed at all. Repeating the check here would be
    // unreachable code that looks like protection. `tests/integrity.test.ts`
    // pins that behaviour so the guarantee stays where it is.
    const targetsSeen = new Set<string>();
    for (const target of pathway.leadsTo) {
      if (!seenIds.has(target)) {
        issues.push({
          severity: 'error',
          code: 'unknown_leads_to',
          pathwayId: pathway.id,
          message: `leadsTo names ${target}, which is not in the catalog`,
        });
      }
      if (targetsSeen.has(target)) {
        issues.push({
          severity: 'error',
          code: 'duplicate_leads_to',
          pathwayId: pathway.id,
          message: `leadsTo names ${target} more than once; the same bridge would render twice`,
        });
      }
      targetsSeen.add(target);
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

  // -------------------------------------------------------------------------
  // Cross-pathway citation consistency.
  //
  // Citations resolve *within* a pathway, so two records declaring the same id
  // with different text never dangles and never mis-renders a single report.
  // It breaks the moment two pathways appear together — an assessment set, a
  // firm's export, any bibliography keyed by id, all of which `recommend` and
  // `assess` produce by design. There the reader sees one marker and one entry
  // where the catalog holds two, and has no way to know which they got.
  //
  // Both codes are warnings because each record is individually sound and the
  // fix is an editorial reconciliation between two files, not a correction to a
  // rule. They name both pathways so that reconciliation has somewhere to
  // start.
  // -------------------------------------------------------------------------
  const firstSeenCitation = new Map<string, { citation: Citation; pathwayId: string }>();
  for (const pathway of parsed) {
    for (const citation of pathway.citations) {
      const previous = firstSeenCitation.get(citation.id);
      if (previous === undefined) {
        firstSeenCitation.set(citation.id, { citation, pathwayId: pathway.id });
        continue;
      }
      const differing = citationFieldsThatDiffer(previous.citation, citation);
      if (differing.length > 0) {
        issues.push({
          severity: 'warning',
          code: 'citation_id_conflict',
          pathwayId: pathway.id,
          citationId: citation.id,
          message:
            `${citation.id} is declared on ${previous.pathwayId} and on ${pathway.id} with different ` +
            `${differing.join(', ')}; one id must name one source`,
        });
      } else if ((previous.citation.note ?? '') !== (citation.note ?? '')) {
        issues.push({
          severity: 'warning',
          code: 'citation_note_divergence',
          pathwayId: pathway.id,
          citationId: citation.id,
          message:
            `${citation.id} names the same source on ${previous.pathwayId} and on ${pathway.id} but ` +
            'annotates it differently; a shared bibliography can only show one of the two notes',
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
