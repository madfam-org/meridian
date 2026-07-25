/**
 * The console's single reference date.
 *
 * `AGENTS.md` says there is exactly one sanctioned clock read in the repository
 * and that nobody should add a second. That rule is about the *domain* packages,
 * where a hidden clock would make an assessment irreproducible — and it holds
 * here too: nothing in `lib/` or `app/` below this file reads a clock. Every
 * derivation in this console takes `asOf` as a parameter, exactly as
 * `staleness(citation, asOf)` and `statusOn(pathway, asOf)` do.
 *
 * The read itself has to happen somewhere, because a firm console that cannot
 * say what today is cannot tell a practitioner that a licence lapsed yesterday.
 * `@meridian/mrtd`'s `todayUtc()` would have been the place to borrow it from,
 * but mrtd is not a dependency of this app and adding one requires a lockfile
 * change. So the read is reproduced here, once, in the same shape: derive a
 * UTC calendar date from the system clock and hand it straight to core's
 * validating parser. `toISOString()` is unambiguously UTC, which is the point —
 * a local-time read would give a different answer either side of midnight in
 * Mexico City than in Madrid, and the whole civil-date discipline in
 * `@meridian/core` exists to stop precisely that.
 *
 * Two overrides sit in front of it, in priority order:
 *
 *  1. `?asOf=YYYY-MM-DD` on any URL. This is not a debugging affordance. The
 *     catalog is answerable about the past on purpose — `statusOn` will tell you
 *     Spain's investor route was open on 2 April 2025 — and a console that can
 *     only render today cannot explain a decision taken before a repeal.
 *  2. `MERIDIAN_ASOF` in the environment, for a deployment pinned to a fixed
 *     date (a demonstration instance, or a screenshot that must not rot).
 *
 * An unparseable override is reported rather than silently ignored, because a
 * typo that quietly falls back to today produces a page that looks right and
 * answers a different question than the one asked.
 */

import { isoDate, tryIsoDate, type IsoDate } from '@meridian/core';

/** Query-string key carrying the as-at override. Shared so links stay consistent. */
export const AS_OF_PARAM = 'asOf';

/** Where the effective reference date came from. Rendered so it is never a mystery. */
export type AsOfSource = 'url' | 'environment' | 'system_clock';

export interface AsOf {
  /** The date every derivation on the page is computed against. */
  readonly date: IsoDate;
  readonly source: AsOfSource;
  /** What the system clock reports, whatever the override says. */
  readonly today: IsoDate;
  /** True when `date` differs from `today`. Drives the banner. */
  readonly overridden: boolean;
  /**
   * Set when an override was supplied and rejected. The raw text is echoed back
   * so the reader can see their own typo; it is never used as a date.
   */
  readonly rejected?: { readonly raw: string; readonly from: 'url' | 'environment' };
}

/**
 * The one clock read. UTC, via `toISOString`, parsed by core so an impossible
 * value would throw here rather than propagate.
 */
function systemToday(): IsoDate {
  return isoDate(new Date().toISOString().slice(0, 10));
}

/** First value of a Next.js search parameter, which may arrive repeated. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Resolve the reference date for a render.
 *
 * `raw` is the `asOf` search parameter exactly as Next.js delivers it.
 */
export function resolveAsOf(raw: string | string[] | undefined): AsOf {
  const today = systemToday();

  const fromUrl = firstParam(raw);
  if (fromUrl !== undefined && fromUrl.trim().length > 0) {
    const parsed = tryIsoDate(fromUrl.trim());
    if (parsed !== null) {
      return { date: parsed, source: 'url', today, overridden: parsed !== today };
    }
    return {
      date: today,
      source: 'system_clock',
      today,
      overridden: false,
      rejected: { raw: fromUrl, from: 'url' },
    };
  }

  const fromEnv = process.env.MERIDIAN_ASOF;
  if (fromEnv !== undefined && fromEnv.trim().length > 0) {
    const parsed = tryIsoDate(fromEnv.trim());
    if (parsed !== null) {
      return { date: parsed, source: 'environment', today, overridden: parsed !== today };
    }
    return {
      date: today,
      source: 'system_clock',
      today,
      overridden: false,
      rejected: { raw: fromEnv, from: 'environment' },
    };
  }

  return { date: today, source: 'system_clock', today, overridden: false };
}

/**
 * Carry the as-at override across navigation.
 *
 * Without this, clicking from a caseload rendered as at 2025-04-02 into a matter
 * would silently jump the reader back to today — the single most confusing thing
 * a time-travelling console can do.
 */
export function withAsOf(href: string, asOf: AsOf): string {
  if (asOf.source !== 'url') return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}${AS_OF_PARAM}=${encodeURIComponent(asOf.date)}`;
}
