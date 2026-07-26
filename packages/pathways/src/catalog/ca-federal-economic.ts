/**
 * Canada — the two federal economic classes beyond the Canadian Experience Class.
 *
 * **Express Entry is not in this file as a pathway, because it is not one.**
 * IRCC describes it as an online system used to manage immigration applications
 * from skilled workers, and the three things it manages are classes prescribed
 * by the Regulations: the Canadian Experience Class (already encoded in
 * `ca.ts`), the Federal Skilled Worker Class (s. 75) and the Federal Skilled
 * Trades Class (s. 87.2). Eligibility is a property of the class. Express Entry
 * decides which of the eligible candidates in the pool is invited to apply, and
 * it does that by rank. That relationship is recorded on each record’s
 * `durations.note`, with the instruments that create it, rather than modelled as
 * a fourth pathway nobody can be eligible for.
 *
 * **No Comprehensive Ranking System score appears anywhere in this file.** IRPA
 * s. 10.3 lets the Minister set, by instruction, both the basis on which
 * candidates are ranked and the rank required to be invited. Those instructions
 * are amended by ministerial action: the 2016-1 amendment alone moved a
 * qualifying offer of arranged employment out of the 600-point band and into 200
 * points or 50. A cut-off encoded today would be wrong within weeks, and a wrong
 * cut-off is worse than none, because a candidate reads it as a target.
 *
 * **Neither record can return `eligible`, and that is deliberate.** Both classes
 * turn on measurements this engine cannot make from the facts it holds: an
 * hours-based full-time equivalent over a ten-year (skilled worker) or five-year
 * (skilled trades) window; a five-digit NOC code matched against a list of major
 * groups; and, for the skilled worker class, a six-factor points grid whose pass
 * mark the Minister fixes rather than the Regulations. The criteria that depend
 * on those are written so a definite failure still reads as a failure — a
 * recorded occupation outside the eligible TEER range is `unmet` — while
 * anything that would otherwise green-tick escalates to a person instead. A
 * green tick nobody can stand behind is the failure this catalog exists to
 * prevent.
 *
 * As in `ca.ts`, `reviewStatus: 'unreviewed'` carries statutory weight here.
 * Section 91 of the Immigration and Refugee Protection Act makes it an offence
 * to advise a person for consideration on an immigration application unless you
 * are a lawyer, a Quebec notary, or a College of Immigration and Citizenship
 * Consultants licensee.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import { CLB_SCALE, EDUCATION_SCALE } from '../facts.js';
import type { EvaluatorSpec, Pathway } from '../schema.js';

const CA: CountryCode = countryCode('CA');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

const IRPR_S73_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/section-73.html';
const IRPR_S74_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/section-74.html';
const IRPR_S75_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/section-75.html';
const IRPR_S76_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/section-76.html';
const IRPR_S87_2_URL =
  'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/section-87.2.html';

const IRCC_FSW_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html';
const IRCC_FST_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html';

// ---------------------------------------------------------------------------
// Citations
// ---------------------------------------------------------------------------

const irprS75_1 = {
  id: 'ca-irpr-s-75-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 75(1)',
  url: IRPR_S75_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Prescribes the federal skilled worker class as a class of persons who are skilled workers, who may become ' +
    'permanent residents on the basis of their ability to become economically established in Canada, and who ' +
    'intend to reside in a province other than the Province of Quebec.',
};

const irprS75_2a = {
  id: 'ca-irpr-s-75-2-a',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 75(2)(a) to (c)',
  url: IRPR_S75_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Within the 10 years before the application, at least one year of full-time work experience, or the ' +
    'equivalent in part-time work, accumulated over a continuous period in the occupation identified as the ' +
    'primary occupation, other than a restricted occupation, and listed in TEER Category 0, 1, 2 or 3 of the ' +
    'National Occupational Classification. During that employment the applicant must have performed the actions ' +
    'in the lead statement for the occupation and a substantial number of its main duties, including all of the ' +
    'essential duties.',
};

const irprS75_2d = {
  id: 'ca-irpr-s-75-2-d',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 75(2)(d)',
  url: IRPR_S75_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Results of a language evaluation, less than two years old on the date of application, from an organization ' +
    'designated under s. 74(3), showing that the applicant met or exceeded the threshold fixed by the Minister ' +
    'under s. 74(1) for each of the four language skill areas. The Regulations state no benchmark number.',
};

const irprS75_2e = {
  id: 'ca-irpr-s-75-2-e',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 75(2)(e)',
  url: IRPR_S75_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The applicant must submit either a Canadian educational credential, or a foreign diploma, certificate or ' +
    'credential together with an equivalency assessment.',
};

const irprS75_3 = {
  id: 'ca-irpr-s-75-3',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 75(3)',
  url: IRPR_S75_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Where the requirements of s. 75(2) are not met, the application for a permanent resident visa is refused ' +
    'and no further assessment is required. The selection points in s. 76 are therefore reached only once the ' +
    'minimum requirements are satisfied.',
};

const irprS74 = {
  id: 'ca-irpr-s-74',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 74',
  url: IRPR_S74_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The Minister fixes and makes available to the public the minimum language proficiency thresholds, by class ' +
    'or by occupation, and those thresholds are established in reference to the Canadian Language Benchmarks and ' +
    'the Niveaux de competence linguistique canadiens. The Minister also designates the organizations that may ' +
    'evaluate proficiency and approves the tests. No benchmark number appears in the Regulations, which is why ' +
    'the numbers this catalog applies are cited to the published thresholds and marked discretionary.',
};

const irprS73Definitions = {
  id: 'ca-irpr-s-73-definitions',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 73(1)',
  url: IRPR_S73_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Defines equivalency assessment as a determination by a designated organization that a foreign credential is ' +
    'equivalent to a Canadian educational credential, together with an assessment of the authenticity of the ' +
    'foreign document; defines Canadian educational credential; defines the four language skill areas as ' +
    'speaking, oral comprehension, reading and writing; and defines a restricted occupation as one the Minister ' +
    'designates as restricted.',
};

const irprS76_1a = {
  id: 'ca-irpr-s-76-1-a',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 76(1)(a) and 76(2)',
  url: IRPR_S76_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A skilled worker must be awarded not less than the minimum number of points referred to in s. 76(2) on six ' +
    'factors: education (s. 78), proficiency in the official languages of Canada (s. 79), experience (s. 80), ' +
    'age (s. 81), arranged employment (s. 82) and adaptability (s. 83). Section 76(2) leaves the minimum number ' +
    'to the Minister, who fixes it and makes it available to the public. No number of points appears in the ' +
    'text of s. 76.',
};

const irprS76_1b = {
  id: 'ca-irpr-s-76-1-b',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 76(1)(b)',
  url: IRPR_S76_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The skilled worker must either hold, in transferable and available funds unencumbered by debts or other ' +
    'obligations, an amount equal to one half of the minimum necessary income for the applicant and their family ' +
    'members, or be awarded points under s. 82(2)(a), (b) or (d) for arranged employment in Canada.',
};

const irprS87_2_1 = {
  id: 'ca-irpr-s-87-2-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(1)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Defines a skilled trade occupation as an occupation, other than a restricted occupation, in National ' +
    'Occupational Classification Major Group 72 (excluding Sub-Major Group 726), Major Group 73, Major Group 82, ' +
    'Major Group 83, Major Group 92, Major Group 93 (excluding Sub-Major Group 932), Minor Group 6320 or Unit ' +
    'Group 62200.',
};

const irprS87_2_2 = {
  id: 'ca-irpr-s-87-2-2',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(2)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Prescribes the federal skilled trades class as a class of persons who are skilled trades workers, who may ' +
    'become permanent residents on the basis of their ability to become economically established in Canada in a ' +
    'skilled trade occupation, and who intend to reside in a province other than the Province of Quebec.',
};

const irprS87_2_3a = {
  id: 'ca-irpr-s-87-2-3-a',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(3)(a)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Proficiency in English or French must have been evaluated by an organization designated under s. 74(3) ' +
    'using an approved test, and the results must show the applicant met the threshold fixed by the Minister ' +
    'under s. 74(1) for each of the four language skill areas.',
};

const irprS87_2_3b = {
  id: 'ca-irpr-s-87-2-3-b',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(3)(b)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'During the five years before the date of the permanent resident visa application, at least two years of ' +
    'full-time work experience, or the equivalent in part-time work, acquired in the skilled trade occupation.',
};

const irprS87_2_3c = {
  id: 'ca-irpr-s-87-2-3-c',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(3)(c)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The applicant must have met the relevant employment requirements of the skilled trade occupation specified ' +
    'in the application, as set out in the National Occupational Classification, except for the requirement to ' +
    'obtain a certificate of qualification issued by a competent provincial authority.',
};

const irprS87_2_3d = {
  id: 'ca-irpr-s-87-2-3-d',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(3)(d)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Five alternative branches. The first is a certificate of qualification issued by a competent provincial or ' +
    'federal authority in the skilled trade occupation named in the application. The other four turn on an offer ' +
    'of employment for continuous full-time work of at least one year in total, made by up to two employers who ' +
    'are neither a diplomatic mission nor an employer on the non-compliant list, and differ according to whether ' +
    'the applicant holds a work permit and how the offer was assessed. Which branch applies is a question about ' +
    'the applicant’s permit history that this engine does not model.',
};

const irprS87_2_5 = {
  id: 'ca-irpr-s-87-2-5',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.2(5)',
  url: IRPR_S87_2_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Except for the applicants described in s. 87.2(3)(d)(ii), (iii) and (v), the applicant must hold, in ' +
    'transferable and available funds unencumbered by debts or other obligations, an amount equal to one half of ' +
    'the minimum necessary income for the applicant and their family members.',
};

const irpaS10_3 = {
  id: 'ca-irpa-s-10-3',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 10.3',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/I-2.5/section-10.3.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The Minister may give instructions governing any matter relating to the invitation-to-apply system, ' +
    'including which classes are eligible for it, the criteria a foreign national must meet to be eligible to be ' +
    'invited, the basis on which eligible candidates are ranked, the rank required to be invited, and the number ' +
    'of invitations issued in a period. The ranking and the rank required are therefore set by instruction, not ' +
    'by statute or regulation.',
};

const expressEntryMinisterialInstructions = {
  id: 'ca-express-entry-mi-2014',
  kind: 'policy' as const,
  instrument: 'Ministerial Instructions Respecting the Express Entry System',
  provision: 'made 28 November 2014, in force 1 January 2015',
  url: 'https://gazette.gc.ca/rp-pr/p1/2014/2014-12-01-x10/html/extra10-eng.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL INSTRUMENT, NOT REGULATION. Issued under s. 10.3 of the Act and published in the Canada ' +
    'Gazette, Part I, Volume 148, Extra No. 10. The instructions establish the express entry pool, apply it to ' +
    'the federal skilled worker class, the federal skilled trades class, the Canadian experience class and ' +
    'provincial nominees under express entry streams, and provide that candidates are invited by rank under the ' +
    'Comprehensive Ranking System; they fix no minimum score. They are amended by ministerial action rather than ' +
    'by regulation — the Ministerial Instructions Amending the Ministerial Instructions Respecting the Express ' +
    'Entry System, 2016-1, in force 19 November 2016, moved a qualifying offer of arranged employment out of the ' +
    '600-point band and into 200 points or 50. Meridian encodes no point value and no round cut-off from this ' +
    'instrument; the consolidated current text must be read before any score is relied on.',
};

const irccExpressEntryOverview = {
  id: 'ca-ircc-express-entry-overview',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Immigrate through Express Entry',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'IRCC states that Express Entry is an online system used to manage immigration applications from skilled ' +
    'workers, and that three immigration programs are managed through it: the Canadian Experience Class, the ' +
    'Federal Skilled Worker Program and the Federal Skilled Trades Program. Candidates create a profile and ' +
    'enter a pool, and the candidates with the most points are invited in rounds.',
};

const irccFswProgram = {
  id: 'ca-ircc-fsw-program',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Express Entry: Federal Skilled Worker Program',
  url: IRCC_FSW_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED OPERATIONAL GUIDANCE. IRCC states the pass mark the Minister has fixed under s. 76(2) as 67 ' +
    'points out of 100, with maxima of 28 for language, 25 for education, 15 for skilled work experience, 12 for ' +
    'age, 10 for arranged employment and 10 for adaptability. It measures the one-year experience requirement as ' +
    '1,560 hours at up to 30 hours per week, obtained in the 10 years before the application, and requires paid ' +
    'work. It states that proof of funds is not needed where the applicant is currently able to work legally in ' +
    'Canada and holds a valid job offer from a Canadian employer, that the applicant must be admissible, and ' +
    'that the applicant must plan to live outside Quebec. None of these figures is in the Regulations; they are ' +
    'published and revised administratively.',
};

const irccFstProgram = {
  id: 'ca-ircc-fst-program',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Express Entry: Federal Skilled Trades Program',
  url: IRCC_FST_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED OPERATIONAL GUIDANCE. IRCC measures the two-year experience requirement as 3,120 hours at up to ' +
    '30 hours per week within the five years before the application, requires paid work obtained in a country ' +
    'where the applicant was qualified to practise, and requires the experience to be in a single National ' +
    'Occupational Classification group drawn from Major Groups 72 (excluding Sub-Major Group 726), 73, 82, 83, ' +
    '92 or 93 (excluding Sub-Major Group 932), Minor Group 6320 or Unit Group 62200. It states that there is no ' +
    'education requirement for this program, that the job offer alternative must be full-time employment for a ' +
    'total period of at least one year, that a certificate of qualification is issued by the provincial or ' +
    'territorial body governing trades or by a federal authority after a certification exam, that proof of funds ' +
    'is not needed where the applicant is currently able to work legally in Canada and holds a valid Canadian ' +
    'job offer, that the applicant must be admissible, and that the applicant must plan to live outside Quebec.',
};

const irccLanguageThresholds = {
  id: 'ca-ircc-express-entry-language-thresholds',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Express Entry: Language test results',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED MINISTERIAL THRESHOLDS, NOT REGULATION. For the Federal Skilled Worker Program the first official ' +
    'language must reach CLB 7 in English or NCLC 7 in French in all four abilities. For the Federal Skilled ' +
    'Trades Program the requirement is CLB or NCLC 5 for speaking and listening and CLB or NCLC 4 for reading ' +
    'and writing. Results must be less than two years old when the profile is completed and when the ' +
    'application for permanent residence is submitted. The Minister may change these thresholds under s. 74(1) ' +
    'without amending the Regulations, so they are re-read rather than assumed stable.',
};

const irccEducationalCredentialAssessment = {
  id: 'ca-ircc-educational-credential-assessment',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Educational credential assessment',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessment.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED OPERATIONAL GUIDANCE. Education completed outside Canada requires an educational credential ' +
    'assessment for immigration purposes to be eligible as the principal applicant under the Federal Skilled ' +
    'Worker Program. The report must be less than five years old when the profile is completed and when the ' +
    'application is submitted, and it must come from an organization or professional body designated by IRCC. ' +
    'No assessment is needed for a Canadian degree, diploma or certificate.',
};

const irccProofOfFunds = {
  id: 'ca-ircc-proof-of-funds',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Documents for Express Entry: Proof of funds',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'PUBLISHED OPERATIONAL GUIDANCE. IRCC publishes the settlement-funds table for the Federal Skilled Worker ' +
    'and Federal Skilled Trades Programs and states that it updates the numbers every year, based on 50 per cent ' +
    'of the low income cut-off totals. The funds must be available both when the application is made and when ' +
    'the permanent resident visa is issued, must be legally accessible, and cannot be borrowed or drawn from ' +
    'equity in real property. Meridian records no figure, because a settlement-funds amount encoded in a catalog ' +
    'that ships quarterly is a figure that goes stale between releases.',
};

const nocStructure = {
  id: 'ca-noc-2021-structure',
  kind: 'official_guidance' as const,
  instrument:
    'Statistics Canada — Introduction to the National Occupational Classification (NOC) 2021 Version 1.0',
  url: 'https://www.statcan.gc.ca/en/subjects/standard/noc/2021/introductionV1',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The first digit of a NOC 2021 code is the broad occupational category and the second digit is the TEER ' +
    'category. Every group the Regulations list as a skilled trade occupation therefore sits in TEER 2 or TEER ' +
    '3: Major Groups 72, 82, 92 and Unit Group 62200 carry a second digit of 2, and Major Groups 73, 83, 93 and ' +
    'Minor Group 6320 carry a second digit of 3. That makes TEER 2 or 3 a necessary condition for the trades ' +
    'class, and nothing more — most TEER 2 and TEER 3 occupations are not skilled trade occupations.',
};

// ---------------------------------------------------------------------------
// Shared evaluator specs
// ---------------------------------------------------------------------------

/**
 * Work experience in a TEER 0 to 3 occupation — the skilled-work floor for the
 * federal skilled worker class.
 *
 * Deliberately says nothing about *how much*. The class needs one year of
 * full-time work or its part-time equivalent, measured by IRCC as 1,560 hours at
 * up to 30 hours a week and confined to the ten years before the application.
 * `DerivedFacts` carries a day count for Canadian experience in the last three
 * years — built for the Canadian Experience Class — and nothing that measures a
 * worldwide ten-year window. Rather than approximate the measurement, the
 * criterion that uses this spec escalates whenever the spec is satisfied, so the
 * only thing it ever asserts on its own is a definite failure: recorded
 * experience that is entirely outside TEER 0 to 3.
 */
