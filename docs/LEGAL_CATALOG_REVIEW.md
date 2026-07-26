# Legal Catalog Review Protocol

> **Boundary note (Lane C, public-safe).** Public-safe protocol only. Counsel
> engagement records, correspondence and review evidence are private and live in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (`legal/`), per the repo-boundary contract. Do not commit counsel
> correspondence to this repository.

Last updated: 2026-07-25.

This document is the **protocol** — the checklist, the lifecycle, the staleness
rules. The document you hand a reviewer to explain what they are being asked to
do, what they are not, and what changes when they sign, is
[COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md). Read that first; work from
this.

---

## Current state

> **No pathway in the Meridian catalog has been reviewed by counsel.**
>
> All 49 pathways carry `reviewStatus: 'unreviewed'`. **None may be used for
> advice-class output.** `recommend()` therefore returns an empty ranking today
> and lists every pathway as excluded with code `not_counsel_reviewed`.
>
> This is the system working as designed. It is not a bug, not a placeholder,
> and must not be "fixed" by changing a default.

Legal review is the gating item between a working engine and a sellable product.
It is not a missing feature; it is the thing the features are waiting for.

### What is shipped

**49 pathway records** exist in `packages/pathways/src/catalog/` across nine
source files, and all 49 are exported through `MERIDIAN_PATHWAY_CATALOG`.
`validateCatalog()` over the whole set returns **0 issues and 0 errors**.

`catalog/index.ts` assembles that array by concatenating
`MERIDIAN_CATALOG_MODULES` — the nine modules written out in a fixed,
append-stable order — rather than by sorting. That is a legal constraint wearing
an engineering hat: `evaluateAll` and `assess` return reports in catalog order,
so the order must say nothing about merit, likelihood or priority. A list whose
order varied with the applicant's facts would be a ranking, and ranking is
advice, permitted only from `recommend()` and only over counsel-reviewed
records. Adding a module appends to the end of its jurisdiction's block; adding a
pathway appends to the end of its module, so nothing an existing reader saw ever
moves.

Re-derive the counts at any time:

```bash
node scripts/check-pathway-citations.mjs        # counts every record in the directory
node -e "import('./packages/pathways/dist/index.js').then(m => \
  console.log(m.MERIDIAN_PATHWAY_CATALOG.length))"
```

### Inventory as of 2026-07-25

| Package | Distinct citations | Marked `discretionary` | Carrying a URL |
|---|---|---|---|
| `pathways` (the pathway catalog) | 196 | 47 | 178 |
| `documents` | 23 | 15 | 5 |
| `govtech` | 16 | 9 | 13 |
| `presence` | 6 | 3 | 6 |
| `core` (`SCHENGEN_MEMBERSHIP`, jurisdiction tables) | not modelled as `Citation` | — | — |

