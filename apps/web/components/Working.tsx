import type { ReactNode } from 'react';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, translator } from '@/lib/i18n';
import { cx, proportion } from '@/lib/ui';
import type { Tone } from '@/components/Badge';

import styles from './Working.module.css';

/**
 * The arithmetic, shown.
 *
 * `@meridian/presence` returns not just a total but the de-duplicated ranges
 * that produced it, the window it was measured over, and the per-record
 * attribution — because a figure a person cannot reconstruct is a figure they
 * cannot defend to an officer. This component is the render side of that
 * contract: every count on a presence page is accompanied by the terms that
 * produced it, in the order they were applied.
 *
 * Rows are marked up as a description list, so the label/value relationship
 * survives being read out linearly.
 */

export interface WorkingRow {
  readonly label: Bi;
  /** A mono operator glyph shown before the value: `−`, `+`, `=`, `÷`. Decorative. */
  readonly op?: string;
  readonly value: ReactNode;
  /** A short explanation of where the term came from. */
  readonly note?: Bi;
  /** Renders the row as the conclusion of the calculation. */
  readonly emphasis?: boolean;
  readonly tone?: Tone;
}

const TONE_CLASS: Record<Tone, string> = {
  ok: 'ok',
  warn: 'warn',
  bad: 'bad',
  info: 'info',
  review: 'review',
  neutral: 'neutral',
  accent: 'accent',
};

export function Working({
  title = bi('The arithmetic', 'La aritmética'),
  rows,
  locale,
}: {
  readonly title?: Bi;
  readonly rows: readonly WorkingRow[];
  readonly locale: Locale;
}) {
  const t = translator(locale);
  return (
    <div className={styles.working}>
      <h4 className={styles.title}>{t(title)}</h4>
      <dl className={styles.rows}>
        {rows.map((row, index) => (
          <div
            // Labels are unique within a calculation by construction; the index
            // is a tiebreak so a repeated term cannot collide.
            key={`${row.label.en}-${index}`}
            className={cx(
              styles.row,
              row.emphasis === true && styles.rowEmphasis,
              row.tone !== undefined && styles[TONE_CLASS[row.tone]],
            )}
          >
            <dt className={styles.label}>
              {t(row.label)}
              {row.note !== undefined ? <span className={styles.note}>{t(row.note)}</span> : null}
            </dt>
            <dd className={styles.value}>
              {row.op !== undefined ? (
                <span aria-hidden="true" className={styles.op}>
                  {row.op}
                </span>
              ) : null}
              <span className={styles.valueText}>{row.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * A proportional bar.
 *
 * Purely decorative — `aria-hidden`, and never the only place a number appears.
 * The caller always renders "56 of 90" as text beside it. A bar whose width is
 * the only statement of a value is unreadable to a screen-reader user and
 * unverifiable to everyone else, and this is a screen where the number is the
 * whole point.
 */
export function Meter({
  used,
  limit,
  tone = 'accent',
}: {
  readonly used: number;
  readonly limit: number;
  readonly tone?: Tone;
}) {
  const pct = proportion(used, limit);
  return (
    <div className={styles.meter} aria-hidden="true">
      <div
        className={cx(styles.meterFill, styles[`meter-${TONE_CLASS[tone]}`])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
