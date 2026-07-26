# Counsel Review Packet — Meridian Pathway Catalog

> **Boundary note (Lane C, public-safe).** This packet is public-safe: it
> describes the review task, the artefact under review, and the questions we
> need answered. Engagement letters, fee arrangements, reviewer correspondence
> and completed review evidence are private and live in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (`legal/`). Do not commit counsel correspondence to this repository.

Prepared: 2026-07-25. **Revised 2026-07-26**, when the catalog went from two
jurisdictions to three: 35 United States records were added, taking it from 49
pathways to 84. Figures below were derived by counting the catalog, not from any
summary; the method is recorded in
[Appendix A](#appendix-a--how-every-figure-in-this-packet-was-derived).

**What changed on 2026-07-26, in one paragraph.** Four new source modules
(`us-family.ts`, `us-employment.ts`, `us-nonimmigrant.ts`, `us-status-bars.ts`)
added 35 United States pathways, 177 distinct citations and 188 criteria. The
catalog grew by 71%. Nothing in it became reviewed. The United States block needs
its own reading and gets its own section — [§9, United States](#united-states) —
because it escalates to a human far more often than either other jurisdiction,
for a structural reason set out there. Everything said in this packet about
Spain and Canada on 2026-07-25 still stands; the figures around it moved.

Companion documents: [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md) holds the
item-by-item checklist and the staleness protocol. This packet is the framing —
what you are being asked to do, what the artefact is, what turns on your
signature, and where we most need your judgement. Read this first, then work
from that checklist. The two research briefs the encoders worked from are
[`research/2026-07-25-spain-reglamento-2025.md`](research/2026-07-25-spain-reglamento-2025.md)
and [`research/2026-07-26-us-immigration-frame.md`](research/2026-07-26-us-immigration-frame.md);
each has a section on what its author could **not** establish, and reading that
section is the fastest way to find where the catalog is thinnest.

---

## 1. The single most important fact

**No pathway in this catalog has been reviewed by anyone qualified. All 84
records carry `reviewStatus: 'unreviewed'`.**

That is not a gap awaiting a deadline. It is the system's live state, and the
software is built so that state has teeth: `recommend()` refuses to rank an
unreviewed pathway and returns it in an `excluded` list with the code
`not_counsel_reviewed`. Today that function returns an empty ranking and 84
exclusions. Nothing in the product recommends anything to anyone.

The number moved from 49 to 84 on 2026-07-26 and the fact did not move at all.
That is worth stating plainly, because it is the whole argument: adding a
jurisdiction does not approach the gate, it moves the gate further away. An
eighty-fifth unreviewed record would add an eighty-fifth exclusion.

We are asking you to change that for a subset of records, deliberately, one
record at a time, with your identifier attached to each.

---

## 2. What you are being asked to attest to

For each pathway you review, you are confirming a set of claims **about law**:

1. Each cited instrument exists, is named as it is actually cited in that
   jurisdiction, and the pin-cite is correct.
2. The cited text is in force, in the consolidated version, on the date you read
   it — or, where it is not, that the record says so.
3. Each encoded criterion expresses the rule it claims to express, including the
   direction and the boundary of any comparison.
4. Each criterion's `weight` is right — in particular, that nothing marked
   `blocking` is really a discretionary or evidential matter.
5. The `discretionary` flag is set on every citation resting on administrative
   practice, screening criteria or published operational guidance rather than
   statutory text — and is *not* set where the rule is a bright line.
6. What the record deliberately omits is safe to omit, and the omission is
   disclosed rather than silent.
7. The bilingual label and guidance say the same thing in English and Spanish,
   and the guidance is a neutral restatement rather than a recommendation.

## What you are **not** being asked to attest to

This matters as much as the list above, and we would rather over-state it.

- **You are not certifying the software.** You are not opining on the evaluator,
  the date arithmetic, the API, the disclosure gate, the infrastructure, or
  whether any of it computes what the record says. Those are engineering
  concerns with their own tests and guards. If you find an engineering defect,
  tell us — but signing a pathway is not a statement that the code is correct.
- **You are not opining on any individual's matter.** The catalog is a
  restatement of published rules. No applicant's facts are in front of you, and
  a reviewed pathway creates no relationship with any user of the platform.
- **You are not predicting outcomes.** Nothing in this system estimates a chance
  of success, and we will not add one. `eligible` in this engine means "meets
  the criteria as encoded", never "will be granted".
- **You are not warranting completeness of the jurisdiction.** Reviewing
  `es-arraigo-social` says that record is right. It says nothing about the
  routes we have not encoded, and Section 10 lists the ones we know are missing.
- **You are not adopting our omissions as advice to a user.** Where we have left
  something out, we want you to tell us whether the omission is safe. That is a
  question to you, not a position we are asking you to endorse.

---

## 3. The artefact, in numbers

Verified on 2026-07-26 by loading the built catalog and counting.

| | | Spain | Canada | United States |
|---|---|---|---|---|
| Pathway records in `packages/pathways/src/catalog/` | **84** | 26 | 23 | 35 |
| Of those, exported through `MERIDIAN_PATHWAY_CATALOG` and reachable by the engine | **84** — all | 26 | 23 | 35 |
| **Reviewed by counsel** | **0** | **0** | **0** | **0** |
| Status as recorded | 77 `open`, 5 `closed`, 2 `suspended` | 23 / 3 / 0 | 19 / 2 / 2 | 35 / 0 / 0 |
| Eligibility criteria | **449** | 140 | 121 | 188 |
| Criterion weights | 291 `blocking`, 109 `material`, 49 `informational` | 92 / 31 / 17 | 91 / 19 / 11 | 108 / 59 / 21 |
| Criteria escalated unconditionally (`requiresHumanReview`) | **154** | 21 | 44 | 89 |
| Criteria escalated conditionally (`humanReviewWhen`) | **67** | 5 | 17 | 45 |
| Pathways carrying at least one unconditional escalation | **62 of 84** | 13 of 26 | 19 of 23 | 30 of 35 |
| Distinct citations | **373** | 96 | 100 | 177 |
| Of those, marked `discretionary` | **82** | 21 | 26 | 35 |
| Of those, carrying a URL | **346** (27 deliberately carry none) | 86 | 91 | 169 |
| Of those, `kind: 'statute'` | **130** | 23 | 11 | 96 |
| `verifiedOn` | two dates | 2026-07-25 | 2026-07-25 | 2026-07-26 |
| Pathways publishing a processing-time estimate | **0** | 0 | 0 | 0 |
| `leadsTo` edges between pathways | 63, none dangling | — | — | — |

Citations across the whole catalog by kind: 170 regulation, 130 statute,
57 official guidance, 8 treaty, 5 policy, 3 case law.

Four figures deserve a sentence each, because they are the ones most likely to be
misread.

**All 84 are reachable, and the catalog's order means nothing.**
`packages/pathways/src/catalog/index.ts` assembles `MERIDIAN_PATHWAY_CATALOG` by
concatenating the thirteen source modules in a written-out, append-stable order.
That order is deliberately arbitrary with respect to merit: a list whose order
changed with the applicant's facts, or which ranked routes by anything
substantive, would be a ranking, and a ranking is advice. Do not read the
position of a record in any output as a statement about it. In particular, the
United States block is last because it was added last and appending never
renumbers what came before — **not** because that corridor is small. Mexico to
the United States is the largest bilateral migration corridor in the world.

**62 of 84 can only ever say "a person must look at this".** A criterion marked
`requiresHumanReview` escalates the whole report, ahead of every other rule in
the verdict order except closure. Those records therefore return
`requires_human_review` whenever they are **open**, for every applicant, no
matter how strong the facts. That is a deliberate design answer to a real
problem — see Section 6 — and it is one of the things we most want you to agree
with or push back on.

**The closure exception is why 62 and 56 are both true.** Of those 62 records,
six are `closed` or `suspended`, and closure outranks escalation, so they return
`ineligible` rather than `requires_human_review`. Behaviourally, 56 records
return `requires_human_review` for every fact set we tested. Both numbers are in
this packet on purpose; neither is a correction of the other.

**The United States block is where the escalation design shows most**, and the
reason is structural rather than editorial: 89 of the 154 unconditional
escalations are in it, and 30 of its 35 records carry at least one. See
[§9, United States](#united-states).

**`kind: 'statute'` is 96 of the 177 United States citations, against 23 of 96
for Spain and 11 of 100 for Canada.** The United States block is the first that
is statute-led, because 8 U.S.C. carries thresholds that the Spanish and
Canadian systems leave to a *reglamento* or to a ministerial instruction. A
reviewer used to reading Spanish or Canadian records will find the centre of
gravity has moved.

---

## 4. How to read a Pathway record

A pathway is **data, not code**. It is a JSON-shaped record validated by a
schema, which is the whole point: a rule written as a function cannot be diffed
in a pull request, exported for you to sign off on, or re-run against last
year's version to explain a decision made last year. You should be able to read
every legal claim in this system without reading any TypeScript.

The fields, in the order they matter to you:

| Field | What it means for review |
|---|---|
| `id` | Stable slug, `xx-slug`. Never reused for a different route. |
| `version` | Semver of the **rule content**, not of the software. Bumped on any legal change, including your review. |
| `jurisdiction` | ISO 3166-1 alpha-2. Two Canadian files deviate to ISO 3166-2 (`CA-QC`, `CA-NB`) — see Section 8, question CA-8. |
| `name`, `summary` | Bilingual. The summary is where a route's scope and its known non-coverage are stated in prose. |
| `kind` | One of five: residence permit, work permit, naturalisation, permanent residence, entry facilitation. A coarse bucket; the engine does not branch on it. |
| `status` | `open`, `closed` or `suspended`. `closed` means intake has ended, **not** that the route is irrelevant — people hold status under closed routes for years and ask about renewal. |
| `openedOn` / `closedOn` | Make the record answerable about the past. `closedOn` is **the first day applications were no longer accepted**, so a rule reading "applications accepted until 30 June" is recorded as `closedOn: '2026-07-01'`. This off-by-one is a recurring review point. |
| `closureNote` | Required when closed. What a current holder needs to know. |
| `citations` | Every instrument this record rests on. See Section 7. |
| `criteria` | The rules. See Section 5. |
| `durations` | Grant length, renewal, and whether the time counts toward naturalisation. Sparse on purpose. |
| `leadsTo` | Ids of routes this one bridges to. A claimed bridge that does not exist in law is a defect. |
| `reviewStatus` | `unreviewed` today, on every record. |

Two conventions in `durations` are worth knowing before you read one:

- **`publishedProcessingDays` is populated on zero records**, and should stay
  that way unless an authority published a service standard and we cite them. An
  applicant who books a flight against an invented number pays for the
  invention.
- **`countsTowardNaturalisation` is left unset on 43 of 84 records** (21 `true`,
  20 `false`, 43 unset). Unset means "we did not establish this", which is
  different from `false`. Where the answer turns on an instrument the record does
  not otherwise cite, the encoder left it absent rather than guessing. Confirming
  or filling these is genuine review value.
- **On the United States records, `durations.note` carries more weight than its
  name suggests.** It is where the structure of a numerical limit lives, and on
  the three immediate-relative records it is where the *absence* of a queue is
  explained. Read those notes as part of the rule, not as commentary.

---

## 5. How to read a Criterion

Here is a real one, from `es-nationality-residence-general`:

```ts
{
  id: 'es-nat-gen-ten-years-continuous-residence',
  kind: 'residence',
  weight: 'blocking',
  citationIds: ['es-cc-art-22-1', 'es-cc-art-22-3'],
  label: {
    en: 'Ten years of legal residence, continuous and immediately prior to the application',
    es: 'Diez años de residencia legal, continuada e inmediatamente anterior a la solicitud',
  },
  evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 10 },
}
```

Read it as five separate claims, each independently checkable:

1. **`citationIds`** — the sources. Each must resolve to a citation carried on
   the same pathway; a dangling reference fails CI. Here: Código Civil arts. 22.1
   and 22.3.
2. **`label`** — what we tell the applicant this rule is, in both languages. A
   criterion that reads as a bright line in English and as a soft factor in
   Spanish is a defect.
3. **`evaluator`** — the machine-readable test, written as data. This one says:
   take the date at `derived.continuousLegalResidenceSince`, and ask whether ten
   years have *completed* by the assessment date. Compare that against art. 22.3
   and tell us whether the comparison, the direction and the boundary are right.
   The operators are a small closed set (`gte`, `lte`, `one_of`, `date_before`,
   `duration_since_at_least`, `all_of`, `any_of`, `not`, and a handful more) and
   each is documented in `packages/pathways/src/schema.ts`.
4. **`weight`** — see below.
5. **`guidance`** (absent here, present on most) — bilingual prose shown next to
   the result. It must be `information`-class: a neutral restatement of the rule
   and of what the engine did or did not check. No "you should", no "the best
   option is". It is also where every deliberate omission is disclosed, so it is
   often the most legally interesting field on the record.

### Weight — what a failure does

| Weight | Effect of failing it | Count |
|---|---|---|
| `blocking` | Verdict becomes `ineligible`. | 291 |
| `material` | Caps the verdict at `indeterminate`. **Can never on its own produce a "no".** | 109 |
| `informational` | Never affects the verdict; shown to the reader. | 49 |

The `material` tier exists because "likely to be refused on discretionary
grounds" is a prediction, and predictions are advice. Where an encoder judged
that the available facts cannot support a refusal — for instance a
criminal-record test that keys on nationality where the rule keys on countries
of residence — they used `material` so the engine can hold back a yes without
ever issuing a no. **Miscategorising a `material` criterion as `blocking`
produces false refusals**, which is the failure mode with the highest human cost
in this system. It is checklist item 7 in
[LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md).

### Escalation — `requiresHumanReview` and `humanReviewWhen`

- `requiresHumanReview: true` — this criterion can never be decided by software.
  **154 criteria carry it** (21 Spanish, 44 Canadian, 89 United States).
- `humanReviewWhen: <spec>` — conditional. Escalates only when the question
  actually arises. **67 criteria carry it** (5, 17, 45).

The United States files use one conditional idiom heavily enough that it is worth
naming before you meet it: a criterion whose `humanReviewWhen` is **deep-equal to
its `evaluator`** escalates precisely when it would otherwise pass. A definite
failure still reads as a failure; no pass is ever asserted. That is the shape of
`us-h1b-specialty-occupation`, `us-l1a-managerial-or-executive-capacity`,
`us-l1b-specialized-knowledge-capacity`, `us-eb1b-qualifying-job-offer` and
several others. **The mirror image of it — escalating on failure and green-ticking
on success — would be invisible in a passing test suite and catastrophic in a
report**, so confirming the direction on each is worth the minute it takes.

Escalation outranks everything except closure in the verdict order, so one
escalated criterion makes the whole report `requires_human_review`. That is
intentional: the flag does not mean "this one point is uncertain", it means the
automated evaluation of this route is not trustworthy for this applicant, and
issuing *any* verdict — including a negative one — would be dressing a guess as
a finding.

### Three-valued logic, and why "unknown" is not "no"

Every test resolves to true, false, or **unknown**, combined under Kleene's
strong three-valued logic. A conjunction is false as soon as one conjunct is
false, but merely *unknown* while a conjunct is unrecorded. So a half-completed
profile produces `indeterminate`, never `ineligible`. When you read a criterion,
ask what it does when the fact is simply absent — an engine that treated silence
as failure would tell people they do not qualify for routes they do qualify for.

---

## 6. The design decision we most want you to rule on

Ten encoders across two sweeps — six of the nine catalog files on 2026-07-25,
all four United States files on 2026-07-26 — converged independently on the same
answer to the same problem. You should decide whether it is the right one.

**The problem.** Meridian's fact model, `ApplicantFacts`, describes *one
person*. A large share of migration law does not: sponsorship turns on the
sponsor, family routes turn on a relationship, provincial routes turn on a
nomination, arraigo turns on physical presence rather than lawful residence, and
several thresholds are denominated in units the model cannot express (hours of
work, months of absence, per-ability language scores, funds as a balance rather
than a stream).

**The United States block hits this harder than anything before it**, which is
why 30 of its 35 records escalate unconditionally. United States family and
employment routes are at least half a test about somebody who is not the
applicant — a petitioner's citizenship, a sponsor's income and household size, a
sponsor's domicile, an employer's corporate relationship to a foreign affiliate,
the state of a labor certification — and the fact model holds none of them. Nor
does it hold the **manner of somebody's last entry**, which is the single fact
that most often decides a Mexican case: `currentStatus: 'irregular'` is not a
proxy for it, because an overstayer after a lawful admission is irregular now and
*was* admitted, and the § 1255(c)(2) immediate-relative exception reaches that
person while it does not reach somebody who entered without inspection. Getting
that backwards is the difference between a filing fee and a decade.

**The answer taken.** Rather than point a criterion at a fact path that means
something adjacent-but-different, the encoders marked those criteria
`requiresHumanReview: true`, wrote a `humanReviewReason` naming the exact missing
fact, and said in the bilingual guidance what the engine did and did not read.

**The consequence.** 62 of 84 records carry an unconditional escalation, and the
56 of them that are open can only return `requires_human_review`. Every Spanish
arraigo figure, every Spanish family route, all four Canadian provincial and
Quebec routes, all nine Canadian family and pilot routes, every Canadian
temporary-residence route in `ca-work-study.ts`, and 30 of the 35 United States
records behave this way, for every applicant.

**Five United States records can reach a verdict**, and the split is instructive:
`us-tn-usmca-professional` and `us-b1-b2-visitor` can return `eligible` or
`ineligible`, because they turn on the applicant's own facts;
`us-h1b-specialty-occupation`, `us-l1a-intracompany-manager-executive` and
`us-l1b-specialized-knowledge` can return `ineligible` but never `eligible`,
because specialty occupation, managerial capacity and specialized knowledge are
characterisations an adjudicator makes.

**Why we think it is right.** The alternative — say, measuring "two years of
physical presence" against a field documented as *legal* residence — would
produce a confident green tick derived from a rule nobody applied. Worse, in the
Spanish case, the same field feeds the naturalisation pathways, so a caller who
stuffed presence into it to make arraigo work would then be told they had two
years of *legal* residence toward Spanish nationality.

**What is not lost.** The per-criterion results still resolve. A partner under
18 still reads as unmet; `blockingFailures` still populates; the citations and
guidance still render. Only the top-line verdict is withheld.

**The question for you.** Is withholding the verdict the right professional
answer, or does it make the product useless in a way that will pressure someone
to weaken it later? If you think it should be narrowed, tell us which
escalations you would retire and on what basis. Each one names the fact it is
waiting for, so they can be retired individually as the fact model grows.

---

## 7. Citations, `verifiedOn`, and staleness

Every applied rule carries at least one `Citation`:

```ts
{ id, kind, instrument, provision?, url?, jurisdiction, verifiedOn, discretionary?, note? }
```

- **Where they live.** On the pathway record itself, in its `citations` array.
  Criteria reference them by id. A criterion with no citation, or one pointing at
  an id the pathway does not carry, fails CI.
- **`verifiedOn` is a claim about a human.** It means a person opened that source
  and read the cited text on that date. It is not a build timestamp and it is not
  automatically refreshed. **The catalog now carries two dates**: 196 Spanish and
  Canadian citations read `2026-07-25`, and 177 United States citations read
  `2026-07-26`. Nothing was re-read on the later date that had been read on the
  earlier one, and moving the first set forward to tidy the table would be
  exactly the falsification this field exists to prevent.
- **`url` is present on 346 of 373 citations and absent on 27, deliberately.**
  Where the encoder could not reach a canonical source, they omitted the link
  rather than guessing one, because a dead or wrong link teaches the reader to
  stop checking. The Spanish and Canadian absences are concentrated in Quebec
  instruments and the Canada–Québec Accord (the publishing sites refused
  automated access) and in one Spanish closing date. **Eight of the 27 are United
  States citations** and each names its reason: `travel.state.gov` refused
  automated retrieval, so both Visa Bulletin citations carry no link and instead
  tell the reader to open the current bulletin by hand; `federalregister.gov`
  served its API but refused its HTML, so the three Federal Register citations
  carry document number, publication date and effective date without a URL; and
  `fam.state.gov`'s certificate chain did not verify, so the two 9 FAM citations
  and *Matter of Arrabally and Yerrabelly* carry none. **Nothing in the catalog
  rests solely on a proposition from a source that could not be retrieved**,
  except where the citation's own note says it does. Supplying a confirmed
  canonical URL during review is a genuine improvement to the artefact.
- **`kind` is a legal distinction, not a taxonomy.** `official_guidance` versus
  `regulation` is the difference between "the department currently does" and
  "the law says". 57 citations are `official_guidance`; each is a place where
  the number in the catalog is the administration's published practice.

### Staleness bands

Computed by `staleness()` in `packages/core/src/citation.ts`.

| Band | Age since `verifiedOn` | Meaning |
|---|---|---|
| `fresh` | ≤ 90 days | Usable without comment |
| `aging` | 91–180 days | Usable; flagged in the admin console |
| `stale` | > 180 days | Not to be silently trusted; **CI fails** |

Because the catalog has two verification dates it has two sets of bands, and the
build therefore goes red in two steps:

| Citations | `verifiedOn` | `fresh` through | `aging` through | `stale` from |
|---|---|---|---|---|
| 196 Spanish and Canadian | 2026-07-25 | 2026-10-23 | 2027-01-21 | **2027-01-22** |
| 177 United States | 2026-07-26 | 2026-10-24 | 2027-01-22 | **2027-01-23** |

The bands are Meridian's operational choice, recorded as such, not a legal
requirement. The reason they are short is tempo: Spain repealed its
investor-residency route with roughly three months' notice; one instrument in
this catalog was amended four months ago in a way that removed a federal review
step (Canada, `SOR/2026-63`); and the United States replaces duration of status
for F, J and I admissions on 2026-09-15 under a rule published eight weeks
earlier.

**One record has a deadline earlier than any staleness band.**
`us-f1-academic-student` must be re-verified on **2026-09-15**, when 91 FR 44976
takes effect, regardless of which band its citations are in. Duration of status
is what stops unlawful presence accruing before a formal violation finding, so
this is not a cosmetic change.

**Do not refresh a `verifiedOn` for a source you did not open.** It is the single
action that quietly destroys the value of the whole mechanism, and nothing
downstream can detect it. If a citation goes stale and nobody is available to
re-read it, leave it stale and let the build fail — a failing check that tells
the truth is worth more than a passing one that does not.

---

## 8. The `discretionary` flag, and why it carries legal weight

`discretionary: true` marks a citation whose rule is **administrative practice,
a screening criterion, published operational guidance, or case-law-derived** —
rather than a bright-line statutory threshold. **82 of 373 citations carry it**:
21 Spanish, 26 Canadian, 35 United States.

Consumers of the engine are required to surface it. A note is attached to the
report (`code: 'discretionary_source'`) whenever a criterion leans on such a
citation, so the number reaches the applicant labelled as practice rather than
as law.

**The dangerous direction is absent-where-it-should-be-present.** A discretionary
criterion presented as settled law is precisely the failure this product exists
to prevent: it tells someone a threshold is fixed when an official may move it,
and they plan around it. Set-where-it-should-not-be merely adds noise.

Two worked examples of the standard expected, both already in the tree:

- Canada's **67-point Federal Skilled Worker pass mark** is not in the
  Regulations. IRPR s. 76(2) requires the Minister to fix and publish a minimum;
  the number appears only on IRCC's published page. It is therefore a separate
  citation, `kind: 'official_guidance'`, `discretionary: true`. The same
  treatment is applied to the CLB language thresholds for both federal economic
  classes, and to the 1,560-hour work figure, which is IRCC's published
  operational equivalence (30 × 52) rather than regulatory text.
- Spain's **`arraigo` continuity and reporting criteria** rest substantially on
  the ministry's *Instrucciones SEM 1/2025* rather than on the Reglamento. Those
  are flagged, and the encoder recorded which limb of each rule is the
  discretionary part in the citation `note`.
- The United States block flags both **Visa Bulletin** citations, *Matter of
  Dhanasar*, and every **USCIS Policy Manual** citation. The bulletin is the
  clearest case in the whole catalog: an administrative publication re-issued
  monthly whose own text warns that a date may retrogress. Its note records that
  **no figure from it is recorded anywhere in this catalog** — no priority date,
  no cut-off date, no queue position, no wait estimate. A test asserts that no
  string in the United States block matches the bulletin's own date format.

For each flagged citation, confirm the flag **in both directions**, and confirm
the `note` says *which part* is discretionary rather than merely that something
is.

On the United States records, expect the flag on anything resting on adjudicator
judgement rather than a statutory threshold, and there is a great deal of it:
extraordinary ability, exceptional ability, the national interest, specialty
occupation, managerial and executive capacity, specialized knowledge,
substantiality of trade and of investment, the public charge ground, good moral
character, and the whole of the § 1182(a)(9) analysis. **Where the flag is
present the criterion should also escalate. A discretionary citation on a
criterion that green-ticks is the combination to look for.**

---

## 9. What we most need answered

These are the specific points where an encoder made a judgement, disclosed it,
and asked for a lawyer. They are ordered by how much harm a wrong answer does.
Every one is also stated in the file it belongs to.

### Spain

**ES-1 — Arraigo and physical presence.** `ApplicantFacts.residencePeriods` is
documented as *legal* residence; arraigo applicants by construction have none.
The two-year presence test is therefore escalated rather than measured, and its
evaluator instead reports recorded absences against the ministry's 90-day
tolerance (`derived.absenceDaysTotal`), with guidance saying the engine does not
slice the two-year window. Is that the right disclosure, and is the 90-day
figure correctly attributed to *Instrucciones SEM 1/2025* primera.2 rather than
to the Reglamento?

**ES-2 — `es-arraigo-extraordinario` closes on 2026-07-01.** DA 21.6 of
RD 1155/2024 reads *"podrá ser solicitada hasta el 30 de junio de 2026"*. We read
*hasta* as inclusive, and `closedOn` is the first unavailable day, so the record
says 2026-07-01. Confirm the inclusivity.

**ES-3 — Art. 126.h and the meaning of "estancia".** Every arraigo record
encodes the first limb of art. 126.h as: current status is not one of
resident / permanent resident / worker / student / citizen. `'visitor'` is
deliberately excluded from that list, on the reading that a tourist in a
visa-free short stay holds no *autorización de estancia* whereas a student on an
*estancia por estudios* does. That reading is defensible and it is a reading.
The second limb — being an interested party in a pending procedure — is not
evaluated at all, and each guidance block says so.

**ES-4 — Criminal record: nationality versus countries of residence.** Following
the existing pattern in `es.ts`, the arraigo records check the certificate
against the country of `claimedNationality`. Art. 126.d is about countries of
residence in the five years before entering Spain, and art. 130.2 both obtains
the Spanish record ex officio and waives the third-country certificate for
someone continuously in Spain for five years. All three points are in the
guidance and the criterion under-claims on purpose. Is under-claiming here safe?

**ES-5 — `es-arr-soc-means` reads the applicant's own income.** The criterion
reads `derived.passiveIncomeIpremMultiple` — the applicant's own non-employment
income — while art. 127.c expressly allows the means to come from the qualifying
relative. A compliant applicant relying on a spouse's income reads as unmet. It
is weighted `material` so it can never produce `ineligible`, and the guidance
says so in both languages. Is that mitigation sufficient?

**ES-6 — Long-term residence absences are described, not measured.** Arts. 176.a)
and 183.2 are denominated in months (six consecutive, ten in total, eighteen for
work-related absences); the fact model carries days. Six consecutive calendar
months is between 181 and 184 days depending on which months, so no threshold
could be picked without presenting our arithmetic as Spain's. The limits are
stated in full in bilingual guidance on the five-year criterion, with an explicit
sentence that the engine counts days and does not convert. This is the omission
the encoder most wanted challenged.

**ES-7 — `es-student-stay` is recorded as `kind: 'residence_permit'` and is not
residence.** The schema has no kind for an *estancia*. The summary, a doc comment
and the durations note all say so, and `countsTowardNaturalisation` is left
unset rather than guessed. Confirm both the labelling and the unset value.

**ES-8 — Health insurance.** The "insurer authorised to operate in Spain" limb is
present in art. 35.i) (study stay) and Ley 14/2013 art. 62.3.e) (entrepreneur)
and is encoded on both — blocking for the student, material for the entrepreneur
because that article also admits public cover, which the fact model cannot
express. Art. 176.c) for long-term residence-EU says only *"Contar con un seguro
de enfermedad"*, so that criterion tests private cover alone, weighted material,
with guidance stating that Social Security cover satisfies the article and will
nevertheless read as unmet.

