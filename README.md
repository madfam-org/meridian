# Meridian

Global migration law and logistics platform. Eligibility assessment against a
versioned catalog of immigration pathways, sequential document assembly with
legalisation and sworn-translation routing, machine-readable travel-document
validation to ICAO Doc 9303, and continuous cross-border presence tracking.

Innovaciones MADFAM S.A.S. de C.V. — AGPL-3.0-only.

> **Boundary note (Lane C, public-safe).** This repository carries public-safe
> service documentation only. Operational detail — cluster access, secret paths,
> operator gates, cost and capacity data — lives in the private
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> repo under [`docs/repo-boundary-contract.md`](https://github.com/madfam-org/internal-devops/blob/main/docs/repo-boundary-contract.md).

---

## Status

**Snapshot taken 2026-07-25 17:50 America/Mexico_City, at the end of the
repository's initial build.** Numbers below were measured by running the commands
named, not estimated. **Verify the current state yourself** with the commands in
*Verification* before relying on any claim here.

### Verified working

Every project typechecks clean under strict settings — including
`noUncheckedIndexedAccess`, `verbatimModuleSyntax` and `noUnusedLocals` — and
every test passes. `pnpm typecheck` runs 16 turbo tasks and `pnpm build` runs 10;
both are green.

| Project | What it does | Test files | Tests |
|---|---|---|---|
| `@meridian/core` | Civil-date arithmetic, the advice boundary, `Citation`, tenancy, matter/task model | 2 | 60 |
| `@meridian/mrtd` | ICAO Doc 9303 MRZ parsing, check digits, century windows, BAC key seed | 5 | 111 |
| `@meridian/presence` | Presence ledger, Schengen 90/180, tax day counts, continuous residence, work hours | 6 | 147 |
| `@meridian/pathways` | Declarative rules engine, three-valued evaluation, review gate, ES + CA catalog | 5 | 139 |
| `@meridian/documents` | Legalisation routing, translation requirements, freshness projection, checklists, gaps | 6 | 146 |
| `@meridian/govtech` | Government adapters with honest capability reporting and refused credential custody | 8 | 310 |
| `@meridian/api` | Fastify service, Janua RS256 auth, the disclosure gate, tenant-scoped repositories | 7 | 108 |
| `@meridian/landing` | Marketing site — typechecks and `next build` succeeds | — | — |
| `@meridian/web` | Applicant portal — typechecks and `next build` succeeds | — | — |
| `@meridian/admin` | Firm console — typechecks and `next build` succeeds | — | — |
| | | **39** | **1021** |

None of the three Next.js applications has a test suite. That is the largest
remaining gap in the repository, and it is why those three rows claim only that
they build.

Each repository guard script prints what it examined rather than only its
verdict, because a guard that has quietly stopped matching anything passes just
as silently as one that is working:

```
$ node scripts/check-advice-boundary.mjs
check-advice-boundary: OK — gate and producer anchors verified,
155 application files read, 16 routes examined.

$ node scripts/check-no-credential-custody.mjs
check-no-credential-custody: OK — 340 files scanned, 3 rules,
3 path exemptions, 2 structural anchors verified.

$ node scripts/check-pathway-citations.mjs
check-pathway-citations: OK — as of <run date>: 11 catalog files, 49 pathways,
201 citations, 511 criterion references resolved
```

The citations check prints the UTC date it ran on, because staleness is measured
against it; the counts are what is fixed.

**The citations check is currently failing**, and the output above is its last
passing run. `catalog/index.ts` now assembles `MERIDIAN_PATHWAY_CATALOG` from a
list of modules rather than from a literal array, and the script locates the
shipped set by pattern, so its anti-vacuity check refuses to confirm a set it
cannot read. That refusal is the feature. The script needs re-anchoring on the
new shape; the check must not be relaxed.

Two of them were additionally proven able to fail: a deliberate violation was
written into `apps/api/src/`, each script caught it, and the file was removed.
Re-run that probe yourself if you change a detector.

CI exists at `.github/workflows/ci.yml` with four jobs — **policy** (the three
guard scripts, run first and with no install), **typecheck**, **test** and
**build** — plus `build-deploy.yml`, which builds and signs four images.
Deployment configuration exists: `enclii.yaml` (five YAML documents — one
project-level record and one Service per deployable),
`Dockerfile.{api,web,admin,landing}`, `docker-compose.yml`, and
`infra/k8s/production/` (namespace, four deployment/service pairs,
kustomization, and a secrets *template* that is deliberately not a kustomize
resource).

### Known gaps

- **The three Next.js applications have no tests.** They build and typecheck; no
  assertion covers their rendering or their state derivation.
- **The API has never run against a real database.** Its 108 tests exercise the
  in-memory repository adapter, which is a complete implementation rather than a
  mock, but the Prisma adapter is covered only by typechecking and its schema has
  never been applied to a live Postgres. `prisma generate` has not been run in
  this workspace — only inside `Dockerfile.api`, where it writes into the image
  and nothing else — and `apps/api/prisma/` contains a schema and no migrations.
- **Nothing has been exercised end to end.** No request has travelled from a web
  application through the API to a database in any environment. The three Next
  apps read no environment configuration for an API host, so nothing would call
  it yet even if it were running.

What is built in the API is worth naming, because it is the shape the
architecture documents describe:

- `src/main.ts` — the composition root, and the only file that reads
  `process.env`, constructs a database client or binds a socket. Everything else
  takes what it needs as an argument, which is why the test suite can assemble
  the same application with an in-memory store and a local key pair and still be
  testing the real thing.
- `auth/` — Janua JWKS verification, **RS256 only**, with the algorithm checked
  both before and during verification, and issuer *and* audience both required.
- `disclosure/` — the gate, the response envelope, a leak detector, and a route
  registry whose Fastify `onRoute` hook **refuses to register any route that
  does not declare whether it returns engine output**. The server does not start
  until a new route answers that question.
- `repositories/` — ports with **structural tenant scoping**: no interface method
  takes a tenant id; a repository is obtained from `forTenant()` with the id from
  a verified token, so there is no call a handler could make that reads another
  tenant's row. Memory and Prisma adapters both implement them.
- `audit/` — append-only. `AuditRepository` has `append` and `list` and nothing
  else; there is no update or delete to call.
- `prisma/schema.prisma` — 10 models, 15 enums.
- `routes/` — health, tenants, applicants, matters, tasks, presence, documents,
  pathways, identity, govtech and audit: 41 HTTP routes across 11 modules. The
  identity route validates an MRZ and **persists none of it**: the verdict is
  returned and every field derived from the travel document is discarded.

### Not done

- **Nothing is deployed.** No namespace, no DNS, no tunnel routes. The manifests
  and the Enclii service definitions exist; the operator gates have not been run.
- **No pathway has been reviewed by counsel.** All 49 carry
  `reviewStatus: 'unreviewed'`, so `recommend()` ranks nothing and lists every
  pathway as excluded with code `not_counsel_reviewed`. This is the intended
  live state, not a placeholder — see
  [docs/LEGAL_CATALOG_REVIEW.md](docs/LEGAL_CATALOG_REVIEW.md) and the packet
  written for the reviewer,
  [docs/COUNSEL_REVIEW_PACKET.md](docs/COUNSEL_REVIEW_PACKET.md).
- **`scripts/check-pathway-citations.mjs` is failing and needs re-anchoring.**
  The catalog index now assembles `MERIDIAN_PATHWAY_CATALOG` from a list of
  modules rather than a literal array, and the guard locates the shipped set by
  pattern. It is the anti-vacuity check refusing to confirm a set it cannot
  read — which is what it exists to do — so the fix belongs in the script, not
  in the check.
- **No government integration is live.** Of 15 declared adapter capabilities, 6
  are `available` and every one of those is local computation. Zero
  `government_system` capabilities are available: 2 are `not_provisioned`
  (pending formal agreements), 3 are `not_implemented`, and 4 are
  `refused_by_policy` and will stay that way.

### Deliberately refused, permanently

Meridian does not hold a user's government authentication credential (Cl@ve PIN,
Cl@ve Permanente password, portal password, e.firma key) and does not act before
an authority while presenting as the user. The refusal is in the type system,
backed by a runtime guard and a CI check — not in a policy document. See
[docs/adr/0003-no-credential-custody.md](docs/adr/0003-no-credential-custody.md).

