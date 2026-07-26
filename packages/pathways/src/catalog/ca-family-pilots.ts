/**
 * Canada — the family class, and the smaller economic programs.
 *
 * Nine pathways: three family-class routes (spousal/partner sponsorship from
 * outside Canada, the same relationship handled inside Canada as a different
 * class with different consequences, and dependent-child sponsorship), the
 * parent and grandparent route, the Start-up Visa, and four regional or
 * sectoral programs of which two are closed and one replaced a third.
 *
 * Everything here is `reviewStatus: 'unreviewed'`, and in Canada that word is
 * load-bearing. Section 91 of the Immigration and Refugee Protection Act makes
 * it an offence to advise a person for consideration on an immigration
 * application unless you are a lawyer, a Quebec notary, or a College of
 * Immigration and Citizenship Consultants licensee. These records restate
 * published rules and measure recorded facts against them. They do not
 * recommend a route.
 *
 * ## Why almost every family-class criterion escalates
 *
 * Sponsorship is a **two-sided** test. IRPR s. 133 refuses a sponsorship
 * application unless the *sponsor* is 18, resident in Canada, not subject to a
 * removal order, not in default of an earlier undertaking, not an undischarged
 * bankrupt, and not in receipt of non-disability social assistance — among
 * others — and IRPR s. 130(3) bars a person sponsored as a spouse from
 * sponsoring a spouse for five years afterwards.
 *
 * `ApplicantFacts` records the applicant and nobody else. There is no sponsor
 * age, no sponsor status, no sponsor income, no undertaking history and no
 * relationship record. A pathway that evaluated only the applicant's half and
 * reported `eligible` would be telling somebody they qualify on a test half of
 * which was never examined, which is worse than saying nothing. So every
 * sponsor-side and relationship-side criterion carries
 * `requiresHumanReview: true`, and the family-class pathways consequently
 * return `requires_human_review` rather than a verdict.
 *
 * That is not a placeholder. It is the accurate output for a two-sided test
 * against one-sided facts, and the per-criterion results — age, status,
 * language, education — are still computed, cited and returned, so the report
 * remains useful. Adding sponsor facts to the shared facts model would let
 * several of these escalations be replaced by real evaluators; the escalation
 * is what stands in the meantime.
 *
 * ## Asylum is out of scope
 *
 * Nothing here covers refugee protection, resettlement, or humanitarian and
 * compassionate relief under IRPA s. 25. Those turn on credibility findings
 * about people at risk rather than on criteria, and a self-serve eligibility
 * checker is the wrong instrument for them entirely. Their absence from this
 * file is a decision, not an oversight: anyone in that situation needs a
 * lawyer or an accredited representative, not this engine.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import { CLB_SCALE, EDUCATION_SCALE } from '../facts.js';
import type { EvaluatorSpec, Pathway } from '../schema.js';

const CA: CountryCode = countryCode('CA');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

const IRPA_URL = 'https://laws-lois.justice.gc.ca/eng/acts/I-2.5/';
const IRPR_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/';

// ---------------------------------------------------------------------------
// Statute and regulation
// ---------------------------------------------------------------------------

const irpaS11_1 = {
  id: 'ca-irpa-s-11-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 11(1)',
  url: IRPA_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A visa may be issued only if, following an examination, the officer is satisfied the foreign national is ' +
    'not inadmissible and meets the requirements of the Act. Inadmissibility is assessed under Division 4 of ' +
    'the Act and is a separate enquiry from the class criteria encoded here.',
};

const irpaS12_1 = {
  id: 'ca-irpa-s-12-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 12(1)',
  url: IRPA_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A foreign national may be selected as a member of the family class on the basis of their relationship as ' +
    'the spouse, common-law partner, child, parent or other prescribed family member of a Canadian citizen or ' +
    'permanent resident.',
};

const irpaS13_1 = {
  id: 'ca-irpa-s-13-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 13(1)',
  url: IRPA_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A Canadian citizen or permanent resident may sponsor a foreign national, subject to the regulations. The ' +
    'right to sponsor is the sponsor’s; the conditions on it are in IRPR ss. 130 and 133.',
};

const irpaS14_1 = {
  id: 'ca-irpa-s-14-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 14.1(1)',
  url: IRPA_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The Minister may give instructions establishing a class of permanent residents as part of the economic ' +
    'class. The sectoral and community pilots rest on this power rather than on a regulation, which is why ' +
    'their criteria are published as instructions and can be changed, capped or ended without a regulatory ' +
    'amendment.',
};

const irpaS63_1 = {
  id: 'ca-irpa-s-63-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 63(1)',
  url: IRPA_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A person who has filed a sponsorship application in respect of a member of the family class may appeal to ' +
    'the Immigration Appeal Division against a decision not to issue a permanent resident visa. The right ' +
    'attaches to the refusal of a *visa*, so it is available on the overseas route and not on an in-Canada ' +
    'application, where no visa is issued.',
};

const irprS2DependentChild = {
  id: 'ca-irpr-s-2-dependent-child',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 2 (“dependent child”)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A dependent child is the biological or adopted child of the parent who is either under 22 and not a spouse ' +
    'or common-law partner, or 22 or older and has depended substantially on the parent’s financial support ' +
    'since before turning 22 and is unable to be financially self-supporting because of a physical or mental ' +
    'condition.',
};

const irprS25_1 = {
  id: 'ca-irpr-s-25-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 25.1(1) and 121',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Section 121 requires a member of the family class to be a family member both when the application is made ' +
    'and when it is determined, but it opens with the words “Subject to subsection 25.1(1)”, and s. 25.1(1) ' +
    'sets the general lock-in date for a child’s age at the date on which the application is made. The date on ' +
    'which a sponsored child’s age is fixed is therefore not the date an assessment happens to be run. Which ' +
    'lock-in subsection governs a particular file — ss. 25.1(2) to (9) set different dates for Quebec, ' +
    'provincial nominee, Atlantic and refugee-sponsorship situations — is not resolved here.',
};

const irprS4 = {
  id: 'ca-irpr-s-4',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 4 and 4.1',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A person is not a spouse, common-law partner or conjugal partner if the relationship was entered into ' +
    'primarily to acquire status under the Act, or is not genuine; s. 4.1 catches a relationship resumed after ' +
    'a dissolution engineered for the same purpose. The rule is regulatory but its application is a credibility ' +
    'finding on the whole evidentiary record, which no engine performs.',
};

const irprS5 = {
  id: 'ca-irpr-s-5',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 5(a)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A foreign national under 18 is not considered the spouse or common-law partner of a person. This is a ' +
    'bright line across the whole of the Regulations, not merely a sponsorship condition.',
};

const irprS117_1 = {
  id: 'ca-irpr-s-117-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 117(1)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Members of the family class: the sponsor’s spouse, common-law partner or conjugal partner (a); a dependent ' +
    'child of the sponsor (b); the sponsor’s mother or father (c); a grandparent (d); certain orphaned relatives ' +
    'under 18 (f); a child under 18 the sponsor intends to adopt (g); and, where the sponsor has no closer ' +
    'relative, any relative (h).',
};

const irprS117_9 = {
  id: 'ca-irpr-s-117-9',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 117(9) to (11)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Excluded relationships. A conjugal partner under 18; a partner sponsored while an earlier partner ' +
    'undertaking still runs; a spouse where either party was already married, or where the couple have lived ' +
    'apart a year and either has a new partner; a marriage where either spouse was not physically present at ' +
    'the ceremony; and — the one that surprises people years later — a family member who was not examined when ' +
    'the sponsor themselves applied for permanent residence.',
};

const irprS124 = {
  id: 'ca-irpr-s-124',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 124',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Membership of the spouse or common-law partner in Canada class requires all three of: being the spouse or ' +
    'common-law partner of a sponsor and cohabiting with that sponsor in Canada; holding temporary resident ' +
    'status in Canada; and being the subject of a sponsorship application. A conjugal partner cannot be a member ' +
    'of this class — the conjugal category exists precisely for couples who cannot cohabit.',
};

const irprS125 = {
  id: 'ca-irpr-s-125',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 125',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Excluded relationships for the in-Canada class, tracking s. 117(9) closely. Paragraph 125(1)(a) is shown ' +
    'in the consolidated text as repealed by SOR/2023-249; what it formerly said has not been read against the ' +
    'repealed version here, and no claim is made about it. The minimum-age rule this file applies rests on ' +
    's. 5(a), which is in force and independent of that paragraph.',
};

const irprS130 = {
  id: 'ca-irpr-s-130',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 130',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A sponsor must be a Canadian citizen or permanent resident who is at least 18, resides in Canada, and has ' +
    'filed a sponsorship application. A citizen living abroad may sponsor a spouse, partner or dependent child ' +
    'with no dependent children if they will reside in Canada when that person lands; a permanent resident ' +
    'living abroad may not sponsor at all. Under s. 130(3) a person who became a permanent resident or citizen ' +
    'after being sponsored as a spouse, common-law partner or conjugal partner may not sponsor a partner until ' +
    'they have held that status for five years.',
};

const irprS132 = {
  id: 'ca-irpr-s-132',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 132',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The undertaking obliges the sponsor to reimburse the Crown for social assistance paid to the sponsored ' +
    'person. It runs three years for a spouse, common-law partner or conjugal partner; three years for a ' +
    'dependent child who is 22 or older on landing; for a dependent child under 22 on landing, the earlier of ' +
    'ten years and the child’s 25th birthday; twenty years for a parent or grandparent; and ten years for anyone ' +
    'else. Quebec sets its own periods under s. 132(2) and (3).',
};

const irprS133 = {
  id: 'ca-irpr-s-133',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 133',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The sponsor-side test, which must be satisfied on the day the application is filed and continuously until ' +
    'it is decided: a sponsor as described in s. 130; intends to fulfil the undertaking; not subject to a ' +
    'removal order; not detained; no conviction for a sexual, violent indictable or bodily-harm offence against ' +
    'the listed persons, in or outside Canada; not in default of an undertaking or court-ordered support; not in ' +
    'default on a debt to the Crown; not an undischarged bankrupt; meets the income requirement where it ' +
    'applies; and not in receipt of social assistance other than for disability.',
};

const irprS133_4 = {
  id: 'ca-irpr-s-133-4',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 133(4)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The income requirement in s. 133(1)(j) does not apply where the sponsored person is the sponsor’s spouse, ' +
    'common-law partner or conjugal partner with no dependent children; the same with a dependent child who ' +
    'themselves has no dependent children; or a dependent child of the sponsor who has no dependent children. ' +
    'The exemption is therefore narrower than "no income test for spouses" — a sponsored partner whose child has ' +
    'a child of their own falls outside it.',
};

const irprS133_1j = {
  id: 'ca-irpr-s-133-1-j',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 133(1)(j)(i)(B)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Where the sponsored person is the sponsor’s parent or grandparent, or an accompanying family member of ' +
    'one, the sponsor must have had a total income of at least the minimum necessary income plus 30% in each of ' +
    'the three consecutive taxation years immediately preceding the filing date. Minimum necessary income is ' +
    'defined in s. 2 by reference to the Statistics Canada low-income cut-off for urban areas of 500,000 or ' +
    'more, for a household counting the sponsor, the sponsored person, their family members, and everyone the ' +
    'sponsor is already under an undertaking for. Quebec applies its own financial test under s. 133(1)(j)(ii).',
};

const irprS87_3 = {
  id: 'ca-irpr-s-87-3',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.3',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The Atlantic immigration class, added by SOR/2021-242. Membership requires a valid, unrevoked endorsement ' +
    'certificate from an Atlantic province, an intention to reside in that province, either the work-experience ' +
    'requirements in s. 87.3(3) and (4) or the recent-graduate requirements in s. 87.3(5), a qualifying offer of ' +
    'employment under s. 87.3(6), the educational requirements in s. 87.3(9), a language evaluation meeting the ' +
    'threshold the Minister fixes under s. 74(1), and settlement funds equal to one eighth of the applicable ' +
    'low-income cut-off unless the applicant is already authorised to work and working in Canada.',
};

const irprS74_1 = {
  id: 'ca-irpr-s-74-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 74(1) and (2)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Minimum language proficiency thresholds are not in the Regulations. The Minister fixes them by class or by ' +
    'occupation, expressed against the Canadian Language Benchmarks or the Niveaux de compétence linguistique ' +
    'canadiens, and publishes them. A benchmark figure quoted for one of these programs is therefore ' +
    'administrative and can move without any amendment to the text.',
};

const irprS98_01 = {
  id: 'ca-irpr-s-98-01',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 98.01',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The start-up business class. A member must hold a commitment from one or more designated entities that is ' +
    'less than six months old and meets s. 98.04; hold language results less than two years old showing at ' +
    'least benchmark level 5 in one official language across all four skill areas; hold settlement funds equal ' +
    'to half the applicable low-income cut-off, excluding any investment by the designated entity; and have ' +
    'started a qualifying business within s. 98.06. The applicant must intend to reside outside Quebec, and no ' +
    'more than five applicants may be members in respect of the same business.',
};

const irprS98_06 = {
  id: 'ca-irpr-s-98-06',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 98.05 and 98.06',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A qualifying business is one the applicant actively and continuously manages from within Canada, an ' +
    'essential part of whose operations is conducted in Canada, that is incorporated in Canada, and whose ' +
    'ownership structure complies with percentages the Minister establishes and publishes. The minimum ' +
    'investment amount is likewise established by the Minister rather than fixed in the text. Both figures are ' +
    'therefore administrative.',
};

// ---------------------------------------------------------------------------
// Departmental guidance and program notices
// ---------------------------------------------------------------------------

const irccSpousalGuidance = {
  id: 'ca-ircc-spousal-sponsorship-guidance',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Sponsor your spouse, partner or child” (eligibility, who you can sponsor, undertaking)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship/spouse-partner-children.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. IRCC states that in most cases there is no income requirement for sponsoring a ' +
    'spouse, partner or dependent child, and that one arises only where the sponsored person has a dependent ' +
    'child who themselves has a dependent child. It also states the common-law threshold as 12 consecutive ' +
    'months of cohabitation and records the program as open as at 5 March 2026. The department revises these ' +
    'pages without legislative process.',
};

const irccSclpcWorkPermit = {
  id: 'ca-ircc-sclpc-open-work-permit',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — open work permit for spouses and partners being sponsored from within Canada',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship/spouse-partner-children/spouse-common-law-partner-canada-open-work-permit.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE, and a public policy rather than a regulation. An applicant living in Canada with ' +
    'their sponsor who has an acknowledgement of receipt for the permanent residence application may apply for ' +
    'an open work permit, extendable while the application is processed. A public policy can be withdrawn ' +
    'without notice, so it must not be treated as an entitlement attached to the class.',
};

const irccPgpPause = {
  id: 'ca-ircc-pgp-pause-2026',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — notice, “Canada takes steps to responsibly manage the Parents and Grandparents Program” (Ottawa, 15 July 2026)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/news/notices/responsibly-manage-parent-grandparent-program.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'IRCC is pausing intake of new applications, will not receive new interest to sponsor forms or invite ' +
    'potential sponsors to apply until further notice, and will continue processing existing applications, ' +
    'planning to approve up to 15,000 people for permanent residence through the program in 2026 in line with ' +
    'the 2026-2028 Immigration Levels Plan. The notice points parents and grandparents to the super visa.',
};

const irccPgpIntake = {
  id: 'ca-ircc-pgp-intake',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Sponsor your parents and grandparents” (program page, status: Paused)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship/sponsor-parents-grandparents.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. Access to this route has never been by open application. A would-be sponsor ' +
    'submits an interest to sponsor form and may only file once IRCC issues an invitation to apply, drawn from ' +
    'the pool. Neither the pool, the draw, nor the invitation is a criterion in the Regulations, so no ' +
    'criteria-based assessment can tell anyone whether they will get in. As at 15 July 2026 the program page ' +
    'records the status as paused.',
};

const irccSuvPause = {
  id: 'ca-ircc-suv-pause-2026',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Start-up Visa Program” and “Immigrate with a start-up visa: who can apply” (status: Paused)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa/eligibility.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'IRCC states that the Start-up Visa Program was paused on 30 June 2026 and that it will continue to process ' +
    'applications accepted before that date. Applicants holding a valid 2025 commitment certificate had to ' +
    'apply by 30 June 2026; the program is closed to all other applications. The class in IRPR ss. 98.01 to ' +
    '98.13 has not been repealed.',
};

const irccSuvThresholds = {
  id: 'ca-ircc-suv-thresholds',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “List of designated organizations: Immigrate with a start-up visa”',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa/designated-organizations.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE, published under the power the Regulations reserve to the Minister. A venture ' +
    'capital fund must agree to invest at least CAD 200,000; an angel investor group at least CAD 75,000; a ' +
    'business incubator must accept the applicant into its programme. Each applicant must hold at least 10% of ' +
    'the voting rights and the applicants together with the designated organisation must hold more than 50%. ' +
    'Since 1 April 2024 IRCC considers no more than ten complete group applications per designated organisation ' +
    'per year. Every one of these numbers can be changed by publication alone.',
};

const irccAipThresholds = {
  id: 'ca-ircc-aip-thresholds',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — Atlantic Immigration Program: language test, work experience and education assessment',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/atlantic-immigration/language-testing.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. IRCC sets the language threshold at CLB/NCLC 5 for a job offer in TEER 0, 1, 2 or ' +
    '3 and CLB/NCLC 4 for TEER 4, in all four abilities, on results less than two years old; and operationalises ' +
    'the regulation’s "one year of full-time work experience, or the equivalent in part-time" as 1,560 hours ' +
    'accumulated over a period of at least one year within the past five. The regulation fixes neither number.',
};

const irccAipProgram = {
  id: 'ca-ircc-aip-program',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Immigrate through the Atlantic Immigration Program” (status: Open)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/atlantic-immigration/how-to-immigrate.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. The endorsement step runs through the province, not through IRCC: a designated ' +
    'employer makes the offer, the candidate obtains a settlement plan from a service provider organisation, ' +
    'the employer applies to the province for endorsement, and the province issues the endorsement certificate. ' +
    'Each province runs its own designation and endorsement process. Recorded as open as at 22 June 2026.',
};

const irccRnipClosure = {
  id: 'ca-ircc-rnip-closure',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Closed: Rural and Northern Immigration Pilot: about the pilot”',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/rural-northern-immigration-pilot.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'IRCC states that the Rural and Northern Immigration Pilot ended on 31 August 2024 and that it will ' +
    'continue to process applications received on or before that date. Applications received *on* 31 August ' +
    '2024 were still accepted, so the first day on which no application could be made was 1 September 2024, ' +
    'which is the date recorded on this pathway.',
};

const irccRnipEligibility = {
  id: 'ca-ircc-rnip-eligibility',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Closed: Rural and Northern Immigration Pilot: who can apply”',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/rural-northern-immigration-pilot/pr-eligibility.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE, and versioned by the date the candidate applied for community recommendation. For ' +
    'candidates who applied on or after 16 November 2022 the language thresholds were CLB/NCLC 6 for a TEER 0 ' +
    'or 1 job offer, 5 for TEER 2 or 3 and 4 for TEER 4 or 5; the work-experience requirement was one year ' +
    '(1,560 hours) in the past three years; and a Canadian secondary credential, or a foreign one with an ' +
    'educational credential assessment, was required. Earlier cohorts were assessed on the pre-2021 NOC skill ' +
    'levels and on different rules about continuity of experience.',
};

const irccRcipProgram = {
  id: 'ca-ircc-rcip-program',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Rural Community Immigration Pilot” (who can apply, work experience, language assessment, education assessment)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/rural-franco-pilots/rural-immigration.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. The pilot requires a valid job offer from an employer designated by one of the ' +
    'participating communities, at least one year (1,560 hours) of related work experience in the past three ' +
    'years, an approved language test at CLB/NCLC 6 for a TEER 0 or 1 job offer, 5 for TEER 2 or 3 and 4 for ' +
    'TEER 4 or 5, a Canadian educational credential or an assessed foreign equivalent, and settlement funds. ' +
    'Communities set further requirements of their own. Recorded as open, with 14 rural communities, as at ' +
    '30 April 2026.',
};

const irccAfpClosure = {
  id: 'ca-ircc-afp-closure',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Closed: Agri-Food Pilot”, and program delivery update “Closure of the Agri-Food Pilot and 2025 intake” (20 November 2025)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/agri-food-pilot.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'IRCC states that the Agri-Food Pilot ended on 14 May 2025 and that it will continue to process ' +
    'applications accepted before that date. The program delivery update records both the closure and an intake ' +
    'cap of 1,010 applications for 2025, so the practical cut-off for many applicants arrived when the cap ' +
    'filled rather than on the end date.',
};

const irccAfpEligibility = {
  id: 'ca-ircc-afp-eligibility',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — “Closed: Agri-Food Pilot: who can apply” and “Language testing”',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/agri-food-pilot/pr-eligibility.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. The pilot required an eligible full-time, non-seasonal, permanent job offer in a ' +
    'listed occupation in Canada outside Quebec; at least one year (1,560 hours) of cumulative non-seasonal ' +
    'full-time Canadian experience in the past three years, gained on an open work permit for vulnerable workers ' +
    'or on a work permit supported by a labour market impact assessment of at least twelve months; CLB/NCLC 4 ' +
    'in all four abilities; a Canadian secondary school diploma or an assessed foreign equivalent; settlement ' +
    'funds where applicable; and maintained temporary resident status for those already in Canada. An applicant ' +
    'residing in Canada could satisfy either the job-offer or the education requirement; one applying from ' +
    'outside Canada had to satisfy both.',
};

// ---------------------------------------------------------------------------
// Shared evaluator fragments
// ---------------------------------------------------------------------------

/**
 * The evaluator attached to criteria that turn on a fact about somebody other
 * than the applicant — the sponsor, the relationship, a provincial endorsement,
 * a designated entity's commitment.
 *
 * Those criteria carry `requiresHumanReview: true`, and the engine escalates
 * them whatever their evaluator returns, so the spec here is documentary rather
 * than decisive. It is set to the one thing that is both true of every route in
 * this file and actually present in `ApplicantFacts` — that the target
 * jurisdiction is Canada — so the audit trace names a real path that was really
 * consulted instead of a tautology dressed as a test.
 */
