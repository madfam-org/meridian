# Legal Catalog Review Protocol

> **Boundary note (Lane C, public-safe).** Public-safe protocol only. Counsel
> engagement records, correspondence and review evidence are private and live in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (`legal/`), per the repo-boundary contract. Do not commit counsel
> correspondence to this repository.

Last updated: 2026-07-25.

---

## Current state

> **No pathway in the Meridian catalog has been reviewed by counsel.**
>
> All 8 pathways carry `reviewStatus: 'unreviewed'`. **None may be used for
> advice-class output.** `recommend()` therefore returns an empty ranking today
> and lists every pathway as excluded with code `not_counsel_reviewed`.
>
> This is the system working as designed. It is not a bug, not a placeholder,
> and must not be "fixed" by changing a default.

Legal review is the gating item between a working engine and a sellable product.
It is not a missing feature; it is the thing the features are waiting for.

### Inventory as of 2026-07-25

| Package | Citations | Marked `discretionary` | Carrying a URL |
|---|---|---|---|
| `pathways` (the pathway catalog) | 20 | 5 | 7 |
| `documents` | 23 | 15 | 5 |
| `govtech` | 16 | 9 | 13 |
| `presence` | 6 | 3 | — |
| `core` (`SCHENGEN_MEMBERSHIP`, jurisdiction tables) | not modelled as `Citation` | — | — |

Every citation has `verifiedOn: '2026-07-25'`, meaning `fresh` until
**2026-10-23**, `aging` until **2027-01-21**, and `stale` thereafter.

### Pathways awaiting review

| Pathway id | Jurisdiction | Kind | Status | Criteria | Citations |
|---|---|---|---|---|---|
| `es-nationality-residence-reduced` | ES | naturalization | open | 8 | 7 |
| `es-nationality-residence-general` | ES | naturalization | open | 6 | 6 |
| `es-non-lucrative-visa` | ES | residence_permit | open | 5 | 2 |
| `es-digital-nomad-visa` | ES | residence_permit | open | 6 | 2 |
| `es-highly-qualified-professional` | ES | work_permit | open | 4 | 2 |
| `es-golden-visa` | ES | residence_permit | **closed** 2025-04-03 | 3 | 2 |
| `ca-cusma-professional` | CA | work_permit | open | 5 | 4 |
| `ca-express-entry-cec` | CA | permanent_residence | open | 5 | 2 |

---

## Why this protocol exists

Four legal facts were spot-checked against primary sources on 2026-07-25 during
the build. **Three of the four corrected either the source PRD or our own first
implementation** — see [PRD.md](PRD.md) for the detail. The brief was sourced
largely to practitioner commentary, and that ratio is what the citation and
review machinery is for.

The other reason is tempo. Spain repealed its investor-residency route with
roughly three months' notice. Bulgaria and Romania acceded to Schengen in two
steps eleven months apart. A catalog nobody re-verifies is a catalog that is
quietly wrong, and the person who finds out is an applicant at a counter.

---

## The `reviewStatus` lifecycle

`ReviewStatus` is `'unreviewed' | 'counsel_reviewed' | 'needs_reverification'`,
defined in `packages/pathways/src/schema.ts`.

```
        ┌──────────────┐
        │  unreviewed  │  ◄── every new pathway starts here. Non-negotiable.
        └──────┬───────┘
               │  counsel completes the checklist below
               ▼
     ┌───────────────────┐
     │ counsel_reviewed  │  ── the only state from which advice may be released
     └──────┬────────────┘
            │  a citation goes stale, the instrument is amended,
            │  a criterion changes, or the annual re-review falls due
            ▼
  ┌────────────────────────┐
  │  needs_reverification  │  ── behaves as unreviewed for release purposes
  └──────┬─────────────────┘
         │  counsel re-completes the checklist
         └──────────────► counsel_reviewed
```

`isCounselReviewed(pathway)` is the predicate `recommend()` reads. Only
`counsel_reviewed` passes. **`needs_reverification` does not pass** — a pathway
that was once reviewed and has since drifted is not a reviewed pathway.

A pathway in any state may still appear in an **assessment**. Restating a
published rule and doing arithmetic against the user's own record is not a
reserved act; recommending a route no licensed person has read is the exact
failure mode the whole system exists to prevent.

---

## What counsel must check

This checklist is what "reviewed" means. Reviewing a pathway is not reading its
summary; it is confirming each item below for that pathway.

### A. Provenance — for every citation on the pathway

1. **The instrument exists and is correctly named**, in the form it is actually
   cited in that jurisdiction.
