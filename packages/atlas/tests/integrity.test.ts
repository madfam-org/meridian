/**
 * Integrity of the atlas.
 *
 * Every rule here describes a way the atlas can be wrong without anything
 * throwing — and every one of them moves the coverage number in the comfortable
 * direction. A missing jurisdiction shrinks the denominator. A duplicate
 * double-counts a status. A bloc id that resolves to nothing removes a right
 * from every corridor that touches it, quietly.
 *
 * So each rule is exercised against synthetic data that actually breaks it. A
 * checker that has only run against clean input has never been seen to fail, and
 * a check that cannot fail agrees with everything.
 */

import { describe, expect, it } from 'vitest';
import { isoDate } from '@meridian/core';

import {
  ATLAS_INTEGRITY,
  ALL_JURISDICTIONS,
  CORRIDOR_STOCK,
  INTEGRITY_RULE_COUNT,
  JURISDICTION_CODE_COLLISIONS,
  JURISDICTION_REGISTRIES,
  MOBILITY_BLOCS,
  blocCrossReferenceGaps,
  checkAtlasIntegrity,
  mergeJurisdictionRegistries,
} from '../src/index.js';
import type { AtlasIntegrityInput, IntegrityRule } from '../src/index.js';
import type { Jurisdiction } from '../src/types.js';
import { jurisdictionCode } from '../src/types.js';
import { fixtureBloc, fixtureJurisdiction, fixtureMembership, fixtureStock } from './fixtures.js';

function check(input: Partial<AtlasIntegrityInput>): readonly IntegrityRule[] {
  return checkAtlasIntegrity({
    registries: input.registries ?? [],
    blocs: input.blocs ?? [],
    stock: input.stock ?? [],
  }).map((finding) => finding.rule);
}

const CLEAN: AtlasIntegrityInput = {
  registries: [
    {
      source: 'fixture.ts',
      jurisdictions: [
        fixtureJurisdiction('AA', { researchStatus: 'encoded', blocs: ['real'] }),
        fixtureJurisdiction('BB', { researchStatus: 'researched', blocs: ['real'] }),
        fixtureJurisdiction('CC', { autonomy: 'delegated', controlledBy: 'AA' }),
      ],
    },
  ],
  blocs: [
    fixtureBloc(
      'real',
      [fixtureMembership('AA', '2000-01-01'), fixtureMembership('BB', '2000-01-01')],
      ['residence_and_work'],
    ),
  ],
  stock: [fixtureStock('AA', 'BB', 100)],
};

describe('checkAtlasIntegrity — a clean atlas', () => {
  it('finds nothing, and exercises every rule to get there', () => {
    expect(checkAtlasIntegrity(CLEAN)).toEqual([]);
    expect(INTEGRITY_RULE_COUNT).toBe(16);
  });
});

