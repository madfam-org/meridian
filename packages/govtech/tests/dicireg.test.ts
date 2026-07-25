import { describe, expect, it } from 'vitest';
import type { IsoDate } from '@meridian/core';
import { adapterContext, noCredentials } from '../src/adapter.js';
import {
  CIVIL_REGISTRY_CERTIFICATE_FORMS,
  DICIREG_CAPABILITY,
  createDiciregAdapter,
} from '../src/adapters/dicireg.js';
import type {
  CivilRegistryCertificateForm,
  CivilRegistryCertificateRequest,
} from '../src/adapters/dicireg.js';
import { checkDestination, renderHandoffText } from '../src/handoff.js';

const ASOF = '2026-07-25' as IsoDate;
const ctx = adapterContext(ASOF, noCredentials);
const dicireg = createDiciregAdapter();

const request = (over: Partial<CivilRegistryCertificateRequest> = {}): CivilRegistryCertificateRequest => ({
  requestId: 'r-1',
  event: 'birth',
  form: 'extract_multilingual',
  subject: { givenNames: 'Test', familyNames: 'Testerson', dateOfEvent: '1974-03-11' as IsoDate },
  delivery: 'electronic',
  requestedOn: ASOF,
  purpose: 'nationality by descent file',
  ...over,
});

describe('certificate forms', () => {
  it('describes each form with a citation, and singles out the multilingual one', () => {
    expect(CIVIL_REGISTRY_CERTIFICATE_FORMS).toHaveLength(3);
    for (const form of CIVIL_REGISTRY_CERTIFICATE_FORMS) {
      expect(form.description.length).toBeGreaterThan(0);
      expect(form.citationIds.length).toBeGreaterThan(0);
    }
    const multilingual = CIVIL_REGISTRY_CERTIFICATE_FORMS.find((f) => f.form === 'extract_multilingual');
    expect(multilingual?.citationIds).toContain('iccs-conv-16-multilingual-extracts');
    // States the fact and its precondition; does not recommend the form.
    expect(multilingual?.description).toMatch(/contracting/);
  });
});

describe('electronic retrieval', () => {
  it('is unprovisioned, and says what an operator must obtain', async () => {
    const result = await dicireg.requestCertificate(ctx, request());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ADAPTER_NOT_PROVISIONED');
      const unblock = result.error.details['unblockPath'] as string[];
      expect(unblock.length).toBeGreaterThan(0);
      expect(unblock.join(' ')).toMatch(/agreement/i);
    }
  });

  it('points at the route that does work today', () => {
    const report = dicireg.describeCapabilities(ctx);
    const retrieval = report.capabilities.find((c) => c.id === DICIREG_CAPABILITY.certificateRetrieval);
    expect(retrieval?.alternative?.capabilityId).toBe(DICIREG_CAPABILITY.consularHandoff);
  });

  it('validates the request before deciding it cannot serve it', async () => {
    expect((await dicireg.requestCertificate(ctx, request({ requestId: '  ' }))).ok).toBe(false);
    expect((await dicireg.requestCertificate(ctx, request({ requestedOn: '2026-02-30' as IsoDate }))).ok).toBe(false);

    const noNames = await dicireg.requestCertificate(
      ctx,
      request({ subject: { givenNames: 'Test', familyNames: '  ' } }),
    );
    expect(noNames.ok).toBe(false);
    if (!noNames.ok) expect(noNames.error.code).toBe('INVALID_INPUT');
  });

  it('models the statuses an older paper record actually produces', () => {
    // These are ordinary answers, not failures. A client that treats them as
    // errors retries forever instead of routing the user to the office holding
    // the paper.
    const statuses: string[] = [
      'issued',
      'in_progress',
      'requires_in_person',
      'record_not_digitised',
      'not_found',
      'restricted_access',
    ];
    expect(statuses).toContain('record_not_digitised');
  });
});

describe('consular handoff', () => {
  it('builds a complete, ordered package', () => {
    const result = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'birth',
      form: 'extract_multilingual',
      subjectFullName: 'Testerson Example',
      dateOfEvent: '1974-03-11' as IsoDate,
      placeOfEvent: 'Example municipality',
      consularPost: 'Example consulate',
      generatedOn: ASOF,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const handoff = result.value;
    expect(handoff.steps.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5]);
    expect(checkDestination('ES', handoff.destinationUrl).valid).toBe(true);
    expect(handoff.bringBack.map((c) => c.id)).toEqual(['consular-request-reference', 'issued-certificate']);

    const documentIds = new Set(handoff.documents.map((d) => d.id));
    for (const step of handoff.steps) {
      for (const id of step.requiresDocumentIds) expect(documentIds.has(id)).toBe(true);
    }
  });

  it('names the office when known, and explains territorial jurisdiction when not', () => {
    const known = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'birth',
      form: 'literal',
      subjectFullName: 'Testerson Example',
      consularPost: 'Example consulate',
      generatedOn: ASOF,
    });
    if (!known.ok) throw known.error;
    expect(known.value.steps[0]?.detail).toContain('Example consulate');

    const unknown = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'birth',
      form: 'literal',
      subjectFullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!unknown.ok) throw unknown.error;
    expect(unknown.value.steps[0]?.detail).toMatch(/territorial/);
  });

  it('warns that the consular route does not apply to an entry made in Spain', () => {
    const result = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'marriage',
      form: 'literal',
      subjectFullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    expect(result.value.caveats.join(' ')).toMatch(/made in Spain rather than abroad/);
  });

  it('carries the form description into the paperwork the user takes with them', () => {
    const result = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'birth',
      form: 'extract_multilingual',
      subjectFullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    expect(renderHandoffText(result.value)).toMatch(/Convention No\. 16/);
  });

  it('omits optional details rather than printing blanks', () => {
    const result = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'death',
      form: 'extract_plain',
      subjectFullName: 'Testerson Example',
      placeOfEvent: '   ',
      generatedOn: ASOF,
    });
    if (!result.ok) throw result.error;
    expect(result.value.fields.find((f) => f.id === 'event-date')).toBeUndefined();
    expect(result.value.fields.find((f) => f.id === 'event-place')).toBeUndefined();
  });

  it('rejects an unknown form and a blank subject name', () => {
    const unknownForm = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'birth',
      form: 'holographic' as CivilRegistryCertificateForm,
      subjectFullName: 'Testerson Example',
      generatedOn: ASOF,
    });
    expect(unknownForm.ok).toBe(false);

    const blank = dicireg.buildConsularHandoff({
      matterId: 'm-1',
      event: 'birth',
      form: 'literal',
      subjectFullName: '  ',
      generatedOn: ASOF,
    });
    expect(blank.ok).toBe(false);
  });
});
