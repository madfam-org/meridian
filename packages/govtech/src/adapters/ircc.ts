/**
 * Immigration, Refugees and Citizenship Canada.
 *
 * Start with what is *not* here, because it is the more useful half.
 *
 * There is no open public API for the Employer Portal, for applicant
 * submission, or for reading application status. Those three capabilities are
 * declared `not_implemented` — deliberately a different state from
 * `not_provisioned`, because no credential exists that would turn them on.
 * Automating them would mean driving the department's own web interface with a
 * script, and that is not merely an engineering task:
 *
 *  - it is a terms-of-service question about the account being driven, which
 *    someone has to answer in writing before a line of code is worth writing;
 *  - it is a fragility risk that fails silently. A form gains a field, the
 *    script fills the old shape, and the submission is wrong rather than absent.
 *    Nobody finds out until a refusal letter arrives;
 *  - it makes the platform the actor in a proceeding that is supposed to be the
 *    applicant's or the employer's own.
 *
 * What *is* implementable, and is implemented:
 *
 *  - **Offer-of-employment package validation.** Employers assemble this data
 *    themselves and get it wrong in the same handful of ways every time. Shape
 *    validation catches those before anyone pays a fee.
 *  - **A decomposed processing-timeline estimate.** The headline processing time
 *    is the single most misread number in corporate mobility, because the clock
 *    it describes starts on receipt of a *complete* application — not when the
 *    file is opened. An estimate that quotes the headline figure to an employer
 *    plans a start date that cannot happen. This estimator refuses to produce one
 *    number: it produces the parts, says who owns each clock, and sums them.
 *  - **An employer portal handoff**, so the refusal to automate has a path
 *    beside it.
 *
 * Everything here is `information` or `assessment` on the disclosure boundary.
 * Nothing ranks exemption codes, recommends a stream, or predicts an outcome —
 * that is `advice`, and IRPA s. 91 is the reason the distinction is enforced by
 * the type rather than by a style guide.
 */

import type { CountryCode, Disclosable, IsoDate, Result } from '@meridian/core';
import {
  MeridianError,
  addDays,
  countryCode,
  dateRange,
  diffDays,
  disclosable,
  err,
  isIsoDate,
  ok,
} from '@meridian/core';
import type { DateRange } from '@meridian/core';
import { z } from 'zod';
import type { AdapterContext, GovTechAdapter, GovernmentOperationProbe } from '../adapter.js';
import { requireCapability } from '../adapter.js';
import type { Capability, CapabilityReport } from '../capability.js';
import { capability, capabilityReport } from '../capability.js';
import type { CredentialFree } from '../credential-guard.js';
import { guardCredentialFree } from '../credential-guard.js';
import type { AssistedHandoff, HandoffDocument, HandoffField } from '../handoff.js';
import { buildHandoff } from '../handoff.js';
import {
  CA_IRCC_BIOMETRICS,
  CA_IRCC_EMPLOYER_PORTAL,
  CA_IRCC_PROCESSING_TIMES,
  CA_IRCC_SECURE_ACCOUNT,
  CA_IRPA_S91,
  CA_IRPR_EMPLOYER_OBLIGATIONS,
  CA_NOC_2021,
} from '../citations.js';

export const IRCC_ADAPTER_ID = 'ca-ircc';

const CA: CountryCode = countryCode('CA');

export const IRCC_CAPABILITY = {
  offerValidation: 'ircc.offer_of_employment_validation',
  timelineEstimate: 'ircc.processing_timeline_estimate',
  employerPortalHandoff: 'ircc.employer_portal_handoff',
  employerPortalSubmission: 'ircc.employer_portal_submission',
  applicantSubmission: 'ircc.applicant_submission',
  statusPolling: 'ircc.application_status_polling',
  credentialCustody: 'ircc.credential_custody',
} as const;

/* -------------------------------------------------------------------------- */
/* Offer of employment                                                        */
/* -------------------------------------------------------------------------- */

/** The 13 provinces and territories. A closed set, unlike almost everything else here. */
const PROVINCE_CODES: ReadonlySet<string> = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
]);

const addressSchema = z.object({
  line1: z.string().min(1),
  city: z.string().min(1),
  provinceCode: z.string().min(1),
  postalCode: z.string().min(1),
});

const offerSchema = z.object({
  employer: z.object({
    legalName: z.string().min(1),
    /** CRA business number: nine digits, optionally with a program account suffix. */
    businessNumber: z.string().min(1),
    address: addressSchema,
    contactName: z.string().min(1),
    contactEmail: z.string().min(1),
  }),
  foreignNational: z.object({
    givenNames: z.string().min(1),
    familyName: z.string().min(1),
    dateOfBirth: z.string().min(1),
    citizenship: z.string().min(1),
    travelDocumentNumber: z.string().min(1),
  }),
  position: z.object({
    title: z.string().min(1),
    nocCode: z.string().min(1),
    mainDuties: z.array(z.string().min(1)).min(1),
    workLocation: addressSchema,
    hoursPerWeek: z.number(),
    wage: z.object({
      amount: z.number(),
      currency: z.string().min(1),
      unit: z.enum(['hour', 'year']),
    }),
    startOn: z.string().min(1),
    endOn: z.string().min(1).optional(),
  }),
  exemption: z.object({
    /** e.g. a letter followed by two digits. The table itself is IRCC practice. */
    code: z.string().min(1),
    rationale: z.string().min(1),
  }),
});

