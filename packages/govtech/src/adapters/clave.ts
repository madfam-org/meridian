/**
 * Cl@ve — Spain's identification and authentication system for dealings with
 * public administrations.
 *
 * This adapter is the package's worked example of the refusal. The source PRD
 * asked for storage of Cl@ve PINs and Cl@ve Permanente passwords and for
 * submission on the user's behalf; both are declared `refused_by_policy` here
 * and neither has an implementation to disable, a flag to flip, or a code path
 * to extend.
 *
 * What the adapter does instead:
 *
 *  - **Registration handoff.** Getting into Cl@ve at all is the real obstacle for
 *    a migrant, and it is a procedural problem rather than a technical one: four
 *    routes exist, three of them have a precondition most new arrivals do not yet
 *    meet, and choosing wrongly costs weeks. The handoff lays out the chosen
 *    route precisely, with the documents needed at each step.
 *  - **Readiness checklist.** Answers "can I actually start this route today"
 *    before the user books an appointment they cannot complete.
 *  - **Delegated identity assertion**, modelled but `not_provisioned`. This is the
 *    architecturally correct integration: the user authenticates *directly with
 *    Cl@ve*, and Meridian receives a signed assertion about them. We never see the
 *    authenticator. It needs a formal agreement, which does not exist, so it
 *    reports as unprovisioned rather than pretending.
 *
 * A note on the URLs. Every destination here is a root or near-root official
 * page rather than a deep link into a specific form. Deep paths on these portals
 * change without notice, and a handoff that sends someone to a 404 in a queue is
 * worse than one that sends them to the front door with instructions for
 * navigating from it. A wrong deep link is also indistinguishable, to a stressed
 * user, from a phishing page.
 */

import type { CountryCode, IsoDate, Result } from '@meridian/core';
import { MeridianError, countryCode, err, isIsoDate, ok } from '@meridian/core';
import type { AdapterContext, GovTechAdapter, GovernmentOperationProbe } from '../adapter.js';
import { requireCapability } from '../adapter.js';
import type { Capability, CapabilityReport, CapabilityRequirement } from '../capability.js';
import { capability, capabilityReport, requirement, stateFromRequirements } from '../capability.js';
import type { CredentialFree } from '../credential-guard.js';
import { guardCredentialFree } from '../credential-guard.js';
import type { AssistedHandoff, HandoffDocument, HandoffField, HandoffStepInput } from '../handoff.js';
import { buildHandoff } from '../handoff.js';
import {
  ES_CLAVE_PORTAL,
  ES_CLAVE_VIDEO_REGISTRATION,
  ES_LEY_39_2015_ART_9,
  ES_LEY_39_2015_ART_12,
  EU_EIDAS_ASSURANCE_LEVELS,
} from '../citations.js';

export const CLAVE_ADAPTER_ID = 'es-clave';

const ES: CountryCode = countryCode('ES');

export const CLAVE_CAPABILITY = {
  registrationHandoff: 'clave.registration_handoff',
  readinessChecklist: 'clave.readiness_checklist',
  identityAssertion: 'clave.identity_assertion',
  credentialCustody: 'clave.credential_custody',
  actAsUser: 'clave.act_as_user',
} as const;

/** Configuration key names. Names only — this package never reads their values. */
export const CLAVE_CONFIG_KEYS = {
  agreement: 'MERIDIAN_CLAVE_SP_AGREEMENT_REF',
  signingKey: 'MERIDIAN_CLAVE_SP_SIGNING_KEY_REF',
  endpoint: 'MERIDIAN_CLAVE_ENDPOINT',
} as const;

/* -------------------------------------------------------------------------- */
/* Registration routes                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The four ways into Cl@ve.
 *
 * Ordered here by how available they are to someone who has just arrived, which
 * is the opposite of how they are usually presented. `electronic_certificate`
 * requires a certificate you probably obtained *using* Cl@ve; `invitation_letter`
 * requires a registered Spanish address the letter can reach; `video_call`
 * requires an appointment slot to exist. `in_person_office` always works and is
 * always slowest.
 */
export type ClaveRegistrationRoute =
  | 'in_person_office'
  | 'video_call'
  | 'invitation_letter'
  | 'electronic_certificate';

export const CLAVE_REGISTRATION_ROUTES: readonly ClaveRegistrationRoute[] = Object.freeze([
  'in_person_office',
  'video_call',
  'invitation_letter',
  'electronic_certificate',
]);