**ES-9 — The entrepreneur route is encoded as open on the strength of a
negative.** Ley 14/2013 arts. 69 and 70 survive LO 1/2025, which emptied
arts. 63–67 from 3 April 2025. The evidence is the BOE amendment history on
arts. 69 and 70, which lists LO 1/2025 on neither. That is encoded as its own
citation rather than asserted bare, and the record says in terms that this is not
the golden visa. Confirm the negative inference.

**ES-10 — The `is_present: applicantId` marker convention.** In
`es-family-nationality.ts`, where the fact model says *nothing at all* about a
criterion's subject, the evaluator is `{ op: 'is_present', path: 'applicantId' }`
— a marker, not a test, chosen because the criterion is unconditionally escalated
so the value is never used, and because the alternatives were an invented fact
path or dressing an unrelated field as evidence. The guidance states in both
languages that the engine read nothing. This is the one piece of that file that
is convention rather than law, and the encoder asked for it to be challenged.
(Other files use a comparable placeholder, typically `targetJurisdiction` equals
the country, with the same disclosure.)

**ES-11 — The least certain date in the catalog.**
`es-nationality-democratic-memory-option` carries `closedOn: '2025-10-23'`
(last day to declare, 22 October 2025). Ley 20/2022 DA 8ª fixes two years from
21 October 2022 and authorises a one-year extension but states no closing date.
The date comes from two official Spanish consular pages; the Council of Ministers
agreement of 9 July 2024 was not locatable in the BOE and the ministry press page
announcing it now returns 404. The citation is `official_guidance`,
`discretionary: true`, carries **no URL**, and its note says all of this. Please
confirm against the agreement itself.

