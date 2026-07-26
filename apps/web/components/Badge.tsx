import type { ReactNode } from 'react';

import { cx } from '@/lib/ui';

import styles from './Badge.module.css';

/**
 * Semantic tones. These are the only status colours in the app, and each one is
 * always paired with a glyph and a word — see `lib/status.ts`, which owns the
 * mapping from a domain value to a tone so no page can invent its own.
 */
export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'review' | 'neutral' | 'accent';

/**
 * A distinct shape per tone, so the badges are still distinguishable in
 * greyscale, at low contrast, or by a reader with a colour vision deficiency.
 * These are decorative: the word next to them carries the meaning, so they are
 * hidden from assistive technology rather than read out as punctuation.
 */
const GLYPH: Record<Tone, string> = {
  ok: '✓',
  warn: '!',
  bad: '✕',
  info: 'i',
  review: '?',
  neutral: '–',
  accent: '◆',
};

const TONE_CLASS: Record<Tone, string> = {
  ok: 'ok',
  warn: 'warn',
  bad: 'bad',
  info: 'info',
  review: 'review',
  neutral: 'neutral',
  accent: 'accent',
};

export function Badge({
  tone,
  label,
  className,
}: {
  readonly tone: Tone;
  /** Already resolved to the served locale by the caller. */
  readonly label: string;
  readonly className?: string;
}) {
  return (
    <span className={cx(styles.badge, styles[TONE_CLASS[tone]], className)}>
      <span aria-hidden="true" className={styles.glyph}>
        {GLYPH[tone]}
      </span>
      <span>{label}</span>
    </span>
  );
}

/** A single-language badge, for values that are not translated (country codes, ids). */
export function PlainBadge({
  tone,
  children,
  className,
}: {
  readonly tone: Tone;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span className={cx(styles.badge, styles[TONE_CLASS[tone]], className)}>
      <span aria-hidden="true" className={styles.glyph}>
        {GLYPH[tone]}
      </span>
      <span>{children}</span>
    </span>
  );
}

/** A neutral chip with no status meaning — jurisdictions, kinds, counts. */
export function Chip({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <span className={cx(styles.chip, className)}>{children}</span>;
}
