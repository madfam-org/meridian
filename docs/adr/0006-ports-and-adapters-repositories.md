# ADR 0006 — Ports and adapters for repositories

- **Status**: Accepted and implemented. Ports in
  `apps/api/src/repositories/types.ts`; Prisma and in-memory adapters in
  `prisma.ts` and `memory.ts`. The shared contract test suite described under
  *Consequences* does **not** exist yet — `apps/api` has no tests at all.
- **Date**: 2026-07-25
- **Applies to**: `apps/api`
- **Related**: [ADR 0004](0004-fastify-over-nestjs.md),
  [ADR 0002](0002-advice-boundary-as-a-type.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

The six packages under `packages/` are pure: total functions over plain data, no
I/O, no ambient clock, no global state. That is why 901 tests run in seconds
against no fixture server, and why questions like "does exactly 90 days pass?"
are answered by calling a function.

The API will not be pure. It has to talk to Postgres, to Janua, and to Karafiel.
The risk is that impurity spreads: a service imports the Prisma client, a route
handler writes a `where` clause, and within a quarter the only way to test
whether the disclosure gate downgrades correctly is to start a database.

The specific things that must stay testable without infrastructure are the ones
where a bug harms someone:

- **The disclosure gate.** Does `advice` downgrade for an unrepresented
  applicant, for a representative licensed in the wrong jurisdiction, for one
  whose credential expired yesterday? These are boundary conditions and there
  should be dozens of tests for them, running in milliseconds.
- **Tenant isolation.** Does a matter belonging to tenant A ever surface for
  tenant B? This is the failure mode that has bitten sibling platforms in this
  ecosystem, and a test for it must be cheap enough that there are many.
- **Task unlocking and phase ordering.** Sequential unlocking is a product
  guarantee, and a matter that deadlocks is a support incident.

There is also a Prisma-specific hazard. Prisma's generated types are pleasant
enough to leak into signatures — `Prisma.MatterWhereInput`, a model type with a
`Decimal` field, a `select` shape. Once a service signature mentions one, the
service is coupled to the ORM and the domain type has quietly become a DTO.

## Decision

**The API defines repository ports as plain TypeScript interfaces in the
application layer. Prisma is one adapter. An in-memory adapter is a first-class
peer, not a test double bolted on afterwards.**

```
        ┌─────────────────────────────────────────────┐
        │  HTTP layer (Fastify)                       │
        │    routes · zod schemas · THE GATE          │
        └───────────────────┬─────────────────────────┘
                            │ depends on interfaces only
        ┌───────────────────▼─────────────────────────┐
        │  application services                       │
        │    orchestration; imports @meridian/* pure  │
        └───────────────────┬─────────────────────────┘
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

### The rules

1. **Ports speak domain types.** `Matter`, `Task`, `Tenant` from
   `@meridian/core`; `Stay` from `@meridian/presence`; `Document` from
   `@meridian/documents`. **Never** a Prisma model type, never a
   `Prisma.*WhereInput`, never a `Decimal`. A port that leaks its adapter's
   query language is not a port.

2. **Tenant scoping is structural, not remembered.**

   The implementation went further than this ADR originally sketched, and the
   stronger form is the one to keep. **No method on any repository interface
   takes a tenant id.** A repository is obtained from
   `RepositoryProvider.forTenant(tenantId)` with the id taken from a verified
   token, and every query that repository issues carries that id in its
   predicate.

   The difference matters. A `findById(tenantId, id)` signature is a convention
   — "always pass the right one" — and conventions survive until the third
   urgent fix at the end of a quarter. With `forTenant`, there is no call a
   handler *could* make that reads another tenant's row, because the parameter
   does not exist. The compiler saying "there is no such parameter" survives
   indefinitely.

   The in-memory adapter enforces the same scoping, so isolation is assertable
   without a database.

3. **The audit sink is a port, and it is append-only.** Release decisions —
   classification requested, classification released, representative or `null`,
   citation ids, timestamp — go to Karafiel in production and to an array in
   tests, and the gate must not know which. `AuditRepository` exposes `append`
   and `list` and nothing else: not "we do not call update", but there is no
   update to call. A trail that can be edited is not evidence of anything.

   One known gap, documented in `apps/api/src/audit/writer.ts` rather than
   hidden: the mutation happens, then the row is appended. A failed append fails
   the request, so a caller is never told an action succeeded with no trail —
   but the mutation has already happened, so a failed append can leave a change
   unrecorded. Closing that needs the write and the audit row in one
   transaction.

4. **The composition root is one file.** It constructs adapters and passes them
   to services. No DI container ([ADR 0004](0004-fastify-over-nestjs.md)), no
   service locator, no module-level singleton.

5. **No engine package ever sees a repository.** The libraries take plain data
   and return plain data. If a pure function appears to need to load something,
   the load happens in the application layer and the result is passed in. This
   rule is what keeps the packages pure, and it is not negotiable for
   convenience.

6. **The in-memory adapter is maintained, not improvised.** It implements the
   full port. Its purpose is to keep the port honest — a port only one adapter
   has ever implemented is a description of that adapter. It exists today;
   the test suite that would exercise it does not, which is the largest
   outstanding item against this ADR.

7. **Transactions are explicit in the port** where they are needed. A unit of
   work that must be atomic — creating a matter and its initial task set — is
   one port method, not two calls the caller is trusted to wrap. The in-memory
   adapter implements it atomically too, so "it works in tests" and "it works in
   production" mean the same thing.

## Consequences

### What gets better

- The disclosure gate, tenant isolation and task unlocking are testable in
  milliseconds, so there can be many tests rather than a few.
- The domain vocabulary stays domain vocabulary. Reading a service tells you
  what it does, not how it queries.
- Swapping or supplementing persistence later — read replicas, a separate store
  for documents, per-tenant data residency for EU subjects — is a new adapter
  rather than a rewrite. Data residency is an open question in
  [REGULATORY_POSTURE.md](../REGULATORY_POSTURE.md) and this is the seam it will
  use.
- Tenant scoping is structural. Given the ecosystem's history with cross-tenant
  leaks, this is the highest-value item on the list.
- It matches how the pure packages are already built, so there is one mental
  model for the whole repository.

### What gets worse

- **More code.** An interface, two implementations, and a mapping layer per
  aggregate, where a direct Prisma call would be one line.
- **Two implementations can drift.** The in-memory adapter can accidentally be
  more permissive — accepting a duplicate id the database's unique constraint
  would reject, or ignoring a null constraint. Mitigation: a shared contract
  test suite run against *both* adapters, with the database-backed run gated
  behind an integration tag. Without that suite this decision is worse than not
  taking it, and that is the main risk here.
- **Lost Prisma ergonomics.** Nested writes, `include`, partial selects and
  aggregate queries do not survive a domain-typed port cleanly. Some of that is
  genuine expressive loss; some is a prompt to reconsider whether the query
  belongs in a repository at all.
- **N+1 hazards move.** A port that returns domain objects makes it easy to loop
  and call again. Batch methods have to be designed rather than discovered from
  a slow query log.
- **Read-heavy reporting fits badly.** A dashboard aggregate is not an
  aggregate-root read. Expect a separate, explicitly-named read-model port for
  those, rather than distorting the repositories.

### What we can no longer do

- Import the Prisma client in a route handler or a service.
- Mention a Prisma type in any signature outside `adapters/prisma/`.
- Give a pure package a repository.

## Alternatives considered

**Use Prisma directly in services.** Rejected. It is less code today and it
makes the disclosure gate untestable without a database, which is the one thing
that must be cheap to test. It also lets ORM types into domain signatures, which
is a one-way door.

**Prisma directly, plus a test database (testcontainers or a schema per test
run).** Rejected as the primary strategy. It works, and it is the right approach
for *integration* tests, but a test that needs a container is a test people run
less often. The gate's boundary conditions need a suite that runs on every save.
A database-backed contract suite is still wanted — as the thing that keeps the
two adapters honest, not as the everyday loop.

**A generic `Repository<T>` base interface.** Rejected. Aggregates have genuinely
different access patterns — a presence ledger is queried by country and date
range, a matter by id and tenant — and a generic base either becomes
lowest-common-denominator or grows a `query(spec)` escape hatch that reintroduces
the coupling it was meant to prevent.

**Full hexagonal architecture with the domain in its own layer.** Rejected as
redundant. The domain is *already* isolated — it lives in six packages with no
I/O. Adding another layer inside `apps/api` would be ceremony over an existing
boundary.

**Event sourcing for the presence ledger.** Tempting, because a presence ledger
genuinely is an append-only record of claims with provenance, and
`PresenceSource` / `PresenceConfidence` already encode that. Deferred, not
rejected: it is a significant commitment and the current `Stay` model with
`detectInconsistencies` already surfaces conflicting and missing records. Worth
revisiting when ingestion is designed.

## References

- `packages/core/src/matter.ts` — the aggregates the ports will serve
- `packages/core/src/tenancy.ts` — `representativeFor`, the tenancy read the gate
  depends on
- [ARCHITECTURE.md](../ARCHITECTURE.md) §5
- [ADR 0004](0004-fastify-over-nestjs.md) — why there is no DI container to
  register these in
