/**
 * Canada — the provincial routes.
 *
 * Two quite different things live here, and conflating them is the most common
 * mistake anyone makes about Canadian immigration.
 *
 * The **Provincial Nominee Program** is a *federal* class. IRPR s. 87 prescribes
 * it, and a nomination certificate issued by a province or territory is what
 * makes a person a member of it. The province writes the stream criteria; Canada
 * decides admission. Every participating jurisdiction runs its own streams, the
 * set of streams changes without notice, and no two are alike. Meridian encodes
 * none of them, and this file says so out loud rather than answering a
 * stream-specific question with a generic rule.
 *
 * **Quebec** is not a variation on that. Under the 1991 Canada–Québec Accord
 * Quebec selects the immigrants destined for its territory and Canada admits
 * them; Quebec does not nominate under s. 87 and does not appear in the
 * Provincial Nominee Program at all. Its instruments are its own — the Loi sur
 * l’immigration au Québec, the Règlement sur l’immigration au Québec, and the
 * Certificat de sélection du Québec that its programs issue — and the federal
 * permanent-residence application that follows is made under IRPR s. 86, a
 * different provision from the one the nominee class sits in.
 *
 * **Every pathway in this file escalates.** At least one criterion on each
 * record carries `requiresHumanReview`, so `evaluate` returns
 * `requires_human_review` for all of them, always. That is the point of the
 * file, not a gap in it: the decisive question on each of these routes is one
 * Meridian cannot see — has a province nominated you, has Quebec issued you a
 * certificate, do you meet the conditions of a stream that is not encoded here.
 * A verdict on any of those would be a guess wearing a finding’s clothes.
 *
 * Where a criterion is unconditionally escalated, its `evaluator` still has to
 * be something. Those specs read a fact the criterion genuinely depends on
 * (usually that Canada is the target jurisdiction at all) so the report carries
 * real evidence rather than a placeholder; the `humanReviewReason` states what
 * actually needs checking. The status is forced to `requires_human_review`
 * before the spec’s value is used, so none of them can produce a false "met".
 *
 * **Out of scope, deliberately.** Asylum, refugee protection and humanitarian or
 * compassionate claims are not modelled anywhere in this catalog. They turn on
 * credibility rather than criteria and they concern people at risk, and a
 * self-serve eligibility checker is the wrong instrument for them. Nothing here
 * covers them, and their absence is a decision rather than an oversight. A
 * person with a protection claim needs a lawyer, a Quebec notary or a College of
 * Immigration and Citizenship Consultants licensee — not this engine. The same
 * goes for family reunification, which Quebec does not select under the Accord
 * provision cited below and which this file does not model either.
 *
 * Everything here is `reviewStatus: 'unreviewed'`. Section 91 of the Immigration
 * and Refugee Protection Act makes advising a person for consideration on an
 * immigration application an offence unless you hold one of those three
 * licences. These records may say what a published rule states and how someone’s
 * own recorded facts measure against it. They may not be used to tell anyone
 * which route to take.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import type { Pathway } from '../schema.js';

const CA: CountryCode = countryCode('CA');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

const IRPR_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/';

// ---------------------------------------------------------------------------
// Federal instruments
// ---------------------------------------------------------------------------

const irprS87 = {
  id: 'ca-irpr-s-87',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87 (provincial nominee class)',
  url: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/section-87.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    's. 87(1) prescribes the provincial nominee class as persons who may become permanent residents on the basis ' +
    'of their ability to become economically established in Canada. s. 87(2) makes a person a member of it if they ' +
    'are named in a nomination certificate issued by a province under a nomination agreement in force with the ' +
    'Minister, made in accordance with provincial selection criteria approved in writing by the Minister, and made ' +
    'on the basis of their ability to become economically established and their intention to reside in the ' +
    'nominating province. s. 87(3) gives the nominating province sole responsibility to evaluate both of those. ' +
    's. 87(5) excludes a nomination based on the provision of capital or on participation in an immigration-linked ' +
    'investment scheme, subject to the exception in s. 87(6). The section says nothing about which streams a ' +
    'province may run or what they require, because that is the province’s to write.',
};

const sor2026_63 = {
  id: 'ca-sor-2026-63',
  kind: 'regulation' as const,
  instrument:
    'Regulations Amending the Immigration and Refugee Protection Regulations (Provincial Nominee Program), SOR/2026-63',
  provision: 's. 1',
  url: 'https://gazette.gc.ca/rp-pr/p2/2026/2026-04-08/html/sor-dors63-eng.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Registered 30 March 2026, in force on registration, published in the Canada Gazette, Part II, Vol. 160, No. 7 ' +
    '(8 April 2026). It replaced subsections 87(2) to (4). Before it, s. 87(3) let an officer substitute their own ' +
    'evaluation for the province’s where the nomination certificate was not a sufficient indicator that the person ' +
    'could become economically established, and s. 87(4) required a second officer to concur. Both are gone: the ' +
    'province now has sole responsibility to evaluate economic establishment and intention to reside, and s. 87(4) ' +
    'is repealed. This matters to anyone reading a refusal, a textbook or an older commentary written before ' +
    '30 March 2026, because the federal second-guessing they describe no longer exists.',
};

const pnpRias = {
  id: 'ca-pnp-rias-participation',
  kind: 'official_guidance' as const,
  instrument:
    'Regulatory Impact Analysis Statement published with the proposed Regulations Amending the Immigration and Refugee Protection Regulations (Provincial Nominee Program), Canada Gazette, Part I, Vol. 159, No. 8',
  url: 'https://gazette.gc.ca/rp-pr/p1/2025/2025-02-22/html/reg1-eng.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'EXPLANATORY MATERIAL, NOT LAW. A Regulatory Impact Analysis Statement is published alongside a regulation to ' +
    'explain it and is not itself enacted. It states that all provinces and territories except Quebec and Nunavut ' +
    'operate a provincial nominee program, and that the program dates from 1998. Participation follows the ' +
    'nomination agreements in force between each jurisdiction and the Minister, so it can change without the ' +
    'regulation changing.',
};

const irpaS10_3 = {
  id: 'ca-irpa-s-10-3',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 10.3 (ministerial instructions — invitations to apply)',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/i-2.5/section-10.3.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Authorises the Minister to give instructions governing the expression-of-interest and invitation system: the ' +
    'criteria a person must meet to be eligible to be invited, the ranking system and the categories candidates are ' +
    'grouped into, the number of invitations issued in a period — which may be zero — and the class an invited ' +
    'person must then apply under. Express Entry exists because of this section, not because of a regulation, which ' +
    'is why its rules move faster than the Regulations do.',
};

const expressEntryNominationPoints = {
  // Deliberately a different id from the general Express Entry instrument
  // citation elsewhere in this catalog: this one is about one provision of the
  // Instructions — the nomination award — and carries the caveats that go with
  // quoting a section number out of a superseded consolidation.
  id: 'ca-express-entry-mi-nomination-points',
  kind: 'policy' as const,
  instrument: 'Ministerial Instructions Respecting the Express Entry System',
  provision: 's. 28 (points for a nomination certificate issued by a province)',
  url: 'https://gazette.gc.ca/rp-pr/p1/2014/2014-12-01-x10/html/extra10-eng.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL INSTRUMENT, REVISED WITHOUT LEGISLATIVE PROCESS. Six hundred points are assigned to a candidate ' +
    'named in a nomination certificate issued by a province, and 600 is also the maximum of the additional-points ' +
    'block, so a nominated candidate can gain nothing further from it. If the province revokes the nomination, or ' +
    'the candidate declines it, the 600 points are withdrawn and the score is adjusted. The linked text is the ' +
    'Instructions as originally made — published in the Canada Gazette, Part I, Vol. 148, Extra No. 10 of ' +
    '1 December 2014, in force 1 January 2015 — where the award sits at s. 28. The Instructions currently in force ' +
    'are dated 11 March 2025 and are published on the department’s website under s. 10.3(4) of the Act rather than ' +
    'in the Gazette; their section numbering was not verified and should be checked before it is quoted. Meridian ' +
    'does not record the score needed to be invited: that is set for each round and moves, and predicting it would ' +
    'be a prediction of outcome.',
};

const nbPostNominationGuide = {
  id: 'ca-nb-pnp-post-nomination-guide',
  kind: 'official_guidance' as const,
  instrument:
    'ImmigrationNB — New Brunswick Provincial Nominee Program, Post-Nomination Guide (September 2025)',
  url: 'https://www2.gnb.ca/content/dam/gnb/Corporate/Promo/Immigration/NBPNP-post-nomination-guide.pdf',
  jurisdiction: 'CA-NB',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ONE PROVINCE’S OPERATIONAL GUIDANCE, CITED AS A WORKED EXAMPLE OF THE TWO FEDERAL ROUTES AFTER A NOMINATION. ' +
    'It states that a person nominated under New Brunswick’s Express Entry stream is asked in their IRCC secure ' +
    'account to accept or reject the nomination within 30 days; accepting confirms the nomination on the Express ' +
    'Entry profile and awards the 600 additional points; an invited candidate then has 60 days to submit the ' +
    'permanent-residence application. A person nominated under a non-Express Entry stream instead submits through ' +
    'the Permanent Residence Portal with the Confirmation of Nomination attached, on or before the expiry date on ' +
    'that document. Every other participating jurisdiction publishes its own guidance and they differ; nothing here ' +
    'may be read across to another province.',
};

const irpaS11_1 = {
  id: 'ca-irpa-s-11-1',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 11(1)',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/i-2.5/section-11.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A foreign national must apply for a visa or other required document before entering Canada, and it is issued ' +
    'if, following examination, the officer is satisfied that they are not inadmissible and meet the requirements ' +
    'of the Act. Neither a provincial nomination nor a Quebec selection certificate displaces this: selection and ' +
    'admissibility are separate decisions taken by separate governments.',
};

const citizenshipActS5 = {
  id: 'ca-citizenship-act-s-5-1-c',
  kind: 'statute' as const,
  instrument: 'Citizenship Act, R.S.C. 1985, c. C-29',
  provision: 's. 5(1)(c) and s. 5(1.001)',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/c-29/section-5.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A grant of citizenship requires physical presence in Canada for at least 1,095 days during the five years ' +
    'immediately before the date of the application. A day as a permanent resident counts as one day; a day as a ' +
    'temporary resident or protected person before permanent residence counts as half a day, to a maximum of ' +
    '365 days. Meridian does not compute this figure here — it is recorded so that "counts toward naturalisation" ' +
    'on these records points at the provision it rests on.',
};

// ---------------------------------------------------------------------------
// Quebec instruments
//
// The consolidated Quebec texts are published by Publications Québec at
// legisquebec.gouv.qc.ca. That site refused automated retrieval on the
// verification date, so no URL is recorded for the Act or the Regulation and
// the article numbering below is taken from the Ministère’s own procedures
// guide, which quotes it. The guide is cited in its own right and carries a URL.
// ---------------------------------------------------------------------------

const qcAccordArt12 = {
  id: 'ca-qc-accord-art-12',
  // Not an international instrument. It is an intergovernmental accord made
  // under what is now s. 8 of the Immigration and Refugee Protection Act, and
  // it sits above both the federal regulation and the Quebec statute that give
  // effect to it — which is why it is filed at the top of the authority scale
  // rather than as policy. The note says what it actually is.
  kind: 'treaty' as const,
  instrument: 'Canada–Québec Accord relating to Immigration and Temporary Admission of Aliens (1991)',
  provision: 'art. 12',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  note:
    'A FEDERAL–PROVINCIAL ACCORD, NOT AN INTERNATIONAL TREATY. Signed 5 February 1991 and in force 1 April 1991. ' +
    'Art. 12 gives Quebec sole responsibility for the selection of immigrants destined for Quebec and Canada sole ' +
    'responsibility for their admission, and obliges Canada to admit an immigrant destined for Quebec who meets ' +
    'Quebec’s selection criteria and does not fall in a class made inadmissible by federal law. The Accord divides ' +
    'responsibility across several articles and does not put every category of immigrant on the Quebec side of the ' +
    'line; this catalog models only the permanent economic selection described here. The text is published by the ' +
    'Government of Canada, which refused automated retrieval on the verification date, so no URL is recorded.',
};

const irpaS9 = {
  id: 'ca-irpa-s-9',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 9',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/i-2.5/section-9.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Applies where a province has sole responsibility for selection under a federal–provincial agreement. In that ' +
    'case a foreign national who meets the province’s selection criteria shall be granted permanent resident status ' +
    'unless inadmissible under the Act; a foreign national who does not meet them shall not be granted it; the ' +
    'grant may not exceed the number the province’s own law permits to settle there; and conditions imposed under ' +
    'provincial law have the same force as if imposed under the Act. The Canada–Québec Accord is such an agreement.',
};

const irprS86 = {
  id: 'ca-irpr-s-86',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 86 (Quebec skilled worker class)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    's. 86(1) prescribes the Quebec skilled worker class for the purposes of s. 12(2) of the Act. s. 86(2) makes a ' +
    'person a member if they intend to reside in the Province of Quebec and are named in a Certificat de sélection ' +
    'du Québec issued to them by that province. Subsections 86(3) and 86(4) were repealed by SOR/2008-253. This is ' +
    'a different class from the provincial nominee class in s. 87, and a Quebec applicant is never in the latter.',
};

const qcLoi = {
  id: 'ca-qc-loi-immigration',
  kind: 'statute' as const,
  instrument: 'Loi sur l’immigration au Québec, RLRQ chapitre I-0.2.1',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  note:
    'In force 2 August 2018. No article of the Act is specific to any one program: every article governing ' +
    'permanent immigration in the economic category applies to all of them. Art. 45 governs how many people the ' +
    'Ministère invites to apply, by reference to the objectives in the annual immigration plan, labour-market needs ' +
    'and processing capacity. Arts. 54 and 55 govern the duty to demonstrate the truth of declarations and to ' +
    'produce documents; art. 57 lists the grounds on which an application may be rejected; art. 59 lists the ' +
    'grounds on which a decision may be annulled, including that the conditions for a favourable decision have ' +
    'ceased to exist. Article numbering is taken from the Ministère’s procedures guide, which quotes the Act.',
};

const qcRiqPstq = {
  id: 'ca-qc-riq-pstq',
  kind: 'regulation' as const,
  instrument: 'Règlement sur l’immigration au Québec, RLRQ chapitre I-0.2.1, r. 3',
  provision: 'arts. 25 à 27, 31, 32 à 32.14',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 25 requires a declaration of interest; art. 26 exempts a small class of diplomatic and consular residents ' +
    'from the invitation criteria; art. 27 governs the validity of a declaration. Art. 31 defines membership of the ' +
    'economic category as a skilled worker. Art. 32 requires both the general selection conditions of the programme ' +
    '(art. 32.1) and the specific conditions of one of its four volets: Haute qualification et compétences ' +
    'spécialisées (arts. 32.3 to 32.5), Compétences intermédiaires et manuelles (arts. 32.6 to 32.10), Professions ' +
    'réglementées (arts. 32.11 and 32.12) and Talents d’exception (arts. 32.13 and 32.14). Art. 32.2 governs the ' +
    'principal occupation. Meridian encodes none of the conditions in those articles. Article numbering is taken ' +
    'from the Ministère’s procedures guide, which lists it.',
};

const qcRiqPeq = {
  id: 'ca-qc-riq-peq',
  kind: 'regulation' as const,
  instrument: 'Règlement sur l’immigration au Québec, RLRQ chapitre I-0.2.1, r. 3',
  provision: 'arts. 33, 33.1, 34 et 35',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  note:
    'Arts. 33 and 33.1 hold the general provisions and general conditions of the Programme de l’expérience ' +
    'québécoise; art. 34 the selection conditions of the volet Diplômés du Québec and art. 35 those of the volet ' +
    'Travailleurs étrangers temporaires. Meridian encodes none of them. Article numbering is taken from the ' +
    'Ministère’s procedures guide, which lists it; that guide predates the abolition of the programme on ' +
    '19 November 2025, so the articles must be read against the reactivation notice cited alongside it.',
};

const qcRiqArt108 = {
  id: 'ca-qc-riq-art-108',
  kind: 'regulation' as const,
  instrument: 'Règlement sur l’immigration au Québec, RLRQ chapitre I-0.2.1, r. 3',
  provision: 'art. 108',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  note:
    'A permanent selection decision is valid for 24 months, or until a decision is taken on the permanent-residence ' +
    'application under the Immigration and Refugee Protection Act, whichever comes first. The holder of a ' +
    'Certificat de sélection du Québec therefore has at most 24 months to file the federal application, and the ' +
    'certificate cannot be renewed. Art. 111 separately makes the decision lapse if the person becomes subject to ' +
    'an unstayed removal order or is inadmissible and not authorised to enter and remain in Canada, if a new ' +
    'permanent selection decision is issued, or on a decision adding or removing a family member.',
};

const qcGpiPstq = {
  id: 'ca-qc-gpi-pstq',
  kind: 'official_guidance' as const,
  instrument:
    'Ministère de l’Immigration, de la Francisation et de l’Intégration — Guide des procédures d’immigration, chapitre 3, section 3.10 : Programme de sélection des travailleurs qualifiés (1er juin 2026)',
  url: 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/immigration/publications-adm/gpi/02_GPI_ch3_sect1_PSTQ.pdf',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE DIRECTIVES. The guide describes itself as a collection of directives and an interpretive source ' +
    'framing decisions, and states that where it conflicts with the Act or the regulations the official text ' +
    'prevails in all circumstances. It records that the programme is open to principal applicants aged at least 18 ' +
    'who intend to settle in Quebec; that a declaration of interest is filed on the Arrima portal and ranked on ' +
    'human capital, labour-market and adaptation criteria; that only an invited person may file a permanent ' +
    'selection application; that the invitation criteria and their point values are set for each invitation round ' +
    'and published in the Gazette officielle du Québec; and that a selected applicant receives a selection decision ' +
    'with a Certificat de sélection du Québec. The Règlement sur la procédure en immigration (RLRQ chapitre ' +
    'I-0.2.1, r. 5), art. 5, sets the deadline for filing at 60 days after acceptance of the invitation, or ' +
    '12 months in the Volet 3 case of a person invited without the document required from the regulatory authority.',
};

const qcGpiPeq = {
  id: 'ca-qc-gpi-peq',
  kind: 'official_guidance' as const,
  instrument:
    'Ministère de l’Immigration, de la Francisation et de l’Intégration — Guide des procédures d’immigration, chapitre 3, section 3.4 : Programme de l’expérience québécoise (6 mars 2025)',
  url: 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/immigration/publications-adm/gpi/GPI_ch3_sect-3-2_PEQ.pdf',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE DIRECTIVES, AND OLDER THAN THE PROGRAMME IT DESCRIBES. Same status as the skilled-worker guide: ' +
    'directives that yield to the Act and the regulations. It records that the programme is open to principal ' +
    'applicants aged at least 18 who are in Quebec on a temporary stay, and that it has two volets — Diplômés du ' +
    'Québec and Travailleurs étrangers temporaires. This section is dated 6 March 2025, which is before the ' +
    'abolition of the programme on 19 November 2025 and before its temporary reactivation on 2 July 2026, so its ' +
    'selection conditions must be read against the reactivation notice rather than on their own.',
};

const qcPeqReouverture = {
  id: 'ca-qc-peq-reouverture',
  kind: 'official_guidance' as const,
  instrument:
    'Ministère de l’Immigration, de la Francisation et de l’Intégration — Programme de l’expérience québécoise (PEQ) : comprendre la réouverture du PEQ et la réception des demandes',
  url: 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/immigration/publications-adm/reouverture_peq.pdf',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE DECISION PUBLISHED BY THE MINISTÈRE, NOT A REGULATION. The programme was abolished on ' +
    '19 November 2025 and reactivated for a temporary period of two years from 2 July 2026. A first reception ' +
    'period runs from 2 July to 31 October 2026 in both volets, with no cap; further reception periods may be ' +
    'opened before the end of the programme depending on the volume received by 31 October. The reception criteria ' +
    'are keyed to the applicant’s situation as at 19 November 2025 — for the Diplômés volet, holding one of the ' +
    'listed Quebec diplomas by that date; for the Travailleurs étrangers temporaires volet, at least two years of ' +
    'admissible Quebec work experience in a National Occupational Classification TEER 0, 1, 2 or 3 job by that ' +
    'date, and holding such a job when the application is filed. Meeting the reception criteria only permits an ' +
    'application to be filed; the separate selection conditions are those in force at the abolition, except that ' +
    'the requirement to have studied in French in the Diplômés volet was removed.',
};

const qcPeqNews = {
  id: 'ca-qc-peq-reouverture-avis-2026-06-17',
  kind: 'official_guidance' as const,
  instrument:
    'Gouvernement du Québec — communiqué, Réouverture temporaire du Programme de l’expérience québécoise (PEQ), 17 juin 2026',
  url: 'https://www.quebec.ca/nouvelles/actualites/details/reouverture-temporaire-programme-experience-quebecoise-peq-71235',
  jurisdiction: 'CA-QC',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'GOVERNMENT ANNOUNCEMENT. Confirms the reopening from 2 July 2026 to 2 July 2028 and the reception period from ' +
    '2 July to 31 October 2026, opening at 08:30 Montréal time on 2 July 2026. It states that applications under ' +
    'this programme and under the Programme de sélection des travailleurs qualifiés are processed in parallel with ' +
    'neither expedited, that a person may file under both, and that the fees for each are payable separately and ' +
    'are not refunded.',
};

// ---------------------------------------------------------------------------
// Provincial Nominee Program — the framework
// ---------------------------------------------------------------------------

export const caProvincialNomineeProgram: Pathway = {
  id: 'ca-provincial-nominee-program',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Provincial Nominee Program — framework',
    es: 'Programa de Nominación Provincial — marco general',
  },
  summary: {
    en:
      'A federal permanent-residence class entered through a nomination certificate issued by a province or ' +
      'territory under its own streams. This record states how the framework works and does not encode any ' +
      'stream: whether a particular province would nominate a particular person is the whole question, and it ' +
      'is one only that province can answer.',
    es:
      'Una clase federal de residencia permanente a la que se accede mediante un certificado de nominación ' +
      'expedido por una provincia o un territorio conforme a sus propios programas. Este registro describe cómo ' +
      'funciona el marco y no codifica ningún programa provincial: si una provincia concreta nominaría a una ' +
      'persona concreta es toda la cuestión, y solo esa provincia puede responderla.',
  },
  citations: [
    irprS87,
    sor2026_63,
    pnpRias,
    irpaS10_3,
    expressEntryNominationPoints,
    nbPostNominationGuide,
    irpaS11_1,
    citizenshipActS5,
  ],
  criteria: [
    {
      id: 'ca-pnp-nomination-by-a-province',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87', 'ca-sor-2026-63', 'ca-pnp-rias-participation'],
      requiresHumanReview: true,
      label: {
        en: 'Named in a nomination certificate issued by a province or territory',
        es: 'Figurar en un certificado de nominación expedido por una provincia o un territorio',
      },
      // Forced to requires_human_review before this value is read. It tests the
      // one thing the criterion genuinely presupposes — that Canada is the
      // destination at all — so the report carries real evidence rather than a
      // placeholder.
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'Meridian encodes no provincial or territorial stream. Each jurisdiction writes its own criteria, revises ' +
          'them without notice, and opens and closes intake on its own schedule; answering a stream question with a ' +
          'generic rule would be worse than not answering it.',
        es:
          'Meridian no codifica ningún programa provincial ni territorial. Cada jurisdicción redacta sus propios ' +
          'criterios, los revisa sin previo aviso y abre y cierra la recepción según su propio calendario; responder ' +
          'a una pregunta sobre un programa concreto con una regla genérica sería peor que no responderla.',
      },
      guidance: {
        en:
          'Since 30 March 2026 the nominating province has sole responsibility for evaluating both the ability to ' +
          'become economically established and the intention to reside there; the federal officer no longer ' +
          'substitutes their own assessment of those. The nomination must be made under a nomination agreement in ' +
          'force with the Minister and in accordance with provincial selection criteria the Minister has approved ' +
          'in writing. Start with the province you actually want to live in, not with this record.',
        es:
          'Desde el 30 de marzo de 2026, la provincia que nomina tiene la responsabilidad exclusiva de evaluar tanto ' +
          'la capacidad de establecerse económicamente como la intención de residir en ella; el funcionario federal ' +
          'ya no sustituye esa valoración por la suya. La nominación debe hacerse al amparo de un acuerdo de ' +
          'nominación vigente con el Ministro y conforme a los criterios de selección provinciales que el Ministro ' +
          'haya aprobado por escrito. Empiece por la provincia en la que realmente quiere vivir, no por este registro.',
      },
    },
    {
      id: 'ca-pnp-not-destined-for-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87', 'ca-pnp-rias-participation'],
      label: {
        en: 'Intention to settle outside Quebec',
        es: 'Intención de establecerse fuera de Quebec',
      },
      evaluator: { op: 'is_true', path: 'intent.intendsToResideOutsideQuebec' },
      guidance: {
        en:
          'Quebec does not nominate. It selects its own permanent economic immigrants under the Canada–Québec ' +
          'Accord, so a person destined for Quebec is on the separate track modelled elsewhere in this catalog and ' +
          'not in the provincial nominee class. Nunavut also operates no nominee program. Meridian holds no fact ' +
          'recording which province or territory someone intends to settle in, so it can check only the Quebec ' +
          'side of that; a person intending to settle in Nunavut will not be caught here.',
        es:
          'Quebec no nomina. Selecciona a sus propios inmigrantes económicos permanentes al amparo del Acuerdo ' +
          'Canadá-Quebec, de modo que quien se destina a Quebec está en la vía separada que este catálogo modela ' +
          'aparte y no en la clase de nominados provinciales. Nunavut tampoco tiene programa de nominación. ' +
          'Meridian no registra a qué provincia o territorio se pretende ir, por lo que solo puede comprobar la ' +
          'parte relativa a Quebec; quien pretenda establecerse en Nunavut no quedará detectado aquí.',
      },
    },
    {
      id: 'ca-pnp-express-entry-linked-nomination',
      kind: 'procedural',
      weight: 'informational',
      citationIds: [
        'ca-irpa-s-10-3',
        'ca-express-entry-mi-nomination-points',
        'ca-nb-pnp-post-nomination-guide',
      ],
      requiresHumanReview: true,
      label: {
        en: 'Whether the nomination can be linked to an Express Entry profile',
        es: 'Si la nominación puede vincularse a un perfil de Express Entry',
      },
      // The Canadian Experience Class is the only federal economic class this
      // catalog encodes, so its day count is the only pool-eligibility signal
      // available. It is a partial signal and the criterion says so rather than
      // pretending it is the test.
      evaluator: { op: 'gte', path: 'derived.canadianSkilledWorkDaysLastThreeYears', value: 365 },
      humanReviewReason: {
        en:
          'A nomination can be linked to an Express Entry profile only if the candidate is already eligible for one ' +
          'of the three federal economic classes the pool draws on. Meridian encodes one of them, so it cannot tell ' +
          'you whether the pool is open to you, and provinces run Express Entry-linked and ordinary streams side by ' +
          'side under different rules.',
        es:
          'Una nominación solo puede vincularse a un perfil de Express Entry si la persona ya reúne los requisitos ' +
          'de alguna de las tres clases económicas federales de las que se nutre el fondo común. Meridian codifica ' +
          'una de ellas, por lo que no puede decirle si el fondo está abierto para usted, y las provincias mantienen ' +
          'en paralelo programas vinculados a Express Entry y programas ordinarios con reglas distintas.',
      },
      guidance: {
        en:
          'There are two routes after a nomination. A nomination that is not linked to an Express Entry profile ' +
          'is carried into an ordinary permanent-residence application, filed with the nomination certificate ' +
          'attached and before that certificate expires. A nomination that is linked adds 600 points to the ' +
          'candidate’s Comprehensive Ranking System score — the maximum of the additional-points block, so nothing ' +
          'further can be gained from it — which in practice determines the invitation. The points are withdrawn if ' +
          'the province revokes the nomination or the candidate declines it. Meridian does not record the score ' +
          'needed to be invited in any round, because that number is set round by round and predicting it would be ' +
          'a prediction of outcome.',
        es:
          'Tras la nominación hay dos vías. Una nominación no vinculada a un perfil de Express Entry se presenta en ' +
          'una solicitud ordinaria de residencia permanente, adjuntando el certificado de nominación y antes de que ' +
          'este caduque. Una nominación vinculada añade 600 puntos a la puntuación del Sistema Integral de ' +
          'Clasificación —el máximo del bloque de puntos adicionales, de modo que nada más puede sumarse por esa ' +
          'vía—, lo que en la práctica determina la invitación. Los puntos se retiran si la provincia revoca la ' +
          'nominación o si la persona la rechaza. Meridian no registra la puntuación necesaria para ser invitado en ' +
          'ninguna ronda, porque esa cifra se fija ronda a ronda y predecirla sería predecir un resultado.',
      },
    },
    {
      id: 'ca-pnp-nomination-not-based-on-capital',
      kind: 'economic',
      weight: 'material',
      citationIds: ['ca-irpr-s-87'],
      label: {
        en: 'No capital investment is recorded in support of the route',
        es: 'No consta ninguna inversión de capital en apoyo de la vía',
      },
      evaluator: { op: 'not', of: { op: 'is_present', path: 'qualifyingInvestment' } },
      humanReviewWhen: { op: 'is_present', path: 'qualifyingInvestment' },
      humanReviewReason: {
        en:
          'A capital investment is recorded. s. 87(5) excludes a nomination based on the provision of capital or on ' +
          'participation in an immigration-linked investment scheme, and the exception in s. 87(6) is narrow and ' +
          'fact-specific. Whether it applies has to be read against the actual investment terms by a person.',
        es:
          'Consta una inversión de capital. El art. 87(5) excluye la nominación basada en la aportación de capital o ' +
          'en la participación en un esquema de inversión vinculado a la inmigración, y la excepción del art. 87(6) ' +
          'es estrecha y depende de los hechos. Que resulte aplicable debe valorarlo una persona a la vista de las ' +
          'condiciones reales de la inversión.',
      },
      guidance: {
        en:
          'Absence of a recorded investment is not the same as a finding that the nomination was not capital-based; ' +
          'it only means Meridian has nothing on file to raise the question. The exception in s. 87(6) requires, ' +
          'among other things, that the capital go to a business in the nominating province that is not operated ' +
          'primarily to derive investment income, that the nominee hold a substantial share of its equity or make a ' +
          'substantial investment, that they actively manage it in that province, and that the investment carry no ' +
          'redemption option.',
        es:
          'Que no conste una inversión no equivale a declarar que la nominación no se basó en capital; solo ' +
          'significa que Meridian no tiene nada en el expediente que suscite la cuestión. La excepción del ' +
          'art. 87(6) exige, entre otras cosas, que el capital se destine a una empresa de la provincia que nomina ' +
          'que no se explote principalmente para obtener rentas de inversión, que la persona nominada posea una ' +
          'parte sustancial de su capital o realice una inversión sustancial, que la gestione activamente en esa ' +
          'provincia y que la inversión no lleve aparejada opción de reembolso.',
      },
    },
    {
      id: 'ca-pnp-admissibility',
      kind: 'character',
      weight: 'material',
      citationIds: ['ca-irpa-s-11-1'],
      label: {
        en: 'No declared criminal record standing against admissibility',
        es: 'No consta declaración de antecedentes penales que afecte a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A criminal record is declared. Inadmissibility is a federal legal determination with its own tests and ' +
          'its own relief, and it is not a question a checklist answers.',
        es:
          'Se declaran antecedentes penales. La inadmisibilidad es una determinación jurídica federal con sus ' +
          'propios criterios y sus propias vías de dispensa, y no es una cuestión que resuelva una lista de ' +
          'comprobación.',
      },
      guidance: {
        en:
          'A nomination does not cure inadmissibility. Selection and admission are separate decisions taken by ' +
          'separate governments, and the federal officer decides the second one whatever the province decided about ' +
          'the first. A self-declaration is what the applicant says, not what a police certificate shows.',
        es:
          'La nominación no subsana la inadmisibilidad. La selección y la admisión son decisiones separadas tomadas ' +
          'por gobiernos distintos, y el funcionario federal resuelve la segunda con independencia de lo que la ' +
          'provincia haya decidido sobre la primera. Una autodeclaración es lo que dice el solicitante, no lo que ' +
          'acredita un certificado de antecedentes.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-citizenship-act-s-5-1-c', 'ca-nb-pnp-post-nomination-guide'],
    note: {
      en:
        'Permanent residence is not time-limited, so no grant length is recorded. Two clocks do run, and both are ' +
        'set by the nominating province rather than by this record: the nomination certificate carries an expiry ' +
        'date and the federal application must be filed on or before it, and an Express Entry candidate who is ' +
        'invited has a fixed period — 60 days in New Brunswick’s published guidance — to submit. Meridian publishes ' +
        'no processing-time estimate for either route because no authority publishes a service standard for them.',
      es:
        'La residencia permanente no está limitada en el tiempo, por lo que no se registra duración de la concesión. ' +
        'Sí corren dos plazos, y ambos los fija la provincia que nomina y no este registro: el certificado de ' +
        'nominación lleva fecha de caducidad y la solicitud federal debe presentarse en esa fecha o antes, y quien ' +
        'sea invitado en Express Entry dispone de un plazo fijo —60 días según la guía publicada por Nuevo ' +
        'Brunswick— para presentarla. Meridian no publica estimación de plazos de tramitación para ninguna de las ' +
        'dos vías porque ninguna autoridad publica un estándar de servicio para ellas.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Quebec — the selection certificate and the federal class it unlocks
// ---------------------------------------------------------------------------

export const caQuebecSelectionCsq: Pathway = {
  id: 'ca-quebec-selection-csq',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Quebec selection certificate (CSQ) and the Quebec skilled worker class',
    es: 'Certificado de selección de Quebec (CSQ) y la clase de trabajador cualificado de Quebec',
  },
  summary: {
    en:
      'Quebec selects the permanent economic immigrants destined for its territory and Canada admits them. A ' +
      'Certificat de sélection du Québec issued under one of Quebec’s own programs is what makes a person a member ' +
      'of the federal Quebec skilled worker class; the federal application follows it and cannot precede it. This ' +
      'record states that structure. The conditions of each Quebec program are on the program records.',
    es:
      'Quebec selecciona a los inmigrantes económicos permanentes destinados a su territorio y Canadá los admite. ' +
      'Un Certificat de sélection du Québec expedido al amparo de uno de los programas propios de Quebec es lo que ' +
      'incorpora a una persona a la clase federal de trabajador cualificado de Quebec; la solicitud federal viene ' +
      'después y no puede precederlo. Este registro describe esa estructura. Las condiciones de cada programa ' +
      'quebequés figuran en los registros de cada programa.',
  },
  citations: [qcAccordArt12, irpaS9, irprS86, qcLoi, qcRiqArt108, irpaS11_1, citizenshipActS5],
  criteria: [
    {
      id: 'ca-qc-csq-intent-to-reside-in-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-86', 'ca-qc-accord-art-12'],
      label: {
        en: 'Intention to reside in the Province of Quebec',
        es: 'Intención de residir en la provincia de Quebec',
      },
      evaluator: { op: 'is_false', path: 'intent.intendsToResideOutsideQuebec' },
      guidance: {
        en:
          'The federal economic classes require an intention to reside outside Quebec and this class requires the ' +
          'opposite, so the two are mutually exclusive and a person has to choose which system they are in before ' +
          'anything else. This record covers permanent economic selection only. Family reunification is not ' +
          'selected by Quebec under the Accord provision cited here, and asylum, refugee protection and ' +
          'humanitarian or compassionate claims are outside this catalog entirely — those need a lawyer, a Quebec ' +
          'notary or a licensed immigration consultant, not an eligibility check.',
        es:
          'Las clases económicas federales exigen la intención de residir fuera de Quebec y esta clase exige lo ' +
          'contrario, de modo que son mutuamente excluyentes y hay que decidir en qué sistema se está antes que ' +
          'nada. Este registro abarca únicamente la selección económica permanente. La reagrupación familiar no la ' +
          'selecciona Quebec al amparo de la disposición del Acuerdo aquí citada, y el asilo, la protección de ' +
          'refugiados y las solicitudes humanitarias quedan por completo fuera de este catálogo: para esas vías ' +
          'hace falta un abogado, un notario de Quebec o un consultor de inmigración habilitado, no una ' +
          'comprobación de requisitos.',
      },
    },
    {
      id: 'ca-qc-csq-named-in-a-selection-certificate',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-86', 'ca-qc-loi-immigration'],
      requiresHumanReview: true,
      label: {
        en: 'Named in a Certificat de sélection du Québec issued by Quebec',
        es: 'Figurar en un Certificat de sélection du Québec expedido por Quebec',
      },
      // See the file header: forced to requires_human_review before this value
      // is read, and testing the one thing the criterion presupposes.
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'Meridian holds no fact recording a Quebec selection certificate, and whether one has been issued is the ' +
          'whole of this criterion. A certificate is obtained by being selected under one of Quebec’s own programs; ' +
          'there is no way to hold one without having gone through one of them.',
        es:
          'Meridian no registra ningún dato sobre un certificado de selección de Quebec, y si se ha expedido o no ' +
          'es todo el contenido de este criterio. El certificado se obtiene al ser seleccionado en uno de los ' +
          'programas propios de Quebec; no hay forma de tenerlo sin haber pasado por alguno de ellos.',
      },
      guidance: {
        en:
          'The certificate is a selection decision, not a status: it does not authorise anyone to enter, stay or ' +
          'work in Canada, and it is not permanent residence. What it does is make the federal application ' +
          'possible.',
        es:
          'El certificado es una decisión de selección, no un estatus: no autoriza a entrar, permanecer ni trabajar ' +
          'en Canadá, y no es residencia permanente. Lo que hace es posibilitar la solicitud federal.',
      },
    },
    {
      id: 'ca-qc-csq-admissibility-is-federal',
      kind: 'character',
      weight: 'material',
      citationIds: ['ca-irpa-s-9', 'ca-irpa-s-11-1'],
      label: {
        en: 'No declared criminal record standing against admissibility',
        es: 'No consta declaración de antecedentes penales que afecte a la admisibilidad',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewWhen: { op: 'is_false', path: 'criminalRecord.selfDeclaredClear' },
      humanReviewReason: {
        en:
          'A criminal record is declared. Inadmissibility is a federal determination with its own tests and its own ' +
          'relief, and a Quebec selection certificate does not reach it.',
        es:
          'Se declaran antecedentes penales. La inadmisibilidad es una determinación federal con sus propios ' +
          'criterios y sus propias vías de dispensa, y un certificado de selección de Quebec no alcanza a esa ' +
          'cuestión.',
      },
      guidance: {
        en:
          'Section 9 of the Act says a person who meets the province’s selection criteria shall be granted ' +
          'permanent resident status unless inadmissible. The exception carries the weight: Quebec decides ' +
          'selection and cannot decide admissibility, and a certificate in hand does not bind the federal officer ' +
          'on that question.',
        es:
          'El artículo 9 de la Ley establece que a quien cumpla los criterios de selección de la provincia se le ' +
          'concederá la residencia permanente salvo que sea inadmisible. La salvedad es lo determinante: Quebec ' +
          'decide la selección y no puede decidir la admisibilidad, y tener el certificado no vincula al ' +
          'funcionario federal en esa cuestión.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-qc-riq-art-108', 'ca-citizenship-act-s-5-1-c'],
    note: {
      en:
        'The selection decision, and the certificate issued with it, is valid for 24 months or until a decision is ' +
        'taken on the federal permanent-residence application, whichever comes first. There is no renewal, so the ' +
        'federal application has to be filed inside that window or the selection is lost. Permanent residence ' +
        'itself is not time-limited, and days held as a permanent resident count one for one toward the physical ' +
        'presence a grant of citizenship requires.',
      es:
        'La decisión de selección, y el certificado expedido con ella, tiene una validez de 24 meses o hasta que se ' +
        'resuelva la solicitud federal de residencia permanente, lo que ocurra primero. No es renovable, de modo ' +
        'que la solicitud federal debe presentarse dentro de ese plazo o se pierde la selección. La residencia ' +
        'permanente en sí no está limitada en el tiempo, y los días como residente permanente computan uno por uno ' +
        'para la presencia física que exige la concesión de la ciudadanía.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Quebec — Programme de sélection des travailleurs qualifiés
// ---------------------------------------------------------------------------

export const caQuebecSkilledWorkerPstq: Pathway = {
  id: 'ca-quebec-skilled-worker-pstq',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Quebec skilled worker selection program (PSTQ) — framework',
    es: 'Programa de selección de trabajadores cualificados de Quebec (PSTQ) — marco general',
  },
  summary: {
    en:
      'Quebec’s main permanent economic selection program. A declaration of interest is filed on the Arrima portal ' +
      'and ranked; only a person the Ministère invites may file a selection application, and a selected applicant ' +
      'receives a Certificat de sélection du Québec. Four volets cover the whole occupational range. This record ' +
      'states the shape of the program; it encodes none of the conditions of any volet.',
    es:
      'El principal programa de selección económica permanente de Quebec. Se presenta una declaración de interés en ' +
      'el portal Arrima y se clasifica; solo quien reciba una invitación del Ministère puede presentar una ' +
      'solicitud de selección, y quien resulte seleccionado recibe un Certificat de sélection du Québec. Cuatro ' +
      'vertientes cubren todo el espectro de profesiones. Este registro describe la forma del programa; no ' +
      'codifica ninguna de las condiciones de ninguna vertiente.',
  },
  citations: [qcRiqPstq, qcGpiPstq, qcLoi, qcAccordArt12, qcRiqArt108],
  criteria: [
    {
      id: 'ca-qc-pstq-invitation-required',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-qc-riq-pstq', 'ca-qc-gpi-pstq', 'ca-qc-loi-immigration'],
      requiresHumanReview: true,
      label: {
        en: 'Invited by the Ministère to file a permanent selection application',
        es: 'Invitado por el Ministère a presentar una solicitud de selección permanente',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'The invitation criteria and the minimum score are set for each invitation round and published in the ' +
          'Gazette officielle du Québec. Meridian does not carry them, and it does not predict which rounds will ' +
          'admit which profiles — a cut-off forecast is a prediction of outcome.',
        es:
          'Los criterios de invitación y la puntuación mínima se fijan para cada ronda de invitación y se publican ' +
          'en la Gazette officielle du Québec. Meridian no los incorpora ni predice qué rondas admitirán qué ' +
          'perfiles: pronosticar un corte es predecir un resultado.',
      },
      guidance: {
        en:
          'The declaration of interest is ranked on human-capital, labour-market and adaptation criteria. The ' +
          'number of people invited is set by the Ministère against the annual immigration plan, labour-market ' +
          'needs and processing capacity, so a profile that would have been invited in one round may not be in the ' +
          'next. Once an invitation is accepted the selection application is due within 60 days, or within ' +
          '12 months in the one Volet 3 case where the person was invited without the document required from the ' +
          'regulatory authority.',
        es:
          'La declaración de interés se clasifica según criterios de capital humano, mercado laboral y factores de ' +
          'adaptación. El número de personas invitadas lo fija el Ministère en función del plan anual de ' +
          'inmigración, las necesidades del mercado laboral y la capacidad de tramitación, por lo que un perfil que ' +
          'habría sido invitado en una ronda puede no serlo en la siguiente. Aceptada la invitación, la solicitud ' +
          'de selección debe presentarse en 60 días, o en 12 meses en el único supuesto de la vertiente 3 en que la ' +
          'persona fue invitada sin el documento exigido por la autoridad de regulación.',
      },
    },
    {
      id: 'ca-qc-pstq-volet-conditions',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-qc-riq-pstq', 'ca-qc-gpi-pstq'],
      requiresHumanReview: true,
      label: {
        en: 'Meets the general conditions and the specific conditions of one of the four volets',
        es: 'Cumple las condiciones generales y las condiciones específicas de una de las cuatro vertientes',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.occupationCode' },
      humanReviewReason: {
        en:
          'Meridian encodes none of the volet conditions. They turn on the principal occupation as classified under ' +
          'the National Occupational Classification, on French proficiency measured on a Quebec scale this engine ' +
          'does not convert to, and on regulated-profession documents issued by Quebec regulators.',
        es:
          'Meridian no codifica ninguna de las condiciones de las vertientes. Dependen de la profesión principal ' +
          'según la Clasificación nacional de profesiones, del dominio del francés medido en una escala quebequesa ' +
          'a la que este motor no convierte, y de documentos de profesión regulada expedidos por los organismos ' +
          'reguladores de Quebec.',
      },
      guidance: {
        en:
          'The four volets are Haute qualification et compétences spécialisées, Compétences intermédiaires et ' +
          'manuelles, Professions réglementées, and Talents d’exception. A candidate must satisfy the program’s ' +
          'general selection conditions and then the specific conditions of the one volet that fits their principal ' +
          'occupation; the volet is not a choice made for convenience. Every applicant in the file, and an ' +
          'accompanying spouse or partner aged 16 or over and dependent children aged 18 or over, must also obtain ' +
          'the attestation of learning about democratic values and Quebec values, which is valid for two years.',
        es:
          'Las cuatro vertientes son Haute qualification et compétences spécialisées, Compétences intermédiaires et ' +
          'manuelles, Professions réglementées y Talents d’exception. Hay que cumplir las condiciones generales de ' +
          'selección del programa y después las condiciones específicas de la única vertiente que corresponde a la ' +
          'profesión principal; la vertiente no se elige por conveniencia. Todas las personas incluidas en el ' +
          'expediente, así como el cónyuge o pareja que acompaña de 16 años o más y los hijos a cargo de 18 años o ' +
          'más, deben además obtener la atestación de aprendizaje de los valores democráticos y los valores ' +
          'quebequeses, válida por dos años.',
      },
    },
    {
      id: 'ca-qc-pstq-french',
      kind: 'language',
      weight: 'material',
      citationIds: ['ca-qc-riq-pstq', 'ca-qc-gpi-pstq'],
      requiresHumanReview: true,
      label: {
        en: 'French proficiency at the level the volet requires',
        es: 'Dominio del francés en el nivel que exige la vertiente',
      },
      evaluator: {
        op: 'collection_any',
        path: 'languageCertifications',
        where: { op: 'equals', path: 'language', value: 'fr' },
      },
      humanReviewReason: {
        en:
          'Quebec measures French on the Échelle québécoise des niveaux de compétence en français. Meridian records ' +
          'results on the CEFR, CLB and NCLC scales and carries no conversion to the Quebec scale, so a recorded ' +
          'French result cannot be turned into a Quebec level here. Inventing an equivalence would be inventing the ' +
          'threshold.',
        es:
          'Quebec mide el francés en la Échelle québécoise des niveaux de compétence en français. Meridian registra ' +
          'resultados en las escalas MCER, CLB y NCLC y no incorpora conversión a la escala quebequesa, por lo que ' +
          'un resultado de francés registrado no puede traducirse aquí a un nivel quebequés. Inventar una ' +
          'equivalencia sería inventar el umbral.',
      },
    },
    {
      id: 'ca-qc-pstq-principal-applicant-adult',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['ca-qc-gpi-pstq'],
      label: {
        en: 'Principal applicant aged 18 or over',
        es: 'Solicitante principal de 18 años o más',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'The age floor is stated in the Ministère’s procedures guide rather than quoted here from the Regulation, ' +
          'so it is weighted as material rather than blocking. A younger person may still be included in a parent’s ' +
          'application as an accompanying family member; the condition is about who may be the principal applicant.',
        es:
          'El límite de edad figura en la guía de procedimientos del Ministère y no se transcribe aquí desde el ' +
          'Reglamento, por lo que se pondera como material y no como bloqueante. Una persona más joven puede ' +
          'incluirse igualmente en la solicitud de un progenitor como familiar acompañante; la condición se refiere ' +
          'a quién puede ser el solicitante principal.',
      },
    },
    {
      id: 'ca-qc-pstq-intent-to-reside-in-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-qc-accord-art-12', 'ca-qc-riq-pstq'],
      label: {
        en: 'Intention to settle in Quebec',
        es: 'Intención de establecerse en Quebec',
      },
      evaluator: { op: 'is_false', path: 'intent.intendsToResideOutsideQuebec' },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['ca-qc-riq-art-108'],
    note: {
      en:
        'What this program produces is a selection decision and a Certificat de sélection du Québec, valid for ' +
        '24 months or until the federal permanent-residence application is decided, whichever comes first, and not ' +
        'renewable. It is not a status and confers no right to enter, remain or work, so no time under it counts ' +
        'toward naturalisation; the residence clock starts at permanent residence, on the record this one leads to.',
      es:
        'Lo que produce este programa es una decisión de selección y un Certificat de sélection du Québec, válido ' +
        '24 meses o hasta que se resuelva la solicitud federal de residencia permanente, lo que ocurra primero, y ' +
        'no renovable. No es un estatus y no confiere derecho a entrar, permanecer ni trabajar, por lo que el ' +
        'tiempo transcurrido bajo él no computa para la naturalización; el reloj de residencia empieza con la ' +
        'residencia permanente, en el registro al que este conduce.',
    },
  },
  leadsTo: ['ca-quebec-selection-csq'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Quebec — Programme de l’expérience québécoise
// ---------------------------------------------------------------------------

export const caQuebecExperiencePeq: Pathway = {
  id: 'ca-quebec-experience-peq',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Quebec experience program (PEQ) — framework, reactivated intake',
    es: 'Programa de la experiencia quebequesa (PEQ) — marco general, recepción reactivada',
  },
  summary: {
    en:
      'Quebec’s selection program for graduates of Quebec institutions and for temporary foreign workers already ' +
      'in Quebec. It was abolished on 19 November 2025 and reactivated for two years from 2 July 2026, with a ' +
      'first reception period running to 31 October 2026 and eligibility keyed to where the applicant stood on the ' +
      'abolition date. This record states that shape and the dates; it encodes none of the selection conditions.',
    es:
      'El programa de selección de Quebec para las personas tituladas por centros quebequeses y para los ' +
      'trabajadores extranjeros temporales que ya están en Quebec. Fue abolido el 19 de noviembre de 2025 y ' +
      'reactivado por dos años desde el 2 de julio de 2026, con un primer periodo de recepción hasta el 31 de ' +
      'octubre de 2026 y una elegibilidad anclada a la situación de la persona en la fecha de abolición. Este ' +
      'registro describe esa forma y esas fechas; no codifica ninguna de las condiciones de selección.',
  },
  citations: [qcPeqReouverture, qcPeqNews, qcRiqPeq, qcGpiPeq, qcAccordArt12, qcRiqArt108],
  criteria: [
    {
      id: 'ca-qc-peq-reception-period',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-qc-peq-reouverture', 'ca-qc-peq-reouverture-avis-2026-06-17'],
      label: {
        en: 'Application filed inside the reception period 2 July to 31 October 2026',
        es: 'Solicitud presentada dentro del periodo de recepción del 2 de julio al 31 de octubre de 2026',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'date_on_or_after', path: 'applicationLodgedOn', value: isoDate('2026-07-02') },
          { op: 'date_on_or_before', path: 'applicationLodgedOn', value: isoDate('2026-10-31') },
        ],
      },
      guidance: {
        en:
          'The reactivated program runs from 2 July 2026 to 2 July 2028, but applications are not received ' +
          'continuously across that period: the Ministère opens reception in windows. The first opened at 08:30 ' +
          'Montréal time on 2 July 2026 and closes on 31 October 2026, in both volets, with no cap on numbers. ' +
          'Whether further windows open depends on the volume received by 31 October, and that decision had not ' +
          'been published when this record was verified — check before relying on a date after it.',
        es:
          'El programa reactivado va del 2 de julio de 2026 al 2 de julio de 2028, pero las solicitudes no se ' +
          'reciben de forma continua durante todo ese periodo: el Ministère abre la recepción por ventanas. La ' +
          'primera se abrió a las 8:30, hora de Montreal, del 2 de julio de 2026 y se cierra el 31 de octubre de ' +
          '2026, en ambas vertientes y sin límite de número. Que se abran más ventanas depende del volumen recibido ' +
          'hasta el 31 de octubre, y esa decisión no estaba publicada cuando se verificó este registro: compruébelo ' +
          'antes de confiar en una fecha posterior.',
      },
    },
    {
      id: 'ca-qc-peq-reception-criteria',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-qc-peq-reouverture'],
      requiresHumanReview: true,
      label: {
        en: 'Meets the reception criteria, measured as at 19 November 2025',
        es: 'Cumple los criterios de recepción, medidos a 19 de noviembre de 2025',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'The reception criteria turn on a Quebec diploma of a listed kind, or on Quebec work experience, held as ' +
          'at 19 November 2025. Meridian records the country an education or a job sits in but not the province, ' +
          'and it cannot measure a two-year Quebec work history against a fixed past date, so it cannot decide ' +
          'either limb.',
        es:
          'Los criterios de recepción dependen de un diploma quebequés de alguno de los tipos enumerados, o de ' +
          'experiencia laboral en Quebec, poseídos a 19 de noviembre de 2025. Meridian registra el país en el que ' +
          'se sitúa una formación o un empleo, pero no la provincia, y no puede medir dos años de experiencia ' +
          'laboral en Quebec frente a una fecha pasada fija, por lo que no puede resolver ninguno de los dos ' +
          'supuestos.',
      },
      guidance: {
        en:
          'The reactivation targets people who already qualified when the program was abolished. In the Diplômés ' +
          'du Québec volet the applicant must have held, in Quebec and as at 19 November 2025, a bachelor’s, ' +
          'master’s or doctoral degree, a technical diploma of college studies, a diploma of vocational studies of ' +
          '1,800 hours or more, or such a diploma followed by an attestation of professional specialisation ' +
          'totalling 1,800 hours or more, and must be in Quebec when the application is filed. In the Travailleurs ' +
          'étrangers temporaires volet the applicant must have held, as at that date, at least two years of ' +
          'admissible Quebec work experience in a job in National Occupational Classification TEER category 0, 1, ' +
          '2 or 3, and must hold such a job when the application is filed. Meeting these criteria only permits the ' +
          'application to be filed; it is not selection.',
        es:
          'La reactivación se dirige a quienes ya reunían los requisitos cuando el programa fue abolido. En la ' +
          'vertiente Diplômés du Québec hay que haber obtenido en Quebec, a 19 de noviembre de 2025, un grado, un ' +
          'máster o un doctorado, un diploma de estudios colegiales técnicos, un diploma de estudios profesionales ' +
          'de 1.800 horas o más, o ese diploma seguido de una atestación de especialización profesional que sume ' +
          '1.800 horas o más, y hay que estar en Quebec al presentar la solicitud. En la vertiente Travailleurs ' +
          'étrangers temporaires hay que haber acumulado, a esa misma fecha, al menos dos años de experiencia ' +
          'laboral admisible en Quebec en un empleo de las categorías TEER 0, 1, 2 o 3 de la Clasificación ' +
          'nacional de profesiones, y ocupar un empleo así al presentar la solicitud. Cumplir estos criterios solo ' +
          'permite presentar la solicitud; no es la selección.',
      },
    },
    {
      id: 'ca-qc-peq-selection-conditions',
      kind: 'integration',
      weight: 'blocking',
      citationIds: ['ca-qc-riq-peq', 'ca-qc-gpi-peq', 'ca-qc-peq-reouverture'],
      requiresHumanReview: true,
      label: {
        en: 'Meets the selection conditions of the volet applied under',
        es: 'Cumple las condiciones de selección de la vertiente por la que se solicita',
      },
      evaluator: {
        op: 'collection_any',
        path: 'languageCertifications',
        where: { op: 'equals', path: 'language', value: 'fr' },
      },
      humanReviewReason: {
        en:
          'The selection conditions include French measured on the Échelle québécoise des niveaux de compétence en ' +
          'français, which Meridian does not convert to from the scales it records. They also include an ' +
          'undertaking to provide for essential needs and, in the Diplômés volet, that the applicant was not the ' +
          'holder of a scholarship carrying an obligation to return home — neither of which Meridian holds a fact ' +
          'for.',
        es:
          'Las condiciones de selección incluyen el francés medido en la Échelle québécoise des niveaux de ' +
          'compétence en français, escala a la que Meridian no convierte desde las que registra. Incluyen también ' +
          'el compromiso de subvenir a las necesidades esenciales y, en la vertiente Diplômés, no haber sido ' +
          'titular de una beca con obligación de retorno al país de origen; Meridian no registra ninguno de esos ' +
          'dos datos.',
      },
      guidance: {
        en:
          'Reception and selection are two different tests and passing the first does not imply the second: a ' +
          'person may be allowed to file and still be refused. The selection conditions are those that were in ' +
          'force when the program was abolished on 19 November 2025, with one change — the requirement in the ' +
          'Diplômés du Québec volet to have studied in a French-language program has been removed. Both volets also ' +
          'require the attestation of learning about democratic values and Quebec values.',
        es:
          'Recepción y selección son dos pruebas distintas y superar la primera no implica la segunda: se puede ' +
          'admitir la presentación de la solicitud y aun así denegarla. Las condiciones de selección son las que ' +
          'estaban en vigor cuando el programa fue abolido, el 19 de noviembre de 2025, con un cambio: se ha ' +
          'suprimido la exigencia, en la vertiente Diplômés du Québec, de haber cursado un programa de estudios en ' +
          'francés. Ambas vertientes exigen además la atestación de aprendizaje de los valores democráticos y los ' +
          'valores quebequeses.',
      },
    },
    {
      id: 'ca-qc-peq-principal-applicant-adult',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['ca-qc-gpi-peq'],
      label: {
        en: 'Principal applicant aged 18 or over',
        es: 'Solicitante principal de 18 años o más',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'Stated in the Ministère’s procedures guide rather than quoted here from the Regulation, so it is ' +
          'weighted as material rather than blocking.',
        es:
          'Figura en la guía de procedimientos del Ministère y no se transcribe aquí desde el Reglamento, por lo ' +
          'que se pondera como material y no como bloqueante.',
      },
    },
    {
      id: 'ca-qc-peq-intent-to-reside-in-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-qc-accord-art-12', 'ca-qc-riq-peq'],
      label: {
        en: 'Intention to settle in Quebec',
        es: 'Intención de establecerse en Quebec',
      },
      evaluator: { op: 'is_false', path: 'intent.intendsToResideOutsideQuebec' },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['ca-qc-riq-art-108', 'ca-qc-peq-reouverture-avis-2026-06-17'],
    note: {
      en:
        'Like the skilled-worker program, this one produces a selection decision and a Certificat de sélection du ' +
        'Québec valid for 24 months or until the federal permanent-residence application is decided, whichever ' +
        'comes first, and not renewable. It is not a status, so no time under it counts toward naturalisation. The ' +
        'Ministère has said applications under this program and under the skilled-worker program are processed in ' +
        'parallel and neither is expedited; a person may file under both, and the fees for each are payable ' +
        'separately and are not refunded. Meridian publishes no processing-time estimate, because none has been ' +
        'published.',
      es:
        'Igual que el programa de trabajadores cualificados, este produce una decisión de selección y un Certificat ' +
        'de sélection du Québec válido 24 meses o hasta que se resuelva la solicitud federal de residencia ' +
        'permanente, lo que ocurra primero, y no renovable. No es un estatus, por lo que el tiempo transcurrido ' +
        'bajo él no computa para la naturalización. El Ministère ha señalado que las solicitudes de este programa y ' +
        'las del programa de trabajadores cualificados se tramitan en paralelo y ninguna se acelera; se puede ' +
        'presentar solicitud en ambos, y las tasas de cada uno se pagan por separado y no se reembolsan. Meridian ' +
        'no publica estimación de plazos de tramitación, porque no se ha publicado ninguna.',
    },
  },
  leadsTo: ['ca-quebec-selection-csq'],
  reviewStatus: 'unreviewed',
};

export const CA_PROVINCIAL_QUEBEC_PATHWAYS: readonly Pathway[] = [
  caProvincialNomineeProgram,
  caQuebecSelectionCsq,
  caQuebecSkilledWorkerPstq,
  caQuebecExperiencePeq,
];
