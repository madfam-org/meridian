/**
 * Reading the machine-readable zone.
 *
 * This module knows exactly one thing: where each field sits in each of the
 * five Doc 9303 line geometries. It extracts substrings and locates check-digit
 * positions; it does not verify anything. Verification lives in `validate.ts`,
 * and the separation is deliberate — if the same module both computed offsets
 * and checked digits, a mistake in the offset table would be checked against
 * itself and every test would pass.
 *
 * The offsets below are 0-based. Doc 9303 numbers positions from 1, so each
 * `start` here is one less than the published position. The tests assert the
 * substrings that come out, not the numbers that go in, which is the only way
 * an off-by-one in a table like this gets caught.
 */

import { isMrzCharacter, MRZ_FILLER } from './check-digit.js';
import { interpretBirthDate, interpretExpiryDate, todayUtc } from './dates.js';
import type {
  CheckDigitSite,
  DocumentCategory,
  MrzDateField,
  MrzDateReading,
  MrzDocument,
  MrzFailure,
  MrzFormat,
  MrzLayout,
  MrzName,
  MrzOptions,
  MrzParseResult,
  MrzPosition,
  MrzSex,
  MrzSpan,
} from './types.js';

const span = (line: number, start: number, length: number): MrzSpan => ({ line, start, length });
const pos = (line: number, index: number): MrzPosition => ({ line, index });

/**
 * TD1 — three lines of thirty. The card format.
 *
 * The composite digit is the awkward one: it covers the upper line from the
 * document number onward, then three disjoint slices of the middle line,
 * skipping the sex character and the nationality. Fifty characters in total.
 * Skipping fields is not arbitrary — the composite covers exactly the fields
 * that already carry their own digit plus the optional data, so a transposition
 * between two covered fields cannot cancel out.
 */
const TD1: MrzLayout = {
  format: 'TD1',
  lineCount: 3,
  lineLength: 30,
  documentCode: span(0, 0, 2),
  issuingState: span(0, 2, 3),
  documentNumber: span(0, 5, 9),
  documentNumberCheck: pos(0, 14),
  optionalData: span(0, 15, 15),
  dateOfBirth: span(1, 0, 6),
  dateOfBirthCheck: pos(1, 6),
  sex: pos(1, 7),
  dateOfExpiry: span(1, 8, 6),
  dateOfExpiryCheck: pos(1, 14),
  nationality: span(1, 15, 3),
  optionalData2: span(1, 18, 11),
  optionalDataCheck: null,
  name: span(2, 0, 30),
  composite: {
    at: pos(1, 29),
    spans: [span(0, 5, 25), span(1, 0, 7), span(1, 8, 7), span(1, 18, 11)],
  },
};

/** TD2 — two lines of thirty-six. */
const TD2: MrzLayout = {
  format: 'TD2',
  lineCount: 2,
  lineLength: 36,
  documentCode: span(0, 0, 2),
  issuingState: span(0, 2, 3),
  name: span(0, 5, 31),
  documentNumber: span(1, 0, 9),
  documentNumberCheck: pos(1, 9),
  nationality: span(1, 10, 3),
  dateOfBirth: span(1, 13, 6),
  dateOfBirthCheck: pos(1, 19),
  sex: pos(1, 20),
  dateOfExpiry: span(1, 21, 6),
  dateOfExpiryCheck: pos(1, 27),
  optionalData: span(1, 28, 7),
  optionalDataCheck: null,
  optionalData2: null,
  composite: {
    at: pos(1, 35),
    spans: [span(1, 0, 10), span(1, 13, 7), span(1, 21, 14)],
  },
};

/**
 * TD3 — two lines of forty-four. The passport.
 *
 * The only format whose optional field carries its own check digit. That digit
 * is also the only position in any format where Doc 9303 tolerates a filler
 * instead of a digit, and only when the personal-number field is entirely
 * unused; see `validate.ts` for how that leniency is applied and recorded.
 */
