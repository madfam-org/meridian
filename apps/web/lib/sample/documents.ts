/**
 * The documentary side of the worked examples.
 *
 * Two lists per matter: what the filing needs, and what the applicant actually
 * holds. Nothing is matched by hand — `lib/checklist.ts` pairs them and routes
 * each pair through the rules in `lib/document-rules.ts`.
 *
 * **Which documents a filing needs is not encoded from a cited source here.**
 * Meridian encodes the *routing* rules — whether a document needs an apostille,
 * whether it needs a sworn translation, how long it stays current — and every
 * one of those decisions carries a citation. The list of items an office asks
 * for is set by that office's own published checklist, which this build does
 * not encode, so the requirements below come from the worked example. A few
 * carry a citation where one genuinely bears on them; most do not, and the page
 * says so rather than dressing an invented list in borrowed authority.
 *
 * No document number, reference or holder detail appears anywhere in this file.
 * This repository is public.
 */

import type { CountryCode, IsoDate } from '@meridian/core';

import { bi, type Bi } from '@/lib/i18n';
import type { DocumentKind, LegalisationRoute, TranslationStandard } from '@/lib/document-rules';

import { c, d } from './common';

export interface HeldDocument {
  readonly id: string;
  readonly kind: DocumentKind;
  readonly issuingCountry: CountryCode;
  /** BCP-47 tag. Compared on the primary subtag, so `es-MX` counts as Spanish. */
  readonly language: string;
  readonly issuedOn?: IsoDate;
  readonly expiresOn?: IsoDate;
  /** Which authentication chain has actually been completed, if any. */
  readonly legalisationDone: LegalisationRoute | null;
  readonly translationDone: TranslationStandard | null;
}

export interface DocumentRequirement {
  readonly key: string;
  readonly kind: DocumentKind;
  readonly issuingCountry: CountryCode;
  /** The language the document is expected to be in, used before one is held. */
  readonly expectedLanguage: string;
  /** What this item is for, in plain language. */
  readonly criterion: Bi;
  /** Only where a provision genuinely bears on the requirement. Often empty. */
  readonly citationIds: readonly string[];
}

export interface DocumentScope {
  readonly receivingCountry: CountryCode;
  readonly requirements: readonly DocumentRequirement[];
  readonly held: readonly HeldDocument[];
}

// ---------------------------------------------------------------------------
// Matter 1 — nationality filing in Spain
// ---------------------------------------------------------------------------

