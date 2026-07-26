import type { MetadataRoute } from 'next';

import { LOCALES, SITE_ALTERNATES, localizedPath } from '@/lib/i18n';
import { SITE_URL } from '@/lib/links';

/**
 * The sitemap.
 *
 * Two entries for one document: the English variant at `/` and the Spanish one
 * at `/es`. They are separate URLs serving separate text, so they are separately
 * indexable, and each declares the other through `alternates.languages` — the
 * sitemap form of `hreflang`, which is what tells a search engine the two are
 * translations rather than duplicates competing for one ranking. The head of
 * each page carries the same declaration; a crawler that arrives without reading
 * the sitemap still finds it.
 *
 * No third entry. The navigation in the header points at in-page anchors, and an
 * anchor is not a separate URL. The only other address the application answers
 * is the not-found page, which is a status rather than a destination and does
 * not belong in a list of things to index.
 *
 * **No `lastModified`, and no `priority`.** Both fields are optional, and
 * neither can be filled in honestly from here. The page's content changes when
 * the pathway catalog changes, and this application has no record of when that
 * last happened; a date taken from the build clock would describe the build, not
 * the content, and would tell a crawler the page had changed on every deploy
 * whether or not a word of it had moved. `priority` is a self-assigned ranking
 * of one URL against another. Inventing either would be exactly the kind of
 * unfounded figure the rest of this site refuses to print.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}${localizedPath('/', locale)}`,
    alternates: { languages: SITE_ALTERNATES },
  }));
}
