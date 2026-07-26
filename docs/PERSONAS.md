# Personas

> **Boundary note (Lane C, public-safe).** These are product personas built from
> the domain and from what the code does. Named prospects, pipeline, pricing
> conversations, contract values and any real customer detail are private and
> live in [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops),
> per [`docs/repo-boundary-contract.md`](https://github.com/madfam-org/internal-devops/blob/main/docs/repo-boundary-contract.md).
> No real person appears in this document.

Last updated: 2026-07-26.

Companion document: [COMMERCIAL_POSTURE.md](COMMERCIAL_POSTURE.md) is the
argument for *why* the model is shaped this way. This document is *who* it is
for, and — the part that makes it a working document rather than a pitch deck —
what Meridian cannot do for each of them today.

---

## How to read this, and how much to trust it

**Nobody in this document has been interviewed.** Not one. These personas were
constructed from the legal domain, from the regulatory structure of the
professions involved, and from what the repository actually implements. That is
a legitimate starting point and a poor finishing point, and it should be treated
as a set of hypotheses with the evidence marked absent.

Three rules for maintaining it:

- **Every capability claim must be checkable against the code.** Each is written
  with a file path or an exported symbol. If you cannot find it, the claim is
  wrong — fix the document, not the reader's expectations.
- **The "cannot do" section is the most valuable part of each entry.** It is
  what stops a salesperson promising something and an engineer discovering it in
  a demo. If it is shorter than the capability section, be suspicious of it.
- **Do not add numbers.** No market sizes, no willingness-to-pay, no adoption
  figures. We have none, and an invented one becomes a planning input within a
  week.

Personas are ordered by how directly the buyer's own licence maps onto the
advice gate — which, per COMMERCIAL_POSTURE section 1, is the same thing as how
directly they map onto the paid tier.

### The one constraint that applies to all seven

**Zero of 84 pathways in the catalog are counsel-reviewed.** `recommend()`
therefore returns an empty ranking and 84 exclusions coded
`not_counsel_reviewed`, for *every* audience — including a licensed practitioner,
because the catalog gate runs before the release gate. Wherever an entry below
says a persona gets `advice`-class output, read it as *would get, once counsel
review has happened*. Today nobody gets it. This is not repeated in every
section; assume it everywhere.

The number was 49 until 2026-07-26, when 35 United States records were added. **The
number moved; the fact did not.** That is the point rather than a footnote: no
persona in this document got closer to being served by the catalog growing 71%,
because what every one of them is waiting on is a signature, not a record.

---

## 1. The immigration lawyer, and the small firm (1–10 people)

**The core buyer.** Their licence covers advice, which means they are the
audience the gate opens for rather than closes against.

### Who they are

A solicitor or *abogado/a* in a firm of one to ten, or a partner with two
paralegals. They carry somewhere between a handful and a few dozen live matters,
across a small number of route types they know well. Their expertise is real and
mostly undocumented — it lives in their head and in a folder of précédents. They
are not looking for software that knows the law better than they do. They are
looking for software that stops them dropping something.

Under the gate they are `Audience = 'practitioner'`, and `canRelease` releases
every class to them, including the ranked comparison an applicant may not be
shown, "because their licensee is accountable for the judgement and the engine
is a tool in their hands".

### The problem, in their terms

> "I know the law. What I lose sleep over is the calendar. Somebody's card
> expires, somebody's criminal record certificate goes stale before the
> appointment comes through, somebody spends four months outside the country and
> breaks their continuity and nobody notices until we file. I don't need a
> robot lawyer. I need to not be the single point of failure for forty
> people's deadlines."

And, separately:

> "When a client asks me why, I have to be able to point at the article. If
> your software gives me a number I can't trace, I can't use it — I'd have to
> re-derive it myself, which is the work I was trying to avoid."

### What Meridian meets it with

- **A traceable answer, not a verdict.** `evaluate()` in
  `packages/pathways/src/evaluate.ts` returns a three-valued result —
  `eligible`, `ineligible`, `indeterminate`, `requires_human_review` — with the
  criteria that decided it, the ones still unknown, and the citations behind
  each. The evaluator is deliberately law-free: no country name, no threshold,
  no legal concept lives in it, so a reviewing lawyer reads the catalog rather
  than the code.
- **A pin-cite on every applied rule.** `Citation` carries instrument,
  provision, jurisdiction and `verifiedOn`, plus `discretionary: true` where the
  rule rests on administrative practice rather than statutory text. The catalog
  ships 84 records carrying **373 distinct citation ids**, 82 of them
  `discretionary` — note that `check-pathway-citations.mjs` reports 378, because
  it counts declarations in the source files and five ids are declared in two
  files each.
- **Day counting that is not a spreadsheet.** `packages/presence` — Schengen
  90/180 including the *worst* day across a range (the window slides underneath
  a traveller, so the departure date is not the date that decides), continuous
  residence with breach detection, and qualifying-work accumulation.
- **Document sequencing.** `packages/documents` — apostille versus consular
  chain versus neither with an explicit `'unknown'` where the catalog cannot
  say, sworn-translation routing (`traductor jurado`, certified translator, or
  affidavit translation), freshness projected to the *submission* date, and a
  checklist whose tasks unlock only when they can actually be started.
- **An append-only audit trail.** `AuditRepository` has `append` and `list` and
  nothing else. There is no update and no delete to call.
- **A firm console** at `apps/admin` — catalog browser, matters, the
  representative roster, integrations, and the audit view.
- **Structural tenant isolation.** No repository interface method takes a tenant
  id; a repository is obtained from `forTenant()` with the id from a verified
  token, so there is no call a handler could make that reads another firm's row.

### What they would pay for

The continuity, not the calculation: persistent matters, deadline and expiry
monitoring across the whole caseload, the audit trail as evidence, and — once
counsel review has happened — advice-class output with their own licence
attached to it.

### What Meridian cannot do for them today

- **The ranking function returns nothing.** 0 of 84 records reviewed; see the
  constraint above. The single most valuable practitioner feature is inert.
- **Nothing persists.** The portal renders worked examples from
  `apps/web/lib/sample/`; the firm console reads a static dataset chosen by an
  environment variable and has no write side at all. There is no account system.
- **No caseload exists to monitor.** No notification, reminder, scheduling or
  alerting subsystem is in the repository. The deadline anxiety in their own
  words above is, today, entirely unaddressed.
- **Three jurisdictions, and the third is thinner than its record count.** Spain
  (26 records), Canada (23) and the United States (35, added 2026-07-26). If they
  practise anywhere else, there is nothing here. And a United States practitioner
  should read the third number carefully: **30 of those 35 records can only ever
  return `requires_human_review`**, because `ApplicantFacts` holds nothing about a
  petitioner, a sponsor or the manner of somebody's last entry — and United States
  family and employment law is at least half a test about exactly those. Five
  records can reach a verdict. Separately, there is **no United States
  reserved-activity analysis in the repository at all**
  ([REGULATORY_POSTURE.md](REGULATORY_POSTURE.md) covers Canada and Spain), so
  what Meridian may lawfully offer a United States practitioner is undetermined
  rather than merely unbuilt.
- **No filing.** Zero government-system capabilities are available: some are
  `not_provisioned` pending formal agreements, some `not_implemented`, and four
  are `refused_by_policy` permanently. Meridian will never file as the user —
  `buildHandoff` produces an ordered package the client carries to the portal
  themselves, so the legal act stays theirs.
- **None of the rest of a practice.** No time tracking, no billing, no trust
  accounting, no conflicts checking, no client intake, no document storage, no
  email. A firm cannot replace their practice-management suite with this; they
  would be adding a tool, and that is a harder sale.
- **No client-facing surface wired to anything.** The portal and the console do
  not call the API. A firm cannot invite a client into a shared matter.

---

## 2. The gestoría (Spain) and the RCIC (Canada)

Same shape as persona 1, different regulator — and in the Spanish case, a
different scope of authority that the model already encodes.

### Who they are

A *gestor administrativo colegiado* running a small practice that handles
residence renewals, *empadronamiento*, social security and tax filings for a
local immigrant community; or a Regulated Canadian Immigration Consultant
licensed by the CICC, often solo, often working a single corridor they know
extremely well. Both are licensed. Neither is a lawyer, and the difference
matters: `RepresentativeCredential` distinguishes `spanish_gestor` from
`spanish_abogado`, and `rcic` from `canadian_lawyer`, `canadian_paralegal` and
`quebec_notary`, because the authority each carries is not the same.

### The problem, in their terms

> "The volume is the job. Fifty renewals a year, all the same eight documents,
> and the one that goes wrong is always the one where a certificate was issued
> three months too early. I need the sequence to be right and I need to prove I
> did it right when somebody asks."

### What Meridian meets it with

- Everything in persona 1 — they are `practitioner` under the gate too.
- **A credential model that does not flatten them into "lawyer".** The gate
  checks jurisdiction match and expiry: a representative authorised in ES cannot
  release advice about a CA matter, and a lapsed licence stops gating release.
- **The sequencing engine**, which is the part of their day this actually
  addresses: `buildChecklist` produces an ordered plan with structural
  dependencies, and `earliestSafeIssueDate` answers "how early is too early to
  order this certificate" as arithmetic rather than as folklore.

### What they would pay for

Throughput. Same checklist, fifty times, with the freshness clock watched
automatically and a defensible record of each one.

### What Meridian cannot do for them today

- Everything in persona 1's list applies unchanged.
- **No licence verification.** `AuthorizedRepresentative.verifiedOn` is a date
  somebody types. There is no integration with a *colegio* register or the CICC
  public register, so "verified" means "a human checked and recorded that they
  checked". For a system whose gate turns on credential validity, that is a soft
  spot worth naming.
- **No bulk anything.** Every engine is per-person. Fifty renewals are fifty
  separate passes with no batch surface.
- **Spanish administrative reality is only partly encoded.** Cl@ve-related
  capabilities are either refused by policy (credential custody, acting as the
  user) or not provisioned; civil-registry certificate retrieval is not
  provisioned. The handoff package is the answer, and a handoff is not
  automation.

---

## 3. Corporate mobility and HR

Highest contract value, longest sale, and the buyer is **not** a licensee — so
the gate does not open for them.

### Who they are

A global-mobility manager at a company relocating engineers, or an HR generalist
at a smaller firm who inherited immigration along with payroll. They are moving
cohorts, not individuals, and they are answerable to a compliance function that
wants evidence rather than reassurance. They typically retain outside counsel
for the actual filings.

Under the gate they are `Audience = 'corporate_sponsor'`, treated exactly like
an applicant: information and assessment release; advice requires a
representative on the matter. As the landing site puts it — an employer is not a
licensee, and the boundary does not move because the reader is a company.

### The problem, in their terms

> "I have eleven people on assignment in four countries and I cannot tell you,
> right now, which of them is about to have a problem. Legal bills me by the
> question, so I don't ask until it's urgent, which is exactly when it's
> expensive. And when audit asks me to demonstrate we tracked this, I have a
> spreadsheet."

### What Meridian meets it with

- **Presence tracking that is defensible.** Every figure returns the
  de-duplicated ranges that produced it, the window it was measured over, and
  the per-record attribution. `detectInconsistencies` reports contradictions in
  the record itself — two countries on one day, unaccounted gaps, an imputed
  departure — which is precisely what an auditor pokes at.
- **The routes they actually use are encoded.** CUSMA/USMCA professionals (**63
  professions**, 4 flagged for heightened scrutiny), CUSMA traders, investors and
  intra-company transferees; the LMIA-based work permit; Spain's
  highly-qualified-professional and employed/self-employed authorisations; and
  since 2026-07-26 the US side — TN, H-1B, L-1A, L-1B, O-1A, E-1 and E-2. The
  profession table is shared: `us-tn-usmca-professional` and
  `ca-cusma-professional` read the same 63 entries, because 8 CFR 214.6(c)
  reproduces CUSMA Appendix 2 verbatim.
- **Employer-side capability reporting that does not lie.** The IRCC adapter
  declares offer-of-employment validation, employer-portal handoff and
  employer-portal submission as *distinct* capabilities with distinct states, so
  a status board cannot render a green tick for "the module exists".
- **An append-only trail**, which is the artefact the compliance function
  actually wants.

### What they would pay for

Cohort visibility and audit evidence: every assignee's presence position and
document status in one place, watched continuously, exportable to whoever asks.

### What Meridian cannot do for them today

- **There is no cohort.** `Applicant` and `Matter` are per-person records. No
  bulk import, no roster view, no group reporting, no org hierarchy. The single
  most important word in their problem statement — "eleven people" — has no
  representation in the data model.
- **No enterprise plumbing.** No SSO wired into any surface, no SCIM, no HRIS
  integration, no role model beyond the tenant/audience distinction, no data
  residency answer, no SLA, no security questionnaire, no penetration test. The
  ecosystem has an identity provider (Janua) and a billing system (Dhanam);
  neither is connected to a running Meridian surface.
- **They cannot receive a recommendation**, and this surprises people. A company
  paying for a platform still gets assessment-class output unless a
  representative is attached to the matter. That is a feature, and it needs to
  be said before the contract rather than during the demo.
- **No submission on anyone's behalf.** Employer-portal *submission* is a
  declared capability that is not available, and it is deliberately distinct
  from *handoff*, which is.
- **Three jurisdictions**, against a persona defined by operating in several at
  once. An eleven-person cohort across four countries is, today, at best a
  three-country answer — and on the United States leg, mostly an escalation
  rather than an answer, since the employer-side facts these routes turn on (the
  corporate relationship to a foreign affiliate, the state of a labor
  certification) are exactly what the fact model does not hold.

---

## 4. The cross-border tax adviser and wealth manager

The underrated wedge, and commercially the most interesting entry in this
document: **it is the only paid line that is not blocked by counsel review.**

### Who they are

A cross-border tax adviser with clients who split the year across countries; a
wealth manager whose client bought a house in Spain and now has a question they
did not expect. They are licensed in their own field, do not give immigration
advice, and do not want to. What they need is a defensible day count.

### The problem, in their terms

> "Residency is decided by day counts and my clients keep them in their heads,
> or in a calendar app, or not at all. When the tax authority asks, 'in my
> recollection' is not an answer. I need a record that reconstructs, with the
> arithmetic visible, that I can put in front of an inspector — and I need to
> know now, not in April, that someone is drifting toward a threshold."

### What Meridian meets it with

- **Day-count evaluation as a first-class engine.**
  `evaluateDayCountThreshold()` in `packages/presence/src/tax-residency.ts`,
  with two thresholds shipped: Spain's IRPF test (calendar year, *more than* 183
  days) and Canada's sojourner rule (calendar year, *at least* 183 days). The
  comparison direction is encoded per threshold because "more than" and "at
  least" are not the same rule and the difference decides cases.
