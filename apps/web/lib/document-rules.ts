/**
 * Document routing computed inside the portal.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE TRUSTING ANYTHING BELOW
 * ---------------------------------------------------------------------------
 *
 * `@meridian/documents` is the authoritative engine for legalisation routing,
 * translation requirements, acceptance windows and checklist assembly. It is
 * **not wired into this portal yet** — it is not among this application's
 * declared dependencies, so it cannot be imported here. Rather than render an
 * empty page or fabricate a screenshot, this module computes the same shapes
 * locally, over the same worked example, from a deliberately tiny rule set.
 *
 * The documents page says so on screen. When the shared engine is wired in,
 * this file is deleted, not merged: two catalogs of legal rules in one product
 * is exactly the failure mode the `Citation` type exists to prevent.
 *
 * What is genuinely real here: the calendar arithmetic. Every date computation
 * goes through `@meridian/core`, acceptance windows keep their source unit (a
 * three-month window is applied as three months, never as ninety days — they
 * differ by up to three days and always in the direction that ages the
 * document), and `earliestSafeIssueDate` inverts a window by verifying forward
 * rather than by subtracting, because `addMonths` clamps at month ends and is
 * not exactly invertible.
 *
 * What is deliberately small: exactly **one** acceptance window is encoded, and
 * legalisation is routed for exactly **one** receiving state. Everything else
 * resolves to `unknown`, which is a first-class answer here and never collapses
 * into "fine". An uncatalogued route produces a verification step owned by a
 * person, not a plausible default.
 *
 * No URLs are recorded on any citation in this file. Each of these instruments
 * has a canonical location, but a gazette identifier off by one digit points at
 * a different law, and a reader who follows one wrong link stops checking the
 * rest. The honest state is an empty `url` and a note saying where to look.
 */

import type { Citation, CountryCode, IsoDate } from '@meridian/core';
import {
  MeridianError,
  addDays,
  addMonths,
  apostilleStatus,
  compareDates,
  diffDays,
  isoDate,
} from '@meridian/core';

import { bi, type Bi } from '@/lib/i18n';

const VERIFIED_ON: IsoDate = isoDate('2026-07-25');

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/**
 * A subset of the document kinds `@meridian/documents` defines, spelled
 * identically so that swapping the engine in is a straight substitution rather
 * than a migration.
 */
export type DocumentKind =
  | 'passport'
  | 'national_id'
  | 'birth_certificate'
  | 'criminal_record'
  | 'proof_of_accommodation'
  | 'degree_certificate'
  | 'academic_transcript'
  | 'employment_offer'
  | 'application_form'
  | 'payment_receipt';

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, Bi> = {
  passport: bi('Passport', 'Pasaporte'),
  national_id: bi('National identity document', 'Documento nacional de identidad'),
  birth_certificate: bi('Birth certificate', 'Certificado de nacimiento'),
  criminal_record: bi('Criminal-record certificate', 'Certificado de antecedentes penales'),
  proof_of_accommodation: bi('Proof of address', 'Justificante de domicilio'),
  degree_certificate: bi('Degree certificate', 'Título universitario'),
  academic_transcript: bi('Academic transcript', 'Expediente académico'),
  employment_offer: bi('Offer of employment', 'Oferta de empleo'),
  application_form: bi('Application form', 'Formulario de solicitud'),
  payment_receipt: bi('Fee payment receipt', 'Justificante de pago de tasa'),
};

/**
 * How a receiving authority establishes that a document is genuine.
 *
 * A passport is inspected in the original by the officer, so it is not
 * legalised. A civil-registry extract is a public document issued by another
 * State and needs the chain the Hague Convention replaced with a single
 * certificate. A form the applicant fills in themselves is neither.
 */
export type AuthenticationClass = 'public_document' | 'presented_in_original' | 'own_instrument';

const AUTHENTICATION_CLASS: Record<DocumentKind, AuthenticationClass> = {
  passport: 'presented_in_original',
  national_id: 'presented_in_original',
  birth_certificate: 'public_document',
  criminal_record: 'public_document',
  proof_of_accommodation: 'public_document',
  degree_certificate: 'public_document',
  academic_transcript: 'public_document',
  employment_offer: 'own_instrument',
  application_form: 'own_instrument',
  payment_receipt: 'own_instrument',
};

