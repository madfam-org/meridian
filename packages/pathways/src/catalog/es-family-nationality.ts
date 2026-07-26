/**
 * Spain — family routes and the remaining nationality routes.
 *
 * Seven pathways: two family routes under the 2025 Reglamento and the free-
 * movement Real Decreto, the permanent-residence stage of the latter, and four
 * nationality routes (option, the closed Democratic Memory option, *carta de
 * naturaleza*, and the Sephardic limb of the two-year residence period that
 * `es.ts` records as unmodelled).
 *
 * Everything here is `reviewStatus: 'unreviewed'`. Nothing in this file has
 * been read by a licensed person, and until one has, none of it may enter an
 * advice-class recommendation.
 *
 * ## Two people, one fact model
 *
 * Family routes are about a *pair*: a sponsor and a relative, or a Union
 * citizen and their spouse. {@link import('../facts.js').ApplicantFacts} holds
 * one person. So the family tie itself — the single most decisive element of
 * every route in this file — cannot be evaluated here, and neither can the
 * sponsor-side tests that depend on household composition.
 *
 * Those criteria are encoded with `requiresHumanReview: true` rather than
 * pointed at a fact path that would resolve to `unknown` for every applicant
 * forever. The consequence is deliberate and worth stating plainly: **every
 * pathway in this file returns `requires_human_review`**, because that is the
 * truthful answer. The criteria that *are* about the applicant still evaluate
 * and still appear in the report, so a sponsor with four months of residence
 * reads that limb as unmet even though the verdict escalates.
 *
 * Where a criterion is escalated because the facts model says nothing at all
 * about its subject, its evaluator is `is_present` on `applicantId`. That is a
 * marker, not a test: `applicantId` is the one field that is always present,
 * and reading it produces a trace line that says so. The criterion's guidance
 * states in both languages that the engine read nothing. The alternative —
 * inventing a fact path — would fail the integrity checker; the other
 * alternative, dressing an unrelated field as evidence, would be worse.
 *
 * ## Out of scope
 *
 * Asylum, refugee protection and humanitarian claims are excluded from this
 * catalog by decision, and two provisions touched here sit next to that line
 * without crossing it. Art. 69.2.b) of the Reglamento gives a reunited family
 * member independent residence, regardless of time, where they are a victim of
 * gender violence, sexual violence, violence in the family setting or
 * trafficking; that turns on protection assessments and is not encoded — the
 * guidance points to qualified legal help instead. Código Civil art. 22.1 also
 * sets a five-year naturalisation period for people who have obtained refugee
 * status; that is a residence-period rule rather than a test of who qualifies
 * for protection, but it needs a fact this catalog does not hold, so it is not
 * encoded either.
 */

import {
  countryCode,
  isoDate,
  SPAIN_NO_RENUNCIATION_NATIONALITIES,
  type CountryCode,
} from '@meridian/core';
import { CEFR_SCALE } from '../facts.js';
import type { Pathway } from '../schema.js';
import { SPANISH_OFFICIAL_LANGUAGE_COUNTRIES } from './es.js';

const ES: CountryCode = countryCode('ES');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

/**
 * States whose nationals hold free-movement rights in their own name, and who
 * therefore register under art. 7 of Real Decreto 240/2007 instead of applying
 * for a family-member card under art. 8.
 *
 * The European Union's 27 member states plus Iceland, Liechtenstein and Norway,
 * which are the parties to the Agreement on the European Economic Area that are
 * not EU members. Art. 8.1 confines the card to family members who do not hold
 * the nationality of one of *those* states, which is why the list stops there:
 * Switzerland is brought inside the same regime by disposición adicional
 * tercera rather than by art. 8, and a Swiss national is not a national of an
 * EU or EEA state. That distinction is recorded in the criterion guidance
 * rather than resolved here.
 *
 * The United Kingdom is absent because it left the European Union on
 * 31 January 2020. UK nationals resident in Spain before the end of the
 * transition period, and their family members, hold rights under the Withdrawal
 * Agreement rather than under this Real Decreto. That regime was not researched
 * for this file and is not modelled.
 */
export const EU_EEA_NATIONALITIES: readonly CountryCode[] = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU',
  'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
].map((c) => countryCode(c));

// ---------------------------------------------------------------------------
// Citations
//
// Citation ids in this file are deliberately distinct from those in `es.ts`.
// The catalog guard enforces one instrument per id across the whole catalog,
// and a second file re-declaring `es-cc-art-22-3` with a different note would
// leave a footnote resolving to whichever record loaded last. Distinct ids with
// exact pin-cites cost a little duplication and remove that hazard entirely.
// ---------------------------------------------------------------------------

const RLOEX_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099';
const RD240_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-4184';
const CC_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763';

const rloexArt65 = {
  id: 'es-rd-1155-2024-art-65',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 65',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Defines residence by family reunification as the position of a foreign national authorised to reside in ' +
    'Spain by virtue of the right of reunification exercised by a foreign national who is already resident. ' +
    'Art. 65.2 gives the reunited spouse, registered or stable partner and children the right to work, employed ' +
    'or self-employed, anywhere in Spain and in any occupation, with no further administrative step, once they ' +
    'are over the minimum working age.',
};

const rloexArt66 = {
  id: 'es-rd-1155-2024-art-66',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 66',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The relatives who may be reunited: a spouse over eighteen who is not separated in fact or in law and whose ' +
    'marriage was not contracted in fraud of law; an unmarried partner over eighteen in a relationship analogous ' +
    'to marriage, either registered in a public register in an EU member state or proved as a stable relationship ' +
    'with at least twelve continuous months of cohabitation, which is not required where the couple have children ' +
    'in common; children of the sponsor or of the spouse or partner who are under eighteen at the date of the ' +
    'application, or older with a disability requiring support, or older and objectively unable to provide for ' +
    'their own needs because of their state of health; persons under the sponsor’s legal representation on the ' +
    'same terms; first-degree ascendants of the sponsor or of the spouse or partner who are dependent, over ' +
    'sixty-five, and where reasons justify authorising their residence, with an exceptional humanitarian route ' +
    'below sixty-five; and an adult child who is to act as carer where the sponsor holds a recognised degree of ' +
    'dependency under art. 26 of Ley 39/2006. No more than one spouse may ever be reunited.',
};

const rloexArt67 = {
  id: 'es-rd-1155-2024-art-67',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 67',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'What the sponsor must show: fixed and regular resources equivalent to 150% of the IPREM for a family unit ' +
    'made up of the sponsor and one reunited relative, plus 50% of the IPREM for each additional member, with a ' +
    'reduction available in the best interests of a child; adequate housing, evidenced by a report from the ' +
    'competent regional or local social services issued within one month and no more than six months old at the ' +
    'date of the application; health insurance for the sponsor and the relatives; enrolment in school of any ' +
    'dependent children of compulsory school age already in Spain; not being inside a no-return commitment ' +
    'period; not being a threat to public order, public security or public health; and payment of the fee.',
};

const rloexArt68 = {
  id: 'es-rd-1155-2024-art-68',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 68',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The application may be lodged once the sponsor has resided in Spain for at least one year and has applied ' +
    'for an authorisation to reside for at least one more year. Two express exceptions: a long-term resident or ' +
    'EU long-term resident reuniting ascendants may lodge once the long-term application is made, and a person ' +
    'resident in Spain on the basis of prior EU long-term residence in another member state is not held to the ' +
    'one-year rule. The office must decide within two months and silence is a refusal. Art. 68.4 states that the ' +
    'existence of entries in the police report is not by itself and automatically a ground of refusal; the case ' +
    'is assessed individually. Art. 68.9 sets the length of the grant: it runs to the same date as the sponsor’s ' +
    'own authorisation, with a minimum of one year.',
};

const rloexArt69 = {
  id: 'es-rd-1155-2024-art-69',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 69',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'A reunited spouse or partner may obtain residence and work authorisation independent of the sponsor after ' +
    'completing at least one year of residence by reunification and meeting one of three alternative conditions. ' +
    'Independent residence is also available on the breakdown of the bond, on the sponsor’s death, and — ' +
    'regardless of time resided or lived together — to victims of gender violence, sexual violence, violence in ' +
    'the family setting and trafficking. Meridian does not assess the victim routes.',
};

const rloexArt71 = {
  id: 'es-rd-1155-2024-art-71',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 71',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Renewal must be applied for in the two months before the authorisation expires, or within the three months ' +
    'after, without prejudice to a penalty procedure. The family bond must subsist, and dependent children of ' +
    'compulsory school age must be in school.',
};

const rloexFamiliaresEspanoles = {
  id: 'es-rd-1155-2024-familiares-espanoles',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'Título IV, Capítulo VII, arts. 93-99',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Residence of family members of Spanish nationals is regulated here, in the Reglamento, and not by the free-' +
    'movement Real Decreto. Which regime governs the relative of a Spanish national who has not exercised free ' +
    'movement is a contested question — the Tribunal Supremo annulled words in art. 2 of Real Decreto 240/2007 ' +
    'that had confined it to nationals of *another* member state — and Meridian does not resolve it.',
};

const rd240Art2 = {
  id: 'es-rd-240-2007-art-2',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 2',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The family members covered, whatever their nationality, when they accompany or join the Union citizen: the ' +
    'spouse; the partner in a union analogous to marriage registered in a public register established for that ' +
    'purpose in an EU or EEA state, where the registration has not been cancelled; direct descendants of the ' +
    'citizen and of the spouse or registered partner who are under twenty-one, or older and dependent, or unable ' +
    'to provide for themselves; and dependent direct ascendants of the citizen and of the spouse or registered ' +
    'partner. Marriage and registered partnership are mutually incompatible.',
};

const rd240Art2bis = {
  id: 'es-rd-240-2007-art-2-bis',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 2 bis',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'AN INDIVIDUALLY ASSESSED ROUTE, NOT AN ENTITLEMENT. Other relatives outside art. 2 may apply where, in the ' +
    'country they come from, they are dependent on the Union citizen or live with them, or where serious health ' +
    'or disability grounds make the citizen’s personal care strictly necessary; so may an unregistered stable ' +
    'partner. Art. 2 bis.4 requires the authorities to weigh the individual circumstances and give reasons, and ' +
    'sets two evidential benchmarks: cohabitation is taken as established on proof of 24 continuous months in the ' +
    'country of origin, and a durable partnership on proof of at least one continuous year of marital ' +
    'cohabitation, or of stable cohabitation where the couple have children in common.',
};

const rd240Art7 = {
  id: 'es-rd-240-2007-art-7',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 7',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The Union or EEA citizen has a right of residence beyond three months where they are an employed or self-' +
    'employed worker in Spain, or have sufficient resources for themselves and their family not to become a ' +
    'burden on social assistance together with sickness insurance covering all risks in Spain, or are enrolled as ' +
    'a student with equivalent cover and resources. Art. 7.2 extends that right to family members who are not ' +
    'nationals of a member state. Art. 7.7 forbids fixing an amount for sufficient resources: the citizen’s ' +
    'personal situation must be considered, and the figure may never exceed the level below which Spaniards ' +
    'receive social assistance, or the minimum Social Security pension.',
};

const rd240Art8 = {
  id: 'es-rd-240-2007-art-8',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 8',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Family members within art. 2 who do not hold the nationality of an EU or EEA state must apply for a residence ' +
    'card of a family member of a Union citizen within three months of entering Spain; a receipt is issued at ' +
    'once and is enough to show lawful stay until the card arrives. The documents listed are the passport, proof ' +
    'of the family bond, the Union citizen’s registration certificate, proof of dependency where art. 2 requires ' +
    'it, and photographs. The card must be issued within three months of the application, a favourable decision ' +
    'is retroactive to the recorded date of entry as a family member, and the card is valid for five years or for ' +
    'the Union citizen’s expected period of residence if that is shorter.',
};

