# Product Requirements Document — Meridian

> **Boundary note (Lane C, public-safe).** This document is the product origin
> record. Operational sequencing, operator gates and the private posture sink
> live in [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (RFC 0036), per the repo-boundary contract.

---

## Editorial preface

**Written 2026-07-25. Read this before the source document below.**

This file preserves the **origin PRD** — the owner-supplied specification that
Meridian was built from. It is kept as written, not silently improved, because a
product decision that departs from its own brief should leave a record of the
departure rather than quietly rewriting history. Where we did not build what the
PRD asked for, this preface says so, says why, and points at the decision record.

### How to read this document

- **The preface is current.** It reflects what was actually built.
- **The source PRD below is historical.** It is the input to the build, not a
  description of the system. Several of its claims were checked against primary
  sources during the build and did not survive; those are listed under
  *Corrections* below.
- Where the two conflict, **the preface and the ADRs win.** The code is the
  final authority, and the code is documented in
  [ARCHITECTURE.md](ARCHITECTURE.md) and
  [REGULATORY_POSTURE.md](REGULATORY_POSTURE.md).

### Status of the source text

The verbatim source PRD is **not yet committed to this repository.** It is held
by the owner and has not been transcribed here.

It must be pasted into the marked block at the end of this file **unaltered** —
no corrections, no tidying, no removal of the passages this preface disagrees
with. Those passages are the reason the preface exists. Editing them out would
destroy the audit trail that shows a deliberate, reasoned departure rather than
an oversight.

Until then, the substance of the two departures is recorded below in our own
words, with the PRD's requests quoted as they were relayed to the build.

---

## Departure 1 — we refuse custody of government credentials

**What the PRD asks for.** The source document asks the platform to manage the
retrieval and storage of Cl@ve PINs and Cl@ve Permanente passwords, and to
submit to Spanish public administration on the user's behalf.

**What we built instead.** Nothing of the kind, and the refusal is encoded
rather than merely documented.

Cl@ve is not a login for a website. It is a citizen's identification means
before the Spanish State — the same key that reaches their tax file, their
social security record, their civil registry entries and their address
registration. The equivalents elsewhere have the same shape: an e.firma / FIEL
private key is a legally binding signature; a portal password is the credential
a legal act gets attributed to.

Holding those has three consequences, in ascending order of seriousness:

1. It makes MADFAM a credential custodian for a state identity system, a role
   with obligations nobody involved has signed up for.
2. It is very likely a breach of the scheme's own terms, which treat the
   credential as personal and non-transferable.
3. It converts any breach of ours — a leaked backup, a compromised dependency, a
   curious employee — from an embarrassing data incident into an identity-fraud
   event reaching that person's tax, social-security and civil-registry records.
   The blast radius is not "our database". It is the user's legal identity.

There is a quieter fourth point. A submission made with the user's credential is
legally *the user's act*, performed by someone else, with no record on our side
of them having consented to that specific act on that specific day. When it goes
wrong, the user is the one who made a false declaration.

**The replacement is an assisted handoff**, and it is a better product, not a
degraded one: a structured package the user carries to the portal themselves —
exact destination, ordered steps, which of their own documents they need, and
the values Meridian has already computed for them. The user authenticates with
their own credential, on the government's own front end. The legal act and the
audit trail stay theirs, in their account, where a caseworker can see them.

Where a genuine delegated flow exists — an eIDAS-style identity assertion issued
by the scheme *after the user authenticates directly with the scheme* — that is
a different architecture entirely and is welcome. We receive a signed statement
about the user; we never receive the user's authenticator.

→ [ADR 0003 — no custody of government credentials](adr/0003-no-credential-custody.md)

### How the refusal is enforced

- `packages/govtech` declares credential custody as capability state
  `refused_by_policy` in every adapter. That state carries no unblock path, by
  construction — a capability that could be unblocked is not a refusal.
- Operation signatures use `CredentialFree<T>`, which maps any
  credential-shaped property at any depth to a type nothing is assignable to.
  A credential field is **unrepresentable**, not merely discouraged.
- `guardCredentialFree` catches anything arriving from an untyped boundary at
  runtime.
- `tests/structural-refusal.test.ts` holds `@ts-expect-error` directives, so
  `tsc --noEmit` itself fails if the type-level refusal ever stops working.
- `scripts/check-no-credential-custody.mjs` runs in CI, before any install, and
  verifies the structural anchors still exist as well as grepping for the
  forbidden vocabulary. If `CredentialFree` or the runtime guard disappears, the
  build goes red and says why.

---

## Departure 2 — "a personal migration law firm" collides with reserved-activity law

**What the PRD asks for.** The source document frames the product as an
automated **personal migration law firm** — a system that tells a person which
route to take and shepherds them through it.

**Why we did not build that framing.** Under **s.91 of Canada's Immigration and
Refugee Protection Act**, knowingly representing or advising a person **for
consideration** in connection with an IRPA proceeding or application is an
**offence** unless the adviser falls within the authorised categories — a lawyer
or other member in good standing of a provincial or territorial law society
(which, in provinces that license them, includes paralegals), a notary of the
Chambre des notaires du Québec, or a licensee of the body designated under
s.91(5), the College of Immigration and Citizenship Consultants. Spain has its
own reserved-activity rules for *asesoramiento jurídico*.

A platform that emits "you should apply under art. 22" to a paying consumer with
no authorised representative attached is not shipping a feature. It is
committing an offence on behalf of its operator.

**The resolution is a type, not a disclaimer.** Every output the engine produces
is *born* classified:

| Class | What it is | Released to |
|---|---|---|
| `information` | Neutral restatement of a published rule, with citation | Everyone |
| `assessment` | The user's own facts measured against a cited rule, arithmetic shown | Everyone |
| `advice` | A recommendation, ranking, strategy, or prediction of outcome | Only where an authorised representative is attached |

A single gate — `canRelease()` in `@meridian/core` — decides whether a
classification may reach a given audience. With no live, jurisdiction-matched
representative on the matter, `advice` is **downgraded to `assessment`**, and
the user is told what was withheld and why. Downgrading is possible; upgrading
is not.

Note that the posture is deliberately **stricter than the statute**. s.91 turns
on consideration, so free advice is not the offence — but Meridian downgrades
regardless. An unlicensed recommendation that nobody is accountable for is not a
product we ship, whether or not it is lawful.

**What the PRD's ambition actually becomes.** The full "personal migration law
firm" experience is not cancelled; it is gated on real licensing. A `firm`
tenant gets it today, because their own licensee is accountable. A
`madfam_represented` tenant gets it the day MADFAM holds a verified credential
and not one day before — and a `madfam_represented` tenant carrying no verified
credential has exactly the authority of an `individual`, enforced in code rather
than in policy prose, so the aspiration cannot leak into production by someone
flipping an enum.

→ [ADR 0002 — the advice boundary as a type, not a disclaimer](adr/0002-advice-boundary-as-a-type.md)
→ [REGULATORY_POSTURE.md](REGULATORY_POSTURE.md) for the full tenancy model

---

## Corrections to specific legal claims

Four legal facts were spot-checked against primary sources on 2026-07-25 during
the build. Three of them corrected either the PRD or our own first
implementation. That ratio — from a brief sourced largely to practitioner
commentary — is the entire argument for the citation-and-review machinery
described in [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md).

1. **Spanish nationality, art. 22 Código Civil — "de origen".** The reduced
   two-year residency period runs to nationals *de origen* of the listed states:
   nationality of **origin**, not merely nationality held. Someone who acquired
   an Ibero-American nationality by residence is on the ten-year regime. Our
   first cut checked the passport alone. This is why `Matter` carries
   `claimedNationality` as a distinct field from `nationalities` — inferring
   "the best available nationality" from a list is precisely the bug that costs
   a client eight years.

2. **Schengen accession dates for Bulgaria and Romania.** Air and sea controls
   were lifted 2024-03-31; land borders followed on 2025-01-01. Collapsing these
   into a single date mis-counts Schengen days in one direction or the other
   depending on which date is picked. `SCHENGEN_MEMBERSHIP` in
   `@meridian/core` records per-state effective dates and
   `isSchengenOn(country, date)` resolves membership **per day**, so a stay
   straddling an accession is split correctly without any special-casing.

3. **Authorised representatives under IRPA s.91 include paralegals** who are
   members in good standing of a provincial law society, in provinces that
   license them. Our first reading listed only lawyers, Quebec notaries and CICC
   licensees. The `RepresentativeCredential` union in `@meridian/core` carries
   `other_regulated` for exactly this case, with `licenceNumber` required to
   identify the register — but the doc comment on `canRelease` still enumerates
   the narrower set and should be corrected. Recorded as a known documentation
   gap rather than silently patched, because the enumeration is a legal
   statement and belongs in the counsel review, not in a drive-by edit.

4. **Golden-visa renewals after the 2025-04-03 repeal.** The PRD asserts that a
   property sold and replaced after the repeal cannot support a renewal. We
   could not support that from the transitional provisions of LO 1/2025, which
   process renewals under the law in force when the initial authorisation was
   granted. **Not encoded.** The pathway is present in the catalog with
   `status: 'closed'` and `closedOn: '2025-04-03'` so that a matter opened
   before the repeal can still be assessed against the rules then in force —
   `statusOn(pathway, asOf)` answers historically — but it deliberately does not
   claim `countsTowardNaturalisation`, and no renewal rule is asserted in either
   direction. Counsel decides this one.

---

## What we adopted from the PRD without change

The departures above are the exceptions. The core of the brief survives intact
and shaped the build:

- **The six-phase matter journey** — intake, identity validation, document
  assembly, submission, post-arrival tracking, status transition — is
  `MatterPhase` in `@meridian/core`, with sequential unlocking enforced by
  `unlockTasks`: a task in a later phase stays locked while an earlier phase has
  incomplete work.
- **Two foundational corridors**, Mexico → Spain and Mexico → Canada, seed the
  catalog. The engine is jurisdiction-generic; the corridors are data.
- **Machine-readable travel-document validation** as the first gate in every
  matter — `@meridian/mrtd`, ICAO Doc 9303, all five MRZ formats.
- **Continuous presence tracking** with tax-residency day counts, Schengen
  90/180, continuous-residence clocks and qualifying-work accumulation —
  `@meridian/presence`, where every number returns the ranges that produced it
  so an applicant can defend the figure to an officer.
- **Document logistics** — apostille versus consular chain, sworn-translation
  routing, freshness measured against the *submission* date rather than today —
  `@meridian/documents`.

### One PRD proposal held open rather than adopted

The PRD proposes ingesting **background GPS** to maintain the presence ledger.
Continuous location surveillance of a migrant is a serious proposition and the
current build does not make it the default. `PresenceSource` treats `'gps'` as
one source among five — alongside `'border_stamp'`, `'declared'`, `'itinerary'`
and `'inferred'` — all optional, with border stamps and itineraries as the
primary evidence, and each stay carrying a `PresenceConfidence` of `confirmed`,
`probable` or `assumed` so the provenance of every counted day stays visible.
Whether Meridian ever ships a background-location collector is an open product
and privacy question, not a settled requirement.

---

<!-- ============================================================ -->
<!-- BEGIN SOURCE PRD — PASTE VERBATIM, DO NOT EDIT OR CORRECT    -->
<!-- ============================================================ -->

## Source PRD (origin document)

> **NOT YET COMMITTED.**
>
> The owner-supplied PRD text has not been transcribed into this repository.
> Paste it below this block, unaltered — including the passages the preface
> above disagrees with. Do not correct its legal claims, do not remove the
> credential-custody request, and do not soften the "personal migration law
> firm" framing. Those passages are load-bearing evidence that the departures
> were deliberate.
>
> When it is pasted, update this notice to record the date it was added and who
> added it, and leave the preface above intact.

<!-- ============================================================ -->
<!-- END SOURCE PRD                                               -->
<!-- ============================================================ -->
