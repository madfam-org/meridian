/**
 * Corridor derivation.
 *
 * The cases that would actually hurt someone: a membership that had ended by the
 * date asked about, a membership that had not begun, the inclusive boundary on
 * both, and the staged-accession window where the honest answer is "ambiguous"
 * and the tempting answer is either of the two confident ones.
 */

import { describe, expect, it } from 'vitest';
import { isoDate } from '@meridian/core';

import {
  ATLAS,
  ALL_JURISDICTIONS,
  corridorsFromOrigin,
  corridorsToDestination,
  deriveCorridor,
  explainCorridor,
  indexAtlas,
  membershipStanding,
  weakerResearchStatus,
} from '../src/index.js';
import type { Atlas } from '../src/index.js';
import {
  fixtureBloc,
  fixtureJurisdiction,
  fixtureMembership,
  seededShuffle,
} from './fixtures.js';

const STAGED: Atlas = {
  jurisdictions: [
    fixtureJurisdiction('AA', { researchStatus: 'encoded' }),
    fixtureJurisdiction('BB', { researchStatus: 'researched' }),
    fixtureJurisdiction('CC'),
  ],
  blocs: [
    fixtureBloc(
      'staged',
      [
        fixtureMembership('AA', '2000-01-01'),
        fixtureMembership('BB', '2025-01-01', { partialSince: '2024-03-31' }),
      ],
      ['visa_free_entry'],
    ),
    fixtureBloc(
      'departed',
      [
        fixtureMembership('AA', '1990-01-01'),
        fixtureMembership('CC', '1990-01-01', { until: '2020-12-31' }),
      ],
      ['residence_and_work', 'visa_free_entry'],
    ),
  ],
};

describe('weakerResearchStatus', () => {
  it('takes the weaker end, in both argument orders', () => {
    expect(weakerResearchStatus('encoded', 'stub')).toBe('stub');
    expect(weakerResearchStatus('stub', 'encoded')).toBe('stub');
    expect(weakerResearchStatus('counsel_reviewed', 'researched')).toBe('researched');
    expect(weakerResearchStatus('encoded', 'encoded')).toBe('encoded');
  });
});

describe('membershipStanding', () => {
  const staged = fixtureMembership('BB', '2025-01-01', { partialSince: '2024-03-31' });
  const departed = fixtureMembership('CC', '1990-01-01', { until: '2020-12-31' });

  it('reports not_a_member for an absent record', () => {
    expect(membershipStanding(undefined, isoDate('2026-07-25'))).toBe('not_a_member');
  });

  it('treats both date boundaries as inclusive', () => {
    expect(membershipStanding(staged, isoDate('2025-01-01'))).toBe('in_force');
    expect(membershipStanding(departed, isoDate('2020-12-31'))).toBe('in_force');
    expect(membershipStanding(departed, isoDate('2021-01-01'))).toBe('ended');
    expect(membershipStanding(staged, isoDate('2024-03-31'))).toBe('partial');
    expect(membershipStanding(staged, isoDate('2024-03-30'))).toBe('not_yet');
  });

  it('reads no clock when asOf is omitted, and answers the registry present tense', () => {
    expect(membershipStanding(staged)).toBe('in_force');
    expect(membershipStanding(departed)).toBe('ended');
  });
});

describe('deriveCorridor — refusals', () => {
  it('refuses a code that is not in the atlas', () => {
    const result = deriveCorridor(ATLAS, 'ES', 'ZZ');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_INPUT');
    expect(result.error.details).toMatchObject({ role: 'destination', code: 'ZZ' });
  });

  it('refuses a malformed code rather than coercing it', () => {
    expect(deriveCorridor(ATLAS, 'Spain', 'CA').ok).toBe(false);
    expect(deriveCorridor(ATLAS, '', 'CA').ok).toBe(false);
  });

  it('refuses a corridor from a jurisdiction to itself', () => {
    const result = deriveCorridor(ATLAS, 'ES', 'ES');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('two different jurisdictions');
  });

  it('accepts a lowercase code, because the constructor normalises', () => {
    const result = deriveCorridor(ATLAS, 'mx', 'es');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.origin).toBe('MX');
    expect(result.value.destination).toBe('ES');
  });
});

