# Changelog

All notable changes to Meridian are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are ISO 8601. Times, where they appear, are `America/Mexico_City`.

> **Boundary note (Lane C, public-safe).** Public-safe release history.
> Deployment and operator-gate history is private and lives in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops).

---

## [Unreleased]

Nothing released yet. Meridian has never been deployed and has no users.

### Added — 2026-07-25, later the same day: pathway catalog expansion

Six new catalog files under `packages/pathways/src/catalog/`, adding **41
pathway records** to the eight from the initial build. Nothing outside the
catalog directory and `docs/` was touched: no change to `evaluate.ts`,
`schema.ts`, `facts.ts`, `integrity.ts` or any other package. The figures in the
`@meridian/pathways` entry below describe the initial build and are superseded by
these.

| | Initial build | After expansion |
|---|---|---|
| Catalog files holding pathway records | 4 | 9 |
| Pathway records | 8 | **49** (26 ES, 23 CA) |
| Criteria | 43 | **261** |
| Distinct citations | 20 | **196** |
| Citations marked `discretionary` | 5 | **47** |
| Citations carrying a URL | 7 | **178** |
| Counsel-reviewed | 0 | **0** |

New files, each with a module doc comment recording its sources, its judgement
calls and its omissions:

- **`es-arraigo.ts`** — Spain's five open *arraigo* figures under RD 1155/2024
  arts. 127.a–e as amended by RD 316/2026, plus the DA 21ª extraordinary window
  recorded as closed on 2026-07-01. 6 records, 41 criteria.
- **`es-work-study.ts`** — employed and self-employed work authorisations, the
  study stay, the study-to-work modification, the Ley 14/2013 entrepreneur route,
  and long-term residence in both its EU and national forms, which are encoded as
  two records because arts. 176 and 183 impose different requirements.
  7 records, 35 criteria.
- **`es-family-nationality.ts`** — *reagrupación familiar*, the EU family-member
  card and its permanent form, and four nationality routes including the
  Sephardic limb of Código Civil art. 22.1 that `es.ts` recorded as a gap.
  7 records, 31 criteria.
- **`ca-federal-economic.ts`** — the Federal Skilled Worker and Federal Skilled
  Trades classes. Express Entry is documented as the management system it is,
  not encoded as a pathway. 2 records, 14 criteria.
- **`ca-provincial-quebec.ts`** — the Provincial Nominee framework and Quebec's
  separate selection system, including the PSTQ and the reactivated PEQ.
  4 records, 18 criteria.
- **`ca-work-study.ts`** — the LMIA-based work permit, CUSMA traders, investors
  and intra-company transferees, and the study permit → post-graduation work
  permit → Canadian Experience Class chain. 6 records, 34 criteria.
- **`ca-family-pilots.ts`** — spousal and partner sponsorship inland and outland,
  dependent children, parents and grandparents, the Start-up Visa, the Atlantic
  program, and the rural, Rural and Northern, and Agri-Food pilots.
  9 records, 45 criteria.

Program-status findings that would have been wrong from memory, each verified
against the responsible authority's own publication:

- **IRPR s. 87 was amended on 2026-03-30** by `SOR/2026-63`, repealing the
  officer's substituted-evaluation power and the second-officer concurrence
  requirement for provincial nominees.
- **Parents and grandparents: intake paused 2026-07-15.** Recorded `suspended`;
  the class in IRPR s. 117(1)(c)/(d) is untouched.
- **Start-up Visa: paused 2026-06-30.** Recorded `suspended`.
- **Rural and Northern Immigration Pilot: closed 2024-09-01**, superseded by the
  Rural Community Immigration Pilot, which is encoded as a live record.
- **Agri-Food Pilot: closed 2025-05-14.**
- **Quebec's PEQ was abolished 2025-11-19 and reactivated for a reception window
  running 2026-07-02 to 2026-10-31**, encoded as a filing-date test rather than
  as `openedOn`, because `statusOn()` cannot express "open, abolished, reopened".
