/**
 * Who Meridian is for, what each of them gets, and what it costs.
 *
 * ── The commercial line and the legal line are the same line ─────────────────
 *
 * `@meridian/core` classifies every engine output as `information`,
 * `assessment` or `advice` (see `packages/core/src/disclosure.ts`). Under s.91
 * of Canada's Immigration and Refugee Protection Act and Spain's
 * reserved-activity rules, advice-class output requires an authorised
 * representative accountable for it. So:
 *
 *   - `information` and `assessment` release to anybody, with no representative
 *     attached — which is why they are free, permanently, with no account.
 *   - `advice` requires a licensed representative — which is why it is bought
 *     by the professional whose licence covers it.
 *
 * There is no second paywall hiding behind that one. The tools are not a trial
 * of the paid product; they are the whole of what an unrepresented person may
 * lawfully be given, and they are complete.
 *
 * ── What the money is actually for ───────────────────────────────────────────
 *
 * Not the calculation. The one-off answer is free and always will be. What is
 * bought is *continuity*: a saved matter, a deadline still being watched next
 * March, a document-expiry alert, a presence ledger that accumulates, a report
 * an auditor will accept. Those keep a clock running that the person cannot
 * watch themselves, and they are the only things here that cost anything to
 * operate.
 *
 * ── Honesty about what exists ────────────────────────────────────────────────
 *
 * None of the continuity features is built. No application in this product has
 * an account, a sign-in or a database today. {@link Door.availability} says so
 * on every card that describes one, in the same size type as the offer, because
 * a page that describes an unbuilt subscription beside a working calculator and
 * does not distinguish them is lying by layout.
 *
 * No price appears anywhere below. None is set, and inventing a number to make
 * a pricing table look complete is exactly the behaviour this product exists to
 * be an alternative to.
 */

import { canRelease } from '@meridian/core';
import type { DisclosureClass, ReleaseContext } from '@meridian/core';

import { AS_OF } from '@/lib/as-of';
import { bi, type LocalizedText } from '@/lib/i18n';
import { PORTAL_URL } from '@/lib/links';

// ---------------------------------------------------------------------------
// The boundary, run rather than described
// ---------------------------------------------------------------------------

/**
 * A migrant using this site: no representative attached, not paying.
 *
 * `forConsideration: false` on purpose. s.91 turns on consideration, and a free
 * product is exactly where somebody would expect the gate to relax — so the
 * context asked below is the *most* permissive one a real reader can present,
 * and the answers it returns are therefore the floor rather than a flattering
 * case. `jurisdiction` is one the catalog actually covers.
 */
const UNREPRESENTED_READER: ReleaseContext = {
  audience: 'applicant',
  jurisdiction: 'ES',
  representative: null,
  forConsideration: false,
  asOf: AS_OF,
};

export interface ClassRelease {
  readonly classification: DisclosureClass;
  readonly released: boolean;
  /** The gate's own words when it withholds. English, verbatim. */
  readonly reason: string | null;
  readonly downgradeTo: DisclosureClass | null;
}

/**
 * What the real gate does with each class for a reader with nobody on the hook.
 *
 * Computed by calling `canRelease` from `@meridian/core` at build time — the
 * same function the engine calls — rather than by describing it. The three
 * "Released / Withheld" verdicts the pricing table prints are therefore facts
 * about the shipped code, and if somebody ever changed the gate to release
 * advice to an unrepresented applicant, this page would say so on the next
 * build. That is the correct and alarming behaviour: the page would be telling
 * the truth about a system that had stopped being safe.
 */
export const RELEASE_TO_UNREPRESENTED: readonly ClassRelease[] = (
  ['information', 'assessment', 'advice'] as const
).map((classification): ClassRelease => {
  const decision = canRelease(classification, UNREPRESENTED_READER);
  return decision.allowed
    ? { classification, released: true, reason: null, downgradeTo: null }
    : {
        classification,
        released: false,
        reason: decision.reason,
        downgradeTo: decision.downgradeTo,
      };
});

export function releaseOf(classification: DisclosureClass): ClassRelease {
  const found = RELEASE_TO_UNREPRESENTED.find((r) => r.classification === classification);
  if (found === undefined) {
    // Unreachable: the array is built from the same literal union. A throw
    // rather than a fallback, because a pricing table that silently rendered a
    // default verdict would be asserting exactly what this module exists to
    // stop asserting.
    throw new Error(`releaseOf: no gate decision computed for '${classification}'`);
  }
  return found;
}