- **A projection horizon.** `DEFAULT_PROJECTION_HORIZON_DAYS` is 730, so the
  question "when do I cross" is answerable ahead of time rather than in
  retrospect.
- **Civil-date arithmetic throughout.** No JavaScript `Date` touches a calendar
  calculation anywhere in the engines. `new Date('2025-03-01')` is midnight UTC,
  which is 2025-02-28 in Mexico City, and one hour of drift is one day of
  presence in a 183-day test.
- **`dayCountThreshold(spec)`**, a validating constructor: an adviser's own
  jurisdiction's rule can be supplied as data without touching the engine.
- **No counsel gate applies.** Everything in `packages/presence` is
  `assessment`-class by construction — the user's own recorded facts measured
  against a cited rule — and `canRelease` releases assessment to every audience
  unconditionally. This persona can be served, and charged, without a single
  pathway being counsel-reviewed.

### What they would pay for

The persistent ledger and the watch: continuous day counts across every relevant
jurisdiction, threshold proximity warnings before the year closes, and an export
that reconstructs the arithmetic for an inspector.

### What Meridian cannot do for them today

- **Two thresholds.** Spain and Canada. No US substantial-presence test — which
  is a three-year weighted formula, not a single count, and would need engine
  work rather than a data entry. No UK statutory residence test, which is not a
  day count at all but a matrix of ties. No treaty tie-breakers, no
  centre-of-vital-interests analysis, no permanent-home test. For an adviser
  whose entire practice is the *interaction* between two systems, one-sided day
  counts are a component and not an answer.
