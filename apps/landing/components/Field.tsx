'use client';

/**
 * The form vocabulary for the calculator on this page.
 *
 * A reduced copy of `apps/web/components/tools/Field.tsx` — the two controls
 * the landing calculator needs, and the contract every one of them keeps:
 *
 *  - **One label, really associated.** A real `<label for>` pointing at a real
 *    `id`. Not a placeholder, not an `aria-label`, not a paragraph above the
 *    box. A placeholder disappears the moment somebody types, which is exactly
 *    when a person who has been interrupted needs it back.
 *  - **Hint and error are announced with the control**, through
 *    `aria-describedby`, so a screen reader reads "Day you arrived, edit,
 *    error: 2026-02-30 is not a calendar date" rather than reading the message
 *    only if the user happens to arrow past it.
 *  - **Error is never colour alone.** A red border is accompanied by a glyph,
 *    by the word "Error", and by `aria-invalid`, because roughly one man in
 *    twelve has a colour vision deficiency and because a border is invisible in
 *    a forced-colours theme.
 *  - **Required is stated in words.** `aria-required` plus a visible marker,
 *    not a bare asterisk. `aria-required` rather than the HTML `required`
 *    attribute, because the form carries `noValidate`: the browser's own
 *    validation bubble is monolingual, never appears in the error summary, and
 *    vanishes on the next keystroke. Announcing the constraint while owning the
 *    message is the whole point.
 *  - **Focus is visible.** Inherited from `globals.css`, which never removes
 *    the ring; nothing here overrides it.
 */

import type { ChangeEvent, ReactNode } from 'react';

import { bi, type Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import { T } from '@/components/Bilingual';

import styles from './Field.module.css';

/** Attributes a control spreads onto itself to be correctly announced. */
interface ControlAttributes {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
  readonly 'aria-required': true | undefined;
}

interface FieldShellProps {
  /** DOM id of the control. The error summary links to it; keep it stable. */
  readonly id: string;
  readonly label: Bi;
  readonly hint?: Bi;
  /** Present only when this field is in error. */
  readonly error?: Bi;
  readonly required?: boolean;
  readonly children: (attributes: ControlAttributes) => ReactNode;
}

const REQUIRED_MARKER: Bi = bi('required', 'obligatorio');

/**
 * Spelled identically in both languages, so rendered once as plain text. "Error
 * · Error" would be noise on screen and a duplicate announcement in a reader.
 */
const ERROR_WORD = 'Error';

function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  const hintId = hint !== undefined ? `${id}-hint` : undefined;
  const errorId = error !== undefined ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter((v): v is string => v !== undefined).join(' ');

  const attributes: ControlAttributes = {
    id,
    'aria-describedby': describedBy.length > 0 ? describedBy : undefined,
    'aria-invalid': error !== undefined ? true : undefined,
    'aria-required': required === true ? true : undefined,
  };

  return (
    <div className={cx(styles.field, error !== undefined && styles.fieldInvalid)}>
      <label className={styles.label} htmlFor={id}>
        <T text={label} />
        {required === true ? (
          <span className={styles.required}>
            <T text={REQUIRED_MARKER} />
          </span>
        ) : null}
      </label>

      {hint !== undefined && hintId !== undefined ? (
        <p className={styles.hint} id={hintId}>
          <T text={hint} />
        </p>
      ) : null}

      {error !== undefined && errorId !== undefined ? (
        <p className={styles.error} id={errorId}>
          <span aria-hidden="true" className={styles.errorGlyph}>
            ✕
          </span>
          <span className={styles.errorWord}>{ERROR_WORD}</span>
          <span className={styles.errorText}>
            <T text={error} />
          </span>
        </p>
      ) : null}

      {children(attributes)}
    </div>
  );
}

interface CommonProps {
  readonly id: string;
  readonly label: Bi;
  readonly hint?: Bi;
  readonly error?: Bi;
  readonly required?: boolean;
}

export interface DateFieldProps extends CommonProps {
  /** `YYYY-MM-DD`, or the empty string. Never a `Date`. */
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/**
 * A civil date.
 *
 * `type="date"` exchanges its value as `YYYY-MM-DD` however the browser chooses
 * to display it, which is the one thing this page needs: the value leaving the
 * control is already the shape `@meridian/core`'s `isoDate` accepts, and no
 * timezone was consulted to produce it.
 */
export function DateField({ value, onChange, ...field }: DateFieldProps) {
  return (
    <FieldShell {...field}>
      {(a) => (
        <input
          {...a}
          type="date"
          className={cx(styles.control, styles.dateControl)}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      )}
    </FieldShell>
  );
}

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectFieldProps extends CommonProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly SelectOption[];
}

export function SelectField({ value, onChange, options, ...field }: SelectFieldProps) {
  return (
    <FieldShell {...field}>
      {(a) => (
        <select
          {...a}
          className={cx(styles.control, styles.select)}
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

/** A group of fields laid out in a row that wraps. */
export function FieldRow({ children }: { readonly children: ReactNode }) {
  return <div className={styles.fieldRow}>{children}</div>;
}

/** A row of buttons. */
export function Actions({ children }: { readonly children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

export interface ButtonProps {
  readonly label: Bi;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit';
  readonly variant?: 'primary' | 'secondary' | 'quiet';
  readonly disabled?: boolean;
  /** The region this button updates, once that region exists. */
  readonly controls?: string;
}

/**
 * A button.
 *
 * `type` defaults to `button`, not `submit`: a button inside a form with no
 * explicit type submits it, and "remove trip 2" silently running the whole
 * calculation is the classic version of that bug.
 *
 * `aria-controls` is set only when the caller passes an id that exists.
 * Pointing it at an absent element is a dangling reference, not a relationship.
 */
export function Button({
  label,
  onClick,
  type = 'button',
  variant = 'secondary',
  disabled,
  controls,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'quiet' && styles.buttonQuiet,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-controls={controls}
    >
      <T text={label} />
    </button>
  );
}
