import { describe, expect, it } from 'vitest';
import { addDays, compareDates, isoDate, type CountryCode, type IsoDate } from '@meridian/core';
import {
  ACCEPTANCE_WINDOWS,
  EXPIRY_GOVERNED_KINDS,
  acceptanceWindowEnd,
  acceptanceWindowFor,
  earliestSafeIssueDate,
  projectFreshness,
  validityWindowDays,
  type AcceptanceWindow,
} from '../src/freshness.js';
import { NOT_LEGALISED, untranslated, type Document } from '../src/model.js';
import { CASTILIAN } from '../src/language.js';

const d = (s: string): IsoDate => isoDate(s);
const c = (s: string): CountryCode => s as CountryCode;

const record = (over: Partial<Document> = {}): Document => ({
  id: 'doc-cr',
  kind: 'criminal_record',
  issuingCountry: c('MX'),
  issuedOn: d('2026-05-01'),
  status: 'provided',
  legalisation: NOT_LEGALISED,
  translation: untranslated(CASTILIAN),
  ...over,
});

describe('acceptance window arithmetic', () => {
  it('counts the day of issue as day one of a day-expressed window', () => {
    const window: AcceptanceWindow = {
      kind: 'criminal_record',
      receivingCountry: c('ES'),
      unit: 'days',
      amount: 90,
      citation: ACCEPTANCE_WINDOWS[0]!.citation,
    };
    expect(acceptanceWindowEnd(window, d('2025-01-01'))).toBe('2025-03-31');
  });

  it('applies a month-expressed window in months, not in 30-day blocks', () => {
    const spain = acceptanceWindowFor('criminal_record', c('ES'));
    expect(spain?.unit).toBe('months');
    expect(spain?.amount).toBe(3);
    // Three months from 30 November is 28 February, not 28 days later plus 62.
    expect(acceptanceWindowEnd(spain!, d('2024-11-30'))).toBe('2025-02-27');
    expect(acceptanceWindowEnd(spain!, d('2025-01-01'))).toBe('2025-03-31');
  });

  it('clamps at month ends the way an authority reads "three months from 31 January"', () => {
    const spain = acceptanceWindowFor('criminal_record', c('ES'))!;
    expect(acceptanceWindowEnd(spain, d('2025-01-31'))).toBe('2025-04-29');
    expect(acceptanceWindowEnd(spain, d('2025-01-30'))).toBe('2025-04-29');
  });

  it('handles the leap day without drifting', () => {
    const canada = acceptanceWindowFor('criminal_record', c('CA'))!;
    expect(canada.amount).toBe(6);
    expect(acceptanceWindowEnd(canada, d('2024-02-29'))).toBe('2024-08-28');
    // A non-leap year has no 29 February to start from; the nearest issue dates bracket it.
    expect(acceptanceWindowEnd(canada, d('2025-02-28'))).toBe('2025-08-27');
  });

  it('resolves a month window to a day count that differs across a leap year', () => {
    expect(validityWindowDays('criminal_record', c('ES'), d('2025-01-01'))).toBe(90);
    expect(validityWindowDays('criminal_record', c('ES'), d('2024-01-01'))).toBe(91);
  });

  it('returns null rather than a default when no window is recorded', () => {
    expect(validityWindowDays('birth_certificate', c('ES'), d('2025-01-01'))).toBeNull();
    expect(acceptanceWindowFor('criminal_record', c('JP'))).toBeNull();
  });

  it('resolves country codes case-insensitively', () => {
    expect(acceptanceWindowFor('criminal_record', 'es' as CountryCode)?.amount).toBe(3);
  });

  it('marks every window as practice rather than settled law', () => {
    for (const window of ACCEPTANCE_WINDOWS) {
      expect(window.citation.discretionary).toBe(true);
      expect(window.citation.note).toBeTruthy();
    }
  });
});

describe('earliestSafeIssueDate', () => {
  const windows = ACCEPTANCE_WINDOWS;

  it('is safe and minimal across a year of submission dates, including month ends and the leap day', () => {
    for (const window of windows) {
      let cursor = d('2024-01-01');
      const last = d('2025-01-05');
      while (compareDates(cursor, last) <= 0) {
        const earliest = earliestSafeIssueDate(window, cursor);
        expect(compareDates(acceptanceWindowEnd(window, earliest), cursor)).toBeGreaterThanOrEqual(
          0,
        );
        const oneDayEarlier = addDays(earliest, -1);
        expect(compareDates(acceptanceWindowEnd(window, oneDayEarlier), cursor)).toBeLessThan(0);
        cursor = addDays(cursor, 1);
      }
    }
  });

  it('gives an applicant the date to order the certificate on, not one that lapses on the day', () => {
    const spain = acceptanceWindowFor('criminal_record', c('ES'))!;
    const earliest = earliestSafeIssueDate(spain, d('2026-09-01'));
    expect(earliest).toBe('2026-06-02');
    expect(acceptanceWindowEnd(spain, earliest)).toBe('2026-09-01');
  });
});

