#!/usr/bin/env node
/**
 * source-drift — has the law the catalog cites changed since a person read it?
 *
 * For every citation in the shipped catalog this report locates the official
 * text (BOE consolidated legislation for Spain; the Cámara de Diputados library,
 * read through Tezca, for Mexico), asks the source when each cited article last
 * changed, and compares that date with the citation's `verifiedOn`.
 *
 * It is a report, not a guard, and it is not in CI: it needs the network, and a
 * publisher being down is not a defect in this repository. Run it before a
 * catalog review and attach the output.
 *
 *   pnpm build --filter "./packages/*"
 *   node scripts/source-drift.mjs                 # all sources
 *   node scripts/source-drift.mjs --scheme=boe    # one publisher
 *   node scripts/source-drift.mjs --json          # machine-readable
 *   node scripts/source-drift.mjs --strict        # exit 1 if any cited text changed
 *
 * TEZCA_API_KEY, when set, is sent to Tezca as X-API-Key (read scope) for a
 * higher rate limit. It is never printed. Nothing about any person is sent to
 * any source: the only data in a request is an instrument identifier.
 *
 * What this report cannot do is move `verifiedOn`. "Unchanged since
 * verification" means the publisher records no change to the text since a
 * person read it — it does not mean anyone has read it again, and a stale
 * citation stays stale until someone does.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PATHWAYS = new URL('../packages/pathways/dist/index.js', import.meta.url);
const SOURCES = new URL('../packages/sources/dist/index.js', import.meta.url);
for (const dist of [PATHWAYS, SOURCES]) {
  if (!existsSync(fileURLToPath(dist))) {
    console.error(`source-drift: ${fileURLToPath(dist)} is not built.\n`);
    console.error('  pnpm build --filter "./packages/*"');
    console.error('  node scripts/source-drift.mjs');
    process.exit(2);
  }
}

const { MERIDIAN_PATHWAY_CATALOG } = await import(PATHWAYS.href);
const { locateCitation, createBoeSource, createTezcaSource, assessDrift, summariseDrift } = await import(SOURCES.href);

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const onlyScheme = typeof args.get('scheme') === 'string' ? args.get('scheme') : null;
const asJson = args.has('json');
const strict = args.has('strict');

// Polite pacing: Tezca rate-limits anonymous callers, and neither publisher
// should see a burst from a report nobody is waiting on.
const PACE_MS = Number(process.env.SOURCE_DRIFT_PACE_MS ?? 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fetchWithTimeout = async (url, init) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

const sources = {
  boe: createBoeSource({ fetch: fetchWithTimeout }),
  diputados: createTezcaSource({
    fetch: fetchWithTimeout,
    ...(process.env.TEZCA_API_KEY ? { apiKey: process.env.TEZCA_API_KEY } : {}),
  }),
};

// Unique citations across the catalog: the same id may be shared by pathways.
const citations = new Map();
for (const pathway of MERIDIAN_PATHWAY_CATALOG) {
  for (const c of pathway.citations) if (!citations.has(c.id)) citations.set(c.id, c);
}

const findings = [];
const located = { boe: 0, diputados: 0 };
let unlocated = 0;
const seenInstruments = new Set();

for (const citation of citations.values()) {
  const outcome = locateCitation(citation);
  if (!outcome.located) {
    if (!onlyScheme) {
      unlocated += 1;
      findings.push(...assessDrift(citation, outcome, null));
    }
    continue;
  }
  const { scheme } = outcome.locator;
  if (onlyScheme && scheme !== onlyScheme) continue;
  located[scheme] += 1;
  const source = sources[scheme];
  const key = `${scheme}:${outcome.locator.instrumentId}`;
  if (!seenInstruments.has(key)) {
    seenInstruments.add(key);
    if (seenInstruments.size > 1) await sleep(PACE_MS);
  }
  const reading = source ? await source.read(outcome.locator) : null;
  findings.push(...assessDrift(citation, outcome, reading));
}

const summary = summariseDrift(findings);

if (asJson) {
  console.log(JSON.stringify({ examined: citations.size, located, unlocated, summary, findings }, null, 2));
} else {
  console.log(
    `source-drift: ${citations.size} distinct citations in ${MERIDIAN_PATHWAY_CATALOG.length} pathways; ` +
      `located ${located.boe} at BOE and ${located.diputados} at the Cámara de Diputados (read through Tezca); ` +
      `${unlocated} not locatable; ${seenInstruments.size} instruments consulted.`,
  );
  console.log(
    `  changed since verification: ${summary.changed_since_verification} · ` +
      `unchanged: ${summary.unchanged_since_verification} · undeterminable: ${summary.undeterminable}\n`,
  );
  const order = ['changed_since_verification', 'undeterminable', 'unchanged_since_verification'];
  for (const status of order) {
    const rows = findings.filter((f) => f.status === status);
    if (rows.length === 0) continue;
    console.log(`${status} (${rows.length})`);
    const shown = status === 'unchanged_since_verification' ? rows.slice(0, 10) : rows;
    for (const f of shown) {
      console.log(`  ${f.citationId}${f.article ? ` art. ${f.article}` : ''} — ${f.reason}`);
      if (f.readerUrl && status === 'changed_since_verification') console.log(`      read it: ${f.readerUrl}`);
    }
    if (shown.length < rows.length) console.log(`  … and ${rows.length - shown.length} more`);
    console.log('');
  }
  console.log(
    'Nothing in this report changes verifiedOn. A changed article needs a person to read it; ' +
      'an unchanged one still ages by the calendar.',
  );
}

process.exit(strict && summary.changed_since_verification > 0 ? 1 : 0);
