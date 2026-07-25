import type { ReactNode } from 'react';

import type { Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';

import styles from './Bilingual.module.css';

/**
 * A bilingual string rendered as two lines: English, then Spanish beneath it.
 *
 * Both halves are real text with their own `lang` attribute — not a `title`
 * tooltip, not a toggle. See `lib/i18n.ts` for why this portal shows both
 * languages at once instead of choosing one.
 *
 * Everything is emitted as `<span>`, so this is safe inside a heading, a table
 * cell, a paragraph or a list item. Sizes are in `em`, so the Spanish line
 * scales with whatever it is nested in.
 */
export function T({ text, className }: { readonly text: Bi; readonly className?: string }) {
  return (
    <span className={cx(styles.pair, className)}>
      <span lang="en" className={styles.primary}>
        {text.en}
      </span>
      <span lang="es" className={styles.secondary}>
        {text.es}
      </span>
    </span>
  );
}

/**
 * The same pair on one line, for badges, table cells and other tight spaces.
 * The separator is decorative and hidden from assistive technology, which
 * reads the two `lang`-tagged runs as the distinct strings they are.
 */
export function TInline({ text, className }: { readonly text: Bi; readonly className?: string }) {
  return (
    <span className={cx(styles.inline, className)}>
      <span lang="en">{text.en}</span>
      <span aria-hidden="true" className={styles.sep}>
        ·
      </span>
      <span lang="es" className={styles.inlineSecondary}>
        {text.es}
      </span>
    </span>
  );
}

/**
 * A bilingual block of prose. Each language gets its own paragraph flow so long
 * text stays readable, rather than two sentences colliding on one line.
 */
export function TProse({ text, className }: { readonly text: Bi; readonly className?: string }) {
  return (
    <div className={cx(styles.prose, className)}>
      <p lang="en">{text.en}</p>
      <p lang="es" className={styles.proseSecondary}>
        {text.es}
      </p>
    </div>
  );
}

/**
 * Wrap arbitrary children in a language annotation. Used where a value is
 * language-specific but is not a `Bi` pair — a citation's instrument name, for
 * example, which exists only in the language of the gazette that published it.
 */
export function Lang({ code, children }: { readonly code: string; readonly children: ReactNode }) {
  return <span lang={code}>{children}</span>;
}