const rd240Art10 = {
  id: 'es-rd-240-2007-art-10',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 10',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The right to reside permanently belongs to the Union or EEA citizen and to family members who are not ' +
    'nationals of such a state after five continuous years of legal residence in Spain, and is not subject to the ' +
    'conditions in Chapter III. Art. 10.2, 10.3 and 10.5 open the right earlier in defined cases — retirement or ' +
    'permanent incapacity of the worker, the frontier-worker case, and the death of the holder during working ' +
    'life — and those cases are not modelled here. The right is lost by absence from Spain for more than two ' +
    'consecutive years.',
};

const rd240Art11 = {
  id: 'es-rd-240-2007-art-11',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 11',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Family members with the right of permanent residence who are not nationals of an EU or EEA state are issued ' +
    'a permanent residence card within three months of the application. The application is made in the month ' +
    'before the residence card expires, or within the three months after, subject to any administrative penalty. ' +
    'The card renews automatically every ten years, and interruptions of residence not exceeding two consecutive ' +
    'years do not affect its validity.',
};

const rd240Art14 = {
  id: 'es-rd-240-2007-art-14',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 14',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The residence card of a family member of a Union citizen lapses on absences exceeding six months in a year. ' +
    'It does not lapse on longer absences shown to be for military obligations, or on absences of no more than ' +
    'twelve consecutive months for pregnancy, birth, the post-natal period, serious illness, studies, vocational ' +
    'training or a professional posting to another member state or a third country. Art. 14.4 allows a person to ' +
    'prove they are a beneficiary of this regime by any means admitted in law.',
};

const rd240Art15 = {
  id: 'es-rd-240-2007-art-15',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'art. 15',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Measures on grounds of public order or public security must rest exclusively on the personal conduct of the ' +
    'individual, which must be a genuine, present and sufficiently serious threat affecting a fundamental ' +
    'interest of society; art. 15.5.d) states that the existence of previous criminal convictions does not by ' +
    'itself constitute a ground for such a measure. Art. 15.8 provides that failing to apply for the residence ' +
    'card attracts only the monetary penalty that applies to Spaniards in relation to the national identity card.',
};

const rd240Da3 = {
  id: 'es-rd-240-2007-da-3',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 240/2007, de 16 de febrero, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la Unión Europea y de otros Estados parte en el Acuerdo sobre el Espacio Económico Europeo',
  provision: 'disposición adicional tercera',
  url: RD240_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'By virtue of the Agreement between the European Community and the Swiss Confederation on the free movement ' +
    'of persons, signed at Luxembourg on 21 June 1999, this Real Decreto applies to Swiss citizens and to their ' +
    'family members.',
};

const stsJune2010 = {
  id: 'es-sts-2010-06-01-rd-240-2007',
  kind: 'case_law' as const,
  instrument:
    'Sentencia de 1 de junio de 2010, de la Sala Tercera del Tribunal Supremo, por la que se anulan varias expresiones del Real Decreto 240/2007',
  url: 'https://www.boe.es/buscar/doc.php?id=BOE-A-2010-16822',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The operative part annulled, among others: the words «otro Estado miembro» in the opening paragraph of ' +
    'art. 2; the words «separación legal» in art. 2.a), c) and d); and the words «que impida la posibilidad de ' +
    'dos registros simultáneos en dicho Estado» in art. 2.b). The consolidated text on the BOE still displays ' +
    'those words, marked as annulled, so anyone reading art. 2 must read this judgment alongside it. The first ' +
    'annulment is the one that carries the argument that family members of Spanish nationals should be treated ' +
    'like family members of other Union citizens; Meridian does not take a position on where that argument now ' +
    'stands after the 2025 Reglamento created a separate chapter for them.',
};

const ccArt20 = {
  id: 'es-cc-art-20-opcion',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 20',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The right to opt for Spanish nationality belongs to persons who are or have been subject to the patria ' +
    'potestad of a Spanish national; to persons whose father or mother was originally Spanish and born in Spain; ' +
    'and to the cases in art. 17.2 and art. 19.2, which are filiation or birth in Spain determined after the age ' +
    'of eighteen, and adoption of a person over eighteen, each carrying its own two-year window. Art. 20.2 sets ' +
    'who makes the declaration and when: the option made by the person on their own account lapses at the age of ' +
    'twenty, extended to two years from emancipation where the person was not emancipated under their personal ' +
    'law at eighteen. Art. 20.3 subjects the option of the child of an originally Spanish parent born in Spain to ' +
    'no age limit at all. Text as amended by Ley 8/2021, in force 3 September 2021.',
};

const ccArt21 = {
  id: 'es-cc-art-21-carta-de-naturaleza',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 21',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY STATUTE, NOT BY PRACTICE. Art. 21.1 reads: Spanish nationality is acquired by carta de ' +
    'naturaleza, granted discretionally by Real Decreto, where exceptional circumstances are present in the ' +
    'person concerned. The law defines no criteria, no threshold and no entitlement, so there is nothing for an ' +
    'engine to measure. Art. 21.3 sets who may apply — the emancipated person or one over eighteen; a person ' +
    'over fourteen assisted by their legal representative; the legal representative of a person under fourteen, ' +
    'with prior authorisation; and a person with a disability with the supports and procedural adjustments they ' +
    'need. Art. 21.4 provides that a grant lapses 180 days after it is notified if the person has not appeared ' +
    'before the competent official to satisfy art. 23.',
};

const ccArt22_1Sefardies = {
  id: 'es-cc-art-22-1-sefardies',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 22.1',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 22.1 requires ten years of residence as the general rule, five for those who have obtained refugee ' +
    'status, and two for nationals by origin of Ibero-American countries, Andorra, the Philippines, Equatorial ' +
    'Guinea or Portugal «o de sefardíes». The Sephardic limb is conferred on the person, not on a nationality, ' +
    'so it is available whatever passport the applicant holds. The Código Civil prescribes no means of proving ' +
    'the condition.',
};

const ccArt22_3 = {
  id: 'es-cc-art-22-3-residencia-legal-continuada',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 22.3',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note: 'The residence must be legal, continuous and immediately prior to the application.',
};

const ccArt22_4 = {
  id: 'es-cc-art-22-4-conducta-integracion',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 22.4',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The applicant must justify good civic conduct and a sufficient degree of integration into Spanish society. ' +
    'Neither is a bright-line test. Clear police certificates and the statutory examinations are evidence toward ' +
    'them; they are not the test itself, and satisfying them does not oblige the authority to decide in the ' +
    'applicant’s favour.',
};

const ccArt23 = {
  id: 'es-cc-art-23-requisitos-comunes',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 23',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Common requirements for the validity of acquisition by option, carta de naturaleza or residence: an oath or ' +
    'promise of allegiance to the King and obedience to the Constitution and the laws by a person over fourteen ' +
    'able to declare for themselves; a declaration renouncing the previous nationality, from which nationals of ' +
    'the countries named in art. 24.1 and «los sefardíes originarios de España» are excepted; and entry of the ' +
    'acquisition in the Spanish Civil Registry. The Sephardic exception was inserted by disposición final primera ' +
    'of Ley 12/2015.',
};

const rd1004Art6 = {
  id: 'es-rd-1004-2015-art-6',
  kind: 'regulation' as const,
  instrument:
    'Reglamento que regula el procedimiento para la adquisición de la nacionalidad española por residencia, aprobado por Real Decreto 1004/2015, de 6 de noviembre',
  provision: 'art. 6',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-12047',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Applicants must pass both the DELE examination at level A2 or above and the CCSE test of historical, ' +
    'constitutional and sociocultural knowledge. Art. 6.5 dispenses with the DELE for anyone who already holds a ' +
    'DELE at A2 or above and for nationals of a closed list of twenty entries: Argentina, Bolivia, Chile, ' +
    'Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Guatemala, Equatorial Guinea, Honduras, Mexico, Nicaragua, ' +
    'Panama, Paraguay, Peru, Puerto Rico, the Dominican Republic, Uruguay and Venezuela. It is an enumeration, ' +
    'not a test of where Spanish is official. Art. 6.6 does not dispense with integration for applicants under ' +
    'eighteen or with judicially modified capacity: it substitutes certificates from the education, residential ' +
    'or care centres they attended.',
};

const ley12_2015 = {
  id: 'es-ley-12-2015-sefardies',
  kind: 'statute' as const,
  instrument:
    'Ley 12/2015, de 24 de junio, en materia de concesión de la nacionalidad española a los sefardíes originarios de España',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-7045',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'A special carta de naturaleza procedure, in force from 1 October 2015, with its own list of means of proving ' +
    'Sephardic origin of Spanish descent and a special connection with Spain, and its own notarial and electronic ' +
    'procedure. Disposición adicional primera gave interested persons three years from entry into force to lodge ' +
    'an application, extendable by one year by agreement of the Council of Ministers. Disposición adicional ' +
    'tercera provides that, once that period has passed, sefardíes who meet the Law’s requirements may still ' +
    'apply where exceptional circumstances or humanitarian reasons are shown, the grant then being made by the ' +
    'Council of Ministers on the proposal of the Ministry of Justice. Meridian does not assess that residual ' +
    'route.',
};

const ordenPra325_2018 = {
  id: 'es-orden-pra-325-2018-prorroga-sefardies',
  kind: 'regulation' as const,
  instrument:
    'Orden PRA/325/2018, de 15 de marzo, por la que se publica el Acuerdo del Consejo de Ministros de 9 de marzo de 2018, por el que se prorroga el plazo de presentación de solicitudes de concesión de la nacionalidad española en virtud de la Ley 12/2015',
  url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2018-4305',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Records that the three-year period would have ended on 1 October 2018 and extends it by one year, «hasta el ' +
    '1 de octubre de 2019». The window for the Ley 12/2015 procedure therefore ran from 1 October 2015 to ' +
    '1 October 2019. Meridian does not encode that closing date as a pathway boundary because the instrument ' +
    'says «hasta» without stating whether the last day is inclusive, and a one-day error on a closing date is ' +
    'the kind of error this catalog exists to avoid.',
};

const ley20_2022Da8 = {
  id: 'es-ley-20-2022-da-8',
  kind: 'statute' as const,
  instrument: 'Ley 20/2022, de 19 de octubre, de Memoria Democrática',
  provision: 'disposición adicional octava',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-17099',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'A right to opt for Spanish nationality, for the purposes of art. 20 of the Código Civil, for persons born ' +
    'outside Spain to a father, mother, grandfather or grandmother who was originally Spanish and who lost or ' +
    'renounced Spanish nationality as a consequence of exile for political, ideological, belief, or sexual ' +
    'orientation or identity reasons; for children born abroad to Spanish women who lost their nationality by ' +
    'marrying foreigners before the 1978 Constitution came into force; and for the adult children of those whose ' +
    'nationality of origin was recognised under this Law or under disposición adicional séptima of Ley 52/2007. ' +
    'The declaration had to be made within two years of the Law coming into force on 21 October 2022, and the ' +
    'Council of Ministers could extend that by one year.',
};

const memoriaPlazo = {
  id: 'es-memoria-democratica-cierre-plazo',
  kind: 'official_guidance' as const,
  instrument:
    'Acuerdo del Consejo de Ministros de 9 de julio de 2024 extendiendo por un año el plazo de la disposición adicional octava de la Ley 20/2022, según lo comunicado por las oficinas consulares de España',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'THE CLOSING DATE RESTS ON AN ADMINISTRATIVE ACT, NOT ON A NORM PUBLISHED IN THE BOE. Ley 20/2022 fixes a ' +
    'two-year period and authorises the Council of Ministers to extend it by one year; the statute itself does ' +
    'not state a closing date. Spanish consular notices published in 2025 record that the extended period ended ' +
    'at 23:59 local time on 22 October 2025 and that requests made after that date could not be attended to. The ' +
    'Council of Ministers agreement of 9 July 2024 was not located in the BOE during this sweep and the ministry ' +
    'press page that announced it now returns 404, so no URL is given here. Counsel should confirm the date ' +
    'against the agreement itself before anyone relies on it.',
};

