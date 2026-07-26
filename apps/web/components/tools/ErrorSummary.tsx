'use client';

/**
 * The list of everything wrong with a submitted form, in one place, at the top.
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
 *  - It receives focus on every failed submit — not only the first. `focusKey`
 *    is a counter the caller increments per attempt, so a second press with the
 *    same errors re-announces rather than sitting silent while the reader
 *    wonders whether the button worked.
 *  - Each entry is a link to the control's own `id`, so activating it moves
 *    focus to the field that needs fixing. `Field` puts that id on the control
 *    itself rather than on a wrapper, which is what makes the jump land on
 *    something focusable.
 *  - It is `role="alert"`, so a reader who has moved focus elsewhere still
 *    hears that the submission failed.
 *
 * Colour is not carrying meaning here either: the region has a heading that
 * says what it is, and every entry is a link with text.
 */

import { useEffect, useRef } from 'react';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, translator } from '@/lib/i18n';
import type { FieldIssue } from '@/lib/tools/validation';

import styles from './ErrorSummary.module.css';

export interface ErrorSummaryProps {
  /** DOM id of the region. Defaults to `error-summary`. */
  readonly id?: string;
  readonly title?: Bi;
  readonly issues: readonly FieldIssue[];
  /**
   * Increment once per failed submit. A change moves focus here; a re-render
   * for any other reason does not, so typing in a field does not yank focus
   * away from it.
   */
  readonly focusKey: number;
  readonly locale: Locale;
}

const DEFAULT_TITLE: Bi = bi(
  'This form was not checked, because:',
  'No se comprobó este formulario, porque:',
);

export function ErrorSummary({
  id = 'error-summary',
  title,
  issues,
  focusKey,
  locale,
}: ErrorSummaryProps) {
  const t = translator(locale);
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
      <h2 className={styles.title} id={headingId}>
        <span aria-hidden="true" className={styles.glyph}>
          ✕
        </span>
        {t(title ?? DEFAULT_TITLE)}
      </h2>
      <ul className={styles.list}>
        {issues.map((issue) => (
          <li key={`${issue.fieldId}-${issue.message.en}`}>
            <a className={styles.link} href={`#${issue.fieldId}`}>
              {t(issue.message)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
