/**
 * Canada.
 *
 * Two pathways: the CUSMA professional work permit, which is a treaty-based
 * exemption from the labour market impact assessment, and the Canadian
 * Experience Class, which is the economic-immigration route it most often feeds.
 *
 * Both are `reviewStatus: 'unreviewed'`, and in Canada that word carries extra
 * weight. Section 91 of the Immigration and Refugee Protection Act makes it an
 * offence to advise a person for consideration on an immigration application
 * unless you are a lawyer, a Quebec notary, or a College of Immigration and
 * Citizenship Consultants licensee. These records may be used to tell someone
 * what the published rule says and how their own recorded facts measure against
 * it. They may not be used to tell someone which route to take until a licensed
 * person has signed off on them.
 */

import { countryCode, CUSMA_PARTIES, isoDate, type CountryCode } from '@meridian/core';
import { CLB_SCALE, EDUCATION_SCALE } from '../facts.js';
import type { EvaluatorSpec, Pathway } from '../schema.js';
import {
  CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS,
  CUSMA_PROFESSION_IDS,
  CUSMA_PROFESSIONS,
} from './cusma-professions.js';

const CA: CountryCode = countryCode('CA');

const VERIFIED_ON = isoDate('2026-07-25');

const IRPR_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/';

/**
 * Citizens of the CUSMA parties other than Canada.
 *
 * Derived rather than written out, so that if the treaty's membership ever
 * changes in `@meridian/core` this rule follows it. Canada is excluded because
 * a Canadian citizen does not need a Canadian work permit.
 */
const NON_CANADIAN_CUSMA_PARTIES: readonly CountryCode[] = CUSMA_PARTIES.filter((c) => c !== CA);

const irprS204 = {
  id: 'ca-irpr-s-204',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 204(a)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A work permit may be issued without a labour market impact assessment where the work is performed under an ' +
    'international agreement between Canada and one or more countries. CUSMA is such an agreement.',
};

const cusmaAppendix2 = {
  id: 'ca-cusma-annex-16a-appendix-2',
  kind: 'treaty' as const,
  instrument: 'Canada-United States-Mexico Agreement, Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A, Section D and Appendix 2',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Trilateral instrument. Section D covers professionals; Appendix 2 lists the professions and the minimum ' +
    'education requirement or alternative credential for each. Meridian encodes a subset of Appendix 2, so an ' +
    'occupation absent from the catalog is routed to human review rather than reported as unlisted.',
};

const cusmaCitizenshipOnly = {
  id: 'ca-cusma-citizenship-requirement',
  kind: 'treaty' as const,
  instrument: 'Canada-United States-Mexico Agreement, Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A (application to citizens of the Parties)',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Chapter 16 benefits attach to citizens of the Parties. Permanent residents of the United States or Mexico ' +
    'who are not citizens do not come within it, however long they have lived there.',
};

const ircCusmaGuidance = {
  id: 'ca-ircc-cusma-instructions',
  kind: 'official_guidance' as const,
  instrument:
    'Immigration, Refugees and Citizenship Canada — International Mobility Program program delivery instructions on CUSMA professionals',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. The instructions govern how officers assess whether a particular engagement fits a ' +
    'listed profession, whether the intent is genuinely temporary, and what evidence of credentials is accepted. ' +
    'They are revised without legislative process and bind officers, not applicants.',
};

const irprS87_1 = {
  id: 'ca-irpr-s-87-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.1 (Canadian Experience Class)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'The class requires at least one year of full-time, or the equivalent in part-time, skilled work experience ' +
    'in Canada within the three years before the application, together with the prescribed language proficiency ' +
    'and an intention to reside outside Quebec. Language thresholds are set by regulation and ministerial ' +
    'instruction and are re-verified rather than assumed stable.',
};

