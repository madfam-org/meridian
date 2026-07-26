/**
 * The Spanish nationality-by-residence tool's view model.
 *
 * Two pathways are measured, both straight out of `@meridian/pathways`: the
 * art. 22.1 reduced two-year regime and the general ten-year regime. Nothing in
 * this file states a legal rule. It turns a form's worth of strings into an
 * {@link ApplicantFacts}, hands that to the catalog's own `evaluate`, and turns
 * what comes back into rows a page can render. Every threshold, every citation
 * and every verdict on screen comes from the catalog record, which is where a
 * reviewing lawyer will look for them.
 *
 * Three things drive the shape of this module, and each of them is a bug that
 * this design exists to prevent.
 *
 * ── 1. An unanswered question must leave the field ABSENT ─────────────────────
 *
 * `@meridian/core` models {@link NationalityAcquisition} with a literal
 * `'unknown'` member, and it is a trap here: the catalog's criterion is
 * `{ op: 'equals', path: 'claimedNationalityAcquisition', value: 'by_origin' }`,
 * and the string `'unknown'` is *not equal* to `'by_origin'`, so recording it
 * produces `unmet` — a blocking failure, and a definitive "no". An **absent**
 * field produces `unknown`, which caps the verdict at `indeterminate`.
 *
 * So no question in this tool ever writes a placeholder. "Not answered" and "I
 * do not know" both leave the field off the facts object entirely. The engine
 * then reports what is true: it could not decide. This is the difference
 * between telling somebody they do not qualify and telling them the answer
 * depends on something they have not said yet, and the first of those is the
 * one people act on.
 *
 * ── 2. Absence of an assertion is not the same as an asserted "no" ───────────
 *
 * Where a reader positively answers "no", the fact IS recorded, because a
 * recorded negative is knowable: `examResults: [{ code: 'CCSE', passed: false }]`
 * and `languageCertifications: []` are both assertions that evaluate to `false`.
 * Only silence maps to absence. See the note on empty arrays in
 * `packages/pathways/src/facts.ts`.
 *
 * ── 3. The list of qualifying states comes from the catalog, not from here ────
 *
 * The dropdown is built by walking `SPAIN_REDUCED_RESIDENCY_NATIONALITIES` from
 * `@meridian/core` and looking each code up in a table of country *names*. If
 * the legal list changes, the dropdown changes with it; the table here supplies
 * spelling, never membership. A country whose name is missing falls back to its
 * code rather than dropping out of the list — an unfamiliar label is a nuisance,
 * a silently absent nationality is a wrong answer.
 */

import type {
  Citation,
  CountryCode,
  IsoDate,
  NationalityAcquisition,
} from '@meridian/core';
import {
  SPAIN_REDUCED_RESIDENCY_NATIONALITIES,
  compareDates,
  countryCode,
  dateRange,
  isCountryCode,
} from '@meridian/core';
import type {
  ApplicantFacts,
  Criterion,
  CriterionResult,
  CriterionStatus,
  EligibilityReport,
  ImmigrationStatus,
  Pathway,
  ReportNote,
} from '@meridian/pathways';
import {
  esNationalityResidenceGeneral,
  esNationalityResidenceReduced,
  evaluate,
} from '@meridian/pathways';

import { bi, type Bi } from '@/lib/i18n';
import { AS_OF } from '@/lib/sample/common';
import type { ToolEntry } from '@/lib/tools/registry';
import { collect, issue, readDateField, readIntegerField, type FieldIssue } from '@/lib/tools/validation';

/**
 * The civil date the assessment is run as at, and the value the form starts
 * with.
 *
 * `apps/web` reads no clock — see `lib/sample/common.ts` — so the reference date
 * is an editable field rather than a hidden `new Date()`. Every duration in
 * these two pathways is measured against it, which means every figure the tool
 * shows can be reproduced later by anyone who knows the date it was run for.
 */
export const DEFAULT_ASSESSMENT_DATE: IsoDate = AS_OF;

/** Spain, as the target jurisdiction. Both pathways are `ES` records. */
const SPAIN: CountryCode = countryCode('ES');

// ---------------------------------------------------------------------------
// Field identity
// ---------------------------------------------------------------------------

/**
 * DOM ids, shared between the form and the validator.
 *
 * They live here rather than in the component because `readNationalityAnswers`
 * attaches them to the issues it produces, and the error summary turns those
 * into links. An id that drifts between the two is a link that goes nowhere.
 */
export const FIELD = {
  assessAsOf: 'nat-es-as-of',
  claimed: 'nat-es-claimed',
  claimedOtherCode: 'nat-es-claimed-code',
  acquisition: 'nat-es-acquisition',
  second: 'nat-es-second',
  secondOtherCode: 'nat-es-second-code',
  residenceUnder: 'nat-es-residence-under',
  residenceSince: 'nat-es-residence-since',
  status: 'nat-es-status',
  ageYears: 'nat-es-age',
  ccse: 'nat-es-ccse',
  dele: 'nat-es-dele',
  certificates: 'nat-es-certificates',
} as const;

