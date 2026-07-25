/**
 * Spain.
 *
 * Six pathways: the two naturalisation-by-residence regimes, three open
 * residence routes that feed them, and one closed route that is kept in the
 * catalog on purpose.
 *
 * Everything here is `reviewStatus: 'unreviewed'`. That is not a placeholder
 * awaiting a tidy-up — it is the accurate state of these records, and it is
 * what stops {@link import('../recommend.js').recommend} from putting any of
 * them into an advice-class output. Counsel sign-off is a workflow step with a
 * named human attached, not a constant somebody flips.
 *
 * Where a threshold comes from administrative practice rather than a statute —
 * the income multiples the Unidad de Grandes Empresas y Colectivos Estratégicos
 * applies, the registry's treatment of dual nationals — the citation carries
 * `discretionary: true` and a note, and the report surfaces it. Presenting a
 * practice criterion as settled law is the most common way a platform ends up
 * asserting law that does not exist.
 */

import { countryCode, isoDate, SPAIN_NO_RENUNCIATION_NATIONALITIES, SPAIN_REDUCED_RESIDENCY_NATIONALITIES, type CountryCode } from '@meridian/core';
import { CEFR_SCALE, EDUCATION_SCALE } from '../facts.js';
import type { Pathway } from '../schema.js';

const ES: CountryCode = countryCode('ES');

/** Single verification date for this file. Every citation below was last read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

/**
 * States in which Spanish is an official language.
 *
 * This set — not the Ibero-American set — governs the DELE A2 exemption. RD
 * 1004/2015 exempts nationals of countries or territories *where Spanish is an
 * official language*, which is a narrower category than the one that unlocks
 * the two-year residence period. Brazil, Portugal, Andorra and the Philippines
 * are all on the reduced-residency list and none of them are exempt from the
 * language exam. Collapsing the two lists into one is a real and expensive
 * error: it tells a Brazilian applicant they need no DELE, and they arrive at
 * the registry without it.
 *
 * Spain itself is omitted — a Spanish national is not applying to naturalise.
 */
export const SPANISH_OFFICIAL_LANGUAGE_COUNTRIES: readonly CountryCode[] = [
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GQ', 'GT',
  'HN', 'MX', 'NI', 'PA', 'PE', 'PY', 'SV', 'UY', 'VE',
].map((c) => countryCode(c));

// ---------------------------------------------------------------------------
// Citations shared across the Spanish pathways
// ---------------------------------------------------------------------------

const CC_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763';

const ccArt22_1 = {
  id: 'es-cc-art-22-1',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 22.1',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Ten years of residence as the general rule; two years for nationals of Ibero-American countries, ' +
    'Andorra, the Philippines, Equatorial Guinea or Portugal, and for Sephardic Jews of Spanish origin. ' +
    'The Sephardic route turns on evidence this engine does not model.',
};

const ccArt22_3 = {
  id: 'es-cc-art-22-3',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 22.3',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note: 'Residence must be legal, continuous and immediately prior to the application.',
};

const ccArt22_4 = {
  id: 'es-cc-art-22-4',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 22.4',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The applicant must show good civic conduct and a sufficient degree of integration into Spanish society. ' +
    'Neither is a bright-line test; police certificates and the statutory exams are evidence toward them, not the test itself.',
  discretionary: true,
};

const ccArt23 = {
  id: 'es-cc-art-23',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 23',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Conditions for the acquisition to take effect: oath or promise of allegiance to the King and obedience ' +
    'to the Constitution and the laws, renunciation of the previous nationality, and entry in the Civil Registry.',
};

const ccArt24_1 = {
  id: 'es-cc-art-24-1',
  kind: 'statute' as const,
  instrument: 'Código Civil (España)',
  provision: 'art. 24.1',
  url: CC_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Nationals of the countries listed here are excused from the renunciation requirement in art. 23.b). ' +
    'France is not on this list; the Franco-Spanish position rests on a separate bilateral instrument.',
};

const rd1004Exams = {
  id: 'es-rd-1004-2015-examenes',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 1004/2015, de 6 de noviembre, por el que se aprueba el Reglamento que regula el procedimiento para la adquisición de la nacionalidad española por residencia',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Integration is evidenced by the CCSE test of constitutional and sociocultural knowledge and, for applicants ' +
    'who are not nationals of a country where Spanish is an official language, the DELE A2 diploma. Applicants ' +
    'under 18 and applicants whose legal capacity has been judicially modified are exempt from both. Further ' +
    'exemptions exist for some applicants educated in Spain; counsel should confirm which apply.',
};

