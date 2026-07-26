/**
 * Flag assets: provenance, posture and the gap report.
 *
 * Three things are being defended here, and only one of them is ordinary unit
 * testing.
 *
 * 1. **The bytes are what we say they are.** `src/flags.ts` makes a licence
 *    claim about specific artwork. That claim is only worth something if the
 *    artwork on disk is still the artwork the licence was read against, so the
 *    tree digest is recomputed from the real directory rather than trusted.
 * 2. **The gap cannot drift silently.** `flagCoverage` is checked against the
 *    real `ALL_JURISDICTIONS`, and then against deliberately broken atlases so
 *    that each detector is seen to fire. A checker only ever run on clean data
 *    is indistinguishable from a checker that cannot fail.
 * 3. **A flag is never the only carrier of meaning.** That is asserted at the
 *    API surface — `alt` empty, `decorative` true, the name present on every
 *    presentation — and at the asset level, by proving no two shipped images are
 *    the same picture.
 *
 * Two of the six `flagCoverage` rules — `suppressed_code_still_shipped` and
 * `duplicate_suppression` — cannot be provoked from outside the module, because
 * their inputs are module constants rather than arguments. Widening the API to
 * make them reachable would be a worse trade than testing the conditions
 * directly, so the conditions are asserted against the filesystem and the
 * suppression list instead, in "the vendored assets" and "suppression" below.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { isoDate } from '@meridian/core';

import { ALL_JURISDICTIONS } from '../src/index.js';
import {
  FLAG_ASPECT_RATIO,
  FLAG_ASSET_CODES,
  FLAG_ASSET_DEFAULT_BASE_PATH,
  FLAG_ASSET_DIRECTORY,
  FLAG_ASSET_LICENCE_SHA256,
  FLAG_ASSET_SOURCE,
  FLAG_ASSET_TOTAL_BYTES,
  FLAG_ASSET_TREE_SHA256,
  FLAG_ATTRIBUTION_NOTICE,
  FLAG_COVERAGE_RULE_COUNT,
  FLAG_SUPPRESSIONS,
  FLAG_SUPPRESSIONS_DECIDED_ON,
  altTextForFlagUsedAsLabel,
  flagCoverage,
  flagFileName,
  flagPresentation,
  flagSuppression,
} from '../src/flags.js';
import type { FlagSuppressionKind } from '../src/flags.js';
import type { Jurisdiction } from '../src/types.js';
import { jurisdictionCode } from '../src/types.js';
import { fixtureJurisdiction, seededShuffle } from './fixtures.js';

const ASSETS = fileURLToPath(new URL('../assets/flags', import.meta.url));

/** Every `*.svg` in the vendored directory, sorted. Read once. */
const svgFiles: readonly string[] = readdirSync(ASSETS)
  .filter((name) => name.endsWith('.svg'))
  .sort();

function jurisdictionByCode(code: string): Jurisdiction {
  const found = ALL_JURISDICTIONS.find((j) => (j.code as string) === code);
  if (found === undefined) throw new Error(`atlas has no ${code}; this test is out of date`);
  return found;
}

// ---------------------------------------------------------------------------

