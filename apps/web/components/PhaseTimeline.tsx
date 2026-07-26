import type { Locale } from '@/lib/i18n';
import { translator } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import type { PhaseStep } from '@/lib/matter-view';
import { phaseLabel } from '@/lib/status';

import styles from './PhaseTimeline.module.css';

/**
 * The six-stage journey, with the matter's position on it.
 *
 * Rendered as an ordered list, because that is what it is: a sequence with a
 * position, not a decorative progress bar. The three positions are marked by
 * a word, a glyph and a border weight as well as by colour, and the counts
 * beside each stage are real task counts rather than a percentage — "2 of 4
 * done" is checkable and "50%" is not.
 *
 * `aria-current="step"` puts the reader's position in the accessibility tree.
 */
export function PhaseTimeline({
  phases,
  locale,
}: {
  readonly phases: readonly PhaseStep[];
  readonly locale: Locale;
}) {
  const t = translator(locale);
  return (
    <ol className={styles.timeline}>
      {phases.map((step, index) => (
        <li
          key={step.phase}
          className={cx(styles.step, styles[step.position])}
          aria-current={step.position === 'current' ? 'step' : undefined}
        >
          <div className={styles.marker} aria-hidden="true">
            {step.position === 'done' ? '✓' : step.position === 'current' ? '▶' : index + 1}
          </div>
          <div className={styles.body}>
            <span className={styles.name}>{t(phaseLabel(step.phase))}</span>
            <span className={styles.meta}>
              {step.position === 'current' ? (
                <span className={styles.positionWord}>{t('Current stage', 'Fase actual')}</span>
              ) : step.position === 'done' ? (
                <span className={styles.positionWord}>{t('Passed', 'Superada')}</span>
              ) : (
                <span className={styles.positionWord}>{t('Not started', 'Sin empezar')}</span>
              )}
              {step.taskCount > 0 ? (
                <span className={styles.counts}>
                  {step.completeCount} / {step.taskCount}
                </span>
              ) : (
                <span className={styles.counts}>{t('no tasks', 'sin tareas')}</span>
              )}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
