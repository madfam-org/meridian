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

**Snapshot taken 2026-07-26, America/Mexico_City.** Every number below was
produced by running the command named, not estimated. **Verify the current state
yourself** with the commands under *Verification* before relying on any claim
here; this file has been wrong before, and the way it got wrong was by being
read for longer than it was re-measured.

### Verified working

Twelve workspace projects — eight libraries under `packages/` and four
deployables under `apps/`. Every one typechecks clean under strict settings,
including `noUncheckedIndexedAccess`, `verbatimModuleSyntax` and
`noUnusedLocals`, and every test passes. Through turbo: `pnpm typecheck` 19/19
tasks, `pnpm test` 19/19, `pnpm build` 12/12.

| Project | What it does | Test files | Tests |
|---|---|---|---|
| `@meridian/core` | Civil-date arithmetic, the advice boundary, `Citation`, tenancy, matter/task model | 2 | 60 |
| `@meridian/mrtd` | ICAO Doc 9303 MRZ parsing, check digits, century windows, BAC key seed | 5 | 111 |
| `@meridian/presence` | Presence ledger, Schengen 90/180, tax day counts, continuous residence, work hours | 6 | 147 |
| `@meridian/pathways` | Declarative rules engine, three-valued evaluation, review gate, ES + CA + US catalog | 17 | 443 |
| `@meridian/documents` | Legalisation routing, translation requirements, freshness projection, checklists, gaps | 6 | 146 |
| `@meridian/govtech` | Government adapters with honest capability reporting and refused credential custody | 8 | 310 |
| `@meridian/atlas` | 249 jurisdictions, 22 mobility blocs, migrant-stock weighting, the coverage arithmetic | 3 | 77 |
| `@meridian/i18n` | `Locale`, `LocalizedText`, `Accept-Language` negotiation, locale paths, `instrumentLang()` | 6 | 124 |
| *packages subtotal* | | *53* | *1418* |
| `@meridian/api` | Fastify service, Janua RS256 auth, the disclosure gate, tenant-scoped repositories | 7 | 115 |
| `@meridian/landing` | Marketing site — Schengen calculator, catalog figures counted at build time | 9 | 259 |
| `@meridian/web` | Applicant portal — pages, tools, components, sample-data derivation | 16 | 385 |
| `@meridian/admin` | Firm console — caseload, catalog review, audit trail, clock override | 18 | 344 |
| **Total** | | **103** | **2521** |

**The three Next.js applications now have tests.** That was the largest gap in
the repository and it is closed: `apps/landing`, `apps/web` and `apps/admin`
carried no test file at all until 2026-07-26, and now carry 43 files and 988
tests between them. What they assert is rendering and state derivation — the
arithmetic those pages show a reader, the locale a document is served in, the
disclosure notice that has to accompany an assessment — not browser automation.
There is still no end-to-end test.

Each repository guard script prints what it examined rather than only its
verdict, because a guard that has quietly stopped matching anything passes just
as silently as one that is working:

```
$ node scripts/check-advice-boundary.mjs
check-advice-boundary: OK — gate and producer anchors verified,
233 application files read, 16 routes examined.

$ node scripts/check-no-credential-custody.mjs
check-no-credential-custody: OK — 454 files scanned, 3 rules,
3 path exemptions, 2 structural anchors verified.

$ node scripts/check-pathway-citations.mjs
check-pathway-citations: OK — as of 2026-07-26: 15 catalog files, 84 pathways,
378 citations, 1094 criterion references resolved

$ node scripts/check-workspace-manifests.mjs
check-workspace-manifests: OK — 12 workspace projects (apps/admin, apps/api,
apps/landing, apps/web, packages/atlas, packages/core, packages/documents,
packages/govtech, packages/i18n, packages/mrtd, packages/pathways,
packages/presence) present in all 4 Dockerfiles (Dockerfile.admin,
Dockerfile.api, Dockerfile.landing, Dockerfile.web) and in the lockfile.
```

The file counts in the first two move as the tree grows — they read 185 and 400
earlier the same day, before the application tests landed — which is the point.
A guard that reports *what* it read is a guard you can catch reading nothing.

