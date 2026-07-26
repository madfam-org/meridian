import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/links';

/**
 * The sitemap.
 *
 * One route, because this site is one document: the navigation in the header
 * points at in-page anchors, and an anchor is not a separate URL. The only other
 * address the application answers is the not-found page, which is a status
 * rather than a destination and does not belong in a list of things to index.
 *
 * **No `lastModified`, and no `priority`.** Both fields are optional, and
 * neither can be filled in honestly from here. The page's content changes when
 * the pathway catalog changes, and this application has no record of when that
 * last happened; a date taken from the build clock would describe the build, not
 * the content, and would tell a crawler the page had changed on every deploy
 * whether or not a word of it had moved. `priority` is a self-assigned ranking
 * of one URL against one URL. Inventing either would be exactly the kind of
 * unfounded figure the rest of this site refuses to print.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }];
}
