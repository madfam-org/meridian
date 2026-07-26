import { isoDate, type Citation } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import { esNationalityResidenceReduced, MERIDIAN_PATHWAY_CATALOG, pathwayById, pathwaysForJurisdiction } from '../src/catalog/index.js';
import { integrityErrors, validateCatalog, type IntegrityIssue } from '../src/integrity.js';
import { parsePathway, safeParsePathway, type Criterion, type Pathway, type PathwayCitation } from '../src/schema.js';
import { CA, TODAY } from './fixtures.js';

const codesOf = (issues: readonly { code: string }[]) => new Set(issues.map((i) => i.code));

const signatureOf = (issues: readonly IntegrityIssue[]) =>
  issues.map((i) => `${i.code} ${i.pathwayId ?? '-'} ${i.criterionId ?? '-'} ${i.citationId ?? '-'}`).sort();

/**
 * The cross-pathway citation warnings the shipped catalog raises today.
 *
 * This list is written out rather than counted because a count that says "9"
 * passes just as happily when one is fixed and another appears. Each of these
 * is a real inconsistency somebody has to reconcile in a catalog file — two
 * records naming the same source with a different URL, a different provision
 * label, or a different note — and none of them makes any single report wrong,
 * which is why they are warnings rather than errors.
 */
const KNOWN_CITATION_WARNINGS: readonly string[] = [
  'citation_id_conflict ca-cusma-intra-company-transferee - ca-cusma-citizenship-requirement',
  'citation_id_conflict ca-cusma-investor - ca-cusma-citizenship-requirement',
  'citation_id_conflict ca-cusma-trader - ca-cusma-citizenship-requirement',
  'citation_id_conflict ca-family-dependent-child - ca-irpa-s-11-1',
  'citation_id_conflict ca-family-spouse-partner-outland - ca-irpa-s-11-1',
  'citation_id_conflict ca-provincial-nominee-program - ca-irpa-s-10-3',
  'citation_note_divergence ca-cusma-investor - ca-irpr-s-87-1',
  'citation_note_divergence ca-post-graduation-work-permit - ca-irpr-s-87-1',
  'citation_note_divergence ca-study-permit - ca-irpr-s-87-1',
].sort();

