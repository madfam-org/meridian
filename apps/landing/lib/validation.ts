/**
 * Field validation for the calculator on this page.
 *
 * Three properties are load-bearing, and they are the same three the portal's
 * tools keep — see `apps/web/lib/tools/validation.ts`, which this is a reduced
 * copy of (only the two readers the landing calculator actually uses).
 *
 *  1. **An issue names a field.** Every {@link FieldIssue} carries the DOM id of
 *     the control it belongs to, because the error summary links to it and the
 *     inline message is wired to it through `aria-describedby`. A message with
 *     no field attached is a message a keyboard user cannot reach.
 *  2. **Messages carry both languages.** They are produced by form-reading code
 *     that has no view of the page, so the pair travels and the component that
 *     renders it picks a half — see {@link messageFor}.
 *  3. **No `Date`.** Dates are parsed with `@meridian/core`'s `tryIsoDate`,
 *     which is calendar-exact and timezone-free. `new Date('2026-02-30')` rolls
 *     silently to 1 March and `new Date('2026-07-25')` is midnight UTC — which
 *     is 2026-07-24 in Mexico City, and one day is the entire difference
 *     between a lawful ninety-day stay and an overstay.
 */

import { tryIsoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';

import { bi, pick, type Locale, type LocalizedText } from '@/lib/i18n';

/** One problem with one field. `fieldId` is the DOM id of the control. */
export interface FieldIssue {
  readonly fieldId: string;
  readonly message: LocalizedText;
}

export function issue(fieldId: string, message: LocalizedText): FieldIssue {
  return { fieldId, message };
}

/**
 * The inline message for one control, or `undefined` when it has none. The
 * first issue wins: a stack of messages under a single input is noise a screen
 * reader has to walk through.
 */
export function issueFor(
  fieldId: string,
  issues: readonly FieldIssue[],
): LocalizedText | undefined {
  return issues.find((i) => i.fieldId === fieldId)?.message;
}

/**
 * The inline message for one control, resolved to the served locale.
 *
 * The form components take strings, not pairs: a control's label has already
 * been chosen by the caller, and an error message should arrive the same way.
 */
export function messageFor(
  fieldId: string,
  issues: readonly FieldIssue[],
  locale: Locale,
): string | undefined {
  const found = issueFor(fieldId, issues);
  return found === undefined ? undefined : pick(found, locale);
}

/** Drop the `null`s from a list of optional issues, in declaration order. */
export function collect(candidates: readonly (FieldIssue | null)[]): FieldIssue[] {
  return candidates.filter((c): c is FieldIssue => c !== null);
}

export interface DateFieldResult {
  /** The parsed civil date, or `null` when the field did not yield one. */
  readonly date: IsoDate | null;
  readonly issue: FieldIssue | null;
}

/**
 * Read a `YYYY-MM-DD` civil date.
 *
 * `required: false` treats a blank field as absent rather than as an error and
 * returns `date: null` with no issue — the difference between "absent" and
 * "invalid" is one the caller needs.
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
