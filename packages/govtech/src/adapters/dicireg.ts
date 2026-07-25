/**
 * The Spanish civil registry, in its digital form (DICIREG).
 *
 * Civil registry certificates are the load-bearing documents of a migration
 * matter — birth records prove descent for nationality routes, marriage records
 * prove the relationship a family permit rests on — and they are also the most
 * common single cause of a stalled file, because the record you need is often
 * held by an office that has not yet digitised it.
 *
 * Two things follow, and they shape this adapter:
 *
 *  1. **Electronic retrieval is unprovisioned, not impossible.** The request and
 *     response shapes are modelled here in full, so that granting access is a
 *     configuration change — implement {@link CivilRegistryTransport}, inject it,
 *     provision the endpoint — rather than a rewrite of everything that depends
 *     on the certificate. Nothing about the modelling implies we have access.
 *  2. **The consular route works today**, for events registered abroad, and it is
 *     what a migrant actually needs: someone in Buenos Aires trying to prove a
 *     Spanish grandparent deals with a consulate, not with a sede they cannot
 *     authenticate to. That handoff is implemented.
 *
 * The rollout caveat is not a footnote. Whether a 1974 birth entry in a
 * particular municipality is electronically retrievable is a question about that
 * office's digitisation backlog, and an integration that assumes national
 * coverage will fail precisely for the older records that migration matters need
 * most.
 */

import type { CountryCode, IsoDate, Result } from '@meridian/core';
import { MeridianError, countryCode, err, isIsoDate, ok } from '@meridian/core';
import type { AdapterContext, GovTechAdapter, GovernmentOperationProbe } from '../adapter.js';
import { requireCapability } from '../adapter.js';
import type { Capability, CapabilityReport, CapabilityRequirement } from '../capability.js';
import { capability, capabilityReport, requirement, stateFromRequirements } from '../capability.js';
import type { CredentialFree } from '../credential-guard.js';
import { guardCredentialFree } from '../credential-guard.js';
import type { AssistedHandoff, HandoffDocument, HandoffField } from '../handoff.js';
import { buildHandoff } from '../handoff.js';
import {
  ES_DICIREG_ROLLOUT,
  ES_LEY_20_2011_REGISTRO_CIVIL,
  ES_LEY_39_2015_ART_12,
  ES_REGISTRO_CIVIL_CONSULAR,
  ICCS_CONVENTION_16_MULTILINGUAL_EXTRACTS,
} from '../citations.js';

export const DICIREG_ADAPTER_ID = 'es-dicireg';

const ES: CountryCode = countryCode('ES');

export const DICIREG_CAPABILITY = {
  certificateRetrieval: 'dicireg.certificate_retrieval',
  consularHandoff: 'dicireg.consular_handoff',
  credentialCustody: 'dicireg.credential_custody',
} as const;

export const DICIREG_CONFIG_KEYS = {
  agreement: 'MERIDIAN_DICIREG_AGREEMENT_REF',
  clientCertificate: 'MERIDIAN_DICIREG_CLIENT_CERTIFICATE_REF',
  endpoint: 'MERIDIAN_DICIREG_ENDPOINT',
} as const;

/* -------------------------------------------------------------------------- */
/* Request and response model                                                 */
/* -------------------------------------------------------------------------- */

export type CivilRegistryEvent = 'birth' | 'marriage' | 'death';

/**
 * The forms a certificate can take.
 *
 * `extract_multilingual` is singled out because it removes an entire
 * sub-process: issued under ICCS Convention No. 16, it is accepted between
 * contracting states without legalisation or apostille. That is a fact about the
 * instrument. Whether a particular destination accepts it is a question for the
 * receiving authority, and this package states the fact without recommending the
 * form — recommending would be `advice` within the meaning of the disclosure
 * boundary in `@meridian/core`.
 */
export type CivilRegistryCertificateForm = 'literal' | 'extract_plain' | 'extract_multilingual';

