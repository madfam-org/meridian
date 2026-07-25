/**
 * The Doc 9303 check digit.
 *
 * One algorithm, used at every check position in every MRZ format: each
 * character is scored (`0`-`9` are their own value, `A`-`Z` are 10-35, the
 * filler `<` is 0), multiplied by a weight cycling 7, 3, 1 from the start of
 * the field, and the digit is the sum modulo 10.
 *
 * The design decision worth stating out loud is what happens to a character
 * that is not in the MRZ alphabet. Scoring it as zero — which several published
 * implementations do, because `<` is zero and an unknown character looks like
 * padding — is silent corruption: a lowercase `o` from a bad OCR pass would
 * score the same as `<`, and a document number of `AO1234567` could validate as
 * `Ao1234567`. That is a wrong identity attached to a real person's file. So
 * every character is checked, and anything outside `[0-9A-Z<]` throws.
 *
 * Case normalisation is a caller's job and happens once, explicitly, in
 * `normalizeMrzLines`. This module stays strict on purpose: the place to decide
 * that lowercase input is acceptable is the API boundary, in the open, not
 * buried in an arithmetic primitive.
 */

/** The filler character. Scores zero, and pads every fixed-width MRZ field. */
export const MRZ_FILLER = '<';

/**
 * Weights cycle from the first character of the field, not from the first
 * character of the line. Restarting the cycle per field is what makes the
 * composite digit computable from concatenated slices.
 */
const WEIGHTS: readonly number[] = [7, 3, 1];

const CODE_FILLER = 60; // '<'
const CODE_0 = 48;
const CODE_9 = 57;
const CODE_A = 65;
const CODE_Z = 90;

/** A character outside the MRZ alphabet reached the arithmetic. */
export class MrzCharacterError extends RangeError {
  /** The offending character, exactly as supplied. */
  readonly character: string;
  /** Its 0-based offset within the field that was being scored. */
  readonly index: number;

  constructor(character: string, index: number) {
    super(
      `character ${JSON.stringify(character)} at index ${index} is not in the ` +
        `ICAO 9303 MRZ character set (A-Z, 0-9, '<')`,
    );
    this.name = 'MrzCharacterError';
    this.character = character;
    this.index = index;
  }
}

/** True when `ch` is exactly one character and is in the MRZ alphabet. */
export function isMrzCharacter(ch: string): boolean {
  if (ch.length !== 1) return false;
  const c = ch.charCodeAt(0);
  return c === CODE_FILLER || (c >= CODE_0 && c <= CODE_9) || (c >= CODE_A && c <= CODE_Z);
}

/**
 * The numeric value of one MRZ character.
 *
 * @param index reported in {@link MrzCharacterError} so a caller can point at
 *   the exact position that failed rather than at the whole field.
 * @throws {MrzCharacterError} for anything outside `[0-9A-Z<]`, including
 *   lowercase, spaces, and accented letters.
 */
export function characterValue(ch: string, index = 0): number {
  if (ch.length !== 1) throw new MrzCharacterError(ch, index);
  const c = ch.charCodeAt(0);
  if (c === CODE_FILLER) return 0;
  if (c >= CODE_0 && c <= CODE_9) return c - CODE_0;
  if (c >= CODE_A && c <= CODE_Z) return c - CODE_A + 10;
  throw new MrzCharacterError(ch, index);
}

/**
 * The check digit for a field.
 *
 * Trailing filler does not change the result — `<` scores zero and zero times
 * any weight is zero — so `computeCheckDigit('AB1234')` and
 * `computeCheckDigit('AB1234<<<')` agree. That identity is load-bearing for
 * BAC key derivation, where the document number is padded to nine characters.
 *
 * @throws {RangeError} on an empty field. An empty field has no check digit,
 *   and returning 0 for it would let a caller silently validate nothing at all.
 * @throws {MrzCharacterError} on a character outside the MRZ alphabet.
 */
export function computeCheckDigit(input: string): number {
  if (input.length === 0) {
    throw new RangeError(
      'computeCheckDigit requires a non-empty field; an empty field has no check digit',
    );
  }
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i] as string;
    sum += characterValue(ch, i) * (WEIGHTS[i % WEIGHTS.length] as number);
  }
  return sum % 10;
}

/**
 * Whether `expected` is the correct check digit for `input`.
 *
 * A non-digit `expected` — including the filler `<` — returns `false`. The one
 * place Doc 9303 permits a filler in a check-digit position is the TD3
 * personal-number digit when that field is unused, and that leniency is applied
 * in `validate.ts` where it can be recorded on the verdict and explained to the
 * reader, rather than here where it would be invisible.
 *
 * @throws {RangeError} when `expected` is a number outside 0-9 or a string that
 *   is not exactly one character — both are caller bugs, not document defects.
 * @throws {MrzCharacterError} when `input` contains a character outside the
 *   MRZ alphabet.
 */
export function verifyCheckDigit(input: string, expected: string | number): boolean {
  const computed = computeCheckDigit(input);
  if (typeof expected === 'number') {
    if (!Number.isInteger(expected) || expected < 0 || expected > 9) {
      throw new RangeError(`check digit must be an integer 0-9, got ${expected}`);
    }
    return computed === expected;
  }
  if (expected.length !== 1) {
    throw new RangeError(
      `check digit must be exactly one character, got ${JSON.stringify(expected)}`,
    );
  }
  const c = expected.charCodeAt(0);
  if (c < CODE_0 || c > CODE_9) return false;
  return computed === c - CODE_0;
}
