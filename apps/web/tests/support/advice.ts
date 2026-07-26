/**
 * A screen for advice-class language in output that is only permitted to be
 * `assessment`-class.
 *
 * The boundary this enforces is the product's whole reason for existing: a page
 * with no accountable representative behind it may measure a reader's facts
 * against a cited rule, and may not tell them which route to take, rank two
 * routes against each other, or estimate whether an application would succeed.
 * `scripts/check-advice-boundary.mjs` polices the source; this polices the
 * rendered result, which is where a regression would actually reach a person.
 *
 * ── Why the patterns are constructions, not words ────────────────────────────
 *
 * Every one of these pages talks *about* advice constantly — "nothing here is a
 * recommendation", "that order is not a ranking", "recommending a date is
 * advice". A screen that banned the word `recommend` would fire on the very
 * sentences that keep the page honest, and would then be deleted. So each
 * pattern matches an affirmative advisory construction that has no innocent
 * reading on these pages.
 *
 * ── Why {@link assertScreenCatchesAdvice} exists ─────────────────────────────
 *
 * A screen that matches nothing and a screen that *can* match nothing produce
 * the same green tick. `KNOWN_ADVICE` is a set of sentences that must each be
 * caught, asserted in its own test, so "no advisory language found" is a real
 * finding rather than a broken regular expression.
 */

import { expect } from 'vitest';

/** Affirmative advisory constructions. Each must have no innocent reading. */
const ADVISORY_PATTERNS: readonly RegExp[] = [
  /\bwe recommend\b/i,
  /\bwe suggest\b/i,
  /\bwe advise\b/i,
  /\bour recommendation\b/i,
  /\brecommended (?:route|pathway|option|regime|date|for you)\b/i,
  /\byou should (?:apply|choose|use|pick|go|take|book)\b/i,
  /\bthe best (?:route|option|choice|regime|pathway|date|time)\b/i,
  /\byour best (?:route|option|choice|bet|chance)\b/i,
  /\bbetter (?:route|option|choice) (?:than|for you)\b/i,
  /\bmost likely to (?:succeed|be granted|be approved|work)\b/i,
  /\b(?:highest|best|good) chance of (?:success|approval|being granted)\b/i,
  /\blikelihood of (?:success|approval)\b/i,
  /\b\d+\s?% (?:chance|likely|likelihood|probability)\b/i,
  /\byou qualify\b/i,
  /\byou will qualify\b/i,
  /\byou are eligible\b/i,
  // Scoped to the reader's own file. The pages say, truthfully, that they will
  // not tell you "whether an application would be granted" — a disclaimer this
  // screen must not fire on.
  /\byour application would (?:succeed|be approved|be granted)\b/i,
  /\bwill be (?:approved|granted)\b/i,
  /\bguaranteed\b/i,
  /\btop (?:match|choice|pick|recommendation)\b/i,
  /\branked (?:first|second|highest|by)\b/i,
  /\bstrongest (?:route|option|match)\b/i,
];

/**
 * Sentences the screen must catch. Asserted in a test of its own so that a
 * pattern broken by an edit turns the suite red instead of quietly turning
 * every advisory-language assertion into a no-op.
 */
export const KNOWN_ADVICE: readonly string[] = [
  'We recommend the two-year regime.',
  'Your best route is the reduced period.',
  'This is the best option for you.',
  'You qualify for Spanish nationality.',
  'You have a 78% chance of success.',
  'Applications like yours are most likely to succeed under art. 22.1.',
  'Your application would be granted on these facts.',
  'Nationality will be granted.',
  'The recommended route for you is arraigo social.',
  'You should apply now.',
  'Approval is guaranteed on these facts.',
  'Routes ranked by strength of your file.',
];

/** Every advisory construction found in `text`, in pattern order. */
export function adviceIn(text: string): string[] {
  const found: string[] = [];
  for (const pattern of ADVISORY_PATTERNS) {
    const match = pattern.exec(text);
    if (match !== null) found.push(match[0]);
  }
  return found;
}

/** Fails, naming the offending phrase, if `text` reads as advice. */
export function expectNoAdvice(text: string): void {
  expect(adviceIn(text)).toEqual([]);
}

/** Proves the screen is capable of firing. Call it from a test of its own. */
export function assertScreenCatchesAdvice(): void {
  for (const sentence of KNOWN_ADVICE) {
    expect(adviceIn(sentence), `screen missed: ${sentence}`).not.toEqual([]);
  }
}
