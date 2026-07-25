/**
 * The legal and administrative provenance behind every capability, handoff and
 * validation rule in this package.
 *
 * Two deliberate omissions run through this catalog and are worth stating up
 * front, because they look like gaps and are not:
 *
 * 1. **Missing `url` is intentional.** A citation whose URL is wrong is worse
 *    than one with no URL: the reader follows it, lands on something plausible
 *    but different, and stops checking. Where the exact gazette identifier or
 *    deep path could not be confirmed, the instrument is named precisely and the
 *    URL is left off, or points at the issuing body's root rather than a guessed
 *    path.
 *
 * 2. **`discretionary: true` is used heavily.** Almost everything a government
 *    *portal* does — registration routes, appointment capacity, which browser it
 *    supports, how long a queue is — is administrative practice, published by the
 *    operating body and changeable without notice or debate. It is not law, and
 *    presenting it as law is how a platform ends up telling someone their file is
 *    fine when the office changed its rules last month. Where the flag is set,
 *    consumers must surface the note rather than the number.
 */

import type { Citation } from '@meridian/core';
import type { IsoDate } from '@meridian/core';

/** Single verification date for this catalog. Every entry was checked in one pass. */
const VERIFIED_ON = '2026-07-25' as IsoDate;

/* -------------------------------------------------------------------------- */
/* Spain                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The provision that makes agreed-key systems such as Cl@ve a lawful way for a
 * person to identify themselves to Spanish public administrations — and, read
 * with art. 12, the reason Meridian's job is to get the *user* through the door
 * rather than to walk through it wearing their face.
 */
export const ES_LEY_39_2015_ART_9: Citation = {
  id: 'es-ley-39-2015-art-9',
  kind: 'statute',
  instrument: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
  provision: 'art. 9',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Identification of interested parties before Spanish public administrations, including systems based ' +
    'on agreed keys (claves concertadas), of which Cl@ve is the State-level implementation.',
};

/**
 * Assistance in the use of electronic means.
 *
 * This is the single most important citation in the package. Spanish
 * administrative law already answers the question the PRD asked the wrong way:
 * where a person cannot act electronically, the answer is *assistance* — and,
 * through a `funcionario habilitado`, action on their behalf only with their
 * express, recorded consent and with the official's identity on the record. The
 * statute contemplates an accountable, auditable, consenting human chain. It does
 * not contemplate a private platform silently holding the citizen's authenticator
 * and typing as them. `buildHandoff` is the software shape of art. 12.
 */
export const ES_LEY_39_2015_ART_12: Citation = {
  id: 'es-ley-39-2015-art-12',
  kind: 'statute',
  instrument: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
  provision: 'art. 12',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Assistance to interested parties in the use of electronic means. Where action on behalf of the ' +
    'interested party is contemplated at all, it runs through officials designated for the purpose and ' +
    'requires the express consent of the interested party, recorded. Verify the current wording and the ' +
    'applicable register of designated officials before relying on this in a live matter.',
};

/** The Cl@ve system itself, as published by the bodies that operate it. */
export const ES_CLAVE_PORTAL: Citation = {
  id: 'es-clave-portal',
  kind: 'official_guidance',
  instrument: 'Cl@ve — sistema de identificación, autenticación y firma electrónica para las Administraciones Públicas españolas',
  url: 'https://clave.gob.es/',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Registration routes, supported authentication methods and their naming are administrative practice ' +
    'set by the operating bodies and have changed repeatedly (for example the shift of PIN delivery from ' +
    'SMS towards a mobile application). Verify the current routes on the official portal before acting.',
};

/**
 * Registration by video call.
 *
 * Encoded as guidance rather than law on purpose. There is no statutory right to
 * be registered in Cl@ve by video call: it is a channel the operating body opens,
 * staffs, and can restrict — including by appointment capacity, by hours, and by
 * who is eligible to use it. Telling a user this is a guaranteed route, and then
 * having them find no appointments for six weeks, is the failure mode.
 */
export const ES_CLAVE_VIDEO_REGISTRATION: Citation = {
  id: 'es-clave-registro-videollamada',
  kind: 'official_guidance',
  instrument: 'Agencia Estatal de Administración Tributaria — registro en Cl@ve por videollamada (sede electrónica)',
  url: 'https://sede.agenciatributaria.gob.es/',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Availability, eligibility, appointment capacity and the technical requirements for video ' +
    'identification are administrative practice set by the operating body, not a statutory entitlement. ' +
    'The technical requirements encoded in this package are the ordinary operational conditions of a ' +
    'supervised video identification and must be confirmed against the current published instructions.',
};

