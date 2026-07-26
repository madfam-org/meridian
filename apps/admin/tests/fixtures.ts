/**
 * Record builders for the console's tests.
 *
 * Everything here is invented. No real person, no real licence number, no real
 * file reference and — as `AGENTS.md` requires of a public repository — no
 * travel-document number of any kind, not even a syntactically plausible one.
 * Licence numbers carry the same `SAMPLE-` prefix the shipped dataset uses so
 * that nothing in this file can be mistaken for an entry in a public register.
 *
 * The builders take partials and fill the rest, because most tests care about
 * one field. A test that has to spell out a whole `Matter` to change a status
 * is a test nobody reads, and the fields it did not mean to assert become
 * accidental fixtures that the next author is afraid to touch.
 *
 * Dates are deliberately not derived from a clock. Every derivation in this
 * console takes `asOf` as a parameter, so the tests pin both sides: a fixture
 * dated relative to `new Date()` would pass on the day it was written and start
 * failing at a boundary six months later, which is the failure mode that
 * teaches a team to delete tests.
 */

import {
  countryCode,
  isoDate,
  type AuthorizedRepresentative,
  type Citation,
  type IsoDate,
  type Matter,
  type MatterPhase,
  type MatterStatus,
  type RepresentativeCredential,
  type Task,
  type TaskAssignee,
  type TaskStatus,
} from '@meridian/core';
import {
  NOT_LEGALISED,
  languageTag,
  untranslated,
  type Document,
  type DocumentKind,
  type DocumentStatus,
} from '@meridian/documents';
import type { Pathway } from '@meridian/pathways';
import type {
  ApplicantRecord,
  AuditRecord,
  FirmRecords,
  MatterRecord,
  RepresentativeRecord,
} from '@/lib/records';

export const CASTILIAN_TAG = languageTag('es');
export const ENGLISH_TAG = languageTag('en');

/** A reference date the whole suite shares, so a boundary is a boundary everywhere. */
export const ASOF = isoDate('2026-07-26');

/** `ASOF` shifted by whole days. The one place day arithmetic is done in the fixtures. */
export function daysFrom(from: IsoDate, days: number): IsoDate {
  const base = Date.UTC(
    Number(from.slice(0, 4)),
    Number(from.slice(5, 7)) - 1,
    Number(from.slice(8, 10)),
  );
  return isoDate(new Date(base + days * 86_400_000).toISOString().slice(0, 10));
}

/* -------------------------------------------------------------------------- */
/* Roster                                                                     */
/* -------------------------------------------------------------------------- */

export function credential(
  overrides: Partial<AuthorizedRepresentative> = {},
): AuthorizedRepresentative {
  return {
    id: 'rep-fixture',
    jurisdiction: 'ES',
    credential: 'spanish_abogado' satisfies RepresentativeCredential,
    licenceNumber: 'SAMPLE-000000',
    verifiedOn: '2026-06-01',
    ...overrides,
  };
}

export function representative(
  overrides: Omit<Partial<RepresentativeRecord>, 'credential'> & {
    readonly credential?: Partial<AuthorizedRepresentative>;
  } = {},
): RepresentativeRecord {
  const { credential: credentialOverrides, ...rest } = overrides;
  return {
    credential: credential(credentialOverrides),
    displayName: 'Fixture Representative',
    regulator: 'Fixture regulator',
    publicRegister: 'Fixture public register',
    ...rest,
  };
}

/* -------------------------------------------------------------------------- */
/* Applicants, matters, tasks, documents                                      */
/* -------------------------------------------------------------------------- */

export function applicant(overrides: Partial<ApplicantRecord> = {}): ApplicantRecord {
  return {
    id: 'applicant-fixture',
    reference: 'APP-0001',
    familyName: 'Fixture',
    givenNames: 'Ana',
    nationalities: [countryCode('MX')],
    ...overrides,
  };
}

