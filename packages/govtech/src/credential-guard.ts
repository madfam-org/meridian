/**
 * Credential custody: the thing this package exists to refuse.
 *
 * The source PRD asked the platform to "manage the retrieval and storage of
 * Cl@ve PINs and Cl@ve Permanente passwords" and to submit on the user's behalf.
 * That feature is not built here, and this module is the reason it stays unbuilt.
 *
 * ## Why
 *
 * Cl@ve is not a login for a website. It is the citizen's identification means
 * before the Spanish State — the same key that reaches their tax file, their
 * social security record, their civil registry entries and their address
 * registration. The equivalents elsewhere are the same shape: an e.firma / FIEL
 * private key is a legally binding signature, and a portal account password is
 * the credential a legal act is attributed to.
 *
 * Holding those has three consequences, in ascending order of seriousness:
 *
 *   1. It makes the operator a credential custodian for a state identity system,
 *      a role with obligations nobody involved has signed up for.
 *   2. It almost certainly breaches the scheme's own terms, which treat the
 *      credential as personal and non-transferable.
 *   3. It converts any breach of this platform — a leaked backup, a compromised
 *      dependency, a curious employee — from an embarrassing data incident into
 *      an identity-fraud event against the user's tax, social security and civil
 *      registry records. The blast radius is not "our database". It is the
 *      user's legal identity.
 *
 * There is also a quieter point. A submission made with the user's credential is
 * legally *the user's act*, performed by someone else, with no record on our side
 * of them having consented to that specific act on that specific day. When it
 * goes wrong, the user is the one who made a false declaration.
 *
 * ## What to do instead
 *
 * Use {@link import('./handoff.js').buildHandoff}. Meridian computes the values,
 * assembles the documents, and hands the user a precise, ordered package they
 * carry to the portal themselves: destination, steps, what to bring, what to type,
 * what to bring back. The user authenticates with their own credential, on the
 * government's own front end, and the legal act stays theirs — with the audit
 * trail in their account, where it belongs. Where a real delegated flow exists
 * (an eIDAS-style identity assertion issued by the scheme after the user
 * authenticates *directly with the scheme*), that is a different architecture
 * entirely and is welcome: we receive a signed statement about the user, never
 * the user's authenticator.
 *
 * ## How the refusal is enforced
 *
 * Two layers, because one is not enough:
 *
 *   - **Structural.** {@link CredentialFree} makes a payload containing a
 *     credential-shaped field un-assignable to an operation parameter. The
 *     contributor who adds `clavePin` to an input type gets a compile error, not
 *     a code review comment they can argue with.
 *   - **Runtime.** {@link guardCredentialFree} scans values arriving from
 *     untyped boundaries — HTTP bodies, queue messages, imported JSON — where the
 *     type system has no purchase. Every adapter operation that accepts caller
 *     input runs it.
 */

import type { MeridianErrorCode, Result } from '@meridian/core';
import { MeridianError, err, ok } from '@meridian/core';

/* -------------------------------------------------------------------------- */
/* The policy, as data                                                        */
/* -------------------------------------------------------------------------- */

export interface CredentialCustodyPolicy {
  readonly id: string;
  readonly summary: string;
  readonly refuses: readonly string[];
  readonly because: readonly string[];
  readonly insteadDo: readonly string[];
}

/** Rendered on the admin status board next to every `refused_by_policy` capability. */
export const CREDENTIAL_CUSTODY_POLICY: CredentialCustodyPolicy = Object.freeze({
  id: 'meridian-no-credential-custody',
  summary:
    'Meridian does not accept, store, relay or transmit a user\'s government authentication credential, ' +
    'and does not perform acts before an authority while presenting as the user.',
  refuses: Object.freeze([
    'Cl@ve PIN codes and Cl@ve Permanente passwords',
    'Certificate and keystore passphrases (.p12 / .pfx / PKCS#12)',
    'e.firma / FIEL private key material',
    'Government portal account passwords and one-time codes',
    'Cl@ve registration invitation-letter codes',
  ]),
  because: Object.freeze([
    'Custody makes the operator a credential custodian for a state identity system.',
    'Scheme terms of use treat these credentials as personal and non-transferable.',
    'A breach becomes an identity-fraud event against the user\'s tax, social security and civil registry records.',
    'A submission made with the user\'s credential is the user\'s legal act, performed without a record of their consent to that act.',
  ]),
  insteadDo: Object.freeze([
    'Build an assisted handoff: the user authenticates themselves, on the authority\'s own front end.',
    'Pre-compute every field value so the user copies rather than derives.',
    'Capture the reference number the user brings back, and keep the audit trail in their account.',
    'Where the scheme offers delegated authentication, integrate the assertion — never the authenticator.',
  ]),
});

