# ADR 0009 — Legal sources: Meridian cites the publisher, Tezca and BOE keep the text

- **Status**: Proposed. Implemented as `packages/sources` and
  `scripts/source-drift.mjs`; not yet wired into any application or CI job.
- **Date**: 2026-11-10
- **Applies to**: `packages/sources`, the pathway catalog's citations
- **Related**: [ADR 0005](0005-data-driven-pathway-catalog.md),
  [ADR 0006](0006-ports-and-adapters-repositories.md),
  [docs/LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.
> Operational detail (API keys, schedules, who runs the report) lives in the
> private operations repository.

---

## Context

Every rule in the catalog carries a `Citation` with a `verifiedOn` date: the day
a person last read the provision against its source. `staleness()` turns the age
of that date into `fresh`, `aging` or `stale`, and CI fails on `stale`.

That measures one thing — how long since somebody looked. It cannot see the
other thing that makes a citation wrong: the law moving. Spain repealed the
investor-residence route with about three months' notice; a citation verified
the week before the repeal stayed `fresh` for a quarter while describing a
route that no longer existed.

Two systems already know when legal text changes:

- **BOE** publishes Spain's consolidated legislation through an open-data API,
  and dates every block of every instrument — each article carries the date its
  consolidated text last changed.
- **Tezca**, MADFAM's Mexican-law corpus, ingests the Cámara de Diputados
  federal library and keeps, on every law, the publisher URL it came from.

Meridian should use them. The risk is the obvious one: two services that both
"do law" drifting into each other, until Meridian is a second, worse copy of
Tezca, or Tezca starts encoding eligibility.

## Decision

**Meridian cites the publisher. The source keeps the text. The seam is the
publisher's own identifier.**

1. **The catalog does not change shape.** Citations keep pointing at the
   official publication (`boe.es/buscar/act.php?id=BOE-A-…`,
   `diputados.gob.mx/LeyesBiblio/…`). No Tezca record id, no BOE block id is
   written into the catalog. `locateCitation()` derives the instrument and the
   articles from `url` and `provision` alone, and reports — never guesses —
   when it cannot.
2. **Each source sits behind one adapter** implementing `LegalSource.read()`.
   The BOE adapter reads the consolidated index; the Tezca adapter reads the law
   record. Fetch is injected, so the package does no I/O of its own and its
   tests need no network.
3. **Identity is checked, not assumed.** Tezca does not yet resolve a publisher
   URL to its own record, so the adapter carries a short table from
   LeyesBiblio file to Tezca id — and on every read requires the returned
   record's `source_url` to equal the cited URL. A mismatch is
   `identity_mismatch`, not a success. When Tezca can answer "which of your
   records is this publisher URL?", that call replaces the table.
4. **A source can only lower trust.** `assessDrift()` reports
   `changed_since_verification`, `unchanged_since_verification` or
   `undeterminable`. Nothing in the package writes or extends `verifiedOn`: a
   machine reading a date off an index is not a person reading the law.
5. **Granularity is part of the answer.** BOE dates articles
   (`history: 'article'`). Tezca's dates, where it has more than one version,
   are law-wide (`history: 'instrument'`), so a change anywhere in the law
   flags every cited article in it — conservative in the safe direction. Where
   Tezca holds a single version with no `valid_from`, it has the text but no
   reform history (`history: 'none'`), and drift is `undeterminable`. One
   version dated 1917 is never read as "unchanged since 1917".
6. **Nothing about a person crosses the seam.** No adapter accepts a fact, a
   matter or an applicant; the only data in a request is an instrument
   identifier. The browser tools' promise that nothing typed leaves the device
   is untouched, because no browser code calls a source.

## What each side owns

| Concern | Owner |
|---|---|
| Law text, versions, vigencia, cross-references, case law (Mexico) | Tezca |
| Law text and per-article change dates (Spain) | BOE |
| Which provision a criterion rests on, and when a person last read it | Meridian catalog |
| Whether the cited text has moved since then | `@meridian/sources` (report only) |
| Evaluating a person's facts against a rule | `@meridian/pathways` |

## Consequences

- `scripts/source-drift.mjs` is a report, like `atlas-coverage.mjs`: it needs
  the network, so it is not a CI guard. A publisher outage is not a defect in
  this repository.
- Citations whose URL is a BOE gazette page (`txt.php`, `doc.php`), an EU or
  Canadian source, or whose provision names no article, come back
  `undeterminable` with the reason. Adding an adapter (EUR-Lex, Justice Laws)
  is a new file, not a change to this design.
- For Mexico, drift detection waits on Tezca: today it can confirm identity and
  link to the article, but most federal laws it holds carry no reform history.
  The asks are recorded where Tezca's maintainers will see them: canonical,
  stable law identifiers with aliases for duplicates; a lookup by publisher URL;
  reform-level versions for the instruments Meridian cites; and article-level
  change events in its changelog and webhooks.

## Rejected alternatives

- **Write Tezca ids into the catalog.** Couples the law Meridian encodes to
  another system's record numbering, which already has duplicates and opaque
  ids. The publisher URL is the identity both systems already agree on.
- **Copy article text into the catalog and diff it.** Turns Meridian into a law
  mirror, makes the public repository carry text it does not maintain, and
  still needs a source to diff against.
- **Bump `verifiedOn` when the source shows no change.** Destroys the field's
  meaning, which is that a person read the provision.
