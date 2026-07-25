/**
 * Bilingual text.
 *
 * Meridian's pathway catalog carries every user-visible string as `{ en, es }`,
 * and this portal renders **both**, rather than picking one.
 *
 * That is a deliberate product decision, not a shortcut around a locale
 * switcher. Two reasons:
 *
 *  1. A person filing in Spain reads a Spanish form and gets a Spanish
 *     resolution, while their employer, their lawyer's associate, or the
 *     relative helping them may read only English. Showing one text and hiding
 *     the other means one of them is reading a translation they cannot check
 *     against the version the other is acting on. For a screen that says how
 *     many days of a 90-day allowance are left, that is not acceptable.
 *  2. Both strings in the catalog are authored, reviewed and versioned
 *     together. Neither is a machine rendering of the other, so neither is
 *     subordinate.
 *
 * Each half is emitted with its own `lang` attribute so assistive technology
 * switches voice and pronunciation correctly, and so `hyphens`/`quotes` follow
 * the right language rules. The Spanish line is styled as a secondary line, not
 * hidden.
 */

/** The shape the pathway catalog uses. Structurally identical to `LocalizedText`. */
export interface Bi {
  readonly en: string;
  readonly es: string;
}

export function bi(en: string, es: string): Bi {
  return { en, es };
}

/** The two languages this portal renders, in display order. */
export const LANGUAGES: readonly (keyof Bi)[] = ['en', 'es'];

/** Chrome strings. Kept here rather than inline so the two languages stay in step. */
export const UI = {
  siteName: bi('Meridian', 'Meridian'),
  siteTagline: bi(
    'Migration law and logistics, with the arithmetic shown',
    'Derecho y logística migratoria, con la aritmética a la vista',
  ),
  skipToContent: bi('Skip to main content', 'Saltar al contenido principal'),
  navHome: bi('Overview', 'Resumen'),
  navMatters: bi('Matters', 'Expedientes'),
  navPathways: bi('Pathways', 'Vías'),
  matterOverview: bi('Matter', 'Expediente'),
  matterPresence: bi('Day counters', 'Cómputo de días'),
  matterDocuments: bi('Documents', 'Documentos'),
  workedExample: bi('Worked example', 'Ejemplo resuelto'),
  asOf: bi('Assessed as at', 'Evaluado a fecha de'),
  citation: bi('Source', 'Fuente'),
  citations: bi('Sources', 'Fuentes'),
  verifiedOn: bi('Last verified', 'Última verificación'),
  arithmetic: bi('The arithmetic', 'La aritmética'),
  noneRecorded: bi('None recorded', 'Sin registros'),
  notAssessed: bi('Not assessed', 'No evaluado'),
  representative: bi('Authorised representative', 'Representante autorizado'),
  footerLicence: bi(
    'Meridian is free software released under the AGPL-3.0.',
    'Meridian es software libre publicado bajo la licencia AGPL-3.0.',
  ),
  footerNotAdvice: bi(
    'Meridian is software. It is not a law firm and it does not give legal advice.',
    'Meridian es software. No es un despacho de abogados y no presta asesoramiento jurídico.',
  ),
} as const;