/**
 * The operational conditions for registering by video identification.
 *
 * Encoded as documented technical requirements, not as entitlements. Video
 * identification is a channel the operating body opens and can restrict — by
 * hours, by appointment capacity, by who is eligible — and none of this is a
 * statutory right. Where a user cannot meet a condition, the answer is a
 * different route, not a workaround.
 *
 * @see ES_CLAVE_VIDEO_REGISTRATION — administrative practice; verify current terms.
 */
export const CLAVE_VIDEO_IDENTIFICATION_REQUIREMENTS: readonly string[] = Object.freeze([
  'A device with a working camera and microphone, and a browser allowed to use both.',
  'A connection stable enough to hold video for the length of the call.',
  'The original identity document (DNI, or NIE on the physical card issued to you) in hand, to be shown to the camera.',
  'The person registering must be present in the call themselves, face uncovered, in light good enough for the document and the face to be compared.',
  'An appointment, where the operating body requires one for this channel.',
  'A mobile number and an email address for the second factor and for confirmations.',
]);

export type TriState = 'yes' | 'no' | 'unknown';

export interface ClaveReadinessInput {
  readonly route: ClaveRegistrationRoute;
  /** `none` is a real and common answer — it makes every route unavailable. */
  readonly identityDocument: 'dni' | 'nie' | 'none';
  readonly hasSpanishFiscalAddress: TriState;
  readonly holdsElectronicCertificateOrDnie: TriState;
  readonly hasMobileForSecondFactor: TriState;
  readonly hasEmailAddress: TriState;
  readonly hasAppointment: TriState;
  readonly hasCameraAndMicrophone: TriState;
  readonly asOf: IsoDate;
}

export type ReadinessStatus = 'satisfied' | 'not_satisfied' | 'unknown';

export interface ReadinessItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly required: boolean;
  readonly status: ReadinessStatus;
  readonly citationIds: readonly string[];
}

export interface ClaveReadinessChecklist {
  readonly route: ClaveRegistrationRoute;
  readonly generatedOn: IsoDate;
  readonly items: readonly ReadinessItem[];
  /**
   * True only when every required item is `satisfied`.
   *
   * `unknown` counts against readiness. Treating "we did not ask" as "fine" is
   * how a user ends up at a counter without the one document that mattered.
   */
  readonly readyToProceed: boolean;
  /** Required items whose status is `unknown` — the questions still worth asking. */
  readonly unresolvedItemIds: readonly string[];
}

function statusOf(value: TriState): ReadinessStatus {
  switch (value) {
    case 'yes':
      return 'satisfied';
    case 'no':
      return 'not_satisfied';
    case 'unknown':
      return 'unknown';
  }
}

/* -------------------------------------------------------------------------- */
/* Delegated authentication (modelled, unprovisioned)                         */
/* -------------------------------------------------------------------------- */

export type ClaveRequestedAttribute = 'identifier' | 'given_name' | 'family_name' | 'date_of_birth';

export interface ClaveIdentityAssertionRequest {
  readonly matterId: string;
  /** Where Cl@ve returns the user after they authenticate. Must be https. */
  readonly returnUrl: string;
  readonly requestedAttributes: readonly ClaveRequestedAttribute[];
  readonly requestedOn: IsoDate;
}

/**
 * What a provisioned integration would return: a statement *about* the user,
 * issued by the scheme after the user authenticated with it directly.
 *
 * Note what is absent. There is no field for the PIN, the password, a session
 * token belonging to the user, or anything else that would let the holder
 * authenticate as them later. An assertion is spent on arrival.
 */
export interface ClaveIdentityAssertion {
  readonly issuedOn: IsoDate;
  /** The identifier the scheme asserts, typically DNI or NIE. */
  readonly subjectIdentifier: string;
  readonly attributes: Readonly<Record<string, string>>;
  /** eIDAS level. An assertion without one is not evidence of anything. */
  readonly assuranceLevel: 'low' | 'substantial' | 'high';
  /** Opaque reference for audit, resolvable against the scheme's own logs. */
  readonly assertionReference: string;
}

