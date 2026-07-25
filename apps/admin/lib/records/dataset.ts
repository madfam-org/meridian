/**
 * The console's working record set.
 *
 * **What this is.** `apps/api` is an empty shell today — there is no service to
 * read matters from — so the firm console reads from this in-process store.
 * Every person, file reference, licence number and document number below is
 * invented. There is no real applicant, no real licence, and no real travel
 * document number anywhere in this file, and there must never be: this
 * repository is public.
 *
 * **What it is not.** It is not a mock standing in for a computation. Nothing
 * downstream reads a pre-baked total, a pre-baked status, or a pre-baked
 * "days remaining". Every figure the console renders is derived from these
 * records at request time by `lib/caseload.ts`, `lib/roster.ts`,
 * `lib/catalog-review.ts` and `lib/audit-trail.ts`, using `@meridian/core` for
 * the arithmetic and the domain packages for the legal routing. Swap this module
 * for a database reader and not one derivation changes.
 *
 * **Why the states are ugly.** A record set where everything is fine teaches a
 * reader nothing and hides every code path that matters. So the set deliberately
 * contains a lapsed credential still gating a live file, a representative
 * licensed in the wrong jurisdiction, a police certificate that will be out of
 * its acceptance window on the target filing date, a matter with nobody
 * accountable for it, a matter pointing at a pathway that is no longer in the
 * catalog, and a client still holding status under a route that has since been
 * repealed. Each of those is a thing that happens in a real caseload and each is
 * something the console exists to surface.
 *
 * The `empty` dataset is a real dataset, not a test fixture: a firm on its first
 * day has no matters, and every page has to render that as *empty* rather than
 * as a broken demo.
 */

import {
  countryCode,
  isoDate,
  type IsoDate,
  type Matter,
  type Task,
} from '@meridian/core';
import {
  CASTILIAN,
  ENGLISH,
  NOT_LEGALISED,
  PORTUGUESE,
  languageTag,
  untranslated,
  type Document,
  type LanguageTag,
} from '@meridian/documents';
import type {
  ApplicantRecord,
  AuditRecord,
  FirmRecords,
  MatterRecord,
  RepresentativeRecord,
} from '@/lib/records/types';

const C = countryCode;
const D = isoDate;

const TENANT_ID = 'tenant-cordillera';
const MADRID = 'Europe/Madrid';
const TORONTO = 'America/Toronto';

const UKRAINIAN = languageTag('uk');
const HINDI = languageTag('hi');
const MANDARIN = languageTag('zh');
const FILIPINO = languageTag('fil');

/* -------------------------------------------------------------------------- */
/* Roster                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Four standings, chosen so the roster page has something to say.
 *
 * Licence numbers are prefixed `SAMPLE-` so that no reader, and no scraper, can
 * mistake one for an entry in a real public register. The regulators named are
 * real bodies — naming the actual regulator is the whole point of the field —
 * but nothing here asserts that any of these people exist.
 */
const REPRESENTATIVES: readonly RepresentativeRecord[] = [
  {
    credential: {
      id: 'rep-vega',
      jurisdiction: 'ES',
      credential: 'spanish_abogado',
      licenceNumber: 'SAMPLE-ICAM-000114',
      verifiedOn: '2026-06-12',
      expiresOn: '2027-03-31',
    },
    displayName: 'Marisol Vega Aguirre',
    regulator: 'Ilustre Colegio de la Abogacía de Madrid (ICAM)',
    publicRegister: 'ICAM censo de colegiados',
    note: 'Carries the Spanish nationality files.',
  },
  {
    credential: {
      id: 'rep-serra',
      jurisdiction: 'ES',
      credential: 'spanish_gestor',
      licenceNumber: 'SAMPLE-COGAM-04471',
      verifiedOn: '2026-07-01',
      // No expiry recorded. Deliberately distinct from "expires far away" — the
      // roster must not render an unknown as a reassurance.
    },
    displayName: 'Núria Serra Ponç',
    regulator: 'Colegio Oficial de Gestores Administrativos de Madrid',
    publicRegister: 'COGAM registro de colegiados',
  },
  {
    credential: {
      id: 'rep-okonkwo',
      jurisdiction: 'CA',
      credential: 'rcic',
      licenceNumber: 'SAMPLE-R000000',
      verifiedOn: '2026-01-08',
      expiresOn: '2026-08-31',
    },
    displayName: 'Adaeze Okonkwo',
    regulator: 'College of Immigration and Citizenship Consultants (CICC)',
    publicRegister: 'CICC public register of licensees',
    note: 'Renewal window opens 60 days before expiry.',
  },
  {
    credential: {
      id: 'rep-lambert',
      jurisdiction: 'CA',
      credential: 'canadian_lawyer',
      licenceNumber: 'SAMPLE-LSO-00000P',
      verifiedOn: '2025-11-20',
      expiresOn: '2026-06-30',
    },
    displayName: 'Yves Lambert',
    regulator: 'Law Society of Ontario',
    publicRegister: 'LSO Lawyer and Paralegal Directory',
    note: 'Standing recorded as lapsed pending confirmation of annual filing.',
  },
];

/* -------------------------------------------------------------------------- */
/* Applicants                                                                 */
/* -------------------------------------------------------------------------- */