/* -------------------------------------------------------------------------- */
/* Layer 1: structural refusal, in the type system                            */
/* -------------------------------------------------------------------------- */

/**
 * What a credential-shaped property collapses to.
 *
 * Nothing is assignable to it, so the field cannot be supplied — and the
 * compiler error names the policy, which is more use to the contributor than
 * `Type 'string' is not assignable to type 'never'`.
 */
export interface CredentialCustodyRefused<K extends string> {
  readonly __meridianRefusesCredentialCustody: K;
}

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Property names refused at compile time, matched case-insensitively via
 * `Lowercase<K>`.
 *
 * The suffix patterns (`${string}pin`, `${string}secret`) are deliberately
 * anchored rather than free substrings. A bare `pin` substring rejects
 * `shipping`; a bare `secret` substring rejects `secretariatName`. False
 * positives here are not harmless — they push contributors towards disabling the
 * check, which is exactly how a guard dies.
 *
 * Equally deliberate: `credential` is **not** on this list. `@meridian/core`'s
 * `AuthorizedRepresentative.credential` holds a licence type such as `'rcic'`,
 * and refusing that name would break legitimate payloads while catching nothing.
 * The list targets secret *material*, not the word.
 */
type ForbiddenPropertyName =
  | 'pin'
  | 'pincode'
  | 'pinnumber'
  | 'codigopin'
  | 'clave'
  | 'claves'
  | 'clavepin'
  | 'clavepermanente'
  | 'clavemovil'
  | 'otp'
  | 'otpcode'
  | 'mfacode'
  | 'smscode'
  | 'onetimecode'
  | 'onetimepassword'
  | 'pwd'
  | 'passwd'
  | 'passcode'
  | 'accesscode'
  | 'securitycode'
  | 'secret'
  | 'apikey'
  | 'fiel'
  | 'efirma'
  | 'p12'
  | 'pfx'
  | 'pkcs12'
  | 'jks'
  | 'invitationlettercode'
  | 'cartadeinvitacioncodigo'
  | `${string}password${string}`
  | `${string}passphrase${string}`
  | `${string}privatekey${string}`
  | `${string}privatekeypem${string}`
  | `${string}contrasena${string}`
  | `${string}claveprivada${string}`
  | `${string}llaveprivada${string}`
  | `${string}keystore${string}`
  | `${string}truststore${string}`
  | `${string}efirma${string}`
  | `${string}pin`
  | `${string}secret`
  | `${string}apikey`;

/**
 * `T` with every credential-shaped property, at any depth, replaced by something
 * nothing is assignable to.
 *
 * Use it as `input: T & CredentialFree<T>` on a generic operation parameter.
 * The intersection form matters: `T extends CredentialFree<T>` is a circular
 * constraint the compiler rejects, while intersecting at the parameter position
 * both infers `T` from the argument and checks it against the refusal.
 *
 * Primitives short-circuit first so branded types from `@meridian/core` — an
 * `IsoDate` is `string & { __brand }` — pass through untouched instead of being
 * mapped into an unusable shape.
 */
export type CredentialFree<T> = T extends Primitive
  ? T
  : T extends readonly unknown[]
    ? { [I in keyof T]: CredentialFree<T[I]> }
    : T extends object
      ? {
          [K in keyof T]: K extends string
            ? Lowercase<K> extends ForbiddenPropertyName
              ? CredentialCustodyRefused<K>
              : CredentialFree<T[K]>
            : CredentialFree<T[K]>;
        }
      : T;

/* -------------------------------------------------------------------------- */
/* Layer 2: runtime refusal, for untyped boundaries                           */
/* -------------------------------------------------------------------------- */

/**
 * Names matched exactly after normalisation (diacritics stripped, lowercased,
 * non-alphanumerics removed — so `Cl@ve_PIN`, `clave-pin` and `clavePin` all
 * arrive here as `clavepin`).
 *
 * Exact rather than substring wherever the token is short enough to appear
 * inside an innocent word: `pin` inside `shipping`, `otp` inside `notPermitted`,
 * `fiel` inside `fieldName`.
 */
const FORBIDDEN_EXACT: ReadonlySet<string> = new Set([
  'pin',
  'pincode',
  'pinnumber',
  'codigopin',
  'clave',
  'claves',
  'otp',
  'otpcode',
  'mfacode',
  'smscode',
  'onetimecode',
  'onetimepassword',
  'pwd',
  'passwd',
  'passcode',
  'accesscode',
  'securitycode',
  'secret',
  'apikey',
  'fiel',
  'p12',
  'pfx',
  'pkcs12',
  'jks',
  'invitationlettercode',
  'cartadeinvitacioncodigo',
]);

/**
 * Fragments long and distinctive enough that any property containing them is a
 * credential regardless of what surrounds them.
 */
