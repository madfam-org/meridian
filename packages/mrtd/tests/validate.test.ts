import { describe, expect, it } from 'vitest';
import { failedCheckDigits, validateMrz } from '../src/validate.js';
import type { MrzCheckDigitField, MrzFormat } from '../src/types.js';
import {
  BUILDERS,
  buildMrvA,
  buildMrvB,
  buildTd1,
  buildTd2,
  buildTd3,
  corrupt,
  REFERENCE_DATE,
  SPECIMEN as SPEC,
} from './fixtures.js';

const OPTS = { referenceDate: REFERENCE_DATE };

function failedFields(mrz: string): MrzCheckDigitField[] {
  return failedCheckDigits(validateMrz(mrz, OPTS)).map((v) => v.field);
}

/**
 * Where each check digit sits, as 1-based coordinates a human could read off
 * the page. Written out per format rather than derived from the layout table,
 * so that a wrong offset in `src` shows up as a failing test rather than as a
 * matching pair of mistakes.
 */
const CHECK_POSITIONS: Readonly<
  Record<MrzFormat, ReadonlyArray<readonly [MrzCheckDigitField, number, number]>>
> = {
  TD1: [
    ['documentNumber', 1, 15],
    ['dateOfBirth', 2, 7],
    ['dateOfExpiry', 2, 15],
    ['composite', 2, 30],
  ],
  TD2: [
    ['documentNumber', 2, 10],
    ['dateOfBirth', 2, 20],
    ['dateOfExpiry', 2, 28],
    ['composite', 2, 36],
  ],
  TD3: [
    ['documentNumber', 2, 10],
    ['dateOfBirth', 2, 20],
    ['dateOfExpiry', 2, 28],
    ['optionalData', 2, 43],
    ['composite', 2, 44],
  ],
  'MRV-A': [
    ['documentNumber', 2, 10],
    ['dateOfBirth', 2, 20],
    ['dateOfExpiry', 2, 28],
  ],
  'MRV-B': [
    ['documentNumber', 2, 10],
    ['dateOfBirth', 2, 20],
    ['dateOfExpiry', 2, 28],
  ],
};

describe('a clean specimen', () => {
  it('validates in every format', () => {
    for (const [format, build] of BUILDERS) {
      const result = validateMrz(build(SPEC), OPTS);
      expect(result.valid, `${format} should validate`).toBe(true);
      expect(result.failures).toEqual([]);
      expect(result.checkDigits.every((v) => v.ok)).toBe(true);
    }
  });

  it('reports exactly the check digits its format defines', () => {
    for (const [format, build] of BUILDERS) {
      const result = validateMrz(build(SPEC), OPTS);
      expect(result.checkDigits.map((v) => [v.field, v.line, v.column])).toEqual(
        CHECK_POSITIONS[format].map((p) => [p[0], p[1], p[2]]),
      );
    }
  });

  it('never invents a composite digit for a visa', () => {
    // MRV-A shares TD3's geometry. Reading its last optional-data character as
    // a composite digit rejects valid visas, which is a real failure mode in
    // deployed software and the reason the format is detected from the
    // document code rather than the line length.
    for (const build of [buildMrvA, buildMrvB]) {
      const result = validateMrz(build(SPEC), OPTS);
      expect(result.checkDigits.map((v) => v.field)).not.toContain('composite');
    }
  });
});

describe('a corrupted check digit names its own field', () => {
  it('identifies every position in every format', () => {
    for (const [format, build] of BUILDERS) {
      for (const [field, line, column] of CHECK_POSITIONS[format]) {
        const broken = corrupt(build(SPEC), line, column);
        const failed = failedFields(broken);
        expect(failed, `${format} ${field} at ${line}:${column}`).toContain(field);

        // Every check digit except the composite is itself inside the
        // composite's coverage, so breaking one breaks two. That is the point
        // of the composite: it makes a single-character edit detectable twice.
        const expected =
          field === 'composite' || CHECK_POSITIONS[format].every((p) => p[0] !== 'composite')
            ? [field]
            : [field, 'composite'];
        expect(failed, `${format} ${field}`).toEqual(expected);
      }
    }
  });

  it('points at the character a caseworker should look at', () => {
    const broken = corrupt(buildTd3(SPEC), 2, 20);
    const result = validateMrz(broken, OPTS);
    expect(result.valid).toBe(false);
    const verdict = result.checkDigits.find((v) => v.field === 'dateOfBirth');
    expect(verdict?.ok).toBe(false);
    expect(verdict?.line).toBe(2);
    expect(verdict?.column).toBe(20);
    expect(verdict?.present).not.toBe(String(verdict?.expected));

    const failure = result.failures.find((f) => f.field === 'dateOfBirth');
    expect(failure?.code).toBe('check_digit_mismatch');
    expect(failure?.line).toBe(2);
    expect(failure?.column).toBe(20);
    // The message has to be usable without reading the code that produced it.
    expect(failure?.message).toContain('date of birth');
    expect(failure?.message).toContain('line 2 column 20');
  });

  it('catches a corrupted data character, not just a corrupted digit', () => {
    // Column 3 of line 2 is inside the document number. The digits exist to
    // catch exactly this: an OCR pass that misread one character of a number
    // nobody would notice by eye.
    const failed = failedFields(corrupt(buildTd3(SPEC), 2, 3));
    expect(failed).toEqual(['documentNumber', 'composite']);
  });

  it('cannot catch a corrupted TD1 name, and says so by validating anyway', () => {
    // On TD1 the name is on line 3, which no check digit covers at all — a
    // fact worth pinning, because it means a clean verdict says nothing about
    // whether the name was transcribed correctly. Anyone relying on this
    // package to confirm a name needs to know that.
    const result = validateMrz(corrupt(buildTd1(SPEC), 3, 1), OPTS);
    expect(result.valid).toBe(true);
    expect(result.document?.name.primary).not.toBe('ESPECIMEN');
  });

  it('reports a letter in a check-digit position rather than throwing', () => {
    const result = validateMrz(corrupt(buildTd3(SPEC), 2, 44, 'A'), OPTS);
    expect(result.valid).toBe(false);
    const verdict = result.checkDigits.find((v) => v.field === 'composite');
    expect(verdict?.ok).toBe(false);
    expect(verdict?.present).toBe('A');
    expect(typeof verdict?.expected).toBe('number');
  });
});

