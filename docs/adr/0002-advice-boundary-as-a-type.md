# ADR 0002 — The advice boundary as a type, not a disclaimer

- **Status**: Accepted
- **Date**: 2026-07-25
- **Implemented in**: `packages/core/src/disclosure.ts`; enforced at every
  package's public surface, in `apps/api/src/disclosure/` and
  `apps/api/src/routes/registry.ts`, and by `scripts/check-advice-boundary.mjs`
  in CI. **`apps/api` has no tests**, so the gate's boundary conditions are not
  yet asserted by a suite.
- **Related**: [ADR 0005](0005-data-driven-pathway-catalog.md),
  [REGULATORY_POSTURE.md](../REGULATORY_POSTURE.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale. The
> private regulatory sink is `madfam-org/internal-devops` (RFC 0036).

---

## Context

The source PRD frames Meridian as an automated **personal migration law firm** —
a system that tells a person which route to take and shepherds them through it.

That framing collides with reserved-activity law. Under **s.91 of Canada's
Immigration and Refugee Protection Act**, knowingly representing or advising a
person **for consideration**, directly or indirectly, in connection with an IRPA
proceeding or application is an **offence** unless the adviser falls within the
authorised categories: a lawyer or other member in good standing of a provincial
law society (including, where licensed, paralegals), a Quebec notary, or a
licensee of the body designated under s.91(5) — the College of Immigration and
Citizenship Consultants. Spain has its own reserved-activity exposure for
*asesoramiento jurídico*, composed of the colegiación regime and Article 403 of
the Código Penal rather than a single provision; see
[REGULATORY_POSTURE.md](../REGULATORY_POSTURE.md) §3 for the honest version of
that analysis, including the parts we are less sure of.

The obvious industry response is a disclaimer: "this is not legal advice",
somewhere in a footer, in grey. That does not work, for a reason worth stating
plainly. **The question a regulator asks is what the system did, not what the
footer said.** A product that ranks three routes and labels the first one
"recommended" has made a recommendation. Adding a sentence denying it is not a
defence; it is evidence that the operator knew.

Two further forces shaped the design:

- **The boundary cannot be decided at render time.** By the time a value reaches
  a template, the information needed to classify it — was this a restatement of a
  rule, or a ranking? — has been lost. A render-time filter can only pattern-match
  on words, which fails on the first output that recommends without using the
  word "recommend".
- **The same engine must serve a law firm and a consumer.** A firm's licensee is
  accountable for the recommendation and should get everything the engine can
  compute. An unrepresented individual must not. Two codebases would diverge; a
  runtime flag would be one boolean away from a violation.

## Decision

**Every value the engine produces is born classified, and one gate decides
whether that classification may reach a given audience.**

### The classification

```ts
type DisclosureClass = 'information' | 'assessment' | 'advice';
```

| Class | Definition |
|---|---|
| `information` | Neutral restatement of what a published rule says, with a citation, not applied to the user's facts |
| `assessment` | The user's own facts measured against a published rule, with the arithmetic shown. Factual, reproducible, no recommendation |
| `advice` | A recommendation, a ranking, a strategy, or a prediction of outcome |

The operative test: **anything that ranks options, orders them, scores them, or
says what someone should do is `advice`.** A sort order is a recommendation.

### The carrier

```ts
interface Disclosable<T> {
  readonly classification: DisclosureClass;
  readonly value: T;
  readonly citationIds: readonly string[];
}
```

Classification is assigned **where the value is produced**, by the function that
knows what it computed — never by a route handler, a serialiser, or a template.
An `assessment` or `advice` with an empty `citationIds` is a defect.

### The gate

`canRelease(classification, context)` returns either `{ allowed: true }` or
`{ allowed: false, reason, downgradeTo }`. The rules, in order:

1. `information` and `assessment` are always releasable. Stating what a published
   rule says, and doing arithmetic on the user's own record, are not reserved
   acts anywhere Meridian operates.
2. `advice` to a `practitioner` or `platform_operator` is released. These
   audiences are the professionals, not the protected party.
3. `advice` to an `applicant` or `corporate_sponsor` requires a live,
   unexpired, **jurisdiction-matched** representative. Absent one, the output is
   **downgraded to `assessment`** — the user still sees their numbers and the
   rule text, just not a recommendation.

`maxDisclosure` combines classifications by taking the higher. Composing outputs
never de-escalates.

### Consequential design rules

- **Downgrading is possible; upgrading is not.** There is no function that raises
  a classification.
- **Downgrade is visible, never silent.** The `reason` travels with the response.
  Silence reads as an absence of options rather than a legal boundary.
- **A package's `src/index.ts` is its only export surface.** Raw engines behind a
  disclosure wrapper are genuinely unreachable from outside — the `exports` map is
  `{ ".": "./src/index.ts" }`, not a convention.
- **The posture is deliberately stricter than the statute.** s.91 turns on
  consideration, so free advice is not the offence. Meridian downgrades anyway.
  An unlicensed recommendation nobody is accountable for is not a product we
  ship, whether or not it is lawful. `ReleaseContext.forConsideration` is still
  recorded, because the exposure differs even where our behaviour does not.
- **No score, no percentage, no probability of success.** It would be the most
  heavily regulated thing an unlicensed adviser can say, and it would be
  fabricated besides — no authority publishes the data that would make it true.
  A test asserts none appears in ranked output.

## Consequences

### What gets better

- The boundary is checked by the compiler at the point where it can still be
  checked. A function returning `Disclosable<T>` cannot be silently treated as
  raw data.
- One engine serves all four tenant kinds. The difference is a `ReleaseContext`,
  not a fork.
- The failure mode is a *downgrade*, not an error page. The user's experience of
  the boundary is "here are your numbers, a representative would be needed to go
  further", which is honest and useful.
- Audit becomes possible: classification requested, classification released,
  representative or `null`, citations, timestamp. That record is the evidence
  that the system behaved, and it is what a regulator would ask for.

### What gets worse

- **The consumer product is genuinely less impressive.** An unrepresented
  individual does not get "apply under this route first", which is the sentence
  they came for. That is a real product cost, accepted deliberately.
- **Every engine author must classify.** It is one more thing to get right, and
  getting it wrong in the permissive direction is a legal exposure rather than a
  bug.
- **The type system does not catch a misclassification.** Nothing stops someone
  writing `disclosable('assessment', rankedList)`. What stops it is that ranking
  lives only in `recommend()` and `recommend()` is `advice` by construction —
  plus review. This is the weakest joint in the design and it is worth stating
  rather than papering over.
- **`canRelease` reads a credential that must actually be live.** A stale
  `verifiedOn` on a representative record silently keeps gating release for a
  lapsed licence. The re-verification process is an operational obligation the
  code cannot enforce on its own.

### What we can no longer do

- Ship a consumer product that recommends. Not behind a flag, not in a beta, not
  with a disclaimer.
- Return engine output from any route that bypasses the gate — including debug
  and internal routes and exports.

### How it is enforced today

Three layers, all present as of 2026-07-25:

1. **Structural, in the API.** `apps/api/src/routes/registry.ts` installs a
   Fastify `onRoute` hook that refuses to register any route whose config lacks
   a `meridian` block declaring whether it returns engine output. A developer
   adding a route does not get to skip the question; the server does not start
   until they answer it. A route declaring `engineOutput: true` that returns
   something else fails, and so does a route declaring `false` whose payload
   carries a classification or a `Citation` — that second check is
   `disclosure/leak-detector.ts`.
2. **Re-checked downgrades.** `apps/api/src/disclosure/gate.ts` re-runs
   `canRelease` on a downgraded value, so a downgrade that still returns
   `advice` cannot walk past the boundary it was written to respect.
3. **CI.** `scripts/check-advice-boundary.mjs` runs in the `policy` job of
   `.github/workflows/ci.yml`, before any install. It reports
   `OK — gate and producer anchors verified, 68 application files read,
   4 routes examined`.

**The remaining gap: `apps/api` has no tests.** The gate's boundary conditions —
no representative, wrong jurisdiction, expired credential — are exactly the
cases [Consequences](#what-gets-better) claims are cheap to test, and no test
currently asserts them. That is the largest outstanding item against this ADR.

## Alternatives considered

**A disclaimer.** Rejected: see Context. It describes the system rather than
constraining it.

**A runtime feature flag per tenant.** Rejected. One boolean between a compliant
product and an offence, with no type-level trace of which values it governs.

**Two products, one licensed and one not.** Rejected. The codebases diverge, the
legal analysis has to be redone for each, and the unlicensed one still needs the
boundary internally.

**Classify at the API serialisation layer by inspecting the value's shape.**
Rejected. By then the information is gone: an ordered array and an unordered one
are the same type, and the difference between them is the entire legal question.

**Suppress rather than downgrade.** Rejected. A user who gets nothing cannot tell
a legal boundary from a bug and will assume they are ineligible. Downgrading
preserves everything lawful and explains what was withheld.

## References

- `packages/core/src/disclosure.ts`, `packages/core/tests/disclosure.test.ts`
- `packages/pathways/src/recommend.ts` — the only place a ranking is produced
- `packages/presence/tests/disclosure.test.ts` — asserts every presence entry
  point releases to an unrepresented paying applicant
- [REGULATORY_POSTURE.md](../REGULATORY_POSTURE.md), [PRD.md](../PRD.md) §Departure 2
