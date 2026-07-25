/**
 * Two worked-example matters.
 *
 * These are invented people with invented histories. Nothing here is real, no
 * document number is real, and no representative is real — this repository is
 * public, and a plausible-looking licence number is a liability even as test
 * data. See the deliberate note on representation at the bottom of this file.
 *
 * The facts are written to be *ordinary*, not to make the engine look good.
 * Where a criterion has no fact behind it, the fact is genuinely absent, and
 * the evaluator reports `unknown` rather than guessing — which is the behaviour
 * worth demonstrating, since a half-filled profile is what a real applicant has
 * on day one.
 */

import type { Applicant, IsoDate, Matter, Task, Tenant } from '@meridian/core';
import type { ApplicantFacts } from '@meridian/pathways';

import { bi, type Bi } from '@/lib/i18n';

import { c, d, range } from './common';

/** A task plus its Spanish title. `Task.title` in core is a single string. */
export interface SampleTask {
  readonly task: Task;
  readonly title: Bi;
  readonly detail?: Bi;
}

export interface SampleMatter {
  readonly matter: Matter;
  readonly applicant: Applicant;
  readonly tenant: Tenant;
  /** A short human label — the matter's own id is not a name. */
  readonly name: Bi;
  /** What this person is trying to achieve, in plain language. */
  readonly objective: Bi;
  readonly facts: ApplicantFacts;
  readonly tasks: readonly SampleTask[];
  /** The date the applicant is working toward lodging. Drives document freshness. */
  readonly targetSubmissionDate: IsoDate;
}

/**
 * A single self-serving tenant with no representatives.
 *
 * `individual` maps to the `applicant` audience in `@meridian/core`, which is
 * exactly the audience the advice boundary protects. Nothing in this portal
 * pretends otherwise, and no fictional licensed professional is invented to
 * make the gate open — the closed gate is the state worth showing.
 */
const individualTenant: Tenant = {
  id: 'tnt-sample-individual',
  kind: 'individual',
  displayName: 'Worked example — individual',
  homeJurisdiction: 'ES',
  representatives: [],
};

// ---------------------------------------------------------------------------
// Matter 1 — Spanish nationality by residence, two-year reduced period
// ---------------------------------------------------------------------------

const esApplicant: Applicant = {
  id: 'apl-sample-es',
  nationalities: [c('MX')],
  dateOfBirth: d('1991-03-14'),
};

/**
 * Legal residence is recorded as one unbroken authorised period, while the
 * presence ledger records a 229-day physical absence inside it.
 *
 * That is not a contradiction — it is the distinction the whole nationality
 * file turns on. A residence authorisation does not lapse because the holder
 * spent seven months abroad, so `residencePeriods` is continuous and the
 * two-year criterion in art. 22.1 is satisfied. Whether the residence was
 * *continuada* for art. 22.3 is a separate question, assessed against the
 * physical record on the day-counter page, and the answer there is not
 * comfortable.
 */
const esFacts: ApplicantFacts = {
  applicantId: esApplicant.id,
  nationalities: [c('MX')],
  claimedNationality: c('MX'),
  residenceHeldUnderNationality: c('MX'),
  dateOfBirth: d('1991-03-14'),
  targetJurisdiction: c('ES'),
  currentStatus: 'resident',
  residencePeriods: [range('2023-09-01', '2026-07-25')],
  absences: [
    range('2024-06-01', '2025-01-15'),
    range('2025-07-01', '2025-07-20'),
    range('2025-12-20', '2026-01-18'),
    range('2026-04-20', '2026-06-14'),
  ],
  examResults: [{ code: 'CCSE', passed: true, takenOn: d('2026-02-10') }],
  // No DELE is recorded, and none is needed: the exemption in RD 1004/2015
  // follows nationals of states where Spanish is an official language, which
  // Mexico is. The criterion resolves on nationality alone.
  criminalRecord: {
    selfDeclaredClear: true,
    certificates: [
      { jurisdiction: c('MX'), clear: true, issuedOn: d('2026-04-10'), apostilled: true },
      // No Spanish certificate is recorded yet. The civic-conduct criterion
      // needs both, so it will report as not recorded rather than as failed.
    ],
  },
  travelHistory: {
    priorRefusals: 0,
    priorOverstays: 0,
    priorRemovals: 0,
  },
};

