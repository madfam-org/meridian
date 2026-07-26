/**
 * The United States — the five employment-based immigrant preferences.
 *
 * Ten records: the three first-preference sub-categories, second preference in
 * its two forms (with a labor certification, and with the national interest
 * waiver that removes it), the three third-preference sub-categories, fourth
 * preference through its religious-worker sub-class, and fifth preference.
 *
 * ## The structural fact that organises this whole file
 *
 * 8 U.S.C. § 1182(a)(5)(A) makes an alien seeking to enter to perform skilled
 * or unskilled labor inadmissible unless the **Secretary of Labor** has first
 * certified two things: that there are not sufficient United States workers
 * able, willing, qualified and available at the time and place of the work, and
 * that employing the alien will not adversely affect the wages and working
 * conditions of United States workers similarly employed. That certification —
 * the process 20 CFR part 656 calls a permanent labor certification, and which
 * practitioners call PERM — is a separate agency, a separate application and a
 * separate timeline before the immigration petition can even be filed.
 *
 * **The first preference is outside it entirely, and so is the national
 * interest waiver.** 8 CFR 204.5(h)(5) says in terms that neither an offer of
 * employment nor a labor certification is required for extraordinary ability;
 * 204.5(i)(3)(iv) and 204.5(j)(5) each say a labor certification is not
 * required for outstanding professors and researchers or for multinational
 * managers and executives, though both of those still need a job offer; and
 * § 1153(b)(2)(B)(i) lets the waiver remove the job-offer requirement, and with
 * it the certification, when the Attorney General deems it to be in the
 * national interest. Second and third preference otherwise require it, and
 * § 1153(b)(3)(C) states the consequence for third preference bluntly: no
 * immigrant visa may issue until the consular officer has the Secretary of
 * Labor’s determination. That bypass is the single most consequential
 * difference between these routes, so every record here says which side of it
 * the route sits on.
 *
 * ## What is deliberately not here
 *
 * **No priority date, no cut-off date, no waiting time, and no queue
 * position.** Each of these preferences is numerically limited — 8 U.S.C.
 * § 1151(d) sets the worldwide level and § 1152(a)(2) caps any single foreign
 * state at 7 percent of it — and the Department of State publishes the
 * resulting cut-offs monthly in the Visa Bulletin, where they move and
 * sometimes retrogress. A figure written into a catalog that ships quarterly
 * would be read by an applicant as a target and would be wrong. Each record
 * states the *existence and structure* of the limit in `durations.note`, cites
 * the statute, and stops there.
 *
 * **No count of how many regulatory criteria somebody meets.** Extraordinary
 * ability, international recognition as outstanding, exceptional ability and
 * the national interest are all adjudicator judgements sitting on top of lists
 * of evidence. USCIS applies a two-step review to the first three: whether the
 * evidence objectively meets the listed criteria, and then a separate final
 * merits determination on whether the person actually is what the classification
 * describes. A checklist therefore does not produce an outcome, and every
 * criterion in this file that touches one of those standards escalates to a
 * person instead of returning a verdict.
 *
 * **No estimate of anybody’s chances.** That is a prediction of outcome, it is
 * banned repository-wide, and for a discretionary waiver it would be fabricated.
 *
 * ## Facts this file wanted and `ApplicantFacts` does not model
 *
 * Recorded here rather than added, because `facts.ts` is shared: the manner of
 * last entry; whether a labor certification has been filed, certified or has
 * expired, and its filing date, which is the priority date under 8 CFR
 * 204.5(d); whether an I-140 has been approved; the ten and six evidentiary
 * criteria as counted categories; the field of endeavour as an enumerated
 * value; whether an investment sits in a targeted employment area; and the
 * number of qualifying employees an investment has created. Criteria that would
 * need one of these either escalate to human review or are written against the
 * closest fact that *is* modelled, with the gap stated in the criterion’s own
 * guidance.
 *
 * Every record ships `reviewStatus: 'unreviewed'`. Nothing here has been read by
 * a licensed representative, and until one has, none of it may enter an
 * advice-class recommendation.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import { EDUCATION_SCALE } from '../facts.js';
import type { EvaluatorSpec, Pathway } from '../schema.js';

const US: CountryCode = countryCode('US');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-26');

// ---------------------------------------------------------------------------
// Sources. Every URL here was fetched during this sweep.
//
// travel.state.gov refused every request during this sweep behind a
// bot-protection layer, so the Visa Bulletin citation below carries no url
// rather than a guessed one.
// ---------------------------------------------------------------------------

const USC_1101_URL = 'https://www.law.cornell.edu/uscode/text/8/1101';
const USC_1151_URL = 'https://www.law.cornell.edu/uscode/text/8/1151';
const USC_1152_URL = 'https://www.law.cornell.edu/uscode/text/8/1152';
const USC_1153_URL = 'https://www.law.cornell.edu/uscode/text/8/1153';
const USC_1154_URL = 'https://www.law.cornell.edu/uscode/text/8/1154';
const USC_1182_URL = 'https://www.law.cornell.edu/uscode/text/8/1182';
const USC_1186B_URL = 'https://www.law.cornell.edu/uscode/text/8/1186b';

const CFR_204_5_URL = 'https://www.law.cornell.edu/cfr/text/8/204.5';
const CFR_204_6_URL = 'https://www.law.cornell.edu/cfr/text/8/204.6';
const CFR_656_1_URL = 'https://www.law.cornell.edu/cfr/text/20/656.1';
const CFR_656_5_URL = 'https://www.law.cornell.edu/cfr/text/20/656.5';
const CFR_656_15_URL = 'https://www.law.cornell.edu/cfr/text/20/656.15';
const CFR_656_17_URL = 'https://www.law.cornell.edu/cfr/text/20/656.17';
const CFR_656_30_URL = 'https://www.law.cornell.edu/cfr/text/20/656.30';

const PM_F2_URL = 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-2';
const PM_F3_URL = 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-3';
const PM_F4_URL = 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-4';
const PM_F5_URL = 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-5';
const PM_G2_URL = 'https://www.uscis.gov/policy-manual/volume-6-part-g-chapter-2';

const DHANASAR_URL = 'https://www.justice.gov/eoir/page/file/920996/dl';
const FAM_503_1_URL = 'https://fam.state.gov/fam/09FAM/09FAM050301.html';

// ---------------------------------------------------------------------------
// Citations shared by every employment-based record
// ---------------------------------------------------------------------------

const inaS203b = {
  id: 'us-eb-ina-203-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b) (INA § 203(b))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Aliens subject to the worldwide level specified in section 1151(d) for employment-based immigrants in a ' +
    'fiscal year shall be allotted visas as follows. Five preferences: priority workers, members of the ' +
    'professions holding advanced degrees or aliens of exceptional ability, and skilled workers, professionals ' +
    'and other workers take not more than 28.6 percent of the worldwide level each; certain special immigrants ' +
    'and employment creation take not more than 7.1 percent each. Unused numbers cascade between the ' +
    'preferences on the terms stated in each paragraph.',
};

const inaS201d = {
  id: 'us-eb-ina-201-d',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1151(d) (INA § 201(d))',
  url: USC_1151_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The worldwide level of employment-based immigrants for a fiscal year is 140,000 plus the number computed ' +
    'under paragraph (2), which carries forward family-sponsored numbers unused in the previous year. The ' +
    'employment-based preferences are therefore numerically limited, and the limit is not a fixed figure.',
};

const inaS202a2 = {
  id: 'us-eb-ina-202-a-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1152(a)(2) (INA § 202(a)(2))',
  url: USC_1152_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The total number of immigrant visas made available to natives of any single foreign state under sections ' +
    '1153(a) and 1153(b) in any fiscal year may not exceed 7 percent of the total made available under those ' +
    'subsections, and 2 percent in the case of a dependent area.',
};

const inaS203e1 = {
  id: 'us-eb-ina-203-e-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(e)(1) (INA § 203(e)(1))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Immigrant visas made available under subsection (a) or (b) shall be issued to eligible immigrants in the ' +
    'order in which a petition on behalf of each such immigrant is filed. That filing order is what the ' +
    'priority date records, and it is the reason a numerically limited category forms a queue.',
};

const cfr2045d = {
  id: 'us-eb-cfr-204-5-d',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(d)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Where the petition is accompanied by an individual labor certification, the priority date is the date the ' +
    'labor certification application was accepted for processing by any office of the Department of Labor. Where ' +
    'the classification requires no labor certification, or where the petition is accompanied by an application ' +
    'for Schedule A designation, the priority date is the date the completed, signed petition was properly filed ' +
    'with USCIS. Read with 8 CFR 204.5(e), an approved petition under section 203(b)(1), (2) or (3) carries its ' +
    'priority date to a later petition under any of those paragraphs, and the earliest date applies.',
};

const famNumericalLimits = {
  id: 'us-eb-fam-503-1-2',
  kind: 'official_guidance' as const,
  instrument: 'Foreign Affairs Manual, volume 9',
  provision: '9 FAM 503.1-2(A) and 9 FAM 503.1-2(D)',
  url: FAM_503_1_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'CT:VISA-1713, 03-01-2023 for 503.1-2(A); CT:VISA-1397, 10-19-2021 for 503.1-2(D). Preference ' +
    'classifications in which demand exceeds the numerical limits are said to be oversubscribed, and applicants ' +
    'compete first-come first-served for available numbers. Besides the limits for each preference there are ' +
    'limits on the number of immigrants from any single country: no more than 7 percent of the total ' +
    'numerically limited immigrants may be from one country, and countries in which demand exceeds that ' +
    'per-country limit are deemed oversubscribed, whose natives may face a longer wait than applicants from ' +
    'other countries. Chargeability is generally to the numerical limitation applicable to the applicant’s ' +
    'PLACE OF BIRTH, not to nationality or residence, with exceptions at 9 FAM 503.2-4. Meridian records no ' +
    'country of birth, so it makes no chargeability finding.',
};

const visaBulletin = {
  id: 'us-eb-visa-bulletin',
  kind: 'official_guidance' as const,
  instrument: 'U.S. Department of State, Visa Bulletin',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MONTHLY ADMINISTRATIVE PUBLICATION, AND NO FIGURE FROM IT IS RECORDED ANYWHERE IN THIS CATALOG. The ' +
    'Department publishes final action dates and dates for filing each month; they move, and the bulletin warns ' +
    'that a date may retrogress. The Department currently names China (mainland-born), India, Mexico and the ' +
    'Philippines as oversubscribed chargeability areas and gives each its own column, with all other areas ' +
    'shown under a single worldwide column. NO URL IS GIVEN because travel.state.gov refused every automated ' +
    'request during this sweep; that structural statement was taken from the research brief at ' +
    'docs/research/2026-07-26-us-immigration-frame.md, which verified it from Internet Archive snapshots of the ' +
    'Department’s own pages dated 13 and 14 July 2026. The current bulletin must be opened by hand before ' +
    'anything is relied on.',
};

// ---------------------------------------------------------------------------
// The labor certification, and who is outside it
// ---------------------------------------------------------------------------

const inaS212a5A = {
  id: 'us-eb-ina-212-a-5-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1182(a)(5)(A) (INA § 212(a)(5)(A))',
  url: USC_1182_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any alien who seeks to enter the United States for the purpose of performing skilled or unskilled labor is ' +
    'inadmissible unless the Secretary of Labor has determined and certified to the Secretary of State and the ' +
    'Attorney General that there are not sufficient workers who are able, willing, qualified and available at ' +
    'the time of application for a visa and admission and at the place where the alien is to perform the labor, ' +
    'and that the employment of the alien will not adversely affect the wages and working conditions of workers ' +
    'in the United States similarly employed. Clause (ii) substitutes "equally qualified" for "qualified" for a ' +
    'member of the teaching profession or an alien of exceptional ability in the sciences or the arts.',
};

const inaS203b3C = {
  id: 'us-eb-ina-203-b-3-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(3)(C) (INA § 203(b)(3)(C))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An immigrant visa may not be issued to an immigrant under subparagraph (A) until the consular officer is in ' +
    'receipt of a determination made by the Secretary of Labor pursuant to section 1182(a)(5)(A). The labor ' +
    'certification is therefore a precondition of issuance for every third-preference sub-category, not merely ' +
    'of the petition.',
};

const cfr6561 = {
  id: 'us-eb-cfr-656-1',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 20',
  provision: '20 CFR 656.1(a)',
  url: CFR_656_1_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Part 656 sets out the procedures through which permanent labor certifications may be applied for, and ' +
    'granted or denied, under section 212(a)(5)(A) of the Act. The two findings the Secretary must make are ' +
    'restated verbatim at 656.1(a)(1) and (2).',
};

const cfr65617 = {
  id: 'us-eb-cfr-656-17',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 20',
  provision: '20 CFR 656.17',
  url: CFR_656_17_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The basic labor certification process. The employer files ETA Form 9089, and applications are screened and ' +
    'certified, denied, or selected for audit. For a professional occupation the employer must attest to ' +
    'recruitment conducted within the six months before filing: a mandatory 30-day job order with the State ' +
    'Workforce Agency and two Sunday newspaper advertisements, both conducted at least 30 and no more than 180 ' +
    'days before filing, plus three additional steps from a listed menu. Under 656.17(h) the job requirements ' +
    'must be those normally required for the occupation unless business necessity is documented, and a foreign ' +
    'language requirement needs business necessity. Under 656.17(i) the requirements must be the employer’s ' +
    'actual minimum requirements. Under 656.17(l), where the alien has an ownership interest, is related to the ' +
    'owners, or is one of a small number of employees, the employer must be able to demonstrate on audit that a ' +
    'bona fide job opportunity exists that is available to all United States workers.',
};

const cfr6565 = {
  id: 'us-eb-cfr-656-5',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 20',
  provision: '20 CFR 656.5 and 20 CFR 656.15',
  url: CFR_656_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Schedule A lists occupations for which the Department has already determined that there are not sufficient ' +
    'United States workers and that wages and working conditions will not be adversely affected. Group I is ' +
    'physical therapists and professional nurses on the stated qualifying conditions; Group II is aliens of ' +
    'exceptional ability in the sciences or arts, including college and university teachers, and separately ' +
    'aliens of exceptional ability in the performing arts. A Schedule A application is filed with DHS rather ' +
    'than with a Department of Labor processing centre (20 CFR 656.15(a)), and the DHS determination is ' +
    'conclusive and final with no appeal under 656.26. The full Schedule A url is ' +
    CFR_656_15_URL +
    ' for the application procedure.',
};

const cfr65630 = {
  id: 'us-eb-cfr-656-30',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 20',
  provision: '20 CFR 656.30(a) and (b)',
  url: CFR_656_30_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The filing date of an approved labor certification may be used as a priority date. An approved permanent ' +
    'labor certification granted on or after 16 July 2007 expires if it is not filed in support of a Form I-140 ' +
    'petition with DHS within 180 calendar days of the date the Department of Labor granted it. A certification ' +
    'is valid only for the particular job opportunity, the named alien, and the area of intended employment.',
};

const inaS204a1E = {
  id: 'us-eb-ina-204-a-1-e',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(a)(1)(E) (INA § 204(a)(1)(E))',
  url: USC_1154_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any alien desiring to be classified under section 1153(b)(1)(A), or any person on behalf of such an alien, ' +
    'may file a petition for such classification. This is the statutory basis for the extraordinary ability ' +
    'self-petition: no employer need be involved at any point.',
};

const inaS204a1F = {
  id: 'us-eb-ina-204-a-1-f',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(a)(1)(F) (INA § 204(a)(1)(F))',
  url: USC_1154_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any employer desiring and intending to employ within the United States an alien entitled to classification ' +
    'under section 1153(b)(1)(B), 1153(b)(1)(C), 1153(b)(2) or 1153(b)(3) may file a petition for such ' +
    'classification. Read with 8 CFR 204.5(a) and (c), the petition is Form I-140 and the petitioner is the ' +
    'employer, except in the extraordinary ability and national interest waiver cases.',
};

// ---------------------------------------------------------------------------
// First preference
// ---------------------------------------------------------------------------

const inaS203b1A = {
  id: 'us-eb-ina-203-b-1-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(1)(A) (INA § 203(b)(1)(A))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Three elements, all required: the alien has extraordinary ability in the sciences, arts, education, ' +
    'business or athletics which has been demonstrated by sustained national or international acclaim and whose ' +
    'achievements have been recognized in the field through extensive documentation; the alien seeks to enter ' +
    'the United States to continue work in the area of extraordinary ability; and the alien’s entry will ' +
    'substantially benefit prospectively the United States. The statute names no employer and no labor ' +
    'certification.',
};

const cfr2045h2 = {
  id: 'us-eb-cfr-204-5-h-2',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(h)(2)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Extraordinary ability means a level of expertise indicating that the individual is one of that small ' +
    'percentage who have risen to the very top of the field of endeavor. That is a qualitative judgement made ' +
    'by an adjudicator on the whole record, not a threshold that can be measured.',
};

const cfr2045h3 = {
  id: 'us-eb-cfr-204-5-h-3',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(h)(3) and (h)(4)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The petition must be accompanied by evidence of a one-time achievement, that is a major internationally ' +
    'recognized award, or at least three of ten listed kinds of evidence: lesser nationally or internationally ' +
    'recognized prizes or awards; membership in associations requiring outstanding achievements of their ' +
    'members as judged by recognized national or international experts; published material about the alien in ' +
    'professional or major trade publications or other major media; participation as a judge of the work of ' +
    'others in the same or an allied field; original scientific, scholarly, artistic, athletic or ' +
    'business-related contributions of major significance; authorship of scholarly articles; display of the ' +
    'alien’s work at artistic exhibitions or showcases; performance in a leading or critical role for ' +
    'organizations with a distinguished reputation; a high salary or other significantly high remuneration ' +
    'relative to others in the field; and commercial success in the performing arts. Under (h)(4), where those ' +
    'standards do not readily apply to the occupation, comparable evidence may be submitted.',
};

const cfr2045h5 = {
  id: 'us-eb-cfr-204-5-h-5',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(h)(5)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Neither an offer for employment in the United States nor a labor certification is required for this ' +
    'classification; however, the petition must be accompanied by clear evidence that the alien is coming to ' +
    'the United States to continue work in the area of expertise. That evidence may include letters from ' +
    'prospective employers, evidence of prearranged commitments such as contracts, or a statement from the ' +
    'beneficiary detailing plans for continuing the work.',
};

const uscisPmF2 = {
  id: 'us-eb-uscis-pm-6-f-2',
  kind: 'official_guidance' as const,
  instrument: 'USCIS Policy Manual',
  provision: '6 USCIS-PM F.2',
  url: PM_F2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED ADJUDICATION GUIDANCE, NOT REGULATION, AND AMENDED BY POLICY ALERT. Officers apply a two-step ' +
    'analysis. Step one asks only whether the evidence objectively meets the regulatory criteria, which means a ' +
    'one-time achievement or at least three of the ten criteria or evidence comparable to three of them. Step ' +
    'two is a separate final merits determination in which all the evidence is weighed together to decide ' +
    'whether the beneficiary is one of that small percentage who have risen to the very top of the field. ' +
    'Meeting three criteria therefore does not establish the classification. Acclaim must be sustained, which ' +
    'the guidance describes as maintained rather than as any fixed period, and imposes no age limit. The ' +
    'guidance was last amended by the Extraordinary Ability Criteria Clarification policy alert of 2 October ' +
    '2024 and by a technical update of 26 February 2025.',
};

const inaS203b1B = {
  id: 'us-eb-ina-203-b-1-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(1)(B) (INA § 203(b)(1)(B))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The alien is recognized internationally as outstanding in a specific academic area; has at least 3 years of ' +
    'experience in teaching or research in the academic area; and seeks to enter the United States for a ' +
    'tenured or tenure-track position at a university or institution of higher education to teach, for a ' +
    'comparable position to conduct research, or for a comparable research position with a department, division ' +
    'or institute of a private employer that employs at least 3 persons full-time in research activities and ' +
    'has achieved documented accomplishments in an academic field.',
};

const cfr2045i3 = {
  id: 'us-eb-cfr-204-5-i-3',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(i)(3)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Initial evidence is in four parts. Evidence of international recognition as outstanding, consisting of at ' +
    'least two of six kinds: major prizes or awards for outstanding achievement in the academic field; ' +
    'membership in associations requiring outstanding achievements of their members; published material in ' +
    'professional publications written by others about the alien’s work; participation as a judge of the work ' +
    'of others in the same or an allied academic field; original scientific or scholarly research ' +
    'contributions; and authorship of scholarly books or articles in journals with international circulation. ' +
    'Comparable evidence is allowed where those standards do not readily apply. At least three years of ' +
    'experience in teaching or research in the academic field, where experience gained while working on an ' +
    'advanced degree counts only if the degree was acquired and either the teaching carried full responsibility ' +
    'for the class or the research has been recognized within the field as outstanding. And an offer of ' +
    'employment from a prospective United States employer in one of the three forms the paragraph lists. A ' +
    'labor certification is not required for this classification.',
};

const uscisPmF3 = {
  id: 'us-eb-uscis-pm-6-f-3',
  kind: 'official_guidance' as const,
  instrument: 'USCIS Policy Manual',
  provision: '6 USCIS-PM F.3',
  url: PM_F3_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED ADJUDICATION GUIDANCE, NOT REGULATION. The same two-step analysis applies: step one asks whether ' +
    'the evidence objectively meets at least two of the six regulatory criteria, and step two is a separate ' +
    'final merits determination on the whole record. The academic field may be defined narrowly, so particle ' +
    'physics rather than physics in general is acceptable provided it is a body of specialized knowledge ' +
    'offered for study at an accredited United States university or institution of higher education.',
};

const inaS203b1C = {
  id: 'us-eb-ina-203-b-1-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(1)(C) (INA § 203(b)(1)(C))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The alien, in the 3 years preceding the time of application for classification and admission, has been ' +
    'employed for at least 1 year by a firm or corporation or other legal entity or an affiliate or subsidiary ' +
    'thereof, and seeks to enter the United States in order to continue to render services to the same employer ' +
    'or to a subsidiary or affiliate thereof in a capacity that is managerial or executive.',
};

const cfr2045j = {
  id: 'us-eb-cfr-204-5-j',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(j)(2), (j)(3) and (j)(5)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DEFINITIONS THAT DESCRIBE THE CHARACTER OF A JOB, WHICH AN ADJUDICATOR CHARACTERISES. Managerial capacity ' +
    'means an assignment in which the employee primarily manages the organization or a department, subdivision, ' +
    'function or component; supervises and controls the work of other supervisory, professional or managerial ' +
    'employees or manages an essential function; has authority to hire and fire or, if no other employee is ' +
    'directly supervised, functions at a senior level within the hierarchy or with respect to the function ' +
    'managed; and exercises direction over day-to-day operations. Executive capacity means an assignment in ' +
    'which the employee primarily directs the management of the organization or a major component or function, ' +
    'establishes goals and policies, exercises wide latitude in discretionary decisionmaking, and receives only ' +
    'general supervision. A first-line supervisor is not managerial merely by virtue of supervisory duties ' +
    'unless the employees supervised are professional, and staffing levels alone are not determinative. Initial ' +
    'evidence must show the qualifying year abroad, that the United States employer is the same entity or a ' +
    'subsidiary or affiliate, and that it has been doing business for at least one year. No labor certification ' +
    'is required, but the prospective United States employer must furnish a job offer in the form of a ' +
    'statement clearly describing the duties to be performed.',
};

const uscisPmF4 = {
  id: 'us-eb-uscis-pm-6-f-4',
  kind: 'official_guidance' as const,
  instrument: 'USCIS Policy Manual',
  provision: '6 USCIS-PM F.4',
  url: PM_F4_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED ADJUDICATION GUIDANCE, NOT REGULATION. A permanent labor certification is not required. The ' +
    'petitioning United States employer must have been doing business in the United States for at least one ' +
    'year before filing. ALIENS SEEKING TO ENTER THE UNITED STATES TO OPEN A NEW OFFICE ARE NOT ELIGIBLE for ' +
    'this immigrant classification, which is where it parts company with the L-1A nonimmigrant classification ' +
    'it otherwise resembles: the executive or manager must be coming to an existing business.',
};

// ---------------------------------------------------------------------------
// Second preference
// ---------------------------------------------------------------------------

const inaS203b2A = {
  id: 'us-eb-ina-203-b-2-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(2)(A) (INA § 203(b)(2)(A))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Visas are made available to qualified immigrants who are members of the professions holding advanced ' +
    'degrees or their equivalent, or who because of their exceptional ability in the sciences, arts or business ' +
    'will substantially benefit prospectively the national economy, cultural or educational interests or ' +
    'welfare of the United States, AND whose services in the sciences, arts, professions or business are sought ' +
    'by an employer in the United States. The employer requirement is part of the classification itself, which ' +
    'is why removing it takes a statutory waiver rather than an exemption.',
};

const inaS203b2C = {
  id: 'us-eb-ina-203-b-2-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(2)(C) (INA § 203(b)(2)(C))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'In determining whether an immigrant has exceptional ability, the possession of a degree, diploma, ' +
    'certificate or similar award from a college, university, school or other institution of learning, or a ' +
    'license to practice or certification for a particular profession or occupation, shall not by itself be ' +
    'considered sufficient evidence of such exceptional ability.',
};

const cfr2045k2AdvancedDegree = {
  id: 'us-eb-cfr-204-5-k-2-advanced-degree',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(k)(2), definitions of advanced degree and profession',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Advanced degree means any United States academic or professional degree, or a foreign equivalent degree, ' +
    'above that of baccalaureate. A United States baccalaureate degree or foreign equivalent followed by at ' +
    'least five years of progressive experience in the specialty shall be considered the equivalent of a ' +
    'master’s degree. If a doctoral degree is customarily required by the specialty, the alien must have a ' +
    'United States doctorate or foreign equivalent. Profession means one of the occupations listed in section ' +
    '101(a)(32) of the Act as well as any occupation for which a United States baccalaureate degree or its ' +
    'foreign equivalent is the minimum requirement for entry into the occupation.',
};

const cfr2045k2ExceptionalAbility = {
  id: 'us-eb-cfr-204-5-k-2-exceptional-ability',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(k)(2), definition of exceptional ability',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Exceptional ability in the sciences, arts or business means a degree of expertise significantly above that ' +
    'ordinarily encountered in the sciences, arts or business. The comparison is with the ordinary practitioner ' +
    'in the field and is made by an adjudicator on the whole record.',
};

const cfr2045k3 = {
  id: 'us-eb-cfr-204-5-k-3',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(k)(3)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'To show an advanced degree the petition must carry an official academic record of a United States advanced ' +
    'degree or foreign equivalent, or an official academic record of a baccalaureate or foreign equivalent ' +
    'together with letters from current or former employers showing at least five years of progressive ' +
    'post-baccalaureate experience in the specialty. To show exceptional ability the petition must carry at ' +
    'least three of six kinds of evidence: an academic record of a degree, diploma, certificate or similar ' +
    'award relating to the area of exceptional ability; letters from current or former employers showing at ' +
    'least ten years of full-time experience in the occupation; a license to practise the profession or ' +
    'certification for the occupation; evidence of a salary or other remuneration demonstrating exceptional ' +
    'ability; membership in professional associations; and recognition for achievements and significant ' +
    'contributions to the industry or field by peers, governmental entities, or professional or business ' +
    'organizations. Comparable evidence is allowed where those standards do not readily apply.',
};

const cfr2045k4i = {
  id: 'us-eb-cfr-204-5-k-4-i',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(k)(4)(i)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Every petition under this classification must be accompanied by an individual labor certification from the ' +
    'Department of Labor, by an application for Schedule A designation if applicable, or by documentation ' +
    'establishing that the alien qualifies for a shortage occupation in the Department of Labor’s Labor Market ' +
    'Information Pilot Program. The job offer portion must demonstrate that the job requires a professional ' +
    'holding an advanced degree or the equivalent, or an alien of exceptional ability.',
};

const cfr2045k4ii = {
  id: 'us-eb-cfr-204-5-k-4-ii',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(k)(4)(ii) and 8 CFR 204.5(k)(1)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The director MAY exempt the requirement of a job offer, and thus of a labor certification, if exemption ' +
    'would be in the national interest, and the applicant must submit the statement of qualifications of the ' +
    'alien together with evidence supporting the claim. Under (k)(1) the alien, or anyone on the alien’s ' +
    'behalf, may be the petitioner where a waiver is sought. NOTE A DIVERGENCE: the regulation as written ' +
    'speaks only of aliens of exceptional ability, while the statute at § 1153(b)(2)(B)(i) waives the ' +
    'requirements of subparagraph (A) generally, and USCIS applies the waiver to members of the professions ' +
    'holding advanced degrees as well. The regulation has not been conformed; the USCIS Policy Manual is the ' +
    'operative statement of practice.',
};

const inaS203b2Bi = {
  id: 'us-eb-ina-203-b-2-b-i',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(2)(B)(i) (INA § 203(b)(2)(B)(i))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Subject to clause (ii), the Attorney General MAY, WHEN THE ATTORNEY GENERAL DEEMS IT TO BE IN THE NATIONAL ' +
    'INTEREST, waive the requirements of subparagraph (A) that an alien’s services in the sciences, arts, ' +
    'professions or business be sought by an employer in the United States. The statute supplies no standard, ' +
    'no factors and no entitlement. The waiver is the only thing that removes the labor certification from the ' +
    'second preference.',
};

const inaS203b2Bii = {
  id: 'us-eb-ina-203-b-2-b-ii',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(2)(B)(ii) (INA § 203(b)(2)(B)(ii))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The Attorney General SHALL grant a national interest waiver on behalf of an alien physician if the ' +
    'physician agrees to work full time as a physician in an area designated by the Secretary of Health and ' +
    'Human Services as having a shortage of health care professionals, or at a facility under the jurisdiction ' +
    'of the Secretary of Veterans Affairs, and a Federal agency or a State department of public health has ' +
    'previously determined that the work was in the public interest. No permanent resident visa may issue and ' +
    'no adjustment may be granted until the physician has worked full time as a physician for an aggregate of ' +
    '5 years, not counting time in J status. This is the one mandatory branch of an otherwise wholly ' +
    'discretionary waiver.',
};

const dhanasar = {
  id: 'us-eb-matter-of-dhanasar',
  kind: 'case_law' as const,
  instrument: 'Administrative Appeals Office, U.S. Citizenship and Immigration Services',
  provision: 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
  url: DHANASAR_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Decided 27 December 2016; vacated Matter of New York State Dep’t of Transp., 22 I&N Dec. 215 (1998). After ' +
    'eligibility for the second preference classification has been established, USCIS may grant a national ' +
    'interest waiver if the petitioner demonstrates BY A PREPONDERANCE OF THE EVIDENCE that the foreign ' +
    'national’s proposed endeavor has both substantial merit and national importance; that the foreign national ' +
    'is well positioned to advance the proposed endeavor; and that, on balance, it would be beneficial to the ' +
    'United States to waive the requirements of a job offer and thus of a labor certification. If those three ' +
    'elements are satisfied USCIS MAY approve the waiver AS A MATTER OF DISCRETION, and the decision records ' +
    'that the waiver is purely discretionary, so the petitioner must also merit a favourable exercise of ' +
    'discretion. The decision expressly declines to require petitioners to show that the endeavor is more ' +
    'likely than not to succeed.',
};

const uscisPmF5 = {
  id: 'us-eb-uscis-pm-6-f-5',
  kind: 'official_guidance' as const,
  instrument: 'USCIS Policy Manual',
  provision: '6 USCIS-PM F.5',
  url: PM_F5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED ADJUDICATION GUIDANCE, NOT REGULATION, UPDATED BY POLICY ALERT ON 15 JANUARY 2025. Eligibility ' +
    'for the underlying second preference classification must be established BEFORE the waiver is reached, and ' +
    'a petition that fails it is statutorily ineligible for the waiver. The occupation through which the ' +
    'endeavor is to be advanced must itself be a profession, so an advanced degree alone does not qualify a ' +
    'person whose intended occupation does not require a baccalaureate for entry. Progressive experience relied ' +
    'on in place of an advanced degree must be post-baccalaureate and related to the specialty and the ' +
    'endeavor. For exceptional ability, meeting at least three of the six regulatory criteria does not in and ' +
    'of itself establish the classification; a separate final merits determination follows, and the area of ' +
    'exceptional ability must be directly related to the proposed endeavor. Qualifying for the classification ' +
    'does not mean the waiver follows.',
};

const inaS101a32 = {
  id: 'us-eb-ina-101-a-32',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1101(a)(32) (INA § 101(a)(32))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The term profession shall include but not be limited to architects, engineers, lawyers, physicians, ' +
    'surgeons, and teachers in elementary or secondary schools, colleges, academies or seminaries. The list is ' +
    'open, and 8 CFR 204.5(k)(2) extends it to any occupation for which a United States baccalaureate degree or ' +
    'foreign equivalent is the minimum requirement for entry.',
};

// ---------------------------------------------------------------------------
// Third preference
// ---------------------------------------------------------------------------

const inaS203b3A = {
  id: 'us-eb-ina-203-b-3-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(3)(A) (INA § 203(b)(3)(A))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Three classes of aliens who are NOT described in paragraph (2). Skilled workers: qualified immigrants ' +
    'capable, at the time of petitioning, of performing skilled labor requiring at least 2 years training or ' +
    'experience, not of a temporary or seasonal nature, for which qualified workers are not available in the ' +
    'United States. Professionals: qualified immigrants who hold baccalaureate degrees and who are members of ' +
    'the professions. Other workers: other qualified immigrants capable of performing unskilled labor, not of a ' +
    'temporary or seasonal nature, for which qualified workers are not available in the United States.',
};

const inaS203b3B = {
  id: 'us-eb-ina-203-b-3-b',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(3)(B) (INA § 203(b)(3)(B))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Not more than 10,000 of the visas made available under paragraph (3) in any fiscal year may be available ' +
    'for other workers. That is a sub-limit inside an already limited preference and it is the reason the ' +
    'unskilled sub-category behaves differently from the other two.',
};

const cfr2045l = {
  id: 'us-eb-cfr-204-5-l',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(l)(2), (l)(3) and (l)(4)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Skilled worker means an alien capable, at the time of petitioning, of performing skilled labor requiring ' +
    'at least two years training or experience, and relevant post-secondary education may be considered as ' +
    'training. Professional means a qualified alien who holds at least a United States baccalaureate degree or ' +
    'a foreign equivalent degree and who is a member of the professions. Other worker means a qualified alien ' +
    'capable of performing unskilled labor requiring less than two years training or experience. Every petition ' +
    'must be accompanied by an individual labor certification, a Schedule A application, or Labor Market ' +
    'Information Pilot Program documentation. For a professional the job offer portion must demonstrate that ' +
    'the job requires the minimum of a baccalaureate degree, and the petition must show the degree was awarded ' +
    'and that a baccalaureate is the minimum required for entry into the occupation. Whether a worker is ' +
    'skilled or other turns on the requirements the employer places on the job AS CERTIFIED BY THE DEPARTMENT ' +
    'OF LABOR, not on what the worker happens to have.',
};

// ---------------------------------------------------------------------------
// Fourth preference
// ---------------------------------------------------------------------------

const inaS203b4 = {
  id: 'us-eb-ina-203-b-4',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(4) (INA § 203(b)(4))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Visas are made available, in a number not to exceed 7.1 percent of the worldwide level, to qualified ' +
    'special immigrants described in section 1101(a)(27) other than those described in subparagraph (A) or (B), ' +
    'of which NOT MORE THAN 5,000 in any fiscal year may go to special immigrants described in subclause (II) ' +
    'or (III) of section 1101(a)(27)(C)(ii), and not more than 100 to those described in section ' +
    '1101(a)(27)(M). The fourth preference is therefore a residual container for a list of unrelated ' +
    'enumerated classes rather than a single route.',
};

const inaS101a27C = {
  id: 'us-eb-ina-101-a-27-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1101(a)(27)(C) (INA § 101(a)(27)(C))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A special immigrant who, for at least 2 years immediately preceding the time of application for admission, ' +
    'has been a member of a religious denomination having a bona fide nonprofit religious organization in the ' +
    'United States; seeks to enter solely to carry on the vocation of a minister of that denomination (clause ' +
    '(ii)(I)), or before a stated date to work for the organization in a professional capacity in a religious ' +
    'vocation or occupation (clause (ii)(II)) or in a religious vocation or occupation (clause (ii)(III)); and ' +
    'has been carrying on such vocation, professional work or other work continuously for at least that 2-year ' +
    'period. THE DATE IN CLAUSES (ii)(II) AND (III) IS A MOVING TARGET: the codified text reads "before ' +
    'September 30, 2015" and Congress has repeatedly extended it by appropriations rider. The most recent ' +
    'extension visible in the 2024 edition of the United States Code is Pub. L. 118-47, div. G, title I, § 104 ' +
    '(23 March 2024), which directs that the clause be applied by substituting "September 30, 2024". Whether a ' +
    'later extension is in force must be checked before any non-minister religious worker relies on this ' +
    'route. The minister branch at clause (ii)(I) carries no such date.',
};

const cfr2045m = {
  id: 'us-eb-cfr-204-5-m',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.5(m)',
  url: CFR_204_5_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The religious worker petition is Form I-360 rather than Form I-140 (8 CFR 204.5(a)), and under 8 CFR ' +
    '204.5(c) the alien or any person on the alien’s behalf may file it. The regulation requires evidence that ' +
    'the prospective employer is a bona fide non-profit religious organization or an organization affiliated ' +
    'with the denomination and exempt from taxation, normally proved by a current Internal Revenue Service ' +
    'determination letter; evidence of the alien’s ordination or equivalent where the claim is as a minister; ' +
    'and evidence of how the alien has been and will be compensated, including IRS documentation of salaried ' +
    'compensation such as a Form W-2 or certified copies of income tax returns.',
};

const inaS204a1G = {
  id: 'us-eb-ina-204-a-1-g',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(a)(1)(G) (INA § 204(a)(1)(G))',
  url: USC_1154_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any alien, other than a special immigrant under section 1101(a)(27)(D), desiring to be classified under ' +
    'section 1153(b)(4), or any person on behalf of such an alien, may file a petition for such classification. ' +
    'Aliens claiming status under section 1101(a)(27)(D) file only with the Secretary of State and only after ' +
    'notification that the status has been recommended and approved.',
};

// ---------------------------------------------------------------------------
// Fifth preference
// ---------------------------------------------------------------------------

const inaS203b5A = {
  id: 'us-eb-ina-203-b-5-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(5)(A) (INA § 203(b)(5)(A))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Visas are made available to qualified immigrants seeking to enter the United States for the purpose of ' +
    'engaging in a new commercial enterprise in which the alien has invested, or is actively in the process of ' +
    'investing, capital in an amount not less than the amount specified in subparagraph (C), WHICH IS EXPECTED ' +
    'TO REMAIN INVESTED FOR NOT LESS THAN 2 YEARS, and which will benefit the United States economy by creating ' +
    'FULL-TIME EMPLOYMENT FOR NOT FEWER THAN 10 United States citizens, nationals, or aliens lawfully admitted ' +
    'for permanent residence or otherwise lawfully authorized to be employed, other than the immigrant and the ' +
    'immigrant’s spouse, sons or daughters.',
};

const inaS203b5C = {
  id: 'us-eb-ina-203-b-5-c',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(5)(C) (INA § 203(b)(5)(C))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The amount of capital required is $1,050,000 in general, and $800,000 for an investment in a targeted ' +
    'employment area or in an infrastructure project. THESE FIGURES ARE DATED BY CONSTRUCTION: clause (iii) ' +
    'provides that beginning on 1 January 2027, and every 5 years thereafter, the general amount adjusts ' +
    'automatically for petitions filed on or after the effective date of each adjustment, by the cumulative ' +
    'change in the unadjusted consumer price index for all urban consumers between 1 January 2022 and the date ' +
    'of adjustment, rounded down to the nearest $50,000, with the reduced amount set at 75 percent of the ' +
    'adjusted general amount. Clause (iv) lets the Secretary require up to three times the general amount for ' +
    'an investment in part of a metropolitan statistical area that is not a targeted employment area and has an ' +
    'unemployment rate significantly below the national average.',
};

const inaS203b5D = {
  id: 'us-eb-ina-203-b-5-d',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(5)(B) and (D) (INA § 203(b)(5)(B), (D))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Capital means cash and all real, personal or mixed tangible assets owned and controlled by the alien ' +
    'investor or held in trust for the alien with unrestricted access, valued at fair market value in United ' +
    'States dollars, and EXCLUDES assets acquired directly or indirectly by unlawful means, capital invested in ' +
    'exchange for a note, bond, convertible debt or other debt arrangement with the new commercial enterprise, ' +
    'capital with a guaranteed rate of return, and capital subject to a contractual right to repayment such as ' +
    'a mandatory redemption or a put option. New commercial enterprise means any for-profit organization formed ' +
    'in the United States for the ongoing conduct of lawful business. Rural area means any area outside a ' +
    'metropolitan statistical area and outside the outer boundary of any city or town of 20,000 or more. ' +
    'Targeted employment area means, at the time of investment, a rural area or an area the Secretary of ' +
    'Homeland Security has designated as a high unemployment area, meaning census tracts whose weighted average ' +
    'unemployment rate is not less than 150 percent of the national average; no other federal, State or local ' +
    'official may make that designation, and it lasts two years and is renewable. Of the visas available each ' +
    'year, 20 percent are reserved for rural investments, 10 percent for high unemployment areas and 2 percent ' +
    'for infrastructure projects.',
};

const inaS203b5E = {
  id: 'us-eb-ina-203-b-5-e',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1153(b)(5)(E) (INA § 203(b)(5)(E))',
  url: USC_1153_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Visas under the regional center program shall be made available THROUGH 30 SEPTEMBER 2027 to qualified ' +
    'immigrants pooling their investments in a program involving a regional center designated by the Secretary ' +
    'of Homeland Security. Regional center investors may satisfy only up to 90 percent of the ten-job ' +
    'requirement with indirectly created jobs, and only up to 75 percent where the jobs come from construction ' +
    'activity lasting less than two years. The standalone route under subparagraph (A) carries no such sunset.',
};

const cfr2046f = {
  id: 'us-eb-cfr-204-6-f',
  kind: 'regulation' as const,
  instrument: 'Code of Federal Regulations, title 8',
  provision: '8 CFR 204.6(f)',
  url: CFR_204_6_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'READ THIS PARAGRAPH ONLY ALONGSIDE THE STATUTE. As in force on the date of verification the regulation ' +
    'still states the amounts as $1,800,000 in general and $900,000 in a targeted employment area, for ' +
    'petitions filed on or after 21 November 2019, with a five-yearly adjustment beginning 1 October 2024. ' +
    'Those figures come from a 2019 rule and have not been conformed to the amounts Congress enacted in 2022 at ' +
    '§ 1153(b)(5)(C). The paragraph is recorded here so that a reader who finds it is not misled by it.',
};

const uscisPmG2 = {
  id: 'us-eb-uscis-pm-6-g-2',
  kind: 'official_guidance' as const,
  instrument: 'USCIS Policy Manual',
  provision: '6 USCIS-PM G.2',
  url: PM_G2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED ADJUDICATION GUIDANCE, NOT REGULATION. USCIS states that for petitions filed before 15 March ' +
    '2022 the investment amounts are $1,000,000, or $500,000 in a targeted employment area, and that for ' +
    'petitions filed on or after 15 March 2022 they are $1,050,000, or $800,000 in a targeted employment area ' +
    'or infrastructure project, increasing automatically on 1 January 2027 and every five years thereafter. In ' +
    'the same passage USCIS records that the 2019 rule raising the amounts to $1,800,000 and $900,000 was ' +
    'VACATED BY A FEDERAL COURT, citing Behring Regional Center LLC v. Wolf, 544 F. Supp. 3d 937 (N.D. Cal. ' +
    '2021). This citation is the reason the unamended text of 8 CFR 204.6(f) must not be read on its own.',
};

const inaS216A = {
  id: 'us-eb-ina-216-a',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1186b (INA § 216A)',
  url: USC_1186B_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien investor, alien spouse and alien child obtain lawful permanent residence ON A CONDITIONAL BASIS. ' +
    'To remove the condition the investor must file a petition during the 90-day period immediately preceding ' +
    'the second anniversary of lawful admission for permanent residence, appear for a personal interview where ' +
    'required, and the Secretary must have performed a site visit. The petition must show that the alien ' +
    'invested the requisite capital, and either created the required employment or is actively in the process ' +
    'of creating it and will do so before the THIRD anniversary of lawful admission provided the capital ' +
    'remains invested. Failure to file, or to appear without good cause, terminates permanent resident status ' +
    'as of the second anniversary.',
};

const inaS204a1H = {
  id: 'us-eb-ina-204-a-1-h',
  kind: 'statute' as const,
  instrument: 'Immigration and Nationality Act (8 U.S.C.)',
  provision: '8 U.S.C. § 1154(a)(1)(H) (INA § 204(a)(1)(H))',
  url: USC_1154_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any alien seeking classification under section 1153(b)(5) may file a petition on their own behalf; there ' +
    'is no employer and no labor certification anywhere in this preference. An alien pooling an investment must ' +
    'file under section 1153(b)(5)(E), and may do so after a regional center has filed an application for ' +
    'approval of the investment. The petitioner must establish eligibility AT THE TIME OF FILING, and a ' +
    'petitioner who was eligible then is deemed eligible when the petition is adjudicated.',
};

// ---------------------------------------------------------------------------
// Shared evaluator specs
//
// Specs carry no citations, so they may live at module scope; criteria may not,
// because `scripts/check-pathway-citations.mjs` reads this file as text and
// counts every `citationIds` block inside a pathway record against every one in
// the file. A criterion hoisted into a helper would go unchecked.
// ---------------------------------------------------------------------------

/**
 * The route is being assessed for United States permanent residence.
 *
 * Not a merits test — it is the chapeau of § 1153(b), which allots these visas
 * against the United States worldwide level and nothing else. It reads
 * `unknown` when the target jurisdiction has not been recorded, so an
 * incomplete profile is never ruled out; it reads `false` only when the person
 * has positively said they are going somewhere else.
 */