const registryClaimedNationality = {
  id: 'es-practice-claimed-nationality',
  kind: 'policy' as const,
  instrument:
    'Spanish civil-registry practice on the nationality under which residence is held (Código Civil art. 22.1 applied to dual nationals)',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'NOT A STATUTORY RULE. Art. 22.1 confers the two-year period on nationals of the listed states. Where an ' +
    'applicant holds more than one nationality, the registry examines the nationality under which the applicant ' +
    'was admitted and holds residence: a dual Italian-Mexican national admitted and resident as an EU citizen ' +
    'should not assume the two-year period is available on the strength of the Mexican passport. This reflects ' +
    'administrative practice and must be verified with counsel against the current DGSJFP instructions before ' +
    'anyone relies on it.',
};

const loexArt31 = {
  id: 'es-lo-4-2000-art-31',
  kind: 'statute' as const,
  instrument:
    'Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social',
  provision: 'art. 31',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note: 'Temporary residence, including residence without work authorisation.',
};

const rd557Nonlucrative = {
  id: 'es-rd-557-2011-no-lucrativa',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 557/2011, de 20 de abril, por el que se aprueba el Reglamento de la Ley Orgánica 4/2000',
  provision: 'arts. 46-51 (residencia temporal no lucrativa)',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Economic means are set at 400% of the annual IPREM for the principal applicant and 100% per accompanying ' +
    'family member. IPREM is re-set annually, so the rule is encoded as a multiple and the index is supplied ' +
    'by the caller rather than hardcoded.',
};

const ley14_2013Teletrabajo = {
  id: 'es-ley-14-2013-teletrabajo',
  kind: 'statute' as const,
  instrument:
    'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización, sección de teletrabajo de carácter internacional (añadida por la Ley 28/2022, de 21 de diciembre)',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The teleworking route requires that the work be performed for undertakings established outside Spain, ' +
    'that any activity for Spanish undertakings stay within a capped share of the total, that the working ' +
    'relationship predate the application, and that the applicant hold a degree or equivalent professional experience.',
};

const ley14_2013Altamente = {
  id: 'es-ley-14-2013-altamente-cualificado',
  kind: 'statute' as const,
  instrument:
    'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización, sección de profesionales altamente cualificados',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Residence authorisation for a highly qualified professional holding a job offer from an undertaking in Spain, ' +
    'processed by the Unidad de Grandes Empresas y Colectivos Estratégicos.',
};

const ugeCriteria = {
  id: 'es-uge-criterios',
  kind: 'official_guidance' as const,
  instrument:
    'Unidad de Grandes Empresas y Colectivos Estratégicos — published criteria for applications under Ley 14/2013',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE, NOT STATUTE. The income and salary levels the UGE-CE applies are published in its ' +
    'own criteria document, are revised without legislative process, and differ by role and by whether the ' +
    'applicant is an employee or self-employed. Meridian does not encode a figure; it records that a figure ' +
    'applies and that counsel must check the current one.',
};

const ley14_2013Inversores = {
  id: 'es-ley-14-2013-inversores',
  kind: 'statute' as const,
  instrument:
    'Ley 14/2013, de 27 de septiembre, de apoyo a los emprendedores y su internacionalización, sección de inversores',
  provision: 'arts. 63-67',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Significant capital investment was defined as EUR 2,000,000 in Spanish public debt, EUR 1,000,000 in shares, ' +
    'investment-fund units or bank deposits in Spanish institutions, EUR 500,000 in real estate free of any ' +
    'encumbrance, or a business project of general interest. These provisions no longer support new applications.',
};

const lo1_2025Repeal = {
  id: 'es-lo-1-2025-derogacion-inversores',
  kind: 'statute' as const,
  instrument:
    'Ley Orgánica 1/2025, de 2 de enero, de medidas en materia de eficiencia del Servicio Público de Justicia',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Repealed the investor residence visa and authorisation in Ley 14/2013. The repeal took effect on 3 April 2025, ' +
    'three months after publication. Applications lodged before that date, and authorisations already granted, ' +
    'are governed by the transitional regime — a renewal question is a live question, not a closed one.',
};

// ---------------------------------------------------------------------------
// Naturalisation by residence — reduced two-year period
// ---------------------------------------------------------------------------

