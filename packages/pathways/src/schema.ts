/**
 * The declarative shape of a migration pathway — the PRD's "VisaSchema" made real.
 *
 * Two design constraints drive everything in this file, and both are legal
 * rather than technical.
 *
 * **The catalog is data, not code.** A pathway is a record that zod validates,
 * and its eligibility criteria are *declarative specs* rather than functions.
 * That is deliberate: a rule expressed as a closure cannot be serialised into a
 * database, diffed in a pull request, exported for counsel to sign off on, or
 * re-run against a historical version to explain a decision that was made six
 * months ago. Adding a country must never require touching {@link
 * import('./evaluate.js').evaluate} — if it does, the rule has leaked into the
 * engine where nobody reviewing law will ever find it.
 *
 * **Nothing is asserted without provenance.** Every criterion carries
 * `citationIds`, and every id must resolve to a {@link Citation} on the same
 * pathway (enforced by {@link import('./integrity.js').validateCatalog}). A
 * criterion with no source is a rule Meridian invented, and Meridian does not
 * get to invent rules about other people's right to live somewhere.
 */

import { z } from 'zod';
import { compareDates, isCountryCode, isIsoDate, type CountryCode, type IsoDate } from '@meridian/core';

/**
 * A civil date, validated through core's parser rather than a regex, so
 * `2025-02-30` is rejected here exactly as it is everywhere else.
 */
export const isoDateSchema = z.custom<IsoDate>((v) => isIsoDate(v), {
  message: 'expected a civil date in YYYY-MM-DD form',
});

export const countryCodeSchema = z.custom<CountryCode>((v) => isCountryCode(v), {
  message: 'expected an ISO 3166-1 alpha-2 country code',
});

/**
 * Every user-visible string in the catalog is bilingual. Spanish is not a
 * translation afterthought here: the majority of applicants this catalog
 * serves are Spanish-speaking, and an English-only eligibility reason is an
 * inaccessible one.
 */
