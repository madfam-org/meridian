/**
 * Pairing what a filing needs with what the applicant holds, and routing each
 * pair.
 *
 * The matching is deterministic. Documents are claimed by a requirement in a
 * total order — most recently issued first, then by id — so the checklist is
 * byte-identical whichever order the folder arrives in. A report that reordered
 * itself between two loads is a report nobody can compare against yesterday's.
 *
 * A held document is claimed by at most one requirement. Two Spanish
 * criminal-record certificates do not satisfy a Spanish and a Mexican
 * requirement between them.
 */

import type { IsoDate } from '@meridian/core';
import { compareDates } from '@meridian/core';

import type {
  FreshnessOutcome,
  LegalisationOutcome,
  TranslationOutcome,
} from '@/lib/document-rules';
import {
  legalisationFor,
  legalisationSatisfied,
  projectFreshness,
  translationFor,
  translationSatisfied,
} from '@/lib/document-rules';
import type { DocumentRequirement, DocumentScope, HeldDocument } from '@/lib/sample/documents';

export interface ChecklistItem {
  readonly requirement: DocumentRequirement;
  /** `null` when nothing on file answers this requirement. */
  readonly held: HeldDocument | null;
  readonly legalisation: LegalisationOutcome;
  readonly legalisationDone: boolean;
  readonly translation: TranslationOutcome;
  readonly translationDone: boolean;
  readonly freshness: FreshnessOutcome;
  /** Every citation this item's routing rests on, de-duplicated and sorted. */
  readonly citationIds: readonly string[];
}

export interface Checklist {
  readonly items: readonly ChecklistItem[];
  readonly receivingCountry: string;
  readonly submissionDate: IsoDate;
  readonly asOf: IsoDate;
  readonly missing: readonly ChecklistItem[];
  readonly outOfDate: readonly ChecklistItem[];
  readonly currencyUnchecked: readonly ChecklistItem[];
  readonly awaitingLegalisation: readonly ChecklistItem[];
  readonly awaitingTranslation: readonly ChecklistItem[];
  readonly unverifiedRouting: readonly ChecklistItem[];
  /**
   * True only when every requirement is answered, every route resolved, and
   * every step done. An unresolved route keeps this false on purpose: a file
   * must not read as ready on the strength of a route nobody confirmed.
   */
  readonly complete: boolean;
}

/** Most recently issued first, then by id. Total, so the result never varies. */
function compareHeld(a: HeldDocument, b: HeldDocument): number {
  if (a.issuedOn !== undefined && b.issuedOn !== undefined) {
    const byDate = compareDates(b.issuedOn, a.issuedOn);
    if (byDate !== 0) return byDate;
  } else if (a.issuedOn !== undefined) {
    return -1;
  } else if (b.issuedOn !== undefined) {
    return 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function buildChecklist(
  scope: DocumentScope,
  submissionDate: IsoDate,
  asOf: IsoDate,
): Checklist {
  const pool = [...scope.held].sort(compareHeld);
  const claimed = new Set<string>();

  const items: ChecklistItem[] = scope.requirements.map((requirement) => {
    const match =
      pool.find(
        (doc) =>
          !claimed.has(doc.id) &&
          doc.kind === requirement.kind &&
          doc.issuingCountry === requirement.issuingCountry,
      ) ?? null;
    if (match !== null) claimed.add(match.id);

    const language = match?.language ?? requirement.expectedLanguage;

    const legalisation = legalisationFor(
      requirement.kind,
      requirement.issuingCountry,
      scope.receivingCountry,
    );
    const translation = translationFor(requirement.kind, language, scope.receivingCountry);
    const freshness = projectFreshness({
      kind: requirement.kind,
      issuedOn: match?.issuedOn,
      expiresOn: match?.expiresOn,
      receivingCountry: scope.receivingCountry,
      submissionDate,
      asOf,
    });

    const citationIds = [
      ...new Set([
        ...requirement.citationIds,
        ...legalisation.citationIds,
        ...translation.citationIds,
        ...freshness.citationIds,
      ]),
    ].sort();

    return {
      requirement,
      held: match,
      legalisation,
      // Nothing is legalised or translated until it exists.
      legalisationDone:
        match !== null && legalisationSatisfied(legalisation, match.legalisationDone),
      translation,
      translationDone: match !== null && translationSatisfied(translation, match.translationDone),
      freshness,
      citationIds,
    };
  });

  const missing = items.filter((i) => i.held === null);
  const present = items.filter((i) => i.held !== null);

  const outOfDate = present.filter(
    (i) =>
      i.freshness.verdict === 'already_expired' ||
      i.freshness.verdict === 'expires_before_submission',
  );
  const currencyUnchecked = present.filter((i) => i.freshness.verdict === 'unknown');
  const awaitingLegalisation = present.filter(
    (i) => !i.legalisationDone && i.legalisation.route !== 'unknown',
  );
  const awaitingTranslation = present.filter(
    (i) => !i.translationDone && i.translation.standard !== 'unknown',
  );
  const unverifiedRouting = items.filter(
    (i) =>
      i.legalisation.route === 'unknown' ||
      i.legalisation.requiresVerification ||
      i.translation.standard === 'unknown' ||
      i.translation.requiresVerification,
  );

  const complete =
    missing.length === 0 &&
    outOfDate.length === 0 &&
    awaitingLegalisation.length === 0 &&
    awaitingTranslation.length === 0 &&
    unverifiedRouting.length === 0;

  return {
    items,
    receivingCountry: scope.receivingCountry,
    submissionDate,
    asOf,
    missing,
    outOfDate,
    currencyUnchecked,
    awaitingLegalisation,
    awaitingTranslation,
    unverifiedRouting,
    complete,
  };
}
