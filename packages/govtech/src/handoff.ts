/**
 * Assisted handoff — the pattern that replaces impersonation.
 *
 * An `AssistedHandoff` is a structured package the *user* carries to the
 * government portal themselves. It names the exact destination, the ordered
 * steps, which of their own documents they will need, the field values Meridian
 * has already computed for them to copy, and what they must bring back so the
 * matter can continue.
 *
 * This is not a consolation prize for the automation we declined to build. It is
 * better, for three reasons that hold even if credential custody were lawful and
 * safe:
 *
 *   1. **The legal act stays theirs.** They authenticate, they declare, they
 *      submit. Nobody is later explaining why a declaration in their name was
 *      made by a server.
 *   2. **The audit trail lands in their account**, on the authority's own
 *      system, where an authority will actually look for it — not only in ours.
 *   3. **It survives the portal changing.** Robotic submission breaks silently
 *      the week a form gains a field. A handoff degrades to a human reading a
 *      slightly different screen, which is a Tuesday rather than an incident.
 *
 * Spanish administrative law arrived at the same answer: Ley 39/2015 art. 12
 * provides for *assistance* in the use of electronic means, and contemplates
 * action on someone's behalf only through designated officials with the person's
 * express recorded consent. This module is that provision expressed as software.
 *
 * @see ES_LEY_39_2015_ART_12
 */

import type { Citation, CountryCode, DisclosureClass, IsoDate, Result } from '@meridian/core';
import { MeridianError, err, isIsoDate, maxDisclosureOf, ok } from '@meridian/core';
import type { CredentialFree } from './credential-guard.js';
import { credentialNameRule, guardCredentialFree } from './credential-guard.js';

/** Who performs a step. Never `platform` — that is the entire point of the pattern. */
export type HandoffActor = 'applicant' | 'representative' | 'employer';

/** Where a step happens, which determines what the user has to physically plan for. */
export type HandoffChannel = 'online' | 'in_person' | 'video_call' | 'by_post' | 'by_telephone';

export interface HandoffStepInput {
  readonly title: string;
  readonly detail: string;
  readonly actor: HandoffActor;
  readonly channel: HandoffChannel;
  /** Ids of documents from the same handoff that this step consumes. */
  readonly requiresDocumentIds?: readonly string[];
  readonly citationIds?: readonly string[];
}

export interface HandoffStep {
  /** 1-based and contiguous. Assigned by the builder so a caller cannot mis-number them. */
  readonly ordinal: number;
  readonly title: string;
  readonly detail: string;
  readonly actor: HandoffActor;
  readonly channel: HandoffChannel;
  readonly requiresDocumentIds: readonly string[];
  readonly citationIds: readonly string[];
}

export type DocumentOrigin =
  | 'applicant'
  | 'home_authority'
  | 'destination_authority'
  | 'employer'
  | 'meridian';

export interface HandoffDocument {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly origin: DocumentOrigin;
  /**
   * Whether the original must be presented rather than a copy. Getting this
   * wrong sends someone to an appointment they cannot complete, and appointment
   * capacity is frequently the binding constraint in these processes.
   */
  readonly originalRequired: boolean;
}

/**
 * Where a value on the government form comes from.
 *
 * `computed` is the one that carries regulatory weight: a value Meridian derived
 * from the user's record is their own facts, processed, and it pushes the whole
 * handoff up to `assessment` on the disclosure boundary.
 */
export type FieldSource = 'computed' | 'user_record' | 'user_supplies';

export interface HandoffField {
  readonly id: string;
  /** The label as it appears on the portal, so the user can find it by eye. */
  readonly label: string;
  /**
   * The value to type or paste. Empty for `user_supplies`, where the user
   * provides something we do not hold — and must never hold, in the case of
   * their authentication credential.
   */
  readonly value: string;
  readonly source: FieldSource;
  readonly note?: string;
}

