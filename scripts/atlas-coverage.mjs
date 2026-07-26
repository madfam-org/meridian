#!/usr/bin/env node
/**
 * How much of the migration problem Meridian actually covers.
 *
 * WHY THIS PRINTS SO MUCH PROSE
 *
 * This is the number that gets quoted in a status update, and a number without
 * its denominator is how a metric starts lying. "2 of 249" and "0.0% of the
 * world's migrants" are both true and both misleading on their own: the first
 * counts uninhabited islands as work, and the second is computed over a stock
 * table that accounts for two thirds of the world and cannot ever account for
 * all of it. So every figure below is printed next to what it is a fraction of,
 * and the caveats are part of the output rather than something a reader is
 * expected to have read elsewhere.
 *
 * It also prints the atlas's own integrity findings. A coverage percentage
 * derived from a registry with a known fault is still usable; one derived from a
 * registry with a hidden fault is not. If the findings block is not empty, the
 * fractions below it are computed over a denominator that is known to be wrong,
 * and the block says in which direction.
 *
 * WHAT IT NEEDS
 *
 * The built package: `packages/atlas/dist/index.js`. Unlike the three policy
 * guards in this directory, this one imports the real objects rather than
 * parsing source, because it does arithmetic over them and a parser that
 * silently mis-reads a status would produce a wrong percentage rather than an
 * error. Build first:
 *
 *     pnpm build --filter "./packages/*"
 *     node scripts/atlas-coverage.mjs
 *
 * FLAGS
 *
 *     --as-of=YYYY-MM-DD   the date to stamp the report with (or MERIDIAN_ASOF)
 *     --limit=N            how many uncovered corridors to list (default 25)
 *     --strict             exit 1 when the atlas has integrity findings
 *
 * THE CLOCK
 *
 * No package under `packages/` reads a clock — `computeCoverage` takes `asOf` as
 * a parameter, and that is an invariant in AGENTS.md. The read happens here, in
 * a reporting script, once, and only to label the report. It is a UTC calendar
 * date, for the same reason every other date in this repository is: a local-time
 * read gives a different answer either side of midnight in Mexico City than in
 * Madrid. `--as-of` and `MERIDIAN_ASOF` override it, in that order, so a report
 * can be reproduced exactly.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIST = new URL('../packages/atlas/dist/index.js', import.meta.url);

if (!existsSync(fileURLToPath(DIST))) {
  console.error('atlas-coverage: packages/atlas/dist is not built.\n');
  console.error('  pnpm build --filter "./packages/*"');
  console.error('  node scripts/atlas-coverage.mjs\n');
  console.error(
    'This script reads the built objects rather than parsing source, because it does\n' +
      'arithmetic over them: a parser that mis-read a research status would print a\n' +
      'wrong percentage instead of failing.',
  );
  process.exit(2);
}

const atlas = await import(DIST.href);

/**
 * Every export this script reads, checked before it reads any of them.
 *
 * Without this, a renamed export becomes `undefined`, `undefined / 304021813`
 * becomes `NaN`, and the report prints "NaN%" — or worse, an arithmetic path
 * that swallows it and prints a number that is merely wrong. A report that
 * cannot tell you it failed to read its own inputs is the failure this whole
 * package exists to avoid, so it fails here instead.
 */
const REQUIRED = [
  'ALL_JURISDICTIONS',
  'ATLAS_INTEGRITY',
  'ATTRIBUTABLE_BILATERAL_STOCK',
  'CORRIDOR_STOCK',
  'WEIGHTED_CORRIDOR_STOCK',
  'CORRIDOR_STOCK_AS_OF_YEAR',
  'CORRIDOR_STOCK_MINIMUM',
  'CORRIDOR_STOCK_SOURCE_URL',
  'DEFAULT_LARGEST_UNCOVERED',
  'GLOBAL_MIGRANT_STOCK',
  'INTEGRITY_RULE_COUNT',
  'JURISDICTION_REGISTRIES',
  'MOBILITY_BLOCS',
  'UNATTRIBUTED_ORIGIN_STOCK',
  'blocCrossReferenceGaps',
  'computeCoverage',
];
const absent = REQUIRED.filter((name) => atlas[name] === undefined);
if (absent.length > 0) {
  console.error(
    `atlas-coverage: @meridian/atlas does not export ${absent.join(', ')}.\n` +
      'The build is stale or the package surface changed. Rebuild, then fix this script;\n' +
      'do not let it print a report it could not read its inputs for.',
  );
  process.exit(2);
}