- **Spain's `arraigo` figures opened 2025-05-20** under the new Reglamento;
  art. 126.h was added by RD 316/2026 and appears only in the version stamped
  2026-04-16.

Documentation:

- **`docs/COUNSEL_REVIEW_PACKET.md`** (new) — the document a reviewing lawyer
  opens: what they are and are not being asked to attest to, how to read a
  pathway and a criterion, how `verifiedOn` and the staleness bands work, why the
  `discretionary` flag carries legal weight, twenty-seven specific questions
  across the two jurisdictions, and what actually changes when `reviewStatus`
  moves to `counsel_reviewed`.
- **`docs/LEGAL_CATALOG_REVIEW.md`** — refreshed for 49 records: full
  per-jurisdiction inventory, the defined-versus-shipped distinction, the
  escalation figures, the catalog-authoring pitfalls found this sweep, and the
  list of facts the catalog needs and does not have.

### Not covered — say it plainly

- **Asylum, refugee protection and humanitarian/compassionate claims are
  deliberately not encoded, and will not be.** They turn on credibility
  assessment rather than on criteria; they concern people at risk; and a
  self-serve eligibility checker is the wrong instrument for them. The exclusion
  is named in the module header of every file added here, and again in the
  guidance of the individual criteria where a reader most plausibly arrives with
  a protection question — each pointing to a qualified immigration lawyer or a
  specialised organisation rather than elsewhere in the product. **There is no
  catalog-level, user-visible statement of this yet**; it lives in file comments
  and individual guidance strings and needs an owner in `catalog/index.ts` or in
  the applications.
- **32 of the 49 records can only return `requires_human_review`.** They carry at
  least one criterion marked `requiresHumanReview: true`, which escalates the
  whole report. This is the deliberate answer to `ApplicantFacts` modelling one
  person while sponsorship, family ties, physical presence, provincial
  nominations, per-ability language scores and hours-based work thresholds all
  need something it does not hold. Each escalation names the missing fact in its
  `humanReviewReason` so it can be retired individually.
- **No operational figure from IRCC's program delivery instructions appears
  anywhere.** canada.ca refused automated access throughout this work, so the
  post-graduation work permit field-of-study list and language thresholds, the
  study-permit settlement-funds amount, LMIA exemption codes and the CUSMA
  "substantial trade" percentage are all absent. The statutory and regulatory
  frame is encoded from Justice Laws, which was reachable.
- **No Comprehensive Ranking System number of any kind** — no cut-off, no
  maximum, no factor value. A cut-off is a per-round outcome.
- **The Spanish long-term-residence absence limits are stated in guidance, not
  measured.** Arts. 176.a) and 183.2 are denominated in months and the fact model
  carries days; six consecutive calendar months is between 181 and 184 days, so
  any threshold would have been our arithmetic presented as Spain's.
- **No processing-time estimate on any of the 49 records**, unchanged.
- Other named absences: Spanish Título IV Cap. VII (family of Spanish
  nationals — for a Mexican married to a Spaniard this is the actual answer),
  art. 128 humanitarian grounds, Título VII Caps. II–V, DA 20ª; Canada's
  Francophone Community Immigration Pilot, the super visa, intercountry adoption
  and orphaned-relative sponsorship, the "lonely Canadian" provision, and stream
  criteria for any individual province; and, in both jurisdictions, every
  admissibility ground beyond a self-declared criminal record — medical, security
  and misrepresentation are untouched.

### Changed — catalog assembly

`packages/pathways/src/catalog/index.ts` now builds `MERIDIAN_PATHWAY_CATALOG` by
concatenating `MERIDIAN_CATALOG_MODULES` — the nine source modules written out in
a fixed, append-stable order — instead of from a literal two-element array. All
49 records are therefore shipped, and `catalogSourceOf(id)` reports which file a
record lives in.

