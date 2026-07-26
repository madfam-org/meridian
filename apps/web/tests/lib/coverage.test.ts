/**
 * `lib/coverage.ts` — the register of what this catalog does not encode.
 *
 * The defect this module exists to prevent: a person living in Spain without
 * status answers every question truthfully, receives "not met", and concludes
 * they have no route — when the routes people in that position actually use are
 * not in the catalog at all. Nothing on a result page lets them detect that, so
 * the page has to say it.
 *
 * Two failure modes are worth a test each, and both are silent:
 *
 *  - **A coverage claim that grew on its own.** Encoding one route out of a
 *    family must not retire the whole family from the register, because a reader
 *    told "we cover arraigo" stops looking.
 *  - **An empty gap list read as full coverage.** A jurisdiction nobody has
 *    assessed and a jurisdiction whose every gap has been closed produce the
 *    same empty list and mean opposite things.
 */

import { describe, expect, it } from 'vitest';

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';

import {
  COVERAGE_TITLE,
  COVERED_JURISDICTIONS,
  JURISDICTIONS_WITHOUT_REGISTER,
  NOT_A_VERDICT_ON_YOU,
  OUT_OF_SCOPE_PROTECTION,
  REGISTER_IS_NOT_EXHAUSTIVE,
  UNCOVERED_ROUTES,
  WHERE_TO_ASK,
  coveredIn,
  jurisdictionName,
  uncoveredIn,
} from '@/lib/coverage';

const CATALOG_IDS = new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.id));

describe('the covered side, derived from the catalog', () => {
  it('names every jurisdiction the catalog encodes, once, in a stable order', () => {
    const fromCatalog = [...new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.jurisdiction))].sort();

    expect(COVERED_JURISDICTIONS).toEqual(fromCatalog);
    expect(new Set(COVERED_JURISDICTIONS).size).toBe(COVERED_JURISDICTIONS.length);
  });

  it('counts routes per jurisdiction from the catalog rather than from prose', () => {
    // A hand-written "six Spanish routes" is wrong the day a seventh lands, and
    // nothing tells anybody.
    let total = 0;
    for (const code of COVERED_JURISDICTIONS) {
      const routes = coveredIn(code);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.jurisdiction === code)).toBe(true);
      total += routes.length;
    }
    expect(total).toBe(MERIDIAN_PATHWAY_CATALOG.length);
  });

  it('falls back to the bare code for a jurisdiction it has no name for', () => {
    // Ugly and correct. Inventing a name would be worse than printing the code.
    expect(jurisdictionName('ES')).toEqual({ en: 'Spain', es: 'España' });
    expect(jurisdictionName('ZZ')).toEqual({ en: 'ZZ', es: 'ZZ' });
  });
});

