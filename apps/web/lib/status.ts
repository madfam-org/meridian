/**
 * The single place a domain value becomes a colour and a word.
 *
 * Every status shown in this portal resolves through here. Centralising it is
 * what makes the accessibility rule enforceable rather than aspirational: a
 * page cannot invent a red pill with no label, because it has no way to build
 * one — it asks this module for a `{ tone, label }` pair and hands both to
 * `<Badge>`, which always renders a glyph and a word alongside the colour.
 *
 * The labels are bilingual for the same reason the catalog is. "Unmet" and
 * "no cumplido" are the words a person will repeat to whoever helps them.
 */

import type { MatterPhase, MatterStatus, Staleness, TaskAssignee, TaskStatus } from '@meridian/core';
import type { ContinuityLimb, InconsistencyKind } from '@meridian/presence';
import type {
  CriterionKind,
  CriterionWeight,
  CriterionStatus,
  PathwayKind,
  PathwayStatus,
  ReviewStatus,
  Verdict,
} from '@meridian/pathways';

import type { Tone } from '@/components/Badge';
import { bi, type Bi } from './i18n';

export interface StatusView {
  readonly tone: Tone;
  readonly label: Bi;
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

/**
 * Verdict wording is careful on purpose.
 *
 * `eligible` becomes "Meets the encoded criteria", never "Approved" or
 * "You qualify". The engine measures an applicant against the rules Meridian
 * has written down; no authority is bound by that, and a word implying
 * otherwise would be a prediction of outcome — the most heavily regulated thing
 * an unlicensed adviser can say.
 */
export function verdictView(verdict: Verdict): StatusView {
  switch (verdict) {
    case 'eligible':
      return { tone: 'ok', label: bi('Meets the encoded criteria', 'Cumple los criterios codificados') };
    case 'ineligible':
      return { tone: 'bad', label: bi('Blocked on the recorded facts', 'Bloqueado con los datos registrados') };
    case 'indeterminate':
      return {
        tone: 'warn',
        label: bi('Not decidable on the recorded facts', 'No decidible con los datos registrados'),
      };
    case 'requires_human_review':
      return { tone: 'review', label: bi('Needs a person to review', 'Requiere revisión humana') };
  }
}

export function criterionStatusView(status: CriterionStatus): StatusView {
  switch (status) {
    case 'met':
      return { tone: 'ok', label: bi('Met', 'Cumplido') };
    case 'unmet':
      return { tone: 'bad', label: bi('Unmet', 'No cumplido') };
    case 'unknown':
      return { tone: 'warn', label: bi('Not recorded', 'Sin datos') };
    case 'requires_human_review':
      return { tone: 'review', label: bi('Needs review', 'Requiere revisión') };
  }
}

export function criterionWeightView(weight: CriterionWeight): StatusView {
  switch (weight) {
    case 'blocking':
      return { tone: 'neutral', label: bi('Blocking', 'Bloqueante') };
    case 'material':
      return { tone: 'neutral', label: bi('Material', 'Relevante') };
    case 'informational':
      return { tone: 'neutral', label: bi('Informational', 'Informativo') };
  }
}

const CRITERION_KIND_LABEL: Record<CriterionKind, Bi> = {
  nationality: bi('Nationality', 'Nacionalidad'),
  residence: bi('Residence', 'Residencia'),
  status: bi('Immigration status', 'Situación migratoria'),
  language: bi('Language', 'Idioma'),
  integration: bi('Integration', 'Integración'),
  character: bi('Character', 'Conducta'),
  economic: bi('Economic means', 'Medios económicos'),
  employment: bi('Employment', 'Empleo'),
  qualification: bi('Qualifications', 'Titulación'),
  health: bi('Health cover', 'Cobertura sanitaria'),
  intent: bi('Intent', 'Intención'),
  procedural: bi('Procedure', 'Procedimiento'),
};

export function criterionKindLabel(kind: CriterionKind): Bi {
  return CRITERION_KIND_LABEL[kind];
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Review status is the gate that decides whether a pathway may ever appear in
 * an advice-class recommendation. It is rendered honestly and prominently:
 * `unreviewed` is the accurate state of every record in the shipped catalog,
 * and dressing it up as "draft" or hiding it would defeat the point.
 */
export function reviewStatusView(status: ReviewStatus): StatusView {
  switch (status) {
    case 'counsel_reviewed':
      return { tone: 'ok', label: bi('Counsel reviewed', 'Revisado por letrado') };
    case 'unreviewed':
      return { tone: 'warn', label: bi('Not reviewed by counsel', 'No revisado por letrado') };
    case 'needs_reverification':
      return { tone: 'warn', label: bi('Review out of date', 'Revisión desactualizada') };
  }
}

export function pathwayStatusView(status: PathwayStatus): StatusView {
  switch (status) {
    case 'open':
      return { tone: 'ok', label: bi('Open to new applications', 'Abierta a nuevas solicitudes') };
    case 'closed':
      return { tone: 'bad', label: bi('Closed to new applications', 'Cerrada a nuevas solicitudes') };
    case 'suspended':
      return { tone: 'warn', label: bi('Not accepting applications', 'No admite solicitudes') };
  }
}

const PATHWAY_KIND_LABEL: Record<PathwayKind, Bi> = {
  residence_permit: bi('Residence permit', 'Autorización de residencia'),
  work_permit: bi('Work permit', 'Permiso de trabajo'),
  naturalization: bi('Naturalisation', 'Nacionalidad'),
  permanent_residence: bi('Permanent residence', 'Residencia permanente'),
  entry_facilitation: bi('Entry facilitation', 'Facilitación de entrada'),
};

export function pathwayKindLabel(kind: PathwayKind): Bi {
  return PATHWAY_KIND_LABEL[kind];
}

/**
 * Citation freshness. `@meridian/core` bands verification age at 90 and 180
 * days because immigration rules move fast enough that a citation nobody has
 * re-read in half a year should not be silently trusted.
 */
export function stalenessView(value: Staleness): StatusView {
  switch (value) {
    case 'fresh':
      return { tone: 'ok', label: bi('Verified recently', 'Verificada recientemente') };
    case 'aging':
      return { tone: 'warn', label: bi('Verification ageing', 'Verificación envejeciendo') };
    case 'stale':
      return { tone: 'bad', label: bi('Verification out of date', 'Verificación caducada') };
  }
}

// ---------------------------------------------------------------------------
// Matters and tasks
// ---------------------------------------------------------------------------

const MATTER_STATUS_VIEW: Record<MatterStatus, StatusView> = {
  draft: { tone: 'neutral', label: bi('Draft', 'Borrador') },
  active: { tone: 'info', label: bi('Active', 'En curso') },
  awaiting_applicant: { tone: 'warn', label: bi('Waiting on you', 'Pendiente de usted') },
  awaiting_authority: { tone: 'info', label: bi('Waiting on the authority', 'Pendiente de la administración') },
  awaiting_representative_review: {
    tone: 'review',
    label: bi('Waiting on a representative', 'Pendiente de representante'),
  },
  submitted: { tone: 'info', label: bi('Submitted', 'Presentado') },
  granted: { tone: 'ok', label: bi('Granted', 'Concedido') },
  refused: { tone: 'bad', label: bi('Refused', 'Denegado') },
  withdrawn: { tone: 'neutral', label: bi('Withdrawn', 'Desistido') },
  abandoned: { tone: 'neutral', label: bi('Abandoned', 'Caducado') },
};

export function matterStatusView(status: MatterStatus): StatusView {
  return MATTER_STATUS_VIEW[status];
}

const PHASE_LABEL: Record<MatterPhase, Bi> = {
  intake: bi('Intake', 'Alta'),
  identity_validation: bi('Identity validation', 'Validación de identidad'),
  document_assembly: bi('Document assembly', 'Reunión de documentos'),
  submission: bi('Submission', 'Presentación'),
  post_arrival_tracking: bi('Post-arrival tracking', 'Seguimiento posterior'),
  status_transition: bi('Status transition', 'Cambio de situación'),
};

export function phaseLabel(phase: MatterPhase): Bi {
  return PHASE_LABEL[phase];
}

const TASK_STATUS_VIEW: Record<TaskStatus, StatusView> = {
  locked: { tone: 'neutral', label: bi('Locked', 'Bloqueada') },
  available: { tone: 'info', label: bi('Ready to start', 'Lista para empezar') },
  in_progress: { tone: 'warn', label: bi('In progress', 'En curso') },
  submitted: { tone: 'info', label: bi('Submitted', 'Enviada') },
  complete: { tone: 'ok', label: bi('Complete', 'Completada') },
  waived: { tone: 'neutral', label: bi('Waived', 'No aplicable') },
};

export function taskStatusView(status: TaskStatus): StatusView {
  return TASK_STATUS_VIEW[status];
}

const ASSIGNEE_LABEL: Record<TaskAssignee, Bi> = {
  applicant: bi('You', 'Usted'),
  representative: bi('Authorised representative', 'Representante autorizado'),
  employer: bi('Employer', 'Empleador'),
  platform: bi('Meridian', 'Meridian'),
  authority: bi('Government authority', 'Administración'),
};

export function assigneeLabel(assignee: TaskAssignee): Bi {
  return ASSIGNEE_LABEL[assignee];
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

/**
 * Faults in the record itself, not measurements against a rule.
 *
 * Only `conflicting_location` is physically impossible and reads as an error;
 * the rest are gaps and imputations, which are ordinary in a real travel
 * history and must not be dressed as failures. An imputed departure in
 * particular is the engine being honest about something it invented, and a red
 * badge would train people to ignore it.
 */
const INCONSISTENCY_VIEW: Record<InconsistencyKind, StatusView> = {
  conflicting_location: {
    tone: 'bad',
    label: bi('Two countries on one day', 'Dos países el mismo día'),
  },
  unknown_location: {
    tone: 'warn',
    label: bi('Days nobody accounts for', 'Días sin justificar'),
  },
  future_presence: {
    tone: 'info',
    label: bi('Presence after the evaluation date', 'Presencia posterior a la fecha de evaluación'),
  },
  imputed_departure: {
    tone: 'warn',
    label: bi('Departure date imputed', 'Fecha de salida imputada'),
  },
};

export function inconsistencyView(kind: InconsistencyKind): StatusView {
  return INCONSISTENCY_VIEW[kind];
}

const CONTINUITY_LIMB_LABEL: Record<ContinuityLimb, Bi> = {
  single_absence: bi('One unbroken absence', 'Una ausencia ininterrumpida'),
  cumulative_per_year: bi('Absence within one residence year', 'Ausencia en un año de residencia'),
  cumulative_total: bi('Absence across the whole period', 'Ausencia en todo el periodo'),
};

export function continuityLimbLabel(limb: ContinuityLimb): Bi {
  return CONTINUITY_LIMB_LABEL[limb];
}
