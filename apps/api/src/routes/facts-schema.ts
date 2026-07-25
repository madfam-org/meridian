/**
 * The applicant-facts request schema.
 *
 * A direct transcription of `ApplicantFacts` in `@meridian/pathways`, and it
 * matters that it is a transcription rather than a loosening. Two properties are
 * carried through exactly:
 *
 * **Everything except `applicantId` is optional.** An engine that treats a
 * missing field as a negative tells someone they are ineligible because they
 * have not finished filling in a form. The evaluator's three-valued logic
 * depends on absence being distinguishable from a recorded "no".
 *
 * **An empty array is not an absent one.** `criminalRecord.certificates: []`
 * asserts "I hold no police certificates", which is knowable and yields false.
 * `certificates` absent asserts nothing and yields unknown. So no field here has
 * a default, and none is coerced.
 *
 * `.strict()` is applied at the top level: a caller who sends `nationality`
 * instead of `nationalities` gets an error rather than an evaluation quietly run
 * against a fact nobody supplied.
 */

import { z } from 'zod';

import { countryCodeSchema, dateRangeSchema, isoDateSchema } from '../http/schemas.js';

const languageCertificationSchema = z.object({
  language: z.string().min(2).max(3).optional(),
  /** Which scale `level` is on. Comparing a CEFR B2 to a CLB 7 is meaningless. */
  framework: z.enum(['cefr', 'clb', 'nclc', 'other']).optional(),
  level: z.string().min(1).max(20).optional(),
  issuer: z.string().min(1).max(120).optional(),
  awardedOn: isoDateSchema.optional(),
  expiresOn: isoDateSchema.optional(),
});

const examResultSchema = z.object({
  code: z.string().min(1).max(60).optional(),
  passed: z.boolean().optional(),
  takenOn: isoDateSchema.optional(),
  expiresOn: isoDateSchema.optional(),
});

const professionalCredentialSchema = z.object({
  kind: z.enum(['degree', 'diploma', 'licence', 'certification', 'membership']).optional(),
  title: z.string().min(1).max(200).optional(),
  level: z.string().min(1).max(60).optional(),
  field: z.string().min(1).max(200).optional(),
  issuingCountry: countryCodeSchema.optional(),
  issuedOn: isoDateSchema.optional(),
  issuer: z.string().min(1).max(200).optional(),
  verified: z.boolean().optional(),
});

const occupationTaxonomySchema = z.enum(['cusma_appendix_2', 'noc_2021', 'cno_2011', 'other']);

const jobOfferSchema = z.object({
  employerName: z.string().min(1).max(200).optional(),
  employerCountry: countryCodeSchema.optional(),
  occupationTaxonomy: occupationTaxonomySchema.optional(),
  occupationCode: z.string().min(1).max(40).optional(),
  nocTeer: z.number().int().min(0).max(5).optional(),
  annualSalaryMinorUnits: z.number().int().min(0).optional(),
  /** ISO 4217. A threshold in euros cannot be met in another currency. */
  currency: z.string().length(3).optional(),
  fullTime: z.boolean().optional(),
  durationMonths: z.number().int().min(0).max(600).optional(),
  writtenOffer: z.boolean().optional(),
  selfEmployment: z.boolean().optional(),
});

const workExperienceSchema = z.object({
  country: countryCodeSchema.optional(),
  period: dateRangeSchema.optional(),
  occupationTaxonomy: occupationTaxonomySchema.optional(),
  occupationCode: z.string().min(1).max(40).optional(),
  nocTeer: z.number().int().min(0).max(5).optional(),
  fullTime: z.boolean().optional(),
  /** Unauthorised work counts toward nothing and is itself a risk factor. Recorded, not dropped. */
  authorized: z.boolean().optional(),
  skilled: z.boolean().optional(),
});

const monetaryAmountSchema = z.object({
  minorUnits: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  period: z.enum(['annual', 'monthly']).optional(),
});

const referenceIndicesSchema = z.object({
  /**
   * Supplied by the caller for the relevant year, never hardcoded. Spain's
   * economic-means thresholds are multiples of IPREM and SMI, both re-set
   * annually by decree; a euro figure baked into a catalog is a figure that is
   * wrong by next January.
   */
  ipremAnnualMinorUnits: z.number().int().min(0).optional(),
  smiAnnualMinorUnits: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
});