const TD3: MrzLayout = {
  format: 'TD3',
  lineCount: 2,
  lineLength: 44,
  documentCode: span(0, 0, 2),
  issuingState: span(0, 2, 3),
  name: span(0, 5, 39),
  documentNumber: span(1, 0, 9),
  documentNumberCheck: pos(1, 9),
  nationality: span(1, 10, 3),
  dateOfBirth: span(1, 13, 6),
  dateOfBirthCheck: pos(1, 19),
  sex: pos(1, 20),
  dateOfExpiry: span(1, 21, 6),
  dateOfExpiryCheck: pos(1, 27),
  optionalData: span(1, 28, 14),
  optionalDataCheck: pos(1, 42),
  optionalData2: null,
  composite: {
    at: pos(1, 43),
    spans: [span(1, 0, 10), span(1, 13, 7), span(1, 21, 22)],
  },
};

/**
 * MRV-A — the full-size visa sticker. Same geometry as TD3, different tail.
 *
 * There is no composite check digit and no optional-data check digit. The
 * sixteen characters from position 29 to the end of the line are optional data,
 * full stop. Reading the last one as a composite digit — which happens when
 * software detects format by line length alone — rejects valid visas.
 */
const MRV_A: MrzLayout = {
  format: 'MRV-A',
  lineCount: 2,
  lineLength: 44,
  documentCode: span(0, 0, 2),
  issuingState: span(0, 2, 3),
  name: span(0, 5, 39),
  documentNumber: span(1, 0, 9),
  documentNumberCheck: pos(1, 9),
  nationality: span(1, 10, 3),
  dateOfBirth: span(1, 13, 6),
  dateOfBirthCheck: pos(1, 19),
  sex: pos(1, 20),
  dateOfExpiry: span(1, 21, 6),
  dateOfExpiryCheck: pos(1, 27),
  optionalData: span(1, 28, 16),
  optionalDataCheck: null,
  optionalData2: null,
  composite: null,
};

/** MRV-B — the reduced-size visa sticker. TD2 geometry, no composite digit. */
const MRV_B: MrzLayout = {
  format: 'MRV-B',
  lineCount: 2,
  lineLength: 36,
  documentCode: span(0, 0, 2),
  issuingState: span(0, 2, 3),
  name: span(0, 5, 31),
  documentNumber: span(1, 0, 9),
  documentNumberCheck: pos(1, 9),
  nationality: span(1, 10, 3),
  dateOfBirth: span(1, 13, 6),
  dateOfBirthCheck: pos(1, 19),
  sex: pos(1, 20),
  dateOfExpiry: span(1, 21, 6),
  dateOfExpiryCheck: pos(1, 27),
  optionalData: span(1, 28, 8),
  optionalDataCheck: null,
  optionalData2: null,
  composite: null,
};

/** Field offsets for every supported format, exported so consumers can audit them. */
export const MRZ_LAYOUTS: Readonly<Record<MrzFormat, MrzLayout>> = Object.freeze({
  TD1,
  TD2,
  TD3,
  'MRV-A': MRV_A,
  'MRV-B': MRV_B,
});

export function layoutFor(format: MrzFormat): MrzLayout {
  return MRZ_LAYOUTS[format];
}

/**
 * Total character counts for the geometries that can be stored as one
 * unbroken string. Each is unambiguous: 90 can only be 3x30, 88 only 2x44,
 * 72 only 2x36.
 */
const CONCATENATED_LENGTHS: ReadonlyMap<number, { lines: number; width: number }> = new Map([
  [90, { lines: 3, width: 30 }],
  [88, { lines: 2, width: 44 }],
  [72, { lines: 2, width: 36 }],
]);

/**
 * Turn arbitrary input into candidate MRZ lines.
 *
 * Normalisation is explicit, total, and does exactly three things: it folds
 * line endings, removes whitespace, and upper-cases. Real input arrives from
 * OCR, from a pasted PDF selection, and from database columns that stored the
 * two lines concatenated, and all three of those are legitimately recoverable.
 *
 * What normalisation deliberately does **not** do is repair characters. The
 * classic OCR confusions — `0` for `O`, `1` for `I`, `5` for `S` — are exactly
 * the ones that appear inside document numbers, and a parser that "helpfully"
 * substitutes them produces a document number that belongs to somebody else.
 * The check digits exist to detect that. Let them.
 */
