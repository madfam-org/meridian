# Architecture

> **Boundary note (Lane C, public-safe).** Public-safe architecture only.
> Cluster topology, secret paths and operational runbooks live in the private
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> repo, per the repo-boundary contract.

Last updated: 2026-07-26.

**What changed since 2026-07-25.** This document previously described six
packages and no application tests. Both are out of date, and two packages it
never mentioned at all now exist:

- **`@meridian/atlas`** — the jurisdiction registry, mobility blocs, migrant-stock
  weighting and the coverage arithmetic. It is what tells us what "we cover two
  countries" is a fraction *of*. See §2 and [ADR 0008](adr/0008-atlas-coverage-measurement.md).
- **`@meridian/i18n`** — `Locale`, `LocalizedText` selection, `Accept-Language`
  negotiation, locale path helpers and `instrumentLang()`. See §2 and
  [ADR 0007](adr/0007-url-locale-segments.md).
- **The locale system.** All three applications moved from rendering English and
  Spanish into the same elements to **URL-based locale**: English unprefixed,
  Spanish at `/es`, both statically prerendered. See §8, which is new.
- **`apps/api` now has a composition root and tests.** `src/main.ts` exists, and
  the suite is 7 files / 115 tests. A Prisma migration exists.

**What is built and what is not.** The **eight** packages under `packages/` are
mature: typecheck clean, **1,418 passing tests across 53 files**, stable. `apps/api`
adds 115 across 7.

The three Next.js applications had **zero tests** when this revision was begun,
and **their suites were being written while it was being written.** Those counts
are therefore moving and are deliberately not frozen here — run the command.
Everything below the applications row was measured on 2026-07-26 and is stable.

| Project | Test files | Tests |
|---|---|---|
| `@meridian/core` | 2 | 60 |
| `@meridian/mrtd` | 5 | 111 |
| `@meridian/presence` | 6 | 147 |
| `@meridian/pathways` | 17 | 443 |
| `@meridian/documents` | 6 | 146 |
| `@meridian/govtech` | 8 | 310 |
| `@meridian/i18n` | 6 | 124 |
| `@meridian/atlas` | 3 | 77 |
| **Packages subtotal** | **53** | **1,418** |
| `apps/api` | 7 | 115 |
| `apps/landing`, `apps/web`, `apps/admin` | *in flight* | *in flight* |

```bash
pnpm typecheck && pnpm test && pnpm build   # the current state, whatever it is
```

`pnpm typecheck` passed 19/19 and `pnpm build` 12/12 at the start of this
revision. All four policy guards pass, plus `atlas-coverage`:

```
check-advice-boundary       OK — gate and producer anchors verified, 16 routes examined
check-no-credential-custody OK — 3 rules, 3 path exemptions, 2 structural anchors verified
check-pathway-citations     OK — 15 catalog files, 84 pathways, 378 citations,
                                 1094 criterion references resolved
check-workspace-manifests   OK — 12 workspace projects in all 4 Dockerfiles and the lockfile
```

The first two guards report a file count that rises as the applications grow, so
those counts are omitted here rather than quoted stale.

**A caution about `pnpm test` at the root.** It exits non-zero when any workspace
project has no test files at all, because vitest exits 1 on finding none — which
is how an empty application suite reads, and it is not a failure of any engine.
Check *which* task failed before concluding anything.

Sections below are marked **[BUILT]** or **[PARTIAL]**. A **[PARTIAL]** section
describes code that exists and is not yet finished or verified; the specific gap
is named in each case. Re-check status rather than trusting it.

---

## 1. The shape of the system

Meridian is a set of pure libraries with a thin service around them. That is a
deliberate inversion of the usual layout, and it comes from one observation:
**the hard part of this domain is arithmetic and legal provenance, neither of
which needs a database.**

Every package is a library of total functions over plain data:

- No I/O. No `fetch`, no file reads, no database client.
- No ambient clock. The reference date is always a parameter. The single
  exception — `todayUtc()` in `@meridian/mrtd` — exists so callers can override
  it, and its doc comment says so.
- No global state. `defaultRegistry()` in `@meridian/govtech` builds a fresh
  registry per call rather than exporting a singleton, so a deployment that
  injects a real transport into one adapter does not fight module state.
- No hidden randomness. Ties break deterministically.

The payoff is that 1,418 package tests run in seconds against no fixture server,
and that correctness questions — "does exactly 90 days pass?", "does a leap day
count twice?" — are answered by calling a function, not by standing up an
environment.

### Dependency graph **[BUILT]**

