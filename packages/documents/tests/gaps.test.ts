import { describe, expect, it } from 'vitest';
import { isoDate, type Citation, type CountryCode, type IsoDate } from '@meridian/core';
import {
  buildChecklist,
  type ChecklistFacts,
  type DocumentRequirement,
  type PathwayLike,
} from '../src/checklist.js';
import { analyseGaps } from '../src/gaps.js';
import { NOT_LEGALISED, untranslated, type Document } from '../src/model.js';
import { CASTILIAN, ENGLISH } from '../src/language.js';

const d = (s: string): IsoDate => isoDate(s);
const c = (s: string): CountryCode => s as CountryCode;
const TODAY = d('2026-07-25');

const cite = (id: string): Citation => ({
  id,
  kind: 'statute',
  instrument: 'Código Civil (España)',
  provision: 'art. 22',
  jurisdiction: 'ES',
  verifiedOn: TODAY,
});

const req = (
  over: Partial<DocumentRequirement> & Pick<DocumentRequirement, 'kind'>,
): DocumentRequirement => ({
  criterion: 'Identity and civil status must be evidenced.',
  citation: cite(`es-cc-art-22-${over.slug ?? over.kind}`),
  ...over,
});

const pathway = (requirements: readonly DocumentRequirement[]): PathwayLike => ({
  id: 'es-nacionalidad-residencia',
  targetJurisdiction: c('ES'),
  documentRequirements: requirements,
});

const facts = (over: Partial<ChecklistFacts> = {}): ChecklistFacts => ({
  matterId: 'matter-1',
  defaultIssuingCountry: c('MX'),
  defaultLanguage: CASTILIAN,
  ...over,
});

/** A Mexican birth certificate for a Spanish file: apostille, no translation, no window. */
const apostilledBirthCertificate = (over: Partial<Document> = {}): Document => ({
  id: 'doc-birth',
  kind: 'birth_certificate',
  issuingCountry: c('MX'),
  issuedOn: d('2026-01-10'),
  status: 'accepted',
  legalisation: { route: 'apostille', completedOn: d('2026-02-01') },
  translation: untranslated(CASTILIAN),
  ...over,
});

const birthChecklist = () =>
  buildChecklist(pathway([req({ kind: 'birth_certificate' })]), facts(), TODAY);

describe('an empty folder', () => {
  it('reports every requirement as missing and nothing as satisfied', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'birth_certificate' }), req({ kind: 'criminal_record' })]),
      facts({ targetSubmissionDate: d('2026-10-01') }),
      TODAY,
    );
    const gaps = analyseGaps({ checklist: list, held: [], asOf: TODAY });
    expect(gaps.classification).toBe('assessment');
    expect(gaps.value.missing).toHaveLength(2);
    expect(gaps.value.missing.every((m) => m.reason === 'not_provided')).toBe(true);
    expect(gaps.value.satisfied).toEqual([]);
    expect(gaps.value.expiring).toEqual([]);
    expect(gaps.value.unlegalised).toEqual([]);
    expect(gaps.value.untranslated).toEqual([]);
    expect(gaps.value.complete).toBe(false);
  });

  it('reports nothing missing when there is nothing required', () => {
    const gaps = analyseGaps({ checklist: buildChecklist(pathway([]), facts(), TODAY), held: [], asOf: TODAY });
    expect(gaps.value.missing).toEqual([]);
    expect(gaps.value.complete).toBe(true);
  });

  it('carries the citations behind the assessment', () => {
    const gaps = analyseGaps({ checklist: birthChecklist(), held: [], asOf: TODAY });
    expect(gaps.citationIds).toContain('es-cc-art-22-birth_certificate');
    expect(new Set(gaps.citationIds).size).toBe(gaps.citationIds.length);
  });
});

