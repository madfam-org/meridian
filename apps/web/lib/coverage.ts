/**
 * What this catalog does **not** cover, stated where a result is read.
 *
 * ── Why this file exists ─────────────────────────────────────────────────────
 *
 * Every pathway record in `@meridian/pathways` is honest about itself: it names
 * its criteria, its sources and its review status. The *product* was not honest
 * about its edges. A person living in Spain without status could open
 * `/tools/nationality-es`, answer every question truthfully, receive "not met"
 * or "not decidable", and reasonably conclude they have no route — when the
 * routes most people in that position actually use are not encoded here at all.
 * The reader has no way to detect that from a result page, so the result page
 * has to say it.
 *
 * That is the whole job of this module: name the significant routes that are
 * missing, specifically enough to be acted on. "Other routes exist" is useless.
 * "This does not cover arraigo, family reunification, or the residence card for
 * family members of EU citizens" is something a reader can take to a lawyer.
 *
 * ── Why the covered side is derived and the missing side is a register ───────
 *
 * Anything that can be counted from the catalog is counted from the catalog —
 * which jurisdictions are covered, which routes are in them, how many there are.
 * A hand-written sentence saying "six Spanish routes" is wrong the day a seventh
 * lands, and nothing tells anybody. `lib/../../landing/lib/catalog-facts.ts`
 * established that pattern for the marketing site and it holds here.
 *
 * The missing side cannot be derived — the absence of a route from a catalog
 * carries no name. So it is a register, and every entry carries `closedBy`: the
 * catalog ids that, once all present, mean the entry has been answered and drops
 * off the list on the next build. Encoding *arraigo social* alone does not
 * retire the arraigo entry, because four other arraigo routes would still be
 * missing and a reader told "we cover arraigo" would stop looking. Coverage
 * claims are allowed to shrink automatically; they are never allowed to grow
 * automatically.
 *
 * `JURISDICTIONS_WITHOUT_REGISTER` is the other half of that guard. If somebody
 * adds a third jurisdiction to the catalog and writes no register entries for
 * it, this module reports that jurisdiction as one whose coverage is *unknown*
 * rather than letting an empty gap list read as full coverage.
 *
 * ── The one rule about the contents ─────────────────────────────────────────
 *
 * Each entry names a route and says where the route lives, and stops there. It
 * states no threshold, no period, no eligibility condition and no outcome. That
 * is deliberate: naming a route is a statement about *this catalog*, which we
 * can verify by reading it, whereas summarising a route's requirements would be
 * encoding law in a place with no citation record, no `verifiedOn` date and no
 * review status — which is exactly what the rest of this repository is built to
 * prevent. The instrument references below were each read against the official
 * consolidated text on 2026-07-25; they are there so a reader can look the route
 * up, not so this page can characterise it.
 */

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';
import type { Pathway } from '@meridian/pathways';

import { bi, type Bi } from '@/lib/i18n';

const catalog = MERIDIAN_PATHWAY_CATALOG;

const CATALOG_IDS: ReadonlySet<string> = new Set(catalog.map((p) => p.id));

/** Every jurisdiction the shipped catalog encodes at least one route for. */
export const COVERED_JURISDICTIONS: readonly string[] = [
  ...new Set(catalog.map((p) => p.jurisdiction)),
].sort();

/** The routes encoded for one jurisdiction, in catalog order. */
export function coveredIn(jurisdiction: string): readonly Pathway[] {
  return catalog.filter((p) => p.jurisdiction === jurisdiction);
}

/**
 * A route this catalog does not encode.
 *
 * `source` names the instrument the route lives in so a reader can find it. It
 * is not a citation record — there is no `verifiedOn` field here and no review
 * status — and it deliberately says nothing about what the route requires.
 */
export interface UncoveredRoute {
  /** Stable key for React and for tests. Not shown. */
  readonly key: string;
  /** ISO 3166-1 alpha-2, matching `Pathway['jurisdiction']`. */
  readonly jurisdiction: string;
  readonly name: Bi;
  /** Where the route is provided for, so the reader can look it up. */
  readonly source: Bi;
  /**
   * Catalog ids that would answer this entry. The entry is retired only when
   * **every** id is present, so encoding one of a family of routes cannot make
   * the page claim the family is covered.
   */
  readonly closedBy: readonly string[];
}

/**
 * The register.
 *
 * Ordered within a jurisdiction by how many people it is likely to concern, not
 * by importance to us — and that ordering is not a recommendation, because
 * nothing here is measured against anybody's facts. Arraigo leads the Spanish
 * list because it is the route most irregular-status migrants in Spain use, and
 * it is the omission most likely to cause somebody to give up.
 */
