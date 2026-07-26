# Legal Catalog Review Protocol

> **Boundary note (Lane C, public-safe).** Public-safe protocol only. Counsel
> engagement records, correspondence and review evidence are private and live in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (`legal/`), per the repo-boundary contract. Do not commit counsel
> correspondence to this repository.

Last updated: 2026-07-26.

This document is the **protocol** — the checklist, the lifecycle, the staleness
rules. The document you hand a reviewer to explain what they are being asked to
do, what they are not, and what changes when they sign, is
[COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md). Read that first; work from
this.

### Research briefs

The encoders worked from two briefs, kept in [`research/`](research/). **Read the
relevant one before writing any criterion in that jurisdiction**, and read its
"what I could not establish" section before trusting anything adjacent to it —
that section is the fastest way to find where the catalog is thinnest.

| Brief | Researched | Covers |
|---|---|---|
| [Spain — the 2025 Reglamento de Extranjería](research/2026-07-25-spain-reglamento-2025.md) | 2026-07-25 | RD 1155/2024, its single amendment RD 316/2026, the five *arraigo* figures, and what the repeal of RD 557/2011 does to the existing catalog |
| [The United States — statutory frame](research/2026-07-26-us-immigration-frame.md) | 2026-07-26 | The immigrant/nonimmigrant split, the visa ≠ admission ≠ status ≠ benefit distinction, the numerical limits, and the scope exclusions in §9 |

Both were written by an agent, not by counsel. Neither is a review. Every pathway
built from either still ships `reviewStatus: 'unreviewed'`. **Canada has no
brief** — the Canadian records were researched per-file against Justice Laws, and
[COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md) CA-7 records what could not
be reached.

---

## Current state

> **No pathway in the Meridian catalog has been reviewed by counsel.**
>
> All 84 pathways carry `reviewStatus: 'unreviewed'` — every Spanish record,
> every Canadian record and every one of the 35 United States records added on
> 2026-07-26. **None may be used for advice-class output.** `recommend()`
> therefore returns an empty ranking today and lists every pathway as excluded
> with code `not_counsel_reviewed`.
>
> This is the system working as designed. It is not a bug, not a placeholder,
> and must not be "fixed" by changing a default.

Legal review is the gating item between a working engine and a sellable product.
It is not a missing feature; it is the thing the features are waiting for. The
United States expansion moved that gate rather than approaching it: the catalog
is now 71% larger and exactly as unreviewed as it was.

### What is shipped