describe('a complete folder', () => {
  it('reports the item satisfied and the file complete', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate()],
      asOf: TODAY,
    });
    expect(gaps.value.missing).toEqual([]);
    expect(gaps.value.unlegalised).toEqual([]);
    expect(gaps.value.untranslated).toEqual([]);
    expect(gaps.value.satisfied).toHaveLength(1);
    expect(gaps.value.complete).toBe(true);
  });

  it('still reports that freshness could not be projected, rather than calling it fresh', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate()],
      asOf: TODAY,
    });
    expect(gaps.value.freshnessUnknown).toHaveLength(1);
    expect(gaps.value.freshnessUnknown[0]?.projection.verdict).toBe('unknown');
  });

  it('says out loud when no submission date was supplied and today was used instead', () => {
    const withoutTarget = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate()],
      asOf: TODAY,
    });
    expect(withoutTarget.value.submissionDateAssumed).toBe(true);
    expect(withoutTarget.value.submissionDate).toBe(TODAY);

    const withTarget = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate()],
      asOf: TODAY,
      targetSubmissionDate: d('2026-10-01'),
    });
    expect(withTarget.value.submissionDateAssumed).toBe(false);
    expect(withTarget.value.submissionDate).toBe('2026-10-01');
  });
});

describe('documents that expire before the appointment', () => {
  const list = () =>
    buildChecklist(
      pathway([req({ kind: 'criminal_record' })]),
      facts({ targetSubmissionDate: d('2026-11-01') }),
      TODAY,
    );

  const policeCertificate = (over: Partial<Document> = {}): Document => ({
    id: 'doc-pcc',
    kind: 'criminal_record',
    issuingCountry: c('MX'),
    issuedOn: d('2026-07-01'),
    status: 'accepted',
    legalisation: { route: 'apostille', completedOn: d('2026-07-10') },
    translation: untranslated(CASTILIAN),
    ...over,
  });

  it('catches the certificate a today-only check would have passed', () => {
    const gaps = analyseGaps({ checklist: list(), held: [policeCertificate()], asOf: TODAY });
    // Valid today: the three-month window from 2026-07-01 closes on 2026-09-30.
    expect(gaps.value.expiring).toHaveLength(1);
    expect(gaps.value.expiring[0]?.projection.verdict).toBe('expires_before_submission');
    expect(gaps.value.expiring[0]?.projection.acceptableUntil).toBe('2026-09-30');
    expect(gaps.value.satisfied).toEqual([]);
    expect(gaps.value.complete).toBe(false);
  });

  it('tells the applicant the earliest date the certificate can be ordered', () => {
    const gaps = analyseGaps({ checklist: list(), held: [policeCertificate()], asOf: TODAY });
    expect(gaps.value.expiring[0]?.projection.obtainNoEarlierThan).toBe('2026-08-02');
  });

  it('does not report it as expiring once the target date falls inside the window', () => {
    const near = buildChecklist(
      pathway([req({ kind: 'criminal_record' })]),
      facts({ targetSubmissionDate: d('2026-09-30') }),
      TODAY,
    );
    const gaps = analyseGaps({ checklist: near, held: [policeCertificate()], asOf: TODAY });
    expect(gaps.value.expiring).toEqual([]);
    expect(gaps.value.satisfied).toHaveLength(1);
  });

  it('distinguishes one already stale today', () => {
    const gaps = analyseGaps({
      checklist: list(),
      held: [policeCertificate({ issuedOn: d('2026-01-05') })],
      asOf: TODAY,
    });
    expect(gaps.value.expiring[0]?.projection.verdict).toBe('already_expired');
  });
});