The ordering rule is a legal constraint, not a style choice: `evaluateAll` and
`assess` return reports in catalog order, so that order must say nothing about
merit, likelihood or priority. Sorting by id was rejected because renaming a slug
would re-shuffle what every reader sees first; sorting by anything substantive
would be a claim about importance. Appending never renumbers an existing record.

### Open after this change

- **`scripts/check-pathway-citations.mjs` needs re-anchoring and is failing.**
  It locates the shipped set by matching `MERIDIAN_PATHWAY_CATALOG … = [`, which
  the new module-list assembly does not produce, so it reports "declares no
  `MERIDIAN_PATHWAY_CATALOG` array" and exits 1. This is the guard's anti-vacuity
  check working — it refuses to confirm a shipped set it cannot read, because a
  check that reads nothing agrees with everything. **Fix the script to follow the
  module list; do not relax the check.** Every other assertion it makes passed on
  the same run: citation freshness, one-id-one-instrument, dangling references,
  and parser-versus-raw record counts.
- **Four probable defects in `es.ts` are unrepaired**, identified during research
  and left alone because the file was being edited concurrently: citations to
  RD 557/2011 that now point at repealed text; an over-stated insurer requirement
  on `es-non-lucrative-visa`; IPREM stated annually where art. 62.1 states it
  monthly; and the digital-nomad 20% cap. Separately,
  `SPANISH_OFFICIAL_LANGUAGE_COUNTRIES` carries 19 entries where RD 1004/2015
  art. 6.5 is a closed enumeration of 20 including Puerto Rico. These six records
  should not go to counsel until this is addressed.
- **One closing date is weakly sourced and flagged as such.**
  `es-nationality-democratic-memory-option` carries `closedOn: '2025-10-23'` from
  two official Spanish consular pages; the underlying Council of Ministers
  agreement could not be located in the BOE. Its citation is `official_guidance`,
  `discretionary: true`, and carries no URL.

Verified on 2026-07-25: `pnpm build --filter "./packages/*"` — 7 tasks
successful; `validateCatalog()` over all 49 records — 0 issues, 0 errors, 53
`leadsTo` edges all resolving; `node scripts/check-pathway-citations.mjs` — OK
before the index refactor (11 catalog files, 49 pathways, 201 citation
constants, 511 criterion references resolved), failing after it for the reason
above. The catalog figures in this entry were derived by loading the built
catalog and counting the records, not from any summary.

### Added — 2026-07-25

Initial build of the six domain packages, the API, and three Next.js
applications. Everything typechecks clean under strict settings; **1021 tests
across 39 files pass** — 913 across 32 in `packages/`, and a further 108 across 7
in `apps/api`. The three Next.js applications have no tests.

**`@meridian/core`** — the shared contract. 60 tests.

- Civil-date arithmetic with no JavaScript `Date`: branded `IsoDate`, closed and
  inclusive `DateRange`, Hinnant `days_from_civil` / `civil_from_days`,
  `addDays` / `addMonths` (clamping) / `diffDays`, `mergeRanges` (merges adjacent
  as well as overlapping), `complementRanges`, `overlapDays`, `lookbackWindow`.
- The advice boundary: `DisclosureClass`, `Disclosable<T>`, `canRelease`,
  `ReleaseContext`, `AuthorizedRepresentative`. `RepresentativeCredential` names
  the paralegal limb of IRPA s.91 as a first-class member rather than folding it
  into the residual case, because omitting it would wrongly downgrade advice a
  licensed professional is in fact accountable for.
- Legal provenance: `Citation` with `verifiedOn` and `discretionary`, and
  `staleness` bands (`fresh` ≤90d, `aging` ≤180d, `stale` >180d).
- Jurisdictions: `CountryCode`, `SCHENGEN_MEMBERSHIP` with **per-state effective
  dates** and `isSchengenOn` resolving membership per day, Spain
  reduced-residency and no-renunciation sets, CUSMA parties, apostille status.