export type CaptureKind =
  | 'reference_number'
  | 'document_upload'
  | 'appointment_datetime'
  | 'confirmation_screenshot'
  | 'payment_receipt';

/**
 * What the user brings back.
 *
 * Mandatory, and at least one is required. A handoff that sends someone off and
 * captures nothing on return has broken the chain of custody of the matter: the
 * platform no longer knows what happened, which is the failure mode people
 * assume automation prevents and manual process causes. Capturing the reference
 * number is what makes the handoff auditable.
 */
export interface HandoffCapture {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: CaptureKind;
}

export interface AssistedHandoff {
  readonly id: string;
  readonly adapterId: string;
  readonly jurisdiction: CountryCode;
  readonly title: string;
  readonly purpose: string;
  /** Verified https, on an allowlisted official host, with no query string. */
  readonly destinationUrl: string;
  readonly generatedOn: IsoDate;
  /**
   * Derived, never supplied: `assessment` when any field was computed from the
   * user's own record, `information` otherwise. Never `advice` — a handoff
   * documents the procedure for a route already chosen, and does not rank routes
   * or predict outcomes.
   */
  readonly classification: DisclosureClass;
  readonly steps: readonly HandoffStep[];
  readonly documents: readonly HandoffDocument[];
  readonly fields: readonly HandoffField[];
  readonly bringBack: readonly HandoffCapture[];
  readonly citations: readonly Citation[];
  readonly caveats: readonly string[];
}

export interface HandoffInput {
  readonly id: string;
  readonly adapterId: string;
  readonly jurisdiction: CountryCode;
  readonly title: string;
  readonly purpose: string;
  readonly destinationUrl: string;
  readonly generatedOn: IsoDate;
  readonly steps: readonly HandoffStepInput[];
  readonly documents: readonly HandoffDocument[];
  readonly fields: readonly HandoffField[];
  readonly bringBack: readonly HandoffCapture[];
  readonly citations: readonly Citation[];
  readonly caveats?: readonly string[];
}

/* -------------------------------------------------------------------------- */
/* Destination validation                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Hosts a handoff may point at, by jurisdiction.
 *
 * Deliberately narrow, and an allowlist rather than a pattern. Migration is one
 * of the most heavily phished domains there is — every one of these procedures
 * has a swarm of lookalike "official application" sites charging for a free
 * form — and a handoff is precisely a document telling a user "go here and
 * authenticate". A contributor who pastes an aggregator URL into an adapter gets
 * a build failure rather than a user on a spoofed login page.
 *
 * Subdomains of a listed host are accepted; anything else is not. Expanding this
 * list is a deliberate act, which is the intent.
 */
const OFFICIAL_HOSTS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ES: Object.freeze([
    'clave.gob.es',
    'administracion.gob.es',
    'agenciatributaria.gob.es',
    'mjusticia.gob.es',
    'justicia.gob.es',
    'exteriores.gob.es',
    'inclusion.gob.es',
    'policia.gob.es',
    'seg-social.gob.es',
    'boe.es',
  ]),
  CA: Object.freeze(['canada.ca', 'cic.gc.ca', 'gc.ca', 'justice.gc.ca']),
});

/**
 * Parsed without the `URL` global on purpose: this package compiles against
 * `lib: ES2022` with no DOM or Node types, and a domain package that reaches for
 * ambient globals is a package that breaks when someone runs it somewhere new.
 *
 * The host character class excludes `@`, so the classic userinfo spoof —
 * `https://clave.gob.es@evil.example/` — fails to parse rather than passing an
 * allowlist check on the wrong half of the string.
 */