export const localizedTextSchema = z.object({
  en: z.string().min(1),
  es: z.string().min(1),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Mirrors `SourceKind` in `@meridian/core`. Kept in lockstep by a type test. */
export const sourceKindSchema = z.enum([
  'treaty',
  'statute',
  'regulation',
  'policy',
  'case_law',
  'official_guidance',
  'statistics',
  'secondary',
]);

/**
 * Structurally identical to core's `Citation`. It is restated as a zod schema
 * (rather than imported) because the catalog must be validatable at runtime
 * when it is loaded from a database or a review workflow, not only at compile
 * time. `tests/schema.test.ts` asserts the two stay assignable.
 */
export const citationSchema = z.object({
  id: z.string().min(1),
  kind: sourceKindSchema,
  instrument: z.string().min(1),
  provision: z.string().min(1).optional(),
  url: z.string().url().optional(),
  jurisdiction: z.string().min(1),
  verifiedOn: isoDateSchema,
  discretionary: z.boolean().optional(),
  note: z.string().min(1).optional(),
});

export type PathwayCitation = z.infer<typeof citationSchema>;

// ---------------------------------------------------------------------------
// Evaluator specs
// ---------------------------------------------------------------------------

/**
 * A dotted path into {@link import('./facts.js').EvaluationScope}.
 *
 * Paths are resolved against the *current scope*. Inside a `collection_any`
 * the scope is the element being examined, so `level` means "this
 * certification's level". A path prefixed with `$.` always resolves from the
 * root facts instead — that is how a rule inside a collection compares an
 * element against something about the applicant as a whole, e.g. "a police
 * certificate issued by the country whose nationality the applicant claimed".
 */
const pathSchema = z.string().min(1).max(120);

/** Scalars a declarative comparison may hold. Kept narrow so the catalog stays JSON. */
const comparableSchema = z.union([z.string(), z.number(), z.boolean()]);

export type EvaluatorSpec =
  /** The path resolves to something other than `undefined`/`null`. Absence is `false`, not `unknown`. */
  | { readonly op: 'is_present'; readonly path: string }
  | { readonly op: 'is_true'; readonly path: string }
  | { readonly op: 'is_false'; readonly path: string }
  | { readonly op: 'equals'; readonly path: string; readonly value: string | number | boolean }
  /** Scalar membership: the value at `path` is one of `values`. */
  | { readonly op: 'one_of'; readonly path: string; readonly values: readonly (string | number)[] }
  | { readonly op: 'gte'; readonly path: string; readonly value: number }
  | { readonly op: 'gt'; readonly path: string; readonly value: number }
  | { readonly op: 'lte'; readonly path: string; readonly value: number }
  | { readonly op: 'lt'; readonly path: string; readonly value: number }
  /** Collection membership: the array at `path` contains at least one of `values`. */
  | { readonly op: 'set_contains_any'; readonly path: string; readonly values: readonly string[] }
  /** The array at `path` contains the scalar found at `otherPath`. */
  | { readonly op: 'set_contains_field'; readonly path: string; readonly otherPath: string }
  | { readonly op: 'equals_field'; readonly path: string; readonly otherPath: string }
  | { readonly op: 'date_before'; readonly path: string; readonly value: IsoDate }
  | { readonly op: 'date_on_or_before'; readonly path: string; readonly value: IsoDate }
  | { readonly op: 'date_after'; readonly path: string; readonly value: IsoDate }
  | { readonly op: 'date_on_or_after'; readonly path: string; readonly value: IsoDate }
  /**
   * Ordered-scale comparison. `scale` is carried in the rule itself so the
   * ordering of, say, CEFR levels is auditable data rather than a hidden table
   * in the engine.
   */
  | {
      readonly op: 'ordinal_at_least';
      readonly path: string;
      readonly scale: readonly string[];
      readonly value: string;
    }
  /**
   * Calendar-duration test: the period that began on the date at `path` has
   * *completed* on or before `asOf`. Uses `addYears`/`addMonths` from core, so
   * "two years from 2022-03-01" completes on 2024-02-29 in a leap cycle rather
   * than drifting by a day.
   */
  | {
      readonly op: 'duration_since_at_least';
      readonly path: string;
      readonly years?: number;
      readonly months?: number;
      readonly days?: number;
    }
  /** At least one element of the array at `path` satisfies `where`. */
  | { readonly op: 'collection_any'; readonly path: string; readonly where: EvaluatorSpec }
  | { readonly op: 'all_of'; readonly of: readonly EvaluatorSpec[] }
  | { readonly op: 'any_of'; readonly of: readonly EvaluatorSpec[] }
  | { readonly op: 'not'; readonly of: EvaluatorSpec };

export const evaluatorSpecSchema: z.ZodType<EvaluatorSpec> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.object({ op: z.literal('is_present'), path: pathSchema }),
    z.object({ op: z.literal('is_true'), path: pathSchema }),
    z.object({ op: z.literal('is_false'), path: pathSchema }),
    z.object({ op: z.literal('equals'), path: pathSchema, value: comparableSchema }),
    z.object({
      op: z.literal('one_of'),
      path: pathSchema,
      values: z.array(z.union([z.string(), z.number()])).min(1),
    }),
    z.object({ op: z.literal('gte'), path: pathSchema, value: z.number() }),
    z.object({ op: z.literal('gt'), path: pathSchema, value: z.number() }),
    z.object({ op: z.literal('lte'), path: pathSchema, value: z.number() }),
    z.object({ op: z.literal('lt'), path: pathSchema, value: z.number() }),
    z.object({
      op: z.literal('set_contains_any'),
      path: pathSchema,
      values: z.array(z.string()).min(1),
    }),
    z.object({ op: z.literal('set_contains_field'), path: pathSchema, otherPath: pathSchema }),
    z.object({ op: z.literal('equals_field'), path: pathSchema, otherPath: pathSchema }),
    z.object({ op: z.literal('date_before'), path: pathSchema, value: isoDateSchema }),
    z.object({ op: z.literal('date_on_or_before'), path: pathSchema, value: isoDateSchema }),
    z.object({ op: z.literal('date_after'), path: pathSchema, value: isoDateSchema }),
    z.object({ op: z.literal('date_on_or_after'), path: pathSchema, value: isoDateSchema }),
    z.object({
      op: z.literal('ordinal_at_least'),
      path: pathSchema,
      scale: z.array(z.string().min(1)).min(2),
      value: z.string().min(1),
    }),
    // No `.refine` here: a refinement turns a ZodObject into a ZodEffects and
    // `z.discriminatedUnion` cannot dispatch on those. "At least one of years,
    // months or days" is therefore checked by the integrity linter, and the
    // evaluator treats a spec with none of them as `unknown` rather than
    // silently answering `true` for a zero-length period.
    z.object({
      op: z.literal('duration_since_at_least'),
      path: pathSchema,
      years: z.number().int().optional(),
      months: z.number().int().optional(),
      days: z.number().int().optional(),
    }),
    z.object({ op: z.literal('collection_any'), path: pathSchema, where: evaluatorSpecSchema }),
    z.object({ op: z.literal('all_of'), of: z.array(evaluatorSpecSchema).min(1) }),
    z.object({ op: z.literal('any_of'), of: z.array(evaluatorSpecSchema).min(1) }),
    z.object({ op: z.literal('not'), of: evaluatorSpecSchema }),
  ]),
);

