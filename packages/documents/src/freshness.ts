/**
 * Freshness: whether a document will still be accepted on the day it is
 * actually filed.
 *
 * Most documents in a migration file are only accepted within a window of their
 * issue date. The criminal-record certificate is the archetype — the receiving
 * state is not interested in whether the applicant had a clean record last
 * summer, it wants to know about now, so the certificate goes stale on a clock
 * that started the day it was printed.
 *
 * The bug this module exists to prevent is subtle and extremely common: a
 * checklist that asks "is this document valid?" and answers against *today*.
 * Today is not the day that matters. A police certificate issued on 1 March
 * with a three-month window is perfectly valid on 15 April, and worthless at a
 * 20 June consular appointment that was booked in February. A green checklist
 * in April is precisely how that file gets refused in June. So the primary
 * entry point here, {@link projectFreshness}, takes the *submission* date and
 * answers about that date, and the verdict `'expires_before_submission'` exists
 * to name the case that a today-only check cannot see.
 *
 * Two conventions, both chosen in the conservative direction:
 *
 *   - **The window is a closed interval that includes the day of issue.** A
 *     90-day window on a certificate issued 2025-01-01 runs to 2025-03-31, not
 *     2025-04-01. This matches `@meridian/core`'s `DateRange` doctrine and, in
 *     the ambiguous readings, is one day tighter than the alternative. Being a
 *     day early costs nothing; being a day late costs the appointment.
 *   - **Where a source expresses the window in months, it is applied in
 *     months.** "Issued within the last three months" is not "issued within the
 *     last 90 days": from 30 November those differ by two days, and the drift
 *     always falls in the direction of an applicant arriving with a document
 *     that is one day too old. `addMonths` from `@meridian/core` clamps at
 *     month ends the way authorities read it.
 *
 * What is deliberately absent: residual-validity rules of the "passport must be
 * valid for at least three months beyond the intended date of departure" kind.
 * They are a different shape — anchored to a travel date rather than to an
 * issue date — and belong in the pathway that imposes them. Inventing a generic
 * one here would attach a fabricated rule to every passport in the system.
 */

import type { Citation, CountryCode, IsoDate } from '@meridian/core';
import { addDays, addMonths, compareDates, diffDays, isoDate } from '@meridian/core';
import type { Document, DocumentKind } from './model.js';

const D = (value: string): IsoDate => isoDate(value);
const VERIFIED_ON: IsoDate = D('2026-07-25');

/** Whether a window is expressed in days or in calendar months by its source. */
export type WindowUnit = 'days' | 'months';

/**
 * How long a document of a given kind stays acceptable in a given receiving
 * jurisdiction, measured from its date of issue.
 */
export interface AcceptanceWindow {
  readonly kind: DocumentKind;
  readonly receivingCountry: CountryCode;
  /** The unit the source uses. Preserved rather than normalised — see the module note. */
  readonly unit: WindowUnit;
  readonly amount: number;
  readonly citation: Citation;
}

const ircc = (id: string, note: string): Citation => ({
  id,
  kind: 'official_guidance',
  instrument: 'Immigration, Refugees and Citizenship Canada — application instructions',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note,
});

/**
 * Acceptance windows the catalog is prepared to assert.
 *
 * Short on purpose. Every entry here is departmental or consular practice
 * rather than a statutory threshold, which is why all of them are marked
 * `discretionary` — a caseworker reading the output must see that the number is
 * practice and can move. A short table that says `'unknown'` for the rest is
 * worth more than a long one that guesses: a guessed window is not a cautious
 * error, it is a specific wrong date that somebody will book travel around.
 */
