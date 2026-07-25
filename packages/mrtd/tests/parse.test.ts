import { describe, expect, it } from 'vitest';
import {
  detectFormat,
  layoutFor,
  MRZ_LAYOUTS,
  normalizeMrzLines,
  parseMrz,
  parseNameField,
  stripTrailingFiller,
} from '../src/parse.js';
import type { MrzDocument } from '../src/types.js';
import {
  BUILDERS,
  buildMrvA,
  buildMrvB,
  buildTd1,
  buildTd2,
  buildTd3,
  cd,
  REFERENCE_DATE,
  SPECIMEN as SPEC,
} from './fixtures.js';

const OPTS = { referenceDate: REFERENCE_DATE };

function parsed(mrz: string): MrzDocument {
  const result = parseMrz(mrz, OPTS);
  if (!result.ok) {
    throw new Error(`expected a parse, got ${result.failures.map((f) => f.code).join(', ')}`);
  }
  return result.document;
}

describe('layout table shape', () => {
  it('agrees with the geometry it claims', () => {
    for (const [format, build] of BUILDERS) {
      const lines = build(SPEC).split('\n');
      const layout = MRZ_LAYOUTS[format];
      expect(lines).toHaveLength(layout.lineCount);
      for (const line of lines) expect(line).toHaveLength(layout.lineLength);
    }
  });

  it('gives a composite digit to travel documents and none to visas', () => {
    // An MRV-A has TD3's geometry. Reading its last optional-data character as
    // a composite check digit rejects valid visas, so this is pinned.
    expect(MRZ_LAYOUTS.TD1.composite).not.toBeNull();
    expect(MRZ_LAYOUTS.TD2.composite).not.toBeNull();
    expect(MRZ_LAYOUTS.TD3.composite).not.toBeNull();
    expect(MRZ_LAYOUTS['MRV-A'].composite).toBeNull();
    expect(MRZ_LAYOUTS['MRV-B'].composite).toBeNull();
  });

  it('gives an optional-data check digit only to TD3', () => {
    expect(MRZ_LAYOUTS.TD3.optionalDataCheck).not.toBeNull();
    for (const format of ['TD1', 'TD2', 'MRV-A', 'MRV-B'] as const) {
      expect(MRZ_LAYOUTS[format].optionalDataCheck).toBeNull();
    }
  });

  it('gives a second optional field only to TD1', () => {
    expect(MRZ_LAYOUTS.TD1.optionalData2).not.toBeNull();
    for (const format of ['TD2', 'TD3', 'MRV-A', 'MRV-B'] as const) {
      expect(MRZ_LAYOUTS[format].optionalData2).toBeNull();
    }
  });

  it('is reachable by format through layoutFor', () => {
    for (const [format] of BUILDERS) {
      expect(layoutFor(format)).toBe(MRZ_LAYOUTS[format]);
      expect(layoutFor(format).format).toBe(format);
    }
  });
});

describe('detectFormat', () => {
  it('separates the visa formats from the travel-document formats sharing their geometry', () => {
    expect(detectFormat(buildTd3(SPEC).split('\n'))).toBe('TD3');
    expect(detectFormat(buildMrvA(SPEC).split('\n'))).toBe('MRV-A');
    expect(detectFormat(buildTd2(SPEC).split('\n'))).toBe('TD2');
    expect(detectFormat(buildMrvB(SPEC).split('\n'))).toBe('MRV-B');
    expect(detectFormat(buildTd1(SPEC).split('\n'))).toBe('TD1');
  });

  it('returns null for geometries ICAO does not define', () => {
    expect(detectFormat([])).toBeNull();
    expect(detectFormat(['<'.repeat(44)])).toBeNull();
    expect(detectFormat(['<'.repeat(43), '<'.repeat(43)])).toBeNull();
    expect(detectFormat(['<'.repeat(44), '<'.repeat(36)])).toBeNull();
    expect(detectFormat(['<'.repeat(30), '<'.repeat(30)])).toBeNull();
    expect(detectFormat(['<'.repeat(30), '<'.repeat(30), '<'.repeat(30), '<'.repeat(30)])).toBeNull();
  });
});