const fswSkilledOccupationExperience: EvaluatorSpec = {
  op: 'collection_any',
  path: 'workExperience',
  where: { op: 'one_of', path: 'nocTeer', values: [0, 1, 2, 3] },
};

/**
 * A Canadian Language Benchmark or Niveau de compétence linguistique canadien
 * result at level 7 or above.
 *
 * `CLB_SCALE` serves both frameworks: CLB and NCLC are the English and French
 * benchmark scales and IRCC states the same numeric level for each — CLB 7 or
 * NCLC 7 for this class. A CEFR certificate is excluded rather than converted,
 * because there is no official equivalence to convert it with.
 */
const fswLanguageThreshold: EvaluatorSpec = {
  op: 'collection_any',
  path: 'languageCertifications',
  where: {
    op: 'all_of',
    of: [
      { op: 'one_of', path: 'framework', values: ['clb', 'nclc'] },
      { op: 'ordinal_at_least', path: 'level', scale: CLB_SCALE, value: '7' },
    ],
  },
};

/** A completed secondary or higher credential, which is the floor s. 75(2)(e) sets. */
const fswEducationCredential: EvaluatorSpec = {
  op: 'ordinal_at_least',
  path: 'educationLevel',
  scale: EDUCATION_SCALE,
  value: 'secondary',
};

