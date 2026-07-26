/**
 * The read side of the record store, and the vocabulary rendered over it.
 *
 * One fact here decides what this whole application is allowed to say: the
 * tenant is a `firm`, `audienceFor` resolves that to `practitioner`, and that is
 * why advice is releasable in this console at all. The firm console is not a
 * relaxed version of the applicant portal — it is a different audience under the
 * same gate, and if that derivation ever silently changed, either the console
 * would stop showing a practitioner what they are entitled to see or it would
 * start showing an applicant what they are not.
 */

import { canRelease, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  DATASET_IDS,
  applicantName,
  auditInOrder,
  consoleAudience,
  findApplicant,
  findMatter,
  findRepresentative,
  firmTenant,
  loadRecords,
} from '@/lib/records';
import { LOCALES, UI, pick } from '@/lib/i18n';
import {
  AUDIENCE_LABEL,
  DISCLOSURE_CLASS_LABEL,
  MATTER_PHASE_LABEL,
  MATTER_STATUS_LABEL,
  policyRefusalLabel,
} from '@/lib/labels';
import { MATTER_STATUS_ORDER } from '@/lib/caseload';
import { applicant, auditRecord, firmRecords, matterRecord, representative } from './fixtures';

describe('the audience this console renders for', () => {
  it('derives practitioner from the tenant kind, never hard-codes it', () => {
    const records = loadRecords();
    expect(firmTenant(records).kind).toBe('firm');
    expect(consoleAudience(records)).toBe('practitioner');
  });

  it('is the audience through which advice is actually released', () => {
    // Stated out loud because it is the whole reason this console exists as a
    // separate application rather than as a flag on the portal.
    const records = loadRecords();
    const decision = canRelease('advice', {
      audience: consoleAudience(records),
      jurisdiction: 'ES',
      representative: null,
      forConsideration: true,
      asOf: isoDate('2026-07-26'),
    });
    expect(decision.allowed).toBe(true);
  });

  it('builds the tenant from the roster, so the two cannot disagree', () => {
    const records = firmRecords({
      representatives: [
        representative({ credential: { id: 'rep-a' } }),
        representative({ credential: { id: 'rep-b' } }),
      ],
    });
    expect(firmTenant(records).representatives.map((r) => r.id)).toEqual(['rep-a', 'rep-b']);
  });
});

describe('lookups', () => {
  const records = firmRecords({
    representatives: [representative({ credential: { id: 'rep-a' } })],
    applicants: [applicant({ id: 'app-a' })],
    matters: [matterRecord({ matter: { id: 'm-a' } })],
  });

  it('returns null rather than throwing for an id that resolves to nothing', () => {
    // These feed `notFound()` and a "not recorded" cell. An exception would
    // replace a translated 404 with a framework error shell.
    expect(findMatter(records, 'm-a')?.matter.id).toBe('m-a');
    expect(findMatter(records, 'nope')).toBeNull();
    expect(findApplicant(records, 'app-a')?.id).toBe('app-a');
    expect(findApplicant(records, 'nope')).toBeNull();
    expect(findRepresentative(records, 'rep-a')?.credential.id).toBe('rep-a');
    expect(findRepresentative(records, 'nope')).toBeNull();
  });

  it('treats "no representative assigned" as a lookup that finds nobody', () => {
    expect(findRepresentative(records, null)).toBeNull();
  });
});

describe('applicantName', () => {
  it('files a person under their family name and never reorders it per locale', () => {
    const person = applicant({ familyName: 'Rivas Peredo', givenNames: 'Camila' });
    for (const locale of LOCALES) {
      expect(applicantName(person, locale)).toBe('Rivas Peredo, Camila');
    }
  });

  it('translates only the *absence* of a person', () => {
    // An English "Unknown applicant" sitting in a Spanish table is a seam, and
    // it appears exactly where a record is missing — which is where a reader
    // most needs to understand what they are looking at.
    expect(applicantName(null, 'en')).toBe(pick(UI.applicantUnknown, 'en'));
    expect(applicantName(null, 'es')).toBe(pick(UI.applicantUnknown, 'es'));
    expect(applicantName(null, 'es')).not.toBe(applicantName(null, 'en'));
  });
});