const esTasks: readonly SampleTask[] = [
  {
    title: bi(
      'Confirm which nationality the residence is held under',
      'Confirmar bajo qué nacionalidad consta la residencia',
    ),
    detail: bi(
      'The two-year period attaches to the nationality the applicant was admitted and resides under, not simply to a passport they hold.',
      'El plazo de dos años se vincula a la nacionalidad con la que se fue admitido y se reside, no simplemente a un pasaporte que se posea.',
    ),
    task: {
      id: 'tsk-es-01',
      matterId: 'mtr-sample-es',
      phase: 'intake',
      title: 'Confirm which nationality the residence is held under',
      assignee: 'applicant',
      dependsOn: [],
      status: 'complete',
      citationIds: ['es-practice-claimed-nationality', 'es-cc-art-22-1'],
    },
  },
  {
    title: bi(
      'Record every entry to and departure from Spain',
      'Registrar todas las entradas y salidas de España',
    ),
    detail: bi(
      'Continuity under art. 22.3 is assessed on the physical record. Gaps in the record are treated as absence, which is the safe direction but overstates time away.',
      'La continuidad del art. 22.3 se valora sobre el registro físico. Los huecos del registro se tratan como ausencia, lo cual es la dirección prudente pero sobrestima el tiempo fuera.',
    ),
    task: {
      id: 'tsk-es-02',
      matterId: 'mtr-sample-es',
      phase: 'intake',
      title: 'Record every entry to and departure from Spain',
      assignee: 'applicant',
      dependsOn: [],
      status: 'complete',
      citationIds: ['es-cc-art-22-3'],
    },
  },
  {
    title: bi('Validate the passport data page', 'Validar la página de datos del pasaporte'),
    detail: bi(
      'Check digits in the machine-readable zone are recomputed locally. Nothing leaves the device and no document image is stored by this portal.',
      'Los dígitos de control de la zona de lectura mecánica se recalculan localmente. Nada sale del dispositivo y este portal no almacena imágenes de documentos.',
    ),
    task: {
      id: 'tsk-es-03',
      matterId: 'mtr-sample-es',
      phase: 'identity_validation',
      title: 'Validate the passport data page',
      assignee: 'platform',
      dependsOn: ['tsk-es-01'],
      status: 'complete',
      citationIds: [],
    },
  },
  {
    title: bi(
      'Confirm the residence card number and expiry',
      'Confirmar el número y la caducidad de la tarjeta de residencia',
    ),
    task: {
      id: 'tsk-es-04',
      matterId: 'mtr-sample-es',
      phase: 'identity_validation',
      title: 'Confirm the residence card number and expiry',
      assignee: 'applicant',
      dependsOn: ['tsk-es-03'],
      status: 'complete',
      citationIds: ['es-cc-art-22-3'],
    },
  },
  {
    title: bi(
      'Obtain the Mexican birth certificate with an apostille',
      'Obtener el acta de nacimiento mexicana con apostilla',
    ),
    task: {
      id: 'tsk-es-05',
      matterId: 'mtr-sample-es',
      phase: 'document_assembly',
      title: 'Obtain the Mexican birth certificate with an apostille',
      assignee: 'applicant',
      dependsOn: ['tsk-es-04'],
      status: 'complete',
      citationIds: ['hague-1961-art-3'],
    },
  },
  {
    title: bi(
      'Obtain a Mexican criminal-record certificate inside the acceptance window',
      'Obtener certificado de antecedentes penales mexicano dentro del plazo de aceptación',
    ),
    detail: bi(
      'The certificate already on file was issued on 2026-04-10 and has aged past the window the consulate applies in practice. A replacement is needed.',
      'El certificado que ya consta se emitió el 10-04-2026 y ha superado el plazo que el consulado aplica en la práctica. Hace falta uno nuevo.',
    ),
    task: {
      id: 'tsk-es-06',
      matterId: 'mtr-sample-es',
      phase: 'document_assembly',
      title: 'Obtain a Mexican criminal-record certificate inside the acceptance window',
      assignee: 'applicant',
      dependsOn: ['tsk-es-04'],
      status: 'in_progress',
      citationIds: ['es-cc-art-22-4'],
    },
  },
  {
    title: bi(
      'Obtain the Spanish criminal-record certificate',
      'Obtener el certificado de antecedentes penales español',
    ),
    task: {
      id: 'tsk-es-07',
      matterId: 'mtr-sample-es',
      phase: 'document_assembly',
      title: 'Obtain the Spanish criminal-record certificate',
      assignee: 'applicant',
      dependsOn: ['tsk-es-04'],
      status: 'locked',
      citationIds: ['es-cc-art-22-4'],
    },
  },
  {
    title: bi(
      'Have every document not in Castilian translated by a sworn translator',
      'Traducir por traductor jurado todo documento que no esté en castellano',
    ),
    detail: bi(
      'Translation is sequenced after legalisation on purpose: an apostille is itself a certificate bearing text, and translating before it arrives means paying the sworn translator twice.',
      'La traducción va después de la legalización a propósito: la apostilla es a su vez una certificación con texto, y traducir antes de recibirla supone pagar dos veces al traductor jurado.',
    ),
    task: {
      id: 'tsk-es-08',
      matterId: 'mtr-sample-es',
      phase: 'document_assembly',
      title: 'Have every document not in Castilian translated by a sworn translator',
      assignee: 'applicant',
      dependsOn: ['tsk-es-05', 'tsk-es-06'],
      status: 'locked',
      citationIds: ['es-ley-39-2015-art-15', 'es-traductor-jurado'],
    },
  },
  {
    title: bi(
      'Lodge the nationality application with the supporting file',
      'Presentar la solicitud de nacionalidad con el expediente documental',
    ),
    task: {
      id: 'tsk-es-09',
      matterId: 'mtr-sample-es',
      phase: 'submission',
      title: 'Lodge the nationality application with the supporting file',
      assignee: 'applicant',
      dependsOn: ['tsk-es-07', 'tsk-es-08'],
      status: 'locked',
      citationIds: ['es-cc-art-22-3'],
    },
  },
  {
    title: bi(
      'Respond to any request for further documents',
      'Atender cualquier requerimiento de documentación adicional',
    ),
    detail: bi(
      'Assigned to an authorised representative. No representative is attached to this matter, so this task has no owner.',
      'Asignada a un representante autorizado. No hay representante vinculado a este expediente, por lo que esta tarea no tiene responsable.',
    ),
    task: {
      id: 'tsk-es-10',
      matterId: 'mtr-sample-es',
      phase: 'post_arrival_tracking',
      title: 'Respond to any request for further documents',
      assignee: 'representative',
      dependsOn: ['tsk-es-09'],
      status: 'locked',
      citationIds: [],
    },
  },
  {
    title: bi(
      'Swear or promise allegiance and register the acquisition',
      'Jurar o prometer fidelidad e inscribir la adquisición',
    ),
    detail: bi(
      'Art. 23 makes the acquisition effective only on the oath or promise, the renunciation where it applies, and entry in the Civil Registry. Mexican nationals are excused the renunciation under art. 24.1.',
      'El art. 23 condiciona la eficacia de la adquisición al juramento o promesa, a la renuncia cuando proceda y a la inscripción en el Registro Civil. Los nacionales mexicanos están exentos de la renuncia conforme al art. 24.1.',
    ),
    task: {
      id: 'tsk-es-11',
      matterId: 'mtr-sample-es',
      phase: 'status_transition',
      title: 'Swear or promise allegiance and register the acquisition',
      assignee: 'applicant',
      dependsOn: ['tsk-es-09'],
      status: 'locked',
      citationIds: ['es-cc-art-23', 'es-cc-art-24-1'],
    },
  },
];

