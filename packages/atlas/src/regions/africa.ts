/**
 * Africa — jurisdiction registry.
 *
 * ## The list is the deliverable
 *
 * Sixty entries: the 54 UN member states in the region, Western Sahara, and the
 * five further territories the UN M49 geoscheme places in Africa — Mayotte,
 * Réunion, Saint Helena, the British Indian Ocean Territory and the French
 * Southern Territories. The list was cross-checked against the M49 composition
 * of region 002 rather than assembled from memory, because a jurisdiction
 * dropped here does not surface as an error: it silently shrinks the
 * denominator and inflates every coverage figure computed from this file.
 *
 * Two deliberate exclusions, recorded so they are decisions and not oversights:
 *
 * - **Ceuta and Melilla** are in Africa geographically and run a distinct border
 *   regime, but they are Spain. Neither has an ISO 3166-1 alpha-2 code, and
 *   minting one would break the invariant {@link jurisdictionCode} enforces.
 *   They belong to the `ES` entry in the Europe registry.
 * - **Somaliland** administers its own entry control — verified, see the note on
 *   `SO` — but has no ISO 3166-1 alpha-2 code. Recording it as a note on `SO` is
 *   preferable to inventing a code that would then propagate into corridor
 *   derivation as though it were standard.
 *
 * ## How to read a field on an entry here
 *
 * `researchStatus` is `'stub'` unless a source was actually fetched for that
 * specific jurisdiction, in which case `sourceUrl` and `verifiedOn` are set. No
 * entry is `'encoded'`: the Meridian catalog covers ES and CA, and nothing in
 * this region. No entry is `'counsel_reviewed'`; nothing anywhere is.
 *
 * **An empty `inbound` or `outboundConstraints` on a `'researched'` entry means
 * "no category was established from the cited source", not "none exist."** This
 * is stated once here rather than repeated sixty times, and it matters: read the
 * other way round, an empty array is a positive assertion that a country offers
 * no study route or imposes no exit control, which for most of these entries
 * would be a fabrication produced by silence.
 *
 * Most entries promoted to `'researched'` were promoted on verified *structural*
 * facts — that the jurisdiction runs its own system, and which mobility bloc it
 * belongs to — rather than on a full inventory of its routes. Promotion was
 * withheld where the only thing a source established was that the country
 * issues visas, since counting that as research would inflate the numerator
 * with no information.
 *
 * ## Bloc ids used
 *
 * `ecowas`, `eac`, and `cemac`. **`cemac` is not in the agreed bloc id list** and
 * must be reconciled with the bloc registry. It is needed because the CEMAC
 * visa-free zone is a real, in-force instrument covering six Middle African
 * states and has no other id.
 *
 * Three instruments were checked and deliberately **not** recorded as blocs,
 * because recording a bloc that confers nothing today would overstate mobility:
 *
 * - The **AU/AEC Protocol on Free Movement of Persons (2018)** is not in force —
 *   it is far short of the 15 ratifications it requires.
 * - The **SADC Protocol on Facilitation of Movement of Persons (2005)** was not
 *   established as in force.
 * - The **ECCAS** free-movement arrangements were not researched at all, which
 *   is why `AO` and `ST` carry no bloc.
 *
 * The distinction between ECOWAS/EAC and CEMAC is deliberate. ECOWAS and the EAC
 * Common Market Protocol confer residence and establishment, so their members
 * are `'autonomous_within_bloc'`. CEMAC confers visa-free *entry* only, which is
 * not a free-movement area, so its members are `'autonomous'` and carry the bloc
 * id without an `inbound: 'free_movement'`.
 */

import { jurisdictionCode, type Jurisdiction } from '../types.js';

const J = jurisdictionCode;

/**
 * Every `verifiedOn` in this file. Derived from the interface rather than
 * imported from `@meridian/core`, so this module depends on nothing but the
 * atlas contract it already imports.
 */
type VerifiedOn = NonNullable<Jurisdiction['verifiedOn']>;
const SWEEP = '2026-07-25' as VerifiedOn;

