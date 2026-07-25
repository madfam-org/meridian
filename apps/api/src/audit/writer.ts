/**
 * The append-only writer.
 *
 * Every mutation and every disclosure downgrade produces exactly one row. The
 * downgrade case is the one that matters most and the one a CRUD-shaped audit
 * design misses entirely: nothing about the *data* changed when a recommendation
 * was reduced to an assessment, so an audit trail that only records writes has no
 * record of the single event a regulator would ask about — whether a
 * recommendation reached an unrepresented consumer.
 *
 * **What may go in `detail`.** Scalars only, and nothing that identifies a
 * person or a document. Ids, counts, classifications, status names, and
 * outcomes. Never a name, a passport number, an MRZ, a token, or an engine
 * payload. {@link auditDetail} enforces the scalar part; the rest is a review
 * rule, and {@link FORBIDDEN_DETAIL_KEYS} catches the mistakes that have obvious
 * names.
 *
 * **Ordering, and the gap this leaves.** The mutation is performed, then the row
 * is appended. If the append fails the request fails, so a caller is never told
 * an action succeeded that has no trail — but the mutation has already
 * happened, so a failed append can leave a change unrecorded. Closing that
 * properly needs the write and the audit row in one transaction, which the
 * Prisma adapter can do and the in-memory one cannot. It is a known gap, written
 * down here rather than discovered later.
 */

import type { DisclosureClass } from '@meridian/core';
import { credentialNameRule, normalisePropertyName } from '@meridian/govtech';

import type { AuthContext } from '../auth/context.js';
import type { Clock } from '../clock.js';
import type { AuditDetail, AuditOutcome, AuditRepository } from '../repositories/types.js';

/**
 * Personal-data field names that must never reach the trail.
 *
 * Credential-shaped names are *not* listed here: `@meridian/govtech` already
 * owns that vocabulary and exports `credentialNameRule`, so this module defers
 * to it rather than keeping a second list that would drift. What is left is the
 * identity data an immigration system handles constantly and an append-only
 * table should never accumulate.
 *
 * A blunt instrument, deliberately: the cost of a false positive is a developer
 * renaming a key, and the cost of a false negative is a travel-document number
 * in a table that is never deleted.
 */
export const FORBIDDEN_DETAIL_NAMES: readonly string[] = [
  'mrz',
  'machinereadablezone',
  'documentnumber',
  'traveldocumentnumber',
  'givennames',
  'familynames',
  'surname',
  'fullname',
  'dateofbirth',
  'placeofbirth',
  'nationalidnumber',
  'bearertoken',
  'authorization',
];

export class AuditDetailError extends Error {
  constructor(key: string, rule: string) {
    super(
      `Audit detail key ${JSON.stringify(key)} is not permitted (${rule}): the audit trail is ` +
        'never deleted, so it must not carry personal data or credentials.',
    );
    this.name = 'AuditDetailError';
  }
}

/**
 * Build a detail map, dropping `undefined` and refusing forbidden keys.
 *
 * Refusing rather than redacting: a silently redacted field looks like a field
 * nobody set, and the developer who added it never finds out.
 */
export function auditDetail(
  input: Readonly<Record<string, string | number | boolean | null | undefined>>,
): AuditDetail {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const credentialRule = credentialNameRule(key);
    if (credentialRule !== null) throw new AuditDetailError(key, credentialRule);
    if (FORBIDDEN_DETAIL_NAMES.includes(normalisePropertyName(key))) {
      throw new AuditDetailError(key, 'personal data');
    }
    out[key] = value;
  }
  return out;
}

export interface AuditInput {
  /** Dotted verb: `matter.created`, `matter.phase.advanced`, `disclosure.downgraded`. */
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string | null;
  readonly outcome: AuditOutcome;
  /** What the actor was shown. `null` for mutations that carry no engine output. */
  readonly disclosureClass?: DisclosureClass | null;
  /**
   * Scalars only, and `undefined` entries are dropped so a call site can write
   * `...(x === undefined ? {} : { x })` without building the object twice. Every
   * key passes through {@link auditDetail}, so the forbidden-name check is not
   * something a call site can forget to apply.
   */
  readonly detail?: Readonly<Record<string, string | number | boolean | null | undefined>>;
}

export interface AuditWriter {
  record(input: AuditInput): Promise<void>;
}

export function createAuditWriter(
  repository: AuditRepository,
  auth: AuthContext,
  clock: Clock,
  newId: () => string,
): AuditWriter {
  return {
    async record(input: AuditInput): Promise<void> {
      await repository.append({
        id: newId(),
        tenantId: auth.tenantId,
        occurredAt: clock.now(),
        actorUserId: auth.userId,
        // Both recognised and unrecognised roles: a token carrying roles this
        // build does not understand is exactly the thing worth seeing later.
        actorRoles: [...auth.roles, ...auth.unrecognisedRoles],
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        disclosureClass: input.disclosureClass ?? null,
        outcome: input.outcome,
        detail: auditDetail(input.detail ?? {}),
      });
    },
  };
}