const seekingUnitedStates: EvaluatorSpec = { op: 'equals', path: 'targetJurisdiction', value: 'US' };

/** A job offer whose employer is in the United States. */
const jobOfferFromUnitedStatesEmployer: EvaluatorSpec = {
  op: 'equals',
  path: 'jobOffer.employerCountry',
  value: 'US',
};

/** A written, full-time offer from a United States employer. */
const permanentUnitedStatesJobOffer: EvaluatorSpec = {
  op: 'all_of',
  of: [jobOfferFromUnitedStatesEmployer, { op: 'is_true', path: 'jobOffer.fullTime' }],
};

/** A degree above baccalaureate: the scale places `professional_degree` there and above. */
const advancedDegreeHeld: EvaluatorSpec = {
  op: 'ordinal_at_least',
  path: 'educationLevel',
  scale: EDUCATION_SCALE,
  value: 'professional_degree',
};

/**
 * The baccalaureate-plus-five-years equivalent in 8 CFR 204.5(k)(2).
 *
 * The middle clause excludes anyone who already holds a degree above
 * baccalaureate, so this branch describes only the people who actually need it.
 * `professionalExperienceYears` counts completed years in the relevant field and
 * says nothing about whether the experience was progressive, post-baccalaureate
 * or in the specialty, which is why every criterion built on this branch
 * escalates rather than passing.
 */