describe('deriveCorridor — a bloc with an until', () => {
  it('confers the effect inside the window and nothing after it', () => {
    const inside = deriveCorridor(STAGED, 'AA', 'CC', { asOf: isoDate('2010-06-01') });
    expect(inside.ok).toBe(true);
    if (!inside.ok) return;
    expect(inside.value.sharedBlocs).toEqual(['departed']);
    expect(inside.value.effects).toEqual(['residence_and_work', 'visa_free_entry']);

    const onLastDay = deriveCorridor(STAGED, 'AA', 'CC', { asOf: isoDate('2020-12-31') });
    expect(onLastDay.ok && onLastDay.value.sharedBlocs).toEqual(['departed']);

    const after = deriveCorridor(STAGED, 'AA', 'CC', { asOf: isoDate('2021-01-01') });
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.value.sharedBlocs).toEqual([]);
    expect(after.value.effects).toEqual([]);
  });

  it('drops a withdrawn membership when no date is given', () => {
    const now = deriveCorridor(STAGED, 'AA', 'CC');
    expect(now.ok && now.value.sharedBlocs).toEqual([]);
  });

  it('holds on the real atlas: the United Kingdom in the EU and EEA', () => {
    const during = deriveCorridor(ATLAS, 'ES', 'GB', { asOf: isoDate('2015-06-01') });
    expect(during.ok).toBe(true);
    if (!during.ok) return;
    expect(during.value.sharedBlocs).toContain('eu');
    expect(during.value.sharedBlocs).toContain('eea');
    expect(during.value.effects).toContain('residence_and_work');

    const lastDay = deriveCorridor(ATLAS, 'ES', 'GB', { asOf: isoDate('2020-12-31') });
    expect(lastDay.ok && lastDay.value.sharedBlocs).toContain('eu');

    const after = deriveCorridor(ATLAS, 'ES', 'GB', { asOf: isoDate('2021-01-01') });
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.value.sharedBlocs).not.toContain('eu');
    expect(after.value.sharedBlocs).not.toContain('eea');
  });
});

describe('deriveCorridor — a bloc with a partialSince window', () => {
  it('excludes the bloc inside the window and reports it as ambiguous', () => {
    const inside = explainCorridor(STAGED, 'AA', 'BB', { asOf: isoDate('2024-06-01') });
    expect(inside.ok).toBe(true);
    if (!inside.ok) return;
    expect(inside.value.corridor.sharedBlocs).toEqual([]);
    expect(inside.value.corridor.effects).toEqual([]);
    expect(inside.value.ambiguousBlocs).toEqual(['staged']);
    expect(inside.value.blocs).toContainEqual({
      bloc: 'staged',
      origin: 'in_force',
      destination: 'partial',
      shared: false,
      ambiguous: true,
    });
  });

  it('confers the effect once accession completes, and nothing before it began', () => {
    const after = deriveCorridor(STAGED, 'AA', 'BB', { asOf: isoDate('2025-01-01') });
    expect(after.ok && after.value.sharedBlocs).toEqual(['staged']);

    const before = explainCorridor(STAGED, 'AA', 'BB', { asOf: isoDate('2024-03-30') });
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    expect(before.value.corridor.sharedBlocs).toEqual([]);
    expect(before.value.ambiguousBlocs).toEqual([]);
  });

  it('holds on the real atlas: Bulgaria acceding to Schengen in two steps', () => {
    const inside = explainCorridor(ATLAS, 'ES', 'BG', { asOf: isoDate('2024-06-01') });
    expect(inside.ok).toBe(true);
    if (!inside.ok) return;
    expect(inside.value.corridor.sharedBlocs).not.toContain('schengen');
    expect(inside.value.ambiguousBlocs).toContain('schengen');

    const complete = deriveCorridor(ATLAS, 'ES', 'BG', { asOf: isoDate('2025-01-01') });
    expect(complete.ok && complete.value.sharedBlocs).toContain('schengen');
  });
});