```
                        ┌──────────────────┐
                        │  @meridian/core  │
                        │  civil-date      │
                        │  disclosure      │
                        │  citation        │
                        │  jurisdiction    │
                        │  tenancy/matter  │
                        │  result/errors   │
                        └────────┬─────────┘
         ┌──────────────┬────────┼────────┬──────────────┐
         │              │        │        │              │
   ┌─────▼─────┐  ┌─────▼──────┐ │  ┌─────▼─────┐  ┌─────▼─────┐
   │ presence  │  │  pathways  │ │  │  govtech  │  │   atlas   │
   └───────────┘  └─────┬──────┘ │  └───────────┘  └───────────┘
                        │        │
                  ┌─────▼────────▼──┐
                  │    documents    │
                  └─────────────────┘

   ┌──────────┐        ┌──────────┐
   │   mrtd   │        │   i18n   │   both depend on nothing —
   └──────────┘        └──────────┘   not even core
```

One direction, no cycles. **Two packages are isolated on purpose, for different
reasons.**

`mrtd` is isolated because MRZ parsing is pure ICAO computation with no legal
rule and no disclosure question in it, so it carries no Meridian dependency and
can be lifted out or embedded in a mobile client unchanged.

`i18n` is isolated because **every one of its functions runs in a client
component**, and the landing site already learned what happens when a client
module reaches into `@meridian/pathways`: the whole catalog and zod follow it
into the browser bundle. A leaf package cannot do that. The shapes it needs from
elsewhere — a bilingual string, a citation's jurisdiction — are declared
*structurally*, so real catalog values satisfy them with no adaptation and no
import.

`atlas` depends on `core` only, and nothing depends on `atlas`. It is a
measurement package: it is read by `scripts/atlas-coverage.mjs` and by the
applications, and no engine consults it to decide anything.

`documents` depends on `pathways` structurally rather than concretely: it
declares a minimal `PathwayLike` interface (`id`, `targetJurisdiction`,
`documentRequirements`, optional `receivingRegion` and `submissionChannel`) that
the real `Pathway` satisfies. If the requirement shape changes, only
`documents/src/checklist.ts` needs editing.

---

## 2. Module map **[BUILT]**

### `@meridian/core` — the shared contract

Read this before anything else. Three things live here and nowhere else.

| Module | What it owns |
|---|---|
| `civil-date.ts` | `IsoDate` (branded), `DateRange` (**closed/inclusive both ends**), Hinnant `days_from_civil` / `civil_from_days`, `addDays`/`addMonths`/`diffDays`, `mergeRanges` (merges *adjacent* as well as overlapping), `complementRanges`, `overlapDays`, `lookbackWindow`, `eachDay` |
| `disclosure.ts` | `DisclosureClass`, `canRelease`, `Disclosable<T>`, `ReleaseContext`, `AuthorizedRepresentative` |
| `citation.ts` | `Citation`, `staleness` bands, `citationAgeDays` |
| `jurisdiction.ts` | `CountryCode`, dated `SCHENGEN_MEMBERSHIP` + `isSchengenOn`, Spain reduced-residency sets, CUSMA parties, apostille status |
| `tenancy.ts` | `TenantKind`, `representativeFor`, `audienceFor` |
| `matter.ts` | `Matter`, `MatterPhase` (six, ordered), `Task`, `unlockTasks`, `findTaskCycles` |
| `result.ts` / `errors.ts` | `Result<T,E>`, `MeridianError` with a stable `code` |

Two design notes worth calling out because they are easy to undo by accident:

- **`DateRange` is closed at both ends.** `rangeLengthDays` is `diffDays + 1`.
  Schengen counts the day of entry *and* the day of exit, so a same-day trip is
  one day present. Every window in every package follows this.
- **`mergeRanges` merges adjacent ranges**, not just overlapping ones. Two
  back-to-back stays are one continuous presence; counting the seam twice
  inflates totals.

### `@meridian/mrtd` — travel-document identity

ICAO Doc 9303. All five MRZ layouts (TD1, TD2, TD3, MRV-A, MRV-B), check digits,
extended document numbers, name-field parsing, and the BAC key seed.

Century resolution uses two sliding windows anchored to a caller-supplied
reference date rather than a pivot year: birth resolves within the 100 years
ending on the reference date, expiry within `[ref − 30y, ref + 70y)`. Expired
passports are presented constantly, and a forward-only rule reports a lapsed
document as valid.

Normalisation deliberately does **not** repair characters. `O`/`0` and `I`/`1`
confusions occur inside document numbers, and substituting them produces someone
else's number.

