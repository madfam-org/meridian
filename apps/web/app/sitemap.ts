import type { MetadataRoute } from 'next';

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';

import { SELF_URL } from '@/lib/links';

/**
 * The sitemap, enumerated from the catalog rather than typed out.
 *
 * `/pathways/[id]` has one address per record in `MERIDIAN_PATHWAY_CATALOG` —
 * the same source `generateStaticParams` reads to decide which pages to
 * prerender — so a pathway added to the catalog appears here on the next build
 * and a retired one disappears, without anybody maintaining a second list that
 * silently drifts from the first.
 *
 * **`/matters` and its children are absent, deliberately.** `app/robots.ts`
 * explains why: those routes are a person's own file, and listing them for a
 * crawler is the opposite of what a sitemap is for. A sitemap that advertises
 * what `robots.txt` forbids is a contradiction a crawler resolves by ignoring
 * one of them, and it should not be left to guess which.
 *
 * **No `lastModified`, and no `priority`.** Both are optional and neither can be
 * filled in honestly. A pathway page changes when its catalog record changes;
 * the record carries `verifiedOn` per citation, which is when a human last read
 * the cited law and not when this page's markup last moved, and using it here
 * would answer a different question from the one a crawler is asking. A build
 * timestamp would claim every page had changed on every deploy. `priority` is a
 * self-assessed ranking of our own URLs against each other. Inventing any of
 * them would be exactly the kind of unfounded figure this portal refuses to
 * print anywhere else.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SELF_URL}/` },
    { url: `${SELF_URL}/pathways` },
    ...MERIDIAN_PATHWAY_CATALOG.map((pathway) => ({
      url: `${SELF_URL}/pathways/${pathway.id}`,
    })),
  ];
}