export type OfferOfEmployment = z.infer<typeof offerSchema>;

/**
 * Severity, and specifically why there are three rather than two.
 *
 * `needs_human_verification` is the important one. There are checks this package
 * genuinely cannot make — whether a wage meets the prevailing wage for the
 * occupation and region, whether the chosen exemption code is the right one for
 * the facts — and the honest output is to name them rather than to stay silent
 * and let their absence read as approval.
 */
export type OfferFindingSeverity = 'error' | 'warning' | 'needs_human_verification';

export interface OfferFinding {
  readonly severity: OfferFindingSeverity;
  /** Dotted path into the package, e.g. `position.nocCode`. */
  readonly path: string;
  readonly message: string;
  readonly citationIds: readonly string[];
}

export interface OfferOfEmploymentValidation {
  /**
   * No `error` findings — the package is *shaped* correctly and can be carried
   * to the portal.
   *
   * It is not a prediction that the offer will be accepted, and nothing in this
   * package produces one. Predicting an outcome is `advice`.
   */
  readonly ready: boolean;
  readonly findings: readonly OfferFinding[];
  readonly humanVerificationRequired: boolean;
  readonly checkedOn: IsoDate;
  /** Inclusive length of the offer in days, when both dates are present and valid. */
  readonly offerDurationDays: number | null;
}

function finding(
  severity: OfferFindingSeverity,
  path: string,
  message: string,
  citationIds: readonly string[],
): OfferFinding {
  return Object.freeze({ severity, path, message, citationIds });
}

const NOC_RE = /^\d{5}$/;
const BUSINESS_NUMBER_RE = /^\d{9}([A-Z]{2}\d{4})?$/;
const EXEMPTION_CODE_RE = /^[A-Z]\d{2}$/;
const TRAVEL_DOCUMENT_RE = /^[A-Z0-9]{5,15}$/;

