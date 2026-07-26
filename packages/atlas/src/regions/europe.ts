/**
 * Europe — the jurisdiction registry.
 *
 * ## Scope
 *
 * The enumeration is the UN M49 list for Europe (51 entries: Eastern, Northern,
 * Southern and Western Europe), plus two that M49 places elsewhere or nowhere
 * and that a European registry cannot honestly omit — 53 entries in total:
 *
 * - **CY** — M49 files Cyprus under Western Asia. It is an EU member state, so
 *   the EU/EEA layer that this region exists to model applies to it directly.
 * - **XK** — Kosovo has no M49 entry and no assigned ISO 3166-1 code. `XK` is
 *   the user-assigned code the EU, the IMF and SWIFT use for it. It runs its
 *   own immigration control, so leaving it out would shrink the denominator.
 *
 * Deliberately *not* here, because they belong to another region's file even
 * though they are administered from Europe: Greenland (M49 Northern America —
 * and it runs a residence-permit regime distinct from Denmark's, so it must
 * appear somewhere), the Caribbean parts of the Kingdom of the Netherlands, the
 * French overseas departments and collectivities, and Kazakhstan.
 *
 * **AM, AZ, GE and TR** are not here for that same reason, and were until
 * 2026-07-25. All four are transcontinental, M49 files them under Western Asia,
 * and `regions/asia.ts` holds them; listing them in both files put four
 * duplicates in the data, which the assembler had to repair at read time. This
 * file dropped its four — all stubs, against Asia records that are `researched`
 * for AM and TR and no worse for AZ and GE. See the comment at the head of the
 * array before re-adding any of them.
 *
 * Also not here, because they have no ISO 3166-1 alpha-2 code and inventing one
 * would put a fabricated key in a registry keyed by a standard: Northern Cyprus,
 * Transnistria, Abkhazia, South Ossetia, the British Sovereign Base Areas of
 * Akrotiri and Dhekelia, and Mount Athos (which does operate its own entry
 * permit, the *diamonitirion*, within Greece).
 *
 * ## What the statuses mean here
 *
 * `stub` is the default and is not an apology: it means the jurisdiction exists
 * and nothing about it has been checked. Every `researched` entry below names a
 * source that was actually retrieved on 2026-07-25, and its `inbound` list is
 * only as long as that source supports — where a source enumerated fewer
 * categories than the country plainly operates, the entry says so in `note`
 * rather than filling the gap from memory. `encoded` is exactly one entry, ES,
 * whose pathways are in `packages/pathways/src/catalog/es.ts`.
 *
 * Consequently the stubs carry `blocs: []`. EU, EEA, Schengen and CTA membership
 * for every one of them is a determinate fact — the Schengen half with per-state
 * effective dates is already in `packages/core/src/jurisdiction.ts` — but the
 * bloc registry holds `members` itself and is the authority for it. Backfilling
 * these arrays is a mechanical follow-up; asserting membership on a record whose
 * `researchStatus` says nothing was checked would be the wrong kind of tidy.
 */

import { jurisdictionCode } from '../types.js';
import type { Jurisdiction } from '../types.js';

const C = jurisdictionCode;

/** Local `IsoDate` constructor, so this file needs no import from `@meridian/core`. */
type AtlasDate = NonNullable<Jurisdiction['verifiedOn']>;
const ON = '2026-07-25' as AtlasDate;

/**
 * Home Office guidance on the Common Travel Area. Cited for IE, GB and the three
 * Crown Dependencies: it is the instrument that names all five as CTA members.
 */
const CTA_SOURCE =
  'https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance';

