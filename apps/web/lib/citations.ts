/**
 * Resolving a citation id back to the source behind it.
 *
 * A rule on screen with an id nobody can dereference is barely better than a
 * rule with no source at all, so this resolver reports what it could not find
 * rather than dropping it. `UnresolvedCitation` renders those loudly: an id
 * with nothing behind it is a defect in the catalog or in the wiring, and the
 * reader needs to know the rule beside it is unverified.
 *
 * Three catalogs are in scope. `@meridian/presence` publishes the sources
 * behind its day counters, each pathway carries its own, and `document-rules`
 * carries the routing sources this portal computes locally.
 */

import type { Citation } from '@meridian/core';
import { PRESENCE_CITATIONS } from '@meridian/presence';
import type { Pathway } from '@meridian/pathways';

import { DOCUMENT_CITATIONS } from '@/lib/document-rules';

export interface ResolvedCitations {
  readonly found: readonly Citation[];
  /** Ids no catalog in scope answers. Rendered, never swallowed. */
  readonly missing: readonly string[];
}

function catalogFor(pathway: Pathway | null): readonly Citation[] {
  // A pathway's own citations are typed by zod inference rather than as core's
  // `Citation`, but the two are structurally identical and a compile-time test
  // in `@meridian/pathways` pins that. Spreading them here is safe.
  const fromPathway: readonly Citation[] = pathway === null ? [] : pathway.citations;
  return [...fromPathway, ...PRESENCE_CITATIONS, ...DOCUMENT_CITATIONS];
}

export function resolveCitations(
  ids: readonly string[],
  pathway: Pathway | null = null,
): ResolvedCitations {
  const catalog = catalogFor(pathway);
  const byId = new Map(catalog.map((x) => [x.id, x]));

  const found: Citation[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  // Sorted so the rendered source list is stable regardless of the order the
  // criteria happened to reference them in.
  for (const id of [...new Set(ids)].sort()) {
    if (seen.has(id)) continue;
    seen.add(id);
    const citation = byId.get(id);
    if (citation === undefined) missing.push(id);
    else found.push(citation);
  }

  return { found, missing };
}

/** A single id, or `null` when nothing in scope answers it. */
export function resolveCitation(id: string, pathway: Pathway | null = null): Citation | null {
  return catalogFor(pathway).find((x) => x.id === id) ?? null;
}