// ---------------------------------------------------------------------------
// Criteria
// ---------------------------------------------------------------------------

/**
 * What a criterion is *about*. Purely for grouping in the UI and for telling a
 * reviewer which specialist should check it; the engine does not branch on it.
 */
export const criterionKindSchema = z.enum([
  'nationality',
  'residence',
  'status',
  'language',
  'integration',
  'character',
  'economic',
  'employment',
  'qualification',
  'health',
  'intent',
  'procedural',
]);

export type CriterionKind = z.infer<typeof criterionKindSchema>;

/**
 * How much a criterion matters to the verdict.
 *
 * - `blocking` — failing it means the application cannot succeed. The engine
 *   will say `ineligible`.
 * - `material` — relevant and usually decisive in practice, but not a bright
 *   line the engine may rule on. Failing or not knowing one caps the verdict
 *   at `indeterminate`; it never produces `ineligible` on its own, because
 *   "probably refused" is a prediction and predictions are advice.
 * - `informational` — surfaced to the reader, never affects the verdict.
 */
export const criterionWeightSchema = z.enum(['blocking', 'material', 'informational']);

export type CriterionWeight = z.infer<typeof criterionWeightSchema>;

export const criterionSchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  kind: criterionKindSchema,
  /** Must resolve to citations declared on the owning pathway. */
  citationIds: z.array(z.string().min(1)).min(1),
  evaluator: evaluatorSpecSchema,
  weight: criterionWeightSchema,
  /**
   * Unconditional escalation: this criterion can never be decided by software.
   * The whole report becomes `requires_human_review`.
   */
  requiresHumanReview: z.boolean().optional(),
  /**
   * Conditional escalation. When this spec evaluates `true`, the criterion
   * escalates. This is how a profession that is objectively on a treaty list
   * but is known to draw heightened officer scrutiny gets routed to a human
   * instead of a green tick.
   */
  humanReviewWhen: evaluatorSpecSchema.optional(),
  humanReviewReason: localizedTextSchema.optional(),
  /** Shown alongside the result. Explains what the applicant would need to do. */
  guidance: localizedTextSchema.optional(),
});

export type Criterion = z.infer<typeof criterionSchema>;

// ---------------------------------------------------------------------------
// Pathways
// ---------------------------------------------------------------------------

export const pathwayKindSchema = z.enum([
  'residence_permit',
  'work_permit',
  'naturalization',
  'permanent_residence',
  'entry_facilitation',
]);

export type PathwayKind = z.infer<typeof pathwayKindSchema>;

/**
 * `closed` means new applications are no longer accepted. It does **not** mean
 * the pathway is irrelevant — people hold status under closed routes for years
 * afterwards, and Spain's investor route is the live example. Closed pathways
 * stay in the catalog with a `closureNote` so a current holder asking about
 * renewal gets an answer instead of a 404.
 *
 * `suspended` is for routes an authority has paused without repealing, where
 * intake may resume.
 */