2. **The provision is correct.** A wrong pin-cite is worse than an absent one,
   because it teaches the reader to stop checking. If the article number cannot
   be confirmed, the `provision` field should be empty rather than guessed.
3. **The text is currently in force**, in the consolidated version, on the
   review date. Note any pending amendment with a commencement date.
4. **The URL, where present, is canonical** — the official gazette or the
   government's own consolidated text, not a summary or an aggregator. Confirm
   it resolves. **13 of the 20 pathway-catalog citations carry no URL**, which
   was deliberate: they were omitted rather than guessed. Adding a confirmed one
   during review is a genuine improvement.
5. **`kind` is accurate.** A published operational instruction is
   `official_guidance`, not `regulation`. This distinction is the difference
   between "the law says" and "the department currently does".

### B. The `discretionary` flag

For every citation, confirm the flag is set correctly in both directions:

- **Set where it should not be** understates our confidence and adds noise.
- **Absent where it should be present is the dangerous direction**: it presents
  administrative practice as settled law.

Set `discretionary: true` where the criterion is administrative practice, a
screening threshold, published operational equivalence, or otherwise
discretionary. Where it is set, confirm the `note` explains *which part* is
discretionary. Two examples of the standard expected:

- `ca-cec-1560-hours` in `@meridian/presence` splits the 1,560-hour figure into
  its own citation marked `discretionary`, because 1,560 is IRCC's published
  operational equivalence (30 × 52) rather than a number in the Regulations.
  The regulatory citation and the operational one are separate objects.
- `SPAIN_NATIONALITY_CONTINUITY` encodes only a single-absence limb, marked
  discretionary, and leaves both cumulative limbs **undefined** with a note
  saying no cumulative figure is settled enough to assert. Figures circulate;
  none was confident enough to encode against a rule where being wrong restarts
  a ten-year clock. A test asserts they stay undefined.

Currently flagged `discretionary` in the pathway catalog, all needing explicit
confirmation: `es-cc-art-22-4`, `es-practice-claimed-nationality`,
`es-uge-criterios`, `ca-ircc-cec-guidance`, `ca-ircc-cusma-instructions`.

### C. Criteria semantics

For every `Criterion` on the pathway:

6. **The evaluator expresses the rule.** Criteria are declarative
   `EvaluatorSpec` data precisely so a reviewer who does not read TypeScript can
   check them. Confirm the comparison direction and the boundary: `more_than`
   183 is not `at_least` 183, and the difference is one day of someone's tax
   residency.
7. **`weight` is right.** `blocking` means failing it makes the applicant
   ineligible. `material` can hold back a yes but can **never** produce a no,
   because "likely to be refused" is a prediction and predictions are advice.
   `informational` never affects the verdict. Miscategorising a `material`
   criterion as `blocking` produces false refusals.
8. **`requiresHumanReview` / `humanReviewWhen` escalations are correctly
   placed.** Two exist today and both are deliberate:
   `ca-cusma-professional → ca-cusma-listed-profession` escalates when an
   occupation is not in our 48-entry subset of Appendix 2, because reporting
   "not a listed profession" for something we simply have not encoded would be a
   false negative on someone's livelihood; and
   `ca-express-entry-cec → ca-cec-one-year-canadian-experience` escalates rather
   than performing the full-time-equivalence conversion for part-time histories.
9. **Bilingual labels (`en` / `es`) say the same thing.** A criterion that reads
   as blocking in one language and advisory in the other is a defect.
10. **`guidance` text is `information`-class** — a neutral restatement of the
    rule, not a recommendation. No "you should", no "the best option is".

### D. Scope and completeness

11. **`status`, `openedOn` and `closedOn` are correct.** `statusOn(pathway, asOf)`
    answers historically, so a matter opened before a repeal is assessed against
    the rules then in force. The golden visa is `open` on 2025-04-02 and `closed`
    on 2025-04-03; confirm that date and confirm the transitional treatment (see
    the fourth correction in [PRD.md](PRD.md), which we deliberately did **not**
    encode).
12. **`durations` claims are supported or absent.** No pathway currently
    populates `publishedProcessingDays`, and none should unless a government body
    published the figure and it is cited. The golden visa deliberately does not
    claim `countsTowardNaturalisation`.
13. **What is deliberately omitted is *correctly* omitted.** Named gaps include:
    art. 22.1 Sephardic-origin route, art. 22.2 one-year cases, and the five-year
    refugee period in Spain; and the CEC full-time-equivalence conversion in
    Canada. Confirm each omission is safe rather than a false negative, and say
    so on the record.
14. **The `leadsTo` graph is legally coherent.** A pathway that claims to bridge
    to another must actually do so.

