/**
 * Small presentation helpers.
 *
 * Nothing in here computes a legal figure. Anything that counts a day lives in
 * `@meridian/core`, `@meridian/presence` or `@meridian/pathways`; this file
 * only decides how an already-computed value is spelled on screen.
 */

import type { Locale } from '@/lib/i18n';

/**
 * Join class names, dropping anything falsy.
 *
 * CSS Modules are typed as an index signature, so `styles.foo` is
 * `string | undefined` under `noUncheckedIndexedAccess`. Rather than assert
 * non-null at every call site — which would hide a genuine typo in a class name
 * — the undefined simply falls out here.
 */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}

/** `1 day` / `2 days`, with the caller's own nouns. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * `5 days` / `5 días` — the commonest unit on the site, and the reason this
 * helper takes a locale rather than being a constant.
 *
 * Both languages agree on when to use the singular, so one branch covers both.
 * The number is never spelled out: a day count is a figure a reader checks
 * against their own documents, and "ninety" is harder to compare than "90".
 */
export function days(n: number, locale: Locale): string {
  return locale === 'en' ? plural(n, 'day', 'days') : plural(n, 'día', 'días');
}

/**
 * How long ago something was, in days: `5 days ago` / `hace 5 días`.
 *
 * Separate from {@link days} because the two languages put the marker on
 * opposite sides of the figure, and building the phrase by concatenating a
 * translated word onto a translated count is how "hace 5 days" happens.
 */
export function agedDays(n: number, locale: Locale): string {
  return locale === 'en' ? `${days(n, 'en')} ago` : `hace ${days(n, 'es')}`;
}

/**
 * A signed count, for margins and slack. `+12` reads as headroom and `-3` as an
 * overrun; a bare `12` next to a bare `3` reads as neither.
 */
export function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/**
 * Title-case a snake_case enum value for display.
 *
 * Only ever applied to closed enums defined inside Meridian (`phase`, `status`,
 * `kind`). It is not applied to legal text, where the exact wording matters.
 */
export function humanise(token: string): string {
  const spaced = token.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Percentage of a whole, clamped to [0, 100], for a proportional bar with a stated numerator. */
export function proportion(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}