**ES-12 — RD 240/2007 art. 2 is encoded without the annulled limbs.** STS Sala
Tercera, 1 June 2010 annulled *«otro Estado miembro»* in the opening paragraph,
*«separación legal»* in letters a), c) and d), and *«que impida la posibilidad de
dos registros simultáneos»* in letter b). **The BOE consolidated text still
displays those words.** The catalog encodes art. 2 without them and cites the
judgment. Confirm.

**ES-13 — A whole family route is missing and it is probably the common one.**
Título IV Capítulo VII of RD 1155/2024 (arts. 93–99), residence for family
members of Spanish nationals, is not encoded. For a Mexican national married to a
Spaniard that is the actual answer. Both `es-family-reunification` and
`es-eu-family-member-card` carry guidance telling such a person not to assume
either route applies. Its interaction with the 2010 annulment above is
unsettled. We would like your view on whether the current guidance is an adequate
holding position.

**ES-14 — Known defects in `es.ts`, unrepaired.** The oldest Spanish file
predates this sweep and research during it identified four probable defects that
were **not** fixed, because the file was being edited concurrently: citations to
RD 557/2011 now pointing at repealed text; an over-statement of the insurer
requirement on `es-non-lucrative-visa`; IPREM stated annually where art. 62.1 is
monthly; and the digital-nomad 20% cap. Separately,
`SPANISH_OFFICIAL_LANGUAGE_COUNTRIES` carries 19 entries where RD 1004/2015
art. 6.5 is a closed enumeration of 20 including Puerto Rico. **Please do not
review the six `es.ts` records until these are addressed** — they are logged in
Section 10 and in the CHANGELOG.

