# ADR 0008 — Corridors are derived, and coverage is reported twice

- **Status**: Accepted
- **Date**: 2026-07-26
- **Implemented in**: `packages/atlas/` — `types.ts`, `corridor.ts`,
  `coverage.ts`, `stock.ts`, `blocs.ts`, `regions/*.ts`; reported by
  `scripts/atlas-coverage.mjs`
- **Related**: [ADR 0005](0005-data-driven-pathway-catalog.md),
  [COMMERCIAL_POSTURE.md §6](../COMMERCIAL_POSTURE.md),
  [ARCHITECTURE.md §2](../ARCHITECTURE.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

Meridian encodes three immigration systems out of roughly two hundred. Some
number has to describe that, it will be quoted in status updates and in
conversations about money, and **a coverage metric is one of the easiest things
in software to make dishonest** — not by lying, but by choosing a denominator.

Two failure modes were visible before anything was built:

**The metric that is improvable by looking away.** Drop the uninhabited
territories from the registry and structural coverage rises. Drop the corridors
nobody has researched and weighted coverage rises. Neither is a lie about any
individual figure; both make the number better by making the map smaller. A
denominator a team controls is a denominator a team will eventually edit.

**The metric that is meaningless because it is the wrong shape.** The obvious
model of the problem is every ordered pair of countries — roughly 200 × 199, near
forty thousand corridors. Adopt it and Meridian reports a fraction of a percent
forever while doing real work, because the denominator was invented rather than
observed.

There was also a modelling question underneath. Immigration rules are
overwhelmingly **destination-side**: Spain decides who may reside in Spain. What
the origin nationality changes is not the existence of the rules but their
*terms* — whether a visa is needed at all, whether a reduced qualifying period
applies, whether a bilateral instrument creates a route that would not otherwise
exist. A Mexican and a Moroccan applying in Spain meet the same statute;
art. 22.1 CC gives one of them a two-year period and the other ten.

And a third pressure, specific to this product: migration is **extremely
concentrated**. A handful of corridors carry an enormous share of the world's
migrants and most ordered pairs carry almost nobody. Any single number that
treats Mexico→United States and Tuvalu→San Marino as equal units of progress is a
good way to feel busy while helping no one.

## Decision

**A corridor is derived from a destination and an origin, never stored. Coverage
is reported as two numbers, always together, over a denominator whose known
faults are printed alongside it.**

### 1. The universe is destinations × agreements

```
~200 destination systems  ×  a few dozen agreements that modify them
```

`ALL_JURISDICTIONS` holds the destination systems, keyed by ISO 3166-1 alpha-2
and assembled from five region files. `MOBILITY_BLOCS` holds the agreements, with
**dated** memberships. `deriveCorridor(origin, destination, asOf)` computes the
answer from those two inputs.

There is no table of forty thousand pairs, and the percentages are not over one.
A bloc accession is therefore edited in one place rather than in every pair it
touches, and it resolves *per date* — so a corridor assessed for 2024 and the
same corridor assessed for 2026 can differ, correctly.

### 2. Coverage is two numbers and they are printed together

| | What it measures | Today |
|---|---|---|
| **Structural** | Systems encoded ÷ systems in the registry | **1.20%** — 3 of 249 |
| **Weighted** | Migrants on covered corridors ÷ migrants in the stock table | **0.6076%** |

Structural coverage measures the engineering surface. Weighted coverage measures
the share of actual human beings whose corridor Meridian can speak to. **They must
be read together, and when they diverge sharply the weighted number is the one
that matters.**

Neither is usable alone: structural coverage is flattered by small jurisdictions,
and weighted coverage hides how many systems are unmapped.

### 3. "Covered" means both ends encoded

A corridor is only as known as its least-known end. Answering a Mexican national
about the United States requires knowing what the United States does *and* what
Mexico issues, exits and recognises.

This is the strictest available reading and it was chosen for that reason. It
kept weighted coverage at exactly **zero** until 2026-07-26 — three encoded
jurisdictions, and only then did any single stock row have both ends encoded.
The entire 0.6076% today is two rows: Canada→US (950,000) and US→Canada
(257,000).

**Mexico→United States — 11,280,000 people, the largest bilateral corridor in the
world — is still uncovered**, and remains row 1 of the work queue. It becomes
covered when somebody encodes the *Mexican* system, not when somebody adds more
United States records. A destination-side-only count is printed too, explicitly
labelled "for scale, and NOT as a coverage figure" — 18.4% of world stock — so
that the more flattering number exists in the open rather than being reinvented
by whoever wants it.

### 4. The denominator is published with its faults

`ALL_JURISDICTIONS` is **not** a count of immigration systems in the world, and
the report says so before it says anything else. It errs in both directions and
the errors do not cancel:

- It **includes** places with no permanent population and no residence route —
  Bouvet Island, Heard and McDonald, the French Southern Territories, the US
  Minor Outlying Islands. They are present so a consumer can exclude them
  *deliberately*; a place that is absent cannot be excluded, only forgotten. They
  permanently depress structural coverage.
- It **excludes** roughly seven authorities that control entry to territory but
  have no ISO alpha-2 code: Somaliland, Northern Cyprus, Abkhazia, South Ossetia,
  the UK Sovereign Base Areas, Transnistria, Mount Athos. Each is a note on the
  nearest coded entry rather than an invented code, because a fabricated key in a
  standard-keyed registry propagates into every corridor derived from it.
- Three codes hide more than one control each: `SH` covers Saint Helena,
  Ascension and Tristan da Cunha; `SO` speaks only to the federal Somali system;
  `ES` carries Ceuta and Melilla.

The same applies to the stock table. It is UN DESA International Migrant Stock
2024, every country pair at or above 200,000 persons and nothing else. It holds
65.34% of world stock. **The ceiling is 92.7%, not 100%**, because 7.3% of the
source is origin "Others" and is unreachable by any bilateral table. Completeness
is to be read against that ceiling. The one derived row — "below the cutoff" — is
labelled as derived where it appears.

Rows that a reader would otherwise silently "fix" are kept and explained: Puerto
Rico to the United States is not an immigration corridor; the
Russia/Ukraine/Kazakhstan rows include people the 1991 border moved rather than
people who moved. **Dropping rows on our own judgement would be a silent
editorial filter on a checkable metric.**

### 5. Integrity findings are exported, not suppressed

`ATLAS_INTEGRITY` is computed at load from 16 rules and exported. A denominator
with a *known* fault is still usable; one with a hidden fault is not. The report
prints the findings above the percentages, and `--strict` exits non-zero on any.

Cross-reference gaps in the opposite direction — memberships the bloc registry
records that a jurisdiction entry does not mention — are reported **separately**,
because that list is large and mostly stub states, and burying real errors under
it would defeat the purpose.

### 6. The registry merge order is alphabetical, and that is a decision

Region files are merged in alphabetical order and duplicates resolve first-wins.
Alphabetical order has no relationship to research depth, which is exactly why it
was chosen: **an ordering that cannot be accused of having been picked to improve
the number.** Where first-wins discards a record with a *higher* research status,
that is itself an integrity finding rather than being silently repaired by
preferring the better record.

### 7. Fractions with an empty denominator are zero

Not `NaN`, which formats as "NaN%" and gets patched downstream with a fallback of
1. Not `1`, which would report an empty atlas as perfectly covered — green-by-
vacuity applied to a metric. Zero of zero is zero, with `totalJurisdictions`
printed next to it so a reader can see the denominator is empty.

## Consequences

### Better

- The number cannot be improved by editing the registry, because the registry's
  faults are printed with it and the integrity findings are exported.
- A bloc accession is a one-line edit that resolves per date.
- The honest number is the prominent one, and the flattering one exists in the
  open and is labelled as not-a-coverage-figure.
- Progress is legible as a queue: the report ends with the largest uncovered
  corridors in value order, which is a work list rather than a score.
- The whole report is reproducible: `node scripts/atlas-coverage.mjs
  --as-of=YYYY-MM-DD`.

### Worse

- **The headline number is brutal and will stay brutal for a long time.** 1.20%
  structural and 0.6076% weighted are correct and are not what anyone wants on a
  slide. Choosing the strict both-ends test made this materially worse than a
  destination-side count would have. That was the intent, and it will be argued
  about.
- **249 as a denominator is defensible but arguable**, and it permanently includes
  places nobody will ever encode. Anyone quoting it must quote the caveats, which
  is why the script prints prose rather than a number.
- **`researched` does not mean what a reader assumes.** 123 of 249 jurisdictions
  carry it, and it usually establishes only autonomy and bloc membership. The
  report says so; the status name still oversells it.
- **A reporting script carries prose that can go stale independently of the
  arithmetic it prints.** This has already happened — see below.

### Known defect, today

`packages/atlas/src/coverage.ts:27` and `scripts/atlas-coverage.mjs:288` both
still say the weighted figure is zero because "the two encoded jurisdictions do
not appear as the two ends of any single row". **There are now three encoded
jurisdictions and two such rows.** The script prints that sentence directly
beneath the 0.6076% it just computed. The arithmetic is right and the prose
around it is wrong.

It is recorded here and in
[LEGAL_CATALOG_REVIEW.md](../LEGAL_CATALOG_REVIEW.md) rather than fixed in this
change, because those files are outside the `docs/` tree. It is a live
illustration of the fourth consequence above: explanatory prose next to a
computed number is a second thing to maintain, and it fails silently.

## Alternatives considered

**Store ~40,000 country pairs.** Rejected: the denominator would be invented
rather than observed, and the metric would report a fraction of a percent forever
regardless of real work. It also misdescribes the law, which is destination-side.

**One coverage number.** Rejected whichever one is chosen. Structural alone
treats Tuvalu→San Marino as equal to Mexico→US. Weighted alone hides how many
systems are unmapped. The pair is the answer.

**Count a corridor as covered when the destination is encoded.** This is the
number a product team wants: it would read 18.4% of world stock today instead of
0.6076%. Rejected as *the* metric because it is not true — you cannot answer a
Mexican national about the United States without knowing what Mexico does — but
it is printed, explicitly labelled as not a coverage figure, so that it is
available honestly rather than being reinvented informally.

**Exclude uninhabited territories from the denominator.** Rejected: it is the
first step on the path where the denominator becomes a thing the team edits when
the number is disappointing. They are listed so they can be excluded by a
consumer, deliberately and visibly.

**Suppress integrity findings until they are fixed.** Rejected. A denominator
with a known fault is usable; one with a hidden fault is not.

**Invent codes for Somaliland, Northern Cyprus and the rest.** Rejected: a
fabricated key in a standard-keyed registry propagates into every corridor
derived from it. They are notes on the nearest coded entry, and the atlas
understates entry-controlling authorities by roughly seven, which is stated.

## References

- `packages/atlas/src/types.ts` — why destination-first, why two numbers
- `packages/atlas/src/index.ts` — what `ALL_JURISDICTIONS` is and is not
- `packages/atlas/src/coverage.ts` — `computeCoverage`, `checkAtlasIntegrity`
- `scripts/atlas-coverage.mjs` — the report, and why it prints so much prose
- UN DESA International Migrant Stock 2024, bilateral matrix — the stock source
