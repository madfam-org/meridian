'use client';

/**
 * Client wrappers that need the current query string.
 *
 * The as-at override travels in the URL, so navigation and the keyboard chords
 * have to carry it forward — otherwise clicking from a caseload rendered as at
 * 2025-04-02 into a matter silently jumps the reader back to today, which is the
 * single most confusing thing a time-travelling console can do.
 *
 * `useSearchParams` forces a client boundary and, in a statically prerendered
 * tree, a Suspense boundary. Both are provided in `layout.tsx`, and the Suspense
 * fallback renders the same navigation without the override — which is not a
 * degraded state, it is simply the no-override case.
 */

import { useSearchParams } from 'next/navigation';
import { AS_OF_PARAM } from '@/lib/clock';
import { KeyboardNav } from '@/components/keyboard-nav';
import { Nav } from '@/components/nav';

function asOfQueryFrom(params: ReturnType<typeof useSearchParams>): string {
  const value = params?.get(AS_OF_PARAM);
  if (value === null || value === undefined || value.length === 0) return '';
  return `?${AS_OF_PARAM}=${encodeURIComponent(value)}`;
}

export function NavWithAsOf() {
  return <Nav asOfQuery={asOfQueryFrom(useSearchParams())} />;
}

export function KeyboardShortcuts() {
  return <KeyboardNav asOfQuery={asOfQueryFrom(useSearchParams())} />;
}
