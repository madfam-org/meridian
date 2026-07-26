/**
 * Three properties of this application that no rendered output can show.
 *
 * Each of them is stated as a rule in a file header, and a rule stated only in
 * a comment is a rule that survives exactly as long as the next person reads
 * the comment.
 *
 *  1. **No `Date`, anywhere.** `new Date('2026-07-25')` is midnight UTC, which
 *     is 2026-07-24 in Mexico City, and one day is the entire difference
 *     between a lawful ninety-day stay and an overstay.
 *  2. **Nothing a `'use client'` module imports may reach
 *     `@meridian/pathways`.** Measured when the boundary was first drawn, one
 *     stray import of a single constant across it took the page's JavaScript
 *     from roughly 690 kB to 15 kB when removed. Nothing about the rendered
 *     page changes when it regresses.
 *  3. **Nothing is transmitted or stored.** `tests/calculator.test.tsx` proves
 *     it at runtime for one interaction; this proves there is no code path at
 *     all, including ones no test drives.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRS = ['app', 'components', 'lib'] as const;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

const SOURCE_FILES: readonly string[] = [
  ...SOURCE_DIRS.flatMap((dir) => walk(join(APP_ROOT, dir))),
  join(APP_ROOT, 'middleware.ts'),
];

/**
 * Drop block comments and whole-line `//` comments.
 *
 * Every one of the rules below is *explained* in prose that quotes the thing it
 * forbids — `lib/validation.ts` says "`new Date('2026-02-30')` rolls silently
 * to 1 March" — so a scan over raw text would match the documentation rather
 * than the code.
 */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

function shortName(file: string): string {
  return relative(APP_ROOT, file);
}

describe('the source files this suite scans', () => {
  it('found the whole application, not an empty list', () => {
    // A guard that silently scanned nothing would pass forever.
    expect(SOURCE_FILES.length).toBeGreaterThan(15);
    expect(SOURCE_FILES.map(shortName)).toContain('lib/schengen.ts');
    expect(SOURCE_FILES.map(shortName)).toContain('components/SchengenCalculator.tsx');
    expect(SOURCE_FILES.map(shortName)).toContain('app/[locale]/page.tsx');
  });
});

describe('there is no Date in this application', () => {
  it('constructs no Date and reads no clock', () => {
    for (const file of SOURCE_FILES) {
      const body = code(readFileSync(file, 'utf8'));
      expect(body, shortName(file)).not.toMatch(/\bnew Date\s*\(/);
      expect(body, shortName(file)).not.toMatch(/\bDate\.now\s*\(/);
      expect(body, shortName(file)).not.toMatch(/\bperformance\.now\s*\(/);
    }
  });

  it('formats no date through a locale-sensitive formatter', () => {
    // Civil dates render in ISO form. `toLocaleDateString` consults a timezone
    // and would move the printed day for a reader west of UTC.
    for (const file of SOURCE_FILES) {
      const body = code(readFileSync(file, 'utf8'));
      expect(body, shortName(file)).not.toMatch(/toLocaleDateString|Intl\.DateTimeFormat/);
    }
  });
});

describe('nothing is transmitted or stored', () => {
  it('has no network call, no storage write and no analytics anywhere in the source', () => {
    for (const file of SOURCE_FILES) {
      const body = code(readFileSync(file, 'utf8'));
      const name = shortName(file);
      expect(body, name).not.toMatch(/\bfetch\s*\(/);
      expect(body, name).not.toMatch(/XMLHttpRequest|sendBeacon|WebSocket\s*\(/);
      expect(body, name).not.toMatch(/localStorage|sessionStorage|indexedDB/);
      expect(body, name).not.toMatch(/document\.cookie/);
      expect(body, name).not.toMatch(/\bgtag\b|dataLayer|analytics\.|posthog|mixpanel/);
      expect(body, name).not.toMatch(/'use server'|"use server"/);
    }
  });

  it('loads no third-party script', () => {
    for (const file of SOURCE_FILES) {
      const body = code(readFileSync(file, 'utf8'));
      expect(body, shortName(file)).not.toMatch(/<script\b/i);
      expect(body, shortName(file)).not.toMatch(/dangerouslySetInnerHTML/);
    }
  });
});

// ---------------------------------------------------------------------------
// The client-bundle boundary
// ---------------------------------------------------------------------------

/** Every import specifier in a file, in source order. */
function importsOf(source: string): string[] {
  const body = code(source);
  const out: string[] = [];
  const pattern = /(?:from|import)\s*(?:\(\s*)?['"]([^'"]+)['"]/g;
  for (const match of body.matchAll(pattern)) {
    const specifier = match[1];
    if (specifier !== undefined) out.push(specifier);
  }
  return out;
}

/** Resolve a specifier written in this application to a file on disk. */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  if (specifier.endsWith('.css')) return null;
  const base = specifier.startsWith('@/')
    ? join(APP_ROOT, specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(fromFile), specifier)
      : null;
  if (base === null) return null;

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ]) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Not this candidate.
    }
  }
  return null;
}

interface Reach {
  readonly files: ReadonlySet<string>;
  readonly packages: ReadonlySet<string>;
}

/** Everything a set of entry files can reach, transitively. */
function reachableFrom(entries: readonly string[]): Reach {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [...entries];

  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined || files.has(file)) continue;
    files.add(file);

    for (const specifier of importsOf(readFileSync(file, 'utf8'))) {
      const resolved = resolveSpecifier(specifier, file);
      if (resolved === null) {
        if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.endsWith('.css')) {
          packages.add(specifier);
        }
        continue;
      }
      queue.push(resolved);
    }
  }

  return { files, packages };
}

