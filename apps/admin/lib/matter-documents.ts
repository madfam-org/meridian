/**
 * Document routing for one matter.
 *
 * Three independent questions are asked of every document the firm actually
 * holds, and each is answered by `@meridian/documents` rather than by anything
 * here:
 *
 *  1. **Can the receiving state use it?** `legalisationRoute` decides apostille,
 *     consular chain, nothing, or an honest `unknown`. The `unknown` matters:
 *     `legalisationSatisfied` returns false for it whatever has already been
 *     done, because a route nobody has confirmed is not a route.
 *  2. **Can the receiving authority read it?** `translationRequirement` resolves
 *     the accepted languages and the translator standards, including Spain's
 *     co-official regime where the receiving region changes the answer.
 *  3. **Will it still be current on filing day?** `projectFreshness` is asked
 *     about the *submission* date, not today. A certificate that is fine now and
 *     three weeks out of its window when the file is lodged passes a
 *     today-shaped check and fails the only check that counts.
 *
 * Documents that are not present in the folder — `required`, `rejected`,
 * `expired` — are still routed, because a practitioner needs to know what a
 * replacement will cost in time before ordering it.
 */

import type { IsoDate } from '@meridian/core';
import {
  isDocumentPresent,
  legalisationRoute,
  legalisationSatisfied,
  projectFreshness,
  translationRequirement,
  translationSatisfied,
  type Document,
  type FreshnessProjection,
  type LegalisationRequirement,
  type TranslationRequirement,
} from '@meridian/documents';
import type { MatterRecord } from '@/lib/records';

export interface DocumentRouting {
  readonly document: Document;
  readonly present: boolean;
  readonly legalisation: LegalisationRequirement;
  readonly legalisationSatisfied: boolean;
  readonly translation: TranslationRequirement;
  readonly translationSatisfied: boolean;
  readonly freshness: FreshnessProjection;
  /** True when any leg of the routing needs a human to confirm it before the applicant acts. */
  readonly needsVerification: boolean;
}

export function documentRouting(record: MatterRecord, asOf: IsoDate): DocumentRouting[] {
  const receivingCountry = record.matter.targetJurisdiction;
  const submissionDate = record.targetSubmissionDate ?? asOf;

  return record.documents.map((document): DocumentRouting => {
    const legalisation = legalisationRoute({
      documentKind: document.kind,
      issuingCountry: document.issuingCountry,
      receivingCountry,
      asOf,
    });

    const translation = translationRequirement({
      documentKind: document.kind,
      documentLanguage: document.translation.sourceLanguage,
      receivingCountry,
      ...(record.receivingRegion === undefined ? {} : { receivingRegion: record.receivingRegion }),
      issuingCountry: document.issuingCountry,
    });

    const freshness = projectFreshness({
      document,
      receivingCountry,
      submissionDate,
      asOf,
    });

    return {
      document,
      present: isDocumentPresent(document.status),
      legalisation,
      legalisationSatisfied: legalisationSatisfied(legalisation, document.legalisation.route),
      translation,
      translationSatisfied: translationSatisfied(translation, document.translation),
      freshness,
      needsVerification: legalisation.requiresVerification || translation.requiresVerification,
    };
  });
}

export interface DocumentTotals {
  readonly held: number;
  readonly present: number;
  readonly legalisationOutstanding: number;
  readonly translationOutstanding: number;
  readonly freshnessProblems: number;
  readonly freshnessUnknown: number;
  readonly needsVerification: number;
}

/**
 * Counts, with "unknown" kept apart from "fine".
 *
 * `freshnessUnknown` is deliberately its own number rather than folded into
 * either bucket. A document the catalog records no acceptance window for has not
 * been checked, and rendering unchecked as acceptable is how a console starts
 * lying by omission.
 */
export function documentTotals(routings: readonly DocumentRouting[]): DocumentTotals {
  return {
    held: routings.length,
    present: routings.filter((r) => r.present).length,
    legalisationOutstanding: routings.filter((r) => r.present && !r.legalisationSatisfied).length,
    translationOutstanding: routings.filter((r) => r.present && !r.translationSatisfied).length,
    freshnessProblems: routings.filter(
      (r) =>
        r.present &&
        (r.freshness.verdict === 'already_expired' ||
          r.freshness.verdict === 'expires_before_submission'),
    ).length,
    freshnessUnknown: routings.filter((r) => r.present && r.freshness.verdict === 'unknown').length,
    needsVerification: routings.filter((r) => r.needsVerification).length,
  };
}
