/**
 * Coverage arithmetic.
 *
 * The tests that matter here are the degenerate ones. A coverage metric fails
 * silently, not loudly: the empty atlas that reports 100%, the missing
 * denominator that becomes 1, the duplicate row that lifts the numerator. Each
 * of those produces a number a status update would happily quote.
 */

import { describe, expect, it } from 'vitest';
import { isoDate } from '@meridian/core';

import {
  ALL_JURISDICTIONS,
  CORRIDOR_STOCK,
  DEFAULT_LARGEST_UNCOVERED,
  GLOBAL_MIGRANT_STOCK,
  computeCoverage,
} from '../src/index.js';
import { fixtureJurisdiction, fixtureStock, seededShuffle } from './fixtures.js';

const ASOF = isoDate('2026-07-25');

describe('computeCoverage — the empty case', () => {
  it('reports zero, not one, and never NaN', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions: [],
      stock: [],
      globalStock: null,
    });
    expect(report.structural.totalJurisdictions).toBe(0);
    expect(report.structural.encodedFraction).toBe(0);
    expect(report.structural.researchedFraction).toBe(0);
    expect(report.weighted.knownStock).toBe(0);
    expect(report.weighted.coveredStock).toBe(0);
    expect(report.weighted.coveredFraction).toBe(0);
    expect(report.weighted.stockTableCompleteness).toBeNull();
    expect(report.largestUncovered).toEqual([]);
    expect(Number.isNaN(report.structural.encodedFraction)).toBe(false);
    expect(Number.isNaN(report.weighted.coveredFraction)).toBe(false);
  });

  it('carries every research status as a key, at zero', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions: [],
      stock: [],
      globalStock: null,
    });
    expect(report.structural.byStatus).toEqual({
      stub: 0,
      researched: 0,
      encoded: 0,
      counsel_reviewed: 0,
    });
  });
});

describe('computeCoverage — stockTableCompleteness', () => {
  const jurisdictions = [
    fixtureJurisdiction('AA', { researchStatus: 'encoded' }),
    fixtureJurisdiction('BB', { researchStatus: 'encoded' }),
  ];
  const stock = [fixtureStock('AA', 'BB', 250)];

  it('is null when the global total is unavailable — never 1', () => {
    const report = computeCoverage({ asOf: ASOF, jurisdictions, stock, globalStock: null });
    expect(report.weighted.coveredFraction).toBe(1);
    expect(report.weighted.stockTableCompleteness).toBeNull();
  });

  it('is null for a zero or nonsensical total rather than dividing by it', () => {
    for (const globalStock of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const report = computeCoverage({ asOf: ASOF, jurisdictions, stock, globalStock });
      expect(report.weighted.stockTableCompleteness).toBeNull();
    }
  });

  it('is the table total over the world total when both are available', () => {
    const report = computeCoverage({ asOf: ASOF, jurisdictions, stock, globalStock: 1000 });
    expect(report.weighted.stockTableCompleteness).toBeCloseTo(0.25, 12);
  });
});

describe('computeCoverage — covered means both ends', () => {
  const jurisdictions = [
    fixtureJurisdiction('AA', { researchStatus: 'encoded' }),
    fixtureJurisdiction('BB', { researchStatus: 'researched' }),
    fixtureJurisdiction('CC', { researchStatus: 'counsel_reviewed' }),
    fixtureJurisdiction('DD'),
  ];

  it('does not count a corridor whose destination alone is encoded', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions,
      stock: [fixtureStock('BB', 'AA', 100)],
      globalStock: null,
    });
    expect(report.weighted.coveredStock).toBe(0);
    expect(report.largestUncovered).toHaveLength(1);
  });

  it('counts counsel_reviewed as covered, the same as encoded', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions,
      stock: [fixtureStock('AA', 'CC', 100)],
      globalStock: null,
    });
    expect(report.weighted.coveredStock).toBe(100);
    expect(report.largestUncovered).toEqual([]);
  });

  it('does not count a corridor whose endpoint is absent from the atlas', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions,
      stock: [fixtureStock('AA', 'ZZ', 100)],
      globalStock: null,
    });
    expect(report.weighted.coveredStock).toBe(0);
    expect(report.weighted.knownStock).toBe(100);
  });
});

