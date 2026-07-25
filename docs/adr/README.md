# Architecture Decision Records

> **Boundary note (Lane C, public-safe).** These records are public-safe design
> rationale. Private operational and corporate-structure decisions live in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (`decisions/` and `rfcs/`), per the repo-boundary contract.

An ADR records a decision that was hard, that a reader is likely to question, or
that would otherwise be re-litigated every six months. Each one is written in
Context / Decision / Consequences form and states its costs honestly — an ADR
that lists only benefits is a sales document, not a record.

ADRs are **immutable once accepted**. If a decision is reversed, write a new ADR
that supersedes the old one and mark the old one `superseded by NNNN`. Do not
edit the reasoning of a decision after the fact; the reasoning at the time is the
thing worth preserving.

Implementation status below was measured on 2026-07-25, during the repository's
initial build. Re-check it rather than trusting it.

| # | Title | Status | Implemented? |
|---|---|---|---|
| [0001](0001-civil-date-arithmetic.md) | Civil-date arithmetic without `Date` | Accepted 2026-07-25 | Yes — `@meridian/core`, used everywhere |
| [0002](0002-advice-boundary-as-a-type.md) | The advice boundary as a type, not a disclaimer | Accepted 2026-07-25 | Yes — libraries, API gate, route registry, CI guard. No API tests. |
| [0003](0003-no-credential-custody.md) | No custody of government credentials | Accepted 2026-07-25 | Yes — types, runtime guard, and CI guard |
| [0004](0004-fastify-over-nestjs.md) | Fastify over NestJS for the API | Accepted 2026-07-25 | Yes — but `apps/api` has no `src/main.ts` |
| [0005](0005-data-driven-pathway-catalog.md) | Data-driven pathway catalog with mandatory citations | Accepted 2026-07-25 | Yes — `@meridian/pathways`, 8 pathways, 0 reviewed |
| [0006](0006-ports-and-adapters-repositories.md) | Ports and adapters for repositories | Accepted 2026-07-25 | Yes — ports + both adapters. No contract test suite. |

## Statuses

- **Proposed** — under discussion, not binding.
- **Accepted** — binding. New code must comply.
- **Superseded by NNNN** — replaced; kept for the historical record.
- **Deprecated** — no longer applies and nothing replaced it.

"Accepted" does not mean "implemented". The table above tracks the two
separately, because conflating them is how a repository ends up documenting
software that does not exist.

## Writing a new one

Copy the shape of any existing record: a metadata block, then **Context**
(the forces, stated neutrally), **Decision** (what we will do, in the
imperative), **Consequences** (what gets better, what gets worse, and what we
are now unable to do), **Alternatives considered** (with the reason each was
rejected), and **References**.

Number sequentially. Never reuse a number.