describe('checkAtlasIntegrity — one test per rule', () => {
  it('duplicate_jurisdiction_code: the same code from two region files', () => {
    const findings = checkAtlasIntegrity({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] },
        { source: 'b.ts', jurisdictions: [fixtureJurisdiction('AA')] },
      ],
      blocs: [],
      stock: [],
    });
    expect(findings.map((f) => f.rule)).toEqual(['duplicate_jurisdiction_code']);
    expect(findings[0]?.subject).toBe('AA');
    expect(findings[0]?.detail).toContain('a.ts and b.ts');
  });

  it('collision_lost_research: first-wins discarded the better record', () => {
    const rules = check({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] },
        { source: 'b.ts', jurisdictions: [fixtureJurisdiction('AA', { researchStatus: 'encoded' })] },
      ],
    });
    expect(rules).toEqual(['duplicate_jurisdiction_code', 'collision_lost_research']);
  });

  it('collision_lost_research: silent when the kept record is the better one', () => {
    const rules = check({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA', { researchStatus: 'encoded' })] },
        { source: 'b.ts', jurisdictions: [fixtureJurisdiction('AA')] },
      ],
    });
    expect(rules).toEqual(['duplicate_jurisdiction_code']);
  });

  it('unresolved_bloc_reference: a bloc id no registry carries', () => {
    const findings = checkAtlasIntegrity({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA', { blocs: ['cemac'] })] },
      ],
      blocs: [],
      stock: [],
    });
    expect(findings.map((f) => f.rule)).toEqual(['unresolved_bloc_reference']);
    expect(findings[0]?.subject).toBe('AA/cemac');
  });

  it('bloc_membership_disagreement: the bloc exists but omits the claimant', () => {
    const findings = checkAtlasIntegrity({
      registries: [
        {
          source: 'a.ts',
          jurisdictions: [fixtureJurisdiction('AA', { blocs: ['real'] }), fixtureJurisdiction('BB')],
        },
      ],
      blocs: [fixtureBloc('real', [fixtureMembership('BB', '2000-01-01')], ['residence_and_work'])],
      stock: [],
    });
    expect(findings.map((f) => f.rule)).toEqual(['bloc_membership_disagreement']);
    expect(findings[0]?.subject).toBe('AA/real');
  });

  it('unresolved_bloc_member: a member code that is not a jurisdiction', () => {
    const rules = check({
      registries: [{ source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] }],
      blocs: [fixtureBloc('real', [fixtureMembership('ZZ', '2000-01-01')], ['visa_free_entry'])],
    });
    expect(rules).toEqual(['unresolved_bloc_member']);
  });

  it('duplicate_bloc_id: two bloc records with one id', () => {
    const rules = check({
      blocs: [fixtureBloc('real', [], []), fixtureBloc('real', [], [])],
    });
    expect(rules).toEqual(['duplicate_bloc_id']);
  });

  it('duplicate_bloc_membership: one jurisdiction listed twice in one bloc', () => {
    const rules = check({
      registries: [{ source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] }],
      blocs: [
        fixtureBloc(
          'real',
          [fixtureMembership('AA', '2000-01-01'), fixtureMembership('AA', '2010-01-01')],
          ['visa_free_entry'],
        ),
      ],
    });
    expect(rules).toEqual(['duplicate_bloc_membership']);
  });

  it('membership_dates_inverted: an until before its since', () => {
    const rules = check({
      registries: [{ source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] }],
      blocs: [
        fixtureBloc(
          'real',
          [fixtureMembership('AA', '2000-01-01', { until: '1999-12-31' })],
          ['visa_free_entry'],
        ),
      ],
    });
    expect(rules).toEqual(['membership_dates_inverted']);
  });

  it('unresolved_stock_endpoint: reported once per bad end', () => {
    const findings = checkAtlasIntegrity({
      registries: [{ source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] }],
      blocs: [],
      stock: [fixtureStock('YY', 'ZZ', 100)],
    });
    expect(findings.map((f) => f.rule)).toEqual([
      'unresolved_stock_endpoint',
      'unresolved_stock_endpoint',
    ]);
    expect(findings.every((f) => f.subject === 'YY>ZZ')).toBe(true);
  });

  it('stock_row_self_corridor: origin equal to destination', () => {
    const rules = check({
      registries: [{ source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] }],
      stock: [fixtureStock('AA', 'AA', 100)],
    });
    expect(rules).toEqual(['stock_row_self_corridor']);
  });

  it('duplicate_stock_row: the same ordered pair twice', () => {
    const rules = check({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA'), fixtureJurisdiction('BB')] },
      ],
      stock: [fixtureStock('AA', 'BB', 100), fixtureStock('AA', 'BB', 100)],
    });
    expect(rules).toEqual(['duplicate_stock_row']);
  });

  it('invalid_stock_value: negative and non-finite figures', () => {
    const rules = check({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA'), fixtureJurisdiction('BB')] },
      ],
      stock: [fixtureStock('AA', 'BB', -1), fixtureStock('BB', 'AA', Number.NaN)],
    });
    expect(rules).toEqual(['invalid_stock_value', 'invalid_stock_value']);
  });

  it('missing_source_above_stub: promoted without a source', () => {
    const promoted: Jurisdiction = {
      code: jurisdictionCode('AA'),
      name: { en: 'Fixture AA', es: 'Ficticio AA' },
      region: 'europe',
      autonomy: 'autonomous',
      researchStatus: 'researched',
      blocs: [],
      inbound: [],
      outboundConstraints: [],
    };
    const findings = checkAtlasIntegrity({
      registries: [{ source: 'a.ts', jurisdictions: [promoted] }],
      blocs: [],
      stock: [],
    });
    expect(findings.map((f) => f.rule)).toEqual(['missing_source_above_stub']);
    expect(findings[0]?.detail).toContain('sourceUrl and verifiedOn');
  });

  it('missing_source_above_stub: silent for a stub, which is meant to have neither', () => {
    expect(
      check({ registries: [{ source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] }] }),
    ).toEqual([]);
  });

  it('missing_source_above_stub: an empty sourceUrl is not a source', () => {
    const rules = check({
      registries: [
        {
          source: 'a.ts',
          jurisdictions: [
            fixtureJurisdiction('AA', {
              researchStatus: 'encoded',
              sourceUrl: '',
              verifiedOn: isoDate('2026-07-25'),
            }),
          ],
        },
      ],
    });
    expect(rules).toEqual(['missing_source_above_stub']);
  });

  it('delegated_without_controller: delegated to nowhere', () => {
    const rules = check({
      registries: [
        { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA', { autonomy: 'delegated' })] },
      ],
    });
    expect(rules).toEqual(['delegated_without_controller']);
  });

  it('unresolved_controller: controlledBy naming a jurisdiction that is not here', () => {
    const rules = check({
      registries: [
        {
          source: 'a.ts',
          jurisdictions: [
            fixtureJurisdiction('AA', { autonomy: 'delegated', controlledBy: 'ZZ' }),
          ],
        },
      ],
    });
    expect(rules).toEqual(['unresolved_controller']);
  });

  it('controller_self_reference: controlledBy pointing at itself', () => {
    const rules = check({
      registries: [
        {
          source: 'a.ts',
          jurisdictions: [
            fixtureJurisdiction('AA', { autonomy: 'delegated', controlledBy: 'AA' }),
          ],
        },
      ],
    });
    expect(rules).toEqual(['controller_self_reference']);
  });

  it('resolves a controller that lives in another region file', () => {
    expect(
      check({
        registries: [
          { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA')] },
          {
            source: 'b.ts',
            jurisdictions: [fixtureJurisdiction('BB', { autonomy: 'delegated', controlledBy: 'AA' })],
          },
        ],
      }),
    ).toEqual([]);
  });
});