### Canada

**CA-1 — Nothing in the federal economic classes is a bright line.** Neither
`ca-federal-skilled-worker` nor `ca-federal-skilled-trades` can return `eligible`,
by construction: the evaluator on each decisive criterion is the necessary
condition that *is* checkable, and `humanReviewWhen` repeats it, so a definite
failure still reads as a failure while a possible pass escalates. Confirm this is
the right shape rather than a green tick with a caveat.

**CA-2 — No Comprehensive Ranking System number appears anywhere.** Not a
cut-off, not a maximum, not a factor value. IRPA s. 10.3 puts the ranking basis
and the rank required to be invited in ministerial instructions, and a cut-off is
a per-round outcome. Express Entry is documented as a management system in each
record's durations note, not as a pathway. Confirm the characterisation.

**CA-3 — IRPR s. 87 changed on 30 March 2026.** `SOR/2026-63` replaced
ss. 87(2)–(4). The former s. 87(3) substituted-evaluation power and the s. 87(4)
concurrence requirement are **repealed**; the province now has sole
responsibility to evaluate both economic establishment and intent to reside. Any
commentary written before that date describes federal second-guessing that no
longer exists. Confirmed three ways by the encoder (enacted text, RIAS, current
consolidation); please confirm once more, because a great deal of secondary
material is now wrong.

