/**
 * The United States — the procedural layer, naturalisation by residence, and
 * the unlawful-presence bars.
 *
 * Seven records. Two of them are routes to lawful permanent residence
 * (adjustment of status and consular processing), two are naturalisation by
 * residence (the general five-year rule and the three-year rule for spouses of
 * citizens), and three are about § 1182(a)(9): the three- and ten-year bars,
 * the permanent bar, and the provisional waiver that exists for the first of
 * those and not for the second.
 *
 * ## Why these three sit together
 *
 * For a Mexican applicant they are one question, not three. 8 U.S.C. § 1255(a)
 * lets someone become a permanent resident without leaving the country — but
 * only if they were "inspected and admitted or paroled". Someone who entered
 * without inspection fails that at the threshold and must consular-process
 * instead, which means departing, and **departure is the event that fires
 * § 1182(a)(9)(B)**. The act of attending the interview is the act that starts
 * a three- or ten-year bar. A checker that answers "apply through your spouse"
 * without asking how the person last entered can cost them a decade, and that
 * is the specific harm these records exist to prevent.
 *
 * ## Polarity of the three screening records
 *
 * `us-unlawful-presence-bar-screening` and `us-permanent-bar-screening` are not
 * routes. Nobody applies for them and nobody is granted one. They are encoded
 * as pathways so that the engine surfaces them alongside the routes a person is
 * actually considering, and each carries a criterion with
 * `requiresHumanReview: true`, so `evaluate` returns `requires_human_review`
 * for them **unconditionally** — they can never produce `eligible`, and there
 * is therefore no reading in which "met" means "cleared". A bar is a question
 * for a licensed representative; this catalog can only say that the question is
 * live.
 *
 * ## What is deliberately not here
 *
 * - **No priority date, cut-off date, "dates for filing" date, queue position
 *   or waiting-time estimate.** The Visa Bulletin is republished monthly and
 *   retrogresses without notice, so any figure written here would be false
 *   before counsel read it. The *existence and structure* of the numerical
 *   limit is encoded, cited to 8 U.S.C. § 1152(a)(2); the figure is not.
 * - **Asylum, refugee status, withholding of removal, protection under the
 *   Convention Against Torture, U and T nonimmigrant status, and VAWA
 *   self-petitions are out of scope** and are not encoded here. They turn on
 *   credibility rather than on criteria, and a self-serve checker is the wrong
 *   instrument for a person at risk. Two of them intersect this file — the
 *   § 1182(a)(9)(B)(iii) exceptions cover a pending bona fide asylum
 *   application, battered spouses and children, and trafficking victims, and
 *   the only statutory waiver of the permanent bar is for VAWA self-petitioners
 *   — so their *existence* is named in guidance, with a pointer to a licensed
 *   attorney or a representative accredited by the Department of Justice. No
 *   route is built on them.
 * - **No estimate of the chance that a discretionary waiver or a discretionary
 *   grant will be given.** Both § 1255(a) and § 1182(a)(9)(B)(v) say in terms
 *   that the decision is discretionary, and the latter adds that no court may
 *   review it.
 *
 * ## Facts this file needs and `ApplicantFacts` does not model
 *
 * `facts.ts` is shared by every jurisdiction and is not this file's to change.
 * Four gaps bite hardest here and are listed in the report accompanying this
 * work: **manner of last entry** (inspected and admitted / paroled / entered
 * without inspection), **the authorised-stay end date** from the I-94 as
 * distinct from visa validity, **unlawful-presence periods as `DateRange`s**,
 * and **qualifying relatives with their status**. Where a requirement cannot be
 * expressed from the facts that do exist, the criterion is written with
 * {@link NOT_MODELLED} and `requiresHumanReview: true`, which surfaces it to a
 * person with a reason attached instead of letting it evaluate to `unknown`
 * for every applicant forever.
 *
 * ## Verification
 *
 * Every citation carrying a `url` was fetched on 2026-07-26 from that exact
 * URL. `fam.state.gov` could not be fetched from this environment — its
 * certificate chain does not verify here — so the two Foreign Affairs Manual
 * citations carry no `url` and say so in their notes. Nothing in this file is a
 * review: every record is `reviewStatus: 'unreviewed'`, which is what keeps it
 * out of `recommend`.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import type { EvaluatorSpec, Pathway } from '../schema.js';

const US: CountryCode = countryCode('US');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-26');

const USC_1151 = 'https://www.law.cornell.edu/uscode/text/8/1151';
const USC_1152 = 'https://www.law.cornell.edu/uscode/text/8/1152';
const USC_1182 = 'https://www.law.cornell.edu/uscode/text/8/1182';
const USC_1186A = 'https://www.law.cornell.edu/uscode/text/8/1186a';
const USC_1201 = 'https://www.law.cornell.edu/uscode/text/8/1201';
const USC_1255 = 'https://www.law.cornell.edu/uscode/text/8/1255';
const USC_1423 = 'https://www.law.cornell.edu/uscode/text/8/1423';
const USC_1427 = 'https://www.law.cornell.edu/uscode/text/8/1427';
const USC_1429 = 'https://www.law.cornell.edu/uscode/text/8/1429';
const USC_1430 = 'https://www.law.cornell.edu/uscode/text/8/1430';
const USC_1445 = 'https://www.law.cornell.edu/uscode/text/8/1445';
const CFR_212_7 = 'https://www.law.cornell.edu/cfr/text/8/212.7';
const CFR_316_5 = 'https://www.law.cornell.edu/cfr/text/8/316.5';
const CFR_316_10 = 'https://www.law.cornell.edu/cfr/text/8/316.10';
const CFR_319_1 = 'https://www.law.cornell.edu/cfr/text/8/319.1';

// The `instrument` strings below are written out in full on every citation
// rather than hoisted into a constant. `scripts/check-pathway-citations.mjs`
// parses this file as text without a TypeScript loader and reads `instrument`
// only as a string literal; an identifier there resolves to nothing and the
// guard reports the citation as naming no instrument at all. Repetition is the
// price of the check running on plain `node` with no install.

/**
 * The evaluator for a requirement this repository cannot test.
 *
 * `applicantId` is the only always-present field, so this spec always resolves
 * `true` — and that is safe precisely because it is only ever used on a
 * criterion carrying `requiresHumanReview: true`. `evaluateCriterion` returns
 * `requires_human_review` for such a criterion *before* it looks at the
 * evaluator's value, so the criterion can never render as "met". What the spec
 * does is keep the audit trace honest: it records that no applicant fact was
 * consulted, rather than pointing at a proxy path and implying one was.
 *
 * A criterion using this must always carry a `humanReviewReason` naming the
 * fact that is missing. That is what the reviewer is being handed.
 */
const NOT_MODELLED: EvaluatorSpec = { op: 'is_present', path: 'applicantId' };

/**
 * The signals in `ApplicantFacts` that bear on whether unlawful presence may
 * have accrued.
 *
 * None of them measures it. `currentStatus === 'irregular'` records that
 * somebody said they are present without authorisation; `priorOverstays` is a
 * count, not a period. § 1182(a)(9)(B) turns on a *day count* against 180 days
 * and one year, beginning the day after the authorised period of stay ended,
 * and this repository holds neither the I-94 admit-until date nor the periods.
 * So this spec is a screen for "the question is live", never an answer to it,
 * and every criterion that uses it escalates.
 */
const UNLAWFUL_PRESENCE_SIGNALS: EvaluatorSpec = {
  op: 'any_of',
  of: [
    { op: 'equals', path: 'currentStatus', value: 'irregular' },
    { op: 'gte', path: 'travelHistory.priorOverstays', value: 1 },
  ],
};

/**
 * The complement: the applicant has positively recorded that there are none.
 *
 * `equals ... 0` is a recorded zero, not an absent field — the distinction the
 * three-valued evaluator exists for. An applicant who has recorded nothing
 * yields `unknown` here and the criterion holds the verdict at indeterminate
 * instead of clearing them.
 */
const NO_RECORDED_UNLAWFUL_PRESENCE_SIGNALS: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'equals', path: 'travelHistory.priorOverstays', value: 0 },
    { op: 'equals', path: 'travelHistory.priorRemovals', value: 0 },
    { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
  ],
};

/** A recorded removal. Reaches § 1182(a)(9)(A) and the second limb of (a)(9)(C)(i). */
const HAS_PRIOR_REMOVAL: EvaluatorSpec = { op: 'gte', path: 'travelHistory.priorRemovals', value: 1 };

/** No removal on record — again a positive zero, not an absence. */
const NO_PRIOR_REMOVAL: EvaluatorSpec = { op: 'equals', path: 'travelHistory.priorRemovals', value: 0 };

// ---------------------------------------------------------------------------
// Citations
// ---------------------------------------------------------------------------
//
// Practitioners cite the INA section, the Code cites the U.S.C. section, and
// the two numbers differ — INA § 245 is 8 U.S.C. § 1255, INA § 212 is § 1182,
// INA § 316 is § 1427. The regulations and the Foreign Affairs Manual both use
// the INA numbering, so a reader arriving from either direction needs both.
// Every `provision` below therefore carries the U.S.C. cite with the INA cite
// in parentheses.

const ina245a = {
  id: 'us-sb-ina-245-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1255(a) (INA 245(a))',
  url: USC_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Adjustment of status. Four gates hide in one sentence: the applicant must have been inspected and admitted ' +
    'or paroled into the United States; must make an application; must be eligible to receive an immigrant visa ' +
    'and admissible for permanent residence; and an immigrant visa must be immediately available at the time the ' +
    'application is filed. Entry without inspection defeats the first gate outright.',
};

const ina245aDiscretion = {
  id: 'us-sb-ina-245-a-discretion',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1255(a) (INA 245(a)) — the words "in his discretion"',
  url: USC_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The statute says status "may be adjusted by the Attorney General, in his discretion". Meeting every listed ' +
    'condition does not entitle anyone to the grant, and no engine can measure the discretion.',
};

const ina245c = {
  id: 'us-sb-ina-245-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1255(c) (INA 245(c))',
  url: USC_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Bars to adjustment. Paragraph (c)(2) removes subsection (a) from an applicant who accepts unauthorised ' +
    'employment before filing, who is in unlawful immigration status on the filing date, or who has failed to ' +
    'maintain lawful status continuously since entry — expressly excepting an immediate relative as defined in ' +
    '8 U.S.C. 1151(b) and certain special immigrants. Other paragraphs reach crewmen, transit-without-visa ' +
    'entrants, visa-waiver entrants, S nonimmigrants and employment-based applicants not in lawful status.',
};

const ina245k = {
  id: 'us-sb-ina-245-k',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1255(k) (INA 245(k))',
  url: USC_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An applicant eligible under 8 U.S.C. 1153(b)(1), (2), (3) or (5) may adjust notwithstanding (c)(2), (c)(7) ' +
    'and (c)(8) where, on the filing date, they are present pursuant to a lawful admission and have not, since ' +
    'that admission, for an aggregate period exceeding 180 days failed to maintain lawful status, worked without ' +
    'authorisation, or otherwise violated the terms of admission. It is an aggregate day count against a fixed ' +
    'threshold, and this repository holds no periods to count.',
};

const ina245i = {
  id: 'us-sb-ina-245-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1255(i) (INA 245(i))',
  url: USC_1255,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Grandfathering. An applicant otherwise within subsection (c), including one who entered without inspection, ' +
    'may still apply where they are the beneficiary of a petition or labor certification application filed on or ' +
    'before 30 April 2001 (with a physical-presence condition on 21 December 2000 for petitions filed after ' +
    '14 January 1998), on payment of a sum of 1,000 dollars. These dates are fixed in the statute and do not ' +
    'move. The population is small and ageing, and for a person inside it this is a route that is otherwise shut.',
};

const ina201b = {
  id: 'us-sb-ina-201-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1151(b)(2)(A)(i) (INA 201(b)(2)(A)(i))',
  url: USC_1151,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Immediate relatives are "the children, spouses, and parents of a citizen of the United States, except that, ' +
    'in the case of parents, such citizens shall be at least 21 years of age". Subsection (b) is headed "Aliens ' +
    'not subject to direct numerical limitations", so an immediate relative faces no queue: a visa is available ' +
    'on filing. A sibling of a citizen is in a numerically limited preference category and is not an immediate ' +
    'relative. Same family, same statute, completely different route.',
};

const ina202a2 = {
  id: 'us-sb-ina-202-a-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1152(a)(2) (INA 202(a)(2))',
  url: USC_1152,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Immigrant visas made available to natives of any single foreign state under the family-sponsored and ' +
    'employment-based preferences may not exceed 7 percent of the total in a fiscal year, and 2 percent for a ' +
    'dependent area. Subsection (a)(1)(A) forbids nationality discrimination in issuance "except as specifically ' +
    'provided in paragraph (2)", so the per-country cap is an express carve-out rather than a contradiction. ' +
    'Whether a given category is currently oversubscribed, and by how much, is a fact of the Department of ' +
    'State Visa Bulletin for the month in question and is deliberately not encoded anywhere in this catalog.',
};

const ina216 = {
  id: 'us-sb-ina-216',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1186a (INA 216)',
  url: USC_1186A,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Where residence is obtained through a marriage less than two years old at the time of the grant, the status ' +
    'is conditional for two years. A joint petition with a personal interview is required, filed during the ' +
    '90-day period before the second anniversary of obtaining the status; subsection (c)(4) provides waivers of ' +
    'the joint requirement for extreme hardship, for a good-faith marriage since terminated without the ' +
    'applicant at fault, and where the applicant was battered or subjected to extreme cruelty.',
};

const ina221g = {
  id: 'us-sb-ina-221-g',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1201(g) (INA 221(g))',
  url: USC_1201,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A consular officer must refuse a visa where it appears from the application or the papers submitted that ' +
    'the applicant is ineligible, or where the officer knows or has reason to believe they are ineligible. The ' +
    'refusal is made abroad and there is in substance no appeal from it.',
};

const ina221h = {
  id: 'us-sb-ina-221-h',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1201(h) (INA 221(h))',
  url: USC_1201,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Nothing in the chapter entitles the holder of a visa to be admitted if, on arrival at a port of entry, they ' +
    'are found inadmissible. A visa is permission to travel and to ask; admission is a separate decision taken ' +
    'by a different officer at a different moment.',
};

const ina212a9a = {
  id: 'us-sb-ina-212-a-9-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(9)(A) (INA 212(a)(9)(A))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Inadmissibility following a removal, for periods that depend on how and when the removal happened, with ' +
    'clause (iii) allowing the Secretary to consent in advance to a fresh application for admission. This is a ' +
    'separate ground from the unlawful-presence bars in (a)(9)(B) and (a)(9)(C) and can apply alongside them.',
};

const ina212a9bi = {
  id: 'us-sb-ina-212-a-9-b-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(9)(B)(i) (INA 212(a)(9)(B)(i))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Subclause (I): unlawfully present for more than 180 days but less than one year, who voluntarily departed ' +
    'before the commencement of proceedings and again seeks admission within three years. Subclause (II): ' +
    'unlawfully present for one year or more and again seeks admission within ten years of departure or removal. ' +
    'The opening words exclude an alien lawfully admitted for permanent residence. Note that the extra condition ' +
    'in (I) — departure before proceedings commenced — has no counterpart in (II).',
};

