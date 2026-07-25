/**
 * Shared vocabulary for the ICAO Doc 9303 machine-readable zone.
 *
 * Everything in this file is a type. The layout table that gives these fields
 * their byte offsets is a runtime value and lives in `parse.ts`, so that a
 * consumer importing only types pulls in no code.
 *
 * A note on what this package is *for*. The MRZ is the identity layer's trust
 * anchor: it is the one part of a travel document that carries its own
 * integrity check, so a caseworker who scans a passport and gets a clean
 * verdict knows the transcription is internally consistent before any of it
 * reaches a government form. That is why every failure in this package is
 * named and located rather than collapsed into a boolean — "invalid passport"
 * tells a caseworker nothing, whereas "date-of-birth check digit at line 2
 * column 20 reads 4, expected 8" tells them exactly which character the OCR
 * pass got wrong.
 */

/**
 * The five machine-readable line geometries defined by Doc 9303.
 *
 * - `TD1`   — 3 lines x 30 characters. National ID cards and other card-format
 *             travel documents.
 * - `TD2`   — 2 lines x 36 characters. The older booklet/card format.
 * - `TD3`   — 2 lines x 44 characters. Passports.
 * - `MRV-A` — 2 lines x 44 characters. Full-size visa stickers.
 * - `MRV-B` — 2 lines x 36 characters. Reduced-size visa stickers.
 *
 * MRV-A shares its geometry with TD3, and MRV-B with TD2. They are told apart
 * by the document code, which begins with `V` on a visa. The difference is not
 * cosmetic: **a visa MRZ carries no composite check digit**, so software that
 * treats an MRV-A as a TD3 will read the last character of the optional-data
 * field as a check digit and reject a perfectly valid visa.
 */
export type MrzFormat = 'TD1' | 'TD2' | 'TD3' | 'MRV-A' | 'MRV-B';

/**
 * A coarse reading of the document code's first character. Deliberately coarse:
 * the second character is issuing-state defined and we do not guess at it.
 */
export type DocumentCategory = 'passport' | 'visa' | 'id_card' | 'other';

/**
 * The sex field as encoded in the MRZ.
 *
 * The MRZ permits `M`, `F`, and the filler `<` for unspecified. Some states
 * additionally emit `X`, which we preserve rather than folding into
 * `unspecified` — a document that says `X` and a document that says nothing are
 * different documents, and an applicant whose passport records `X` should not
 * have that erased by our parser.
 */
export type MrzSex = 'M' | 'F' | 'X' | 'unspecified';

/** Why a six-character MRZ date could not be read as a calendar date. */
export type MrzDateFailure =
  /** Not exactly six characters. */
  | 'wrong_length'
  /** Contains a character that is neither a digit nor the filler. */
  | 'non_numeric'
  /** All six positions are filler — the issuer encoded no date at all. */
  | 'all_filler'
  /** Some positions are filler — the issuer encoded a partially unknown date. */
  | 'partial_filler'
  /** Six digits, but they do not name a day that exists in the resolved century. */
  | 'not_a_calendar_date';

/** The outcome of interpreting a `YYMMDD` field. */
export type MrzDateReading =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: MrzDateFailure };

/**
 * A date as it appears on the document, plus our reading of it.
 *
 * `iso` is `null` whenever `failure` is set. Both are kept: a caseworker needs
 * the six characters that were actually printed as much as they need the
 * resolved calendar date, because the two disagreeing is the whole diagnosis.
 */
export interface MrzDateField {
  /** Exactly the six characters that appear in the MRZ. */
  readonly raw: string;
  /** `YYYY-MM-DD`, or `null` when the field could not be resolved. */
  readonly iso: string | null;
  readonly failure: MrzDateFailure | null;
}

/**
 * The identifier field, split at the `<<` separator.
 *
 * The MRZ transliterates away apostrophes, hyphens and spaces alike — `O'BRIEN`
 * becomes `OBRIEN`, `SMITH-JONES` becomes `SMITH<JONES`. We therefore join
 * components with a single space and expose the components separately, because
 * we genuinely cannot tell whether a `<` stood for a space or a hyphen, and
 * inventing one back would put a name on a government form that the applicant
 * never wrote.
 */
