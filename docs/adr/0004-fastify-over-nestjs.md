# ADR 0004 — Fastify over NestJS for the API

- **Status**: Accepted and implemented. `apps/api/src/` is a Fastify
  application — auth, disclosure gate, repositories, audit and routes. It has
  **no `src/main.ts`**, so nothing composes it into a running process yet, and
  **no tests**.
- **Date**: 2026-07-25
- **Applies to**: `apps/api`
- **Related**: [ADR 0006](0006-ports-and-adapters-repositories.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

Meridian needs an HTTP service in front of six pure libraries. The service does
three things: authenticate against Janua, load tenancy and matter context, and
apply the disclosure gate to values the libraries produced. It is deliberately
thin — [ADR 0006](0006-ports-and-adapters-repositories.md) keeps the domain out
of it entirely.

**The ecosystem's grain points at NestJS.** Dhanam and Avala both run NestJS.
Choosing something else has a real cost: two frameworks for MADFAM engineers to
hold in their heads, two sets of conventions for guards and interceptors, two
testing idioms, and no reuse of the auth guards and Prisma module patterns those
repos already have. Consistency across a small organisation's services is worth
something and it is not free to give up.

Against that sits a concrete technical constraint, and it is about module format
rather than taste.

The workspace packages are **ESM TypeScript source, consumed directly**. Each
`package.json` declares `"type": "module"`, `"main": "./src/index.ts"` and
`"exports": { ".": "./src/index.ts" }`. There is no build step and no `dist/`.
The root `tsconfig.base.json` sets `"module": "ESNext"`,
`"moduleResolution": "Bundler"`, `"verbatimModuleSyntax": true` and
`"isolatedModules": true`. Relative imports end in `.js`. Every consumer resolves
the packages' TypeScript directly.

NestJS's decorator-based dependency injection depends on
`emitDecoratorMetadata`, which requires `experimentalDecorators` — the legacy
TypeScript decorator implementation, not the ECMAScript standard decorators. That
toolchain is built around CommonJS emit. Running NestJS on ESM is possible and
people do it, but the combination of `emitDecoratorMetadata` +
`verbatimModuleSyntax` + `isolatedModules` + direct-source workspace consumption
is a configuration whose failure modes are obscure and whose fixes tend to be
"add a build step to every package".

Adding a compiled `dist/` output to all six packages to satisfy one application's
DI framework is a monorepo-wide tax paid by five packages that do not benefit.
It also lengthens the feedback loop on the thing we actually care about — the
901 tests that run against source today.

## Decision

**`apps/api` will use Fastify**, with:

- `@fastify/helmet`, `@fastify/cors` (explicit allowlist; wildcards are banned
  ecosystem-wide per the 2026-04-23 audit) and `@fastify/rate-limit`
- `jose` for JWKS verification of Janua tokens, **RS256 only**, with `alg: none`
  rejected and a test asserting it
- `zod` for request and response schema validation at the HTTP boundary
- Prisma as the persistence adapter behind repository ports
  ([ADR 0006](0006-ports-and-adapters-repositories.md))
- Plain constructor injection — a composition root that builds the adapters and
  passes them to services. No DI container.

All of these are declared in `apps/api/package.json` and used in
`apps/api/src/`. What is missing is the composition root itself: `package.json`
runs `tsx watch src/main.ts` and that file does not exist. The pieces are built
and wired to each other; nothing yet builds the server.

## Consequences

### What gets better

- The monorepo keeps a single module format. No dual build, no `dist/`, no
  conditional exports, no `.cjs` shims.
- The composition root is explicit and readable: one file that constructs
  adapters and hands them to services. This suits [ADR 0006](0006-ports-and-adapters-repositories.md)
  particularly well — swapping the Prisma adapter for the in-memory one in a
  test is a different argument, not a testing-module override.
- Startup and per-request overhead are lower, and the dependency footprint is
  smaller. Neither is decisive, and neither is claimed as the reason.
- No decorator-metadata reflection at runtime, which is one fewer thing that can
  behave differently between `tsc` and a bundler.

### What gets worse — stated plainly, because this is the honest cost

- **We diverge from dhanam and avala.** An engineer moving between MADFAM
  services now meets two API frameworks. This is a real organisational cost and
  it is the main argument against this decision.
- **No reuse of existing NestJS building blocks** from those repos: guards,
  interceptors, the Prisma module pattern, exception filters. Meridian
  re-implements the equivalents, which is duplicated effort and duplicated
  opportunity to get auth subtly wrong.
- **Less structure by default.** NestJS's module system imposes an organisation
  that a team gets for free. With Fastify, the structure is ours to impose and
  ours to let rot. ADR 0006 exists partly to supply that discipline
  deliberately.
- **We hand-roll what NestJS provides**: validation pipes, a consistent exception
  filter mapping `MeridianError.code` to HTTP status, request-scoped context, and
  OpenAPI generation. All are tractable; none are free.
- **Smaller MADFAM-internal knowledge base.** Fewer people to ask.

### What this does not decide

- The front ends. `apps/web` and `apps/admin` are Next.js 15, unaffected.
- Persistence. Prisma is chosen and is orthogonal — it works with either
  framework.
- Whether a future MADFAM service should use Fastify. This ADR is about
  Meridian's specific constraint (direct-source ESM workspace packages), not a
  general recommendation.

### When to revisit

Revisit if any of these becomes true:

- NestJS's ESM and standard-decorator story stabilises to the point where the
  configuration is unremarkable.
- Meridian's packages acquire a build step for another reason, which removes the
  cost this decision was avoiding.
- The organisational cost of two frameworks measurably exceeds the toolchain
  cost of one build step — for example, if auth handling drifts between services
  in a way that produces a security finding.

That last one is the real risk and it should be watched rather than assumed away.

## Alternatives considered

**NestJS, matching dhanam and avala.** The consistency argument is genuinely
strong and this was close. Rejected on the module-format constraint above: it
forces a dual-module build across six packages to serve one application, and the
packages are the valuable part of this repository.

**NestJS with a compiled `dist/` for every package.** Rejected. It is the same
decision with the cost made explicit — five packages pay a build step so one
application can use decorators, and the test loop on the domain code gets
slower.

**Express.** Rejected. No schema-validation story worth the name, weaker
TypeScript ergonomics, and no advantage over Fastify for this workload.

**Hono.** Attractive and lighter still, but the ecosystem for the specific
pieces needed here — JWKS verification, rate limiting, helmet-equivalent
hardening — is less settled, and Meridian handles Article 9 special-category
data. Maturity in the security-adjacent middleware mattered more than elegance.

**tRPC.** Rejected. The API must be consumable by non-TypeScript clients
(potential firm-tenant integrations, and eventually a mobile client doing MRZ
capture), and an HTTP contract with explicit schemas is the right surface for
something with this compliance profile.

## References

- `apps/api/package.json` — the declared dependency set
- `tsconfig.base.json`, and each package's `package.json` `exports` map
- [ADR 0006](0006-ports-and-adapters-repositories.md) — what the API layer is
  allowed to contain
- [ARCHITECTURE.md](../ARCHITECTURE.md) §4 — the request path the API must
  implement