/**
 * The seam a future provisioned integration implements.
 *
 * The contract is deliberately narrow: it accepts a request describing *what is
 * being asked about the user* and returns an assertion. It has no parameter into
 * which a credential could be passed, and an implementation that added one would
 * be rejected by {@link CredentialFree} at the call site.
 *
 * No implementation ships in this package. Until one is injected, the transport
 * requirement is unsatisfied and the capability reports `not_provisioned`.
 */
export interface ClaveDelegatedAuthentication {
  /** Human name of the configured scheme endpoint, for the status board. */
  readonly schemeName: string;
  requestAssertion(request: ClaveIdentityAssertionRequest): Promise<ClaveIdentityAssertion>;
}

export interface ClaveAdapterOptions {
  readonly delegatedAuthentication?: ClaveDelegatedAuthentication | null;
}

/* -------------------------------------------------------------------------- */
/* Handoff input                                                              */
/* -------------------------------------------------------------------------- */

export interface ClaveRegistrationHandoffInput {
  readonly matterId: string;
  readonly route: ClaveRegistrationRoute;
  readonly fullName: string;
  /** The user's own DNI or NIE, so they can copy it rather than misremember it. */
  readonly identityDocumentNumber?: string;
  readonly generatedOn: IsoDate;
}

const ROUTE_DESTINATION: Readonly<Record<ClaveRegistrationRoute, string>> = Object.freeze({
  in_person_office: 'https://clave.gob.es/',
  video_call: 'https://sede.agenciatributaria.gob.es/',
  invitation_letter: 'https://sede.agenciatributaria.gob.es/',
  electronic_certificate: 'https://clave.gob.es/',
});

const IDENTITY_DOCUMENT: HandoffDocument = Object.freeze({
  id: 'identity-document',
  title: 'Your identity document (DNI, or the physical NIE/TIE card)',
  description:
    'The document the registration is made against. A photocopy is not accepted where the document has to be shown.',
  origin: 'applicant',
  originalRequired: true,
});

const INVITATION_LETTER: HandoffDocument = Object.freeze({
  id: 'invitation-letter',
  title: 'Invitation letter with its verification code',
  description:
    'Posted to the address held on file for you. The code on it is single-use and is entered by you, on the ' +
    'official site — Meridian never asks for it and never stores it.',
  origin: 'destination_authority',
  originalRequired: false,
});

const ELECTRONIC_CERTIFICATE: HandoffDocument = Object.freeze({
  id: 'electronic-certificate',
  title: 'A valid electronic certificate, or your DNIe and a card reader',
  description:
    'Installed on the device you will use. The certificate stays on your device; it is used to identify you to ' +
    'the official site directly.',
  origin: 'applicant',
  originalRequired: false,
});

/**
 * Present on every Cl@ve handoff.
 *
 * The first caveat is the operative one. Publishing it in the user's own
 * paperwork turns the platform's policy into something the user can hold us to:
 * if a Meridian screen ever asks for their PIN, they have written evidence that
 * it should not have.
 */
const CLAVE_CAVEATS: readonly string[] = Object.freeze([
  'Meridian never asks for, stores or transmits your Cl@ve PIN or your Cl@ve Permanente password. If any ' +
    'Meridian screen or message asks you for one, that is a defect — do not enter it, and report it.',
  'You perform this registration yourself. The account, and everything done with it, remains yours.',
  'Registration routes, appointment availability and the exact screens are set by the bodies that operate ' +
    'Cl@ve and change without notice. Check the official site before travelling to an appointment.',
]);