export function normalizeMrzLines(raw: string): string[] {
  const collapsed = raw.replace(/\r\n?/g, '\n');
  const lines = collapsed
    .split('\n')
    // `\s` already covers the non-breaking space, which is what a PDF
    // copy-paste usually delivers between MRZ character groups.
    .map((line) => line.replace(/\s+/gu, '').toUpperCase())
    .filter((line) => line.length > 0);

  if (lines.length === 1) {
    const only = lines[0] as string;
    const shape = CONCATENATED_LENGTHS.get(only.length);
    if (shape) {
      const out: string[] = [];
      for (let i = 0; i < shape.lines; i++) out.push(only.slice(i * shape.width, (i + 1) * shape.width));
      return out;
    }
  }
  return lines;
}

/**
 * Which geometry these lines are.
 *
 * Line count and length narrow it to at most two candidates; the document code
 * separates a visa from a travel document. `V` in the first position is the
 * visa marker, and it is the only signal available — the formats are otherwise
 * byte-identical up to position 28.
 */
export function detectFormat(lines: readonly string[]): MrzFormat | null {
  const widths = lines.map((l) => l.length);
  const uniform = (n: number): boolean => widths.length > 0 && widths.every((w) => w === n);

  if (lines.length === 3 && uniform(30)) return 'TD1';
  if (lines.length === 2) {
    const isVisa = (lines[0] as string).startsWith('V');
    if (uniform(44)) return isVisa ? 'MRV-A' : 'TD3';
    if (uniform(36)) return isVisa ? 'MRV-B' : 'TD2';
  }
  return null;
}

function lineAt(lines: readonly string[], index: number): string {
  const line = lines[index];
  if (line === undefined) throw new RangeError(`MRZ line ${index + 1} is missing`);
  return line;
}

function readSpan(lines: readonly string[], s: MrzSpan): string {
  return lineAt(lines, s.line).slice(s.start, s.start + s.length);
}

function readPosition(lines: readonly string[], p: MrzPosition): string {
  const ch = lineAt(lines, p.line)[p.index];
  if (ch === undefined) {
    throw new RangeError(`MRZ line ${p.line + 1} has no position ${p.index + 1}`);
  }
  return ch;
}

/** Remove padding from the right. Interior fillers are meaningful and are kept. */
export function stripTrailingFiller(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === MRZ_FILLER) end--;
  return value.slice(0, end);
}

/**
 * Split a name field at the `<<` separator.
 *
 * Trailing padding goes first, then the field is split once on `<<`: everything
 * before is the primary identifier (surname), everything after is secondary
 * (given names). Within each part, `<` separates components.
 *
 * A field with no `<<` is a single-identifier holder — mononymous, or a
 * document that records only a surname — and the whole field is primary. Note
 * that `VAN<DER<BERG` is one such holder with a three-component surname, not
 * three names, which is why the split is on `<<` first and `<` second and never
 * the other way round.
 */
export function parseNameField(field: string): MrzName {
  const possiblyTruncated = field.length > 0 && !field.endsWith(MRZ_FILLER);
  const trimmed = stripTrailingFiller(field);
  const separator = trimmed.indexOf('<<');

  const primaryRaw = separator === -1 ? trimmed : trimmed.slice(0, separator);
  const secondaryRaw = separator === -1 ? '' : trimmed.slice(separator + 2);

  const components = (part: string): string[] => part.split('<').filter((c) => c.length > 0);
  const primaryComponents = components(primaryRaw);
  const secondaryComponents = components(secondaryRaw);

  return {
    primary: primaryComponents.join(' '),
    secondary: secondaryComponents.join(' '),
    primaryComponents,
    secondaryComponents,
    possiblyTruncated,
  };
}

interface DocumentNumberReading {
  readonly number: string;
  readonly extended: boolean;
  /** The remaining optional data once any extension has been consumed. */
  readonly optionalRemainder: string;
  /** `null` when the extension is present but unreadable. */
  readonly site: CheckDigitSite | null;
  readonly failure: MrzFailure | null;
}

/**
 * Read the document number, handling the extended encoding.
 *
 * The field is nine characters wide, which several states outgrew. Doc 9303's
 * answer is to spill: the first nine characters stay in the field, the
 * check-digit position is set to the filler `<` to signal the overflow, and the
 * remaining characters — followed by the check digit for the **whole** number
 * and then a `<` terminator — are written at the start of the optional-data
 * field. A parser that does not implement this rejects valid passports outright,
 * because the filler in the check-digit position fails every arithmetic test.
 *
 * The check digit in the extended case covers the complete number, not the
 * nine-character prefix. Trailing fillers score zero, so for numbers that fit in
 * the field it makes no difference whether the digit is computed over the padded
 * or unpadded form.
 */
