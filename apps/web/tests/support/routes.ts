/**
 * Every route this portal publishes, mountable in a test.
 *
 * Two things make this shared rather than repeated. A route added without an
 * entry here is a route with no accessibility floor and no coverage-boundary
 * check, so the count is asserted; and the matter routes only have an `h1` when
 * they are composed with their segment layout, which is easy to forget and
 * produces a page that looks fine and has no document heading.
 *
 * The pages are async server components. Next awaits them and renders the
 * result; so does this.
 */

import type { ReactElement } from 'react';

import { AUDIENCES } from '@/lib/audiences';

import HomePage from '@/app/[locale]/page';
import PricingPage from '@/app/[locale]/pricing/page';
import AudienceIndexPage from '@/app/[locale]/for/page';
import AudiencePage from '@/app/[locale]/for/[audience]/page';
import MattersPage from '@/app/[locale]/matters/page';
import MatterLayout from '@/app/[locale]/matters/[id]/layout';
import MatterPage from '@/app/[locale]/matters/[id]/page';
import PresencePage from '@/app/[locale]/matters/[id]/presence/page';
import DocumentsPage from '@/app/[locale]/matters/[id]/documents/page';
import PathwaysPage from '@/app/[locale]/pathways/page';
import PathwayPage from '@/app/[locale]/pathways/[id]/page';
import ToolsIndexPage from '@/app/[locale]/tools/page';
import MrzToolPage from '@/app/[locale]/tools/mrz/page';
import NationalityToolPage from '@/app/[locale]/tools/nationality-es/page';
import SchengenToolPage from '@/app/[locale]/tools/schengen/page';

export const MATTER_ID = 'mtr-sample-es';
export const PATHWAY_ID = 'es-nationality-residence-reduced';
export const AUDIENCE_ID: string = AUDIENCES[0]?.id ?? '';

export interface Route {
  /** The public path, for a failure message that names something recognisable. */
  readonly path: string;
  readonly mount: (locale: string) => Promise<ReactElement>;
  /**
   * True where the page measures something against a reader's facts, or lists
   * the routes it can measure. These are the surfaces on which a reader can
   * conclude they have no route, so the coverage boundary must appear.
   */
  readonly eligibilitySurface?: boolean;
}

/** A matter page inside the layout that owns its `h1` and its tabs. */
async function inMatterShell(
  page: (args: { params: Promise<{ locale: string; id: string }> }) => Promise<ReactElement>,
  locale: string,
): Promise<ReactElement> {
  const params = Promise.resolve({ locale, id: MATTER_ID });
  const children = await page({ params });
  return MatterLayout({ children, params });
}

export const ROUTES: readonly Route[] = [
  { path: '/', mount: (locale) => HomePage({ params: Promise.resolve({ locale }) }) },
  { path: '/pricing', mount: (locale) => PricingPage({ params: Promise.resolve({ locale }) }) },
  { path: '/for', mount: (locale) => AudienceIndexPage({ params: Promise.resolve({ locale }) }) },
  {
    path: '/for/[audience]',
    mount: (locale) => AudiencePage({ params: Promise.resolve({ locale, audience: AUDIENCE_ID }) }),
  },
  { path: '/matters', mount: (locale) => MattersPage({ params: Promise.resolve({ locale }) }) },
  { path: '/matters/[id]', mount: (locale) => inMatterShell(MatterPage, locale) },
  { path: '/matters/[id]/presence', mount: (locale) => inMatterShell(PresencePage, locale) },
  { path: '/matters/[id]/documents', mount: (locale) => inMatterShell(DocumentsPage, locale) },
  {
    path: '/pathways',
    eligibilitySurface: true,
    mount: (locale) =>
      PathwaysPage({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }),
  },
  {
    path: '/pathways/[id]',
    eligibilitySurface: true,
    mount: (locale) => PathwayPage({ params: Promise.resolve({ locale, id: PATHWAY_ID }) }),
  },
  {
    path: '/tools',
    eligibilitySurface: true,
    mount: (locale) => ToolsIndexPage({ params: Promise.resolve({ locale }) }),
  },
  { path: '/tools/mrz', mount: (locale) => MrzToolPage({ params: Promise.resolve({ locale }) }) },
  {
    path: '/tools/nationality-es',
    eligibilitySurface: true,
    mount: (locale) => NationalityToolPage({ params: Promise.resolve({ locale }) }),
  },
  {
    path: '/tools/schengen',
    eligibilitySurface: true,
    mount: (locale) => SchengenToolPage({ params: Promise.resolve({ locale }) }),
  },
];

/** Levels at which the document outline jumps, e.g. `h2 → h4`. */
export function headingSkips(container: HTMLElement): string[] {
  const skips: string[] = [];
  let previous = 0;
  for (const heading of container.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const level = Number(heading.tagName.slice(1));
    if (previous > 0 && level > previous + 1) skips.push(`h${previous} → h${level}`);
    previous = level;
  }
  return skips;
}

/** Fragment targets referenced on the page that nothing on it answers. */
export function danglingAnchors(container: HTMLElement): string[] {
  const missing = new Set<string>();
  for (const link of container.querySelectorAll('a[href^="#"]')) {
    const target = (link.getAttribute('href') ?? '').slice(1);
    if (target === '') continue;
    if (container.querySelector(`[id="${target}"]`) === null) missing.add(target);
  }
  return [...missing].sort();
}