const REGISTER: readonly UncoveredRoute[] = [
  {
    key: 'es-arraigo',
    jurisdiction: 'ES',
    name: bi(
      'Arraigo — all five routes: social, sociolaboral, socioformativo, familiar and de segunda oportunidad',
      'Arraigo, en sus cinco modalidades: social, sociolaboral, socioformativo, familiar y de segunda oportunidad',
    ),
    source: bi(
      'Real Decreto 1155/2024, Título VII (residencia temporal por circunstancias excepcionales), in force from 2025-05-20. These are the routes most people already in Spain without status apply under.',
      'Real Decreto 1155/2024, Título VII (residencia temporal por circunstancias excepcionales), en vigor desde el 20-05-2025. Son las vías por las que solicita la mayoría de quienes ya están en España sin autorización.',
    ),
    closedBy: [
      'es-arraigo-social',
      'es-arraigo-sociolaboral',
      'es-arraigo-socioformativo',
      'es-arraigo-familiar',
      'es-arraigo-segunda-oportunidad',
    ],
  },
  {
    key: 'es-family-reunification',
    jurisdiction: 'ES',
    name: bi('Family reunification (reagrupación familiar)', 'Reagrupación familiar'),
    source: bi(
      'Ley Orgánica 4/2000, arts. 17 to 19, and Real Decreto 1155/2024, Título IV.',
      'Ley Orgánica 4/2000, arts. 17 a 19, y Real Decreto 1155/2024, Título IV.',
    ),
    closedBy: ['es-family-reunification'],
  },
  {
    key: 'es-eu-family-card',
    jurisdiction: 'ES',
    name: bi(
      'The residence card for a family member of an EU, EEA or Swiss citizen',
      'La tarjeta de residencia de familiar de ciudadano de la Unión, del EEE o de Suiza',
    ),
    source: bi(
      'Real Decreto 240/2007, art. 8. This is a separate regime from the general immigration law, and being married to or the child or parent of an EU citizen can put a person inside it.',
      'Real Decreto 240/2007, art. 8. Es un régimen distinto del general de extranjería, y estar casado con un ciudadano de la Unión, o ser su hijo o su ascendiente, puede situar a una persona dentro de él.',
    ),
    closedBy: ['es-eu-family-member-card'],
  },
  {
    key: 'es-long-term-residence',
    jurisdiction: 'ES',
    name: bi('Long-term residence (residencia de larga duración)', 'Residencia de larga duración'),
    source: bi(
      'Ley Orgánica 4/2000, art. 32, and Real Decreto 1155/2024, Título X.',
      'Ley Orgánica 4/2000, art. 32, y Real Decreto 1155/2024, Título X.',
    ),
    closedBy: ['es-long-term-residence'],
  },
  {
    key: 'es-student-stay',
    jurisdiction: 'ES',
    name: bi('Stay for study purposes (estancia por estudios)', 'Estancia por estudios'),
    source: bi(
      'Real Decreto 1155/2024, Título III.',
      'Real Decreto 1155/2024, Título III.',
    ),
    closedBy: ['es-student-stay'],
  },
  {
    key: 'es-nationality-other-than-residence',
    jurisdiction: 'ES',
    name: bi(
      'Spanish nationality by any route other than residence — por opción, por carta de naturaleza, por posesión de estado, and recovery of a nationality previously held',
      'Nacionalidad española por cualquier vía distinta de la residencia: por opción, por carta de naturaleza, por posesión de estado y recuperación de una nacionalidad ostentada antes',
    ),
    source: bi(
      'The Ministerio de Justicia lists these alongside nationality by residence. Meridian encodes only the residence route, so a person whose claim runs through a parent, an adoption or a nationality they once held will find nothing here that fits.',
      'El Ministerio de Justicia las enumera junto a la nacionalidad por residencia. Meridian solo codifica la vía de residencia, de modo que quien acceda a través de un progenitor, de una adopción o de una nacionalidad que tuvo antes no encontrará aquí nada que le corresponda.',
    ),
    closedBy: [
      'es-nationality-option',
      'es-nationality-carta-naturaleza',
      'es-nationality-posesion-estado',
      'es-nationality-recovery',
    ],
  },

  {
    key: 'ca-fsw',
    jurisdiction: 'CA',
    name: bi('The federal skilled worker class', 'La clase federal de trabajadores cualificados'),
    source: bi(
      'Immigration and Refugee Protection Regulations, s. 75. Managed through Express Entry, which this catalog does not model.',
      'Immigration and Refugee Protection Regulations, art. 75. Se gestiona a través de Express Entry, que este catálogo no modela.',
    ),
    closedBy: ['ca-express-entry-fsw'],
  },
  {
    key: 'ca-fst',
    jurisdiction: 'CA',
    name: bi('The federal skilled trades class', 'La clase federal de oficios cualificados'),
    source: bi(
      'Immigration and Refugee Protection Regulations, s. 87.2.',
      'Immigration and Refugee Protection Regulations, art. 87.2.',
    ),
    closedBy: ['ca-express-entry-fst'],
  },
  {
    key: 'ca-pnp',
    jurisdiction: 'CA',
    name: bi(
      'The provincial nominee class — every provincial and territorial nominee programme',
      'La clase de candidatos provinciales: todos los programas de nominación provincial y territorial',
    ),
    source: bi(
      'Immigration and Refugee Protection Regulations, s. 87. Each province runs its own streams with its own criteria, and none of them is encoded here.',
      'Immigration and Refugee Protection Regulations, art. 87. Cada provincia gestiona sus propias corrientes con sus propios criterios, y ninguna está codificada aquí.',
    ),
    closedBy: ['ca-provincial-nominee'],
  },
  {
    key: 'ca-quebec',
    jurisdiction: 'CA',
    name: bi(
      'Quebec’s own selection system, which is separate from the federal one',
      'El sistema de selección propio de Quebec, distinto del federal',
    ),
    source: bi(
      'Immigration and Refugee Protection Act, s. 9, provides for a province with sole responsibility for selection under a federal-provincial agreement; s. 75(1) of the Regulations limits the federal skilled worker class to people who intend to reside outside Quebec. Anyone whose destination is Quebec is outside everything this catalog encodes for Canada.',
      'El art. 9 de la Immigration and Refugee Protection Act prevé que una provincia asuma en exclusiva la selección al amparo de un acuerdo federal-provincial; el art. 75(1) del Reglamento limita la clase federal de trabajadores cualificados a quienes piensan residir fuera de Quebec. Quien tenga Quebec como destino queda fuera de todo lo que este catálogo codifica para Canadá.',
    ),
    closedBy: ['ca-quebec-selection'],
  },
  {
    key: 'ca-family-class',
    jurisdiction: 'CA',
    name: bi('Family class sponsorship', 'Patrocinio en la clase familiar'),
    source: bi(
      'Immigration and Refugee Protection Regulations, s. 117.',
      'Immigration and Refugee Protection Regulations, art. 117.',
    ),
    closedBy: ['ca-family-class'],
  },
  {
    key: 'ca-study-to-pgwp',
    jurisdiction: 'CA',
    name: bi(
      'The study permit and the post-graduation work permit that lead into the Canadian Experience Class',
      'El permiso de estudios y el permiso de trabajo posgraduación que conducen a la Canadian Experience Class',
    ),
    source: bi(
      'This catalog encodes the Canadian Experience Class itself but neither of the two steps most people reach it through, so the route is only half visible here.',
      'Este catálogo codifica la propia Canadian Experience Class, pero ninguno de los dos pasos por los que la mayoría llega a ella, de modo que la vía solo se ve aquí a medias.',
    ),
    closedBy: ['ca-study-permit', 'ca-post-graduation-work-permit'],
  },
];

