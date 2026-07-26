/**
 * The Americas: North, Central, South, and the Caribbean.
 *
 * The enumeration is taken from the UN M49 standard area codes for the Americas
 * (019) — Northern America (021), Central America (013), Caribbean (029) and
 * South America (005) — rather than from recall, because recall drops small
 * states and every dropped state silently inflates the coverage fraction
 * computed from this list. 57 jurisdictions.
 *
 * Two things about this region matter more than they usually get credit for.
 *
 * **The Caribbean is not one immigration system.** Half the entries below are
 * territories rather than states, and territorial status tells you almost
 * nothing about whether the place runs its own border. Bermuda administers the
 * Bermuda Immigration and Protection Act 1956 and UK immigration law does not
 * apply there at all; Puerto Rico and the US Virgin Islands are inside the
 * statutory definition of "United States" in the Immigration and Nationality
 * Act and so have no separate system whatever. Those two facts sit at opposite
 * ends of `SystemAutonomy` and neither is predictable from the constitutional
 * label. Each territory here was checked, or is left `'unknown'`.
 *
 * **The Mercosur Residence Agreement is a residence right, not a trade
 * footnote.** Nationals of the nine states party to it can obtain a two-year
 * temporary residence on the strength of nationality and a clean record,
 * convertible to permanent, carrying the right to enter, leave, circulate and
 * work — employed or self-employed — on the same terms as nationals of the
 * receiving country. It covers most of South America's population and is
 * routinely omitted from mobility maps that find room for far smaller
 * instruments.
 *
 * ## Bloc ids used, and two that are deliberately absent
 *
 * Used: `cusma` (Canada, Mexico, United States) and `mercosur-residence`
 * (Argentina, Bolivia, Brazil, Chile, Colombia, Ecuador, Paraguay, Peru,
 * Uruguay) and `caricom`.
 *
 * `caricom` is applied only to the twelve full member states that participate
 * in the free movement of skilled nationals. The Bahamas, Haiti and Montserrat
 * are full members of CARICOM but are reported not to take part in that regime,
 * so the id is withheld from them: a bloc id on a jurisdiction is what a derived
 * corridor reads to decide which effects apply, and wrongly conferring free
 * movement is worse than omitting it. The eight CARICOM *associate* members
 * (Anguilla, Bermuda, the British Virgin Islands, the Cayman Islands, Curaçao,
 * French Guiana, Martinique, the Turks and Caicos Islands) likewise do not carry
 * the id; associate membership is recorded in each entry's `note`.
 *
 * Absent: `andean` and a Central America-4 id. Both instruments are real —
 * Decision 878 (Estatuto Migratorio Andino) binds Bolivia, Colombia, Ecuador
 * and Peru, and the CA-4 agreement covers Guatemala, El Salvador, Honduras and
 * Nicaragua — but every official source for them refused to serve during this
 * sweep, and this file does not cite a URL it did not fetch. They are therefore
 * recorded in the notes on the affected jurisdictions and NOT in `blocs`. The
 * effect is that four Andean and four Central American jurisdictions currently
 * understate their mobility rights. That is the intended direction of the error.
 */

import { jurisdictionCode, type Jurisdiction } from "../types.js";

/**
 * `IsoDate` reached through the contract rather than imported from
 * `@meridian/core` directly, so this registry has exactly one dependency —
 * `../types.js` — and cannot drift from the shape it is required to satisfy.
 */
type VerifiedOn = NonNullable<Jurisdiction["verifiedOn"]>;

/** The date on which every source cited below was consulted. */
const VERIFIED = "2026-07-25" as VerifiedOn;

// --- Sources actually fetched on 2026-07-25 -------------------------------
// Every `sourceUrl` below is one of these. Nothing is cited from a search
// snippet, and nothing is cited that was not retrieved.

const SRC_USC_1153 =
  "https://www.govinfo.gov/content/pkg/USCODE-2023-title8/html/USCODE-2023-title8-chap12-subchapII-partI-sec1153.htm";