const FORBIDDEN_FRAGMENTS: readonly string[] = Object.freeze([
  'password',
  'passphrase',
  'contrasena',
  'privatekey',
  'claveprivada',
  'llaveprivada',
  'clavepin',
  'clavepermanente',
  'clavemovil',
  'efirma',
  'keystore',
  'truststore',
  'signingkey',
  'secretkey',
  'clientsecret',
]);

/** Suffixes, anchored so `shipping` and `secretariat` survive. */
const FORBIDDEN_SUFFIXES: readonly string[] = Object.freeze(['pin', 'secret', 'apikey']);

/**
 * Key material identifiable from the *value* rather than the property name.
 *
 * This catches the case the name-based rules structurally cannot: someone pastes
 * a PEM private key into a free-text `notes` or `additionalInformation` field.
 * Matching the PEM armour is close to zero false-positive — the string does not
 * occur by accident.
 */
const PEM_PRIVATE_KEY_RE = /-----BEGIN\s+(?:[A-Z0-9]+\s+)*PRIVATE\s+KEY-----/;

/**
 * Reduce a property name to one comparable form: diacritics stripped, lowercased,
 * separators removed.
 *
 * The `@`\u2192`a` and `$`\u2192`s` substitutions are not paranoia about leetspeak. The
 * Spanish scheme is *branded* `Cl@ve`, so `Cl@vePin` is the natural spelling a
 * contributor reaches for, and without the substitution it normalises to
 * `clvepin` and slips past every rule keyed on the word `clave`. Losing a
 * credential check to the vendor's own logo would be an embarrassing way to
 * fail.
 */
export function normalisePropertyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-z0-9]/g, '');
}

function matchesForbiddenName(normalised: string): string | null {
  if (normalised.length === 0) return null;
  if (FORBIDDEN_EXACT.has(normalised)) return normalised;
  for (const fragment of FORBIDDEN_FRAGMENTS) {
    if (normalised.includes(fragment)) return fragment;
  }
  for (const suffix of FORBIDDEN_SUFFIXES) {
    if (normalised.length > suffix.length && normalised.endsWith(suffix)) return `*${suffix}`;
  }
  return null;
}

/**
 * Whether a piece of *text* names a credential, returning the rule that matched.
 *
 * Exposed because credential-shaped names do not only arrive as property keys.
 * A handoff field labelled "Your Cl@ve PIN" is the refused feature wearing a
 * different costume: the property names around it (`id`, `label`, `value`) are
 * innocent, and the scanner would wave it through.
 *
 * Deliberately *not* applied to free prose. Meridian's own handoffs carry the
 * caveat "Meridian never asks for your Cl@ve PIN", and a rule that scanned every
 * string for these words would refuse the sentence that states the policy.
 * Callers apply this to short identifiers and labels — places where the words
 * name a thing being collected rather than discuss one.
 */
export function credentialNameRule(text: string): string | null {
  return matchesForbiddenName(normalisePropertyName(text));
}

export interface CredentialFinding {
  /**
   * Where it was found — `applicant.clavePin`, `documents[2].passphrase`.
   *
   * The path and nothing else. The offending value is never captured, never put
   * in an error, never logged. A guard that echoes the secret it refused into an
   * exception message has moved the credential into the log aggregator, which is
   * a worse place for it than the request body it came from.
   */
  readonly path: string;
  /** Whether the property name or the value's shape triggered the refusal. */
  readonly detectedOn: 'property_name' | 'value_shape';
  /** The rule that matched — a normalised name, `*suffix`, or `pem_private_key`. */
  readonly rule: string;
}

export interface CredentialScanOptions {
  /**
   * Traversal budget. Exceeding it fails closed: an object too large to certify
   * credential-free is refused rather than waved through, because "we ran out of
   * budget" and "we found nothing" must not produce the same answer.
   */
  readonly maxNodes?: number;
}

const DEFAULT_MAX_NODES = 5000;

interface ScanOutcome {
  readonly findings: readonly CredentialFinding[];
  readonly nodesVisited: number;
  readonly budgetExceeded: boolean;
}

