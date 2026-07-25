# Security Policy

> **Boundary note (Lane C, public-safe).** Public-safe policy only. Incident
> records, evidence trails and remediation runbooks live in the private
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> repo, per the repo-boundary contract. Do not post incident detail in a public
> issue.

Last updated: 2026-07-25.

---

## Reporting a vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Report them by email to **security@madfam.io**.

Include as much of the following as you have:

- Type of issue — for example authentication bypass, cross-tenant data access,
  disclosure-gate bypass, credential handling, dependency compromise
- Full paths of the source files involved
- Location of the affected code — tag, branch, commit, or direct URL
- Any configuration required to reproduce
- Step-by-step reproduction instructions
- Proof of concept, if you have one
- Impact, including how an attacker would exploit it

**Never include real personal data in a report.** If reproducing an issue
requires applicant data, describe the shape of the data and use synthetic values.
A report containing a real passport number is itself a data incident.

### Response

| Stage | Target |
|---|---|
| Initial acknowledgement | 24 hours |
| Triage and status update | 72 hours |
| Resolution target, critical | 14 days |

We will credit reporters publicly with their permission. There is no bug bounty
programme for this repository today.

### Supported versions

| Version | Supported |
|---|---|
| 0.x | Yes — pre-release, no deployment exists |

Meridian is not deployed and has no users. There is no production instance to
attack today. Reports against the code are still welcome and wanted: it is
easier to fix a design flaw before it holds anyone's data.

---

## Data sensitivity

**This platform is designed to process some of the most sensitive personal data
a system can hold.** That fact drives the architectural decisions in this
repository more than any other consideration.

### What the design handles

- **Travel-document data** — passport and national-identity document numbers,
  full names as they appear in a machine-readable zone, dates of birth,
  nationality, document expiry.
- **Biometric-derived data** — `@meridian/mrtd` computes the ICAO Basic Access
  Control key seed from MRZ information. That seed unlocks the chip on an
  ePassport, whose contents include a facial image used for identification.
- **Travel history** — an applicant's cross-border movements, by country and by
  day, over years.
- **Immigration status and history** — including prior refusals, prior
  overstays, and prior removals.
- **Criminal-record certificates** and their status.
- **Financial and employment data** — income, job offers, salary.

### Legal classification

Under the **GDPR**, parts of this corpus are **Article 9 special-category
data**: biometric data processed for the purpose of uniquely identifying a
natural person, and nationality data from which racial or ethnic origin can be
inferred. Criminal-record data falls under **Article 10**, which carries its own
restrictions on processing.

**We treat the entire corpus at the special-category standard.** Segregating
"the sensitive fields" from a record whose whole purpose is to describe one
person's migration is not a distinction that survives contact with reality: a
travel history alone can reveal religious observance, medical treatment abroad,
and family relationships.

Mexican **LFPDPPP** treats several of these categories as *datos personales
sensibles* with a heightened consent standard. Where the two regimes differ, the
stricter applies.

The practical consequences for anyone working on this repository:

- A leak here is not an inconvenience. It exposes people who may be in a
  precarious immigration position, to authorities and to others.
- Data minimisation is a design constraint, not a policy aspiration. If a field
  is not needed to answer a question, it should not be collected.
- Retention needs an answer before storage is built, not after.
- Data residency for EU subjects is an **open architectural question**, recorded
  as such in [docs/REGULATORY_POSTURE.md](docs/REGULATORY_POSTURE.md) §7 and
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §7. It is not solved.

---

## What we do not store

### Government credentials — never, by design

**Meridian does not hold, proxy, or transit a user's government authentication
credential.** Not a Cl@ve PIN, not a Cl@ve Permanente password, not an e.firma /
FIEL private key, not an IRCC secure-account password, not any portal password.

This is not a configuration setting or a current-implementation detail. It is
enforced at four layers in `@meridian/govtech`:

1. Credential custody is declared as capability state `refused_by_policy`, and a
   refusal structurally carries no unblock path (`capabilityDefects` emits
   `REFUSAL_HAS_UNBLOCK_PATH` if one appears).
2. `CredentialFree<T>` maps any credential-shaped property, at any depth, to a
   type nothing is assignable to. A credential field is **unrepresentable** in
   an operation signature.