Meridian does not emit a recommendation, ranking, strategy or prediction of
outcome to an unrepresented applicant. See
[docs/adr/0002-advice-boundary-as-a-type.md](docs/adr/0002-advice-boundary-as-a-type.md).

---

## The three invariants

Everything in this repository is built to hold these three. A change that breaks
one of them is a defect regardless of what else it improves.

**1. Never use JavaScript's `Date` for calendar arithmetic.**
Immigration day-counting is civil-date arithmetic: "the day you entered Spain"
is a calendar day, not an instant. A UTC-versus-local off-by-one silently turns
a lawful 90-day stay into an overstay. Use `addDays` / `addMonths` / `diffDays` /
`mergeRanges` / `overlapDays` / `complementRanges` / `lookbackWindow` from
`@meridian/core`. `DateRange` is closed at both ends: 2025-01-01 to 2025-01-01
is one day.

**2. Every applied rule carries a `Citation`.**
Instrument, provision, jurisdiction, and `verifiedOn`. A rule with no citation
cannot be checked by the person whose life it governs, and cannot be re-verified
when the law changes. Citations age `fresh` (≤90d) → `aging` (≤180d) → `stale`.

**3. Every engine output is born disclosure-classified.**
`information` | `assessment` | `advice`, decided where the output is produced,
never at render time. `canRelease()` is the single gate. Downgrading is
possible; upgrading is not.