/** True while the free tier is exactly the two unregulated classes. */
export const FREE_CLASSES_ARE_THE_UNREGULATED_ONES: boolean =
  releaseOf('information').released &&
  releaseOf('assessment').released &&
  !releaseOf('advice').released;

export interface DoorCta {
  readonly href: string;
  readonly label: LocalizedText;
}

export interface Door {
  readonly id: string;
  /** The reader's own words for themselves, in the first person. */
  readonly who: LocalizedText;
  /** Who that actually is, so a reader can tell whether it is them. */
  readonly persona: LocalizedText;
  /** What this reader gets, in their language rather than the product's. */
  readonly gets: readonly LocalizedText[];
  /** What it costs. Never a currency amount — none is decided. */
  readonly price: LocalizedText;
  /** Where the advice boundary falls for this reader, stated plainly. */
  readonly boundary: LocalizedText;
  /** What of this works today, as against what is described. */
  readonly availability: LocalizedText;
  readonly cta: DoorCta | null;
}

export const DOORS: readonly Door[] = [
  {
    id: 'individual',
    who: bi('I am moving myself', 'Me estoy mudando yo'),
    persona: bi(
      'A migrant, or the relative helping one. The largest group of people who need this and the least likely to be able to pay for it.',
      'Una persona migrante, o el familiar que la ayuda. El grupo más numeroso de quienes necesitan esto y el menos capaz de pagarlo.',
    ),
    gets: [
      bi(
        'The 90/180 day counter at the top of this page, in full, with the arithmetic and the source shown.',
        'El cómputo de días 90/180 del principio de esta página, completo, con la aritmética y la fuente a la vista.',
      ),
      bi(
        'A machine-readable travel-document check to ICAO Doc 9303, which catches a mistyped passport line before it reaches a government form.',
        'Una comprobación de documento de viaje de lectura mecánica conforme al Doc 9303 de OACI, que detecta una línea mal tecleada antes de que llegue a un impreso oficial.',
      ),
      bi(
        'Your own facts measured against each cited rule of a pathway, three-valued: met, unmet, or not recorded. A missing fact is never a refusal.',
        'Sus propios datos medidos frente a cada norma citada de una vía, con tres valores: cumplido, incumplido o sin datos. Un dato ausente nunca es una denegación.',
      ),
      bi(
        'The document sequence a pathway needs, with legalisation and sworn-translation routing.',
        'La secuencia documental que exige una vía, con su enrutado de legalización y traducción jurada.',
      ),
    ],
    price: bi(
      'Free. No account, no email, no limit, and no result held back until you hand over an address. Permanently: this is the whole of what the advice boundary makes lawful without a representative, so there is nothing here to convert you off.',
      'Gratis. Sin cuenta, sin correo electrónico, sin límite y sin ningún resultado retenido hasta que facilite una dirección. De forma permanente: es todo lo que la frontera del asesoramiento hace lícito sin representante, de modo que aquí no hay nada de lo que convencerle para que se pase a otra cosa.',
    ),
    boundary: bi(
      'No recommendation, no ranking, no chance-of-success estimate — and where one is withheld you are told which and why, rather than left with a gap.',
      'Ninguna recomendación, ninguna clasificación, ninguna estimación de probabilidad de éxito; y cuando se retiene alguna, se le indica cuál y por qué en lugar de dejarle un hueco.',
    ),
    availability: bi(
      'Working today, in your browser, with nothing transmitted or stored.',
      'Funciona hoy, en su navegador, sin transmitir ni almacenar nada.',
    ),
    cta: {
      href: `${PORTAL_URL}/tools`,
      label: bi('Open the free tools', 'Abrir las herramientas gratuitas'),
    },
  },
  {
    id: 'practitioner',
    who: bi('I advise migrants', 'Yo asesoro a personas migrantes'),
    persona: bi(
      'An immigration lawyer or small firm, a Spanish gestoría, a Canadian RCIC. Different regulators, the same shape: your licence is what makes advice lawful.',
      'Un abogado de extranjería o un despacho pequeño, una gestoría española, un RCIC canadiense. Reguladores distintos, la misma forma: su colegiación es lo que hace lícito el asesoramiento.',
    ),
    gets: [
      bi(
        'Every class of output, including the ranked comparison an unrepresented applicant cannot be shown — because your licensee is accountable for the judgement and the engine is a tool in your hands.',
        'Todas las clases de resultado, incluida la comparación ordenada que no puede mostrarse a un solicitante sin representación, porque su colegiado responde del criterio y el motor es una herramienta en sus manos.',
      ),
      bi(
        'Matters that persist: a caseload, each with its own facts, documents and dates, rather than a form you refill.',
        'Expedientes que permanecen: una cartera de casos, cada uno con sus datos, documentos y fechas, en lugar de un formulario que se rellena otra vez.',
      ),
      bi(
        'Deadlines and document expiries watched for you, projected to the date you intend to file rather than to today — a certificate valid now and expired then is a wasted appointment.',
        'Plazos y caducidades documentales vigilados por usted, proyectados a la fecha en que piensa presentar y no a hoy: un certificado vigente ahora y caducado entonces es una cita perdida.',
      ),
    ],
    price: bi(
      'Paid, by the professional whose licence covers the advice. The charge is the continuity — the saved matter, the clock still running next March, the report an auditor will accept — never the calculation, which stays free for everybody. No price is set yet, and none is printed here rather than inventing one.',
      'De pago, a cargo de la persona profesional cuya colegiación ampara el asesoramiento. Se cobra la continuidad —el expediente guardado, el plazo que sigue corriendo el próximo marzo, el informe que aceptará un auditor—, nunca el cálculo, que sigue siendo gratuito para todo el mundo. Todavía no hay precio fijado, y aquí no se imprime ninguno en lugar de inventarlo.',
    ),
    boundary: bi(
      'The gate opens because a named, in-date representative is attached to the matter, not because you paid. A lapsed licence closes it again, and the platform checks rather than assumes.',
      'El control se abre porque hay un representante concreto y en vigor vinculado al expediente, no porque haya pagado. Una colegiación caducada vuelve a cerrarlo, y la plataforma lo comprueba en lugar de suponerlo.',
    ),
    availability: bi(
      'NOT BUILT YET. No application here has an account, a sign-in or a database, so none of this can be bought today. The engine underneath it is real and public; the caseload around it is not written.',
      'AÚN NO CONSTRUIDO. Ninguna aplicación de aquí tiene cuenta, inicio de sesión ni base de datos, así que nada de esto puede contratarse hoy. El motor que lo sustenta es real y público; la gestión de cartera que lo rodea no está escrita.',
    ),
    cta: null,
  },
  {
    id: 'employer',
    who: bi('I move employees', 'Yo traslado a empleados'),
    persona: bi(
      'Corporate mobility, HR, or the person who inherited both. Cohorts rather than cases, and an auditor at the end of it.',
      'Movilidad corporativa, recursos humanos o quien ha heredado ambas cosas. Cohortes en lugar de casos, y un auditor al final del proceso.',
    ),
    gets: [
      bi(
        'Presence and document status across a group of people you are relocating, on one ledger rather than one spreadsheet per assignee.',
        'Presencia y estado documental de un grupo de personas que traslada, en un único registro en lugar de una hoja de cálculo por persona.',
      ),
      bi(
        'Day counts that feed the questions a mobility programme actually gets asked: short-stay allowance, tax-residence thresholds, continuous residence, accumulated authorised work.',
        'Cómputos de días que alimentan las preguntas que de verdad recibe un programa de movilidad: franquicia de estancia corta, umbrales de residencia fiscal, residencia continuada y trabajo autorizado acumulado.',
      ),
      bi(
        'An audit trail with the source of every rule applied and the date somebody last checked it, which is what a compliance review asks for and what a spreadsheet cannot produce.',
        'Un rastro de auditoría con la fuente de cada norma aplicada y la fecha en que alguien la contrastó por última vez, que es lo que pide una revisión de cumplimiento y lo que una hoja de cálculo no puede producir.',
      ),
    ],
    price: bi(
      'Paid, per programme. Again the charge is continuity and audit rather than calculation. No price is set yet.',
      'De pago, por programa. También aquí se cobra la continuidad y la auditoría, no el cálculo. Todavía no hay precio fijado.',
    ),
    boundary: bi(
      'An employer is not a licensee. Information and assessment release; a recommendation still needs a representative on the matter — yours, or one you instruct.',
      'Una empresa no es un colegiado. La información y la evaluación se entregan; una recomendación sigue exigiendo un representante en el expediente, suyo o de quien usted encargue.',
    ),
    availability: bi(
      'NOT BUILT YET, for the same reason: no account, no sign-in, no database. The day counting and the document rules are real, and you can exercise them now.',
      'AÚN NO CONSTRUIDO, por la misma razón: sin cuenta, sin inicio de sesión, sin base de datos. El cómputo de días y las reglas documentales son reales y puede probarlos ahora.',
    ),
    cta: null,
  },
];

