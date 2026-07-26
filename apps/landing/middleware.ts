import { NextResponse, type NextRequest } from 'next/server';

import { splitLocalePath } from '@/lib/i18n';

/**
 * Address refusal, in the reader's language.
 *
 * This site serves exactly two documents — `/` in English and `/es` in Spanish
 * — and this decides what happens to everything else. The answer is: the
 * not-found document of whichever locale the address was under, with a 404
 * status, rendered from the page Next prerendered rather than from the
 * framework's built-in shell.
 *
 * ── Why a rewrite and not `notFound()` ───────────────────────────────────────
 *
 * `notFound()` thrown from a dynamically-rendered segment streams Next's own
 * 404 shell as the initial HTML: an `<html>` element with no `lang` attribute
 * and an unstyled English sentence, with the real page arriving only once
 * JavaScript has hydrated. A rewrite hands back a statically prerendered
 * document instead, so the page is complete and correctly marked before a line
 * of script runs — which is what a 404 has to be, since a reader who has landed
 * on one has already had something go wrong.
 *
 * ── Why the locale is read from the path ────────────────────────────────────
 *
 * `splitLocalePath` is the same function the switcher and the alternates use,
 * so `/es/anything` refuses in Spanish, `/anything` refuses in English, and
 * `/estimate` is English rather than a Spanish path with a strange remainder.
 * `Accept-Language` is deliberately not consulted: this is not a reader who
 * stated no preference, it is a reader whose URL said which document they were
 * looking for, and the URL is the authority.
 *
 * ── What it does not touch ──────────────────────────────────────────────────
 *
 * The matcher excludes Next's own output and the metadata routes, so nothing
 * here can turn `/sitemap.xml` or `/robots.txt` into a 404. Everything the
 * matcher does admit is either one of the two documents, which passes straight
 * through, or an address this site does not have.
 */

/** The path each locale's document is served at, with no prefix. */
const HOME = '/';

/** The route the refusal is rendered from. Never redirected to — only rewritten. */
const NOT_FOUND_SEGMENT = 'no-such-page';

export function middleware(request: NextRequest): NextResponse {
  const { locale, path } = splitLocalePath(request.nextUrl.pathname);

  // `/` and `/es`. Everything else this application does not serve.
  if (path === HOME) return NextResponse.next();

  // The *route* path, not the public one. English is unprefixed in the address
  // bar and prefixed in the route tree — `/` is served by the `/en` route — and
  // a rewrite addresses the route tree. `localizedPath` is deliberately not
  // used here: it would produce `/no-such-page`, which the router reads as the
  // home page under a locale named "no-such-page".
  const destination = new URL(`/${locale}/${NOT_FOUND_SEGMENT}`, request.nextUrl);
  return NextResponse.rewrite(destination, { status: 404 });
}

export const config = {
  /**
   * Everything except Next's own output and the metadata routes.
   *
   * Written as one negative lookahead rather than a list of positive patterns
   * because the set this must cover is "every address a person could type", and
   * enumerating that is how a 404 ends up returning 200 for the one path
   * somebody forgot.
   */
  matcher: ['/((?!_next/|icon\\.svg|robots\\.txt|sitemap\\.xml|favicon\\.ico).*)'],
};
