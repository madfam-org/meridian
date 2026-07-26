/**
 * Asia — the jurisdiction registry.
 *
 * ## What is in scope
 *
 * The list is the UN M49 "Asia" macro-region (Central, Eastern, South-eastern,
 * Southern and Western Asia), plus Taiwan, which M49 does not enumerate
 * separately but which runs its own immigration system and is therefore a
 * jurisdiction for this atlas's purposes.
 *
 * The list was cross-checked against the M49 enumeration rather than written
 * from memory, because memory drops small states and every dropped state
 * silently shrinks the denominator of every coverage number computed here.
 *
 * ## Boundary decisions, stated so they can be reconciled
 *
 * Four transcontinental states — Türkiye, Armenia, Azerbaijan and Georgia — sit
 * in M49 Western Asia but are Council of Europe members and are often filed
 * under Europe. They are included **here**. If `europe.ts` also lists them the
 * duplicate must be resolved by deleting one side; a duplicate is loud and
 * fixable, whereas a jurisdiction each file assumed the other owned would
 * vanish silently.
 *
 * Deliberately **not** here, because another region file owns them:
 *   - `CY` Cyprus — EU member state; Europe.
 *   - `RU` Russia — M49 Eastern Europe; Europe.
 *   - `EG` Egypt — M49 Northern Africa, despite the Sinai; Africa.
 *   - `IO` British Indian Ocean Territory — M49 Eastern Africa; Africa.
 *   - `CX` Christmas Island, `CC` Cocos (Keeling) Islands — M49 Oceania.
 *
 * Absent for a different reason: several de facto authorities in this region
 * administer entry to territory they control — Abkhazia, South Ossetia,
 * Northern Cyprus — but have no ISO 3166-1 alpha-2 code, and
 * {@link jurisdictionCode} accepts nothing else. The same applies to the UK
 * Sovereign Base Areas of Akrotiri and Dhekelia. They are omitted rather than
 * given an invented code.
 *
 * ## Sovereignty is not immigration control
 *
 * Hong Kong and Macau are the sharpest cases anywhere in the world: neither is
 * a state, both run immigration systems entirely separate from mainland
 * China's, and a mainland Chinese resident needs a permit to enter either.
 * Filing them under `CN` would misstate the denominator in one direction;
 * treating them as sovereign would misstate it in the other. `SystemAutonomy`
 * carries that distinction, which is why `CN` records an outbound constraint
 * that most readers would never think to look for.
 *
 * ## The Gulf caveat
 *
 * The GCC states run sponsorship-based systems (*kafala*) in which the
 * residence permit is held against a named sponsor rather than granted to the
 * person, and in which there is no general route from work to settlement to
 * naturalisation. {@link InboundCategory} was designed for permit systems that
 * lead somewhere. Rather than force a Gulf system into categories implying a
 * settlement path it does not offer, categories here are kept to what the
 * consulted source actually establishes and the shape of the system is stated
 * in `note`.
 *
 * ## Reading `researchStatus`
 *
 * Most entries are `stub`: listed because they exist, nothing verified. That is
 * the honest default and it is deliberately the majority state. `researched`
 * entries carry the `sourceUrl` that was actually retrieved on `verifiedOn` —
 * and only the facts that source established. Where a source covered one
 * programme and not the rest of the system, the note says so instead of the
 * entry quietly implying full coverage. Nothing here is `encoded`; the Meridian
 * catalog contains no Asian pathway today.
 */

