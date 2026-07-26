/**
 * The wiring, not the law.
 *
 * These tests are about one property: the catalog is the concatenation of its
 * source modules, in a fixed order, and nothing about an applicant can change
 * it. An order that moved with somebody's facts would be a ranking, and a
 * ranking is advice — see `recommend.ts`, which is the only thing in this
 * package allowed to produce one.
 *
 * The second thing they check is subtler and is the reason the module list is
 * data rather than a spread: a file can export a perfectly good `Pathway` and
 * forget to put it in its own array, and nothing else in the repository would
 * ever notice. A pathway that exists but is not in the catalog is a route the
 * platform researched, encoded, cited and then never showed anybody.
 */

import { describe, expect, it } from 'vitest';
import * as caFamilyPilots from '../src/catalog/ca-family-pilots.js';
import * as caFederalEconomic from '../src/catalog/ca-federal-economic.js';
import * as caProvincialQuebec from '../src/catalog/ca-provincial-quebec.js';
import * as caWorkStudy from '../src/catalog/ca-work-study.js';
import * as ca from '../src/catalog/ca.js';
import * as esArraigo from '../src/catalog/es-arraigo.js';
import * as esFamilyNationality from '../src/catalog/es-family-nationality.js';
import * as esWorkStudy from '../src/catalog/es-work-study.js';
import * as usEmployment from '../src/catalog/us-employment.js';
import * as usFamily from '../src/catalog/us-family.js';
import * as usNonimmigrant from '../src/catalog/us-nonimmigrant.js';
import * as usStatusBars from '../src/catalog/us-status-bars.js';
import * as es from '../src/catalog/es.js';
import {
  catalogSourceOf,
  MERIDIAN_CATALOG_MODULES,
  MERIDIAN_PATHWAY_CATALOG,
  pathwayById,
  pathwaysForJurisdiction,
} from '../src/catalog/index.js';
import { assess } from '../src/recommend.js';
import type { Pathway } from '../src/schema.js';
import { cecCandidate, mexicanTwoYearResident, TODAY } from './fixtures.js';

/**
 * Every module, paired with its own namespace object so a test can compare
 * "what this file exports" against "what this file contributes".
 */
const MODULE_NAMESPACES: Record<string, Record<string, unknown>> = {
  es,
  'es-arraigo': esArraigo,
  'es-work-study': esWorkStudy,
  'es-family-nationality': esFamilyNationality,
  ca,
  'ca-federal-economic': caFederalEconomic,
  'ca-provincial-quebec': caProvincialQuebec,
  'ca-work-study': caWorkStudy,
  'ca-family-pilots': caFamilyPilots,
  'us-family': usFamily,
  'us-employment': usEmployment,
  'us-nonimmigrant': usNonimmigrant,
  'us-status-bars': usStatusBars,
};

/** Duck-typing rather than a zod parse: this must catch a *malformed* export too. */
function isPathwayLike(value: unknown): value is Pathway {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record['id'] === 'string' &&
    Array.isArray(record['criteria']) &&
    Array.isArray(record['citations']) &&
    typeof record['reviewStatus'] === 'string'
  );
}

