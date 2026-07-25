import { describe, expect, it } from 'vitest';
import type { ApostilleStatus, CountryCode, IsoDate } from '@meridian/core';
import {
  DOCUMENT_AUTHENTICATION_CLASS,
  EU_2016_1191_COVERED_KINDS,
  EU_MEMBER_STATES,
  isEuMemberState,
  legalisationRoute,
  legalisationSatisfied,
} from '../src/legalisation.js';
import { DOCUMENT_KINDS } from '../src/model.js';

const d = (s: string): IsoDate => s as IsoDate;
const c = (s: string): CountryCode => s as CountryCode;
const TODAY = d('2026-07-25');

describe('apostille between two Convention parties', () => {
  it('routes a Mexican birth certificate for use in Spain to a single apostille', () => {
    const r = legalisationRoute({
      documentKind: 'birth_certificate',
      issuingCountry: c('MX'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('apostille');
    expect(r.requiresVerification).toBe(false);
    expect(r.steps.map((s) => s.kind)).toEqual(['issuing_authority_certification', 'apostille']);
    expect(r.citations.map((x) => x.id)).toContain('hcch-12-1961-art-3');
  });

  it('normalises country-code casing rather than failing to find the catalog entry', () => {
    const r = legalisationRoute({
      documentKind: 'degree_certificate',
      issuingCountry: 'mx' as CountryCode,
      receivingCountry: 'es' as CountryCode,
      asOf: TODAY,
    });
    expect(r.route).toBe('apostille');
    expect(r.issuingCountry).toBe('MX');
    expect(r.receivingCountry).toBe('ES');
  });

  it("flags for verification when core's catalog carries a caveat, such as Canada's accession date", () => {
    const r = legalisationRoute({
      documentKind: 'criminal_record',
      issuingCountry: c('CA'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('apostille');
    expect(r.requiresVerification).toBe(true);
    expect(r.rationale).toContain('2024-01-11');
  });

  it('inserts a notarisation step ahead of the apostille for a private instrument', () => {
    const r = legalisationRoute({
      documentKind: 'proof_of_income',
      issuingCountry: c('MX'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('apostille');
    expect(r.steps[0]?.kind).toBe('notarisation');
    expect(r.requiresVerification).toBe(true);
  });
});

describe('countries outside the catalog', () => {
  it("answers 'unknown' rather than assuming an apostille is fine", () => {
    const r = legalisationRoute({
      documentKind: 'birth_certificate',
      issuingCountry: c('JP'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('unknown');
    expect(r.requiresVerification).toBe(true);
    expect(r.steps.map((s) => s.kind)).toEqual(['route_verification']);
    expect(r.rationale).toContain('JP');
  });

  it("answers 'unknown' when it is the receiving state that is uncatalogued", () => {
    const r = legalisationRoute({
      documentKind: 'criminal_record',
      issuingCountry: c('MX'),
      receivingCountry: c('JP'),
      asOf: TODAY,
    });
    expect(r.route).toBe('unknown');
    expect(r.rationale).toContain('JP');
  });

  it('names both states when neither is catalogued', () => {
    const r = legalisationRoute({
      documentKind: 'marriage_certificate',
      issuingCountry: c('JP'),
      receivingCountry: c('KR'),
      asOf: TODAY,
    });
    expect(r.route).toBe('unknown');
    expect(r.rationale).toContain('JP and KR');
  });

  it('never treats an unknown route as satisfied by work already done', () => {
    const r = legalisationRoute({
      documentKind: 'birth_certificate',
      issuingCountry: c('JP'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(legalisationSatisfied(r, 'apostille')).toBe(false);
    expect(legalisationSatisfied(r, 'consular')).toBe(false);
    expect(legalisationSatisfied(r, 'none')).toBe(false);
    expect(legalisationSatisfied(r, null)).toBe(false);
  });
});

describe('no authentication required', () => {
  it('never routes a passport through an authentication chain', () => {
    const r = legalisationRoute({
      documentKind: 'passport',
      issuingCountry: c('JP'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('none');
    expect(r.steps).toEqual([]);
  });

  it('does not ask a state to authenticate its own document to itself', () => {
    const r = legalisationRoute({
      documentKind: 'criminal_record',
      issuingCountry: c('ES'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('none');
    expect(legalisationSatisfied(r, null)).toBe(true);
  });

  it('assigns every document kind an authentication class', () => {
    for (const kind of DOCUMENT_KINDS) {
      expect(DOCUMENT_AUTHENTICATION_CLASS[kind]).toBeDefined();
    }
  });
});

describe('Regulation (EU) 2016/1191', () => {
  it('exempts an intra-EU birth certificate even though France is outside the apostille catalog', () => {
    const r = legalisationRoute({
      documentKind: 'birth_certificate',
      issuingCountry: c('FR'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('none');
    expect(r.citations.map((x) => x.id)).toEqual(['eu-reg-2016-1191-art-4']);
  });

  it('does not reach education, so an intra-EU degree falls back to the apostille catalog', () => {
    const r = legalisationRoute({
      documentKind: 'degree_certificate',
      issuingCountry: c('FR'),
      receivingCountry: c('ES'),
      asOf: TODAY,
    });
    expect(r.route).toBe('unknown');
  });

  it('does not apply before the Regulation did', () => {
    const before = legalisationRoute({
      documentKind: 'birth_certificate',
      issuingCountry: c('FR'),
      receivingCountry: c('ES'),
      asOf: d('2019-02-15'),
    });
    expect(before.route).toBe('unknown');

    const onCommencement = legalisationRoute({
      documentKind: 'birth_certificate',
      issuingCountry: c('FR'),
      receivingCountry: c('ES'),
      asOf: d('2019-02-16'),
    });
    expect(onCommencement.route).toBe('none');
  });

  it('does not extend the exemption to a non-member', () => {
    expect(isEuMemberState(c('CH'))).toBe(false);
    expect(isEuMemberState(c('NO'))).toBe(false);
    expect(isEuMemberState(c('GB'))).toBe(false);
    expect(isEuMemberState(c('IE'))).toBe(true);
  });

  it('records 27 member states, each once', () => {
    expect(EU_MEMBER_STATES.length).toBe(27);
    expect(new Set(EU_MEMBER_STATES).size).toBe(27);
  });

  it('covers only the civil-status kinds the Regulation names', () => {
    expect([...EU_2016_1191_COVERED_KINDS].sort()).toEqual([
      'birth_certificate',
      'criminal_record',
      'marriage_certificate',
    ]);
  });
});

describe('consular chain', () => {
  /**
   * Every country `@meridian/core` currently catalogs is a Convention party, so
   * the consular branch is unreachable through the default lookup. It is
   * exercised here through the injectable resolver, because a branch that
   * decides which ministry somebody queues at should not ship unreviewed.
   */
  const resolver = (country: CountryCode): ApostilleStatus | null => {
    if (country === 'ES') return { country: c('ES'), isParty: true };
    if (country === 'XA') return { country: c('XA'), isParty: false, note: 'Not a party.' };
    return null;
  };

  it('routes through the foreign ministry and then the receiving consulate', () => {
    const r = legalisationRoute(
      {
        documentKind: 'birth_certificate',
        issuingCountry: c('XA'),
        receivingCountry: c('ES'),
        asOf: TODAY,
      },
      resolver,
    );
    expect(r.route).toBe('consular');
    expect(r.steps.map((s) => s.kind)).toEqual([
      'issuing_authority_certification',
      'foreign_ministry_authentication',
      'consular_legalisation',
    ]);
    expect(r.steps.at(-1)?.actor).toBe('receiving_state_consulate');
    expect(r.requiresVerification).toBe(true);
  });

  it('applies equally when it is the receiving state that is outside the Convention', () => {
    const r = legalisationRoute(
      {
        documentKind: 'criminal_record',
        issuingCountry: c('ES'),
        receivingCountry: c('XA'),
        asOf: TODAY,
      },
      resolver,
    );
    expect(r.route).toBe('consular');
    expect(r.rationale).toContain('XA is not a party');
  });

  it('notarises a private instrument before the chain begins', () => {
    const r = legalisationRoute(
      {
        documentKind: 'employment_contract',
        issuingCountry: c('XA'),
        receivingCountry: c('ES'),
        asOf: TODAY,
      },
      resolver,
    );
    expect(r.route).toBe('consular');
    expect(r.steps.map((s) => s.kind)).toEqual([
      'notarisation',
      'issuing_authority_certification',
      'foreign_ministry_authentication',
      'consular_legalisation',
    ]);
  });

  it('is satisfied only by the matching completed route', () => {
    const r = legalisationRoute(
      {
        documentKind: 'birth_certificate',
        issuingCountry: c('XA'),
        receivingCountry: c('ES'),
        asOf: TODAY,
      },
      resolver,
    );
    expect(legalisationSatisfied(r, 'consular')).toBe(true);
    expect(legalisationSatisfied(r, 'apostille')).toBe(false);
    expect(legalisationSatisfied(r, null)).toBe(false);
  });
});