describe('projecting to the submission date rather than to today', () => {
  const asOf = d('2026-06-01');

  it('catches a certificate that is valid today and stale at the appointment', () => {
    const projection = projectFreshness({
      document: record({ issuedOn: d('2026-05-01') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-09-01'),
      asOf,
    });
    expect(projection.verdict).toBe('expires_before_submission');
    expect(projection.acceptableUntil).toBe('2026-07-31');
    expect(projection.marginDays).toBe(-32);
    expect(projection.obtainNoEarlierThan).toBe('2026-06-02');
  });

  it('passes the same certificate when the appointment lands on the last acceptable day', () => {
    const projection = projectFreshness({
      document: record({ issuedOn: d('2026-05-01') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-07-31'),
      asOf,
    });
    expect(projection.verdict).toBe('valid');
    expect(projection.marginDays).toBe(0);
  });

  it('fails it one day later — the off-by-one that costs the appointment', () => {
    const projection = projectFreshness({
      document: record({ issuedOn: d('2026-05-01') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-08-01'),
      asOf,
    });
    expect(projection.verdict).toBe('expires_before_submission');
    expect(projection.marginDays).toBe(-1);
  });

  it('separates a document already stale today from one that will go stale', () => {
    const projection = projectFreshness({
      document: record({ issuedOn: d('2026-01-01') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-09-01'),
      asOf,
    });
    expect(projection.verdict).toBe('already_expired');
    expect(projection.acceptableUntil).toBe('2026-03-31');
  });

  it('treats the last acceptable day as still acceptable when it is today', () => {
    const projection = projectFreshness({
      document: record({ issuedOn: d('2026-05-01') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-07-31'),
      asOf: d('2026-07-31'),
    });
    expect(projection.verdict).toBe('valid');
  });
});

describe('what cannot be projected', () => {
  it('says unknown, not valid, when no window is recorded and there is no printed expiry', () => {
    const projection = projectFreshness({
      document: record({ kind: 'birth_certificate' }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-09-01'),
      asOf: d('2026-06-01'),
    });
    expect(projection.verdict).toBe('unknown');
    expect(projection.rationale).toContain('rather than as unlimited');
  });

  it('says unknown when a window applies but the issue date was never recorded', () => {
    const undated: Document = {
      id: 'doc-undated',
      kind: 'criminal_record',
      issuingCountry: c('MX'),
      status: 'provided',
      legalisation: NOT_LEGALISED,
      translation: untranslated(CASTILIAN),
    };
    const projection = projectFreshness({
      document: undated,
      receivingCountry: c('ES'),
      submissionDate: d('2026-09-01'),
      asOf: d('2026-06-01'),
    });
    expect(projection.verdict).toBe('unknown');
    expect(projection.citations.map((x) => x.id)).toContain(
      'es-antecedentes-penales-recency-practice',
    );
  });

  it('says unknown for an expiry-governed document with no expiry recorded', () => {
    const projection = projectFreshness({
      document: record({ id: 'p1', kind: 'passport', issuedOn: d('2020-01-01') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-09-01'),
      asOf: d('2026-06-01'),
    });
    expect(projection.verdict).toBe('unknown');
    expect(projection.rationale).toContain('expiry printed on it');
    expect(EXPIRY_GOVERNED_KINDS).toContain('passport');
  });
});

describe('printed expiry and acceptance window together', () => {
  it('takes whichever limit binds first', () => {
    // Window closes 2026-07-31; the printed expiry is earlier and therefore governs.
    const projection = projectFreshness({
      document: record({ issuedOn: d('2026-05-01'), expiresOn: d('2026-06-15') }),
      receivingCountry: c('ES'),
      submissionDate: d('2026-07-01'),
      asOf: d('2026-06-01'),
    });
    expect(projection.acceptableUntil).toBe('2026-06-15');
    expect(projection.verdict).toBe('expires_before_submission');
  });

  it('projects a passport against its printed expiry alone', () => {
    const passport = record({
      id: 'p2',
      kind: 'passport',
      issuedOn: d('2018-03-01'),
      expiresOn: d('2026-08-15'),
    });
    expect(
      projectFreshness({
        document: passport,
        receivingCountry: c('ES'),
        submissionDate: d('2026-08-15'),
        asOf: d('2026-06-01'),
      }).verdict,
    ).toBe('valid');
    expect(
      projectFreshness({
        document: passport,
        receivingCountry: c('ES'),
        submissionDate: d('2026-08-16'),
        asOf: d('2026-06-01'),
      }).verdict,
    ).toBe('expires_before_submission');
  });
});
