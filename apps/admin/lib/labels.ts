/**
 * The console's domain vocabulary, in both languages.
 *
 * Separate from `lib/i18n.ts` on purpose. That file holds product copy — the
 * sentences this console writes about itself, which can be rewritten by anybody
 * who writes well in both languages. This file holds **terms of art**: the names
 * of statuses, standings, disclosure classes and credential types that other
 * people's regulators and this repository's own type system have already fixed.
 * A sentence can be improved; a term either names the right thing or does not,
 * and the failure mode is not clumsiness but a false claim.
 *
 * Three rules govern everything below.
 *
 * **Every map is total over a closed union, with no default branch.** Adding a
 * status to `@meridian/core` or a capability state to `@meridian/govtech` makes
 * this file fail to compile rather than shipping a mangled label on one screen.
 * That is the same discipline `components/state.tsx` applies to tone.
 *
 * **A proper noun of another jurisdiction's system is not translated.** It is
 * rendered in the language that jurisdiction uses and marked with `lang`, which
 * is exactly what `@meridian/i18n`'s `instrumentLang` does for the name of a
 * statute, and for the same reason: the name is the identity of the thing. RCIC
 * is RCIC in Spanish. A member of the Chambre des notaires du Québec is a
 * *notaire*, and calling them a "notario" in Spanish would assert an equivalence
 * between the Chambre and the Spanish notariado that nobody has established.
 * Only the explanation around the name is translated.
 *
 * **The blunt words stay blunt.** `unreviewed` is *Sin revisar*, not "pendiente
 * de revisión"; `not_provisioned` is *Sin aprovisionar*, not "en preparación";
 * `refused_by_policy` is *Rechazada por política*, not "no disponible". The
 * English side of this console is deliberately unflattering about what the
 * platform has not done, and a Spanish reader is owed the same unflattering
 * answer rather than a softer one. Where a Spanish rendering came out gentler
 * than its English half, the Spanish is wrong.
 *
 * Where a term had no settled Spanish equivalent that this codebase could
 * defend, the label states the concept rather than inventing a name for it —
 * `endpoint` stays `Endpoint` because that is what a Spanish-speaking operator
 * calls it, and pretending otherwise would help nobody.
 */

import type {
  Audience,
  DisclosureClass,
  MatterPhase,
  MatterStatus,
  RepresentativeCredential,
  SourceKind,
  Staleness,
  TaskAssignee,
  TaskStatus,
} from '@meridian/core';
import type {
  DocumentKind,
  DocumentStatus,
  FreshnessVerdict,
  LegalisationRoute,
} from '@meridian/documents';
import type {
  CapabilityState,
  CapabilitySurface,
  PolicyRefusal,
  RequirementKind,
} from '@meridian/govtech';
import type {
  CriterionKind,
  CriterionWeight,
  PathwayKind,
  PathwayStatus,
  ReviewStatus,
} from '@meridian/pathways';
import type { Locale } from '@meridian/i18n';
import type { BlockerOwner, DeadlineKind } from '@/lib/caseload';
import type { AuditActorKind, AuditEventKind } from '@/lib/records';
import type { LicenceStanding, VerificationStanding } from '@/lib/roster';
import { type Bi, bi } from '@/lib/i18n';

/** `IntegrityIssue.severity` is an inline union in `@meridian/pathways`. */
type IssueSeverity = 'error' | 'warning';

/** Look one term up. Every table below is total, so this never returns a fallback. */
export function term(table: Bi, locale: Locale): string {
  return table[locale];
}

/* -------------------------------------------------------------------------- */
/* Matters                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The six phases of the PRD's journey.
 *
 * `status_transition` is the phase where an existing authorisation becomes a
 * different one. Spain says *situación administrativa* and Mexico says
 * *condición de estancia* for the underlying concept, so neither country's term
 * is used: *estatus migratorio* is understood in both and claims neither.
 */
export const MATTER_PHASE_LABEL: Readonly<Record<MatterPhase, Bi>> = {
  intake: bi('Intake', 'Admisión'),
  identity_validation: bi('Identity validation', 'Validación de identidad'),
  document_assembly: bi('Document assembly', 'Preparación documental'),
  submission: bi('Submission', 'Presentación'),
  post_arrival_tracking: bi('Post-arrival tracking', 'Seguimiento tras la llegada'),
  status_transition: bi('Status transition', 'Transición de estatus'),
};

