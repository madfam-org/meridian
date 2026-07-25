# ADR 0001 — Civil-date arithmetic without `Date`

- **Status**: Accepted
- **Date**: 2026-07-25
- **Implemented in**: `packages/core/src/civil-date.ts`
- **Applies to**: every package in this repository

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

Meridian's core arithmetic is counting days. Not durations — *days*, as a
government counts them.

"The day you entered Spain" is a calendar day, not an instant. A border stamp
records a date, not a timestamp. Article 6 of the Schengen Borders Code counts
days of presence, and the day of entry and the day of exit both count, so a trip
that begins and ends on 2025-01-01 is **one day** of presence, not zero and not
a fraction. Three years' residence "before the date on which the application is
made" is a count of calendar days between two dates in a register.

JavaScript's `Date` is an instant — milliseconds since the Unix epoch — with a
presentation layer that depends on the runtime's timezone. Three specific
failures follow, and each of them is a real harm rather than a nuisance:

1. **The parse asymmetry.** `new Date('2025-03-01')` is parsed as UTC midnight.
   `new Date('2025-03-01T00:00:00')` is parsed as *local* midnight. In
   `America/Mexico_City` those are six hours and one calendar day apart. A
   presence ledger built in one and rendered in the other is off by a day, in a
   direction that depends on the sign of the offset.
2. **Silent rollover.** `new Date('2025-02-30')` does not throw. It produces
   2025-03-02. An impossible date entered from a badly transcribed stamp becomes
   a plausible wrong one, and nothing in the system ever says so.
3. **Arithmetic across DST.** `date.setDate(date.getDate() + 1)` adds a calendar
   day in most timezones and does something else on the two days a year when it
   does not. `+ 24 * 60 * 60 * 1000` is worse.

The consequence is not a rendering glitch. An off-by-one turns a lawful 90-day
Schengen stay into a 91-day overstay on a report a border officer will read, or
tells someone they have three days of allowance left when they have two. The
person harmed is the applicant, and they find out at a counter.

We also considered that the domain has no meaningful notion of "now". Every
question is asked *as of* some date — the submission date, the application date,
a hypothetical future date the user is planning around. A function that reads a
clock cannot be tested for the 2028 leap day and cannot answer "what was my
status on the day I applied".

## Decision

**No JavaScript `Date` is used for calendar arithmetic anywhere in this
repository.** `@meridian/core` provides the complete replacement and every other
package uses it.

1. **`IsoDate` is a branded string** in strict `YYYY-MM-DD` form.
   `isoDate(value)` validates both syntax and calendar validity, rejecting
   `2025-02-30` with an `InvalidDateError` rather than rolling it over. The brand
   means an unvalidated string cannot be passed where a date is expected.

2. **Conversion goes through Howard Hinnant's `days_from_civil` /
   `civil_from_days`**, which are exact for the proleptic Gregorian calendar over
   the entire range we care about and are about thirty lines of integer
   arithmetic with no floating point, no timezone, and no library.

3. **`DateRange` is closed and inclusive at both ends.**
   `rangeLengthDays` is `diffDays + 1`. This matches how authorities count and it
   is applied without exception: windows, lookbacks, residence periods,
   acceptance windows. `lookbackWindow(end, 180)` starts on `end - 179`, because
   the endpoint is one of the 180.

4. **`mergeRanges` merges adjacent ranges, not only overlapping ones.** Two
   back-to-back stays are one continuous presence; counting the seam twice
   inflates totals.

5. **`addMonths` clamps to the end of the target month.** `2025-01-31` plus one
   month is `2025-02-28`, which is how "three months from" is read
   administratively — not `2025-03-03`.

6. **The reference date is always a parameter.** There is exactly one sanctioned
   clock read in the repository: `todayUtc()` in `@meridian/mrtd`, which exists
   so callers can override it and whose doc comment says so. Adding a second is
   a defect.

7. **Month-unit windows stay in months.** A three-month acceptance window is
   applied as three months, never as 90 days. They differ by up to three days
   and always in the direction that ages the document.

## Consequences

### What gets better

- Timezone bugs are not mitigated; they are **structurally impossible**. There is
  no timezone in the type.
- Every calculation is deterministic and reproducible. 901 tests run against no
  fixture server, and "does exactly 90 days pass?" is answered by calling a
  function.
- Historical and hypothetical questions work identically to present-tense ones,
  because they are the same function with a different argument. `statusOn(pathway,
  '2025-04-02')` is not a special case.
- Impossible dates fail loudly at the boundary rather than becoming plausible
  wrong ones.
- Zero runtime dependencies for date handling, which matters for a package that
  will eventually be embedded in a mobile client.

### What gets worse

- **The comparison to instants is now the caller's problem.** Anything that
  arrives with a real timestamp — an audit log entry, a JWT `exp`, an HTTP date
  — must be converted to a civil date deliberately, with an explicit timezone
  choice, at the boundary. The type system will not do it silently, which is the
  point, but it is work.
- **We maintain calendar code.** `daysInMonth`, leap-year handling and the
  Hinnant conversions are ours to keep correct. Mitigated by the algorithms
  being small, published, and covered by tests including leap days, century
  boundaries and 29 February arithmetic.
- **No locale-aware formatting.** `IsoDate` renders as ISO 8601. Presentation
  layers must format it themselves, which is correct — a date shown to a user in
  Madrid and one shown to a user in Mexico City should read differently, and the
  domain has no business deciding that.
- **Interoperability friction.** Third-party SDKs take `Date`. Conversion is
  explicit and slightly tedious at every such boundary.

### What we can no longer do

- Sub-day precision anywhere in the domain. If a rule ever turns on the hour of
  a border crossing, this model cannot express it and the ADR must be revisited
  rather than worked around.
- Ambient "now". A function that wants today must be given today.

## Alternatives considered

**Use `Date` carefully, always UTC.** Rejected. "Carefully" is a discipline, and
disciplines fail at the third contributor. The failure is silent, it is one day,
and it is in the direction of telling someone they have committed an immigration
offence. Making the wrong thing impossible beat making it discouraged.

**Temporal (`Temporal.PlainDate`).** The right shape — `PlainDate` is exactly the
concept we need. Rejected for now because it is not uniformly available on Node
22 without a polyfill, and adopting a polyfill for the single most load-bearing
type in the system, in a package intended to have no runtime dependencies, was a
worse trade than thirty lines of integer arithmetic. **This is the most likely
ADR to be superseded**: when `Temporal.PlainDate` is available natively across
our targets, migrating `IsoDate` to wrap it is a contained change, because every
call site already goes through `@meridian/core`.

**date-fns / Luxon / Day.js.** Rejected. All of them are competent, and all of
them are built around instants with a civil-date convenience layer on top. The
ambiguity we are trying to eliminate lives in exactly that layer. A dependency
that mostly does the right thing is worse here than no dependency, because
"mostly" is where the off-by-one hides.

**Store day numbers as integers throughout.** Rejected as the *primary*
representation: an integer is unreadable in a database, a log, or a bug report,
and this system's outputs must be checkable by a human. `DayNumber` exists
internally as the arithmetic representation; `IsoDate` is what crosses every
boundary.

## References

- Howard Hinnant, *chrono-Compatible Low-Level Date Algorithms* —
  <http://howardhinnant.github.io/date_algorithms.html>
- `packages/core/src/civil-date.ts` and `packages/core/tests/civil-date.test.ts`
- [AGENTS.md](../../AGENTS.md) — invariant 1
