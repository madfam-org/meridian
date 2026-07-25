import Link from 'next/link';

import { bi } from '@/lib/i18n';
import { T, TProse } from '@/components/Bilingual';
import { Page, PageHeader, Section } from '@/components/Layout';

import styles from './not-found.module.css';

/**
 * Not found.
 *
 * Kept plain and specific: an address that does not resolve is not the same as
 * a matter with nothing in it, and a friendly "nothing here yet" would leave
 * someone wondering whether their file had been lost.
 */
export default function NotFound() {
  return (
    <Page>
      <PageHeader
        title={bi('That address does not resolve', 'Esa dirección no existe')}
        lead={bi(
          'Nothing in this build answers to it. That is a missing page, not a missing record — no matter, document or day count has been lost.',
          'Nada en esta compilación responde a ella. Se trata de una página inexistente, no de un registro perdido: no se ha perdido ningún expediente, documento ni cómputo de días.',
        )}
      />
      <Section id="not-found-links" title={bi('Where to go instead', 'Adónde ir')}>
        <ul className={styles.links}>
          <li>
            <Link href="/">
              <T text={bi('What Meridian does', 'Qué hace Meridian')} />
            </Link>
          </li>
          <li>
            <Link href="/matters">
              <T text={bi('Matters', 'Expedientes')} />
            </Link>
          </li>
          <li>
            <Link href="/pathways">
              <T text={bi('The rule catalog', 'El catálogo de normas')} />
            </Link>
          </li>
        </ul>
        <TProse
          text={bi(
            'This portal ships two worked examples and no way to create a third; there is no account system behind it yet.',
            'Este portal incluye dos ejemplos resueltos y ninguna forma de crear un tercero; todavía no hay un sistema de cuentas detrás.',
          )}
        />
      </Section>
    </Page>
  );
}
