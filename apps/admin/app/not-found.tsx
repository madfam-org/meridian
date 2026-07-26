/**
 * Not found.
 *
 * Reached by any unrouted URL, in either locale. Next resolves those against the
 * root of the tree, which is why this file sits beside `app/layout.tsx` rather
 * than inside the `[locale]` segment — a not-found nested in a dynamic segment
 * is not the boundary an unmatched URL lands on, and the result was a bare
 * framework document with no `lang` and an English message for a Spanish reader.
 *
 * `notFound()` raised from inside a page does **not** reach here; Next serves
 * its own error shell for that during a dynamic render, and did so before any of
 * this. See the note in `app/layout.tsx`.
 *
 * The locale therefore comes from the header `middleware.ts` sets, exactly as it
 * does for the frame around this page. There are no route params here to read it
 * from, and guessing would put an English 404 in front of a reader who has been
 * in Spanish for the last ten minutes.
 *
 * It says which console sections exist rather than offering a search box that
 * would search nothing.
 */

import Link from 'next/link';
import { headers } from 'next/headers';
import { CONSOLE_ROUTES } from '@/components/routes';
import { EmptyState, Section } from '@/components/ui';
import { UI, localizedPath, pick, servedLocale } from '@/lib/i18n';
import { LOCALE_HEADER } from '@/middleware';

export default async function NotFound() {
  const locale = servedLocale((await headers()).get(LOCALE_HEADER));

  return (
    <>
      <h1>{pick(UI.notFoundTitle, locale)}</h1>
      <p>{pick(UI.notFoundBody, locale)}</p>

      <Section id="sections" title={pick(UI.notFoundSections, locale)}>
        <EmptyState title={pick(UI.notFoundWhereInstead, locale)}>
          <ul>
            {CONSOLE_ROUTES.map((route) => (
              <li key={route.href}>
                <Link href={localizedPath(route.href, locale)}>{pick(route.label, locale)}</Link> —{' '}
                {pick(route.description, locale)}
              </li>
            ))}
          </ul>
        </EmptyState>
      </Section>
    </>
  );
}