- Tenancy: `TenantKind` (`firm` / `individual` / `corporate` /
  `madfam_represented`), `representativeFor`, `audienceFor`.
- Matter model: six ordered `MatterPhase`s, `Task`, `unlockTasks` honouring both
  explicit dependencies and phase ordering, `findTaskCycles`.
- `Result<T, E>` and `MeridianError` with a stable error-code taxonomy.

**`@meridian/mrtd`** — ICAO Doc 9303. 111 tests. No dependencies.

- All five MRZ layouts (TD1, TD2, TD3, MRV-A, MRV-B), check-digit computation
  and verification, extended document numbers for every format.
- Century resolution by two sliding windows anchored to a caller-supplied
  reference date rather than a pivot year, so expired documents read correctly.
- Format detection by geometry **and** document code, because MRV-A shares TD3's
  dimensions and MRV-B shares TD2's, and visas have no composite check digit.
- Normalisation deliberately does not repair `O`/`0` or `I`/`1` confusions —
  substituting them produces someone else's document number.
- BAC key seed only. No chip handshake, no PKI chain.
- `todayUtc()`, the one sanctioned clock read under `packages/`, present so a
  caller can override it.

**`@meridian/presence`** — day counting. 147 tests.

- Presence ledger with `PresenceSource`, `PresenceConfidence`, and
  `detectInconsistencies` for conflicting, missing and imputed records.
- Schengen 90/180 with per-day membership resolution, worst-day search,
  next-entry date, and a `exemptFromSchengenShortStay` flag so a resident's days
  at home are not charged against their 90.
- Tax-residency day-count thresholds (ES IRPF art. 9.1.a; CA ITA s. 250(1)(a),
  marked discretionary because "sojourning" is a term of art).
- Continuous residence — Spain's art. 22.3 encoded with a single-absence limb
  only, marked discretionary, with **both cumulative limbs deliberately
  undefined** and a test asserting they stay that way.
- Qualifying-work accumulation with the CEC 1,560-hour figure split into its own
  discretionary `official_guidance` citation, because it is IRCC's published
  operational equivalence rather than regulatory text.
- Every assessment returns the ranges that produced the total, the window, and
  per-record attribution.
- 6 citations, 3 of them `discretionary`.

**`@meridian/pathways`** — the rules engine. 139 tests.

- Declarative `EvaluatorSpec` language (22 operations) with a **law-free
  evaluator**: no country name, threshold or legal concept in `evaluate.ts`.
- Three-valued (Kleene) evaluation. Absence yields `unknown`; an empty array
  yields `false`.
- `statusOn(pathway, asOf)` answers historically, so a matter opened before a
  repeal is assessed against the rules then in force.
- `recommend()` is the only ranking, is born `advice`, and admits only
  `counsel_reviewed` pathways. `downgradeToAssessment` returns the same pathways
  in catalog order with no rank and no rationale.
- Catalog integrity validation with typed issue codes.
- Prototype-pollution guard in `resolvePath`.
- **Catalog**: 4 files, 8 pathways (6 ES, 2 CA), 43 criteria, 20 citations of
  which 5 are `discretionary` and 7 carry a URL, **0 counsel-reviewed**. Seven
  routes are open on 2026-07-25; the Spanish investor route is recorded as
  closed, because a person already holding that status still needs an answer.

**`@meridian/documents`** — paperwork logistics. 146 tests.

- 20 document kinds with a status machine that refuses illegal transitions.
- Legalisation routing: apostille, consular chain, EU 2016/1191 exemption
  (date-gated at 2019-02-16), and an explicit `'unknown'` that is never
  satisfied by prior work.
- Translation requirements with Spain's six co-official zones, Navarre modelled
  as territorially limited, and four translation profiles (ES, CA, MX, US).
- Freshness projected to the **submission date**, with a dedicated
  `expires_before_submission` verdict and `earliestSafeIssueDate`.