const ina212a9bii = {
  id: 'us-sb-ina-212-a-9-b-ii',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(9)(B)(ii) (INA 212(a)(9)(B)(ii))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien is unlawfully present if present after the expiration of the period of stay authorized, or present ' +
    'without being admitted or paroled. The trigger is the end of the authorised period of stay recorded on ' +
    'admission — not the expiry date printed on the visa, which governs travel only.',
};

const ina212a9biii = {
  id: 'us-sb-ina-212-a-9-b-iii',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(9)(B)(iii) (INA 212(a)(9)(B)(iii))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Exceptions to the unlawful-presence count. Clause (I): no period during which the alien is under 18 years ' +
    'of age is taken into account. The remaining exceptions cover a pending bona fide asylum application, family ' +
    'unity beneficiaries, battered women and children, and victims of a severe form of trafficking. Those four ' +
    'sit in territory this catalog deliberately does not cover; their existence is named so that an omission is ' +
    'not read as an absence of law, and whether any of them applies is a question for a licensed representative.',
};

const ina212a9bv = {
  id: 'us-sb-ina-212-a-9-b-v',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(9)(B)(v) (INA 212(a)(9)(B)(v))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The waiver of the three- and ten-year bars. Two distinct relationship tests, and neither of them is a ' +
    'child: the APPLICANT must be the spouse, son or daughter of a United States citizen or lawful permanent ' +
    'resident, and the extreme hardship must be to a citizen or lawfully resident SPOUSE OR PARENT of the ' +
    'applicant. A United States citizen child does not create a qualifying relative for this waiver. The ' +
    'Attorney General has "sole discretion" and the statute states that no court has jurisdiction to review the ' +
    'decision.',
};

const ina212a9c = {
  id: 'us-sb-ina-212-a-9-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(9)(C) (INA 212(a)(9)(C))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The permanent bar. An alien unlawfully present for an aggregate period of more than one year, or who has ' +
    'been ordered removed, and who then enters or attempts to reenter without being admitted, is inadmissible. ' +
    'Three differences from (a)(9)(B) decide cases: (C) AGGREGATES across the whole history where (B) does not ' +
    'aggregate across trips; the trigger is the unlawful re-entry rather than the departure; and clause (ii) ' +
    'offers relief only to someone seeking admission more than ten years after their last departure, with the ' +
    'consent of the Secretary. The only statutory waiver, at clause (iii), is for VAWA self-petitioners.',
};

const ina212a6ai = {
  id: 'us-sb-ina-212-a-6-a-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1182(a)(6)(A)(i) (INA 212(a)(6)(A)(i))',
  url: USC_1182,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien present without admission or parole is inadmissible. The same fact that grounds this ground of ' +
    'inadmissibility also defeats adjustment under 8 U.S.C. 1255(a), which is why manner of entry decides ' +
    'whether a case can be completed inside the country at all.',
};

const ina316a = {
  id: 'us-sb-ina-316-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1427(a) (INA 316(a))',
  url: USC_1427,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Naturalisation by residence, general rule. Immediately preceding the filing date the applicant must have ' +
    'resided continuously, after being lawfully admitted for permanent residence, for at least five years; ' +
    'during those five years must have been physically present for periods totalling at least half of that ' +
    'time; and must have resided at least three months in the State or Service district in which the ' +
    'application is filed. Paragraph (2) requires continuous residence from the date of the application up to ' +
    'admission to citizenship. Paragraph (3) requires good moral character, attachment to the principles of the ' +
    'Constitution and being well disposed to the good order and happiness of the United States during all of ' +
    'those periods.',
};

const ina316b = {
  id: 'us-sb-ina-316-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1427(b) (INA 316(b))',
  url: USC_1427,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Absence of more than six months but less than one year during the period for which continuous residence is ' +
    'required breaks the continuity unless the applicant establishes that they did not in fact abandon their ' +
    'residence. Absence for a continuous period of one year or more breaks it outright.',
};

const ina316e = {
  id: 'us-sb-ina-316-e',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1427(d)-(e) (INA 316(d)-(e))',
  url: USC_1427,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'No finding that the applicant is not deportable is conclusive evidence of good moral character, and in ' +
    'determining character the decision-maker is not limited to the statutory period but may take into account ' +
    'conduct and acts at any time before it. A clean record inside the window is therefore evidence, not a ' +
    'guarantee.',
};

const ina319a = {
  id: 'us-sb-ina-319-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1430(a) (INA 319(a))',
  url: USC_1430,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Naturalisation for the spouse of a United States citizen: three years of continuous residence after lawful ' +
    'admission for permanent residence, during all of which the spouse has been a citizen; living in marital ' +
    'union with that citizen spouse for the three years immediately preceding the application; physical presence ' +
    'for periods totalling at least half of that time; three months in the State or Service district; and the ' +
    'same character and attachment requirements as the general rule.',
};

const ina312 = {
  id: 'us-sb-ina-312',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1423 (INA 312)',
  url: USC_1423,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Subsection (a) requires an ability to read, write and speak words in ordinary usage in English, and a ' +
    'knowledge and understanding of the fundamentals of the history and of the principles and form of government ' +
    'of the United States. Subsection (b) exempts anyone unable to comply because of a physical or developmental ' +
    'disability or mental impairment; exempts from the English requirement only a person over fifty with at ' +
    'least twenty years of residence since lawful admission for permanent residence, or over fifty-five with at ' +
    'least fifteen; and directs that special consideration be given on the history and government requirement to ' +
    'a person over sixty-five with at least twenty years of such residence.',
};

const ina318 = {
  id: 'us-sb-ina-318',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1429 (INA 318)',
  url: USC_1429,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'No person may be naturalised unless lawfully admitted to the United States for permanent residence, and the ' +
    'burden is on the applicant to show they entered lawfully and the time, place and manner of entry. No person ' +
    'may be naturalised against whom a final finding of deportability is outstanding, and no application may be ' +
    'considered while a removal proceeding is pending against the applicant.',
};

const ina334b = {
  id: 'us-sb-ina-334-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. 1445(b) (INA 334(b))',
  url: USC_1445,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'No person may file a valid application for naturalisation unless they have attained the age of eighteen ' +
    'years, and the application must contain an averment of lawful admission for permanent residence.',
};

const cfr212_7e = {
  id: 'us-sb-cfr-8-212-7-e',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 212.7(e)',
  url: CFR_212_7,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The provisional unlawful presence waiver. Conditions include being physically present in the United States ' +
    'at filing and appearing for biometrics, being at least 17 years of age, being the beneficiary of an ' +
    'approved immigrant visa petition or a diversity selection with a case pending at the Department of State ' +
    'for which the processing fee has been paid, intending to depart to obtain the immigrant visa, and being ' +
    'inadmissible only under 8 U.S.C. 1182(a)(9)(B)(i). Ineligible where the applicant is in removal ' +
    'proceedings that are not administratively closed, is subject to a final or reinstated removal order, or ' +
    'has an application for lawful permanent resident status pending with USCIS. Paragraph (e)(12) provides ' +
    'that an approved waiver does not take effect unless and until the applicant departs, appears at the ' +
    'immigrant visa interview and is found otherwise eligible, and that it is automatically revoked in defined ' +
    'circumstances including a re-entry without inspection after filing.',
};

const cfr316_5 = {
  id: 'us-sb-cfr-8-316-5',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 316.5',
  url: CFR_316_5,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Residence for naturalisation is the applicant domicile or principal actual dwelling place, without regard ' +
    'to intent. Paragraph (c)(1)(i): an absence of six months or more but less than one year disrupts the ' +
    'continuity unless the applicant rebuts it, with documentary evidence such as continued employment in the ' +
    'United States, immediate family remaining there, retained access to a home, and no employment abroad. ' +
    'Paragraph (c)(1)(ii): an absence of one year or more disrupts continuity, and absent an approved Form ' +
    'N-470 the applicant may reapply four years and one day after returning where five years of residence are ' +
    'required, or two years and one day where three years are required.',
};

const cfr316_10 = {
  id: 'us-sb-cfr-8-316-10',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 316.10',
  url: CFR_316_10,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Good moral character. The applicant bears the burden of demonstrating it for the statutory period, the ' +
    'determination is made case by case against the standards of the average citizen in the community, and the ' +
    'agency may look at conduct before the period. Paragraph (b) sets out unconditional bars, including murder ' +
    'and aggravated felony convictions and, within the period, crimes involving moral turpitude, controlled ' +
    'substance offences, false testimony and others. Paragraph (b)(3) makes further findings adverse unless the ' +
    'applicant establishes extenuating circumstances. This is not a bright line and a clear police certificate ' +
    'does not settle it.',
};

const cfr319_1 = {
  id: 'us-sb-cfr-8-319-1',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 319.1',
  url: CFR_319_1,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The regulation implementing the three-year spousal rule, including 18 months of physical presence. ' +
    'Paragraph (b)(1) treats living in marital union as actually residing with the current spouse, with the ' +
    'burden on the applicant. Paragraph (b)(2): the union ends on death, divorce or the citizen spouse ceasing ' +
    'to be a citizen, and remarriage to another citizen does not restore eligibility; a legal separation breaks ' +
    'it; an informal separation is assessed case by case; and an involuntary separation caused by circumstances ' +
    'beyond the couple control, such as service obligations or occupational demands, does not break it.',
};

const fr91_44976 = {
  id: 'us-sb-fr-91-44976',
  kind: 'regulation' as const,
  instrument: 'Federal Register',
  provision: '91 FR 44976 (17 July 2026)',
  url: 'https://www.govinfo.gov/content/pkg/FR-2026-07-17/html/2026-14439.htm',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Establishing a Fixed Time Period of Admission and an Extension of Stay Procedure for Nonimmigrant Academic ' +
    'Students, Exchange Visitors, and Representatives of Foreign Information Media; Final Rule. Published ' +
    '17 July 2026 at pages 44976 to 45131, effective 15 September 2026, replacing duration-of-status admission ' +
    'for F, J and I nonimmigrants with a fixed period, capped for F at the length of the programme and not to ' +
    'exceed four years. The rule states that it is classified as a major rule subject to congressional review ' +
    'and that DHS will publish a document to establish the actual effective date or terminate the rule if the ' +
    'effective date changes. NOT YET INCORPORATED into the codified text of 8 CFR 214.1 and 214.2. Its ' +
    'litigation status was not established and must be checked before anything relies on it.',
};

const fam302_11_3 = {
  id: 'us-sb-fam-302-11-3',
  kind: 'official_guidance' as const,
  instrument: 'Foreign Affairs Manual, volume 9',
  provision: '9 FAM 302.11-3',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Department of State guidance on the unlawful presence bars. Four points matter here. The ground reaches ' +
    'presence since 1 April 1997 only. Both bars are triggered by departure and run from the date of departure. ' +
    'The periods are not cumulative across trips, though separate periods within the same overall stay are added ' +
    'together. And the count excludes both the date the Form I-94 expires and the date of departure, which is ' +
    'two exclusive endpoints in a repository whose DateRange is closed at both ends. Which periods count as ' +
    'authorised stay rests partly on DHS policy rather than statute, which is why this citation is marked ' +
    'discretionary. NO URL: fam.state.gov could not be fetched from the environment this record was written in, ' +
    'so the page and its CT:VISA revision stamp must be opened and confirmed by hand before anyone relies on it.',
};

const fam302_11_4 = {
  id: 'us-sb-fam-302-11-4',
  kind: 'official_guidance' as const,
  instrument: 'Foreign Affairs Manual, volume 9',
  provision: '9 FAM 302.11-4',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Department of State guidance on the permanent bar. The exceptions that reduce the unlawful presence count ' +
    'for 8 U.S.C. 1182(a)(9)(B) do not apply to 8 U.S.C. 1182(a)(9)(C); a false claim to United States ' +
    'citizenship at a port of entry can itself be the attempted entry without admission that triggers it, ' +
    'because citizens are not subject to inspection; and a person within it is treated as permanently ' +
    'ineligible and may seek consent to reapply only after ten years. NO URL: fam.state.gov could not be ' +
    'fetched from the environment this record was written in, so the page and its CT:VISA revision stamp must ' +
    'be opened and confirmed by hand before anyone relies on it.',
};

const biaArrabally = {
  id: 'us-sb-bia-arrabally',
  kind: 'case_law' as const,
  instrument: 'Board of Immigration Appeals',
  provision: 'Matter of Arrabally and Yerrabelly, 25 I&N Dec. 771 (BIA 2012)',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A departure under a grant of advance parole is not a "departure" that triggers 8 U.S.C. 1182(a)(9)(B). ' +
    'Adopted in Department of State guidance at 9 FAM 302.11-3. NO URL: the decision text was not fetched from ' +
    'an official source in this environment, and the holding is stated here from the research brief rather than ' +
    'from the report itself. Confirm it against the published decision before relying on it.',
};

// ---------------------------------------------------------------------------
// Adjustment of status — 8 U.S.C. § 1255
// ---------------------------------------------------------------------------