const instrDgsjfp2024 = {
  id: 'es-instruccion-dgsjfp-2024-11-05',
  kind: 'official_guidance' as const,
  instrument:
    'Instrucción de 5 de noviembre de 2024, de la Dirección General de Seguridad Jurídica y Fe Pública, por la que se modifica la Instrucción de 25 de octubre de 2022, sobre el derecho de opción a la nacionalidad española establecido en la disposición adicional octava de la Ley 20/2022',
  url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-23338',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE INSTRUCTION. Directive 7.IV as amended provides that where an appointment to exercise the ' +
    'option cannot be held at a consular office within the statutory period, but was requested through the ' +
    'telematic tools designed for the purpose and a receipt was generated proving the request fell inside the ' +
    'period, the person may lodge the application in person after the period has ended, on the date they are ' +
    'given, presenting that receipt.',
};

// ---------------------------------------------------------------------------
// Residence by family reunification
// ---------------------------------------------------------------------------

/**
 * Encoded from the sponsor’s side, and that is a modelling decision worth
 * naming. Almost every requirement in arts. 67 and 68 attaches to the resident
 * exercising the right rather than to the relative being reunited, and the
 * resident is the person whose facts a Meridian matter is likely to hold.
 * Everything about the relative — which is to say art. 66 in its entirety —
 * escalates.
 */