- Checklist assembly emitting `Task` records ordered obtain → legalise →
  translate, all `locked` so `unlockTasks` owns promotion.
- Gap analysis with a total comparator, so output is identical whichever order
  documents arrive in.
- 23 citations, 15 of them `discretionary`.

**`@meridian/govtech`** — government adapters. 310 tests.

- Capability model with five states and a defect checker.
  `stateFromRequirements` returns the unsatisfied state for an empty requirement
  set, so vacuous truth cannot make a capability report itself green.
- Two-layer credential-custody refusal: `CredentialFree<T>` at the type level
  (with `@ts-expect-error` tests, so `tsc` fails if it breaks) plus
  `guardCredentialFree` at runtime.
- `buildHandoff` — assisted handoff with an https-only, allowlisted,
  query-string-free destination, ordered steps, and a mandatory bring-back
  capture.
- Adapters: `es-clave`, `es-dicireg`, `ca-ircc`. 16 citations, 9
  `discretionary`.
- `verifyNoSyntheticSuccess` makes the no-fabrication commitment checkable.
- **Capability board**: 15 capabilities — 6 `available` (all local computation),
  2 `not_provisioned`, 3 `not_implemented`, 4 `refused_by_policy`, 0 `degraded`,
  0 defects, board `consistent: true`.
  **Zero government-system capabilities are available.**

**`apps/api`** — Fastify application. 108 tests across 7 files, all against the
in-memory repository adapter.

- `src/main.ts` — the composition root, and the only file that reads
  `process.env`, constructs a database client or binds a socket. The Prisma
  client loads through a *variable* specifier so `tsc --noEmit` does not depend
  on `prisma generate` having run; the client's shape is asserted at boot
  instead, where the message can name the missing delegate. Shutdown drains
  in-flight requests before releasing the database, so an audit append in
  progress is not lost.
- `src/config.ts` — validates the whole environment once and reports **every**
  problem in one error, naming variables and never interpolating a value. An
  empty environment names seven: `DATABASE_URL`, `JANUA_JWKS_URL`,
  `JANUA_ISSUER`, `JANUA_AUDIENCE`, `PORT`, `NODE_ENV`, `CORS_ALLOWED_ORIGINS`.
  Exit code 78 (`EX_CONFIG`). `PORT` deliberately has no default: a service that
  picks its own port binds one nobody is routing to.
- `auth/` — Janua JWKS verification, RS256 checked both before and during
  verification, issuer **and** audience both required.
- `disclosure/` — the gate (which re-checks a downgraded value), the response
  envelope, a leak detector, and a Fastify plugin.
- `routes/registry.ts` — an `onRoute` hook that **refuses to register any route**
  not declaring whether it returns engine output. The server cannot start with
  an unclassified route.
- `repositories/` — ports with **structural tenant scoping**: no interface
  method takes a tenant id, so a cross-tenant read is not a call a handler can
  make. Prisma and in-memory adapters.
- `audit/` — append-only. `append` and `list`; no update, no delete. Every
  mutation *and every disclosure downgrade* writes exactly one row.
- `prisma/schema.prisma` — 10 models, 15 enums. No migration generated.
- `routes/` — health, tenants, applicants, matters, tasks, presence, documents,
  pathways, identity, govtech and audit: 41 HTTP routes across 11 modules. The
  identity route returns an MRZ verdict and persists none of the document.
- `tests/` — token verification against the attacks actually used against JWT
  APIs (the unsecured token, algorithm confusion using the published public key
  as an HMAC secret, a token minted for a neighbouring service in the same
  realm); the advice boundary end to end; tenant isolation at the HTTP boundary
  with a valid token for the wrong tenant; readiness with the dependency down;
  and the case-file routes at the Schengen 90/91 boundary.
- The image builds and starts: `docker build -f Dockerfile.api` followed by
  `docker run` reaches configuration validation and exits 78, naming the five
  variables the image does not already set and printing no value.