/** Kinds whose currency is governed by a printed expiry date rather than a window. */
const EXPIRY_GOVERNED: readonly DocumentKind[] = ['passport', 'national_id'];

// ---------------------------------------------------------------------------
// Citations
// ---------------------------------------------------------------------------

export const HAGUE_ART_1: Citation = {
  id: 'hague-1961-art-1',
  kind: 'treaty',
  instrument:
    'Convention of 5 October 1961 Abolishing the Requirement of Legalisation for Foreign Public Documents',
  provision: 'art. 1',
  jurisdiction: 'X-HAGUE',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 1 defines the public documents the Convention applies to, including documents emanating from an ' +
    'authority connected with the courts, administrative documents, and official certificates placed on ' +
    'private documents. It expressly excludes documents executed by diplomatic or consular agents and certain ' +
    'commercial or customs documents. Whether a particular certificate is a public document in the issuing ' +
    'State is a question of that State’s law.',
};

export const HAGUE_ART_3: Citation = {
  id: 'hague-1961-art-3',
  kind: 'treaty',
  instrument:
    'Convention of 5 October 1961 Abolishing the Requirement of Legalisation for Foreign Public Documents',
  provision: 'art. 3',
  jurisdiction: 'X-HAGUE',
  verifiedOn: VERIFIED_ON,
  note:
    'The only formality that may be required to certify the signature, the capacity of the signatory and the ' +
    'identity of any seal is the addition of an apostille issued by the competent authority of the State the ' +
    'document came from. The apostille certifies the signature and seal; it says nothing about the content of ' +
    'the document.',
};

export const ES_LEY_39_2015_ART_15: Citation = {
  id: 'es-ley-39-2015-art-15',
  kind: 'statute',
  instrument:
    'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
  provision: 'art. 15',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Castilian is the language of procedures before the General State Administration. Co-official languages may ' +
    'be used before organs of the General State Administration sited in the corresponding Autonomous Community, ' +
    'and documents must be translated into Castilian where they are to take effect outside that Community. This ' +
    'portal does not model the co-official language regimes; a document in Catalan, Galician, Basque or Aranese ' +
    'may be acceptable without translation before some organs and not others.',
};

export const ES_SWORN_TRANSLATOR: Citation = {
  id: 'es-traductor-jurado',
  kind: 'official_guidance',
  instrument:
    'Ministerio de Asuntos Exteriores, Unión Europea y Cooperación — appointment of traductores-intérpretes jurados and the effect of a sworn translation',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The office of traductor-intérprete jurado is appointed by the MAEC and a translation bearing that seal is ' +
    'treated as official. The specific royal decree currently governing appointment is NOT pinned here, because ' +
    'the regime has been amended more than once and a wrong instrument number is worse than none. Counsel must ' +
    'confirm the instrument and whether the receiving office accepts a translation sworn in a third State — ' +
    'that question is not modelled at all.',
};

export const ES_CRIMINAL_RECORD_WINDOW: Citation = {
  id: 'es-criminal-record-currency',
  kind: 'official_guidance',
  instrument:
    'Spanish consular and Extranjería practice on the currency of a foreign criminal-record certificate',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'ADMINISTRATIVE PRACTICE, NOT A STATUTORY PERIOD. No instrument fixes a validity period for a foreign ' +
    'criminal-record certificate presented in Spain. Three months is the shorter of the periods offices are ' +
    'commonly observed to apply; six months is also seen. Three is recorded because a certificate that ' +
    'satisfies the tighter reading satisfies both, and because ordering one early costs a fee while ordering ' +
    'it late costs a filing date. Counsel must confirm the period the receiving office actually applies.',
};

export const CA_OFFICIAL_LANGUAGES: Citation = {
  id: 'ca-official-languages-act',
  kind: 'statute',
  instrument: 'Official Languages Act (Canada), R.S.C. 1985, c. 31 (4th Supp.)',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'English and French are the official languages of Canada and have equality of status in all institutions of ' +
    'the Parliament and Government of Canada. This is the basis for a federal department accepting documents in ' +
    'either language; it is not itself the rule about translating documents that are in neither.',
};

