# Research briefs

> **Boundary note (Lane C, public-safe).** These are public-safe research notes
> built from published primary sources. They contain no client facts and no
> counsel correspondence.

**What these are.** Working briefs written by pathway encoders, from primary
sources, immediately before encoding a jurisdiction. Each one records what was
read, what it says, and — the section that matters most — **what its author could
not establish**.

**What they are not.** Not legal advice, not a review, not counsel-authored. Every
pathway built from any brief here still ships `reviewStatus: 'unreviewed'`. A
brief being confident about something is not evidence that it is right; it is
evidence that one agent read one source on one day.

| Brief | Researched | Covers |
|---|---|---|
| [Spain — the 2025 Reglamento de Extranjería](2026-07-25-spain-reglamento-2025.md) | 2026-07-25 | RD 1155/2024, its single amendment RD 316/2026, the five *arraigo* figures, and what the repeal of RD 557/2011 does to the pre-existing catalog |
| [The United States — statutory frame](2026-07-26-us-immigration-frame.md) | 2026-07-26 | The immigrant/nonimmigrant split, visa ≠ admission ≠ status ≠ benefit, the numerical limits, and the scope exclusions |

**Canada has no brief.** The Canadian records were researched per-file against
Justice Laws rather than from a single frame. What could not be reached is
recorded as CA-7 in
[COUNSEL_REVIEW_PACKET.md](../COUNSEL_REVIEW_PACKET.md) — IRCC's program delivery
instructions refused automated access throughout, which is why no PGWP
field-of-study list, language threshold or settlement-funds figure appears
anywhere in the catalog.

## How to use one

1. **Read it before writing any criterion in that jurisdiction.** Both briefs open
   with a numbered "bottom line" that is the fastest orientation available.
2. **Read its "what I could not establish" section before trusting anything near
   it.** That section is the honest map of where the catalog is thinnest, and it
   is the reason several criteria escalate rather than deciding.
3. **Prefer omitting a criterion to encoding anything from that section.** Both
   briefs say so in their own headers.
4. **Use the brief's research date as `verifiedOn`** for citations built from it —
   2026-07-25 for Spain, 2026-07-26 for the United States. That is why the catalog
   carries two verification dates and therefore two staleness bands; see
   [LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md#citation-staleness).

## Adding one

Name it `YYYY-MM-DD-<jurisdiction>-<subject>.md`, open with the same header block
the two existing briefs use (research date, the "an agent, not counsel"
disclaimer, and a pointer to the source register and the could-not-establish
section), and **add it to the table above and to the one in
[LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md#research-briefs)**. A brief
nobody links to is a brief nobody reads: both of these were unreferenced from
anywhere in `docs/` until 2026-07-26.
