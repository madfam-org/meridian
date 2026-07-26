/**
 * Matter list filtering.
 *
 * Filters live in the query string so a filtered view is sendable. That makes
 * two things load-bearing: an unrecognised value must be *dropped* rather than
 * applied — a hand-edited URL naming a phase that no longer exists would render
 * an empty table indistinguishable from an empty caseload — and the search index
 * must not change with the interface language, or the same URL returns different
 * matters to two colleagues.
 */

import { countryCode } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  applyMatterFilter,
  jurisdictionsIn,
  matterFilterFromParams,
  matterFilterIsActive,
  matterFilterToParams,
  orderMatters,
} from '@/lib/matter-filter';
import { applicant, firmRecords, matterRecord } from './fixtures';

/** Reads a filter out of a plain object, the way a page reads search params. */
function fromQuery(query: Record<string, string>) {
  return matterFilterFromParams((key) => query[key]);
}

describe('matterFilterFromParams', () => {
  it('accepts the values the domain actually defines', () => {
    const filter = fromQuery({
      phase: 'submission',
      status: 'awaiting_authority',
      jurisdiction: 'es',
      rep: 'rep-vega',
      state: 'live',
      q: '  MAT-2026  ',
    });
    expect(filter).toEqual({
      phase: 'submission',
      status: 'awaiting_authority',
      jurisdiction: 'ES',
      representativeId: 'rep-vega',
      openState: 'live',
      query: 'MAT-2026',
    });
  });

  it('drops a phase or status that is not in the domain', () => {
    // Applying it would filter everything out and look like an empty caseload.
    const filter = fromQuery({ phase: 'triage', status: 'pending' });
    expect(filter.phase).toBeUndefined();
    expect(filter.status).toBeUndefined();
    expect(matterFilterIsActive(filter)).toBe(false);
  });

  it('drops a jurisdiction that is not two letters', () => {
    expect(fromQuery({ jurisdiction: 'ESP' }).jurisdiction).toBeUndefined();
    expect(fromQuery({ jurisdiction: 'E' }).jurisdiction).toBeUndefined();
    expect(fromQuery({ jurisdiction: '12' }).jurisdiction).toBeUndefined();
    expect(fromQuery({ jurisdiction: 'es' }).jurisdiction).toBe('ES');
  });

  it('treats "unassigned" as a filter value, not as the absence of one', () => {
    const filter = fromQuery({ rep: 'unassigned' });
    expect(filter.unassigned).toBe(true);
    expect(filter.representativeId).toBeUndefined();
    expect(matterFilterIsActive(filter)).toBe(true);
  });

  it('ignores a whitespace-only search term', () => {
    // `?q=` is what an empty search box submits; it is not a filter.
    expect(fromQuery({ q: '   ' }).query).toBeUndefined();
    expect(matterFilterIsActive(fromQuery({ q: '   ' }))).toBe(false);
  });

  it('round-trips back to the parameters it came from', () => {
    // The as-at form and every link re-emit the filter as hidden fields. A
    // lossy round trip silently clears a reader's filter when they change date.
    const query = {
      phase: 'submission',
      status: 'granted',
      jurisdiction: 'CA',
      rep: 'unassigned',
      state: 'closed',
      q: 'ontario',
    };
    const params = matterFilterToParams(fromQuery(query));
    expect(params).toEqual(query);
    expect(fromQuery(query)).toEqual(matterFilterFromParams((key) => params[key]));
  });
});