export interface CertificateFormDescription {
  readonly form: CivilRegistryCertificateForm;
  readonly description: string;
  readonly citationIds: readonly string[];
}

export const CIVIL_REGISTRY_CERTIFICATE_FORMS: readonly CertificateFormDescription[] = Object.freeze([
  {
    form: 'literal',
    description:
      'A full transcription of the registry entry, including marginal notes. Used where the receiving body ' +
      'needs the complete record rather than a summary.',
    citationIds: [ES_LEY_20_2011_REGISTRO_CIVIL.id],
  },
  {
    form: 'extract_plain',
    description: 'A summary of the essential particulars of the entry, in Spanish.',
    citationIds: [ES_LEY_20_2011_REGISTRO_CIVIL.id],
  },
  {
    form: 'extract_multilingual',
    description:
      'A summary issued on the multilingual form established by ICCS Convention No. 16, accepted between ' +
      'contracting states without further legalisation. The exemption depends on the destination state being ' +
      'a contracting party — confirm that before relying on it.',
    citationIds: [ICCS_CONVENTION_16_MULTILINGUAL_EXTRACTS.id, ES_LEY_20_2011_REGISTRO_CIVIL.id],
  },
]);

export interface CivilRegistryPlace {
  readonly municipality: string;
  readonly provinceOrRegion?: string;
  /** ISO 3166-1 alpha-2 of the country the event occurred in. */
  readonly country: string;
}

export interface CivilRegistrySubject {
  readonly givenNames: string;
  readonly familyNames: string;
  readonly dateOfEvent?: IsoDate;
  readonly placeOfEvent?: CivilRegistryPlace;
  /** Needed to disambiguate a birth entry where names repeat within a municipality. */
  readonly parentNames?: readonly string[];
}

export interface CivilRegistryCertificateRequest {
  readonly requestId: string;
  readonly event: CivilRegistryEvent;
  readonly form: CivilRegistryCertificateForm;
  readonly subject: CivilRegistrySubject;
  /** The office believed to hold the entry, when known. Narrows an otherwise national search. */
  readonly registryOfficeHint?: string;
  readonly delivery: 'electronic' | 'postal' | 'collect_in_person';
  readonly requestedOn: IsoDate;
  /** Why the certificate is needed. Some entries are restricted-access. */
  readonly purpose: string;
}

/**
 * Statuses a real integration must handle.
 *
 * `record_not_digitised` and `requires_in_person` are not error cases — they are
 * the ordinary answers for older entries, and a client that treats them as
 * failures will retry forever instead of routing the user to the office that
 * holds the paper.
 */
export type CivilRegistryRequestStatus =
  | 'issued'
  | 'in_progress'
  | 'requires_in_person'
  | 'record_not_digitised'
  | 'not_found'
  | 'restricted_access';

export interface CivilRegistryCertificateResponse {
  readonly requestId: string;
  readonly status: CivilRegistryRequestStatus;
  readonly registryOffice?: string;
  readonly issuedOn?: IsoDate;
  /**
   * Opaque reference to the issued document in the authority's system — never
   * the document bytes. Retrieval of content is a separate, separately-audited
   * act.
   */
  readonly documentReference?: string;
  /** What the user must do next, in their own words, for any non-issued status. */
  readonly guidance: readonly string[];
}

/**
 * The seam a provisioned integration implements.
 *
 * Deliberately the whole contract: one method, plain data in, plain data out.
 * When access is granted, the work is implementing this interface against the
 * authority's actual protocol and injecting it — not touching anything that
 * consumes certificates.
 */
export interface CivilRegistryTransport {
  /** Human name of the configured endpoint, for the status board. */
  readonly endpointName: string;
  requestCertificate(request: CivilRegistryCertificateRequest): Promise<CivilRegistryCertificateResponse>;
}

export interface DiciregAdapterOptions {
  readonly transport?: CivilRegistryTransport | null;
}

/* -------------------------------------------------------------------------- */
/* Consular handoff                                                           */
/* -------------------------------------------------------------------------- */