describe('the vendored assets', () => {
  it('exist — a missing directory must fail loudly, not pass vacuously', () => {
    // If this suite ever runs against an empty directory, every assertion below
    // that iterates the file list would pass by iterating nothing. So the count
    // is asserted first and asserted concretely.
    expect(svgFiles.length).toBe(228);
    expect(svgFiles.length).toBe(FLAG_ASSET_CODES.length);
  });

  it('match FLAG_ASSET_CODES file for file', () => {
    const declared = [...FLAG_ASSET_CODES].map((code) => flagFileName(code)).sort();
    expect(svgFiles).toEqual(declared);
  });

  it('are byte-identical to what was vendored', () => {
    // The digest covers name and bytes together, so a rename is as detectable as
    // an edit. If this fails, either someone changed a flag — in which case the
    // licence record no longer describes the artwork — or a copy was lossy.
    const hash = createHash('sha256');
    for (const name of svgFiles) {
      hash.update(name);
      hash.update('\0');
      hash.update(readFileSync(join(ASSETS, name)));
      hash.update('\0');
    }
    expect(hash.digest('hex')).toBe(FLAG_ASSET_TREE_SHA256);
  });

  it('total the number of bytes the module reports', () => {
    const total = svgFiles.reduce((sum, name) => sum + statSync(join(ASSETS, name)).size, 0);
    expect(total).toBe(FLAG_ASSET_TOTAL_BYTES);
  });

  it('ship the licence file unmodified beside them', () => {
    const licence = readFileSync(join(ASSETS, 'LICENSE'));
    expect(createHash('sha256').update(licence).digest('hex')).toBe(FLAG_ASSET_LICENCE_SHA256);

    const text = licence.toString('utf8');
    // MIT's own condition: the copyright notice and the permission notice both
    // have to travel with the software. Assert both are actually in the file we
    // ship, not merely in the record that describes it.
    expect(text).toContain(FLAG_ASSET_SOURCE.copyright);
    expect(text).toContain('Permission is hereby granted, free of charge');
    expect(text).toContain(
      'The above copyright notice and this permission notice shall be',
    );
  });

  it('declare a 3:2 viewBox, so a caller can reserve space without parsing SVG', () => {
    const expected = FLAG_ASPECT_RATIO.width / FLAG_ASPECT_RATIO.height;
    let checked = 0;
    for (const name of svgFiles) {
      const svg = readFileSync(join(ASSETS, name), 'utf8');
      const match = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(svg);
      expect(match, `${name} has no parsable viewBox`).not.toBeNull();
      if (match === null) continue;
      const width = Number(match[3]);
      const height = Number(match[4]);
      expect(height, `${name} has a zero-height viewBox`).toBeGreaterThan(0);
      // Two files round the height to one decimal (512 x 341.3); 0.001 admits
      // that and nothing that would visibly distort a flag.
      expect(Math.abs(width / height - expected), `${name} is not 3:2`).toBeLessThan(0.001);
      checked += 1;
    }
    expect(checked).toBe(svgFiles.length);
  });

  it('cannot execute or phone home', () => {
    // These are served from our own origin. An SVG inlined into the DOM can run
    // script and can fetch; one that references an external URL leaks a request
    // per render. Neither is acceptable in artwork we did not write.
    const forbidden = [
      /<script/i,
      /<foreignObject/i,
      /<image[\s>]/i,
      /<use[\s>]/i,
      /xlink:href/i,
      /\son[a-z]+\s*=/i,
      /javascript:/i,
      /data:/i,
    ];
    for (const name of svgFiles) {
      const svg = readFileSync(join(ASSETS, name), 'utf8');
      for (const pattern of forbidden) {
        expect(pattern.test(svg), `${name} matches ${String(pattern)}`).toBe(false);
      }
      // The only external URL any of them may contain is the SVG namespace.
      const urls = svg.match(/https?:\/\/[^"' >]+/g) ?? [];
      for (const url of urls) {
        expect(url, `${name} references ${url}`).toBe('http://www.w3.org/2000/svg');
      }
    }
  });

  it('contain no two identical pictures — which is what the suppression list buys', () => {
    // Over all 249 codes the pack draws only 244 distinct images: FR/GP/PM/RE
    // are byte-identical, as are NO/SJ and UM/US. After suppression every
    // shipped image is distinct, so no row can be mistaken for another by its
    // picture. If this ever fails, a duplicate has come back and the reason
    // string for GP, PM, RE, SJ or UM has stopped being true.
    const byImage = new Map<string, string[]>();
    for (const name of svgFiles) {
      const code = name.slice(0, 2);
      const svg = readFileSync(join(ASSETS, name), 'utf8');
      // Normalise the code out, so a differing element id cannot hide a
      // genuine duplicate.
      const normalised = svg.split(code).join('#').split(code.toLowerCase()).join('#');
      const digest = createHash('sha256').update(normalised).digest('hex');
      const group = byImage.get(digest);
      if (group === undefined) byImage.set(digest, [code]);
      else group.push(code);
    }
    const duplicates = [...byImage.values()].filter((group) => group.length > 1);
    expect(duplicates).toEqual([]);
    expect(byImage.size).toBe(svgFiles.length);
  });

  it('are never reached through a path this module did not build', () => {
    expect(FLAG_ASSET_DIRECTORY).toBe('packages/atlas/assets/flags');
    expect(flagFileName(jurisdictionCode('ES'))).toBe('ES.svg');
  });
});

// ---------------------------------------------------------------------------

describe('licence provenance is data, not a footnote', () => {
  it('names the exact artefact the licence was read from', () => {
    expect(FLAG_ASSET_SOURCE.packageName).toBe('country-flag-icons');
    expect(FLAG_ASSET_SOURCE.version).toBe('1.6.20');
    expect(FLAG_ASSET_SOURCE.licence).toBe('MIT');
    // A licence claim that does not name a version names nothing.
    expect(FLAG_ASSET_SOURCE.licenceStatedAt).toContain(FLAG_ASSET_SOURCE.version);
    expect(FLAG_ASSET_SOURCE.tarballIntegrity.startsWith('sha512-')).toBe(true);
    expect(FLAG_ASSET_SOURCE.verifiedOn).toBe(isoDate('2026-07-26'));
  });

  it('points at a licence file that is actually there', () => {
    expect(FLAG_ASSET_SOURCE.licenceFile).toBe(`${FLAG_ASSET_DIRECTORY}/LICENSE`);
    expect(statSync(join(ASSETS, 'LICENSE')).size).toBeGreaterThan(0);
  });

  it('carries a notice a page can render as-is', () => {
    // AGPL-3.0-only s13 makes this a network obligation: a user interacting with
    // Meridian remotely has to be able to reach it, so it has to exist as a
    // value the application can print rather than as prose in a README.
    expect(FLAG_ATTRIBUTION_NOTICE).toContain('country-flag-icons 1.6.20');
    expect(FLAG_ATTRIBUTION_NOTICE).toContain('MIT');
    expect(FLAG_ATTRIBUTION_NOTICE).toContain('@catamphetamine');
    expect(FLAG_ATTRIBUTION_NOTICE).toContain(FLAG_ASSET_SOURCE.licenceFile);
  });

  it('records what the grant does not cover', () => {
    // The note is where the honest caveats live. If it is ever emptied, the
    // record starts reading as a clean bill of health it was never meant to be.
    expect(FLAG_ASSET_SOURCE.note.length).toBeGreaterThan(400);
    expect(FLAG_ASSET_SOURCE.note).toContain('blanket');
  });
});

// ---------------------------------------------------------------------------

describe('suppression is a decision, with a reason, with a date', () => {
  it('covers 21 codes and none of them twice', () => {
    expect(FLAG_SUPPRESSIONS.length).toBe(21);
    const codes = FLAG_SUPPRESSIONS.map((entry) => entry.code as string);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort()).toEqual(codes);
  });

  it('only suppresses codes the atlas actually carries', () => {
    const known = new Set(ALL_JURISDICTIONS.map((j) => j.code as string));
    for (const entry of FLAG_SUPPRESSIONS) {
      expect(known.has(entry.code as string), `${entry.code} is not in the atlas`).toBe(true);
    }
  });

  it('ships no artwork for a code it decided not to render', () => {
    // The bundle argument and the honesty argument point the same way: an asset
    // we will never render is bytes in the repository and a contradiction in the
    // data.
    const onDisk = new Set(svgFiles.map((name) => name.slice(0, 2)));
    for (const entry of FLAG_SUPPRESSIONS) {
      expect(onDisk.has(entry.code as string), `${entry.code}.svg should not be vendored`).toBe(
        false,
      );
    }
  });

  it('gives a reason substantial enough to disagree with', () => {
    // The reason string is the load-bearing part: it is what stops the list
    // being quietly edited by someone who reads an absence as a bug.
    for (const entry of FLAG_SUPPRESSIONS) {
      expect(entry.reason.length, `${entry.code} reason is too thin`).toBeGreaterThan(120);
      expect(entry.reason.trim()).toBe(entry.reason);
      expect(entry.decidedOn).toBe(FLAG_SUPPRESSIONS_DECIDED_ON);
    }
  });

  it('uses every kind it declares — a taxonomy nothing falls into is decoration', () => {
    const kinds: readonly FlagSuppressionKind[] = [
      'contested_recognition',
      'no_single_flag',
      'image_identifies_another_jurisdiction',
      'source_chose_among_competing_flags',
      'one_code_several_systems',
      'no_resident_population',
    ];
    const used = new Set(FLAG_SUPPRESSIONS.map((entry) => entry.kind));
    for (const kind of kinds) expect(used.has(kind), `${kind} is unused`).toBe(true);
    expect(used.size).toBe(kinds.length);
  });

  it('puts the contested entities on the same footing as each other', () => {
    // Rendering some contested entities and not others would itself be a
    // comparison, which is the thing the posture is trying not to make.
    const contested = FLAG_SUPPRESSIONS.filter(
      (entry) => entry.kind === 'contested_recognition',
    ).map((entry) => entry.code as string);
    expect(contested).toEqual(['EH', 'PS', 'TW', 'XK']);
  });

  it('looks up by code without inheriting anything', () => {
    expect(flagSuppression(jurisdictionCode('TW'))?.kind).toBe('contested_recognition');
    expect(flagSuppression(jurisdictionCode('ES'))).toBeNull();
    // The lookups are Map- and Set-based, and a jurisdiction code is two upper
    // case letters by construction, so a prototype key cannot even be spelled.
    expect(() => jurisdictionCode('__proto__')).toThrow(RangeError);
    expect(() => jurisdictionCode('constructor')).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------

describe('flagPresentation keeps the name attached to the picture', () => {
  it('returns an image for an available jurisdiction, marked decorative', () => {
    const spain = jurisdictionByCode('ES');
    const presentation = flagPresentation(spain);
    expect(presentation.availability).toBe('available');
    expect(presentation.image).not.toBeNull();
    expect(presentation.image?.src).toBe('/flags/ES.svg');
    expect(presentation.image?.fileName).toBe('ES.svg');
    // Fixed at the type level and asserted here: the image is an adornment. A
    // country name as alternative text makes a screen reader say the name twice.
    expect(presentation.image?.alt).toBe('');
    expect(presentation.image?.decorative).toBe(true);
    expect(presentation.suppression).toBeNull();
  });

  it('carries the name in both halves whatever the availability', () => {
    // The point of the whole module. Every one of the 249 gets a label.
    for (const jurisdiction of ALL_JURISDICTIONS) {
      const presentation = flagPresentation(jurisdiction);
      expect(presentation.name.en.length).toBeGreaterThan(0);
      expect(presentation.name.es.length).toBeGreaterThan(0);
      expect(presentation.code).toBe(jurisdiction.code);
    }
  });

  it('reports a suppressed jurisdiction as a decision, with the reason attached', () => {
    const taiwan = jurisdictionByCode('TW');
    const presentation = flagPresentation(taiwan);
    expect(presentation.availability).toBe('suppressed');
    expect(presentation.image).toBeNull();
    expect(presentation.suppression?.kind).toBe('contested_recognition');
    expect(presentation.suppression?.reason.length).toBeGreaterThan(120);
    expect(presentation.name.en).toBe(taiwan.name.en);
  });

  it('reports an unknown jurisdiction as a gap, and does not dress it as a decision', () => {
    // A placeholder returned for an unknown code, with no way to tell placeholder
    // from real, is the failure this state exists to prevent.
    const invented = fixtureJurisdiction('AA');
    const presentation = flagPresentation(invented);
    expect(presentation.availability).toBe('unsourced');
    expect(presentation.image).toBeNull();
    expect(presentation.suppression).toBeNull();
    expect(presentation.name.en).toBe('Fixture AA');
  });

  it('builds a src under whatever base path the application serves', () => {
    const spain = jurisdictionByCode('ES');
    expect(FLAG_ASSET_DEFAULT_BASE_PATH).toBe('/flags');
    expect(flagPresentation(spain, { basePath: '/static/flags' }).image?.src).toBe(
      '/static/flags/ES.svg',
    );
    expect(flagPresentation(spain, { basePath: '/static/flags/' }).image?.src).toBe(
      '/static/flags/ES.svg',
    );
    expect(flagPresentation(spain, { basePath: '' }).image?.src).toBe('/ES.svg');
    expect(flagPresentation(spain, {}).image?.src).toBe('/flags/ES.svg');
  });

  it('offers real alt text only through a name you have to type on purpose', () => {
    const mexico = jurisdictionByCode('MX');
    expect(altTextForFlagUsedAsLabel(mexico, 'en')).toBe(mexico.name.en);
    expect(altTextForFlagUsedAsLabel(mexico, 'es')).toBe(mexico.name.es);
    expect(mexico.name.en).not.toBe(mexico.name.es);
  });
});

// ---------------------------------------------------------------------------

describe('flagCoverage over the real atlas', () => {
  const report = flagCoverage(ALL_JURISDICTIONS);

  it('finds nothing wrong, and says how much it looked at', () => {
    expect(report.findings).toEqual([]);
    // Anti-vacuity: "I read nothing" and "I read everything and found nothing
    // wrong" must not produce the same output.
    expect(report.examined).toEqual({
      jurisdictions: 249,
      assetCodes: 228,
      suppressions: 21,
    });
    expect(FLAG_COVERAGE_RULE_COUNT).toBe(6);
  });

  it('partitions all 249 jurisdictions exactly once', () => {
    expect(report.totalJurisdictions).toBe(ALL_JURISDICTIONS.length);
    expect(report.available.length).toBe(228);
    expect(report.suppressed.length).toBe(21);
    expect(report.unsourced).toEqual([]);

    const all = [...report.available, ...report.suppressed, ...report.unsourced].map(
      (code) => code as string,
    );
    expect(all.length).toBe(249);
    expect(new Set(all).size).toBe(249);
    expect([...all].sort()).toEqual(ALL_JURISDICTIONS.map((j) => j.code as string).sort());
  });

  it('reports every jurisdiction as named, which is the number that matters', () => {
    expect(report.namedFraction).toBe(1);
    expect(report.availableFraction).toBeCloseTo(228 / 249, 10);
  });

  it('is independent of the order the jurisdictions arrive in', () => {
    const shuffled = flagCoverage(seededShuffle(ALL_JURISDICTIONS, 20260726));
    expect(shuffled.findings).toEqual(report.findings);
    expect(shuffled.examined).toEqual(report.examined);
    expect([...shuffled.available].sort()).toEqual([...report.available].sort());
    expect([...shuffled.suppressed].sort()).toEqual([...report.suppressed].sort());
    expect(shuffled.availableFraction).toBe(report.availableFraction);
  });
});

// ---------------------------------------------------------------------------

describe('flagCoverage can actually fail', () => {
  it('reports zero rather than one for an empty atlas, and never NaN', () => {
    const report = flagCoverage([]);
    expect(report.totalJurisdictions).toBe(0);
    expect(report.availableFraction).toBe(0);
    expect(report.namedFraction).toBe(0);
    expect(Number.isNaN(report.availableFraction)).toBe(false);
    // An empty atlas produces no per-jurisdiction findings, so the only way to
    // tell this run from a clean one is the examined block. Every suppression is
    // reported as orphaned, which is the loud signal.
    expect(report.examined.jurisdictions).toBe(0);
    expect(report.examined.assetCodes).toBe(228);
    expect(report.findings.every((f) => f.rule !== 'unsourced_jurisdiction')).toBe(true);
  });

  it('names a jurisdiction that has neither an asset nor a decision', () => {
    const report = flagCoverage([fixtureJurisdiction('AA')]);
    const gap = report.findings.filter((f) => f.rule === 'unsourced_jurisdiction');
    expect(gap.length).toBe(1);
    expect(gap[0]?.subject).toBe('AA');
    expect(gap[0]?.detail).toContain('AA.svg');
    expect(report.unsourced.map((c) => c as string)).toEqual(['AA']);
  });

  it('names a jurisdiction whose label is broken', () => {
    const broken: Jurisdiction = {
      ...fixtureJurisdiction('ES'),
      name: { en: 'Spain', es: '' },
    };
    const report = flagCoverage([broken]);
    expect(report.namedFraction).toBe(0);
    expect(report.findings.some((f) => f.rule === 'jurisdiction_without_name')).toBe(true);
  });

  it('reports suppressions and assets that no longer match the atlas', () => {
    const report = flagCoverage([jurisdictionByCode('ES')]);
    const byRule = new Map<string, number>();
    for (const finding of report.findings) {
      byRule.set(finding.rule, (byRule.get(finding.rule) ?? 0) + 1);
    }
    // Every suppression, and every asset except Spain's own, is now orphaned.
    expect(byRule.get('suppression_without_jurisdiction')).toBe(21);
    expect(byRule.get('asset_without_jurisdiction')).toBe(227);
    expect(byRule.get('unsourced_jurisdiction')).toBeUndefined();
  });

  it('sorts findings deterministically, by rule then subject', () => {
    const atlas = [fixtureJurisdiction('AA'), fixtureJurisdiction('AB'), fixtureJurisdiction('AC')];
    const forwards = flagCoverage(atlas);
    const backwards = flagCoverage([...atlas].reverse());
    expect(forwards.findings).toEqual(backwards.findings);

    const gaps = forwards.findings
      .filter((f) => f.rule === 'unsourced_jurisdiction')
      .map((f) => f.subject);
    expect(gaps).toEqual(['AA', 'AB', 'AC']);

    const order = forwards.findings.map((f) => f.rule);
    const firstOther = order.findIndex((rule) => rule !== 'unsourced_jurisdiction');
    expect(firstOther).toBe(3);
  });
});