const SRC_USC_1101 =
  "https://www.govinfo.gov/content/pkg/USCODE-2023-title8/html/USCODE-2023-title8-chap12-subchapI-sec1101.htm";
const SRC_IRPA = "https://laws-lois.justice.gc.ca/eng/acts/i-2.5/page-3.html";
const SRC_MX_LEY_MIGRACION =
  "https://www.diputados.gob.mx/LeyesBiblio/pdf/LMigra.pdf";
const SRC_BR_RESIDENCIA =
  "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/migracoes/autorizacao-de-residencia";
const SRC_AR_LEY_25871 =
  "https://servicios.infoleg.gob.ar/infolegInternet/anexos/90000-94999/92016/texact.htm";
const SRC_CL_CATEGORIAS =
  "https://serviciomigraciones.cl/categorias-migratorias/";
const SRC_EC_ACUERDO_MERCOSUR =
  "https://www.gob.ec/sites/default/files/regulations/2025-02/ACUERDO%20SOBRE%20RESIDENCIA%20PARA%20LOS%20NACIONALES%20DE%20LOS%20ESTADOS%20PARTES%20DEL%20MERCOSUR,%20BOLIVIA%20Y%20CHILE.pdf";
const SRC_CARICOM_MEMBERS =
  "https://caricom.org/member-states-and-associate-members/";
const SRC_BM_IMMIGRATION = "https://www.gov.bm/department/immigration";
const SRC_KY_WORC = "https://my.egov.ky/web/worc";
const SRC_GL_PERMANENT =
  "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Permanent-residence-permit/Permanent-Greenland";
const SRC_VE_PASSPORTS = "https://www.ecoi.net/en/document/2138732.html";
const SRC_CU_EXIT = "https://www.ecoi.net/en/document/1086200.html";
/**
 * Biblioteca del Congreso Nacional de Chile, Asesoría Técnica Parlamentaria,
 * September 2025. Establishes the nine states party to the Mercosur Residence
 * Agreement, its entry into international force on 2009-07-28, and what
 * articles 4, 5, 8 and 9 confer. Used for every `mercosur-residence` claim.
 */
const SRC_MERCOSUR_BCN =
  "https://obtienearchivo.bcn.cl/obtienearchivo?id=repositorio%2F10221%2F37701%2F2%2FAc.sobre_residencia_MERCOSUR.pdf";

// --- Repeated notes, defined once so they cannot drift apart ---------------

const MERCOSUR_NOTE =
  "Party to the Acuerdo sobre Residencia para Nacionales de los Estados Partes del MERCOSUR, Bolivia y Chile (signed 2002-12-06, in international force 2009-07-28). Arts. 4-5 grant a two-year temporary residence on nationality plus a clean record, convertible to permanent; arts. 8-9 confer free entry, exit and circulation, any employed or self-employed activity on the same terms as nationals, family reunion and equal civil rights.";

const CARICOM_FULL_NOTE =
  "Full member state of CARICOM and a participant in the free movement of skilled nationals under art. 46 of the Revised Treaty of Chaguaramas. Movement is by Skills Certificate for defined occupational categories, not unconditional free movement, so no `free_movement` inbound category is claimed. Inbound categories under national law are not yet enumerated.";

const CARICOM_ASSOCIATE_NOTE =
  "CARICOM associate member, not a full member. Associate membership is not the free movement of skilled nationals regime and no bloc id is claimed on that basis.";

const NOT_ENUMERATED =
  "Inbound categories are not enumerated from the cited source and the empty list must not be read as an absence of routes.";

/**
 * A jurisdiction listed because it exists, with nothing about it verified.
 *
 * Kept to one call per line so the completeness of the enumeration can be
 * checked by eye against the M49 listing. `'stub'` is the honest default and
 * the only status this helper can produce; it cannot carry a `sourceUrl`.
 */