export interface DiciregConsularHandoffInput {
  readonly matterId: string;
  readonly event: CivilRegistryEvent;
  readonly form: CivilRegistryCertificateForm;
  readonly subjectFullName: string;
  readonly dateOfEvent?: IsoDate;
  readonly placeOfEvent?: string;
  /** The consular office with jurisdiction over the applicant's residence, when known. */
  readonly consularPost?: string;
  readonly generatedOn: IsoDate;
}

const IDENTITY_DOCUMENT: HandoffDocument = Object.freeze({
  id: 'identity-document',
  title: 'Your identity document or passport',
  description: 'Proves who is making the request. Consular offices generally require the original at the counter.',
  origin: 'applicant',
  originalRequired: true,
});

const RELATIONSHIP_EVIDENCE: HandoffDocument = Object.freeze({
  id: 'relationship-evidence',
  title: 'Evidence of your connection to the entry, if you are not its subject',
  description:
    'Access to some entries is restricted to the subject and to people who can show a legitimate interest. ' +
    'A family book, a prior certificate, or an earlier certificate naming you will usually serve.',
  origin: 'applicant',
  originalRequired: false,
});

const EVENT_DETAILS_NOTE: HandoffDocument = Object.freeze({
  id: 'event-details',
  title: 'Everything you know about the entry',
  description:
    'Date, municipality, and the names of the parents for a birth entry. Consular searches are made by hand ' +
    'far more often than people expect, and a missing parent name can be the difference between a search that ' +
    'succeeds and one that is returned as not found.',
  origin: 'applicant',
  originalRequired: false,
});

/* -------------------------------------------------------------------------- */
/* Adapter                                                                    */
/* -------------------------------------------------------------------------- */

export interface DiciregAdapter extends GovTechAdapter {
  requestCertificate<T extends CivilRegistryCertificateRequest>(
    ctx: AdapterContext,
    request: T & CredentialFree<T>,
  ): Promise<Result<CivilRegistryCertificateResponse, MeridianError>>;
  buildConsularHandoff<T extends DiciregConsularHandoffInput>(
    input: T & CredentialFree<T>,
  ): Result<AssistedHandoff, MeridianError>;
}

