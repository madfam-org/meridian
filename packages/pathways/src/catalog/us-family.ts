/**
 * The United States — family-based immigration.
 *
 * Nine records: three immediate-relative routes (spouse, child, parent of a
 * United States citizen), the four family-sponsored preferences as the statute
 * allocates them (F1, F2A, F2B, F3, F4 — five records, because 8 U.S.C.
 * § 1153(a)(2) splits its own allocation between subparagraphs (A) and (B)),
 * and the K-1 fiancé(e) nonimmigrant route that leads into the first of them.
 *
 * ## Why immediate relatives are kept structurally apart from the preferences
 *
 * 8 U.S.C. § 1151(a) sets the worldwide levels "Exclusive of aliens described
 * in subsection (b)", and § 1151(b)(2)(A)(i) puts the children, spouses and
 * parents of United States citizens in subsection (b). **Immediate relatives
 * are therefore outside the numerical system entirely**: no annual limit, no
 * per-country cap, no priority-date queue. The four preferences in § 1153(a)
 * are inside it, and § 1152(a)(2) caps any single foreign state at 7 per cent
 * of the combined preference limits.
 *
 * Same statute, same family, and an utterly different route. A Mexican spouse
 * of a United States citizen joins no queue; a Mexican sibling of a United
 * States citizen joins the longest one in the system. Letting those share a
 * pathway record would bury the single largest practical fact about either of
 * them, so they do not share one, and each record says which side of the line
 * it is on in its summary and in its `durations.note`.
 *
 * ## No priority date, no cut-off date, no waiting time — anywhere in this file
 *
 * The Department of State republishes the Visa Bulletin every month and its
 * dates can move backwards. Any date written into this catalog would be read as
 * settled and would be wrong within weeks. What is encoded is the *existence
 * and structure* of the numerical limit — § 1152(a)(2), § 1152(e), § 1153(e)(1)
 * — and the fact that the Department currently treats Mexico as one of four
 * oversubscribed chargeability areas. No figure appears, and none should be
 * added.
 *
 * Note also that chargeability follows **place of birth**, not nationality
 * (§ 1152(b)). A Mexican national born elsewhere may not be charged to Mexico
 * at all, which is why no criterion in this file keys a queue to
 * `claimedNationality`.
 *
 * ## Why almost every criterion escalates to a person
 *
 * Family sponsorship is a **two-sided** test, and `ApplicantFacts` records one
 * side. There is no petitioner in the model: no petitioner status (citizen or
 * permanent resident), no petitioner age, no petitioner income, no household
 * size, no domicile, no undertaking history. There is no relationship record at
 * all, no marital status for the applicant, no priority date, and no manner of
 * last entry — which § 1255(a) turns on.
 *
 * A record that evaluated only the applicant's half and reported `eligible`
 * would be telling somebody they qualify on a test half of which was never
 * examined. So every relationship-side and petitioner-side criterion carries
 * `requiresHumanReview: true`, and these pathways return
 * `requires_human_review` rather than a verdict. The per-criterion results are
 * still computed, cited and returned — where an age can be computed from a
 * recorded date of birth it is, and the arithmetic appears in the report — so
 * the output remains useful. The escalation is the accurate answer to a
 * one-sided reading of a two-sided rule, not a placeholder.
 *
 * The facts that would let several of these escalations be replaced by real
 * evaluators are listed at the end of this comment.
 *
 * ## What is deliberately not in this file
 *
 * **VAWA self-petitions are out of scope.** 8 U.S.C. § 1154(a)(1)(A)(iii)–(iv)
 * and (B)(ii)–(iii) let an abused spouse or child of a United States citizen or
 * permanent resident petition for themselves, without the abuser's knowledge or
 * consent. That is a family-based route and its absence here would otherwise
 * read as an absence of law. It turns on credibility findings about a person at
 * risk, a self-serve checker is the wrong instrument for it, and a wrong answer
 * is not a wasted fee. Anyone in that situation needs a licensed attorney or a
 * representative accredited by the Department of Justice. The same goes for
 * asylum and refugee status, withholding of removal, protection under the
 * Convention Against Torture, and U and T nonimmigrant status.
 *
 * Naturalisation, the diversity visa lottery and Temporary Protected Status are
 * lawful subjects for this catalog and simply are not researched here; nothing
 * in this file should be used to encode them.
 *
 * The grounds of inadmissibility in § 1182(a) — above all the unlawful-presence
 * bars in § 1182(a)(9), which are triggered by *departure* and therefore by the
 * act of attending a consular interview — decide more Mexican family cases than
 * the classification rules encoded here do. They are named where a reader would
 * otherwise miss them and are not re-encoded in this file.
 *
 * ## Facts this file wanted and `ApplicantFacts` does not model
 *
 * Raised here rather than added, because `facts.ts` is shared by every
 * jurisdiction and `KNOWN_FACT_ROOTS` is a closed list:
 *
 * - the petitioner's relationship to the applicant, and the petitioner's status
 *   (United States citizen or lawful permanent resident) and age;
 * - the applicant's marital status, which is category-determinative in F1, F2B
 *   and F3 and mutable in both directions;
 * - sponsor income, household size and domicile, for § 1183a;
 * - manner of last entry — inspected and admitted, paroled, or entered without
 *   inspection — without which no honest § 1255(a) criterion can be written;
 * - the priority date, to say "your date is recorded" and never to compare it
 *   against a cut-off.
 *
 * Every record here is `reviewStatus: 'unreviewed'`.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import type { EvaluatorSpec, Pathway } from '../schema.js';

const US: CountryCode = countryCode('US');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-26');

const USC_8_1101 = 'https://www.law.cornell.edu/uscode/text/8/1101';
const USC_8_1151 = 'https://www.law.cornell.edu/uscode/text/8/1151';
const USC_8_1152 = 'https://www.law.cornell.edu/uscode/text/8/1152';
const USC_8_1153 = 'https://www.law.cornell.edu/uscode/text/8/1153';
const USC_8_1154 = 'https://www.law.cornell.edu/uscode/text/8/1154';
const USC_8_1182 = 'https://www.law.cornell.edu/uscode/text/8/1182';
const USC_8_1183A = 'https://www.law.cornell.edu/uscode/text/8/1183a';
const USC_8_1184 = 'https://www.law.cornell.edu/uscode/text/8/1184';
const USC_8_1186A = 'https://www.law.cornell.edu/uscode/text/8/1186a';
const USC_8_1255 = 'https://www.law.cornell.edu/uscode/text/8/1255';

// The `instrument` string is written out in full on every citation rather than
// hoisted into a constant. `scripts/check-pathway-citations.mjs` parses this
// file as text with no TypeScript loader and reads `instrument` only as a string
// literal, so a citation naming a constant reads to that guard as a citation
// naming no instrument at all — which it treats, correctly, as a citation that
// cites nothing. The repetition is the price of the guard being able to see the
// thing it guards.

// ---------------------------------------------------------------------------
// Citations — the numerical system
// ---------------------------------------------------------------------------

const usIna1151a = {
  id: 'us-ina-1151-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1151(a) (INA § 201(a))',
  url: USC_8_1151,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The worldwide levels of family-sponsored, employment-based and diversity immigration are set "Exclusive of ' +
    'aliens described in subsection (b)". Immediate relatives are described in subsection (b)(2)(A)(i), so they ' +
    'fall outside the worldwide levels and outside the per-country limitation that is calculated from them.',
};

const usIna1151b2Ai = {
  id: 'us-ina-1151-b-2-a-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1151(b)(2)(A)(i) (INA § 201(b)(2)(A)(i))',
  url: USC_8_1151,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Immediate relatives are "the children, spouses, and parents of a citizen of the United States, except that, ' +
    'in the case of parents, such citizens shall be at least 21 years of age". The same clause preserves the ' +
    'classification for the spouse of a citizen who has died, where the couple were not legally separated at the ' +
    'time of death, provided the spouse files a petition within 2 years of that date and only until the spouse ' +
    'remarries.',
};

const usIna1151f = {
  id: 'us-ina-1151-f',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1151(f) (INA § 201(f))',
  url: USC_8_1151,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Rules for determining whether certain aliens are immediate relatives. Paragraph (1): the age requirement is ' +
    'assessed "using the age of the alien on the date on which the petition is filed". Paragraph (2): where a ' +
    'family-sponsored petition converts to immediate relative classification because the parent naturalised, the ' +
    'age used is the age on the date of the parent\'s naturalisation. Paragraph (3): where a petition converts ' +
    'because a marriage ended, the age used is the age on the date the marriage terminated. Paragraph (4) ' +
    'applies the same rules to self-petitioners and their derivatives.',
};

const usIna1152a2 = {
  id: 'us-ina-1152-a-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1152(a)(2) (INA § 202(a)(2))',
  url: USC_8_1152,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The total number of immigrant visas made available to natives of any single foreign state under the family ' +
    'and employment preferences in a fiscal year "may not exceed 7 percent (in the case of a single foreign ' +
    'state) or 2 percent (in the case of a dependent area)" of the total made available under those subsections ' +
    'in that year. This is an express carve-out from the non-discrimination rule in § 1152(a)(1)(A), not a ' +
    'contradiction of it.',
};

const usIna1152b = {
  id: 'us-ina-1152-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1152(b) (INA § 202(b))',
  url: USC_8_1152,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The foreign state to which an immigrant is chargeable is determined by birth within that state, subject to ' +
    'exceptions whose purpose is to keep a family together. Chargeability therefore follows place of birth, not ' +
    'nationality and not residence.',
};

const usIna1152e = {
  id: 'us-ina-1152-e',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1152(e) (INA § 202(e))',
  url: USC_8_1152,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Special rules for countries at ceiling. Where the visas available to natives of a single foreign state will ' +
    'exceed the § 1152(a)(2) limitation in a fiscal year, the numbers for natives of that state are prorated ' +
    'across the family and employment preferences in the proportions the subsection sets out. This is the ' +
    'machinery that produces a separate, later queue for an oversubscribed chargeability area.',
};

const usIna1153e1 = {
  id: 'us-ina-1153-e-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(e)(1) (INA § 203(e)(1))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Immigrant visas made available under the family and employment preferences "shall be issued to eligible ' +
    'immigrants in the order in which a petition in behalf of each such immigrant is filed". Order of ' +
    'consideration is chronological by priority date; it is not a merit ranking and nothing an applicant does ' +
    'moves them up it.',
};

const usDosVisaBulletin = {
  id: 'us-dos-visa-bulletin',
  kind: 'official_guidance' as const,
  instrument: 'Department of State — Visa Bulletin',
  provision: 'monthly bulletin; oversubscribed chargeability areas and cut-off dates',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PUBLICATION, RE-ISSUED MONTHLY. The bulletin carries two charts — Application Final Action ' +
    'Dates and Dates for Filing — and its own explanatory text states that the § 1152(e) prorating provisions ' +
    '"apply at present to the following oversubscribed chargeability areas: CHINA-mainland born, INDIA, MEXICO, ' +
    'and PHILIPPINES", which is why the Department publishes those four in columns of their own alongside a ' +
    'worldwide column for every other chargeability area. Cut-off dates change every month and the bulletin ' +
    'warns that a date may retrogress, so Meridian records the structure and records no date. NO URL IS ' +
    'CARRIED HERE ON PURPOSE: travel.state.gov refused automated retrieval during this sweep and the text above ' +
    'was confirmed from an archived copy of the Department\'s own page taken in July 2026. Open the bulletin at ' +
    'the Department\'s site by hand before relying on anything in it, and never copy a date out of it into this ' +
    'catalog.',
};

// ---------------------------------------------------------------------------
// Citations — classifications and definitions
// ---------------------------------------------------------------------------

const usIna1101b1 = {
  id: 'us-ina-1101-b-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1101(b)(1) (INA § 101(b)(1))',
  url: USC_8_1101,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A "child" is an unmarried person under twenty-one years of age who is: (A) a child born in wedlock; (B) a ' +
    'stepchild, provided the child had not reached the age of eighteen when the marriage creating the stepchild ' +
    'relationship took place; (C) a child legitimated before reaching eighteen and in the legal custody of the ' +
    'legitimating parent or parents at the time; (D) a child born out of wedlock, claiming through the natural ' +
    'mother, or through the natural father where a bona fide parent-child relationship exists; (E) an adopted ' +
    'child adopted while under the age of sixteen who has been in the legal custody of, and has resided with, ' +
    'the adopting parent for at least two years; (F) an orphan under sixteen adopted abroad by or coming to the ' +
    'United States for adoption by a qualified citizen; or (G) a child under sixteen in a Hague Convention ' +
    'adoption. The age and marital status are part of the definition, which is why "child" and "son or ' +
    'daughter" are different words in this Act and are never interchangeable.',
};

const usIna1101b2 = {
  id: 'us-ina-1101-b-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1101(b)(2) (INA § 101(b)(2))',
  url: USC_8_1101,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The terms "parent", "father" and "mother" mean a parent, father or mother "only where the relationship ' +
    'exists by reason of any of the circumstances set forth in subdivision (1) of this subsection", with a ' +
    'carve-out for certain orphan and Hague adoption cases involving a natural father who has disappeared, ' +
    'abandoned or deserted the child or has irrevocably released the child in writing. The step-parent and ' +
    'adoptive-parent conditions in § 1101(b)(1)(B) and (E) therefore govern the parent side of the relationship ' +
    'as well as the child side.',
};

const usIna1153a1 = {
  id: 'us-ina-1153-a-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(a)(1) (INA § 203(a)(1))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'First preference: "Qualified immigrants who are the unmarried sons or daughters of citizens of the United ' +
    'States shall be allocated visas in a number not to exceed 23,400, plus any visas not required for the class ' +
    'specified in paragraph (4)." The allocation cascades: numbers unused by the fourth preference fall to this ' +
    'one.',
};

const usIna1153a2 = {
  id: 'us-ina-1153-a-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(a)(2) (INA § 203(a)(2))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Second preference: spouses and children of an alien lawfully admitted for permanent residence, and the ' +
    'unmarried sons or unmarried daughters (but not the children) of such an alien, allocated visas in a number ' +
    'not to exceed 114,200 plus the amount by which the worldwide level exceeds 226,000 plus any visas not ' +
    'required for the first preference. "Not less than 77 percent of such visa numbers shall be allocated to ' +
    'aliens described in subparagraph (A)" — that is, to spouses and children, which is what makes F2A and F2B ' +
    'separate queues out of one statutory allocation. There is no second-preference category for a married son ' +
    'or daughter and none for a sibling or a parent: a lawful permanent resident cannot petition for either.',
};

const usIna1153a3 = {
  id: 'us-ina-1153-a-3',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(a)(3) (INA § 203(a)(3))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Third preference: "Qualified immigrants who are the married sons or married daughters of citizens of the ' +
    'United States shall be allocated visas in a number not to exceed 23,400, plus any visas not required for ' +
    'the classes specified in paragraphs (1) and (2)."',
};

const usIna1153a4 = {
  id: 'us-ina-1153-a-4',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(a)(4) (INA § 203(a)(4))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Fourth preference: "Qualified immigrants who are the brothers or sisters of citizens of the United States, ' +
    'if such citizens are at least 21 years of age, shall be allocated visas in a number not to exceed 65,000, ' +
    'plus any visas not required for the classes specified in paragraphs (1) through (3)." The petitioner\'s age ' +
    'is part of the category, not a procedural detail.',
};

const usIna1153d = {
  id: 'us-ina-1153-d',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(d) (INA § 203(d))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Treatment of family members: "A spouse or child as defined in subparagraph (A), (B), (C), (D), or (E) of ' +
    'section 1101(b)(1) of this title shall, if not otherwise entitled to an immigrant status and the immediate ' +
    'issuance of a visa under subsection (a), (b), or (c), be entitled to the same status, and the same order of ' +
    'consideration provided in the respective subsection, if accompanying or following to join, the spouse or ' +
    'parent." Two consequences: the subsection reaches the preferences and the diversity category only, so an ' +
    'immediate relative under § 1151(b) has no derivatives at all; and the listed subparagraphs stop at (E), so ' +
    'an orphan or Hague adoptee under (F) or (G) is not a derivative.',
};

const usIna1153h = {
  id: 'us-ina-1153-h',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(h) (INA § 203(h))',
  url: USC_8_1153,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The Child Status Protection Act formula, for § 1153(a)(2)(A) beneficiaries and for derivative children ' +
    'under § 1153(d). Age is "the age of the alien on the date on which an immigrant visa number becomes ' +
    'available for such alien … but only if the alien has sought to acquire the status of an alien lawfully ' +
    'admitted for permanent residence within one year of such availability", "reduced by the number of days in ' +
    'the period during which the applicable petition … was pending". Where the result is still 21 or over, ' +
    '§ 1153(h)(3) converts the petition to the appropriate category and the original priority date is retained. ' +
    'This is civil-date arithmetic on two recorded dates and it is not the applicant\'s biological age.',
};

// ---------------------------------------------------------------------------
// Citations — petitions
// ---------------------------------------------------------------------------

const usIna1154a1Ai = {
  id: 'us-ina-1154-a-1-a-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(a)(1)(A)(i) (INA § 204(a)(1)(A)(i))',
  url: USC_8_1154,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any citizen of the United States claiming that an alien is entitled to classification by reason of a ' +
    'relationship described in paragraph (1), (3) or (4) of § 1153(a), or to immediate relative status under ' +
    '§ 1151(b)(2)(A)(i), may file a petition. Paragraph (2) — the second preference — is absent from this list ' +
    'because it belongs to a lawful permanent resident petitioner under subparagraph (B)(i). The classification ' +
    'is established by the petition; the visa or the adjustment is a separate application decided later and by ' +
    'somebody else.',
};

const usIna1154a1Bi = {
  id: 'us-ina-1154-a-1-b-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(a)(1)(B)(i) (INA § 204(a)(1)(B)(i))',
  url: USC_8_1154,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien lawfully admitted for permanent residence claiming that another alien is entitled to a ' +
    'classification by reason of a relationship described in § 1153(a)(2) may file a petition. That is the whole ' +
    'of what a permanent resident may petition for: a spouse, a child, or an unmarried son or daughter.',
};

const usIna1154c = {
  id: 'us-ina-1154-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(c) (INA § 204(c))',
  url: USC_8_1154,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'No petition shall be approved where the alien has previously been accorded, or has sought to be accorded, ' +
    'an immediate relative or preference status as the spouse of a citizen or of a permanent resident "by reason ' +
    'of a marriage determined by the Attorney General to have been entered into for the purpose of evading the ' +
    'immigration laws". The bar attaches to the earlier finding and reaches every later petition, including one ' +
    'based on a marriage nobody doubts.',
};

const usIna1154g = {
  id: 'us-ina-1154-g',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(g) (INA § 204(g))',
  url: USC_8_1154,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A petition based on a marriage entered into while the alien was in exclusion, deportation or removal ' +
    'proceedings may not be approved until the alien has resided outside the United States for a 2-year period ' +
    'beginning after the date of the marriage. The bar is on the petition itself, so it precedes every question ' +
    'about visas, adjustment or admissibility.',
};

const usIna1154k = {
  id: 'us-ina-1154-k',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(k) (INA § 204(k))',
  url: USC_8_1154,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Where a petition filed by a lawful permanent resident for an unmarried son or daughter under § 1153(a)(2)(B) ' +
    'is pending when the petitioner naturalises, the petition converts to one under § 1153(a)(1). The ' +
    'beneficiary may elect in writing to have the conversion not apply, and the priority date is retained either ' +
    'way. Which of the two categories is moving faster for a given chargeability area is a fact of the current ' +
    'Visa Bulletin and is the reason the election exists.',
};

// ---------------------------------------------------------------------------
// Citations — support, admissibility, residence
// ---------------------------------------------------------------------------

const usIna1182a4 = {
  id: 'us-ina-1182-a-4',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1182(a)(4)(A)–(B) (INA § 212(a)(4)(A)–(B))',
  url: USC_8_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY THE TERMS OF THE STATUTE. A person is inadmissible who, "in the opinion of the consular ' +
    'officer at the time of application for a visa, or in the opinion of the Attorney General at the time of ' +
    'application for admission or adjustment of status, is likely at any time to become a public charge". ' +
    'Subparagraph (B)(i) fixes the factors the officer must consider "at a minimum" — age; health; family ' +
    'status; assets, resources, and financial status; education and skills — and fixes no threshold against ' +
    'which any of them is measured. Subparagraph (B)(ii) allows an affidavit of support under § 1183a to be ' +
    'considered as well. The regulatory framework at 8 CFR 212.21, 212.22 and 212.23 is removed with effect ' +
    'from 18 September 2026 by the rule published at 91 FR 45324 on 20 July 2026, which the Department ' +
    'describes as moving away from a bright line standard and restoring officer discretion; from that date the ' +
    'statute is the only durable source for this ground. Litigation status of that rule was not established and ' +
    'must be checked before reliance.',
};

const usIna1182a4C = {
  id: 'us-ina-1182-a-4-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1182(a)(4)(C) (INA § 212(a)(4)(C))',
  url: USC_8_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A person seeking admission or adjustment of status under a visa number issued under § 1151(b)(2) — the ' +
    'immediate relatives — or under § 1153(a) — the family preferences — is inadmissible under the public charge ' +
    'paragraph unless a qualifying affidavit of support described in § 1183a has been executed. For these ' +
    'routes the affidavit is mandatory rather than merely available, which is why it is encoded as a criterion ' +
    'and not as guidance.',
};

const usIna1182aGrounds = {
  id: 'us-ina-1182-a-grounds',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1182(a) (INA § 212(a))',
  url: USC_8_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The classes of aliens ineligible for visas or admission. Qualifying for a family classification and being ' +
    'admissible are two separate questions decided against two separate bodies of law: health-related grounds ' +
    'under (a)(1), criminal grounds under (a)(2), public charge under (a)(4), presence without admission or ' +
    'parole and fraud or wilful misrepresentation under (a)(6), and prior removal and unlawful presence under ' +
    '(a)(9). For a Mexican applicant the (a)(9) grounds decide more family cases than the classification rules ' +
    'do, and they are triggered by departure — which means the act of travelling to a consular interview can be ' +
    'the act that fires them. None of them is modelled in this file.',
};

const usIna1183a = {
  id: 'us-ina-1183a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1183a(a)(1), (f)(1), (f)(3), (h) (INA § 213A)',
  url: USC_8_1183A,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An affidavit of support is enforceable only if the sponsor agrees to maintain the sponsored alien at an ' +
    '"annual income that is not less than 125 percent of the Federal poverty line" during the period the ' +
    'affidavit is enforceable, with a special rule in (f)(3) reducing the proportion to 100 percent for a ' +
    'sponsor on active duty in the Armed Forces of the United States on the conditions that paragraph states. ' +
    'A sponsor under (f)(1) must be a citizen, national or lawful permanent resident, at least 18 years of age, ' +
    'domiciled in a State, the District of Columbia or a territory or possession of the United States, and the ' +
    'person petitioning for the alien\'s admission, and must demonstrate the means to maintain the required ' +
    'income. Where the petitioner cannot reach the threshold alone, the section allows a joint sponsor who ' +
    'assumes the same enforceable obligation. The Federal poverty line is the official poverty line as defined ' +
    'by the Director of the Office of Management and Budget and revised annually by the Secretary of Health and ' +
    'Human Services, adjusted for household size — which is why this catalog records the proportion and never a ' +
    'currency amount.',
};

const usIna1186a = {
  id: 'us-ina-1186a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1186a(a)(1), (c)(4), (d)(2)(A), (h)(1) (INA § 216)',
  url: USC_8_1186A,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien spouse obtains permanent residence "on a conditional basis" where the status is obtained by virtue ' +
    'of a marriage entered into less than 24 months before the date the status is obtained — § 1186a(h)(1). A ' +
    'joint petition to remove the conditions must be filed "during the 90-day period before the second ' +
    'anniversary" of obtaining the status (§ 1186a(d)(2)(A)), and § 1186a(c)(4) allows the joint requirement to ' +
    'be waived on extreme hardship, on a good-faith marriage terminated without the alien\'s fault, or on ' +
    'battery or extreme cruelty by the sponsoring spouse or parent. The 24-month test runs to the date the ' +
    'status is granted, not to the date the petition or the application was filed.',
};

const usIna1255a = {
  id: 'us-ina-1255-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1255(a) (INA § 245(a))',
  url: USC_8_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY THE TERMS OF THE STATUTE. The status of an alien "who was inspected and admitted or ' +
    'paroled into the United States" may be adjusted to permanent residence "in his discretion", if the alien ' +
    'applies, is eligible to receive an immigrant visa and is admissible, and an immigrant visa is immediately ' +
    'available at the time the application is filed. Someone who entered without inspection fails at the ' +
    'threshold and cannot adjust inside the country whatever their classification — which forces the case ' +
    'abroad, and departure is what triggers the § 1182(a)(9)(B) bars.',
};

const usIna1255c2 = {
  id: 'us-ina-1255-c-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1255(c)(2) (INA § 245(c)(2))',
  url: USC_8_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Adjustment under subsection (a) is unavailable to an alien who continues in or accepts unauthorised ' +
    'employment before filing, who is in unlawful immigration status on the date of filing, or who has failed ' +
    'to maintain continuously a lawful status since entry — "other than through no fault of his own or for ' +
    'technical reasons" — but the paragraph expressly excepts an immediate relative as defined in § 1151(b). ' +
    'The exception is narrower than it sounds: it forgives an overstay, and it does not reach the § 1255(a) ' +
    'requirement of inspection and admission or parole, so a person who entered without inspection is not ' +
    'helped by it.',
};

const usIna1255d = {
  id: 'us-ina-1255-d',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1255(d) (INA § 245(d))',
  url: USC_8_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The status of a nonimmigrant described in § 1101(a)(15)(K) may not be adjusted except to that of an alien ' +
    'lawfully admitted on a conditional basis under § 1186a, and then only as a result of the marriage to the ' +
    'citizen who filed the petition. A K-1 who marries somebody else has no route through this subsection.',
};

const usIna1255e = {
  id: 'us-ina-1255-e',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1255(e) (INA § 245(e))',
  url: USC_8_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'No adjustment on the basis of a marriage entered into while administrative or judicial proceedings ' +
    'regarding the alien\'s right to be admitted or remain were pending, unless the alien establishes "by clear ' +
    'and convincing evidence" that the marriage was entered into in good faith, in accordance with the law of ' +
    'the place of celebration, and not for the purpose of procuring admission, and that no fee or other ' +
    'consideration was given other than to an attorney for assistance with the application. Note the elevated ' +
    'standard of proof.',
};

// ---------------------------------------------------------------------------
// Citations — the K nonimmigrant classification
// ---------------------------------------------------------------------------

const usIna1101a15K = {
  id: 'us-ina-1101-a-15-k',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1101(a)(15)(K) (INA § 101(a)(15)(K))',
  url: USC_8_1101,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The K nonimmigrant classes: clause (i) the fiancé(e) of a United States citizen entering solely to conclude ' +
    'a valid marriage with the petitioner within ninety days after admission, clause (ii) the spouse of a ' +
    'citizen where an immigrant petition has been filed, and clause (iii) the minor child accompanying or ' +
    'following to join a beneficiary of either. K-1 is a nonimmigrant classification even though its whole ' +
    'purpose is to lead to permanent residence, so § 1184(b) presumes the applicant to be an immigrant and the ' +
    'statute displaces that presumption for this class rather than the applicant having to.',
};

const usIna1184d = {
  id: 'us-ina-1184-d',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1184(d) (INA § 214(d))',
  url: USC_8_1184,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A visa may not be issued under § 1101(a)(15)(K)(i) until the consular officer has received a petition filed ' +
    'by the citizen and approved by the Secretary of Homeland Security, and until satisfactory evidence ' +
    'establishes that the parties "have previously met in person within 2 years before the date of filing the ' +
    'petition, have a bona fide intention to marry, and are legally able and actually willing to conclude a ' +
    'valid marriage in the United States within a period of ninety days after the alien\'s arrival". The ' +
    'in-person meeting requirement may be waived in the Secretary\'s discretion. If the marriage does not occur ' +
    'within three months after the admission, the alien and any minor children must depart or become subject to ' +
    'removal proceedings. Paragraph (d)(2) limits repeat petitioners — two or more previous petitions, or an ' +
    'approval within the preceding 2 years, requires a waiver, and a waiver is subject to a general bar where ' +
    'the petitioner has a record of violent criminal offences, with an exception where the petitioner was acting ' +
    'in self-defence or was themselves a victim. Paragraph (d)(3) requires the petition to disclose the ' +
    'petitioner\'s convictions for specified crimes and any permanent protection or restraining order against ' +
    'them, and defines those crimes.',
};

// ---------------------------------------------------------------------------
// Citations — Department of State regulations
// ---------------------------------------------------------------------------

const usCfr22_42_21 = {
  id: 'us-cfr-22-42-21',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 22',
  provision: '22 CFR 42.21',
  url: 'https://www.law.cornell.edu/cfr/text/22/42.21',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien who is the spouse or child of a United States citizen, or the parent of a United States citizen at ' +
    'least 21 years of age, "shall be classified as an immediate relative" if the Department of Homeland ' +
    'Security has approved a petition filed by the citizen and the consular officer is satisfied that the alien ' +
    'has the relationship claimed in the petition. Paragraph (b) carries the surviving-spouse rule and ' +
    'paragraph (c) a rule for the child of a citizen killed in the terrorist actions of 11 September 2001. Two ' +
    'gates, in order: an approved petition, then the officer\'s own satisfaction as to the relationship.',
};

const usCfr22_42_31 = {
  id: 'us-cfr-22-42-31',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 22',
  provision: '22 CFR 42.31',
  url: 'https://www.law.cornell.edu/cfr/text/22/42.31',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Family-sponsored preference classification requires an approved relative petition and the consular ' +
    'officer\'s satisfaction as to the relationship. For the first and third preferences, and for an unmarried ' +
    'child under the second, the petitioner must be a parent; for the fourth preference the petitioner must be ' +
    'at least twenty-one years of age. Paragraph (b) applies § 1153(d) so that a spouse or child of a ' +
    'family-sponsored immigrant takes the same classification and the same priority date if accompanying or ' +
    'following to join, even where they were not named in the petition, provided they are not independently ' +
    'entitled to immigrant status.',
};

const usCfr22_41_81 = {
  id: 'us-cfr-22-41-81',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 22',
  provision: '22 CFR 41.81',
  url: 'https://www.law.cornell.edu/cfr/text/22/41.81',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A fiancé(e) is classifiable under § 1101(a)(15)(K)(i) where the consular officer is satisfied the alien is ' +
    'qualified and has received an approved petition, where the officer has received "the alien\'s sworn ' +
    'statement of ability and intent to conclude a valid marriage with the petitioner within 90 days of ' +
    'arrival", and where the alien has met all other qualifications for a nonimmigrant visa. Paragraph (c) ' +
    'covers the accompanying child and paragraph (d) requires the officer to determine eligibility "as if the ' +
    'alien were an applicant for an immigrant visa", with stated exceptions.',
};

// ---------------------------------------------------------------------------
// Shared evaluator fragment
// ---------------------------------------------------------------------------

/**
 * The evaluator attached to criteria that turn on a fact about somebody other
 * than the applicant — the petitioner, the sponsor, the relationship itself, or
 * the position of a queue in a monthly publication.
 *
 * Those criteria carry `requiresHumanReview: true` and the engine escalates them
 * whatever their evaluator returns, so this spec is documentary rather than
 * decisive. It reads the one thing that is both true of every route in this file
 * and actually present in `ApplicantFacts` — that the target jurisdiction is the
 * United States — so the audit trace names a real path that was really consulted
 * rather than a tautology dressed as a test.
 */
