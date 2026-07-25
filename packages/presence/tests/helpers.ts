import type { CountryCode, IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';
import type { Stay, StayInput } from '../src/ledger.js';

export const d = (s: string): IsoDate => isoDate(s);
export const c = (s: string): CountryCode => s as CountryCode;

/** A confirmed border-stamp stay, which is the boring case the others deviate from. */
export function stayRec(
  id: string,
  country: string,
  start: string,
  end: string,
  over: Partial<Stay> = {},
): Stay {
  return {
    id,
    country: c(country),
    range: { start: d(start), end: d(end) },
    source: 'border_stamp',
    confidence: 'confirmed',
    openEnded: false,
    exemptFromSchengenShortStay: false,
    ...over,
  };
}

export function stayIn(
  id: string,
  country: string,
  start: string,
  end: string | null,
  over: Partial<StayInput> = {},
): StayInput {
  return {
    id,
    country: c(country),
    start: d(start),
    end: end === null ? null : d(end),
    source: 'border_stamp',
    confidence: 'confirmed',
    ...over,
  };
}

/**
 * Deterministic shuffle. Order-independence tests must fail reproducibly, so a
 * seeded linear congruential generator rather than `Math.random`.
 */
export function shuffle<T>(items: readonly T[], seed = 1): T[] {
  const out = [...items];
  let state = seed;
  const next = (): number => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}