describe('round trip', () => {
  it('recovers every field from every format', () => {
    for (const [format, build] of BUILDERS) {
      const document = parsed(build(SPEC));
      expect(document.format).toBe(format);
      expect(document.issuingState).toBe('ZZZ');
      expect(document.nationality).toBe('ZZZ');
      expect(document.documentNumber).toBe('ZZ1234567');
      expect(document.documentNumberExtended).toBe(false);
      expect(document.name.primary).toBe('ESPECIMEN');
      expect(document.name.secondary).toBe('ANA MARIA');
      expect(document.sex).toBe('F');
      expect(document.dateOfBirth.raw).toBe('900215');
      expect(document.dateOfBirth.iso).toBe('1990-02-15');
      expect(document.dateOfExpiry.raw).toBe('300214');
      expect(document.dateOfExpiry.iso).toBe('2030-02-14');
    }
  });

  it('reads the document code and category', () => {
    expect(parsed(buildTd3(SPEC)).category).toBe('passport');
    expect(parsed(buildTd3(SPEC)).documentCode).toBe('P');
    expect(parsed(buildMrvA(SPEC)).category).toBe('visa');
    expect(parsed(buildTd1(SPEC)).category).toBe('id_card');
    expect(parsed(buildTd1({ ...SPEC, documentCode: 'ID' })).documentCode).toBe('ID');
    expect(parsed(buildTd1({ ...SPEC, documentCode: 'AC' })).category).toBe('id_card');
    expect(parsed(buildTd1({ ...SPEC, documentCode: 'XX' })).category).toBe('other');
  });

  it('keeps the two TD1 optional fields apart', () => {
    const document = parsed(
      buildTd1({ ...SPEC, optionalData: 'UPPER123', optionalData2: 'MIDDLE45' }),
    );
    expect(document.optionalData).toBe('UPPER123');
    expect(document.optionalData2).toBe('MIDDLE45');
  });

  it('reports an empty optional field rather than a run of fillers', () => {
    for (const [, build] of BUILDERS) {
      const document = parsed(build(SPEC));
      expect(document.optionalData).toBe('');
      expect(document.optionalData2).toBe('');
    }
  });
});

describe('names', () => {
  it('splits the identifiers at the double filler', () => {
    const name = parseNameField('ESPECIMEN<<ANA<MARIA<<<<<<<<<<<<<<<<<<<<');
    expect(name.primary).toBe('ESPECIMEN');
    expect(name.secondary).toBe('ANA MARIA');
    expect(name.primaryComponents).toEqual(['ESPECIMEN']);
    expect(name.secondaryComponents).toEqual(['ANA', 'MARIA']);
  });

  it('treats a field with no separator as a single identifier', () => {
    // A mononymous holder, or a document recording only a surname. The whole
    // field is the primary identifier and there are no given names to invent.
    const name = parseNameField('ESTERHAZY<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
    expect(name.primary).toBe('ESTERHAZY');
    expect(name.secondary).toBe('');
    expect(name.secondaryComponents).toEqual([]);
  });

  it('keeps a multi-component surname together', () => {
    // `VAN<DER<BERG` is one surname of three components, not three names. The
    // split is on `<<` first and `<` second, never the other way round.
    const name = parseNameField('VAN<DER<BERG<<PIETER<<<<<<<<<<<<<<<<<<<<');
    expect(name.primaryComponents).toEqual(['VAN', 'DER', 'BERG']);
    expect(name.primary).toBe('VAN DER BERG');
    expect(name.secondary).toBe('PIETER');
  });

  it('handles a further separator inside the given names', () => {
    const name = parseNameField('SOLIS<<JOSE<<MARIA<<<<<<<<<<<<<<<<<<<<<<');
    expect(name.primary).toBe('SOLIS');
    expect(name.secondaryComponents).toEqual(['JOSE', 'MARIA']);
  });

  it('flags a name field that is completely full as possibly truncated', () => {
    const full = `${'A'.repeat(20)}<<${'B'.repeat(17)}`;
    expect(full).toHaveLength(39);
    expect(parseNameField(full).possiblyTruncated).toBe(true);
    expect(parseNameField(`${'A'.repeat(19)}<<${'B'.repeat(17)}<`).possiblyTruncated).toBe(false);
  });

  it('round-trips multi-component names through a real document', () => {
    const document = parsed(
      buildTd3({
        ...SPEC,
        primary: ['GARCIA', 'MARQUEZ'],
        secondary: ['GABRIEL', 'JOSE'],
      }),
    );
    expect(document.name.primary).toBe('GARCIA MARQUEZ');
    expect(document.name.secondary).toBe('GABRIEL JOSE');
    expect(document.name.possiblyTruncated).toBe(false);
  });

  it('round-trips a single-name holder', () => {
    const document = parsed(buildTd3({ ...SPEC, primary: ['ESTERHAZY'], secondary: [] }));
    expect(document.name.primary).toBe('ESTERHAZY');
    expect(document.name.secondary).toBe('');
  });
});

describe('extended document numbers', () => {
  const LONG = 'ZZ12345678901';

  it('reassembles a number that spills into the optional field', () => {
    // Nine characters is not enough for several states. 9303 puts the filler
    // in the check-digit position and carries the rest into optional data; a
    // parser without this rejects the document outright.
    for (const [format, build] of BUILDERS) {
      const document = parsed(build({ ...SPEC, documentNumber: LONG }));
      expect(document.format).toBe(format);
      expect(document.documentNumber).toBe(LONG);
      expect(document.documentNumberExtended).toBe(true);
    }
  });

  it('leaves the rest of the optional field intact after the terminator', () => {
    const document = parsed(
      buildTd3({ ...SPEC, documentNumber: LONG, optionalData: 'REST7' }),
    );
    expect(document.documentNumber).toBe(LONG);
    expect(document.optionalData).toBe('REST7');
  });

  it('moves the reported check-digit position into the optional field', () => {
    // The real digit is no longer at line 2 column 10, and a caseworker sent
    // to that column would be looking at a filler.
    const document = parsed(buildTd3({ ...SPEC, documentNumber: LONG }));
    const site = document.checkDigitSites.find((s) => s.field === 'documentNumber');
    expect(site).toBeDefined();
    expect(site?.line).toBe(2);
    // Optional data starts at column 29; the remainder is four characters, so
    // the digit for the whole number sits at column 33.
    expect(site?.column).toBe(33);
    expect(site?.present).toBe(cd(LONG));
    expect(site?.covers).toBe(LONG);
  });

  it('reports a filler check digit with no readable continuation', () => {
    const broken = buildTd3(SPEC)
      .split('\n')
      .map((line, i) => (i === 1 ? `${line.slice(0, 9)}<${line.slice(10)}` : line))
      .join('\n');
    const result = parseMrz(broken, OPTS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.failures.map((f) => f.code)).toContain('extended_document_number_malformed');
    }
  });
});

