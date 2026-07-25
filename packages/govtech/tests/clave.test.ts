import { describe, expect, it } from 'vitest';
import type { IsoDate } from '@meridian/core';
import { adapterContext, noCredentials, presenceFrom } from '../src/adapter.js';
import {
  CLAVE_CAPABILITY,
  CLAVE_CONFIG_KEYS,
  CLAVE_REGISTRATION_ROUTES,
  CLAVE_VIDEO_IDENTIFICATION_REQUIREMENTS,
  createClaveAdapter,
} from '../src/adapters/clave.js';
import type {
  ClaveDelegatedAuthentication,
  ClaveReadinessInput,
  ClaveRegistrationRoute,
} from '../src/adapters/clave.js';
import { checkDestination, renderHandoffText } from '../src/handoff.js';

const ASOF = '2026-07-25' as IsoDate;
const ctx = adapterContext(ASOF, noCredentials);
const clave = createClaveAdapter();

const readiness = (over: Partial<ClaveReadinessInput> = {}): ClaveReadinessInput => ({
  route: 'in_person_office',
  identityDocument: 'nie',
  hasSpanishFiscalAddress: 'yes',
  holdsElectronicCertificateOrDnie: 'yes',
  hasMobileForSecondFactor: 'yes',
  hasEmailAddress: 'yes',
  hasAppointment: 'yes',
  hasCameraAndMicrophone: 'yes',
  asOf: ASOF,
  ...over,
});

describe('registration handoff', () => {
  it.each(CLAVE_REGISTRATION_ROUTES)('builds a complete, ordered handoff for the %s route', (route) => {
    const result = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route,
      fullName: 'Testerson Example',
      identityDocumentNumber: 'X0000000X',
      generatedOn: ASOF,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const handoff = result.value;
    expect(handoff.steps.length).toBeGreaterThanOrEqual(3);
    expect(handoff.steps.map((s) => s.ordinal)).toEqual(handoff.steps.map((_, i) => i + 1));
    expect(handoff.documents.length).toBeGreaterThan(0);
    expect(handoff.bringBack.length).toBeGreaterThan(0);
    expect(handoff.citations.length).toBeGreaterThan(0);
    expect(checkDestination('ES', handoff.destinationUrl).valid).toBe(true);

    // Every document a step references must be in the package the user carries.
    const documentIds = new Set(handoff.documents.map((d) => d.id));
    for (const step of handoff.steps) {
      for (const id of step.requiresDocumentIds) expect(documentIds.has(id)).toBe(true);
    }
  });

  it.each(CLAVE_REGISTRATION_ROUTES)(
    'tells the user, in writing, that Meridian will never ask for their PIN (%s)',
    (route) => {
      const result = clave.buildRegistrationHandoff({
        matterId: 'm-1',
        route,
        fullName: 'Testerson Example',
        generatedOn: ASOF,
      });
      if (!result.ok) throw result.error;
      const text = renderHandoffText(result.value);
      expect(text).toMatch(/never asks for, stores or transmits your Cl@ve PIN/);
      expect(text).toMatch(/that is a defect/);
    },
  );

  it('carries the documented video identification conditions on the video route', () => {
    const result = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'video_call',
      fullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    const detail = result.value.steps[0]?.detail ?? '';
    for (const condition of CLAVE_VIDEO_IDENTIFICATION_REQUIREMENTS) {
      expect(detail).toContain(condition);
    }
    expect(result.value.steps.some((s) => s.channel === 'video_call')).toBe(true);
  });

  it('states the invitation-letter code is entered by the user and refused if sent to us', () => {
    const result = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'invitation_letter',
      fullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    const text = renderHandoffText(result.value);
    expect(text).toMatch(/single-use/);
    expect(text).toMatch(/will refuse it if it is sent to us/);
  });

  it('classifies a handoff with no computed values as information', () => {
    const result = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'in_person_office',
      fullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    expect(result.value.classification).toBe('information');
  });

  it('leaves the second-factor destination for the user to supply', () => {
    const result = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'in_person_office',
      fullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    const mobile = result.value.fields.find((f) => f.id === 'mobile-number');
    expect(mobile?.source).toBe('user_supplies');
    expect(mobile?.value).toBe('');
  });

  it('omits the document number field when there is none, rather than printing a blank', () => {
    const result = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'in_person_office',
      fullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    expect(result.value.fields.find((f) => f.id === 'identity-document-number')).toBeUndefined();
  });

  it('rejects an unknown route and a blank name', () => {
    const unknown = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'teleportation' as ClaveRegistrationRoute,
      fullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    expect(unknown.ok).toBe(false);

    const blank = clave.buildRegistrationHandoff({
      matterId: 'm-1',
      route: 'in_person_office',
      fullName: '   ',
      generatedOn: ASOF,
    });
    expect(blank.ok).toBe(false);
  });
});

