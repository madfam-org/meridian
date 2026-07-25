import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { UI, bi } from '@/lib/i18n';
import { AS_OF } from '@/lib/sample/common';
import { SAMPLE_MATTERS, sampleMatterById } from '@/lib/sample/matters';
import { matterStatusView, phaseLabel } from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { T, TProse } from '@/components/Bilingual';
import { NavLink } from '@/components/NavLink';
import { WorkedExampleBanner } from '@/components/WorkedExample';

import styles from './layout.module.css';

/**
 * The shell every matter page shares: who the matter is about, where it stands,
 * and the tabs between its three views.
 *
 * Pre-rendering the whole set is cheap because the sample data is static, and
 * doing it here means a broken matter id fails the build rather than a request.
 */
export function generateStaticParams(): { id: string }[] {
  return SAMPLE_MATTERS.map((m) => ({ id: m.matter.id }));
}

export default async function MatterLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id } = await params;
  const sample = sampleMatterById(id);
  if (sample === null) notFound();

  const status = matterStatusView(sample.matter.status);
  const base = `/matters/${sample.matter.id}`;

  return (
    <div className={styles.shell}>
      <WorkedExampleBanner asOf={AS_OF} />

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.identity}>
            <p className={styles.eyebrow}>
              <T text={UI.matterOverview} />{' '}
              <code className={styles.matterId}>{sample.matter.id}</code>
            </p>
            <h1 className={styles.title}>
              <T text={sample.name} />
            </h1>
          </div>
          <div className={styles.badges}>
            <Chip>{sample.matter.targetJurisdiction}</Chip>
            <Chip>
              {sample.matter.claimedNationality} → {sample.matter.targetJurisdiction}
            </Chip>
            <Badge tone={status.tone} label={status.label} />
            <Badge tone="info" label={phaseLabel(sample.matter.phase)} />
          </div>
        </div>

        <TProse text={sample.objective} className={styles.objective} />
      </header>

      <nav className={styles.tabs} aria-label="Matter views">
        <NavLink href={base} label={UI.matterOverview} exact variant="tab" />
        <NavLink href={`${base}/presence`} label={UI.matterPresence} variant="tab" />
        <NavLink href={`${base}/documents`} label={UI.matterDocuments} variant="tab" />
      </nav>

      {sample.matter.representativeId === null ? (
        <p className={styles.repStrip}>
          <span aria-hidden="true" className={styles.repMark}>
            §
          </span>
          <T
            text={bi(
              'No authorised representative is attached to this matter. Everything you see here is your own record measured against a cited rule — never a recommendation about what to do.',
              'No hay representante autorizado vinculado a este expediente. Todo lo que ve aquí es su propio registro medido frente a una norma citada, nunca una recomendación sobre qué hacer.',
            )}
          />
        </p>
      ) : null}

      <div className={styles.content}>{children}</div>
    </div>
  );
}
