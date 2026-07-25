# Contributing to Meridian

> **Boundary note (Lane C, public-safe).** Public-safe contribution guidance.
> Operational and deployment procedures live in the private
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> repo, per the repo-boundary contract.

Last updated: 2026-07-25.

Thank you for considering a contribution. Please read
[AGENTS.md](AGENTS.md) as well — it is the canonical operating doctrine for this
repository and it applies to humans, not only to agents.

---

## Before you start

**Read `packages/core/src/` first.** All of it — it is about 900 lines. It is
the shared contract every other package is built on, and its doc comments
explain *why* each type is shaped the way it is. Most review comments on a first
contribution are things that file already answers.

**Understand what this software is for.** Meridian tells a person whether they
are about to lose their immigration status. An off-by-one is not a cosmetic bug;
it is someone told they have three days when they have two. A fabricated legal
threshold is not a placeholder; it is advice that harms. Please hold the bar
accordingly.

---

## Prerequisites

- **Node** 22 (the root `package.json` sets `engines.node >= 20`; development is
  on 22)
- **pnpm** 9.15.9

```bash
git clone https://github.com/madfam-org/meridian
cd meridian
pnpm install
```

`pnpm install` is the only install you should ever need. If you believe you need
a new dependency, see *Dependencies* below — the answer is usually no.

---

## The three invariants

A change that breaks one of these is a defect regardless of what else it
improves. Each is explained at length in [AGENTS.md](AGENTS.md) and in the ADRs.

1. **Never use `Date` for calendar arithmetic.** Use `@meridian/core`'s
   civil-date module. `DateRange` is closed and inclusive at both ends.
   [ADR 0001](docs/adr/0001-civil-date-arithmetic.md)
2. **Every applied rule carries a `Citation`** — instrument, provision,
   jurisdiction, `verifiedOn`. [ADR 0005](docs/adr/0005-data-driven-pathway-catalog.md)
3. **Every engine output is born disclosure-classified.** Classification happens
   where the value is produced, never at render time.
   [ADR 0002](docs/adr/0002-advice-boundary-as-a-type.md)

---

## Code standards

TypeScript is strict, with `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`,
`noImplicitReturns` and `noFallthroughCasesInSwitch`. ESM throughout.

- **Relative imports must end in `.js`**, even though the file is `.ts`.
- **Type-only imports must use `import type`.**
- Return `Result<T, E>` for expected failures. "This applicant is ineligible" is
  a value, not an exception — an ineligibility thrown as an error gets swallowed
  by a `catch` and reported to a client as a system fault. Throw `MeridianError`
  with a stable `code` for genuine faults and at untyped boundaries.
- **No `TODO` comments for core functionality.** No function that throws "not
  implemented". No mock data standing in for a real answer. If you start it,
  finish it.
- **No marketing language and no fabricated metrics.** Do not write "typically
  4-6 weeks" unless a government body published it and you cite them.

### Doc comments

Write real ones, and explain **why**, especially where the reason is legal
rather than technical. Match the density and voice of `packages/core/src` — read
it before writing. The standard is that a reader six months from now, or a
lawyer reviewing the rule, can tell why the code is shaped this way without
asking anyone.

A doc comment that restates the function signature in prose is not a doc
comment.

### Formatting

Prettier is a devDependency and `pnpm format` runs it, but **there is no
prettier config file in the repository** and CI does not check formatting. Existing
code follows a roughly 100-110 character line width. Match the file you are
editing; do not reformat files you are not otherwise changing.

---

## Tests

Tests live in `tests/*.test.ts` and use vitest.

**Test what would actually hurt a person:**

- Boundary off-by-ones. Exactly 90 days compliant, 91 breaching by one. The day
  a window opens and the day it closes, on both sides.
- Leap years and 29 February.
- Empty input, and the difference between **absent** (unknown) and **empty
  array** (a positive assertion that there are none).
- Ordering independence. Shuffle the input with a seeded permutation and assert
  byte-identical output.
- Adversarial input: prototype pollution, a URL whose host parses as the wrong
  half of the string, an object carrying its data on its prototype.
- Timezone traps, since the whole point is that there are none.

**Prefer a test that cross-checks against an independent recomputation** over
one that restates the implementation. `packages/presence` cross-checks its
Schengen worst-day search against a brute-force day-by-day scan;
`packages/mrtd` reimplements check-digit arithmetic and field offsets in its
fixture builder so an off-by-one in `parse.ts` cannot self-confirm. That is the
standard.

**Fixtures must be synthetic.** Issuing state `ZZZ`, document numbers beginning
`ZZ`, `example.invalid` hostnames, invented names. Never a real MRZ — including
your own. See [SECURITY.md](SECURITY.md).

---

## Verification — run both, from the package directory