describe('the TD3 personal-number check digit', () => {
  it('accepts the filler when the field is unused', () => {
    // 9303 lets an issuer leave this one digit as `<` when the personal number
    // field is empty. It is safe precisely because filler and `0` score the
    // same, so the composite digit is identical either way — which this test
    // also proves by not touching the composite.
    const withZero = buildTd3(SPEC);
    expect(withZero.split('\n')[1]?.charAt(42)).toBe('0');

    const withFiller = corrupt(withZero, 2, 43, '<');
    const result = validateMrz(withFiller, OPTS);
    expect(result.valid).toBe(true);

    const verdict = result.checkDigits.find((v) => v.field === 'optionalData');
    expect(verdict?.ok).toBe(true);
    expect(verdict?.expected).toBeNull();
    expect(verdict?.note).toContain('filler');
  });

  it('does not extend that leniency to a field that is in use', () => {
    const used = buildTd3({ ...SPEC, optionalData: 'PN12345' });
    const result = validateMrz(corrupt(used, 2, 43, '<'), OPTS);
    expect(result.valid).toBe(false);
    expect(failedCheckDigits(result).map((v) => v.field)).toContain('optionalData');
  });

  it('does not extend it to the composite digit', () => {
    const result = validateMrz(corrupt(buildTd3(SPEC), 2, 44, '<'), OPTS);
    expect(result.valid).toBe(false);
    expect(failedCheckDigits(result).map((v) => v.field)).toEqual(['composite']);
  });
});

describe('extended document numbers', () => {
  const LONG = 'ZZ12345678901';

  it('validates in every format', () => {
    for (const [format, build] of BUILDERS) {
      const result = validateMrz(build({ ...SPEC, documentNumber: LONG }), OPTS);
      expect(result.valid, `${format} extended number should validate`).toBe(true);
      expect(result.document?.documentNumber).toBe(LONG);
    }
  });

  it('fails when the continuation is corrupted', () => {
    // Line 2 column 29 is the first character of the number's continuation.
    const result = validateMrz(corrupt(buildTd3({ ...SPEC, documentNumber: LONG }), 2, 29), OPTS);
    expect(result.valid).toBe(false);
    expect(failedCheckDigits(result).map((v) => v.field)).toContain('documentNumber');
  });

  it('reports a malformed continuation as its own failure', () => {
    const broken = corrupt(buildTd3(SPEC), 2, 10, '<');
    const result = validateMrz(broken, OPTS);
    expect(result.valid).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain('extended_document_number_malformed');
    // No document-number verdict is produced, because there is no readable
    // digit to produce one from. Silently verifying the nine-character prefix
    // would report a number the document does not carry.
    expect(result.checkDigits.map((v) => v.field)).not.toContain('documentNumber');
  });
});