**CA-4 — The PEQ window is encoded as a filing-date test, not as `openedOn`.**
The Programme de l'expérience québécoise was abolished on 19 November 2025 and
reactivated for two years from 2 July 2026, with a first reception period of
2 July – 31 October 2026. `statusOn()` cannot express "open, abolished,
reopened", and setting `openedOn: 2026-07-02` would make the record lie about
2019 — so the window is a blocking `date_on_or_after` / `date_on_or_before` pair
on `applicationLodgedOn`. Whether further windows open depends on volumes, which
were not published.

**CA-5 — Two programs are `suspended`, not `closed`, and one of those decisions
is ten days old.** Parents and grandparents: intake paused 15 July 2026;
processing continues; the class in IRPR s. 117(1)(c)/(d) is untouched. Start-up
Visa: paused 30 June 2026. Confirm `suspended` is the right status for each and
that neither should be `closed`.

**CA-6 — Two closing dates turn on inclusive/exclusive wording.** The Rural and
Northern Immigration Pilot accepted applications "received on or before"
2024-08-31, so `closedOn` is **2024-09-01**. The Agri-Food Pilot's published
wording is "accepted before this date", so `closedOn` is **2025-05-14** as
published. Note also that the Agri-Food 2025 intake cap of 1,010 filled well
before the end date, so a date test alone cannot confirm an application was
accepted; that is stated in guidance rather than modelled.

**CA-7 — IRCC's program delivery instructions could not be read.** canada.ca
refused automated access throughout this sweep (HTTP 403 to fetch; browser
navigation succeeded for some agents and not others). Consequently **no** PGWP
field-of-study list, PGWP language threshold, PGWP programme-length table,
study-permit settlement-funds amount, LMIA exemption code or CUSMA "substantial
trade" percentage appears anywhere in the catalog. The statutory and regulatory
frame is encoded and cited from Justice Laws, which was reachable; the
operational figures are escalated to a person. If you have access to those
instructions, restoring the figures with proper `official_guidance` +
`discretionary` citations is the single largest improvement available to the
Canadian catalog.

**CA-8 — Two deliberate deviations from convention, both flagged in-file.**
(a) `jurisdiction` is `'CA-QC'` on Quebec instruments and `'CA-NB'` on one New
Brunswick guidance document — ISO 3166-2 where the field's doc comment says
alpha-2 — on the view that attributing the *Loi sur l'immigration au Québec* to
"CA" is worse than being one standard off. (b) The Canada–Québec Accord is typed
`kind: 'treaty'` and it is not an international treaty; it is an intergovernmental
accord made under what is now IRPA s. 8, and `'policy'` would have implied soft
law. Both are cheap to change if you disagree.

**CA-9 — A textual ambiguity in CUSMA that was not resolved.** In the published
text of Annex 16-A Section B, the phrase *"in a capacity that is supervisory,
executive or involves essential skills"* sits at the end of paragraph (b), after
the investor limb. It is not typographically clear whether it also governs the
trader limb in (a). Practitioner sources assert that it does; that could not be
verified against Canada's own measures, so `ca-cusma-trader-capacity` escalates
with the ambiguity spelled out in its guidance. This decides whether a junior
trading role is within the category at all.

**CA-10 — The CUSMA joint review is deliberately under-claimed.** Web sources
report confidently that the United States declined to extend on 1 July 2026. The
Government of Canada's own joint-review page, read on 2026-07-25, describes only
the *upcoming* review and does not report an outcome. The catalog therefore
asserts only what that page says — that CUSMA remains in force until 2036 —
attributes it to that page under its own citation, and records that the outcome
was not reported. Confirm this is the right posture.

**CA-11 — Criminal-record criteria are `material`, not `blocking`, in the new
Canadian files.** This departs from `es.ts` on purpose: the relevant provisions
have the administration obtain the Canadian certificate and the police report of
its own motion, so an applicant filing from abroad holds neither, and `blocking`
would report them ineligible for not holding a document nobody asked them for.

**CA-12 — Two readings the encoder flagged as thin.** The Federal Skilled Worker
"second official language CLB 5" line on IRCC's language page is characterised as
a *selection-points* matter rather than an eligibility minimum; that follows from
IRPR s. 79 being a points section, but s. 79 itself was not read. And the five
branches of IRPR s. 87.2(3)(d) are described in a citation note rather than
encoded as branch logic, so the criterion escalates rather than deciding which
branch applies.

**CA-13 — Nunavut runs no nominee program**, and there is no fact for the
intended province, so `ca-provincial-nominee-program` can only test the Quebec
side. The guidance says so rather than leaving a silent false negative.

### United States

