/**
 * The locale segment.
 *
 * It renders no markup. The console frame is in `app/layout.tsx`, because Next
 * resolves `notFound()` and every unmatched URL against the root of the tree and
 * a 404 has to arrive inside the same frame, with the same `lang`, as every
 * other screen. See that file for the full argument.
 *
 * What this layout does is the work only a segment can do: enumerate the
 * locales, say the page's metadata in the right language, and refuse a segment
 * that is not a locale.
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { LOCALES, UI, htmlLang, localizedPath, parseLocale, pick } from '@/lib/i18n';
import { SELF_URL } from '@/lib/links';

/**
 * Both locales, so the segment is closed rather than open and either variant can
 * be prerendered where a route allows it.
 *
 * Every page in this console is `force-dynamic` — each reads a clock and a query
 * string — so nothing is actually prerendered today. Declaring the params is
 * still worth doing: it makes the set of locales enumerable at build time, and
 * it makes adding a third one a change in `@meridian/i18n` that this file
 * follows, rather than a surprise in production.
 */
export function generateStaticParams(): { locale: string }[] {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();

  const title = pick(UI.consoleName, locale);
  const description = pick(UI.consoleDescription, locale);

  return {
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    // Share metadata is worth having, and it is not in tension with the
    // `noindex` the root layout sets: a console URL pasted into a practice's own
    // chat should say what it is, and an unfurl is a fetch by a client the
    // reader invited, not a crawler indexing the open web. Nothing
    // tenant-specific appears here — the description is about the product, not
    // about whose files are behind it.
    openGraph: {
      type: 'website',
      siteName: 'Meridian',
      url: new URL(localizedPath('/', locale), SELF_URL).toString(),
      locale: htmlLang(locale),
      title,
      description,
    },
    twitter: {
      // `summary`, not `summary_large_image`: no image ships, and declaring a
      // large-image card without one produces an empty grey banner.
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // The segment is attacker-controlled in principle — the middleware only ever
  // produces `en` or `es`, but a request that reached here another way must 404
  // rather than render a page under a stranger's locale.
  if (parseLocale((await params).locale) === null) notFound();
  return <>{children}</>;
}