/** Sources fetched during this sweep. Every `sourceUrl` below is one of these. */
const SRC = {
  m49: 'https://unstats.un.org/unsd/methodology/m49/',
  ecowasWithdrawal:
    'https://www.ecowas.int/burkina-faso-mali-and-nigers-withdrawal-from-ecowas-is-now-a-reality/',
  eacOverview: 'https://www.eac.int/overview-of-eac',
  eacCommonMarket: 'https://www.eac.int/common-market',
  cemac: 'https://www.cameroontradehub.cm/article/59/en',
  zaHomeAffairs: 'https://www.dha.gov.za/index.php/immigration-services',
  ngImmigration: 'https://immigration.gov.ng/',
  ghImmigration: 'https://gis.gov.gh/',
  keForeignNationals: 'https://fns.immigration.go.ke/',
  rwMigration: 'https://www.migration.gov.rw/',
  shImmigration: 'https://www.sainthelena.gov.sh/portfolios/immigration/',
  taaf: 'https://taaf.fr/en/access-to-the-territories/',
  fcdoEritrea: 'https://www.gov.uk/foreign-travel-advice/eritrea/entry-requirements',
  fcdoSudan: 'https://www.gov.uk/foreign-travel-advice/sudan/entry-requirements',
  fcdoEthiopia: 'https://www.gov.uk/foreign-travel-advice/ethiopia/entry-requirements',
  fcdoSomalia: 'https://www.gov.uk/foreign-travel-advice/somalia/entry-requirements',
} as const;

/** Shared note for the twelve remaining ECOWAS member states. */
const ECOWAS_NOTE =
  'ECOWAS member. The ECOWAS protocols confer movement, residence and establishment ' +
  'without visas between member states; the cited ECOWAS statement restates that. ' +
  'Membership verified only — this jurisdiction’s own national permit categories ' +
  'were not researched.';

/** Shared note for Burkina Faso, Mali and Niger. */
const AES_NOTE =
  'Left ECOWAS with effect from 2025-01-29. No bloc is recorded because the state is ' +
  'no longer a member. ECOWAS states that citizens of the three withdrawing countries ' +
  'continue to enjoy the right of movement, residence and establishment without visas, ' +
  'and that ECOWAS-logo passports and identity cards remain valid for travel, "until ' +
  'further notice" pending a determination of future relations. That is a unilateral ' +
  'and revocable arrangement, not treaty membership, which is why it is a note rather ' +
  'than a bloc entry.';

/** Shared note for EAC partner states whose Common Market Protocol position is verified. */
const EAC_NOTE =
  'EAC partner state. The Common Market Protocol (in force 2010) provides free movement ' +
  'of persons (art. 7) and of workers (art. 10), with rights of residence and ' +
  'establishment, subject to public policy, security and health limits and excluding ' +
  'most public-service employment. Full implementation was targeted for December 2015 ' +
  'and has not been achieved, so the right is weaker in practice than on paper.';

/** Shared note for the three EAC partner states that acceded recently. */
const EAC_RECENT_NOTE =
  'EAC partner state. Bloc membership is verified, but whether and how far the Common ' +
  'Market Protocol applies to this state following its accession was NOT established, ' +
  'so no free-movement inbound category is asserted. EAC implementation is incomplete ' +
  'bloc-wide.';

/** Shared note for the six CEMAC member states. */
const CEMAC_NOTE =
  'CEMAC member. Since the zone took effect in 2017, nationals of the six CEMAC states ' +
  'travel between them without a visa on a biometric passport or national identity card. ' +
  'This is visa-free entry, NOT a right of residence or work, which is why no ' +
  'free-movement inbound category is recorded. National permit categories were not ' +
  'researched. Bloc id `cemac` is not in the agreed bloc id list and needs reconciling.';

