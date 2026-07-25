import { describe, expect, it } from 'vitest';
import { isMeridianError } from '@meridian/core';
import {
  CREDENTIAL_CUSTODY_POLICY,
  credentialCustodyRefusal,
  guardCredentialFree,
  normalisePropertyName,
  scanForCredentials,
} from '../src/credential-guard.js';

/**
 * Every one of these is a field name somebody would plausibly add to a request
 * body while trying to be helpful. That is the threat model: not an attacker,
 * but a well-meaning contributor building the feature the PRD asked for.
 */
const CREDENTIAL_SHAPES: readonly [string, string][] = [
  ['clavePin', '123456'],
  ['Cl@vePIN', '123456'],
  ['Cl@ve Permanente', 'hunter2'],
  ['clave_pin', '123456'],
  ['CLAVE-PIN', '123456'],
  ['ClavePin', '123456'],
  ['clavePermanente', 'hunter2'],
  ['CLAVE_PERMANENTE', 'hunter2'],
  ['claveMovil', '000000'],
  ['clave', 'hunter2'],
  ['pin', '1234'],
  ['PIN', '1234'],
  ['pinCode', '1234'],
  ['userPin', '1234'],
  ['codigoPin', '1234'],
  ['password', 'hunter2'],
  ['Password', 'hunter2'],
  ['PASSWORD', 'hunter2'],
  ['userPassword', 'hunter2'],
  ['portalPasswordValue', 'hunter2'],
  ['passphrase', 'hunter2'],
  ['certificatePassphrase', 'hunter2'],
  ['contraseña', 'hunter2'],
  ['contrasena', 'hunter2'],
  ['pwd', 'hunter2'],
  ['passwd', 'hunter2'],
  ['passcode', '1234'],
  ['accessCode', '1234'],
  ['securityCode', '1234'],
  ['privateKey', 'material'],
  ['private_key', 'material'],
  ['clavePrivada', 'material'],
  ['llavePrivada', 'material'],
  ['signingKey', 'material'],
  ['secretKey', 'material'],
  ['secret', 'material'],
  ['clientSecret', 'material'],
  ['apiKey', 'material'],
  ['efirma', 'material'],
  ['efirmaKey', 'material'],
  ['fiel', 'material'],
  ['p12', 'material'],
  ['pfx', 'material'],
  ['pkcs12', 'material'],
  ['jks', 'material'],
  ['keystorePassword', 'hunter2'],
  ['truststorePath', '/x'],
  ['otp', '123456'],
  ['otpCode', '123456'],
  ['smsCode', '123456'],
  ['mfaCode', '123456'],
  ['oneTimeCode', '123456'],
  ['invitationLetterCode', 'CSV123'],
];

describe('normalisePropertyName', () => {
  it('collapses casing, separators and diacritics to one comparable form', () => {
    // The scheme is branded `Cl@ve`; the substitution keeps its own name legible.
    expect(normalisePropertyName('Cl@ve_PIN')).toBe('clavepin');
    expect(normalisePropertyName('cl@ve permanente')).toBe('clavepermanente');
    expect(normalisePropertyName('clave-pin')).toBe('clavepin');
    expect(normalisePropertyName('ClavePin')).toBe('clavepin');
    expect(normalisePropertyName('contraseña')).toBe('contrasena');
    expect(normalisePropertyName('CONTRASEÑA')).toBe('contrasena');
  });
});

describe('runtime credential detection', () => {
  it.each(CREDENTIAL_SHAPES)('refuses a top-level %s', (key, value) => {
    const result = guardCredentialFree({ matterId: 'm-1', [key]: value });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
      expect(result.error.details['paths']).toEqual([key]);
    }
  });

  it.each(CREDENTIAL_SHAPES)('refuses a deeply nested %s', (key, value) => {
    const payload = { applicant: { authentication: { details: { [key]: value } } } };
    const result = guardCredentialFree(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details['paths']).toEqual([`applicant.authentication.details.${key}`]);
    }
  });

  it('refuses a credential inside an array element, with an indexed path', () => {
    const result = guardCredentialFree({ people: [{ name: 'A' }, { name: 'B', clavePin: '1234' }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.details['paths']).toEqual(['people[1].clavePin']);
  });

  it('refuses a credential held as a Map key', () => {
    const result = guardCredentialFree({ store: new Map([['password', 'hunter2']]) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.details['paths']).toEqual(['store.password']);
  });

  it('refuses a credential inside a Set member', () => {
    const result = guardCredentialFree({ entries: new Set([{ ok: 1 }, { clavePermanente: 'x' }]) });
    expect(result.ok).toBe(false);
  });

  it('refuses private key material pasted into a free-text field', () => {
    const notes = ['Here is the key they sent:', '-----BEGIN RSA PRIVATE KEY-----', 'AAAA', '-----END RSA PRIVATE KEY-----'].join(
      '\n',
    );
    const result = guardCredentialFree({ additionalInformation: notes });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details['findings']).toEqual([
        { path: 'additionalInformation', detectedOn: 'value_shape', rule: 'pem_private_key' },
      ]);
    }
  });

  it.each([
    '-----BEGIN PRIVATE KEY-----',
    '-----BEGIN EC PRIVATE KEY-----',
    '-----BEGIN ENCRYPTED PRIVATE KEY-----',
  ])('recognises the %s armour', (armour) => {
    expect(scanForCredentials({ notes: `${armour}\nAAAA` })).toHaveLength(1);
  });

  it('reports every offending path rather than only the first', () => {
    const findings = scanForCredentials({ a: { pin: '1' }, b: { password: '2' } });
    expect(findings.map((f) => f.path).sort()).toEqual(['a.pin', 'b.password']);
  });
});