- **Data entry is manual.** There is no travel-history import — no calendar
  integration, no airline or booking import, no passport-stamp scan feeding the
  ledger. `grep -rn "fetch(" apps/web apps/landing` returns nothing at all. The
  MRZ tool is a static route with no server-side handler that could receive what
  the reader types even by accident, and the API's identity route — the one place
  an MRZ could reach a server — **persists none of it**: the verdict is returned
  and every field derived from the travel document is discarded.
- **Nothing persists**, which for this persona is fatal rather than
  inconvenient. A ledger that does not accumulate is a calculator, and they can
  already buy a calculator.
- **No threshold monitoring.** The proximity warning described above does not
  exist; nothing watches, because nothing runs on a schedule.
- **This is not tax advice and cannot become it.** Meridian counts days against
  a cited rule. Characterising residence, applying a treaty, or advising on a
  filing position is their work, and the product should never drift toward
  implying otherwise.

---

## 5. The university international office

Institutional budget, genuinely underserved, and a timing problem that is
harder than it looks.

### Who they are

Two to five staff supporting several hundred to several thousand international
students. They are not licensed to give immigration advice, and in Canada the
line is enforced — advising for consideration is s.91 territory, and
institutional advisers work carefully around it. Their year is seasonal and
their questions repeat.

### The problem, in their terms

