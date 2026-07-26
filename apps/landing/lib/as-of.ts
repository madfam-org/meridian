/**
 * The one civil date this site computes as at.
 *
 * ── Why it is a module of its own ────────────────────────────────────────────
 *
 * It used to live in `lib/catalog-facts.ts`, which is the natural home for it
 * and the wrong one, because that module imports `@meridian/pathways` — the
 * whole rule catalog, and zod with it. The calculator is a client component; it
 * needs a default for its reference-date field and nothing else. Importing one
 * date across that boundary pulled the entire pathway catalog into the browser
 * bundle: measured at the time of the split, the page's JavaScript went from
 * roughly 690 kB to 15 kB by moving this constant into a file with no imports
 * but `@meridian/core`.
 *
 * So the rule is simple and worth keeping: **anything a `'use client'` module
 * imports must not, transitively, reach `@meridian/pathways`.** A constant in a
 * leaf module is how that is enforced here.
 *
 * ── Why a fixed date rather than a clock ─────────────────────────────────────
 *
 * `@meridian/core` deliberately provides no "today": a reference date is a
 * parameter everywhere, because `new Date('2026-07-25')` is midnight UTC, which
 * is 2026-07-24 in Mexico City, and a page that answered a day-count question
 * from the wall clock would give two readers different answers to the same
 * question. Citation freshness is a day-count question like any other. There is
 * no `Date` anywhere in this application.
 */

import { isoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';

/** The civil date every figure on this site is computed as at. */
export const AS_OF: IsoDate = isoDate('2026-07-25');