const TARGET_IS_CANADA: EvaluatorSpec = { op: 'equals', path: 'targetJurisdiction', value: 'CA' };

/**
 * At least one recorded language result reaches `level` on a Canadian
 * benchmark scale.
 *
 * Every program in this file states its threshold "in all four abilities", and
 * `LanguageCertification` carries a single `level`. The comparison here is
 * therefore weaker than the rule: it confirms that a result at or above the
 * threshold exists, not that all four abilities reach it. Each criterion using
 * this says so in its guidance rather than leaving the reader to assume the
 * stronger check was performed.
 */
function clbAtLeast(level: string): EvaluatorSpec {
  return {
    op: 'collection_any',
    path: 'languageCertifications',
    where: {
      op: 'all_of',
      of: [
        { op: 'one_of', path: 'framework', values: ['clb', 'nclc'] },
        { op: 'ordinal_at_least', path: 'level', scale: CLB_SCALE, value: level },
      ],
    },
  };
}

/** Job-offer TEER within an inclusive band, used to select a threshold branch. */
function offerTeerBetween(low: number, high: number): EvaluatorSpec {
  return {
    op: 'all_of',
    of: [
      { op: 'gte', path: 'jobOffer.nocTeer', value: low },
      { op: 'lte', path: 'jobOffer.nocTeer', value: high },
    ],
  };
}

/**
 * The rural pilots and their predecessor share one language table: CLB 6 for a
 * TEER 0 or 1 job offer, 5 for TEER 2 or 3, 4 for TEER 4 or 5.
 */
const RURAL_LANGUAGE_BY_TEER: EvaluatorSpec = {
  op: 'any_of',
  of: [
    { op: 'all_of', of: [offerTeerBetween(0, 1), clbAtLeast('6')] },
    { op: 'all_of', of: [offerTeerBetween(2, 3), clbAtLeast('5')] },
    { op: 'all_of', of: [offerTeerBetween(4, 5), clbAtLeast('4')] },
  ],
};

/** A secondary-school credential or better, however it was obtained. */
const SECONDARY_OR_HIGHER: EvaluatorSpec = {
  op: 'ordinal_at_least',
  path: 'educationLevel',
  scale: EDUCATION_SCALE,
  value: 'secondary',
};

// ---------------------------------------------------------------------------
// Family class — spouse, common-law partner or conjugal partner, from abroad
// ---------------------------------------------------------------------------