function stillMissing(route: UncoveredRoute): boolean {
  return !route.closedBy.every((id) => CATALOG_IDS.has(id));
}

/** The register, minus every entry the catalog has since answered. */
export const UNCOVERED_ROUTES: readonly UncoveredRoute[] = REGISTER.filter(stillMissing);

/** The still-missing routes for the given jurisdictions, in register order. */
export function uncoveredIn(jurisdictions: readonly string[]): readonly UncoveredRoute[] {
  return UNCOVERED_ROUTES.filter((route) => jurisdictions.includes(route.jurisdiction));
}

/**
 * Jurisdictions the catalog encodes routes for that this register says nothing
 * about.
 *
 * An empty gap list has two possible causes — every named gap was closed, or
 * nobody ever wrote one — and they mean opposite things to a reader. This
 * separates them, so a jurisdiction added to the catalog without a register
 * entry is reported as *unknown coverage* instead of silently reading as full
 * coverage. It is computed against the whole register rather than the filtered
 * list, because a jurisdiction whose every gap has genuinely been closed is not
 * the same thing as one nobody has assessed.
 */
export const JURISDICTIONS_WITHOUT_REGISTER: readonly string[] = COVERED_JURISDICTIONS.filter(
  (code) => !REGISTER.some((entry) => entry.jurisdiction === code),
);

