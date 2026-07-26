import type { MetadataRoute } from 'next';

import { LOCALES, localizedPath } from '@/lib/i18n';
import { SELF_URL } from '@/lib/links';

/**
 * `robots.txt` for the applicant portal.
 *
 * Two different answers, for two genuinely different kinds of route.
 *
 * **`/` and `/pathways/*` are allowed.** They restate published law: what a
 * pathway requires, which instrument each criterion comes from, and when a human
 * last checked that text. That is `information` in the disclosure sense —
 * neutral, cited, applied to nobody — and it is the same material the explainer
 * links to. Keeping it out of an index would help no one.
 *
 * **`/matters` and everything under it is disallowed.** The prefix is written
 * without a trailing slash so it covers the list as well as the records: the
 * list is what a signed-in person's own files will be enumerated on. Today those
 * routes carry worked examples:
 * invented people, invented histories, no real document number. Tomorrow they
 * are the address at which a real applicant reads their own day counts, and the
 * only thing that changes between the two is the data behind them, not the URL
 * shape. A `robots.txt` written for the sample data would have to be remembered
 * and rewritten on exactly the day nobody has time to think about crawlers, so
 * it is written now for the state that lasts: a person's own matter is not
 * indexable material, whoever the person turns out to be.
 *
 * **Every locale variant of that prefix is disallowed**, derived rather than
 * typed: `/matters` and `/es/matters` are the same person's file at two
 * addresses, and a rule that named only one would leave the other indexable.
 * `localizedPath` is the same function the pages build their links with, so a
 * locale added to `LOCALES` is covered here on the next build instead of
 * quietly opening a hole.
 *
 * `robots.txt` is a request to a well-behaved crawler and nothing more. It is
 * not access control, and it is not being used as any: when those routes hold a
 * real record they will sit behind authentication, and this file will still be
 * the correct thing to say to a crawler that never authenticates.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: LOCALES.map((locale) => localizedPath('/matters', locale)),
      },
    ],
    sitemap: `${SELF_URL}/sitemap.xml`,
  };
}
