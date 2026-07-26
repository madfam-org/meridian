import type { MetadataRoute } from 'next';

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';

import { AUDIENCES } from '@/lib/audiences';
import { TOOLS } from '@/lib/tools/registry';
import { alternatePaths } from '@/lib/i18n';
import { SELF_URL } from '@/lib/links';

/**
 * The sitemap, enumerated from the catalog rather than typed out.
 *
 * `/pathways/[id]` has one address per record in `MERIDIAN_PATHWAY_CATALOG`, and
 * `/for/[audience]` one per record in `AUDIENCES` — the same sources
 * `generateStaticParams` reads to decide which pages to prerender — so a pathway
 * or an audience added to the catalog appears here on the next build and a
 * retired one disappears, without anybody maintaining a second list that
 * silently drifts from the first.
 *
 * **Both locales, and every entry names the other.** Each carries
 * `alternates.languages`: the English URL, the Spanish URL, and `x-default` for
 * a reader whose language we have no basis to guess. The set is computed by
 * `alternatePaths`, the same function the page metadata uses, so the sitemap and
 * the `<link rel="alternate">` tags cannot disagree — and a crawler that finds
 * them disagreeing has no way to tell which one is wrong.
 *
 * `alternatePaths` drops any query string, which is right here: a sitemap lists
 * documents, and `/pathways?jurisdiction=ES` is one reader's view of the
 * document at `/pathways`.
 *
 * **`/matters` and its children are absent, deliberately.** `app/robots.ts`
 * explains why: those routes are a person's own file, and listing them for a
 * crawler is the opposite of what a sitemap is for. A sitemap that advertises
 * what `robots.txt` forbids is a contradiction a crawler resolves by ignoring
 * one of them, and it should not be left to guess which. Both locale variants
 * are excluded here, and `robots.ts` disallows both prefixes.
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

/** Every indexable path, locale-free. The locale variants are derived below. */
function indexablePaths(): readonly string[] {
  return [
    '/',
    '/for',
    ...AUDIENCES.map((audience) => `/for/${audience.id}`),
    '/pathways',
    ...MERIDIAN_PATHWAY_CATALOG.map((pathway) => `/pathways/${pathway.id}`),
    '/pricing',
    '/tools',
    ...TOOLS.map((tool) => tool.href),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePaths().flatMap((path) => {
    const paths = alternatePaths(path);
    const languages = {
      en: `${SELF_URL}${paths.en}`,
      es: `${SELF_URL}${paths.es}`,
      'x-default': `${SELF_URL}${paths['x-default']}`,
    };

    // One entry per locale, each declaring the whole alternate set, so a crawler
    // that reaches either variant first can find the other from it.
    return [
      { url: languages.en, alternates: { languages } },
      { url: languages.es, alternates: { languages } },
    ];
  });
}