describe('catalog assembly', () => {
  it('is exactly the concatenation of the declared modules, in the declared order', () => {
    const expected = MERIDIAN_CATALOG_MODULES.flatMap((m) => m.pathways.map((p) => p.id));
    expect(MERIDIAN_PATHWAY_CATALOG.map((p) => p.id)).toEqual(expected);
  });

  it('keeps each module contiguous, so adding a route never renumbers another one', () => {
    const ids = MERIDIAN_PATHWAY_CATALOG.map((p) => p.id);
    let cursor = 0;
    for (const module of MERIDIAN_CATALOG_MODULES) {
      const slice = ids.slice(cursor, cursor + module.pathways.length);
      expect(slice).toEqual(module.pathways.map((p) => p.id));
      cursor += module.pathways.length;
    }
    expect(cursor).toBe(ids.length);
  });

  it('holds every pathway each module exports — an unwired route is an invisible one', () => {
    for (const module of MERIDIAN_CATALOG_MODULES) {
      const namespace = MODULE_NAMESPACES[module.source];
      expect(namespace, `no namespace registered for ${module.source}`).toBeDefined();
      const exported = Object.values(namespace ?? {})
        .filter(isPathwayLike)
        .map((p) => p.id)
        .sort();
      const wired = module.pathways.map((p) => p.id).sort();
      expect(wired, `${module.source} exports a Pathway it does not put in its array`).toEqual(
        exported,
      );
    }
  });

  it('registers every module namespace the test knows about, and no more', () => {
    // Guards the guard: if a module is added to the catalog and not to
    // MODULE_NAMESPACES, the check above would silently skip it.
    expect(MERIDIAN_CATALOG_MODULES.map((m) => m.source).sort()).toEqual(
      Object.keys(MODULE_NAMESPACES).sort(),
    );
  });

  it('has unique ids across every module', () => {
    const ids = MERIDIAN_PATHWAY_CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('counts 84 pathways: 26 Spanish, 23 Canadian, 35 American, and no fourth jurisdiction', () => {
    // Pinned deliberately, and it fails in both directions. A drop means a
    // module stopped being spread into the catalog and its routes went
    // invisible; a rise that nobody updated this line for means a jurisdiction
    // arrived without anyone deciding it had. Neither should pass quietly.
    expect(MERIDIAN_PATHWAY_CATALOG).toHaveLength(84);
    expect(pathwaysForJurisdiction('ES')).toHaveLength(26);
    expect(pathwaysForJurisdiction('CA')).toHaveLength(23);
    expect(pathwaysForJurisdiction('US')).toHaveLength(35);
    expect(new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.jurisdiction))).toEqual(
      new Set(['ES', 'CA', 'US']),
    );
  });

  it('files each pathway under the jurisdiction its id claims', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      expect(pathway.id.slice(0, 2).toUpperCase()).toBe(pathway.jurisdiction.toUpperCase());
    }
  });

  it('ships nothing as counsel-reviewed, and no record claims a reviewer', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      expect(pathway.reviewStatus).toBe('unreviewed');
      expect(pathway.reviewedBy).toBeUndefined();
      expect(pathway.reviewedOn).toBeUndefined();
    }
    expect(MERIDIAN_PATHWAY_CATALOG.filter((p) => p.reviewStatus === 'counsel_reviewed')).toEqual(
      [],
    );
  });
});

