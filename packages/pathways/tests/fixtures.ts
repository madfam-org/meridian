/**
 * Shared fixtures. Entirely fictional people — this repository is public and
 * nothing here may resemble a real applicant's record.
 */

import { countryCode, dateRange, isoDate, type CountryCode, type IsoDate } from '@meridian/core';
import type { ApplicantFacts } from '../src/facts.js';

export const MX: CountryCode = countryCode('MX');
export const IT: CountryCode = countryCode('IT');
export const ES: CountryCode = countryCode('ES');
export const CA: CountryCode = countryCode('CA');
export const US: CountryCode = countryCode('US');
export const BR: CountryCode = countryCode('BR');

/** The assessment date every test uses unless it is specifically testing another one. */
export const TODAY: IsoDate = isoDate('2026-07-25');

export const d = (s: string): IsoDate => isoDate(s);

/**
 * A Mexican national who satisfies every blocking criterion of the two-year
 * reduced-residency route.
 */
export const mexicanTwoYearResident: ApplicantFacts = {
  applicantId: 'fixture-mx-two-year',
  nationalities: [MX],
  claimedNationality: MX,
  claimedNationalityAcquisition: 'by_origin',
  residenceHeldUnderNationality: MX,
  dateOfBirth: d('1990-05-14'),
  targetJurisdiction: ES,
  currentStatus: 'resident',
  residencePeriods: [dateRange(d('2024-01-01'), TODAY)],
  examResults: [{ code: 'CCSE', passed: true, takenOn: d('2026-03-01') }],
  criminalRecord: {
    certificates: [
      { jurisdiction: ES, clear: true, issuedOn: d('2026-06-01') },
      { jurisdiction: MX, clear: true, issuedOn: d('2026-06-01'), apostilled: true },
    ],
  },
};

/**
 * The same person, except she also holds Italian nationality and was admitted
 * to Spain — and holds residence — as an EU citizen. The two-year reduction
 * must not follow the Mexican passport she did not enter on.
 */
export const italianMexicanEnteredOnItalianPassport: ApplicantFacts = {
  ...mexicanTwoYearResident,
  applicantId: 'fixture-it-mx-dual',
  nationalities: [IT, MX],
  claimedNationality: MX,
  residenceHeldUnderNationality: IT,
};

/** The same profile with no residence record at all — only a self-reported day count. */
export const mexicanWithUnknownResidenceDays: ApplicantFacts = {
  applicantId: 'fixture-mx-unknown-residence',
  nationalities: [MX],
  claimedNationality: MX,
  claimedNationalityAcquisition: 'by_origin',
  residenceHeldUnderNationality: MX,
  dateOfBirth: d('1990-05-14'),
  targetJurisdiction: ES,
  currentStatus: 'resident',
  legalResidenceDays: 900,
  examResults: [{ code: 'CCSE', passed: true }],
  criminalRecord: {
    certificates: [
      { jurisdiction: ES, clear: true },
      { jurisdiction: MX, clear: true },
    ],
  },
};

/** A Mexican engineer with a Canadian job offer under a listed CUSMA profession. */
export const cusmaEngineer: ApplicantFacts = {
  applicantId: 'fixture-cusma-engineer',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: CA,
  educationLevel: 'bachelor',
  educationField: 'mechanical engineering',
  jobOffer: {
    employerCountry: CA,
    occupationTaxonomy: 'cusma_appendix_2',
    occupationCode: 'engineer',
    writtenOffer: true,
    selfEmployment: false,
    fullTime: true,
  },
  intent: { temporary: true },
};

/** Identical, but the offer is for a management consultant. */
export const cusmaManagementConsultant: ApplicantFacts = {
  ...cusmaEngineer,
  applicantId: 'fixture-cusma-management-consultant',
  jobOffer: { ...cusmaEngineer.jobOffer, occupationCode: 'management_consultant' },
};

/**
 * Somebody in Spain without authorisation — the population every *arraigo*
 * route is written for.
 *
 * `currentStatus: 'irregular'` is never inferred anywhere in this engine; it is
 * only ever recorded because a person said so. The residence periods a lawful
 * applicant would carry are deliberately absent: an arraigo applicant's time in
 * Spain is physical presence, which is not the same fact and which this engine
 * does not hold.
 */
export const irregularInSpain: ApplicantFacts = {
  applicantId: 'fixture-es-irregular',
  nationalities: [MX],
  claimedNationality: MX,
  dateOfBirth: d('1992-02-29'),
  targetJurisdiction: ES,
  currentStatus: 'irregular',
  absences: [],
  criminalRecord: {
    certificates: [{ jurisdiction: MX, clear: true, issuedOn: d('2026-05-01'), apostilled: true }],
  },
  referenceIndices: { ipremAnnualMinorUnits: 800_000, smiAnnualMinorUnits: 1_618_000, currency: 'EUR' },
};