Each has a CI guard script, and each has an ADR explaining why it is shaped the
way it is.

---

## Repository map

```
meridian/
├── packages/                       the mature part — pure libraries, 913 tests
│   ├── core/          @meridian/core      the shared contract. Read this first.
│   │   src/civil-date.ts   IsoDate, DateRange (closed/inclusive), Hinnant algorithms
│   │   src/disclosure.ts   DisclosureClass, canRelease, Disclosable<T>
│   │   src/citation.ts     Citation, staleness bands
│   │   src/jurisdiction.ts CountryCode, dated Schengen membership, apostille status
│   │   src/tenancy.ts      TenantKind, representativeFor, audienceFor
│   │   src/matter.ts       Matter, MatterPhase, Task, unlockTasks, findTaskCycles
│   │   src/result.ts       Result<T,E>  ·  src/errors.ts  MeridianError
│   ├── mrtd/          ICAO 9303. Pure computation, depends on nothing.
│   ├── presence/      day counting. Every number shows its work.
│   ├── pathways/      rules engine + catalog. The law is data.
│   ├── documents/     legalisation, translation, freshness, checklist, gaps.
│   └── govtech/       adapters that tell the truth about themselves.
│   Each builds to dist/ with tsconfig.build.json; consumers import the emitted JS.
├── apps/
│   ├── api/           Fastify. auth · disclosure gate · repositories · audit · routes
│   │                  prisma/schema.prisma — 10 models, 15 enums
│   │                  src/main.ts composes it; image builds and runs. 108 tests.
│   ├── landing/       marketing site, Next.js 15 App Router, local dev port 3000
│   ├── web/           applicant portal, Next.js 15 App Router, local dev port 3001
│   └── admin/         firm console, Next.js 15 App Router, local dev port 3002
│                      the three Next apps have no tests
├── docs/
│   ├── PRD.md                    origin document + editorial preface on our departures
│   ├── ARCHITECTURE.md           module map, data flow, where the disclosure gate sits
│   ├── REGULATORY_POSTURE.md     tenancy model, IRPA s.91, the Spanish position
│   ├── LEGAL_CATALOG_REVIEW.md   the counsel review protocol. Nothing is reviewed yet.
│   └── adr/                      0001-0006 architecture decision records
├── scripts/           check-advice-boundary · check-no-credential-custody
│                      check-pathway-citations   (all three run clean)
├── infra/k8s/production/          namespace, four deployment/service pairs,
│                                  kustomization, secrets template
├── enclii.yaml                    five documents: a project record + four Services
├── Dockerfile.{api,web,admin,landing}     docker-compose.yml
└── .github/workflows/             ci.yml (policy · typecheck · test · build)
                                   build-deploy.yml
```

