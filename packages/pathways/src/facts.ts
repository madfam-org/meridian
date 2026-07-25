/**
 * What the engine knows about a person.
 *
 * Every field except `applicantId` is optional, and that is a correctness
 * requirement rather than convenience. An immigration engine that treats a
 * missing field as a negative will tell someone they are ineligible because
 * they have not finished filling in a form. The three-valued logic in
 * {@link import('./evaluate.js').evaluate} depends on absence being
 * distinguishable from a recorded "no": `criminalRecord === undefined` is
 * unknown, `criminalRecord.selfDeclaredClear === false` is a fact.
 *
 * The corollary is that an empty array is *not* the same as an absent one.
 * `criminalRecord.certificates: []` asserts "I hold no police certificates",
 * which is knowable and false-yielding. `certificates: undefined` asserts
 * nothing.
 *
 * Nothing in this file is persisted here — these are the inputs the caller
 * assembles from a matter. Keep it free of anything resembling a document
 * scan, a passport image, or a credential.
 */

import type { CountryCode, DateRange, IsoDate, NationalityAcquisition } from '@meridian/core';
import {
  addDays,
  addYears,
  compareDates,
  dateRange,
  diffDays,
  intersectRanges,
  mergeRanges,
  rangeContains,
  rangeLengthDays,
  totalDays,
} from '@meridian/core';

/**
 * Education levels as an *ordered* scale, so `ordinal_at_least` can express
 * "Baccalaureate or Licenciatura Degree" without the engine knowing what a
 * Licenciatura is.
 *
 * `professional_degree` sits above `bachelor` because the CUSMA professions
 * that demand one (Doctor of Dental Surgery, LL.B., M.D.) are never satisfied
 * by a plain baccalaureate. It sits below `master` only for ordering
 * convenience; no rule in this catalog compares the two, and any rule that
 * needs to should say so explicitly rather than lean on this ordering.
 */
export const EDUCATION_SCALE: readonly string[] = [
  'none',
  'secondary',
  'post_secondary_diploma',
  'bachelor',
  'professional_degree',
  'master',
  'doctorate',
];

export type EducationLevel = (typeof EDUCATION_SCALE)[number];

