/**
 * Synthetic MRZ specimens.
 *
 * Every fixture in this package is generated here, from made-up data, with the
 * check digits computed rather than copied. Nothing below is an "official ICAO
 * test vector" and nothing below came from a real document — the issuing state
 * is `ZZZ`, which is not assigned to anybody, and the document numbers are
 * obviously synthetic.
 *
 * The check-digit arithmetic and the field offsets are deliberately
 * reimplemented here instead of imported from `src/`. If the tests built their
 * fixtures with the same layout table the parser reads them with, an off-by-one
 * in that table would produce a fixture that parsed perfectly and the tests
 * would confirm the bug. Two independent implementations that agree is evidence;
 * one implementation agreeing with itself is not.
 */

import type { MrzFormat } from '../src/types.js';

const WEIGHTS = [7, 3, 1] as const;

/** Doc 9303 check digit, reimplemented independently of `src/check-digit.ts`. */
export function cd(field: string): string {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const ch = field.charAt(i);
    let value: number;
    if (ch === '<') value = 0;
    else if (ch >= '0' && ch <= '9') value = ch.charCodeAt(0) - 48;
    else if (ch >= 'A' && ch <= 'Z') value = ch.charCodeAt(0) - 55;
    else throw new Error(`fixture character ${JSON.stringify(ch)} is not an MRZ character`);
    sum += value * (WEIGHTS[i % 3] as number);
  }
  return String(sum % 10);
}

/** Right-pad with the filler to an exact width. */
export function pad(value: string, width: number): string {
  if (value.length > width) {
    throw new Error(`fixture field ${JSON.stringify(value)} exceeds width ${width}`);
  }
  return value + '<'.repeat(width - value.length);
}

/** Build a name field: components joined by `<`, halves joined by `<<`. */
export function nameField(
  primary: readonly string[],
  secondary: readonly string[],
  width: number,
): string {
  const p = primary.join('<');
  const s = secondary.join('<');
  return pad(s.length > 0 ? `${p}<<${s}` : p, width);
}

export interface DocumentNumberFields {
  /** The nine characters that sit in the document-number field. */
  readonly field: string;
  /** The character in the check-digit position — a digit, or `<` when extended. */
  readonly check: string;
  /** Characters the extended encoding prepends to the optional-data field. */
  readonly optionalPrefix: string;
}

/**
 * Lay out a document number, spilling into the optional field when it is longer
 * than nine characters: field keeps the first nine, the check position becomes
 * `<`, and the optional field starts with the remainder, the check digit for
 * the whole number, and a `<` terminator.
 */
export function documentNumberFields(documentNumber: string): DocumentNumberFields {
  if (documentNumber.length <= 9) {
    const field = pad(documentNumber, 9);
    return { field, check: cd(field), optionalPrefix: '' };
  }
  return {
    field: documentNumber.slice(0, 9),
    check: '<',
    optionalPrefix: `${documentNumber.slice(9)}${cd(documentNumber)}<`,
  };
}

export interface SpecimenSpec {
  readonly documentCode?: string;
  readonly issuingState?: string;
  readonly primary: readonly string[];
  readonly secondary?: readonly string[];
  readonly documentNumber: string;
  readonly nationality?: string;
  readonly dateOfBirth: string;
  readonly sex: string;
  readonly dateOfExpiry: string;
  /** Optional / personal-number data, appended after any extended-number prefix. */
  readonly optionalData?: string;
  /** TD1 only: the second optional field, on the middle line. */
  readonly optionalData2?: string;
}

interface Resolved {
  readonly code: string;
  readonly state: string;
  readonly nationality: string;
  readonly secondary: readonly string[];
  readonly number: DocumentNumberFields;
  readonly optional: string;
}

function resolve(spec: SpecimenSpec, defaultCode: string): Resolved {
  const number = documentNumberFields(spec.documentNumber);
  return {
    code: spec.documentCode ?? defaultCode,
    state: spec.issuingState ?? 'ZZZ',
    nationality: spec.nationality ?? 'ZZZ',
    secondary: spec.secondary ?? [],
    number,
    optional: number.optionalPrefix + (spec.optionalData ?? ''),
  };
}

/** TD3 — the passport format. Two lines of forty-four. */
export function buildTd3(spec: SpecimenSpec): string {
  const r = resolve(spec, 'P');
  const line1 = pad(r.code, 2) + pad(r.state, 3) + nameField(spec.primary, r.secondary, 39);
  const optionalField = pad(r.optional, 14);
  const head =
    r.number.field +
    r.number.check +
    pad(r.nationality, 3) +
    spec.dateOfBirth +
    cd(spec.dateOfBirth) +
    spec.sex +
    spec.dateOfExpiry +
    cd(spec.dateOfExpiry) +
    optionalField +
    cd(optionalField);
  const composite = cd(head.slice(0, 10) + head.slice(13, 20) + head.slice(21, 43));
  return `${line1}\n${head}${composite}`;
}

