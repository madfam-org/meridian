/**
 * MRZ validation, and the promise that nothing about it is kept.
 *
 * The machine-readable zone is the densest concentration of identity data in a
 * migration file: document number, name, nationality, date of birth, sex marker.
 * This endpoint exists to check that a transcription is arithmetically
 * self-consistent before the number goes onto a government form. Answering that
 * needs no storage, and storing it would create a second copy of somebody's
 * passport data in a system that does not need one.
 *
 * So the assertion is not "we do not intend to store it" — it is that after a
 * validation, *no row exists anywhere*, and no substring of the zone appears in
 * the audit trail.
 */

import { computeCheckDigit } from '@meridian/mrtd';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TENANTS, createHarness, signToken, type Harness } from './harness.js';

let harness: Harness;

beforeEach(async () => {
  harness = await createHarness();
});

afterEach(async () => {
  await harness.close();
});

/**
 * A synthetic TD3 zone with correct check digits.
 *
 * Entirely invented: issuing state `ZZZ` is unassigned, the document number
 * begins `ZZ`, and the names are fictional. No real travel-document data appears
 * in this repository, in fixtures or anywhere else. Check digits are computed
 * rather than hardcoded so the fixture cannot drift from the arithmetic.
 */
function td3Fixture(): string {
  const documentNumber = 'ZZ1234567';
  const nationality = 'ZZZ';
  const birth = '900101';
  const sex = 'M';
  const expiry = '300101';
  const optional = '<'.repeat(14);

  const documentCheck = String(computeCheckDigit(documentNumber));
  const birthCheck = String(computeCheckDigit(birth));
  const expiryCheck = String(computeCheckDigit(expiry));
  const optionalCheck = String(computeCheckDigit(optional));

  const composite = `${documentNumber}${documentCheck}${birth}${birthCheck}${expiry}${expiryCheck}${optional}${optionalCheck}`;
  const compositeCheck = String(computeCheckDigit(composite));

  const line1 = `P<${nationality}TESTERSON<<TESTINA`.padEnd(44, '<');
  const line2 =
    `${documentNumber}${documentCheck}${nationality}${birth}${birthCheck}${sex}` +
    `${expiry}${expiryCheck}${optional}${optionalCheck}${compositeCheck}`;

  return `${line1}\n${line2}`;
}

async function token(): Promise<string> {
  return signToken({ tenantId: TENANTS.firm, roles: ['caseworker'] });
}

describe('POST /v1/identity/mrz', () => {
  it('validates a well-formed zone and returns the verdict', async () => {
    const mrz = td3Fixture();
    expect(mrz.split('\n').every((line) => line.length === 44)).toBe(true);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz, referenceDate: '2026-07-25' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      classification: string;
      value: { validation: { valid: boolean; format: string } };
    }>();
    expect(body.classification).toBe('information');
    expect(body.value.validation.valid).toBe(true);
    expect(body.value.validation.format).toBe('TD3');
  });

  it('reports a bad check digit instead of accepting it', async () => {
    // One transposed character in a document number costs months. The whole
    // point of the endpoint is that this comes back as a failure with a field
    // named, not as a silent pass.
    const broken = td3Fixture().replace('ZZ1234567', 'ZZ1234568');
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz: broken },
    });

    expect(response.statusCode).toBe(200);
    const validation = response.json<{
      value: { validation: { valid: boolean; failures: { code: string; field: string }[] } };
    }>().value.validation;
    expect(validation.valid).toBe(false);
    expect(validation.failures.some((f) => f.code === 'check_digit_mismatch')).toBe(true);
  });

  it('persists nothing at all', async () => {
    const before = harness.provider.store.caseDataRowCount();
    const mrz = td3Fixture();

    await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz },
    });

    expect(harness.provider.store.caseDataRowCount()).toBe(before);
    expect(harness.provider.store.documents.size).toBe(0);
    expect(harness.provider.store.applicants.size).toBe(0);
  });

  it('leaves no field derived from the zone in the audit trail', async () => {
    const mrz = td3Fixture();
    await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz },
    });

    const events = await harness.provider.forTenant(TENANTS.firm).audit.list({
      limit: 50,
      offset: 0,
    });
    const mrzEvents = events.filter((e) => e.action === 'identity.mrz.validated');
    expect(mrzEvents).toHaveLength(1);
    expect(mrzEvents[0]?.targetId).toBeNull();
    // No detail at all. The document type, the failing field and the failure
    // count are all facts about a person's travel document, and this table is
    // never deleted.
    expect(mrzEvents[0]?.detail).toEqual({});

    const serialised = JSON.stringify(events);
    for (const fragment of ['ZZ1234567', 'TESTERSON', 'TESTINA', '900101', 'ZZZ']) {
      expect(serialised, `audit trail leaked ${fragment}`).not.toContain(fragment);
    }
  });

  it('records failure as an outcome without recording why', async () => {
    await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz: 'CLEARLY<NOT<A<ZONE' },
    });

    const events = await harness.provider.forTenant(TENANTS.firm).audit.list({
      limit: 50,
      offset: 0,
      action: 'identity.mrz.validated',
    });
    expect(events[0]?.outcome).toBe('failure');
    expect(events[0]?.detail).toEqual({});
  });

  it('refuses an oversized body rather than parsing it', async () => {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz: 'A'.repeat(5000) },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
  });

  it('does not echo the submitted zone in a validation error', async () => {
    // A validation error that quotes the input has published the input to
    // whatever reads the error.
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz: 12345 },
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('12345');
  });

  it('accepts a caller-supplied reference date so the verdict is reproducible', async () => {
    // A two-digit year is ambiguous. Pinning the reference date is what makes an
    // assessment re-run in five years reach the answer it reached today.
    const mrz = td3Fixture();
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/identity/mrz',
      headers: { authorization: `Bearer ${await token()}` },
      payload: { mrz, referenceDate: '2020-01-01' },
    });
    const body = response.json<{
      value: { referenceDate: string; validation: { document: { dateOfBirth: { iso: string } } } };
    }>();
    expect(body.value.referenceDate).toBe('2020-01-01');
    // Birth window is the 100 years ending on the reference date, so `900101`
    // resolves to 1990 here rather than 2090.
    expect(body.value.validation.document.dateOfBirth.iso).toBe('1990-01-01');
  });
});
