/**
 * Who Meridian is for, what each of them gets, and what it costs.
 *
 * ── The one idea this file encodes ──────────────────────────────────────────
 *
 * **The advice boundary is the pricing mechanism.** `@meridian/core` classifies
 * every engine output at birth as `information`, `assessment` or `advice`, and
 * `canRelease` decides whether that class may reach a given audience. Under
 * s.91 of Canada's Immigration and Refugee Protection Act and Spain's reserved
 * activity rules, advice-class output requires an authorised representative who
 * is accountable for it. Information and assessment require nobody.
 *
 * So the commercial line and the legal line are the same line, and this module
 * does not restate it — it *runs* it. {@link releasableToUnrepresented} calls
 * the real gate, for every jurisdiction the catalog covers, and the free tier's
 * contents are the capabilities that come back releasable. Nothing decides what
 * is free except the gate. If `canRelease` were changed to release advice to an
 * unrepresented applicant, the free tier on `/pricing` would grow on the next
 * build, which is the correct and alarming behaviour: the page would be telling
 * the truth about a system that had stopped being safe.
 *
 * ── Why there are no prices in here ─────────────────────────────────────────
 *
 * {@link Tier} has no field for a currency amount. That is deliberate and it is
 * the enforcement, not an oversight: prices are not decided, and a schema with
 * a `price: number` in it is a schema someone fills in with a plausible-looking
 * figure at 11pm. {@link Tier.price} is a two-valued state — charged, or not
 * charged — and the pages render "not set" from it. When a real price exists it
 * will arrive as a change to this type, reviewed like any other change.
 *
 * ── Why availability is a field ─────────────────────────────────────────────
 *
 * There is no account system, no billing and no serving API. Four of the five
 * tiers below therefore cannot be obtained by anybody today. A pricing page for
 * a product you cannot buy is honest if it says so and a lie if it does not, so
 * {@link Tier.availableToday} is a required field and every surface that
 * renders a tier renders its availability with it.
 *
 * ── What is derived and what is written ─────────────────────────────────────
 *
 * Derived from code, so it cannot go stale: which classes release to whom (the
 * gate), which capabilities are free (the gate), how many tiers are obtainable,
 * which tiers contain advice-class capability, the jurisdictions in scope, the
 * day-count thresholds and their citations, the CEC hours figures.
 *
 * Written by hand: who each audience is and what their problem is. That cannot
 * be derived from a catalog, and pretending otherwise would produce vaguer copy,
 * not truer copy. Everything written here is a statement about Meridian — never
 * a statement about law, which belongs in a citation record with a `verifiedOn`
 * date and a review status.
 */

import type { Audience, DisclosureClass, ReleaseContext, ReleaseDecision } from '@meridian/core';
import { canRelease } from '@meridian/core';
import {
  CEC_LOOKBACK_YEARS,
  CEC_REQUIRED_HOURS,
  CEC_WEEKLY_HOURS_CAP,
  PRESENCE_CITATIONS,
  TAX_DAY_COUNT_THRESHOLDS,
} from '@meridian/presence';
import type { InconsistencyKind, PresenceConfidence, PresenceSource } from '@meridian/presence';

import { bi, type Bi } from '@/lib/i18n';
import { COVERED_JURISDICTIONS } from '@/lib/coverage';
import { AS_OF } from '@/lib/sample/common';

// ---------------------------------------------------------------------------
// The gate, run for real
// ---------------------------------------------------------------------------

/**
 * A reader with nobody accountable for them: the protected case, and the one
 * the free tier is defined against.
 *
 * `forConsideration` is false because the free tier is free. It changes nothing
 * — the gate downgrades either way, and `@meridian/core` says why: an
 * unlicensed recommendation that happens to be lawful is still one nobody is
 * answerable for.
 */
function unrepresented(audience: Audience, jurisdiction: string): ReleaseContext {
  return {
    audience,
    jurisdiction,
    representative: null,
    forConsideration: false,
    asOf: AS_OF,
  };
}

/**
 * Whether this class of output reaches a person with no representative, in
 * every jurisdiction the catalog covers.
 *
 * `every`, not `some`: a class that releases in Spain and not in Canada is not
 * a free capability, it is a jurisdiction-specific one, and the free tier must
 * not be defined by its most permissive corner.
 */
export function releasableToUnrepresented(value: DisclosureClass): boolean {
  return COVERED_JURISDICTIONS.every((code) => {
    const decision = canRelease(value, unrepresented('applicant', code));
    return decision.allowed;
  });
}

/** One row of the gate demonstration: an audience, and what the gate did. */
export interface GateOutcome {
  readonly audience: Audience;
  readonly label: Bi;
  readonly detail: Bi;
  readonly decision: ReleaseDecision;
}

/**
 * The gate asked the same question — may advice reach this reader? — for the
 * three audiences a commercial tier can correspond to, with no representative
 * attached in any of them.
 *
 * No `AuthorizedRepresentative` is constructed anywhere in this module. A
 * fabricated licence number in a demonstration is a fabricated licence number,
 * and the interesting rows are the refusals in any case: they are what the
 * Professional tier exists to change.
 *
 * The jurisdiction is the first the catalog covers. With no representative
 * attached the gate refuses before it ever compares jurisdictions, so the
 * choice cannot affect the answer for the first two rows, and the third does
 * not reach the comparison either.
 */
const GATE_JURISDICTION: string = COVERED_JURISDICTIONS[0] ?? 'ES';

export const ADVICE_GATE_OUTCOMES: readonly GateOutcome[] = [
  {
    audience: 'applicant',
    label: bi('A person acting for themselves', 'Una persona que actúa por sí misma'),
    detail: bi(
      'No representative attached. This is the reader the reserved-activity rules exist to protect.',
      'Sin representante vinculado. Es el lector al que protegen las normas de actividad reservada.',
    ),
    decision: canRelease('advice', unrepresented('applicant', GATE_JURISDICTION)),
  },
  {
    audience: 'corporate_sponsor',
    label: bi('An employer acting for an employee', 'Un empleador que actúa por un empleado'),
    detail: bi(
      'A mobility or HR team is not a licensed audience. Paying for the software does not make it one.',
      'Un equipo de movilidad o de RR. HH. no es un destinatario con licencia. Pagar por el software no lo convierte en tal.',
    ),
    decision: canRelease('advice', unrepresented('corporate_sponsor', GATE_JURISDICTION)),
  },
  {
    audience: 'practitioner',
    label: bi(
      'A licensed professional inside a firm',
      'Un profesional con licencia dentro de un despacho',
    ),
    detail: bi(
      'The engine is a tool in their hands and they own the judgement. This is the whole of what the Professional tier unlocks.',
      'El motor es una herramienta en sus manos y el criterio es suyo. En esto consiste íntegramente lo que desbloquea el nivel Profesional.',
    ),
    decision: canRelease('advice', unrepresented('practitioner', GATE_JURISDICTION)),
  },
];

export interface GateRefusal {
  readonly reason: string;
  readonly downgradeTo: DisclosureClass;
}

function refusalOf(decision: ReleaseDecision): GateRefusal | null {
  return decision.allowed ? null : { reason: decision.reason, downgradeTo: decision.downgradeTo };
}

/**
 * The gate's own words when it refuses an unrepresented reader, for quoting
 * verbatim. `null` would mean the gate had stopped refusing, and the pages say
 * so rather than printing a refusal that no longer happens.
 */
export const ADVICE_REFUSAL: GateRefusal | null = ADVICE_GATE_OUTCOMES.reduce<GateRefusal | null>(
  (found, row) => found ?? refusalOf(row.decision),
  null,
);

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export type CapabilityId =
  | 'rule-catalog'
  | 'eligibility-assessment'
  | 'day-counters'
  | 'document-sequence'
  | 'travel-document-check'
  | 'saved-matters'
  | 'deadline-monitoring'
  | 'document-expiry-alerts'
  | 'presence-ledger'
  | 'audit-report'
  | 'caseload'
  | 'representative-assignment'
  | 'advice-release'
  | 'client-portal'
  | 'audit-trail'
  | 'employee-cohorts'
  | 'compliance-reporting';

/**
 * What something the product does puts in front of a reader.
 *
 * `produces` is the disclosure class, and it is what decides the tier — see
 * {@link FREE_CAPABILITY_IDS}. `needsContinuity` is the other axis: a
 * capability that has to remember something between two visits needs a place to
 * keep it, and a place to keep it is the thing worth paying for. The one-off
 * answer is free; the clock that keeps running is not.
 */
export interface Capability {
  readonly id: CapabilityId;
  readonly name: Bi;
  readonly detail: Bi;
  /** The class of statement this puts in front of a reader. */
  readonly produces: DisclosureClass;
  /** True when it must remember something between sessions. */
  readonly needsContinuity: boolean;
  /** Whether it exists in this build. */
  readonly state: 'shipped' | 'not_built';
  /** Where to see it, when it ships. */
  readonly href?: string;
  /** A limit worth stating next to the capability itself. */
  readonly caveat?: Bi;
}