Added 2026-07-26 across four files. **Read this preamble before the numbered
points.** The United States records need different handling from the Spanish and
Canadian ones, for a reason that is structural rather than a matter of care:

- **89 of the catalog's 154 unconditional escalations are here**, and 30 of the
  35 records carry at least one. `ApplicantFacts` holds nothing about a
  petitioner, nothing about a sponsor, and nothing about the manner of somebody's
  last entry — and United States family and employment law is at least half a
  test about exactly those things. The escalations are therefore not a judgement
  that the law is hard; they are the model saying it does not hold the fact.
- **The block is statute-led.** 96 of its 177 citations are `kind: 'statute'`.
  Where a Spanish record cites a *reglamento* and a Canadian one cites a
  ministerial instruction, a United States record usually cites 8 U.S.C.
  directly. Two consequences: the pin-cites are longer and more mechanical to
  check, and where a *regulation* is cited it is worth asking whether it has been
  conformed to the statute — see US-6.
- **Nothing here is quantified.** No priority date, no cut-off date, no queue
  position, no wait estimate, no probability of any discretionary grant appears
  anywhere in the 35 records. The *structure* of the numerical limits is encoded
  and cited; the numbers are not. Mexico's position is stated as "one of four
  oversubscribed chargeability areas" with no figure attached.

**US-1 — The immediate-relative / preference divide is encoded as an absence,
and that is the most consequential thing in `us-family.ts`.** The three
immediate-relative records carry **no** visa-availability criterion. The five
preference records each carry **exactly one**, weighted `material`. That
asymmetry is the encoding of § 1151(a)'s "Exclusive of aliens described in
subsection (b)" read with § 1151(b)(2)(A)(i): an immediate relative sits outside
the numerical limits, a preference beneficiary sits inside them, and on the
Mexican corridor the difference is years. Confirm the divide, and then confirm
the second half: that **no criterion keys chargeability to nationality**, because
it follows place of birth under § 1152(b). Both properties are pinned by
`tests/catalog-us-family.test.ts`, so if you disagree the test must change too.

**US-2 — Manner of last entry is absent, and § 1255(a) is the casualty.**
There is no honest adjustment-of-status criterion without it. The catalog does
**not** use `currentStatus: 'irregular'` as a proxy, and the reason is worth your
confirmation: an overstayer after a lawful admission is irregular *now* and *was*
admitted, so the § 1255(c)(2) immediate-relative exception reaches them, while it
does not reach somebody who entered without inspection. The two people look
identical in this fact model and their answers are years apart. Is escalation the
right response, or should the record refuse to render at all?

**US-3 — The two screening records are deliberately unable to decide anything.**
`us-unlawful-presence-bar-screening` and `us-permanent-bar-screening` are not
routes. They exist to raise the § 1182(a)(9) question, and each carries an
unconditional escalation so `evaluate` can only ever return
`requires_human_review`. **That polarity must not be "fixed".** Telling somebody
the ten-year bar does not reach them, from a fact set holding no departure date,
is the most expensive wrong answer available in this corridor. Five propositions
in these records are commonly stated backwards and each deserves a direct check:

1. § 1182(a)(9)(B)(v)'s qualifying relative does **not** include a United States
   citizen child.
2. The (B) bars do **not** aggregate across separate trips; (C) does, across the
   whole history since 1 April 1997.
3. The three-year bar requires a departure before proceedings commenced; the
   ten-year bar carries no equivalent condition.
4. The (B)(iii) exceptions — including time spent under 18 — do **not** reach (C).
5. The unlawful-presence count excludes **both** the I-94 expiry date and the day
   of departure. That is two exclusive endpoints in a codebase where every
   `DateRange` is closed and inclusive at both ends, which is exactly the kind of
   mismatch that produces an off-by-two nobody notices.

**US-4 — The EB-5 amounts in the regulation contradict the statute, and the
catalog encodes the statute.** 8 CFR 204.6(f) still states USD 1,800,000 and
USD 900,000, from a 2019 rule that USCIS's own Policy Manual (6 USCIS-PM G.2)
records as vacated, citing *Behring Regional Center LLC v. Wolf*, 544 F. Supp. 3d
937 (N.D. Cal. 2021). Congress enacted USD 1,050,000 and USD 800,000 in 2022. The
record encodes the statutory figures and cites the dead paragraph **explicitly**,
so that a reader who finds the regulation is not misled by it. **Please confirm
the vacatur independently:** the catalog attributes it to USCIS's statement
rather than to the report, which the encoder did not read.

**US-5 — The EB-4 religious-worker sunset is a live date trap and the record
declines to resolve it.** § 1101(a)(27)(C)(ii)(II) and (III) still read "before
September 30, 2015" in the codified text, and Congress extends the date by
appropriations rider rather than by amending it. The most recent extension
visible in the 2024 edition of the Code is Pub. L. 118-47, div. G, tit. I, § 104,
substituting 30 September 2024. **Whether a later extension is in force could not
be established**, so the criterion says so and escalates rather than picking an
answer. The minister branch, clause (ii)(I), carries no expiry. If you can
establish the current date, that is one of the highest-value single facts you
could add to this block.

**US-6 — The NIW regulation is narrower than the statute it implements.** 8 CFR
204.5(k)(4)(ii) speaks only of exceptional ability; § 1153(b)(2)(B)(i) waives
subparagraph (A) generally, and USCIS applies the waiver to advanced-degree
professionals as well. Recorded as a divergence rather than smoothed over.
Confirm that recording the divergence — rather than encoding either limb as the
rule — is the right posture.

**US-7 — Two United States weightings are decisions, not defaults.**
`us-eb2-advanced-degree` is `material` rather than `blocking`, because
exceptional ability is an independent route into the same preference that this
model cannot measure, so an `ineligible` on the degree branch would shut a door
the statute leaves open. Every `*-visa-number-available` criterion is `material`
because a number that is not available today is a **wait**, not a refusal.
Both should be confirmed as decisions.

**US-8 — Naturalisation escalates on one missing field, and § 1101(f) could not
be retrieved.** Both naturalisation records escalate unconditionally and can
never return `eligible`, because there is no United States State or USCIS
district in the fact model. Separately: good moral character rests on
§ 1427(a)(3), § 1427(d)–(e) and 8 CFR 316.10 and does **not** cite § 1101(f),
because that section could not be retrieved during the sweep. Naturalisation was
also researched from primary text rather than from the research brief the rest of
the block worked from, so it has had less cross-checking than its neighbours.

**US-9 — TN reads the same profession table as Canada, with one deliberate
divergence.** `us-tn-usmca-professional` reads `CUSMA_PROFESSIONS` — the table
`ca-cusma-professional` also reads — rather than re-transcribing Appendix 2,
because 8 CFR 214.6(c) reproduces the Appendix verbatim and the substantive test
is identical on both sides. The table holds **63 professions, matching the
regulation's enumeration**, of which 4 are flagged for heightened scrutiny. The
divergence: the United States record accepts a licence issued by a US, Canadian
or Mexican state, provincial or federal government, following the footnote in
214.6(c), while `ca.ts` narrows it to Canadian licences. Read the two records
together and confirm both the shared table and the divergence.

**US-10 — Six United States records carry a `leadsTo` bridge and 29 carry none,
and no United States edge leaves the file that declares it.** Four of the six
make a legal claim rather than a convenience, and should be read as claims.
`us-fiance-k1` leads only to `us-immediate-relative-spouse`, because the marriage
happens after admission and the adjustment that follows is conditional under
§ 1186a. `us-f1-academic-student` leads to H-1B, TN and O-1A, and the file says
in terms that a bridge is not a recommendation.
`us-unlawful-presence-bar-screening` leads to the provisional waiver, and the
waiver leads to consular processing, which is the actual sequence. All ten
employment records deliberately carry none.