/** The statute behind the individual-record civil registry model that DICIREG implements. */
export const ES_LEY_20_2011_REGISTRO_CIVIL: Citation = {
  id: 'es-ley-20-2011-registro-civil',
  kind: 'statute',
  instrument: 'Ley 20/2011, de 21 de julio, del Registro Civil',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Establishes the electronic, person-centred (individual record) model of the Spanish civil registry ' +
    'that replaced the book-and-entry model. Entry into force was staged and the practical availability ' +
    'of any given record depends on the rollout state of the office holding it.',
};

/**
 * DICIREG as an operational reality rather than a switch that was flipped.
 *
 * The rollout ran office by office, and whether a particular birth entry from
 * 1974 in a particular municipality is electronically retrievable is a question
 * about that office's digitisation backlog — not about the law. An integration
 * that assumes national electronic coverage will fail for exactly the older
 * records that migration matters need most.
 */
export const ES_DICIREG_ROLLOUT: Citation = {
  id: 'es-dicireg-rollout',
  kind: 'official_guidance',
  instrument: 'Ministerio de Justicia (España) — sede electrónica, Registro Civil (aplicación DICIREG)',
  url: 'https://sede.mjusticia.gob.es/',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Deployment of the digital civil registry proceeded progressively by registry office. Whether a given ' +
    'entry is available electronically depends on the office holding it and on whether that entry has been ' +
    'digitised; older entries frequently have not been. Verify per office.',
};

/** The consular civil registry — the route that actually works today for events registered abroad. */
export const ES_REGISTRO_CIVIL_CONSULAR: Citation = {
  id: 'es-registro-civil-consular',
  kind: 'official_guidance',
  instrument: 'Ministerio de Asuntos Exteriores, Unión Europea y Cooperación — Registro Civil Consular',
  url: 'https://www.exteriores.gob.es/',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Each consular office publishes its own appointment procedure, accepted evidence and delivery ' +
    'options. Confirm with the specific office with jurisdiction over the applicant\'s place of residence.',
};

/**
 * Multilingual extracts, and why they are worth asking for by name.
 *
 * A migration file routinely needs a Spanish birth record accepted by a second
 * state. A multilingual extract issued under ICCS Convention No. 16 is accepted
 * between contracting states without legalisation or apostille, which removes an
 * entire sub-process from the matter. It only works between contracting states,
 * so the destination must be checked — hence this is encoded as a fact about the
 * instrument, never as a recommendation to choose that form.
 */
export const ICCS_CONVENTION_16_MULTILINGUAL_EXTRACTS: Citation = {
  id: 'iccs-conv-16-multilingual-extracts',
  kind: 'treaty',
  instrument:
    'Convention No. 16 of the International Commission on Civil Status on the issue of multilingual extracts from civil-status records (Vienna, 8 September 1976)',
  jurisdiction: 'X-EU',
  verifiedOn: VERIFIED_ON,
  note:
    'Multilingual extracts issued under this Convention are accepted between contracting states without ' +
    'further legalisation. The exemption depends on the destination state being a contracting party — ' +
    'confirm party status for the specific destination before relying on it.',
};

/**
 * eIDAS assurance levels.
 *
 * Relevant because "Meridian authenticated the user" is meaningless without a
 * level. A delegated identity assertion is only worth what its assurance level
 * says it is worth, and which Cl@ve method yields which level is set by the
 * scheme, not by us.
 */
export const EU_EIDAS_ASSURANCE_LEVELS: Citation = {
  id: 'eu-eidas-910-2014-art-8',
  kind: 'regulation',
  instrument: 'Regulation (EU) No 910/2014 on electronic identification and trust services (eIDAS)',
  provision: 'art. 8',
  jurisdiction: 'X-EU',
  verifiedOn: VERIFIED_ON,
  note:
    'Establishes the low / substantial / high assurance levels for electronic identification means. ' +
    'Which Cl@ve authentication method is notified at which level is determined by the scheme and must be ' +
    'read from the scheme\'s own publication, not assumed.',
};

/* -------------------------------------------------------------------------- */
/* Canada                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The reserved-representation offence.
 *
 * Cited on IRCC capabilities because it constrains what this package may emit,
 * not what the portal does: an adapter that ranked exemption codes or predicted
 * an outcome would be producing `advice` within the meaning of
 * `@meridian/core`'s disclosure boundary, and s. 91 is why that gate exists.
 */
export const CA_IRPA_S91: Citation = {
  id: 'ca-irpa-s91',
  kind: 'statute',
  instrument: 'Immigration and Refugee Protection Act (S.C. 2001, c. 27)',
  provision: 's. 91',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/i-2.5/',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Representing or advising a person for consideration in connection with a proceeding or application ' +
    'under the Act is reserved to authorised persons. Outputs of this package are limited to information ' +
    'and assessment for that reason.',
};