export const RESULT_ID = 'nat-es-result';

/** Every select starts here. Empty means "not answered", and never anything else. */
export const UNANSWERED = '';

/** Chosen when the nationality is not one of the states art. 22.1 names. */
export const OTHER_COUNTRY = 'other';

/** Chosen when the reader states they hold no second nationality. */
export const NO_SECOND_NATIONALITY = 'none';

export const RESIDENCE_UNDER_CLAIMED = 'claimed';
export const RESIDENCE_UNDER_SECOND = 'second';

/** Positive and negative answers to the three-state yes/no questions. */
export const YES = 'yes';
export const NO = 'no';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Country names, for spelling only.
 *
 * Membership of the reduced-residency list is a legal question and is owned by
 * `SPAIN_REDUCED_RESIDENCY_NATIONALITIES` in `@meridian/core`. This table says
 * how to write each code down in the two languages this portal renders.
 */
const COUNTRY_NAMES: Readonly<Record<string, Bi>> = {
  AD: bi('Andorra', 'Andorra'),
  AR: bi('Argentina', 'Argentina'),
  BO: bi('Bolivia', 'Bolivia'),
  BR: bi('Brazil', 'Brasil'),
  CL: bi('Chile', 'Chile'),
  CO: bi('Colombia', 'Colombia'),
  CR: bi('Costa Rica', 'Costa Rica'),
  CU: bi('Cuba', 'Cuba'),
  DO: bi('Dominican Republic', 'República Dominicana'),
  EC: bi('Ecuador', 'Ecuador'),
  GQ: bi('Equatorial Guinea', 'Guinea Ecuatorial'),
  GT: bi('Guatemala', 'Guatemala'),
  HN: bi('Honduras', 'Honduras'),
  MX: bi('Mexico', 'México'),
  NI: bi('Nicaragua', 'Nicaragua'),
  PA: bi('Panama', 'Panamá'),
  PE: bi('Peru', 'Perú'),
  PH: bi('Philippines', 'Filipinas'),
  PT: bi('Portugal', 'Portugal'),
  PY: bi('Paraguay', 'Paraguay'),
  SV: bi('El Salvador', 'El Salvador'),
  UY: bi('Uruguay', 'Uruguay'),
  VE: bi('Venezuela', 'Venezuela'),
};

/** How a country reads in a `<select>`, where an option may carry only text. */
export function countryLabel(code: string): string {
  const name = COUNTRY_NAMES[code];
  return name === undefined ? code : `${name.en} · ${name.es} (${code})`;
}

interface Option {
  readonly value: string;
  readonly label: Bi | string;
}

/**
 * The states art. 22.1 names, alphabetically by English name.
 *
 * Alphabetical order is a lookup convenience, not a preference: nothing about
 * a dropdown's order says one nationality is better placed than another. The
 * *membership* of the list is read from the catalog constant, so this cannot
 * drift from the law the criterion applies.
 */
const LISTED_COUNTRY_OPTIONS: readonly Option[] = [...SPAIN_REDUCED_RESIDENCY_NATIONALITIES]
  .map((code) => ({ code, label: countryLabel(code) }))
  .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))
  .map(({ code, label }) => ({ value: code, label }));

const NOT_ANSWERED_OPTION: Option = {
  value: UNANSWERED,
  label: bi('Not answered', 'Sin responder'),
};

export const CLAIMED_NATIONALITY_OPTIONS: readonly Option[] = [
  NOT_ANSWERED_OPTION,
  ...LISTED_COUNTRY_OPTIONS,
  {
    value: OTHER_COUNTRY,
    label: bi(
      'Another nationality — I will enter its code',
      'Otra nacionalidad — introduciré su código',
    ),
  },
];

export const SECOND_NATIONALITY_OPTIONS: readonly Option[] = [
  NOT_ANSWERED_OPTION,
  {
    value: NO_SECOND_NATIONALITY,
    label: bi('I hold no other nationality', 'No tengo ninguna otra nacionalidad'),
  },
  ...LISTED_COUNTRY_OPTIONS,
  {
    value: OTHER_COUNTRY,
    label: bi(
      'Another nationality — I will enter its code',
      'Otra nacionalidad — introduciré su código',
    ),
  },
];

/**
 * How the nationality was acquired.
 *
 * There is deliberately no "I do not know" option that writes a value. See the
 * header of this file: `'unknown'` compares unequal to `'by_origin'` and would
 * turn silence into a definitive no. Leaving the question unanswered is the
 * supported way to say you do not know.
 */