describe('auditInOrder', () => {
  it('orders by date, then wall-clock time, then id', () => {
    const records = firmRecords({
      audit: [
        auditRecord({ id: 'c', on: isoDate('2026-03-01'), at: '10:00' }),
        auditRecord({ id: 'a', on: isoDate('2026-03-01'), at: '09:00' }),
        auditRecord({ id: 'b', on: isoDate('2026-02-01'), at: '23:59' }),
      ],
    });
    expect(auditInOrder(records).map((e) => e.id)).toEqual(['b', 'a', 'c']);
  });

  it('breaks a tie on id, so the order does not change between renders', () => {
    // Two entries recorded in the same minute would otherwise sort differently
    // on reload, and a trail whose order changes is not evidence of anything.
    const same = { on: isoDate('2026-03-01'), at: '09:00' };
    const forwards = firmRecords({
      audit: [auditRecord({ id: 'b', ...same }), auditRecord({ id: 'a', ...same })],
    });
    const backwards = firmRecords({
      audit: [auditRecord({ id: 'a', ...same }), auditRecord({ id: 'b', ...same })],
    });
    expect(auditInOrder(forwards).map((e) => e.id)).toEqual(['a', 'b']);
    expect(auditInOrder(backwards).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('does not mutate the stored trail', () => {
    const records = firmRecords({
      audit: [auditRecord({ id: 'b' }), auditRecord({ id: 'a' })],
    });
    auditInOrder(records);
    expect(records.audit.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('the shipped datasets', () => {
  it('offers an empty firm as a real dataset, not as a broken demo', () => {
    // A firm on its first day has no matters, and every page has to render that
    // as empty rather than as a page that failed to load.
    expect(DATASET_IDS).toContain('empty');
    expect(DATASET_IDS).toContain('working');
  });

  it('carries the language its record content is written in', () => {
    // Matter titles, task titles, audit summaries and regulator names are
    // reproduced verbatim and marked with this tag rather than translated.
    const records = loadRecords();
    expect(records.recordLanguage.length).toBeGreaterThan(0);
    expect(records.datasetId.length).toBeGreaterThan(0);
    expect(records.datasetDescription.length).toBeGreaterThan(0);
  });
});

describe('the domain vocabulary', () => {
  it('names every matter status and phase in both languages, distinctly', () => {
    // A wrong or missing term of art asserts something false about a regulator,
    // which is why these live apart from the product copy.
    for (const locale of LOCALES) {
      const statuses = MATTER_STATUS_ORDER.map((s) => pick(MATTER_STATUS_LABEL[s], locale));
      expect(new Set(statuses).size, locale).toBe(MATTER_STATUS_ORDER.length);
      for (const label of statuses) expect(label.trim()).not.toBe('');
    }
    for (const locale of LOCALES) {
      const phases = Object.values(MATTER_PHASE_LABEL).map((p) => pick(p, locale));
      expect(new Set(phases).size, locale).toBe(phases.length);
    }
  });

  it('does not translate "advice" into a word the licensing rules do not govern', () => {
    // *Asesoramiento* is the regulated act. The three disclosure classes have
    // to stay three distinguishable words in both languages.
    expect(pick(DISCLOSURE_CLASS_LABEL.advice, 'es')).toBe('Asesoramiento');
    for (const locale of LOCALES) {
      const classes = Object.values(DISCLOSURE_CLASS_LABEL).map((c) => pick(c, locale));
      expect(new Set(classes).size, locale).toBe(3);
    }
  });

  it('names every audience distinctly, including the one this console serves', () => {
    for (const locale of LOCALES) {
      const audiences = Object.values(AUDIENCE_LABEL).map((a) => pick(a, locale));
      expect(new Set(audiences).size, locale).toBe(audiences.length);
    }
    expect(pick(AUDIENCE_LABEL.practitioner, 'es')).not.toBe(
      pick(AUDIENCE_LABEL.applicant, 'es'),
    );
  });

  it('shows an unnamed policy refusal as its own code rather than hiding it', () => {
    // A refusal the label table has not been told about is a gap a reader
    // should be able to see. "Other" would conceal it.
    expect(policyRefusalLabel('no_credential_custody', 'es')).toBe('Sin custodia de credenciales');
    expect(policyRefusalLabel('some_future_policy', 'en')).toBe('some_future_policy');
    expect(policyRefusalLabel('toString', 'en')).toBe('toString');
  });
});