> "The same forty questions, every intake, and one of them — when do I apply,
> and does my program length give me the full permit — actually decides whether
> a student can stay and work afterwards. I cannot answer it as advice. I can
> hand them something accurate, if something accurate exists."

### What Meridian meets it with

- **The study-to-work routes are encoded.** `ca-study-permit` and
  `ca-post-graduation-work-permit` (whose criteria include the
  minister-designated field-of-study condition as *blocking*, the temporary-stay
  condition, and the timing-after-completion condition), plus Spain's
  `es-student-stay` and `es-student-work-modification`.
- **A structural answer to their licensing problem.** Information and assessment
  release to anyone; the office can hand a student a citation-backed restatement
  and the student's own arithmetic without either party crossing the advice
  line. The gate does for them, in software, exactly what they do by hand in
  conversation.
- **Free tooling requiring no account**, which matters when the user is a
  nineteen-year-old who will use it once at 2am.
- **Bilingual EN/ES throughout**, structurally: `LocalizedText` is `{ en, es }`
  and every catalog label, summary and guidance string carries both. Since the
  locale change the *page* serves one language at a time — English unprefixed,
  Spanish at `/es` — so a student is handed a document in their own language
  rather than one containing both, with a switcher that is a real link. The
  bilingual *data* is unchanged; see [ADR 0007](adr/0007-url-locale-segments.md).