describe('computeCoverage — structural fractions', () => {
  it('counts researched-or-better and encoded-or-better separately', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions: [
        fixtureJurisdiction('AA', { researchStatus: 'encoded' }),
        fixtureJurisdiction('BB', { researchStatus: 'researched' }),
        fixtureJurisdiction('CC'),
        fixtureJurisdiction('DD'),
      ],
      stock: [],
      globalStock: null,
    });
    expect(report.structural.byStatus).toEqual({
      stub: 2,
      researched: 1,
      encoded: 1,
      counsel_reviewed: 0,
    });
    expect(report.structural.encodedFraction).toBeCloseTo(0.25, 12);
    expect(report.structural.researchedFraction).toBeCloseTo(0.5, 12);
  });

  it('counts a repeated code once, so the denominator cannot be padded', () => {
    const duplicated = [
      fixtureJurisdiction('AA', { researchStatus: 'encoded' }),
      fixtureJurisdiction('AA', { researchStatus: 'stub' }),
      fixtureJurisdiction('BB'),
    ];
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions: duplicated,
      stock: [],
      globalStock: null,
    });
    expect(report.structural.totalJurisdictions).toBe(2);
    expect(report.structural.byStatus.encoded).toBe(1);
    expect(report.structural.byStatus.stub).toBe(1);
  });
});

describe('computeCoverage — largestUncovered', () => {
  const jurisdictions = [
    fixtureJurisdiction('AA', { researchStatus: 'encoded' }),
    fixtureJurisdiction('BB'),
    fixtureJurisdiction('CC'),
    fixtureJurisdiction('DD'),
  ];

  it('is ordered by stock descending, ties broken deterministically', () => {
    const stock = [
      fixtureStock('BB', 'CC', 100),
      fixtureStock('DD', 'CC', 500),
      fixtureStock('CC', 'BB', 100),
      fixtureStock('BB', 'DD', 300),
    ];
    const report = computeCoverage({ asOf: ASOF, jurisdictions, stock, globalStock: null });
    expect(report.largestUncovered.map((r) => `${r.origin}>${r.destination}`)).toEqual([
      'DD>CC',
      'BB>DD',
      'BB>CC',
      'CC>BB',
    ]);
  });

  it('gives the same order whatever order the rows arrive in', () => {
    const stock = [
      fixtureStock('BB', 'CC', 100),
      fixtureStock('DD', 'CC', 500),
      fixtureStock('CC', 'BB', 100),
      fixtureStock('BB', 'DD', 300),
      fixtureStock('CC', 'DD', 300),
    ];
    const straight = computeCoverage({ asOf: ASOF, jurisdictions, stock, globalStock: null });
    for (const seed of [1, 7, 20260725]) {
      const shuffled = computeCoverage({
        asOf: ASOF,
        jurisdictions: seededShuffle(jurisdictions, seed),
        stock: seededShuffle(stock, seed),
        globalStock: null,
      });
      expect(JSON.stringify(shuffled.largestUncovered)).toEqual(
        JSON.stringify(straight.largestUncovered),
      );
      expect(shuffled.weighted).toEqual(straight.weighted);
    }
  });

  it('honours the limit, and treats a limit of zero as zero rows', () => {
    const stock = [
      fixtureStock('BB', 'CC', 100),
      fixtureStock('DD', 'CC', 500),
      fixtureStock('BB', 'DD', 300),
    ];
    const limited = computeCoverage({
      asOf: ASOF,
      jurisdictions,
      stock,
      globalStock: null,
      largestUncoveredLimit: 2,
    });
    expect(limited.largestUncovered).toHaveLength(2);
    const none = computeCoverage({
      asOf: ASOF,
      jurisdictions,
      stock,
      globalStock: null,
      largestUncoveredLimit: 0,
    });
    expect(none.largestUncovered).toEqual([]);
  });

  it('carries the row through unchanged, so the source travels with the weight', () => {
    const report = computeCoverage({
      asOf: ASOF,
      jurisdictions,
      stock: [fixtureStock('BB', 'CC', 100)],
      globalStock: null,
    });
    expect(report.largestUncovered[0]).toEqual(fixtureStock('BB', 'CC', 100));
  });
});

