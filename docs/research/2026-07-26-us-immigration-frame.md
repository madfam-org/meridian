# The United States — statutory frame

**Research brief for pathway encoders. Read this before writing any US criterion.**

- Researched: 2026-07-26. Use `verifiedOn: '2026-07-26'` for citations built from this brief.
- Author: an agent, not counsel. Nothing here is a review. Every pathway built from this
  brief ships `reviewStatus: 'unreviewed'`.
- Every URL in the [source register](#12-source-register) was fetched during this sweep.
  Where a proposition rests on something I could **not** verify from an official source it
  is in [§10](#10-what-i-could-not-establish). Prefer omitting a criterion to encoding
  anything from §10.
- **Scope exclusions are in [§9](#9-scope-exclusions-and-how-to-name-them).** Asylum,
  refugee status, withholding, CAT, U, T and VAWA are out of scope and must not be encoded.

---

## 0. Bottom line

1. The organising fact of the whole system is the **immigrant / nonimmigrant** split, and
   it is a *residual* definition: 8 U.S.C. § 1101(a)(15) says "immigrant" means **every**
   alien except one within the enumerated nonimmigrant classes. Combined with § 1184(b),
   which presumes every applicant to be an immigrant until they prove otherwise, this makes
   "prove you are temporary" the default burden on most routes. See [§1](#1-the-architecture).
2. **Visa ≠ admission ≠ status ≠ benefit.** Four separate things, four separate legal
   moments, four separate decision-makers. § 1201(h) says in terms that a visa does not
   entitle the holder to be admitted. A catalog that conflates them will mislead on every
   route. See [§1.3](#13-visa-admission-status-benefit).
3. **Three live changes landed in the last ten months and two of them take effect after
   this brief was written.** An F/J/I rule ending duration-of-status (effective 2026-09-15),
   a public-charge rescission restoring open-ended officer discretion (effective
   2026-09-18), and an H-1B selection that is **no longer a flat lottery** (already in force
   since 2026-02-27). All three are in [§7](#7-live-and-pending-changes-encoders-must-know).
   Do not encode from memory here; memory is wrong.
4. **No priority date, no cut-off date, no wait estimate may be encoded.** The Visa Bulletin
   moves monthly. Encode the *existence and structure* of the numerical limit as
   `information`. See [§2.4](#24-numerical-limits-per-country-caps-and-the-visa-bulletin).
5. **Mexico is one of exactly four chargeability areas the Department of State currently
   names as oversubscribed** — the others being China (mainland-born), India and the
   Philippines. This is verified from the State Department's own text ([§2.5](#25-mexico-specifically)).
   State it structurally. Never with a figure.
6. The single most consequential body of law for a Mexican audience is **§ 1182(a)(9)** —
   unlawful presence, the three- and ten-year bars, and the permanent bar. It is also the
   most commonly misunderstood, because the bars are triggered by **departure**, which means
   the act of going to a consular interview is the act that fires them. See
   [§5](#5-the-bars-and-inadmissibility-grounds).
7. `packages/pathways/src/catalog/cusma-professions.ts` carries **61 of the 63** Appendix 2
   professions. The two absentees are identified in [§8.1](#81-cusma-professionsts-is-two-professions-short-and-us-law-can-close-the-gap),
   and the complete list is reproduced *verbatim in United States regulation* at 8 CFR
   214.6(c), which is a citable primary source the Canadian-side encoding did not have.

---

## 1. The architecture

### 1.1 The instrument and its codification

| Field | Value |
|---|---|
| Statute | Immigration and Nationality Act of 1952 (the "INA"), as amended |
| Codification | Title 8, United States Code, chapter 12 (8 U.S.C. §§ 1101 *et seq.*) |
| Implementing regulations (DHS) | Title 8, Code of Federal Regulations |
| Implementing regulations (State) | Title 22, Code of Federal Regulations, parts 40–42 |
| Agency guidance (State) | Foreign Affairs Manual, volume 9 (9 FAM) |
| Agency guidance (DHS) | USCIS Policy Manual |

**Practitioners cite the INA section, courts and the Code cite the U.S.C. section, and the
two numbers are different.** INA § 212 is 8 U.S.C. § 1182; INA § 214 is § 1184; INA § 201,
202, 203 are §§ 1151, 1152, 1153; INA § 245 is § 1255. The regulations and the FAM both cite
the INA numbering, so an encoder reading 8 CFR or 9 FAM will see "INA 212(a)(9)(B)" where
the statute they fetched says "§ 1182(a)(9)(B)". These are the same provision.

**Recommendation for the `instrument` field:** carry both, because the reader may arrive
from either direction.

> `instrument: 'Immigration and Nationality Act (8 U.S.C.)'`
> `provision: '8 U.S.C. § 1182(a)(9)(B)(i)(II) (INA § 212(a)(9)(B)(i)(II))'`
> `kind: 'statute'`, `jurisdiction: 'US'`

For regulations use `kind: 'regulation'` and `provision: '8 CFR 214.6(c)'`. For the FAM and
the USCIS Policy Manual use `kind: 'official_guidance'` — **not** `'regulation'`. That
distinction is load-bearing; see [§6](#6-statutory-vs-regulatory-vs-policy--the-discretionary-decision-table).

### 1.2 Immigrant and nonimmigrant — a residual definition

8 U.S.C. § 1101(a)(15), opening words:

> The term "immigrant" means every alien except an alien who is within one of the following
> classes of nonimmigrant aliens…

Then follow the enumerated classes, lettered **(A) through (V)**: (A) diplomats, (B) visitors
for business or pleasure, (C) transit, (D) crew, (E) treaty traders and investors, (F)
academic students, (G) international organisations, (H) temporary workers, (I) foreign media,
(J) exchange visitors, (K) fiancé(e)s and spouses of citizens, (L) intracompany transferees,
(M) vocational students, (N) certain NATO relatives, (O) extraordinary ability, (P) athletes
and entertainers, (Q) cultural exchange, (R) religious workers, (S) informants, (T)
trafficking victims, (U) crime victims, (V) certain spouses and children of LPRs.

Two consequences the catalog must respect.

**First, the burden runs the wrong way for most applicants.** 8 U.S.C. § 1184(b):

> Every alien (other than a nonimmigrant described in subparagraph (L) or (V) of section
> 1101(a)(15) of this title, and other than a nonimmigrant described in any provision of
> section 1101(a)(15)(H)(i) of this title except subclause (b1) of such section) shall be
> presumed to be an immigrant until he establishes to the satisfaction of the consular
> officer, at the time of application for a visa, and the immigration officers, at the time
> of application for admission, that he is entitled to a nonimmigrant status…

Read the exceptions carefully. The presumption **does not apply** to L, V, or any H(i) class
other than H-1B1. It **does apply** to TN, O-1, F-1, B-1/B-2 and E (see § 1184(b) as quoted;
E is not excepted, though 9 FAM softens what "temporary" means for E — [§4.5](#45-e-1-treaty-trader-and-e-2-treaty-investor)).
It is also reinforced generally by 8 U.S.C. § 1361, which places the burden of proof on the
applicant to establish eligibility and non-inadmissibility.

**Second, "the applicant must show the stay is temporary" is a criterion on most
nonimmigrant routes, and it is discretionary.** It is a state of mind assessed by an officer,
not a threshold. Encode it `discretionary: true`, weight `material` at most, and prefer
routing to human review over any verdict.

### 1.3 Visa, admission, status, benefit

These four are routinely conflated in secondary sources and must never be conflated here.

| Concept | What it is | Who decides | Where |
|---|---|---|---|
| **Visa** | A travel document permitting the holder to *apply* for admission at a port of entry | Consular officer, Department of State, abroad | 8 U.S.C. § 1201; 22 CFR part 41 (NIV), part 42 (IV) |
| **Admission** | "the lawful entry of the alien into the United States after inspection and authorization by an immigration officer" | CBP officer at the port of entry | 8 U.S.C. § 1101(a)(13)(A) |
| **Status** | The classification the person holds *while inside* the country, with its conditions | DHS (CBP grants it on admission; USCIS on change/extension) | 8 CFR 214.1, 214.2 |
| **Benefit** | An application for something under the Act — extension, change of status, adjustment, naturalisation | USCIS (or an immigration judge) | 8 CFR parts 245, 248 etc. |

The provision that makes the distinction operative is 8 U.S.C. § 1201(h):

> Nothing in this chapter shall be construed to entitle any alien, to whom a visa or other
> documentation has been issued, to be admitted [to] the United States, if, upon arrival at a
> port of entry … he is found to be inadmissible under this chapter, or any other provision
> of law.

Practical rules for encoders:

- **A visa is not permission to be present.** Its expiry date governs when you may *travel*,
  not how long you may *stay*. The stay is governed by the admission period recorded by CBP.
  A criterion keyed to "visa expiry" is almost always wrong; it should key to the authorised
  period of stay.
- **Parole is not admission.** § 1101(a)(13)(B) says an alien paroled under § 1182(d)(5) "shall
  not be considered to have been admitted". This matters directly to adjustment of status,
  which is available to someone "inspected and admitted **or paroled**" — see [§3](#3-adjustment-of-status-versus-consular-processing).
- **Status can lapse while the visa is still valid, and vice versa.** They are independent.
- 8 CFR 214.1(e) restricts a nonimmigrant to employment consistent with the class of
  admission; unauthorised work is a status violation with knock-on effects at
  [§3.2](#32-the-bars-in-1255c-and-the-two-escape-hatches).

### 1.4 Petition, application, adjudication

Most immigrant routes and several nonimmigrant ones are **two-step or three-step**: someone
else files a *petition* to establish the classification, and only then does the beneficiary
file an *application* for the visa or the status.

- Family immigrant petition: Form I-130 by a US-citizen or LPR relative, under 8 U.S.C. § 1154.
- Employment immigrant petition: Form I-140 by the employer (or by the applicant in the
  national-interest and EB-1A cases), § 1154.
- Investor petition: Form I-526 by the investor.
- Many employment-based immigrant categories require a **labor certification** from the
  Department of Labor *before* the petition, under 8 U.S.C. § 1182(a)(5)(A) — a separate
  agency, a separate process, a separate timeline.
- Nonimmigrant worker classifications (H, L, O, P, and TN when filed from inside the US)
  require Form I-129 to USCIS. TN filed at the border and TN visa applications abroad do
  **not** require a petition; see [§4.1](#41-tn--the-american-side-of-the-treaty-we-already-encode).

An encoder writing "the applicant must have an approved petition" is writing a real
criterion. An encoder writing "the applicant must qualify for EB-2" without the petition step
has skipped the thing that actually gates the timeline.

---

## 2. The immigrant preference system

### 2.1 Immediate relatives — outside the numerical system entirely

8 U.S.C. § 1151(b)(2)(A)(i) defines **immediate relatives** as "the children, spouses, and
parents of a citizen of the United States, except that, in the case of parents, such citizens
shall be at least 21 years of age", plus certain widow(er)s who petition within two years of
the citizen's death and have not remarried.

Immediate relatives are **not subject to the worldwide levels or numerical limitations** of
§ 1151(a). 9 FAM 503.1-3(A) confirms: "Immediate relative IVs are not numerically limited."

**This is the single most important structural fact for a Mexican family-route reader**, and
it is the reason the catalog must keep immediate relatives structurally separate from the
family *preferences*. A Mexican spouse of a US citizen faces no queue at all; a Mexican
sibling of a US citizen faces the longest queue in the system. Same statute, same family,
utterly different route. Do not let them share a pathway record.

Note also the definition of "child" is age- and marital-status-bound (unmarried, under 21),
which is why the **Child Status Protection Act** exists — 8 U.S.C. § 1153(h) gives an
age-calculation formula (age at visa availability, reduced by the days the petition was
pending, provided the applicant sought LPR status within one year of availability). That
formula is arithmetic on civil dates and is a good candidate for `derived` facts later. It is
*not* something to hand-wave.

### 2.2 Family-sponsored preferences — 8 U.S.C. § 1153(a)

| Category | Who | Allocation (verbatim from § 1153(a)) |
|---|---|---|
| **F1** | "the unmarried sons or daughters of citizens of the United States" | "not to exceed 23,400, plus any visas not required for the class specified in paragraph (4)" |
| **F2A** | spouses and children of an LPR | within the F2 pool; "not less than 77 percent of such visa numbers shall be allocated to aliens described in subparagraph (A)" |
| **F2B** | "the unmarried sons or unmarried daughters (but are not the children) of an alien lawfully admitted for permanent residence" | F2 total: "not to exceed 114,200, plus the number (if any) by which such worldwide level exceeds 226,000, plus any visas not required for the class specified in paragraph (1)" |
| **F3** | "the married sons or married daughters of citizens of the United States" | "not to exceed 23,400, plus any visas not required for the classes specified in paragraphs (1) and (2)" |
| **F4** | "the brothers or sisters of citizens of the United States, if such citizens are at least 21 years of age" | "not to exceed 65,000, plus any visas not required for the classes specified in paragraphs (1) through (3)" |

Structural points an encoder must carry:

- **There is no LPR sibling or LPR parent category.** An LPR can petition only a spouse or an
  unmarried son or daughter (F2A/F2B). A route "my permanent-resident brother will petition
  me" does not exist and the catalog should be able to say so.
- **Marital status is category-determinative and mutable.** An F1 beneficiary who marries
  converts to F3. An F2B beneficiary who marries loses the category outright (an LPR has no
  married-child category) unless the petitioner naturalises first.
- **The categories cascade.** Unused numbers fall down the list. That is why the worldwide
  level is not simply divisible.

### 2.3 Employment-based preferences — 8 U.S.C. § 1153(b)

| Category | Statutory requirement, structurally |
|---|---|
| **EB-1A** § 1153(b)(1)(A) | "extraordinary ability in the sciences, arts, education, business, or athletics which has been demonstrated by sustained national or international acclaim and whose achievements have been recognized in the field through extensive documentation"; seeks to continue work in that area; entry "will substantially benefit prospectively the United States". **No employer, no job offer, no labor certification.** |
| **EB-1B** § 1153(b)(1)(B) | "recognized internationally as outstanding in a specific academic area"; "at least 3 years of experience in teaching or research in the academic area"; a tenured/tenure-track or comparable research position. **Employer required, labor certification not.** |
| **EB-1C** § 1153(b)(1)(C) | employed at least 1 year in the 3 years preceding application by a firm/affiliate/subsidiary, entering "to continue to render services to the same employer or to a subsidiary or affiliate thereof in a capacity that is managerial or executive". **No labor certification.** The immigrant analogue of L-1A. |
| **EB-2** § 1153(b)(2)(A) | "members of the professions holding advanced degrees or their equivalent" **or** exceptional ability in the sciences, arts or business, **and** "whose services … are sought by an employer in the United States". Labor certification required unless waived. |
| **EB-2 NIW** § 1153(b)(2)(B)(i) | The job-offer requirement (and with it the labor certification) may be waived "when the Attorney General deems it to be in the national interest". **Pure discretion, no statutory standard.** |
| **EB-3** § 1153(b)(3)(A) | (i) skilled workers — "capable … of performing skilled labor (requiring at least 2 years training or experience), not of a temporary or seasonal nature, for which qualified workers are not available in the United States"; (ii) professionals — "hold baccalaureate degrees and who are members of the professions"; (iii) other workers — unskilled labor, capped at 10,000/yr by § 1153(b)(3)(B). **Labor certification required — § 1153(b)(3)(C).** |
| **EB-4** § 1153(b)(4) | special immigrants under § 1101(a)(27) other than (A) and (B); 7.1% of the worldwide level, with sub-caps. |
| **EB-5** § 1153(b)(5) | investment in a new commercial enterprise; **$1,050,000** in general (§ 1153(b)(5)(C)(i)), **$800,000** in a targeted employment area or infrastructure project (clause (ii)). Both figures **automatically adjust beginning 1 January 2027 and every 5 years thereafter** by CPI, rounded down to the nearest $50,000 (clause (iii)). |

Percentages: EB-1, EB-2 and EB-3 each get "not to exceed 28.6 percent" of the worldwide level
plus spillover; EB-4 and EB-5 get 7.1% each.

Two traps:

- **EB-1A "extraordinary ability" and O-1 "extraordinary ability" are different standards
  applied by different tests**, even though the statutory phrasing overlaps. Do not cross-cite.
- The EB-5 figures **are dated by construction**. Encode them with the adjustment mechanism in
  the note and a citation to clause (iii), or omit the figure and encode the mechanism only.
  A hard-coded `1050000` with no adjustment note is a defect waiting for 1 January 2027.

### 2.4 Numerical limits, per-country caps, and the Visa Bulletin

**Worldwide levels.** § 1151(c): family-sponsored is "480,000, minus … plus …" — the operative
floor in practice is 226,000, and the July 2026 bulletin records the FY2026 family-sponsored
limit as 226,000. § 1151(d): employment-based is "140,000, plus the number computed under
paragraph (2)".

**Per-country cap.** 8 U.S.C. § 1152(a)(2) caps any single foreign state at **7 percent** of
the combined annual family-sponsored and employment-based preference limits, and a dependent
area at 2 percent. Note the interaction with § 1152(a)(1)(A), which forbids discrimination in
immigrant visa issuance on the basis of nationality: the per-country cap is an express
carve-out from that principle, not a contradiction of it.

**Chargeability.** 9 FAM 503.1-2(D): an applicant "is generally chargeable to the numerical
limitation applicable to the applicant's place of birth" — *birth*, not nationality, not
residence. Cross-chargeability exceptions exist (9 FAM 503.2-4). A Mexican national born
elsewhere may not be charged to Mexico at all. If the catalog ever models chargeability it
must key on place of birth.

**Oversubscription.** 9 FAM 503.1-2(A)(c):

> Those countries in which demand for IV numbers exceeds the annual 7% per-country limit are
> deemed "oversubscribed" and natives of those countries may face a longer wait for a visa
> than applicants from other countries.

**Priority date.** 22 CFR 42.53: "The priority date of a preference visa applicant under INA
203 (a) or (b) shall be the [filing] date of the approved petition that accorded preference
status", and a spouse or child acquired before the principal's admission takes the principal's
date. For labor-certification categories USCIS states the priority date is the date DOL
accepted the labor certification application. Order of consideration is chronological by
priority date — § 1153(e)(1), 22 CFR 42.54(a)(1).

**The Visa Bulletin.** The Department of State publishes it **monthly**. It carries two charts:
*Application Final Action Dates* (when a visa may actually be issued or an adjustment approved)
and *Dates for Filing* (when documents may be assembled / when USCIS may accept an I-485, if
USCIS so announces for that month). The mechanism, from the bulletin's own explanatory text:

> If not all demand could be satisfied, the category or foreign state in which demand was
> excessive was deemed oversubscribed. The final action date for an oversubscribed category is
> the priority date of the first applicant who could not be reached within the numerical limits.

> **⛔ Do not encode a priority date, a cut-off date, a "dates for filing" date, a queue
> position, or any estimate of waiting time.** These change every month and retrogress without
> notice — the bulletin's own text warns that a date may "retrogress". Any number written into
> the catalog is wrong within weeks and would be presented to a reader as settled. Encode the
> *existence and structure* of the limit as `information` with a citation to § 1152(a)(2) and
> § 1153(e)(1), and point the reader at the current bulletin.

### 2.5 Mexico specifically

This is materially true and a Mexican reader must not be left to assume parity.

The July 2026 Visa Bulletin states, in its own explanatory paragraph on § 1152(e) prorating:

> These provisions apply at present to the following oversubscribed chargeability areas:
> CHINA-mainland born, INDIA, MEXICO, and PHILIPPINES.

The Department's Visa Bulletin index page corroborates it structurally: its historical tables
are split into "Family Preference **Worldwide (non-oversubscribed countries only, which are
those not individually listed below)**" followed by individually-listed tables for China
(mainland-born), India, **Mexico** and the Philippines — and the same four again for
Employment Preferences.

So the encodable, non-perishable statements are:

- Mexico is one of four chargeability areas the Department of State currently treats as
  oversubscribed, and therefore appears in its own column of the Visa Bulletin rather than
  under the worldwide dates.
- In consequence, a Mexican-chargeability applicant in a numerically limited category can wait
  materially longer than an applicant of another chargeability with the same priority date and
  the same category. The family-sponsored categories are where this bites hardest.
- Whether a *particular* category is oversubscribed for Mexico in a *particular* month, and by
  how much, is a fact of the current bulletin and must be read there.

Write that in `guidance`, classified `information`, cited to § 1152(a)(2) and the Visa Bulletin
page. **Do not write "about X years."** I saw the current figures while verifying the column
structure and am deliberately not recording them, because they will be false before counsel
reviews this.

---

## 3. Adjustment of status versus consular processing

Two routes to the identical outcome — lawful permanent residence — and which one is available
determines what a person can actually do with their life for the next several years. Most
summaries omit the distinction entirely.

USCIS states the split plainly: if you are outside the United States you apply at a consulate
for an immigrant visa ("consular processing"); if you are already inside "you can apply for
permanent resident status without having to return to your home country" ("adjustment of
status").

### 3.1 The three statutory conditions for adjustment — 8 U.S.C. § 1255(a)

> The status of an alien **who was inspected and admitted or paroled into the United States**
> … may be adjusted by the Attorney General, **in his discretion** and under such regulations
> as he may prescribe, to that of an alien lawfully admitted for permanent residence if
> (1) the alien makes an application for such adjustment, (2) the alien is eligible to receive
> an immigrant visa and is admissible to the United States for permanent residence, and (3) an
> immigrant visa is immediately available to him at the time his application is filed.

Four separate gates hide in that sentence, and each is a criterion:

1. **Inspected and admitted or paroled.** Someone who entered without inspection fails at the
   threshold. This is the single most common reason a Mexican applicant with a US-citizen
   spouse cannot adjust inside the country and must leave — which then fires the unlawful
   presence bars ([§5](#5-the-bars-and-inadmissibility-grounds)). The interaction between
   § 1255(a) and § 1182(a)(9)(B) is the central structural fact of this corridor.
2. **Eligible to receive an immigrant visa**, i.e. an approved petition in a category.
3. **Admissible**, i.e. no unwaived ground of inadmissibility under § 1182(a).
4. **A visa immediately available at the time of filing** — the Visa Bulletin gate again.

And the whole thing is expressly **"in his discretion"**. Even a person who satisfies all four
is not entitled to adjustment. Encode `discretionary: true` on the grant itself.

### 3.2 The bars in § 1255(c) and the two escape hatches

§ 1255(c) removes subsection (a) from, among others:

- **(2)** an alien "who hereafter continues in or accepts unauthorized employment prior to
  filing an application for adjustment of status **or** who is in unlawful immigration status
  on the date of filing … **or** who has failed (other than through no fault of his own or for
  technical reasons) to maintain continuously a lawful status since entry" — **except** an
  immediate relative as defined in § 1151(b), or a special immigrant under
  § 1101(a)(27)(H), (I), (J) or (K);
- **(4)** an alien admitted as a visitor without a visa under § 1182(l) or the Visa Waiver
  Program (§ 1187) — **except** an immediate relative;
- **(7)** any alien seeking employment-based adjustment under § 1153(b) "and is not in a lawful
  nonimmigrant status";
- **(8)** any alien "who was employed while the alien was an unauthorized alien … or who has
  otherwise violated the terms of a nonimmigrant visa";
- also (1) crewmen, (3) transit without visa, (5) S nonimmigrants, (6) certain deportable aliens.

Two escape hatches, and encoders must know both because they change the answer completely:

**§ 1255(k) — the 180-day employment-based forgiveness.** An alien eligible under
§ 1153(b)(1), (2), (3) or (5) may adjust notwithstanding (c)(2), (c)(7) and (c)(8) if, on the
filing date, they are "present in the United States pursuant to a lawful admission" and, since
that admission, have not for "an aggregate period exceeding 180 days" failed to maintain lawful
status, engaged in unauthorised employment, or otherwise violated the terms of admission. This
is an **aggregate day-count against a 180-day threshold** — exactly the kind of civil-date
arithmetic `@meridian/core` exists for, and exactly the kind of thing a person will get wrong
by hand.

**The immediate-relative exception.** (c)(2) and (c)(4) do not apply to immediate relatives.
An immediate relative who was *admitted* (even on a long-expired B-2) and then overstayed can
still adjust. One who *entered without inspection* cannot, because that fails § 1255(a) itself,
which the (c)(2) exception does not reach.

**§ 1255(i) — grandfathering, effectively historical.** An alien who entered without inspection
or is within a (c) class may nonetheless apply if they are the beneficiary of a § 1154 petition
or a labor certification application "filed … on or before **April 30, 2001**", and, where filed
after **14 January 1998**, was physically present in the United States on **21 December 2000**;
with a **$1,000** sum remitted with the application. These dates are fixed in the statute and do
not move, so they are safe to encode. The population is small and ageing but non-empty, and a
person who qualifies has a route that is otherwise closed to them — which is precisely the sort
of thing a checker should surface rather than omit.

**§ 1255(e) — marriage during proceedings.** No adjustment on the basis of a marriage entered
into while administrative or judicial proceedings are pending, unless the marriage is proved
bona fide by **clear and convincing evidence**. Note the elevated standard.

### 3.3 Consular processing, and why it is not simply "the other option"

Consular processing runs: petition approved → National Visa Center → fee and documents →
interview at the consulate abroad → visa issued → admission as an LPR at a port of entry. The
consular officer applies § 1182 grounds (8 U.S.C. § 1201(g) requires refusal where the officer
"knows or has reason to believe" the applicant is ineligible), and there is essentially no
appeal of a consular refusal.

**The asymmetry that matters:** consular processing requires departure, and departure is the
event that triggers § 1182(a)(9)(B). A person inside the United States with more than a year of
unlawful presence and an approved immediate-relative petition faces a genuine dilemma: they
cannot adjust (no inspection and admission), and going to the interview fires the ten-year bar.
The provisional waiver ([§5.4](#54-waivers)) exists to address exactly this and only partially
succeeds.

Encoders: model the choice explicitly. A pathway that says "apply for a green card through your
spouse" without asking whether the person was inspected and admitted is giving a Mexican reader
an answer that could cost them a decade.

### 3.4 Conditional residence

Where residence is obtained through a marriage less than two years old at the time of the
grant, the status is **conditional** for two years under 8 U.S.C. § 1186a, and a joint petition
to remove conditions is required, with waivers of the joint requirement in defined
circumstances. If the catalog encodes a marriage-based route, it must encode the conditional
period, or it will tell someone they are done when they are halfway.

---

## 4. Key nonimmigrant classifications for a Mexican national

### 4.1 TN — the American side of the treaty we already encode

**Where the authority sits.** Treaty: USMCA Chapter 16 ("Temporary Entry for Business
Persons"), Annex 16-A, Section D (Professionals), with the profession list at **Appendix 2 to
Annex 16-A**. Statute: 8 U.S.C. § 1184(e)(1). Regulation: **8 CFR 214.6**. State Department
guidance: 9 FAM 402.17; also 22 CFR 41.59.

**Annex 16-A structure** (identical for all three Parties): Section A Business Visitors,
Section B Traders and Investors, Section C Intra-Company Transferees, Section D Professionals;
Appendix 1 is the business-visitor activity list, Appendix 2 is the professions list.

**The treaty forbids petitions and quotas but permits visas.** Section D:

> 2. No Party shall: (a) as a condition for temporary entry under paragraph 1, require prior
> approval procedures, petitions, labor certification tests or other procedures of similar
> effect; or (b) impose or maintain a numerical restriction relating to temporary entry under
> paragraph 1.
> 3. Notwithstanding paragraph 2, a Party may require a business person seeking temporary entry
> under this Section to obtain a visa or its equivalent prior to entry.

**This paragraph 3 is the whole difference between the Mexican and Canadian experience of the
same treaty right.** 8 CFR 214.6(d):

- **(d)(1) Citizens of Mexico** — admitted "upon presentation of a valid passport **and valid TN
  nonimmigrant visa**" at a Class A port of entry, an international airport, or a
  pre-clearance/pre-flight station. 9 FAM 402.17-6(b): "A Mexican citizen seeking TN status
  must apply for and be issued a visa."
- **(d)(2) Citizens of Canada** — simply "make application for admission with a Department
  officer" at the port of entry. 9 FAM 402.17-6(a) says issuing a TN visa to a Canadian
  "should be rare".

So the *substantive* eligibility test is identical for a Mexican and a Canadian professional —
same Appendix 2, same credential requirements — and the *procedural* burden is not. A Mexican
applicant faces a consular adjudication before travel, with all the § 1184(b) presumption and
§ 1201(g) refusal machinery that entails; a Canadian faces a CBP officer at the border. Encode
the extra consular step as a real `procedural` criterion on the US-side pathway. It has no
analogue on the Canadian side of `ca.ts`.

**No numerical limit remains.** 8 U.S.C. § 1184(e) is *headed* "Nonimmigrant professionals and
annual numerical limit", but the operative text contains no limit — only (e)(1), the admission
provision, and (e)(2), E-spouse work authorisation. The heading is a vestige of the expired
NAFTA-era Mexican cap. 8 CFR 214.6 likewise imposes none. **Do not encode a cap on Mexican TN
admissions**, and be alert that older secondary sources still describe one.

**Periods.** 8 CFR 214.6(e): admitted "for a period not to exceed three years", document marked
"multiple entry". 8 CFR 214.6(h)(1)(iii): extensions "for a maximum period of three years"
each; (h)(1)(iv): "There is no specific limit on the total period of time an alien may be in TN
status" provided the person continues to qualify and maintains status. (h)(2): a person may
alternatively leave and seek a fresh three-year admission at a port of entry.

**TN is not dual intent.** 8 CFR 214.6(b) defines temporary entry as "entry without the intent
to establish permanent residence" and requires the applicant to satisfy the officer that the
assignment "will end at a predictable time and that he or she will depart upon completion".
8 U.S.C. § 1184(h) — which neutralises the effect of a pending immigrant petition — lists
H-1B/H-1C, L and V, and **does not list TN**. There is no TN analogue of 8 CFR
214.2(h)(16)(i) or (o)(13). 9 FAM 402.17-7 nonetheless tempers it: "An intent to immigrate in
the future that is in no way connected to the proposed immediate trip need not in itself result
in a finding that the immediate trip is not temporary. Repeated renewal of a TN visa that leads
to extended stay in the United States, may still be temporary, if there is no immediate intent
to immigrate." Encode the temporariness criterion `discretionary: true`, and prefer human
review over a verdict.

**Self-employment is excluded.** 8 CFR 214.6(b): the classification "does not authorize the
establishment of a business or practice in the United States in which the professional will be,
in substance, self-employed", and a professional "will be deemed to be self-employed if he or
she will be rendering services to a corporation or entity of which the professional is the sole
or controlling shareholder or owner". The `jobOffer.selfEmployment` fact already models this.

**Licensure is not an entry requirement.** 9 FAM 402.17-4(B): US licensure "is a post-entry
requirement" and classification "must not be denied based solely on the fact that the applicant
does not already hold a license". The one carve-out is nursing — 22 CFR 40.53(a) requires a
CGFNS or equivalent certificate. Encode the nursing exception; do not encode a general
licensure criterion.

**Mexican credential evidence, specifically.** 9 FAM 402.17-5(C)(a)(1): a Mexican citizen may
present a *cédula profesional* (federal SEP or state-issued) or a *título*; a **carta de
pasante is expressly insufficient** because it attests only to completed coursework, not to
completion of the licenciatura. This is a precise, citable, Mexico-specific evidentiary rule and
belongs in `guidance`.

**Where a specific degree is required, experience cannot substitute** — 9 FAM 402.17-5(C)(c),
echoing 402.17-4(A)(b). Where the Appendix entry itself offers an alternative (post-secondary
diploma plus three years, or a state/provincial licence), that alternative is treaty text, not
discretion — same treatment as the existing `ca.ts` encoding.

### 4.2 H-1B — specialty occupation

**Definition.** 8 U.S.C. § 1184(i)(1): a "specialty occupation" is an occupation that requires
"theoretical and practical application of a body of highly specialized knowledge" and
"attainment of a bachelor's or higher degree in the specific specialty (or its equivalent) as a
minimum for entry into the occupation in the United States."

**The cap.** § 1184(g)(1)(A)(vii): 65,000 per fiscal year. § 1184(g)(5): the cap does not apply
to a beneficiary employed at (A) an institution of higher education or a related or affiliated
nonprofit, (B) a nonprofit or governmental research organisation, or (C) who "has earned a
master's or higher degree from a **United States** institution of higher education … until the
number of aliens who are exempted … exceeds **20,000**." Note (C): a foreign master's does not
qualify for the advanced-degree exemption.

**Maximum stay.** § 1184(g)(4): "the period of authorized admission as such a nonimmigrant may
not exceed 6 years." Initial petition validity up to three years — 8 CFR
214.2(h)(9)(iii)(A)(1), "but may not exceed the validity period of the labor condition
application".

**Dual intent.** § 1184(h): being the beneficiary of a preference petition "shall not constitute
evidence of an intention to abandon a foreign residence" for H-1B, L or V. Reinforced by 8 CFR
214.2(h)(16)(i). H-1B is genuinely dual-intent; TN is not. Do not generalise.

**⚠️ The selection is no longer a flat lottery — see [§7.2](#72-h-1b-selection-is-now-weighted-by-wage-level-already-in-force).**

### 4.3 L-1 — intracompany transferee

8 CFR 214.2(l)(1)(ii) definitions, verbatim in the key parts:

- **Managerial capacity** — an assignment in which the employee primarily manages the
  organisation or a department/subdivision/function; supervises other supervisory,
  professional or managerial employees **or** manages an essential function; has authority to
  hire and fire (or, if supervising nobody, "functions at a senior level within the
  organizational hierarchy or with respect to the function managed"); and "exercises discretion
  over the day-to-day operations".
- **Executive capacity** — primarily directs management of the organisation or a major
  component; establishes goals and policies; "exercises wide latitude in discretionary
  decision-making"; receives only general supervision.
- **Specialized knowledge** — "special knowledge possessed by an individual of the petitioning
  organization's product, service, research, equipment, techniques, management, or other
  interests and its application in international markets, or an advanced level of knowledge or
  expertise in the organization's processes and procedures."

**Periods.** Initial petition up to three years; **one year** where the beneficiary is coming
to open or be employed in a **new office** (8 CFR 214.2(l)(7)(i)(A)(3)). Extensions in
increments of up to two years. Maximum total: **five years** specialized knowledge (L-1B),
**seven years** managerial or executive (L-1A) — 8 CFR 214.2(l)(12)(i) and (l)(15)(ii). Time in
H counts toward the same ceilings.

Every one of the three definitions above turns on an adjudicator's characterisation of a job.
`discretionary: true`, weight `material`, route to human review.

### 4.4 O-1 — extraordinary ability

8 CFR 214.2(o)(3)(ii): "**Extraordinary ability in the field of science, education, business, or
athletics** means a level of expertise indicating that the person is one of the small percentage
who have arisen to the very top of the field of endeavor." For the arts the standard is lower —
"**Extraordinary ability in the field of arts** means distinction", defined as "a high level of
achievement … substantially above that ordinarily encountered". For film and television the
standard is "extraordinary achievement", "a very high level of accomplishment".

Three different standards in one classification. An encoder who writes a single O-1 criterion
will be wrong for two of the three.

O-1 carries a dual-intent-like protection at 8 CFR 214.2(o)(13): approval of a permanent labor
certification or filing of a preference petition "shall not be a basis for denying an O-1
petition … The alien may legitimately come to the United States for a temporary period as an
O-1 nonimmigrant and depart voluntarily at the end of his or her authorized stay and, at the
same time, lawfully seek to become a permanent resident."

This is the most discretionary classification in this brief. `discretionary: true` without
exception.

### 4.5 E-1 treaty trader and E-2 treaty investor

**Mexico qualifies for both.** 9 FAM 402.9's treaty country table lists:

| Country | Classification | Effective date |
|---|---|---|
| Mexico | E-1 | 01/01/1994 |
| Mexico | E-2 | 01/01/1994 |

The 1 January 1994 date is NAFTA's entry into force; the entitlement continues under USMCA
(9 FAM 402.9-4(A) contemplates a qualifying treaty "or … legislation enacted to extend that
same privilege", and USMCA Annex 16-A Section B covers Traders and Investors). **A Mexican
national is a treaty national for E purposes.** This is worth encoding explicitly because a
reader has no way to know it and many "who can get an E-2" lists are wrong.

**The standards are expressly judgement-laden.** 9 FAM 402.9-2(b):

> Although this classification mandates compliance with a lengthy list of requirements, many of
> these standards are subject to the exercise of a great amount of judgment and discretion.

8 CFR 214.2(e)(14), **substantial trade**: "an amount of trade sufficient to ensure a continuous
flow of international trade items … This continuous flow contemplates numerous transactions over
time. Treaty trader status may not be established or maintained on the basis of a single
transaction … **There is no minimum requirement with respect to the monetary value or volume of
each individual transaction.**"

8 CFR 214.2(e)(14), **substantial amount of capital**: an amount "(i) Substantial in relationship
to the total cost of either purchasing an established enterprise or creating the type of
enterprise under consideration; (ii) Sufficient to ensure the treaty investor's financial
commitment …; and (iii) Of a magnitude to support the likelihood that the treaty investor will
successfully develop and direct the enterprise." Plus 8 CFR 214.2(e)(15): the enterprise "may not
be marginal", i.e. must have present or future capacity to generate more than a minimal living.

**There is no dollar threshold for E-2 anywhere in the statute or the regulation.** Any figure a
secondary source gives you is invented. Do not encode one. Encode the proportionality test as
`discretionary: true` with `requiresHumanReview`.

**Nationality of the enterprise.** 9 FAM 402.9-4(B): nationality of a business is determined by
the nationality of its individual owners; country of incorporation is irrelevant. Where treaty
country ownership is diffuse, owners of treaty nationality must "together … own 50 percent of
the U.S. enterprise" and collectively be able to develop and direct it. Shares held by US LPRs
cannot count toward the nationality calculation.

**Intent.** 9 FAM 402.9-4(C): an E applicant "need not establish intent to proceed to the United
States for a specific temporary period, nor … have a residence in a foreign country which the
applicant does not intend to abandon"; an "unequivocal intent to depart … upon termination of E
status is normally sufficient". E is therefore materially easier on intent than B, F or TN — and
9 FAM 402.2-2(C) confirms the residence-abroad requirement applies only to "B, F, H (except
H-1), J, M, O-2, P, and Q".

### 4.6 F-1, OPT and STEM OPT

**Practical training generally.** 8 CFR 214.2(f)(10): available to an F-1 lawfully enrolled full
time for one full academic year. "A student may be authorized **12 months of practical training,
and becomes eligible for another 12 months of practical training when they change to a higher
educational level.**" English-language-training students are ineligible. Two types: curricular
(CPT, (f)(10)(i)) and optional (OPT, (f)(10)(ii)). A student with one year or more of full-time
CPT is ineligible for post-completion OPT.

**The 24-month STEM extension** — 8 CFR 214.2(f)(10)(ii)(C). Requirements, each a separate
sub-paragraph and each a candidate criterion:

| Sub-paragraph | Requirement |
|---|---|
| (C)(1) | Degree from a US institution accredited by a Department of Education-recognised agency |
| (C)(2) | Bachelor's, master's or doctoral degree in a field on the **STEM Designated Degree Program List**, maintained by SEVP |
| (C)(3) | If based on a previously obtained degree, that degree must have been conferred within the **10 years** preceding the DSO recommendation |
| (C)(4) | The training opportunity must be directly related to the qualifying degree |
| (C)(5) | The employer "is enrolled in **E-Verify**" |
| (C)(7) | A **Form I-983** training plan, executed by student and employer, identifying goals, performance evaluation and oversight |
| — | Terms and conditions "commensurate with" those for similarly situated US workers; **no fewer than 20 hours per week** |

"In no event may a student be authorized for more than two lifetime STEM OPT extensions."

**Unemployment limits** — 8 CFR 214.2(f)(10)(ii)(E): no more than an aggregate of **90 days** of
unemployment during post-completion OPT; students granted the 24-month extension may not accrue
more than an aggregate of **150 days** across the total OPT period. These are day-counts against
thresholds; they are civil-date arithmetic and belong in `derived` if ever computed.

The regulatory history (81 FR 13040, 11 March 2016, effective 10 May 2016) confirms the 24-month
figure replaced a previous 17-month extension and that the rule "retains the 90-day maximum …
but allows an additional 60 days (for a total of 150 days)".

**⚠️ The F-1 admission period changes on 15 September 2026 — see [§7.1](#71-f-j-and-i-move-from-duration-of-status-to-a-fixed-period-effective-2026-09-15).
This is not cosmetic; it changes when unlawful presence starts accruing.**

### 4.7 B-1/B-2 and the Mexican border crossing card

**The classification.** 8 U.S.C. § 1101(a)(15)(B); 22 CFR 41.31; 9 FAM 402.2. B-1 for business,
B-2 for pleasure, B-1/B-2 for both.

**The test** — 9 FAM 402.2-2(B)(a)(1). The officer must assess whether the applicant:

> (a) Have a residence in a foreign country, which they do not intend to abandon;
> (b) Intend to enter the United States for a period of specifically limited duration; and
> (c) Seek admission for the sole purpose of engaging in legitimate activities relating to
> business or pleasure.

Failure on any one is a refusal under INA § 214(b). And 9 FAM 402.2-2(B)(b): "If you doubt an
applicant's intent to return abroad, the applicant cannot satisfy your doubts by offering to
leave a child, spouse, or other dependent abroad."

"Temporary" is undefined: 9 FAM 402.2-2(D)(a) — "although 'temporary' is not specifically defined
by either statute or regulation, it generally signifies a limited period of stay", and the
question is "not … the absolute length of the stay, but … whether the stay has some finite limit."

**The Mexico-specific instrument: the Border Crossing Card.** 9 FAM 402.2-7(A):

> The BBBCC is issued as the default B-1/B-2 visa at all consular sections in Mexico. A valid
> Mexican passport is required at the time of application. … The BCC aspect of a BBBCC or BBBCV
> can still be used for land border entry without a passport within the border zone (25 miles in
> TX and CA; 55 miles in NM; and 75 miles in AZ) for up to 30 days.

Issuable to someone who is "a citizen **and resident** of Mexico", is physically present at a
designated US consular office in Mexico, and seeks entry as a temporary visitor "for periods of
stay not exceeding six months". Residency abandonment is a revocation ground.

This is the single most widely held US travel document among Mexican nationals and the catalog
would be conspicuously incomplete without it. Note carefully: the *card* privileges (no passport,
border zone, 30 days) are narrower than the *visa* privileges (anywhere, up to six months as
admitted). Conflating them would misdescribe what a reader is actually holding.

---

## 5. The bars and inadmissibility grounds

This is the section that most changes outcomes for a Mexican audience, and the one where
confident misinformation is thickest. All quotations below are from the statute as fetched.

### 5.1 What counts as unlawful presence

8 U.S.C. § 1182(a)(9)(B)(ii):

> For purposes of this paragraph, an alien is deemed to be unlawfully present in the United
> States if the alien is present in the United States after the expiration of the period of stay
> authorized by the Attorney General or is present in the United States without being admitted
> or paroled.

9 FAM 302.11-3(A): the ground reaches presence "since **April 1, 1997**", and 9 FAM
302.11-3(B)(2)(a)(1) confirms "the statute is not retroactive. Periods before April 1, 1997 …
cannot be counted."

Periods DHS treats as *authorised* despite the I-94 having expired (9 FAM 302.11-3(B)(1)(b)) —
each of these is a fact an encoder may need:

- Admission for **duration of status** (historically A, G, F, J, I): unlawful presence accrues
  only from the day *after* a formal finding of a status violation by DHS, an IJ or the BIA —
  **and see [§7.1](#71-f-j-and-i-move-from-duration-of-status-to-a-fixed-period-effective-2026-09-15), which removes this shelter for F, J and I.**
- Voluntary departure under INA § 240B, if the person departs on terms.
- A pending, timely-filed, nonfrivolous extension or change of status application, with no
  unauthorised employment — statutorily tolled for up to 120 days by § 1182(a)(9)(B)(iv), but
  DHS by policy treats the **entire pendency** as authorised where the application was filed
  before the I-94 expired, was nonfrivolous, and there was no unauthorised employment.
- A properly filed adjustment application, for its whole processing period, even if later
  denied or abandoned (subject to the "defensive filing" carve-out).
- Temporary Protected Status; deferred action.

Counting mechanics (9 FAM 302.11-3(B)(1)(f)): "the actual date that the Form I-94 (or any
extension) expires is authorized and is not counted. In addition, the date of departure from
the United States is not counted as unlawful presence." **That is two exclusive endpoints in a
repository whose `DateRange` is closed and inclusive at both ends.** Anyone computing unlawful
presence must handle this deliberately; it is precisely the off-by-one class the civil-date
invariant exists for.

### 5.2 The three-year and ten-year bars — § 1182(a)(9)(B)(i)

> Any alien (other than an alien lawfully admitted for permanent residence) who —
> (I) was unlawfully present in the United States for a period of more than 180 days but less
> than 1 year, voluntarily departed the United States … **prior to the commencement of
> proceedings** under section 1225(b)(1) … or section 1229a …, and again seeks admission within
> **3 years** of the date of such alien's departure or removal, or
> (II) has been unlawfully present in the United States for **one year or more**, and who again
> seeks admission within **10 years** of the date of such alien's departure or removal from the
> United States,
> is inadmissible.

Five points encoders get wrong:

1. **Departure is the trigger.** Neither bar operates while the person remains inside. 9 FAM
   302.11-3(B)(2)(a)(3): "Both provisions are triggered by departure from the United States, and
   the bar against reentry applies from the date of departure." This is why the consular route is
   dangerous and the adjustment route, where available, is not.
2. **The three-year bar has an extra condition the ten-year bar lacks**: voluntary departure
   *before proceedings commenced*. 9 FAM 302.11-3(B)(2)(b): a person unlawfully present 180 days
   to a year who was placed in proceedings before departing "would **not** be ineligible under the
   three-year bar". The ten-year bar has no such limitation (9 FAM 302.11-3(B)(2)(c)).
3. **Periods do not aggregate across trips.** 9 FAM 302.11-3(B)(2)(a)(2): "Neither of the …
   time frames is cumulative across trips. The unlawful presence must occur in the same trip …
   However, separate periods of unlawful presence occurring during the same overall period of
   stay … should be added together."
4. **A departure under advance parole is not a "departure" for this purpose** — *Matter of
   Arrabally and Yerrabelly*, 25 I&N Dec. 771 (BIA 2012), adopted at 9 FAM 302.11-3(B)(2)(d).
   `kind: 'case_law'`.
5. **Exceptions** — § 1182(a)(9)(B)(iii): time under **18 years of age** is not counted; time with
   a bona fide asylum application pending is not counted unless the person worked without
   authorisation; family unity beneficiaries; battered women and children; and a person who shows a
   severe form of trafficking "was at least one central reason for the alien's unlawful presence".
   The minor exception is a bright line and safely encodable. The others touch
   [excluded scope](#9-scope-exclusions-and-how-to-name-them) — name their existence, do not build
   routes on them.

### 5.3 The permanent bar — § 1182(a)(9)(C)

> Any alien who —
> (I) has been unlawfully present in the United States for an aggregate period of more than
> 1 year, or
> (II) has been ordered removed …,
> and who **enters or attempts to reenter** the United States **without being admitted** is
> inadmissible.

Differences from (B), all of them material:

- **(C) aggregates.** "aggregate period of more than 1 year" across the whole history. (B) does
  not aggregate across trips. This is the opposite rule and it is easy to state backwards.
- **The trigger is the unlawful re-entry, not the departure.** The person must go back in (or try
  to) without admission.
- **The (B)(iii) exceptions do not apply.** 9 FAM 302.11-4(B)(1)(a): "the exceptions for 9B …
  do not apply to 9C."
- **A false claim to US citizenship at a port of entry can be the triggering "attempted entry
  without admission"**, because citizens are not subject to inspection — 9 FAM 302.11-4(B)(1)(b).
- **Timing:** the aggregate year must have accrued after 1 April 1997, but a prior removal
  supporting the (C)(i)(II) limb "may have occurred at any time". The triggering entry or attempt
  must post-date 1 April 1997.
- **Relief:** § 1182(a)(9)(C)(ii) — the bar "shall not apply to an alien seeking admission **more
  than 10 years after** the date of the alien's last departure" if the Secretary has consented to
  reapplication (Form I-212). 9 FAM 302.11-4(D)(1) is blunt: the person "is permanently
  ineligible" and may seek consent only "after ten years". There is **no § 1182(a)(9)(C) waiver of
  general application** — the only statutory waiver, at (C)(iii), is for VAWA self-petitioners,
  which is out of scope here.

**Practical consequence to surface, without predicting an outcome:** the common pattern of
accruing more than a year unlawfully, being removed or departing, and then re-entering without
inspection is the pattern § 1182(a)(9)(C) exists to catch, and it does not have a waiver route
comparable to the provisional waiver. A checker that treats it as "a bar like the others" is
misleading. State the structure and route to counsel.

### 5.4 Waivers

**§ 1182(a)(9)(B)(v) — the unlawful presence waiver.** Read the qualifying relationships twice:

> The Attorney General has sole discretion to waive clause (i) in the case of an immigrant who is
> the **spouse or son or daughter of a United States citizen or of an alien lawfully admitted for
> permanent residence**, if it is established … that the refusal of admission to such immigrant
> alien would result in **extreme hardship to the citizen or lawfully resident spouse or parent of
> such alien**. No court shall have jurisdiction to review a decision or action by the Attorney
> General regarding a waiver under this clause.

Two distinct relationship tests, and neither includes a child as the hardship-bearer:

- The **applicant** must be the spouse, son or daughter of a USC or LPR.
- The **hardship** must be to a USC or LPR **spouse or parent** of the applicant.

**A United States citizen child does not create a qualifying relative for this waiver.** This is
one of the most widespread and most damaging misunderstandings in this corridor. Encode the
qualifying relationship precisely, or omit the waiver entirely.

Note also "**sole discretion**" and the express bar on judicial review. `discretionary: true`, and
the criterion cannot be `blocking` in the positive direction — satisfying the relationship does not
produce a waiver.

**8 CFR 212.7(e) — the provisional waiver (Form I-601A).** Lets an applicant obtain the
§ 1182(a)(9)(B) waiver **before** departing for the consular interview, which is what makes
consular processing survivable for some people. Requirements from the regulation:

- Physically present in the United States at filing, and appears for biometrics;
- At least **17 years of age**;
- Beneficiary of an approved I-130, I-140, or a DV selection (9 FAM 302.11-3(D)(1)(b)(2)(a)(iii)
  adds that fiancé(e) beneficiaries are ineligible);
- A case pending with the Department of State for which the immigrant visa processing fee has been
  paid;
- Inadmissible **solely** under § 1182(a)(9)(B)(i)(I) or (II) — this waiver reaches nothing else;
- Will depart to obtain the immigrant visa;
- Has a USC or LPR spouse or parent who would suffer extreme hardship, and merits a favourable
  exercise of discretion.

Ineligible if in removal proceedings that are not administratively closed, subject to a final
removal order (absent prior consent to reapply), subject to a reinstated order, or with a pending
adjustment application.

And 8 CFR 212.7(e)(12): the approved waiver "does not take effect unless, and until" the applicant
departs, appears for the interview, and is found otherwise eligible. **Approval does not guarantee
a visa**, and 9 FAM 302.11-3(D)(1)(b)(1) adds that if the consular officer identifies any other
ground of inadmissibility "the approved Form I-601-A is no longer valid".

**§ 1182(d)(3)(A) — the nonimmigrant waiver.** For nonimmigrant applicants, most inadmissibility
grounds may be waived "in the discretion of the Attorney General" on a recommendation from the
consular officer or Secretary of State. Broad in reach, entirely discretionary, no entitlement.

**Prior removal — § 1182(a)(9)(A)** and consent to reapply (Form I-212): 5 years for an arriving
alien removed under § 1225(b)(1) or at the end of § 1229a proceedings initiated on arrival;
10 years for other removals or departure under an outstanding order; 20 years for a second or
subsequent removal; permanent for an aggravated felony conviction. § 1182(a)(9)(A)(iii) allows
prior consent to reapply. A useful wrinkle from 9 FAM 302.11-2(B)(2): the 10-year clock "must be
spent outside of the United States but does not need to be served consecutively" — it pauses while
the person is inside without a waiver and resumes on departure, and "does not reset with each entry
or departure".

### 5.5 Other grounds worth encoding

| Ground | Provision | Character |
|---|---|---|
| Present without admission or parole | § 1182(a)(6)(A)(i) | Bright line; also the § 1255(a) blocker |
| Fraud or wilful misrepresentation of a material fact to procure a visa or benefit | § 1182(a)(6)(C)(i) | Materiality is judgement; waiver at § 1182(i) for USC/LPR spouse or parent |
| **False claim to US citizenship** | § 1182(a)(6)(C)(ii) | Effectively permanent; the general § 1182(i) waiver does **not** reach it. Treat as counsel-only |
| Labor certification | § 1182(a)(5)(A) | Requires DOL to certify that there are not sufficient able, willing, qualified and available US workers and that employment "will not adversely affect the wages and working conditions of workers in the United States similarly employed" |
| **Public charge** | § 1182(a)(4) | "in the opinion of" the officer, "likely at any time to become a public charge". Mandatory factors: age; health; family status; assets, resources and financial status; education and skills. An affidavit of support under § 1183a **may** also be considered — and **is required** for family-sponsored and immediate-relative cases by § 1182(a)(4)(C). **See [§7.3](#73-public-charge-the-2022-regulatory-framework-is-rescinded-effective-2026-09-18).** |

---

## 6. Statutory vs regulatory vs policy — the `discretionary` decision table

The rule for this repository: `discretionary: true` when the requirement rests on adjudicator
judgement, administrative practice, or published guidance rather than a threshold Congress or a
regulation actually fixed. US practice is thick with the former. When in doubt, set it.

| Requirement | Source layer | `discretionary` | Why |
|---|---|---|---|
| 65,000 H-1B cap; 20,000 advanced-degree exemption | Statute § 1184(g)(1)(A), (g)(5)(C) | `false` | Fixed numbers |
| H-1B 6-year maximum | Statute § 1184(g)(4) | `false` | Fixed |
| H-1B **selection** among registrants | Regulation 8 CFR 214.2(h)(8)(iii) | `true` | Weighted random process; outcome is chance, not eligibility. Never encode a probability |
| "Specialty occupation" | Statute § 1184(i)(1) defines it; USCIS applies it | `true` | Definition is qualitative; application is contested |
| TN profession is on Appendix 2 | Treaty + Regulation 8 CFR 214.6(c) | `false` | Enumerated list with enumerated credentials |
| TN "temporary entry" / no intent to reside permanently | Regulation 8 CFR 214.6(b) + guidance 9 FAM 402.17-7 | `true` | State of mind assessed by an officer |
| TN self-employment exclusion | Regulation 8 CFR 214.6(b) | `false` | Definitional, with a stated ownership test |
| Mexican TN applicant needs a visa | Regulation 8 CFR 214.6(d)(1) | `false` | Categorical |
| L-1 managerial / executive / specialized knowledge | Regulation 8 CFR 214.2(l)(1)(ii) | `true` | Definitions describe a job's character |
| L-1 5-year / 7-year ceilings | Regulation 8 CFR 214.2(l)(12)(i) | `false` | Fixed |
| O-1 extraordinary ability | Regulation 8 CFR 214.2(o)(3)(ii) | `true` | "small percentage … very top of the field" |
| E-2 "substantial amount of capital" | Regulation 8 CFR 214.2(e)(14) | `true` | Expressly proportional, no minimum |
| E-1 "substantial trade" | Regulation 8 CFR 214.2(e)(14) | `true` | "no minimum requirement" in terms |
| Mexico is an E-1/E-2 treaty country | Guidance 9 FAM 402.9-10 table | `false` | A list, and Mexico is on it |
| OPT 12 months per educational level; STEM 24 months; 90/150 unemployment days | Regulation 8 CFR 214.2(f)(10) | `false` | Fixed periods |
| E-Verify enrolment; I-983; STEM list membership | Regulation 8 CFR 214.2(f)(10)(ii)(C)(2), (5), (7) | `false` | Binary facts |
| B-1/B-2 residence abroad not intended to be abandoned | Statute § 1101(a)(15)(B) + guidance 9 FAM 402.2-2 | `true` | Classic § 214(b) judgement |
| Unlawful presence >180 days / ≥1 year | Statute § 1182(a)(9)(B)(i) | `false` | Day counts against fixed thresholds |
| Which periods count as "authorized stay" | Statute (partly) + DHS policy via 9 FAM 302.11-3(B)(1) | `true` | The tolling beyond 120 days is policy, not statute |
| § 1182(a)(9)(B)(v) qualifying relationship | Statute | `false` | Enumerated relationships |
| § 1182(a)(9)(B)(v) "extreme hardship" and the grant | Statute — "sole discretion" | `true` | Named as discretion in the text; no judicial review |
| I-601A provisional waiver eligibility conditions | Regulation 8 CFR 212.7(e)(3)–(4) | `false` for the conditions | Objective gates |
| I-601A grant | Regulation + discretion | `true` | Merits a favourable exercise of discretion |
| Adjustment of status grant | Statute § 1255(a) — "in his discretion" | `true` | Named in the text |
| § 1255(a) three conditions; § 1255(c) bars; § 1255(k) 180 days; § 1255(i) dates | Statute | `false` | Objective |
| Public charge determination | Statute § 1182(a)(4) — "in the opinion of" | `true` | And more so from 2026-09-18; see §7.3 |
| Priority dates, cut-offs, waits | Monthly administrative publication | **do not encode at all** | Not a stable fact of any kind |

---

## 7. Live and pending changes encoders must know

All three of these post-date most training data and most secondary sources. Two take effect
after the date of this brief. Encode against the law **as at the date the pathway is asserted
to describe**, use `openedOn` / `closedOn` where a route's availability actually changes, and
put the effective date in the `note` where a criterion's content changes.

### 7.1 F, J and I move from duration of status to a fixed period — effective 2026-09-15

| Field | Value |
|---|---|
| Title | Establishing a Fixed Time Period of Admission and an Extension of Stay Procedure for Nonimmigrant Academic Students, Exchange Visitors, and Representatives of Foreign Information Media |
| Citation | **91 FR 44976**, published 17 July 2026 (pages 44976–45131) |
| Effective | **15 September 2026** |
| Amends | 8 CFR parts 214, 248, 274 |
| Status caveat | "This rule has been classified as a **major rule subject to congressional review**… if the effective date has been changed, DHS will publish a document in the Federal Register to establish the actual effective date or to terminate the rule." |

The eCFR text of 8 CFR 214.1 and 214.2 as at 2026-07-23 carries an editorial "Link to an
amendment published at 91 FR 45122 / 91 FR 45124, July 17, 2026" — i.e. the amendment is
published but **not yet incorporated**. Anything an encoder reads in the current CFR text for
F, J or I is the pre-change rule.

New 8 CFR 214.2(f)(5)(i), as it will read:

> An F-1 student is admitted for a fixed period of time, which is the period necessary to
> complete the course of study indicated on the Form I-20, or successor form, **not to exceed a
> period of 4 years**, plus additional times noted in this paragraph…

With: up to 30 days before the report/program start date; an additional 30 days after; neither
counting toward the maximum. Exceptions include English-language-training students (24 months
maximum) and F-1 students at a public high school (aggregate 12 months).

**Why this matters far beyond students.** Under the existing regime, a person admitted for
duration of status accrues **no** unlawful presence until DHS, an IJ or the BIA makes a formal
finding of a status violation (9 FAM 302.11-3(B)(1)(b)(2) and (d)). A fixed admission date
removes that shelter: presence past the date is presence "after the expiration of the period of
stay authorized" and accrues automatically under § 1182(a)(9)(B)(ii). The bars in §5 therefore
become reachable for F, J and I holders in a way they largely were not.

**Instruction:** do not encode the fixed-period rule as current law today; do not encode the
duration-of-status shelter as permanent either. If an F-1 pathway is written now, cite the
current 8 CFR 214.2(f)(5) and add a `note` recording 91 FR 44976 and its 15 September 2026
effective date and the congressional-review caveat. Flag the pathway for re-verification in
September.

### 7.2 H-1B selection is now weighted by wage level — already in force

| Field | Value |
|---|---|
| Title | Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions |
| Citation | **90 FR 60864**, published 29 December 2025 |
| Effective | **27 February 2026** |
| Codified at | 8 CFR 214.2(h)(8)(iii)(A)(4)(ii) |

The current codified text, verbatim:

> **Weighted selection.** If a random selection is necessary, USCIS will assign each unique
> beneficiary to the lowest OEWS wage level among all registrations submitted on the
> beneficiary's behalf and will enter each unique beneficiary into the selection pool in a
> weighted manner as follows: a beneficiary assigned wage level IV will be entered into the
> selection pool four times, a beneficiary assigned wage level III will be entered into the
> selection pool three times, a beneficiary assigned wage level II will be entered into the
> selection pool two times, and a beneficiary assigned wage level I will be entered into the
> selection pool one time.

The registration requirement itself (8 CFR 214.2(h)(8)(iii)(A)(1)) and beneficiary-centric
counting are unchanged; what changed is that selection is no longer uniform. **Every source
that describes the H-1B cap as "a random lottery" is now inaccurate.** Describe it as a
weighted random selection, cite the paragraph, and — per this repository's rules — **never
express a chance of selection as a number.** It is a prediction of outcome and it is banned.

### 7.3 Public charge: the 2022 regulatory framework is rescinded — effective 2026-09-18

| Field | Value |
|---|---|
| Title | Public Charge Ground of Inadmissibility |
| Citation | **91 FR 45324**, published 20 July 2026 |
| Effective | **18 September 2026** |
| Effect | Removes 8 CFR 212.21 (definitions), 212.22 (the determination framework), 212.23 (exemptions and waivers) |
| Transition | "This rule applies to applications for admission made on or after September 18, 2026 or applications for adjustment of status postmarked or electronically submitted on or after September 18, 2026. Receipt of means-tested public benefits before September 18, 2026 will be considered consistently with the 2022 Final Rule." |

DHS describes the change as "moving away from a bright line primary dependence standard" and
restoring "ultimate discretion for officers to consider not just the minimum statutory factors
but also any other information the officer deems relevant".

**Encoding consequence.** After 18 September 2026 the only durable citations for public charge
are the **statute** — § 1182(a)(4)(A) and the mandatory factors in (a)(4)(B)(i), plus the
affidavit-of-support requirements in (a)(4)(C)–(D) and § 1183a. The regulatory definitions an
encoder might reach for are being deleted. Any public-charge criterion must be
`discretionary: true` with a note that the determination is a totality-of-the-circumstances
judgement with no bright line. Do not encode benefit-by-benefit rules.

### 7.4 A presidential proclamation restricting H-1B entry — in force, expiring 2026-09-21 absent extension

| Field | Value |
|---|---|
| Title | Restriction on Entry of Certain Nonimmigrant Workers |
| Citation | **90 FR 46027**, 24 September 2025 |
| Authority | INA §§ 212(f) and 215(a) (8 U.S.C. §§ 1182(f), 1185(a)) |
| Effective | 12:01 a.m. EDT, **21 September 2025** |

Section 1(a), verbatim in the operative part:

> the entry into the United States of aliens as nonimmigrants to perform services in a specialty
> occupation under section 101(a)(15)(H)(i)(b) of the INA … is restricted, except for those
> aliens whose petitions are accompanied or supplemented by a payment of **$100,000** … This
> restriction shall expire, absent extension, **12 months after the effective date** …

Section 1(b) limits it to beneficiaries "who are currently outside the United States". Section
3(a): it applies "only to aliens who enter or attempt to enter the United States after the
effective date". Section 1(c) permits DHS to exempt an individual, a company or an industry in
its discretion on national-interest grounds.

On its own terms the restriction expires on or about **21 September 2026**, absent extension.

> **⚠️ Handle with care.** I searched the Federal Register for any subsequent presidential
> document extending, amending or revoking it and found none as at 2026-07-26. I could **not**
> establish its litigation status — see [§10](#10-what-i-could-not-establish). If any H-1B
> pathway is encoded, the payment restriction should be surfaced as `information` with the
> proclamation cited, the 12-month expiry stated, and an explicit note that its current
> operative status and any judicial treatment must be checked before reliance. Do not encode it
> as a `blocking` criterion.

---

## 8. What this means for the existing catalog

### 8.1 `cusma-professions.ts` is two professions short, and US law can close the gap

The file's own header says the table is deliberately a subset because "only entries whose title
and credential requirement could be stated with confidence are included", and routes an
unrecognised occupation to human review rather than to a negative finding. That design decision
is right and should stay.

But the confidence problem is now solvable from a **primary United States source**: **8 CFR
214.6(c) reproduces the whole of Appendix 2 to Annex 16-A verbatim**, under the heading
"Appendix 2 to Annex 16-A of Chapter 16 (Annotated)", with each profession's minimum
requirement and the definitional footnotes for "state/provincial license", "Post-Secondary
Diploma" and "Post-Secondary Certificate".

Counts, from that regulation:

| Group | Entries |
|---|---|
| General | 25 |
| Medical/Allied Professional | 12 |
| Scientist | 23 |
| Teacher (College, Seminary, University) | 3 |
| **Total** | **63** |

`CUSMA_PROFESSIONS` currently holds **61**. The two General entries absent from the repository
table are:

- **Range Manager / Range Conservationist** — Baccalaureate or Licenciatura Degree.
- **Sylviculturist (including Forestry Specialist)** — Baccalaureate or Licenciatura Degree.

Adding them is a change to a shared file used by the Canadian pathway, so it belongs to whoever
owns that file, not to a US-pathway encoder acting alone. Flag it; do not race for it.

### 8.2 Facts the US routes need that `ApplicantFacts` does not currently model

`KNOWN_FACT_ROOTS` is a closed list and `facts.ts` is shared by every jurisdiction, so **do not
unilaterally add roots**. These are the gaps I can see; raise them once, together, rather than
four times separately:

- **Manner of last entry** — "inspected and admitted", "paroled", or "entered without
  inspection". `ImmigrationStatus` has `irregular`, but that describes the *current* state, not
  the *manner of entry*, and § 1255(a) turns on the latter. Without this, no adjustment-of-status
  criterion can be written honestly.
- **Authorised period of stay end date** (the I-94 admit-until date), distinct from
  `statusExpiresOn` if that is being read as visa validity — see [§1.3](#13-visa-admission-status-benefit).
- **Unlawful presence periods**, as `DateRange`s, so §5 thresholds can be measured rather than
  asserted. Note the exclusive endpoints described in [§5.1](#51-what-counts-as-unlawful-presence).
- **Prior removal / voluntary departure events** with dates — § 1182(a)(9)(A) and (C).
  `travelHistory.priorRemovals` is a count, which cannot answer "when did the clock start".
- **Qualifying relatives** — the relationship *and* the relative's status (USC or LPR), for
  § 1182(a)(9)(B)(v) and 8 CFR 212.7(e). `nationalities` describes the applicant only.
- **Priority date** — needed only to say "your date is recorded"; **never** to compare against a
  cut-off.

Until these exist, US criteria that depend on them must evaluate to `unknown`, which the
three-valued evaluator surfaces as indeterminate. That is the correct behaviour and far better
than a proxy.

### 8.3 Reusing what is already there

- `jobOffer.occupationTaxonomy` already admits `'cusma_appendix_2'`, and the US side uses the
  identical Appendix 2. TN pathways should reuse it rather than inventing a US taxonomy.
- `EDUCATION_SCALE` already places `professional_degree` above `bachelor`, which is what the
  Appendix 2 entries requiring a specific professional degree need.
- `intent.temporary` is already the fact for the § 1184(b) presumption.
- `qualifyingInvestment` maps onto E-2 and EB-5, though note E-2 has **no threshold to compare
  against** — see [§4.5](#45-e-1-treaty-trader-and-e-2-treaty-investor).

---

## 9. Scope exclusions, and how to name them

**Out of scope. Do not encode:**

- Asylum (8 U.S.C. § 1158) and refugee status (§ 1157)
- Withholding of removal (§ 1231(b)(3))
- Protection under the Convention Against Torture
- U nonimmigrant status (§ 1101(a)(15)(U)) and T nonimmigrant status (§ 1101(a)(15)(T))
- VAWA self-petitions (§ 1154(a)(1)(A)(iii)–(iv), (B)(ii)–(iii))

These concern people at risk, they turn on credibility and on facts a self-serve checker cannot
weigh, and a wrong answer is not a wasted fee — it is a person deciding not to seek protection.
A checker is the wrong instrument.

**But name them where a reader would otherwise read an omission as an absence of law.** Three
places specifically:

1. § 1182(a)(9)(B)(iii)(II) excludes time with a bona fide asylum application pending from the
   unlawful presence count. Say the exception exists, cite it, and say that whether it applies is
   a question for a qualified representative.
2. § 1182(a)(9)(B)(iii)(IV)–(V) and § 1182(a)(9)(C)(iii) carve out battered spouses and children
   and trafficking victims. Same treatment.
3. Any page listing "ways to obtain permanent residence" is incomplete without noting that
   protection-based routes exist and are deliberately not covered here.

The pointer should be to qualified legal help — a licensed attorney or a representative
accredited by the Department of Justice — not to a Meridian feature.

**Also outside this brief, though not for the same reason:** naturalisation (8 U.S.C. §§ 1421 ff.,
particularly § 1427), the Diversity Visa lottery (§ 1153(c)), and Temporary Protected Status
(§ 1254a). These are lawful subjects for the catalog; they simply were not researched here, and
nothing in this brief should be used to encode them.

---

## 10. What I could not establish

Read this section before relying on anything adjacent to it.

1. **The Visa Bulletin could not be fetched from its own host.** travel.state.gov is behind a
   bot-protection layer that refused every automated request during this sweep, including the
   PDF `dam` paths. The two structural facts in [§2.5](#25-mexico-specifically) were verified from
   **Internet Archive snapshots dated 13 and 14 July 2026** of the Department's own pages. That is
   the Department's text, but it is a mirror and it is a fortnight old. Before shipping any
   citation whose `url` points at travel.state.gov, **open it by hand and confirm it resolves.**
2. **Litigation status of anything in [§7](#7-live-and-pending-changes-encoders-must-know).** I
   verified publication, citation, effective date and codified text from the Federal Register and
   the eCFR. I did **not** and cannot establish from those sources whether any of the three rules
   or the proclamation is subject to an injunction, a stay, a vacatur, or a pending challenge. US
   immigration rules of this kind are litigated as a matter of routine. Every §7 item must be
   re-checked against a litigation-aware source before any pathway relies on it.
3. **Whether the H-1B proclamation has been extended.** It expires by its own terms on or about
   21 September 2026. My Federal Register search for a subsequent presidential document returned
   nothing, but a negative search result is weaker evidence than a positive one and the recommendation
   required by its own § 3(b) may not have surfaced as a published document.
4. **The USMCA text as published by USTR.** I fetched
   `ustr.gov/.../16_Temporary_Entry.pdf` successfully but could not extract reliable text from it
   in this environment. The treaty structure and the Section D text in this brief come from the
   Government of Canada's consolidated CUSMA Chapter 16 page and from 8 CFR 214.6(c), which
   reproduces Appendix 2 verbatim. Both are official; neither is USTR. If a citation's `url` must
   point at the US-published treaty text, verify that PDF by hand first.
5. **The exact profession count in the treaty as against the regulation.** I counted **63** entries
   in 8 CFR 214.6(c) by parsing the regulation. I did not independently count them in the treaty
   annex. If the two ever diverge, the regulation is what a US officer applies, but say so in the
   note rather than implying the treaty says the same thing.
6. **The eCFR human-facing URLs** (`https://www.ecfr.gov/current/title-8/...`) were **not**
   fetched — eCFR redirects automated requests to a bot-check host. I read the regulations through
   the eCFR **API** and through Cornell's CFR mirror, both of which are listed in §12. The
   human-facing eCFR URL is the canonical one to give a reader; confirm it by hand before putting
   it in a `Citation`.
7. **USCIS Policy Manual coverage is thin here.** I fetched three chapters. The Policy Manual is
   large and is the operative guidance for a great deal of USCIS adjudication. Nothing in this
   brief should be read as a survey of it.
8. **Nothing here is verified against the version of the law in force on any past date.** The CFR
   text was read as in force **2026-07-23** (the most recent title 8 issue date at the time of the
   sweep). A pathway that needs to answer a question about 2019 needs its own research.
9. **State-level and consular-post-level practice.** Visa reciprocity schedules, post-specific
   procedures, and appointment realities at the consulates in Mexico were not researched and are
   not in this brief.

---

## 11. How to write the citations

Suggested `instrument` strings, so four encoders produce one vocabulary rather than four:

| Layer | `kind` | `instrument` | `provision` example |
|---|---|---|---|
| Statute | `statute` | `Immigration and Nationality Act (8 U.S.C.)` | `8 U.S.C. § 1182(a)(9)(B)(i)(II) (INA § 212(a)(9)(B)(i)(II))` |
| DHS regulation | `regulation` | `Code of Federal Regulations, title 8` | `8 CFR 214.6(d)(1)` |
| State regulation | `regulation` | `Code of Federal Regulations, title 22` | `22 CFR 42.53` |
| Treaty | `treaty` | `Agreement between the United States of America, the United Mexican States, and Canada (USMCA)` | `Annex 16-A, Section D, para. 2` |
| State guidance | `official_guidance` | `Foreign Affairs Manual, volume 9` | `9 FAM 402.17-6(b)` |
| DHS guidance | `official_guidance` | `USCIS Policy Manual` | `7 USCIS-PM A.3` |
| Rule not yet codified | `regulation` | `Federal Register` | `91 FR 44976 (17 July 2026)` |
| Proclamation | `policy` | `Presidential Proclamation` | `90 FR 46027 (24 September 2025)` |
| BIA precedent | `case_law` | `Board of Immigration Appeals` | `Matter of Arrabally and Yerrabelly, 25 I&N Dec. 771 (BIA 2012)` |

Notes:

- The FAM carries its own revision stamps (e.g. `CT:VISA-2190; 02-17-2026`). Put the stamp in the
  `note` — it is how a reviewer knows which text was read.
- Where a criterion's content changes on a known future date, cite the current provision and put
  the Federal Register citation and the effective date in the `note`. Do not cite an uncodified
  rule as if it were the operative CFR text.
- `verifiedOn: '2026-07-26'` for everything built from this brief.

---

## 12. Source register

Every URL below was fetched during this sweep on 2026-07-26 unless marked otherwise.

### Statute — United States Code (Cornell LII, verbatim statutory text)

- <https://www.law.cornell.edu/uscode/text/8/1101> — definitions; (a)(13) admission, (a)(15)
  immigrant/nonimmigrant classes, (a)(16), (a)(20)
- <https://www.law.cornell.edu/uscode/text/8/1151> — worldwide levels; immediate relatives
- <https://www.law.cornell.edu/uscode/text/8/1152> — per-country levels
- <https://www.law.cornell.edu/uscode/text/8/1153> — family and employment preferences; EB-5
  amounts; order of consideration; CSPA
- <https://www.law.cornell.edu/uscode/text/8/1154> — petitions
- <https://www.law.cornell.edu/uscode/text/8/1182> — inadmissibility, including (a)(4), (a)(5),
  (a)(6), (a)(9), (d)(3), (f)
- <https://www.law.cornell.edu/uscode/text/8/1183a> — affidavit of support
- <https://www.law.cornell.edu/uscode/text/8/1184> — nonimmigrant provisions: (b), (e), (g), (h), (i)
- <https://www.law.cornell.edu/uscode/text/8/1186a> — conditional permanent residence
- <https://www.law.cornell.edu/uscode/text/8/1201> — issuance of visas; (g) refusal; (h) no
  entitlement to admission
- <https://www.law.cornell.edu/uscode/text/8/1255> — adjustment of status: (a), (c), (e), (i), (k)
- <https://www.law.cornell.edu/uscode/text/8/1361> — burden of proof

### Regulations — eCFR API, title 8 as in force 2026-07-23

- <https://www.ecfr.gov/api/versioner/v1/full/2026-07-23/title-8.xml?part=214&section=214.2>
- <https://www.ecfr.gov/api/versioner/v1/full/2026-07-23/title-8.xml?part=214&section=214.6>
- <https://www.ecfr.gov/api/versioner/v1/full/2026-07-23/title-8.xml?part=214&section=214.1>
- <https://www.ecfr.gov/api/versioner/v1/full/2026-07-23/title-8.xml?part=212&section=212.7>
- <https://www.ecfr.gov/api/versioner/v1/versions/title-8?part=214&section=214.2> — amendment history

### Regulations — Cornell CFR mirror

- <https://www.law.cornell.edu/cfr/text/8/214.1> · <https://www.law.cornell.edu/cfr/text/8/214.2>
  · <https://www.law.cornell.edu/cfr/text/8/214.6> · <https://www.law.cornell.edu/cfr/text/8/212.7>
- <https://www.law.cornell.edu/cfr/text/22/42.51> — Department control of numerical limitations
- <https://www.law.cornell.edu/cfr/text/22/42.53> — priority date of individual applicants
- <https://www.law.cornell.edu/cfr/text/22/42.54> — order of consideration

### Federal Register (govinfo full text; federalregister.gov API for metadata)

- <https://www.govinfo.gov/content/pkg/FR-2026-07-17/html/2026-14439.htm> — 91 FR 44976, F/J/I
  fixed period of admission
- <https://www.govinfo.gov/content/pkg/FR-2026-07-20/html/2026-14539.htm> — 91 FR 45324, public
  charge rescission
- <https://www.govinfo.gov/content/pkg/FR-2025-09-24/html/2025-18601.htm> — 90 FR 46027,
  Restriction on Entry of Certain Nonimmigrant Workers
- <https://www.govinfo.gov/content/pkg/FR-2016-03-11/html/2016-04828.htm> — 81 FR 13040, STEM OPT
- <https://www.govinfo.gov/content/pkg/FR-2019-01-31/html/2019-00302.htm> — 84 FR 888, H-1B
  registration requirement
- <https://www.federalregister.gov/api/v1/documents.json> — metadata queries. The weighted-selection
  rule **90 FR 60864 (29 December 2025, effective 27 February 2026)** was confirmed by metadata and
  by its **codified text** in the eCFR; I did not read its preamble.

### Department of State — Foreign Affairs Manual, volume 9

- <https://fam.state.gov/fam/09FAM/09FAM040217.html> — 9 FAM 402.17, USMCA Professionals (TN/TD)
- <https://fam.state.gov/fam/09FAM/09FAM040209.html> — 9 FAM 402.9, Treaty Traders and Investors
  (E visas), including the treaty country table showing Mexico
- <https://fam.state.gov/fam/09FAM/09FAM040202.html> — 9 FAM 402.2, B visas and Mexican Border
  Crossing Cards
- <https://fam.state.gov/fam/09FAM/09FAM030211.html> — 9 FAM 302.11, INA 212(a)(9)
- <https://fam.state.gov/fam/09FAM/09FAM050201.html> — 9 FAM 502.1, IV classifications overview
- <https://fam.state.gov/fam/09FAM/09FAM050301.html> — 9 FAM 503.1, numerical limitations overview
- <https://fam.state.gov/fam/09FAM/09FAM050302.html> — 9 FAM 503.2, chargeability
- <https://fam.state.gov/fam/09FAM/09FAM050303.html> — 9 FAM 503.3, priority dates
- <https://fam.state.gov/fam/09FAM/09FAM050304.html> — 9 FAM 503.4, allocation of IV numbers

### USCIS

- <https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates>
- <https://www.uscis.gov/green-card/green-card-processes-and-procedures/consular-processing>
- <https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin>
- <https://www.uscis.gov/policy-manual/volume-7-part-a-chapter-3> — filing instructions
- <https://www.uscis.gov/policy-manual/volume-7-part-b-chapter-2>
- <https://www.uscis.gov/policy-manual/volume-7-part-b-chapter-6> — unauthorised employment,
  INA 245(c)(2) and (c)(8)

### Treaty

- <https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/text-texte/16.aspx>
  — Government of Canada consolidated CUSMA Chapter 16: Article 16.4, Annex 16-A Sections A–D,
  Appendices 1 and 2
- <https://ustr.gov/sites/default/files/files/agreements/FTA/USMCA/Text/16_Temporary_Entry.pdf>
  — fetched but **not machine-readable in this environment**; see [§10](#10-what-i-could-not-establish) item 4
- 8 CFR 214.6(c) reproduces Appendix 2 to Annex 16-A verbatim and is the citable US-side source
  for the profession list

### Visa Bulletin — via Internet Archive only

travel.state.gov refused every direct request. Verified from snapshots of the Department's own pages:

- <http://web.archive.org/web/20260713194718/https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html>
  — index page; "non-oversubscribed countries only, which are those not individually listed below",
  with China (mainland-born), India, Mexico and the Philippines listed individually
- <http://web.archive.org/web/20260714171833/https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2026/visa-bulletin-for-july-2026.html>
  — "These provisions apply at present to the following oversubscribed chargeability areas:
  CHINA-mainland born, INDIA, MEXICO, and PHILIPPINES"; FY2026 family-sponsored limit 226,000;
  per-country limit 7% = 25,620; dependent area 2% = 7,320. **No cut-off date from this page is
  recorded in this brief, deliberately.**

### Not used as authority

Law-firm commentary, immigration-services marketing pages, and news reporting were not used. Where
a secondary page surfaced a provision, the provision itself was fetched and cited; the secondary
page is not in this register and must not appear in a `Citation`.
