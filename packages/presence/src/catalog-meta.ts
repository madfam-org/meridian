/**
 * Catalog provenance metadata for `@meridian/presence`.
 *
 * Every {@link import('@meridian/core').Citation} in this package carries the
 * same `verifiedOn` date because they were checked together, in one pass, by
 * one human. Keeping it in one place makes the re-verification unit obvious:
 * you re-read every rule in the package, or you re-read none of them. A
 * per-file date invites the failure mode where one rule is refreshed, the
 * staleness check goes green, and four stale rules ride along behind it.
 */

import type { IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';

/** The date the presence catalog was last checked against its sources. */
export const CATALOG_VERIFIED_ON: IsoDate = isoDate('2026-07-25');
