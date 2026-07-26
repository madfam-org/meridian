'use client';

/**
 * The shell every tool result is rendered inside.
 *
 * Its job is the part that is easy to forget: a result computed in the browser
 * appears silently. Nothing navigates, no page reloads, and a reader who is not
 * looking at the right part of the screen — or not looking at the screen at all
 * — has no way to know the answer arrived. So the panel takes focus when a
 * result is produced, exactly as the error summary does when one is not, and
 * the two are mutually exclusive by construction: a tool either has issues or
 * has a result.
 *
 * `focusKey` is a counter the caller increments per successful run, so
 * re-checking the same input still announces the panel. Focus, rather than an
 * `aria-live` region, because the panel is long: a live region would read the
 * entire result aloud with no way to stop or re-read it, whereas moving focus
 * to the heading announces what arrived and leaves the reader in control of the
 * rest.
 *
 * The verdict is a `Badge`, which always carries a glyph and a word beside its
 * colour, so "self-consistent" and "not self-consistent" are never distinguished
 * by hue alone.
 */

import { useEffect, useRef, type ReactNode } from 'react';

import type { Bi } from '@/lib/i18n';
import { Badge, type Tone } from '@/components/Badge';
import { T } from '@/components/Bilingual';

import styles from './ResultPanel.module.css';

export interface ResultPanelProps {
  /** DOM id of the region. Also the base for its heading id. */
  readonly id: string;
  readonly title: Bi;
  /** The one-line verdict, rendered as a badge beside the title. */
  readonly verdict: Bi;
  readonly tone: Tone;
  /** A sentence stating what the verdict does and does not mean. */
  readonly lead?: Bi;
  /**
   * Increment once per produced result. A change moves focus here; any other
   * re-render does not.
   */
  readonly focusKey: number;
  readonly children: ReactNode;
}

export function ResultPanel({
  id,
  title,
  verdict,
  tone,
  lead,
  focusKey,
  children,
}: ResultPanelProps) {
  const ref = useRef<HTMLElement>(null);
  const lastFocused = useRef(0);

  useEffect(() => {
    if (focusKey === lastFocused.current) return;
    lastFocused.current = focusKey;
    if (focusKey === 0) return;
    ref.current?.focus();
  }, [focusKey]);

  const headingId = `${id}-heading`;

  return (
    <section
      className={styles.panel}
      id={id}
      ref={ref}
      tabIndex={-1}
      aria-labelledby={headingId}
    >
      <div className={styles.head}>
        <h2 className={styles.title} id={headingId}>
          <T text={title} />
        </h2>
        <Badge tone={tone} label={verdict} />
      </div>

      {lead !== undefined ? (
        <p className={styles.lead}>
          <T text={lead} />
        </p>
      ) : null}

      <div className={styles.body}>{children}</div>
    </section>
  );
}

/**
 * A titled block inside a result. Rendered with a real heading so the panel has
 * an outline a screen-reader user can navigate rather than one long region.
 */
export function ResultBlock({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: Bi;
  readonly description?: Bi;
  readonly children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section className={styles.block} id={id} aria-labelledby={headingId}>
      <h3 className={styles.blockTitle} id={headingId}>
        <T text={title} />
      </h3>
      {description !== undefined ? (
        <p className={styles.blockDescription}>
          <T text={description} />
        </p>
      ) : null}
      {children}
    </section>
  );
}