const TARGET_IS_US: EvaluatorSpec = { op: 'equals', path: 'targetJurisdiction', value: 'US' };

// ---------------------------------------------------------------------------
// Immediate relative — spouse of a United States citizen (IR-1 / CR-1)
// ---------------------------------------------------------------------------

export const usImmediateRelativeSpouse: Pathway = {
  id: 'us-immediate-relative-spouse',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Immediate relative — spouse of a United States citizen',
    es: 'Familiar inmediato: cónyuge de una persona ciudadana de los Estados Unidos',
  },
  summary: {
    en:
      'Permanent residence for the spouse of a United States citizen, on a petition filed by that citizen. This ' +
      'classification is outside the numerical system: § 1151(a) sets the worldwide levels "Exclusive of aliens ' +
      'described in subsection (b)" and § 1151(b)(2)(A)(i) places spouses of citizens in that subsection, so ' +
      'there is no annual limit, no per-country cap and no priority-date queue. Where the marriage is less than ' +
      '24 months old when the status is granted, the residence is conditional for two years.',
    es:
      'Residencia permanente para el cónyuge de una persona ciudadana de los Estados Unidos, mediante petición ' +
      'presentada por esa persona. Esta clasificación queda fuera del sistema de cupos: el art. 1151(a) fija los ' +
      'niveles mundiales «con exclusión de las personas descritas en el apartado (b)» y el art. 1151(b)(2)(A)(i) ' +
      'sitúa en ese apartado al cónyuge de una persona ciudadana, de modo que no hay límite anual, ni tope por ' +
      'país, ni cola por fecha de prioridad. Si el matrimonio tiene menos de 24 meses cuando se concede el ' +
      'estatus, la residencia es condicional durante dos años.',
  },
  citations: [
    usIna1151a,
    usIna1151b2Ai,
    usIna1153d,
    usIna1154a1Ai,
    usIna1154c,
    usIna1154g,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usIna1186a,
    usIna1255a,
    usIna1255c2,
    usIna1255e,
    usCfr22_42_21,
  ],
  criteria: [
    {
      id: 'us-ir-spouse-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1151-b-2-a-i', 'us-cfr-22-42-21', 'us-ina-1154-c'],
      label: {
        en: 'A valid, subsisting marriage to the petitioning United States citizen',
        es: 'Matrimonio válido y subsistente con la persona ciudadana estadounidense que presenta la petición',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no relationship and no marital status. Three separate questions have to be answered ' +
          'by a person: whether the marriage is valid where it was celebrated, whether it is bona fide rather ' +
          'than entered into to obtain an immigration benefit, and whether § 1154(c) bars the petition because ' +
          'the applicant was previously accorded or sought status through a marriage found to have been entered ' +
          'into to evade the immigration laws. The second of those is a credibility finding on a whole ' +
          'evidentiary record and no engine performs it.',
        es:
          'Meridian no registra la relación ni el estado civil. Una persona debe responder tres cuestiones ' +
          'distintas: si el matrimonio es válido en el lugar de celebración, si es genuino y no se contrajo para ' +
          'obtener un beneficio migratorio, y si el art. 1154(c) impide aprobar la petición porque a la persona ' +
          'solicitante se le concedió o solicitó antes un estatus por un matrimonio declarado contraído para ' +
          'eludir la ley migratoria. La segunda es una valoración de credibilidad sobre todo el acervo ' +
          'probatorio y ningún motor la realiza.',
      },
      guidance: {
        en:
          'The classification survives the citizen\'s death: § 1151(b)(2)(A)(i) keeps a spouse who was not ' +
          'legally separated at the time of death an immediate relative, provided a petition is filed within ' +
          '2 years of that date and only until the spouse remarries. Separately, and deliberately not encoded ' +
          'here, an abused spouse of a United States citizen may petition for themselves under § 1154(a)(1)(A) ' +
          'without the abuser\'s knowledge or consent; that route turns on findings a self-serve checker must ' +
          'not attempt, and anyone in that position should speak to a licensed attorney or a representative ' +
          'accredited by the Department of Justice.',
        es:
          'La clasificación sobrevive al fallecimiento de la persona ciudadana: el art. 1151(b)(2)(A)(i) ' +
          'mantiene como familiar inmediato al cónyuge que no estuviera legalmente separado en ese momento, ' +
          'siempre que se presente una petición dentro de los 2 años siguientes y solo hasta que contraiga ' +
          'nuevo matrimonio. Por separado, y deliberadamente no codificado aquí, el cónyuge víctima de ' +
          'violencia puede autopeticionar conforme al art. 1154(a)(1)(A) sin conocimiento ni consentimiento de ' +
          'la persona agresora; esa vía depende de valoraciones que un verificador automático no debe intentar, ' +
          'y quien se encuentre en esa situación debería acudir a una persona abogada colegiada o a una ' +
          'representante acreditada por el Departamento de Justicia.',
      },
    },
    {
      id: 'us-ir-spouse-petitioner-is-citizen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-a-1-a-i', 'us-ina-1151-b-2-a-i'],
      label: {
        en: 'The petitioning spouse is a citizen of the United States and has filed a relative petition',
        es: 'El cónyuge peticionario es ciudadano de los Estados Unidos y ha presentado la petición de familiar',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in the facts model describes the petitioner. Whether the petitioning spouse holds United ' +
          'States citizenship — rather than lawful permanent residence — is the fact that decides which of two ' +
          'entirely different routes this is, and it is not recorded.',
        es:
          'El modelo de datos no describe a la persona peticionaria. Que el cónyuge peticionario tenga la ' +
          'ciudadanía estadounidense —y no la residencia permanente legal— es el hecho que determina cuál de ' +
          'dos vías completamente distintas es esta, y no consta registrado.',
      },
      guidance: {
        en:
          'If the petitioning spouse is a lawful permanent resident rather than a citizen, this is not the ' +
          'route: the classification is the second preference under § 1153(a)(2)(A), which is numerically ' +
          'limited and queued by priority date. The difference is not paperwork, it is years. If that ' +
          'petitioner later naturalises, the beneficiary becomes an immediate relative and leaves the queue.',
        es:
          'Si el cónyuge peticionario es residente permanente legal y no ciudadano, esta no es la vía: la ' +
          'clasificación es la segunda preferencia del art. 1153(a)(2)(A), sujeta a cupo y ordenada por fecha ' +
          'de prioridad. La diferencia no es documental, son años. Si esa persona se naturaliza después, la ' +
          'persona beneficiaria pasa a ser familiar inmediato y sale de la cola.',
      },
    },
    {
      id: 'us-ir-spouse-marriage-not-during-proceedings',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-g', 'us-ina-1255-e'],
      label: {
        en: 'The marriage was not entered into while removal or related proceedings were pending',
        es: 'El matrimonio no se contrajo mientras estaban pendientes procedimientos de expulsión o similares',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no proceedings history and no marriage date. Section 1154(g) prevents the petition ' +
          'from being approved at all until the applicant has resided outside the United States for two years ' +
          'after a marriage entered into during proceedings, and § 1255(e) separately bars adjustment on such a ' +
          'marriage unless it is proved bona fide by clear and convincing evidence. Both turn on dates and on a ' +
          'procedural record this engine does not hold.',
        es:
          'Meridian no registra el historial de procedimientos ni la fecha del matrimonio. El art. 1154(g) ' +
          'impide aprobar la petición hasta que la persona solicitante haya residido dos años fuera de los ' +
          'Estados Unidos tras un matrimonio contraído durante un procedimiento, y el art. 1255(e) prohíbe por ' +
          'separado el ajuste basado en tal matrimonio salvo prueba de buena fe mediante evidencia clara y ' +
          'convincente. Ambos dependen de fechas y de un expediente procesal del que este motor no dispone.',
      },
      guidance: {
        en:
          'Note the elevated standard of proof in § 1255(e)(3): clear and convincing evidence, which is higher ' +
          'than the ordinary civil standard and is applied to the good faith of the marriage, its conformity ' +
          'with the law of the place of celebration, and the absence of any fee or consideration other than to ' +
          'an attorney for assistance with the application.',
        es:
          'Obsérvese el estándar probatorio reforzado del art. 1255(e)(3): evidencia clara y convincente, ' +
          'superior al estándar civil ordinario, que se aplica a la buena fe del matrimonio, a su conformidad ' +
          'con la ley del lugar de celebración y a la ausencia de honorarios o contraprestación distintos de ' +
          'los pagados a una persona abogada por su asistencia en la solicitud.',
      },
    },
    {
      id: 'us-ir-spouse-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor income, no household size and no sponsor at all. The test compares the ' +
          'sponsor\'s income against a proportion of a poverty figure that depends on how many people the ' +
          'sponsor is responsible for, and none of those numbers is in the model.',
        es:
          'Meridian no registra ingresos de la persona patrocinadora, ni el tamaño del hogar, ni a la persona ' +
          'patrocinadora en absoluto. La prueba compara sus ingresos con una proporción de una cifra de pobreza ' +
          'que depende del número de personas a su cargo, y ninguno de esos datos figura en el modelo.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for anyone seeking status under a visa number ' +
          'issued under § 1151(b)(2) or § 1153(a), so it is a requirement of the route and not an optional ' +
          'document. Section 1183a fixes the level as a proportion — not less than 125 per cent of the Federal ' +
          'poverty line, reduced to 100 per cent under the special rule for a sponsor on active duty in the ' +
          'Armed Forces — and the poverty line itself is revised every year by the Secretary of Health and ' +
          'Human Services and varies with household size. Meridian therefore records the proportion and never a ' +
          'currency amount: any figure written here would be wrong at the next revision. Where the petitioner ' +
          'cannot meet the level alone, a joint sponsor may take on the same enforceable obligation.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para quien solicita estatus con un número de ' +
          'visa expedido conforme al art. 1151(b)(2) o al art. 1153(a), de modo que es un requisito de la vía y ' +
          'no un documento opcional. El art. 1183a fija el nivel como proporción —no menos del 125 por ciento ' +
          'del umbral federal de pobreza, reducido al 100 por ciento por la regla especial para quien está en ' +
          'servicio activo en las Fuerzas Armadas— y el propio umbral lo revisa cada año la Secretaría de Salud ' +
          'y Servicios Humanos y varía según el tamaño del hogar. Por eso Meridian registra la proporción y ' +
          'nunca un importe: cualquier cifra escrita aquí sería errónea en la siguiente revisión. Si la persona ' +
          'peticionaria no alcanza el nivel por sí sola, una patrocinadora conjunta puede asumir la misma ' +
          'obligación exigible.',
      },
    },
    {
      id: 'us-ir-spouse-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'A United States citizen living abroad is not automatically domiciled in the United States for this ' +
          'purpose, and whether they are is decided on the facts before the affidavit can be accepted. It is a ' +
          'common and expensive surprise on a route where the couple have been living together outside the ' +
          'country, and it is worth settling before anything is filed.',
        es:
          'Una persona ciudadana estadounidense que vive en el extranjero no está automáticamente domiciliada ' +
          'en los Estados Unidos a estos efectos, y la cuestión se resuelve según los hechos antes de admitir ' +
          'la declaración. Es una sorpresa frecuente y costosa en una vía en la que la pareja convivía fuera ' +
          'del país, y conviene resolverla antes de presentar nada.',
      },
    },
    {
      id: 'us-ir-spouse-adjustment-or-consular',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['us-ina-1255-a', 'us-ina-1255-c-2', 'us-ina-1182-a-grounds'],
      label: {
        en: 'Whether the case can be finished inside the United States or must go to a consulate abroad',
        es: 'Si el caso puede resolverse dentro de los Estados Unidos o debe tramitarse en un consulado',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This turns on the manner of the applicant\'s last entry — inspected and admitted, paroled, or ' +
          'entered without inspection — and `ApplicantFacts` does not model it. Without that fact no honest ' +
          'statement can be made about § 1255(a), and the wrong answer here can cost a decade rather than a ' +
          'filing fee.',
        es:
          'Depende de la forma de la última entrada —inspección y admisión, permiso condicional (parole) o ' +
          'entrada sin inspección— y `ApplicantFacts` no la modela. Sin ese dato no cabe afirmar nada honesto ' +
          'sobre el art. 1255(a), y equivocarse aquí puede costar una década y no una tasa.',
      },
      guidance: {
        en:
          'Adjustment of status under § 1255(a) is open only to someone who was inspected and admitted or ' +
          'paroled. An immediate relative who was admitted and then overstayed is expressly excepted from the ' +
          'bars in § 1255(c)(2) and can still adjust; someone who entered without inspection fails § 1255(a) ' +
          'itself and that exception does not reach them. The alternative is a consular interview abroad, and ' +
          'departing the United States is the event that triggers the unlawful-presence bars in § 1182(a)(9)(B). ' +
          'That interaction is the central structural fact of this corridor and it needs qualified advice ' +
          'before anybody buys a ticket.',
        es:
          'El ajuste de estatus del art. 1255(a) solo está abierto a quien fue inspeccionado y admitido o ' +
          'recibió permiso condicional. El familiar inmediato admitido que después excedió su estancia queda ' +
          'expresamente exceptuado de las prohibiciones del art. 1255(c)(2) y puede ajustar; quien entró sin ' +
          'inspección incumple el propio art. 1255(a) y esa excepción no le alcanza. La alternativa es la ' +
          'entrevista consular en el extranjero, y salir de los Estados Unidos es el hecho que activa las ' +
          'prohibiciones por presencia ilegal del art. 1182(a)(9)(B). Esa interacción es el dato estructural ' +
          'central de este corredor y exige asesoramiento cualificado antes de comprar un billete.',
      },
    },
    {
      id: 'us-ir-spouse-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) makes a person inadmissible who is, "in the opinion of" the officer, likely at ' +
          'any time to become a public charge. The statute lists the factors the officer must weigh at a ' +
          'minimum and fixes no threshold for any of them. It is a totality judgement by a named ' +
          'decision-maker, and an engine that produced a number for it would be inventing one.',
        es:
          'El art. 1182(a)(4)(A) declara inadmisible a quien, «a juicio» del funcionario, sea probable que en ' +
          'algún momento se convierta en carga pública. La ley enumera los factores que debe ponderar como ' +
          'mínimo y no fija umbral para ninguno. Es una valoración de conjunto de una autoridad concreta, y un ' +
          'motor que produjera una cifra al respecto se la estaría inventando.',
      },
      guidance: {
        en:
          'Executing the affidavit of support does not settle this ground: § 1182(a)(4)(B)(ii) makes the ' +
          'affidavit something the officer may consider, alongside age, health, family status, assets, ' +
          'resources and financial status, and education and skills. The regulatory framework at 8 CFR 212.21 ' +
          'to 212.23 is removed with effect from 18 September 2026 by the rule published at 91 FR 45324, which ' +
          'the Department describes as moving away from a bright line standard, so from that date the statute ' +
          'is the only durable source. Meridian encodes no benefit-by-benefit rule and no income test for this ' +
          'ground.',
        es:
          'Presentar la declaración jurada de manutención no resuelve este motivo: el art. 1182(a)(4)(B)(ii) ' +
          'la configura como algo que el funcionario puede considerar, junto con la edad, la salud, la ' +
          'situación familiar, el patrimonio, los recursos y la situación financiera, y la formación y las ' +
          'aptitudes. El marco reglamentario de 8 CFR 212.21 a 212.23 queda derogado con efectos desde el 18 ' +
          'de septiembre de 2026 por la norma publicada en 91 FR 45324, que el Departamento describe como un ' +
          'alejamiento de todo criterio de línea clara, de modo que desde esa fecha la ley es la única fuente ' +
          'duradera. Meridian no codifica reglas prestación por prestación ni prueba de ingresos para este ' +
          'motivo.',
      },
    },
    {
      id: 'us-ir-spouse-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'This criterion is material and never blocking: a self-declaration is evidence toward admissibility, ' +
          'not the finding itself. Health, security, misrepresentation and, above all, the unlawful-presence ' +
          'and prior-removal grounds in § 1182(a)(9) are not modelled here at all, and for a Mexican applicant ' +
          'those are the grounds that most often decide the case.',
        es:
          'Este criterio es material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la ' +
          'resolución. Los motivos de salud, seguridad, falsedad y, sobre todo, los de presencia ilegal y ' +
          'expulsión previa del art. 1182(a)(9) no se modelan aquí en absoluto, y para una persona solicitante ' +
          'mexicana son los que con más frecuencia deciden el caso.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1151-a', 'us-ina-1151-b-2-a-i', 'us-ina-1153-d', 'us-ina-1186a'],
    note: {
      en:
        'There is no queue on this route. Section 1151(a) sets the worldwide levels "Exclusive of aliens ' +
        'described in subsection (b)", and § 1151(b)(2)(A)(i) puts spouses of United States citizens in that ' +
        'subsection, so no annual limit, no 7 per cent per-country cap and no priority date applies. That is ' +
        'the single largest practical difference between this record and the four family preferences, where a ' +
        'Mexican-chargeability applicant waits in a category the Department of State currently treats as ' +
        'oversubscribed. The trade is that § 1153(d), which lets the spouse and children of a preference ' +
        'beneficiary take the same classification and priority date, reaches the preferences only: an ' +
        'immediate relative has no derivatives, and a child of the applicant needs a petition of their own. ' +
        'Where the residence is obtained by virtue of a marriage entered into less than 24 months before the ' +
        'date the status is granted, § 1186a makes it conditional, and a joint petition to remove the ' +
        'conditions must be filed during the 90-day period before the second anniversary of the grant. ' +
        'Meridian publishes no processing time for any stage of this route, because no figure it could publish ' +
        'would be a service standard anybody is bound by.',
      es:
        'Esta vía no tiene cola. El art. 1151(a) fija los niveles mundiales «con exclusión de las personas ' +
        'descritas en el apartado (b)», y el art. 1151(b)(2)(A)(i) sitúa en ese apartado al cónyuge de una ' +
        'persona ciudadana estadounidense, de modo que no se aplica límite anual, ni tope por país del 7 por ' +
        'ciento, ni fecha de prioridad. Esa es la mayor diferencia práctica entre este registro y las cuatro ' +
        'preferencias familiares, en las que una persona con imputación a México espera en una categoría que ' +
        'el Departamento de Estado trata actualmente como sobresuscrita. La contrapartida es que el art. ' +
        '1153(d), que permite al cónyuge y a los hijos de una persona beneficiaria de preferencia tomar su ' +
        'misma clasificación y fecha de prioridad, solo alcanza a las preferencias: el familiar inmediato no ' +
        'tiene derivados, y un hijo de la persona solicitante necesita su propia petición. Cuando la ' +
        'residencia se obtiene en virtud de un matrimonio contraído menos de 24 meses antes de la fecha de ' +
        'concesión, el art. 1186a la convierte en condicional, y la petición conjunta para retirar las ' +
        'condiciones debe presentarse en el periodo de 90 días anterior al segundo aniversario de la ' +
        'concesión. Meridian no publica plazos de tramitación para ninguna fase de esta vía, porque ninguna ' +
        'cifra que pudiera publicar sería un compromiso de servicio que vincule a nadie.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Immediate relative — child of a United States citizen (IR-2)
// ---------------------------------------------------------------------------

export const usImmediateRelativeChild: Pathway = {
  id: 'us-immediate-relative-child',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Immediate relative — child of a United States citizen',
    es: 'Familiar inmediato: hijo o hija de una persona ciudadana de los Estados Unidos',
  },
  summary: {
    en:
      'Permanent residence for the unmarried child under 21 of a United States citizen, on a petition filed by ' +
      'that citizen. Like the other immediate relative classifications it sits outside the numerical system — no ' +
      'annual limit, no per-country cap, no priority-date queue. The age that matters is the age on the date the ' +
      'petition is filed, not the age today, and "child" is a defined term that carries conditions on ' +
      'step-relationships and adoptions.',
    es:
      'Residencia permanente para el hijo o la hija soltera menor de 21 años de una persona ciudadana de los ' +
      'Estados Unidos, mediante petición presentada por esa persona. Como las demás clasificaciones de familiar ' +
      'inmediato, queda fuera del sistema de cupos: sin límite anual, sin tope por país y sin cola por fecha de ' +
      'prioridad. La edad determinante es la que se tiene en la fecha de presentación de la petición, no la ' +
      'edad actual, y «hijo o hija» es un término definido que impone condiciones a las relaciones de ' +
      'afinidad y a las adopciones.',
  },
  citations: [
    usIna1151a,
    usIna1151b2Ai,
    usIna1151f,
    usIna1101b1,
    usIna1153d,
    usIna1154a1Ai,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usIna1255a,
    usIna1255c2,
    usCfr22_42_21,
  ],
  criteria: [
    {
      id: 'us-ir-child-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1151-b-2-a-i', 'us-ina-1101-b-1', 'us-cfr-22-42-21'],
      label: {
        en: 'The applicant is a "child" of the petitioning citizen as § 1101(b)(1) defines that term',
        es: 'La persona solicitante es «hijo o hija» de la persona peticionaria conforme al art. 1101(b)(1)',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no relationship. Which subparagraph of § 1101(b)(1) the relationship falls under ' +
          'decides the case, and each carries its own conditions: a stepchild only counts where the marriage ' +
          'that created the relationship took place before the child turned eighteen, a legitimated child where ' +
          'the legitimation happened before eighteen and in the legitimating parent\'s legal custody, an adopted ' +
          'child where the adoption happened before sixteen and the child has been in the adopting parent\'s ' +
          'legal custody and residence for two years. None of those dates is in the model.',
        es:
          'Meridian no registra la relación. El subapartado del art. 1101(b)(1) al que corresponda decide el ' +
          'caso, y cada uno impone sus propias condiciones: la relación de hijastro solo computa si el ' +
          'matrimonio que la creó se celebró antes de que el menor cumpliera dieciocho años; la de hijo ' +
          'legitimado, si la legitimación se produjo antes de los dieciocho y bajo custodia legal del ' +
          'progenitor legitimante; la de hijo adoptivo, si la adopción se produjo antes de los dieciséis y el ' +
          'menor ha estado dos años bajo custodia legal y convivencia con la persona adoptante. Ninguna de esas ' +
          'fechas figura en el modelo.',
      },
      guidance: {
        en:
          'A child born out of wedlock qualifies through the natural mother, and through the natural father ' +
          'where a bona fide parent-child relationship exists or existed. Orphan and Hague Convention adoption ' +
          'cases under § 1101(b)(1)(F) and (G) have their own machinery, which this record does not attempt to ' +
          'describe.',
        es:
          'La filiación no matrimonial computa por la madre biológica, y por el padre biológico cuando existe o ' +
          'existió una relación paternofilial genuina. Los supuestos de menor huérfano y de adopción bajo el ' +
          'Convenio de La Haya de los arts. 1101(b)(1)(F) y (G) tienen su propia regulación, que este registro ' +
          'no pretende describir.',
      },
    },
    {
      id: 'us-ir-child-under-21-and-unmarried',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1101-b-1', 'us-ina-1151-f'],
      label: {
        en: 'Unmarried and under 21, with the age taken on the date the petition was filed',
        es: 'Soltero o soltera y menor de 21 años, tomando la edad en la fecha de presentación de la petición',
      },
      // Age is the one thing here Meridian can actually compute, and the
      // computation is returned in the report's evidence trace. The criterion
      // still escalates, for two reasons that no arithmetic can fix: marital
      // status is not a recorded fact, and § 1151(f)(1) fixes the age at the
      // filing date rather than at the assessment date, so a person over 21
      // today may still be an immediate relative and reporting them "unmet"
      // would be a false negative on the most consequential field in the record.
      evaluator: { op: 'lt', path: 'derived.ageYears', value: 21 },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The age shown in this report is the applicant\'s age on the assessment date, computed from the ' +
          'recorded date of birth. The statute does not use that date: § 1151(f)(1) determines the age ' +
          '"using the age of the alien on the date on which the petition is filed", and § 1151(f)(2) and (f)(3) ' +
          'substitute the date of a parent\'s naturalisation or of the termination of a marriage where a ' +
          'petition converts to this classification. Marital status is not recorded at all, and marriage ends ' +
          'the classification outright.',
        es:
          'La edad que muestra este informe es la de la persona solicitante en la fecha de evaluación, ' +
          'calculada a partir de la fecha de nacimiento registrada. La ley no usa esa fecha: el art. 1151(f)(1) ' +
          'determina la edad «tomando la edad de la persona extranjera en la fecha de presentación de la ' +
          'petición», y los arts. 1151(f)(2) y (f)(3) sustituyen esa fecha por la de naturalización de un ' +
          'progenitor o la de terminación de un matrimonio cuando una petición se convierte a esta ' +
          'clasificación. El estado civil no consta en absoluto, y el matrimonio extingue la clasificación.',
      },
      guidance: {
        en:
          'Both halves of the definition are hard edges. A person who marries stops being a "child" whatever ' +
          'their age, and the classification becomes the third preference under § 1153(a)(3) if the petitioner ' +
          'is a citizen. A person who turns 21 stops being a "child" as well — but if the petition was filed ' +
          'before that birthday, § 1151(f)(1) preserves the classification, which is why filing dates matter ' +
          'more than birthdays on this route.',
        es:
          'Ambas mitades de la definición son límites nítidos. Quien contrae matrimonio deja de ser «hijo o ' +
          'hija» cualquiera que sea su edad, y la clasificación pasa a ser la tercera preferencia del art. ' +
          '1153(a)(3) si la persona peticionaria es ciudadana. Quien cumple 21 años también deja de serlo, ' +
          'pero si la petición se presentó antes de ese cumpleaños el art. 1151(f)(1) conserva la ' +
          'clasificación: por eso en esta vía pesan más las fechas de presentación que los cumpleaños.',
      },
    },
    {
      id: 'us-ir-child-petitioner-is-citizen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-a-1-a-i', 'us-ina-1151-b-2-a-i'],
      label: {
        en: 'The petitioning parent is a citizen of the United States and has filed a relative petition',
        es: 'El progenitor peticionario es ciudadano de los Estados Unidos y ha presentado la petición de familiar',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in the facts model describes the petitioner or their status. Whether the petitioning parent ' +
          'is a citizen or a lawful permanent resident decides whether this is an immediate relative case with ' +
          'no queue or a second-preference case with one.',
        es:
          'El modelo de datos no describe a la persona peticionaria ni su estatus. Que el progenitor ' +
          'peticionario sea ciudadano o residente permanente legal determina si el caso es de familiar ' +
          'inmediato, sin cola, o de segunda preferencia, con ella.',
      },
      guidance: {
        en:
          'If the petitioning parent is a lawful permanent resident, the classification is F2A under ' +
          '§ 1153(a)(2)(A), which is numerically limited. If that parent naturalises while the petition is ' +
          'pending, the case becomes an immediate relative case and § 1151(f)(2) fixes the age at the date of ' +
          'the naturalisation.',
        es:
          'Si el progenitor peticionario es residente permanente legal, la clasificación es F2A del art. ' +
          '1153(a)(2)(A), sujeta a cupo. Si esa persona se naturaliza mientras la petición está pendiente, el ' +
          'caso pasa a ser de familiar inmediato y el art. 1151(f)(2) fija la edad en la fecha de la ' +
          'naturalización.',
      },
    },
    {
      id: 'us-ir-child-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor income and no household size, and the sponsor here is the petitioning ' +
          'parent rather than the applicant. The test compares the sponsor\'s income against a proportion of a ' +
          'poverty figure that varies with the number of people they are responsible for.',
        es:
          'Meridian no registra los ingresos de la persona patrocinadora ni el tamaño del hogar, y aquí la ' +
          'patrocinadora es el progenitor peticionario, no la persona solicitante. La prueba compara sus ' +
          'ingresos con una proporción de una cifra de pobreza que varía según el número de personas a su ' +
          'cargo.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1151(b)(2), so ' +
          'it is a requirement of the route. Section 1183a states the level as a proportion — not less than ' +
          '125 per cent of the Federal poverty line, with a 100 per cent special rule for a sponsor on active ' +
          'duty in the Armed Forces — and the poverty line is revised annually and varies with household size, ' +
          'so Meridian records the proportion and never a currency amount. A joint sponsor may take on the same ' +
          'enforceable obligation where the petitioner cannot meet the level alone.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1151(b)(2), de modo que es un requisito de la vía. El art. 1183a expresa el nivel como ' +
          'proporción —no menos del 125 por ciento del umbral federal de pobreza, con una regla especial del ' +
          '100 por ciento para quien está en servicio activo en las Fuerzas Armadas— y el umbral se revisa ' +
          'cada año y varía con el tamaño del hogar, por lo que Meridian registra la proporción y nunca un ' +
          'importe. Una persona patrocinadora conjunta puede asumir la misma obligación exigible si la ' +
          'peticionaria no alcanza el nivel por sí sola.',
      },
    },
    {
      id: 'us-ir-child-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'A citizen parent living abroad is not automatically domiciled in the United States for this purpose. ' +
          'On a route where the family has been living outside the country the point should be settled before ' +
          'anything is filed.',
        es:
          'Un progenitor ciudadano que vive en el extranjero no está automáticamente domiciliado en los ' +
          'Estados Unidos a estos efectos. En una vía en la que la familia ha vivido fuera del país conviene ' +
          'resolver la cuestión antes de presentar nada.',
      },
    },
    {
      id: 'us-ir-child-adjustment-or-consular',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['us-ina-1255-a', 'us-ina-1255-c-2', 'us-ina-1182-a-grounds'],
      label: {
        en: 'Whether the case can be finished inside the United States or must go to a consulate abroad',
        es: 'Si el caso puede resolverse dentro de los Estados Unidos o debe tramitarse en un consulado',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This turns on the manner of the applicant\'s last entry — inspected and admitted, paroled, or ' +
          'entered without inspection — and `ApplicantFacts` does not model it. Without that fact no honest ' +
          'statement can be made about § 1255(a).',
        es:
          'Depende de la forma de la última entrada —inspección y admisión, permiso condicional (parole) o ' +
          'entrada sin inspección— y `ApplicantFacts` no la modela. Sin ese dato no cabe afirmar nada honesto ' +
          'sobre el art. 1255(a).',
      },
      guidance: {
        en:
          'Adjustment under § 1255(a) is open only to someone inspected and admitted or paroled. An immediate ' +
          'relative who was admitted and then overstayed is expressly excepted from the § 1255(c)(2) bars; ' +
          'someone who entered without inspection fails § 1255(a) itself and the exception does not reach them. ' +
          'Note that time spent under eighteen years of age does not count toward unlawful presence under ' +
          '§ 1182(a)(9)(B), which changes the calculation for a young applicant — but that provision is not ' +
          'encoded here and needs to be read with a qualified representative.',
        es:
          'El ajuste del art. 1255(a) solo está abierto a quien fue inspeccionado y admitido o recibió permiso ' +
          'condicional. El familiar inmediato admitido que después excedió su estancia queda expresamente ' +
          'exceptuado de las prohibiciones del art. 1255(c)(2); quien entró sin inspección incumple el propio ' +
          'art. 1255(a) y la excepción no le alcanza. Debe tenerse en cuenta que el tiempo transcurrido antes ' +
          'de cumplir dieciocho años no computa como presencia ilegal conforme al art. 1182(a)(9)(B), lo que ' +
          'altera el cálculo para una persona solicitante joven; esa disposición no se codifica aquí y debe ' +
          'leerse con una persona representante cualificada.',
      },
    },
    {
      id: 'us-ir-child-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-ir-child-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Health, security, misrepresentation and the § 1182(a)(9) grounds are not modelled here.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. Los ' +
          'motivos de salud, seguridad, falsedad y los del art. 1182(a)(9) no se modelan aquí.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1151-a', 'us-ina-1151-b-2-a-i', 'us-ina-1153-d'],
    note: {
      en:
        'No queue applies. Section 1151(a) sets the worldwide levels "Exclusive of aliens described in ' +
        'subsection (b)" and § 1151(b)(2)(A)(i) places the children of United States citizens in that ' +
        'subsection, so there is no annual limit, no per-country cap and no priority date. Section 1153(d), ' +
        'which gives the spouse and children of a preference beneficiary the same classification and priority ' +
        'date, does not reach immediate relatives at all — so an applicant on this route who has children of ' +
        'their own cannot bring them as derivatives, and each of them needs a petition in their own right. ' +
        'Meridian publishes no processing time for this route.',
      es:
        'No se aplica cola alguna. El art. 1151(a) fija los niveles mundiales «con exclusión de las personas ' +
        'descritas en el apartado (b)» y el art. 1151(b)(2)(A)(i) sitúa en ese apartado a los hijos e hijas de ' +
        'personas ciudadanas estadounidenses, de modo que no hay límite anual, ni tope por país, ni fecha de ' +
        'prioridad. El art. 1153(d), que otorga al cónyuge y a los hijos de una persona beneficiaria de ' +
        'preferencia su misma clasificación y fecha de prioridad, no alcanza en absoluto a los familiares ' +
        'inmediatos: quien accede por esta vía y tiene hijos propios no puede incorporarlos como derivados, y ' +
        'cada uno necesita su propia petición. Meridian no publica plazos de tramitación para esta vía.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Immediate relative — parent of a United States citizen aged 21 or over (IR-5)
// ---------------------------------------------------------------------------

export const usImmediateRelativeParent: Pathway = {
  id: 'us-immediate-relative-parent',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Immediate relative — parent of a United States citizen aged 21 or over',
    es: 'Familiar inmediato: madre o padre de una persona ciudadana estadounidense de 21 años o más',
  },
  summary: {
    en:
      'Permanent residence for the parent of a United States citizen, where that citizen is at least 21 years ' +
      'old and files the petition. The age of the petitioning son or daughter is part of the statutory ' +
      'definition of the class rather than an administrative detail. Like the other immediate relative ' +
      'classifications it is outside the numerical system entirely.',
    es:
      'Residencia permanente para la madre o el padre de una persona ciudadana de los Estados Unidos, siempre ' +
      'que esa persona tenga al menos 21 años y presente la petición. La edad del hijo o de la hija ' +
      'peticionaria forma parte de la definición legal de la categoría y no es un detalle administrativo. Como ' +
      'las demás clasificaciones de familiar inmediato, queda enteramente fuera del sistema de cupos.',
  },
  citations: [
    usIna1151a,
    usIna1151b2Ai,
    usIna1101b1,
    usIna1101b2,
    usIna1153d,
    usIna1154a1Ai,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usIna1255a,
    usIna1255c2,
    usCfr22_42_21,
  ],
  criteria: [
    {
      id: 'us-ir-parent-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1151-b-2-a-i', 'us-ina-1101-b-2', 'us-ina-1101-b-1', 'us-cfr-22-42-21'],
      label: {
        en: 'The applicant is a "parent" of the petitioning citizen as the Act defines that term',
        es: 'La persona solicitante es «madre o padre» de la persona peticionaria conforme a la definición legal',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no relationship. Section 1101(b)(2) makes "parent" mean a parent "only where the ' +
          'relationship exists by reason of any of the circumstances set forth in subdivision (1)" — so the ' +
          'step-parent and adoptive-parent conditions in § 1101(b)(1)(B) and (E) govern this side of the ' +
          'relationship too, and each of them turns on a date this engine does not hold.',
        es:
          'Meridian no registra la relación. El art. 1101(b)(2) define «madre o padre» únicamente «cuando la ' +
          'relación exista por alguna de las circunstancias establecidas en el subapartado (1)», de modo que ' +
          'las condiciones sobre padrastro o madrastra y sobre adopción de los arts. 1101(b)(1)(B) y (E) rigen ' +
          'también en este lado de la relación, y cada una depende de una fecha de la que este motor no ' +
          'dispone.',
      },
      guidance: {
        en:
          'The consequence is that a step-parent relationship supports this classification only where the ' +
          'marriage that created it took place before the son or daughter turned eighteen, and an adoptive ' +
          'relationship only where the adoption took place before they turned sixteen and the two-year custody ' +
          'and residence condition is met. Section 1101(b)(2) also removes the natural father from the ' +
          'definition in certain orphan and Hague adoption cases where he has disappeared, abandoned or ' +
          'deserted the child or has irrevocably released the child in writing.',
        es:
          'La consecuencia es que la relación de padrastro o madrastra solo sostiene esta clasificación si el ' +
          'matrimonio que la creó se celebró antes de que el hijo o la hija cumpliera dieciocho años, y la ' +
          'adoptiva solo si la adopción se produjo antes de los dieciséis y se cumple la condición de dos años ' +
          'de custodia y convivencia. El art. 1101(b)(2) excluye además al padre biológico de la definición en ' +
          'ciertos supuestos de menor huérfano y de adopción bajo el Convenio de La Haya cuando ha ' +
          'desaparecido, abandonado o desatendido al menor o lo ha cedido irrevocablemente por escrito.',
      },
    },
    {
      id: 'us-ir-parent-petitioner-citizen-aged-21',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1151-b-2-a-i', 'us-ina-1154-a-1-a-i', 'us-cfr-22-42-21'],
      label: {
        en: 'The petitioning son or daughter is a United States citizen aged at least 21',
        es: 'El hijo o la hija peticionaria es ciudadana de los Estados Unidos y tiene al menos 21 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Both facts belong to the petitioner and Meridian records neither. The 21-year requirement is written ' +
          'into § 1151(b)(2)(A)(i) itself — "except that, in the case of parents, such citizens shall be at ' +
          'least 21 years of age" — so a petition filed before that birthday does not create the ' +
          'classification.',
        es:
          'Ambos datos corresponden a la persona peticionaria y Meridian no registra ninguno. El requisito de ' +
          '21 años figura en el propio art. 1151(b)(2)(A)(i) —«salvo que, tratándose de progenitores, dichas ' +
          'personas ciudadanas deberán tener al menos 21 años»—, de modo que una petición presentada antes de ' +
          'ese cumpleaños no crea la clasificación.',
      },
      guidance: {
        en:
          'There is no category at all for the parent of a lawful permanent resident: § 1153(a)(2) reaches only ' +
          'a spouse, a child, and an unmarried son or daughter. A permanent resident who wants to petition for ' +
          'a parent has to naturalise first, and then be 21.',
        es:
          'No existe categoría alguna para la madre o el padre de una persona residente permanente legal: el ' +
          'art. 1153(a)(2) solo alcanza al cónyuge, a los hijos menores y a los hijos e hijas solteras. Una ' +
          'persona residente permanente que quiera peticionar por un progenitor debe naturalizarse primero y ' +
          'tener después 21 años.',
      },
    },
    {
      id: 'us-ir-parent-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The sponsor is the petitioning son or daughter, and Meridian records nothing about their income or ' +
          'their household size. The comparison the statute requires cannot be made from the facts held here.',
        es:
          'La persona patrocinadora es el hijo o la hija peticionaria, y Meridian no registra nada sobre sus ' +
          'ingresos ni sobre el tamaño de su hogar. La comparación que exige la ley no puede hacerse con los ' +
          'datos disponibles.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1151(b)(2). The ' +
          'level is a proportion — not less than 125 per cent of the Federal poverty line, with a 100 per cent ' +
          'special rule for a sponsor on active duty in the Armed Forces — and because the poverty line is ' +
          'revised annually and varies with household size, Meridian records the proportion and never a ' +
          'currency amount. A joint sponsor may assume the same enforceable obligation.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1151(b)(2). El nivel es una proporción —no menos del 125 por ciento del umbral federal de ' +
          'pobreza, con una regla especial del 100 por ciento para quien está en servicio activo en las ' +
          'Fuerzas Armadas— y, como el umbral se revisa cada año y varía con el tamaño del hogar, Meridian ' +
          'registra la proporción y nunca un importe. Una persona patrocinadora conjunta puede asumir la misma ' +
          'obligación exigible.',
      },
    },
    {
      id: 'us-ir-parent-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'A citizen son or daughter living abroad is not automatically domiciled in the United States for this ' +
          'purpose, and the point is decided on the facts before the affidavit can be accepted.',
        es:
          'Un hijo o una hija ciudadana que vive en el extranjero no está automáticamente domiciliada en los ' +
          'Estados Unidos a estos efectos, y la cuestión se resuelve según los hechos antes de admitir la ' +
          'declaración.',
      },
    },
    {
      id: 'us-ir-parent-adjustment-or-consular',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['us-ina-1255-a', 'us-ina-1255-c-2', 'us-ina-1182-a-grounds'],
      label: {
        en: 'Whether the case can be finished inside the United States or must go to a consulate abroad',
        es: 'Si el caso puede resolverse dentro de los Estados Unidos o debe tramitarse en un consulado',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This turns on the manner of the applicant\'s last entry — inspected and admitted, paroled, or ' +
          'entered without inspection — and `ApplicantFacts` does not model it.',
        es:
          'Depende de la forma de la última entrada —inspección y admisión, permiso condicional (parole) o ' +
          'entrada sin inspección— y `ApplicantFacts` no la modela.',
      },
      guidance: {
        en:
          'Adjustment under § 1255(a) is open only to someone inspected and admitted or paroled. The immediate ' +
          'relative exception in § 1255(c)(2) forgives an overstay but does not reach an entry without ' +
          'inspection. Where the case has to go abroad, departure is what triggers the unlawful-presence bars ' +
          'in § 1182(a)(9)(B), and that has to be assessed by a qualified representative before travel.',
        es:
          'El ajuste del art. 1255(a) solo está abierto a quien fue inspeccionado y admitido o recibió permiso ' +
          'condicional. La excepción de familiar inmediato del art. 1255(c)(2) perdona el exceso de estancia ' +
          'pero no alcanza a la entrada sin inspección. Si el caso debe tramitarse en el extranjero, la salida ' +
          'es lo que activa las prohibiciones por presencia ilegal del art. 1182(a)(9)(B), y eso debe ' +
          'valorarlo una persona representante cualificada antes de viajar.',
      },
    },
    {
      id: 'us-ir-parent-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. Age and health are ' +
          'two of those factors and both are commonly in issue on this route; neither has a threshold.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. La edad y la salud son dos de esos factores y ambos suelen estar en cuestión en esta ' +
          'vía; ninguno tiene umbral.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-ir-parent-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Health, security, misrepresentation and the § 1182(a)(9) grounds are not modelled here.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. Los ' +
          'motivos de salud, seguridad, falsedad y los del art. 1182(a)(9) no se modelan aquí.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1151-a', 'us-ina-1151-b-2-a-i', 'us-ina-1153-d'],
    note: {
      en:
        'No queue applies. Section 1151(a) sets the worldwide levels "Exclusive of aliens described in ' +
        'subsection (b)" and § 1151(b)(2)(A)(i) places the parents of United States citizens aged 21 or over ' +
        'in that subsection. Section 1153(d) does not reach immediate relatives, so a spouse of the applicant ' +
        '— the citizen\'s other parent, or a later spouse — cannot come as a derivative on this petition and ' +
        'needs a classification of their own. That is a frequent and costly surprise on this route, because ' +
        'the citizen can petition for each parent separately but nobody else travels on either petition. ' +
        'Meridian publishes no processing time for this route.',
      es:
        'No se aplica cola alguna. El art. 1151(a) fija los niveles mundiales «con exclusión de las personas ' +
        'descritas en el apartado (b)» y el art. 1151(b)(2)(A)(i) sitúa en ese apartado a las madres y padres ' +
        'de personas ciudadanas estadounidenses de 21 años o más. El art. 1153(d) no alcanza a los familiares ' +
        'inmediatos, de modo que el cónyuge de la persona solicitante —el otro progenitor de la persona ' +
        'ciudadana, o un cónyuge posterior— no puede acompañarla como derivado en esta petición y necesita ' +
        'una clasificación propia. Es una sorpresa frecuente y costosa en esta vía, porque la persona ' +
        'ciudadana puede peticionar por cada progenitor por separado pero nadie más viaja con ninguna de las ' +
        'dos peticiones. Meridian no publica plazos de tramitación para esta vía.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// F1 — unmarried sons and daughters of United States citizens
// ---------------------------------------------------------------------------

export const usFamilyPreferenceF1: Pathway = {
  id: 'us-family-preference-f1',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'First family preference (F1) — unmarried son or daughter of a United States citizen',
    es: 'Primera preferencia familiar (F1): hijo o hija soltera de una persona ciudadana estadounidense',
  },
  summary: {
    en:
      'Permanent residence for the unmarried son or daughter of a United States citizen who is no longer a ' +
      '"child" as the Act defines that term — in practice, one who has reached 21. Unlike the immediate ' +
      'relative classifications this category is numerically limited: § 1153(a)(1) allocates not more than ' +
      '23,400 visas a year plus any the fourth preference does not use, § 1152(a)(2) caps any single foreign ' +
      'state at 7 per cent, and cases are reached in order of priority date. Marrying moves the beneficiary to ' +
      'the third preference.',
    es:
      'Residencia permanente para el hijo o la hija soltera de una persona ciudadana estadounidense que ya no ' +
      'es «hijo o hija menor» según la definición legal, en la práctica quien ha cumplido 21 años. A ' +
      'diferencia de las clasificaciones de familiar inmediato, esta categoría está sujeta a cupo: el art. ' +
      '1153(a)(1) asigna un máximo de 23.400 visas anuales más las que no utilice la cuarta preferencia, el ' +
      'art. 1152(a)(2) limita a cualquier estado extranjero al 7 por ciento y los casos se atienden por orden ' +
      'de fecha de prioridad. Contraer matrimonio traslada a la persona beneficiaria a la tercera preferencia.',
  },
  citations: [
    usIna1153a1,
    usIna1153a3,
    usIna1153d,
    usIna1153e1,
    usIna1151b2Ai,
    usIna1101b1,
    usIna1152a2,
    usIna1152b,
    usIna1152e,
    usIna1154a1Ai,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usCfr22_42_31,
    usDosVisaBulletin,
  ],
  criteria: [
    {
      id: 'us-f1-relationship-and-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-1', 'us-ina-1101-b-1', 'us-ina-1151-b-2-a-i', 'us-cfr-22-42-31'],
      label: {
        en: 'A son or daughter of the petitioning citizen who is no longer a "child" under § 1101(b)(1)',
        es: 'Hijo o hija de la persona peticionaria que ya no es «hijo menor» conforme al art. 1101(b)(1)',
      },
      // Age is computed and reported, and it is the only half of this test the
      // model can reach. It escalates all the same: the parent-child
      // relationship is not recorded, and the age shown is the age today rather
      // than at any of the dates the statute uses.
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 21 },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no parent-child relationship and no marital status, and the age shown here is the ' +
          'age on the assessment date rather than on any date the statute uses. Which subparagraph of ' +
          '§ 1101(b)(1) the relationship rests on — birth in wedlock, a stepchild relationship created before ' +
          'the child turned eighteen, a legitimation before eighteen, an adoption before sixteen with two ' +
          'years of custody and residence — has to be established by a person from documents.',
        es:
          'Meridian no registra la relación paternofilial ni el estado civil, y la edad mostrada es la de la ' +
          'fecha de evaluación y no la de ninguna fecha que la ley utilice. Qué subapartado del art. ' +
          '1101(b)(1) sustenta la relación —filiación matrimonial, relación de hijastro creada antes de los ' +
          'dieciocho años, legitimación antes de los dieciocho, adopción antes de los dieciséis con dos años ' +
          'de custodia y convivencia— debe acreditarlo una persona a partir de documentos.',
      },
      guidance: {
        en:
          'The Act uses "child" for an unmarried person under 21 and "son or daughter" for this preference. An ' +
          'unmarried person under 21 whose parent is a United States citizen is therefore an immediate relative ' +
          'under § 1151(b)(2)(A)(i), which is not numerically limited, rather than a first-preference ' +
          'beneficiary — so turning 21 does not end a case, it moves it into a queue. Where a petition already ' +
          'filed as an immediate relative case is affected, the age rules in § 1151(f) decide which date ' +
          'counts.',
        es:
          'La ley emplea «hijo o hija menor» para la persona soltera menor de 21 años y «hijo o hija» para ' +
          'esta preferencia. Por tanto, quien es soltera, menor de 21 años e hija de una persona ciudadana ' +
          'estadounidense es familiar inmediato conforme al art. 1151(b)(2)(A)(i), sin sujeción a cupo, y no ' +
          'beneficiaria de primera preferencia: cumplir 21 años no termina un caso, lo traslada a una cola. Si ' +
          'afecta a una petición ya presentada como caso de familiar inmediato, las reglas de edad del art. ' +
          '1151(f) determinan qué fecha cuenta.',
      },
    },
    {
      id: 'us-f1-remains-unmarried',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-1', 'us-ina-1153-a-3'],
      label: {
        en: 'The beneficiary is unmarried, and remains unmarried until permanent residence is granted',
        es: 'La persona beneficiaria está soltera y sigue soltera hasta la concesión de la residencia permanente',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Marital status is not a field in `ApplicantFacts`, and this category is defined by it. It is also ' +
          'not a one-off test: the word "unmarried" describes the beneficiary throughout, so a marriage at any ' +
          'point before the grant changes the classification.',
        es:
          'El estado civil no es un campo de `ApplicantFacts`, y esta categoría se define por él. Tampoco es ' +
          'una comprobación única: el término «soltera» describe a la persona beneficiaria en todo momento, de ' +
          'modo que un matrimonio en cualquier instante anterior a la concesión cambia la clasificación.',
      },
      guidance: {
        en:
          'Marrying does not destroy the case, it converts it: the classification becomes the third preference ' +
          'under § 1153(a)(3), because a United States citizen may petition for a married son or daughter. ' +
          'That is a different allocation and a different queue. The reverse also happens — a third-preference ' +
          'beneficiary whose marriage ends may convert back — and the timing is worth advice, because the two ' +
          'categories do not move at the same speed for the same chargeability area.',
        es:
          'Contraer matrimonio no destruye el caso, lo convierte: la clasificación pasa a ser la tercera ' +
          'preferencia del art. 1153(a)(3), porque una persona ciudadana estadounidense sí puede peticionar ' +
          'por un hijo o una hija casada. Eso supone otra asignación y otra cola. También ocurre lo inverso ' +
          '—quien es beneficiaria de tercera preferencia y ve terminado su matrimonio puede reconvertir— y el ' +
          'momento merece asesoramiento, porque ambas categorías no avanzan al mismo ritmo para una misma ' +
          'imputación.',
      },
    },
    {
      id: 'us-f1-petitioner-is-citizen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-a-1-a-i', 'us-cfr-22-42-31'],
      label: {
        en: 'The petitioning parent is a citizen of the United States and has filed a relative petition',
        es: 'El progenitor peticionario es ciudadano de los Estados Unidos y ha presentado la petición de familiar',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in the facts model describes the petitioner. Section 1154(a)(1)(A)(i) allows a citizen to ' +
          'petition for a first, third or fourth preference relationship or for an immediate relative, and ' +
          '22 CFR 42.31(a) requires the petitioner on this preference to be a parent — neither fact is ' +
          'recorded here.',
        es:
          'El modelo de datos no describe a la persona peticionaria. El art. 1154(a)(1)(A)(i) permite a una ' +
          'persona ciudadana peticionar por una relación de primera, tercera o cuarta preferencia o por un ' +
          'familiar inmediato, y el art. 22 CFR 42.31(a) exige que en esta preferencia la peticionaria sea ' +
          'progenitora; ninguno de esos datos consta aquí.',
      },
      guidance: {
        en:
          'If the petitioning parent is a lawful permanent resident rather than a citizen, the classification ' +
          'is F2B under § 1153(a)(2)(B), not F1. The two are close in wording and far apart in consequence, ' +
          'because an F2B beneficiary who marries loses the category outright while an F1 beneficiary who ' +
          'marries merely moves to F3.',
        es:
          'Si el progenitor peticionario es residente permanente legal y no ciudadano, la clasificación es F2B ' +
          'del art. 1153(a)(2)(B), no F1. Ambas se parecen en la redacción y distan mucho en sus ' +
          'consecuencias, porque quien es beneficiaria de F2B y contrae matrimonio pierde la categoría por ' +
          'completo, mientras que quien lo es de F1 solo pasa a F3.',
      },
    },
    {
      id: 'us-f1-visa-number-available',
      kind: 'procedural',
      weight: 'material',
      citationIds: [
        'us-ina-1152-a-2',
        'us-ina-1152-b',
        'us-ina-1152-e',
        'us-ina-1153-e-1',
        'us-dos-visa-bulletin',
      ],
      label: {
        en: 'A visa number is available in this category for the applicant\'s chargeability area',
        es: 'Hay número de visa disponible en esta categoría para el país de imputación de la persona solicitante',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This category is numerically limited and cases are reached in order of priority date under ' +
          '§ 1153(e)(1). Meridian records no priority date, and it deliberately encodes no cut-off date: the ' +
          'Department of State republishes those every month and warns that they can move backwards, so a date ' +
          'written into this catalog would be read as settled and would be wrong within weeks. Whether a ' +
          'number is available in this category for this chargeability area in a given month has to be read ' +
          'from the current Visa Bulletin by a person.',
        es:
          'Esta categoría está sujeta a cupo y los casos se atienden por orden de fecha de prioridad conforme ' +
          'al art. 1153(e)(1). Meridian no registra fecha de prioridad y no codifica deliberadamente ninguna ' +
          'fecha de corte: el Departamento de Estado las republica cada mes y advierte de que pueden ' +
          'retroceder, de modo que una fecha escrita en este catálogo se leería como firme y sería errónea en ' +
          'pocas semanas. Si hay número disponible en esta categoría para esa imputación en un mes concreto ' +
          'debe leerlo una persona en el Boletín de Visas vigente.',
      },
      guidance: {
        en:
          'Chargeability follows place of birth rather than nationality or residence (§ 1152(b)), so a Mexican ' +
          'national born elsewhere may not be charged to Mexico at all. Where demand from one state exceeds ' +
          'the 7 per cent per-country limit in § 1152(a)(2), § 1152(e) prorates the numbers available to ' +
          'natives of that state, and the Department of State currently names Mexico as one of four ' +
          'oversubscribed chargeability areas, with China (mainland-born), India and the Philippines. The ' +
          'practical consequence is that a Mexican-chargeability applicant in this category can wait ' +
          'materially longer than an applicant of another chargeability with the same priority date. Meridian ' +
          'states that structure and states no figure, because the figure moves every month.',
        es:
          'La imputación sigue el lugar de nacimiento y no la nacionalidad ni la residencia (art. 1152(b)), de ' +
          'modo que una persona de nacionalidad mexicana nacida en otro país puede no estar imputada a México. ' +
          'Cuando la demanda de un estado supera el límite del 7 por ciento por país del art. 1152(a)(2), el ' +
          'art. 1152(e) prorratea los números disponibles para las personas nacidas en él, y el Departamento ' +
          'de Estado señala actualmente a México como una de las cuatro áreas de imputación sobresuscritas, ' +
          'junto con China (nacidas en el continente), India y Filipinas. La consecuencia práctica es que una ' +
          'persona con imputación a México puede esperar en esta categoría bastante más que otra con distinta ' +
          'imputación y la misma fecha de prioridad. Meridian describe esa estructura y no da ninguna cifra, ' +
          'porque la cifra cambia cada mes.',
      },
    },
    {
      id: 'us-f1-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor, no sponsor income and no household size, and the sponsor here is the ' +
          'petitioning parent rather than the applicant.',
        es:
          'Meridian no registra a la persona patrocinadora, ni sus ingresos, ni el tamaño del hogar, y aquí la ' +
          'patrocinadora es el progenitor peticionario y no la persona solicitante.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1153(a), so it ' +
          'is a requirement of the route and not an optional document. The level is a proportion — not less ' +
          'than 125 per cent of the Federal poverty line, with a 100 per cent special rule for a sponsor on ' +
          'active duty in the Armed Forces — and because the poverty line is revised annually and varies with ' +
          'household size, Meridian records the proportion and never a currency amount. Where the petitioner ' +
          'cannot meet the level alone, a joint sponsor may take on the same enforceable obligation. Note that ' +
          'the household the sponsor must support includes every derivative travelling on the case.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1153(a), de modo que es un requisito de la vía y no un documento opcional. El nivel es una ' +
          'proporción —no menos del 125 por ciento del umbral federal de pobreza, con una regla especial del ' +
          '100 por ciento para quien está en servicio activo en las Fuerzas Armadas— y, como el umbral se ' +
          'revisa cada año y varía con el tamaño del hogar, Meridian registra la proporción y nunca un ' +
          'importe. Si la persona peticionaria no alcanza el nivel por sí sola, una patrocinadora conjunta ' +
          'puede asumir la misma obligación exigible. Téngase en cuenta que el hogar que debe sostener incluye ' +
          'a cada persona derivada que viaje en el caso.',
      },
    },
    {
      id: 'us-f1-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'The requirement is on the sponsor and it does not disappear because the case has waited years. A ' +
          'petitioner who moved abroad while the priority date matured is not automatically domiciled in the ' +
          'United States, and on this category that gap can be long.',
        es:
          'El requisito recae en la persona patrocinadora y no desaparece porque el caso haya esperado años. ' +
          'Quien presentó la petición y se mudó al extranjero mientras maduraba la fecha de prioridad no está ' +
          'automáticamente domiciliada en los Estados Unidos, y en esta categoría ese lapso puede ser largo.',
      },
    },
    {
      id: 'us-f1-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-f1-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Health, security, misrepresentation and the § 1182(a)(9) grounds are not modelled here, and on a ' +
          'category with a long wait the applicant\'s own immigration history in the meantime is usually what ' +
          'decides the case.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. Los ' +
          'motivos de salud, seguridad, falsedad y los del art. 1182(a)(9) no se modelan aquí y, en una ' +
          'categoría de espera larga, lo que suele decidir el caso es el propio historial migratorio de la ' +
          'persona solicitante durante ese tiempo.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1153-a-1', 'us-ina-1153-d', 'us-ina-1152-a-2', 'us-dos-visa-bulletin'],
    note: {
      en:
        'This is a numerically limited category and the wait is the route. Section 1153(a)(1) allocates not ' +
        'more than 23,400 visas a year plus any the fourth preference does not use; § 1152(a)(2) caps any ' +
        'single foreign state at 7 per cent of the combined preference limits; and § 1152(e) prorates the ' +
        'numbers for a state whose demand exceeds that cap, which is what produces a separate and later queue ' +
        'for an oversubscribed chargeability area such as Mexico. Meridian records no priority date, no ' +
        'cut-off date and no estimate of waiting time, and none should be added: the Visa Bulletin is ' +
        'republished monthly and its dates can retrogress. Unlike an immediate relative, a beneficiary in this ' +
        'category does have derivatives — § 1153(d) gives their spouse and their children the same ' +
        'classification and the same priority date if accompanying or following to join, provided they are ' +
        'not independently entitled to immigrant status.',
      es:
        'Esta categoría está sujeta a cupo y la espera es la vía. El art. 1153(a)(1) asigna un máximo de ' +
        '23.400 visas anuales más las que no utilice la cuarta preferencia; el art. 1152(a)(2) limita a ' +
        'cualquier estado extranjero al 7 por ciento de los cupos de preferencia combinados; y el art. ' +
        '1152(e) prorratea los números de un estado cuya demanda supera ese tope, que es lo que genera una ' +
        'cola separada y más lenta para un área de imputación sobresuscrita como México. Meridian no registra ' +
        'fecha de prioridad, ni fecha de corte, ni estimación alguna de espera, y no debe añadirse ninguna: el ' +
        'Boletín de Visas se republica cada mes y sus fechas pueden retroceder. A diferencia del familiar ' +
        'inmediato, la persona beneficiaria de esta categoría sí tiene derivados: el art. 1153(d) otorga a su ' +
        'cónyuge y a sus hijos menores la misma clasificación y la misma fecha de prioridad si la acompañan o ' +
        'se reúnen después con ella, siempre que no tengan por sí mismos derecho a un estatus de inmigrante.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// F2A — spouses and children of lawful permanent residents
// ---------------------------------------------------------------------------

export const usFamilyPreferenceF2a: Pathway = {
  id: 'us-family-preference-f2a',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Second family preference A (F2A) — spouse or child of a lawful permanent resident',
    es: 'Segunda preferencia familiar A (F2A): cónyuge o hijo menor de una persona residente permanente legal',
  },
  summary: {
    en:
      'Permanent residence for the spouse, or the unmarried child under 21, of a lawful permanent resident. ' +
      'This is the closest counterpart to the immediate relative spouse route and it is not equivalent: the ' +
      'classification is numerically limited under § 1153(a)(2), which sets one allocation for the whole second ' +
      'preference and reserves not less than 77 per cent of it for this subparagraph, and cases are reached in ' +
      'order of priority date. If the petitioner naturalises, the beneficiary becomes an immediate relative and ' +
      'leaves the queue.',
    es:
      'Residencia permanente para el cónyuge, o para el hijo o la hija soltera menor de 21 años, de una persona ' +
      'residente permanente legal. Es la vía más próxima a la del cónyuge familiar inmediato y no es ' +
      'equivalente: la clasificación está sujeta a cupo conforme al art. 1153(a)(2), que fija una asignación ' +
      'única para toda la segunda preferencia y reserva no menos del 77 por ciento de ella a este subapartado, ' +
      'y los casos se atienden por orden de fecha de prioridad. Si la persona peticionaria se naturaliza, la ' +
      'beneficiaria pasa a ser familiar inmediato y sale de la cola.',
  },
  citations: [
    usIna1153a2,
    usIna1153d,
    usIna1153e1,
    usIna1153h,
    usIna1151b2Ai,
    usIna1151f,
    usIna1101b1,
    usIna1152a2,
    usIna1152b,
    usIna1152e,
    usIna1154a1Bi,
    usIna1154c,
    usIna1154g,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usIna1186a,
    usCfr22_42_31,
    usDosVisaBulletin,
  ],
  criteria: [
    {
      id: 'us-f2a-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-2', 'us-ina-1101-b-1', 'us-ina-1154-c', 'us-cfr-22-42-31'],
      label: {
        en: 'The spouse, or the unmarried child under 21, of the petitioning permanent resident',
        es: 'Cónyuge, o hijo o hija soltera menor de 21 años, de la persona residente permanente peticionaria',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no relationship and no marital status, and this subparagraph covers two different ' +
          'relationships whose evidence has nothing in common. On the spouse branch a person must find the ' +
          'marriage valid where celebrated and bona fide, and must check § 1154(c), which bars approval where ' +
          'the applicant previously sought status through a marriage found to have been entered into to evade ' +
          'the immigration laws. On the child branch the question is which subparagraph of § 1101(b)(1) the ' +
          'relationship rests on, each of which carries its own dates.',
        es:
          'Meridian no registra la relación ni el estado civil, y este subapartado cubre dos relaciones ' +
          'distintas cuya prueba no tiene nada en común. En la rama del cónyuge, una persona debe apreciar que ' +
          'el matrimonio es válido en el lugar de celebración y genuino, y comprobar el art. 1154(c), que ' +
          'impide la aprobación cuando la persona solicitante buscó antes un estatus mediante un matrimonio ' +
          'declarado contraído para eludir la ley migratoria. En la rama filial, la cuestión es en qué ' +
          'subapartado del art. 1101(b)(1) descansa la relación, cada uno con sus propias fechas.',
      },
      guidance: {
        en:
          'A "child" here is unmarried and under 21, but the age is not measured on the day you read this: for ' +
          'a § 1153(a)(2)(A) beneficiary § 1153(h) determines age using the age when a visa number became ' +
          'available, reduced by the days the petition was pending, and only where the applicant sought ' +
          'permanent residence within one year of that availability. That is arithmetic on two recorded dates ' +
          'and it routinely produces an answer several years below the biological age. An abused spouse or ' +
          'child of a lawful permanent resident may also petition for themselves under § 1154(a)(1)(B); that ' +
          'route is deliberately not encoded here and needs a licensed attorney or a representative accredited ' +
          'by the Department of Justice.',
        es:
          'Aquí «hijo o hija menor» significa soltera y menor de 21 años, pero la edad no se mide el día en ' +
          'que se lee esto: para una persona beneficiaria del art. 1153(a)(2)(A), el art. 1153(h) determina la ' +
          'edad tomando la que tenía cuando quedó disponible un número de visa, restando los días en que la ' +
          'petición estuvo pendiente, y solo si solicitó la residencia permanente dentro del año siguiente a ' +
          'esa disponibilidad. Es aritmética sobre dos fechas registradas y con frecuencia arroja un resultado ' +
          'varios años inferior a la edad biológica. El cónyuge o el hijo víctima de violencia de una persona ' +
          'residente permanente legal también puede autopeticionar conforme al art. 1154(a)(1)(B); esa vía no ' +
          'se codifica aquí deliberadamente y requiere una persona abogada colegiada o representante ' +
          'acreditada por el Departamento de Justicia.',
      },
    },
    {
      id: 'us-f2a-petitioner-is-permanent-resident',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-a-1-b-i', 'us-ina-1151-b-2-a-i', 'us-ina-1151-f'],
      label: {
        en: 'The petitioner is a lawful permanent resident and has filed a relative petition',
        es: 'La persona peticionaria es residente permanente legal y ha presentado la petición de familiar',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in the facts model describes the petitioner or their status. Section 1154(a)(1)(B)(i) lets a ' +
          'lawful permanent resident petition for a § 1153(a)(2) relationship and for nothing else, so whether ' +
          'the petitioner holds permanent residence or citizenship decides which record applies.',
        es:
          'El modelo de datos no describe a la persona peticionaria ni su estatus. El art. 1154(a)(1)(B)(i) ' +
          'permite a una persona residente permanente legal peticionar por una relación del art. 1153(a)(2) y ' +
          'por ninguna otra, de modo que tener residencia permanente o ciudadanía determina qué registro se ' +
          'aplica.',
      },
      guidance: {
        en:
          'If the petitioner naturalises while the petition is pending, an F2A spouse or child becomes an ' +
          'immediate relative under § 1151(b)(2)(A)(i) and the numerical limit stops applying to them ' +
          'altogether. For a child, § 1151(f)(2) then fixes the age at the date of the parent\'s ' +
          'naturalisation. Naturalisation is therefore not merely a milestone for the petitioner; it can be ' +
          'the single most consequential act in the beneficiary\'s case, and its timing is worth advice.',
        es:
          'Si la persona peticionaria se naturaliza mientras la petición está pendiente, el cónyuge o el hijo ' +
          'de F2A pasa a ser familiar inmediato conforme al art. 1151(b)(2)(A)(i) y el cupo deja de aplicarle ' +
          'por completo. Tratándose de un hijo, el art. 1151(f)(2) fija entonces la edad en la fecha de ' +
          'naturalización del progenitor. La naturalización no es, pues, un simple hito para quien peticiona: ' +
          'puede ser el acto más determinante del caso de la persona beneficiaria, y su momento merece ' +
          'asesoramiento.',
      },
    },
    {
      id: 'us-f2a-marriage-not-during-proceedings',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-g'],
      label: {
        en: 'Where the claim is as a spouse, the marriage was not entered into during proceedings',
        es: 'Si se invoca la condición de cónyuge, el matrimonio no se contrajo durante un procedimiento',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no proceedings history and no marriage date. Section 1154(g) prevents the petition ' +
          'from being approved at all until the applicant has resided outside the United States for a 2-year ' +
          'period beginning after a marriage entered into while exclusion, deportation or removal proceedings ' +
          'were pending.',
        es:
          'Meridian no registra el historial de procedimientos ni la fecha del matrimonio. El art. 1154(g) ' +
          'impide aprobar la petición hasta que la persona solicitante haya residido dos años fuera de los ' +
          'Estados Unidos, contados desde un matrimonio contraído mientras estaban pendientes procedimientos ' +
          'de exclusión, deportación o expulsión.',
      },
      guidance: {
        en:
          'The bar is on the petition itself, which puts it before every question about visa availability, ' +
          'adjustment or admissibility. It does not apply where the claim is as a child rather than a spouse.',
        es:
          'La prohibición recae sobre la propia petición, lo que la sitúa antes de cualquier cuestión sobre ' +
          'disponibilidad de visa, ajuste o admisibilidad. No se aplica cuando se invoca la condición de hijo ' +
          'y no la de cónyuge.',
      },
    },
    {
      id: 'us-f2a-visa-number-available',
      kind: 'procedural',
      weight: 'material',
      citationIds: [
        'us-ina-1152-a-2',
        'us-ina-1152-b',
        'us-ina-1152-e',
        'us-ina-1153-e-1',
        'us-dos-visa-bulletin',
      ],
      label: {
        en: 'A visa number is available in this category for the applicant\'s chargeability area',
        es: 'Hay número de visa disponible en esta categoría para el país de imputación de la persona solicitante',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This category is numerically limited and cases are reached in order of priority date under ' +
          '§ 1153(e)(1). Meridian records no priority date and deliberately encodes no cut-off date, because ' +
          'the Department of State republishes those monthly and warns that they can retrogress. Whether a ' +
          'number is available for this chargeability area in a given month must be read from the current Visa ' +
          'Bulletin by a person.',
        es:
          'Esta categoría está sujeta a cupo y los casos se atienden por orden de fecha de prioridad conforme ' +
          'al art. 1153(e)(1). Meridian no registra fecha de prioridad y no codifica deliberadamente fecha de ' +
          'corte alguna, porque el Departamento de Estado las republica cada mes y advierte de que pueden ' +
          'retroceder. Si hay número disponible para esa imputación en un mes concreto debe leerlo una persona ' +
          'en el Boletín de Visas vigente.',
      },
      guidance: {
        en:
          'Chargeability follows place of birth rather than nationality (§ 1152(b)). Where demand from one ' +
          'state exceeds the 7 per cent per-country limit in § 1152(a)(2), § 1152(e) prorates the numbers ' +
          'available to natives of that state, and the Department of State currently names Mexico as one of ' +
          'four oversubscribed chargeability areas alongside China (mainland-born), India and the Philippines. ' +
          'A Mexican-chargeability applicant can therefore wait materially longer here than an applicant of ' +
          'another chargeability with the same priority date. Meridian states the structure and no figure.',
        es:
          'La imputación sigue el lugar de nacimiento y no la nacionalidad (art. 1152(b)). Cuando la demanda ' +
          'de un estado supera el límite del 7 por ciento por país del art. 1152(a)(2), el art. 1152(e) ' +
          'prorratea los números disponibles para las personas nacidas en él, y el Departamento de Estado ' +
          'señala actualmente a México como una de las cuatro áreas de imputación sobresuscritas, junto con ' +
          'China (nacidas en el continente), India y Filipinas. Una persona con imputación a México puede, por ' +
          'tanto, esperar aquí bastante más que otra con distinta imputación y la misma fecha de prioridad. ' +
          'Meridian describe la estructura y ninguna cifra.',
      },
    },
    {
      id: 'us-f2a-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor, no sponsor income and no household size. The sponsor here is the ' +
          'petitioning permanent resident, and § 1183a(f)(1) admits a lawful permanent resident as a sponsor ' +
          'on the same terms as a citizen.',
        es:
          'Meridian no registra a la persona patrocinadora, ni sus ingresos, ni el tamaño del hogar. Aquí la ' +
          'patrocinadora es la persona residente permanente peticionaria, y el art. 1183a(f)(1) admite como ' +
          'patrocinadora a una residente permanente legal en los mismos términos que a una ciudadana.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1153(a). The ' +
          'level is a proportion — not less than 125 per cent of the Federal poverty line, with a 100 per cent ' +
          'special rule for a sponsor on active duty in the Armed Forces — and because the poverty line is ' +
          'revised annually and varies with household size, Meridian records the proportion and never a ' +
          'currency amount. A joint sponsor may take on the same enforceable obligation.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1153(a). El nivel es una proporción —no menos del 125 por ciento del umbral federal de ' +
          'pobreza, con una regla especial del 100 por ciento para quien está en servicio activo en las ' +
          'Fuerzas Armadas— y, como el umbral se revisa cada año y varía con el tamaño del hogar, Meridian ' +
          'registra la proporción y nunca un importe. Una persona patrocinadora conjunta puede asumir la misma ' +
          'obligación exigible.',
      },
    },
    {
      id: 'us-f2a-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'A lawful permanent resident who has spent long periods outside the United States has two separate ' +
          'problems here — the domicile requirement in § 1183a(f)(1)(C), and the question of whether they have ' +
          'abandoned their own residence. The second is not modelled anywhere in this catalog and would end ' +
          'the petition, not merely delay it.',
        es:
          'Una persona residente permanente legal que ha pasado largos periodos fuera de los Estados Unidos ' +
          'afronta aquí dos problemas distintos: el requisito de domicilio del art. 1183a(f)(1)(C) y la ' +
          'cuestión de si ha abandonado su propia residencia. Lo segundo no se modela en ningún punto de este ' +
          'catálogo y acabaría con la petición, no solo la retrasaría.',
      },
    },
    {
      id: 'us-f2a-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-f2a-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Health, security, misrepresentation and the § 1182(a)(9) grounds are not modelled here.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. Los ' +
          'motivos de salud, seguridad, falsedad y los del art. 1182(a)(9) no se modelan aquí.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1153-a-2', 'us-ina-1153-d', 'us-ina-1153-h', 'us-ina-1186a', 'us-dos-visa-bulletin'],
    note: {
      en:
        'One statutory allocation, two queues. Section 1153(a)(2) sets a single second-preference number and ' +
        'reserves "not less than 77 percent of such visa numbers" for this subparagraph, which is why F2A and ' +
        'F2B move at different speeds and appear as separate lines in the Visa Bulletin. Section 1153(d) gives ' +
        'the beneficiary\'s own spouse and children the same classification and priority date if accompanying ' +
        'or following to join, and § 1153(h) applies the Child Status Protection Act formula both to a child ' +
        'beneficiary here and to derivative children. Where residence is obtained by virtue of a marriage ' +
        'entered into less than 24 months before the date the status is granted, § 1186a makes it conditional ' +
        'for two years, and on a category with a wait that condition frequently does not arise because the ' +
        'marriage is older than 24 months by the time a number is available. Meridian records no priority ' +
        'date, no cut-off date and no waiting time.',
      es:
        'Una sola asignación legal, dos colas. El art. 1153(a)(2) fija un número único de segunda preferencia ' +
        'y reserva «no menos del 77 por ciento de esos números de visa» a este subapartado, razón por la cual ' +
        'F2A y F2B avanzan a ritmos distintos y aparecen como líneas separadas en el Boletín de Visas. El ' +
        'art. 1153(d) otorga al cónyuge y a los hijos menores de la propia persona beneficiaria su misma ' +
        'clasificación y fecha de prioridad si la acompañan o se reúnen después con ella, y el art. 1153(h) ' +
        'aplica la fórmula de la Ley de Protección del Estatus del Menor tanto a una persona beneficiaria ' +
        'menor aquí como a los menores derivados. Cuando la residencia se obtiene en virtud de un matrimonio ' +
        'contraído menos de 24 meses antes de la fecha de concesión, el art. 1186a la convierte en ' +
        'condicional durante dos años; en una categoría con espera esa condición no suele producirse, porque ' +
        'para cuando hay número disponible el matrimonio ya supera los 24 meses. Meridian no registra fecha ' +
        'de prioridad, ni fecha de corte, ni plazo de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// F2B — unmarried sons and daughters of lawful permanent residents
// ---------------------------------------------------------------------------

export const usFamilyPreferenceF2b: Pathway = {
  id: 'us-family-preference-f2b',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Second family preference B (F2B) — unmarried son or daughter of a lawful permanent resident',
    es: 'Segunda preferencia familiar B (F2B): hijo o hija soltera de una persona residente permanente legal',
  },
  summary: {
    en:
      'Permanent residence for the unmarried son or daughter of a lawful permanent resident who is no longer a ' +
      '"child" as the Act defines that term. The category is numerically limited and takes what is left of the ' +
      'second-preference allocation after the 77 per cent reserved to F2A. Marriage ends the classification ' +
      'outright, because there is no married-child category for a permanent resident — a materially harsher ' +
      'consequence than the equivalent event in the first preference.',
    es:
      'Residencia permanente para el hijo o la hija soltera de una persona residente permanente legal que ya ' +
      'no es «hijo o hija menor» según la definición legal. La categoría está sujeta a cupo y recibe lo que ' +
      'resta de la asignación de segunda preferencia tras el 77 por ciento reservado a F2A. El matrimonio ' +
      'extingue la clasificación por completo, porque no existe categoría de hijo casado para una persona ' +
      'residente permanente: una consecuencia bastante más dura que la del mismo hecho en la primera ' +
      'preferencia.',
  },
  citations: [
    usIna1153a2,
    usIna1153a1,
    usIna1153d,
    usIna1153e1,
    usIna1101b1,
    usIna1152a2,
    usIna1152b,
    usIna1152e,
    usIna1154a1Bi,
    usIna1154k,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usCfr22_42_31,
    usDosVisaBulletin,
  ],
  criteria: [
    {
      id: 'us-f2b-relationship-and-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-2', 'us-ina-1101-b-1', 'us-cfr-22-42-31'],
      label: {
        en: 'A son or daughter of the petitioning permanent resident who is no longer a "child"',
        es: 'Hijo o hija de la persona residente permanente peticionaria que ya no es «hijo menor»',
      },
      // The statute says "the unmarried sons or unmarried daughters (but are not
      // the children)" — the parenthesis is the whole distinction between this
      // subparagraph and F2A, and it is an age-and-marital-status test.
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 21 },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no parent-child relationship and no marital status, and the age shown here is the ' +
          'age on the assessment date rather than on any date the statute uses. Section 1153(a)(2)(B) reaches ' +
          '"the unmarried sons or unmarried daughters (but are not the children)" of a permanent resident, so ' +
          'the boundary with F2A is exactly the § 1101(b)(1) definition and a person has to place the ' +
          'applicant on one side of it from documents.',
        es:
          'Meridian no registra la relación paternofilial ni el estado civil, y la edad mostrada es la de la ' +
          'fecha de evaluación y no la de ninguna fecha que la ley utilice. El art. 1153(a)(2)(B) alcanza a ' +
          '«los hijos e hijas solteras (que no sean hijos menores)» de una persona residente permanente, de ' +
          'modo que la frontera con F2A es exactamente la definición del art. 1101(b)(1) y una persona debe ' +
          'situar a la solicitante a un lado de ella a partir de documentos.',
      },
      guidance: {
        en:
          'Crossing 21 does not end a case in this family: it moves the beneficiary from F2A to F2B, which is ' +
          'a slower queue drawing on what is left after the 77 per cent reserved to F2A. Whether the Child ' +
          'Status Protection Act formula in § 1153(h) preserves the F2A classification instead is a ' +
          'calculation on the petition\'s pending time and the date a number became available, and it has to ' +
          'be done case by case.',
        es:
          'Cumplir 21 años no termina un caso en esta familia: traslada a la persona beneficiaria de F2A a ' +
          'F2B, una cola más lenta que se nutre de lo que resta tras el 77 por ciento reservado a F2A. Si la ' +
          'fórmula de la Ley de Protección del Estatus del Menor del art. 1153(h) conserva en cambio la ' +
          'clasificación F2A es un cálculo sobre el tiempo que estuvo pendiente la petición y la fecha en que ' +
          'hubo número disponible, y debe hacerse caso por caso.',
      },
    },
    {
      id: 'us-f2b-remains-unmarried',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-2', 'us-ina-1154-k', 'us-ina-1153-a-1'],
      label: {
        en: 'The beneficiary is unmarried, and remains unmarried until permanent residence is granted',
        es: 'La persona beneficiaria está soltera y sigue soltera hasta la concesión de la residencia permanente',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Marital status is not a field in `ApplicantFacts`, and this category is defined by it throughout ' +
          'rather than at a single moment.',
        es:
          'El estado civil no es un campo de `ApplicantFacts`, y esta categoría se define por él de forma ' +
          'continuada y no en un único momento.',
      },
      guidance: {
        en:
          'The consequence here is harsher than in the first preference. Section 1153(a)(2) gives a lawful ' +
          'permanent resident no category for a married son or daughter, so a marriage does not convert the ' +
          'case to anything — it ends it. If the petitioner naturalises first, § 1154(k) converts a pending ' +
          'petition to the first preference under § 1153(a)(1), where a later marriage would only move the ' +
          'case to the third preference. The beneficiary may elect in writing not to have that conversion ' +
          'apply, and keeps the priority date either way, because for some chargeability areas F2B moves ' +
          'faster than F1 — which is the whole reason the election exists, and a reason to take advice before ' +
          'either event.',
        es:
          'La consecuencia aquí es más dura que en la primera preferencia. El art. 1153(a)(2) no otorga a una ' +
          'persona residente permanente legal categoría alguna para un hijo o una hija casada, de modo que el ' +
          'matrimonio no convierte el caso en nada: lo extingue. Si la persona peticionaria se naturaliza ' +
          'antes, el art. 1154(k) convierte la petición pendiente en primera preferencia del art. 1153(a)(1), ' +
          'donde un matrimonio posterior solo trasladaría el caso a la tercera preferencia. La persona ' +
          'beneficiaria puede optar por escrito por que esa conversión no se aplique, y conserva la fecha de ' +
          'prioridad en cualquier caso, porque para algunas áreas de imputación F2B avanza más rápido que F1: ' +
          'esa es la razón de ser de la opción y un motivo para pedir asesoramiento antes de cualquiera de ' +
          'los dos hechos.',
      },
    },
    {
      id: 'us-f2b-petitioner-is-permanent-resident',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-a-1-b-i', 'us-cfr-22-42-31'],
      label: {
        en: 'The petitioner is a lawful permanent resident and has filed a relative petition',
        es: 'La persona peticionaria es residente permanente legal y ha presentado la petición de familiar',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in the facts model describes the petitioner or their status, and 22 CFR 42.31(a) requires ' +
          'the petitioner on this preference to be a parent.',
        es:
          'El modelo de datos no describe a la persona peticionaria ni su estatus, y el art. 22 CFR 42.31(a) ' +
          'exige que en esta preferencia la peticionaria sea progenitora.',
      },
      guidance: {
        en:
          'If the petitioner is already a citizen, the classification is F1 under § 1153(a)(1) rather than ' +
          'F2B. The wording of the two categories is nearly identical and their consequences on marriage are ' +
          'not.',
        es:
          'Si la persona peticionaria ya es ciudadana, la clasificación es F1 del art. 1153(a)(1) y no F2B. La ' +
          'redacción de ambas categorías es casi idéntica y sus consecuencias ante el matrimonio no lo son.',
      },
    },
    {
      id: 'us-f2b-visa-number-available',
      kind: 'procedural',
      weight: 'material',
      citationIds: [
        'us-ina-1152-a-2',
        'us-ina-1152-b',
        'us-ina-1152-e',
        'us-ina-1153-e-1',
        'us-dos-visa-bulletin',
      ],
      label: {
        en: 'A visa number is available in this category for the applicant\'s chargeability area',
        es: 'Hay número de visa disponible en esta categoría para el país de imputación de la persona solicitante',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This category is numerically limited and cases are reached in order of priority date under ' +
          '§ 1153(e)(1). Meridian records no priority date and deliberately encodes no cut-off date, because ' +
          'the Department of State republishes those monthly and warns that they can retrogress.',
        es:
          'Esta categoría está sujeta a cupo y los casos se atienden por orden de fecha de prioridad conforme ' +
          'al art. 1153(e)(1). Meridian no registra fecha de prioridad y no codifica deliberadamente fecha de ' +
          'corte alguna, porque el Departamento de Estado las republica cada mes y advierte de que pueden ' +
          'retroceder.',
      },
      guidance: {
        en:
          'Chargeability follows place of birth rather than nationality (§ 1152(b)). Where demand from one ' +
          'state exceeds the 7 per cent per-country limit in § 1152(a)(2), § 1152(e) prorates the numbers ' +
          'available to natives of that state, and the Department of State currently names Mexico as one of ' +
          'four oversubscribed chargeability areas alongside China (mainland-born), India and the Philippines. ' +
          'A Mexican-chargeability applicant can therefore wait materially longer here than an applicant of ' +
          'another chargeability with the same priority date. Meridian states the structure and no figure.',
        es:
          'La imputación sigue el lugar de nacimiento y no la nacionalidad (art. 1152(b)). Cuando la demanda ' +
          'de un estado supera el límite del 7 por ciento por país del art. 1152(a)(2), el art. 1152(e) ' +
          'prorratea los números disponibles para las personas nacidas en él, y el Departamento de Estado ' +
          'señala actualmente a México como una de las cuatro áreas de imputación sobresuscritas, junto con ' +
          'China (nacidas en el continente), India y Filipinas. Una persona con imputación a México puede, por ' +
          'tanto, esperar aquí bastante más que otra con distinta imputación y la misma fecha de prioridad. ' +
          'Meridian describe la estructura y ninguna cifra.',
      },
    },
    {
      id: 'us-f2b-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor, no sponsor income and no household size. The sponsor here is the ' +
          'petitioning permanent resident.',
        es:
          'Meridian no registra a la persona patrocinadora, ni sus ingresos, ni el tamaño del hogar. Aquí la ' +
          'patrocinadora es la persona residente permanente peticionaria.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1153(a). The ' +
          'level is a proportion — not less than 125 per cent of the Federal poverty line, with a 100 per cent ' +
          'special rule for a sponsor on active duty in the Armed Forces — and because the poverty line is ' +
          'revised annually and varies with household size, Meridian records the proportion and never a ' +
          'currency amount. A joint sponsor may take on the same enforceable obligation.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1153(a). El nivel es una proporción —no menos del 125 por ciento del umbral federal de ' +
          'pobreza, con una regla especial del 100 por ciento para quien está en servicio activo en las ' +
          'Fuerzas Armadas— y, como el umbral se revisa cada año y varía con el tamaño del hogar, Meridian ' +
          'registra la proporción y nunca un importe. Una persona patrocinadora conjunta puede asumir la misma ' +
          'obligación exigible.',
      },
    },
    {
      id: 'us-f2b-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'A permanent resident sponsor who has spent long periods abroad faces both the domicile requirement ' +
          'and a question about their own residence, and this category can wait long enough for that to ' +
          'become a live issue.',
        es:
          'Una persona patrocinadora residente permanente que ha pasado largos periodos en el extranjero ' +
          'afronta a la vez el requisito de domicilio y una cuestión sobre su propia residencia, y esta ' +
          'categoría puede esperar lo bastante como para que eso llegue a plantearse.',
      },
    },
    {
      id: 'us-f2b-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-f2b-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Health, security, misrepresentation and the § 1182(a)(9) grounds are not modelled here.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. Los ' +
          'motivos de salud, seguridad, falsedad y los del art. 1182(a)(9) no se modelan aquí.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1153-a-2', 'us-ina-1153-d', 'us-ina-1154-k', 'us-dos-visa-bulletin'],
    note: {
      en:
        'This subparagraph takes what is left of the second-preference allocation after the "not less than ' +
        '77 percent" § 1153(a)(2) reserves to F2A, which is why it is the slower of the two queues. Section ' +
        '1153(d) gives the beneficiary\'s own spouse and children the same classification and priority date ' +
        'if accompanying or following to join. Section 1154(k) converts a pending petition to the first ' +
        'preference if the petitioner naturalises, subject to the beneficiary\'s written election to stay, ' +
        'with the priority date retained either way. Meridian records no priority date, no cut-off date and ' +
        'no waiting time, and none should be added.',
      es:
        'Este subapartado recibe lo que resta de la asignación de segunda preferencia tras el «no menos del ' +
        '77 por ciento» que el art. 1153(a)(2) reserva a F2A, razón por la cual es la más lenta de las dos ' +
        'colas. El art. 1153(d) otorga al cónyuge y a los hijos menores de la propia persona beneficiaria su ' +
        'misma clasificación y fecha de prioridad si la acompañan o se reúnen después con ella. El art. ' +
        '1154(k) convierte la petición pendiente en primera preferencia si quien peticiona se naturaliza, sin ' +
        'perjuicio de la opción escrita de la persona beneficiaria de permanecer en la categoría, ' +
        'conservándose la fecha de prioridad en ambos casos. Meridian no registra fecha de prioridad, ni ' +
        'fecha de corte, ni plazo de espera, y no debe añadirse ninguno.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// F3 — married sons and daughters of United States citizens
// ---------------------------------------------------------------------------

export const usFamilyPreferenceF3: Pathway = {
  id: 'us-family-preference-f3',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Third family preference (F3) — married son or daughter of a United States citizen',
    es: 'Tercera preferencia familiar (F3): hijo o hija casada de una persona ciudadana estadounidense',
  },
  summary: {
    en:
      'Permanent residence for the married son or daughter of a United States citizen. Only a citizen can ' +
      'petition in this category — § 1153(a)(2) gives a lawful permanent resident no married-child ' +
      'classification at all. The category is numerically limited to not more than 23,400 visas a year plus ' +
      'any the first and second preferences do not use, and cases are reached in order of priority date.',
    es:
      'Residencia permanente para el hijo o la hija casada de una persona ciudadana de los Estados Unidos. ' +
      'Solo una persona ciudadana puede peticionar en esta categoría: el art. 1153(a)(2) no otorga a una ' +
      'residente permanente legal clasificación alguna para un hijo casado. La categoría está limitada a un ' +
      'máximo de 23.400 visas anuales más las que no utilicen la primera y la segunda preferencias, y los ' +
      'casos se atienden por orden de fecha de prioridad.',
  },
  citations: [
    usIna1153a3,
    usIna1153a1,
    usIna1153d,
    usIna1153e1,
    usIna1151f,
    usIna1101b1,
    usIna1152a2,
    usIna1152b,
    usIna1152e,
    usIna1154a1Ai,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usCfr22_42_31,
    usDosVisaBulletin,
  ],
  criteria: [
    {
      id: 'us-f3-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: [
        'us-ina-1153-a-3',
        'us-ina-1101-b-1',
        'us-ina-1153-a-1',
        'us-ina-1151-f',
        'us-cfr-22-42-31',
      ],
      label: {
        en: 'A married son or daughter of the petitioning United States citizen',
        es: 'Hijo o hija casada de la persona ciudadana estadounidense que presenta la petición',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records neither the parent-child relationship nor marital status, and this category is ' +
          'defined by both. The relationship must rest on one of the subparagraphs of § 1101(b)(1) — birth in ' +
          'wedlock, a stepchild relationship created before the child turned eighteen, a legitimation before ' +
          'eighteen, an adoption before sixteen with two years of custody and residence — and which one it is ' +
          'has to be established by a person from documents.',
        es:
          'Meridian no registra ni la relación paternofilial ni el estado civil, y esta categoría se define ' +
          'por ambos. La relación debe descansar en alguno de los subapartados del art. 1101(b)(1) —filiación ' +
          'matrimonial, relación de hijastro creada antes de los dieciocho años, legitimación antes de los ' +
          'dieciocho, adopción antes de los dieciséis con dos años de custodia y convivencia— y cuál sea debe ' +
          'acreditarlo una persona a partir de documentos.',
      },
      guidance: {
        en:
          'The classification tracks the marriage. If the marriage ends by death, divorce or annulment before ' +
          'permanent residence is granted, the case converts: to the first preference under § 1153(a)(1) if ' +
          'the beneficiary is still no longer a "child", and § 1151(f)(3) fixes the age at the date the ' +
          'marriage terminated where the conversion is to immediate relative status. Whether that helps ' +
          'depends on which queue is moving faster for the applicant\'s chargeability area, which is a ' +
          'question for the current Visa Bulletin and for advice.',
        es:
          'La clasificación sigue al matrimonio. Si este termina por fallecimiento, divorcio o nulidad antes ' +
          'de la concesión de la residencia permanente, el caso se convierte: a la primera preferencia del ' +
          'art. 1153(a)(1) si la persona beneficiaria sigue sin ser «hija menor», y el art. 1151(f)(3) fija la ' +
          'edad en la fecha de terminación del matrimonio cuando la conversión es a familiar inmediato. Si eso ' +
          'beneficia o no depende de qué cola avance más rápido para su área de imputación, lo que remite al ' +
          'Boletín de Visas vigente y al asesoramiento.',
      },
    },
    {
      id: 'us-f3-petitioner-is-citizen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1154-a-1-a-i', 'us-cfr-22-42-31'],
      label: {
        en: 'The petitioning parent is a citizen of the United States and has filed a relative petition',
        es: 'El progenitor peticionario es ciudadano de los Estados Unidos y ha presentado la petición de familiar',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in the facts model describes the petitioner or their status, and 22 CFR 42.31(a) requires ' +
          'the petitioner on this preference to be a parent.',
        es:
          'El modelo de datos no describe a la persona peticionaria ni su estatus, y el art. 22 CFR 42.31(a) ' +
          'exige que en esta preferencia la peticionaria sea progenitora.',
      },
      guidance: {
        en:
          'There is no equivalent route from a lawful permanent resident parent. If the petitioning parent ' +
          'has not naturalised, a married son or daughter has no family classification through them at all — ' +
          'not a slower one, none — and the position only changes if and when that parent becomes a citizen.',
        es:
          'No existe vía equivalente desde un progenitor residente permanente legal. Si el progenitor ' +
          'peticionario no se ha naturalizado, un hijo o una hija casada no tiene a través de él clasificación ' +
          'familiar alguna —no una más lenta, ninguna— y la situación solo cambia si esa persona llega a ser ' +
          'ciudadana.',
      },
    },
    {
      id: 'us-f3-visa-number-available',
      kind: 'procedural',
      weight: 'material',
      citationIds: [
        'us-ina-1152-a-2',
        'us-ina-1152-b',
        'us-ina-1152-e',
        'us-ina-1153-e-1',
        'us-dos-visa-bulletin',
      ],
      label: {
        en: 'A visa number is available in this category for the applicant\'s chargeability area',
        es: 'Hay número de visa disponible en esta categoría para el país de imputación de la persona solicitante',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This category is numerically limited and cases are reached in order of priority date under ' +
          '§ 1153(e)(1). Meridian records no priority date and deliberately encodes no cut-off date, because ' +
          'the Department of State republishes those monthly and warns that they can retrogress.',
        es:
          'Esta categoría está sujeta a cupo y los casos se atienden por orden de fecha de prioridad conforme ' +
          'al art. 1153(e)(1). Meridian no registra fecha de prioridad y no codifica deliberadamente fecha de ' +
          'corte alguna, porque el Departamento de Estado las republica cada mes y advierte de que pueden ' +
          'retroceder.',
      },
      guidance: {
        en:
          'Chargeability follows place of birth rather than nationality (§ 1152(b)). Where demand from one ' +
          'state exceeds the 7 per cent per-country limit in § 1152(a)(2), § 1152(e) prorates the numbers ' +
          'available to natives of that state, and the Department of State currently names Mexico as one of ' +
          'four oversubscribed chargeability areas alongside China (mainland-born), India and the Philippines. ' +
          'A Mexican-chargeability applicant can therefore wait materially longer here than an applicant of ' +
          'another chargeability with the same priority date. Meridian states the structure and no figure.',
        es:
          'La imputación sigue el lugar de nacimiento y no la nacionalidad (art. 1152(b)). Cuando la demanda ' +
          'de un estado supera el límite del 7 por ciento por país del art. 1152(a)(2), el art. 1152(e) ' +
          'prorratea los números disponibles para las personas nacidas en él, y el Departamento de Estado ' +
          'señala actualmente a México como una de las cuatro áreas de imputación sobresuscritas, junto con ' +
          'China (nacidas en el continente), India y Filipinas. Una persona con imputación a México puede, por ' +
          'tanto, esperar aquí bastante más que otra con distinta imputación y la misma fecha de prioridad. ' +
          'Meridian describe la estructura y ninguna cifra.',
      },
    },
    {
      id: 'us-f3-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor, no sponsor income and no household size. On this category the ' +
          'household the sponsor must be able to support is often large, because the beneficiary\'s spouse and ' +
          'children travel with them as derivatives under § 1153(d).',
        es:
          'Meridian no registra a la persona patrocinadora, ni sus ingresos, ni el tamaño del hogar. En esta ' +
          'categoría el hogar que debe poder sostener suele ser numeroso, porque el cónyuge y los hijos ' +
          'menores de la persona beneficiaria viajan con ella como derivados conforme al art. 1153(d).',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1153(a). The ' +
          'level is a proportion — not less than 125 per cent of the Federal poverty line, with a 100 per cent ' +
          'special rule for a sponsor on active duty in the Armed Forces — and because the poverty line is ' +
          'revised annually and varies with household size, Meridian records the proportion and never a ' +
          'currency amount. A joint sponsor may take on the same enforceable obligation.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1153(a). El nivel es una proporción —no menos del 125 por ciento del umbral federal de ' +
          'pobreza, con una regla especial del 100 por ciento para quien está en servicio activo en las ' +
          'Fuerzas Armadas— y, como el umbral se revisa cada año y varía con el tamaño del hogar, Meridian ' +
          'registra la proporción y nunca un importe. Una persona patrocinadora conjunta puede asumir la misma ' +
          'obligación exigible.',
      },
    },
    {
      id: 'us-f3-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'The requirement is on the sponsor and does not lapse because the case has waited years. A ' +
          'petitioner who moved abroad while the priority date matured is not automatically domiciled in the ' +
          'United States.',
        es:
          'El requisito recae en la persona patrocinadora y no decae porque el caso haya esperado años. Quien ' +
          'presentó la petición y se mudó al extranjero mientras maduraba la fecha de prioridad no está ' +
          'automáticamente domiciliada en los Estados Unidos.',
      },
    },
    {
      id: 'us-f3-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-f3-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Each derivative travelling on the case is assessed for admissibility in their own right, and one ' +
          'inadmissible family member does not make the others inadmissible.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. ' +
          'Cada persona derivada que viaja en el caso se valora en cuanto a admisibilidad por sí misma, y que ' +
          'un familiar sea inadmisible no hace inadmisibles a los demás.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1153-a-3', 'us-ina-1153-d', 'us-ina-1152-a-2', 'us-dos-visa-bulletin'],
    note: {
      en:
        'A numerically limited category: § 1153(a)(3) allocates not more than 23,400 visas a year plus any the ' +
        'first and second preferences do not use, § 1152(a)(2) caps any single foreign state at 7 per cent of ' +
        'the combined preference limits, and § 1152(e) prorates the numbers for a state whose demand exceeds ' +
        'that cap — which is what produces the separate, later queue for an oversubscribed chargeability area ' +
        'such as Mexico. Section 1153(d) gives the beneficiary\'s spouse and children the same classification ' +
        'and priority date if accompanying or following to join, so this category usually moves a household ' +
        'rather than a person. Meridian records no priority date, no cut-off date and no waiting time.',
      es:
        'Categoría sujeta a cupo: el art. 1153(a)(3) asigna un máximo de 23.400 visas anuales más las que no ' +
        'utilicen la primera y la segunda preferencias, el art. 1152(a)(2) limita a cualquier estado ' +
        'extranjero al 7 por ciento de los cupos de preferencia combinados y el art. 1152(e) prorratea los ' +
        'números de un estado cuya demanda supera ese tope, que es lo que genera la cola separada y más lenta ' +
        'de un área de imputación sobresuscrita como México. El art. 1153(d) otorga al cónyuge y a los hijos ' +
        'menores de la persona beneficiaria su misma clasificación y fecha de prioridad si la acompañan o se ' +
        'reúnen después con ella, de modo que esta categoría suele mover a un hogar y no a una persona. ' +
        'Meridian no registra fecha de prioridad, ni fecha de corte, ni plazo de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// F4 — brothers and sisters of United States citizens aged 21 or over
// ---------------------------------------------------------------------------

export const usFamilyPreferenceF4: Pathway = {
  id: 'us-family-preference-f4',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Fourth family preference (F4) — brother or sister of a United States citizen aged 21 or over',
    es: 'Cuarta preferencia familiar (F4): hermano o hermana de una persona ciudadana estadounidense de 21 años o más',
  },
  summary: {
    en:
      'Permanent residence for the brother or sister of a United States citizen who is at least 21 years old. ' +
      'The petitioner\'s age is part of the statutory definition of the category. This is the last of the four ' +
      'preferences in the cascade and the most heavily subscribed: § 1153(a)(4) allocates not more than 65,000 ' +
      'visas a year, the other three preferences take any spare numbers before it does, and the 7 per cent ' +
      'per-country cap applies on top. There is no sibling category at all for a lawful permanent resident.',
    es:
      'Residencia permanente para el hermano o la hermana de una persona ciudadana estadounidense de al menos ' +
      '21 años. La edad de quien peticiona forma parte de la definición legal de la categoría. Es la última de ' +
      'las cuatro preferencias en la cascada y la de mayor demanda: el art. 1153(a)(4) asigna un máximo de ' +
      '65.000 visas anuales, las otras tres preferencias toman antes cualquier número sobrante y encima se ' +
      'aplica el tope del 7 por ciento por país. No existe categoría de hermanos para una persona residente ' +
      'permanente legal.',
  },
  citations: [
    usIna1153a4,
    usIna1153a2,
    usIna1153d,
    usIna1153e1,
    usIna1101b1,
    usIna1152a2,
    usIna1152b,
    usIna1152e,
    usIna1154a1Ai,
    usIna1182a4,
    usIna1182a4C,
    usIna1182aGrounds,
    usIna1183a,
    usCfr22_42_31,
    usDosVisaBulletin,
  ],
  criteria: [
    {
      id: 'us-f4-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-4', 'us-ina-1101-b-1'],
      label: {
        en: 'A brother or sister of the petitioning United States citizen',
        es: 'Hermano o hermana de la persona ciudadana estadounidense que presenta la petición',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no family relationships at all. A sibling relationship is proved through a shared ' +
          'parent, so the evidence has to establish both that the applicant and the petitioner each stand in a ' +
          'qualifying relationship to that parent under § 1101(b)(1) — which brings in the step-relationship ' +
          'and adoption conditions where the sibling relationship arises that way — and that the petitioner is ' +
          'a citizen. None of that is in the model.',
        es:
          'Meridian no registra relación familiar alguna. La relación fraterna se prueba a través de un ' +
          'progenitor común, de modo que la prueba debe acreditar tanto que la persona solicitante y la ' +
          'peticionaria mantienen cada una una relación computable con ese progenitor conforme al art. ' +
          '1101(b)(1) —lo que incorpora las condiciones sobre afinidad y adopción cuando la fraternidad nace ' +
          'de ahí— como que la peticionaria es ciudadana. Nada de eso figura en el modelo.',
      },
      guidance: {
        en:
          'Half-siblings and step-siblings are not automatically excluded, but the relationship still has to ' +
          'run through a parent-child relationship the Act recognises, and the age conditions in ' +
          '§ 1101(b)(1)(B) and (E) apply to each leg. It is a documentary exercise and it is worth doing ' +
          'carefully before a petition is filed, because on this category a defect discovered later is ' +
          'discovered after a very long wait.',
        es:
          'Los medio hermanos y los hermanastros no quedan excluidos automáticamente, pero la relación debe ' +
          'seguir pasando por un vínculo paternofilial que la ley reconozca, y las condiciones de edad de los ' +
          'arts. 1101(b)(1)(B) y (E) se aplican a cada tramo. Es un trabajo documental y conviene hacerlo con ' +
          'cuidado antes de presentar la petición, porque en esta categoría un defecto que se descubre después ' +
          'se descubre tras una espera muy larga.',
      },
    },
    {
      id: 'us-f4-petitioner-citizen-aged-21',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1153-a-4', 'us-ina-1154-a-1-a-i', 'us-cfr-22-42-31'],
      label: {
        en: 'The petitioning sibling is a United States citizen aged at least 21',
        es: 'El hermano o la hermana peticionaria es ciudadana de los Estados Unidos y tiene al menos 21 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Both facts belong to the petitioner and Meridian records neither. The 21-year requirement is inside ' +
          'the category itself — § 1153(a)(4) reaches "the brothers or sisters of citizens of the United ' +
          'States, if such citizens are at least 21 years of age" — and 22 CFR 42.31(a) repeats it for ' +
          'petitions filed after 1 January 1977.',
        es:
          'Ambos datos corresponden a la persona peticionaria y Meridian no registra ninguno. El requisito de ' +
          '21 años está dentro de la propia categoría —el art. 1153(a)(4) alcanza a «los hermanos o hermanas ' +
          'de personas ciudadanas de los Estados Unidos, si dichas personas tienen al menos 21 años»— y el ' +
          'art. 22 CFR 42.31(a) lo reitera para las peticiones presentadas después del 1 de enero de 1977.',
      },
      guidance: {
        en:
          'Section 1153(a)(2) gives a lawful permanent resident no sibling category, so a permanent resident ' +
          'cannot petition for a brother or sister at all: they must naturalise first, and then be 21. That ' +
          'is not a slower route through the same door, it is a different door that does not open until then.',
        es:
          'El art. 1153(a)(2) no otorga a una persona residente permanente legal categoría alguna de ' +
          'hermanos, de modo que no puede peticionar en absoluto por un hermano o una hermana: debe ' +
          'naturalizarse primero y tener después 21 años. No es una vía más lenta por la misma puerta, es una ' +
          'puerta distinta que hasta entonces no se abre.',
      },
    },
    {
      id: 'us-f4-visa-number-available',
      kind: 'procedural',
      weight: 'material',
      citationIds: [
        'us-ina-1152-a-2',
        'us-ina-1152-b',
        'us-ina-1152-e',
        'us-ina-1153-e-1',
        'us-dos-visa-bulletin',
      ],
      label: {
        en: 'A visa number is available in this category for the applicant\'s chargeability area',
        es: 'Hay número de visa disponible en esta categoría para el país de imputación de la persona solicitante',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This is the most heavily subscribed of the four preferences and cases are reached strictly in order ' +
          'of priority date under § 1153(e)(1). Meridian records no priority date and deliberately encodes no ' +
          'cut-off date, because the Department of State republishes those monthly and warns that they can ' +
          'retrogress. Nothing an applicant does moves them up this queue.',
        es:
          'Es la preferencia con mayor demanda de las cuatro y los casos se atienden estrictamente por orden ' +
          'de fecha de prioridad conforme al art. 1153(e)(1). Meridian no registra fecha de prioridad y no ' +
          'codifica deliberadamente fecha de corte alguna, porque el Departamento de Estado las republica cada ' +
          'mes y advierte de que pueden retroceder. Nada de lo que haga la persona solicitante la adelanta en ' +
          'esta cola.',
      },
      guidance: {
        en:
          'Chargeability follows place of birth rather than nationality (§ 1152(b)). Where demand from one ' +
          'state exceeds the 7 per cent per-country limit in § 1152(a)(2), § 1152(e) prorates the numbers ' +
          'available to natives of that state, and the Department of State currently names Mexico as one of ' +
          'four oversubscribed chargeability areas alongside China (mainland-born), India and the Philippines. ' +
          'This category is where that bites hardest: it sits last in the cascade of § 1153(a) and takes only ' +
          'the numbers the first three preferences leave. Anybody weighing this route against another should ' +
          'read the current Visa Bulletin with a qualified representative rather than rely on any figure ' +
          'quoted anywhere, including here — and no figure is quoted here.',
        es:
          'La imputación sigue el lugar de nacimiento y no la nacionalidad (art. 1152(b)). Cuando la demanda ' +
          'de un estado supera el límite del 7 por ciento por país del art. 1152(a)(2), el art. 1152(e) ' +
          'prorratea los números disponibles para las personas nacidas en él, y el Departamento de Estado ' +
          'señala actualmente a México como una de las cuatro áreas de imputación sobresuscritas, junto con ' +
          'China (nacidas en el continente), India y Filipinas. Esta categoría es donde más se nota: ocupa el ' +
          'último lugar de la cascada del art. 1153(a) y solo recibe los números que dejan las tres primeras ' +
          'preferencias. Quien compare esta vía con otra debería leer el Boletín de Visas vigente con una ' +
          'persona representante cualificada y no fiarse de ninguna cifra citada en ningún sitio, este ' +
          'incluido, donde no se cita ninguna.',
      },
    },
    {
      id: 'us-f4-affidavit-of-support',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-ina-1182-a-4-c', 'us-ina-1183a'],
      label: {
        en: 'An enforceable affidavit of support at 125 per cent of the Federal poverty line',
        es: 'Declaración jurada de manutención exigible al 125 por ciento del umbral federal de pobreza',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor, no sponsor income and no household size. On this category the ' +
          'household is often large, because the beneficiary\'s spouse and children accompany them as ' +
          'derivatives under § 1153(d), and the income the sponsor must show scales with it.',
        es:
          'Meridian no registra a la persona patrocinadora, ni sus ingresos, ni el tamaño del hogar. En esta ' +
          'categoría el hogar suele ser numeroso, porque el cónyuge y los hijos menores de la persona ' +
          'beneficiaria la acompañan como derivados conforme al art. 1153(d), y los ingresos que debe ' +
          'acreditar quien patrocina crecen con él.',
      },
      guidance: {
        en:
          'Section 1182(a)(4)(C) makes the affidavit mandatory for a visa number issued under § 1153(a). The ' +
          'level is a proportion — not less than 125 per cent of the Federal poverty line, with a 100 per cent ' +
          'special rule for a sponsor on active duty in the Armed Forces — and because the poverty line is ' +
          'revised annually and varies with household size, Meridian records the proportion and never a ' +
          'currency amount. A joint sponsor may take on the same enforceable obligation.',
        es:
          'El art. 1182(a)(4)(C) hace obligatoria la declaración para un número de visa expedido conforme al ' +
          'art. 1153(a). El nivel es una proporción —no menos del 125 por ciento del umbral federal de ' +
          'pobreza, con una regla especial del 100 por ciento para quien está en servicio activo en las ' +
          'Fuerzas Armadas— y, como el umbral se revisa cada año y varía con el tamaño del hogar, Meridian ' +
          'registra la proporción y nunca un importe. Una persona patrocinadora conjunta puede asumir la misma ' +
          'obligación exigible.',
      },
    },
    {
      id: 'us-f4-sponsor-domicile',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1183a'],
      label: {
        en: 'The sponsor is domiciled in the United States and is at least 18 years old',
        es: 'La persona patrocinadora está domiciliada en los Estados Unidos y tiene al menos 18 años',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Domicile is a fact about the sponsor and the model holds none. Section 1183a(f)(1) requires the ' +
          'sponsor to be a citizen, national or lawful permanent resident, at least 18 years of age, and ' +
          'domiciled in a State, the District of Columbia or a territory or possession of the United States.',
        es:
          'El domicilio es un dato de la persona patrocinadora y el modelo no guarda ninguno. El art. ' +
          '1183a(f)(1) exige que sea ciudadana, nacional o residente permanente legal, mayor de 18 años y ' +
          'domiciliada en un estado, en el Distrito de Columbia o en un territorio o posesión de los Estados ' +
          'Unidos.',
      },
      guidance: {
        en:
          'On a category this slow the sponsor\'s circumstances at the time the case is finally reached are ' +
          'what count, not their circumstances when the petition was filed. Domicile, income and even ' +
          'survival of the petitioner all have to be revisited when a number becomes available.',
        es:
          'En una categoría tan lenta, lo que cuenta son las circunstancias de la persona patrocinadora ' +
          'cuando por fin se atiende el caso, no las que tenía al presentar la petición. El domicilio, los ' +
          'ingresos e incluso la supervivencia de quien peticiona deben revisarse cuando queda disponible un ' +
          'número.',
      },
    },
    {
      id: 'us-f4-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The affidavit of support is a factor the officer may consider under § 1182(a)(4)(B)(ii); it does not ' +
          'settle the ground. The regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from ' +
          '18 September 2026 by the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención es un factor que el funcionario puede considerar conforme al ' +
          'art. 1182(a)(4)(B)(ii); no resuelve el motivo. El marco reglamentario de 8 CFR 212.21 a 212.23 ' +
          'queda derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual ' +
          'la ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-f4-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-ina-1182-a-grounds'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Which convictions engage § 1182(a)(2), and ' +
          'whether any waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Qué condenas activan el art. 1182(a)(2), y ' +
          'si alguna exención las alcanza, es un análisis que este motor no realiza.',
      },
      guidance: {
        en:
          'Material and never blocking: a self-declaration is evidence toward admissibility, not the finding. ' +
          'Over a wait of this length the § 1182(a)(9) unlawful-presence and prior-removal grounds are the ' +
          'ones most likely to have arisen in the meantime, and they are not modelled here.',
        es:
          'Material y nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la resolución. En ' +
          'una espera de esta duración, los motivos de presencia ilegal y expulsión previa del art. ' +
          '1182(a)(9) son los que con más probabilidad habrán surgido entretanto, y aquí no se modelan.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1153-a-4', 'us-ina-1153-a-2', 'us-ina-1153-d', 'us-dos-visa-bulletin'],
    note: {
      en:
        'This category sits last in the cascade. Section 1153(a)(4) allocates not more than 65,000 visas a ' +
        'year "plus any visas not required for the classes specified in paragraphs (1) through (3)", so it ' +
        'receives spare numbers rather than contributing them, and the 7 per cent per-country cap and the ' +
        '§ 1152(e) prorating apply on top for an oversubscribed chargeability area. Section 1153(d) gives the ' +
        'beneficiary\'s spouse and children the same classification and priority date if accompanying or ' +
        'following to join. Note that § 1153(a)(2) contains no sibling category, so a lawful permanent ' +
        'resident cannot open this route at all. Meridian records no priority date, no cut-off date and no ' +
        'estimate of waiting time; anybody who needs to know how long this takes has to read the current Visa ' +
        'Bulletin, and should read it with somebody qualified.',
      es:
        'Esta categoría ocupa el último lugar de la cascada. El art. 1153(a)(4) asigna un máximo de 65.000 ' +
        'visas anuales «más las que no requieran las clases especificadas en los apartados (1) a (3)», de ' +
        'modo que recibe números sobrantes en lugar de aportarlos, y encima se le aplican el tope del 7 por ' +
        'ciento por país y el prorrateo del art. 1152(e) cuando el área de imputación está sobresuscrita. El ' +
        'art. 1153(d) otorga al cónyuge y a los hijos menores de la persona beneficiaria su misma ' +
        'clasificación y fecha de prioridad si la acompañan o se reúnen después con ella. Téngase en cuenta ' +
        'que el art. 1153(a)(2) no contiene categoría de hermanos, por lo que una persona residente ' +
        'permanente legal no puede abrir esta vía en absoluto. Meridian no registra fecha de prioridad, ni ' +
        'fecha de corte, ni estimación de espera; quien necesite saber cuánto tarda debe leer el Boletín de ' +
        'Visas vigente, y conviene que lo lea con alguien cualificado.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// K-1 — fiancé(e) of a United States citizen
// ---------------------------------------------------------------------------

export const usFianceK1: Pathway = {
  id: 'us-fiance-k1',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'K-1 — fiancé(e) of a United States citizen',
    es: 'K-1: prometido o prometida de una persona ciudadana de los Estados Unidos',
  },
  summary: {
    en:
      'A nonimmigrant classification for the fiancé(e) of a United States citizen, entering to conclude the ' +
      'marriage within ninety days of arrival and then to apply for permanent residence. It is not itself a ' +
      'residence route: § 1255(d) allows adjustment only to conditional permanent residence under § 1186a, and ' +
      'only as a result of the marriage to the citizen who filed the petition. The statute imposes conditions ' +
      'that surprise people — the couple must generally have met in person within the two years before the ' +
      'petition was filed, and the petitioner\'s criminal history must be disclosed.',
    es:
      'Clasificación de no inmigrante para la persona prometida de una ciudadana de los Estados Unidos, que ' +
      'entra para celebrar el matrimonio dentro de los noventa días siguientes a su llegada y solicitar ' +
      'después la residencia permanente. No es en sí una vía de residencia: el art. 1255(d) solo permite el ' +
      'ajuste a residencia permanente condicional del art. 1186a, y únicamente como resultado del matrimonio ' +
      'con la persona ciudadana que presentó la petición. La ley impone condiciones que sorprenden: por regla ' +
      'general la pareja debe haberse conocido en persona en los dos años anteriores a la presentación de la ' +
      'petición, y deben declararse los antecedentes penales de quien peticiona.',
  },
  citations: [
    usIna1101a15K,
    usIna1184d,
    usIna1255d,
    usIna1186a,
    usIna1182a4,
    usIna1182aGrounds,
    usCfr22_41_81,
  ],
  criteria: [
    {
      id: 'us-k1-approved-petition-by-citizen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1184-d', 'us-ina-1101-a-15-k', 'us-cfr-22-41-81'],
      label: {
        en: 'An approved fiancé(e) petition filed by the United States citizen the applicant intends to marry',
        es: 'Petición de prometido aprobada, presentada por la persona ciudadana con la que se pretende contraer matrimonio',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no petitioner and no relationship. A visa may not be issued under ' +
          '§ 1101(a)(15)(K)(i) until the consular officer has received a petition filed by the citizen and ' +
          'approved by the Secretary of Homeland Security, and 22 CFR 41.81(a) makes the officer\'s own ' +
          'satisfaction a second gate on top of the approval.',
        es:
          'Meridian no registra a la persona peticionaria ni la relación. No puede expedirse visa conforme al ' +
          'art. 1101(a)(15)(K)(i) hasta que el funcionario consular haya recibido una petición presentada por ' +
          'la persona ciudadana y aprobada por la Secretaría de Seguridad Nacional, y el art. 22 CFR 41.81(a) ' +
          'convierte la propia convicción del funcionario en un segundo filtro sobre esa aprobación.',
      },
      guidance: {
        en:
          'The identity of the petitioner is not interchangeable. Section 1255(d) permits adjustment only as ' +
          'a result of the marriage to the citizen who filed this petition, so a K-1 who arrives and marries ' +
          'somebody else has no route through this classification at all.',
        es:
          'La identidad de quien peticiona no es intercambiable. El art. 1255(d) solo permite el ajuste como ' +
          'resultado del matrimonio con la persona ciudadana que presentó esta petición, de modo que quien ' +
          'llega con una K-1 y se casa con otra persona no tiene vía alguna a través de esta clasificación.',
      },
    },
    {
      id: 'us-k1-met-in-person-within-two-years',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-ina-1184-d'],
      label: {
        en: 'The couple met in person within the 2 years before the petition was filed, unless waived',
        es: 'La pareja se conoció en persona en los 2 años anteriores a la presentación de la petición, salvo dispensa',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records neither the meeting nor the filing date, so the two-year window cannot be ' +
          'measured. The requirement is also waivable in the Secretary\'s discretion, and whether a waiver ' +
          'would be granted is a judgement rather than a calculation.',
        es:
          'Meridian no registra ni el encuentro ni la fecha de presentación, de modo que la ventana de dos ' +
          'años no puede medirse. El requisito es además dispensable a discreción de la Secretaría, y si se ' +
          'concedería una dispensa es una valoración y no un cálculo.',
      },
      guidance: {
        en:
          'The statute measures the two years backwards from the date the petition was filed, not from the ' +
          'interview or the intended wedding, so a long engagement conducted entirely at a distance can fail ' +
          'this test even where nobody doubts the relationship. Evidence of the meeting is documentary and is ' +
          'assembled before filing rather than afterwards.',
        es:
          'La ley cuenta los dos años hacia atrás desde la fecha de presentación de la petición, no desde la ' +
          'entrevista ni desde la boda prevista, de modo que un noviazgo largo mantenido enteramente a ' +
          'distancia puede incumplir esta prueba aunque nadie dude de la relación. La prueba del encuentro es ' +
          'documental y se reúne antes de presentar, no después.',
      },
    },
    {
      id: 'us-k1-intention-and-capacity-to-marry',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['us-ina-1184-d', 'us-cfr-22-41-81'],
      label: {
        en: 'A bona fide intention, and the legal capacity, to marry within ninety days of arrival',
        es: 'Intención genuina y capacidad legal para contraer matrimonio en los noventa días siguientes a la llegada',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The statute requires satisfactory evidence that the parties "have a bona fide intention to marry, ' +
          'and are legally able and actually willing to conclude a valid marriage in the United States within ' +
          'a period of ninety days after the alien\'s arrival". Intention is assessed by a consular officer on ' +
          'the whole record, and legal capacity turns on facts — an undissolved earlier marriage, for instance ' +
          '— that Meridian does not hold. 22 CFR 41.81(a)(2) additionally requires the applicant\'s own sworn ' +
          'statement of ability and intent.',
        es:
          'La ley exige prueba satisfactoria de que las partes «tienen intención genuina de casarse y están ' +
          'legalmente capacitadas y realmente dispuestas a celebrar un matrimonio válido en los Estados ' +
          'Unidos dentro de los noventa días siguientes a la llegada de la persona extranjera». La intención ' +
          'la valora un funcionario consular sobre todo el expediente, y la capacidad legal depende de hechos ' +
          '—por ejemplo, un matrimonio anterior no disuelto— de los que Meridian no dispone. El art. 22 CFR ' +
          '41.81(a)(2) exige además la declaración jurada de la propia persona solicitante sobre su capacidad ' +
          'e intención.',
      },
      guidance: {
        en:
          'The ninety-day period is not a target, it is the condition of the admission: § 1184(d)(1) provides ' +
          'that if the marriage does not occur within three months after the admission the person and any ' +
          'minor children must depart, and failing to do so makes them subject to removal proceedings. There ' +
          'is no extension of the period and marrying somebody else does not preserve the status.',
        es:
          'El plazo de noventa días no es un objetivo, es la condición de la admisión: el art. 1184(d)(1) ' +
          'dispone que si el matrimonio no se celebra dentro de los tres meses siguientes a la admisión, la ' +
          'persona y sus hijos menores deben salir, y no hacerlo las somete a un procedimiento de expulsión. ' +
          'El plazo no se prorroga y casarse con otra persona no conserva el estatus.',
      },
    },
    {
      id: 'us-k1-petitioner-history-disclosures',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['us-ina-1184-d'],
      label: {
        en: 'The petitioner\'s filing history and criminal-record disclosures under § 1184(d)(2) and (d)(3)',
        es: 'Historial de peticiones y declaración de antecedentes de quien peticiona conforme al art. 1184(d)(2) y (d)(3)',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Both provisions concern the petitioner, and Meridian records nothing about them. Paragraph (d)(2) ' +
          'requires a waiver where the petitioner has filed two or more previous fiancé(e) petitions or had ' +
          'one approved within the preceding 2 years, and makes that waiver subject to a general bar where ' +
          'the petitioner has a record of violent criminal offences, with an exception where they were acting ' +
          'in self-defence or were themselves a victim. Paragraph (d)(3) requires the petition to disclose ' +
          'convictions for the crimes it defines and any permanent protection or restraining order.',
        es:
          'Ambas disposiciones se refieren a la persona peticionaria, y Meridian no registra nada sobre ella. ' +
          'El apartado (d)(2) exige dispensa cuando ha presentado dos o más peticiones de prometido ' +
          'anteriores o se le aprobó una en los 2 años precedentes, y somete esa dispensa a una prohibición ' +
          'general cuando tiene antecedentes por delitos violentos, con excepción de que actuara en legítima ' +
          'defensa o fuera ella misma víctima. El apartado (d)(3) exige que la petición declare las condenas ' +
          'por los delitos que define y cualquier orden permanente de protección o alejamiento.',
      },
      guidance: {
        en:
          'These provisions exist to protect the beneficiary, and the disclosures are made to the beneficiary ' +
          'as well as to the government. Anyone who is given that information and is concerned by it should ' +
          'speak to a licensed attorney or a representative accredited by the Department of Justice before ' +
          'travelling. Meridian does not encode the protective routes that may be available in that situation, ' +
          'and their absence from this catalog is a deliberate scope decision rather than an absence of law.',
        es:
          'Estas disposiciones existen para proteger a la persona beneficiaria, y las declaraciones se le ' +
          'comunican a ella además de al gobierno. Quien reciba esa información y le preocupe debería hablar ' +
          'con una persona abogada colegiada o representante acreditada por el Departamento de Justicia antes ' +
          'de viajar. Meridian no codifica las vías de protección que puedan existir en esa situación, y su ' +
          'ausencia de este catálogo es una decisión deliberada de alcance y no una ausencia de norma.',
      },
    },
    {
      id: 'us-k1-immigrant-standard-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-cfr-22-41-81', 'us-ina-1182-a-grounds'],
      label: {
        en: 'Admissibility assessed as if the applicant were applying for an immigrant visa',
        es: 'Admisibilidad valorada como si se solicitara una visa de inmigrante',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility, and on this classification the standard is ' +
          'the stricter one: 22 CFR 41.81(d) requires the consular officer to determine eligibility "as if the ' +
          'alien were an applicant for an immigrant visa", with stated exceptions. Which convictions engage ' +
          '§ 1182(a)(2), and whether a waiver reaches them, is an analysis this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad y, en esta clasificación, el estándar es el ' +
          'más estricto: el art. 22 CFR 41.81(d) obliga al funcionario consular a determinar la elegibilidad ' +
          '«como si la persona extranjera solicitara una visa de inmigrante», con las excepciones que indica. ' +
          'Qué condenas activan el art. 1182(a)(2), y si alguna exención las alcanza, es un análisis que este ' +
          'motor no realiza.',
      },
      guidance: {
        en:
          'This is the reason a K-1 is not the light-touch option it looks like. The grounds in § 1182(a) are ' +
          'applied at the immigrant standard at the consulate, and again when permanent residence is applied ' +
          'for after the marriage, so a ground that would bar the green card generally bars the K-1 as well.',
        es:
          'Por esto una K-1 no es la opción liviana que aparenta. Los motivos del art. 1182(a) se aplican con ' +
          'el estándar de inmigrante en el consulado y de nuevo al solicitar la residencia permanente tras el ' +
          'matrimonio, de modo que un motivo que impediría la residencia impide por lo general también la ' +
          'K-1.',
      },
    },
    {
      id: 'us-k1-public-charge',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-ina-1182-a-4'],
      label: {
        en: 'The public charge ground — a discretionary judgement, not a threshold',
        es: 'El motivo de carga pública: una valoración discrecional, no un umbral',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Section 1182(a)(4)(A) turns on the officer\'s opinion that the person is likely at any time to ' +
          'become a public charge, against factors the statute lists but does not quantify. No engine performs ' +
          'that judgement.',
        es:
          'El art. 1182(a)(4)(A) depende del juicio del funcionario sobre la probabilidad de que la persona se ' +
          'convierta en algún momento en carga pública, con arreglo a factores que la ley enumera pero no ' +
          'cuantifica. Ningún motor realiza esa valoración.',
      },
      guidance: {
        en:
          'The mandatory affidavit of support in § 1182(a)(4)(C) attaches to a visa number issued under ' +
          '§ 1151(b)(2) or § 1153(a) — that is, to the immigrant application made after the marriage, not to ' +
          'this nonimmigrant one. The public charge ground in § 1182(a)(4)(A) applies at both stages. The ' +
          'regulatory framework at 8 CFR 212.21 to 212.23 is removed with effect from 18 September 2026 by ' +
          'the rule at 91 FR 45324, after which the statute is the only durable source.',
        es:
          'La declaración jurada de manutención obligatoria del art. 1182(a)(4)(C) se vincula a un número de ' +
          'visa expedido conforme al art. 1151(b)(2) o al art. 1153(a), es decir, a la solicitud de inmigrante ' +
          'posterior al matrimonio y no a esta de no inmigrante. El motivo de carga pública del art. ' +
          '1182(a)(4)(A) se aplica en ambas fases. El marco reglamentario de 8 CFR 212.21 a 212.23 queda ' +
          'derogado con efectos desde el 18 de septiembre de 2026 por la norma 91 FR 45324, tras lo cual la ' +
          'ley es la única fuente duradera.',
      },
    },
    {
      id: 'us-k1-adjustment-is-conditional-only',
      kind: 'status',
      weight: 'material',
      citationIds: ['us-ina-1255-d', 'us-ina-1186a'],
      label: {
        en: 'Adjustment after the marriage is to conditional permanent residence only',
        es: 'El ajuste posterior al matrimonio es únicamente a residencia permanente condicional',
      },
      evaluator: TARGET_IS_US,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Whether the marriage took place inside the ninety days, and whether it was to the petitioner, are ' +
          'facts about events Meridian does not record. Section 1255(d) permits adjustment for a K ' +
          'nonimmigrant only to conditional permanent residence under § 1186a and only as a result of the ' +
          'marriage to the citizen who filed the petition.',
        es:
          'Si el matrimonio se celebró dentro de los noventa días y si fue con la persona peticionaria son ' +
          'hechos que Meridian no registra. El art. 1255(d) solo permite a una persona no inmigrante K ' +
          'ajustar a residencia permanente condicional del art. 1186a y únicamente como resultado del ' +
          'matrimonio con la ciudadana que presentó la petición.',
      },
      guidance: {
        en:
          'The consequence is that a K-1 route always ends in conditional residence, whatever the calendar ' +
          'says: § 1186a would in any event make the residence conditional where the marriage is less than ' +
          '24 months old when the status is granted, and on this route the marriage is by construction ' +
          'recent. A joint petition to remove the conditions must be filed during the 90-day period before ' +
          'the second anniversary of the grant, and § 1186a(c)(4) allows the joint requirement to be waived ' +
          'on extreme hardship, on a good-faith marriage that ended without the applicant\'s fault, or on ' +
          'battery or extreme cruelty by the sponsoring spouse.',
        es:
          'La consecuencia es que la vía K-1 termina siempre en residencia condicional, diga lo que diga el ' +
          'calendario: el art. 1186a haría condicional la residencia en todo caso si el matrimonio tiene ' +
          'menos de 24 meses cuando se concede el estatus, y en esta vía el matrimonio es por construcción ' +
          'reciente. La petición conjunta para retirar las condiciones debe presentarse en el periodo de 90 ' +
          'días anterior al segundo aniversario de la concesión, y el art. 1186a(c)(4) permite dispensar el ' +
          'requisito conjunto por perjuicio extremo, por matrimonio de buena fe terminado sin culpa de la ' +
          'persona solicitante o por maltrato o crueldad extrema del cónyuge patrocinador.',
      },
    },
  ],
  durations: {
    citationIds: ['us-ina-1184-d', 'us-ina-1101-a-15-k', 'us-ina-1255-d'],
    note: {
      en:
        'The admission is short and its length is expressed in the statute in two different units, so neither ' +
        'is restated here as a number of months. Section 1184(d)(1) conditions the visa on the parties being ' +
        'willing to conclude a valid marriage "within a period of ninety days after the alien\'s arrival", ' +
        'and provides that if the marriage does not occur "within three months after the admission" the ' +
        'person and any minor children must depart. A minor child of the beneficiary may accompany or follow ' +
        'to join under § 1101(a)(15)(K)(iii). This classification is not a residence permit and confers no ' +
        'permanent status: the residence comes, if at all, from the adjustment § 1255(d) allows after the ' +
        'marriage, and that adjustment is to conditional permanent residence. Meridian publishes no ' +
        'processing time for any stage.',
      es:
        'La admisión es breve y su duración se expresa en la ley en dos unidades distintas, por lo que aquí ' +
        'no se reformula ninguna como número de meses. El art. 1184(d)(1) condiciona la visa a que las partes ' +
        'estén dispuestas a celebrar un matrimonio válido «dentro de un plazo de noventa días desde la ' +
        'llegada de la persona extranjera», y dispone que si el matrimonio no se celebra «dentro de los tres ' +
        'meses siguientes a la admisión» la persona y sus hijos menores deben salir. Un hijo menor de la ' +
        'persona beneficiaria puede acompañarla o reunirse después conforme al art. 1101(a)(15)(K)(iii). Esta ' +
        'clasificación no es un permiso de residencia y no confiere estatus permanente alguno: la residencia ' +
        'llega, si llega, del ajuste que el art. 1255(d) permite tras el matrimonio, y ese ajuste es a ' +
        'residencia permanente condicional. Meridian no publica plazos de tramitación para ninguna fase.',
    },
  },
  leadsTo: ['us-immediate-relative-spouse'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// The shipped set
// ---------------------------------------------------------------------------

export const US_FAMILY_PATHWAYS: readonly Pathway[] = [
  usImmediateRelativeSpouse,
  usImmediateRelativeChild,
  usImmediateRelativeParent,
  usFamilyPreferenceF1,
  usFamilyPreferenceF2a,
  usFamilyPreferenceF2b,
  usFamilyPreferenceF3,
  usFamilyPreferenceF4,
  usFianceK1,
];
