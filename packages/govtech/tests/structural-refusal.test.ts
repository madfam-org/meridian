/**
 * The compile-time half of the credential refusal.
 *
 * Every `@ts-expect-error` below is an assertion executed by `tsc --noEmit`: if
 * the structural refusal ever stopped working, the directive would become unused
 * and the typecheck would fail. The runtime assertions here are almost
 * incidental — the point of the file is that it compiles, and that these five
 * lines do not.
 */

import { describe, expect, it } from 'vitest';
import type { IsoDate } from '@meridian/core';
import { createClaveAdapter } from '../src/adapters/clave.js';
import { createDiciregAdapter } from '../src/adapters/dicireg.js';
import type { ClaveRegistrationHandoffInput } from '../src/adapters/clave.js';
import type { CivilRegistryCertificateRequest } from '../src/adapters/dicireg.js';

const ASOF = '2026-07-25' as IsoDate;

const clave = createClaveAdapter();
const dicireg = createDiciregAdapter();

const cleanHandoffInput: ClaveRegistrationHandoffInput = {
  matterId: 'm-1',
  route: 'video_call',
  fullName: 'Testerson Example',
  generatedOn: ASOF,
};

const cleanCertificateRequest: CivilRegistryCertificateRequest = {
  requestId: 'r-1',
  event: 'birth',
  form: 'extract_multilingual',
  subject: { givenNames: 'Test', familyNames: 'Testerson' },
  delivery: 'electronic',
  requestedOn: ASOF,
  purpose: 'nationality file',
};

describe('a credential-shaped field cannot be passed at all', () => {
  it('accepts a clean payload', () => {
    expect(clave.buildRegistrationHandoff(cleanHandoffInput).ok).toBe(true);
  });

  it('rejects a widened payload carrying a credential, at compile time', () => {
    // A variable rather than an object literal on purpose: excess-property
    // checking would catch the literal case anyway, and the case that actually
    // happens in a codebase is a wider object flowing into a narrower parameter.
    const widened = { ...cleanHandoffInput, clavePin: '123456' };

    // @ts-expect-error — a Cl@ve PIN may not be passed to any adapter operation.
    const result = clave.buildRegistrationHandoff(widened);

    // Defence in depth: the runtime guard refuses the same payload.
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('rejects a nested credential, at compile time', () => {
    const nested = {
      ...cleanCertificateRequest,
      subject: { ...cleanCertificateRequest.subject, certificatePassphrase: 'hunter2' },
    };

    // @ts-expect-error — nesting does not launder a credential.
    const promise = dicireg.requestCertificate({ asOf: ASOF, hasCredential: () => false }, nested);
    expect(promise).toBeInstanceOf(Promise);
  });

  it('rejects a credential inside an array element, at compile time', () => {
    const withArray = {
      ...cleanCertificateRequest,
      subject: {
        ...cleanCertificateRequest.subject,
        parentNames: [{ name: 'A', pin: '1234' }],
      },
    };

    // @ts-expect-error — `parentNames` is a string array, and the element carries a PIN besides.
    const promise = dicireg.requestCertificate({ asOf: ASOF, hasCredential: () => false }, withArray);
    expect(promise).toBeInstanceOf(Promise);
  });

  it('rejects an object literal declaring a credential field', () => {
    const result = clave.buildRegistrationHandoff({
      ...cleanHandoffInput,
      // @ts-expect-error — the field does not exist on the input, and would be refused if it did.
      efirmaPrivateKey: '-----BEGIN PRIVATE KEY-----',
    });
    expect(result.ok).toBe(false);
  });

  it('leaves branded and ordinary fields untouched', () => {
    // Guards against the mapped type mangling `IsoDate` (a branded string) or
    // rejecting innocuous names — the failure mode that makes people delete the
    // check rather than fix their payload.
    const wide = {
      ...cleanHandoffInput,
      identityDocumentNumber: 'X0000000X',
      shippingAddress: 'not relevant but harmless',
      credential: 'rcic',
    };
    expect(clave.buildRegistrationHandoff(wide).ok).toBe(true);
  });
});