describe('normalisation', () => {
  it('accepts lowercase and interior whitespace', () => {
    const mrz = buildTd3(SPEC);
    const messy = mrz
      .split('\n')
      .map((line) => `  ${line.slice(0, 20).toLowerCase()} ${line.slice(20)}  `)
      .join('\r\n');
    const document = parsed(messy);
    expect(document.documentNumber).toBe('ZZ1234567');
    expect(document.name.primary).toBe('ESPECIMEN');
  });

  it('splits a zone stored as one unbroken string', () => {
    for (const [format, build] of BUILDERS) {
      const joined = build(SPEC).split('\n').join('');
      expect(normalizeMrzLines(joined)).toEqual(build(SPEC).split('\n'));
      expect(parsed(joined).format).toBe(format);
    }
  });

  it('drops blank lines rather than counting them as geometry', () => {
    const document = parsed(`\n\n${buildTd3(SPEC)}\n\n`);
    expect(document.format).toBe('TD3');
  });

  it('does not repair characters', () => {
    // `0` for `O` is the classic OCR confusion and it happens inside document
    // numbers. Substituting it would produce somebody else's document number;
    // the check digits exist to catch it instead.
    const document = parsed(buildTd3({ ...SPEC, documentNumber: 'ZZ1234567' }));
    expect(document.documentNumber).toBe('ZZ1234567');
    expect(document.documentNumber).not.toContain('O');
  });

  it('leaves its input untouched', () => {
    const mrz = buildTd3(SPEC);
    const copy = `${mrz}`;
    parseMrz(mrz, OPTS);
    expect(mrz).toBe(copy);
  });
});

describe('structural failures', () => {
  it('reports empty input', () => {
    for (const raw of ['', '   ', '\n\n', '\r\n \t\r\n']) {
      const result = parseMrz(raw, OPTS);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.failures[0]?.code).toBe('empty_input');
    }
  });

  it('reports an unrecognised geometry with the lengths it saw', () => {
    const short = buildTd3(SPEC)
      .split('\n')
      .map((line) => line.slice(0, 43))
      .join('\n');
    const result = parseMrz(short, OPTS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0]?.code).toBe('unrecognized_format');
      expect(result.failures[0]?.message).toContain('43');
    }
  });

  it('rejects a line that is one character too long', () => {
    const long = buildTd3(SPEC)
      .split('\n')
      .map((line, i) => (i === 0 ? `${line}<` : line))
      .join('\n');
    const result = parseMrz(long, OPTS);
    expect(result.ok).toBe(false);
  });

  it('locates a character outside the MRZ alphabet', () => {
    const mrz = buildTd3(SPEC);
    const lines = mrz.split('\n');
    const line1 = lines[0] as string;
    lines[0] = `${line1.slice(0, 7)}Ñ${line1.slice(8)}`;
    const result = parseMrz(lines.join('\n'), OPTS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0]?.code).toBe('invalid_character');
      expect(result.failures[0]?.line).toBe(1);
      expect(result.failures[0]?.column).toBe(8);
    }
  });

  it('survives absurd input without throwing', () => {
    const absurd = [
      '<'.repeat(10_000),
      Array.from({ length: 200 }, () => '<'.repeat(44)).join('\n'),
      ' '.repeat(44),
      '\u{1F600}'.repeat(44),
    ];
    for (const raw of absurd) {
      const result = parseMrz(raw, OPTS);
      expect(result.ok).toBe(false);
    }
  });
});

describe('stripTrailingFiller', () => {
  it('removes padding but keeps interior fillers', () => {
    expect(stripTrailingFiller('ABC<<<')).toBe('ABC');
    expect(stripTrailingFiller('A<B<<<')).toBe('A<B');
    expect(stripTrailingFiller('<<<')).toBe('');
    expect(stripTrailingFiller('')).toBe('');
    expect(stripTrailingFiller('ABC')).toBe('ABC');
  });
});
