# Meridian Agent Operating Guide

<!-- MADFAM-AGENTS-CANONICAL v1 -->

This is the canonical instruction file for Claude, Codex, and any other LLM
agent working in this repository. `CLAUDE.md` is kept only as a compatibility
redirect and must not become the source of truth again.

> **Boundary note (Lane C, public-safe).** This repo is PUBLIC. Everything here
> is public-safe service documentation. Private operational context — cluster
> access, secret paths, operator gates, incident detail — belongs in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops),
> per [`docs/repo-boundary-contract.md`](https://github.com/madfam-org/internal-devops/blob/main/docs/repo-boundary-contract.md).
> When in doubt, put the detail there and leave a one-line summary plus a link here.

Last updated: 2026-07-25.

---

## Required operating doctrine

- **Read this file, then `packages/core/src/`, before making repo changes.**
  `@meridian/core` is the shared contract; every other package is built on it
  and the doc comments in it explain *why* each type is shaped the way it is.
- Prefer existing repo conventions, scripts, and docs over introducing new
  patterns.
- Preserve user work. Never revert unrelated changes.
- **Never invent law.** A small correct catalog beats a large fabricated one. If
  you are not confident a legal fact is accurate, omit it, or encode it with
  `discretionary: true` and a note saying counsel must verify. Where the source
  is administrative practice rather than a bright-line statutory threshold, say
  so in the note. A confidently wrong pin-cite is worse than no pin-cite.
- **No marketing language, no fabricated metrics, no invented percentages.**
  Do not write "typically 4-6 weeks" unless a government body published it and
  you cite them.
- **No stubs.** No `TODO` for core functionality, no function that throws "not
  implemented", no mock data standing in for a real answer. If you start it,
  finish it, or do not start it.
- Treat production operations as Enclii-first: use Enclii web, API, or CLI for
  provisioning, deployment, observability, domains, secrets, scaling, rollback,
  and remediation. Raw `kubectl`, `helm`, SSH, provider CLIs and `docker exec`
  are platform bootstrap or documented break-glass only. Record any missing
  Enclii adapter gap rather than normalising raw production access in docs.
- This repo is public. No secrets, no credentials, no real personal data, no
  real travel-document numbers, ever — including in tests and fixtures.

---

## The three invariants

These are not style preferences. Each one exists because breaking it harms a
person, and each is enforced by tests today.

### 1. Never use `Date` for calendar arithmetic

Immigration day-counting is *civil-date* arithmetic. "The day you entered Spain"
is a calendar day, not an instant. `new Date('2025-03-01')` is midnight UTC,
which is 2025-02-28 in Mexico City, and that single hour turns a lawful 90-day
Schengen stay into a 91-day overstay on a report a border officer will read.

Use `@meridian/core`'s `civil-date` module for everything:

```ts
import { addDays, addMonths, diffDays, dateRange, mergeRanges,
         overlapDays, complementRanges, lookbackWindow, type IsoDate } from '@meridian/core';
```

`DateRange` is **closed and inclusive at both ends**. A 2025-01-01 → 2025-01-01
range is one day, not zero. `rangeLengthDays` returns `diffDays + 1`. Windows,
lookbacks and residence periods all follow this convention; mixing a half-open
window into a closed-range engine is an off-by-one that will not show up until
it matters.

There is exactly one sanctioned clock read in the whole repo: `todayUtc()` in
`@meridian/mrtd`, which exists so a caller can override it. Every other
reference date is a parameter. Do not add a second clock.

### 2. Every applied rule carries a `Citation`

```ts
interface Citation {
  id: string; kind: SourceKind; instrument: string; provision?: string;
  url?: string; jurisdiction: string; verifiedOn: IsoDate;
  discretionary?: boolean; note?: string;
}
```

A threshold, requirement or eligibility criterion without a citation is a defect
even if the number is right, because nobody downstream can check it and nobody
can re-verify it when the law moves. Spain repealed the investor-residency route
with roughly three months' notice; that is the tempo this field is designed for.

- `verifiedOn` is when a **human** last checked the cited text against the
  source. Use `'2026-07-25'` for anything verified in the current sweep.
- `discretionary: true` when the rule is administrative practice, a screening
  criterion, or a published operational equivalence rather than statutory text.
  Consumers must surface this instead of presenting the number as settled law.
- Include a `url` only when you are confident it is canonical. A dead or wrong
  link teaches the reader to stop checking.
- Staleness bands: `fresh` ≤90d, `aging` ≤180d, `stale` >180d. See
  [docs/LEGAL_CATALOG_REVIEW.md](docs/LEGAL_CATALOG_REVIEW.md).

### 3. Every engine output is born disclosure-classified

`DisclosureClass` is `'information' | 'assessment' | 'advice'`.

| Class | Definition | Example |
|---|---|---|
| `information` | Neutral restatement of a published rule, cited, not applied to the user | "Art. 22 sets a two-year residency period for the listed nationalities." |
| `assessment` | The user's own facts measured against a cited rule, arithmetic shown | "You have 610 recorded days; the rule states 730." |
| `advice` | A recommendation, ranking, strategy, or prediction of outcome | "You should apply under the CUSMA route first." |

Classification happens **where the value is produced**, never at render time.
Wrap it in `Disclosable<T>` and let `canRelease(classification, context)` decide
whether it may reach the audience. If it may not, it is downgraded — never
suppressed silently, and never upgraded.

Practical test when you are unsure: **anything that ranks options, orders them,
scores them, or says what someone should do is `advice`.** A sort order is a
recommendation. So is a percentage chance of success — and that one would be
fabricated besides, since no authority publishes the underlying data.

An `assessment` or `advice` carrying an empty `citationIds` array is a defect.
If a function has nothing to cite, it is probably `information` or a raw query,
not an assessment — see the deliberate exception documented at the top of
`packages/presence/src/index.ts` for how to reason about that case.

---

## Where things live

```
packages/core/        the shared contract — read before writing anything
packages/mrtd/        ICAO Doc 9303 MRZ. Imports nothing from Meridian.
packages/presence/    presence ledger and day-count engines
packages/pathways/    declarative rules engine + the pathway catalog
packages/documents/   legalisation, translation, freshness, checklist, gaps
packages/govtech/     government adapters, capability reporting, credential refusal
apps/api/             Fastify. auth/ · disclosure/ · repositories/ · audit/ · routes/
                      prisma/schema.prisma. NO src/main.ts yet, and NO tests.
apps/web/             applicant portal, Next.js 15 App Router, port 6101. No tests.
apps/admin/           firm console, Next.js 15 App Router, port 6102. No tests.
docs/                 PRD, architecture, regulatory posture, catalog review, ADRs
scripts/              the three policy guards — all three run clean
infra/k8s/production/ namespace, deployments, services, kustomization, secrets template
enclii.yaml           four Enclii service documents · Dockerfile.{api,web,admin}
.github/workflows/    ci.yml (policy · typecheck · test · build) + build-deploy.yml
```

The `packages/` are mature — 32 test files, 901 tests. The `apps/` landed during
the repository's initial build session, have **no tests at all**, and `apps/api`
has **no server entry point**. Treat any status claim about the apps as needing
re-verification; treat the packages as the stable contract.

### Where the API's invariants are enforced

If you touch `apps/api`, these are the parts that are load-bearing rather than
incidental:

- `src/routes/registry.ts` — a Fastify `onRoute` hook **refuses to register any
  route** whose config lacks a `meridian` block declaring whether it returns
  engine output. The server does not start until a new route answers that.
- `src/disclosure/gate.ts` — builds the `ReleaseContext` and applies
  `canRelease`. A downgraded value is **re-checked**, so a downgrade that still
  returns `advice` cannot walk past the boundary.
- `src/disclosure/leak-detector.ts` — a backstop for a route declaring
  `engineOutput: false` that returns a raw engine value anyway.
- `src/repositories/types.ts` — **no interface method takes a tenant id.** A
  repository comes from `forTenant()` with the id from a verified token, so
  there is no call a handler could make that reads another tenant's row.
- `src/audit/writer.ts` — `append` and `list`, and nothing else. No update, no
  delete. A trail that can be edited is not evidence.
- `src/auth/verifier.ts` — RS256 checked twice (before and during verification);
  issuer **and** audience both required.

Dependency direction is strictly one-way: `core` ← everything;
`pathways` ← `documents`. `mrtd` depends on nothing. There are no cycles and
adding one is not an acceptable trade.

### Package boundaries you must not cross

- **`packages/core` is the contract.** Changing it changes every package. If you
  are working on one domain package, do not "just add a helper" to core.
- **The evaluator is law-free.** `packages/pathways/src/evaluate.ts` contains no
  country name, no threshold, and no legal concept. Adding a jurisdiction is a
  new file in `src/catalog/`. If a legal rule ever lands in `evaluate.ts` it has
  escaped to a place no reviewing lawyer will ever look, which defeats the whole
  design.
- **A package's `src/index.ts` is its only public surface.** The `exports` map
  is `{ ".": "./src/index.ts" }`. Raw engines behind a disclosure wrapper are
  unreachable from outside on purpose; do not widen the exports map to "make
  testing easier".

---

## TypeScript rules

Strict, with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax`, `isolatedModules`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`. ESM throughout.

- **Relative imports must end in `.js`.** `import { x } from './thing.js'` even
  though the file is `thing.ts`.
- **Type-only imports must use `import type`.** `verbatimModuleSyntax` will
  reject the alternative.
- Domain code returns `Result<T, E>` for expected failures. "This applicant is
  ineligible" is a value, not an exception — an ineligibility thrown as an error
  gets swallowed by a `catch` and reported to a client as a system fault.
- Throw `MeridianError` with a stable `code` only for genuine faults and at
  untyped boundaries.

## Tests

Tests live in `tests/*.test.ts` and use vitest. Test what would actually hurt a
person:

- Boundary off-by-ones. Exactly 90 days compliant, 91 breaching by one.
- Leap years and 29 February, on both sides of every window.
- Empty input, and the difference between "absent" (unknown) and "empty array"
  (a positive assertion that there are none).
- Ordering independence. Shuffle the input with a seeded permutation and assert
  byte-identical output.
- Timezone traps, since the whole point is that there are none.
- Adversarial input: prototype pollution, a host that parses as the wrong half
  of a URL, a property carried on the prototype chain.

Prefer a test that cross-checks an engine against an independent brute-force
recomputation over a test that restates the implementation.

---

## Verification — run both, from the package directory

```bash
cd packages/<name>
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Both must exit clean. Iterate until they do. **Never report success without
having run them and seen them pass.**

Repo-wide, packages only. Build first — packages are consumed as emitted
JavaScript, so a cross-package import reads `dist/`, and a stale `dist` means you
are testing code you did not write:

```bash
pnpm build --filter "./packages/*"
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

`check-no-credential-custody` scans the whole tree including `docs/`. If you
write documentation about the credential refusal, **describe the forbidden field
names rather than spelling them**, or the doc itself trips the check. Only
`packages/govtech/src/credential-guard.ts`, `packages/govtech/tests/` and the
script itself are exempt, and each exemption is asserted to still exist.

Do **not** run `pnpm install`, `pnpm add` or `npm install` when another agent may
be working in the same worktree — concurrent installs corrupt the shared store.
If you believe you need a package that is not already in the relevant
`package.json`, solve it with the Node standard library or with what is already
there, and say so in your report.

---

## Things this repo will not do

Recorded here so nobody has to rediscover the argument.

- **No custody of government credentials.** No Cl@ve PIN, no Cl@ve Permanente
  password, no portal password, no e.firma key — not stored, not proxied, not
  held in memory "just for the request". `packages/govtech` makes a credential
  field structurally unrepresentable at the type level and backs it with a
  runtime guard. The replacement is `buildHandoff`, which gives the user an
  ordered package to carry to the portal themselves so the legal act and the
  audit trail stay theirs. [ADR 0003](docs/adr/0003-no-credential-custody.md).
- **No advice to an unrepresented applicant.** [ADR 0002](docs/adr/0002-advice-boundary-as-a-type.md).
- **No synthetic success.** An adapter that cannot do something says so, with a
  reason and an owner. No fixture data dressed as a government response, no
  optimistic default. `verifyNoSyntheticSuccess()` makes that checkable rather
  than merely asserted.
- **No ranking from an unreviewed catalog.** A pathway no licensed person has
  read never enters a recommendation, whatever the engine computes.
- **No estimate of the chance of success.** It is a prediction of outcome, it is
  the most heavily regulated thing an unlicensed adviser can say, and it would
  be fabricated.

---

## Ecosystem conventions this repo must follow

- **Auth**: verify Janua JWTs via JWKS at
  `https://auth.madfam.io/.well-known/jwks.json`. **RS256 only** — HS256 and
  `alg: none` are fail-closed after the 2026-04-23 ecosystem audit (H3/H4).
- **Billing**: entitlements and metering flow through **Dhanam**.
- **Inference**: every LLM call routes through **Selva** at `/v1`
  (OpenAI-compatible). Never call OpenAI or Anthropic directly from service code.
- **Compliance**: **Karafiel** for NOM-151 timestamping — the natural home for
  the immutable audit trail.
- **Deploy**: **Enclii**. `enclii onboard --repo madfam-org/meridian`.
- **CORS**: explicit allowlist per service. Wildcards are banned (audit H2/H5/H6).
- **Images**: `@sha256:`-pinned in every manifest.

Full detail and the enclii CLI reference: [ECOSYSTEM.md](ECOSYSTEM.md).

---

## LLM context files

- `llms.txt` — compact context index.
- `llms-full.txt` — durable full-context map and operating contract.
- `AGENTS.md` — canonical for agent instructions (this file).
- `CLAUDE.md` — thin redirect here, for Claude compatibility.

## Repo entrypoints

- [`README.md`](README.md) — status first, then architecture and quickstart
- [`ECOSYSTEM.md`](ECOSYSTEM.md) — ecosystem position and enclii day-to-day
- [`docs/`](docs/) — PRD, architecture, regulatory posture, catalog review, ADRs
- `infra/k8s/production/`, `enclii.yaml`, the three `Dockerfile.*` files and
  `.github/workflows/` — deployment configuration and CI. Present; nothing is
  deployed yet.
