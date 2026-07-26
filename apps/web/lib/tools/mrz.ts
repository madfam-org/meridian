/**
 * The machine-readable-zone tool's view model.
 *
 * `@meridian/mrtd` returns a verdict that names and locates every defect —
 * which field, which line, which column, what the arithmetic says. This module
 * turns that into rows a page can render without any presentation logic having
 * to reason about ICAO field offsets, and without any of it reaching for a
 * clock or a network.
 *
 * Two things it is careful about:
 *
 *  1. **It never collapses a verdict into a boolean.** "Invalid passport" is
 *     useless to somebody trying to fix an OCR error. Every check digit gets its
 *     own row, with the exact substring it is computed over, so a reader can see
 *     that it is the date-of-birth digit that is wrong and re-read that one
 *     character off the page.
 *  2. **It distinguishes a defect from a fact about the document.** A date the
 *     issuing state left as filler is not an error — the check digit still
 *     covers the field, the MRZ is internally consistent, and what is missing is
 *     information the issuer chose not to encode. `@meridian/mrtd` reports that
 *     as `iso: null` with a reason, and this module carries the distinction
 *     through instead of flattening it into "unreadable".
 */

import type { Citation, IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';
import type {
  CheckDigitVerdict,
  MrzDateField,
  MrzDocument,
  MrzFailure,
  MrzFormat,
  MrzValidation,
} from '@meridian/mrtd';

import { AS_OF } from '@/lib/sample/common';
import { bi, type Bi } from '@/lib/i18n';
import type { Tone } from '@/components/Badge';

// Extensionless, matching every other relative import in this application.
// The `.js` suffix rule in AGENTS.md governs `packages/`, which emit real
// JavaScript; `apps/web` is compiled by Next, whose config deliberately carries
// no `extensionAlias` and so cannot map `./mrtd-engine.js` onto a `.ts` file.
import { validateMrz } from './mrtd-engine';

/**
 * The civil date this build resolves two-digit years against, and the default
 * the form is pre-filled with.
 *
 * It is the same fixed reference date every other page in this portal computes
 * as at, for the same two reasons — reproducibility and the absence of a clock.
 * The tool exposes it as an editable field rather than hiding it, because the
 * century windows below slide with it and a reader in a later year needs to be
 * able to say so. See `lib/sample/common.ts`.
 */
export const DEFAULT_REFERENCE_DATE: IsoDate = AS_OF;

/**
 * The instrument.
 *
 * `verifiedOn` records the date the reference below was last checked in this
 * repository, and the note states exactly what that check covered, because the
 * field means "a human read the cited text against its source" and overstating
 * it is the failure mode the field exists to prevent.
 *
 * No `url`. ICAO republishes Doc 9303 by edition and the stable address for the
 * eighth edition is not one this catalog is confident enough to print; a wrong
 * canonical link teaches a reader to stop checking, which costs more than the
 * missing convenience.
 */
export const ICAO_9303_CITATION: Citation = {
  id: 'icao-doc-9303-p3',
  kind: 'official_guidance',
  instrument:
    'ICAO Doc 9303, Machine Readable Travel Documents — Part 3: Specifications Common to all MRTDs',
  jurisdiction: 'INT',
  verifiedOn: isoDate('2026-07-25'),
  note:
    'Doc 9303 defines the machine-readable zone layouts, the character set, and the check-digit ' +
    'algorithm this tool applies: each character is valued (0-9 as itself, A-Z as 10-35, the filler ' +
    "'<' as 0), multiplied by the repeating weights 7, 3, 1, summed, and reduced modulo 10. Meridian's " +
    'implementation of that algorithm and of the field offsets lives in packages/mrtd and is covered ' +
    'by its own test suite. What has not been re-read against the published standard in this build is ' +
    'the edition and section numbering of the reference itself, which is why no section number is ' +
    'cited here and no URL is given.',
};

/**
 * The century-resolution windows are a convention, not the standard.
 *
 * Doc 9303 encodes a year in two characters and does not say which century they
 * belong to. Every implementation therefore chooses, and `@meridian/mrtd`
 * chooses sliding windows anchored to the reference date rather than a
 * hard-coded pivot year. That is a defensible choice and it is not law, so the
 * tool surfaces it as what it is.
 */
export const CENTURY_WINDOW_NOTE: Bi = bi(
  'Doc 9303 writes a year as two digits and does not say which century it belongs to. Meridian resolves a date of birth into the 100 years ending on the reference date, and a date of expiry into the window running from 30 years before it to 70 years after it. These windows are an implementation convention, not part of the standard: a document held by somebody over 100 reads as a newborn, and an expiry more than 30 years past reads as one nearly 70 years ahead. Both dates are shown exactly as printed alongside the resolved reading so you can see which is which.',
  'El Doc 9303 escribe el año con dos dígitos y no indica a qué siglo pertenece. Meridian resuelve la fecha de nacimiento dentro de los 100 años que terminan en la fecha de referencia, y la fecha de caducidad dentro de la ventana que va de 30 años antes a 70 años después. Estas ventanas son una convención de implementación, no forman parte de la norma: el documento de una persona mayor de 100 años se lee como el de un recién nacido, y una caducidad de hace más de 30 años se lee como una de casi 70 años en el futuro. Ambas fechas se muestran tal como están impresas junto a la lectura resuelta para que pueda distinguirlas.',
);

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const FORMAT_NAME: Record<MrzFormat, Bi> = {
  TD1: bi('TD1 — identity card, 3 lines of 30', 'TD1 — documento de identidad, 3 líneas de 30'),
  TD2: bi('TD2 — booklet or card, 2 lines of 36', 'TD2 — libreta o tarjeta, 2 líneas de 36'),
  TD3: bi('TD3 — passport, 2 lines of 44', 'TD3 — pasaporte, 2 líneas de 44'),
  'MRV-A': bi('MRV-A — full-size visa, 2 lines of 44', 'MRV-A — visado de tamaño completo, 2 líneas de 44'),
  'MRV-B': bi('MRV-B — reduced-size visa, 2 lines of 36', 'MRV-B — visado de tamaño reducido, 2 líneas de 36'),
};

const CATEGORY_NAME: Record<MrzDocument['category'], Bi> = {
  passport: bi('Passport', 'Pasaporte'),
  visa: bi('Visa sticker', 'Visado adhesivo'),
  id_card: bi('Identity or other official travel card', 'Documento de identidad u otra tarjeta oficial de viaje'),
  other: bi('Not one of the codes Doc 9303 names', 'No es ninguno de los códigos que nombra el Doc 9303'),
};

const CHECK_DIGIT_FIELD_NAME: Record<CheckDigitVerdict['field'], Bi> = {
  documentNumber: bi('Document number', 'Número de documento'),
  dateOfBirth: bi('Date of birth', 'Fecha de nacimiento'),
  dateOfExpiry: bi('Date of expiry', 'Fecha de caducidad'),
  optionalData: bi('Optional / personal number data', 'Datos opcionales / número personal'),
  composite: bi('Composite — the whole zone', 'Compuesto — toda la zona'),
};

const DATE_FAILURE_NAME: Record<NonNullable<MrzDateField['failure']>, Bi> = {
  wrong_length: bi('Not six characters', 'No son seis caracteres'),
  non_numeric: bi(
    'Contains something that is neither a digit nor the filler',
    'Contiene algo que no es ni un dígito ni el carácter de relleno',
  ),
  all_filler: bi(
    'The issuer encoded no date at all — every position is the filler',
    'El emisor no codificó ninguna fecha: todas las posiciones son de relleno',
  ),
  partial_filler: bi(
    'The issuer encoded a partially unknown date',
    'El emisor codificó una fecha parcialmente desconocida',
  ),
  not_a_calendar_date: bi(
    'Six digits, but they name a day that does not exist',
    'Seis dígitos, pero nombran un día que no existe',
  ),
};

const FAILURE_CODE_NAME: Record<MrzFailure['code'], Bi> = {
  empty_input: bi('Nothing to read', 'Nada que leer'),
  unrecognized_format: bi('Geometry matches no Doc 9303 format', 'La geometría no coincide con ningún formato del Doc 9303'),
  invalid_character: bi('Character outside the MRZ set', 'Carácter fuera del conjunto de la zona de lectura mecánica'),
  check_digit_mismatch: bi('Check digit does not match', 'El dígito de control no coincide'),
  date_unresolvable: bi('Date cannot be read', 'La fecha no puede leerse'),
  extended_document_number_malformed: bi(
    'Extended document number is malformed',
    'El número de documento extendido está mal formado',
  ),
  invalid_field_value: bi('Field holds a value the standard does not permit', 'El campo contiene un valor que la norma no permite'),
};

// ---------------------------------------------------------------------------
// The view model
// ---------------------------------------------------------------------------

/** One parsed field, ready to render. */
export interface MrzFieldRow {
  readonly key: string;
  readonly label: Bi;
  /** The reading, already formatted. Empty string means the field is blank. */
  readonly value: string;
  /** Exactly the characters in the zone, when they differ from the reading. */
  readonly printed?: string;
  readonly note?: Bi;
  readonly tone?: Tone;
}

/** One check digit, with the substring it is computed over. */
export interface MrzCheckRow {
  readonly key: string;
  readonly label: Bi;
  readonly line: number;
  readonly column: number;
  readonly present: string;
  /** `null` when Doc 9303 permits the filler in this position. */
  readonly expected: number | null;
  readonly ok: boolean;
  readonly covers: string;
  readonly note?: string;
}

/** One defect, located. */
export interface MrzFailureRow {
  readonly key: string;
  readonly code: Bi;
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
}

export interface MrzReport {
  /** `null` when the geometry was never recognised. */
  readonly format: MrzFormat | null;
  readonly formatName: Bi | null;
  /** The normalised lines the engine actually read. */
  readonly lines: readonly string[];
  readonly selfConsistent: boolean;
  readonly fields: readonly MrzFieldRow[];
  readonly checks: readonly MrzCheckRow[];
  readonly failures: readonly MrzFailureRow[];
  /** True when either date resolved, so the century convention applies. */
  readonly resolvedADate: boolean;
  readonly referenceDate: IsoDate;
}

function dateRow(
  key: string,
  label: Bi,
  field: MrzDateField,
): MrzFieldRow {
  if (field.iso !== null) {
    return { key, label, value: field.iso, printed: field.raw };
  }
  const failure = field.failure;
  return {
    key,
    label,
    value: '',
    printed: field.raw,
    note: failure === null ? undefined : DATE_FAILURE_NAME[failure],
    // A date the issuer left as filler is a fact about the document; a date
    // that is six digits naming no real day is a defect. Different tones,
    // because they call for different actions from the reader.
    tone: failure === 'all_filler' || failure === 'partial_filler' ? 'info' : 'bad',
  };
}

function sexNote(document: MrzDocument): Bi | undefined {
  if (document.sex !== 'unspecified') return undefined;
  if (document.sexCharacter === '<') {
    return bi(
      "The issuer left this position as the filler '<', so the zone encodes no sex.",
      'El emisor dejó esta posición con el relleno «<», por lo que la zona no codifica ningún sexo.',
    );
  }
  return bi(
    "Doc 9303 permits 'M', 'F', 'X' or the filler '<' here. Anything else means the line was misread, and every other field on it is suspect.",
    'El Doc 9303 admite aquí «M», «F», «X» o el relleno «<». Cualquier otra cosa significa que la línea se leyó mal, y todos los demás campos de esa línea son sospechosos.',
  );
}

function fieldRows(document: MrzDocument): MrzFieldRow[] {
  const rows: MrzFieldRow[] = [
    {
      key: 'documentCode',
      label: bi('Document code', 'Código de documento'),
      value: document.documentCode,
      note: CATEGORY_NAME[document.category],
    },
    {
      key: 'issuingState',
      label: bi('Issuing state or organisation', 'Estado u organización emisora'),
      value: document.issuingState,
    },
    {
      key: 'surname',
      label: bi('Primary identifier (surname)', 'Identificador principal (apellidos)'),
      value: document.name.primary,
      note:
        document.name.possiblyTruncated
          ? bi(
              'The name field is completely full, so Doc 9303 may have required the printed name to be truncated. It may be shorter than the real one.',
              'El campo del nombre está completamente lleno, por lo que el Doc 9303 pudo exigir truncar el nombre impreso. Puede ser más corto que el real.',
            )
          : undefined,
    },
    {
      key: 'givenNames',
      label: bi('Secondary identifier (given names)', 'Identificador secundario (nombre de pila)'),
      value: document.name.secondary,
      note:
        document.name.secondary === ''
          ? bi(
              'The zone carries no second half, which the standard permits: this is a document recording a single identifier.',
              'La zona no lleva segunda mitad, lo que la norma permite: es un documento que registra un único identificador.',
            )
          : undefined,
    },
    {
      key: 'documentNumber',
      label: bi('Document number', 'Número de documento'),
      value: document.documentNumber,
      note: document.documentNumberExtended
        ? bi(
            'Longer than the nine characters the field holds. Under Doc 9303 the overflow is written into the optional-data field, and the check digit covers the complete number rather than the first nine characters.',
            'Más largo que los nueve caracteres que admite el campo. Conforme al Doc 9303, el excedente se escribe en el campo de datos opcionales, y el dígito de control cubre el número completo y no solo los nueve primeros caracteres.',
          )
        : undefined,
    },
    {
      key: 'nationality',
      label: bi('Nationality', 'Nacionalidad'),
      value: document.nationality,
    },
    dateRow('dateOfBirth', bi('Date of birth', 'Fecha de nacimiento'), document.dateOfBirth),
    {
      key: 'sex',
      // `X` is preserved rather than folded into "unspecified": a document that
      // says X and a document that says nothing are different documents, and an
      // applicant whose passport records X should not have that erased here.
      label: bi('Sex', 'Sexo'),
      value: document.sex === 'unspecified' ? '' : document.sex,
      printed: document.sexCharacter,
      note: sexNote(document),
      tone: document.sex === 'unspecified' && document.sexCharacter !== '<' ? 'bad' : undefined,
    },
    dateRow('dateOfExpiry', bi('Date of expiry', 'Fecha de caducidad'), document.dateOfExpiry),
    {
      key: 'optionalData',
      label: bi('Optional / personal number data', 'Datos opcionales / número personal'),
      value: document.optionalData,
    },
  ];

  if (document.format === 'TD1') {
    rows.push({
      key: 'optionalData2',
      label: bi('Second optional field (TD1 only)', 'Segundo campo opcional (solo TD1)'),
      value: document.optionalData2,
    });
  }

  return rows;
}

function checkRows(verdicts: readonly CheckDigitVerdict[], document: MrzDocument | null): MrzCheckRow[] {
  const covers = new Map(document?.checkDigitSites.map((s) => [s.field, s.covers]) ?? []);
  return verdicts.map((v, index) => ({
    key: `${v.field}-${index}`,
    label: CHECK_DIGIT_FIELD_NAME[v.field],
    line: v.line,
    column: v.column,
    present: v.present,
    expected: v.expected,
    ok: v.ok,
    covers: covers.get(v.field) ?? '',
    note: v.note,
  }));
}

function failureRows(failures: readonly MrzFailure[]): MrzFailureRow[] {
  return failures.map((f, index) => ({
    key: `${f.code}-${f.field}-${index}`,
    code: FAILURE_CODE_NAME[f.code],
    message: f.message,
    line: f.line,
    column: f.column,
  }));
}

/** Build the view model from a verdict. */
export function buildReport(validation: MrzValidation, referenceDate: IsoDate): MrzReport {
  const document = validation.document;
  return {
    format: validation.format,
    formatName: validation.format === null ? null : FORMAT_NAME[validation.format],
    lines: document?.lines ?? [],
    selfConsistent: validation.valid,
    fields: document === null ? [] : fieldRows(document),
    checks: checkRows(validation.checkDigits, document),
    failures: failureRows(validation.failures),
    resolvedADate:
      document !== null && (document.dateOfBirth.iso !== null || document.dateOfExpiry.iso !== null),
    referenceDate,
  };
}

/**
 * Run the engine over pasted text.
 *
 * The `try` is not defensive padding. Input arrives from a paste buffer and is
 * arbitrary, and `@meridian/mrtd` throws a `RangeError` for a reference date it
 * cannot parse — a case this application prevents by validating the date field
 * first, but which a future caller could reintroduce. Turning that into a
 * visible, located failure is better than a blank page with a console trace the
 * reader will never see. Nothing is swallowed: the message is rendered.
 */
export function runMrzCheck(raw: string, referenceDate: IsoDate): MrzReport {
  try {
    return buildReport(validateMrz(raw, { referenceDate }), referenceDate);
  } catch (error) {
    return {
      format: null,
      formatName: null,
      lines: [],
      selfConsistent: false,
      fields: [],
      checks: [],
      failures: [
        {
          key: 'engine-error',
          code: bi('The reader stopped', 'El lector se detuvo'),
          message:
            error instanceof Error
              ? error.message
              : 'The machine-readable zone reader raised an error with no message.',
        },
      ],
      resolvedADate: false,
      referenceDate,
    };
  }
}

// ---------------------------------------------------------------------------
// Synthetic specimens
// ---------------------------------------------------------------------------

export interface MrzSpecimen {
  readonly id: string;
  readonly label: Bi;
  readonly lines: readonly string[];
}

/**
 * Made-up documents, for trying the tool without a real one to hand.
 *
 * Every specimen below is synthetic. The issuing state and nationality are
 * `ZZZ`, which ICAO assigns to nobody; the surname is literally `SPECIMEN`; the
 * document numbers are obviously fabricated. The check digits were computed
 * from the fabricated fields rather than copied from anywhere, so each specimen
 * verifies clean without being anybody's document.
 *
 * This repository is public and never carries a real travel-document number,
 * including in a fixture or an example.
 */
export const MRZ_SPECIMENS: readonly MrzSpecimen[] = [
  {
    id: 'td3',
    label: bi('TD3 passport', 'Pasaporte TD3'),
    lines: [
      'P<ZZZSPECIMEN<<ALEX<QUINN<<<<<<<<<<<<<<<<<<<',
      'ZZ00000000ZZZ8001014M3001019<<<<<<<<<<<<<<02',
    ],
  },
  {
    id: 'td3-extended',
    label: bi('TD3 with a long document number', 'TD3 con número de documento largo'),
    lines: [
      'P<ZZZSPECIMEN<<MARIA<JORDAN<<<<<<<<<<<<<<<<<',
      'ZZ0000000<ZZZ9112311F310630512344<<<<<<<<<68',
    ],
  },
  {
    id: 'td1',
    label: bi('TD1 identity card', 'Documento de identidad TD1'),
    lines: [
      'IDZZZZZ12345678<<<<<<<<<<<<<<<',
      '7502145M2909303ZZZ<<<<<<<<<<<8',
      'SPECIMEN<<SAM<RIVERA<<<<<<<<<<',
    ],
  },
];

export function specimenText(specimen: MrzSpecimen): string {
  return specimen.lines.join('\n');
}