const irccCecGuidance = {
  id: 'ca-ircc-cec-guidance',
  kind: 'official_guidance' as const,
  instrument: 'Immigration, Refugees and Citizenship Canada — Canadian Experience Class program delivery instructions',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE. IRCC measures the one-year requirement as an hours-based full-time equivalent, so ' +
    'a part-time or variable-hours history has to be converted before any day count means anything. Meridian ' +
    'counts calendar days of qualifying employment and escalates part-time histories to a person rather than ' +
    'performing the conversion itself.',
};

// ---------------------------------------------------------------------------
// CUSMA professional
// ---------------------------------------------------------------------------

/**
 * One `any_of` branch per profession, generated from the Appendix 2 subset.
 *
 * Generating the rule from the profession table is the point of a data-driven
 * catalog: the credential requirement for "Lawyer" lives next to the word
 * "Lawyer" in a file a reviewer can read, not inside a conditional in the
 * engine. Adding a profession is a one-record change and the rule follows.
 */
function credentialBranches(): EvaluatorSpec[] {
  return CUSMA_PROFESSIONS.map((profession): EvaluatorSpec => {
    const alternatives: EvaluatorSpec[] = [
      {
        op: 'ordinal_at_least',
        path: 'educationLevel',
        scale: EDUCATION_SCALE,
        value: profession.minimumEducationLevel,
      },
    ];
    if (profession.diplomaPlusExperienceYears !== undefined) {
      alternatives.push({
        op: 'all_of',
        of: [
          {
            op: 'ordinal_at_least',
            path: 'educationLevel',
            scale: EDUCATION_SCALE,
            value: 'post_secondary_diploma',
          },
          {
            op: 'gte',
            path: 'professionalExperienceYears',
            value: profession.diplomaPlusExperienceYears,
          },
        ],
      });
    }
    if (profession.licenceAlternative === true) {
      alternatives.push({
        op: 'collection_any',
        path: 'professionalCredentials',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'kind', value: 'licence' },
            { op: 'equals', path: 'issuingCountry', value: 'CA' },
          ],
        },
      });
    }
    return {
      op: 'all_of',
      of: [
        { op: 'equals', path: 'jobOffer.occupationCode', value: profession.id },
        { op: 'any_of', of: alternatives },
      ],
    };
  });
}

