import type { Metadata } from 'next';

import {
  DEFAULT_LOCALE,
  LOCALES,
  parseLocale,
  localizedPath,
  translator,
  type Locale,
} from '@/lib/i18n';
import { Prose } from '@/components/Text';
import { PORTAL_URL, REPO_URL } from '@/lib/links';
import { Page, PageHeader, Section } from '@/components/Layout';

import styles from './page.module.css';

/**
 * Not found — the document served for any address this site does not answer to.
 *
 * ── Why it is a route rather than `not-found.tsx` ────────────────────────────
 *
 * A `not-found` boundary receives no route params, so it cannot know which
 * language the address it is refusing was under; and `notFound()` thrown from a
 * dynamically-rendered segment streams Next's own built-in 404 shell as the
 * initial HTML — an `<html>` element with no `lang` attribute and an unstyled
 * English sentence — with the real page arriving only once JavaScript has
 * hydrated. Both are the exact defect this change exists to remove.
 *
 * A route under `[locale]` has neither problem. It is prerendered once per
 * locale, so a reader who mistypes a Spanish address gets a Spanish page with
 * `<html lang="es">`, statically, with no JavaScript involved. `middleware.ts`
 * is what points unmatched addresses here, and it attaches the 404 status the
 * document is served with — the status belongs on the response, not in the
 * copy, so a crawler is told this is not a page rather than indexing it as one.
 *
 * It is reachable directly, at `/no-such-page` and `/es/no-such-page`. That is
 * not a leak: the middleware refuses those two addresses like any other, so
 * asking for the not-found page by name returns the not-found page with a 404.
 */
export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const locale = parseLocale((await params).locale) ?? DEFAULT_LOCALE;
  const t = translator(locale);
  return {
    title: t('Address not found — Meridian', 'Dirección no encontrada — Meridian'),
    // No canonical and no alternates: this document is a status, not a
    // destination, and telling a crawler that a mistyped address is the
    // canonical form of anything is the one thing this page must not do.
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams(): { readonly locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function NoSuchPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}) {
  const locale = parseLocale((await params).locale) ?? DEFAULT_LOCALE;
  const t = translator(locale);
  const home = localizedPath('/', locale);

  return (
    <Page>
      <PageHeader
        title={t('That address does not resolve', 'Esa dirección no existe')}
        lead={t(
          'Nothing on this site answers to it. This is the explainer for Meridian and it is a single page; the applicant portal is a separate application on its own hostname.',
          'Nada en este sitio responde a ella. Esta es la página explicativa de Meridian y consta de un solo documento; el portal del solicitante es una aplicación aparte con su propio nombre de host.',
        )}
      />
      <Section id="not-found-links" title={t('Where to go instead', 'Adónde ir')}>
        <ul className={styles.links}>
          <li>
            <a href={home}>{t('What Meridian is', 'Qué es Meridian')}</a>
          </li>
          <li>
            <a href={`${home}#advice-boundary`}>
              {t('The advice boundary', 'La frontera del asesoramiento')}
            </a>
          </li>
          <li>
            <a href={`${home}#status`}>
              {t('What is and is not built', 'Qué está construido y qué no')}
            </a>
          </li>
          <li>
            <a href={PORTAL_URL}>{t('The applicant portal', 'El portal del solicitante')}</a>
          </li>
          <li>
            <a href={REPO_URL} rel="noreferrer noopener" target="_blank">
              {t('The source on GitHub', 'El código fuente en GitHub')}
            </a>
          </li>
        </ul>
        <Prose>
          {t(
            'The portal and the source are separate applications on their own addresses, so a link that fails there is a different failure from this one, and neither is a lost record: this site holds no account and no database, and there is nothing here that could have gone missing.',
            'El portal y el código fuente son aplicaciones distintas con sus propias direcciones, así que un enlace que falle allí es un fallo distinto de este, y ninguno de los dos es un registro perdido: este sitio no tiene cuentas ni base de datos, y aquí no hay nada que se haya podido extraviar.',
          )}
        </Prose>
      </Section>
    </Page>
  );
}
