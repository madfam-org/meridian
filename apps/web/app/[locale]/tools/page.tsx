/**
 * The tools index.
 *
 * Everywhere else in this portal shows a worked example: a fixed matter, a
 * fixed set of dates, a figure computed at build time. That is enough to show
 * that Meridian's arithmetic is checkable, and not enough to tell a visitor
 * anything about their own situation. These tools close that gap — the same
 * engines, the same citations, the same disclosure classification, run against
 * facts the visitor supplies, in their own browser.
 *
 * The page states two things once and states them well: nothing typed into
 * these tools leaves the device, and nothing they produce is advice. Both are
 * repeated on each tool page, because a person who arrives from a search result
 * never sees this one.
 *
 * A server component. It holds no state and imports no engine; the interactive
 * part of each tool lives behind its own route.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { BOUNDARY_BODY, BOUNDARY_EXCLUSIONS, BOUNDARY_TITLE } from '@/lib/tools/privacy';
import { TOOLS } from '@/lib/tools/registry';
import { Callout } from '@/components/Callout';
import { CoverageBoundary } from '@/components/CoverageBoundary';
import { Grid, Page, PageHeader, Section, Stack } from '@/components/Layout';
import { PrivacyNote } from '@/components/tools/PrivacyNote';

import styles from './tools.module.css';

const TITLE = { en: 'Tools', es: 'Herramientas' } as const;

const DESCRIPTION = {
  en:
    'Browser tools that measure your own facts against a cited rule and show the arithmetic. ' +
    'Everything is computed on your device: nothing you type is transmitted or stored.',
  es:
    'Herramientas de navegador que contrastan sus propios datos con una norma citada y muestran la ' +
    'aritmética. Todo se calcula en su dispositivo: nada de lo que escribe se transmite ni se almacena.',
} as const;

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  return {
    title: TITLE[locale],
    description: DESCRIPTION[locale],
    alternates: alternatesFor('/tools', locale),
  };
}

export default async function ToolsIndexPage({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const at = (path: string): string => localizedPath(path, locale);

  return (
    <Page>
      <PageHeader
        title={t('Tools you can use on your own facts', 'Herramientas para sus propios datos')}
        lead={t(
          'The rest of this portal shows what Meridian computes, using a fixed worked example. These tools run the same engines against whatever you give them — in your browser, on your device, with the rule named and the arithmetic shown.',
          'El resto de este portal muestra lo que calcula Meridian a partir de un ejemplo resuelto fijo. Estas herramientas ejecutan los mismos motores con los datos que usted introduzca: en su navegador, en su dispositivo, con la norma identificada y la aritmética a la vista.',
        )}
      />

      <PrivacyNote locale={locale} />

      {/* `info`, not `accent`: the privacy note above already owns the accent
          tint, and two identically-coloured boxes in a row read as one block
          that a visitor skims past. These are the two statements on the page
          that must not be skimmed past. */}
      <Callout tone="info" icon="§" title={t(BOUNDARY_TITLE)}>
        <p>{t(BOUNDARY_BODY)}</p>
        <ul className={styles.exclusions}>
          {BOUNDARY_EXCLUSIONS.map((item) => (
            <li key={item.en}>{t(item)}</li>
          ))}
        </ul>
      </Callout>

      {/*
        The callout above says these tools will not recommend. This one says
        something different and equally load-bearing: what they measure against
        is a small catalog, and a route missing from it produces the same silence
        as a route the reader does not qualify for. The two are indistinguishable
        from a result screen unless the missing routes are named, so they are
        named — derived from the catalog, so the claim cannot outlive the code.
      */}
      <CoverageBoundary locale={locale} />

      <Section
        id="available"
        title={t('What is here', 'Qué hay aquí')}
        description={t(
          'Listed by how little each one asks of you, not by importance. There is no recommended order and there will not be one: an ordering is a recommendation, and a recommendation is advice.',
          'Se enumeran según lo poco que le piden, no por importancia. No hay un orden recomendado ni lo habrá: un orden es una recomendación, y una recomendación es asesoramiento.',
        )}
      >
        <Grid>
          {TOOLS.map((tool) => (
            <article className={styles.tool} key={tool.id}>
              <Stack gap="sm">
                <h3 className={styles.toolName}>
                  <Link href={at(tool.href)}>{t(tool.name)}</Link>
                </h3>
                <p className={styles.toolInput}>
                  <span className={styles.toolInputLabel}>{t('You provide', 'Usted aporta')}</span>{' '}
                  {t(tool.input)}
                </p>
              </Stack>

              <p className={styles.toolSummary}>{t(tool.summary)}</p>

              <dl className={styles.toolMeta}>
                <dt>{t('Measured against', 'Se mide frente a')}</dt>
                <dd>{t(tool.rule)}</dd>
                <dt>{t('What it does not tell you', 'Qué no le dice')}</dt>
                <dd>{t(tool.notThis)}</dd>
              </dl>

              <p className={styles.toolLink}>
                <Link href={at(tool.href)}>
                  {t('Open this tool', 'Abrir esta herramienta')}
                  <span aria-hidden="true"> →</span>
                </Link>
              </p>
            </article>
          ))}
        </Grid>
      </Section>

      <Section
        id="how"
        title={t(
          'How these differ from the rest of the site',
          'En qué se diferencian del resto del sitio',
        )}
      >
        <p>
          {t(
            'Everything else in this portal is a worked example: fixed facts, computed once when the site was built, so you can check the method before trusting it with anything of your own. These tools invert that. The facts are yours and the computation happens as you press the button, but the engines, the citations and the release gate are identical — the same packages, compiled into the page instead of run on a server.',
            'Todo lo demás en este portal es un ejemplo resuelto: datos fijos, calculados una sola vez al compilar el sitio, para que pueda comprobar el método antes de confiarle nada suyo. Estas herramientas invierten eso. Los datos son suyos y el cálculo se produce al pulsar el botón, pero los motores, las citas y el control de divulgación son idénticos: los mismos paquetes, compilados dentro de la página en lugar de ejecutarse en un servidor.',
          )}
        </p>
      </Section>
    </Page>
  );
}
