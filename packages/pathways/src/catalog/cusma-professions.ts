/**
 * Professions listed in Appendix 2 to Annex 16-A of the Canada-United States-Mexico
 * Agreement, with the minimum credential each entry carries.
 *
 * **This is a subset, and that matters.** Appendix 2 lists more professions than
 * are encoded here; only entries whose title and credential requirement could be
 * stated with confidence are included. The consequence is designed for rather
 * than tolerated: a profession that is genuinely on Appendix 2 but absent from
 * this table must never be reported as "not on the list". The CUSMA pathway
 * therefore routes an unrecognised occupation to human review instead of to a
 * negative finding — see `ca-cusma-listed-profession` in `./ca.ts`. An
 * incomplete catalog that says "I don't know" is safe; one that says "no" is not.
 *
 * The Spanish titles are working translations for display. They are not the
 * authoritative Spanish text of the treaty, and nothing in the engine keys off
 * them.
 *
 * The alternative routes to a listed profession — a post-secondary diploma plus
 * experience, or a state or provincial licence in place of a degree — are part
 * of the Appendix entries themselves, not officer discretion, so they are
 * encoded as data rather than left to a note.
 */

import type { EducationLevel } from '../facts.js';
import type { LocalizedText } from '../schema.js';

export type CusmaProfessionCategory = 'general' | 'medical_allied' | 'scientist' | 'teacher';

export interface CusmaProfession {
  /** Stable snake_case id. This is the value `jobOffer.occupationCode` carries for this pathway. */
  readonly id: string;
  readonly title: LocalizedText;
  readonly category: CusmaProfessionCategory;
  /**
   * The education level that satisfies the entry outright, on {@link
   * import('../facts.js').EDUCATION_SCALE}. Most entries read "Baccalaureate or
   * Licenciatura Degree", which is `bachelor` here.
   */
  readonly minimumEducationLevel: EducationLevel;
  /** Years of experience that, with a post-secondary diploma, substitute for the degree. */
  readonly diplomaPlusExperienceYears?: number;
  /** Whether a state or provincial licence is an accepted alternative to the degree. */
  readonly licenceAlternative?: boolean;
  /**
   * Set where the entry is known to attract heightened scrutiny at the port of
   * entry. Not a legal disqualification — a routing decision.
   */
  readonly requiresHumanReview?: boolean;
  readonly note?: LocalizedText;
}