export const EUROPE_JURISDICTIONS: readonly Jurisdiction[] = [
  {
    code: C('AD'),
    name: { en: 'Andorra', es: 'Andorra' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['ibero-american'],
    inbound: ['work_employed', 'work_self_employed', 'retirement_or_passive_income'],
    outboundConstraints: [],
    sourceUrl: 'https://www.govern.ad/ca/tematiques/immigracio',
    verifiedOn: ON,
    note:
      'Sovereign and outside the EU, the EEA and the Schengen area; the Departament ' +
      "d'Immigració legislates and administers its own permits. Admissions run against " +
      'an annual quota (*contingent*) set by the Government, which is administrative ' +
      'practice rather than a fixed statutory number. Andorra is named in art. 22.1 of ' +
      'the Spanish Civil Code, so Andorran nationals reach Spanish nationality on the ' +
      'two-year period — see SPAIN_REDUCED_RESIDENCY_NATIONALITIES in @meridian/core. ' +
      'Andorra has no airport and no sea border: every land approach crosses France or ' +
      'Spain, so a traveller needing a Schengen visa needs one to arrive at all.',
  },
  {
    code: C('AL'),
    name: { en: 'Albania', es: 'Albania' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  // ─── AM, AZ, GE and TR live in regions/asia.ts ───────────────────────────
  //
  // Armenia, Azerbaijan, Georgia and Türkiye are absent from this file on
  // purpose, not by oversight. All four are transcontinental; UN M49 assigns
  // them to Western Asia (https://unstats.un.org/unsd/methodology/m49/, checked
  // 2026-07-25), and `regions/asia.ts` carries the records.
  //
  // Both files listed them until 2026-07-25. The assembler deduplicated by code
  // and kept the Asia record, but a duplicate repaired at read time is still a
  // duplicate in the data: anyone counting jurisdictions by summing the five
  // region files got 253 where the atlas holds 249.
  //
  // Their Council of Europe membership is why a European registry wants them,
  // and it is not a reason to hold a second record — a jurisdiction is one row,
  // and corridor derivation reads the merged atlas rather than this array. If
  // one of them needs deepening, deepen it in `regions/asia.ts`. TR most of all:
  // it is a first-rank system on both sides, a large destination and a large
  // origin, and SY > TR is the third-largest corridor in the stock table.
  {
    code: C('AT'),
    name: { en: 'Austria', es: 'Austria' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eu', 'eea', 'schengen'],
    inbound: [
      'work_employed',
      'work_self_employed',
      'highly_skilled',
      'intra_company_transfer',
      'study',
      'family_reunification',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/',
    verifiedOn: ON,
    note:
      'Categories taken from the federal migration portal, which enumerates the ' +
      'Red-White-Red Card (a points-scored route covering both ordinary and highly ' +
      'qualified employment), intra-corporate transferees, self-employed persons, ' +
      'students, researchers, family reunification and settlement permits. The portal ' +
      'did not name the EU Blue Card on the page consulted; that Austria also operates ' +
      'one has not been verified here.',
  },
  {
    code: C('AX'),
    name: { en: 'Åland Islands', es: 'Islas Åland' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Autonomous region of Finland with its own right of domicile (*hembygdsrätt*) ' +
      'governing land ownership, business and the local franchise. Whether that ' +
      'amounts to immigration control separate from Finland\'s was not established — ' +
      'the autonomy field is deliberately left unknown rather than guessed.',
  },
  // AZ Azerbaijan — transcontinental; the record is in regions/asia.ts. See the
  // block comment at the head of this array before re-adding it here.
  {
    code: C('BA'),
    name: { en: 'Bosnia and Herzegovina', es: 'Bosnia y Herzegovina' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('BE'),
    name: { en: 'Belgium', es: 'Bélgica' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('BG'),
    name: { en: 'Bulgaria', es: 'Bulgaria' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Schengen accession happened in two stages — air and sea controls lifted ' +
      '2024-03-31, full accession 2025-01-01. The dates are in SCHENGEN_MEMBERSHIP in ' +
      '@meridian/core and stays between them are treated as ambiguous, not resolved.',
  },
  {
    code: C('BY'),
    name: { en: 'Belarus', es: 'Bielorrusia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('CH'),
    name: { en: 'Switzerland', es: 'Suiza' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['schengen'],
    inbound: ['work_employed', 'free_movement'],
    outboundConstraints: [],
    sourceUrl: 'https://www.sem.admin.ch/sem/en/home/themen/aufenthalt.html',
    verifiedOn: ON,
    note:
      'In the Schengen area since 2008-12-12 but in neither the EU nor the EEA: free ' +
      'movement with the EU rests on the bilateral Agreement on the Free Movement of ' +
      'Persons, which is a separate instrument from the EEA Agreement. The SEM page ' +
      'consulted distinguishes short-term, annual and permanent permits and separates ' +
      'EU/EFTA nationals from third-country nationals; it did not enumerate study or ' +
      'family categories, so those are absent here rather than assumed. Cantonal ' +
      'migration offices, not the Confederation, issue the permits.',
  },
  {
    code: C('CY'),
    name: { en: 'Cyprus', es: 'Chipre' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'EU member state outside the Schengen area — it is absent from ' +
      'SCHENGEN_MEMBERSHIP in @meridian/core, which is correct and not an omission. ' +
      'UN M49 files Cyprus under Western Asia; it is listed in this region because the ' +
      'EU layer is what governs it. This record covers the areas under the effective ' +
      'control of the Republic of Cyprus only.',
  },
  {
    code: C('CZ'),
    name: { en: 'Czechia', es: 'Chequia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('DE'),
    name: { en: 'Germany', es: 'Alemania' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eu', 'eea', 'schengen'],
    inbound: ['work_employed', 'study', 'family_reunification', 'free_movement'],
    outboundConstraints: [],
    sourceUrl:
      'https://www.bamf.de/EN/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/zuwandererdrittstaaten-node.html',
    verifiedOn: ON,
    note:
      'The BAMF page consulted enumerates four routes for third-country nationals — ' +
      'work, education, family reunification and intra-EU mobility — and states that a ' +
      'residence title is required and its type follows the purpose of residence. ' +
      'Germany plainly also operates an EU Blue Card, self-employment, asylum and ' +
      'naturalisation routes; those were not on the page consulted and are therefore ' +
      'not listed above. This entry understates Germany and should be deepened before ' +
      'it is used for anything but counting.',
  },
  {
    code: C('DK'),
    name: { en: 'Denmark', es: 'Dinamarca' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Denmark is in the Schengen area but has an opt-out from the EU justice and home ' +
      'affairs acquis, so the EU legal-migration directives do not bind it in the way ' +
      'they bind most member states. That opt-out was not verified against a source in ' +
      'this pass, which is part of why this entry is a stub.',
  },
  {
    code: C('EE'),
    name: { en: 'Estonia', es: 'Estonia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('ES'),
    name: { en: 'Spain', es: 'España' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'encoded',
    blocs: ['eu', 'eea', 'schengen', 'ibero-american'],
    inbound: [
      'work_employed',
      'work_self_employed',
      'highly_skilled',
      'intra_company_transfer',
      'study',
      'family_reunification',
      'investment_or_entrepreneur',
      'retirement_or_passive_income',
      'digital_nomad',
      'humanitarian_or_protection',
      'regularisation',
      'naturalisation_by_residence',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-544',
    verifiedOn: ON,
    note:
      'The only encoded jurisdiction in this region. The consolidated text of Ley ' +
      'Orgánica 4/2000 establishes estancia, residencia temporal (general economic ' +
      'means, employed and self-employed work, seasonal work, studies, arraigo, ' +
      'humanitarian circumstances), residencia de larga duración and reagrupación ' +
      'familiar. The highly qualified, intra-company transfer, teleworker and ' +
      'entrepreneur routes sit in Ley 14/2013, not in LO 4/2000. The investor route of ' +
      'Ley 14/2013 was repealed by LO 1/2025 — investment_or_entrepreneur is listed ' +
      'for the surviving entrepreneur route, not the golden visa. Encoded pathways: ' +
      'packages/pathways/src/catalog/es.ts, every record reviewStatus unreviewed.',
  },
  {
    code: C('FI'),
    name: { en: 'Finland', es: 'Finlandia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('FO'),
    name: { en: 'Faroe Islands', es: 'Islas Feroe' },
    region: 'europe',
    autonomy: 'delegated',
    controlledBy: C('DK'),
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.nyidanmark.dk/en-GB/You-want-to-apply/The-Faroe-Islands-and-Greenland',
    verifiedOn: ON,
    note:
      'Applications for a residence and/or work permit for the Faroe Islands are made ' +
      'through the Danish Immigration Service, which is why autonomy is recorded as ' +
      'delegated. That understates the Faroese role: the Faroes have their own Aliens ' +
      'Act and their own immigration office (Útlendingastovan), and the split of ' +
      'decision-making between Copenhagen and Tórshavn was not established here. The ' +
      'Faroe Islands are excluded from the EU treaties. Their Schengen position was ' +
      'not verified and no bloc is asserted.',
  },
  {
    code: C('FR'),
    name: { en: 'France', es: 'Francia' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eu', 'eea', 'schengen'],
    inbound: [
      'work_employed',
      'work_self_employed',
      'highly_skilled',
      'intra_company_transfer',
      'study',
      'family_reunification',
      'retirement_or_passive_income',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.service-public.gouv.fr/particuliers/vosdroits/N110',
    verifiedOn: ON,
    note:
      'Categories map to the titres de séjour enumerated by the public service portal: ' +
      'salarié / travailleur temporaire, entrepreneur ou profession libérale, ' +
      'travailleur saisonnier, salarié détaché ICT, talent and talent famille, ' +
      'étudiant, vie privée et familiale, visiteur, retraité, and the carte de ' +
      'résident. This record covers metropolitan France; the overseas departments and ' +
      'collectivities have their own entry regimes and are not modelled here.',
  },
  {
    code: C('GB'),
    name: { en: 'United Kingdom', es: 'Reino Unido' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cta'],
    inbound: [
      'work_employed',
      'study',
      'family_reunification',
      'spouse_partner',
      'ancestry_or_descent',
      'humanitarian_or_protection',
      'naturalisation_by_residence',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.gov.uk/browse/visas-immigration',
    verifiedOn: ON,
    note:
      'Outside the EU, the EEA and Schengen since withdrawal; free movement is ' +
      'therefore not listed. The route index consulted names visiting, working ' +
      '(Skilled Worker, Graduate), studying, family and partner routes, the EU ' +
      'Settlement Scheme as a closed legacy route, UK Ancestry and right of abode, ' +
      'settlement and indefinite leave to remain, and asylum. Irish citizens enter and ' +
      'reside under the Common Travel Area rather than under any of these.',
  },
  // GE Georgia — transcontinental; the record is in regions/asia.ts. See the
  // block comment at the head of this array before re-adding it here.
  {
    code: C('GG'),
    name: { en: 'Guernsey', es: 'Guernsey' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cta'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: CTA_SOURCE,
    verifiedOn: ON,
    note:
      'The Bailiwick of Guernsey is named by the Home Office as a distinct member of ' +
      'the Common Travel Area alongside the UK, Jersey, the Isle of Man and Ireland — ' +
      'it is not part of the United Kingdom. Its own permission categories were not ' +
      'researched, so inbound is empty rather than copied from the UK. Guernsey ' +
      'operates its own Electronic Travel Authorisation scheme, legally distinct from ' +
      "the UK's. Alderney and Sark fall within this Bailiwick and have no separate " +
      'entry here.',
  },
  {
    code: C('GI'),
    name: { en: 'Gibraltar', es: 'Gibraltar' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.gov.uk/foreign-travel-advice/gibraltar/entry-requirements',
    verifiedOn: ON,
    note:
      'A British Overseas Territory whose own authorities are responsible for ' +
      'immigration and entry, and which is in neither the EU nor the Schengen area. ' +
      'Arrivals at the airport pass two sets of controls, one Gibraltarian and one ' +
      'operated by Spain as the neighbouring Schengen state. The UK-EU Agreement in ' +
      'respect of Gibraltar applies provisionally from 2026-07-15, aligning short-stay ' +
      'entry conditions with Schengen while leaving residence in Gibraltar under ' +
      "Gibraltar's own law; this record predates any settled practice under it. Not a " +
      'Common Travel Area member.',
  },
  {
    code: C('GR'),
    name: { en: 'Greece', es: 'Grecia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('HR'),
    name: { en: 'Croatia', es: 'Croacia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'In Schengen only from 2023-01-01; time spent in Croatia before that date did ' +
      'not consume Schengen allowance. See SCHENGEN_MEMBERSHIP in @meridian/core.',
  },
  {
    code: C('HU'),
    name: { en: 'Hungary', es: 'Hungría' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('IE'),
    name: { en: 'Ireland', es: 'Irlanda' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eu', 'eea', 'cta'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: CTA_SOURCE,
    verifiedOn: ON,
    note:
      'An EU member state that is NOT in the Schengen area — it is absent from ' +
      'SCHENGEN_MEMBERSHIP in @meridian/core, correctly. Ireland runs its own visa and ' +
      'permission system and its own border controls. Under the Common Travel Area, ' +
      'British and Irish citizens may move freely and reside in either jurisdiction ' +
      'without a visa, residence permit or employment permit, and have reciprocal ' +
      'access to work, education, social security, healthcare and certain votes. The ' +
      'CTA predates both states\' EU membership and does not depend on it. Ireland\'s ' +
      'own employment-permit and residence categories were not researched here.',
  },
  {
    code: C('IM'),
    name: { en: 'Isle of Man', es: 'Isla de Man' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cta'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: CTA_SOURCE,
    verifiedOn: ON,
    note:
      'Named by the Home Office as a distinct member of the Common Travel Area ' +
      'alongside the UK, Jersey, Guernsey and Ireland; it is not part of the United ' +
      'Kingdom and operates its own Electronic Travel Authorisation scheme. Its own ' +
      'work-permit categories were not researched, so inbound is empty rather than ' +
      "copied from the UK's.",
  },
  {
    code: C('IS'),
    name: { en: 'Iceland', es: 'Islandia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'In the Schengen area from 2001-03-25 without being an EU member state; also an ' +
      'EEA party through EFTA. Neither fact was re-verified against a source in this ' +
      'pass, so no bloc is asserted on the record.',
  },
  {
    code: C('IT'),
    name: { en: 'Italy', es: 'Italia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'A first-rank destination system left as a stub only because every official ' +
      'Italian source attempted on 2026-07-25 refused automated retrieval. This is the ' +
      'single largest known gap in this region file and should be the first entry ' +
      'deepened.',
  },
  {
    code: C('JE'),
    name: { en: 'Jersey', es: 'Jersey' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cta'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: CTA_SOURCE,
    verifiedOn: ON,
    note:
      'The Bailiwick of Jersey is named by the Home Office as a distinct member of the ' +
      'Common Travel Area alongside the UK, Guernsey, the Isle of Man and Ireland; it ' +
      'is not part of the United Kingdom and operates its own Electronic Travel ' +
      'Authorisation scheme. Jersey additionally controls residence and employment ' +
      'through housing and work legislation that is separate from immigration control; ' +
      'that layer was not researched here and inbound is left empty.',
  },
  {
    code: C('LI'),
    name: { en: 'Liechtenstein', es: 'Liechtenstein' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'In the Schengen area from 2011-12-19 and an EEA party without being an EU ' +
      'member. Liechtenstein is the one EEA state whose free movement of persons is ' +
      'capped: residence permits are allocated against a quota, part of it by draw. ' +
      'The official pages describing the quota refused automated retrieval on ' +
      '2026-07-25, so this stays a stub rather than being written up from memory.',
  },
  {
    code: C('LT'),
    name: { en: 'Lithuania', es: 'Lituania' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('LU'),
    name: { en: 'Luxembourg', es: 'Luxemburgo' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('LV'),
    name: { en: 'Latvia', es: 'Letonia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('MC'),
    name: { en: 'Monaco', es: 'Mónaco' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl:
      'https://monservicepublic.gouv.mc/en/themes/nationality-and-residency/residency/new-entrants/how-to-apply-for-a-residence-permit',
    verifiedOn: ON,
    note:
      'A split system, and the reason autonomy alone does not describe it. A non-EEA ' +
      'national must first obtain a type D long-stay visa for Monaco from the French ' +
      'consulate nearest their last residence — France operates the entry gate — and ' +
      "only then applies to Monaco's own Residency Section, which issues the carte de " +
      'séjour. Recorded as autonomous because the residence decision is Monegasque, ' +
      'with the French visa prerequisite stated here rather than encoded. Monaco is ' +
      'not a Schengen signatory and no bloc is asserted, though a Monaco residence ' +
      'permit lets a non-EEA holder travel in the Schengen area without a short-stay ' +
      'visa. Categories of permit were not enumerated by the source consulted.',
  },
  {
    code: C('MD'),
    name: { en: 'Moldova', es: 'Moldavia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('ME'),
    name: { en: 'Montenegro', es: 'Montenegro' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('MK'),
    name: { en: 'North Macedonia', es: 'Macedonia del Norte' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('MT'),
    name: { en: 'Malta', es: 'Malta' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('NL'),
    name: { en: 'Netherlands', es: 'Países Bajos' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eu', 'eea', 'schengen'],
    inbound: [
      'work_employed',
      'work_self_employed',
      'highly_skilled',
      'intra_company_transfer',
      'study',
      'family_reunification',
      'spouse_partner',
      'investment_or_entrepreneur',
      'humanitarian_or_protection',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://ind.nl/en/residence-permits',
    verifiedOn: ON,
    note:
      'Categories taken from the IND permit index: highly skilled migrant, European ' +
      'Blue Card, intra-corporate transferee, researcher, single permit (GVVA), ' +
      'self-employed, start-up and essential start-up personnel, seasonal work, ' +
      'orientation year, partner and child reunification, students, au pair and ' +
      'working holiday, asylum, medical treatment, EU long-term resident status and ' +
      'EU/EEA/Swiss residence. This record covers the European Netherlands; Aruba, ' +
      'Curaçao, Sint Maarten and the Caribbean Netherlands have their own admission ' +
      'regimes and belong to the americas region.',
  },
  {
    code: C('NO'),
    name: { en: 'Norway', es: 'Noruega' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eea', 'schengen'],
    inbound: [
      'work_employed',
      'study',
      'family_reunification',
      'humanitarian_or_protection',
      'naturalisation_by_residence',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.udi.no/en/want-to-apply/',
    verifiedOn: ON,
    note:
      'In Schengen from 2001-03-25 and an EEA party through EFTA, without EU ' +
      'membership. Categories taken from the UDI application index: work immigration ' +
      '(skilled and seasonal), study, family immigration, protection, EU/EEA ' +
      'registration and residence cards, permanent residence and citizenship. Svalbard ' +
      'is NOT covered by this record — the Immigration Act does not apply there. See ' +
      'the SJ entry.',
  },
  {
    code: C('PL'),
    name: { en: 'Poland', es: 'Polonia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'A major destination system, and since 2022 the largest single host of ' +
      'Ukrainians in the EU. Left as a stub because the Office for Foreigners pages ' +
      'did not return content to automated retrieval on 2026-07-25.',
  },
  {
    code: C('PT'),
    name: { en: 'Portugal', es: 'Portugal' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Named in art. 22.1 of the Spanish Civil Code, so Portuguese nationals reach ' +
      'Spanish nationality on the two-year period — see ' +
      'SPAIN_REDUCED_RESIDENCY_NATIONALITIES in @meridian/core. Left as a stub because ' +
      'the AIMA and visa-portal pages failed TLS verification or returned 404 on ' +
      '2026-07-25.',
  },
  {
    code: C('RO'),
    name: { en: 'Romania', es: 'Rumanía' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Schengen accession happened in two stages — air and sea controls lifted ' +
      '2024-03-31, full accession 2025-01-01. The dates are in SCHENGEN_MEMBERSHIP in ' +
      '@meridian/core and stays between them are treated as ambiguous, not resolved.',
  },
  {
    code: C('RS'),
    name: { en: 'Serbia', es: 'Serbia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('RU'),
    name: { en: 'Russia', es: 'Rusia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'UN M49 assigns the Russian Federation to Eastern Europe and it is listed here ' +
      'on that basis, notwithstanding that most of its territory is in Asia.',
  },
  {
    code: C('SE'),
    name: { en: 'Sweden', es: 'Suecia' },
    region: 'europe',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eu', 'eea', 'schengen'],
    inbound: [
      'work_employed',
      'work_self_employed',
      'highly_skilled',
      'study',
      'family_reunification',
      'humanitarian_or_protection',
      'naturalisation_by_residence',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.migrationsverket.se/English/Private-individuals.html',
    verifiedOn: ON,
    note:
      'Categories taken from the Migrationsverket index for private individuals: work ' +
      'permit, EU Blue Card, self-employment, study, moving to someone in Sweden, ' +
      'international protection and citizenship. The agency notes that stricter ' +
      'citizenship requirements, including language and self-sufficiency conditions, ' +
      'entered into force on 2026-06-06; the terms of that change were not read and ' +
      'are not encoded.',
  },
  {
    code: C('SI'),
    name: { en: 'Slovenia', es: 'Eslovenia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('SJ'),
    name: { en: 'Svalbard and Jan Mayen', es: 'Svalbard y Jan Mayen' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.udi.no/en/word-definitions/svalbard/',
    verifiedOn: ON,
    note:
      'The clearest case in this region of sovereignty and immigration control coming ' +
      'apart. Svalbard is part of Norway, but the Norwegian Immigration Act does not ' +
      'apply there and no visa or residence permit is required to stay — a consequence ' +
      'of the Svalbard Treaty rule that nationals of contracting parties have equal ' +
      'liberty of access. Svalbard is not in the Schengen area, so a traveller who ' +
      'needs a Schengen visa needs a multiple-entry one to return to the mainland ' +
      'afterwards. The Governor may still refuse residence to someone without means. ' +
      'Recorded as autonomous, and inbound is empty because there are no permit ' +
      'categories to list, not because none were researched. Jan Mayen shares this ' +
      'ISO code but not this regime; it has no permanent civilian population.',
  },
  {
    code: C('SK'),
    name: { en: 'Slovakia', es: 'Eslovaquia' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: C('SM'),
    name: { en: 'San Marino', es: 'San Marino' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Sovereign, outside the EU and not a Schengen signatory, with an open border ' +
      'with Italy. It issues its own permesso di soggiorno and residenza through the ' +
      'Gendarmeria and the Ufficio Stato Civile. The official pages were located but ' +
      'not retrieved on 2026-07-25, so autonomy is left unknown rather than asserted.',
  },
  // TR Türkiye — transcontinental; the record is in regions/asia.ts, where it is
  // `researched`. See the block comment at the head of this array before
  // re-adding it here.
  {
    code: C('UA'),
    name: { en: 'Ukraine', es: 'Ucrania' },
    region: 'europe',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: ['exit_permit_for_some_nationals', 'military_service_hold'],
    sourceUrl:
      'https://www.kmu.gov.ua/en/news/choloviky-vid-18-do-22-rokiv-zmozhut-bezpereshkodno-peretynaty-kordon-pid-chas-voiennoho-stanu-iuliia-svyrydenko',
    verifiedOn: ON,
    note:
      'The case outboundConstraints exists for. Under martial law, departure from ' +
      'Ukraine is restricted for male citizens in the military-service age band, with ' +
      'exceptions including single parents, medical treatment abroad, a death in the ' +
      'family and certain state office-holders. The Cabinet of Ministers announced ' +
      'that men aged 18 to 22 inclusive may cross the border freely during martial ' +
      'law, on presentation of a military registration document. The upper bound of ' +
      'the restricted band and the current status of martial law were not verified ' +
      'against primary legislation here and no age numbers are encoded — for someone ' +
      'in this position the binding constraint is on the way out, and a destination-' +
      'only answer would be confidently useless. Ukraine is an EU candidate, not a ' +
      'member, and is not a CIS member. Its inbound categories were not researched.',
  },
  {
    code: C('VA'),
    name: { en: 'Holy See (Vatican City State)', es: 'Santa Sede (Ciudad del Vaticano)' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Sovereign, with an open border with Italy and a resident population in the ' +
      'hundreds. Vatican citizenship is functional and tied to office or service ' +
      'rather than to residence, and how ordinary immigration control is exercised ' +
      'over the territory was not established. Left unknown deliberately: this is a ' +
      'jurisdiction where guessing autonomy in either direction would be wrong.',
  },
  {
    code: C('XK'),
    name: { en: 'Kosovo', es: 'Kosovo' },
    region: 'europe',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'No ISO 3166-1 assignment and no UN M49 entry. XK is the user-assigned code used ' +
      'by the European Commission, the IMF and SWIFT, and is used here for the same ' +
      'reason: Kosovo operates its own immigration control and omitting it would ' +
      'understate the denominator. Its status is not universally recognised and this ' +
      'record takes no position on that.',
  },
];