/** A Mexican national with a written full-time offer from a Spanish employer. */
export const spanishJobOffer: ApplicantFacts = {
  applicantId: 'fixture-es-cuenta-ajena',
  nationalities: [MX],
  claimedNationality: MX,
  dateOfBirth: d('1994-08-03'),
  targetJurisdiction: ES,
  currentStatus: 'none',
  educationLevel: 'bachelor',
  professionalExperienceYears: 6,
  jobOffer: {
    employerName: 'Fixture Employer',
    employerCountry: ES,
    writtenOffer: true,
    selfEmployment: false,
    fullTime: true,
    durationMonths: 24,
    annualSalaryMinorUnits: 2_400_000,
    currency: 'EUR',
  },
  referenceIndices: { smiAnnualMinorUnits: 1_618_000, currency: 'EUR' },
  criminalRecord: {
    certificates: [
      { jurisdiction: ES, clear: true },
      { jurisdiction: MX, clear: true },
    ],
  },
};

/** A CEC candidate with just over a year of full-time TEER 1 work in Canada. */
export const cecCandidate: ApplicantFacts = {
  applicantId: 'fixture-cec',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: CA,
  currentStatus: 'worker',
  educationLevel: 'bachelor',
  workExperience: [
    {
      country: CA,
      period: dateRange(d('2025-06-01'), TODAY),
      occupationTaxonomy: 'noc_2021',
      nocTeer: 1,
      fullTime: true,
      authorized: true,
    },
  ],
  languageCertifications: [{ language: 'en', framework: 'clb', level: '8' }],
  intent: { intendsToResideOutsideQuebec: true },
};

// ---------------------------------------------------------------------------
// United States
//
// The Mexico-to-United States corridor is the largest bilateral corridor in the
// world, and the US block of the catalog is the first one where most records
// cannot reach a verdict at all: the facts model holds nothing about a
// petitioner, a sponsor, a labor certification, or the manner of somebody's
// last entry, so those criteria escalate to a person rather than guessing. The
// fixtures below are therefore built to exercise the routes that *can* decide —
// TN, B-1/B-2, the naturalisation residence arithmetic — and to prove that the
// ones that cannot say so out loud.
// ---------------------------------------------------------------------------

/**
 * A Mexican engineer with a written full-time offer from a United States
 * employer, under a profession listed in USMCA Appendix 2.
 *
 * Deliberately the mirror of {@link cusmaEngineer}: the substantive test is the
 * same on both sides of the treaty and 8 CFR 214.6(c) reproduces Appendix 2
 * verbatim, so a fixture that differed in anything but the destination would be
 * testing the fixture rather than the rule.
 */
export const usTnEngineer: ApplicantFacts = {
  applicantId: 'fixture-us-tn-engineer',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: US,
  educationLevel: 'bachelor',
  educationField: 'mechanical engineering',
  jobOffer: {
    employerName: 'Fixture Employer',
    employerCountry: US,
    occupationTaxonomy: 'cusma_appendix_2',
    occupationCode: 'engineer',
    writtenOffer: true,
    selfEmployment: false,
    fullTime: true,
  },
  intent: { temporary: true },
};

/**
 * A lawful permanent resident with an unbroken five-and-a-half-year residence
 * run and no absences at all.
 *
 * `absences: []` is a positive assertion that there were none, which is what
 * makes the physical-presence and continuity criteria decidable; leaving it
 * absent would make them `unknown`, and one of the tests below relies on
 * exactly that difference.
 */
export const usLawfulPermanentResident: ApplicantFacts = {
  applicantId: 'fixture-us-lpr',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: US,
  currentStatus: 'permanent_resident',
  dateOfBirth: d('1985-03-10'),
  residencePeriods: [dateRange(d('2019-01-01'), TODAY)],
  absences: [],
  criminalRecord: { selfDeclaredClear: true },
};

/**
 * Somebody present in the United States without authorisation, with one
 * recorded overstay and no removal.
 *
 * `currentStatus: 'irregular'` is never inferred anywhere in this engine — it
 * is only ever recorded because a person said so. Note what this fixture still
 * does *not* say: how they last entered, when they entered, and how long the
 * unlawful presence has run. Those are the facts the § 1182(a)(9) bars turn on,
 * and their absence is the reason the screening records escalate.
 */
export const usUnlawfullyPresent: ApplicantFacts = {
  applicantId: 'fixture-us-unlawful-presence',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: US,
  currentStatus: 'irregular',
  dateOfBirth: d('1992-02-29'),
  travelHistory: { priorOverstays: 1, priorRemovals: 0, priorRefusals: 0 },
  criminalRecord: { selfDeclaredClear: true },
};

/**
 * A Mexican national seeking permanent residence through a relative, with
 * everything Meridian can hold about *them* recorded and nothing about the
 * petitioner — because there is nowhere to put it.
 */
export const usSponsoredRelative: ApplicantFacts = {
  applicantId: 'fixture-us-sponsored-relative',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: US,
  dateOfBirth: d('1990-05-14'),
  currentStatus: 'none',
  criminalRecord: { selfDeclaredClear: true },
};

/**
 * A Mexican national with a written full-time offer from a United States
 * employer and six years in the field — the most an employment-based record can
 * currently be told.
 */
export const usEmploymentSponsored: ApplicantFacts = {
  applicantId: 'fixture-us-employment-sponsored',
  nationalities: [MX],
  claimedNationality: MX,
  targetJurisdiction: US,
  educationLevel: 'bachelor',
  professionalExperienceYears: 6,
  jobOffer: {
    employerName: 'Fixture Employer',
    employerCountry: US,
    writtenOffer: true,
    fullTime: true,
    selfEmployment: false,
  },
};