export const AFRICA_JURISDICTIONS: readonly Jurisdiction[] = [
  // ── Northern Africa (M49 015) ──────────────────────────────────────────────
  {
    code: J('DZ'),
    name: { en: 'Algeria', es: 'Argelia' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('EG'),
    name: { en: 'Egypt', es: 'Egipto' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Left as a stub deliberately. Egypt is one of the largest systems in the region ' +
      'and a priority for the next pass, but the only source reached in this sweep ' +
      'established nothing beyond the existence of an entry-visa regime. Promoting it ' +
      'on that basis would add to the researched count without adding information. ' +
      'The travel restriction on conscription-age Egyptian males is widely reported ' +
      'and is NOT recorded here because no source for it was verified.',
  },
  {
    code: J('LY'),
    name: { en: 'Libya', es: 'Libia' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('MA'),
    name: { en: 'Morocco', es: 'Marruecos' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('SD'),
    name: { en: 'Sudan', es: 'Sudán' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.fcdoSudan,
    verifiedOn: SWEEP,
    note:
      'Departure is constrained, but not in a way this record can honestly express. ' +
      'The cited source states that a person who entered Sudan on a single-entry visa ' +
      'needs an exit visa to leave, though it is not always enforced, and that internal ' +
      'movement requires state-level travel permits — it does not establish an exit ' +
      'requirement on SUDANESE NATIONALS, which is what `outboundConstraints` models. ' +
      'The array is therefore left empty and the verified fact recorded here instead. ' +
      'Resolving this properly is a priority: Sudan is currently one of the largest ' +
      'displacement origins in the world.',
  },
  {
    code: J('TN'),
    name: { en: 'Tunisia', es: 'Túnez' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('EH'),
    name: { en: 'Western Sahara', es: 'Sáhara Occidental' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Listed because M49 lists it as a separate territory in Northern Africa. Its ' +
      'status is disputed and which authority exercises entry control over which part ' +
      'of the territory was not researched. `autonomy` is left `unknown` rather than ' +
      'guessed; a guess here would be a political claim wearing a data type.',
  },

  // ── Eastern Africa (M49 014) ───────────────────────────────────────────────
  {
    code: J('BI'),
    name: { en: 'Burundi', es: 'Burundi' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.eacCommonMarket,
    verifiedOn: SWEEP,
    note: `EAC partner state since 2007-07-01. ${EAC_NOTE}`,
  },
  {
    code: J('KM'),
    name: { en: 'Comoros', es: 'Comoras' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('DJ'),
    name: { en: 'Djibouti', es: 'Yibuti' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('ER'),
    name: { en: 'Eritrea', es: 'Eritrea' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: ['exit_permit_for_some_nationals'],
    sourceUrl: SRC.fcdoEritrea,
    verifiedOn: SWEEP,
    note:
      'The cited source states that dual nationals who enter Eritrea on an Eritrean ' +
      'identity card need an exit permit from the Immigration Office in Asmara to leave ' +
      'the country — an exit control falling on Eritrean nationals, which is why the ' +
      'constraint is recorded. The wider regime is almost certainly broader: the UK Home ' +
      'Office publishes a Country Policy and Information Note titled "national service ' +
      'and illegal exit, Eritrea" (last updated 2025-12-10), whose existence and title ' +
      'were verified but whose contents were not read. `military_service_hold` is ' +
      'therefore NOT asserted here, and reading that note is the obvious next step. For ' +
      'Eritreans the binding constraint is on the way out, so a destination-only view of ' +
      'this population would be useless.',
  },
  {
    code: J('ET'),
    name: { en: 'Ethiopia', es: 'Etiopía' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: ['work_employed', 'study'],
    outboundConstraints: [],
    sourceUrl: SRC.fcdoEthiopia,
    verifiedOn: SWEEP,
    note:
      'Runs its own visa regime with an official e-visa platform offering tourist, ' +
      'business, work and study visas; extensions of 30 or 90 days are handled in person ' +
      'by the Immigration and Citizenship Service in Addis Ababa. Residence-permit ' +
      'categories were not established — the cited source explicitly does not cover ' +
      'them, so the `inbound` list here is a floor, not an inventory. Ethiopia is a top ' +
      'origin and a major refugee host; it deserves a national-source pass.',
  },
  {
    code: J('KE'),
    name: { en: 'Kenya', es: 'Kenia' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: ['work_employed', 'naturalisation_by_residence', 'free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.keForeignNationals,
    verifiedOn: SWEEP,
    note:
      'The Foreign Nationals Services portal takes applications for an alien card, ' +
      'passes, permits, permanent residence and citizenship. The individual work-permit ' +
      'classes are not enumerated on the pages reached, so `work_employed` stands for ' +
      'the permit family as a whole and the study and dependant passes are not asserted ' +
      'even though the portal refers to passes generically. EAC partner state since ' +
      `2000-07-07. ${EAC_NOTE}`,
  },
  {
    code: J('MG'),
    name: { en: 'Madagascar', es: 'Madagascar' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('MW'),
    name: { en: 'Malawi', es: 'Malaui' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('MU'),
    name: { en: 'Mauritius', es: 'Mauricio' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('MZ'),
    name: { en: 'Mozambique', es: 'Mozambique' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('RW'),
    name: { en: 'Rwanda', es: 'Ruanda' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.rwMigration,
    verifiedOn: SWEEP,
    note:
      'The Directorate General of Immigration and Emigration lists visa on arrival, a ' +
      'visitors visa and a resident permit; the resident-permit classes were not ' +
      'established, so none are asserted. EAC partner state since 2007-07-01. ' +
      `${EAC_NOTE} Rwanda is also one of only four states to have ratified the AU ` +
      'Protocol on Free Movement of Persons, which is not in force.',
  },
  {
    code: J('SC'),
    name: { en: 'Seychelles', es: 'Seychelles' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('SO'),
    name: { en: 'Somalia', es: 'Somalia' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.fcdoSomalia,
    verifiedOn: SWEEP,
    note:
      'Sovereignty and immigration control come apart inside this code. The cited source ' +
      'states that a federal Somali eVisa "will not be considered valid for entry when ' +
      'you arrive in Hargeisa", and that travellers to Somaliland must instead buy a ' +
      'single-entry visa on arrival at Hargeisa International Airport. Somaliland ' +
      'therefore runs its own entry control, but has no ISO 3166-1 alpha-2 code, so it ' +
      'cannot be a separate entry without fabricating one. Any corridor derived against ' +
      '`SO` is a statement about the federal system only. EAC partner state since ' +
      `2024-03-04. ${EAC_RECENT_NOTE}`,
  },
  {
    code: J('SS'),
    name: { en: 'South Sudan', es: 'Sudán del Sur' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.eacOverview,
    verifiedOn: SWEEP,
    note: `EAC partner state since 2016-08-15. ${EAC_RECENT_NOTE}`,
  },
  {
    code: J('TZ'),
    name: { en: 'Tanzania', es: 'Tanzania' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.eacCommonMarket,
    verifiedOn: SWEEP,
    note:
      'EAC partner state since 2000-07-07 (founding). ' +
      `${EAC_NOTE} The national permit classes were not researched: the Immigration ` +
      'Services Department site was reached but served no substantive content. Zanzibar ' +
      'administers aspects of entry separately within the Union; that was not verified ' +
      'and is not modelled.',
  },
  {
    code: J('UG'),
    name: { en: 'Uganda', es: 'Uganda' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.eacCommonMarket,
    verifiedOn: SWEEP,
    note:
      'EAC partner state since 2000-07-07 (founding). ' +
      `${EAC_NOTE} National permit and pass categories were not researched — the ` +
      'Directorate of Citizenship and Immigration Control site refused automated ' +
      'requests. Uganda hosts one of the largest refugee populations in Africa, so its ' +
      'protection routes in particular are unrepresented here.',
  },
  {
    code: J('ZM'),
    name: { en: 'Zambia', es: 'Zambia' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('ZW'),
    name: { en: 'Zimbabwe', es: 'Zimbabue' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('YT'),
    name: { en: 'Mayotte', es: 'Mayotte' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'A French overseas department, and one of the places this atlas exists to get ' +
      'right: it is widely understood to sit outside the Schengen area and to apply ' +
      'French immigration law with territory-specific derogations, which would make it ' +
      '`delegated` to `FR` but NOT reachable on a Schengen visa. That could not be ' +
      'verified in this sweep — the French official source refused automated requests — ' +
      'so `autonomy` stays `unknown` rather than being set from recollection.',
  },
  {
    code: J('RE'),
    name: { en: 'Réunion', es: 'Reunión' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'A French overseas department. As with Mayotte, its Schengen position and the ' +
      'extent to which French immigration law applies unmodified could not be verified ' +
      'in this sweep, so `autonomy` is left `unknown`.',
  },
  {
    code: J('IO'),
    name: {
      en: 'British Indian Ocean Territory',
      es: 'Territorio Británico del Océano Índico',
    },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Listed because M49 places it in Eastern Africa and because a territory with a ' +
      'permit-based access regime is exactly the kind of entry that gets dropped from a ' +
      'list built from memory. No source was reachable in this sweep. It has no settled ' +
      'civilian population, so it will almost certainly warrant deliberate exclusion ' +
      'from any weighted coverage denominator — but that should be a recorded decision ' +
      'about a listed jurisdiction, not an omission.',
  },
  {
    code: J('TF'),
    name: {
      en: 'French Southern Territories',
      es: 'Tierras Australes y Antárticas Francesas',
    },
    region: 'africa',
    autonomy: 'delegated',
    controlledBy: J('FR'),
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.taaf,
    verifiedOn: SWEEP,
    note:
      'The cited source describes a "territory without permanent population nor elected ' +
      'officials", placed under the authority of a prefect who "exercises the entirety ' +
      'of public action". There is accordingly no residence route and no migration ' +
      'system in any ordinary sense; `inbound` is empty because there is genuinely ' +
      'nothing, which is the one place in this file where an empty array is an ' +
      'assertion. `delegated` to `FR` records that public authority is French; the ' +
      'mechanics of who issues access authorisation were not established. Include it in ' +
      'the list, exclude it from weighted coverage on purpose.',
  },

  // ── Middle Africa (M49 017) ────────────────────────────────────────────────
  {
    code: J('AO'),
    name: { en: 'Angola', es: 'Angola' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not a CEMAC member — it belongs to ECCAS, whose free-movement arrangements were ' +
      'not researched. The absence of a bloc here is unverified, not a finding.',
  },
  {
    code: J('CM'),
    name: { en: 'Cameroon', es: 'Camerún' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cemac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.cemac,
    verifiedOn: SWEEP,
    note: `${CEMAC_NOTE} Cameroon ratified first, conditional on reciprocity.`,
  },
  {
    code: J('CF'),
    name: { en: 'Central African Republic', es: 'República Centroafricana' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cemac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.cemac,
    verifiedOn: SWEEP,
    note: CEMAC_NOTE,
  },
  {
    code: J('TD'),
    name: { en: 'Chad', es: 'Chad' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cemac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.cemac,
    verifiedOn: SWEEP,
    note: CEMAC_NOTE,
  },
  {
    code: J('CG'),
    name: { en: 'Congo', es: 'Congo' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cemac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.cemac,
    verifiedOn: SWEEP,
    note: `${CEMAC_NOTE} Congo dropped the visa requirement by circular of 2017-10-23.`,
  },
  {
    code: J('CD'),
    name: {
      en: 'Democratic Republic of the Congo',
      es: 'República Democrática del Congo',
    },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['eac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.eacOverview,
    verifiedOn: SWEEP,
    note: `EAC partner state since 2022-07-11. ${EAC_RECENT_NOTE}`,
  },
  {
    code: J('GQ'),
    name: { en: 'Equatorial Guinea', es: 'Guinea Ecuatorial' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cemac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.cemac,
    verifiedOn: SWEEP,
    note:
      `${CEMAC_NOTE} Equatorial Guinea ratified the visa-free clause on 2017-10-19. ` +
      'Separately and importantly for the Europe registry: Spanish Civil Code art. 22.1 ' +
      'is generally understood to name Guinea Ecuatorial alongside Ibero-American ' +
      'countries, Andorra, the Philippines and Portugal for the reduced two-year ' +
      'naturalisation period. That could NOT be verified in this sweep, so the ' +
      '`ibero-american` bloc is not recorded here. If that bloc models the art. 22.1 ' +
      'list rather than Ibero-American Conference membership, GQ belongs in it and this ' +
      'entry needs updating — the only Spanish-speaking country in Africa is exactly the ' +
      'kind of corridor a bloc registry drops.',
  },
  {
    code: J('GA'),
    name: { en: 'Gabon', es: 'Gabón' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: ['cemac'],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.cemac,
    verifiedOn: SWEEP,
    note: `${CEMAC_NOTE} Gabon ratified the visa-free clause on 2017-10-06.`,
  },
  {
    code: J('ST'),
    name: { en: 'São Tomé and Príncipe', es: 'Santo Tomé y Príncipe' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Not a CEMAC member. One of only four states to have ratified the AU Protocol on ' +
      'Free Movement of Persons, which is not in force and therefore confers nothing.',
  },

  // ── Western Africa (M49 011) ───────────────────────────────────────────────
  {
    code: J('BJ'),
    name: { en: 'Benin', es: 'Benín' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('BF'),
    name: { en: 'Burkina Faso', es: 'Burkina Faso' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: AES_NOTE,
  },
  {
    code: J('CV'),
    name: { en: 'Cabo Verde', es: 'Cabo Verde' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('CI'),
    name: { en: "Côte d'Ivoire", es: 'Costa de Marfil' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note:
      `${ECOWAS_NOTE} Côte d’Ivoire is one of the largest immigrant-receiving ` +
      'states in West Africa, so the thinness of this entry understates how much work ' +
      'it represents.',
  },
  {
    code: J('GM'),
    name: { en: 'Gambia', es: 'Gambia' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('GH'),
    name: { en: 'Ghana', es: 'Ghana' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: [
      'work_employed',
      'investment_or_entrepreneur',
      'study',
      'family_reunification',
      'free_movement',
    ],
    outboundConstraints: [],
    sourceUrl: SRC.ghImmigration,
    verifiedOn: SWEEP,
    note:
      'The Ghana Immigration Service lists work and residence permits for companies, ' +
      'missionaries and NGOs, immigrant-quota and GIPC shareholder categories, students ' +
      'and dependants, plus visa and permit extensions. It also lists Right of Abode and ' +
      'Indefinite Residence Status, whose criteria were not established — in particular ' +
      'whether Right of Abode is descent-based — so `ancestry_or_descent` is NOT ' +
      'asserted. ECOWAS member.',
  },
  {
    code: J('GN'),
    name: { en: 'Guinea', es: 'Guinea' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('GW'),
    name: { en: 'Guinea-Bissau', es: 'Guinea-Bisáu' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('LR'),
    name: { en: 'Liberia', es: 'Liberia' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('ML'),
    name: { en: 'Mali', es: 'Malí' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note:
      `${AES_NOTE} Mali is also one of only four states to have ratified the AU ` +
      'Protocol on Free Movement of Persons, which is not in force.',
  },
  {
    code: J('MR'),
    name: { en: 'Mauritania', es: 'Mauritania' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    note:
      'Deliberately carries no ECOWAS bloc: Mauritania is not among the current member ' +
      'states. Its relationship with ECOWAS was not researched, so the absence is a ' +
      'non-finding rather than a verified exclusion.',
  },
  {
    code: J('NE'),
    name: { en: 'Niger', es: 'Níger' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note:
      `${AES_NOTE} Niger is also one of only four states to have ratified the AU ` +
      'Protocol on Free Movement of Persons, which is not in force.',
  },
  {
    code: J('NG'),
    name: { en: 'Nigeria', es: 'Nigeria' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['work_employed', 'study', 'free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ngImmigration,
    verifiedOn: SWEEP,
    note:
      'The Nigeria Immigration Service issues CERPAC — a combined residence permit and ' +
      'identity card for foreign nationals residing and working in Nigeria, typically ' +
      'valid up to one year and renewable — plus a Temporary Work Permit, and it issues ' +
      'the ECOWAS National Biometric Identity Card for movement within the region. Visa ' +
      'categories are described only as covering tourism, business and study, so no ' +
      'investment or family category is asserted. Landing and exit cards have been ' +
      'mandatory for all travellers since 2025-05-01; that is a recording requirement, ' +
      'not a departure restriction, so it is not an `outboundConstraint`.',
  },
  {
    code: J('SN'),
    name: { en: 'Senegal', es: 'Senegal' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('SL'),
    name: { en: 'Sierra Leone', es: 'Sierra Leona' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('TG'),
    name: { en: 'Togo', es: 'Togo' },
    region: 'africa',
    autonomy: 'autonomous_within_bloc',
    researchStatus: 'researched',
    blocs: ['ecowas'],
    inbound: ['free_movement'],
    outboundConstraints: [],
    sourceUrl: SRC.ecowasWithdrawal,
    verifiedOn: SWEEP,
    note: ECOWAS_NOTE,
  },
  {
    code: J('SH'),
    name: {
      en: 'Saint Helena, Ascension and Tristan da Cunha',
      es: 'Santa Elena, Ascensión y Tristán de Acuña',
    },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: ['work_employed', 'work_self_employed', 'investment_or_entrepreneur'],
    outboundConstraints: [],
    sourceUrl: SRC.shImmigration,
    verifiedOn: SWEEP,
    note:
      'A British Overseas Territory that legislates its own immigration control under ' +
      'the Immigration Ordinance 2011, as amended in 2018 — a clear case of immigration ' +
      'autonomy without sovereignty. Instruments include landing permission (up to 24 ' +
      'hours), short-term entry permits (up to 183 days), long-term entry permits, work ' +
      'permits with entrepreneur, self-employed and working-migrant variants, and a ' +
      'landholding licence; holders of St Helenian Status have entry rights. One further ' +
      'complication this single code hides: Ascension Island and Tristan da Cunha ' +
      'maintain separate requirements under their own laws, so `SH` is really three ' +
      'controls behind one ISO code.',
  },

  // ── Southern Africa (M49 018) ──────────────────────────────────────────────
  {
    code: J('BW'),
    name: { en: 'Botswana', es: 'Botsuana' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('SZ'),
    name: { en: 'Eswatini', es: 'Esuatini' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('LS'),
    name: { en: 'Lesotho', es: 'Lesoto' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('NA'),
    name: { en: 'Namibia', es: 'Namibia' },
    region: 'africa',
    autonomy: 'unknown',
    researchStatus: 'stub',
    blocs: [],
    inbound: [],
    outboundConstraints: [],
  },
  {
    code: J('ZA'),
    name: { en: 'South Africa', es: 'Sudáfrica' },
    region: 'africa',
    autonomy: 'autonomous',
    researchStatus: 'researched',
    blocs: [],
    inbound: [
      'work_employed',
      'highly_skilled',
      'intra_company_transfer',
      'investment_or_entrepreneur',
      'study',
      'family_reunification',
      'retirement_or_passive_income',
      'humanitarian_or_protection',
    ],
    outboundConstraints: [],
    sourceUrl: SRC.zaHomeAffairs,
    verifiedOn: SWEEP,
    note:
      'The largest destination system in the region, and the best-covered entry in this ' +
      'file. The Department of Home Affairs lists business, work, corporate, study, ' +
      'exchange, retired persons’, relative’s and medical treatment permits; ' +
      'the work visa splits into critical skills, general work, intra-company transfer, ' +
      'crew and treaty visas; permanent residence is administered separately, as are ' +
      'refugee and asylum papers. Crew and treaty visas and the exchange visa have no ' +
      'clean `InboundCategory` and are omitted rather than forced into one. No bloc is ' +
      'recorded: the SADC Protocol on Facilitation of Movement of Persons (2005) was ' +
      'not established as being in force, so recording a SADC bloc would assert mobility ' +
      'that does not exist.',
  },
];
