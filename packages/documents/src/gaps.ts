/**
 * Gap analysis: the difference between the checklist and the folder.
 *
 * Four failures put a file on the refusal pile, and they are genuinely
 * independent — a document can be present, apostilled and translated and still
 * fail, or be missing entirely while everything else is immaculate. Reporting
 * them as one "incomplete" flag tells the applicant nothing about what to do
 * next, so they are reported apart:
 *
 *   - **missing** — nothing in the folder answers the requirement.
 *   - **expiring** — present today, outside its window on the day the file is
 *     lodged. This is the one a naive checklist cannot see, and the reason
 *     `targetSubmissionDate` is threaded all the way down here.
 *   - **unlegalised** — present, but without the authentication the receiving
 *     state requires.
 *   - **untranslated** — present and authenticated, in a language the receiving
 *     authority does not accept, or translated by somebody whose work it will
 *     not take.
 *
 * The output is `assessment` under `@meridian/core`'s `DisclosureClass`: the
 * applicant's own documents measured against cited rules, with the arithmetic
 * shown. It says what is absent and why the rule asks for it. It does not say
 * which gap to close first, whether the file is likely to succeed, or whether
 * to file anyway — those are recommendations and predictions, and an unlicensed
 * recommendation to a consumer is the offence `disclosure.ts` exists to prevent.
 */

import type { CountryCode, Disclosable, IsoDate } from '@meridian/core';
import { compareDates, disclosable } from '@meridian/core';
import type { ChecklistItem, DocumentChecklist } from './checklist.js';
import type { FreshnessProjection } from './freshness.js';
import { projectFreshness } from './freshness.js';
import { legalisationSatisfied } from './legalisation.js';
import type { Document, DocumentKind, DocumentStatus } from './model.js';
import { isDocumentPresent } from './model.js';
import { translationSatisfied } from './translation.js';

/** Why the requirement is unanswered. */
export type MissingReason =
  /** Nothing of this kind is in the folder at all. */
  | 'not_provided'
  /** A document of this kind is held, but issued by a different state, so it routes differently and does not answer this line. */
  | 'wrong_issuing_country'
  /** Held and refused by the reviewer. */
  | 'rejected'
  /** Held but lapsed. Physically present, evidentially worthless. */
  | 'expired';

export interface MissingDocument {
  readonly itemId: string;
  readonly requirementKey: string;
  readonly kind: DocumentKind;
  readonly issuingCountry: CountryCode;
  readonly optional: boolean;
  readonly reason: MissingReason;
  /** The criterion the missing document evidences. */
  readonly criterion: string;
  readonly citationIds: readonly string[];
  /** Set when a document of the right kind was found but does not answer the requirement. */
  readonly heldDocumentId?: string;
  readonly detail: string;
}

export interface ExpiringDocument {
  readonly itemId: string;
  readonly documentId: string;
  readonly kind: DocumentKind;
  readonly projection: FreshnessProjection;
}

export interface UnlegalisedDocument {
  readonly itemId: string;
  readonly documentId: string;
  readonly kind: DocumentKind;
  readonly requiredRoute: string;
  readonly completedRoute: string | null;
  readonly detail: string;
  readonly citationIds: readonly string[];
}

export interface UntranslatedDocument {
  readonly itemId: string;
  readonly documentId: string;
  readonly kind: DocumentKind;
  readonly sourceLanguage: string;
  readonly acceptedLanguages: readonly string[];
  readonly acceptedStandards: readonly string[];
  readonly detail: string;
  readonly citationIds: readonly string[];
}

export interface UnverifiedRouting {
  readonly itemId: string;
  readonly kind: DocumentKind;
  readonly detail: string;
  readonly citationIds: readonly string[];
}