---

## Quickstart

Requires Node 22 (the root `package.json` sets `engines.node >= 20`; development
and CI are on 22) and pnpm 9.15.9.

```bash
git clone https://github.com/madfam-org/meridian
cd meridian
pnpm install
```

Workspace packages are consumed as **built JavaScript**, not as TypeScript
source, so anything that reads them across a package boundary needs them built
first. Turbo enforces the ordering (`typecheck` and `test` both depend on
`^build`), which is why the whole-repo commands below need no ceremony:

```bash
pnpm build --filter "./packages/*"   # or just `pnpm build`
pnpm -r --filter "./packages/*" typecheck
pnpm -r --filter "./packages/*" test
```

The three policy checks need no install and are the fastest signal that an
invariant is intact:

```bash
node scripts/check-advice-boundary.mjs
node scripts/check-no-credential-custody.mjs
node scripts/check-pathway-citations.mjs
```

Whole repo, through turbo:

```bash
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` runs each application's own `dev` script: the landing site on 3000,
the applicant portal on 3001, the firm console on 3002 and the API on whatever
`PORT` says. The three Next apps render from data declared in their own source
and call nothing; the landing site additionally counts its catalog figures from
`@meridian/pathways` at build time rather than hard-coding them.

The API validates its whole environment at boot and reports every problem at
once. With an empty environment it names **seven** variables — `DATABASE_URL`,
`JANUA_JWKS_URL`, `JANUA_ISSUER`, `JANUA_AUDIENCE`, `PORT`, `NODE_ENV` and
`CORS_ALLOWED_ORIGINS` — and exits 78 without printing a single value.

The API image can be built and run locally, which is the only way to catch a
package that resolves to TypeScript at runtime:

```bash
docker build -f Dockerfile.api -t meridian-api:local .
docker run --rm meridian-api:local
```

`Dockerfile.api` sets `NODE_ENV` and `PORT`, so that `docker run` reaches
environment validation and names the remaining five variables. The build also
imports every workspace package under Node before it will produce an image, so a
package missing its `dist` fails the build rather than the pod.

---

## Architecture at a glance

Six pure-computation packages with one dependency direction and no cycles, plus
a thin service that composes them:

```
                    ┌──────────────────┐
                    │  @meridian/core  │  civil dates · disclosure · citation
                    └────────┬─────────┘
          ┌──────────────┬───┴────┬──────────────┐
          │              │        │              │
    ┌─────▼─────┐  ┌─────▼─────┐  │        ┌─────▼─────┐
    │ presence  │  │ pathways  │  │        │  govtech  │
    └───────────┘  └─────┬─────┘  │        └───────────┘
                         │        │
                   ┌─────▼────────▼─┐        ┌──────────────┐
                   │   documents    │        │     mrtd     │  (depends on nothing)
                   └────────────────┘        └──────────────┘
```

Every package is a library of total functions over plain data. None of them
performs I/O, reads a clock without being asked, or knows what a database is.
The reference date is always a parameter. That is what makes 913 package tests
possible without a fixture server, and it is what makes the API's own 108 tests
possible without Postgres — see
[ADR 0006](docs/adr/0006-ports-and-adapters-repositories.md).

Full detail, including where the disclosure gate sits in the request path:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## The legal catalog, as it actually stands

