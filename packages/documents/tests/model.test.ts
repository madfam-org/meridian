import { describe, expect, it } from 'vitest';
import { isErr, isOk, type CountryCode, type IsoDate } from '@meridian/core';
import {
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  NOT_LEGALISED,
  canTransition,
  documentSchema,
  isDocumentPresent,
  isPastPrintedExpiry,
  parseDocument,
  transitionDocument,
  untranslated,
  type Document,
  type DocumentStatus,
} from '../src/model.js';
import { CASTILIAN, languageTag } from '../src/language.js';

const d = (s: string): IsoDate => s as IsoDate;
const c = (s: string): CountryCode => s as CountryCode;

const base: Document = {
  id: 'doc-1',
  kind: 'criminal_record',
  issuingCountry: c('MX'),
  issuedOn: d('2026-05-01'),
  status: 'required',
  legalisation: NOT_LEGALISED,
  translation: untranslated(CASTILIAN),
};

describe('status machine', () => {
  it('walks the happy path required -> provided -> under_review -> accepted', () => {
    let doc = base;
    for (const next of ['provided', 'under_review', 'accepted'] as const) {
      const r = transitionDocument(doc, next);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) throw new Error('unreachable');
      doc = r.value;
      expect(doc.status).toBe(next);
    }
  });

  it('refuses to skip review — a document nobody looked at cannot be accepted', () => {
    const r = transitionDocument(base, 'accepted');
    expect(isErr(r)).toBe(true);
    if (!isErr(r)) throw new Error('unreachable');
    expect(r.error.code).toBe('DOCUMENT_INVALID');
    expect(r.error.details).toMatchObject({ from: 'required', to: 'accepted' });
  });

  it('refuses every transition out of accepted except expiry', () => {
    const accepted: Document = { ...base, status: 'accepted' };
    for (const to of DOCUMENT_STATUSES) {
      const allowed = to === 'expired';
      expect(canTransition('accepted', to)).toBe(allowed);
      expect(isOk(transitionDocument(accepted, to))).toBe(allowed);
    }
  });

  it('lets an accepted document expire, because acceptance is not immunity from the clock', () => {
    const accepted: Document = { ...base, status: 'accepted' };
    const r = transitionDocument(accepted, 'expired');
    expect(isOk(r)).toBe(true);
  });

  it('routes rejection and expiry back through provided rather than back to required', () => {
    expect(canTransition('rejected', 'provided')).toBe(true);
    expect(canTransition('expired', 'provided')).toBe(true);
    expect(canTransition('rejected', 'required')).toBe(false);
    expect(canTransition('expired', 'required')).toBe(false);
    expect(canTransition('expired', 'under_review')).toBe(false);
  });

  it('rejects a self-transition, which is always a caller bug rather than a no-op', () => {
    for (const status of DOCUMENT_STATUSES) {
      const r = transitionDocument({ ...base, status }, status);
      expect(isErr(r)).toBe(true);
    }
  });

  it('refuses transitions backwards down the review chain', () => {
    const illegal: [DocumentStatus, DocumentStatus][] = [
      ['under_review', 'provided'],
      ['under_review', 'required'],
      ['provided', 'accepted'],
      ['provided', 'rejected'],
      ['accepted', 'rejected'],
      ['rejected', 'accepted'],
      ['required', 'under_review'],
    ];
    for (const [from, to] of illegal) {
      expect(canTransition(from, to)).toBe(false);
      expect(isErr(transitionDocument({ ...base, status: from }, to))).toBe(true);
    }
  });

  it('records the reviewer only when one is supplied', () => {
    const provided = transitionDocument(base, 'provided');
    if (!isOk(provided)) throw new Error('unreachable');
    expect(provided.value.verifiedBy).toBeUndefined();
    const reviewed = transitionDocument(provided.value, 'under_review', { verifiedBy: 'user-9' });
    if (!isOk(reviewed)) throw new Error('unreachable');
    expect(reviewed.value.verifiedBy).toBe('user-9');
  });

  it('treats rejected and expired documents as absent from the folder', () => {
    expect(isDocumentPresent('provided')).toBe(true);
    expect(isDocumentPresent('under_review')).toBe(true);
    expect(isDocumentPresent('accepted')).toBe(true);
    expect(isDocumentPresent('rejected')).toBe(false);
    expect(isDocumentPresent('expired')).toBe(false);
    expect(isDocumentPresent('required')).toBe(false);
  });

  it('never mutates the input document', () => {
    const before = JSON.stringify(base);
    transitionDocument(base, 'provided');
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('printed expiry', () => {
  it('treats the expiry date itself as still valid', () => {
    const passport: Document = { ...base, kind: 'passport', expiresOn: d('2026-07-25') };
    expect(isPastPrintedExpiry(passport, d('2026-07-24'))).toBe(false);
    expect(isPastPrintedExpiry(passport, d('2026-07-25'))).toBe(false);
    expect(isPastPrintedExpiry(passport, d('2026-07-26'))).toBe(true);
  });

  it('says nothing about a document with no printed expiry', () => {
    expect(isPastPrintedExpiry(base, d('2999-01-01'))).toBe(false);
  });
});

describe('parseDocument', () => {
  const valid = {
    id: 'doc-2',
    kind: 'birth_certificate',
    issuingCountry: 'MX',
    issuedOn: '2020-01-15',
    status: 'provided',
    legalisation: { route: 'apostille', completedOn: '2026-01-05' },
    translation: { sourceLanguage: 'es' },
  };

  it('accepts a well-formed document', () => {
    const r = parseDocument(valid);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) throw new Error('unreachable');
    expect(r.value.issuingCountry).toBe('MX');
    expect(r.value.legalisation.route).toBe('apostille');
  });

  it('normalises the language tag so es-MX is not mistaken for a foreign language', () => {
    const r = parseDocument({ ...valid, translation: { sourceLanguage: 'ES-mx' } });
    if (!isOk(r)) throw new Error('unreachable');
    expect(r.value.translation.sourceLanguage).toBe('es-mx');
  });

  it('rejects a calendar date that does not exist rather than rolling it over', () => {
    expect(isErr(parseDocument({ ...valid, issuedOn: '2025-02-30' }))).toBe(true);
    expect(isErr(parseDocument({ ...valid, issuedOn: '2023-02-29' }))).toBe(true);
    expect(isOk(parseDocument({ ...valid, issuedOn: '2024-02-29' }))).toBe(true);
  });

  it('rejects an expiry that precedes the issue date', () => {
    const r = parseDocument({ ...valid, issuedOn: '2026-01-01', expiresOn: '2025-12-31' });
    expect(isErr(r)).toBe(true);
    if (!isErr(r)) throw new Error('unreachable');
    expect(r.error.code).toBe('DOCUMENT_INVALID');
  });

  it('accepts an expiry on the issue date itself', () => {
    expect(isOk(parseDocument({ ...valid, issuedOn: '2026-01-01', expiresOn: '2026-01-01' }))).toBe(
      true,
    );
  });

  it('rejects an unknown key rather than silently dropping it', () => {
    const r = parseDocument({ ...valid, expiryOn: '2030-01-01' });
    expect(isErr(r)).toBe(true);
  });

  it('rejects a document kind outside the closed union', () => {
    expect(isErr(parseDocument({ ...valid, kind: 'police_clearance_letter' }))).toBe(true);
  });

  it('rejects hostile and empty input without throwing', () => {
    for (const input of [null, undefined, 0, '', true, [], [valid], { id: '' }, new Date()]) {
      expect(isErr(parseDocument(input))).toBe(true);
    }
  });

  it('rejects an object whose fields are inherited rather than its own', () => {
    // Field reads walk the prototype chain while the unknown-key check does not,
    // so this object would otherwise satisfy both halves of the schema at once.
    const inherited = { __proto__: valid } as unknown;
    expect(isErr(parseDocument(inherited))).toBe(true);
    expect(isOk(parseDocument({ ...valid }))).toBe(true);
  });

  it('distinguishes a null legalisation route from a completed one of none', () => {
    const nothingDone = parseDocument({ ...valid, legalisation: { route: null } });
    if (!isOk(nothingDone)) throw new Error('unreachable');
    expect(nothingDone.value.legalisation.route).toBeNull();

    const noneRequired = parseDocument({ ...valid, legalisation: { route: 'none' } });
    if (!isOk(noneRequired)) throw new Error('unreachable');
    expect(noneRequired.value.legalisation.route).toBe('none');
  });

  it('exposes the same schema it parses with', () => {
    expect(documentSchema.safeParse(valid).success).toBe(true);
  });
});

describe('catalog integrity', () => {
  it('enumerates every kind exactly once', () => {
    expect(new Set(DOCUMENT_KINDS).size).toBe(DOCUMENT_KINDS.length);
    expect(DOCUMENT_KINDS.length).toBe(20);
  });

  it('normalises language tags case-insensitively', () => {
    expect(languageTag('  ES-mx ')).toBe('es-mx');
    expect(() => languageTag('spanish!')).toThrow(RangeError);
    expect(() => languageTag('')).toThrow(RangeError);
  });
});
