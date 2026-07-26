/**
 * Spain — the ordinary work and study routes, and long-term residence.
 *
 * Seven pathways: employed work (*cuenta ajena*), self-employed work (*cuenta
 * propia*), the study stay (*estancia de larga duración por estudios*), the
 * modification from that stay into residence and work, the entrepreneur route
 * under Ley 14/2013, and the two long-term residence statuses that most of
 * these routes end in.
 *
 * **The governing regulation is Real Decreto 1155/2024**, in force 20 May 2025,
 * which repealed RD 557/2011 in full. Every article cited here was read on
 * 2026-07-25 against the BOE consolidated text, block by block, through BOE's
 * own legislation-consolidation API. Where BOE records an article as having a
 * single version stamped 20/05/2025, RD 316/2026 did not touch it; art. 190 is
 * the one article used here that BOE serves in an amended (16/04/2026) version,
 * and its citation note says so.
 *
 * **The entrepreneur route is open and is not the golden visa.** Ley Orgánica
 * 1/2025 left arts. 63-67 of Ley 14/2013 without content from 3 April 2025 —
 * the *investor* articles. Arts. 69 and 70, the entrepreneur articles, are
 * recorded in BOE's consolidated text as amended only by Ley 28/2022, and they
 * still support new applications. `es-golden-visa` in `es.ts` models the
 * repealed investor route; this file must not be read as reopening it.
 *
 * **Asylum, refugee protection and humanitarian claims are out of scope for
 * this catalog by explicit decision, and nothing here changes that.** Two
 * provisions touched by this file brush against the line and are deliberately
 * left unencoded: art. 183.3.f) of the Reglamento, which opens national
 * long-term residence to stateless persons, refugees and beneficiaries of
 * subsidiary protection, and art. 176.a) of the Reglamento, which counts time
 * from the date an international-protection claim was lodged. Anyone in those
 * positions needs a qualified immigration lawyer, not an eligibility checker;
 * the guidance on the long-term residence pathways says so in both languages.
 *
 * Everything here ships `reviewStatus: 'unreviewed'`, which is the accurate
 * state of these records. No licensed person has read them.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import type { Pathway } from '../schema.js';

const ES: CountryCode = countryCode('ES');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

/** Consolidated text of the Reglamento. Serves every article cited from it. */
const RLOEX_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099';

/** Consolidated text of Ley 14/2013, including the international-mobility section. */
const LEY_14_2013_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-2013-10074';

// ---------------------------------------------------------------------------
// Citations — the study stay (Título III, Capítulo II) and its visa
// ---------------------------------------------------------------------------

const rloexArt35 = {
  id: 'es-rloex-art-35',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 35',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Requirements for the study-stay visa. Means are set at 100 % of IPREM per month for the applicant, plus 75 % ' +
    'for the first dependent family member and 50 % for each further one, and the Reglamento expressly admits ' +
    'grants, subsidies and scholarships, a valid employment contract or firm job offer where the authorisation ' +
    'permits work, and a declaration of assumption of costs by the host institution. Health cover must be with an ' +
    'insurer authorised to operate in Spain and comparable to the basic common portfolio of the Sistema Nacional ' +
    'de Salud. Minimum age is seventeen for higher studies and eighteen for post-compulsory secondary studies and ' +
    'formative activities.',
};

const rloexArt52 = {
  id: 'es-rloex-art-52',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 52',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Defines the five activities the stay covers: higher studies as the principal full-time activity at a ' +
    'recognised institution, post-compulsory secondary studies, a pupil-mobility programme, a voluntary-service ' +
    'programme, and a closed list of formative activities. Research and non-labour internships are not here — ' +
    'art. 52.3 refers them to Ley 14/2013.',
};

const rloexArt53 = {
  id: 'es-rloex-art-53',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 53',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Admission by the institution and payment of enrolment or registration fees, stated separately for each of the ' +
    'activities in art. 52.1. Meridian holds no admission record and does not test this limb.',
};

const rloexArt53_2 = {
  id: 'es-rloex-art-53-2',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'arts. 53.2 y 54.4',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. Art. 53.2 requires that the applicant not be a threat to public order, public ' +
    'security or public health, established by checking for the absence of a criminal record in Spain and by ' +
    'evaluating a police report. Art. 54.4 states that the existence of a record in the police report is not by ' +
    'itself and automatically a ground of refusal: the competent body assesses it case by case. The office obtains ' +
    'both documents of its own motion, so an applicant will not normally hold them.',
};

const rloexArt55 = {
  id: 'es-rloex-art-55',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 55',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Duration equals that of the studies or programme with a one-year ceiling, except for higher studies under ' +
    'art. 52.1.a) where it coincides with the official duration of the studies. Validity begins one month before ' +
    'the activity starts and extends fifteen days beyond its end. Up to two extensions for higher and ' +
    'post-compulsory secondary studies; one for voluntary service and formative activities.',
};

const rloexArt57 = {
  id: 'es-rloex-art-57',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 57',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'A higher-studies stay under art. 52.1.a) carries authorisation to work, employed or self-employed, ' +
    'automatically and without a further application, provided the work is compatible with the studies. The other ' +
    'categories need a separate work authorisation. Work is capped at thirty hours a week in aggregate, except ' +
    'for intensive vocational training; exceeding the cap extinguishes the stay. Curricular placements forming ' +
    'part of the study plan need no additional authorisation.',
};

// ---------------------------------------------------------------------------
// Citations — employed work (Título IV, Capítulo III)
// ---------------------------------------------------------------------------

const rloexArt72 = {
  id: 'es-rloex-art-72',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 72',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Defines the situation: a foreign national over sixteen authorised to reside in Spain for more than ninety ' +
    'calendar days and less than five years, and to work as an employee.',
};

const rloexArt73 = {
  id: 'es-rloex-art-73',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 73',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The initial authorisation lasts as long as the activity to be performed, with a ceiling of one year, and is ' +
    'limited to one autonomous community and one occupation unless the national employment situation does not ' +
    'apply. It takes effect only on registration with the corresponding Social Security scheme within three ' +
    'months of legal entry, and it also permits self-employed activity while the employed activity remains the ' +
    'principal one.',
};

const rloexArt74 = {
  id: 'es-rloex-art-74',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 74.1',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The nine cumulative requirements. Among them: the employer produces a contract signed by both parties ' +
    'providing continuous activity for the life of the authorisation; the contract terms match the legislation ' +
    'and the collective agreement applicable to the same activity, professional category and locality, and where ' +
    'the contract is part-time the total remuneration must equal or exceed the full-time minimum interprofessional ' +
    'wage in annual terms; the employer is current with tax and Social Security obligations and has means ' +
    'sufficient for the business and for the contract; and the worker holds the capability and, where the ' +
    'profession requires it, the legally required professional qualification.',
};

const rloexArt74_1h = {
  id: 'es-rloex-art-74-1-h',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 74.1.h)',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. The requirement is not to represent a threat to public order, public security ' +
    'or public health, established by checking for the absence of a criminal record in Spain and by evaluating a ' +
    'police report. The absence of a Spanish record is a bright line; the evaluation of the police report is not, ' +
    'and the administration obtains both of its own motion.',
};

const rloexArt75 = {
  id: 'es-rloex-art-75',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 75',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The national employment situation. The Servicio Público de Empleo Estatal draws up a catalogue of ' +
    'hard-to-fill occupations quarterly, per autonomous community and for Ceuta and Melilla, and may narrow it to ' +
    'provincial or island scope on a reasoned request. Where the occupation is not on the catalogue, the employer ' +
    'may instead obtain a certificate that there were insufficient jobseekers, after the public employment service ' +
    'has managed the vacancy for eight days. The catalogue changes every quarter and differs by territory, so ' +
    'Meridian does not carry a copy of it.',
};

const rloexArt81 = {
  id: 'es-rloex-art-81',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 81.1',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The renewed authorisation runs four years, unless long-term residence is due instead, and permits any ' +
    'activity anywhere in Spain, employed or self-employed. The geographic and occupational limits on the initial ' +
    'authorisation therefore fall away on the first renewal.',
};

// ---------------------------------------------------------------------------
// Citations — self-employed work (Título IV, Capítulo IV)
// ---------------------------------------------------------------------------

const rloexArt82 = {
  id: 'es-rloex-art-82',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 82',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Defines the situation: a foreign national over eighteen authorised to reside in Spain for more than ninety ' +
    'calendar days and less than five years, and to carry on a gainful activity on their own account. The ' +
    'age floor is two years higher than the employed route.',
};

const rloexArt83 = {
  id: 'es-rloex-art-83',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 83',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The initial authorisation lasts one year and is limited to one autonomous community and one sector of ' +
    'activity. Unlike the employed route, the one-year figure is fixed rather than a ceiling on the length of the ' +
    'activity.',
};

const rloexArt84 = {
  id: 'es-rloex-art-84',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 84',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The six requirements: meeting the conditions Spanish law imposes on nationals for opening and running the ' +
    'projected activity; holding the legally required professional qualification or sufficient proven experience ' +
    'where the activity requires it, and professional-body registration where that is required; evidencing that ' +
    'the planned investment is sufficient to establish the project and its effect on job creation, self-employment ' +
    'included; not being within a non-return commitment period; not representing a threat to public order, ' +
    'security or health; and payment of the fee. No monetary threshold appears anywhere in the article.',
};

const rloexArt84e = {
  id: 'es-rloex-art-84-e',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'arts. 84.e) y 85.2',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. Art. 84.e) requires that the applicant not be a threat to public order, public ' +
    'security or public health. Art. 85.2 states that the existence of a record in the police report is not by ' +
    'itself and automatically a ground of refusal, and that the competent body assesses case by case whether the ' +
    'applicant is a threat. The office obtains the Spanish criminal-record certificate and the police report of ' +
    'its own motion.',
};

const rloexArt87 = {
  id: 'es-rloex-art-87',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 87.1',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The renewed self-employment authorisation runs four years, unless long-term residence is due instead, and ' +
    'permits employed and self-employed work anywhere in Spain and in any sector.',
};

// ---------------------------------------------------------------------------
// Citations — modification from the study stay (Título XI)
// ---------------------------------------------------------------------------

const rloexArt190 = {
  id: 'es-rloex-art-190',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 190',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Modification from a study or formative stay into residence and work, without a visa. It is open to holders ' +
    'of stays granted under arts. 52.1.a), 52.1.b) and 52.1.e).4.º and 5.º who have obtained the qualification or ' +
    'certificate, and it is closed to anyone who held a grant or subsidy from a public or private body under a ' +
    'Spanish or home-country development-cooperation or humanitarian-action programme. The employed variant ' +
    'requires the art. 74 conditions except art. 74.1.a), so the national employment situation does not apply; the ' +
    'self-employed variant requires art. 84. The authorisation granted runs one year. BOE serves apartado 6, the ' +
    'filing window, in the wording given to it by Real Decreto 316/2026, de 14 de abril, in force 16 April 2026; ' +
    'that amended wording is the one summarised here.',
};