describe('readiness checklist', () => {
  it('is ready only when every required item is satisfied', () => {
    const result = clave.readinessChecklist(readiness());
    if (!result.ok) throw result.error;
    expect(result.value.readyToProceed).toBe(true);
    expect(result.value.unresolvedItemIds).toEqual([]);
  });

  it('treats unknown as not ready, and says which question is open', () => {
    // "We did not ask" must not read as "fine". This is the difference between
    // a user who brings the right thing and one who loses an appointment.
    const result = clave.readinessChecklist(readiness({ hasMobileForSecondFactor: 'unknown' }));
    if (!result.ok) throw result.error;
    expect(result.value.readyToProceed).toBe(false);
    expect(result.value.unresolvedItemIds).toEqual(['mobile-second-factor']);
  });

  it('is not ready without a Spanish identity number, on any route', () => {
    for (const route of CLAVE_REGISTRATION_ROUTES) {
      const result = clave.readinessChecklist(readiness({ route, identityDocument: 'none' }));
      if (!result.ok) throw result.error;
      expect(result.value.readyToProceed).toBe(false);
      expect(result.value.items.find((i) => i.id === 'identity-document')?.status).toBe('not_satisfied');
    }
  });

  it('asks about an appointment only where the route needs one', () => {
    const hasItem = (route: ClaveRegistrationRoute, id: string): boolean => {
      const result = clave.readinessChecklist(readiness({ route }));
      if (!result.ok) throw result.error;
      return result.value.items.some((i) => i.id === id);
    };
    expect(hasItem('in_person_office', 'appointment')).toBe(true);
    expect(hasItem('video_call', 'appointment')).toBe(true);
    expect(hasItem('invitation_letter', 'appointment')).toBe(false);
    expect(hasItem('electronic_certificate', 'appointment')).toBe(false);
  });

  it('asks about the address only on the letter route, and the certificate only on its own', () => {
    const items = (route: ClaveRegistrationRoute): string[] => {
      const result = clave.readinessChecklist(readiness({ route }));
      if (!result.ok) throw result.error;
      return result.value.items.map((i) => i.id);
    };
    expect(items('invitation_letter')).toContain('spanish-postal-address-on-file');
    expect(items('video_call')).not.toContain('spanish-postal-address-on-file');
    expect(items('electronic_certificate')).toContain('electronic-certificate');
    expect(items('video_call')).toContain('camera-and-microphone');
    expect(items('in_person_office')).not.toContain('camera-and-microphone');
  });

  it('blocks the letter route when the address on file is wrong', () => {
    const result = clave.readinessChecklist(readiness({ route: 'invitation_letter', hasSpanishFiscalAddress: 'no' }));
    if (!result.ok) throw result.error;
    expect(result.value.readyToProceed).toBe(false);
  });

  it('rejects an impossible date and an unknown route', () => {
    expect(clave.readinessChecklist(readiness({ asOf: '2026-02-30' as IsoDate })).ok).toBe(false);
    expect(clave.readinessChecklist(readiness({ route: 'invented' as ClaveRegistrationRoute })).ok).toBe(false);
  });
});