describe('the shipped catalog', () => {
  it('passes every integrity check as at its verification date', () => {
    const result = validateCatalog(MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(integrityErrors(result)).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.pathways).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
  });

  it('raises exactly the known citation-consistency warnings and nothing else', () => {
    // Every citation is used, none is aging, and the only warnings left are the
    // enumerated cross-pathway ones. Asserting the whole list rather than a
    // count means a newly introduced inconsistency fails here instead of hiding
    // behind one that was fixed the same week.
    const result = validateCatalog(MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(signatureOf(result.issues)).toEqual(KNOWN_CITATION_WARNINGS);
  });

  it('proves it actually read the catalog rather than agreeing with nothing', () => {
    // A checker that silently scans zero records reports zero problems. These
    // are the read-proofs: the catalog is non-trivially large, and the parse
    // consumed all of it.
    const result = validateCatalog(MERIDIAN_PATHWAY_CATALOG, TODAY);
    expect(MERIDIAN_PATHWAY_CATALOG.length).toBeGreaterThanOrEqual(49);
    expect(result.pathways).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
    const criteria = MERIDIAN_PATHWAY_CATALOG.reduce((n, p) => n + p.criteria.length, 0);
    const citations = MERIDIAN_PATHWAY_CATALOG.reduce((n, p) => n + p.citations.length, 0);
    expect(criteria).toBeGreaterThanOrEqual(261);
    expect(citations).toBeGreaterThanOrEqual(311);
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
    expect(pathwaysForJurisdiction('es')).toHaveLength(26);
    expect(pathwaysForJurisdiction('ZZ')).toEqual([]);
  });

  it('gives every pathway at least one blocking criterion', () => {
    // Without one the engine can never return `ineligible`, so the route says
    // yes on the strength of nothing decisive.
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      const blocking = pathway.criteria.filter((c) => c.weight === 'blocking');
      expect(blocking.length, `${pathway.id} has no blocking criterion`).toBeGreaterThan(0);
    }
  });

  it('explains every escalation to a human in both languages', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      for (const criterion of pathway.criteria) {
        if (criterion.requiresHumanReview !== true && criterion.humanReviewWhen === undefined) {
          // A reason on a criterion that can never escalate is a dead field.
          expect(
            criterion.humanReviewReason,
            `${pathway.id}/${criterion.id} carries a reason it can never show`,
          ).toBeUndefined();
          continue;
        }
        const reason = criterion.humanReviewReason;
        expect(reason, `${pathway.id}/${criterion.id} escalates with no reason`).toBeDefined();
        expect(reason?.en.trim().length ?? 0).toBeGreaterThan(0);
        expect(reason?.es.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('leaves no bilingual field blank in either language', () => {
    const nonBlank = (text: { en: string; es: string } | undefined, where: string) => {
      if (text === undefined) return;
      expect(text.en.trim(), `${where}.en`).not.toBe('');
      expect(text.es.trim(), `${where}.es`).not.toBe('');
    };
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      nonBlank(pathway.name, `${pathway.id}.name`);
      nonBlank(pathway.summary, `${pathway.id}.summary`);
      nonBlank(pathway.closureNote, `${pathway.id}.closureNote`);
      nonBlank(pathway.durations.note, `${pathway.id}.durations.note`);
      for (const criterion of pathway.criteria) {
        nonBlank(criterion.label, `${pathway.id}/${criterion.id}.label`);
        nonBlank(criterion.guidance, `${pathway.id}/${criterion.id}.guidance`);
      }
    }
  });

  it('never points a leadsTo at itself or at the same target twice', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      expect(pathway.leadsTo).not.toContain(pathway.id);
      expect(new Set(pathway.leadsTo).size).toBe(pathway.leadsTo.length);
    }
  });

  it('keeps every bridge inside its own jurisdiction', () => {
    // Not a legal rule, a modelling one: a Spanish permit that "leads to" a
    // Canadian class would be asserting a relationship no instrument creates.
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      for (const target of pathway.leadsTo) {
        expect(pathwayById(target)?.jurisdiction).toBe(pathway.jurisdiction);
      }
    }
  });

  it('records a closing date and a note on every route that is not open', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      if (pathway.status === 'open') continue;
      expect(pathway.closureNote, `${pathway.id} closes with no note`).toBeDefined();
      if (pathway.status === 'closed') expect(pathway.closedOn).toBeDefined();
    }
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

describe('validateCatalog — the checks the expanded catalog made worth having', () => {
  const clone = (over: Partial<Pathway>): unknown => ({ ...esNationalityResidenceReduced, ...over });
  const firstCriterion = esNationalityResidenceReduced.criteria[0]!;
  const withFirstCriterion = (over: Partial<Criterion>): unknown =>
    clone({
      criteria: esNationalityResidenceReduced.criteria.map((c, i) =>
        i === 0 ? { ...c, ...over } : c,
      ) as Criterion[],
    });

  it('refuses a pathway with no blocking criterion at all', () => {
    const advisoryOnly = clone({
      criteria: esNationalityResidenceReduced.criteria.map((c) => ({
        ...c,
        weight: 'material' as const,
      })),
    });
    const result = validateCatalog([advisoryOnly], TODAY);
    expect(result.ok).toBe(false);
    expect(codesOf(integrityErrors(result))).toContain('no_blocking_criterion');
  });

  it('accepts a pathway that keeps a single blocking criterion', () => {
    const oneBlocking = clone({
      criteria: esNationalityResidenceReduced.criteria.map((c, i) => ({
        ...c,
        weight: i === 0 ? ('blocking' as const) : ('material' as const),
      })),
    });
    expect(codesOf(validateCatalog([oneBlocking], TODAY).issues)).not.toContain(
      'no_blocking_criterion',
    );
  });

  it('refuses an escalation that does not say what the reviewer must decide', () => {
    const silent = withFirstCriterion({ requiresHumanReview: true, humanReviewReason: undefined });
    const result = validateCatalog([silent], TODAY);
    expect(result.ok).toBe(false);
    expect(codesOf(integrityErrors(result))).toContain('missing_human_review_reason');
  });

  it('applies the same rule to a conditional escalation', () => {
    const conditional = withFirstCriterion({
      humanReviewWhen: { op: 'is_present', path: 'claimedNationality' },
      humanReviewReason: undefined,
    });
    expect(codesOf(integrityErrors(validateCatalog([conditional], TODAY)))).toContain(
      'missing_human_review_reason',
    );
  });

  it('does not accept guidance as a substitute for the reason', () => {
    // `evaluate` surfaces `humanReviewReason`, never `guidance`, on the
    // escalation path. Guidance in its place reads fine in the source and shows
    // the reader a generic sentence.
    const guidanceOnly = withFirstCriterion({
      requiresHumanReview: true,
      humanReviewReason: undefined,
      guidance: { en: 'Speak to a lawyer.', es: 'Consulte a un abogado.' },
    });
    expect(codesOf(integrityErrors(validateCatalog([guidanceOnly], TODAY)))).toContain(
      'missing_human_review_reason',
    );
  });

  it('accepts an escalation that carries a reason', () => {
    const explained = withFirstCriterion({
      requiresHumanReview: true,
      humanReviewReason: {
        en: 'A registrar decides whether the acquisition was by origin.',
        es: 'El encargado del registro decide si la adquisición fue de origen.',
      },
    });
    expect(codesOf(validateCatalog([explained], TODAY).issues)).not.toContain(
      'missing_human_review_reason',
    );
  });

  it('catches a bilingual field that is whitespace rather than empty', () => {
    // `localizedTextSchema` rejects `''`. A value of `'   '` has length three,
    // passes zod, and renders as nothing at all.
    const blankSpanish = clone({ summary: { en: esNationalityResidenceReduced.summary.en, es: '   ' } });
    const result = validateCatalog([blankSpanish], TODAY);
    expect(result.ok).toBe(false);
    const issue = integrityErrors(result).find((i) => i.code === 'blank_localized_text');
    expect(issue?.message).toContain('summary');
    expect(issue?.message).toContain('es');
  });

  it('catches a blank criterion label and attributes it to the criterion', () => {
    const blankLabel = withFirstCriterion({ label: { en: ' ', es: firstCriterion.label.es } });
    const issue = integrityErrors(validateCatalog([blankLabel], TODAY)).find(
      (i) => i.code === 'blank_localized_text',
    );
    expect(issue?.criterionId).toBe(firstCriterion.id);
  });

  it('reports a leadsTo target named twice', () => {
    const twice = clone({
      leadsTo: ['es-nationality-residence-general', 'es-nationality-residence-general'],
    });
    const general = pathwayById('es-nationality-residence-general')!;
    const result = validateCatalog([twice, general], TODAY);
    expect(codesOf(integrityErrors(result))).toContain('duplicate_leads_to');
  });

  it('rejects a self-referential leadsTo at the schema, before validateCatalog sees it', () => {
    // The check lives in `pathwaySchema`, so the record never parses and the
    // failure arrives as `schema_invalid`. This pins where the guarantee is.
    const selfReferential = clone({ leadsTo: ['es-nationality-residence-reduced'] });
    const result = validateCatalog([selfReferential], TODAY);
    expect(result.ok).toBe(false);
    expect(codesOf(integrityErrors(result))).toContain('schema_invalid');
    expect(result.pathways).toEqual([]);
  });

  it('reports a pathway filed under a jurisdiction its id does not claim', () => {
    const misfiled = clone({ jurisdiction: CA });
    const result = validateCatalog([misfiled], TODAY);
    expect(codesOf(integrityErrors(result))).toContain('jurisdiction_prefix_mismatch');
  });

  it('warns when two pathways declare one citation id with different sources', () => {
    // A pathway that does not already declare the id, so the only problem in
    // play is the cross-pathway one.
    const other = pathwayById('es-non-lucrative-visa')!;
    const conflicting: PathwayCitation = {
      ...esNationalityResidenceReduced.citations[0]!,
      provision: 'art. 22.1 (a second label for the same article)',
    };
    const result = validateCatalog(
      [
        esNationalityResidenceReduced,
        { ...other, citations: [...other.citations, conflicting], leadsTo: [] },
      ],
      TODAY,
    );
    // Still a passing build: each record on its own resolves correctly.
    expect(result.ok).toBe(true);
    const issue = result.issues.find((i) => i.code === 'citation_id_conflict');
    expect(issue?.severity).toBe('warning');
    expect(issue?.citationId).toBe('es-cc-art-22-1');
    expect(issue?.message).toContain('provision');
  });

  it('separates a differing note from a differing source', () => {
    const other = pathwayById('es-non-lucrative-visa')!;
    const reNoted: PathwayCitation = {
      ...esNationalityResidenceReduced.citations[0]!,
      note: 'The same article, annotated for a different route.',
    };
    const result = validateCatalog(
      [
        esNationalityResidenceReduced,
        { ...other, citations: [...other.citations, reNoted], leadsTo: [] },
      ],
      TODAY,
    );
    expect(codesOf(result.issues)).toContain('citation_note_divergence');
    expect(codesOf(result.issues)).not.toContain('citation_id_conflict');
  });

  it('does not treat an absent discretionary flag as different from a false one', () => {
    // `if (!citation.discretionary)` reads both the same way. Reporting them as
    // a conflict would be the false positive that teaches a reader to skip the
    // warnings.
    const other = pathwayById('es-non-lucrative-visa')!;
    const explicitlyFalse: PathwayCitation = {
      ...esNationalityResidenceReduced.citations[0]!,
      discretionary: false,
    };
    const result = validateCatalog(
      [
        esNationalityResidenceReduced,
        { ...other, citations: [...other.citations, explicitlyFalse], leadsTo: [] },
      ],
      TODAY,
    );
    expect(codesOf(result.issues)).not.toContain('citation_id_conflict');
    expect(codesOf(result.issues)).not.toContain('citation_note_divergence');
  });

  it('says nothing when the same citation id is repeated identically', () => {
    const other = pathwayById('es-non-lucrative-visa')!;
    const identical = esNationalityResidenceReduced.citations[0]!;
    const result = validateCatalog(
      [
        esNationalityResidenceReduced,
        { ...other, citations: [...other.citations, identical], leadsTo: [] },
      ],
      TODAY,
    );
    expect(codesOf(result.issues)).not.toContain('citation_id_conflict');
    expect(codesOf(result.issues)).not.toContain('citation_note_divergence');
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