/** The employer-compliance framework the offer-of-employment package sits inside. */
export const CA_IRPR_EMPLOYER_OBLIGATIONS: Citation = {
  id: 'ca-irpr-employer-obligations',
  kind: 'regulation',
  instrument: 'Immigration and Refugee Protection Regulations (SOR/2002-227)',
  url: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'An employer offering employment to a foreign national under an LMIA-exempt work permit provides the ' +
    'offer of employment through the designated electronic system before the work permit application is ' +
    'made, and is subject to the employer-compliance regime. The specific section applicable to a given ' +
    'exemption is not encoded here — counsel must confirm it for the matter at hand.',
};

/** The portal itself: procedure, fields and fees are administrative, not statutory. */
export const CA_IRCC_EMPLOYER_PORTAL: Citation = {
  id: 'ca-ircc-employer-portal',
  kind: 'official_guidance',
  instrument: 'Immigration, Refugees and Citizenship Canada — Employer Portal (offer of employment, LMIA-exempt work permits)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Portal enrolment, form fields, the employer compliance fee and its amount are published by IRCC and ' +
    'change without notice. Fee amounts are deliberately not encoded in this package; read the current ' +
    'published fee at the time of payment.',
};

/**
 * Published processing times.
 *
 * The most misread number in corporate mobility. It is a backward-looking
 * measure of how long past applications took, it is republished frequently, and
 * the clock it describes does not start when the applicant starts working on the
 * file — it starts when a *complete* application is received. Quoting the
 * headline figure to an employer as "the time it will take" is how start dates
 * get blown, which is precisely why the estimator in this package refuses to
 * report a single number.
 */
export const CA_IRCC_PROCESSING_TIMES: Citation = {
  id: 'ca-ircc-processing-times',
  kind: 'official_guidance',
  instrument: 'Immigration, Refugees and Citizenship Canada — published application processing times',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Published processing times are a historical measure of past cases, updated frequently. They are not ' +
    'a service guarantee, and the period they describe runs from receipt of a complete application, not ' +
    'from the day work on the file begins.',
};

/** Biometrics: a real, separately-clocked step that the headline figure assumes away. */
export const CA_IRCC_BIOMETRICS: Citation = {
  id: 'ca-ircc-biometrics',
  kind: 'official_guidance',
  instrument: 'Immigration, Refugees and Citizenship Canada — biometrics requirement and collection',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Where biometrics are required, an instruction letter is issued after the application is made and ' +
    'collection happens at a designated site. Appointment availability varies by location and is outside ' +
    'both the applicant\'s and IRCC\'s published processing clock.',
};

/**
 * The account credential the platform will not hold.
 *
 * Cited on the refusal capability so that the refusal points at something real
 * rather than at Meridian's own opinion of itself.
 */
export const CA_IRCC_SECURE_ACCOUNT: Citation = {
  id: 'ca-ircc-secure-account',
  kind: 'official_guidance',
  instrument: 'Immigration, Refugees and Citizenship Canada — secure account sign-in (GCKey / sign-in partner)',
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Access to an applicant\'s or employer\'s secure account is governed by that account\'s published terms ' +
    'of use. Meridian does not accept custody of the sign-in credential in any case; see the credential ' +
    'custody policy in this package.',
};

/** NOC 2021, used to validate the occupation code on an offer-of-employment package. */
export const CA_NOC_2021: Citation = {
  id: 'ca-noc-2021',
  kind: 'official_guidance',
  instrument: 'National Occupational Classification (NOC) 2021',
  url: 'https://noc.esdc.gc.ca/',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'NOC 2021 codes are five digits. The second digit is the TEER category (0-5). This package validates ' +
    'the code\'s shape only; whether the chosen code correctly describes the duties is a human judgement.',
};

/** Everything above, for catalog-level checks and admin display. */
export const GOVTECH_CITATIONS: readonly Citation[] = Object.freeze([
  ES_LEY_39_2015_ART_9,
  ES_LEY_39_2015_ART_12,
  ES_CLAVE_PORTAL,
  ES_CLAVE_VIDEO_REGISTRATION,
  ES_LEY_20_2011_REGISTRO_CIVIL,
  ES_DICIREG_ROLLOUT,
  ES_REGISTRO_CIVIL_CONSULAR,
  ICCS_CONVENTION_16_MULTILINGUAL_EXTRACTS,
  EU_EIDAS_ASSURANCE_LEVELS,
  CA_IRPA_S91,
  CA_IRPR_EMPLOYER_OBLIGATIONS,
  CA_IRCC_EMPLOYER_PORTAL,
  CA_IRCC_PROCESSING_TIMES,
  CA_IRCC_BIOMETRICS,
  CA_IRCC_SECURE_ACCOUNT,
  CA_NOC_2021,
]);

/** Look a citation up by id. `null` rather than a throw — callers render "unknown source". */
export function findCitation(id: string): Citation | null {
  return GOVTECH_CITATIONS.find((c) => c.id === id) ?? null;
}
