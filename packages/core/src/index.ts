/**
 * `@meridian/core` — the shared contract every other Meridian package builds on.
 *
 * Three things live here and nowhere else:
 *   1. civil-date arithmetic (no `Date`, no timezones, no off-by-one),
 *   2. the advice boundary (`DisclosureClass` + `canRelease`),
 *   3. legal provenance (`Citation`), which every applied rule must carry.
 */

export * from './civil-date.js';
export * from './result.js';
export * from './citation.js';
export * from './jurisdiction.js';
export * from './disclosure.js';
export * from './tenancy.js';
export * from './matter.js';
export * from './errors.js';