describe('the United States block, across its four source files', () => {
  const US_MODULES = ['us-family', 'us-employment', 'us-nonimmigrant', 'us-status-bars'];
  const usPathways = pathwaysForJurisdiction('US');

  it('is the last four modules, in the order they were added', () => {
    // The block went on the end because appending never renumbers what came
    // before, not because of anything about the corridor — which is the largest
    // in the world.
    const sources = MERIDIAN_CATALOG_MODULES.map((m) => m.source);
    expect(sources.slice(-4)).toEqual(US_MODULES);
  });

  it('keeps every bridge inside the file that declares it', () => {
    // The four files were written in parallel and none of them names an id
    // belonging to another, so no ordering of the wiring step can break a
    // `leadsTo`. Worth pinning: the failure mode of the alternative is an
    // `unknown_leads_to` error that only appears once both files are present.
    for (const module of MERIDIAN_CATALOG_MODULES) {
      if (!US_MODULES.includes(module.source)) continue;
      const own = new Set(module.pathways.map((p) => p.id));
      for (const pathway of module.pathways) {
        for (const target of pathway.leadsTo) {
          expect(own.has(target), `${module.source}: ${pathway.id} -> ${target}`).toBe(true);
        }
      }
    }
  });

  it('publishes no processing time on any of the 35 records', () => {
    expect(usPathways).toHaveLength(35);
    for (const pathway of usPathways) {
      expect(pathway.durations.publishedProcessingDays, pathway.id).toBeUndefined();
    }
  });

  it('quotes no Visa Bulletin cut-off date anywhere in the corridor', () => {
    // Preference categories are numerically limited and the bulletin moves every
    // month; per-country limits mean a Mexican applicant's position differs from
    // another nationality's by years. Any date copied out of it would be wrong
    // within weeks, so the structure of the limit is encoded and no figure is.
    // The bulletin's own format is what this looks for: `15MAR05`.
    const cutOff = /\b\d{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}\b/;
    for (const pathway of usPathways) {
      const text = [
        pathway.name.en,
        pathway.name.es,
        pathway.summary.en,
        pathway.summary.es,
        pathway.durations.note?.en,
        pathway.durations.note?.es,
        ...pathway.criteria.flatMap((c) => [
          c.label.en,
          c.label.es,
          c.guidance?.en,
          c.guidance?.es,
          c.humanReviewReason?.en,
          c.humanReviewReason?.es,
        ]),
        ...pathway.citations.flatMap((c) => [c.instrument, c.provision, c.note]),
      ].filter((s): s is string => typeof s === 'string');
      for (const value of text) {
        expect(value, `${pathway.id} quotes a Visa Bulletin cut-off`).not.toMatch(cutOff);
      }
    }
  });

  it('ships a URL on a citation only where one was fetched', () => {
    // The sweep could not retrieve travel.state.gov, fam.state.gov,
    // federalregister.gov HTML or uscis.gov. Those citations carry no `url` and
    // say why in their note. A dead or guessed link teaches the reader to stop
    // checking, so the absence is the correct state and the note is the
    // replacement.
    for (const pathway of usPathways) {
      for (const citation of pathway.citations) {
        if (citation.url !== undefined) {
          expect(citation.url, `${pathway.id}/${citation.id}`).toMatch(/^https:\/\//);
          continue;
        }
        expect(
          citation.note?.trim().length ?? 0,
          `${pathway.id}/${citation.id} has neither a url nor a note explaining its absence`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe('catalog order is not a ranking', () => {
  it('returns the same order for two applicants with nothing in common', () => {
    const spanish = assess(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY);
    const canadian = assess(cecCandidate, MERIDIAN_PATHWAY_CATALOG, TODAY);
    const catalogOrder = MERIDIAN_PATHWAY_CATALOG.map((p) => p.id);

    expect(spanish.value.assessments.map((r) => r.pathwayId)).toEqual(catalogOrder);
    expect(canadian.value.assessments.map((r) => r.pathwayId)).toEqual(catalogOrder);
  });

  it('does not float the eligible routes to the top', () => {
    const { assessments } = assess(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY).value;
    const verdicts = assessments.map((r) => r.verdict);
    const sorted = [...verdicts].sort();
    // If the catalog were ordered by outcome these would coincide. They must
    // not: the position of a route says nothing about how good an answer it is.
    expect(verdicts).not.toEqual(sorted);
  });

  it('is stable across repeated evaluation of the same facts', () => {
    const once = assess(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY).value;
    const twice = assess(mexicanTwoYearResident, MERIDIAN_PATHWAY_CATALOG, TODAY).value;
    expect(once.assessments.map((r) => r.pathwayId)).toEqual(
      twice.assessments.map((r) => r.pathwayId),
    );
  });
});

describe('catalog lookups', () => {
  it('resolves every id it contains and nothing else', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      expect(pathwayById(pathway.id)).toBe(pathway);
    }
    expect(pathwayById('es-nonexistent')).toBeNull();
    expect(pathwayById('')).toBeNull();
  });

  it('does not resolve an id carried on the prototype chain', () => {
    // `toString` is a property of every object; a Map-backed lookup must not
    // answer for it, and neither must one backed by a plain object literal.
    expect(pathwayById('toString')).toBeNull();
    expect(pathwayById('constructor')).toBeNull();
    expect(pathwayById('__proto__')).toBeNull();
  });

  it('matches a jurisdiction case-insensitively and returns catalog order', () => {
    const lower = pathwaysForJurisdiction('es').map((p) => p.id);
    const upper = pathwaysForJurisdiction('ES').map((p) => p.id);
    expect(lower).toEqual(upper);
    expect(lower).toEqual(
      MERIDIAN_PATHWAY_CATALOG.filter((p) => p.jurisdiction === 'ES').map((p) => p.id),
    );
    expect(pathwaysForJurisdiction('ZZ')).toEqual([]);
  });

  it('names the file a pathway is declared in', () => {
    expect(catalogSourceOf('es-nationality-residence-reduced')).toBe('es');
    expect(catalogSourceOf('es-arraigo-social')).toBe('es-arraigo');
    expect(catalogSourceOf('es-student-stay')).toBe('es-work-study');
    expect(catalogSourceOf('es-nationality-option')).toBe('es-family-nationality');
    expect(catalogSourceOf('ca-express-entry-cec')).toBe('ca');
    expect(catalogSourceOf('ca-federal-skilled-trades')).toBe('ca-federal-economic');
    expect(catalogSourceOf('ca-quebec-experience-peq')).toBe('ca-provincial-quebec');
    expect(catalogSourceOf('ca-study-permit')).toBe('ca-work-study');
    expect(catalogSourceOf('ca-agri-food-pilot')).toBe('ca-family-pilots');
    expect(catalogSourceOf('us-immediate-relative-spouse')).toBe('us-family');
    expect(catalogSourceOf('us-eb5-immigrant-investor')).toBe('us-employment');
    expect(catalogSourceOf('us-tn-usmca-professional')).toBe('us-nonimmigrant');
    expect(catalogSourceOf('us-permanent-bar-screening')).toBe('us-status-bars');
    expect(catalogSourceOf('xx-not-a-pathway')).toBeNull();
  });

  it('names a source for every pathway in the catalog', () => {
    for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
      expect(catalogSourceOf(pathway.id)).not.toBeNull();
    }
  });
});
