import type { Citation } from '@meridian/core';

import type { Locale } from '@/lib/i18n';
import { translator } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import type { TaskView } from '@/lib/matter-view';
import { assigneeLabel, phaseLabel, taskStatusView } from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { CitationRefs } from '@/components/Citations';

import styles from './TaskList.module.css';

/**
 * The sequential task list, with every lock explained.
 *
 * A locked row always states *what* is holding it: the specific prerequisite
 * tasks by name and their current status, the phase gate, or both. A greyed-out
 * row with no reason is the fastest way to make a checklist useless — the
 * reader concludes either that the software is broken or that they have missed
 * something, and neither is true.
 *
 * Where a task is assigned to a representative and none is attached to the
 * matter, that is said on the row rather than left for the reader to work out
 * from a page further up.
 */
export function TaskList({
  tasks,
  hasRepresentative,
  citations,
  locale,
}: {
  readonly tasks: readonly TaskView[];
  readonly hasRepresentative: boolean;
  /** Resolved sources, so a task can link its citations to the list below. */
  readonly citations: readonly Citation[];
  readonly locale: Locale;
}) {
  const t = translator(locale);
  const known = new Set(citations.map((x) => x.id));

  return (
    <ol className={styles.list}>
      {tasks.map((view) => {
        const status = taskStatusView(view.status);
        const locked = view.status === 'locked';
        const orphaned = view.task.assignee === 'representative' && !hasRepresentative;

        return (
          <li key={view.task.id} className={cx(styles.item, locked && styles.itemLocked)}>
            <div className={styles.head}>
              <div className={styles.headMain}>
                {/* Decorative only — the badge to the right states the status in words. */}
                <span className={styles.marker} aria-hidden="true">
                  {locked ? '–' : view.status === 'complete' ? '✓' : '○'}
                </span>
                <h4 className={styles.title}>{t(view.title)}</h4>
              </div>
              <div className={styles.badges}>
                <Badge tone={status.tone} label={t(status.label)} />
              </div>
            </div>

            {view.detail !== undefined ? <p className={styles.detail}>{t(view.detail)}</p> : null}

            <div className={styles.meta}>
              <Chip>{t(phaseLabel(view.task.phase))}</Chip>
              <span className={styles.assignee}>
                {t('Owner', 'Responsable')}
                {': '}
                {t(assigneeLabel(view.task.assignee))}
              </span>
              {view.task.citationIds.length > 0 ? (
                <CitationRefs ids={view.task.citationIds.filter((id) => known.has(id))} />
              ) : null}
            </div>

            {orphaned ? (
              <p className={styles.orphaned}>
                <span aria-hidden="true">! </span>
                {t(
                  'This task is assigned to an authorised representative, and none is attached to this matter. Nobody currently owns it.',
                  'Esta tarea está asignada a un representante autorizado, y no hay ninguno vinculado a este expediente. Actualmente no tiene responsable.',
                )}
              </p>
            ) : null}

            {locked ? (
              <div className={styles.lockBox}>
                <h5 className={styles.lockTitle}>
                  {t('Why this is locked', 'Por qué está bloqueada')}
                </h5>
                <ul className={styles.lockList}>
                  {view.blockedByPhase ? (
                    <li>
                      {t(
                        'It belongs to a later stage of the matter than the one currently open.',
                        'Pertenece a una fase posterior a la que está abierta actualmente.',
                      )}{' '}
                      <span className={styles.lockDetail}>{t(phaseLabel(view.task.phase))}</span>
                    </li>
                  ) : null}

                  {view.blockedBy.map((blocker) => {
                    const blockerStatus = taskStatusView(blocker.status);
                    return (
                      <li key={blocker.taskId}>
                        {t('Waiting on', 'A la espera de')}{' '}
                        <span className={styles.lockDetail}>{t(blocker.title)}</span>{' '}
                        <Badge tone={blockerStatus.tone} label={t(blockerStatus.label)} />
                      </li>
                    );
                  })}

                  {view.danglingDependencies.map((id) => (
                    <li key={id}>
                      {t(
                        'It depends on a task that does not exist in this matter, which is a defect in the matter rather than something you can act on:',
                        'Depende de una tarea que no existe en este expediente, lo cual es un defecto del expediente y no algo sobre lo que usted pueda actuar:',
                      )}{' '}
                      <code className={styles.lockDetail}>{id}</code>
                    </li>
                  ))}

                  {!view.blockedByPhase &&
                  view.blockedBy.length === 0 &&
                  view.danglingDependencies.length === 0 ? (
                    <li>
                      {t(
                        'No prerequisite is outstanding. The task is recorded as locked and should have opened — report this.',
                        'No queda ningún requisito previo pendiente. La tarea consta como bloqueada y debería haberse abierto: comuníquelo.',
                      )}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