function scan(payload: unknown, maxNodes: number): ScanOutcome {
  const findings: CredentialFinding[] = [];
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; path: string }> = [{ value: payload, path: '' }];
  let nodesVisited = 0;

  const push = (value: unknown, path: string): void => {
    stack.push({ value, path });
  };

  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame === undefined) break;
    if (nodesVisited >= maxNodes) {
      return { findings, nodesVisited, budgetExceeded: true };
    }
    nodesVisited += 1;

    const { value, path } = frame;

    if (typeof value === 'string') {
      if (PEM_PRIVATE_KEY_RE.test(value)) {
        findings.push({ path: path === '' ? '<root>' : path, detectedOn: 'value_shape', rule: 'pem_private_key' });
      }
      continue;
    }

    if (value === null || typeof value !== 'object') continue;

    // Cycles are an adversarial input, not a hypothetical: a JSON body cannot
    // contain one, but an object assembled in-process can, and an unguarded
    // traversal would hang the request rather than refuse it.
    if (seen.has(value)) continue;
    seen.add(value);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) push(value[i], `${path}[${i}]`);
      continue;
    }

    if (value instanceof Map) {
      for (const [key, entry] of value.entries()) {
        const label = typeof key === 'string' ? key : String(key);
        const childPath = path === '' ? label : `${path}.${label}`;
        if (typeof key === 'string') {
          const rule = matchesForbiddenName(normalisePropertyName(key));
          if (rule !== null) {
            findings.push({ path: childPath, detectedOn: 'property_name', rule });
            continue;
          }
        }
        push(entry, childPath);
      }
      continue;
    }

    if (value instanceof Set) {
      let i = 0;
      for (const entry of value.values()) {
        push(entry, `${path}{${i}}`);
        i += 1;
      }
      continue;
    }

    for (const key of Object.keys(value)) {
      const childPath = path === '' ? key : `${path}.${key}`;
      const rule = matchesForbiddenName(normalisePropertyName(key));
      if (rule !== null) {
        // Refuse on the name and do not descend: descending would only produce
        // additional findings about a subtree we have already rejected, and the
        // deeper paths are noise for whoever has to fix the caller.
        findings.push({ path: childPath, detectedOn: 'property_name', rule });
        continue;
      }
      push((value as Record<string, unknown>)[key], childPath);
    }
  }

  return { findings, nodesVisited, budgetExceeded: false };
}

/**
 * Every credential-shaped thing in `payload`, by path. Empty means clean.
 *
 * Exposed separately from the guard so an intake form can tell a user *which*
 * field to remove without an exception being thrown at them.
 */
export function scanForCredentials(
  payload: unknown,
  options: CredentialScanOptions = {},
): readonly CredentialFinding[] {
  return scan(payload, options.maxNodes ?? DEFAULT_MAX_NODES).findings;
}

function refusal(code: MeridianErrorCode, message: string, details: Record<string, unknown>): MeridianError {
  return new MeridianError(code, message, details);
}

/**
 * The guard every adapter operation accepting caller input must call.
 *
 * On success the payload is returned unchanged, so it composes as a pass-through
 * at the top of an operation. On refusal the error carries the offending
 * *paths*, the policy id, and what to do instead — never a value.
 */
export function guardCredentialFree<T>(
  payload: T,
  options: CredentialScanOptions = {},
): Result<T, MeridianError> {
  const outcome = scan(payload, options.maxNodes ?? DEFAULT_MAX_NODES);

  if (outcome.budgetExceeded) {
    return err(
      refusal(
        'INVALID_INPUT',
        `Payload exceeded the ${options.maxNodes ?? DEFAULT_MAX_NODES}-node inspection budget and could not be ` +
          'certified free of credential material. Submit a smaller payload rather than an uninspected one.',
        { nodesVisited: outcome.nodesVisited, maxNodes: options.maxNodes ?? DEFAULT_MAX_NODES },
      ),
    );
  }

  if (outcome.findings.length > 0) {
    return err(
      refusal(
        'CREDENTIAL_CUSTODY_REFUSED',
        'This payload contains government authentication credential material. Meridian does not accept ' +
          'custody of it under any circumstances. Remove the field and use an assisted handoff: the user ' +
          'authenticates themselves, on the authority\'s own front end, and the legal act stays theirs.',
        {
          policyId: CREDENTIAL_CUSTODY_POLICY.id,
          // Paths only. The values that triggered this never leave the caller's memory.
          paths: outcome.findings.map((f) => f.path),
          findings: outcome.findings,
          insteadDo: CREDENTIAL_CUSTODY_POLICY.insteadDo,
        },
      ),
    );
  }

  return ok(payload);
}

/**
 * The refusal as an error, without a payload to inspect.
 *
 * Used by capabilities that are refused outright — there is no input to scan
 * when the answer to "will you store my Cl@ve password" is no in principle.
 */
export function credentialCustodyRefusal(context: {
  readonly adapterId: string;
  readonly capabilityId: string;
  readonly what: string;
}): MeridianError {
  return refusal(
    'CREDENTIAL_CUSTODY_REFUSED',
    `${context.what} is refused by policy and will not be implemented. ${CREDENTIAL_CUSTODY_POLICY.summary}`,
    {
      policyId: CREDENTIAL_CUSTODY_POLICY.id,
      adapterId: context.adapterId,
      capabilityId: context.capabilityId,
      because: CREDENTIAL_CUSTODY_POLICY.because,
      insteadDo: CREDENTIAL_CUSTODY_POLICY.insteadDo,
    },
  );
}