export const ACCEPTANCE_WINDOWS: readonly AcceptanceWindow[] = [
  {
    kind: 'criminal_record',
    receivingCountry: 'ES' as CountryCode,
    unit: 'months',
    amount: 3,
    citation: {
      id: 'es-antecedentes-penales-recency-practice',
      kind: 'official_guidance',
      instrument:
        'Spanish consular and Oficina de Extranjería practice on the recency of foreign criminal-record certificates',
      jurisdiction: 'ES',
      verifiedOn: VERIFIED_ON,
      discretionary: true,
      note:
        'Administrative practice, not a statutory threshold. Spanish consular posts and Oficinas de Extranjería commonly require a foreign certificate of criminal record to have been issued within the three months preceding the application, and some posts state six. The window is set post by post and is not published as a single national rule. Three months is recorded here because it is the tighter of the two commonly stated periods and a document that satisfies it satisfies both; confirm the requirement with the specific post before the certificate is ordered.',
    },
  },
  {
    kind: 'criminal_record',
    receivingCountry: 'CA' as CountryCode,
    unit: 'months',
    amount: 6,
    citation: ircc(
      'ca-ircc-police-certificate-recency',
      'Departmental instruction, not statute. IRCC requires a police certificate from the country in which the applicant currently resides to have been issued within the six months before the application is made. Certificates from countries the applicant no longer lives in are treated differently — those must have been issued after the last time they lived there, which is not a recency window at all and is not modelled by this entry. Instructions change without notice; check the current instruction for the specific application.',
    ),
  },
  {
    kind: 'photograph',
    receivingCountry: 'CA' as CountryCode,
    unit: 'months',
    amount: 6,
    citation: ircc(
      'ca-ircc-photo-recency',
      'Departmental instruction, not statute. IRCC photograph specifications require the photograph to have been taken within the six months before it is submitted, and the photographer normally records the date on the back or on the accompanying slip. A photograph with no recorded date cannot be shown to meet this and is refused on that ground alone.',
    ),
  },
  {
    kind: 'photograph',
    receivingCountry: 'US' as CountryCode,
    unit: 'months',
    amount: 6,
    citation: {
      id: 'us-photo-recency',
      kind: 'official_guidance',
      instrument:
        'United States immigration and visa photograph requirements published by USCIS and the Department of State',
      jurisdiction: 'US',
      verifiedOn: VERIFIED_ON,
      discretionary: true,
      note:
        'Published agency requirement rather than a statutory threshold: the photograph must have been taken within the six months before submission, so that it reflects current appearance. Agency photo specifications are revised without notice; confirm against the current requirement for the specific form or visa class.',
    },
  },
];

/**
 * Kinds whose acceptability is governed by the expiry printed on them rather
 * than by an issue-date window.
 *
 * This is a structural claim about how these documents work, not a legal claim
 * about any jurisdiction, which is why it is one list rather than one per
 * country. A passport does not go stale three months after issue; it is valid
 * until the date on its data page.
 */
export const EXPIRY_GOVERNED_KINDS: readonly DocumentKind[] = [
  'passport',
  'national_id',
  'prior_visa',
  'professional_licence',
  'health_insurance',
];

export function acceptanceWindowFor(
  kind: DocumentKind,
  receivingCountry: CountryCode,
): AcceptanceWindow | null {
  const target = receivingCountry.toUpperCase() as CountryCode;
  return (
    ACCEPTANCE_WINDOWS.find((w) => w.kind === kind && w.receivingCountry === target) ?? null
  );
}

/**
 * The last date, inclusive, on which a document issued on `issuedOn` is still
 * inside `window`.
 *
 * Both branches produce a closed endpoint. For days, a 90-day window issued
 * 2025-01-01 ends 2025-03-31 — the day of issue is day one of the ninety. For
 * months, a three-month window issued 2025-01-31 ends 2025-04-29: `addMonths`
 * clamps to 2025-04-30 the way an authority reads "three months from 31
 * January", and the window closes the day before.
 */
export function acceptanceWindowEnd(window: AcceptanceWindow, issuedOn: IsoDate): IsoDate {
  return window.unit === 'days'
    ? addDays(issuedOn, window.amount - 1)
    : addDays(addMonths(issuedOn, window.amount), -1);
}