const {
  ALL_JURISDICTIONS,
  ATLAS_INTEGRITY,
  ATTRIBUTABLE_BILATERAL_STOCK,
  CORRIDOR_STOCK,
  WEIGHTED_CORRIDOR_STOCK,
  CORRIDOR_STOCK_AS_OF_YEAR,
  CORRIDOR_STOCK_MINIMUM,
  CORRIDOR_STOCK_SOURCE_URL,
  DEFAULT_LARGEST_UNCOVERED,
  GLOBAL_MIGRANT_STOCK,
  INTEGRITY_RULE_COUNT,
  JURISDICTION_REGISTRIES,
  MOBILITY_BLOCS,
  UNATTRIBUTED_ORIGIN_STOCK,
  blocCrossReferenceGaps,
  computeCoverage,
} = atlas;

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => {
  const prefix = `--${name}=`;
  const hit = args.find((a) => a.startsWith(prefix));
  return hit === undefined ? null : hit.slice(prefix.length);
};
const strict = args.includes('--strict');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const asOfInput = flag('as-of') ?? process.env.MERIDIAN_ASOF ?? null;
if (asOfInput !== null && !ISO_DATE.test(asOfInput)) {
  // Reported, not silently ignored: a typo that quietly falls back to today
  // produces a report that looks right and is dated wrong.
  console.error(`atlas-coverage: --as-of/MERIDIAN_ASOF must be YYYY-MM-DD, got ${asOfInput}`);
  process.exit(2);
}
const asOf = asOfInput ?? new Date().toISOString().slice(0, 10);

