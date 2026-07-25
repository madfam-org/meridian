/**
 * Small shared pieces every route file uses.
 *
 * `declare` exists so that the `config.meridian` block is written the same way
 * everywhere and cannot be spelled wrong: the `onRoute` hook rejects a route
 * without one, and this is the only convenient way to supply it.
 */

import type { IsoDate, MatterPhase } from '@meridian/core';
import type { z } from 'zod';

import { notFound, validationFailed } from '../http/errors.js';
import type { RequestContext } from '../request-context.js';
import type { MatterRecord } from '../repositories/types.js';
import type { MeridianRouteConfig } from './registry.js';

/** Route options carrying the mandatory Meridian metadata. */
export function declare(config: MeridianRouteConfig): {
  readonly config: { readonly meridian: MeridianRouteConfig };
} {
  return { config: { meridian: config } };
}

/**
 * Load a matter or fail with a 404.
 *
 * The repository is already tenant-bound, so "belongs to another tenant" and
 * "does not exist" arrive here as the same `null` — which is the point. There is
 * no branch that could tell them apart, so there is no branch that could leak
 * the difference.
 */
export async function requireMatter(ctx: RequestContext, id: string): Promise<MatterRecord> {
  const matter = await ctx.repositories.matters.get(id);
  if (matter === null) throw notFound('matter', id);
  return matter;
}

/**
 * Validate a response body against its declared schema before it goes out.
 *
 * Outbound validation catches the leak inbound validation cannot: a repository
 * that starts returning a column nobody meant to publish. A stripping schema
 * means the new field simply does not reach a client, and the failure surfaces
 * as a 500 in development rather than as a field in somebody's browser.
 */
export function respond<S extends z.ZodTypeAny>(schema: S, value: unknown): z.infer<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw validationFailed('response', parsed.error);
  return parsed.data;
}

/** `?asOf=` when supplied, otherwise the date fixed for this request. */
export function resolveAsOf(ctx: RequestContext, asOf: IsoDate | undefined): IsoDate {
  return asOf ?? ctx.asOf;
}

/** Phase names, for zod enums. Kept in one place so it cannot drift from core's order. */
export const MATTER_PHASE_VALUES: readonly [MatterPhase, ...MatterPhase[]] = [
  'intake',
  'identity_validation',
  'document_assembly',
  'submission',
  'post_arrival_tracking',
  'status_transition',
];