/**
 * The window resolved to a whole number of days for one specific issue date.
 *
 * A month-expressed window has no fixed length in days — three months from
 * 31 January is 89 days and three months from 31 March is 92 — so this is a
 * function of the issue date rather than a constant. Callers that want a single
 * scalar for display should use this and say which issue date it was computed
 * for; callers making acceptance decisions should use {@link acceptanceWindowEnd}
 * and compare dates, never day counts.
 *
 * Returns `null` when no window is recorded for the kind and jurisdiction. That
 * is not "no window applies" — see {@link projectFreshness}.
 */
export function validityWindowDays(
  kind: DocumentKind,
  receivingCountry: CountryCode,
  issuedOn: IsoDate,
): number | null {
  const window = acceptanceWindowFor(kind, receivingCountry);
  if (window === null) return null;
  return diffDays(issuedOn, acceptanceWindowEnd(window, issuedOn)) + 1;
}

/**
 * The earliest date a document can be issued and still be inside its window on
 * `submissionDate`.
 *
 * This is the number an applicant actually needs. "Get your police certificate"
 * is useless advice in February for a June appointment; "do not order it before
 * 21 March" is the instruction that prevents the whole failure.
 *
 * Computed by inverting the window and then verifying forwards, because
 * `addMonths` clamps at month ends and is therefore not exactly invertible —
 * inverting 31 March by one month gives 28 February, and adding a month back
 * gives 28 March, two days short. The forward walk corrects that in at most a
 * handful of steps and is bounded so a pathological window cannot spin.
 */
export function earliestSafeIssueDate(
  window: AcceptanceWindow,
  submissionDate: IsoDate,
): IsoDate {
  let candidate =
    window.unit === 'days'
      ? addDays(submissionDate, -(window.amount - 1))
      : addMonths(addDays(submissionDate, 1), -window.amount);

  for (let guard = 0; guard < 62; guard++) {
    if (compareDates(acceptanceWindowEnd(window, candidate), submissionDate) >= 0) return candidate;
    candidate = addDays(candidate, 1);
  }
  return candidate;
}

export type FreshnessVerdict =
  /** Inside every applicable limit on the submission date. */
  | 'valid'
  /** Acceptable as of `asOf`, but not on the submission date. The case a today-only check misses. */
  | 'expires_before_submission'
  /** Already outside its limits as of `asOf`; a replacement is needed whatever the submission date. */
  | 'already_expired'
  /**
   * Nothing can be said. No acceptance window is recorded for this kind in this
   * jurisdiction and the document carries no printed expiry, or the dates
   * needed to run the check are missing. Distinct from `'valid'` on purpose:
   * unchecked and checked-and-fine must never render the same.
   */
  | 'unknown';

export interface FreshnessProjection {
  readonly verdict: FreshnessVerdict;
  readonly documentId: string;
  readonly kind: DocumentKind;
  readonly receivingCountry: CountryCode;
  readonly asOf: IsoDate;
  readonly submissionDate: IsoDate;
  /** The window applied, when one is recorded. */
  readonly window: AcceptanceWindow | null;
  /** Last date the document is acceptable — the earlier of window end and printed expiry. */
  readonly acceptableUntil?: IsoDate;
  /** Days from the submission date to `acceptableUntil`. Zero means it lapses that very day; negative is too late. */
  readonly marginDays?: number;
  /** Earliest issue date that would still be inside the window on the submission date. */
  readonly obtainNoEarlierThan?: IsoDate;
  readonly rationale: string;
  readonly citations: readonly Citation[];
}

export interface FreshnessQuery {
  readonly document: Document;
  readonly receivingCountry: CountryCode;
  /** The date the file will actually be lodged. This, not today, is the date that matters. */
  readonly submissionDate: IsoDate;
  /** Today, for distinguishing "already stale" from "will go stale". */
  readonly asOf: IsoDate;
}