export const caFamilySpousePartnerOutland: Pathway = {
  id: 'ca-family-spouse-partner-outland',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Family class sponsorship of a spouse, common-law partner or conjugal partner (overseas)',
    es: 'Patrocinio de cónyuge, pareja de hecho o pareja conyugal en la clase familiar (desde el exterior)',
  },
  summary: {
    en:
      'Permanent residence for the spouse, common-law partner or conjugal partner of a Canadian citizen or ' +
      'permanent resident, decided as a family class application for a permanent resident visa. Compared with ' +
      'the in-Canada class it does not require the applicant to hold temporary resident status or to be living ' +
      'with the sponsor, and a refusal carries a right of appeal to the Immigration Appeal Division under ' +
      'IRPA s. 63(1) — a difference that matters more than the paperwork does.',
    es:
      'Residencia permanente para el cónyuge, la pareja de hecho o la pareja conyugal de una persona con ' +
      'ciudadanía o residencia permanente canadiense, resuelta como solicitud de visado de residente permanente ' +
      'en la clase familiar. A diferencia de la vía interna, no exige que la persona solicitante tenga estatus ' +
      'de residente temporal ni que conviva con quien la patrocina, y la denegación admite recurso ante la ' +
      'División de Apelación de Inmigración conforme al art. 63(1) de la IRPA: una diferencia de más peso que la ' +
      'meramente documental.',
  },
  citations: [
    irpaS11_1,
    irpaS12_1,
    irpaS13_1,
    irpaS63_1,
    irprS4,
    irprS5,
    irprS117_1,
    irprS117_9,
    irprS130,
    irprS132,
    irprS133,
    irprS133_4,
    irccSpousalGuidance,
  ],
  criteria: [
    {
      id: 'ca-fc-outland-sponsor-eligibility',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpa-s-13-1', 'ca-irpr-s-130', 'ca-irpr-s-133', 'ca-irpr-s-133-4'],
      label: {
        en: 'The sponsor satisfies IRPR ss. 130 and 133 on filing and until the decision',
        es: 'La persona patrocinadora cumple los arts. 130 y 133 del IRPR desde la presentación hasta la resolución',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no facts about the sponsor. Sponsorship is a two-sided test and half of it — age, ' +
          'citizenship or permanent residence, residence in Canada, removal orders, listed convictions, default ' +
          'on an earlier undertaking or on court-ordered support, undischarged bankruptcy, non-disability ' +
          'social assistance, and the five-year bar on a person who was themselves sponsored as a partner — is ' +
          'not modelled here at all.',
        es:
          'Meridian no registra datos sobre la persona patrocinadora. El patrocinio es una prueba de dos caras y ' +
          'la mitad de ella —edad, ciudadanía o residencia permanente, residencia en Canadá, órdenes de ' +
          'expulsión, condenas enumeradas, incumplimiento de un compromiso anterior o de pensiones fijadas ' +
          'judicialmente, quiebra no rehabilitada, asistencia social por motivo distinto de la discapacidad y el ' +
          'plazo de cinco años para quien fue a su vez patrocinada como pareja— no se modela aquí.',
      },
      guidance: {
        en:
          'There is usually no income test on this route: IRPR s. 133(4) disapplies the income requirement for a ' +
          'sponsored partner with no dependent children, and for one whose dependent child has no dependent ' +
          'children of their own. Outside those cases the requirement returns, so "spouses are exempt from the ' +
          'income rule" is not a safe summary.',
        es:
          'Por lo general esta vía no exige prueba de ingresos: el art. 133(4) del IRPR excluye el requisito ' +
          'para la pareja patrocinada sin hijos a cargo y para aquella cuyo hijo a cargo no tiene a su vez hijos ' +
          'a cargo. Fuera de esos supuestos el requisito reaparece, de modo que «las parejas están exentas del ' +
          'requisito de ingresos» no es un resumen seguro.',
      },
    },
    {
      id: 'ca-fc-outland-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpa-s-12-1', 'ca-irpr-s-117-1', 'ca-irpr-s-4', 'ca-ircc-spousal-sponsorship-guidance'],
      label: {
        en: 'A genuine spousal, common-law or conjugal relationship with the sponsor',
        es: 'Relación conyugal, de hecho o de pareja conyugal genuina con quien patrocina',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'IRPR s. 4 excludes a relationship entered into primarily to acquire status or that is not genuine. ' +
          'That is a credibility finding on the whole evidentiary record — cohabitation, correspondence, ' +
          'finances, the account each partner gives at interview — and it is the single most common ground of ' +
          'refusal on this route. No engine performs it, and one that claimed to would be inventing a finding ' +
          'about a person’s private life.',
        es:
          'El art. 4 del IRPR excluye la relación contraída principalmente para obtener un estatus o que no sea ' +
          'genuina. Se trata de una valoración de credibilidad sobre todo el acervo probatorio —convivencia, ' +
          'correspondencia, finanzas, el relato de cada parte en la entrevista— y es el motivo de denegación más ' +
          'frecuente en esta vía. Ningún motor la realiza, y el que dijera hacerlo estaría inventando una ' +
          'conclusión sobre la vida privada de una persona.',
      },
      guidance: {
        en:
          'The three categories are not interchangeable. A common-law partner must have cohabited with the ' +
          'sponsor in a conjugal relationship for at least one year. A conjugal partner is by definition ' +
          'resident outside Canada and in a relationship of at least one year that legal, immigration, social, ' +
          'cultural or religious obstacles have prevented from becoming a marriage or a cohabiting one.',
        es:
          'Las tres categorías no son intercambiables. La pareja de hecho debe haber convivido con quien ' +
          'patrocina en relación conyugal durante al menos un año. La pareja conyugal reside por definición ' +
          'fuera de Canadá y mantiene una relación de al menos un año que obstáculos legales, migratorios, ' +
          'sociales, culturales o religiosos han impedido convertir en matrimonio o en convivencia.',
      },
    },
    {
      id: 'ca-fc-outland-minimum-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-5', 'ca-irpr-s-117-9'],
      label: {
        en: 'The sponsored partner is at least 18 years old',
        es: 'La pareja patrocinada tiene al menos 18 años',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'IRPR s. 5(a) provides that a person under 18 is not a spouse or common-law partner for any purpose of ' +
          'the Regulations, and s. 117(9)(a) separately excludes a conjugal partner under 18. Age is computed ' +
          'here from the recorded date of birth as at the assessment date; where the application has already ' +
          'been filed, the date that matters is the one the officer uses.',
        es:
          'El art. 5(a) del IRPR dispone que quien tiene menos de 18 años no es cónyuge ni pareja de hecho a ' +
          'ningún efecto del Reglamento, y el art. 117(9)(a) excluye por separado a la pareja conyugal menor de ' +
          '18. Aquí la edad se calcula a partir de la fecha de nacimiento registrada en la fecha de evaluación; ' +
          'si la solicitud ya se presentó, la fecha determinante es la que aplique el funcionario.',
      },
    },
    {
      id: 'ca-fc-outland-not-excluded',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-117-9', 'ca-irpr-s-132'],
      label: {
        en: 'The relationship is not one IRPR s. 117(9) excludes from the family class',
        es: 'La relación no es de las que el art. 117(9) del IRPR excluye de la clase familiar',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Each exclusion turns on a fact about the sponsor or about an earlier application: an undertaking for ' +
          'a previous partner that has not yet run its course, a subsisting marriage on either side, a year of ' +
          'living apart with a new partner, a ceremony neither spouse attended in person, or a family member ' +
          'left unexamined when the sponsor obtained permanent residence. None of those are recorded here.',
        es:
          'Cada exclusión depende de un hecho relativo a quien patrocina o a una solicitud anterior: un ' +
          'compromiso por una pareja previa aún vigente, un matrimonio subsistente de cualquiera de las partes, ' +
          'un año de separación con nueva pareja, una ceremonia a la que ninguno de los cónyuges asistió en ' +
          'persona, o un familiar no examinado cuando quien patrocina obtuvo la residencia permanente. Ninguno ' +
          'de esos datos consta aquí.',
      },
      guidance: {
        en:
          'Paragraph 117(9)(d) is the one that surfaces years later: a family member who existed but was not ' +
          'examined when the sponsor applied for permanent residence can never be sponsored, subject only to the ' +
          'narrow exception in s. 117(10). If the sponsor has ever failed to declare a partner or child, that ' +
          'needs to be raised with counsel before anything is filed.',
        es:
          'El apartado 117(9)(d) es el que aflora años después: un familiar que existía pero no fue examinado ' +
          'cuando quien patrocina solicitó la residencia permanente no puede ser patrocinado nunca, salvo la ' +
          'estrecha excepción del art. 117(10). Si quien patrocina omitió alguna vez declarar a una pareja o a ' +
          'un hijo, conviene plantearlo con un profesional antes de presentar nada.',
      },
    },
    {
      id: 'ca-fc-outland-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['ca-irpa-s-11-1'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not the same as inadmissibility. Whether a particular conviction makes a person ' +
          'inadmissible, and whether deemed rehabilitation or a rehabilitation application answers it, is an ' +
          'analysis under Division 4 of the Act that this engine does not perform.',
        es:
          'Un antecedente declarado no equivale a inadmisibilidad. Determinar si una condena concreta hace ' +
          'inadmisible a una persona, y si la rehabilitación presunta o solicitada lo resuelve, es un análisis ' +
          'de la División 4 de la Ley que este motor no realiza.',
      },
      guidance: {
        en:
          'This criterion is weighted material, never blocking: a self-declaration is evidence toward ' +
          'admissibility, not the finding itself, and the finding is the officer’s. Medical, security and ' +
          'misrepresentation grounds are not modelled at all.',
        es:
          'Este criterio es material, nunca bloqueante: una autodeclaración es indicio de admisibilidad, no la ' +
          'resolución, y la resolución corresponde al funcionario. Los motivos médicos, de seguridad y de ' +
          'falsedad no se modelan aquí.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-irpr-s-132', 'ca-irpa-s-63-1'],
    note: {
      en:
        'A grant is permanent residence, not a fixed-term permit. What is fixed is the sponsor’s undertaking: ' +
        'three years from the day the partner becomes a permanent resident, and it cannot be cancelled or ' +
        'shortened afterwards — not by the relationship ending, not by the sponsored person naturalising, not by ' +
        'either of them leaving the province or the country. A refusal on this route may be appealed to the ' +
        'Immigration Appeal Division.',
      es:
        'Lo que se concede es la residencia permanente, no un permiso de plazo fijo. Lo que sí tiene plazo es el ' +
        'compromiso de quien patrocina: tres años desde que la pareja adquiere la residencia permanente, y no ' +
        'cabe cancelarlo ni acortarlo después, ni porque termine la relación, ni porque la persona patrocinada ' +
        'se nacionalice, ni porque cualquiera de las dos se marche de la provincia o del país. La denegación en ' +
        'esta vía es recurrible ante la División de Apelación de Inmigración.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Spouse or common-law partner in Canada class
// ---------------------------------------------------------------------------

export const caFamilySpousePartnerInland: Pathway = {
  id: 'ca-family-spouse-partner-inland',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Spouse or common-law partner in Canada class (in-Canada sponsorship)',
    es: 'Clase de cónyuge o pareja de hecho en Canadá (patrocinio desde dentro del país)',
  },
  summary: {
    en:
      'Permanent residence for a spouse or common-law partner who is already in Canada with temporary resident ' +
      'status and is living with their sponsor here. It is a different class from the overseas family class, not ' +
      'a different address for the same one: it requires cohabitation in Canada and temporary resident status, ' +
      'it is not open to conjugal partners, an applicant may become eligible for an open work permit while it is ' +
      'processed, and because no permanent resident visa is issued a refusal carries no appeal to the ' +
      'Immigration Appeal Division.',
    es:
      'Residencia permanente para el cónyuge o la pareja de hecho que ya se encuentra en Canadá con estatus de ' +
      'residente temporal y convive aquí con quien la patrocina. Es una clase distinta de la clase familiar del ' +
      'exterior, no la misma con otro domicilio: exige convivencia en Canadá y estatus de residente temporal, no ' +
      'admite a la pareja conyugal, permite solicitar un permiso de trabajo abierto durante la tramitación y, al ' +
      'no expedirse visado de residente permanente, la denegación no admite recurso ante la División de ' +
      'Apelación de Inmigración.',
  },
  citations: [
    irpaS13_1,
    irpaS63_1,
    irprS4,
    irprS5,
    irprS124,
    irprS125,
    irprS130,
    irprS132,
    irprS133,
    irccSpousalGuidance,
    irccSclpcWorkPermit,
  ],
  criteria: [
    {
      id: 'ca-sclpc-sponsor-eligibility',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpa-s-13-1', 'ca-irpr-s-130', 'ca-irpr-s-133'],
      label: {
        en: 'The sponsor satisfies IRPR ss. 130 and 133 on filing and until the decision',
        es: 'La persona patrocinadora cumple los arts. 130 y 133 del IRPR desde la presentación hasta la resolución',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no facts about the sponsor, and this class needs one more of them than the overseas ' +
          'route does: a sponsor on this route must actually be residing in Canada, since the s. 130(2) ' +
          'concession for a citizen abroad is of no use to a couple who must be cohabiting here.',
        es:
          'Meridian no registra datos sobre quien patrocina, y esta clase exige uno más que la vía del exterior: ' +
          'aquí quien patrocina debe residir efectivamente en Canadá, pues la excepción del art. 130(2) para ' +
          'una persona con ciudadanía en el extranjero no sirve a una pareja que debe convivir aquí.',
      },
    },
    {
      id: 'ca-sclpc-cohabitation',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-124', 'ca-ircc-spousal-sponsorship-guidance'],
      label: {
        en: 'Cohabiting with the sponsor in Canada',
        es: 'Convivencia con quien patrocina en Canadá',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'IRPR s. 124(a) requires the applicant to be the spouse or common-law partner of a sponsor *and* to ' +
          'cohabit with that sponsor in Canada. Meridian records no household facts, and cohabitation must ' +
          'continue through to the decision rather than merely exist on the filing date.',
        es:
          'El art. 124(a) del IRPR exige ser cónyuge o pareja de hecho de quien patrocina *y* convivir con esa ' +
          'persona en Canadá. Meridian no registra datos de convivencia, y esta debe mantenerse hasta la ' +
          'resolución, no bastar en la fecha de presentación.',
      },
      guidance: {
        en:
          'A conjugal partner cannot use this class at all: the conjugal category exists for couples an obstacle ' +
          'prevents from living together, which is the opposite of what s. 124(a) requires.',
        es:
          'La pareja conyugal no puede acogerse a esta clase: la categoría conyugal existe para parejas a las ' +
          'que un obstáculo impide convivir, que es lo contrario de lo que exige el art. 124(a).',
      },
    },
    {
      id: 'ca-sclpc-temporary-resident-status',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-124'],
      label: {
        en: 'Holds temporary resident status in Canada',
        es: 'Tiene estatus de residente temporal en Canadá',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
          { op: 'one_of', path: 'currentStatus', values: ['visitor', 'student', 'worker'] },
        ],
      },
      humanReviewWhen: { op: 'equals', path: 'currentStatus', value: 'irregular' },
      humanReviewReason: {
        en:
          'The applicant is recorded as being in Canada without status. IRPR s. 124(b) requires temporary ' +
          'resident status, and whether restoration or any temporary public policy is available is a question ' +
          'for a person with the current instruments in front of them, not for this engine.',
        es:
          'Consta que la persona se encuentra en Canadá sin estatus. El art. 124(b) del IRPR exige estatus de ' +
          'residente temporal, y si cabe la restauración o alguna política pública temporal es cuestión para ' +
          'alguien que tenga a la vista los instrumentos vigentes, no para este motor.',
      },
      guidance: {
        en:
          'Meridian treats visitor, student and worker as temporary resident status. It does not model ' +
          'maintained status, restoration, or a temporary resident permit, each of which can change the answer; ' +
          'nor does it model the timing question of status expiring mid-process.',
        es:
          'Meridian considera estatus de residente temporal las situaciones de visitante, estudiante y ' +
          'trabajador. No modela el estatus mantenido, la restauración ni el permiso de residente temporal, que ' +
          'pueden alterar la respuesta, ni la cuestión temporal de que el estatus expire durante la tramitación.',
      },
    },
    {
      id: 'ca-sclpc-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-4', 'ca-irpr-s-124'],
      label: {
        en: 'A genuine spousal or common-law relationship with the sponsor',
        es: 'Relación conyugal o de hecho genuina con quien patrocina',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'IRPR s. 4 excludes a relationship entered into primarily to acquire status or that is not genuine. ' +
          'That finding rests on credibility across the whole record and is made by an officer, not computed.',
        es:
          'El art. 4 del IRPR excluye la relación contraída principalmente para obtener un estatus o que no sea ' +
          'genuina. Esa conclusión se apoya en la credibilidad del conjunto del expediente y la adopta un ' +
          'funcionario, no se calcula.',
      },
    },
    {
      id: 'ca-sclpc-minimum-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-5', 'ca-irpr-s-125'],
      label: {
        en: 'The sponsored partner is at least 18 years old',
        es: 'La pareja patrocinada tiene al menos 18 años',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'This criterion rests on s. 5(a), which excludes a person under 18 from being a spouse or common-law ' +
          'partner for every purpose of the Regulations and is therefore not affected by the repeal of ' +
          's. 125(1)(a) by SOR/2023-249. Whether the repealed paragraph said anything further is a question for ' +
          'the repealed text, which this record does not restate.',
        es:
          'Este criterio se apoya en el art. 5(a), que excluye a quien tiene menos de 18 años de ser cónyuge o ' +
          'pareja de hecho a todos los efectos del Reglamento y no se ve afectado por la derogación del ' +
          'art. 125(1)(a) por SOR/2023-249. Lo que dijera el precepto derogado es cuestión del texto derogado, ' +
          'que este registro no reproduce.',
      },
    },
    {
      id: 'ca-sclpc-not-excluded',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-125', 'ca-irpr-s-132'],
      label: {
        en: 'The relationship is not one IRPR s. 125(1) excludes from the class',
        es: 'La relación no es de las que el art. 125(1) del IRPR excluye de la clase',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The exclusions turn on the sponsor’s history and on an earlier application: an undertaking for a ' +
          'previous partner still running, a subsisting marriage, a year apart with a new partner, a ceremony ' +
          'neither spouse attended, or a family member left unexamined when the sponsor landed. None is recorded ' +
          'here.',
        es:
          'Las exclusiones dependen del historial de quien patrocina y de una solicitud anterior: un compromiso ' +
          'por una pareja previa aún vigente, un matrimonio subsistente, un año de separación con nueva pareja, ' +
          'una ceremonia a la que no asistió ninguno de los cónyuges, o un familiar no examinado cuando quien ' +
          'patrocina obtuvo la residencia. Nada de ello consta aquí.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-irpr-s-132', 'ca-irpa-s-63-1', 'ca-ircc-sclpc-open-work-permit'],
    note: {
      en:
        'The undertaking is three years from the day the partner becomes a permanent resident, as on the ' +
        'overseas route. Two things differ and both are consequential: an applicant living in Canada with their ' +
        'sponsor who holds an acknowledgement of receipt may apply for an open work permit under a public ' +
        'policy, and a refusal on this route reaches no appeal to the Immigration Appeal Division, because ' +
        'IRPA s. 63(1) attaches the appeal to the refusal of a permanent resident visa and no visa is issued to ' +
        'a person applying from inside Canada. The remedy is judicial review with leave.',
      es:
        'El compromiso es de tres años desde que la pareja adquiere la residencia permanente, igual que en la ' +
        'vía del exterior. Dos cosas difieren, y ambas pesan: quien vive en Canadá con la persona que le ' +
        'patrocina y dispone de acuse de recibo puede solicitar un permiso de trabajo abierto al amparo de una ' +
        'política pública, y la denegación en esta vía no admite recurso ante la División de Apelación de ' +
        'Inmigración, porque el art. 63(1) de la IRPA vincula el recurso a la denegación de un visado de ' +
        'residente permanente y a quien solicita desde dentro de Canadá no se le expide visado. El remedio es ' +
        'la revisión judicial previa admisión a trámite.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Dependent child
// ---------------------------------------------------------------------------

export const caFamilyDependentChild: Pathway = {
  id: 'ca-family-dependent-child',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Family class sponsorship of a dependent child',
    es: 'Patrocinio de un hijo a cargo en la clase familiar',
  },
  summary: {
    en:
      'Permanent residence for the dependent child of a Canadian citizen or permanent resident. "Dependent ' +
      'child" is a defined term: under 22 and not a spouse or common-law partner, or 22 and over where the ' +
      'child has depended substantially on the parent financially since before turning 22 and cannot be ' +
      'self-supporting because of a physical or mental condition.',
    es:
      'Residencia permanente para el hijo a cargo de una persona con ciudadanía o residencia permanente ' +
      'canadiense. «Hijo a cargo» es un término definido: menor de 22 años y sin cónyuge ni pareja de hecho, o ' +
      'de 22 años o más cuando ha dependido sustancialmente del sostén económico del progenitor desde antes de ' +
      'cumplir los 22 y no puede mantenerse por sí mismo a causa de una condición física o mental.',
  },
  citations: [
    irpaS11_1,
    irpaS12_1,
    irpaS13_1,
    irprS2DependentChild,
    irprS4,
    irprS25_1,
    irprS117_1,
    irprS130,
    irprS132,
    irprS133,
    irprS133_4,
    irccSpousalGuidance,
  ],
  criteria: [
    {
      id: 'ca-dc-sponsor-eligibility',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpa-s-13-1', 'ca-irpr-s-130', 'ca-irpr-s-133', 'ca-irpr-s-133-4'],
      label: {
        en: 'The sponsor satisfies IRPR ss. 130 and 133 on filing and until the decision',
        es: 'La persona patrocinadora cumple los arts. 130 y 133 del IRPR desde la presentación hasta la resolución',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no facts about the sponsor. On this route the income question also turns on a fact ' +
          'about the child: s. 133(4)(c) disapplies the income requirement for a dependent child who has no ' +
          'dependent children of their own, and reinstates it for one who does.',
        es:
          'Meridian no registra datos sobre quien patrocina. En esta vía la cuestión de los ingresos depende ' +
          'además de un dato del menor: el art. 133(4)(c) excluye el requisito de ingresos para el hijo a cargo ' +
          'que no tiene a su vez hijos a cargo, y lo restablece para quien sí los tiene.',
      },
    },
    {
      id: 'ca-dc-dependency-by-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-2-dependent-child', 'ca-irpr-s-117-1', 'ca-irpa-s-12-1', 'ca-irpr-s-25-1'],
      label: {
        en: 'Under 22 years of age, or dependent as an older child because of a condition',
        es: 'Menor de 22 años, o dependiente siendo mayor por causa de una condición',
      },
      evaluator: { op: 'lt', path: 'derived.ageYears', value: 22 },
      humanReviewWhen: { op: 'gte', path: 'derived.ageYears', value: 22 },
      humanReviewReason: {
        en:
          'The child is 22 or over. The over-22 branch of the definition requires substantial financial ' +
          'dependence on the parent since before the child turned 22 *and* an inability to be self-supporting ' +
          'because of a physical or mental condition. Neither is recorded here, and both are evidentiary ' +
          'findings rather than arithmetic.',
        es:
          'El hijo tiene 22 años o más. La rama de la definición para mayores de 22 exige dependencia económica ' +
          'sustancial del progenitor desde antes de cumplir esa edad *y* la imposibilidad de mantenerse por sí ' +
          'mismo a causa de una condición física o mental. Ninguno de los dos extremos consta aquí, y ambos son ' +
          'cuestiones probatorias, no aritméticas.',
      },
      guidance: {
        en:
          'Age is computed here from the recorded date of birth as at the assessment date, and that is almost ' +
          'certainly not the date the rule uses. IRPR s. 121 makes the family-member requirement subject to ' +
          's. 25.1(1), whose general rule locks a child’s age at the date the application is made. A child who ' +
          'was 21 on filing therefore should not lose the status by having a birthday in the queue — but ' +
          'ss. 25.1(2) to (9) set other lock-in dates for other situations, so which date governs a particular ' +
          'file has to be confirmed. Where an application is already in, read this criterion against that date ' +
          'and not against today.',
        es:
          'Aquí la edad se calcula a partir de la fecha de nacimiento registrada en la fecha de evaluación, que ' +
          'casi con certeza no es la fecha que utiliza la norma. El art. 121 del IRPR somete el requisito de ser ' +
          'familiar al art. 25.1(1), cuya regla general fija la edad del hijo en la fecha de presentación de la ' +
          'solicitud. Quien tenía 21 años al presentarla no debería, pues, perder la condición por cumplir años ' +
          'durante la espera; pero los apartados 25.1(2) a (9) fijan otras fechas para otros supuestos, de modo ' +
          'que debe confirmarse cuál rige en cada expediente. Si ya hay solicitud presentada, léase este ' +
          'criterio respecto de esa fecha y no de hoy.',
      },
    },
    {
      id: 'ca-dc-not-a-partner',
      kind: 'status',
      weight: 'material',
      citationIds: ['ca-irpr-s-2-dependent-child', 'ca-ircc-spousal-sponsorship-guidance'],
      label: {
        en: 'The child is not a spouse or common-law partner',
        es: 'El hijo no tiene cónyuge ni pareja de hecho',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The under-22 branch of the definition has two limbs and Meridian can only compute one of them. A ' +
          'child under 22 who is a spouse or common-law partner is not a dependent child, and the facts model ' +
          'holds no marital status for the applicant, so this limb has to be confirmed by a person rather than ' +
          'assumed from the age test having passed.',
        es:
          'La rama de la definición para menores de 22 años tiene dos elementos y Meridian solo puede calcular ' +
          'uno. Quien tiene menos de 22 años pero cónyuge o pareja de hecho no es hijo a cargo, y el modelo de ' +
          'datos no recoge el estado civil de la persona solicitante, de modo que este elemento debe ' +
          'confirmarlo una persona en lugar de darse por supuesto porque la prueba de edad se haya superado.',
      },
    },
    {
      id: 'ca-dc-parent-child-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-2-dependent-child', 'ca-irpr-s-4'],
      label: {
        en: 'A biological or adoptive parent-child relationship with the sponsor',
        es: 'Relación paterno-filial biológica o adoptiva con quien patrocina',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The relationship itself is not recorded in the facts model. Adoption adds a second test: IRPR s. 4(2) ' +
          'excludes an adoption entered into primarily to acquire status or that did not create a genuine ' +
          'parent-child relationship, and an adoption of a child under 18 must additionally have been in the ' +
          'child’s best interests within the meaning of the Hague Convention.',
        es:
          'La relación en sí no consta en el modelo de datos. La adopción añade una segunda prueba: el ' +
          'art. 4(2) del IRPR excluye la adopción realizada principalmente para obtener un estatus o que no haya ' +
          'creado una relación paterno-filial genuina, y la adopción de un menor de 18 años debe además haberse ' +
          'hecho en su interés superior en el sentido del Convenio de La Haya.',
      },
      guidance: {
        en:
          'Intercountry adoption and the sponsorship of an orphaned relative under IRPR s. 117(1)(f) and (g) run ' +
          'on separate procedures with provincial involvement, and are not encoded here.',
        es:
          'La adopción internacional y el patrocinio de un pariente huérfano conforme al art. 117(1)(f) y (g) ' +
          'del IRPR siguen procedimientos distintos con intervención provincial y no se codifican aquí.',
      },
    },
    {
      id: 'ca-dc-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['ca-irpa-s-11-1'],
      label: {
        en: 'No self-declared criminal record bearing on admissibility',
        es: 'Sin antecedentes penales autodeclarados que afecten a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A declared record is not an inadmissibility finding. Whether it produces one, and whether ' +
          'rehabilitation answers it, is a Division 4 analysis this engine does not perform.',
        es:
          'Un antecedente declarado no es una declaración de inadmisibilidad. Si la produce, y si la ' +
          'rehabilitación la resuelve, es un análisis de la División 4 que este motor no realiza.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-irpr-s-132'],
    note: {
      en:
        'The undertaking for a dependent child under 22 on the day of landing runs to the earlier of ten years ' +
        'and the child’s 25th birthday; for a child who is 22 or older on that day it runs three years. A child ' +
        'under 22 does not sign the sponsorship agreement, but the undertaking binds the sponsor either way.',
      es:
        'El compromiso por un hijo a cargo menor de 22 años el día de la obtención de la residencia dura lo que ' +
        'antes ocurra entre diez años y su 25º cumpleaños; si tiene 22 años o más ese día, dura tres. El menor ' +
        'de 22 no firma el acuerdo de patrocinio, pero el compromiso vincula igualmente a quien patrocina.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Parents and grandparents — PAUSED, and lottery-gated even when open
// ---------------------------------------------------------------------------

/**
 * Modelled as `suspended` rather than `open`, and the criteria below are
 * deliberately thin.
 *
 * This route has never been open in the sense the other family-class routes
 * are. A would-be sponsor submits an interest to sponsor form, IRCC draws from
 * the pool, and only an invited sponsor may file. Meeting every criterion in
 * IRPR ss. 117(1)(c), 130 and 133 buys nothing without an invitation, so a
 * criteria-based verdict on this program would answer a question nobody asked:
 * it would say "you qualify" to someone who cannot apply. Encoding the intake
 * gate as the first blocking criterion is the only honest shape.
 *
 * On 15 July 2026 IRCC paused intake outright — no new interest to sponsor
 * forms, no new invitations, until further notice.
 */
export const caFamilyParentGrandparent: Pathway = {
  id: 'ca-family-parent-grandparent',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'suspended',
  name: {
    en: 'Family class sponsorship of a parent or grandparent — intake paused',
    es: 'Patrocinio de padres o abuelos en la clase familiar — admisión suspendida',
  },
  summary: {
    en:
      'Permanent residence for the parent or grandparent of a Canadian citizen or permanent resident. Access has ' +
      'always been rationed by an invitation drawn from a pool of interest to sponsor forms rather than by open ' +
      'application, and on 15 July 2026 IRCC paused intake entirely: no new interest to sponsor forms and no new ' +
      'invitations until further notice. Applications already filed continue to be processed.',
    es:
      'Residencia permanente para el padre, la madre o los abuelos de una persona con ciudadanía o residencia ' +
      'permanente canadiense. El acceso siempre se ha racionado mediante invitación extraída de un fondo de ' +
      'formularios de interés en patrocinar, y no por solicitud abierta; el 15 de julio de 2026 IRCC suspendió ' +
      'por completo la admisión: ni nuevos formularios de interés ni nuevas invitaciones hasta nuevo aviso. Las ' +
      'solicitudes ya presentadas siguen tramitándose.',
  },
  closureNote: {
    en:
      'Intake is paused, not repealed: IRPR s. 117(1)(c) and (d) still constitute the class and pending ' +
      'applications are still being decided under it. IRCC states it will continue processing and plans to ' +
      'approve up to 15,000 people through the program in 2026. If you were invited and filed, your application ' +
      'stands. If you were not, the department’s own alternative is the super visa, which is a visitor status ' +
      'allowing stays of five years at a time with extensions, not a route to permanent residence — and the ' +
      'trade-offs between waiting for intake to reopen and settling for visitor status are exactly the kind of ' +
      'question to take to counsel rather than to an engine.',
    es:
      'La admisión está suspendida, no derogada: el art. 117(1)(c) y (d) del IRPR sigue constituyendo la clase y ' +
      'las solicitudes pendientes se siguen resolviendo con arreglo a ella. IRCC afirma que continuará la ' +
      'tramitación y prevé aprobar hasta 15.000 personas por esta vía en 2026. Si recibió invitación y presentó ' +
      'solicitud, esta sigue en pie. Si no, la alternativa que señala el propio departamento es el súper visado, ' +
      'que es un estatus de visitante con estancias de cinco años prorrogables y no una vía a la residencia ' +
      'permanente; sopesar la espera frente a ese estatus es justamente la clase de cuestión que corresponde a ' +
      'un profesional y no a un motor.',
  },
  citations: [irpaS12_1, irpaS13_1, irprS117_1, irprS130, irprS132, irprS133, irprS133_1j, irccPgpPause, irccPgpIntake],
  criteria: [
    {
      id: 'ca-pgp-invitation-to-apply',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-ircc-pgp-intake', 'ca-ircc-pgp-pause-2026'],
      label: {
        en: 'An invitation to apply, issued from the interest to sponsor pool',
        es: 'Invitación a solicitar, emitida desde el fondo de interés en patrocinar',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'This is an intake gate, not an eligibility rule, and it is currently shut. No set of facts about the ' +
          'applicant or the sponsor produces an invitation, so no criteria-based assessment can answer whether ' +
          'somebody can use this route. Treating a lottery as a checklist is a category error, and it is the ' +
          'error this criterion exists to prevent.',
        es:
          'Se trata de una barrera de admisión, no de un requisito de fondo, y ahora está cerrada. Ningún ' +
          'conjunto de datos sobre la persona solicitante o la patrocinadora produce una invitación, de modo que ' +
          'ninguna evaluación por criterios puede decir si alguien puede acogerse a esta vía. Tratar un sorteo ' +
          'como una lista de comprobación es un error de categoría, y es el que este criterio existe para evitar.',
      },
    },
    {
      id: 'ca-pgp-relationship',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpa-s-12-1', 'ca-irpr-s-117-1'],
      label: {
        en: 'The applicant is the sponsor’s parent, or the parent of the sponsor’s parent',
        es: 'La persona solicitante es progenitora de quien patrocina, o progenitora de su progenitor',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The facts model records no relationship to a sponsor. Note that the class reaches parents and ' +
          'grandparents only — an aunt, uncle or sibling comes within s. 117(1)(h) and only where the sponsor ' +
          'has no closer relative at all.',
        es:
          'El modelo de datos no recoge la relación con quien patrocina. Conviene notar que la clase alcanza ' +
          'solo a progenitores y abuelos: un tío, una tía o un hermano entran por el art. 117(1)(h) y únicamente ' +
          'cuando quien patrocina no tiene ningún pariente más cercano.',
      },
    },
    {
      id: 'ca-pgp-sponsor-income',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-133', 'ca-irpr-s-133-1-j', 'ca-irpr-s-130', 'ca-irpa-s-13-1'],
      label: {
        en: 'Sponsor income of at least the minimum necessary income plus 30% in each of three consecutive taxation years',
        es: 'Ingresos de quien patrocina de al menos el ingreso mínimo necesario más un 30% en cada uno de tres ejercicios fiscales consecutivos',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no sponsor income, and this is the strictest financial test in the family class: not ' +
          'one year at the low-income cut-off but three consecutive years at that figure plus 30%, computed for ' +
          'a household that counts the sponsor, the sponsored parents, their family members, and everyone the ' +
          'sponsor is already under an undertaking for. A sponsor living in Quebec is assessed by the province ' +
          'against its own criteria instead.',
        es:
          'Meridian no registra los ingresos de quien patrocina, y esta es la prueba económica más estricta de ' +
          'la clase familiar: no un año en el umbral de bajos ingresos, sino tres ejercicios consecutivos en esa ' +
          'cifra más un 30%, calculada para un hogar que cuenta a quien patrocina, a los progenitores ' +
          'patrocinados, a sus familiares y a todas las personas por las que quien patrocina ya tiene un ' +
          'compromiso vigente. A quien reside en Quebec lo evalúa la provincia con sus propios criterios.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-irpr-s-132', 'ca-ircc-pgp-pause-2026'],
    note: {
      en:
        'The undertaking for a parent or grandparent, and for their accompanying family members, runs twenty ' +
        'years from the day they become permanent residents — the longest in the Regulations, and it survives ' +
        'the sponsor’s own change of circumstances. That length, not the application fee, is the commitment ' +
        'being made.',
      es:
        'El compromiso por un progenitor o abuelo, y por sus familiares acompañantes, dura veinte años desde que ' +
        'obtienen la residencia permanente: el más largo del Reglamento, y subsiste pese a que cambien las ' +
        'circunstancias de quien patrocina. Ese plazo, y no la tasa de solicitud, es el compromiso que se asume.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Start-up Visa — PAUSED 30 June 2026
// ---------------------------------------------------------------------------

export const caStartUpVisa: Pathway = {
  id: 'ca-start-up-visa',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'suspended',
  name: {
    en: 'Start-up business class (Start-up Visa) — paused',
    es: 'Clase de empresa emergente (Start-up Visa) — suspendida',
  },
  summary: {
    en:
      'Permanent residence for an entrepreneur whose business has secured a commitment from a designated ' +
      'venture capital fund, angel investor group or business incubator. IRCC paused the program on ' +
      '30 June 2026: applications accepted before that date continue to be processed, and the class in IRPR ' +
      'ss. 98.01 to 98.13 remains in force, but no new application may be made.',
    es:
      'Residencia permanente para la persona emprendedora cuya empresa ha obtenido un compromiso de un fondo de ' +
      'capital riesgo, un grupo de inversores ángeles o una incubadora designados. IRCC suspendió el programa el ' +
      '30 de junio de 2026: las solicitudes admitidas antes de esa fecha se siguen tramitando y la clase de los ' +
      'arts. 98.01 a 98.13 del IRPR permanece vigente, pero no cabe presentar nuevas solicitudes.',
  },
  closureNote: {
    en:
      'Paused, not repealed. IRCC states it will continue to process applications accepted before 30 June 2026 ' +
      'and that an applicant already in the queue may still apply for an open work permit while it is decided. ' +
      'Holders of a 2025 commitment certificate had until 30 June 2026 to file; nothing else is being accepted. ' +
      'A commitment certificate that has since expired, or a designated organisation whose ability to issue ' +
      'certificates was suspended, raises questions specific to the file and belongs with counsel.',
    es:
      'Suspendida, no derogada. IRCC afirma que seguirá tramitando las solicitudes admitidas antes del 30 de ' +
      'junio de 2026 y que quien ya está en cola puede aún solicitar un permiso de trabajo abierto mientras se ' +
      'resuelve. Quienes tenían un certificado de compromiso de 2025 disponían hasta el 30 de junio de 2026 para ' +
      'presentarla; no se admite nada más. Un certificado de compromiso ya caducado, o una organización ' +
      'designada cuya facultad de emitirlos fue suspendida, plantea cuestiones propias del expediente que ' +
      'corresponden a un profesional.',
  },
  citations: [irprS98_01, irprS98_06, irccSuvThresholds, irccSuvPause],
  criteria: [
    {
      id: 'ca-suv-filing-deadline',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-ircc-suv-pause-2026'],
      label: {
        en: 'The application was filed on or before 30 June 2026',
        es: 'La solicitud se presentó el 30 de junio de 2026 o antes',
      },
      evaluator: { op: 'date_on_or_before', path: 'applicationLodgedOn', value: isoDate('2026-06-30') },
      guidance: {
        en:
          'IRCC stopped accepting start-up visa applications after 30 June 2026, and in the final window only ' +
          'from holders of a valid 2025 commitment certificate. The date the application was filed is therefore ' +
          'the first thing that decides whether the rest of this record is of any use.',
        es:
          'IRCC dejó de admitir solicitudes de start-up visa después del 30 de junio de 2026 y, en la última ' +
          'ventana, solo de quienes tenían un certificado de compromiso de 2025 válido. La fecha de presentación ' +
          'es, por tanto, lo primero que determina si el resto de este registro sirve de algo.',
      },
    },
    {
      id: 'ca-suv-commitment-certificate',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-98-01', 'ca-ircc-suv-thresholds'],
      label: {
        en: 'A commitment from a designated entity, less than six months old at filing',
        es: 'Compromiso de una entidad designada, con menos de seis meses de antigüedad al presentar',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records no commitment certificate. The regulation fixes the six-month freshness rule but ' +
          'leaves the money to the Minister: currently at least CAD 200,000 from a designated venture capital ' +
          'fund, at least CAD 75,000 from a designated angel investor group, or acceptance into a designated ' +
          'business incubator. Those figures are published, not enacted, and change without amendment.',
        es:
          'Meridian no registra certificados de compromiso. El reglamento fija la regla de los seis meses de ' +
          'vigencia pero deja el importe al Ministro: actualmente al menos 200.000 CAD de un fondo de capital ' +
          'riesgo designado, al menos 75.000 CAD de un grupo de inversores ángeles designado, o la admisión en ' +
          'una incubadora designada. Esas cifras se publican, no se promulgan, y cambian sin reforma normativa.',
      },
    },
    {
      id: 'ca-suv-qualifying-business',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-98-06', 'ca-ircc-suv-thresholds'],
      label: {
        en: 'A qualifying business with a compliant ownership structure',
        es: 'Empresa cualificada con una estructura de propiedad conforme',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Ownership and management facts are not modelled. The business must be incorporated in Canada, ' +
          'actively and continuously managed from within Canada, and have an essential part of its operations ' +
          'here; each applicant must hold at least 10% of the voting rights and the applicants together with the ' +
          'designated organisation more than 50%. The percentages are set by the Minister under s. 98.06(3), not ' +
          'by the text.',
        es:
          'Los datos de propiedad y gestión no se modelan. La empresa debe estar constituida en Canadá, ' +
          'gestionarse de forma activa y continuada desde Canadá y desarrollar aquí una parte esencial de sus ' +
          'operaciones; cada solicitante debe tener al menos el 10% de los derechos de voto y el conjunto de ' +
          'solicitantes junto con la organización designada más del 50%. Los porcentajes los fija el Ministro ' +
          'conforme al art. 98.06(3), no el texto.',
      },
      guidance: {
        en:
          'No more than five applicants may be members of the class in respect of the same business, and s. 98.06(2) ' +
          'lets an applicant satisfy the incorporation, management and operations limbs by intending to meet them ' +
          'after the visa is issued.',
        es:
          'No más de cinco solicitantes pueden pertenecer a la clase respecto de una misma empresa, y el ' +
          'art. 98.06(2) permite cumplir los requisitos de constitución, gestión y operaciones mediante la ' +
          'intención de satisfacerlos una vez expedido el visado.',
      },
    },
    {
      id: 'ca-suv-language',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-98-01'],
      label: {
        en: 'Benchmark level 5 in English or French across all four skill areas',
        es: 'Nivel 5 de referencia en inglés o francés en las cuatro destrezas',
      },
      evaluator: clbAtLeast('5'),
      guidance: {
        en:
          'This threshold sits in the regulation itself rather than in ministerial instructions, which makes it ' +
          'one of the few figures on this route that cannot move without an amendment. Results must be less than ' +
          'two years old at filing. Meridian compares a single recorded level; the rule requires benchmark 5 in ' +
          'all four abilities, so a recorded pass here is not proof the requirement is met.',
        es:
          'Este umbral está en el propio reglamento y no en instrucciones ministeriales, lo que lo convierte en ' +
          'una de las pocas cifras de esta vía que no puede cambiar sin reforma. Los resultados deben tener ' +
          'menos de dos años al presentar la solicitud. Meridian compara un único nivel registrado; la norma ' +
          'exige el nivel 5 en las cuatro destrezas, de modo que superar esta comprobación no prueba que el ' +
          'requisito se cumpla.',
      },
    },
    {
      id: 'ca-suv-settlement-funds',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-98-01'],
      label: {
        en: 'Transferable, unencumbered settlement funds of half the applicable low-income cut-off',
        es: 'Fondos de asentamiento transferibles y libres de cargas por la mitad del umbral de bajos ingresos aplicable',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Settlement funds are not a field in the facts model. The amount is half the Statistics Canada ' +
          'low-income cut-off for urban areas of 500,000 or more, for a household of the applicant plus their ' +
          'family members, and any investment made by the designated entity is expressly excluded from it.',
        es:
          'Los fondos de asentamiento no son un campo del modelo de datos. El importe es la mitad del umbral de ' +
          'bajos ingresos de Statistics Canada para áreas urbanas de 500.000 habitantes o más, para un hogar ' +
          'formado por la persona solicitante y sus familiares, y se excluye expresamente cualquier inversión ' +
          'realizada por la entidad designada.',
      },
    },
    {
      id: 'ca-suv-outside-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-98-01'],
      label: {
        en: 'Intention to reside in a province other than Quebec',
        es: 'Intención de residir en una provincia distinta de Quebec',
      },
      evaluator: { op: 'is_true', path: 'intent.intendsToResideOutsideQuebec' },
      guidance: {
        en: 'Quebec selects its own business immigrants under a separate agreement with the federal government.',
        es: 'Quebec selecciona a sus propios inmigrantes empresariales mediante un acuerdo específico con el gobierno federal.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-ircc-suv-pause-2026'],
    note: {
      en:
        'A grant is permanent residence and does not depend on the business succeeding — the commitment is ' +
        'assessed before the visa, not after it. IRCC publishes no service standard Meridian is willing to ' +
        'restate for this class, so no processing figure is stated here.',
      es:
        'Lo que se concede es la residencia permanente y no depende de que la empresa prospere: el compromiso se ' +
        'valora antes del visado, no después. IRCC no publica un estándar de servicio que Meridian esté ' +
        'dispuesto a reproducir para esta clase, por lo que aquí no se indica plazo de tramitación alguno.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Atlantic Immigration Program
// ---------------------------------------------------------------------------

export const caAtlanticImmigration: Pathway = {
  id: 'ca-atlantic-immigration',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Atlantic immigration class (Atlantic Immigration Program)',
    es: 'Clase de inmigración del Atlántico (Programa de Inmigración del Atlántico)',
  },
  summary: {
    en:
      'Permanent residence for a skilled worker or a recent graduate of an Atlantic institution who holds a job ' +
      'offer from an employer designated by New Brunswick, Newfoundland and Labrador, Nova Scotia or Prince ' +
      'Edward Island and an endorsement certificate from that province. Unlike the pilots elsewhere in this file ' +
      'it is a class in the Regulations, added by SOR/2021-242, rather than a set of ministerial instructions.',
    es:
      'Residencia permanente para trabajadores cualificados o titulados recientes de una institución del ' +
      'Atlántico que cuenten con una oferta de empleo de un empleador designado por Nuevo Brunswick, Terranova y ' +
      'Labrador, Nueva Escocia o la Isla del Príncipe Eduardo y con un certificado de aval de esa provincia. A ' +
      'diferencia de los pilotos de este mismo archivo, es una clase del Reglamento, incorporada por ' +
      'SOR/2021-242, y no un conjunto de instrucciones ministeriales.',
  },
  citations: [irprS87_3, irprS74_1, irccAipThresholds, irccAipProgram],
  criteria: [
    {
      id: 'ca-aip-endorsement',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-3', 'ca-ircc-aip-program'],
      label: {
        en: 'A valid, unrevoked endorsement certificate from an Atlantic province',
        es: 'Certificado de aval válido y no revocado de una provincia atlántica',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The endorsement is the gate, and it is issued by the province rather than by IRCC. A designated ' +
          'employer makes the offer, the candidate obtains a settlement plan from a service provider ' +
          'organisation, the employer applies to the province, and the province issues the certificate — which ' +
          'must still be valid when the permanent residence application is made and must not have been revoked ' +
          'since. Meridian records none of that, and it is not a criterion any set of applicant facts can ' +
          'satisfy on its own.',
        es:
          'El aval es la puerta de entrada y lo expide la provincia, no IRCC. Un empleador designado hace la ' +
          'oferta, la persona candidata obtiene un plan de asentamiento de una organización proveedora de ' +
          'servicios, el empleador lo solicita a la provincia y esta expide el certificado, que debe seguir ' +
          'vigente al presentar la solicitud de residencia permanente y no haber sido revocado. Meridian no ' +
          'registra nada de eso, y no es un requisito que ningún conjunto de datos de la persona solicitante ' +
          'pueda satisfacer por sí solo.',
      },
      guidance: {
        en:
          'The applicant must also intend to reside in the province that issued the endorsement. Moving to ' +
          'another province after landing is lawful — mobility rights are constitutional — but an intention ' +
          'formed before the visa that was never to settle in the endorsing province goes to the genuineness of ' +
          'the application.',
        es:
          'La persona solicitante debe además tener intención de residir en la provincia que expidió el aval. ' +
          'Mudarse a otra provincia tras la llegada es lícito —la libertad de circulación es constitucional—, ' +
          'pero una intención formada antes del visado de no asentarse nunca en la provincia avalista afecta a ' +
          'la autenticidad de la solicitud.',
      },
    },
    {
      id: 'ca-aip-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-3'],
      label: {
        en: 'A qualifying offer of continuous full-time employment from the endorsing employer',
        es: 'Oferta cualificada de empleo continuo a tiempo completo del empleador avalista',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
          { op: 'is_true', path: 'jobOffer.fullTime' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
          offerTeerBetween(0, 4),
        ],
      },
      humanReviewWhen: {
        op: 'all_of',
        of: [
          { op: 'gte', path: 'jobOffer.nocTeer', value: 0 },
          { op: 'lte', path: 'jobOffer.nocTeer', value: 3 },
          { op: 'lt', path: 'jobOffer.durationMonths', value: 12 },
        ],
      },
      humanReviewReason: {
        en:
          'The offer is recorded as running less than twelve months in a TEER 0 to 3 occupation. IRPR ' +
          's. 87.3(6)(a) requires an indeterminate offer only for TEER 4 and at least one year after the visa is ' +
          'issued in every other case, so how the recorded duration maps onto that has to be read by a person.',
        es:
          'La oferta consta con una duración inferior a doce meses en una ocupación TEER 0 a 3. El ' +
          'art. 87.3(6)(a) del IRPR exige oferta indefinida solo para TEER 4 y, en los demás casos, al menos un ' +
          'año desde la expedición del visado, de modo que la correspondencia con la duración registrada debe ' +
          'valorarla una persona.',
      },
      guidance: {
        en:
          'Two limbs of s. 87.3(6) are not modelled. The offer must come from the employer named in the ' +
          'endorsement certificate and that employer must not be more than 50% owned or controlled by the ' +
          'applicant or their partner; and the offer’s TEER category must be at the same level as, or higher ' +
          'than, the occupation most of the qualifying experience was acquired in, on the hierarchy in ' +
          's. 87.3(7) where TEER 2 and 3 count as one level.',
        es:
          'Dos elementos del art. 87.3(6) no se modelan. La oferta debe proceder del empleador designado en el ' +
          'certificado de aval, y ese empleador no puede pertenecer o estar controlado en más de un 50% por la ' +
          'persona solicitante o su pareja; y la categoría TEER de la oferta debe estar al mismo nivel o por ' +
          'encima de la ocupación en la que se adquirió la mayor parte de la experiencia computable, según la ' +
          'jerarquía del art. 87.3(7), donde TEER 2 y 3 cuentan como un solo nivel.',
      },
    },
    {
      id: 'ca-aip-work-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-3', 'ca-ircc-aip-thresholds'],
      label: {
        en: 'One year of qualifying work experience in the past five years, or the Atlantic graduate exemption',
        es: 'Un año de experiencia laboral computable en los últimos cinco años, o la exención por titulación en el Atlántico',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Neither branch can be computed from the recorded facts. The work branch is one year of full-time ' +
          'experience, or the part-time equivalent, in a TEER 0 to 4 occupation within the past five years — ' +
          'which IRCC operationalises as 1,560 hours accumulated over at least twelve months — excluding all ' +
          'self-employment and any Canadian work done without authorisation and temporary resident status. ' +
          'Meridian computes no five-year hour total. The graduate branch turns on a two-year credential from a ' +
          'listed Atlantic institution, sixteen months of physical presence in the province, and the absence of ' +
          'a return-home scholarship, none of which is recorded.',
        es:
          'Ninguna de las dos ramas puede calcularse con los datos registrados. La rama laboral exige un año de ' +
          'experiencia a tiempo completo, o su equivalente a tiempo parcial, en una ocupación TEER 0 a 4 dentro ' +
          'de los últimos cinco años —que IRCC concreta en 1.560 horas acumuladas a lo largo de al menos doce ' +
          'meses—, excluyendo todo trabajo por cuenta propia y cualquier trabajo en Canadá realizado sin ' +
          'autorización y sin estatus de residente temporal. Meridian no calcula totales de horas a cinco años. ' +
          'La rama de titulación depende de una credencial de dos años de una institución atlántica listada, ' +
          'dieciséis meses de presencia física en la provincia y la ausencia de una beca con obligación de ' +
          'retorno, extremos que tampoco constan.',
      },
    },
    {
      id: 'ca-aip-language',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-3', 'ca-irpr-s-74-1', 'ca-ircc-aip-thresholds'],
      label: {
        en: 'Language results at the threshold the Minister fixes for the job offer’s TEER category',
        es: 'Resultados lingüísticos en el umbral que el Ministro fija para la categoría TEER de la oferta',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'all_of', of: [offerTeerBetween(0, 3), clbAtLeast('5')] },
          { op: 'all_of', of: [{ op: 'equals', path: 'jobOffer.nocTeer', value: 4 }, clbAtLeast('4')] },
        ],
      },
      guidance: {
        en:
          'The regulation fixes no number: s. 87.3(2)(f) requires the applicant to meet "the applicable ' +
          'threshold that is fixed by the Minister under subsection 74(1)". The figures compared here — CLB or ' +
          'NCLC 5 for a TEER 0 to 3 offer and 4 for TEER 4 — are IRCC’s published thresholds and can be changed ' +
          'by publication alone. Results must be less than two years old at filing, and the rule requires the ' +
          'threshold in all four abilities where Meridian compares one recorded level.',
        es:
          'El reglamento no fija cifra alguna: el art. 87.3(2)(f) exige alcanzar «el umbral aplicable fijado por ' +
          'el Ministro conforme al apartado 74(1)». Las cifras aquí comparadas —CLB o NCLC 5 para una oferta ' +
          'TEER 0 a 3 y 4 para TEER 4— son los umbrales publicados por IRCC y pueden cambiarse por simple ' +
          'publicación. Los resultados deben tener menos de dos años al presentar la solicitud, y la norma exige ' +
          'el umbral en las cuatro destrezas mientras que Meridian compara un único nivel registrado.',
      },
    },
    {
      id: 'ca-aip-education',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-3'],
      label: {
        en: 'The educational credential IRPR s. 87.3(9) sets for the job offer’s TEER category',
        es: 'La credencial educativa que el art. 87.3(9) del IRPR fija para la categoría TEER de la oferta',
      },
      evaluator: {
        op: 'any_of',
        of: [
          {
            op: 'all_of',
            of: [
              offerTeerBetween(0, 1),
              {
                op: 'ordinal_at_least',
                path: 'educationLevel',
                scale: EDUCATION_SCALE,
                value: 'post_secondary_diploma',
              },
            ],
          },
          { op: 'all_of', of: [offerTeerBetween(2, 4), SECONDARY_OR_HIGHER] },
        ],
      },
      guidance: {
        en:
          'A TEER 0 or 1 offer needs a Canadian post-secondary credential from a programme of at least one year, ' +
          'or a foreign credential with an equivalency assessment to that level; TEER 2, 3 or 4 needs a Canadian ' +
          'educational credential or an assessed foreign equivalent. Unlike the language threshold, this one is ' +
          'in the regulation. An equivalency assessment must be less than five years old on the date the ' +
          'application is made, which Meridian does not check.',
        es:
          'Una oferta TEER 0 o 1 exige una credencial postsecundaria canadiense de un programa de al menos un ' +
          'año, o una credencial extranjera con evaluación de equivalencia a ese nivel; TEER 2, 3 o 4 exige una ' +
          'credencial educativa canadiense o su equivalente extranjero evaluado. A diferencia del umbral ' +
          'lingüístico, este sí está en el reglamento. La evaluación de equivalencia debe tener menos de cinco ' +
          'años en la fecha de presentación, extremo que Meridian no comprueba.',
      },
    },
    {
      id: 'ca-aip-settlement-funds',
      kind: 'economic',
      weight: 'material',
      citationIds: ['ca-irpr-s-87-3'],
      label: {
        en: 'Settlement funds of one eighth of the applicable low-income cut-off, unless already working in Canada',
        es: 'Fondos de asentamiento por un octavo del umbral de bajos ingresos aplicable, salvo si ya se trabaja en Canadá',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Settlement funds are not a field in the facts model, and neither is the exemption: an applicant who ' +
          'is authorised to work and already working in Canada does not have to show them at all.',
        es:
          'Los fondos de asentamiento no son un campo del modelo de datos, ni tampoco la exención: quien está ' +
          'autorizado a trabajar y ya trabaja en Canadá no tiene que acreditarlos.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-ircc-aip-program'],
    note: {
      en:
        'A grant is permanent residence. A candidate holding an endorsement and a qualifying offer may apply ' +
        'separately for a temporary work permit to start work while the application is decided; that permit is ' +
        'a different application with its own requirements and is not encoded here.',
      es:
        'Lo que se concede es la residencia permanente. Quien dispone de aval y de oferta cualificada puede ' +
        'solicitar aparte un permiso de trabajo temporal para empezar a trabajar mientras se resuelve; ese ' +
        'permiso es una solicitud distinta con requisitos propios y no se codifica aquí.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Rural Community Immigration Pilot — the live successor to RNIP
// ---------------------------------------------------------------------------

export const caRuralCommunityPilot: Pathway = {
  id: 'ca-rural-community-pilot',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Rural Community Immigration Pilot',
    es: 'Piloto de Inmigración de Comunidades Rurales',
  },
  summary: {
    en:
      'Permanent residence for a skilled worker with a job offer from an employer designated by one of the ' +
      'fourteen participating rural communities. It is the live successor to the Rural and Northern Immigration ' +
      'Pilot, which ended in 2024, and it runs alongside a Francophone Community Immigration Pilot that is not ' +
      'encoded here. Like the other pilots it rests on ministerial instructions under IRPA s. 14.1 rather than ' +
      'on a class in the Regulations, so its criteria are published rather than enacted.',
    es:
      'Residencia permanente para trabajadores cualificados con una oferta de empleo de un empleador designado ' +
      'por una de las catorce comunidades rurales participantes. Es el sucesor vigente del Piloto de Inmigración ' +
      'Rural y del Norte, terminado en 2024, y convive con un Piloto de Inmigración de Comunidades Francófonas ' +
      'que aquí no se codifica. Como los demás pilotos, se apoya en instrucciones ministeriales del art. 14.1 de ' +
      'la IRPA y no en una clase del Reglamento, de modo que sus requisitos se publican, no se promulgan.',
  },
  citations: [irpaS14_1, irccRcipProgram],
  criteria: [
    {
      id: 'ca-rcip-community-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-ircc-rcip-program'],
      label: {
        en: 'A job offer from an employer designated by a participating community',
        es: 'Oferta de empleo de un empleador designado por una comunidad participante',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Meridian records the country of the employer but not the community, and community designation is the ' +
          'whole point of this route: the offer must come from an employer a participating community has ' +
          'designated, for a role in a sector that community has prioritised, and each community sets further ' +
          'requirements of its own that are published on its own website rather than by IRCC.',
        es:
          'Meridian registra el país del empleador pero no la comunidad, y la designación comunitaria es la ' +
          'esencia de esta vía: la oferta debe provenir de un empleador designado por una comunidad ' +
          'participante, para un puesto de un sector priorizado por esa comunidad, y cada comunidad fija ' +
          'requisitos adicionales publicados en su propia web y no por IRCC.',
      },
    },
    {
      id: 'ca-rcip-work-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-ircc-rcip-program'],
      label: {
        en: 'At least one year (1,560 hours) of related work experience in the past three years',
        es: 'Al menos un año (1.560 horas) de experiencia laboral relacionada en los últimos tres años',
      },
      evaluator: {
        op: 'collection_any',
        path: 'workExperience',
        where: {
          op: 'all_of',
          of: [
            { op: 'gte', path: 'nocTeer', value: 0 },
            { op: 'lte', path: 'nocTeer', value: 5 },
            { op: 'not', of: { op: 'is_false', path: 'authorized' } },
          ],
        },
      },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The evaluator confirms only that some authorised experience in a classified occupation is recorded. ' +
          'The rule is an hours total — 1,560 over a period of at least twelve months within the past three ' +
          'years, excluding unpaid and self-employed work — measured against a TEER relationship to the job ' +
          'offer that has its own table and a specific exception for registered nurses moving into TEER 3 or 4 ' +
          'care roles. Meridian computes no such total for occupations outside TEER 0 to 3, and computes no ' +
          'hours at all.',
        es:
          'El evaluador solo confirma que consta alguna experiencia autorizada en una ocupación clasificada. La ' +
          'norma es un cómputo de horas —1.560 a lo largo de al menos doce meses dentro de los últimos tres ' +
          'años, excluyendo el trabajo no remunerado y el trabajo por cuenta propia— medido frente a una ' +
          'relación TEER con la oferta que tiene su propia tabla y una excepción específica para enfermería ' +
          'registrada que pasa a puestos asistenciales TEER 3 o 4. Meridian no calcula ese total para ' +
          'ocupaciones fuera de TEER 0 a 3, ni calcula horas en absoluto.',
      },
    },
    {
      id: 'ca-rcip-language',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['ca-ircc-rcip-program'],
      label: {
        en: 'An approved language test at the level set for the job offer’s TEER category',
        es: 'Prueba lingüística aprobada en el nivel fijado para la categoría TEER de la oferta',
      },
      evaluator: RURAL_LANGUAGE_BY_TEER,
      guidance: {
        en:
          'CLB or NCLC 6 for a TEER 0 or 1 offer, 5 for TEER 2 or 3, 4 for TEER 4 or 5, in all four abilities. ' +
          'These are published thresholds, not regulation, and Meridian compares a single recorded level rather ' +
          'than four.',
        es:
          'CLB o NCLC 6 para una oferta TEER 0 o 1, 5 para TEER 2 o 3 y 4 para TEER 4 o 5, en las cuatro ' +
          'destrezas. Son umbrales publicados, no reglamentarios, y Meridian compara un único nivel registrado ' +
          'en lugar de cuatro.',
      },
    },
    {
      id: 'ca-rcip-education',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['ca-ircc-rcip-program'],
      label: {
        en: 'A Canadian educational credential, or an assessed foreign equivalent',
        es: 'Credencial educativa canadiense, o su equivalente extranjero evaluado',
      },
      evaluator: SECONDARY_OR_HIGHER,
      guidance: {
        en:
          'A Canadian secondary school diploma or a recognised post-secondary credential satisfies this; a ' +
          'foreign credential needs an educational credential assessment from a designated organisation, less ' +
          'than five years old on the date of application. Meridian compares the recorded education level and ' +
          'does not check whether an assessment exists or is still current.',
        es:
          'Basta un diploma de secundaria canadiense o una credencial postsecundaria reconocida; una credencial ' +
          'extranjera requiere una evaluación de credenciales educativas de una organización designada, con ' +
          'menos de cinco años en la fecha de solicitud. Meridian compara el nivel educativo registrado y no ' +
          'comprueba si existe evaluación ni si sigue vigente.',
      },
    },
    {
      id: 'ca-rcip-settlement-funds',
      kind: 'economic',
      weight: 'material',
      citationIds: ['ca-ircc-rcip-program'],
      label: {
        en: 'Enough money to support the applicant and their family on arrival',
        es: 'Fondos suficientes para mantenerse la persona solicitante y su familia a la llegada',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'Settlement funds are not a field in the facts model, and the required amount varies with family size ' +
          'and is republished annually.',
        es:
          'Los fondos de asentamiento no son un campo del modelo de datos, y el importe exigido varía según el ' +
          'tamaño de la familia y se vuelve a publicar cada año.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-irpa-s-14-1', 'ca-ircc-rcip-program'],
    note: {
      en:
        'A grant is permanent residence, with no condition tying the holder to the community — mobility rights ' +
        'are constitutional and a pilot cannot displace them. What the pilot does rest on is an intention, held ' +
        'when the application is made, to live and work in the community that designated the employer. Because ' +
        'the class exists under ministerial instructions rather than in the Regulations, IRPA s. 14.1(2) caps ' +
        'processing at 2,750 applications in any year in a class established that way, and the instructions ' +
        'themselves can be amended or withdrawn without a regulatory amendment.',
      es:
        'Lo que se concede es la residencia permanente, sin condición que ate a la persona titular a la ' +
        'comunidad: la libertad de circulación es constitucional y un piloto no puede desplazarla. Lo que el ' +
        'piloto sí presupone es la intención, existente al presentar la solicitud, de vivir y trabajar en la ' +
        'comunidad que designó al empleador. Al existir la clase por instrucciones ministeriales y no en el ' +
        'Reglamento, el art. 14.1(2) de la IRPA limita la tramitación a 2.750 solicitudes al año en una clase ' +
        'así creada, y las propias instrucciones pueden modificarse o retirarse sin reforma reglamentaria.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Rural and Northern Immigration Pilot — CLOSED
// ---------------------------------------------------------------------------

export const caRuralNorthernPilot: Pathway = {
  id: 'ca-rural-northern-pilot',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'closed',
  closedOn: isoDate('2024-09-01'),
  name: {
    en: 'Rural and Northern Immigration Pilot — closed',
    es: 'Piloto de Inmigración Rural y del Norte — cerrado',
  },
  summary: {
    en:
      'A community-driven route to permanent residence for skilled workers with a job offer in one of eleven ' +
      'participating communities, which required a recommendation from the community itself. IRCC states the ' +
      'pilot ended on 31 August 2024; applications received on or before that date are still being processed.',
    es:
      'Vía a la residencia permanente impulsada por las comunidades, para trabajadores cualificados con oferta ' +
      'de empleo en una de las once comunidades participantes, que exigía una recomendación de la propia ' +
      'comunidad. IRCC indica que el piloto terminó el 31 de agosto de 2024; las solicitudes recibidas en esa ' +
      'fecha o antes se siguen tramitando.',
  },
  closureNote: {
    en:
      'No new application can be made. IRCC accepted applications received on or before 31 August 2024 and ' +
      'continues to process them, and a candidate with an application still in the queue may remain eligible to ' +
      'apply for a work permit while it is decided. The route was not simply withdrawn: IRCC now runs the Rural ' +
      'Community Immigration Pilot and the Francophone Community Immigration Pilot over a partly overlapping set ' +
      'of communities, and a candidate who was recommended under the old pilot has no automatic standing under ' +
      'the new one — the designation, the employer and the recommendation all have to be obtained again.',
    es:
      'No cabe presentar nuevas solicitudes. IRCC admitió las recibidas hasta el 31 de agosto de 2024 inclusive ' +
      'y las sigue tramitando; quien tenga una solicitud pendiente puede seguir pudiendo pedir un permiso de ' +
      'trabajo mientras se resuelve. La vía no se retiró sin más: IRCC opera ahora el Piloto de Inmigración de ' +
      'Comunidades Rurales y el Piloto de Inmigración de Comunidades Francófonas sobre un conjunto de ' +
      'comunidades en parte coincidente, y quien fue recomendado bajo el piloto antiguo no adquiere posición ' +
      'alguna en el nuevo: la designación, el empleador y la recomendación han de obtenerse de nuevo.',
  },
  citations: [irpaS14_1, irccRnipClosure, irccRnipEligibility, irccRcipProgram],
  criteria: [
    {
      id: 'ca-rnip-application-before-closure',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-ircc-rnip-closure'],
      label: {
        en: 'The application was received on or before 31 August 2024',
        es: 'La solicitud se recibió el 31 de agosto de 2024 o antes',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: isoDate('2024-09-01') },
      guidance: {
        en:
          'IRCC’s wording is "received on or before this date", so 31 August 2024 was still a day on which an ' +
          'application could be made and 1 September 2024 was the first day it could not. The pathway records ' +
          'the latter as its closing date for exactly that reason: reading an inclusive deadline as exclusive ' +
          'moves the line by a day, and a day is enough to change an answer.',
        es:
          'IRCC dice «recibidas en esta fecha o antes», de modo que el 31 de agosto de 2024 todavía era un día ' +
          'hábil para presentar y el 1 de septiembre de 2024 fue el primero en que ya no. La vía registra esta ' +
          'última como fecha de cierre precisamente por eso: leer como excluyente un plazo inclusivo desplaza la ' +
          'línea un día, y un día basta para cambiar una respuesta.',
      },
    },
    {
      id: 'ca-rnip-community-recommendation',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-ircc-rnip-eligibility'],
      label: {
        en: 'A recommendation from the participating community',
        es: 'Recomendación de la comunidad participante',
      },
      evaluator: TARGET_IS_CANADA,
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The recommendation was issued by the community, on the community’s own published criteria, after a ' +
          'job offer from an employer in it. Meridian records none of that, and the criteria differed from one ' +
          'community to the next.',
        es:
          'La recomendación la emitía la comunidad, con sus propios criterios publicados, tras una oferta de ' +
          'empleo de un empleador radicado en ella. Meridian no registra nada de eso, y los criterios variaban ' +
          'de una comunidad a otra.',
      },
    },
    {
      id: 'ca-rnip-language',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['ca-ircc-rnip-eligibility'],
      label: {
        en: 'Language results at the level set for the job offer’s occupational category',
        es: 'Resultados lingüísticos en el nivel fijado para la categoría ocupacional de la oferta',
      },
      evaluator: RURAL_LANGUAGE_BY_TEER,
      guidance: {
        en:
          'The thresholds encoded here are those IRCC published for candidates who applied for community ' +
          'recommendation on or after 16 November 2022: CLB or NCLC 6 for TEER 0 and 1, 5 for TEER 2 and 3, 4 ' +
          'for TEER 4 and 5. Candidates who applied before that date were assessed against the pre-2021 NOC ' +
          'skill levels (0 and A, B, C and D), which this rule does not model — for those files the level must ' +
          'be read off the version of the guidance in force at the time.',
        es:
          'Los umbrales aquí codificados son los que IRCC publicó para quienes solicitaron la recomendación ' +
          'comunitaria el 16 de noviembre de 2022 o después: CLB o NCLC 6 para TEER 0 y 1, 5 para TEER 2 y 3, y ' +
          '4 para TEER 4 y 5. A quienes solicitaron antes se les evaluó con los niveles de la CNP anterior a ' +
          '2021 (0 y A, B, C y D), que esta regla no modela: en esos expedientes el nivel debe leerse en la ' +
          'versión de la guía vigente entonces.',
      },
    },
    {
      id: 'ca-rnip-education',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['ca-ircc-rnip-eligibility'],
      label: {
        en: 'A Canadian educational credential, or an assessed foreign equivalent',
        es: 'Credencial educativa canadiense, o su equivalente extranjero evaluado',
      },
      evaluator: SECONDARY_OR_HIGHER,
    },
  ],
  durations: {
    citationIds: ['ca-irpa-s-14-1', 'ca-ircc-rnip-closure', 'ca-ircc-rcip-program'],
    note: {
      en:
        'What the pilot granted was permanent residence, and permanent residence obtained under a route that has ' +
        'since closed is not weakened by the closure. Nothing about status, renewal of a permanent resident card ' +
        'or eligibility for citizenship turns on the pilot having ended.',
      es:
        'Lo que el piloto concedía era la residencia permanente, y una residencia permanente obtenida por una ' +
        'vía después cerrada no se debilita por el cierre. Ni el estatus, ni la renovación de la tarjeta de ' +
        'residente permanente, ni el acceso a la ciudadanía dependen de que el piloto haya terminado.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Agri-Food Pilot — CLOSED
// ---------------------------------------------------------------------------

export const caAgriFoodPilot: Pathway = {
  id: 'ca-agri-food-pilot',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'closed',
  closedOn: isoDate('2025-05-14'),
  name: {
    en: 'Agri-Food Pilot — closed',
    es: 'Piloto Agroalimentario — cerrado',
  },
  summary: {
    en:
      'A route to permanent residence for experienced non-seasonal workers in named agriculture and agri-food ' +
      'occupations. IRCC states the pilot ended on 14 May 2025 and that applications accepted before that date ' +
      'continue to be processed. An intake cap of 1,010 applications applied for 2025, so in practice the route ' +
      'closed to most applicants when the cap filled rather than on the end date.',
    es:
      'Vía a la residencia permanente para trabajadores no estacionales con experiencia en ocupaciones agrarias ' +
      'y agroalimentarias determinadas. IRCC indica que el piloto terminó el 14 de mayo de 2025 y que las ' +
      'solicitudes admitidas antes de esa fecha se siguen tramitando. Para 2025 rigió un tope de admisión de ' +
      '1.010 solicitudes, de modo que en la práctica la vía se cerró para la mayoría al agotarse el cupo y no en ' +
      'la fecha de finalización.',
  },
  closureNote: {
    en:
      'No new application can be made, and no replacement sectoral route for these occupations has been ' +
      'encoded here. Applications accepted before 14 May 2025 continue to be processed. A worker still in ' +
      'Canada on a work permit whose employer relationship has broken down should not read this closure as ' +
      'leaving them without options — the open work permit for vulnerable workers, provincial nominee streams ' +
      'and other federal routes are separate questions — but they are questions for a qualified representative, ' +
      'not for this record.',
    es:
      'No cabe presentar nuevas solicitudes, y aquí no se codifica ninguna vía sectorial sustitutiva para estas ' +
      'ocupaciones. Las solicitudes admitidas antes del 14 de mayo de 2025 se siguen tramitando. Quien siga en ' +
      'Canadá con permiso de trabajo y cuya relación laboral se haya roto no debe leer este cierre como una ' +
      'falta de alternativas —el permiso de trabajo abierto para trabajadores vulnerables, los programas de ' +
      'nominación provincial y otras vías federales son cuestiones distintas—, pero son cuestiones para un ' +
      'representante cualificado y no para este registro.',
  },
  citations: [irpaS14_1, irccAfpClosure, irccAfpEligibility],
  criteria: [
    {
      id: 'ca-afp-application-before-closure',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-ircc-afp-closure'],
      label: {
        en: 'The application was accepted before 14 May 2025',
        es: 'La solicitud se admitió antes del 14 de mayo de 2025',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: isoDate('2025-05-14') },
      guidance: {
        en:
          'The 2025 intake cap of 1,010 applications is the figure that actually decided most files: once it ' +
          'filled, applications were returned even though the published end date had not arrived. A date test ' +
          'alone therefore cannot confirm that an application was accepted, only that it was not too late.',
        es:
          'El tope de admisión de 1.010 solicitudes para 2025 es la cifra que resolvió de hecho la mayoría de ' +
          'los expedientes: una vez agotado, las solicitudes se devolvían aunque no hubiera llegado la fecha de ' +
          'finalización publicada. Una comprobación de fechas no basta, pues, para confirmar que una solicitud ' +
          'fue admitida: solo que no llegó tarde.',
      },
    },
    {
      id: 'ca-afp-work-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-ircc-afp-eligibility'],
      label: {
        en: 'One year (1,560 hours) of eligible non-seasonal Canadian experience in the past three years',
        es: 'Un año (1.560 horas) de experiencia canadiense no estacional computable en los últimos tres años',
      },
      evaluator: {
        op: 'collection_any',
        path: 'workExperience',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'country', value: 'CA' },
            { op: 'is_true', path: 'fullTime' },
            { op: 'not', of: { op: 'is_false', path: 'authorized' } },
          ],
        },
      },
      requiresHumanReview: true,
      humanReviewReason: {
        en:
          'The evaluator confirms only that authorised full-time Canadian experience is recorded. The rule was ' +
          'narrower in three ways Meridian cannot check: the hours had to total 1,560 over at least twelve ' +
          'months, the occupation had to be one of those listed under an eligible industry, and the experience ' +
          'had to have been gained on an open work permit for vulnerable workers or on a work permit supported ' +
          'by a labour market impact assessment of at least twelve months. Time on an ordinary open work permit ' +
          'did not count.',
        es:
          'El evaluador solo confirma que consta experiencia canadiense autorizada a tiempo completo. La norma ' +
          'era más estricta en tres extremos que Meridian no puede comprobar: las horas debían sumar 1.560 a lo ' +
          'largo de al menos doce meses, la ocupación debía figurar entre las listadas dentro de un sector ' +
          'admisible, y la experiencia debía haberse adquirido con un permiso de trabajo abierto para ' +
          'trabajadores vulnerables o con un permiso basado en una evaluación de impacto en el mercado laboral ' +
          'de al menos doce meses. El tiempo con un permiso abierto ordinario no computaba.',
      },
    },
    {
      id: 'ca-afp-language',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['ca-ircc-afp-eligibility'],
      label: {
        en: 'CLB or NCLC 4 in all four abilities',
        es: 'CLB o NCLC 4 en las cuatro destrezas',
      },
      evaluator: clbAtLeast('4'),
      guidance: {
        en:
          'Results had to be less than two years old at the date of application. Meridian compares one recorded ' +
          'level against the threshold; the rule required it in all four abilities.',
        es:
          'Los resultados debían tener menos de dos años en la fecha de solicitud. Meridian compara un único ' +
          'nivel registrado con el umbral; la norma lo exigía en las cuatro destrezas.',
      },
    },
    {
      id: 'ca-afp-education',
      kind: 'qualification',
      weight: 'material',
      citationIds: ['ca-ircc-afp-eligibility'],
      label: {
        en: 'A Canadian secondary school diploma, or an assessed foreign equivalent',
        es: 'Diploma de secundaria canadiense, o su equivalente extranjero evaluado',
      },
      evaluator: SECONDARY_OR_HIGHER,
      guidance: {
        en:
          'Weighted material rather than blocking because the requirement was conditional: an applicant residing ' +
          'in Canada when they applied could satisfy either the education requirement or the job-offer ' +
          'requirement, while an applicant outside Canada had to satisfy both. Which arm applied is a fact about ' +
          'where the applicant was living, which Meridian does not record for this purpose.',
        es:
          'Se pondera como material y no como bloqueante porque el requisito era condicional: quien residía en ' +
          'Canadá al solicitar podía cumplir o bien el requisito educativo o bien el de oferta de empleo, ' +
          'mientras que quien lo hacía desde fuera debía cumplir ambos. Cuál de las dos ramas se aplicaba ' +
          'dependía del lugar de residencia, dato que Meridian no registra a este efecto.',
      },
    },
    {
      id: 'ca-afp-job-offer',
      kind: 'employment',
      weight: 'material',
      citationIds: ['ca-ircc-afp-eligibility'],
      label: {
        en: 'A full-time, non-seasonal, permanent job offer in an eligible occupation in Canada outside Quebec',
        es: 'Oferta de empleo a tiempo completo, no estacional y permanente en una ocupación admisible en Canadá fuera de Quebec',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
          { op: 'is_true', path: 'jobOffer.fullTime' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
      guidance: {
        en:
          'Three limbs are not modelled: the occupation had to appear on the pilot’s own list of eligible ' +
          'industries and occupations, the position had to be permanent with no end date and non-seasonal, and ' +
          'the wage had to meet the collective agreement or the Job Bank prevailing wage for the occupation in ' +
          'the province. The place of employment also had to be outside Quebec.',
        es:
          'Tres elementos no se modelan: la ocupación debía figurar en la lista propia del piloto de sectores y ' +
          'ocupaciones admisibles, el puesto debía ser permanente, sin fecha de fin y no estacional, y el ' +
          'salario debía alcanzar el del convenio colectivo o el salario mediano del Job Bank para esa ocupación ' +
          'en la provincia. El lugar de trabajo debía además situarse fuera de Quebec.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpa-s-14-1', 'ca-ircc-afp-closure'],
    note: {
      en:
        'What the pilot granted was permanent residence, which the closure does not touch. Meridian states no ' +
        'processing figure for the remaining files: IRCC publishes none for a closed intake, and inventing one ' +
        'for people who have already been waiting would be the least defensible kind of guess.',
      es:
        'Lo que el piloto concedía era la residencia permanente, a la que el cierre no afecta. Meridian no ' +
        'indica plazo de tramitación para los expedientes pendientes: IRCC no publica ninguno para una admisión ' +
        'cerrada, e inventarlo para quienes ya llevan tiempo esperando sería la clase de conjetura menos ' +
        'defendible.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const CA_FAMILY_PILOTS_PATHWAYS: readonly Pathway[] = [
  caFamilySpousePartnerOutland,
  caFamilySpousePartnerInland,
  caFamilyDependentChild,
  caFamilyParentGrandparent,
  caStartUpVisa,
  caAtlanticImmigration,
  caRuralCommunityPilot,
  caRuralNorthernPilot,
  caAgriFoodPilot,
];
