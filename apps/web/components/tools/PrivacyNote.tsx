/**
 * The privacy statement, rendered where the reader is about to type.
 *
 * This is not a footer notice and must not be moved into one. A person is about
 * to paste the machine-readable lines of their passport into a web page; the
 * moment they need to know that nothing is transmitted is before they do it,
 * not after. So the box sits immediately above the input.
 *
 * The wording lives in `lib/tools/privacy.ts`, once, with the reasoning for each
 * clause and a note that every clause is a property of the code rather than an
 * undertaking. `sourceHref` points at the file that does the work, so a reader
 * who does not believe the claim can go and read it — Meridian is AGPL-3.0 and
 * public, which makes "check for yourself" a real answer.
 *
 * Deliberately not a client component: it holds no state and handles no events,
 * so it renders on the server for the page and is inlined into the bundle when a
 * client component uses it.
 */

import type { Locale } from '@/lib/i18n';
import { translator } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import {
  PRIVACY_LEAD,
  PRIVACY_POINTS,
  PRIVACY_SOURCE_INVITATION,
  PRIVACY_TITLE,
} from '@/lib/tools/privacy';

import styles from './PrivacyNote.module.css';

export interface PrivacyNoteProps {
  /**
   * `full` lists every clause and is what belongs beside an input.
   * `compact` is the headline plus one sentence, for an index or a card.
   */
  readonly variant?: 'full' | 'compact';
  /** Absolute URL of the source file that performs the computation. */
  readonly sourceHref?: string;
  /** Repository-relative path, shown as the link text. */
  readonly sourceLabel?: string;
  readonly locale: Locale;
}

export function PrivacyNote({
  variant = 'full',
  sourceHref,
  sourceLabel,
  locale,
}: PrivacyNoteProps) {
  const t = translator(locale);
  return (
    <aside
      className={cx(styles.note, variant === 'compact' && styles.compact)}
      role="note"
      aria-labelledby="privacy-note-heading"
    >
      <h2 className={styles.title} id="privacy-note-heading">
        <span aria-hidden="true" className={styles.mark}>
          ◈
        </span>
        {t(PRIVACY_TITLE)}
      </h2>

      <p className={styles.lead}>{t(PRIVACY_LEAD)}</p>

      {variant === 'full' ? (
        <ul className={styles.points}>
          {PRIVACY_POINTS.map((point) => (
            <li key={point.en}>{t(point)}</li>
          ))}
        </ul>
      ) : null}

      {variant === 'full' && sourceHref !== undefined ? (
        <div className={styles.source}>
          {t(PRIVACY_SOURCE_INVITATION)}
          <p className={styles.sourceLink}>
            <a href={sourceHref} rel="noreferrer noopener" target="_blank">
              <code>{sourceLabel ?? sourceHref}</code>
            </a>
          </p>
        </div>
      ) : null}
    </aside>
  );
}