export interface MrzName {
  /** Components before the `<<` separator, joined with spaces. Surname(s). */
  readonly primary: string;
  /** Components after the `<<` separator, joined with spaces. Given name(s). */
  readonly secondary: string;
  readonly primaryComponents: readonly string[];
  readonly secondaryComponents: readonly string[];
  /**
   * True when the name field is completely filled, i.e. its last position is
   * not filler. Doc 9303 requires long names to be truncated to fit, so a full
   * field means the printed name may be shorter than the real one.
   */
  readonly possiblyTruncated: boolean;
}

/** Fields that carry a check digit. Not every format has all of them. */
export type MrzCheckDigitField =
  | 'documentNumber'
  | 'dateOfBirth'
  | 'dateOfExpiry'
  | 'optionalData'
  | 'composite';

/** Every field a failure can be attributed to. */
export type MrzFieldName =
  | 'raw'
  | 'documentCode'
  | 'issuingState'
  | 'name'
  | 'nationality'
  | 'sex'
  | 'optionalData2'
  | MrzCheckDigitField;

/**
 * A place in the MRZ where a check digit sits, together with the exact string
 * it is computed over.
 *
 * Parsing produces these; validation turns them into verdicts. The split keeps
 * all offset arithmetic in one module and all check-digit arithmetic in
 * another, so a layout mistake cannot hide behind matching arithmetic.
 */
export interface CheckDigitSite {
  readonly field: MrzCheckDigitField;
  /** 1-based line number, as a human would count it. */
  readonly line: number;
  /** 1-based column within that line. */
  readonly column: number;
  /** The character actually present at that position. */
  readonly present: string;
  /** The exact substring the digit is computed over. */
  readonly covers: string;
  /**
   * True when Doc 9303 permits this digit to be the filler `<` because the
   * field it covers is entirely unused. Only the TD3 personal-number digit is
   * ever eligible, and only when its field is all filler.
   */
  readonly fillerPermitted: boolean;
}

/** The verdict on one check digit. */
export interface CheckDigitVerdict {
  readonly field: MrzCheckDigitField;
  /** 1-based line number. */
  readonly line: number;
  /** 1-based column. */
  readonly column: number;
  /** The character present in the MRZ. */
  readonly present: string;
  /** What the algorithm says it should be, or `null` when the filler is permitted. */
  readonly expected: number | null;
  readonly ok: boolean;
  /** Set when the verdict needs explaining, e.g. a permitted filler. */
  readonly note?: string;
}

export type MrzFailureCode =
  /** Nothing but whitespace was supplied. */
  | 'empty_input'
  /** Line count and lengths match no Doc 9303 geometry. */
  | 'unrecognized_format'
  /** A character outside `A-Z`, `0-9`, `<` survived normalisation. */
  | 'invalid_character'
  /** A check digit does not match the field it covers. */
  | 'check_digit_mismatch'
  /** A date field could not be read as a calendar date. */
  | 'date_unresolvable'
  /** The check-digit position is `<` but the optional field carries no readable extension. */
  | 'extended_document_number_malformed'
  /** A field holds a value outside the set the standard permits, e.g. sex. */
  | 'invalid_field_value';

/**
 * One named, located defect. Machine-readable so an API can return the list
 * verbatim and a UI can highlight the offending character.
 */
export interface MrzFailure {
  readonly code: MrzFailureCode;
  readonly field: MrzFieldName;
  readonly message: string;
  /** 1-based line number, when the defect has a location. */
  readonly line?: number;
  /** 1-based column, when the defect has a location. */
  readonly column?: number;
}

/**
 * A parsed MRZ. Field extraction only — nothing here asserts the document is
 * consistent; that is {@link import('./validate.js').validateMrz}'s job.
 */
