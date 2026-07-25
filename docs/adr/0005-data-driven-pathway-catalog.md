# ADR 0005 — Data-driven pathway catalog with mandatory citations

- **Status**: Accepted
- **Date**: 2026-07-25
- **Implemented in**: `packages/pathways/` — `schema.ts`, `evaluate.ts`,
  `integrity.ts`, `catalog/`
- **Related**: [ADR 0002](0002-advice-boundary-as-a-type.md),
  [LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

Immigration eligibility rules are numerous, jurisdiction-specific, amended
without notice, and — this is the part that shapes everything — **must be
verifiable by a lawyer who does not read TypeScript.**

The obvious implementation is a function per pathway:

```ts
function isEligibleForSpanishNationality(applicant: Applicant): boolean { … }
```

This fails in four ways that matter here.

1. **It is unreviewable.** Counsel review is the gating item between this engine
   and a sellable product ([LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md)).
   A reviewer confronted with a TypeScript function cannot confirm that the
   comparison is `> 183` rather than `>= 183`, and asking them to learn to would
   make review impossible in practice.
2. **Rules leak into the engine.** Once one pathway has a bespoke function, the
   shared helpers acquire country-specific branches, and legal rules end up
   distributed across a codebase in places no reviewer will ever look.
3. **It is not diffable as law.** "What changed in the Spanish rules between
   version 3 and 4" should be answerable from a diff of a data structure, not
   inferred from a control-flow change.
4. **Booleans erase the difference between "no" and "we do not know".** An
   applicant who has not told us their education level is not an applicant
   without one, and treating them the same produces a false refusal.

There was also a hard-won empirical input. Four legal facts from the source PRD
were spot-checked against primary sources during the build; **three of the four
were wrong or incomplete** (see [PRD.md](../PRD.md)). Any design that makes it
easy to encode an unsourced rule will accumulate unsourced rules.

## Decision

**The law is data. The engine is generic. Every rule cites its source.**

### 1. A pathway is a validated record

`Pathway` is a zod schema: id, version, jurisdiction, bilingual name and summary,
kind, status with `openedOn` / `closedOn`, an array of `Citation`s, an array of
`Criterion`s, `durations`, `leadsTo`, and the review fields. `parsePathway` is
the boundary; the catalog is plain data that could equally be loaded from a
database or a file.

### 2. Criteria are declarative specs

```ts
type EvaluatorSpec =
  | { op: 'gte' | 'gt' | 'lte' | 'lt'; path: string; value: number }
  | { op: 'one_of'; path: string; values: readonly (string | number)[] }
  | { op: 'duration_since_at_least'; path: string; years?: number; months?: number; days?: number }
  | { op: 'ordinal_at_least'; path: string; scale: readonly string[]; value: string }
  | { op: 'all_of' | 'any_of'; of: readonly EvaluatorSpec[] }
  | { op: 'not'; of: EvaluatorSpec }
  | …  // 18 operations in total
```

A reviewer reads `{ op: 'gt', path: 'derived.legalResidenceDaysTotal', value: 730 }`
and can confirm it against the instrument without reading code. The catalog is
serialisable, diffable, and reviewable.

### 3. The evaluator is law-free

`evaluate.ts` contains **no country name, no threshold, and no legal concept.**
Adding a jurisdiction is a new file in `src/catalog/`; it is not a change to
`evaluate.ts`. If a legal rule ever lands in the evaluator, it has escaped to a
place no reviewing lawyer will look, and that is a defect regardless of whether
the rule is correct.

### 4. Three-valued logic

Every criterion evaluates to `true`, `false` or `unknown` (Kleene). Absence of a
fact yields `unknown`, never `false`. An **empty array is a positive assertion**
("I hold no certificates") and yields `false`; an **absent array** yields
`unknown`. Both directions are tested.

Verdict precedence: closed pathway → `ineligible`; any escalation →
`requires_human_review`; blocking unmet → `ineligible`; blocking unknown →
`indeterminate`; material unmet or unknown → `indeterminate`. A `material`
criterion can hold back a yes but **can never produce a no**, because "likely to
be refused" is a prediction and predictions are advice
([ADR 0002](0002-advice-boundary-as-a-type.md)).

### 5. Citations are mandatory and structural

Every `Criterion` carries `citationIds` resolving to a `Citation` on the same
pathway. `validateCatalog` reports both dangling references
(`unresolved_citation_id`) and citations nothing uses (`unused_citation`), plus
`citation_stale`, `citation_aging`, `unknown_fact_path`, `unknown_leads_to`,
`duplicate_pathway_id`, `malformed_duration_spec` and `counsel_review_stale`.

A citation carries `discretionary: true` where the rule is administrative
practice rather than statutory text, and consumers must surface that rather than
presenting the number as settled law.

### 6. The review gate

Every pathway ships `reviewStatus: 'unreviewed'`. `recommend()` — the only
function that ranks anything — admits only `counsel_reviewed` pathways.
Unreviewed pathways still appear in **assessments**, because restating a rule
and doing arithmetic is not reserved; they never appear in a **ranking**.

### 7. Historical answers

`statusOn(pathway, asOf)` answers as of a date. The golden visa is `open` on
2025-04-02 and `closed` on 2025-04-03, so a matter opened before the repeal can
still be assessed against the rules then in force. Without this the catalog
could not explain any pre-repeal decision.

### 8. Omission beats invention

Where a figure could not be sourced, it is not encoded. Concretely, in the
current catalog: UGE-CE income and salary levels for the Spanish digital-nomad
and highly-qualified routes are encoded as "a figure was supplied" against a
discretionary citation rather than as a number; IPREM and SMI are supplied by
the caller and yield `unknown` when absent rather than a wrong answer; no
pathway populates `publishedProcessingDays`; and an occupation outside our
48-entry subset of CUSMA Appendix 2 routes to `requires_human_review` rather
than "unmet", because reporting "not a listed profession" for something we
simply have not encoded would be a false negative on someone's livelihood.

## Consequences

### What gets better

- **Counsel can review the actual rules**, in a form that maps to the
  instrument, without reading TypeScript. This is the property the whole design
  exists for.
- Adding a jurisdiction is additive and contained. The 137 tests over the
  evaluator do not need to change.
- Rule changes are diffable as data. "What changed in the Spanish rules" is a
  question a diff answers.
- An unsourced rule is hard to write, because `citationIds` is required and
  `validateCatalog` reports both dangling and unused citations.
- `unknown` is first-class, so an incomplete intake produces "we need more
  information" rather than a false refusal.
- The catalog can move to a database without touching the engine — it is already
  parsed at a boundary.

### What gets worse

- **The spec language is a language, and it has limits.** 18 operations cover
  the current catalog. A rule that needs a nineteenth requires a change to
  `evaluate.ts`, a new test, and care that the operation stays law-free and
  general rather than becoming "the Spain operation".
- **Indirection.** Reading a rule means reading a spec plus the fact model plus
  the derived facts. A hand-written function would be more immediately legible to
  an engineer — and illegible to the reviewer who matters more.
- **Calendar arithmetic lives outside the spec**, in `facts.ts` as
  `DerivedFacts`. The specs compare numbers; the day-counting happens before.
  That split is deliberate but it does mean a reviewer must check two places for
  anything time-based.
- **`unknown` propagates.** An incomplete applicant record yields
  `indeterminate` rather than a verdict, which is correct and is also
  unsatisfying to a user who wanted an answer. The report names the specific
  unknowns so the UI can ask for exactly what is missing.
- **The catalog is only as good as the review**, and today **nothing is
  reviewed**. The machinery is honest about that rather than hiding it, but the
  machinery is not a substitute for the review.

### What we can no longer do

- Write a bespoke eligibility function for "just this one tricky pathway".
- Ship a rule with no citation.
- Rank an unreviewed pathway.

## Alternatives considered

**A function per pathway.** Rejected: see Context. Unreviewable is
disqualifying.

**A general-purpose rules engine (JSON Logic, or an embedded scripting
language).** Rejected. A Turing-complete rule format is not reviewable either —
it just moves the unreviewable code into a string. A small closed operation set
is the property that makes review possible, and losing it defeats the purpose.

**Boolean logic with a separate "completeness" pass.** Rejected. Two passes that
must stay in sync, and the failure mode is a confident `false` for a fact nobody
supplied. Kleene logic makes the distinction structural.

**Store the catalog in the database from day one.** Deferred, not rejected. The
schema is already the boundary and `parsePathway` already validates untrusted
input, so this is a migration rather than a redesign. Keeping the catalog in
source today means it is diffed and code-reviewed in pull requests, which is
exactly the discipline an unreviewed legal catalog needs while it is being
built.

**Encode figures that "everyone knows"** — the circulating cumulative-absence
limits for Spanish continuous residence, an IRCC processing estimate, a UGE-CE
income multiple. Rejected. Three of four spot-checked PRD facts were wrong. A
figure encoded on the strength of practitioner commentary, against a rule where
being wrong restarts a ten-year clock, is not a feature.

## References

- `packages/pathways/src/schema.ts`, `evaluate.ts`, `integrity.ts`
- `packages/pathways/src/catalog/` — 8 pathways, 20 citations, 0 reviewed
- `packages/core/src/citation.ts` — `Citation`, `staleness`
- [LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md) · [PRD.md](../PRD.md)