export function matter(overrides: Partial<Matter> = {}): Matter {
  return {
    id: 'matter-fixture',
    tenantId: 'tenant-fixture',
    applicantId: 'applicant-fixture',
    pathwayId: 'es-fixture-route',
    targetJurisdiction: countryCode('ES'),
    claimedNationality: countryCode('MX'),
    status: 'active' satisfies MatterStatus,
    phase: 'intake' satisfies MatterPhase,
    openedOn: isoDate('2026-01-05'),
    representativeId: 'rep-fixture',
    ...overrides,
  };
}

export function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-fixture',
    matterId: 'matter-fixture',
    phase: 'intake' satisfies MatterPhase,
    title: 'Fixture task',
    assignee: 'applicant' satisfies TaskAssignee,
    dependsOn: [],
    status: 'available' satisfies TaskStatus,
    citationIds: [],
    ...overrides,
  };
}

export function document(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-fixture',
    kind: 'criminal_record' satisfies DocumentKind,
    issuingCountry: countryCode('MX'),
    issuedOn: isoDate('2026-01-10'),
    status: 'accepted' satisfies DocumentStatus,
    legalisation: NOT_LEGALISED,
    translation: untranslated(CASTILIAN_TAG),
    ...overrides,
  };
}

export function matterRecord(
  overrides: Omit<Partial<MatterRecord>, 'matter'> & { readonly matter?: Partial<Matter> } = {},
): MatterRecord {
  const { matter: matterOverrides, ...rest } = overrides;
  return {
    matter: matter(matterOverrides),
    reference: 'MAT-0001',
    title: 'Fixture objective',
    tasks: [],
    documents: [],
    defaultDocumentLanguage: CASTILIAN_TAG,
    ...rest,
  };
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

export function auditRecord(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    id: 'audit-fixture',
    on: isoDate('2026-06-01'),
    at: '09:00',
    timezone: 'Europe/Madrid',
    kind: 'status_changed',
    actorId: 'staff-fixture',
    actorKind: 'staff',
    matterId: 'matter-fixture',
    summary: 'Fixture entry',
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* The set                                                                    */
/* -------------------------------------------------------------------------- */

export function firmRecords(overrides: Partial<FirmRecords> = {}): FirmRecords {
  return {
    tenantId: 'tenant-fixture',
    tenantDisplayName: 'Fixture practice',
    homeJurisdiction: 'ES',
    datasetId: 'fixture',
    datasetDescription: 'Invented records for tests.',
    recordLanguage: 'en',
    representatives: [],
    applicants: [],
    matters: [],
    audit: [],
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export function citation(overrides: Partial<Citation> = {}): Citation {
  return {
    id: 'fx-cite-1',
    kind: 'statute',
    instrument: 'Ley Fixture de Extranjería',
    jurisdiction: 'ES',
    verifiedOn: isoDate('2026-07-01'),
    ...overrides,
  };
}

/**
 * A pathway that passes `validateCatalog` cleanly, so a test that wants an
 * integrity error has to introduce one deliberately rather than inherit it.
 */
export function pathway(overrides: Partial<Pathway> = {}): Pathway {
  const citations = overrides.citations ?? [citation()];
  const firstId = citations[0]?.id ?? 'fx-cite-1';
  return {
    id: 'es-fixture-route',
    version: '1.0.0',
    jurisdiction: countryCode('ES'),
    name: { en: 'Fixture route', es: 'Vía de prueba' },
    summary: { en: 'A route invented for tests.', es: 'Una vía inventada para pruebas.' },
    kind: 'residence_permit',
    status: 'open',
    citations,
    criteria: [
      {
        id: 'fx-adult',
        label: { en: 'Is an adult', es: 'Es mayor de edad' },
        kind: 'procedural',
        citationIds: [firstId],
        evaluator: { op: 'gte', path: 'ageYears', value: 18 },
        weight: 'blocking',
      },
    ],
    durations: { citationIds: [firstId] },
    leadsTo: [],
    reviewStatus: 'unreviewed',
    ...overrides,
  } as Pathway;
}