export function createDiciregAdapter(options: DiciregAdapterOptions = {}): DiciregAdapter {
  const transport = options.transport ?? null;

  const retrievalRequirements = (ctx: AdapterContext): readonly CapabilityRequirement[] =>
    Object.freeze([
      requirement(
        DICIREG_CONFIG_KEYS.agreement,
        'agreement',
        'Reference to the agreement or authorisation permitting programmatic access to registry data. ' +
          'Certificate data is personal data about identified individuals; access without an instrument is ' +
          'not a technical shortcut, it is a different legal question.',
        ctx.hasCredential(DICIREG_CONFIG_KEYS.agreement),
      ),
      requirement(
        DICIREG_CONFIG_KEYS.clientCertificate,
        'service_secret',
        'Reference to Meridian\'s own client certificate for mutual authentication with the endpoint, held ' +
          'in a key store. The platform\'s credential, not any user\'s.',
        ctx.hasCredential(DICIREG_CONFIG_KEYS.clientCertificate),
      ),
      requirement(
        DICIREG_CONFIG_KEYS.endpoint,
        'endpoint',
        'The registry endpoint this deployment is registered against.',
        ctx.hasCredential(DICIREG_CONFIG_KEYS.endpoint),
      ),
      requirement(
        'dicireg.transport',
        'transport',
        'An injected CivilRegistryTransport. This package ships no implementation, so the requirement cannot ' +
          'be satisfied from inside it.',
        transport !== null,
      ),
    ]);

  const describeCapabilities = (ctx: AdapterContext): CapabilityReport => {
    const retrievalReqs = retrievalRequirements(ctx);

    const capabilities: readonly Capability[] = [
      capability({
        id: DICIREG_CAPABILITY.certificateRetrieval,
        title: 'Retrieve a civil registry certificate electronically',
        surface: 'government_system',
        state: stateFromRequirements(retrievalReqs, 'not_provisioned'),
        reason:
          transport === null
            ? 'Request and response shapes are modelled and stable, but no access agreement, no client ' +
              'certificate, no endpoint and no transport exist. Granting access is a configuration change; ' +
              'until then this returns nothing.'
            : `A transport (${transport.endpointName}) is wired; remaining state depends on the configured ` +
              'agreement, client certificate and endpoint.',
        requirements: retrievalReqs,
        unblockPath: [
          'Obtain the agreement or authorisation permitting programmatic access.',
          'Provision a client certificate for mutual authentication and record its key-store reference.',
          'Configure the registry endpoint for the deployment.',
          'Implement CivilRegistryTransport against the authority\'s protocol and inject it.',
        ],
        alternative: {
          capabilityId: DICIREG_CAPABILITY.consularHandoff,
          description:
            'For events registered abroad, the consular route is available today and is handled by handoff. ' +
            'For events registered in Spain, the user requests the certificate through the ministry\'s own ' +
            'electronic office or at the registry office holding the entry.',
        },
        citations: [ES_LEY_20_2011_REGISTRO_CIVIL, ES_DICIREG_ROLLOUT],
      }),
      capability({
        id: DICIREG_CAPABILITY.consularHandoff,
        title: 'Build a consular civil registry request handoff',
        surface: 'local_computation',
        state: 'available',
        reason:
          'Restates the consular request procedure as an ordered package the user carries themselves. This is ' +
          'the route that works today for events registered abroad.',
        citations: [ES_REGISTRO_CIVIL_CONSULAR, ES_LEY_39_2015_ART_12],
      }),
      capability({
        id: DICIREG_CAPABILITY.credentialCustody,
        title: 'Hold a user\'s Cl@ve or certificate passphrase to access the registry as them',
        surface: 'government_system',
        state: 'refused_by_policy',
        reason:
          'Refused permanently. Authenticating to the ministry\'s electronic office as the user requires the ' +
          'user\'s own identification means; holding it would put the platform in custody of a state identity ' +
          'credential in order to fetch a document the user can request themselves.',
        policy: 'no_credential_custody',
        alternative: {
          capabilityId: DICIREG_CAPABILITY.consularHandoff,
          description:
            'The user requests the certificate themselves — consular route by handoff, or through the ' +
            'ministry\'s electronic office using their own identification — and brings back the reference.',
        },
        citations: [ES_LEY_39_2015_ART_12, ES_DICIREG_ROLLOUT],
      }),
    ];

    return capabilityReport(DICIREG_ADAPTER_ID, 'Registro Civil / DICIREG (Spain)', ES, ctx.asOf, capabilities);
  };

  const requestCertificate = async <T extends CivilRegistryCertificateRequest>(
    ctx: AdapterContext,
    request: T & CredentialFree<T>,
  ): Promise<Result<CivilRegistryCertificateResponse, MeridianError>> => {
    const guarded = guardCredentialFree(request as CivilRegistryCertificateRequest);
    if (!guarded.ok) return guarded;

    const typed = request as CivilRegistryCertificateRequest;
    if (typed.requestId.trim().length === 0) {
      return err(new MeridianError('INVALID_INPUT', 'A civil registry request needs an id for audit.'));
    }
    if (!isIsoDate(typed.requestedOn)) {
      return err(
        new MeridianError('INVALID_INPUT', `requestedOn is not a valid civil date: ${String(typed.requestedOn)}`),
      );
    }
    if (typed.subject.familyNames.trim().length === 0) {
      return err(new MeridianError('INVALID_INPUT', 'The subject\'s family names are required to search an entry.'));
    }

    const gate = requireCapability(describeCapabilities(ctx), DICIREG_CAPABILITY.certificateRetrieval);
    if (!gate.ok) return gate;

    // Unreachable while the transport requirement gates the capability, and kept
    // anyway: a certificate is evidence of someone's parentage or marriage, and
    // the one thing that must never happen here is a plausible-looking response
    // that no authority issued.
    if (transport === null) {
      return err(
        new MeridianError(
          'ADAPTER_UNAVAILABLE',
          'Civil registry retrieval reports available but no transport is wired. No certificate can be ' +
            'produced and none will be invented.',
          { adapterId: DICIREG_ADAPTER_ID, capabilityId: DICIREG_CAPABILITY.certificateRetrieval },
        ),
      );
    }

    try {
      return ok(await transport.requestCertificate(typed));
    } catch (cause) {
      return err(
        new MeridianError(
          'ADAPTER_UNAVAILABLE',
          `Civil registry request failed: ${cause instanceof Error ? cause.message : String(cause)}`,
          {
            adapterId: DICIREG_ADAPTER_ID,
            capabilityId: DICIREG_CAPABILITY.certificateRetrieval,
            requestId: typed.requestId,
          },
        ),
      );
    }
  };

  const governmentOperations: readonly GovernmentOperationProbe[] = Object.freeze([
    {
      capabilityId: DICIREG_CAPABILITY.certificateRetrieval,
      description: 'Civil registry certificate retrieval',
      probe: (ctx: AdapterContext) =>
        requestCertificate(ctx, {
          requestId: 'probe',
          event: 'birth' as const,
          form: 'extract_multilingual' as const,
          subject: { givenNames: 'Probe', familyNames: 'Probe' },
          delivery: 'electronic' as const,
          requestedOn: ctx.asOf,
          purpose: 'capability probe',
        }),
    },
  ]);

  return {
    id: DICIREG_ADAPTER_ID,
    jurisdiction: ES,
    displayName: 'Registro Civil / DICIREG (Spain)',
    summary:
      'Spanish civil registry. Electronic certificate retrieval is modelled but unprovisioned; the consular ' +
      'request route is available as a handoff; credential custody is refused by policy.',
    describeCapabilities,
    governmentOperations,
    requestCertificate,

    buildConsularHandoff<T extends DiciregConsularHandoffInput>(
      input: T & CredentialFree<T>,
    ): Result<AssistedHandoff, MeridianError> {
      const guarded = guardCredentialFree(input as DiciregConsularHandoffInput);
      if (!guarded.ok) return guarded;

      const typed = input as DiciregConsularHandoffInput;
      if (typed.subjectFullName.trim().length === 0) {
        return err(new MeridianError('INVALID_INPUT', 'The name of the person the entry concerns is required.'));
      }
      const formDescription = CIVIL_REGISTRY_CERTIFICATE_FORMS.find((f) => f.form === typed.form);
      if (formDescription === undefined) {
        return err(
          new MeridianError('INVALID_INPUT', `Unknown certificate form: ${String(typed.form)}`, {
            known: CIVIL_REGISTRY_CERTIFICATE_FORMS.map((f) => f.form),
          }),
        );
      }

      const fields: HandoffField[] = [
        {
          id: 'subject-name',
          label: 'Name and surnames of the person the entry concerns',
          value: typed.subjectFullName,
          source: 'user_record',
          note: 'Give the names as they were recorded at the time of the entry, which may differ from current usage.',
        },
        {
          id: 'certificate-form',
          label: 'Type of certificate requested',
          value: typed.form,
          source: 'user_record',
          note: formDescription.description,
        },
        {
          id: 'event-kind',
          label: 'Type of entry',
          value: typed.event,
          source: 'user_record',
        },
      ];
      if (typed.dateOfEvent !== undefined) {
        fields.push({
          id: 'event-date',
          label: 'Date of the event',
          value: typed.dateOfEvent,
          source: 'user_record',
          note: 'If you are unsure, give the year and say so — an approximate year still narrows a manual search.',
        });
      }
      if (typed.placeOfEvent !== undefined && typed.placeOfEvent.trim().length > 0) {
        fields.push({
          id: 'event-place',
          label: 'Place of the event',
          value: typed.placeOfEvent,
          source: 'user_record',
        });
      }

      return buildHandoff({
        id: `dicireg-consular-${typed.matterId}-${typed.event}`,
        adapterId: DICIREG_ADAPTER_ID,
        jurisdiction: ES,
        title: `Request a ${typed.event} certificate from the consular civil registry`,
        purpose:
          'Obtain the civil registry certificate your matter depends on, through the consular office with ' +
          'jurisdiction over where you live.',
        destinationUrl: 'https://www.exteriores.gob.es/',
        generatedOn: typed.generatedOn,
        steps: [
          {
            title: 'Identify the consular office with jurisdiction over your residence',
            detail:
              typed.consularPost === undefined
                ? 'Consular jurisdiction is territorial: the office that serves where you live is the one that ' +
                  'holds and issues your record. Requests sent to the wrong office are returned, not forwarded.'
                : `The office understood to have jurisdiction is ${typed.consularPost}. Confirm this on the ` +
                  'official site before sending anything — jurisdiction boundaries change.',
            actor: 'applicant',
            channel: 'online',
            citationIds: [ES_REGISTRO_CIVIL_CONSULAR.id],
          },
          {
            title: 'Read that office\'s own published requirements',
            detail:
              'Each consular office publishes its own procedure, accepted evidence, appointment system and ' +
              'delivery options. There is no single national procedure to follow here.',
            actor: 'applicant',
            channel: 'online',
            citationIds: [ES_REGISTRO_CIVIL_CONSULAR.id],
          },
          {
            title: 'Assemble what the entry needs to be found',
            detail:
              'Names as recorded, date, place, and for a birth entry the names of the parents. Incomplete ' +
              'details are the usual reason a request comes back as not found.',
            actor: 'applicant',
            channel: 'online',
            requiresDocumentIds: [EVENT_DETAILS_NOTE.id, RELATIONSHIP_EVIDENCE.id],
            citationIds: [ES_REGISTRO_CIVIL_CONSULAR.id],
          },
          {
            title: 'Submit the request through the office\'s published channel',
            detail:
              'Whether that is an appointment, a form or post is set by the office. You make the request ' +
              'yourself and in your own name.',
            actor: 'applicant',
            channel: 'in_person',
            requiresDocumentIds: [IDENTITY_DOCUMENT.id],
            citationIds: [ES_REGISTRO_CIVIL_CONSULAR.id, ES_LEY_39_2015_ART_12.id],
          },
          {
            title: 'Record the reference and the expected issue date',
            detail:
              'The reference is what lets your matter continue while the certificate is produced. Bring it back ' +
              'even if the certificate itself takes weeks.',
            actor: 'applicant',
            channel: 'online',
            citationIds: [ES_LEY_39_2015_ART_12.id],
          },
        ],
        documents: [IDENTITY_DOCUMENT, RELATIONSHIP_EVIDENCE, EVENT_DETAILS_NOTE],
        fields,
        bringBack: [
          {
            id: 'consular-request-reference',
            title: 'The request reference issued by the consular office',
            description: 'Identifies the request while it is processed.',
            kind: 'reference_number',
          },
          {
            id: 'issued-certificate',
            title: 'The certificate itself, once issued',
            description: 'Upload it to the matter so the documents package can be assembled.',
            kind: 'document_upload',
          },
        ],
        citations: [
          ES_REGISTRO_CIVIL_CONSULAR,
          ES_LEY_20_2011_REGISTRO_CIVIL,
          ES_LEY_39_2015_ART_12,
          ICCS_CONVENTION_16_MULTILINGUAL_EXTRACTS,
        ],
        caveats: [
          'Consular procedures, appointment systems and delivery options are set by each office and differ ' +
            'between them. Confirm with the office that serves you before travelling or paying anything.',
          'Which form of certificate your destination authority will accept is a question for that authority. ' +
            'A multilingual extract avoids legalisation only between states that are party to the Convention.',
          'If the entry was made in Spain rather than abroad, this consular route does not apply — the request ' +
            'goes to the registry office holding the entry.',
        ],
      });
    },
  };
}