const criminalRecordSchema = z.object({
  selfDeclaredClear: z.boolean().optional(),
  certificates: z
    .array(
      z.object({
        jurisdiction: countryCodeSchema.optional(),
        clear: z.boolean().optional(),
        issuedOn: isoDateSchema.optional(),
        apostilled: z.boolean().optional(),
      }),
    )
    .max(50)
    .optional(),
});

const travelHistorySchema = z.object({
  priorRefusals: z.number().int().min(0).optional(),
  priorOverstays: z.number().int().min(0).optional(),
  priorRemovals: z.number().int().min(0).optional(),
  visitedCountries: z.array(countryCodeSchema).max(250).optional(),
  lastEntryOn: isoDateSchema.optional(),
});

const qualifyingInvestmentSchema = z.object({
  kind: z
    .enum(['real_estate', 'public_debt', 'shares', 'bank_deposit', 'business_project'])
    .optional(),
  minorUnits: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  madeOn: isoDateSchema.optional(),
});

const intentSchema = z.object({
  temporary: z.boolean().optional(),
  intendsToResideOutsideQuebec: z.boolean().optional(),
  noEconomicActivityInTargetState: z.boolean().optional(),
  declaredPurpose: z.string().min(1).max(500).optional(),
});

const healthInsuranceSchema = z.object({
  hasPrivateCoverage: z.boolean().optional(),
  insurerAuthorizedIn: countryCodeSchema.optional(),
  coversFullPeriod: z.boolean().optional(),
  withoutCopayment: z.boolean().optional(),
});

const remoteWorkSchema = z.object({
  employerOutsideTargetState: z.boolean().optional(),
  targetStateActivityPercent: z.number().min(0).max(100).optional(),
  relationshipMonths: z.number().int().min(0).max(1200).optional(),
  employerTradingMonths: z.number().int().min(0).max(2400).optional(),
});

export const applicantFactsSchema = z
  .object({
    applicantId: z.string().min(1).max(128),

    nationalities: z.array(countryCodeSchema).max(10).optional(),
    /** The nationality applied under. Must be one actually held. */
    claimedNationality: countryCodeSchema.optional(),
    /** The nationality admission and residence were granted under. Not the same question. */
    residenceHeldUnderNationality: countryCodeSchema.optional(),

    dateOfBirth: isoDateSchema.optional(),
    ageYears: z.number().int().min(0).max(130).optional(),

    targetJurisdiction: countryCodeSchema.optional(),
    currentStatus: z
      .enum([
        'none',
        'visitor',
        'student',
        'worker',
        'resident',
        'permanent_resident',
        'citizen',
        'asylum_seeker',
        'refugee',
        'irregular',
      ])
      .optional(),
    statusExpiresOn: isoDateSchema.optional(),
    applicationLodgedOn: isoDateSchema.optional(),

    residencePeriods: z.array(dateRangeSchema).max(200).optional(),
    legalResidenceDays: z.number().int().min(0).optional(),
    absences: z.array(dateRangeSchema).max(500).optional(),

    languageCertifications: z.array(languageCertificationSchema).max(20).optional(),
    examResults: z.array(examResultSchema).max(20).optional(),

    educationLevel: z.string().min(1).max(60).optional(),
    educationField: z.string().min(1).max(200).optional(),
    educationCountry: countryCodeSchema.optional(),
    professionalCredentials: z.array(professionalCredentialSchema).max(30).optional(),
    professionalExperienceYears: z.number().min(0).max(80).optional(),

    jobOffer: jobOfferSchema.optional(),
    workExperience: z.array(workExperienceSchema).max(100).optional(),
    employmentType: z
      .enum([
        'employee',
        'self_employed',
        'contractor',
        'company_director',
        'unemployed',
        'retired',
        'student',
      ])
      .optional(),
    remoteWork: remoteWorkSchema.optional(),

    passiveIncome: monetaryAmountSchema.optional(),
    referenceIndices: referenceIndicesSchema.optional(),
    qualifyingInvestment: qualifyingInvestmentSchema.optional(),

    criminalRecord: criminalRecordSchema.optional(),
    travelHistory: travelHistorySchema.optional(),
    intent: intentSchema.optional(),
    healthInsurance: healthInsuranceSchema.optional(),
  })
  .strict();

export type ApplicantFactsInput = z.infer<typeof applicantFactsSchema>;