export const CUSMA_PROFESSIONS: readonly CusmaProfession[] = [
  // --- General ------------------------------------------------------------
  {
    id: 'accountant',
    title: { en: 'Accountant', es: 'Contador' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
    note: {
      en: 'A recognised accounting designation is an accepted alternative to the degree.',
      es: 'Una designación contable reconocida sustituye al título.',
    },
  },
  {
    id: 'architect',
    title: { en: 'Architect', es: 'Arquitecto' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'computer_systems_analyst',
    title: { en: 'Computer Systems Analyst', es: 'Analista de sistemas informáticos' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
    requiresHumanReview: true,
    note: {
      en:
        'Officers examine closely whether the work is genuinely systems analysis. Software development, ' +
        'programming and general IT support are not listed professions, and a job description that reads as ' +
        'development work is routinely refused under this entry.',
      es:
        'Los oficiales examinan con detalle si el trabajo es realmente análisis de sistemas. El desarrollo de ' +
        'software, la programación y el soporte informático general no figuran como profesiones listadas, y una ' +
        'descripción de puesto que parezca desarrollo suele rechazarse bajo este epígrafe.',
    },
  },
  {
    id: 'disaster_relief_insurance_claims_adjuster',
    title: {
      en: 'Disaster Relief Insurance Claims Adjuster',
      es: 'Ajustador de siniestros de seguros en casos de desastre',
    },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    note: {
      en:
        'The entry pairs the degree with completed training in the relevant areas of insurance adjustment, and ' +
        'admits experience in claims adjustment as an alternative. Both limbs need checking against the ' +
        'Appendix text for the individual case.',
      es:
        'El epígrafe combina el título con formación acreditada en ajuste de siniestros y admite la experiencia ' +
        'como alternativa. Ambas vías deben contrastarse con el texto del Apéndice en cada caso.',
    },
  },
  {
    id: 'economist',
    title: { en: 'Economist', es: 'Economista' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'engineer',
    title: { en: 'Engineer', es: 'Ingeniero' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'forester',
    title: { en: 'Forester', es: 'Ingeniero forestal' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'graphic_designer',
    title: { en: 'Graphic Designer', es: 'Diseñador gráfico' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
  },
  {
    id: 'hotel_manager',
    title: { en: 'Hotel Manager', es: 'Gerente de hotel' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
    note: {
      en: 'The degree or diploma must be in hotel or restaurant management specifically.',
      es: 'El título o diploma debe ser específicamente en gestión hotelera o de restauración.',
    },
  },
  {
    id: 'industrial_designer',
    title: { en: 'Industrial Designer', es: 'Diseñador industrial' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
  },
  {
    id: 'interior_designer',
    title: { en: 'Interior Designer', es: 'Diseñador de interiores' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
  },
  {
    id: 'land_surveyor',
    title: { en: 'Land Surveyor', es: 'Agrimensor' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'landscape_architect',
    title: { en: 'Landscape Architect', es: 'Arquitecto paisajista' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'lawyer',
    title: { en: 'Lawyer', es: 'Abogado' },
    category: 'general',
    minimumEducationLevel: 'professional_degree',
    licenceAlternative: true,
    note: {
      en:
        'Membership of a state or provincial bar is an accepted alternative to the law degree. A plain ' +
        'baccalaureate does not satisfy this entry.',
      es:
        'La colegiación en un colegio de abogados estatal o provincial sustituye al título en Derecho. Una ' +
        'licenciatura genérica no cumple este epígrafe.',
    },
  },
  {
    id: 'librarian',
    title: { en: 'Librarian', es: 'Bibliotecario' },
    category: 'general',
    minimumEducationLevel: 'master',
    note: {
      en:
        'The entry requires a library-science master’s, or a bachelor’s in library science for which another ' +
        'degree was a prerequisite.',
      es:
        'El epígrafe exige un máster en biblioteconomía, o una licenciatura en biblioteconomía para la que otro ' +
        'título fuera requisito previo.',
    },
  },
  {
    id: 'management_consultant',
    title: { en: 'Management Consultant', es: 'Consultor de gestión' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    requiresHumanReview: true,
    note: {
      en:
        'The most heavily scrutinised entry in Appendix 2. The engagement must be genuinely consultative — ' +
        'advising on management, not filling an operational role — and must ordinarily be with an independent ' +
        'contract for a defined term. The Appendix also admits five years of experience as a management ' +
        'consultant, or in the field of the consulting agreement, in place of the degree. Whether a particular ' +
        'engagement is consulting rather than employment is an officer’s judgement, not an arithmetic test, so ' +
        'this route is never decided automatically.',
      es:
        'El epígrafe más escrutado del Apéndice 2. El encargo debe ser genuinamente consultivo —asesorar sobre ' +
        'gestión, no cubrir un puesto operativo— y normalmente responder a un contrato independiente y de ' +
        'duración determinada. El Apéndice admite además cinco años de experiencia como consultor de gestión, o ' +
        'en el ámbito del contrato de consultoría, en lugar del título. Determinar si un encargo concreto es ' +
        'consultoría y no empleo corresponde al criterio del oficial, no a un cálculo, por lo que esta vía nunca ' +
        'se resuelve de forma automática.',
    },
  },
  {
    id: 'mathematician',
    title: { en: 'Mathematician (including Statistician)', es: 'Matemático (incluido estadístico)' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'research_assistant',
    title: { en: 'Research Assistant', es: 'Asistente de investigación' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    note: {
      en: 'The entry applies only to research assistants working in a post-secondary educational institution.',
      es: 'El epígrafe solo cubre a los asistentes de investigación en instituciones de educación superior.',
    },
  },
  {
    id: 'scientific_technician',
    title: {
      en: 'Scientific Technician / Technologist',
      es: 'Técnico o tecnólogo científico',
    },
    category: 'general',
    minimumEducationLevel: 'none',
    requiresHumanReview: true,
    note: {
      en:
        'This entry has no education threshold. It turns instead on theoretical knowledge of a listed scientific ' +
        'discipline, the ability to apply it to practical problems, and work in direct support of a professional ' +
        'in that discipline. Because none of those are arithmetic, the entry is always routed to a person; a ' +
        'green tick from software would be meaningless here.',
      es:
        'Este epígrafe no fija un umbral educativo. Depende del conocimiento teórico de una disciplina científica ' +
        'listada, de la capacidad de aplicarlo a problemas prácticos y de trabajar en apoyo directo de un ' +
        'profesional de esa disciplina. Como nada de ello es aritmético, siempre se deriva a revisión humana.',
    },
  },
  {
    id: 'social_worker',
    title: { en: 'Social Worker', es: 'Trabajador social' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'technical_publications_writer',
    title: { en: 'Technical Publications Writer', es: 'Redactor de publicaciones técnicas' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
  },
  {
    id: 'urban_planner',
    title: { en: 'Urban Planner (including Geographer)', es: 'Urbanista (incluido geógrafo)' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'vocational_counsellor',
    title: { en: 'Vocational Counsellor', es: 'Orientador vocacional' },
    category: 'general',
    minimumEducationLevel: 'bachelor',
  },

  // --- Medical and allied -------------------------------------------------
  {
    id: 'dentist',
    title: { en: 'Dentist', es: 'Odontólogo' },
    category: 'medical_allied',
    minimumEducationLevel: 'professional_degree',
    licenceAlternative: true,
  },
  {
    id: 'dietitian',
    title: { en: 'Dietitian', es: 'Dietista' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'medical_laboratory_technologist',
    title: {
      en: 'Medical Laboratory Technologist / Medical Technologist',
      es: 'Tecnólogo de laboratorio médico',
    },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    diplomaPlusExperienceYears: 3,
  },
  {
    id: 'nutritionist',
    title: { en: 'Nutritionist', es: 'Nutriólogo' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'occupational_therapist',
    title: { en: 'Occupational Therapist', es: 'Terapeuta ocupacional' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'pharmacist',
    title: { en: 'Pharmacist', es: 'Farmacéutico' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'physician',
    title: { en: 'Physician (teaching or research only)', es: 'Médico (solo docencia o investigación)' },
    category: 'medical_allied',
    minimumEducationLevel: 'professional_degree',
    licenceAlternative: true,
    requiresHumanReview: true,
    note: {
      en:
        'The entry covers teaching and research only. Clinical practice is outside it, and an offer that mixes ' +
        'the two needs a person to look at the actual duties before anything is said about admissibility.',
      es:
        'El epígrafe cubre únicamente docencia e investigación. La práctica clínica queda fuera, y una oferta que ' +
        'mezcle ambas exige que una persona revise las funciones reales antes de pronunciarse.',
    },
  },
  {
    id: 'physiotherapist',
    title: { en: 'Physiotherapist / Physical Therapist', es: 'Fisioterapeuta' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
  },
  {
    id: 'psychologist',
    title: { en: 'Psychologist', es: 'Psicólogo' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
    note: {
      en: 'For Mexican nationals the entry is satisfied by a Licenciatura; otherwise a state or provincial licence is required.',
      es: 'Para nacionales mexicanos basta la licenciatura; en otro caso se exige licencia estatal o provincial.',
    },
  },
  {
    id: 'recreational_therapist',
    title: { en: 'Recreational Therapist', es: 'Terapeuta recreativo' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'registered_nurse',
    title: { en: 'Registered Nurse', es: 'Enfermero titulado' },
    category: 'medical_allied',
    minimumEducationLevel: 'bachelor',
    licenceAlternative: true,
    note: {
      en: 'For Mexican nationals the entry is satisfied by a Licenciatura; otherwise a state or provincial licence is required.',
      es: 'Para nacionales mexicanos basta la licenciatura; en otro caso se exige licencia estatal o provincial.',
    },
  },
  {
    id: 'veterinarian',
    title: { en: 'Veterinarian', es: 'Veterinario' },
    category: 'medical_allied',
    minimumEducationLevel: 'professional_degree',
    licenceAlternative: true,
  },

  // --- Scientists ---------------------------------------------------------
  {
    id: 'agriculturist',
    title: { en: 'Agriculturist (including Agronomist)', es: 'Agricultor titulado (incluido agrónomo)' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'animal_breeder',
    title: { en: 'Animal Breeder', es: 'Criador de animales' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'animal_scientist',
    title: { en: 'Animal Scientist', es: 'Zootecnista' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'apiculturist',
    title: { en: 'Apiculturist', es: 'Apicultor titulado' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'astronomer',
    title: { en: 'Astronomer', es: 'Astrónomo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'biochemist',
    title: { en: 'Biochemist', es: 'Bioquímico' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'biologist',
    title: { en: 'Biologist', es: 'Biólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'chemist',
    title: { en: 'Chemist', es: 'Químico' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'dairy_scientist',
    title: { en: 'Dairy Scientist', es: 'Especialista en ciencia láctea' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'entomologist',
    title: { en: 'Entomologist', es: 'Entomólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'epidemiologist',
    title: { en: 'Epidemiologist', es: 'Epidemiólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'geneticist',
    title: { en: 'Geneticist', es: 'Genetista' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'geochemist',
    title: { en: 'Geochemist', es: 'Geoquímico' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'geologist',
    title: { en: 'Geologist', es: 'Geólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'geophysicist',
    title: { en: 'Geophysicist', es: 'Geofísico' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'horticulturist',
    title: { en: 'Horticulturist', es: 'Horticultor titulado' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'meteorologist',
    title: { en: 'Meteorologist', es: 'Meteorólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'pharmacologist',
    title: { en: 'Pharmacologist', es: 'Farmacólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'physicist',
    title: { en: 'Physicist', es: 'Físico' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'plant_breeder',
    title: { en: 'Plant Breeder', es: 'Fitomejorador' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'poultry_scientist',
    title: { en: 'Poultry Scientist', es: 'Especialista en avicultura' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'soil_scientist',
    title: { en: 'Soil Scientist', es: 'Edafólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'zoologist',
    title: { en: 'Zoologist', es: 'Zoólogo' },
    category: 'scientist',
    minimumEducationLevel: 'bachelor',
  },

  // --- Teachers -----------------------------------------------------------
  {
    id: 'college_teacher',
    title: { en: 'College Teacher', es: 'Profesor de colegio superior' },
    category: 'teacher',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'seminary_teacher',
    title: { en: 'Seminary Teacher', es: 'Profesor de seminario' },
    category: 'teacher',
    minimumEducationLevel: 'bachelor',
  },
  {
    id: 'university_teacher',
    title: { en: 'University Teacher', es: 'Profesor universitario' },
    category: 'teacher',
    minimumEducationLevel: 'bachelor',
  },
];

const BY_ID = new Map(CUSMA_PROFESSIONS.map((p) => [p.id, p]));

/** `null` when the id is not in this subset — which is not the same as "not on Appendix 2". */
export function cusmaProfession(id: string): CusmaProfession | null {
  return BY_ID.get(id) ?? null;
}

export const CUSMA_PROFESSION_IDS: readonly string[] = CUSMA_PROFESSIONS.map((p) => p.id);

/** Entries routed to a person regardless of how cleanly the credentials line up. */
export const CUSMA_HEIGHTENED_SCRUTINY_PROFESSION_IDS: readonly string[] = CUSMA_PROFESSIONS.filter(
  (p) => p.requiresHumanReview === true,
).map((p) => p.id);
