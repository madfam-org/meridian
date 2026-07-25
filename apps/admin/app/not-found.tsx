/**
 * Not found.
 *
 * Reached by `notFound()` from a matter or catalog record that does not resolve,
 * and by any unrouted URL. It says which console sections exist rather than
 * offering a search box that would search nothing.
 */

import Link from 'next/link';
import { CONSOLE_ROUTES } from '@/components/routes';
import { EmptyState, Section } from '@/components/ui';

export const metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p>
        No record answers to that address. A matter reference or catalog pathway id that used to
        work may have been retired — the caseload and the review queue both surface records whose
        target no longer resolves rather than hiding them.
      </p>

      <Section id="sections" title="Console sections">
        <EmptyState title="Where to go instead">
          <ul>
            {CONSOLE_ROUTES.map((route) => (
              <li key={route.href}>
                <Link href={route.href}>{route.label}</Link> — {route.description}
              </li>
            ))}
          </ul>
        </EmptyState>
      </Section>
    </>
  );
}