describe('the guard does not leak what it refused', () => {
  it('never puts the offending value in the error', () => {
    const secret = 'S3CR3T-VALUE-THAT-MUST-NOT-BE-LOGGED';
    const result = guardCredentialFree({ clavePermanente: secret });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const serialised = JSON.stringify({ message: result.error.message, details: result.error.details });
      expect(serialised).not.toContain(secret);
      expect(serialised).toContain('clavePermanente');
    }
  });
});

describe('false positives, which are how a guard dies', () => {
  const innocent = {
    shippingAddress: '1 Example Street',
    zipCode: 'X1X 1X1',
    // @meridian/core's AuthorizedRepresentative really does have this field.
    credential: 'rcic',
    credentials: ['rcic'],
    secretariatName: 'Example Secretariat',
    notPermitted: false,
    fieldName: 'position.nocCode',
    pinnedItems: ['a'],
    spinCount: 3,
    verificationCode: 'CSV-ON-A-PUBLIC-DOCUMENT',
    keyholderName: 'Example',
    monkeyBusiness: true,
  };

  it('passes a payload of look-alike field names untouched', () => {
    const result = guardCredentialFree(innocent);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(innocent);
  });

  it('passes an empty object and an empty array', () => {
    expect(guardCredentialFree({}).ok).toBe(true);
    expect(guardCredentialFree([]).ok).toBe(true);
  });

  it('passes null, undefined and primitives', () => {
    expect(guardCredentialFree(null).ok).toBe(true);
    expect(guardCredentialFree(undefined).ok).toBe(true);
    expect(guardCredentialFree('a string').ok).toBe(true);
    expect(guardCredentialFree(42).ok).toBe(true);
  });
});

describe('adversarial input', () => {
  it('terminates on a cyclic object instead of hanging', () => {
    const cyclic: Record<string, unknown> = { name: 'a' };
    cyclic['self'] = cyclic;
    cyclic['children'] = [cyclic, { other: cyclic }];
    expect(guardCredentialFree(cyclic).ok).toBe(true);
  });

  it('still finds a credential hidden behind a cycle', () => {
    const cyclic: Record<string, unknown> = { name: 'a' };
    cyclic['self'] = cyclic;
    cyclic['deep'] = { clavePin: '1234' };
    const result = guardCredentialFree(cyclic);
    expect(result.ok).toBe(false);
  });

  it('fails closed when the payload is too large to inspect', () => {
    const wide = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`field${i}`, { a: 1, b: 2 }]));
    const result = guardCredentialFree(wide, { maxNodes: 10 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toMatch(/could not be certified/);
    }
  });

  it('does not treat a budget failure as a clean pass', () => {
    // The distinction that matters: "we found nothing" and "we ran out of budget"
    // must not produce the same answer.
    const deep = { a: { b: { c: { d: { e: { clavePin: '1' } } } } } };
    expect(guardCredentialFree(deep, { maxNodes: 2 }).ok).toBe(false);
    expect(guardCredentialFree(deep).ok).toBe(false);
  });

  it('handles a property whose name normalises to nothing', () => {
    expect(guardCredentialFree({ '---': 'value' }).ok).toBe(true);
  });
});

describe('the policy, and the standalone refusal', () => {
  it('names what it refuses and what to do instead', () => {
    expect(CREDENTIAL_CUSTODY_POLICY.refuses.length).toBeGreaterThan(0);
    expect(CREDENTIAL_CUSTODY_POLICY.because.length).toBeGreaterThan(0);
    expect(CREDENTIAL_CUSTODY_POLICY.insteadDo.length).toBeGreaterThan(0);
  });

  it('produces a refusal error carrying the policy and the alternative', () => {
    const error = credentialCustodyRefusal({
      adapterId: 'es-clave',
      capabilityId: 'clave.credential_custody',
      what: 'Storing a Cl@ve PIN',
    });
    expect(isMeridianError(error)).toBe(true);
    expect(error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
    expect(error.details['policyId']).toBe(CREDENTIAL_CUSTODY_POLICY.id);
    expect(error.details['insteadDo']).toEqual(CREDENTIAL_CUSTODY_POLICY.insteadDo);
  });
});