export const esNationalityResidenceReduced: Pathway = {
  id: 'es-nationality-residence-reduced',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Spanish nationality by residence — two-year reduced period',
    es: 'Nacionalidad española por residencia — plazo reducido de dos años',
  },
  summary: {
    en:
      'Nationals of Ibero-American countries, Andorra, the Philippines, Equatorial Guinea and Portugal may apply ' +
      'for Spanish nationality after two years of legal, continuous residence immediately before the application, ' +
      'instead of the general ten.',
    es:
      'Los nacionales de países iberoamericanos, Andorra, Filipinas, Guinea Ecuatorial y Portugal pueden solicitar ' +
      'la nacionalidad española tras dos años de residencia legal, continuada e inmediatamente anterior a la ' +
      'solicitud, en lugar de los diez años del régimen general.',
  },
  citations: [ccArt22_1, ccArt22_3, ccArt22_4, ccArt23, ccArt24_1, rd1004Exams, registryClaimedNationality],
  criteria: [
    {
      id: 'es-nat-red-qualifying-nationality',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-1'],
      label: {
        en: 'Nationality of a state to which the two-year period applies',
        es: 'Nacionalidad de un Estado al que se aplica el plazo de dos años',
      },
      evaluator: {
        op: 'one_of',
        path: 'claimedNationality',
        values: [...SPAIN_REDUCED_RESIDENCY_NATIONALITIES],
      },
      guidance: {
        en:
          'Art. 22.1 also confers the two-year period on Sephardic Jews of Spanish origin. That route rests on ' +
          'evidence of origin rather than on present nationality and is not modelled here.',
        es:
          'El art. 22.1 reconoce también el plazo de dos años a los sefardíes originarios de España. Esa vía se ' +
          'acredita por el origen y no por la nacionalidad actual, y no está modelada aquí.',
      },
    },
    {
      id: 'es-nat-red-nationality-by-origin',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-1'],
      label: {
        en: 'The qualifying nationality is held by origin, not acquired later',
        es: 'La nacionalidad cualificada se ostenta de origen, no adquirida con posterioridad',
      },
      evaluator: {
        op: 'equals',
        path: 'claimedNationalityAcquisition',
        value: 'by_origin',
      },
      guidance: {
        en:
          'Art. 22.1 reduces the period for nationals *de origen* — by origin. Someone born elsewhere who acquired ' +
          'a qualifying nationality by residence is on the ten-year general regime: a person born in Haiti who ' +
          'obtained Dominican nationality by residence does not get the two-year period. Where the acquisition ' +
          'mode is not on file this criterion is unknown and the pathway returns indeterminate, which is correct — ' +
          'establish how the nationality was acquired before relying on the reduction.',
        es:
          'El art. 22.1 reduce el plazo para los nacionales *de origen*. Quien nació en otro Estado y adquirió una ' +
          'nacionalidad cualificada por residencia queda sujeto al régimen general de diez años: una persona nacida ' +
          'en Haití que obtuvo la nacionalidad dominicana por residencia no accede al plazo de dos años. Si no ' +
          'consta el modo de adquisición, el criterio queda como desconocido y la vía resulta indeterminada — ' +
          'acredite cómo se adquirió la nacionalidad antes de invocar el plazo reducido.',
      },
    },
    {
      id: 'es-nat-red-nationality-of-residence',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['es-practice-claimed-nationality', 'es-cc-art-22-1'],
      label: {
        en: 'The qualifying nationality is held and is the one residence was granted under',
        es: 'La nacionalidad alegada se ostenta y es aquella bajo la que se obtuvo la residencia',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
          { op: 'equals_field', path: 'residenceHeldUnderNationality', otherPath: 'claimedNationality' },
        ],
      },
      guidance: {
        en:
          'A dual national who entered Spain and holds residence under a second, non-qualifying nationality — an ' +
          'Italian-Mexican admitted as an EU citizen, for example — is not treated as residing as an Ibero-American ' +
          'national. Establish which nationality the residence record is held under before relying on the reduction.',
        es:
          'Quien tiene doble nacionalidad y entró y reside en España bajo una segunda nacionalidad no cualificada ' +
          '—por ejemplo, un italo-mexicano admitido como ciudadano de la UE— no se considera residente como ' +
          'nacional iberoamericano. Compruebe bajo qué nacionalidad consta la residencia antes de invocar el plazo reducido.',
      },
    },
    {
      id: 'es-nat-red-two-years-continuous-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-1', 'es-cc-art-22-3'],
      label: {
        en: 'Two years of legal residence, continuous and immediately prior to the application',
        es: 'Dos años de residencia legal, continuada e inmediatamente anterior a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 2 },
      guidance: {
        en:
          'The two years must be one unbroken run that reaches the application date. A total of two years spread ' +
          'across separate periods does not satisfy art. 22.3, and this engine reports "unknown" rather than ' +
          'guessing when only a day count is recorded.',
        es:
          'Los dos años deben formar un periodo ininterrumpido que llegue hasta la fecha de solicitud. Un total de ' +
          'dos años repartido en periodos separados no cumple el art. 22.3; si solo consta un número de días, el ' +
          'motor responde «desconocido» en lugar de suponer.',
      },
    },
    {
      id: 'es-nat-red-legal-status',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-3'],
      label: {
        en: 'Residence is held under a valid authorisation',
        es: 'La residencia se ostenta al amparo de una autorización vigente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
    },
    {
      id: 'es-nat-red-ccse',
      kind: 'integration',
      weight: 'blocking',
      citationIds: ['es-rd-1004-2015-examenes', 'es-cc-art-22-4'],
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
          'CCSE certificates have a limited validity period. This criterion checks only that a pass is recorded; ' +
          'confirm the certificate is still in date at the moment of filing.',
        es:
          'El certificado CCSE tiene un periodo de validez limitado. Este criterio solo comprueba que consta un ' +
          'aprobado; verifique que el certificado sigue vigente en el momento de presentar la solicitud.',
      },
    },
    {
      id: 'es-nat-red-dele-a2',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['es-rd-1004-2015-examenes'],
      label: {
        en: 'DELE A2 or higher in Spanish, unless exempt',
        es: 'DELE A2 o superior en español, salvo exención',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: [...SPANISH_OFFICIAL_LANGUAGE_COUNTRIES] },
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
          'The exemption follows the language, not the region. Nationals of Brazil, Portugal, Andorra and the ' +
          'Philippines qualify for the two-year residence period but are not exempt from the DELE A2.',
        es:
          'La exención sigue al idioma, no a la región. Los nacionales de Brasil, Portugal, Andorra y Filipinas ' +
          'acceden al plazo de dos años pero no están exentos del DELE A2.',
      },
    },
    {
      id: 'es-nat-red-civic-conduct',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-4'],
      label: {
        en: 'Police certificates from Spain and from the country of origin show no convictions',
        es: 'Certificados de antecedentes penales de España y del país de origen sin condenas',
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
          'discretionary assessment and a clear record does not oblige the authority to find in the applicant’s favour.',
        es:
          'Los certificados sin antecedentes son prueba de buena conducta cívica, pero no la agotan. El art. 22.4 ' +
          'establece una valoración discrecional y un expediente limpio no vincula a la autoridad.',
      },
    },
    {
      id: 'es-nat-red-renunciation-exemption',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-23', 'es-cc-art-24-1'],
      label: {
        en: 'Exempt from renouncing the previous nationality',
        es: 'Exento de renunciar a la nacionalidad anterior',
      },
      evaluator: {
        op: 'one_of',
        path: 'claimedNationality',
        values: [...SPAIN_NO_RENUNCIATION_NATIONALITIES],
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['es-cc-art-23'],
    note: {
      en:
        'Acquisition takes effect only once the oath or promise is made and the entry is made in the Civil Registry. ' +
        'The grant is not the end of the matter.',
      es:
        'La adquisición solo surte efecto tras el juramento o promesa y la inscripción en el Registro Civil. La ' +
        'concesión no cierra el expediente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Naturalisation by residence — general ten-year period
// ---------------------------------------------------------------------------

export const esNationalityResidenceGeneral: Pathway = {
  id: 'es-nationality-residence-general',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Spanish nationality by residence — general ten-year period',
    es: 'Nacionalidad española por residencia — plazo general de diez años',
  },
  summary: {
    en:
      'The default route to Spanish nationality: ten years of legal, continuous residence immediately before the ' +
      'application, with the same integration, language and conduct requirements as the reduced regime.',
    es:
      'La vía ordinaria a la nacionalidad española: diez años de residencia legal, continuada e inmediatamente ' +
      'anterior a la solicitud, con los mismos requisitos de integración, idioma y conducta que el régimen reducido.',
  },
  citations: [ccArt22_1, ccArt22_3, ccArt22_4, ccArt23, ccArt24_1, rd1004Exams],
  criteria: [
    {
      id: 'es-nat-gen-ten-years-continuous-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-1', 'es-cc-art-22-3'],
      label: {
        en: 'Ten years of legal residence, continuous and immediately prior to the application',
        es: 'Diez años de residencia legal, continuada e inmediatamente anterior a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 10 },
    },
    {
      id: 'es-nat-gen-legal-status',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-3'],
      label: {
        en: 'Residence is held under a valid authorisation',
        es: 'La residencia se ostenta al amparo de una autorización vigente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
    },
    {
      id: 'es-nat-gen-ccse',
      kind: 'integration',
      weight: 'blocking',
      citationIds: ['es-rd-1004-2015-examenes', 'es-cc-art-22-4'],
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
    },
    {
      id: 'es-nat-gen-dele-a2',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['es-rd-1004-2015-examenes'],
      label: {
        en: 'DELE A2 or higher in Spanish, unless exempt',
        es: 'DELE A2 o superior en español, salvo exención',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: [...SPANISH_OFFICIAL_LANGUAGE_COUNTRIES] },
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
    },
    {
      id: 'es-nat-gen-civic-conduct',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-cc-art-22-4'],
      label: {
        en: 'Police certificates from Spain and from the country of origin show no convictions',
        es: 'Certificados de antecedentes penales de España y del país de origen sin condenas',
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
    },
    {
      id: 'es-nat-gen-renunciation-required',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-cc-art-23', 'es-cc-art-24-1'],
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
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['es-cc-art-23'],
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Non-lucrative residence
// ---------------------------------------------------------------------------

export const esNonLucrativeVisa: Pathway = {
  id: 'es-non-lucrative-visa',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Non-lucrative residence visa',
    es: 'Visado de residencia no lucrativa',
  },
  summary: {
    en:
      'Temporary residence in Spain without work authorisation, for applicants who can support themselves from ' +
      'income not derived from work in Spain and who hold private health cover.',
    es:
      'Residencia temporal en España sin autorización para trabajar, para quienes pueden mantenerse con ingresos ' +
      'no derivados del trabajo en España y cuentan con un seguro médico privado.',
  },
  citations: [loexArt31, rd557Nonlucrative],
  criteria: [
    {
      id: 'es-nlv-economic-means',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['es-rd-557-2011-no-lucrativa'],
      label: {
        en: 'Income of at least 400% of the annual IPREM',
        es: 'Medios económicos de al menos el 400% del IPREM anual',
      },
      evaluator: { op: 'gte', path: 'derived.passiveIncomeIpremMultiple', value: 4 },
      guidance: {
        en:
          'IPREM is re-set each year, so the current figure must be supplied with the applicant’s facts. Without ' +
          'it this criterion reports "unknown" rather than measuring against a stale number. Accompanying family ' +
          'members add 100% of IPREM each.',
        es:
          'El IPREM se actualiza anualmente, por lo que la cifra vigente debe aportarse junto con los datos del ' +
          'solicitante. Sin ella, este criterio responde «desconocido» en lugar de medir contra una cifra caducada. ' +
          'Cada familiar acompañante suma un 100% adicional del IPREM.',
      },
    },
    {
      id: 'es-nlv-no-economic-activity',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['es-rd-557-2011-no-lucrativa', 'es-lo-4-2000-art-31'],
      label: {
        en: 'No work or professional activity will be carried out in Spain',
        es: 'No se ejercerá actividad laboral ni profesional en España',
      },
      evaluator: { op: 'is_true', path: 'intent.noEconomicActivityInTargetState' },
    },
    {
      id: 'es-nlv-health-insurance',
      kind: 'health',
      weight: 'blocking',
      citationIds: ['es-rd-557-2011-no-lucrativa'],
      label: {
        en: 'Private health cover with an insurer authorised to operate in Spain',
        es: 'Seguro médico privado con una aseguradora autorizada para operar en España',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_true', path: 'healthInsurance.hasPrivateCoverage' },
          { op: 'equals', path: 'healthInsurance.insurerAuthorizedIn', value: 'ES' },
        ],
      },
    },
    {
      id: 'es-nlv-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-rd-557-2011-no-lucrativa'],
      label: {
        en: 'Police certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
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
          'Certificates are required from every country the applicant has lived in over the preceding five years, ' +
          'not only the country of nationality. This criterion checks the country of nationality alone.',
        es:
          'Se exigen certificados de todos los países de residencia en los cinco años anteriores, no solo el de ' +
          'nacionalidad. Este criterio comprueba únicamente el país de nacionalidad.',
      },
    },
    {
      id: 'es-nlv-not-irregular',
      kind: 'status',
      weight: 'material',
      citationIds: ['es-rd-557-2011-no-lucrativa'],
      label: {
        en: 'Not present in Spain without authorisation',
        es: 'No encontrarse en España en situación irregular',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 24,
    countsTowardNaturalisation: true,
    citationIds: ['es-rd-557-2011-no-lucrativa'],
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// International teleworking ("digital nomad")
// ---------------------------------------------------------------------------

export const esDigitalNomadVisa: Pathway = {
  id: 'es-digital-nomad-visa',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'International teleworking residence ("digital nomad")',
    es: 'Residencia por teletrabajo de carácter internacional («nómada digital»)',
  },
  summary: {
    en:
      'Residence in Spain for a person who works remotely, using only telecommunications, for undertakings ' +
      'established outside Spain.',
    es:
      'Residencia en España para quien trabaja a distancia, exclusivamente por medios telemáticos, para empresas ' +
      'radicadas fuera de España.',
  },
  citations: [ley14_2013Teletrabajo, ugeCriteria],
  criteria: [
    {
      id: 'es-dnv-employer-outside-spain',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-teletrabajo'],
      label: {
        en: 'The work is performed for undertakings established outside Spain',
        es: 'El trabajo se presta para empresas radicadas fuera de España',
      },
      evaluator: { op: 'is_true', path: 'remoteWork.employerOutsideTargetState' },
    },
    {
      id: 'es-dnv-spanish-activity-cap',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-teletrabajo'],
      label: {
        en: 'No more than 20% of professional activity is for undertakings in Spain',
        es: 'No más del 20% de la actividad profesional se presta a empresas en España',
      },
      evaluator: { op: 'lte', path: 'remoteWork.targetStateActivityPercent', value: 20 },
    },
    {
      id: 'es-dnv-prior-relationship',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-teletrabajo'],
      label: {
        en: 'The working relationship has run for at least three months',
        es: 'La relación laboral o profesional tiene una antigüedad mínima de tres meses',
      },
      evaluator: { op: 'gte', path: 'remoteWork.relationshipMonths', value: 3 },
    },
    {
      id: 'es-dnv-employer-trading',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-teletrabajo'],
      label: {
        en: 'The employer or client has been trading for at least one year',
        es: 'La empresa o cliente tiene una antigüedad de al menos un año',
      },
      evaluator: { op: 'gte', path: 'remoteWork.employerTradingMonths', value: 12 },
    },
    {
      id: 'es-dnv-qualification',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-teletrabajo'],
      label: {
        en: 'A degree from a recognised institution, or at least three years of professional experience',
        es: 'Titulación de una institución reconocida o al menos tres años de experiencia profesional',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'ordinal_at_least', path: 'educationLevel', scale: EDUCATION_SCALE, value: 'bachelor' },
          { op: 'gte', path: 'professionalExperienceYears', value: 3 },
        ],
      },
    },
    {
      id: 'es-dnv-economic-means',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-uge-criterios'],
      label: {
        en: 'Income meets the level the UGE-CE applies to teleworking applications',
        es: 'Ingresos suficientes según los criterios que aplica la UGE-CE al teletrabajo',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.annualSalaryMinorUnits' },
      guidance: {
        en:
          'The level is published in the UGE-CE criteria as a multiple of the minimum wage and is revised without ' +
          'legislative process. Meridian records that a level applies and that a figure has been supplied; it does ' +
          'not assert the figure. Confirm the current level before filing.',
        es:
          'El nivel se publica en los criterios de la UGE-CE como múltiplo del salario mínimo y se revisa sin ' +
          'procedimiento legislativo. Meridian deja constancia de que existe un umbral y de que se ha aportado una ' +
          'cifra; no afirma cuál es. Confirme el importe vigente antes de presentar la solicitud.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['es-ley-14-2013-teletrabajo'],
    note: {
      en:
        'An application made from outside Spain produces a consular visa; one made from inside Spain produces a ' +
        'residence authorisation from the UGE-CE. The two have different validity periods and Meridian does not ' +
        'state either — confirm which applies to the route being taken.',
      es:
        'La solicitud desde el extranjero da lugar a un visado consular; desde España, a una autorización de ' +
        'residencia de la UGE-CE. Sus periodos de validez difieren y Meridian no afirma ninguno: confirme cuál ' +
        'corresponde a la vía elegida.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Highly qualified professional
// ---------------------------------------------------------------------------

export const esHighlyQualifiedProfessional: Pathway = {
  id: 'es-highly-qualified-professional',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Highly qualified professional residence authorisation',
    es: 'Autorización de residencia para profesional altamente cualificado',
  },
  summary: {
    en:
      'Residence and work authorisation for a highly qualified professional holding a job offer from an ' +
      'undertaking in Spain, processed through the large-undertakings unit rather than the general work regime.',
    es:
      'Autorización de residencia y trabajo para profesionales altamente cualificados con oferta de empleo de una ' +
      'empresa en España, tramitada por la unidad de grandes empresas y no por el régimen general.',
  },
  citations: [ley14_2013Altamente, ugeCriteria],
  criteria: [
    {
      id: 'es-hqp-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-altamente-cualificado'],
      label: {
        en: 'A written job offer from an undertaking established in Spain',
        es: 'Oferta de empleo por escrito de una empresa radicada en España',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'ES' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
    },
    {
      id: 'es-hqp-qualification',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-altamente-cualificado'],
      label: {
        en: 'Higher-education qualification, or equivalent professional experience',
        es: 'Titulación de educación superior o experiencia profesional equivalente',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'ordinal_at_least', path: 'educationLevel', scale: EDUCATION_SCALE, value: 'bachelor' },
          { op: 'gte', path: 'professionalExperienceYears', value: 3 },
        ],
      },
    },
    {
      id: 'es-hqp-salary',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-uge-criterios'],
      label: {
        en: 'Salary meets the level the UGE-CE applies to the role',
        es: 'Retribución conforme al nivel que la UGE-CE aplica al puesto',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.annualSalaryMinorUnits' },
      guidance: {
        en:
          'The UGE-CE publishes different salary levels for managerial and for technical roles, and revises them ' +
          'without legislative process. Meridian records that a salary has been supplied; it does not assert the ' +
          'threshold. Check the current criteria for the specific role.',
        es:
          'La UGE-CE publica niveles retributivos distintos para puestos directivos y técnicos, y los revisa sin ' +
          'procedimiento legislativo. Meridian deja constancia de que se ha aportado una retribución; no afirma el ' +
          'umbral. Consulte los criterios vigentes para el puesto concreto.',
      },
    },
    {
      id: 'es-hqp-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-altamente-cualificado'],
      label: {
        en: 'Police certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
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
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['es-ley-14-2013-altamente-cualificado'],
    note: {
      en:
        'Validity periods under the Ley 14/2013 mobility regime have been amended more than once. Meridian does ' +
        'not state a figure here; confirm the current initial and renewal periods before advising on timing.',
      es:
        'Los periodos de vigencia del régimen de movilidad de la Ley 14/2013 se han modificado en varias ocasiones. ' +
        'Meridian no fija aquí una cifra; confirme los plazos iniciales y de renovación vigentes antes de asesorar sobre plazos.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Investor residence ("golden visa") — CLOSED
// ---------------------------------------------------------------------------

/**
 * Kept in the catalog although it is closed, and this is a deliberate product
 * decision rather than an oversight.
 *
 * Deleting a repealed route means the several thousand people who hold status
 * under it get silence when they ask whether they can renew. A closed pathway
 * evaluates to `ineligible` with a reason and a closure note, which is an
 * answer; an absent pathway is a 404, which is not.
 */
export const esGoldenVisa: Pathway = {
  id: 'es-golden-visa',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'closed',
  openedOn: isoDate('2013-09-29'),
  closedOn: isoDate('2025-04-03'),
  name: {
    en: 'Investor residence visa ("golden visa") — closed',
    es: 'Visado de residencia para inversores («golden visa») — derogado',
  },
  summary: {
    en:
      'Residence in Spain on the basis of a significant capital investment. Repealed by Ley Orgánica 1/2025; no ' +
      'new application has been possible since 3 April 2025.',
    es:
      'Residencia en España por inversión significativa de capital. Derogado por la Ley Orgánica 1/2025; desde el ' +
      '3 de abril de 2025 no cabe presentar nuevas solicitudes.',
  },
  closureNote: {
    en:
      'New applications are no longer accepted. Authorisations granted before 3 April 2025, and applications ' +
      'lodged before that date, are governed by the transitional regime: existing holders are not stripped of ' +
      'status by the repeal, and renewal, family reunification and the route to long-term residence remain live ' +
      'questions. Take those to counsel — this engine can restate the repealed criteria but cannot tell you how ' +
      'the transitional provisions apply to a particular authorisation.',
    es:
      'No se admiten nuevas solicitudes. Las autorizaciones concedidas antes del 3 de abril de 2025, y las ' +
      'solicitudes presentadas antes de esa fecha, se rigen por el régimen transitorio: la derogación no priva de ' +
      'estatus a los titulares actuales, y la renovación, la reagrupación familiar y el acceso a la residencia de ' +
      'larga duración siguen siendo cuestiones abiertas. Consúltelas con un profesional: este motor puede ' +
      'reproducir los requisitos derogados, pero no determinar cómo se aplica el régimen transitorio a una ' +
      'autorización concreta.',
  },
  citations: [ley14_2013Inversores, lo1_2025Repeal],
  criteria: [
    {
      id: 'es-gv-application-before-repeal',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-lo-1-2025-derogacion-inversores'],
      label: {
        en: 'The application was lodged before the repeal took effect on 3 April 2025',
        es: 'La solicitud se presentó antes de que la derogación surtiera efecto el 3 de abril de 2025',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: isoDate('2025-04-03') },
    },
    {
      id: 'es-gv-qualifying-investment',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-inversores'],
      label: {
        en: 'A significant capital investment as defined by the repealed provisions',
        es: 'Inversión significativa de capital conforme a los preceptos derogados',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'qualifyingInvestment.currency', value: 'EUR' },
          {
            op: 'any_of',
            of: [
              {
                op: 'all_of',
                of: [
                  { op: 'equals', path: 'qualifyingInvestment.kind', value: 'real_estate' },
                  { op: 'gte', path: 'qualifyingInvestment.minorUnits', value: 50_000_000 },
                ],
              },
              {
                op: 'all_of',
                of: [
                  { op: 'equals', path: 'qualifyingInvestment.kind', value: 'public_debt' },
                  { op: 'gte', path: 'qualifyingInvestment.minorUnits', value: 200_000_000 },
                ],
              },
              {
                op: 'all_of',
                of: [
                  { op: 'equals', path: 'qualifyingInvestment.kind', value: 'shares' },
                  { op: 'gte', path: 'qualifyingInvestment.minorUnits', value: 100_000_000 },
                ],
              },
              {
                op: 'all_of',
                of: [
                  { op: 'equals', path: 'qualifyingInvestment.kind', value: 'bank_deposit' },
                  { op: 'gte', path: 'qualifyingInvestment.minorUnits', value: 100_000_000 },
                ],
              },
              { op: 'equals', path: 'qualifyingInvestment.kind', value: 'business_project' },
            ],
          },
        ],
      },
      guidance: {
        en:
          'Amounts are in euro cents. The business-project route had no fixed amount and turned on a favourable ' +
          'report on the project’s general interest, so it is recorded here without a threshold.',
        es:
          'Los importes se expresan en céntimos de euro. La vía del proyecto empresarial no tenía importe fijo y ' +
          'dependía de un informe favorable sobre su interés general, por lo que se recoge sin umbral.',
      },
    },
    {
      id: 'es-gv-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-ley-14-2013-inversores'],
      label: {
        en: 'Police certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
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
    },
  ],
  durations: {
    citationIds: ['es-ley-14-2013-inversores'],
    note: {
      en:
        'Time held under the investor authorisation is legal residence, but naturalisation by residence also ' +
        'requires effective residence in Spain, and the investor route never required the holder to live here. ' +
        'Whether a given holder’s time counts toward the naturalisation clock is a question of their actual ' +
        'presence, not of the permit — so no answer is asserted here.',
      es:
        'El tiempo bajo la autorización de inversor es residencia legal, pero la nacionalidad por residencia exige ' +
        'además residencia efectiva en España, y esta vía nunca obligó a vivir en el país. Que el tiempo de un ' +
        'titular concreto compute depende de su presencia real, no del permiso: por eso no se afirma aquí ninguna respuesta.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const ES_PATHWAYS: readonly Pathway[] = [
  esNationalityResidenceReduced,
  esNationalityResidenceGeneral,
  esNonLucrativeVisa,
  esDigitalNomadVisa,
  esHighlyQualifiedProfessional,
  esGoldenVisa,
];