const advancedDegreeByProgressiveExperience: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'ordinal_at_least', path: 'educationLevel', scale: EDUCATION_SCALE, value: 'bachelor' },
    { op: 'not', of: advancedDegreeHeld },
    { op: 'gte', path: 'professionalExperienceYears', value: 5 },
  ],
};

const advancedDegreeOrEquivalent: EvaluatorSpec = {
  op: 'any_of',
  of: [advancedDegreeHeld, advancedDegreeByProgressiveExperience],
};

/** A baccalaureate or better. */
const baccalaureateHeld: EvaluatorSpec = {
  op: 'ordinal_at_least',
  path: 'educationLevel',
  scale: EDUCATION_SCALE,
  value: 'bachelor',
};

/** Ten years of full-time experience — one of the six exceptional-ability criteria, and only one. */
const tenYearsInTheOccupation: EvaluatorSpec = {
  op: 'gte',
  path: 'professionalExperienceYears',
  value: 10,
};

/** Three years of teaching or research, the first-preference academic floor. */
const threeYearsTeachingOrResearch: EvaluatorSpec = {
  op: 'gte',
  path: 'professionalExperienceYears',
  value: 3,
};

/** Two years of training or experience, the third-preference skilled-worker floor. */
const twoYearsTrainingOrExperience: EvaluatorSpec = {
  op: 'gte',
  path: 'professionalExperienceYears',
  value: 2,
};

/** The 20 CFR 656.17(l) bona-fide-job-opportunity trigger. */
const selfEmploymentRecorded: EvaluatorSpec = { op: 'is_true', path: 'jobOffer.selfEmployment' };

/**
 * Investment amounts are in United States cents, because `minorUnits` is minor
 * units and the paired currency test is `USD`. $800,000 is 80,000,000 cents and
 * $1,050,000 is 105,000,000 cents.
 */
const investmentAtLeastReducedAmount: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'equals', path: 'qualifyingInvestment.currency', value: 'USD' },
    { op: 'gte', path: 'qualifyingInvestment.minorUnits', value: 80_000_000 },
  ],
};

const investmentAtLeastStandardAmount: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'equals', path: 'qualifyingInvestment.currency', value: 'USD' },
    { op: 'gte', path: 'qualifyingInvestment.minorUnits', value: 105_000_000 },
  ],
};

// ---------------------------------------------------------------------------
// EB-1A — extraordinary ability
// ---------------------------------------------------------------------------