/** Common European Framework of Reference levels, ascending. */
export const CEFR_SCALE: readonly string[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Canadian Language Benchmarks / Niveaux de compétence linguistique canadiens, ascending. */
export const CLB_SCALE: readonly string[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

export type ImmigrationStatus =
  | 'none'
  | 'visitor'
  | 'student'
  | 'worker'
  | 'resident'
  | 'permanent_resident'
  | 'citizen'
  | 'asylum_seeker'
  | 'refugee'
  /** Present without authorisation. Never inferred — only ever recorded because someone said so. */
  | 'irregular';

export type EmploymentType =
  | 'employee'
  | 'self_employed'
  | 'contractor'
  | 'company_director'
  | 'unemployed'
  | 'retired'
  | 'student';

export interface LanguageCertification {
  /** ISO 639-1, e.g. `es`, `en`, `fr`. */
  readonly language?: string;
  /** Which scale `level` is expressed on. Comparing a CEFR B2 to a CLB 7 is meaningless. */
  readonly framework?: 'cefr' | 'clb' | 'nclc' | 'other';
  /** A value from the matching scale, e.g. `A2` for CEFR or `7` for CLB. */
  readonly level?: string;
  /** e.g. `instituto_cervantes`, `ielts`, `tef`. */
  readonly issuer?: string;
  readonly awardedOn?: IsoDate;
  /** Many language results expire. Absent means "not recorded", not "never expires". */
  readonly expiresOn?: IsoDate;
}

/** A non-language examination, e.g. Spain's CCSE constitutional and sociocultural knowledge test. */
export interface ExamResult {
  readonly code?: string;
  readonly passed?: boolean;
  readonly takenOn?: IsoDate;
  readonly expiresOn?: IsoDate;
}

export interface ProfessionalCredential {
  readonly kind?: 'degree' | 'diploma' | 'licence' | 'certification' | 'membership';
  readonly title?: string;
  /** A value from {@link EDUCATION_SCALE} when `kind` is `degree` or `diploma`. */
  readonly level?: EducationLevel;
  readonly field?: string;
  readonly issuingCountry?: CountryCode;
  readonly issuedOn?: IsoDate;
  /** Regulator or awarding body, as named in its own register. */
  readonly issuer?: string;
  /** Whether the credential has been verified against the issuer, not merely claimed. */
  readonly verified?: boolean;
}

export interface JobOffer {
  readonly employerName?: string;
  readonly employerCountry?: CountryCode;
  /** Which vocabulary `occupationCode` is drawn from. */
  readonly occupationTaxonomy?: 'cusma_appendix_2' | 'noc_2021' | 'cno_2011' | 'other';
  readonly occupationCode?: string;
  /** Canada's NOC 2021 TEER category, 0-5. Skilled work for most programs means 0-3. */
  readonly nocTeer?: number;
  readonly annualSalaryMinorUnits?: number;
  /** ISO 4217. Salary thresholds are meaningless across currencies, so this must match. */
  readonly currency?: string;
  readonly fullTime?: boolean;
  readonly durationMonths?: number;
  /** A signed written offer, as opposed to a verbal one. */
  readonly writtenOffer?: boolean;
  /** Several routes exclude self-employment outright, so this cannot be inferred from `employerName`. */
  readonly selfEmployment?: boolean;
}

export interface WorkExperience {
  readonly country?: CountryCode;
  /** Closed at both ends: a one-day engagement is one day. */
  readonly period?: DateRange;
  readonly occupationTaxonomy?: 'cusma_appendix_2' | 'noc_2021' | 'cno_2011' | 'other';
  readonly occupationCode?: string;
  readonly nocTeer?: number;
  readonly fullTime?: boolean;
  /**
   * Whether the work was performed with authorisation. Unauthorised work does
   * not count toward any program in this catalog and is itself a risk factor,
   * so it is recorded rather than quietly dropped.
   */
  readonly authorized?: boolean;
  readonly skilled?: boolean;
}

export interface MonetaryAmount {
  readonly minorUnits?: number;
  /** ISO 4217. */
  readonly currency?: string;
  readonly period?: 'annual' | 'monthly';
}

/**
 * Published reference indices the caller supplies for the relevant year.
 *
 * Spain's economic-means thresholds are multiples of IPREM and SMI, both of
 * which are re-set annually by decree. Hardcoding a euro figure in a catalog
 * that ships quarterly guarantees the figure is wrong; a rule expressed as
 * "four times IPREM" plus a caller-supplied IPREM stays correct and, when the
 * index is not supplied, yields `unknown` instead of a wrong answer.
 */
export interface ReferenceIndices {
  readonly ipremAnnualMinorUnits?: number;
  readonly smiAnnualMinorUnits?: number;
  readonly currency?: string;
}

export interface CriminalRecordCertificate {
  readonly jurisdiction?: CountryCode;
  /** True when the certificate shows no convictions. */
  readonly clear?: boolean;
  readonly issuedOn?: IsoDate;
  readonly apostilled?: boolean;
}

export interface CriminalRecord {
  readonly selfDeclaredClear?: boolean;
  readonly certificates?: readonly CriminalRecordCertificate[];
}

export interface TravelHistorySummary {
  readonly priorRefusals?: number;
  readonly priorOverstays?: number;
  readonly priorRemovals?: number;
  readonly visitedCountries?: readonly CountryCode[];
  readonly lastEntryOn?: IsoDate;
}

/**
 * A capital investment offered in support of an investor route.
 *
 * Still modelled even though Spain's investor route is closed: people hold
 * status granted under repealed rules for years, and a renewal question needs
 * the same facts the original grant did.
 */
export interface QualifyingInvestment {
  readonly kind?: 'real_estate' | 'public_debt' | 'shares' | 'bank_deposit' | 'business_project';
  readonly minorUnits?: number;
  /** ISO 4217. A threshold denominated in euros cannot be met in another currency. */
  readonly currency?: string;
  readonly madeOn?: IsoDate;
}

export interface Intent {
  /** Whether the applicant asserts a temporary stay. Central to treaty work permits. */
  readonly temporary?: boolean;
  /** Federal Canadian economic programs require an intention to settle outside Quebec. */
  readonly intendsToResideOutsideQuebec?: boolean;
  /** Routes such as Spain's non-lucrative residence forbid economic activity in the host state. */
  readonly noEconomicActivityInTargetState?: boolean;
  readonly declaredPurpose?: string;
}

export interface HealthInsurance {
  readonly hasPrivateCoverage?: boolean;
  /** The state whose regulator authorised the insurer. Spanish routes require a Spain-authorised insurer. */
  readonly insurerAuthorizedIn?: CountryCode;
  readonly coversFullPeriod?: boolean;
  /** Some routes require cover with no co-payments and no waiting periods. */
  readonly withoutCopayment?: boolean;
}

/** Remote-work facts, for teleworking routes. */
export interface RemoteWork {
  /** Whether the work is performed for entities established outside the target state. */
  readonly employerOutsideTargetState?: boolean;
  /** Share of professional activity performed for entities in the target state, 0-100. */
  readonly targetStateActivityPercent?: number;
  /** Months the existing relationship with the employer or client has run. */
  readonly relationshipMonths?: number;
  /** Months the employer or client has been trading. */
  readonly employerTradingMonths?: number;
}

/**
 * The applicant's facts, as assembled by the caller.
 *
 * `nationalities` and `claimedNationality` are separate fields and the
 * distinction is not pedantry. Spain's two-year route is conferred on nationals
 * of named states; where somebody holds more than one nationality, which one
 * they were admitted and reside under changes the answer. Storing only a list
 * and picking the most favourable member is the bug that costs a dual national
 * eight extra years of residence.
 */
export interface ApplicantFacts {
  /** The only required field. Everything else may legitimately be unknown. */
  readonly applicantId: string;

  readonly nationalities?: readonly CountryCode[];
  /** The nationality the applicant is applying under. Must be one they actually hold. */
  readonly claimedNationality?: CountryCode;
  /**
   * How `claimedNationality` was acquired.
   *
   * Art. 22.1 confers the two-year period on *nacionales de origen* — by
   * origin, not merely held. Someone who acquired a qualifying nationality by
   * residence is on the ten-year general regime. Leave this unset and the rule
   * evaluates to `unknown`, which surfaces as indeterminate; that is the
   * intended behaviour, because the alternative is telling a person they are
   * eight years closer than they are.
   */
  readonly claimedNationalityAcquisition?: NationalityAcquisition;
  /**
   * The nationality under which the applicant was admitted to, and holds
   * residence in, the target state. Distinct from `claimedNationality`: a
   * dual national may hold both and have entered on the wrong one.
   */
  readonly residenceHeldUnderNationality?: CountryCode;

  readonly dateOfBirth?: IsoDate;
  /** Supply only when `dateOfBirth` is unavailable; the derived value wins when both exist. */
  readonly ageYears?: number;

  readonly targetJurisdiction?: CountryCode;
  readonly currentStatus?: ImmigrationStatus;
  readonly statusExpiresOn?: IsoDate;
  /** When an application was (or will be) lodged. Used by rules keyed to a repeal date. */
  readonly applicationLodgedOn?: IsoDate;

  /**
   * Periods of legal residence in the target state, closed at both ends.
   * To assert *current* residence, the last period must run through `asOf`.
   */
  readonly residencePeriods?: readonly DateRange[];
  /** Supply only when `residencePeriods` is unavailable. Does not establish continuity. */
  readonly legalResidenceDays?: number;
  /** Trips outside the target state during residence. */
  readonly absences?: readonly DateRange[];

  readonly languageCertifications?: readonly LanguageCertification[];
  readonly examResults?: readonly ExamResult[];

  readonly educationLevel?: EducationLevel;
  readonly educationField?: string;
  readonly educationCountry?: CountryCode;
  readonly professionalCredentials?: readonly ProfessionalCredential[];
  /**
   * Completed years of professional experience in the relevant field. Several
   * routes accept experience *in place of* a degree, so this is a first-class
   * fact rather than something inferred from `workExperience` — the applicant's
   * pre-platform career is rarely recorded period by period.
   */
  readonly professionalExperienceYears?: number;

  readonly jobOffer?: JobOffer;
  readonly workExperience?: readonly WorkExperience[];
  readonly employmentType?: EmploymentType;
  readonly remoteWork?: RemoteWork;

  /** Income not derived from work — pensions, rents, dividends. */
  readonly passiveIncome?: MonetaryAmount;
  readonly referenceIndices?: ReferenceIndices;
  readonly qualifyingInvestment?: QualifyingInvestment;

  readonly criminalRecord?: CriminalRecord;
  readonly travelHistory?: TravelHistorySummary;
  readonly intent?: Intent;
  readonly healthInsurance?: HealthInsurance;
}

/**
 * Values computed from the facts with real calendar arithmetic.
 *
 * Date maths does not belong in the declarative spec language — expressing
 * "merge these stays, discard the overlaps, and tell me the length of the
 * unbroken run that includes today" as data would be an interpreter, not a
 * rule. So it lives here, in one place, built entirely from core's civil-date
 * functions, and the catalog references the results by path.
 *
 * Every field is optional for the same reason as {@link ApplicantFacts}: a
 * value that cannot be computed must stay absent so the evaluator reports
 * `unknown`.
 */
export interface DerivedFacts {
  readonly asOf: IsoDate;
  /** Completed years of age on `asOf`. */
  readonly ageYears?: number;
  /** Total days of legal residence after de-duplicating overlapping periods. */
  readonly legalResidenceDaysTotal?: number;
  /** Start of the unbroken residence run that includes `asOf`, if residence is current. */
  readonly continuousLegalResidenceSince?: IsoDate;
  /** Inclusive length of that unbroken run, in days. */
  readonly continuousLegalResidenceDays?: number;
  readonly absenceDaysTotal?: number;
  readonly longestAbsenceDays?: number;
  /** Days of authorised, skilled work in Canada inside the three years ending on `asOf`. */
  readonly canadianSkilledWorkDaysLastThreeYears?: number;
  /** Passive income as a multiple of the supplied annual IPREM. */
  readonly passiveIncomeIpremMultiple?: number;
  /** Job-offer salary as a multiple of the supplied annual SMI. */
  readonly jobOfferSalarySmiMultiple?: number;
}

/** What paths in the catalog resolve against. */
export interface EvaluationScope extends ApplicantFacts {
  readonly derived: DerivedFacts;
}

/**
 * Root keys a criterion path may start with. The integrity checker uses this
 * to catch `derived.legalResidenceDaysTotals` before it silently evaluates to
 * `unknown` for every applicant forever.
 */
export const KNOWN_FACT_ROOTS: readonly string[] = [
  'applicantId',
  'nationalities',
  'claimedNationality',
  'claimedNationalityAcquisition',
  'residenceHeldUnderNationality',
  'dateOfBirth',
  'ageYears',
  'targetJurisdiction',
  'currentStatus',
  'statusExpiresOn',
  'applicationLodgedOn',
  'residencePeriods',
  'legalResidenceDays',
  'absences',
  'languageCertifications',
  'examResults',
  'educationLevel',
  'educationField',
  'educationCountry',
  'professionalCredentials',
  'professionalExperienceYears',
  'jobOffer',
  'workExperience',
  'employmentType',
  'remoteWork',
  'passiveIncome',
  'referenceIndices',
  'qualifyingInvestment',
  'criminalRecord',
  'travelHistory',
  'intent',
  'healthInsurance',
  'derived',
];

export const KNOWN_DERIVED_KEYS: readonly string[] = [
  'asOf',
  'ageYears',
  'legalResidenceDaysTotal',
  'continuousLegalResidenceSince',
  'continuousLegalResidenceDays',
  'absenceDaysTotal',
  'longestAbsenceDays',
  'canadianSkilledWorkDaysLastThreeYears',
  'passiveIncomeIpremMultiple',
  'jobOfferSalarySmiMultiple',
];

function annualMinorUnits(amount: MonetaryAmount | undefined): number | undefined {
  if (!amount || amount.minorUnits === undefined || !Number.isFinite(amount.minorUnits)) {
    return undefined;
  }
  if (amount.period === 'monthly') return amount.minorUnits * 12;
  if (amount.period === 'annual') return amount.minorUnits;
  // An amount with no stated period is not an amount we can compare to a threshold.
  return undefined;
}

function sameCurrency(a: string | undefined, b: string | undefined): boolean {
  // A missing index currency is treated as matching, because the index is
  // supplied by us; a missing *applicant* currency is not, because it is
  // supplied by them and guessing it is how a peso becomes a euro.
  if (a === undefined) return false;
  if (b === undefined) return true;
  return a.toUpperCase() === b.toUpperCase();
}

/** Completed years between `from` and `asOf`, by calendar anniversary rather than days/365.25. */
export function completedYears(from: IsoDate, asOf: IsoDate): number {
  if (compareDates(from, asOf) > 0) return 0;
  let years = 0;
  // Anniversaries are cheap to walk and exact; a 150-iteration ceiling is
  // beyond any human lifespan and stops a corrupt date from spinning forever.
  while (years < 150 && compareDates(addYears(from, years + 1), asOf) <= 0) years++;
  return years;
}

/**
 * The three-year lookback used by Canadian Experience Class, as a closed range.
 *
 * `addYears(asOf, -3)` lands on the same calendar day three years earlier; that
 * day is *outside* the window, so the window opens the day after. Getting this
 * wrong by one day is exactly the kind of error that turns 365 days of
 * qualifying experience into 364.
 */
export function threeYearLookback(asOf: IsoDate): DateRange {
  return dateRange(addDays(addYears(asOf, -3), 1), asOf);
}

/**
 * Compute {@link DerivedFacts}. Pure, total, and safe on adversarial input:
 * an inverted `DateRange` or a non-finite number yields absence, never a throw.
 */
export function deriveFacts(facts: ApplicantFacts, asOf: IsoDate): DerivedFacts {
  const validRanges = (ranges: readonly DateRange[] | undefined): DateRange[] =>
    (ranges ?? []).filter((r) => r && compareDates(r.start, r.end) <= 0);

  const residence = validRanges(facts.residencePeriods);
  const mergedResidence = mergeRanges(residence);

  let legalResidenceDaysTotal: number | undefined;
  if (facts.residencePeriods !== undefined) {
    legalResidenceDaysTotal = totalDays(mergedResidence);
  } else if (facts.legalResidenceDays !== undefined && Number.isFinite(facts.legalResidenceDays)) {
    legalResidenceDaysTotal = facts.legalResidenceDays;
  }

  // Residence is "current" only when an unbroken run covers `asOf`. Spanish
  // art. 22.3 requires residence immediately prior to the application, and a
  // person who left two years ago has a day count but not a qualifying one.
  const currentRun = mergedResidence.find((r) => rangeContains(r, asOf));
  const continuousLegalResidenceSince = currentRun?.start;
  const continuousLegalResidenceDays =
    currentRun === undefined ? undefined : diffDays(currentRun.start, asOf) + 1;

  const absences = mergeRanges(validRanges(facts.absences));
  const absenceDaysTotal = facts.absences === undefined ? undefined : totalDays(absences);
  const longestAbsenceDays =
    facts.absences === undefined
      ? undefined
      : absences.reduce((max, r) => Math.max(max, rangeLengthDays(r)), 0);

  let canadianSkilledWorkDaysLastThreeYears: number | undefined;
  if (facts.workExperience !== undefined) {
    const window = threeYearLookback(asOf);
    const qualifying: DateRange[] = [];
    const canada = 'CA' as CountryCode;
    for (const w of facts.workExperience) {
      if (w.country !== canada) continue;
      if (w.authorized === false) continue;
      const isSkilled = w.skilled === true || (w.nocTeer !== undefined && w.nocTeer <= 3);
      if (!isSkilled) continue;
      if (!w.period || compareDates(w.period.start, w.period.end) > 0) continue;
      const clipped = intersectRanges(w.period, window);
      if (clipped) qualifying.push(clipped);
    }
    // Concurrent jobs must not double-count: two half-time roles over the same
    // six months are six months of calendar experience, not twelve.
    canadianSkilledWorkDaysLastThreeYears = totalDays(qualifying);
  }

  let passiveIncomeIpremMultiple: number | undefined;
  const passiveAnnual = annualMinorUnits(facts.passiveIncome);
  const iprem = facts.referenceIndices?.ipremAnnualMinorUnits;
  if (
    passiveAnnual !== undefined &&
    iprem !== undefined &&
    iprem > 0 &&
    sameCurrency(facts.passiveIncome?.currency, facts.referenceIndices?.currency)
  ) {
    passiveIncomeIpremMultiple = passiveAnnual / iprem;
  }

  let jobOfferSalarySmiMultiple: number | undefined;
  const salary = facts.jobOffer?.annualSalaryMinorUnits;
  const smi = facts.referenceIndices?.smiAnnualMinorUnits;
  if (
    salary !== undefined &&
    Number.isFinite(salary) &&
    smi !== undefined &&
    smi > 0 &&
    sameCurrency(facts.jobOffer?.currency, facts.referenceIndices?.currency)
  ) {
    jobOfferSalarySmiMultiple = salary / smi;
  }

  const ageYears =
    facts.dateOfBirth !== undefined
      ? completedYears(facts.dateOfBirth, asOf)
      : facts.ageYears !== undefined && Number.isFinite(facts.ageYears)
        ? facts.ageYears
        : undefined;

  return {
    asOf,
    ageYears,
    legalResidenceDaysTotal,
    continuousLegalResidenceSince,
    continuousLegalResidenceDays,
    absenceDaysTotal,
    longestAbsenceDays,
    canadianSkilledWorkDaysLastThreeYears,
    passiveIncomeIpremMultiple,
    jobOfferSalarySmiMultiple,
  };
}

/** Facts plus their derivations, ready for path resolution. */
export function evaluationScope(facts: ApplicantFacts, asOf: IsoDate): EvaluationScope {
  return { ...facts, derived: deriveFacts(facts, asOf) };
}
