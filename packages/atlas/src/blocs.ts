/**
 * The mobility-agreement registry — what makes a corridor different from its
 * destination alone.
 *
 * The destination system says which routes exist. The agreements here say which
 * of those routes a given origin national may actually use, and sometimes create
 * a route that would not otherwise exist. {@link Corridor} is derived by
 * intersecting the two ends' bloc membership, so an error in `confers` becomes an
 * error in every corridor that touches the bloc.
 *
 * ## Reading `confers`
 *
 * `visa_free_entry` and `residence_and_work` are not points on one scale. Schengen
 * lets a Portuguese national cross into Austria without a check; the EU treaties
 * let them live and work there. CUSMA lets a Mexican engineer enter the United
 * States to practise for a fixed period and says, in terms, that it does not touch
 * residence or citizenship. Conflating any of these would tell someone they have a
 * life where they have a holiday, or the reverse.
 *
 * ## Reading dates
 *
 * `since` records when the bloc's **effect** began for that member, not when a
 * treaty was signed — the same convention `@meridian/core`'s Schengen table uses,
 * and for the same reason: a stay in Croatia in 2022 did not consume Schengen
 * days. Where accession happened in stages, `partialSince` marks the interim, and
 * a date inside that window is ambiguous rather than resolved.
 *
 * Membership is not timeless. Withdrawals carry `until`. The United Kingdom is in
 * the EU and EEA records with an `until`, not absent from them, because a person
 * asking about residence accrued in 2015 is asking about a period when it was a
 * member.
 *
 * ## What this file does not claim
 *
 * Every entry carries a `citationUrl` that was actually retrieved on `verifiedOn`.
 * Where a date is conventional rather than taken from the cited source — the
 * Common Travel Area and the Trans-Tasman arrangement have no single founding
 * instrument, and the ECOWAS and Nordic protocol dates were not carried by any
 * source reachable here — the `note` says so in terms. A flagged convention is
 * usable; an unflagged guess is not.
 *
 * Instruments deliberately **not** modelled, so their absence is visible rather
 * than silent:
 *
 * - The 1950 India-Nepal Treaty of Peace and Friendship, which underlies one of
 *   the world's largest corridors. No official text could be retrieved.
 * - CA-4 (Guatemala, El Salvador, Honduras, Nicaragua). No official source
 *   retrieved.
 * - The SADC Protocol on the Facilitation of Movement of Persons and the African
 *   Union Free Movement Protocol. Ratification status not established.
 * - The Union State of Russia and Belarus, and the EFTA Convention's free movement
 *   between Switzerland and Iceland, Norway and Liechtenstein.
 * - Bilateral youth-mobility and working-holiday schemes. There are hundreds; none
 *   is encoded, so `youth_mobility` appears nowhere below.
 *
 * @see ./types.ts for why the atlas is destination-first rather than a list of
 * ordered country pairs.
 */

import type { IsoDate } from '@meridian/core';
import {
  SCHENGEN_MEMBERSHIP,
  SPAIN_REDUCED_RESIDENCY_NATIONALITIES,
  isoDate,
} from '@meridian/core';

import { jurisdictionCode } from './types.js';
import type { BlocMembershipRecord, JurisdictionCode, MobilityBloc } from './types.js';

/** Every entry below was checked against its `citationUrl` on this date. */
const VERIFIED_ON = '2026-07-25';

interface MembershipOptions {
  readonly partialSince?: string;
  readonly until?: string;
}

function member(code: string, since: string, options?: MembershipOptions): BlocMembershipRecord {
  const record: {
    jurisdiction: JurisdictionCode;
    since: IsoDate;
    partialSince?: IsoDate;
    until?: IsoDate;
  } = { jurisdiction: jurisdictionCode(code), since: isoDate(since) };
  if (options?.partialSince !== undefined) record.partialSince = isoDate(options.partialSince);
  if (options?.until !== undefined) record.until = isoDate(options.until);
  return record;
}

/** Several jurisdictions joining on one date — the common case. */
function cohort(codes: readonly string[], since: string): readonly BlocMembershipRecord[] {
  return codes.map((code) => member(code, since));
}

// ---------------------------------------------------------------------------
// Shared cohorts. The EU, the EEA and the EU-Switzerland agreement each extend
// to every accession wave, so the waves are named once and reused. Naming them
// also makes the differences between the three sets legible: Switzerland is in
// none of the waves, and Iceland, Norway and Liechtenstein are in the EEA only.
// ---------------------------------------------------------------------------

const EU_FOUNDERS = ['BE', 'DE', 'FR', 'IT', 'LU', 'NL'] as const;
const EU_1986 = ['ES', 'PT'] as const;
const EU_1995 = ['AT', 'FI', 'SE'] as const;
const EU_2004 = ['CY', 'CZ', 'EE', 'HU', 'LT', 'LV', 'MT', 'PL', 'SI', 'SK'] as const;
const EU_2007 = ['BG', 'RO'] as const;

/**
 * Last day free movement applied to the United Kingdom.
 *
 * The UK ceased to be a member state on 2020-01-31 and the Withdrawal Agreement
 * entered into force on 2020-02-01, but free movement continued through the
 * transition period, which ended on 2020-12-31. This registry records effects, so
 * the later date is the one that appears in `until`. Anyone who needs the
 * membership date rather than the effect date must not read it off these records.
 */
const UK_FREE_MOVEMENT_END = '2020-12-31';