**`apps/landing`** — public marketing site, Next.js 15 App Router, local dev port
3000. No tests.

- One page plus a not-found page, bilingual English/Spanish throughout, each
  half carrying its own `lang` attribute so assistive technology switches voice.
- **Every figure is counted, not written.** `lib/catalog-facts.ts` imports
  `@meridian/core` and `@meridian/pathways` and derives pathways shipped,
  pathways counsel-reviewed, routes open, criteria, distinct sources cited, how
  many are `discretionary`, how many carry a URL and how many have left the
  freshest staleness band — all at build time, as at one fixed civil date. There
  is no `Date` in the application. No adoption numbers, no processing-time
  estimates, no success rates, no testimonials, no roadmap dressed as a feature
  list.
- The limits get the same prominence as the capabilities: the advice boundary
  and the credential refusal sit in the middle of the page rather than in a
  footer, and the status section states plainly that nothing is deployed and
  that no rule has been read by a lawyer.
- `NOTHING_IS_COUNSEL_REVIEWED` is derived rather than declared, so the sentence
  explaining why nothing can be recommended stops applying on its own the day
  counsel signs a record off.

**`apps/web`** — applicant portal, Next.js 15 App Router, local dev port 3001.
Components including `DisclosureNotice`, `Citations`, `Bilingual`, `Working`,
`WorkedExample`, `PhaseTimeline`, `TaskList`. Renders from sample data declared
in its own source. No tests.

**`apps/admin`** — firm console, Next.js 15 App Router, local dev port 3002.
Caseload, catalog review, audit trail, integrations board, roster,
spec-language rendering. `MERIDIAN_ASOF` pins its reference date and
`MERIDIAN_ADMIN_DATASET` selects which dataset it serves, falling back visibly
rather than failing the render. No tests.

**Repository guards** — `scripts/check-advice-boundary.mjs`,
`scripts/check-no-credential-custody.mjs`, `scripts/check-pathway-citations.mjs`.
All three run clean, and each reports what it examined rather than only its
verdict, because a guard that has quietly stopped matching anything passes just
as silently as one that is working. The credential check verifies structural
anchors as well as patterns, so a weakened codebase goes red rather than
passing.

**CI and deployment configuration** — `.github/workflows/ci.yml` (jobs: policy,
typecheck, test, build; the policy job runs the three guards before any install)
and `build-deploy.yml`, which builds and signs four images. `enclii.yaml` with
five documents — a project-level record and one Service per deployable —
`Dockerfile.{api,web,admin,landing}`, `docker-compose.yml` (Postgres only, bound
to loopback), and `infra/k8s/production/` (namespace, four deployment/service
pairs, kustomization, secrets template). Nothing is deployed.

**Documentation** — `README.md`, `AGENTS.md`, `CLAUDE.md`, `ECOSYSTEM.md`,
`SECURITY.md`, `CONTRIBUTING.md`, `llms.txt`, `llms-full.txt`, and `docs/`
(`PRD.md`, `ARCHITECTURE.md`, `REGULATORY_POSTURE.md`,
`LEGAL_CATALOG_REVIEW.md`, and ADRs 0001-0006).

### Changed — 2026-07-25

Three changes landed later in the same build session and invalidated statements
made earlier in it. They are recorded separately because each one moves
something an operator or an agent would otherwise get wrong.

**Workspace packages now emit JavaScript.** Each of the six packages builds with
`tsc -p tsconfig.build.json`, and its `exports` map points `types` at
`./dist/index.d.ts` and `default` at `./dist/index.js`. They previously published
`"main": "./src/index.ts"` and shipped no build step.

- The reason is not tidiness. Node executes JavaScript, and its type-stripping
  mode does not remap the `./x.js` specifiers those sources use onto the `./x.ts`
  files on disk, so the API container started and then died on its first import —
  in production, after a green pipeline. `Dockerfile.api` now imports every
  workspace package under Node before it will emit an image, so that failure
  happens at build time instead. An earlier version of that check pattern-matched
  the manifest for `.ts` and rejected all six packages once they gained a correct
  `types` condition, because `"./dist/index.d.ts"` contains `.ts`; asking Node to
  load the package is the honest form of the question.
