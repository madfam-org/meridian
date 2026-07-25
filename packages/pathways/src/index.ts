/**
 * `@meridian/pathways` — the legal rules engine and the versioned pathway catalog.
 *
 * The shape of this package is one idea: **the law is data and the engine is
 * generic**. A pathway is a zod-validated record whose eligibility criteria are
 * declarative specs, `evaluate` interprets those specs against an applicant's
 * facts in three-valued logic, and `recommend` is the only thing that ever
 * ranks anything — which is why it is the only thing behind the review gate.
 *
 * Adding a jurisdiction is a new file in `src/catalog/`. It is not a change to
 * `evaluate.ts`, and if it ever becomes one, a legal rule has escaped into a
 * place no reviewing lawyer will ever look.
 */

export * from './schema.js';
export * from './facts.js';
export * from './evaluate.js';
export * from './recommend.js';
export * from './integrity.js';
export * from './catalog/index.js';
