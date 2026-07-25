import { describe, expect, it } from 'vitest';
import type { Disclosable, ReleaseContext } from '@meridian/core';
import { MeridianError, canRelease, isCitationWellFormed, staleness } from '@meridian/core';
import {
  CATALOG_VERIFIED_ON,
  PRESENCE_CITATIONS,
  SPAIN_IRPF_DAY_COUNT,
  SPAIN_NATIONALITY_CONTINUITY,
  assessCanadianExperienceClass,
  assessContinuousResidence,
  assessDayCountThreshold,
  assessQualifyingWork,
  assessSchengenDaysUntilEligible,
  assessSchengenNextEntry,
  assessSchengenStatus,
  assessSchengenWorstDay,
  findPresenceCitation,
  presenceLedger,
} from '../src/index.js';
import { c, d, stayRec } from './helpers.js';

const ledger = presenceLedger([
  stayRec('a', 'ES', '2025-01-01', '2025-03-31'),
  stayRec('b', 'MX', '2025-04-01', '2025-06-30'),
]);

const window = { start: d('2020-01-01'), end: d('2024-12-31') };

const outputs: Disclosable<unknown>[] = [
  assessSchengenStatus(ledger, d('2025-06-30')),
  assessSchengenWorstDay(ledger, { start: d('2025-01-01'), end: d('2025-06-30') }),
  assessSchengenNextEntry(ledger, 10, d('2025-07-01')),
  assessSchengenDaysUntilEligible(ledger, 10, d('2025-07-01')),
  assessDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-12-31')),
  assessContinuousResidence(ledger, c('ES'), window, SPAIN_NATIONALITY_CONTINUITY),
  assessQualifyingWork([], { start: d('2023-07-26'), end: d('2026-07-25') }, ['eu-sbc-art-6']),
  assessCanadianExperienceClass([], d('2026-07-25')),
];

/** The audience the advice boundary exists to protect: unrepresented, paying. */
const unrepresentedApplicant: ReleaseContext = {
  audience: 'applicant',
  jurisdiction: 'ES',
  representative: null,
  forConsideration: true,
  asOf: '2026-07-25',
};

describe('the advice boundary', () => {
  it('classifies every public entry point as an assessment', () => {
    for (const out of outputs) {
      expect(out.classification).toBe('assessment');
    }
  });

  it('releases every output to an unrepresented paying applicant', () => {
    // The point of counting days rather than recommending them: nothing this
    // package emits needs a licensed human standing behind it, so nothing it
    // emits can be withheld from the person whose days these are.
    for (const out of outputs) {
      expect(canRelease(out.classification, unrepresentedApplicant)).toEqual({ allowed: true });
    }
  });

  it('never emits an empty citation list, which would make an assessment unreleasable', () => {
    for (const out of outputs) {
      expect(out.citationIds.length).toBeGreaterThan(0);
    }
  });

  it('cites only sources the package can resolve', () => {
    for (const out of outputs) {
      for (const id of out.citationIds) {
        expect(findPresenceCitation(id), `unresolvable citation ${id}`).not.toBeNull();
      }
    }
  });
});

describe('citation-backed accumulation', () => {
  it('refuses to accumulate work against an uncited window', () => {
    // The lookback window is the rule. An accumulation with no cited basis for
    // its own window is a number with no provenance.
    expect(() =>
      assessQualifyingWork([], { start: d('2023-07-26'), end: d('2026-07-25') }, []),
    ).toThrow(MeridianError);
  });
});

describe('the citation catalog', () => {
  it('is well-formed and internally unique', () => {
    const ids = PRESENCE_CITATIONS.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const citation of PRESENCE_CITATIONS) {
      expect(isCitationWellFormed(citation)).toBe(true);
      expect(citation.verifiedOn).toBe(CATALOG_VERIFIED_ON);
    }
  });

  it('is fresh as of the date it was verified', () => {
    for (const citation of PRESENCE_CITATIONS) {
      expect(staleness(citation, CATALOG_VERIFIED_ON)).toBe('fresh');
    }
  });

  it('carries a note wherever it carries a discretionary flag', () => {
    for (const citation of PRESENCE_CITATIONS) {
      if (citation.discretionary === true) {
        expect(citation.note ?? '').not.toBe('');
      }
    }
  });

  it('returns null for an unknown id rather than throwing', () => {
    expect(findPresenceCitation('no-such-rule')).toBeNull();
  });
});

describe('wrapped values match the underlying computation', () => {
  it('carries the Schengen figures through unchanged', () => {
    const out = assessSchengenStatus(ledger, d('2025-03-31'));
    expect(out.value.daysUsed).toBe(90);
    expect(out.value.compliant).toBe(true);
    expect(out.citationIds).toEqual(['eu-sbc-art-6']);
  });

  it('carries the threshold citation for a tax day count', () => {
    const out = assessDayCountThreshold(ledger, SPAIN_IRPF_DAY_COUNT, d('2025-12-31'));
    expect(out.value.daysPresent).toBe(90);
    expect(out.value.met).toBe(false);
    expect(out.citationIds).toEqual([SPAIN_IRPF_DAY_COUNT.citation.id]);
  });

  it('carries the policy citation for a continuity assessment', () => {
    const out = assessContinuousResidence(ledger, c('ES'), window, SPAIN_NATIONALITY_CONTINUITY);
    expect(out.citationIds).toEqual([SPAIN_NATIONALITY_CONTINUITY.citation.id]);
    expect(out.value.policy.id).toBe(SPAIN_NATIONALITY_CONTINUITY.id);
  });

  it('may report null for a next-entry date without losing its classification', () => {
    const out = assessSchengenNextEntry(ledger, 91, d('2025-07-01'));
    expect(out.value).toBeNull();
    expect(out.classification).toBe('assessment');
  });

  it('expresses the same next-entry answer as a wait', () => {
    const date = assessSchengenNextEntry(ledger, 10, d('2025-07-01'));
    const wait = assessSchengenDaysUntilEligible(ledger, 10, d('2025-07-01'));
    expect(date.value).not.toBeNull();
    expect(wait.value).toBe(0);
    expect(date.value).toBe('2025-07-01');
  });
});