const esScope: DocumentScope = {
  receivingCountry: c('ES'),
  requirements: [
    {
      key: 'es-passport',
      kind: 'passport',
      issuingCountry: c('MX'),
      expectedLanguage: 'es',
      criterion: bi(
        'Establishes identity and the nationality the application is made under.',
        'Acredita la identidad y la nacionalidad bajo la que se solicita.',
      ),
      citationIds: [],
    },
    {
      key: 'es-birth-certificate',
      kind: 'birth_certificate',
      issuingCountry: c('MX'),
      expectedLanguage: 'es',
      criterion: bi(
        'Establishes filiation and the particulars that will be entered in the Civil Registry.',
        'Acredita la filiación y los datos que se inscribirán en el Registro Civil.',
      ),
      citationIds: [],
    },
    {
      key: 'es-criminal-record-mx',
      kind: 'criminal_record',
      issuingCountry: c('MX'),
      expectedLanguage: 'es',
      criterion: bi(
        'Evidence toward good civic conduct. A clear certificate is evidence, not the whole of the test.',
        'Prueba de buena conducta cívica. Un certificado sin antecedentes es prueba, no agota la valoración.',
      ),
      citationIds: ['es-cc-art-22-4'],
    },
    {
      key: 'es-criminal-record-es',
      kind: 'criminal_record',
      issuingCountry: c('ES'),
      expectedLanguage: 'es',
      criterion: bi(
        'The Spanish certificate is required alongside the one from the country of origin.',
        'El certificado español se exige junto con el del país de origen.',
      ),
      citationIds: ['es-cc-art-22-4'],
    },
    {
      key: 'es-padron',
      kind: 'proof_of_accommodation',
      issuingCountry: c('ES'),
      expectedLanguage: 'es',
      criterion: bi(
        'Evidence of residence in the municipality during the qualifying period.',
        'Prueba de residencia en el municipio durante el periodo computable.',
      ),
      citationIds: ['es-cc-art-22-3'],
    },
    {
      key: 'es-application-form',
      kind: 'application_form',
      issuingCountry: c('ES'),
      expectedLanguage: 'es',
      criterion: bi(
        'The application itself, completed and signed.',
        'La propia solicitud, cumplimentada y firmada.',
      ),
      citationIds: [],
    },
  ],
  held: [
    {
      id: 'doc-es-01',
      kind: 'passport',
      issuingCountry: c('MX'),
      language: 'es',
      issuedOn: d('2023-05-13'),
      expiresOn: d('2033-05-12'),
      legalisationDone: null,
      translationDone: null,
    },
    {
      id: 'doc-es-02',
      kind: 'birth_certificate',
      issuingCountry: c('MX'),
      language: 'es',
      issuedOn: d('2026-05-04'),
      legalisationDone: 'apostille',
      translationDone: null,
    },
    {
      // Issued 2026-04-10. Under a three-month window closed at both ends it
      // stopped being current on 2026-07-09, sixteen days before the evaluation
      // date. This is the document the checklist exists to catch.
      id: 'doc-es-03',
      kind: 'criminal_record',
      issuingCountry: c('MX'),
      language: 'es',
      issuedOn: d('2026-04-10'),
      legalisationDone: 'apostille',
      translationDone: null,
    },
    {
      id: 'doc-es-04',
      kind: 'proof_of_accommodation',
      issuingCountry: c('ES'),
      language: 'es',
      issuedOn: d('2026-07-01'),
      legalisationDone: null,
      translationDone: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Matter 2 — work-permit filing for Canada
// ---------------------------------------------------------------------------

const caScope: DocumentScope = {
  receivingCountry: c('CA'),
  requirements: [
    {
      key: 'ca-passport',
      kind: 'passport',
      issuingCountry: c('MX'),
      expectedLanguage: 'es',
      criterion: bi(
        'Establishes citizenship of a party to the trade agreement.',
        'Acredita la nacionalidad de una parte del tratado comercial.',
      ),
      citationIds: ['ca-cusma-citizenship-requirement'],
    },
    {
      key: 'ca-employment-offer',
      kind: 'employment_offer',
      issuingCountry: c('CA'),
      expectedLanguage: 'en',
      criterion: bi(
        'A written offer from the Canadian employer, describing the position and its duties.',
        'Oferta escrita del empleador canadiense, con la descripción del puesto y sus funciones.',
      ),
      citationIds: ['ca-cusma-annex-16a-appendix-2'],
    },
    {
      key: 'ca-degree',
      kind: 'degree_certificate',
      issuingCountry: c('MX'),
      expectedLanguage: 'es',
      criterion: bi(
        'Evidence that the credentials meet the minimum the treaty appendix sets for the profession.',
        'Prueba de que las credenciales alcanzan el mínimo que el apéndice del tratado fija para la profesión.',
      ),
      citationIds: ['ca-cusma-annex-16a-appendix-2'],
    },
    {
      key: 'ca-transcript',
      kind: 'academic_transcript',
      issuingCountry: c('MX'),
      expectedLanguage: 'es',
      criterion: bi(
        'Supports the degree certificate where the field of study has to be established.',
        'Respalda el título cuando debe acreditarse el campo de estudio.',
      ),
      citationIds: [],
    },
    {
      key: 'ca-application-form',
      kind: 'application_form',
      issuingCountry: c('CA'),
      expectedLanguage: 'en',
      criterion: bi(
        'The work-permit application itself.',
        'La propia solicitud de permiso de trabajo.',
      ),
      citationIds: [],
    },
  ],
  held: [
    {
      id: 'doc-ca-01',
      kind: 'passport',
      issuingCountry: c('MX'),
      language: 'es',
      issuedOn: d('2021-09-01'),
      expiresOn: d('2031-08-30'),
      legalisationDone: null,
      translationDone: null,
    },
    {
      id: 'doc-ca-02',
      kind: 'employment_offer',
      issuingCountry: c('CA'),
      language: 'en',
      issuedOn: d('2026-06-30'),
      legalisationDone: null,
      translationDone: null,
    },
    {
      id: 'doc-ca-03',
      kind: 'degree_certificate',
      issuingCountry: c('MX'),
      language: 'es',
      issuedOn: d('2019-06-28'),
      legalisationDone: null,
      translationDone: null,
    },
  ],
};

const BY_MATTER: Readonly<Record<string, DocumentScope>> = {
  'mtr-sample-es': esScope,
  'mtr-sample-ca': caScope,
};

export function documentScopeFor(matterId: string): DocumentScope | null {
  return Object.prototype.hasOwnProperty.call(BY_MATTER, matterId)
    ? (BY_MATTER[matterId] ?? null)
    : null;
}