**The citations check passes.** An earlier revision of this file said it was
failing: the catalog index had moved from a literal array to a list of modules
and the guard could not locate the shipped set, so its anti-vacuity check
refused to confirm a set it could not read. The script was re-anchored on the
new shape rather than relaxed, which was the right repair, and it now reads all
84 records.

Three of the four have been proven able to fail: a deliberate violation was
written into the tree, each script named the exact file, and the violation was
removed. Re-run that probe yourself if you change a detector.

A fifth script, `scripts/atlas-coverage.mjs`, is a report rather than a guard —
it prints the coverage arithmetic with its own denominator and caveats, and
takes `--strict` to exit non-zero when the atlas has integrity findings. It is
not in CI.

CI is at `.github/workflows/ci.yml` with four jobs — **policy** (the four guard
scripts, run first and with no install), **typecheck**, **test** and **build** —
plus `build-deploy.yml`, which builds and signs four images.

### Deployed

Three of the four services are live. This is the part of the file most likely to
be stale, so the figures below are HTTP status codes observed on 2026-07-26:

| Service | Hostname | Observed |
|---|---|---|
| `meridian-landing` | [meridian.madfam.io](https://meridian.madfam.io) | `200` — English at `/`, Spanish at `/es`, `/en` `308`s to `/` |
| `meridian-app` | [meridian-app.madfam.io](https://meridian-app.madfam.io) | `200` |
| `meridian-admin` | [meridian-admin.madfam.io](https://meridian-admin.madfam.io) | `200` |
| `meridian-api` | meridian-api.madfam.io | `502` — the hostname resolves and the tunnel answers; no origin is serving |

The three Next applications read no API host from their environment, so nothing
they render depends on the API being up. Nothing has been exercised end to end:
no request has travelled from a screen through the service to a database in any
environment.

### Known gaps

- **The API is not serving.** `meridian-api.madfam.io` returns `502`. The image
  builds and boots as far as environment validation; the operator gates that
  provision its database and its Janua configuration have not all been run.
- **The API has never run against a real database.** Its 115 tests exercise the
  in-memory repository adapter, which is a complete implementation rather than a
  mock. `apps/api/prisma/migrations/` now holds an initial migration — it did
  not before — but nothing in the deploy path runs it, and it has never been
  applied to a live Postgres. There is still no contract suite running the same
  assertions against both adapters, which [ADR 0006](docs/adr/0006-ports-and-adapters-repositories.md)
  names as its own main risk.
- **`@meridian/atlas` has no consumer inside the product.** It is read by
  `scripts/atlas-coverage.mjs` and by its own tests. No application imports it,
  so the coverage figures are reported to us and not yet to a reader deciding
  whether Meridian reaches their country.
- **`negotiateLocale` is unused.** `@meridian/i18n` implements
  `Accept-Language` negotiation with quality values and covers it with tests; no
  application calls it. A reader who lands on `/` gets English because English
  is unprefixed, not because anything looked at their headers.

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
- `prisma/schema.prisma` — 10 models, 15 enums, and one migration.
- `routes/` — health, tenants, applicants, matters, tasks, presence, documents,
  pathways, identity, govtech and audit: 41 HTTP routes across 11 modules. The
  identity route validates an MRZ and **persists none of it**: the verdict is
  returned and every field derived from the travel document is discarded.
- The readiness probe distinguishes *unreachable*, *reachable but no schema*,
  and *healthy*, and says which. It used to be `SELECT 1`, which proves a socket
  and not a schema: against a schema-less database it returned ready, the pod
  would have joined the Service, and every authenticated request would have 500'd
  inside the auth hook.

### Not done

- **No pathway has been reviewed by counsel.** All 84 carry
  `reviewStatus: 'unreviewed'`, so `recommend()` ranks nothing and lists every
  pathway as excluded with code `not_counsel_reviewed`. This is the intended
  live state, not a placeholder — see
  [docs/LEGAL_CATALOG_REVIEW.md](docs/LEGAL_CATALOG_REVIEW.md) and the packet
  written for the reviewer,
  [docs/COUNSEL_REVIEW_PACKET.md](docs/COUNSEL_REVIEW_PACKET.md).
- **No government integration is live.** Of 15 declared adapter capabilities, 6
  are `available` and every one of those is local computation. Zero
  `government_system` capabilities are available: 2 are `not_provisioned`
  (pending formal agreements), 3 are `not_implemented`, and 4 are
  `refused_by_policy` and will stay that way.
- **No formatting check.** Prettier is a root devDependency with no config file
  and CI does not run it. Existing code runs to roughly 100–110 columns.

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
An instrument *name* is never translated — see *The locale system* below.

**3. Every engine output is born disclosure-classified.**
`information` | `assessment` | `advice`, decided where the output is produced,
never at render time. `canRelease()` is the single gate. Downgrading is
possible; upgrading is not.

Each has a CI guard script, and each has an ADR explaining why it is shaped the
way it is.

---

## The locale system

Meridian used to render English and Spanish into the same elements, through a
`bi()` helper with 1,673 call sites across 61 files. The comment defending it
argued that a mixed-language household should see both halves at once. That
reasoning was wrong, and the way it was wrong is worth keeping written down: a
screen-reader user heard every sentence twice, the document was about twice as
long as it needed to be, every reader paid scanning cost to discard half of it,
and `<html lang>` could not be correct, because the page was two languages at
once.

The catalog is unchanged. A `Pathway` still carries `{ en, es }`, and neither
half is subordinate. What changed is the *page*.

- **Locale lives in the URL.** English is unprefixed, Spanish is at `/es`. Both
  are statically prerendered. `/en` exists as a route and permanently redirects
  to `/`, so one document does not answer at two addresses.
- **`hreflang` alternates, with `x-default`.** Served today by
  `meridian.madfam.io`, pointing `en` and `x-default` at `/` and `es` at `/es`.
- **The switcher is a real link**, rendered on the server, pointing at the same
  page in the other language rather than at the home page. It works with
  scripting off, it is crawlable, middle-clicking it opens a tab, and there is no
  client state to fall out of step with the URL.
- **`@meridian/i18n` holds the contract** and depends on nothing — not even
  `@meridian/core`, because every one of its functions runs in a client
  component and a leaf package cannot drag the catalog and zod into a browser
  bundle. It shipped with 124 tests before a single call site used it, because
  the path helpers are asymmetric: English has no prefix, so a hand-rolled
  `startsWith('/es')` decides `/estimate` is Spanish.
- **Instrument names do not translate.** "Código Civil art. 22.1" rendered as
  "Civil Code art. 22.1" names an instrument that does not exist and cannot be
  checked by the person trying to check it. `instrumentLang()` resolves the
  language an instrument name is in, independently of the UI locale, and
  **reports when it does not know** — Canada, Quebec and the EU enact in more
  than one authoritative language, so jurisdiction alone does not settle which
  one a citation used.

---

## Repository map

```
meridian/
├── packages/                       the mature part — 8 libraries, 1418 tests
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
│   │   src/catalog/   13 source modules: es · es-arraigo · es-work-study ·
│   │                  es-family-nationality · ca · ca-federal-economic ·
│   │                  ca-provincial-quebec · ca-work-study · ca-family-pilots ·
│   │                  us-family · us-employment · us-nonimmigrant · us-status-bars
│   │                  plus cusma-professions.ts (63 professions) and index.ts
│   ├── documents/     legalisation, translation, freshness, checklist, gaps.
│   ├── govtech/       adapters that tell the truth about themselves.
│   ├── atlas/         249 jurisdictions, 22 blocs, 280 weighted corridors,
│   │                  and the arithmetic that says what "covered" is a fraction of.
│   └── i18n/          Locale, text selection, Accept-Language, locale paths,
│                      instrumentLang(). Depends on nothing.
│   Each builds to dist/ with tsconfig.build.json; consumers import the emitted JS.
├── apps/
│   ├── api/           Fastify. auth · disclosure gate · repositories · audit · routes
│   │                  prisma/schema.prisma — 10 models, 15 enums, 1 migration
│   │                  src/main.ts composes it; image builds and runs. 115 tests.
│   ├── landing/       marketing site + Schengen calculator, Next.js 15, dev port 3000
│   ├── web/           applicant portal, Next.js 15, dev port 3001
│   │                  /pathways · /matters · /tools/{schengen,mrz,nationality-es}
│   │                  /pricing · /for/[audience]
│   └── admin/         firm console, Next.js 15, dev port 3002
│                      /matters · /catalog · /audit · /integrations · /representatives
│   All three route under app/[locale]/ — English unprefixed, Spanish at /es.
├── docs/
│   ├── PRD.md                    origin document + editorial preface on our departures
│   ├── ARCHITECTURE.md           module map, data flow, where the disclosure gate sits
│   ├── REGULATORY_POSTURE.md     tenancy model, IRPA s.91, the Spanish position
│   ├── COMMERCIAL_POSTURE.md     why the advice boundary and the pricing boundary are one
│   ├── LEGAL_CATALOG_REVIEW.md   the counsel review protocol. Nothing is reviewed yet.
│   ├── COUNSEL_REVIEW_PACKET.md  the document a reviewing lawyer opens
│   ├── PERSONAS.md               who the four doors are for
│   ├── research/                 dated source notes behind the catalog sweeps
│   └── adr/                      0001-0006 architecture decision records
├── scripts/           check-advice-boundary · check-no-credential-custody
│                      check-pathway-citations · check-workspace-manifests  (CI policy job)
│                      atlas-coverage        (report, not a guard; --strict to fail)
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

The four policy checks need no install and are the fastest signal that an
invariant is intact:

```bash
node scripts/check-advice-boundary.mjs
node scripts/check-no-credential-custody.mjs
node scripts/check-pathway-citations.mjs
node scripts/check-workspace-manifests.mjs
```

### Verification

Whole repo, through turbo — this is what CI runs:

```bash
pnpm typecheck
pnpm test
pnpm build
```

And the coverage report, which needs the packages built because it reads the
real objects rather than parsing source:

```bash
pnpm build --filter "./packages/*"
node scripts/atlas-coverage.mjs --as-of=2026-07-26
```

`pnpm dev` runs each application's own `dev` script: the landing site on 3000,
the applicant portal on 3001, the firm console on 3002 and the API on whatever
`PORT` says. The three Next apps render from data declared in their own source
and call nothing; the landing site additionally counts its catalog figures from
`@meridian/pathways` at build time rather than hard-coding them, and takes its
Schengen thresholds and citation from `@meridian/presence` rather than copying
them.

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

Eight pure-computation packages with one dependency direction and no cycles,
plus a thin service that composes them:

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
                   ┌─────▼────────▼─┐   ┌────────┐  ┌────────┐  ┌────────┐
                   │   documents    │   │  mrtd  │  │ atlas  │  │  i18n  │
                   └────────────────┘   └────────┘  └────────┘  └────────┘
                                        the three on the right depend on nothing
```

Every package is a library of total functions over plain data. None of them
performs I/O, reads a clock without being asked, or knows what a database is.
The reference date is always a parameter. That is what makes 1418 package tests
possible without a fixture server, and it is what makes the API's own 115 tests
possible without Postgres — see
[ADR 0006](docs/adr/0006-ports-and-adapters-repositories.md).

Full detail, including where the disclosure gate sits in the request path:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## The legal catalog, as it actually stands

Counted by loading the built catalog and walking the shipped `Pathway` objects,
not read off a summary.

| | |
|---|---|
| Pathway records | 84 — 26 Spain, 23 Canada, 35 United States, across 13 source modules |
| Counsel-reviewed | **0** |
| Status as recorded | 77 open, 5 closed, 2 suspended |
| Kinds | 39 permanent residence, 17 work permit, 15 residence permit, 8 naturalization, 5 entry facilitation |
| Eligibility criteria | 449 — 291 `blocking`, 109 `material`, 49 `informational` |
| Criteria that escalate to a human | 154 unconditionally, 67 conditionally |
| Pathways that can only return `requires_human_review` | 62 of 84 |
| Distinct citations on shipped records | 373, of which 82 are `discretionary` and 347 carry a URL |
| CUSMA/USMCA professions | 63, matching 8 CFR 214.6(c), shared by the Canadian and American routes |
| Presence-engine citations | 6, of which 3 are `discretionary` |
| Document-engine citations | 23, of which 15 are `discretionary` |
| Govtech citations | 16, of which 9 are `discretionary` |
| Pathways publishing a processing-time estimate | 0 |
| Jurisdictions | ES, CA, US (plus an MX translation profile in `documents`) |
| Catalog `verifiedOn` | 2026-07-25 and 2026-07-26 — `fresh` until 2026-10-23 at the earliest |

`check-pathway-citations` reports slightly different figures — 378 citations,
1094 criterion references — because it parses catalog source rather than loading
objects. Both are right about different things: 378 is the number of citation
*literals* written in the files, of which five ids are declared twice, leaving
373 distinct; and 1094 counts every `citationIds` entry anywhere inside a
record, of which 867 sit on criteria and the remainder on duration records.

Because no pathway is counsel-reviewed, `recommend()` returns an empty ranking
and lists every pathway as excluded with code `not_counsel_reviewed`. That is the
system working. The gating item between this engine and a sellable product is
legal review, not engineering.

**Read the coverage limits as carefully as the coverage.** 62 of the 84 records
carry a criterion that can never be decided by software — a sponsor's status, a
family relationship, physical presence as distinct from lawful residence, a
provincial nomination — so those routes return `requires_human_review` for every
applicant, by design, and each escalation names the fact it is waiting for.
**Asylum, refugee protection and humanitarian/compassionate claims are
deliberately out of scope and will not be added**: they turn on credibility
assessment rather than criteria, they concern people at risk, and a self-serve
eligibility checker is the wrong instrument. On the American corridor, the
unlawful-presence bars are encoded as "this may apply, ask a lawyer" and never
as a verdict, because somebody who departs to consular-process can trigger a
ten-year bar *by departing*, and no priority date, cut-off or wait estimate is
encoded anywhere — the Visa Bulletin moves monthly and any number written today
is wrong within weeks. Other named absences are listed in
[docs/LEGAL_CATALOG_REVIEW.md](docs/LEGAL_CATALOG_REVIEW.md).

Three corridors seed the catalog — **Mexico → Spain**, **Mexico → Canada** and
**Mexico → United States**. The engine is jurisdiction-generic; the corridors
are data in `packages/pathways/src/catalog/`.

### How much of the problem this is

`@meridian/atlas` exists so coverage can be measured rather than asserted, and
so the answer cannot be improved by looking away. As at 2026-07-26, from
`node scripts/atlas-coverage.mjs`:

| | |
|---|---|
| Jurisdictions in the denominator | 249, from five region files, plus 22 mobility agreements |
| Research status | 123 `stub`, 123 `researched`, 3 `encoded`, 0 `counsel_reviewed` |
| Structural coverage | **1.20%** — 3 of 249 (CA, ES, US) |
| Weighted coverage, by people | **0.6076%** — both ends encoded |
| Destination-side reach, *not* a coverage figure | 18.4% of world migrant stock |
| Stock table | 280 corridors, 198,645,000 people, **65.34%** complete against a **92.7%** ceiling |

The denominator is not a count of immigration systems in the world and errs in
both directions: it includes places with no permanent population and no
residence route, which permanently depress structural coverage, and it excludes
roughly seven authorities that control entry to territory but have no ISO
alpha-2 code. The ceiling is 92.7% rather than 100% because 7.3% of world stock
is recorded against origin "Others" in the UN DESA source and is unattributable
in any bilateral table. The script prints all of this next to the numbers,
because a percentage without its denominator is how a metric starts lying.

---

## Ecosystem position

Meridian is a MADFAM platform service in the **Mobility** pillar. It consumes
Janua for authentication (OIDC, RS256 via JWKS), Dhanam for billing, Selva at
`/v1` for every LLM call (never a provider directly), Karafiel for compliance
timestamping, and deploys through Enclii.

Four deployables: `meridian-landing` on `meridian.madfam.io`, `meridian-app` on
`meridian-app.madfam.io`, `meridian-admin` on `meridian-admin.madfam.io` — all
three answering — and `meridian-api` on `meridian-api.madfam.io`, which is not.
Container ports are framework defaults — 3000 for the three Next apps, 8000 for
the API — and Meridian claims no port block;
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
