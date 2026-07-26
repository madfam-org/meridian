/**
 * The United States — nonimmigrant classifications.
 *
 * Nine records: the USMCA professional (TN), H-1B, L-1A, L-1B, O-1A, E-1, E-2,
 * F-1 with its practical training, and B-1/B-2. All are `reviewStatus:
 * 'unreviewed'`, and none of them may be ranked or recommended until a licensed
 * person has read them.
 *
 * ## Three structural facts that shape every record here
 *
 * **The burden runs the wrong way.** 8 U.S.C. § 1101(a)(15) defines "immigrant"
 * residually — every alien *except* one within an enumerated nonimmigrant class
 * — and § 1184(b) presumes every applicant to be an immigrant until they prove
 * otherwise to a consular officer and again to an immigration officer. The
 * exceptions to that presumption are narrow: L, V, and H-1B1 only. TN, O, F, B
 * and E are all inside it. "Prove the stay is temporary" is therefore a real
 * criterion on most of these routes, and it is a state of mind an officer
 * assesses rather than a threshold anyone can measure.
 *
 * **Visa, admission and status are three different things.** § 1201(h) says in
 * terms that a visa does not entitle its holder to be admitted. A visa governs
 * when you may travel; the admission period recorded by CBP governs how long you
 * may stay. No criterion in this file keys to a visa expiry date, because a
 * criterion that did would be measuring the wrong quantity.
 *
 * **Nothing here decides a discretionary standard.** "Specialty occupation",
 * "managerial capacity", "extraordinary ability", "substantial trade" and
 * "substantial amount of capital" are characterisations an adjudicator makes.
 * Where a criterion turns on one, this file uses the pattern the rest of the
 * catalog uses: the evaluator reports a *definite failure* where the facts show
 * one, and escalates to a person in every case that would otherwise produce a
 * green tick. A pathway that can only ever say "no" or "ask a person" is the
 * honest shape for a rule software cannot apply.
 *
 * ## How the sources were read
 *
 * Every URL below was fetched on 2026-07-26. Two caveats a later reader needs:
 *
 * - The text of 8 CFR 214.2 was read through the eCFR API (`/api/versioner/v1/
 *   full/2026-07-23/title-8.xml?part=214&section=214.2`) because the section is
 *   too large to render in one page; the Cornell URL carried on those citations
 *   was fetched separately and serves the same section.
 * - The three Federal Register documents cited here carry **no url**. Their
 *   citation, title, publication date and effective date were confirmed through
 *   the Federal Register API; the human-readable document pages refused
 *   automated access, so no link is offered rather than an unverified one.
 *
 * ## What this file deliberately does not contain
 *
 * - **No probability of selection in the H-1B lottery.** The selection is now
 *   weighted by OEWS wage level rather than uniform, and a chance of selection
 *   would be a prediction of outcome — fabricated, and the most regulated thing
 *   an unlicensed adviser can say.
 * - **No dollar figure for E-2.** There is none in the statute or the
 *   regulation. Any figure a secondary source offers is invented.
 * - **No processing times, no queue positions, no priority dates.**
 * - **No asylum, refugee, withholding, CAT, U, T or VAWA route.** Those concern
 *   people at risk, turn on credibility rather than criteria, and a self-serve
 *   checker is the wrong instrument for them. Their absence from this file is
 *   deliberate and is not a statement that they do not exist: a person in that
 *   situation needs a licensed immigration lawyer or an accredited
 *   representative, not this catalog.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import { EDUCATION_SCALE } from '../facts.js';
import type { EvaluatorSpec, Pathway } from '../schema.js';
import {
  CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS,
  CUSMA_PROFESSION_IDS,
  CUSMA_PROFESSIONS,
} from './cusma-professions.js';

const US: CountryCode = countryCode('US');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-26');

const USC_1101_URL = 'https://www.law.cornell.edu/uscode/text/8/1101';
const USC_1182_URL = 'https://www.law.cornell.edu/uscode/text/8/1182';
const USC_1184_URL = 'https://www.law.cornell.edu/uscode/text/8/1184';
const CFR_8_214_2_URL = 'https://www.law.cornell.edu/cfr/text/8/214.2';
const CFR_8_214_6_URL = 'https://www.law.cornell.edu/cfr/text/8/214.6';
const CFR_22_41_31_URL = 'https://www.law.cornell.edu/cfr/text/22/41.31';
const CFR_22_41_59_URL = 'https://www.law.cornell.edu/cfr/text/22/41.59';
const FAM_402_2_URL = 'https://fam.state.gov/fam/09FAM/09FAM040202.html';
const FAM_402_9_URL = 'https://fam.state.gov/fam/09FAM/09FAM040209.html';
const FAM_402_17_URL = 'https://fam.state.gov/fam/09FAM/09FAM040217.html';
const USMCA_CH16_URL =
  'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/text-texte/16.aspx';

const INA = 'Immigration and Nationality Act (8 U.S.C.)';
const CFR8 = 'Code of Federal Regulations, title 8 (Aliens and Nationality)';
const CFR22 = 'Code of Federal Regulations, title 22 (Foreign Relations)';
const FAM = 'Foreign Affairs Manual, volume 9 (Visas)';

// ---------------------------------------------------------------------------
// Citations — statute
//
// Practitioners cite the INA section, the Code cites the U.S.C. section, and the
// two numbers are different: INA 212 is 8 U.S.C. 1182, INA 214 is 1184, INA 245
// is 1255. Both numbers are carried in `provision` so a reader arriving from
// either direction finds the same provision.
// ---------------------------------------------------------------------------

const inaNonimmigrantClasses = {
  id: 'us-ina-101-a-15',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1101(a)(15) (INA § 101(a)(15))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The term immigrant means every alien except an alien who is within one of the enumerated classes of ' +
    'nonimmigrant aliens, lettered (A) through (V). The definition is residual: a person is a nonimmigrant only ' +
    'by fitting a listed class, and everyone else is an immigrant.',
};

const inaPresumptionOfImmigrantStatus = {
  id: 'us-ina-214-b',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(b) (INA § 214(b))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Every alien other than a nonimmigrant described in subparagraph (L) or (V) of section 1101(a)(15), and other ' +
    'than a nonimmigrant described in any provision of section 1101(a)(15)(H)(i) except subclause (b1), is ' +
    'presumed to be an immigrant until the alien establishes entitlement to nonimmigrant status to the ' +
    'satisfaction of the consular officer at the time of visa application and of the immigration officers at the ' +
    'time of application for admission. TN, O, F, B and E applicants are all inside this presumption.',
};

const inaMisrepresentation = {
  id: 'us-ina-212-a-6-c-i',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1182(a)(6)(C)(i) (INA § 212(a)(6)(C)(i))',
  url: USC_1182_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien who by fraud or wilfully misrepresenting a material fact seeks to procure, has sought to procure, ' +
    'or has procured a visa, other documentation, admission, or another benefit under the Act is inadmissible. ' +
    'Whether a misrepresentation is material is a judgement, and the ground is not limited to written statements.',
};

// ---------------------------------------------------------------------------
// Citations — TN and the treaty
// ---------------------------------------------------------------------------

const inaTnAdmission = {
  id: 'us-ina-214-e-1',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(e)(1) (INA § 214(e)(1))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien who is a citizen of Canada or Mexico, and the spouse and children accompanying or following to ' +
    'join, who seeks to enter under Section D of Annex 16-A of the USMCA to engage in business activities at a ' +
    'professional level, may be admitted for that purpose under regulations of the Attorney General. NOTE ON THE ' +
    'HEADING: subsection (e) is headed "Nonimmigrant professionals and annual numerical limit", but the operative ' +
    'text contains no limit — only (e)(1), the admission provision, and (e)(2), E-spouse work authorisation. The ' +
    'heading is a vestige of the expired NAFTA-era Mexican cap. Older secondary sources still describe a cap on ' +
    'Mexican TN admissions; there is none.',
};

const usmcaSectionD = {
  id: 'us-usmca-annex-16a-section-d',
  kind: 'treaty' as const,
  instrument: 'Agreement between the United States of America, the United Mexican States, and Canada (USMCA), Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A, Section D (Professionals) and Appendix 2',
  url: USMCA_CH16_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Section D paragraph 1 requires each Party to grant temporary entry to a business person seeking to engage in ' +
    'a business activity at a professional level in a profession set out in Appendix 2, on presentation of proof ' +
    'of citizenship of a Party and documentation describing the purpose of entry. Paragraph 2 forbids requiring ' +
    'prior approval procedures, petitions or labour certification tests, and forbids any numerical restriction. ' +
    'Paragraph 3 nonetheless permits a Party to require a visa before entry — which is the entire source of the ' +
    'difference between the Mexican and the Canadian experience of the same treaty right. Text read from the ' +
    'Government of Canada consolidated text of Chapter 16.',
};

const cfrTnScopeAndDefinitions = {
  id: 'us-8-cfr-214-6-a-b',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.6(a) and (b)',
  url: CFR_8_214_6_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Scope: under section 214(e) of the Act a citizen of Canada or Mexico who seeks temporary entry as a business ' +
    'person to engage in business activities at a professional level may be admitted in accordance with the ' +
    'USMCA. Definitions: "engage in business activities at a professional level" means the performance of ' +
    'prearranged business activities for a United States entity, and does not authorise the establishment of a ' +
    'business or practice in the United States in which the professional will be, in substance, self-employed; ' +
    '"temporary entry" means entry without the intent to establish permanent residence, and the applicant must ' +
    'satisfy the officer that the work assignment will end at a predictable time and that he or she will depart ' +
    'upon completion.',
};

const cfrTnProfessionList = {
  id: 'us-8-cfr-214-6-c',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.6(c) (Appendix 2 to Annex 16-A of Chapter 16, annotated)',
  url: CFR_8_214_6_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The regulation reproduces the whole of Appendix 2 in United States law — 63 professions in four groups, each ' +
    'with its minimum requirement — together with the definitional footnotes. "State/provincial license" means ' +
    'any document issued by a state, provincial, or federal government, as the case may be, or under its ' +
    'authority, but not by a local government, that permits a person to engage in a regulated activity or ' +
    'profession. "Post-Secondary Diploma" means a credential issued, on completion of two or more years of ' +
    'postsecondary education, by an accredited academic institution in Canada or the United States. ' +
    '"Post-Secondary Certificate" means a certificate issued, on completion of two or more years of postsecondary ' +
    'education at an academic institution, by the federal government of Mexico or a state government in Mexico, ' +
    'an academic institution recognised by either, or an academic institution created by federal or state law. ' +
    'Meridian encodes a subset of the list, so an unrecognised occupation is routed to a person rather than ' +
    'reported as unlisted.',
};

const cfrTnEntryDocumentation = {
  id: 'us-8-cfr-214-6-d',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.6(d)',
  url: CFR_8_214_6_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A citizen of Mexico is admitted on presentation of a valid passport AND a valid TN nonimmigrant visa at a ' +
    'Class A port of entry, an airport handling international traffic, or a pre-clearance or pre-flight station. ' +
    'A citizen of Canada simply makes application for admission with a Department officer at the same places. ' +
    'Both must present documentation of the offer, which may be a letter from the prospective United States ' +
    'employer or from the foreign employer, supported by diplomas, degrees or membership of a professional ' +
    'organisation, and stating the Appendix 2 profession, the professional activities, the anticipated length of ' +
    'stay, the educational qualifications and the arrangements for remuneration.',
};

const cfrTnPeriods = {
  id: 'us-8-cfr-214-6-e-h',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.6(e) and (h)(1)(iii)-(iv)',
  url: CFR_8_214_6_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A qualified applicant is admitted under the classification symbol TN for a period not to exceed three years, ' +
    'and the document bears the legend "multiple entry". An extension of stay may be approved by USCIS for a ' +
    'maximum period of three years, and there is no specific limit on the total period of time an alien may be ' +
    'in TN status provided the alien continues to be engaged in TN business activities for a United States ' +
    'employer or entity at a professional level and otherwise maintains status.',
};

const cfrTnConsular = {
  id: 'us-22-cfr-41-59',
  kind: 'regulation' as const,
  instrument: CFR22,
  provision: '22 CFR 41.59',
  url: CFR_22_41_59_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The consular rule for USMCA professionals. The applicant must present sufficient evidence of an offer of ' +
    'employment in the United States requiring a person in a professional capacity consistent with Section D and ' +
    'Appendix 2, and sufficient evidence of the credentials that Appendix lists for the profession. Visa validity ' +
    'may not exceed the period established on a reciprocal basis — a schedule, not a period of stay. Temporary ' +
    'entry means entry without the intent to establish permanent residence, and a temporary period has a ' +
    'reasonable, finite end that does not equate to permanent residence.',
};

const famTnLicensure = {
  id: 'us-9-fam-402-17-4',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.17-4',
  url: FAM_402_17_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DEPARTMENT OF STATE GUIDANCE. Requirements for classification as a USMCA professional do not include United ' +
    'States licensure: licensure is a post-entry requirement enforced by the state or other non-federal ' +
    'authority, and classification must not be denied solely because the applicant does not already hold a ' +
    'licence. One express exception: for a TN position as a nurse providing health care services, 22 CFR 40.53(a) ' +
    'requires a certificate from the Commission on Graduates of Foreign Nursing Schools or another approved ' +
    'credentialing service under INA 212(a)(5)(C) and 212(r). The guidance also records that where a specific ' +
    'degree is required, experience cannot be substituted for it, and that the degree need not be in the exact ' +
    'field where there is significant overlap with the work — which is an officer’s judgement, not a rule.',
};

const famTnCredentials = {
  id: 'us-9-fam-402-17-5',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.17-5(C)',
  url: FAM_402_17_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'MEXICO-SPECIFIC EVIDENTIARY RULE. A Mexican applicant may present a cédula profesional issued by the ' +
    'Secretaría de Educación Pública, or a cédula issued by one of the Mexican state governments, or a título, as ' +
    'evidence of completion of a degree programme for the categories requiring the equivalent of a bachelor’s ' +
    'degree (licenciatura). A carta de pasante does not provide sufficient evidence, because it attests only to ' +
    'completion of the coursework and not to full completion of all degree requirements for the licenciatura.',
};

const famTnEntryDocumentation = {
  id: 'us-9-fam-402-17-6',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.17-6',
  url: FAM_402_17_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A Mexican citizen seeking TN status must apply for and be issued a visa, whose validity must coincide with ' +
    'the reciprocity schedule. Because Canadian citizens are not obliged to hold a nonimmigrant visa to enter, ' +
    'issuance of a TN visa to a Canadian should be rare, although one may be issued on request — for example ' +
    'where the Canadian travels with a non-Canadian dependant who needs a TD visa to board and to seek entry.',
};

const famTnTemporariness = {
  id: 'us-9-fam-402-17-7',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.17-7',
  url: FAM_402_17_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'OFFICER JUDGEMENT. The officer must be satisfied the proposed stay is temporary: a temporary stay has a ' +
    'reasonable, finite end that does not equate to permanent residence. An intent to immigrate in the future ' +
    'that is in no way connected to the proposed immediate trip need not in itself result in a finding that the ' +
    'immediate trip is not temporary, and repeated renewal of a TN visa leading to an extended stay may still be ' +
    'temporary if there is no immediate intent to immigrate. TN is not a dual-intent classification: 8 U.S.C. ' +
    '§ 1184(h), which neutralises the effect of a pending immigrant petition, lists H-1B, L and V and does not ' +
    'list TN.',
};

// ---------------------------------------------------------------------------
// Shared evaluator specs
// ---------------------------------------------------------------------------

/**
 * A signed offer from an employer in the United States, which is not
 * self-employment.
 *
 * Used by the TN record only. The self-employment limb is not reused on H-1B,
 * where the regulation now expressly contemplates a beneficiary holding a
 * controlling interest in the petitioner, subject to conditions — importing the
 * TN exclusion there would invent a bar that no longer exists.
 */
const tnPrearrangedUsEmployment: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'equals', path: 'jobOffer.employerCountry', value: 'US' },
    { op: 'is_true', path: 'jobOffer.writtenOffer' },
    { op: 'is_false', path: 'jobOffer.selfEmployment' },
  ],
};

/**
 * A recorded refusal or overstay, alongside an assertion of temporary intent.
 *
 * This is a routing decision, not a legal rule. Section 214(b) puts the burden
 * of overcoming the immigrant presumption on the applicant, and a prior refusal
 * or a prior overstay is precisely the history a consular officer weighs when
 * deciding whether it has been overcome. Where either is recorded, the
 * temporariness criterion goes to a person instead of returning a tick that
 * nobody could stand behind. Where neither is recorded the spec is `unknown`,
 * which does not escalate — absence of a recorded refusal is not evidence of a
 * clean history, and treating it as a red flag would escalate every applicant.
 */
const temporaryIntentWithAdverseHistory: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'is_true', path: 'intent.temporary' },
    {
      op: 'any_of',
      of: [
        { op: 'gt', path: 'travelHistory.priorRefusals', value: 0 },
        { op: 'gt', path: 'travelHistory.priorOverstays', value: 0 },
      ],
    },
  ],
};

/**
 * One `any_of` branch per Appendix 2 profession, generated from the shared
 * profession table.
 *
 * The table is shared with `ca.ts`, and reusing it is the point: 8 CFR 214.6(c)
 * reproduces the identical Appendix in United States regulation, so the
 * substantive credential test is the same on both sides of the treaty and a
 * second transcription would be a second thing to keep in step.
 *
 * The licence alternative accepts a licence issued in the United States, Canada
 * or Mexico, following the footnote in 8 CFR 214.6(c): a state/provincial
 * licence is any document issued by a state, provincial or federal government,
 * or under its authority, but not by a local government. The Canadian record
 * narrows the same branch to Canadian licences because that is where the work
 * will be done and where the regulator sits.
 *
 * GAP CLOSED 2026-07-26: this comment previously recorded that 8 CFR 214.6(c)
 * lists 63 professions while the shared table held 61, the absentees being Range
 * Manager/Range Conservationist and Sylviculturist (including Forestry
 * Specialist). Both were verified against the regulation and added to
 * `cusma-professions.ts`, which now matches Appendix 2 at 63. The gap mattered
 * on both sides of the treaty: that file feeds the Canadian CUSMA route as well,
 * so two real professions were being routed to a person on both corridors.
 *
 * The unrecognised-occupation branch remains, and still escalates rather than
 * returning "unmet". A code outside Appendix 2 altogether is a question about
 * what the job actually is, not a finding that the person does not qualify.
 */