export const pathwayStatusSchema = z.enum(['open', 'closed', 'suspended']);

export type PathwayStatus = z.infer<typeof pathwayStatusSchema>;

/**
 * Whether a licensed human has actually read this record.
 *
 * This field is load-bearing rather than administrative. An `unreviewed`
 * pathway may appear in an `assessment` — "here is what the published rule
 * says and here is your own arithmetic against it" — but it must never appear
 * in an `advice`-class recommendation, because recommending a route nobody
 * qualified has checked is precisely the unlicensed-advice risk that
 * `DisclosureClass` exists to contain. {@link
 * import('./recommend.js').recommend} enforces that gate.
 *
 * `needs_reverification` is what a previously-reviewed pathway becomes when its
 * citations go stale or the underlying instrument changes. It is treated
 * exactly like `unreviewed` for release purposes — a stale review is not a
 * review.
 */
export const reviewStatusSchema = z.enum(['unreviewed', 'counsel_reviewed', 'needs_reverification']);

export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

/**
 * How long a grant lasts and whether time on it counts toward naturalisation.
 *
 * Deliberately sparse. Processing-time estimates are only populated where an
 * authority publishes a service standard; Meridian does not ship a guessed
 * "typically 4-6 weeks", because an applicant who books a flight on an invented
 * number pays for the invention.
 */
export const durationsSchema = z.object({
  /** Length of the first authorisation, in months. */
  initialGrantMonths: z.number().int().positive().optional(),
  /** Length of each renewal, in months. */
  renewalMonths: z.number().int().positive().optional(),
  maxRenewals: z.number().int().nonnegative().optional(),
  /** Whether time held under this status counts toward the residence clock for naturalisation. */
  countsTowardNaturalisation: z.boolean().optional(),
  /** Only where the authority publishes a service standard. */
  publishedProcessingDays: z
    .object({ min: z.number().int().nonnegative(), max: z.number().int().nonnegative() })
    .refine((r) => r.min <= r.max, 'processing-day range is inverted')
    .optional(),
  citationIds: z.array(z.string().min(1)),
  note: localizedTextSchema.optional(),
});

export type Durations = z.infer<typeof durationsSchema>;

export const pathwaySchema = z
  .object({
    /** `<iso2-lowercase>-<slug>`, e.g. `es-nationality-residence-reduced`. */
    id: z
      .string()
      .min(3)
      .regex(/^[a-z]{2}-[a-z0-9][a-z0-9-]*$/, 'pathway id must be `xx-slug` in lowercase'),
    /** Semver of the *rule content*, not of the package. Bump on any legal change. */
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version must be semver'),
    jurisdiction: countryCodeSchema,
    name: localizedTextSchema,
    summary: localizedTextSchema,
    kind: pathwayKindSchema,
    status: pathwayStatusSchema,
    /** First date applications were accepted, where known. */
    openedOn: isoDateSchema.optional(),
    /** First date applications were no longer accepted. Required when `status` is `closed`. */
    closedOn: isoDateSchema.optional(),
    /** What a person already holding this status needs to know. Required when `closed`. */
    closureNote: localizedTextSchema.optional(),
    citations: z.array(citationSchema).min(1),
    criteria: z.array(criterionSchema).min(1),
    durations: durationsSchema,
    /** Pathway ids this route bridges to, e.g. a work permit that builds residence toward naturalisation. */
    leadsTo: z.array(z.string().min(1)),
    reviewStatus: reviewStatusSchema,
    reviewedBy: z.string().min(1).optional(),
    reviewedOn: isoDateSchema.optional(),
  })
  .superRefine((p, ctx) => {
    if (p.status === 'closed' && p.closedOn === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closedOn'],
        message: 'a closed pathway must record the date it closed',
      });
    }
    if (p.status === 'closed' && p.closureNote === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closureNote'],
        message:
          'a closed pathway must carry a closureNote so existing holders get an answer, not silence',
      });
    }
    if (p.reviewStatus === 'counsel_reviewed' && (!p.reviewedBy || !p.reviewedOn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewStatus'],
        message: 'counsel_reviewed requires both reviewedBy and reviewedOn — an unattributed review is not a review',
      });
    }
    const citationIds = new Set<string>();
    for (const c of p.citations) {
      if (citationIds.has(c.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['citations'],
          message: `duplicate citation id ${c.id}`,
        });
      }
      citationIds.add(c.id);
    }
    const criterionIds = new Set<string>();
    for (const c of p.criteria) {
      if (criterionIds.has(c.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['criteria'],
          message: `duplicate criterion id ${c.id}`,
        });
      }
      criterionIds.add(c.id);
    }
    if (p.leadsTo.includes(p.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['leadsTo'],
        message: 'a pathway cannot lead to itself',
      });
    }
  });