function stepsForRoute(route: ClaveRegistrationRoute): readonly HandoffStepInput[] {
  const claveCitations = [ES_CLAVE_PORTAL.id, ES_LEY_39_2015_ART_9.id];

  switch (route) {
    case 'in_person_office':
      return [
        {
          title: 'Book an appointment at a registration office',
          detail:
            'Registration offices are operated by several bodies, including the tax agency and social security. ' +
            'Book through the official appointment service for the office you intend to visit.',
          actor: 'applicant',
          channel: 'online',
          citationIds: claveCitations,
        },
        {
          title: 'Attend the appointment with your identity document',
          detail:
            'You identify yourself in person. Staff register you in the system; you do not create a password ' +
            'in front of them.',
          actor: 'applicant',
          channel: 'in_person',
          requiresDocumentIds: [IDENTITY_DOCUMENT.id],
          citationIds: claveCitations,
        },
        {
          title: 'Activate the account yourself, afterwards',
          detail:
            'Activation and the setting of any permanent password happen on the official site, by you, using ' +
            'the codes sent to your own phone and email.',
          actor: 'applicant',
          channel: 'online',
          citationIds: claveCitations,
        },
        {
          title: 'Record the confirmation in your matter',
          detail:
            'Save the confirmation reference and the date. Meridian needs the reference, not the credential.',
          actor: 'applicant',
          channel: 'online',
          citationIds: [ES_LEY_39_2015_ART_12.id],
        },
      ];

    case 'video_call':
      return [
        {
          title: 'Check you can meet the video identification conditions',
          detail: CLAVE_VIDEO_IDENTIFICATION_REQUIREMENTS.join(' '),
          actor: 'applicant',
          channel: 'online',
          citationIds: [ES_CLAVE_VIDEO_REGISTRATION.id],
        },
        {
          title: 'Book the video identification appointment',
          detail:
            'Book through the operating body\'s own appointment service. Capacity for this channel is limited ' +
            'and is not guaranteed to be open when you look.',
          actor: 'applicant',
          channel: 'online',
          citationIds: [ES_CLAVE_VIDEO_REGISTRATION.id],
        },
        {
          title: 'Attend the video call and show your document',
          detail:
            'Join at the appointed time with your original document to hand. The official compares your face ' +
            'to the document live.',
          actor: 'applicant',
          channel: 'video_call',
          requiresDocumentIds: [IDENTITY_DOCUMENT.id],
          citationIds: [ES_CLAVE_VIDEO_REGISTRATION.id],
        },
        {
          title: 'Complete activation on the official site',
          detail: 'Finish activation yourself using the codes sent to your own phone and email.',
          actor: 'applicant',
          channel: 'online',
          citationIds: claveCitations,
        },
        {
          title: 'Record the confirmation in your matter',
          detail: 'Save the confirmation reference and the date of the call.',
          actor: 'applicant',
          channel: 'online',
          citationIds: [ES_LEY_39_2015_ART_12.id],
        },
      ];

    case 'invitation_letter':
      return [
        {
          title: 'Request the invitation letter',
          detail:
            'Request it from the official site. It is posted to the address held on file for you, so the ' +
            'address must be correct and reachable before you start.',
          actor: 'applicant',
          channel: 'online',
          citationIds: claveCitations,
        },
        {
          title: 'Wait for the letter to arrive by post',
          detail:
            'Delivery takes as long as the post takes. If the address on file is wrong, correct that first — ' +
            'the letter cannot be redirected.',
          actor: 'applicant',
          channel: 'by_post',
          citationIds: claveCitations,
        },
        {
          title: 'Register on the official site using the code from the letter',
          detail:
            'You enter the code yourself, on the official site. It is single-use. Meridian does not ask for it, ' +
            'and will refuse it if it is sent to us.',
          actor: 'applicant',
          channel: 'online',
          requiresDocumentIds: [INVITATION_LETTER.id, IDENTITY_DOCUMENT.id],
          citationIds: claveCitations,
        },
        {
          title: 'Record the confirmation in your matter',
          detail: 'Save the confirmation reference and the date.',
          actor: 'applicant',
          channel: 'online',
          citationIds: [ES_LEY_39_2015_ART_12.id],
        },
      ];

    case 'electronic_certificate':
      return [
        {
          title: 'Confirm your certificate is installed and valid',
          detail:
            'The certificate must be installed on the device you will use and must not have expired. A DNIe ' +
            'requires a working card reader.',
          actor: 'applicant',
          channel: 'online',
          requiresDocumentIds: [ELECTRONIC_CERTIFICATE.id],
          citationIds: claveCitations,
        },
        {
          title: 'Register on the official site using the certificate',
          detail:
            'The site identifies you from the certificate directly. Nothing is typed that could be stored ' +
            'elsewhere.',
          actor: 'applicant',
          channel: 'online',
          requiresDocumentIds: [ELECTRONIC_CERTIFICATE.id],
          citationIds: claveCitations,
        },
        {
          title: 'Record the confirmation in your matter',
          detail: 'Save the confirmation reference and the date.',
          actor: 'applicant',
          channel: 'online',
          citationIds: [ES_LEY_39_2015_ART_12.id],
        },
      ];
  }
}

