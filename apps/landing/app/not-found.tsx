import { bi } from '@/lib/i18n';
import { T, TProse } from '@/components/Bilingual';
import { PORTAL_URL, REPO_URL } from '@/lib/links';
import { Page, PageHeader, Section } from '@/components/Layout';

import styles from './not-found.module.css';

/**
 * Not found.
 *
 * Kept plain and specific. This site is one document, so an address that does
 * not resolve here is a mistyped link rather than anything to do with a matter,
 * and saying so is more useful than a friendly apology.
 */
export default function NotFound() {
  return (
    <Page>
      <PageHeader
        title={bi('That address does not resolve', 'Esa dirección no existe')}
        lead={bi(
          'Nothing on this site answers to it. This is the explainer for Meridian and it is a single page; the applicant portal is a separate application on its own hostname.',
          'Nada en este sitio responde a ella. Esta es la página explicativa de Meridian y consta de un solo documento; el portal del solicitante es una aplicación aparte con su propio nombre de host.',
        )}
      />
      <Section id="not-found-links" title={bi('Where to go instead', 'Adónde ir')}>
        <ul className={styles.links}>
          <li>
            <a href="/">
              <T text={bi('What Meridian is', 'Qué es Meridian')} />
            </a>
          </li>
          <li>
            <a href="/#advice-boundary">
              <T text={bi('The advice boundary', 'La frontera del asesoramiento')} />
            </a>
          </li>
          <li>
            <a href="/#status">
              <T text={bi('What is and is not built', 'Qué está construido y qué no')} />
            </a>
          </li>
          <li>
            <a href={PORTAL_URL}>
              <T text={bi('The applicant portal', 'El portal del solicitante')} />
            </a>
          </li>
          <li>
            <a href={REPO_URL} rel="noreferrer noopener" target="_blank">
              <T text={bi('The source on GitHub', 'El código fuente en GitHub')} />
            </a>
          </li>
        </ul>
        <TProse
          text={bi(
            'The portal and the source are separate applications on their own addresses, so a link that fails there is a different failure from this one, and neither is a lost record: this site holds no account and no database, and there is nothing here that could have gone missing.',
            'El portal y el código fuente son aplicaciones distintas con sus propias direcciones, así que un enlace que falle allí es un fallo distinto de este, y ninguno de los dos es un registro perdido: este sitio no tiene cuentas ni base de datos, y aquí no hay nada que se haya podido extraviar.',
          )}
        />
      </Section>
    </Page>
  );
}
