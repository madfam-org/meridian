/**
 * The locale prefix, in and out of the URL.
 *
 * English is unprefixed and Spanish is `/es` — `/pricing` is English,
 * `/es/pricing` is Spanish. Next's `[locale]` segment cannot express that on its
 * own: a dynamic segment always consumes one path segment, so `/pricing` would
 * be read as locale `pricing`. This file is the two lines of translation between
 * the public address and the internal route:
 *
 *  - `/es/...` already matches `app/[locale]/...`, so it passes through.
 *  - everything else is *rewritten* to `/en/...`. The browser's address bar is
 *    untouched; Next serves the prerendered `/en/...` page.
 *  - `/en/...` is **redirected** to the unprefixed form, permanently. It is not a
 *    public address, and leaving it reachable would publish every English page
 *    under two URLs, split their ranking, and make the `hreflang` set
 *    self-contradictory.
 *
 * Everything stays statically generated. A rewrite selects which prerendered
 * document to serve; it does not make the route dynamic, which is why locale
 * lives here rather than in a cookie — a cookie would either flash the wrong
 * language on hydration or force every page to render per request.
 *
 * **`Accept-Language` is deliberately not consulted.** Negotiation may only
 * decide where to send a reader who has stated no preference, and every request
 * that reaches this file has already stated one: the URL. Redirecting `/pricing`
 * to `/es/pricing` because the browser prefers Spanish would break the case this
 * whole design exists for — a link someone sends to a Spanish speaker has to stay
 * Spanish, and a link sent to an English speaker has to stay English. The reader
 * chooses with the switcher in the header, and the choice is the address they end
 * up at.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { DEFAULT_LOCALE, LOCALE_PREFIX, splitLocalePath } from '@meridian/i18n';

/**
 * The internal segment the default locale is served under. `LOCALE_PREFIX.en` is
 * the empty string — that is the public form — so the routed form is spelled
 * once here rather than assumed at three call sites.
 */
const DEFAULT_SEGMENT = `/${DEFAULT_LOCALE}`;

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // `/en/pricing` is the internal form leaking outward. Send it to `/pricing`.
  if (pathname === DEFAULT_SEGMENT || pathname.startsWith(`${DEFAULT_SEGMENT}/`)) {
    const url = request.nextUrl.clone();
    const rest = pathname.slice(DEFAULT_SEGMENT.length);
    url.pathname = rest === '' ? '/' : rest;
    return NextResponse.redirect(url, 308);
  }

  const { explicit, path } = splitLocalePath(pathname);

  // `/es/...` is already the routed shape.
  if (explicit) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = path === '/' ? DEFAULT_SEGMENT : `${DEFAULT_SEGMENT}${path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /**
   * Everything except Next's own assets and the metadata routes, which live at
   * the root of `app/` and are not localised: `robots.txt` and `sitemap.xml` are
   * one document each for the whole site, and `icon.svg` is a picture.
   */
  matcher: ['/((?!_next/|icon\\.svg|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};

/**
 * This file is only correct while the default locale owns the bare paths: the
 * rewrite above sends `/pricing` to `/en/pricing` precisely because `/pricing`
 * carries no prefix of its own. `LOCALE_PREFIX` is the single declaration of
 * that asymmetry, so the assumption is checked against it here rather than left
 * implicit — if a future default locale gained a prefix, this would stop
 * building instead of silently double-publishing every page.
 */
if (LOCALE_PREFIX[DEFAULT_LOCALE] !== '') {
  throw new Error(
    `middleware assumes the default locale is unprefixed; LOCALE_PREFIX.${DEFAULT_LOCALE} is ` +
      `"${LOCALE_PREFIX[DEFAULT_LOCALE]}". Rewriting to "${DEFAULT_SEGMENT}" would be wrong.`,
  );
}