- Turbo's `typecheck` and `test` tasks both `dependsOn: ["^build"]`, so a
  cross-package import always reads a fresh `dist/`. A stale `dist` means testing
  code nobody wrote.
- `transpilePackages` and `experimental.extensionAlias` were **removed** from all
  three Next configs, and each config records why: there are no `.ts` files
  inside `@meridian/*` for webpack to compile, and remapping `./civil-date.js`
  onto `civil-date.ts` would send a valid JavaScript request hunting for
  TypeScript that is not published. Verified by building.

**The public front door and the applicant portal were split.** `apps/landing` was
added, `meridian.madfam.io` became the landing site, and the portal moved to
`meridian-app.madfam.io`.

- The Enclii Service and the Kubernetes Deployment/Service renamed
  `meridian-web` → `meridian-app`. The workspace package stays `@meridian/web`,
  the source stays `apps/web`, `Dockerfile.web` keeps its name and the image
  stays `ghcr.io/madfam-org/meridian-web`. Avala runs the same split —
  `avala-web` is the application, `avala-landing` is marketing — and renaming the
  package would touch every import in the repository to change a hostname.
- **The Janua `client_id` deliberately stays `meridian-web`.** It is an external
  registration, not a label this repository owns; changing it before the new
  client exists in Janua fails every sign-in with an unknown-client error.
  Comments in `infra/k8s/production/web-deployment.yaml` and `enclii.yaml` say
  so, and the rename belongs in the change that registers the new client.
- `enclii.yaml` went from four documents to five, `infra/k8s/production/` from
  three deployment/service pairs to four, and `build-deploy.yml` from three
  images to four. The landing image publishes as
  `ghcr.io/madfam-org/meridian/landing` — the nested form Avala and Enclii
  already use — while the older three keep their flat paths, because renaming
  them would orphan their GHCR packages and reset three pinned digests for images
  whose bytes did not change.
- `https://meridian.madfam.io` was removed from the API's CORS allowlist. That
  host is now a marketing page which makes no API call, and a marketing page on
  the allowlist is standing permission nothing needs.

**Container ports are now framework defaults**: 3000 for the three Next
applications, 8000 for the API. Meridian claims **no port block**.

- In production the number has no effect at all — every pod has its own network
  namespace and Cloudflare Tunnel routes by hostname to a Kubernetes Service, so
  three pods can all listen on 3000 and never collide. It matters for exactly two
  things: internal consistency within one service (containerPort must agree with
  the Service `targetPort`, the probes and the `ports:` in the generated
  NetworkPolicy, or the CNI drops traffic silently — Meridian names the port
  `http` everywhere so these agree by construction rather than by vigilance), and
  local development, where four apps on one laptop use 3000, 3001, 3002 and the
  API's `PORT`.
- The full argument lives in `ECOSYSTEM.md`; everything else references it rather
  than restating it.

### Known gaps — 2026-07-25

Measured at 17:50 America/Mexico_City, during the initial build. Recorded here
rather than left to be discovered.

- **The three Next.js applications have no tests.** `apps/landing`, `apps/web`
  and `apps/admin` contain no test files. Nothing asserts what a browser renders
  or how these applications derive their state. **This is the largest gap in the
  repository.**
- **No contract test suite for the repository ports.** All 108 API tests run
  over `InMemoryRepositoryProvider`, which is a complete implementation rather
  than a mock; the Prisma adapter is covered by `tsc` and nothing else. The two
  can drift, and ADR 0006 names that as its main risk.
- **No migration.** `apps/api/prisma/` holds `schema.prisma` and nothing else,
  and `prisma generate` has never been run in this workspace — only inside
  `Dockerfile.api`, where it writes into the image and nowhere else.