export const ACQUISITION_OPTIONS: readonly Option[] = [
  NOT_ANSWERED_OPTION,
  {
    value: 'by_origin',
    label: bi(
      'By origin — I held it from birth, by descent or by attribution',
      'De origen — la tengo desde el nacimiento, por filiación o por atribución',
    ),
  },
  {
    value: 'by_residence',
    label: bi(
      'I acquired it later, by residence in that country',
      'La adquirí después, por residencia en ese país',
    ),
  },
  {
    value: 'by_naturalization',
    label: bi(
      'I acquired it later, on another basis (marriage, option, naturalisation)',
      'La adquirí después, por otra vía (matrimonio, opción, naturalización)',
    ),
  },
];

export const RESIDENCE_UNDER_OPTIONS: readonly Option[] = [
  NOT_ANSWERED_OPTION,
  {
    value: RESIDENCE_UNDER_CLAIMED,
    label: bi(
      'The nationality I would apply under',
      'La nacionalidad con la que solicitaría',
    ),
  },
  {
    value: RESIDENCE_UNDER_SECOND,
    label: bi('The other nationality I hold', 'La otra nacionalidad que tengo'),
  },
];

/**
 * Present situation in Spain.
 *
 * A short list, and each entry maps onto exactly one `ImmigrationStatus`. A
 * Spanish *residence and work* authorisation is a residence authorisation, so
 * it maps to `resident` rather than to `worker`; the hint on the field says so,
 * because a reader who picks the wrong one gets a wrong criterion.
 */
export const STATUS_OPTIONS: readonly Option[] = [
  NOT_ANSWERED_OPTION,
  {
    value: 'resident',
    label: bi(
      'A temporary residence authorisation, with or without work',
      'Una autorización de residencia temporal, con o sin trabajo',
    ),
  },
  {
    value: 'permanent_resident',
    label: bi('Long-term residence', 'Residencia de larga duración'),
  },
  { value: 'student', label: bi('A student stay', 'Una estancia por estudios') },
  { value: 'visitor', label: bi('A short stay or visit', 'Una estancia corta o visita') },
  {
    value: 'irregular',
    label: bi('Present without an authorisation', 'En España sin autorización'),
  },
];

const STATUS_VALUES: readonly string[] = STATUS_OPTIONS.map((o) => o.value).filter(
  (v) => v !== UNANSWERED,
);

/** Yes / no / not answered, for the four remaining criteria. */
function triState(yes: Bi, no: Bi): readonly Option[] {
  return [NOT_ANSWERED_OPTION, { value: YES, label: yes }, { value: NO, label: no }];
}

export const CCSE_OPTIONS = triState(
  bi('Yes, I have passed the CCSE', 'Sí, he superado la prueba CCSE'),
  bi('No, I have not passed it', 'No, no la he superado'),
);

export const DELE_OPTIONS = triState(
  bi('Yes, at A2 or above', 'Sí, de nivel A2 o superior'),
  bi('No, I hold no Spanish certificate', 'No, no tengo ningún certificado de español'),
);

export const CERTIFICATE_OPTIONS = triState(
  bi(
    'Yes, from Spain and from my country of nationality',
    'Sí, de España y de mi país de nacionalidad',
  ),
  bi('No, I do not hold both', 'No, no tengo ambos'),
);

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

/** Exactly what the form holds: strings, one per control, nothing derived. */
export interface NationalityAnswers {
  readonly assessAsOf: string;
  readonly claimed: string;
  readonly claimedOtherCode: string;
  readonly acquisition: string;
  readonly second: string;
  readonly secondOtherCode: string;
  readonly residenceUnder: string;
  readonly residenceSince: string;
  readonly status: string;
  readonly ageYears: string;
  readonly ccse: string;
  readonly dele: string;
  readonly certificates: string;
}

export const EMPTY_ANSWERS: NationalityAnswers = {
  assessAsOf: DEFAULT_ASSESSMENT_DATE,
  claimed: UNANSWERED,
  claimedOtherCode: '',
  acquisition: UNANSWERED,
  second: UNANSWERED,
  secondOtherCode: '',
  residenceUnder: UNANSWERED,
  residenceSince: '',
  status: UNANSWERED,
  ageYears: '',
  ccse: UNANSWERED,
  dele: UNANSWERED,
  certificates: UNANSWERED,
};

// ---------------------------------------------------------------------------
// Invented answer sets
// ---------------------------------------------------------------------------

export interface NationalityExample {
  readonly id: string;
  readonly label: Bi;
  readonly answers: NationalityAnswers;
}

/**
 * The dual-national case, spelled out.
 *
 * Italy is not one of the states art. 22.1 names, which is the whole point: an
 * Italian-Mexican dual national admitted to Spain and registered as an EU
 * citizen holds their residence under the Italian nationality, and the two-year
 * period is not available on the strength of the Mexican passport. The code is
 * entered through the "another nationality" field exactly as a reader would
 * have to enter it.
 */
const DUAL_SECOND_CODE = 'IT';