/**
 * Project whether a document will still be acceptable on the submission date.
 *
 * The absence of a catalog entry yields `'unknown'`, never `'valid'`. A
 * document nobody has recorded a rule for is a document nobody has checked, and
 * the two must not read the same on a checklist.
 */
export function projectFreshness(query: FreshnessQuery): FreshnessProjection {
  const { document, submissionDate, asOf } = query;
  const receiving = query.receivingCountry.toUpperCase() as CountryCode;
  const window = acceptanceWindowFor(document.kind, receiving);
  const base = {
    documentId: document.id,
    kind: document.kind,
    receivingCountry: receiving,
    asOf,
    submissionDate,
    window,
  } as const;

  const limits: { until: IsoDate; source: string; citations: readonly Citation[] }[] = [];

  if (document.expiresOn !== undefined) {
    limits.push({
      until: document.expiresOn,
      source: `the expiry printed on the document (${document.expiresOn})`,
      citations: [],
    });
  }

  if (window !== null) {
    if (document.issuedOn === undefined) {
      return {
        ...base,
        verdict: 'unknown',
        rationale: `${receiving} applies an acceptance window of ${window.amount} ${window.unit} from issue to this document, but no issue date is recorded, so whether it is inside that window cannot be determined. Record the issue date before the file is lodged.`,
        citations: [window.citation],
      };
    }
    const end = acceptanceWindowEnd(window, document.issuedOn);
    limits.push({
      until: end,
      source: `the ${window.amount}-${window.unit === 'months' ? 'month' : 'day'} acceptance window running from its issue on ${document.issuedOn}, which closes on ${end}`,
      citations: [window.citation],
    });
  }

  if (limits.length === 0) {
    if (EXPIRY_GOVERNED_KINDS.includes(document.kind)) {
      return {
        ...base,
        verdict: 'unknown',
        rationale: `This document's acceptability is governed by the expiry printed on it, and no expiry date is recorded. Record it before the file is lodged; nothing can be projected without it.`,
        citations: [],
      };
    }
    return {
      ...base,
      verdict: 'unknown',
      rationale: `No acceptance window is recorded for a ${document.kind} presented in ${receiving}, and the document carries no printed expiry. Treat this as unverified rather than as unlimited — the absence of a rule in this catalog is not evidence that the receiving authority has none. Confirm with the authority before the file is lodged.`,
      citations: [],
    };
  }

  const binding = limits.reduce((a, b) => (compareDates(a.until, b.until) <= 0 ? a : b));
  const citations = limits.flatMap((l) => l.citations);
  const marginDays = diffDays(submissionDate, binding.until);
  const obtainNoEarlierThan =
    window !== null ? earliestSafeIssueDate(window, submissionDate) : undefined;

  if (compareDates(asOf, binding.until) > 0) {
    return {
      ...base,
      obtainNoEarlierThan,
      verdict: 'already_expired',
      acceptableUntil: binding.until,
      marginDays,
      rationale: `Outside its acceptance period as of ${asOf}: it was acceptable until ${binding.until} by reference to ${binding.source}. A replacement is needed regardless of the submission date.`,
      citations,
    };
  }

  if (compareDates(submissionDate, binding.until) > 0) {
    return {
      ...base,
      obtainNoEarlierThan,
      verdict: 'expires_before_submission',
      acceptableUntil: binding.until,
      marginDays,
      rationale: `Acceptable today (${asOf}) but not on the intended submission date. It is acceptable until ${binding.until} by reference to ${binding.source}, which is ${-marginDays} day(s) before ${submissionDate}. A validity check run against today rather than against the submission date would have passed this document.`,
      citations,
    };
  }

  return {
    ...base,
    obtainNoEarlierThan,
    verdict: 'valid',
    acceptableUntil: binding.until,
    marginDays,
    rationale: `Acceptable on ${submissionDate}, with ${marginDays} day(s) to spare against ${binding.until}, set by ${binding.source}.`,
    citations,
  };
}