const limitInput = flag('limit');
if (limitInput !== null && !/^\d+$/.test(limitInput)) {
  console.error(`atlas-coverage: --limit must be a non-negative integer, got ${limitInput}`);
  process.exit(2);
}
const limit = limitInput === null ? DEFAULT_LARGEST_UNCOVERED : Number(limitInput);

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const NUM = new Intl.NumberFormat('en-US');
const n = (value) => NUM.format(value);
const pct = (value, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const pad = (text, width) => String(text).padEnd(width, ' ');
const padStart = (text, width) => String(text).padStart(width, ' ');
const rule = (char = '-') => char.repeat(78);

function heading(text) {
  console.log(`\n${text}`);
  console.log(rule());
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

const report = computeCoverage({
  asOf,
  jurisdictions: ALL_JURISDICTIONS,
  stock: WEIGHTED_CORRIDOR_STOCK,
  globalStock: GLOBAL_MIGRANT_STOCK,
  largestUncoveredLimit: limit,
});

const names = new Map(ALL_JURISDICTIONS.map((j) => [j.code, j.name.en]));
const label = (code) => names.get(code) ?? code;

console.log(rule('='));
console.log(`MERIDIAN ATLAS — COVERAGE, as of ${asOf}`);
console.log(rule('='));

heading('WHAT THE DENOMINATOR IS');
console.log(
  [
    `${n(report.structural.totalJurisdictions)} jurisdictions, assembled from ${JURISDICTION_REGISTRIES.length} region files and deduplicated by ISO`,
    `3166-1 alpha-2 code, plus ${MOBILITY_BLOCS.length} mobility agreements.`,
    '',
    'This is NOT a count of immigration systems in the world. It errs in both',
    'directions and the errors do not cancel:',
    '',
    '  - it INCLUDES places with no permanent population and no residence route',
    '    (Bouvet Island, Heard and McDonald, the French Southern Territories, the',
    '    US Minor Outlying Islands). They are listed so they can be excluded',
    '    deliberately rather than forgotten, and they permanently depress',
    '    structural coverage.',
    '  - it EXCLUDES roughly seven authorities that control entry to territory but',
    '    have no ISO alpha-2 code: Somaliland, Northern Cyprus, Abkhazia, South',
    '    Ossetia, the UK Sovereign Base Areas, Transnistria, Mount Athos. Each is a',
    '    note on the nearest coded entry; none was given an invented code.',
    '  - three codes hide more than one control each: SH covers Saint Helena,',
    '    Ascension and Tristan da Cunha; SO speaks only to the federal Somali',
    '    system; ES carries Ceuta and Melilla.',
    '',
    'A corridor is derived from a destination and an origin, never stored. There is',
    'no list of ~40,000 country pairs here and the percentages below are not over',
    'one.',
  ].join('\n'),
);

heading('JURISDICTIONS BY RESEARCH STATUS');
const statuses = ['stub', 'researched', 'encoded', 'counsel_reviewed'];
const meanings = {
  stub: 'listed because it exists; nothing verified',
  researched: 'basic facts checked against a source',
  encoded: 'its pathways are in the Meridian catalog',
  counsel_reviewed: 'reviewed by counsel; nothing is, and nothing should claim to be',
};
console.log(
  `${pad('status', 18)}${padStart('count', 7)}${padStart('share', 9)}   meaning`,
);
for (const status of statuses) {
  const count = report.structural.byStatus[status] ?? 0;
  const share =
    report.structural.totalJurisdictions === 0 ? 0 : count / report.structural.totalJurisdictions;
  console.log(
    `${pad(status, 18)}${padStart(n(count), 7)}${padStart(pct(share, 1), 9)}   ${meanings[status]}`,
  );
}
console.log(
  `${pad('TOTAL', 18)}${padStart(n(report.structural.totalJurisdictions), 7)}${padStart('100.0%', 9)}`,
);
console.log(
  '\nA `researched` entry means a source was consulted, usually establishing only\n' +
    'autonomy and bloc membership. It does NOT mean the system is mapped. Reading it\n' +
    'as "system understood" overstates the work substantially.',
);

heading('STRUCTURAL COVERAGE — systems');
const encoded = ALL_JURISDICTIONS.filter(
  (j) => j.researchStatus === 'encoded' || j.researchStatus === 'counsel_reviewed',
);
console.log(
  `encoded or better    ${padStart(pct(report.structural.encodedFraction, 2), 9)}   ` +
    `${n(encoded.length)} of ${n(report.structural.totalJurisdictions)}` +
    (encoded.length > 0 ? `  (${encoded.map((j) => j.code).join(', ')})` : ''),
);
console.log(
  `researched or better ${padStart(pct(report.structural.researchedFraction, 2), 9)}   ` +
    `${n(
      report.structural.byStatus.researched +
        report.structural.byStatus.encoded +
        report.structural.byStatus.counsel_reviewed,
    )} of ${n(report.structural.totalJurisdictions)}`,
);

heading('WEIGHTED COVERAGE — people');
console.log(
  `corridors weighted        ${padStart(n(WEIGHTED_CORRIDOR_STOCK.length), 15)} rows in the stock table`,
);
console.log(`migrants in those rows    ${padStart(n(report.weighted.knownStock), 15)}`);
console.log(`migrants on covered rows  ${padStart(n(report.weighted.coveredStock), 15)}`);
console.log(
  `covered fraction          ${padStart(pct(report.weighted.coveredFraction, 4), 15)}` +
    '   (both ends encoded or better)',
);
console.log(
  `stock table completeness  ${padStart(
    report.weighted.stockTableCompleteness === null
      ? 'unavailable'
      : pct(report.weighted.stockTableCompleteness, 2),
    15,
  )}   (of ${n(GLOBAL_MIGRANT_STOCK)} migrants worldwide)`,
);

const destinationRows = WEIGHTED_CORRIDOR_STOCK.filter((row) =>
  encoded.some((j) => j.code === row.destination),
);
const destinationStock = destinationRows.reduce((sum, row) => sum + row.stock, 0);
console.log(
  [
    '',
    'Covered means BOTH ends encoded. That is the honest test — a corridor is only as',
    'known as its least-known end — and today it yields exactly zero, because the two',
    'encoded jurisdictions do not appear as the two ends of any single row.',
    '',
    `For scale, and NOT as a coverage figure: ${n(destinationRows.length)} rows carrying ` +
      `${n(destinationStock)}`,
    `people have an encoded DESTINATION. That is ${pct(destinationStock / GLOBAL_MIGRANT_STOCK, 1)} of world stock and is the`,
    'ceiling if a corridor were ever counted destination-side only.',
  ].join('\n'),
);

heading('WHAT THE STOCK TABLE DOES AND DOES NOT ACCOUNT FOR');
const tail = ATTRIBUTABLE_BILATERAL_STOCK - report.weighted.knownStock;
console.log(
  [
    `Source: UN DESA International Migrant Stock ${CORRIDOR_STOCK_AS_OF_YEAR}, bilateral matrix.`,
    `        ${CORRIDOR_STOCK_SOURCE_URL}`,
    `Rule:   every country pair at or above ${n(CORRIDOR_STOCK_MINIMUM)} persons, and nothing else.`,
    '',
    `  in the table              ${padStart(n(report.weighted.knownStock), 15)}  ${padStart(pct(report.weighted.knownStock / GLOBAL_MIGRANT_STOCK, 1), 7)} of world stock`,
    `  below the cutoff (derived)${padStart(n(tail), 15)}  ${padStart(pct(tail / GLOBAL_MIGRANT_STOCK, 1), 7)} across ~9,068 smaller pairs`,
    `  unattributable            ${padStart(n(UNATTRIBUTED_ORIGIN_STOCK), 15)}  ${padStart(pct(UNATTRIBUTED_ORIGIN_STOCK / GLOBAL_MIGRANT_STOCK, 1), 7)} origin "Others" in the source`,
    `  world total               ${padStart(n(GLOBAL_MIGRANT_STOCK), 15)}  100.0%`,
    '',
    'Only one row above is derived rather than read: "below the cutoff" is the world',
    'total minus the unattributable share minus the table, so it inherits the table\'s',
    'rounding to the nearest thousand and is accurate to a few thousand people, not',
    'to the digit. Every other figure is a cell of the source.',
    '',
    'The unattributable share is unreachable by ANY bilateral table, so the ceiling on',
    `completeness is ${pct(ATTRIBUTABLE_BILATERAL_STOCK / GLOBAL_MIGRANT_STOCK, 1)}, not 100%. Read "completeness" against that ceiling.`,
    '',
    'Three row classes a reader will otherwise misread: Puerto Rico to the United',
    'States is not an immigration corridor at all; the Russia/Ukraine/Kazakhstan rows',
    'include people the 1991 border moved rather than people who moved; and a few rows',
    'do not describe a route anyone travels. They are kept because dropping rows on our',
    'own judgement would be a silent editorial filter on a checkable metric.',
  ].join('\n'),
);

heading('INTEGRITY OF THE ATLAS');
const gaps = blocCrossReferenceGaps({
  registries: JURISDICTION_REGISTRIES,
  blocs: MOBILITY_BLOCS,
  stock: WEIGHTED_CORRIDOR_STOCK,
});
if (ATLAS_INTEGRITY.length === 0) {
  console.log(`${INTEGRITY_RULE_COUNT} rules checked, 0 findings.`);
} else {
  console.log(
    `${INTEGRITY_RULE_COUNT} rules checked, ${ATLAS_INTEGRITY.length} findings. The fractions above are computed over a\n` +
      'denominator with known faults; each finding below says which.\n',
  );
  for (const finding of ATLAS_INTEGRITY) {
    console.log(`  [${finding.rule}] ${finding.subject}`);
    for (const line of wrap(finding.detail, 72)) console.log(`      ${line}`);
  }
}
console.log(
  `\n  advisory: ${n(gaps.length)} bloc memberships are recorded by the bloc registry and not\n` +
    '  mentioned on the jurisdiction entry. Not an error — corridor derivation reads\n' +
    '  the bloc registry — but a reader of those entries sees an empty bloc list.',
);

heading(`LARGEST UNCOVERED CORRIDORS — the work queue, in value order (top ${limit})`);
if (report.largestUncovered.length === 0) {
  console.log('none.');
} else {
  console.log(`${pad('#', 4)}${pad('corridor', 12)}${padStart('migrants', 12)}   origin → destination`);
  report.largestUncovered.forEach((row, i) => {
    console.log(
      `${pad(i + 1, 4)}${pad(`${row.origin} > ${row.destination}`, 12)}${padStart(n(row.stock), 12)}   ` +
        `${label(row.origin)} → ${label(row.destination)}`,
    );
  });
  const listed = report.largestUncovered.reduce((sum, row) => sum + row.stock, 0);
  console.log(
    `\nThese ${report.largestUncovered.length} corridors alone carry ${n(listed)} people, ` +
      `${pct(listed / GLOBAL_MIGRANT_STOCK, 1)} of world stock.`,
  );
}

heading('REPRODUCING THIS');
console.log(
  [
    '  pnpm build --filter "./packages/*"',
    `  node scripts/atlas-coverage.mjs --as-of=${asOf}`,
    '',
    'Every figure comes from packages/atlas: the jurisdiction registries, blocs.ts',
    'and stock.ts. Nothing on this page is an estimate this script invented; the one',
    'derived residual is labelled where it appears. The report is stamped with a UTC',
    'calendar date, the same read every other date in this repository uses.',
  ].join('\n'),
);
console.log('');

if (strict && ATLAS_INTEGRITY.length > 0) {
  console.error(`atlas-coverage: --strict and ${ATLAS_INTEGRITY.length} integrity findings.`);
  process.exit(1);
}

/** Wrap prose to a width, so a long finding detail stays readable in a terminal. */
function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line.length === 0) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}