/**
 * Three invented situations, for trying the tool without your own file to hand.
 *
 * Nobody's data appears here. There is no name, no document number and no date
 * of birth in any of them — only the facts the two pathways actually consult.
 * The three differ from each other in one answer at a time, which is what makes
 * them worth loading: the second changes only which nationality the residence
 * is held under, and the third changes only whether the acquisition mode was
 * stated.
 */
export const NATIONALITY_EXAMPLES: readonly NationalityExample[] = (() => {
  const byOrigin: NationalityAnswers = {
    ...EMPTY_ANSWERS,
    claimed: 'MX',
    acquisition: 'by_origin',
    second: NO_SECOND_NATIONALITY,
    residenceUnder: RESIDENCE_UNDER_CLAIMED,
    residenceSince: '2024-03-01',
    status: 'resident',
    ageYears: '34',
    ccse: YES,
    // Left unanswered on purpose: a Mexican national is exempt from the DELE A2
    // because Spanish is an official language there, and the criterion reaches
    // that branch without any certificate being recorded.
    dele: UNANSWERED,
    certificates: YES,
  };

  return [
    {
      id: 'by-origin',
      label: bi(
        'Two years, nationality held by origin',
        'Dos años, nacionalidad ostentada de origen',
      ),
      answers: byOrigin,
    },
    {
      id: 'dual-national',
      label: bi(
        'The same file, residing under a second nationality',
        'El mismo expediente, residiendo bajo una segunda nacionalidad',
      ),
      answers: {
        ...byOrigin,
        second: OTHER_COUNTRY,
        secondOtherCode: DUAL_SECOND_CODE,
        residenceUnder: RESIDENCE_UNDER_SECOND,
      },
    },
    {
      id: 'acquisition-unstated',
      label: bi(
        'The same file, with the acquisition mode unstated',
        'El mismo expediente, sin indicar el modo de adquisición',
      ),
      answers: { ...byOrigin, acquisition: UNANSWERED },
    },
  ];
})();

// ---------------------------------------------------------------------------
// Reading the answers
// ---------------------------------------------------------------------------

interface CountryReading {
  readonly country: CountryCode | null;
  readonly issue: FieldIssue | null;
}

/**
 * Resolve one nationality select, plus the free-text code behind its "another
 * nationality" option.
 *
 * The code is validated with `isCountryCode` before `countryCode` is called,
 * because that constructor throws on anything that is not two letters and a
 * thrown `RangeError` in a form handler is a blank screen rather than a message.
 */
function readCountry(
  selectValue: string,
  codeFieldId: string,
  rawCode: string,
): CountryReading {
  if (selectValue === UNANSWERED || selectValue === NO_SECOND_NATIONALITY) {
    return { country: null, issue: null };
  }

  if (selectValue !== OTHER_COUNTRY) {
    return isCountryCode(selectValue)
      ? { country: countryCode(selectValue), issue: null }
      : { country: null, issue: null };
  }

  const trimmed = rawCode.trim().toUpperCase();
  if (trimmed.length === 0) {
    return {
      country: null,
      issue: issue(
        codeFieldId,
        bi(
          'Enter the two-letter country code, for example MA for Morocco.',
          'Introduzca el código de país de dos letras, por ejemplo MA para Marruecos.',
        ),
      ),
    };
  }
  if (!isCountryCode(trimmed)) {
    return {
      country: null,
      issue: issue(
        codeFieldId,
        bi(
          `"${rawCode.trim()}" is not an ISO 3166-1 alpha-2 country code. Codes are two letters, for example MA or MO.`,
          `«${rawCode.trim()}» no es un código de país ISO 3166-1 alfa-2. Los códigos tienen dos letras, por ejemplo MA o MO.`,
        ),
      ),
    };
  }
  return { country: countryCode(trimmed), issue: null };
}

function acquisitionOf(raw: string): NationalityAcquisition | undefined {
  // `'unknown'` is intentionally unreachable from the form. See the file header.
  if (raw === 'by_origin' || raw === 'by_residence' || raw === 'by_naturalization') return raw;
  return undefined;
}

function statusOf(raw: string): ImmigrationStatus | undefined {
  return STATUS_VALUES.includes(raw) ? (raw as ImmigrationStatus) : undefined;
}

export interface AnswersReading {
  readonly issues: readonly FieldIssue[];
  /** Both `null` when anything failed to read; a half-parsed form computes nothing. */
  readonly facts: ApplicantFacts | null;
  readonly asOf: IsoDate | null;
}

/**
 * Turn the form into facts.
 *
 * Only four things can fail: a malformed reference date, a malformed country
 * code, a residence start after the reference date, and an age that is not a
 * whole number in a plausible range. Everything else is either answered or
 * absent, and absent is a legitimate state that the engine handles by reporting
 * `unknown`.
 */
