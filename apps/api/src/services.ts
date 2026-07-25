/**
 * Everything the HTTP layer depends on, as one injected bundle.
 *
 * The composition root builds this once; `buildApp` takes it and wires nothing
 * of its own. That is what lets the test suite run the *entire* service — auth,
 * gate, audit, every route — against the in-memory adapter and a locally
 * generated key pair, with no database and no network, while exercising the same
 * code path production does.
 *
 * `newId` is here rather than called inline for the same reason the clock is: a
 * test that cannot predict the ids cannot assert on the audit trail, and an
 * audit trail nobody asserts on is one nobody notices has stopped being written.
 */

import type { Pathway } from '@meridian/pathways';
import type { AdapterRegistry } from '@meridian/govtech';

import type { TokenVerifier } from './auth/verifier.js';
import type { Clock } from './clock.js';
import type { ApiConfig } from './config.js';
import type { RepositoryProvider } from './repositories/types.js';

export interface AppServices {
  readonly config: ApiConfig;
  readonly clock: Clock;
  readonly repositories: RepositoryProvider;
  readonly verifier: TokenVerifier;
  readonly govtech: AdapterRegistry;
  /**
   * The pathway catalog this instance serves.
   *
   * Injected rather than imported at the route so a deployment can serve a
   * counsel-reviewed subset, and so tests can supply a catalog whose review
   * status they control — the shipped catalog is entirely `unreviewed`, which
   * makes it the wrong fixture for testing that a *reviewed* pathway can be
   * recommended.
   */
  readonly catalog: readonly Pathway[];
  readonly newId: () => string;
}
