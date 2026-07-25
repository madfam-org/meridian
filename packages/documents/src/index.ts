/**
 * `@meridian/documents` — what paperwork a pathway requires, how it is made
 * usable abroad, and whether it will still be usable on the day it is filed.
 *
 * Five concerns, each in its own module because each fails on its own:
 *
 *   - `model.ts`       — what a document is, and the status machine that refuses
 *                        illegal transitions rather than tolerating them.
 *   - `legalisation.ts`— apostille, consular chain, or nothing; and an explicit
 *                        `'unknown'` whenever the catalog cannot say.
 *   - `translation.ts` — whether the receiving authority can read it, and whose
 *                        translation it will accept.
 *   - `freshness.ts`   — whether it is still acceptable on the *submission*
 *                        date, which is not today.
 *   - `checklist.ts`   — the ordered plan, and `Task` records wired so that
 *                        `unlockTasks` reveals only work that can start now.
 *   - `gaps.ts`        — the difference between the plan and the folder, as an
 *                        `assessment` under the advice boundary.
 *
 * Nothing in this package recommends, ranks, or predicts. Every output either
 * restates a cited rule or measures the applicant's own facts against one. See
 * `@meridian/core`'s `disclosure.ts` for why that line is drawn where it is.
 */

export * from './language.js';
export * from './model.js';
export * from './legalisation.js';
export * from './translation.js';
export * from './freshness.js';
export * from './checklist.js';
export * from './gaps.js';