export function readNationalityAnswers(answers: NationalityAnswers): AnswersReading {
  const asOfResult = readDateField(FIELD.assessAsOf, answers.assessAsOf, { required: true });
  const claimedResult = readCountry(answers.claimed, FIELD.claimedOtherCode, answers.claimedOtherCode);
  const secondResult = readCountry(answers.second, FIELD.secondOtherCode, answers.secondOtherCode);
  const sinceResult = readDateField(FIELD.residenceSince, answers.residenceSince);
  const ageResult = readIntegerField(FIELD.ageYears, answers.ageYears, { min: 0, max: 130 });

  const sameTwice =
    claimedResult.country !== null &&
    secondResult.country !== null &&
    claimedResult.country === secondResult.country
      ? issue(
          FIELD.second,
          bi(
            'This is the same nationality as the one you would apply under. Choose a different one, or say you hold no other nationality.',
            'Es la misma nacionalidad con la que solicitaría. Elija otra distinta o indique que no tiene ninguna otra nacionalidad.',
          ),
        )
      : null;

  const residenceUnderSecondWithoutSecond =
    answers.residenceUnder === RESIDENCE_UNDER_SECOND && secondResult.country === null
      ? issue(
          FIELD.second,
          bi(
            'You said the residence is held under your other nationality. Name that nationality so the rule has something to compare against.',
            'Ha indicado que la residencia se ostenta bajo su otra nacionalidad. Indique cuál es, para que la norma tenga algo con lo que compararla.',
          ),
        )
      : null;

  const startsAfterAssessment =
    sinceResult.date !== null &&
    asOfResult.date !== null &&
    compareDates(sinceResult.date, asOfResult.date) > 0
      ? issue(
          FIELD.residenceSince,
          bi(
            'Residence cannot begin after the date the assessment is run as at.',
            'La residencia no puede comenzar después de la fecha a la que se realiza la evaluación.',
          ),
        )
      : null;

  const issues = collect([
    asOfResult.issue,
    claimedResult.issue,
    secondResult.issue,
    sameTwice,
    residenceUnderSecondWithoutSecond,
    sinceResult.issue,
    startsAfterAssessment,
    ageResult.issue,
  ]);

  const asOf = asOfResult.date;
  if (issues.length > 0 || asOf === null) {
    return { issues, facts: null, asOf: null };
  }

  const claimed = claimedResult.country;
  const second = secondResult.country;

  // Naming a nationality in the first question IS the assertion that you hold
  // it, so it always enters `nationalities`. The second question only adds to
  // the set; leaving it unanswered adds nothing and asserts nothing.
  const held: CountryCode[] = [];
  if (claimed !== null) held.push(claimed);
  if (second !== null) held.push(second);

  const residenceHeldUnder =
    answers.residenceUnder === RESIDENCE_UNDER_CLAIMED
      ? claimed
      : answers.residenceUnder === RESIDENCE_UNDER_SECOND
        ? second
        : null;

  /**
   * A field carrying `undefined` and a field that is absent are the same thing
   * to the evaluator: `resolvePath` returns "not found" for both, so a property
   * written as `undefined` produces `unknown` exactly as an omitted one does.
   * Writing them out rather than spreading conditionals keeps every fact this
   * tool can record visible in one list.
   */
  const facts: ApplicantFacts = {
    // Required by the type and nothing more. It identifies no one: the tool has
    // no account, no session and no storage, and this string never leaves the
    // page it was constructed on.
    applicantId: 'browser-tool',
    targetJurisdiction: SPAIN,

    nationalities: held.length > 0 ? held : undefined,
    claimedNationality: claimed ?? undefined,
    claimedNationalityAcquisition: acquisitionOf(answers.acquisition),
    residenceHeldUnderNationality: residenceHeldUnder ?? undefined,

    // A single closed range from the stated start through the assessment date.
    // `derived.continuousLegalResidenceSince` is only populated when an unbroken
    // run covers `asOf`, which is exactly what art. 22.3's "immediately prior to
    // the application" asks for.
    residencePeriods:
      sinceResult.date === null ? undefined : [dateRange(sinceResult.date, asOf)],

    currentStatus: statusOf(answers.status),
    ageYears: ageResult.value ?? undefined,

    examResults:
      answers.ccse === YES
        ? [{ code: 'CCSE', passed: true }]
        : answers.ccse === NO
          ? [{ code: 'CCSE', passed: false }]
          : undefined,

    // "At A2 or above" is recorded as A2, which is what the reader asserted and
    // what the criterion compares with `ordinal_at_least`. An answered "no" is
    // an empty array — the positive assertion that no certificate is held —
    // rather than an absent field.
    languageCertifications:
      answers.dele === YES
        ? [{ language: 'es', framework: 'cefr', level: 'A2' }]
        : answers.dele === NO
          ? []
          : undefined,

    criminalRecord:
      answers.certificates === YES
        ? {
            certificates:
              claimed === null
                ? [{ jurisdiction: SPAIN, clear: true }]
                : [
                    { jurisdiction: SPAIN, clear: true },
                    { jurisdiction: claimed, clear: true },
                  ],
          }
        : answers.certificates === NO
          ? { certificates: [] }
          : undefined,
  };

  return { issues: [], facts, asOf };
}

