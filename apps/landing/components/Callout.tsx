import type { ReactNode } from 'react';

import { cx } from '@/lib/ui';
import type { Tone } from '@/components/Badge';

import styles from './Callout.module.css';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'ok',
  warn: 'warn',
  bad: 'bad',
  info: 'info',
  review: 'review',
  neutral: 'neutral',
  accent: 'accent',
};

/**
 * A boxed aside. `role="note"` rather than `role="alert"`: nothing on this page
 * is an interruption, and a statement about what the product will not do is not
 * an error condition. The heading is a real heading, so the box appears in the
 * document outline instead of being a coloured rectangle a screen-reader user
 * walks past.
 *
 * `level` exists because a heading level is a position in the outline, not a
 * size. Inside a section the callout's heading sits under that section's `h2`;
 * the one callout that sits directly under the page title has to be an `h2`
 * itself, or the outline jumps from `h1` to `h3` and a screen-reader user is
 * told there is a missing level between them. Both render identically.
 */
export function Callout({
  tone,
  title,
  icon,
  level = 3,
  children,
}: {
  readonly tone: Tone;
  readonly title: string;
  readonly icon?: string;
  readonly level?: 2 | 3;
  readonly children: ReactNode;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <aside className={cx(styles.callout, styles[TONE_CLASS[tone]])} role="note">
      <Heading className={styles.title}>
        {icon !== undefined ? (
          <span aria-hidden="true" className={styles.icon}>
            {icon}
          </span>
        ) : null}
        {title}
      </Heading>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
