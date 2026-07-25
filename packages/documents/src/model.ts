/**
 * The document model: what a piece of paper is, and what state it is in.
 *
 * A migration file is not a bag of uploads. Every document has three
 * independent axes that a checklist must track separately, because each can
 * fail on its own and each has its own remedy:
 *
 *   1. **Existence and acceptance** — the {@link DocumentStatus} machine. Has
 *      the applicant produced it, has the caseworker looked at it, was it
 *      accepted.
 *   2. **Authentication** — {@link DocumentLegalisation}. A Mexican birth
 *      certificate is a perfectly real document that a Spanish registry will
 *      still refuse without an apostille.
 *   3. **Language** — {@link DocumentTranslation}. Same document, same
 *      apostille, still refused if it arrives in a language the receiving
 *      authority does not read.
 *
 * Collapsing these into a single "is it OK" boolean is the bug that produces a
 * green checklist and a rejected file. They are modelled apart on purpose.
 *
 * Nothing in this module ranks documents, suggests which one to obtain first as
 * a matter of strategy, or predicts an outcome. It restates requirements and
 * records facts. See `@meridian/core`'s `DisclosureClass` for why that line
 * exists and why this package never crosses it.
 */

import type { CountryCode, IsoDate, Result } from '@meridian/core';
import { MeridianError, compareDates, err, isCountryCode, isIsoDate, ok } from '@meridian/core';
import { z } from 'zod';
import type { LanguageTag } from './language.js';
import { isLanguageTag, languageTag } from './language.js';
import type { LegalisationRoute } from './legalisation.js';
import type { TranslatorStandard } from './translation.js';

/**
 * The closed set of documents the current pathway catalog can ask for.
 *
 * Closed on purpose. An open `string` would let a pathway author invent
 * `police_clearance_letter` alongside `criminal_record` and quietly split the
 * freshness rules for the same document across two keys, so a certificate with
 * a three-month acceptance window would be checked against no window at all.
 * Adding a kind is a deliberate edit here plus the routing tables that key off
 * it, and the compiler enumerates every place that needs updating.
 */
export type DocumentKind =
  /** Machine-readable travel document. Presented in original; see `@meridian/mrtd` for the MRZ. */
  | 'passport'
  /** Domestic identity card, e.g. a Mexican INE credential or a Spanish DNI. */
  | 'national_id'
  /** Civil-registry record of birth. In Spain the *certificado literal*, not an extract. */
  | 'birth_certificate'
  | 'marriage_certificate'
  /** Certificate of criminal record, or of its absence. The classic short-window document. */
  | 'criminal_record'
  /** Payslips, tax returns, bank statements — whatever the pathway's means test names. */
  | 'proof_of_income'
  /** Lease, property deed, or *empadronamiento*-style registration of address. */
  | 'proof_of_accommodation'
  | 'health_insurance'
  /** The award itself — diploma, título, degree parchment. */
  | 'degree_certificate'
  /** The record of study behind the award. Assessed separately from the award in most credential checks. */
  | 'academic_transcript'
  /** Licence or registration to practise a regulated profession. */
  | 'professional_licence'
  /** A written offer of employment, before it becomes a contract. */
  | 'employment_offer'
  | 'employment_contract'
  | 'cv'
  /** Passport-standard photograph. Usually subject to a recency rule of its own. */
  | 'photograph'
  /** The authority's own form, completed. */
  | 'application_form'
  /** Evidence the government fee was paid. */
  | 'payment_receipt'
  /** Confirmation that biometrics were enrolled. */
  | 'biometrics_confirmation'
  /** A previously held visa or residence permit, evidencing immigration history. */
  | 'prior_visa'
  | 'travel_itinerary';

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  'passport',
  'national_id',
  'birth_certificate',
  'marriage_certificate',
  'criminal_record',
  'proof_of_income',
  'proof_of_accommodation',
  'health_insurance',
  'degree_certificate',
  'academic_transcript',
  'professional_licence',
  'employment_offer',
  'employment_contract',
  'cv',
  'photograph',
  'application_form',
  'payment_receipt',
  'biometrics_confirmation',
  'prior_visa',
  'travel_itinerary',
];

/**
 * Where a document sits in the acceptance lifecycle.
 *
 * - `required`     — the pathway asks for it; nothing has been produced yet.
 * - `provided`     — the applicant has supplied it.
 * - `under_review` — a caseworker or representative is examining it.
 * - `accepted`     — it satisfies the requirement.
 * - `rejected`     — it does not, and a replacement is needed.
 * - `expired`      — it fell outside its validity or acceptance window.
 */
export type DocumentStatus =
  | 'required'
  | 'provided'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'expired';

export const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'required',
  'provided',
  'under_review',
  'accepted',
  'rejected',
  'expired',
];

