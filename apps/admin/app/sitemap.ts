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
 * ## The locales do not change this
 *
 * Every route now exists twice — `/matters` in English and `/es/matters` in
 * Spanish — and each page emits `hreflang` alternates naming both, because a
 * client that fetched one should be able to find the reader's own language. That
 * is not in tension with an empty sitemap: `hreflang` answers "which of these
 * documents is the same document in another language" and a sitemap answers
 * "which addresses do you want indexed". The answer to the second is still none,
 * and listing the Spanish half of a firm's caseload would be the same disclosure
 * as listing the English half, in a second language.
 *
 * The `hreflang` alternates are also, deliberately, the only place the two
 * variants are enumerated. They appear in the document a reader was already
 * given; the sitemap would publish them to a crawler that was told not to come.
 *
 * If this console ever grows a genuinely public route — a status page, a
 * published capability report — it belongs here in **both** locales, with the
 * `alternates` block `lib/i18n.ts`'s `localeAlternates` already produces, and
 * `app/robots.ts` has to allow that path in the same change. Neither file is
 * correct on its own, and a sitemap listing one locale of a two-locale page is
 * worse than one listing neither.
 *
 * There is one sitemap for the host rather than one per locale, which is why
 * this file sits outside the `[locale]` segment — and why `middleware.ts`
 * excludes `/sitemap.xml` from its rewrite.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