const esMatter: SampleMatter = {
  matter: {
    id: 'mtr-sample-es',
    tenantId: individualTenant.id,
    applicantId: esApplicant.id,
    pathwayId: 'es-nationality-residence-reduced',
    targetJurisdiction: c('ES'),
    claimedNationality: c('MX'),
    status: 'awaiting_applicant',
    phase: 'document_assembly',
    openedOn: d('2026-03-02'),
    representativeId: null,
  },
  applicant: esApplicant,
  tenant: individualTenant,
  name: bi(
    'Spanish nationality by residence',
    'Nacionalidad española por residencia',
  ),
  objective: bi(
    'A Mexican national resident in Spain since September 2023, applying for Spanish nationality under the two-year reduced residence period.',
    'Nacional mexicana residente en España desde septiembre de 2023, que solicita la nacionalidad española por el plazo reducido de dos años.',
  ),
  facts: esFacts,
  tasks: esTasks,
  targetSubmissionDate: d('2026-10-01'),
};

// ---------------------------------------------------------------------------
// Matter 2 — CUSMA professional work permit for Canada
// ---------------------------------------------------------------------------

const caApplicant: Applicant = {
  id: 'apl-sample-ca',
  nationalities: [c('MX')],
  dateOfBirth: d('1994-11-02'),
};