export const esFamilyReunification: Pathway = {
  id: 'es-family-reunification',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Residence by family reunification',
    es: 'Residencia por reagrupación familiar',
  },
  summary: {
    en:
      'Residence in Spain for the relatives of a foreign national who already resides here, granted on the ' +
      'sponsor’s application. The criteria below are the ones that attach to the sponsor, because those are the ' +
      'facts this engine holds; which relatives may be reunited is art. 66 and needs a person. The sponsor must ' +
      'also have paid the fee, have any dependent children of compulsory school age already in Spain enrolled in ' +
      'school, and not be inside a no-return commitment period.',
    es:
      'Residencia en España para los familiares de una persona extranjera ya residente, a solicitud de la persona ' +
      'reagrupante. Los criterios siguientes son los que recaen sobre la persona reagrupante, que son los datos de ' +
      'los que dispone este motor; qué familiares pueden reagruparse es el artículo 66 y requiere revisión ' +
      'humana. La persona reagrupante debe además haber abonado la tasa, tener escolarizados a los hijos e hijas a ' +
      'su cargo en edad de escolarización obligatoria que ya se encuentren en España, y no hallarse dentro de un ' +
      'plazo de compromiso de no retorno.',
  },
  citations: [rloexArt65, rloexArt66, rloexArt67, rloexArt68, rloexArt69, rloexArt71],
  criteria: [
    {
      id: 'es-fr-sponsor-is-resident',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-rd-1155-2024-art-65', 'es-rd-1155-2024-art-68'],
      label: {
        en: 'The sponsor is a foreign national holding residence in Spain',
        es: 'La persona reagrupante es extranjera y reside legalmente en España',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
      guidance: {
        en:
          'This route belongs to a resident foreign national. The relative of a Spanish national is not reunited ' +
          'under this chapter at all: that case is Título IV, Capítulo VII of the same Reglamento, arts. 93 to 99. ' +
          'The relative of a Union, EEA or Swiss citizen is normally on the free-movement route instead.',
        es:
          'Esta vía corresponde a la persona extranjera residente. El familiar de una persona de nacionalidad ' +
          'española no se reagrupa por este capítulo: ese supuesto es el Título IV, Capítulo VII del mismo ' +
          'Reglamento, artículos 93 a 99. El familiar de un ciudadano de la Unión, del EEE o de Suiza sigue ' +
          'normalmente la vía del régimen de libre circulación.',
      },
    },
    {
      id: 'es-fr-sponsor-one-year-residence',
      kind: 'residence',
      weight: 'material',
      citationIds: ['es-rd-1155-2024-art-68'],
      label: {
        en: 'The sponsor has resided in Spain for at least one year',
        es: 'La persona reagrupante ha residido en España al menos un año',
      },
      evaluator: {
        op: 'duration_since_at_least',
        path: 'derived.continuousLegalResidenceSince',
        years: 1,
      },
      guidance: {
        en:
          'Art. 68.1 also requires that the sponsor has applied for an authorisation to reside for at least one ' +
          'further year, which this engine does not read. The one-year rule carries express exceptions: a long-' +
          'term resident or EU long-term resident reuniting ascendants may lodge once the long-term application is ' +
          'made, and a person resident in Spain on the basis of prior EU long-term residence in another member ' +
          'state is not held to it at all. Because those exceptions cannot be detected from the facts, this ' +
          'criterion is weighted so that it can hold back a positive answer but can never produce a negative one.',
        es:
          'El artículo 68.1 exige además que la persona reagrupante haya solicitado autorización para residir al ' +
          'menos otro año, dato que este motor no lee. La regla del año tiene excepciones expresas: quien sea ' +
          'residente de larga duración o de larga duración-UE y reagrupe ascendientes puede presentar la solicitud ' +
          'una vez pedida la larga duración, y quien resida en España por su previa condición de residente de larga ' +
          'duración-UE en otro Estado miembro no queda sujeto a ella. Como esas excepciones no son detectables a ' +
          'partir de los datos, este criterio puede frenar una respuesta afirmativa pero nunca producir una ' +
          'respuesta negativa.',
      },
    },
    {
      id: 'es-fr-qualifying-family-member',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-rd-1155-2024-art-66', 'es-rd-1155-2024-art-69'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'Whether a particular relative falls within art. 66 turns on facts about that relative, and this engine holds facts for one person only.',
        es: 'Si un familiar concreto está comprendido en el artículo 66 depende de datos sobre ese familiar, y este motor solo dispone de los datos de una persona.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'The relative to be reunited falls within art. 66',
        es: 'El familiar a reagrupar está comprendido en el artículo 66',
      },
      guidance: {
        en:
          'This engine read nothing here. Art. 66 admits the spouse over eighteen who is not separated in fact or ' +
          'in law; an unmarried partner over eighteen, either registered in a public register in an EU member ' +
          'state or shown by any means of proof to be in a stable relationship with at least twelve continuous ' +
          'months of cohabitation, which is not required where the couple have children in common; children of ' +
          'the sponsor or of the spouse or partner under eighteen at the date of the application, or older with a ' +
          'disability requiring support, or older and objectively unable to provide for their own needs because ' +
          'of their health; persons under the sponsor’s legal representation on the same terms; dependent first-' +
          'degree ascendants over sixty-five where reasons justify authorising their residence; and an adult ' +
          'child who will act as carer where the sponsor has a recognised degree of dependency. Separately, ' +
          'art. 69.2.b) gives a reunited relative independent residence, regardless of how long they have resided ' +
          'or lived with the sponsor, where they are a victim of gender violence, sexual violence, violence in ' +
          'the family setting or trafficking. Meridian does not assess those routes; take them to a qualified ' +
          'lawyer or to a specialist victim support service.',
        es:
          'Este motor no ha leído ningún dato en este criterio. El artículo 66 admite al cónyuge mayor de ' +
          'dieciocho años no separado de hecho ni de derecho; a la pareja no casada mayor de dieciocho años, ya ' +
          'inscrita en un registro público de un Estado miembro de la Unión, ya acreditada por cualquier medio de ' +
          'prueba como relación estable con al menos doce meses continuados de convivencia, que no se exige si ' +
          'hay descendencia común; a los hijos e hijas propios o del cónyuge o pareja menores de dieciocho años ' +
          'en el momento de la solicitud, o mayores con discapacidad que requiera apoyo, o mayores objetivamente ' +
          'incapaces de proveer a sus propias necesidades por su estado de salud; a las personas bajo su ' +
          'representación legal en los mismos términos; a los ascendientes en primer grado a cargo mayores de ' +
          'sesenta y cinco años cuando existan razones que lo justifiquen; y a un hijo o hija mayor de edad que ' +
          'vaya a ejercer de cuidador cuando la persona reagrupante tenga reconocido un grado de dependencia. ' +
          'Aparte, el artículo 69.2.b) reconoce residencia independiente, con independencia del tiempo de ' +
          'residencia y convivencia, a la persona reagrupada víctima de violencia de género, violencia sexual, ' +
          'violencia en el entorno familiar o trata de seres humanos. Meridian no valora esas vías: acuda a un ' +
          'profesional del derecho o a un servicio especializado de atención a víctimas.',
      },
    },
    {
      id: 'es-fr-sponsor-resources',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['es-rd-1155-2024-art-67'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'The resource test scales with the size of the family unit and counts income from work, which this engine does not model.',
        es: 'El requisito de recursos varía con el tamaño de la unidad familiar y computa ingresos del trabajo, que este motor no modela.',
      },
      evaluator: { op: 'gte', path: 'derived.passiveIncomeIpremMultiple', value: 1.5 },
      label: {
        en: 'Fixed and regular resources of at least 150% of the IPREM for a two-member unit, plus 50% per additional member',
        es: 'Recursos fijos y regulares de al menos el 150 % del IPREM para una unidad de dos miembros, más un 50 % por cada miembro adicional',
      },
      guidance: {
        en:
          'Art. 67.1 sets 150% of the IPREM for a unit made up of the sponsor and one reunited relative, plus 50% ' +
          'of the IPREM for each additional member, and counts income from economic activity at its net yield, ' +
          'pensions and benefits at their gross amount, and stable assets measured over six months. Study and ' +
          'housing aid, compensatory and maintenance payments other than to the relative being reunited, and ' +
          'social assistance income are all excluded. The figure this engine compares is recorded non-work income ' +
          'against the IPREM supplied with the facts, which is neither the whole of what art. 67.1 counts nor ' +
          'scaled to the family unit — so the arithmetic below is a partial view and the criterion is referred to ' +
          'a person. A reduction is available in the cases in art. 66.1.c) and d) in the best interests of a child.',
        es:
          'El artículo 67.1 fija el 150 % del IPREM para la unidad formada por la persona reagrupante y un ' +
          'familiar reagrupado, más un 50 % del IPREM por cada miembro adicional, y computa los rendimientos de ' +
          'actividades económicas por su rendimiento neto, las pensiones y prestaciones por su importe íntegro y ' +
          'el patrimonio estable por su importe medio de los últimos seis meses. Quedan excluidas las ayudas al ' +
          'estudio y a la vivienda, las pensiones compensatorias y de alimentos salvo a favor de la persona a ' +
          'reagrupar, y los ingresos de asistencia social. La cifra que compara este motor son los ingresos no ' +
          'derivados del trabajo que consten, frente al IPREM aportado con los datos, lo que ni agota lo que ' +
          'computa el artículo 67.1 ni se ajusta al tamaño de la unidad familiar: la operación que figura abajo es ' +
          'una vista parcial y el criterio se remite a una persona. Cabe minoración en los supuestos del artículo ' +
          '66.1.c) y d) conforme al interés superior del menor.',
      },
    },
    {
      id: 'es-fr-adequate-housing',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-rd-1155-2024-art-67'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'Adequate housing is established by a social services report on a specific dwelling, which is not something this engine can hold or check.',
        es: 'La vivienda adecuada se acredita mediante informe de los servicios sociales sobre una vivienda concreta, algo que este motor no puede almacenar ni comprobar.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'Adequate housing, evidenced by a social services report',
        es: 'Vivienda adecuada, acreditada mediante informe de los servicios sociales',
      },
      guidance: {
        en:
          'This engine read nothing here. Art. 67.2 requires a report from the social services of the Comunidad ' +
          'Autónoma, or of the local corporation where the region has so decided, issued and notified within one ' +
          'month of being asked for and no more than six months old at the date of the reunification application. ' +
          'It must record the title to occupy the dwelling, the number of rooms, the use of each, how many people ' +
          'live there, and habitability and equipment. Where the report is not issued in time and the applicant ' +
          'proves that, the requirement may be met by any means of proof admitted in law. The report does not ' +
          'bind the decision-maker, but a decision departing from it must give express reasons.',
        es:
          'Este motor no ha leído ningún dato en este criterio. El artículo 67.2 exige informe de los servicios ' +
          'sociales de la Comunidad Autónoma, o de la Corporación local cuando aquella así lo haya decidido, ' +
          'emitido y notificado en el plazo de un mes desde su solicitud y con una antigüedad máxima de seis meses ' +
          'a la fecha de la solicitud de reagrupación. Debe acreditar el título que habilita para ocupar la ' +
          'vivienda, el número de habitaciones, el uso de cada dependencia, el número de personas que la habitan y ' +
          'las condiciones de habitabilidad y equipamiento. Si no se emite en plazo y el interesado lo acredita, ' +
          'el requisito puede justificarse por cualquier medio de prueba admitido en Derecho. El informe no es ' +
          'vinculante, pero el órgano que se aparte de él debe motivarlo expresamente.',
      },
    },
    {
      id: 'es-fr-health-insurance',
      kind: 'health',
      weight: 'material',
      citationIds: ['es-rd-1155-2024-art-67'],
      label: {
        en: 'Health insurance for the sponsor and the relatives to be reunited',
        es: 'Seguro de enfermedad para la persona reagrupante y los familiares a reagrupar',
      },
      evaluator: { op: 'is_true', path: 'healthInsurance.hasPrivateCoverage' },
      guidance: {
        en:
          'Art. 67.3 requires health insurance for the sponsor and for the relatives in art. 66, and says no more ' +
          'than that: it does not require the insurer to be authorised to operate in Spain, and it does not ' +
          'distinguish public from private cover. This engine reads only whether private cover is recorded, so ' +
          'cover under the Spanish public system is not detected here — which is why this criterion cannot ' +
          'produce a negative answer on its own.',
        es:
          'El artículo 67.3 exige seguro de enfermedad para la persona reagrupante y para los familiares del ' +
          'artículo 66, y nada más: no exige que la aseguradora esté autorizada para operar en España ni ' +
          'distingue entre cobertura pública y privada. Este motor solo lee si consta cobertura privada, de modo ' +
          'que la cobertura por el sistema público español no se detecta aquí; por eso este criterio no puede ' +
          'producir por sí solo una respuesta negativa.',
      },
    },
    {
      id: 'es-fr-public-order',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rd-1155-2024-art-67', 'es-rd-1155-2024-art-68'],
      label: {
        en: 'No criminal record in Spain',
        es: 'Inexistencia de antecedentes penales en España',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'jurisdiction', value: 'ES' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
      guidance: {
        en:
          'Art. 67.6 frames this as not being a threat to public order, public security or public health, ' +
          'established by checking the absence of a criminal record in Spain and by assessing a police report ' +
          'which the office obtains itself. Art. 68.4 states that entries in the police report are not by ' +
          'themselves and automatically a ground of refusal: the case is assessed individually. A recorded clear ' +
          'certificate is evidence toward the requirement, not the requirement itself.',
        es:
          'El artículo 67.6 formula el requisito como no representar una amenaza para el orden público, la ' +
          'seguridad pública o la salud pública, que se acredita comprobando la inexistencia de antecedentes ' +
          'penales en España y valorando el informe policial que la oficina recaba de oficio. El artículo 68.4 ' +
          'establece que la existencia de antecedentes en el informe policial no supone por sí misma y de forma ' +
          'automática causa de denegación: se valora de forma casuística y circunstanciada. Un certificado sin ' +
          'condenas es prueba a favor del requisito, no el requisito mismo.',
      },
    },
  ],
  durations: {
    citationIds: ['es-rd-1155-2024-art-68', 'es-rd-1155-2024-art-71', 'es-rd-1155-2024-art-69'],
    note: {
      en:
        'No single grant length is stated here because art. 68.9 does not fix one: the reunited relative’s ' +
        'authorisation runs to the same date as the sponsor’s own authorisation at the moment the relative enters ' +
        'Spain, with a minimum of one year, and where the sponsor is a long-term resident the relative’s next ' +
        'authorisation is itself long-term. Renewal is applied for in the two months before expiry or the three ' +
        'months after. The office must decide the initial application within two months and silence is a refusal. ' +
        'Whether time held under this authorisation counts toward naturalisation is a question about the ' +
        'applicant’s legal and effective residence under Código Civil art. 22.3, and is not answered here.',
      es:
        'No se indica una duración única porque el artículo 68.9 no la fija: la autorización del familiar ' +
        'reagrupado se extiende hasta la misma fecha que la de la persona reagrupante en el momento de la entrada ' +
        'del familiar en España, con el mínimo de un año, y cuando la persona reagrupante es residente de larga ' +
        'duración la posterior autorización del familiar es de larga duración. La renovación se solicita en los ' +
        'dos meses anteriores a la caducidad o en los tres posteriores. La resolución inicial debe dictarse en el ' +
        'plazo máximo de dos meses y el silencio es desestimatorio. Si el tiempo bajo esta autorización computa ' +
        'para la nacionalidad es una cuestión de residencia legal y efectiva conforme al artículo 22.3 del Código ' +
        'Civil, y aquí no se resuelve.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residence card of a family member of a Union citizen
// ---------------------------------------------------------------------------

/**
 * The free-movement route, and the reason it matters commercially: for a
 * Mexican national married to an Italian or a Portuguese national, this is a
 * materially lighter regime than the one the same person would face married to
 * a third-country resident. There is no resource test on the applicant, no
 * housing report, no criminal-record certificate in the documentary list, the
 * entry visa is free and preferentially processed, and the card runs five years.
 *
 * The catch is that it is not lighter because the applicant is more deserving.
 * It is lighter because the right belongs to the Union citizen, and it lasts
 * only while that citizen satisfies art. 7. That conditionality is encoded as a
 * criterion rather than left implicit.
 */
export const esEuFamilyMemberCard: Pathway = {
  id: 'es-eu-family-member-card',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Residence card of a family member of a Union citizen',
    es: 'Tarjeta de residencia de familiar de ciudadano de la Unión',
  },
  summary: {
    en:
      'Residence in Spain for more than three months, for a family member who does not hold the nationality of an ' +
      'EU or EEA state and who accompanies or joins a Union, EEA or Swiss citizen exercising a right of residence ' +
      'here. The card carries the right to work, and the conditions in the general immigration regime — economic ' +
      'means of the applicant, a housing report, a police certificate — do not apply.',
    es:
      'Residencia en España por más de tres meses para el familiar que no ostenta la nacionalidad de un Estado de ' +
      'la Unión Europea o del Espacio Económico Europeo y que acompaña a un ciudadano de la Unión, del EEE o de ' +
      'Suiza que ejerce su derecho de residencia, o se reúne con él. La tarjeta habilita para trabajar, y no rigen ' +
      'las condiciones del régimen general de extranjería: medios económicos del solicitante, informe de vivienda ' +
      'o certificado de antecedentes penales.',
  },
  citations: [
    rd240Art2,
    rd240Art2bis,
    rd240Art7,
    rd240Art8,
    rd240Art14,
    rd240Art15,
    rd240Da3,
    stsJune2010,
    rloexFamiliaresEspanoles,
  ],
  criteria: [
    {
      id: 'es-eufm-not-eu-eea-national',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['es-rd-240-2007-art-8', 'es-rd-240-2007-da-3'],
      label: {
        en: 'The applicant does not hold the nationality of an EU or EEA state',
        es: 'La persona solicitante no ostenta la nacionalidad de un Estado de la UE o del EEE',
      },
      evaluator: {
        op: 'not',
        of: { op: 'set_contains_any', path: 'nationalities', values: [...EU_EEA_NATIONALITIES] },
      },
      guidance: {
        en:
          'A national of an EU or EEA state has the right of residence in their own name and registers in the ' +
          'Registro Central de Extranjeros under art. 7 instead of applying for this card. Switzerland is not on ' +
          'the list because art. 8.1 speaks of EU and EEA states; Swiss citizens and their family members are ' +
          'brought inside the same regime by disposición adicional tercera, and which document a Swiss national ' +
          'who is the family member of a Union citizen should hold is a question for the Oficina de Extranjería.',
        es:
          'Quien ostenta la nacionalidad de un Estado de la UE o del EEE tiene derecho de residencia por sí mismo ' +
          'y se inscribe en el Registro Central de Extranjeros conforme al artículo 7, en lugar de solicitar esta ' +
          'tarjeta. Suiza no figura en la lista porque el artículo 8.1 se refiere a Estados de la UE y del EEE; a ' +
          'los ciudadanos suizos y a sus familiares se les aplica el mismo régimen por la disposición adicional ' +
          'tercera, y qué documento corresponde a un nacional suizo familiar de un ciudadano de la Unión es una ' +
          'cuestión para la Oficina de Extranjería.',
      },
    },
    {
      id: 'es-eufm-family-tie',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-rd-240-2007-art-2', 'es-rd-240-2007-art-2-bis', 'es-sts-2010-06-01-rd-240-2007', 'es-rd-1155-2024-familiares-espanoles'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'The family tie is a fact about a second person — the Union citizen — and this engine holds facts for one applicant.',
        es: 'El vínculo familiar es un dato sobre una segunda persona —el ciudadano de la Unión— y este motor solo dispone de los datos de un solicitante.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'The applicant is a family member of a Union, EEA or Swiss citizen within art. 2',
        es: 'La persona solicitante es familiar de un ciudadano de la Unión, del EEE o de Suiza en el sentido del artículo 2',
      },
      guidance: {
        en:
          'This engine read nothing here. Art. 2 covers the spouse; the partner in a union analogous to marriage ' +
          'registered in a public register in an EU or EEA state, where the registration has not been cancelled; ' +
          'direct descendants of the citizen and of the spouse or registered partner under twenty-one, or older ' +
          'and dependent; and dependent direct ascendants. Read it with the Tribunal Supremo judgment of 1 June ' +
          '2010, which annulled the words «separación legal» in three of those limbs — so legal separation does ' +
          'not by itself end the tie — and annulled the requirement that the partnership register prevent ' +
          'simultaneous registrations. Art. 2 bis is a separate, individually assessed route for other relatives ' +
          'and for unregistered stable partners. If the citizen is Spanish rather than a national of another ' +
          'member state, do not assume this route: residence of family members of Spanish nationals is now ' +
          'regulated in Título IV, Capítulo VII of the 2025 Reglamento, and the interaction between that chapter ' +
          'and the 2010 judgment is a question for counsel.',
        es:
          'Este motor no ha leído ningún dato en este criterio. El artículo 2 comprende al cónyuge; a la pareja ' +
          'con la que se mantenga una unión análoga a la conyugal inscrita en un registro público de un Estado de ' +
          'la UE o del EEE, sin que la inscripción se haya cancelado; a los descendientes directos del ciudadano y ' +
          'de su cónyuge o pareja registrada menores de veintiún años, o mayores que vivan a su cargo; y a los ' +
          'ascendientes directos a cargo. Debe leerse junto con la sentencia del Tribunal Supremo de 1 de junio de ' +
          '2010, que anuló la expresión «separación legal» en tres de esos apartados —de modo que la separación ' +
          'legal no extingue por sí sola el vínculo— y anuló también la exigencia de que el registro de parejas ' +
          'impida dos inscripciones simultáneas. El artículo 2 bis es una vía distinta, de valoración ' +
          'individualizada, para otros familiares y para la pareja de hecho no registrada. Si el ciudadano es ' +
          'español y no nacional de otro Estado miembro, no dé por hecho que esta es la vía: la residencia de ' +
          'familiares de personas de nacionalidad española se regula hoy en el Título IV, Capítulo VII del ' +
          'Reglamento de 2025, y la relación entre ese capítulo y la sentencia de 2010 es una cuestión que debe ' +
          'consultarse con un profesional.',
      },
    },
    {
      id: 'es-eufm-citizen-meets-article-7',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-rd-240-2007-art-7'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'Whether the Union citizen satisfies art. 7 is a fact about that citizen, not about the applicant.',
        es: 'Que el ciudadano de la Unión cumpla el artículo 7 es un dato sobre ese ciudadano, no sobre la persona solicitante.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'The Union citizen satisfies the conditions in art. 7',
        es: 'El ciudadano de la Unión cumple las condiciones del artículo 7',
      },
      guidance: {
        en:
          'This engine read nothing here. The derived right stands or falls with the citizen: they must be an ' +
          'employed or self-employed worker in Spain, or have sufficient resources for themselves and their ' +
          'family together with sickness insurance covering all risks in Spain, or be enrolled as a student with ' +
          'the same cover and a declaration of resources. Art. 7.7 forbids fixing an amount for sufficient ' +
          'resources and caps it at the level below which Spaniards receive social assistance, or at the minimum ' +
          'Social Security pension. Art. 7.3 preserves worker status through temporary incapacity, and through ' +
          'duly recorded involuntary unemployment where the citizen registers with the employment service.',
        es:
          'Este motor no ha leído ningún dato en este criterio. El derecho derivado depende del ciudadano: debe ' +
          'ser trabajador por cuenta ajena o propia en España, o disponer de recursos suficientes para sí y para ' +
          'los miembros de su familia junto con un seguro de enfermedad que cubra todos los riesgos en España, o ' +
          'estar matriculado como estudiante con esa misma cobertura y una declaración de recursos. El artículo ' +
          '7.7 prohíbe fijar un importe para los medios económicos suficientes y lo limita al nivel por debajo del ' +
          'cual se concede asistencia social a los españoles, o al importe de la pensión mínima de la Seguridad ' +
          'Social. El artículo 7.3 conserva la condición de trabajador en caso de incapacidad temporal y de paro ' +
          'involuntario debidamente acreditado con inscripción en el servicio de empleo.',
      },
    },
    {
      id: 'es-eufm-application-window',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-rd-240-2007-art-8', 'es-rd-240-2007-art-15'],
      label: {
        en: 'Still within three months of entering Spain, the period in which the card is to be applied for',
        es: 'Dentro de los tres meses desde la entrada en España, plazo para solicitar la tarjeta',
      },
      evaluator: {
        op: 'not',
        of: { op: 'duration_since_at_least', path: 'travelHistory.lastEntryOn', months: 3 },
      },
      guidance: {
        en:
          'Art. 8.2 sets three months from entry into Spain, and a receipt issued on filing is enough to show ' +
          'lawful stay until the card arrives. Missing the window does not destroy the right: art. 15.8 attaches ' +
          'only the monetary penalty that applies to Spaniards over the national identity card, and art. 14.4 ' +
          'allows a person to prove they are a beneficiary of this regime by any means admitted in law. That is ' +
          'why this criterion is informational and never affects the outcome.',
        es:
          'El artículo 8.2 fija tres meses desde la entrada en España, y el resguardo que se entrega al presentar ' +
          'la solicitud basta para acreditar la estancia legal hasta la entrega de la tarjeta. Superar el plazo no ' +
          'extingue el derecho: el artículo 15.8 solo prevé la sanción pecuniaria aplicable a los españoles en ' +
          'relación con el Documento Nacional de Identidad, y el artículo 14.4 permite acreditar por cualquier ' +
          'medio de prueba admitido en Derecho la condición de beneficiario de este régimen. Por eso este ' +
          'criterio es informativo y no altera el resultado.',
      },
    },
    {
      id: 'es-eufm-public-order',
      kind: 'character',
      weight: 'informational',
      citationIds: ['es-rd-240-2007-art-15', 'es-rd-240-2007-art-8'],
      label: {
        en: 'No criminal convictions declared',
        es: 'No se declaran condenas penales',
      },
      evaluator: { op: 'is_true', path: 'criminalRecord.selfDeclaredClear' },
      guidance: {
        en:
          'The documents art. 8.3 lists do not include a police certificate, and art. 15.5.d) states that the ' +
          'existence of previous criminal convictions does not by itself constitute a ground for refusing or ' +
          'withdrawing a right under this regime: a measure must rest exclusively on personal conduct amounting ' +
          'to a genuine, present and sufficiently serious threat to a fundamental interest of society. This ' +
          'criterion is therefore recorded for the reader and never affects the outcome. Art. 12.3 does allow the ' +
          'authorities to seek information about criminal records exceptionally.',
        es:
          'La documentación que enumera el artículo 8.3 no incluye certificado de antecedentes penales, y el ' +
          'artículo 15.5.d) establece que la existencia de condenas penales anteriores no constituye por sí sola ' +
          'razón para adoptar una medida en este régimen: la medida debe fundarse exclusivamente en la conducta ' +
          'personal, que ha de constituir una amenaza real, actual y suficientemente grave para un interés ' +
          'fundamental de la sociedad. Por eso este criterio se recoge a título informativo y no altera el ' +
          'resultado. El artículo 12.3 sí permite a las autoridades recabar excepcionalmente información sobre ' +
          'antecedentes penales.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 60,
    citationIds: ['es-rd-240-2007-art-8', 'es-rd-240-2007-art-14'],
    note: {
      en:
        'Art. 8.5 sets the card at five years from issue, or at the Union citizen’s expected period of residence ' +
        'if that is shorter, so sixty months is the maximum rather than a guarantee. The card must be issued ' +
        'within three months of the application and a favourable decision is retroactive to the recorded date of ' +
        'entry as a family member. Under art. 14.3 the card lapses on absences exceeding six months in a year, ' +
        'subject to the exceptions there for military obligations and for absences of up to twelve consecutive ' +
        'months for pregnancy, birth, the post-natal period, serious illness, studies, vocational training or a ' +
        'professional posting abroad.',
      es:
        'El artículo 8.5 fija la tarjeta en cinco años desde su expedición, o en el periodo previsto de residencia ' +
        'del ciudadano de la Unión si fuera inferior, de modo que sesenta meses es el máximo y no una garantía. La ' +
        'tarjeta debe expedirse en los tres meses siguientes a la solicitud y la resolución favorable tiene ' +
        'efectos retroactivos desde la fecha acreditada de entrada como familiar. Conforme al artículo 14.3 la ' +
        'vigencia caduca por ausencias superiores a seis meses en un año, con las excepciones allí previstas para ' +
        'obligaciones militares y para ausencias de hasta doce meses consecutivos por gestación, parto, posparto, ' +
        'enfermedad grave, estudios, formación profesional o traslado profesional al extranjero.',
    },
  },
  leadsTo: [
    'es-eu-family-permanent-residence',
    'es-nationality-residence-reduced',
    'es-nationality-residence-general',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Permanent residence card of a family member of a Union citizen
// ---------------------------------------------------------------------------

export const esEuFamilyPermanentResidence: Pathway = {
  id: 'es-eu-family-permanent-residence',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Permanent residence card of a family member of a Union citizen',
    es: 'Tarjeta de residencia permanente de familiar de ciudadano de la Unión',
  },
  summary: {
    en:
      'After five continuous years of legal residence in Spain as the family member of a Union, EEA or Swiss ' +
      'citizen, the right of residence becomes permanent and stops depending on the conditions in Chapter III of ' +
      'Real Decreto 240/2007. Family members who are not nationals of an EU or EEA state are issued a permanent ' +
      'residence card, renewable automatically every ten years.',
    es:
      'Tras cinco años continuados de residencia legal en España como familiar de un ciudadano de la Unión, del ' +
      'EEE o de Suiza, el derecho de residencia pasa a ser permanente y deja de estar sujeto a las condiciones del ' +
      'Capítulo III del Real Decreto 240/2007. A los familiares que no son nacionales de un Estado de la UE o del ' +
      'EEE se les expide una tarjeta de residencia permanente, renovable automáticamente cada diez años.',
  },
  citations: [rd240Art10, rd240Art11, rd240Art2],
  criteria: [
    {
      id: 'es-eufp-five-years-continuous-residence',
      kind: 'residence',
      weight: 'material',
      citationIds: ['es-rd-240-2007-art-10'],
      label: {
        en: 'Five continuous years of legal residence in Spain',
        es: 'Cinco años continuados de residencia legal en España',
      },
      evaluator: {
        op: 'duration_since_at_least',
        path: 'derived.continuousLegalResidenceSince',
        years: 5,
      },
      guidance: {
        en:
          'Art. 10.2 opens the right before five years in defined cases turning on the worker: reaching pension ' +
          'age or taking early retirement after twelve months of activity and more than three years of ' +
          'continuous residence, ceasing activity through permanent incapacity after more than two years, and ' +
          'the frontier-worker case. Art. 10.3 extends the right to the family members of a worker who has ' +
          'acquired it that way, and art. 10.5 covers the death of the holder during working life. None of those ' +
          'are visible in the facts, which is why this criterion can hold back a positive answer but never ' +
          'produces a negative one. Art. 10.7 provides that the right of permanent residence is lost by absence ' +
          'from Spain for more than two consecutive years; Meridian does not convert that into a number of days.',
        es:
          'El artículo 10.2 abre el derecho antes de los cinco años en supuestos referidos al trabajador: alcanzar ' +
          'la edad de jubilación o acceder a la jubilación anticipada tras doce meses de actividad y más de tres ' +
          'años de residencia continuada, cesar por incapacidad permanente tras más de dos años, y el supuesto del ' +
          'trabajador fronterizo. El artículo 10.3 extiende el derecho a los familiares del trabajador que lo ' +
          'haya adquirido así, y el artículo 10.5 contempla el fallecimiento del titular en vida activa. Ninguno ' +
          'de esos supuestos es visible en los datos: por eso este criterio puede frenar una respuesta afirmativa ' +
          'pero nunca produce una negativa. El artículo 10.7 establece que el derecho de residencia permanente se ' +
          'pierde por ausencia de más de dos años consecutivos; Meridian no traduce ese plazo a un número de días.',
      },
    },
    {
      id: 'es-eufp-residence-as-family-member',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-rd-240-2007-art-10', 'es-rd-240-2007-art-2'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'That the five years were residence as the family member of a Union citizen depends on facts about that citizen, which this engine does not hold.',
        es: 'Que los cinco años lo fueran en calidad de familiar de un ciudadano de la Unión depende de datos sobre ese ciudadano, de los que este motor no dispone.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'The residence was held as the family member of a Union, EEA or Swiss citizen',
        es: 'La residencia se ostentó en calidad de familiar de un ciudadano de la Unión, del EEE o de Suiza',
      },
      guidance: {
        en:
          'This engine read nothing here, and the criterion cannot be dropped: five years of residence in Spain ' +
          'on some other basis leads to long-term residence under the general regime, not to this card. The ' +
          'family tie must have been one within art. 2 throughout, and art. 9 governs what happens to it on the ' +
          'citizen’s death or departure, or on divorce, annulment or cancellation of the registered partnership.',
        es:
          'Este motor no ha leído ningún dato en este criterio, y el criterio no puede omitirse: cinco años de ' +
          'residencia en España por otro título conducen a la residencia de larga duración del régimen general, no ' +
          'a esta tarjeta. El vínculo familiar debe haber sido uno de los del artículo 2 durante todo el periodo, ' +
          'y el artículo 9 regula qué sucede con él en caso de fallecimiento o salida de España del ciudadano, o ' +
          'de divorcio, nulidad o cancelación de la inscripción como pareja registrada.',
      },
    },
    {
      id: 'es-eufp-not-eu-eea-national',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['es-rd-240-2007-art-11'],
      label: {
        en: 'The applicant does not hold the nationality of an EU or EEA state',
        es: 'La persona solicitante no ostenta la nacionalidad de un Estado de la UE o del EEE',
      },
      evaluator: {
        op: 'not',
        of: { op: 'set_contains_any', path: 'nationalities', values: [...EU_EEA_NATIONALITIES] },
      },
      guidance: {
        en:
          'Art. 11 is the card for family members who are not nationals of an EU or EEA state. A national of such ' +
          'a state asks the Oficina de Extranjería for a certificate of the right to reside permanently under ' +
          'art. 10.1 instead.',
        es:
          'El artículo 11 regula la tarjeta para los familiares que no son nacionales de un Estado de la UE o del ' +
          'EEE. Quien sí lo sea solicita a la Oficina de Extranjería el certificado del derecho a residir con ' +
          'carácter permanente del artículo 10.1.',
      },
    },
  ],
  durations: {
    renewalMonths: 120,
    citationIds: ['es-rd-240-2007-art-11', 'es-rd-240-2007-art-10'],
    note: {
      en:
        'The right of permanent residence is the entitlement; the card is the document that evidences it. Art. 11 ' +
        'requires the card to be issued within three months of the application, applied for in the month before ' +
        'the residence card expires or within the three months after, and renewed automatically every ten years. ' +
        'Interruptions of residence not exceeding two consecutive years do not affect the card’s validity.',
      es:
        'El derecho de residencia permanente es la titularidad; la tarjeta es el documento que lo acredita. El ' +
        'artículo 11 exige que la tarjeta se expida en el plazo de tres meses desde la solicitud, que esta se ' +
        'presente durante el mes anterior a la caducidad de la tarjeta de residencia o dentro de los tres meses ' +
        'posteriores, y que se renueve automáticamente cada diez años. Las interrupciones de residencia no ' +
        'superiores a dos años consecutivos no afectan a su vigencia.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Nationality by option
// ---------------------------------------------------------------------------

export const esNationalityOption: Pathway = {
  id: 'es-nationality-option',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Spanish nationality by option',
    es: 'Nacionalidad española por opción',
  },
  summary: {
    en:
      'A declaration, not an application for a discretionary grant: art. 20 of the Código Civil confers a right ' +
      'to opt for Spanish nationality on people with a defined connection to a Spanish national or to Spain. No ' +
      'period of residence is required. What the route turns on entirely is the ground relied on and the window ' +
      'in which the declaration may be made.',
    es:
      'Una declaración, no una solicitud de concesión discrecional: el artículo 20 del Código Civil reconoce el ' +
      'derecho a optar por la nacionalidad española a quienes tienen un vínculo determinado con una persona de ' +
      'nacionalidad española o con España. No se exige periodo de residencia alguno. Todo depende del supuesto ' +
      'invocado y del plazo en que puede formularse la declaración.',
  },
  citations: [ccArt20, ccArt23],
  criteria: [
    {
      id: 'es-opt-qualifying-ground',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-cc-art-20-opcion'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'Which limb of art. 20.1 applies depends on facts about a parent, a guardian or an adoption that this engine does not hold.',
        es: 'Qué supuesto del artículo 20.1 resulta aplicable depende de datos sobre un progenitor, una tutela o una adopción de los que este motor no dispone.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'A ground of option under art. 20.1',
        es: 'Un supuesto de opción del artículo 20.1',
      },
      guidance: {
        en:
          'This engine read nothing here. The grounds are: being or having been subject to the patria potestad of ' +
          'a Spanish national; having a father or mother who was originally Spanish and born in Spain; and the ' +
          'cases in art. 17.2 and art. 19.2 — filiation or birth in Spain determined after the age of eighteen, ' +
          'and adoption of a person over eighteen — each of which carries its own two-year window running from ' +
          'that determination or from the adoption. Establish which limb is relied on before anything else: the ' +
          'age windows differ by limb.',
        es:
          'Este motor no ha leído ningún dato en este criterio. Los supuestos son: estar o haber estado sujeto a ' +
          'la patria potestad de un español; tener padre o madre que hubiera sido originariamente español y ' +
          'nacido en España; y los casos de los artículos 17.2 y 19.2 —filiación o nacimiento en España ' +
          'determinados después de los dieciocho años, y adopción de mayor de dieciocho años—, cada uno con su ' +
          'propio plazo de dos años desde esa determinación o desde la adopción. Determine primero qué supuesto se ' +
          'invoca: los plazos por edad difieren según el supuesto.',
      },
    },
    {
      id: 'es-opt-age-window',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-20-opcion'],
      label: {
        en: 'Under twenty, the age at which an option made on the person’s own account lapses',
        es: 'Menor de veinte años, edad a la que caduca la opción formulada por el propio interesado',
      },
      evaluator: { op: 'lt', path: 'derived.ageYears', value: 20 },
      guidance: {
        en:
          'Art. 20.2.c) provides that where the person opts on their own account the option lapses at the age of ' +
          'twenty, and that where they were not emancipated under their personal law on turning eighteen the ' +
          'period runs instead until two years after emancipation. Art. 20.3 removes any age limit at all from ' +
          'the option of a person whose father or mother was originally Spanish and born in Spain, and art. 20.2.e) ' +
          'gives two years from the ending of support measures that had prevented the option being exercised. ' +
          'Because the applicable window depends on the ground, this criterion is recorded for the reader and ' +
          'never affects the outcome — a person over twenty is not thereby out of time.',
        es:
          'El artículo 20.2.c) establece que, cuando la opción la formula el propio interesado, caduca a los ' +
          'veinte años de edad, y que si no estuviera emancipado según su ley personal al llegar a los dieciocho, ' +
          'el plazo se prolonga hasta que transcurran dos años desde la emancipación. El artículo 20.3 suprime ' +
          'todo límite de edad para la opción de quien tenga padre o madre originariamente español y nacido en ' +
          'España, y el artículo 20.2.e) concede dos años desde la extinción de las medidas de apoyo que hubieran ' +
          'impedido ejercitarla. Como el plazo aplicable depende del supuesto, este criterio se recoge a título ' +
          'informativo y no altera el resultado: quien haya cumplido veinte años no está por ello fuera de plazo.',
      },
    },
    {
      id: 'es-opt-renunciation-required',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-23-requisitos-comunes'],
      label: {
        en: 'Renunciation of the previous nationality will be required',
        es: 'Se exigirá la renuncia a la nacionalidad anterior',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'claimedNationality',
          values: [...SPAIN_NO_RENUNCIATION_NATIONALITIES],
        },
      },
      guidance: {
        en:
          'Art. 23 makes acquisition by option valid only on an oath or promise of allegiance to the King and ' +
          'obedience to the Constitution and the laws by a person over fourteen able to declare for themselves, a ' +
          'declaration renouncing the previous nationality, and entry in the Spanish Civil Registry. Nationals of ' +
          'the countries listed in art. 24.1 and «los sefardíes originarios de España» are excepted from the ' +
          'renunciation.',
        es:
          'El artículo 23 supedita la validez de la adquisición por opción al juramento o promesa de fidelidad al ' +
          'Rey y obediencia a la Constitución y a las leyes por el mayor de catorce años capaz de prestar una ' +
          'declaración por sí, a la declaración de renuncia a la nacionalidad anterior, y a la inscripción en el ' +
          'Registro Civil español. Quedan a salvo de la renuncia los naturales de los países del artículo 24.1 y ' +
          'los sefardíes originarios de España.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['es-cc-art-23-requisitos-comunes'],
    note: {
      en:
        'The option takes effect only once the art. 23 conditions are satisfied and the acquisition is entered in ' +
        'the Civil Registry. Making the declaration is not the end of the matter.',
      es:
        'La opción solo surte efecto una vez cumplidas las condiciones del artículo 23 y practicada la ' +
        'inscripción en el Registro Civil. Formular la declaración no cierra el expediente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Democratic Memory option — CLOSED
// ---------------------------------------------------------------------------

/**
 * Kept in the catalog although it is closed, for the same reason as Spain's
 * investor route: thousands of declarations were lodged inside the window and
 * the people who lodged them are waiting on decisions now. A closed pathway
 * gives them a cited answer; a missing one gives them a 404.
 *
 * `closedOn` is 23 October 2025 because `statusOn` treats it as the first day
 * the route was *not* available, and the consular notices put the last day at
 * 22 October 2025.
 */
export const esNationalityDemocraticMemoryOption: Pathway = {
  id: 'es-nationality-democratic-memory-option',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'naturalization',
  status: 'closed',
  openedOn: isoDate('2022-10-21'),
  closedOn: isoDate('2025-10-23'),
  name: {
    en: 'Option for Spanish nationality under the Democratic Memory Act — closed',
    es: 'Opción a la nacionalidad española por la Ley de Memoria Democrática — cerrada',
  },
  summary: {
    en:
      'A time-limited right of option, for the purposes of art. 20 of the Código Civil, for the descendants of ' +
      'Spaniards who lost or renounced their nationality in exile, for children born abroad to Spanish women who ' +
      'lost their nationality by marrying a foreigner before the 1978 Constitution, and for the adult children of ' +
      'those recognised under this Law or under the 2007 Act. The window has closed.',
    es:
      'Un derecho de opción limitado en el tiempo, a los efectos del artículo 20 del Código Civil, para los ' +
      'descendientes de españoles que perdieron o renunciaron a su nacionalidad en el exilio, para los hijos e ' +
      'hijas nacidos en el exterior de mujeres españolas que perdieron la nacionalidad por casarse con extranjeros ' +
      'antes de la Constitución de 1978, y para los hijos e hijas mayores de edad de quienes fueron reconocidos ' +
      'por esta Ley o por la de 2007. El plazo ha finalizado.',
  },
  closureNote: {
    en:
      'No new declaration can be made. Consular notices record that the extended period ended at 23:59 local ' +
      'time on 22 October 2025. Two things survive it. Declarations lodged inside the window are being processed, ' +
      'and the route remains a live question for the people who made them. And under the amended directive 7.IV ' +
      'of the Dirección General de Seguridad Jurídica y Fe Pública, a person who requested a consular appointment ' +
      'through the telematic tools inside the window, and holds the receipt proving it, may lodge the ' +
      'declaration in person afterwards on the date they are given. Anything turning on those provisions should ' +
      'go to a lawyer: this engine can restate what the Law required, not tell you how it applies to a particular ' +
      'file.',
    es:
      'No cabe formular nuevas declaraciones. Las comunicaciones consulares recogen que el plazo prorrogado ' +
      'finalizó a las 23:59, hora local, del 22 de octubre de 2025. Subsisten dos cosas. Las declaraciones ' +
      'presentadas dentro del plazo están en tramitación, y la vía sigue siendo una cuestión viva para quienes ' +
      'las formularon. Y conforme a la directriz 7.IV modificada de la Dirección General de Seguridad Jurídica y ' +
      'Fe Pública, quien solicitó cita consular por las herramientas telemáticas dentro del plazo y conserva el ' +
      'justificante puede presentar después la declaración presencialmente, en la fecha que se le asigne. Todo lo ' +
      'que dependa de esas previsiones debe consultarse con un profesional: este motor puede reproducir lo que la ' +
      'Ley exigía, no determinar cómo se aplica a un expediente concreto.',
  },
  citations: [ley20_2022Da8, memoriaPlazo, instrDgsjfp2024, ccArt23],
  criteria: [
    {
      id: 'es-dmo-declaration-within-window',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-ley-20-2022-da-8', 'es-memoria-democratica-cierre-plazo'],
      label: {
        en: 'The declaration was made on or before 22 October 2025',
        es: 'La declaración se formuló el 22 de octubre de 2025 o antes',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: isoDate('2025-10-23') },
      guidance: {
        en:
          'The Law fixes a two-year period from its entry into force on 21 October 2022 and allows the Council of ' +
          'Ministers to extend it by one year; it does not itself state a closing date. The 22 October 2025 date ' +
          'comes from the Council of Ministers agreement of 9 July 2024 as reported by Spanish consular offices, ' +
          'and was not confirmed against the agreement itself during this verification. Where an appointment was ' +
          'requested telematically inside the window, the declaration could be lodged afterwards on the date ' +
          'given.',
        es:
          'La Ley fija un plazo de dos años desde su entrada en vigor el 21 de octubre de 2022 y habilita al ' +
          'Consejo de Ministros para prorrogarlo un año; no establece por sí misma una fecha de cierre. La fecha ' +
          'del 22 de octubre de 2025 procede del Acuerdo del Consejo de Ministros de 9 de julio de 2024 según lo ' +
          'comunicado por las oficinas consulares de España, y no se ha contrastado con el propio Acuerdo en esta ' +
          'verificación. Si la cita se solicitó telemáticamente dentro del plazo, la declaración podía presentarse ' +
          'después, en la fecha asignada.',
      },
    },
    {
      id: 'es-dmo-qualifying-ground',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-ley-20-2022-da-8'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'The ground turns on the nationality history of a parent or grandparent, and on the circumstances in which it was lost, none of which this engine holds.',
        es: 'El supuesto depende del historial de nacionalidad de un progenitor o abuelo y de las circunstancias en que la perdió, datos de los que este motor no dispone.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'A ground of option under the disposición adicional octava',
        es: 'Un supuesto de opción de la disposición adicional octava',
      },
      guidance: {
        en:
          'This engine read nothing here. The three groups are: persons born outside Spain to a father, mother, ' +
          'grandfather or grandmother who was originally Spanish and who lost or renounced Spanish nationality as ' +
          'a consequence of exile for political, ideological, belief, or sexual orientation or identity reasons; ' +
          'children born abroad to Spanish women who lost their nationality by marrying foreigners before the ' +
          '1978 Constitution came into force; and adult children of those whose nationality of origin was ' +
          'recognised under this Law or under disposición adicional séptima of Ley 52/2007.',
        es:
          'Este motor no ha leído ningún dato en este criterio. Los tres supuestos son: los nacidos fuera de ' +
          'España de padre o madre, abuelo o abuela originariamente españoles que hubieran perdido o renunciado a ' +
          'la nacionalidad española como consecuencia del exilio por razones políticas, ideológicas, de creencia o ' +
          'de orientación e identidad sexual; los hijos e hijas nacidos en el exterior de mujeres españolas que ' +
          'perdieron su nacionalidad por casarse con extranjeros antes de la entrada en vigor de la Constitución ' +
          'de 1978; y los hijos e hijas mayores de edad de aquellos españoles a quienes se reconoció la ' +
          'nacionalidad de origen en virtud de esta Ley o de la disposición adicional séptima de la Ley 52/2007.',
      },
    },
    {
      id: 'es-dmo-appointment-receipt',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-instruccion-dgsjfp-2024-11-05'],
      label: {
        en: 'An application date is recorded for this matter',
        es: 'Consta una fecha de presentación para este expediente',
      },
      evaluator: { op: 'is_present', path: 'applicationLodgedOn' },
      guidance: {
        en:
          'Where a consular appointment could not be held inside the statutory period but was requested through ' +
          'the telematic tools, and a receipt was generated proving the request fell inside the period, the ' +
          'declaration could be lodged in person afterwards on the date given, presenting that receipt. The ' +
          'operative date for the window is therefore the date the appointment was requested, not always the date ' +
          'the declaration was signed — check which of the two is recorded here.',
        es:
          'Cuando la cita consular no pudo atenderse dentro del plazo legal pero se solicitó por las herramientas ' +
          'telemáticas y se generó un justificante que acredita que la solicitud se produjo dentro del plazo, la ' +
          'declaración podía presentarse después presencialmente, en la fecha asignada, aportando ese ' +
          'justificante. La fecha operativa a efectos del plazo es, por tanto, la de solicitud de cita y no ' +
          'siempre la de firma de la declaración: compruebe cuál de las dos consta aquí.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['es-cc-art-23-requisitos-comunes'],
    note: {
      en:
        'The disposición adicional octava confers the option for the purposes of art. 20 of the Código Civil, so ' +
        'the common conditions in art. 23 apply: the oath or promise, the declaration of renunciation subject to ' +
        'its exceptions, and entry in the Civil Registry.',
      es:
        'La disposición adicional octava reconoce la opción a los efectos del artículo 20 del Código Civil, por ' +
        'lo que rigen las condiciones comunes del artículo 23: el juramento o promesa, la declaración de renuncia ' +
        'con sus excepciones, y la inscripción en el Registro Civil.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Carta de naturaleza
// ---------------------------------------------------------------------------

/**
 * The route with no criteria, encoded so that its absence is not mistaken for
 * an oversight. Art. 21.1 grants nationality by Real Decreto, discretionally,
 * where exceptional circumstances are present. There is no threshold, no
 * entitlement, and nothing for software to measure — so the substantive
 * criterion is escalated and the rest of the record states the procedure.
 */
export const esNationalityCartaDeNaturaleza: Pathway = {
  id: 'es-nationality-carta-de-naturaleza',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Spanish nationality by carta de naturaleza',
    es: 'Nacionalidad española por carta de naturaleza',
  },
  summary: {
    en:
      'A discretionary grant of Spanish nationality, made by Real Decreto where exceptional circumstances are ' +
      'present in the person concerned. No period of residence and no qualifying connection is prescribed, and ' +
      'equally no criteria are: the Código Civil says only that the grant is discretionary. Nobody is entitled to ' +
      'it and this engine cannot assess it.',
    es:
      'Concesión discrecional de la nacionalidad española, otorgada mediante Real Decreto cuando concurren ' +
      'circunstancias excepcionales en el interesado. No se exige periodo de residencia ni vínculo determinado, y ' +
      'tampoco se fijan criterios: el Código Civil se limita a decir que la concesión es discrecional. Nadie tiene ' +
      'derecho a ella y este motor no puede valorarla.',
  },
  citations: [ccArt21, ccArt23, ley12_2015, ordenPra325_2018],
  criteria: [
    {
      id: 'es-cdn-exceptional-circumstances',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-cc-art-21-carta-de-naturaleza', 'es-ley-12-2015-sefardies', 'es-orden-pra-325-2018-prorroga-sefardies'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'Art. 21.1 fixes no criteria at all: the grant is discretionary and there is nothing for an engine to measure.',
        es: 'El artículo 21.1 no fija criterio alguno: la concesión es discrecional y no hay nada que un motor pueda medir.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'Exceptional circumstances, assessed at the Government’s discretion',
        es: 'Circunstancias excepcionales, apreciadas discrecionalmente por el Gobierno',
      },
      guidance: {
        en:
          'This engine read nothing here, and there is nothing it could read: the statute defines no criteria and ' +
          'confers no right. A separate statutory scheme, Ley 12/2015, ran a special carta de naturaleza ' +
          'procedure for sefardíes originarios de España with its own means of proof and its own notarial ' +
          'procedure; its application window ran from 1 October 2015 and was extended by one year to 1 October ' +
          '2019 by the Council of Ministers agreement published as Orden PRA/325/2018. Its disposición adicional ' +
          'tercera preserves a residual route after that period where exceptional circumstances or humanitarian ' +
          'reasons are shown, the grant then being made by the Council of Ministers on the proposal of the ' +
          'Ministry of Justice. Meridian does not assess either. Take an exceptional-circumstances case to a ' +
          'lawyer.',
        es:
          'Este motor no ha leído ningún dato en este criterio, ni hay nada que pudiera leer: la ley no define ' +
          'criterios ni confiere derecho alguno. Un régimen legal distinto, la Ley 12/2015, articuló un ' +
          'procedimiento especial de carta de naturaleza para los sefardíes originarios de España, con sus propios ' +
          'medios de prueba y su propio procedimiento notarial; su plazo de presentación se abrió el 1 de octubre ' +
          'de 2015 y se prorrogó un año, hasta el 1 de octubre de 2019, por el Acuerdo del Consejo de Ministros ' +
          'publicado mediante la Orden PRA/325/2018. Su disposición adicional tercera conserva una vía residual ' +
          'posterior cuando se acrediten circunstancias excepcionales o razones humanitarias, correspondiendo ' +
          'entonces la concesión al Consejo de Ministros a propuesta del Ministerio de Justicia. Meridian no ' +
          'valora ninguna de las dos. Lleve un caso de circunstancias excepcionales a un profesional del derecho.',
      },
    },
    {
      id: 'es-cdn-who-may-apply',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-21-carta-de-naturaleza'],
      label: {
        en: 'The applicant is over eighteen and may apply on their own account',
        es: 'La persona solicitante es mayor de dieciocho años y puede solicitarla por sí misma',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'Art. 21.3 also allows the application to be made by a person over fourteen assisted by their legal ' +
          'representative, by the legal representative of a person under fourteen with prior authorisation, and ' +
          'by a person with a disability with the supports and procedural adjustments they need — so being under ' +
          'eighteen does not close the route, which is why this criterion never affects the outcome. Art. 21.4 ' +
          'provides that a grant lapses 180 days after it is notified if the person has not appeared before the ' +
          'competent official to satisfy art. 23.',
        es:
          'El artículo 21.3 permite además que la solicitud la formule el mayor de catorce años asistido por su ' +
          'representante legal, el representante legal del menor de catorce años previa autorización, y el ' +
          'interesado con discapacidad con los apoyos y ajustes de procedimiento que precise, de modo que ser ' +
          'menor de dieciocho años no cierra la vía: por eso este criterio no altera el resultado. El artículo ' +
          '21.4 establece que la concesión caduca a los ciento ochenta días siguientes a su notificación si el ' +
          'interesado no comparece ante funcionario competente para cumplir los requisitos del artículo 23.',
      },
    },
    {
      id: 'es-cdn-renunciation-required',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-23-requisitos-comunes'],
      label: {
        en: 'Renunciation of the previous nationality will be required',
        es: 'Se exigirá la renuncia a la nacionalidad anterior',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'claimedNationality',
          values: [...SPAIN_NO_RENUNCIATION_NATIONALITIES],
        },
      },
      guidance: {
        en:
          'Nationals of the countries listed in art. 24.1 and «los sefardíes originarios de España» are excepted ' +
          'from the renunciation. The oath or promise and the entry in the Civil Registry apply in every case.',
        es:
          'Quedan a salvo de la renuncia los naturales de los países del artículo 24.1 y los sefardíes originarios ' +
          'de España. El juramento o promesa y la inscripción en el Registro Civil se exigen en todo caso.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['es-cc-art-23-requisitos-comunes', 'es-cc-art-21-carta-de-naturaleza'],
    note: {
      en:
        'A grant lapses 180 days after notification if the art. 23 conditions are not satisfied before the ' +
        'competent official in that time.',
      es:
        'La concesión caduca a los ciento ochenta días de su notificación si en ese plazo no se cumplen ante ' +
        'funcionario competente las condiciones del artículo 23.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Nationality by residence — the Sephardic two-year period
// ---------------------------------------------------------------------------

/**
 * `es.ts` records that art. 22.1 also confers the two-year period on sefardíes
 * and that the route "rests on evidence of origin rather than on present
 * nationality and is not modelled here". This is that route, modelled as far as
 * it honestly can be.
 *
 * The two-year period is live: it is in the Código Civil text as it stands, and
 * nothing in Ley 12/2015 or its expiry touched it. What is *not* settled is how
 * the condition is proved in a residence file, since the Código Civil prescribes
 * no means of proof and the ones Ley 12/2015 enumerated were enacted for its own,
 * now-closed, carta de naturaleza procedure. That question is escalated rather
 * than answered.
 */
export const esNationalityResidenceSephardic: Pathway = {
  id: 'es-nationality-residence-sephardic',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Spanish nationality by residence — two-year period for sefardíes',
    es: 'Nacionalidad española por residencia — plazo de dos años para sefardíes',
  },
  summary: {
    en:
      'Art. 22.1 of the Código Civil sets the same two-year residence period for sefardíes as for nationals by ' +
      'origin of the Ibero-American countries, Andorra, the Philippines, Equatorial Guinea and Portugal. It ' +
      'attaches to the person rather than to a nationality, so it is open whatever passport the applicant holds — ' +
      'and it is distinct from the closed special procedure that Ley 12/2015 ran between 2015 and 2019.',
    es:
      'El artículo 22.1 del Código Civil fija para los sefardíes el mismo plazo de residencia de dos años que para ' +
      'los nacionales de origen de los países iberoamericanos, Andorra, Filipinas, Guinea Ecuatorial y Portugal. ' +
      'Se reconoce a la persona y no a una nacionalidad, de modo que está abierto con independencia del pasaporte ' +
      'que se ostente, y es distinto del procedimiento especial, ya cerrado, que la Ley 12/2015 tramitó entre ' +
      '2015 y 2019.',
  },
  citations: [ccArt22_1Sefardies, ccArt22_3, ccArt22_4, ccArt23, rd1004Art6, ley12_2015, ordenPra325_2018],
  criteria: [
    {
      id: 'es-sef-sephardic-condition',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-1-sefardies', 'es-ley-12-2015-sefardies', 'es-orden-pra-325-2018-prorroga-sefardies'],
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'The Código Civil prescribes no means of proving the Sephardic condition, and the facts model holds nothing that bears on it.',
        es: 'El Código Civil no prescribe medio alguno para acreditar la condición de sefardí, y el modelo de datos no contiene nada que se refiera a ella.',
      },
      evaluator: { op: 'is_present', path: 'applicantId' },
      label: {
        en: 'The Sephardic condition is established to the satisfaction of the Civil Registry',
        es: 'Se acredita la condición de sefardí ante el Registro Civil',
      },
      guidance: {
        en:
          'This engine read nothing here. Art. 22.1 names sefardíes without defining the condition or the proof. ' +
          'Ley 12/2015 did enumerate means of proof — a certificate from the Federación de Comunidades Judías de ' +
          'España or from a competent rabbinical authority, use of ladino or haketía as a family language, a ' +
          'ketubah celebrated according to the traditions of Castile, a reasoned report on the Sephardic lineage ' +
          'of the surnames, and others — but it enacted them for its own carta de naturaleza procedure, whose ' +
          'application window ran from 1 October 2015 to 1 October 2019. Whether and how those means transfer to ' +
          'a nationality-by-residence file under art. 22.1 was not established in this verification, and it is ' +
          'not a question this engine should answer.',
        es:
          'Este motor no ha leído ningún dato en este criterio. El artículo 22.1 menciona a los sefardíes sin ' +
          'definir la condición ni su prueba. La Ley 12/2015 sí enumeró medios probatorios —certificado de la ' +
          'Federación de Comunidades Judías de España o de autoridad rabínica competente, uso del ladino o la ' +
          'haketía como idioma familiar, ketubah celebrada según las tradiciones de Castilla, informe motivado ' +
          'sobre la pertenencia de los apellidos al linaje sefardí, entre otros—, pero lo hizo para su propio ' +
          'procedimiento de carta de naturaleza, cuyo plazo de presentación corrió del 1 de octubre de 2015 al 1 ' +
          'de octubre de 2019. Si esos medios y cómo se trasladan a un expediente de nacionalidad por residencia ' +
          'del artículo 22.1 no se ha establecido en esta verificación, y no es una cuestión que este motor deba ' +
          'resolver.',
      },
    },
    {
      id: 'es-sef-two-years-continuous-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-1-sefardies', 'es-cc-art-22-3-residencia-legal-continuada'],
      label: {
        en: 'Two years of legal residence, continuous and immediately prior to the application',
        es: 'Dos años de residencia legal, continuada e inmediatamente anterior a la solicitud',
      },
      evaluator: {
        op: 'duration_since_at_least',
        path: 'derived.continuousLegalResidenceSince',
        years: 2,
      },
      guidance: {
        en:
          'The two years must be one unbroken run reaching the date of the application. A total of two years ' +
          'spread across separate periods does not satisfy art. 22.3, and where only a day count is recorded this ' +
          'engine answers "unknown" rather than guessing.',
        es:
          'Los dos años deben formar un periodo ininterrumpido que llegue hasta la fecha de solicitud. Un total de ' +
          'dos años repartido en periodos separados no cumple el artículo 22.3; si solo consta un número de días, ' +
          'el motor responde «desconocido» en lugar de suponer.',
      },
    },
    {
      id: 'es-sef-legal-status',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-3-residencia-legal-continuada'],
      label: {
        en: 'Residence is held under a valid authorisation',
        es: 'La residencia se ostenta al amparo de una autorización vigente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
    },
    {
      id: 'es-sef-ccse',
      kind: 'integration',
      weight: 'blocking',
      citationIds: ['es-rd-1004-2015-art-6', 'es-cc-art-22-4-conducta-integracion'],
      label: {
        en: 'CCSE constitutional and sociocultural knowledge test passed',
        es: 'Prueba CCSE de conocimientos constitucionales y socioculturales superada',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'lt', path: 'derived.ageYears', value: 18 },
          {
            op: 'collection_any',
            path: 'examResults',
            where: {
              op: 'all_of',
              of: [
                { op: 'equals', path: 'code', value: 'CCSE' },
                { op: 'is_true', path: 'passed' },
              ],
            },
          },
        ],
      },
      guidance: {
        en:
          'Art. 6.6 does not exempt applicants under eighteen or with judicially modified capacity from showing ' +
          'integration: it substitutes certificates from the education, residential or care centres they ' +
          'attended. This criterion treats being under eighteen as satisfying the examination limb and leaves ' +
          'that substitute evidence to the file. CCSE certificates also have a limited validity period, which is ' +
          'not checked here.',
        es:
          'El artículo 6.6 no exime de acreditar la integración a los menores de dieciocho años ni a las personas ' +
          'con capacidad modificada judicialmente: sustituye la prueba por certificados de los centros de ' +
          'formación, residencia, acogida, atención o educación especial en los que hayan estado inscritos. Este ' +
          'criterio da por cumplida la exigencia de examen cuando la persona es menor de dieciocho años y remite ' +
          'esa prueba sustitutiva al expediente. El certificado CCSE tiene además un periodo de validez limitado, ' +
          'que aquí no se comprueba.',
      },
    },
    {
      id: 'es-sef-dele-a2',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['es-rd-1004-2015-art-6'],
      label: {
        en: 'DELE A2 or higher in Spanish, unless exempt',
        es: 'DELE A2 o superior en español, salvo exención',
      },
      evaluator: {
        op: 'any_of',
        of: [
          // Art. 6.5 is a closed enumeration of twenty entries. The catalog's
          // shared list carries nineteen and omits Puerto Rico, which is on the
          // provision; `PR` is added here so this criterion matches the text
          // without editing a constant this file does not own.
          {
            op: 'one_of',
            path: 'claimedNationality',
            values: [...SPANISH_OFFICIAL_LANGUAGE_COUNTRIES, 'PR'],
          },
          { op: 'lt', path: 'derived.ageYears', value: 18 },
          {
            op: 'collection_any',
            path: 'languageCertifications',
            where: {
              op: 'all_of',
              of: [
                { op: 'equals', path: 'language', value: 'es' },
                { op: 'equals', path: 'framework', value: 'cefr' },
                { op: 'ordinal_at_least', path: 'level', scale: CEFR_SCALE, value: 'A2' },
              ],
            },
          },
        ],
      },
      guidance: {
        en:
          'Art. 6.5 dispenses with the DELE for anyone who already holds a DELE at A2 or above, and for nationals ' +
          'of a closed list of twenty entries. It is an enumeration, not a test of where Spanish is official: a ' +
          'Sephardic applicant holding, say, Turkish or Moroccan nationality is not on it and must sit the exam. ' +
          'A DELE recorded under something other than the CEFR framework is not detected by the third limb here.',
        es:
          'El artículo 6.5 dispensa del DELE a quien ya posea un DELE de nivel A2 o superior y a los nacionales de ' +
          'una lista cerrada de veinte entradas. Es una enumeración, no una prueba de dónde es oficial el ' +
          'español: un solicitante sefardí con nacionalidad, por ejemplo, turca o marroquí no figura en ella y ' +
          'debe examinarse. Un DELE registrado bajo un marco distinto del MCER no lo detecta el tercer supuesto ' +
          'de este criterio.',
      },
    },
    {
      id: 'es-sef-civic-conduct',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-4-conducta-integracion'],
      label: {
        en: 'Police certificates from Spain and from the country of nationality show no convictions',
        es: 'Certificados de antecedentes penales de España y del país de nacionalidad sin condenas',
      },
      evaluator: {
        op: 'all_of',
        of: [
          {
            op: 'collection_any',
            path: 'criminalRecord.certificates',
            where: {
              op: 'all_of',
              of: [
                { op: 'equals', path: 'jurisdiction', value: 'ES' },
                { op: 'is_true', path: 'clear' },
              ],
            },
          },
          {
            op: 'collection_any',
            path: 'criminalRecord.certificates',
            where: {
              op: 'all_of',
              of: [
                { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
                { op: 'is_true', path: 'clear' },
              ],
            },
          },
        ],
      },
      guidance: {
        en:
          'Clear certificates are evidence toward good civic conduct; they are not the whole of it. Art. 22.4 is a ' +
          'discretionary assessment and a clear record does not oblige the authority to decide in the applicant’s ' +
          'favour.',
        es:
          'Los certificados sin antecedentes son prueba de buena conducta cívica, pero no la agotan. El artículo ' +
          '22.4 establece una valoración discrecional y un expediente limpio no vincula a la autoridad.',
      },
    },
    {
      id: 'es-sef-renunciation-exemption',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-23-requisitos-comunes'],
      label: {
        en: 'Also exempt from renunciation on the nationality ground in art. 24.1',
        es: 'Exento además de la renuncia por la vía de la nacionalidad del artículo 24.1',
      },
      evaluator: {
        op: 'one_of',
        path: 'claimedNationality',
        values: [...SPAIN_NO_RENUNCIATION_NATIONALITIES],
      },
      guidance: {
        en:
          'Art. 23.b) excepts «los sefardíes originarios de España» from the renunciation in their own right, so ' +
          'anyone qualifying on this route is exempt whatever their present nationality. This criterion records ' +
          'the separate, nationality-based exemption in art. 24.1, which may also apply.',
        es:
          'El artículo 23.b) exceptúa de la renuncia a los sefardíes originarios de España por derecho propio, de ' +
          'modo que quien acceda por esta vía está exento cualquiera que sea su nacionalidad actual. Este criterio ' +
          'deja constancia de la exención distinta, basada en la nacionalidad, del artículo 24.1, que puede ' +
          'concurrir además.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['es-cc-art-23-requisitos-comunes'],
    note: {
      en:
        'Acquisition takes effect only once the oath or promise is made and the entry is made in the Civil ' +
        'Registry. The grant is not the end of the matter.',
      es:
        'La adquisición solo surte efecto tras el juramento o promesa y la inscripción en el Registro Civil. La ' +
        'concesión no cierra el expediente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const ES_FAMILY_NATIONALITY_PATHWAYS: readonly Pathway[] = [
  esFamilyReunification,
  esEuFamilyMemberCard,
  esEuFamilyPermanentResidence,
  esNationalityOption,
  esNationalityDemocraticMemoryOption,
  esNationalityCartaDeNaturaleza,
  esNationalityResidenceSephardic,
];
