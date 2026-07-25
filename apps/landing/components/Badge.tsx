import type { ReactNode } from 'react';

import type { Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import { TInline } from '@/components/Bilingual';

import styles from './Badge.module.css';

/** Semantic tones. These are the only status colours on the site. */
export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'review' | 'neutral' | 'accent';

/**
 * A distinct glyph per tone, so a badge is still distinguishable in greyscale,
 * at low contrast, or by a reader with a colour vision deficiency. Around one in
 * twelve men has one, and "built" versus "refused" is not something anyone
 * should have to infer from hue. The glyphs are decorative — the word beside
 * them carries the meaning — so they are hidden from assistive technology
 * rather than read out as punctuation.
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
  readonly label: Bi;
  readonly className?: string;
}) {
  return (
    <span className={cx(styles.badge, styles[TONE_CLASS[tone]], className)}>
      <span aria-hidden="true" className={styles.glyph}>
        {GLYPH[tone]}
      </span>
      <TInline text={label} />
    </span>
  );
}

/** A single-language badge, for values that are not translated (country codes, ports). */
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

/** A neutral chip with no status meaning — jurisdictions, licences, counts. */
export function Chip({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <span className={cx(styles.chip, className)}>{children}</span>;
}