// ---------------------------------------------------------------------------
// Citations — long-term residence (Título X)
// ---------------------------------------------------------------------------

const rloexArt175 = {
  id: 'es-rloex-art-175',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 175',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Long-term residence-EU is authorisation to reside and work in Spain indefinitely on the same conditions as ' +
    'Spanish nationals, carrying the status established by Directive 2003/109/EC.',
};

const rloexArt176 = {
  id: 'es-rloex-art-176',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 176',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Five years of legal, continuous residence in Spain before the application. Continuity survives absences of up ' +
    'to six consecutive months provided they total no more than ten months across the five years, or eighteen ' +
    'months where the absences are for work reasons, and provided the departures were not irregular. Time spent ' +
    'on a stay for studies, pupil mobility, voluntary service or formative activities counts at 50 % of its ' +
    'length, and only where the applicant is in a residence situation in Spain when the application is made. ' +
    'Art. 176.b) requires fixed and regular resources sufficient for the applicant and any family, in the terms ' +
    'and amounts the Reglamento sets for family reunification, and those may come from own means or from ' +
    'employment or professional activity. Art. 176.c) requires health insurance, and says nothing more than that.',
};

const rloexArt177 = {
  id: 'es-rloex-art-177',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'arts. 177.3.f) y 177.5',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. Art. 177.3.f) asks, where applicable, for a criminal-record certificate or ' +
    'equivalent from the country of origin or from the countries of residence over the last five years; the office ' +
    'obtains the Spanish certificate and the police report itself. Art. 177.5 lets the competent body refuse the ' +
    'status if, having assessed the matter, it considers the applicant a threat on public-order or public-security ' +
    'grounds. That assessment is a judgement, not a threshold.',
};

const rloexArt178 = {
  id: 'es-rloex-art-178',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 178',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'What is renewed is the identity card, not the status. The first renewal falls at five years; subsequent ' +
    'renewals every five years until the holder turns thirty and every ten years thereafter. Failure to renew the ' +
    'card does not in any case extinguish the long-term residence authorisation.',
};

const rloexArt182 = {
  id: 'es-rloex-art-182',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 182',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'National long-term residence is authorisation to reside and work in Spain indefinitely on the same conditions ' +
    'as Spanish nationals. It does not carry the Directive 2003/109/EC status, and so does not carry the ' +
    'intra-EU mobility that goes with it.',
};

const rloexArt183 = {
  id: 'es-rloex-art-183',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'arts. 183.1 y 183.2',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Five years of legal, continuous residence in Spain before the application, with the same absence limits as ' +
    'the EU variant: up to six consecutive months, totalling no more than ten months across the five years, or ' +
    'eighteen months where the absences are for work reasons, and provided the departures were not irregular. ' +
    'Unlike art. 176, this article states no means requirement and no health-insurance requirement.',
};

const rloexArt183_2FuerzaMayor = {
  id: 'es-rloex-art-183-2-fuerza-mayor',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 183.2, párrafos tercero y cuarto',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. Continuity is also unaffected by duly justified absences for force majeure, ' +
    'and the deciding body assesses individually whether an exceptional situation justified them. A separate limb ' +
    'protects holders working abroad for registered non-governmental organisations, foundations or associations ' +
    'recognised as being of public utility on research, development-cooperation or humanitarian projects.',
};

const rloexArt183_3 = {
  id: 'es-rloex-art-183-3',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 183.3',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Seven alternative routes to national long-term residence that require no five-year period: holders of a ' +
    'Spanish contributory retirement pension; holders of a contributory pension for absolute permanent incapacity ' +
    'or gran invalidez, or an analogous non-capitalisable life annuity obtained in Spain sufficient for their ' +
    'support; residents born in Spain who on reaching majority have three consecutive years of legal continuous ' +
    'residence; former Spanish nationals by origin; residents who on reaching majority have spent the five ' +
    'preceding years under the guardianship of a Spanish public entity; stateless persons, refugees and ' +
    'beneficiaries of subsidiary protection; and persons who have notably contributed to Spain economically, ' +
    'scientifically or culturally. None of the seven is modelled here.',
};

const rloexArt184 = {
  id: 'es-rloex-art-184',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'arts. 184.2 y 184.3',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 184.2 puts the application in the two months before the current residence authorisation expires, or the ' +
    'three months after, and filing in either window extends the previous authorisation until the decision. ' +
    'Art. 184.3 lists the documents, including a report from the competent regional authorities evidencing that ' +
    'dependent children of compulsory school age are enrolled in school, and, where applicable, a criminal-record ' +
    'certificate from the country of origin or the countries of residence over the last five years.',
};

const rloexArt184_5 = {
  id: 'es-rloex-art-184-5',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 184.5',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. The competent body may refuse national long-term residence if, having assessed ' +
    'the matter, it considers the applicant a threat on public-order or public-security grounds. That is a ' +
    'judgement rather than a threshold, and a clear criminal record does not settle it.',
};

const rloexArt185 = {
  id: 'es-rloex-art-185',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 185',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'What is renewed is the identity card, not the status: first renewal at five years, then every five years ' +
    'until the holder turns thirty and every ten years thereafter. Failure to renew does not extinguish the ' +
    'authorisation, though the office will check that the conditions that gave access to it still hold.',
};

// ---------------------------------------------------------------------------
// Citations — Ley 14/2013, the entrepreneur route and the post-study residence
// ---------------------------------------------------------------------------

const ley14Art62 = {
  id: 'es-ley-14-2013-art-62',
  kind: 'statute' as const,
  instrument: 'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización',
  provision: 'art. 62.3',
  url: LEY_14_2013_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'General requirements for every residence visa and authorisation in the international-mobility section: not ' +
    'being irregularly in Spain; being over eighteen; having no criminal record in Spain or in the countries of ' +
    'residence over the last two years for offences that exist in Spanish law, together with a responsible ' +
    'declaration that there is none over the last five; not being listed as inadmissible in states with which ' +
    'Spain has an agreement to that effect; holding public health insurance or private health insurance with an ' +
    'insurer authorised to operate in Spain; having sufficient economic resources for the applicant and their ' +
    'family for the period of residence, with no figure stated; and payment of the fee.',
};

const ley14Art69 = {
  id: 'es-ley-14-2013-art-69',
  kind: 'statute' as const,
  instrument: 'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización',
  provision: 'art. 69',
  url: LEY_14_2013_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Residence for entrepreneurs. The authorisation is valid throughout Spain and runs three years; after that it ' +
    'may be renewed for two, and permanent residence becomes available at five years. Applications go to the ' +
    'Unidad de Grandes Empresas y Colectivos Estratégicos electronically. BOE records this article as amended only ' +
    'by Ley 28/2022, de 21 de diciembre: Ley Orgánica 1/2025, which left the investor articles 63 to 67 without ' +
    'content from 3 April 2025, did not touch it. Art. 68, entry and stay to begin a business activity, was ' +
    'separately deleted by Ley 28/2022 and should not be cited.',
};

const ley14Art70 = {
  id: 'es-ley-14-2013-art-70',
  kind: 'statute' as const,
  instrument: 'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización',
  provision: 'art. 70',
  url: LEY_14_2013_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DISCRETIONARY BY CONSTRUCTION. An activity counts as entrepreneurial where it is innovative or of special ' +
    'economic interest for Spain, and to that end has a favourable report from ENISA, which the Unidad de Grandes ' +
    'Empresas y Colectivos Estratégicos requests of its own motion and which is mandatory. The assessment weighs ' +
    'the applicant’s professional profile and involvement in the project, the business plan and its financing, and ' +
    'the elements generating added value for the Spanish economy, innovation or investment opportunities. Those ' +
    'are evaluative criteria, not thresholds, and no monetary figure appears in the article.',
};

const ley14Da17 = {
  id: 'es-ley-14-2013-da-17',
  kind: 'statute' as const,
  instrument: 'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización',
  provision: 'disposición adicional decimoséptima',
  url: LEY_14_2013_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'A separate residence authorisation for a graduate to look for work or start a business. On finishing studies ' +
    'at a higher-education institution at European Qualifications Framework level 6 or above, the holder may stay ' +
    'in Spain for a maximum, non-extendable twenty-four months. It is applied for electronically in the sixty ' +
    'calendar days before the study stay expires or the ninety calendar days after it has expired, and the ' +
    'administration checks only the qualification, health insurance and continued sufficiency of resources, the ' +
    'last by responsible declaration. Art. 190.10 of the Reglamento points graduates at this route. It is not ' +
    'modelled as a pathway in this catalog.',
};

const lo1_2025Df21_1 = {
  id: 'es-lo-1-2025-df-21-1',
  kind: 'statute' as const,
  instrument: 'Ley Orgánica 1/2025, de 2 de enero, de medidas en materia de eficiencia del Servicio Público de Justicia',
  provision: 'disposición final vigesimoprimera.1',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2025-76',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Left art. 63 of Ley 14/2013, the investor residence visa, without content with effect from 3 April 2025, and ' +
    'arts. 64 to 67 with it. It did not touch arts. 69 and 70, the entrepreneur articles, whose amendment history ' +
    'in the BOE consolidated text records only Ley 28/2022 and, for art. 70, Ley 25/2015. The repealed investor ' +
    'route is modelled separately as es-golden-visa; this pathway is a different route and does not reopen it.',
};

// ---------------------------------------------------------------------------
// Residencia temporal y trabajo por cuenta ajena
// ---------------------------------------------------------------------------