describe('present but not usable', () => {
  it('reports a document that was never legalised', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate({ legalisation: NOT_LEGALISED })],
      asOf: TODAY,
    });
    expect(gaps.value.unlegalised).toHaveLength(1);
    expect(gaps.value.unlegalised[0]?.requiredRoute).toBe('apostille');
    expect(gaps.value.unlegalised[0]?.completedRoute).toBeNull();
    expect(gaps.value.missing).toEqual([]);
  });

  it('reports a document legalised down the wrong route', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate({ legalisation: { route: 'consular' } })],
      asOf: TODAY,
    });
    expect(gaps.value.unlegalised[0]?.completedRoute).toBe('consular');
  });

  it('reports a document nobody translated', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'criminal_record', slug: 'pcc_ca' })]),
      facts({
        issuingCountries: { pcc_ca: c('CA') },
        documentLanguages: { pcc_ca: ENGLISH },
        targetSubmissionDate: d('2026-08-15'),
      }),
      TODAY,
    );
    const held: Document = {
      id: 'doc-pcc-ca',
      kind: 'criminal_record',
      issuingCountry: c('CA'),
      issuedOn: d('2026-07-01'),
      status: 'accepted',
      legalisation: { route: 'apostille', completedOn: d('2026-07-15') },
      translation: untranslated(ENGLISH),
    };
    const gaps = analyseGaps({ checklist: list, held: [held], asOf: TODAY });
    expect(gaps.value.untranslated).toHaveLength(1);
    expect(gaps.value.untranslated[0]?.acceptedStandards).toEqual(['sworn_traductor_jurado']);
    expect(gaps.value.untranslated[0]?.detail).toContain('No translation is recorded');
  });

  it('rejects a translation done to the wrong standard', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'criminal_record', slug: 'pcc_ca' })]),
      facts({ issuingCountries: { pcc_ca: c('CA') }, documentLanguages: { pcc_ca: ENGLISH } }),
      TODAY,
    );
    const held: Document = {
      id: 'doc-pcc-ca',
      kind: 'criminal_record',
      issuingCountry: c('CA'),
      issuedOn: d('2026-07-01'),
      status: 'accepted',
      legalisation: { route: 'apostille', completedOn: d('2026-07-15') },
      translation: {
        sourceLanguage: ENGLISH,
        intoLanguage: CASTILIAN,
        standard: 'translator_certification',
      },
    };
    const gaps = analyseGaps({ checklist: list, held: [held], asOf: TODAY });
    expect(gaps.value.untranslated).toHaveLength(1);
    expect(gaps.value.untranslated[0]?.detail).toContain('translator_certification');
  });

  it('reports a rejected document as missing rather than as held', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate({ status: 'rejected' })],
      asOf: TODAY,
    });
    expect(gaps.value.missing).toHaveLength(1);
    expect(gaps.value.missing[0]?.reason).toBe('rejected');
    expect(gaps.value.missing[0]?.heldDocumentId).toBe('doc-birth');
  });

  it('reports an expired document as missing', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate({ status: 'expired' })],
      asOf: TODAY,
    });
    expect(gaps.value.missing[0]?.reason).toBe('expired');
  });

  it('does not let a certificate from the wrong state stand in for the right one', () => {
    const gaps = analyseGaps({
      checklist: birthChecklist(),
      held: [apostilledBirthCertificate({ issuingCountry: c('CA') })],
      asOf: TODAY,
    });
    expect(gaps.value.missing[0]?.reason).toBe('wrong_issuing_country');
    expect(gaps.value.missing[0]?.detail).toContain('CA');
    expect(gaps.value.missing[0]?.detail).toContain('MX');
  });
});

describe('unverified routing', () => {
  it('holds the file back when a route nobody has confirmed is in play', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'birth_certificate' })]),
      facts({ defaultIssuingCountry: c('JP') }),
      TODAY,
    );
    const held: Document = {
      id: 'doc-jp',
      kind: 'birth_certificate',
      issuingCountry: c('JP'),
      issuedOn: d('2026-01-01'),
      status: 'accepted',
      legalisation: { route: 'apostille', completedOn: d('2026-02-01') },
      translation: untranslated(CASTILIAN),
    };
    const gaps = analyseGaps({ checklist: list, held: [held], asOf: TODAY });
    expect(gaps.value.unverifiedRouting).toHaveLength(1);
    expect(gaps.value.unlegalised).toHaveLength(1);
    expect(gaps.value.complete).toBe(false);
  });
});