describe('checkAtlasIntegrity — determinism', () => {
  it('produces identical output on repeated runs', () => {
    const a = checkAtlasIntegrity({
      registries: JURISDICTION_REGISTRIES,
      blocs: MOBILITY_BLOCS,
      stock: CORRIDOR_STOCK,
    });
    const b = checkAtlasIntegrity({
      registries: JURISDICTION_REGISTRIES,
      blocs: MOBILITY_BLOCS,
      stock: CORRIDOR_STOCK,
    });
    expect(JSON.stringify(b)).toEqual(JSON.stringify(a));
  });
});

describe('mergeJurisdictionRegistries', () => {
  it('keeps the first record and reports the whole trail', () => {
    const merged = mergeJurisdictionRegistries([
      { source: 'a.ts', jurisdictions: [fixtureJurisdiction('AA', { researchStatus: 'researched' })] },
      { source: 'b.ts', jurisdictions: [fixtureJurisdiction('AA'), fixtureJurisdiction('BB')] },
    ]);
    expect(merged.jurisdictions.map((j) => j.code)).toEqual(['AA', 'BB']);
    expect(merged.collisions).toHaveLength(1);
    expect(merged.collisions[0]?.keptFrom).toBe('a.ts');
    expect(merged.collisions[0]?.keptStatus).toBe('researched');
    expect(merged.collisions[0]?.dropped).toEqual([{ source: 'b.ts', status: 'stub' }]);
    expect(merged.collisions[0]?.lostResearch).toBe(false);
  });

  it('finds no collision where there is none', () => {
    expect(mergeJurisdictionRegistries([]).collisions).toEqual([]);
    expect(
      mergeJurisdictionRegistries([{ source: 'a.ts', jurisdictions: [] }]).jurisdictions,
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The atlas as shipped
// ---------------------------------------------------------------------------

/**
 * The defects the atlas has today, pinned exactly.
 *
 * Not a list of things that are acceptable. It is a baseline that fails in both
 * directions: a new defect fails the suite, and so does fixing one of these
 * without deleting the line. An `expect(findings).toEqual([])` would be honest
 * only if it passed, and an `expect(findings.length).toBeLessThan(20)` is how a
 * known-issues list turns into a budget nobody ever spends down.
 */
const PINNED_FINDINGS: readonly string[] = [
  // Empty, and it earned that. Every finding this list once held was fixed
  // rather than accepted, and each is recorded below so the empty array reads as
  // a result instead of as a check nobody wrote.
  //
  // Fixed 2026-07-25:
  //   unresolved_bloc_reference:{CF,CG,CM,GA,GQ,TD}/cemac — the bloc registry now
  //   carries `cemac`, conferring visa-free entry only, from 2017-10-31.
  //   bloc_membership_disagreement:{CO,EC,PE}/mercosur-residence — the bloc
  //   registry now lists all three, each on its own verified accession date.
  //
  // Fixed 2026-07-26:
  //   duplicate_jurisdiction_code:{AM,AZ,GE,TR} — transcontinental. UN M49 files
  //   these under Western Asia, the Council of Europe counts them as European,
  //   and both region agents included them rather than risk each assuming the
  //   other had. `regions/europe.ts` dropped its four entries; the Asia records
  //   were equal or better on every field. Summing the region files now gives
  //   the same total as the assembled atlas, which it did not before.
];

describe('the atlas as shipped', () => {
  it('has exactly the defects recorded above, no more and no fewer', () => {
    expect(ATLAS_INTEGRITY.map((f) => `${f.rule}:${f.subject}`)).toEqual(PINNED_FINDINGS);
  });

  it('has no duplicate code to merge at all', () => {
    // The stronger statement. The merge exists as a read-time repair so that one
    // careless addition cannot corrupt the denominator silently; an empty
    // collision list means nothing is currently relying on that repair, which is
    // the state we want it in.
    expect(JURISDICTION_CODE_COLLISIONS).toEqual([]);
  });

  it('has no duplicate code left after the merge', () => {
    const codes = ALL_JURISDICTIONS.map((j) => j.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('resolves every stock endpoint, so no corridor is uncountable by construction', () => {
    const codes = new Set(ALL_JURISDICTIONS.map((j) => j.code));
    const unresolved = CORRIDOR_STOCK.filter(
      (row) => !codes.has(row.origin) || !codes.has(row.destination),
    );
    expect(unresolved).toEqual([]);
  });

  it('resolves every bloc member to a jurisdiction', () => {
    const codes = new Set(ALL_JURISDICTIONS.map((j) => j.code));
    const unresolved = MOBILITY_BLOCS.flatMap((bloc) =>
      bloc.members.filter((m) => !codes.has(m.jurisdiction)).map((m) => `${bloc.id}/${m.jurisdiction}`),
    );
    expect(unresolved).toEqual([]);
  });

  it('carries a source and a verification date on everything above stub', () => {
    const missing = ALL_JURISDICTIONS.filter(
      (j) => j.researchStatus !== 'stub' && (j.sourceUrl === undefined || j.verifiedOn === undefined),
    ).map((j) => j.code);
    expect(missing).toEqual([]);
  });

  it('names a controller for every delegated jurisdiction', () => {
    const codes = new Set(ALL_JURISDICTIONS.map((j) => j.code));
    const broken = ALL_JURISDICTIONS.filter(
      (j) =>
        (j.autonomy === 'delegated' && j.controlledBy === undefined) ||
        (j.controlledBy !== undefined && !codes.has(j.controlledBy)),
    ).map((j) => j.code);
    expect(broken).toEqual([]);
  });

  it('reports the cross-reference backfill separately from the errors', () => {
    const gaps = blocCrossReferenceGaps({
      registries: JURISDICTION_REGISTRIES,
      blocs: MOBILITY_BLOCS,
      stock: CORRIDOR_STOCK,
    });
    // Large, and not an error: derivation reads the bloc registry, so these
    // corridors are right. It is the jurisdiction entries that under-describe.
    expect(gaps.length).toBeGreaterThan(100);
    expect(gaps.some((g) => g.jurisdiction === 'BE' && g.bloc === 'eu')).toBe(true);
    const keys = gaps.map((g) => `${g.jurisdiction}/${g.bloc}`);
    expect(keys).toEqual([...keys].sort());
  });
});