/**
 * The legal status transitions, as an explicit allow-list.
 *
 * Two things about this table are deliberate.
 *
 * `expired` is reachable from *every* other state, including `accepted`. That
 * is not defensive coding — it is the single most expensive fact about
 * immigration paperwork. A police certificate accepted by a representative in
 * March is worthless at a June appointment if the receiving state only accepts
 * certificates issued within three months. An `accepted` document that cannot
 * lapse is a model that lies about the risk. See `freshness.ts`.
 *
 * `rejected` and `expired` both lead back to `provided` rather than being
 * terminal, because the remedy for both is the same: obtain a fresh document
 * and supply it again. Sending the applicant back to `required` would erase the
 * history of the first attempt, and that history is what tells a caseworker the
 * translation was the problem the last time.
 *
 * Everything absent from this table is refused rather than tolerated. Silently
 * accepting `required -> accepted` would let a file be marked complete for a
 * document nobody ever saw.
 */
export const DOCUMENT_STATUS_TRANSITIONS: Readonly<
  Record<DocumentStatus, readonly DocumentStatus[]>
> = {
  required: ['provided', 'expired'],
  provided: ['under_review', 'expired'],
  under_review: ['accepted', 'rejected', 'expired'],
  accepted: ['expired'],
  rejected: ['provided', 'expired'],
  expired: ['provided'],
};

/**
 * Statuses in which a document physically exists in the file.
 *
 * Gap analysis treats these as "held". `rejected` and `expired` are excluded on
 * purpose: an expired police certificate is in the folder, and it is exactly as
 * useful as an empty folder.
 */
export const DOCUMENT_PRESENT_STATUSES: readonly DocumentStatus[] = [
  'provided',
  'under_review',
  'accepted',
];

export function isDocumentPresent(status: DocumentStatus): boolean {
  return DOCUMENT_PRESENT_STATUSES.includes(status);
}

/** True when `to` is a permitted successor of `from`. Self-transitions are not permitted. */
export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return DOCUMENT_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * What has been done to authenticate the document for use abroad.
 *
 * `route` is `null` until something has actually been done. It is not
 * `'none'` — `'none'` is a *finding* about the receiving state's requirements
 * (see {@link LegalisationRoute}), while `null` is the absence of any completed
 * act. Conflating them makes an unlegalised document indistinguishable from one
 * that never needed legalising.
 */
export interface DocumentLegalisation {
  /** The route actually completed, or `null` when nothing has been done yet. */
  readonly route: LegalisationRoute | null;
  /** Date the apostille or consular legalisation was issued. */
  readonly completedOn?: IsoDate;
  /**
   * Apostille register number or consular reference, for audit and for the
   * receiving authority's own verification. Never a credential or a login.
   */
  readonly reference?: string;
}

/** No authentication act has been performed. */
export const NOT_LEGALISED: DocumentLegalisation = { route: null };

/**
 * What language the document is in, and what translation exists of it.
 *
 * `sourceLanguage` is mandatory because there is no safe default. Assuming the
 * language from the issuing country is wrong often enough to matter: a Canadian
 * birth certificate may be in French, a Catalan civil-registry extract is not
 * in Castilian, and a Mexican degree awarded by a bilingual institution may be
 * issued in English.
 */
export interface DocumentTranslation {
  readonly sourceLanguage: LanguageTag;
  /** Set once a translation exists. */
  readonly intoLanguage?: LanguageTag;
  /** The standard the translator was held to. See `translation.ts`. */
  readonly standard?: TranslatorStandard;
  readonly completedOn?: IsoDate;
  /**
   * The translator's official number in the public register — a MAEC
   * *traductor-intérprete jurado* number, a provincial association membership
   * number. Public register data, never a credential.
   */
  readonly translatorReference?: string;
}

/** A document in `sourceLanguage` with no translation yet. */
export function untranslated(sourceLanguage: LanguageTag): DocumentTranslation {
  return { sourceLanguage };
}

export interface Document {
  readonly id: string;
  readonly kind: DocumentKind;
  /**
   * The state whose authority issued it. This drives legalisation routing, and
   * it is *not* the applicant's nationality — a Mexican national's police
   * certificate covering three years in Canada is issued by Canada, and routing
   * it as a Mexican document sends them to the wrong ministry.
   */
  readonly issuingCountry: CountryCode;
  /** Date of issue. Required for any acceptance-window check; its absence is itself a gap. */
  readonly issuedOn?: IsoDate;
  /** Printed expiry, where the document carries one. */
  readonly expiresOn?: IsoDate;
  readonly status: DocumentStatus;
  readonly legalisation: DocumentLegalisation;
  readonly translation: DocumentTranslation;
  /**
   * Identifier of the person who last reviewed it. An id, never a name or a
   * licence number — this repository is public and the model is copied into
   * fixtures.
   */
  readonly verifiedBy?: string;
}

/**
 * Apply a status transition, refusing anything the machine does not permit.
 *
 * Returns a `Result` rather than throwing because an illegal transition is an
 * expected outcome of a caseworker clicking the wrong button, not a system
 * fault, and `@meridian/core` reserves exceptions for the latter.
 */
