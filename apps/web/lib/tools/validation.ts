/**
 * Field validation for the browser tools.
 *
 * Deliberately small, and deliberately not a validation framework. Three
 * properties matter more than expressiveness here:
 *
 *  1. **An issue names a field.** Every `FieldIssue` carries the DOM id of the
 *     control it belongs to, because the error summary links to it and the
 *     inline message is wired to it through `aria-describedby`. An error
 *     message with no field attached is an error a keyboard user cannot reach.
 *  2. **Messages are bilingual.** Like every other user-visible string in this
 *     portal — see `lib/i18n.ts` for why both languages are always rendered.
 *  3. **No `Date`.** Date fields are validated through `tryIsoDate` from
 *     `@meridian/core`, which is calendar-exact and timezone-free. A validator
 *     built on `new Date(value)` accepts `2026-02-30` (it rolls to 1 March) and
 *     rejects nothing a user would notice until the arithmetic is wrong.
 *
 * A tool collects issues, and if there are any it renders none of its result:
 * a half-validated form that shows a figure computed from the fields that
 * happened to parse is worse than one that shows nothing.
 */

import { tryIsoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';

import { bi, type Bi } from '@/lib/i18n';

/** One problem with one field. `fieldId` is the DOM id of the control. */
export interface FieldIssue {
  readonly fieldId: string;
  readonly message: Bi;
}

export function issue(fieldId: string, message: Bi): FieldIssue {
  return { fieldId, message };
}

/**
 * The inline message for one control, or `undefined` when it has no issue.
 * The first issue wins: a control shows one message, and a stack of them under
 * a single input is noise a screen reader has to walk through.
 */
export function issueFor(
  fieldId: string,
  issues: readonly FieldIssue[],
): Bi | undefined {
  return issues.find((i) => i.fieldId === fieldId)?.message;
}

/** Drop the `null`s from a list of optional issues, in declaration order. */
export function collect(candidates: readonly (FieldIssue | null)[]): FieldIssue[] {
  return candidates.filter((c): c is FieldIssue => c !== null);
}

/**
 * Require a non-blank value.
 *
 * Blankness is measured after trimming, because a field containing three
 * spaces is empty to everybody except `length`.
 */
export function requireText(
  fieldId: string,
  raw: string,
  message: Bi = bi('Enter a value.', 'Introduzca un valor.'),
): FieldIssue | null {
  return raw.trim().length === 0 ? issue(fieldId, message) : null;
}

export interface DateFieldResult {
  /** The parsed civil date, or `null` when the field did not yield one. */
  readonly date: IsoDate | null;
  readonly issue: FieldIssue | null;
}

/**
 * Read a `YYYY-MM-DD` civil date.
 *
 * `required: false` treats a blank field as absent rather than as an error, and
 * returns `date: null` with no issue — the distinction between "absent" and
 * "invalid" is one the caller usually needs.
 */
export function readDateField(
  fieldId: string,
  raw: string,
  options: { readonly required?: boolean } = {},
): DateFieldResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    if (options.required === true) {
      return {
        date: null,
        issue: issue(
          fieldId,
          bi(
            'Enter a date in YYYY-MM-DD form, for example 2026-07-25.',
            'Introduzca una fecha con el formato AAAA-MM-DD, por ejemplo 2026-07-25.',
          ),
        ),
      };
    }
    return { date: null, issue: null };
  }

  const parsed = tryIsoDate(trimmed);
  if (parsed === null) {
    return {
      date: null,
      issue: issue(
        fieldId,
        bi(
          `"${trimmed}" is not a calendar date. Use YYYY-MM-DD, for example 2026-07-25.`,
          `«${trimmed}» no es una fecha del calendario. Use AAAA-MM-DD, por ejemplo 2026-07-25.`,
        ),
      ),
    };
  }

  return { date: parsed, issue: null };
}

export interface IntegerFieldResult {
  readonly value: number | null;
  readonly issue: FieldIssue | null;
}

/**
 * Read a whole number, with optional inclusive bounds.
 *
 * `Number(raw)` is not used: it accepts `1e3`, `0x10`, `Infinity` and the empty
 * string, and a day count that arrives as `1e3` is a day count nobody typed.
 */
export function readIntegerField(
  fieldId: string,
  raw: string,
  options: { readonly required?: boolean; readonly min?: number; readonly max?: number } = {},
): IntegerFieldResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    if (options.required === true) {
      return {
        value: null,
        issue: issue(fieldId, bi('Enter a whole number.', 'Introduzca un número entero.')),
      };
    }
    return { value: null, issue: null };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return {
      value: null,
      issue: issue(
        fieldId,
        bi(
          `"${trimmed}" is not a whole number.`,
          `«${trimmed}» no es un número entero.`,
        ),
      ),
    };
  }

  const value = Number.parseInt(trimmed, 10);

  if (options.min !== undefined && value < options.min) {
    return {
      value: null,
      issue: issue(
        fieldId,
        bi(
          `Enter ${options.min} or more.`,
          `Introduzca ${options.min} o más.`,
        ),
      ),
    };
  }

  if (options.max !== undefined && value > options.max) {
    return {
      value: null,
      issue: issue(
        fieldId,
        bi(
          `Enter ${options.max} or fewer.`,
          `Introduzca ${options.max} o menos.`,
        ),
      ),
    };
  }

  return { value, issue: null };
}
