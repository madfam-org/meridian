import { describe, expect, it } from 'vitest';
import {
  characterValue,
  computeCheckDigit,
  isMrzCharacter,
  MRZ_FILLER,
  MrzCharacterError,
  verifyCheckDigit,
} from '../src/check-digit.js';

describe('characterValue', () => {
  it('scores digits as themselves and letters from ten', () => {
    expect(characterValue('0')).toBe(0);
    expect(characterValue('9')).toBe(9);
    expect(characterValue('A')).toBe(10);
    expect(characterValue('Z')).toBe(35);
    expect(characterValue(MRZ_FILLER)).toBe(0);
  });

  it('rejects lowercase rather than scoring it as filler', () => {
    // The failure mode this guards: a lowercase letter scored as zero would
    // make `Ao1234567` validate against the check digit for `A<1234567`, and
    // a document number one character off belongs to somebody else.
    expect(() => characterValue('a')).toThrow(MrzCharacterError);
    expect(() => characterValue('o')).toThrow(MrzCharacterError);
  });

  it('rejects spaces, punctuation, and non-ASCII letters', () => {
    for (const ch of [' ', '-', '.', '/', '\u00D1', '\u00D8', '\u00AB', '\u00A0', '\t']) {
      expect(() => characterValue(ch)).toThrow(MrzCharacterError);
    }
  });

  it('reports the offending character and its offset', () => {
    try {
      characterValue('x', 7);
      throw new Error('expected a throw');
    } catch (e) {
      expect(e).toBeInstanceOf(MrzCharacterError);
      expect((e as MrzCharacterError).character).toBe('x');
      expect((e as MrzCharacterError).index).toBe(7);
    }
  });

  it('rejects anything that is not exactly one character', () => {
    expect(() => characterValue('')).toThrow(MrzCharacterError);
    expect(() => characterValue('AB')).toThrow(MrzCharacterError);
    // An astral-plane character is two UTF-16 code units, so the length guard
    // catches it before `charCodeAt` sees half a surrogate pair.
    expect(() => characterValue('\u{1F600}')).toThrow(MrzCharacterError);
  });
});

describe('isMrzCharacter', () => {
  it('is a total predicate', () => {
    expect(isMrzCharacter('A')).toBe(true);
    expect(isMrzCharacter('7')).toBe(true);
    expect(isMrzCharacter('<')).toBe(true);
    expect(isMrzCharacter('a')).toBe(false);
    expect(isMrzCharacter('')).toBe(false);
    expect(isMrzCharacter('AB')).toBe(false);
  });
});

describe('computeCheckDigit', () => {
  it('applies the 7-3-1 weights from the start of the field', () => {
    // 1*7 + 2*3 + 3*1 + 4*7 + 5*3 + 6*1 + 7*7 + 8*3 + 9*1 = 147 -> 7
    expect(computeCheckDigit('123456789')).toBe(7);
  });

  it('scores a single letter by its position weight', () => {
    // 'A' is 10, first weight is 7, 70 mod 10 = 0.
    expect(computeCheckDigit('A')).toBe(0);
    // 'Z' is 35, 35*7 = 245 -> 5.
    expect(computeCheckDigit('Z')).toBe(5);
  });

  it('is unchanged by trailing filler', () => {
    // Load-bearing for BAC: the document number is padded to nine characters
    // before its check digit is taken, and the padding must not shift it.
    expect(computeCheckDigit('AB1234')).toBe(computeCheckDigit('AB1234<<<'));
    expect(computeCheckDigit('ZZ1234567')).toBe(computeCheckDigit('ZZ1234567<<<<<'));
  });

  it('is changed by leading filler unless the shift is a whole weight cycle', () => {
    // Padding on the wrong side shifts every weight. A caller that left-pads a
    // short document number derives a different BAC key and gets an opaque
    // failure at the card. The three-filler case coincidentally agrees, because
    // the weight cycle is three long — which is exactly the kind of accident
    // that makes a bug like this survive a casual test.
    expect(computeCheckDigit('<AB1234')).not.toBe(computeCheckDigit('AB1234'));
    expect(computeCheckDigit('<<AB1234')).not.toBe(computeCheckDigit('AB1234'));
    expect(computeCheckDigit('<<<AB1234')).toBe(computeCheckDigit('AB1234'));
  });

  it('treats an all-filler field as zero', () => {
    expect(computeCheckDigit('<'.repeat(14))).toBe(0);
  });

  it('refuses an empty field instead of returning zero', () => {
    expect(() => computeCheckDigit('')).toThrow(RangeError);
  });

  it('propagates the character error with the offset inside the field', () => {
    try {
      computeCheckDigit('ZZ12a4567');
      throw new Error('expected a throw');
    } catch (e) {
      expect(e).toBeInstanceOf(MrzCharacterError);
      expect((e as MrzCharacterError).index).toBe(4);
    }
  });
});

describe('verifyCheckDigit', () => {
  it('accepts the digit as a character or a number', () => {
    expect(verifyCheckDigit('123456789', '7')).toBe(true);
    expect(verifyCheckDigit('123456789', 7)).toBe(true);
    expect(verifyCheckDigit('123456789', '8')).toBe(false);
    expect(verifyCheckDigit('123456789', 8)).toBe(false);
  });

  it('does not accept the filler as a check digit', () => {
    // Zero and filler score identically inside a field, but a filler *in the
    // check position* means something else entirely (an over-long document
    // number), and the one place 9303 tolerates it is handled in validate.ts.
    expect(computeCheckDigit('<'.repeat(14))).toBe(0);
    expect(verifyCheckDigit('<'.repeat(14), '<')).toBe(false);
    expect(verifyCheckDigit('<'.repeat(14), '0')).toBe(true);
  });

  it('rejects a letter in the check position', () => {
    expect(verifyCheckDigit('123456789', 'A')).toBe(false);
    expect(verifyCheckDigit('123456789', 'a')).toBe(false);
  });

  it('treats an impossible expectation as a caller bug', () => {
    expect(() => verifyCheckDigit('123456789', 10)).toThrow(RangeError);
    expect(() => verifyCheckDigit('123456789', -1)).toThrow(RangeError);
    expect(() => verifyCheckDigit('123456789', 7.5)).toThrow(RangeError);
    expect(() => verifyCheckDigit('123456789', '')).toThrow(RangeError);
    expect(() => verifyCheckDigit('123456789', '07')).toThrow(RangeError);
  });

  it('still rejects bad characters in the field being checked', () => {
    expect(() => verifyCheckDigit('12345678 ', '7')).toThrow(MrzCharacterError);
  });
});