const caFacts: ApplicantFacts = {
  applicantId: caApplicant.id,
  nationalities: [c('MX')],
  claimedNationality: c('MX'),
  dateOfBirth: d('1994-11-02'),
  targetJurisdiction: c('CA'),
  currentStatus: 'worker',
  educationLevel: 'master',
  educationField: 'economics',
  educationCountry: c('MX'),
  professionalCredentials: [
    {
      kind: 'degree',
      title: 'Maestría en Economía',
      level: 'master',
      field: 'economics',
      issuingCountry: c('MX'),
      issuedOn: d('2019-06-28'),
      verified: false,
    },
  ],
  professionalExperienceYears: 6,
  employmentType: 'employee',
  jobOffer: {
    employerCountry: c('CA'),
    occupationTaxonomy: 'cusma_appendix_2',
    occupationCode: 'economist',
    fullTime: true,
    durationMonths: 24,
    writtenOffer: true,
    selfEmployment: false,
  },
  intent: { temporary: true },
  criminalRecord: { selfDeclaredClear: true },
};

const caTasks: readonly SampleTask[] = [
  {
    title: bi('Confirm citizenship of a CUSMA party', 'Confirmar la nacionalidad de una parte del T-MEC'),
    detail: bi(
      'Permanent residence in Mexico or the United States is not citizenship of it, and the route is closed to anyone holding neither.',
      'La residencia permanente en México o Estados Unidos no equivale a su nacionalidad, y la vía está cerrada a quien no ostente ninguna de las dos.',
    ),
    task: {
      id: 'tsk-ca-01',
      matterId: 'mtr-sample-ca',
      phase: 'intake',
      title: 'Confirm citizenship of a CUSMA party',
      assignee: 'applicant',
      dependsOn: [],
      status: 'complete',
      citationIds: ['ca-cusma-citizenship-requirement'],
    },
  },
  {
    title: bi(
      'Record the offered occupation against the treaty list',
      'Registrar la ocupación ofrecida frente a la lista del tratado',
    ),
    task: {
      id: 'tsk-ca-02',
      matterId: 'mtr-sample-ca',
      phase: 'intake',
      title: 'Record the offered occupation against the treaty list',
      assignee: 'employer',
      dependsOn: [],
      status: 'complete',
      citationIds: ['ca-cusma-annex-16a-appendix-2'],
    },
  },
  {
    title: bi('Validate the passport data page', 'Validar la página de datos del pasaporte'),
    task: {
      id: 'tsk-ca-03',
      matterId: 'mtr-sample-ca',
      phase: 'identity_validation',
      title: 'Validate the passport data page',
      assignee: 'platform',
      dependsOn: ['tsk-ca-01'],
      status: 'complete',
      citationIds: [],
    },
  },
  {
    title: bi(
      'Confirm the passport is valid for the whole intended stay',
      'Confirmar que el pasaporte cubre toda la estancia prevista',
    ),
    task: {
      id: 'tsk-ca-04',
      matterId: 'mtr-sample-ca',
      phase: 'identity_validation',
      title: 'Confirm the passport is valid for the whole intended stay',
      assignee: 'applicant',
      dependsOn: ['tsk-ca-03'],
      status: 'in_progress',
      citationIds: [],
    },
  },
  {
    title: bi(
      'Obtain a written offer of employment signed by the employer',
      'Obtener oferta de empleo por escrito firmada por el empleador',
    ),
    task: {
      id: 'tsk-ca-05',
      matterId: 'mtr-sample-ca',
      phase: 'document_assembly',
      title: 'Obtain a written offer of employment signed by the employer',
      assignee: 'employer',
      dependsOn: ['tsk-ca-02'],
      status: 'locked',
      citationIds: ['ca-cusma-annex-16a-appendix-2', 'ca-irpr-s-204'],
    },
  },
  {
    title: bi(
      'Obtain a certified translation of the degree certificate',
      'Obtener traducción certificada del título universitario',
    ),
    task: {
      id: 'tsk-ca-06',
      matterId: 'mtr-sample-ca',
      phase: 'document_assembly',
      title: 'Obtain a certified translation of the degree certificate',
      assignee: 'applicant',
      dependsOn: ['tsk-ca-04'],
      status: 'locked',
      citationIds: ['ca-official-languages-act', 'ca-ircc-translation'],
    },
  },
  {
    title: bi('Submit the work-permit application', 'Presentar la solicitud de permiso de trabajo'),
    task: {
      id: 'tsk-ca-07',
      matterId: 'mtr-sample-ca',
      phase: 'submission',
      title: 'Submit the work-permit application',
      assignee: 'applicant',
      dependsOn: ['tsk-ca-05', 'tsk-ca-06'],
      status: 'locked',
      citationIds: ['ca-irpr-s-204'],
    },
  },
];