// ---------------------------------------------------------------------------
// The assessment
// ---------------------------------------------------------------------------

/**
 * The two regimes, in the order `ES_PATHWAYS` records them.
 *
 * The order is the catalog's and is not a ranking. Both are evaluated on every
 * run and both are always shown, because which one a person is on is exactly
 * what the nationality questions decide — presenting only the one that came out
 * better would be choosing for them, and choosing is advice.
 */
const ROUTES: readonly Pathway[] = [esNationalityResidenceReduced, esNationalityResidenceGeneral];

/** Criterion ids the interface calls out individually. */
const CRITERION_BY_ORIGIN = 'es-nat-red-nationality-by-origin';
const CRITERION_RESIDENCE_NATIONALITY = 'es-nat-red-nationality-of-residence';
const CRITERION_TWO_YEARS = 'es-nat-red-two-years-continuous-residence';
const CRITERION_TEN_YEARS = 'es-nat-gen-ten-years-continuous-residence';

/** A criterion joined to what the engine made of it. */
export interface CriterionView {
  readonly id: string;
  readonly label: Bi;
  readonly kind: Criterion['kind'];
  readonly weight: Criterion['weight'];
  readonly status: CriterionStatus;
  /** The engine's own trace of the comparison. English, and shown verbatim. */
  readonly detail: string;
  readonly evidence: CriterionResult['evidence'];
  readonly guidance?: Bi;
  readonly citationIds: readonly string[];
  readonly humanReviewReason?: string;
}

/** One report note, with the criteria it was raised for. */
export interface NoteView {
  readonly key: string;
  readonly code: ReportNote['code'];
  readonly text: string;
  readonly citationId?: string;
  readonly criteria: readonly Bi[];
}

export interface RouteAssessment {
  readonly pathway: Pathway;
  readonly report: EligibilityReport;
  readonly criteria: readonly CriterionView[];
}

export interface NationalityAssessment {
  readonly asOf: IsoDate;
  readonly routes: readonly RouteAssessment[];
  /**
   * Notes and sources are collected across both routes rather than per route.
   * The two regimes cite the same articles, so a per-route list would print
   * `es-cc-art-22-1` twice — which repeats a caveat until it stops being read,
   * and puts the same DOM id on two elements so the inline references jump to
   * whichever came first.
   */
  readonly notes: readonly NoteView[];
  readonly citations: readonly Citation[];
  /** Decisive criteria, across both routes, that the answers did not decide. */
  readonly unknownCount: number;
  /** Status of the *de origen* criterion, or `null` if the catalog id moved. */
  readonly byOriginStatus: CriterionStatus | null;
  /** Status of the "residence is held under the claimed nationality" criterion. */
  readonly residenceNationalityStatus: CriterionStatus | null;
  /** True when either residence-duration criterion was actually decided. */
  readonly residenceDurationDecided: boolean;
}

function viewCriteria(pathway: Pathway, report: EligibilityReport): CriterionView[] {
  const byId = new Map(report.criteria.map((r) => [r.criterionId, r]));
  const views: CriterionView[] = [];

  for (const criterion of pathway.criteria) {
    const result = byId.get(criterion.id);
    // Every criterion on the pathway is evaluated by `evaluate`, so a missing
    // result would be a defect in the engine rather than a state to render.
    // Skipping is the honest response: showing a criterion with an invented
    // status would be worse than showing one fewer row.
    if (result === undefined) continue;
    views.push({
      id: criterion.id,
      label: criterion.label,
      kind: criterion.kind,
      weight: criterion.weight,
      status: result.status,
      detail: result.detail,
      evidence: result.evidence,
      guidance: criterion.guidance,
      citationIds: criterion.citationIds,
      humanReviewReason: result.humanReviewReason,
    });
  }

  return views;
}

/**
 * Collapse the report's notes.
 *
 * `collectNotes` raises one `discretionary_source` note per criterion that
 * leans on a discretionary citation, so a citation cited by two criteria
 * produces the same paragraph twice. The text is identical, so it is shown once
 * with both criteria named — repeating a caveat verbatim trains people to skim
 * past it, which is the opposite of what the caveat is for.
 *
 * The criteria are de-duplicated **by their text, not by object identity**. The
 * two regimes carry the same requirements under different ids —
 * `es-nat-red-ccse` and `es-nat-gen-ccse` are distinct criteria whose labels are
 * distinct objects with identical wording — so an identity check lets the same
 * sentence through twice, and a list keyed on that sentence then renders two
 * children with the same key.
 */
