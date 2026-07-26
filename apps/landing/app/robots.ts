import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/links';

/**
 * `robots.txt` for the explainer.
 *
 * This site is a single public document whose whole purpose is to be read
 * before anybody trusts Meridian with a passport number, and it holds no
 * account, no session and no personal data of any kind. There is nothing here a
 * crawler should be kept away from, so it is allowed in full.
 *
 * The sitemap is advertised here as well as being served at its own address,
 * because a crawler that arrives at the host without a prior link finds
 * `/robots.txt` first.
 *
 * This file is not a substitute for the console's refusal — see
 * `apps/admin/app/robots.ts`, which says the opposite thing for the opposite
 * reason. The two are deliberately different, and neither was copied from the
 * other.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
