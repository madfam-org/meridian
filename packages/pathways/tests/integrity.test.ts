import { isoDate, type Citation } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import { esNationalityResidenceReduced, MERIDIAN_PATHWAY_CATALOG, pathwayById, pathwaysForJurisdiction } from '../src/catalog/index.js';
import { integrityErrors, validateCatalog } from '../src/integrity.js';
import { parsePathway, safeParsePathway, type Pathway, type PathwayCitation } from '../src/schema.js';
import { TODAY } from './fixtures.js';

const codesOf = (issues: readonly { code: string }[]) => new Set(issues.map((i) => i.code));

describe('the shipped catalog', () => {
  it('passes every integrity check as at its verification date', () => {
    const result = validateCatalog(MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(integrityErrors(result)).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.pathways).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
  });

  it('raises no warnings either — every citation is used and none is aging', () => {
    const result = validateCatalog(MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(result.issues).toEqual([]);
  });

  it('goes red once the citations pass the staleness boundary', () => {
    // 180 days is the boundary in core. A build that fails because somebody has
    // to re-read a statute is the cheapest possible version of that problem.
    const aging = validateCatalog(MERIDIAN_PATHWAY_CATALOG, isoDate('2026-12-01'));
    expect(aging.ok).toBe(true);
    expect(codesOf(aging.issues)).toContain('citation_aging');

    const stale = validateCatalog(MERIDIAN_PATHWAY_CATALOG, isoDate('2027-06-01'));
    expect(stale.ok).toBe(false);
    expect(codesOf(integrityErrors(stale))).toContain('citation_stale');
  });

  it('ships nothing as counsel-reviewed', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      expect(pathway.reviewStatus).toBe('unreviewed');
    }
  });

  it('gives every criterion at least one citation that resolves', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      const declared = new Set(pathway.citations.map((c) => c.id));
      for (const criterion of pathway.criteria) {
        expect(criterion.citationIds.length).toBeGreaterThan(0);
        for (const id of criterion.citationIds) expect(declared.has(id)).toBe(true);
      }
    }
  });

  it('resolves every leadsTo target', () => {
    const ids = new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.id));
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      for (const target of pathway.leadsTo) expect(ids.has(target)).toBe(true);
    }
  });

  it('exposes lookups that return null rather than throwing on an unknown id', () => {
    expect(pathwayById('es-golden-visa')?.status).toBe('closed');
    expect(pathwayById('xx-nonexistent')).toBeNull();
    expect(pathwaysForJurisdiction('es')).toHaveLength(6);
    expect(pathwaysForJurisdiction('ZZ')).toEqual([]);
  });
});

