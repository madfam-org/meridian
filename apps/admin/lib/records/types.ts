/**
 * What the console reads.
 *
 * These records wrap the `@meridian/core` domain types rather than replacing
 * them. `MatterRecord.matter` is a real `Matter`, `RepresentativeRecord.credential`
 * is a real `AuthorizedRepresentative` — the same object `canRelease` reads —
 * and the extra fields around them are the firm's own bookkeeping: a file
 * reference, a display name, the regulator that can suspend a licence.
 *
 * The split matters. If the console kept its own parallel notion of "is this
 * representative live", the roster page and the advice gate would drift, and the
 * drift would show up as a page saying a credential is fine while the engine
 * quietly downgrades every output that representative was supposed to authorise.
 * There is one source of truth for that question and it is `canRelease`.
 */

import type {
  AuthorizedRepresentative,
  CountryCode,
  DisclosureClass,
  IsoDate,
  Matter,
  Task,
} from '@meridian/core';
import type { Document, LanguageTag } from '@meridian/documents';

/** A person on the firm's roster who can be accountable for regulated advice. */
export interface RepresentativeRecord {
  /**
   * The credential as the advice gate sees it. Passed to `canRelease` unchanged;
   * the console never re-implements the expiry or jurisdiction test.
   */
  readonly credential: AuthorizedRepresentative;
  readonly displayName: string;
  /** The body that issued the standing and can suspend it. Named, not abbreviated. */
  readonly regulator: string;
  /** Where the licence can be checked. A name, not a URL — no guessed links. */
  readonly publicRegister: string;
  /** Free text the firm keeps against the roster entry. */
  readonly note?: string;
}

export interface ApplicantRecord {
  readonly id: string;
  /** The firm's own reference for the person, distinct from the matter reference. */
  readonly reference: string;
  readonly familyName: string;
  readonly givenNames: string;
  readonly nationalities: readonly CountryCode[];
  readonly dateOfBirth?: IsoDate;
}

/**
 * A matter as the console holds it: the core `Matter`, plus the working context
 * the caseload view needs to tell a practitioner what is on fire.
 */
export interface MatterRecord {
  readonly matter: Matter;
  /** The firm's file reference, as it appears on correspondence. */
  readonly reference: string;
  /** One line describing the objective, in the firm's own words. */
  readonly title: string;
  /**
   * When the applicant's *current* permission to be where they are runs out.
   *
   * This is the single most time-critical date on most files and it is not the
   * same thing as a document expiry: a residence card can be valid while the
   * underlying authorisation has lapsed, and vice versa. Absent when the
   * applicant is outside the target state, or when the firm has not established it.
   */
  readonly statusExpiresOn?: IsoDate;
  /** When the file is expected to be lodged. Drives every freshness projection. */
  readonly targetSubmissionDate?: IsoDate;
  readonly tasks: readonly Task[];
  readonly documents: readonly Document[];
  /**
   * ISO 3166-2 code of the sub-national unit whose organ receives the file, where
   * it changes the answer. Spain's co-official language regime is the live case.
   */
  readonly receivingRegion?: string;
  /** The language the applicant's own documents are in unless a document says otherwise. */
  readonly defaultDocumentLanguage: LanguageTag;
}

/**
 * What kind of thing happened. A closed set, because an audit trail whose event
 * vocabulary grows freely cannot be filtered, aggregated, or reasoned about six
 * months later when somebody asks what the firm knew and when.
 */
export type AuditEventKind =
  | 'matter_opened'
  | 'phase_advanced'
  | 'status_changed'
  | 'representative_assigned'
  | 'representative_unassigned'
  | 'credential_verified'
  | 'task_completed'
  | 'document_received'
  | 'document_status_changed'
  | 'disclosure_released'
  | 'disclosure_downgraded'
  | 'catalog_review_recorded'
  | 'integration_refused';

export type AuditActorKind = 'representative' | 'staff' | 'applicant' | 'platform' | 'authority';

/**
 * The disclosure decision attached to an event, when the event was one.
 *
 * A downgrade is recorded with both the class that was produced and the class
 * that was actually released, plus the gate's own reason string. Recording only
 * the released class would lose the fact that a recommendation existed and was
 * withheld, which is exactly the fact a regulator would ask about.
 */
export interface AuditDisclosure {
  readonly produced: DisclosureClass;
  readonly released: DisclosureClass;
  readonly audience: string;
  readonly reason?: string;
  readonly citationIds?: readonly string[];
}

/**
 * One entry in the append-only trail.
 *
 * Time is carried as a civil date plus a wall-clock `HH:MM` in the recording
 * tenant's own timezone, named explicitly. It is deliberately not an instant:
 * the rest of Meridian refuses `Date` for exactly the reason that an instant
 * silently re-renders as a different calendar day depending on where it is read,
 * and an audit entry that moves between days under the reader's feet is worse
 * than useless.
 */
export interface AuditRecord {
  readonly id: string;
  readonly on: IsoDate;
  /** `HH:MM`, 24-hour, in `timezone`. Ordering within a day only. */
  readonly at: string;
  /** IANA zone the wall-clock time is expressed in, e.g. `Europe/Madrid`. */
  readonly timezone: string;
  readonly kind: AuditEventKind;
  readonly actorId: string;
  readonly actorKind: AuditActorKind;
  /** `null` for events that are not about one file — a catalog review, an adapter refusal. */
  readonly matterId: string | null;
  /** One line. Rendered verbatim. */
  readonly summary: string;
  /** Optional expansion, for the detail view. */
  readonly detail?: string;
  readonly disclosure?: AuditDisclosure;
}

/**
 * The firm the console is operating as.
 *
 * `Tenant` from core carries the representatives that `representativeFor` reads;
 * the roster records here carry the same credentials with the firm's own
 * metadata around them, and `records.ts` builds the tenant from the roster so
 * the two cannot disagree.
 */
export interface FirmRecords {
  readonly tenantId: string;
  readonly tenantDisplayName: string;
  readonly homeJurisdiction: string;
  /** Which named dataset produced these records. Rendered so nobody mistakes it for live data. */
  readonly datasetId: string;
  readonly datasetDescription: string;
  readonly representatives: readonly RepresentativeRecord[];
  readonly applicants: readonly ApplicantRecord[];
  readonly matters: readonly MatterRecord[];
  readonly audit: readonly AuditRecord[];
}