/** TD2 — two lines of thirty-six. */
export function buildTd2(spec: SpecimenSpec): string {
  const r = resolve(spec, 'I');
  const line1 = pad(r.code, 2) + pad(r.state, 3) + nameField(spec.primary, r.secondary, 31);
  const head =
    r.number.field +
    r.number.check +
    pad(r.nationality, 3) +
    spec.dateOfBirth +
    cd(spec.dateOfBirth) +
    spec.sex +
    spec.dateOfExpiry +
    cd(spec.dateOfExpiry) +
    pad(r.optional, 7);
  const composite = cd(head.slice(0, 10) + head.slice(13, 20) + head.slice(21, 35));
  return `${line1}\n${head}${composite}`;
}

/** TD1 — three lines of thirty, the card format. */
export function buildTd1(spec: SpecimenSpec): string {
  const r = resolve(spec, 'I');
  const line1 = pad(r.code, 2) + pad(r.state, 3) + r.number.field + r.number.check + pad(r.optional, 15);
  const head =
    spec.dateOfBirth +
    cd(spec.dateOfBirth) +
    spec.sex +
    spec.dateOfExpiry +
    cd(spec.dateOfExpiry) +
    pad(r.nationality, 3) +
    pad(spec.optionalData2 ?? '', 11);
  const composite = cd(
    line1.slice(5, 30) + head.slice(0, 7) + head.slice(8, 15) + head.slice(18, 29),
  );
  const line3 = nameField(spec.primary, r.secondary, 30);
  return `${line1}\n${head}${composite}\n${line3}`;
}

/** MRV-A — the full-size visa sticker. TD3 geometry, no composite digit. */
export function buildMrvA(spec: SpecimenSpec): string {
  const r = resolve(spec, 'V');
  const line1 = pad(r.code, 2) + pad(r.state, 3) + nameField(spec.primary, r.secondary, 39);
  const line2 =
    r.number.field +
    r.number.check +
    pad(r.nationality, 3) +
    spec.dateOfBirth +
    cd(spec.dateOfBirth) +
    spec.sex +
    spec.dateOfExpiry +
    cd(spec.dateOfExpiry) +
    pad(r.optional, 16);
  return `${line1}\n${line2}`;
}

/** MRV-B — the reduced-size visa sticker. TD2 geometry, no composite digit. */
export function buildMrvB(spec: SpecimenSpec): string {
  const r = resolve(spec, 'V');
  const line1 = pad(r.code, 2) + pad(r.state, 3) + nameField(spec.primary, r.secondary, 31);
  const line2 =
    r.number.field +
    r.number.check +
    pad(r.nationality, 3) +
    spec.dateOfBirth +
    cd(spec.dateOfBirth) +
    spec.sex +
    spec.dateOfExpiry +
    cd(spec.dateOfExpiry) +
    pad(r.optional, 8);
  return `${line1}\n${line2}`;
}

/** The next character in the MRZ alphabet — always different from the input. */
export function bump(ch: string): string {
  if (ch >= '0' && ch <= '9') return String((Number(ch) + 1) % 10);
  if (ch >= 'A' && ch <= 'Y') return String.fromCharCode(ch.charCodeAt(0) + 1);
  if (ch === 'Z') return 'A';
  return '0';
}

/**
 * Replace one character. `line` and `column` are 1-based, matching the
 * coordinates the validator reports, so a test can corrupt exactly the position
 * a verdict points at.
 */
export function corrupt(mrz: string, line: number, column: number, replacement?: string): string {
  const lines = mrz.split('\n');
  const target = lines[line - 1];
  if (target === undefined) throw new Error(`fixture has no line ${line}`);
  const ch = target[column - 1];
  if (ch === undefined) throw new Error(`fixture line ${line} has no column ${column}`);
  lines[line - 1] = target.slice(0, column - 1) + (replacement ?? bump(ch)) + target.slice(column);
  return lines.join('\n');
}

/** The reference date every test resolves two-digit years against. */
export const REFERENCE_DATE = '2026-07-25';

/** The baseline specimen. Entirely invented; `ZZZ` is not an assigned state code. */
export const SPECIMEN: SpecimenSpec = {
  primary: ['ESPECIMEN'],
  secondary: ['ANA', 'MARIA'],
  documentNumber: 'ZZ1234567',
  dateOfBirth: '900215',
  sex: 'F',
  dateOfExpiry: '300214',
};

/** Every format, so a suite can assert the same property across all five. */
export const BUILDERS: ReadonlyArray<readonly [MrzFormat, (spec: SpecimenSpec) => string]> = [
  ['TD1', buildTd1],
  ['TD2', buildTd2],
  ['TD3', buildTd3],
  ['MRV-A', buildMrvA],
  ['MRV-B', buildMrvB],
];