describe('deriveCorridor — status and effects', () => {
  it('takes the weaker end of the two research statuses', () => {
    const mixed = deriveCorridor(STAGED, 'AA', 'CC');
    expect(mixed.ok && mixed.value.researchStatus).toBe('stub');

    const both = deriveCorridor(STAGED, 'AA', 'BB');
    expect(both.ok && both.value.researchStatus).toBe('researched');
  });

  it('reports encoded only where both ends are encoded — today, ES and CA', () => {
    const esCa = deriveCorridor(ATLAS, 'ES', 'CA');
    expect(esCa.ok && esCa.value.researchStatus).toBe('encoded');

    const mxEs = deriveCorridor(ATLAS, 'MX', 'ES');
    expect(mxEs.ok && mxEs.value.researchStatus).toBe('researched');
  });

  it('deduplicates effects and orders them the same way every time', () => {
    const overlapping: Atlas = {
      jurisdictions: [fixtureJurisdiction('AA'), fixtureJurisdiction('BB')],
      blocs: [
        fixtureBloc(
          'zeta',
          [fixtureMembership('AA', '2000-01-01'), fixtureMembership('BB', '2000-01-01')],
          ['visa_free_entry', 'residence_and_work'],
        ),
        fixtureBloc(
          'alpha',
          [fixtureMembership('AA', '2000-01-01'), fixtureMembership('BB', '2000-01-01')],
          ['visa_free_entry', 'youth_mobility'],
        ),
      ],
    };
    const corridor = deriveCorridor(overlapping, 'AA', 'BB');
    expect(corridor.ok).toBe(true);
    if (!corridor.ok) return;
    expect(corridor.value.sharedBlocs).toEqual(['alpha', 'zeta']);
    expect(corridor.value.effects).toEqual([
      'residence_and_work',
      'visa_free_entry',
      'youth_mobility',
    ]);
  });

  it('reads membership from the bloc registry, not from jurisdiction.blocs', () => {
    const disagreeing: Atlas = {
      jurisdictions: [
        // Claims a membership the registry does not carry.
        fixtureJurisdiction('AA', { blocs: ['ghost'] }),
        // Claims nothing, but the registry records it.
        fixtureJurisdiction('BB'),
        fixtureJurisdiction('CC'),
      ],
      blocs: [
        fixtureBloc(
          'real',
          [fixtureMembership('BB', '2000-01-01'), fixtureMembership('CC', '2000-01-01')],
          ['residence_and_work'],
        ),
      ],
    };
    const claimed = deriveCorridor(disagreeing, 'AA', 'BB');
    expect(claimed.ok && claimed.value.sharedBlocs).toEqual([]);

    const recorded = deriveCorridor(disagreeing, 'BB', 'CC');
    expect(recorded.ok && recorded.value.sharedBlocs).toEqual(['real']);
  });

  it('is not symmetric in its endpoints', () => {
    const forward = deriveCorridor(ATLAS, 'MX', 'ES');
    const back = deriveCorridor(ATLAS, 'ES', 'MX');
    expect(forward.ok && forward.value.origin).toBe('MX');
    expect(back.ok && back.value.origin).toBe('ES');
  });
});

describe('enumeration', () => {
  it('returns one corridor per other jurisdiction, sorted by counterpart', () => {
    const out = corridorsFromOrigin(ATLAS, 'ES');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toHaveLength(ALL_JURISDICTIONS.length - 1);
    expect(out.value.every((c) => c.origin === 'ES')).toBe(true);
    expect(out.value.some((c) => c.destination === 'ES')).toBe(false);
    const destinations = out.value.map((c) => c.destination);
    expect(destinations).toEqual([...destinations].sort());
  });

  it('enumerates the other direction with the same shape', () => {
    const out = corridorsToDestination(ATLAS, 'CA');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toHaveLength(ALL_JURISDICTIONS.length - 1);
    expect(out.value.every((c) => c.destination === 'CA')).toBe(true);
    const origins = out.value.map((c) => c.origin);
    expect(origins).toEqual([...origins].sort());
  });

  it('errs on an unknown origin rather than returning an empty list', () => {
    const out = corridorsFromOrigin(ATLAS, 'ZZ');
    expect(out.ok).toBe(false);
    const other = corridorsToDestination(ATLAS, 'ZZ');
    expect(other.ok).toBe(false);
  });

  it('is independent of the order the jurisdictions were assembled in', () => {
    const shuffled: Atlas = {
      jurisdictions: seededShuffle(ALL_JURISDICTIONS, 20260725),
      blocs: seededShuffle(ATLAS.blocs, 991),
    };
    const original = corridorsFromOrigin(ATLAS, 'ES');
    const permuted = corridorsFromOrigin(shuffled, 'ES');
    expect(original.ok && permuted.ok).toBe(true);
    if (!original.ok || !permuted.ok) return;
    expect(JSON.stringify(permuted.value)).toEqual(JSON.stringify(original.value));
  });
});

describe('indexAtlas', () => {
  it('is cached per atlas object', () => {
    expect(indexAtlas(ATLAS)).toBe(indexAtlas(ATLAS));
  });

  it('indexes every jurisdiction and every bloc', () => {
    const index = indexAtlas(ATLAS);
    expect(index.jurisdictionsByCode.size).toBe(ALL_JURISDICTIONS.length);
    expect(index.blocsById.size).toBe(ATLAS.blocs.length);
  });

  it('is not fooled by a key carried on the prototype chain', () => {
    const index = indexAtlas(ATLAS);
    expect(index.jurisdictionsByCode.has('toString' as never)).toBe(false);
    expect(index.blocsById.has('constructor')).toBe(false);
    expect(deriveCorridor(ATLAS, 'ES', '__proto__').ok).toBe(false);
  });
});