const APPLICANTS: readonly ApplicantRecord[] = [
  {
    id: 'app-0001',
    reference: 'AP-0001',
    familyName: 'Rivas Peredo',
    givenNames: 'Camila',
    nationalities: [C('MX')],
    dateOfBirth: D('1991-04-18'),
  },
  {
    id: 'app-0002',
    reference: 'AP-0002',
    familyName: 'Ocampo Restrepo',
    givenNames: 'Julián',
    nationalities: [C('CO')],
    dateOfBirth: D('1978-11-30'),
  },
  {
    id: 'app-0003',
    reference: 'AP-0003',
    familyName: 'Barragán Nieto',
    givenNames: 'Tomás',
    nationalities: [C('MX')],
    dateOfBirth: D('1988-02-29'),
  },
  {
    id: 'app-0004',
    reference: 'AP-0004',
    familyName: 'Nogueira Vasques',
    givenNames: 'Beatriz',
    nationalities: [C('BR'), C('PT')],
    dateOfBirth: D('1994-09-07'),
  },
  {
    id: 'app-0005',
    reference: 'AP-0005',
    familyName: 'Iyer Raghunathan',
    givenNames: 'Meera',
    nationalities: [C('IN')],
    dateOfBirth: D('1990-06-21'),
  },
  {
    id: 'app-0006',
    reference: 'AP-0006',
    familyName: 'Zhao',
    givenNames: 'Wenlin',
    nationalities: [C('CN')],
  },
  {
    id: 'app-0007',
    reference: 'AP-0007',
    familyName: 'Bianchi Aldaz',
    givenNames: 'Renata',
    nationalities: [C('AR'), C('IT')],
    dateOfBirth: D('1986-12-03'),
  },
  {
    id: 'app-0008',
    reference: 'AP-0008',
    familyName: 'Kovalenko Pryimak',
    givenNames: 'Danylo',
    nationalities: [C('UA')],
    dateOfBirth: D('1983-01-15'),
  },
  {
    id: 'app-0009',
    reference: 'AP-0009',
    familyName: 'Whitfield',
    givenNames: 'Marcus',
    nationalities: [C('US')],
    dateOfBirth: D('1995-07-25'),
  },
  {
    id: 'app-0010',
    reference: 'AP-0010',
    familyName: 'Delacruz Bonifacio',
    givenNames: 'Aniceto',
    nationalities: [C('PH')],
    dateOfBirth: D('1972-03-11'),
  },
  {
    id: 'app-0011',
    reference: 'AP-0011',
    familyName: 'Salas Iriondo',
    givenNames: 'Emilia',
    nationalities: [C('CL')],
    dateOfBirth: D('1980-08-19'),
  },
];

/* -------------------------------------------------------------------------- */
/* Construction helpers                                                       */
/* -------------------------------------------------------------------------- */

interface MatterSpec {
  readonly id: string;
  readonly reference: string;
  readonly title: string;
  readonly applicantId: string;
  readonly pathwayId: string;
  readonly targetJurisdiction: string;
  readonly claimedNationality: string;
  readonly status: Matter['status'];
  readonly phase: Matter['phase'];
  readonly openedOn: string;
  readonly representativeId: string | null;
  readonly closedOn?: string;
  readonly statusExpiresOn?: string;
  readonly targetSubmissionDate?: string;
  readonly receivingRegion?: string;
  readonly defaultDocumentLanguage: MatterRecord['defaultDocumentLanguage'];
  readonly tasks: readonly TaskSpec[];
  readonly documents: readonly Document[];
}

interface TaskSpec {
  readonly id: string;
  readonly phase: Task['phase'];
  readonly title: string;
  readonly assignee: Task['assignee'];
  readonly dependsOn: readonly string[];
  readonly status: Task['status'];
  readonly dueOn?: string;
  readonly citationIds: readonly string[];
}

function buildMatter(spec: MatterSpec): MatterRecord {
  const matter: Matter = {
    id: spec.id,
    tenantId: TENANT_ID,
    applicantId: spec.applicantId,
    pathwayId: spec.pathwayId,
    targetJurisdiction: C(spec.targetJurisdiction),
    claimedNationality: C(spec.claimedNationality),
    status: spec.status,
    phase: spec.phase,
    openedOn: D(spec.openedOn),
    representativeId: spec.representativeId,
    ...(spec.closedOn === undefined ? {} : { closedOn: D(spec.closedOn) }),
  };

  const tasks: Task[] = spec.tasks.map((t) => ({
    id: t.id,
    matterId: spec.id,
    phase: t.phase,
    title: t.title,
    assignee: t.assignee,
    dependsOn: t.dependsOn,
    status: t.status,
    ...(t.dueOn === undefined ? {} : { dueOn: D(t.dueOn) }),
    citationIds: t.citationIds,
  }));

  return {
    matter,
    reference: spec.reference,
    title: spec.title,
    ...(spec.statusExpiresOn === undefined ? {} : { statusExpiresOn: D(spec.statusExpiresOn) }),
    ...(spec.targetSubmissionDate === undefined
      ? {}
      : { targetSubmissionDate: D(spec.targetSubmissionDate) }),
    ...(spec.receivingRegion === undefined ? {} : { receivingRegion: spec.receivingRegion }),
    defaultDocumentLanguage: spec.defaultDocumentLanguage,
    tasks,
    documents: spec.documents,
  };
}

interface DocSpec {
  readonly id: string;
  readonly kind: Document['kind'];
  readonly issuingCountry: string;
  readonly issuedOn?: string;
  readonly expiresOn?: string;
  readonly status: Document['status'];
  readonly legalisation?: Document['legalisation'];
  readonly translation?: Document['translation'];
  readonly verifiedBy?: string;
}

function doc(spec: DocSpec): Document {
  return {
    id: spec.id,
    kind: spec.kind,
    issuingCountry: C(spec.issuingCountry),
    ...(spec.issuedOn === undefined ? {} : { issuedOn: D(spec.issuedOn) }),
    ...(spec.expiresOn === undefined ? {} : { expiresOn: D(spec.expiresOn) }),
    status: spec.status,
    legalisation: spec.legalisation ?? NOT_LEGALISED,
    translation: spec.translation ?? untranslated(CASTILIAN),
    ...(spec.verifiedBy === undefined ? {} : { verifiedBy: spec.verifiedBy }),
  };
}

function apostilled(on: string, reference: string): Document['legalisation'] {
  return { route: 'apostille', completedOn: D(on), reference };
}

function swornInto(
  source: LanguageTag,
  target: LanguageTag,
  on: string,
  reference: string,
): Document['translation'] {
  return {
    sourceLanguage: source,
    intoLanguage: target,
    standard: 'sworn_traductor_jurado',
    completedOn: D(on),
    translatorReference: reference,
  };
}

/* -------------------------------------------------------------------------- */
/* Matters                                                                    */
/* -------------------------------------------------------------------------- */