A clean verdict from `validateMrz` does not mean a document is genuine. It means
the transcription in front of you is arithmetically self-consistent, which is
the necessary first step before a document number reaches a government form
where one wrong character costs months.

### `@meridian/presence` — day counting

A `PresenceLedger` of `Stay` records, and four engines over it: Schengen 90/180,
tax-residency day-count thresholds, continuous-residence policies, and
qualifying-work accumulation.

Two properties are load-bearing:

**Every number shows its work.** Each assessment returns the de-duplicated
ranges that produced the total, the window it was measured over, and the
per-record attribution. A figure a person cannot reconstruct is a figure they
cannot defend to an officer, and one nobody can audit is one nobody can correct.

**Nothing here is advice.** Every public entry point is `assessment`: the user's
own facts against a cited rule with the arithmetic exposed. "You have 87 of your
90 days" is an assessment. "You should leave before the 3rd" is advice, and a
day counter has no business saying it.

Schengen membership resolves **per day** through `isSchengenOn`, not by splitting
stays with range arithmetic, so accessions land exactly. Absences are derived
with `complementRanges`, which means a *hole in the record* reads as an absence
— overstating time away, which is the safe direction — and is paired with
`detectInconsistencies` so a real departure can be distinguished from a missing
one.

Catalog: 6 citations (3 marked `discretionary`), 2 tax thresholds
(ES IRPF, CA sojourner), 1 continuity policy (Spain nationality).

### `@meridian/pathways` — the rules engine

One idea shapes this package: **the law is data and the engine is generic.**

- A `Pathway` is a zod-validated record. Its criteria are declarative
  `EvaluatorSpec` values (18 operations, including `all_of` / `any_of` / `not` /
  `collection_any`), so the catalog is serialisable, diffable, and reviewable by
  a lawyer who does not read TypeScript.
- `evaluate.ts` contains **no country name, no threshold, and no legal concept.**
  Adding a jurisdiction is a new file in `src/catalog/`. If a rule ever lands in
  the evaluator, it has escaped to a place no reviewing lawyer will look.
- Evaluation is **three-valued** (Kleene). Absence yields `unknown`, never
  `false`. An empty array is a positive assertion ("I hold no certificates") and
  yields `false`; an absent array yields `unknown`.
- Calendar arithmetic lives in `facts.ts` as `DerivedFacts`, not in the spec
  language, and goes entirely through `@meridian/core`.
- `recommend()` is the only thing that ranks anything, which is why it is the
  only thing behind the review gate.

Verdict precedence, in order: closed pathway → `ineligible`; any escalation →
`requires_human_review`; blocking criterion unmet → `ineligible`; blocking
unknown → `indeterminate`; material unmet or unknown → `indeterminate`. A
`material` criterion can hold back a yes but can never produce a no, because
"likely to be refused" is a prediction and predictions are advice.

Catalog, measured 2026-07-26: **84 pathways** (26 ES, 23 CA, 35 US) across
thirteen source modules, **449 criteria**, **373 distinct citations** (82
`discretionary`, 346 carrying a URL), 63 `leadsTo` edges with none dangling, and
**0 counsel-reviewed**. `recommend()` therefore returns an empty ranking and 84
exclusions coded `not_counsel_reviewed`.

62 of the 84 carry at least one `requiresHumanReview` criterion; the 56 of those
that are open can only ever return `requires_human_review`, since escalation
outranks every verdict rule except closure. That concentration is heaviest in the
United States block — 30 of 35 — because `ApplicantFacts` models one person and
US family and employment law turns on a petitioner, a sponsor, or the manner of a
last entry. The full per-jurisdiction breakdown is in
[LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md); the argument for the design is
section 6 of [COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md).