### What they would pay for

An institutionally-branded, always-current reference their students can use
unsupervised, plus cohort-level visibility into who is approaching a status
deadline.

### What Meridian cannot do for them today

- **No institutional surface at all.** No branding, no embedding, no student
  roster, no SIS integration, no reporting, no per-institution configuration.
  Nothing distinguishes a university from any other visitor.
- **The genuinely hard question is partly out of scope.** Whether a specific
  program at a specific institution yields a full-length permit depends on
  institutional designation and program characteristics that a rules catalog
  encodes as a criterion the *student* must answer, not as data Meridian holds.
  The engine will return `indeterminate` or `requires_human_review` — correct,
  and less satisfying than the office hoped.
- **The timing question is advice.** "Apply now or after your results" is a
  recommendation. It is gated, and no amount of institutional budget moves the
  gate.
- **Two languages.** EN and ES. An international office serves students in
  neither, routinely.
- **Canada, Spain and the US only**, against an office whose students come from
  everywhere and go home to everywhere. The US addition does reach this persona
  directly — `us-f1-academic-student` is encoded — but with a warning attached:
  that record **must be re-verified on 2026-09-15**, when 91 FR 44976 replaces
  duration of status with a fixed admission period for F, J and I admissions.
  Duration of status is what stops unlawful presence accruing before a formal
  violation finding, so this is the kind of change an international office cannot
  afford to learn about late.

