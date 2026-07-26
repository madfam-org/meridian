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
 * A boxed aside. `role="note"` rather than `role="alert"`: nothing on these
 * pages is an interruption, and a caveat about administrative practice is not
 * an error condition. The heading is a real heading so the box appears in the
 * document outline instead of being a coloured rectangle a screen-reader user
 * walks past.
 */
export function Callout({
  tone,
  title,
  icon,
  children,
}: {
  readonly tone: Tone;
  /** Already resolved to the served locale by the caller. */
  readonly title: string;
  readonly icon?: string;
  readonly children: ReactNode;
}) {
  return (
    <aside className={cx(styles.callout, styles[TONE_CLASS[tone]])} role="note">
      <h3 className={styles.title}>
        {icon !== undefined ? (
          <span aria-hidden="true" className={styles.icon}>
            {icon}
          </span>
        ) : null}
        {title}
      </h3>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