`validateCatalog()` returns 9 warnings and 0 errors. All nine are Canadian
citation-id and citation-note divergences, enumerated in
[LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md#known-warnings).

### `@meridian/atlas` — the denominator

**The map of the whole migration problem, so coverage can be measured rather than
asserted.** Nothing depends on it and no engine consults it; it exists so that
"we cover three countries" has a stated denominator.

| Module | What it owns |
|---|---|
| `regions/*.ts` | Five region files — Africa, Americas, Asia, Europe, Oceania — listing every jurisdiction with, or plausibly with, its own immigration control |
| `blocs.ts` | Mobility agreements with dated memberships |
| `corridor.ts` | `deriveCorridor`, registry merge with first-wins dedupe, `explainCorridor` |
| `stock.ts` | UN DESA bilateral migrant-stock rows, and the world total |
| `coverage.ts` | `computeCoverage`, `checkAtlasIntegrity` (16 rules) |

As of 2026-07-26: **249 jurisdictions, 22 mobility agreements, 280 weighted
corridors**, 16 integrity rules checked with **0 findings**.

Three properties are load-bearing, and each exists to stop the metric being
improvable by looking away:

- **A corridor is derived, never stored.** There is no table of ~40,000 country
  pairs. `deriveCorridor(origin, destination, asOf)` computes the answer from the
  two jurisdiction records plus whatever blocs were in force on that date, so a
  bloc accession is edited once rather than in every pair it touches.
- **Coverage is reported twice, and both numbers are printed together.**
  *Structural* coverage counts systems — **1.20%, 3 of 249** — and treats an
  uninhabited island as equal to Mexico. *Weighted* coverage counts people —
  **0.6076%** of the migrants in the stock table — and is the honest answer to
  "how much of the problem". Neither alone is usable: structural coverage is
  flattered by small jurisdictions, weighted coverage hides how many systems are
  unmapped.
- **"Covered" requires both ends of a corridor to be encoded**, because a
  corridor is only as known as its least-known end. The entire 0.6076% is two
  rows: Canada→US (950,000) and US→Canada (257,000). **Mexico→US, at 11,280,000
  the largest bilateral corridor in the world, is still uncovered** and is row 1
  of the atlas's own work queue, because Mexico remains `researched`.

The denominator is documented as wrong in both directions rather than presented as
exact: it *includes* places with no permanent population and no residence route
(which permanently depress structural coverage), *excludes* roughly seven
entry-controlling authorities with no ISO alpha-2 code, and three codes hide more
than one control each. The stock table covers 65.34% of world migrant stock
against a ceiling of **92.7%**, because 7.3% of the source is origin "Others" and
is unreachable by any bilateral table. Read completeness against that ceiling, not
against 100%.

Reproduce all of it with `node scripts/atlas-coverage.mjs --as-of=YYYY-MM-DD`.
See [ADR 0008](adr/0008-atlas-coverage-measurement.md).

### `@meridian/i18n` — locale resolution

**One page, one language.** This package holds no copy and no components — those
belong to the applications. It holds the decisions that would otherwise be made
slightly differently in each of the three.

| Module | What it owns |
|---|---|
| `locale.ts` | The closed `Locale` union, canonical order, default, `lang` tags, endonyms, `parseLocale`, `otherLocale` |
| `text.ts` | `pick` for validated catalog data; `resolveText` for anything that crossed a network or database boundary and might be missing a half |
| `negotiate.ts` | `Accept-Language` with quality values — for one decision only: where to send a reader who stated no preference |
| `path.ts` | `localizedPath`, `splitLocalePath`, `alternatePaths`. English is unprefixed and Spanish is `/es`, so adding and removing a locale are **not inverses** |
| `instrument.ts` | `instrumentLang()` — the rule with legal consequence |

Three things are worth knowing before changing anything here.

**`path.ts` exists because the asymmetry is a trap.** English at `/` and Spanish
at `/es` means a hand-rolled `startsWith('/es')` decides that `/estimate` is
Spanish. The helpers are the single place that logic lives.

**An instrument name is never translated.** It is the identity of a source. *Real
Decreto 1155/2024* is not "Royal Decree 1155/2024" — a reader who searches for the
translation finds nothing, and a reader who cites it cites a document that does
not exist. `instrumentLang()` returns the language the name is *in*, so it can be
marked with a correct `lang` attribute instead, and returns `null` when it does
not know rather than guessing. A confident wrong `lang` on a statute is worse than
a missing one.

**`resolveText` reports missing halves rather than falling back silently.** A
blank string rendered as if it were content is the failure this avoids.

Nothing here translates anything or decides what a page says.
See [ADR 0007](adr/0007-url-locale-segments.md).

### `@meridian/documents` — paperwork logistics

Five concerns, each in its own module because each fails on its own: the
document model and its status machine, legalisation routing (apostille /
consular chain / EU 2016/1191 exemption / `unknown`), translation requirements
(accepted languages, translator standards, Spain's co-official zones),
freshness, and checklist assembly with gap analysis.

Two safety choices to preserve:

- **`'unknown'` is a first-class answer, never a fallback to a plausible
  default.** An uncatalogued country yields route `'unknown'` plus a
  verification step assigned to the *representative*, not the applicant.
  `legalisationSatisfied` returns false for `'unknown'` whatever was already
  done.
- **Freshness is projected to the submission date, not to today.** There is a
  dedicated `'expires_before_submission'` verdict for the case a today-only
  check silently passes, and an absent catalog entry yields `'unknown'`, never
  `'valid'` — gaps reports those in a separate `freshnessUnknown` bucket so
  "unchecked" and "checked and fine" never render the same.

Task ordering per document is **obtain → legalise → translate**. Translation is
last on purpose: an apostille is itself a certificate bearing text that must
normally be translated with the document, so translating first pays the sworn
translator twice.

### `@meridian/govtech` — government adapters

Three adapters (Spain's Cl@ve, Spain's civil registry / DICIREG, Canada's IRCC),
15 declared capabilities, and two commitments that hold across all of them.

**No synthetic success.** An adapter that cannot do a thing says so, with a
reason and an owner. `verifyNoSyntheticSuccess(registry, ctx)` runs each
adapter's declared probes and reports anything that returned data while its
capability was not `available`, so the commitment is *checkable* rather than
asserted. `stateFromRequirements` returns the unsatisfied state for an empty
requirement set, because `[].every()` vacuous truth would otherwise let a remote
capability with no declared preconditions report itself green.

**No credential custody.** See [ADR 0003](adr/0003-no-credential-custody.md).

Capability board as of 2026-07-26 — 15 capabilities across 3 adapters, unchanged
in every count since 2026-07-25:

| State | Count | Notes |
|---|---|---|
| `available` | 6 | **all `local_computation`** — nothing that talks to a government |
| `not_provisioned` | 2 | Cl@ve identity assertion, DICIREG certificate retrieval — need formal agreements |
| `not_implemented` | 3 | IRCC employer-portal submission, applicant submission, status polling |
| `refused_by_policy` | 4 | credential custody per adapter, plus acting as the user |
| `degraded` | 0 | |

**Zero `government_system` capabilities are `available`.** Every remote
capability additionally requires an injected transport this package does not
ship, so `available` is unreachable from inside the package even with every
environment variable set. That is deliberate: a formal agreement, not a config
value, is what unblocks a government integration.

---

## 3. Data flow

### The matter lifecycle **[BUILT — as types and functions]**

```
intake → identity_validation → document_assembly → submission
       → post_arrival_tracking → status_transition
```

`MatterPhase` is a closed, ordered set. `unlockTasks(tasks, currentPhase)`
promotes a `locked` task to `available` only when both its explicit
`dependsOn` edges are satisfied **and** its phase is not ahead of the matter's
current phase. `findTaskCycles` detects dependency cycles before they deadlock a
matter; `buildChecklist` in `@meridian/documents` deliberately does **not**
repair a cycle a pathway author declared — it emits the `dependsOn` edges as
written so `findTaskCycles` reports the problem truthfully, while its own
ranking ignores back edges so it cannot hang.

### End-to-end assessment flow **[BUILT libraries, DESIGNED wiring]**

```
  MRZ scan                  Presence records            Applicant answers
      │                            │                            │
      ▼                            ▼                            ▼
 validateMrz              buildLedger(stays)              ApplicantFacts
 (mrtd)                   (presence)                      (pathways)
      │                            │                            │
      │                    assess* → Disclosable        deriveFacts(asOf)
      │                    'assessment'                         │
      │                            │                            ▼
      │                            │                   evaluate(pathway, facts)
      │                            │                   → EligibilityReport
      │                            │                            │
      └──────────────┬─────────────┴────────────────────────────┤
                     ▼                                          ▼
            buildChecklist (documents)              recommend(facts, catalog)
            → analyseGaps → Disclosable             → Disclosable 'advice'
              'assessment'                                       │
                     │                                           │
                     └───────────────┬───────────────────────────┘
                                     ▼
                          ┌──────────────────────┐
                          │  canRelease(class,   │   ← THE GATE
                          │    ReleaseContext)   │
                          └──────────┬───────────┘
                              allowed│  refused → downgrade + reason
                                     ▼
                                  response
```

Everything left of the gate produces values. The gate decides what leaves.

---

## 4. Where the disclosure gate sits in the request path

**[BUILT — implemented in `apps/api/src/`, and now asserted by a suite:
`tests/disclosure.test.ts`, `tests/routes.test.ts`, `tests/auth.test.ts`,
`tests/tenancy.test.ts`, `tests/identity.test.ts`, `tests/config.test.ts`,
`tests/health.test.ts` — 7 files, 115 tests. This section previously read
PARTIAL, with "no tests assert its behaviour" as the named gap; **that gap is
closed.**]**

The gate is **not** middleware and **not** a render-time filter. It sits at
exactly one place: the serialisation boundary of the response, applied to a
value that already knows its own classification.

```
HTTP request
  │
  ├─ 1. Auth        verify Janua JWT via JWKS, RS256 only; alg:none rejected
  │                 → tenantId, userId, roles
  │
  ├─ 2. Tenancy     load Tenant → TenantKind
  │                 audienceFor(kind) → Audience
  │
  ├─ 3. Matter      load Matter → representativeId, targetJurisdiction
  │                 representativeFor(tenant, jurisdiction, asOf)
  │                   → AuthorizedRepresentative | null
  │
  ├─ 4. Engine      call the pure library. It returns Disclosable<T>
  │                 with a classification decided at the point of production.
  │                 The route does NOT choose the classification.
  │
  ├─ 5. THE GATE    canRelease(value.classification, {
  │                   audience, jurisdiction, representative,
  │                   forConsideration, asOf })
  │                 allowed        → serialise value.value
  │                 not allowed    → serialise the downgraded form,
  │                                  plus decision.reason and decision.downgradeTo
  │
  └─ 6. Audit       record: matter, classification asked for, classification
                    released, representative id or null, citation ids, timestamp.
                    Karafiel NOM-151 timestamping is the natural home for this.
```

Four properties this design must preserve:

1. **There is no route that returns engine output around the gate.** Not a debug
   route, not an internal route, not an export. This is enforced structurally:
   `src/routes/registry.ts` installs a Fastify `onRoute` hook that **refuses to
   register any route** whose config lacks a `meridian` block declaring whether
   it returns engine output. The server does not start until a new route answers
   the question. A route declaring `engineOutput: true` that returns something
   else fails; a route declaring `false` whose payload carries a
   `DisclosureClass` or a `Citation`-shaped object fails too, caught by
   `src/disclosure/leak-detector.ts`. `scripts/check-advice-boundary.mjs` runs
   the same assertion in CI over the tree.
2. **Downgrade is visible, never silent.** The response carries what was
   withheld and why. A user who cannot see the recommendation still sees their
   own numbers and the rule text, and is told a representative would be needed.
3. **The classification is never chosen by the route.** If a handler ever
   constructs `disclosable('assessment', …)` around something that ranks, the
   type system will not catch it — but the review will, because ranking lives
   only in `recommend()` and `recommend()` is `advice` by construction.
4. **The gate reads a live credential.** `canRelease` refuses on a jurisdiction
   mismatch and on an expired `expiresOn`. A lapsed licence must not gate
   release, so the representative record's `verifiedOn` needs a real
   re-verification process, not a one-time insert.

Two implementation details worth knowing before changing anything here.
`forConsideration` is hard-coded `true` rather than read from a billing flag:
Meridian is a paid platform, and setting it from an entitlement would let a free
trial silently widen what an unlicensed audience may be told. And a downgraded
value is **re-checked** through `canRelease` — a downgrade that still returned
`advice` would otherwise walk straight past the boundary it was written to
respect.

**The gap, as it now stands.** Every boundary condition named above — no
representative, wrong jurisdiction, expired credential, a downgrade that fails to
downgrade — is now asserted in `tests/disclosure.test.ts` and
`tests/routes.test.ts`.

What the API suite does **not** cover is the applications. `apps/landing`,
`apps/web` and `apps/admin` began this revision with no tests at all; suites for
them are being written concurrently. Until they settle, treat any claim in this
document about rendering, state derivation, locale resolution at the route
boundary, or accessibility conformance as **unasserted**. No WCAG claim appears
anywhere in these documents for exactly that reason, and none should be added
without a measurement behind it.

---

## 5. Ports and adapters for repositories

**[PARTIAL — ports and both adapters exist in `apps/api/src/repositories/`;
the contract test suite that keeps them in step does not.]**
See [ADR 0006](adr/0006-ports-and-adapters-repositories.md).

The API defines repository **ports** as plain TypeScript interfaces in the
application layer, and the Prisma implementation is one **adapter** among two.
The second — an in-memory implementation — is not a testing convenience bolted
on afterwards; it is the thing that keeps the port honest.

```
        ┌─────────────────────────────────────────────┐
        │  apps/api — HTTP layer (Fastify)            │
        │    routes · schema validation · the gate    │
        └───────────────────┬─────────────────────────┘
                            │ depends on interfaces only
        ┌───────────────────▼─────────────────────────┐
        │  application services                       │
        │    orchestration + the disclosure gate      │
        │    imports @meridian/* pure libraries       │
        └───────────────────┬─────────────────────────┘
                            │
                 ┌──────────▼───────────┐
                 │  PORTS (interfaces)  │
                 │   MatterRepository   │
                 │   TenantRepository   │
                 │   PresenceRepository │
                 │   DocumentRepository │
                 │   AuditSink          │
                 └──────────┬───────────┘
                 ┌──────────┴───────────┐
                 ▼                      ▼
        ┌────────────────┐    ┌──────────────────┐
        │ Prisma adapter │    │ in-memory adapter│
        │  (production)  │    │  (tests)         │
        └────────────────┘    └──────────────────┘
```

Rules the design must keep:

- **Ports speak domain types**, `Matter` / `Stay` / `Document` from
  `@meridian/core` and the domain packages — never Prisma model types, never
  `Prisma.MatterWhereInput`. A port that leaks its adapter's query language is
  not a port.
- **Tenant scoping is structural, not remembered.** The built form is stronger
  than a `tenantId` parameter: **no method on any repository interface takes
  one**. A repository comes from `RepositoryProvider.forTenant(tenantId)` with
  the id from a verified token, and every query it issues carries that id in its
  predicate. There is no call a handler could make that reads another tenant's
  row, because the parameter does not exist. Cross-tenant leakage is the failure
  mode that has bitten sibling platforms in this ecosystem, and a convention
  ("always filter by tenant") survives until the third urgent fix at the end of a
  quarter.
- **The audit repository is append-only.** `append` and `list`, and nothing
  else — not "we do not call update", but there is no update to call. A trail
  that can be edited is not evidence. Its known gap is ordering: the mutation
  happens, then the row is appended, so a failed append fails the request but can
  leave an already-applied change unrecorded. Closing that needs both in one
  transaction, and it is documented in `src/audit/writer.ts` rather than
  hidden.
- **No engine package ever sees a repository.** The libraries take plain data
  and return plain data. If a pure package ever needs to load something, the
  load happens in the application layer and is passed in.

---

## 6. Choices a reader is likely to question

**Fastify rather than NestJS**, against the ecosystem's grain — dhanam and avala
are NestJS. The workspace packages are ESM TypeScript *source*, consumed
directly through the `exports` map with no build step; NestJS's CommonJS +
`emitDecoratorMetadata` toolchain would force a dual-module build across the
whole monorepo. Recorded honestly as a trade-off, not a win:
[ADR 0004](adr/0004-fastify-over-nestjs.md).

**A branded `IsoDate` string rather than a date library.** Temporal is not
uniformly available on Node 22 without a polyfill, and every general-purpose
date library carries an instant-versus-civil-date ambiguity that is exactly the
bug we are avoiding. The Hinnant algorithms are ~30 lines and exact:
[ADR 0001](adr/0001-civil-date-arithmetic.md).

**zod only at genuinely untyped boundaries.** `validateOfferOfEmployment(raw:
unknown)` parses an employer-supplied JSON package and reports every shape
problem at once, because the person fixing it is an HR administrator, not an
engineer. Adapter-constructed inputs use the type system instead.

**The catalog is data, and mandatory citations are a schema constraint.** A
pathway that cannot cite its rules fails validation, not review:
[ADR 0005](adr/0005-data-driven-pathway-catalog.md).

**English is unprefixed and Spanish is `/es`, rather than `/en` and `/es`.** The
asymmetry costs a helper package and buys a canonical address for the default
language: [ADR 0007](adr/0007-url-locale-segments.md).

**Coverage is reported as two numbers, and the denominator is documented as
wrong.** A single coverage percentage is improvable by looking away:
[ADR 0008](adr/0008-atlas-coverage-measurement.md).

---

## 7. The locale system **[BUILT]**

Added after this document's first revision, and previously undescribed anywhere.
The shared resolution layer is `@meridian/i18n` (§2); this section is what the
three applications do with it.

### The change

Meridian used to render English and Spanish **into the same elements**. The
argument for it was that the catalog authors both halves together and neither is
subordinate — which is true of the *data*, and stays true. It was not true of the
*page*: a screen-reader user heard every sentence twice, the document was about
twice as long as it needed to be, every reader paid scanning cost to discard half
of it, and `<html lang>` could not be correct because the page was two languages
at once.

All three applications now serve **one language per page**, at its own address.

### How it is wired

```
apps/{landing,web,admin}/
  middleware.ts            unknown addresses → that locale's 404, by rewrite
  next.config.mjs          rewrite  /  → /en route;  redirect /en → /  (301)
  app/[locale]/layout.tsx  generateStaticParams() → both locales prerendered
                           parseLocale() → <html lang>
  components/LocaleSwitch  an <a href>, rendered on the server
  app/sitemap.ts           alternates.languages incl. x-default
```

- **English is unprefixed, Spanish is `/es`.** Routes live under `app/[locale]`,
  so the documents generate as `/en` and `/es`; a `beforeFiles` rewrite serves the
  English one at `/`. Both variants are statically prerendered.
- **`/en` is not a published address.** It exists as a route and would otherwise
  be reachable directly, putting the same document at two URLs and splitting its
  ranking, so `/en` and `/en/:path*` redirect permanently to the unprefixed form.
  `hreflang` says English lives at `/`, and the redirect makes that true.
- **Only two locales ever resolve.** `parseLocale` is strict about case and
  region subtags, so `/ES` and `/es-MX` cannot become a third and fourth address
  for the same document; anything else is rewritten to the not-found page of
  whichever locale the address sat under, with a 404 status. It is a **rewrite,
  not `notFound()`**, so the reader gets a statically prerendered document with a
  correct `lang` rather than the framework's unstyled English 404 shell — which
  matters precisely because a reader who lands on a 404 has already had something
  go wrong.
- **`hreflang` alternates with an `x-default`** are emitted per route and in the
  sitemap. `x-default` points at English.
- **The switcher is a link, not a control.** An anchor with a real `href`,
  rendered on the server: it works with JavaScript disabled, it is crawlable,
  middle-clicking opens the other language in a tab, and there is no client state
  to fall out of step with the URL. A button with an `onClick` would fail all
  four and would force the whole header to become a client component.
- **It points at *this* page in the other language**, carrying the query string
  across — never at the home page. Sending a reader halfway through the day
  counter back to `/` because they wanted Spanish loses their place and
  everything they typed.
- **Each option is named in its own language**, with a matching `lang`, and the
  link's accessible name is a full sentence in the language it leads to. A control
  labelled "Spanish" is useless to the person who needs it. Not a flag: a flag is
  a country and a language is not, and on a page printing `ES` and `CA` as
  jurisdiction chips a two-letter language code would read as one more
  jurisdiction.

### The rule with legal consequence

**Instrument names are never translated.** They are the identity of a source, so
`instrumentLang()` reports the language a name is *in* — for a correct `lang`
attribute — and returns `null` rather than guessing. See §2.

**Test status.** `@meridian/i18n` itself is well covered — 6 files, 124 tests.
The *wiring* described in this section — the middleware, the `/` rewrite, the
`/en` redirect, `generateStaticParams`, the alternates — lives in the three
applications, which had no tests when this section was written and are acquiring
them now. Check the current state before relying on any property above being
asserted rather than merely written.

---

## 8. What is not designed yet

Named so that nobody mistakes silence for a decision:

- **Tests for `apps/landing`, `apps/web` and `apps/admin`.** Not a design gap — a
  build gap, and the one that was most urgent when this revision began, since
  `apps/api` had closed its own. Work on it was in flight as this was written;
  see §4 and check the current state rather than this sentence.
- The presence-ledger ingestion path — how a border stamp, an itinerary or a
  declared stay actually arrives.
- Multi-tenant data residency for EU subjects. Meridian processes Article 9
  special-category data and this is a real architectural question, not a
  configuration one. See [SECURITY.md](../SECURITY.md).
- Document storage. Nothing in the built packages stores a document; they model
  its status and requirements. Where the bytes live, encrypted how, retained how
  long, is undecided.
- A third locale. `Locale` is a closed union of two, and `otherLocale()` assumes
  exactly two — a switcher becomes a menu at three, and nothing in the apps is
  written for that.
- Whether the atlas's `researched` tier means anything operationally. 123 of 249
  jurisdictions carry it, and it usually establishes only autonomy and bloc
  membership. Reading it as "system understood" overstates the work substantially.

**Closed since the previous revision**, recorded so the change is visible rather
than silently overwritten:

- ~~The server composition root: `apps/api` has no `src/main.ts`.~~ It exists.
- ~~The migration strategy; no migration has been generated or applied.~~
  `apps/api/prisma/migrations/20260726005032_init/` exists. The schema is still
  10 models and 15 enums. Whether it has been *applied* anywhere is an
  operational question this repository does not answer.
- ~~The front-end architecture of either Next.js app beyond the port
  allocation.~~ There are three applications, and §7 describes the locale
  architecture all three share. The rest of their architecture is still
  undocumented here.
