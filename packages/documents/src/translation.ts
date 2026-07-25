/**
 * Translation: whether the receiving authority can read the document, and who
 * is allowed to have made it readable.
 *
 * Two separate questions live here and they are routinely conflated:
 *
 *   1. **Is a translation needed at all?** That turns on the language the
 *      document is written in versus the languages the receiving authority
 *      accepts — which is not the same as "the languages spoken in the
 *      receiving country".
 *   2. **Who may produce it?** Every jurisdiction Meridian covers answers this
 *      differently, and the differences are expensive. Spain will only accept a
 *      translation made by a *traductor-intérprete jurado* appointed by the
 *      Ministry of Foreign Affairs; the United States will accept a translation
 *      by anyone competent, provided they certify it themselves. An applicant
 *      told the wrong one either pays several times the necessary price or has
 *      the file refused.
 *
 * On Spain specifically: this module does not assume Castilian. Art. 3 of the
 * Constitution makes Castilian the official language of the State and makes the
 * other Spanish languages official in their Autonomous Communities under their
 * respective Statutes. A model that treats `es` as "the language of Spain"
 * silently asserts that a Galician civil-registry extract is a foreign-language
 * document, which is both wrong and, to the applicant, insulting.
 *
 * What is *not* modelled here, deliberately: whether the receiving authority
 * will accept a translation produced abroad by a translator sworn in another
 * state. That varies by post and by officer, and inventing a rule for it would
 * be worse than the silence.
 */