/**
 * Readers who fit inside the doors above without being named on them.
 *
 * Kept short and kept honest: neither is a product line, and saying so is
 * cheaper than a reader discovering it.
 */
export const ADJACENT_READERS: readonly { readonly title: LocalizedText; readonly body: LocalizedText }[] = [
  {
    title: bi(
      'Cross-border tax advisers and wealth managers',
      'Asesores fiscales transfronterizos y gestores de patrimonio',
    ),
    body: bi(
      'Day-counting across jurisdictions is the whole job here, and it needs no representative gate: a presence ledger and a threshold count are assessment-class, so the free tier already covers the calculation. What a practice would buy is the ledger that persists between reviews.',
      'Contar días entre jurisdicciones es aquí todo el trabajo, y no requiere ningún control de representación: un registro de presencia y un cómputo frente a un umbral son de clase evaluación, de modo que el nivel gratuito ya cubre el cálculo. Lo que compraría un despacho es el registro que permanece entre revisiones.',
    ),
  },
  {
    title: bi('University international offices', 'Oficinas internacionales universitarias'),
    body: bi(
      'Study-to-work timing is a date problem: when a permit ends, when an application window opens, how much authorised work has accumulated. The catalog does not yet encode the post-graduation routes that would make this complete — see what the catalog does not cover, below.',
      'La transición de estudios a trabajo es un problema de fechas: cuándo termina una autorización, cuándo se abre un plazo, cuánto trabajo autorizado se ha acumulado. El catálogo todavía no codifica las vías posteriores a la graduación que lo harían completo: véase más abajo qué no cubre el catálogo.',
    ),
  },
];