export const CAPABILITIES: Record<CapabilityId, Capability> = {
  'rule-catalog': {
    id: 'rule-catalog',
    name: bi('The whole rule catalog', 'El catálogo completo de normas'),
    detail: bi(
      'Every encoded pathway, every criterion, and every source with the date a human last read it. Restating what a published rule says is information, so it is released to anybody.',
      'Todas las vías codificadas, todos los criterios y todas las fuentes con la fecha en que una persona las leyó por última vez. Exponer lo que dice una norma publicada es información, de modo que se entrega a cualquiera.',
    ),
    produces: 'information',
    needsContinuity: false,
    state: 'shipped',
    href: '/pathways',
  },
  'eligibility-assessment': {
    id: 'eligibility-assessment',
    name: bi('Unlimited eligibility assessment', 'Evaluación de elegibilidad sin límite'),
    detail: bi(
      'Your facts measured against the encoded criteria, criterion by criterion, with the comparison the engine performed shown for each. No account, no sign-in, no cap on how many times.',
      'Sus datos medidos frente a los criterios codificados, criterio a criterio, con la comparación que realizó el motor a la vista en cada uno. Sin cuenta, sin registro y sin límite de usos.',
    ),
    produces: 'assessment',
    needsContinuity: false,
    state: 'shipped',
    href: '/pathways',
  },
  'day-counters': {
    id: 'day-counters',
    name: bi('Every day counter', 'Todos los contadores de días'),
    detail: bi(
      'Schengen 90/180, the day-count limb of a tax residence test, continuous residence, and qualifying work hours. Each returns the de-duplicated ranges that produced the total, not just the total.',
      'Schengen 90/180, el elemento de cómputo de días de una prueba de residencia fiscal, la residencia continuada y las horas de trabajo computables. Cada uno devuelve los periodos deduplicados que produjeron el total, no solo el total.',
    ),
    produces: 'assessment',
    needsContinuity: false,
    state: 'shipped',
    href: '/tools',
  },
  'document-sequence': {
    id: 'document-sequence',
    name: bi('Document sequencing', 'Secuenciación documental'),
    detail: bi(
      'Which document needs an apostille, which needs a sworn translation, and whether each will still be current on the day you actually file — not on the day you check.',
      'Qué documento necesita apostilla, cuál necesita traducción jurada y si cada uno seguirá vigente el día en que realmente presente, no el día en que lo consulta.',
    ),
    produces: 'assessment',
    needsContinuity: false,
    state: 'shipped',
    caveat: bi(
      'The portal computes this from a deliberately small rule set of its own; the shared documents engine is not wired into it yet, and the page says so where it matters.',
      'El portal lo calcula con un conjunto de reglas propio deliberadamente pequeño; el motor documental compartido aún no está conectado, y la página lo indica donde procede.',
    ),
  },
  'travel-document-check': {
    id: 'travel-document-check',
    name: bi('Travel document check', 'Comprobación de documento de viaje'),
    detail: bi(
      'The machine-readable zone of a passport or identity card, parsed field by field, with the individual check digit that fails named when one fails.',
      'La zona de lectura mecánica de un pasaporte o documento de identidad, analizada campo por campo, indicando qué dígito de control concreto falla cuando alguno falla.',
    ),
    produces: 'assessment',
    needsContinuity: false,
    state: 'shipped',
    href: '/tools/mrz',
    caveat: bi(
      'It cannot tell you a document is genuine. It checks that the transcription in front of you is arithmetically self-consistent.',
      'No puede decirle que un documento es auténtico. Comprueba que la transcripción que tiene delante es aritméticamente coherente consigo misma.',
    ),
  },

  'saved-matters': {
    id: 'saved-matters',
    name: bi('Saved matters', 'Expedientes guardados'),
    detail: bi(
      'A file that survives closing the tab: the facts, the phase, the task sequence and every figure computed from them, kept so the next question starts where the last one ended.',
      'Un expediente que sobrevive al cierre de la pestaña: los datos, la fase, la secuencia de tareas y todas las cifras calculadas a partir de ellos, conservados para que la siguiente consulta empiece donde acabó la anterior.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'deadline-monitoring': {
    id: 'deadline-monitoring',
    name: bi('Deadline monitoring', 'Vigilancia de plazos'),
    detail: bi(
      'The dates that move on their own — a permit expiry, a residence period completing, a window closing — watched between visits rather than only when you open the page.',
      'Las fechas que se mueven solas —la caducidad de una autorización, el cumplimiento de un periodo de residencia, el cierre de un plazo— vigiladas entre una visita y otra, y no solo cuando abre la página.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'document-expiry-alerts': {
    id: 'document-expiry-alerts',
    name: bi('Document expiry alerts', 'Avisos de caducidad documental'),
    detail: bi(
      'A criminal-record certificate is valid today and worthless at an appointment four months out. The alert is anchored to the intended filing date, which is the date that decides it.',
      'Un certificado de antecedentes penales es válido hoy y no sirve en una cita dentro de cuatro meses. El aviso se ancla a la fecha prevista de presentación, que es la que lo decide.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'presence-ledger': {
    id: 'presence-ledger',
    name: bi('A persistent presence ledger', 'Un registro de presencia persistente'),
    detail: bi(
      'Every stay kept with its source and its confidence, so a count made two years from now rests on records you can produce, and every contradiction in it is reported rather than quietly resolved.',
      'Cada estancia conservada con su fuente y su fiabilidad, de modo que un cómputo hecho dentro de dos años se apoye en registros que usted pueda aportar, y toda contradicción se comunique en lugar de resolverse en silencio.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'audit-report': {
    id: 'audit-report',
    name: bi('Audit-ready reports', 'Informes preparados para auditoría'),
    detail: bi(
      'The figure, the window it was measured over, the ranges that produced it, the source and confidence of each one, and the instrument it was measured against — as one document, on a stated reference date.',
      'La cifra, la ventana sobre la que se midió, los periodos que la produjeron, la fuente y la fiabilidad de cada uno y la norma frente a la que se midió, en un solo documento y a una fecha de referencia declarada.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },

  caseload: {
    id: 'caseload',
    name: bi('Caseload', 'Cartera de expedientes'),
    detail: bi(
      'Every matter in the practice in one place, with what each is waiting on and who it is waiting on — the applicant, you, or the authority.',
      'Todos los expedientes del despacho en un solo lugar, con lo que espera cada uno y de quién lo espera: del solicitante, de usted o de la administración.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'representative-assignment': {
    id: 'representative-assignment',
    name: bi('Representative assignment', 'Asignación de representante'),
    detail: bi(
      'The licensed person accountable for a matter, recorded on it with their regulator, their licence number, the date it was last checked against the public register, and its expiry.',
      'La persona con licencia responsable de un expediente, registrada en él con su colegio o regulador, su número de licencia, la fecha en que se contrastó por última vez con el registro público y su caducidad.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'advice-release': {
    id: 'advice-release',
    name: bi('Advice-class output', 'Resultados de clase asesoramiento'),
    detail: bi(
      'Ranking of routes, with the reasoning that put one above another. This is the regulated act, it is released only where a licensed person is accountable for it, and the engine will not produce it from rules nobody qualified has signed off.',
      'La ordenación de las vías, con el razonamiento que sitúa una por encima de otra. Es el acto reservado, solo se entrega cuando una persona con licencia responde de él, y el motor no lo produce a partir de normas que nadie cualificado haya validado.',
    ),
    produces: 'advice',
    needsContinuity: false,
    state: 'not_built',
    caveat: bi(
      'Two gates, not one. Even with a representative attached, a pathway no licensed person has read never enters a ranking.',
      'Dos controles, no uno. Incluso con un representante vinculado, una vía que ninguna persona con licencia haya leído nunca entra en una ordenación.',
    ),
  },
  'client-portal': {
    id: 'client-portal',
    name: bi('Client portal', 'Portal para el cliente'),
    detail: bi(
      'Your client sees their own file — the same figures, the same sources, the same arithmetic — instead of emailing you to ask where it stands.',
      'Su cliente ve su propio expediente —las mismas cifras, las mismas fuentes, la misma aritmética— en lugar de escribirle para preguntar cómo va.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'audit-trail': {
    id: 'audit-trail',
    name: bi('Audit trail', 'Traza de auditoría'),
    detail: bi(
      'Who changed which fact, when, and what the engine computed before and after. A figure that cannot be reconstructed six months later is a figure nobody can defend.',
      'Quién cambió qué dato, cuándo, y qué calculó el motor antes y después. Una cifra que no puede reconstruirse seis meses después es una cifra que nadie puede defender.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },

  'employee-cohorts': {
    id: 'employee-cohorts',
    name: bi('Employee cohorts', 'Colectivos de empleados'),
    detail: bi(
      'Many people, several jurisdictions, one view: who is approaching a threshold, whose permit expires next quarter, whose record has days nobody can account for.',
      'Muchas personas, varias jurisdicciones y una sola vista: quién se acerca a un umbral, a quién le caduca la autorización el trimestre próximo, en el registro de quién hay días sin justificar.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
  'compliance-reporting': {
    id: 'compliance-reporting',
    name: bi('Compliance reporting', 'Informes de cumplimiento'),
    detail: bi(
      'The same figures aggregated for the person who has to answer to an auditor, with each number still traceable to the records underneath it.',
      'Las mismas cifras agregadas para quien tiene que responder ante un auditor, con cada número aún trazable hasta los registros que lo sustentan.',
    ),
    produces: 'assessment',
    needsContinuity: true,
    state: 'not_built',
  },
};

/** Display order. Not a ranking: it runs free, then continuity, then practice, then organisation. */
const CAPABILITY_ORDER: readonly CapabilityId[] = [
  'rule-catalog',
  'eligibility-assessment',
  'day-counters',
  'document-sequence',
  'travel-document-check',
  'saved-matters',
  'deadline-monitoring',
  'document-expiry-alerts',
  'presence-ledger',
  'audit-report',
  'caseload',
  'representative-assignment',
  'advice-release',
  'client-portal',
  'audit-trail',
  'employee-cohorts',
  'compliance-reporting',
];

/**
 * The free tier, derived from the gate rather than chosen.
 *
 * A capability is free when the gate releases its class to a person with nobody
 * accountable for them, it needs nothing remembered between visits, and it
 * exists today. Every one of those three is checked here, so the free tier
 * cannot come to contain something that is not free, not releasable, or not
 * built, by anybody editing a list.
 */
export const FREE_CAPABILITY_IDS: readonly CapabilityId[] = CAPABILITY_ORDER.filter((id) => {
  const capability = CAPABILITIES[id];
  return (
    capability.state === 'shipped' &&
    !capability.needsContinuity &&
    releasableToUnrepresented(capability.produces)
  );
});

/** Continuity: the same engine, remembering. */
const CONTINUITY_CAPABILITY_IDS: readonly CapabilityId[] = [
  'saved-matters',
  'deadline-monitoring',
  'document-expiry-alerts',
  'presence-ledger',
  'audit-report',
];

/** A practice: many clients, and a licensed person accountable for each. */
const PRACTICE_CAPABILITY_IDS: readonly CapabilityId[] = [
  'caseload',
  'representative-assignment',
  'advice-release',
  'client-portal',
  'audit-trail',
];

/** An organisation moving its own staff. Note what is absent: `advice-release`. */
const ORGANISATION_CAPABILITY_IDS: readonly CapabilityId[] = [
  'employee-cohorts',
  'compliance-reporting',
  'audit-trail',
];

function union(...groups: readonly (readonly CapabilityId[])[]): readonly CapabilityId[] {
  const included = new Set<CapabilityId>(groups.flat());
  return CAPABILITY_ORDER.filter((id) => included.has(id));
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export type TierId = 'free' | 'individual' | 'professional' | 'corporate' | 'clinic';

/**
 * Charged, or not charged. There is no third state and there is no amount.
 *
 * See the module note: a field that could hold a number is a field somebody
 * eventually puts a number in, and no number here would be true.
 */
export type PriceState = 'no_charge' | 'not_set';

export interface Tier {
  readonly id: TierId;
  readonly name: Bi;
  /** One line: what is actually being bought. */
  readonly premise: Bi;
  /** Who buys it, in their own words. */
  readonly buyer: Bi;
  /** How it would be counted — per person, per seat, per organisation. */
  readonly unit: Bi;
  readonly price: PriceState;
  /** True when a person can actually obtain this today. */
  readonly availableToday: boolean;
  /** What has to exist first. Empty where nothing does. */
  readonly blockedOn: readonly Bi[];
  /**
   * Whether the buyer of this tier holds a licence that covers regulated
   * migration advice. This is what makes advice-class capability legitimate in
   * a tier, and {@link TIERS_RELEASING_ADVICE_TO_UNLICENSED_BUYERS} checks it.
   */
  readonly licensedBuyer: boolean;
  readonly capabilities: readonly CapabilityId[];
  /** Anything about this tier a reader would otherwise have to ask for. */
  readonly notes: readonly Bi[];
}

const NO_ACCOUNTS: Bi = bi(
  'There is no account system. Nothing is stored, because there is nowhere yet to store it.',
  'No hay sistema de cuentas. No se almacena nada, porque todavía no hay dónde almacenarlo.',
);

const NO_BILLING: Bi = bi(
  'There is no billing. No payment method has ever been connected to this product.',
  'No hay facturación. Nunca se ha conectado ningún medio de pago a este producto.',
);

const NO_API: Bi = bi(
  'The API is not serving. Everything you can use today is computed in your own browser or built into the page.',
  'La API no está en servicio. Todo lo que puede usar hoy se calcula en su propio navegador o viene incorporado en la página.',
);

const NOT_YET_BUILDABLE: readonly Bi[] = [NO_ACCOUNTS, NO_BILLING, NO_API];

export const TIERS: readonly Tier[] = [
  {
    id: 'free',
    name: bi('Free', 'Gratuito'),
    premise: bi(
      'Every calculator, the whole catalog, unlimited assessments. No account, no limit, no expiry.',
      'Todas las calculadoras, el catálogo completo y evaluaciones sin límite. Sin cuenta, sin límite y sin caducidad.',
    ),
    buyer: bi(
      'Anybody. This is not a trial and it does not become paid later.',
      'Cualquiera. No es una prueba ni pasa a ser de pago más adelante.',
    ),
    unit: bi('No charge', 'Sin coste'),
    price: 'no_charge',
    availableToday: true,
    blockedOn: [],
    licensedBuyer: false,
    capabilities: FREE_CAPABILITY_IDS,
    notes: [
      bi(
        'The contents of this tier are not a marketing decision. They are the outputs the release gate hands to a reader with nobody accountable for them, listed by asking the gate.',
        'El contenido de este nivel no es una decisión comercial. Son los resultados que el control de divulgación entrega a un lector sin nadie que responda por él, enumerados preguntando al propio control.',
      ),
      bi(
        'Nothing here is withheld until you give an email address. A result you have to trade a contact detail for is the behaviour this product exists to be an alternative to.',
        'Aquí no se retiene nada a cambio de un correo electrónico. Un resultado por el que hay que entregar un dato de contacto es justo la práctica frente a la que existe este producto.',
      ),
    ],
  },
  {
    id: 'individual',
    name: bi('Individual', 'Individual'),
    premise: bi(
      'Continuity: something keeping the clock while you are not looking at it.',
      'Continuidad: algo que vigila el reloj cuando usted no lo está mirando.',
    ),
    buyer: bi(
      'A person managing their own move, or a cross-border adviser holding one client’s day count.',
      'Una persona que gestiona su propio traslado, o un asesor transfronterizo que lleva el cómputo de días de un cliente.',
    ),
    unit: bi('Per person', 'Por persona'),
    price: 'not_set',
    availableToday: false,
    blockedOn: NOT_YET_BUILDABLE,
    licensedBuyer: false,
    capabilities: union(FREE_CAPABILITY_IDS, CONTINUITY_CAPABILITY_IDS),
    notes: [
      bi(
        'Nothing moves from the free tier into this one. The one-off answer stays free permanently; what is paid for is the file that remembers it and the clock that keeps running.',
        'Nada pasa del nivel gratuito a este. La respuesta puntual sigue siendo gratuita de forma permanente; lo que se paga es el expediente que la recuerda y el reloj que sigue corriendo.',
      ),
    ],
  },
  {
    id: 'professional',
    name: bi('Professional', 'Profesional'),
    premise: bi(
      'The practice: a caseload, a representative accountable for each matter, and the advice-class output their licence covers.',
      'El despacho: una cartera de expedientes, un representante responsable de cada uno y los resultados de clase asesoramiento que ampara su licencia.',
    ),
    buyer: bi(
      'An immigration lawyer, a Quebec notary, a CICC licensee, or a Spanish abogado or gestor administrativo — whoever the regulator holds answerable.',
      'Un abogado de extranjería, un notario de Quebec, un colegiado del CICC, o un abogado o gestor administrativo español: quien responda ante el regulador.',
    ),
    unit: bi('Per seat', 'Por puesto'),
    price: 'not_set',
    availableToday: false,
    blockedOn: NOT_YET_BUILDABLE,
    licensedBuyer: true,
    capabilities: union(FREE_CAPABILITY_IDS, CONTINUITY_CAPABILITY_IDS, PRACTICE_CAPABILITY_IDS),
    notes: [
      bi(
        'This is the tier that unlocks advice-class output, and the reason is not commercial. A recommendation has to have somebody accountable for it; your licence is what makes it releasable, and the matter records that it was yours.',
        'Este es el nivel que desbloquea los resultados de clase asesoramiento, y el motivo no es comercial. Una recomendación exige que alguien responda de ella; su licencia es lo que la hace entregable, y el expediente registra que fue la suya.',
      ),
      bi(
        'A credential that lapses stops releasing advice on its own. The gate checks the expiry date on the record, not a flag somebody remembered to clear.',
        'Una credencial que caduca deja de habilitar el asesoramiento por sí sola. El control comprueba la fecha de caducidad del registro, no una marca que alguien recordara desactivar.',
      ),
    ],
  },
  {
    id: 'corporate',
    name: bi('Corporate', 'Empresarial'),
    premise: bi(
      'Employee cohorts, compliance reporting, and an audit trail that survives the person who built it.',
      'Colectivos de empleados, informes de cumplimiento y una traza de auditoría que sobrevive a quien la creó.',
    ),
    buyer: bi(
      'A global mobility, HR or compliance team moving its own staff.',
      'Un equipo de movilidad internacional, de RR. HH. o de cumplimiento que traslada a su propia plantilla.',
    ),
    unit: bi('Per organisation', 'Por organización'),
    price: 'not_set',
    availableToday: false,
    blockedOn: NOT_YET_BUILDABLE,
    licensedBuyer: false,
    capabilities: union(FREE_CAPABILITY_IDS, CONTINUITY_CAPABILITY_IDS, ORGANISATION_CAPABILITY_IDS),
    notes: [
      bi(
        'Advice-class output is deliberately absent from this tier. An employer is not a licensed audience, and the gate treats it as one of the protected ones — paying more does not change that. Where your employee needs advice, it comes from counsel attached to the matter, which is exactly where the liability already sits.',
        'Los resultados de clase asesoramiento están deliberadamente ausentes de este nivel. Un empleador no es un destinatario con licencia, y el control lo trata como uno de los protegidos: pagar más no cambia eso. Cuando su empleado necesita asesoramiento, procede del letrado vinculado al expediente, que es exactamente donde ya reside la responsabilidad.',
      ),
    ],
  },
  {
    id: 'clinic',
    name: bi('Legal aid and NGO clinics', 'Clínicas jurídicas y ONG'),
    premise: bi(
      'The Professional tier, in full, at no charge. Permanently.',
      'El nivel Profesional, íntegro y sin coste. De forma permanente.',
    ),
    buyer: bi(
      'A legal-aid office, a university law clinic, or an NGO whose supervising lawyer signs the advice.',
      'Un servicio de orientación jurídica gratuita, una clínica jurídica universitaria o una ONG cuyo letrado supervisor firma el asesoramiento.',
    ),
    unit: bi('No charge', 'Sin coste'),
    price: 'no_charge',
    availableToday: false,
    blockedOn: NOT_YET_BUILDABLE,
    licensedBuyer: true,
    capabilities: union(FREE_CAPABILITY_IDS, CONTINUITY_CAPABILITY_IDS, PRACTICE_CAPABILITY_IDS),
    notes: [
      bi(
        'Not a discount, not a programme with an application form, and not something that has to be requested each year. Tell us you are one and you are one.',
        'No es un descuento, ni un programa con formulario de solicitud, ni algo que haya que pedir cada año. Díganos que lo son y lo son.',
      ),
      bi(
        'It is written here rather than granted quietly because a commitment nobody can point at is not a commitment.',
        'Se escribe aquí en lugar de concederse discretamente porque un compromiso que nadie puede señalar no es un compromiso.',
      ),
    ],
  },
];

const TIER_BY_ID: Record<TierId, Tier> = {
  free: tierOrThrow('free'),
  individual: tierOrThrow('individual'),
  professional: tierOrThrow('professional'),
  corporate: tierOrThrow('corporate'),
  clinic: tierOrThrow('clinic'),
};

function tierOrThrow(id: TierId): Tier {
  const found = TIERS.find((tier) => tier.id === id);
  if (found === undefined) {
    // Unreachable while TIERS lists every TierId; a build failure is the right
    // outcome if it ever stops doing so, since every page indexes by id.
    throw new Error(`tier ${id} is declared in TierId but missing from TIERS`);
  }
  return found;
}

export function tierById(id: TierId): Tier {
  return TIER_BY_ID[id];
}

/** Tiers nobody can obtain today. Rendered as a count, so the banner cannot go stale. */
export const UNAVAILABLE_TIERS: readonly Tier[] = TIERS.filter((tier) => !tier.availableToday);

/** Tiers whose capability set includes something the gate will not release unrepresented. */
export const TIERS_RELEASING_ADVICE: readonly Tier[] = TIERS.filter((tier) =>
  tier.capabilities.some((id) => !releasableToUnrepresented(CAPABILITIES[id].produces)),
);

/**
 * The invariant this whole scheme rests on: gated output only ever sits in a
 * tier whose buyer is licensed to be accountable for it.
 *
 * Expected to be empty. It is computed rather than asserted so that a surface
 * rendering it can say what went wrong instead of a comment claiming it cannot.
 */
export const TIERS_RELEASING_ADVICE_TO_UNLICENSED_BUYERS: readonly Tier[] =
  TIERS_RELEASING_ADVICE.filter((tier) => !tier.licensedBuyer);

// ---------------------------------------------------------------------------
// Audiences
// ---------------------------------------------------------------------------

export type AudienceId =
  | 'practitioner'
  | 'corporate'
  | 'individual'
  | 'tax-adviser'
  | 'university'
  | 'legal-aid';

/**
 * Whose licence answers for a recommendation in this reader's work.
 *
 * The third value is the one people miss, and it is why the cross-border tax
 * adviser is on this list at all: a day count is assessment-class, so their use
 * of Meridian never approaches the reserved activity and no representative gate
 * applies to it in either direction.
 */
export type AdviceRoute =
  /** The reader's own licence covers regulated migration advice. */
  | 'own_licence'
  /** Someone else's licence has to. The reader is a protected audience. */
  | 'needs_representative'
  /** Nothing in their use of Meridian is advice-class, so no licence is engaged. */
  | 'not_engaged';

export interface AudienceSection {
  readonly id: string;
  readonly title: Bi;
  readonly body: readonly Bi[];
}

/**
 * A derived block a page can render. Each is computed from a package at build
 * time — not written prose — so the pages that make the strongest claims are
 * the ones showing the most code-derived evidence.
 */
export type EvidenceId =
  /** The release gate run against three audiences, with its verbatim refusal. */
  | 'release-gate'
  /** The day-count thresholds, their operators and their citations. */
  | 'day-count-thresholds'
  /** The vocabulary a presence record carries: source, confidence, contradiction. */
  | 'ledger-provenance'
  /** The hours limb of the Canadian Experience Class, with its figures. */
  | 'cec-hours'
  /** What the catalog covers and, by name, what it does not. */
  | 'catalog-coverage';

export interface AudienceDefinition {
  readonly id: AudienceId;
  readonly href: string;
  /** Who this is, as they would describe themselves. */
  readonly name: Bi;
  /** Short form, for a door on another surface. */
  readonly door: Bi;
  readonly who: Bi;
  /** The specific problem. Not "immigration is complex" — the thing that costs them. */
  readonly problem: Bi;
  /** Whether a surface with room for only a few doors should show this one. */
  readonly primaryDoor: boolean;
  readonly adviceRoute: AdviceRoute;
  /** The tier that carries what this reader needs. */
  readonly tier: TierId;
  /** The capabilities that matter to them, most load-bearing first. */
  readonly capabilities: readonly CapabilityId[];
  readonly sections: readonly AudienceSection[];
  readonly evidence: readonly EvidenceId[];
  /** What Meridian does not do for this reader. Named, not gestured at. */
  readonly limits: readonly Bi[];
  /** Jurisdiction codes this reader's page should speak about, if narrower than all. */
  readonly jurisdictions?: readonly string[];
}

/**
 * The thresholds this catalog encodes, restated for the pages that show them.
 *
 * Derived, so the tax adviser's page cannot claim a threshold the engine does
 * not hold. Two in the catalog today, and the pair is the point: one is "more
 * than 183", the other "183 or more".
 */
export const TAX_THRESHOLD_COUNT: number = TAX_DAY_COUNT_THRESHOLDS.length;

/** Distinct sources the presence engine can rest a figure on. */
export const PRESENCE_CITATION_COUNT: number = PRESENCE_CITATIONS.length;

/**
 * The evidentiary vocabulary of a presence record.
 *
 * Written as `Record<...>` over the package's own unions on purpose: adding a
 * source or a contradiction kind to `@meridian/presence` fails this build until
 * somebody says what it means to a reader, rather than silently shipping a page
 * that describes an incomplete vocabulary.
 */
export const PRESENCE_SOURCE_LABEL: Record<PresenceSource, Bi> = {
  border_stamp: bi(
    'A border stamp, or an equivalent official record',
    'Un sello fronterizo, o un registro oficial equivalente',
  ),
  gps: bi('Device location history the person supplied', 'Historial de ubicación del dispositivo aportado por la persona'),
  declared: bi('The person’s own statement of where they were', 'La declaración de la propia persona sobre dónde estuvo'),
  itinerary: bi(
    'A booking, a boarding pass, or a trip not yet taken',
    'Una reserva, una tarjeta de embarque o un viaje aún no realizado',
  ),
  inferred: bi(
    'Derived by the platform from surrounding records rather than observed',
    'Derivado por la plataforma a partir de los registros contiguos, no observado',
  ),
};

export const PRESENCE_CONFIDENCE_LABEL: Record<PresenceConfidence, Bi> = {
  confirmed: bi('Confirmed', 'Confirmado'),
  probable: bi('Probable', 'Probable'),
  assumed: bi('Assumed', 'Supuesto'),
};

export const INCONSISTENCY_LABEL: Record<InconsistencyKind, Bi> = {
  conflicting_location: bi(
    'Two countries claim the same day. Physically impossible, so one record is wrong — and the engine has no basis for guessing which.',
    'Dos países reclaman el mismo día. Es físicamente imposible, así que un registro está mal, y el motor no tiene base para adivinar cuál.',
  ),
  unknown_location: bi(
    'Days no record covers at all. In a continuity test these count as absence, which overstates time away and prompts evidence rather than assuming the person was home.',
    'Días que ningún registro cubre. En una prueba de continuidad computan como ausencia, lo que sobrestima el tiempo fuera y exige prueba en lugar de suponer que la persona estaba en el país.',
  ),
  future_presence: bi(
    'Presence recorded after the date the assessment is made for. It is included in the total, and saying which days are planned rather than elapsed is the caller’s job.',
    'Presencia registrada después de la fecha a la que se hace la evaluación. Se incluye en el total, y decir qué días son previstos y no transcurridos corresponde a quien lo presenta.',
  ),
  imputed_departure: bi(
    'A stay with no recorded departure, closed at the reference date. The count is still produced; the imputation is reported so nobody mistakes it for a known date.',
    'Una estancia sin salida registrada, cerrada en la fecha de referencia. El cómputo se produce igualmente; la imputación se informa para que nadie la confunda con una fecha conocida.',
  ),
};

/** The CEC hours limb, restated from the package's own constants. */
export const CEC_FACTS = {
  requiredHours: CEC_REQUIRED_HOURS,
  weeklyCap: CEC_WEEKLY_HOURS_CAP,
  lookbackYears: CEC_LOOKBACK_YEARS,
} as const;

/**
 * The audiences, in the order Meridian was designed around.
 *
 * That order is a statement about our own roadmap, not about the people in it.
 * It is not a ranking of who matters, and nothing on any of these pages is
 * ordered by anything measured against anybody's facts.
 */
export const AUDIENCES: readonly AudienceDefinition[] = [
  // -------------------------------------------------------------------------
  {
    id: 'practitioner',
    href: '/for/practitioner',
    name: bi(
      'Immigration lawyers, small firms, gestorías and RCICs',
      'Abogados de extranjería, despachos pequeños, gestorías y RCIC',
    ),
    door: bi('I am the licensed professional', 'Soy el profesional con licencia'),
    who: bi(
      'You hold the licence. The recommendation is yours, the liability is yours, and the regulator holds you answerable for both.',
      'Usted tiene la licencia. La recomendación es suya, la responsabilidad es suya y el regulador le exige cuentas por ambas.',
    ),
    problem: bi(
      'The judgement is what you are paid for, and it is the one part of the work software should not touch. What eats the hours is everything around it: recomputing a day count from a passport you have already read twice, noticing that a certificate obtained in March will be stale at a June appointment, and reconstructing six months later how a figure was arrived at.',
      'El criterio es aquello por lo que le pagan, y es la única parte del trabajo que el software no debería tocar. Lo que consume las horas es todo lo demás: recalcular un cómputo de días a partir de un pasaporte que ya ha leído dos veces, advertir que un certificado obtenido en marzo estará caducado en una cita de junio, y reconstruir seis meses después cómo se llegó a una cifra.',
    ),
    primaryDoor: true,
    adviceRoute: 'own_licence',
    tier: 'professional',
    capabilities: [
      'caseload',
      'representative-assignment',
      'advice-release',
      'deadline-monitoring',
      'document-expiry-alerts',
      'client-portal',
      'audit-trail',
      'presence-ledger',
    ],
    sections: [
      {
        id: 'boundary',
        title: bi(
          'The boundary is what you are buying, not what you are working around',
          'La frontera es lo que compra, no lo que sortea',
        ),
        body: [
          bi(
            'Most tools in this market give a consumer a recommendation and print a disclaimer underneath it. Meridian classifies the output where it is produced and asks one gate whether that class may reach that reader. To an unrepresented consumer the gate refuses and says so. To a practitioner it releases, because the engine is a tool in your hands and the judgement is yours. The distinction is enforced in the type system, not in a footer.',
            'La mayoría de las herramientas de este mercado dan una recomendación a un consumidor y ponen debajo un descargo de responsabilidad. Meridian clasifica el resultado donde se produce y pregunta a un único control si esa clase puede llegar a ese lector. Frente a un consumidor sin representación el control lo deniega y lo explica. Frente a un profesional lo entrega, porque el motor es una herramienta en sus manos y el criterio es suyo. La distinción se impone en el sistema de tipos, no en un pie de página.',
          ),
          bi(
            'That is worth something specific to you. It means the free consumer product cannot compete with you by doing the thing you are licensed for, and it means nothing your client reads on the public side of this platform is a recommendation they might mistake for yours.',
            'Eso vale algo concreto para usted: significa que el producto gratuito para consumidores no puede competir con usted haciendo aquello para lo que usted tiene licencia, y significa que nada de lo que su cliente lea en la parte pública de esta plataforma es una recomendación que pueda confundir con la suya.',
          ),
        ],
      },
      {
        id: 'liability',
        title: bi(
          'Liability sits where the file shows it sits',
          'La responsabilidad está donde el expediente demuestra que está',
        ),
        body: [
          bi(
            'A representative is a record, not a checkbox: the regulator, the licence number as it appears in the public register, the date it was last checked against that register, and the expiry. The gate reads all four. A credential that lapses stops releasing advice on the day it lapses, and a representative authorised in one jurisdiction does not release advice about another.',
            'Un representante es un registro, no una casilla: el regulador, el número de licencia tal como figura en el registro público, la fecha del último contraste con ese registro y la caducidad. El control lee los cuatro. Una credencial que caduca deja de habilitar el asesoramiento el día en que caduca, y un representante habilitado en una jurisdicción no habilita el asesoramiento sobre otra.',
          ),
          bi(
            'There is a second gate you do not get to skip either. A pathway no licensed person has read never enters a ranking, whatever the engine computes about it. Signing a rule off is a workflow step with your name attached — which is the point, because a recommendation built on rules nobody qualified has read is exactly the liability you would be taking on by using it.',
            'Hay un segundo control que tampoco puede saltarse. Una vía que ninguna persona con licencia haya leído nunca entra en una ordenación, sea cual sea el resultado del motor. Validar una norma es un paso del flujo con su nombre asociado, y ese es el sentido: una recomendación construida sobre normas que nadie cualificado ha leído es justo la responsabilidad que asumiría al usarla.',
          ),
        ],
      },
      {
        id: 'arithmetic',
        title: bi('The arithmetic you would otherwise redo by hand', 'La aritmética que, si no, rehace a mano'),
        body: [
          bi(
            'Day counts return the de-duplicated ranges that produced them, so a figure you present is a figure you can take apart in front of an officer. Document freshness is projected to the filing date rather than to today, which is the trap that turns a green checklist in April into a refused file in June. Contradictions in a client’s travel history are reported rather than resolved, because a tool that quietly prefers the border stamp hands you a number you cannot defend without knowing a choice was made.',
            'Los cómputos de días devuelven los periodos deduplicados que los produjeron, de modo que una cifra que usted presenta es una cifra que puede desglosar delante de un funcionario. La vigencia documental se proyecta a la fecha de presentación y no a hoy, que es la trampa que convierte una lista verde en abril en un expediente denegado en junio. Las contradicciones del historial de viajes de un cliente se informan en lugar de resolverse, porque una herramienta que en silencio prefiere el sello fronterizo le entrega una cifra que no puede defender sin saber que se tomó una decisión.',
          ),
        ],
      },
    ],
    evidence: ['release-gate', 'catalog-coverage'],
    limits: [
      bi(
        'The catalog is small and no record in it has been signed off by a licensed person. Until you sign records off yourself, the engine will assess against them and will not rank them.',
        'El catálogo es pequeño y ningún registro ha sido validado por una persona con licencia. Mientras usted no valide registros, el motor evaluará frente a ellos y no los ordenará.',
      ),
      bi(
        'Nothing files anything. There is no connection to any government system and there is not going to be one that acts while presenting as your client.',
        'Nada presenta nada. No hay conexión con ningún sistema público, ni la habrá que actúe haciéndose pasar por su cliente.',
      ),
      bi(
        'No estimate of the chance an application succeeds — not for you either. It is a prediction of outcome and no authority publishes the data that would make such a number true.',
        'Ninguna estimación de la probabilidad de éxito de una solicitud, tampoco para usted. Es una predicción de resultado y ninguna autoridad publica los datos que harían cierta esa cifra.',
      ),
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'corporate',
    href: '/for/corporate',
    name: bi('Global mobility, HR and compliance teams', 'Equipos de movilidad, RR. HH. y cumplimiento'),
    door: bi('I move employees across borders', 'Traslado empleados entre países'),
    who: bi(
      'You are accountable to an auditor for people whose immigration position is not yours to advise on.',
      'Usted responde ante un auditor por personas sobre cuya situación migratoria no le corresponde asesorar.',
    ),
    problem: bi(
      'The exposure is cumulative and invisible. Nobody notices a fourth trip to the same country in a calendar year until somebody totals them, and the total lives in a spreadsheet whose author left the company. When the question finally arrives it is not "how many days" but "how do you know", and a cell containing 172 answers neither.',
      'La exposición es acumulativa e invisible. Nadie repara en un cuarto viaje al mismo país en un año natural hasta que alguien los suma, y la suma vive en una hoja de cálculo cuyo autor ya no está en la empresa. Cuando por fin llega la pregunta, no es «cuántos días» sino «cómo lo sabe», y una celda con 172 no responde a ninguna de las dos.',
    ),
    primaryDoor: true,
    adviceRoute: 'needs_representative',
    tier: 'corporate',
    capabilities: [
      'employee-cohorts',
      'compliance-reporting',
      'audit-trail',
      'presence-ledger',
      'deadline-monitoring',
      'document-expiry-alerts',
    ],
    sections: [
      {
        id: 'defensible',
        title: bi('A number is only worth what its provenance is', 'Una cifra vale lo que valga su procedencia'),
        body: [
          bi(
            'Every day in the ledger carries where it came from and how much weight it bears — a border stamp and a self-declaration both produce the integer 1, and they are not the same evidentiary object. Aggregate reporting keeps that attribution underneath it, so a cohort figure can be opened down to the individual record that produced it.',
            'Cada día del registro lleva de dónde procede y cuánto peso soporta: un sello fronterizo y una declaración propia producen ambos el número 1, y no son el mismo objeto probatorio. Los informes agregados conservan esa atribución debajo, de modo que una cifra de colectivo puede desglosarse hasta el registro individual que la produjo.',
          ),
          bi(
            'Contradictions are surfaced rather than smoothed over. Two countries on one Tuesday means one of your records is wrong, and you find that out while it can still be corrected rather than in the audit.',
            'Las contradicciones se muestran en lugar de suavizarse. Dos países un mismo martes significa que uno de sus registros está mal, y usted se entera cuando todavía puede corregirse, no en la auditoría.',
          ),
        ],
      },
      {
        id: 'boundary',
        title: bi(
          'Where your obligation ends and your employee’s lawyer begins',
          'Dónde acaba su obligación y dónde empieza el abogado de su empleado',
        ),
        body: [
          bi(
            'Mobility tooling routinely blurs this and it is the one thing a compliance function cannot afford to blur. An employer is a protected audience under the same rules that protect the migrant: the gate treats a corporate sponsor exactly as it treats an unrepresented individual, and no amount of contract value changes that. Advice about your employee’s position comes from counsel attached to their matter — which is where the liability already sat before you bought any software.',
            'Las herramientas de movilidad difuminan esto habitualmente y es lo único que una función de cumplimiento no puede permitirse difuminar. El empleador es un destinatario protegido por las mismas normas que protegen al migrante: el control trata al patrocinador corporativo exactamente igual que a un particular sin representación, y ningún importe de contrato cambia eso. El asesoramiento sobre la situación de su empleado procede del letrado vinculado a su expediente, que es donde ya residía la responsabilidad antes de que usted comprara software alguno.',
          ),
          bi(
            'What you get instead is the part that is genuinely yours: the count, the dates, the documents and the record of how each figure was reached.',
            'Lo que obtiene a cambio es la parte que sí le corresponde: el cómputo, las fechas, los documentos y el registro de cómo se alcanzó cada cifra.',
          ),
        ],
      },
      {
        id: 'refusals',
        title: bi('Two things we will not build for you', 'Dos cosas que no construiremos para usted'),
        body: [
          bi(
            'Meridian will not hold an employee’s government authentication credential — no Cl@ve PIN, no portal password, no e.firma key — and will not act before an authority while presenting as them. That refusal is in the type system rather than in a policy document, and it holds for a paying corporate customer exactly as it holds for a free one.',
            'Meridian no custodiará la credencial de autenticación pública de un empleado —ni PIN de Cl@ve, ni contraseña de portal, ni clave de e.firma— ni actuará ante una administración haciéndose pasar por él. Ese rechazo está en el sistema de tipos y no en un documento de políticas, y rige para un cliente empresarial de pago exactamente igual que para uno gratuito.',
          ),
          bi(
            'No score, ranking or probability attached to an employee. Beyond being a prediction of outcome, it would be a number about a person that their employer holds and they cannot contest.',
            'Ninguna puntuación, ordenación ni probabilidad asociada a un empleado. Además de ser una predicción de resultado, sería una cifra sobre una persona que su empleador conserva y que ella no puede rebatir.',
          ),
        ],
      },
    ],
    evidence: ['release-gate', 'ledger-provenance'],
    limits: [
      bi(
        'No HRIS, expense or travel-booking integration exists. Presence records would have to be imported, and no importer is built.',
        'No existe integración con sistemas de RR. HH., de gastos ni de reservas de viaje. Los registros de presencia habría que importarlos, y no hay ningún importador construido.',
      ),
      bi(
        'The catalog covers two jurisdictions. A cohort spread across more of them is only partly served by it, and the pages say which parts.',
        'El catálogo cubre dos jurisdicciones. Un colectivo repartido en más solo queda cubierto en parte, y las páginas indican en qué parte.',
      ),
      bi(
        'Posted-worker, social-security and payroll obligations are not modelled. Day counts feed those analyses; they do not perform them.',
        'Las obligaciones de desplazamiento de trabajadores, de seguridad social y de nómina no están modeladas. Los cómputos de días alimentan esos análisis; no los realizan.',
      ),
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'individual',
    href: '/for/individual',
    name: bi('People managing their own move', 'Personas que gestionan su propio traslado'),
    door: bi('I am moving, or already have', 'Me estoy trasladando, o ya lo hice'),
    who: bi(
      'You are the person the clock is running against.',
      'Usted es la persona contra la que corre el reloj.',
    ),
    problem: bi(
      'Every free tool you have found so far computes an answer and then asks for your email before showing it. The number you need is a number about your own life — how many of your 90 days you have used, whether your residence run is still unbroken, whether the certificate you paid for will still be accepted in June — and you should not have to trade a contact detail for it, or read it from somebody who is selling you a consultation.',
      'Todas las herramientas gratuitas que ha encontrado hasta ahora calculan una respuesta y luego le piden el correo antes de mostrarla. La cifra que necesita es una cifra sobre su propia vida —cuántos de sus 90 días ha consumido, si su periodo de residencia sigue sin interrumpirse, si el certificado que pagó seguirá admitiéndose en junio— y no debería tener que entregar un dato de contacto por ella, ni leerla de quien le está vendiendo una consulta.',
    ),
    primaryDoor: true,
    adviceRoute: 'needs_representative',
    tier: 'individual',
    capabilities: [
      'day-counters',
      'eligibility-assessment',
      'rule-catalog',
      'travel-document-check',
      'document-sequence',
      'presence-ledger',
      'deadline-monitoring',
      'document-expiry-alerts',
    ],
    sections: [
      {
        id: 'free',
        title: bi('Free, permanently, and not as a trial', 'Gratuito, de forma permanente, y no como prueba'),
        body: [
          bi(
            'Every calculator, the whole catalog and unlimited assessments cost nothing and will keep costing nothing. There is no account to make, no limit on how many times, and no point at which the tool stops and asks for a card. This is not generosity: stating a published rule and doing arithmetic against your own record are not things anybody needs a licence to do, so they are not things anybody should have to pay us for.',
            'Todas las calculadoras, el catálogo completo y las evaluaciones sin límite no cuestan nada y seguirán sin costar nada. No hay cuenta que crear, ni límite de usos, ni un punto en el que la herramienta se detenga y pida una tarjeta. No es generosidad: exponer una norma publicada y hacer aritmética con su propio registro no son cosas para las que nadie necesite una licencia, así que tampoco son cosas por las que nadie deba pagarnos.',
          ),
          bi(
            'Nothing is computed and then withheld. If the arithmetic runs, you see it, along with the rule it was measured against and the date a person last checked that rule.',
            'Nada se calcula para luego retenerse. Si la aritmética se ejecuta, usted la ve, junto con la norma frente a la que se midió y la fecha en que una persona comprobó esa norma por última vez.',
          ),
        ],
      },
      {
        id: 'paid',
        title: bi('What the paid tier is actually for', 'Para qué sirve realmente el nivel de pago'),
        body: [
          bi(
            'One thing: something keeping the clock while you are not looking at it. A permit that expires, a residence period that completes, a certificate that goes stale between the day you order it and the day of your appointment — those are dates that move without you, and watching them is work you cannot do by re-opening a calculator when you happen to remember.',
            'Una sola cosa: algo que vigila el reloj mientras usted no lo mira. Una autorización que caduca, un periodo de residencia que se cumple, un certificado que pierde vigencia entre el día en que lo pide y el día de su cita: son fechas que se mueven solas, y vigilarlas es un trabajo que no puede hacer volviendo a abrir una calculadora cuando se acuerde.',
          ),
          bi(
            'Nothing that is free today moves behind that. The free tier is not the shape of a product waiting to be squeezed; it is the part of the product that the law says needs nobody accountable, and that part is finished.',
            'Nada de lo que hoy es gratuito pasa detrás de eso. El nivel gratuito no es la forma de un producto pendiente de exprimir: es la parte del producto que, según la norma, no exige que nadie responda por ella, y esa parte está terminada.',
          ),
        ],
      },
      {
        id: 'honest',
        title: bi('What you will not get here, from anybody', 'Lo que aquí no obtendrá, de nadie'),
        body: [
          bi(
            'Meridian will not tell you which route to take. Not because we are being cautious — because in Canada and in Spain that is a regulated act, and the person doing it has to be somebody a regulator can hold answerable. What you get instead is every figure that decision rests on, in a form you can take to a lawyer, so the hour you pay for is spent on judgement rather than on arithmetic you already did.',
            'Meridian no le dirá qué vía tomar. No por prudencia, sino porque en Canadá y en España es un acto reservado, y quien lo realiza debe ser alguien a quien un regulador pueda exigir cuentas. Lo que obtiene a cambio son todas las cifras sobre las que se apoya esa decisión, en una forma que puede llevar a un abogado, para que la hora que pague se dedique al criterio y no a una aritmética que usted ya hizo.',
          ),
          bi(
            'Meridian will also never hold your Cl@ve PIN, your portal password or your e.firma key, and will never act before an authority as though it were you.',
            'Meridian tampoco custodiará nunca su PIN de Cl@ve, su contraseña de portal ni su clave de e.firma, ni actuará jamás ante una administración como si fuera usted.',
          ),
        ],
      },
    ],
    evidence: ['release-gate', 'catalog-coverage'],
    limits: [
      bi(
        'Nothing you type is stored, because there is nowhere to store it. Close the tab and the figures are gone; that is a limitation today and a privacy property today, and both are true at once.',
        'Nada de lo que escriba se almacena, porque no hay dónde. Cierre la pestaña y las cifras desaparecen: hoy es una limitación y hoy es una propiedad de privacidad, y ambas cosas son ciertas a la vez.',
      ),
      bi(
        'Meridian does not assess asylum, refugee status, subsidiary protection or humanitarian applications, and is not going to. Those turn on an account of what happened to a person, not on criteria a program can check.',
        'Meridian no evalúa asilo, estatuto de refugiado, protección subsidiaria ni solicitudes humanitarias, ni lo hará. Dependen del relato de lo que le ocurrió a una persona, no de criterios que un programa pueda comprobar.',
      ),
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'tax-adviser',
    href: '/for/tax-adviser',
    name: bi(
      'Cross-border tax advisers and wealth managers',
      'Asesores fiscales transfronterizos y gestores patrimoniales',
    ),
    door: bi('I count days for a residence position', 'Cuento días para una posición de residencia'),
    who: bi(
      'The day count is the hinge of the position, and it currently lives in a spreadsheet.',
      'El cómputo de días es el eje de la posición, y hoy vive en una hoja de cálculo.',
    ),
    problem: bi(
      'The dispute is never about the law. 183 is 183, and you knew that before the client called. The dispute is about whether the count can be defended two years later: which days were counted, from what evidence, under whose reading of the window, and what was done with the fortnight nobody can account for. A spreadsheet answers the first question and none of the others, and it answers the first one differently depending on who last edited it.',
      'La discusión nunca es sobre la norma. 183 son 183, y usted ya lo sabía antes de que el cliente llamara. La discusión es si el cómputo puede defenderse dos años después: qué días se contaron, con qué prueba, bajo qué lectura de la ventana temporal y qué se hizo con la quincena que nadie puede justificar. Una hoja de cálculo responde a la primera pregunta y a ninguna de las demás, y responde a la primera de forma distinta según quién la editara por última vez.',
    ),
    primaryDoor: false,
    adviceRoute: 'not_engaged',
    tier: 'individual',
    capabilities: ['day-counters', 'presence-ledger', 'audit-report', 'deadline-monitoring', 'caseload'],
    sections: [
      {
        id: 'count-not-conclusion',
        title: bi(
          'It answers “how many days”. It never answers “are you resident”.',
          'Responde «cuántos días». Nunca responde «es usted residente».',
        ),
        body: [
          bi(
            'That is not caution, it is the correct shape of the tool, and collapsing the two is how software in this area becomes negligent. A day count is one limb of a residence test and in both jurisdictions here it is not the only one. Spain’s art. 9.1 makes a person resident on days, or independently on the main base of their activities and economic interests being in Spain; the second limb stands entirely on its own. Canada’s s. 250(1)(a) deems residence on days spent sojourning, and “sojourn” is a term of art that excludes days on which the person was already a factual resident.',
            'No es prudencia, es la forma correcta de la herramienta, y confundir ambas cosas es como el software de este ámbito se vuelve negligente. Un cómputo de días es un elemento de una prueba de residencia y en ninguna de estas dos jurisdicciones es el único. El art. 9.1 español declara residente a una persona por días o, con independencia de ellos, por radicar en España el núcleo principal de sus actividades e intereses económicos; el segundo elemento se sostiene por sí solo. El art. 250(1)(a) canadiense presume la residencia por los días de estancia temporal —«sojourn»—, y ese es un término técnico que excluye los días en que la persona ya era residente de hecho.',
          ),
          bi(
            'So the engine can be wrong in both directions and says which. A ledger of physical presence can come in under the Spanish statutory figure, because sporadic absences count toward the 183 unless residence elsewhere is evidenced by a tax certificate. It can come in over the Canadian one, because days as a factual resident are not sojourning days. Characterising the days is your work. Totalling them, showing which ones, and never quietly reclassifying them is ours.',
            'Por eso el motor puede errar en ambos sentidos y lo indica. Un registro de presencia física puede quedar por debajo de la cifra legal española, porque las ausencias esporádicas computan a efectos de los 183 salvo que se acredite la residencia fiscal en otro país mediante certificado. Puede quedar por encima de la canadiense, porque los días como residente de hecho no son días de sojourn. Calificar los días es su trabajo. Sumarlos, mostrar cuáles y no reclasificarlos nunca en silencio es el nuestro.',
          ),
        ],
      },
      {
        id: 'one-word',
        title: bi(
          'The two thresholds are the same number and not the same rule',
          'Los dos umbrales son la misma cifra y no la misma regla',
        ),
        body: [
          bi(
            'Spain says “more than 183 days”. Canada says “183 days or more”. One word, one day, and in a marginal year one residence. Meridian stores the figure exactly as the instrument states it and stores the comparison operator separately, rather than baking 184 into a constant — so what is encoded is what a reviewer will find when they open the statute, and the first qualifying count is derived rather than transcribed.',
            'España dice «más de 183 días». Canadá dice «183 días o más». Una palabra, un día y, en un año ajustado, una residencia. Meridian guarda la cifra exactamente como la enuncia la norma y guarda el operador de comparación por separado, en lugar de incrustar un 184 en una constante: así lo codificado es lo que un revisor encontrará al abrir el texto legal, y el primer cómputo que satisface la prueba se deriva en lugar de transcribirse.',
          ),
          bi(
            'The counting window is modelled the same way. A calendar year and a rolling twelve months ending on the reference date are different windows, and the rolling one is computed as twelve calendar months rather than 365 days, because a fixed 365 drifts by a day across a leap year — which is exactly the drift that turns a 182-day count into a 183.',
            'La ventana de cómputo se modela igual. Un año natural y doce meses móviles que terminan en la fecha de referencia son ventanas distintas, y la móvil se calcula como doce meses naturales y no como 365 días, porque un 365 fijo se desvía un día al cruzar un año bisiesto, que es exactamente la desviación que convierte un cómputo de 182 días en uno de 183.',
          ),
        ],
      },
      {
        id: 'defensible',
        title: bi('A count you can hand to an auditor', 'Un cómputo que puede entregar a un inspector'),
        body: [
          bi(
            'Provenance travels with the day, as a required field rather than an optional annotation. A day from a border stamp and a day from a phone’s location history both produce the integer 1 and are not the same evidentiary object, so the ledger records which each was and how much weight it bears. When the question is “why does it say 89 and not 92”, the answer is a list of records, not an opaque total.',
            'La procedencia viaja con el día, como campo obligatorio y no como anotación opcional. Un día procedente de un sello fronterizo y uno procedente del historial de ubicación de un teléfono producen ambos el número 1 y no son el mismo objeto probatorio, de modo que el registro anota qué era cada uno y cuánto peso soporta. Cuando la pregunta es «por qué dice 89 y no 92», la respuesta es una lista de registros, no un total opaco.',
          ),
          bi(
            'Contradictions are surfaced and never resolved. If the record puts your client in two countries on one Tuesday, one of those records is wrong and the engine has no basis for choosing. A tool that silently prefers the stamp, or the later entry, or the higher confidence, produces a number that looks authoritative and cannot be defended — because the person defending it does not know a choice was made. Days nobody accounts for are reported as exactly that, and in a continuity test they count as absence, which errs toward asking you for evidence rather than assuming your client was where it would be convenient for them to have been.',
            'Las contradicciones se muestran y nunca se resuelven. Si el registro sitúa a su cliente en dos países un mismo martes, uno de esos registros está mal y el motor no tiene base para elegir. Una herramienta que en silencio prefiere el sello, o la entrada más reciente, o la mayor fiabilidad, produce una cifra de apariencia autorizada e indefendible, porque quien la defiende no sabe que se tomó una decisión. Los días que nadie justifica se informan como tales y, en una prueba de continuidad, computan como ausencia, lo que yerra en el sentido de pedirle prueba en lugar de suponer que su cliente estuvo donde le habría convenido estar.',
          ),
        ],
      },
      {
        id: 'your-rules',
        title: bi('Your rules, not only ours', 'Sus reglas, no solo las nuestras'),
        body: [
          bi(
            'Two thresholds ship, for the two jurisdictions this catalog covers. The evaluator supports a rolling twelve-month basis and no rolling threshold ships, because neither jurisdiction in scope uses one and fabricating a plausible-looking rule for a third would be worse than the gap. If your practice runs on rules you have verified yourself, a threshold is a value you construct and pass in: a figure, a comparison operator, a basis, and a citation the constructor refuses to accept as empty.',
            'Se incluyen dos umbrales, para las dos jurisdicciones que cubre este catálogo. El evaluador admite una base móvil de doce meses y no se incluye ningún umbral móvil, porque ninguna de las jurisdicciones en alcance lo usa y fabricar una regla verosímil para una tercera sería peor que la carencia. Si su práctica se apoya en reglas que usted mismo ha verificado, un umbral es un valor que construye y pasa: una cifra, un operador de comparación, una base y una cita que el constructor se niega a aceptar vacía.',
          ),
          bi(
            'The United States substantial presence test is not encoded. It is the omission a US-facing practice would most likely assume away, so it is named here rather than discovered later.',
            'La prueba de presencia sustancial de Estados Unidos no está codificada. Es la ausencia que una práctica orientada a EE. UU. daría por supuesta con más facilidad, así que se nombra aquí en lugar de descubrirse después.',
          ),
        ],
      },
      {
        id: 'no-gate',
        title: bi('No licence gate applies to any of this', 'Ningún control de licencia se aplica a nada de esto'),
        body: [
          bi(
            'A day count is assessment-class: your client’s own recorded facts, measured against a cited rule, with the arithmetic shown. The release gate that governs migration advice never engages, in either direction — you do not need a migration licence to use it, and Meridian will not release migration advice to you on the strength of your tax credentials either. That is why the persistent ledger and the audit report sit in the Individual tier rather than the Professional one: what you need is continuity, not counsel.',
            'Un cómputo de días es de clase evaluación: los datos registrados de su cliente, medidos frente a una norma citada y con la aritmética a la vista. El control de divulgación que rige el asesoramiento migratorio no se activa, ni en un sentido ni en otro: usted no necesita licencia migratoria para usarlo, y Meridian tampoco le entregará asesoramiento migratorio por tener credenciales fiscales. Por eso el registro persistente y el informe de auditoría están en el nivel Individual y no en el Profesional: lo que necesita es continuidad, no letrado.',
          ),
          bi(
            'A practice holding many clients’ ledgers is the caseload shape, which is the Professional tier minus the parts that turn on a migration licence. No separate tax-practice tier is carved out, and one will not be invented before somebody who runs such a practice tells us what shape it needs to be.',
            'Una práctica que lleva los registros de muchos clientes es la forma de cartera, es decir, el nivel Profesional menos las partes que dependen de una licencia migratoria. No se ha recortado ningún nivel específico para prácticas fiscales, y no se inventará antes de que alguien que dirija una nos diga qué forma debe tener.',
          ),
        ],
      },
    ],
    evidence: ['day-count-thresholds', 'ledger-provenance'],
    limits: [
      bi(
        'No residence determination, no treaty tie-breaker, and no tax computation of any kind. Meridian counts days; everything downstream of the count is your work and stays your work.',
        'Ninguna determinación de residencia, ningún criterio de desempate de convenio y ningún cálculo tributario de ninguna clase. Meridian cuenta días; todo lo que viene después del cómputo es su trabajo y sigue siéndolo.',
      ),
      bi(
        'Two jurisdictions, two thresholds. Anything else is a rule you supply and have verified yourself.',
        'Dos jurisdicciones, dos umbrales. Cualquier otra cosa es una regla que usted aporta y ha verificado usted mismo.',
      ),
      bi(
        'No bank, calendar, airline or device-location import exists. Records would have to be entered, and today there is nowhere to keep them once entered.',
        'No existe importación desde bancos, calendarios, aerolíneas ni ubicación del dispositivo. Los registros habría que introducirlos, y hoy no hay dónde conservarlos una vez introducidos.',
      ),
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'university',
    href: '/for/university',
    name: bi('University international offices', 'Oficinas internacionales universitarias'),
    door: bi('I advise international students', 'Asesoro a estudiantes internacionales'),
    who: bi(
      'You advise a cohort that turns over every year, on a sequence where one missed date closes a route.',
      'Asesora a un colectivo que se renueva cada año, en una secuencia donde una fecha perdida cierra una vía.',
    ),
    problem: bi(
      'The student pathway is a chain of time-limited steps, and the failure mode is always the same: a date nobody was watching passes, and a route that was open in March is closed in October. You are advising hundreds of people on that chain at once, with a caseload that resets annually and institutional budget that will not stretch to per-student licensing.',
      'La vía del estudiante es una cadena de pasos con plazo, y el fallo es siempre el mismo: pasa una fecha que nadie vigilaba y una vía que en marzo estaba abierta en octubre está cerrada. Usted asesora a cientos de personas sobre esa cadena a la vez, con una cartera que se reinicia cada curso y un presupuesto institucional que no da para licencias por estudiante.',
    ),
    primaryDoor: false,
    adviceRoute: 'needs_representative',
    tier: 'corporate',
    capabilities: [
      'employee-cohorts',
      'deadline-monitoring',
      'document-expiry-alerts',
      'presence-ledger',
      'day-counters',
      'audit-trail',
    ],
    sections: [
      {
        id: 'gap-first',
        title: bi(
          'The two rules you need most are not encoded yet',
          'Las dos normas que más necesita aún no están codificadas',
        ),
        body: [
          bi(
            'This has to come first, because everything else on this page is worth less if you learn it later. The study permit and the post-graduation work permit are not in this catalog. What is in it is the Canadian Experience Class the post-graduation permit leads into — so the route your students take is, at present, visible here only at its far end. That gap is registered in the code and named on every page that could mislead somebody about it.',
            'Esto debe ir primero, porque todo lo demás de esta página vale menos si lo descubre después. El permiso de estudios y el permiso de trabajo posgraduación no están en este catálogo. Sí está la Canadian Experience Class a la que conduce el permiso posgraduación, de modo que la vía que siguen sus estudiantes solo se ve aquí, por ahora, en su tramo final. Esa carencia está registrada en el código y nombrada en todas las páginas que podrían inducir a error al respecto.',
          ),
          bi(
            'Saying so costs us this sale today. Not saying so would cost an international office a term of misplaced confidence, which is a worse trade for everybody including us.',
            'Decirlo nos cuesta esta venta hoy. No decirlo le costaría a una oficina internacional un curso de confianza mal puesta, que es un intercambio peor para todos, nosotros incluidos.',
          ),
        ],
      },
      {
        id: 'hours',
        title: bi(
          'What is genuinely useful today: the hours limb',
          'Lo que sí es útil hoy: el elemento de horas',
        ),
        body: [
          bi(
            'The Canadian Experience Class is measured in hours, not months, and the difference bites exactly where your students live. Part-time work counts; fifteen hours a week for two years reaches the same total as thirty for one. Hours above the full-time rate do not accumulate, and the cap applies across concurrent jobs rather than per job — so two part-time jobs in the same week are resolved day by day rather than added together. A student advised on months rather than hours is advised wrongly in both directions.',
            'La Canadian Experience Class se mide en horas, no en meses, y la diferencia muerde justo donde viven sus estudiantes. El trabajo a tiempo parcial computa: quince horas semanales durante dos años alcanzan el mismo total que treinta durante uno. Las horas por encima de la jornada completa no acumulan, y el tope se aplica al conjunto de empleos simultáneos y no a cada empleo, de modo que dos trabajos a tiempo parcial en la misma semana se resuelven día a día y no se suman. A un estudiante asesorado en meses y no en horas se le asesora mal en ambos sentidos.',
          ),
          bi(
            'Whether a period qualifies at all — authorised work, a skilled occupation, not work during full-time study — is a legal characterisation the engine does not attempt. It is an input, decided by whoever is accountable for that judgement, and periods marked otherwise are excluded and reported by name rather than silently dropped.',
            'Si un periodo computa en absoluto —trabajo autorizado, ocupación cualificada, no trabajo durante estudios a tiempo completo— es una calificación jurídica que el motor no intenta. Es un dato de entrada, decidido por quien responde de ese criterio, y los periodos marcados de otro modo se excluyen y se informan por su nombre en lugar de descartarse en silencio.',
          ),
        ],
      },
      {
        id: 'shape',
        title: bi('The shape an institution would buy', 'La forma que compraría una institución'),
        body: [
          bi(
            'A cohort, not a seat. Many students, one view of who is approaching a date, and a record of how each figure was reached that survives the adviser who produced it — which matters more in a university than almost anywhere, because the adviser changes and the student does not. That is the Corporate tier’s shape, and an institution is exactly the sort of buyer it was described for.',
            'Un colectivo, no un puesto. Muchos estudiantes, una sola vista de quién se acerca a una fecha y un registro de cómo se alcanzó cada cifra que sobrevive al asesor que la produjo, lo que importa en una universidad más que casi en ningún sitio, porque el asesor cambia y el estudiante no. Esa es la forma del nivel Empresarial, y una institución es justo el tipo de comprador para el que se describió.',
          ),
          bi(
            'Advice-class output is not part of it. Where your institution employs or retains someone whose licence covers immigration advice, that person attaches to a matter and the gate releases to them; where it does not, the honest answer is that your office produces information and assessment, which is what it is entitled to produce.',
            'Los resultados de clase asesoramiento no forman parte de ello. Cuando su institución emplea o contrata a alguien cuya licencia cubre el asesoramiento migratorio, esa persona se vincula al expediente y el control le entrega el resultado; cuando no, la respuesta honesta es que su oficina produce información y evaluación, que es lo que le corresponde producir.',
          ),
        ],
      },
    ],
    evidence: ['cec-hours', 'catalog-coverage'],
    jurisdictions: ['CA'],
    limits: [
      bi(
        'No student information system integration, no enrolment feed, and no importer of any kind.',
        'Sin integración con sistemas de gestión académica, sin volcado de matrícula y sin ningún tipo de importador.',
      ),
      bi(
        'Designated learning institution obligations, compliance reporting to the immigration authority, and anything else the institution owes as an institution are not modelled.',
        'Las obligaciones como institución de enseñanza designada, los informes de cumplimiento ante la autoridad migratoria y cualquier otra cosa que la institución deba como institución no están modelados.',
      ),
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'legal-aid',
    href: '/for/legal-aid',
    name: bi('Legal aid offices and NGO clinics', 'Servicios de orientación jurídica y clínicas de ONG'),
    door: bi('I work in a clinic or legal aid', 'Trabajo en una clínica o en orientación jurídica'),
    who: bi(
      'You do this work for people who could not otherwise get it, with hours you do not have.',
      'Hace este trabajo para personas que de otro modo no lo tendrían, con horas de las que no dispone.',
    ),
    problem: bi(
      'The part of your caseload that consumes the most time is the part that requires the least judgement. Counting days from a passport, checking which certificate will still be current at an appointment, working out whether a residence run held — this is hours of arithmetic per file, done by people whose scarce and valuable contribution is the judgement at the end of it.',
      'La parte de su carga de trabajo que más tiempo consume es la que menos criterio exige. Contar días en un pasaporte, comprobar qué certificado seguirá vigente en una cita, determinar si un periodo de residencia se mantuvo: son horas de aritmética por expediente, hechas por personas cuya aportación escasa y valiosa es el criterio que viene al final.',
    ),
    primaryDoor: false,
    adviceRoute: 'own_licence',
    tier: 'clinic',
    capabilities: [
      'caseload',
      'representative-assignment',
      'advice-release',
      'deadline-monitoring',
      'document-expiry-alerts',
      'client-portal',
      'presence-ledger',
    ],
    sections: [
      {
        id: 'commitment',
        title: bi('Free, permanently, and stated in public', 'Gratuito, de forma permanente y declarado en público'),
        body: [
          bi(
            'The full Professional tier, at no charge, for as long as this product exists. Not a discount, not a grant programme, not something renewed annually, and not something you have to justify. Tell us you are a legal-aid office, a university law clinic or an NGO doing this work, and you are.',
            'El nivel Profesional completo, sin coste, mientras exista este producto. No es un descuento, ni un programa de subvenciones, ni algo que se renueve cada año, ni algo que deba justificar. Díganos que son un servicio de orientación jurídica gratuita, una clínica jurídica universitaria o una ONG que hace este trabajo, y lo son.',
          ),
          bi(
            'It is written on a public page instead of granted quietly, because a commitment nobody can point at is not a commitment. If this line is ever removed, the removal will be visible in the history of a public repository, which is the only guarantee we are actually in a position to offer.',
            'Se escribe en una página pública en lugar de concederse discretamente, porque un compromiso que nadie puede señalar no es un compromiso. Si esta línea se retira alguna vez, la retirada será visible en el historial de un repositorio público, que es la única garantía que estamos realmente en condiciones de ofrecer.',
          ),
        ],
      },
      {
        id: 'why',
        title: bi('Why this is not charity accounting', 'Por qué esto no es contabilidad de caridad'),
        body: [
          bi(
            'The marginal cost of another clinic on this platform is close to nothing, and clinics see the cases the commercial market never does — irregular status, expired documents, records with years missing from them. That is where the arithmetic is hardest and where a tool that surfaces contradictions instead of smoothing them over is worth the most. We would rather the software met those cases early than be tuned exclusively on files that arrive tidy.',
            'El coste marginal de otra clínica en esta plataforma es prácticamente nulo, y las clínicas ven los casos que el mercado comercial nunca ve: situación irregular, documentos caducados, historiales con años ausentes. Ahí es donde la aritmética es más difícil y donde una herramienta que muestra las contradicciones en lugar de suavizarlas vale más. Preferimos que el software se enfrente pronto a esos casos a que se afine solo con expedientes que llegan ordenados.',
          ),
        ],
      },
      {
        id: 'supervision',
        title: bi('Your supervising lawyer is the representative', 'Su letrado supervisor es el representante'),
        body: [
          bi(
            'The clinic tier is the Professional tier, which means advice-class output is released against a licensed person attached to the matter — in a clinic, the supervising lawyer whose name is already on the file. Nothing about this being free changes the gate, and that is deliberate: a free product that released recommendations with nobody accountable would be doing the exact harm the boundary exists to prevent, to the people least able to absorb it.',
            'El nivel para clínicas es el nivel Profesional, lo que significa que los resultados de clase asesoramiento se entregan contra una persona con licencia vinculada al expediente: en una clínica, el letrado supervisor cuyo nombre ya consta en él. Que sea gratuito no altera en nada el control, y es deliberado: un producto gratuito que entregara recomendaciones sin nadie que respondiera por ellas causaría exactamente el daño que la frontera existe para evitar, a quienes menos capacidad tienen de absorberlo.',
          ),
        ],
      },
    ],
    evidence: ['release-gate', 'catalog-coverage'],
    limits: [
      bi(
        'There is nothing to grant access to yet. The commitment is real and it binds as soon as there is an account system for it to bind to.',
        'Todavía no hay a qué dar acceso. El compromiso es real y vincula en cuanto exista un sistema de cuentas al que vincularse.',
      ),
      bi(
        'Protection work is out of scope. Meridian does not assess asylum, refugee status, subsidiary protection or humanitarian applications, and a clinic doing that work will find nothing here for it.',
        'El trabajo de protección internacional queda fuera de alcance. Meridian no evalúa asilo, estatuto de refugiado, protección subsidiaria ni solicitudes humanitarias, y una clínica que haga ese trabajo no encontrará aquí nada para ello.',
      ),
    ],
  },
];

const AUDIENCE_BY_ID: ReadonlyMap<string, AudienceDefinition> = new Map(
  AUDIENCES.map((audience) => [audience.id, audience]),
);

/** `null` rather than a throw: an unknown slug is an expected request, not a fault. */
export function audienceById(id: string): AudienceDefinition | null {
  return AUDIENCE_BY_ID.get(id) ?? null;
}

/**
 * The audiences a surface with room for only a few doors should show.
 *
 * Derived, so a surface that renders "the three doors" cannot disagree with
 * this file about which three they are — and if the count ever changes, the
 * surface renders what it finds rather than a hard-coded three.
 */
export const PRIMARY_DOORS: readonly AudienceDefinition[] = AUDIENCES.filter(
  (audience) => audience.primaryDoor,
);

/** Audiences whose own licence carries the advice. Used to explain who Professional is for. */
export const LICENSED_AUDIENCES: readonly AudienceDefinition[] = AUDIENCES.filter(
  (audience) => audience.adviceRoute === 'own_licence',
);
