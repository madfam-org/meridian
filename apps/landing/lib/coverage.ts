/**
 * The edges of the catalog, for the site that describes the catalog.
 *
 * `catalog-facts.ts` counts what Meridian *has*. This counts nothing, because
 * absence has no name and cannot be counted — it is a register of the
 * significant routes this catalog does **not** encode, so that a page describing
 * what the product does also says what it does not reach.
 *
 * The reason this matters on a marketing page rather than only in the portal:
 * somebody deciding whether Meridian is any use to them reads this site first.
 * Two corridors and eight records is a fine thing to ship and a terrible thing
 * to imply is a map of Spanish and Canadian immigration law. A person in Spain
 * without status, reading "the rules, your figures, and the arithmetic between
 * them", has no way to know that the route they would actually use is not in
 * here — unless it is named.
 *
 * ── Self-retirement ─────────────────────────────────────────────────────────
 *
 * Every entry carries `closedBy`: the catalog ids that answer it. The entry
 * disappears from the list once **all** of them are present, so encoding one
 * route out of a family cannot make this page claim the family is covered.
 * Coverage claims shrink on their own; they never grow on their own.
 *
 * ── Why this file has a twin ────────────────────────────────────────────────
 *
 * `apps/web/lib/coverage.ts` holds the fuller version — the same routes with the
 * instrument each one lives in, plus the prose the portal shows beside a result.
 * The two are separate Next applications with no shared import path between
 * them, and the only place they could share is `packages/`, which is the legal
 * contract every engine is built on rather than a home for site copy. So this is
 * a deliberate second copy: **the two registers must be changed together**, and
 * both shrink automatically from the same catalog ids when a route is encoded.
 */

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';

import { bi, type LocalizedText } from '@/lib/i18n';

const CATALOG_IDS: ReadonlySet<string> = new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.id));

export interface UncoveredRoute {
  readonly key: string;
  /** ISO 3166-1 alpha-2, matching `Pathway['jurisdiction']`. */
  readonly jurisdiction: string;
  readonly name: LocalizedText;
  /** Ids that, once all present in the catalog, retire this entry. */
  readonly closedBy: readonly string[];
}