function checkSemantics(offer: OfferOfEmployment, asOf: IsoDate): {
  findings: OfferFinding[];
  offerDurationDays: number | null;
} {
  const findings: OfferFinding[] = [];
  let offerDurationDays: number | null = null;

  const bn = offer.employer.businessNumber.replace(/[\s-]/g, '').toUpperCase();
  if (!BUSINESS_NUMBER_RE.test(bn)) {
    findings.push(
      finding(
        'error',
        'employer.businessNumber',
        'The business number should be the nine-digit CRA business number, optionally followed by a ' +
          'two-letter program identifier and a four-digit reference.',
        [CA_IRCC_EMPLOYER_PORTAL.id],
      ),
    );
  }

  if (!PROVINCE_CODES.has(offer.employer.address.provinceCode.toUpperCase())) {
    findings.push(
      finding('error', 'employer.address.provinceCode', 'Not a Canadian province or territory code.', [
        CA_IRCC_EMPLOYER_PORTAL.id,
      ]),
    );
  }

  const workProvince = offer.position.workLocation.provinceCode.toUpperCase();
  if (!PROVINCE_CODES.has(workProvince)) {
    findings.push(
      finding('error', 'position.workLocation.provinceCode', 'Not a Canadian province or territory code.', [
        CA_IRCC_EMPLOYER_PORTAL.id,
      ]),
    );
  } else if (workProvince === 'QC') {
    findings.push(
      finding(
        'needs_human_verification',
        'position.workLocation.provinceCode',
        'The position is located in Quebec. Some streams engage a separate provincial process in addition ' +
          'to the federal one; confirm whether it applies to the selected exemption before assuming the ' +
          'federal steps are the whole path.',
        [CA_IRCC_EMPLOYER_PORTAL.id],
      ),
    );
  }

  const noc = offer.position.nocCode.trim();
  if (!NOC_RE.test(noc)) {
    findings.push(
      finding('error', 'position.nocCode', 'A NOC 2021 code is exactly five digits.', [CA_NOC_2021.id]),
    );
  } else {
    const teerDigit = noc[1];
    if (teerDigit === undefined || teerDigit < '0' || teerDigit > '5') {
      findings.push(
        finding(
          'error',
          'position.nocCode',
          `The second digit of a NOC 2021 code is the TEER category and runs 0-5; this code has ${String(teerDigit)}.`,
          [CA_NOC_2021.id],
        ),
      );
    }
    findings.push(
      finding(
        'needs_human_verification',
        'position.nocCode',
        'The code\'s shape is valid. Whether it correctly describes the duties actually being performed is a ' +
          'human judgement, and a mismatch between duties and code is a compliance exposure for the employer.',
        [CA_NOC_2021.id, CA_IRPR_EMPLOYER_OBLIGATIONS.id],
      ),
    );
  }

  if (!EXEMPTION_CODE_RE.test(offer.exemption.code.trim().toUpperCase())) {
    findings.push(
      finding(
        'error',
        'exemption.code',
        'An LMIA exemption code is a letter followed by two digits.',
        [CA_IRPR_EMPLOYER_OBLIGATIONS.id],
      ),
    );
  }
  findings.push(
    finding(
      'needs_human_verification',
      'exemption.code',
      'The exemption code table is IRCC administrative practice published in its program delivery ' +
        'instructions, and selecting the code for a given set of facts is a legal judgement. This package ' +
        'validates the code\'s shape only and does not choose or rank codes.',
      [CA_IRPR_EMPLOYER_OBLIGATIONS.id, CA_IRPA_S91.id],
    ),
  );

  if (offer.position.hoursPerWeek <= 0 || offer.position.hoursPerWeek > 168) {
    findings.push(
      finding('error', 'position.hoursPerWeek', 'Hours per week must be greater than zero and no more than 168.', [
        CA_IRCC_EMPLOYER_PORTAL.id,
      ]),
    );
  } else if (offer.position.hoursPerWeek < 30) {
    findings.push(
      finding(
        'needs_human_verification',
        'position.hoursPerWeek',
        'The offer is below what is ordinarily treated as full time. Some streams require full-time ' +
          'employment; confirm against the instructions for the selected exemption.',
        [CA_IRCC_EMPLOYER_PORTAL.id],
      ),
    );
  }

  if (offer.position.wage.amount <= 0) {
    findings.push(
      finding('error', 'position.wage.amount', 'The wage must be greater than zero.', [CA_IRCC_EMPLOYER_PORTAL.id]),
    );
  }
  if (offer.position.wage.currency.toUpperCase() !== 'CAD') {
    findings.push(
      finding(
        'warning',
        'position.wage.currency',
        'The wage is not expressed in Canadian dollars. The portal expects the wage actually payable in Canada.',
        [CA_IRCC_EMPLOYER_PORTAL.id],
      ),
    );
  }
  findings.push(
    finding(
      'needs_human_verification',
      'position.wage',
      'Whether this wage meets the prevailing wage for the occupation and region is not encoded in this ' +
        'package. It is a wage-table lookup a human must perform, and it is a frequent cause of refusal.',
      [CA_IRCC_EMPLOYER_PORTAL.id, CA_IRPR_EMPLOYER_OBLIGATIONS.id],
    ),
  );

  if (!isIsoDate(offer.foreignNational.dateOfBirth)) {
    findings.push(
      finding('error', 'foreignNational.dateOfBirth', 'Date of birth must be a YYYY-MM-DD civil date.', [
        CA_IRCC_EMPLOYER_PORTAL.id,
      ]),
    );
  } else if (diffDays(offer.foreignNational.dateOfBirth as IsoDate, asOf) <= 0) {
    findings.push(
      finding('error', 'foreignNational.dateOfBirth', 'Date of birth is not in the past.', [
        CA_IRCC_EMPLOYER_PORTAL.id,
      ]),
    );
  }

  if (!TRAVEL_DOCUMENT_RE.test(offer.foreignNational.travelDocumentNumber.trim().toUpperCase())) {
    findings.push(
      finding(
        'warning',
        'foreignNational.travelDocumentNumber',
        'The travel document number does not look like a passport number (5-15 letters and digits). Check it ' +
          'against the document itself — a transcription error here propagates into every later step.',
        [CA_IRCC_EMPLOYER_PORTAL.id],
      ),
    );
  }

  const startValid = isIsoDate(offer.position.startOn);
  if (!startValid) {
    findings.push(
      finding('error', 'position.startOn', 'Start date must be a YYYY-MM-DD civil date.', [
        CA_IRCC_EMPLOYER_PORTAL.id,
      ]),
    );
  } else if (diffDays(asOf, offer.position.startOn as IsoDate) < 0) {
    findings.push(
      finding(
        'warning',
        'position.startOn',
        'The start date is already in the past. Either the offer is stale or the date is wrong; both are ' +
          'worth resolving before the package is submitted.',
        [CA_IRCC_EMPLOYER_PORTAL.id],
      ),
    );
  }

  if (offer.position.endOn !== undefined) {
    if (!isIsoDate(offer.position.endOn)) {
      findings.push(
        finding('error', 'position.endOn', 'End date must be a YYYY-MM-DD civil date.', [
          CA_IRCC_EMPLOYER_PORTAL.id,
        ]),
      );
    } else if (startValid) {
      const span = diffDays(offer.position.startOn as IsoDate, offer.position.endOn as IsoDate);
      if (span < 0) {
        findings.push(
          finding('error', 'position.endOn', 'The end date falls before the start date.', [
            CA_IRCC_EMPLOYER_PORTAL.id,
          ]),
        );
      } else {
        // Inclusive: an offer running 2027-01-01 to 2027-01-01 is one day of
        // employment, not zero. The same convention as DateRange in the core
        // package, and the same trap.
        offerDurationDays = span + 1;
      }
    }
  }

  return { findings, offerDurationDays };
}

/* -------------------------------------------------------------------------- */
/* Processing timeline                                                        */
/* -------------------------------------------------------------------------- */

export type BiometricsPosture =
  | { readonly required: false; readonly reason: string }
  | {
      readonly required: true;
      /** Days from application to the biometrics instruction letter. */
      readonly instructionLetterDays: number;
      /** Days from the letter to an appointment the applicant can actually get. */
      readonly appointmentLeadDays: number;
      /** Days from collection to the result reaching the file. */
      readonly collectionToFileDays: number;
    };

export interface ProcessingTimelineInput {
  /** Free text naming the stream, e.g. 'Work permit, LMIA-exempt, applied from outside Canada'. */
  readonly stream: string;
  readonly asOf: IsoDate;
  /** The figure read from IRCC's published tool, in days. */
  readonly publishedProcessingDays: number;
  /** The civil date that figure was read. Published times are republished frequently. */
  readonly publishedOn: IsoDate;
  /**
   * Days still needed to reach a *complete* application — outstanding documents,
   * translations, signatures. This is the component that is invisible in the
   * headline figure and is usually the largest.
   */
  readonly outstandingCompletenessDays: number;
  readonly biometrics: BiometricsPosture;
  /** Passport submission, document issuance, travel — after a decision, before day one. */
  readonly postDecisionDays: number;
  /** The date the business wants the person working, when there is one. */
  readonly targetStartOn?: IsoDate;
}