/** Human-readable names for the jurisdiction codes this catalog uses. */
const JURISDICTION_NAME: Readonly<Record<string, Bi>> = {
  ES: bi('Spain', 'España'),
  CA: bi('Canada', 'Canadá'),
};

/** The country name where we have one; otherwise the code, unchanged. */
export function jurisdictionName(code: string): Bi {
  return JURISDICTION_NAME[code] ?? bi(code, code);
}

// ---------------------------------------------------------------------------
// The fixed prose
// ---------------------------------------------------------------------------

export const COVERAGE_TITLE: Bi = bi(
  'What this does not cover — read this before you conclude anything',
  'Qué no cubre esto: léalo antes de sacar conclusiones',
);

/**
 * The sentence this whole module exists for.
 *
 * It is `information`-class: a statement about the contents of this catalog,
 * not a measurement of anybody's facts and not a suggestion about what to do.
 */
export const NOT_A_VERDICT_ON_YOU: Bi = bi(
  'A result of “not met” or “not decidable” on this site means the criteria Meridian has encoded were not satisfied by the answers given. It does not mean you have no immigration route. The catalog is small, it is a deliberate sample rather than a map, and the routes named below are not in it at all — one of them may be the one that applies to you.',
  'Un resultado de «no cumplido» o «no decidible» en este sitio significa que las respuestas facilitadas no satisfacen los criterios que Meridian tiene codificados. No significa que usted carezca de vía migratoria. El catálogo es pequeño, es una muestra deliberada y no un mapa, y las vías que se enumeran a continuación no están en él en absoluto: alguna de ellas puede ser la que le corresponde.',
);

/** Named because a reader who is in this situation must not be left guessing. */
export const OUT_OF_SCOPE_PROTECTION: Bi = bi(
  'Meridian does not assess claims for international protection — asylum, refugee status and subsidiary protection — nor humanitarian and compassionate applications, and it is not going to. Those turn on an assessment of an individual account and of risk, not on criteria a program can check, and a self-serve eligibility tool is the wrong instrument for them. If that may be your situation, this site cannot help with it and you should speak to a lawyer or to an organisation that specialises in protection claims.',
  'Meridian no evalúa solicitudes de protección internacional —asilo, estatuto de refugiado y protección subsidiaria— ni solicitudes por razones humanitarias, ni lo hará. Dependen de la valoración del relato individual y del riesgo, no de criterios que un programa pueda comprobar, y una herramienta de autoconsulta es el instrumento equivocado para ellas. Si esa puede ser su situación, este sitio no puede ayudarle en ella y conviene que hable con un abogado o con una organización especializada en protección internacional.',
);

export const WHERE_TO_ASK: Bi = bi(
  'If a route named here might be yours, take it to somebody who is accountable for the answer. In Spain, that is a lawyer admitted to a Colegio de Abogados. In Canada, s. 91(2) of the Immigration and Refugee Protection Act permits a lawyer or other member in good standing of a provincial law society, including a paralegal, a notary of the Chambre des notaires du Québec, or a licensee of the College of Immigration and Citizenship Consultants. Meridian names no firm, refers you to nobody, and is paid nothing by anybody for sending you to them.',
  'Si alguna de las vías nombradas aquí puede ser la suya, llévesela a alguien que responda de la respuesta. En España, un abogado colegiado. En Canadá, el art. 91(2) de la Immigration and Refugee Protection Act lo permite a un abogado u otro colegiado de un law society provincial, incluidos los paralegals, a un notario de la Chambre des notaires du Québec y a un colegiado del College of Immigration and Citizenship Consultants. Meridian no nombra ningún despacho, no le deriva a nadie y no cobra nada de nadie por enviarle allí.',
);

/** The register is a list of known omissions, not a survey. Say so. */
export const REGISTER_IS_NOT_EXHAUSTIVE: Bi = bi(
  'This list names the routes we know we have left out. It is not a complete map of either country’s immigration system, and a route’s absence from it is not a sign that Meridian covers that route.',
  'Esta lista enumera las vías que sabemos que hemos dejado fuera. No es un mapa completo del sistema migratorio de ninguno de los dos países, y que una vía no aparezca en ella no significa que Meridian la cubra.',
);
