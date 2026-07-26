'use client';

/**
 * Buttons, and the row they sit in.
 *
 * Three variants, and the distinction is behavioural rather than decorative:
 *
 *  - `primary` runs the tool. One per form.
 *  - `secondary` does something else the reader asked for — loading a specimen,
 *    for instance.
 *  - `clear` empties the form. It is visually distinct from `secondary` because
 *    it is the control that discards what the reader typed, and on these tools
 *    that is a privacy action rather than a convenience: it is how somebody
 *    removes a document number from a shared screen.
 *
 * `type` defaults to `button`. A `<button>` inside a form defaults to `submit`
 * in HTML, so a specimen loader written without a type submits the form — which
 * on these tools would run the check against whatever was there a moment ago.
 * Making the safe value the default removes the trap.
 *
 * Labels are bilingual and rendered inline, matching the badges.
 */

import type { ReactNode } from 'react';

import type { Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import { TInline } from '@/components/Bilingual';

import styles from './Actions.module.css';

export type ToolButtonVariant = 'primary' | 'secondary' | 'clear';

export interface ToolButtonProps {
  readonly label: Bi;
  readonly variant?: ToolButtonVariant;
  readonly type?: 'button' | 'submit';
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  /** Set when the button controls a region elsewhere on the page. */
  readonly controls?: string;
}

const VARIANT_CLASS: Record<ToolButtonVariant, string> = {
  primary: 'primary',
  secondary: 'secondary',
  clear: 'clear',
};

export function ToolButton({
  label,
  variant = 'secondary',
  type = 'button',
  onClick,
  disabled,
  controls,
}: ToolButtonProps) {
  return (
    <button
      className={cx(styles.button, styles[VARIANT_CLASS[variant]])}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-controls={controls}
    >
      <TInline text={label} />
    </button>
  );
}

/** A wrapping row of actions. */
export function ToolActions({ children }: { readonly children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

/**
 * A labelled group of secondary actions — the specimen loaders, for example.
 * `role="group"` with an accessible name, so the buttons are announced as
 * belonging to something rather than as three loose controls.
 */
export function ToolActionGroup({
  id,
  label,
  children,
}: {
  readonly id: string;
  readonly label: Bi;
  readonly children: ReactNode;
}) {
  const labelId = `${id}-label`;
  return (
    <div className={styles.group} role="group" aria-labelledby={labelId}>
      <span className={styles.groupLabel} id={labelId}>
        <TInline text={label} />
      </span>
      <div className={styles.groupButtons}>{children}</div>
    </div>
  );
}