const HTTPS_URL_RE =
  /^https:\/\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)(?::\d{1,5})?(\/[^\s?#]*)?$/i;

export interface DestinationCheck {
  readonly valid: boolean;
  readonly host: string | null;
  readonly reason: string | null;
}

/** Whether `host` is, or is a subdomain of, an allowlisted official host for `jurisdiction`. */
export function isOfficialGovernmentHost(jurisdiction: string, host: string): boolean {
  const allowed = OFFICIAL_HOSTS[jurisdiction.toUpperCase()];
  if (allowed === undefined) return false;
  const normalised = host.toLowerCase().replace(/\.$/, '');
  return allowed.some((entry) => normalised === entry || normalised.endsWith(`.${entry}`));
}

/**
 * Validate a handoff destination.
 *
 * Rejects, in order: non-https; anything that is not a bare `https://host/path`;
 * a query string; and any host outside the jurisdiction's allowlist.
 *
 * The query-string rule is a privacy rule rather than a security one. A
 * pre-filled destination is exactly where someone will eventually put a passport
 * number or an NIE "to save the user typing", and URLs end up in browser
 * history, referrer headers and proxy logs. Values belong in
 * {@link AssistedHandoff.fields}, which the user copies deliberately.
 */
export function checkDestination(jurisdiction: string, url: string): DestinationCheck {
  if (!url.toLowerCase().startsWith('https://')) {
    return { valid: false, host: null, reason: 'Destination must use https — a handoff sends a user somewhere to authenticate.' };
  }
  if (url.includes('?')) {
    return {
      valid: false,
      host: null,
      reason:
        'Destination must not carry a query string. Pre-filled parameters put the user\'s own data into ' +
        'browser history, referrer headers and proxy logs; put values in the fields list instead.',
    };
  }
  const match = HTTPS_URL_RE.exec(url);
  const host = match?.[1];
  if (match === null || host === undefined) {
    return {
      valid: false,
      host: null,
      reason: 'Destination is not a plain https URL. Embedded credentials, userinfo and fragments are rejected.',
    };
  }
  if (!isOfficialGovernmentHost(jurisdiction, host)) {
    return {
      valid: false,
      host,
      reason:
        `Host ${host.toLowerCase()} is not on the official-source allowlist for ${jurisdiction.toUpperCase()}. ` +
        'Handoffs may only send users to the authority\'s own site.',
    };
  }
  return { valid: true, host: host.toLowerCase(), reason: null };
}

/* -------------------------------------------------------------------------- */
/* Builder                                                                    */
/* -------------------------------------------------------------------------- */

function invalid(message: string, details: Record<string, unknown> = {}): MeridianError {
  return new MeridianError('INVALID_INPUT', message, details);
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

/**
 * Assemble a validated, ordered handoff.
 *
 * Everything checkable is checked here rather than at render time, because a
 * handoff is read by someone standing in a government office with a queue
 * ticket. A dangling document reference discovered at that moment costs them the
 * appointment.
 *
 * The generic parameter carries the structural credential refusal: a caller
 * passing an object with a credential-shaped property anywhere in it fails to
 * compile. {@link guardCredentialFree} then re-checks at runtime, because the
 * common case is input that arrived as JSON and was cast.
 */
export function buildHandoff<T extends HandoffInput>(
  input: T & CredentialFree<T>,
): Result<AssistedHandoff, MeridianError> {
  const guarded = guardCredentialFree(input as HandoffInput);
  if (!guarded.ok) return guarded;

  if (input.id.trim().length === 0) return err(invalid('Handoff id is required.'));
  if (input.title.trim().length === 0) return err(invalid('Handoff title is required.'));
  if (input.purpose.trim().length === 0) {
    return err(invalid('Handoff purpose is required — the user must know what this trip achieves.'));
  }
  if (!isIsoDate(input.generatedOn)) {
    return err(invalid(`Handoff generatedOn is not a valid civil date: ${String(input.generatedOn)}`));
  }

  const destination = checkDestination(input.jurisdiction, input.destinationUrl);
  if (!destination.valid) {
    return err(
      invalid(destination.reason ?? 'Destination rejected.', {
        destinationUrl: input.destinationUrl,
        host: destination.host,
      }),
    );
  }

  if (input.steps.length === 0) {
    return err(invalid('A handoff with no steps is not a handoff.'));
  }
  if (input.citations.length === 0) {
    return err(invalid('A handoff must cite the published procedure it restates.'));
  }
  if (input.bringBack.length === 0) {
    return err(
      invalid(
        'A handoff must capture at least one thing on return. Without it the platform loses track of ' +
          'what happened, which is the failure the pattern exists to prevent.',
      ),
    );
  }

  const documentIds = input.documents.map((d) => d.id);
  const documentDupes = duplicates(documentIds);
  if (documentDupes.length > 0) {
    return err(invalid(`Duplicate document ids: ${documentDupes.join(', ')}.`));
  }
  const fieldDupes = duplicates(input.fields.map((f) => f.id));
  if (fieldDupes.length > 0) {
    return err(invalid(`Duplicate field ids: ${fieldDupes.join(', ')}.`));
  }
  const captureDupes = duplicates(input.bringBack.map((c) => c.id));
  if (captureDupes.length > 0) {
    return err(invalid(`Duplicate capture ids: ${captureDupes.join(', ')}.`));
  }

  const knownDocuments = new Set(documentIds);
  const steps: HandoffStep[] = [];
  for (let i = 0; i < input.steps.length; i++) {
    const raw = input.steps[i];
    if (raw === undefined) continue;
    if (raw.title.trim().length === 0) {
      return err(invalid(`Step ${i + 1} has no title.`));
    }
    const required = raw.requiresDocumentIds ?? [];
    const dangling = required.filter((id) => !knownDocuments.has(id));
    if (dangling.length > 0) {
      return err(
        invalid(
          `Step ${i + 1} ("${raw.title}") requires documents that are not listed in this handoff: ` +
            `${dangling.join(', ')}. The user would arrive without them.`,
          { step: i + 1, dangling },
        ),
      );
    }
    steps.push(
      Object.freeze({
        ordinal: i + 1,
        title: raw.title,
        detail: raw.detail,
        actor: raw.actor,
        channel: raw.channel,
        requiresDocumentIds: Object.freeze([...required]),
        citationIds: Object.freeze([...(raw.citationIds ?? [])]),
      }),
    );
  }

  // A handoff is a place where values are computed, stored and displayed, so a
  // field or capture *named* after a credential is a request to hold one — even
  // though the property names around it (`id`, `label`, `value`) are innocent and
  // the payload scanner passes it. If a user genuinely has to type their own PIN
  // into the authority's site, that belongs in a step's prose, where it is an
  // instruction, and not in a field, where it is a slot waiting to be filled.
  const namedThings: readonly { readonly kind: string; readonly id: string; readonly label: string }[] = [
    ...input.fields.map((f) => ({ kind: 'field', id: f.id, label: f.label })),
    ...input.bringBack.map((c) => ({ kind: 'capture', id: c.id, label: c.title })),
    ...input.documents.map((d) => ({ kind: 'document', id: d.id, label: d.title })),
  ];
  for (const thing of namedThings) {
    const rule = credentialNameRule(thing.id) ?? credentialNameRule(thing.label);
    if (rule !== null) {
      return err(
        new MeridianError(
          'CREDENTIAL_CUSTODY_REFUSED',
          `Handoff ${thing.kind} "${thing.label}" names a government authentication credential. Meridian ` +
            'does not compute, carry, store or collect one. Move the instruction into a step, where it tells ' +
            'the user what to do, instead of a slot that expects a value.',
          { handoffId: input.id, kind: thing.kind, id: thing.id, rule },
        ),
      );
    }
  }

  for (const field of input.fields) {
    if (field.source === 'user_supplies') continue;
    if (field.value.trim().length === 0) {
      return err(
        invalid(
          `Field "${field.label}" is declared as ${field.source} but carries no value. A blank the user ` +
            'must fill in is `user_supplies`; anything else is a gap they will discover at the counter.',
          { fieldId: field.id },
        ),
      );
    }
  }

  // Disclosure derives from the fields rather than being asserted by the caller.
  // A computed value is the user's own facts, processed — `assessment`. A handoff
  // that only restates the published procedure is `information`. Neither is ever
  // `advice`: nothing here ranks routes or predicts an outcome.
  const classification = maxDisclosureOf(
    input.fields.map((f): DisclosureClass => (f.source === 'computed' ? 'assessment' : 'information')),
  );

  return ok(
    Object.freeze({
      id: input.id,
      adapterId: input.adapterId,
      jurisdiction: input.jurisdiction,
      title: input.title,
      purpose: input.purpose,
      destinationUrl: input.destinationUrl,
      generatedOn: input.generatedOn,
      classification,
      steps: Object.freeze(steps),
      documents: Object.freeze([...input.documents]),
      fields: Object.freeze([...input.fields]),
      bringBack: Object.freeze([...input.bringBack]),
      citations: Object.freeze([...input.citations]),
      caveats: Object.freeze([...(input.caveats ?? [])]),
    }),
  );
}

/** Documents a step needs, resolved. Unknown ids cannot occur — the builder rejects them. */
export function documentsForStep(
  handoff: AssistedHandoff,
  step: HandoffStep,
): readonly HandoffDocument[] {
  return handoff.documents.filter((d) => step.requiresDocumentIds.includes(d.id));
}

/**
 * A plain-text rendering the user can print or paste into their notes.
 *
 * Plain text on purpose. The user of this output is standing in a queue with a
 * phone, or has printed it because the office has no signal in the basement.
 */
export function renderHandoffText(handoff: AssistedHandoff): string {
  const lines: string[] = [];
  lines.push(handoff.title);
  lines.push('='.repeat(handoff.title.length));
  lines.push('');
  lines.push(`Purpose: ${handoff.purpose}`);
  lines.push(`Where:   ${handoff.destinationUrl}`);
  lines.push(`Prepared: ${handoff.generatedOn}`);
  lines.push('');

  if (handoff.documents.length > 0) {
    lines.push('BRING WITH YOU');
    for (const doc of handoff.documents) {
      lines.push(`  - ${doc.title}${doc.originalRequired ? ' (original, not a copy)' : ''}`);
      lines.push(`      ${doc.description}`);
    }
    lines.push('');
  }

  lines.push('STEPS');
  for (const step of handoff.steps) {
    lines.push(`  ${step.ordinal}. [${step.channel}] ${step.title}`);
    lines.push(`      ${step.detail}`);
    for (const doc of documentsForStep(handoff, step)) {
      lines.push(`      needs: ${doc.title}`);
    }
  }
  lines.push('');

  if (handoff.fields.length > 0) {
    lines.push('VALUES TO ENTER');
    for (const field of handoff.fields) {
      const value = field.source === 'user_supplies' ? '(you provide this yourself)' : field.value;
      lines.push(`  ${field.label}: ${value}`);
      if (field.note !== undefined) lines.push(`      note: ${field.note}`);
    }
    lines.push('');
  }

  lines.push('BRING BACK');
  for (const capture of handoff.bringBack) {
    lines.push(`  - ${capture.title} (${capture.kind})`);
    lines.push(`      ${capture.description}`);
  }

  if (handoff.caveats.length > 0) {
    lines.push('');
    lines.push('BEFORE YOU RELY ON THIS');
    for (const caveat of handoff.caveats) lines.push(`  - ${caveat}`);
  }

  lines.push('');
  lines.push('SOURCES');
  for (const citation of handoff.citations) {
    const provision = citation.provision === undefined ? '' : `, ${citation.provision}`;
    const url = citation.url === undefined ? '' : ` — ${citation.url}`;
    lines.push(`  - ${citation.instrument}${provision}${url}`);
    lines.push(`      verified ${citation.verifiedOn}${citation.discretionary === true ? ' (administrative practice, may change)' : ''}`);
  }

  return lines.join('\n');
}
