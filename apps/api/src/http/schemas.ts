/**
 * Shared request and response schemas.
 *
 * These wrap the *validators the domain packages already own* rather than
 * re-implementing them. `isoDateSchema` defers to `@meridian/core`'s `isIsoDate`,
 * which rejects `2025-02-30`; a hand-rolled `/^\d{4}-\d{2}-\d{2}$/` would let it
 * through and every day-count downstream would be quietly wrong. The same
 * applies to country codes and language tags: one definition, one place it can
 * be wrong, one place it gets fixed.
 */

import {
  isCountryCode,
  isIsoDate,
  type Citation,
  type CountryCode,
  type DateRange,
  type IsoDate,
  type SourceKind,
} from '@meridian/core';
import { isLanguageTag, languageTag, type LanguageTag } from '@meridian/documents';
import { z } from 'zod';

export const isoDateSchema: z.ZodType<IsoDate> = z.custom<IsoDate>(isIsoDate, {
  message: 'expected a calendar date in YYYY-MM-DD form',
});

export const countryCodeSchema: z.ZodType<CountryCode> = z.custom<CountryCode>(isCountryCode, {
  message: 'expected an ISO 3166-1 alpha-2 country code, uppercase',
});

/** Accepts unnormalised casing (`es-MX`) and normalises, because casing is not a legal fact. */
export const languageTagSchema = z
  .string()
  .refine(isLanguageTag, { message: 'expected a BCP 47 language tag such as es, ca-valencia, en' })
  .transform((v): LanguageTag => languageTag(v));

/**
 * A closed civil-date interval, inclusive at both ends.
 *
 * Validated as a pair rather than two loose dates so an inverted range is
 * rejected at the boundary. An inverted range does not throw downstream — it
 * produces a negative day count, which reads as "you have used -14 of your 90
 * days" and is worse than an error.
 */
export const dateRangeSchema = z
  .object({ start: isoDateSchema, end: isoDateSchema })
  .refine((r): r is DateRange => r.start <= r.end, {
    message: 'range start must not be after its end',
  });

const sourceKindSchema: z.ZodType<SourceKind> = z.enum([
  'treaty',
  'statute',
  'regulation',
  'policy',
  'case_law',
  'official_guidance',
  'statistics',
  'secondary',
]);

/**
 * A caller-supplied citation.
 *
 * Callers supply citations when they declare their own document requirements —
 * the pathway catalog does not yet carry per-pathway paperwork, and this API
 * refuses to invent it. Requiring the full shape means a firm's own encoded rule
 * carries the same provenance the catalog's do: a named instrument, a
 * jurisdiction, and the date a human last checked it.
 */
export const citationSchema: z.ZodType<Citation> = z.object({
  id: z.string().min(1),
  kind: sourceKindSchema,
  instrument: z.string().min(1),
  provision: z.string().min(1).optional(),
  url: z.string().url().optional(),
  jurisdiction: z.string().min(1),
  verifiedOn: isoDateSchema,
  discretionary: z.boolean().optional(),
  note: z.string().optional(),
});

/** Cursor-free pagination. Ids are opaque; `limit` is capped so a client cannot ask for the table. */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** `?asOf=YYYY-MM-DD`, falling back to the injected clock when absent. */
export const asOfQuerySchema = z.object({ asOf: isoDateSchema.optional() });

export const idParamSchema = z.object({ id: z.string().min(1) });