const CLIENT_ENTRIES: readonly string[] = SOURCE_FILES.filter((file) =>
  /^\s*['"]use client['"]/.test(readFileSync(file, 'utf8')),
);

describe('the client bundle boundary', () => {
  it('has client components to check', () => {
    expect(CLIENT_ENTRIES.length).toBeGreaterThan(0);
    expect(CLIENT_ENTRIES.map(shortName)).toContain('components/SchengenCalculator.tsx');
  });

  it('reaches @meridian/core and @meridian/presence, and no other engine package', () => {
    // `@meridian/presence` depends on `@meridian/core` alone — no zod, no
    // catalog — which is why the calculator may import the thresholds and the
    // citation from it rather than copying them.
    const { packages } = reachableFrom(CLIENT_ENTRIES);
    const meridian = [...packages].filter((p) => p.startsWith('@meridian/')).sort();
    expect(meridian).toEqual(['@meridian/core', '@meridian/i18n', '@meridian/presence']);
    expect(packages.has('@meridian/pathways')).toBe(false);
  });

  it('never reaches the catalog-counting module from a client component', () => {
    // `lib/catalog-facts.ts` imports the whole rule catalog and zod for the
    // sake of a few build-time counts. `lib/as-of.ts` exists as a leaf module
    // precisely so the calculator can take the reference date without it.
    const { files } = reachableFrom(CLIENT_ENTRIES);
    const names = [...files].map(shortName);
    expect(names).not.toContain('lib/catalog-facts.ts');
    expect(names).not.toContain('lib/coverage.ts');
    expect(names).not.toContain('lib/worked-example.ts');
    expect(names).toContain('lib/as-of.ts');
  });

  it('keeps lib/as-of.ts a leaf, so the constant cannot drag anything with it', () => {
    const { packages, files } = reachableFrom([join(APP_ROOT, 'lib/as-of.ts')]);
    expect([...packages]).toEqual(['@meridian/core']);
    expect([...files].map(shortName)).toEqual(['lib/as-of.ts']);
  });

  it('pulls the catalog in on the server side, where it belongs', () => {
    // The counterpart assertion: the figures on the page really are counted
    // from the shipped catalog rather than typed into copy.
    const { packages } = reachableFrom([join(APP_ROOT, 'app/[locale]/page.tsx')]);
    expect(packages.has('@meridian/pathways')).toBe(true);
  });
});
