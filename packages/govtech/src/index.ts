/**
 * `@meridian/govtech` — government portal adapters that tell the truth about
 * themselves.
 *
 * Two commitments hold across every adapter here:
 *
 *  1. **No synthetic success.** An adapter that cannot do a thing says so, with
 *    a reason and an owner. There is no fixture data, no optimistic default, and
 *    no code path that returns a plausible-looking government response nobody
 *    obtained from a government. {@link verifyNoSyntheticSuccess} exists so that
 *    is checkable rather than merely asserted.
 *  2. **No credential custody.** Meridian does not hold a user's government
 *    authentication credential, and does not act before an authority while
 *    presenting as them. The refusal is in the type system — see
 *    {@link CredentialFree} — with a runtime guard behind it for untyped
 *    boundaries. The replacement is {@link buildHandoff}, which is genuinely
 *    better: the user keeps the audit trail and the legal act stays theirs.
 *
 * Every government integration in this package is `not_provisioned` today. That
 * is the honest state, and the status board says it out loud.
 */

export * from './capability.js';
export * from './adapter.js';
export * from './credential-guard.js';
export * from './handoff.js';
export * from './citations.js';

export * from './adapters/clave.js';
export * from './adapters/dicireg.js';
export * from './adapters/ircc.js';

import type { AdapterRegistry } from './adapter.js';
import { createRegistry } from './adapter.js';
import { createClaveAdapter } from './adapters/clave.js';
import { createDiciregAdapter } from './adapters/dicireg.js';
import { createIrccAdapter } from './adapters/ircc.js';

/**
 * The registry as it ships: three adapters, nothing provisioned, two policy
 * refusals per jurisdiction that will not move.
 *
 * Built fresh on each call rather than exported as a singleton, so that a
 * deployment which later injects a real transport into one adapter can assemble
 * its own registry with {@link createRegistry} without fighting module state.
 */
export function defaultRegistry(): AdapterRegistry {
  return createRegistry([createClaveAdapter(), createDiciregAdapter(), createIrccAdapter()]);
}