/** The heading of the commitment block. */
export const CLINIC_TITLE: LocalizedText = bi(
  'Free for legal-aid and NGO clinics. Permanently, and without asking.',
  'Gratuito para clínicas jurídicas gratuitas y de ONG. De forma permanente y sin pedirlo.',
);

export const CLINIC_BODY: readonly LocalizedText[] = [
  bi(
    'Every paid capability described above is free for legal-aid providers, NGO and university clinics, and pro bono immigration practice. Not a discount somebody has to apply for, not a starter tier, not a trial: the same product, at no cost, as a standing commitment.',
    'Todas las funciones de pago descritas arriba son gratuitas para servicios de asistencia jurídica gratuita, clínicas de ONG y universitarias y ejercicio pro bono en extranjería. No es un descuento que haya que solicitar, ni un nivel de entrada, ni una prueba: el mismo producto, sin coste, como compromiso permanente.',
  ),
  bi(
    'This is not charity and it is not marketing. In a category full of lead-generation funnels dressed as advice, the people doing the least well-paid work in immigration law are the ones whose judgement about a tool is worth most — and a platform whose whole argument is that it refuses to sell an answer it cannot stand behind has no business charging the clinics for the privilege of checking that claim.',
    'Esto no es caridad ni es publicidad. En un sector lleno de embudos de captación disfrazados de asesoramiento, quienes hacen el trabajo peor pagado del derecho migratorio son aquellos cuyo juicio sobre una herramienta más vale — y una plataforma cuyo argumento entero es que se niega a vender una respuesta de la que no puede responder no tiene por qué cobrar a las clínicas por comprobarlo.',
  ),
  bi(
    'Nothing is billable today in any case, because none of the paid capabilities is built. The commitment is recorded now so that it predates the pricing rather than being retrofitted to it.',
    'En cualquier caso hoy no hay nada facturable, porque ninguna de las funciones de pago está construida. El compromiso se deja constando ahora para que sea anterior a los precios y no un añadido posterior.',
  ),
];
