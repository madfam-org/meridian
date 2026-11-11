/**
 * `@meridian/sources` — where a cited rule's text lives, and whether it has
 * moved since a person last read it.
 *
 * Meridian encodes rules; it does not keep the law. The text, its versions and
 * the identifiers that name it belong to the systems that publish or curate it:
 * BOE for Spain, and Tezca (MADFAM's Mexican-law corpus) for Mexico. This
 * package is the seam between the two:
 *
 *   locate  — citation (url + provision) → the publisher's instrument and articles
 *   read    — ask the source when each cited article last changed
 *   assess  — compare that date with `verifiedOn`, and only ever report
 *
 * No function here takes a fact about a person, and none writes `verifiedOn`.
 */

export * from './model.js';
export * from './locate.js';
export * from './boe.js';
export * from './tezca.js';
export * from './drift.js';