3. `guardCredentialFree` scans untyped payloads at runtime and returns
   `Err(MeridianError('CREDENTIAL_CUSTODY_REFUSED'))`.
4. `tests/structural-refusal.test.ts` holds `@ts-expect-error` directives, so
   `tsc --noEmit` fails if the type-level refusal stops working.

The reasoning, including the attribution argument that decides it, is in
[docs/adr/0003-no-credential-custody.md](docs/adr/0003-no-credential-custody.md).

**Meridian will never ask you for a government credential.** If something
claiming to be Meridian does, it is not Meridian.

### Not stored today, because nothing runs today

There is no deployment, no database, and no object storage. A Prisma schema
exists at `apps/api/prisma/schema.prisma` — 10 models and 15 enums — but no
migration has been generated or applied anywhere, and nothing is running that
could write a row.

The six packages under `packages/` hold no state between calls at all: they take
plain data as arguments and return plain data.

This is worth stating precisely because a security policy that describes storage
controls for storage that does not exist is a security policy nobody should
trust. When the first migration is applied, this section changes, and that change
should be reviewed as a security change — retention, encryption at rest, and the
data-residency question below all become live at that moment.

**Document bytes have no home yet.** Nothing in the built code stores a document;
`@meridian/documents` models a document's status and requirements. Where the
bytes live, encrypted how, and retained for how long is undecided, and it is the
decision with the largest privacy consequence still outstanding.

### Deliberate non-collection in the current design

- **`@meridian/mrtd` computes the BAC key seed and stops there.** No chip
  handshake, no passive-authentication certificate chain, no chip data. The doc
  comment states plainly that SHA-1 and 3DES appear because the specification
  says so and not as a security choice, and that the inputs and output are
  personal data.
- **Continuous location is not the default.** `PresenceSource` treats `'gps'` as
  one optional source among five, with border stamps and itineraries as primary
  evidence. Whether Meridian ever ships a background-location collector is an
  open product and privacy question, not a settled requirement.
- **Handoff destinations carry no query string.** A pre-filled URL is where
  someone eventually puts an NIE "to save typing", and URLs land in browser
  history, referrer headers and proxy logs. `checkDestination` rejects any URL
  with a query string.

---

## Security properties of the current code

Only claims that are true today.

**Input handling.** `parseDocument` in `@meridian/documents` requires a plain
object, because zod resolves object fields through the prototype chain while
`.strict()`'s unknown-key check reads only own keys — an object carrying its data
on its prototype satisfied both halves at once. Found by a test, fixed,
documented inline.

**Path resolution.** `resolvePath` in `@meridian/pathways` refuses
`__proto__`, `constructor` and `prototype`, and reads own properties only. The
catalog is data and will eventually load from a database.

**URL handling.** `checkDestination` in `@meridian/govtech` requires `https`, a
host on a narrow per-jurisdiction official allowlist, and no query string. The
host character class excludes `@`, so `https://clave.gob.es@evil.example/` fails
to parse rather than passing an allowlist check against the wrong half of the
string. Tested.

**Bounded computation.** Every date scan is bounded — `MAX_LEDGER_SCAN_DAYS`,
`SCHENGEN_MAX_SCAN_DAYS`, `MAX_LOOKBACK_SCAN_DAYS` — and throws
`MeridianError('INVALID_INPUT')` rather than looping on a mistyped year.

**Dependency surface.** `@meridian/core`, `@meridian/mrtd` and
`@meridian/presence` have no runtime dependency other than each other.
`@meridian/pathways`, `@meridian/documents` and `@meridian/govtech` add `zod`.
`@meridian/mrtd` imports `node:crypto` from the standard library.

### Built in `apps/api`, not yet tested

The API landed during the repository's initial build session. These controls are
written; **none of them is covered by a test, because `apps/api` has no test
files.** Treat that as the current state, not as a claim of assurance.

- **Janua JWT verification via JWKS, RS256 only.** `src/auth/verifier.ts` reads
  the algorithm from the protected header and checks it against the permitted
  set *before* verification, and passes the permitted set to `jwtVerify` as
  well. The pre-check makes the refusal explicit and testable; the option means
  a refactor that loses the pre-check does not silently reopen the door. It
  closes `alg: none` (the unsecured JWT) and `alg: HS256` (algorithm confusion,
  where the attacker uses our published RSA public key as an HMAC secret).
  Issuer **and** audience are both required — inside one Janua realm every
  service shares an issuer, so issuer alone would admit a token minted for a
  different service.