**84 pathway records** exist in `packages/pathways/src/catalog/` across thirteen
source files, and all 84 are exported through `MERIDIAN_PATHWAY_CATALOG`.
`validateCatalog()` over the whole set returns **0 errors and 9 warnings**; the
nine are enumerated under [Known warnings](#known-warnings) below and every one
of them predates the United States block.

`catalog/index.ts` assembles that array by concatenating
`MERIDIAN_CATALOG_MODULES` — the thirteen modules written out in a fixed,
append-stable order — rather than by sorting. That is a legal constraint wearing
an engineering hat: `evaluateAll` and `assess` return reports in catalog order,
so the order must say nothing about merit, likelihood or priority. A list whose
order varied with the applicant's facts would be a ranking, and ranking is
advice, permitted only from `recommend()` and only over counsel-reviewed
records. Adding a module appends to the end of its jurisdiction's block; adding a
pathway appends to the end of its module, so nothing an existing reader saw ever
moves.

The jurisdiction blocks are therefore ES, then CA, then US, in the order the
catalog shipped them. **That says nothing about the corridors' size** — the
United States block went last because appending never renumbers what came
before, while Mexico to the United States is the largest bilateral corridor in
the world at roughly 11.3 million people and the top row of the atlas's own
uncovered work queue.

Re-derive the counts at any time:

```bash
node scripts/check-pathway-citations.mjs        # counts every record in the directory
node -e "import('./packages/pathways/dist/index.js').then(m => \
  console.log(m.MERIDIAN_PATHWAY_CATALOG.length))"
node -e "import('./packages/pathways/dist/index.js').then(m => \
  console.log(['ES','CA','US'].map(j => j + ': ' + m.pathwaysForJurisdiction(j).length).join('  ')))"
```

### Inventory as of 2026-07-26

| Package | Distinct citations | Marked `discretionary` | Carrying a URL |
|---|---|---|---|
| `pathways` (the pathway catalog) | 373 | 82 | 346 |
| `documents` | 23 | 15 | 5 |
| `govtech` | 16 | 9 | 13 |
| `presence` | 6 | 3 | 6 |
| `core` (`SCHENGEN_MEMBERSHIP`, jurisdiction tables) | not modelled as `Citation` | — | — |

The pathway catalog declares **378 citation constants** across its files; five
ids are re-declared in a second file with byte-identical `instrument` strings, so
373 distinct ids remain. That duplication is deliberate — see
[Working in the catalog](#working-in-the-catalog) — and the CI check enforces
that one id never carries two different instruments. All five re-declarations are
in the Canadian files; the four United States files namespace their ids (`us-`,
`us-eb-`, `us-sb-`) specifically so that four authors working in parallel could
not collide.

By kind: 170 `regulation`, 130 `statute`, 57 `official_guidance`, 8 `treaty`,
5 `policy`, 3 `case_law`. The United States block is the first that is
*statute-led* — 96 of its 177 distinct citations are `statute`, against 23 of 96
for Spain and 11 of 100 for Canada — because 8 U.S.C. carries thresholds that the
Spanish and Canadian systems leave to a reglamento or to a ministerial
instruction.

Per jurisdiction:

| | Spain | Canada | United States |
|---|---|---|---|
| Distinct citations | 96 | 100 | 177 |
| Carrying a URL | 86 | 91 | 169 |
| Marked `discretionary` | 21 | 26 | 35 |
| `verifiedOn` | 2026-07-25 | 2026-07-25 | 2026-07-26 |

`verifiedOn` differs by one day, so the staleness bands do too — see
[Citation staleness](#citation-staleness). Nothing was re-verified on 2026-07-26
that had been verified on 2026-07-25; the two dates mean two separate acts of
reading.

### Shape of the criteria

| | Whole catalog | Spain | Canada | United States |
|---|---|---|---|---|
| Pathways | 84 | 26 | 23 | 35 |
| Criteria | 449 | 140 | 121 | 188 |
| `blocking` / `material` / `informational` | 291 / 109 / 49 | 92 / 31 / 17 | 91 / 19 / 11 | 108 / 59 / 21 |
| Carrying `requiresHumanReview: true` | 154 | 21 | 44 | 89 |
| Carrying `humanReviewWhen` | 67 | 5 | 17 | 45 |
| Pathways with ≥1 unconditional escalation | 62 of 84 | 13 of 26 | 19 of 23 | 30 of 35 |
| Pathways populating `publishedProcessingDays` | 0 | 0 | 0 | 0 |
| `countsTowardNaturalisation` true / false / unset | 21 / 20 / 43 | — | — | — |
| `leadsTo` edges | 63, none dangling | — | — | — |

A pathway carrying an unconditional escalation returns `requires_human_review`
whenever it is open, for every applicant, because escalation outranks every
verdict rule except closure. **62 of 84 records behave this way.** That is a
design answer to the fact that `ApplicantFacts` models one person while much of
migration law does not; it is set out in full, with the argument for and against,
in section 6 of [COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md), and it is
the first thing a reviewer should form a view on.

**The United States block is where that design shows most.** 30 of its 35 records
escalate unconditionally, and the reason is structural rather than editorial: US
family and employment routes are at least half a test about somebody who is not
the applicant — a petitioner's citizenship, a sponsor's income and household
size, a sponsor's domicile, an employer's corporate relationship to a foreign
affiliate, the state of a labor certification — and `ApplicantFacts` models none
of them. The five records that can reach a verdict are the ones that turn on the
applicant's own facts: `us-tn-usmca-professional` and `us-b1-b2-visitor` can
return `eligible` or `ineligible`; `us-h1b-specialty-occupation`,
`us-l1a-intracompany-manager-executive` and `us-l1b-specialized-knowledge` can
return `ineligible` but never `eligible`, because specialty occupation,
managerial capacity and specialized knowledge are characterisations an
adjudicator makes and each criterion escalates exactly when it would otherwise
pass.

Two records are not routes at all. `us-unlawful-presence-bar-screening` and
`us-permanent-bar-screening` exist to raise the § 1182(a)(9) question, and each
carries an unconditional escalation so that `evaluate` can only ever return
`requires_human_review`. **That polarity is deliberate and must not be
"fixed".** Telling somebody the ten-year bar does not reach them, from a fact set
that holds no departure date, is the most expensive wrong answer available in
this corridor.

### Known warnings

`validateCatalog()` returns nine `warning`-severity issues and no errors. Each is
an editorial inconsistency between two records that are individually sound, which
is why they do not fail a build: they only misrender when several pathways appear
side by side in one bibliography.

- `citation_id_conflict` on `ca-cusma-citizenship-requirement`, declared on
  `ca-cusma-professional` and on the trader, investor and intra-company-transferee
  records with a different `url` (three warnings).
- `citation_id_conflict` on `ca-irpa-s-11-1`, declared on
  `ca-provincial-nominee-program` and on the spouse/partner-outland and
  dependent-child records with a different `url` (two warnings).
- `citation_id_conflict` on `ca-irpa-s-10-3`, declared on
  `ca-federal-skilled-worker` and `ca-provincial-nominee-program` with a
  different `provision` and `url` (one warning).
- `citation_note_divergence` on `ca-irpr-s-87-1`, annotated differently on
  `ca-express-entry-cec`, `ca-cusma-investor`, `ca-study-permit` and
  `ca-post-graduation-work-permit` (three warnings).

All nine are Canadian and all nine predate 2026-07-26. The United States block
added none. `tests/integrity.test.ts` asserts the whole list rather than a count,
so a newly introduced inconsistency fails there instead of hiding behind one that
was fixed the same week.

### What this did to the coverage figures

The atlas entry for the United States was promoted from `researched` to `encoded`
on 2026-07-26, because "its pathways are in the Meridian catalog" is now true of
it. `node scripts/atlas-coverage.mjs --as-of=2026-07-26` reports, verbatim:

```
STRUCTURAL COVERAGE — systems
encoded or better        1.20%   3 of 249  (CA, US, ES)
researched or better    50.60%   126 of 249

WEIGHTED COVERAGE — people
corridors weighted                    280 rows in the stock table
migrants in those rows        198,645,000
migrants on covered rows        1,207,000
covered fraction                  0.6076%   (both ends encoded or better)
stock table completeness           65.34%   (of 304,021,813 migrants worldwide)
```

**The weighted figure moved off zero for the first time, to 0.6076%.** Read what
that number actually is before quoting it. "Covered" means *both* ends of a
corridor are encoded, because a corridor is only as known as its least-known end,
and the whole of that 1,207,000 is two rows: Canada to the United States
(950,000) and the United States to Canada (257,000).

**Mexico to the United States — 11,280,000 people, the largest bilateral corridor
in the world — is still uncovered, and is still row 1 of the atlas's work
queue.** Encoding 35 United States pathways did not change that, because Mexico
is a destination system in its own right and remains `researched`. The corridor
this catalog is most for becomes covered when somebody encodes the Mexican
system, not when somebody adds more United States records.

Two pieces of prose outside this document contradict the figures above and are
recorded here rather than patched, because neither file belongs to the catalog:
`packages/atlas/src/coverage.ts:27` and `scripts/atlas-coverage.mjs:288` both
still say the weighted number is zero because "the two encoded jurisdictions do
not appear as the two ends of any single row". There are now three encoded
jurisdictions and two such rows. The script prints that sentence directly beneath
the 0.6076% it just computed.

---

## Pathways awaiting review

All 84 carry `reviewStatus: 'unreviewed'`. "Citations" is the count carried on
that record; "Criteria" is its criterion count.

### The per-jurisdiction picture, in one table

| Jurisdiction | Records | Counsel-reviewed | Open | Closed | Suspended | First encoded |
|---|---|---|---|---|---|---|
| Spain | 26 | **0** | 23 | 3 | 0 | 2026-07 |
| Canada | 23 | **0** | 19 | 2 | 2 | 2026-07 |
| United States | 35 | **0** | 35 | 0 | 0 | 2026-07-26 |
| **Total** | **84** | **0** | **77** | **5** | **2** | |

Nothing in any jurisdiction is counsel-reviewed. The column is written out per
jurisdiction rather than stated once because a reader scanning for "which country
is signed off" must not be able to find a blank and read it as a yes.

The United States column has no closed or suspended record, and that is a gap in
research rather than a fact about the system: no US route was traced back through
a repeal in this sweep. Spain's investor route and Canada's two paused
permanent-residence programs are in the catalog precisely because people hold
status under routes that have shut, and the equivalent US work has not been done.

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

### United States — 35 records

Added 2026-07-26 across four files. Every citation on every one of these records
carries `verifiedOn: '2026-07-26'`.

**Family-based — 9 records.** Eight of the nine escalate on the petitioner side,
because there is no petitioner in the facts model.

| Pathway id | Kind | Status | Criteria | Citations | File |
|---|---|---|---|---|---|
| `us-immediate-relative-spouse` | permanent_residence | open | 8 | 15 | `us-family.ts` |
| `us-immediate-relative-child` | permanent_residence | open | 8 | 13 | `us-family.ts` |
| `us-immediate-relative-parent` | permanent_residence | open | 7 | 13 | `us-family.ts` |
| `us-family-preference-f1` | permanent_residence | open | 8 | 16 | `us-family.ts` |
| `us-family-preference-f2a` | permanent_residence | open | 8 | 20 | `us-family.ts` |
| `us-family-preference-f2b` | permanent_residence | open | 8 | 16 | `us-family.ts` |
| `us-family-preference-f3` | permanent_residence | open | 7 | 16 | `us-family.ts` |
| `us-family-preference-f4` | permanent_residence | open | 7 | 15 | `us-family.ts` |
| `us-fiance-k1` | entry_facilitation | open | 7 | 7 | `us-family.ts` |

The single most consequential thing to check in this file is **structural rather
than textual**. The three immediate-relative records carry *no* visa-availability
criterion, and the five preference records each carry exactly one. That absence is
the encoding of § 1151(a)'s "Exclusive of aliens described in subsection (b)" read
with § 1151(b)(2)(A)(i): an immediate relative is outside the numerical limits and
a preference beneficiary is inside them, and on this corridor the difference is
years. A reviewer should confirm the divide and then confirm that no criterion
keys chargeability to nationality — it follows place of birth under § 1152(b), and
`tests/catalog-us-family.test.ts` pins both properties.

**Employment-based — 10 records.**

| Pathway id | Kind | Status | Criteria | Citations | File |
|---|---|---|---|---|---|
| `us-eb1a-extraordinary-ability` | permanent_residence | open | 4 | 14 | `us-employment.ts` |
| `us-eb1b-outstanding-professor-researcher` | permanent_residence | open | 5 | 12 | `us-employment.ts` |
| `us-eb1c-multinational-manager-executive` | permanent_residence | open | 4 | 12 | `us-employment.ts` |
| `us-eb2-advanced-degree-exceptional-ability` | permanent_residence | open | 6 | 21 | `us-employment.ts` |
| `us-eb2-national-interest-waiver` | permanent_residence | open | 4 | 19 | `us-employment.ts` |
| `us-eb3-skilled-worker` | permanent_residence | open | 5 | 16 | `us-employment.ts` |
| `us-eb3-professional` | permanent_residence | open | 5 | 17 | `us-employment.ts` |
| `us-eb3-other-worker` | permanent_residence | open | 4 | 16 | `us-employment.ts` |
| `us-eb4-special-immigrant-religious-worker` | permanent_residence | open | 5 | 12 | `us-employment.ts` |
| `us-eb5-immigrant-investor` | permanent_residence | open | 6 | 15 | `us-employment.ts` |

Every record states which side of § 1182(a)(5)(A) it sits on as a first-class
criterion rather than by omission: informational `*-no-labor-certification` on
EB-1, the national interest waiver, EB-4 and EB-5; blocking-and-escalating
`*-labor-certification` on EB-2 and all three EB-3 records.

**Nonimmigrant — 9 records.**

| Pathway id | Kind | Status | Criteria | Citations | File |
|---|---|---|---|---|---|
| `us-tn-usmca-professional` | work_permit | open | 6 | 12 | `us-nonimmigrant.ts` |
| `us-h1b-specialty-occupation` | work_permit | open | 4 | 13 | `us-nonimmigrant.ts` |
| `us-l1a-intracompany-manager-executive` | work_permit | open | 3 | 8 | `us-nonimmigrant.ts` |
| `us-l1b-specialized-knowledge` | work_permit | open | 3 | 8 | `us-nonimmigrant.ts` |
| `us-o1a-extraordinary-ability` | work_permit | open | 3 | 6 | `us-nonimmigrant.ts` |
| `us-e1-treaty-trader` | work_permit | open | 3 | 10 | `us-nonimmigrant.ts` |
| `us-e2-treaty-investor` | work_permit | open | 4 | 10 | `us-nonimmigrant.ts` |
| `us-f1-academic-student` | residence_permit | open | 4 | 9 | `us-nonimmigrant.ts` |
| `us-b1-b2-visitor` | entry_facilitation | open | 3 | 7 | `us-nonimmigrant.ts` |

`us-tn-usmca-professional` reads `CUSMA_PROFESSIONS` — the same table
`ca-cusma-professional` reads — rather than re-transcribing Appendix 2, because
8 CFR 214.6(c) reproduces the Appendix verbatim in United States regulation and
the substantive test is identical on both sides. A reviewer should read the two
records together, and note the one deliberate divergence: the US record accepts a
licence issued by a US, Canadian or Mexican state, provincial or federal
government, following the footnote in 214.6(c); `ca.ts` narrows it to Canadian
licences. **The shared table now holds all 63 of the regulation's professions**,
4 of them flagged for heightened scrutiny. A previous revision of this document
recorded 61, with Range Manager/Range Conservationist and Sylviculturist
(including Forestry Specialist) absent; both have since been added, so the
gap-to-a-person routing described there no longer applies to either. Verify with
`node -e "import('./packages/pathways/dist/index.js').then(m =>
console.log(m.CUSMA_PROFESSIONS.length))"`.
`us-f1-academic-student` must be re-verified in September 2026: 91 FR
44976 replaces duration of status with a fixed admission period on 2026-09-15,
and duration of status is what stops unlawful presence accruing before a formal
violation finding.

**Procedural layer, naturalisation and the bars — 7 records.**

| Pathway id | Kind | Status | Criteria | Citations | File |
|---|---|---|---|---|---|
| `us-adjustment-of-status` | permanent_residence | open | 4 | 12 | `us-status-bars.ts` |
| `us-consular-processing-immigrant-visa` | permanent_residence | open | 4 | 11 | `us-status-bars.ts` |
| `us-naturalization-five-year` | naturalization | open | 9 | 8 | `us-status-bars.ts` |
| `us-naturalization-spouse-three-year` | naturalization | open | 9 | 9 | `us-status-bars.ts` |
| `us-unlawful-presence-bar-screening` | entry_facilitation | open | 5 | 8 | `us-status-bars.ts` |
| `us-permanent-bar-screening` | entry_facilitation | open | 4 | 5 | `us-status-bars.ts` |
| `us-provisional-waiver-unlawful-presence` | entry_facilitation | open | 4 | 5 | `us-status-bars.ts` |

The two screening records are the ones described under [Shape of the
criteria](#shape-of-the-criteria) as being unable to decide anything. The five
propositions a reviewer should check first, because each is commonly stated
backwards: § 1182(a)(9)(B)(v)'s qualifying relative does **not** include a United
States citizen child; the (B) bars do **not** aggregate across separate trips
while (C) does, across the whole history since 1 April 1997; the three-year bar
requires a departure before proceedings commenced and the ten-year bar carries no
equivalent condition; the (B)(iii) exceptions, including time spent under 18, do
**not** reach (C); and `currentStatus: 'irregular'` is not a proxy for the manner
of last entry, because an overstayer after a lawful admission is irregular now and
*was* admitted.

Naturalisation was researched from primary text for this catalog and is **not**
covered by the research brief the rest of the US block worked from. § 1101(f)
could not be retrieved, so good moral character rests on § 1427(a)(3),
§ 1427(d)–(e) and 8 CFR 316.10 and does not cite it.

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
- **United States, out of scope by the same permanent decision as asylum:**
  refugee status under 8 U.S.C. 1157, withholding of removal, protection under
  the Convention Against Torture, U and T classification, and **VAWA
  self-petitions** under § 1154(a)(1)(A) and (B). VAWA is the one the reader is
  most likely to mistake for missing law rather than an excluded scope, so it is
  named in the `us-family.ts` header, in the immediate-relative-spouse
  relationship guidance and in the F2A relationship guidance, each pointing to a
  licensed attorney or a representative accredited by the Department of Justice.
  Special immigrant juveniles are excluded on the same ground and named on the
  EB-4 record.
- **United States, not researched rather than excluded:** the diversity immigrant
  programme of 8 U.S.C. 1153(c); temporary protected status; the H-2A and H-2B
  classifications; the E-3 Australian route; the O-1B, P and R classifications;
  every EB-4 special-immigrant branch other than religious workers; the EB-5
  regional-centre programme's own requirements beyond the ceilings on indirect
  jobs; and any closed or repealed US route at all — see the empty closed and
  suspended columns above.
- **United States, deliberately not quantified:** no priority date, no cut-off
  date, no queue position, no wait estimate and no probability of any
  discretionary grant appears anywhere in the 35 records. The *structure* of the
  numerical limits is encoded and cited — § 1151's worldwide levels, § 1151(d)'s
  140,000 employment-based level, § 1152(a)(2)'s 7 per cent per-country limit,
  § 1152(e)'s prorating for an oversubscribed area, § 1153(e)(1)'s strict
  priority-date order — and Mexico's position is stated as "one of four
  oversubscribed chargeability areas" with no figure. A test asserts that no
  string in the block matches the Visa Bulletin's own date format.
- All three: admissibility grounds beyond a self-declared criminal record —
  medical, security and misrepresentation are untouched throughout. In the US
  block the § 1182(a)(9) unlawful-presence and prior-removal grounds are the ones
  that most often decide a Mexican case, and they are named where they arise and
  encoded only as the two screening records.

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

The 2026-07-26 United States expansion produced three more of the same kind, and
each was found by reading the instrument rather than recalling it:

- **8 CFR 204.6(f) contradicts the statute and has not been conformed.** The
  regulation still states the EB-5 amounts as USD 1,800,000 and USD 900,000, from
  a 2019 rule that USCIS's own Policy Manual (6 USCIS-PM G.2) records as vacated
  by a federal court, citing *Behring Regional Center LLC v. Wolf*, 544 F. Supp.
  3d 937 (N.D. Cal. 2021). Congress enacted USD 1,050,000 and USD 800,000 in
  2022. The catalog encodes the statute and cites the dead paragraph explicitly so
  that a reader who finds it is not misled by it. **A reviewer should confirm the
  vacatur independently:** the catalog attributes it to USCIS's statement rather
  than to the report, which was not read.
- **The EB-4 religious-worker sunset is a live date trap.** § 1101(a)(27)(C)(ii)(II)
  and (III) still read "before September 30, 2015" in the codified text, and
  Congress extends the date by appropriations rider rather than by amending it.
  The most recent extension visible in the 2024 edition of the Code is
  Pub. L. 118-47, div. G, tit. I, § 104, substituting 30 September 2024.
  **Whether a later extension is in force could not be established**, and the
  criterion says so and escalates rather than picking an answer. The minister
  branch, clause (ii)(I), carries no expiry.
- **The NIW regulation is narrower than the statute it implements.** 8 CFR
  204.5(k)(4)(ii) speaks only of exceptional ability; § 1153(b)(2)(B)(i) waives
  subparagraph (A) generally and USCIS applies the waiver to advanced-degree
  professionals as well. Recorded as a divergence rather than smoothed over.

The other reason is tempo. Spain repealed its investor-residency route with
roughly three months' notice. Bulgaria and Romania acceded to Schengen in two
steps eleven months apart. Canada paused two permanent-residence programs within
sixteen days of each other in mid-2026. The United States replaces duration of
status for F, J and I admissions on 2026-09-15 by a rule published eight weeks
earlier, and its Visa Bulletin cut-off dates move monthly and can retrogress. A
catalog nobody re-verifies is a catalog that is quietly wrong, and the person who
finds out is an applicant at a counter.

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
   it resolves. **27 of the 373 pathway-catalog citations carry no URL**, which
   was deliberate: they were omitted rather than guessed, mostly because the
   publishing site refused automated access. Adding a confirmed one during review
   is a genuine improvement. Eight of the twenty-seven are United States
   citations and each names the reason: `travel.state.gov` refused automated
   retrieval, which is why both Visa Bulletin citations carry no link and instead
   instruct the reader to open the current bulletin by hand;
   `federalregister.gov` served its API but refused its HTML, so the three
   Federal Register citations carry the document number, publication date and
   effective date without a URL; and `fam.state.gov`'s certificate chain did not
   verify, so the two 9 FAM citations and *Matter of Arrabally and Yerrabelly*
   carry none. **Nothing in the catalog rests solely on a proposition from a
   source that could not be retrieved**, except where the citation's own note
   says it does.
5. **`kind` is accurate.** A published operational instruction is
   `official_guidance`, not `regulation`. This distinction is the difference
   between "the law says" and "the department currently does". 57 citations are
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
- The United States block flags both Visa Bulletin citations, *Matter of
  Dhanasar*, and every USCIS Policy Manual citation. The bulletin is the clearest
  case in the catalog: it is an administrative publication re-issued monthly whose
  own text warns that a date may retrogress, and its note records that **no figure
  from it is recorded anywhere in this catalog**.

**82 of 373 citations are currently flagged** — 21 Spanish, 26 Canadian, 35
United States. Enumerate them for a given pathway by reading its `citations`
array; every flagged entry carries a `note` that must name the discretionary part.

For the US records, a reviewer should expect the flag on anything resting on
adjudicator judgement rather than a statutory threshold, and there are many:
extraordinary ability, exceptional ability, the national interest, specialty
occupation, managerial and executive capacity, specialized knowledge,
substantiality of trade and of investment, the public charge ground, good moral
character, and the whole of the § 1182(a)(9) analysis. Where the flag is present
the criterion should also escalate; a discretionary citation on a criterion that
green-ticks is the combination to look for.

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
   criterion as `blocking` produces false refusals. The catalog holds 291
   `blocking`, 109 `material` and 49 `informational`; note that the Canadian files
   written in 2026-07 deliberately weight criminal-record criteria `material`
   where `es.ts` weights them `blocking`, on the ground that the administration
   obtains those documents of its own motion. Two US weightings are decisions
   rather than defaults and should be confirmed as such: `us-eb2-advanced-degree`
   is `material` because exceptional ability is an independent route into the same
   preference that this model cannot measure, so an `ineligible` on the degree
   branch would shut a door the statute leaves open; and every `*-visa-number-available`
   criterion is `material` because a number that is not available today is a wait
   rather than a refusal.
8. **`requiresHumanReview` / `humanReviewWhen` escalations are correctly
   placed.** 154 criteria escalate unconditionally and 67 conditionally. Each
   unconditional escalation carries a `humanReviewReason` naming the specific
   fact the model does not hold, so they can be retired one at a time as the fact
   model grows. Confirm three things per escalation: that it is genuinely
   undecidable by software rather than merely unimplemented; that a conditional
   escalation fires on the question actually arising rather than on every
   profile; and that the criterion's `evaluator` — which still runs, and whose
   result is discarded — is not being read by anyone as evidence. Where the
   evaluator is a stated placeholder, the file says so.

   The US files use one idiom heavily enough to be worth naming: a criterion whose
   `humanReviewWhen` is **deep-equal to its `evaluator`** escalates precisely when
   it would otherwise pass, which leaves a definite failure still reading as a
   failure while no pass is ever asserted. `us-h1b-specialty-occupation`,
   `us-l1a-managerial-or-executive-capacity`,
   `us-l1b-specialized-knowledge-capacity`, `us-eb1b-qualifying-job-offer`,
   `us-eb1c-managerial-or-executive-job-offer`, `us-eb3-professional-baccalaureate`
   and several others are built this way. Confirm that the direction is the one
   intended in each case; the mirror-image mistake — escalating on failure and
   green-ticking on success — would be invisible in a passing test suite and
   catastrophic in a report.
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
    43 records — unset means "not established", which is not `false`. Filling one
    in is real review value; guessing one is not. On the US records the
    `durations.note` is doing more work than the field name suggests: it is where
    the structure of a numerical limit lives, and on the three immediate-relative
    records it is where the *absence* of a queue is explained. Read those four
    notes as part of the rule.
13. **What is deliberately omitted is *correctly* omitted.** The named gaps are
    listed under [Not encoded, and named as such](#not-encoded-and-named-as-such)
    above, and each is disclosed in the record's own `summary` or `guidance`
    rather than left silent. Confirm each omission is safe rather than a false
    negative, and say so on the record. The omissions most likely to matter are
    the Spanish long-term-residence absence limits (stated in months, not
    converted to days), the Spanish family-of-Spanish-nationals route, and every
    IRCC operational figure in the Canadian temporary-residence records.
14. **The `leadsTo` graph is legally coherent.** A pathway that claims to bridge
    to another must actually do so. 63 edges exist and all resolve; 33 of them
    cross file boundaries, and every one of those 33 is Spanish or Canadian —
    **no US edge leaves the file that declares it**, which is why the four US
    modules could be wired in any order without breaking a bridge. Two Canadian
    edges are worth a second look because they encode a legal proposition rather
    than a convenience: `ca-study-permit` leads to
    `ca-post-graduation-work-permit` and only then to `ca-express-entry-cec`,
    because IRPR s. 87.1(3)(a) excludes work performed while engaged in full-time
    study from the qualifying year; and `ca-provincial-nominee-program` leads
    nowhere, because an enhanced nomination adds points to a profile that must
    already be eligible for a federal class rather than creating eligibility.

    Four US edges make a legal claim and should be read as such. `us-fiance-k1`
    leads only to `us-immediate-relative-spouse`, because the marriage happens
    after admission and the adjustment that follows is conditional under § 1186a.
    `us-f1-academic-student` leads to H-1B, TN and O-1A — study-to-work is real in
    this corridor and TN is genuinely reachable for a Mexican graduate — and the
    file says in terms that a bridge is not a recommendation.
    `us-unlawful-presence-bar-screening` leads to the provisional waiver and the
    waiver leads to consular processing, which is the actual sequence rather than a
    convenience. Six US records carry a bridge and 29 carry none — including all
    ten employment records, deliberately, so that nothing in `us-employment.ts`
    names an id from a sibling module.

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

This catalog now has **two** verification dates, one day apart, so it has two
sets of bands. That is not untidiness — it is the field working. Nothing was
re-read on 2026-07-26 that had been read on 2026-07-25, and moving the Spanish
and Canadian citations to the later date to make the table prettier would be
precisely the falsification point 1 below warns against.

| Citations | `verifiedOn` | `fresh` through | `aging` through | `stale` from |
|---|---|---|---|---|
| 196 Spanish and Canadian | 2026-07-25 | 2026-10-23 | 2027-01-21 | **2027-01-22** |
| 177 United States | 2026-07-26 | 2026-10-24 | 2027-01-22 | **2027-01-23** |

The build therefore goes red in two steps, on 2027-01-22 and again on 2027-01-23,
unless someone re-reads 373 instruments or removes what they cannot re-read.
`us-f1-academic-student` has an earlier deadline than either: 91 FR 44976 takes
effect on **2026-09-15**, and that record must be re-verified then regardless of
which band its citations are in.

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

**The script exists, runs, and passes.** On 2026-07-26, with the United States
block wired in, it reported:

```
check-pathway-citations: OK — as of 2026-07-26: 15 catalog files,
84 pathways, 378 citations, 1094 criterion references resolved
```

The `as of` date is the UTC date the script ran on, which is why a run late in
the Mexico City evening reports the following day. Staleness is measured against
it; the counts are what is fixed. The file count is 15 because it reads every
`.ts` file in the catalog directory, two of which (`index.ts` and
`cusma-professions.ts`) hold no pathway records.

A previous revision of this document recorded the guard **failing**, because
`catalog/index.ts` had been changed to derive `MERIDIAN_PATHWAY_CATALOG` from
`MERIDIAN_CATALOG_MODULES.flatMap(...)` and the script's anti-vacuity check reads
that constant as a literal array in the source text. That was the guard behaving
exactly as designed: its whole purpose is to refuse to confirm a shipped set it
cannot actually read, because a check that reads nothing agrees with everything.
It was resolved in the correct direction — `index.ts` now writes the catalog out
as a literal spread again, with a comment at the declaration explaining that the
guard anchors on it and that a computed catalog would leave the guard with nothing
to follow. The check was **not** relaxed.

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
7. Add the record to its file's own exported array, **and** — for a new file —
   add the file's aggregate in **three** places in `catalog/index.ts`: the
   `import`, the literal spread in `MERIDIAN_PATHWAY_CATALOG`, and the entry in
   `MERIDIAN_CATALOG_MODULES`. Otherwise the record exists and ships to nobody.
   Append to the end of the jurisdiction's block; never reorder.
   `tests/catalog-index.test.ts` catches all three omissions, and it catches a
   fourth that nothing else would: a file that exports a perfectly good `Pathway`
   and forgets to put it in its own array. Register the new module in that test's
   `MODULE_NAMESPACES` map as well — the test asserts the map and the module list
   agree, so a module added to one and not the other fails rather than being
   silently skipped.
8. Send it to counsel with [COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md).
   It ranks nothing until they have read it.

### Working in the catalog

Four things cost time during the 2026-07-25 expansion and are cheap to avoid. All
four cost time again on 2026-07-26, and the second one cost it in three of the
four United States files independently, which is why it is worth reading before
starting rather than after.

- **A citation id is global, and one id may carry only one `instrument`
  string.** Where two files genuinely need the same source, re-declare it
  locally with a **byte-identical** `instrument` — the check permits that and
  refuses any divergence. Where two files need *different* sources that would
  naturally share a slug, give each a distinct id. Five ids are currently
  re-declared this way, all in the Canadian files. The United States files avoid
  the question by namespacing: `us-` in `us-family.ts` and `us-nonimmigrant.ts`,
  `us-eb-` in `us-employment.ts`, `us-sb-` in `us-status-bars.ts`. That was worth
  doing because four people wrote them at the same time, and a collision surfaces
  as a *warning* rather than an error — which is exactly the kind of thing that
  gets lived with.
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

Ten encoders across two sweeps independently hit the same wall, and it is the
direct cause of most of the 154 unconditional escalations. Recorded here so the
next person changing `packages/pathways/src/facts.ts` knows what buys the most.
Nothing in this list has been added; `KNOWN_FACT_ROOTS` is closed and adding to it
is a change to a shared contract that needs its own review.

**The four United States encoders all reached the same conclusion first**, and it
is the same one the Spanish and Canadian family encoders reached: the model has
one person in it. Their ranked additions are set out under [What the United States
block would need](#what-the-united-states-block-would-need) below.

- **A second person.** A `sponsor` and/or `relationship` sub-object — relationship
  kind, the relative's age, nationality, immigration status, cohabitation,
  dependency, and the sponsor's own income and disqualifications. This alone
  would retire most escalations in `ca-family-pilots.ts`,
  `es-family-nationality.ts` and eight of the nine records in `us-family.ts`.
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

#### What the United States block would need

Ranked by how many escalations each would retire. The first four would convert
escalations into real answers; the rest would narrow them.

1. **A petitioner or sponsor as an entity** — relationship to the applicant,
   status (citizen vs lawful permanent resident), age, income, household size, and
   United States domicile. Eight of the nine family records can never return a
   verdict without it, and it is the same item as "a second person" above.
2. **Manner of last entry** — inspected and admitted, paroled, or entered without
   inspection. Without it there is no honest § 1255(a) criterion at all.
   `currentStatus: 'irregular'` is **not** a proxy: an overstayer after a lawful
   admission is irregular now and was admitted, and the § 1255(c)(2)
   immediate-relative exception reaches them while it does not reach somebody who
   entered without inspection. Getting this backwards is the difference between a
   filing fee and a decade.
3. **Employer identity and corporate relationship**, on both `JobOffer` and
   `WorkExperience`. `WorkExperience` carries a country and a period but no
   employer, so the whole L-1 and EB-1C qualifying-relationship test — "the same
   firm, affiliate or subsidiary", one continuous year inside a three-year window
   — is not expressible. Four criteria escalate for want of it alone.
4. **Labor certification state** — filed, certified, denied, expired, plus the DOL
   acceptance date. It *is* the priority date for PERM routes under 8 CFR
   204.5(d) and it expires 180 days after grant under 20 CFR 656.30(b). Four
   criteria escalate solely for want of it.
5. **Authorised-stay end date** (the Form I-94 admit-until date) as a fact
   distinct from `statusExpiresOn` if that is read as visa validity. Every
   nonimmigrant record turns on the admission period rather than on the visa, and
   the catalog currently has to explain the difference in prose because it cannot
   express it in a criterion.
6. **Unlawful-presence periods as `DateRange`s**, plus **dated departure and
   removal events** (`travelHistory.priorRemovals` is a count, and both
   § 1182(a)(9)(A)'s period and (C)(ii)'s ten years need a date). Note one
   arithmetic trap before anyone implements this: the count excludes **both** the
   I-94 expiry date and the day of departure, which is two exclusive endpoints in
   a codebase where every `DateRange` is closed and inclusive at both ends.
7. **Applicant marital status**, and marriage facts — the date, the spouse's
   status, and whether the spouse held citizenship throughout. Marital status is
   category-determinative in F1, F2B and F3 and is mutable in both directions; the
   marriage facts block the whole three-year naturalisation rule.
8. **A United States State or USCIS district**, or any sub-national residence
   unit. This one field is why both naturalisation records escalate
   unconditionally and can never return `eligible`.
9. **Presence of an approved petition or a filed case**, as a boolean, and a
   **priority date** recorded only so a report can say "your date is recorded".
   Neither may ever be compared against a cut-off.
10. Narrower, but each retires a specific escalation:
    `qualifyingInvestment.targetedEmploymentArea?: boolean` (one boolean decides
    whether the EB-5 minimum is USD 800,000 or USD 1,050,000, so an amount between
    them currently escalates); `qualifyingInvestment.jobsCreated?: number` with
    whether they are direct or indirect; a **credential-equivalency
    determination** flag on `ProfessionalCredential`, since both EB-2 and
    EB-3-professional turn on a foreign degree being *determined* equivalent and
    `EDUCATION_SCALE` records a level with no equivalency finding; whether
    experience is **progressive and post-baccalaureate**, since
    `professionalExperienceYears` is a bare count; **available funds** as a balance
    distinct from an income stream, plus the Form I-20 and an SEVP school
    identifier, for F-1; and **N-470 approval**, for the one-year-absence
    exception to continuous residence.

One derived field is worth noting as natural rather than needed: **CSPA age**
under § 1153(h) is civil-date arithmetic on two recorded dates and is exactly what
`@meridian/core` exists for. It should be a `DerivedFacts` key when the two dates
it needs exist, not a criterion that reimplements date maths in the spec language.
