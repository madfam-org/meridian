'use client';

/**
 * The form vocabulary for the browser tools.
 *
 * Before this file the portal had exactly one form — a two-select GET filter on
 * `/pathways` — and no text input anywhere. Everything here is therefore new,
 * and it is written once so that three tools do not each invent their own
 * accessibility bugs.
 *
 * The contract every control in this file keeps:
 *
 *  - **One label, really associated.** A real `<label for>` pointing at a real
 *    `id`. Not a placeholder, not an `aria-label`, not a paragraph above the
 *    box. A placeholder disappears the moment somebody types, which is exactly
 *    when a person who has been interrupted needs it back.
 *  - **Hint and error are announced with the control.** Both are wired through
 *    `aria-describedby`, so a screen reader reads "Reference date, edit,
 *    YYYY-MM-DD, error: 2026-02-30 is not a calendar date" rather than reading
 *    the message only if the user happens to arrow past it.
 *  - **Error is never colour alone.** A red border is accompanied by a glyph, by
 *    the word "Error", and by `aria-invalid`, because roughly one man in twelve
 *    has a colour vision deficiency and because a border is invisible in a
 *    high-contrast theme.
 *  - **Required is stated in words.** `aria-required` plus a visible "required"
 *    marker with a text alternative, not a bare asterisk. `aria-required`
 *    rather than the HTML `required` attribute, because the tool forms carry
 *    `noValidate`: the browser's own validation bubble is monolingual, is not
 *    listed in the error summary, and disappears on the next keystroke.
 *    Announcing the constraint while owning the message is the whole point.
 *  - **Focus is visible.** Inherited from `globals.css`, which never removes the
 *    ring; nothing here overrides it.
 *
 * `Field` is the shell and takes a render prop, so a tool that needs a control
 * this file does not wrap — a radio group, say — still gets the label, hint,
 * error and wiring for free. `TextField`, `TextAreaField`, `DateField`,
 * `NumberField`, `SelectField` and `CheckboxField` are the shell applied to the
 * controls the tools actually use.
 */

import type { ChangeEvent, ReactNode } from 'react';

