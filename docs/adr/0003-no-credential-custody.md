# ADR 0003 — No custody of government credentials

- **Status**: Accepted. **This decision is not open for revision by
  implementation convenience.**
- **Date**: 2026-07-25
- **Implemented in**: `packages/govtech/src/credential-guard.ts`,
  `packages/govtech/src/handoff.ts`, every adapter under
  `packages/govtech/src/adapters/`
- **Related**: [PRD.md](../PRD.md) §Departure 1, [SECURITY.md](../../SECURITY.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

The source PRD asks the platform to manage the retrieval and storage of **Cl@ve
PINs and Cl@ve Permanente passwords**, and to submit to Spanish public
administration on the user's behalf. The product logic is obvious and appealing:
the user is intimidated by the portal, we know exactly what to type, so we type
it.

Cl@ve is not a login for a website. It is a citizen's **identification means
before the Spanish State** — the same key that reaches their tax file with the
AEAT, their social security record, their civil registry entries and their
padrón registration. The equivalents elsewhere have the same shape: a Mexican
e.firma / FIEL private key is a legally binding signature; an IRCC secure account
password is the credential a legal act is attributed to.

Holding those has consequences in ascending order of seriousness:

1. **Role.** It makes MADFAM a credential custodian for a state identity system,
   a role with obligations nobody involved has signed up for or is insured for.
2. **Terms.** It is very likely a breach of the scheme's own terms, which treat
   the credential as personal and non-transferable.
3. **Blast radius.** It converts any breach of ours — a leaked backup, a
   compromised dependency, a curious employee — from an embarrassing data
   incident into an **identity-fraud event** reaching that person's tax,
   social-security and civil-registry records. The blast radius is not "our
   database". It is the user's legal identity.
4. **Attribution.** A submission made with the user's credential is legally *the
   user's act*, performed by someone else, with **no record on our side of them
   having consented to that specific act on that specific day**. When it goes
   wrong — a wrong figure, a missing document, an inaccurate declaration — the
   user is the person who made a false declaration to a state authority.

Point 4 is the one that settles it. Encryption at rest addresses 3 and does
nothing at all for 4.

There is also a pattern-level concern. Credential custody is not a feature that
stays contained. It starts as "store the PIN so the user does not retype it",
becomes "run the submission overnight", and ends with a system that performs
legal acts as a person who is asleep. Each step is small; the destination is not
a place a responsible platform should be.

## Decision

**Meridian does not hold a user's government authentication credential, does not
proxy one, and does not act before an authority while presenting as the user.**

The refusal is **encoded, not documented**, at four layers.

### 1. Declared capability state

Every adapter declares credential custody as capability state
`refused_by_policy`, with `policy: 'no_credential_custody'` or
`'no_impersonation'` and an `alternative` pointing at the handoff. A refusal
carries **no unblock path** — that is validated by `capabilityDefects`, which
emits `REFUSAL_HAS_UNBLOCK_PATH` if one appears. A capability that could be
unblocked is not a refusal.

Four of the fifteen declared capabilities are `refused_by_policy` today and they
are the only four that will never move.

### 2. Structural refusal in the type system

`CredentialFree<T>` maps every credential-shaped property, at any depth, to
`CredentialCustodyRefused<K>` — a type nothing is assignable to. Every operation
that accepts caller input is declared as:

```ts
function buildHandoff<T extends HandoffInput>(input: T & CredentialFree<T>): Result<AssistedHandoff, MeridianError>
```

The intersection at the parameter position is the usable form;
`T extends CredentialFree<T>` is a circular constraint TypeScript rejects. A
credential field is **unrepresentable**, not discouraged.

`tests/structural-refusal.test.ts` holds `@ts-expect-error` directives, so
`tsc --noEmit` **itself fails** if the refusal ever stops working. The guard is
tested by the type checker, not by a runtime assertion that could be deleted.

### 3. Runtime guard for untyped boundaries

`guardCredentialFree(payload)` scans property names and value shapes and returns
`Err(MeridianError('CREDENTIAL_CUSTODY_REFUSED'))` on a hit. It runs at the top
of every operation accepting caller input, because a JSON body arriving over
HTTP has no type.

Two calibration decisions worth preserving:

- **`credential` is deliberately not a forbidden name.** `@meridian/core`'s
  `AuthorizedRepresentative.credential` holds a licence *type* such as `'rcic'`.
  A guard with false positives gets disabled, and a disabled guard protects
  nothing.
- **Suffix patterns are anchored** (`*pin`, `*secret`) rather than matched as
  free substrings, because `shipping` contains "pin" and `secretariatName`
  contains "secret". There is a dedicated false-positive test block.

Two real defects the tests caught, both fixed. First, a field name written in
the scheme's own logo spelling — with `@` standing in for the `a` — normalised
to a string none of the rules matched, until `@`→`a` and `$`→`s` were added to
the normaliser; the substitution is the scheme's branding, not an evasion.
Second, a *field label* reading "Your Cl@ve PIN" passed, because the guard scans
property names and a label is a value —
`credentialNameRule` is now applied to field, capture and document ids and
labels. It is deliberately **not** applied to free prose, because Meridian's own
caveat text says "Meridian never asks for your Cl@ve PIN" and a rule scanning
all strings would refuse the sentence stating the policy. There is a test for
exactly that.

### 4. The replacement — assisted handoff

`buildHandoff` produces an `AssistedHandoff`: exact destination, ordered steps
with an actor and a channel for each, which of the user's own documents they
need, the values Meridian has already computed, and what to bring back. The user
authenticates with their own credential, on the government's own front end.

Safety rules baked into it: destinations must be `https`, on a narrow
per-jurisdiction official-host allowlist, **with no query string** (a pre-filled
destination is where someone eventually puts an NIE "to save typing", and URLs
land in history, referrer headers and proxy logs). The host character class
excludes `@`, so `https://clave.gob.es@evil.example/` fails to parse rather than
passing an allowlist check against the wrong half of the string. Every handoff
must capture at least one thing on return, or the audit-trail claim is false.

**Where a genuine delegated flow exists** — an eIDAS-style identity assertion
issued by the scheme *after the user authenticates directly with the scheme* —
that is a different architecture and it is welcome. We receive a signed
statement *about* the user; we never receive the user's authenticator. That is
what `clave.identity_assertion` is, and it is `not_provisioned` pending a formal
agreement, not refused.

## Consequences

### What gets better

- The user's legal identity is not in our threat model, because it is not in our
  database. The worst outcome of a total compromise of Meridian is bad, and it
  is not identity fraud against a person's tax and civil-registry records.
- The legal act and its audit trail stay with the user, in their own account,
  where a caseworker can see them and where consent to that specific act on that
  specific day is recorded by the authority itself.
- We are not a credential custodian for a state identity system, with the
  obligations, insurance and regulatory attention that role attracts.
- A future contributor cannot add it back casually. They must defeat a type, a
  runtime guard, a capability declaration and a set of `@ts-expect-error` tests,
  and every one of those failures is loud.

### What gets worse

- **The product is more work for the user.** They go to the portal themselves.
  That is a genuine cost and the handoff design is where we pay it down — by
  being precise about what they need, in what order, and what to bring back —
  rather than by pretending the cost does not exist.
- **We cannot offer end-to-end automated submission** where no delegated API
  exists, which is most places. `ircc.employer_portal_submission`,
  `ircc.applicant_submission` and `ircc.application_status_polling` are all
  `not_implemented` and stay that way until IRCC publishes an interface. RPA
  against a government portal is a terms-of-service question before it is an
  engineering one.
- **Competitors who do hold credentials will demo better.** Accepted.
- **The guard needs maintenance.** New credential vocabulary, new schemes, new
  branding conventions. A guard that is never updated decays.

### Enforcement in CI

`scripts/check-no-credential-custody.mjs` exists and runs in the `policy` job of
`.github/workflows/ci.yml`, before any install. As of 2026-07-25 it reports
`OK — 206 files scanned, 3 rules, 3 path exemptions, 2 structural anchors
verified`. The structural anchors are the point: if `CredentialFree` or the
runtime guard disappears, the greps are all that is left, and the script goes
red and says so rather than passing on a weakened codebase.

It scans the whole tree, `docs/` included, which has a practical consequence for
anyone writing about the refusal: **describe the forbidden field names rather
than spelling them.** This ADR was itself the first thing to trip the check.

A coordination note for whoever writes it: a naive repo-wide grep for the
forbidden vocabulary **will** match this package, because the detection rules and
their tests necessarily contain exactly those strings. The check must exempt
`packages/govtech/src/credential-guard.ts` and `packages/govtech/tests/` — or
better, invert, and assert that `guardCredentialFree` is called in every adapter
operation that accepts input.

## Alternatives considered

**Store credentials encrypted at rest, with a hardware-backed key.** Rejected.
It addresses the breach argument and does nothing for the attribution argument,
which is the one that decides it. It also still makes us a credential custodian.

**Hold the credential only in memory, for the duration of one submission.**
Rejected. Same attribution problem, plus it is the hardest version to reason
about and the easiest to quietly extend into persistence.

**Ask the user to enter the credential into a Meridian-hosted form that proxies
to the portal.** Rejected, emphatically. This is a credential-harvesting pattern
that is indistinguishable from phishing, would train users to type government
credentials into non-government pages, and would be a breach whether or not we
stored the result.

**Browser automation with the user present, driving their own session.**
Not adopted. It avoids custody, which is genuinely better, but automating a
government portal raises a terms-of-service question that must be answered
before the engineering question, and a fragile automation that half-completes a
legal filing is its own harm. Recorded as `not_implemented` with that reasoning
attached rather than silently omitted.

**Do it anyway and disclose it in the privacy policy.** Rejected. Disclosure is
not consent to the consequence, and the person bearing the consequence is not
the person signing the policy.

## References

- `packages/govtech/src/credential-guard.ts` — the full argument in the module
  doc comment
- `packages/govtech/src/handoff.ts`, `packages/govtech/tests/structural-refusal.test.ts`
- [PRD.md](../PRD.md) §Departure 1 · [SECURITY.md](../../SECURITY.md)
