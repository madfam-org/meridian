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

### Added — 2026-07-25

Initial build of the six domain packages. All six typecheck clean under strict
settings; **901 tests across 32 files pass.**

**`@meridian/core`** — the shared contract. 51 tests.

- Civil-date arithmetic with no JavaScript `Date`: branded `IsoDate`, closed and
  inclusive `DateRange`, Hinnant `days_from_civil` / `civil_from_days`,
  `addDays` / `addMonths` (clamping) / `diffDays`, `mergeRanges` (merges adjacent
  as well as overlapping), `complementRanges`, `overlapDays`, `lookbackWindow`.
- The advice boundary: `DisclosureClass`, `Disclosable<T>`, `canRelease`,
  `ReleaseContext`, `AuthorizedRepresentative`.
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

**`@meridian/presence`** — day counting. 146 tests.

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

**`@meridian/pathways`** — the rules engine. 137 tests.

- Declarative `EvaluatorSpec` language (18 operations) with a **law-free
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
- **Catalog**: 8 pathways (6 ES, 2 CA), 20 citations, **0 counsel-reviewed**.

**`@meridian/documents`** — paperwork logistics. 146 tests.

- 20 document kinds with a status machine that refuses illegal transitions.
- Legalisation routing: apostille, consular chain, EU 2016/1191 exemption
  (date-gated at 2019-02-16), and an explicit `'unknown'` that is never
  satisfied by prior work.
- Translation requirements with Spain's six co-official zones, Navarre modelled
  as territorially limited.
- Freshness projected to the **submission date**, with a dedicated
  `expires_before_submission` verdict and `earliestSafeIssueDate`.
- Checklist assembly emitting `Task` records ordered obtain → legalise →
  translate, all `locked` so `unlockTasks` owns promotion.
- Gap analysis with a total comparator, so output is identical whichever order
  documents arrive in.

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
- Adapters: `es-clave`, `es-dicireg`, `ca-ircc`.
- `verifyNoSyntheticSuccess` makes the no-fabrication commitment checkable.
- **Capability board**: 15 capabilities — 6 `available` (all local computation),
  2 `not_provisioned`, 3 `not_implemented`, 4 `refused_by_policy`, 0 `degraded`.
  **Zero government-system capabilities are available.**

**`apps/api`** — Fastify application. No tests, and no `src/main.ts` composing
it into a process.

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
- `routes/` — health, tenants, applicants, matters, tasks.

**`apps/web`** — applicant portal, Next.js 15 App Router, port 6101. Components
including `DisclosureNotice`, `Citations`, `Bilingual`, `Working`,
`PhaseTimeline`, `TaskList`. No tests.

**`apps/admin`** — firm console, Next.js 15 App Router, port 6102. Caseload,
catalog review, audit trail, integrations board, roster, spec-language rendering.
No tests.

**Repository guards** — `scripts/check-advice-boundary.mjs`,
`scripts/check-no-credential-custody.mjs`, `scripts/check-pathway-citations.mjs`.
All three run clean. The credential check verifies structural anchors as well as
patterns, so a weakened codebase goes red rather than passing.

**CI and deployment configuration** — `.github/workflows/ci.yml` (jobs: policy,
typecheck, test, build; the policy job runs the three guards before any install)
and `build-deploy.yml`. `enclii.yaml` with four service documents,
`Dockerfile.{api,web,admin}`, `docker-compose.yml`, and `infra/k8s/production/`
(namespace, three deployment/service pairs, kustomization, secrets template).
Nothing is deployed.

**Documentation** — `README.md`, `AGENTS.md`, `CLAUDE.md`, `ECOSYSTEM.md`,
`SECURITY.md`, `CONTRIBUTING.md`, `llms.txt`, `llms-full.txt`, and `docs/`
(`PRD.md`, `ARCHITECTURE.md`, `REGULATORY_POSTURE.md`,
`LEGAL_CATALOG_REVIEW.md`, and ADRs 0001-0006).

### Known gaps — 2026-07-25

Measured at 14:43 America/Mexico_City, during the initial build. Recorded here
rather than left to be discovered.

- **No application has any tests.** `apps/api`, `apps/web` and `apps/admin`
  contain no test files. The disclosure gate's boundary conditions at the HTTP
  layer — no representative, wrong jurisdiction, expired credential, a downgrade
  that fails to downgrade — are asserted by design and by
  `check-advice-boundary.mjs`, not by a suite. **This is the largest gap in the
  repository.**
- **`apps/api` has no `src/main.ts`.** `package.json` runs
  `tsx watch src/main.ts`; nothing composes the application into a process.
- **No contract test suite for the repository ports.** The in-memory and Prisma
  adapters can drift, and ADR 0006 names that as its main risk.
- **No migration.** `apps/api/prisma/schema.prisma` exists; no migration has been
  generated or applied anywhere.
- **No deployment.** The manifests and the Enclii service definitions exist; no
  namespace, DNS record or tunnel route does.
- **No formatting check.** Prettier is a devDependency with no config file, and
  CI does not check formatting.
- **No pathway has been reviewed by counsel**, so `recommend()` ranks nothing.
  This is the designed state, not a bug. See `docs/LEGAL_CATALOG_REVIEW.md`.
- **No government integration is available.** Two are `not_provisioned` pending
  formal agreements, three are `not_implemented`, four are `refused_by_policy`.
- **The source PRD text is not committed.** `docs/PRD.md` carries the editorial
  preface and the record of our two departures; the verbatim origin document
  must still be pasted in, unaltered.
- **`canRelease`'s doc comment enumerates authorised representatives too
  narrowly**, omitting the paralegal limb of IRPA s.91. The `other_regulated`
  member of `RepresentativeCredential` covers the case, so behaviour is correct;
  the enumeration is a legal statement and is deliberately left for counsel
  review rather than a drive-by edit. See `docs/REGULATORY_POSTURE.md` §2.
- **`packages/mrtd/package.json` declares no dependencies**, yet
  `src/bac.ts` imports `node:crypto`. Types resolve today from the hoisted root
  `@types/node`, so `tsc` is clean. Whoever next touches the lockfile should add
  `"@types/node": "^22.10.2"` to that package's devDependencies in the same
  change. There is no runtime dependency — `node:crypto` is standard library.
- **No prettier config exists** and there is no formatting check. Existing code
  follows a roughly 100-110 character line width.

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
- Any figure that could not be sourced. See the omissions listed in
  [ADR 0005](docs/adr/0005-data-driven-pathway-catalog.md).

---

## [0.1.0] — unreleased

Reserved for the first tagged release. Nothing has been released.

A 0.1.0 tag should not be cut before, at minimum: the API starts, its disclosure
gate is covered by tests, the repository ports have a contract suite run against
both adapters, and at least one pathway has moved to `counsel_reviewed`.

[Unreleased]: https://github.com/madfam-org/meridian/commits/main
