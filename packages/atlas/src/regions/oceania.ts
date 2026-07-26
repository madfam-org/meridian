/**
 * Oceania jurisdiction registry.
 *
 * ## Enumeration
 *
 * Enumerated against the UN Statistics Division M49 standard country and area
 * codes, region Oceania (009), covering sub-regions Australia and New Zealand
 * (053), Melanesia (054), Micronesia (057) and Polynesia (061). Twenty-nine
 * entries, ordered by sub-region. The list is the deliverable: a missing
 * jurisdiction silently shrinks the denominator of every coverage number
 * computed from this file, so entries are present even where nothing about them
 * has been verified.
 *
 * ## What `researched` means here
 *
 * Eleven entries carry `researchStatus: 'researched'`. Each of those has a
 * `sourceUrl` that was actually fetched and read on `verifiedOn`. The remaining
 * eighteen are `stub`: listed because they exist, nothing verified. Several
 * stubs carry a `note` stating the specific open question, so the next pass does
 * not have to rediscover it. No entry is `encoded` — the Meridian catalog covers
 * ES and CA and nothing in this region.
 *
 * A `researched` entry with an empty `inbound` array means the source
 * established the jurisdiction's *autonomy* or bloc membership but did not
 * enumerate its visa categories. That is stated in the entry's `note` rather
 * than left to be misread as "offers nothing".
 *
 * ## Two structures this region exposes
 *
 * **Trans-Tasman.** Australia grants New Zealand citizens the Special Category
 * (subclass 444) visa on arrival; New Zealand grants Australian citizens and
 * permanent residents an Australian Resident Visa at the border. Both sides
 * legislate this unilaterally, so both are `autonomous`, not
 * `autonomous_within_bloc` — there is no supranational area either could fail to
 * opt out of. Bloc id `trans-tasman`.
 *
 * **The Compacts of Free Association.** Citizens of the Federated States of
 * Micronesia, the Marshall Islands and Palau may be admitted to the United
 * States and its territories to work and establish residence for duration of
 * stay, without a visa. Bloc id `cofa`. The effect is *asymmetric*: it runs from
 * the three freely associated states towards the United States, and US
 * nationals do not obtain the mirror-image right of residence and work in those
 * three states. `BlocEffect` as currently modelled attaches to a bloc rather
 * than to a direction, so a corridor derived naively from `cofa` membership will
 * overstate the US-to-FSM/RMI/PW direction. Flagged for the bloc registry.
 *
 * ## Where the model does not fit
 *
 * `SystemAutonomy` handled every jurisdiction in this region except the
 * Realm of New Zealand. The Cook Islands and Niue are self-governing in free
 * association with New Zealand and administer their own entry permits, while
 * their people hold New Zealand citizenship; Tokelau is a New Zealand territory
 * whose people are likewise New Zealand citizens. `autonomous` describes the
 * Cook Islands' and Niue's control of their own borders correctly, but says
 * nothing about the mobility their people hold in the other direction, which is
 * the fact that actually matters to a person. That direction needs a bloc — see
 * the notes on CK, NU and TK — and none was created here because no official
 * source for it was successfully retrieved.
 */

import { isoDate } from '@meridian/core';

import { jurisdictionCode, type Jurisdiction } from '../types.js';

/** Every `researched` entry below was checked against its `sourceUrl` on this date. */
const VERIFIED_ON = isoDate('2026-07-25');