describe('computeCoverage — against the atlas as shipped', () => {
  const report = computeCoverage({
    asOf: ASOF,
    jurisdictions: ALL_JURISDICTIONS,
    stock: CORRIDOR_STOCK,
    globalStock: GLOBAL_MIGRANT_STOCK,
  });

  it('counts every jurisdiction exactly once', () => {
    expect(report.structural.totalJurisdictions).toBe(ALL_JURISDICTIONS.length);
    const summed =
      report.structural.byStatus.stub +
      report.structural.byStatus.researched +
      report.structural.byStatus.encoded +
      report.structural.byStatus.counsel_reviewed;
    expect(summed).toBe(report.structural.totalJurisdictions);
  });

  it('has nothing counsel_reviewed, because nothing has been', () => {
    expect(report.structural.byStatus.counsel_reviewed).toBe(0);
  });

  it('covers more of the world by people than by systems, and says why', () => {
    // The two numbers have inverted, and the inversion is the point.
    //
    // Structural coverage is 4 of 249 jurisdictions — about 1.6%. Weighted
    // coverage is about 6.8% of the migrants in the stock table. Weighted now
    // EXCEEDS structural because the four encoded systems are not four
    // arbitrary ones: Mexico and the United States sit at the two ends of the
    // largest bilateral corridor on earth, so encoding Mexico moved weighted
    // coverage from 0.61% to 6.77% while moving structural coverage by four
    // tenths of a percentage point.
    //
    // Before Mexico was encoded this test asserted the opposite relationship,
    // and that was honest then: three encoded systems that no single stock row
    // ran between produced a weighted figure of zero against a non-zero
    // structural one. Both readings are correct about their own moment, which
    // is why the report prints both numbers rather than choosing one.
    expect(report.weighted.coveredFraction).toBeGreaterThan(report.structural.encodedFraction);
    expect(report.weighted.coveredFraction).toBeGreaterThan(0.05);
    expect(report.weighted.coveredFraction).toBeLessThan(0.1);

    // Still a small fraction of the world, and the report must not round that
    // away: covered stock is measured against the table, and the table itself
    // accounts for about two thirds of world migration.
    const completeness = report.weighted.stockTableCompleteness;
    expect(completeness).not.toBeNull();
    if (completeness !== null) expect(completeness).toBeLessThan(0.7);
  });

  it('accounts for well under the whole world, and reports the shortfall', () => {
    const completeness = report.weighted.stockTableCompleteness;
    expect(completeness).not.toBeNull();
    if (completeness === null) return;
    expect(completeness).toBeGreaterThan(0.6);
    expect(completeness).toBeLessThan(0.7);
  });

  it('returns the default number of uncovered corridors, largest first', () => {
    expect(report.largestUncovered).toHaveLength(DEFAULT_LARGEST_UNCOVERED);
    const stocks = report.largestUncovered.map((r) => r.stock);
    expect(stocks).toEqual([...stocks].sort((a, b) => b - a));
    // The head of this queue moved on 2026-07-26, and it moved because the work
    // got done. It read MX>US — the largest bilateral corridor on earth — until
    // Mexico was encoded as a destination; the United States already was, so
    // that corridor became covered and dropped out of the queue entirely.
    // Afghanistan to Iran is what surfaced behind it.
    //
    // Pinning the head is deliberate. This list is the work queue in value
    // order, and a queue whose front nobody asserts is a queue that can quietly
    // start recommending the wrong next thing.
    expect(report.largestUncovered[0]?.origin).toBe('AF');
    expect(report.largestUncovered[0]?.destination).toBe('IR');

    // MX>US must no longer appear anywhere in the uncovered list.
    const stillUncovered = report.largestUncovered.some(
      (r) => r.origin === 'MX' && r.destination === 'US',
    );
    expect(stillUncovered).toBe(false);
  });
});