function documentsForRoute(route: ClaveRegistrationRoute): readonly HandoffDocument[] {
  switch (route) {
    case 'invitation_letter':
      return [IDENTITY_DOCUMENT, INVITATION_LETTER];
    case 'electronic_certificate':
      return [IDENTITY_DOCUMENT, ELECTRONIC_CERTIFICATE];
    case 'in_person_office':
    case 'video_call':
      return [IDENTITY_DOCUMENT];
  }
}

/* -------------------------------------------------------------------------- */
/* Adapter                                                                    */
/* -------------------------------------------------------------------------- */

export interface ClaveAdapter extends GovTechAdapter {
  buildRegistrationHandoff<T extends ClaveRegistrationHandoffInput>(
    input: T & CredentialFree<T>,
  ): Result<AssistedHandoff, MeridianError>;
  readinessChecklist<T extends ClaveReadinessInput>(
    input: T & CredentialFree<T>,
  ): Result<ClaveReadinessChecklist, MeridianError>;
  requestIdentityAssertion<T extends ClaveIdentityAssertionRequest>(
    ctx: AdapterContext,
    request: T & CredentialFree<T>,
  ): Promise<Result<ClaveIdentityAssertion, MeridianError>>;
}

export function createClaveAdapter(options: ClaveAdapterOptions = {}): ClaveAdapter {
  const delegated = options.delegatedAuthentication ?? null;

  const assertionRequirements = (ctx: AdapterContext): readonly CapabilityRequirement[] =>
    Object.freeze([
      requirement(
        CLAVE_CONFIG_KEYS.agreement,
        'agreement',
        'Reference to a signed agreement admitting Meridian as a relying party of the scheme. Without it ' +
          'there is no lawful basis to consume assertions, whatever the code can do.',
        ctx.hasCredential(CLAVE_CONFIG_KEYS.agreement),
      ),
      requirement(
        CLAVE_CONFIG_KEYS.signingKey,
        'service_secret',
        'Reference to Meridian\'s own service-provider signing key, held in a key store. This is the ' +
          'platform\'s key, not the user\'s — refusing custody of a citizen\'s authenticator does not mean ' +
          'refusing to hold our own service identity.',
        ctx.hasCredential(CLAVE_CONFIG_KEYS.signingKey),
      ),
      requirement(
        CLAVE_CONFIG_KEYS.endpoint,
        'endpoint',
        'The scheme endpoint this deployment is registered against.',
        ctx.hasCredential(CLAVE_CONFIG_KEYS.endpoint),
      ),
      requirement(
        'clave.delegated_authentication_transport',
        'transport',
        'An injected implementation of the delegated authentication flow. This package ships none, so this ' +
          'requirement cannot be satisfied from inside it.',
        delegated !== null,
      ),
    ]);

  const describeCapabilities = (ctx: AdapterContext): CapabilityReport => {
    const assertionReqs = assertionRequirements(ctx);

    const capabilities: readonly Capability[] = [
      capability({
        id: CLAVE_CAPABILITY.registrationHandoff,
        title: 'Build a Cl@ve registration handoff',
        surface: 'local_computation',
        state: 'available',
        reason:
          'Restates the published registration procedure for a chosen route as an ordered package the user ' +
          'carries themselves. Needs nothing from the authority.',
        citations: [ES_CLAVE_PORTAL, ES_LEY_39_2015_ART_12],
      }),
      capability({
        id: CLAVE_CAPABILITY.readinessChecklist,
        title: 'Assess readiness for a Cl@ve registration route',
        surface: 'local_computation',
        state: 'available',
        reason:
          'Measures what the user has against what the chosen route requires. Unknown answers count against ' +
          'readiness rather than being assumed away.',
        citations: [ES_CLAVE_PORTAL, ES_CLAVE_VIDEO_REGISTRATION],
      }),
      capability({
        id: CLAVE_CAPABILITY.identityAssertion,
        title: 'Receive a delegated identity assertion from Cl@ve',
        surface: 'government_system',
        state: stateFromRequirements(assertionReqs, 'not_provisioned'),
        reason:
          delegated === null
            ? 'No agreement, no registered service-provider identity and no wired transport. This is the ' +
              'architecturally correct integration — the user authenticates directly with the scheme and ' +
              'Meridian receives a signed statement about them — but none of its preconditions exist.'
            : 'A delegated authentication transport is wired; remaining state depends on the configured ' +
              'agreement and service-provider identity.',
        requirements: assertionReqs,
        unblockPath: [
          'Obtain a formal agreement admitting Meridian as a relying party of the scheme.',
          'Register a service-provider identity and provision its signing key in a key store.',
          'Configure the scheme endpoint for the deployment.',
          'Implement and inject a ClaveDelegatedAuthentication transport that redirects the user to the ' +
            'scheme and consumes only the returned assertion.',
        ],
        alternative: {
          capabilityId: CLAVE_CAPABILITY.registrationHandoff,
          description:
            'Until delegated authentication is provisioned, identity is established through documents the ' +
            'user provides and, where Cl@ve access is needed, through a registration handoff.',
        },
        citations: [EU_EIDAS_ASSURANCE_LEVELS, ES_LEY_39_2015_ART_9, ES_CLAVE_PORTAL],
      }),
      capability({
        id: CLAVE_CAPABILITY.credentialCustody,
        title: 'Store or relay a user\'s Cl@ve PIN or Cl@ve Permanente password',
        surface: 'government_system',
        state: 'refused_by_policy',
        reason:
          'Refused permanently. Cl@ve credentials reach the user\'s tax, social security and civil registry ' +
          'records; custody would make Meridian a credential custodian for a state identity system and would ' +
          'turn any breach here into identity fraud there.',
        policy: 'no_credential_custody',
        alternative: {
          capabilityId: CLAVE_CAPABILITY.registrationHandoff,
          description:
            'The user holds their own credential and authenticates on the authority\'s own site, following a ' +
            'handoff that tells them exactly what to do and what to bring back.',
        },
        citations: [ES_CLAVE_PORTAL, ES_LEY_39_2015_ART_12],
      }),
      capability({
        id: CLAVE_CAPABILITY.actAsUser,
        title: 'Submit to a Spanish administration while presenting as the user',
        surface: 'government_system',
        state: 'refused_by_policy',
        reason:
          'Refused permanently. A submission made with the user\'s credential is the user\'s own legal act, ' +
          'performed by us, with no record of their consent to that specific act. Ley 39/2015 art. 12 ' +
          'contemplates assistance and, where action on someone\'s behalf occurs at all, designated officials ' +
          'acting with express recorded consent — not a private platform typing as the citizen.',
        policy: 'no_impersonation',
        alternative: {
          capabilityId: CLAVE_CAPABILITY.registrationHandoff,
          description:
            'Meridian computes every value in advance and hands the user an ordered package; the user makes ' +
            'the submission, and the audit trail lands in their own account.',
        },
        citations: [ES_LEY_39_2015_ART_12, ES_LEY_39_2015_ART_9],
      }),
    ];

    return capabilityReport(CLAVE_ADAPTER_ID, 'Cl@ve (Spain)', ES, ctx.asOf, capabilities);
  };

  const requestIdentityAssertion = async <T extends ClaveIdentityAssertionRequest>(
    ctx: AdapterContext,
    request: T & CredentialFree<T>,
  ): Promise<Result<ClaveIdentityAssertion, MeridianError>> => {
    const guarded = guardCredentialFree(request as ClaveIdentityAssertionRequest);
    if (!guarded.ok) return guarded;

    const typed = request as ClaveIdentityAssertionRequest;
    if (!typed.returnUrl.toLowerCase().startsWith('https://')) {
      return err(
        new MeridianError('INVALID_INPUT', 'The return URL for an identity assertion must use https.', {
          returnUrl: typed.returnUrl,
        }),
      );
    }
    if (!isIsoDate(typed.requestedOn)) {
      return err(
        new MeridianError('INVALID_INPUT', `requestedOn is not a valid civil date: ${String(typed.requestedOn)}`),
      );
    }

    const gate = requireCapability(describeCapabilities(ctx), CLAVE_CAPABILITY.identityAssertion);
    if (!gate.ok) return gate;

    // Defence in depth. The gate can only pass when the transport requirement is
    // satisfied, so this branch is unreachable today — but if a future change
    // ever lets the two drift apart, the failure must be a refusal rather than a
    // fabricated assertion about somebody's legal identity.
    if (delegated === null) {
      return err(
        new MeridianError(
          'ADAPTER_UNAVAILABLE',
          'Cl@ve delegated authentication reports available but no transport is wired. This is a ' +
            'configuration defect; no assertion can be produced and none will be invented.',
          { adapterId: CLAVE_ADAPTER_ID, capabilityId: CLAVE_CAPABILITY.identityAssertion },
        ),
      );
    }

    try {
      return ok(await delegated.requestAssertion(typed));
    } catch (cause) {
      return err(
        new MeridianError(
          'ADAPTER_UNAVAILABLE',
          `Cl@ve delegated authentication failed: ${cause instanceof Error ? cause.message : String(cause)}`,
          { adapterId: CLAVE_ADAPTER_ID, capabilityId: CLAVE_CAPABILITY.identityAssertion },
        ),
      );
    }
  };

  const governmentOperations: readonly GovernmentOperationProbe[] = Object.freeze([
    {
      capabilityId: CLAVE_CAPABILITY.identityAssertion,
      description: 'Cl@ve delegated identity assertion',
      probe: (ctx: AdapterContext) =>
        requestIdentityAssertion(ctx, {
          matterId: 'probe',
          returnUrl: 'https://example.invalid/return',
          requestedAttributes: ['identifier'] as const,
          requestedOn: ctx.asOf,
        }),
    },
  ]);

  return {
    id: CLAVE_ADAPTER_ID,
    jurisdiction: ES,
    displayName: 'Cl@ve (Spain)',
    summary:
      'Spain\'s identification and authentication system for public administrations. Registration guidance ' +
      'and readiness are available; delegated authentication is unprovisioned; credential custody and ' +
      'acting as the user are refused by policy.',
    describeCapabilities,
    governmentOperations,

    buildRegistrationHandoff<T extends ClaveRegistrationHandoffInput>(
      input: T & CredentialFree<T>,
    ): Result<AssistedHandoff, MeridianError> {
      const guarded = guardCredentialFree(input as ClaveRegistrationHandoffInput);
      if (!guarded.ok) return guarded;

      const typed = input as ClaveRegistrationHandoffInput;
      if (!CLAVE_REGISTRATION_ROUTES.includes(typed.route)) {
        return err(
          new MeridianError('INVALID_INPUT', `Unknown Cl@ve registration route: ${String(typed.route)}`, {
            known: CLAVE_REGISTRATION_ROUTES,
          }),
        );
      }
      if (typed.fullName.trim().length === 0) {
        return err(new MeridianError('INVALID_INPUT', 'The applicant\'s full name is required.'));
      }

      const fields: HandoffField[] = [
        {
          id: 'full-name',
          label: 'Name and surnames',
          value: typed.fullName,
          source: 'user_record',
          note: 'Enter it exactly as it appears on your identity document, including both surnames if you have two.',
        },
      ];
      if (typed.identityDocumentNumber !== undefined && typed.identityDocumentNumber.trim().length > 0) {
        fields.push({
          id: 'identity-document-number',
          label: 'DNI / NIE',
          value: typed.identityDocumentNumber,
          source: 'user_record',
          note: 'Include the letter. A NIE begins with a letter and ends with one.',
        });
      }
      fields.push(
        {
          id: 'mobile-number',
          label: 'Mobile telephone number',
          value: '',
          source: 'user_supplies',
          note: 'You enter this yourself. It is where the second factor is sent, so it must be a number you hold.',
        },
        {
          id: 'email-address',
          label: 'Email address',
          value: '',
          source: 'user_supplies',
          note: 'You enter this yourself.',
        },
      );

      return buildHandoff({
        id: `clave-registration-${typed.matterId}-${typed.route}`,
        adapterId: CLAVE_ADAPTER_ID,
        jurisdiction: ES,
        title: `Register in Cl@ve — ${typed.route.replace(/_/g, ' ')} route`,
        purpose:
          'Obtain your own Cl@ve identification so you can deal with Spanish administrations electronically, ' +
          'under your own control.',
        destinationUrl: ROUTE_DESTINATION[typed.route],
        generatedOn: typed.generatedOn,
        steps: stepsForRoute(typed.route),
        documents: documentsForRoute(typed.route),
        fields,
        bringBack: [
          {
            id: 'clave-registration-reference',
            title: 'Registration confirmation reference',
            description:
              'The reference or receipt shown when registration completes. This is what Meridian records — ' +
              'never the credential itself.',
            kind: 'reference_number',
          },
          {
            id: 'clave-registration-date',
            title: 'Date the registration completed',
            description: 'The civil date on which the account became usable.',
            kind: 'appointment_datetime',
          },
        ],
        citations: [ES_CLAVE_PORTAL, ES_LEY_39_2015_ART_9, ES_LEY_39_2015_ART_12, ES_CLAVE_VIDEO_REGISTRATION],
        caveats: CLAVE_CAVEATS,
      });
    },

    readinessChecklist<T extends ClaveReadinessInput>(
      input: T & CredentialFree<T>,
    ): Result<ClaveReadinessChecklist, MeridianError> {
      const guarded = guardCredentialFree(input as ClaveReadinessInput);
      if (!guarded.ok) return guarded;

      const typed = input as ClaveReadinessInput;
      if (!CLAVE_REGISTRATION_ROUTES.includes(typed.route)) {
        return err(
          new MeridianError('INVALID_INPUT', `Unknown Cl@ve registration route: ${String(typed.route)}`, {
            known: CLAVE_REGISTRATION_ROUTES,
          }),
        );
      }
      if (!isIsoDate(typed.asOf)) {
        return err(new MeridianError('INVALID_INPUT', `asOf is not a valid civil date: ${String(typed.asOf)}`));
      }

      const items: ReadinessItem[] = [
        {
          id: 'identity-document',
          title: 'A DNI or a NIE',
          detail:
            'Registration is made against a Spanish identity number. Without one, no route is open and the ' +
            'prior step is obtaining the number itself.',
          required: true,
          status: typed.identityDocument === 'none' ? 'not_satisfied' : 'satisfied',
          citationIds: [ES_CLAVE_PORTAL.id],
        },
        {
          id: 'mobile-second-factor',
          title: 'A mobile number that can receive the second factor',
          detail:
            'The second factor is sent to a number you control. Whether a non-Spanish number is accepted is ' +
            'administrative practice — confirm on the official site before depending on it.',
          required: true,
          status: statusOf(typed.hasMobileForSecondFactor),
          citationIds: [ES_CLAVE_PORTAL.id],
        },
        {
          id: 'email-address',
          title: 'An email address',
          detail: 'Used for confirmations.',
          required: true,
          status: statusOf(typed.hasEmailAddress),
          citationIds: [ES_CLAVE_PORTAL.id],
        },
      ];

      if (typed.route === 'in_person_office' || typed.route === 'video_call') {
        items.push({
          id: 'appointment',
          title: 'An appointment for the chosen channel',
          detail:
            'Appointment capacity is the binding constraint on both of these routes far more often than any ' +
            'document is.',
          required: true,
          status: statusOf(typed.hasAppointment),
          citationIds: [ES_CLAVE_PORTAL.id, ES_CLAVE_VIDEO_REGISTRATION.id],
        });
      }

      if (typed.route === 'video_call') {
        items.push({
          id: 'camera-and-microphone',
          title: 'A device with camera and microphone',
          detail: CLAVE_VIDEO_IDENTIFICATION_REQUIREMENTS.join(' '),
          required: true,
          status: statusOf(typed.hasCameraAndMicrophone),
          citationIds: [ES_CLAVE_VIDEO_REGISTRATION.id],
        });
      }

      if (typed.route === 'invitation_letter') {
        items.push({
          id: 'spanish-postal-address-on-file',
          title: 'A correct Spanish address on file with the issuing body',
          detail:
            'The letter is posted to the address the body already holds for you and cannot be redirected. If ' +
            'that address is wrong, correcting it is the first task, not this route.',
          required: true,
          status: statusOf(typed.hasSpanishFiscalAddress),
          citationIds: [ES_CLAVE_PORTAL.id],
        });
      }

      if (typed.route === 'electronic_certificate') {
        items.push({
          id: 'electronic-certificate',
          title: 'A valid electronic certificate or a DNIe with a reader',
          detail:
            'Note the circularity: many people obtain their certificate using Cl@ve, so this route is usually ' +
            'open only to someone who already had electronic identification for another reason.',
          required: true,
          status: statusOf(typed.holdsElectronicCertificateOrDnie),
          citationIds: [ES_CLAVE_PORTAL.id],
        });
      }

      const required = items.filter((i) => i.required);
      return ok(
        Object.freeze({
          route: typed.route,
          generatedOn: typed.asOf,
          items: Object.freeze(items),
          readyToProceed: required.every((i) => i.status === 'satisfied'),
          unresolvedItemIds: Object.freeze(required.filter((i) => i.status === 'unknown').map((i) => i.id)),
        }),
      );
    },

    requestIdentityAssertion,
  };
}