---

## 6. The individual migrant

The largest audience, rarely a direct payer, and the reason the free tier
exists.

### Who they are

A person with a life decision attached to a legal question, usually with no
lawyer, often in a language that is not their first, and frequently while
frightened. They are the party every rule in
[REGULATORY_POSTURE.md](REGULATORY_POSTURE.md) exists to protect.

Under the gate they are `Audience = 'applicant'`: information and assessment
release; advice is downgraded to assessment with a stated reason unless a
representative is attached to their matter.

### The problem, in their terms

> "Every site that answers my question wants my email first, and then a
> consultant calls me. I don't know if the answer they gave me is real. I don't
> know if the number they showed me came from a law or from their imagination.
> I just want to know how many of my ninety days I have left."

### What Meridian meets it with

- **Three tools that work immediately, with no account:** the Schengen 90/180
  calculator, the Spanish nationality-by-residence check, and MRZ validation to
  ICAO Doc 9303. Each is `'use client'`, each computes in the browser, and
  neither `apps/web` nor `apps/landing` contains a single `fetch` call.
- **A stay history that never leaves the browser.** No storage write, no server
  action, no query-string round trip — because a travel history is exactly the
  kind of thing that must not end up in a server log or a browser-history entry.
- **Arithmetic on screen.** Not "you are compliant" but the window, the
  de-duplicated ranges, the per-stay attribution and the cited rule. A figure a
  person cannot reconstruct is a figure they cannot defend to an officer.
- **A named refusal instead of a silent gap.** When a recommendation cannot
  lawfully reach them, they are told which output was withheld, the reason the
  gate returned, and what would change it. A person handed a downgraded answer
  with no explanation cannot tell it apart from a bug.
- **Never custody of their government credential.** No PIN, no portal password,
  no signing key — not stored, not proxied, not held in memory for the duration
  of a request. It is unrepresentable at the type level, backed by a runtime
  guard and a CI check. See [ADR 0003](adr/0003-no-credential-custody.md).
- **Their language, not both at once.** Every surface is published in English at
  its own address and Spanish at `/es`, both statically prerendered, with
  `hreflang` alternates and an `x-default`. A frightened reader is not made to
  scan past a language they do not read to find the one they do, and a
  screen-reader user does not hear every sentence twice. The switch is an anchor
  with a real `href` pointing at *this* page in the other language, so it works
  with JavaScript off and does not lose what they typed.
  See [ADR 0007](adr/0007-url-locale-segments.md).

### What they would pay for

Realistically: very little, directly. The honest reading is that this persona
converts to revenue mostly by bringing the product to a professional — and
COMMERCIAL_POSTURE section 7 flags that bridge as an assumption with no evidence
behind it. If any individual paid, it would be for the persistent ledger during
a multi-year residence clock.

### What Meridian cannot do for them today

- **No advice, ever, unrepresented.** This is the whole design, and for the
  person who wants to be told what to do it is a disappointment rather than a
  feature. Meridian will not tell them which route to take, whether they will
  be approved, or how long it will take.
- **No account, no saving, no upload.** Whatever they enter is gone when the tab
  closes. Over a two-year residence clock that is a real cost, and it is the
  exact thing the paid tier would fix if the paid tier existed.
- **The portal's matters are not theirs.** Every matter, document and stay in
  `apps/web` is a worked example under a banner that says "not a real person and
  not your data". The *computation* is real; the inputs are invented.
- **Three tools, three jurisdictions.** The catalog now covers the US as well as
  ES and CA, but none of the three free tools does: the Schengen calculator, the
  Spanish nationality check and MRZ validation are what they were. If their
  question is about Germany, Portugal, or anywhere else among the 249
  jurisdictions the atlas lists, there is nothing here for them. Structural
  coverage is **1.20% — 3 of 249**.
- **No route to a human.** There is no representative directory, no referral,
  no marketplace. When the gate says "this needs a licensed person", it does not
  say where to find one.

---

## 7. Legal-aid and NGO clinics

