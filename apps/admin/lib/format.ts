/**
 * Presentation helpers. No arithmetic beyond counting, and no calendar
 * arithmetic at all — every date figure reaching this module was already
 * computed by `@meridian/core`.
 *
 * Dates are rendered as `YYYY-MM-DD` throughout the console rather than in a
 * locale format. That is deliberate: `03/04/2025` is 3 April to a Spanish
 * practitioner and 4 March to a Canadian one, the console serves both, and an
 * ambiguous filing deadline is worse than an unfamiliar one. The relative form
 * ("in 12 days") is shown alongside, never instead.
 */

/** `snake_case` or `kebab-case` token to sentence case, for enum values. */
export function humanise(token: string): string {
  const words = token.replace(/[_-]+/g, ' ').trim();
  if (words.length === 0) return token;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Pluralise by count without inventing irregulars: caller supplies both forms. */
export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** `3 matters`, `1 matter`. */
export function countOf(count: number, one: string, many: string): string {
  return `${count} ${plural(count, one, many)}`;
}

/**
 * A signed day count as English.
 *
 * `days` is `diffDays(asOf, target)`: positive means the target is ahead.
 * Zero is "today" rather than "in 0 days", because a deadline that falls today
 * is the one a practitioner most needs to read correctly at a glance.
 */
export function relativeDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}