### E. Sign-off

15. Set `reviewStatus: 'counsel_reviewed'`, `reviewedBy` (the reviewing
    professional's identifier — a name or licence identifier, **not** contact
    details, since this repo is public), and `reviewedOn` (ISO 8601).
16. Refresh `verifiedOn` on every citation the reviewer actually checked. Do not
    bump a `verifiedOn` for a citation that was not opened; that is the one
    action that quietly destroys the value of the whole field.
17. **Bump the pathway `version`.** Review is a substantive change to the
    catalog.
18. File the reasoning — what was checked, against which consolidated text, on
    what date, and anything the reviewer flagged but did not change — privately
    in `internal-devops/legal/`. The public repo records the *state*, not the
    correspondence.

---

## Citation staleness

Bands are defined in `packages/core/src/citation.ts` and computed by
`staleness(citation, asOf)` from `citationAgeDays`.

| Band | Age since `verifiedOn` | Meaning | Action |
|---|---|---|---|
| `fresh` | ≤ 90 days | Usable without comment | None |
| `aging` | 91–180 days | Still usable; flagged in the admin console | Schedule re-verification |
| `stale` | > 180 days | Not to be silently trusted | **CI fails**; dependent rules must be re-verified |

Why 90 and 180 rather than a year: immigration rules move fast enough that a
citation nobody has looked at in half a year should not be relied on without
someone saying out loud that they still believe it. These bands are Meridian's
operational choice, not a legal requirement, and they are recorded as such.

### What to do when a citation goes stale

1. **Do not bump `verifiedOn` to clear the failure.** That is the single most
   damaging thing anyone can do to this system. `verifiedOn` means a human
   opened the source and read it. If nobody did, the field is a lie and every
   downstream check becomes decorative.
2. **Open the source.** Read the current consolidated text.
3. **If unchanged:** set `verifiedOn` to today. That is a real act of
   verification and it is enough.
4. **If changed:** move every dependent pathway to
   `needs_reverification` (which stops advice-class output immediately), update
   the citation and any criteria it supports, and put the pathway back through
   the section C checklist.
5. **If the source has moved or the URL is dead:** find the canonical location or
   remove the URL. Do not substitute an aggregator. A wrong link is worse than
   no link.
6. **If nobody is available to verify:** leave it stale. A failing check that
   tells the truth is more valuable than a passing one that does not. The admin
   console is meant to render this board as-is.

### The CI check

`scripts/check-pathway-citations.mjs` is declared in the root `package.json` and
is intended to fail the build on any `stale` citation and on the integrity codes
`validateCatalog()` already produces — `unresolved_citation_id`,
`unused_citation`, `unknown_leads_to`, `duplicate_pathway_id`,
`unknown_fact_path`, `malformed_duration_spec`, `counsel_review_stale`.

**The script exists and runs.** As of 2026-07-25 it reports:

```
check-pathway-citations: OK — as of 2026-07-25: 4 catalog files,
8 pathways, 20 citations, 63 criterion references resolved
```

It runs in CI as part of the `policy` job in `.github/workflows/ci.yml`, which
executes before any install — a legal invariant breaking is a different kind of
failure from a build breaking, and it should be reported as one.

The underlying detection logic lives in `@meridian/pathways` and is tested
there: `validateCatalog(catalog, asOf)` returns typed `IntegrityIssue`s and
`integrityErrors()` filters to the blocking ones.

Note what the check cannot do: it can tell you a citation is old. It cannot tell
you whether a human actually opened the source. That part is on the reviewer,
which is why point 1 below matters more than the automation.

---

## Adding a new pathway

1. Write it as a new record in `packages/pathways/src/catalog/<jurisdiction>.ts`.
   **Never in `evaluate.ts`** — if a legal rule lands in the evaluator it has
   escaped to a place no reviewing lawyer will look.
2. `reviewStatus: 'unreviewed'`. There is no other correct initial value.
3. Every criterion carries at least one `citationId` resolving to a citation on
   the same pathway. `validateCatalog` reports both dangling references and
   unused citations.
4. Prefer omission to invention. A pathway with four well-sourced criteria is
   worth more than one with twelve, four of which are guesses. If a criterion
   cannot be sourced, leave it out and record the gap in `guidance`.
5. Add tests that pin the things a future edit could quietly break: that a
   discretionary flag stays set, that an undefined limb stays undefined, that a
   status date is what it is.
6. Run both checks from `packages/pathways`:
   `pnpm exec tsc --noEmit` and `pnpm exec vitest run`.
7. Send it to counsel. It ranks nothing until they have read it.