- **Structural tenant scoping.** No repository interface method takes a tenant
  id; a repository comes from `forTenant()` with the id from a verified token.
  A cross-tenant read is not a call a handler can make.
  [ADR 0006](docs/adr/0006-ports-and-adapters-repositories.md).
- **An append-only audit trail.** `AuditRepository` exposes `append` and `list`
  and nothing else. Every mutation and **every disclosure downgrade** produces
  exactly one row — the downgrade case being the one a CRUD-shaped audit design
  misses entirely, since no data changed when a recommendation was reduced to an
  assessment. `detail` accepts scalars only and rejects keys with obviously
  personal names. Known gap, documented in the source: the mutation is performed
  and then the row appended, so a failed append fails the request but can leave
  an applied change unrecorded.
- **Route-level gate enforcement.** A Fastify `onRoute` hook refuses to register
  any route that does not declare whether it returns engine output; a leak
  detector catches a route that declares `false` and returns engine-shaped data
  anyway.
- **Explicit CORS allowlist.** `enclii.yaml` sets `MERIDIAN_WEB_ORIGIN` and
  `MERIDIAN_ADMIN_ORIGIN`; wildcards are banned ecosystem-wide following the
  2026-04-23 audit (findings H2, H5, H6).
- **Rate limiting and security headers** via `@fastify/rate-limit` and
  `@fastify/helmet`.

Still intended and not built: NOM-151 timestamping of the audit trail through
Karafiel.

### Repository guard scripts

Three checks run in the `policy` job of `.github/workflows/ci.yml`, before any
install — a legal or regulatory invariant breaking is a different kind of
failure from a build breaking, and it is reported as one. All three were run on
2026-07-25 and pass:

| Script | Asserts | Result |
|---|---|---|
| `check-advice-boundary.mjs` | No route returns engine output around the gate; the gate and producer anchors still exist | OK — 68 files read, 4 routes examined |
| `check-no-credential-custody.mjs` | No credential-custody code is reintroduced; the structural refusal anchors still exist | OK — 206 files, 3 rules, 3 exemptions, 2 anchors |
| `check-pathway-citations.mjs` | No stale citation, no catalog integrity error | OK — 8 pathways, 20 citations, 63 references |

Two notes for anyone maintaining them. The credential check verifies
**structural anchors**, not only patterns: if `CredentialFree` or the runtime
guard disappears, the greps are all that is left, and the script goes red rather
than passing on a weakened codebase. And it scans `docs/` too, so documentation
about the refusal must **describe** the forbidden field names rather than
spelling them — this policy file and ADR 0003 are both written that way
deliberately.

**The outstanding gap is tests, not scripts.** `apps/api` has no test files, so
the disclosure gate's boundary conditions at the HTTP layer — no representative,
wrong jurisdiction, expired credential — are asserted by design and by the guard
script, not by a suite.

---

## Rules for contributors

**This repository is public.**

1. **No real personal data, ever** — not in code, tests, fixtures, issues, pull
   requests, commit messages, or screenshots. Every fixture in this repository is
   synthetic: issuing state `ZZZ` (unassigned), document numbers beginning `ZZ`,
   `example.invalid` hostnames, invented names. Keep it that way.
2. **No real MRZ strings.** `packages/mrtd/tests/fixtures.ts` generates
   specimens from invented data with check digits computed independently. Do not
   paste a real one, including your own.
3. **No secrets.** No API keys, tokens, connection strings, kubeconfigs, or
   certificates. `.gitignore` blocks `.env`, `*.mrz`, `*.passport.json` and
   `applicant-data/`, but the rule is on you, not on the ignore file.
4. **No private operational detail.** Server identifiers, secret paths, cost
   data and incident specifics belong in `internal-devops`.
5. **Treat the advice boundary and the credential refusal as security
   controls**, because they are. A change that weakens either needs a security
   review, not just a code review.

## Reporting anything else

- Vulnerabilities: **security@madfam.io**
- A legal error in the pathway catalog: this is a **safety** issue. Open an
  issue with the instrument and provision you believe is misstated. Do not
  include applicant details.
- Anything containing personal data: email, do not open an issue.