**Free, permanently, and stated publicly rather than granted on request.** The
reasoning is in [COMMERCIAL_POSTURE](COMMERCIAL_POSTURE.md) section 4.

### Who they are

A clinic with two staff lawyers, a rotation of volunteers and students, and more
intake than capacity. Their supervising lawyers are licensed — so unlike the
university office, the gate does open for them. What they lack is time, money
and institutional infrastructure.

### The problem, in their terms

> "Our expertise walks out of the door every semester when the students rotate.
> We re-teach the same sequencing every intake, and we cannot afford to buy
> anything. When something goes wrong for a client, it goes badly wrong — these
> are people with no second option."

### What Meridian meets it with

- Everything persona 1 gets, at no cost, without asking.
- **A catalog that encodes what the volunteers keep re-learning**, with the
  citation attached so a supervisor can check a student's reasoning against the
  source rather than against memory.
- **Routes the commercial market underserves are in the catalog.** Spain's five
  open *arraigo* figures, family reunification, the EU family-member card, the
  Sephardic limb of the nationality rules; Canada's spousal and dependent-child
  routes. This is not incidental: a catalog built purely around what sells would
  not contain them.
- **Closed routes stay in the catalog** with a closure note, because a person
  who already holds status under a repealed route still needs an answer. Five
  records are `closed` and two `suspended` of 84, and they are retained
  deliberately. All seven are Spanish or Canadian: **no United States route has
  been traced back through a repeal**, which is work not done rather than a fact
  about that system.
- **A source they can audit.** AGPL-3.0, public repository, every rule readable.
  A clinic that cannot afford software also cannot afford to trust a black box.

### What they would pay for

Nothing. That is the commitment. The value returned is not revenue: it is the
most adversarial catalog review available anywhere, performed by licensed people
under real conditions, on exactly the routes commercial users touch least.

### What Meridian cannot do for them today

- **They cannot enrol**, because there is no account system to enrol in. Today
  the commitment costs nothing to honour because there is nothing to honour it
  with, and that will change the moment accounts exist — the mechanism needs to
  be designed so it does not become an application form.
- **Two languages.** EN and ES. A legal-aid clinic in Toronto or Madrid serves
  clients in neither, constantly, and interpretation is the clinic's single
  largest hidden cost. This is the gap most likely to make Meridian unusable in
  the setting it was most designed to serve.
- **No high-volume intake tooling.** No triage, no queue, no
  supervisor-review workflow, no conflict checking, no supervision trail
  distinguishing student work from signed-off work.
- **No offline use.** Clinics run in community centres and detention facilities.
- **No accessibility claim.** The applications have no test suite at all — the
  largest gap in the repository — so no assertion covers rendering, state
  derivation, or accessibility conformance. We should not claim WCAG conformance
  we have not measured.
- **No data-protection footing.** With no database deployed there is no data
  processing agreement, no retention policy and no records-of-processing to hand
  a clinic's own compliance officer. A clinic handling asylum data cannot adopt
  a tool that has not answered those questions.

---

## What we do not know about any of them

The research debt, recorded so it is visible rather than implied:

- **Zero interviews.** Every problem statement above is written by us, in a
  voice we imagined. The quotes are illustrative constructions, not
  transcripts, and no persona has been shown to a real member of that group.
- **No willingness-to-pay evidence** for any persona, at any price point, in any
  jurisdiction.
- **No idea which pain is actually the top one.** The deadline anxiety in
  persona 1 is the load-bearing assumption of the entire "continuity, not
  calculation" thesis, and it is an assumption.
- **No evidence for the free-to-paid bridge** — the belief that individual
  migrants bring the tool to their representatives. COMMERCIAL_POSTURE section 7
  treats its absence as a live failure mode.
- **No competitive research** on what these personas use today, what it costs
  them, or how bad switching would be.
- **Unknown ordering.** Persona 4 (tax) is the only line not blocked by counsel
  review, which is an argument for sequencing it first that has not been tested
  against whether those buyers want it.

The correct response to this section is fieldwork, not more writing. When
interviews happen, the personas should be rewritten from what people actually
said, and this section should record what was learned and what remains unknown —
not be deleted.