export interface MrzDocument {
  readonly format: MrzFormat;
  /** The normalised lines this document was read from. */
  readonly lines: readonly string[];
  /** Document code with trailing filler removed, e.g. `P`, `ID`, `V`. */
  readonly documentCode: string;
  readonly category: DocumentCategory;
  /** Issuing state or organisation, trailing filler removed. `D` for Germany. */
  readonly issuingState: string;
  readonly name: MrzName;
  /**
   * The complete document number, including any characters carried in the
   * optional-data field under the extended encoding.
   */
  readonly documentNumber: string;
  /** True when the number was carried across two fields. */
  readonly documentNumberExtended: boolean;
  readonly nationality: string;
  readonly dateOfBirth: MrzDateField;
  readonly sex: MrzSex;
  /** The raw character in the sex position, kept so validation can name it. */
  readonly sexCharacter: string;
  readonly dateOfExpiry: MrzDateField;
  /**
   * Optional / personal-number data, trailing filler removed and any extended
   * document number consumed. On TD3 this is the personal number field; on TD1
   * it is the upper-line field.
   */
  readonly optionalData: string;
  /** TD1's second optional field, on the middle line. Empty for other formats. */
  readonly optionalData2: string;
  readonly checkDigitSites: readonly CheckDigitSite[];
}

/**
 * Where a field sits. `line` is a 0-based index into the normalised lines;
 * `start` is a 0-based offset. Doc 9303 numbers both from 1, so every published
 * offset here is one less than the one in the standard — the tests assert the
 * resulting substrings rather than the numbers, which is the only way to catch
 * an off-by-one in a table like this.
 */
export interface MrzSpan {
  readonly line: number;
  readonly start: number;
  readonly length: number;
}

/** A single character position. `line` and `index` are 0-based. */
export interface MrzPosition {
  readonly line: number;
  readonly index: number;
}

/** The field offsets for one format. */
export interface MrzLayout {
  readonly format: MrzFormat;
  readonly lineCount: number;
  readonly lineLength: number;
  readonly documentCode: MrzSpan;
  readonly issuingState: MrzSpan;
  readonly name: MrzSpan;
  readonly documentNumber: MrzSpan;
  readonly documentNumberCheck: MrzPosition;
  readonly nationality: MrzSpan;
  readonly dateOfBirth: MrzSpan;
  readonly dateOfBirthCheck: MrzPosition;
  readonly sex: MrzPosition;
  readonly dateOfExpiry: MrzSpan;
  readonly dateOfExpiryCheck: MrzPosition;
  /** The field an over-long document number spills into. */
  readonly optionalData: MrzSpan;
  /** Only TD3 gives its optional field its own check digit. */
  readonly optionalDataCheck: MrzPosition | null;
  /** Only TD1 has a second optional field. */
  readonly optionalData2: MrzSpan | null;
  /** `null` on the visa formats, which have no composite digit at all. */
  readonly composite: {
    readonly at: MrzPosition;
    readonly spans: readonly MrzSpan[];
  } | null;
}

/** Options shared by parsing and validation. */
export interface MrzOptions {
  /**
   * The calendar date, `YYYY-MM-DD`, against which two-digit years are
   * resolved. Pass it explicitly. See `dates.ts` for why the default is the
   * UTC date and why that default is nearly but not entirely harmless.
   */
  readonly referenceDate?: string;
}

export type MrzParseResult =
  | {
      /** The geometry was recognised and every field was located. */
      readonly ok: true;
      readonly document: MrzDocument;
      /**
       * Field-level defects found while laying the document out. Non-empty here
       * means the document was readable but is not sound.
       */
      readonly failures: readonly MrzFailure[];
    }
  | { readonly ok: false; readonly failures: readonly MrzFailure[] };

export type MrzValidation =
  | {
      readonly valid: true;
      readonly format: MrzFormat;
      readonly document: MrzDocument;
      readonly checkDigits: readonly CheckDigitVerdict[];
      /** Typed as the empty tuple so `valid: true` implies no failures. */
      readonly failures: readonly [];
    }
  | {
      readonly valid: false;
      /** `null` when the geometry was never recognised. */
      readonly format: MrzFormat | null;
      /** `null` when the document could not be laid out at all. */
      readonly document: MrzDocument | null;
      readonly checkDigits: readonly CheckDigitVerdict[];
      readonly failures: readonly MrzFailure[];
    };