const REGISTER: readonly UncoveredRoute[] = [
  {
    key: 'es-arraigo',
    jurisdiction: 'ES',
    name: bi(
      'Arraigo, in all five of its forms — the routes most people already in Spain without status apply under',
      'El arraigo en sus cinco modalidades: las vías por las que solicita la mayoría de quienes ya están en España sin autorización',
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
    name: bi('Family reunification', 'Reagrupación familiar'),
    closedBy: ['es-family-reunification'],
  },
  {
    key: 'es-eu-family-card',
    jurisdiction: 'ES',
    name: bi(
      'The residence card for a family member of an EU, EEA or Swiss citizen',
      'La tarjeta de residencia de familiar de ciudadano de la Unión, del EEE o de Suiza',
    ),
    closedBy: ['es-eu-family-member-card'],
  },
  {
    key: 'es-long-term-residence',
    jurisdiction: 'ES',
    name: bi('Long-term residence', 'Residencia de larga duración'),
    closedBy: ['es-long-term-residence'],
  },
  {
    key: 'es-student-stay',
    jurisdiction: 'ES',
    name: bi('Stay for study purposes', 'Estancia por estudios'),
    closedBy: ['es-student-stay'],
  },
  {
    key: 'es-nationality-other-than-residence',
    jurisdiction: 'ES',
    name: bi(
      'Spanish nationality by any route other than residence — opción, carta de naturaleza, posesión de estado, and recovery of a nationality previously held',
      'La nacionalidad española por cualquier vía distinta de la residencia: opción, carta de naturaleza, posesión de estado y recuperación de una nacionalidad ostentada antes',
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
    closedBy: ['ca-express-entry-fsw'],
  },
  {
    key: 'ca-fst',
    jurisdiction: 'CA',
    name: bi('The federal skilled trades class', 'La clase federal de oficios cualificados'),
    closedBy: ['ca-express-entry-fst'],
  },
  {
    key: 'ca-pnp',
    jurisdiction: 'CA',
    name: bi(
      'The provincial nominee class, and with it every provincial and territorial programme',
      'La clase de candidatos provinciales y, con ella, todos los programas provinciales y territoriales',
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
    closedBy: ['ca-quebec-selection'],
  },
  {
    key: 'ca-family-class',
    jurisdiction: 'CA',
    name: bi('Family class sponsorship', 'Patrocinio en la clase familiar'),
    closedBy: ['ca-family-class'],
  },
  {
    key: 'ca-study-to-pgwp',
    jurisdiction: 'CA',
    name: bi(
      'The study permit and the post-graduation work permit that lead into the Canadian Experience Class, which is encoded without either of the steps that reach it',
      'El permiso de estudios y el permiso de trabajo posgraduación que conducen a la Canadian Experience Class, codificada sin ninguno de los pasos que llegan a ella',
    ),
    closedBy: ['ca-study-permit', 'ca-post-graduation-work-permit'],
  },
];

/** The register, minus every entry the catalog has since answered. */
export const UNCOVERED_ROUTES: readonly UncoveredRoute[] = REGISTER.filter(
  (route) => !route.closedBy.every((id) => CATALOG_IDS.has(id)),
);

/**
 * Jurisdictions the catalog encodes routes for that this register says nothing
 * about. An empty gap list because every gap closed and an empty gap list
 * because nobody wrote one mean opposite things to a reader; this tells them
 * apart, so a jurisdiction added without a register entry reads as *unknown*
 * coverage rather than as full coverage.
 */
export const JURISDICTIONS_WITHOUT_REGISTER: readonly string[] = [
  ...new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.jurisdiction)),
]
  .sort()
  .filter((code) => !REGISTER.some((entry) => entry.jurisdiction === code));

export const COVERAGE_TITLE: LocalizedText = bi(
  'What Meridian does not cover, named',
  'Qué no cubre Meridian, con nombre y apellidos',
);

export const COVERAGE_LEAD: LocalizedText = bi(
  'The catalog is a deliberate sample of two corridors, not a map of either country’s immigration system. That distinction is invisible from a result screen: a route Meridian has never encoded produces the same silence as a route somebody does not qualify for. So the significant omissions are listed rather than implied, and an eligibility result anywhere in this product that comes back unmet or undecidable is a statement about these records — not a finding that the person has no route.',
  'El catálogo es una muestra deliberada de dos corredores, no un mapa del sistema migratorio de ninguno de los dos países. Esa diferencia es invisible desde una pantalla de resultados: una vía que Meridian nunca ha codificado produce el mismo silencio que una vía cuyos requisitos no se cumplen. Por eso las omisiones importantes se enumeran en lugar de insinuarse, y un resultado de elegibilidad no cumplido o no decidible en cualquier parte de este producto es una afirmación sobre estos registros, no la constatación de que esa persona carezca de vía.',
);

export const COVERAGE_OUT_OF_SCOPE: LocalizedText = bi(
  'Asylum, refugee status, subsidiary protection and humanitarian applications are out of scope permanently, not merely unbuilt. They turn on an assessment of an individual account and of risk rather than on criteria a program can check, and a self-serve eligibility tool is the wrong instrument for a person who is at risk. Meridian will not encode them.',
  'El asilo, el estatuto de refugiado, la protección subsidiaria y las solicitudes por razones humanitarias quedan fuera de alcance de forma permanente, no simplemente sin construir. Dependen de la valoración del relato individual y del riesgo, no de criterios que un programa pueda comprobar, y una herramienta de autoconsulta es el instrumento equivocado para quien está en peligro. Meridian no las codificará.',
);

export const COVERAGE_WHERE_TO_ASK: LocalizedText = bi(
  'Anyone whose route is on this list, or who is not sure whether it is, needs a person who is accountable for the answer rather than this product: in Spain a lawyer admitted to a Colegio de Abogados, and in Canada the representatives s. 91(2) of the Immigration and Refugee Protection Act permits — a lawyer or other member in good standing of a provincial law society, including a paralegal, a notary of the Chambre des notaires du Québec, or a licensee of the College of Immigration and Citizenship Consultants. Meridian names no firm and takes nothing from anybody for a referral.',
  'Quien tenga su vía en esta lista, o no sepa con certeza si la tiene, necesita una persona que responda de la respuesta y no este producto: en España, un abogado colegiado; en Canadá, los representantes que permite el art. 91(2) de la Immigration and Refugee Protection Act, esto es, un abogado u otro colegiado de un law society provincial, incluidos los paralegals, un notario de la Chambre des notaires du Québec o un colegiado del College of Immigration and Citizenship Consultants. Meridian no nombra ningún despacho ni cobra nada de nadie por una derivación.',
);

export const COVERAGE_NOT_EXHAUSTIVE: LocalizedText = bi(
  'This list names the routes we know we have left out. It is not a complete inventory of what is missing, and a route’s absence from it is not a sign that Meridian covers that route.',
  'Esta lista enumera las vías que sabemos que hemos dejado fuera. No es un inventario completo de lo que falta, y que una vía no aparezca en ella no significa que Meridian la cubra.',
);