describe('applyMatterFilter', () => {
  const records = firmRecords({
    applicants: [
      applicant({ id: 'app-1', reference: 'APP-1', familyName: 'Okonkwo', givenNames: 'Chidi' }),
      applicant({ id: 'app-2', reference: 'APP-2', familyName: 'Petrenko', givenNames: 'Olha' }),
    ],
    matters: [
      matterRecord({
        reference: 'MAT-0001',
        title: 'Spanish residence',
        matter: {
          id: 'm1',
          applicantId: 'app-1',
          representativeId: 'rep-a',
          targetJurisdiction: countryCode('ES'),
          phase: 'intake',
          status: 'active',
        },
      }),
      matterRecord({
        reference: 'MAT-0002',
        title: 'Canadian work permit',
        matter: {
          id: 'm2',
          applicantId: 'app-2',
          representativeId: null,
          targetJurisdiction: countryCode('CA'),
          phase: 'submission',
          status: 'granted',
        },
      }),
    ],
  });

  it('filters on the unassigned state rather than on a missing id', () => {
    expect(
      applyMatterFilter(records, { unassigned: true }).map((m) => m.matter.id),
    ).toEqual(['m2']);
  });

  it('separates live from closed', () => {
    expect(applyMatterFilter(records, { openState: 'live' }).map((m) => m.matter.id)).toEqual(['m1']);
    expect(applyMatterFilter(records, { openState: 'closed' }).map((m) => m.matter.id)).toEqual([
      'm2',
    ]);
  });

  it('searches the applicant’s name as well as the file reference', () => {
    expect(applyMatterFilter(records, { query: 'okonkwo' }).map((m) => m.matter.id)).toEqual(['m1']);
    expect(applyMatterFilter(records, { query: 'APP-2' }).map((m) => m.matter.id)).toEqual(['m2']);
    expect(applyMatterFilter(records, { query: 'mat-0001' }).map((m) => m.matter.id)).toEqual(['m1']);
  });

  it('searches an index that does not change with the interface language', () => {
    // `applicantName` renders "Unknown applicant" for a missing record, in the
    // reader's language. Indexing that would make the same query return
    // different matters to an English and a Spanish colleague.
    const orphaned = firmRecords({
      applicants: [],
      matters: [matterRecord({ matter: { id: 'm-orphan', applicantId: 'app-gone' } })],
    });
    expect(applyMatterFilter(orphaned, { query: 'unknown' })).toHaveLength(0);
    expect(applyMatterFilter(orphaned, { query: 'desconocido' })).toHaveLength(0);
  });

  it('combines filters conjunctively', () => {
    expect(
      applyMatterFilter(records, { jurisdiction: countryCode('ES'), openState: 'closed' }),
    ).toHaveLength(0);
  });

  it('returns everything when no filter is set', () => {
    expect(applyMatterFilter(records, {})).toHaveLength(2);
  });
});

describe('orderMatters', () => {
  it('puts live work first, then phase position, then reference', () => {
    const closedEarly = matterRecord({
      reference: 'MAT-0001',
      matter: { id: 'closed', status: 'granted', phase: 'intake' },
    });
    const liveLate = matterRecord({
      reference: 'MAT-0002',
      matter: { id: 'live-late', status: 'active', phase: 'submission' },
    });
    const liveEarlyB = matterRecord({
      reference: 'MAT-0004',
      matter: { id: 'live-early-b', status: 'active', phase: 'intake' },
    });
    const liveEarlyA = matterRecord({
      reference: 'MAT-0003',
      matter: { id: 'live-early-a', status: 'active', phase: 'intake' },
    });

    expect(
      orderMatters([closedEarly, liveLate, liveEarlyB, liveEarlyA]).map((m) => m.matter.id),
    ).toEqual(['live-early-a', 'live-early-b', 'live-late', 'closed']);
  });

  it('is total, so the same set always renders in the same order', () => {
    const a = matterRecord({ reference: 'MAT-A', matter: { id: 'a' } });
    const b = matterRecord({ reference: 'MAT-B', matter: { id: 'b' } });
    expect(orderMatters([a, b])).toEqual(orderMatters([b, a]));
  });

  it('does not mutate the array it was given', () => {
    const a = matterRecord({ reference: 'MAT-B', matter: { id: 'a' } });
    const b = matterRecord({ reference: 'MAT-A', matter: { id: 'b' } });
    const input = [a, b];
    orderMatters(input);
    expect(input.map((m) => m.matter.id)).toEqual(['a', 'b']);
  });
});

describe('jurisdictionsIn', () => {
  it('offers each jurisdiction once, sorted, so the filter has no dead options', () => {
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { id: 'a', targetJurisdiction: countryCode('ES') } }),
        matterRecord({ matter: { id: 'b', targetJurisdiction: countryCode('CA') } }),
        matterRecord({ matter: { id: 'c', targetJurisdiction: countryCode('ES') } }),
      ],
    });
    expect(jurisdictionsIn(records)).toEqual(['CA', 'ES']);
  });

  it('offers nothing for an empty caseload', () => {
    expect(jurisdictionsIn(firmRecords())).toEqual([]);
  });
});