const caMatter: SampleMatter = {
  matter: {
    id: 'mtr-sample-ca',
    tenantId: individualTenant.id,
    applicantId: caApplicant.id,
    pathwayId: 'ca-cusma-professional',
    targetJurisdiction: c('CA'),
    claimedNationality: c('MX'),
    status: 'active',
    phase: 'identity_validation',
    openedOn: d('2026-06-11'),
    representativeId: null,
  },
  applicant: caApplicant,
  tenant: individualTenant,
  name: bi('CUSMA professional work permit', 'Permiso de trabajo T-MEC'),
  objective: bi(
    'A Mexican economist with a written offer from a Canadian employer, seeking a work permit under the trade agreement. Already spending long periods in Canada, so the tax day count matters.',
    'Economista mexicano con oferta escrita de un empleador canadiense, que solicita un permiso de trabajo al amparo del tratado comercial. Ya pasa largas temporadas en Canadá, por lo que el cómputo fiscal de días es relevante.',
  ),
  facts: caFacts,
  tasks: caTasks,
  targetSubmissionDate: d('2026-08-20'),
};

// ---------------------------------------------------------------------------

export const SAMPLE_MATTERS: readonly SampleMatter[] = [esMatter, caMatter];

export function sampleMatterById(id: string): SampleMatter | null {
  return SAMPLE_MATTERS.find((m) => m.matter.id === id) ?? null;
}

