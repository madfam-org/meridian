import { describe, expect, it } from 'vitest';
import {
  BIRTH_WINDOW_YEARS,
  EXPIRY_LOOKAHEAD_YEARS,
  EXPIRY_LOOKBACK_YEARS,
  interpretBirthDate,
  interpretExpiryDate,
  todayUtc,
} from '../src/dates.js';

const REF = '2026-07-25';

function birth(yymmdd: string, reference = REF): string {
  const r = interpretBirthDate(yymmdd, reference);
  if (!r.ok) throw new Error(`expected a date, got ${r.reason}`);
  return r.value;
}

function expiry(yymmdd: string, reference = REF): string {
  const r = interpretExpiryDate(yymmdd, reference);
  if (!r.ok) throw new Error(`expected a date, got ${r.reason}`);
  return r.value;
}

function birthReason(yymmdd: string, reference = REF): string {
  const r = interpretBirthDate(yymmdd, reference);
  if (r.ok) throw new Error(`expected a failure, got ${r.value}`);
  return r.reason;
}

describe('window constants', () => {
  it('describe a pair of hundred-year windows', () => {
    expect(BIRTH_WINDOW_YEARS).toBe(100);
    expect(EXPIRY_LOOKBACK_YEARS + EXPIRY_LOOKAHEAD_YEARS).toBe(100);
  });
});

describe('interpretBirthDate', () => {
  it('resolves an ordinary birth date into the past', () => {
    expect(birth('900215')).toBe('1990-02-15');
    expect(birth('651231')).toBe('1965-12-31');
    expect(birth('050601')).toBe('2005-06-01');
  });

  it('accepts a birth date equal to the reference date', () => {
    // The window is closed at the top: a newborn presenting on the day of
    // birth is not a hundred-year-old.
    expect(birth('260725')).toBe('2026-07-25');
  });

  it('pushes a birth date one day past the reference back a century', () => {
    // Nobody is born tomorrow. This is the sliding window's whole job, and it
    // is the boundary that a hard-coded pivot year gets wrong silently.
    expect(birth('260726')).toBe('1926-07-26');
    expect(birth('260724')).toBe('2026-07-24');
  });

  it('excludes the far end of the window so exactly one century qualifies', () => {
    // 1926-07-25 is exactly a hundred years before the reference and falls
    // outside; the same six digits resolve forward instead.
    expect(birth('260725')).not.toBe('1926-07-25');
  });

  it('slides with the reference date instead of pivoting on a fixed year', () => {
    expect(birth('300101', '2026-07-25')).toBe('1930-01-01');
    expect(birth('300101', '2035-07-25')).toBe('2030-01-01');
  });

  it('handles 29 February in a leap year', () => {
    expect(birth('000229')).toBe('2000-02-29');
    expect(birth('240229')).toBe('2024-02-29');
    expect(birth('960229')).toBe('1996-02-29');
  });

  it('refuses 29 February when the resolved century is not a leap year', () => {
    // 1900 was not a leap year and 2000 was. With a 1999 reference the window
    // admits only 1900, so the answer is that the date does not exist — not a
    // quiet slide to the century that happens to work.
    expect(birthReason('000229', '1999-06-01')).toBe('not_a_calendar_date');
    // 2100 is not a leap year either, and neither 1900 nor 2000 is in range.
    expect(birthReason('000229', '2150-01-01')).toBe('not_a_calendar_date');
  });

  it('refuses days and months that do not exist', () => {
    expect(birthReason('990230')).toBe('not_a_calendar_date');
    expect(birthReason('990431')).toBe('not_a_calendar_date');
    expect(birthReason('991301')).toBe('not_a_calendar_date');
    expect(birthReason('990001')).toBe('not_a_calendar_date');
    expect(birthReason('990100')).toBe('not_a_calendar_date');
  });

  it('separates a wholly unknown date from a partly unknown one', () => {
    // Neither is a defect in the document: the issuer encoded what it knew.
    expect(birthReason('<<<<<<')).toBe('all_filler');
    expect(birthReason('85<<<<')).toBe('partial_filler');
    expect(birthReason('8502<<')).toBe('partial_filler');
  });

  it('refuses malformed fields', () => {
    expect(birthReason('9002')).toBe('wrong_length');
    expect(birthReason('9002155')).toBe('wrong_length');
    expect(birthReason('')).toBe('wrong_length');
    expect(birthReason('9O0215')).toBe('non_numeric');
    expect(birthReason('90 215')).toBe('non_numeric');
  });

  it('is deterministic for a fixed reference date', () => {
    expect(birth('900215')).toBe(birth('900215'));
  });

  it('treats a bad reference date as a caller bug, not a document defect', () => {
    expect(() => interpretBirthDate('900215', 'not-a-date')).toThrow(RangeError);
    expect(() => interpretBirthDate('900215', '2026-13-01')).toThrow(RangeError);
    expect(() => interpretBirthDate('900215', '2026-02-30')).toThrow(RangeError);
    expect(() => interpretBirthDate('900215', '1899-12-31')).toThrow(RangeError);
  });
});

describe('interpretExpiryDate', () => {
  it('resolves a future expiry', () => {
    expect(expiry('300214')).toBe('2030-02-14');
    expect(expiry('351231')).toBe('2035-12-31');
  });

  it('resolves a recently expired document into the past', () => {
    // An expired passport is presented constantly — as proof of past status,
    // or of the identity under which an earlier application was made. A rule
    // that pushed it a century forward would report it as valid.
    expect(expiry('240101')).toBe('2024-01-01');
    expect(expiry('990101')).toBe('1999-01-01');
  });

  it('places the lookback boundary exactly thirty years back', () => {
    expect(expiry('960725')).toBe('1996-07-25');
    // One day earlier falls out of the lookback and resolves forward instead.
    // This is the documented cost of choosing a boundary at all; it is why the
    // resolved date is reported rather than used silently.
    expect(expiry('960724')).toBe('2096-07-24');
  });

  it('slides with the reference date, one day at a time', () => {
    expect(expiry('980101', '2026-07-25')).toBe('1998-01-01');
    // The lookback edge for `980101` falls on 2028-01-01. On that day the
    // document still resolves into the past; one day later the same six digits
    // resolve forward. A pivot year cannot express this, which is why there
    // isn't one.
    expect(expiry('980101', '2028-01-01')).toBe('1998-01-01');
    expect(expiry('980101', '2028-01-02')).toBe('2098-01-01');
    expect(expiry('980101', '2100-01-01')).toBe('2098-01-01');
  });

  it('handles leap days', () => {
    expect(expiry('000229')).toBe('2000-02-29');
    expect(expiry('280229')).toBe('2028-02-29');
  });

  it('reports the same failure vocabulary as birth dates', () => {
    const filler = interpretExpiryDate('<<<<<<', REF);
    expect(filler.ok).toBe(false);
    if (!filler.ok) expect(filler.reason).toBe('all_filler');

    const impossible = interpretExpiryDate('301301', REF);
    expect(impossible.ok).toBe(false);
    if (!impossible.ok) expect(impossible.reason).toBe('not_a_calendar_date');
  });
});

describe('todayUtc', () => {
  it('produces a well-formed calendar date', () => {
    const today = todayUtc();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // It must be usable as a reference date without further massaging.
    expect(() => interpretBirthDate('900215', today)).not.toThrow();
  });
});