/**
 * Matter status. Agreement is masculine throughout because the noun is
 * *expediente*.
 *
 * `withdrawn` is *Desistido* rather than *Retirado*: withdrawing an application
 * before a decision is *desistimiento* in both Spanish and Mexican procedure,
 * and it is a different act from the file simply being dropped, which is
 * `abandoned`.
 */
export const MATTER_STATUS_LABEL: Readonly<Record<MatterStatus, Bi>> = {
  draft: bi('Draft', 'Borrador'),
  active: bi('Active', 'Activo'),
  awaiting_applicant: bi('Awaiting applicant', 'A la espera del solicitante'),
  awaiting_authority: bi('Awaiting authority', 'A la espera de la autoridad'),
  awaiting_representative_review: bi(
    'Awaiting representative review',
    'A la espera de revisión del representante',
  ),
  submitted: bi('Submitted', 'Presentado'),
  granted: bi('Granted', 'Concedido'),
  refused: bi('Refused', 'Denegado'),
  withdrawn: bi('Withdrawn', 'Desistido'),
  abandoned: bi('Abandoned', 'Abandonado'),
};

/** Task status. Feminine, because the noun is *tarea*. */
export const TASK_STATUS_LABEL: Readonly<Record<TaskStatus, Bi>> = {
  locked: bi('Locked', 'Bloqueada'),
  available: bi('Available', 'Disponible'),
  in_progress: bi('In progress', 'En curso'),
  submitted: bi('Submitted', 'Presentada'),
  complete: bi('Complete', 'Completada'),
  waived: bi('Waived', 'Dispensada'),
};

export const TASK_ASSIGNEE_LABEL: Readonly<Record<TaskAssignee, Bi>> = {
  applicant: bi('Applicant', 'Solicitante'),
  representative: bi('Representative', 'Representante'),
  employer: bi('Employer', 'Empleador'),
  platform: bi('Platform', 'Plataforma'),
  authority: bi('Authority', 'Autoridad'),
};

/** Who has to move for a blocked file to move. */
export const BLOCKER_OWNER_LABEL: Readonly<Record<BlockerOwner, Bi>> = {
  firm: bi('The firm', 'El despacho'),
  representative: bi('The representative', 'El representante'),
  applicant: bi('The applicant', 'El solicitante'),
  authority: bi('The authority', 'La autoridad'),
  employer: bi('The employer', 'El empleador'),
  platform: bi('The platform', 'La plataforma'),
};

export const DEADLINE_KIND_LABEL: Readonly<Record<DeadlineKind, Bi>> = {
  authorisation_expiry: bi('Authorisation expiry', 'Caducidad de la autorización'),
  document_expiry: bi('Document expiry', 'Caducidad del documento'),
  acceptance_window: bi('Acceptance window', 'Ventana de aceptación'),
  target_submission: bi('Planned filing', 'Presentación prevista'),
  task_due: bi('Task due', 'Vencimiento de tarea'),
  credential_expiry: bi('Credential expiry', 'Caducidad de credencial'),
};

/* -------------------------------------------------------------------------- */
/* Disclosure                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The three disclosure classes.
 *
 * These follow the register the applicant portal already established:
 * *información*, *evaluación*, *asesoramiento*. `advice` in particular has to be
 * *asesoramiento* and nothing else — it is the word the Spanish and Mexican
 * professional statutes use for the reserved act, and a looser word like
 * *consejo* would describe something the licensing rules do not govern.
 */
export const DISCLOSURE_CLASS_LABEL: Readonly<Record<DisclosureClass, Bi>> = {
  information: bi('Information', 'Información'),
  assessment: bi('Assessment', 'Evaluación'),
  advice: bi('Advice', 'Asesoramiento'),
};

export const AUDIENCE_LABEL: Readonly<Record<Audience, Bi>> = {
  applicant: bi('Applicant', 'Solicitante'),
  practitioner: bi('Practitioner', 'Profesional habilitado'),
  corporate_sponsor: bi('Corporate sponsor', 'Empresa patrocinadora'),
  platform_operator: bi('Platform operator', 'Operador de la plataforma'),
};