/** Work experience in a TEER 2 or 3 occupation — the necessary condition for a skilled trade. */
const fstTradeLevelExperience: EvaluatorSpec = {
  op: 'collection_any',
  path: 'workExperience',
  where: { op: 'one_of', path: 'nocTeer', values: [2, 3] },
};

function fstLanguageAtLeast(level: string): EvaluatorSpec {
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

/**
 * The published exemption from proving settlement funds: currently able to work
 * legally in Canada, and holding a valid job offer from a Canadian employer.
 *
 * `currentStatus` records what the applicant is, not which state authorised it,
 * so this pairs it with `targetJurisdiction` and treats the combination as the
 * closest available reading. The criteria built on it are `material`, never
 * blocking — they can hold back a yes and can never produce a no, which is the
 * right shape for a proxy.
 */
const settlementFundsExemption: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
    { op: 'equals', path: 'currentStatus', value: 'worker' },
    { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
    { op: 'is_true', path: 'jobOffer.writtenOffer' },
  ],
};

// ---------------------------------------------------------------------------
// Federal Skilled Worker Class
// ---------------------------------------------------------------------------

export const caFederalSkilledWorker: Pathway = {
  id: 'ca-federal-skilled-worker',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Federal Skilled Worker Class',
    es: 'Clase Federal de Trabajadores Cualificados',
  },
  summary: {
    en:
      'Permanent residence for a skilled worker with qualifying work experience obtained anywhere, who meets the ' +
      'published language and education requirements and scores at least the minimum on a six-factor selection ' +
      'grid. No Canadian work or study is required. Applications are managed through Express Entry.',
    es:
      'Residencia permanente para una persona trabajadora cualificada con experiencia laboral computable ' +
      'obtenida en cualquier país, que cumpla los requisitos publicados de idioma y de titulación y alcance al ' +
      'menos la puntuación mínima en un baremo de seis factores. No exige trabajo ni estudios previos en Canadá. ' +
      'Las solicitudes se gestionan a través de Express Entry.',
  },
  citations: [
    irprS75_1,
    irprS75_2a,
    irprS75_2d,
    irprS75_2e,
    irprS75_3,
    irprS74,
    irprS73Definitions,
    irprS76_1a,
    irprS76_1b,
    irccFswProgram,
    irccLanguageThresholds,
    irccEducationalCredentialAssessment,
    irccProofOfFunds,
    irccExpressEntryOverview,
    irpaS10_3,
    expressEntryMinisterialInstructions,
  ],
  criteria: [
    {
      id: 'ca-fsw-skilled-work-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-75-2-a', 'ca-ircc-fsw-program'],
      label: {
        en: 'At least one year of skilled work experience in a TEER 0, 1, 2 or 3 occupation within the last ten years',
        es: 'Al menos un año de experiencia laboral cualificada en una ocupación TEER 0, 1, 2 o 3 en los últimos diez años',
      },
      evaluator: fswSkilledOccupationExperience,
      // Satisfying the TEER test tells you the occupation is of the right kind
      // and nothing about the quantity. The quantity is 1,560 hours at up to 30
      // hours a week, accumulated over a continuous period, inside a ten-year
      // window that moves with the application date. Meridian holds no derived
      // figure for that, so a person totals it. Escalating on the same condition
      // the evaluator tests means the criterion can report a definite failure —
      // recorded experience wholly outside TEER 0 to 3 — but can never report a
      // pass it has not actually measured.
      humanReviewWhen: fswSkilledOccupationExperience,
      humanReviewReason: {
        en:
          'Work experience in a qualifying TEER category is recorded, but the one-year requirement is an ' +
          'hours-based full-time equivalent inside a ten-year window and Meridian does not compute it. The hours ' +
          'actually worked, the continuity of the period, and whether the experience matches the lead statement ' +
          'and the main duties of the primary occupation all have to be checked by a person.',
        es:
          'Consta experiencia laboral en una categoría TEER computable, pero el requisito de un año es un ' +
          'equivalente a tiempo completo medido en horas dentro de una ventana de diez años, y Meridian no lo ' +
          'calcula. Las horas realmente trabajadas, la continuidad del periodo y la correspondencia con el ' +
          'enunciado principal y las funciones principales de la ocupación deben ser verificadas por una persona.',
      },
      guidance: {
        en:
          'The experience must be in the single occupation named in the application as the primary occupation, ' +
          'must be paid work rather than volunteering or an unpaid internship, and must not be in an occupation ' +
          'the Minister has designated as restricted. Experience from any country counts.',
        es:
          'La experiencia debe corresponder a la única ocupación declarada en la solicitud como ocupación ' +
          'principal, debe ser trabajo remunerado y no voluntariado ni prácticas no retribuidas, y no puede ' +
          'corresponder a una ocupación que el Ministro haya designado como restringida. Computa la experiencia ' +
          'obtenida en cualquier país.',
      },
    },
    {
      id: 'ca-fsw-language-threshold',
      kind: 'language',
      weight: 'blocking',
      citationIds: [
        'ca-irpr-s-75-2-d',
        'ca-irpr-s-74',
        'ca-ircc-express-entry-language-thresholds',
      ],
      label: {
        en: 'First official language at CLB 7 or NCLC 7 in each of the four abilities',
        es: 'Primera lengua oficial en nivel CLB 7 o NCLC 7 en cada una de las cuatro destrezas',
      },
      evaluator: fswLanguageThreshold,
      guidance: {
        en:
          'The threshold applies to each of the four abilities separately — speaking, listening, reading and ' +
          'writing — so record the lowest of your four results here, not an average or an overall band. The ' +
          'result must come from a test IRCC has approved, taken through a designated organisation, and must be ' +
          'less than two years old both when the Express Entry profile is completed and when the application is ' +
          'submitted; Meridian does not check that currency. A second official language earns selection points ' +
          'but is not part of this minimum.',
        es:
          'El umbral se aplica por separado a cada una de las cuatro destrezas — expresión oral, comprensión ' +
          'auditiva, lectura y escritura —, de modo que aquí debe registrarse el resultado más bajo de las ' +
          'cuatro, no una media ni una banda global. El resultado debe proceder de una prueba aprobada por IRCC, ' +
          'realizada ante una organización designada, y tener menos de dos años tanto al completar el perfil de ' +
          'Express Entry como al presentar la solicitud; Meridian no comprueba esa vigencia. La segunda lengua ' +
          'oficial otorga puntos de selección, pero no forma parte de este mínimo.',
      },
    },
    {
      id: 'ca-fsw-education-credential',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: [
        'ca-irpr-s-75-2-e',
        'ca-irpr-s-73-definitions',
        'ca-ircc-educational-credential-assessment',
      ],
      label: {
        en: 'A Canadian secondary or post-secondary credential, or a foreign credential with an equivalency assessment',
        es: 'Titulación canadiense de secundaria o superior, o titulación extranjera con evaluación de equivalencia',
      },
      evaluator: fswEducationCredential,
      // A Canadian credential satisfies the paragraph on its own. Anything else
      // needs an equivalency assessment, and Meridian records no assessment
      // report — so a credential that is foreign, or whose country was never
      // recorded, goes to a person rather than being ticked off on the strength
      // of a level alone.
      humanReviewWhen: {
        op: 'all_of',
        of: [
          fswEducationCredential,
          {
            op: 'any_of',
            of: [
              { op: 'not', of: { op: 'equals', path: 'educationCountry', value: 'CA' } },
              { op: 'not', of: { op: 'is_present', path: 'educationCountry' } },
            ],
          },
        ],
      },
      humanReviewReason: {
        en:
          'The credential is not recorded as Canadian, so s. 75(2)(e) is satisfied only with an educational ' +
          'credential assessment from an organisation or professional body IRCC has designated, less than five ' +
          'years old. Meridian does not hold assessment reports, so the report and its result have to be seen.',
        es:
          'La titulación no consta como canadiense, por lo que el art. 75(2)(e) solo se cumple con una ' +
          'evaluación de credenciales educativas emitida por una organización u organismo profesional designado ' +
          'por IRCC, con menos de cinco años de antigüedad. Meridian no almacena esos informes, de modo que el ' +
          'informe y su resultado deben examinarse.',
      },
      guidance: {
        en:
          'Only the principal applicant needs the assessment to be eligible; a spouse or partner may obtain one ' +
          'to earn points. In most cases only the highest credential is assessed.',
        es:
          'Solo la persona solicitante principal necesita la evaluación para ser elegible; el cónyuge o la ' +
          'pareja puede obtenerla para sumar puntos. En la mayoría de los casos únicamente se evalúa la ' +
          'titulación más alta.',
      },
    },
    {
      id: 'ca-fsw-selection-points',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-76-1-a', 'ca-irpr-s-75-3', 'ca-ircc-fsw-program'],
      label: {
        en: 'At least the minimum selection points on the six factors, which IRCC publishes as 67 out of 100',
        es: 'Al menos la puntuación mínima de selección en los seis factores, que IRCC publica como 67 sobre 100',
      },
      // The evaluator is the minimum-requirements gate, not the grid. Section
      // 75(3) says an application that fails s. 75(2) is refused with no further
      // assessment, so the grid is never reached in that case and reporting the
      // criterion as unmet states the outcome correctly. Where the minimums do
      // appear to be met, the grid has to be scored — and scoring it here would
      // mean reproducing six points tables from ss. 78 to 83 and publishing the
      // arithmetic that decides the case.
      evaluator: {
        op: 'all_of',
        of: [fswSkilledOccupationExperience, fswLanguageThreshold, fswEducationCredential],
      },
      humanReviewWhen: {
        op: 'all_of',
        of: [fswSkilledOccupationExperience, fswLanguageThreshold, fswEducationCredential],
      },
      humanReviewReason: {
        en:
          'The minimum requirements in s. 75(2) appear to be met, so the selection grid decides the case. It ' +
          'awards points for education, official languages, experience, age, arranged employment and ' +
          'adaptability under ss. 78 to 83, and the pass mark is fixed by the Minister rather than by the ' +
          'Regulations. Meridian does not score it.',
        es:
          'Los requisitos mínimos del art. 75(2) parecen cumplirse, de modo que el baremo de selección decide el ' +
          'caso. Otorga puntos por titulación, lenguas oficiales, experiencia, edad, empleo concertado y ' +
          'adaptabilidad conforme a los arts. 78 a 83, y la nota de corte la fija el Ministro, no el Reglamento. ' +
          'Meridian no lo puntúa.',
      },
      guidance: {
        en:
          'Two gates apply, in order. Section 75(3) provides that where the minimum requirements are not met the ' +
          'application is refused and no further assessment is required, so this criterion reports unmet when ' +
          'those minimums are recorded as unmet. Where they are met, s. 76(1)(a) requires at least the minimum ' +
          'number of points on the six factors and s. 76(2) leaves that number to the Minister; IRCC publishes ' +
          'it as 67 out of 100, with maxima of 28 for language, 25 for education, 15 for experience, 12 for age, ' +
          '10 for arranged employment and 10 for adaptability. These are not the points that rank a candidate in ' +
          'the Express Entry pool.',
        es:
          'Se aplican dos filtros, en orden. El art. 75(3) dispone que, si no se cumplen los requisitos mínimos, ' +
          'la solicitud se deniega sin ulterior valoración, por lo que este criterio se informa como incumplido ' +
          'cuando esos mínimos constan incumplidos. Si se cumplen, el art. 76(1)(a) exige al menos la puntuación ' +
          'mínima en los seis factores y el art. 76(2) deja esa cifra al Ministro; IRCC la publica como 67 sobre ' +
          '100, con máximos de 28 por idioma, 25 por titulación, 15 por experiencia, 12 por edad, 10 por empleo ' +
          'concertado y 10 por adaptabilidad. Estos puntos no son los que ordenan a una candidatura en el fondo ' +
          'común de Express Entry.',
      },
    },
    {
      id: 'ca-fsw-settlement-funds-exemption',
      kind: 'economic',
      weight: 'material',
      citationIds: ['ca-irpr-s-76-1-b', 'ca-ircc-proof-of-funds', 'ca-ircc-fsw-program'],
      label: {
        en: 'Exempt from proving settlement funds: able to work legally in Canada with a valid Canadian job offer',
        es: 'Exención de acreditar fondos de establecimiento: autorización para trabajar legalmente en Canadá con oferta de empleo canadiense válida',
      },
      evaluator: settlementFundsExemption,
      guidance: {
        en:
          'Where the exemption does not apply, s. 76(1)(b) requires transferable and available funds equal to ' +
          'one half of the minimum necessary income for the applicant and their family members, unencumbered by ' +
          'debts. IRCC publishes the amounts and updates them every year against 50 per cent of the low income ' +
          'cut-off totals. Meridian records no bank balance and no figure, so this criterion reports only on the ' +
          'exemption: unmet here means the exemption does not appear to apply, not that the funds requirement ' +
          'has been failed. It never produces an ineligible verdict on its own.',
        es:
          'Cuando la exención no procede, el art. 76(1)(b) exige fondos transferibles y disponibles equivalentes ' +
          'a la mitad del ingreso mínimo necesario para la persona solicitante y sus familiares, libres de ' +
          'cargas. IRCC publica los importes y los actualiza cada año conforme al 50 por ciento de los umbrales ' +
          'de bajos ingresos. Meridian no registra saldos bancarios ni importes, por lo que este criterio solo ' +
          'informa sobre la exención: un incumplimiento aquí significa que la exención no parece aplicarse, no ' +
          'que se haya incumplido el requisito de fondos. Por sí solo nunca genera un veredicto de inelegibilidad.',
      },
    },
    {
      id: 'ca-fsw-outside-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-75-1'],
      label: {
        en: 'Intention to reside in a province other than Quebec',
        es: 'Intención de residir en una provincia distinta de Quebec',
      },
      evaluator: { op: 'is_true', path: 'intent.intendsToResideOutsideQuebec' },
      guidance: {
        en:
          'Quebec selects its own economic immigrants under a separate agreement with the federal government. ' +
          'Work experience gained while living in Quebec still counts, provided the applicant can show they do ' +
          'not plan to settle there.',
        es:
          'Quebec selecciona a sus propios inmigrantes económicos mediante un acuerdo específico con el gobierno ' +
          'federal. La experiencia laboral obtenida mientras se residía en Quebec sigue computando, siempre que ' +
          'se acredite que no se planea establecerse allí.',
      },
    },
    {
      id: 'ca-fsw-admissibility',
      kind: 'character',
      weight: 'informational',
      citationIds: ['ca-ircc-fsw-program'],
      label: {
        en: 'A clear criminal record is self-declared — admissibility itself is not assessed here',
        es: 'Antecedentes penales declarados como limpios por la persona solicitante — la admisibilidad no se valora aquí',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      guidance: {
        en:
          'IRCC states that an applicant must be admissible to Canada, and inadmissibility can arise on ' +
          'security, criminal, medical, financial and misrepresentation grounds. That decision is an officer’s, ' +
          'made on evidence including police certificates and a medical examination. A self-declaration is ' +
          'recorded as a starting point and carries no weight in the verdict.',
        es:
          'IRCC señala que la persona solicitante debe ser admisible en Canadá, y la inadmisibilidad puede ' +
          'derivarse de motivos de seguridad, penales, médicos, económicos o de falsedad. Esa decisión ' +
          'corresponde a un oficial, sobre pruebas que incluyen certificados policiales y un examen médico. La ' +
          'autodeclaración se registra como punto de partida y no influye en el veredicto.',
      },
    },
  ],
  durations: {
    citationIds: [
      'ca-ircc-express-entry-overview',
      'ca-irpa-s-10-3',
      'ca-express-entry-mi-2014',
    ],
    note: {
      en:
        'Meeting this class is not the same as being admitted, and the class is not the same thing as Express ' +
        'Entry. Express Entry is the online system IRCC uses to manage applications under this class, the ' +
        'Federal Skilled Trades Program and the Canadian Experience Class. A candidate who meets a class creates ' +
        'a profile, enters a pool, and is invited to apply by rank under the Comprehensive Ranking System. ' +
        'Section 10.3 of the Act lets the Minister set both the basis of that ranking and the rank required to ' +
        'be invited, by instruction; the instructions fix no minimum score, and the score that draws an ' +
        'invitation in any given round depends on who is in the pool that day. Meridian records no ranking ' +
        'score and no round cut-off, because a number that moves every few weeks would be read as a target and ' +
        'would be wrong.',
      es:
        'Cumplir los requisitos de esta clase no equivale a ser admitido, y la clase no es lo mismo que Express ' +
        'Entry. Express Entry es el sistema en línea que IRCC utiliza para gestionar las solicitudes de esta ' +
        'clase, del Programa Federal de Oficios Cualificados y de la Clase de Experiencia Canadiense. Quien ' +
        'cumple los requisitos de una clase crea un perfil, entra en un fondo común y es invitado a solicitar ' +
        'según su posición en el Sistema Integral de Clasificación. El art. 10.3 de la Ley permite al Ministro ' +
        'fijar por instrucción tanto la base de esa clasificación como la posición necesaria para ser invitado; ' +
        'las instrucciones no fijan puntuación mínima, y la puntuación que obtiene invitación en cada ronda ' +
        'depende de quién esté en el fondo común ese día. Meridian no registra puntuaciones ni cortes de ronda, ' +
        'porque una cifra que cambia cada pocas semanas se leería como un objetivo y sería errónea.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Federal Skilled Trades Class
// ---------------------------------------------------------------------------

export const caFederalSkilledTrades: Pathway = {
  id: 'ca-federal-skilled-trades',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Federal Skilled Trades Class',
    es: 'Clase Federal de Oficios Cualificados',
  },
  summary: {
    en:
      'Permanent residence for a qualified tradesperson with two years of experience in a listed skilled trade ' +
      'within the last five years, who meets the published language thresholds and holds either a Canadian ' +
      'certificate of qualification or a qualifying full-time job offer of at least one year. There is no ' +
      'education requirement. Applications are managed through Express Entry.',
    es:
      'Residencia permanente para una persona cualificada en un oficio con dos años de experiencia en un oficio ' +
      'listado dentro de los últimos cinco años, que cumpla los umbrales de idioma publicados y disponga de un ' +
      'certificado de cualificación canadiense o de una oferta de empleo a tiempo completo de al menos un año. ' +
      'No se exige titulación académica. Las solicitudes se gestionan a través de Express Entry.',
  },
  citations: [
    irprS87_2_1,
    irprS87_2_2,
    irprS87_2_3a,
    irprS87_2_3b,
    irprS87_2_3c,
    irprS87_2_3d,
    irprS87_2_5,
    irprS74,
    nocStructure,
    irccFstProgram,
    irccLanguageThresholds,
    irccProofOfFunds,
    irccExpressEntryOverview,
    irpaS10_3,
    expressEntryMinisterialInstructions,
  ],
  criteria: [
    {
      id: 'ca-fst-skilled-trade-occupation',
      kind: 'employment',
      weight: 'blocking',
      citationIds: [
        'ca-irpr-s-87-2-1',
        'ca-irpr-s-87-2-3-c',
        'ca-noc-2021-structure',
        'ca-ircc-fst-program',
      ],
      label: {
        en: 'The occupation is a skilled trade occupation in a listed NOC group, and its employment requirements are met',
        es: 'La ocupación es un oficio cualificado incluido en un grupo listado de la CNO y se cumplen sus requisitos de empleo',
      },
      // TEER 2 or 3 is necessary and nowhere near sufficient: it follows from the
      // second digit of every group the Regulations list, but most TEER 2 and 3
      // occupations are not skilled trades. Matching a five-digit code against
      // "Major Group 72 excluding Sub-Major Group 726" needs the NOC group table,
      // which this package does not ship, and the evaluator has no prefix
      // operation to do it with. So a definite failure is reported and a
      // possible pass is escalated.
      evaluator: fstTradeLevelExperience,
      humanReviewWhen: fstTradeLevelExperience,
      humanReviewReason: {
        en:
          'The recorded occupation sits in a TEER category the trades class can draw on, but membership of the ' +
          'class turns on the specific NOC group — Major Groups 72 (excluding Sub-Major Group 726), 73, 82, 83, ' +
          '92 and 93 (excluding Sub-Major Group 932), Minor Group 6320 and Unit Group 62200 — and Meridian does ' +
          'not hold that table. A person must read the five-digit code against the list, confirm the occupation ' +
          'is not a restricted occupation, and confirm the employment requirements the NOC sets for that trade ' +
          'were met, apart from the certificate of qualification.',
        es:
          'La ocupación registrada pertenece a una categoría TEER de la que puede nutrirse la clase de oficios, ' +
          'pero la pertenencia a la clase depende del grupo concreto de la CNO — grupos principales 72 (excepto ' +
          'el subgrupo 726), 73, 82, 83, 92 y 93 (excepto el subgrupo 932), grupo menor 6320 y grupo unitario ' +
          '62200 — y Meridian no dispone de esa tabla. Una persona debe cotejar el código de cinco dígitos con ' +
          'la lista, confirmar que la ocupación no está restringida y comprobar que se cumplieron los requisitos ' +
          'de empleo que la CNO fija para ese oficio, salvo el certificado de cualificación.',
      },
      guidance: {
        en:
          'All qualifying experience must be in the same NOC group. The trades covered sit in construction, ' +
          'transportation, manufacturing and industry, and natural resources and agriculture, together with ' +
          'cooks, butchers, bakers and chefs.',
        es:
          'Toda la experiencia computable debe corresponder al mismo grupo de la CNO. Los oficios cubiertos se ' +
          'sitúan en construcción, transporte, manufactura e industria, y recursos naturales y agricultura, ' +
          'junto con cocineros, carniceros, panaderos y jefes de cocina.',
      },
    },
    {
      id: 'ca-fst-two-years-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-2-3-b', 'ca-ircc-fst-program'],
      label: {
        en: 'At least two years of full-time work experience, or the part-time equivalent, in the five years before applying',
        es: 'Al menos dos años de experiencia laboral a tiempo completo, o su equivalente a tiempo parcial, en los cinco años previos a la solicitud',
      },
      evaluator: fstTradeLevelExperience,
      humanReviewWhen: fstTradeLevelExperience,
      humanReviewReason: {
        en:
          'Trade-level experience is recorded, but the two-year requirement is measured by IRCC as 3,120 hours ' +
          'at up to 30 hours a week inside the five years before the application. Meridian holds no derived ' +
          'figure for that window, so the hours have to be totalled from the actual work history — including ' +
          'across several part-time jobs, which the rule expressly allows.',
        es:
          'Consta experiencia de nivel de oficio, pero IRCC mide el requisito de dos años como 3.120 horas a un ' +
          'máximo de 30 horas semanales dentro de los cinco años previos a la solicitud. Meridian no dispone de ' +
          'un cálculo para esa ventana, de modo que las horas deben sumarse a partir del historial laboral real, ' +
          'incluidas varias ocupaciones a tiempo parcial, que la norma permite expresamente.',
      },
      guidance: {
        en:
          'The work must have been paid, and must have been obtained in a country where the applicant was ' +
          'qualified to practise the trade. Unlike the skilled worker class, the regulation does not require the ' +
          'two years to run continuously.',
        es:
          'El trabajo debe haber sido remunerado y haberse obtenido en un país donde la persona solicitante ' +
          'estuviera habilitada para ejercer el oficio. A diferencia de la clase de trabajadores cualificados, ' +
          'la norma no exige que los dos años sean continuos.',
      },
    },
    {
      id: 'ca-fst-language-threshold',
      kind: 'language',
      weight: 'blocking',
      citationIds: [
        'ca-irpr-s-87-2-3-a',
        'ca-irpr-s-74',
        'ca-ircc-express-entry-language-thresholds',
      ],
      label: {
        en: 'CLB or NCLC 5 in speaking and listening and 4 in reading and writing',
        es: 'Nivel CLB o NCLC 5 en expresión oral y comprensión auditiva y 4 en lectura y escritura',
      },
      // Two thresholds, one recorded level. A certificate at 5 or above clears
      // both and can be reported as met. A certificate at exactly 4 clears the
      // reading and writing threshold only, and whether speaking and listening
      // reach 5 is a fact the model cannot hold, so that case goes to a person.
      evaluator: fstLanguageAtLeast('4'),
      humanReviewWhen: {
        op: 'all_of',
        of: [fstLanguageAtLeast('4'), { op: 'not', of: fstLanguageAtLeast('5') }],
      },
      humanReviewReason: {
        en:
          'The recorded level clears the reading and writing threshold but not the higher speaking and listening ' +
          'threshold. Meridian stores one level per certificate rather than four, so the individual ability ' +
          'scores have to be read off the test report.',
        es:
          'El nivel registrado supera el umbral de lectura y escritura pero no el umbral superior de expresión ' +
          'oral y comprensión auditiva. Meridian almacena un solo nivel por certificado en lugar de cuatro, de ' +
          'modo que las puntuaciones por destreza deben leerse en el informe de la prueba.',
      },
      guidance: {
        en:
          'Record the lowest of your four ability results. The threshold is CLB or NCLC 5 for speaking and ' +
          'listening and CLB or NCLC 4 for reading and writing, so a recorded level of 5 or above satisfies ' +
          'both. Results must come from an approved test taken through a designated organisation and be less ' +
          'than two years old; Meridian does not check that currency.',
        es:
          'Registre el más bajo de sus cuatro resultados por destreza. El umbral es CLB o NCLC 5 para expresión ' +
          'oral y comprensión auditiva y CLB o NCLC 4 para lectura y escritura, de modo que un nivel registrado ' +
          'de 5 o superior satisface ambos. Los resultados deben proceder de una prueba aprobada realizada ante ' +
          'una organización designada y tener menos de dos años; Meridian no comprueba esa vigencia.',
      },
    },
    {
      id: 'ca-fst-certificate-or-job-offer',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-2-3-d', 'ca-ircc-fst-program'],
      label: {
        en: 'A Canadian certificate of qualification in the trade, or a full-time job offer of at least one year',
        es: 'Certificado canadiense de cualificación en el oficio, u oferta de empleo a tiempo completo de al menos un año',
      },
      evaluator: {
        op: 'any_of',
        of: [
          {
            op: 'collection_any',
            path: 'professionalCredentials',
            where: {
              op: 'all_of',
              of: [
                { op: 'one_of', path: 'kind', values: ['licence', 'certification'] },
                { op: 'equals', path: 'issuingCountry', value: 'CA' },
              ],
            },
          },
          {
            op: 'all_of',
            of: [
              { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
              { op: 'is_true', path: 'jobOffer.fullTime' },
              { op: 'gte', path: 'jobOffer.durationMonths', value: 12 },
            ],
          },
        ],
      },
      // The certificate branch is a document a person either holds or does not.
      // The offer branch is four regulatory sub-branches that turn on work-permit
      // history and on how the offer was assessed, so an offer being relied on
      // without a certificate is escalated rather than ticked off.
      humanReviewWhen: {
        op: 'all_of',
        of: [
          {
            op: 'all_of',
            of: [
              { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
              { op: 'is_true', path: 'jobOffer.fullTime' },
              { op: 'gte', path: 'jobOffer.durationMonths', value: 12 },
            ],
          },
          {
            op: 'not',
            of: {
              op: 'collection_any',
              path: 'professionalCredentials',
              where: {
                op: 'all_of',
                of: [
                  { op: 'one_of', path: 'kind', values: ['licence', 'certification'] },
                  { op: 'equals', path: 'issuingCountry', value: 'CA' },
                ],
              },
            },
          },
        ],
      },
      humanReviewReason: {
        en:
          'A job offer is being relied on rather than a certificate of qualification. Paragraph 87.2(3)(d) sets ' +
          'four different offer branches, each conditioned on whether a work permit is held and on how the offer ' +
          'was assessed, and it requires the offer to come from no more than two named employers, neither of ' +
          'them a diplomatic mission nor an employer on the non-compliant list. Which branch applies has to be ' +
          'worked out from the permit history.',
        es:
          'Se invoca una oferta de empleo en lugar de un certificado de cualificación. El art. 87.2(3)(d) ' +
          'establece cuatro ramas distintas de oferta, condicionadas a si se posee permiso de trabajo y a cómo ' +
          'se evaluó la oferta, y exige que la oferta proceda de un máximo de dos empleadores identificados, ' +
          'ninguno de ellos misión diplomática ni empleador incluido en la lista de incumplidores. Determinar ' +
          'qué rama se aplica exige examinar el historial de permisos.',
      },
      guidance: {
        en:
          'A certificate of qualification is issued by the provincial or territorial body that governs trades, ' +
          'or by a federal authority, after the applicant has been assessed and has passed a certification ' +
          'exam; it must be in the same trade as the application. Meridian records a Canadian licence or ' +
          'certification without recording which trade it covers, so the match has to be confirmed.',
        es:
          'El certificado de cualificación lo expide el organismo provincial o territorial que regula los ' +
          'oficios, o una autoridad federal, tras evaluar a la persona solicitante y superar esta un examen de ' +
          'certificación; debe corresponder al mismo oficio de la solicitud. Meridian registra una licencia o ' +
          'certificación canadiense sin registrar a qué oficio corresponde, por lo que la correspondencia debe ' +
          'confirmarse.',
      },
    },
    {
      id: 'ca-fst-settlement-funds-exemption',
      kind: 'economic',
      weight: 'material',
      citationIds: ['ca-irpr-s-87-2-5', 'ca-ircc-proof-of-funds'],
      label: {
        en: 'Exempt from proving settlement funds: able to work legally in Canada with a valid Canadian job offer',
        es: 'Exención de acreditar fondos de establecimiento: autorización para trabajar legalmente en Canadá con oferta de empleo canadiense válida',
      },
      evaluator: settlementFundsExemption,
      guidance: {
        en:
          'Subsection 87.2(5) exempts the applicants who qualify through the work-permit branches of paragraph ' +
          '87.2(3)(d); everyone else must hold transferable and available funds equal to one half of the ' +
          'minimum necessary income, unencumbered by debts. IRCC publishes those amounts and updates them every ' +
          'year against 50 per cent of the low income cut-off totals. Meridian records no bank balance, so ' +
          'unmet here means the exemption does not appear to apply, not that the funds requirement has been ' +
          'failed. It never produces an ineligible verdict on its own.',
        es:
          'El art. 87.2(5) exime a quienes acceden por las ramas de permiso de trabajo del art. 87.2(3)(d); el ' +
          'resto debe disponer de fondos transferibles y disponibles equivalentes a la mitad del ingreso mínimo ' +
          'necesario, libres de cargas. IRCC publica esos importes y los actualiza cada año conforme al 50 por ' +
          'ciento de los umbrales de bajos ingresos. Meridian no registra saldos bancarios, de modo que un ' +
          'incumplimiento aquí significa que la exención no parece aplicarse, no que se haya incumplido el ' +
          'requisito de fondos. Por sí solo nunca genera un veredicto de inelegibilidad.',
      },
    },
    {
      id: 'ca-fst-outside-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-2-2'],
      label: {
        en: 'Intention to reside in a province other than Quebec',
        es: 'Intención de residir en una provincia distinta de Quebec',
      },
      evaluator: { op: 'is_true', path: 'intent.intendsToResideOutsideQuebec' },
      guidance: {
        en:
          'Quebec selects its own economic immigrants under a separate agreement with the federal government. ' +
          'Work experience gained while living in Quebec still counts, provided the applicant can show they do ' +
          'not plan to settle there.',
        es:
          'Quebec selecciona a sus propios inmigrantes económicos mediante un acuerdo específico con el gobierno ' +
          'federal. La experiencia laboral obtenida mientras se residía en Quebec sigue computando, siempre que ' +
          'se acredite que no se planea establecerse allí.',
      },
    },
    {
      id: 'ca-fst-admissibility',
      kind: 'character',
      weight: 'informational',
      citationIds: ['ca-ircc-fst-program'],
      label: {
        en: 'A clear criminal record is self-declared — admissibility itself is not assessed here',
        es: 'Antecedentes penales declarados como limpios por la persona solicitante — la admisibilidad no se valora aquí',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      guidance: {
        en:
          'IRCC states that an applicant must be admissible to Canada, and inadmissibility can arise on ' +
          'security, criminal, medical, financial and misrepresentation grounds. That decision is an officer’s, ' +
          'made on evidence including police certificates and a medical examination. A self-declaration is ' +
          'recorded as a starting point and carries no weight in the verdict.',
        es:
          'IRCC señala que la persona solicitante debe ser admisible en Canadá, y la inadmisibilidad puede ' +
          'derivarse de motivos de seguridad, penales, médicos, económicos o de falsedad. Esa decisión ' +
          'corresponde a un oficial, sobre pruebas que incluyen certificados policiales y un examen médico. La ' +
          'autodeclaración se registra como punto de partida y no influye en el veredicto.',
      },
    },
  ],
  durations: {
    citationIds: [
      'ca-ircc-express-entry-overview',
      'ca-irpa-s-10-3',
      'ca-express-entry-mi-2014',
    ],
    note: {
      en:
        'Meeting this class is not the same as being admitted, and the class is not the same thing as Express ' +
        'Entry. Express Entry is the online system IRCC uses to manage applications under this class, the ' +
        'Federal Skilled Worker Program and the Canadian Experience Class. A candidate who meets a class creates ' +
        'a profile, enters a pool, and is invited to apply by rank under the Comprehensive Ranking System. ' +
        'Section 10.3 of the Act lets the Minister set both the basis of that ranking and the rank required to ' +
        'be invited, by instruction; the instructions fix no minimum score, and the score that draws an ' +
        'invitation in any given round depends on who is in the pool that day. Meridian records no ranking ' +
        'score and no round cut-off, because a number that moves every few weeks would be read as a target and ' +
        'would be wrong. Education is not an eligibility requirement for this class, though a credential ' +
        'assessed for immigration purposes can raise a candidate’s rank in the pool.',
      es:
        'Cumplir los requisitos de esta clase no equivale a ser admitido, y la clase no es lo mismo que Express ' +
        'Entry. Express Entry es el sistema en línea que IRCC utiliza para gestionar las solicitudes de esta ' +
        'clase, del Programa Federal de Trabajadores Cualificados y de la Clase de Experiencia Canadiense. ' +
        'Quien cumple los requisitos de una clase crea un perfil, entra en un fondo común y es invitado a ' +
        'solicitar según su posición en el Sistema Integral de Clasificación. El art. 10.3 de la Ley permite al ' +
        'Ministro fijar por instrucción tanto la base de esa clasificación como la posición necesaria para ser ' +
        'invitado; las instrucciones no fijan puntuación mínima, y la puntuación que obtiene invitación en cada ' +
        'ronda depende de quién esté en el fondo común ese día. Meridian no registra puntuaciones ni cortes de ' +
        'ronda, porque una cifra que cambia cada pocas semanas se leería como un objetivo y sería errónea. La ' +
        'titulación no es requisito de elegibilidad en esta clase, aunque una credencial evaluada a efectos ' +
        'migratorios puede mejorar la posición de la candidatura en el fondo común.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const CA_FEDERAL_ECONOMIC_PATHWAYS: readonly Pathway[] = [
  caFederalSkilledWorker,
  caFederalSkilledTrades,
];