const MATTER_SPECS: readonly MatterSpec[] = [
  {
    id: 'mat-0001',
    reference: 'MDR-2024-0117',
    title: 'Spanish nationality by two-year residence',
    applicantId: 'app-0001',
    pathwayId: 'es-nationality-residence-reduced',
    targetJurisdiction: 'ES',
    claimedNationality: 'MX',
    status: 'active',
    phase: 'document_assembly',
    openedOn: '2024-11-04',
    representativeId: 'rep-vega',
    statusExpiresOn: '2027-02-14',
    targetSubmissionDate: '2026-09-15',
    defaultDocumentLanguage: CASTILIAN,
    documents: [
      doc({
        id: 'doc-0001',
        kind: 'passport',
        issuingCountry: 'MX',
        issuedOn: '2019-03-03',
        expiresOn: '2029-03-02',
        status: 'accepted',
        verifiedBy: 'rep-vega',
      }),
      doc({
        id: 'doc-0002',
        kind: 'criminal_record',
        issuingCountry: 'MX',
        issuedOn: '2026-07-01',
        status: 'under_review',
        legalisation: apostilled('2026-07-08', 'SAMPLE-APOST-MX-004512'),
        translation: untranslated(CASTILIAN),
      }),
      doc({
        id: 'doc-0003',
        kind: 'birth_certificate',
        issuingCountry: 'MX',
        issuedOn: '2025-10-20',
        status: 'accepted',
        legalisation: apostilled('2025-11-06', 'SAMPLE-APOST-MX-003980'),
        verifiedBy: 'rep-vega',
      }),
      doc({
        id: 'doc-0004',
        kind: 'national_id',
        issuingCountry: 'ES',
        issuedOn: '2024-09-01',
        expiresOn: '2029-08-31',
        status: 'accepted',
        verifiedBy: 'rep-vega',
      }),
    ],
    tasks: [
      {
        id: 'tsk-0001',
        phase: 'intake',
        title: 'Confirm the nationality actually claimed on entry and on the residence card',
        assignee: 'representative',
        dependsOn: [],
        status: 'complete',
        citationIds: ['es-practice-claimed-nationality'],
      },
      {
        id: 'tsk-0002',
        phase: 'document_assembly',
        title: 'Obtain apostilled Mexican criminal record certificate',
        assignee: 'applicant',
        dependsOn: ['tsk-0001'],
        status: 'in_progress',
        dueOn: '2026-08-20',
        citationIds: ['es-cc-art-22-4'],
      },
      {
        id: 'tsk-0003',
        phase: 'document_assembly',
        title: 'Sit CCSE and DELE A2 examinations',
        assignee: 'applicant',
        dependsOn: ['tsk-0001'],
        status: 'in_progress',
        dueOn: '2026-08-30',
        citationIds: ['es-rd-1004-2015-examenes'],
      },
      {
        id: 'tsk-0004',
        phase: 'submission',
        title: 'Lodge the expediente through the electronic register',
        assignee: 'representative',
        dependsOn: ['tsk-0002', 'tsk-0003'],
        status: 'locked',
        dueOn: '2026-09-15',
        citationIds: ['es-cc-art-22-1'],
      },
      {
        id: 'tsk-0005',
        phase: 'status_transition',
        title: 'Swear or promise allegiance before the Registro Civil',
        assignee: 'applicant',
        dependsOn: ['tsk-0004'],
        status: 'locked',
        citationIds: ['es-cc-art-23'],
      },
    ],
  },
  {
    id: 'mat-0002',
    reference: 'MDR-2025-0042',
    title: 'Non-lucrative residence visa, consular route',
    applicantId: 'app-0002',
    pathwayId: 'es-non-lucrative-visa',
    targetJurisdiction: 'ES',
    claimedNationality: 'CO',
    status: 'awaiting_authority',
    phase: 'submission',
    openedOn: '2025-12-02',
    representativeId: 'rep-serra',
    targetSubmissionDate: '2026-06-30',
    defaultDocumentLanguage: CASTILIAN,
    documents: [
      doc({
        id: 'doc-0010',
        kind: 'passport',
        issuingCountry: 'CO',
        issuedOn: '2021-05-14',
        expiresOn: '2031-05-13',
        status: 'accepted',
        verifiedBy: 'rep-serra',
      }),
      doc({
        id: 'doc-0011',
        kind: 'criminal_record',
        issuingCountry: 'CO',
        issuedOn: '2026-03-02',
        status: 'provided',
        legalisation: apostilled('2026-03-16', 'SAMPLE-APOST-CO-118844'),
      }),
      doc({
        id: 'doc-0012',
        kind: 'proof_of_income',
        issuingCountry: 'CO',
        issuedOn: '2026-04-22',
        status: 'accepted',
        translation: untranslated(CASTILIAN),
      }),
      doc({
        id: 'doc-0013',
        kind: 'health_insurance',
        issuingCountry: 'ES',
        issuedOn: '2026-05-30',
        expiresOn: '2027-05-29',
        status: 'accepted',
      }),
    ],
    tasks: [
      {
        id: 'tsk-0010',
        phase: 'document_assembly',
        title: 'Evidence sufficient recurring means without economic activity in Spain',
        assignee: 'applicant',
        dependsOn: [],
        status: 'complete',
        citationIds: ['es-rd-557-2011-no-lucrativa'],
      },
      {
        id: 'tsk-0011',
        phase: 'submission',
        title: 'Attend consular appointment and lodge the visa application',
        assignee: 'applicant',
        dependsOn: ['tsk-0010'],
        status: 'complete',
        citationIds: ['es-lo-4-2000-art-31'],
      },
      {
        id: 'tsk-0012',
        phase: 'submission',
        title: 'Await consular decision',
        assignee: 'authority',
        dependsOn: ['tsk-0011'],
        status: 'in_progress',
        citationIds: [],
      },
      {
        id: 'tsk-0013',
        phase: 'post_arrival_tracking',
        title: 'Apply for the TIE within one month of entry',
        assignee: 'applicant',
        dependsOn: ['tsk-0012'],
        status: 'locked',
        citationIds: ['es-lo-4-2000-art-31'],
      },
    ],
  },
  {
    id: 'mat-0003',
    reference: 'MDR-2025-0118',
    title: 'CUSMA professional work permit, engineer',
    applicantId: 'app-0003',
    pathwayId: 'ca-cusma-professional',
    targetJurisdiction: 'CA',
    claimedNationality: 'MX',
    status: 'awaiting_applicant',
    phase: 'identity_validation',
    openedOn: '2025-09-19',
    representativeId: 'rep-okonkwo',
    targetSubmissionDate: '2026-09-01',
    defaultDocumentLanguage: CASTILIAN,
    documents: [
      doc({
        id: 'doc-0020',
        kind: 'passport',
        issuingCountry: 'MX',
        issuedOn: '2016-10-13',
        expiresOn: '2026-10-12',
        status: 'under_review',
      }),
      doc({
        id: 'doc-0021',
        kind: 'degree_certificate',
        issuingCountry: 'MX',
        issuedOn: '2012-07-06',
        status: 'provided',
        translation: untranslated(CASTILIAN),
      }),
      doc({
        id: 'doc-0022',
        kind: 'employment_offer',
        issuingCountry: 'CA',
        issuedOn: '2026-06-11',
        status: 'accepted',
        translation: untranslated(ENGLISH),
        verifiedBy: 'rep-okonkwo',
      }),
    ],
    tasks: [
      {
        id: 'tsk-0020',
        phase: 'identity_validation',
        title: 'Verify passport machine-readable zone and remaining validity',
        assignee: 'platform',
        dependsOn: [],
        status: 'available',
        dueOn: '2026-08-05',
        citationIds: [],
      },
      {
        id: 'tsk-0021',
        phase: 'identity_validation',
        title: 'Confirm citizenship of a CUSMA party, not merely residence',
        assignee: 'representative',
        dependsOn: ['tsk-0020'],
        status: 'locked',
        citationIds: ['ca-cusma-citizenship-requirement'],
      },
      {
        id: 'tsk-0022',
        phase: 'document_assembly',
        title: 'Obtain certified English translation of the engineering degree',
        assignee: 'applicant',
        dependsOn: ['tsk-0021'],
        status: 'locked',
        dueOn: '2026-08-18',
        citationIds: ['ca-cusma-annex-16a-appendix-2'],
      },
      {
        id: 'tsk-0023',
        phase: 'submission',
        title: 'Present the application at a port of entry or through the online portal',
        assignee: 'applicant',
        dependsOn: ['tsk-0022'],
        status: 'locked',
        dueOn: '2026-09-01',
        citationIds: ['ca-irpr-s-204', 'ca-ircc-cusma-instructions'],
      },
    ],
  },
  {
    id: 'mat-0004',
    reference: 'MDR-2026-0004',
    title: 'Digital nomad residence, initial enquiry',
    applicantId: 'app-0004',
    pathwayId: 'es-digital-nomad-visa',
    targetJurisdiction: 'ES',
    claimedNationality: 'BR',
    status: 'draft',
    phase: 'intake',
    openedOn: '2026-07-14',
    representativeId: null,
    defaultDocumentLanguage: PORTUGUESE,
    documents: [],
    tasks: [
      {
        id: 'tsk-0030',
        phase: 'intake',
        title: 'Assign an accountable representative before any advice leaves the firm',
        assignee: 'representative',
        dependsOn: [],
        status: 'available',
        dueOn: '2026-07-31',
        citationIds: [],
      },
      {
        id: 'tsk-0031',
        phase: 'intake',
        title: 'Establish employer trading history and share of activity inside Spain',
        assignee: 'applicant',
        dependsOn: [],
        status: 'available',
        citationIds: ['es-ley-14-2013-teletrabajo'],
      },
    ],
  },
  {
    id: 'mat-0005',
    reference: 'MDR-2025-0233',
    title: 'Express Entry, Canadian Experience Class',
    applicantId: 'app-0005',
    pathwayId: 'ca-express-entry-cec',
    targetJurisdiction: 'CA',
    claimedNationality: 'IN',
    status: 'awaiting_representative_review',
    phase: 'document_assembly',
    openedOn: '2025-10-27',
    representativeId: 'rep-lambert',
    targetSubmissionDate: '2026-10-01',
    defaultDocumentLanguage: ENGLISH,
    documents: [
      doc({
        id: 'doc-0040',
        kind: 'passport',
        issuingCountry: 'IN',
        issuedOn: '2018-08-30',
        expiresOn: '2028-08-29',
        status: 'accepted',
        translation: untranslated(ENGLISH),
      }),
      doc({
        id: 'doc-0041',
        kind: 'criminal_record',
        issuingCountry: 'IN',
        issuedOn: '2026-02-10',
        status: 'provided',
        translation: untranslated(HINDI),
      }),
      doc({
        id: 'doc-0042',
        kind: 'photograph',
        issuingCountry: 'CA',
        issuedOn: '2026-01-05',
        status: 'provided',
        translation: untranslated(ENGLISH),
      }),
      doc({
        id: 'doc-0043',
        kind: 'academic_transcript',
        issuingCountry: 'IN',
        issuedOn: '2014-06-18',
        status: 'under_review',
        translation: untranslated(ENGLISH),
      }),
    ],
    tasks: [
      {
        id: 'tsk-0040',
        phase: 'document_assembly',
        title: 'Reconcile Canadian work history against the three-year lookback',
        assignee: 'representative',
        dependsOn: [],
        status: 'in_progress',
        dueOn: '2026-08-15',
        citationIds: ['ca-irpr-s-87-1'],
      },
      {
        id: 'tsk-0041',
        phase: 'document_assembly',
        title: 'Convert part-time hours to the published full-time equivalence',
        assignee: 'representative',
        dependsOn: ['tsk-0040'],
        status: 'locked',
        citationIds: ['ca-ircc-cec-guidance'],
      },
      {
        id: 'tsk-0042',
        phase: 'document_assembly',
        title: 'Obtain replacement police certificate inside the acceptance window',
        assignee: 'applicant',
        dependsOn: [],
        status: 'available',
        dueOn: '2026-08-29',
        citationIds: [],
      },
      {
        id: 'tsk-0043',
        phase: 'submission',
        title: 'Submit the electronic application',
        assignee: 'applicant',
        dependsOn: ['tsk-0041', 'tsk-0042'],
        status: 'locked',
        dueOn: '2026-10-01',
        citationIds: ['ca-irpr-s-87-1'],
      },
    ],
  },
  {
    id: 'mat-0006',
    reference: 'MDR-2024-0301',
    title: 'Investor residence renewal, route since repealed',
    applicantId: 'app-0006',
    pathwayId: 'es-golden-visa',
    targetJurisdiction: 'ES',
    claimedNationality: 'CN',
    status: 'granted',
    phase: 'post_arrival_tracking',
    openedOn: '2024-02-19',
    representativeId: 'rep-vega',
    closedOn: '2024-08-30',
    statusExpiresOn: '2027-05-20',
    defaultDocumentLanguage: MANDARIN,
    documents: [
      doc({
        id: 'doc-0050',
        kind: 'passport',
        issuingCountry: 'CN',
        issuedOn: '2020-01-22',
        expiresOn: '2030-01-21',
        status: 'accepted',
        translation: untranslated(MANDARIN),
        verifiedBy: 'rep-vega',
      }),
      doc({
        id: 'doc-0051',
        kind: 'prior_visa',
        issuingCountry: 'ES',
        issuedOn: '2024-08-30',
        expiresOn: '2027-05-20',
        status: 'accepted',
        verifiedBy: 'rep-vega',
      }),
    ],
    tasks: [
      {
        id: 'tsk-0050',
        phase: 'post_arrival_tracking',
        title: 'Confirm renewal route now that the investor provision is repealed',
        assignee: 'representative',
        dependsOn: [],
        status: 'available',
        dueOn: '2027-02-20',
        citationIds: ['es-lo-1-2025-derogacion-inversores'],
      },
    ],
  },
  {
    id: 'mat-0007',
    reference: 'MDR-2026-0011',
    title: 'Highly qualified professional authorisation, Barcelona',
    applicantId: 'app-0007',
    pathwayId: 'es-highly-qualified-professional',
    targetJurisdiction: 'ES',
    claimedNationality: 'AR',
    status: 'active',
    phase: 'document_assembly',
    openedOn: '2026-03-05',
    representativeId: 'rep-okonkwo',
    targetSubmissionDate: '2026-08-10',
    receivingRegion: 'ES-CT',
    defaultDocumentLanguage: CASTILIAN,
    documents: [
      doc({
        id: 'doc-0060',
        kind: 'passport',
        issuingCountry: 'AR',
        issuedOn: '2022-02-01',
        expiresOn: '2032-01-31',
        status: 'accepted',
      }),
      doc({
        id: 'doc-0061',
        kind: 'employment_contract',
        issuingCountry: 'ES',
        issuedOn: '2026-05-19',
        status: 'accepted',
      }),
      doc({
        id: 'doc-0062',
        kind: 'degree_certificate',
        issuingCountry: 'AR',
        issuedOn: '2010-12-14',
        status: 'under_review',
        legalisation: apostilled('2026-04-02', 'SAMPLE-APOST-AR-771203'),
      }),
      doc({
        id: 'doc-0063',
        kind: 'criminal_record',
        issuingCountry: 'AR',
        issuedOn: '2026-06-19',
        status: 'provided',
        legalisation: apostilled('2026-06-26', 'SAMPLE-APOST-AR-772551'),
      }),
    ],
    tasks: [
      {
        id: 'tsk-0060',
        phase: 'document_assembly',
        title: 'Evidence the qualification or the equivalent professional experience',
        assignee: 'applicant',
        dependsOn: [],
        status: 'in_progress',
        dueOn: '2026-08-01',
        citationIds: ['es-ley-14-2013-altamente-cualificado'],
      },
      {
        id: 'tsk-0061',
        phase: 'document_assembly',
        title: 'Confirm the salary level against the criteria applied by the UGE-CE',
        assignee: 'representative',
        dependsOn: [],
        status: 'in_progress',
        dueOn: '2026-08-05',
        citationIds: ['es-uge-criterios'],
      },
      {
        id: 'tsk-0062',
        phase: 'submission',
        title: 'File with the Unidad de Grandes Empresas y Colectivos Estratégicos',
        assignee: 'representative',
        dependsOn: ['tsk-0060', 'tsk-0061'],
        status: 'locked',
        dueOn: '2026-08-10',
        citationIds: ['es-ley-14-2013-altamente-cualificado'],
      },
    ],
  },
  {
    id: 'mat-0008',
    reference: 'MDR-2023-0088',
    title: 'Entrepreneur residence, legacy file',
    applicantId: 'app-0011',
    pathwayId: 'es-entrepreneur-residence',
    targetJurisdiction: 'ES',
    claimedNationality: 'CL',
    status: 'awaiting_representative_review',
    phase: 'document_assembly',
    openedOn: '2023-06-12',
    representativeId: 'rep-serra',
    defaultDocumentLanguage: CASTILIAN,
    documents: [
      doc({
        id: 'doc-0070',
        kind: 'passport',
        issuingCountry: 'CL',
        issuedOn: '2019-09-09',
        expiresOn: '2026-09-08',
        status: 'accepted',
      }),
    ],
    tasks: [
      {
        id: 'tsk-0070',
        phase: 'document_assembly',
        title: 'Re-establish which catalog record this file is being assessed against',
        assignee: 'representative',
        dependsOn: [],
        status: 'available',
        dueOn: '2026-08-01',
        citationIds: [],
      },
    ],
  },
  {
    id: 'mat-0009',
    reference: 'MDR-2022-0455',
    title: 'Spanish nationality by ten-year residence',
    applicantId: 'app-0008',
    pathwayId: 'es-nationality-residence-general',
    targetJurisdiction: 'ES',
    claimedNationality: 'UA',
    status: 'awaiting_authority',
    phase: 'status_transition',
    openedOn: '2022-04-08',
    representativeId: 'rep-vega',
    statusExpiresOn: '2026-08-08',
    defaultDocumentLanguage: UKRAINIAN,
    documents: [
      doc({
        id: 'doc-0080',
        kind: 'passport',
        issuingCountry: 'UA',
        issuedOn: '2016-12-02',
        expiresOn: '2026-12-01',
        status: 'accepted',
        translation: swornInto(UKRAINIAN, CASTILIAN, '2025-02-11', 'SAMPLE-TIJ-0904'),
        verifiedBy: 'rep-vega',
      }),
      doc({
        id: 'doc-0081',
        kind: 'national_id',
        issuingCountry: 'ES',
        issuedOn: '2021-08-09',
        expiresOn: '2026-08-08',
        status: 'accepted',
        verifiedBy: 'rep-vega',
      }),
      doc({
        id: 'doc-0082',
        kind: 'birth_certificate',
        issuingCountry: 'UA',
        issuedOn: '2024-05-06',
        status: 'accepted',
        legalisation: apostilled('2024-05-30', 'SAMPLE-APOST-UA-220417'),
        translation: swornInto(UKRAINIAN, CASTILIAN, '2024-06-14', 'SAMPLE-TIJ-0961'),
      }),
    ],
    tasks: [
      {
        id: 'tsk-0080',
        phase: 'status_transition',
        title: 'Renew the residence card before the current authorisation lapses',
        assignee: 'applicant',
        dependsOn: [],
        status: 'available',
        dueOn: '2026-08-08',
        citationIds: ['es-lo-4-2000-art-31'],
      },
      {
        id: 'tsk-0081',
        phase: 'status_transition',
        title: 'Await the Registro Civil resolution',
        assignee: 'authority',
        dependsOn: [],
        status: 'in_progress',
        citationIds: ['es-cc-art-22-1'],
      },
      {
        id: 'tsk-0082',
        phase: 'status_transition',
        title: 'Swear or promise allegiance once the grant issues',
        assignee: 'applicant',
        dependsOn: ['tsk-0081'],
        status: 'locked',
        citationIds: ['es-cc-art-23', 'es-cc-art-24-1'],
      },
    ],
  },
  {
    id: 'mat-0010',
    reference: 'MDR-2025-0190',
    title: 'CUSMA professional work permit, management consultant',
    applicantId: 'app-0009',
    pathwayId: 'ca-cusma-professional',
    targetJurisdiction: 'CA',
    claimedNationality: 'US',
    status: 'submitted',
    phase: 'submission',
    openedOn: '2025-11-11',
    representativeId: 'rep-okonkwo',
    targetSubmissionDate: '2026-07-10',
    defaultDocumentLanguage: ENGLISH,
    documents: [
      doc({
        id: 'doc-0090',
        kind: 'passport',
        issuingCountry: 'US',
        issuedOn: '2023-04-04',
        expiresOn: '2033-04-03',
        status: 'accepted',
        translation: untranslated(ENGLISH),
        verifiedBy: 'rep-okonkwo',
      }),
      doc({
        id: 'doc-0091',
        kind: 'employment_offer',
        issuingCountry: 'CA',
        issuedOn: '2026-05-02',
        status: 'accepted',
        translation: untranslated(ENGLISH),
      }),
      doc({
        id: 'doc-0092',
        kind: 'degree_certificate',
        issuingCountry: 'US',
        issuedOn: '2017-05-20',
        status: 'accepted',
        translation: untranslated(ENGLISH),
      }),
    ],
    tasks: [
      {
        id: 'tsk-0090',
        phase: 'submission',
        title: 'Application lodged; await processing',
        assignee: 'authority',
        dependsOn: [],
        status: 'in_progress',
        citationIds: ['ca-irpr-s-204'],
      },
      {
        id: 'tsk-0091',
        phase: 'post_arrival_tracking',
        title: 'Record the work permit conditions on arrival',
        assignee: 'representative',
        dependsOn: ['tsk-0090'],
        status: 'locked',
        citationIds: [],
      },
    ],
  },
  {
    id: 'mat-0011',
    reference: 'MDR-2024-0210',
    title: 'Non-lucrative residence visa, refused at consular stage',
    applicantId: 'app-0010',
    pathwayId: 'es-non-lucrative-visa',
    targetJurisdiction: 'ES',
    claimedNationality: 'PH',
    status: 'refused',
    phase: 'submission',
    openedOn: '2024-07-30',
    representativeId: 'rep-serra',
    closedOn: '2025-03-18',
    defaultDocumentLanguage: FILIPINO,
    documents: [
      doc({
        id: 'doc-0100',
        kind: 'passport',
        issuingCountry: 'PH',
        issuedOn: '2020-11-17',
        expiresOn: '2030-11-16',
        status: 'accepted',
        translation: untranslated(FILIPINO),
      }),
      doc({
        id: 'doc-0101',
        kind: 'proof_of_income',
        issuingCountry: 'PH',
        issuedOn: '2024-09-04',
        status: 'rejected',
        translation: untranslated(FILIPINO),
      }),
    ],
    tasks: [
      {
        id: 'tsk-0100',
        phase: 'submission',
        title: 'Consular decision recorded as a refusal',
        assignee: 'authority',
        dependsOn: [],
        status: 'complete',
        citationIds: ['es-rd-557-2011-no-lucrativa'],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Audit trail                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The trail, oldest first as written.
 *
 * Entries are never edited or removed — `records.ts` exposes them through a
 * read-only accessor and there is no mutation path in this app. The disclosure
 * entries are the ones that matter most: each downgrade records both the class
 * that was produced and the class that was actually released, because an entry
 * showing only what was released loses the fact that a recommendation existed
 * and was withheld, which is the fact a regulator would ask about.
 */
const AUDIT: readonly AuditRecord[] = [
  {
    id: 'aud-0001',
    on: D('2024-11-04'),
    at: '09:12',
    timezone: MADRID,
    kind: 'matter_opened',
    actorId: 'rep-vega',
    actorKind: 'representative',
    matterId: 'mat-0001',
    summary: 'Matter MDR-2024-0117 opened against es-nationality-residence-reduced.',
  },
  {
    id: 'aud-0002',
    on: D('2024-11-04'),
    at: '09:13',
    timezone: MADRID,
    kind: 'representative_assigned',
    actorId: 'staff-ops',
    actorKind: 'staff',
    matterId: 'mat-0001',
    summary: 'Marisol Vega Aguirre assigned as accountable representative (ES).',
  },
  {
    id: 'aud-0003',
    on: D('2025-01-20'),
    at: '16:40',
    timezone: MADRID,
    kind: 'phase_advanced',
    actorId: 'rep-vega',
    actorKind: 'representative',
    matterId: 'mat-0001',
    summary: 'Phase advanced from intake to identity_validation.',
  },
  {
    id: 'aud-0004',
    on: D('2025-03-18'),
    at: '11:02',
    timezone: MADRID,
    kind: 'status_changed',
    actorId: 'rep-serra',
    actorKind: 'representative',
    matterId: 'mat-0011',
    summary: 'Status changed to refused following the consular decision.',
    detail: 'Refusal recorded against MDR-2024-0210. Means requirement cited as the ground.',
  },
  {
    id: 'aud-0005',
    on: D('2025-09-19'),
    at: '14:27',
    timezone: TORONTO,
    kind: 'matter_opened',
    actorId: 'rep-okonkwo',
    actorKind: 'representative',
    matterId: 'mat-0003',
    summary: 'Matter MDR-2025-0118 opened against ca-cusma-professional.',
  },
  {
    id: 'aud-0006',
    on: D('2025-10-27'),
    at: '10:05',
    timezone: TORONTO,
    kind: 'matter_opened',
    actorId: 'rep-lambert',
    actorKind: 'representative',
    matterId: 'mat-0005',
    summary: 'Matter MDR-2025-0233 opened against ca-express-entry-cec.',
  },
  {
    id: 'aud-0007',
    on: D('2025-11-20'),
    at: '08:55',
    timezone: TORONTO,
    kind: 'credential_verified',
    actorId: 'staff-compliance',
    actorKind: 'staff',
    matterId: null,
    summary: 'Yves Lambert checked against the Law Society of Ontario directory.',
    detail: 'Standing confirmed. Expiry recorded as 2026-06-30.',
  },
  {
    id: 'aud-0008',
    on: D('2026-01-08'),
    at: '09:30',
    timezone: TORONTO,
    kind: 'credential_verified',
    actorId: 'staff-compliance',
    actorKind: 'staff',
    matterId: null,
    summary: 'Adaeze Okonkwo checked against the CICC public register.',
    detail: 'Licence live. Expiry recorded as 2026-08-31.',
  },
  {
    id: 'aud-0009',
    on: D('2026-02-14'),
    at: '17:21',
    timezone: TORONTO,
    kind: 'disclosure_downgraded',
    actorId: 'platform',
    actorKind: 'platform',
    matterId: 'mat-0005',
    summary: 'Route comparison withheld from the applicant portal.',
    detail:
      'A ranked comparison of Express Entry streams was produced for internal use and could not '
      + 'be released to the applicant, who is unrepresented for release purposes.',
    disclosure: {
      produced: 'advice',
      released: 'assessment',
      audience: 'applicant',
      reason:
        'Regulated advice requires an authorized representative attached to the matter.',
      citationIds: ['ca-irpr-s-87-1', 'ca-ircc-cec-guidance'],
    },
  },
  {
    id: 'aud-0010',
    on: D('2026-03-05'),
    at: '12:44',
    timezone: MADRID,
    kind: 'matter_opened',
    actorId: 'staff-ops',
    actorKind: 'staff',
    matterId: 'mat-0007',
    summary: 'Matter MDR-2026-0011 opened against es-highly-qualified-professional.',
  },
  {
    id: 'aud-0011',
    on: D('2026-03-05'),
    at: '12:48',
    timezone: MADRID,
    kind: 'representative_assigned',
    actorId: 'staff-ops',
    actorKind: 'staff',
    matterId: 'mat-0007',
    summary: 'Adaeze Okonkwo assigned as accountable representative.',
    detail:
      'Assignment recorded without a jurisdiction check. The representative holds a Canadian '
      + 'standing and this matter is filed in Spain.',
  },
  {
    id: 'aud-0012',
    on: D('2026-03-16'),
    at: '10:11',
    timezone: MADRID,
    kind: 'document_received',
    actorId: 'app-0002',
    actorKind: 'applicant',
    matterId: 'mat-0002',
    summary: 'Colombian criminal record certificate received, apostille attached.',
  },
  {
    id: 'aud-0013',
    on: D('2026-04-02'),
    at: '09:02',
    timezone: MADRID,
    kind: 'document_received',
    actorId: 'app-0007',
    actorKind: 'applicant',
    matterId: 'mat-0007',
    summary: 'Argentine degree certificate received, apostille attached.',
  },
  {
    id: 'aud-0014',
    on: D('2026-05-02'),
    at: '15:36',
    timezone: MADRID,
    kind: 'document_status_changed',
    actorId: 'rep-serra',
    actorKind: 'representative',
    matterId: 'mat-0002',
    summary: 'Proof of income moved from under_review to accepted.',
  },
  {
    id: 'aud-0015',
    on: D('2026-06-12'),
    at: '08:47',
    timezone: MADRID,
    kind: 'credential_verified',
    actorId: 'staff-compliance',
    actorKind: 'staff',
    matterId: null,
    summary: 'Marisol Vega Aguirre checked against the ICAM register.',
    detail: 'Standing confirmed. Expiry recorded as 2027-03-31.',
  },
  {
    id: 'aud-0016',
    on: D('2026-06-30'),
    at: '13:15',
    timezone: MADRID,
    kind: 'status_changed',
    actorId: 'rep-serra',
    actorKind: 'representative',
    matterId: 'mat-0002',
    summary: 'Application lodged at the consular post; status changed to awaiting_authority.',
  },
  {
    id: 'aud-0017',
    on: D('2026-07-01'),
    at: '07:58',
    timezone: MADRID,
    kind: 'credential_verified',
    actorId: 'staff-compliance',
    actorKind: 'staff',
    matterId: null,
    summary: 'Núria Serra Ponç checked against the COGAM register.',
    detail: 'Standing confirmed. No expiry is published for this register entry.',
  },
  {
    id: 'aud-0018',
    on: D('2026-07-01'),
    at: '11:24',
    timezone: MADRID,
    kind: 'document_received',
    actorId: 'app-0001',
    actorKind: 'applicant',
    matterId: 'mat-0001',
    summary: 'Mexican criminal record certificate received.',
  },
  {
    id: 'aud-0019',
    on: D('2026-07-06'),
    at: '10:00',
    timezone: MADRID,
    kind: 'integration_refused',
    actorId: 'platform',
    actorKind: 'platform',
    matterId: 'mat-0001',
    summary: 'Request to store the applicant Cl@ve credential refused by policy.',
    detail:
      'A staff member asked whether the applicant Cl@ve authenticator could be kept on file to '
      + 'save re-authentication. The platform refused; an assisted handoff was produced instead.',
  },
  {
    id: 'aud-0020',
    on: D('2026-07-10'),
    at: '16:03',
    timezone: TORONTO,
    kind: 'status_changed',
    actorId: 'rep-okonkwo',
    actorKind: 'representative',
    matterId: 'mat-0010',
    summary: 'Application submitted; status changed to submitted.',
  },
  {
    id: 'aud-0021',
    on: D('2026-07-13'),
    at: '09:41',
    timezone: TORONTO,
    kind: 'task_completed',
    actorId: 'app-0009',
    actorKind: 'applicant',
    matterId: 'mat-0010',
    summary: 'Task tsk-0090 recorded as lodged with the authority.',
  },
  {
    id: 'aud-0022',
    on: D('2026-07-14'),
    at: '11:19',
    timezone: MADRID,
    kind: 'matter_opened',
    actorId: 'staff-ops',
    actorKind: 'staff',
    matterId: 'mat-0004',
    summary: 'Matter MDR-2026-0004 opened as a draft with no representative assigned.',
  },
  {
    id: 'aud-0023',
    on: D('2026-07-14'),
    at: '11:52',
    timezone: MADRID,
    kind: 'disclosure_downgraded',
    actorId: 'platform',
    actorKind: 'platform',
    matterId: 'mat-0004',
    summary: 'Pathway recommendation withheld from the applicant portal.',
    detail:
      'The engine produced a ranked shortlist for the enquiry. No representative is assigned, so '
      + 'the applicant saw the criteria and their own figures without the ranking.',
    disclosure: {
      produced: 'advice',
      released: 'assessment',
      audience: 'applicant',
      reason:
        'Regulated advice requires an authorized representative attached to the matter.',
      citationIds: ['es-ley-14-2013-teletrabajo'],
    },
  },
  {
    id: 'aud-0024',
    on: D('2026-07-16'),
    at: '14:08',
    timezone: MADRID,
    kind: 'disclosure_released',
    actorId: 'rep-vega',
    actorKind: 'representative',
    matterId: 'mat-0001',
    summary: 'Filing-order recommendation released to the practitioner console.',
    detail:
      'Released to a practitioner audience, which is the professional rather than the protected '
      + 'party. The same output would be downgraded on the applicant portal.',
    disclosure: {
      produced: 'advice',
      released: 'advice',
      audience: 'practitioner',
      citationIds: ['es-cc-art-22-1', 'es-cc-art-22-3'],
    },
  },
  {
    id: 'aud-0025',
    on: D('2026-07-17'),
    at: '10:34',
    timezone: TORONTO,
    kind: 'disclosure_downgraded',
    actorId: 'platform',
    actorKind: 'platform',
    matterId: 'mat-0005',
    summary: 'Advice withheld after the accountable credential lapsed.',
    detail:
      'The representative gating this matter has an expired standing, so outputs that were '
      + 'previously released as advice are now released as assessment only.',
    disclosure: {
      produced: 'advice',
      released: 'assessment',
      audience: 'applicant',
      reason: 'Representative rep-lambert credential expired on 2026-06-30.',
      citationIds: ['ca-irpr-s-87-1'],
    },
  },
  {
    id: 'aud-0026',
    on: D('2026-07-20'),
    at: '09:15',
    timezone: MADRID,
    kind: 'catalog_review_recorded',
    actorId: 'staff-compliance',
    actorKind: 'staff',
    matterId: null,
    summary: 'Catalog review queue triaged; no record moved to counsel_reviewed.',
    detail:
      'Every pathway in the shipped catalog remains unreviewed. Until a licensed person signs a '
      + 'record off, no recommendation may rank it.',
  },
  {
    id: 'aud-0027',
    on: D('2026-07-21'),
    at: '15:47',
    timezone: MADRID,
    kind: 'document_status_changed',
    actorId: 'rep-vega',
    actorKind: 'representative',
    matterId: 'mat-0001',
    summary: 'Criminal record certificate moved from provided to under_review.',
  },
  {
    id: 'aud-0028',
    on: D('2026-07-22'),
    at: '08:30',
    timezone: TORONTO,
    kind: 'integration_refused',
    actorId: 'platform',
    actorKind: 'platform',
    matterId: 'mat-0010',
    summary: 'Employer portal submission refused: no credential custody, not provisioned.',
    detail:
      'Submitting through the employer portal would require holding the employer portal '
      + 'credential. An assisted handoff was produced for the employer to carry out themselves.',
  },
  {
    id: 'aud-0029',
    on: D('2026-07-23'),
    at: '12:02',
    timezone: MADRID,
    kind: 'task_completed',
    actorId: 'rep-serra',
    actorKind: 'representative',
    matterId: 'mat-0008',
    summary: 'Legacy file review reopened; catalog record could not be resolved.',
    detail:
      'MDR-2023-0088 names pathway es-entrepreneur-residence, which is not in the shipped catalog.',
  },
  {
    id: 'aud-0030',
    on: D('2026-07-24'),
    at: '17:55',
    timezone: MADRID,
    kind: 'status_changed',
    actorId: 'rep-vega',
    actorKind: 'representative',
    matterId: 'mat-0009',
    summary: 'Residence card renewal flagged against the authorisation expiry.',
  },
];

/* -------------------------------------------------------------------------- */
/* Datasets                                                                   */
/* -------------------------------------------------------------------------- */

/** The identifiers `MERIDIAN_ADMIN_DATASET` accepts. */
export const DATASET_IDS = ['working', 'empty'] as const;
export type DatasetId = (typeof DATASET_IDS)[number];

export function isDatasetId(value: string): value is DatasetId {
  return (DATASET_IDS as readonly string[]).includes(value);
}

const WORKING: FirmRecords = {
  tenantId: TENANT_ID,
  tenantDisplayName: 'Cordillera Movilidad y Extranjería',
  homeJurisdiction: 'ES',
  datasetId: 'working',
  datasetDescription:
    'In-process record set. Synthetic records; no real applicant, licence or travel document.',
  representatives: REPRESENTATIVES,
  applicants: APPLICANTS,
  matters: MATTER_SPECS.map(buildMatter),
  audit: AUDIT,
};

/**
 * A firm on its first day. Not a fixture — the console has to render this
 * honestly, and "empty" must never be dressed up as "loading" or as a demo.
 */
const EMPTY: FirmRecords = {
  tenantId: TENANT_ID,
  tenantDisplayName: 'Cordillera Movilidad y Extranjería',
  homeJurisdiction: 'ES',
  datasetId: 'empty',
  datasetDescription: 'In-process record set with no records. A tenant that has not opened a file.',
  representatives: [],
  applicants: [],
  matters: [],
  audit: [],
};

export const DATASETS: Readonly<Record<DatasetId, FirmRecords>> = { working: WORKING, empty: EMPTY };

/** Every civil date the audit trail touches, ascending. Bounds the date filter honestly. */
export function auditDateBounds(records: FirmRecords): { first: IsoDate; last: IsoDate } | null {
  if (records.audit.length === 0) return null;
  const dates = records.audit.map((a) => a.on).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first === undefined || last === undefined) return null;
  return { first, last };
}