export const caCusmaProfessional: Pathway = {
  id: 'ca-cusma-professional',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'CUSMA professional work permit',
    es: 'Permiso de trabajo para profesionales del T-MEC',
  },
  summary: {
    en:
      'A work permit for a citizen of Mexico or the United States entering Canada to work temporarily in a ' +
      'profession listed in the trade agreement, without a labour market impact assessment.',
    es:
      'Permiso de trabajo para nacionales de México o Estados Unidos que entran a Canadá a ejercer temporalmente ' +
      'una profesión listada en el tratado comercial, sin evaluación de impacto en el mercado laboral.',
  },
  citations: [irprS204, cusmaAppendix2, cusmaCitizenshipOnly, ircCusmaGuidance],
  criteria: [
    {
      id: 'ca-cusma-citizenship',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['ca-cusma-citizenship-requirement', 'ca-cusma-annex-16a-appendix-2'],
      label: {
        en: 'Citizenship of Mexico or the United States, held and claimed',
        es: 'Nacionalidad mexicana o estadounidense, ostentada y alegada',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: [...NON_CANADIAN_CUSMA_PARTIES] },
          { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
        ],
      },
      guidance: {
        en:
          'Permanent residence in a CUSMA party is not citizenship of it. A green-card holder who is a citizen of ' +
          'a fourth country has no access to this route, and neither does a Canadian citizen, who needs no permit.',
        es:
          'La residencia permanente en un país del T-MEC no equivale a su nacionalidad. Quien tiene green card ' +
          'pero es nacional de un tercer país no accede a esta vía, ni tampoco un ciudadano canadiense, que no ' +
          'necesita permiso.',
      },
    },
    {
      id: 'ca-cusma-listed-profession',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-appendix-2', 'ca-ircc-cusma-instructions'],
      label: {
        en: 'The occupation is a profession listed in Appendix 2',
        es: 'La ocupación figura como profesión listada en el Apéndice 2',
      },
      evaluator: { op: 'one_of', path: 'jobOffer.occupationCode', values: [...CUSMA_PROFESSION_IDS] },
      // Two quite different situations escalate here. A profession known to
      // attract heightened scrutiny is escalated because a clean credential
      // match still tells you very little about whether the officer will
      // agree. An occupation Meridian does not recognise is escalated because
      // the catalog is a subset of Appendix 2 — reporting "unmet" would be
      // asserting the treaty does not list a profession we simply have not
      // encoded, which is a false negative on someone's livelihood.
      humanReviewWhen: {
        op: 'any_of',
        of: [
          {
            op: 'one_of',
            path: 'jobOffer.occupationCode',
            values: [...CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS],
          },
          {
            op: 'all_of',
            of: [
              { op: 'is_present', path: 'jobOffer.occupationCode' },
              {
                op: 'not',
                of: {
                  op: 'one_of',
                  path: 'jobOffer.occupationCode',
                  values: [...CUSMA_PROFESSION_IDS],
                },
              },
            ],
          },
        ],
      },
      humanReviewReason: {
        en:
          'Either the profession is one officers examine closely, or it is not in Meridian’s subset of Appendix 2. ' +
          'In both cases the Appendix text and the job description need to be read by a person.',
        es:
          'O la profesión es de las que los oficiales examinan con detalle, o no figura en el subconjunto del ' +
          'Apéndice 2 que Meridian codifica. En ambos casos, el texto del Apéndice y la descripción del puesto ' +
          'deben ser leídos por una persona.',
      },
    },
    {
      id: 'ca-cusma-credentials',
      kind: 'qualification',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-appendix-2'],
      label: {
        en: 'Credentials meet the minimum the Appendix sets for that profession',
        es: 'Las credenciales cumplen el mínimo que el Apéndice fija para esa profesión',
      },
      evaluator: { op: 'any_of', of: credentialBranches() },
      guidance: {
        en:
          'Each profession carries its own minimum. A baccalaureate satisfies most entries but not Lawyer, ' +
          'Physician, Dentist, Veterinarian or Librarian, and several entries accept a post-secondary diploma with ' +
          'three years of experience or a Canadian provincial licence instead.',
        es:
          'Cada profesión tiene su propio mínimo. Una licenciatura cumple la mayoría de los epígrafes, pero no los ' +
          'de Abogado, Médico, Odontólogo, Veterinario ni Bibliotecario; varios admiten en su lugar un diploma de ' +
          'educación superior con tres años de experiencia o una licencia provincial canadiense.',
      },
    },
    {
      id: 'ca-cusma-pre-arranged-employment',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-appendix-2', 'ca-irpr-s-204'],
      label: {
        en: 'Pre-arranged employment with a Canadian employer, not self-employment',
        es: 'Empleo concertado previamente con un empleador canadiense, no por cuenta propia',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
      guidance: {
        en:
          'The route requires arranged employment before entry. Setting up a Canadian company and engaging ' +
          'yourself through it does not satisfy it.',
        es:
          'La vía exige empleo concertado antes de la entrada. Constituir una sociedad canadiense y contratarse a ' +
          'uno mismo a través de ella no la satisface.',
      },
    },
    {
      id: 'ca-cusma-temporary-intent',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-appendix-2', 'ca-ircc-cusma-instructions'],
      label: {
        en: 'The entry is temporary',
        es: 'La entrada tiene carácter temporal',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'Chapter 16 governs temporary entry. Holding a permanent-residence application at the same time is not ' +
          'automatically fatal, but the officer must be satisfied the applicant will leave at the end of the ' +
          'authorised stay, and that judgement is not one this engine makes.',
        es:
          'El capítulo 16 regula la entrada temporal. Tener en trámite una solicitud de residencia permanente no ' +
          'es automáticamente incompatible, pero el oficial debe convencerse de que el solicitante saldrá al ' +
          'término de la estancia autorizada, y ese juicio no lo hace este motor.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 36,
    countsTowardNaturalisation: false,
    citationIds: ['ca-ircc-cusma-instructions'],
    note: {
      en:
        'IRCC may issue up to three years and the permit is extendable, but the officer sets the actual period and ' +
        'commonly ties it to the length of the contract. Time on a work permit is temporary residence; it can ' +
        'count toward citizenship only partially and only after permanent residence is obtained.',
      es:
        'IRCC puede expedir hasta tres años y el permiso es prorrogable, pero el oficial fija el periodo real y ' +
        'suele ajustarlo a la duración del contrato. El tiempo con permiso de trabajo es residencia temporal: solo ' +
        'computa parcialmente para la ciudadanía y únicamente tras obtener la residencia permanente.',
    },
  },
  leadsTo: ['ca-express-entry-cec'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Canadian Experience Class
// ---------------------------------------------------------------------------

const canadianSkilledExperience: EvaluatorSpec = {
  op: 'collection_any',
  path: 'workExperience',
  where: {
    op: 'all_of',
    of: [
      { op: 'equals', path: 'country', value: 'CA' },
      { op: 'gte', path: 'nocTeer', value: 0 },
      { op: 'lte', path: 'nocTeer', value: 3 },
    ],
  },
};

export const caExpressEntryCec: Pathway = {
  id: 'ca-express-entry-cec',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Canadian Experience Class',
    es: 'Clase de Experiencia Canadiense',
  },
  summary: {
    en:
      'Permanent residence for a person who has already worked in Canada in a skilled occupation for at least one ' +
      'year within the preceding three years, and who intends to settle outside Quebec.',
    es:
      'Residencia permanente para quien ya ha trabajado en Canadá en una ocupación cualificada durante al menos un ' +
      'año dentro de los tres años anteriores y tiene intención de establecerse fuera de Quebec.',
  },
  citations: [irprS87_1, irccCecGuidance],
  criteria: [
    {
      id: 'ca-cec-one-year-canadian-experience',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-1', 'ca-ircc-cec-guidance'],
      label: {
        en: 'At least one year of Canadian work experience within the preceding three years',
        es: 'Al menos un año de experiencia laboral en Canadá dentro de los tres años anteriores',
      },
      evaluator: { op: 'gte', path: 'derived.canadianSkilledWorkDaysLastThreeYears', value: 365 },
      // A part-time history cannot be measured in calendar days. IRCC converts
      // it to a full-time equivalent in hours, and guessing that conversion
      // would be inventing the applicant's timeline for them.
      humanReviewWhen: {
        op: 'collection_any',
        path: 'workExperience',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'country', value: 'CA' },
            { op: 'is_false', path: 'fullTime' },
          ],
        },
      },
      humanReviewReason: {
        en:
          'Part-time Canadian experience is recorded. The one-year requirement is measured as a full-time ' +
          'equivalent in hours, and that conversion has to be done from the actual hours worked.',
        es:
          'Consta experiencia canadiense a tiempo parcial. El requisito de un año se mide como equivalente a ' +
          'tiempo completo en horas, y esa conversión debe hacerse a partir de las horas realmente trabajadas.',
      },
      guidance: {
        en:
          'The three-year window is a closed range ending on the assessment date: experience that fell out of the ' +
          'window yesterday no longer counts, and concurrent jobs over the same months count once.',
        es:
          'La ventana de tres años es un intervalo cerrado que termina en la fecha de evaluación: la experiencia ' +
          'que salió de la ventana ayer ya no computa, y los empleos simultáneos en los mismos meses computan una vez.',
      },
    },
    {
      id: 'ca-cec-skilled-occupation',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-1'],
      label: {
        en: 'The Canadian experience is in a TEER 0, 1, 2 or 3 occupation',
        es: 'La experiencia canadiense corresponde a una ocupación TEER 0, 1, 2 o 3',
      },
      evaluator: canadianSkilledExperience,
    },
    {
      id: 'ca-cec-authorized-work',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-1'],
      label: {
        en: 'The Canadian work was performed with authorisation',
        es: 'El trabajo en Canadá se realizó con autorización',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'collection_any',
          path: 'workExperience',
          where: {
            op: 'all_of',
            of: [
              { op: 'equals', path: 'country', value: 'CA' },
              { op: 'is_false', path: 'authorized' },
            ],
          },
        },
      },
    },
    {
      id: 'ca-cec-language',
      kind: 'language',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-1'],
      label: {
        en: 'Language proficiency at the level set for the occupation’s TEER category',
        es: 'Competencia lingüística en el nivel fijado para la categoría TEER de la ocupación',
      },
      evaluator: {
        op: 'any_of',
        of: [
          {
            op: 'all_of',
            of: [
              {
                op: 'collection_any',
                path: 'workExperience',
                where: {
                  op: 'all_of',
                  of: [
                    { op: 'equals', path: 'country', value: 'CA' },
                    { op: 'lte', path: 'nocTeer', value: 1 },
                  ],
                },
              },
              {
                op: 'collection_any',
                path: 'languageCertifications',
                where: {
                  op: 'all_of',
                  of: [
                    { op: 'equals', path: 'framework', value: 'clb' },
                    { op: 'ordinal_at_least', path: 'level', scale: CLB_SCALE, value: '7' },
                  ],
                },
              },
            ],
          },
          {
            op: 'all_of',
            of: [
              {
                op: 'collection_any',
                path: 'workExperience',
                where: {
                  op: 'all_of',
                  of: [
                    { op: 'equals', path: 'country', value: 'CA' },
                    { op: 'gte', path: 'nocTeer', value: 2 },
                    { op: 'lte', path: 'nocTeer', value: 3 },
                  ],
                },
              },
              {
                op: 'collection_any',
                path: 'languageCertifications',
                where: {
                  op: 'all_of',
                  of: [
                    { op: 'equals', path: 'framework', value: 'clb' },
                    { op: 'ordinal_at_least', path: 'level', scale: CLB_SCALE, value: '5' },
                  ],
                },
              },
            ],
          },
        ],
      },
      guidance: {
        en:
          'A higher benchmark applies to TEER 0 and 1 occupations than to TEER 2 and 3. Where the qualifying ' +
          'experience spans both, the requirement follows the occupation relied on, and counsel should confirm ' +
          'which that is before the application is built around it.',
        es:
          'Las ocupaciones TEER 0 y 1 exigen un nivel superior al de las TEER 2 y 3. Cuando la experiencia ' +
          'computable abarca ambas, el requisito sigue a la ocupación invocada; conviene confirmar cuál es antes ' +
          'de construir la solicitud sobre ella.',
      },
    },
    {
      id: 'ca-cec-outside-quebec',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-87-1'],
      label: {
        en: 'Intention to reside outside the province of Quebec',
        es: 'Intención de residir fuera de la provincia de Quebec',
      },
      evaluator: { op: 'is_true', path: 'intent.intendsToResideOutsideQuebec' },
      guidance: {
        en: 'Quebec selects its own economic immigrants under a separate agreement with the federal government.',
        es: 'Quebec selecciona a sus propios inmigrantes económicos mediante un acuerdo específico con el gobierno federal.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['ca-irpr-s-87-1'],
    note: {
      en:
        'Meeting the class is not the same as being admitted. Candidates enter a pool and are invited to apply in ' +
        'periodic rounds ranked by a points score whose cut-off moves. Meridian does not predict cut-offs: a ' +
        'prediction of outcome is advice, and nobody here is licensed to give it.',
      es:
        'Cumplir los requisitos de la clase no equivale a ser admitido. Los candidatos entran en un fondo común y ' +
        'son invitados a solicitar en rondas periódicas ordenadas por una puntuación cuyo corte varía. Meridian no ' +
        'predice esos cortes: predecir un resultado es asesorar, y aquí nadie está habilitado para hacerlo.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const CA_PATHWAYS: readonly Pathway[] = [caCusmaProfessional, caExpressEntryCec];