/**
 * A regulated standing, and the language its name is in.
 *
 * The `lang` is not decoration. On a Spanish page, *Notaire du Québec* rendered
 * without `lang="fr"` is read out by a screen reader with Spanish phonetics, and
 * the practitioner hearing it does not recognise the body being named. This is
 * the same rule `@meridian/i18n` applies to the title of a statute, applied to
 * the title of a professional standing.
 *
 * Where the standing is Spanish, the English side already carried the Spanish
 * name — *Abogado colegiado*, *Gestor administrativo* — because that is what the
 * standing is called, and the previous author was right about that. Those get
 * `lang="es"` when the page is in English, for the same reason in reverse.
 *
 * The two Canadian descriptors are the one place a translation is offered:
 * "Canadian lawyer" and "Canadian paralegal" are descriptions of a class of
 * licensee rather than a conferred title, so *Abogado de Canadá* and *Paralegal
 * de Canadá* name the same class without borrowing a Spanish title of art. They
 * deliberately do **not** say *colegiado*, which is the specific Spanish
 * standing and would imply an equivalence between a provincial law society and a
 * Spanish colegio that nobody has established.
 */
export interface CredentialLabel {
  readonly text: string;
  /** BCP 47 tag when the name is not in the page's language. */
  readonly lang?: string;
}

export function credentialLabel(
  credential: RepresentativeCredential,
  locale: Locale,
): CredentialLabel {
  switch (credential) {
    case 'rcic':
      // An initialism of the College's own English title. Read letter by letter
      // in both languages, so it carries no `lang` in either.
      return { text: 'RCIC' };
    case 'canadian_lawyer':
      return locale === 'es' ? { text: 'Abogado de Canadá' } : { text: 'Canadian lawyer' };
    case 'canadian_paralegal':
      return locale === 'es' ? { text: 'Paralegal de Canadá' } : { text: 'Canadian paralegal' };
    case 'quebec_notary':
      return locale === 'es'
        ? { text: 'Notaire du Québec', lang: 'fr' }
        : { text: 'Quebec notary' };
    case 'spanish_abogado':
      return locale === 'es' ? { text: 'Abogado colegiado' } : { text: 'Abogado colegiado', lang: 'es' };
    case 'spanish_gestor':
      return locale === 'es'
        ? { text: 'Gestor administrativo' }
        : { text: 'Gestor administrativo', lang: 'es' };
    case 'other_regulated':
      return locale === 'es'
        ? { text: 'Otra habilitación regulada' }
        : { text: 'Other regulated standing' };
  }
}

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Review status.
 *
 * Every label is an invariant noun or verb phrase, so it agrees with *la vía*,
 * *el registro* and *la ficha* alike and nobody has to remember which noun the
 * screen used. `unreviewed` is *Sin revisar* — the plainest available way of
 * saying nobody has read it. It is not *pendiente de revisión*, which implies
 * somebody is on their way.
 */
export const REVIEW_STATUS_LABEL: Readonly<Record<ReviewStatus, Bi>> = {
  unreviewed: bi('Unreviewed', 'Sin revisar'),
  counsel_reviewed: bi('Counsel reviewed', 'Revisión de letrado'),
  needs_reverification: bi('Needs re-verification', 'Requiere nueva verificación'),
};

/** Pathway status. Feminine, because the noun is *vía*. */
export const PATHWAY_STATUS_LABEL: Readonly<Record<PathwayStatus, Bi>> = {
  open: bi('Open', 'Abierta'),
  closed: bi('Closed', 'Cerrada'),
  suspended: bi('Suspended', 'Suspendida'),
};

export const PATHWAY_KIND_LABEL: Readonly<Record<PathwayKind, Bi>> = {
  residence_permit: bi('Residence permit', 'Autorización de residencia'),
  work_permit: bi('Work permit', 'Autorización de trabajo'),
  naturalization: bi('Naturalisation', 'Naturalización'),
  permanent_residence: bi('Permanent residence', 'Residencia permanente'),
  entry_facilitation: bi('Entry facilitation', 'Facilitación de entrada'),
};

