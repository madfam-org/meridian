/**
 * The one place this service asks what day it is.
 *
 * Everything downstream — Schengen windows, acceptance windows, licence expiry,
 * citation staleness — is civil-date arithmetic done with `@meridian/core`. None
 * of it needs a clock; all of it needs a *reference date*, supplied explicitly
 * so an assessment re-run in five years reaches the same answer it reached
 * today.
 *
 * That is why the clock is an interface with exactly one method. A handler that
 * reaches for the current date directly is a handler nobody can pin to a date in
 * a test, and an immigration figure nobody can reproduce is a figure nobody can
 * defend to an officer.
 *
 * The system implementation delegates to `@meridian/mrtd`'s `todayUtc`, which is
 * already the single audited `Date` read in this monorepo. Reusing it means
 * `apps/api` contains no `Date` at all rather than a second one that has to be
 * reviewed on its own.
 *
 * UTC, not local time: a server that rolls over to tomorrow at 18:00 Mexico City
 * would report a stay as one day longer than the border did. Callers who need a
 * different civil day — a consular deadline in Madrid — must pass `asOf`
 * explicitly, and every route that takes a date lets them.
 */

import { isoDate, type IsoDate } from '@meridian/core';
import { todayUtc } from '@meridian/mrtd';

export interface Clock {
  /** The current civil date in UTC, as `YYYY-MM-DD`. */
  today(): IsoDate;
  /**
   * The current *instant*, ISO 8601 with a `Z` offset.
   *
   * This exists for exactly one purpose: stamping audit events. An audit trail
   * records when something happened, and "when" there means a moment, not a
   * calendar day — two events on the same day need an order.
   *
   * It must never be truncated to ten characters and used as a civil date. That
   * is the UTC-vs-local off-by-one this whole codebase is built to avoid: at
   * 18:00 in Mexico City this string already says tomorrow. Use
   * {@link Clock.today} for anything a border officer would recognise as a date.
   */
  now(): string;
}

/** The real clock. Injected once at composition and never reached for directly. */
export const systemClock: Clock = {
  today(): IsoDate {
    return isoDate(todayUtc());
  },
  now(): string {
    // The only instant read in this service. See the warning on `Clock.now`.
    return new Date().toISOString();
  },
};

/**
 * A clock frozen at `date`. Tests use this; so does any replay of a stored
 * assessment, which must be evaluated against the date it was made for rather
 * than the date it is being read on.
 *
 * The instant advances by one millisecond per call so that events stamped in
 * sequence keep their order — a frozen instant would make an audit trail
 * unsortable, which is a different bug from an unreproducible date.
 */
export function fixedClock(date: IsoDate, startInstant = `${date}T00:00:00.000Z`): Clock {
  let tick = 0;
  return {
    today: () => date,
    now: () => {
      const base = Date.parse(startInstant);
      return new Date(base + tick++).toISOString();
    },
  };
}