export type TimelineComponentId =
  | 'application_completeness'
  | 'biometrics'
  | 'published_processing'
  | 'post_decision';

/**
 * Who is actually waiting on whom.
 *
 * Included because the most common conversation about a delayed file is an
 * employer asking why the government is slow when the file has been sitting on
 * an outstanding translation for three weeks.
 */
export type ClockOwner = 'applicant' | 'employer' | 'authority';

export interface TimelineComponent {
  readonly id: TimelineComponentId;
  readonly label: string;
  readonly days: number;
  readonly clockOwner: ClockOwner;
  readonly explanation: string;
  readonly citationIds: readonly string[];
}

export interface TimelineMilestone {
  readonly id: 'application_complete' | 'biometrics_complete' | 'decision' | 'ready_to_start';
  readonly label: string;
  readonly on: IsoDate;
}

export interface TargetStartAssessment {
  readonly targetStartOn: IsoDate;
  readonly earliestReadyOn: IsoDate;
  /** Days of slack. Negative means the target is earlier than the estimate supports. */
  readonly slackDays: number;
  readonly met: boolean;
}

export interface ProcessingTimelineEstimate {
  readonly stream: string;
  readonly asOf: IsoDate;
  /** Always all four, including zero-day components, so the decomposition is legible. */
  readonly components: readonly TimelineComponent[];
  /** Elapsed days. Equals the sum of the components, by construction. */
  readonly totalDays: number;
  /**
   * The closed civil-date range the process occupies, inclusive of today.
   *
   * Its length is `totalDays + 1`, which is not a bug. `totalDays` is elapsed
   * duration; the range counts calendar days occupied, and a process of zero
   * elapsed days still occupies today. Conflating the two is the off-by-one that
   * turns a plan into a missed start date.
   */
  readonly elapsedRange: DateRange;
  readonly milestones: readonly TimelineMilestone[];
  readonly publishedFigureAgeDays: number;
  readonly targetStart: TargetStartAssessment | null;
  readonly caveats: readonly string[];
}