The pathway catalog declares **201 citation constants** across its files; five
ids are re-declared in a second file with byte-identical `instrument` strings, so
196 distinct ids remain. That duplication is deliberate — see
[Working in the catalog](#working-in-the-catalog) — and the CI check enforces
that one id never carries two different instruments.

By kind: 114 `regulation`, 37 `official_guidance`, 34 `statute`, 6 `treaty`,
4 `policy`, 1 `case_law`.

Every citation has `verifiedOn: '2026-07-25'`, meaning `fresh` until
**2026-10-23**, `aging` until **2027-01-21**, and `stale` thereafter.

### Shape of the criteria

| | |
|---|---|
| Criteria | 261 |
| `blocking` / `material` / `informational` | 183 / 50 / 28 |
| Carrying `requiresHumanReview: true` | 65 |
| Carrying `humanReviewWhen` | 22 |
| Pathways with at least one unconditional escalation | 32 of 49 |
| Pathways populating `publishedProcessingDays` | 0 |
| `countsTowardNaturalisation` true / false / left unset | 19 / 9 / 21 |
| `leadsTo` edges | 53, none dangling across the full 49-record set |

A pathway carrying an unconditional escalation returns `requires_human_review`
whenever it is open, for every applicant, because escalation outranks every
verdict rule except closure. **32 of 49 records behave this way.** That is a
design answer to the fact that `ApplicantFacts` models one person while much of
migration law does not; it is set out in full, with the argument for and against,
in section 6 of [COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md), and it is
the first thing a reviewer should form a view on.

---

## Pathways awaiting review

All 49 carry `reviewStatus: 'unreviewed'`. "Citations" is the count carried on
that record; "Criteria" is its criterion count.

### Spain — 26 records

| Pathway id | Kind | Status | Criteria | Citations | File |
|---|---|---|---|---|---|
| `es-nationality-residence-reduced` | naturalization | open | 9 | 7 | `es.ts` |
| `es-nationality-residence-general` | naturalization | open | 6 | 6 | `es.ts` |
| `es-non-lucrative-visa` | residence_permit | open | 5 | 2 | `es.ts` |
| `es-digital-nomad-visa` | residence_permit | open | 6 | 2 | `es.ts` |
| `es-highly-qualified-professional` | work_permit | open | 4 | 2 | `es.ts` |
| `es-golden-visa` | residence_permit | **closed** 2025-04-03 | 3 | 2 | `es.ts` |
| `es-arraigo-segunda-oportunidad` | residence_permit | open (from 2025-05-20) | 6 | 10 | `es-arraigo.ts` |
| `es-arraigo-sociolaboral` | residence_permit | open (from 2025-05-20) | 9 | 10 | `es-arraigo.ts` |
| `es-arraigo-social` | residence_permit | open (from 2025-05-20) | 7 | 10 | `es-arraigo.ts` |
| `es-arraigo-socioformativo` | residence_permit | open (from 2025-05-20) | 7 | 10 | `es-arraigo.ts` |
| `es-arraigo-familiar` | residence_permit | open (from 2025-05-20) | 6 | 10 | `es-arraigo.ts` |
| `es-arraigo-extraordinario` | residence_permit | **closed** 2026-07-01 | 6 | 4 | `es-arraigo.ts` |
| `es-work-permit-employed` | work_permit | open | 6 | 6 | `es-work-study.ts` |
| `es-work-permit-self-employed` | work_permit | open | 5 | 5 | `es-work-study.ts` |
| `es-student-stay` | residence_permit | open | 5 | 8 | `es-work-study.ts` |
| `es-student-work-modification` | work_permit | open | 5 | 5 | `es-work-study.ts` |
| `es-entrepreneur-residence` | residence_permit | open | 6 | 4 | `es-work-study.ts` |
| `es-long-term-residence-eu` | permanent_residence | open | 5 | 4 | `es-work-study.ts` |
| `es-long-term-residence-national` | permanent_residence | open | 3 | 7 | `es-work-study.ts` |
| `es-family-reunification` | residence_permit | open | 7 | 6 | `es-family-nationality.ts` |
| `es-eu-family-member-card` | residence_permit | open | 5 | 9 | `es-family-nationality.ts` |
| `es-eu-family-permanent-residence` | permanent_residence | open | 3 | 3 | `es-family-nationality.ts` |
| `es-nationality-option` | naturalization | open | 3 | 2 | `es-family-nationality.ts` |
| `es-nationality-democratic-memory-option` | naturalization | **closed** 2025-10-23 | 3 | 4 | `es-family-nationality.ts` |
| `es-nationality-carta-de-naturaleza` | naturalization | open | 3 | 4 | `es-family-nationality.ts` |
| `es-nationality-residence-sephardic` | naturalization | open | 7 | 7 | `es-family-nationality.ts` |

### Canada — 23 records

| Pathway id | Kind | Status | Criteria | Citations | File |
|---|---|---|---|---|---|
| `ca-cusma-professional` | work_permit | open | 5 | 4 | `ca.ts` |
| `ca-express-entry-cec` | permanent_residence | open | 5 | 2 | `ca.ts` |
| `ca-federal-skilled-worker` | permanent_residence | open | 7 | 16 | `ca-federal-economic.ts` |
| `ca-federal-skilled-trades` | permanent_residence | open | 7 | 15 | `ca-federal-economic.ts` |
| `ca-provincial-nominee-program` | permanent_residence | open | 5 | 8 | `ca-provincial-quebec.ts` |
| `ca-quebec-selection-csq` | permanent_residence | open | 3 | 7 | `ca-provincial-quebec.ts` |
| `ca-quebec-skilled-worker-pstq` | permanent_residence | open | 5 | 5 | `ca-provincial-quebec.ts` |
| `ca-quebec-experience-peq` | permanent_residence | open | 5 | 6 | `ca-provincial-quebec.ts` |
| `ca-lmia-work-permit` | work_permit | open | 7 | 4 | `ca-work-study.ts` |
| `ca-cusma-trader` | work_permit | open | 5 | 6 | `ca-work-study.ts` |
| `ca-cusma-investor` | work_permit | open | 5 | 6 | `ca-work-study.ts` |
| `ca-cusma-intra-company-transferee` | work_permit | open | 7 | 6 | `ca-work-study.ts` |
| `ca-study-permit` | residence_permit | open | 5 | 9 | `ca-work-study.ts` |
| `ca-post-graduation-work-permit` | work_permit | open | 5 | 6 | `ca-work-study.ts` |
| `ca-family-spouse-partner-outland` | permanent_residence | open | 5 | 13 | `ca-family-pilots.ts` |
| `ca-family-spouse-partner-inland` | permanent_residence | open | 6 | 11 | `ca-family-pilots.ts` |
| `ca-family-dependent-child` | permanent_residence | open | 5 | 12 | `ca-family-pilots.ts` |
| `ca-family-parent-grandparent` | permanent_residence | **suspended** 2026-07-15 | 3 | 9 | `ca-family-pilots.ts` |
| `ca-start-up-visa` | permanent_residence | **suspended** 2026-06-30 | 6 | 4 | `ca-family-pilots.ts` |
| `ca-atlantic-immigration` | permanent_residence | open | 6 | 4 | `ca-family-pilots.ts` |
| `ca-rural-community-pilot` | permanent_residence | open | 5 | 2 | `ca-family-pilots.ts` |
| `ca-rural-northern-pilot` | permanent_residence | **closed** 2024-09-01 | 4 | 4 | `ca-family-pilots.ts` |
| `ca-agri-food-pilot` | permanent_residence | **closed** 2025-05-14 | 5 | 3 | `ca-family-pilots.ts` |

The two suspension dates are recorded in the pathway's own prose and citations
rather than in a schema field: `PathwayStatus` has no `suspendedOn`, and
`closedOn` would make `statusOn()` answer "closed" for the past, which is wrong
for a paused route. Both records are `suspended` because the underlying class was
not repealed and intake may resume.

### Not encoded, and named as such

Recorded so an absence reads as a decision. Each is disclosed in the file that
would have held it, and the full list with reasons is in section 10 of
[COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md).

- **Asylum, refugee protection and humanitarian/compassionate claims — out of
  scope by decision, permanently.** They turn on credibility assessment rather
  than criteria, they concern people at risk, and a self-serve eligibility
  checker is the wrong instrument. The boundary is named in every module header
  written this sweep and in the guidance of the individual criteria where a
  reader most plausibly arrives with a protection question. **There is no
  catalog-level, user-visible statement of it yet**; that needs an owner in
  `catalog/index.ts` or in the applications.
- Spain: Título IV Cap. VII (family of Spanish nationals, arts. 93–99); art. 128
  humanitarian grounds and Título VII Caps. II–V; art. 69 independent residence
  as its own pathway; DA 20ª; Ley 12/2015 as a closed pathway.
- Canada: the Francophone Community Immigration Pilot; the super visa;
  intercountry adoption and orphaned-relative sponsorship; the "lonely Canadian"
  relative provision; provincial nominee stream criteria for any province.
- Both: admissibility grounds beyond a self-declared criminal record — medical,
  security and misrepresentation are untouched throughout.

---

## Why this protocol exists

Four legal facts were spot-checked against primary sources on 2026-07-25 during
the build. **Three of the four corrected either the source PRD or our own first
implementation** — see [PRD.md](PRD.md) for the detail. The brief was sourced
largely to practitioner commentary, and that ratio is what the citation and
review machinery is for.

The 2026-07-25 catalog expansion produced its own examples of the same thing.
Two are worth recording because they would each have been wrong from memory:

- **IRPR s. 87 changed on 30 March 2026** (`SOR/2026-63`). The former s. 87(3)
  substituted-evaluation power and the s. 87(4) concurrence requirement are
  repealed. Commentary written before that date describes a federal review step
  that no longer exists.
- **The BOE consolidated text of RD 240/2007 art. 2 still displays words the
  Tribunal Supremo annulled on 1 June 2010.** Reading the gazette is not by
  itself enough; the annulment has to be known and applied.

The other reason is tempo. Spain repealed its investor-residency route with
roughly three months' notice. Bulgaria and Romania acceded to Schengen in two
steps eleven months apart. Canada paused two permanent-residence programs within
sixteen days of each other in mid-2026. A catalog nobody re-verifies is a catalog
that is quietly wrong, and the person who finds out is an applicant at a counter.

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
   review date. Note any pending amendment with a commencement date. Where a
   consolidated text carries more than one version of an article, confirm which
   one the record encodes: several Spanish records deliberately encode the
   2026 wording of an article whose 2025 wording is still displayed alongside it.
4. **The URL, where present, is canonical** — the official gazette or the
   government's own consolidated text, not a summary or an aggregator. Confirm
   it resolves. **18 of the 196 pathway-catalog citations carry no URL**, which
   was deliberate: they were omitted rather than guessed, mostly because the
   publishing site refused automated access. Adding a confirmed one during review
   is a genuine improvement.
5. **`kind` is accurate.** A published operational instruction is
   `official_guidance`, not `regulation`. This distinction is the difference
   between "the law says" and "the department currently does". 37 citations are
   `official_guidance`; each marks a place where the catalog states the
   administration's practice.

### B. The `discretionary` flag

For every citation, confirm the flag is set correctly in both directions:

- **Set where it should not be** understates our confidence and adds noise.
- **Absent where it should be present is the dangerous direction**: it presents
  administrative practice as settled law.

Set `discretionary: true` where the criterion is administrative practice, a
screening threshold, published operational equivalence, or otherwise
discretionary. Where it is set, confirm the `note` explains *which part* is
discretionary. Four examples of the standard expected:

- `ca-cec-1560-hours` in `@meridian/presence` splits the 1,560-hour figure into
  its own citation marked `discretionary`, because 1,560 is IRCC's published
  operational equivalence (30 × 52) rather than a number in the Regulations.
  The regulatory citation and the operational one are separate objects.
- `SPAIN_NATIONALITY_CONTINUITY` encodes only a single-absence limb, marked
  discretionary, and leaves both cumulative limbs **undefined** with a note
  saying no cumulative figure is settled enough to assert. Figures circulate;
  none was confident enough to encode against a rule where being wrong restarts
  a ten-year clock. A test asserts they stay undefined.
- Canada's **67-point Federal Skilled Worker pass mark** is not in IRPR. s. 76(2)
  requires the Minister to fix and publish a minimum; the number appears only on
  IRCC's page, so it is a separate `official_guidance` citation marked
  discretionary. The same applies to the CLB thresholds on both federal economic
  classes, and to the CLB and hour figures on the Atlantic and rural pilots,
  where the regulation expressly reserves the number to the Minister.
- Spain's **arraigo** continuity and reporting criteria rest substantially on
  *Instrucciones SEM 1/2025* rather than on the Reglamento, and are flagged as
  such with the discretionary limb identified in each note.

**47 of 196 citations are currently flagged.** Enumerate them for a given
pathway by reading its `citations` array — every flagged entry carries a `note`
that must name the discretionary part.

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
   criterion as `blocking` produces false refusals. The catalog holds 183
   `blocking`, 50 `material` and 28 `informational`; note that the Canadian files
   written in 2026-07 deliberately weight criminal-record criteria `material`
   where `es.ts` weights them `blocking`, on the ground that the administration
   obtains those documents of its own motion.
8. **`requiresHumanReview` / `humanReviewWhen` escalations are correctly
   placed.** 65 criteria escalate unconditionally and 22 conditionally. Each
   unconditional escalation carries a `humanReviewReason` naming the specific
   fact the model does not hold, so they can be retired one at a time as the fact
   model grows. Confirm three things per escalation: that it is genuinely
   undecidable by software rather than merely unimplemented; that a conditional
   escalation fires on the question actually arising rather than on every
   profile; and that the criterion's `evaluator` — which still runs, and whose
   result is discarded — is not being read by anyone as evidence. Where the
   evaluator is a stated placeholder, the file says so.
9. **Bilingual labels (`en` / `es`) say the same thing.** A criterion that reads
   as blocking in one language and advisory in the other is a defect.
10. **`guidance` text is `information`-class** — a neutral restatement of the
    rule, not a recommendation. No "you should", no "the best option is". In this
    catalog `guidance` is also where every deliberate omission is disclosed, so
    it carries more legal weight than its name suggests: read it as part of the
    rule, not as help text.

### D. Scope and completeness

11. **`status`, `openedOn` and `closedOn` are correct.** `statusOn(pathway, asOf)`
    answers historically, so a matter opened before a repeal is assessed against
    the rules then in force. **`closedOn` is the first day applications were no
    longer accepted**, which is one day after an inclusive published deadline.
    Three records in this catalog turn on that reading and each should be
    confirmed against its source wording: `es-arraigo-extraordinario`
    (2026-07-01, from *"hasta el 30 de junio de 2026"*), `ca-rural-northern-pilot`
    (2024-09-01, from "received on or before August 31, 2024") and
    `ca-agri-food-pilot` (2025-05-14, from "accepted before this date"). The
    golden visa is `open` on 2025-04-02 and `closed` on 2025-04-03; confirm that
    date and confirm the transitional treatment (see the fourth correction in
    [PRD.md](PRD.md), which we deliberately did **not** encode).
12. **`durations` claims are supported or absent.** No pathway populates
    `publishedProcessingDays`, and none should unless a government body published
    the figure and it is cited. `countsTowardNaturalisation` is left **unset** on
    21 records — unset means "not established", which is not `false`. Filling one
    in is real review value; guessing one is not.
13. **What is deliberately omitted is *correctly* omitted.** The named gaps are
    listed under [Not encoded, and named as such](#not-encoded-and-named-as-such)
    above, and each is disclosed in the record's own `summary` or `guidance`
    rather than left silent. Confirm each omission is safe rather than a false
    negative, and say so on the record. The omissions most likely to matter are
    the Spanish long-term-residence absence limits (stated in months, not
    converted to days), the Spanish family-of-Spanish-nationals route, and every
    IRCC operational figure in the Canadian temporary-residence records.
14. **The `leadsTo` graph is legally coherent.** A pathway that claims to bridge
    to another must actually do so. 53 edges exist and all resolve; 33 of them
    cross file boundaries. Two are worth a second look because they encode a
    legal proposition rather than a convenience: `ca-study-permit` leads to
    `ca-post-graduation-work-permit` and only then to `ca-express-entry-cec`,
    because IRPR s. 87.1(3)(a) excludes work performed while engaged in full-time
    study from the qualifying year; and `ca-provincial-nominee-program` leads
    nowhere, because an enhanced nomination adds points to a profile that must
    already be eligible for a federal class rather than creating eligibility.

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

For this catalog, with every citation at `2026-07-25`: `fresh` through
**2026-10-23**, `aging` through **2027-01-21**, `stale` from **2027-01-22** — at
which point the build fails until someone re-reads 196 instruments or removes
what they cannot re-read.

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
fails the build on any `stale` citation and on the integrity codes
`validateCatalog()` already produces — `unresolved_citation_id`,
`unused_citation`, `unknown_leads_to`, `duplicate_pathway_id`,
`unknown_fact_path`, `malformed_duration_spec`, `counsel_review_stale`. It also
enforces that one citation id never carries two different `instrument` strings
across the catalog, because a footnote resolving to whichever record loaded last
is worse than no footnote.

**The script exists and runs.** On 2026-07-25, before the catalog index was
refactored, it reported:

```
check-pathway-citations: OK — as of 2026-07-26: 11 catalog files,
49 pathways, 201 citations, 511 criterion references resolved
```

The `as of` date is the UTC date the script ran on, which is why a run late in
the Mexico City evening reports the following day. Staleness is measured against
it; the counts are what is fixed. The file count is 11 because it reads every
`.ts` file in the catalog directory, two of which (`index.ts` and
`cusma-professions.ts`) hold no pathway records.

> **The script is failing as of this writing and needs re-anchoring, not
> silencing.** `catalog/index.ts` now derives `MERIDIAN_PATHWAY_CATALOG` from
> `MERIDIAN_CATALOG_MODULES.flatMap(...)` rather than from a literal array, and
> the script's anti-vacuity check reads that constant by pattern:
>
> ```
> check-pathway-citations: FAILED
> - packages/pathways/src/catalog/index.ts declares no MERIDIAN_PATHWAY_CATALOG array.
> ```
>
> This is the guard behaving exactly as designed. Its whole purpose is to refuse
> to confirm a shipped set it cannot actually read, because a check that reads
> nothing agrees with everything. The fix is in the script — teach it to follow
> the module list — and **not** to relax the check. Every other assertion the
> script makes (citation freshness, one-id-one-instrument, dangling references,
> parser-versus-raw counts) passed on the same run.

It runs in CI as part of the `policy` job in `.github/workflows/ci.yml`, which
executes before any install — a legal invariant breaking is a different kind of
failure from a build breaking, and it should be reported as one.

The underlying detection logic lives in `@meridian/pathways` and is tested
there: `validateCatalog(catalog, asOf)` returns typed `IntegrityIssue`s and
`integrityErrors()` filters to the blocking ones.

Note what the check cannot do: it can tell you a citation is old. It cannot tell
you whether a human actually opened the source. That part is on the reviewer,
which is why point 1 above matters more than the automation.

---

## Adding a new pathway

1. Write it as a new record in `packages/pathways/src/catalog/<file>.ts`.
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
7. Add the file's aggregate to `MERIDIAN_PATHWAY_CATALOG` in
   `catalog/index.ts`, or the record exists but ships to nobody.
8. Send it to counsel with [COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md).
   It ranks nothing until they have read it.

### Working in the catalog

Four things cost time during the 2026-07-25 expansion and are cheap to avoid.

- **A citation id is global, and one id may carry only one `instrument`
  string.** Where two files genuinely need the same source, re-declare it
  locally with a **byte-identical** `instrument` — the check permits that and
  refuses any divergence. Where two files need *different* sources that would
  naturally share a slug, give each a distinct id. Five ids are currently
  re-declared this way, all in the Canadian files.
- **The citation check reads string literals, not constants.** `instrument`,
  `jurisdiction`, `id`, `version` and `verifiedOn` must be written as literals in
  the citation object. A shared `const INSTRUMENT = '…'` referenced as
  `instrument: INSTRUMENT` reads as absent and fails with "names no instrument".
- **An ASCII apostrophe inside any of those five fields makes the field
  unreadable to the same parser.** French and Spanish instrument titles are full
  of them. Use U+2019 (’), which is typographically correct in both languages and
  matches the existing style in `ca.ts`.
- **A `citations:` array may not use a spread.** The parser refuses it rather
  than skipping it, because silently skipping would leave the pathway unchecked.

### Facts the catalog needs and does not have

Six encoders independently hit the same wall, and it is the direct cause of most
of the 65 unconditional escalations. Recorded here so the next person changing
`packages/pathways/src/facts.ts` knows what buys the most. Nothing in this list
has been added; adding any of it is a change to a shared contract and needs its
own review.

- **A second person.** A `sponsor` and/or `relationship` sub-object — relationship
  kind, the relative's age, nationality, immigration status, cohabitation,
  dependency, and the sponsor's own income and disqualifications. This alone
  would retire most escalations in `ca-family-pilots.ts` and
  `es-family-nationality.ts`.
- **Physical presence distinct from legal residence** (`presencePeriods`), plus a
  window-aware absence derivation such as `absenceDaysInLastYears(n)`. This is
  what forces the arraigo escalations, and it would serve every European
  regularisation route.
- **Work measured in hours over a caller-supplied window.** Every Canadian
  program in this catalog states its threshold in hours (1,560 or 3,120) over a
  window that is not three years; `derived.canadianSkilledWorkDaysLastThreeYears`
  is the wrong unit, the wrong window and the wrong filter.
- **Per-ability language scores.** `LanguageCertification.level` is one number
  where nearly every threshold in both jurisdictions is "in all four abilities",
  and Quebec measures on a scale the enum cannot express at all.
- **A subnational field** — intended province, and `province`/`region` on work
  and education history. Everything provincial currently hangs off a single
  boolean.
- **A held-document fact**: a nomination, a selection certificate, an
  educational credential assessment, an admission letter, or an administrative
  report, each with issuer and dates. The load-bearing document on several routes
  cannot currently be recorded at all.
- **Funds as a balance**, distinct from income as a stream; and whether health
  cover is public rather than private.
- **A filing-window operator** comparing one date field against another plus a
  period. Several routes in both jurisdictions have "two months before / three
  months after" windows that are currently inexpressible.
