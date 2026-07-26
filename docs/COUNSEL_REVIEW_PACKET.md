# Counsel Review Packet — Meridian Pathway Catalog

> **Boundary note (Lane C, public-safe).** This packet is public-safe: it
> describes the review task, the artefact under review, and the questions we
> need answered. Engagement letters, fee arrangements, reviewer correspondence
> and completed review evidence are private and live in
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (`legal/`). Do not commit counsel correspondence to this repository.

Prepared: 2026-07-25. Figures below were derived by counting the catalog, not
from any summary; the method is recorded in [Appendix A](#appendix-a--how-every-figure-in-this-packet-was-derived).

Companion document: [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md) holds the
item-by-item checklist and the staleness protocol. This packet is the framing —
what you are being asked to do, what the artefact is, what turns on your
signature, and where we most need your judgement. Read this first, then work
from that checklist.

---

## 1. The single most important fact

**No pathway in this catalog has been reviewed by anyone qualified. All 49
records carry `reviewStatus: 'unreviewed'`.**

That is not a gap awaiting a deadline. It is the system's live state, and the
software is built so that state has teeth: `recommend()` refuses to rank an
unreviewed pathway and returns it in an `excluded` list with the code
`not_counsel_reviewed`. Today that function returns an empty ranking and 49
exclusions. Nothing in the product recommends anything to anyone.

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

Verified on 2026-07-25 by loading the built catalog and counting.

| | |
|---|---|
| Pathway records in `packages/pathways/src/catalog/` | **49** |
| Of those, exported through `MERIDIAN_PATHWAY_CATALOG` and reachable by the engine | **49** — all |
| Reviewed by counsel | **0** |
| Jurisdictions | ES (26 records), CA (23 records) |
| Status as recorded | 42 `open`, 5 `closed`, 2 `suspended` |
| Eligibility criteria | **261** |
| Criterion weights | 183 `blocking`, 50 `material`, 28 `informational` |
| Criteria escalated to a human unconditionally (`requiresHumanReview`) | **65** |
| Criteria escalated conditionally (`humanReviewWhen`) | **22** |
| Pathways carrying at least one unconditional escalation | **32 of 49** |
| Distinct citations | **196** |
| Of those, marked `discretionary` | **47** |
| Of those, carrying a URL | **178** (18 deliberately carry none) |
| Citations by kind | 114 regulation, 37 official guidance, 34 statute, 6 treaty, 4 policy, 1 case law |
| `verifiedOn` on every citation | 2026-07-25 |
| Pathways publishing a processing-time estimate | **0** |
| `leadsTo` edges between pathways | 53, none dangling |

Two figures deserve a sentence each, because they are the ones most likely to be
misread.

**All 49 are reachable, and the catalog's order means nothing.**
`packages/pathways/src/catalog/index.ts` assembles `MERIDIAN_PATHWAY_CATALOG` by
concatenating the nine source modules in a written-out, append-stable order. That
order is deliberately arbitrary with respect to merit: a list whose order changed
with the applicant's facts, or which ranked routes by anything substantive, would
be a ranking, and a ranking is advice. Do not read the position of a record in
any output as a statement about it.

**32 of 49 can only ever say "a person must look at this".** A criterion marked
`requiresHumanReview` escalates the whole report, ahead of every other rule in
the verdict order. Those 32 records therefore return `requires_human_review`
whenever they are open, for every applicant, no matter how strong the facts.
That is a deliberate design answer to a real problem — see Section 6 — and it is
one of the things we most want you to agree with or push back on.

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
- **`countsTowardNaturalisation` is left unset on 21 of 49 records.** Unset means
  "we did not establish this", which is different from `false`. Where the answer
  turns on an instrument the record does not otherwise cite, the encoder left it
  absent rather than guessing. Confirming or filling these is genuine review
  value.

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
| `blocking` | Verdict becomes `ineligible`. | 183 |
| `material` | Caps the verdict at `indeterminate`. **Can never on its own produce a "no".** | 50 |
| `informational` | Never affects the verdict; shown to the reader. | 28 |

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
  **65 criteria carry it.**
- `humanReviewWhen: <spec>` — conditional. Escalates only when the question
  actually arises. **22 criteria carry it.**

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

Six of the nine catalog files were written this sweep, and their encoders
converged independently on the same answer to the same problem. You should
decide whether it is the right one.

**The problem.** Meridian's fact model, `ApplicantFacts`, describes *one
person*. A large share of migration law does not: sponsorship turns on the
sponsor, family routes turn on a relationship, provincial routes turn on a
nomination, arraigo turns on physical presence rather than lawful residence, and
several thresholds are denominated in units the model cannot express (hours of
work, months of absence, per-ability language scores, funds as a balance rather
than a stream).

**The answer taken.** Rather than point a criterion at a fact path that means
something adjacent-but-different, the encoders marked those criteria
`requiresHumanReview: true`, wrote a `humanReviewReason` naming the exact missing
fact, and said in the bilingual guidance what the engine did and did not read.

**The consequence.** 32 of 49 records can only return `requires_human_review`.
Every Spanish arraigo figure, every Spanish family route, all four Canadian
provincial and Quebec routes, all nine Canadian family and pilot routes, and
every Canadian temporary-residence route in `ca-work-study.ts` behave this way,
for every applicant.

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
  automatically refreshed. Every citation in the catalog currently reads
  `2026-07-25`.
- **`url` is present on 178 of 196 citations and absent on 18, deliberately.**
  Where the encoder could not reach a canonical source, they omitted the link
  rather than guessing one, because a dead or wrong link teaches the reader to
  stop checking. The absences are concentrated in Quebec instruments and the
  Canada–Québec Accord (the publishing sites refused automated access) and in one
  Spanish closing date. Supplying a confirmed canonical URL during review is a
  genuine improvement to the artefact.
- **`kind` is a legal distinction, not a taxonomy.** `official_guidance` versus
  `regulation` is the difference between "the department currently does" and
  "the law says". 37 citations are `official_guidance`; each is a place where
  the number in the catalog is the administration's published practice.

### Staleness bands

Computed by `staleness()` in `packages/core/src/citation.ts`.

| Band | Age since `verifiedOn` | Meaning | For this catalog |
|---|---|---|---|
| `fresh` | ≤ 90 days | Usable without comment | through **2026-10-23** |
| `aging` | 91–180 days | Usable; flagged in the admin console | through **2027-01-21** |
| `stale` | > 180 days | Not to be silently trusted; **CI fails** | from 2027-01-22 |

The bands are Meridian's operational choice, recorded as such, not a legal
requirement. The reason they are short is tempo: Spain repealed its
investor-residency route with roughly three months' notice, and one instrument in
this catalog was amended four months ago in a way that removed a federal review
step (Canada, `SOR/2026-63`).

**Do not refresh a `verifiedOn` for a source you did not open.** It is the single
action that quietly destroys the value of the whole mechanism, and nothing
downstream can detect it. If a citation goes stale and nobody is available to
re-read it, leave it stale and let the build fail — a failing check that tells
the truth is worth more than a passing one that does not.

---

## 8. The `discretionary` flag, and why it carries legal weight

`discretionary: true` marks a citation whose rule is **administrative practice,
a screening criterion, published operational guidance, or case-law-derived** —
rather than a bright-line statutory threshold. 47 of 196 citations carry it.

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

For each flagged citation, confirm the flag **in both directions**, and confirm
the `note` says *which part* is discretionary rather than merely that something
is.

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

Not encoded, and disclosed in the file that would have held them: Spanish
Título IV Cap. VII (family of Spanish nationals); art. 128 humanitarian grounds
and Título VII Caps. II–V; art. 69 independent residence as its own pathway;
Ley 12/2015 as a closed pathway (its closing wording is ambiguous by a day and
we would not risk it); the Francophone Community Immigration Pilot; the Canadian
super visa; intercountry adoption and orphaned-relative sponsorship; the
"lonely Canadian" relative provision; UK nationals and their family members under
the Withdrawal Agreement; and admissibility grounds beyond a self-declared
criminal record — medical, security and misrepresentation are untouched
throughout.

### Engineering items open at the time of writing

Recorded here because they affect what you would see if you ran the product, not
what you are reviewing.

1. **The `es.ts` defects in ES-14 are unrepaired.** This is the one item that
   should gate review: do not sign the six `es.ts` records until it is closed.
2. **Test coverage for the 41 new records was still being written as this packet
   was finalised.** The record files themselves were stable; the suites around
   them were not. Confirm the package is green before relying on any claim about
   catalog behaviour.
3. **`scripts/check-pathway-citations.mjs` needs re-anchoring.** The catalog
   index was refactored to assemble the shipped array from a list of modules
   rather than from a literal array, and the guard reads it by pattern. It fails
   with "declares no `MERIDIAN_PATHWAY_CATALOG` array" until the script is
   updated. Nothing legal turns on this — it is the guard's anti-vacuity check
   refusing to confirm a shape it cannot parse, which is the behaviour it was
   built for — but it means CI is red until someone fixes the script.

---

## 11. What changes when you sign — read this before you do

Setting `reviewStatus: 'counsel_reviewed'` on a record is not an administrative
state change. It opens a gate.

**Before:** the pathway may appear in an **assessment** — a restatement of a
published rule with the applicant's own arithmetic against it, showing the
citations and the working. Restating published law and counting someone's own
days is not a reserved act in either jurisdiction Meridian operates in.

**After:** the pathway becomes eligible to enter **advice-class output**. It can
be ranked against other routes, given a position, and given a `rationale` string
— and a ranking says *what a person should do*. Under s. 91 of Canada's
Immigration and Refugee Protection Act and Spain's reserved-activity rules for
legal advice, that is a regulated act. `recommend()` will include it; the
`not_counsel_reviewed` exclusion disappears from its output.

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

---

## Appendix A — how every figure in this packet was derived

Nothing here was taken from a summary. The counts were produced by loading the
compiled catalog under Node and counting the objects: pathway records by
enumerating every exported `readonly Pathway[]` aggregate across
`packages/pathways/dist/catalog/`, criteria by summing `criteria.length`,
citations by collecting `citations[].id` into a set (196 distinct; 201 constants
are declared across files, because five ids are re-declared in a second file with
byte-identical `instrument` strings so that one id keeps meaning one thing), and
weights, flags and statuses by direct inspection of each field.

The escalation claim in Section 3 was checked two ways: structurally, by counting
records carrying at least one `requiresHumanReview: true` criterion (32), and
behaviourally, by running `evaluate()` over all 49 records against three fact
sets — an empty profile, a maximally favourable Spain-directed profile and a
maximally favourable Canada-directed profile — and confirming all 32 returned
`requires_human_review` in every case.

The verification commands and their output on 2026-07-25:

```
pnpm build --filter "./packages/*"          7 tasks, all successful
node scripts/check-pathway-citations.mjs    OK — 11 catalog files, 49 pathways,
                                            201 citations, 511 criterion references
                                            resolved  (run before the index refactor;
                                            failing after it — see Section 10 item 3)
```

`validateCatalog()` was additionally run over all 49 records as a single combined
catalog and returned zero issues and zero errors.

The `packages/pathways` test suite was being extended by other work while this
packet was written and its counts were still moving; it is deliberately not
quoted here. Run `pnpm exec tsc --noEmit && pnpm exec vitest run` in that package
for the current state. Nothing in the counts above depends on the tests: they
were derived from the pathway records themselves.

The citations check prints the UTC date it ran on, so a run after midnight UTC
reports the following day. All citations in this catalog were verified on
2026-07-25.