function positiveInteger(value: number, label: string): MeridianError | null {
  if (!Number.isInteger(value) || value < 0) {
    return new MeridianError('INVALID_INPUT', `${label} must be a whole number of days, zero or more; got ${value}.`);
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Handoff input                                                              */
/* -------------------------------------------------------------------------- */

export interface IrccEmployerPortalHandoffInput {
  readonly matterId: string;
  readonly employerLegalName: string;
  readonly employerBusinessNumber: string;
  readonly positionTitle: string;
  readonly nocCode: string;
  readonly startOn: IsoDate;
  readonly endOn?: IsoDate;
  readonly generatedOn: IsoDate;
}

const EMPLOYER_ACCOUNT_DOCUMENT: HandoffDocument = Object.freeze({
  id: 'employer-portal-account',
  title: 'Your own Employer Portal account',
  description:
    'Enrolment is done by the employer and the account stays with the employer. Meridian never holds the ' +
    'sign-in credential for it.',
  origin: 'employer',
  originalRequired: false,
});

const VALIDATED_PACKAGE_DOCUMENT: HandoffDocument = Object.freeze({
  id: 'validated-offer-package',
  title: 'The validated offer of employment data package',
  description:
    'Exported from the matter. Every value has already been checked for shape, so the portal session is ' +
    'transcription rather than composition.',
  origin: 'meridian',
  originalRequired: false,
});

const PAYMENT_METHOD_DOCUMENT: HandoffDocument = Object.freeze({
  id: 'employer-payment-method',
  title: 'A payment method for the employer compliance fee, where one is payable',
  description:
    'The amount is published by IRCC and changes; read the current fee at the moment of payment rather than ' +
    'relying on a figure quoted earlier.',
  origin: 'employer',
  originalRequired: false,
});

/* -------------------------------------------------------------------------- */
/* Adapter                                                                    */
/* -------------------------------------------------------------------------- */

export interface IrccAdapter extends GovTechAdapter {
  validateOfferOfEmployment(
    raw: unknown,
    asOf: IsoDate,
  ): Result<Disclosable<OfferOfEmploymentValidation>, MeridianError>;
  estimateProcessingTimeline<T extends ProcessingTimelineInput>(
    input: T & CredentialFree<T>,
  ): Result<Disclosable<ProcessingTimelineEstimate>, MeridianError>;
  buildEmployerPortalHandoff<T extends IrccEmployerPortalHandoffInput>(
    input: T & CredentialFree<T>,
  ): Result<AssistedHandoff, MeridianError>;
}

export function createIrccAdapter(): IrccAdapter {
  const notImplementedReason =
    'IRCC publishes no open application programming interface for this. The only way to automate it would ' +
    'be to drive the department\'s own web interface with a script, which is a terms-of-service question ' +
    'about the account being driven and a fragility risk that fails silently — a form gains a field, the ' +
    'script fills the old shape, and the submission is wrong rather than absent. It is not merely an ' +
    'engineering task and it is not scheduled as one.';

  const describeCapabilities = (ctx: AdapterContext): CapabilityReport => {
    const capabilities: readonly Capability[] = [
      capability({
        id: IRCC_CAPABILITY.offerValidation,
        title: 'Validate an offer-of-employment data package',
        surface: 'local_computation',
        state: 'available',
        reason:
          'Checks the shape and internal consistency of the package the employer will transcribe into the ' +
          'portal, and names the checks a human must still make.',
        citations: [CA_IRCC_EMPLOYER_PORTAL, CA_IRPR_EMPLOYER_OBLIGATIONS, CA_NOC_2021],
      }),
      capability({
        id: IRCC_CAPABILITY.timelineEstimate,
        title: 'Estimate a processing timeline, decomposed',
        surface: 'local_computation',
        state: 'available',
        reason:
          'Decomposes the wait into completeness, biometrics, published processing and post-decision steps, ' +
          'and attributes each to whoever is actually holding it up.',
        citations: [CA_IRCC_PROCESSING_TIMES, CA_IRCC_BIOMETRICS],
      }),
      capability({
        id: IRCC_CAPABILITY.employerPortalHandoff,
        title: 'Build an Employer Portal handoff',
        surface: 'local_computation',
        state: 'available',
        reason: 'Restates the published portal procedure as an ordered package the employer carries themselves.',
        citations: [CA_IRCC_EMPLOYER_PORTAL],
      }),
      capability({
        id: IRCC_CAPABILITY.employerPortalSubmission,
        title: 'Submit an offer of employment through the Employer Portal',
        surface: 'government_system',
        state: 'not_implemented',
        reason: notImplementedReason,
        unblockPath: [
          'Obtain a written answer from IRCC on whether programmatic interaction with the portal is permitted.',
          'If a supported interface is published, implement against that interface rather than the web forms.',
        ],
        alternative: {
          capabilityId: IRCC_CAPABILITY.employerPortalHandoff,
          description:
            'Meridian validates and exports the package; the employer enters it in their own portal session ' +
            'and brings back the offer of employment number.',
        },
        citations: [CA_IRCC_EMPLOYER_PORTAL, CA_IRPR_EMPLOYER_OBLIGATIONS],
      }),
      capability({
        id: IRCC_CAPABILITY.applicantSubmission,
        title: 'Submit an application on the applicant\'s behalf',
        surface: 'government_system',
        state: 'not_implemented',
        reason: notImplementedReason,
        unblockPath: [
          'Obtain a written answer from IRCC on programmatic submission by a third party.',
          'Resolve, separately, who is the authorised representative of record for the submission.',
        ],
        alternative: {
          capabilityId: null,
          description:
            'The applicant submits through their own secure account, or an authorised representative submits ' +
            'in their own name as representative of record. Meridian prepares and validates the package.',
        },
        citations: [CA_IRPA_S91, CA_IRCC_SECURE_ACCOUNT],
      }),
      capability({
        id: IRCC_CAPABILITY.statusPolling,
        title: 'Read application status automatically',
        surface: 'government_system',
        state: 'not_implemented',
        reason: notImplementedReason,
        unblockPath: [
          'Await publication of a supported status interface, or an agreement permitting one.',
        ],
        alternative: {
          capabilityId: null,
          description:
            'The applicant or representative reads status in their own account and records changes against ' +
            'the matter, which keeps the account holder as the source of truth.',
        },
        citations: [CA_IRCC_SECURE_ACCOUNT],
      }),
      capability({
        id: IRCC_CAPABILITY.credentialCustody,
        title: 'Store an applicant\'s or employer\'s secure account credential',
        surface: 'government_system',
        state: 'refused_by_policy',
        reason:
          'Refused permanently. A secure account credential is what a filing is legally attributed to; ' +
          'holding it would make Meridian the actor in someone else\'s proceeding and turn a breach here into ' +
          'a compromised immigration file there.',
        policy: 'no_credential_custody',
        alternative: {
          capabilityId: IRCC_CAPABILITY.employerPortalHandoff,
          description:
            'The account holder signs in themselves and transcribes a package Meridian has already validated.',
        },
        citations: [CA_IRCC_SECURE_ACCOUNT, CA_IRPA_S91],
      }),
    ];

    return capabilityReport(IRCC_ADAPTER_ID, 'IRCC (Canada)', CA, ctx.asOf, capabilities);
  };

  // The probes call the gate itself rather than a stub operation. The gate *is*
  // the behaviour of these capabilities: there is nothing else to run, and
  // exporting a function whose only job is to fail would invite someone to fill
  // it in.
  const governmentOperations: readonly GovernmentOperationProbe[] = Object.freeze(
    [
      IRCC_CAPABILITY.employerPortalSubmission,
      IRCC_CAPABILITY.applicantSubmission,
      IRCC_CAPABILITY.statusPolling,
      IRCC_CAPABILITY.credentialCustody,
    ].map((capabilityId): GovernmentOperationProbe => ({
      capabilityId,
      description: `IRCC ${capabilityId}`,
      probe: async (ctx: AdapterContext) => requireCapability(describeCapabilities(ctx), capabilityId),
    })),
  );

  return {
    id: IRCC_ADAPTER_ID,
    jurisdiction: CA,
    displayName: 'IRCC (Canada)',
    summary:
      'Canada\'s immigration department. Offer validation, decomposed timeline estimation and an employer ' +
      'portal handoff are available; portal submission and status reading are not implemented; credential ' +
      'custody is refused by policy.',
    describeCapabilities,
    governmentOperations,

    validateOfferOfEmployment(
      raw: unknown,
      asOf: IsoDate,
    ): Result<Disclosable<OfferOfEmploymentValidation>, MeridianError> {
      // An offer package arrives from an employer, through an API, as JSON. This
      // is precisely the untyped boundary the runtime guard exists for — the
      // structural refusal cannot reach it.
      const guarded = guardCredentialFree(raw);
      if (!guarded.ok) return guarded;

      if (!isIsoDate(asOf)) {
        return err(new MeridianError('INVALID_INPUT', `asOf is not a valid civil date: ${String(asOf)}`));
      }
      if (raw === null || typeof raw !== 'object') {
        return err(
          new MeridianError('INVALID_INPUT', 'An offer of employment package must be an object.', {
            received: typeof raw,
          }),
        );
      }

      const parsed = offerSchema.safeParse(raw);
      if (!parsed.success) {
        // Every shape problem at once. A validator that stops at the first
        // missing field turns one round trip into fifteen, and the person doing
        // the fixing is an HR administrator, not an engineer.
        const findings = parsed.error.issues.map((issue) =>
          finding('error', issue.path.join('.') || '<root>', issue.message, [CA_IRCC_EMPLOYER_PORTAL.id]),
        );
        return ok(
          disclosable(
            'assessment',
            Object.freeze({
              ready: false,
              findings: Object.freeze(findings),
              humanVerificationRequired: true,
              checkedOn: asOf,
              offerDurationDays: null,
            }),
            [CA_IRCC_EMPLOYER_PORTAL.id],
          ),
        );
      }

      const semantics = checkSemantics(parsed.data, asOf);
      const findings = Object.freeze(semantics.findings);
      const citationIds = [
        ...new Set(findings.flatMap((f) => f.citationIds)),
      ];

      return ok(
        disclosable(
          'assessment',
          Object.freeze({
            ready: !findings.some((f) => f.severity === 'error'),
            findings,
            humanVerificationRequired: findings.some((f) => f.severity === 'needs_human_verification'),
            checkedOn: asOf,
            offerDurationDays: semantics.offerDurationDays,
          }),
          citationIds,
        ),
        );
    },

    estimateProcessingTimeline<T extends ProcessingTimelineInput>(
      input: T & CredentialFree<T>,
    ): Result<Disclosable<ProcessingTimelineEstimate>, MeridianError> {
      const guarded = guardCredentialFree(input as ProcessingTimelineInput);
      if (!guarded.ok) return guarded;

      const typed = input as ProcessingTimelineInput;
      if (!isIsoDate(typed.asOf)) {
        return err(new MeridianError('INVALID_INPUT', `asOf is not a valid civil date: ${String(typed.asOf)}`));
      }
      if (!isIsoDate(typed.publishedOn)) {
        return err(
          new MeridianError('INVALID_INPUT', `publishedOn is not a valid civil date: ${String(typed.publishedOn)}`),
        );
      }

      const numberChecks: readonly (MeridianError | null)[] = [
        positiveInteger(typed.publishedProcessingDays, 'publishedProcessingDays'),
        positiveInteger(typed.outstandingCompletenessDays, 'outstandingCompletenessDays'),
        positiveInteger(typed.postDecisionDays, 'postDecisionDays'),
        typed.biometrics.required
          ? positiveInteger(typed.biometrics.instructionLetterDays, 'biometrics.instructionLetterDays')
          : null,
        typed.biometrics.required
          ? positiveInteger(typed.biometrics.appointmentLeadDays, 'biometrics.appointmentLeadDays')
          : null,
        typed.biometrics.required
          ? positiveInteger(typed.biometrics.collectionToFileDays, 'biometrics.collectionToFileDays')
          : null,
      ];
      for (const problem of numberChecks) {
        if (problem !== null) return err(problem);
      }

      const publishedFigureAgeDays = diffDays(typed.publishedOn, typed.asOf);
      if (publishedFigureAgeDays < 0) {
        return err(
          new MeridianError(
            'INVALID_INPUT',
            `The published processing figure is dated ${typed.publishedOn}, after the assessment date ` +
              `${typed.asOf}. A figure cannot have been read in the future.`,
          ),
        );
      }

      const biometricsDays = typed.biometrics.required
        ? typed.biometrics.instructionLetterDays +
          typed.biometrics.appointmentLeadDays +
          typed.biometrics.collectionToFileDays
        : 0;

      const components: readonly TimelineComponent[] = Object.freeze([
        Object.freeze({
          id: 'application_completeness' as const,
          label: 'Reaching a complete application',
          days: typed.outstandingCompletenessDays,
          clockOwner: 'applicant' as const,
          explanation:
            'Outstanding documents, translations and signatures. IRCC\'s published clock does not start until ' +
            'a complete application is received, so every day here is a day before the published figure ' +
            'begins to run. This is the component that disappears from planning conversations and then ' +
            'reappears as a blown start date.',
          citationIds: [CA_IRCC_PROCESSING_TIMES.id],
        }),
        Object.freeze({
          id: 'biometrics' as const,
          label: 'Biometrics instruction, appointment and collection',
          days: biometricsDays,
          clockOwner: 'applicant' as const,
          explanation: typed.biometrics.required
            ? 'From the instruction letter to an appointment the applicant can actually get, and from ' +
              'collection to the result reaching the file. Appointment availability varies by location and ' +
              'sits outside the published processing clock.'
            : `Not required: ${typed.biometrics.reason}`,
          citationIds: [CA_IRCC_BIOMETRICS.id],
        }),
        Object.freeze({
          id: 'published_processing' as const,
          label: 'IRCC published processing time',
          days: typed.publishedProcessingDays,
          clockOwner: 'authority' as const,
          explanation:
            'The figure IRCC publishes for this stream, as read on ' +
            `${typed.publishedOn}. It is a historical measure of past cases, not a service guarantee, and it ` +
            'describes the period after a complete application is received.',
          citationIds: [CA_IRCC_PROCESSING_TIMES.id],
        }),
        Object.freeze({
          id: 'post_decision' as const,
          label: 'After the decision, before day one',
          days: typed.postDecisionDays,
          clockOwner: 'applicant' as const,
          explanation:
            'Passport submission where required, document issuance, and travel. A positive decision is not ' +
            'the same event as a person being able to start work.',
          citationIds: [CA_IRCC_PROCESSING_TIMES.id],
        }),
      ]);

      const totalDays = components.reduce((sum, c) => sum + c.days, 0);

      const completeOn = addDays(typed.asOf, typed.outstandingCompletenessDays);
      const biometricsCompleteOn = addDays(completeOn, biometricsDays);
      const decisionOn = addDays(biometricsCompleteOn, typed.publishedProcessingDays);
      const readyOn = addDays(decisionOn, typed.postDecisionDays);

      const milestones: readonly TimelineMilestone[] = Object.freeze([
        Object.freeze({
          id: 'application_complete' as const,
          label: 'Application complete and submitted',
          on: completeOn,
        }),
        Object.freeze({ id: 'biometrics_complete' as const, label: 'Biometrics on file', on: biometricsCompleteOn }),
        Object.freeze({ id: 'decision' as const, label: 'Decision expected no earlier than', on: decisionOn }),
        Object.freeze({ id: 'ready_to_start' as const, label: 'Able to start work no earlier than', on: readyOn }),
      ]);

      let targetStart: TargetStartAssessment | null = null;
      if (typed.targetStartOn !== undefined) {
        if (!isIsoDate(typed.targetStartOn)) {
          return err(
            new MeridianError(
              'INVALID_INPUT',
              `targetStartOn is not a valid civil date: ${String(typed.targetStartOn)}`,
            ),
          );
        }
        const slackDays = diffDays(readyOn, typed.targetStartOn);
        targetStart = Object.freeze({
          targetStartOn: typed.targetStartOn,
          earliestReadyOn: readyOn,
          slackDays,
          met: slackDays >= 0,
        });
      }

      const caveats: string[] = [
        'This is arithmetic on figures you supplied and a figure IRCC published. It is not a prediction of ' +
          'the outcome of the application, and it is not a commitment by anyone.',
        'The published processing time is a historical measure of past cases and is republished frequently. ' +
          'It describes the period after a complete application is received.',
      ];
      // Operational freshness bands, not law. The point is only that a figure
      // read a month ago should not be quoted to an employer as current.
      if (publishedFigureAgeDays > 30) {
        caveats.push(
          `The published figure was read ${publishedFigureAgeDays} days ago. Re-read it before relying on ` +
            'this estimate; IRCC updates published times frequently.',
        );
      } else if (publishedFigureAgeDays > 7) {
        caveats.push(
          `The published figure was read ${publishedFigureAgeDays} days ago and may already have moved.`,
        );
      }
      if (typed.outstandingCompletenessDays === 0) {
        caveats.push(
          'This estimate assumes the application is already complete today. If any document, translation or ' +
            'signature is outstanding, add those days at the front — the published clock has not started.',
        );
      }
      if (!typed.biometrics.required) {
        caveats.push(
          'Biometrics are treated as not required. If that is wrong, the whole estimate is short by the ' +
            'instruction, appointment and collection time.',
        );
      }

      return ok(
        disclosable(
          'assessment',
          Object.freeze({
            stream: typed.stream,
            asOf: typed.asOf,
            components,
            totalDays,
            elapsedRange: dateRange(typed.asOf, addDays(typed.asOf, totalDays)),
            milestones,
            publishedFigureAgeDays,
            targetStart,
            caveats: Object.freeze(caveats),
          }),
          [CA_IRCC_PROCESSING_TIMES.id, CA_IRCC_BIOMETRICS.id],
        ),
      );
    },

    buildEmployerPortalHandoff<T extends IrccEmployerPortalHandoffInput>(
      input: T & CredentialFree<T>,
    ): Result<AssistedHandoff, MeridianError> {
      const guarded = guardCredentialFree(input as IrccEmployerPortalHandoffInput);
      if (!guarded.ok) return guarded;

      const typed = input as IrccEmployerPortalHandoffInput;
      if (typed.employerLegalName.trim().length === 0) {
        return err(new MeridianError('INVALID_INPUT', 'The employer\'s legal name is required.'));
      }
      if (!isIsoDate(typed.startOn)) {
        return err(new MeridianError('INVALID_INPUT', `startOn is not a valid civil date: ${String(typed.startOn)}`));
      }

      const fields: HandoffField[] = [
        {
          id: 'employer-legal-name',
          label: 'Employer legal name',
          value: typed.employerLegalName,
          source: 'user_record',
          note: 'The legal name, not the operating or trade name, unless the portal asks for both.',
        },
        {
          id: 'employer-business-number',
          label: 'Business number',
          value: typed.employerBusinessNumber,
          source: 'user_record',
        },
        {
          id: 'position-title',
          label: 'Job title',
          value: typed.positionTitle,
          source: 'user_record',
        },
        {
          id: 'noc-code',
          label: 'NOC 2021 code',
          value: typed.nocCode,
          source: 'user_record',
        },
        {
          id: 'start-date',
          label: 'Employment start date',
          value: typed.startOn,
          source: 'user_record',
        },
      ];

      if (typed.endOn !== undefined) {
        if (!isIsoDate(typed.endOn)) {
          return err(new MeridianError('INVALID_INPUT', `endOn is not a valid civil date: ${String(typed.endOn)}`));
        }
        const span = diffDays(typed.startOn, typed.endOn);
        if (span < 0) {
          return err(
            new MeridianError('INVALID_INPUT', 'The employment end date falls before the start date.', {
              startOn: typed.startOn,
              endOn: typed.endOn,
            }),
          );
        }
        fields.push({
          id: 'end-date',
          label: 'Employment end date',
          value: typed.endOn,
          source: 'user_record',
        });
        fields.push({
          id: 'offer-duration-days',
          label: 'Duration of the offer, in days',
          value: String(span + 1),
          source: 'computed',
          note:
            'Counted inclusively: the first and last days are both days of employment. Check this against ' +
            'any duration the portal computes for itself.',
        });
      }

      return buildHandoff({
        id: `ircc-employer-portal-${typed.matterId}`,
        adapterId: IRCC_ADAPTER_ID,
        jurisdiction: CA,
        title: 'Submit the offer of employment in your Employer Portal account',
        purpose:
          'Record the offer of employment with IRCC so the foreign national can apply for an LMIA-exempt work ' +
          'permit, with the employer as the account holder throughout.',
        destinationUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
        generatedOn: typed.generatedOn,
        steps: [
          {
            title: 'Sign in to your Employer Portal account, or enrol if you have none',
            detail:
              'Enrolment is done once by the employer. The account and its credential stay with the employer; ' +
              'Meridian does not hold them and will not accept them.',
            actor: 'employer',
            channel: 'online',
            requiresDocumentIds: [EMPLOYER_ACCOUNT_DOCUMENT.id],
            citationIds: [CA_IRCC_EMPLOYER_PORTAL.id, CA_IRCC_SECURE_ACCOUNT.id],
          },
          {
            title: 'Create the offer of employment and enter the validated package',
            detail:
              'Transcribe the values from the exported package. They have already been checked for shape, so ' +
              'this session is copying rather than composing.',
            actor: 'employer',
            channel: 'online',
            requiresDocumentIds: [VALIDATED_PACKAGE_DOCUMENT.id],
            citationIds: [CA_IRCC_EMPLOYER_PORTAL.id, CA_IRPR_EMPLOYER_OBLIGATIONS.id],
          },
          {
            title: 'Pay the employer compliance fee where one is payable',
            detail:
              'Read the current published amount at the moment of payment. Keep the receipt reference — it is ' +
              'part of the compliance record, not just an expense.',
            actor: 'employer',
            channel: 'online',
            requiresDocumentIds: [PAYMENT_METHOD_DOCUMENT.id],
            citationIds: [CA_IRCC_EMPLOYER_PORTAL.id],
          },
          {
            title: 'Record the offer of employment number',
            detail:
              'The number issued on submission is what the foreign national needs to make their own work ' +
              'permit application. Without it, they cannot proceed.',
            actor: 'employer',
            channel: 'online',
            citationIds: [CA_IRCC_EMPLOYER_PORTAL.id],
          },
          {
            title: 'Pass the number and the employer name to the foreign national',
            detail: 'They enter both in their own application, in their own account.',
            actor: 'employer',
            channel: 'online',
            citationIds: [CA_IRCC_EMPLOYER_PORTAL.id],
          },
        ],
        documents: [EMPLOYER_ACCOUNT_DOCUMENT, VALIDATED_PACKAGE_DOCUMENT, PAYMENT_METHOD_DOCUMENT],
        fields,
        bringBack: [
          {
            id: 'offer-of-employment-number',
            title: 'The offer of employment number',
            description: 'Issued on submission. The work permit application cannot be made without it.',
            kind: 'reference_number',
          },
          {
            id: 'compliance-fee-receipt',
            title: 'The compliance fee receipt reference, where a fee was paid',
            description: 'Part of the employer compliance record.',
            kind: 'payment_receipt',
          },
          {
            id: 'submission-date',
            title: 'The date the offer was submitted',
            description: 'Anchors the sequence of everything that follows.',
            kind: 'appointment_datetime',
          },
        ],
        citations: [CA_IRCC_EMPLOYER_PORTAL, CA_IRPR_EMPLOYER_OBLIGATIONS, CA_IRCC_SECURE_ACCOUNT],
        caveats: [
          'Portal screens, field names and the compliance fee are published by IRCC and change without ' +
            'notice. Read the current fee at the time of payment.',
          'Meridian never asks for, stores or transmits the sign-in credential for this account. If any ' +
            'Meridian screen asks for it, that is a defect — do not enter it, and report it.',
          'This restates a published procedure. It does not assess whether the exemption relied on is the ' +
            'correct one for these facts, which is a judgement for an authorised representative.',
        ],
      });
    },
  };
}