export const usAdjustmentOfStatus: Pathway = {
  id: 'us-adjustment-of-status',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Adjustment of status to permanent residence, from inside the United States',
    es: 'Ajuste de estatus a residencia permanente, desde dentro de Estados Unidos',
  },
  summary: {
    en:
      'The route to lawful permanent residence for someone already inside the United States, without returning ' +
      'to their country of origin. It is open only to a person who was inspected and admitted or paroled; ' +
      'someone who entered without inspection fails that threshold and is left with consular processing, which ' +
      'requires departure — and departure is what triggers the unlawful presence bars. Whether this route is ' +
      'available is therefore the first question in the corridor, not a detail of procedure.',
    es:
      'La vía a la residencia permanente legal para quien ya se encuentra dentro de Estados Unidos, sin regresar ' +
      'a su país de origen. Solo está abierta a quien fue inspeccionado y admitido o recibió parole; quien entró ' +
      'sin inspección no supera ese umbral y le queda el trámite consular, que exige salir del país — y la ' +
      'salida es precisamente lo que activa las prohibiciones por presencia ilegal. Determinar si esta vía está ' +
      'disponible es, por tanto, la primera pregunta del corredor migratorio, no un detalle de procedimiento.',
  },
  citations: [
    ina245a,
    ina245aDiscretion,
    ina245c,
    ina245k,
    ina245i,
    ina201b,
    ina202a2,
    ina216,
    ina212a6ai,
    ina212a9bi,
    ina212a9c,
    ina316a,
  ],
  criteria: [
    {
      id: 'us-aos-inspected-and-admitted-or-paroled',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-245-a', 'us-sb-ina-212-a-6-a-i', 'us-sb-ina-245-i'],
      label: {
        en: 'Inspected and admitted, or paroled, into the United States',
        es: 'Inspeccionado y admitido, o con parole, en Estados Unidos',
      },
      // There is no fact for manner of entry, and no proxy for it that is not
      // actively wrong. `currentStatus === 'irregular'` describes the state a
      // person is in now, not how they got in: someone admitted on a visitor
      // visa who overstayed is irregular today and was inspected and admitted;
      // someone recorded as a worker may still have entered without inspection
      // years earlier. Pointing the evaluator at that field would produce a
      // confident answer to a question it does not ask, so the criterion is
      // escalated instead.
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian does not record how the applicant last entered the United States, and 8 U.S.C. 1255(a) is ' +
          'available only to a person who was inspected and admitted, or paroled. Entry without inspection ' +
          'defeats the section at the threshold, and the exception in 8 U.S.C. 1255(c)(2) for immediate ' +
          'relatives does not reach it, because that exception cures unlawful status rather than the manner of ' +
          'entry. Establish the manner of the last entry from the Form I-94 record or the applicant own ' +
          'evidence before anything else is assessed.',
        es:
          'Meridian no registra cómo entró por última vez la persona a Estados Unidos, y el 8 U.S.C. 1255(a) ' +
          'solo está disponible para quien fue inspeccionado y admitido, o recibió parole. La entrada sin ' +
          'inspección impide aplicar el artículo desde el umbral, y la excepción del 8 U.S.C. 1255(c)(2) para ' +
          'familiares inmediatos no la salva, porque esa excepción subsana la falta de estatus legal, no la ' +
          'forma de entrada. Determine la forma de la última entrada a partir del registro Formulario I-94 o de ' +
          'la prueba de la propia persona antes de valorar cualquier otra cosa.',
      },
      guidance: {
        en:
          'This is the single most consequential fact on the whole route. A person present without admission or ' +
          'parole is also inadmissible under 8 U.S.C. 1182(a)(6)(A)(i). One narrow route survives: 8 U.S.C. ' +
          '1255(i) grandfathers the beneficiary of a petition or labor certification application filed on or ' +
          'before 30 April 2001, on payment of a fixed sum, and that route reaches someone who entered without ' +
          'inspection. Those dates are fixed in the statute and do not move.',
        es:
          'Este es el dato más determinante de toda la vía. Quien está presente sin admisión ni parole es ' +
          'además inadmisible conforme al 8 U.S.C. 1182(a)(6)(A)(i). Sobrevive una vía estrecha: el 8 U.S.C. ' +
          '1255(i) preserva el derecho de quien sea beneficiario de una petición o de una solicitud de ' +
          'certificación laboral presentada el 30 de abril de 2001 o antes, mediante el pago de una suma fija, ' +
          'y esa vía sí alcanza a quien entró sin inspección. Esas fechas están fijadas en la ley y no se mueven.',
      },
    },
    {
      id: 'us-aos-immigrant-visa-immediately-available',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-sb-ina-245-a', 'us-sb-ina-201-b', 'us-sb-ina-202-a-2'],
      label: {
        en: 'An immigrant visa is immediately available at the time the application is filed',
        es: 'Hay una visa de inmigrante inmediatamente disponible al presentar la solicitud',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no approved petition, no immigrant category and no priority date, and it encodes no ' +
          'cut-off date. Availability under 8 U.S.C. 1255(a)(3) is read from the Department of State Visa ' +
          'Bulletin for the month of filing. An immediate relative of a United States citizen is outside the ' +
          'numerical limits and a visa is available on filing; every other category has to be checked against ' +
          'the current bulletin, and a Mexican-chargeability applicant is charged to a column of that bulletin ' +
          'that is not the worldwide one.',
        es:
          'Meridian no registra petición aprobada, ni categoría de inmigrante, ni fecha de prioridad, y no ' +
          'codifica ninguna fecha de corte. La disponibilidad conforme al 8 U.S.C. 1255(a)(3) se lee en el ' +
          'Boletín de Visas del Departamento de Estado del mes de presentación. El familiar inmediato de una ' +
          'persona ciudadana estadounidense queda fuera de los límites numéricos y dispone de visa al presentar ' +
          'la solicitud; cualquier otra categoría debe comprobarse contra el boletín vigente, y a quien se ' +
          'imputa a México se le aplica una columna de ese boletín que no es la mundial.',
      },
      guidance: {
        en:
          'Meridian deliberately encodes no priority date, no cut-off date and no waiting-time estimate. The ' +
          'bulletin is republished every month and can retrogress, so any figure written into a catalog would ' +
          'be wrong within weeks and would read to the applicant as settled. What is stable is the structure: ' +
          '8 U.S.C. 1152(a)(2) caps any single foreign state at 7 percent of the annual preference totals, and ' +
          'the Department of State publishes separate columns for the chargeability areas where demand exceeds ' +
          'that cap. Read the current bulletin; do not read a number from here.',
        es:
          'Meridian no codifica deliberadamente ninguna fecha de prioridad, fecha de corte ni estimación de ' +
          'espera. El boletín se vuelve a publicar cada mes y puede retroceder, de modo que cualquier cifra ' +
          'escrita en un catálogo sería falsa en pocas semanas y la persona la leería como derecho asentado. Lo ' +
          'estable es la estructura: el 8 U.S.C. 1152(a)(2) limita a cualquier Estado extranjero al 7 por ' +
          'ciento de los totales anuales de preferencia, y el Departamento de Estado publica columnas separadas ' +
          'para las áreas de imputación cuya demanda supera ese límite. Consulte el boletín vigente; no lea una ' +
          'cifra aquí.',
      },
    },
    {
      id: 'us-aos-not-barred-by-unlawful-status',
      kind: 'status',
      weight: 'material',
      citationIds: ['us-sb-ina-245-c', 'us-sb-ina-201-b', 'us-sb-ina-245-k'],
      label: {
        en: 'Not barred by 8 U.S.C. 1255(c) — unlawful status or unauthorised employment before filing',
        es: 'No excluido por el 8 U.S.C. 1255(c) — estatus ilegal o empleo no autorizado antes de presentar',
      },
      // A recorded `irregular` status is a positive statement that the person
      // is present without authorisation, which is what (c)(2) reaches. It is
      // `material` rather than `blocking` because the immediate-relative
      // exception and § 1255(k) can both rescue exactly this case, and neither
      // is knowable from the facts here — so this criterion may hold a verdict
      // at indeterminate but must never produce `ineligible`.
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
      humanReviewWhen: { op: 'equals', path: 'currentStatus', value: 'irregular' },
      humanReviewReason: {
        en:
          'The recorded status is irregular, so on its face 8 U.S.C. 1255(c)(2) removes this route. Two things ' +
          'can restore it and neither is on file. An immediate relative of a United States citizen — a spouse, ' +
          'an unmarried child under 21, or a parent of a citizen aged at least 21 — is expressly excepted from ' +
          '(c)(2), so an overstay after a lawful admission does not defeat their adjustment. And for the ' +
          'employment-based categories 8 U.S.C. 1255(k) forgives an aggregate of up to 180 days of status ' +
          'failure, unauthorised employment or breach of the terms of admission since the last lawful ' +
          'admission. Both need a day count and a family relationship that must be established from documents.',
        es:
          'El estatus registrado es irregular, de modo que, en principio, el 8 U.S.C. 1255(c)(2) cierra esta ' +
          'vía. Dos cosas pueden reabrirla y ninguna consta en el expediente. El familiar inmediato de una ' +
          'persona ciudadana estadounidense — cónyuge, hijo o hija soltera menor de 21 años, o progenitor de ' +
          'una persona ciudadana de al menos 21 años — está expresamente exceptuado del (c)(2), por lo que ' +
          'permanecer más allá del plazo tras una admisión legal no impide su ajuste. Y para las categorías por ' +
          'empleo, el 8 U.S.C. 1255(k) perdona hasta un agregado de 180 días de falta de estatus, empleo no ' +
          'autorizado o incumplimiento de las condiciones de admisión desde la última admisión legal. Ambas ' +
          'exigen un cómputo de días y un vínculo familiar que deben acreditarse documentalmente.',
      },
      guidance: {
        en:
          'Section 1255(c) also reaches crewmen, transit-without-visa entrants, visa-waiver entrants, and ' +
          'employment-based applicants not in a lawful nonimmigrant status. The immediate-relative exception ' +
          'cures unlawful status; it does not cure entry without inspection, which fails 8 U.S.C. 1255(a) ' +
          'itself.',
        es:
          'El 8 U.S.C. 1255(c) alcanza también a la tripulación, a quienes entraron en tránsito sin visa, a ' +
          'quienes entraron por el programa de exención de visa y a los solicitantes por empleo que no están en ' +
          'un estatus de no inmigrante legal. La excepción del familiar inmediato subsana la falta de estatus; ' +
          'no subsana la entrada sin inspección, que incumple el propio 8 U.S.C. 1255(a).',
      },
    },
    {
      id: 'us-aos-admissible-for-permanent-residence',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-sb-ina-245-a', 'us-sb-ina-212-a-9-b-i', 'us-sb-ina-212-a-9-c'],
      label: {
        en: 'Admissible to the United States for permanent residence',
        es: 'Admisible en Estados Unidos para la residencia permanente',
      },
      evaluator: {
        op: 'all_of',
        of: [{ op: 'is_true', path: 'criminalRecord.selfDeclaredClear' }, NO_PRIOR_REMOVAL],
      },
      humanReviewWhen: {
        op: 'any_of',
        of: [HAS_PRIOR_REMOVAL, { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' }],
      },
      humanReviewReason: {
        en:
          'A removal on record reaches 8 U.S.C. 1182(a)(9)(A) and may also reach the permanent bar in ' +
          '8 U.S.C. 1182(a)(9)(C) if the person later entered or tried to enter without being admitted. A ' +
          'declared criminal record has to be measured against the specific grounds in 8 U.S.C. 1182(a)(2), ' +
          'which turn on the elements of the offence rather than on its name. Neither can be settled from a ' +
          'yes-or-no field.',
        es:
          'Una expulsión registrada activa el 8 U.S.C. 1182(a)(9)(A) y puede activar además la prohibición ' +
          'permanente del 8 U.S.C. 1182(a)(9)(C) si la persona entró después, o lo intentó, sin ser admitida. ' +
          'Unos antecedentes penales declarados deben contrastarse con las causales concretas del 8 U.S.C. ' +
          '1182(a)(2), que dependen de los elementos del delito y no de su nombre. Ninguna de las dos cosas se ' +
          'resuelve con un campo de sí o no.',
      },
      guidance: {
        en:
          'Section 1255(a)(2) requires the applicant to be admissible for permanent residence, which means no ' +
          'unwaived ground in 8 U.S.C. 1182(a) applies. Meridian models only two coarse signals here — a ' +
          'self-declared criminal record and a count of prior removals — and neither is the test. Health, ' +
          'public charge, fraud or misrepresentation, false claim to United States citizenship, and the ' +
          'unlawful presence bars are all separate grounds and are not evaluated by this criterion.',
        es:
          'El 8 U.S.C. 1255(a)(2) exige que la persona sea admisible para la residencia permanente, es decir, ' +
          'que no le aplique ninguna causal no dispensada del 8 U.S.C. 1182(a). Meridian solo modela aquí dos ' +
          'señales gruesas — antecedentes penales autodeclarados y un recuento de expulsiones previas — y ' +
          'ninguna es la prueba. La salud, la carga pública, el fraude o la falsedad, la falsa declaración de ' +
          'ciudadanía estadounidense y las prohibiciones por presencia ilegal son causales distintas y este ' +
          'criterio no las valora.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['us-sb-ina-245-a-discretion', 'us-sb-ina-216', 'us-sb-ina-316-a'],
    note: {
      en:
        'Satisfying every condition does not produce a grant: 8 U.S.C. 1255(a) says status "may be adjusted by ' +
        'the Attorney General, in his discretion". Where residence comes through a marriage less than two years ' +
        'old at the time of the grant, it is conditional for two years under 8 U.S.C. 1186a and a joint ' +
        'petition must be filed in the 90 days before the second anniversary — being granted residence is not ' +
        'the end of the matter. Time as a permanent resident is what starts the naturalisation clock in ' +
        '8 U.S.C. 1427(a).',
      es:
        'Cumplir todos los requisitos no produce la concesión: el 8 U.S.C. 1255(a) dispone que el estatus ' +
        '«podrá ser ajustado por el Fiscal General, a su discreción». Cuando la residencia proviene de un ' +
        'matrimonio de menos de dos años en el momento de la concesión, es condicional durante dos años ' +
        'conforme al 8 U.S.C. 1186a y debe presentarse una petición conjunta en los 90 días anteriores al ' +
        'segundo aniversario — obtener la residencia no cierra el expediente. El tiempo como residente ' +
        'permanente es lo que pone en marcha el reloj de la naturalización del 8 U.S.C. 1427(a).',
    },
  },
  leadsTo: ['us-naturalization-five-year', 'us-naturalization-spouse-three-year'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Consular processing
// ---------------------------------------------------------------------------

export const usConsularProcessingImmigrantVisa: Pathway = {
  id: 'us-consular-processing-immigrant-visa',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Consular processing of an immigrant visa, from outside the United States',
    es: 'Trámite consular de una visa de inmigrante, desde fuera de Estados Unidos',
  },
  summary: {
    en:
      'The other route to the same outcome: an approved petition goes to the National Visa Center, fees and ' +
      'documents are lodged, the applicant is interviewed at a consulate abroad, and the visa is used to be ' +
      'admitted as a permanent resident at a port of entry. It is not simply the alternative to adjustment. It ' +
      'requires departure from the United States, and for a person who has accrued unlawful presence the ' +
      'departure itself can trigger a three- or ten-year bar under 8 U.S.C. 1182(a)(9)(B) — so attending the ' +
      'interview is the act that closes the door.',
    es:
      'La otra vía al mismo resultado: una petición aprobada pasa al Centro Nacional de Visas, se pagan tasas y ' +
      'se presentan documentos, se entrevista a la persona en un consulado en el extranjero y la visa se usa ' +
      'para ser admitida como residente permanente en un puerto de entrada. No es sin más la alternativa al ' +
      'ajuste. Exige salir de Estados Unidos, y para quien ha acumulado presencia ilegal la propia salida puede ' +
      'activar una prohibición de tres o diez años conforme al 8 U.S.C. 1182(a)(9)(B) — de modo que acudir a la ' +
      'entrevista es el acto que cierra la puerta.',
  },
  citations: [
    ina221g,
    ina221h,
    ina201b,
    ina202a2,
    ina212a9bi,
    ina212a9bii,
    ina212a9a,
    ina216,
    ina316a,
    fam302_11_3,
    biaArrabally,
  ],
  criteria: [
    {
      id: 'us-cp-approved-petition-and-visa-available',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-sb-ina-201-b', 'us-sb-ina-202-a-2'],
      label: {
        en: 'An approved immigrant petition, and a visa number available in the applicable category',
        es: 'Petición de inmigrante aprobada y número de visa disponible en la categoría aplicable',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no approved petition, no immigrant category, no priority date and no National Visa ' +
          'Center case, and it encodes no cut-off date from the Visa Bulletin. An immediate relative of a ' +
          'United States citizen is outside the numerical limits; every other category depends on a priority ' +
          'date measured against the bulletin for the month in question, and for a Mexican-chargeability ' +
          'applicant that is not the worldwide column.',
        es:
          'Meridian no registra petición aprobada, ni categoría de inmigrante, ni fecha de prioridad, ni ' +
          'expediente en el Centro Nacional de Visas, y no codifica ninguna fecha de corte del Boletín de ' +
          'Visas. El familiar inmediato de una persona ciudadana estadounidense queda fuera de los límites ' +
          'numéricos; cualquier otra categoría depende de una fecha de prioridad contrastada con el boletín del ' +
          'mes correspondiente, y para quien se imputa a México esa no es la columna mundial.',
      },
      guidance: {
        en:
          'No priority date, cut-off date or waiting-time estimate is encoded anywhere in this catalog, and ' +
          'none should be inferred from it. What is stable is the structure of the limit: 8 U.S.C. 1152(a)(2) ' +
          'caps any single foreign state at 7 percent of the annual preference totals, and the Department of ' +
          'State lists the oversubscribed chargeability areas in separate columns of its monthly bulletin.',
        es:
          'En este catálogo no se codifica ninguna fecha de prioridad, fecha de corte ni estimación de espera, ' +
          'y no debe deducirse ninguna de él. Lo estable es la estructura del límite: el 8 U.S.C. 1152(a)(2) ' +
          'limita a cualquier Estado extranjero al 7 por ciento de los totales anuales de preferencia, y el ' +
          'Departamento de Estado enumera en columnas separadas de su boletín mensual las áreas de imputación ' +
          'sobresuscritas.',
      },
    },
    {
      id: 'us-cp-departure-does-not-trigger-an-unlawful-presence-bar',
      kind: 'status',
      weight: 'material',
      citationIds: [
        'us-sb-ina-212-a-9-b-i',
        'us-sb-ina-212-a-9-b-ii',
        'us-sb-fam-302-11-3',
        'us-sb-bia-arrabally',
      ],
      label: {
        en: 'Leaving for the interview does not appear to trigger a three-year or ten-year bar',
        es: 'Salir para la entrevista no parece activar una prohibición de tres o diez años',
      },
      // "Met" here means only that the applicant has positively recorded no
      // overstay, no removal and a status that is not irregular. Anything else,
      // including silence, escalates: on this criterion an unrecorded fact is
      // not a clean one, because the cost of being wrong is a decade.
      evaluator: NO_RECORDED_UNLAWFUL_PRESENCE_SIGNALS,
      humanReviewWhen: {
        op: 'any_of',
        of: [
          UNLAWFUL_PRESENCE_SIGNALS,
          HAS_PRIOR_REMOVAL,
          { op: 'not', of: { op: 'is_present', path: 'currentStatus' } },
          { op: 'not', of: { op: 'is_present', path: 'travelHistory.priorOverstays' } },
        ],
      },
      humanReviewReason: {
        en:
          'Either a signal of unlawful presence is on record, or the facts needed to rule one out are not. ' +
          'Neither bar operates while the person stays inside the United States: both are triggered by ' +
          'departure and run from the date of departure, which means that in this posture the interview is the ' +
          'triggering act. The count runs against 180 days and one year, begins the day after the authorised ' +
          'period of stay ended, excludes both the day the Form I-94 expired and the day of departure, and is ' +
          'not cumulative across separate trips. Meridian holds neither the admit-until date nor the periods, ' +
          'so nobody should depart on the strength of this record. Have the count done from the Form I-94 ' +
          'history by a licensed attorney or a representative accredited by the Department of Justice, and ' +
          'settle whether a provisional waiver should be obtained first.',
        es:
          'O bien consta alguna señal de presencia ilegal, o bien faltan los datos necesarios para descartarla. ' +
          'Ninguna de las dos prohibiciones opera mientras la persona permanece dentro de Estados Unidos: ambas ' +
          'se activan con la salida y corren desde la fecha de salida, de modo que en esta situación la ' +
          'entrevista es el acto que las desencadena. El cómputo se mide contra 180 días y un año, comienza el ' +
          'día siguiente al fin del periodo de estancia autorizado, excluye tanto el día de vencimiento del ' +
          'Formulario I-94 como el día de la salida, y no es acumulativo entre viajes distintos. Meridian no ' +
          'dispone ni de la fecha de admisión hasta ni de los periodos, así que nadie debe salir del país ' +
          'apoyándose en este registro. Encargue el cómputo a partir del historial del Formulario I-94 a una ' +
          'persona abogada colegiada o a un representante acreditado por el Departamento de Justicia, y ' +
          'resuelva antes si conviene obtener una dispensa provisional.',
      },
      guidance: {
        en:
          'Three refinements decide real cases. The three-year bar in subclause (I) applies only where the ' +
          'departure was voluntary and before proceedings commenced; the ten-year bar in subclause (II) carries ' +
          'no such condition. A departure made under a grant of advance parole is not a departure for this ' +
          'purpose. And no period while the applicant was under 18 counts toward either threshold.',
        es:
          'Tres matices deciden casos reales. La prohibición de tres años del inciso (I) solo se aplica cuando ' +
          'la salida fue voluntaria y anterior al inicio del procedimiento; la de diez años del inciso (II) no ' +
          'lleva esa condición. Una salida amparada por un advance parole no es una salida a estos efectos. Y ' +
          'ningún periodo transcurrido siendo menor de 18 años se computa para ninguno de los dos umbrales.',
      },
    },
    {
      id: 'us-cp-no-prior-removal-order',
      kind: 'status',
      weight: 'material',
      citationIds: ['us-sb-ina-212-a-9-a'],
      label: {
        en: 'No prior removal order on record',
        es: 'Sin orden de expulsión previa en el expediente',
      },
      evaluator: NO_PRIOR_REMOVAL,
      humanReviewWhen: HAS_PRIOR_REMOVAL,
      humanReviewReason: {
        en:
          'A removal on record engages 8 U.S.C. 1182(a)(9)(A), whose period depends on how and when the ' +
          'removal happened and on whether it was the first. Consent to reapply for admission can be sought in ' +
          'advance under clause (iii). Meridian records only a count, with no dates and no characterisation of ' +
          'the removal, and neither the applicable period nor its start can be derived from a count.',
        es:
          'Una expulsión registrada activa el 8 U.S.C. 1182(a)(9)(A), cuyo plazo depende de cómo y cuándo se ' +
          'produjo la expulsión y de si fue la primera. El consentimiento para volver a solicitar la admisión ' +
          'puede pedirse por anticipado conforme al inciso (iii). Meridian solo registra un recuento, sin ' +
          'fechas ni calificación de la expulsión, y de un recuento no cabe deducir ni el plazo aplicable ni su ' +
          'inicio.',
      },
    },
    {
      id: 'us-cp-consular-admissibility-screen',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-sb-ina-221-g'],
      label: {
        en: 'Nothing on record that a consular officer would treat as a reason to believe the applicant is ineligible',
        es: 'Nada en el expediente que un funcionario consular tomaría como motivo para creer que la persona es inelegible',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
          { op: 'equals', path: 'travelHistory.priorRefusals', value: 0 },
        ],
      },
      humanReviewWhen: {
        op: 'any_of',
        of: [
          { op: 'gte', path: 'travelHistory.priorRefusals', value: 1 },
          { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
        ],
      },
      humanReviewReason: {
        en:
          'A prior visa refusal or a declared criminal record is exactly the material a consular officer weighs ' +
          'under 8 U.S.C. 1201(g), which requires refusal where the officer knows or has reason to believe the ' +
          'applicant is ineligible. The refusal is made abroad and there is in substance no appeal, so the ' +
          'record must be reviewed before the applicant is in a country they cannot leave.',
        es:
          'Una denegación de visa anterior o unos antecedentes penales declarados son precisamente el material ' +
          'que valora un funcionario consular conforme al 8 U.S.C. 1201(g), que obliga a denegar cuando el ' +
          'funcionario sabe o tiene motivos para creer que la persona es inelegible. La denegación se dicta en ' +
          'el extranjero y en la práctica no cabe recurso, por lo que el expediente debe revisarse antes de que ' +
          'la persona esté en un país del que no pueda salir.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['us-sb-ina-221-h', 'us-sb-ina-216', 'us-sb-ina-316-a'],
    note: {
      en:
        'An immigrant visa is permission to travel and to ask for admission, not permission to enter: 8 U.S.C. ' +
        '1201(h) provides that nothing entitles the holder of a visa to be admitted if they are found ' +
        'inadmissible on arrival. Residence obtained through a marriage under two years old is conditional for ' +
        'two years under 8 U.S.C. 1186a. Time as a permanent resident is what starts the naturalisation clock ' +
        'in 8 U.S.C. 1427(a).',
      es:
        'Una visa de inmigrante es permiso para viajar y para solicitar la admisión, no permiso para entrar: el ' +
        '8 U.S.C. 1201(h) dispone que nada faculta a quien tiene una visa a ser admitido si a su llegada se le ' +
        'encuentra inadmisible. La residencia obtenida por un matrimonio de menos de dos años es condicional ' +
        'durante dos años conforme al 8 U.S.C. 1186a. El tiempo como residente permanente es lo que pone en ' +
        'marcha el reloj de la naturalización del 8 U.S.C. 1427(a).',
    },
  },
  leadsTo: ['us-naturalization-five-year', 'us-naturalization-spouse-three-year'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Naturalisation by residence — the general five-year rule
// ---------------------------------------------------------------------------
//
// Two arithmetic notes that apply to both naturalisation records.
//
// PHYSICAL PRESENCE. The statute requires presence "for periods totaling at
// least half of that time", and the length of "that time" is not constant: a
// five-year window is 1,826 days, or 1,827 when two 29 Februaries fall inside
// it. Half of 1,826 is 913, and half of 1,827 rounds up to 914 because days are
// whole — so the largest total absence that still satisfies the paragraph is
// 913 days in both cases, and that is the figure tested. Three years is 1,095
// or 1,096 days, giving 547 and 548; the stricter 547 is tested.
// `derived.absenceDaysTotal` counts *every* recorded absence, including any
// that fell outside the qualifying period, so both tests are conservative: they
// can report a person short who is not, and they carry `material` weight for
// that reason, which means they can hold a verdict at indeterminate but can
// never produce `ineligible`.
//
// SIX MONTHS. Section 1427(b) speaks in months, not days. 180 days is used here
// as the escalation trigger for the rebuttable presumption; six calendar months
// is 181, 182 or 184 days depending on where in the year it falls, so an
// absence near the line escalates slightly early. Escalating early on this is
// the safe direction, and the guidance says so.

export const usNaturalizationFiveYear: Pathway = {
  id: 'us-naturalization-five-year',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'United States naturalisation by residence — the general five-year rule',
    es: 'Naturalización estadounidense por residencia — regla general de cinco años',
  },
  summary: {
    en:
      'The default route to United States citizenship: five years of continuous residence as a lawful ' +
      'permanent resident immediately before filing, physical presence for at least half of that time, three ' +
      'months in the State or USCIS district where the application is filed, good moral character, and the ' +
      'English and civics requirements.',
    es:
      'La vía ordinaria a la ciudadanía estadounidense: cinco años de residencia continua como residente ' +
      'permanente legal inmediatamente anteriores a la presentación, presencia física durante al menos la ' +
      'mitad de ese tiempo, tres meses en el Estado o distrito de USCIS donde se presenta la solicitud, buen ' +
      'carácter moral y los requisitos de inglés y de educación cívica.',
  },
  citations: [ina316a, ina316b, ina316e, ina318, ina334b, ina312, cfr316_5, cfr316_10],
  criteria: [
    {
      id: 'us-nat5-lawful-permanent-resident',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-316-a', 'us-sb-ina-318'],
      label: {
        en: 'Lawfully admitted for permanent residence',
        es: 'Admitido legalmente para la residencia permanente',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'permanent_resident' },
      guidance: {
        en:
          'Section 1429 makes lawful admission for permanent residence a prerequisite and puts the burden on ' +
          'the applicant to show the time, place and manner of entry. It also bars naturalisation where a final ' +
          'finding of deportability is outstanding, and bars an application from being considered at all while ' +
          'a removal proceeding is pending — neither of which Meridian records. Someone whose residence is ' +
          'still conditional under 8 U.S.C. 1186a should have the conditions removed before filing.',
        es:
          'El 8 U.S.C. 1429 convierte la admisión legal para la residencia permanente en requisito previo y ' +
          'pone sobre la persona la carga de acreditar el momento, el lugar y la forma de la entrada. Además ' +
          'impide la naturalización cuando está pendiente una resolución firme de deportabilidad, e impide que ' +
          'la solicitud siquiera se examine mientras haya un procedimiento de expulsión en curso — nada de lo ' +
          'cual registra Meridian. Quien tenga aún residencia condicional conforme al 8 U.S.C. 1186a debería ' +
          'levantar las condiciones antes de presentar la solicitud.',
      },
    },
    {
      id: 'us-nat5-age-eighteen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-sb-ina-334-b'],
      label: {
        en: 'At least 18 years of age at the date of filing',
        es: 'Al menos 18 años de edad en la fecha de presentación',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'A child under 18 cannot file a valid application of their own. Separate provisions govern children ' +
          'who acquire or derive citizenship through a parent, and they are not modelled here.',
        es:
          'Una persona menor de 18 años no puede presentar una solicitud válida por sí misma. Existen normas ' +
          'distintas para los hijos que adquieren o derivan la ciudadanía a través de un progenitor, y aquí no ' +
          'están modeladas.',
      },
    },
    {
      id: 'us-nat5-five-years-continuous-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['us-sb-ina-316-a'],
      label: {
        en: 'Five years of continuous residence as a permanent resident, immediately before filing',
        es: 'Cinco años de residencia continua como residente permanente, inmediatamente anteriores a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 5 },
      guidance: {
        en:
          'The five years must be one unbroken run reaching the filing date, and the clock starts at admission ' +
          'to permanent residence, not at first arrival. Where only a total day count is on file this criterion ' +
          'reports unknown rather than guessing. Paragraph (a)(2) then requires continuous residence to ' +
          'continue from the date of the application up to admission to citizenship, so the obligation does not ' +
          'stop when the form is filed.',
        es:
          'Los cinco años deben formar un periodo ininterrumpido que llegue hasta la fecha de presentación, y ' +
          'el reloj empieza con la admisión a la residencia permanente, no con la primera llegada. Si solo ' +
          'consta un número total de días, este criterio informa «desconocido» en lugar de suponer. El párrafo ' +
          '(a)(2) exige después que la residencia continua se mantenga desde la fecha de la solicitud hasta la ' +
          'admisión a la ciudadanía, de modo que la obligación no cesa al presentar el formulario.',
      },
    },
    {
      id: 'us-nat5-absences-did-not-break-continuity',
      kind: 'residence',
      weight: 'material',
      citationIds: ['us-sb-ina-316-b', 'us-sb-cfr-8-316-5'],
      label: {
        en: 'No single absence of one year or more during the five-year period',
        es: 'Ninguna ausencia única de un año o más durante el periodo de cinco años',
      },
      evaluator: { op: 'lt', path: 'derived.longestAbsenceDays', value: 365 },
      humanReviewWhen: { op: 'gt', path: 'derived.longestAbsenceDays', value: 180 },
      humanReviewReason: {
        en:
          'The longest recorded absence is over roughly six months. Under 8 U.S.C. 1427(b) an absence of more ' +
          'than six months but less than one year breaks the continuity of residence unless the applicant ' +
          'establishes that they did not in fact abandon it, and 8 CFR 316.5(c)(1)(i) lists the kind of ' +
          'evidence that rebuts the presumption — employment continued in the United States, immediate family ' +
          'remaining there, a home retained and accessible, no employment abroad. That is a documentary ' +
          'argument, not an arithmetic result. An absence of a year or more breaks continuity outright, and ' +
          'absent an approved Form N-470 the applicant may reapply four years and one day after returning.',
        es:
          'La ausencia más larga registrada supera aproximadamente los seis meses. Conforme al 8 U.S.C. ' +
          '1427(b), una ausencia de más de seis meses pero menos de un año rompe la continuidad de la ' +
          'residencia salvo que la persona acredite que de hecho no la abandonó, y el 8 CFR 316.5(c)(1)(i) ' +
          'enumera el tipo de prueba que desvirtúa esa presunción — empleo mantenido en Estados Unidos, ' +
          'familiares directos que permanecieron allí, vivienda conservada y accesible, ausencia de empleo en ' +
          'el extranjero. Eso es una argumentación documental, no un resultado aritmético. Una ausencia de un ' +
          'año o más rompe la continuidad sin más, y sin un Formulario N-470 aprobado la persona podrá volver a ' +
          'solicitar cuatro años y un día después de regresar.',
      },
      guidance: {
        en:
          'Section 1427(b) speaks in months. This criterion escalates above 180 days because six calendar ' +
          'months is 181 days or more depending on where it falls in the year, so an absence near the line is ' +
          'sent to a person slightly early rather than slightly late. The one-year line is tested at 365 days ' +
          'for the same reason and in the same direction.',
        es:
          'El 8 U.S.C. 1427(b) habla en meses. Este criterio escala por encima de 180 días porque seis meses ' +
          'naturales son 181 días o más según el tramo del año, de modo que una ausencia próxima al límite se ' +
          'remite a una persona algo antes y no algo después. La línea del año se comprueba en 365 días por la ' +
          'misma razón y en la misma dirección.',
      },
    },
    {
      id: 'us-nat5-physical-presence-half-the-period',
      kind: 'residence',
      weight: 'material',
      citationIds: ['us-sb-ina-316-a'],
      label: {
        en: 'Physically present for at least half of the five years — no more than 913 days of absence',
        es: 'Presencia física durante al menos la mitad de los cinco años — no más de 913 días de ausencia',
      },
      evaluator: { op: 'lte', path: 'derived.absenceDaysTotal', value: 913 },
      guidance: {
        en:
          'A five-year window spans 1,826 days, or 1,827 where two 29 Februaries fall inside it. Half of 1,826 ' +
          'is 913 exactly; half of 1,827 is 913.5, and since days are whole the applicant must then be present ' +
          'for 914. Either way the largest total absence that still satisfies the paragraph is 913 days, which ' +
          'is the figure tested here. The test uses every absence on file, including any that fell outside the ' +
          'qualifying five years, so it is deliberately conservative: it can report a person short who is not, ' +
          'which is why it can hold the report at indeterminate but never produces a negative verdict. ' +
          'Recompute it against the actual five-year window before filing.',
        es:
          'Una ventana de cinco años abarca 1.826 días, o 1.827 si dentro caen dos 29 de febrero. La mitad de ' +
          '1.826 son 913 exactos; la mitad de 1.827 son 913,5 y, como los días son enteros, la persona debe ' +
          'entonces estar presente 914. En ambos casos la mayor ausencia total que sigue cumpliendo el párrafo ' +
          'son 913 días, que es la cifra que aquí se comprueba. La comprobación usa todas las ausencias que ' +
          'constan, incluidas las que cayeron fuera de los cinco años computables, por lo que es ' +
          'deliberadamente conservadora: puede informar que falta tiempo a quien no le falta, y por eso puede ' +
          'dejar el informe como indeterminado pero nunca produce un veredicto negativo. Vuelva a calcularla ' +
          'sobre la ventana real de cinco años antes de presentar la solicitud.',
      },
    },
    {
      id: 'us-nat5-three-months-in-the-state-or-district',
      kind: 'residence',
      weight: 'material',
      citationIds: ['us-sb-ina-316-a', 'us-sb-cfr-8-316-5'],
      label: {
        en: 'Three months of residence in the State or USCIS district where the application is filed',
        es: 'Tres meses de residencia en el Estado o distrito de USCIS donde se presenta la solicitud',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records residence by country and holds no State, no address and no USCIS district, so it ' +
          'cannot test the three-month requirement in 8 U.S.C. 1427(a)(1) at all. Residence for this purpose is ' +
          'the applicant domicile or principal actual dwelling place under 8 CFR 316.5(a), assessed without ' +
          'regard to intent, and a recent move across a State line resets it. Because this criterion escalates ' +
          'unconditionally, this pathway never returns a positive verdict; the remaining criteria still report ' +
          'their own arithmetic, which is what the reviewer should start from.',
        es:
          'Meridian registra la residencia por país y no dispone de Estado, ni de domicilio, ni de distrito de ' +
          'USCIS, por lo que no puede comprobar en absoluto el requisito de tres meses del 8 U.S.C. ' +
          '1427(a)(1). La residencia a estos efectos es el domicilio o el lugar principal de habitación real ' +
          'de la persona conforme al 8 CFR 316.5(a), valorado con independencia de la intención, y una mudanza ' +
          'reciente a otro Estado reinicia el cómputo. Como este criterio escala de forma incondicional, esta ' +
          'vía nunca devuelve un veredicto positivo; los demás criterios siguen informando de su propia ' +
          'aritmética, que es de donde debe partir quien revise.',
      },
    },
    {
      id: 'us-nat5-good-moral-character',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-sb-ina-316-a', 'us-sb-ina-316-e', 'us-sb-cfr-8-316-10'],
      label: {
        en: 'Good moral character, attachment to the Constitution, and good disposition, throughout the period',
        es: 'Buen carácter moral, adhesión a la Constitución y buena disposición durante todo el periodo',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A criminal record is declared. Under 8 CFR 316.10 some convictions are unconditional bars — murder ' +
          'and aggravated felonies at any time, and within the statutory period crimes involving moral ' +
          'turpitude, controlled substance offences, false testimony and others — while a further group makes ' +
          'the finding adverse unless extenuating circumstances are established. Which group an offence falls ' +
          'into turns on its elements, not its name, and 8 U.S.C. 1427(e) allows conduct before the statutory ' +
          'period to be taken into account. This has to be read by a person against the record itself. A ' +
          'naturalisation application can also expose a removable offence, so the analysis is not only about ' +
          'whether the application succeeds.',
        es:
          'Se declaran antecedentes penales. Conforme al 8 CFR 316.10, algunas condenas son impedimentos ' +
          'incondicionales — homicidio y delitos agravados en cualquier momento y, dentro del periodo legal, ' +
          'delitos de vileza moral, delitos de sustancias controladas, falso testimonio y otros — mientras que ' +
          'otro grupo hace desfavorable la valoración salvo que se acrediten circunstancias atenuantes. A qué ' +
          'grupo pertenece un delito depende de sus elementos, no de su nombre, y el 8 U.S.C. 1427(e) permite ' +
          'tener en cuenta la conducta anterior al periodo legal. Esto debe leerlo una persona sobre el ' +
          'expediente mismo. Una solicitud de naturalización puede además sacar a la luz un delito que motive ' +
          'la expulsión, así que el análisis no versa solo sobre si la solicitud prospera.',
      },
      guidance: {
        en:
          'A clear police certificate is evidence toward good moral character; it is not the test. The ' +
          'determination is made case by case and the decision-maker is not limited to the statutory period. ' +
          'Attachment to the principles of the Constitution and being well disposed to the good order and ' +
          'happiness of the United States are separate requirements in the same paragraph, and this engine ' +
          'measures neither.',
        es:
          'Un certificado de antecedentes sin condenas es prueba a favor del buen carácter moral, pero no es la ' +
          'prueba. La valoración se hace caso por caso y quien resuelve no está limitado al periodo legal. La ' +
          'adhesión a los principios de la Constitución y la buena disposición hacia el orden y la felicidad de ' +
          'Estados Unidos son requisitos distintos del mismo párrafo, y este motor no mide ninguno de los dos.',
      },
    },
    {
      id: 'us-nat5-english-requirement-exemption',
      kind: 'language',
      weight: 'informational',
      citationIds: ['us-sb-ina-312'],
      label: {
        en: 'Exempt from the English requirement on age and length of residence',
        es: 'Exento del requisito de inglés por edad y duración de la residencia',
      },
      // Met means exempt, unmet means the English requirement applies. The test
      // itself is administered at the interview and cannot be pre-recorded, so
      // the criterion is informational and never touches the verdict.
      evaluator: {
        op: 'any_of',
        of: [
          {
            op: 'all_of',
            of: [
              { op: 'gt', path: 'derived.ageYears', value: 50 },
              { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 20 },
            ],
          },
          {
            op: 'all_of',
            of: [
              { op: 'gt', path: 'derived.ageYears', value: 55 },
              { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 15 },
            ],
          },
        ],
      },
      guidance: {
        en:
          'The exemption in 8 U.S.C. 1423(b)(2) reaches the English requirement only; the history and ' +
          'government requirement still applies and may be taken in the applicant own language. The statute ' +
          'says "over fifty" and "over fifty-five" and counts residence "totaling" the stated years, so this ' +
          'test uses completed years above the figure and the unbroken run rather than a total, which is the ' +
          'stricter reading on both counts. Someone close to either line should have it checked. A separate ' +
          'exemption at 8 U.S.C. 1423(b)(1) covers anyone unable to comply because of a physical or ' +
          'developmental disability or mental impairment, and it is not modelled here.',
        es:
          'La exención del 8 U.S.C. 1423(b)(2) alcanza únicamente al requisito de inglés; el de historia y ' +
          'gobierno sigue aplicándose y puede rendirse en el idioma de la persona. La ley dice «mayor de ' +
          'cincuenta» y «mayor de cincuenta y cinco» y computa la residencia «que sume» los años indicados, de ' +
          'modo que esta comprobación usa años cumplidos por encima de la cifra y el periodo ininterrumpido en ' +
          'lugar de un total, que es la lectura más estricta en ambos extremos. Quien esté cerca de cualquiera ' +
          'de los dos límites debería hacerlo verificar. Una exención distinta, la del 8 U.S.C. 1423(b)(1), ' +
          'cubre a quien no pueda cumplir por discapacidad física o del desarrollo o por deterioro mental, y ' +
          'aquí no está modelada.',
      },
    },
    {
      id: 'us-nat5-civics-special-consideration',
      kind: 'integration',
      weight: 'informational',
      citationIds: ['us-sb-ina-312'],
      label: {
        en: 'Entitled to special consideration on the history and government requirement',
        es: 'Con derecho a consideración especial en el requisito de historia y gobierno',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'gt', path: 'derived.ageYears', value: 65 },
          { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 20 },
        ],
      },
      guidance: {
        en:
          'Section 1423(b)(3) directs that special consideration be given to the history and government ' +
          'requirement for a person over sixty-five who has been living in the United States for at least ' +
          'twenty years since lawful admission for permanent residence. It is a direction about how the ' +
          'requirement is administered, not an exemption from it.',
        es:
          'El 8 U.S.C. 1423(b)(3) ordena dar consideración especial al requisito de historia y gobierno a quien ' +
          'sea mayor de sesenta y cinco años y lleve al menos veinte años viviendo en Estados Unidos desde su ' +
          'admisión legal para la residencia permanente. Es una instrucción sobre cómo se administra el ' +
          'requisito, no una exención de él.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['us-sb-ina-316-a'],
    note: {
      en:
        'Naturalisation is the end of the residence clock, not a status that runs. The residence obligation ' +
        'continues from the date of the application up to admission to citizenship, so a long trip after ' +
        'filing is still capable of breaking it.',
      es:
        'La naturalización es el final del reloj de residencia, no un estatus que corra. La obligación de ' +
        'residencia continúa desde la fecha de la solicitud hasta la admisión a la ciudadanía, de modo que un ' +
        'viaje largo posterior a la presentación aún puede romperla.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Naturalisation by residence — the three-year rule for spouses of citizens
// ---------------------------------------------------------------------------

export const usNaturalizationSpouseThreeYear: Pathway = {
  id: 'us-naturalization-spouse-three-year',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'United States naturalisation by residence — three-year rule for the spouse of a citizen',
    es: 'Naturalización estadounidense por residencia — regla de tres años para el cónyuge de una persona ciudadana',
  },
  summary: {
    en:
      'A permanent resident married to a United States citizen may file after three years instead of five, ' +
      'provided the spouse has been a citizen for all of those three years, the couple has been living in ' +
      'marital union throughout them, and the applicant has been physically present for at least 18 months. ' +
      'Every other requirement of the general rule — the three months in the State or district, good moral ' +
      'character, English and civics — applies unchanged.',
    es:
      'Quien tenga la residencia permanente y esté casada con una persona ciudadana estadounidense puede ' +
      'presentar la solicitud a los tres años en lugar de a los cinco, siempre que el cónyuge haya sido ' +
      'ciudadano durante esos tres años completos, que la pareja haya vivido en unión marital durante todos ' +
      'ellos y que la persona solicitante haya estado físicamente presente al menos 18 meses. Todos los demás ' +
      'requisitos de la regla general — los tres meses en el Estado o distrito, el buen carácter moral, el ' +
      'inglés y la educación cívica — se aplican sin cambios.',
  },
  // Section 1427(a) is deliberately absent: § 1430(a) restates the residence,
  // physical-presence, three-month and character requirements in its own words
  // for this route, so citing the general rule alongside it would put two
  // instruments behind one requirement and leave a reader unsure which text
  // governs. Sections 1427(b) and (d)-(e) are cited because they are not
  // restated — (b) speaks of "the period for which continuous residence is
  // required", which is three years here.
  citations: [ina319a, ina316b, ina316e, ina318, ina334b, ina312, cfr316_5, cfr316_10, cfr319_1],
  criteria: [
    {
      id: 'us-nat3-lawful-permanent-resident',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-319-a', 'us-sb-ina-318'],
      label: {
        en: 'Lawfully admitted for permanent residence',
        es: 'Admitido legalmente para la residencia permanente',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'permanent_resident' },
      guidance: {
        en:
          'Residence obtained through a marriage less than two years old is conditional for two years under ' +
          '8 U.S.C. 1186a. A conditional resident is a permanent resident for the purpose of the residence ' +
          'clock, but the conditions have to be removed, and the timing of that petition and of the ' +
          'naturalisation application need to be planned together.',
        es:
          'La residencia obtenida por un matrimonio de menos de dos años es condicional durante dos años ' +
          'conforme al 8 U.S.C. 1186a. Quien tiene residencia condicional es residente permanente a efectos ' +
          'del reloj de residencia, pero las condiciones deben levantarse, y los plazos de esa petición y los ' +
          'de la solicitud de naturalización han de planificarse conjuntamente.',
      },
    },
    {
      id: 'us-nat3-age-eighteen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-sb-ina-334-b'],
      label: {
        en: 'At least 18 years of age at the date of filing',
        es: 'Al menos 18 años de edad en la fecha de presentación',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
    },
    {
      id: 'us-nat3-three-years-continuous-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['us-sb-ina-319-a', 'us-sb-cfr-8-319-1'],
      label: {
        en: 'Three years of continuous residence as a permanent resident, immediately before filing',
        es: 'Tres años de residencia continua como residente permanente, inmediatamente anteriores a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 3 },
      guidance: {
        en:
          'The three years run from admission to permanent residence and must be one unbroken run reaching the ' +
          'filing date. The obligation continues from the application up to admission to citizenship.',
        es:
          'Los tres años corren desde la admisión a la residencia permanente y deben formar un periodo ' +
          'ininterrumpido que llegue hasta la fecha de presentación. La obligación continúa desde la solicitud ' +
          'hasta la admisión a la ciudadanía.',
      },
    },
    {
      id: 'us-nat3-citizen-spouse-and-marital-union',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-319-a', 'us-sb-cfr-8-319-1'],
      label: {
        en: 'Living in marital union for three years with a spouse who was a citizen throughout',
        es: 'Convivencia en unión marital durante tres años con un cónyuge que fue ciudadano todo ese tiempo',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records nothing about the applicant spouse — not the marriage, not its date, not the ' +
          'spouse status — so neither half of this requirement can be tested. Both halves are exacting. The ' +
          'spouse must have been a United States citizen during the whole of the three years, so a spouse who ' +
          'naturalised part-way through does not carry the earlier period. And 8 CFR 319.1(b) treats living in ' +
          'marital union as actually residing together: a legal separation breaks it, an informal separation is ' +
          'assessed case by case, death or divorce or the spouse ceasing to be a citizen ends eligibility ' +
          'outright, remarriage to another citizen does not restore it, and only an involuntary separation ' +
          'caused by circumstances beyond the couple control does not break it. Where the three-year rule is ' +
          'not available the five-year general rule still is.',
        es:
          'Meridian no registra nada sobre el cónyuge — ni el matrimonio, ni su fecha, ni el estatus del ' +
          'cónyuge —, de modo que no puede comprobarse ninguna de las dos mitades de este requisito. Ambas son ' +
          'exigentes. El cónyuge debe haber sido ciudadano estadounidense durante los tres años completos, así ' +
          'que un cónyuge que se naturalizó a mitad del periodo no arrastra el tramo anterior. Y el 8 CFR ' +
          '319.1(b) entiende la unión marital como convivencia efectiva: una separación legal la rompe, una ' +
          'separación informal se valora caso por caso, el fallecimiento, el divorcio o la pérdida de la ' +
          'ciudadanía del cónyuge extinguen la elegibilidad, volver a casarse con otra persona ciudadana no la ' +
          'restablece, y solo la separación involuntaria por circunstancias ajenas a la pareja no la rompe. Si ' +
          'la regla de tres años no está disponible, la regla general de cinco años sí lo está.',
      },
    },
    {
      id: 'us-nat3-absences-did-not-break-continuity',
      kind: 'residence',
      weight: 'material',
      citationIds: ['us-sb-ina-316-b', 'us-sb-cfr-8-316-5'],
      label: {
        en: 'No single absence of one year or more during the three-year period',
        es: 'Ninguna ausencia única de un año o más durante el periodo de tres años',
      },
      evaluator: { op: 'lt', path: 'derived.longestAbsenceDays', value: 365 },
      humanReviewWhen: { op: 'gt', path: 'derived.longestAbsenceDays', value: 180 },
      humanReviewReason: {
        en:
          'The longest recorded absence is over roughly six months, which under 8 U.S.C. 1427(b) breaks the ' +
          'continuity of residence unless the applicant establishes that they did not abandon it — a ' +
          'documentary argument of the kind described in 8 CFR 316.5(c)(1)(i). An absence of a year or more ' +
          'breaks it outright, and on the three-year rule 8 CFR 316.5(c)(1)(ii) allows a fresh application two ' +
          'years and one day after returning, absent an approved Form N-470.',
        es:
          'La ausencia más larga registrada supera aproximadamente los seis meses, lo que conforme al 8 U.S.C. ' +
          '1427(b) rompe la continuidad de la residencia salvo que la persona acredite que no la abandonó — una ' +
          'argumentación documental del tipo descrito en el 8 CFR 316.5(c)(1)(i). Una ausencia de un año o más ' +
          'la rompe sin más y, en la regla de tres años, el 8 CFR 316.5(c)(1)(ii) permite una nueva solicitud ' +
          'dos años y un día después de regresar, si no hay un Formulario N-470 aprobado.',
      },
    },
    {
      id: 'us-nat3-physical-presence-eighteen-months',
      kind: 'residence',
      weight: 'material',
      citationIds: ['us-sb-ina-319-a', 'us-sb-cfr-8-319-1'],
      label: {
        en: 'Physically present for at least 18 months of the three years — no more than 547 days of absence',
        es: 'Presencia física durante al menos 18 meses de los tres años — no más de 547 días de ausencia',
      },
      evaluator: { op: 'lte', path: 'derived.absenceDaysTotal', value: 547 },
      guidance: {
        en:
          'Half of three years is 18 months, the figure 8 CFR 319.1(a)(4) states outright. A three-year window ' +
          'spans 1,095 days, or 1,096 where a 29 February falls inside it, so the largest total absence that ' +
          'still leaves half the period is 547 days in the first case and 548 in the second. This test uses ' +
          '547, the stricter of the two, and as on the five-year rule it counts every absence on file, ' +
          'including any outside the qualifying period. It is conservative by construction: it can hold the ' +
          'report at indeterminate but never produces a negative verdict.',
        es:
          'La mitad de tres años son 18 meses, cifra que el 8 CFR 319.1(a)(4) recoge expresamente. Una ventana ' +
          'de tres años abarca 1.095 días, o 1.096 si dentro cae un 29 de febrero, de modo que la mayor ' +
          'ausencia total que sigue dejando la mitad del periodo es de 547 días en el primer caso y de 548 en ' +
          'el segundo. Esta comprobación usa 547, la más estricta de las dos, y, como en la regla de cinco ' +
          'años, cuenta todas las ausencias que constan, incluidas las ajenas al periodo computable. Es ' +
          'conservadora por construcción: puede dejar el informe como indeterminado, pero nunca produce un ' +
          'veredicto negativo.',
      },
    },
    {
      id: 'us-nat3-three-months-in-the-state-or-district',
      kind: 'residence',
      weight: 'material',
      citationIds: ['us-sb-ina-319-a', 'us-sb-cfr-8-316-5'],
      label: {
        en: 'Three months of residence in the State or USCIS district where the application is filed',
        es: 'Tres meses de residencia en el Estado o distrito de USCIS donde se presenta la solicitud',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records residence by country and holds no State, no address and no USCIS district, so the ' +
          'three-month requirement carried into 8 U.S.C. 1430(a) cannot be tested. Residence for this purpose ' +
          'is the applicant domicile or principal actual dwelling place under 8 CFR 316.5(a), assessed without ' +
          'regard to intent.',
        es:
          'Meridian registra la residencia por país y no dispone de Estado, ni de domicilio, ni de distrito de ' +
          'USCIS, por lo que no puede comprobarse el requisito de tres meses que recoge el 8 U.S.C. 1430(a). La ' +
          'residencia a estos efectos es el domicilio o el lugar principal de habitación real de la persona ' +
          'conforme al 8 CFR 316.5(a), valorado con independencia de la intención.',
      },
    },
    {
      id: 'us-nat3-good-moral-character',
      kind: 'character',
      weight: 'material',
      citationIds: ['us-sb-ina-319-a', 'us-sb-ina-316-e', 'us-sb-cfr-8-316-10'],
      label: {
        en: 'Good moral character, attachment to the Constitution, and good disposition, throughout the period',
        es: 'Buen carácter moral, adhesión a la Constitución y buena disposición durante todo el periodo',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A criminal record is declared, and 8 CFR 316.10 divides offences into unconditional bars and ' +
          'findings that are adverse unless extenuating circumstances are established, by reference to the ' +
          'elements of the offence rather than its name. Section 1427(e) allows conduct before the statutory ' +
          'period to be considered. On the three-year rule the statutory period is three years rather than ' +
          'five, which changes which conduct falls inside it.',
        es:
          'Se declaran antecedentes penales, y el 8 CFR 316.10 divide los delitos en impedimentos ' +
          'incondicionales y valoraciones desfavorables salvo que se acrediten circunstancias atenuantes, ' +
          'atendiendo a los elementos del delito y no a su nombre. El 8 U.S.C. 1427(e) permite tener en cuenta ' +
          'la conducta anterior al periodo legal. En la regla de tres años ese periodo legal es de tres años y ' +
          'no de cinco, lo que cambia qué conducta queda dentro.',
      },
    },
    {
      id: 'us-nat3-english-requirement-exemption',
      kind: 'language',
      weight: 'informational',
      citationIds: ['us-sb-ina-312'],
      label: {
        en: 'Exempt from the English requirement on age and length of residence',
        es: 'Exento del requisito de inglés por edad y duración de la residencia',
      },
      evaluator: {
        op: 'any_of',
        of: [
          {
            op: 'all_of',
            of: [
              { op: 'gt', path: 'derived.ageYears', value: 50 },
              { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 20 },
            ],
          },
          {
            op: 'all_of',
            of: [
              { op: 'gt', path: 'derived.ageYears', value: 55 },
              { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 15 },
            ],
          },
        ],
      },
      guidance: {
        en:
          'The exemption reaches the English requirement only; the history and government requirement still ' +
          'applies and may be taken in the applicant own language. It is not affected by which residence rule ' +
          'the application is filed under — it depends on age and on years of residence since lawful admission ' +
          'for permanent residence, so most applicants on the three-year rule will not have accrued them.',
        es:
          'La exención alcanza únicamente al requisito de inglés; el de historia y gobierno sigue aplicándose y ' +
          'puede rendirse en el idioma de la persona. No depende de la regla de residencia bajo la que se ' +
          'presente la solicitud, sino de la edad y de los años de residencia desde la admisión legal para la ' +
          'residencia permanente, por lo que la mayoría de quienes se acogen a la regla de tres años no los ' +
          'habrán acumulado.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['us-sb-ina-319-a'],
    note: {
      en:
        'The three-year rule shortens the residence period; it does not soften anything else. If the marriage ' +
        'ends or the union breaks before the applicant is admitted to citizenship, eligibility under this rule ' +
        'ends with it, and the five-year general rule is the remaining route.',
      es:
        'La regla de tres años acorta el periodo de residencia; no atenúa nada más. Si el matrimonio termina o ' +
        'la unión se rompe antes de la admisión a la ciudadanía, la elegibilidad por esta vía se extingue con ' +
        'ella, y la regla general de cinco años es el camino que queda.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Screening — the three-year and ten-year unlawful presence bars
// ---------------------------------------------------------------------------

export const usUnlawfulPresenceBarScreening: Pathway = {
  id: 'us-unlawful-presence-bar-screening',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'Screening — the three-year and ten-year unlawful presence bars on departure',
    es: 'Cribado — las prohibiciones de tres y diez años por presencia ilegal al salir del país',
  },
  summary: {
    en:
      'This record is not a route and nothing is granted under it. It exists so that a person weighing a ' +
      'departure — most often to attend an immigrant visa interview — is told that 8 U.S.C. 1182(a)(9)(B) may ' +
      'be in play and that the question needs a licensed representative. Both bars are triggered by departure, ' +
      'neither operates while the person remains inside the United States, and this catalog holds none of the ' +
      'facts the count requires. Every evaluation of this record returns "requires human review"; there is no ' +
      'reading of it in which anyone is cleared to travel.',
    es:
      'Este registro no es una vía y por él no se concede nada. Existe para que quien esté sopesando salir del ' +
      'país — casi siempre para acudir a una entrevista de visa de inmigrante — sepa que el 8 U.S.C. ' +
      '1182(a)(9)(B) puede estar en juego y que la cuestión necesita a un representante habilitado. Ambas ' +
      'prohibiciones se activan con la salida, ninguna opera mientras la persona permanece dentro de Estados ' +
      'Unidos, y este catálogo no dispone de ninguno de los datos que exige el cómputo. Toda evaluación de ' +
      'este registro devuelve «requiere revisión humana»; no hay lectura de él en la que alguien quede ' +
      'autorizado a viajar.',
  },
  citations: [
    ina212a9bi,
    ina212a9bii,
    ina212a9biii,
    ina212a9bv,
    ina212a9a,
    fam302_11_3,
    biaArrabally,
    fr91_44976,
  ],
  criteria: [
    {
      id: 'us-upb-applicant-is-not-a-permanent-resident',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-212-a-9-b-i'],
      label: {
        en: 'The bars can reach this applicant: they are not a lawful permanent resident',
        es: 'Las prohibiciones pueden alcanzar a esta persona: no es residente permanente legal',
      },
      // Polarity note: "met" here means the screening applies, not that the
      // applicant is in the clear. The opening words of § 1182(a)(9)(B)(i)
      // exclude a lawful permanent resident from the paragraph entirely, so a
      // recorded LPR takes this record out of scope.
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'permanent_resident' } },
      guidance: {
        en:
          'Section 1182(a)(9)(B)(i) opens with the words "Any alien (other than an alien lawfully admitted for ' +
          'permanent residence)". A permanent resident returning from a trip abroad is outside this paragraph; ' +
          'a different body of law governs when a returning resident is treated as seeking admission at all.',
        es:
          'El 8 U.S.C. 1182(a)(9)(B)(i) empieza con las palabras «cualquier extranjero (que no sea un ' +
          'extranjero admitido legalmente para la residencia permanente)». Quien es residente permanente y ' +
          'regresa de un viaje queda fuera de este párrafo; cuándo se considera que un residente que regresa ' +
          'solicita admisión se rige por normas distintas.',
      },
    },
    {
      id: 'us-upb-unlawful-presence-may-have-accrued',
      kind: 'status',
      weight: 'blocking',
      citationIds: [
        'us-sb-ina-212-a-9-b-i',
        'us-sb-ina-212-a-9-b-ii',
        'us-sb-fam-302-11-3',
        'us-sb-bia-arrabally',
      ],
      label: {
        en: 'Whether unlawful presence has accrued, and how much',
        es: 'Si se ha acumulado presencia ilegal y en qué medida',
      },
      evaluator: UNLAWFUL_PRESENCE_SIGNALS,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This cannot be answered from anything Meridian holds, and answering it wrongly costs three or ten ' +
          'years. Unlawful presence begins the day after the authorised period of stay recorded on admission ' +
          'ends, or on the day of an entry without admission or parole; it does not begin when the visa ' +
          'expires, because the visa governs travel and not stay. The count excludes both the day the Form ' +
          'I-94 expired and the day of departure, so a naive inclusive day count overstates it by two. The ' +
          'periods are not cumulative across separate trips, though separate periods within one overall stay ' +
          'are added together, and nothing before 1 April 1997 counts. A departure under advance parole is not ' +
          'a departure for this purpose. Take the Form I-94 history to a licensed attorney or a representative ' +
          'accredited by the Department of Justice and have the count done before any travel is booked.',
        es:
          'Esto no puede responderse con nada de lo que Meridian dispone, y responderlo mal cuesta tres o diez ' +
          'años. La presencia ilegal comienza el día siguiente al fin del periodo de estancia autorizado que ' +
          'consta en la admisión, o el día de una entrada sin admisión ni parole; no comienza cuando vence la ' +
          'visa, porque la visa rige el viaje y no la estancia. El cómputo excluye tanto el día de vencimiento ' +
          'del Formulario I-94 como el día de la salida, de modo que un cómputo inclusivo ingenuo lo exagera en ' +
          'dos días. Los periodos no se acumulan entre viajes distintos, aunque los periodos separados dentro ' +
          'de una misma estancia sí se suman, y nada anterior al 1 de abril de 1997 computa. Una salida al ' +
          'amparo de un advance parole no es una salida a estos efectos. Lleve el historial del Formulario ' +
          'I-94 a una persona abogada colegiada o a un representante acreditado por el Departamento de ' +
          'Justicia y haga el cómputo antes de reservar ningún viaje.',
      },
      guidance: {
        en:
          'The two thresholds are more than 180 days but less than one year, which carries a three-year bar, ' +
          'and one year or more, which carries a ten-year bar. The three-year bar applies only where the ' +
          'departure was voluntary and made before proceedings commenced; the ten-year bar carries no ' +
          'equivalent condition, so a person placed in proceedings before departing can escape the first while ' +
          'remaining exposed to the second. Both run from the date of departure.',
        es:
          'Los dos umbrales son más de 180 días pero menos de un año, que acarrea una prohibición de tres años, ' +
          'y un año o más, que acarrea una de diez. La prohibición de tres años solo se aplica cuando la salida ' +
          'fue voluntaria y anterior al inicio del procedimiento; la de diez años no lleva condición ' +
          'equivalente, de modo que quien fue puesto en procedimiento antes de salir puede librarse de la ' +
          'primera y seguir expuesto a la segunda. Ambas corren desde la fecha de salida.',
      },
    },
    {
      id: 'us-upb-under-eighteen-does-not-accrue',
      kind: 'status',
      weight: 'informational',
      citationIds: ['us-sb-ina-212-a-9-b-iii'],
      label: {
        en: 'Under 18: no period spent under 18 is counted toward either threshold',
        es: 'Menor de 18 años: ningún periodo transcurrido siendo menor de 18 computa para los umbrales',
      },
      evaluator: { op: 'lt', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'Clause (iii)(I) excludes any period during which the applicant is under 18 years of age, which is a ' +
          'bright line. The other exceptions in clause (iii) — a pending bona fide asylum application, family ' +
          'unity beneficiaries, battered women and children, and victims of a severe form of trafficking — are ' +
          'real and are deliberately not modelled in this catalog. Their existence is stated so that their ' +
          'absence is not read as an absence of law; whether one applies is a question for a licensed ' +
          'attorney or a representative accredited by the Department of Justice.',
        es:
          'El inciso (iii)(I) excluye cualquier periodo durante el cual la persona sea menor de 18 años, y eso ' +
          'es una línea nítida. Las demás excepciones del inciso (iii) — una solicitud de asilo de buena fe en ' +
          'trámite, beneficiarios de unidad familiar, mujeres y menores maltratados y víctimas de una forma ' +
          'grave de trata — son reales y este catálogo no las modela deliberadamente. Se deja constancia de su ' +
          'existencia para que su ausencia no se lea como ausencia de norma; si alguna se aplica es cuestión ' +
          'para una persona abogada colegiada o un representante acreditado por el Departamento de Justicia.',
      },
    },
    {
      id: 'us-upb-prior-removal-order',
      kind: 'status',
      weight: 'material',
      citationIds: ['us-sb-ina-212-a-9-a'],
      label: {
        en: 'No prior removal order on record',
        es: 'Sin orden de expulsión previa en el expediente',
      },
      evaluator: NO_PRIOR_REMOVAL,
      humanReviewWhen: HAS_PRIOR_REMOVAL,
      humanReviewReason: {
        en:
          'A removal on record engages 8 U.S.C. 1182(a)(9)(A) in its own right, alongside anything the ' +
          'unlawful presence bars do. The period depends on the circumstances of the removal and on whether it ' +
          'was the first, consent to reapply may be sought in advance, and the time to be spent outside the ' +
          'United States does not have to be served consecutively — it pauses if the person is inside without ' +
          'consent and does not reset with each entry or departure. Meridian holds a count and no dates.',
        es:
          'Una expulsión registrada activa por sí sola el 8 U.S.C. 1182(a)(9)(A), además de lo que hagan las ' +
          'prohibiciones por presencia ilegal. El plazo depende de las circunstancias de la expulsión y de si ' +
          'fue la primera, el consentimiento para volver a solicitar puede pedirse por anticipado, y el tiempo ' +
          'que debe pasarse fuera de Estados Unidos no tiene que cumplirse de forma consecutiva — se detiene ' +
          'si la persona está dentro sin consentimiento y no se reinicia con cada entrada o salida. Meridian ' +
          'dispone de un recuento y de ninguna fecha.',
      },
    },
    {
      id: 'us-upb-student-duration-of-status-change',
      kind: 'status',
      weight: 'informational',
      citationIds: ['us-sb-fr-91-44976', 'us-sb-ina-212-a-9-b-ii', 'us-sb-fam-302-11-3'],
      label: {
        en: 'Recorded as a student: the duration-of-status rule changes on 15 September 2026',
        es: 'Registrado como estudiante: la regla de duración del estatus cambia el 15 de septiembre de 2026',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'student' },
      guidance: {
        en:
          'A person admitted for duration of status has historically accrued unlawful presence only from the ' +
          'day after a formal finding of a status violation by DHS, an immigration judge or the Board of ' +
          'Immigration Appeals — which in practice sheltered students, exchange visitors and foreign media ' +
          'representatives from these bars almost entirely. A final rule published at 91 FR 44976 on 17 July ' +
          '2026 replaces duration of status with a fixed admission period from 15 September 2026, capped for ' +
          'F-1 at the length of the programme and not more than four years. Presence past a fixed date accrues ' +
          'automatically, so the shelter goes and the bars in this record become reachable. The rule is ' +
          'classified as a major rule subject to congressional review, its text is not yet incorporated into ' +
          'the codified regulations, and its litigation status was not established when this record was ' +
          'written. Confirm all three before relying on it in either direction.',
        es:
          'Quien es admitido por duración del estatus solo ha acumulado históricamente presencia ilegal desde ' +
          'el día siguiente a una resolución formal de incumplimiento del estatus dictada por el DHS, un juez ' +
          'de inmigración o la Junta de Apelaciones de Inmigración — lo que en la práctica protegía casi por ' +
          'completo de estas prohibiciones a estudiantes, visitantes de intercambio y representantes de medios ' +
          'extranjeros. Una norma final publicada en 91 FR 44976 el 17 de julio de 2026 sustituye la duración ' +
          'del estatus por un periodo de admisión fijo a partir del 15 de septiembre de 2026, limitado para el ' +
          'F-1 a la duración del programa y a un máximo de cuatro años. La presencia posterior a una fecha ' +
          'fija se acumula automáticamente, de modo que la protección desaparece y las prohibiciones de este ' +
          'registro pasan a ser alcanzables. La norma está clasificada como norma principal sujeta a revisión ' +
          'del Congreso, su texto aún no está incorporado a la regulación codificada y su situación judicial no ' +
          'se estableció al redactar este registro. Confirme las tres cosas antes de apoyarse en ella en ' +
          'cualquier sentido.',
      },
    },
  ],
  durations: {
    citationIds: ['us-sb-ina-212-a-9-b-i', 'us-sb-ina-212-a-9-b-v'],
    note: {
      en:
        'The three-year and ten-year periods run from the date of departure or removal, not from the date the ' +
        'unlawful presence began or ended. Meridian records no departure date and therefore computes no end ' +
        'date for either. A waiver exists at 8 U.S.C. 1182(a)(9)(B)(v), and its qualifying relationships are ' +
        'narrower than almost everyone expects: the applicant must be the spouse, son or daughter of a United ' +
        'States citizen or permanent resident, and the extreme hardship must be to a citizen or permanent ' +
        'resident spouse or parent of the applicant. A United States citizen child is not a qualifying ' +
        'relative for this waiver.',
      es:
        'Los plazos de tres y diez años corren desde la fecha de salida o de expulsión, no desde la fecha en ' +
        'que empezó o terminó la presencia ilegal. Meridian no registra fecha de salida y, por tanto, no ' +
        'calcula fecha final para ninguno de los dos. Existe una dispensa en el 8 U.S.C. 1182(a)(9)(B)(v), y ' +
        'sus vínculos cualificados son más estrechos de lo que casi todo el mundo supone: la persona ' +
        'solicitante debe ser cónyuge, hijo o hija de una persona ciudadana o residente permanente de Estados ' +
        'Unidos, y el perjuicio extremo debe recaer sobre un cónyuge o progenitor ciudadano o residente ' +
        'permanente de esa persona. Un hijo o hija ciudadano estadounidense no es familiar cualificado para ' +
        'esta dispensa.',
    },
  },
  leadsTo: ['us-provisional-waiver-unlawful-presence'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Screening — the permanent bar
// ---------------------------------------------------------------------------

export const usPermanentBarScreening: Pathway = {
  id: 'us-permanent-bar-screening',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'Screening — the permanent bar under 8 U.S.C. 1182(a)(9)(C)',
    es: 'Cribado — la prohibición permanente del 8 U.S.C. 1182(a)(9)(C)',
  },
  summary: {
    en:
      'A separate and harsher ground from the three- and ten-year bars, and one that is routinely mistaken for ' +
      'them. It reaches a person who accrued more than one year of unlawful presence in aggregate, or who was ' +
      'ordered removed, and who then entered or tried to enter the United States without being admitted. ' +
      'Unlike the other bars it aggregates across the whole history, it is triggered by the re-entry rather ' +
      'than by a departure, and there is no waiver of general application. Like the other screening record, ' +
      'this one grants nothing and always returns "requires human review".',
    es:
      'Una causal distinta y más severa que las prohibiciones de tres y diez años, y que habitualmente se ' +
      'confunde con ellas. Alcanza a quien acumuló más de un año de presencia ilegal en total, o fue objeto de ' +
      'una orden de expulsión, y después entró o intentó entrar en Estados Unidos sin ser admitido. A ' +
      'diferencia de las otras prohibiciones, esta suma todo el historial, se activa con la reentrada y no con ' +
      'una salida, y no existe dispensa de aplicación general. Igual que el otro registro de cribado, este no ' +
      'concede nada y siempre devuelve «requiere revisión humana».',
  },
  citations: [ina212a9c, ina212a9biii, ina212a9a, ina212a6ai, fam302_11_4],
  criteria: [
    {
      id: 'us-pb-aggregate-unlawful-presence-over-one-year',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-212-a-9-c', 'us-sb-fam-302-11-4'],
      label: {
        en: 'Whether more than one year of unlawful presence has accrued in aggregate',
        es: 'Si se ha acumulado en total más de un año de presencia ilegal',
      },
      evaluator: UNLAWFUL_PRESENCE_SIGNALS,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The first limb of 8 U.S.C. 1182(a)(9)(C)(i) turns on an aggregate of more than one year across the ' +
          'whole history since 1 April 1997. This is the opposite of the rule for the three- and ten-year bars, ' +
          'which are not cumulative across separate trips, and stating it backwards is a common and expensive ' +
          'error. Meridian holds no periods of unlawful presence, so the aggregate cannot be computed here. ' +
          'The exceptions that reduce the count for 8 U.S.C. 1182(a)(9)(B) — including the exclusion of time ' +
          'spent under 18 — do not apply to this paragraph.',
        es:
          'El primer supuesto del 8 U.S.C. 1182(a)(9)(C)(i) depende de un total de más de un año a lo largo de ' +
          'todo el historial desde el 1 de abril de 1997. Es la regla contraria a la de las prohibiciones de ' +
          'tres y diez años, que no se acumulan entre viajes distintos, y enunciarla al revés es un error ' +
          'frecuente y caro. Meridian no dispone de periodos de presencia ilegal, así que aquí no puede ' +
          'calcularse el total. Las excepciones que reducen el cómputo del 8 U.S.C. 1182(a)(9)(B) — incluida la ' +
          'exclusión del tiempo transcurrido siendo menor de 18 años — no se aplican a este párrafo.',
      },
    },
    {
      id: 'us-pb-reentry-or-attempted-reentry-without-admission',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-212-a-9-c', 'us-sb-ina-212-a-6-a-i', 'us-sb-fam-302-11-4'],
      label: {
        en: 'Whether the applicant entered, or tried to enter, without being admitted',
        es: 'Si la persona entró, o intentó entrar, sin ser admitida',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'irregular' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The paragraph only bites where the person entered or attempted to reenter without being admitted, ' +
          'after the aggregate year or after a removal order. Meridian records no manner of entry and no ' +
          'attempted entries, so this cannot be established here. Two traps: an attempt counts, not only a ' +
          'completed entry, and a false claim to United States citizenship made at a port of entry can itself ' +
          'be the attempted entry without admission, because a citizen is not subject to inspection. The ' +
          'pattern this paragraph exists to catch — more than a year unlawfully present, a departure or ' +
          'removal, then a return without inspection — is common in this corridor and it does not have a ' +
          'waiver comparable to the provisional waiver.',
        es:
          'El párrafo solo opera cuando la persona entró o intentó reentrar sin ser admitida, después del año ' +
          'acumulado o después de una orden de expulsión. Meridian no registra la forma de entrada ni los ' +
          'intentos de entrada, así que aquí no puede acreditarse. Dos trampas: el intento cuenta, no solo la ' +
          'entrada consumada, y una falsa declaración de ciudadanía estadounidense hecha en un puerto de ' +
          'entrada puede ser ella misma el intento de entrada sin admisión, porque a una persona ciudadana no ' +
          'se le somete a inspección. El patrón que este párrafo persigue — más de un año de presencia ilegal, ' +
          'una salida o expulsión y después un regreso sin inspección — es frecuente en este corredor y no ' +
          'cuenta con una dispensa comparable a la dispensa provisional.',
      },
    },
    {
      id: 'us-pb-prior-removal-order',
      kind: 'status',
      weight: 'material',
      citationIds: ['us-sb-ina-212-a-9-c', 'us-sb-ina-212-a-9-a'],
      label: {
        en: 'No prior removal order on record',
        es: 'Sin orden de expulsión previa en el expediente',
      },
      evaluator: NO_PRIOR_REMOVAL,
      humanReviewWhen: HAS_PRIOR_REMOVAL,
      humanReviewReason: {
        en:
          'A removal on record satisfies the second limb of 8 U.S.C. 1182(a)(9)(C)(i) on its own — no ' +
          'aggregate year of unlawful presence is needed — so the only remaining question is whether the ' +
          'person afterwards entered or attempted to enter without being admitted. The removal also engages ' +
          '8 U.S.C. 1182(a)(9)(A) separately. A removal order that predates 1 April 1997 can still support ' +
          'this limb, though the triggering entry or attempt must fall after that date.',
        es:
          'Una expulsión registrada satisface por sí sola el segundo supuesto del 8 U.S.C. 1182(a)(9)(C)(i) — ' +
          'no hace falta un año acumulado de presencia ilegal —, de modo que lo único que queda por determinar ' +
          'es si la persona entró después, o lo intentó, sin ser admitida. La expulsión activa además de forma ' +
          'independiente el 8 U.S.C. 1182(a)(9)(A). Una orden de expulsión anterior al 1 de abril de 1997 ' +
          'puede seguir sustentando este supuesto, aunque la entrada o el intento que lo desencadena debe ser ' +
          'posterior a esa fecha.',
      },
    },
    {
      id: 'us-pb-under-eighteen-exception-does-not-extend-here',
      kind: 'status',
      weight: 'informational',
      citationIds: ['us-sb-ina-212-a-9-b-iii', 'us-sb-fam-302-11-4'],
      label: {
        en: 'Under 18 — but the exceptions that reduce the (B) count do not reach this paragraph',
        es: 'Menor de 18 años — pero las excepciones que reducen el cómputo del (B) no alcanzan a este párrafo',
      },
      // Surfaced precisely because the intuition runs the other way: a reader
      // who has just been told that time under 18 does not count toward the
      // three- and ten-year bars will assume it does not count here either.
      evaluator: { op: 'lt', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'The exceptions in 8 U.S.C. 1182(a)(9)(B)(iii), including the exclusion of any period spent under ' +
          '18, apply to the three- and ten-year bars and not to the permanent bar. The only statutory waiver ' +
          'of the permanent bar, at 8 U.S.C. 1182(a)(9)(C)(iii), is for VAWA self-petitioners, which is ' +
          'outside the scope of this catalog. What clause (ii) offers instead is not a waiver: a person may ' +
          'seek admission more than ten years after their last departure, with the consent of the Secretary to ' +
          'reapply. Ten years outside the country is the relief.',
        es:
          'Las excepciones del 8 U.S.C. 1182(a)(9)(B)(iii), incluida la exclusión de cualquier periodo pasado ' +
          'siendo menor de 18 años, se aplican a las prohibiciones de tres y diez años y no a la prohibición ' +
          'permanente. La única dispensa legal de la prohibición permanente, la del 8 U.S.C. ' +
          '1182(a)(9)(C)(iii), es para autopeticionarios de la VAWA, materia ajena a este catálogo. Lo que ' +
          'ofrece el inciso (ii) no es una dispensa: la persona puede solicitar la admisión más de diez años ' +
          'después de su última salida, con el consentimiento de la Secretaría para volver a solicitar. Diez ' +
          'años fuera del país es el remedio.',
      },
    },
  ],
  durations: {
    citationIds: ['us-sb-ina-212-a-9-c'],
    note: {
      en:
        'The ten-year period in clause (ii) runs from the date of the applicant last departure from the United ' +
        'States, and consent of the Secretary to reapply is still required at the end of it. Meridian records ' +
        'no departure date and computes no end date. Nothing in this record is a finding that the paragraph ' +
        'does or does not apply.',
      es:
        'El plazo de diez años del inciso (ii) corre desde la fecha de la última salida de Estados Unidos de ' +
        'la persona, y al término de ese plazo sigue siendo necesario el consentimiento de la Secretaría para ' +
        'volver a solicitar. Meridian no registra fecha de salida y no calcula fecha final. Nada en este ' +
        'registro constituye una determinación de que el párrafo se aplique o no se aplique.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// The provisional unlawful presence waiver — 8 CFR 212.7(e)
// ---------------------------------------------------------------------------

export const usProvisionalWaiverUnlawfulPresence: Pathway = {
  id: 'us-provisional-waiver-unlawful-presence',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'Provisional unlawful presence waiver, applied for before departing (Form I-601A)',
    es: 'Dispensa provisional por presencia ilegal, solicitada antes de salir del país (Formulario I-601A)',
  },
  summary: {
    en:
      'The waiver at 8 U.S.C. 1182(a)(9)(B)(v), obtained while still inside the United States so that a person ' +
      'knows the answer before they leave for the immigrant visa interview. It exists precisely because ' +
      'consular processing requires a departure that fires the bars, and it succeeds only partially: it ' +
      'reaches the unlawful presence bars and nothing else, it does not take effect until the applicant has ' +
      'departed and been interviewed, and the grant is expressly discretionary.',
    es:
      'La dispensa del 8 U.S.C. 1182(a)(9)(B)(v), obtenida estando todavía dentro de Estados Unidos para que ' +
      'la persona conozca la respuesta antes de salir a la entrevista de visa de inmigrante. Existe ' +
      'precisamente porque el trámite consular exige una salida que activa las prohibiciones, y solo resuelve ' +
      'el problema en parte: alcanza a las prohibiciones por presencia ilegal y a nada más, no surte efecto ' +
      'hasta que la persona ha salido y ha sido entrevistada, y la concesión es expresamente discrecional.',
  },
  citations: [cfr212_7e, ina212a9bv, ina212a9bi, ina212a9c, ina212a9a],
  criteria: [
    {
      id: 'us-i601a-at-least-seventeen',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-sb-cfr-8-212-7-e'],
      label: {
        en: 'At least 17 years of age',
        es: 'Al menos 17 años de edad',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 17 },
      guidance: {
        en:
          'Seventeen, not eighteen. It is one of the few bright lines in this record, and it exists because ' +
          'unlawful presence does not begin to accrue until 18, so a person can be within months of the ' +
          '180-day threshold at 17 and a half.',
        es:
          'Diecisiete, no dieciocho. Es una de las pocas líneas nítidas de este registro, y existe porque la ' +
          'presencia ilegal no empieza a acumularse hasta los 18 años, de modo que a los diecisiete y medio se ' +
          'puede estar a pocos meses del umbral de 180 días.',
      },
    },
    {
      id: 'us-i601a-qualifying-relative',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-sb-ina-212-a-9-b-v', 'us-sb-cfr-8-212-7-e'],
      label: {
        en: 'A qualifying relative who would suffer extreme hardship — a citizen or resident spouse or parent',
        es: 'Un familiar cualificado que sufriría perjuicio extremo — cónyuge o progenitor ciudadano o residente',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no family relationships and no relative statuses, so this cannot be tested — and ' +
          'it is the requirement most often misunderstood in this corridor. Two separate tests must both be ' +
          'satisfied. The APPLICANT must be the spouse, son or daughter of a United States citizen or lawful ' +
          'permanent resident. The EXTREME HARDSHIP must be to a citizen or lawful permanent resident SPOUSE ' +
          'OR PARENT of the applicant. A United States citizen child does not make anyone eligible for this ' +
          'waiver, however severe the consequences for that child would be. Hardship to the applicant ' +
          'themselves is not the test either. Establish the relationships and the relatives statuses from ' +
          'documents before any filing fee is paid.',
        es:
          'Meridian no registra vínculos familiares ni el estatus de los familiares, de modo que esto no puede ' +
          'comprobarse — y es el requisito peor entendido en este corredor. Deben cumplirse dos pruebas ' +
          'distintas. La PERSONA SOLICITANTE debe ser cónyuge, hijo o hija de una persona ciudadana ' +
          'estadounidense o residente permanente legal. El PERJUICIO EXTREMO debe recaer sobre un CÓNYUGE O ' +
          'PROGENITOR de la persona solicitante que sea ciudadano o residente permanente legal. Un hijo o hija ' +
          'ciudadano estadounidense no da acceso a esta dispensa, por graves que fueran las consecuencias para ' +
          'ese menor. El perjuicio para la propia persona solicitante tampoco es la prueba. Acredite ' +
          'documentalmente los vínculos y el estatus de los familiares antes de pagar ninguna tasa.',
      },
      guidance: {
        en:
          'The statute gives the Attorney General "sole discretion" over the waiver and states that no court ' +
          'has jurisdiction to review the decision. Satisfying the relationship does not produce a waiver, and ' +
          'no engine can weigh whether hardship is extreme.',
        es:
          'La ley atribuye al Fiscal General la «discreción exclusiva» sobre la dispensa y dispone que ningún ' +
          'tribunal tiene competencia para revisar la decisión. Cumplir el vínculo no produce la dispensa, y ' +
          'ningún motor puede valorar si un perjuicio es extremo.',
      },
    },
    {
      id: 'us-i601a-pending-immigrant-visa-case',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-sb-cfr-8-212-7-e'],
      label: {
        en: 'Present in the United States, with an approved petition and a paid immigrant visa case pending',
        es: 'Presente en Estados Unidos, con petición aprobada y expediente de visa de inmigrante pagado y en trámite',
      },
      evaluator: NOT_MODELLED,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no petition, no Department of State case and no fee payment, and holds no fact ' +
          'establishing physical presence in the United States on a given day. The regulation requires the ' +
          'applicant to be present at filing and to appear for biometrics, to be the beneficiary of an ' +
          'approved immigrant visa petition or a diversity selection, to have a case pending at the Department ' +
          'of State for which the processing fee has been paid, and to intend to depart in order to obtain the ' +
          'immigrant visa. A fiancé or fiancée beneficiary is not eligible.',
        es:
          'Meridian no registra petición, ni expediente ante el Departamento de Estado, ni pago de tasa, y no ' +
          'dispone de ningún dato que acredite la presencia física en Estados Unidos en una fecha dada. La ' +
          'norma exige que la persona esté presente al presentar la solicitud y comparezca para la toma de ' +
          'datos biométricos, que sea beneficiaria de una petición de visa de inmigrante aprobada o de una ' +
          'selección de diversidad, que tenga un expediente en trámite ante el Departamento de Estado con la ' +
          'tasa de tramitación pagada, y que tenga intención de salir del país para obtener la visa de ' +
          'inmigrante. La persona beneficiaria como prometida no es elegible.',
      },
    },
    {
      id: 'us-i601a-inadmissible-only-on-unlawful-presence',
      kind: 'status',
      weight: 'material',
      citationIds: [
        'us-sb-cfr-8-212-7-e',
        'us-sb-ina-212-a-9-b-i',
        'us-sb-ina-212-a-9-c',
        'us-sb-ina-212-a-9-a',
      ],
      label: {
        en: 'Inadmissible only under the unlawful presence bars, and on no other ground',
        es: 'Inadmisible únicamente por las prohibiciones de presencia ilegal y por ninguna otra causal',
      },
      evaluator: {
        op: 'all_of',
        of: [NO_PRIOR_REMOVAL, { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' }],
      },
      humanReviewWhen: {
        op: 'any_of',
        of: [HAS_PRIOR_REMOVAL, { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' }],
      },
      humanReviewReason: {
        en:
          'This waiver reaches 8 U.S.C. 1182(a)(9)(B)(i) and nothing else. A removal on record engages ' +
          '8 U.S.C. 1182(a)(9)(A) and may engage the permanent bar in 8 U.S.C. 1182(a)(9)(C), neither of which ' +
          'this waiver touches, and a final or reinstated removal order is an express disqualification under ' +
          'the regulation. A declared criminal record has to be measured against 8 U.S.C. 1182(a)(2). The ' +
          'consequence of getting this wrong is not a refusal at the counter: an approved provisional waiver ' +
          'ceases to be valid if the consular officer identifies any other ground, and by then the applicant ' +
          'has already departed.',
        es:
          'Esta dispensa alcanza al 8 U.S.C. 1182(a)(9)(B)(i) y a nada más. Una expulsión registrada activa el ' +
          '8 U.S.C. 1182(a)(9)(A) y puede activar la prohibición permanente del 8 U.S.C. 1182(a)(9)(C), y esta ' +
          'dispensa no toca ninguna de las dos; además, una orden de expulsión firme o reinstaurada es causa ' +
          'expresa de exclusión conforme a la norma. Unos antecedentes penales declarados deben contrastarse ' +
          'con el 8 U.S.C. 1182(a)(2). Equivocarse aquí no se traduce en una denegación en ventanilla: una ' +
          'dispensa provisional aprobada deja de ser válida si el funcionario consular identifica cualquier ' +
          'otra causal, y para entonces la persona ya ha salido del país.',
      },
      guidance: {
        en:
          'The regulation also disqualifies an applicant who is in removal proceedings in which no final order ' +
          'has been entered, unless those proceedings are administratively closed, and an applicant with an ' +
          'application for lawful permanent resident status pending with USCIS.',
        es:
          'La norma excluye asimismo a quien esté en un procedimiento de expulsión en el que no se haya ' +
          'dictado resolución firme, salvo que ese procedimiento esté administrativamente cerrado, y a quien ' +
          'tenga pendiente ante USCIS una solicitud de residencia permanente legal.',
      },
    },
  ],
  durations: {
    citationIds: ['us-sb-cfr-8-212-7-e', 'us-sb-ina-212-a-9-b-v'],
    note: {
      en:
        'An approved provisional waiver does not take effect unless and until the applicant departs the United ' +
        'States, appears at the immigrant visa interview and is found otherwise eligible, and it is ' +
        'automatically revoked in defined circumstances, including a re-entry without inspection after filing. ' +
        'Approval is therefore not permission to travel safely, and it is not a visa. The grant itself is ' +
        'within the sole discretion of the Attorney General and no court may review it.',
      es:
        'Una dispensa provisional aprobada no surte efecto hasta que la persona sale de Estados Unidos, ' +
        'comparece en la entrevista de visa de inmigrante y es considerada elegible por lo demás, y se revoca ' +
        'automáticamente en supuestos definidos, entre ellos una reentrada sin inspección posterior a la ' +
        'presentación. La aprobación no es, por tanto, permiso para viajar sin riesgo, ni es una visa. La ' +
        'concesión queda en la discreción exclusiva del Fiscal General y ningún tribunal puede revisarla.',
    },
  },
  leadsTo: ['us-consular-processing-immigrant-visa'],
  reviewStatus: 'unreviewed',
};

/**
 * The shipped set for this module, in the order it was written: the two routes
 * to permanent residence, the two naturalisation regimes they feed, then the
 * three § 1182(a)(9) records. The order carries no claim about merit or
 * priority — see the note in `catalog/index.ts`.
 */
export const US_STATUS_AND_BARS_PATHWAYS: readonly Pathway[] = [
  usAdjustmentOfStatus,
  usConsularProcessingImmigrantVisa,
  usNaturalizationFiveYear,
  usNaturalizationSpouseThreeYear,
  usUnlawfulPresenceBarScreening,
  usPermanentBarScreening,
  usProvisionalWaiverUnlawfulPresence,
];