export const CA_IRCC_TRANSLATION: Citation = {
  id: 'ca-ircc-translation',
  kind: 'official_guidance',
  instrument:
    'Immigration, Refugees and Citizenship Canada — published instructions on supporting documents not in English or French',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DEPARTMENTAL INSTRUCTION, NOT LEGISLATION. A supporting document in another language is to be accompanied ' +
    'by a translation from a certified translator, or by a translation with an affidavit from the person who ' +
    'made it. The instructions state the translation must not be done by the applicant, by a member of their ' +
    'family, or by their representative. These instructions are revised without legislative process and must be ' +
    're-read at the time of filing.',
};

export const DOCUMENT_CITATIONS: readonly Citation[] = [
  HAGUE_ART_1,
  HAGUE_ART_3,
  ES_LEY_39_2015_ART_15,
  ES_SWORN_TRANSLATOR,
  ES_CRIMINAL_RECORD_WINDOW,
  CA_OFFICIAL_LANGUAGES,
  CA_IRCC_TRANSLATION,
];

export function findDocumentCitation(id: string): Citation | null {
  return DOCUMENT_CITATIONS.find((x) => x.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Legalisation
// ---------------------------------------------------------------------------

export type LegalisationRoute = 'none' | 'apostille' | 'consular' | 'unknown';

export interface LegalisationOutcome {
  readonly route: LegalisationRoute;
  readonly rationale: Bi;
  readonly citationIds: readonly string[];
  /** True when a person must confirm the route before anyone acts on it. */
  readonly requiresVerification: boolean;
}

/** Receiving states this portal has a legalisation rule for. */
const LEGALISATION_MODELLED: readonly string[] = ['ES'];

/**
 * Which authentication chain, if any, a document has to go through.
 *
 * The unknown branch is the important one. A country absent from the shared
 * apostille catalog does **not** fall through to "consular legalisation" — that
 * would be a guess about which ministry a person queues at, on a chain whose
 * steps, fees and order are set post by post. It returns `unknown` and hands
 * the question to a human.
 */
export function legalisationFor(
  kind: DocumentKind,
  issuingCountry: CountryCode,
  receivingCountry: CountryCode,
): LegalisationOutcome {
  const authentication = AUTHENTICATION_CLASS[kind];

  // The two non-public classes are settled before the receiving state is
  // consulted, because the reasoning does not depend on it. A passport is
  // inspected in the original at every counter in the world, and a form the
  // applicant fills in is not a foreign public document anywhere. Routing them
  // to `unknown` merely because a receiving state is uncatalogued would bury
  // the genuine unknowns in noise, and a warning nobody can act on is a warning
  // people learn to skip.
  if (authentication === 'presented_in_original') {
    return {
      route: 'none',
      requiresVerification: false,
      citationIds: [HAGUE_ART_1.id],
      rationale: bi(
        'Inspected in the original by the receiving officer, so no authentication chain applies. The Convention governs public documents produced as evidence, not identity documents shown at a counter.',
        'Se examina el original ante el funcionario receptor, por lo que no procede cadena de autenticación. El Convenio rige los documentos públicos aportados como prueba, no los documentos de identidad exhibidos en ventanilla.',
      ),
    };
  }

  if (authentication === 'own_instrument') {
    return {
      route: 'none',
      requiresVerification: false,
      citationIds: [HAGUE_ART_1.id],
      rationale: bi(
        'Not a public document of another State — it is produced for this application. Art. 1 does not reach it.',
        'No es documento público de otro Estado: se genera para esta solicitud. El art. 1 no lo alcanza.',
      ),
    };
  }

  if (issuingCountry.toUpperCase() === receivingCountry.toUpperCase()) {
    return {
      route: 'none',
      requiresVerification: false,
      citationIds: [HAGUE_ART_1.id],
      rationale: bi(
        'Issued domestically. Legalisation is what makes a foreign public document usable; a document that never crosses a border does not need it.',
        'Expedido en el propio país. La legalización es lo que hace utilizable un documento público extranjero; un documento que no cruza frontera no la necesita.',
      ),
    };
  }

  if (!LEGALISATION_MODELLED.includes(receivingCountry.toUpperCase())) {
    return {
      route: 'unknown',
      requiresVerification: true,
      citationIds: [],
      rationale: bi(
        `This portal encodes no legalisation rule for foreign public documents presented in ${receivingCountry}. The receiving authority's own documentary requirements must be confirmed before anything is ordered — several authorities require a certified translation and no authentication chain at all, and ordering an apostille nobody asked for costs money and weeks.`,
        `Este portal no codifica ninguna regla de legalización para documentos públicos extranjeros presentados en ${receivingCountry}. Deben confirmarse los requisitos documentales de la autoridad receptora antes de solicitar nada: varias autoridades exigen traducción certificada y ninguna cadena de autenticación, y pedir una apostilla que nadie ha solicitado cuesta dinero y semanas.`,
      ),
    };
  }

  const status = apostilleStatus(issuingCountry);
  if (status !== null && status.isParty) {
    return {
      route: 'apostille',
      requiresVerification: status.note !== undefined,
      citationIds: [HAGUE_ART_1.id, HAGUE_ART_3.id],
      rationale: bi(
        `${issuingCountry} and ${receivingCountry} are both parties to the 1961 Convention, so a single apostille issued by the competent authority in ${issuingCountry} replaces the consular chain.${status.note !== undefined ? ` Catalog note: ${status.note}` : ''}`,
        `${issuingCountry} y ${receivingCountry} son parte del Convenio de 1961, por lo que una sola apostilla expedida por la autoridad competente de ${issuingCountry} sustituye a la cadena consular.${status.note !== undefined ? ` Nota del catálogo: ${status.note}` : ''}`,
      ),
    };
  }

  return {
    route: 'unknown',
    requiresVerification: true,
    citationIds: [HAGUE_ART_1.id],
    rationale: bi(
      `${issuingCountry} is not in the shared apostille catalog, so the route cannot be resolved here. It is deliberately not assumed to be consular legalisation: that chain, its fees and its order are set post by post, and guessing it sends someone to the wrong ministry.`,
      `${issuingCountry} no figura en el catálogo compartido de apostilla, por lo que la vía no puede resolverse aquí. No se presume legalización consular a propósito: esa cadena, sus tasas y su orden los fija cada oficina, y suponerla envía a la persona al ministerio equivocado.`,
    ),
  };
}

/** `unknown` is never satisfied, whatever has already been done. */
export function legalisationSatisfied(
  outcome: LegalisationOutcome,
  completed: LegalisationRoute | null,
): boolean {
  if (outcome.route === 'unknown') return false;
  if (outcome.route === 'none') return true;
  return completed === outcome.route;
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

export type TranslationStandard =
  | 'none'
  | 'sworn_traductor_jurado'
  | 'certified_translator'
  | 'unknown';

export interface TranslationOutcome {
  readonly required: boolean;
  readonly acceptedLanguages: readonly string[];
  readonly standard: TranslationStandard;
  readonly rationale: Bi;
  readonly citationIds: readonly string[];
  readonly requiresVerification: boolean;
}

interface TranslationProfile {
  readonly acceptedLanguages: readonly string[];
  readonly standard: TranslationStandard;
  /**
   * Why these are the languages the authority works in. Cited on every outcome,
   * because it is equally the reason a document *does not* need translating.
   */
  readonly languageCitationIds: readonly string[];
  /**
   * Which translator standard applies. Cited only when a translation is
   * actually required — attaching the sworn-translator rule to a document that
   * needs no translation invites the reader to think it does.
   */
  readonly standardCitationIds: readonly string[];
}

const TRANSLATION_PROFILES: Readonly<Record<string, TranslationProfile>> = {
  ES: {
    acceptedLanguages: ['es'],
    standard: 'sworn_traductor_jurado',
    languageCitationIds: [ES_LEY_39_2015_ART_15.id],
    standardCitationIds: [ES_SWORN_TRANSLATOR.id],
  },
  CA: {
    acceptedLanguages: ['en', 'fr'],
    standard: 'certified_translator',
    languageCitationIds: [CA_OFFICIAL_LANGUAGES.id],
    standardCitationIds: [CA_IRCC_TRANSLATION.id],
  },
};

/**
 * Comparison is on the primary subtag, so `es-MX` is not treated as a foreign
 * language in Spain. A Mexican certificate is in Spanish; a portal that
 * demanded it be translated into Spanish would be charging someone for nothing.
 */
function primarySubtag(tag: string): string {
  const head = tag.trim().toLowerCase().split('-')[0];
  return head ?? '';
}

export function translationFor(
  kind: DocumentKind,
  documentLanguage: string,
  receivingCountry: CountryCode,
): TranslationOutcome {
  // A machine-readable travel document is read in the original: its data fields
  // are laid out to ICAO Doc 9303 and the officer reads them directly. Demanding
  // a sworn translation of a Mexican passport for a Spanish filing would be
  // charging someone a fee for nothing, which is worse than a missing rule.
  if (AUTHENTICATION_CLASS[kind] === 'presented_in_original') {
    return {
      required: false,
      acceptedLanguages: [],
      standard: 'none',
      requiresVerification: false,
      citationIds: [],
      rationale: bi(
        'Inspected in the original. A machine-readable travel document carries its data in the standard fields defined by ICAO Doc 9303, and this portal does not treat it as a document requiring translation.',
        'Se examina el original. Un documento de viaje de lectura mecánica presenta sus datos en los campos normalizados del Doc 9303 de la OACI, y este portal no lo trata como documento que requiera traducción.',
      ),
    };
  }

  const key = receivingCountry.toUpperCase();
  const profile = Object.prototype.hasOwnProperty.call(TRANSLATION_PROFILES, key)
    ? TRANSLATION_PROFILES[key]
    : undefined;

  if (profile === undefined) {
    return {
      required: true,
      acceptedLanguages: [],
      standard: 'unknown',
      requiresVerification: true,
      citationIds: [],
      rationale: bi(
        `No language profile is encoded for ${receivingCountry}. The requirement is reported as unresolved rather than absent — an unrecognised receiving state is not evidence that no translation is needed.`,
        `No hay perfil lingüístico codificado para ${receivingCountry}. El requisito se informa como no resuelto y no como inexistente: que el Estado receptor no esté catalogado no prueba que no haga falta traducción.`,
      ),
    };
  }

  const language = primarySubtag(documentLanguage);
  const accepted = profile.acceptedLanguages.includes(language);

  if (accepted) {
    return {
      required: false,
      acceptedLanguages: profile.acceptedLanguages,
      standard: 'none',
      requiresVerification: false,
      citationIds: profile.languageCitationIds,
      rationale: bi(
        `The document is already in a language the receiving authority accepts (${profile.acceptedLanguages.join(', ')}).`,
        `El documento ya está en una lengua que la autoridad receptora admite (${profile.acceptedLanguages.join(', ')}).`,
      ),
    };
  }

  return {
    required: true,
    acceptedLanguages: profile.acceptedLanguages,
    standard: profile.standard,
    requiresVerification: false,
    citationIds: [...profile.languageCitationIds, ...profile.standardCitationIds],
    rationale: bi(
      `The document is in "${language}"; the receiving authority accepts ${profile.acceptedLanguages.join(', ')}. A translation to the required standard is needed.`,
      `El documento está en «${language}»; la autoridad receptora admite ${profile.acceptedLanguages.join(', ')}. Se necesita una traducción con el estándar exigido.`,
    ),
  };
}

export const TRANSLATION_STANDARD_LABEL: Record<TranslationStandard, Bi> = {
  none: bi('No translation needed', 'No se necesita traducción'),
  sworn_traductor_jurado: bi(
    'Sworn translation (traductor-intérprete jurado)',
    'Traducción jurada (traductor-intérprete jurado)',
  ),
  certified_translator: bi(
    'Certified translator, or a translation with an affidavit',
    'Traductor certificado, o traducción con declaración jurada',
  ),
  unknown: bi('Standard not resolved', 'Estándar sin resolver'),
};

export function translationSatisfied(
  outcome: TranslationOutcome,
  completed: TranslationStandard | null,
): boolean {
  if (outcome.standard === 'unknown') return false;
  if (!outcome.required) return true;
  return completed === outcome.standard;
}

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

export interface AcceptanceWindow {
  readonly kind: DocumentKind;
  readonly receivingCountry: string;
  /** Kept in months, never converted to days. The two differ by up to three days. */
  readonly months: number;
  readonly citationId: string;
}

/**
 * Exactly one window is encoded, and that is the point.
 *
 * Every additional entry would be a legal assertion, and each one this portal
 * cannot source is one it must not make. A kind with no window here reports
 * `unknown`, which is rendered in its own bucket — never merged with "valid".
 */
export const ACCEPTANCE_WINDOWS: readonly AcceptanceWindow[] = [
  {
    kind: 'criminal_record',
    receivingCountry: 'ES',
    months: 3,
    citationId: ES_CRIMINAL_RECORD_WINDOW.id,
  },
];

export function acceptanceWindowFor(
  kind: DocumentKind,
  receivingCountry: CountryCode,
): AcceptanceWindow | null {
  const target = receivingCountry.toUpperCase();
  return (
    ACCEPTANCE_WINDOWS.find((w) => w.kind === kind && w.receivingCountry === target) ?? null
  );
}

/**
 * The last day a document issued on `issuedOn` is still inside its window.
 *
 * Closed and inclusive, like every range in Meridian: a three-month window on a
 * certificate issued 2026-04-10 ends on 2026-07-09, not 2026-07-10. The month
 * shift is applied as months and then one day is removed, rather than adding
 * ninety days, because the two disagree and always in the direction that makes
 * a document look fresher than it is.
 */
export function acceptanceWindowEnd(window: AcceptanceWindow, issuedOn: IsoDate): IsoDate {
  return addDays(addMonths(issuedOn, window.months), -1);
}

/** How far the search for the earliest safe issue date ranges around the naive inverse. */
const INVERSE_SEARCH_RADIUS = 15;

/**
 * The earliest date a document may be issued and still be inside its window on
 * the submission date.
 *
 * `addMonths` clamps at month ends, so it is not exactly invertible: the naive
 * inverse can be too permissive by up to three days, which is three days of a
 * fee wasted and a filing date missed. This computes the naive inverse, then
 * scans forward from a provably-too-early lower bound and returns the first
 * date whose window genuinely covers the submission date. Because
 * `acceptanceWindowEnd` is monotone in `issuedOn`, the first hit is the true
 * minimum.
 */
export function earliestSafeIssueDate(
  window: AcceptanceWindow,
  submissionDate: IsoDate,
): IsoDate {
  const naive = addDays(addMonths(submissionDate, -window.months), 1);
  const lowerBound = addDays(naive, -INVERSE_SEARCH_RADIUS);

  for (let offset = 0; offset <= INVERSE_SEARCH_RADIUS * 2; offset++) {
    const candidate = addDays(lowerBound, offset);
    if (compareDates(acceptanceWindowEnd(window, candidate), submissionDate) >= 0) {
      return candidate;
    }
  }

  // Unreachable: the clamping error is bounded by three days and the scan spans
  // thirty. A wrong date returned silently would be worse than a fault, so this
  // throws rather than guessing.
  throw new MeridianError(
    'INVALID_INPUT',
    'could not invert acceptance window within the search radius',
    { window: window.kind, submissionDate },
  );
}

export type FreshnessVerdict = 'valid' | 'expires_before_submission' | 'already_expired' | 'unknown';

export interface FreshnessOutcome {
  readonly verdict: FreshnessVerdict;
  readonly window: AcceptanceWindow | null;
  /** The last day the document is acceptable, when that is knowable. */
  readonly acceptableUntil: IsoDate | null;
  /** Days between the submission date and `acceptableUntil`. Negative is an overrun. */
  readonly marginDays: number | null;
  /** For a windowed document, the earliest issue date that still covers submission. */
  readonly obtainNoEarlierThan: IsoDate | null;
  readonly rationale: Bi;
  readonly citationIds: readonly string[];
}

export interface FreshnessInput {
  readonly kind: DocumentKind;
  readonly issuedOn?: IsoDate;
  readonly expiresOn?: IsoDate;
  readonly receivingCountry: CountryCode;
  readonly submissionDate: IsoDate;
  readonly asOf: IsoDate;
}

/**
 * Project a document's currency forward to the date the file will actually be
 * lodged, not to today.
 *
 * The dedicated `expires_before_submission` verdict exists because a
 * today-only check passes silently on precisely the document that will have
 * aged out by the time anyone looks at the file — which is the failure a
 * checklist is supposed to catch.
 */
export function projectFreshness(input: FreshnessInput): FreshnessOutcome {
  const window = acceptanceWindowFor(input.kind, input.receivingCountry);

  if (window !== null && input.issuedOn !== undefined) {
    const until = acceptanceWindowEnd(window, input.issuedOn);
    const margin = diffDays(input.submissionDate, until);
    const earliest = earliestSafeIssueDate(window, input.submissionDate);
    const verdict: FreshnessVerdict =
      compareDates(until, input.asOf) < 0
        ? 'already_expired'
        : compareDates(until, input.submissionDate) < 0
          ? 'expires_before_submission'
          : 'valid';

    return {
      verdict,
      window,
      acceptableUntil: until,
      marginDays: margin,
      obtainNoEarlierThan: earliest,
      citationIds: [window.citationId],
      rationale: bi(
        `Issued ${input.issuedOn}; a ${window.months}-month window closed and inclusive at both ends ends on ${until}.`,
        `Expedido el ${input.issuedOn}; una ventana de ${window.months} meses, cerrada e inclusiva en ambos extremos, termina el ${until}.`,
      ),
    };
  }

  if (EXPIRY_GOVERNED.includes(input.kind) && input.expiresOn !== undefined) {
    const margin = diffDays(input.submissionDate, input.expiresOn);
    const verdict: FreshnessVerdict =
      compareDates(input.expiresOn, input.asOf) < 0
        ? 'already_expired'
        : compareDates(input.expiresOn, input.submissionDate) < 0
          ? 'expires_before_submission'
          : 'valid';

    return {
      verdict,
      window: null,
      acceptableUntil: input.expiresOn,
      marginDays: margin,
      obtainNoEarlierThan: null,
      citationIds: [],
      rationale: bi(
        `Governed by the expiry date printed on the document (${input.expiresOn}). Residual-validity rules — a passport valid for some months beyond an intended departure — are anchored to a travel date and are not modelled here.`,
        `Se rige por la fecha de caducidad impresa en el documento (${input.expiresOn}). Las reglas de vigencia residual —pasaporte válido varios meses más allá de la salida prevista— se anclan a una fecha de viaje y no se modelan aquí.`,
      ),
    };
  }

  return {
    verdict: 'unknown',
    window: null,
    acceptableUntil: null,
    marginDays: null,
    obtainNoEarlierThan: null,
    citationIds: [],
    rationale: bi(
      'No acceptance window is encoded for this kind of document in this receiving state, and the record carries no expiry date. Its currency has not been checked — which is not the same as having been checked and found acceptable.',
      'No hay ventana de aceptación codificada para este tipo de documento en este Estado receptor, y el registro no contiene fecha de caducidad. Su vigencia no se ha comprobado, lo cual no equivale a haberla comprobado y hallarla correcta.',
    ),
  };
}

export const FRESHNESS_LABEL: Record<FreshnessVerdict, Bi> = {
  valid: bi('Current at the target submission date', 'Vigente en la fecha objetivo de presentación'),
  expires_before_submission: bi(
    'Will have aged out before submission',
    'Habrá caducado antes de la presentación',
  ),
  already_expired: bi('Already out of date', 'Ya está caducado'),
  unknown: bi('Currency not checked', 'Vigencia no comprobada'),
};
