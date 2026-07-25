/**
 * The evaluation date, and the small constructors the sample data leans on.
 *
 * **One fixed date, not a clock.** Every figure in this portal is computed as
 * at `AS_OF`. `@meridian/core` deliberately provides no "today", and the whole
 * repo has exactly one sanctioned clock read (in `@meridian/mrtd`, so that
 * callers can override it). A reference date is a parameter everywhere else,
 * for two reasons that both matter here:
 *
 *  1. **Reproducibility.** "How many of your 90 days had you used?" is a
 *     question about a specific calendar day. A page that answered it from
 *     `new Date()` would give a different answer to the applicant and to the
 *     representative reading over their shoulder an hour later in another
 *     timezone, and neither could reconstruct the other's number.
 *  2. **Correctness.** `new Date('2026-07-25')` is midnight UTC, which is
 *     2026-07-24 in Mexico City. One hour of drift turns a lawful 90-day stay
 *     into a 91-day overstay on a report an officer will read.
 *
 * There is no `Date` anywhere in this application.
 */

import { countryCode, dateRange, isoDate } from '@meridian/core';
import type { CountryCode, DateRange, IsoDate } from '@meridian/core';

/** The civil date every page in this build is computed as at. */
export const AS_OF: IsoDate = isoDate('2026-07-25');

/** Terse constructors, so the sample records below stay readable. */
export const d = (value: string): IsoDate => isoDate(value);
export const c = (value: string): CountryCode => countryCode(value);
export const range = (start: string, end: string): DateRange => dateRange(d(start), d(end));