describe('delegated identity assertion', () => {
  it('refuses because nothing is provisioned, naming what is missing', async () => {
    const result = await clave.requestIdentityAssertion(ctx, {
      matterId: 'm-1',
      returnUrl: 'https://app.example.invalid/return',
      requestedAttributes: ['identifier', 'family_name'],
      requestedOn: ASOF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ADAPTER_NOT_PROVISIONED');
      const outstanding = result.error.details['outstandingRequirements'] as { key: string }[];
      expect(outstanding.map((r) => r.key)).toContain(CLAVE_CONFIG_KEYS.agreement);
    }
  });

  it('rejects a non-https return URL before it reaches the gate', async () => {
    const result = await clave.requestIdentityAssertion(ctx, {
      matterId: 'm-1',
      returnUrl: 'http://app.example.invalid/return',
      requestedAttributes: ['identifier'],
      requestedOn: ASOF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_INPUT');
  });

  it('rejects an impossible request date', async () => {
    const result = await clave.requestIdentityAssertion(ctx, {
      matterId: 'm-1',
      returnUrl: 'https://app.example.invalid/return',
      requestedAttributes: ['identifier'],
      requestedOn: '2026-13-01' as IsoDate,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_INPUT');
  });

  it('stays unprovisioned when a transport exists but the agreement does not', async () => {
    const transport: ClaveDelegatedAuthentication = {
      schemeName: 'test-double',
      requestAssertion: async () => ({
        issuedOn: ASOF,
        subjectIdentifier: 'X0000000X',
        attributes: {},
        assuranceLevel: 'substantial',
        assertionReference: 'A-1',
      }),
    };
    const adapter = createClaveAdapter({ delegatedAuthentication: transport });
    const result = await adapter.requestIdentityAssertion(ctx, {
      matterId: 'm-1',
      returnUrl: 'https://app.example.invalid/return',
      requestedAttributes: ['identifier'],
      requestedOn: ASOF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ADAPTER_NOT_PROVISIONED');
  });

  it('consumes an assertion, and only an assertion, once fully provisioned', async () => {
    const transport: ClaveDelegatedAuthentication = {
      schemeName: 'test-double',
      requestAssertion: async () => ({
        issuedOn: ASOF,
        subjectIdentifier: 'X0000000X',
        attributes: { family_name: 'TESTERSON' },
        assuranceLevel: 'high',
        assertionReference: 'A-1',
      }),
    };
    const provisioned = adapterContext(
      ASOF,
      presenceFrom({
        [CLAVE_CONFIG_KEYS.agreement]: 'ref',
        [CLAVE_CONFIG_KEYS.signingKey]: 'ref',
        [CLAVE_CONFIG_KEYS.endpoint]: 'https://example.invalid',
      }),
    );
    const adapter = createClaveAdapter({ delegatedAuthentication: transport });

    const report = adapter.describeCapabilities(provisioned);
    expect(report.capabilities.find((c) => c.id === CLAVE_CAPABILITY.identityAssertion)?.state).toBe('available');

    const result = await adapter.requestIdentityAssertion(provisioned, {
      matterId: 'm-1',
      returnUrl: 'https://app.example.invalid/return',
      requestedAttributes: ['identifier', 'family_name'],
      requestedOn: ASOF,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assuranceLevel).toBe('high');
      // The returned shape has nowhere to put a reusable credential.
      expect(Object.keys(result.value).sort()).toEqual([
        'assertionReference',
        'assuranceLevel',
        'attributes',
        'issuedOn',
        'subjectIdentifier',
      ]);
    }
  });

  it('reports a scheme failure rather than inventing an identity', async () => {
    const failing: ClaveDelegatedAuthentication = {
      schemeName: 'test-double',
      requestAssertion: async () => {
        throw new Error('scheme returned 503');
      },
    };
    const provisioned = adapterContext(
      ASOF,
      presenceFrom({
        [CLAVE_CONFIG_KEYS.agreement]: 'ref',
        [CLAVE_CONFIG_KEYS.signingKey]: 'ref',
        [CLAVE_CONFIG_KEYS.endpoint]: 'https://example.invalid',
      }),
    );
    const result = await createClaveAdapter({ delegatedAuthentication: failing }).requestIdentityAssertion(
      provisioned,
      {
        matterId: 'm-1',
        returnUrl: 'https://app.example.invalid/return',
        requestedAttributes: ['identifier'],
        requestedOn: ASOF,
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ADAPTER_UNAVAILABLE');
      expect(result.error.message).toMatch(/503/);
    }
  });
});

describe('the refusals are declared, not merely absent', () => {
  it('declares credential storage and acting as the user as permanent refusals', () => {
    const report = clave.describeCapabilities(ctx);
    for (const id of [CLAVE_CAPABILITY.credentialCustody, CLAVE_CAPABILITY.actAsUser]) {
      const capability = report.capabilities.find((c) => c.id === id);
      expect(capability?.state).toBe('refused_by_policy');
      expect(capability?.unblockPath).toEqual([]);
      expect(capability?.alternative?.capabilityId).toBe(CLAVE_CAPABILITY.registrationHandoff);
    }
  });

  it('exposes no function that could store a credential', () => {
    const surface = Object.keys(clave).sort();
    expect(surface).toEqual([
      'buildRegistrationHandoff',
      'describeCapabilities',
      'displayName',
      'governmentOperations',
      'id',
      'jurisdiction',
      'readinessChecklist',
      'requestIdentityAssertion',
      'summary',
    ]);
  });
});
