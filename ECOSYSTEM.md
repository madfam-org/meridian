# meridian — Ecosystem Context

> [!IMPORTANT]
> MADFAM-ENCLII-FIRST v1: Routine production operations must use Enclii web,
> API, or CLI. Treat raw `kubectl`, `helm`, SSH, provider CLI/API, `docker exec`,
> and direct container access as platform bootstrap or documented break-glass
> only, and record any missing Enclii adapter gap. This document names those
> tools but deliberately contains no raw production command examples.

> **Global migration law and logistics platform — pathway eligibility, document
> legalisation routing, ICAO 9303 travel-document validation, and cross-border
> presence tracking.**

> **Boundary note (Lane C, public-safe).** This file carries the public-safe
> ecosystem view. Cluster access, secret paths, cost data, operator gates and
> incident detail live in the private
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> repo under [`docs/repo-boundary-contract.md`](https://github.com/madfam-org/internal-devops/blob/main/docs/repo-boundary-contract.md).

This file is self-contained: a session on a fresh machine can orient in this
service by reading only this one document. No external links are load-bearing —
the MADFAM ecosystem map and the enclii CLI reference are embedded below.

Last updated: 2026-07-25.

---

## 1. What this repo is

Meridian is MADFAM's migration platform: a rules engine over a versioned,
citation-backed catalog of immigration pathways, plus the logistics that
surround an application — sequential document assembly with apostille and
sworn-translation routing, machine-readable travel-document validation to ICAO
Doc 9303, and continuous presence tracking for tax-residency day counts,
Schengen 90/180, continuous-residence clocks and qualifying-work accumulation.

Two foundational corridors seed the catalog: **Mexico → Spain** and
**Mexico → Canada**. The engine itself is jurisdiction-generic; the corridors
are data.

The defining architectural constraint is the **advice boundary**: every engine
output is born classified `information`, `assessment` or `advice`, and a single
gate decides whether that classification may reach a given audience. This exists
because s.91 of Canada's IRPA and Spain's reserved-activity rules make an
unlicensed recommendation to a consumer an offence rather than a feature. See
[docs/REGULATORY_POSTURE.md](docs/REGULATORY_POSTURE.md).

Four deployables come out of the monorepo: the API (`apps/api`), the applicant
portal (`apps/web`), the firm console (`apps/admin`) and a public marketing site
(`apps/landing`). The landing site is worth one line here because it inverts the
usual arrangement: it imports `@meridian/core` and `@meridian/pathways` and counts
its published figures — pathways shipped, pathways a lawyer has signed off,
distinct sources cited, how many of those are administrative practice — from the
same catalog the engine evaluates, at build time, as at one fixed civil date. A
marketing page is the one place in a codebase where a number has no compiler, no
test and no reviewer behind it, so this one has the catalog behind it instead.

**Pillar**: Mobility
**Type**: service (TypeScript monorepo — pnpm + turbo, Node 22, ESM)
**Status**: **pre-deploy.** Six libraries and the API build and test clean —
39 test files, 1021 tests, measured 2026-07-25; the three Next.js applications
have no tests; nothing is deployed; no pathway has been counsel-reviewed. See
[README.md](README.md) for the measured status section.
**Repo visibility**: PUBLIC — `github.com/madfam-org/meridian`, AGPL-3.0-only.

### Deployed services

**None yet.** The table below is the claimed allocation, not a live deployment.
No namespace, DNS record, or tunnel route exists for Meridian as of 2026-07-25.

| Service | Public domain | Container port | State |
|---|---|---|---|
| `meridian-landing` | meridian.madfam.io | 3000 | not deployed; builds |
| `meridian-app` | meridian-app.madfam.io | 3000 | not deployed; builds |
| `meridian-admin` | meridian-admin.madfam.io | 3000 | not deployed; builds |
| `meridian-api` | meridian-api.madfam.io | 8000 | not deployed; builds and runs |

**Kubernetes namespace**: `meridian` (not created)
**Registry**: two path shapes coexist, both under `ghcr.io/madfam-org/`. The
first three images predate the landing split and use `meridian-api`,
`meridian-web`, `meridian-admin`; the landing image uses the nested
`meridian/landing`, the form Avala and Enclii already publish under. Renaming the
older three would orphan their GHCR packages and reset three pinned digests for
images whose bytes did not change, so they stay as they are. Both shapes are
listed in `infra/k8s/production/kustomization.yaml`.

**On those container ports.** They are framework defaults — 3000 for Next.js,
8000 for the API — and they are deliberately unremarkable. In production the
number has **no effect**: every pod has its own network namespace and Cloudflare
Tunnel routes by hostname to a K8s Service, so three of these can all listen on
3000 and never see each other. The number matters for exactly two things. First,
internal consistency within one service: the container port must agree with its
Service `targetPort`, its probes, and the `ports:` in its generated
NetworkPolicy, or the CNI drops traffic silently. Meridian resolves this by
naming the port `http` everywhere, so the four places agree by construction
rather than by vigilance. Second, local development, where four apps on one
laptop need four distinct ports: the three Next `dev` scripts pass `--port 3000`,
`3001` and `3002` respectively, and the API takes its port from `PORT`, which has
no default for the reason given under *Key environment variables*. 8000 is the
value `enclii.yaml` and `Dockerfile.api` set.

Meridian claims **no port block**. `solarpunk-foundry/docs/PORT_ALLOCATION.md`
records that the ecosystem's 4xxx/5xxx block scheme is aspirational and that
almost no service follows it; adding a block claim to a scheme that is not in
use would be documentation of something untrue.
**Cluster**: bare-metal k3s (see topology section below).

Domains follow the flat `pravara-mes` pattern (`mes.madfam.io` /
`mes-api.madfam.io`) rather than nesting, because Cloudflare universal SSL
covers only one subdomain level. **No apex domain purchase is proposed** —
"meridian" is heavily contested in the .com/.io space and the platform does not
need it to operate.

### The landing / app split, and what it renamed

`meridian.madfam.io` is the **landing site**, not the product. It is the
explainer a person reads before trusting the platform with a passport number;
`meridian-app.madfam.io` is the portal they sign in to. Avala runs the same split
(`avala.studio` marketing, `app.avala.studio` application), as does Pravara MES.
The portal is `meridian-app.madfam.io` rather than `app.meridian.madfam.io` for
the SSL reason above: Avala can nest one level because it owns its own apex
domain, and Meridian does not.

Three names moved and three deliberately did not:

| Moved | Stayed |
|---|---|
| Enclii service `meridian-web` → `meridian-app` | Workspace package `@meridian/web` |
| K8s Deployment / Service `meridian-web` → `meridian-app` | Source directory `apps/web`, and `Dockerfile.web` |
| Public hostname → `meridian-app.madfam.io` | Janua `client_id` — still `meridian-web` |

The workspace name and directory stayed because renaming them would touch every
import in the repository to change a hostname. The Janua `client_id` stayed
because it is an **external registration**, not a label this repo owns: changing
it before the new client exists in Janua fails every sign-in with an
unknown-client error. Rename it in the change that registers it, not before —
there is a comment saying so in `infra/k8s/production/web-deployment.yaml` and
another in `enclii.yaml`.

The file names under `infra/k8s/production/` follow the source directory
(`web-*.yaml`) while the workload names inside them follow the public surface
(`meridian-app`). That is stated in `kustomization.yaml` so the mismatch reads as
a decision rather than an oversight.

### Upstream dependencies (this repo consumes)

| Concern | Service | Contract |
|---|---|---|
| **Auth** | **Janua** | OIDC / OAuth 2.0. Verify JWTs against JWKS at `https://auth.madfam.io/.well-known/jwks.json`. **RS256 only** — HS256 and `alg: none` are fail-closed after the 2026-04-23 ecosystem audit (H3/H4), and Meridian must ship a test asserting `alg: none` is rejected. |
| **Billing** | **Dhanam** | Tenant entitlements and metering. Tenant kind (`firm` / `individual` / `corporate`) drives both the price and the advice boundary, so the entitlement record and the disclosure gate read the same source of truth. |
| **Inference** | **Selva** | `/v1`, OpenAI-compatible. **Every LLM call routes here, never a provider directly.** No `openai`, `@anthropic-ai/sdk`, or provider HTTP client belongs anywhere in this repo. |
| **Compliance** | **Karafiel** | NOM-151 timestamping. The natural home for Meridian's immutable audit trail: what was released to whom, under which classification, on which citation, at which point in time. |
| **Legal corpus** | **Tezca** | Mexican-law oracle, informational only. Relevant to the origin side of the MX corridors. |
| **Deploy** | **Enclii** | PaaS control plane. `enclii onboard --repo madfam-org/meridian`. |
| **Data** | Postgres | Matters, applicants, presence ledgers, documents, audit trail. Prisma is the client; `apps/api/prisma/schema.prisma` defines 10 models and 15 enums. No migration has been **generated**, let alone applied — `apps/api/prisma/` holds a schema and nothing else, and `prisma generate` runs only inside `Dockerfile.api`. |

### Downstream consumers (this repo is consumed by)

None today. Meridian is not deployed and exposes no API. The intended consumers
are:

- **PhyndCRM** — client-facing deliverables portal, for firm tenants running a
  migration engagement alongside other work.
- **Symbiosis HCM** — relocation status as an input to employee lifecycle, for
  `corporate` tenants.
- **Avala** — where a pathway requires a competency or credential that Avala
  already verifies.

Treat all three as prospective. Do not document an integration contract that
neither side has implemented.

### Key environment variables

Names only. Values live in the approved secret store and are seeded through
Enclii; never in this repo, in an issue, in a commit message, or in agent chat.

The list is split by whether code reads the name **today**, because a
configuration document that mixes what is wired with what is intended teaches an
operator to set variables that do nothing.

**Read by `apps/api/src/config.ts`, required, no default.** An empty environment
produces one error naming all seven and exits 78 without printing a value:

- `DATABASE_URL` — Postgres. Carries a password; validated for shape only and
  never logged or echoed into an error.
- `JANUA_JWKS_URL` — JWKS endpoint; RS256 verification.
- `JANUA_ISSUER`, `JANUA_AUDIENCE` — expected `iss` and `aud`. Both required:
  without `aud`, a token minted for a neighbouring service in the same realm
  would authenticate here.
- `CORS_ALLOWED_ORIGINS` — comma-separated allowlist. A wildcard is rejected at
  load rather than at use.
- `PORT` — deliberately has no default. A service that picks its own port binds
  one nobody is routing to, and the failure looks like a network problem for the
  first hour.
- `NODE_ENV` — `development` | `test` | `production`.

`Dockerfile.api` sets `NODE_ENV` and `PORT`, which is why a bare `docker run` of
the image names the other five and nothing else.

**Read by `apps/api`, optional, with defaults**: `LOG_LEVEL`, `RATE_LIMIT_MAX`,
`RATE_LIMIT_WINDOW`, `TRUST_PROXY`.

**Read by `apps/admin`**: `MERIDIAN_ASOF` pins the console's reference date for a
demonstration instance or a screenshot that must not rot; `MERIDIAN_ADMIN_DATASET`
selects which sample dataset the console serves, falling back visibly rather than
failing the render.

**Declared in `enclii.yaml` and the Deployments, read by no application code
yet**: `MERIDIAN_ENV`, `JANUA_URL`, `MERIDIAN_WEB_ORIGIN`,
`MERIDIAN_ADMIN_ORIGIN`, and the `NEXT_PUBLIC_*` set (`NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_JANUA_URL`, `NEXT_PUBLIC_JANUA_CLIENT_ID`, `NEXT_PUBLIC_APP_URL`).
The three Next apps render from data in their own source and call nothing, so
these document the intended runtime contract ahead of the code that will consume
it. Next inlines `NEXT_PUBLIC_*` at build time, which is why they are also passed
as `--build-arg` in `.github/workflows/build-deploy.yml`.

**Named for ecosystem edges not yet built**: `DHANAM_WEBHOOK_SECRET` (billing
events), `SELVA_BASE_URL` / `SELVA_API_KEY` (inference routing),
`KARAFIEL_BASE_URL` (timestamping the audit trail). Nothing reads them today.

`packages/govtech` additionally names — and today deliberately leaves unset —
`MERIDIAN_CLAVE_SP_AGREEMENT_REF`, `MERIDIAN_CLAVE_SP_SIGNING_KEY_REF`,
`MERIDIAN_CLAVE_ENDPOINT`, `MERIDIAN_DICIREG_AGREEMENT_REF`,
`MERIDIAN_DICIREG_CLIENT_CERTIFICATE_REF` and `MERIDIAN_DICIREG_ENDPOINT`.
Every one of those gates a `not_provisioned` capability, and **setting all of
them still does not make any government capability `available`** — each also
requires an injected transport this package does not ship. That is intentional:
a formal agreement, not an environment variable, is what unblocks a government
integration.

**No environment variable in this system holds a user's government credential.**
There is no such variable and there will not be one.

---

## MADFAM Ecosystem Map

MADFAM runs roughly 40 services on sovereign bare-metal infrastructure.
Everything below is embedded here so this document stands alone.

### The platforms every repo should know about

| Platform | Repo | Role |
|---|---|---|
| **Enclii** | `madfam-org/enclii` | PaaS control plane — all deploys go through this |
| **Janua** | `madfam-org/janua` | OIDC/OAuth 2.0 provider — RS256 JWKS at `auth.madfam.io/.well-known/jwks.json` |
| **Dhanam** | `madfam-org/dhanam` | Billing + payment gateways (Stripe, Mercado Pago, SPEI) |
| **Selva** | `madfam-org/selva-office` | LLM inference routing + agent orchestration |
| **Karafiel** | `madfam-org/karafiel` | Operational compliance — CFDI, NOM-151, e.firma, SAT-adjacent. Owns legal-ops / contract templates |
| **Tezca** | `madfam-org/tezca` | Mexican law oracle (informational only — feeds Karafiel) |
| **Cotiza** | `madfam-org/digifab-quoting` | MADFAM's quoting engine (fabrication + services) |
| **Forgesight** | `madfam-org/forgesight` | Digital fabrication industry intelligence |
| **Pravara MES** | `madfam-org/pravara-mes` | Fabrication-node routing and dispatch |
| **PhyndCRM** | `madfam-org/phynd-crm` | Client-facing deliverables portal |
| **Fortuna** | `madfam-org/fortuna` | Problem intelligence / zeitgeist analysis |
| **Avala** | `madfam-org/avala` | Learning verification platform |
| **Meridian** | `madfam-org/meridian` | Migration law and logistics (this repo) |

### Cross-repo conventions

- **Auth**: every authenticated service verifies Janua JWTs via JWKS at
  `https://auth.madfam.io/.well-known/jwks.json`. RS256 only — HS256 is
  fail-closed after the 2026-04-23 audit (H3/H4).
- **Billing**: credit metering + entitlements flow through Dhanam.
- **Inference**: every LLM call routes through Selva (`selva-office`) at `/v1`
  (OpenAI-compatible). Do not talk directly to OpenAI or Anthropic from service
  code.
- **CORS**: explicit allowlist per service. Wildcards are banned (audit H2/H5/H6).
- **Images**: `@sha256:`-pinned in every manifest; Kyverno policy governs
  mutable tags at the cluster level.
- **Onboarding**: `POST /v1/admin/onboard` on switchyard-api creates namespace,
  ArgoCD app, Cloudflare tunnel routes, Janua client, and NetworkPolicies in one
  shot. See `enclii/docs/guides/ONBOARDING_GUIDE.md`.
- **Dates**: ISO 8601 (`YYYY-MM-DD`) everywhere. Times in `America/Mexico_City`.

### Production topology (public-safe summary)

Bare-metal k3s on Hetzner, three nodes: a control plane that also carries
primary workload, a worker that carries the second storage replica, and a small
tainted builder node reserved for ARC runners.

**Ingress**: Cloudflare Tunnel → cloudflared pods → K8s ClusterIP → container
port. Zero exposed node ports; TLS terminates at the Cloudflare edge.

**Storage**: Longhorn CSI in two-replica mode. Object storage on Cloudflare R2.

**GitOps**: ArgoCD App-of-Apps with self-heal. Push to `main` → CI builds →
GHCR → the manifest is updated to the built digest → ArgoCD syncs.

Node identity, capacity figures, kubeconfigs, SSH access and the cost ledger are
private and live in `madfam-org/internal-devops`. They are not in this or any
other public repo.

---

## Enclii CLI — day-to-day reference

**Strong preference: use `enclii` over `kubectl`** for all operational tasks.
The CLI routes through the Switchyard API, which gives audit logging, lifecycle
event tracking and service-scoped context.

> Meridian is **not onboarded**. Every command below will fail with a
> project-not-found style error until the operator gates in
> `internal-devops` are run. They are recorded here so the intended operation is
> unambiguous when that happens.

### Install

```bash
# macOS
brew install enclii/tap/enclii

# Linux
curl -sSL https://get.enclii.dev | bash
```

### Auth

```bash
enclii login                  # browser SSO (Janua)
enclii whoami                 # verify active session
enclii logout                 # clear local creds
```

Env vars: `ENCLII_API_URL` (default `https://api.enclii.dev`), `ENCLII_TOKEN`
(alternative to interactive login), `ENCLII_PROJECT`, `ENCLII_ENV`.

### Day-to-day for meridian-api

Swap the service name for `meridian-app`, `meridian-landing` or `meridian-admin`
as needed. There is no `meridian-web` service: the applicant portal deploys as
`meridian-app` even though its source lives in `apps/web`.

```bash
# Status + where the pods are running
enclii ps --wide
enclii ps meridian-api --env production

# Logs
enclii logs meridian-api -f                          # live tail
enclii logs meridian-api --since 1h --level error    # last hour, errors only
enclii logs meridian-api --env staging -f

# Deploy
enclii deploy --env preview                          # from current branch
enclii deploy --env staging
enclii deploy --env production --strategy canary --canary-percent 10

# Rollback
enclii rollback meridian-api                         # previous release
enclii rollback meridian-api --to-revision 5

# Releases + history
enclii releases meridian-api
enclii releases meridian-api --latest --output json

# Secrets (routed through Lockbox → Vault → ESO → K8s)
enclii secrets list meridian-api
enclii secrets set MY_KEY=value --service meridian-api --secret
enclii secrets rm MY_KEY --service meridian-api

# Domains, tunnel routes, DNS
enclii domains list meridian-api
enclii domains add meridian-api my.example.com

# Scheduled jobs
enclii jobs list
enclii jobs run <job-name>

# Routing (ingress + TLS)
enclii junctions list meridian-api

# Local dev dependencies (postgres, redis, …)
enclii local up
enclii local logs
enclii local down
```

`enclii secrets set` is how configuration reaches the cluster. It is **not** a
place to put a user's government credential — no such value exists in this
system, by design.

### Full onboarding (only when adding a brand-new service)

```bash
# One-shot: namespace + ArgoCD app + tunnel routes + Janua client + netpol
enclii onboard --repo madfam-org/meridian --db-name meridian --secrets-file .env
```

### Enclii-first production operations

Enclii is the required control plane for routine production operations. Use the
web UI, API, or CLI before reaching for raw infrastructure tools:

- ArgoCD sync / diff / rollback — `enclii ops apps ...`
- Pod logs, diagnosis, safe restarts — `enclii ops pods ...`
- Longhorn / PVC / PV inspection and repair planning — `enclii ops storage ...`
- Kyverno violations and time-bound waivers — `enclii ops policy ...`
- ExternalSecrets and Vault readiness — `enclii ops secrets ...`
- ARC runner inspection and drain workflows — `enclii ops runners ...`
- DNS, tunnels, SaaS hostnames, providers — `enclii providers ...`
- Service lifecycle — `enclii deploy`, `enclii rollback`, `enclii logs`,
  `enclii observe`, `enclii domains`, `enclii secrets`, `enclii jobs`

### Break-glass-only access

Raw `kubectl`, `helm`, SSH, provider CLIs/APIs, `docker exec` and direct
container access are allowed only for platform bootstrap or documented
break-glass emergencies when Enclii is unavailable or lacks an implemented
adapter. Record the actor, reason, target service and environment, commands
executed, result, and the follow-up Enclii adapter gap or incident link.

Meridian raises the bar further: a break-glass session on this service can reach
passport, biometric-derived and travel-history data — Article 9 special-category
under GDPR. Treat any such session as a data-access event, not just an
operational one, and record it accordingly. See [SECURITY.md](SECURITY.md).

### Cluster access

kubeconfigs and SSH keys live in `madfam-org/internal-devops` (private) for
bootstrap and break-glass use only.

### Exit codes (scripting against the CLI)

| Code | Meaning |
|---|---|
| 0  | success |
| 10 | validation error |
| 20 | build failed |
| 30 | deploy failed |
| 40 | timeout |
| 50 | auth error |

---

## Operator gates before this service can run

These are owner and operator work, not engineering work. They are tracked
privately; the public-safe summary is:

- Onboard the `meridian` namespace, ArgoCD app, tunnel routes, Janua client and
  network policies through Enclii.
- Register the Janua OIDC client and seed the `JANUA_*` configuration.
- Provision Postgres and seed `DATABASE_URL` through the approved secret path.
- Create Cloudflare DNS and tunnel routes for the four hostnames —
  `meridian.madfam.io`, `meridian-app.madfam.io`, `meridian-admin.madfam.io`,
  `meridian-api.madfam.io`.
- Add `meridian` to the status-page monitor set.
- **Counsel review of the pathway catalog.** Blocks all advice-class output.
- **A licensing decision** on the `madfam_represented` tenant kind.

Canonical sequencing, evidence and the private detail:
`madfam-org/internal-devops` — RFC 0036 and the operator console gate catalog.

---

## Document provenance

Written 2026-07-25 as part of Meridian's initial documentation set, following
the shape of the ecosystem's other per-repo `ECOSYSTEM.md` files. If the
ecosystem map or CLI reference drifts from reality, fix it at the ecosystem
source (`madfam-org/enclii/docs/templates/ECOSYSTEM.md.template`) rather than
in this copy alone.