/**
 * How much a criterion matters.
 *
 * `blocking` is *Excluyente*, the term Spanish administrative practice uses for
 * a requirement whose failure ends the application. *Bloqueante* would be a
 * calque describing the software rather than the rule.
 *
 * `material` is *Relevante* and not *Sustancial*: the whole point of the weight
 * is that it can hold back a yes and never produces a no, and *sustancial*
 * reads as decisive.
 */
export const CRITERION_WEIGHT_LABEL: Readonly<Record<CriterionWeight, Bi>> = {
  blocking: bi('Blocking', 'Excluyente'),
  material: bi('Material', 'Relevante'),
  informational: bi('Informational', 'Informativo'),
};

/** What a criterion is about. Grouping only; the engine never branches on it. */
export const CRITERION_KIND_LABEL: Readonly<Record<CriterionKind, Bi>> = {
  nationality: bi('Nationality', 'Nacionalidad'),
  residence: bi('Residence', 'Residencia'),
  status: bi('Status', 'Estatus migratorio'),
  language: bi('Language', 'Idioma'),
  integration: bi('Integration', 'Integración'),
  character: bi('Character', 'Conducta y antecedentes'),
  economic: bi('Economic', 'Medios económicos'),
  employment: bi('Employment', 'Empleo'),
  qualification: bi('Qualification', 'Titulación'),
  health: bi('Health', 'Salud'),
  intent: bi('Intent', 'Intención'),
  procedural: bi('Procedural', 'Procedimiento'),
};

/**
 * What kind of instrument a rule rests on.
 *
 * `policy` is *Instrucción administrativa* rather than *Política*: the English
 * word here means a binding administrative instruction or published manual, and
 * *política* in Spanish would be read as an organisational stance.
 */
export const SOURCE_KIND_LABEL: Readonly<Record<SourceKind, Bi>> = {
  treaty: bi('Treaty', 'Tratado'),
  statute: bi('Statute', 'Ley'),
  regulation: bi('Regulation', 'Reglamento'),
  policy: bi('Policy', 'Instrucción administrativa'),
  case_law: bi('Case law', 'Jurisprudencia'),
  official_guidance: bi('Official guidance', 'Guía oficial'),
  statistics: bi('Statistics', 'Estadística oficial'),
  secondary: bi('Secondary', 'Fuente secundaria'),
};

/** Citation freshness. Feminine, because the noun is *cita*. */
export const STALENESS_LABEL: Readonly<Record<Staleness, Bi>> = {
  fresh: bi('Fresh', 'Reciente'),
  aging: bi('Aging', 'Envejeciendo'),
  stale: bi('Stale', 'Obsoleta'),
};

export const ISSUE_SEVERITY_LABEL: Readonly<Record<IssueSeverity, Bi>> = {
  error: bi('Error', 'Error'),
  warning: bi('Warning', 'Aviso'),
};

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Document kinds.
 *
 * `birth_certificate` and `marriage_certificate` say *acta o certificado*
 * because Mexico issues an *acta* and Spain a *certificado*, this console serves
 * both corridors, and picking one country's word would misname the document the
 * other country's client is holding.
 *
 * `professional_licence` is *Habilitación profesional* rather than *Licencia
 * profesional*: in Spain the thing that authorises practice is a colegiación or
 * habilitación, and *licencia* would name a different instrument.
 */
