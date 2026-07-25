/**
 * Bilingual text.
 *
 * This site renders English and Spanish together, exactly as the applicant
 * portal does, and for the same reason: Meridian's catalog carries every
 * user-visible string as `{ en, es }`, both halves authored and reviewed
 * together, so neither is a translation of the other and neither is subordinate.
 *
 * On a marketing page the argument is if anything stronger than in the portal.
 * The two corridors this platform starts from run out of Mexico, and the
 * decision to use it is rarely taken by one person alone — an applicant, the
 * relative helping them, an employer's mobility manager and a firm's paralegal
 * may not share a language. Showing one text and hiding the other means one of
 * them is reading a version they cannot check against the one the others are
 * acting on. That is a poor way to state where a legal boundary sits.
 *
 * Each half is emitted with its own `lang` attribute so assistive technology
 * switches voice and pronunciation, and so hyphenation and quotation rules
 * follow the right language.
 */

/** The shape the pathway catalog uses. Structurally identical to `LocalizedText`. */
export interface Bi {
  readonly en: string;
  readonly es: string;
}

export function bi(en: string, es: string): Bi {
  return { en, es };
}

/** Chrome strings. Kept here rather than inline so the two languages stay in step. */
export const UI = {
  siteName: bi('Meridian', 'Meridian'),
  siteTagline: bi(
    'Migration law and logistics, with the arithmetic shown',
    'Derecho y logística migratoria, con la aritmética a la vista',
  ),
  skipToContent: bi('Skip to main content', 'Saltar al contenido principal'),

  navWhatItIs: bi('What it is', 'Qué es'),
  navCorridors: bi('Corridors', 'Corredores'),
  navBoundary: bi('The advice boundary', 'La frontera del asesoramiento'),
  navRefused: bi('What we refuse', 'Lo que rechazamos'),
  navStatus: bi('Status', 'Estado'),
  navAudiences: bi('Who it is for', 'Para quién es'),
  openPortal: bi('Open the portal', 'Abrir el portal'),
  readTheSource: bi('Read the source', 'Ver el código fuente'),

  footerNotAdvice: bi(
    'Meridian is software. It is not a law firm and it does not give legal advice.',
    'Meridian es software. No es un despacho de abogados y no presta asesoramiento jurídico.',
  ),
  footerLicence: bi(
    'Meridian is free software released under the AGPL-3.0. The source is public, including the rule catalog and every citation in it.',
    'Meridian es software libre publicado bajo la licencia AGPL-3.0. El código es público, incluidos el catálogo de normas y todas sus citas.',
  ),
  footerComputed: bi(
    'Every figure on this page is counted from the shipped catalog when the site is built. None of them is an estimate.',
    'Todas las cifras de esta página se cuentan a partir del catálogo publicado al compilar el sitio. Ninguna es una estimación.',
  ),
} as const;