export const usEb1aExtraordinaryAbility: Pathway = {
  id: 'us-eb1a-extraordinary-ability',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-1A — Employment first preference: alien of extraordinary ability',
    es: 'EB-1A — Primera preferencia por empleo: persona con capacidad extraordinaria',
  },
  summary: {
    en:
      'Permanent residence for a person with extraordinary ability in the sciences, arts, education, business or ' +
      'athletics, shown by sustained national or international acclaim. No employer, no job offer and no ' +
      'permanent labor certification are required, and the person may file the petition on their own behalf. ' +
      'Whether the standard is met is an adjudicator’s judgement on the whole record, so this route can never ' +
      'return a verdict here.',
    es:
      'Residencia permanente para una persona con capacidad extraordinaria en las ciencias, las artes, la ' +
      'educación, los negocios o el deporte, acreditada mediante un reconocimiento nacional o internacional ' +
      'sostenido. No se exige empleador, ni oferta de trabajo, ni certificación laboral permanente, y la propia ' +
      'persona puede presentar la petición. El cumplimiento del estándar es una apreciación del funcionario ' +
      'sobre el conjunto del expediente, por lo que esta vía nunca emite aquí un veredicto.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b1A,
    inaS204a1E,
    cfr2045h2,
    cfr2045h3,
    cfr2045h5,
    uscisPmF2,
    inaS212a5A,
  ],
  criteria: [
    {
      id: 'us-eb1a-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en:
          'The employment-based preferences allot immigrant visas against the United States worldwide level in ' +
          '8 U.S.C. § 1151(d) and nothing else. Where no target jurisdiction has been recorded this reads as ' +
          'undecided rather than as a failure.',
        es:
          'Las preferencias por empleo asignan visas de inmigrante con cargo al límite mundial de los Estados ' +
          'Unidos previsto en 8 U.S.C. § 1151(d) y a ningún otro. Si no consta la jurisdicción de destino, el ' +
          'resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb1a-sustained-acclaim',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-203-b-1-a',
        'us-eb-cfr-204-5-h-2',
        'us-eb-cfr-204-5-h-3',
        'us-eb-uscis-pm-6-f-2',
      ],
      label: {
        en:
          'Extraordinary ability shown by sustained national or international acclaim: a major internationally ' +
          'recognised award, or at least three of the ten kinds of evidence in the regulation',
        es:
          'Capacidad extraordinaria acreditada por un reconocimiento nacional o internacional sostenido: un ' +
          'premio internacional de gran relieve, o al menos tres de los diez tipos de prueba del reglamento',
      },
      // There is no fact in this model for an award, a publication, a judging
      // invitation or a salary comparison, and there is no honest proxy for
      // "one of that small percentage who have risen to the very top". The
      // evaluator therefore records only whether any professional credential is
      // on file at all, and the criterion escalates unconditionally so that
      // reading is never presented as an answer.
      evaluator: { op: 'is_present', path: 'professionalCredentials' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Nothing in this profile can decide extraordinary ability. USCIS applies two separate steps: first ' +
          'whether the evidence objectively meets a one-time major international award or at least three of the ' +
          'ten regulatory criteria, and then a separate final merits determination weighing all of it together ' +
          'against the standard of one of that small percentage who have risen to the very top of the field. ' +
          'Meeting three criteria does not establish the classification. The evidence itself has to be read.',
        es:
          'Nada en este perfil permite decidir la capacidad extraordinaria. USCIS aplica dos pasos distintos: ' +
          'primero, si la prueba cumple objetivamente un premio internacional único de gran relieve o al menos ' +
          'tres de los diez criterios reglamentarios; después, una valoración final independiente que pondera ' +
          'todo el conjunto frente al estándar de pertenecer al pequeño porcentaje que ha llegado a la cúspide ' +
          'del campo. Cumplir tres criterios no acredita la clasificación. La prueba debe examinarse.',
      },
      guidance: {
        en:
          'The ten kinds of evidence are: lesser nationally or internationally recognised prizes or awards; ' +
          'membership of associations that require outstanding achievements of their members; published ' +
          'material about the person in professional or major trade publications or other major media; ' +
          'participation as a judge of the work of others in the same or an allied field; original scientific, ' +
          'scholarly, artistic, athletic or business-related contributions of major significance; authorship of ' +
          'scholarly articles; display of the work at artistic exhibitions or showcases; performance in a ' +
          'leading or critical role for organisations with a distinguished reputation; a high salary or other ' +
          'significantly high remuneration relative to others in the field; and commercial success in the ' +
          'performing arts. Where those categories do not readily apply to the occupation, comparable evidence ' +
          'may be submitted instead.',
        es:
          'Los diez tipos de prueba son: premios o galardones nacionales o internacionales de menor relieve; ' +
          'pertenencia a asociaciones que exigen logros destacados a sus miembros; material publicado sobre la ' +
          'persona en publicaciones profesionales o comerciales de referencia u otros medios principales; ' +
          'participación como juez del trabajo de otras personas en el mismo campo o en uno afín; ' +
          'contribuciones originales de gran relevancia científicas, académicas, artísticas, deportivas o ' +
          'empresariales; autoría de artículos académicos; exhibición de la obra en exposiciones o muestras ' +
          'artísticas; desempeño de una función principal o crítica en organizaciones de reputación ' +
          'distinguida; una remuneración alta en comparación con otras personas del campo; y éxito comercial en ' +
          'las artes escénicas. Si esas categorías no resultan aplicables a la ocupación, puede presentarse ' +
          'prueba comparable.',
      },
    },
    {
      id: 'us-eb1a-continue-work-in-the-field',
      kind: 'intent',
      weight: 'material',
      citationIds: ['us-eb-ina-203-b-1-a', 'us-eb-cfr-204-5-h-5'],
      label: {
        en: 'Entering the United States to continue work in the area of extraordinary ability',
        es: 'Ingreso a los Estados Unidos para continuar trabajando en el área de capacidad extraordinaria',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'is_present', path: 'jobOffer' },
          { op: 'is_present', path: 'intent.declaredPurpose' },
        ],
      },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The regulation asks for clear evidence of coming to continue work in the area of expertise — ' +
          'prospective employer letters, prearranged commitments such as contracts, or the person’s own ' +
          'statement of plans. Meridian holds none of those documents, and whether the intended work falls ' +
          'inside the area in which acclaim was earned is itself a contested question, most often where an ' +
          'athlete proposes to coach.',
        es:
          'El reglamento exige prueba clara de que se viene a continuar el trabajo en el área de especialidad: ' +
          'cartas de empleadores potenciales, compromisos ya concertados como contratos, o una declaración ' +
          'propia sobre los planes. Meridian no conserva esos documentos, y si el trabajo previsto queda dentro ' +
          'del área en la que se obtuvo el reconocimiento es una cuestión discutida, sobre todo cuando una ' +
          'persona deportista propone dedicarse a entrenar.',
      },
    },
    {
      id: 'us-eb1a-no-labor-certification',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-eb-cfr-204-5-h-5', 'us-eb-ina-204-a-1-e', 'us-eb-ina-212-a-5-a'],
      label: {
        en: 'No job offer and no permanent labor certification are required, and the person may self-petition',
        es:
          'No se exige oferta de empleo ni certificación laboral permanente, y la propia persona puede ' +
          'presentar la petición',
      },
      // This criterion states the removal of a requirement, so there is nothing
      // about the applicant to test. The evaluator records only whether a job
      // offer happens to be on file — useful context, never a finding — and the
      // weight keeps it out of the verdict entirely.
      evaluator: { op: 'is_present', path: 'jobOffer' },
      guidance: {
        en:
          'This is the structural difference between the first preference and the second and third. 8 U.S.C. ' +
          '§ 1182(a)(5)(A) reaches an alien who seeks to enter to perform skilled or unskilled labor and makes ' +
          'them inadmissible without a Department of Labor certification; 8 CFR 204.5(h)(5) states that neither ' +
          'an offer of employment nor a labor certification is required for this classification, and 8 U.S.C. ' +
          '§ 1154(a)(1)(E) lets the person file the petition themselves. A job offer may still be useful ' +
          'evidence of continuing work, but it is evidence, not a requirement.',
        es:
          'Ésta es la diferencia estructural entre la primera preferencia y la segunda y tercera. 8 U.S.C. ' +
          '§ 1182(a)(5)(A) alcanza a quien pretende ingresar para realizar trabajo cualificado o no ' +
          'cualificado y lo declara inadmisible sin una certificación del Departamento de Trabajo; 8 CFR ' +
          '204.5(h)(5) establece que esta clasificación no exige ni oferta de empleo ni certificación laboral, ' +
          'y 8 U.S.C. § 1154(a)(1)(E) permite que la propia persona presente la petición. Una oferta de empleo ' +
          'puede seguir siendo prueba útil de la continuidad del trabajo, pero es prueba y no requisito.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'Qualifying for the classification is not the same as having a visa. The first preference is ' +
        'numerically limited: 8 U.S.C. § 1151(d) fixes the worldwide employment-based level at 140,000 plus ' +
        'carried-forward numbers, § 1153(b)(1) takes not more than 28.6 per cent of it, and § 1152(a)(2) caps ' +
        'any single foreign state at 7 per cent of the combined preference totals. Visas are issued in the ' +
        'order petitions were filed, which is what the priority date records, and under 8 CFR 204.5(d) that ' +
        'date is the day the petition was properly filed where no labor certification is required. Chargeability ' +
        'is to the applicant’s place of birth, not their nationality. The Department of State publishes the ' +
        'resulting cut-offs monthly and currently treats Mexico as one of four oversubscribed chargeability ' +
        'areas, alongside China (mainland-born), India and the Philippines, which means a Mexican-chargeability ' +
        'applicant can wait materially longer than someone of another chargeability with the same priority date ' +
        'in the same category. Meridian records no cut-off date, no queue position and no waiting time: those ' +
        'change every month and must be read in the current Visa Bulletin.',
      es:
        'Cumplir los requisitos de la clasificación no equivale a disponer de una visa. La primera preferencia ' +
        'está numéricamente limitada: 8 U.S.C. § 1151(d) fija el límite mundial por empleo en 140.000 más los ' +
        'números arrastrados, el § 1153(b)(1) toma como máximo el 28,6 por ciento y el § 1152(a)(2) limita a ' +
        'cualquier Estado extranjero al 7 por ciento del total combinado de preferencias. Las visas se emiten ' +
        'en el orden en que se presentaron las peticiones, que es lo que registra la fecha de prioridad, y ' +
        'conforme a 8 CFR 204.5(d) esa fecha es el día de la presentación correcta de la petición cuando no se ' +
        'exige certificación laboral. La imputación se hace al lugar de nacimiento, no a la nacionalidad. El ' +
        'Departamento de Estado publica mensualmente las fechas de corte y actualmente considera a México uno ' +
        'de los cuatro países con sobresuscripción, junto con China (nacidos en el continente), India y ' +
        'Filipinas, de modo que una persona imputada a México puede esperar bastante más que otra de distinta ' +
        'imputación con la misma fecha de prioridad y la misma categoría. Meridian no registra fechas de corte, ' +
        'ni posiciones en la fila, ni tiempos de espera: cambian cada mes y deben consultarse en el Boletín de ' +
        'Visas vigente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-1B — outstanding professors and researchers
// ---------------------------------------------------------------------------

export const usEb1bOutstandingProfessorResearcher: Pathway = {
  id: 'us-eb1b-outstanding-professor-researcher',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-1B — Employment first preference: outstanding professor or researcher',
    es: 'EB-1B — Primera preferencia por empleo: profesorado o personal investigador destacado',
  },
  summary: {
    en:
      'Permanent residence for a person recognised internationally as outstanding in a specific academic area, ' +
      'with at least three years of teaching or research experience in it, who has an offer of a tenured or ' +
      'tenure-track teaching post, a permanent research post at a university, or a comparable research post ' +
      'with a qualifying private employer. An employer must file the petition, but no permanent labor ' +
      'certification is required.',
    es:
      'Residencia permanente para quien esté reconocido internacionalmente como destacado en un área académica ' +
      'concreta, con al menos tres años de experiencia docente o investigadora en ella, y disponga de una ' +
      'oferta de plaza docente permanente o en vía de permanencia, de una plaza de investigación permanente en ' +
      'una universidad, o de una plaza de investigación comparable en un empleador privado cualificado. La ' +
      'petición la presenta el empleador, pero no se exige certificación laboral permanente.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b1B,
    inaS204a1F,
    cfr2045i3,
    uscisPmF3,
    inaS212a5A,
  ],
  criteria: [
    {
      id: 'us-eb1b-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en:
          'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es:
          'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb1b-three-years-teaching-or-research',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-1-b', 'us-eb-cfr-204-5-i-3'],
      label: {
        en: 'At least three years of experience in teaching or research in the academic area',
        es: 'Al menos tres años de experiencia docente o investigadora en el área académica',
      },
      // Three years is a statutory number, so a recorded figure below it is a
      // real failure and is reported as one. A figure at or above it says
      // nothing about whether the experience was in the academic area named in
      // the petition, or whether experience gained while studying for a degree
      // counts, so a possible pass escalates.
      evaluator: threeYearsTeachingOrResearch,
      humanReviewWhen: threeYearsTeachingOrResearch,
      humanReviewReason: {
        en:
          'Meridian records completed years of professional experience and not the field they were in, so the ' +
          'requirement that the experience be teaching or research in the academic area named in the petition ' +
          'has to be checked against the employer letters. Experience gained while working on an advanced ' +
          'degree counts only if the degree was actually obtained and either the teaching carried full ' +
          'responsibility for the class or the research has been recognised within the field as outstanding.',
        es:
          'Meridian registra los años completos de experiencia profesional, no el campo en que se obtuvieron, ' +
          'de modo que el requisito de que se trate de docencia o investigación en el área académica indicada ' +
          'en la petición debe comprobarse con las cartas de los empleadores. La experiencia obtenida mientras ' +
          'se cursaba un posgrado sólo computa si el título llegó a obtenerse y, además, la docencia implicó ' +
          'plena responsabilidad sobre la asignatura o la investigación ha sido reconocida como destacada en ' +
          'el campo.',
      },
    },
    {
      id: 'us-eb1b-international-recognition',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-1-b', 'us-eb-cfr-204-5-i-3', 'us-eb-uscis-pm-6-f-3'],
      label: {
        en:
          'Recognised internationally as outstanding in the academic area, shown by at least two of the six ' +
          'kinds of evidence in the regulation',
        es:
          'Reconocimiento internacional como persona destacada en el área académica, acreditado con al menos ' +
          'dos de los seis tipos de prueba del reglamento',
      },
      evaluator: { op: 'is_present', path: 'professionalCredentials' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The six kinds of evidence are major prizes or awards, membership of associations requiring ' +
          'outstanding achievements, published material written by others about the person’s work, ' +
          'participation as a judge of others’ work, original scientific or scholarly research contributions, ' +
          'and authorship of scholarly books or articles in journals with international circulation. None of ' +
          'them is a fact this engine holds. USCIS also applies a separate final merits determination after ' +
          'the two-criteria threshold is cleared, so a count is not an outcome.',
        es:
          'Los seis tipos de prueba son: premios o galardones de relieve; pertenencia a asociaciones que ' +
          'exigen logros destacados; material publicado por terceros sobre el trabajo de la persona; ' +
          'participación como juez del trabajo ajeno; contribuciones originales de investigación científica o ' +
          'académica; y autoría de libros o artículos académicos en revistas de circulación internacional. ' +
          'Ninguno de ellos es un dato que este motor conserve. USCIS aplica además una valoración final ' +
          'independiente una vez superado el umbral de dos criterios, de modo que un recuento no es un ' +
          'resultado.',
      },
    },
    {
      id: 'us-eb1b-qualifying-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-1-b', 'us-eb-cfr-204-5-i-3', 'us-eb-ina-204-a-1-f'],
      label: {
        en:
          'A written offer from a United States employer of a tenured or tenure-track teaching post, a ' +
          'permanent university research post, or a comparable research post with a qualifying private employer',
        es:
          'Oferta escrita de un empleador estadounidense para una plaza docente permanente o en vía de ' +
          'permanencia, una plaza de investigación permanente en una universidad, o una plaza de investigación ' +
          'comparable en un empleador privado cualificado',
      },
      evaluator: {
        op: 'all_of',
        of: [jobOfferFromUnitedStatesEmployer, { op: 'is_true', path: 'jobOffer.writtenOffer' }],
      },
      humanReviewWhen: {
        op: 'all_of',
        of: [jobOfferFromUnitedStatesEmployer, { op: 'is_true', path: 'jobOffer.writtenOffer' }],
      },
      humanReviewReason: {
        en:
          'A recorded written offer from a United States employer is necessary and not sufficient. The ' +
          'regulation admits only three forms of offer, and Meridian records none of what separates them: ' +
          'whether a teaching post is tenured or tenure-track, whether a research post is permanent in the ' +
          'regulatory sense of tenured, tenure-track or of indefinite duration with an expectation of ' +
          'continued employment, and whether a private employer employs at least three people full-time in ' +
          'research and has documented accomplishments in an academic field.',
        es:
          'Una oferta escrita de un empleador estadounidense es necesaria pero no suficiente. El reglamento ' +
          'sólo admite tres formas de oferta y Meridian no registra lo que las distingue: si la plaza docente ' +
          'es permanente o está en vía de permanencia; si la plaza de investigación es permanente en el ' +
          'sentido reglamentario, es decir permanente, en vía de permanencia o de duración indefinida con ' +
          'expectativa de continuidad; y si el empleador privado ocupa al menos a tres personas a tiempo ' +
          'completo en investigación y acredita logros documentados en un campo académico.',
      },
    },
    {
      id: 'us-eb1b-no-labor-certification',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-eb-cfr-204-5-i-3', 'us-eb-ina-212-a-5-a'],
      label: {
        en: 'A job offer is required, but a permanent labor certification is not',
        es: 'Se exige oferta de empleo, pero no certificación laboral permanente',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      guidance: {
        en:
          'This route sits between the two extremes. Unlike extraordinary ability it needs an employer, and ' +
          'unlike the second and third preferences it does not need the Department of Labor to test the United ' +
          'States labour market first: 8 CFR 204.5(i)(3)(iv) says in terms that a labor certification is not ' +
          'required for this classification. That removes the recruitment, prevailing wage and audit machinery ' +
          'of 20 CFR part 656 from the timeline entirely.',
        es:
          'Esta vía se sitúa entre los dos extremos. A diferencia de la capacidad extraordinaria requiere un ' +
          'empleador, y a diferencia de la segunda y la tercera preferencia no exige que el Departamento de ' +
          'Trabajo verifique antes el mercado laboral estadounidense: 8 CFR 204.5(i)(3)(iv) señala ' +
          'expresamente que esta clasificación no requiere certificación laboral. Eso elimina del calendario ' +
          'toda la maquinaria de reclutamiento, salario prevaleciente y auditoría de 20 CFR parte 656.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The first preference is numerically limited to not more than 28.6 per cent of the worldwide ' +
        'employment-based level, and 8 U.S.C. § 1152(a)(2) caps any single foreign state at 7 per cent of the ' +
        'combined preference totals. Because no labor certification is required, the priority date is the day ' +
        'the petition was properly filed with USCIS. Chargeability follows place of birth. The Department of ' +
        'State publishes cut-off dates monthly and currently treats Mexico as one of four oversubscribed ' +
        'chargeability areas, so a Mexican-chargeability applicant can wait materially longer than someone of ' +
        'another chargeability in the same category. No date, position or waiting time is recorded here.',
      es:
        'La primera preferencia está limitada a un máximo del 28,6 por ciento del límite mundial por empleo, y ' +
        '8 U.S.C. § 1152(a)(2) restringe a cualquier Estado extranjero al 7 por ciento del total combinado de ' +
        'preferencias. Al no exigirse certificación laboral, la fecha de prioridad es el día de la ' +
        'presentación correcta de la petición ante USCIS. La imputación sigue el lugar de nacimiento. El ' +
        'Departamento de Estado publica mensualmente las fechas de corte y actualmente considera a México uno ' +
        'de los cuatro países con sobresuscripción, por lo que una persona imputada a México puede esperar ' +
        'bastante más que otra de distinta imputación en la misma categoría. Aquí no se registra fecha alguna, ' +
        'ni posición, ni tiempo de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-1C — multinational managers and executives
// ---------------------------------------------------------------------------

export const usEb1cMultinationalManagerExecutive: Pathway = {
  id: 'us-eb1c-multinational-manager-executive',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-1C — Employment first preference: multinational manager or executive',
    es: 'EB-1C — Primera preferencia por empleo: directivo o ejecutivo de empresa multinacional',
  },
  summary: {
    en:
      'Permanent residence for a manager or executive who, in the three years before applying, spent at least ' +
      'one year employed abroad by a firm, an affiliate or a subsidiary, and is coming to render services to ' +
      'the same group in the United States in a managerial or executive capacity. The United States employer ' +
      'files, and no permanent labor certification is required. Unlike the L-1A nonimmigrant classification it ' +
      'resembles, this route is not available to someone coming to open a new office.',
    es:
      'Residencia permanente para una persona directiva o ejecutiva que, en los tres años anteriores a la ' +
      'solicitud, haya trabajado al menos un año en el extranjero para una empresa, filial o sociedad ' +
      'vinculada, y venga a prestar servicios al mismo grupo en los Estados Unidos en funciones directivas o ' +
      'ejecutivas. La petición la presenta el empleador estadounidense y no se exige certificación laboral ' +
      'permanente. A diferencia de la clasificación de no inmigrante L-1A a la que se parece, esta vía no está ' +
      'disponible para quien viene a abrir una oficina nueva.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b1C,
    inaS204a1F,
    cfr2045j,
    uscisPmF4,
    inaS212a5A,
  ],
  criteria: [
    {
      id: 'us-eb1c-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb1c-qualifying-year-abroad',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-eb-ina-203-b-1-c', 'us-eb-cfr-204-5-j'],
      label: {
        en:
          'At least one year employed abroad in a managerial or executive capacity by the same firm, or an ' +
          'affiliate or subsidiary, within the three years before applying',
        es:
          'Al menos un año de empleo en el extranjero en funciones directivas o ejecutivas para la misma ' +
          'empresa, o para una filial o sociedad vinculada, dentro de los tres años anteriores a la solicitud',
      },
      // Recorded work experience carries a country and a period but no employer
      // identity and no corporate relationship, so the qualifying year can be
      // neither measured against the three-year window nor tied to the
      // petitioning group. The spec looks only for full-time work recorded
      // outside the United States, and the criterion escalates unconditionally
      // so that reading is never presented as the finding.
      evaluator: {
        op: 'collection_any',
        path: 'workExperience',
        where: {
          op: 'all_of',
          of: [
            { op: 'is_true', path: 'fullTime' },
            { op: 'not', of: { op: 'equals', path: 'country', value: 'US' } },
          ],
        },
      },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Three separate things have to be established from documents Meridian does not hold: that the year ' +
          'abroad fell inside the three years preceding the application, or, where the person is already in ' +
          'the United States working for the group, inside the three years preceding their entry as a ' +
          'nonimmigrant; that the overseas employer is the same legal entity as the petitioner or its ' +
          'affiliate or subsidiary as those terms are defined in the regulation; and that the work abroad was ' +
          'itself managerial or executive rather than merely senior.',
        es:
          'Deben acreditarse tres cosas distintas con documentos que Meridian no conserva: que el año en el ' +
          'extranjero se sitúe dentro de los tres años previos a la solicitud o, si la persona ya trabaja en ' +
          'los Estados Unidos para el grupo, dentro de los tres años previos a su entrada como no inmigrante; ' +
          'que el empleador extranjero sea la misma entidad jurídica que el peticionario, o su filial o ' +
          'sociedad vinculada en el sentido definido por el reglamento; y que el trabajo en el extranjero ' +
          'fuese propiamente directivo o ejecutivo y no simplemente de nivel superior.',
      },
    },
    {
      id: 'us-eb1c-managerial-or-executive-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-203-b-1-c',
        'us-eb-cfr-204-5-j',
        'us-eb-uscis-pm-6-f-4',
        'us-eb-ina-204-a-1-f',
      ],
      label: {
        en:
          'A written job offer from the United States employer to work in a managerial or executive capacity, ' +
          'at a business that has been operating for at least a year',
        es:
          'Oferta de empleo escrita del empleador estadounidense para desempeñar funciones directivas o ' +
          'ejecutivas, en una empresa que lleve al menos un año en actividad',
      },
      evaluator: {
        op: 'all_of',
        of: [jobOfferFromUnitedStatesEmployer, { op: 'is_true', path: 'jobOffer.writtenOffer' }],
      },
      humanReviewWhen: {
        op: 'all_of',
        of: [jobOfferFromUnitedStatesEmployer, { op: 'is_true', path: 'jobOffer.writtenOffer' }],
      },
      humanReviewReason: {
        en:
          'Managerial and executive capacity are regulatory definitions describing the character of a job, and ' +
          'an adjudicator characterises the job on the duties described in the offer letter. A first-line ' +
          'supervisor is not managerial merely by supervising, unless those supervised are professional, and ' +
          'headcount alone decides nothing. Two further conditions cannot be read from this profile: the ' +
          'petitioning employer must have been doing business in the United States for at least one year, and ' +
          'USCIS states that a person coming to open a NEW OFFICE is not eligible for this classification at ' +
          'all — the executive or manager must be joining an existing business.',
        es:
          'Las funciones directivas y ejecutivas son definiciones reglamentarias que describen el carácter de ' +
          'un puesto, y el funcionario lo califica a partir de las tareas descritas en la carta de oferta. ' +
          'Quien supervisa en primera línea no es directivo por el solo hecho de supervisar, salvo que las ' +
          'personas supervisadas sean profesionales, y el número de empleados por sí solo no decide nada. Hay ' +
          'otras dos condiciones que no pueden deducirse de este perfil: el empleador peticionario debe llevar ' +
          'al menos un año haciendo negocios en los Estados Unidos, y USCIS señala que quien viene a ABRIR UNA ' +
          'OFICINA NUEVA no es elegible para esta clasificación: la persona directiva o ejecutiva debe ' +
          'incorporarse a un negocio ya existente.',
      },
    },
    {
      id: 'us-eb1c-no-labor-certification',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-eb-cfr-204-5-j', 'us-eb-uscis-pm-6-f-4', 'us-eb-ina-212-a-5-a'],
      label: {
        en: 'A job offer is required, but a permanent labor certification is not',
        es: 'Se exige oferta de empleo, pero no certificación laboral permanente',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      guidance: {
        en:
          '8 CFR 204.5(j)(5) states that no labor certification is required for this classification, although ' +
          'the prospective United States employer must furnish a job offer in the form of a statement clearly ' +
          'describing the duties. The Department of Labor therefore never tests the United States labour ' +
          'market for this post, which is the practical difference between this route and a second or third ' +
          'preference filing for the same person.',
        es:
          '8 CFR 204.5(j)(5) establece que esta clasificación no requiere certificación laboral, aunque el ' +
          'futuro empleador estadounidense debe aportar una oferta de empleo en forma de declaración que ' +
          'describa con claridad las funciones. El Departamento de Trabajo no examina, por tanto, el mercado ' +
          'laboral estadounidense para este puesto, que es la diferencia práctica entre esta vía y una ' +
          'solicitud de segunda o tercera preferencia para la misma persona.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The first preference takes not more than 28.6 per cent of the worldwide employment-based level, and ' +
        'no single foreign state may take more than 7 per cent of the combined preference totals. With no ' +
        'labor certification in the route, the priority date is the day the petition was properly filed with ' +
        'USCIS, and visas issue in filing order. Chargeability follows place of birth. The Department of State ' +
        'currently treats Mexico as one of four oversubscribed chargeability areas, so waits differ by ' +
        'chargeability within the same category. Meridian records no cut-off date and no waiting time.',
      es:
        'La primera preferencia toma como máximo el 28,6 por ciento del límite mundial por empleo, y ningún ' +
        'Estado extranjero puede tomar más del 7 por ciento del total combinado de preferencias. Al no haber ' +
        'certificación laboral en esta vía, la fecha de prioridad es el día de la presentación correcta de la ' +
        'petición ante USCIS, y las visas se emiten en ese orden. La imputación sigue el lugar de nacimiento. ' +
        'El Departamento de Estado considera actualmente a México uno de los cuatro países con ' +
        'sobresuscripción, de modo que las esperas difieren según la imputación dentro de una misma ' +
        'categoría. Meridian no registra fechas de corte ni tiempos de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-2 with a labor certification
// ---------------------------------------------------------------------------

export const usEb2AdvancedDegreeExceptionalAbility: Pathway = {
  id: 'us-eb2-advanced-degree-exceptional-ability',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-2 — Employment second preference: advanced degree or exceptional ability, with labor certification',
    es:
      'EB-2 — Segunda preferencia por empleo: título de posgrado o capacidad excepcional, con certificación ' +
      'laboral',
  },
  summary: {
    en:
      'Permanent residence for a member of the professions holding an advanced degree, or a person of ' +
      'exceptional ability in the sciences, arts or business, whose services are sought by a United States ' +
      'employer. The employer must normally first obtain a permanent labor certification from the Department ' +
      'of Labor, or qualify the job under Schedule A. Where the job offer is to be waived in the national ' +
      'interest, the separate national interest waiver record applies instead.',
    es:
      'Residencia permanente para quien sea miembro de las profesiones con título de posgrado, o persona con ' +
      'capacidad excepcional en las ciencias, las artes o los negocios, cuyos servicios sean requeridos por un ' +
      'empleador estadounidense. Por regla general el empleador debe obtener primero una certificación laboral ' +
      'permanente del Departamento de Trabajo, o encuadrar el puesto en el Anexo A. Si la oferta de empleo va ' +
      'a dispensarse por interés nacional, se aplica en su lugar el registro específico de esa dispensa.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b2A,
    inaS203b2C,
    inaS204a1F,
    cfr2045k2AdvancedDegree,
    cfr2045k2ExceptionalAbility,
    cfr2045k3,
    cfr2045k4i,
    inaS101a32,
    uscisPmF5,
    inaS212a5A,
    cfr6561,
    cfr65617,
    cfr6565,
    cfr65630,
  ],
  criteria: [
    {
      id: 'us-eb2-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb2-services-sought-by-a-united-states-employer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-2-a', 'us-eb-ina-204-a-1-f'],
      label: {
        en: 'The applicant’s services are sought by an employer in the United States',
        es: 'Un empleador de los Estados Unidos requiere los servicios de la persona solicitante',
      },
      // Part of the classification itself, not merely of the certification
      // process: § 1153(b)(2)(A) ends with the words "and whose services ... are
      // sought by an employer in the United States". An employer recorded in
      // another country is a real failure of this route; the only way out of the
      // requirement is the waiver, which is a separate record.
      evaluator: jobOfferFromUnitedStatesEmployer,
      guidance: {
        en:
          'Only two things remove this requirement. A national interest waiver under 8 U.S.C. ' +
          '§ 1153(b)(2)(B)(i), which is assessed on the separate national interest waiver record and lets the ' +
          'person petition for themselves. Or a Schedule A, Group II designation, which does not remove the ' +
          'employer but does remove the market test. If no employer has been recorded at all, this reads as ' +
          'undecided rather than as a refusal.',
        es:
          'Sólo dos cosas eliminan este requisito. Una dispensa por interés nacional conforme a 8 U.S.C. ' +
          '§ 1153(b)(2)(B)(i), que se valora en el registro específico de esa dispensa y permite que la propia ' +
          'persona presente la petición. O una designación del Anexo A, Grupo II, que no elimina al empleador ' +
          'pero sí la prueba de mercado. Si no consta empleador alguno, el resultado es indeterminado y no una ' +
          'denegación.',
      },
    },
    {
      id: 'us-eb2-advanced-degree',
      kind: 'qualification',
      weight: 'material',
      citationIds: ['us-eb-cfr-204-5-k-2-advanced-degree', 'us-eb-cfr-204-5-k-3', 'us-eb-ina-101-a-32'],
      label: {
        en:
          'A degree above baccalaureate, or a baccalaureate followed by at least five years of progressive ' +
          'post-baccalaureate experience in the specialty',
        es:
          'Un título superior al de licenciatura, o una licenciatura seguida de al menos cinco años de ' +
          'experiencia progresiva posterior en la especialidad',
      },
      // Weight is material rather than blocking because exceptional ability is
      // an independent route into the same preference and this engine cannot
      // measure it. Someone who fails the degree test may still qualify, so this
      // criterion holds back a yes and never produces a no.
      evaluator: advancedDegreeOrEquivalent,
      humanReviewWhen: advancedDegreeByProgressiveExperience,
      humanReviewReason: {
        en:
          'The five-year equivalent is being relied on. The regulation requires the experience to be ' +
          'progressive, to have been obtained after the baccalaureate was completed, and to be in the ' +
          'specialty; Meridian records only a count of completed years. USCIS states that progressive ' +
          'experience in a field unrelated to the degree does not equate to an advanced degree in that field, ' +
          'and the point is proved by employer letters rather than by a number.',
        es:
          'Se está invocando la equivalencia de cinco años. El reglamento exige que la experiencia sea ' +
          'progresiva, posterior a la obtención de la licenciatura y en la especialidad; Meridian sólo ' +
          'registra un recuento de años completos. USCIS señala que la experiencia progresiva en un campo ' +
          'ajeno al título no equivale a un posgrado en ese campo, y ello se acredita con cartas de ' +
          'empleadores y no con una cifra.',
      },
      guidance: {
        en:
          'Holding an advanced degree is not by itself enough. The occupation through which the person will ' +
          'work must itself be a profession, meaning one of the occupations listed in 8 U.S.C. § 1101(a)(32) ' +
          'or any occupation for which a United States baccalaureate or foreign equivalent is the minimum ' +
          'requirement for entry. Where a doctorate is customarily required by the specialty, the person must ' +
          'hold a United States doctorate or foreign equivalent.',
        es:
          'Poseer un título de posgrado no basta por sí solo. La ocupación en la que se trabajará debe ser una ' +
          'profesión, es decir, alguna de las enumeradas en 8 U.S.C. § 1101(a)(32) o cualquier ocupación para ' +
          'cuyo acceso se exija como mínimo una licenciatura estadounidense o su equivalente extranjero. ' +
          'Cuando la especialidad exige habitualmente un doctorado, la persona debe poseer un doctorado ' +
          'estadounidense o su equivalente extranjero.',
      },
    },
    {
      id: 'us-eb2-exceptional-ability',
      kind: 'qualification',
      weight: 'material',
      citationIds: [
        'us-eb-cfr-204-5-k-2-exceptional-ability',
        'us-eb-cfr-204-5-k-3',
        'us-eb-ina-203-b-2-c',
        'us-eb-uscis-pm-6-f-5',
      ],
      label: {
        en:
          'Exceptional ability in the sciences, arts or business: expertise significantly above that ordinarily ' +
          'encountered, shown by at least three of the six kinds of evidence in the regulation',
        es:
          'Capacidad excepcional en las ciencias, las artes o los negocios: pericia significativamente ' +
          'superior a la habitual, acreditada con al menos tres de los seis tipos de prueba del reglamento',
      },
      // Ten years of full-time experience is exactly one of the six categories.
      // It is the only one this model can see, which is why the criterion
      // escalates unconditionally rather than treating it as the test.
      evaluator: tenYearsInTheOccupation,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The six categories are an academic award relating to the area, at least ten years of full-time ' +
          'experience in the occupation, a licence or certification for the occupation, a salary demonstrating ' +
          'exceptional ability, membership of professional associations, and recognition for achievements and ' +
          'significant contributions by peers, governmental entities or professional organisations. Meridian ' +
          'can see only the experience count. USCIS then applies a separate final merits determination, and ' +
          '8 U.S.C. § 1153(b)(2)(C) says a degree or a licence is not by itself sufficient evidence of ' +
          'exceptional ability.',
        es:
          'Las seis categorías son: un título académico relacionado con el área; al menos diez años de ' +
          'experiencia a tiempo completo en la ocupación; una licencia o certificación para la ocupación; una ' +
          'remuneración que demuestre capacidad excepcional; la pertenencia a asociaciones profesionales; y el ' +
          'reconocimiento de logros y contribuciones significativas por pares, entidades públicas u ' +
          'organizaciones profesionales. Meridian sólo ve el recuento de experiencia. USCIS aplica después una ' +
          'valoración final independiente, y 8 U.S.C. § 1153(b)(2)(C) dispone que un título o una licencia no ' +
          'bastan por sí solos como prueba de capacidad excepcional.',
      },
    },
    {
      id: 'us-eb2-labor-certification',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-212-a-5-a',
        'us-eb-cfr-204-5-k-4-i',
        'us-eb-cfr-656-1',
        'us-eb-cfr-656-17',
        'us-eb-cfr-656-5',
        'us-eb-cfr-656-30',
      ],
      label: {
        en:
          'An individual permanent labor certification from the Department of Labor, or a Schedule A ' +
          'designation, covering a permanent full-time job with a United States employer',
        es:
          'Certificación laboral permanente individual del Departamento de Trabajo, o designación del Anexo A, ' +
          'referida a un puesto permanente a tiempo completo con un empleador estadounidense',
      },
      evaluator: permanentUnitedStatesJobOffer,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Whether the Department of Labor has certified this job is not a fact about the applicant and ' +
          'Meridian does not hold it. Before filing, the employer must have tested the United States labour ' +
          'market: for a professional occupation that means a 30-day State Workforce Agency job order and two ' +
          'Sunday newspaper advertisements, each run at least 30 and no more than 180 days before filing, plus ' +
          'three further recruitment steps, all within the six months before filing. The job requirements must ' +
          'be those normally required for the occupation unless business necessity is documented, and must be ' +
          'the employer’s actual minimum requirements. A granted certification then expires if it is not filed ' +
          'with the immigrant petition within 180 calendar days.',
        es:
          'Que el Departamento de Trabajo haya certificado este puesto no es un dato de la persona solicitante ' +
          'y Meridian no lo conserva. Antes de presentar la petición, el empleador debe haber puesto a prueba ' +
          'el mercado laboral estadounidense: para una ocupación profesional, ello supone una oferta de 30 ' +
          'días ante la agencia estatal de empleo y dos anuncios dominicales en prensa, cada uno publicado al ' +
          'menos 30 días antes y no más de 180 antes de la presentación, más otras tres actuaciones de ' +
          'reclutamiento, todo dentro de los seis meses previos. Los requisitos del puesto deben ser los ' +
          'normalmente exigidos para la ocupación, salvo necesidad empresarial documentada, y han de ser los ' +
          'mínimos reales del empleador. Una certificación concedida caduca si no se presenta junto con la ' +
          'petición de inmigrante dentro de 180 días naturales.',
      },
      guidance: {
        en:
          'Two alternatives to the ordinary process exist. Schedule A, Group I covers physical therapists and ' +
          'professional nurses meeting the stated conditions; Group II covers aliens of exceptional ability in ' +
          'the sciences or arts, including college and university teachers, and separately in the performing ' +
          'arts. A Schedule A application is filed with DHS rather than with the Department of Labor, and that ' +
          'determination is conclusive and final with no appeal. The priority date also moves: with an ' +
          'ordinary certification it is the day the Department of Labor accepted the application, while with a ' +
          'Schedule A application it is the day the petition was properly filed with USCIS.',
        es:
          'Existen dos alternativas al procedimiento ordinario. El Grupo I del Anexo A cubre a fisioterapeutas ' +
          'y a personal de enfermería profesional que cumpla las condiciones señaladas; el Grupo II cubre a ' +
          'personas con capacidad excepcional en las ciencias o las artes, incluido el profesorado ' +
          'universitario, y por separado en las artes escénicas. La solicitud del Anexo A se presenta ante el ' +
          'DHS y no ante el Departamento de Trabajo, y esa resolución es concluyente y firme, sin recurso. La ' +
          'fecha de prioridad también cambia: con una certificación ordinaria es el día en que el ' +
          'Departamento de Trabajo admitió la solicitud, mientras que con una solicitud del Anexo A es el día ' +
          'de la presentación correcta de la petición ante USCIS.',
      },
    },
    {
      id: 'us-eb2-bona-fide-job-opportunity',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-eb-cfr-656-17'],
      label: {
        en:
          'The job opportunity is genuinely open to United States workers rather than shaped around the ' +
          'applicant',
        es:
          'El puesto está realmente abierto a personas trabajadoras estadounidenses y no configurado a la ' +
          'medida de la persona solicitante',
      },
      evaluator: { op: 'is_false', path: 'jobOffer.selfEmployment' },
      humanReviewWhen: selfEmploymentRecorded,
      humanReviewReason: {
        en:
          'Self-employment has been recorded. Under 20 CFR 656.17(l), where the applicant has an ownership ' +
          'interest in the employer, is related to its owners, or is one of a small number of employees, the ' +
          'employer must be able to demonstrate on audit that a bona fide job opportunity exists that is ' +
          'available to all United States workers, and must produce the incorporation documents, the ownership ' +
          'and family relationships, the financial history including each person’s investment, and the names ' +
          'of those who control hiring. Whether the opportunity is genuine is a Department of Labor finding.',
        es:
          'Consta trabajo por cuenta propia. Conforme a 20 CFR 656.17(l), cuando la persona solicitante tiene ' +
          'participación en la propiedad del empleador, está emparentada con sus titulares o es uno de un ' +
          'reducido número de empleados, el empleador debe poder demostrar en auditoría que existe un puesto ' +
          'de buena fe disponible para todas las personas trabajadoras estadounidenses, y aportar la ' +
          'escritura de constitución, las relaciones de propiedad y de parentesco, el historial financiero con ' +
          'la inversión de cada persona y los nombres de quienes controlan la contratación. Que el puesto sea ' +
          'genuino es una apreciación del Departamento de Trabajo.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-cfr-656-30',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The second preference takes not more than 28.6 per cent of the worldwide employment-based level, plus ' +
        'numbers unused by the first preference, and 8 U.S.C. § 1152(a)(2) caps any single foreign state at 7 ' +
        'per cent of the combined preference totals. Where a labor certification is required the priority date ' +
        'is the day the Department of Labor accepted the certification application, not the day the immigrant ' +
        'petition was filed, so the queue starts earlier than most people expect. Visas issue in priority-date ' +
        'order. Chargeability follows place of birth. The Department of State publishes cut-offs monthly and ' +
        'currently treats Mexico as one of four oversubscribed chargeability areas alongside China ' +
        '(mainland-born), India and the Philippines. Meridian records no cut-off date, no queue position and ' +
        'no waiting time.',
      es:
        'La segunda preferencia toma como máximo el 28,6 por ciento del límite mundial por empleo, más los ' +
        'números no utilizados por la primera, y 8 U.S.C. § 1152(a)(2) limita a cualquier Estado extranjero al ' +
        '7 por ciento del total combinado de preferencias. Cuando se exige certificación laboral, la fecha de ' +
        'prioridad es el día en que el Departamento de Trabajo admitió la solicitud de certificación, y no el ' +
        'día de presentación de la petición de inmigrante, de modo que la fila empieza antes de lo que suele ' +
        'suponerse. Las visas se emiten por orden de fecha de prioridad. La imputación sigue el lugar de ' +
        'nacimiento. El Departamento de Estado publica mensualmente las fechas de corte y considera ' +
        'actualmente a México uno de los cuatro países con sobresuscripción, junto con China (nacidos en el ' +
        'continente), India y Filipinas. Meridian no registra fechas de corte, ni posiciones en la fila, ni ' +
        'tiempos de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-2 national interest waiver
// ---------------------------------------------------------------------------

export const usEb2NationalInterestWaiver: Pathway = {
  id: 'us-eb2-national-interest-waiver',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-2 national interest waiver — second preference with the job offer waived',
    es: 'EB-2 con dispensa por interés nacional — segunda preferencia sin oferta de empleo',
  },
  summary: {
    en:
      'The same second preference, with the requirement of a United States employer — and with it the ' +
      'permanent labor certification — waived because the Attorney General deems the waiver to be in the ' +
      'national interest. The person may petition for themselves. The waiver is purely discretionary: the ' +
      'statute supplies no standard, and the framework applied is a precedent decision, so no set of facts ' +
      'entitles anyone to it.',
    es:
      'La misma segunda preferencia, con dispensa del requisito de contar con un empleador estadounidense y, ' +
      'con él, de la certificación laboral permanente, por considerarse la dispensa de interés nacional. La ' +
      'propia persona puede presentar la petición. La dispensa es puramente discrecional: la ley no fija ' +
      'estándar alguno y el marco aplicado procede de una resolución de precedente, de modo que ningún ' +
      'conjunto de hechos da derecho a ella.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b2A,
    inaS203b2Bi,
    inaS203b2Bii,
    inaS203b2C,
    cfr2045k2AdvancedDegree,
    cfr2045k2ExceptionalAbility,
    cfr2045k3,
    cfr2045k4ii,
    inaS101a32,
    dhanasar,
    uscisPmF5,
    inaS212a5A,
  ],
  criteria: [
    {
      id: 'us-niw-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-niw-underlying-eb2-classification',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-203-b-2-a',
        'us-eb-cfr-204-5-k-2-advanced-degree',
        'us-eb-cfr-204-5-k-2-exceptional-ability',
        'us-eb-cfr-204-5-k-3',
        'us-eb-ina-203-b-2-c',
        'us-eb-uscis-pm-6-f-5',
        'us-eb-ina-101-a-32',
      ],
      label: {
        en:
          'Qualification for the second preference itself, as a member of the professions holding an advanced ' +
          'degree or as a person of exceptional ability — established before the waiver is reached at all',
        es:
          'Cumplimiento de la propia segunda preferencia, como miembro de las profesiones con título de ' +
          'posgrado o como persona con capacidad excepcional, acreditado antes de siquiera llegar a la dispensa',
      },
      // The evaluator sees the degree route only. Exceptional ability is an
      // independent way into the same classification that this model cannot
      // measure, so the criterion escalates unconditionally: a person who fails
      // the degree test has not been ruled out, they have been referred.
      evaluator: advancedDegreeOrEquivalent,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'USCIS decides the underlying classification first, and a petition that fails it is statutorily ' +
          'ineligible for the waiver whatever the endeavour. Two things must be read by a person. Whether the ' +
          'intended occupation is itself a profession requiring at least a baccalaureate for entry, because ' +
          'an advanced degree in a field whose occupation does not require one will not do. And whether ' +
          'exceptional ability is made out on at least three of the six regulatory categories followed by a ' +
          'final merits determination, which this engine cannot measure at all — so a person without an ' +
          'advanced degree has not been ruled out here.',
        es:
          'USCIS resuelve primero la clasificación de base, y una petición que no la cumple es legalmente ' +
          'inelegible para la dispensa, sea cual sea el proyecto. Una persona debe examinar dos cuestiones. Si ' +
          'la ocupación prevista es en sí una profesión que exige al menos una licenciatura para el acceso, ' +
          'pues no basta un posgrado en un campo cuya ocupación no la requiere. Y si la capacidad excepcional ' +
          'queda acreditada con al menos tres de las seis categorías reglamentarias seguidas de una valoración ' +
          'final, algo que este motor no puede medir en absoluto: por eso, quien carece de un título de ' +
          'posgrado no queda aquí excluido.',
      },
    },
    {
      id: 'us-niw-national-interest',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-203-b-2-b-i',
        'us-eb-matter-of-dhanasar',
        'us-eb-uscis-pm-6-f-5',
        'us-eb-ina-203-b-2-b-ii',
      ],
      label: {
        en:
          'The waiver of the job offer is in the national interest: a proposed endeavour of substantial merit ' +
          'and national importance, a person well positioned to advance it, and a balance favouring waiver',
        es:
          'La dispensa de la oferta de empleo es de interés nacional: un proyecto de mérito sustancial e ' +
          'importancia nacional, una persona bien situada para impulsarlo y una ponderación favorable a la ' +
          'dispensa',
      },
      // The endeavour is the whole case and it is a document, not a data point.
      // The evaluator records only whether the applicant has stated a purpose at
      // all, and the criterion always escalates.
      evaluator: { op: 'is_present', path: 'intent.declaredPurpose' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Three prongs, each decided on evidence by a preponderance, and then a separate discretionary ' +
          'judgement even when all three are met. The endeavour must have both substantial merit and national ' +
          'importance, judged on its prospective impact rather than on how much territory it covers. The ' +
          'person must be well positioned to advance it, on their education, skills, record of success, plan ' +
          'and the interest of others in it — but nobody has to show the endeavour is more likely than not to ' +
          'succeed. And on balance it must benefit the United States to waive the job offer and the labor ' +
          'certification. A checklist cannot produce that outcome, and no probability of success may be ' +
          'stated by anyone.',
        es:
          'Tres elementos, cada uno resuelto sobre la prueba conforme al estándar de probabilidad ' +
          'preponderante, y después una apreciación discrecional independiente aun cumpliéndose los tres. El ' +
          'proyecto debe tener a la vez mérito sustancial e importancia nacional, valorada por su impacto ' +
          'prospectivo y no por la extensión territorial que abarque. La persona debe estar bien situada para ' +
          'impulsarlo, atendiendo a su formación, aptitudes, historial de éxitos, plan e interés que despierta ' +
          'en terceros, sin que se exija demostrar que el proyecto vaya a prosperar. Y, en conjunto, debe ' +
          'beneficiar a los Estados Unidos dispensar la oferta de empleo y la certificación laboral. Una lista ' +
          'de comprobación no puede producir ese resultado, y nadie puede enunciar una probabilidad de éxito.',
      },
      guidance: {
        en:
          'One branch of the waiver is not discretionary. Under 8 U.S.C. § 1153(b)(2)(B)(ii) the Attorney ' +
          'General SHALL grant a waiver to a physician who agrees to work full time in an area the Secretary ' +
          'of Health and Human Services has designated as having a shortage of health care professionals, or ' +
          'at a Department of Veterans Affairs facility, where a federal agency or a State department of ' +
          'public health has already determined the work to be in the public interest. The price is a service ' +
          'condition: no immigrant visa may issue and no adjustment may be granted until the physician has ' +
          'worked full time as a physician for an aggregate of five years, not counting time held in J status.',
        es:
          'Una rama de la dispensa no es discrecional. Conforme a 8 U.S.C. § 1153(b)(2)(B)(ii), el Fiscal ' +
          'General DEBERÁ concederla a la persona médica que se comprometa a trabajar a tiempo completo en una ' +
          'zona designada por la Secretaría de Salud y Servicios Humanos como carente de profesionales ' +
          'sanitarios, o en un centro del Departamento de Asuntos de Veteranos, cuando una agencia federal o ' +
          'un departamento estatal de salud pública ya haya determinado que ese trabajo es de interés ' +
          'público. El precio es una condición de servicio: no se emitirá visa de inmigrante ni se concederá ' +
          'ajuste de estatus hasta que haya trabajado a tiempo completo como médica durante un total de cinco ' +
          'años, sin computar el tiempo en estatus J.',
      },
    },
    {
      id: 'us-niw-no-job-offer-or-labor-certification',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-eb-ina-203-b-2-b-i', 'us-eb-cfr-204-5-k-4-ii', 'us-eb-ina-212-a-5-a'],
      label: {
        en:
          'If the waiver is granted, neither a United States employer nor a permanent labor certification is ' +
          'required, and the person may petition for themselves',
        es:
          'Concedida la dispensa, no se exige empleador estadounidense ni certificación laboral permanente, y ' +
          'la propia persona puede presentar la petición',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      guidance: {
        en:
          'This is the only route out of the labor certification inside the second and third preferences. ' +
          '§ 1153(b)(2)(B)(i) waives the requirement in subparagraph (A) that services be sought by a United ' +
          'States employer; because the certification exists to test the market for a specific job offer, ' +
          'removing the offer removes the certification with it. 8 CFR 204.5(k)(1) then lets the person, or ' +
          'anyone on their behalf, be the petitioner. One wrinkle worth knowing: the regulation at ' +
          '204.5(k)(4)(ii) still speaks only of aliens of exceptional ability, while the statute waives the ' +
          'subparagraph (A) requirements generally and USCIS applies the waiver to advanced degree ' +
          'professionals as well. The regulation has not been conformed, so read it alongside the statute and ' +
          'the Policy Manual rather than on its own.',
        es:
          'Ésta es la única salida de la certificación laboral dentro de la segunda y la tercera preferencia. ' +
          'El § 1153(b)(2)(B)(i) dispensa el requisito del apartado (A) de que los servicios sean requeridos ' +
          'por un empleador estadounidense; como la certificación existe para examinar el mercado respecto de ' +
          'una oferta concreta, suprimir la oferta suprime con ella la certificación. 8 CFR 204.5(k)(1) ' +
          'permite entonces que la propia persona, o cualquiera en su nombre, sea la peticionaria. Conviene ' +
          'conocer un matiz: el reglamento, en 204.5(k)(4)(ii), sigue refiriéndose sólo a personas con ' +
          'capacidad excepcional, mientras que la ley dispensa con carácter general los requisitos del ' +
          'apartado (A) y USCIS aplica la dispensa también a profesionales con título de posgrado. El ' +
          'reglamento no se ha adaptado, así que debe leerse junto con la ley y el Manual de Políticas, y no ' +
          'de forma aislada.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The waiver removes the labor certification, not the queue. This is still the second preference, still ' +
        'limited to not more than 28.6 per cent of the worldwide employment-based level, and still subject to ' +
        'the 7 per cent per-country cap. Because no labor certification is involved, the priority date is the ' +
        'day the petition was properly filed with USCIS. Chargeability follows place of birth, and the ' +
        'Department of State currently treats Mexico as one of four oversubscribed chargeability areas, so a ' +
        'granted waiver can still be followed by a wait that differs by chargeability. No cut-off date and no ' +
        'waiting time is recorded here.',
      es:
        'La dispensa elimina la certificación laboral, no la fila. Sigue siendo la segunda preferencia, sigue ' +
        'limitada a un máximo del 28,6 por ciento del límite mundial por empleo y sigue sujeta al tope del 7 ' +
        'por ciento por país. Al no intervenir certificación laboral, la fecha de prioridad es el día de la ' +
        'presentación correcta de la petición ante USCIS. La imputación sigue el lugar de nacimiento y el ' +
        'Departamento de Estado considera actualmente a México uno de los cuatro países con sobresuscripción, ' +
        'de modo que a una dispensa concedida puede seguirle una espera distinta según la imputación. Aquí no ' +
        'se registra ninguna fecha de corte ni tiempo de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-3 — skilled workers
// ---------------------------------------------------------------------------

export const usEb3SkilledWorker: Pathway = {
  id: 'us-eb3-skilled-worker',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-3 — Employment third preference: skilled worker',
    es: 'EB-3 — Tercera preferencia por empleo: persona trabajadora cualificada',
  },
  summary: {
    en:
      'Permanent residence for a person capable of performing skilled labor requiring at least two years of ' +
      'training or experience, in a permanent job with a United States employer for which qualified United ' +
      'States workers are not available. A permanent labor certification from the Department of Labor is ' +
      'required, and no immigrant visa may be issued until the consular officer has it.',
    es:
      'Residencia permanente para quien pueda desempeñar un trabajo cualificado que exija al menos dos años de ' +
      'formación o experiencia, en un puesto permanente con un empleador estadounidense para el que no haya ' +
      'personas trabajadoras estadounidenses cualificadas disponibles. Se exige certificación laboral ' +
      'permanente del Departamento de Trabajo, y no puede emitirse visa de inmigrante hasta que el funcionario ' +
      'consular disponga de ella.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b3A,
    inaS203b3C,
    inaS204a1F,
    cfr2045l,
    inaS212a5A,
    cfr6561,
    cfr65617,
    cfr6565,
    cfr65630,
  ],
  criteria: [
    {
      id: 'us-eb3-skilled-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb3-skilled-two-years-training-or-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-3-a', 'us-eb-cfr-204-5-l'],
      label: {
        en: 'Capable of performing skilled labor requiring at least two years of training or experience',
        es:
          'Capacidad para desempeñar un trabajo cualificado que exija al menos dos años de formación o ' +
          'experiencia',
      },
      // Two years is the statutory line between this sub-category and the other
      // workers sub-category, so a recorded figure below it is a real failure of
      // *this* record and the reader is pointed at the other one. A figure at or
      // above it escalates, because the two years must match what the certified
      // job actually requires.
      evaluator: twoYearsTrainingOrExperience,
      humanReviewWhen: twoYearsTrainingOrExperience,
      humanReviewReason: {
        en:
          'The two years belong to the job, not to the worker. 8 CFR 204.5(l)(4) says the skilled or other ' +
          'worker question is decided on the training and experience the employer places on the job AS ' +
          'CERTIFIED BY THE DEPARTMENT OF LABOR, and 20 CFR 656.17(i) requires those to be the employer’s ' +
          'actual minimum requirements rather than requirements written around one candidate. A person must ' +
          'compare the certified requirements against the employer letters. Relevant post-secondary education ' +
          'may count as training.',
        es:
          'Los dos años son del puesto, no de la persona. 8 CFR 204.5(l)(4) dispone que la distinción entre ' +
          'trabajo cualificado y no cualificado se resuelve por la formación y experiencia que el empleador ' +
          'fija para el puesto SEGÚN LO CERTIFICADO POR EL DEPARTAMENTO DE TRABAJO, y 20 CFR 656.17(i) exige ' +
          'que sean los requisitos mínimos reales del empleador y no requisitos redactados a la medida de una ' +
          'candidatura. Una persona debe cotejar los requisitos certificados con las cartas de los ' +
          'empleadores. La educación postsecundaria pertinente puede computar como formación.',
      },
      guidance: {
        en:
          'If the job requires less than two years of training or experience, this is not the right ' +
          'sub-category; the other workers sub-category is, and it carries a separate annual limit of 10,000 ' +
          'visas.',
        es:
          'Si el puesto exige menos de dos años de formación o experiencia, ésta no es la subcategoría ' +
          'correcta: lo es la de personas trabajadoras no cualificadas, que además tiene su propio límite ' +
          'anual de 10.000 visas.',
      },
    },
    {
      id: 'us-eb3-skilled-permanent-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-3-a', 'us-eb-ina-204-a-1-f', 'us-eb-cfr-204-5-l'],
      label: {
        en: 'A permanent full-time job with a United States employer, not temporary and not seasonal',
        es:
          'Un puesto permanente a tiempo completo con un empleador estadounidense, no temporal y no de ' +
          'temporada',
      },
      evaluator: permanentUnitedStatesJobOffer,
      guidance: {
        en:
          'The statute excludes labor of a temporary or seasonal nature from every third-preference ' +
          'sub-category. There is no waiver of the employer requirement anywhere in the third preference: the ' +
          'national interest waiver reaches only the second.',
        es:
          'La ley excluye de todas las subcategorías de la tercera preferencia el trabajo de naturaleza ' +
          'temporal o de temporada. En la tercera preferencia no existe dispensa alguna del requisito de ' +
          'empleador: la dispensa por interés nacional sólo alcanza a la segunda.',
      },
    },
    {
      id: 'us-eb3-skilled-labor-certification',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-212-a-5-a',
        'us-eb-ina-203-b-3-c',
        'us-eb-cfr-204-5-l',
        'us-eb-cfr-656-1',
        'us-eb-cfr-656-17',
        'us-eb-cfr-656-5',
        'us-eb-cfr-656-30',
      ],
      label: {
        en:
          'A permanent labor certification from the Department of Labor, or a Schedule A designation, for this ' +
          'job',
        es:
          'Certificación laboral permanente del Departamento de Trabajo, o designación del Anexo A, para este ' +
          'puesto',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Whether the Department of Labor has certified this job is not a fact about the applicant. The ' +
          'employer must first have tested the United States labour market and be able to show it on audit, ' +
          'and 8 U.S.C. § 1153(b)(3)(C) makes the certification a precondition of visa issuance and not merely ' +
          'of the petition: no immigrant visa may be issued until the consular officer is in receipt of the ' +
          'Secretary of Labor’s determination. A granted certification expires if it is not filed in support ' +
          'of the immigrant petition within 180 calendar days, and it is valid only for that job, that person ' +
          'and that area of intended employment.',
        es:
          'Que el Departamento de Trabajo haya certificado este puesto no es un dato de la persona ' +
          'solicitante. El empleador debe haber examinado antes el mercado laboral estadounidense y poder ' +
          'acreditarlo en auditoría, y 8 U.S.C. § 1153(b)(3)(C) convierte la certificación en condición previa ' +
          'de la emisión de la visa y no sólo de la petición: no puede emitirse visa de inmigrante hasta que ' +
          'el funcionario consular reciba la resolución del Secretario de Trabajo. Una certificación concedida ' +
          'caduca si no se presenta en apoyo de la petición de inmigrante dentro de 180 días naturales, y sólo ' +
          'vale para ese puesto, esa persona y esa área de empleo prevista.',
      },
    },
    {
      id: 'us-eb3-skilled-bona-fide-job-opportunity',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-eb-cfr-656-17'],
      label: {
        en: 'The job opportunity is genuinely open to United States workers',
        es: 'El puesto está realmente abierto a personas trabajadoras estadounidenses',
      },
      evaluator: { op: 'is_false', path: 'jobOffer.selfEmployment' },
      humanReviewWhen: selfEmploymentRecorded,
      humanReviewReason: {
        en:
          'Self-employment has been recorded. Under 20 CFR 656.17(l) an ownership interest, a family ' +
          'relationship with the owners, or being one of a small number of employees obliges the employer to ' +
          'demonstrate on audit that a bona fide job opportunity exists and is available to all United States ' +
          'workers, with the corporate, ownership and financial documentation the paragraph lists.',
        es:
          'Consta trabajo por cuenta propia. Conforme a 20 CFR 656.17(l), una participación en la propiedad, ' +
          'un parentesco con los titulares o ser uno de un reducido número de empleados obliga al empleador a ' +
          'demostrar en auditoría que existe un puesto de buena fe disponible para todas las personas ' +
          'trabajadoras estadounidenses, con la documentación societaria, de propiedad y financiera que el ' +
          'apartado enumera.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-cfr-656-30',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The third preference takes not more than 28.6 per cent of the worldwide employment-based level, plus ' +
        'numbers unused by the first and second, and no single foreign state may take more than 7 per cent of ' +
        'the combined preference totals. The priority date is the day the Department of Labor accepted the ' +
        'labor certification application, and visas issue in that order. Chargeability follows place of birth. ' +
        'The Department of State currently treats Mexico as one of four oversubscribed chargeability areas ' +
        'alongside China (mainland-born), India and the Philippines, so a Mexican-chargeability applicant can ' +
        'wait materially longer than someone of another chargeability with the same priority date. No cut-off ' +
        'date, queue position or waiting time is recorded here.',
      es:
        'La tercera preferencia toma como máximo el 28,6 por ciento del límite mundial por empleo, más los ' +
        'números no utilizados por la primera y la segunda, y ningún Estado extranjero puede tomar más del 7 ' +
        'por ciento del total combinado de preferencias. La fecha de prioridad es el día en que el ' +
        'Departamento de Trabajo admitió la solicitud de certificación laboral, y las visas se emiten en ese ' +
        'orden. La imputación sigue el lugar de nacimiento. El Departamento de Estado considera actualmente a ' +
        'México uno de los cuatro países con sobresuscripción, junto con China (nacidos en el continente), ' +
        'India y Filipinas, de modo que una persona imputada a México puede esperar bastante más que otra de ' +
        'distinta imputación con la misma fecha de prioridad. Aquí no se registra ninguna fecha de corte, ' +
        'posición en la fila ni tiempo de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-3 — professionals
// ---------------------------------------------------------------------------

export const usEb3Professional: Pathway = {
  id: 'us-eb3-professional',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-3 — Employment third preference: professional',
    es: 'EB-3 — Tercera preferencia por empleo: profesional',
  },
  summary: {
    en:
      'Permanent residence for a person who holds a baccalaureate degree and is a member of the professions, ' +
      'in a permanent job with a United States employer for which the certified minimum requirement is that ' +
      'degree. A permanent labor certification is required. This sub-category is for people who do not qualify ' +
      'for the second preference: an advanced degree or exceptional ability belongs there instead.',
    es:
      'Residencia permanente para quien posea una licenciatura y sea miembro de las profesiones, en un puesto ' +
      'permanente con un empleador estadounidense cuyo requisito mínimo certificado sea ese título. Se exige ' +
      'certificación laboral permanente. Esta subcategoría es para quienes no cumplen la segunda preferencia: ' +
      'un título de posgrado o la capacidad excepcional corresponden a aquélla.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b3A,
    inaS203b3C,
    inaS204a1F,
    cfr2045l,
    inaS101a32,
    inaS212a5A,
    cfr6561,
    cfr65617,
    cfr6565,
    cfr65630,
  ],
  criteria: [
    {
      id: 'us-eb3-professional-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb3-professional-baccalaureate',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-3-a', 'us-eb-cfr-204-5-l', 'us-eb-ina-101-a-32'],
      label: {
        en: 'A United States baccalaureate degree or a foreign equivalent degree, and membership of the professions',
        es: 'Una licenciatura estadounidense o un título extranjero equivalente, y pertenencia a las profesiones',
      },
      // The degree is the definition of this sub-category, so a recorded level
      // below baccalaureate is a genuine failure of this record — and points the
      // reader at the skilled worker sub-category, which needs no degree.
      evaluator: baccalaureateHeld,
      humanReviewWhen: baccalaureateHeld,
      humanReviewReason: {
        en:
          'Holding the degree is necessary and not sufficient. The petition must also show that the person is ' +
          'a member of the professions, which is proved by showing that a baccalaureate is the MINIMUM ' +
          'REQUIREMENT FOR ENTRY into the occupation, and the job offer portion of the labor certification ' +
          'must itself demonstrate that the job requires that minimum. A foreign degree must be shown to be ' +
          'equivalent. None of that can be read from a recorded education level.',
        es:
          'Poseer el título es necesario pero no suficiente. La petición debe acreditar además que la persona ' +
          'es miembro de las profesiones, lo que se demuestra probando que una licenciatura es el REQUISITO ' +
          'MÍNIMO DE ACCESO a la ocupación, y la parte de oferta de empleo de la certificación laboral debe ' +
          'demostrar que el puesto exige ese mínimo. Un título extranjero debe acreditarse como equivalente. ' +
          'Nada de ello puede deducirse de un nivel educativo registrado.',
      },
      guidance: {
        en:
          'The professions are not a closed list: 8 U.S.C. § 1101(a)(32) names architects, engineers, lawyers, ' +
          'physicians, surgeons and teachers in schools, colleges, academies or seminaries, and says the term ' +
          'is not limited to them, while 8 CFR 204.5(k)(2) extends it to any occupation for which a ' +
          'baccalaureate or foreign equivalent is the minimum requirement for entry.',
        es:
          'Las profesiones no forman una lista cerrada: 8 U.S.C. § 1101(a)(32) menciona a arquitectos, ' +
          'ingenieros, abogados, médicos, cirujanos y docentes de escuelas, colegios, academias o seminarios, ' +
          'y precisa que el término no se limita a ellos, mientras que 8 CFR 204.5(k)(2) lo extiende a toda ' +
          'ocupación para cuyo acceso se exija como mínimo una licenciatura o su equivalente extranjero.',
      },
    },
    {
      id: 'us-eb3-professional-permanent-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-3-a', 'us-eb-ina-204-a-1-f', 'us-eb-cfr-204-5-l'],
      label: {
        en: 'A permanent full-time job with a United States employer, not temporary and not seasonal',
        es:
          'Un puesto permanente a tiempo completo con un empleador estadounidense, no temporal y no de ' +
          'temporada',
      },
      evaluator: permanentUnitedStatesJobOffer,
      guidance: {
        en:
          'There is no waiver of the employer requirement in the third preference. Someone with an advanced ' +
          'degree who wants to petition without an employer is looking at the second preference national ' +
          'interest waiver, which is a different record and a discretionary one.',
        es:
          'En la tercera preferencia no existe dispensa del requisito de empleador. Quien posea un título de ' +
          'posgrado y quiera peticionar sin empleador debe mirar la dispensa por interés nacional de la ' +
          'segunda preferencia, que es un registro distinto y de carácter discrecional.',
      },
    },
    {
      id: 'us-eb3-professional-labor-certification',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-212-a-5-a',
        'us-eb-ina-203-b-3-c',
        'us-eb-cfr-204-5-l',
        'us-eb-cfr-656-1',
        'us-eb-cfr-656-17',
        'us-eb-cfr-656-5',
        'us-eb-cfr-656-30',
      ],
      label: {
        en:
          'A permanent labor certification from the Department of Labor, or a Schedule A designation, whose ' +
          'job offer portion requires a baccalaureate as the minimum',
        es:
          'Certificación laboral permanente del Departamento de Trabajo, o designación del Anexo A, cuya parte ' +
          'de oferta de empleo exija como mínimo una licenciatura',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The certification is a Department of Labor determination, and for a professional occupation the ' +
          'recruitment is the full pre-filing sequence: a 30-day State Workforce Agency job order and two ' +
          'Sunday newspaper advertisements run at least 30 and no more than 180 days before filing, plus three ' +
          'further steps, all inside the six months before filing. Where the job requires experience and an ' +
          'advanced degree, one Sunday advertisement may be replaced by one in the most relevant professional ' +
          'journal. 8 U.S.C. § 1153(b)(3)(C) then makes the certification a precondition of visa issuance.',
        es:
          'La certificación es una resolución del Departamento de Trabajo y, para una ocupación profesional, ' +
          'el reclutamiento es la secuencia previa completa: una oferta de 30 días ante la agencia estatal de ' +
          'empleo y dos anuncios dominicales en prensa publicados al menos 30 días antes y no más de 180 antes ' +
          'de la presentación, más otras tres actuaciones, todo dentro de los seis meses previos. Si el puesto ' +
          'exige experiencia y un título de posgrado, uno de los anuncios dominicales puede sustituirse por ' +
          'otro en la revista profesional más pertinente. 8 U.S.C. § 1153(b)(3)(C) convierte después la ' +
          'certificación en condición previa de la emisión de la visa.',
      },
    },
    {
      id: 'us-eb3-professional-bona-fide-job-opportunity',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-eb-cfr-656-17'],
      label: {
        en: 'The job opportunity is genuinely open to United States workers',
        es: 'El puesto está realmente abierto a personas trabajadoras estadounidenses',
      },
      evaluator: { op: 'is_false', path: 'jobOffer.selfEmployment' },
      humanReviewWhen: selfEmploymentRecorded,
      humanReviewReason: {
        en:
          'Self-employment has been recorded, which triggers the bona fide job opportunity documentation in ' +
          '20 CFR 656.17(l): the employer must show on audit that the job is genuinely available to all United ' +
          'States workers, with the corporate, ownership, family and financial documentation the paragraph ' +
          'requires.',
        es:
          'Consta trabajo por cuenta propia, lo que activa la documentación de puesto de buena fe del 20 CFR ' +
          '656.17(l): el empleador debe demostrar en auditoría que el puesto está realmente disponible para ' +
          'todas las personas trabajadoras estadounidenses, con la documentación societaria, de propiedad, de ' +
          'parentesco y financiera que el apartado exige.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-cfr-656-30',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The third preference is numerically limited to not more than 28.6 per cent of the worldwide ' +
        'employment-based level plus numbers unused by the first and second preferences, with a 7 per cent ' +
        'per-country cap. The priority date is the day the Department of Labor accepted the certification ' +
        'application. Chargeability follows place of birth, and the Department of State currently treats ' +
        'Mexico as one of four oversubscribed chargeability areas. No cut-off date or waiting time is recorded ' +
        'here; the current Visa Bulletin is the only place to read one.',
      es:
        'La tercera preferencia está limitada a un máximo del 28,6 por ciento del límite mundial por empleo, ' +
        'más los números no utilizados por la primera y la segunda, con un tope del 7 por ciento por país. La ' +
        'fecha de prioridad es el día en que el Departamento de Trabajo admitió la solicitud de certificación. ' +
        'La imputación sigue el lugar de nacimiento y el Departamento de Estado considera actualmente a México ' +
        'uno de los cuatro países con sobresuscripción. Aquí no se registra fecha de corte ni tiempo de ' +
        'espera; el único lugar donde consultarlos es el Boletín de Visas vigente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-3 — other (unskilled) workers
// ---------------------------------------------------------------------------

export const usEb3OtherWorker: Pathway = {
  id: 'us-eb3-other-worker',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-3 — Employment third preference: other (unskilled) worker',
    es: 'EB-3 — Tercera preferencia por empleo: persona trabajadora no cualificada',
  },
  summary: {
    en:
      'Permanent residence for a person capable of performing unskilled labor — work the certified job ' +
      'requires less than two years of training or experience to do — that is not temporary or seasonal and ' +
      'for which qualified United States workers are not available. A permanent labor certification is ' +
      'required, and this sub-category carries its own annual limit of 10,000 visas inside an already limited ' +
      'preference.',
    es:
      'Residencia permanente para quien pueda desempeñar un trabajo no cualificado —aquel para el que el ' +
      'puesto certificado exige menos de dos años de formación o experiencia—, que no sea temporal ni de ' +
      'temporada y para el que no haya personas trabajadoras estadounidenses cualificadas disponibles. Se ' +
      'exige certificación laboral permanente, y esta subcategoría tiene su propio límite anual de 10.000 ' +
      'visas dentro de una preferencia ya limitada.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b3A,
    inaS203b3B,
    inaS203b3C,
    inaS204a1F,
    cfr2045l,
    inaS212a5A,
    cfr6561,
    cfr65617,
    cfr65630,
  ],
  criteria: [
    {
      id: 'us-eb3-other-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb3-other-permanent-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-3-a', 'us-eb-ina-204-a-1-f', 'us-eb-cfr-204-5-l'],
      label: {
        en: 'A permanent full-time job with a United States employer, not temporary and not seasonal',
        es:
          'Un puesto permanente a tiempo completo con un empleador estadounidense, no temporal y no de ' +
          'temporada',
      },
      // Nothing here tests the applicant's own training, and that is deliberate.
      // 8 CFR 204.5(l)(4) locates the skilled/unskilled question in the job's
      // certified requirements, so a criterion measuring the worker's years
      // would be measuring the wrong thing in the wrong direction.
      evaluator: permanentUnitedStatesJobOffer,
      guidance: {
        en:
          'The statute excludes temporary and seasonal labor from this sub-category as it does from the other ' +
          'two. Seasonal agricultural and other short-term work is the province of the temporary nonimmigrant ' +
          'classifications, which are not encoded here.',
        es:
          'La ley excluye de esta subcategoría, como de las otras dos, el trabajo temporal y de temporada. El ' +
          'trabajo agrícola de temporada y otros trabajos de corta duración corresponden a las clasificaciones ' +
          'temporales de no inmigrante, que no se recogen aquí.',
      },
    },
    {
      id: 'us-eb3-other-labor-certification',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: [
        'us-eb-ina-212-a-5-a',
        'us-eb-ina-203-b-3-c',
        'us-eb-cfr-204-5-l',
        'us-eb-cfr-656-1',
        'us-eb-cfr-656-17',
        'us-eb-cfr-656-30',
      ],
      label: {
        en: 'A permanent labor certification from the Department of Labor for this job',
        es: 'Certificación laboral permanente del Departamento de Trabajo para este puesto',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The certification is a Department of Labor determination that there are not sufficient United ' +
          'States workers able, willing, qualified and available for this job at this place, and that the ' +
          'employment will not adversely affect the wages and working conditions of United States workers ' +
          'similarly employed. Meridian cannot know whether it was applied for, granted, or has expired — a ' +
          'granted certification lapses if it is not filed with the immigrant petition within 180 calendar ' +
          'days. 8 U.S.C. § 1153(b)(3)(C) makes it a precondition of visa issuance.',
        es:
          'La certificación es una resolución del Departamento de Trabajo según la cual no hay suficientes ' +
          'personas trabajadoras estadounidenses aptas, dispuestas, cualificadas y disponibles para este ' +
          'puesto en ese lugar, y el empleo no perjudicará los salarios ni las condiciones de trabajo de ' +
          'quienes desempeñan empleos similares en los Estados Unidos. Meridian no puede saber si se solicitó, ' +
          'si se concedió o si ha caducado: una certificación concedida decae si no se presenta junto con la ' +
          'petición de inmigrante dentro de 180 días naturales. 8 U.S.C. § 1153(b)(3)(C) la convierte en ' +
          'condición previa de la emisión de la visa.',
      },
    },
    {
      id: 'us-eb3-other-bona-fide-job-opportunity',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-eb-cfr-656-17'],
      label: {
        en: 'The job opportunity is genuinely open to United States workers',
        es: 'El puesto está realmente abierto a personas trabajadoras estadounidenses',
      },
      evaluator: { op: 'is_false', path: 'jobOffer.selfEmployment' },
      humanReviewWhen: selfEmploymentRecorded,
      humanReviewReason: {
        en:
          'Self-employment has been recorded, which triggers the bona fide job opportunity documentation in ' +
          '20 CFR 656.17(l).',
        es:
          'Consta trabajo por cuenta propia, lo que activa la documentación de puesto de buena fe del 20 CFR ' +
          '656.17(l).',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-b-3-b',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-cfr-656-30',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'This sub-category has a limit of its own on top of every other limit. 8 U.S.C. § 1153(b)(3)(B) ' +
        'provides that not more than 10,000 of the third-preference visas available in any fiscal year may go ' +
        'to other workers, inside a preference already capped at 28.6 per cent of the worldwide level and ' +
        'inside the 7 per cent per-country cap. The priority date is the day the Department of Labor accepted ' +
        'the certification application. Chargeability follows place of birth, and the Department of State ' +
        'currently treats Mexico as one of four oversubscribed chargeability areas. Meridian records no ' +
        'cut-off date and no waiting time; both must be read in the current Visa Bulletin, and the ' +
        'combination of limits here is the reason the figures are worth reading rather than assuming.',
      es:
        'Esta subcategoría tiene un límite propio que se suma a todos los demás. 8 U.S.C. § 1153(b)(3)(B) ' +
        'dispone que no más de 10.000 de las visas de tercera preferencia disponibles en un ejercicio fiscal ' +
        'pueden destinarse a personas trabajadoras no cualificadas, dentro de una preferencia ya limitada al ' +
        '28,6 por ciento del límite mundial y del tope del 7 por ciento por país. La fecha de prioridad es el ' +
        'día en que el Departamento de Trabajo admitió la solicitud de certificación. La imputación sigue el ' +
        'lugar de nacimiento y el Departamento de Estado considera actualmente a México uno de los cuatro ' +
        'países con sobresuscripción. Meridian no registra fechas de corte ni tiempos de espera; ambos deben ' +
        'consultarse en el Boletín de Visas vigente, y la acumulación de límites es precisamente la razón por ' +
        'la que conviene leer las cifras en lugar de suponerlas.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-4 — special immigrants, through the religious worker sub-class
// ---------------------------------------------------------------------------

/**
 * The fourth preference is a container, not a route.
 *
 * § 1153(b)(4) allots 7.1 per cent of the worldwide level to "qualified special
 * immigrants described in section 1101(a)(27) other than those described in
 * subparagraph (A) or (B)" — a list of unrelated classes assembled by Congress
 * over decades: religious workers, long-serving United States Government
 * employees abroad, Panama Canal employees, certain physicians licensed before
 * 1978, relatives of international organisation officers, certain juveniles,
 * armed forces members, and witnesses, among others. They share a visa
 * allocation and nothing else.
 *
 * Only the religious worker sub-class is encoded here, because it is the one
 * with a self-contained regulatory test at 8 CFR 204.5(m) that a person could
 * meaningfully check. The special immigrant juvenile class at
 * § 1101(a)(27)(J) is deliberately NOT encoded: it turns on findings a state
 * juvenile court makes about abuse, neglect or abandonment, it concerns
 * children at risk, and a self-serve checker is the wrong instrument for it.
 * Anyone whose situation may fall in that class needs a licensed attorney or a
 * representative accredited by the Department of Justice, not this record.
 */
export const usEb4SpecialImmigrantReligiousWorker: Pathway = {
  id: 'us-eb4-special-immigrant-religious-worker',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-4 — Employment fourth preference: special immigrant religious worker',
    es: 'EB-4 — Cuarta preferencia por empleo: inmigrante especial en trabajo religioso',
  },
  summary: {
    en:
      'Permanent residence for a person who has been a member of a religious denomination with a bona fide ' +
      'non-profit religious organisation in the United States for at least the two years immediately preceding ' +
      'the petition, has been carrying on the vocation or work continuously for those two years, and is coming ' +
      'to work for that organisation. No labor certification is involved. The minister branch is permanent; ' +
      'the two non-minister branches expire on a date Congress has repeatedly extended, and whether an ' +
      'extension is currently in force has to be checked.',
    es:
      'Residencia permanente para quien haya sido miembro de una denominación religiosa con una organización ' +
      'religiosa sin ánimo de lucro de buena fe en los Estados Unidos durante al menos los dos años ' +
      'inmediatamente anteriores a la petición, haya ejercido la vocación o el trabajo de forma continuada ' +
      'durante esos dos años y venga a trabajar para esa organización. No interviene certificación laboral. La ' +
      'rama ministerial es permanente; las dos ramas no ministeriales caducan en una fecha que el Congreso ha ' +
      'prorrogado repetidamente, y debe comprobarse si hay una prórroga vigente.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    cfr2045d,
    famNumericalLimits,
    visaBulletin,
    inaS203b4,
    inaS101a27C,
    cfr2045m,
    inaS204a1G,
    inaS212a5A,
  ],
  criteria: [
    {
      id: 'us-eb4-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb4-religious-employer-in-the-united-states',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-eb-ina-101-a-27-c', 'us-eb-cfr-204-5-m'],
      label: {
        en:
          'Coming to work for a bona fide non-profit religious organisation in the United States, or an ' +
          'affiliated tax-exempt organisation of the same denomination',
        es:
          'Venir a trabajar para una organización religiosa sin ánimo de lucro de buena fe en los Estados ' +
          'Unidos, o para una organización vinculada exenta de impuestos de la misma denominación',
      },
      evaluator: jobOfferFromUnitedStatesEmployer,
      humanReviewWhen: jobOfferFromUnitedStatesEmployer,
      humanReviewReason: {
        en:
          'Whether the organisation qualifies is a documentary question this profile cannot answer. The ' +
          'petition needs evidence that the prospective employer is a bona fide non-profit religious ' +
          'organisation, or an organisation affiliated with the denomination and exempt from taxation, ' +
          'normally proved by a current Internal Revenue Service determination letter; and evidence of how the ' +
          'person has been and will be compensated, which for salaried compensation means IRS documentation ' +
          'such as a Form W-2 or certified copies of tax returns.',
        es:
          'Si la organización cumple los requisitos es una cuestión documental que este perfil no puede ' +
          'resolver. La petición necesita prueba de que el futuro empleador es una organización religiosa sin ' +
          'ánimo de lucro de buena fe, o una organización vinculada a la denominación y exenta de impuestos, ' +
          'lo que suele acreditarse con una carta de determinación vigente del Servicio de Impuestos Internos; ' +
          'y prueba de cómo se ha retribuido y se retribuirá a la persona, lo que para la retribución salarial ' +
          'supone documentación del IRS como un formulario W-2 o copias certificadas de las declaraciones de ' +
          'impuestos.',
      },
    },
    {
      id: 'us-eb4-two-years-membership-and-continuous-work',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-eb-ina-101-a-27-c', 'us-eb-cfr-204-5-m'],
      label: {
        en:
          'At least two years of membership of the denomination immediately preceding the petition, and two ' +
          'years of continuously carrying on the vocation, professional work or other religious work',
        es:
          'Al menos dos años de pertenencia a la denominación inmediatamente anteriores a la petición, y dos ' +
          'años ejerciendo de forma continuada la vocación, el trabajo profesional u otro trabajo religioso',
      },
      // `professionalExperienceYears` is a count of completed years in the
      // relevant field and is the nearest fact this model holds. It records
      // neither denominational membership nor continuity, and religious work is
      // not always recorded as professional experience at all, so the criterion
      // is material rather than blocking and always escalates.
      evaluator: twoYearsTrainingOrExperience,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Two separate two-year periods have to be established, and Meridian holds neither. The membership ' +
          'must be of a religious denomination that has a bona fide non-profit religious organisation in the ' +
          'United States, and it must run for the two years IMMEDIATELY PRECEDING the application. The work ' +
          'must have been carried on CONTINUOUSLY for that same period. A recorded count of professional years ' +
          'is a starting point and nothing more.',
        es:
          'Deben acreditarse dos periodos de dos años distintos, y Meridian no dispone de ninguno de ellos. La ' +
          'pertenencia debe ser a una denominación religiosa que cuente con una organización religiosa sin ' +
          'ánimo de lucro de buena fe en los Estados Unidos, y debe extenderse durante los dos años ' +
          'INMEDIATAMENTE ANTERIORES a la solicitud. El trabajo debe haberse ejercido de forma CONTINUADA ' +
          'durante ese mismo periodo. Un recuento registrado de años profesionales es un punto de partida y ' +
          'nada más.',
      },
    },
    {
      id: 'us-eb4-minister-or-non-minister-branch',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['us-eb-ina-101-a-27-c', 'us-eb-ina-203-b-4'],
      label: {
        en:
          'Which branch applies: the permanent minister branch, or one of the two non-minister branches that ' +
          'carry an expiry date',
        es:
          'Qué rama resulta aplicable: la rama ministerial, permanente, o una de las dos ramas no ' +
          'ministeriales, sujetas a fecha de caducidad',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This is a date trap and it has to be checked rather than assumed. § 1101(a)(27)(C)(ii)(I), for ' +
          'someone entering solely to carry on the vocation of a MINISTER of the denomination, carries no ' +
          'expiry. Clauses (ii)(II) and (ii)(III), for non-minister religious workers in a professional ' +
          'capacity or in a religious vocation or occupation, are written as applying only "before September ' +
          '30, 2015", and Congress has extended that date repeatedly by appropriations rider rather than by ' +
          'amending the codified text. The most recent extension visible in the 2024 edition of the United ' +
          'States Code is Pub. L. 118-47, div. G, title I, § 104 of 23 March 2024, substituting "September 30, ' +
          '2024". WHETHER A LATER EXTENSION IS IN FORCE TODAY WAS NOT ESTABLISHED and must be confirmed before ' +
          'any non-minister relies on this route. Meridian records nothing about religious office, so which ' +
          'branch applies cannot be read from this profile either.',
        es:
          'Ésta es una trampa de fechas y debe comprobarse, no suponerse. El § 1101(a)(27)(C)(ii)(I), para ' +
          'quien ingresa únicamente para ejercer la vocación de MINISTRO de la denominación, no tiene fecha de ' +
          'caducidad. Las cláusulas (ii)(II) y (ii)(III), para personas no ministras que trabajan en calidad ' +
          'profesional o en una vocación u ocupación religiosa, están redactadas como aplicables sólo "antes ' +
          'del 30 de septiembre de 2015", y el Congreso ha prorrogado esa fecha repetidamente mediante ' +
          'disposiciones presupuestarias, sin modificar el texto codificado. La prórroga más reciente visible ' +
          'en la edición de 2024 del Código de los Estados Unidos es la Pub. L. 118-47, div. G, título I, ' +
          '§ 104, de 23 de marzo de 2024, que sustituye la fecha por "30 de septiembre de 2024". NO SE ' +
          'ESTABLECIÓ SI HOY RIGE UNA PRÓRROGA POSTERIOR, y debe confirmarse antes de que una persona no ' +
          'ministra se apoye en esta vía. Meridian no registra dato alguno sobre el cargo religioso, de modo ' +
          'que tampoco puede deducirse de este perfil qué rama corresponde.',
      },
      guidance: {
        en:
          'The branch also changes the numbers. § 1153(b)(4) reserves not more than 5,000 fourth-preference ' +
          'visas a year for the non-minister religious workers described in clauses (ii)(II) and (ii)(III); ' +
          'ministers are not inside that sub-limit.',
        es:
          'La rama también cambia los números. El § 1153(b)(4) reserva un máximo de 5.000 visas anuales de ' +
          'cuarta preferencia para las personas no ministras descritas en las cláusulas (ii)(II) y (ii)(III); ' +
          'quienes ejercen el ministerio quedan fuera de ese sublímite.',
      },
    },
    {
      id: 'us-eb4-no-labor-certification',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-eb-ina-204-a-1-g', 'us-eb-ina-212-a-5-a', 'us-eb-cfr-204-5-m'],
      label: {
        en: 'No permanent labor certification is required, and the person may file the petition themselves',
        es:
          'No se exige certificación laboral permanente, y la propia persona puede presentar la petición',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      guidance: {
        en:
          'The labor certification in 8 U.S.C. § 1182(a)(5)(A) reaches an alien seeking to enter to perform ' +
          'skilled or unskilled labor, and 20 CFR part 656 implements it for the second and third preferences. ' +
          'It has no application here. The petition is Form I-360 rather than Form I-140, and under 8 U.S.C. ' +
          '§ 1154(a)(1)(G) the person, or anyone on their behalf, may file it.',
        es:
          'La certificación laboral del 8 U.S.C. § 1182(a)(5)(A) alcanza a quien pretende ingresar para ' +
          'realizar trabajo cualificado o no cualificado, y 20 CFR parte 656 la desarrolla para la segunda y ' +
          'la tercera preferencia. Aquí no resulta aplicable. La petición es el formulario I-360 y no el ' +
          'I-140, y conforme a 8 U.S.C. § 1154(a)(1)(G) puede presentarla la propia persona o cualquiera en su ' +
          'nombre.',
      },
    },
  ],
  durations: {
    citationIds: [
      'us-eb-ina-203-b-4',
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-cfr-204-5-d',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The fourth preference takes not more than 7.1 per cent of the worldwide employment-based level, with ' +
        'a sub-limit of 5,000 a year for non-minister religious workers and 100 a year for the witnesses ' +
        'described in § 1101(a)(27)(M), and the 7 per cent per-country cap applies on top. Because no labor ' +
        'certification is involved, the priority date is the day the petition was properly filed. ' +
        'Chargeability follows place of birth and Mexico is currently one of four oversubscribed chargeability ' +
        'areas; no date or waiting time is recorded here. ONLY THE RELIGIOUS WORKER SUB-CLASS IS ENCODED. The ' +
        'fourth preference also carries long-serving United States Government employees abroad, Panama Canal ' +
        'employees, certain physicians, relatives of international organisation officers, certain juveniles, ' +
        'armed forces members and witnesses, each with its own test and none of them modelled here. The ' +
        'special immigrant juvenile class is deliberately excluded: it turns on a state juvenile court’s ' +
        'findings about abuse, neglect or abandonment, and it needs a licensed attorney or a representative ' +
        'accredited by the Department of Justice rather than a self-serve check.',
      es:
        'La cuarta preferencia toma como máximo el 7,1 por ciento del límite mundial por empleo, con un ' +
        'sublímite de 5.000 anuales para personas no ministras en trabajo religioso y de 100 anuales para los ' +
        'testigos descritos en el § 1101(a)(27)(M), y encima se aplica el tope del 7 por ciento por país. Al ' +
        'no intervenir certificación laboral, la fecha de prioridad es el día de la presentación correcta de ' +
        'la petición. La imputación sigue el lugar de nacimiento y México es actualmente uno de los cuatro ' +
        'países con sobresuscripción; aquí no se registra fecha ni tiempo de espera. SÓLO SE RECOGE LA ' +
        'SUBCLASE DE TRABAJO RELIGIOSO. La cuarta preferencia incluye además a empleados del Gobierno de los ' +
        'Estados Unidos en el exterior con largo servicio, empleados del Canal de Panamá, ciertos médicos, ' +
        'familiares de funcionarios de organizaciones internacionales, ciertos menores, miembros de las ' +
        'fuerzas armadas y testigos, cada uno con su propia prueba y ninguno recogido aquí. La subclase de ' +
        'menores inmigrantes especiales se excluye deliberadamente: depende de las determinaciones de un ' +
        'tribunal estatal de menores sobre maltrato, negligencia o abandono, y requiere una persona abogada ' +
        'colegiada o representante acreditada ante el Departamento de Justicia, y no una comprobación ' +
        'automática.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// EB-5 — employment creation
// ---------------------------------------------------------------------------

export const usEb5ImmigrantInvestor: Pathway = {
  id: 'us-eb5-immigrant-investor',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'EB-5 — Employment fifth preference: immigrant investor',
    es: 'EB-5 — Quinta preferencia por empleo: persona inversionista inmigrante',
  },
  summary: {
    en:
      'Permanent residence, granted conditionally for two years, for a person who invests the statutory amount ' +
      'of lawfully obtained capital in a new commercial enterprise in the United States and whose investment ' +
      'creates full-time employment for at least ten qualifying employees. There is no employer and no labor ' +
      'certification; the investor petitions for themselves. The conditions on the residence must then be ' +
      'removed on a further petition, and failing to file it ends the status.',
    es:
      'Residencia permanente, concedida de forma condicional por dos años, para quien invierta el importe ' +
      'legal de capital de origen lícito en una nueva empresa comercial en los Estados Unidos y cuya inversión ' +
      'cree empleo a tiempo completo para al menos diez personas trabajadoras computables. No hay empleador ni ' +
      'certificación laboral; la propia persona inversionista presenta la petición. Después deben levantarse ' +
      'las condiciones mediante una petición ulterior, y no presentarla extingue el estatus.',
  },
  citations: [
    inaS203b,
    inaS201d,
    inaS202a2,
    inaS203e1,
    famNumericalLimits,
    visaBulletin,
    inaS203b5A,
    inaS203b5C,
    inaS203b5D,
    inaS203b5E,
    inaS204a1H,
    cfr2046f,
    uscisPmG2,
    inaS216A,
    inaS212a5A,
  ],
  criteria: [
    {
      id: 'us-eb5-united-states-permanent-residence',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b', 'us-eb-ina-201-d'],
      label: {
        en: 'The application is for lawful permanent residence in the United States',
        es: 'La solicitud es de residencia permanente legal en los Estados Unidos',
      },
      evaluator: seekingUnitedStates,
      guidance: {
        en: 'Where no target jurisdiction has been recorded this reads as undecided rather than as a failure.',
        es: 'Si no consta la jurisdicción de destino, el resultado es indeterminado y no un incumplimiento.',
      },
    },
    {
      id: 'us-eb5-minimum-capital',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-5-a', 'us-eb-ina-203-b-5-c', 'us-eb-uscis-pm-6-g-2', 'us-eb-cfr-204-6-f'],
      label: {
        en:
          'Capital of at least USD 1,050,000, or USD 800,000 where the investment is in a targeted employment ' +
          'area or an infrastructure project',
        es:
          'Capital de al menos 1.050.000 USD, u 800.000 USD si la inversión se realiza en una zona de empleo ' +
          'focalizada o en un proyecto de infraestructura',
      },
      // The evaluator tests against the LOWER of the two figures, because the
      // higher one applies only outside a targeted employment area and this
      // model records nothing about where an investment sits. An amount below
      // the reduced figure fails on any view and is reported as a failure; an
      // amount between the two depends entirely on the area, so it escalates.
      evaluator: investmentAtLeastReducedAmount,
      humanReviewWhen: {
        op: 'all_of',
        of: [investmentAtLeastReducedAmount, { op: 'not', of: investmentAtLeastStandardAmount }],
      },
      humanReviewReason: {
        en:
          'The recorded capital clears the reduced amount but not the general one, so everything turns on ' +
          'whether the investment is in a targeted employment area or an infrastructure project — which ' +
          'Meridian does not record. A targeted employment area is, at the time of investment, either a rural ' +
          'area, meaning outside any metropolitan statistical area and outside any city or town of 20,000 or ' +
          'more, or an area the Secretary of Homeland Security has designated as having unemployment of at ' +
          'least 150 per cent of the national average. No other federal, state or local official may make that ' +
          'designation, and it lasts two years.',
        es:
          'El capital registrado supera el importe reducido pero no el general, de modo que todo depende de si ' +
          'la inversión se sitúa en una zona de empleo focalizada o en un proyecto de infraestructura, dato ' +
          'que Meridian no registra. Una zona de empleo focalizada es, en el momento de la inversión, o bien ' +
          'una zona rural —fuera de toda área estadística metropolitana y de toda ciudad o población de 20.000 ' +
          'habitantes o más—, o bien una zona que la Secretaría de Seguridad Nacional haya designado con un ' +
          'desempleo de al menos el 150 por ciento de la media nacional. Ningún otro funcionario federal, ' +
          'estatal o local puede hacer esa designación, y su vigencia es de dos años.',
      },
      guidance: {
        en:
          'These figures are dated by construction and one nearby source is actively misleading. The statute ' +
          'provides that from 1 January 2027, and every five years after, the general amount adjusts ' +
          'automatically by the change in the consumer price index since 1 January 2022, rounded down to the ' +
          'nearest USD 50,000, with the reduced amount set at 75 per cent of it. Separately, 8 CFR 204.6(f) ' +
          'still states the amounts as USD 1,800,000 and USD 900,000: those come from a 2019 rule that USCIS ' +
          'records as having been vacated by a federal court, and the regulation has never been conformed to ' +
          'the amounts Congress enacted in 2022. Read the statute, not that paragraph. The Secretary may also ' +
          'require up to three times the general amount for an investment in part of a metropolitan area with ' +
          'unemployment significantly below the national average.',
        es:
          'Estas cifras nacen con fecha de caducidad y una fuente cercana induce activamente a error. La ley ' +
          'dispone que a partir del 1 de enero de 2027, y cada cinco años, el importe general se ajuste ' +
          'automáticamente por la variación del índice de precios al consumo desde el 1 de enero de 2022, ' +
          'redondeando a la baja al múltiplo de 50.000 USD, y que el importe reducido sea el 75 por ciento de ' +
          'aquél. Por otro lado, 8 CFR 204.6(f) sigue indicando 1.800.000 USD y 900.000 USD: proceden de una ' +
          'norma de 2019 que USCIS hace constar como anulada por un tribunal federal, y el reglamento nunca se ' +
          'adaptó a los importes aprobados por el Congreso en 2022. Debe leerse la ley, no ese apartado. La ' +
          'Secretaría puede además exigir hasta el triple del importe general para inversiones en partes de un ' +
          'área metropolitana con desempleo muy inferior a la media nacional.',
      },
    },
    {
      id: 'us-eb5-new-commercial-enterprise',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-eb-ina-203-b-5-a', 'us-eb-ina-203-b-5-d'],
      label: {
        en: 'The capital is invested in a new commercial enterprise, not lent to one and not parked',
        es:
          'El capital se invierte en una nueva empresa comercial, no se presta a ella ni se mantiene ' +
          'inmovilizado',
      },
      // The investment taxonomy in this model is coarse — five kinds, none of
      // which means "new commercial enterprise". Public debt and a bank deposit
      // are definitely not an equity investment in an enterprise, so those read
      // as a failure; the two that could be escalate, because the kind alone
      // cannot confirm the statutory structure.
      evaluator: { op: 'one_of', path: 'qualifyingInvestment.kind', values: ['business_project', 'shares'] },
      humanReviewWhen: {
        op: 'one_of',
        path: 'qualifyingInvestment.kind',
        values: ['business_project', 'shares'],
      },
      humanReviewReason: {
        en:
          'The recorded kind of investment is consistent with an enterprise but proves nothing about the ' +
          'statutory structure. A new commercial enterprise is any for-profit organisation formed in the ' +
          'United States for the ongoing conduct of lawful business. The definition of capital EXCLUDES ' +
          'assets acquired by unlawful means, capital exchanged for a note, bond, convertible debt or other ' +
          'debt arrangement with the enterprise, capital carrying a guaranteed rate of return, and capital ' +
          'subject to a contractual right of repayment such as a mandatory redemption or a put option — even ' +
          'where that right is contingent on the enterprise having the cash flow. Whether a particular ' +
          'structure falls inside or outside those exclusions is a question about the offering documents.',
        es:
          'El tipo de inversión registrado es compatible con una empresa, pero no acredita nada sobre la ' +
          'estructura legal. Una nueva empresa comercial es cualquier organización con ánimo de lucro ' +
          'constituida en los Estados Unidos para el ejercicio continuado de una actividad lícita. La ' +
          'definición de capital EXCLUYE los activos adquiridos por medios ilícitos, el capital entregado a ' +
          'cambio de un pagaré, bono, deuda convertible u otra fórmula de deuda con la empresa, el capital con ' +
          'rentabilidad garantizada y el capital sujeto a un derecho contractual de reembolso, como una ' +
          'amortización obligatoria o una opción de venta, aunque ese derecho dependa de que la empresa ' +
          'disponga de flujo de caja. Si una estructura concreta queda dentro o fuera de esas exclusiones es ' +
          'una cuestión que resuelven los documentos de la oferta.',
      },
    },
    {
      id: 'us-eb5-ten-qualifying-jobs',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-eb-ina-203-b-5-a', 'us-eb-ina-203-b-5-e', 'us-eb-ina-216-a'],
      label: {
        en:
          'The investment will create full-time employment for not fewer than ten qualifying employees, other ' +
          'than the investor and their spouse, sons or daughters',
        es:
          'La inversión creará empleo a tiempo completo para no menos de diez personas trabajadoras ' +
          'computables, distintas de la persona inversionista y de su cónyuge, hijos e hijas',
      },
      evaluator: { op: 'is_present', path: 'qualifyingInvestment' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Job creation is a fact about an enterprise and its payroll, not about the investor, and Meridian ' +
          'records nothing of it. The qualifying employees must be United States citizens, nationals, lawful ' +
          'permanent residents or others lawfully authorised to be employed, and the investor’s own spouse, ' +
          'sons and daughters do not count. Where the investment is pooled through a regional center, at most ' +
          '90 per cent of the requirement may be satisfied by indirectly created jobs, falling to 75 per cent ' +
          'where the jobs come from construction activity lasting less than two years. The jobs need not all ' +
          'exist at the time of the first petition: the later petition to remove conditions may instead show ' +
          'that the employment is actively being created and will exist before the third anniversary of ' +
          'admission, provided the capital stays invested.',
        es:
          'La creación de empleo es un dato de la empresa y de su nómina, no de la persona inversionista, y ' +
          'Meridian no registra nada al respecto. Las personas trabajadoras computables deben ser ciudadanas o ' +
          'nacionales estadounidenses, residentes permanentes legales u otras personas autorizadas legalmente ' +
          'para trabajar, y no computan el cónyuge ni los hijos e hijas de la persona inversionista. Si la ' +
          'inversión se agrupa a través de un centro regional, como máximo el 90 por ciento del requisito ' +
          'puede satisfacerse con empleo creado indirectamente, y sólo el 75 por ciento cuando procede de ' +
          'actividad de construcción de menos de dos años. No es preciso que todos los empleos existan al ' +
          'presentar la primera petición: la petición posterior de levantamiento de condiciones puede mostrar ' +
          'que el empleo se está creando activamente y existirá antes del tercer aniversario de la admisión, ' +
          'siempre que el capital permanezca invertido.',
      },
    },
    {
      id: 'us-eb5-capital-lawful-and-sustained',
      kind: 'economic',
      weight: 'material',
      citationIds: ['us-eb-ina-203-b-5-a', 'us-eb-ina-203-b-5-d', 'us-eb-ina-204-a-1-h'],
      label: {
        en:
          'The capital was lawfully obtained and is expected to remain invested for at least two years, and ' +
          'the date of investment is on record',
        es:
          'El capital se obtuvo lícitamente y se espera que permanezca invertido al menos dos años, y consta ' +
          'la fecha de la inversión',
      },
      // The date matters twice over: it starts the two-year sustainment period,
      // and the applicable investment amount depends on when the petition was
      // filed. So the presence of a date is worth surfacing on its own.
      evaluator: { op: 'is_present', path: 'qualifyingInvestment.madeOn' },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Lawful source of capital is proved with documents — the definition excludes assets acquired ' +
          'directly or indirectly by unlawful means, including cash proceeds of debt secured on such assets — ' +
          'and nothing in this profile evidences it. The date also decides which figures apply: USCIS states ' +
          'that petitions filed before 15 March 2022 are governed by the older USD 1,000,000 and USD 500,000 ' +
          'amounts. Eligibility must be established at the time the petition is filed, and a petitioner who ' +
          'was eligible then is deemed eligible when the petition is adjudicated.',
        es:
          'El origen lícito del capital se acredita con documentos —la definición excluye los activos ' +
          'adquiridos directa o indirectamente por medios ilícitos, incluido el efectivo procedente de deuda ' +
          'garantizada con ellos— y nada en este perfil lo prueba. La fecha decide además qué importes se ' +
          'aplican: USCIS señala que las peticiones presentadas antes del 15 de marzo de 2022 se rigen por los ' +
          'importes anteriores de 1.000.000 USD y 500.000 USD. La elegibilidad debe acreditarse en el momento ' +
          'de presentar la petición, y quien fuera elegible entonces se considera elegible al resolverse.',
      },
    },
    {
      id: 'us-eb5-no-employer-and-no-labor-certification',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-eb-ina-204-a-1-h', 'us-eb-ina-212-a-5-a'],
      label: {
        en: 'No employer, no job offer and no permanent labor certification: the investor petitions alone',
        es:
          'Sin empleador, sin oferta de empleo y sin certificación laboral permanente: la persona ' +
          'inversionista peticiona por sí misma',
      },
      evaluator: { op: 'is_present', path: 'qualifyingInvestment' },
      guidance: {
        en:
          'Any alien seeking classification under 8 U.S.C. § 1153(b)(5) may file a petition on their own ' +
          'behalf. The labor certification in § 1182(a)(5)(A) reaches an alien seeking to enter to perform ' +
          'skilled or unskilled labor and has no application to this preference at all — this route creates ' +
          'jobs rather than filling one.',
        es:
          'Cualquier persona extranjera que solicite la clasificación del 8 U.S.C. § 1153(b)(5) puede ' +
          'presentar la petición por sí misma. La certificación laboral del § 1182(a)(5)(A) alcanza a quien ' +
          'pretende ingresar para realizar trabajo cualificado o no cualificado y no resulta aplicable en ' +
          'absoluto a esta preferencia: esta vía crea empleo en lugar de ocupar un puesto.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 24,
    citationIds: [
      'us-eb-ina-216-a',
      'us-eb-ina-203-b-5-e',
      'us-eb-ina-201-d',
      'us-eb-ina-202-a-2',
      'us-eb-ina-203-e-1',
      'us-eb-fam-503-1-2',
      'us-eb-visa-bulletin',
    ],
    note: {
      en:
        'The grant is CONDITIONAL. An investor, their spouse and their children obtain permanent residence on ' +
        'a conditional basis, and the condition is removed only on a further petition filed during the 90-day ' +
        'period immediately preceding the second anniversary of admission, supported by a personal interview ' +
        'where required and a site visit by the Secretary. That petition must show the requisite capital was ' +
        'invested and that the required employment was created, or is actively being created and will exist ' +
        'before the third anniversary with the capital still invested. If no petition is filed, or the ' +
        'investor fails without good cause to appear, permanent resident status terminates as of the second ' +
        'anniversary. Telling somebody they are finished at the grant would tell them they are halfway. Two ' +
        'further structural points: the fifth preference takes not more than 7.1 per cent of the worldwide ' +
        'employment-based level with a 7 per cent per-country cap on top, and 20 per cent of its visas are ' +
        'reserved for rural investments, 10 per cent for high unemployment areas and 2 per cent for ' +
        'infrastructure projects; and the REGIONAL CENTER PROGRAM, which is how pooled investments are made, ' +
        'is authorised by statute only THROUGH 30 SEPTEMBER 2027, while the standalone route carries no such ' +
        'sunset. Mexico is currently one of four oversubscribed chargeability areas and no cut-off date or ' +
        'waiting time is recorded here.',
      es:
        'La concesión es CONDICIONAL. La persona inversionista, su cónyuge y sus hijos obtienen la residencia ' +
        'permanente con carácter condicional, y la condición sólo se levanta mediante una petición ulterior ' +
        'presentada durante los 90 días inmediatamente anteriores al segundo aniversario de la admisión, con ' +
        'entrevista personal cuando se exija y una visita de inspección de la Secretaría. Esa petición debe ' +
        'acreditar que se invirtió el capital exigido y que se creó el empleo requerido, o que se está creando ' +
        'activamente y existirá antes del tercer aniversario permaneciendo invertido el capital. Si no se ' +
        'presenta la petición, o la persona inversionista no comparece sin causa justificada, el estatus de ' +
        'residente permanente se extingue en el segundo aniversario. Decir a alguien que ha terminado con la ' +
        'concesión sería decirle que ha terminado cuando va por la mitad. Dos precisiones estructurales más: ' +
        'la quinta preferencia toma como máximo el 7,1 por ciento del límite mundial por empleo, con el tope ' +
        'del 7 por ciento por país por encima, y reserva el 20 por ciento de sus visas a inversiones rurales, ' +
        'el 10 por ciento a zonas de alto desempleo y el 2 por ciento a proyectos de infraestructura; y el ' +
        'PROGRAMA DE CENTROS REGIONALES, que es la vía para agrupar inversiones, está autorizado por ley sólo ' +
        'HASTA EL 30 DE SEPTIEMBRE DE 2027, mientras que la vía individual no tiene esa caducidad. México es ' +
        'actualmente uno de los cuatro países con sobresuscripción y aquí no se registra fecha de corte ni ' +
        'tiempo de espera.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

/**
 * The shipped set, in the order the preferences appear in § 1153(b).
 *
 * Order here is statutory sequence and nothing else. It is not a ranking, it
 * carries no claim about which route is easier, faster or better, and it does
 * not vary with anybody’s facts — a list that reordered itself around an
 * applicant would be a recommendation, and a recommendation from an unreviewed
 * catalog is exactly what this repository refuses to produce.
 */
export const US_EMPLOYMENT_PATHWAYS: readonly Pathway[] = [
  usEb1aExtraordinaryAbility,
  usEb1bOutstandingProfessorResearcher,
  usEb1cMultinationalManagerExecutive,
  usEb2AdvancedDegreeExceptionalAbility,
  usEb2NationalInterestWaiver,
  usEb3SkilledWorker,
  usEb3Professional,
  usEb3OtherWorker,
  usEb4SpecialImmigrantReligiousWorker,
  usEb5ImmigrantInvestor,
];