export interface DocumentGaps {
  readonly matterId: string;
  readonly pathwayId: string;
  readonly asOf: IsoDate;
  /** The date the projections were run against. Falls back to `asOf` when no target is known. */
  readonly submissionDate: IsoDate;
  /** True when `submissionDate` is just `asOf` — the projections then speak only to today. */
  readonly submissionDateAssumed: boolean;
  readonly missing: readonly MissingDocument[];
  readonly expiring: readonly ExpiringDocument[];
  readonly unlegalised: readonly UnlegalisedDocument[];
  readonly untranslated: readonly UntranslatedDocument[];
  /** Documents held whose freshness could not be projected at all. Not the same as fresh. */
  readonly freshnessUnknown: readonly ExpiringDocument[];
  /** Items whose routing a human must confirm before the applicant acts on it. */
  readonly unverifiedRouting: readonly UnverifiedRouting[];
  /** Item ids with nothing outstanding. */
  readonly satisfied: readonly string[];
  /** True when every non-optional item is satisfied and no routing is unverified. */
  readonly complete: boolean;
}

export interface GapQuery {
  readonly checklist: DocumentChecklist;
  readonly held: readonly Document[];
  readonly asOf: IsoDate;
  /** Overrides the checklist's target date. Falls back to the checklist's, then to `asOf`. */
  readonly targetSubmissionDate?: IsoDate;
}

const STATUS_PREFERENCE: Readonly<Record<DocumentStatus, number>> = {
  accepted: 4,
  under_review: 3,
  provided: 2,
  rejected: 1,
  expired: 1,
  required: 0,
};

/**
 * Pick the document that best answers an item.
 *
 * The comparator is a total order with an id tie-break, so the answer does not
 * depend on the order the caller happened to pass the folder in. That is not
 * fussiness: an applicant who re-uploads a replacement certificate must get the
 * same gap report whether the importer appended it or prepended it, and a
 * report that flips between runs destroys any trust in the rest of it.
 *
 * Later issue dates win among equally-accepted candidates because a fresher
 * certificate is the one that survives to the appointment.
 */
function bestMatch(candidates: readonly Document[]): Document | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const byStatus = STATUS_PREFERENCE[b.status] - STATUS_PREFERENCE[a.status];
    if (byStatus !== 0) return byStatus;
    if (a.issuedOn !== undefined && b.issuedOn !== undefined) {
      const byIssue = compareDates(b.issuedOn, a.issuedOn);
      if (byIssue !== 0) return byIssue;
    } else if (a.issuedOn !== b.issuedOn) {
      return a.issuedOn === undefined ? 1 : -1;
    }
    return a.id.localeCompare(b.id);
  });
  return sorted[0] ?? null;
}

function missingFor(
  item: ChecklistItem,
  reason: MissingReason,
  detail: string,
  heldDocumentId?: string,
): MissingDocument {
  return {
    itemId: item.id,
    requirementKey: item.requirementKey,
    kind: item.kind,
    issuingCountry: item.issuingCountry,
    optional: item.optional,
    reason,
    criterion: item.criterion,
    citationIds: item.citations.map((c) => c.id),
    heldDocumentId,
    detail,
  };
}

/**
 * Compare a checklist against the documents actually held.
 *
 * Every projection runs against the submission date, not against `asOf`. When
 * no target date is available the two collapse and `submissionDateAssumed` says
 * so, because a caller that reads "valid" without noticing which date it was
 * valid on is exactly the reader this whole module is written for.
 */