function viewNotes(routes: readonly RouteAssessment[]): readonly NoteView[] {
  interface Grouped {
    key: string;
    code: ReportNote['code'];
    text: string;
    citationId: string | undefined;
    criteria: Bi[];
  }

  const labelById = new Map<string, Bi>(
    routes.flatMap((r) => r.pathway.criteria.map((c): [string, Bi] => [c.id, c.label])),
  );
  const out: Grouped[] = [];

  for (const route of routes) {
    for (const note of route.report.notes) {
      const key = `${note.code}:${note.citationId ?? ''}`;
      const label = note.criterionId === undefined ? undefined : labelById.get(note.criterionId);
      const existing = out.find((n) => n.key === key);
      if (existing === undefined) {
        out.push({
          key,
          code: note.code,
          text: note.text,
          citationId: note.citationId,
          criteria: label === undefined ? [] : [label],
        });
      } else if (label !== undefined && !existing.criteria.some((c) => c.en === label.en)) {
        existing.criteria.push(label);
      }
    }
  }

  return out;
}

/** Every source both routes rest on, once each, in id order. */
function viewCitations(routes: readonly RouteAssessment[]): readonly Citation[] {
  const byId = new Map<string, Citation>();
  for (const route of routes) {
    // A pathway's citations are inferred by zod rather than declared as core's
    // `Citation`, and the two are structurally identical — `@meridian/pathways`
    // pins that with a compile-time test. This is a widening, not an assertion.
    const citations: readonly Citation[] = route.pathway.citations;
    for (const citation of citations) {
      if (!byId.has(citation.id)) byId.set(citation.id, citation);
    }
  }
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function statusOfCriterion(routes: readonly RouteAssessment[], id: string): CriterionStatus | null {
  for (const route of routes) {
    const found = route.criteria.find((c) => c.id === id);
    if (found !== undefined) return found.status;
  }
  return null;
}

/**
 * Measure the facts against both regimes.
 *
 * The whole legal content of this function is `evaluate(pathway, facts, asOf)`,
 * called twice. Everything around it is joining, grouping and counting.
 */
export function runNationalityCheck(
  facts: ApplicantFacts,
  asOf: IsoDate,
): NationalityAssessment {
  const routes: RouteAssessment[] = ROUTES.map((pathway) => {
    const report = evaluate(pathway, facts, asOf);
    return { pathway, report, criteria: viewCriteria(pathway, report) };
  });

  const twoYears = statusOfCriterion(routes, CRITERION_TWO_YEARS);
  const tenYears = statusOfCriterion(routes, CRITERION_TEN_YEARS);

  return {
    asOf,
    routes,
    notes: viewNotes(routes),
    citations: viewCitations(routes),
    unknownCount: routes.reduce((sum, r) => sum + r.report.unknowns.length, 0),
    byOriginStatus: statusOfCriterion(routes, CRITERION_BY_ORIGIN),
    residenceNationalityStatus: statusOfCriterion(routes, CRITERION_RESIDENCE_NATIONALITY),
    residenceDurationDecided:
      (twoYears !== null && twoYears !== 'unknown') || (tenYears !== null && tenYears !== 'unknown'),
  };
}

// ---------------------------------------------------------------------------
// Wording the engine does not supply
// ---------------------------------------------------------------------------

/** Titles for the notes `evaluate` attaches to a report. */
export const NOTE_TITLE: Readonly<Record<ReportNote['code'], Bi>> = {
  discretionary_source: bi(
    'This depends on administrative practice, not on a stated threshold',
    'Esto depende de práctica administrativa, no de un umbral establecido',
  ),
  pathway_closed: bi('This route is closed', 'Esta vía está cerrada'),
  pathway_not_yet_open: bi('This route had not opened', 'Esta vía aún no estaba abierta'),
  unreviewed_rule: bi(
    'No licensed person has signed off on these rules',
    'Ninguna persona con licencia ha validado estas normas',
  ),
};

/**
 * What "continuous" leaves open — surfaced as a caveat, never as a number.
 *
 * Art. 22.1 states the periods: two years, and ten. Those are statutory and the
 * criteria measure them exactly. What art. 22.3 does *not* state is how much
 * time outside Spain breaks the continuity it requires; that is assessed by the
 * Civil Registry when it examines the file. Meridian does not encode a
 * threshold for absences, does not subtract time abroad from the run this tool
 * measures, and will not print an invented figure for how long a trip may be.
 * Saying so is the honest position; printing "six months" would be inventing
 * law, which is the one thing this product exists not to do.
 */
export const CONTINUITY_CAVEAT: Bi = bi(
  'The periods themselves — two years and ten — are stated in art. 22.1, and the check above measures them exactly, from the start date you gave to the assessment date. What art. 22.3 requires beyond the arithmetic is that the residence be continuous, and it does not say how much time outside Spain breaks that. The Civil Registry assesses it when it examines the file. This tool asks for one unbroken period and measures its length; it does not subtract absences, and it does not assert any limit on them, because no figure for one appears in the Civil Code.',
  'Los plazos en sí —dos años y diez— los fija el art. 22.1, y la comprobación anterior los mide exactamente, desde la fecha de inicio que usted indicó hasta la fecha de evaluación. Lo que el art. 22.3 exige más allá de la aritmética es que la residencia sea continuada, y no precisa cuánto tiempo fuera de España rompe esa continuidad. Lo valora el Registro Civil al examinar el expediente. Esta herramienta pide un único periodo ininterrumpido y mide su duración; no descuenta ausencias ni afirma ningún límite para ellas, porque en el Código Civil no consta ninguna cifra al respecto.',
);

/** Why the review status of these records is stated so prominently. */
export const UNREVIEWED_CAVEAT: Bi = bi(
  'Every record in Meridian’s catalog is marked unreviewed, and these two are no exception. It means the criteria and citations below were written from the published sources but no licensed person has read them and put their name to them. They are shown as encoded — the rule, the comparison and the source — so you can check each one against the instrument yourself. Nothing here is a recommendation, and the engine that would rank routes refuses to consider an unreviewed record at all.',
  'Todos los registros del catálogo de Meridian están marcados como no revisados, y estos dos no son una excepción. Significa que los criterios y las citas siguientes se redactaron a partir de las fuentes publicadas, pero ninguna persona con licencia los ha leído ni los ha firmado. Se muestran tal como están codificados —la norma, la comparación y la fuente— para que usted mismo pueda contrastar cada uno con el instrumento. Nada de esto es una recomendación, y el motor que ordenaría las vías se niega por completo a considerar un registro no revisado.',
);

/** The three-valued logic, said once, in words. */
export const UNKNOWN_CAVEAT: Bi = bi(
  'A question you did not answer produces "not recorded", never "unmet". The two are different findings and they are shown differently: unmet means the answer you gave does not satisfy the rule, and not recorded means nothing you entered decides it. A criterion that is not recorded holds the whole route at "not decidable" rather than turning it into a no — an engine that read silence as failure would tell somebody half-way through a form that they do not qualify, and people act on that.',
  'Una pregunta sin responder produce «sin datos», nunca «no cumplido». Son hallazgos distintos y se muestran de forma distinta: no cumplido significa que la respuesta que dio no satisface la norma, y sin datos significa que nada de lo que introdujo lo decide. Un criterio sin datos deja toda la vía en «no decidible» en lugar de convertirla en un no: un motor que leyera el silencio como incumplimiento diría a quien va por la mitad de un formulario que no reúne los requisitos, y la gente actúa en consecuencia.',
);

/**
 * The registry entry for this tool.
 *
 * `lib/tools/registry.ts` is the one place that enumerates the tools, and it
 * belongs to another author — so the entry is declared here, beside the tool it
 * describes, and imported there. Two properties follow from that arrangement
 * and both are the reason for it: the description cannot drift from what the
 * tool actually does, and `ToolEntry` is imported as a **type only**, so
 * `verbatimModuleSyntax` erases it and no runtime import cycle exists even once
 * the registry imports this constant back.
 */
export const NATIONALITY_ES_TOOL_ENTRY: ToolEntry = {
  id: 'nationality-es',
  href: '/tools/nationality-es',
  name: bi(
    'Spanish nationality by residence — criteria check',
    'Nacionalidad española por residencia — comprobación de criterios',
  ),
  summary: bi(
    'Answer a short set of questions about your nationality, your residence and the statutory exams. Meridian measures them against both regimes in art. 22 of the Civil Code — the two-year reduced period and the general ten years — and reports each criterion as met, unmet or not recorded, with the provision behind it.',
    'Responda a unas pocas preguntas sobre su nacionalidad, su residencia y las pruebas legalmente exigidas. Meridian las contrasta con los dos regímenes del art. 22 del Código Civil —el plazo reducido de dos años y el general de diez— e indica cada criterio como cumplido, no cumplido o sin datos, con el precepto que lo respalda.',
  ),
  input: bi(
    'Your nationality and how you hold it, when your residence began, and whether you hold the exams and certificates',
    'Su nacionalidad y cómo la ostenta, cuándo empezó su residencia y si tiene las pruebas y los certificados',
  ),
  notThis: bi(
    'It cannot tell you whether nationality would be granted, or which regime to apply under. Art. 22.4 turns on an assessment of civic conduct and integration that no software performs, and the criteria here have not been signed off by a licensed person.',
    'No puede decirle si se concedería la nacionalidad ni por qué régimen solicitar. El art. 22.4 exige una valoración de la conducta cívica y de la integración que ningún programa realiza, y estos criterios no han sido validados por una persona con licencia.',
  ),
  rule: bi(
    'Código Civil (España), arts. 22-24, and Real Decreto 1004/2015 on the CCSE and DELE requirements',
    'Código Civil (España), arts. 22-24, y Real Decreto 1004/2015 sobre los requisitos de CCSE y DELE',
  ),
};
