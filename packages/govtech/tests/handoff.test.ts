import { describe, expect, it } from 'vitest';
import type { Citation, CountryCode, IsoDate } from '@meridian/core';
import { countryCode } from '@meridian/core';
import type { HandoffInput } from '../src/handoff.js';
import {
  buildHandoff,
  checkDestination,
  documentsForStep,
  isOfficialGovernmentHost,
  renderHandoffText,
} from '../src/handoff.js';

const ASOF = '2026-07-25' as IsoDate;
const ES: CountryCode = countryCode('ES');

const citation: Citation = {
  id: 'test-citation',
  kind: 'official_guidance',
  instrument: 'Example published procedure',
  jurisdiction: 'ES',
  verifiedOn: ASOF,
};

const input = (over: Partial<HandoffInput> = {}): HandoffInput => ({
  id: 'h-1',
  adapterId: 'test-adapter',
  jurisdiction: ES,
  title: 'Do the thing yourself',
  purpose: 'Obtain the document your matter needs.',
  destinationUrl: 'https://clave.gob.es/',
  generatedOn: ASOF,
  steps: [
    { title: 'First', detail: 'Do this first.', actor: 'applicant', channel: 'online' },
    {
      title: 'Second',
      detail: 'Then this.',
      actor: 'applicant',
      channel: 'in_person',
      requiresDocumentIds: ['doc-1'],
    },
    { title: 'Third', detail: 'Finally this.', actor: 'applicant', channel: 'online' },
  ],
  documents: [
    {
      id: 'doc-1',
      title: 'Your identity document',
      description: 'The original.',
      origin: 'applicant',
      originalRequired: true,
    },
  ],
  fields: [{ id: 'f-1', label: 'Name', value: 'Testerson Example', source: 'user_record' }],
  bringBack: [
    {
      id: 'c-1',
      title: 'The reference number',
      description: 'Issued when you finish.',
      kind: 'reference_number',
    },
  ],
  citations: [citation],
  ...over,
});

describe('destination checking', () => {
  it('accepts allowlisted official hosts and their subdomains', () => {
    expect(checkDestination('ES', 'https://clave.gob.es/').valid).toBe(true);
    expect(checkDestination('ES', 'https://sede.agenciatributaria.gob.es/').valid).toBe(true);
    expect(checkDestination('CA', 'https://www.canada.ca/en/immigration-refugees-citizenship.html').valid).toBe(true);
  });

  it('rejects plain http', () => {
    const check = checkDestination('ES', 'http://clave.gob.es/');
    expect(check.valid).toBe(false);
    expect(check.reason).toMatch(/https/);
  });

  it('rejects a host that merely looks official', () => {
    expect(checkDestination('ES', 'https://clave-gob-es.example.com/').valid).toBe(false);
    expect(checkDestination('ES', 'https://clave.gob.es.example.com/').valid).toBe(false);
  });

  it('rejects the userinfo spoof, where the real host is after the @', () => {
    // https://clave.gob.es@evil.example/ reads as official to a human and
    // resolves to evil.example. The host character class has no `@`, so the URL
    // fails to parse rather than passing an allowlist check on the wrong half.
    const check = checkDestination('ES', 'https://clave.gob.es@evil.example/');
    expect(check.valid).toBe(false);
    expect(check.host).toBeNull();
  });

  it('rejects a query string, so user data cannot ride in a URL', () => {
    const check = checkDestination('ES', 'https://clave.gob.es/registro?nie=X0000000X');
    expect(check.valid).toBe(false);
    expect(check.reason).toMatch(/query string/);
  });

  it('rejects a jurisdiction with no allowlist rather than defaulting open', () => {
    expect(checkDestination('MX', 'https://www.gob.mx/').valid).toBe(false);
    expect(isOfficialGovernmentHost('ZZ', 'anything.example')).toBe(false);
  });

  it('matches hosts case-insensitively and ignores a trailing dot', () => {
    expect(isOfficialGovernmentHost('es', 'CLAVE.GOB.ES')).toBe(true);
    expect(isOfficialGovernmentHost('ES', 'clave.gob.es.')).toBe(true);
  });
});

