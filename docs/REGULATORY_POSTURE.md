# Regulatory Posture

> **Boundary note (Lane C, public-safe).** Public-safe posture summary. The
> private regulatory and operational sink, including licensing sequencing and
> corporate-structure decisions, is
> [`madfam-org/internal-devops`](https://github.com/madfam-org/internal-devops)
> (RFC 0036 and the decisions ledger), per the repo-boundary contract.

Last updated: 2026-07-26.

---

## This document is not legal advice

It is an engineering-and-product record of how Meridian is built and why, written
by the people who built it. It is **not** a legal opinion, it was not written by
counsel, and it has not been reviewed by counsel.

Nothing here may be relied on as a statement of what the law requires.

**Counsel review is a precondition of commercial launch.** Specifically:

- No pathway in the catalog may be used for advice-class output until counsel
  has reviewed it and moved its `reviewStatus` to `counsel_reviewed`. See
  [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md). **As of 2026-07-26, zero of
  84 pathways have been reviewed.**
- The characterisations of Canadian and Spanish law below must be confirmed by
  qualified counsel in each jurisdiction before any commercial offering is made
  in that jurisdiction.
- Where this document expresses a degree of confidence, that is the *authors'*
  confidence in their reading of a public source, not a legal conclusion.

> ### ⚠ This document covers two of the three jurisdictions in the catalog
>
> **There is no United States analysis here, and 35 United States pathways were
> added to the catalog on 2026-07-26 without one.**
>
> Sections 2 and 3 below analyse Canada (IRPA s. 91) and Spain. Nothing in this
> repository analyses:
>
> - state-level **unauthorized practice of law** rules, which are the operative
>   restriction in the United States and vary by state;
> - the federal practitioner rules at **8 CFR 292** and **8 CFR 1292**;
> - the **EOIR accredited-representative** regime, which is the closest United
>   States analogue to the licensed non-lawyer categories that sections 2 and 3
>   turn on, and which has no equivalent in either analysed jurisdiction;
> - whether the `assessment` class — the user's own facts measured against a
>   cited rule — sits on the safe side of any of the above. Section 1's table
>   answers "No, on our reading" for that row, and **that reading was formed
>   about Canada and Spain**.
>
> This is recorded rather than assumed away, because the assumption that the
> Spanish and Canadian analysis transfers is doing real work if it is not stated.
> It may not transfer: the United States has no single reserved-activity
> provision to read, the restriction is state-by-state, and it reaches conduct
> that IRPA s. 91 does not.
>
> **Operative consequence.** Until this gap is closed, the United States records
> are catalog content and nothing more. No United States record should be moved to
> `counsel_reviewed`, and no commercial offering should be made in the United
> States, on the strength of anything in this document. Section 7 carries it as an
> open question; [COUNSEL_REVIEW_PACKET.md](COUNSEL_REVIEW_PACKET.md) §11 warns
> any United States reviewer directly.

---

## 1. The problem the posture solves

A platform that assesses immigration eligibility sits close to a regulated
activity in most of the jurisdictions worth operating in. The distance between
"here is what the rule says and here are your numbers" and "you should apply
under this route" is short in product terms and enormous in legal terms.

Meridian's answer is not a disclaimer. Disclaimers do not work: the question a
regulator asks is what the system *did*, not what the footer said. The answer is
a structural one — **every output is born classified, and one gate decides what
may be released to whom.**

| Class | Definition | Regulated? |
|---|---|---|
| `information` | Neutral restatement of a published rule, with citation, not applied to the user's facts | No |
| `assessment` | The user's own facts measured against a cited rule, with the arithmetic shown | No, on our reading |
| `advice` | A recommendation, ranking, strategy, or prediction of outcome | **Yes** |

The operative rule of thumb: **anything that ranks options, orders them, scores
them, or says what someone should do is `advice`.** A sort order is a
recommendation. So is a percentage chance of success — and that one would be
fabricated as well, since no authority publishes the data that would make it
true.

---

## 2. Canada — IRPA s.91

**Confidence: high. This is an explicit statutory offence provision.**

Section 91 of the *Immigration and Refugee Protection Act* makes it an offence
to knowingly, **directly or indirectly, represent or advise a person for
consideration** — or offer to do so — in connection with a proceeding or
application under the Act, unless the person doing so falls within an authorised
category.

The authorised categories are, in substance:

- a **lawyer** who is a member in good standing of a law society of a province,
  or a **notary** who is a member in good standing of the Chambre des notaires
  du Québec;
- **any other member in good standing of a law society of a province**, which
  in provinces that license them includes **paralegals**;
- a member in good standing of a **body designated under s.91(5)** — currently
  the **College of Immigration and Citizenship Consultants (CICC)**, whose
  licensees are Regulated Canadian Immigration Consultants (RCICs) and Regulated
  International Student Immigration Advisors (RISIAs);
- entities and persons acting under specified exemptions (for example certain
  student advisers and, in defined circumstances, persons acting without
  consideration).

Three features of s.91 drive Meridian's design:

1. **"For consideration" is the trigger.** Free advice is not the offence. This
   is why the posture is deliberately *stricter than the statute* — Meridian
   downgrades regardless of whether the reader is paying, because an unlicensed
   recommendation nobody is accountable for is not a product we ship. The gate
   still records `forConsideration` in `ReleaseContext`, because the legal
   exposure differs even where our behaviour does not.
2. **"Directly or indirectly" reaches the software.** A system that emits the
   recommendation is not obviously outside the provision merely because no human
   typed it. We do not rely on the argument that it is.
3. **The authorised person must be a natural person in good standing.** A
   corporation does not hold the standing; a licensed individual does. That is
   why `AuthorizedRepresentative` carries an `id`, a `licenceNumber` as it
   appears in the public register, a jurisdiction, and a `verifiedOn` date —
   and why `canRelease` refuses on a jurisdiction mismatch or a lapsed
   `expiresOn`.

**Known documentation gap.** The doc comment on `canRelease` in
`@meridian/core` currently enumerates only lawyers, Quebec notaries and CICC
licensees, omitting the paralegal limb. The type union carries `other_regulated`
for exactly that case, so the *behaviour* is correct, but the *enumeration* is a
legal statement and belongs in the counsel review rather than a drive-by edit.
Recorded here, in [PRD.md](PRD.md), and in [CHANGELOG.md](../CHANGELOG.md).

---

## 3. Spain — the reserved-activity position

**Confidence: moderate, and lower than for Canada. Read the caveats.**

Spain has **no single provision equivalent to IRPA s.91.** There is no statute
that makes advising on immigration, as such, an offence. The constraint is a
composite, and it is genuinely contested at the edges. Our reading:

**What is clearly regulated.** The profession of *abogado* is a regulated
profession. Practising it requires the qualification route under Ley 34/2006 and
membership of a Colegio de Abogados (*colegiación*). *Gestores administrativos*
are likewise an organised regulated profession with their own colegios and
professional statute. Holding oneself out as either without the title and the
colegiación is the clear case.

**Where the criminal exposure sits.** Article 403 of the Código Penal penalises
*intrusismo profesional* — performing acts proper to a profession without
possessing the corresponding official title. Spanish case law on the boundary is
fact-sensitive: it has turned on whether the activity is one *reserved* to the
titled profession, whether the person held themselves out as titled, and whether
the activity was habitual and remunerated. Isolated informational assistance sits
differently from a paid, systematic legal-advisory service presented as such.

**The important counter-point we must not overstate.** Representation before the
Spanish public administration is **not** reserved to lawyers. Under Ley 39/2015,
an interested party may act through a representative, and any person with
capacity to act may be that representative. Filing an administrative application
on someone's behalf is therefore a different question from providing
*asesoramiento jurídico* professionally. Much of what a gestoría does is lawful
precisely because of this.

**Therefore.** Meridian's Spanish exposure is not primarily about *filing*. It
is about **the advisory layer**: a paid, systematic service that tells a person
which route to pursue and why, presented as legal guidance, without a colegiado
professional accountable for it. That is the activity the advice boundary
withholds.

**What counsel must resolve before any Spanish commercial launch:**

- Whether Meridian's `assessment` class — the user's own facts measured against
  a cited rule, with arithmetic shown and no recommendation — sits outside the
  reserved activity. We believe it does; we have not had that confirmed.
- Whether offering the *product* from a Mexican entity to consumers in Spain
  changes the analysis, including consumer-protection and distance-selling
  obligations.
- Whether the `firm` tenant model — where the accountable professional is the
  *customer's* colegiado, not ours — is sufficient, which is the assumption the
  current commercial plan rests on.

---

## 4. The hybrid tenancy model

One engine, four tenant kinds. What differs between them is not the arithmetic —
it is **who is accountable for the recommendation**, and therefore what
`canRelease` will let through.

`TenantKind` is defined in `@meridian/core/src/tenancy.ts`; `audienceFor` maps
it to the `Audience` the gate reads.

### `firm` — law firm, consultancy, gestoría

**Advice: released.** `audienceFor('firm')` is `'practitioner'`, and
`canRelease` passes `advice` to a practitioner unconditionally. These readers are
the professionals, not the protected party; the engine is a tool in their hands
and they own the judgement, the client relationship, and the liability.

**Licensing burden on MADFAM: none.** We are a software vendor to a regulated
professional.

**This is the sellable product today** — subject only to the catalog being
counsel-reviewed, which it is not yet.

The obligation that comes with it is honesty about the tool's limits: a firm
tenant must be able to see that a pathway is `unreviewed`, that a citation is
`aging`, that a criterion is `discretionary`, and that a CUSMA occupation is not
in our 48-entry subset. All of that surfaces in the report rather than being
smoothed over.

### `individual` — a migrant self-serving

**Advice: withheld and downgraded to `assessment`,** unless the individual
attaches their own authorised representative to the matter.

They still get a great deal: their own presence figures with the ranges that
produced them, eligibility criteria evaluated in three-valued logic against
cited rules, a document checklist with legalisation and translation routing, and
freshness projected to their submission date. What they do not get is "apply
under this one first".

When the gate downgrades, the response says so and says why. Silence would read
as an absence of options rather than a legal boundary.

### `corporate` — an employer moving its own staff

**Advice: withheld and downgraded**, same as `individual`.
`audienceFor('corporate')` is `'corporate_sponsor'`.

This surprises people, so the reasoning is worth stating: an employer is not a
licensed adviser, and the person whose status is at stake is the employee, not
the employer. A mobility manager receiving a ranked recommendation and relaying
it to an employee is the exact indirect-advice pattern s.91 contemplates. A
corporate tenant that wants advice attaches counsel — which is what corporate
mobility programmes do anyway.

### `madfam_represented` — MADFAM acting as the representative

**Advice: released only where a verified, live, jurisdiction-matched credential
exists on the tenant.**

`representativeFor(tenant, jurisdiction, asOf)` returns `null` when no
representative matches the jurisdiction or the one that does has expired, and
`canRelease` then downgrades exactly as for an `individual`. So:

> **A `madfam_represented` tenant carrying no verified credential has precisely
> the authority of an `individual`.**

That is enforced in code, not in policy prose. The aspiration cannot leak into
production because somebody flipped an enum in a database.

**Status: blocked.** MADFAM holds no immigration credential in Canada or Spain.
No tenant of this kind should exist in production until the steps in section 5
are complete.

### Summary

| Tenant kind | Audience | Advice released? | Licensing gate on MADFAM |
|---|---|---|---|
| `firm` | `practitioner` | Yes — their licensee is accountable | None. **The sellable product today.** |
| `individual` | `applicant` | No — downgraded to assessment | None |
| `corporate` | `corporate_sponsor` | No — downgraded to assessment | None |
| `madfam_represented` | `applicant` | Only with a verified live credential | **Blocked** — see section 5 |

---

## 5. What would unlock `madfam_represented`

Concrete, in the order they have to happen. Every item is owner and counsel
work; none of it is engineering work. Each is stated as our understanding and
**must be confirmed with the relevant regulator or counsel** — regulator
requirements change and this list is not a substitute for reading their current
published rules.

### Canada

1. **Decide the route: employ or retain.** Either (a) employ or retain a
   licensee — an RCIC in good standing with the CICC, or a lawyer/paralegal in
   good standing with a provincial law society, or a Quebec notary — or (b) have
   a MADFAM principal become licensed. Route (a) is faster and is the normal
   commercial answer; route (b) takes years.
2. **If pursuing CICC licensing directly:** complete the currently accredited
   entry-to-practice programme, pass the entry-to-practice examination, meet the
   language-proficiency requirement, clear the good-character and background
   assessment, obtain errors-and-omissions insurance, and register and pay dues.
   Verify each requirement against the CICC's current published rules — this
   list is a summary from public sources and is not authoritative.
3. **Resolve the firm-structure question.** The licence is held by a natural
   person. Whether and how a corporation may hold out immigration services
   performed by its licensee, what the CICC's rules on firms and non-licensee
   ownership require, and whether a Mexican parent changes any of it, is a
   counsel question that must be answered before any offering is made.
4. **Professional liability insurance** at the level the regulator requires, in
   the name it requires.
5. **Client-file, conflict-of-interest, retainer and complaint-handling
   procedures** that satisfy the regulator, including how a platform-mediated
   engagement is documented and what the client's file contains.
6. **A named accountable licensee per matter.** The data model already requires
   this: `Matter.representativeId` and the `AuthorizedRepresentative` record with
   `licenceNumber` and `verifiedOn`.
7. **A recurring licence re-verification process.** `verifiedOn` must be refreshed
   against the regulator's public register on a schedule, and `expiresOn` must be
   populated where the credential has one. A stale `verifiedOn` is the mechanism
   by which a lapsed licence silently keeps gating release — which is precisely
   the failure the field exists to prevent.

### Spain

1. **Decide the route: abogado or gestor administrativo.** Engage or employ an
   *abogado colegiado* (member of a Colegio de Abogados) or a *gestor
   administrativo colegiado*, depending on what the intended service actually
   consists of. The two have different scopes and this choice is substantive,
   not cosmetic.
2. **Resolve the establishment question.** Whether a Mexican S.A.S. de C.V. can
   offer the service into Spain, whether a Spanish establishment or a
   partnership with a Spanish firm is required, and what that means for VAT,
   consumer protection and GDPR controller/processor allocation.
3. **Confirm the boundary of the reserved activity** for the specific service
   description — the open question at the end of section 3.
4. **Professional indemnity insurance** to the colegio's requirement.
5. **Colegio rules on advertising, fee structures and multidisciplinary
   practice**, which constrain how a software platform may present a
   professional's services.
6. **The same accountable-licensee and re-verification machinery as Canada.**

### Cross-cutting

7. **Corporate liability isolation.** Whether the regulated activity sits in a
   separate entity from the software platform is a structural decision with tax,
   liability and licensing consequences. Tracked privately in
   `madfam-org/internal-devops` (RFC 0028).
8. **Counsel review of the pathway catalog**, without which none of the above
   matters — a licensed representative signing off on rules nobody has read is
   not an improvement. See [LEGAL_CATALOG_REVIEW.md](LEGAL_CATALOG_REVIEW.md).

---

## 6. Adjacent refusals that are part of the same posture

**No custody of government credentials.** Meridian does not hold a Cl@ve PIN, a
Cl@ve Permanente password, a portal password or an e.firma key, and does not act
before an authority while presenting as the user. Beyond the security argument,
this is a regulatory one: a submission made with the user's credential is
legally *the user's act*, performed by someone else, with no record of consent
to that specific act on that specific day. When it goes wrong, the user is the
one who made a false declaration.
→ [ADR 0003](adr/0003-no-credential-custody.md)

**No synthetic success.** No adapter returns a plausible-looking government
response nobody obtained from a government. Fabricating a submission
confirmation is not a UX shortcut; it is a false statement to a person about
their legal position.

**No prediction of outcome.** There is no score, no percentage, and no estimate
of the chance of success anywhere in the engine, and a test asserts none appears
in ranked output.

**No ranking from an unreviewed catalog.** A pathway no licensed person has read
never enters a recommendation, whatever the engine computes. Excluded pathways
are returned with a reason rather than dropped, because an empty list with no
explanation looks like a bug and gets "fixed".

---

## 7. Open questions

Recorded so they are not mistaken for settled.

1. **Does MADFAM pursue `madfam_represented` at all**, or stay a B2B tool vendor
   to licensed firms indefinitely? The engine supports both; the commercial and
   liability profiles differ sharply.
2. **GDPR posture and data residency.** Meridian processes passport,
   biometric-derived and travel-history data — Article 9 special-category. Where
   EU-subject data lives, and under what controller/processor allocation, is an
   architectural question, not a configuration one. See
   [SECURITY.md](../SECURITY.md).
3. **Does the presence tracker ever ingest background GPS?** Continuous location
   surveillance of a migrant is a serious proposition. The current build treats
   GPS as one optional ledger source among five, with border stamps and
   itineraries as the primary evidence.
4. **Jurisdictions beyond ES and CA.** Each new jurisdiction reopens sections 2
   and 3 from scratch. The engine is generic; the regulatory analysis is not.

   **This stopped being hypothetical on 2026-07-26.** The catalog now encodes a
   third jurisdiction — 35 United States pathways — and sections 2 and 3 were
   *not* reopened. See the boxed warning at the top of this document. The gap is
   the largest open regulatory item in the repository, and it is a gap in the
   analysis rather than in the code: the disclosure gate behaves identically
   whatever the target jurisdiction, which is precisely the problem, because it
   means a United States output is classified by a rule derived from Canadian and
   Spanish law.

   Closing it needs a United States practitioner and would answer, at minimum:
   whether `assessment`-class output is unauthorized practice in any state where
   Meridian would have users; whether the `practitioner` audience should
   distinguish an attorney from an EOIR-accredited representative the way
   `RepresentativeCredential` already distinguishes `spanish_gestor` from
   `spanish_abogado`; and whether `canRelease`'s jurisdiction-match rule is even
   the right shape where the licence is state-level and the proceeding is federal.