function readDocumentNumber(
  lines: readonly string[],
  layout: MrzLayout,
): DocumentNumberReading {
  const fieldRaw = readSpan(lines, layout.documentNumber);
  const checkChar = readPosition(lines, layout.documentNumberCheck);
  const optionalRaw = readSpan(lines, layout.optionalData);

  if (checkChar !== MRZ_FILLER) {
    return {
      number: stripTrailingFiller(fieldRaw),
      extended: false,
      optionalRemainder: optionalRaw,
      site: {
        field: 'documentNumber',
        line: layout.documentNumberCheck.line + 1,
        column: layout.documentNumberCheck.index + 1,
        present: checkChar,
        covers: fieldRaw,
        fillerPermitted: false,
      },
      failure: null,
    };
  }

  const terminator = optionalRaw.indexOf(MRZ_FILLER);
  const payload = terminator === -1 ? optionalRaw : optionalRaw.slice(0, terminator);

  if (payload.length < 2) {
    return {
      number: stripTrailingFiller(fieldRaw),
      extended: true,
      optionalRemainder: optionalRaw,
      site: null,
      failure: {
        code: 'extended_document_number_malformed',
        field: 'documentNumber',
        message:
          `The document-number check digit is the filler '<', which signals a number longer than ` +
          `nine characters, but the optional-data field does not start with at least one ` +
          `continuation character followed by a check digit.`,
        line: layout.optionalData.line + 1,
        column: layout.optionalData.start + 1,
      },
    };
  }

  const remainder = payload.slice(0, payload.length - 1);
  const extendedCheck = payload[payload.length - 1] as string;

  return {
    number: fieldRaw + remainder,
    extended: true,
    optionalRemainder: terminator === -1 ? '' : optionalRaw.slice(terminator + 1),
    site: {
      field: 'documentNumber',
      line: layout.optionalData.line + 1,
      column: layout.optionalData.start + payload.length,
      present: extendedCheck,
      covers: fieldRaw + remainder,
      fillerPermitted: false,
    },
    failure: null,
  };
}

function categoryOf(documentCode: string): DocumentCategory {
  const first = documentCode[0];
  if (first === 'P') return 'passport';
  if (first === 'V') return 'visa';
  // Doc 9303 reserves I, A and C for identity cards and other official travel
  // documents in the card formats. The second character is issuing-state
  // defined, so we read only the first and do not guess further.
  if (first === 'I' || first === 'A' || first === 'C') return 'id_card';
  return 'other';
}

function readSex(character: string): MrzSex {
  if (character === 'M' || character === 'F' || character === 'X') return character;
  // Both the filler and anything unexpected read as unspecified; validation
  // reports the unexpected case separately using `sexCharacter`.
  return 'unspecified';
}

function dateField(raw: string, reading: MrzDateReading): MrzDateField {
  return reading.ok
    ? { raw, iso: reading.value, failure: null }
    : { raw, iso: null, failure: reading.reason };
}

function findInvalidCharacters(lines: readonly string[]): MrzFailure[] {
  const failures: MrzFailure[] = [];
  for (let l = 0; l < lines.length; l++) {
    const line = lineAt(lines, l);
    for (let c = 0; c < line.length; c++) {
      const ch = line[c] as string;
      if (isMrzCharacter(ch)) continue;
      failures.push({
        code: 'invalid_character',
        field: 'raw',
        message:
          `Character ${JSON.stringify(ch)} at line ${l + 1} column ${c + 1} is outside the ` +
          `ICAO 9303 MRZ character set (A-Z, 0-9, '<').`,
        line: l + 1,
        column: c + 1,
      });
    }
  }
  return failures;
}

/**
 * Extract every field from an MRZ.
 *
 * `ok: true` means the geometry was recognised and each field was located; it
 * does **not** mean the document is sound. Field-level defects that stop a
 * value being read at all — an unreadable extended document number — are
 * returned alongside the document. Defects that are matters of arithmetic or
 * of permitted values are left to {@link import('./validate.js').validateMrz},
 * which is the entry point most callers want.
 */