describe('buildHandoff', () => {
  it('numbers steps 1..n contiguously, in the order given', () => {
    const result = buildHandoff(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.steps.map((s) => s.ordinal)).toEqual([1, 2, 3]);
    expect(result.value.steps.map((s) => s.title)).toEqual(['First', 'Second', 'Third']);
  });

  it('resolves the documents a step needs', () => {
    const result = buildHandoff(input());
    if (!result.ok) throw result.error;
    const second = result.value.steps[1];
    expect(second).toBeDefined();
    if (second === undefined) return;
    expect(documentsForStep(result.value, second).map((d) => d.id)).toEqual(['doc-1']);
  });

  it('refuses a step requiring a document the handoff does not list', () => {
    const result = buildHandoff(
      input({
        steps: [
          {
            title: 'Bring the thing',
            detail: 'x',
            actor: 'applicant',
            channel: 'in_person',
            requiresDocumentIds: ['doc-missing'],
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toMatch(/doc-missing/);
    }
  });

  it('refuses a handoff with no steps', () => {
    expect(buildHandoff(input({ steps: [] })).ok).toBe(false);
  });

  it('refuses a handoff that cites nothing', () => {
    expect(buildHandoff(input({ citations: [] })).ok).toBe(false);
  });

  it('refuses a handoff that captures nothing on return', () => {
    // Without a capture the platform loses track of what happened, which is the
    // failure the pattern exists to prevent.
    const result = buildHandoff(input({ bringBack: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/capture at least one/);
  });

  it('refuses duplicate document, field and capture ids', () => {
    const doc = {
      id: 'doc-1',
      title: 'x',
      description: 'x',
      origin: 'applicant' as const,
      originalRequired: false,
    };
    expect(buildHandoff(input({ documents: [doc, doc] })).ok).toBe(false);

    const field = { id: 'f-1', label: 'x', value: 'y', source: 'user_record' as const };
    expect(buildHandoff(input({ fields: [field, field] })).ok).toBe(false);

    const capture = { id: 'c-1', title: 'x', description: 'x', kind: 'reference_number' as const };
    expect(buildHandoff(input({ bringBack: [capture, capture] })).ok).toBe(false);
  });

  it('refuses a non-blank field source carrying a blank value', () => {
    const result = buildHandoff(
      input({ fields: [{ id: 'f-1', label: 'Name', value: '   ', source: 'user_record' }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/user_supplies/);
  });

  it('allows a blank value when the user supplies it themselves', () => {
    const result = buildHandoff(
      input({ fields: [{ id: 'f-1', label: 'Mobile', value: '', source: 'user_supplies' }] }),
    );
    expect(result.ok).toBe(true);
  });

  it('refuses an invalid generated-on date', () => {
    expect(buildHandoff(input({ generatedOn: '2026-02-30' as IsoDate })).ok).toBe(false);
  });

  it('refuses a credential smuggled in as a field value', () => {
    const result = buildHandoff(
      input({
        fields: [{ id: 'clavePin', label: 'Your Cl@ve PIN', value: '123456', source: 'user_record' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('refuses a credential field even when it is left blank for the user to fill', () => {
    // A blank slot labelled "Cl@ve PIN" is still a slot expecting a PIN, and it
    // is one product decision away from being persisted.
    const result = buildHandoff(
      input({ fields: [{ id: 'f-1', label: 'Cl@ve PIN', value: '', source: 'user_supplies' }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('refuses a capture asking the user to bring a credential back', () => {
    const result = buildHandoff(
      input({
        bringBack: [
          {
            id: 'c-1',
            title: 'Your new Cl@ve Permanente password',
            description: 'So we can log in for you.',
            kind: 'reference_number',
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('refuses a document that is really a credential', () => {
    const result = buildHandoff(
      input({
        documents: [
          {
            id: 'certificatePassphrase',
            title: 'Certificate passphrase',
            description: 'x',
            origin: 'applicant',
            originalRequired: false,
          },
        ],
        steps: [{ title: 'First', detail: 'x', actor: 'applicant', channel: 'online' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('still allows prose that mentions a credential in order to warn about it', () => {
    // The policy caveat itself contains the words "Cl@ve PIN". A rule that
    // scanned free text would refuse the sentence stating the policy.
    const result = buildHandoff(
      input({ caveats: ['Meridian never asks for your Cl@ve PIN or your Cl@ve Permanente password.'] }),
    );
    expect(result.ok).toBe(true);
  });
});

describe('disclosure classification is derived, not asserted', () => {
  it('is information when every value comes from the record or the user', () => {
    const result = buildHandoff(input());
    if (!result.ok) throw result.error;
    expect(result.value.classification).toBe('information');
  });

  it('rises to assessment as soon as one value is computed', () => {
    const result = buildHandoff(
      input({
        fields: [
          { id: 'f-1', label: 'Name', value: 'Testerson', source: 'user_record' },
          { id: 'f-2', label: 'Days', value: '365', source: 'computed' },
        ],
      }),
    );
    if (!result.ok) throw result.error;
    expect(result.value.classification).toBe('assessment');
  });

  it('never reaches advice, whatever the inputs', () => {
    const result = buildHandoff(
      input({ fields: [{ id: 'f-1', label: 'Days', value: '365', source: 'computed' }] }),
    );
    if (!result.ok) throw result.error;
    expect(result.value.classification).not.toBe('advice');
  });
});

describe('text rendering', () => {
  it('includes every section a person standing in a queue needs', () => {
    const result = buildHandoff(input({ caveats: ['Check before travelling.'] }));
    if (!result.ok) throw result.error;
    const text = renderHandoffText(result.value);

    expect(text).toContain('Do the thing yourself');
    expect(text).toContain('https://clave.gob.es/');
    expect(text).toContain('BRING WITH YOU');
    expect(text).toContain('(original, not a copy)');
    expect(text).toContain('1. [online] First');
    expect(text).toContain('2. [in_person] Second');
    expect(text).toContain('VALUES TO ENTER');
    expect(text).toContain('BRING BACK');
    expect(text).toContain('Check before travelling.');
    expect(text).toContain('SOURCES');
    expect(text).toContain('Example published procedure');
  });

  it('marks a user-supplied blank rather than printing an empty line', () => {
    const result = buildHandoff(
      input({ fields: [{ id: 'f-1', label: 'Mobile', value: '', source: 'user_supplies' }] }),
    );
    if (!result.ok) throw result.error;
    expect(renderHandoffText(result.value)).toContain('(you provide this yourself)');
  });

  it('marks administrative practice as changeable where the citation says so', () => {
    const discretionary: Citation = { ...citation, discretionary: true };
    const result = buildHandoff(input({ citations: [discretionary] }));
    if (!result.ok) throw result.error;
    expect(renderHandoffText(result.value)).toContain('administrative practice, may change');
  });
});