- **Nothing has been exercised end to end.** No request has travelled from a
  screen through the service to a database in any environment. None of the three
  Next apps reads an API host from the environment, so none of them would call
  the API yet even if it were running.
- **No deployment.** The manifests and the Enclii service definitions exist; no
  namespace, DNS record or tunnel route does.
- **No formatting check.** Prettier is a root devDependency with no config file,
  and CI does not check formatting. Existing code follows a roughly 100-110
  character line width.
- **No pathway has been reviewed by counsel**, so `recommend()` ranks nothing.
  This is the designed state, not a bug. See `docs/LEGAL_CATALOG_REVIEW.md`.
- **No government integration is available.** Two are `not_provisioned` pending
  formal agreements, three are `not_implemented`, four are `refused_by_policy`.
- **The source PRD text is not committed.** `docs/PRD.md` carries the editorial
  preface and the record of our two departures; the verbatim origin document
  must still be pasted into the marked block at the end of that file, unaltered.
- **`packages/mrtd/package.json` declares no dependencies**, yet
  `src/bac.ts` imports `node:crypto`. Types resolve today from the hoisted root
  `@types/node`, so `tsc` is clean. Whoever next touches the lockfile should add
  `"@types/node": "^22.10.2"` to that package's devDependencies in the same
  change. There is no runtime dependency — `node:crypto` is standard library.
- **Some environment names are declared but unread.** `MERIDIAN_ENV`,
  `JANUA_URL`, `MERIDIAN_WEB_ORIGIN`, `MERIDIAN_ADMIN_ORIGIN` and the
  `NEXT_PUBLIC_*` set appear in `enclii.yaml` and the Deployments, and no
  application code reads them yet. They document the intended runtime contract
  ahead of the code that will consume it; `ECOSYSTEM.md` marks which is which.

### Fixed — 2026-07-25

- **`canRelease`'s enumeration of authorised representatives.** An earlier
  revision omitted the paralegal limb of IRPA s.91 from both the module doc
  comment and `RepresentativeCredential`, leaving the case to the residual
  `other_regulated` member. `canadian_paralegal` is now a first-class member and
  the doc comment names paralegals explicitly. Behaviour was already correct; the
  enumeration is a legal statement and now reads as one.

### Deliberately not built

- Custody of any government credential.
  [ADR 0003](docs/adr/0003-no-credential-custody.md)
- Any recommendation, ranking, score or predicted outcome released to an
  unrepresented applicant.
  [ADR 0002](docs/adr/0002-advice-boundary-as-a-type.md)
- Processing-time estimates. The schema supports `publishedProcessingDays`; no
  pathway populates it, and none should without a published, cited figure.
- Chip protocols, passive-authentication certificate chains, and OCR
  auto-correction in `@meridian/mrtd`.
- Residual passport-validity rules ("valid for 3 months beyond departure") in
  `@meridian/documents` — they are anchored to a travel date, are a different
  shape, and belong to the pathway that imposes them.
- An apex domain. "Meridian" is heavily contested in the .com/.io space and the
  platform does not need one to operate; every hostname is flat under
  `madfam.io`, because Cloudflare universal SSL covers one subdomain level.
- Any figure that could not be sourced. See the omissions listed in
  [ADR 0005](docs/adr/0005-data-driven-pathway-catalog.md).

---

## [0.1.0] — unreleased

Reserved for the first tagged release. Nothing has been released.

Of the four conditions this section originally set, two are now met: the API
starts — its image builds, boots and validates its environment — and its
disclosure gate is covered by tests. A 0.1.0 tag should not be cut before, at
minimum, the other two: the repository ports have a contract suite run against
**both** adapters, and at least one pathway has moved to `counsel_reviewed`. Add
to those a migration that has actually been applied to a Postgres, and a first
test for whichever Next.js application ships first.

[Unreleased]: https://github.com/madfam-org/meridian/commits/main
