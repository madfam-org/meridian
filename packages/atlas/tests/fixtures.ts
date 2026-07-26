/**
 * Synthetic atlases for the unit tests.
 *
 * The real atlas is also tested, in `atlas.test.ts`, but it cannot exercise the
 * failure paths: it has no bloc whose membership dates are inverted, and it
 * should never have one. A check that has only ever been run against clean data
 * is a check nobody has seen fail, which is indistinguishable from a check that
 * cannot fail.
 *
 * No real personal data, no credentials, and no real legal claim: the
 * jurisdiction codes here are real ISO codes because `jurisdictionCode` requires
 * two letters, but the blocs and dates are invented and nothing in this file
 * should be read as a statement about any country.
 */

import { isoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';

import type {
  BlocEffect,
  BlocMembershipRecord,
  CorridorStock,
  Jurisdiction,
  MobilityBloc,
  ResearchStatus,
  SystemAutonomy,
} from '../src/types.js';
import { jurisdictionCode } from '../src/types.js';

export interface JurisdictionOverrides {
  readonly researchStatus?: ResearchStatus;
  readonly autonomy?: SystemAutonomy;
  readonly controlledBy?: string;
  readonly blocs?: readonly string[];
  readonly sourceUrl?: string;
  readonly verifiedOn?: IsoDate;
}

/** A minimal jurisdiction. Defaults to the honest default: a stub. */
export function fixtureJurisdiction(code: string, overrides: JurisdictionOverrides = {}): Jurisdiction {
  const status = overrides.researchStatus ?? 'stub';
  const record: Jurisdiction = {
    code: jurisdictionCode(code),
    name: { en: `Fixture ${code}`, es: `Ficticio ${code}` },
    region: 'europe',
    autonomy: overrides.autonomy ?? 'unknown',
    researchStatus: status,
    blocs: overrides.blocs ?? [],
    inbound: [],
    outboundConstraints: [],
    ...(overrides.controlledBy === undefined
      ? {}
      : { controlledBy: jurisdictionCode(overrides.controlledBy) }),
    ...(status === 'stub' && overrides.sourceUrl === undefined
      ? {}
      : { sourceUrl: overrides.sourceUrl ?? 'https://example.invalid/fixture' }),
    ...(status === 'stub' && overrides.verifiedOn === undefined
      ? {}
      : { verifiedOn: overrides.verifiedOn ?? isoDate('2026-07-25') }),
  };
  return record;
}

export interface MembershipOverrides {
  readonly partialSince?: string;
  readonly until?: string;
}

export function fixtureMembership(
  code: string,
  since: string,
  overrides: MembershipOverrides = {},
): BlocMembershipRecord {
  return {
    jurisdiction: jurisdictionCode(code),
    since: isoDate(since),
    ...(overrides.partialSince === undefined
      ? {}
      : { partialSince: isoDate(overrides.partialSince) }),
    ...(overrides.until === undefined ? {} : { until: isoDate(overrides.until) }),
  };
}

export function fixtureBloc(
  id: string,
  members: readonly BlocMembershipRecord[],
  confers: readonly BlocEffect[],
): MobilityBloc {
  return { id, name: `Fixture bloc ${id}`, kind: 'free_movement', members, confers };
}

export function fixtureStock(origin: string, destination: string, stock: number): CorridorStock {
  return {
    origin: jurisdictionCode(origin),
    destination: jurisdictionCode(destination),
    stock,
    sourceUrl: 'https://example.invalid/stock',
    asOfYear: 2024,
  };
}

/**
 * A deterministic permutation, for the ordering-independence tests.
 *
 * A seeded linear congruential generator rather than `Math.random`, so a failure
 * reproduces. The parameters are the Numerical Recipes ones; the quality of the
 * randomness does not matter, only that the shuffle is fixed and non-trivial.
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const a = out[i];
    const b = out[j];
    // `noUncheckedIndexedAccess`: both indices are in range, but prove it.
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}