export function analyseGaps(query: GapQuery): Disclosable<DocumentGaps> {
  const { checklist, held, asOf } = query;
  const target = query.targetSubmissionDate ?? checklist.targetSubmissionDate;
  const submissionDate = target ?? asOf;

  const missing: MissingDocument[] = [];
  const expiring: ExpiringDocument[] = [];
  const unlegalised: UnlegalisedDocument[] = [];
  const untranslated: UntranslatedDocument[] = [];
  const freshnessUnknown: ExpiringDocument[] = [];
  const unverifiedRouting: UnverifiedRouting[] = [];
  const satisfied: string[] = [];

  for (const item of checklist.items) {
    if (item.requiresVerification) {
      unverifiedRouting.push({
        itemId: item.id,
        kind: item.kind,
        detail:
          item.legalisation.requiresVerification && item.translation.requiresVerification
            ? `${item.legalisation.rationale} ${item.translation.rationale}`
            : item.legalisation.requiresVerification
              ? item.legalisation.rationale
              : item.translation.rationale,
        citationIds: item.citations.map((c) => c.id),
      });
    }

    const exactMatches = held.filter(
      (d) => d.kind === item.kind && d.issuingCountry === item.issuingCountry,
    );
    const match = bestMatch(exactMatches);

    if (match === null) {
      const wrongCountry = bestMatch(held.filter((d) => d.kind === item.kind));
      if (wrongCountry !== null) {
        missing.push(
          missingFor(
            item,
            'wrong_issuing_country',
            `The folder holds a ${item.kind.replace(/_/g, ' ')} issued by ${wrongCountry.issuingCountry}, but this requirement is for one issued by ${item.issuingCountry}. Documents from different states take different legalisation routes, so one cannot stand in for the other.`,
            wrongCountry.id,
          ),
        );
      } else {
        missing.push(
          missingFor(
            item,
            'not_provided',
            `No ${item.kind.replace(/_/g, ' ')} issued by ${item.issuingCountry} is held.`,
          ),
        );
      }
      continue;
    }

    if (!isDocumentPresent(match.status)) {
      missing.push(
        missingFor(
          item,
          match.status === 'rejected' ? 'rejected' : 'expired',
          match.status === 'rejected'
            ? `The ${item.kind.replace(/_/g, ' ')} on file was rejected; a replacement is needed.`
            : `The ${item.kind.replace(/_/g, ' ')} on file is recorded as expired; a replacement is needed.`,
          match.id,
        ),
      );
      continue;
    }

    let outstanding = false;

    const projection = projectFreshness({
      document: match,
      receivingCountry: checklist.receivingCountry,
      submissionDate,
      asOf,
    });
    if (projection.verdict === 'expires_before_submission' || projection.verdict === 'already_expired') {
      expiring.push({ itemId: item.id, documentId: match.id, kind: item.kind, projection });
      outstanding = true;
    } else if (projection.verdict === 'unknown') {
      freshnessUnknown.push({ itemId: item.id, documentId: match.id, kind: item.kind, projection });
    }

    if (!legalisationSatisfied(item.legalisation, match.legalisation.route)) {
      unlegalised.push({
        itemId: item.id,
        documentId: match.id,
        kind: item.kind,
        requiredRoute: item.legalisation.route,
        completedRoute: match.legalisation.route,
        detail:
          item.legalisation.route === 'unknown'
            ? `The legalisation route is not established, so nothing already done can be confirmed as sufficient. ${item.legalisation.rationale}`
            : `Requires ${item.legalisation.route}; the document records ${match.legalisation.route ?? 'no completed legalisation'}.`,
        citationIds: item.legalisation.citations.map((c) => c.id),
      });
      outstanding = true;
    }

    if (!translationSatisfied(item.translation, match.translation)) {
      untranslated.push({
        itemId: item.id,
        documentId: match.id,
        kind: item.kind,
        sourceLanguage: match.translation.sourceLanguage,
        acceptedLanguages: [...item.translation.acceptedLanguages],
        acceptedStandards: [...item.translation.acceptedStandards],
        detail:
          match.translation.intoLanguage === undefined
            ? `No translation is recorded. ${item.translation.rationale}`
            : `The recorded translation is into ${match.translation.intoLanguage} to the ${match.translation.standard ?? 'unrecorded'} standard, which does not satisfy the requirement. ${item.translation.rationale}`,
        citationIds: item.translation.citations.map((c) => c.id),
      });
      outstanding = true;
    }

    if (!outstanding) satisfied.push(item.id);
  }

  const outstandingRequired = checklist.items.some((item) => {
    if (item.optional) return false;
    return !satisfied.includes(item.id);
  });

  const value: DocumentGaps = {
    matterId: checklist.matterId,
    pathwayId: checklist.pathwayId,
    asOf,
    submissionDate,
    submissionDateAssumed: target === undefined,
    missing,
    expiring,
    unlegalised,
    untranslated,
    freshnessUnknown,
    unverifiedRouting,
    satisfied,
    complete: !outstandingRequired && unverifiedRouting.length === 0,
  };

  const citationIds = [
    ...new Set(checklist.items.flatMap((i) => i.citations.map((c) => c.id))),
  ];
  return disclosable('assessment', value, citationIds);
}
