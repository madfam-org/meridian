# Architecture

> **Boundary note (Lane C, public-safe).** Public-safe architecture only.
> Cluster topology, secret paths and operational runbooks live in the private
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> repo, per the repo-boundary contract.

Last updated: 2026-07-25.

**What is built and what is not.** The six packages under `packages/` are
mature: typecheck clean, 901 passing tests across 32 files, measured repeatedly.
The three applications under `apps/` landed during the repository's initial
build session — the API is a real Fastify application with auth, the gate,
repository ports and both adapters, but it has **no `src/main.ts`** composing it
into a process and **no tests at all**.

Sections below are marked **[BUILT]** or **[PARTIAL]**. A **[PARTIAL]** section
describes code that exists and is not yet finished or verified; the specific gap
is named in each case. Status was measured on 2026-07-25 at 14:43
America/Mexico_City — re-check it rather than trusting it.

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

The payoff is that 901 tests run in seconds against no fixture server, and that
correctness questions — "does exactly 90 days pass?", "does a leap day count
twice?" — are answered by calling a function, not by standing up an environment.

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
              ┌──────────────┬───┴────┬──────────────┐
              │              │        │              │
        ┌─────▼─────┐  ┌─────▼──────┐ │        ┌─────▼─────┐
        │ presence  │  │  pathways  │ │        │  govtech  │
        └───────────┘  └─────┬──────┘ │        └───────────┘
                             │        │
                       ┌─────▼────────▼──┐
                       │    documents    │
                       └─────────────────┘

        ┌──────────┐
        │   mrtd   │   depends on nothing — not even core
        └──────────┘
```

One direction, no cycles. `mrtd` is isolated on purpose: MRZ parsing is pure
ICAO computation with no legal rule and no disclosure question in it, so it
carries no Meridian dependency and can be lifted out or embedded in a mobile
client unchanged.

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

Catalog: 8 pathways (6 ES, 2 CA), 20 distinct citations, **0 counsel-reviewed.**

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

Capability board as of 2026-07-25:

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

**[PARTIAL — implemented in `apps/api/src/`; no tests assert its behaviour.]**

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

**The gap.** `apps/api` has no test files. Every boundary condition named above —
no representative, wrong jurisdiction, expired credential, a downgrade that
fails to downgrade — is untested. This is the largest outstanding item in the
repository.

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

---

## 7. What is not designed yet

Named so that nobody mistakes silence for a decision:

- **Tests for `apps/api`.** Not a design gap — a build gap, and the most urgent
  one. See §4.
- The server composition root: `apps/api` has no `src/main.ts`.
- The migration strategy. `apps/api/prisma/schema.prisma` exists (10 models,
  15 enums); no migration has been generated or applied anywhere.
- The presence-ledger ingestion path — how a border stamp, an itinerary or a
  declared stay actually arrives.
- Multi-tenant data residency for EU subjects. Meridian processes Article 9
  special-category data and this is a real architectural question, not a
  configuration one. See [SECURITY.md](../SECURITY.md).
- Document storage. Nothing in the built packages stores a document; they model
  its status and requirements. Where the bytes live, encrypted how, retained how
  long, is undecided.
- The front-end architecture of either Next.js app beyond the port allocation.