export const esWorkPermitEmployed: Pathway = {
  id: 'es-work-permit-employed',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Temporary residence and employed work (cuenta ajena)',
    es: 'Residencia temporal y trabajo por cuenta ajena',
  },
  summary: {
    en:
      'The ordinary route for a person with a job offer from an employer in Spain. The initial authorisation is ' +
      'tied to one occupation and one autonomous community and normally turns on the national employment ' +
      'situation; the first renewal runs four years and lifts both limits.',
    es:
      'La vía ordinaria para quien cuenta con una oferta de empleo de una empresa en España. La autorización ' +
      'inicial queda ligada a una ocupación y a una comunidad autónoma y depende, por regla general, de la ' +
      'situación nacional de empleo; la primera renovación dura cuatro años y levanta ambas limitaciones.',
  },
  citations: [rloexArt72, rloexArt73, rloexArt74, rloexArt74_1h, rloexArt75, rloexArt81],
  criteria: [
    {
      id: 'es-ajena-minimum-age',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-rloex-art-72'],
      label: {
        en: 'At least sixteen years old',
        es: 'Mayor de dieciséis años',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 16 },
      guidance: {
        en:
          'Sixteen is the minimum working age this route is built on. The self-employment route requires eighteen, ' +
          'so a seventeen-year-old has only the employed route available.',
        es:
          'Dieciséis años es la edad laboral mínima sobre la que se construye esta vía. La vía por cuenta propia ' +
          'exige dieciocho, de modo que una persona de diecisiete solo dispone de la vía por cuenta ajena.',
      },
    },
    {
      id: 'es-ajena-employment-contract',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-rloex-art-74', 'es-rloex-art-73'],
      label: {
        en: 'A signed employment contract with an employer in Spain',
        es: 'Contrato de trabajo firmado con un empleador en España',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'ES' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
      guidance: {
        en:
          'Art. 74.1.b) requires a contract signed by both the employer and the worker, providing continuous ' +
          'activity for the life of the authorisation, whose start date is conditioned on the authorisation taking ' +
          'effect. The Reglamento does not phrase the employer test as establishment in Spain; it reaches the same ' +
          'place through art. 74.1.d) and e), which require the employer to be current with Spanish tax and Social ' +
          'Security obligations and to hold means sufficient for the business and the contract. The authorisation ' +
          'itself only takes effect once the worker is registered with the corresponding Social Security scheme, ' +
          'within three months of legal entry.',
        es:
          'El art. 74.1.b) exige un contrato firmado por el empleador y por la persona trabajadora, que establezca ' +
          'una actividad continuada durante la vigencia de la autorización y cuya fecha de comienzo quede ' +
          'condicionada a la eficacia de esta. El Reglamento no formula el requisito como radicación del empleador ' +
          'en España: llega al mismo punto por los arts. 74.1.d) y e), que exigen al empleador estar al corriente ' +
          'de sus obligaciones tributarias y de Seguridad Social y contar con medios suficientes para su proyecto y ' +
          'para el contrato. La autorización solo surte efecto con el alta en el régimen correspondiente de la ' +
          'Seguridad Social dentro de los tres meses desde la entrada legal.',
      },
    },
    {
      id: 'es-ajena-remuneration-smi',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['es-rloex-art-74'],
      label: {
        en: 'Remuneration at least the full-time annual minimum interprofessional wage (SMI)',
        es: 'Retribución no inferior al salario mínimo interprofesional anual a jornada completa',
      },
      evaluator: { op: 'gte', path: 'derived.jobOfferSalarySmiMultiple', value: 1 },
      guidance: {
        en:
          'Art. 74.1.c) states the figure explicitly only for part-time contracts, where total remuneration must ' +
          'equal or exceed the full-time SMI in annual terms. For full-time contracts the article requires the ' +
          'terms to match the legislation and the applicable collective agreement, which may set a higher wage than ' +
          'the SMI — meeting this criterion is therefore necessary but not sufficient. The SMI is re-set annually ' +
          'by decree, so the current figure must be supplied with the applicant’s facts; without it this criterion ' +
          'reports unknown rather than measuring against a stale number.',
        es:
          'El art. 74.1.c) fija la cifra de forma expresa solo para los contratos a tiempo parcial, en los que la ' +
          'retribución total debe igualar o superar el SMI a jornada completa en cómputo anual. Para la jornada ' +
          'completa el artículo exige que las condiciones se ajusten a la normativa vigente y al convenio ' +
          'colectivo aplicable, que puede fijar un salario superior al SMI: cumplir este criterio es necesario, no ' +
          'suficiente. El SMI se actualiza anualmente por decreto, por lo que la cifra vigente debe aportarse junto ' +
          'con los datos del solicitante; sin ella, el criterio responde «desconocido» en lugar de medir contra una ' +
          'cifra caducada.',
      },
    },
    {
      id: 'es-ajena-national-employment-situation',
      kind: 'employment',
      weight: 'material',
      citationIds: ['es-rloex-art-75', 'es-rloex-art-74'],
      label: {
        en: 'The national employment situation must permit the hire',
        es: 'La situación nacional de empleo debe permitir la contratación',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.occupationCode' },
      humanReviewWhen: { op: 'is_present', path: 'jobOffer.occupationCode' },
      humanReviewReason: {
        en:
          'The catalogue of hard-to-fill occupations is redrawn quarterly and differs by autonomous community, and ' +
          'the alternative route runs through a certificate the public employment service issues after managing ' +
          'the vacancy. Neither is something software can decide from an occupation code.',
        es:
          'El catálogo de ocupaciones de difícil cobertura se elabora trimestralmente y varía por comunidad ' +
          'autónoma, y la vía alternativa pasa por un certificado que emite el servicio público de empleo tras ' +
          'gestionar la oferta. Ninguna de las dos puede resolverse automáticamente a partir de un código de ' +
          'ocupación.',
      },
      guidance: {
        en:
          'There are three ways past this requirement: the occupation appears on the catalogue of hard-to-fill ' +
          'occupations for the relevant territory; the employer obtains a certificate of insufficient jobseekers ' +
          'after the public employment service has managed the vacancy for eight days; or the case falls within ' +
          'art. 40 of Ley Orgánica 4/2000 or an international convention, in which case the national employment ' +
          'situation is not considered at all. Meridian records the occupation and routes the question to a person.',
        es:
          'Hay tres formas de superar este requisito: que la ocupación figure en el catálogo de ocupaciones de ' +
          'difícil cobertura del territorio correspondiente; que el empleador obtenga un certificado de ' +
          'insuficiencia de demandantes tras gestionar el servicio público de empleo la oferta durante ocho días; ' +
          'o que el supuesto quede comprendido en el art. 40 de la Ley Orgánica 4/2000 o en un convenio ' +
          'internacional, en cuyo caso no se atiende a la situación nacional de empleo. Meridian deja constancia ' +
          'de la ocupación y deriva la cuestión a una persona.',
      },
    },
    {
      id: 'es-ajena-professional-capacity',
      kind: 'qualification',
      weight: 'material',
      citationIds: ['es-rloex-art-74'],
      label: {
        en: 'Capability and, where the profession requires it, the legally required qualification',
        es: 'Capacitación y, cuando la profesión lo exija, la cualificación profesional legalmente requerida',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'is_present', path: 'professionalCredentials' },
          { op: 'is_present', path: 'professionalExperienceYears' },
        ],
      },
      guidance: {
        en:
          'Art. 74.1.f) bites only where the profession is regulated. Meridian cannot tell which occupations are ' +
          'regulated in Spain, so this criterion records only whether a qualification or a period of experience is ' +
          'on file; it is not a finding that the qualification is the right one, and a foreign qualification for a ' +
          'regulated profession will normally need homologation or recognition before it can be relied on.',
        es:
          'El art. 74.1.f) solo opera cuando la profesión está regulada. Meridian no puede determinar qué ' +
          'ocupaciones lo están en España, por lo que este criterio únicamente deja constancia de que consta una ' +
          'titulación o un periodo de experiencia; no afirma que la titulación sea la exigida, y un título ' +
          'extranjero para una profesión regulada requerirá por lo general homologación o reconocimiento previo.',
      },
    },
    {
      id: 'es-ajena-public-order',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-74-1-h'],
      label: {
        en: 'No criminal record in Spain, and no public-order objection',
        es: 'Carecer de antecedentes penales en España y no representar una amenaza para el orden público',
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
          'This is weighted as material rather than blocking on purpose. The administration obtains the Spanish ' +
          'criminal-record certificate and the police report of its own motion, so an applicant filing from abroad ' +
          'will normally hold neither and this criterion will read as unknown or unmet for them without that ' +
          'meaning anything is wrong. The second limb — whether the applicant represents a threat — is a ' +
          'case-by-case assessment and a clear record does not settle it.',
        es:
          'Se pondera como material y no como bloqueante de forma deliberada. La Administración recaba de oficio el ' +
          'certificado de antecedentes penales español y el informe policial, por lo que quien solicita desde el ' +
          'extranjero no dispondrá normalmente de ninguno de los dos y el criterio aparecerá como desconocido o no ' +
          'cumplido sin que ello signifique nada. El segundo aspecto —si la persona representa una amenaza— es una ' +
          'valoración casuística que un expediente limpio no resuelve.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 48,
    countsTowardNaturalisation: true,
    citationIds: ['es-rloex-art-73', 'es-rloex-art-81'],
    note: {
      en:
        'The initial authorisation lasts as long as the activity to be performed, with a ceiling of one year, so ' +
        'twelve months is the maximum rather than the norm. It is limited to one autonomous community and one ' +
        'occupation. The first renewal runs four years and permits any activity anywhere in Spain, employed or ' +
        'self-employed — unless long-term residence is due instead, which it will be once five years of legal ' +
        'continuous residence have accrued.',
      es:
        'La autorización inicial dura lo que la actividad a desarrollar, con el máximo de un año, de modo que doce ' +
        'meses es el techo y no la regla. Queda limitada a una comunidad autónoma y a una ocupación. La primera ' +
        'renovación dura cuatro años y habilita para cualquier actividad en todo el territorio, por cuenta ajena o ' +
        'propia, salvo que corresponda una autorización de residencia de larga duración, como sucederá al cumplir ' +
        'cinco años de residencia legal continuada.',
    },
  },
  leadsTo: [
    'es-long-term-residence-eu',
    'es-long-term-residence-national',
    'es-nationality-residence-reduced',
    'es-nationality-residence-general',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residencia temporal y trabajo por cuenta propia
// ---------------------------------------------------------------------------

export const esWorkPermitSelfEmployed: Pathway = {
  id: 'es-work-permit-self-employed',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Temporary residence and self-employed work (cuenta propia)',
    es: 'Residencia temporal y trabajo por cuenta propia',
  },
  summary: {
    en:
      'Residence and work authorisation for a person setting up their own activity in Spain. The national ' +
      'employment situation does not apply, but the applicant must satisfy everything Spanish law asks of a ' +
      'national opening the same business and must evidence that the planned investment is sufficient.',
    es:
      'Autorización de residencia y trabajo para quien establece su propia actividad en España. No se aplica la ' +
      'situación nacional de empleo, pero la persona solicitante debe cumplir cuanto la legislación española exige ' +
      'a un nacional para abrir el mismo negocio y acreditar la suficiencia de la inversión prevista.',
  },
  citations: [rloexArt82, rloexArt83, rloexArt84, rloexArt84e, rloexArt87],
  criteria: [
    {
      id: 'es-propia-minimum-age',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-rloex-art-82'],
      label: {
        en: 'At least eighteen years old',
        es: 'Mayor de dieciocho años',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
    },
    {
      id: 'es-propia-self-employed-activity',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-rloex-art-82'],
      label: {
        en: 'The activity is carried on for the applicant’s own account',
        es: 'La actividad se ejerce por cuenta propia',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'equals', path: 'employmentType', value: 'self_employed' },
          { op: 'is_true', path: 'jobOffer.selfEmployment' },
        ],
      },
      guidance: {
        en:
          'If the work is in fact employment for another, the employed route applies instead and its national ' +
          'employment situation requirement comes with it.',
        es:
          'Si el trabajo es en realidad por cuenta de otro, corresponde la vía por cuenta ajena, con el requisito ' +
          'de situación nacional de empleo que la acompaña.',
      },
    },
    {
      id: 'es-propia-professional-qualification',
      kind: 'qualification',
      weight: 'material',
      citationIds: ['es-rloex-art-84'],
      label: {
        en: 'The professional qualification or proven experience the activity requires',
        es: 'Cualificación profesional o experiencia acreditada que la actividad exija',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'is_present', path: 'professionalCredentials' },
          { op: 'is_present', path: 'professionalExperienceYears' },
        ],
      },
      guidance: {
        en:
          'Art. 84.b) applies only where the activity requires a qualification, and it fixes no number of years of ' +
          'experience. Where the activity requires membership of a professional body, that registration is ' +
          'required too. Meridian records only whether a qualification or a period of experience is on file.',
        es:
          'El art. 84.b) solo se aplica cuando la actividad lo exige, y no fija ningún número de años de ' +
          'experiencia. Cuando la actividad requiera colegiación, esta también es exigible. Meridian únicamente ' +
          'deja constancia de que consta una titulación o un periodo de experiencia.',
      },
    },
    {
      id: 'es-propia-investment-sufficiency',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-rloex-art-84'],
      label: {
        en: 'Evidence that the planned investment is sufficient to establish the project',
        es: 'Acreditación de la suficiencia de la inversión prevista para implantar el proyecto',
      },
      evaluator: { op: 'is_present', path: 'qualifyingInvestment.minorUnits' },
      humanReviewWhen: { op: 'is_present', path: 'qualifyingInvestment.minorUnits' },
      humanReviewReason: {
        en:
          'Art. 84.c) sets no monetary threshold. Sufficiency is judged against the specific project and its ' +
          'effect on job creation, so an amount on its own does not answer the question and software cannot ' +
          'supply the judgement.',
        es:
          'El art. 84.c) no fija umbral monetario alguno. La suficiencia se valora frente al proyecto concreto y a ' +
          'su incidencia en la creación de empleo, de modo que una cifra por sí sola no responde a la pregunta y ' +
          'un programa no puede aportar esa valoración.',
      },
      guidance: {
        en:
          'The same criterion carries art. 84.a): the applicant must meet everything Spanish law requires of a ' +
          'national to open and run the projected activity — licences, registrations and sectoral authorisations ' +
          'included. Meridian holds no facts about those and does not test them.',
        es:
          'Este mismo criterio arrastra el art. 84.a): hay que cumplir cuanto la legislación española exige a los ' +
          'nacionales para la apertura y el funcionamiento de la actividad proyectada, incluidas licencias, ' +
          'inscripciones y autorizaciones sectoriales. Meridian no dispone de datos sobre ello y no lo comprueba.',
      },
    },
    {
      id: 'es-propia-public-order',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-84-e'],
      label: {
        en: 'No criminal record in Spain, and no public-order objection',
        es: 'Carecer de antecedentes penales en España y no representar una amenaza para el orden público',
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
          'The office obtains the Spanish criminal-record certificate and the police report itself, within seven ' +
          'days. Art. 85.2 states that a record in the police report is not by itself an automatic ground of ' +
          'refusal; the assessment is made case by case.',
        es:
          'La oficina recaba de oficio el certificado de antecedentes penales español y el informe policial, en el ' +
          'plazo de siete días. El art. 85.2 establece que la existencia de antecedentes en el informe policial no ' +
          'supone por sí misma y de forma automática causa de denegación: la valoración es casuística.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 48,
    countsTowardNaturalisation: true,
    citationIds: ['es-rloex-art-83', 'es-rloex-art-87'],
    note: {
      en:
        'The initial authorisation is a fixed one year, limited to one autonomous community and one sector of ' +
        'activity. It takes effect only on registration with the corresponding Social Security scheme within three ' +
        'months of legal entry; if that has not happened by the end of the three months the holder must leave. The ' +
        'renewed authorisation runs four years and covers employed and self-employed work anywhere in Spain and in ' +
        'any sector, unless long-term residence is due instead.',
      es:
        'La autorización inicial es de un año fijo, limitada a una comunidad autónoma y a un sector de actividad. ' +
        'Solo surte efecto con el alta en el régimen correspondiente de la Seguridad Social dentro de los tres ' +
        'meses siguientes a la entrada legal; si transcurrido ese plazo no consta el alta, la persona queda ' +
        'obligada a salir del territorio. La autorización renovada dura cuatro años y habilita para trabajar por ' +
        'cuenta ajena y propia en todo el territorio y en cualquier sector, salvo que corresponda una autorización ' +
        'de residencia de larga duración.',
    },
  },
  leadsTo: [
    'es-long-term-residence-eu',
    'es-long-term-residence-national',
    'es-nationality-residence-reduced',
    'es-nationality-residence-general',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Estancia de larga duración por estudios
// ---------------------------------------------------------------------------

/**
 * Recorded as a `residence_permit` because the schema has no kind for a *stay*,
 * and that is the closest available. It is not residence, and the difference is
 * load-bearing: art. 176.a) of the Reglamento counts time on this authorisation
 * at half its length toward long-term residence, and only where the applicant
 * has since moved into a residence situation. The summary and the durations
 * note say so; do not let the `kind` field imply otherwise.
 */
export const esStudentStay: Pathway = {
  id: 'es-student-stay',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Long-duration stay for studies, pupil mobility, voluntary service or training',
    es: 'Estancia de larga duración por estudios, movilidad de alumnos, servicios de voluntariado o actividades formativas',
  },
  summary: {
    en:
      'Authorisation to remain in Spain for more than ninety days to study, take part in a pupil-mobility ' +
      'programme, perform voluntary service or follow one of a closed list of formative activities. It is a stay, ' +
      'not residence. The core requirement — admission by a recognised institution and payment of the enrolment ' +
      'fees — depends on documents Meridian does not hold and is not tested by any criterion below.',
    es:
      'Autorización para permanecer en España más de noventa días con el fin de estudiar, participar en un ' +
      'programa de movilidad de alumnos, prestar un servicio de voluntariado o cursar una de las actividades ' +
      'formativas de una lista cerrada. Es una estancia, no una residencia. El requisito nuclear —la admisión por ' +
      'una institución reconocida y el abono de los derechos de matrícula— depende de documentos que Meridian no ' +
      'posee y no se comprueba en ninguno de los criterios siguientes.',
  },
  citations: [rloexArt35, rloexArt52, rloexArt53, rloexArt53_2, rloexArt55, rloexArt57, rloexArt176, ley14Da17],
  criteria: [
    {
      id: 'es-study-minimum-age',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-rloex-art-35', 'es-rloex-art-52', 'es-rloex-art-53'],
      label: {
        en: 'At least seventeen years old for higher studies',
        es: 'Mayor de diecisiete años para estudios superiores',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 17 },
      guidance: {
        en:
          'Art. 35.f) sets seventeen for higher studies under art. 52.1.a) and eighteen for post-compulsory ' +
          'secondary studies and formative activities; for a pupil-mobility programme the age is whatever the ' +
          'education rules for that programme allow, and for voluntary service it is whatever the sectoral rules ' +
          'require. This criterion applies the seventeen-year floor only. Separately, and not tested here: ' +
          'arts. 52.1 and 53.1 require admission by a recognised or authorised institution for a programme of the ' +
          'listed kind, and payment of the enrolment, registration or equivalent fees. Meridian holds no admission ' +
          'record, so evidence of both must be checked by hand.',
        es:
          'El art. 35.f) fija diecisiete años para los estudios superiores del art. 52.1.a) y dieciocho para los ' +
          'estudios de educación secundaria postobligatoria y las actividades formativas; en los programas de ' +
          'movilidad de alumnos rige la edad que permita la normativa educativa del programa y, en el ' +
          'voluntariado, la que exija la normativa sectorial. Este criterio aplica únicamente el umbral de ' +
          'diecisiete años. Aparte, y no comprobado aquí: los arts. 52.1 y 53.1 exigen la admisión por una ' +
          'institución reconocida o autorizada para un programa de los tipos enumerados y el abono de los derechos ' +
          'de inscripción, matrícula o documento equivalente. Meridian no dispone del expediente de admisión, de ' +
          'modo que ambos extremos deben verificarse manualmente.',
      },
    },
    {
      id: 'es-study-economic-means',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-rloex-art-35'],
      label: {
        en: 'Means of at least 100 % of IPREM per month for the stay',
        es: 'Medios económicos de al menos el 100 % del IPREM mensual durante la estancia',
      },
      evaluator: { op: 'gte', path: 'derived.passiveIncomeIpremMultiple', value: 1 },
      guidance: {
        en:
          'Art. 35.h) sets the figure as a monthly percentage of IPREM, scaled across the stay, plus 75 % for the ' +
          'first dependent family member and 50 % for each further one, and it excludes from the calculation any ' +
          'sums used to pay for the studies themselves. It expressly admits grants, subsidies and scholarships, a ' +
          'valid employment contract or firm job offer where the authorisation permits work, and a declaration by ' +
          'the host institution that it assumes the costs. Meridian measures only recorded income not derived from ' +
          'work against the supplied annual IPREM, so a student funded by a scholarship or by a host institution ' +
          'will show as unmet here even though the Reglamento accepts that funding. The requirement is also met ' +
          'outright where accommodation has been paid for in advance for the whole stay.',
        es:
          'El art. 35.h) fija la cuantía como porcentaje mensual del IPREM, proyectado sobre la estancia, más un ' +
          '75 % por el primer familiar a cargo y un 50 % por cada uno de los restantes, y excluye del cómputo las ' +
          'cantidades destinadas a costear los propios estudios. Admite expresamente subvenciones, ayudas y becas, ' +
          'un contrato de trabajo válido o una oferta de empleo en firme cuando la autorización habilite a ' +
          'trabajar, y la declaración de toma a cargo por el centro de acogida. Meridian mide únicamente los ' +
          'ingresos no derivados del trabajo que consten, frente al IPREM anual aportado, de modo que quien se ' +
          'financie con una beca o mediante una declaración de toma a cargo aparecerá como no cumplidor aunque el ' +
          'Reglamento acepte esa financiación. El requisito se entiende cumplido también si se acredita tener ' +
          'abonado de antemano el alojamiento por toda la estancia.',
      },
    },
    {
      id: 'es-study-health-insurance',
      kind: 'health',
      weight: 'blocking',
      citationIds: ['es-rloex-art-35'],
      label: {
        en: 'Health insurance with an insurer authorised to operate in Spain, valid for the whole stay',
        es: 'Seguro de enfermedad con una entidad aseguradora autorizada para operar en España, válido para toda la estancia',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_true', path: 'healthInsurance.hasPrivateCoverage' },
          { op: 'equals', path: 'healthInsurance.insurerAuthorizedIn', value: 'ES' },
          { op: 'is_true', path: 'healthInsurance.coversFullPeriod' },
        ],
      },
      guidance: {
        en:
          'Art. 35.i) is explicit that the insurer must be authorised to operate in Spain and that the benefits ' +
          'must be comparable to the basic common portfolio of care services of the Sistema Nacional de Salud. ' +
          'Where the holder goes on to work under art. 57, the insurance requirement is met instead by ' +
          'registration with the corresponding Social Security scheme.',
        es:
          'El art. 35.i) exige de forma expresa que la aseguradora esté autorizada para operar en España y que las ' +
          'prestaciones sean similares a las de la cartera común básica de servicios asistenciales del Sistema ' +
          'Nacional de Salud. Si la persona titular pasa a trabajar al amparo del art. 57, el requisito de seguro ' +
          'se entiende cumplido mediante el alta en el régimen correspondiente de la Seguridad Social.',
      },
    },
    {
      id: 'es-study-criminal-record',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-35'],
      label: {
        en: 'No criminal record where the stay exceeds six months',
        es: 'Carecer de antecedentes penales cuando la estancia supere los seis meses',
      },
      evaluator: {
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
      guidance: {
        en:
          'Art. 35.j) applies only to applicants over the age of criminal responsibility whose stay exceeds six ' +
          'months, and it keys on the countries where the applicant has resided over the previous five years, for ' +
          'offences that exist in Spanish law. This criterion checks the country of nationality alone, which is ' +
          'narrower than the rule in one direction and wider in another: a certificate from the country of ' +
          'nationality proves nothing about a country the applicant lived in and left.',
        es:
          'El art. 35.j) solo se aplica a quienes sean mayores de edad penal y cuya estancia supere los seis meses, ' +
          'y se refiere a los países en los que la persona haya residido durante los cinco años anteriores, por ' +
          'delitos previstos en el ordenamiento español. Este criterio comprueba únicamente el país de ' +
          'nacionalidad, lo que es más estrecho que la regla en un sentido y más amplio en otro: un certificado del ' +
          'país de nacionalidad nada acredita sobre un país en el que se residió y del que se salió.',
      },
    },
    {
      id: 'es-study-public-order',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-53-2'],
      label: {
        en: 'No public-order, public-security or public-health objection',
        es: 'No suponer una amenaza para el orden público, la seguridad pública o la salud pública',
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
          'The immigration office obtains the criminal-record report and the police report of its own motion, ' +
          'within five days, so an applicant will not normally hold either. Art. 54.4 says plainly that a record ' +
          'in the police report is not by itself and automatically a ground of refusal: the competent body assesses ' +
          'case by case and in the round.',
        es:
          'La oficina de extranjería recaba de oficio el informe del registro central de penados y el informe ' +
          'policial en el plazo de cinco días, de modo que la persona solicitante no dispondrá normalmente de ' +
          'ninguno. El art. 54.4 dice con claridad que la existencia de antecedentes en el informe policial no ' +
          'supone por sí misma y de forma automática causa de denegación: el órgano competente valora de forma ' +
          'casuística y circunstanciada.',
      },
    },
  ],
  durations: {
    citationIds: ['es-rloex-art-55', 'es-rloex-art-57', 'es-rloex-art-176', 'es-ley-14-2013-da-17'],
    note: {
      en:
        'No single grant length is stated here because there is not one. Art. 55.1 gives the stay the length of ' +
        'the studies or programme with a one-year ceiling, except higher studies under art. 52.1.a), where it ' +
        'matches the official duration of the studies and may run for several years. Validity starts one month ' +
        'before the activity begins and ends fifteen days after it does. Extensions: up to two for higher and ' +
        'post-compulsory secondary studies, one for voluntary service and formative activities. Under art. 57 a ' +
        'higher-studies stay authorises employed and self-employed work automatically, with no further ' +
        'application, provided the work is compatible with the studies and stays within thirty hours a week; the ' +
        'other categories need a separate work authorisation, and exceeding the cap extinguishes the stay. ' +
        'Whether this time counts toward naturalisation by residence is deliberately left unstated: what is ' +
        'verified is art. 176.a), under which time on this authorisation counts at 50 % of its length toward ' +
        'long-term residence, and only where the holder is in a residence situation when that application is made. ' +
        'A separate twenty-four-month residence to look for work or start a business is available afterwards under ' +
        'disposición adicional decimoséptima of Ley 14/2013.',
      es:
        'Aquí no se indica una duración única porque no la hay. El art. 55.1 da a la estancia la duración de los ' +
        'estudios o del programa con el límite de un año, salvo en los estudios superiores del art. 52.1.a), en ' +
        'los que coincide con la duración oficial de los estudios y puede abarcar varios años. La vigencia ' +
        'comienza un mes antes del inicio de la actividad y se extiende quince días más allá de su finalización. ' +
        'Prórrogas: hasta dos en estudios superiores y secundarios postobligatorios, una en voluntariado y ' +
        'actividades formativas. Conforme al art. 57, la estancia por estudios superiores habilita ' +
        'automáticamente para trabajar por cuenta propia y ajena, sin trámite adicional, siempre que la actividad ' +
        'sea compatible con los estudios y no supere las treinta horas semanales; las demás categorías requieren ' +
        'una autorización de trabajo separada, y superar el límite extingue la estancia. Si este tiempo computa ' +
        'para la nacionalidad por residencia se deja deliberadamente sin afirmar: lo verificado es el art. 176.a), ' +
        'según el cual el tiempo de esta autorización computa al 50 % de su duración a efectos de residencia de ' +
        'larga duración, y solo si en el momento de esa solicitud se está en situación de residencia. Después es ' +
        'posible una residencia de veinticuatro meses para buscar empleo o emprender, prevista en la disposición ' +
        'adicional decimoséptima de la Ley 14/2013.',
    },
  },
  leadsTo: ['es-student-work-modification'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Modificación de estancia por estudios a residencia y trabajo
// ---------------------------------------------------------------------------

export const esStudentWorkModification: Pathway = {
  id: 'es-student-work-modification',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Modification from a study stay to residence and work',
    es: 'Modificación de la estancia por estudios a residencia y trabajo',
  },
  summary: {
    en:
      'A graduate of a Spanish programme moves from a study stay into residence and work without leaving Spain and ' +
      'without a visa. The employed variant is expressly exempt from the national employment situation, which is ' +
      'the practical point of the route. It is closed to anyone whose studies were funded by a Spanish or ' +
      'home-country development-cooperation or humanitarian-action programme.',
    es:
      'Quien ha titulado en un programa cursado en España pasa de la estancia por estudios a la residencia y el ' +
      'trabajo sin salir de España y sin visado. La modalidad por cuenta ajena está expresamente exenta de la ' +
      'situación nacional de empleo, que es la utilidad práctica de la vía. Queda excluida quien haya sido becada ' +
      'o subvencionada dentro de programas españoles o del país de origen de cooperación para el desarrollo ' +
      'sostenible o de acción humanitaria.',
  },
  citations: [rloexArt190, rloexArt74, rloexArt74_1h, rloexArt84, ley14Da17],
  criteria: [
    {
      id: 'es-swm-current-study-stay',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-rloex-art-190'],
      label: {
        en: 'Currently in Spain on a study or formative stay',
        es: 'Encontrarse en España en situación de estancia por estudios o actividades formativas',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'student' },
      guidance: {
        en:
          'The route is open from stays granted under arts. 52.1.a), 52.1.b) and 52.1.e).4.º and 5.º, and to those ' +
          'doing specialised health training under art. 58. It is not open from the pupil-mobility or ' +
          'voluntary-service categories. Timing matters and is not tested here: art. 190.6 allows the application ' +
          'in the two months before, or the three months after, either the extinction of the study authorisation ' +
          'or the obtaining of the qualification, and filing inside that window extends the previous authorisation ' +
          'until the decision. Also untested: the exclusion of applicants who held a grant or subsidy from a ' +
          'public or private body under a Spanish or home-country development-cooperation or humanitarian-action ' +
          'programme. Both need checking by hand.',
        es:
          'La vía se abre desde las estancias concedidas al amparo de los arts. 52.1.a), 52.1.b) y 52.1.e).4.º y ' +
          '5.º, y para quienes cursen formación sanitaria especializada conforme al art. 58. No se abre desde la ' +
          'movilidad de alumnos ni desde el voluntariado. Los plazos importan y no se comprueban aquí: el ' +
          'art. 190.6 permite solicitarla en los dos meses previos o en los tres posteriores a la extinción de la ' +
          'autorización de estancia o a la obtención de la titulación, y presentarla dentro de ese plazo prorroga ' +
          'la autorización anterior hasta la resolución. Tampoco se comprueba la exclusión de quienes hayan sido ' +
          'becadas o subvencionadas por organismos públicos o privados dentro de programas españoles o del país de ' +
          'origen de cooperación para el desarrollo sostenible o de acción humanitaria. Ambos extremos requieren ' +
          'comprobación manual.',
      },
    },
    {
      id: 'es-swm-qualification-obtained',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['es-rloex-art-190'],
      label: {
        en: 'The qualification or certificate for the completed studies has been obtained',
        es: 'Haber obtenido la titulación o el certificado correspondiente a los estudios realizados',
      },
      evaluator: {
        op: 'collection_any',
        path: 'professionalCredentials',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'issuingCountry', value: 'ES' },
            { op: 'one_of', path: 'kind', values: ['degree', 'diploma', 'certification'] },
          ],
        },
      },
      guidance: {
        en:
          'Art. 190.1 requires the qualification or certificate actually to have been obtained, not merely the ' +
          'studies to have been completed. This criterion looks for a Spanish-issued degree, diploma or ' +
          'certification on file.',
        es:
          'El art. 190.1 exige haber obtenido efectivamente la titulación o el certificado, no solo haber ' +
          'terminado los estudios. Este criterio busca que conste un título, diploma o certificado expedido en ' +
          'España.',
      },
    },
    {
      id: 'es-swm-work-basis',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-rloex-art-190', 'es-rloex-art-74', 'es-rloex-art-84'],
      label: {
        en: 'An employment contract in Spain, or a self-employed project meeting art. 84',
        es: 'Contrato de trabajo en España o proyecto por cuenta propia conforme al art. 84',
      },
      evaluator: {
        op: 'any_of',
        of: [
          {
            op: 'all_of',
            of: [
              { op: 'equals', path: 'jobOffer.employerCountry', value: 'ES' },
              { op: 'is_true', path: 'jobOffer.writtenOffer' },
              { op: 'is_false', path: 'jobOffer.selfEmployment' },
            ],
          },
          { op: 'equals', path: 'employmentType', value: 'self_employed' },
        ],
      },
      guidance: {
        en:
          'Art. 190.2 imports the whole of art. 74 except art. 74.1.a), so the national employment situation is ' +
          'not considered — the single largest difference between this route and an ordinary first work ' +
          'authorisation. Art. 190.3 imports art. 84 in full for the self-employed variant, including the ' +
          'sufficiency of the planned investment. The employer may lodge the application, and where they do, they ' +
          'pay the fee. There is a third variant this criterion does not model: residence with an exception from ' +
          'the work authorisation, under art. 190.4.',
        es:
          'El art. 190.2 incorpora todo el art. 74 salvo el art. 74.1.a), de modo que no se atiende a la situación ' +
          'nacional de empleo, que es la mayor diferencia entre esta vía y una primera autorización de trabajo ' +
          'ordinaria. El art. 190.3 incorpora íntegramente el art. 84 para la modalidad por cuenta propia, ' +
          'incluida la suficiencia de la inversión prevista. La solicitud puede presentarla el empleador y, en ese ' +
          'caso, asume el pago de la tasa. Existe una tercera modalidad que este criterio no modela: la residencia ' +
          'con excepción de la autorización de trabajo, del art. 190.4.',
      },
    },
    {
      id: 'es-swm-remuneration-smi',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-rloex-art-74'],
      label: {
        en: 'Where the route taken is employment, remuneration at least the full-time annual SMI',
        es: 'En la modalidad por cuenta ajena, retribución no inferior al SMI anual a jornada completa',
      },
      evaluator: { op: 'gte', path: 'derived.jobOfferSalarySmiMultiple', value: 1 },
      guidance: {
        en:
          'This is weighted as material because it has nothing to measure on the self-employed variant, where no ' +
          'salary exists. On the employed variant art. 74.1.c) applies in full: the terms must match the ' +
          'applicable collective agreement, which may require more than the SMI, and a part-time contract must ' +
          'still reach the full-time SMI in annual terms.',
        es:
          'Se pondera como material porque en la modalidad por cuenta propia no hay salario que medir. En la ' +
          'modalidad por cuenta ajena el art. 74.1.c) se aplica íntegramente: las condiciones deben ajustarse al ' +
          'convenio colectivo aplicable, que puede exigir más que el SMI, y un contrato a tiempo parcial debe ' +
          'alcanzar igualmente el SMI a jornada completa en cómputo anual.',
      },
    },
    {
      id: 'es-swm-public-order',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-74-1-h'],
      label: {
        en: 'No criminal record in Spain, and no public-order objection',
        es: 'Carecer de antecedentes penales en España y no representar una amenaza para el orden público',
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
          'Imported through art. 190.2 with the rest of art. 74. The administration obtains the certificate and ' +
          'the police report itself, and the second limb — whether the applicant represents a threat — is assessed ' +
          'rather than measured.',
        es:
          'Incorporado por el art. 190.2 junto con el resto del art. 74. La Administración recaba de oficio el ' +
          'certificado y el informe policial, y el segundo aspecto —si la persona representa una amenaza— se ' +
          'valora, no se mide.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    countsTowardNaturalisation: true,
    citationIds: ['es-rloex-art-190', 'es-ley-14-2013-da-17'],
    note: {
      en:
        'Art. 190.9 gives the authorisation one year, with the effects that each type of authorisation has when ' +
        'renewed. Once the application is admitted the study stay becomes a provisional residence and work ' +
        'authorisation, at full time, until the procedure is resolved; a refusal ends that provisional status ' +
        'automatically. The authorisation takes effect on registration with the corresponding Social Security ' +
        'scheme. Art. 190.10 points graduates at European Qualifications Framework level 6 or above at the ' +
        'alternative twenty-four-month residence for job-seeking or entrepreneurship in disposición adicional ' +
        'decimoséptima of Ley 14/2013, which is a different route with a different application window.',
      es:
        'El art. 190.9 concede la autorización por un año, con los efectos que corresponden a cada tipo de ' +
        'autorización cuando se renueva. Admitida a trámite la solicitud, la estancia por estudios adquiere el ' +
        'carácter de autorización provisional de residencia y trabajo, a jornada completa, hasta que se resuelva ' +
        'el procedimiento; la denegación hace perder esa vigencia provisional de forma automática. La autorización ' +
        'surte efecto con el alta en el régimen correspondiente de la Seguridad Social. El art. 190.10 remite a ' +
        'quienes hayan alcanzado al menos el Nivel 6 del Marco Europeo de Cualificaciones a la residencia ' +
        'alternativa de veinticuatro meses para la búsqueda de empleo o para emprender, de la disposición ' +
        'adicional decimoséptima de la Ley 14/2013, que es otra vía con otro plazo de solicitud.',
    },
  },
  leadsTo: [
    'es-long-term-residence-eu',
    'es-long-term-residence-national',
    'es-nationality-residence-reduced',
    'es-nationality-residence-general',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residencia para emprendedores (Ley 14/2013)
// ---------------------------------------------------------------------------

export const esEntrepreneurResidence: Pathway = {
  id: 'es-entrepreneur-residence',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Residence for entrepreneurs (Ley 14/2013)',
    es: 'Residencia para emprendedores (Ley 14/2013)',
  },
  summary: {
    en:
      'Residence to start, develop or direct an economic activity in Spain that is innovative or of special ' +
      'economic interest to the country, certified by a favourable ENISA report. The authorisation is valid ' +
      'nationwide and runs three years, renewable for two, with permanent residence available at five. This is ' +
      'not the investor golden visa: Ley Orgánica 1/2025 left arts. 63 to 67 of Ley 14/2013 without content from ' +
      '3 April 2025 and did not touch arts. 69 and 70, which this route rests on.',
    es:
      'Residencia para iniciar, desarrollar o dirigir en España una actividad económica innovadora o de especial ' +
      'interés económico para el país, acreditada mediante informe favorable de ENISA. La autorización tiene ' +
      'validez en todo el territorio nacional y una vigencia de tres años, renovable por dos, con acceso a la ' +
      'residencia permanente a los cinco. No es la golden visa de inversores: la Ley Orgánica 1/2025 dejó sin ' +
      'contenido los arts. 63 a 67 de la Ley 14/2013 desde el 3 de abril de 2025 y no tocó los arts. 69 y 70, en ' +
      'los que se apoya esta vía.',
  },
  citations: [ley14Art62, ley14Art69, ley14Art70, lo1_2025Df21_1],
  criteria: [
    {
      id: 'es-ent-minimum-age',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-art-62'],
      label: {
        en: 'At least eighteen years old',
        es: 'Ser mayor de dieciocho años',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
    },
    {
      id: 'es-ent-not-irregular',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-art-62'],
      label: {
        en: 'Not present in Spain without authorisation',
        es: 'No encontrarse irregularmente en territorio español',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
      guidance: {
        en:
          'Art. 62.3.a) is a condition of the whole international-mobility section, and unlike most of it the ' +
          'route is otherwise open both to people applying from abroad and to people already holding a Spanish ' +
          'stay or residence authorisation.',
        es:
          'El art. 62.3.a) es condición de toda la sección de movilidad internacional y, a diferencia de la mayor ' +
          'parte de ella, la vía está abierta tanto a quienes solicitan desde el extranjero como a quienes ya son ' +
          'titulares de una autorización de estancia o residencia en España.',
      },
    },
    {
      id: 'es-ent-entrepreneurial-activity',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-ley-14-2013-art-70', 'es-ley-14-2013-art-69'],
      label: {
        en: 'An entrepreneurial activity that is innovative or of special economic interest for Spain',
        es: 'Actividad emprendedora innovadora o de especial interés económico para España',
      },
      evaluator: { op: 'equals', path: 'qualifyingInvestment.kind', value: 'business_project' },
      humanReviewWhen: { op: 'equals', path: 'qualifyingInvestment.kind', value: 'business_project' },
      humanReviewReason: {
        en:
          'Whether an activity is innovative or of special economic interest is decided by ENISA in a mandatory ' +
          'report, weighing the applicant’s professional profile and involvement, the business plan and its ' +
          'financing, and the added value generated. There is no threshold to apply and no figure to compare.',
        es:
          'Que una actividad sea innovadora o de especial interés económico lo decide ENISA en un informe ' +
          'preceptivo, valorando el perfil profesional de la persona solicitante y su implicación, el plan de ' +
          'negocio y su financiación, y el valor añadido generado. No hay umbral que aplicar ni cifra que comparar.',
      },
      guidance: {
        en:
          'This criterion records only that a business project is on file. It asserts nothing about innovation or ' +
          'economic interest, which is ENISA’s assessment on a mandatory report the Unidad de Grandes Empresas y ' +
          'Colectivos Estratégicos requests of its own motion within ten working days. Art. 69.2 separately ' +
          'requires the legal conditions for starting the activity, which are whatever the sectoral rules say.',
        es:
          'Este criterio solo deja constancia de que consta un proyecto empresarial. No afirma nada sobre su ' +
          'carácter innovador ni sobre su interés económico, que corresponde valorar a ENISA en un informe ' +
          'preceptivo que la Unidad de Grandes Empresas y Colectivos Estratégicos solicita de oficio en diez días ' +
          'hábiles. El art. 69.2 exige además los requisitos legales necesarios para el inicio de la actividad, ' +
          'que son los que establezca la normativa sectorial correspondiente.',
      },
    },
    {
      id: 'es-ent-health-insurance',
      kind: 'health',
      weight: 'material',
      citationIds: ['es-ley-14-2013-art-62'],
      label: {
        en: 'Health insurance with an insurer authorised to operate in Spain',
        es: 'Seguro de enfermedad con una entidad aseguradora autorizada para operar en España',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_true', path: 'healthInsurance.hasPrivateCoverage' },
          { op: 'equals', path: 'healthInsurance.insurerAuthorizedIn', value: 'ES' },
        ],
      },
      guidance: {
        en:
          'Art. 62.3.e) admits public health insurance as an alternative to private cover, and the ' +
          '"authorised to operate in Spain" condition attaches to the private option. Meridian models private ' +
          'cover only, so someone relying on public cover will show as unmet here. Unlike the non-lucrative route ' +
          'under the Reglamento, the authorisation condition is statutory text on this route rather than a ' +
          'requirement carried over from a repealed regulation.',
        es:
          'El art. 62.3.e) admite el seguro público como alternativa al seguro privado, y la condición de estar ' +
          '«autorizada para operar en España» se refiere a la opción privada. Meridian solo modela la cobertura ' +
          'privada, de modo que quien se ampare en un seguro público aparecerá aquí como no cumplidor. A ' +
          'diferencia de la vía no lucrativa del Reglamento, en esta vía la exigencia de autorización figura en el ' +
          'texto legal y no procede de un reglamento derogado.',
      },
    },
    {
      id: 'es-ent-economic-resources',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-ley-14-2013-art-62'],
      label: {
        en: 'Sufficient economic resources for the applicant and their family',
        es: 'Recursos económicos suficientes para la persona solicitante y su familia',
      },
      evaluator: { op: 'is_present', path: 'passiveIncome.minorUnits' },
      guidance: {
        en:
          'Art. 62.3.f) requires sufficient resources for the whole period of residence and states no figure. ' +
          'Meridian records that an amount has been supplied; it does not assert what the deciding unit currently ' +
          'requires, and that amount should be confirmed before filing.',
        es:
          'El art. 62.3.f) exige recursos suficientes durante todo el periodo de residencia y no fija cifra ' +
          'alguna. Meridian deja constancia de que se ha aportado un importe; no afirma cuál exige la unidad ' +
          'competente en este momento, y esa cuantía debe confirmarse antes de presentar la solicitud.',
      },
    },
    {
      id: 'es-ent-criminal-record',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-ley-14-2013-art-62'],
      label: {
        en: 'No criminal record in the countries of residence over the last two years',
        es: 'Carecer de antecedentes penales en los países de residencia de los dos últimos años',
      },
      evaluator: {
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
      guidance: {
        en:
          'Art. 62.3.c) keys on Spain and on the countries where the applicant has resided over the last two ' +
          'years, for offences that exist in Spanish law, and adds a responsible declaration that there is no ' +
          'record over the last five. This criterion checks the country of nationality alone, which is not the ' +
          'same set, so it is weighted material and never produces a finding of ineligibility on its own.',
        es:
          'El art. 62.3.c) se refiere a España y a los países donde la persona haya residido durante los dos ' +
          'últimos años, por delitos previstos en el ordenamiento español, y añade una declaración responsable de ' +
          'inexistencia de antecedentes en los últimos cinco. Este criterio comprueba únicamente el país de ' +
          'nacionalidad, que no es el mismo conjunto, por lo que se pondera como material y nunca produce por sí ' +
          'solo un resultado de inelegibilidad.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    renewalMonths: 24,
    countsTowardNaturalisation: true,
    citationIds: ['es-ley-14-2013-art-69', 'es-lo-1-2025-df-21-1'],
    note: {
      en:
        'Art. 69.1 states the three-year initial validity, the two-year renewal and access to permanent residence ' +
        'at five years in the same sentence, which is why this record states all three. Applications go to the ' +
        'Unidad de Grandes Empresas y Colectivos Estratégicos electronically; an applicant outside Spain files the ' +
        'authorisation and visa through a single instance. None of this was affected by Ley Orgánica 1/2025, which ' +
        'repealed the investor route in arts. 63 to 67 only.',
      es:
        'El art. 69.1 enuncia en la misma frase la vigencia inicial de tres años, la renovación por dos y el ' +
        'acceso a la residencia permanente a los cinco años, y por eso este registro afirma los tres datos. Las ' +
        'solicitudes se dirigen electrónicamente a la Unidad de Grandes Empresas y Colectivos Estratégicos; quien ' +
        'se encuentre fuera de España tramita autorización y visado a través de una única instancia. Nada de esto ' +
        'se vio afectado por la Ley Orgánica 1/2025, que derogó únicamente la vía de inversores de los arts. 63 a ' +
        '67.',
    },
  },
  leadsTo: [
    'es-long-term-residence-eu',
    'es-long-term-residence-national',
    'es-nationality-residence-reduced',
    'es-nationality-residence-general',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residencia de larga duración-UE
// ---------------------------------------------------------------------------

export const esLongTermResidenceEu: Pathway = {
  id: 'es-long-term-residence-eu',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Long-term residence-EU',
    es: 'Residencia de larga duración-UE',
  },
  summary: {
    en:
      'Authorisation to reside and work in Spain indefinitely on the same conditions as Spanish nationals, ' +
      'carrying the status of Directive 2003/109/EC and the mobility rights that come with it. It is the ' +
      'destination of most of the temporary routes in this catalog: five years of legal, continuous residence.',
    es:
      'Autorización para residir y trabajar en España indefinidamente en las mismas condiciones que los ' +
      'españoles, con el estatuto de la Directiva 2003/109/CE y los derechos de movilidad que lleva aparejados. ' +
      'Es el destino de la mayoría de las vías temporales de este catálogo: cinco años de residencia legal y ' +
      'continuada.',
  },
  citations: [rloexArt175, rloexArt176, rloexArt177, rloexArt178],
  criteria: [
    {
      id: 'es-ltr-eu-five-years',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['es-rloex-art-176'],
      label: {
        en: 'Five years of legal, continuous residence in Spain before the application',
        es: 'Cinco años de residencia legal y continuada en España antes de la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 5 },
      guidance: {
        en:
          'Continuity survives absences of up to six consecutive months, provided they total no more than ten ' +
          'months across the five years, or eighteen months where the absences are for work reasons, and provided ' +
          'the departures were not irregular. Those limits are expressed in months and this engine counts days; ' +
          'converting one to the other depends on the calendar dates of each trip, so no numeric absence test is ' +
          'applied here and the absences must be checked against the dates by hand. Time on a stay for studies, ' +
          'pupil mobility, voluntary service or formative activities counts at half its length, and only where the ' +
          'applicant is in a residence situation in Spain at the moment of applying. Art. 176.a) also opens the ' +
          'status to EU Blue Card holders from another member state on a separate set of conditions, which is not ' +
          'modelled here.',
        es:
          'La continuidad no queda afectada por ausencias de hasta seis meses continuados, siempre que su suma no ' +
          'supere los diez meses en los cinco años, o los dieciocho meses cuando las ausencias sean por motivos ' +
          'laborales, y siempre que las salidas no se hayan efectuado de manera irregular. Esos límites se ' +
          'expresan en meses y este motor cuenta días; la conversión depende de las fechas concretas de cada ' +
          'viaje, por lo que aquí no se aplica ninguna prueba numérica de ausencias y estas deben contrastarse ' +
          'manualmente con las fechas. El tiempo en estancia por estudios, movilidad de alumnos, voluntariado o ' +
          'actividades formativas computa al 50 % de su duración, y solo si en el momento de solicitar se está en ' +
          'situación de residencia en España. El art. 176.a) abre además el estatuto a titulares de una Tarjeta ' +
          'azul-UE de otro Estado miembro en condiciones distintas, que no se modelan aquí.',
      },
    },
    {
      id: 'es-ltr-eu-residence-situation',
      kind: 'status',
      weight: 'material',
      citationIds: ['es-rloex-art-176'],
      label: {
        en: 'Currently holding a residence authorisation in Spain',
        es: 'Ser titular de una autorización de residencia en España',
      },
      evaluator: {
        op: 'one_of',
        path: 'currentStatus',
        values: ['resident', 'worker', 'permanent_resident'],
      },
      guidance: {
        en:
          'A stay for studies is a stay, not residence, and art. 176.a) makes being in a residence situation at ' +
          'the moment of applying the condition on which study time counts toward the five years at all. Someone ' +
          'still on a study stay should modify into residence and work first.',
        es:
          'La estancia por estudios es una estancia, no una residencia, y el art. 176.a) condiciona el cómputo de ' +
          'ese tiempo a encontrarse en situación de residencia en el momento de solicitar. Quien siga en estancia ' +
          'por estudios debería modificar antes su situación a residencia y trabajo.',
      },
    },
    {
      id: 'es-ltr-eu-resources',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-rloex-art-176'],
      label: {
        en: 'Fixed and regular resources sufficient for the applicant and any family',
        es: 'Recursos fijos y regulares suficientes para la persona solicitante y, en su caso, su familia',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'is_present', path: 'passiveIncome.minorUnits' },
          { op: 'is_present', path: 'jobOffer.annualSalaryMinorUnits' },
        ],
      },
      guidance: {
        en:
          'Art. 176.b) does not state an amount: it adopts the terms and amounts the Reglamento sets for family ' +
          'reunification, which this record does not restate. It does say the resources may come from own means or ' +
          'from employment or professional activity, so income from work counts.',
        es:
          'El art. 176.b) no fija una cuantía: remite a los términos y cuantías previstos en materia de ' +
          'reagrupación familiar en el propio Reglamento, que este registro no reproduce. Sí precisa que los ' +
          'recursos pueden provenir de medios propios o de la realización de actividades laborales o ' +
          'profesionales, de modo que los ingresos del trabajo computan.',
      },
    },
    {
      id: 'es-ltr-eu-health-insurance',
      kind: 'health',
      weight: 'material',
      citationIds: ['es-rloex-art-176'],
      label: {
        en: 'Health insurance',
        es: 'Seguro de enfermedad',
      },
      evaluator: { op: 'is_true', path: 'healthInsurance.hasPrivateCoverage' },
      guidance: {
        en:
          'Art. 176.c) says only "Contar con un seguro de enfermedad" — five words, with no requirement that the ' +
          'cover be private and none that the insurer be authorised in Spain. Cover through the Spanish Social ' +
          'Security system is not modelled in Meridian, so someone covered that way will show as unmet here even ' +
          'though the article is satisfied. Do not read the unmet result as a finding against them.',
        es:
          'El art. 176.c) dice únicamente «Contar con un seguro de enfermedad»: no exige que la cobertura sea ' +
          'privada ni que la aseguradora esté autorizada en España. La cobertura por el sistema de Seguridad ' +
          'Social español no está modelada en Meridian, de modo que quien la tenga aparecerá aquí como no ' +
          'cumplidor aunque satisfaga el artículo. No debe leerse ese resultado como un juicio en su contra.',
      },
    },
    {
      id: 'es-ltr-eu-criminal-record',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-177'],
      label: {
        en: 'Criminal-record certificate from the country of origin or of prior residence',
        es: 'Certificado de antecedentes penales del país de origen o de residencia anterior',
      },
      evaluator: {
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
      guidance: {
        en:
          'Art. 177.3.f) asks for the certificate where applicable, from the country of origin or from the ' +
          'countries of residence over the last five years; the office obtains the Spanish certificate and the ' +
          'police report itself. Under art. 177.5 the status may still be refused if the competent body, having ' +
          'assessed the matter, considers the applicant a threat on public-order or public-security grounds — a ' +
          'judgement a clear certificate does not settle.',
        es:
          'El art. 177.3.f) pide el certificado, en su caso, del país de origen o de los países de residencia en ' +
          'los últimos cinco años; la oficina recaba de oficio el certificado español y el informe policial. ' +
          'Conforme al art. 177.5, el estatuto puede denegarse igualmente si el órgano competente, tras valorarlo, ' +
          'considera que la persona representa una amenaza para el orden público o la seguridad pública: una ' +
          'valoración que un certificado limpio no resuelve.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['es-rloex-art-175', 'es-rloex-art-178'],
    note: {
      en:
        'No grant length is stated because the authorisation is indefinite. What expires is the identity card: ' +
        'the first renewal falls at five years, then every five years until the holder turns thirty and every ten ' +
        'years thereafter. Failing to renew the card does not in any case extinguish the status, though it can ' +
        'attract a penalty procedure. The status carries the right to reside and work on the same conditions as ' +
        'Spanish nationals, and holding it does not by itself satisfy the separate residence requirement for ' +
        'naturalisation, which turns on effective residence.',
      es:
        'No se indica duración porque la autorización es indefinida. Lo que caduca es la tarjeta de identidad: la ' +
        'primera renovación se solicita a los cinco años, después cada cinco años hasta cumplir los treinta y cada ' +
        'diez a partir de esa edad. No renovarla no extingue en ningún caso el estatuto, aunque puede dar lugar al ' +
        'régimen sancionador. El estatuto habilita a residir y trabajar en las mismas condiciones que los ' +
        'españoles, y ostentarlo no satisface por sí solo el requisito de residencia para la nacionalidad, que ' +
        'depende de la residencia efectiva.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residencia de larga duración nacional
// ---------------------------------------------------------------------------

export const esLongTermResidenceNational: Pathway = {
  id: 'es-long-term-residence-national',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'National long-term residence',
    es: 'Residencia de larga duración nacional',
  },
  summary: {
    en:
      'Authorisation to reside and work in Spain indefinitely on the same conditions as Spanish nationals. It ' +
      'rests on the same five years of legal, continuous residence as the EU variant but, unlike it, states no ' +
      'means and no health-insurance requirement — and it does not carry the intra-EU mobility of Directive ' +
      '2003/109/EC.',
    es:
      'Autorización para residir y trabajar en España indefinidamente en las mismas condiciones que los ' +
      'españoles. Se apoya en los mismos cinco años de residencia legal y continuada que la modalidad UE pero, a ' +
      'diferencia de ella, no enuncia requisito de medios económicos ni de seguro de enfermedad, y tampoco lleva ' +
      'aparejada la movilidad intracomunitaria de la Directiva 2003/109/CE.',
  },
  citations: [
    rloexArt182,
    rloexArt183,
    rloexArt183_2FuerzaMayor,
    rloexArt183_3,
    rloexArt184,
    rloexArt184_5,
    rloexArt185,
  ],
  criteria: [
    {
      id: 'es-ltr-nat-five-years',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['es-rloex-art-183', 'es-rloex-art-183-2-fuerza-mayor', 'es-rloex-art-183-3'],
      label: {
        en: 'Five years of legal, continuous residence in Spain before the application',
        es: 'Cinco años de residencia legal y continuada en España antes de la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 5 },
      guidance: {
        en:
          'The absence limits are the same as the EU variant: up to six consecutive months, totalling no more than ' +
          'ten months across the five years, or eighteen months where the absences are for work reasons, and only ' +
          'where the departures were not irregular. Those limits are expressed in months and this engine counts ' +
          'days, so no numeric absence test is applied here; check the absences against the dates. Art. 183.2 also ' +
          'excuses duly justified absences for force majeure, on an individual assessment by the deciding body, ' +
          'and protects holders working abroad for recognised non-governmental organisations on research, ' +
          'development-cooperation or humanitarian projects. Art. 183.3 provides seven further routes that need no ' +
          'five-year period at all — among them Spanish contributory retirement or permanent-incapacity ' +
          'pensioners, people born in Spain with three years of residence at majority, and former Spanish ' +
          'nationals by origin. None of the seven is modelled here. One of them covers stateless persons, refugees ' +
          'and beneficiaries of subsidiary protection: protection status is outside this catalog by explicit ' +
          'decision, and anyone in that position should take it to a qualified immigration lawyer rather than to ' +
          'an eligibility checker.',
        es:
          'Los límites de ausencia son los mismos que en la modalidad UE: hasta seis meses continuados, sin que la ' +
          'suma supere los diez meses en los cinco años, o los dieciocho cuando las ausencias sean por motivos ' +
          'laborales, y siempre que las salidas no se hayan efectuado de manera irregular. Esos límites se ' +
          'expresan en meses y este motor cuenta días, por lo que aquí no se aplica ninguna prueba numérica de ' +
          'ausencias: contrástelas con las fechas. El art. 183.2 excusa además las ausencias por fuerza mayor ' +
          'debidamente justificadas, mediante valoración individualizada del órgano que resuelve, y protege a ' +
          'quienes trabajen en el extranjero para organizaciones no gubernamentales reconocidas en proyectos de ' +
          'investigación, cooperación al desarrollo o acción humanitaria. El art. 183.3 prevé otras siete vías que ' +
          'no exigen periodo alguno de cinco años, entre ellas las de pensionistas españoles de jubilación ' +
          'contributiva o de incapacidad permanente, las personas nacidas en España con tres años de residencia al ' +
          'alcanzar la mayoría de edad y quienes fueron españoles de origen. Ninguna de las siete se modela aquí. ' +
          'Una de ellas comprende a apátridas, refugiados y beneficiarios de protección subsidiaria: la protección ' +
          'internacional queda fuera de este catálogo por decisión expresa, y quien se encuentre en esa situación ' +
          'debe acudir a un profesional de la abogacía de extranjería y no a un comprobador de elegibilidad.',
      },
    },
    {
      id: 'es-ltr-nat-residence-situation',
      kind: 'status',
      weight: 'material',
      citationIds: ['es-rloex-art-183', 'es-rloex-art-184'],
      label: {
        en: 'Currently holding a residence authorisation in Spain',
        es: 'Ser titular de una autorización de residencia en España',
      },
      evaluator: {
        op: 'one_of',
        path: 'currentStatus',
        values: ['resident', 'worker', 'permanent_resident'],
      },
      guidance: {
        en:
          'Art. 184.2 has the application filed in the two months before the current residence authorisation ' +
          'expires, or in the three months after; filing in either window extends the previous authorisation until ' +
          'the decision. That timing is not tested here. Several of the art. 183.3 routes need no prior residence ' +
          'at all, and for those this criterion is beside the point.',
        es:
          'El art. 184.2 sitúa la solicitud en los dos meses inmediatamente anteriores a la expiración de la ' +
          'autorización de residencia vigente, o en los tres posteriores; presentarla en cualquiera de esos plazos ' +
          'prorroga la autorización anterior hasta la resolución. Ese plazo no se comprueba aquí. Varias de las ' +
          'vías del art. 183.3 no exigen residencia previa, y para ellas este criterio es irrelevante.',
      },
    },
    {
      id: 'es-ltr-nat-criminal-record',
      kind: 'character',
      weight: 'material',
      citationIds: ['es-rloex-art-184', 'es-rloex-art-184-5'],
      label: {
        en: 'Criminal-record certificate from the country of origin or of prior residence',
        es: 'Certificado de antecedentes penales del país de origen o de residencia anterior',
      },
      evaluator: {
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
      guidance: {
        en:
          'Art. 184.3.e) asks, where applicable, for a certificate from the country of origin or the countries of ' +
          'residence over the last five years; the office obtains the Spanish certificate and the police report ' +
          'itself. Under art. 184.5 the status may be refused if the competent body, having assessed the matter, ' +
          'considers the applicant a threat on public-order or public-security grounds. Separately and not tested ' +
          'here, art. 184.3.c) requires a report from the regional authorities evidencing that dependent children ' +
          'of compulsory school age are enrolled in school, and a failure to produce it within a month is a ground ' +
          'for refusing the authorisation.',
        es:
          'El art. 184.3.e) pide, en su caso, un certificado del país de origen o de los países de residencia en ' +
          'los últimos cinco años; la oficina recaba de oficio el certificado español y el informe policial. ' +
          'Conforme al art. 184.5, el estatuto puede denegarse si el órgano competente, tras valorarlo, considera ' +
          'que la persona representa una amenaza para el orden público o la seguridad pública. Aparte, y no ' +
          'comprobado aquí, el art. 184.3.c) exige informe de las autoridades autonómicas que acredite la ' +
          'escolarización de los menores a cargo en edad de escolarización obligatoria, y no aportarlo en el plazo ' +
          'de un mes es causa de que la autorización no se conceda.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['es-rloex-art-182', 'es-rloex-art-185'],
    note: {
      en:
        'No grant length is stated because the authorisation is indefinite. The identity card is renewed first at ' +
        'five years, then every five years until the holder turns thirty and every ten years thereafter; failing ' +
        'to renew it does not extinguish the status, though the office will check that the conditions that gave ' +
        'access to it still hold. This variant does not carry the Directive 2003/109/EC status, so it does not ' +
        'carry the right to move to another member state that the EU variant does.',
      es:
        'No se indica duración porque la autorización es indefinida. La tarjeta de identidad se renueva a los ' +
        'cinco años y después cada cinco hasta cumplir los treinta y cada diez a partir de esa edad; no renovarla ' +
        'no extingue el estatuto, si bien la oficina comprobará que se mantienen las condiciones que dieron acceso ' +
        'a él. Esta modalidad no lleva el estatuto de la Directiva 2003/109/CE y, por tanto, no confiere el ' +
        'derecho de movilidad a otro Estado miembro que sí otorga la modalidad UE.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

export const ES_WORK_STUDY_PATHWAYS: readonly Pathway[] = [
  esWorkPermitEmployed,
  esWorkPermitSelfEmployed,
  esStudentStay,
  esStudentWorkModification,
  esEntrepreneurResidence,
  esLongTermResidenceEu,
  esLongTermResidenceNational,
];