describe('validateCatalog', () => {
  const clone = (over: Partial<Pathway>): unknown => ({ ...esNationalityResidenceReduced, ...over });

  it('reports a dangling citation reference', () => {
    const broken = clone({
      criteria: esNationalityResidenceReduced.criteria.map((c, i) =>
        i === 0 ? { ...c, citationIds: ['es-cc-art-99'] } : c,
      ),
    });
    const result = validateCatalog([broken], TODAY);
    expect(result.ok).toBe(false);
    expect(codesOf(integrityErrors(result))).toContain('unresolved_citation_id');
  });

  it('reports a leadsTo target that is not in the catalog', () => {
    const result = validateCatalog([clone({ leadsTo: ['pt-nationality'] })], TODAY);
    expect(codesOf(integrityErrors(result))).toContain('unknown_leads_to');
  });

  it('reports duplicate pathway ids', () => {
    const result = validateCatalog(
      [esNationalityResidenceReduced, esNationalityResidenceReduced],
      TODAY,
    );
    expect(codesOf(integrityErrors(result))).toContain('duplicate_pathway_id');
  });

  it('catches a typo in a fact path before it silently answers "unknown" forever', () => {
    const typo = clone({
      criteria: esNationalityResidenceReduced.criteria.map((c, i) =>
        i === 0 ? { ...c, evaluator: { op: 'is_present' as const, path: 'derived.residenceDayz' } } : c,
      ),
    });
    const result = validateCatalog([typo], TODAY);
    expect(codesOf(integrityErrors(result))).toContain('unknown_fact_path');
  });

  it('accepts a valid derived path and a $-prefixed root path', () => {
    const fine = clone({
      criteria: esNationalityResidenceReduced.criteria.map((c, i) =>
        i === 0
          ? { ...c, evaluator: { op: 'is_present' as const, path: '$.derived.legalResidenceDaysTotal' } }
          : c,
      ),
    });
    expect(validateCatalog([fine], TODAY).ok).toBe(true);
  });

  it('rejects a duration rule with no period length', () => {
    const malformed = clone({
      criteria: esNationalityResidenceReduced.criteria.map((c, i) =>
        i === 0
          ? {
              ...c,
              evaluator: {
                op: 'duration_since_at_least' as const,
                path: 'derived.continuousLegalResidenceSince',
              },
            }
          : c,
      ),
    });
    expect(codesOf(integrityErrors(validateCatalog([malformed], TODAY)))).toContain(
      'malformed_duration_spec',
    );
  });

  it('warns about a citation nothing refers to', () => {
    const orphan: PathwayCitation = {
      id: 'es-orphan',
      kind: 'secondary',
      instrument: 'Unreferenced commentary',
      jurisdiction: 'ES',
      verifiedOn: TODAY,
    };
    const result = validateCatalog(
      [clone({ citations: [...esNationalityResidenceReduced.citations, orphan] })],
      TODAY,
    );
    expect(result.ok).toBe(true);
    expect(codesOf(result.issues)).toContain('unused_citation');
  });

  it('refuses a counsel_reviewed record whose sources have gone stale', () => {
    const staleReview = clone({
      reviewStatus: 'counsel_reviewed',
      reviewedBy: 'fixture-counsel-1',
      reviewedOn: isoDate('2026-07-20'),
    });
    const result = validateCatalog([staleReview], isoDate('2027-06-01'));
    expect(codesOf(integrityErrors(result))).toContain('counsel_review_stale');
  });

  it('reports schema failures without throwing, one issue per problem', () => {
    const result = validateCatalog(
      [{ id: 'not a pathway' }, null, 42, esNationalityResidenceReduced],
      TODAY,
    );
    expect(result.ok).toBe(false);
    expect(codesOf(integrityErrors(result))).toContain('schema_invalid');
    // The valid record still comes back, so one bad row does not blind the linter.
    expect(result.pathways).toHaveLength(1);
  });

  it('accepts an empty catalog', () => {
    expect(validateCatalog([], TODAY)).toEqual({ ok: true, issues: [], pathways: [] });
  });
});

describe('pathway schema', () => {
  it('produces citations assignable to the core Citation contract', () => {
    // If this stops compiling, the catalog and `@meridian/core` have drifted
    // and `staleness()` would be reading a shape it does not understand.
    const citation: Citation = esNationalityResidenceReduced.citations[0]!;
    expect(citation.id).toBe('es-cc-art-22-1');
  });

  it('rejects a closed pathway with no closing date or closure note', () => {
    const golden = pathwayById('es-golden-visa')!;
    expect(safeParsePathway({ ...golden, closedOn: undefined }).success).toBe(false);
    expect(safeParsePathway({ ...golden, closureNote: undefined }).success).toBe(false);
  });

  it('rejects an unattributed counsel review', () => {
    expect(
      safeParsePathway({ ...esNationalityResidenceReduced, reviewStatus: 'counsel_reviewed' })
        .success,
    ).toBe(false);
  });

  it('rejects duplicate criterion and citation ids inside one pathway', () => {
    const dupCriteria = {
      ...esNationalityResidenceReduced,
      criteria: [esNationalityResidenceReduced.criteria[0], esNationalityResidenceReduced.criteria[0]],
    };
    expect(safeParsePathway(dupCriteria).success).toBe(false);

    const dupCitations = {
      ...esNationalityResidenceReduced,
      citations: [
        esNationalityResidenceReduced.citations[0],
        esNationalityResidenceReduced.citations[0],
      ],
    };
    expect(safeParsePathway(dupCitations).success).toBe(false);
  });

  it('rejects a pathway that leads to itself', () => {
    expect(
      safeParsePathway({ ...esNationalityResidenceReduced, leadsTo: ['es-nationality-residence-reduced'] })
        .success,
    ).toBe(false);
  });

  it('rejects an invalid civil date rather than rolling it over', () => {
    const bad = {
      ...esNationalityResidenceReduced,
      citations: esNationalityResidenceReduced.citations.map((c, i) =>
        i === 0 ? { ...c, verifiedOn: '2026-02-30' } : c,
      ),
    };
    expect(safeParsePathway(bad).success).toBe(false);
  });

  it('rejects a malformed id or version', () => {
    expect(safeParsePathway({ ...esNationalityResidenceReduced, id: 'Spain_Nationality' }).success).toBe(false);
    expect(safeParsePathway({ ...esNationalityResidenceReduced, version: '1.0' }).success).toBe(false);
  });

  it('parsePathway round-trips a valid record', () => {
    expect(parsePathway(esNationalityResidenceReduced).id).toBe('es-nationality-residence-reduced');
  });
});
