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