**US-11 — There is no closed or suspended United States record, and that is a
research gap rather than a fact about the system.** Spain's investor route and
Canada's two paused programs are in the catalog precisely because people hold
status under routes that have shut. No United States route was traced back
through a repeal in this sweep. Treat the empty columns as work not done.

---

## 10. Scope: what this catalog is not

### Out of scope by decision — asylum, refugee protection, humanitarian claims

**Asylum, refugee protection and humanitarian/compassionate claims are not
encoded and will not be.** They turn on credibility assessment rather than on
criteria; they concern people at risk; and a self-serve eligibility checker is
the wrong instrument for them. The decision is recorded rather than left to look
like an oversight.

The boundary is named in the module header of every file written this sweep, and
again in the guidance of the individual criteria where a person most plausibly
arrives with a protection question — for example the Spanish long-term-residence
criterion (art. 183.3.f) covers stateless persons, refugees and beneficiaries of
subsidiary protection), the arraigo criteria that turn on not being a protection
applicant, and the Quebec intent-to-reside criterion. Each of those points the
reader to a qualified immigration lawyer or a specialised organisation rather
than to another part of the product.

**There is currently no catalog-level, user-visible statement of this
exclusion.** It lives in file comments and in individual guidance strings. It
needs an owner in `catalog/index.ts` or in the applications. It is logged in the
CHANGELOG as an open item, and we would welcome your view on where a user needs
to encounter it.

Two adjacent points were handled the same way rather than encoded: the Spanish
provision giving a reunited relative independent residence where they are a
victim of gender violence, sexual violence, violence in the family setting or
trafficking (cited, described, explicitly not assessed, with a pointer to a
specialist support service); and DA 20ª of RD 1155/2024, a residence route whose
favourable decision **obliges the applicant to withdraw a pending international
protection claim or appeal** — a trade that should not be nudged through a
self-serve checker.

### Named gaps

Not encoded, and disclosed in the file that would have held them.

**Spain and Canada.** Spanish Título IV Cap. VII (family of Spanish nationals);
art. 128 humanitarian grounds and Título VII Caps. II–V; art. 69 independent
residence as its own pathway; Ley 12/2015 as a closed pathway (its closing
wording is ambiguous by a day and we would not risk it); the Francophone
Community Immigration Pilot; the Canadian super visa; intercountry adoption and
orphaned-relative sponsorship; the "lonely Canadian" relative provision; UK
nationals and their family members under the Withdrawal Agreement; and
provincial nominee stream criteria for any province.

**United States — out of scope by the same permanent decision as asylum:**
refugee status under 8 U.S.C. 1157, withholding of removal, protection under the
Convention Against Torture, U and T classification, and **VAWA self-petitions**
under § 1154(a)(1)(A) and (B). VAWA is the one a reader is most likely to
mistake for missing law rather than excluded scope, so it is named three times —
in the `us-family.ts` header, in the immediate-relative-spouse relationship
guidance, and in the F2A relationship guidance — each pointing to a licensed
attorney or a representative accredited by the Department of Justice. Special
immigrant juveniles are excluded on the same ground and named on the EB-4 record.

**United States — not researched, rather than excluded:** the diversity immigrant
programme of 8 U.S.C. 1153(c); temporary protected status; the H-2A and H-2B
classifications; the E-3 Australian route; the O-1B, P and R classifications;
every EB-4 special-immigrant branch other than religious workers; the EB-5
regional-centre programme's own requirements beyond the ceilings on indirect
jobs; and any closed or repealed United States route at all.

**All three jurisdictions:** admissibility grounds beyond a self-declared
criminal record — medical, security and misrepresentation are untouched
throughout. In the United States block the § 1182(a)(9) unlawful-presence and
prior-removal grounds are the ones that most often decide a Mexican case; they
are named where they arise and encoded only as the two screening records
described in US-3.

### Engineering items open at the time of writing

Recorded here because they affect what you would see if you ran the product, not
what you are reviewing.

1. **The `es.ts` defects in ES-14 are unrepaired.** This is the one item that
   should gate review: do not sign the six `es.ts` records until it is closed.
   Still true on 2026-07-26 — `es.ts` line 167 still cites RD 557/2011, which the
   2025 Reglamento repealed in full. One correction to ES-14 itself: the constant
   it names as `SPANISH_OFFICIAL_LANGUAGE_COUNTRIES` does not exist under that
   name. The nearest thing is
   `SPAIN_REDUCED_RESIDENCY_NATIONALITIES` in `packages/core/src/jurisdiction.ts`,
   which carries 23 entries — 19 Ibero-American states plus Andorra, the
   Philippines, Equatorial Guinea and Portugal — and Puerto Rico is absent from
   it. Whether that list is the right one for the rule it serves is a question for
   you; the packet's earlier description of it was wrong about the name and the
   count, and is corrected here rather than quietly deleted.
2. ~~Test coverage for the 41 new records was still being written.~~ **Closed.**
   `packages/pathways` reports 17 test files and 443 passing tests
   (`pnpm --filter @meridian/pathways exec vitest run`, 2026-07-26).
3. ~~`scripts/check-pathway-citations.mjs` needs re-anchoring.~~ **Closed, and
   closed in the right direction.** `catalog/index.ts` writes
   `MERIDIAN_PATHWAY_CATALOG` out as a literal spread again, with a comment at the
   declaration explaining that the guard anchors on it. The check was **not**
   relaxed. It now reports: `OK — as of 2026-07-26: 15 catalog files, 84 pathways,
   378 citations, 1094 criterion references resolved`.