export const DOCUMENT_KIND_LABEL: Readonly<Record<DocumentKind, Bi>> = {
  passport: bi('Passport', 'Pasaporte'),
  national_id: bi('National identity document', 'Documento nacional de identidad'),
  birth_certificate: bi('Birth certificate', 'Acta o certificado de nacimiento'),
  marriage_certificate: bi('Marriage certificate', 'Acta o certificado de matrimonio'),
  criminal_record: bi('Criminal record certificate', 'Certificado de antecedentes penales'),
  proof_of_income: bi('Proof of income', 'Prueba de ingresos'),
  proof_of_accommodation: bi('Proof of accommodation', 'Prueba de alojamiento'),
  health_insurance: bi('Health insurance', 'Seguro de salud'),
  degree_certificate: bi('Degree certificate', 'Título académico'),
  academic_transcript: bi('Academic transcript', 'Certificación académica'),
  professional_licence: bi('Professional licence', 'Habilitación profesional'),
  employment_offer: bi('Employment offer', 'Oferta de empleo'),
  employment_contract: bi('Employment contract', 'Contrato de trabajo'),
  cv: bi('CV', 'Currículum'),
  photograph: bi('Photograph', 'Fotografía'),
  application_form: bi('Application form', 'Formulario de solicitud'),
  payment_receipt: bi('Payment receipt', 'Justificante de pago'),
  biometrics_confirmation: bi('Biometrics confirmation', 'Confirmación de biometría'),
  prior_visa: bi('Prior visa or permit', 'Visado o permiso anterior'),
  travel_itinerary: bi('Travel itinerary', 'Itinerario de viaje'),
};

/** Where a document sits in the acceptance lifecycle. Masculine: *documento*. */
export const DOCUMENT_STATUS_LABEL: Readonly<Record<DocumentStatus, Bi>> = {
  required: bi('Required', 'Requerido'),
  provided: bi('Provided', 'Aportado'),
  under_review: bi('Under review', 'En revisión'),
  accepted: bi('Accepted', 'Aceptado'),
  rejected: bi('Rejected', 'Rechazado'),
  expired: bi('Expired', 'Caducado'),
};

/** Legalisation route. Feminine, because the noun is *vía*. */
export const LEGALISATION_ROUTE_LABEL: Readonly<Record<LegalisationRoute, Bi>> = {
  none: bi('None required', 'Ninguna'),
  apostille: bi('Apostille', 'Apostilla'),
  consular: bi('Consular', 'Consular'),
  unknown: bi('Unknown', 'Desconocida'),
};

/**
 * The freshness verdict on filing day.
 *
 * `unknown` is *Sin determinar*, which is a statement that the check could not
 * be run. It must never read as a mild version of *Válido*: an unchecked
 * document and a checked-and-fine document are different answers, and the whole
 * reason this verdict exists is that a today-only check conflates them.
 */
export const FRESHNESS_VERDICT_LABEL: Readonly<Record<FreshnessVerdict, Bi>> = {
  valid: bi('Valid', 'Válido'),
  expires_before_submission: bi(
    'Expires before submission',
    'Caduca antes de la presentación',
  ),
  already_expired: bi('Already expired', 'Ya caducado'),
  unknown: bi('Not determined', 'Sin determinar'),
};

/* -------------------------------------------------------------------------- */
/* Integrations                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Capability states.
 *
 * These are the labels that carry the board's honesty, and each Spanish half is
 * chosen to be exactly as unflattering as its English half.
 *
 * `not_provisioned` is *Sin aprovisionar* — nothing has been signed, issued or
 * configured. Not *en preparación*, which would claim work is under way.
 * `refused_by_policy` is *Rechazada por política* — a settled decision. Not *no
 * disponible*, which would file a decision under the same heading as an outage.
 */
export const CAPABILITY_STATE_LABEL: Readonly<Record<CapabilityState, Bi>> = {
  available: bi('Available', 'Disponible'),
  not_provisioned: bi('Not provisioned', 'Sin aprovisionar'),
  not_implemented: bi('Not implemented', 'Sin implementar'),
  degraded: bi('Degraded', 'Degradada'),
  refused_by_policy: bi('Refused by policy', 'Rechazada por política'),
};

export const CAPABILITY_SURFACE_LABEL: Readonly<Record<CapabilitySurface, Bi>> = {
  government_system: bi('Government system', 'Sistema de la administración'),
  local_computation: bi('Local computation', 'Cálculo local'),
};

/**
 * What a capability is waiting on.
 *
 * `endpoint` stays *Endpoint*. Spanish-speaking operators call it that, and
 * translating it to *punto final* would make the row harder to act on, which is
 * the only thing this label is for.
 */
export const REQUIREMENT_KIND_LABEL: Readonly<Record<RequirementKind, Bi>> = {
  service_secret: bi('Service secret', 'Secreto del servicio'),
  agreement: bi('Agreement', 'Convenio o acreditación'),
  endpoint: bi('Endpoint', 'Endpoint'),
  transport: bi('Transport', 'Transporte'),
};