import type { Citation, CountryCode, IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';
import type { LanguageTag } from './language.js';
import { BASQUE, CASTILIAN, CATALAN, ENGLISH, FRENCH, GALICIAN, OCCITAN, languageAccepted } from './language.js';
import { EU_2016_1191_COVERED_KINDS, isEuMemberState } from './legalisation.js';
import type { DocumentKind, DocumentTranslation } from './model.js';

/**
 * The standard of translator a receiving jurisdiction demands.
 *
 * These are not interchangeable tiers — they are different institutions. A
 * Canadian certified translator is a member of a professional association; a
 * Spanish *traductor jurado* holds a title conferred by a ministry; a Mexican
 * *perito traductor* is authorised by a court. None of them substitutes for
 * another, and a translation is not "more certified" for having been done by
 * two of them.
 */
export type TranslatorStandard =
  /** No translation is required at all. */
  | 'none'
  /** Spain: a *traductor-intérprete jurado* appointed by the MAEC, with seal and certification. */
  | 'sworn_traductor_jurado'
  /** Canada: a translator certified and in good standing with a provincial or territorial association. */
  | 'certified_translator'
  /** Canada: a non-certified translator, plus an affidavit sworn before a person authorised to administer oaths. */
  | 'affidavit_translation'
  /** Mexico: a *perito traductor* authorised by a federal or state judicial council. */
  | 'perito_traductor'
  /** United States: the translator's own certification of completeness, accuracy and competence. */
  | 'translator_certification'
  /** The receiving jurisdiction is outside the catalog. Nothing may be assumed. */
  | 'unknown';

const D = (value: string): IsoDate => isoDate(value);
const VERIFIED_ON: IsoDate = D('2026-07-25');

export const CITATION_ES_CONSTITUTION_ART_3: Citation = {
  id: 'es-const-1978-art-3',
  kind: 'treaty',
  instrument: 'Constitución Española (1978)',
  provision: 'art. 3',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 3.1 makes Castilian the official Spanish language of the State, which all Spaniards have the duty to know and the right to use. Art. 3.2 makes the other Spanish languages likewise official in their respective Autonomous Communities in accordance with their Statutes. Which of them a particular organ accepts therefore depends on the Statute of the Community in which that organ sits.',
};

export const CITATION_ES_LEY_39_2015_ART_15: Citation = {
  id: 'es-ley-39-2015-art-15',
  kind: 'statute',
  instrument:
    'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
  provision: 'art. 15 (Lengua de los procedimientos)',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The language of procedure before the General State Administration is Castilian. An interested party may nevertheless use the co-official language of the Autonomous Community in which the organ is located. Where a document in a co-official language must produce effects outside that Community, it is translated into Castilian. Immigration procedures are State-administration procedures, so this article — not the Community\'s own rules — governs them.',
};

export const CITATION_ES_RD_557_2011_TRANSLATION: Citation = {
  id: 'es-rd-557-2011-translation',
  kind: 'regulation',
  instrument:
    'Real Decreto 557/2011, de 20 de abril, Reglamento de la Ley Orgánica 4/2000 sobre derechos y libertades de los extranjeros en España',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The Reglamento requires documents drawn up in a foreign language and submitted in support of an immigration application to be accompanied by a translation into Castilian or into the co-official language of the territory where the application is lodged. The specific article has deliberately not been pinned here: the consolidated text has been amended repeatedly and counsel must confirm the current provision and its scope before this requirement is relied on.',
};

export const CITATION_ES_TRADUCTOR_JURADO: Citation = {
  id: 'es-rd-724-2020-traductor-jurado',
  kind: 'regulation',
  instrument:
    'Real Decreto 724/2020, de 4 de agosto, por el que se aprueba el Reglamento de la Oficina de Interpretación de Lenguas del Ministerio de Asuntos Exteriores, Unión Europea y Cooperación',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The title of Traductor-Intérprete Jurado is conferred by the MAEC, which maintains and publishes the official register of appointees by language pair. A translation is "sworn" only if the person who made it appears in that register for the relevant pair, and it must carry that person\'s certification, signature and seal. Confirm both the current regulation reference and the individual translator\'s register entry — an unregistered translator\'s work is not a sworn translation however it is styled.',
};

export const CITATION_CA_OFFICIAL_LANGUAGES_ACT: Citation = {
  id: 'ca-official-languages-act-s16',
  kind: 'statute',
  instrument: 'Official Languages Act (R.S.C., 1985, c. 31 (4th Supp.))',
  url: 'https://laws-lois.justice.gc.ca/eng/acts/O-3.01/',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'English and French have equality of status and equal rights and privileges as to their use in all federal institutions. An application to a federal immigration authority may be made, and supporting documents supplied, in either.',
};

export const CITATION_CA_IRCC_TRANSLATION: Citation = {
  id: 'ca-ircc-translation-instructions',
  kind: 'official_guidance',
  instrument:
    'Immigration, Refugees and Citizenship Canada — application instructions on the translation of supporting documents',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Departmental instruction, not statute. IRCC requires a supporting document that is not in English or French to be accompanied by a translation, together with either the certification of a translator certified and in good standing with a provincial or territorial translators\' association, or an affidavit sworn by the translator before a person authorised to administer oaths. A translation made by the applicant, by a member of their family, or by their representative is not accepted. Instructions of this kind are set administratively and change without notice; check the current instruction for the specific application before relying on this.',
};

export const CITATION_MX_PERITO_TRADUCTOR: Citation = {
  id: 'mx-perito-traductor-practice',
  kind: 'official_guidance',
  instrument:
    'Mexican federal administrative practice on foreign-language documents in migration procedures',
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Administrative practice rather than a bright-line statutory threshold. A document in a foreign language submitted in a Mexican migration procedure is required to be accompanied by a translation produced by a perito traductor authorised by the Consejo de la Judicatura Federal or by the judicial council of a state. The requirement is applied consistently across federal procedures, but the governing provision for any particular trámite has not been pinned here and counsel must confirm it.',
};

export const CITATION_MX_LANGUAGE: Citation = {
  id: 'mx-lgdlpi-2003',
  kind: 'statute',
  instrument: 'Ley General de Derechos Lingüísticos de los Pueblos Indígenas (2003)',
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Mexico does not designate a single official language by constitutional provision. This Law declares the indigenous languages, together with Spanish, to be national languages with the same validity in their territories. Federal migration procedures are nevertheless conducted in Spanish in practice, and this entry records Spanish as the accepted procedural language on that basis; any claim to conduct a procedure in another national language is a matter for counsel, not for this table.',
};

export const CITATION_US_8CFR_103_2: Citation = {
  id: 'us-8cfr-103-2-b-3',
  kind: 'regulation',
  instrument: 'Title 8, Code of Federal Regulations, § 103.2(b)(3)',
  provision: '§ 103.2(b)(3)',
  url: 'https://www.ecfr.gov/current/title-8/section-103.2',
  jurisdiction: 'US',
  verifiedOn: VERIFIED_ON,
  note:
    'Any document containing a foreign language submitted to USCIS must be accompanied by a full English translation which the translator has certified as complete and accurate, together with the translator\'s certification that they are competent to translate from that language into English. The regulation does not require an association-certified or court-appointed translator — the certification is the translator\'s own. Consular processing before the Department of State is governed by its own instructions, not by this regulation.',
};

/**
 * A territory within a state where an additional language is official.
 *
 * Modelled as a zone rather than as a property of the country because that is
 * how the law actually works: Basque is co-official in the País Vasco by the
 * Statute of Gernika, and in Navarre only within the zone the Ley Foral defines.
 * Flattening that to "Basque is official in Spain" would be wrong twice over.
 */
export interface CoOfficialZone {
  /** ISO 3166-2 code of the sub-national unit, e.g. `ES-CT`. */
  readonly regionCode: string;
  readonly regionName: string;
  readonly languages: readonly LanguageTag[];
  /**
   * True when the language is official only in part of the unit, so a document
   * in that language cannot be assumed acceptable across the whole region.
   */
  readonly territoriallyLimited: boolean;
  readonly citation: Citation;
}

const statuteCitation = (id: string, instrument: string, note: string): Citation => ({
  id,
  kind: 'statute',
  instrument,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note,
});

/**
 * Spain's co-official language zones.
 *
 * Each entry cites the Statute of Autonomy that makes the language official.
 * The article number is deliberately not pinned on any of them: the Statutes
 * have been amended and, in Catalonia's case, partly struck down by the
 * Constitutional Court, and a confidently wrong article reference is worse than
 * an honest gap. All are marked `discretionary` so consumers surface the caveat
 * rather than presenting the entry as a settled provision.
 */
export const SPAIN_CO_OFFICIAL_ZONES: readonly CoOfficialZone[] = [
  {
    regionCode: 'ES-CT',
    regionName: 'Cataluña / Catalunya',
    languages: [CATALAN, OCCITAN],
    territoriallyLimited: false,
    citation: statuteCitation(
      'es-lo-6-2006-catalunya',
      'Ley Orgánica 6/2006, de 19 de julio, de reforma del Estatuto de Autonomía de Cataluña',
      'Catalan is official in Catalonia alongside Castilian. Occitan, in its Aranese variety, is likewise official — Aran is the only territory in Spain where Occitan holds that status, and a document in Occitan presented elsewhere is a foreign-language document. Confirm the current consolidated language provisions before relying on this entry.',
    ),
  },
  {
    regionCode: 'ES-VC',
    regionName: 'Comunitat Valenciana',
    languages: [CATALAN],
    territoriallyLimited: false,
    citation: statuteCitation(
      'es-lo-5-1982-valenciana',
      'Ley Orgánica 5/1982, de 1 de julio, de Estatuto de Autonomía de la Comunidad Valenciana',
      'The co-official language is denominated valencià in the Statute. It is recorded here under the tag `ca` because ISO 639 and BCP 47 treat Valencian as a variety of Catalan (`ca-valencia`); that is a coding decision for translation routing and takes no position on the denomination question. Confirm the current consolidated language provisions before relying on this entry.',
    ),
  },
  {
    regionCode: 'ES-IB',
    regionName: 'Illes Balears',
    languages: [CATALAN],
    territoriallyLimited: false,
    citation: statuteCitation(
      'es-lo-2-1983-illes-balears',
      'Ley Orgánica 2/1983, de 25 de febrero, de Estatuto de Autonomía de las Illes Balears',
      'Catalan, in its Balearic varieties, is official alongside Castilian. Confirm the current consolidated language provisions before relying on this entry.',
    ),
  },
  {
    regionCode: 'ES-GA',
    regionName: 'Galicia',
    languages: [GALICIAN],
    territoriallyLimited: false,
    citation: statuteCitation(
      'es-lo-1-1981-galicia',
      'Ley Orgánica 1/1981, de 6 de abril, de Estatuto de Autonomía para Galicia',
      'Galician is the lingua propia of Galicia and official there alongside Castilian. Confirm the current consolidated language provisions before relying on this entry.',
    ),
  },
  {
    regionCode: 'ES-PV',
    regionName: 'País Vasco / Euskadi',
    languages: [BASQUE],
    territoriallyLimited: false,
    citation: statuteCitation(
      'es-lo-3-1979-pais-vasco',
      'Ley Orgánica 3/1979, de 18 de diciembre, de Estatuto de Autonomía para el País Vasco',
      'Basque (euskara) is official throughout the País Vasco alongside Castilian. Confirm the current consolidated language provisions before relying on this entry.',
    ),
  },
  {
    regionCode: 'ES-NC',
    regionName: 'Comunidad Foral de Navarra',
    languages: [BASQUE],
    territoriallyLimited: true,
    citation: statuteCitation(
      'es-navarra-vascuence',
      'Ley Orgánica 13/1982, de reintegración y amejoramiento del Régimen Foral de Navarra, and Ley Foral 18/1986, del Vascuence',
      'Basque is NOT co-official across the whole of Navarre. The Ley Foral divides the territory into zones and Basque holds co-official status only in the Basque-speaking zone; elsewhere its use carries lesser effects that have been altered by later reform. A document in Basque presented to a State organ in Navarre must not be assumed acceptable on the strength of the region code alone — establish which municipality the organ sits in. Zoning and its consequences must be confirmed with counsel.',
    ),
  },
];

export function coOfficialZone(regionCode: string): CoOfficialZone | null {
  const target = regionCode.trim().toUpperCase();
  return SPAIN_CO_OFFICIAL_ZONES.find((z) => z.regionCode === target) ?? null;
}

/** What a receiving jurisdiction accepts, and from whom. */
export interface TranslationProfile {
  readonly country: CountryCode;
  /** Languages the state's own administration accepts without translation. */
  readonly stateLanguages: readonly LanguageTag[];
  /** Any one of these standards satisfies the requirement. */
  readonly acceptedStandards: readonly TranslatorStandard[];
  readonly citations: readonly Citation[];
  /** Sub-national zones with an additional official language. */
  readonly coOfficialZones: readonly CoOfficialZone[];
}

/**
 * Receiving jurisdictions the catalog covers.
 *
 * Four entries, matching the countries `@meridian/core` records apostille
 * status for. Anything else returns an explicitly unknown requirement rather
 * than being routed through a plausible-looking default.
 */
export const TRANSLATION_PROFILES: readonly TranslationProfile[] = [
  {
    country: 'ES' as CountryCode,
    stateLanguages: [CASTILIAN],
    acceptedStandards: ['sworn_traductor_jurado'],
    citations: [
      CITATION_ES_CONSTITUTION_ART_3,
      CITATION_ES_LEY_39_2015_ART_15,
      CITATION_ES_RD_557_2011_TRANSLATION,
      CITATION_ES_TRADUCTOR_JURADO,
    ],
    coOfficialZones: SPAIN_CO_OFFICIAL_ZONES,
  },
  {
    country: 'CA' as CountryCode,
    stateLanguages: [ENGLISH, FRENCH],
    acceptedStandards: ['certified_translator', 'affidavit_translation'],
    citations: [CITATION_CA_OFFICIAL_LANGUAGES_ACT, CITATION_CA_IRCC_TRANSLATION],
    coOfficialZones: [],
  },
  {
    country: 'MX' as CountryCode,
    stateLanguages: [CASTILIAN],
    acceptedStandards: ['perito_traductor'],
    citations: [CITATION_MX_LANGUAGE, CITATION_MX_PERITO_TRADUCTOR],
    coOfficialZones: [],
  },
  {
    country: 'US' as CountryCode,
    stateLanguages: [ENGLISH],
    acceptedStandards: ['translator_certification'],
    citations: [CITATION_US_8CFR_103_2],
    coOfficialZones: [],
  },
];

export function translationProfile(country: CountryCode): TranslationProfile | null {
  const target = country.toUpperCase() as CountryCode;
  return TRANSLATION_PROFILES.find((p) => p.country === target) ?? null;
}

export interface TranslationQuery {
  readonly documentKind: DocumentKind;
  /** The language the document is actually written in. There is no safe default. */
  readonly documentLanguage: LanguageTag;
  readonly receivingCountry: CountryCode;
  /**
   * ISO 3166-2 code of the sub-national unit whose organ will receive the file,
   * when it is known. Supplying it is what makes a co-official language
   * acceptable; omitting it falls back to the State language only, which is the
   * conservative answer.
   */
  readonly receivingRegion?: string;
  /**
   * Where the document was issued. Optional, and used only to note the
   * multilingual standard forms available under Regulation (EU) 2016/1191.
   */
  readonly issuingCountry?: CountryCode;
}

export interface TranslationRequirement {
  readonly required: boolean;
  readonly documentKind: DocumentKind;
  readonly sourceLanguage: LanguageTag;
  readonly receivingCountry: CountryCode;
  /** Translating into any one of these satisfies the language requirement. */
  readonly acceptedLanguages: readonly LanguageTag[];
  /** Any one of these standards satisfies the translator requirement. */
  readonly acceptedStandards: readonly TranslatorStandard[];
  readonly rationale: string;
  readonly citations: readonly Citation[];
  readonly requiresVerification: boolean;
}

/**
 * Decide whether the document must be translated, and to what standard.
 *
 * The conservative default runs through every branch. An unrecognised receiving
 * country produces `required: true` with an `'unknown'` standard rather than
 * `required: false`: telling somebody no translation is needed when one is
 * costs them the appointment, whereas telling them to check costs an email.
 */
export function translationRequirement(query: TranslationQuery): TranslationRequirement {
  const receiving = query.receivingCountry.toUpperCase() as CountryCode;
  const profile = translationProfile(receiving);
  const base = {
    documentKind: query.documentKind,
    sourceLanguage: query.documentLanguage,
    receivingCountry: receiving,
  } as const;

  if (profile === null) {
    return {
      ...base,
      required: true,
      acceptedLanguages: [],
      acceptedStandards: ['unknown'],
      rationale: `No translation profile is recorded for ${receiving}. Neither the accepted languages nor the standard of translator can be determined, so a translation must be assumed necessary and the requirement confirmed with the receiving authority before it is commissioned.`,
      citations: [],
      requiresVerification: true,
    };
  }

  const zone = query.receivingRegion === undefined ? null : coOfficialZone(query.receivingRegion);
  const zoneLanguages = zone === null ? [] : zone.languages;
  const acceptedLanguages = [...profile.stateLanguages, ...zoneLanguages];

  if (languageAccepted(query.documentLanguage, profile.stateLanguages)) {
    return {
      ...base,
      required: false,
      acceptedLanguages,
      acceptedStandards: ['none'],
      rationale: `Already in ${query.documentLanguage}, which the ${receiving} administration accepts directly. No translation is required.`,
      citations: profile.citations,
      requiresVerification: false,
    };
  }

  if (zone !== null && languageAccepted(query.documentLanguage, zoneLanguages)) {
    return {
      ...base,
      required: false,
      acceptedLanguages,
      acceptedStandards: ['none'],
      rationale:
        `Already in ${query.documentLanguage}, which is co-official in ${zone.regionName} (${zone.regionCode}), so an organ located there accepts it as it stands. Two caveats a caseworker must resolve rather than assume: a document in a co-official language that has to produce effects outside the Community is translated into Castilian, and this answer depends entirely on the receiving organ actually sitting in ${zone.regionCode}.` +
        (zone.territoriallyLimited
          ? ` The language is official only in part of ${zone.regionName}, so the region code alone does not settle it — establish where the organ sits.`
          : ''),
      citations: [...profile.citations, zone.citation],
      requiresVerification: true,
    };
  }

  const euForm =
    query.issuingCountry !== undefined &&
    isEuMemberState(query.issuingCountry) &&
    isEuMemberState(receiving) &&
    EU_2016_1191_COVERED_KINDS.includes(query.documentKind);

  const standardNames = profile.acceptedStandards.join(' or ');
  return {
    ...base,
    required: true,
    acceptedLanguages,
    acceptedStandards: profile.acceptedStandards,
    rationale:
      `Written in ${query.documentLanguage}, which is not among the languages the ${receiving} administration accepts (${acceptedLanguages.join(', ')}). A translation is required, produced to the ${standardNames} standard.` +
      (receiving === ('ES' as CountryCode)
        ? ' In Spain that means a traductor-intérprete jurado appointed by the Ministerio de Asuntos Exteriores, Unión Europea y Cooperación; a translation by anyone outside the MAEC register is not a sworn translation whatever it is called.'
        : '') +
      (euForm
        ? ' Regulation (EU) 2016/1191 additionally allows a multilingual standard form to be requested from the issuing authority and attached as a translation aid, which can remove the need for a separate translation. The form must be requested when the document is obtained, so the choice has to be made before the document is ordered rather than after.'
        : ''),
    citations: profile.citations,
    requiresVerification: euForm,
  };
}

/**
 * True when the translation recorded on a document satisfies the requirement.
 *
 * An `'unknown'` standard is never satisfied. We do not know what would satisfy
 * it, and a gap analysis that reports "translated" on that basis is asserting
 * something nobody checked.
 */
export function translationSatisfied(
  requirement: TranslationRequirement,
  translation: DocumentTranslation,
): boolean {
  if (!requirement.required) return true;
  if (requirement.acceptedStandards.includes('unknown')) return false;
  const into = translation.intoLanguage;
  const standard = translation.standard;
  if (into === undefined || standard === undefined) return false;
  if (!languageAccepted(into, requirement.acceptedLanguages)) return false;
  return requirement.acceptedStandards.includes(standard);
}