| | |
|---|---|
| Pathway records | 49 — 26 Spain, 23 Canada, across nine source files |
| Counsel-reviewed | **0** |
| Status as recorded | 42 open, 5 closed, 2 suspended |
| Eligibility criteria | 261 — 183 `blocking`, 50 `material`, 28 `informational` |
| Criteria that escalate to a human | 65 unconditionally, 22 conditionally |
| Pathways that can only return `requires_human_review` | 32 of 49 |
| Distinct citations in the pathway catalog | 196, of which 47 are `discretionary` and 178 carry a URL |
| Presence-engine citations | 6, of which 3 are `discretionary` |
| Document-engine citations | 23, of which 15 are `discretionary` |
| Govtech citations | 16, of which 9 are `discretionary` |
| Pathways publishing a processing-time estimate | 0 |
| Jurisdictions | ES, CA (plus MX and US translation profiles in `documents`) |
| Catalog `verifiedOn` | 2026-07-25 — `fresh` until 2026-10-23 |

Because no pathway is counsel-reviewed, `recommend()` returns an empty ranking
and lists every pathway as excluded with code `not_counsel_reviewed`. That is the
system working. The gating item between this engine and a sellable product is
legal review, not engineering.

**Read the coverage limits as carefully as the coverage.** 32 of the 49 records
carry a criterion that can never be decided by software — a sponsor's status, a
family relationship, physical presence as distinct from lawful residence, a
provincial nomination — so those routes return `requires_human_review` for every
applicant, by design, and each escalation names the fact it is waiting for.
**Asylum, refugee protection and humanitarian/compassionate claims are
deliberately out of scope and will not be added**: they turn on credibility
assessment rather than criteria, they concern people at risk, and a self-serve
eligibility checker is the wrong instrument. Other named absences — Spain's route
for family members of Spanish nationals, every IRCC operational figure that lives
only in program delivery instructions, and all admissibility grounds beyond a
self-declared criminal record — are listed in
[docs/LEGAL_CATALOG_REVIEW.md](docs/LEGAL_CATALOG_REVIEW.md).

Two foundational corridors seed the catalog: **Mexico → Spain** (nationality by
residence on the reduced two-year period, now alongside the *arraigo* figures,
work and study authorisations, family reunification and long-term residence) and
**Mexico → Canada** (CUSMA Chapter 16 professional entry bridging to the Canadian
Experience Class, now alongside the federal economic classes, the provincial and
Quebec systems, temporary residence and the family class). The engine is
jurisdiction-generic; the corridors are data in
`packages/pathways/src/catalog/`.

---

## Ecosystem position

Meridian is a MADFAM platform service in the **Mobility** pillar. It consumes
Janua for authentication (OIDC, RS256 via JWKS), Dhanam for billing, Selva at
`/v1` for every LLM call (never a provider directly), Karafiel for compliance
timestamping, and deploys through Enclii.

Four deployables are allocated and none is deployed: `meridian-landing` on
`meridian.madfam.io`, `meridian-app` on `meridian-app.madfam.io`,
`meridian-admin` on `meridian-admin.madfam.io` and `meridian-api` on
`meridian-api.madfam.io`. Container ports are framework defaults — 3000 for the
three Next apps, 8000 for the API — and Meridian claims no port block;
[ECOSYSTEM.md](ECOSYSTEM.md) explains why the number has no production effect
and the two narrow cases where it does.

Full context, including the enclii CLI day-to-day reference:
[ECOSYSTEM.md](ECOSYSTEM.md).

---

## Contributing and reporting

- Agent and contributor operating doctrine: [AGENTS.md](AGENTS.md)
- Human contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security and data-sensitivity policy: [SECURITY.md](SECURITY.md)
- Release history and known gaps: [CHANGELOG.md](CHANGELOG.md)

**This repository is public and handles the design of a system that will process
passport, biometric-derived and travel-history data.** Never commit real
applicant data, real document numbers, real MRZ strings, or credentials of any
kind. Every fixture in the test suites is synthetic — issuing state `ZZZ`,
document numbers beginning `ZZ`, `example.invalid` hostnames — and must stay
that way.

## Licence

AGPL-3.0-only. See [LICENSE](LICENSE).
