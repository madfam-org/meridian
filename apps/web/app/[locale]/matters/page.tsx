import type { Metadata } from 'next';
import Link from 'next/link';

import { MATTER_PHASE_ORDER, phaseIndex } from '@meridian/core';

import { localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { AS_OF } from '@/lib/sample/common';
import { SAMPLE_MATTERS } from '@/lib/sample/matters';
import { buildMatterView } from '@/lib/matter-view';
import { matterStatusView, phaseLabel } from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { CivilDate, Page, PageHeader, Section, Stack } from '@/components/Layout';
import { WorkedExampleBanner } from '@/components/WorkedExample';

import styles from './matters.module.css';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  return {
    title: locale === 'en' ? 'Matters' : 'Expedientes',
    alternates: alternatesFor('/matters', locale),
  };
}

export default async function MattersPage({ params }: { readonly params: Promise<LocaleParams> }) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const at = (path: string): string => localizedPath(path, locale);

  return (
    <Page>
      <PageHeader
        title={t('Your matters', 'Sus expedientes')}
        lead={t(
          'One matter is one objective in one jurisdiction under one route. Each carries its own phase, its own sequential task list and its own day counters.',
          'Un expediente es un objetivo en una jurisdicción por una vía. Cada uno tiene su propia fase, su propia lista secuencial de tareas y su propio cómputo de días.',
        )}
      />

      <WorkedExampleBanner locale={locale} asOf={AS_OF} />

      <Section id="matter-list" title={t('Open matters', 'Expedientes abiertos')}>
        <Stack gap="md">
          {SAMPLE_MATTERS.map((sample) => {
            const view = buildMatterView(sample.tasks, sample.matter.phase);
            const status = matterStatusView(sample.matter.status);
            const position = phaseIndex(sample.matter.phase) + 1;

            return (
              <article key={sample.matter.id} className={styles.matter}>
                <div className={styles.matterHead}>
                  <h3 className={styles.matterTitle}>
                    <Link href={at(`/matters/${sample.matter.id}`)}>{t(sample.name)}</Link>
                  </h3>
                  <div className={styles.matterBadges}>
                    <Chip>{sample.matter.targetJurisdiction}</Chip>
                    <Badge tone={status.tone} label={t(status.label)} />
                  </div>
                </div>

                <p className={styles.matterObjective}>{t(sample.objective)}</p>

                <dl className={styles.matterFacts}>
                  <div>
                    <dt>{t('Phase', 'Fase')}</dt>
                    <dd>
                      {t(phaseLabel(sample.matter.phase))}
                      <span className={styles.phaseCount}>
                        {' '}
                        {position} / {MATTER_PHASE_ORDER.length}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Tasks complete', 'Tareas completadas')}</dt>
                    <dd>
                      {view.completedCount} / {view.tasks.length}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Opened', 'Iniciado')}</dt>
                    <dd>
                      <CivilDate value={sample.matter.openedOn} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Representative', 'Representante')}</dt>
                    <dd>
                      {sample.matter.representativeId === null ? (
                        <Badge tone="warn" label={t('None assigned', 'Ninguno asignado')} />
                      ) : (
                        <Badge tone="ok" label={t('Assigned', 'Asignado')} />
                      )}
                    </dd>
                  </div>
                </dl>

                <div className={styles.matterLinks}>
                  <Link href={at(`/matters/${sample.matter.id}`)} className={styles.matterLink}>
                    {t('Overview and tasks', 'Resumen y tareas')}
                  </Link>
                  <Link
                    href={at(`/matters/${sample.matter.id}/presence`)}
                    className={styles.matterLink}
                  >
                    {t('Day counters', 'Cómputo de días')}
                  </Link>
                  <Link
                    href={at(`/matters/${sample.matter.id}/documents`)}
                    className={styles.matterLink}
                  >
                    {t('Documents', 'Documentos')}
                  </Link>
                </div>
              </article>
            );
          })}
        </Stack>
      </Section>

      <Callout
        tone="info"
        icon="i"
        title={t('There is no way to add a matter yet', 'Todavía no se puede añadir un expediente')}
      >
        <p>
          {t(
            'This portal has no account, no sign-in and no database behind it. The two matters above are declared in the application’s own source and are rebuilt from scratch on every deploy. When persistence exists, this is where creating a matter will live.',
            'Este portal no tiene cuenta, ni inicio de sesión, ni base de datos detrás. Los dos expedientes anteriores están declarados en el propio código de la aplicación y se reconstruyen desde cero en cada despliegue. Cuando exista persistencia, la creación de expedientes estará aquí.',
          )}
        </p>
      </Callout>
    </Page>
  );
}