function tnCredentialBranches(): EvaluatorSpec[] {
  return CUSMA_PROFESSIONS.map((profession): EvaluatorSpec => {
    const alternatives: EvaluatorSpec[] = [
      {
        op: 'ordinal_at_least',
        path: 'educationLevel',
        scale: EDUCATION_SCALE,
        value: profession.minimumEducationLevel,
      },
    ];
    if (profession.diplomaPlusExperienceYears !== undefined) {
      alternatives.push({
        op: 'all_of',
        of: [
          {
            op: 'ordinal_at_least',
            path: 'educationLevel',
            scale: EDUCATION_SCALE,
            value: 'post_secondary_diploma',
          },
          {
            op: 'gte',
            path: 'professionalExperienceYears',
            value: profession.diplomaPlusExperienceYears,
          },
        ],
      });
    }
    if (profession.licenceAlternative === true) {
      alternatives.push({
        op: 'collection_any',
        path: 'professionalCredentials',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'kind', value: 'licence' },
            { op: 'one_of', path: 'issuingCountry', values: ['US', 'CA', 'MX'] },
          ],
        },
      });
    }
    return {
      op: 'all_of',
      of: [
        { op: 'equals', path: 'jobOffer.occupationCode', value: profession.id },
        { op: 'any_of', of: alternatives },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// TN — USMCA professional
// ---------------------------------------------------------------------------

export const usTnUsmcaProfessional: Pathway = {
  id: 'us-tn-usmca-professional',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'TN — USMCA professional',
    es: 'TN — profesional del T-MEC',
  },
  summary: {
    en:
      'Temporary entry to the United States for a citizen of Mexico or Canada to work in one of the professions ' +
      'listed in Appendix 2 to Annex 16-A of the USMCA, for a United States employer, with no petition and no ' +
      'labour certification. The eligibility test is identical for both nationalities; the procedure is not — a ' +
      'Mexican citizen must obtain a TN visa from a consular post before travelling, and a Canadian citizen ' +
      'applies at the port of entry.',
    es:
      'Entrada temporal a Estados Unidos para nacionales de México o Canadá que van a ejercer una de las ' +
      'profesiones listadas en el Apéndice 2 del Anexo 16-A del T-MEC, con un empleador estadounidense, sin ' +
      'petición previa ni certificación laboral. El examen de elegibilidad es idéntico para ambas ' +
      'nacionalidades; el procedimiento no lo es: quien es mexicano debe obtener una visa TN en un consulado ' +
      'antes de viajar, y quien es canadiense la solicita en el puerto de entrada.',
  },
  citations: [
    usmcaSectionD,
    inaTnAdmission,
    inaPresumptionOfImmigrantStatus,
    cfrTnScopeAndDefinitions,
    cfrTnProfessionList,
    cfrTnEntryDocumentation,
    cfrTnPeriods,
    cfrTnConsular,
    famTnLicensure,
    famTnCredentials,
    famTnEntryDocumentation,
    famTnTemporariness,
  ],
  criteria: [
    {
      id: 'us-tn-citizenship',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['us-usmca-annex-16a-section-d', 'us-ina-214-e-1'],
      label: {
        en: 'Citizenship of Mexico or Canada, held and claimed',
        es: 'Nacionalidad mexicana o canadiense, ostentada y alegada',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: ['MX', 'CA'] },
          { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
        ],
      },
      guidance: {
        en:
          'The treaty benefit attaches to citizens of the Parties. Permanent residence in Mexico or Canada is not ' +
          'citizenship of either, however long it has been held, and a permanent resident who is a citizen of a ' +
          'fourth country has no access to this route. A United States citizen needs no classification at all.',
        es:
          'El beneficio del tratado corresponde a los nacionales de las Partes. La residencia permanente en México ' +
          'o en Canadá no equivale a su nacionalidad, por prolongada que sea, y quien reside permanentemente pero ' +
          'es nacional de un tercer país no accede a esta vía. Quien tiene la nacionalidad estadounidense no ' +
          'necesita clasificación alguna.',
      },
    },
    {
      id: 'us-tn-listed-profession',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-6-c', 'us-usmca-annex-16a-section-d', 'us-9-fam-402-17-5'],
      label: {
        en: 'The occupation is one of the professions listed in Appendix 2',
        es: 'La ocupación es una de las profesiones listadas en el Apéndice 2',
      },
      evaluator: {
        op: 'one_of',
        path: 'jobOffer.occupationCode',
        values: [...CUSMA_PROFESSION_IDS],
      },
      // Two different situations escalate. A profession known to draw
      // heightened scrutiny escalates because a clean credential match still
      // tells you very little about whether the officer will agree that the job
      // is that profession. An occupation Meridian does not recognise escalates
      // because this table is a subset of the 63 entries in 8 CFR 214.6(c) —
      // reporting "unmet" would assert that the treaty does not list a
      // profession we have simply not encoded, which is a false negative on
      // somebody's livelihood.
      humanReviewWhen: {
        op: 'any_of',
        of: [
          {
            op: 'one_of',
            path: 'jobOffer.occupationCode',
            values: [...CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS],
          },
          {
            op: 'all_of',
            of: [
              { op: 'is_present', path: 'jobOffer.occupationCode' },
              {
                op: 'not',
                of: {
                  op: 'one_of',
                  path: 'jobOffer.occupationCode',
                  values: [...CUSMA_PROFESSION_IDS],
                },
              },
            ],
          },
        ],
      },
      humanReviewReason: {
        en:
          'Either the profession is one officers examine closely, or the occupation given is not in Appendix 2 at ' +
          'all. This catalog encodes all 63 entries of 8 CFR 214.6(c), so an unrecognised code is a question about ' +
          'what the job actually is — job titles and Appendix entries do not map one to one — and not a finding ' +
          'that the person fails the test. In both cases the Appendix entry and the actual job description have to ' +
          'be compared by a person.',
        es:
          'O bien la profesión es de las que los oficiales examinan con detalle, o bien no figura en el ' +
          'subconjunto del Apéndice 2 que Meridian codifica. El reglamento enumera 63 profesiones y este catálogo ' +
          'codifica 61, de modo que una ocupación no reconocida debe cotejarse con el propio 8 CFR 214.6(c) antes ' +
          'de afirmar nada. En ambos casos una persona debe comparar el epígrafe del Apéndice con la descripción ' +
          'real del puesto.',
      },
      guidance: {
        en:
          'The classification follows the job, not the applicant’s degree: the duties actually to be performed ' +
          'must fall within a listed profession. Software development, programming and general information ' +
          'technology support are not listed professions, and an offer drafted as development work is routinely ' +
          'refused under the Computer Systems Analyst entry.',
        es:
          'La clasificación sigue al puesto, no al título de la persona solicitante: las funciones que ' +
          'efectivamente se van a desempeñar deben encajar en una profesión listada. El desarrollo de software, ' +
          'la programación y el soporte informático general no son profesiones listadas, y una oferta redactada ' +
          'como trabajo de desarrollo suele denegarse bajo el epígrafe de Analista de Sistemas Informáticos.',
      },
    },
    {
      id: 'us-tn-credentials',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-6-c', 'us-9-fam-402-17-4', 'us-9-fam-402-17-5'],
      label: {
        en: 'Credentials meet the minimum the Appendix sets for that profession',
        es: 'Las credenciales cumplen el mínimo que el Apéndice fija para esa profesión',
      },
      evaluator: { op: 'any_of', of: tnCredentialBranches() },
      guidance: {
        en:
          'Each entry carries its own minimum. A baccalaureate or licenciatura satisfies most of them but not ' +
          'Lawyer, Physician, Dentist, Veterinarian or Librarian; several accept a post-secondary diploma or ' +
          'certificate with three years of experience, or a state, provincial or federal licence, instead. Where a ' +
          'specific degree is required, experience cannot be substituted for it. For a Mexican applicant the ' +
          'accepted evidence of the degree is a cédula profesional — federal or state — or a título; a carta de ' +
          'pasante is expressly insufficient, because it attests only that the coursework was completed. United ' +
          'States licensure is not an entry requirement and classification must not be refused for want of it, ' +
          'with one exception: a nurse providing health care services needs a CGFNS or equivalent certificate.',
        es:
          'Cada epígrafe tiene su propio mínimo. Una licenciatura cumple la mayoría, pero no los de Abogado, ' +
          'Médico, Odontólogo, Veterinario ni Bibliotecario; varios admiten en su lugar un diploma o certificado ' +
          'de educación superior con tres años de experiencia, o una licencia estatal, provincial o federal. ' +
          'Cuando se exige un título concreto, la experiencia no lo sustituye. Para una persona mexicana la ' +
          'prueba admitida del título es la cédula profesional —federal o estatal— o el título; la carta de ' +
          'pasante es expresamente insuficiente, porque solo acredita haber concluido el plan de estudios. La ' +
          'licencia estadounidense no es requisito de entrada y no puede denegarse la clasificación por no ' +
          'tenerla, con una excepción: el personal de enfermería que preste servicios asistenciales necesita ' +
          'certificado de la CGFNS o equivalente.',
      },
    },
    {
      id: 'us-tn-prearranged-employment',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-6-a-b', 'us-8-cfr-214-6-d', 'us-22-cfr-41-59'],
      label: {
        en: 'Pre-arranged employment with a United States employer or entity, not self-employment',
        es: 'Empleo concertado previamente con un empleador o entidad de Estados Unidos, no por cuenta propia',
      },
      evaluator: tnPrearrangedUsEmployment,
      guidance: {
        en:
          'The classification covers prearranged business activities for a United States entity. It does not ' +
          'authorise establishing a business or practice in which the professional will be, in substance, ' +
          'self-employed, and the regulation deems a professional self-employed where the services are rendered ' +
          'to a corporation or entity of which he or she is the sole or controlling shareholder or owner. The ' +
          'offer letter must state the Appendix 2 profession, describe the professional activities, give the ' +
          'anticipated length of stay, set out the educational qualifications and record the arrangements for ' +
          'remuneration.',
        es:
          'La clasificación cubre actividades empresariales concertadas de antemano para una entidad ' +
          'estadounidense. No autoriza a establecer un negocio o despacho en el que la persona profesional vaya a ' +
          'estar, en esencia, por cuenta propia, y el reglamento la considera por cuenta propia cuando presta ' +
          'servicios a una sociedad o entidad de la que es titular único o accionista de control. La carta de ' +
          'oferta debe indicar la profesión del Apéndice 2, describir las actividades profesionales, señalar la ' +
          'duración prevista de la estancia, exponer las credenciales académicas y recoger la remuneración ' +
          'acordada.',
      },
    },
    {
      id: 'us-tn-mexican-consular-visa',
      kind: 'procedural',
      weight: 'informational',
      citationIds: [
        'us-8-cfr-214-6-d',
        'us-9-fam-402-17-6',
        'us-22-cfr-41-59',
        'us-usmca-annex-16a-section-d',
      ],
      label: {
        en: 'Mexican citizenship: a consular-issued TN visa is required before travelling',
        es: 'Nacionalidad mexicana: se requiere visa TN expedida en consulado antes de viajar',
      },
      // Informational on purpose. Being Mexican is not a merit or a demerit on
      // this route, and a criterion that moved the verdict on nationality would
      // be saying it is. What it does is surface the one real difference
      // between the two nationalities under the same treaty right: a procedure.
      evaluator: { op: 'equals', path: 'claimedNationality', value: 'MX' },
      guidance: {
        en:
          'Section D of Annex 16-A forbids petitions, labour certification tests and numerical restrictions, but ' +
          'paragraph 3 expressly permits a Party to require a visa. The United States requires one of Mexican ' +
          'citizens and not of Canadians. The substantive test is identical; the procedure is not. A Mexican ' +
          'applicant is adjudicated by a consular officer before travelling, with the section 214(b) immigrant ' +
          'presumption and the section 221(g) refusal power in play, and only then presents the visa at the port ' +
          'of entry, where a CBP officer decides admission separately. Visa validity follows the reciprocity ' +
          'schedule and is not the period of stay: the period of stay is what CBP records on admission.',
        es:
          'La Sección D del Anexo 16-A prohíbe peticiones previas, pruebas de certificación laboral y ' +
          'restricciones numéricas, pero su párrafo 3 permite expresamente que una Parte exija visa. Estados ' +
          'Unidos la exige a las personas mexicanas y no a las canadienses. El examen de fondo es idéntico; el ' +
          'procedimiento no. La solicitud mexicana la resuelve un oficial consular antes del viaje, con la ' +
          'presunción de inmigrante del artículo 214(b) y la facultad de denegación del artículo 221(g) en juego, ' +
          'y solo después se presenta la visa en el puerto de entrada, donde otro oficial decide la admisión por ' +
          'separado. La vigencia de la visa sigue el cuadro de reciprocidad y no es el periodo de estancia: el ' +
          'periodo de estancia es el que registra CBP al admitir.',
      },
    },
    {
      id: 'us-tn-temporary-entry',
      kind: 'intent',
      weight: 'blocking',
      citationIds: [
        'us-8-cfr-214-6-a-b',
        'us-ina-214-b',
        'us-9-fam-402-17-7',
        'us-22-cfr-41-59',
      ],
      label: {
        en: 'The entry is temporary, without the intent to establish permanent residence',
        es: 'La entrada es temporal, sin intención de establecer residencia permanente',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      humanReviewWhen: temporaryIntentWithAdverseHistory,
      humanReviewReason: {
        en:
          'Temporary intent is asserted, and a prior refusal or a prior overstay is also recorded. Section 214(b) ' +
          'puts the burden of overcoming the immigrant presumption on the applicant, and that history is exactly ' +
          'what an officer weighs in deciding whether it has been overcome. The judgement is not one this engine ' +
          'can make.',
        es:
          'Se afirma una intención temporal y consta además una denegación o una estancia excedida previas. El ' +
          'artículo 214(b) impone a la persona solicitante la carga de desvirtuar la presunción de inmigrante, y ' +
          'ese historial es precisamente lo que un oficial pondera para decidir si la ha desvirtuado. Ese juicio ' +
          'no lo puede hacer este motor.',
      },
      guidance: {
        en:
          'TN is not a dual-intent classification. Section 214(h), which provides that being the beneficiary of an ' +
          'immigrant petition is not evidence of an intention to abandon a foreign residence, lists H-1B, L and V ' +
          'and does not list TN. The Department of State tempers that: an intent to immigrate in the future that ' +
          'is in no way connected to the immediate trip need not in itself defeat the application, and repeated ' +
          'renewals leading to an extended stay may still be temporary where there is no immediate intent to ' +
          'immigrate. What is required is that the assignment end at a predictable time and that the applicant ' +
          'depart on completion.',
        es:
          'La TN no admite doble intención. El artículo 214(h), según el cual ser beneficiario de una petición de ' +
          'inmigrante no prueba la intención de abandonar la residencia en el extranjero, menciona H-1B, L y V y ' +
          'no menciona TN. El Departamento de Estado lo matiza: una intención de emigrar en el futuro que no ' +
          'guarde relación con el viaje inmediato no tiene por qué frustrar la solicitud, y las renovaciones ' +
          'sucesivas que prolonguen la estancia pueden seguir siendo temporales si no hay intención inmediata de ' +
          'emigrar. Lo exigido es que la asignación termine en un momento previsible y que la persona salga al ' +
          'concluirla.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    renewalMonths: 36,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-6-e-h', 'us-22-cfr-41-59'],
    note: {
      en:
        'Admission is for a period not to exceed three years, marked multiple entry, and extensions may be ' +
        'approved for a maximum of three years each. There is no specific limit on the total time a person may ' +
        'hold TN status, provided the professional activities and the status continue. Two dates are routinely ' +
        'confused and must not be: the visa validity, which follows the reciprocity schedule and governs when a ' +
        'Mexican applicant may travel, and the period of stay recorded by CBP on admission, which governs how ' +
        'long the person may remain. Time in TN status is temporary residence and does not itself lead to ' +
        'permanent residence or naturalisation.',
      es:
        'La admisión es por un periodo que no excede de tres años, con la anotación de entradas múltiples, y las ' +
        'prórrogas pueden concederse por un máximo de tres años cada una. No hay límite específico al tiempo ' +
        'total que una persona puede mantener el estatus TN, siempre que continúen las actividades profesionales ' +
        'y el propio estatus. Dos fechas se confunden con frecuencia y no deben confundirse: la vigencia de la ' +
        'visa, que sigue el cuadro de reciprocidad y determina cuándo puede viajar una persona mexicana, y el ' +
        'periodo de estancia que CBP registra al admitir, que determina cuánto tiempo puede permanecer. El tiempo ' +
        'en estatus TN es residencia temporal y no conduce por sí mismo a la residencia permanente ni a la ' +
        'naturalización.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Citations — H-1B
// ---------------------------------------------------------------------------

const inaSpecialtyOccupation = {
  id: 'us-ina-214-i-1',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(i)(1) (INA § 214(i)(1))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'A specialty occupation is an occupation that requires theoretical and practical application of a body of ' +
    'highly specialized knowledge, and attainment of a bachelor’s or higher degree in the specific specialty (or ' +
    'its equivalent) as a minimum for entry into the occupation in the United States. Marked discretionary ' +
    'because the definition is qualitative and its application to a particular job is contested in practice, not ' +
    'because the statute leaves the standard to anybody’s discretion.',
};

const inaH1bCap = {
  id: 'us-ina-214-g-1-a',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(g)(1)(A) (INA § 214(g)(1)(A))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The number of aliens who may be issued visas or otherwise provided H-1B status is capped for each fiscal ' +
    'year. The schedule runs from 65,000 before fiscal year 1999 through the elevated numbers of 1999 to 2003, ' +
    'and returns to 65,000 in each succeeding fiscal year.',
};

const inaH1bCapExemptions = {
  id: 'us-ina-214-g-5',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(g)(5) (INA § 214(g)(5))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The cap does not apply to a beneficiary employed, or who has received an offer of employment, at an ' +
    'institution of higher education or a related or affiliated nonprofit entity, or at a nonprofit or ' +
    'governmental research organisation; nor to a beneficiary who has earned a master’s or higher degree from a ' +
    'UNITED STATES institution of higher education, until the number of aliens so exempted in the year exceeds ' +
    '20,000. A foreign master’s degree does not qualify for the advanced-degree exemption.',
};

const inaH1bSixYearMaximum = {
  id: 'us-ina-214-g-4',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(g)(4) (INA § 214(g)(4))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'In the case of a nonimmigrant described in section 1101(a)(15)(H)(i)(b), the period of authorized admission ' +
    'as such a nonimmigrant may not exceed 6 years.',
};

const inaDualIntent = {
  id: 'us-ina-214-h',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1184(h) (INA § 214(h))',
  url: USC_1184_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The fact that an alien is the beneficiary of an application for preference status filed under section 1154, ' +
    'or has otherwise sought permanent residence, shall not constitute evidence of an intention to abandon a ' +
    'foreign residence for the purpose of obtaining or maintaining status as a nonimmigrant described in ' +
    'subparagraph (H)(i)(b) or (c), (L), or (V) of section 1101(a)(15). The list is exhaustive: TN, O, E, F and B ' +
    'are not in it.',
};

const cfrH1bFiling = {
  id: 'us-8-cfr-214-2-h-2-i-a',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(h)(2)(i)(A) and (h)(4)(iii)(B)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A United States employer seeking to classify an alien as an H-1B temporary employee must file a petition on ' +
    'the form prescribed by USCIS. The petition must be accompanied by a certification from the Secretary of ' +
    'Labor that the petitioner has filed a labor condition application, by a statement that the petitioner will ' +
    'comply with the terms of that application for the duration of the authorised stay, and by evidence that the ' +
    'alien qualifies to perform services in the specialty occupation.',
};

const cfrH1bDefinitions = {
  id: 'us-8-cfr-214-2-h-4-ii',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(h)(4)(ii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Specialty occupation is defined to require a bachelor’s degree or higher in a DIRECTLY RELATED specific ' +
    'specialty, or its equivalent, as a minimum for entry; a position is not a specialty occupation if a general ' +
    'degree without further specialisation suffices; a range of qualifying fields is permitted provided each is ' +
    'directly related to the duties. A United States employer is defined as a person or organisation in the ' +
    'United States with a bona fide job offer (which may include telework or other off-site work in the United ' +
    'States), a legal presence and amenability to service of process in the United States, and an IRS tax ' +
    'identification number; where the beneficiary holds a controlling interest in the petitioner, meaning more ' +
    'than 50 percent ownership or majority voting rights, the beneficiary may perform duties related to owning ' +
    'and directing the business provided specialty-occupation duties occupy the majority of the time.',
};

const cfrH1bCriteria = {
  id: 'us-8-cfr-214-2-h-4-iii',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(h)(4)(iii)(A), (C) and (D)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'A position does not meet the definition unless it also satisfies at least one of four criteria: the degree ' +
    'is normally the minimum requirement for entry into the occupation; is normally required in parallel ' +
    'positions among similar organisations in the industry; is normally required by the employer (or the third ' +
    'party the beneficiary is staffed to) for the position; or the duties are so specialized, complex or unique ' +
    'that the knowledge required is normally associated with such a degree. "Normally" is defined as conforming ' +
    'to a type, standard or regular pattern, and expressly does not mean always. The beneficiary must in turn ' +
    'hold a United States degree required by the occupation, a foreign degree determined equivalent to one, an ' +
    'unrestricted State licence authorising full practice and immediate engagement in the specialty in the state ' +
    'of intended employment, or education, specialized training and/or progressively responsible experience ' +
    'equivalent to the degree together with recognition of expertise. For equivalence, three years of specialized ' +
    'training or work experience must be demonstrated for each year of college-level training the alien lacks.',
};

const cfrH1bRegistrationAndSelection = {
  id: 'us-8-cfr-214-2-h-8-iii',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(h)(8)(iii)(A)(1) and (h)(8)(iii)(A)(4)(ii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Before filing a cap-subject petition the petitioner must register electronically for the beneficiary, and ' +
    'may file only after that registration is selected. Selection is no longer uniform. Under the WEIGHTED ' +
    'SELECTION paragraph, if a random selection is necessary USCIS assigns each unique beneficiary to the lowest ' +
    'OEWS wage level among all registrations submitted on that beneficiary’s behalf and enters the beneficiary ' +
    'into the pool in a weighted manner: wage level IV four times, level III three times, level II twice, level I ' +
    'once. Registration is beneficiary-centric, so the number of registrations does not change the odds; the wage ' +
    'level does.',
};

const cfrH1bValidityAndStay = {
  id: 'us-8-cfr-214-2-h-9-h-13-h-15',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(h)(9)(iii)(A)(1), (h)(13)(iii)(A) and (h)(15)(ii)(B)(1)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An approved H-1B petition in a specialty occupation is valid for a period of up to three years, but may not ' +
    'exceed the validity period of the labor condition application. An extension of stay may be authorised for up ' +
    'to three years, and the total period of stay may not exceed six years. An H-1B alien who has spent six years ' +
    'in the United States under section 101(a)(15)(H) and/or (L) may not seek extension, change status or be ' +
    'readmitted under either section unless the alien has resided and been physically present outside the United ' +
    'States, except for brief trips for business or pleasure, for the immediate prior year. Time spent physically ' +
    'outside the United States exceeding 24 hours during the validity of an approved petition is not counted ' +
    'toward the maximum.',
};

const frWeightedSelection = {
  id: 'us-fr-90-60864-h1b-weighted-selection',
  kind: 'regulation' as const,
  instrument:
    'Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions, 90 FR 60864',
  provision: 'final rule published 29 December 2025, effective 27 February 2026',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'NO URL BY DESIGN. The citation, title, publication date and effective date were confirmed through the ' +
    'Federal Register API on 2026-07-26; the human-readable document page refused automated access, so no link ' +
    'is offered rather than an unverified one. This rule is what replaced the uniform H-1B lottery with the ' +
    'weighted selection now codified at 8 CFR 214.2(h)(8)(iii)(A)(4)(ii). Every source describing the cap as "a ' +
    'random lottery" without qualification is describing the pre-2026 rule.',
};

const proclamationH1bEntryRestriction = {
  id: 'us-proclamation-90-46027-h1b-entry',
  kind: 'policy' as const,
  instrument: 'Proclamation, Restriction on Entry of Certain Nonimmigrant Workers, 90 FR 46027',
  provision: 'issued under INA §§ 212(f) and 215(a) (8 U.S.C. §§ 1182(f), 1185(a)); published 24 September 2025',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'IN FORCE AND TIME-LIMITED; STATUS MUST BE RE-CHECKED BEFORE RELIANCE. The proclamation restricts the entry ' +
    'of aliens as nonimmigrants to perform services in a specialty occupation under INA 101(a)(15)(H)(i)(b), ' +
    'except where the petition is accompanied or supplemented by a payment of $100,000. It is limited to ' +
    'beneficiaries currently outside the United States and applies only to those who enter or attempt to enter ' +
    'after its effective date, and it permits DHS to exempt an individual, a company or an industry on ' +
    'national-interest grounds. On its own terms the restriction expires, absent extension, twelve months after ' +
    'the effective date. No subsequent presidential document extending, amending or revoking it was found in the ' +
    'Federal Register as at 2026-07-26, and its litigation status could not be established from the Federal ' +
    'Register at all. Meridian encodes it as information and never as a blocking criterion. NO URL BY DESIGN: ' +
    'the citation and dates come from the Federal Register API; the document page refused automated access.',
};

// ---------------------------------------------------------------------------
// H-1B — specialty occupation
// ---------------------------------------------------------------------------

/**
 * The three routes by which a beneficiary can qualify for a specialty
 * occupation, as 8 CFR 214.2(h)(4)(iii)(C) sets them out.
 *
 * The twelve-year figure is not invented and it is not a rule of thumb: the
 * regulation itself provides that three years of specialized training or work
 * experience must be demonstrated for each year of college-level training the
 * alien lacks, and a person with no degree at all lacks four. It is encoded as
 * an alternative rather than as a finding, and every branch escalates, because
 * the equivalence has to be determined by one of the five methods the
 * regulation lists — not by this arithmetic.
 */
const h1bBeneficiaryQualification: EvaluatorSpec = {
  op: 'any_of',
  of: [
    { op: 'ordinal_at_least', path: 'educationLevel', scale: EDUCATION_SCALE, value: 'bachelor' },
    {
      op: 'collection_any',
      path: 'professionalCredentials',
      where: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'kind', value: 'licence' },
          { op: 'equals', path: 'issuingCountry', value: 'US' },
        ],
      },
    },
    { op: 'gte', path: 'professionalExperienceYears', value: 12 },
  ],
};

export const usH1bSpecialtyOccupation: Pathway = {
  id: 'us-h1b-specialty-occupation',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'H-1B — specialty occupation',
    es: 'H-1B — ocupación especializada',
  },
  summary: {
    en:
      'Temporary employment in an occupation that requires a bachelor’s or higher degree in a directly related ' +
      'specific specialty as a minimum for entry. The employer petitions; the applicant cannot self-petition. ' +
      'Most petitions are subject to an annual cap reached through an electronic registration and a selection ' +
      'that is now weighted by wage level rather than uniform. Total stay is limited to six years, and the ' +
      'classification permits dual intent.',
    es:
      'Empleo temporal en una ocupación que exige, como mínimo de acceso, una licenciatura o grado superior en ' +
      'una especialidad directamente relacionada. La petición la presenta el empleador; la persona interesada no ' +
      'puede autopeticionarse. La mayoría de las peticiones están sujetas a un cupo anual al que se accede por ' +
      'registro electrónico y una selección que ya no es uniforme, sino ponderada por nivel salarial. La estancia ' +
      'total se limita a seis años y la clasificación admite doble intención.',
  },
  citations: [
    inaSpecialtyOccupation,
    inaH1bCap,
    inaH1bCapExemptions,
    inaH1bSixYearMaximum,
    inaDualIntent,
    cfrH1bFiling,
    cfrH1bDefinitions,
    cfrH1bCriteria,
    cfrH1bRegistrationAndSelection,
    cfrH1bValidityAndStay,
    frWeightedSelection,
    proclamationH1bEntryRestriction,
    inaPresumptionOfImmigrantStatus,
  ],
  criteria: [
    {
      id: 'us-h1b-employer-petition',
      kind: 'employment',
      weight: 'blocking',
      citationIds: [
        'us-8-cfr-214-2-h-2-i-a',
        'us-8-cfr-214-2-h-4-ii',
        'us-proclamation-90-46027-h1b-entry',
      ],
      label: {
        en: 'A United States employer with a bona fide job offer files the petition',
        es: 'Un empleador de Estados Unidos con oferta de empleo real presenta la petición',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'US' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
        ],
      },
      guidance: {
        en:
          'There is no self-petition route to H-1B: an employer files, and it must have a legal presence in the ' +
          'United States, be amenable to service of process there, and hold an IRS tax identification number. A ' +
          'beneficiary who owns more than half of the petitioner is not excluded, but specialty-occupation duties ' +
          'must occupy the majority of the beneficiary’s time. The petition must carry a labor condition ' +
          'application certified by the Department of Labor, which is a separate filing with a separate agency. ' +
          'Separately, a presidential proclamation in force since 21 September 2025 restricts the entry from ' +
          'abroad of H-1B specialty-occupation beneficiaries unless the petition is accompanied by a payment of ' +
          '$100,000, expiring on its own terms twelve months after that date absent extension, with a power in ' +
          'DHS to exempt an individual, company or industry. Its current operative status and any judicial ' +
          'treatment must be checked before anyone relies on it either way.',
        es:
          'No existe autopetición en H-1B: la presenta un empleador, que debe tener presencia legal en Estados ' +
          'Unidos, ser susceptible de emplazamiento allí y contar con número de identificación fiscal del IRS. La ' +
          'persona beneficiaria que posea más de la mitad del peticionario no queda excluida, pero las funciones ' +
          'propias de la ocupación especializada deben ocupar la mayor parte de su tiempo. La petición debe ir ' +
          'acompañada de una labor condition application certificada por el Departamento del Trabajo, que es un ' +
          'trámite distinto ante otro organismo. Además, una proclama presidencial vigente desde el 21 de ' +
          'septiembre de 2025 restringe la entrada desde el extranjero de beneficiarios H-1B salvo que la ' +
          'petición se acompañe de un pago de 100.000 dólares; expira por sus propios términos doce meses después ' +
          'de esa fecha, salvo prórroga, y DHS puede eximir a una persona, empresa o sector. Su vigencia actual y ' +
          'su tratamiento judicial deben comprobarse antes de basarse en ella en un sentido u otro.',
      },
    },
    {
      id: 'us-h1b-specialty-occupation',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['us-ina-214-i-1', 'us-8-cfr-214-2-h-4-ii', 'us-8-cfr-214-2-h-4-iii'],
      label: {
        en: 'The position is a specialty occupation and the beneficiary is qualified for it',
        es: 'El puesto es una ocupación especializada y la persona beneficiaria está cualificada para él',
      },
      // The evaluator tests the half that is testable — the beneficiary's own
      // qualification — so a definite failure still reads as a failure: no
      // degree, no United States licence and fewer than twelve years of
      // experience is an unmet criterion, not an escalation. Everything else
      // escalates, because the other half is not testable at all. Whether the
      // *position* requires a directly related degree as a minimum for entry is
      // a judgement about an occupation and an employer's practice, and whether
      // a foreign degree or a body of experience is *equivalent* to a United
      // States degree is a determination the regulation assigns to named
      // methods, none of which is arithmetic on a recorded education level.
      evaluator: h1bBeneficiaryQualification,
      humanReviewWhen: h1bBeneficiaryQualification,
      humanReviewReason: {
        en:
          'The beneficiary appears to hold a qualifying credential, so what remains is the part Meridian cannot ' +
          'decide. Two determinations are outstanding. First, whether the position itself is a specialty ' +
          'occupation: the degree must be in a directly related specific specialty and must satisfy at least one ' +
          'of the four regulatory criteria, and a general degree without further specialisation is expressly not ' +
          'enough. Second, whether this particular credential answers it: a foreign degree needs an equivalency ' +
          'determination, a State licence must be unrestricted and authorise immediate full practice in the state ' +
          'of intended employment, and an experience-based equivalence must be established by one of the five ' +
          'methods the regulation lists rather than by counting years.',
        es:
          'La persona beneficiaria parece contar con una credencial computable, de modo que queda pendiente ' +
          'justamente lo que Meridian no puede decidir. Faltan dos determinaciones. Primera, si el puesto es en sí ' +
          'una ocupación especializada: el título debe corresponder a una especialidad concreta directamente ' +
          'relacionada y cumplir al menos uno de los cuatro criterios reglamentarios, y un título genérico sin ' +
          'especialización adicional expresamente no basta. Segunda, si esa credencial concreta lo satisface: un ' +
          'título extranjero requiere una determinación de equivalencia, una licencia estatal debe ser ' +
          'irrestricta y habilitar el ejercicio pleno e inmediato en el estado donde se va a trabajar, y la ' +
          'equivalencia por experiencia debe acreditarse por uno de los cinco métodos que enumera el reglamento, ' +
          'no contando años.',
      },
      guidance: {
        en:
          'The twelve years in this rule are not a threshold anyone published as such: the regulation provides ' +
          'that three years of specialized training or work experience are needed for each year of college-level ' +
          'training the beneficiary lacks, and someone with no degree lacks four. Reaching that figure does not ' +
          'establish the equivalence — it only means the experience route is worth putting to the determination ' +
          'the regulation requires.',
        es:
          'Los doce años de esta regla no son un umbral publicado como tal: el reglamento exige tres años de ' +
          'formación especializada o experiencia laboral por cada año de estudios superiores que falte, y quien ' +
          'no tiene título alguno carece de cuatro. Alcanzar esa cifra no acredita la equivalencia: solo indica ' +
          'que la vía de la experiencia merece someterse a la determinación que el reglamento exige.',
      },
    },
    {
      id: 'us-h1b-cap-and-selection',
      kind: 'procedural',
      weight: 'informational',
      citationIds: [
        'us-ina-214-g-1-a',
        'us-ina-214-g-5',
        'us-8-cfr-214-2-h-8-iii',
        'us-fr-90-60864-h1b-weighted-selection',
      ],
      label: {
        en: 'Advanced-degree exemption: a master’s or higher degree earned at a United States institution',
        es: 'Exención por titulación avanzada: máster o título superior obtenido en una institución de Estados Unidos',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'ordinal_at_least', path: 'educationLevel', scale: EDUCATION_SCALE, value: 'master' },
          { op: 'equals', path: 'educationCountry', value: 'US' },
        ],
      },
      guidance: {
        en:
          'The regular cap is 65,000 a year, with a further 20,000 reserved for beneficiaries holding a master’s ' +
          'or higher degree from a United States institution of higher education. A foreign master’s does not ' +
          'qualify for that reservation. Employment at an institution of higher education, a related or ' +
          'affiliated nonprofit, or a nonprofit or governmental research organisation is exempt from the cap ' +
          'altogether. Where the cap applies, the employer registers the beneficiary electronically and may file ' +
          'only if the registration is selected. Selection is no longer a flat lottery: each unique beneficiary is ' +
          'assigned the lowest OEWS wage level among the registrations filed for them and enters the pool once at ' +
          'level I, twice at level II, three times at level III and four times at level IV. Meridian states no ' +
          'chance of selection, in any form: that would be a prediction of outcome, and nobody here is licensed ' +
          'to make one. Registering through several employers does not improve the odds, because the pool counts ' +
          'unique beneficiaries.',
        es:
          'El cupo ordinario es de 65.000 al año, con otras 20.000 plazas reservadas a quienes posean un máster o ' +
          'título superior de una institución de educación superior de Estados Unidos. Un máster extranjero no da ' +
          'acceso a esa reserva. El empleo en una institución de educación superior, en una entidad sin fines de ' +
          'lucro vinculada o afiliada, o en una organización de investigación sin fines de lucro o gubernamental ' +
          'queda exento del cupo por completo. Cuando el cupo se aplica, el empleador registra electrónicamente a ' +
          'la persona beneficiaria y solo puede presentar la petición si el registro resulta seleccionado. La ' +
          'selección ya no es un sorteo uniforme: a cada persona se le asigna el nivel salarial OEWS más bajo ' +
          'entre los registros presentados a su nombre y entra en el sorteo una vez en el nivel I, dos en el II, ' +
          'tres en el III y cuatro en el IV. Meridian no expresa probabilidad alguna de selección: sería predecir ' +
          'un resultado, y aquí nadie está habilitado para hacerlo. Registrarse a través de varios empleadores no ' +
          'mejora las probabilidades, porque el sorteo cuenta personas beneficiarias únicas.',
      },
    },
    {
      id: 'us-h1b-dual-intent',
      kind: 'intent',
      weight: 'informational',
      citationIds: ['us-ina-214-h', 'us-ina-214-b'],
      label: {
        en: 'A permanent-residence intention does not defeat H-1B classification',
        es: 'La intención de residir permanentemente no impide la clasificación H-1B',
      },
      // Reads `intent.temporary` as recorded false — that is, the applicant has
      // said they do not assert a temporary stay. On most classifications in
      // this file that is fatal. Here it is the point: the criterion exists to
      // tell a reader that on this route it is not.
      evaluator: { op: 'is_false', path: 'intent.temporary' },
      guidance: {
        en:
          'H-1B is one of the classifications section 214(h) protects: being the beneficiary of an immigrant ' +
          'petition, or having otherwise sought permanent residence, is not evidence of an intention to abandon a ' +
          'foreign residence. The protection is exhaustive and does not extend to TN, O, E, F or B. Note what it ' +
          'does not do: it does not dispense with maintaining H-1B status, and it does not make the six-year ' +
          'maximum negotiable.',
        es:
          'La H-1B es una de las clasificaciones que protege el artículo 214(h): ser beneficiario de una petición ' +
          'de inmigrante, o haber solicitado por otra vía la residencia permanente, no prueba la intención de ' +
          'abandonar la residencia en el extranjero. La protección es taxativa y no alcanza a TN, O, E, F ni B. ' +
          'Conviene ver lo que no hace: no exime de mantener el estatus H-1B ni convierte en negociable el máximo ' +
          'de seis años.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    renewalMonths: 36,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-2-h-9-h-13-h-15', 'us-ina-214-g-4'],
    note: {
      en:
        'An approved petition is valid for up to three years and may not outlast the labor condition ' +
        'application, so a shorter certified application shortens the grant. Extensions run up to three years at ' +
        'a time, and the total period of authorized admission may not exceed six years. After six years under ' +
        'section 101(a)(15)(H) and/or (L), a further grant requires a year spent residing and physically present ' +
        'outside the United States, brief trips apart. Days spent outside the United States exceeding 24 hours ' +
        'during the validity of an approved petition are not counted toward the six years, so the ceiling is ' +
        'measured in time actually spent inside the country rather than in elapsed calendar time.',
      es:
        'La petición aprobada es válida hasta tres años y no puede exceder la vigencia de la labor condition ' +
        'application, de modo que una certificación más corta acorta la concesión. Las prórrogas se conceden por ' +
        'periodos de hasta tres años y el periodo total de admisión autorizada no puede exceder de seis años. ' +
        'Transcurridos seis años bajo el artículo 101(a)(15)(H) o (L), una nueva concesión exige haber residido y ' +
        'estado físicamente fuera de Estados Unidos durante un año, salvo viajes breves. Los días pasados fuera ' +
        'de Estados Unidos que excedan de 24 horas durante la vigencia de una petición aprobada no computan para ' +
        'los seis años, de modo que el techo se mide por el tiempo efectivamente pasado dentro del país y no por ' +
        'el tiempo transcurrido en el calendario.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Citations — L-1
// ---------------------------------------------------------------------------

const inaIntracompanyTransferee = {
  id: 'us-ina-101-a-15-l',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1101(a)(15)(L) (INA § 101(a)(15)(L))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien who, within 3 years preceding the time of application for admission, has been employed continuously ' +
    'for one year by a firm or corporation or other legal entity or an affiliate or subsidiary thereof, and who ' +
    'seeks to enter temporarily in order to continue to render services to the same employer or a subsidiary or ' +
    'affiliate in a capacity that is managerial, executive, or involves specialized knowledge. Three separate ' +
    'requirements sit in that sentence: a year of continuous employment, inside a three-year window, with an ' +
    'entity related to the United States employer in one of the listed ways.',
};

const cfrL1Definitions = {
  id: 'us-8-cfr-214-2-l-1-ii',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(l)(1)(ii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Managerial capacity means an assignment in which the employee primarily manages the organisation or a ' +
    'department, subdivision, function or component; supervises and controls the work of other supervisory, ' +
    'professional or managerial employees, or manages an essential function; has authority to hire and fire or ' +
    'recommend those and other personnel actions if others are directly supervised, or, if nobody is directly ' +
    'supervised, functions at a senior level within the hierarchy or with respect to the function managed; and ' +
    'exercises discretion over day-to-day operations. A first-line supervisor is not managerial merely by virtue ' +
    'of supervising, unless those supervised are professional. Executive capacity means an assignment in which ' +
    'the employee primarily directs the management of the organisation or a major component or function, ' +
    'establishes goals and policies, exercises wide latitude in discretionary decision-making, and receives only ' +
    'general supervision. Specialized knowledge means special knowledge of the petitioning organisation’s ' +
    'product, service, research, equipment, techniques, management or other interests and its application in ' +
    'international markets, or an advanced level of knowledge or expertise in the organisation’s processes and ' +
    'procedures. New office means an organisation that has been doing business in the United States through a ' +
    'parent, branch, affiliate or subsidiary for less than one year. Each definition describes the character of ' +
    'a job, which is why every one of them is an adjudicator’s characterisation rather than a measurement.',
};

const cfrL1NewOfficeEvidence = {
  id: 'us-8-cfr-214-2-l-3-v-vi',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(l)(3)(v) and (vi)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Where the beneficiary is coming as a manager or executive to open or be employed in a new office, the ' +
    'petitioner must show that sufficient physical premises to house it have been secured, that the beneficiary ' +
    'has been employed for one continuous year in the three-year period preceding the filing in an executive or ' +
    'managerial capacity and that the proposed employment involves executive or managerial authority, and must ' +
    'give evidence about the intended structure and financing. Where the beneficiary is coming in a specialized ' +
    'knowledge capacity to a new office, the petitioner must show secured premises, that the United States entity ' +
    'is or will be a qualifying organisation, and that it has the financial ability to remunerate the beneficiary ' +
    'and to commence doing business.',
};

const cfrL1Validity = {
  id: 'us-8-cfr-214-2-l-7-i-a',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(l)(7)(i)(A)(2) and (3)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An approved individual petition is valid for the period of established need for the beneficiary’s services, ' +
    'not to exceed three years, except where the beneficiary is coming to open or be employed in a new office. ' +
    'In the new-office case the petition may be approved for a period not to exceed one year, after which the ' +
    'petitioner must show that it is doing business in order to extend.',
};

const cfrL1Limits = {
  id: 'us-8-cfr-214-2-l-12-l-15',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(l)(12)(i) and (l)(15)(ii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien who has spent five years in the United States in a specialized knowledge capacity, or seven years ' +
    'in a managerial or executive capacity, under section 101(a)(15)(L) and/or (H), may not be readmitted under ' +
    'either section unless the alien has resided and been physically present outside the United States, except ' +
    'for brief trips, for the immediate prior year. Extensions of stay may be authorised in increments of up to ' +
    'two years; the total period of stay may not exceed five years for specialized knowledge and seven for ' +
    'managerial or executive capacity, and no further extensions may be granted. Time spent in H counts toward ' +
    'the same ceilings. A person promoted from specialized knowledge to a managerial or executive position must ' +
    'have held it for at least six months, under an approved amended, new or extended petition, to reach the ' +
    'seven-year ceiling.',
};

const cfrL1DualIntent = {
  id: 'us-8-cfr-214-2-l-16',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(l)(16)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien may legitimately come to the United States for a temporary period as an L-1 nonimmigrant and, at ' +
    'the same time, lawfully seek to become a permanent resident, provided he or she intends to depart ' +
    'voluntarily at the end of the authorised stay. Filing or approval of a permanent labor certification, an ' +
    'immigrant visa preference petition, or an adjustment application is not a basis for denying an L-1 petition, ' +
    'an extension, admission, or a change or extension of status.',
};

// ---------------------------------------------------------------------------
// L-1 — intracompany transferees
// ---------------------------------------------------------------------------

/**
 * Recorded employment outside the United States, with a period attached.
 *
 * This is a necessary condition and nothing more. The statute needs one
 * *continuous* year, inside the three years preceding the application, with an
 * entity standing in one of the qualifying relationships to the United States
 * employer. `WorkExperience` carries a country and a period but nothing that
 * identifies the employer, so the relationship cannot be tested at all, and a
 * one-year continuous run inside a moving three-year window is not among the
 * derived figures this package computes. So the spec reports the one thing it
 * can — that no non-United States employment is recorded — and everything else
 * goes to a person.
 */
const employmentOutsideTheUnitedStates: EvaluatorSpec = {
  op: 'collection_any',
  path: 'workExperience',
  where: {
    op: 'all_of',
    of: [
      { op: 'is_present', path: 'period' },
      { op: 'not', of: { op: 'equals', path: 'country', value: 'US' } },
    ],
  },
};

/** A signed offer from an employer in the United States. */
const usEmployerWrittenOffer: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'equals', path: 'jobOffer.employerCountry', value: 'US' },
    { op: 'is_true', path: 'jobOffer.writtenOffer' },
  ],
};

export const usL1aManagerOrExecutive: Pathway = {
  id: 'us-l1a-intracompany-manager-executive',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'L-1A — intracompany transferee, manager or executive',
    es: 'L-1A — transferencia dentro de la empresa, personal directivo o ejecutivo',
  },
  summary: {
    en:
      'Temporary transfer to the United States for someone employed for one continuous year in the preceding ' +
      'three by a related company abroad, coming to serve the same employer, or a parent, branch, subsidiary or ' +
      'affiliate, in a managerial or executive capacity. Total stay is limited to seven years. A transfer to open ' +
      'a new office is approved for one year at a time to begin with.',
    es:
      'Traslado temporal a Estados Unidos de quien ha trabajado un año continuo dentro de los tres anteriores ' +
      'para una empresa vinculada en el extranjero y viene a prestar servicios al mismo empleador, o a una ' +
      'matriz, sucursal, filial o afiliada, en funciones directivas o ejecutivas. La estancia total se limita a ' +
      'siete años. El traslado para abrir una oficina nueva se aprueba inicialmente por un año cada vez.',
  },
  citations: [
    inaIntracompanyTransferee,
    inaPresumptionOfImmigrantStatus,
    inaDualIntent,
    cfrL1Definitions,
    cfrL1NewOfficeEvidence,
    cfrL1Validity,
    cfrL1Limits,
    cfrL1DualIntent,
  ],
  criteria: [
    {
      id: 'us-l1a-qualifying-employment-abroad',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-ina-101-a-15-l', 'us-8-cfr-214-2-l-1-ii'],
      label: {
        en: 'One continuous year of employment abroad with a qualifying related entity, within the preceding three years',
        es: 'Un año continuo de empleo en el extranjero con una entidad vinculada computable, dentro de los tres años anteriores',
      },
      evaluator: employmentOutsideTheUnitedStates,
      humanReviewWhen: employmentOutsideTheUnitedStates,
      humanReviewReason: {
        en:
          'Employment outside the United States is recorded, which is the only part of this requirement Meridian ' +
          'can see. Three things remain, and each decides the case on its own: whether the year was continuous, ' +
          'whether it falls inside the three years preceding the application, and whether the foreign employer ' +
          'stands to the United States petitioner in one of the qualifying relationships — parent, branch, ' +
          'subsidiary or affiliate. Meridian records no employer identity, so the relationship cannot be checked ' +
          'here at all.',
        es:
          'Consta empleo fuera de Estados Unidos, que es la única parte de este requisito que Meridian puede ver. ' +
          'Quedan tres cuestiones, y cada una decide el caso por sí sola: si el año fue continuo, si cae dentro ' +
          'de los tres años anteriores a la solicitud y si el empleador extranjero mantiene con el peticionario ' +
          'estadounidense una de las relaciones computables —matriz, sucursal, filial o afiliada—. Meridian no ' +
          'registra la identidad del empleador, de modo que aquí la relación no puede comprobarse en absoluto.',
      },
      guidance: {
        en:
          'Time spent working for the same group inside the United States does not count toward the qualifying ' +
          'year, and periods of employment with unrelated companies never do. Where the group has been doing ' +
          'business in the United States for less than a year the transfer is a new-office case, which carries ' +
          'its own evidence requirements and a one-year first grant.',
        es:
          'El tiempo trabajado para el mismo grupo dentro de Estados Unidos no computa para el año exigido, y los ' +
          'periodos con empresas no vinculadas no computan nunca. Si el grupo lleva menos de un año operando en ' +
          'Estados Unidos, el traslado es un supuesto de oficina nueva, con sus propios requisitos probatorios y ' +
          'una primera concesión de un año.',
      },
    },
    {
      id: 'us-l1a-managerial-or-executive-capacity',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-2-l-1-ii', 'us-ina-101-a-15-l'],
      label: {
        en: 'The United States position is in a managerial or executive capacity',
        es: 'El puesto en Estados Unidos corresponde a funciones directivas o ejecutivas',
      },
      evaluator: usEmployerWrittenOffer,
      humanReviewWhen: usEmployerWrittenOffer,
      humanReviewReason: {
        en:
          'An offer from a United States employer is recorded, and whether the job is managerial or executive is ' +
          'the question. The regulation answers it by describing what the employee primarily does — manages an ' +
          'organisation, department or essential function; supervises professional or managerial staff or ' +
          'functions at a senior level; exercises discretion over day-to-day operations; directs management, sets ' +
          'goals and policies and receives only general supervision. Those are characterisations of a real job ' +
          'from its duties and its place in a hierarchy, and no job title settles them. A person must read the ' +
          'position description against the definitions.',
        es:
          'Consta una oferta de un empleador estadounidense, y la cuestión es si el puesto es directivo o ' +
          'ejecutivo. El reglamento lo resuelve describiendo lo que la persona hace principalmente: dirigir la ' +
          'organización, un departamento o una función esencial; supervisar a personal profesional o directivo, o ' +
          'situarse en un nivel superior de la jerarquía; ejercer discrecionalidad sobre las operaciones ' +
          'cotidianas; dirigir la gestión, fijar objetivos y políticas y recibir solo supervisión general. Son ' +
          'caracterizaciones de un puesto real a partir de sus funciones y de su lugar en la jerarquía, y ningún ' +
          'título de puesto las resuelve. Una persona debe cotejar la descripción del puesto con las ' +
          'definiciones.',
      },
      guidance: {
        en:
          'A first-line supervisor is not treated as managerial merely because they supervise, unless the ' +
          'employees supervised are themselves professional. Managing an essential function rather than people is ' +
          'expressly available, but it carries the requirement of functioning at a senior level with respect to ' +
          'the function managed.',
        es:
          'A quien supervisa en primera línea no se le considera directivo por el solo hecho de supervisar, salvo ' +
          'que las personas supervisadas sean a su vez profesionales. Dirigir una función esencial en lugar de a ' +
          'personas está expresamente admitido, pero exige situarse en un nivel superior respecto de la función ' +
          'dirigida.',
      },
    },
    {
      id: 'us-l1a-dual-intent',
      kind: 'intent',
      weight: 'informational',
      citationIds: ['us-8-cfr-214-2-l-16', 'us-ina-214-h', 'us-ina-214-b'],
      label: {
        en: 'A permanent-residence intention does not defeat L-1 classification',
        es: 'La intención de residir permanentemente no impide la clasificación L-1',
      },
      evaluator: { op: 'is_false', path: 'intent.temporary' },
      guidance: {
        en:
          'L is the one classification the section 214(b) immigrant presumption does not reach at all, and the ' +
          'regulation says in terms that a person may come temporarily as an L-1 and lawfully seek permanent ' +
          'residence at the same time, provided they intend to depart voluntarily at the end of the authorised ' +
          'stay. Filing or approving a labor certification, a preference petition or an adjustment application is ' +
          'not a ground for refusing the petition, an extension or admission.',
        es:
          'La L es la única clasificación a la que no alcanza en absoluto la presunción de inmigrante del ' +
          'artículo 214(b), y el reglamento dice expresamente que una persona puede venir temporalmente como L-1 ' +
          'y solicitar lícitamente al mismo tiempo la residencia permanente, siempre que tenga intención de salir ' +
          'voluntariamente al término de la estancia autorizada. Presentar o aprobar una certificación laboral, ' +
          'una petición de preferencia o una solicitud de ajuste no es motivo para denegar la petición, la ' +
          'prórroga ni la admisión.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    renewalMonths: 24,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-2-l-7-i-a', 'us-8-cfr-214-2-l-12-l-15', 'us-8-cfr-214-2-l-3-v-vi'],
    note: {
      en:
        'The first petition is approved for the period of established need, not exceeding three years — but only ' +
        'one year where the beneficiary is coming to open or be employed in a new office, after which the ' +
        'petitioner must show it is doing business to extend. Extensions run in increments of up to two years and ' +
        'the total may not exceed seven years, with no further extensions after that. Time spent in H ' +
        'classification counts toward the same seven years, which is the trap for someone who held H-1B before ' +
        'transferring.',
      es:
        'La primera petición se aprueba por el periodo de necesidad acreditada, sin exceder de tres años, pero ' +
        'solo por un año cuando la persona viene a abrir una oficina nueva o a trabajar en ella, tras lo cual el ' +
        'peticionario debe acreditar que está operando para poder prorrogar. Las prórrogas se conceden por ' +
        'periodos de hasta dos años y el total no puede exceder de siete años, sin más prórrogas después. El ' +
        'tiempo en clasificación H computa dentro de esos mismos siete años, que es la trampa para quien tuvo ' +
        'una H-1B antes del traslado.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const usL1bSpecializedKnowledge: Pathway = {
  id: 'us-l1b-specialized-knowledge',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'L-1B — intracompany transferee, specialized knowledge',
    es: 'L-1B — transferencia dentro de la empresa, conocimiento especializado',
  },
  summary: {
    en:
      'Temporary transfer to the United States for someone employed for one continuous year in the preceding ' +
      'three by a related company abroad, coming to serve the same employer, or a parent, branch, subsidiary or ' +
      'affiliate, in a capacity involving specialized knowledge of the organisation’s products, services or ' +
      'processes. Total stay is limited to five years — two years shorter than the managerial route.',
    es:
      'Traslado temporal a Estados Unidos de quien ha trabajado un año continuo dentro de los tres anteriores ' +
      'para una empresa vinculada en el extranjero y viene a prestar servicios al mismo empleador, o a una ' +
      'matriz, sucursal, filial o afiliada, en un puesto que exige conocimiento especializado de los productos, ' +
      'servicios o procesos de la organización. La estancia total se limita a cinco años, dos menos que en la vía ' +
      'directiva.',
  },
  citations: [
    inaIntracompanyTransferee,
    inaPresumptionOfImmigrantStatus,
    inaDualIntent,
    cfrL1Definitions,
    cfrL1NewOfficeEvidence,
    cfrL1Validity,
    cfrL1Limits,
    cfrL1DualIntent,
  ],
  criteria: [
    {
      id: 'us-l1b-qualifying-employment-abroad',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-ina-101-a-15-l', 'us-8-cfr-214-2-l-1-ii'],
      label: {
        en: 'One continuous year of employment abroad with a qualifying related entity, within the preceding three years',
        es: 'Un año continuo de empleo en el extranjero con una entidad vinculada computable, dentro de los tres años anteriores',
      },
      evaluator: employmentOutsideTheUnitedStates,
      humanReviewWhen: employmentOutsideTheUnitedStates,
      humanReviewReason: {
        en:
          'Employment outside the United States is recorded, which is the only part of this requirement Meridian ' +
          'can see. Whether the year was continuous, whether it falls inside the three years preceding the ' +
          'application, and whether the foreign employer is a parent, branch, subsidiary or affiliate of the ' +
          'United States petitioner all remain to be checked, and Meridian records no employer identity.',
        es:
          'Consta empleo fuera de Estados Unidos, que es la única parte de este requisito que Meridian puede ver. ' +
          'Queda por comprobar si el año fue continuo, si cae dentro de los tres años anteriores a la solicitud y ' +
          'si el empleador extranjero es matriz, sucursal, filial o afiliada del peticionario estadounidense; ' +
          'Meridian no registra la identidad del empleador.',
      },
      guidance: {
        en:
          'The qualifying year is the same for L-1A and L-1B. What differs is the capacity in which the person ' +
          'worked abroad and will work in the United States, and the ceiling on total stay that follows from it.',
        es:
          'El año exigido es el mismo para L-1A y L-1B. Lo que cambia es la capacidad en la que se trabajó en el ' +
          'extranjero y se va a trabajar en Estados Unidos, y el techo de estancia total que de ella se deriva.',
      },
    },
    {
      id: 'us-l1b-specialized-knowledge-capacity',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-2-l-1-ii', 'us-ina-101-a-15-l'],
      label: {
        en: 'The United States position involves specialized knowledge of the organisation',
        es: 'El puesto en Estados Unidos exige conocimiento especializado de la organización',
      },
      evaluator: usEmployerWrittenOffer,
      humanReviewWhen: usEmployerWrittenOffer,
      humanReviewReason: {
        en:
          'An offer from a United States employer is recorded, and whether the knowledge is "specialized" within ' +
          'the regulation is the question. The definition is knowledge of the petitioning organisation’s own ' +
          'product, service, research, equipment, techniques, management or other interests and their application ' +
          'in international markets, or an advanced level of knowledge of the organisation’s own processes and ' +
          'procedures. It is knowledge of this company, not skill in a field, and the distinction is the whole ' +
          'adjudication. A person must read the position description and the account of what the beneficiary ' +
          'knows against that definition.',
        es:
          'Consta una oferta de un empleador estadounidense, y la cuestión es si el conocimiento es ' +
          '«especializado» en el sentido del reglamento. La definición es el conocimiento de los productos, ' +
          'servicios, investigación, equipos, técnicas, gestión u otros intereses de la propia organización ' +
          'peticionaria y de su aplicación en mercados internacionales, o un nivel avanzado de conocimiento de ' +
          'sus procesos y procedimientos internos. Es conocimiento de esta empresa, no pericia en un campo, y esa ' +
          'distinción es toda la adjudicación. Una persona debe cotejar la descripción del puesto y lo que la ' +
          'persona beneficiaria efectivamente conoce con esa definición.',
      },
      guidance: {
        en:
          'A specialized knowledge professional is separately defined as someone who has specialized knowledge ' +
          'and is a member of the professions, which matters for blanket petitions rather than for the ' +
          'individual test here.',
        es:
          'El «profesional con conocimiento especializado» se define aparte como quien posee ese conocimiento y ' +
          'es miembro de las profesiones, lo que importa para las peticiones generales (blanket) más que para el ' +
          'examen individual que aquí se aplica.',
      },
    },
    {
      id: 'us-l1b-dual-intent',
      kind: 'intent',
      weight: 'informational',
      citationIds: ['us-8-cfr-214-2-l-16', 'us-ina-214-h', 'us-ina-214-b'],
      label: {
        en: 'A permanent-residence intention does not defeat L-1 classification',
        es: 'La intención de residir permanentemente no impide la clasificación L-1',
      },
      evaluator: { op: 'is_false', path: 'intent.temporary' },
      guidance: {
        en:
          'The same dual-intent protection applies as on L-1A. The practical difference is the ceiling: five ' +
          'years rather than seven, which leaves materially less room for an employment-based immigrant process ' +
          'to run its course while the person remains in status.',
        es:
          'Rige la misma protección de doble intención que en la L-1A. La diferencia práctica es el techo: cinco ' +
          'años en lugar de siete, lo que deja bastante menos margen para que un proceso migratorio por empleo ' +
          'concluya mientras la persona mantiene el estatus.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    renewalMonths: 24,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-2-l-7-i-a', 'us-8-cfr-214-2-l-12-l-15', 'us-8-cfr-214-2-l-3-v-vi'],
    note: {
      en:
        'The first petition is approved for the period of established need, not exceeding three years, or one ' +
        'year in a new-office case. Extensions run in increments of up to two years and the total may not exceed ' +
        'five years, with no further extensions after that. Time in H classification counts toward the same five ' +
        'years. Someone promoted from specialized knowledge into a managerial or executive position must have ' +
        'held it for at least six months, under an approved amended, new or extended petition, before the ' +
        'seven-year ceiling becomes available.',
      es:
        'La primera petición se aprueba por el periodo de necesidad acreditada, sin exceder de tres años, o de un ' +
        'año en los supuestos de oficina nueva. Las prórrogas se conceden por periodos de hasta dos años y el ' +
        'total no puede exceder de cinco años, sin más prórrogas después. El tiempo en clasificación H computa ' +
        'dentro de esos mismos cinco años. Quien ascienda del conocimiento especializado a un puesto directivo o ' +
        'ejecutivo debe haberlo ocupado al menos seis meses, al amparo de una petición modificada, nueva o ' +
        'prorrogada y aprobada, antes de poder acogerse al techo de siete años.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Citations — O-1
// ---------------------------------------------------------------------------

const inaExtraordinaryAbility = {
  id: 'us-ina-101-a-15-o-i',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1101(a)(15)(O)(i) (INA § 101(a)(15)(O)(i))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'An alien who has extraordinary ability in the sciences, arts, education, business, or athletics which has ' +
    'been demonstrated by sustained national or international acclaim or, with regard to motion picture and ' +
    'television productions, a demonstrated record of extraordinary achievement, and whose achievements have been ' +
    'recognized in the field through extensive documentation, and seeks to enter the United States to continue ' +
    'work in the area of extraordinary ability. Note that the statutory phrase overlaps with the EB-1A immigrant ' +
    'category but the tests applied are different; the two must not be cross-cited.',
};

const cfrO1Definitions = {
  id: 'us-8-cfr-214-2-o-3-ii',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(o)(3)(ii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'THREE DIFFERENT STANDARDS LIVE IN ONE CLASSIFICATION. Extraordinary ability in the field of science, ' +
    'education, business, or athletics means a level of expertise indicating that the person is one of the small ' +
    'percentage who have arisen to the very top of the field of endeavor. Extraordinary ability in the field of ' +
    'arts means distinction — a high level of achievement evidenced by a degree of skill and recognition ' +
    'substantially above that ordinarily encountered, to the extent that the person is renowned, leading or ' +
    'well-known in the field. Extraordinary achievement with respect to motion picture and television ' +
    'productions means a very high level of accomplishment, recognised as outstanding, notable or leading. This ' +
    'record encodes the first standard only.',
};

const cfrO1EvidentiaryCriteria = {
  id: 'us-8-cfr-214-2-o-3-iii',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(o)(3)(iii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'An alien of extraordinary ability in the sciences, education, business or athletics must demonstrate ' +
    'sustained national or international acclaim by evidence of receipt of a major, internationally recognised ' +
    'award such as the Nobel Prize; or by at least three of eight forms of documentation: nationally or ' +
    'internationally recognised prizes or awards for excellence; membership of associations requiring ' +
    'outstanding achievement as judged by recognised experts; published material in professional or major trade ' +
    'publications or major media about the alien and their work; participation as a judge of the work of others ' +
    'in the field or an allied field; original scientific, scholarly or business-related contributions of major ' +
    'significance; authorship of scholarly articles in professional journals or other major media; employment in ' +
    'a critical or essential capacity for organisations with a distinguished reputation; and a high salary or ' +
    'other remuneration, commanded or to be commanded, evidenced by contracts or other reliable evidence. Where ' +
    'the criteria do not readily apply to the occupation, comparable evidence may be submitted. Meeting three is ' +
    'the threshold for consideration, not a guarantee of the finding.',
};

const cfrO1PermanentResidence = {
  id: 'us-8-cfr-214-2-o-13',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(o)(13)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The approval of a permanent labor certification or the filing of a preference petition shall not be a basis ' +
    'for denying an O-1 petition, a request to extend it, or the alien’s application for admission, change of ' +
    'status or extension of stay. The alien may legitimately come for a temporary period as an O-1, depart ' +
    'voluntarily at the end of the authorised stay, and at the same time lawfully seek to become a permanent ' +
    'resident.',
};

const cfrO1Validity = {
  id: 'us-8-cfr-214-2-o-6-o-12',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(o)(6)(iii)(A) and (o)(12)(ii)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An approved O-1 petition is valid for the period of time determined to be necessary to accomplish the event ' +
    'or activity, not to exceed three years. An extension of stay may be authorised in increments of up to one ' +
    'year to continue or complete the same event or activity, plus an additional ten days to allow the ' +
    'beneficiary to get personal affairs in order. There is no statutory ceiling on total time in O-1 status, ' +
    'but each grant is tied to a defined event or activity rather than to a job of indefinite length.',
};

// ---------------------------------------------------------------------------
// O-1A — extraordinary ability in the sciences, education, business or athletics
// ---------------------------------------------------------------------------

export const usO1aExtraordinaryAbility: Pathway = {
  id: 'us-o1a-extraordinary-ability',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'O-1A — extraordinary ability in the sciences, education, business or athletics',
    es: 'O-1A — capacidad extraordinaria en ciencias, educación, negocios o deporte',
  },
  summary: {
    en:
      'Temporary work for a person of extraordinary ability in the sciences, education, business or athletics, ' +
      'meaning one of the small percentage who have arisen to the very top of the field, coming to continue work ' +
      'in that area. There is no cap and no labour certification, but there is also no threshold: the finding is ' +
      'made on documentary evidence and is the most discretionary in this file. This record does not cover O-1B ' +
      'in the arts, whose standard is "distinction", or O-1B in motion picture and television, whose standard is ' +
      '"extraordinary achievement" — different standards that must not be conflated with this one.',
    es:
      'Trabajo temporal para quien tiene capacidad extraordinaria en ciencias, educación, negocios o deporte, ' +
      'entendida como pertenecer al pequeño porcentaje que ha llegado a lo más alto de su campo, y viene a ' +
      'continuar trabajando en esa área. No hay cupo ni certificación laboral, pero tampoco hay umbral: la ' +
      'apreciación se hace sobre prueba documental y es la más discrecional de este archivo. Este registro no ' +
      'cubre la O-1B en las artes, cuyo estándar es la «distinción», ni la O-1B en cine y televisión, cuyo ' +
      'estándar es el «logro extraordinario»: son estándares distintos que no deben confundirse con este.',
  },
  citations: [
    inaExtraordinaryAbility,
    inaPresumptionOfImmigrantStatus,
    cfrO1Definitions,
    cfrO1EvidentiaryCriteria,
    cfrO1PermanentResidence,
    cfrO1Validity,
  ],
  criteria: [
    {
      id: 'us-o1a-continued-work-in-the-field',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-ina-101-a-15-o-i'],
      label: {
        en: 'Entering to continue work in the area of extraordinary ability, on a United States engagement',
        es: 'Entrada para continuar trabajando en el área de capacidad extraordinaria, con un compromiso en Estados Unidos',
      },
      evaluator: usEmployerWrittenOffer,
      guidance: {
        en:
          'The statute requires entry to continue work in the area of the claimed ability — a person acclaimed in ' +
          'one field cannot use that acclaim to enter and work in another. An O-1 petition is filed by a United ' +
          'States employer, by a United States agent, or by a foreign employer through a United States agent, and ' +
          'the last of those is how genuinely freelance careers are usually accommodated. Meridian records a ' +
          'single job offer, so an itinerary of engagements through an agent will not be visible here and must be ' +
          'described separately.',
        es:
          'La ley exige entrar para continuar trabajando en el área de la capacidad alegada: quien goza de ' +
          'reconocimiento en un campo no puede invocarlo para entrar a trabajar en otro. La petición O-1 la ' +
          'presenta un empleador estadounidense, un agente estadounidense o un empleador extranjero a través de ' +
          'un agente estadounidense, y esta última vía es la que suele dar cabida a las carreras realmente ' +
          'independientes. Meridian registra una sola oferta de empleo, de modo que un itinerario de compromisos ' +
          'gestionado por un agente no será visible aquí y deberá describirse aparte.',
      },
    },
    {
      id: 'us-o1a-extraordinary-ability-standard',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-2-o-3-ii', 'us-8-cfr-214-2-o-3-iii', 'us-ina-101-a-15-o-i'],
      requiresHumanReview: true,
      label: {
        en: 'Sustained national or international acclaim, documented against the regulatory criteria',
        es: 'Reconocimiento nacional o internacional sostenido, acreditado conforme a los criterios reglamentarios',
      },
      // Unconditional escalation, which means this pathway can never return a
      // verdict of any kind — not eligible, not ineligible. That is the correct
      // answer here rather than a limitation being apologised for. The standard
      // is that the person is one of the small percentage who have arisen to
      // the very top of their field, established by a major international award
      // or by three of eight documentary criteria that Meridian holds none of:
      // prizes, memberships, published material, judging, contributions,
      // authorship, critical employment, salary. A green tick from software
      // would be meaningless, and so would a red cross.
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'US' },
      humanReviewReason: {
        en:
          'Meridian records education, credentials and employment history. It records no awards, no memberships, ' +
          'no published material, no judging, no account of contributions to the field, no authorship, and no ' +
          'salary evidence — which is the entire content of the eight-criteria test. Nothing in this engine can ' +
          'measure whether a person is one of the small percentage at the very top of their field, so this ' +
          'criterion is never decided automatically, in either direction.',
        es:
          'Meridian registra formación, credenciales e historial laboral. No registra premios, ni pertenencia a ' +
          'asociaciones, ni publicaciones, ni participación como juez, ni relato de contribuciones al campo, ni ' +
          'autoría, ni prueba salarial, que es justamente todo el contenido del examen de los ocho criterios. ' +
          'Nada en este motor puede medir si una persona pertenece al pequeño porcentaje situado en lo más alto ' +
          'de su campo, de modo que este criterio nunca se resuelve automáticamente, ni en un sentido ni en otro.',
      },
      guidance: {
        en:
          'The evidence route is a major, internationally recognised award such as the Nobel Prize, or at least ' +
          'three of eight forms of documentation. Where those criteria do not readily apply to the occupation, ' +
          'comparable evidence may be submitted instead. Satisfying three is what opens the assessment, not what ' +
          'concludes it: the adjudicator then weighs the evidence as a whole against the "very top of the field" ' +
          'standard. A consultation with a peer group, labour organisation or management organisation in the ' +
          'field is also part of the petition.',
        es:
          'La vía probatoria es un premio internacional de gran relevancia, como el Nobel, o al menos tres de las ' +
          'ocho formas de documentación. Cuando esos criterios no se ajusten con facilidad a la ocupación, puede ' +
          'presentarse prueba comparable. Cumplir tres es lo que abre la valoración, no lo que la cierra: después ' +
          'la persona adjudicadora pondera el conjunto de la prueba frente al estándar de «lo más alto del ' +
          'campo». La petición incluye además una consulta a un grupo de pares, a una organización sindical o a ' +
          'una organización de gestión del sector.',
      },
    },
    {
      id: 'us-o1a-permanent-residence-not-a-bar',
      kind: 'intent',
      weight: 'informational',
      citationIds: ['us-8-cfr-214-2-o-13', 'us-ina-214-b'],
      label: {
        en: 'Seeking permanent residence is not a basis for denying an O-1 petition',
        es: 'Solicitar la residencia permanente no es motivo para denegar una petición O-1',
      },
      evaluator: { op: 'is_false', path: 'intent.temporary' },
      guidance: {
        en:
          'The regulation gives O-1 a protection that resembles dual intent without being section 214(h) dual ' +
          'intent: approval of a labor certification or filing of a preference petition is not a basis for ' +
          'denial, and the person may lawfully seek permanent residence while holding O-1. What the regulation ' +
          'still requires is an intention to depart voluntarily at the end of the authorised stay, and O-1 ' +
          'remains inside the section 214(b) immigrant presumption at the visa stage.',
        es:
          'El reglamento otorga a la O-1 una protección que se parece a la doble intención sin ser la del ' +
          'artículo 214(h): la aprobación de una certificación laboral o la presentación de una petición de ' +
          'preferencia no son motivo de denegación, y la persona puede solicitar lícitamente la residencia ' +
          'permanente mientras mantiene la O-1. Lo que el reglamento sigue exigiendo es la intención de salir ' +
          'voluntariamente al término de la estancia autorizada, y la O-1 permanece dentro de la presunción de ' +
          'inmigrante del artículo 214(b) en la fase de visa.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    renewalMonths: 12,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-2-o-6-o-12'],
    note: {
      en:
        'The grant is tied to an event or activity rather than to open-ended employment: the petition is valid ' +
        'for the time determined necessary to accomplish it, up to three years, and extensions run in increments ' +
        'of up to one year to continue or complete the same event or activity, plus ten days to settle personal ' +
        'affairs. There is no statutory maximum on total time in O-1 status, which is the structural difference ' +
        'from H-1B and L-1.',
      es:
        'La concesión se vincula a un evento o actividad y no a un empleo indefinido: la petición vale por el ' +
        'tiempo que se estime necesario para llevarlo a cabo, hasta tres años, y las prórrogas se conceden por ' +
        'periodos de hasta un año para continuar o completar ese mismo evento o actividad, más diez días para ' +
        'ordenar asuntos personales. No hay máximo legal de tiempo total en estatus O-1, que es la diferencia ' +
        'estructural respecto de la H-1B y la L-1.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Citations — E-1 and E-2
// ---------------------------------------------------------------------------

const inaTreatyTraderInvestor = {
  id: 'us-ina-101-a-15-e',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1101(a)(15)(E) (INA § 101(a)(15)(E))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien entitled to enter under and in pursuance of the provisions of a treaty of commerce and navigation ' +
    'between the United States and the foreign state of which the alien is a national, and the spouse and ' +
    'children accompanying or following to join: (i) solely to carry on substantial trade, including trade in ' +
    'services or trade in technology, principally between the United States and that state; (ii) solely to ' +
    'develop and direct the operations of an enterprise in which the alien has invested, or is actively in the ' +
    'process of investing, a substantial amount of capital; or (iii) the Australian specialty-occupation route, ' +
    'which is not encoded here. Where nationality was acquired through a financial investment, the statute adds a ' +
    'three-year domicile requirement.',
};

const usmcaSectionB = {
  id: 'us-usmca-annex-16a-section-b',
  kind: 'treaty' as const,
  instrument: 'Agreement between the United States of America, the United Mexican States, and Canada (USMCA), Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A, Section B (Traders and Investors)',
  url: USMCA_CH16_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Each Party grants temporary entry to a business person seeking to carry on substantial trade in goods or ' +
    'services principally between the territory of the Party of which the business person is a citizen and the ' +
    'territory of the Party into which entry is sought, or to establish, develop, administer or provide advice ' +
    'or key technical services to the operation of an investment to which the business person or their ' +
    'enterprise has committed, or is in the process of committing, a substantial amount of capital.',
};

const cfrETraderInvestor = {
  id: 'us-8-cfr-214-2-e-1-e-3',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(e)(1), (e)(2) and (e)(3)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A treaty trader (E-1) must be in the United States solely to carry on trade of a substantial nature which is ' +
    'international in scope, on the alien’s own behalf or as an employee of a foreign person or organisation ' +
    'engaged in trade principally between the United States and the treaty country of which the alien is a ' +
    'national, and must intend to depart on expiration or termination of status. A treaty investor (E-2) must ' +
    'have invested or be actively in the process of investing a substantial amount of capital in a bona fide ' +
    'enterprise in the United States, as distinct from a relatively small amount of capital in a marginal ' +
    'enterprise solely for the purpose of earning a living; must be seeking entry solely to develop and direct ' +
    'the enterprise; and must intend to depart on expiration or termination of status. An employee of either ' +
    'must share the principal’s nationality and be coming in an executive or supervisory capacity or, in a lesser ' +
    'capacity, have special qualifications essential to the efficient operation of the enterprise.',
};

const cfrESubstantiality = {
  id: 'us-8-cfr-214-2-e-11-e-16',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(e)(11), (e)(12), (e)(14), (e)(15) and (e)(16)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'NO THRESHOLD EXISTS IN EITHER TEST. Substantial trade is an amount sufficient to ensure a continuous flow of ' +
    'international trade items between the United States and the treaty country, contemplating numerous ' +
    'transactions over time; status may not be established or maintained on a single transaction however ' +
    'protracted or valuable; and "there is no minimum requirement with respect to the monetary value or volume of ' +
    'each individual transaction". Principal trade exists when over 50 percent of the volume of the trader’s ' +
    'international trade is between the United States and the treaty country. A substantial amount of capital is ' +
    'an amount substantial in relationship to the total cost of purchasing an established enterprise or creating ' +
    'the type of enterprise under consideration, sufficient to ensure the investor’s financial commitment, and of ' +
    'a magnitude to support the likelihood of successfully developing and directing it — generally, the lower the ' +
    'cost of the enterprise the higher proportionately the investment must be. The investment must be at risk in ' +
    'the commercial sense, irrevocably committed, and the investor must possess and control the capital. The ' +
    'enterprise may not be marginal, meaning it must have the present or future capacity to generate more than ' +
    'enough income to provide a minimal living for the investor and family, with future capacity generally ' +
    'realisable within five years. ANY DOLLAR FIGURE OFFERED BY A SECONDARY SOURCE IS INVENTED.',
};

const cfrEPeriods = {
  id: 'us-8-cfr-214-2-e-19-e-20',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(e)(19) and (e)(20)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A treaty trader or treaty investor may be admitted for an initial period of not more than 2 years. Requests ' +
    'for extensions of stay may be granted in increments of not more than 2 years, and the regulation sets no ' +
    'maximum number of them. An alien is not admitted in E classification for a period extending more than 6 ' +
    'months beyond the expiration of the passport.',
};

const famETreatyCountries = {
  id: 'us-9-fam-402-9-10',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.9-10 (treaty country table) and 9 FAM 402.9-4(A)',
  url: FAM_402_9_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'MEXICO IS A TREATY COUNTRY FOR BOTH CLASSIFICATIONS. The Department of State table lists "Mexico E-1 ' +
    '01/01/1994" and "Mexico E-2 01/01/1994" — the date NAFTA entered into force, the entitlement continuing ' +
    'under the USMCA. The guidance frames the table as countries whose nationals may be accorded classification ' +
    'under INA 101(a)(15)(E) pursuant to a qualifying treaty "or pursuant to legislation enacted to extend that ' +
    'same privilege", which is how a trade agreement rather than a treaty of commerce and navigation supports the ' +
    'entry. Read on 2026-07-26 from the Department’s own published table. Many secondary lists of "who qualifies ' +
    'for E-2" omit Mexico and are wrong.',
};

const famEJudgement = {
  id: 'us-9-fam-402-9-2',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.9-2(b)',
  url: FAM_402_9_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The Department instructs its own officers that "although this classification mandates compliance with a ' +
    'lengthy list of requirements, many of these standards are subject to the exercise of a great amount of ' +
    'judgment and discretion", and that officers should be flexible, fair and uniform. The burden of proof ' +
    'remains on the applicant.',
};

const famENationalityOfEnterprise = {
  id: 'us-9-fam-402-9-4-b',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.9-4(B)',
  url: FAM_402_9_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'The nationality of a business is determined by the nationality of its individual owners, and the country of ' +
    'incorporation is irrelevant. Where treaty country ownership is too diffuse for one person or company to ' +
    'demonstrate the ability to develop and direct, the owners of treaty nationality must together own 50 percent ' +
    'of the United States enterprise and be able, at least collectively, to develop and direct it. Shares held by ' +
    'United States lawful permanent residents cannot be counted toward the nationality of the business, and a ' +
    'treaty-country national who holds lawful permanent residence does not qualify to bring in employees.',
};

const famEIntentToDepart = {
  id: 'us-9-fam-402-9-4-c',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.9-4(C)',
  url: FAM_402_9_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'An E applicant need not establish an intent to proceed to the United States for a specific temporary period, ' +
    'and need not have a residence in a foreign country which the applicant does not intend to abandon: the ' +
    'applicant may sell their residence and move all household effects. An expression of unequivocal intent to ' +
    'depart on termination of E status is normally sufficient. The residence-abroad requirement applies to the B, ' +
    'F, H (except H-1), J, M, O-2, P and Q classifications — a list that does not include E.',
};

// ---------------------------------------------------------------------------
// E-1 and E-2 — treaty trader and treaty investor
// ---------------------------------------------------------------------------

/**
 * A claimed nationality the applicant actually holds.
 *
 * The treaty country table runs to dozens of states with different dates and
 * different classifications, and this catalog transcribes exactly one line of
 * it — the line for Mexico, read from the Department's own published table.
 * Encoding a partial list and testing membership against it would produce a
 * confident "not a treaty country" for every state we simply had not typed
 * out, so the criterion tests what it can and escalates every other
 * nationality to a person who can read the table.
 */
const claimedNationalityHeld: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'is_present', path: 'claimedNationality' },
    { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
  ],
};

const claimedNationalityOtherThanMexico: EvaluatorSpec = {
  op: 'all_of',
  of: [
    { op: 'is_present', path: 'claimedNationality' },
    { op: 'not', of: { op: 'equals', path: 'claimedNationality', value: 'MX' } },
  ],
};

export const usE1TreatyTrader: Pathway = {
  id: 'us-e1-treaty-trader',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'E-1 — treaty trader',
    es: 'E-1 — comerciante por tratado',
  },
  summary: {
    en:
      'Temporary entry for a national of a treaty country to carry on substantial trade, principally between the ' +
      'United States and that country, on their own behalf or as an executive, supervisory or essentially ' +
      'skilled employee of a treaty-national enterprise. Mexico is a treaty country for E-1, with effect from ' +
      '1 January 1994. There is no cap, no petition to USCIS in the ordinary consular route, and no threshold ' +
      'amount of trade in either the statute or the regulation.',
    es:
      'Entrada temporal de una persona nacional de un país con tratado para desarrollar comercio sustancial, ' +
      'principalmente entre Estados Unidos y ese país, por cuenta propia o como personal ejecutivo, supervisor o ' +
      'con cualificación esencial de una empresa con esa nacionalidad. México es país con tratado a efectos de ' +
      'E-1, con efecto desde el 1 de enero de 1994. No hay cupo, no hay petición ante USCIS en la vía consular ' +
      'ordinaria y no hay importe mínimo de comercio ni en la ley ni en el reglamento.',
  },
  citations: [
    inaTreatyTraderInvestor,
    inaPresumptionOfImmigrantStatus,
    usmcaSectionB,
    cfrETraderInvestor,
    cfrESubstantiality,
    cfrEPeriods,
    famETreatyCountries,
    famEJudgement,
    famENationalityOfEnterprise,
    famEIntentToDepart,
  ],
  criteria: [
    {
      id: 'us-e1-treaty-country-nationality',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: [
        'us-ina-101-a-15-e',
        'us-9-fam-402-9-10',
        'us-9-fam-402-9-4-b',
        'us-usmca-annex-16a-section-b',
      ],
      label: {
        en: 'Nationality of a treaty country, held and claimed — Mexico qualifies for E-1',
        es: 'Nacionalidad de un país con tratado, ostentada y alegada — México reúne los requisitos para E-1',
      },
      evaluator: claimedNationalityHeld,
      humanReviewWhen: claimedNationalityOtherThanMexico,
      humanReviewReason: {
        en:
          'The claimed nationality is not Mexican, and this catalog transcribes only the Mexican line of the ' +
          'Department of State treaty country table. Whether that state appears on the table, for E-1 or E-2 or ' +
          'both, and from what date, has to be read from the table itself before anything is said about it.',
        es:
          'La nacionalidad alegada no es mexicana, y este catálogo transcribe únicamente la línea de México del ' +
          'cuadro de países con tratado del Departamento de Estado. Si ese Estado figura en el cuadro, para E-1, ' +
          'para E-2 o para ambas, y desde qué fecha, debe leerse en el propio cuadro antes de afirmar nada.',
      },
      guidance: {
        en:
          'Mexico appears on the Department of State table for both E-1 and E-2 with effect from 1 January 1994, ' +
          'the date NAFTA entered into force, and the entitlement continues under the USMCA. This is worth ' +
          'stating plainly because many published lists of treaty countries omit Mexico. Nationality also has to ' +
          'be traced through the enterprise: a business has the nationality of its individual owners, the country ' +
          'of incorporation is irrelevant, owners of treaty nationality must together hold 50 percent where ' +
          'ownership is diffuse, and shares held by United States permanent residents do not count toward it.',
        es:
          'México figura en el cuadro del Departamento de Estado tanto para E-1 como para E-2 con efecto desde el ' +
          '1 de enero de 1994, fecha de entrada en vigor del TLCAN, y el derecho continúa bajo el T-MEC. Conviene ' +
          'decirlo con claridad porque muchas listas publicadas de países con tratado omiten a México. La ' +
          'nacionalidad debe rastrearse además a través de la empresa: un negocio tiene la nacionalidad de sus ' +
          'propietarios individuales, el país de constitución es irrelevante, los propietarios con la ' +
          'nacionalidad del tratado deben sumar el 50 por ciento cuando la propiedad está dispersa, y las ' +
          'participaciones de residentes permanentes en Estados Unidos no computan.',
      },
    },
    {
      id: 'us-e1-substantial-trade',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-2-e-11-e-16', 'us-8-cfr-214-2-e-1-e-3', 'us-9-fam-402-9-2'],
      requiresHumanReview: true,
      label: {
        en: 'Substantial trade, international in scope, principally between the United States and the treaty country',
        es: 'Comercio sustancial, de alcance internacional, principalmente entre Estados Unidos y el país del tratado',
      },
      // Always routed to a person, and the reason is in the regulation rather
      // than in this engine's limitations: the test has no minimum. It asks
      // whether the flow of trade is continuous and whether more than half of
      // the trader's international trade runs between the two countries — a
      // question about a book of transactions, not about any figure Meridian
      // holds.
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'US' },
      humanReviewReason: {
        en:
          'The regulation states that there is no minimum requirement as to the monetary value or volume of each ' +
          'transaction. What is assessed is a continuous flow of international trade items, numerous transactions ' +
          'over time — a single transaction can never suffice, however valuable — and whether over 50 percent of ' +
          'the trader’s international trade is between the United States and the treaty country. Meridian records ' +
          'no transaction history, so this is read from the applicant’s own trade records by a person.',
        es:
          'El reglamento establece que no hay importe ni volumen mínimo por transacción. Lo que se valora es un ' +
          'flujo continuo de intercambios internacionales, numerosas operaciones a lo largo del tiempo —una sola ' +
          'operación nunca basta, por valiosa que sea— y si más del 50 por ciento del comercio internacional de ' +
          'la persona se realiza entre Estados Unidos y el país del tratado. Meridian no registra historial de ' +
          'operaciones, de modo que esto lo examina una persona sobre los propios registros comerciales.',
      },
      guidance: {
        en:
          'Trade for this purpose includes trade in services and in technology, not only in goods. For a smaller ' +
          'business the Department treats an income derived from numerous transactions that is sufficient to ' +
          'support the trader and their family as a favourable factor. An employee may qualify in an executive or ' +
          'supervisory capacity, or in a lesser capacity with special qualifications essential to the efficient ' +
          'operation of the enterprise, but must share the principal’s nationality.',
        es:
          'A estos efectos el comercio incluye servicios y tecnología, no solo mercancías. En una empresa pequeña ' +
          'el Departamento considera factor favorable que los ingresos derivados de numerosas operaciones basten ' +
          'para mantener a la persona comerciante y a su familia. El personal empleado puede acogerse a la ' +
          'clasificación en funciones ejecutivas o de supervisión, o en funciones menores con cualificaciones ' +
          'especiales esenciales para el funcionamiento eficiente de la empresa, pero debe compartir la ' +
          'nacionalidad del principal.',
      },
    },
    {
      id: 'us-e1-intent-to-depart',
      kind: 'intent',
      weight: 'material',
      citationIds: ['us-8-cfr-214-2-e-1-e-3', 'us-9-fam-402-9-4-c', 'us-ina-214-b'],
      label: {
        en: 'Intention to depart on expiration or termination of E-1 status',
        es: 'Intención de salir al expirar o terminar el estatus E-1',
      },
      // Material rather than blocking, deliberately. The regulation requires an
      // intention to depart when status ends; `intent.temporary` records
      // something adjacent but not identical — an assertion that the stay
      // itself is temporary — and E is the one class where those come apart,
      // because the applicant may sell their home and move everything they own.
      // A criterion measuring the near-enough quantity should be able to hold
      // back a yes and must not be able to produce a no.
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'E is materially easier on intent than B, F or TN. The Department states that an E applicant need not ' +
          'establish an intent to stay for a specific temporary period and need not maintain a residence abroad ' +
          'they do not intend to abandon — they may sell the house and move the household. What is required is an ' +
          'unequivocal intent to depart when E status ends, which is normally satisfied by saying so. The ' +
          'residence-abroad requirement in 9 FAM applies to B, F, H (other than H-1), J, M, O-2, P and Q, and E ' +
          'is not on that list.',
        es:
          'La E es sensiblemente más flexible en materia de intención que la B, la F o la TN. El Departamento ' +
          'señala que quien solicita una E no necesita acreditar la intención de permanecer por un periodo ' +
          'temporal concreto ni mantener en el extranjero una residencia que no pretenda abandonar: puede vender ' +
          'la vivienda y trasladar el menaje. Lo exigido es una intención inequívoca de salir cuando termine el ' +
          'estatus E, que normalmente se satisface manifestándolo. El requisito de residencia en el extranjero ' +
          'del 9 FAM se aplica a B, F, H (salvo H-1), J, M, O-2, P y Q, y la E no está en esa lista.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 24,
    renewalMonths: 24,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-2-e-19-e-20'],
    note: {
      en:
        'Admission is for an initial period of not more than two years, and extensions of stay may be granted in ' +
        'increments of not more than two years with no maximum number stated in the regulation. E status can ' +
        'therefore run for a very long time while the trade continues, which is what makes it structurally ' +
        'different from the capped classifications. Admission is not granted for a period extending more than six ' +
        'months beyond the expiry of the passport, so a passport near its end shortens the stay.',
      es:
        'La admisión es por un periodo inicial no superior a dos años, y las prórrogas pueden concederse por ' +
        'periodos no superiores a dos años sin que el reglamento fije un número máximo. El estatus E puede así ' +
        'prolongarse mucho tiempo mientras continúe el comercio, y eso es lo que lo distingue estructuralmente de ' +
        'las clasificaciones con cupo. No se admite por un periodo que exceda en más de seis meses la caducidad ' +
        'del pasaporte, de modo que un pasaporte próximo a vencer acorta la estancia.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const usE2TreatyInvestor: Pathway = {
  id: 'us-e2-treaty-investor',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'E-2 — treaty investor',
    es: 'E-2 — inversionista por tratado',
  },
  summary: {
    en:
      'Temporary entry for a national of a treaty country who has invested, or is actively in the process of ' +
      'investing, a substantial amount of capital in a bona fide United States enterprise, and is coming solely ' +
      'to develop and direct it. Mexico is a treaty country for E-2, with effect from 1 January 1994. There is no ' +
      'minimum investment figure anywhere in the statute or the regulation: substantiality is proportional to the ' +
      'cost of the enterprise.',
    es:
      'Entrada temporal de una persona nacional de un país con tratado que ha invertido, o está en proceso activo ' +
      'de invertir, una cantidad sustancial de capital en una empresa estadounidense real, y viene únicamente a ' +
      'desarrollarla y dirigirla. México es país con tratado a efectos de E-2, con efecto desde el 1 de enero de ' +
      '1994. No existe cifra mínima de inversión en la ley ni en el reglamento: la sustancialidad es proporcional ' +
      'al coste de la empresa.',
  },
  citations: [
    inaTreatyTraderInvestor,
    inaPresumptionOfImmigrantStatus,
    usmcaSectionB,
    cfrETraderInvestor,
    cfrESubstantiality,
    cfrEPeriods,
    famETreatyCountries,
    famEJudgement,
    famENationalityOfEnterprise,
    famEIntentToDepart,
  ],
  criteria: [
    {
      id: 'us-e2-treaty-country-nationality',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: [
        'us-ina-101-a-15-e',
        'us-9-fam-402-9-10',
        'us-9-fam-402-9-4-b',
        'us-usmca-annex-16a-section-b',
      ],
      label: {
        en: 'Nationality of a treaty country, held and claimed — Mexico qualifies for E-2',
        es: 'Nacionalidad de un país con tratado, ostentada y alegada — México reúne los requisitos para E-2',
      },
      evaluator: claimedNationalityHeld,
      humanReviewWhen: claimedNationalityOtherThanMexico,
      humanReviewReason: {
        en:
          'The claimed nationality is not Mexican, and this catalog transcribes only the Mexican line of the ' +
          'Department of State treaty country table. Several states appear for E-2 only and not for E-1, and the ' +
          'effective dates differ; the table itself has to be read.',
        es:
          'La nacionalidad alegada no es mexicana, y este catálogo transcribe únicamente la línea de México del ' +
          'cuadro de países con tratado del Departamento de Estado. Varios Estados figuran solo para E-2 y no ' +
          'para E-1, y las fechas de efecto difieren; debe leerse el propio cuadro.',
      },
      guidance: {
        en:
          'The enterprise must have treaty nationality too, and that is determined by the nationality of its ' +
          'individual owners rather than by where it was incorporated. Where ownership is diffuse, owners of ' +
          'treaty nationality must together hold 50 percent of the United States enterprise and be collectively ' +
          'able to develop and direct it. Shares held by United States lawful permanent residents cannot be ' +
          'counted, and a treaty national who holds permanent residence cannot bring in employees under this ' +
          'classification.',
        es:
          'La empresa debe tener también la nacionalidad del tratado, y esta se determina por la nacionalidad de ' +
          'sus propietarios individuales y no por el lugar de constitución. Cuando la propiedad está dispersa, ' +
          'los propietarios con la nacionalidad del tratado deben sumar el 50 por ciento de la empresa ' +
          'estadounidense y poder desarrollarla y dirigirla al menos colectivamente. Las participaciones de ' +
          'residentes permanentes en Estados Unidos no computan, y quien tiene la nacionalidad del tratado pero ' +
          'reside permanentemente en Estados Unidos no puede traer personal empleado bajo esta clasificación.',
      },
    },
    {
      id: 'us-e2-substantial-investment',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-2-e-11-e-16', 'us-8-cfr-214-2-e-1-e-3', 'us-9-fam-402-9-2'],
      requiresHumanReview: true,
      label: {
        en: 'A substantial amount of capital, at risk and irrevocably committed, in a non-marginal enterprise',
        es: 'Cantidad sustancial de capital, en riesgo y comprometida irrevocablemente, en una empresa no marginal',
      },
      // The evaluator reads the recorded amount so the trace shows what the
      // applicant said they invested. It cannot do more than that, because
      // there is nothing to compare the amount against: substantiality is
      // expressly proportional to the cost of the enterprise, and the
      // regulation states no figure. Publishing one would be inventing the law
      // this product exists to report accurately.
      evaluator: { op: 'is_present', path: 'qualifyingInvestment.minorUnits' },
      humanReviewReason: {
        en:
          'There is no threshold in the statute or the regulation to measure a figure against. Substantiality is ' +
          'proportional: substantial in relation to the total cost of purchasing or creating this type of ' +
          'enterprise, sufficient to show financial commitment, and of a magnitude supporting the likelihood of ' +
          'success — and, generally, the cheaper the enterprise the higher the proportion must be. On top of ' +
          'that the capital must be at risk in the commercial sense and irrevocably committed, and the enterprise ' +
          'must not be marginal. Every one of those is an assessment of a business plan, which a person makes.',
        es:
          'No hay umbral en la ley ni en el reglamento con el que comparar una cifra. La sustancialidad es ' +
          'proporcional: sustancial en relación con el coste total de adquirir o crear una empresa de ese tipo, ' +
          'suficiente para acreditar el compromiso financiero y de una magnitud que respalde la probabilidad de ' +
          'éxito; y, por lo general, cuanto más barata sea la empresa, mayor debe ser la proporción. A ello se ' +
          'suma que el capital debe estar en riesgo en sentido comercial y comprometido de forma irrevocable, y ' +
          'que la empresa no puede ser marginal. Todo eso es la valoración de un plan de negocio, y la hace una ' +
          'persona.',
      },
      guidance: {
        en:
          'Treat any dollar figure you have seen for E-2 as invented: neither the statute nor the regulation ' +
          'contains one, and a number presented as the minimum is the clearest sign a source has stopped citing ' +
          'and started guessing. What the regulation does say is that the capital must be the investor’s own, ' +
          'possessed and controlled by them, subject to partial or total loss if fortunes reverse, and ' +
          'irrevocably committed — funds may be placed in escrow pending admission or approval. A marginal ' +
          'enterprise is one without the present or future capacity to generate more than a minimal living for ' +
          'the investor and family, with future capacity generally realisable within five years of starting ' +
          'normal business activity.',
        es:
          'Considere inventada cualquier cifra en dólares que haya visto para la E-2: ni la ley ni el reglamento ' +
          'contienen ninguna, y presentar un número como mínimo es la señal más clara de que una fuente dejó de ' +
          'citar y empezó a suponer. Lo que el reglamento sí dice es que el capital debe ser propio, poseído y ' +
          'controlado por la persona inversionista, sujeto a pérdida parcial o total si la inversión se tuerce, y ' +
          'comprometido de forma irrevocable; los fondos pueden depositarse en garantía a la espera de la ' +
          'admisión o la aprobación. Es marginal la empresa que carece de capacidad presente o futura para ' +
          'generar más que un nivel de vida mínimo para la persona inversionista y su familia, entendiéndose la ' +
          'capacidad futura como realizable, por lo general, dentro de los cinco años siguientes al inicio de la ' +
          'actividad normal.',
      },
    },
    {
      id: 'us-e2-develop-and-direct',
      kind: 'employment',
      weight: 'material',
      citationIds: ['us-8-cfr-214-2-e-1-e-3', 'us-8-cfr-214-2-e-11-e-16'],
      label: {
        en: 'Entering solely to develop and direct the enterprise',
        es: 'Entrada únicamente para desarrollar y dirigir la empresa',
      },
      // Material, not blocking: the recorded employment type is the closest
      // available proxy for control of an enterprise, and a proxy should never
      // be able to produce a refusal on its own. Whether the applicant develops
      // and directs turns on ownership of at least 50 percent or on
      // operational control by other means, neither of which is recorded here.
      evaluator: {
        op: 'one_of',
        path: 'employmentType',
        values: ['self_employed', 'company_director'],
      },
      guidance: {
        en:
          'The regulation requires that the investor be coming solely to develop and direct the enterprise, which ' +
          'is normally shown by owning at least 50 percent of it or by operational control through a managerial ' +
          'position or other device. An employee of the investor may hold E-2 in an executive or supervisory ' +
          'capacity, or in a lesser capacity with special qualifications essential to the enterprise, but must ' +
          'share the principal’s nationality — and an employee is not the investor.',
        es:
          'El reglamento exige que la persona inversionista venga únicamente a desarrollar y dirigir la empresa, ' +
          'lo que normalmente se acredita poseyendo al menos el 50 por ciento o mediante control operativo a ' +
          'través de un puesto directivo u otro mecanismo. El personal empleado de quien invierte puede obtener ' +
          'la E-2 en funciones ejecutivas o de supervisión, o en funciones menores con cualificaciones especiales ' +
          'esenciales para la empresa, pero debe compartir la nacionalidad del principal, y el personal empleado ' +
          'no es la persona inversionista.',
      },
    },
    {
      id: 'us-e2-intent-to-depart',
      kind: 'intent',
      weight: 'material',
      citationIds: ['us-8-cfr-214-2-e-1-e-3', 'us-9-fam-402-9-4-c', 'us-ina-214-b'],
      label: {
        en: 'Intention to depart on expiration or termination of E-2 status',
        es: 'Intención de salir al expirar o terminar el estatus E-2',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'As with E-1, no residence abroad need be maintained and no specific temporary period need be shown; ' +
          'an unequivocal intent to depart when E status ends is normally sufficient. An applicant who is the ' +
          'beneficiary of an immigrant petition will have more to satisfy the officer about, and that is a ' +
          'judgement for the officer.',
        es:
          'Como en la E-1, no hace falta mantener residencia en el extranjero ni acreditar un periodo temporal ' +
          'concreto; basta normalmente con una intención inequívoca de salir cuando termine el estatus E. Quien ' +
          'sea beneficiario de una petición de inmigrante tendrá más que explicar al oficial, y esa valoración le ' +
          'corresponde a él.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 24,
    renewalMonths: 24,
    countsTowardNaturalisation: false,
    citationIds: ['us-8-cfr-214-2-e-19-e-20'],
    note: {
      en:
        'Admission is for an initial period of not more than two years, with extensions in increments of not ' +
        'more than two years and no maximum number in the regulation. The enterprise has to keep meeting the ' +
        'conditions: an investment that stops being at risk, or an enterprise that becomes marginal, undermines ' +
        'the basis of the status at the next extension rather than at some later date of the holder’s choosing.',
      es:
        'La admisión es por un periodo inicial no superior a dos años, con prórrogas por periodos no superiores a ' +
        'dos años y sin número máximo en el reglamento. La empresa debe seguir cumpliendo las condiciones: una ' +
        'inversión que deja de estar en riesgo, o una empresa que pasa a ser marginal, socava la base del estatus ' +
        'en la siguiente prórroga y no en una fecha posterior que elija la persona titular.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Citations — F-1
// ---------------------------------------------------------------------------

const inaAcademicStudent = {
  id: 'us-ina-101-a-15-f',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1101(a)(15)(F)(i) and (iii) (INA § 101(a)(15)(F))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Clause (i): an alien having a residence in a foreign country which he has no intention of abandoning, who is ' +
    'a bona fide student qualified to pursue a full course of study and who seeks to enter temporarily and solely ' +
    'for the purpose of pursuing such a course of study at an established college, university, seminary, ' +
    'conservatory, academic high school, elementary school, other academic institution or accredited language ' +
    'training programme approved for the purpose. Clause (iii), MEXICO-SPECIFIC: an alien who is a national of ' +
    'Canada or Mexico, who maintains actual residence and place of abode in the country of nationality, who meets ' +
    'clause (i) EXCEPT that the qualifications for and actual course of study may be full or part-time, and who ' +
    'commutes to the United States institution from Canada or Mexico. The commuter student is the one F-1 ' +
    'category where part-time study is statutorily permitted.',
};

const cfrF1Admission = {
  id: 'us-8-cfr-214-2-f-1-i',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(f)(1)(i)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A student may be admitted in F-1 status if the student presents a Form I-20 issued in the student’s name by ' +
    'a school certified by the Student and Exchange Visitor Program; has documentary evidence of financial ' +
    'support in the amount indicated on the Form I-20; on initial admission, intends to attend the school ' +
    'specified in the visa or on the Form I-20; and, for a public secondary school, has reimbursed the local ' +
    'educational agency the full unsubsidised per capita cost of the education for the period of attendance.',
};

const cfrF1DurationOfStatus = {
  id: 'us-8-cfr-214-2-f-5-i',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(f)(5)(i)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'CURRENT TEXT, CHANGING 2026-09-15 — SEE THE FEDERAL REGISTER CITATION ON THIS PATHWAY. Duration of status is ' +
    'defined as the time during which an F-1 student is pursuing a full course of study at an SEVP-certified ' +
    'institution, or engaging in authorised practical training following completion of studies, except that a ' +
    'student admitted to attend a public high school is restricted to an aggregate of 12 months of study at any ' +
    'public high school. There is no fixed admission date under this text: the admission runs for as long as the ' +
    'student remains in status.',
};

const cfrF1PracticalTraining = {
  id: 'us-8-cfr-214-2-f-10',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(f)(10), (f)(10)(i) and (f)(10)(ii)(A)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Practical training may be authorised to an F-1 student lawfully enrolled full time at an approved ' +
    'SEVP-certified college, university, conservatory or seminary for one full academic year. A student may be ' +
    'authorised 12 months of practical training and becomes eligible for another 12 months on changing to a ' +
    'higher educational level. Students in English language training programmes are ineligible. The employment ' +
    'must be directly related to the student’s major area of study. Curricular practical training is an integral ' +
    'part of an established curriculum authorised by the designated school official; a student who has received ' +
    'one year or more of full-time curricular practical training is ineligible for post-completion practical ' +
    'training. Optional practical training may be authorised during annual vacation, while school is in session ' +
    'provided it does not exceed 20 hours a week, or after completion of the course of study; post-completion ' +
    'training must be completed within a 14-month period following completion of study, except that the 24-month ' +
    'STEM extension need not be.',
};

const cfrF1StemExtension = {
  id: 'us-8-cfr-214-2-f-10-ii-c',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(f)(10)(ii)(C)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'A 24-month extension of post-completion optional practical training requires: a degree from a United States ' +
    'institution accredited by an agency recognised by the Department of Education at the time of application; a ' +
    'bachelor’s, master’s or doctoral degree in a field on the STEM Designated Degree Program List maintained by ' +
    'SEVP and published on its website, the degree being within a listed category at the time the designated ' +
    'school official makes the recommendation; where the extension rests on a previously obtained degree, that ' +
    'degree must have been conferred by an accredited United States institution within the preceding 10 years; a ' +
    'training opportunity directly related to the qualifying degree; an employer enrolled in and in good standing ' +
    'with E-Verify, holding an employer identification number, which agrees to report a termination or departure ' +
    'within five business days; and a completed and signed Form I-983 training plan. In no event may a student be ' +
    'authorised more than two lifetime STEM OPT extensions, and a second must rest on a degree at a higher level ' +
    'than the first.',
};

const cfrF1Unemployment = {
  id: 'us-8-cfr-214-2-f-10-ii-e',
  kind: 'regulation' as const,
  instrument: CFR8,
  provision: '8 CFR 214.2(f)(10)(ii)(E)',
  url: CFR_8_214_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'During post-completion optional practical training, F-1 status is dependent upon employment. A student may ' +
    'not accrue an aggregate of more than 90 days of unemployment during any post-completion period, and a ' +
    'student granted the 24-month extension may not accrue an aggregate of more than 150 days across the total ' +
    'optional practical training period including the extension. These are aggregate day counts, not consecutive ' +
    'ones, and they are the most commonly breached condition on this route.',
};

const frFixedPeriodOfAdmission = {
  id: 'us-fr-91-44976-fixed-period-of-admission',
  kind: 'regulation' as const,
  instrument:
    'Establishing a Fixed Time Period of Admission and an Extension of Stay Procedure for Nonimmigrant Academic Students, Exchange Visitors, and Representatives of Foreign Information Media, 91 FR 44976',
  provision: 'final rule published 17 July 2026, effective 15 September 2026; amends 8 CFR parts 214, 248 and 274a',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'NOT YET IN FORCE AT THE DATE OF THIS RECORD, AND NOT YET INCORPORATED INTO THE CFR TEXT CITED ALONGSIDE IT. ' +
    'The rule replaces duration of status for F, J and I with a fixed period of admission, with F-1 capped at ' +
    'four years plus the periods the rule allows before and after the programme. DHS classified it as a major ' +
    'rule subject to congressional review and stated that if the effective date changes it will publish a further ' +
    'document. Its significance reaches well beyond students: under duration of status, unlawful presence accrues ' +
    'only from the day after a formal finding of a status violation, and a fixed admission date removes that ' +
    'shelter, so the three- and ten-year bars in 8 U.S.C. § 1182(a)(9)(B) become reachable for students in a way ' +
    'they largely were not. THIS PATHWAY MUST BE RE-VERIFIED IN SEPTEMBER 2026. NO URL BY DESIGN: the citation ' +
    'and dates were confirmed through the Federal Register API on 2026-07-26; the document page refused ' +
    'automated access.',
};

// ---------------------------------------------------------------------------
// F-1 — academic student, with practical training
// ---------------------------------------------------------------------------

export const usF1AcademicStudent: Pathway = {
  id: 'us-f1-academic-student',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'F-1 — academic student, with optional practical training',
    es: 'F-1 — estudiante académico, con formación práctica opcional',
  },
  summary: {
    en:
      'Temporary admission to pursue a full course of study at an institution certified by the Student and ' +
      'Exchange Visitor Program, on a Form I-20, with documented financial support and a residence abroad the ' +
      'student does not intend to abandon. After one full academic year the student may be authorised 12 months ' +
      'of practical training per educational level, and a STEM degree from an accredited United States ' +
      'institution can support a further 24 months. A Mexican or Canadian national who keeps their residence at ' +
      'home and commutes may study full or part-time.',
    es:
      'Admisión temporal para cursar un programa de estudios completo en una institución certificada por el ' +
      'Student and Exchange Visitor Program, con formulario I-20, medios económicos acreditados y una residencia ' +
      'en el extranjero que no se pretende abandonar. Tras un año académico completo puede autorizarse formación ' +
      'práctica de 12 meses por nivel educativo, y un título STEM de una institución estadounidense acreditada ' +
      'permite otros 24 meses. Quien tenga nacionalidad mexicana o canadiense, mantenga su residencia en su país ' +
      'y viaje a diario puede estudiar a tiempo completo o parcial.',
  },
  citations: [
    inaAcademicStudent,
    inaNonimmigrantClasses,
    inaPresumptionOfImmigrantStatus,
    cfrF1Admission,
    cfrF1DurationOfStatus,
    cfrF1PracticalTraining,
    cfrF1StemExtension,
    cfrF1Unemployment,
    frFixedPeriodOfAdmission,
  ],
  criteria: [
    {
      id: 'us-f1-i20-and-financial-support',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['us-8-cfr-214-2-f-1-i', 'us-ina-101-a-15-f'],
      requiresHumanReview: true,
      label: {
        en: 'A Form I-20 from an SEVP-certified school, and documented financial support in the amount it states',
        es: 'Formulario I-20 de una institución certificada por SEVP y medios económicos acreditados por el importe que indique',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'US' },
      humanReviewReason: {
        en:
          'Meridian holds no Form I-20, no school identifier and no record of available funds. The regulation ' +
          'requires a Form I-20 issued in the student’s own name by a school the Student and Exchange Visitor ' +
          'Program has certified, and documentary evidence of financial support in the amount that form states — ' +
          'an amount set by the school, not by any rule this catalog could carry. Both have to be seen.',
        es:
          'Meridian no dispone del formulario I-20, ni del identificador de la institución, ni de constancia de ' +
          'fondos disponibles. El reglamento exige un formulario I-20 expedido a nombre de la propia persona ' +
          'estudiante por una institución certificada por el Student and Exchange Visitor Program, y prueba ' +
          'documental de medios económicos por el importe que ese formulario indique, importe que fija la ' +
          'institución y no una norma que este catálogo pueda recoger. Deben examinarse ambos.',
      },
      guidance: {
        en:
          'The certification belongs to the school and can be withdrawn; the Form I-20 belongs to the student and ' +
          'has to be kept current through the designated school official as things change — a new major, a ' +
          'transfer, a move to a higher level, any request for practical training. A student at a public ' +
          'secondary school must additionally have reimbursed the local educational agency the full unsubsidised ' +
          'per capita cost of the education, and is limited to an aggregate of 12 months there.',
        es:
          'La certificación es de la institución y puede retirarse; el formulario I-20 es de la persona ' +
          'estudiante y debe mantenerse actualizado a través del designated school official conforme cambien las ' +
          'circunstancias: cambio de especialidad, traslado, paso a un nivel superior o cualquier solicitud de ' +
          'formación práctica. Quien estudie en una escuela secundaria pública debe además haber reembolsado a la ' +
          'autoridad educativa local el coste íntegro no subvencionado por alumno, y tiene un límite agregado de ' +
          '12 meses en ese tipo de centro.',
      },
    },
    {
      id: 'us-f1-residence-abroad-and-study-purpose',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['us-ina-101-a-15-f', 'us-ina-214-b', 'us-ina-101-a-15'],
      label: {
        en: 'A residence abroad the student does not intend to abandon, and entry solely to study',
        es: 'Residencia en el extranjero que no se pretende abandonar, y entrada únicamente para estudiar',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      humanReviewWhen: temporaryIntentWithAdverseHistory,
      humanReviewReason: {
        en:
          'Temporary intent is asserted, and a prior refusal or a prior overstay is also recorded. F-1 sits ' +
          'inside the section 214(b) immigrant presumption and carries an express residence-abroad requirement, ' +
          'so that history is exactly what a consular officer weighs. The judgement is not one this engine can ' +
          'make.',
        es:
          'Se afirma una intención temporal y consta además una denegación o una estancia excedida previas. La ' +
          'F-1 queda dentro de la presunción de inmigrante del artículo 214(b) y exige expresamente residencia en ' +
          'el extranjero, de modo que ese historial es precisamente lo que pondera un oficial consular. Ese ' +
          'juicio no lo puede hacer este motor.',
      },
      guidance: {
        en:
          'F-1 is not a dual-intent classification: section 214(h) does not list it, and the statutory definition ' +
          'itself requires a foreign residence the student has no intention of abandoning. A Mexican or Canadian ' +
          'national who maintains an actual residence and place of abode at home and commutes to the institution ' +
          'falls under clause (iii), where the course of study may be full or part-time — the only F-1 category ' +
          'in which part-time study is permitted by the statute.',
        es:
          'La F-1 no admite doble intención: el artículo 214(h) no la menciona, y la propia definición legal ' +
          'exige una residencia en el extranjero que no se pretenda abandonar. Quien tenga nacionalidad mexicana ' +
          'o canadiense, mantenga residencia y domicilio efectivos en su país y viaje a diario a la institución ' +
          'queda comprendido en el inciso (iii), en el que los estudios pueden ser a tiempo completo o parcial: ' +
          'la única categoría F-1 en la que la ley permite el tiempo parcial.',
      },
    },
    {
      id: 'us-f1-practical-training',
      kind: 'employment',
      weight: 'informational',
      citationIds: ['us-8-cfr-214-2-f-10', 'us-8-cfr-214-2-f-10-ii-e'],
      label: {
        en: 'Practical training: 12 months per educational level, after one full academic year',
        es: 'Formación práctica: 12 meses por nivel educativo, tras un año académico completo',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'student' },
      guidance: {
        en:
          'Twelve months of practical training become available after one full academic year of lawful full-time ' +
          'enrolment, and a further twelve on moving to a higher educational level — a master’s after a ' +
          'bachelor’s, not a second bachelor’s. English language training students are excluded. The work must be ' +
          'directly related to the major area of study. Curricular training is authorised by the designated ' +
          'school official as part of the curriculum, and a year or more of full-time curricular training ' +
          'disqualifies the student from post-completion optional training altogether. Post-completion training ' +
          'must be completed within 14 months of finishing the course. Two aggregate limits then govern: no more ' +
          'than 90 days of unemployment during post-completion training, and no more than 150 days across the ' +
          'whole period where the 24-month extension has been granted. They are aggregates, so short gaps add up, ' +
          'and status depends on employment throughout.',
        es:
          'Los doce meses de formación práctica quedan disponibles tras un año académico completo de matrícula ' +
          'lícita a tiempo completo, y otros doce al pasar a un nivel educativo superior —un máster después de ' +
          'una licenciatura, no una segunda licenciatura—. Se excluye a quienes cursan programas de idiomas. El ' +
          'trabajo debe guardar relación directa con la especialidad principal. La formación curricular la ' +
          'autoriza el designated school official como parte del plan de estudios, y un año o más de formación ' +
          'curricular a tiempo completo excluye por completo la formación opcional posterior a la titulación. La ' +
          'formación posterior a la titulación debe completarse dentro de los 14 meses siguientes a la ' +
          'finalización de los estudios. Rigen después dos límites agregados: no más de 90 días de desempleo ' +
          'durante la formación posterior a la titulación y no más de 150 días en el conjunto del periodo cuando ' +
          'se ha concedido la prórroga de 24 meses. Son agregados, de modo que los huecos breves se suman, y el ' +
          'estatus depende del empleo durante todo ese tiempo.',
      },
    },
    {
      id: 'us-f1-stem-extension',
      kind: 'qualification',
      weight: 'informational',
      citationIds: ['us-8-cfr-214-2-f-10-ii-c', 'us-8-cfr-214-2-f-10-ii-e'],
      label: {
        en: 'A degree from an accredited United States institution, which the STEM extension requires',
        es: 'Título de una institución estadounidense acreditada, requisito de la prórroga STEM',
      },
      // Tests the two conditions that are visible in the facts — a degree at
      // bachelor's level or above, obtained in the United States. It cannot test
      // the decisive one, which is whether the field of study sits in a
      // category on the STEM Designated Degree Program List that SEVP
      // maintains and revises. Informational weight, so it reports and never
      // rules.
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'ordinal_at_least', path: 'educationLevel', scale: EDUCATION_SCALE, value: 'bachelor' },
          { op: 'equals', path: 'educationCountry', value: 'US' },
        ],
      },
      guidance: {
        en:
          'The 24-month extension needs all of: a degree from a United States institution accredited by an agency ' +
          'the Department of Education recognises; a bachelor’s, master’s or doctoral degree in a field within a ' +
          'category on the STEM Designated Degree Program List, which SEVP maintains and revises and which this ' +
          'catalog does not reproduce; where an earlier degree is relied on, conferral within the preceding ten ' +
          'years; training directly related to that degree; an employer enrolled in and in good standing with ' +
          'E-Verify; and a signed Form I-983 training plan. Two extensions is the lifetime maximum, and a second ' +
          'must rest on a higher-level degree than the first. Check the current list against the exact CIP code ' +
          'on the Form I-20 rather than against the name of the programme.',
        es:
          'La prórroga de 24 meses exige todo lo siguiente: un título de una institución estadounidense ' +
          'acreditada por una agencia reconocida por el Departamento de Educación; una licenciatura, máster o ' +
          'doctorado en un campo comprendido en una categoría de la STEM Designated Degree Program List, que ' +
          'mantiene y actualiza SEVP y que este catálogo no reproduce; si se invoca un título anterior, que se ' +
          'haya expedido dentro de los diez años previos; formación directamente relacionada con ese título; un ' +
          'empleador inscrito y en buena situación en E-Verify; y un plan de formación I-983 firmado. El máximo ' +
          'vitalicio es de dos prórrogas, y la segunda debe apoyarse en un título de nivel superior a la primera. ' +
          'Conviene cotejar la lista vigente con el código CIP exacto que figura en el I-20 y no con el nombre ' +
          'del programa.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: [
      'us-8-cfr-214-2-f-5-i',
      'us-fr-91-44976-fixed-period-of-admission',
      'us-8-cfr-214-2-f-10',
    ],
    note: {
      en:
        'NO FIXED NUMBER OF MONTHS IS RECORDED HERE, AND THAT IS ABOUT TO CHANGE. Under the regulation as it ' +
        'stands, an F-1 student is admitted for duration of status: the admission lasts as long as the student is ' +
        'pursuing a full course of study at a certified school or engaging in authorised practical training, with ' +
        'no end date on the record. A final rule published on 17 July 2026 and effective on 15 September 2026 ' +
        'replaces that with a fixed period of admission, F-1 capped at four years. The rule is a major rule ' +
        'subject to congressional review, so its effective date could still move, and the CFR text cited on this ' +
        'record has not yet been amended to carry it. The consequence is not administrative: duration of status ' +
        'is what stops unlawful presence accruing before a formal finding of a status violation, and a fixed ' +
        'admission date removes that protection. This record must be re-verified in September 2026.',
      es:
        'NO SE REGISTRA AQUÍ UN NÚMERO FIJO DE MESES, Y ESO ESTÁ A PUNTO DE CAMBIAR. Con el reglamento vigente, ' +
        'la persona estudiante F-1 es admitida por «duración del estatus»: la admisión dura mientras curse un ' +
        'programa completo en una institución certificada o realice formación práctica autorizada, sin fecha de ' +
        'término en el expediente. Una norma final publicada el 17 de julio de 2026 y con efectos desde el 15 de ' +
        'septiembre de 2026 sustituye eso por un periodo de admisión fijo, con un tope de cuatro años para la ' +
        'F-1. Es una norma mayor sujeta a revisión del Congreso, de modo que su fecha de efectos aún podría ' +
        'moverse, y el texto del CFR citado en este registro todavía no la incorpora. La consecuencia no es ' +
        'administrativa: la duración del estatus es lo que impide que se acumule presencia ilegal antes de una ' +
        'declaración formal de incumplimiento, y una fecha fija de admisión suprime esa protección. Este registro ' +
        'debe volver a verificarse en septiembre de 2026.',
    },
  },
  // Study to work is a real chain in this corridor and these are the three
  // classifications a Mexican graduate most often moves into. A bridge is not a
  // recommendation: `leadsTo` records that the routes connect, and nothing in
  // this catalog may order them or suggest one.
  leadsTo: [
    'us-h1b-specialty-occupation',
    'us-tn-usmca-professional',
    'us-o1a-extraordinary-ability',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Citations — B-1/B-2
// ---------------------------------------------------------------------------

const inaVisitor = {
  id: 'us-ina-101-a-15-b',
  kind: 'statute' as const,
  instrument: INA,
  provision: '8 U.S.C. § 1101(a)(15)(B) (INA § 101(a)(15)(B))',
  url: USC_1101_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien (other than one coming for the purpose of study or of performing skilled or unskilled labor, or as ' +
    'a representative of foreign information media coming to engage in that vocation) having a residence in a ' +
    'foreign country which he has no intention of abandoning and who is visiting the United States temporarily ' +
    'for business or temporarily for pleasure. The exclusions are in the definition itself: study and labour are ' +
    'outside the classification as a matter of statute, not of practice.',
};

const cfrVisitorClassification = {
  id: 'us-22-cfr-41-31',
  kind: 'regulation' as const,
  instrument: CFR22,
  provision: '22 CFR 41.31',
  url: CFR_22_41_31_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'An alien is classifiable as a visitor for business (B-1) or pleasure (B-2) if the consular officer is ' +
    'satisfied that the alien qualifies under INA 101(a)(15)(B) and that the alien intends to leave at the end of ' +
    'the temporary stay, has permission to enter a foreign country at the end of it, and has made adequate ' +
    'financial arrangements to carry out the purpose of the visit and to depart. "Business" refers to ' +
    'conventions, conferences, consultations and other legitimate activities of a commercial or professional ' +
    'nature, and expressly DOES NOT INCLUDE LOCAL EMPLOYMENT OR LABOR FOR HIRE; building or construction work is ' +
    'deemed purely local labour for hire, although supervising or training others engaged in it is not. "Pleasure" ' +
    'refers to legitimate recreational activities including tourism, amusement, visits to friends or relatives, ' +
    'rest, medical treatment, and fraternal, social or service activities.',
};

const famVisitorTest = {
  id: 'us-9-fam-402-2-2',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.2-2(B) and (D)',
  url: FAM_402_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'THE OFFICER’S TEST, IN THREE PARTS. The officer must assess whether the applicant has a residence in a ' +
    'foreign country which they do not intend to abandon; intends to enter for a period of specifically limited ' +
    'duration; and seeks admission for the sole purpose of legitimate activities relating to business or ' +
    'pleasure. Failure on any one is a refusal under INA 214(b). The guidance adds that if the officer doubts an ' +
    'applicant’s intent to return abroad, the applicant cannot satisfy that doubt by offering to leave a child, ' +
    'spouse or other dependent behind. On duration: "temporary" is not specifically defined by statute or ' +
    'regulation and generally signifies a limited period of stay; a stay exceeding six months or a year is not in ' +
    'itself controlling if the officer is satisfied the intended stay has a time limitation and is not ' +
    'indefinite; the focus is not the absolute length of the stay but whether it has some finite limit.',
};

const famBorderCrossingCard = {
  id: 'us-9-fam-402-2-7',
  kind: 'official_guidance' as const,
  instrument: FAM,
  provision: '9 FAM 402.2-7(A)',
  url: FAM_402_2_URL,
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'THE DEFAULT MEXICAN B VISA. The B-1/B-2 border crossing card may take the form of a card or a visa foil, and ' +
    'the card form "is issued as the default B-1/B-2 visa at all consular sections in Mexico". A valid Mexican ' +
    'passport is required at the time of application, and with a valid passport the document is valid for entry ' +
    'regardless of the point of origin of travel. The border crossing card ASPECT can additionally be used for ' +
    'land border entry WITHOUT a passport, within the border zone — 25 miles in Texas and California, 55 miles in ' +
    'New Mexico, 75 miles in Arizona — for up to 30 days. It may be issued to an applicant who is a citizen AND ' +
    'resident of Mexico, is physically present at a designated United States consular office in Mexico, and seeks ' +
    'entry as a temporary visitor for business or pleasure for periods of stay not exceeding six months.',
};

// ---------------------------------------------------------------------------
// B-1/B-2 — temporary visitor for business or pleasure
// ---------------------------------------------------------------------------

/**
 * No recorded job offer from a United States employer.
 *
 * Built out of `is_present` rather than a negated `equals`, and the difference
 * matters. `is_present` treats absence as `false`, so "no job offer recorded"
 * resolves cleanly to `true` here instead of to `unknown`. A negation of
 * `equals` would leave every visitor without an employment record sitting at
 * `unknown` forever, which would turn the ordinary case — a tourist — into an
 * indeterminate verdict.
 */
const noUnitedStatesJobOffer: EvaluatorSpec = {
  op: 'any_of',
  of: [
    { op: 'not', of: { op: 'is_present', path: 'jobOffer' } },
    { op: 'not', of: { op: 'equals', path: 'jobOffer.employerCountry', value: 'US' } },
  ],
};

export const usB1B2Visitor: Pathway = {
  id: 'us-b1-b2-visitor',
  version: '1.0.0',
  jurisdiction: US,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'B-1/B-2 — temporary visitor for business or pleasure',
    es: 'B-1/B-2 — visitante temporal por negocios o por placer',
  },
  summary: {
    en:
      'Temporary admission for business meetings, conferences and consultations (B-1), for tourism, visits and ' +
      'medical treatment (B-2), or both. The classification requires a residence abroad the visitor does not ' +
      'intend to abandon, a stay with a finite limit, and no local employment: study and labour for hire are ' +
      'excluded by the statutory definition itself. In Mexico the default B-1/B-2 visa is issued as a border ' +
      'crossing card, whose card privileges are narrower than the visa’s.',
    es:
      'Admisión temporal para reuniones de negocios, congresos y consultas (B-1), para turismo, visitas y ' +
      'tratamiento médico (B-2), o para ambas cosas. La clasificación exige una residencia en el extranjero que ' +
      'no se pretenda abandonar, una estancia con límite definido y la ausencia de empleo local: los estudios y ' +
      'el trabajo por cuenta ajena quedan excluidos por la propia definición legal. En México la visa B-1/B-2 se ' +
      'expide por defecto como tarjeta de cruce fronterizo, cuyos privilegios como tarjeta son más estrechos que ' +
      'los de la visa.',
  },
  citations: [
    inaVisitor,
    inaNonimmigrantClasses,
    inaPresumptionOfImmigrantStatus,
    inaMisrepresentation,
    cfrVisitorClassification,
    famVisitorTest,
    famBorderCrossingCard,
  ],
  criteria: [
    {
      id: 'us-b1-b2-residence-abroad-and-finite-stay',
      kind: 'intent',
      weight: 'blocking',
      citationIds: [
        'us-ina-101-a-15-b',
        'us-ina-214-b',
        'us-9-fam-402-2-2',
        'us-22-cfr-41-31',
        'us-ina-212-a-6-c-i',
      ],
      label: {
        en: 'A residence abroad not intended to be abandoned, and a stay with a finite limit',
        es: 'Residencia en el extranjero que no se pretende abandonar y estancia con límite definido',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      humanReviewWhen: temporaryIntentWithAdverseHistory,
      humanReviewReason: {
        en:
          'Temporary intent is asserted, and a prior refusal or a prior overstay is also recorded. B is the ' +
          'classification where the section 214(b) presumption bites hardest, and a refusal or an overstay is ' +
          'exactly what an officer weighs against the applicant in deciding whether the presumption has been ' +
          'overcome. This engine does not make that judgement.',
        es:
          'Se afirma una intención temporal y consta además una denegación o una estancia excedida previas. La B ' +
          'es la clasificación donde con más fuerza opera la presunción del artículo 214(b), y una denegación o ' +
          'una estancia excedida son precisamente lo que un oficial pondera en contra al decidir si la presunción ' +
          'ha quedado desvirtuada. Este motor no emite ese juicio.',
      },
      guidance: {
        en:
          'B IS NOT A DUAL-INTENT CLASSIFICATION, AND MISUNDERSTANDING THAT IS HOW PEOPLE LOSE STATUS. Section ' +
          '214(h) protects H-1B, L and V from having a pending immigrant petition treated as evidence of an ' +
          'intention to abandon a foreign residence. B is not on that list, and the requirement of an unabandoned ' +
          'foreign residence is in the statutory definition of B itself. Three consequences follow. First, ' +
          'entering as a visitor with a settled plan to remain is not a shortcut; it is a misrepresentation of the ' +
          'purpose of entry, and a wilful misrepresentation of a material fact to procure a visa or admission is ' +
          'an inadmissibility ground that is effectively permanent and far harder to undo than a refusal. Second, ' +
          'the test is about the shape of the stay rather than its length: an officer asks whether it has some ' +
          'finite limit, and a stay of more than six months is not disqualifying by itself if it does. Third, ' +
          'offering to leave a spouse, a child or another dependent behind does not answer a doubt about intent ' +
          'to return — the guidance says so in terms. If the real plan is to study or to work, the honest route ' +
          'is the classification that covers it.',
        es:
          'LA B NO ADMITE DOBLE INTENCIÓN, Y NO ENTENDERLO ES LA FORMA EN QUE LA GENTE PIERDE EL ESTATUS. El ' +
          'artículo 214(h) protege a la H-1B, la L y la V frente a que una petición de inmigrante pendiente se ' +
          'tome como prueba de la intención de abandonar la residencia en el extranjero. La B no figura en esa ' +
          'lista, y la exigencia de una residencia extranjera no abandonada está en la propia definición legal de ' +
          'la B. De ahí se derivan tres consecuencias. Primera: entrar como visitante con el plan asentado de ' +
          'quedarse no es un atajo, sino una tergiversación del motivo de entrada, y tergiversar deliberadamente ' +
          'un hecho material para obtener una visa o la admisión es una causa de inadmisibilidad prácticamente ' +
          'permanente y mucho más difícil de revertir que una denegación. Segunda: el examen atiende a la forma ' +
          'de la estancia más que a su duración; el oficial se pregunta si tiene un límite definido, y una ' +
          'estancia superior a seis meses no descalifica por sí sola si lo tiene. Tercera: ofrecer dejar atrás al ' +
          'cónyuge, a un hijo o a otra persona dependiente no despeja la duda sobre la intención de regresar, y ' +
          'la guía lo dice expresamente. Si el plan real es estudiar o trabajar, la vía honesta es la ' +
          'clasificación que lo cubre.',
      },
    },
    {
      id: 'us-b1-b2-no-local-employment',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['us-22-cfr-41-31', 'us-ina-101-a-15-b', 'us-ina-101-a-15'],
      label: {
        en: 'No local employment or labour for hire, and no course of study',
        es: 'Sin empleo local ni trabajo por cuenta ajena, y sin cursar estudios',
      },
      evaluator: noUnitedStatesJobOffer,
      guidance: {
        en:
          'The statutory definition excludes anyone coming to study or to perform skilled or unskilled labour, ' +
          'and the regulation excludes local employment or labour for hire from the meaning of "business". A ' +
          'recorded job offer from a United States employer is therefore a signal that the classification is the ' +
          'wrong one, not a strength. What B-1 does cover is conventions, conferences, consultations and other ' +
          'legitimate commercial or professional activities — negotiating a contract, attending a trade fair, ' +
          'taking instructions from a client — where the salary continues to come from abroad. Building or ' +
          'construction work is treated as purely local labour for hire, though supervising or training others ' +
          'engaged in it is not.',
        es:
          'La definición legal excluye a quien viene a estudiar o a realizar trabajo cualificado o no ' +
          'cualificado, y el reglamento excluye el empleo local o el trabajo por cuenta ajena del concepto de ' +
          '«negocios». Que conste una oferta de empleo de un empleador estadounidense es, por tanto, señal de que ' +
          'la clasificación es la equivocada, no un punto a favor. Lo que sí cubre la B-1 son congresos, ' +
          'conferencias, consultas y otras actividades comerciales o profesionales legítimas —negociar un ' +
          'contrato, asistir a una feria, recibir instrucciones de un cliente— cuando la retribución sigue ' +
          'proviniendo del extranjero. El trabajo de construcción se considera trabajo local por cuenta ajena, ' +
          'aunque supervisar o formar a quienes lo realizan no lo es.',
      },
    },
    {
      id: 'us-b1-b2-mexican-border-crossing-card',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['us-9-fam-402-2-7'],
      label: {
        en: 'Mexican citizenship: the default B-1/B-2 visa is issued as a border crossing card',
        es: 'Nacionalidad mexicana: la visa B-1/B-2 se expide por defecto como tarjeta de cruce fronterizo',
      },
      evaluator: { op: 'equals', path: 'claimedNationality', value: 'MX' },
      guidance: {
        en:
          'THE CARD AND THE VISA ARE NOT THE SAME PRIVILEGE, AND THE DIFFERENCE IS PRACTICAL. The document issued ' +
          'as the default at every consular section in Mexico carries both. Used AS A VISA, with a valid Mexican ' +
          'passport, it supports entry regardless of where the travel started and admission as a temporary ' +
          'visitor for a period of stay set by the officer at the port of entry, not exceeding six months. Used ' +
          'AS A BORDER CROSSING CARD, it supports land border entry without a passport, but only within the ' +
          'border zone — 25 miles in Texas and California, 55 in New Mexico, 75 in Arizona — and only for up to ' +
          '30 days. Travelling beyond the zone, or staying past 30 days, requires the passport and the visa use ' +
          'of the same document. Issue also requires the applicant to be a citizen AND a resident of Mexico, so ' +
          'abandoning Mexican residence is a ground for revoking it.',
        es:
          'LA TARJETA Y LA VISA NO SON EL MISMO PRIVILEGIO, Y LA DIFERENCIA ES PRÁCTICA. El documento que se ' +
          'expide por defecto en todas las secciones consulares en México incorpora ambos. Usado COMO VISA, con ' +
          'pasaporte mexicano vigente, permite la entrada con independencia del punto de origen del viaje y la ' +
          'admisión como visitante temporal por el periodo que fije el oficial en el puerto de entrada, sin ' +
          'exceder de seis meses. Usado COMO TARJETA DE CRUCE FRONTERIZO, permite la entrada terrestre sin ' +
          'pasaporte, pero solo dentro de la franja fronteriza —25 millas en Texas y California, 55 en Nuevo ' +
          'México y 75 en Arizona— y solo hasta 30 días. Viajar más allá de la franja, o permanecer más de 30 ' +
          'días, exige el pasaporte y el uso como visa del mismo documento. Su expedición requiere además ser ' +
          'ciudadano Y residente de México, de modo que abandonar la residencia mexicana es causa de revocación.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['us-9-fam-402-2-7', 'us-9-fam-402-2-2', 'us-22-cfr-41-31'],
    note: {
      en:
        'NO NUMBER OF MONTHS IS RECORDED HERE ON PURPOSE. The visa says when the holder may travel; the officer ' +
        'at the port of entry decides how long they may stay, and that period is what governs. The border ' +
        'crossing card may be issued to someone seeking stays not exceeding six months, and the card’s own ' +
        'border-zone privilege runs to 30 days, but neither figure is a period a traveller can assume on arrival. ' +
        'The date to work from is the one recorded on admission, not the one printed on the visa — confusing the ' +
        'two is how an overstay begins while the traveller believes they are in status.',
      es:
        'AQUÍ NO SE REGISTRA UN NÚMERO DE MESES, Y ES DELIBERADO. La visa indica cuándo puede viajar la persona ' +
        'titular; el oficial del puerto de entrada decide cuánto tiempo puede permanecer, y ese periodo es el que ' +
        'rige. La tarjeta de cruce fronterizo puede expedirse a quien pretenda estancias no superiores a seis ' +
        'meses, y el privilegio propio de la tarjeta en la franja fronteriza llega a 30 días, pero ninguna de ' +
        'esas cifras es un periodo que quien viaja pueda dar por supuesto al llegar. La fecha que cuenta es la ' +
        'que se registra en la admisión, no la impresa en la visa: confundirlas es como empieza una estancia ' +
        'excedida mientras la persona cree estar en regla.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// The shipped set
//
// Order is the order the records were written and carries no meaning: it is not
// a ranking, and nothing downstream may read it as one.
// ---------------------------------------------------------------------------

export const US_NONIMMIGRANT_PATHWAYS: readonly Pathway[] = [
  usTnUsmcaProfessional,
  usH1bSpecialtyOccupation,
  usL1aManagerOrExecutive,
  usL1bSpecializedKnowledge,
  usO1aExtraordinaryAbility,
  usE1TreatyTrader,
  usE2TreatyInvestor,
  usF1AcademicStudent,
  usB1B2Visitor,
];