import type { IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';

import {
  jurisdictionCode,
  type InboundCategory,
  type Jurisdiction,
  type OutboundConstraint,
  type SystemAutonomy,
} from '../types.js';

const VERIFIED_ON: IsoDate = isoDate('2026-07-25');

/**
 * A jurisdiction listed because it exists. Nothing about it has been verified,
 * and the absent `sourceUrl` is what says so. A `note` on a stub may carry an
 * explicitly-labelled research lead; it is not a claim.
 */
function stub(code: string, en: string, es: string, note?: string): Jurisdiction {
  return {
    code: jurisdictionCode(code),
    name: { en, es },
    region: 'asia',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note,
  };
}

interface ResearchedInput {
  readonly code: string;
  readonly en: string;
  readonly es: string;
  readonly autonomy: SystemAutonomy;
  readonly controlledBy?: string;
  readonly blocs?: readonly string[];
  readonly inbound?: readonly InboundCategory[];
  readonly outbound?: readonly OutboundConstraint[];
  /** Required, not optional: `researched` without a source actually consulted is a lie. */
  readonly sourceUrl: string;
  readonly note?: string;
}

function researched(input: ResearchedInput): Jurisdiction {
  return {
    code: jurisdictionCode(input.code),
    name: { en: input.en, es: input.es },
    region: 'asia',
    autonomy: input.autonomy,
    controlledBy:
      input.controlledBy === undefined ? undefined : jurisdictionCode(input.controlledBy),
    researchStatus: 'researched',
    blocs: input.blocs ?? [],
    inbound: input.inbound ?? [],
    outboundConstraints: input.outbound ?? [],
    sourceUrl: input.sourceUrl,
    verifiedOn: VERIFIED_ON,
    note: input.note,
  };
}

export const ASIA_JURISDICTIONS: readonly Jurisdiction[] = [
  // ─── Western Asia ────────────────────────────────────────────────────────

  researched({
    code: 'AE',
    en: 'United Arab Emirates',
    es: 'Emiratos Árabes Unidos',
    autonomy: 'autonomous',
    blocs: ['gcc'],
    inbound: [
      'work_employed',
      'study',
      'family_reunification',
      'investment_or_entrepreneur',
      'retirement_or_passive_income',
    ],
    sourceUrl: 'https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas',
    note:
      'The official portal enumerates residence visas for employment, study, family members, ' +
      'retirees and investors, plus the Golden, Green and Blue long-term visas and a jobseeker ' +
      'visit visa. It does not address sponsorship or naturalisation, so neither is encoded ' +
      'here: ordinary employment residence in the UAE is sponsor-linked, and that fact needs ' +
      'its own source before it is recorded.',
  }),
  researched({
    code: 'AM',
    en: 'Armenia',
    es: 'Armenia',
    autonomy: 'autonomous_within_bloc',
    blocs: ['eaeu'],
    inbound: ['free_movement'],
    sourceUrl: 'http://www.eaeunion.org/?lang=en',
    note:
      'Member of the Eurasian Economic Union, whose treaty provides for free movement of ' +
      'labour among member states. Only that membership and effect were verified; Armenia’s ' +
      'national permit categories for third-country nationals are unresearched. Filed under ' +
      'Asia per UN M49 Western Asia although Armenia is a Council of Europe member — ' +
      'reconcile against europe.ts.',
  }),
  stub(
    'AZ',
    'Azerbaijan',
    'Azerbaiyán',
    'Filed under Asia per UN M49 Western Asia although Azerbaijan is a Council of Europe ' +
      'member. Reconcile against europe.ts so it is listed exactly once.',
  ),
  stub(
    'BH',
    'Bahrain',
    'Baréin',
    'GCC state with a sponsorship-based system. Research lead, unverified: the Labour Market ' +
      'Regulatory Authority issues work permits and a flexible permit not tied to an employer. ' +
      'The LMRA site refused automated retrieval on 2026-07-25, so nothing is recorded.',
  ),
  stub(
    'GE',
    'Georgia',
    'Georgia',
    'Filed under Asia per UN M49 Western Asia although Georgia is a Council of Europe member. ' +
      'Reconcile against europe.ts so it is listed exactly once.',
  ),
  stub(
    'IL',
    'Israel',
    'Israel',
    'Research lead, unverified: the Law of Return is an ancestry-based route to citizenship, ' +
      'which would make Israel one of the few `ancestry_or_descent` systems in the region. ' +
      'gov.il and the Knesset English text both refused automated retrieval on 2026-07-25.',
  ),
  stub('IQ', 'Iraq', 'Irak'),
  stub('JO', 'Jordan', 'Jordania'),
  stub(
    'KW',
    'Kuwait',
    'Kuwait',
    'GCC state with a sponsorship-based system. The government portal refused automated ' +
      'retrieval on 2026-07-25; no categories recorded.',
  ),
  stub('LB', 'Lebanon', 'Líbano'),
  stub(
    'OM',
    'Oman',
    'Omán',
    'GCC state with a sponsorship-based system. The Royal Oman Police visa pages returned 404 ' +
      'on 2026-07-25; no categories recorded.',
  ),
  stub(
    'PS',
    'State of Palestine',
    'Estado de Palestina',
    'Autonomy is deliberately left `unknown` rather than guessed. Who controls entry to, exit ' +
      'from and residence in the West Bank and Gaza is both contested and split across ' +
      'authorities, and either answer — autonomous, or delegated to a neighbour — would ' +
      'misstate the denominator without a source establishing it.',
  ),
  researched({
    code: 'QA',
    en: 'Qatar',
    es: 'Catar',
    autonomy: 'autonomous',
    blocs: ['gcc'],
    sourceUrl:
      'https://portal.moi.gov.qa/wps/portal/MOIInternet/departmentcommittees/permanentresidency',
    note:
      'The Ministry of Interior page establishes only that Law No. 10 of 2018 on Permanent ' +
      'Residence exists and that a Permanent Residence Card Granting Committee decides ' +
      'eligibility. It does not enumerate the categories, so `inbound` is left empty rather ' +
      'than filled from secondary reporting. Ordinary residence in Qatar is sponsorship-based.',
  }),
  researched({
    code: 'SA',
    en: 'Saudi Arabia',
    es: 'Arabia Saudí',
    autonomy: 'autonomous',
    blocs: ['gcc'],
    inbound: ['highly_skilled', 'investment_or_entrepreneur'],
    sourceUrl:
      'https://misa.gov.sa/app/uploads/2024/11/' +
      '%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%A5%D9%82%D8%A7%D9%85%D8%A9-' +
      '%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9-%D9%84%D8%B9%D8%A7%D9%85-' +
      '1445%D9%87%D9%80-%D8%A7%D9%86%D8%AC%D9%84%D9%8A%D8%B2%D9%8A-.pdf',
    note:
      'The consulted source is the Premium Residency Law (Ministry of Investment, English ' +
      'text), which establishes premium residency for investors, entrepreneurs and specialist ' +
      'professionals and lets the holder sponsor themselves rather than depend on a Saudi ' +
      'employer or citizen sponsor. It covers that programme only. Ordinary employment ' +
      'residence (iqama) remains employer-sponsored and is NOT encoded here — it needs its ' +
      'own source. Saudi Arabia hosts one of the largest migrant populations in the world, so ' +
      'this entry is thinner than its weight warrants.',
  }),
  stub('SY', 'Syria', 'Siria'),
  researched({
    code: 'TR',
    en: 'Türkiye',
    es: 'Turquía',
    autonomy: 'autonomous',
    inbound: [
      'study',
      'family_reunification',
      'spouse_partner',
      'investment_or_entrepreneur',
      'humanitarian_or_protection',
    ],
    sourceUrl: 'https://en.goc.gov.tr/residence-permit-types',
    note:
      'The Presidency of Migration Management lists six permit types: short-term (covering ' +
      'property ownership, business, research, medical treatment and investment), family, ' +
      'student, long-term (issued indefinitely after eight continuous years of lawful ' +
      'residence), humanitarian, and a permit for victims of human trafficking. Work permits ' +
      'are issued separately by the Ministry of Labour and Social Security and are not on this ' +
      'page, so `work_employed` is not encoded. The temporary protection regime under which ' +
      'Türkiye hosts Syrians is a separate instrument, also not on this page. Filed under Asia ' +
      'per UN M49 Western Asia — reconcile against europe.ts.',
  }),
  stub('YE', 'Yemen', 'Yemen'),

  // ─── Central Asia ────────────────────────────────────────────────────────

  researched({
    code: 'KG',
    en: 'Kyrgyzstan',
    es: 'Kirguistán',
    autonomy: 'autonomous_within_bloc',
    blocs: ['eaeu'],
    inbound: ['free_movement'],
    sourceUrl: 'http://www.eaeunion.org/?lang=en',
    note:
      'Member of the Eurasian Economic Union, whose treaty provides for free movement of ' +
      'labour among member states — the arrangement under which large numbers of Kyrgyz ' +
      'nationals work in Russia and Kazakhstan. Only that membership and effect were verified; ' +
      'national permit categories for third-country nationals are unresearched.',
  }),
  researched({
    code: 'KZ',
    en: 'Kazakhstan',
    es: 'Kazajistán',
    autonomy: 'autonomous_within_bloc',
    blocs: ['eaeu'],
    inbound: ['free_movement'],
    sourceUrl: 'http://www.eaeunion.org/?lang=en',
    note:
      'Member of the Eurasian Economic Union, whose treaty provides for free movement of ' +
      'labour among member states. Only that membership and effect were verified; Kazakhstan ' +
      'also runs its own permit system for third-country nationals, which is unresearched.',
  }),
  stub('TJ', 'Tajikistan', 'Tayikistán'),
  researched({
    code: 'TM',
    en: 'Turkmenistan',
    es: 'Turkmenistán',
    autonomy: 'unknown',
    outbound: ['passport_issuance_restricted'],
    sourceUrl: 'https://www.hrw.org/world-report/2026/country-chapters/turkmenistan',
    note:
      'Researched for the outbound side only, which is why `autonomy` remains `unknown`: the ' +
      'consulted source establishes how Turkmen nationals are prevented from leaving, not how ' +
      'foreigners enter. Human Rights Watch documents refusal to renew passports through ' +
      'overseas consulates, forcing citizens to return home where travel bans may then be ' +
      'imposed, and arbitrary refusals to let people board international flights. This is ' +
      'administrative practice rather than a published exit-visa instrument, so no ' +
      '`exit_visa_required` is encoded. For a Turkmen national the binding constraint is on ' +
      'the way out, and a destination-only answer would be useless to them.',
  }),
  stub(
    'UZ',
    'Uzbekistan',
    'Uzbekistán',
    'Research lead, unverified: Uzbekistan operated a Soviet-era exit-visa (OVIR) sticker ' +
      'requirement, reported abolished from 2019-01-01. If confirmed, `outboundConstraints` ' +
      'is correctly empty and should be recorded as verified rather than merely absent.',
  ),

  // ─── Southern Asia ───────────────────────────────────────────────────────

  researched({
    code: 'AF',
    en: 'Afghanistan',
    es: 'Afganistán',
    autonomy: 'unknown',
    outbound: ['exit_permit_for_some_nationals'],
    sourceUrl: 'https://www.hrw.org/world-report/2026/country-chapters/afghanistan',
    note:
      'Researched for the outbound side only. The de facto authorities enforce a mahram (male ' +
      'guardian) requirement that restricts women’s movement and their access to transport, ' +
      'employment and health care. It is a de facto requirement rather than a published ' +
      'exit-visa instrument, and it falls on one class of national, which is why it is coded ' +
      'as a permit for some nationals rather than `exit_visa_required`. The consulted source ' +
      'did not address passport issuance, so nothing is recorded about it.',
  }),
  stub(
    'BD',
    'Bangladesh',
    'Bangladés',
    'Research lead, unverified: departure for overseas employment is understood to require ' +
      'clearance from the Bureau of Manpower, Employment and Training. Not confirmed against a ' +
      'retrievable official page on 2026-07-25, so no outbound constraint is recorded.',
  ),
  stub('BT', 'Bhutan', 'Bután'),
  researched({
    code: 'IN',
    en: 'India',
    es: 'India',
    autonomy: 'autonomous',
    outbound: ['exit_permit_for_some_nationals'],
    sourceUrl: 'https://www.mea.gov.in/emigration-clearance-system',
    note:
      'Researched for the outbound side, which for the world’s largest origin country is the ' +
      'side that binds. Holders of an ECR-endorsed (Emigration Check Required) passport must ' +
      'obtain clearance from a Protector of Emigrants before taking up employment in the ' +
      'notified ECR countries; the requirement attaches to employment, not to travel generally. ' +
      'The consulted page also states that women under 30 cannot obtain clearance for ECR ' +
      'countries. The number of notified countries is left out here because the sources ' +
      'consulted disagreed (17 on this page, 18 elsewhere) and a wrong count is worse than ' +
      'none. India’s inbound categories are unresearched.',
  }),
  stub('IR', 'Iran', 'Irán'),
  stub('LK', 'Sri Lanka', 'Sri Lanka'),
  stub('MV', 'Maldives', 'Maldivas'),
  stub(
    'NP',
    'Nepal',
    'Nepal',
    'Research lead, unverified, and high value: the Department of Foreign Employment is ' +
      'understood to require a labour approval before departure for foreign employment and to ' +
      'maintain a list of recognised destination countries. Separately, the 1950 India-Nepal ' +
      'Treaty of Peace and Friendship is understood to give nationals of each country ' +
      'reciprocal rights of residence and work in the other — which would be one of the few ' +
      'genuine free-movement arrangements in Asia. Neither was confirmed against a retrievable ' +
      'source on 2026-07-25, so neither is recorded.',
  ),
  stub('PK', 'Pakistan', 'Pakistán'),

  // ─── South-eastern Asia ──────────────────────────────────────────────────

  stub('BN', 'Brunei Darussalam', 'Brunéi Darusalam'),
  researched({
    code: 'ID',
    en: 'Indonesia',
    es: 'Indonesia',
    autonomy: 'autonomous',
    inbound: ['highly_skilled', 'investment_or_entrepreneur', 'retirement_or_passive_income'],
    sourceUrl: 'http://www.imigrasi.go.id/index?lang=en-US',
    note:
      'The Directorate General of Immigration operates limited stay permits (izin tinggal ' +
      'terbatas) and a Golden Visa with sub-categories for corporate and individual investors, ' +
      'global talent, second home, repatriated Indonesian citizens and investors in the new ' +
      'capital. Ordinary employment, family and student permits exist but were not enumerated ' +
      'on the consulted page, so they are not encoded.',
  }),
  stub('KH', 'Cambodia', 'Camboya'),
  stub('LA', "Lao People's Democratic Republic", 'República Democrática Popular Lao'),
  researched({
    code: 'MM',
    en: 'Myanmar',
    es: 'Myanmar',
    autonomy: 'unknown',
    outbound: ['military_service_hold'],
    sourceUrl:
      'https://myanmar-now.org/en/news/myanmar-junta-bans-conscription-age-men-from-leaving-country-for-work/',
    note:
      'Researched for the outbound side only. From 2024-05-01 the authorities stopped ' +
      'approving overseas-work permits for men of conscription age, following activation of ' +
      'the 2010 conscription law; those already approved were reported exempt. The source is ' +
      'press reporting of an administrative measure rather than a published instrument, and ' +
      'the position may have moved since — treat as needing re-verification before any ' +
      'output relies on it.',
  }),
  researched({
    code: 'MY',
    en: 'Malaysia',
    es: 'Malasia',
    autonomy: 'autonomous',
    inbound: [
      'work_employed',
      'study',
      'family_reunification',
      'retirement_or_passive_income',
    ],
    sourceUrl: 'https://www.imi.gov.my/index.php/en/main-services/visa/',
    note:
      'The Immigration Department lists the Employment Pass, Professional Visit Pass, ' +
      'Visitor’s Pass (Temporary Employment), Student Pass, Long Term Social Visit Pass, ' +
      'Residence Pass and Malaysia My Second Home. MM2H is a long-stay pass and is coded here ' +
      'as passive-income residence; it is not a settlement route.',
  }),
  stub('PH', 'Philippines', 'Filipinas',
    'Research lead, unverified, and high value: departing overseas Filipino workers are ' +
      'understood to require an Overseas Employment Certificate, and the government has ' +
      'imposed deployment bans on specific destinations — which would make this one of the ' +
      'clearest `destination_specific_ban` cases in the atlas. Not confirmed against a ' +
      'retrievable official page on 2026-07-25.',
  ),
  researched({
    code: 'SG',
    en: 'Singapore',
    es: 'Singapur',
    autonomy: 'autonomous',
    inbound: [
      'work_employed',
      'highly_skilled',
      'investment_or_entrepreneur',
      'family_reunification',
    ],
    sourceUrl: 'https://www.mom.gov.sg/passes-and-permits',
    note:
      'The Ministry of Manpower issues the Employment Pass, Personalised Employment Pass, ' +
      'Overseas Networks & Expertise Pass and EntrePass for professionals and founders; the ' +
      'S Pass and Work Permits for skilled and semi-skilled workers, including domestic ' +
      'workers; and the Dependant’s Pass and Long-Term Visit Pass for family. Permanent ' +
      'residence and citizenship are administered by the Immigration & Checkpoints Authority, ' +
      'not MOM, and were not on the consulted page, so no settlement category is encoded.',
  }),
  researched({
    code: 'TH',
    en: 'Thailand',
    es: 'Tailandia',
    autonomy: 'autonomous',
    inbound: [
      'highly_skilled',
      'digital_nomad',
      'investment_or_entrepreneur',
      'retirement_or_passive_income',
      'family_reunification',
    ],
    sourceUrl: 'https://ltr.boi.go.th/',
    note:
      'The consulted source covers the Long-Term Resident visa only, administered by the Board ' +
      'of Investment: highly-skilled professionals, work-from-Thailand professionals (coded ' +
      'here as digital nomad), wealthy global citizens, wealthy pensioners, and dependants. ' +
      'Thailand’s ordinary non-immigrant visa classes are issued by other bodies and are not ' +
      'encoded here.',
  }),
  stub('TL', 'Timor-Leste', 'Timor-Leste'),
  stub('VN', 'Viet Nam', 'Vietnam'),

  // ─── Eastern Asia ────────────────────────────────────────────────────────

  researched({
    code: 'CN',
    en: 'China',
    es: 'China',
    autonomy: 'autonomous',
    outbound: ['exit_permit_for_some_nationals'],
    sourceUrl: 'https://en.nia.gov.cn/',
    note:
      'The National Immigration Administration administers entry and exit under the Exit and ' +
      'Entry Administration Law and the Regulations on Administration of the Entry and Exit of ' +
      'Foreigners; the consulted page does not enumerate visa or residence-permit categories, ' +
      'so `inbound` is left empty. The outbound constraint is the one a destination-only view ' +
      'would miss entirely: a mainland-registered Chinese national needs a Permit for ' +
      'Proceeding to Hong Kong and Macao to enter either SAR, per ' +
      'https://www.gov.mo/en/services/ps-1480/. Hong Kong and Macau residents, who are also ' +
      'Chinese nationals, are not subject to it — hence "some nationals". `CN` covers the ' +
      'mainland only: `HK`, `MO` and `TW` are separate entries because they are separate ' +
      'systems.',
  }),
  researched({
    code: 'HK',
    en: 'Hong Kong SAR, China',
    es: 'RAE de Hong Kong, China',
    autonomy: 'autonomous',
    inbound: [
      'work_employed',
      'highly_skilled',
      'study',
      'family_reunification',
      'investment_or_entrepreneur',
    ],
    sourceUrl: 'https://www.immd.gov.hk/eng/services/index.html',
    note:
      'Not a state, but `autonomous`: the Immigration Department runs a system entirely ' +
      'separate from the mainland’s. It operates the General Employment Policy and the ' +
      'Admission Scheme for Mainland Talents and Professionals (employment), the Top Talent ' +
      'Pass, Quality Migrant Admission and Technology Talent Admission schemes (talent), the ' +
      'New Capital Investment Entrant Scheme and entry as entrepreneurs (investment), plus ' +
      'student, dependant, training, working-holiday, foreign domestic helper and imported ' +
      'worker routes. It states that a person without the right of abode or right to land ' +
      'needs a visa or entry permit to work, study, do business or reside. Persons admitted ' +
      'under those schemes may apply for the right of abode after not less than seven years’ ' +
      'continuous ordinary residence. Note that the mainland has its own admission scheme ' +
      'here, which is the clearest possible evidence the two systems are distinct.',
  }),
  researched({
    code: 'JP',
    en: 'Japan',
    es: 'Japón',
    autonomy: 'autonomous',
    inbound: [
      'work_employed',
      'highly_skilled',
      'intra_company_transfer',
      'investment_or_entrepreneur',
      'study',
      'spouse_partner',
    ],
    sourceUrl: 'https://www.moj.go.jp/isa/applications/status/index.html',
    note:
      'The Immigration Services Agency grants statuses of residence including High-level ' +
      'Professional, Business Manager, Intra-company Transferee, Specified Skilled Worker, ' +
      'Technical Intern Training, Skilled Labor, Student, Spouse or Child of Japanese ' +
      'National, Long-term Resident and Permanent Resident. Permanent Resident and Long-term ' +
      'Resident are settlement statuses with no matching InboundCategory, so they are recorded ' +
      'here rather than mapped to `naturalisation_by_residence`, which means something else.',
  }),
  stub(
    'KP',
    "Democratic People's Republic of Korea",
    'República Popular Democrática de Corea',
    'Expected to carry outbound constraints rather than inbound categories, but nothing is ' +
      'recorded because no source was consulted. Left `unknown` rather than assumed.',
  ),
  researched({
    code: 'KR',
    en: 'Republic of Korea',
    es: 'República de Corea',
    autonomy: 'autonomous',
    inbound: [
      'work_employed',
      'study',
      'spouse_partner',
      'ancestry_or_descent',
      'investment_or_entrepreneur',
    ],
    sourceUrl: 'https://www.immigration.go.kr/immigration_eng/index.do',
    note:
      'The Korea Immigration Service, under the Ministry of Justice, administers the D-series ' +
      '(study), E-series (employment), F-2 (residence), F-4 (overseas Koreans, coded here as ' +
      'ancestry or descent), F-5 (permanent residence), F-6 (marriage) and D-8 (investment) ' +
      'statuses. The consulted page references nationality and naturalisation resources ' +
      'without describing the route, so `naturalisation_by_residence` is not encoded.',
  }),
  researched({
    code: 'MO',
    en: 'Macao SAR, China',
    es: 'RAE de Macao, China',
    autonomy: 'autonomous',
    inbound: ['investment_or_entrepreneur'],
    sourceUrl: 'https://www.gov.mo/en/services/ps-1480/',
    note:
      'Not a state, but `autonomous`: residence authorisation is granted under Law No. 16/2021 ' +
      'and Administrative Regulation No. 38/2021, examined by the Public Security Police Force, ' +
      'with the Commerce and Investment Promotion Institute handling investor, executive and ' +
      'skilled-worker applications. Mainland Chinese residents enter holding a Permit for ' +
      'Proceeding to Hong Kong and Macao — the same instrument that makes `CN` an entry with ' +
      'an outbound constraint. The consulted page does not give the qualifying period for ' +
      'permanent residence, so it is not recorded.',
  }),
  stub('MN', 'Mongolia', 'Mongolia'),
  researched({
    code: 'TW',
    en: 'Taiwan',
    es: 'Taiwán',
    autonomy: 'autonomous',
    inbound: ['highly_skilled'],
    sourceUrl: 'https://goldcard.nat.gov.tw/en/about/',
    note:
      'Runs an immigration system entirely separate from the People’s Republic of China and ' +
      'is listed as its own jurisdiction for that reason; UN M49 does not enumerate it ' +
      'separately, so it would be missing from a registry built only from M49. The Employment ' +
      'Gold Card, overseen by the National Development Council, combines an open work permit, ' +
      'resident visa, Alien Resident Certificate and re-entry permit, and holders may apply ' +
      'for permanent residence (APRC) after three years of residence, reduced by up to two ' +
      'years for holders of Taiwanese doctorates. Other residence classes are unresearched.',
  }),
];