export function transitionDocument(
  document: Document,
  to: DocumentStatus,
  options: { readonly verifiedBy?: string } = {},
): Result<Document, MeridianError> {
  if (document.status === to) {
    return err(
      new MeridianError(
        'DOCUMENT_INVALID',
        `Document ${document.id} is already ${to}; a transition must change the status.`,
        { documentId: document.id, from: document.status, to },
      ),
    );
  }
  if (!canTransition(document.status, to)) {
    return err(
      new MeridianError(
        'DOCUMENT_INVALID',
        `Illegal document transition ${document.status} -> ${to} for ${document.id}. ` +
          `Permitted from ${document.status}: ${DOCUMENT_STATUS_TRANSITIONS[document.status].join(', ') || 'none'}.`,
        { documentId: document.id, from: document.status, to },
      ),
    );
  }
  const next: Document = { ...document, status: to };
  return ok(options.verifiedBy === undefined ? next : { ...next, verifiedBy: options.verifiedBy });
}

/**
 * True when the document's own printed expiry has passed as of `on`.
 *
 * Closed-interval semantics: a passport expiring on 2026-07-25 is still valid
 * *on* 2026-07-25. Treating the expiry date as exclusive costs an applicant a
 * day at exactly the moment they have none to spare.
 */
export function isPastPrintedExpiry(document: Document, on: IsoDate): boolean {
  return document.expiresOn !== undefined && compareDates(on, document.expiresOn) > 0;
}

const isoDateSchema = z.custom<IsoDate>(isIsoDate, {
  message: 'expected a calendar date in YYYY-MM-DD form',
});

const countryCodeSchema = z.custom<CountryCode>(isCountryCode, {
  message: 'expected an ISO 3166-1 alpha-2 country code',
});

const languageTagSchema = z
  .string()
  .refine(isLanguageTag, { message: 'expected a BCP 47-style language tag' })
  .transform((value): LanguageTag => languageTag(value));

const legalisationRouteSchema = z.enum(['none', 'apostille', 'consular', 'unknown']);

const translatorStandardSchema = z.enum([
  'none',
  'sworn_traductor_jurado',
  'certified_translator',
  'affidavit_translation',
  'perito_traductor',
  'translator_certification',
  'unknown',
]);

/**
 * Schema for a document arriving from outside the engine — an HTTP body, a
 * fixture, a partner import.
 *
 * `.strict()` matters: an unrecognised key is far more likely to be a caller
 * spelling `expiryOn` for `expiresOn` than a harmless extra, and silently
 * dropping it produces a document with no expiry that every freshness check
 * then waves through.
 */
export const documentSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(DOCUMENT_KINDS as [DocumentKind, ...DocumentKind[]]),
    issuingCountry: countryCodeSchema,
    issuedOn: isoDateSchema.optional(),
    expiresOn: isoDateSchema.optional(),
    status: z.enum(DOCUMENT_STATUSES as [DocumentStatus, ...DocumentStatus[]]),
    legalisation: z
      .object({
        route: legalisationRouteSchema.nullable(),
        completedOn: isoDateSchema.optional(),
        reference: z.string().optional(),
      })
      .strict(),
    translation: z
      .object({
        sourceLanguage: languageTagSchema,
        intoLanguage: languageTagSchema.optional(),
        standard: translatorStandardSchema.optional(),
        completedOn: isoDateSchema.optional(),
        translatorReference: z.string().optional(),
      })
      .strict(),
    verifiedBy: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.issuedOn !== undefined &&
      value.expiresOn !== undefined &&
      compareDates(value.issuedOn, value.expiresOn) > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiresOn'],
        message: `expiry ${value.expiresOn} precedes issue date ${value.issuedOn}`,
      });
    }
  });

/**
 * True when `value` carries its own data rather than inheriting it.
 *
 * Schema validation resolves each field with an ordinary property read, which
 * walks the prototype chain, while `.strict()`'s unknown-key check looks only at
 * *own* keys. An object whose fields live on its prototype therefore satisfies
 * both at once — every required field resolves, and there are no own keys to
 * report as unknown. Requiring a plain object closes that, and also rejects
 * arrays and class instances at a boundary where a document is always JSON.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Parse untrusted input into a {@link Document}. This is the boundary entry
 * point; prefer it to using {@link documentSchema} directly.
 *
 * Fails on a document whose expiry precedes its issue date. That combination is
 * always a data error, and left alone it produces a document that is
 * simultaneously fresh and expired depending on which check runs first.
 */
export function parseDocument(input: unknown): Result<Document, MeridianError> {
  if (!isPlainObject(input)) {
    return err(
      new MeridianError(
        'DOCUMENT_INVALID',
        'A document must be a plain object with its own properties.',
        { received: input === null ? 'null' : typeof input },
      ),
    );
  }
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new MeridianError('DOCUMENT_INVALID', 'Document failed validation.', {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      }),
    );
  }
  return ok(parsed.data satisfies Document);
}