export type Pathway = z.infer<typeof pathwaySchema>;

/** A collection of pathways addressed by id. */
export type PathwayCatalog = readonly Pathway[];

/**
 * True when a review is good enough to hang regulated advice on.
 *
 * `needs_reverification` deliberately fails: a review of text that has since
 * changed tells you about a rule that no longer exists.
 */
export function isCounselReviewed(pathway: Pathway): boolean {
  return pathway.reviewStatus === 'counsel_reviewed';
}

/**
 * Status of a pathway *as at a given date*, which is not the same as the status
 * recorded on the record.
 *
 * `status` describes the route today; `openedOn` and `closedOn` make the record
 * answerable about the past. Asked about 2 April 2025, Spain's investor route
 * was open, and a matter opened then has to be assessed against the rules that
 * were in force then rather than against today's repeal. A catalog that could
 * only answer "closed" would be unable to explain any decision made before the
 * repeal, which is most of the decisions anyone still has questions about.
 *
 * `suspended` doubles as "had not opened yet" — either way the route is not
 * available on that date, which is the only thing the evaluator does with it.
 *
 * The date comparison goes through core's `compareDates` rather than string
 * `<`. Lexicographic comparison happens to work for `YYYY-MM-DD`, which is
 * exactly why it is a trap: it works until someone stores a date in another
 * shape and it silently stops working.
 */
export function statusOn(pathway: Pathway, asOf: IsoDate): PathwayStatus {
  if (pathway.openedOn !== undefined && compareDates(asOf, pathway.openedOn) < 0) return 'suspended';
  if (pathway.closedOn !== undefined) {
    return compareDates(asOf, pathway.closedOn) >= 0 ? 'closed' : 'open';
  }
  return pathway.status;
}

/** True when `asOf` falls before the date the route began accepting applications. */
export function notYetOpenOn(pathway: Pathway, asOf: IsoDate): boolean {
  return pathway.openedOn !== undefined && compareDates(asOf, pathway.openedOn) < 0;
}

/** Parse an untrusted record into a `Pathway`, or throw with zod's issue list. */
export function parsePathway(input: unknown): Pathway {
  return pathwaySchema.parse(input);
}

/** Non-throwing variant, for loaders that need to report every bad record rather than the first. */
export function safeParsePathway(input: unknown): z.SafeParseReturnType<unknown, Pathway> {
  return pathwaySchema.safeParse(input);
}

/**
 * Walk every spec in a criterion tree. Exposed because the integrity checker
 * needs it to validate fact paths, and because a catalog linter is worth more
 * than a catalog convention.
 */
export function walkSpecs(spec: EvaluatorSpec, visit: (s: EvaluatorSpec, rootScope: boolean) => void): void {
  const go = (s: EvaluatorSpec, rootScope: boolean): void => {
    visit(s, rootScope);
    switch (s.op) {
      case 'all_of':
      case 'any_of':
        for (const child of s.of) go(child, rootScope);
        return;
      case 'not':
        go(s.of, rootScope);
        return;
      case 'collection_any':
        // Inside a collection the scope is the element, not the applicant.
        go(s.where, false);
        return;
      default:
        return;
    }
  };
  go(spec, true);
}