describe('dates in a verdict', () => {
  it('resolves a leap-year birth date', () => {
    const result = validateMrz(buildTd3({ ...SPEC, dateOfBirth: '000229' }), OPTS);
    expect(result.valid).toBe(true);
    expect(result.document?.dateOfBirth.iso).toBe('2000-02-29');
  });

  it('accepts an expiry that resolves into the past', () => {
    // An expired passport is a valid MRZ. Expiry is a fact about the document,
    // not a defect in it, and conflating the two would have this package
    // rejecting the evidence of a past status.
    const result = validateMrz(buildTd3({ ...SPEC, dateOfExpiry: '200101' }), OPTS);
    expect(result.valid).toBe(true);
    expect(result.document?.dateOfExpiry.iso).toBe('2020-01-01');
  });

  it('fails a date that names no real day', () => {
    const result = validateMrz(buildTd3({ ...SPEC, dateOfBirth: '900231' }), OPTS);
    expect(result.valid).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain('date_unresolvable');
    expect(result.failures.find((f) => f.code === 'date_unresolvable')?.field).toBe('dateOfBirth');
    // The check digits are still sound — the field is six digits, they simply
    // do not name a day. Reporting both facts is the point.
    expect(failedCheckDigits(result)).toEqual([]);
  });

  it('does not fail a date the issuer left as filler', () => {
    // The check digit still covers the field, so the zone is internally
    // consistent. What is missing is calendar information the issuing state
    // chose not to encode, and downstream code must handle the null rather
    // than be handed a fabricated date.
    const result = validateMrz(buildTd3({ ...SPEC, dateOfBirth: '<<<<<<' }), OPTS);
    expect(result.valid).toBe(true);
    expect(result.document?.dateOfBirth.iso).toBeNull();
    expect(result.document?.dateOfBirth.failure).toBe('all_filler');
  });

  it('does not fail a partly unknown date', () => {
    const result = validateMrz(buildTd3({ ...SPEC, dateOfBirth: '9002<<' }), OPTS);
    expect(result.valid).toBe(true);
    expect(result.document?.dateOfBirth.failure).toBe('partial_filler');
  });

  it('is reproducible for a fixed reference date', () => {
    const mrz = buildTd3({ ...SPEC, dateOfBirth: '300101' });
    expect(validateMrz(mrz, { referenceDate: '2026-07-25' }).document?.dateOfBirth.iso).toBe(
      '1930-01-01',
    );
    expect(validateMrz(mrz, { referenceDate: '2035-07-25' }).document?.dateOfBirth.iso).toBe(
      '2030-01-01',
    );
  });
});

describe('the sex field', () => {
  it('keeps M, F and X apart from an unspecified value', () => {
    expect(validateMrz(buildTd3({ ...SPEC, sex: 'M' }), OPTS).document?.sex).toBe('M');
    expect(validateMrz(buildTd3({ ...SPEC, sex: 'X' }), OPTS).document?.sex).toBe('X');
    expect(validateMrz(buildTd3({ ...SPEC, sex: '<' }), OPTS).document?.sex).toBe('unspecified');
  });

  it('accepts all four permitted values', () => {
    for (const sex of ['M', 'F', 'X', '<']) {
      expect(validateMrz(buildTd3({ ...SPEC, sex }), OPTS).valid, sex).toBe(true);
    }
  });

  it('rejects anything else', () => {
    // The sex position is not covered by the composite digit on TD2 or TD3, so
    // this failure is the only signal that the line was misread there.
    const result = validateMrz(buildTd3({ ...SPEC, sex: 'Q' }), OPTS);
    expect(result.valid).toBe(false);
    expect(failedCheckDigits(result)).toEqual([]);
    const failure = result.failures.find((f) => f.field === 'sex');
    expect(failure?.code).toBe('invalid_field_value');
  });
});

describe('unreadable input', () => {
  it('returns no document and no verdicts', () => {
    for (const raw of ['', '<'.repeat(43), 'nonsense']) {
      const result = validateMrz(raw, OPTS);
      expect(result.valid).toBe(false);
      expect(result.document).toBeNull();
      expect(result.format).toBeNull();
      expect(result.checkDigits).toEqual([]);
      expect(result.failures.length).toBeGreaterThan(0);
    }
  });

  it('accumulates independent failures rather than stopping at the first', () => {
    // A caseworker fixing an OCR error needs the whole list; returning one
    // failure at a time turns one correction into several round trips.
    let mrz = buildTd3({ ...SPEC, sex: 'Q', dateOfBirth: '900231' });
    mrz = corrupt(mrz, 2, 28);
    const result = validateMrz(mrz, OPTS);
    expect(result.valid).toBe(false);
    const codes = new Set(result.failures.map((f) => f.code));
    expect(codes.has('check_digit_mismatch')).toBe(true);
    expect(codes.has('date_unresolvable')).toBe(true);
    expect(codes.has('invalid_field_value')).toBe(true);
  });
});

describe('normalised input reaches the same verdict', () => {
  it('does not care about case, spacing, or line endings', () => {
    const mrz = buildTd3(SPEC);
    const variants = [
      mrz,
      mrz.toLowerCase(),
      mrz.replace(/\n/g, '\r\n'),
      mrz
        .split('\n')
        .map((l) => `  ${l}  `)
        .join('\n'),
      mrz.split('\n').join(''),
    ];
    for (const variant of variants) {
      const result = validateMrz(variant, OPTS);
      expect(result.valid).toBe(true);
      expect(result.document?.documentNumber).toBe('ZZ1234567');
    }
  });

  it('is a pure function of its input', () => {
    const mrz = buildTd2(SPEC);
    const first = validateMrz(mrz, OPTS);
    const second = validateMrz(mrz, OPTS);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('rejects a specimen that has been re-typed by hand with one wrong letter', () => {
    // O and 0 are the transcription failure this whole package exists to catch.
    const mrz = buildMrvB({ ...SPEC, documentNumber: 'ZZ0234567' });
    expect(validateMrz(mrz, OPTS).valid).toBe(true);
    const retyped = corrupt(mrz, 2, 3, 'O');
    expect(validateMrz(retyped, OPTS).valid).toBe(false);
    expect(failedFields(retyped)).toContain('documentNumber');
  });
});
