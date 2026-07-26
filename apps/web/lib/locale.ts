/**
 * Reading the served locale, and the two things this app knows that
 * `@meridian/i18n` deliberately does not.
 *
 * The package operates on **public** URL paths — what is in the address bar and
 * what goes in an `href`. This app additionally has an *internal* form, because
 * `middleware.ts` rewrites `/pricing` to `/en/pricing` so a `[locale]` segment
 * has something to match. `publicPath` is the inverse of that rewrite, and it is
 * the only place in the app allowed to know about it.
 */

import { notFound } from 'next/navigation';

import type { Locale } from '@meridian/i18n';
import { DEFAULT_LOCALE, alternatePaths, parseLocale } from '@meridian/i18n';

import { SELF_URL } from '@/lib/links';

/** What every page and layout under `app/[locale]/` receives. */
export interface LocaleParams {
  readonly locale: string;
}

/**
 * The locale this page is being served in.
 *
 * `notFound()` rather than a fallback to English: the segment is
 * attacker-controlled, `generateStaticParams` publishes exactly two values, and
 * serving English under `/de/pricing` would invent a third address for a page
 * that already has two — which is the duplicate-URL problem the whole scheme is
 * arranged to avoid. `middleware.ts` already makes an unknown first segment
 * unroutable; this is the second lock on the same door.
 */
export async function readLocale(params: Promise<LocaleParams>): Promise<Locale> {
  const { locale } = await params;
  const parsed = parseLocale(locale);
  if (parsed === null) notFound();
  return parsed;
}

/**
 * The internal path Next routed, converted back to the address the reader is at.
 *
 * `usePathname()` inside a page prerendered at `/en/pricing` returns
 * `/en/pricing`; the same component running in the browser at `/pricing` returns
 * `/pricing`. Both have to produce the same switcher target, or the link changes
 * under the reader on hydration. Stripping the leading `/en` segment is what
 * makes them agree, and it is safe because `/en` is not a public path — the
 * middleware redirects it away — and no route in this app begins with a segment
 * spelled `en`.
 *
 * The default locale's prefix is the empty string in `LOCALE_PREFIX`, so this
 * cannot be expressed there; it is a property of the rewrite, not of the URL
 * scheme.
 */
export function publicPath(routed: string): string {
  const segment = `/${DEFAULT_LOCALE}`;
  if (routed === segment) return '/';
  if (routed.startsWith(`${segment}/`)) return routed.slice(segment.length);
  return routed;
}

/**
 * `hreflang` alternates for one document, as absolute URLs.
 *
 * Search engines require absolute addresses here, and `alternatePaths` returns
 * paths — this app owns the hostname. `canonical` is the current locale's own
 * address: a page that declared a different canonical would be asking to be
 * de-indexed in favour of its translation.
 *
 * Every page passes its own **locale-free** path. `alternatePaths` drops any
 * query string on purpose, because `hreflang` describes documents and the
 * document at `/pathways?jurisdiction=ES` is the document at `/pathways`.
 */
export function alternatesFor(
  path: string,
  locale: Locale,
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const paths = alternatePaths(path);
  return {
    canonical: `${SELF_URL}${paths[locale]}`,
    languages: {
      en: `${SELF_URL}${paths.en}`,
      es: `${SELF_URL}${paths.es}`,
      'x-default': `${SELF_URL}${paths['x-default']}`,
    },
  };
}