import type { Bi } from '@/lib/i18n';
import { bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import { T } from '@/components/Bilingual';

import styles from './Field.module.css';

/**
 * The attributes a control must spread onto itself to be correctly announced.
 * Produced by `Field` and handed to its render prop.
 */
export interface FieldControlAttributes {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
  readonly 'aria-required': true | undefined;
}

export interface FieldProps {
  /** DOM id of the control. Error summaries link to it; keep it stable. */
  readonly id: string;
  readonly label: Bi;
  /** Guidance shown under the label and read out with the control. */
  readonly hint?: Bi;
  /** Present only when this field is in error. */
  readonly error?: Bi;
  readonly required?: boolean;
  readonly children: (attributes: FieldControlAttributes) => ReactNode;
}

const REQUIRED_MARKER: Bi = bi('required', 'obligatorio');

/**
 * The word "Error" is spelled identically in both languages, so it is rendered
 * once as plain text rather than through `<T>`. Repeating it as "Error · Error"
 * would be noise in the visual layout and a duplicate announcement in a screen
 * reader.
 */
const ERROR_WORD = 'Error';

export function Field({ id, label, hint, error, required, children }: FieldProps) {
  const hintId = hint !== undefined ? `${id}-hint` : undefined;
  const errorId = error !== undefined ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter((v): v is string => v !== undefined).join(' ');

  const attributes: FieldControlAttributes = {
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

/** Props every wrapped control shares with `Field`. */
interface CommonProps {
  readonly id: string;
  readonly label: Bi;
  readonly hint?: Bi;
  readonly error?: Bi;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

export interface TextFieldProps extends CommonProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoComplete?: string;
  readonly inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  /** Sets the control's width in characters. Absent means full width. */
  readonly widthChars?: number;
  /** Renders the value in the monospace face — for codes and identifiers. */
  readonly mono?: boolean;
}

export function TextField({
  value,
  onChange,
  autoComplete,
  inputMode,
  widthChars,
  mono,
  disabled,
  ...field
}: TextFieldProps) {
  return (
    <Field {...field}>
      {(a) => (
        <input
          {...a}
          type="text"
          className={cx(styles.control, mono === true && styles.mono)}
          value={value}
          disabled={disabled}
          size={widthChars}
          autoComplete={autoComplete ?? 'off'}
          inputMode={inputMode}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export interface TextAreaFieldProps extends CommonProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly rows?: number;
  readonly mono?: boolean;
  /**
   * Turns off spell-check, autocorrect, autocapitalisation and autocomplete.
   * Set it for anything transcribed from a document: an autocorrect pass over a
   * document number produces a number belonging to somebody else, and a browser
   * that remembers the value has stored a travel document in a form-fill cache.
   */
  readonly verbatim?: boolean;
}

export function TextAreaField({
  value,
  onChange,
  rows = 4,
  mono,
  verbatim,
  disabled,
  ...field
}: TextAreaFieldProps) {
  const raw = verbatim === true;
  return (
    <Field {...field}>
      {(a) => (
        <textarea
          {...a}
          className={cx(styles.control, styles.textarea, mono === true && styles.mono)}
          value={value}
          rows={rows}
          disabled={disabled}
          wrap="off"
          spellCheck={raw ? false : undefined}
          autoComplete={raw ? 'off' : undefined}
          autoCapitalize={raw ? 'off' : undefined}
          autoCorrect={raw ? 'off' : undefined}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export interface DateFieldProps extends CommonProps {
  /** `YYYY-MM-DD`, or the empty string. Never a `Date`. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly min?: string;
  readonly max?: string;
}

/**
 * A civil date.
 *
 * `type="date"` exchanges its value as `YYYY-MM-DD` regardless of how the
 * browser displays it, which is the one thing this application needs: the value
 * that leaves the control is already the shape `@meridian/core`'s `isoDate`
 * accepts, and no timezone was consulted to produce it.
 */
export function DateField({ value, onChange, min, max, disabled, ...field }: DateFieldProps) {
  return (
    <Field {...field}>
      {(a) => (
        <input
          {...a}
          type="date"
          className={cx(styles.control, styles.dateControl)}
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export interface NumberFieldProps extends CommonProps {
  /** Held as a string so a half-typed value is not silently coerced. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  ...field
}: NumberFieldProps) {
  return (
    <Field {...field}>
      {(a) => (
        <input
          {...a}
          type="number"
          className={cx(styles.control, styles.numberControl)}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          inputMode="numeric"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export interface SelectOption {
  readonly value: string;
  /** Bilingual where the option is Meridian's own wording; plain where it is a code. */
  readonly label: Bi | string;
}

export interface SelectFieldProps extends CommonProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly SelectOption[];
}

/**
 * A single-choice select.
 *
 * Option text is flattened to `en · es` rather than rendered as two elements:
 * an `<option>` may contain only text, so the bilingual pair cannot carry its
 * own `lang` attributes here. Everything outside the option list still does.
 */
export function SelectField({
  value,
  onChange,
  options,
  disabled,
  ...field
}: SelectFieldProps) {
  return (
    <Field {...field}>
      {(a) => (
        <select
          {...a}
          className={cx(styles.control, styles.select)}
          value={value}
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {typeof option.label === 'string'
                ? option.label
                : `${option.label.en} · ${option.label.es}`}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export interface CheckboxFieldProps extends CommonProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/**
 * A single checkbox.
 *
 * Laid out control-first, since a checkbox's label reads as a statement the box
 * asserts rather than as the name of a value being entered. The wiring is
 * otherwise identical, so an error on a checkbox is announced exactly as an
 * error on a text field is.
 */
export function CheckboxField({
  checked,
  onChange,
  disabled,
  id,
  label,
  hint,
  error,
  required,
}: CheckboxFieldProps) {
  const hintId = hint !== undefined ? `${id}-hint` : undefined;
  const errorId = error !== undefined ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter((v): v is string => v !== undefined).join(' ');

  return (
    <div className={cx(styles.field, styles.checkboxField, error !== undefined && styles.fieldInvalid)}>
      <div className={styles.checkboxRow}>
        <input
          id={id}
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          disabled={disabled}
          aria-describedby={describedBy.length > 0 ? describedBy : undefined}
          aria-invalid={error !== undefined ? true : undefined}
          aria-required={required === true ? true : undefined}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        />
        <label className={styles.checkboxLabel} htmlFor={id}>
          <T text={label} />
        </label>
      </div>

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
    </div>
  );
}

/** A group of fields laid out in a row that wraps. */
export function FieldRow({ children }: { readonly children: ReactNode }) {
  return <div className={styles.fieldRow}>{children}</div>;
}