function stub(
  code: string,
  en: string,
  es: string,
  note?: string,
): Jurisdiction {
  return {
    code: jurisdictionCode(code),
    name: { en, es },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "stub",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    ...(note === undefined ? {} : { note }),
  };
}

export const AMERICAS_JURISDICTIONS: readonly Jurisdiction[] = [
  // ===========================================================================
  // Northern America (M49 021)
  // ===========================================================================
  {
    code: jurisdictionCode("BM"),
    name: { en: "Bermuda", es: "Bermudas" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: [],
    inbound: ["work_employed", "spouse_partner"],
    outboundConstraints: [],
    sourceUrl: SRC_BM_IMMIGRATION,
    verifiedOn: VERIFIED,
    note: `Immigration is governed by the Bermuda Immigration and Protection Act 1956, administered by Bermuda's own Department of Immigration; UK immigration law does not apply. The department also administers the British Nationality Act, which is nationality rather than immigration and does not qualify the autonomy. ${CARICOM_ASSOCIATE_NOTE} The source names work permits and partner residence; other permissions to reside and long-term permanency exist but are not enumerated there.`,
  },
  {
    code: jurisdictionCode("CA"),
    name: { en: "Canada", es: "Canadá" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "encoded",
    blocs: ["cusma"],
    inbound: [
      "work_employed",
      "highly_skilled",
      "family_reunification",
      "spouse_partner",
      "humanitarian_or_protection",
    ],
    outboundConstraints: [],
    sourceUrl: SRC_IRPA,
    verifiedOn: VERIFIED,
    note: "One of two systems whose pathways are encoded in the Meridian catalog (the other is Spain, in the Europe registry). Classes are those of s. 12 of the Immigration and Refugee Protection Act: family class (12(1)), economic class (12(2)) and Convention refugees and persons in similar circumstances (12(3)). `work_employed` and `highly_skilled` both derive from the single economic-class head, which s. 12(2) frames as the ability to become economically established. Temporary residence — study and work permits — is not enumerated from s. 12. Under CUSMA chapter 16 Canada also grants facilitated temporary entry to business visitors, traders and investors, intra-company transferees and listed professionals from Mexico and the United States.",
  },
  {
    code: jurisdictionCode("GL"),
    name: { en: "Greenland", es: "Groenlandia" },
    region: "americas",
    autonomy: "delegated",
    controlledBy: jurisdictionCode("DK"),
    researchStatus: "researched",
    blocs: [],
    inbound: ["work_employed", "study", "family_reunification"],
    outboundConstraints: [],
    sourceUrl: SRC_GL_PERMANENT,
    verifiedOn: VERIFIED,
    note: 'A judgement call worth reading before relying on. Greenland is not covered by the Danish Aliens Act as Denmark is; the Act is extended to Greenland by Ordinance No. 184 of 14 February 2025, with materially different rules — permanent residence after three years on family-reunification grounds or seven years on work or study grounds. Applications are decided by Danish authorities (the Danish Immigration Service and SIRI), which is why this is recorded as `delegated` rather than `autonomous`, but a Danish permit is not a Greenland permit and Greenland is outside both the EU and the Schengen area. If the atlas later needs to distinguish "separate rules, another state’s decision-maker" from ordinary delegation, this is the entry that will force it.',
  },
  stub("PM", "Saint Pierre and Miquelon", "San Pedro y Miquelón"),
  {
    code: jurisdictionCode("US"),
    name: { en: "United States of America", es: "Estados Unidos de América" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["cusma"],
    inbound: [
      "family_reunification",
      "spouse_partner",
      "work_employed",
      "highly_skilled",
      "intra_company_transfer",
      "investment_or_entrepreneur",
      "humanitarian_or_protection",
    ],
    outboundConstraints: [],
    sourceUrl: SRC_USC_1153,
    verifiedOn: VERIFIED,
    note: "Categories are taken from 8 U.S.C. 1153 — the four family-sponsored preferences and the five employment-based preferences, which include multinational executives (intra-company transfer) and employment creation for investors — together with refugee admissions under 8 U.S.C. 1157, which are set annually by presidential determination. Deliberately NOT claimed here: study and other non-immigrant classes, and naturalisation, which are governed by sections not consulted in this sweep; and the diversity immigrant programme of 8 U.S.C. 1153(c), which has no corresponding `InboundCategory`. The inbound list is therefore incomplete by design. Under CUSMA chapter 16 the United States also grants facilitated temporary entry to business persons from Canada and Mexico.",
  },

  // ===========================================================================
  // Central America (M49 013)
  // ===========================================================================
  {
    code: jurisdictionCode("BZ"),
    name: { en: "Belize", es: "Belice" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub("CR", "Costa Rica", "Costa Rica"),
  stub(
    "SV",
    "El Salvador",
    "El Salvador",
    "Reported party to the CA-4 free mobility agreement with Guatemala, Honduras and Nicaragua. No bloc id is claimed: the SICA source would not serve during this sweep and this registry does not cite an unfetched URL.",
  ),
  stub(
    "GT",
    "Guatemala",
    "Guatemala",
    "Reported party to the CA-4 free mobility agreement with El Salvador, Honduras and Nicaragua. No bloc id is claimed: the SICA source would not serve during this sweep and this registry does not cite an unfetched URL.",
  ),
  stub(
    "HN",
    "Honduras",
    "Honduras",
    "Reported party to the CA-4 free mobility agreement with Guatemala, El Salvador and Nicaragua. No bloc id is claimed: the SICA source would not serve during this sweep and this registry does not cite an unfetched URL.",
  ),
  {
    code: jurisdictionCode("MX"),
    name: { en: "Mexico", es: "México" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["cusma"],
    inbound: [
      "work_employed",
      "study",
      "family_reunification",
      "spouse_partner",
      "ancestry_or_descent",
      "retirement_or_passive_income",
      "humanitarian_or_protection",
      "regularisation",
    ],
    outboundConstraints: [],
    sourceUrl: SRC_MX_LEY_MIGRACION,
    verifiedOn: VERIFIED,
    note: "NOT `encoded`, and the distinction matters. Mexico appears heavily in the Meridian catalog as an ORIGIN, but no Mexican inbound pathway is encoded, so it counts as researched and nothing more. Categories are from the Ley de Migración as last reformed DOF 15-01-2026: art. 52 (condiciones de estancia — visitante with and without work permission, visitante regional, visitante trabajador fronterizo, visitante por razones humanitarias, residente temporal, residente temporal estudiante), art. 54 (residente permanente, including retired or pensioned persons with foreign income, four years of temporary residence, Mexican children, and ascendants or descendants in the direct line to the second degree of a Mexican by birth) and arts. 132-134 (regularización). Under CUSMA chapter 16 Mexico also grants facilitated temporary entry to business persons from Canada and the United States.",
  },
  stub(
    "NI",
    "Nicaragua",
    "Nicaragua",
    "Reported party to the CA-4 free mobility agreement with Guatemala, El Salvador and Honduras. No bloc id is claimed: the SICA source would not serve during this sweep and this registry does not cite an unfetched URL.",
  ),
  stub("PA", "Panama", "Panamá"),

  // ===========================================================================
  // Caribbean (M49 029)
  // ===========================================================================
  {
    code: jurisdictionCode("AI"),
    name: { en: "Anguilla", es: "Anguila" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `${CARICOM_ASSOCIATE_NOTE} Autonomy is left unknown: British overseas territories legislate their own immigration and UK immigration law does not extend to them, but that was verified for Bermuda and the Cayman Islands only and has not been checked for Anguilla.`,
  },
  {
    code: jurisdictionCode("AG"),
    name: { en: "Antigua and Barbuda", es: "Antigua y Barbuda" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub("AW", "Aruba", "Aruba"),
  {
    code: jurisdictionCode("BS"),
    name: { en: "Bahamas", es: "Bahamas" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `Full member state of CARICOM, but the \`caricom\` bloc id is deliberately withheld: the Bahamas is reported not to participate in the free movement of skilled nationals, and conferring a free-movement effect on a corridor that does not have one is the more damaging error. Confirm participation before adding the id. ${NOT_ENUMERATED}`,
  },
  {
    code: jurisdictionCode("BB"),
    name: { en: "Barbados", es: "Barbados" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub(
    "BQ",
    "Bonaire, Sint Eustatius and Saba",
    "Bonaire, San Eustaquio y Saba",
  ),
  {
    code: jurisdictionCode("VG"),
    name: { en: "British Virgin Islands", es: "Islas Vírgenes Británicas" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `${CARICOM_ASSOCIATE_NOTE} Autonomy not verified for this territory.`,
  },
  {
    code: jurisdictionCode("KY"),
    name: { en: "Cayman Islands", es: "Islas Caimán" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: [],
    inbound: ["work_employed"],
    outboundConstraints: [],
    sourceUrl: SRC_KY_WORC,
    verifiedOn: VERIFIED,
    note: `Immigration is administered by Workforce Opportunities and Residency Cayman (WORC), a Cayman Islands government body operating Cayman immigration boards, forms and appeals — the territory runs its own system. ${CARICOM_ASSOCIATE_NOTE} The source is a service portal rather than a statute: it confirms work permits and a permanent-residency route exists but does not enumerate permit types or name the governing law, so only \`work_employed\` is claimed.`,
  },
  {
    code: jurisdictionCode("CU"),
    name: { en: "Cuba", es: "Cuba" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: ["exit_permit_for_some_nationals"],
    sourceUrl: SRC_CU_EXIT,
    verifiedOn: VERIFIED,
    note: "An outbound constraint, which is the kind a destination-only platform misses. The general exit permit — the tarjeta blanca — and the requirement for a foreign letter of invitation were abolished with effect from 2013-01-14 by Decree-Law 302; a valid passport and any destination visa are since then the only documents needed to leave. Authorisation is still required for categories deemed vital to the country, notably health professionals, and Decree 306 limits periods of foreign residence for such professionals. NEEDS RE-VERIFICATION: the cited Immigration and Refugee Board response documents the position at the 2013 reform and the current practice has not been checked. Inbound categories were not researched.",
  },
  {
    code: jurisdictionCode("CW"),
    name: { en: "Curaçao", es: "Curazao" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `${CARICOM_ASSOCIATE_NOTE} Curaçao is a constituent country of the Kingdom of the Netherlands and admission and expulsion are reported to be governed by its own Landsverordening toelating en uitzetting rather than by Dutch law, which would make it autonomous; that was not confirmed against an official source in this sweep, so autonomy is left unknown rather than guessed.`,
  },
  {
    code: jurisdictionCode("DM"),
    name: { en: "Dominica", es: "Dominica" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub("DO", "Dominican Republic", "República Dominicana"),
  {
    code: jurisdictionCode("GD"),
    name: { en: "Grenada", es: "Granada" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub("GP", "Guadeloupe", "Guadalupe"),
  {
    code: jurisdictionCode("HT"),
    name: { en: "Haiti", es: "Haití" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `Full member state of CARICOM, but the \`caricom\` bloc id is deliberately withheld: Haiti is reported not to participate in the free movement of skilled nationals. Confirm participation before adding the id. ${NOT_ENUMERATED} Haiti is one of the largest origin systems in the region and deserves priority in the next research pass.`,
  },
  {
    code: jurisdictionCode("JM"),
    name: { en: "Jamaica", es: "Jamaica" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  {
    code: jurisdictionCode("MQ"),
    name: { en: "Martinique", es: "Martinica" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `${CARICOM_ASSOCIATE_NOTE} A French overseas department, reported to apply the CESEDA with local adaptations while remaining outside the Schengen area — which would make it neither plainly autonomous nor plainly delegated. Not confirmed against an official source in this sweep.`,
  },
  {
    code: jurisdictionCode("MS"),
    name: { en: "Montserrat", es: "Montserrat" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `Full member state of CARICOM, but the \`caricom\` bloc id is deliberately withheld: Montserrat is reported not to participate in the free movement of skilled nationals. Confirm before adding the id. Autonomy not verified. ${NOT_ENUMERATED}`,
  },
  {
    code: jurisdictionCode("PR"),
    name: { en: "Puerto Rico", es: "Puerto Rico" },
    region: "americas",
    autonomy: "delegated",
    controlledBy: jurisdictionCode("US"),
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_USC_1101,
    verifiedOn: VERIFIED,
    note: 'Not a separate immigration system, and the atlas should not count it as one. 8 U.S.C. 1101(a)(38) defines "United States" for the purposes of the Immigration and Nationality Act as the continental United States, Alaska, Hawaii, Puerto Rico, Guam, the US Virgin Islands and the Northern Mariana Islands. Federal immigration law applies directly; `inbound` is empty because the routes are the United States entry, not a separate set.',
  },
  stub("BL", "Saint Barthélemy", "San Bartolomé"),
  {
    code: jurisdictionCode("KN"),
    name: { en: "Saint Kitts and Nevis", es: "San Cristóbal y Nieves" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  {
    code: jurisdictionCode("LC"),
    name: { en: "Saint Lucia", es: "Santa Lucía" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub("MF", "Saint Martin (French part)", "San Martín (parte francesa)"),
  {
    code: jurisdictionCode("VC"),
    name: {
      en: "Saint Vincent and the Grenadines",
      es: "San Vicente y las Granadinas",
    },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  stub("SX", "Sint Maarten (Dutch part)", "Sint Maarten (parte neerlandesa)"),
  {
    code: jurisdictionCode("TT"),
    name: { en: "Trinidad and Tobago", es: "Trinidad y Tobago" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  {
    code: jurisdictionCode("TC"),
    name: { en: "Turks and Caicos Islands", es: "Islas Turcas y Caicos" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `${CARICOM_ASSOCIATE_NOTE} Autonomy not verified for this territory.`,
  },
  {
    code: jurisdictionCode("VI"),
    name: {
      en: "United States Virgin Islands",
      es: "Islas Vírgenes de los Estados Unidos",
    },
    region: "americas",
    autonomy: "delegated",
    controlledBy: jurisdictionCode("US"),
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_USC_1101,
    verifiedOn: VERIFIED,
    note: 'Inside the statutory definition of "United States" in 8 U.S.C. 1101(a)(38), so federal immigration law applies directly and there is no separate system. Same reasoning as Puerto Rico.',
  },

  // ===========================================================================
  // South America (M49 005)
  // ===========================================================================
  {
    code: jurisdictionCode("AR"),
    name: { en: "Argentina", es: "Argentina" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [
      "work_employed",
      "study",
      "family_reunification",
      "spouse_partner",
      "investment_or_entrepreneur",
      "humanitarian_or_protection",
    ],
    outboundConstraints: [],
    sourceUrl: SRC_AR_LEY_25871,
    verifiedOn: VERIFIED,
    note: `Categories are from Ley 25.871 de Migraciones: art. 22 (residencia permanente), art. 23 (residentes temporarios — workers, investors, scientists and specialists, students, refugees and asylum seekers), art. 23(l) (nationals of Mercosur member and associated states, two years with multiple entry), art. 10 (family reunification) and art. 29 (humanitarian exceptions). ${MERCOSUR_NOTE}`,
  },
  {
    code: jurisdictionCode("BO"),
    name: {
      en: "Bolivia (Plurinational State of)",
      es: "Bolivia (Estado Plurinacional de)",
    },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_MERCOSUR_BCN,
    verifiedOn: VERIFIED,
    note: `${MERCOSUR_NOTE} In force for Bolivia from 2009-07-28. Also bound by Decision 878 (Estatuto Migratorio Andino) with Colombia, Ecuador and Peru, which no bloc id records here because no official source could be retrieved — see the module note. ${NOT_ENUMERATED}`,
  },
  {
    code: jurisdictionCode("BR"),
    name: { en: "Brazil", es: "Brasil" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [
      "work_employed",
      "study",
      "family_reunification",
      "spouse_partner",
      "investment_or_entrepreneur",
      "humanitarian_or_protection",
    ],
    outboundConstraints: [],
    sourceUrl: SRC_BR_RESIDENCIA,
    verifiedOn: VERIFIED,
    note: `Autorizações de residência include study, health treatment, work with or without an employment relationship, working holiday under reciprocal agreements, family reunion, residence under a treaty or agreement (the route through which the Mercosur agreement operates), statelessness, asylum and refugee recognition, investment, and a specific temporary residence for Venezuelan, Guyanese and Surinamese nationals. ${MERCOSUR_NOTE}`,
  },
  stub(
    "BV",
    "Bouvet Island",
    "Isla Bouvet",
    "Uninhabited Norwegian dependency in the South Atlantic. Present only because UN M49 assigns it to South America (005); listed for enumeration completeness against that source. It has no resident population and is very unlikely ever to reach `encoded`, so it will permanently depress any structural coverage fraction computed over this file. It may also appear in a Europe registry — reconcile before computing coverage.",
  ),
  {
    code: jurisdictionCode("CL"),
    name: { en: "Chile", es: "Chile" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: ["humanitarian_or_protection"],
    outboundConstraints: [],
    sourceUrl: SRC_CL_CATEGORIAS,
    verifiedOn: VERIFIED,
    note: `The Servicio Nacional de Migraciones lists permanencia transitoria, residencia temporal, residencia definitiva, nacionalidad and the tarjeta vecinal fronteriza, and names residence for humanitarian reasons; the subcategories under residencia temporal are not enumerated there, so \`inbound\` is badly incomplete and must not be read as the whole system. ${MERCOSUR_NOTE} In force for Chile from 2009-07-28; Chile notified approval on 2005-11-18 and implemented it by Circular 26.465 of 2009, and the Biblioteca del Congreso Nacional records that the agreement's temporary-residence requirements and effects are now largely absorbed into Ley 21.325 de Migración y Extranjería, published 2021-04-20.`,
  },
  {
    code: jurisdictionCode("CO"),
    name: { en: "Colombia", es: "Colombia" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_MERCOSUR_BCN,
    verifiedOn: VERIFIED,
    note: `${MERCOSUR_NOTE} Colombia is an associated state and acceded after the 2009 entry into force. Also bound by Decision 878 (Estatuto Migratorio Andino) with Bolivia, Ecuador and Peru, which no bloc id records here because no official source could be retrieved — see the module note. ${NOT_ENUMERATED} Colombia is both a very large origin system and the largest destination for Venezuelan migration, and should be a priority for the next pass.`,
  },
  {
    code: jurisdictionCode("EC"),
    name: { en: "Ecuador", es: "Ecuador" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [
      "work_employed",
      "work_self_employed",
      "family_reunification",
      "spouse_partner",
    ],
    outboundConstraints: [],
    sourceUrl: SRC_EC_ACUERDO_MERCOSUR,
    verifiedOn: VERIFIED,
    note: `Verified against Ecuador's own implementing instrument, Acuerdo Ministerial 000031 (Registro Oficial 229, 21-IV-2014, as reformed by Acuerdo 0000070, Registro Oficial 621, 14-VIII-2024): a Mercosur temporary residence visa is granted on a passport or identity card of a signatory state plus a police or judicial record certificate, regardless of the applicant's current migratory status and with exemption from fines (art. 4); it converts to permanent residence on application before expiry (art. 6); holders may carry on any lawful activity, employed or self-employed, on the same terms as Ecuadorian nationals (art. 7); dependent visas de amparo cover relatives to the second degree of consanguinity and first of affinity. The inbound categories listed derive from this route only — Ecuador's general residence categories were not enumerated. Also bound by Decision 878 (Estatuto Migratorio Andino); no bloc id, see the module note. ${MERCOSUR_NOTE}`,
  },
  stub(
    "FK",
    "Falkland Islands (Malvinas)",
    "Islas Malvinas (Falkland Islands)",
  ),
  {
    code: jurisdictionCode("GF"),
    name: { en: "French Guiana", es: "Guayana Francesa" },
    region: "americas",
    autonomy: "unknown",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: `${CARICOM_ASSOCIATE_NOTE} A French overseas department, reported to apply the CESEDA with local adaptations while remaining outside the Schengen area. Not confirmed against an official source in this sweep, so autonomy is left unknown.`,
  },
  {
    code: jurisdictionCode("GY"),
    name: { en: "Guyana", es: "Guyana" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  {
    code: jurisdictionCode("PY"),
    name: { en: "Paraguay", es: "Paraguay" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_MERCOSUR_BCN,
    verifiedOn: VERIFIED,
    note: `${MERCOSUR_NOTE} A founding Mercosur member; in force from 2009-07-28. ${NOT_ENUMERATED}`,
  },
  {
    code: jurisdictionCode("PE"),
    name: { en: "Peru", es: "Perú" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_MERCOSUR_BCN,
    verifiedOn: VERIFIED,
    note: `${MERCOSUR_NOTE} Peru is an associated state and acceded after the 2009 entry into force. Also bound by Decision 878 (Estatuto Migratorio Andino) with Bolivia, Colombia and Ecuador, which no bloc id records here because no official source could be retrieved — see the module note. ${NOT_ENUMERATED} Peru is one of the largest destinations for Venezuelan migration and should be a priority for the next pass.`,
  },
  stub(
    "GS",
    "South Georgia and the South Sandwich Islands",
    "Islas Georgias del Sur y Sandwich del Sur",
    "No permanent resident population; presence is by permit only. Listed for enumeration completeness. Like Bouvet Island it will permanently depress any structural coverage fraction computed over this file.",
  ),
  {
    code: jurisdictionCode("SR"),
    name: { en: "Suriname", es: "Surinam" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["caricom"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_CARICOM_MEMBERS,
    verifiedOn: VERIFIED,
    note: CARICOM_FULL_NOTE,
  },
  {
    code: jurisdictionCode("UY"),
    name: { en: "Uruguay", es: "Uruguay" },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: ["mercosur-residence"],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC_MERCOSUR_BCN,
    verifiedOn: VERIFIED,
    note: `${MERCOSUR_NOTE} A founding Mercosur member; in force from 2009-07-28. ${NOT_ENUMERATED}`,
  },
  {
    code: jurisdictionCode("VE"),
    name: {
      en: "Venezuela (Bolivarian Republic of)",
      es: "Venezuela (República Bolivariana de)",
    },
    region: "americas",
    autonomy: "autonomous",
    researchStatus: "researched",
    blocs: [],
    inbound: [],
    outboundConstraints: ["passport_issuance_restricted"],
    sourceUrl: SRC_VE_PASSPORTS,
    verifiedOn: VERIFIED,
    note: "The single most consequential outbound constraint in the region, and one a destination-only model would never surface. There is no exit-visa statute; the constraint is the practical unavailability of the passport. A response of the Immigration and Refugee Board of Canada records an adult passport fee of about US$216 against a monthly minimum wage of roughly US$5, waits that can exceed sixteen months inside the country, an unstable issuing platform abroad, an identity-card prerequisite that cannot be obtained from outside the country, and the impossibility of renewal for the very large number of Venezuelans living in states that severed relations after the 2024 election. It also records the arbitrary cancellation of the passports of at least forty human-rights defenders, journalists and activists, and of family members. `passport_issuance_restricted` is therefore recorded as administrative practice, not as a bright-line rule, and any consumer must present it that way. Venezuela is NOT party to the Mercosur Residence Agreement: the nine parties recorded by the Biblioteca del Congreso Nacional de Chile do not include it. Inbound categories were not researched.",
  },
];