describe('the register of omissions', () => {
  it('lists nothing the catalog has since fully encoded', () => {
    for (const route of UNCOVERED_ROUTES) {
      const stillMissing = route.closedBy.some((id) => !CATALOG_IDS.has(id));
      expect(stillMissing, `${route.key} names only routes the catalog encodes`).toBe(true);
    }
  });

  it('keeps a family listed while only part of it is encoded', () => {
    // `es-nationality-option` is in the catalog. The entry names four routes,
    // and the other three are not — so the entry stays. A reader told "we cover
    // nationality other than by residence" would stop looking for the route
    // that actually applies to them.
    const family = UNCOVERED_ROUTES.find((r) => r.key === 'es-nationality-other-than-residence');

    expect(family, 'the partially-encoded family was retired from the register').toBeDefined();
    expect(family?.closedBy.length).toBeGreaterThan(1);
    expect(family?.closedBy.some((id) => CATALOG_IDS.has(id))).toBe(true);
    expect(family?.closedBy.some((id) => !CATALOG_IDS.has(id))).toBe(true);
  });

  it('names where each missing route lives, so a reader can look it up', () => {
    // "Other routes exist" is useless. An instrument reference is something a
    // person can take to a lawyer.
    for (const route of UNCOVERED_ROUTES) {
      expect(route.name.en.length, route.key).toBeGreaterThan(0);
      expect(route.name.es.length, route.key).toBeGreaterThan(0);
      expect(route.source.en.length, route.key).toBeGreaterThan(20);
      expect(route.source.es.length, route.key).toBeGreaterThan(20);
      expect(COVERED_JURISDICTIONS).toContain(route.jurisdiction);
    }
  });

  it('gives every entry a unique key', () => {
    const keys = UNCOVERED_ROUTES.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('narrows to a jurisdiction without reordering', () => {
    // Listing Canadian omissions under a Spanish nationality result is noise,
    // and noise is what a reader learns to skip.
    const spanish = uncoveredIn(['ES']);

    expect(spanish.every((r) => r.jurisdiction === 'ES')).toBe(true);
    expect(spanish).toEqual(UNCOVERED_ROUTES.filter((r) => r.jurisdiction === 'ES'));
    expect(uncoveredIn([])).toEqual([]);
    expect(uncoveredIn(COVERED_JURISDICTIONS)).toEqual(UNCOVERED_ROUTES);
  });
});

describe('a jurisdiction nobody has assessed', () => {
  it('is reported as unknown coverage rather than as complete coverage', () => {
    // The catalog encodes routes for the United States and the register says
    // nothing about what is missing there. An empty gap list must not read as
    // full coverage.
    expect(JURISDICTIONS_WITHOUT_REGISTER).toContain('US');
    expect(uncoveredIn(['US'])).toEqual([]);
    expect(coveredIn('US').length).toBeGreaterThan(0);
  });

  it('is computed against the whole register, not the still-open part of it', () => {
    // A jurisdiction whose every gap has genuinely been closed is not the same
    // thing as one nobody has looked at.
    const withOpenGaps = new Set(UNCOVERED_ROUTES.map((r) => r.jurisdiction));
    for (const code of JURISDICTIONS_WITHOUT_REGISTER) {
      expect(withOpenGaps.has(code)).toBe(false);
      expect(COVERED_JURISDICTIONS).toContain(code);
    }
  });
});

describe('the fixed prose', () => {
  it('says that a negative result is not a verdict on the reader', () => {
    for (const half of [NOT_A_VERDICT_ON_YOU.en, NOT_A_VERDICT_ON_YOU.es]) {
      expect(half.length).toBeGreaterThan(100);
    }
    expect(NOT_A_VERDICT_ON_YOU.en).toContain('does not mean you have no immigration route');
  });

  it('names protection claims as permanently out of scope', () => {
    // A person who may have a protection claim must not be left guessing
    // whether this site simply has not got to it yet.
    expect(OUT_OF_SCOPE_PROTECTION.en).toContain('asylum');
    expect(OUT_OF_SCOPE_PROTECTION.es).toContain('asilo');
  });

  it('says who may lawfully answer, without naming a firm', () => {
    expect(WHERE_TO_ASK.en).toContain('Colegio de Abogados');
    expect(WHERE_TO_ASK.en).toContain('91(2)');
    expect(WHERE_TO_ASK.en).toContain('names no firm');
  });

  it('says the register is a list of known omissions, not a survey', () => {
    expect(REGISTER_IS_NOT_EXHAUSTIVE.en).toContain('not a complete map');
    expect(COVERAGE_TITLE.en.length).toBeGreaterThan(0);
    expect(COVERAGE_TITLE.es.length).toBeGreaterThan(0);
  });

  it('is authored in both languages everywhere', () => {
    const prose = [
      COVERAGE_TITLE,
      NOT_A_VERDICT_ON_YOU,
      OUT_OF_SCOPE_PROTECTION,
      WHERE_TO_ASK,
      REGISTER_IS_NOT_EXHAUSTIVE,
    ];
    for (const item of prose) {
      expect(item.en).not.toBe(item.es);
      expect(item.es.length).toBeGreaterThan(0);
    }
  });
});
