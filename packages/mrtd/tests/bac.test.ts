import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BAC_KEY_SEED_BYTES, deriveBacKeySeed, mrzInformation } from '../src/bac.js';
import { MrzCharacterError } from '../src/check-digit.js';
import { parseMrz } from '../src/parse.js';
import { buildTd3, REFERENCE_DATE, SPECIMEN as SPEC } from './fixtures.js';

const OPTS = { referenceDate: REFERENCE_DATE };

describe('mrzInformation', () => {
  it('concatenates each field with its own check digit', () => {
    // Worked by hand from the synthetic specimen:
    //   ZZ1234567 -> 8, 900215 -> 5, 300214 -> 2
    expect(mrzInformation('ZZ1234567', '900215', '300214')).toBe('ZZ1234567890021553002142');
  });

  it('is twenty-four characters for a document number that fits the field', () => {
    expect(mrzInformation('ZZ1234567', '900215', '300214')).toHaveLength(24);
    expect(mrzInformation('AB1234', '900215', '300214')).toHaveLength(24);
  });

  it('right-pads a short document number to nine characters', () => {
    const info = mrzInformation('AB1234', '900215', '300214');
    expect(info.startsWith('AB1234<<<')).toBe(true);
    // Padding with filler cannot change the check digit, so the digit for the
    // padded field is the digit for the bare number.
    expect(info.charAt(9)).toBe('1');
  });

  it('matches the characters the MRZ actually carries', () => {
    // For a number that fits the field, the MRZ information is literally three
    // slices of line 2 concatenated. If this ever diverges, one of the two is
    // wrong and the chip will refuse to talk.
    const result = parseMrz(buildTd3(SPEC), OPTS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const line2 = result.document.lines[1] as string;
    const fromZone = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 28);
    expect(
      mrzInformation(
        result.document.documentNumber,
        result.document.dateOfBirth.raw,
        result.document.dateOfExpiry.raw,
      ),
    ).toBe(fromZone);
  });

  it('uses the whole number, and its own check digit, when the number is extended', () => {
    // This is the reading documented in bac.ts. It is deliberately pinned so
    // that a change of mind about it is visible in a diff rather than silent.
    const long = 'ZZ12345678901';
    const result = parseMrz(buildTd3({ ...SPEC, documentNumber: long }), OPTS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.documentNumber).toBe(long);
    const info = mrzInformation(long, '900215', '300214');
    expect(info.startsWith(long)).toBe(true);
    expect(info).toHaveLength(long.length + 1 + 7 + 7);
  });

  it('refuses input it cannot score', () => {
    // Lowercase here is a bug, not something to normalise away: the seed must
    // be derived from the characters the chip was personalised with.
    expect(() => mrzInformation('zz1234567', '900215', '300214')).toThrow(MrzCharacterError);
    expect(() => mrzInformation('ZZ 234567', '900215', '300214')).toThrow(MrzCharacterError);
    expect(() => mrzInformation('ZZ1234567', '90021', '300214')).toThrow(RangeError);
    expect(() => mrzInformation('ZZ1234567', '900215', '3002145')).toThrow(RangeError);
    expect(() => mrzInformation('', '900215', '300214')).toThrow(RangeError);
  });

  it('accepts a filler date, because the MRZ may carry one', () => {
    // A date the issuer left blank still contributes its characters to the
    // seed. Refusing it here would make an otherwise readable chip unreadable.
    expect(mrzInformation('ZZ1234567', '<<<<<<', '300214')).toHaveLength(24);
  });
});

describe('deriveBacKeySeed', () => {
  const INFO = mrzInformation('ZZ1234567', '900215', '300214');

  it('is the first sixteen bytes of the SHA-1 digest', () => {
    expect(BAC_KEY_SEED_BYTES).toBe(16);
    const seed = deriveBacKeySeed(INFO);
    expect(seed).toBeInstanceOf(Uint8Array);
    expect(seed).toHaveLength(16);

    const full = new Uint8Array(createHash('sha1').update(INFO, 'ascii').digest());
    expect(full).toHaveLength(20);
    expect(Array.from(seed)).toEqual(Array.from(full.subarray(0, 16)));
  });

  it('is deterministic', () => {
    expect(Array.from(deriveBacKeySeed(INFO))).toEqual(Array.from(deriveBacKeySeed(INFO)));
  });

  it('changes completely when one character of the zone changes', () => {
    const other = mrzInformation('ZZ1234568', '900215', '300214');
    expect(other).not.toBe(INFO);
    expect(Array.from(deriveBacKeySeed(other))).not.toEqual(Array.from(deriveBacKeySeed(INFO)));
  });

  it('does not alias the underlying digest buffer', () => {
    // `subarray` shares memory with the digest; a caller zeroing the seed must
    // not be able to reach anything else, and two seeds must not share storage.
    const a = deriveBacKeySeed(INFO);
    const b = deriveBacKeySeed(INFO);
    a.fill(0);
    expect(Array.from(b)).not.toEqual(Array.from(a));
  });

  it('refuses a truncated MRZ information string', () => {
    // A short input derives a wrong key that fails at the card with an opaque
    // error, hours of debugging away from the transcription mistake that
    // caused it.
    expect(() => deriveBacKeySeed(INFO.slice(0, 23))).toThrow(RangeError);
    expect(() => deriveBacKeySeed('')).toThrow(RangeError);
  });
});
