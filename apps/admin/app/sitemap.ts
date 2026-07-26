import type { MetadataRoute } from 'next';

/**
 * The sitemap: empty, and empty on purpose.
 *
 * A sitemap is a list of addresses their owner wants indexed. `app/robots.ts`
 * disallows this host in full, because every route on it is a view of a
 * practice's caseload, and the two files have to agree — a sitemap advertising
 * URLs that `robots.txt` forbids is a contradiction a crawler resolves by
 * ignoring one of them, and which one is not ours to decide.
 *
 * So why does the file exist at all, rather than being left out?
 *
 * Because absent and empty say different things, and this repository treats that
 * distinction as load-bearing everywhere else: an absent fact is unknown, an
 * empty array is a positive assertion that there are none. A missing
 * `sitemap.ts` is indistinguishable from one nobody got round to writing, and
 * the next person to notice would have to work out from scratch whether the
 * console's routes were deliberately withheld or merely forgotten. This returns
 * zero URLs and says why, which is an answer rather than a gap.
 *
 * If this console ever grows a genuinely public route — a status page, a
 * published capability report — it belongs here, and `app/robots.ts` has to
 * allow that path in the same change. Neither file is correct on its own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