/**
 * The policy refusals, by name.
 *
 * `no_credential_custody` is the refusal to hold a citizen's own government
 * authenticator. *Credencial* is the word both Spain's Cl@ve and Mexico's
 * e.firma documentation use for the thing being refused.
 */
export const POLICY_REFUSAL_LABEL: Readonly<Record<PolicyRefusal, Bi>> = {
  no_credential_custody: bi('No credential custody', 'Sin custodia de credenciales'),
  no_impersonation: bi('No impersonation', 'Sin suplantación'),
};

/**
 * Look up a policy refusal that arrived as a bare string.
 *
 * `refusalsByPolicy` groups by the raw key, so this has to cope with a policy
 * the label table has not been told about. It returns the code verbatim rather
 * than a friendly placeholder: a refusal nobody has named is a gap a reader
 * should be able to see, and "Other" would hide it.
 */
export function policyRefusalLabel(policy: string, locale: Locale): string {
  const known = Object.prototype.hasOwnProperty.call(POLICY_REFUSAL_LABEL, policy)
    ? POLICY_REFUSAL_LABEL[policy as PolicyRefusal]
    : undefined;
  return known === undefined ? policy : known[locale];
}

/* -------------------------------------------------------------------------- */
/* Roster                                                                     */
/* -------------------------------------------------------------------------- */

/** Licence standing. Feminine, because the noun is *credencial* or *licencia*. */
export const LICENCE_STANDING_LABEL: Readonly<Record<LicenceStanding, Bi>> = {
  live: bi('Live', 'Vigente'),
  expiring: bi('Expiring', 'Próxima a caducar'),
  lapsed: bi('Lapsed', 'Caducada'),
  no_expiry_recorded: bi('No expiry recorded', 'Sin caducidad registrada'),
  unreadable_expiry: bi('Unreadable expiry', 'Caducidad ilegible'),
};

/** How long since a human last checked the standing against the public register. */
export const VERIFICATION_STANDING_LABEL: Readonly<Record<VerificationStanding, Bi>> = {
  current: bi('Current', 'Al día'),
  due: bi('Due', 'Pendiente'),
  overdue: bi('Overdue', 'Vencida'),
  unreadable: bi('Unreadable', 'Ilegible'),
};

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Audit event kinds.
 *
 * `disclosure_downgraded` is the entry a regulator asks about, and *Divulgación
 * rebajada* keeps that plain: something was produced at one class and released
 * at a lower one. *Degradada* would read as a fault in the system rather than a
 * decision the gate took correctly.
 */
export const AUDIT_EVENT_LABEL: Readonly<Record<AuditEventKind, Bi>> = {
  matter_opened: bi('Matter opened', 'Expediente abierto'),
  phase_advanced: bi('Phase advanced', 'Fase avanzada'),
  status_changed: bi('Status changed', 'Estado modificado'),
  representative_assigned: bi('Representative assigned', 'Representante asignado'),
  representative_unassigned: bi('Representative unassigned', 'Representante desasignado'),
  credential_verified: bi('Credential verified', 'Credencial verificada'),
  task_completed: bi('Task completed', 'Tarea completada'),
  document_received: bi('Document received', 'Documento recibido'),
  document_status_changed: bi('Document status changed', 'Estado del documento modificado'),
  disclosure_released: bi('Disclosure released', 'Divulgación entregada'),
  disclosure_downgraded: bi('Disclosure downgraded', 'Divulgación rebajada'),
  catalog_review_recorded: bi('Catalog review recorded', 'Revisión de catálogo registrada'),
  integration_refused: bi('Integration refused', 'Integración rechazada'),
};

export const AUDIT_ACTOR_LABEL: Readonly<Record<AuditActorKind, Bi>> = {
  representative: bi('Representative', 'Representante'),
  staff: bi('Firm staff', 'Personal del despacho'),
  applicant: bi('Applicant', 'Solicitante'),
  platform: bi('Platform', 'Plataforma'),
  authority: bi('Authority', 'Autoridad'),
};