export const MOBILITY_BLOCS: readonly MobilityBloc[] = [
  // -------------------------------------------------------------------------
  // Europe: three sets that are routinely conflated, plus what sits beside them
  // -------------------------------------------------------------------------
  {
    id: 'eu',
    name: 'European Union',
    kind: 'free_movement',
    members: [
      ...cohort(EU_FOUNDERS, '1958-01-01'),
      member('DK', '1973-01-01'),
      member('IE', '1973-01-01'),
      member('GB', '1973-01-01', { until: UK_FREE_MOVEMENT_END }),
      member('GR', '1981-01-01'),
      ...cohort(EU_1986, '1986-01-01'),
      ...cohort(EU_1995, '1995-01-01'),
      ...cohort(EU_2004, '2004-05-01'),
      ...cohort(EU_2007, '2007-01-01'),
      member('HR', '2013-07-01'),
    ],
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl: 'https://european-union.europa.eu/principles-countries-history/eu-enlargement_en',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Union citizenship carries the right to move, reside and work in another member state. ' +
      'The 1958-01-01 date for the six founders is the entry into force of the Treaty of Rome, ' +
      'signed 1957-03-25. EU membership is NOT the same set as Schengen or the EEA: Ireland and ' +
      'Cyprus are EU members outside the Schengen area, and Iceland, Norway, Liechtenstein and ' +
      'Switzerland are inside free-movement arrangements without being EU members. Greenland ' +
      'left the Communities in 1985 while remaining part of Denmark; territorial exclusions of ' +
      'that kind belong in the jurisdiction records, not here, and are not modelled in this list.',
  },
  {
    id: 'eea',
    name: 'European Economic Area',
    kind: 'free_movement',
    members: [
      ...cohort(
        // The EC states of 1994 (the UK is listed separately, it has an `until`)
        // plus the EFTA states Austria, Finland, Iceland, Norway and Sweden.
        ['AT', 'BE', 'DE', 'DK', 'ES', 'FI', 'FR', 'GR', 'IE', 'IS', 'IT', 'LU',
         'NL', 'NO', 'PT', 'SE'],
        '1994-01-01',
      ),
      member('GB', '1994-01-01', { until: UK_FREE_MOVEMENT_END }),
      member('LI', '1995-05-01'),
      ...cohort(EU_2004, '2004-05-01'),
      ...cohort(EU_2007, '2007-01-01'),
      member('HR', '2013-07-01'),
    ],
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A21994A0103%2801%29',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Signed at Porto 1992-05-02, in force 1994-01-01; Liechtenstein followed on 1995-05-01. ' +
      'Part III chapter 1 of the Agreement secures freedom of movement for workers and ' +
      'self-employed persons between EC member states and EFTA states. Switzerland signed but ' +
      'did not ratify after the referendum of 1992-12-06 and is NOT an EEA party — see the ' +
      'separate eu-ch-afmp entry. Austria, Finland and Sweden appear at 1994-01-01 because they ' +
      'were EEA parties as EFTA states a year before joining the EU. For the 2004, 2007 and 2013 ' +
      'EU enlargements the corresponding EEA Enlargement Agreements were concluded separately ' +
      'and several were applied provisionally from a date later than EU accession; those dates ' +
      'were not verified here, so a question falling in the months just after an accession must ' +
      'be escalated rather than answered from these records.',
  },
  {
    id: 'schengen',
    name: 'Schengen Area',
    kind: 'common_travel_area',
    // Derived from @meridian/core rather than restated, so the two tables cannot
    // drift. Core is the single source of truth for these dates, including the
    // two-stage Bulgaria and Romania accession.
    members: SCHENGEN_MEMBERSHIP.map((m) =>
      member(m.country, m.since, { partialSince: m.partialSince, until: m.until }),
    ),
    confers: ['visa_free_entry'],
    citationUrl: 'https://home-affairs.ec.europa.eu/policies/schengen_en',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Schengen abolishes checks at internal borders. It does NOT confer a right to reside or ' +
      'work — that comes from the EU treaties, the EEA Agreement or the EU-Switzerland ' +
      'agreement, which are different sets. Cyprus and Ireland are EU members outside Schengen; ' +
      'Iceland, Liechtenstein, Norway and Switzerland are inside it without being EU members. ' +
      'The member dates are taken verbatim from SCHENGEN_MEMBERSHIP in @meridian/core, which ' +
      'preserves the staged Bulgaria and Romania accession: internal air and sea border controls ' +
      'lifted 2024-03-31 (partialSince), full accession 2025-01-01 (since). A stay between those ' +
      'two dates is genuinely ambiguous for 90/180 purposes and core refuses to resolve it; any ' +
      'consumer of this registry must refuse likewise. That table is recorded as unreviewed in ' +
      'docs/LEGAL_CATALOG_REVIEW.md and this entry inherits that status.',
  },
  {
    id: 'eu-ch-afmp',
    name: 'EU-Switzerland Agreement on the Free Movement of Persons',
    kind: 'free_movement',
    members: [
      member('CH', '2002-06-01'),
      ...cohort(EU_FOUNDERS, '2002-06-01'),
      member('DK', '2002-06-01'),
      member('IE', '2002-06-01'),
      member('GB', '2002-06-01', { until: UK_FREE_MOVEMENT_END }),
      member('GR', '2002-06-01'),
      ...cohort(EU_1986, '2002-06-01'),
      ...cohort(EU_1995, '2002-06-01'),
      ...cohort(EU_2004, '2004-05-01'),
      ...cohort(EU_2007, '2007-01-01'),
      member('HR', '2013-07-01'),
    ],
    confers: ['residence_and_work'],
    citationUrl: 'https://www.sem.admin.ch/sem/en/home/themen/fza_schweiz-eu-efta.html',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Signed 1999-06-21, in force 2002-06-01. This is why Switzerland has free movement with ' +
      'the EU while being in neither the EU nor the EEA, and omitting it would misstate every ' +
      'EU-Switzerland corridor. The State Secretariat for Migration states that each EU ' +
      'enlargement extends the agreement by additional protocol. Those protocols entered into ' +
      'force later than the corresponding EU accession and carried transitional restrictions; ' +
      'their dates were NOT verified here, so the 2004, 2007 and 2013 states carry their EU ' +
      'accession date as an approximation. It is correct for the position today and wrong for ' +
      'the transitional years, which is the safer direction of error but is still an error — ' +
      'escalate any question about that interval. Free movement between Switzerland and Iceland, ' +
      'Norway and Liechtenstein rests on the EFTA Convention, a separate instrument not modelled ' +
      'in this registry.',
  },
  {
    id: 'nordic',
    name: 'Nordic Common Labour Market and Passport Union',
    kind: 'free_movement',
    members: cohort(['DK', 'FI', 'IS', 'NO', 'SE'], '1954-07-02'),
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl:
      'https://www.udi.no/en/want-to-apply/residence-under-the-eueeu-regulations/nordic-nationals-who-are-going-to-live-in-norway/',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Predates and is broader than the EEA: the Norwegian Directorate of Immigration states ' +
      'that a Danish, Finnish, Icelandic or Swedish citizen needs only to report a move to the ' +
      'National Registry in order to live in Norway, and is not issued a registration ' +
      'certificate at all. The same source treats Faroese and Greenlandic (Danish) and Aland ' +
      '(Finnish) citizenship as Nordic for this purpose; whether the labour-market agreement ' +
      'applies to those territories as places of destination is a separate question this ' +
      'registry does not resolve. The 1954-07-02 date is the conventional commencement of the ' +
      'Common Nordic Labour Market agreement and is NOT carried by the cited source — treat it ' +
      'as a convention, not a verified fact.',
  },
  {
    id: 'cta',
    name: 'Common Travel Area',
    kind: 'common_travel_area',
    members: cohort(['GB', 'IE', 'IM', 'JE', 'GG'], '1923-01-01'),
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl:
      'https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Comprises the United Kingdom, Ireland and the Crown Dependencies (Isle of Man, Bailiwick ' +
      'of Jersey, Bailiwick of Guernsey). Home Office guidance states that British and Irish ' +
      'citizens may move freely and reside in either jurisdiction without a visa, residence ' +
      'permit or employment permit, may work including self-employment, and may access ' +
      'education, healthcare, social housing and the vote. It survived the UK leaving the EU and ' +
      'was reaffirmed by a UK-Ireland Memorandum of Understanding in May 2019. The rights run ' +
      'between British and Irish CITIZENS; the Crown Dependencies are listed because they are ' +
      'part of the area, not because they confer a separate nationality carrying these rights. ' +
      'The 1923-01-01 date is a convention: the arrangement has no single founding instrument ' +
      'and the cited guidance says only that it predates EU membership. Do not rely on it for ' +
      'any question turning on the early period.',
  },

  // -------------------------------------------------------------------------
  // Americas
  // -------------------------------------------------------------------------
  {
    id: 'cusma',
    name: 'Canada-United States-Mexico Agreement',
    kind: 'trade_agreement_mobility',
    members: cohort(['CA', 'MX', 'US'], '2020-07-01'),
    confers: ['facilitated_professional_entry'],
    citationUrl:
      'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/text-texte/16.aspx',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Chapter 16 covers four categories of business person: business visitors, traders and ' +
      'investors, intra-company transferees, and professionals. It confers temporary entry and ' +
      'nothing more. Article 16.2(2) states that the chapter does not apply to measures ' +
      'regarding citizenship, nationality, residence or employment on a permanent basis, and the ' +
      'chapter defines temporary entry as entry without the intent to establish permanent ' +
      'residence. Encoding this as residence would be the single most damaging error available ' +
      'in this file. The Professionals category is already in the Meridian catalog. In force ' +
      '2020-07-01 per the United States Trade Representative, replacing NAFTA.',
  },
  {
    id: 'mercosur-residence',
    name: 'MERCOSUR Residence Agreement',
    kind: 'residence_agreement',
    members: [
      ...cohort(['AR', 'BO', 'BR', 'CL', 'PY', 'UY'], '2009-07-28'),
      // The three later accessions. Each has its own date and each was verified
      // separately; see the note for why Ecuador's is nearly three years after
      // the Council decision that approved it.
      member('PE', '2011-06-28'),
      member('CO', '2012-06-29'),
      member('EC', '2014-03-03'),
    ],
    confers: ['residence_and_work'],
    citationUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/decreto/d6975.htm',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Acuerdo sobre Residencia para Nacionales de los Estados Partes del MERCOSUR, Bolivia y ' +
      'Chile, signed at Brasilia on 2002-12-05/06 by Argentina, Brazil, Paraguay and Uruguay as ' +
      'states parties and Bolivia and Chile as associated states. Materially more than the trade ' +
      'bloc and often missed: nationality alone suffices, with no need to show what activity the ' +
      'applicant will pursue. It grants temporary residence of up to two years, convertible to ' +
      'permanent; the right to enter, leave, circulate and remain freely; and the right to ' +
      'pursue any activity, employed or self-employed, on the same conditions as nationals, with ' +
      'equal treatment under labour law. Article 14 conditions entry into force on notification ' +
      'by all six signatories, so a single date applies to all six; 2009-07-28 is taken from ' +
      "Brazil's promulgation decree, which records that day as the date the Acordo entered into " +
      'force for Brazil on the external plane. ' +
      'THE THREE LATER ACCESSIONS ARE THREE SEPARATE FACTS AND WERE VERIFIED SEPARATELY. The ' +
      'Residence Agreement is a different instrument from Mercosur trade membership or ' +
      'association, so an accession date must not be read off either. PERU: the Common Market ' +
      'Council approved its accession by MERCOSUL/CMC/DEC. 04/11 at the XLI CMC, Asuncion, ' +
      '28/VI/11 (http://www.sice.oas.org/trade/mrcsrs/decisions/DEC_004-2011_p.pdf), and Peru ' +
      'had already ratified by Decreto Supremo 047-2011-RE of 2011-04-07, so 2011-06-28 is used; ' +
      'the text of the Acta de Adhesion itself was not retrieved, so that date rests on the ' +
      'Council decision rather than on the instrument of accession. COLOMBIA: MERCOSUL/CMC/DEC. ' +
      '20/12 at the XLIII CMC, Mendoza, 29/VI/12 ' +
      '(http://www.sice.oas.org/trade/mrcsrs/decisions/DEC_020_2012_p.pdf), and Migracion ' +
      'Colombia Resolucion 1017 de 2013 recites that the Acta de Adhesion of 2012-06-29 says the ' +
      'Acuerdo enters into force for Colombia on the date of the Acta ' +
      '(https://normograma.info/migracion/docs/resolucion_uaemc_1017_2013.htm). ECUADOR: its ' +
      'accession was approved by MERCOSUL/CMC/DEC. 21/11 on the SAME DAY as Peru\'s, and the ' +
      'effect nonetheless began 32 months later, which is exactly why the Council date is not ' +
      'used as a proxy — Ecuador signed the Acta at Asuncion on 2011-06-29, the National ' +
      'Assembly approved it on 2013-12-03, Decreto Ejecutivo 194 of 2014-01-02 ratified it, and ' +
      'the instrument of ratification was DEPOSITED at Asuncion on 2014-03-03, which is the date ' +
      'recorded here (Acuerdo Ministerial 000031, Registro Oficial 229 of 2014-04-21, at ' +
      'https://www.gob.ec/sites/default/files/regulations/2025-02/ACUERDO%20SOBRE%20RESIDENCIA' +
      '%20PARA%20LOS%20NACIONALES%20DE%20LOS%20ESTADOS%20PARTES%20DEL%20MERCOSUR,%20BOLIVIA%20' +
      'Y%20CHILE.pdf, the same document regions/americas.ts cites for Ecuador). ' +
      'Bolivia and Chile are in ' +
      'the 2009 cohort as original associated-state signatories, not as later accessions. The ' +
      'nine-state set is corroborated by the Biblioteca del Congreso Nacional de Chile, ' +
      'September 2025 (https://obtienearchivo.bcn.cl/obtienearchivo?id=repositorio%2F10221%2F' +
      '37701%2F2%2FAc.sobre_residencia_MERCOSUR.pdf), which also records that the treaty is in ' +
      'force from 2009-07-28 for the first six and for the rest from their own accession. ' +
      'Several parties also extend equivalent treatment unilaterally under domestic ' +
      "law to a wider list (Argentina's includes Guyana, Suriname and Venezuela), so a corridor " +
      "answer must check the destination's own implementation and not this treaty alone.",
  },
  {
    id: 'andean',
    name: 'Andean Community — Andean Migration Statute (Decision 878)',
    kind: 'residence_agreement',
    members: cohort(['BO', 'CO', 'EC', 'PE'], '2021-08-11'),
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl:
      'https://www.comunidadandina.org/notas-de-prensa/hoy-entra-en-vigencia-el-estatuto-migratorio-andino/',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Decision 878 took effect 2021-08-11 and is supranational and binding on member countries. ' +
      'Andean citizens may enter any other member country as tourists on a national identity ' +
      'document without a visa, for 90 days extendable by 90 and capped at 180 days in a year. ' +
      'Temporary Andean Residence runs up to two years and converts to Permanent Andean ' +
      'Residence, which authorises indefinite stay; holders of either may enter, leave, ' +
      'circulate and remain freely and may pursue any activity, employed or self-employed, on ' +
      'the same conditions as nationals. Earlier Andean labour-migration instruments are not ' +
      'encoded here and their practical effect was not verified. Membership of the Community ' +
      'itself has changed over time; this record states only the four countries named in the ' +
      'cited source as covered by Decision 878.',
  },
  {
    id: 'caricom',
    name: 'CARICOM Single Market — free movement of skills',
    kind: 'trade_agreement_mobility',
    members: cohort(
      ['AG', 'BB', 'BS', 'BZ', 'DM', 'GD', 'GY', 'HT', 'JM', 'KN', 'LC', 'MS', 'SR', 'TT', 'VC'],
      '2006-01-01',
    ),
    confers: ['visa_free_entry', 'facilitated_professional_entry'],
    citationUrl:
      'https://caricom.org/documents/definition-of-categories-of-skilled-nationals-as-at-august-2024/',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'This is far less than free movement and is regularly overstated. The Secretariat defines ' +
      'twelve categories of wage earner entitled to move and work freely as CARICOM Skilled ' +
      'Nationals; everyone else gets temporary entry of up to six months. Qualifying requires a ' +
      'Certificate of Recognition of CARICOM Skills Qualification from the receiving state, so ' +
      'the right is documentary as well as occupational. Participation is not uniform across the ' +
      'fifteen member states — CARICOM membership and CARICOM Single Market and Economy ' +
      'participation are different things and the per-state position was NOT verified here, so ' +
      'the destination must be checked individually. Haiti obtained a derogation from the ' +
      'Conference decision to widen free movement. The 2006-01-01 date is the conventional ' +
      'commencement of the CSME single market and is not carried by the cited source. Four ' +
      'member states went further from 2025-10-01 — see caricom-full-free-movement.',
  },
  {
    id: 'caricom-full-free-movement',
    name: 'CARICOM full free movement (participating member states)',
    kind: 'free_movement',
    members: cohort(['BB', 'BZ', 'DM', 'VC'], '2025-10-01'),
    confers: ['residence_and_work'],
    citationUrl:
      'https://caricom.org/barbados-belize-dominica-and-st-vincent-and-the-grenadines-ready-for-full-free-movement-on-1-october-2025/',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Barbados, Belize, Dominica and Saint Vincent and the Grenadines implemented full free ' +
      'movement among themselves on 2025-10-01, ahead of the rest of CARICOM. Their nationals ' +
      'may enter, leave and re-enter, move freely, reside, work and remain indefinitely in ' +
      'another participating state without a work or residence permit, receiving a stamp or ' +
      'digital record of indefinite stay on arrival, with access to emergency and primary health ' +
      'care and to public primary and secondary education. This is a genuine free-movement right ' +
      'and is modelled separately from the skills regime precisely so the two are not blurred. ' +
      'The remaining member states continue under the skills regime — see caricom.',
  },
  {
    id: 'oecs',
    name: 'Organisation of Eastern Caribbean States — Economic Union',
    kind: 'free_movement',
    members: cohort(['AG', 'DM', 'GD', 'KN', 'LC', 'MS', 'VC'], '2010-06-18'),
    confers: ['residence_and_work'],
    citationUrl: 'https://oecs.int/en/free-movement-of-persons-in-the-eastern-caribbean',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'The Eastern Caribbean Economic Union was established by the Revised Treaty of Basseterre ' +
      'on 2010-06-18. Its free-movement regime goes materially further than the wider CARICOM ' +
      'skills regime for the same states: citizens of the seven Protocol Member States receive ' +
      'an indefinite-stay stamp on arrival, may work in any Protocol Member State without a work ' +
      'permit — as may a third-country spouse — may travel on a government-issued identity ' +
      'document rather than a passport, and have portable social security. Montserrat is a ' +
      'Protocol Member State although it is a British Overseas Territory, which is why it ' +
      'appears here and why its own immigration autonomy must be recorded separately in the ' +
      'jurisdiction records. The regime was implemented progressively after 2010 and the cited ' +
      'source gives no per-state commencement date, so the single 2010-06-18 date is the treaty ' +
      'date rather than a verified date of effect for each state. Anguilla, the British Virgin ' +
      'Islands, Martinique, Guadeloupe and Saint Martin are OECS associate members and are NOT ' +
      'Protocol Member States; they are excluded deliberately.',
  },
  {
    id: 'cofa',
    name: 'Compacts of Free Association with the United States',
    kind: 'bilateral_treaty',
    members: [
      member('US', '1986-10-21'),
      member('MH', '1986-10-21'),
      member('FM', '1986-11-03'),
      member('PW', '1994-10-01'),
    ],
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl:
      'https://www.uscis.gov/working-in-the-united-states/status-of-citizens-of-the-freely-associated-states-of-the-federated-states-of-micronesia-and-the',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Unusual, and worth stating precisely. Citizens of the Marshall Islands, the Federated ' +
      'States of Micronesia and Palau may travel to and apply for admission to the United States ' +
      'as NONIMMIGRANTS without a visa, and if admitted may live, study and work there — FSM and ' +
      'RMI citizens for an unlimited length of stay, Palauan citizens for an indefinite length ' +
      'of stay. So the effect is residence and work in substance while the status is not ' +
      'residence in law: most grounds of inadmissibility apply, admission is not guaranteed, and ' +
      'someone who cannot show sufficient means of support after admission may be deportable. ' +
      'Anyone who obtained an FSM or RMI passport under an investment or passport-sale programme ' +
      'is excluded. The three compacts have different immigration provisions and USCIS publishes ' +
      'separate fact sheets; the Palau sheet is at ' +
      'https://www.uscis.gov/working-in-the-united-states/status-of-citizens-of-the-republic-of-palau-fact-sheet ' +
      'and it does not extend compact privileges to non-Palauan spouses and children. The ' +
      'Compact of Free Association Amendments Act of 2024 (Public Law 118-42, 2024-03-09) ' +
      'extended financial and programme provisions for twenty years. IMPORTANT ASYMMETRY: the ' +
      'effects recorded here run from the three island states INTO the United States. Corridor ' +
      'derivation intersects membership symmetrically and will therefore overstate what a US ' +
      'national gets in the other direction; the reciprocal treatment is not encoded. The United ' +
      'States is listed from the earliest of the three compacts, so its date understates the ' +
      'Palau relationship by eight years.',
  },
  {
    id: 'ibero-american',
    name: 'Ibero-American nationalities under Spanish Civil Code arts. 22.1 and 24.1',
    kind: 'bilateral_treaty',
    members: [
      ...SPAIN_REDUCED_RESIDENCY_NATIONALITIES.map((code) => member(code, '2003-01-09')),
      member('ES', '2003-01-09'),
    ],
    confers: ['reduced_naturalisation_period', 'dual_nationality_permitted'],
    citationUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Reconciled with @meridian/core: the members are SPAIN_REDUCED_RESIDENCY_NATIONALITIES ' +
      'imported directly, plus Spain itself so that a corridor can intersect, and so cannot ' +
      'drift from the list the catalog already uses. Art. 22.1 of the Civil Code reduces the ' +
      'residence period for naturalisation from ten years to two for "nacionales de origen de ' +
      'paises iberoamericanos, Andorra, Filipinas, Guinea Ecuatorial o Portugal o de sefardies". ' +
      'Art. 23(b) exempts the states listed in art. 24.1 — the same list — from renouncing an ' +
      'existing nationality. FOUR THINGS THIS MEMBERSHIP CANNOT EXPRESS, each of which changes ' +
      "the answer. (1) The effect is asymmetric: it is Spain's unilateral concession in Spanish " +
      'law, so a derived corridor between two non-Spanish members claiming a reduced period is ' +
      'WRONG. (2) Art. 22.1 requires nationality de origen; someone who acquired a listed ' +
      "nationality by residence is on the ten-year regime, and core's " +
      'spainReducedResidencyEligibility applies that test where this list cannot. (3) The ' +
      'article also covers sefardies, which rests on evidence of Sephardic origin rather than on ' +
      'any present nationality and which no membership list can represent. (4) This set is NOT ' +
      'the Ibero-American Conference: the Conference does not include the Philippines or ' +
      'Equatorial Guinea, which art. 22.1 names, and Conference membership confers no mobility ' +
      'right of its own. France is deliberately absent — the France-Spain position rests on the ' +
      'separate nationality convention made at Montauban on 2021-03-15 (BOE-A-2022-4916), whose ' +
      'date of effect was not verified here. The 2003-01-09 date is when the current wording of ' +
      'art. 22 took effect (Ley 36/2002); earlier versions of the list existed from 1982 and ' +
      '1990 and this registry does not resolve which nationality was listed in which earlier ' +
      'period.',
  },

  // -------------------------------------------------------------------------
  // Africa
  // -------------------------------------------------------------------------
  {
    id: 'ecowas',
    name: 'Economic Community of West African States — free movement of persons',
    kind: 'free_movement',
    members: [
      ...cohort(
        ['BJ', 'CI', 'CV', 'GH', 'GM', 'GN', 'GW', 'LR', 'NG', 'SL', 'SN', 'TG'],
        '1979-05-29',
      ),
      member('BF', '1979-05-29', { until: '2025-01-29' }),
      member('ML', '1979-05-29', { until: '2025-01-29' }),
      member('NE', '1979-05-29', { until: '2025-01-29' }),
    ],
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl:
      'https://www.ecowas.int/burkina-faso-mali-and-nigers-withdrawal-from-ecowas-is-now-a-reality/',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Burkina Faso, Mali and Niger ceased to be members on 2025-01-29, taking the Community ' +
      'from fifteen states to twelve; the ECOWAS member-states page still describes it as ' +
      'fifteen while listing twelve, which is why this is modelled with `until` rather than by ' +
      'deletion. The Commission announced that citizens of the three states continue, until ' +
      'further notice, to enjoy the right of movement, residence and establishment without ' +
      'visas under the Community protocols, and that identity documents bearing the ECOWAS logo ' +
      'remain recognised. So the `until` date is when membership ended, not when the practical ' +
      'effect ended — the effect is currently extended by an administrative decision that can be ' +
      'revoked at any time, and a corridor touching those three states must be treated as ' +
      'unsettled rather than resolved either way. The 1979-05-29 date is the adoption of the ' +
      'Protocol relating to Free Movement of Persons, Residence and Establishment (A/P.1/5/79) ' +
      'at Dakar; it was NOT carried by any source reachable here, no per-state ratification ' +
      'dates were verified, and the residence and establishment phases of that protocol have ' +
      'historically been implemented far less completely than the right of entry.',
  },
  {
    id: 'eac',
    name: 'East African Community — Common Market Protocol',
    kind: 'free_movement',
    members: [
      ...cohort(['BI', 'KE', 'RW', 'TZ', 'UG'], '2010-07-01'),
      member('SS', '2016-08-15'),
      member('CD', '2022-07-11'),
      member('SO', '2024-03-04'),
    ],
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl: 'https://www.eac.int/common-market',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Article 7 of the Protocol lets citizens of Partner States enter without visas, move ' +
      'freely, stay and exit; article 10 secures the free movement of workers, including the ' +
      'right to accept offers of employment and equal treatment in pay and conditions, though ' +
      'not public-service employment unless national law allows it. The Protocol is explicit ' +
      'that none of this is an absolute right: host states may limit it on grounds of public ' +
      'policy, security or public health. The EAC states that full implementation was projected ' +
      'for December 2015 and that the deadline was not met, so the effects above are the ' +
      'instrument, not observed practice. The cited source gives the year 2010 for entry into ' +
      'force but not the day; 2010-07-01 is the conventional date and is not verified. The later ' +
      'dates are dates of full Community membership taken from ' +
      'https://www.eac.int/overview-of-eac (South Sudan 2016-08-15, DR Congo 2022-07-11, ' +
      'Somalia 2024-03-04); Common Market implementation for those three lags their accession ' +
      'and was not verified here.',
  },
  {
    id: 'cemac',
    name: 'Economic and Monetary Community of Central Africa — visa-free zone',
    // Not `free_movement` and not `economic_union`, deliberately. CEMAC IS an
    // economic union whose founding convention makes free movement of persons a
    // pillar of the common market, but the only part of that in force is the
    // suppression of the visa. Naming the organisation instead of the instrument
    // is precisely how a 90-day entry right gets read as a right to live there.
    kind: 'visa_waiver',
    members: cohort(['CF', 'CG', 'CM', 'GA', 'GQ', 'TD'], '2017-10-31'),
    confers: ['visa_free_entry'],
    citationUrl: 'https://sgg.cg/txts-droit-reg/CEMAC-Acte-2013-01-libre-circulation.pdf',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Acte additionnel 01/13-CEMAC-070 U-CCE-SE, adopted by the Conference of Heads of State at ' +
      'Libreville on 2013-06-25, "portant suppression du visa pour tous les ressortissants de la ' +
      "CEMAC circulant dans l'espace communautaire\". The copy cited is the one published by the " +
      'Secretariat General du Gouvernement of the Republic of Congo and it was read in full. ' +
      'ARTICLE BY ARTICLE, because the difference between these four sentences is the whole ' +
      'question. Art. 1 makes circulation of member-state nationals free throughout the ' +
      'community space from 2014-01-01 on a national identity card or a passport issued by a ' +
      'member state. Art. 2 defines that freedom as the right to travel without a visa and to ' +
      'stay in any other member state for AT MOST NINETY DAYS. Art. 3 says a national travelling ' +
      'or staying in another member state enjoys, political rights excepted, all the rights and ' +
      'freedoms recognised to that country\'s own nationals, subject to its laws — and art. 3 is ' +
      'the sentence that gets quoted to prove CEMAC is a free-movement area. It is not. It is ' +
      'bounded by the ninety-day cap in art. 2 and by the host state\'s own law, and the earlier ' +
      'Acte additionnel 08/CEMAC-CEE-SE (Malabo, 2005-06-29, at ' +
      'https://sgg.cg/txts-droit-reg/CEMAC-Acte-additionnel-2005-08-libre-circulation-personnes.pdf) ' +
      'settles the point in terms at its art. 4: its provisions do NOT apply to the right of ' +
      'establishment, which is left to a separate regulation. So this bloc confers ' +
      '`visa_free_entry` and nothing else. Recording it as `residence_and_work` would invent a ' +
      'right to live in six countries for six countries worth of people. ' +
      'WHY THE DATE IS 2017-10-31 AND NOT 2014-01-01. Art. 4 of the 2013 act brought it into ' +
      'force on 2013-12-31 and art. 1 names 2014-01-01, but this registry records effects, and ' +
      'the effect did not follow: member states did not open. The national implementing ' +
      'instruments cluster in October 2017, and on 2017-10-31 the Conference of Heads of State, ' +
      "in extraordinary session at N'Djamena, took note of the decision of the member states to " +
      'open their borders fully in application of the 2013 act. That summit date and the ' +
      'visa-suppression decision are carried by the Presidency of the Republic of Cameroon at ' +
      'https://www.prc.cm/fr/actualites/deplacements-et-visites/2480-integration-sous-regionale-paul-biya-ovationne-au-sommet-de-n-djamena ' +
      '(the final communique itself was reachable here only through a press reproduction, so the ' +
      'summit date is verified and the communique wording is not). THE INTERVAL FROM 2014-01-01 ' +
      'TO 2017-10-31 IS UNRESOLVED: the instrument said yes and the borders said no, and a ' +
      'question falling inside it must be escalated rather than answered from this record. ' +
      'PER-STATE DATES, REPORTED AND DELIBERATELY NOT ENCODED. The Cameroon national trade ' +
      'portal, republishing Cameroon Tribune 11461 of 2017-10-27 ' +
      '(https://www.cameroontradehub.cm/article/59/en), reports Cameroon ratifying first subject ' +
      'to reciprocity, a Gabonese order and decision of 2017-10-06 and 2017-10-19, a Congolese ' +
      'circular of 2017-10-23, Chad and the Central African Republic ahead of Gabon, and ' +
      'Equatorial Guinea last. Those are not encoded because the attribution is not certain: ' +
      'regions/africa.ts reads 2017-10-19 as Equatorial Guinea\'s date while that source reads ' +
      'as both October dates belonging to Gabon, and putting a misattributed date in a ' +
      'denominator is worse than carrying one verified date for all six. The single date ' +
      'therefore understates any pair that opened earlier in October 2017, which is the safe ' +
      'direction, and the disagreement is recorded here rather than silently resolved. ' +
      'Article 5 of the 2005 act is worth keeping in view for anyone who revisits this: it made ' +
      'that act immediately applicable to the four member states already practising free ' +
      'circulation and only progressively to the other two, so the six have never moved in step.',
  },

  // -------------------------------------------------------------------------
  // Middle East, Eurasia, Asia-Pacific
  // -------------------------------------------------------------------------
  {
    id: 'gcc',
    name: 'Gulf Cooperation Council — Common Market',
    kind: 'economic_union',
    members: cohort(['AE', 'BH', 'KW', 'OM', 'QA', 'SA'], '2008-01-01'),
    confers: ['residence_and_work'],
    citationUrl: 'https://www.gcc-sg.org/en/MediaCenter/DigitalLibrary/Documents/3331355824160.pdf',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Article 3 of the Economic Agreement (2001) requires that a GCC national residing in any ' +
      "member state receive the same treatment as that state's own nationals, without " +
      'differentiation, in all economic fields; the Secretariat-General lists ten, of which the ' +
      'first two are "movement and residence" and "work in private and government jobs". The ' +
      'Common Market was declared in December 2007 and launched as of January 2008, which is the ' +
      'date used here. The 1981 Unified Economic Agreement already provided for freedom of ' +
      'movement, work and residence, but the Secretariat records that the controls attached to ' +
      'it proved difficult to apply, so the earlier period is not modelled as conferring the ' +
      'effect. TWO CAUTIONS. This benefits GCC NATIONALS only, and in several member states they ' +
      'are a minority of the resident population — the large migrant workforce takes nothing ' +
      'from this entry, and reading a GCC corridor as generally open would be badly wrong. And ' +
      'movement between Qatar and several other members was interrupted in practice from June ' +
      '2017 until January 2021; that was a political rupture rather than a withdrawal, so it is ' +
      'recorded here rather than modelled as an `until`.',
  },
  {
    id: 'eaeu',
    name: 'Eurasian Economic Union',
    kind: 'economic_union',
    members: cohort(['AM', 'BY', 'KG', 'KZ', 'RU'], '2015-01-01'),
    confers: ['residence_and_work'],
    citationUrl: 'https://eaeunion.org/?lang=en',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'The Treaty was signed 2014-05-29 and took effect 2015-01-01, and provides for free ' +
      'movement of goods, services, capital and labour; its labour provisions remove the ' +
      'work-permit requirement for citizens of one member state working in another. This is the ' +
      'strongest mobility instrument in the post-Soviet space and is materially different from ' +
      'CIS membership, which confers nothing of the kind. Armenia and Kyrgyzstan acceded during ' +
      '2015 rather than on 2015-01-01; their exact dates of effect were not verified, so the ' +
      'shared date overstates their membership by weeks or months and must not be relied on for ' +
      'a 2015 question.',
  },
  {
    id: 'cis',
    name: 'Commonwealth of Independent States — 1992 Bishkek visa-free movement agreement',
    kind: 'visa_waiver',
    members: [
      ...cohort(['AM', 'AZ', 'BY', 'KG', 'KZ', 'MD', 'TJ'], '1992-10-09'),
      member('TM', '1992-10-09', { until: '1999-03-12' }),
      member('RU', '1992-10-09', { until: '2000-09-02' }),
      member('UZ', '1992-10-09', { until: '2000-10-06' }),
      member('UA', '1992-10-09', { until: '2001-04-12' }),
      member('GE', '1997-07-28'),
    ],
    confers: ['visa_free_entry'],
    citationUrl: 'https://eccis.org/document/149',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Membership here has changed a great deal and the naive answer — "CIS states, therefore ' +
      'visa free" — is wrong. The Agreement on visa-free movement of citizens of CIS states was ' +
      'signed at Bishkek on 1992-10-09 and lets citizens of the parties enter, leave and travel ' +
      "within the parties' territories on a valid identity document. The CIS Executive " +
      "Committee's record shows Turkmenistan, RUSSIA, Uzbekistan and Ukraine subsequently " +
      "withdrawing; Russia's withdrawal in 2000 means the largest destination in the region is " +
      'not a party to the multilateral instrument at all, and its visa-free arrangements rest on ' +
      'bilateral treaties this registry does not encode. The dates recorded as `until` are the ' +
      "notification dates in that record; the agreement required ninety days' notice, so " +
      'cessation fell roughly three months later and this registry does not resolve the gap. ' +
      'Georgia acceded on 1997-07-28 and withdrew from the CIS itself on 2009-08-18; the record ' +
      'of this agreement shows no denunciation by Georgia and whether its participation survived ' +
      'is not established — treat Georgian pairs as indeterminate. Membership of the CIS as an ' +
      'organisation is a WIDER and different set which confers no mobility right by itself; a ' +
      'jurisdiction record should not carry this bloc id merely because the state is a CIS ' +
      'member.',
  },
  {
    id: 'trans-tasman',
    name: 'Trans-Tasman Travel Arrangement',
    kind: 'bilateral_treaty',
    members: cohort(['AU', 'NZ'], '1973-01-01'),
    confers: ['residence_and_work', 'visa_free_entry'],
    citationUrl:
      'https://www.mfat.govt.nz/en/countries-and-regions/australia-and-pacific/australia/new-zealand-high-commission-to-australia/living-in-australia/moving-to-australia/immigration-status-visa-residency-and-citizenship',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'A New Zealand citizen entering Australia on a New Zealand passport is granted a Special ' +
      'Category visa (subclass 444) on arrival, subject to health and character requirements, ' +
      "and may live, study and work in Australia indefinitely. New Zealand's Ministry of " +
      'Foreign Affairs and Trade is explicit that the visa is temporary in nature and that New ' +
      'Zealanders do not necessarily have the same rights and privileges as Australian citizens ' +
      'or permanent residents, with restrictions on social security and exposure to visa ' +
      'cancellation on character grounds — so `residence_and_work` describes what the person may ' +
      'do, not a settled status, and a corridor answer must not present it as permanent ' +
      'residence. Different citizenship rules apply to holders who arrived after 2001-02-26. ' +
      'The 1973 date is the conventional date of the arrangement and is NOT carried by the cited ' +
      'source.',
  },
  {
    id: 'cplp',
    name: 'CPLP Mobility Agreement',
    kind: 'residence_agreement',
    members: [...cohort(['CV', 'PT', 'ST'], '2022-01-01'), member('BR', '2022-04-01')],
    confers: [],
    citationUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/d11156.htm',
    verifiedOn: isoDate(VERIFIED_ON),
    note:
      'Listed with an EMPTY `confers` on purpose: the instrument exists and a general mobility ' +
      'right does not follow from it. Signed at Luanda 2021-07-17. Article 6 sets out the ' +
      'modalities — CPLP short stay, CPLP temporary stay and a CPLP residence visa — but article ' +
      '4 states that the agreement gives the parties a range of options to be assumed ' +
      'progressively and at differentiated levels of integration, and only the visa exemption ' +
      'for holders of diplomatic, official, special and service passports for stays up to ninety ' +
      'days follows automatically. Everything that would reach an ordinary citizen needs further ' +
      'instruments between two or more parties, or domestic implementation by the destination — ' +
      "Portugal's CPLP residence permit is Portuguese law and belongs in the Portuguese " +
      'jurisdiction record, not here. Article 30 brought the agreement into force on the first ' +
      'day of the month after the third ratification, and for each later ratifier on the first ' +
      "day of the month after its own deposit. Brazil's date, 2022-04-01, is verified from its " +
      'promulgation decree; the 2022-01-01 date and the identity of the first three ratifiers ' +
      'come from CPLP communications this registry could not retrieve, so treat those three ' +
      'memberships as unverified. Angola, Guinea-Bissau, Equatorial Guinea, Mozambique and ' +
      'Timor-Leste are CPLP member states whose ratification status was not established, and are ' +
      'absent for that reason rather than because they are excluded.',
  },
];