export function parseMrz(raw: string, options: MrzOptions = {}): MrzParseResult {
  const lines = normalizeMrzLines(raw);
  if (lines.length === 0) {
    return {
      ok: false,
      failures: [
        {
          code: 'empty_input',
          field: 'raw',
          message: 'No machine-readable lines were found in the input.',
        },
      ],
    };
  }

  const characterFailures = findInvalidCharacters(lines);
  if (characterFailures.length > 0) return { ok: false, failures: characterFailures };

  const format = detectFormat(lines);
  if (format === null) {
    return {
      ok: false,
      failures: [
        {
          code: 'unrecognized_format',
          field: 'raw',
          message:
            `Input has ${lines.length} line(s) of length [${lines.map((l) => l.length).join(', ')}]. ` +
            `ICAO 9303 defines 3x30 (TD1), 2x36 (TD2 / MRV-B) and 2x44 (TD3 / MRV-A).`,
        },
      ],
    };
  }

  const layout = MRZ_LAYOUTS[format];
  const referenceDate = options.referenceDate ?? todayUtc();
  const failures: MrzFailure[] = [];

  const documentCode = stripTrailingFiller(readSpan(lines, layout.documentCode));
  const numberReading = readDocumentNumber(lines, layout);
  if (numberReading.failure) failures.push(numberReading.failure);

  const sites: CheckDigitSite[] = [];
  if (numberReading.site) sites.push(numberReading.site);

  const birthRaw = readSpan(lines, layout.dateOfBirth);
  sites.push({
    field: 'dateOfBirth',
    line: layout.dateOfBirthCheck.line + 1,
    column: layout.dateOfBirthCheck.index + 1,
    present: readPosition(lines, layout.dateOfBirthCheck),
    covers: birthRaw,
    fillerPermitted: false,
  });

  const expiryRaw = readSpan(lines, layout.dateOfExpiry);
  sites.push({
    field: 'dateOfExpiry',
    line: layout.dateOfExpiryCheck.line + 1,
    column: layout.dateOfExpiryCheck.index + 1,
    present: readPosition(lines, layout.dateOfExpiryCheck),
    covers: expiryRaw,
    fillerPermitted: false,
  });

  const optionalRaw = readSpan(lines, layout.optionalData);
  if (layout.optionalDataCheck) {
    sites.push({
      field: 'optionalData',
      line: layout.optionalDataCheck.line + 1,
      column: layout.optionalDataCheck.index + 1,
      present: readPosition(lines, layout.optionalDataCheck),
      covers: optionalRaw,
      // Doc 9303 lets an issuer leave this digit as filler when the personal
      // number field is unused. It is the only such position in any format.
      fillerPermitted: optionalRaw === MRZ_FILLER.repeat(optionalRaw.length),
    });
  }

  if (layout.composite) {
    sites.push({
      field: 'composite',
      line: layout.composite.at.line + 1,
      column: layout.composite.at.index + 1,
      present: readPosition(lines, layout.composite.at),
      covers: layout.composite.spans.map((s) => readSpan(lines, s)).join(''),
      fillerPermitted: false,
    });
  }

  const sexCharacter = readPosition(lines, layout.sex);

  const document: MrzDocument = {
    format,
    lines,
    documentCode,
    category: categoryOf(documentCode),
    issuingState: stripTrailingFiller(readSpan(lines, layout.issuingState)),
    name: parseNameField(readSpan(lines, layout.name)),
    documentNumber: numberReading.number,
    documentNumberExtended: numberReading.extended,
    nationality: stripTrailingFiller(readSpan(lines, layout.nationality)),
    dateOfBirth: dateField(birthRaw, interpretBirthDate(birthRaw, referenceDate)),
    sex: readSex(sexCharacter),
    sexCharacter,
    dateOfExpiry: dateField(expiryRaw, interpretExpiryDate(expiryRaw, referenceDate)),
    optionalData: stripTrailingFiller(numberReading.optionalRemainder),
    optionalData2: layout.optionalData2
      ? stripTrailingFiller(readSpan(lines, layout.optionalData2))
      : '',
    checkDigitSites: sites,
  };

  return { ok: true, document, failures };
}