describe('optional requirements', () => {
  it('are reported as missing but do not block completeness', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'birth_certificate' }), req({ kind: 'marriage_certificate', optional: true })]),
      facts(),
      TODAY,
    );
    const gaps = analyseGaps({
      checklist: list,
      held: [apostilledBirthCertificate()],
      asOf: TODAY,
    });
    expect(gaps.value.missing).toHaveLength(1);
    expect(gaps.value.missing[0]?.optional).toBe(true);
    expect(gaps.value.complete).toBe(true);
  });
});

describe('order independence', () => {
  const list = () =>
    buildChecklist(
      pathway([req({ kind: 'birth_certificate' })]),
      facts({ targetSubmissionDate: d('2026-10-01') }),
      TODAY,
    );

  const candidates: Document[] = [
    apostilledBirthCertificate({ id: 'a-old', issuedOn: d('2020-01-01'), status: 'provided' }),
    apostilledBirthCertificate({ id: 'z-new', issuedOn: d('2026-06-01'), status: 'accepted' }),
    apostilledBirthCertificate({ id: 'm-mid', issuedOn: d('2024-01-01'), status: 'under_review' }),
  ];

  it('picks the same document however the folder is ordered', () => {
    const permutations: Document[][] = [
      [...candidates],
      [...candidates].reverse(),
      [candidates[1]!, candidates[0]!, candidates[2]!],
      [candidates[2]!, candidates[1]!, candidates[0]!],
    ];
    const results = permutations.map(
      (held) => analyseGaps({ checklist: list(), held, asOf: TODAY }).value,
    );
    for (const r of results) expect(JSON.stringify(r)).toBe(JSON.stringify(results[0]));
    expect(results[0]?.satisfied).toHaveLength(1);
  });

  it('prefers an accepted document over an unreviewed one regardless of issue date', () => {
    const accepted = apostilledBirthCertificate({
      id: 'accepted',
      issuedOn: d('2019-01-01'),
      status: 'accepted',
    });
    const newerButUnlegalised = apostilledBirthCertificate({
      id: 'newer',
      issuedOn: d('2026-06-01'),
      status: 'provided',
      legalisation: NOT_LEGALISED,
    });
    for (const held of [
      [accepted, newerButUnlegalised],
      [newerButUnlegalised, accepted],
    ]) {
      const gaps = analyseGaps({ checklist: list(), held, asOf: TODAY });
      expect(gaps.value.unlegalised).toEqual([]);
      expect(gaps.value.satisfied).toHaveLength(1);
    }
  });

  it('breaks ties on the document id so the result never flips between runs', () => {
    const same = (id: string) =>
      apostilledBirthCertificate({ id, issuedOn: d('2026-01-01'), status: 'accepted' });
    const forward = analyseGaps({ checklist: list(), held: [same('b'), same('a')], asOf: TODAY });
    const backward = analyseGaps({ checklist: list(), held: [same('a'), same('b')], asOf: TODAY });
    expect(JSON.stringify(forward.value)).toBe(JSON.stringify(backward.value));
  });

  it('handles documents with no issue date without crashing or reordering unpredictably', () => {
    const dated = apostilledBirthCertificate({ id: 'dated', issuedOn: d('2026-01-01') });
    const undated: Document = {
      id: 'undated',
      kind: 'birth_certificate',
      issuingCountry: c('MX'),
      status: 'accepted',
      legalisation: { route: 'apostille' },
      translation: untranslated(CASTILIAN),
    };
    const forward = analyseGaps({ checklist: list(), held: [dated, undated], asOf: TODAY });
    const backward = analyseGaps({ checklist: list(), held: [undated, dated], asOf: TODAY });
    expect(JSON.stringify(forward.value)).toBe(JSON.stringify(backward.value));
  });
});
