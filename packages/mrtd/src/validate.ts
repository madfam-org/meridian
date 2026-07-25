/**
 * The verdict.
 *
 * `validateMrz` is the entry point most callers want: it parses, verifies every
 * check digit the format defines, and returns a result that names each defect
 * and points at the character that caused it.
 *
 * The shape of the output is the whole point. A boolean "valid / invalid" is
 * useless to the person who has to act on it — a caseworker looking at a
 * rejected scan needs to know that it is the date-of-birth digit that is wrong,
 * on line 2, at column 20, reading `4` where the arithmetic says `8`, because
 * that tells them the OCR misread a single character of a date they can see on
 * the page. "Invalid passport" tells them to start again.
 *
 * Which defects make a document invalid is a judgement, and it is made here
 * explicitly:
 *
 * - Any check-digit mismatch is a failure. The digits exist precisely so that a
 *   transcription error is caught, and treating a mismatch as a warning defeats
 *   the mechanism.
 * - A date that is six digits but names no real day is a failure. So is a date
 *   field containing letters.
 * - A date the issuer left as filler, in whole or in part, is **not** a failure.
 *   The check digit still covers the field, so the MRZ is internally consistent;
 *   what is missing is calendar information the issuing state chose not to
 *   encode, which is a fact about the document rather than a defect in it. The
 *   reading surfaces as `iso: null` with the reason recorded, and downstream
 *   code that needs a real date must handle the null rather than be handed a
 *   fabricated one.
 * - A sex character outside `M`, `F`, `X` and the filler is a failure, because
 *   it means the field was misread and every other field on that line is
 *   therefore suspect.
 */

import { computeCheckDigit, MRZ_FILLER, verifyCheckDigit } from './check-digit.js';
import { parseMrz } from './parse.js';
import type {
  CheckDigitSite,
  CheckDigitVerdict,
  MrzDateField,
  MrzFailure,
  MrzOptions,
  MrzValidation,
} from './types.js';

/** Date reasons that mean the document is defective rather than merely incomplete. */
const FATAL_DATE_REASONS = new Set(['wrong_length', 'non_numeric', 'not_a_calendar_date']);

const FIELD_LABELS: Readonly<Record<string, string>> = {
  documentNumber: 'document number',
  dateOfBirth: 'date of birth',
  dateOfExpiry: 'date of expiry',
  optionalData: 'optional / personal number data',
  composite: 'composite (whole machine-readable zone)',
};

function label(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function verdictFor(site: CheckDigitSite): CheckDigitVerdict {
  // The one permitted filler in a check-digit position: TD3's personal-number
  // digit, when that field is unused. An issuer may also write `0` there, which
  // is what the arithmetic produces for an all-filler field, so that case needs
  // no special handling and falls through to the normal comparison below.
  if (site.fillerPermitted && site.present === MRZ_FILLER) {
    return {
      field: site.field,
      line: site.line,
      column: site.column,
      present: site.present,
      expected: null,
      ok: true,
      note:
        'The field this digit covers is entirely filler, and ICAO 9303 permits the ' +
        "check digit to be left as '<' in that case.",
    };
  }

  const expected = computeCheckDigit(site.covers);
  return {
    field: site.field,
    line: site.line,
    column: site.column,
    present: site.present,
    expected,
    ok: verifyCheckDigit(site.covers, site.present),
  };
}

function dateFailure(field: MrzDateField, name: 'dateOfBirth' | 'dateOfExpiry'): MrzFailure | null {
  if (field.failure === null) return null;
  if (!FATAL_DATE_REASONS.has(field.failure)) return null;
  return {
    code: 'date_unresolvable',
    field: name,
    message:
      `The ${label(name)} field reads ${JSON.stringify(field.raw)}, which cannot be read as a ` +
      `calendar date (${field.failure.replace(/_/g, ' ')}).`,
  };
}

/**
 * Parse an MRZ and verify everything the format lets us verify.
 *
 * @param raw the machine-readable lines. Whitespace, line endings and letter
 *   case are normalised first; see `normalizeMrzLines` for exactly what that
 *   does and, more importantly, what it refuses to do.
 * @param options `referenceDate` fixes the century-resolution window. Pass it
 *   whenever the result has to be reproducible later — an assessment re-run in
 *   five years must reach the same answer it reached today.
 */
export function validateMrz(raw: string, options: MrzOptions = {}): MrzValidation {
  const parsed = parseMrz(raw, options);
  if (!parsed.ok) {
    return {
      valid: false,
      format: null,
      document: null,
      checkDigits: [],
      failures: parsed.failures,
    };
  }

  const document = parsed.document;
  const failures: MrzFailure[] = [...parsed.failures];
  const checkDigits: CheckDigitVerdict[] = [];

  for (const site of document.checkDigitSites) {
    const verdict = verdictFor(site);
    checkDigits.push(verdict);
    if (verdict.ok) continue;
    failures.push({
      code: 'check_digit_mismatch',
      field: verdict.field,
      message:
        `The ${label(verdict.field)} check digit at line ${verdict.line} column ${verdict.column} ` +
        `reads ${JSON.stringify(verdict.present)}, but the field it covers ` +
        `(${JSON.stringify(site.covers)}) computes to ${verdict.expected}.`,
      line: verdict.line,
      column: verdict.column,
    });
  }

  const birthFailure = dateFailure(document.dateOfBirth, 'dateOfBirth');
  if (birthFailure) failures.push(birthFailure);
  const expiryFailure = dateFailure(document.dateOfExpiry, 'dateOfExpiry');
  if (expiryFailure) failures.push(expiryFailure);

  if (
    document.sexCharacter !== 'M' &&
    document.sexCharacter !== 'F' &&
    document.sexCharacter !== 'X' &&
    document.sexCharacter !== MRZ_FILLER
  ) {
    failures.push({
      code: 'invalid_field_value',
      field: 'sex',
      message:
        `The sex field reads ${JSON.stringify(document.sexCharacter)}. ICAO 9303 permits ` +
        `'M', 'F', 'X' or the filler '<'.`,
    });
  }

  if (failures.length === 0) {
    return {
      valid: true,
      format: document.format,
      document,
      checkDigits,
      failures: [],
    };
  }

  return {
    valid: false,
    format: document.format,
    document,
    checkDigits,
    failures,
  };
}

/**
 * The check-digit verdicts that failed, in the order they appear in the zone.
 * Convenience for a UI that wants to highlight only the broken positions.
 */
export function failedCheckDigits(validation: MrzValidation): readonly CheckDigitVerdict[] {
  return validation.checkDigits.filter((v) => !v.ok);
}
