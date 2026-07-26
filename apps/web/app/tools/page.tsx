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

import { bi } from '@/lib/i18n';
import { BOUNDARY_BODY, BOUNDARY_EXCLUSIONS, BOUNDARY_TITLE } from '@/lib/tools/privacy';
import { TOOLS } from '@/lib/tools/registry';
import { T, TInline, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { Grid, Page, PageHeader, Section, Stack } from '@/components/Layout';
import { PrivacyNote } from '@/components/tools/PrivacyNote';

import styles from './tools.module.css';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Browser tools that measure your own facts against a cited rule and show the arithmetic. ' +
    'Everything is computed on your device: nothing you type is transmitted or stored.',
};

export default function ToolsIndexPage() {
  return (
    <Page>
      <PageHeader
        title={bi('Tools you can use on your own facts', 'Herramientas para sus propios datos')}
        lead={bi(
          'The rest of this portal shows what Meridian computes, using a fixed worked example. These tools run the same engines against whatever you give them — in your browser, on your device, with the rule named and the arithmetic shown.',
          'El resto de este portal muestra lo que calcula Meridian a partir de un ejemplo resuelto fijo. Estas herramientas ejecutan los mismos motores con los datos que usted introduzca: en su navegador, en su dispositivo, con la norma identificada y la aritmética a la vista.',
        )}
      />

      <PrivacyNote />

      {/* `info`, not `accent`: the privacy note above already owns the accent
          tint, and two identically-coloured boxes in a row read as one block
          that a visitor skims past. These are the two statements on the page
          that must not be skimmed past. */}
      <Callout tone="info" icon="§" title={BOUNDARY_TITLE}>
        <TProse text={BOUNDARY_BODY} />
        <ul className={styles.exclusions}>
          {BOUNDARY_EXCLUSIONS.map((item) => (
            <li key={item.en}>
              <T text={item} />
            </li>
          ))}
        </ul>
      </Callout>

      <Section
        id="available"
        title={bi('What is here', 'Qué hay aquí')}
        description={bi(
          'Listed by how little each one asks of you, not by importance. There is no recommended order and there will not be one: an ordering is a recommendation, and a recommendation is advice.',
          'Se enumeran según lo poco que le piden, no por importancia. No hay un orden recomendado ni lo habrá: un orden es una recomendación, y una recomendación es asesoramiento.',
        )}
      >
        <Grid>
          {TOOLS.map((tool) => (
            <article className={styles.tool} key={tool.id}>
              <Stack gap="sm">
                <h3 className={styles.toolName}>
                  <Link href={tool.href}>
                    <T text={tool.name} />
                  </Link>
                </h3>
                <p className={styles.toolInput}>
                  <span className={styles.toolInputLabel}>
                    <TInline text={bi('You provide', 'Usted aporta')} />
                  </span>{' '}
                  <T text={tool.input} />
                </p>
              </Stack>

              <TProse text={tool.summary} className={styles.toolSummary} />

              <dl className={styles.toolMeta}>
                <dt>
                  <TInline text={bi('Measured against', 'Se mide frente a')} />
                </dt>
                <dd>
                  <T text={tool.rule} />
                </dd>
                <dt>
                  <TInline text={bi('What it does not tell you', 'Qué no le dice')} />
                </dt>
                <dd>
                  <T text={tool.notThis} />
                </dd>
              </dl>

              <p className={styles.toolLink}>
                <Link href={tool.href}>
                  <TInline text={bi('Open this tool', 'Abrir esta herramienta')} />
                  <span aria-hidden="true"> →</span>
                </Link>
              </p>
            </article>
          ))}
        </Grid>
      </Section>

      <Section
        id="how"
        title={bi('How these differ from the rest of the site', 'En qué se diferencian del resto del sitio')}
      >
        <TProse
          text={bi(
            'Everything else in this portal is a worked example: fixed facts, computed once when the site was built, so you can check the method before trusting it with anything of your own. These tools invert that. The facts are yours and the computation happens as you press the button, but the engines, the citations and the release gate are identical — the same packages, compiled into the page instead of run on a server.',
            'Todo lo demás en este portal es un ejemplo resuelto: datos fijos, calculados una sola vez al compilar el sitio, para que pueda comprobar el método antes de confiarle nada suyo. Estas herramientas invierten eso. Los datos son suyos y el cálculo se produce al pulsar el botón, pero los motores, las citas y el control de divulgación son idénticos: los mismos paquetes, compilados dentro de la página en lugar de ejecutarse en un servidor.',
          )}
        />
      </Section>
    </Page>
  );
}