```bash
cd packages/<name>
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Both must exit clean before you open a pull request.

Across all packages:

```bash
pnpm -r --filter "./packages/*" typecheck
pnpm -r --filter "./packages/*" test
```

Whole repo, through turbo — this is what CI runs:

```bash
pnpm typecheck && pnpm test && pnpm build
```

And the three policy guards, which need no install and are the fastest signal
that an invariant broke rather than a build:

```bash
node scripts/check-advice-boundary.mjs
node scripts/check-no-credential-custody.mjs
node scripts/check-pathway-citations.mjs
```

> `check-no-credential-custody` scans the whole tree, `docs/` included. If you
> write documentation about the credential refusal, **describe the forbidden
> field names rather than spelling them** — otherwise the document itself trips
> the check. Only `packages/govtech/src/credential-guard.ts`,
> `packages/govtech/tests/` and the script itself are exempt.

---

## Dependencies

**Do not add one without a strong reason**, and never as a convenience.

- `@meridian/core`, `@meridian/mrtd` and `@meridian/presence` have **no runtime
  dependencies** beyond each other and the Node standard library. Keep it that
  way; `mrtd` in particular is intended to be embeddable in a mobile client.
- `zod` is used only at genuinely untyped boundaries — parsing a pathway record,
  or an employer-supplied JSON package. Adapter-constructed, already-typed inputs
  use the type system instead.
- If you think you need a package that is not already present, first try the
  Node standard library or what is already there. If you still need it, say so
  explicitly in the pull request with the reason.
- **Never run `pnpm install` or `pnpm add` while another agent or process may be
  working in the same worktree** — concurrent installs corrupt the shared store.

---

## Adding to the legal catalog

This has its own protocol, and it is stricter than the code standards.

Read [docs/LEGAL_CATALOG_REVIEW.md](docs/LEGAL_CATALOG_REVIEW.md) in full before
touching `packages/pathways/src/catalog/` or any `Citation` anywhere.

The short version:

1. **Do not invent law.** A small correct catalog beats a large fabricated one.
   Three of the four legal facts spot-checked from the source PRD were wrong —
   see [docs/PRD.md](docs/PRD.md).
2. If you are not confident a fact is accurate, **omit it**, or encode it with
   `discretionary: true` and a note saying counsel must verify. Where the source
   is administrative practice rather than a bright-line statutory threshold, say
   so in the note.
3. **A wrong pin-cite is worse than no pin-cite.** Leave `provision` empty rather
   than guessing. Same for `url`: include it only where you are confident it is
   canonical.
4. New pathways ship `reviewStatus: 'unreviewed'`. There is no other correct
   initial value, and it means the pathway ranks nothing until counsel reads it.
5. Rules go in `src/catalog/`, **never** in `evaluate.ts`. A legal rule in the
   evaluator has escaped to a place no reviewing lawyer will look.
6. Use `verifiedOn: '2026-07-25'` only for something you actually verified
   today, against the source. Never bump a `verifiedOn` for a citation you did
   not open.

**If you believe a rule in the catalog is legally wrong, that is a safety
issue.** Open an issue naming the instrument and provision. Do not include
applicant details.

---

## Pull requests

1. **Branch.** Never commit to `main` directly.
2. **One concern per pull request.** A legal-catalog change and a refactor in
   the same diff cannot be reviewed properly, because they need different
   reviewers.
3. **Describe the change and its consequences**, including what gets worse. A
   description that lists only benefits is not a description.
4. **State what you ran.** The exact commands and their output. "Tests pass" is
   not verification; `pnpm exec vitest run` reporting 146 passing in
   `packages/documents` is.
5. **Flag any change to an invariant, a citation, a `discretionary` flag, or a
   `reviewStatus`** prominently in the title and body. These need a different
   kind of attention.
6. **New architectural decisions get an ADR** in `docs/adr/`, in
   Context / Decision / Consequences form, with the costs stated. See
   [docs/adr/README.md](docs/adr/README.md).

### What reviewers will look for

- Does it use `Date`? Rejected.
- Does an applied rule lack a citation? Rejected.
- Does an output that ranks, orders, scores or predicts carry anything other
  than `advice`? Rejected.
- Does it add a credential field, or weaken the credential guard? Rejected —
  see [ADR 0003](docs/adr/0003-no-credential-custody.md).
- Does a test only restate the implementation?
- Does a doc comment explain why, or only what?
- Is a legal claim sourced, and is `discretionary` set honestly?

---

## Reporting

- **Security vulnerabilities**: security@madfam.io. Not a public issue. See
  [SECURITY.md](SECURITY.md).
- **A legal error in the catalog**: a public issue is fine — instrument and
  provision, no applicant details.
- **Anything containing personal data**: email, never an issue.

## Licence

Contributions are made under **AGPL-3.0-only**, the licence of this repository.
By submitting a pull request you agree your contribution is licensed under it.
