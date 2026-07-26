# Commercial Posture

> **Boundary note (Lane C, public-safe).** This document is the *argument* for
> the commercial model — why it is shaped this way and what would break it.
> Prices, fee arrangements, contract values, forecasts, pipeline, counsel
> engagement costs and anything else with a number attached are private and live
> in [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops),
> per [`docs/repo-boundary-contract.md`](https://github.com/madfam-org/internal-devops/blob/main/docs/repo-boundary-contract.md).
> If you came here looking for a price list, there isn't one, and section 9
> explains why writing one down before it is decided would be a defect.

Last updated: 2026-07-26.

Companion documents: [PERSONAS.md](PERSONAS.md) is who this is for and what it
cannot do for them. [REGULATORY_POSTURE.md](REGULATORY_POSTURE.md) is the legal
reasoning this rests on. [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md) and
[COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md) are the review process that
section 6 identifies as the binding constraint on revenue.

---

## Who this is written for

A future contributor with a reasonable-sounding idea.

The ideas that would damage this product most do not look like sabotage. They
look like growth work: *put the results behind an email capture*, *show a "3
firms viewing" badge*, *let the free tier see one recommendation to create
desire*, *add a success-probability score because users ask for one*. Each is a
standard move in a standard playbook, each would be shipped by someone acting in
good faith, and each would either break the law on the operator's behalf or
destroy the only asset this product has.

This document exists so that the argument does not have to be rediscovered under
deadline pressure by someone who was not in the room.

---

## 1. The central claim: the advice boundary and the pricing boundary are one boundary

Read [`packages/core/src/disclosure.ts`](../packages/core/src/disclosure.ts)
first. Everything below is a consequence of what is in that file.

Every value the engine produces is born carrying a `DisclosureClass`:

| Class | What it is | Regulated |
|---|---|---|
| `information` | A neutral restatement of a published rule, with a citation, not applied to anyone's facts | No |
| `assessment` | The user's own facts measured against a cited rule, arithmetic shown | No, on our reading |
| `advice` | A recommendation, ranking, strategy, or prediction of outcome | **Yes** |

`canRelease(classification, context)` is the single gate that decides whether a
classification may reach an audience. Its rules, from the source:

1. `information` and `assessment` are **always** releasable. The function
   returns `{ allowed: true }` for anything that is not `advice`, before it looks
   at the context at all.
2. `advice` releases to a `practitioner` or a `platform_operator` — these
   audiences are the professionals, not the protected party.
3. `advice` to an `applicant` or a `corporate_sponsor` requires an
   `AuthorizedRepresentative` who is live, unexpired, and authorised in the
   jurisdiction the output concerns. Absent one, the output is **downgraded to
   `assessment`** with a stated reason. Never suppressed silently, never
   upgraded.

Now read that as a price list rather than as a compliance rule. It is the same
list:

- Output that anyone may lawfully receive → **free, no account, no limit.**
- Output that requires a licensed professional to be accountable for it → **sold
  to the professional whose licence covers it.**

The commercial line and the legal line are drawn in the same place by the same
function, and the function is the one already enforced in
`apps/api/src/disclosure/gate.ts`, guarded by
`scripts/check-advice-boundary.mjs`, and documented in
[ADR 0002](adr/0002-advice-boundary-as-a-type.md).

### Why this alignment is unusual, and why it is worth protecting

A paywall is normally an arbitrary line. Someone picks a feature, moves it
behind a wall, and the wall's only justification is that it converts. That
arrangement is inherently adversarial: the product improves for the company when
it degrades for the non-paying user, so there is permanent pressure to degrade
more. Everyone has met the result — the calculator that computes your answer and
then blurs it.

Here the line was not picked. A legislature drew it, twice, in two
jurisdictions, for reasons that have nothing to do with our revenue. That has
three consequences worth stating plainly:

**The free tier cannot be degraded to sell more.** Moving an `assessment` behind
a wall does not make it advice, and it does not make the paid tier more
valuable. It just makes us worse. There is no version of this product where
withholding arithmetic from a person about their own recorded facts is a
commercial gain, because the thing being sold on the other side of the wall is
not the arithmetic.

**The paid tier cannot be widened to sell more.** Releasing `advice` to an
unrepresented applicant because they paid is precisely the offence described in
IRPA s.91 — the section turns on *consideration*, so the payment is the
aggravating fact, not the licence. Growth by widening the advice tier is growth
by committing an offence on the operator's behalf.

**The boundary is checkable by anyone.** The repository is public and AGPL-3.0.
A prospective buyer, a regulator, or a competitor can read the gate, read the
tests, and confirm that the thing we say about our own product is true. Very
little else in this category is checkable.

### The loophole the code deliberately does not take

`ReleaseContext` carries a `forConsideration` field — whether the reader is
paying. IRPA s.91 turns on consideration, so a purely free product has a
colourable argument that the section is not engaged, and a company optimising
for reach would take that argument and ship recommendations to unrepresented
free users.

`canRelease` never reads the field. Grep it: `forConsideration` is declared on
the interface and is not referenced in the function body. The doc comment says
why, and it is the load-bearing sentence in the whole file:

> an unlicensed recommendation that is merely lawful is still a recommendation
> nobody is accountable for, and Meridian does not ship those.

The field stays on the interface because the *context* is real and an audit
trail should record it. The decision does not turn on it. If you are ever
tempted to wire it up as a fast path, you are proposing to make the free tier
more dangerous than the paid one, which is exactly backwards.

---

## 2. Why the free tier is not charity

Three independent reasons. Any one of them would be sufficient; together they
mean the free tier survives a cost-cutting review.

### It costs almost nothing

`assessment`-class tooling is client-side computation. This is not an
aspiration — it is what the code does today, and it is checkable:

- `apps/web/app/tools/schengen/SchengenTool.tsx`,
  `apps/web/app/tools/nationality-es/NationalityTool.tsx` and the MRZ tool are
  `'use client'` components that run `@meridian/presence`, `@meridian/pathways`
  and `@meridian/mrtd` compiled into the page bundle.
- `grep -rn "fetch(" apps/web apps/landing` returns nothing. No server action,
  no storage write, no query-string round trip.
- Neither application reads an environment variable naming an API host. There is
  no backend for these tools to be expensive on.

A traveller's stay history never leaves their browser, which is a privacy
property first and a unit-economics property second. The marginal cost of an
additional free user is bandwidth for a static bundle. Not zero, but close
enough that "we cannot afford the free tier" will never be a true sentence about
this architecture, and anyone who says it should be asked to produce the
invoice.

### It is the credibility proof, and this category needs one

Every competitor in immigration self-assessment overclaims. The pattern is
consistent: a confident eligibility verdict, an invented processing-time
estimate, a percentage chance of success, no citations, and a form at the end.
None of it is checkable, and much of it is a lead-generation funnel wearing a
calculator's clothes.

Meridian's answer to that is not a claim about being more careful. It is a
working thing a stranger can use in thirty seconds, whose every figure shows its
arithmetic and names the instrument it came from, with no account and no email
field anywhere in the flow. **"Try it right now" outperforms "trusted by N
firms" when N is zero** — and it has the additional advantage of being true.

Gating the free tier would convert the strongest available demonstration into a
promise, at exactly the moment when the product has nothing else to offer as
evidence.

### Gating it would make us the thing we are an alternative to

This is the argument that matters most and it is not sentimental. The entire
positioning rests on one distinction: other tools compute an answer and then use
it as leverage; Meridian computes an answer and gives it to you. Erase that
distinction and there is no differentiated product left — just another funnel,
with an unusually pedantic legal architecture and no customers.

**Therefore: never compute an answer and then demand an email to see it.** Not
as a test, not "just for the professional tools", not behind a feature flag. If
a result can be computed, it renders.

---

## 3. What is actually sold: continuity, not calculation

The one-off answer is free forever. What a person cannot do for themselves is
keep watching a clock for two years.

The Schengen calculator tells you where you stand today. It does not notice, six
months from now, that a trip you booked will put you over on the return leg. The
freshness engine can tell you a certificate will be stale on a submission date
you name. It does not tell you, unprompted, that the date arrived. That gap
between *a computation* and *a standing obligation to watch* is the product.

Named concretely, the paid surface is:

- **Saved matters.** A matter is one objective, in one jurisdiction, under one
  route, with its own phase and its own sequential task list
  (`packages/core/src/matter.ts`). Persisting it is what turns a calculation into
  a case.
- **Deadline monitoring.** Immigration deadlines are unforgiving and mostly
  invisible: a residence card that must be applied for within one month of
  notification of a grant, a continuity window that a single long absence
  breaks.
- **Document-expiry alerts.** `packages/documents/src/freshness.ts` computes
  whether a document is acceptable on the *submission* date, which is not today.
  Watching that projection over time is work nobody does by hand reliably.
- **A persistent presence ledger.** `packages/presence/src/ledger.ts` — including
  `detectInconsistencies`, which finds contradictions in a person's own record
  (two countries on one day, unaccounted gaps, an imputed departure). That is
  only useful if the record accumulates.
- **Audit-ready reports.** An append-only trail — `AuditRepository` has `append`
  and `list` and nothing else, because a trail that can be edited is not
  evidence.
- **Attaching a representative to a matter**, which is what makes advice-class
  output releasable at all.

Note the shape: every item is *state over time*. None of them is a better
calculation. The engine that a paying firm uses is the same engine the anonymous
visitor uses; the difference is that the firm's copy remembers.

### The honest part

**None of that exists today.** Not "is unpolished" — is not built. Checkable:

- There is no notification, reminder, scheduling or alerting subsystem anywhere
  in the repository. A word-boundary grep across every package and application
  for `cron`, `scheduler`, `setInterval`, `notify` and `sendEmail` returns
  nothing; the word "notification" appears only as prose inside catalog records
  describing statutory notification periods.
- The portal's matter, document and presence pages render worked examples
  declared in `apps/web/lib/sample/`, under a banner that says so
  (`apps/web/components/WorkedExample.tsx`). There is no database behind them, no
  account, and no upload path.
- The firm console reads a static dataset selected by an environment variable
  (`apps/admin/lib/records/index.ts`) and exposes no write side at all.
- `apps/api` has routes, a schema and a composition root, and no deployed
  surface calls it.

So the paid product is not merely unpriced. It is unbuilt, and the free product
is the whole product today. Anyone reasoning about revenue from this document
should reason from that fact rather than around it.

---

## 4. Free for legal-aid and NGO clinics, permanently, and said out loud

Not a discount. Not a programme with an application form. A published commitment
that clinics doing legal-aid immigration work do not pay, stated on the site
rather than granted on request.

The reasoning, in descending order of how much weight it carries:

**A discount you have to ask for is a filter, and it filters out the people it
is supposed to reach.** Underfunded clinics run by people with no time do not
write to vendors asking whether there is a nonprofit rate. A commitment costs
nothing to administer and reaches everyone; a programme costs administration and
reaches whoever had a spare afternoon.

**It is the cheapest true statement available about what the product is for.**
In a domain where trust *is* the product and we have no customers, no
testimonials and no track record, a standing commitment that gives away the
highest-value tier to the lowest-paying users does more commercial work than any
testimonial we could honestly print. It is also unfalsifiable in the good sense:
either we do it or we visibly do not.

**The alignment is real, not rhetorical.** Clinics are the users with the
greatest need for exactly the `advice`-class output that requires a licensed
representative — and clinic supervisors *are* licensed. They are the audience
where the gate opens rather than closes. Charging them would mean pricing out
the population the gate was designed to protect.

**Marginal cost is near zero and stays near zero.** See section 2. A clinic on
the free tier costs what any other user costs.

The commitment binds even when it is commercially inconvenient — which is the
only interesting case. If a clinic is later found to be the largest single
consumer of counsel-reviewed pathways, that is a fact about the value of the
commitment, not an argument against it.

---

## 5. Where the money would come from, in order

The ordering is by how directly the buyer's own licence maps onto the gate. It
is not a forecast, and no number in this section is a projection because we have
none.

1. **Immigration lawyers and small firms (1–10).** The core buyer. Their licence
   already covers advice; Meridian is caseload plus engine.
2. **Gestorías (Spain) and RCICs (Canada).** Same shape, different regulator.
   Both credentials exist in `RepresentativeCredential` today.
3. **Corporate mobility and HR.** Highest contract value, longest sale, most
   integration work, and the buyer is not a licensee — so the boundary does not
   move for them (see `Audience` = `corporate_sponsor`).
4. **Cross-border tax advisers and wealth managers.** The underrated wedge: the
   presence tracker *is* their tool, day-counting across jurisdictions is a real
   recurring pain, and it is `assessment`-class throughout — **it needs no
   counsel gate to be sellable.** That makes it the only paid line in this list
   not blocked by section 6.
5. **University international offices.** Institutional budget, underserved, and
   the study-to-work timing question is genuinely hard.
6. **Individual migrants.** The largest audience, rarely a direct payer, and the
   reason the free tier exists.
7. **Legal-aid and NGO clinics.** Free, permanently. See section 4.

[PERSONAS.md](PERSONAS.md) works each of these through in detail, including what
Meridian cannot do for them today.

---

## 6. Counsel review is the binding constraint on revenue

This is the section to read if you read nothing else.

**Zero of 49 pathways in the shipped catalog are counsel-reviewed.** Every record
carries `reviewStatus: 'unreviewed'`. Verify it yourself:

```
$ node -e "import('./packages/pathways/dist/index.js').then(m => {
    const c = m.MERIDIAN_PATHWAY_CATALOG;
    console.log(c.length, c.filter(p => p.reviewStatus === 'counsel_reviewed').length);
  })"
49 0
```

`recommend()` in `packages/pathways/src/recommend.ts` applies **two** gates, and
they are independent:

- **Gate one, the catalog gate.** A pathway that is not `counsel_reviewed` never
  enters a ranking. It is pushed to `excluded` with code `not_counsel_reviewed`
  and a reason, rather than silently dropped.
- **Gate two, the release gate.** `canRelease` decides whether the resulting
  `advice`-class value may reach the audience.

Today gate one empties the ranking before gate two is ever consulted. `recommend()`
returns an empty `ranked` array and 49 exclusions — **for every audience,
including a licensed practitioner.** A firm that bought a Professional tier this
afternoon would receive nothing from the ranking function that the anonymous
visitor does not already get for free.

### Say it plainly

**Counsel review is not a compliance chore that runs alongside the roadmap. It
is the revenue gate, and it is the only thing behind it.**

Consider what does *not* move it:

- Shipping features does not move it. The Professional tier is undeliverable
  with a perfect product.
- Adding pathways does not move it — a fiftieth unreviewed record adds a
  fiftieth exclusion.
- Engineering cannot move it. There is no constant to flip; sign-off is a
  workflow step with a named licensed human attached to each record.
- Selling harder does not move it. The thing being sold does not function.

Three further properties make this a commercial fact rather than a legal one:

**It unlocks incrementally, per record and per jurisdiction.** The first sellable
unit is not "the catalog" but a subset — plausibly the handful of routes that one
reviewer in one jurisdiction can attest to. Revenue therefore turns on
*sequencing* the review, and the sequence is a commercial decision that has not
been made.

**It decays.** A reviewed pathway becomes `needs_reverification` when its
citations go stale or the underlying instrument changes, and that status is
treated exactly like `unreviewed` for release purposes — a stale review is not a
review. Spain repealed its investor-residency route with roughly three months'
notice; that is the tempo. Counsel review is therefore a recurring operating cost
sitting directly on the revenue line, not a one-time unlock that can be
amortised away.

**Its cost scales with jurisdictional coverage, and coverage is where the market
is.** The atlas lists 249 jurisdictions; two are encoded (ES, CA) and zero are
counsel-reviewed (`node scripts/atlas-coverage.mjs`). Every new jurisdiction
needs its own reviewer with its own licence. Whether that cost stays below the
revenue it unlocks is an open question and section 7 treats it as a live failure
mode.

Nothing in this repository is counsel-reviewed either — including
[REGULATORY_POSTURE.md](REGULATORY_POSTURE.md), which says so about itself in its
first paragraphs. The reading of IRPA s.91 and of Spanish reserved-activity rules
that this entire model is built on is *our* reading, by engineers, from public
sources.

---

## 7. What would make this model fail

Written adversarially and on purpose. A commercial document that lists only
upside is a pitch deck, and this is not one.

### The confident competitor converts better

Meridian's engine is three-valued. It returns `indeterminate` when the recorded
facts do not decide the question and `requires_human_review` when a criterion
needs a person. It refuses to estimate a chance of success — a prediction of
outcome is the most heavily regulated thing an unlicensed adviser can say, and
the number would be fabricated besides, since no authority publishes the data.

A competitor that says "**You qualify! 87% match**" will convert better. Almost
certainly, and possibly by a lot. Confidence is legible and caveats are not, and
a person in a frightening situation is looking for reassurance rather than for
epistemics.

The honest position is that we have no strong counter to this. The available
answers are weak ones: that the reassurance is false and will eventually be
discovered to be false; that professionals — the actual buyers — are the segment
most able to tell a real assessment from a confident one; and that a fabricated
percentage is a liability the competitor is carrying, not an asset. All three
may be true and still lose on a landing-page A/B test.

What must not happen is the drift: adding "confidence" language that means
nothing, or a soft ranking that is not called a ranking, to close the gap. A sort
order is a recommendation. That is not a stylistic view — it is the operative
rule in `REGULATORY_POSTURE.md` and it is enforced down to the order of the
catalog array.

### The free tier may never convert

The structural problem is that the free user and the paying buyer are **different
people**. The free tier serves persona 6, the individual migrant. The core paid
tier is bought by persona 1, the immigration lawyer. Volume in the first does not
mechanically produce revenue in the second; the assumed bridge is that migrants
recommend the tool to their representative, or that representatives find it
because their clients arrive holding its output. That bridge is an assumption
with zero evidence behind it.

If it does not hold, the free tier is a cost centre that produces credibility and
nothing else. Note that section 2 argues the free tier is justified *even then* —
but "justified" and "generates revenue" are different claims, and conflating them
is how a company runs out of money while feeling principled.

The failure is worse if the honest version compounds it: the free tier is
deliberately built to be complete in itself. Nobody hits a wall, so nobody is
pushed anywhere. That is the right design and it is also the design least likely
to convert.

### The professional buyer may not exist in the volume assumed

Every quantitative claim available here is unknown, and the unknowns are load-bearing:

- How many 1–10-person immigration firms exist in ES and CA, and what share
  would buy software beyond their existing practice-management system.
- Whether they will pay for a rules engine at all, when the rules currently live
  in a partner's head and the head is already paid for.
- Whether the switching cost from an established practice-management suite is
  survivable for a product that does not do time-tracking, billing, trust
  accounting, or conflicts checking — none of which is in this repository.
- Whether a firm will trust a catalog reviewed by *someone else's* counsel, or
  will insist on reviewing it themselves, which would collapse the value
  proposition into a piece of software they must first do the hard part of.

That last one is the sharpest. Meridian's differentiator is a counsel-reviewed
catalog. Its buyer is counsel. There is a real possibility that the segment best
able to appreciate the catalog is the segment least willing to rely on it.

### Four more, briefly

**Counsel review may cost more than it unlocks.** Per-jurisdiction, per-record,
recurring, and performed by exactly the professionals whose hourly rates make
this market attractive in the first place.

**Our reading of the boundary may be wrong.** If a regulator treats
`assessment`-class output — the user's facts measured against a rule — as
reserved activity, the free tier becomes unlawful rather than free, and the model
inverts overnight. `REGULATORY_POSTURE.md` records this as our reading and rates
its own confidence; that is not the same as being right.

**The code is public and copyable.** AGPL-3.0 keeps derivatives open, which is a
real constraint on a commercial fork, but nothing stops a well-funded incumbent
from reading the architecture and reimplementing it. The moat is not the source.
It is the reviewed catalog and the accountable representative — and neither of
those is in the repository, because neither is code.

**The highest-value segment is the least ready.** Corporate mobility (persona 3)
carries the largest contracts and needs SSO, cohort handling, HRIS integration,
data-residency answers, an SLA and a security review. None exists. Selling there
first would mean signing commitments the product cannot meet.

---

## 8. Things this posture will not do

Recorded in the style of AGENTS.md's refusals, so nobody has to relitigate them.

- **No gated results.** If it can be computed, it renders. No email wall, no
  blur, no "unlock your result".
- **No invented social proof.** No testimonials, no customer logos, no "trusted
  by N firms", no user counts, no case studies. Meridian has zero customers and
  says so.
- **No manufactured urgency.** No countdown timers, no fake scarcity, no "3
  people are viewing this".
- **No invented prices.** Where a tier is not priced, the tier is described by
  what it includes and the absence of a price is stated.
- **No chance-of-success estimate, at any price.** It is a prediction of outcome,
  it is regulated, and it would be fabricated.
- **No advice sold to an unrepresented applicant.** Payment is the aggravating
  fact under s.91, not the licence.
- **No status claim that outruns the code.** The landing site counts the catalog
  at build time rather than quoting a number someone typed, and the counsel
  figure it prints is currently zero.

---

## 9. Why there are no prices in this document

Because they are not decided, and writing an undecided number down turns it into
a decided one the moment somebody quotes it.

The rule for every surface: present the tier and what it includes, and say that
pricing is not set. Do not write a currency amount that has not been decided by
someone with the authority to decide it. When prices are set, they belong in the
private repository first — see the boundary note — and on the site second.

---

## 10. Verifying every factual claim in this document

Nothing here should be believed because it is written down. The commands:

```bash
cd /path/to/meridian

# Catalog size and review status — the numbers in section 6
node -e "import('./packages/pathways/dist/index.js').then(m => {
  const c = m.MERIDIAN_PATHWAY_CATALOG;
  console.log('pathways', c.length,
              'counsel_reviewed', c.filter(p => p.reviewStatus === 'counsel_reviewed').length);
})"

# Jurisdictional coverage — section 6's 249 / 2 / 0
node scripts/atlas-coverage.mjs

# The free tools make no network calls — section 2
grep -rn "fetch(" apps/web apps/landing --include="*.ts" --include="*.tsx"

# No alerting or scheduling subsystem exists — section 3 (expect no output)
grep -rnwiE "cron|scheduler|setInterval|notify|sendEmail" \
  packages/*/src apps/api/src apps/web/lib apps/admin/lib --include="*.ts"

# The gate itself
sed -n '144,183p' packages/core/src/disclosure.ts

# The policy guards
node scripts/check-advice-boundary.mjs
node scripts/check-no-credential-custody.mjs
node scripts/check-pathway-citations.mjs
node scripts/check-workspace-manifests.mjs
```

If a claim in this document stops matching what those commands print, the
document is wrong and should be corrected rather than explained.