4. **`validateCatalog()` now returns nine warnings where the 2026-07-25 packet
   reported zero.** Zero are errors and none blocks a build. All nine are
   Canadian, all nine predate the United States block, and each is an editorial
   inconsistency between two records that are individually sound — they only
   misrender when several pathways appear side by side in one bibliography. Four
   citation ids are involved: `ca-cusma-citizenship-requirement`, `ca-irpa-s-11-1`
   and `ca-irpa-s-10-3` are declared on more than one record with a different
   `url` or `provision`; `ca-irpr-s-87-1` is annotated differently on four
   records. **This contradicts Appendix A of the 2026-07-25 packet**, which said
   the re-declared ids were byte-identical. They were then; they are not now.
   Nothing legal turns on it, but a footnote that resolves to whichever record
   loaded last is worse than no footnote, so it is listed here rather than left
   for a reader to trip over. They are enumerated in
   [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md#known-warnings).

---

## 11. What changes when you sign — read this before you do

Setting `reviewStatus: 'counsel_reviewed'` on a record is not an administrative
state change. It opens a gate.

**Before:** the pathway may appear in an **assessment** — a restatement of a
published rule with the applicant's own arithmetic against it, showing the
citations and the working. Restating published law and counting someone's own
days is not a reserved act in Spain or Canada, on our reading.

**After:** the pathway becomes eligible to enter **advice-class output**. It can
be ranked against other routes, given a position, and given a `rationale` string
— and a ranking says *what a person should do*. Under s. 91 of Canada's
Immigration and Refugee Protection Act and Spain's reserved-activity rules for
legal advice, that is a regulated act. `recommend()` will include it; the
`not_counsel_reviewed` exclusion disappears from its output.

> ### ⚠ If you are reviewing a United States record, read this first
>
> **There is no United States reserved-activity analysis anywhere in this
> repository.** [REGULATORY_POSTURE.md](REGULATORY_POSTURE.md) has a section on
> Canada (IRPA s. 91) and a section on Spain. It has none on the United States,
> and the 35 United States records were added on 2026-07-26 without one.
>
> That means the two sentences above — what an assessment is, and what changes
> when you sign — are stated on a reading of Canadian and Spanish law and have
> **not** been checked against the unauthorized-practice-of-law rules of any
> United States state, against the federal practitioner rules at 8 CFR 292 and
> 1292, or against the EOIR accredited-representative regime. Whether Meridian's
> `assessment` class is on the right side of any of those lines is an open
> question that nobody here is qualified to answer.
>
> We are recording this rather than assuming the Spanish and Canadian analysis
> transfers, because it may well not. **A United States reviewer should treat the
> scope of their own signature as undetermined until that analysis exists**, and
> we would rather hear that the gap must be closed before any United States
> record is signed than discover later that it should have been.

A second gate still applies. Advice-class output passes through `canRelease()`,
which decides per audience whether it may be released and downgrades it if not.
A reviewed pathway shown to an unrepresented applicant is still downgraded to an
unordered assessment with no rationale. So your signature is a necessary
condition for a recommendation, never a sufficient one.

**The exposure this creates is real and it is yours.** A ranked recommendation
naming a route you have attested to is a professional act with your identifier
attached to the record. Three consequences follow, and we would rather you
weighed them now than discovered them later:

- **Your identifier is public.** `reviewedBy` is committed to a public
  repository. Record a name or a licence identifier — **not** contact details.
- **Review is per-record, not per-jurisdiction.** Signing four Spanish records
  makes exactly those four rankable. There is no bulk state and we will not add
  one.
- **Review decays.** When a citation goes stale, the instrument is amended, or a
  criterion changes, the pathway moves to `needs_reverification`, which is
  treated identically to `unreviewed` for release purposes. A stale review is not
  a review. In practice this means a re-read at least every 180 days for anything
  you have signed.

If any part of that is not acceptable, the correct outcome is that no pathway is
ever marked reviewed and the product ships assessments only. That is a
sustainable state, it is the current state, and nothing is broken by staying in
it.

---

## 12. How to work through this

The mechanics are in [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md) — the
per-item checklist is section "What counsel must check", and the sign-off steps
are section E. In outline:

1. Pick **one** pathway. Read its record top to bottom; it is self-contained.
2. Work sections A (provenance), B (the discretionary flag), C (criteria
   semantics) and D (scope and completeness) of that checklist against it.
3. Where you disagree, say so on the record even if you do not change the file.
   A recorded disagreement is more useful than a silent edit.
4. On sign-off: set `reviewStatus`, `reviewedBy`, `reviewedOn`; refresh
   `verifiedOn` **only** on citations you actually opened; bump the pathway
   `version`.
5. File the reasoning — what was checked, against which consolidated text, on
   what date, and anything flagged but not changed — privately in
   `internal-devops/legal/`. This repository records the *state*; it must not
   record the correspondence.

Suggested order of work, on the view that it maximises what a reader gets from
the least review:

1. **Resolve ES-14 first**, then the six `es.ts` records. They are the oldest
   records, the only ones with known outstanding defects, and the corridor this
   platform was built around.
2. `ca.ts` — the two oldest Canadian records.
3. The Spanish arraigo figures, which are the highest-volume real-world question
   in the Spanish corridor and which turn almost entirely on ES-1 to ES-5.
4. Everything else, jurisdiction by jurisdiction.

**Where the United States block sits in that order is not settled**, and we would
rather say so than pick. Two arguments pull against each other. It is the largest
corridor in the world and the one Meridian's own atlas puts at row 1 of its
uncovered work queue, which argues for early attention. But 30 of its 35 records
can only escalate, so reviewing them buys no rankable output at all until the fact
model grows — and the reserved-activity gap boxed in Section 11 means the scope of
a United States signature is itself undetermined. **Our reading is that the
regulatory gap should be closed before any United States record is signed**, and
that the five records able to reach a verdict —
`us-tn-usmca-professional`, `us-b1-b2-visitor`, `us-h1b-specialty-occupation`,
`us-l1a-intracompany-manager-executive`, `us-l1b-specialized-knowledge` — are the
sensible first batch after it. Tell us if you disagree.

---

## Appendix A — how every figure in this packet was derived

Nothing here was taken from a summary. The counts were produced on **2026-07-26**
by loading the compiled catalog under Node and counting the objects: pathway
records from `MERIDIAN_PATHWAY_CATALOG` in
`packages/pathways/dist/catalog/index.js`, criteria by summing
`criteria.length`, citations by collecting `citations[].id` into a set, and
weights, flags and statuses by direct inspection of each field.

**373 distinct citation ids; 378 constants are declared across the files.** The
difference is five ids re-declared in a second file. On 2026-07-25 all five were
byte-identical. **They are no longer** — four of them now diverge in `url`,
`provision` or `note`, which is what produces the nine `validateCatalog()`
warnings recorded in Section 10 item 4. The earlier packet's claim that one id
keeps meaning one thing is corrected there.

Two counts of citation *references* circulate and both are right. The guard
reports **1094**, because it counts every `citationIds: [...]` array in the
source text. Counting only `criteria[].citationIds` at runtime gives **867**; the
remaining 227 are `durations[].citationIds`. 867 + 227 = 1094.

The escalation claim in Section 3 was checked two ways. **Structurally**, by
counting records carrying at least one `requiresHumanReview: true` criterion:
**62**. **Behaviourally**, by running `evaluate()` over all 84 records against
four fact sets — an empty profile and one directed at each of ES, CA and US — and
confirming **56** returned `requires_human_review` in every case. The six-record
difference is exactly the closed and suspended records that carry an escalation,
where closure outranks it: `es-arraigo-extraordinario`,
`es-nationality-democratic-memory-option`, `ca-family-parent-grandparent`,
`ca-start-up-visa`, `ca-rural-northern-pilot` and `ca-agri-food-pilot`. (The
seventh non-open record, `es-golden-visa`, carries no escalation at all.)

`recommend()` was run over the whole catalog and returned an empty ranking with
**84 exclusions, every one coded `not_counsel_reviewed`**.

The verification commands and their output on 2026-07-26:

```
pnpm typecheck                              19 successful, 19 total
pnpm build                                  12 successful, 12 total
node scripts/check-pathway-citations.mjs    OK — as of 2026-07-26: 15 catalog files,
                                            84 pathways, 378 citations,
                                            1094 criterion references resolved
node scripts/check-advice-boundary.mjs      OK — gate and producer anchors verified,
                                            189 application files read, 16 routes examined
node scripts/check-no-credential-custody.mjs OK — 404 files scanned, 3 rules,
                                            3 path exemptions, 2 structural anchors verified
node scripts/check-workspace-manifests.mjs  OK — 12 workspace projects present in all
                                            4 Dockerfiles and in the lockfile
```

`validateCatalog(catalog, '2026-07-26')` over all 84 records returned **9 issues,
0 of them errors** — see Section 10 item 4.

The `packages/pathways` suite now reports **17 test files, 443 tests, all
passing** (`pnpm --filter @meridian/pathways exec vitest run`). Nothing in the
counts above depends on the tests; they were derived from the pathway records
themselves.

**`pnpm test` at the repository root may exit non-zero without any catalog
failure.** Vitest exits 1 when a project has no test files at all, which is how
an empty application test directory reads, and the three Next.js applications
were acquiring their first suites while this revision was written. Every one of
the eight packages and `apps/api` passes. This is recorded because a reviewer who
runs the documented command may see a red result and should know it says nothing
about the catalog — `pnpm --filter @meridian/pathways exec vitest run` is the
command that does.

The citations check prints the UTC date it ran on, so a run after midnight UTC
reports the following day. Citations in this catalog carry two verification
dates: 2026-07-25 for the Spanish and Canadian records, 2026-07-26 for the United
States records.
