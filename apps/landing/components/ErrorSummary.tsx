'use client';

/**
 * Everything wrong with a submitted form, in one place, at the top.
 *
 * This exists because an inline message under a control is invisible to two
 * kinds of reader: somebody using a screen reader, whose focus is on the submit
 * button when the form fails and who is never told why; and somebody using
 * screen magnification, for whom the failing field may be several screens away
 * from the button they just pressed.
 *
 * The behaviour is the long-established one:
 *
 *  - It appears only when there is something to say.
 *  - It receives focus on every failed submit, not only the first. `focusKey`
 *    is a counter the caller increments per attempt, so a second press with the
 *    same errors re-announces rather than sitting silent while the reader
 *    wonders whether the button worked.
 *  - Each entry links to the control's own `id`, so activating it moves focus
 *    to the field that needs fixing.
 *  - It is `role="alert"`, so a reader who has moved focus elsewhere still
 *    hears that the submission failed.
 *
 * Colour carries no meaning here either: the region has a heading that says
 * what it is, and every entry is a link with text.
 */

import { useEffect, useRef } from 'react';

import { bi, type Bi } from '@/lib/i18n';
import { T } from '@/components/Bilingual';
import type { FieldIssue } from '@/lib/validation';

import styles from './ErrorSummary.module.css';

const DEFAULT_TITLE: Bi = bi(
  'Nothing was counted, because:',
  'No se contó nada, porque:',
);

export function ErrorSummary({
  id = 'sch-error-summary',
  issues,
  focusKey,
}: {
  readonly id?: string;
  readonly issues: readonly FieldIssue[];
  /**
   * Increment once per failed submit. A change moves focus here; a re-render
   * for any other reason does not, so typing in a field does not yank focus
   * away from it.
   */
  readonly focusKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastFocused = useRef(0);

  useEffect(() => {
    if (focusKey === lastFocused.current) return;
    lastFocused.current = focusKey;
    if (focusKey === 0 || issues.length === 0) return;
    ref.current?.focus();
  }, [focusKey, issues.length]);

  if (issues.length === 0) return null;

  const headingId = `${id}-heading`;

  return (
    <div
      className={styles.summary}
      id={id}
      ref={ref}
      role="alert"
      tabIndex={-1}
      aria-labelledby={headingId}
    >
      <h3 className={styles.title} id={headingId}>
        <span aria-hidden="true" className={styles.glyph}>
          ✕
        </span>
        <T text={DEFAULT_TITLE} />
      </h3>
      <ul className={styles.list}>
        {issues.map((entry) => (
          <li key={`${entry.fieldId}-${entry.message.en}`}>
            <a className={styles.link} href={`#${entry.fieldId}`}>
              <T text={entry.message} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
