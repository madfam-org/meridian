import type { MetadataRoute } from 'next';

/**
 * `robots.txt` for the firm console. Everything is disallowed.
 *
 * This is not the cautious default applied for want of a reason. Every route
 * here is a view of a practice's own working material: which matters are open,
 * which representative holds which file, whose credential has lapsed while a
 * live matter still depends on it, and an audit trail of who released what to
 * whom. A search index of those pages is an inventory of a law firm's caseload,
 * assembled by a third party, and no part of it becomes appropriate to publish
 * once the records behind it are real rather than invented.
 *
 * The URL shapes are worth withholding on their own account, separately from the
 * records. `/matters/[id]` and `/catalog/[id]` take identifiers, and a published
 * list of live identifiers is a starting point for guessing at the ones that
 * were not published.
 *
 * **`robots.txt` is a request, not a control.** It is honoured by crawlers that
 * choose to honour it and by nothing else, which is why the root layout also
 * sets `robots: { index: false, follow: false }` — that one reaches a client
 * that arrived without reading this file — and why neither is standing in for
 * authentication. The console will sit behind Janua; this file is what a
 * crawler that never authenticates should be told in the meantime, and it stays
 * correct afterwards.
 *
 * `disallow: '/'` already covers both locales — `/es/matters` is under `/` — so
 * adding a second language added nothing for a crawler to be told. It is worth
 * saying out loud anyway, because the pages do now emit `hreflang` alternates
 * naming both variants, and the two are not in conflict: `hreflang` tells a
 * client that already has one document where its sibling is, while this file
 * tells a crawler not to fetch either. See `app/sitemap.ts`.
 *
 * No `sitemap` line: see `app/sitemap.ts` for why there is nothing to point at.
 *
 * One `robots.txt` for the host, not one per locale, which is why this file sits
 * outside the `[locale]` segment and why `middleware.ts` excludes `/robots.txt`
 * from its rewrite.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