export const OCEANIA_JURISDICTIONS: readonly Jurisdiction[] = [
  // ── Australia and New Zealand (M49 053) ──────────────────────────────────
  {
    code: jurisdictionCode('AU'),
    name: { en: 'Australia', es: 'Australia' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['trans-tasman'],
    inbound: [
      'highly_skilled',
      'work_employed',
      'study',
      'spouse_partner',
      'humanitarian_or_protection',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.legislation.gov.au/F1996B03551/latest/text',
    verifiedOn: VERIFIED_ON,
    note:
      'Migration Regulations 1994 (Cth). Categories asserted are those visible in the text consulted: ' +
      'skilled (subclasses 189, 190, 489, 491), employer-sponsored (186, 187, 482, 494), temporary work ' +
      '(407, 417, 457, 462), Student (Temporary) (Class TU), partner and prospective marriage, protection ' +
      '(785, 790), and the Special Category visa (subclass 444) granted to New Zealand citizens. Parent, ' +
      'child, business-innovation-and-investment and retirement classes sit in Schedule 2 and were not ' +
      'visible in the excerpt retrieved, so they are not asserted here. No digital-nomad class was found.',
  },
  {
    code: jurisdictionCode('NZ'),
    name: { en: 'New Zealand', es: 'Nueva Zelanda' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['trans-tasman'],
    inbound: [
      'highly_skilled',
      'work_employed',
      'study',
      'spouse_partner',
      'humanitarian_or_protection',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.immigration.govt.nz/new-zealand-visas/visas/visa/australian-resident-visa',
    verifiedOn: VERIFIED_ON,
    note:
      'The Australian Resident Visa is granted at the border to Australian citizens and permanent residents ' +
      'and permits indefinite residence, work and study — the New Zealand side of the Trans-Tasman Travel ' +
      'Arrangement. Other categories verified across immigration.govt.nz/live/ and ' +
      'immigration.govt.nz/new-zealand-visas/explore-visa-options: skilled residence (Green List, Straight ' +
      'to Residence), Accredited Employer Work Visa, Fee Paying Student Visa, Post Study Work Visa, and ' +
      'refugee and asylum-seeker pathways. Partner-of-a-New-Zealander residence is confirmed by operational ' +
      'manual RV3.20. Residence ballots for some Pacific island countries are referenced in the same ' +
      'material but were not enumerated; parent and investor categories were not confirmed here.',
  },
  {
    code: jurisdictionCode('NF'),
    name: { en: 'Norfolk Island', es: 'Isla Norfolk' },
    region: 'oceania',
    autonomy: 'delegated',
    controlledBy: jurisdictionCode('AU'),
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.legislation.gov.au/Details/F2016L01117',
    verifiedOn: VERIFIED_ON,
    note:
      'Norfolk Island Legislation (Migration) Transitional Rule 2016 (Cth), whose provisions cover "visas ' +
      'taken to have been granted" and "immigration status of persons in Norfolk Island" — a Commonwealth ' +
      'instrument regulating migration on the island, which the island itself previously did under the ' +
      'Norfolk Island Immigration Act 1980. `inbound` is empty because the applicable categories are ' +
      "Australia's, listed on the AU entry, not a separate Norfolk Island set.",
  },
  {
    code: jurisdictionCode('CX'),
    name: { en: 'Christmas Island', es: 'Isla de Navidad' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched. Open question: an Australian external territory in the Indian Ocean, expected to be ' +
      "'delegated' to AU, but the Department of Infrastructure territories page timed out and no source was " +
      'read. Its status as an excised offshore place under the Migration Act 1958 also needs checking, ' +
      'because that changes what a person arriving there can apply for.',
  },
  {
    code: jurisdictionCode('CC'),
    name: { en: 'Cocos (Keeling) Islands', es: 'Islas Cocos (Keeling)' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note: 'Not researched. Same open question as CX, with which it is jointly administered.',
  },
  {
    code: jurisdictionCode('HM'),
    name: { en: 'Heard Island and McDonald Islands', es: 'Islas Heard y McDonald' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched. Listed because M49 lists it. An uninhabited Australian external territory with no ' +
      'resident population and, as far as is known, no migration route of any kind. Present for ' +
      'completeness of the enumeration; a consumer computing a coverage denominator over *destination ' +
      'systems* should almost certainly exclude it, and cannot do so unless it is here to be excluded.',
  },

  // ── Melanesia (M49 054) ──────────────────────────────────────────────────
  {
    code: jurisdictionCode('PG'),
    name: { en: 'Papua New Guinea', es: 'Papúa Nueva Guinea' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: ['work_employed', 'spouse_partner', 'family_reunification', 'naturalisation_by_residence'],
    outboundConstraints: [],
    sourceUrl: 'https://ica.gov.pg/uploads/media/post_file_3195072-visa-information-booklet-2025.pdf',
    verifiedOn: VERIFIED_ON,
    note:
      'Immigration and Citizenship Authority, Immigration and Entry Permit Handbook 2025; the governing ' +
      'statute is the Migration Act 1978. Verified: work visa required for private-sector employment, ' +
      'Restricted Employment Visa and Working Resident classes; Dependent Entry Permits for spouse, ' +
      'children and ageing parents, including de facto partners; Permanent Resident Entry Permit holders ' +
      'are recognised as a class; citizenship pathways for foreign nationals resident more than eight ' +
      'years, with dual citizenship accepted for eight prescribed countries. Student and investor classes ' +
      'exist on the ICA website but were not enumerated in the handbook consulted, so are not asserted.',
  },
  {
    code: jurisdictionCode('FJ'),
    name: { en: 'Fiji', es: 'Fiyi' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [
      'work_employed',
      'study',
      'family_reunification',
      'spouse_partner',
      'retirement_or_passive_income',
    ],
    outboundConstraints: [],
    sourceUrl: 'https://www.immigration.gov.fj/fiji-permits/',
    verifiedOn: VERIFIED_ON,
    note:
      'Ministry of Immigration permit list. Verified: Work Permit for skilled contracted workers and Short ' +
      'Term Work Permit; Student Permit and Internship/Training Attachment Permit; Co-Extensive Permit and ' +
      'Special Purpose Permit (family residence); exemption status for spouses and children of citizens; ' +
      'Residence Permit on Assured Income, which is the basis for the retirement_or_passive_income entry. ' +
      'An Investor Permit is offered through the ImmiHub portal but does not appear on the page consulted, ' +
      'so it is not asserted. The page did not name its governing Act.',
  },
  {
    code: jurisdictionCode('SB'),
    name: { en: 'Solomon Islands', es: 'Islas Salomón' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('VU'),
    name: { en: 'Vanuatu', es: 'Vanuatu' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('NC'),
    name: { en: 'New Caledonia', es: 'Nueva Caledonia' },
    region: 'oceania',
    autonomy: 'delegated',
    controlledBy: jurisdictionCode('FR'),
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000024389411/2026-02-21',
    verifiedOn: VERIFIED_ON,
    note:
      'Arrêté du 22 juillet 2011 setting the documents and visas required for foreigners entering New ' +
      'Caledonia, made under ordonnance n° 2002-388. Two facts matter to a corridor and both are verified: ' +
      'the entry regime is administered by French State authorities (consular posts, the border police, the ' +
      'High Commissioner), and it is a regime distinct from metropolitan France — the services of the State ' +
      "in New Caledonia state plainly that the rules differ. Schengen does not extend here, so `blocs` is " +
      "deliberately empty: tagging this entry 'schengen' or 'eu' would derive corridors that do not exist. " +
      'Long-stay categories were not enumerated in the sources retrieved, hence the empty `inbound`.',
  },

  // ── Micronesia (M49 057) ─────────────────────────────────────────────────
  {
    code: jurisdictionCode('FM'),
    name: { en: 'Micronesia (Federated States of)', es: 'Micronesia (Estados Federados de)' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cofa'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.doi.gov/oia/COFAinUS',
    verifiedOn: VERIFIED_ON,
    note:
      'US Department of the Interior, Office of Insular Affairs. Verified: the FSM is one of the three ' +
      'freely associated states, and its citizens "may be admitted to the United States and its territories ' +
      'and possessions as nonimmigrants to lawfully engage in occupations and establish residence for ' +
      "duration of stay\". This is the basis for `cofa`, and it is the FSM's most consequential migration " +
      "fact. The FSM's own inbound categories were not researched, hence the empty `inbound`.",
  },
  {
    code: jurisdictionCode('GU'),
    name: { en: 'Guam', es: 'Guam' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      "Not researched. Open question: Guam is expected to be 'delegated' to US, unlike American Samoa, " +
      'which is not. The Guam-CNMI Visa Waiver Program and the H-1B/H-2B cap exemption both appear to ' +
      'apply here; the CBP page setting them out returned 403 and no substitute was read.',
  },
  {
    code: jurisdictionCode('KI'),
    name: { en: 'Kiribati', es: 'Kiribati' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('MH'),
    name: { en: 'Marshall Islands', es: 'Islas Marshall' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cofa'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.doi.gov/oia/COFAinUS',
    verifiedOn: VERIFIED_ON,
    note:
      'US Department of the Interior, Office of Insular Affairs. Verified: the RMI is one of the three ' +
      'freely associated states, whose citizens may be admitted to the United States as nonimmigrants to ' +
      "work and establish residence for duration of stay. The RMI's own inbound categories were not " +
      'researched, hence the empty `inbound`.',
  },
  {
    code: jurisdictionCode('NR'),
    name: { en: 'Nauru', es: 'Nauru' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('MP'),
    name: { en: 'Northern Mariana Islands', es: 'Islas Marianas del Norte' },
    region: 'oceania',
    autonomy: 'delegated',
    controlledBy: jurisdictionCode('US'),
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.doi.gov/ocl/cnmi-visa-program',
    verifiedOn: VERIFIED_ON,
    note:
      'US Department of the Interior. Verified: the Consolidated Natural Resources Act of 2008 extended ' +
      'federal immigration law to the CNMI beginning in November 2009, ending the Commonwealth-run system ' +
      'that preceded it, and a CNMI-only transitional worker (CW) classification was created alongside it ' +
      'and has been extended more than once. So this is a jurisdiction that lost immigration autonomy ' +
      'within living memory — the reverse of the usual direction, and worth keeping visible.',
  },
  {
    code: jurisdictionCode('PW'),
    name: { en: 'Palau', es: 'Palaos' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cofa'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.doi.gov/oia/COFAinUS',
    verifiedOn: VERIFIED_ON,
    note:
      'US Department of the Interior, Office of Insular Affairs. Verified: Palau is one of the three freely ' +
      'associated states, whose citizens may be admitted to the United States as nonimmigrants to work and ' +
      "establish residence for duration of stay. Palau's compact is a separate instrument from the FSM and " +
      "RMI compacts. Palau's own inbound categories were not researched, hence the empty `inbound`.",
  },
  {
    code: jurisdictionCode('UM'),
    name: {
      en: 'United States Minor Outlying Islands',
      es: 'Islas Ultramarinas Menores de Estados Unidos',
    },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched. Listed because M49 lists it. An ISO/M49 aggregate of scattered US insular areas with ' +
      'no permanent civilian population and no migration route; note also that the aggregate spans two ' +
      'regions, since Navassa Island sits in the Caribbean. Present so a coverage denominator can exclude ' +
      'it explicitly rather than by omission.',
  },

  // ── Polynesia (M49 061) ──────────────────────────────────────────────────
  {
    code: jurisdictionCode('AS'),
    name: { en: 'American Samoa', es: 'Samoa Americana' },
    region: 'oceania',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: 'https://www.gao.gov/products/gao-10-638',
    verifiedOn: VERIFIED_ON,
    note:
      'US Government Accountability Office: "American Samoa is a U.S. insular area that operates its ' +
      'customs and immigration programs according to its own laws and independent of the United States." ' +
      'This is the sharpest case in the region of sovereignty and immigration control not coinciding: a US ' +
      'territory that is nonetheless outside the reach of the Immigration and Nationality Act and runs its ' +
      'own entry regime, administered locally rather than by USCIS or CBP. People born there are US ' +
      'nationals rather than US citizens. Its own entry categories were not enumerated, hence the empty ' +
      '`inbound`.',
  },
  {
    code: jurisdictionCode('CK'),
    name: { en: 'Cook Islands', es: 'Islas Cook' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched — the Ministry of Foreign Affairs and Immigration site (mfai.gov.ck) returned 403 and ' +
      'no official source was successfully read. Two things need establishing and neither is asserted here. ' +
      'First, the Cook Islands appears to administer its own entry permits and permanent residence under a ' +
      'Cook Islands Immigration Act 2021, which would make it `autonomous` despite being in free ' +
      'association with New Zealand rather than a state. Second, and more consequential for a corridor, ' +
      'Cook Islanders appear to hold New Zealand citizenship, which would give them residence and work in ' +
      'New Zealand — and, through it, Trans-Tasman rights in Australia. That second fact has no bloc id in ' +
      'the agreed list; `nz-realm` is proposed for it and must be reconciled with the bloc registry before ' +
      'either end can be encoded.',
  },
  {
    code: jurisdictionCode('PF'),
    name: { en: 'French Polynesia', es: 'Polinesia Francesa' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      "Not researched for this territory specifically. Expected to parallel NC — 'delegated' to FR under a " +
      'territory-specific entry regime outside Schengen, set by an arrêté of 29 December 2011 — but that ' +
      'instrument was not retrieved, and inferring one French collectivity from another is exactly the ' +
      'guess this atlas is meant not to make. If and when it is confirmed, `blocs` must stay empty of ' +
      "'schengen' and 'eu' for the reason given on NC.",
  },
  {
    code: jurisdictionCode('NU'),
    name: { en: 'Niue', es: 'Niue' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched. Same two open questions as CK: whether Niue administers its own entry regime while ' +
      'in free association with New Zealand, and whether Niueans hold New Zealand citizenship and so ' +
      'residence and work rights there. The second needs the proposed `nz-realm` bloc id.',
  },
  {
    code: jurisdictionCode('PN'),
    name: { en: 'Pitcairn Islands', es: 'Islas Pitcairn' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched. Open question: a British Overseas Territory with a resident population in the dozens ' +
      'that is understood to run its own immigration ordinance and settlement scheme, which would make it ' +
      "'autonomous' rather than 'delegated' to GB. Not verified against any source.",
  },
  {
    code: jurisdictionCode('WS'),
    name: { en: 'Samoa', es: 'Samoa' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('TK'),
    name: { en: 'Tokelau', es: 'Tokelau' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched. Distinct from CK and NU: Tokelau is a New Zealand territory rather than a state in ' +
      'free association, and is not self-governing in the same sense, so it may well be `delegated` to NZ. ' +
      'Tokelauans are understood to hold New Zealand citizenship and travel on New Zealand passports, ' +
      'which again is the corridor-relevant fact and again needs the proposed `nz-realm` bloc id. Neither ' +
      'point verified against a source.',
  },
  {
    code: jurisdictionCode('TO'),
    name: { en: 'Tonga', es: 'Tonga' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('TV'),
    name: { en: 'Tuvalu', es: 'Tuvalu' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: jurisdictionCode('WF'),
    name: { en: 'Wallis and Futuna', es: 'Wallis y Futuna' },
    region: 'oceania',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not researched for this territory specifically. Same expectation and same caution as PF: a French ' +
      'overseas collectivity with its own entry regime outside Schengen, governed by a dedicated chapter of ' +
      'the CESEDA, but no instrument was retrieved for it.',
  },
];
