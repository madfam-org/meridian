#!/usr/bin/env node
/**
 * Legal provenance in the pathway catalog.
 *
 * WHY
 *
 * Every rule Meridian applies to a person has to be traceable to a named
 * instrument that a human has read. A pathway with no citation is the platform
 * asserting law it cannot source; a criterion pointing at a citation id that
 * does not exist is worse, because the report renders a footnote marker that
 * resolves to nothing and the reader assumes somebody checked.
 *
 * Staleness is the same problem with a delay on it. Spain repealed the
 * investor-residency route with about three months' notice. A citation nobody
 * has re-read in six months is not evidence of current law, it is evidence of
 * what the law was, and `@meridian/core` says so: over 180 days is `stale`, and
 * the doc comment on `staleness()` states that CI fails and the dependent rules
 * must be re-verified. This is that failure.
 *
 * HOW IT READS THE CATALOG
 *
 * By parsing the TypeScript source, not by importing it. Importing would be
 * better — `validateCatalog()` in packages/pathways already implements these
 * rules against the real objects — but it needs a TypeScript loader, and the
 * loader is a devDependency this repository does not hoist to the root. A
 * policy check that only runs after a full workspace install is a policy check
 * that gets skipped, so this one runs on plain `node` with nothing installed.
 *
 * The parser is deliberately narrow: it understands the shape the catalog is
 * actually written in (top-level `const` citation objects, `export const x:
 * Pathway = {}` records, single-line `citations:` and `citationIds:` arrays) and
 * refuses anything it does not recognise instead of skipping it. Every count it
 * derives is cross-checked against a raw scan of the same file, so a parser that
 * silently stops seeing pathways fails the build rather than passing it. A check
 * that reads nothing agrees with everything.
 *
 * `pnpm --filter @meridian/pathways test` remains the authority on catalog
 * semantics. This is the gate that runs on every push without an install, and
 * the one that fails when a citation simply gets old.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CATALOG_DIR = join(REPO_ROOT, 'packages/pathways/src/catalog');
const CORE_CITATION = join(REPO_ROOT, 'packages/core/src/citation.ts');

/**
 * Freshness bands, mirrored from `staleness()` in @meridian/core. They are
 * asserted against that file below: a constant copied out of another module is
 * a constant that drifts, and the drift would be silent in exactly the
 * direction that matters — a wider band that stops failing.
 */
const FRESH_MAX_DAYS = 90;
const AGING_MAX_DAYS = 180;

// ---------------------------------------------------------------------------
// Civil dates. No `Date` arithmetic: days-from-civil on the proleptic Gregorian
// calendar, which is exact for every year and has no timezone in it.
// ---------------------------------------------------------------------------

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y, m) {
  const lengths = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[m - 1] ?? 0;
}

function parseIsoDate(value) {
  const m = ISO_DATE.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

/** Days since 1970-01-01. Howard Hinnant's days_from_civil. */
function daysFromCivil({ y, m, d }) {
  const year = m <= 2 ? y - 1 : y;
  const era = Math.floor(year / 400);
  const yoe = year - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function diffDays(from, to) {
  return daysFromCivil(to) - daysFromCivil(from);
}

/**
 * Today, in UTC.
 *
 * AGENTS.md permits exactly one clock read in the repository — `todayUtc()` in
 * `@meridian/mrtd` — and every reference date elsewhere is a parameter. That
 * rule is about the engines: a day count that silently depends on when it ran
 * is a day count nobody can reproduce or defend. This is not one of those. It
 * is a build-time freshness check whose entire question is "how long ago was
 * this verified", it ships in no package, and it computes nothing about any
 * applicant.
 *
 * It reads a calendar date, never a timestamp, and it is overridable so a run
 * is reproducible. Setting the override to a past date in CI would not fix a
 * stale citation, it would only stop the build from mentioning it.
 */
function todayUtc() {
  const override = process.env.MERIDIAN_CITATION_ASOF;
  if (override) {
    if (!parseIsoDate(override)) {
      console.error(`MERIDIAN_CITATION_ASOF is not a YYYY-MM-DD date: ${override}`);
      process.exit(2);
    }
    return override;
  }
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// A very small TypeScript reader: enough to find object literals, and honest
// about what it cannot see.
// ---------------------------------------------------------------------------

/**
 * Returns the source with comments blanked (indices and line breaks preserved)
 * plus a mask marking every character that sits inside a string literal or a
 * comment. Delimiter matching skips masked characters, so a brace in a note
 * string cannot unbalance a record.
 */
function scan(source) {
  const out = new Array(source.length);
  const skip = new Uint8Array(source.length);
  let i = 0;
  const NORMAL = 0;
  const LINE = 1;
  const BLOCK = 2;
  const SINGLE = 3;
  const DOUBLE = 4;
  const TEMPLATE = 5;
  let state = NORMAL;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (state === NORMAL) {
      if (ch === '/' && next === '/') {
        state = LINE;
        out[i] = ' ';
        skip[i] = 1;
        i += 1;
        continue;
      }
      if (ch === '/' && next === '*') {
        state = BLOCK;
        out[i] = ' ';
        skip[i] = 1;
        i += 1;
        continue;
      }
      out[i] = ch;
      if (ch === "'") state = SINGLE;
      else if (ch === '"') state = DOUBLE;
      else if (ch === '`') state = TEMPLATE;
      i += 1;
      continue;
    }

    if (state === LINE) {
      if (ch === '\n') {
        state = NORMAL;
        out[i] = '\n';
      } else {
        out[i] = ' ';
        skip[i] = 1;
      }
      i += 1;
      continue;
    }

    if (state === BLOCK) {
      if (ch === '*' && next === '/') {
        out[i] = ' ';
        out[i + 1] = ' ';
        skip[i] = 1;
        skip[i + 1] = 1;
        i += 2;
        state = NORMAL;
        continue;
      }
      out[i] = ch === '\n' ? '\n' : ' ';
      skip[i] = 1;
      i += 1;
      continue;
    }

    // Inside a string literal.
    out[i] = ch;
    skip[i] = 1;
    if (ch === '\\') {
      if (i + 1 < source.length) {
        out[i + 1] = source[i + 1];
        skip[i + 1] = 1;
      }
      i += 2;
      continue;
    }
    if (
      (state === SINGLE && ch === "'") ||
      (state === DOUBLE && ch === '"') ||
      (state === TEMPLATE && ch === '`')
    ) {
      skip[i] = 0; // the closing delimiter itself is structure, not content
      state = NORMAL;
    }
    i += 1;
  }

  return { text: out.join(''), skip };
}

/** Index of the delimiter closing the one at `openIndex`, or -1. */
function matchDelimiter(text, skip, openIndex, open, close) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (skip[i]) continue;
    const ch = text[i];
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Split an array body on top-level commas, ignoring masked characters. */
function splitTopLevel(text, skip, start, end) {
  const parts = [];
  let depth = 0;
  let from = start;
  for (let i = start; i < end; i += 1) {
    if (skip[i]) continue;
    const ch = text[i];
    if (ch === '[' || ch === '{' || ch === '(') depth += 1;
    else if (ch === ']' || ch === '}' || ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(from, i).trim());
      from = i + 1;
    }
  }
  const tail = text.slice(from, end).trim();
  if (tail.length > 0) parts.push(tail);
  return parts.filter((p) => p.length > 0);
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

function field(body, name) {
  const m = new RegExp(`\\b${name}\\s*:\\s*(['"])([^'"]*)\\1`).exec(body);
  return m ? m[2] : null;
}

function identifierField(body, name) {
  const m = new RegExp(`\\b${name}\\s*:\\s*([A-Za-z_$][A-Za-z0-9_$]*)`).exec(body);
  return m ? m[1] : null;
}

function stringLiterals(fragment) {
  const out = [];
  const re = /(['"])([^'"]*)\1/g;
  for (let m = re.exec(fragment); m !== null; m = re.exec(fragment)) out.push(m[2]);
  return out;
}

// ---------------------------------------------------------------------------
// Catalog extraction
// ---------------------------------------------------------------------------

function readCatalogFile(fileName) {
  const source = readFileSync(join(CATALOG_DIR, fileName), 'utf8');
  const { text, skip } = scan(source);

  const dateConstants = new Map();
  const dateRe = /(?:^|\n)\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:isoDate\s*\(\s*)?['"](\d{4}-\d{2}-\d{2})['"]/g;
  for (let m = dateRe.exec(text); m !== null; m = dateRe.exec(text)) {
    dateConstants.set(m[1], m[2]);
  }

  // Instrument names are frequently hoisted into a shared constant — one file
  // declares `const CFR8 = 'Code of Federal Regulations, title 8 …'` and 26
  // citations reference it. Reading only string literals made every one of those
  // parse as having no instrument, which is both a false report and, worse, a
  // silent hole in the duplicate-id check below: two citations sharing an id
  // cannot be compared on an instrument neither of them appears to have.
  const stringConstants = new Map();
  const stringRe =
    /(?:^|\n)\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*;/g;
  for (let m = stringRe.exec(text); m !== null; m = stringRe.exec(text)) {
    stringConstants.set(m[1], m[2] ?? m[3] ?? '');
  }

  /** A field that may be a literal or a reference to a hoisted string constant. */
  const resolvedField = (body, name) => {
    const literal = field(body, name);
    if (literal !== null) return literal;
    const ref = identifierField(body, name);
    return ref ? (stringConstants.get(ref) ?? null) : null;
  };

  const citations = new Map(); // const name -> citation
  const pathways = [];
  const aggregates = new Map(); // const name -> [pathway const names]
  const problems = [];

  // Top-level object constants. A citation is one carrying both `id` and
  // `verifiedOn`; everything else here is an evaluator or a lookup table.
  const constRe = /(?:^|\n)\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*(?::\s*[^=\n]+?)?=\s*\{/g;
  for (let m = constRe.exec(text); m !== null; m = constRe.exec(text)) {
    const name = m[1];
    const open = text.indexOf('{', m.index + m[0].length - 1);
    const close = matchDelimiter(text, skip, open, '{', '}');
    if (close < 0) {
      problems.push({
        kind: 'error',
        message: `${fileName}: unbalanced braces in const ${name} — the parser cannot read this file.`,
      });
      continue;
    }
    const body = text.slice(open, close + 1);
    const id = field(body, 'id');
    const hasVerifiedOn = /\bverifiedOn\s*:/.test(body);
    if (id === null || !hasVerifiedOn) continue;

    const literalDate = field(body, 'verifiedOn');
    const viaConstant = identifierField(body, 'verifiedOn');
    const verifiedOn = literalDate ?? (viaConstant ? (dateConstants.get(viaConstant) ?? null) : null);

    citations.set(name, {
      constName: name,
      id,
      verifiedOn,
      verifiedOnExpr: literalDate ?? viaConstant ?? '(unreadable)',
      instrument: resolvedField(body, 'instrument'),
      jurisdiction: resolvedField(body, 'jurisdiction'),
      file: fileName,
      line: lineOf(text, m.index + 1),
    });
  }

  // Pathway records.
  const pathwayRe = /(?:^|\n)\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*:\s*Pathway\s*=\s*\{/g;
  for (let m = pathwayRe.exec(text); m !== null; m = pathwayRe.exec(text)) {
    const constName = m[1];
    const open = text.indexOf('{', m.index + m[0].length - 1);
    const close = matchDelimiter(text, skip, open, '{', '}');
    if (close < 0) {
      problems.push({
        kind: 'error',
        message: `${fileName}: unbalanced braces in pathway ${constName}.`,
      });
      continue;
    }
    const body = text.slice(open, close + 1);
    const line = lineOf(text, m.index + 1);

    // `citations: [...]`
    const citationsAt = body.search(/\bcitations\s*:\s*\[/);
    const cited = [];
    if (citationsAt >= 0) {
      const bracket = body.indexOf('[', citationsAt);
      const absOpen = open + bracket;
      const absClose = matchDelimiter(text, skip, absOpen, '[', ']');
      if (absClose < 0) {
        problems.push({
          kind: 'error',
          message: `${fileName}: unbalanced brackets in ${constName}.citations.`,
        });
      } else {
        for (const element of splitTopLevel(text, skip, absOpen + 1, absClose)) {
          if (element.startsWith('...')) {
            problems.push({
              kind: 'error',
              message:
                `${fileName}:${line} ${constName}.citations uses a spread (${element}), which this ` +
                'parser does not resolve. Either list the citations directly or teach ' +
                'scripts/check-pathway-citations.mjs to follow it — silently skipping the ' +
                'spread would leave the pathway unchecked.',
            });
            continue;
          }
          if (element.startsWith('{')) {
            const inlineId = field(element, 'id');
            if (inlineId) cited.push({ constName: null, id: inlineId, inline: element });
            continue;
          }
          if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(element)) {
            cited.push({ constName: element, id: null });
            continue;
          }
          problems.push({
            kind: 'error',
            message: `${fileName}:${line} ${constName}.citations holds an element this parser cannot read: ${element.slice(0, 60)}`,
          });
        }
      }
    }

    // Every `citationIds: [...]` in the record — criteria and durations alike.
    const references = [];
    let referenceBlocks = 0;
    const refRe = /\bcitationIds\s*:\s*\[([^\]]*)\]/g;
    for (let r = refRe.exec(body); r !== null; r = refRe.exec(body)) {
      referenceBlocks += 1;
      for (const id of stringLiterals(r[1] ?? '')) {
        references.push({ id, line: lineOf(text, open + r.index) });
      }
    }

    pathways.push({
      constName,
      id: field(body, 'id'),
      version: field(body, 'version'),
      file: fileName,
      line,
      cited,
      references,
      referenceBlocks,
    });
  }

  // Aggregate arrays: `export const ES_PATHWAYS: readonly Pathway[] = [...]`
  const aggRe = /(?:^|\n)\s*export\s+const\s+([A-Za-z0-9_$]+)\s*:\s*readonly\s+Pathway\[\]\s*=\s*\[/g;
  for (let m = aggRe.exec(text); m !== null; m = aggRe.exec(text)) {
    const open = text.indexOf('[', m.index + m[0].length - 1);
    const close = matchDelimiter(text, skip, open, '[', ']');
    if (close < 0) continue;
    aggregates.set(
      m[1],
      splitTopLevel(text, skip, open + 1, close).filter((e) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e)),
    );
  }

  // Raw counts, used to prove the parser saw everything that is there.
  const rawPathwayCount = (text.match(/:\s*Pathway\s*=\s*\{/g) ?? []).length;
  const rawReferenceBlocks = (text.match(/\bcitationIds\s*:\s*\[/g) ?? []).length;

  return {
    fileName,
    citations,
    pathways,
    aggregates,
    problems,
    rawPathwayCount,
    rawReferenceBlocks,
  };
}

function checkCoreBands(errors) {
  if (!existsSync(CORE_CITATION)) {
    errors.push(
      'packages/core/src/citation.ts does not exist. The freshness bands this ' +
        'script enforces are defined there; without it the thresholds below are ' +
        'unanchored numbers.',
    );
    return;
  }
  const text = readFileSync(CORE_CITATION, 'utf8');
  const fresh = /age\s*<=\s*(\d+)\s*\)\s*return\s*'fresh'/.exec(text);
  const aging = /age\s*<=\s*(\d+)\s*\)\s*return\s*'aging'/.exec(text);
  if (!fresh || !aging) {
    errors.push(
      "packages/core/src/citation.ts no longer states its freshness bands as `age <= N` returning 'fresh'/'aging'.\n" +
        '  This script mirrors those numbers and can no longer confirm they match. ' +
        'Re-anchor it against the new shape.',
    );
    return;
  }
  if (Number(fresh[1]) !== FRESH_MAX_DAYS || Number(aging[1]) !== AGING_MAX_DAYS) {
    errors.push(
      `freshness bands drifted: @meridian/core uses fresh<=${fresh[1]}, aging<=${aging[1]}; ` +
        `this script uses fresh<=${FRESH_MAX_DAYS}, aging<=${AGING_MAX_DAYS}.\n` +
        '  Update the constants in scripts/check-pathway-citations.mjs to match core.',
    );
  }
}

function main() {
  const asOf = todayUtc();
  const asOfCivil = parseIsoDate(asOf);
  const errors = [];
  const warnings = [];

  checkCoreBands(errors);

  if (!existsSync(CATALOG_DIR)) {
    errors.push(
      `no catalog directory at packages/pathways/src/catalog.\n` +
        '  This check cannot pass by finding nothing to check. If the catalog moved, ' +
        'point CATALOG_DIR in this script at its new home.',
    );
    report(errors, warnings, null, asOf);
    return;
  }

  const files = readdirSync(CATALOG_DIR).filter((f) => f.endsWith('.ts'));
  const parsed = files.map(readCatalogFile);

  for (const file of parsed) {
    for (const problem of file.problems) {
      (problem.kind === 'error' ? errors : warnings).push(problem.message);
    }
    if (file.pathways.length !== file.rawPathwayCount) {
      errors.push(
        `${file.fileName}: the file declares ${file.rawPathwayCount} Pathway records but the parser read ${file.pathways.length}.\n` +
          '  Some pathway is written in a shape this script does not recognise and is ' +
          'therefore going unchecked. Fix the parser, not the catalog.',
      );
    }
    const blocksRead = file.pathways.reduce((n, p) => n + p.referenceBlocks, 0);
    if (blocksRead !== file.rawReferenceBlocks) {
      errors.push(
        `${file.fileName}: the file contains ${file.rawReferenceBlocks} citationIds blocks but ${blocksRead} were read inside pathway records.\n` +
          '  Either a criterion sits outside the pathway it belongs to, or the parser lost ' +
          'track of a record boundary. Both mean some criterion references are unchecked.',
      );
    }
  }

  // Citation ids must be globally consistent: one id, one instrument.
  const byId = new Map();
  for (const file of parsed) {
    for (const citation of file.citations.values()) {
      const seen = byId.get(citation.id);
      if (seen && seen.instrument !== citation.instrument) {
        errors.push(
          `citation id "${citation.id}" is declared twice with different instruments:\n` +
            `  ${seen.file}:${seen.line} — ${seen.instrument}\n` +
            `  ${citation.file}:${citation.line} — ${citation.instrument}\n` +
            '  A report that footnotes this id would resolve to whichever one loaded last.',
        );
      } else if (!seen) {
        byId.set(citation.id, citation);
      }
    }
  }

  // Freshness and well-formedness, per declared citation.
  let citationCount = 0;
  for (const file of parsed) {
    for (const citation of file.citations.values()) {
      citationCount += 1;
      const where = `${citation.file}:${citation.line} (${citation.id})`;

      if (!citation.instrument || citation.instrument.trim().length === 0) {
        errors.push(`${where} names no instrument. A citation with no instrument cites nothing.`);
      }
      if (!citation.jurisdiction || citation.jurisdiction.trim().length === 0) {
        errors.push(`${where} names no jurisdiction.`);
      }

      if (citation.verifiedOn === null) {
        errors.push(
          `${where} has a verifiedOn this script cannot resolve (${citation.verifiedOnExpr}).\n` +
            '  Use a date literal or a const in the same file holding one, so freshness is checkable.',
        );
        continue;
      }
      const civil = parseIsoDate(citation.verifiedOn);
      if (!civil) {
        errors.push(`${where} has a verifiedOn that is not a real calendar date: ${citation.verifiedOn}`);
        continue;
      }
      const age = diffDays(civil, asOfCivil);
      if (age < 0) {
        errors.push(
          `${where} is verified on ${citation.verifiedOn}, which is after today (${asOf}).\n` +
            '  Nobody verified it yet. Set verifiedOn to the day it was actually read.',
        );
        continue;
      }
      if (age > AGING_MAX_DAYS) {
        errors.push(
          `${where} was last verified ${age} days ago (${citation.verifiedOn}) — over the ${AGING_MAX_DAYS}-day limit.\n` +
            '  Read the instrument again, confirm the rules that rest on it still say what ' +
            'this catalog says, and move verifiedOn to the day you read it. Do not move the ' +
            'date without re-reading: the date is the claim.',
        );
      } else if (age > FRESH_MAX_DAYS) {
        warnings.push(
          `${where} was last verified ${age} days ago (${citation.verifiedOn}) — aging, ` +
            `stale at ${AGING_MAX_DAYS} days.`,
        );
      }
    }
  }

  // Per-pathway structure.
  let pathwayCount = 0;
  let referenceCount = 0;
  for (const file of parsed) {
    for (const pathway of file.pathways) {
      pathwayCount += 1;
      const where = `${file.fileName}:${pathway.line} (${pathway.id ?? pathway.constName})`;

      if (!pathway.id) {
        errors.push(`${where} has no id.`);
      }

      const resolved = new Map();
      for (const entry of pathway.cited) {
        if (entry.id) {
          resolved.set(entry.id, entry);
          continue;
        }
        const citation = file.citations.get(entry.constName);
        if (!citation) {
          errors.push(
            `${where} cites \`${entry.constName}\`, which is not a citation declared in ${file.fileName}.\n` +
              '  Cross-file citation constants are not resolved by this parser; declare the ' +
              'citation in the file that uses it, or extend the parser.',
          );
          continue;
        }
        resolved.set(citation.id, citation);
      }

      if (resolved.size === 0) {
        errors.push(
          `${where} carries no citations.\n` +
            '  Every pathway states law, and law that cannot be sourced must not be shipped. ' +
            'Add the instrument this route rests on.',
        );
      }

      const referenced = new Set();
      for (const ref of pathway.references) {
        referenceCount += 1;
        referenced.add(ref.id);
        if (!resolved.has(ref.id)) {
          errors.push(
            `${file.fileName}:${ref.line} — criterion in ${pathway.id ?? pathway.constName} references citation id "${ref.id}", ` +
              'which that pathway does not carry.\n' +
              `  Available on this pathway: ${[...resolved.keys()].join(', ') || '(none)'}\n` +
              '  A dangling reference renders a footnote marker that points at nothing, which ' +
              'reads to the applicant as though somebody checked.',
          );
        }
      }

      for (const id of resolved.keys()) {
        if (!referenced.has(id)) {
          warnings.push(
            `${where} carries citation "${id}" that no criterion or duration references.`,
          );
        }
      }
    }
  }

  // Aggregates: what is defined versus what is actually shipped.
  const allPathwayConsts = new Set();
  for (const file of parsed) for (const p of file.pathways) allPathwayConsts.add(p.constName);

  const shipped = new Set();
  for (const file of parsed) {
    for (const [aggregate, members] of file.aggregates) {
      for (const member of members) {
        if (!allPathwayConsts.has(member)) {
          errors.push(
            `${file.fileName}: ${aggregate} lists \`${member}\`, which is not a Pathway record in the catalog.`,
          );
          continue;
        }
        shipped.add(member);
      }
    }
  }
  for (const constName of allPathwayConsts) {
    if (!shipped.has(constName)) {
      warnings.push(
        `pathway \`${constName}\` is defined but appears in no *_PATHWAYS aggregate, so it is not in the shipped catalog.`,
      );
    }
  }

  // Anti-vacuity, the important half: prove that what this script parsed is what
  // the package actually ships.
  //
  // `rawPathwayCount` only catches a record the parser started reading and lost.
  // It is blind to a pathway declared some other way entirely — `satisfies
  // Pathway`, say — because the raw scan looks for the same annotation the
  // parser does. The chain below is what closes that: MERIDIAN_PATHWAY_CATALOG
  // must name aggregates this script found, each aggregate's members must be
  // records it parsed, and a pathway written in an unrecognised shape therefore
  // surfaces as a missing member rather than as silence.
  const indexPath = join(CATALOG_DIR, 'index.ts');
  if (!existsSync(indexPath)) {
    errors.push(
      'packages/pathways/src/catalog/index.ts does not exist, so there is no way to tell ' +
        'which of the parsed pathways are actually shipped.',
    );
  } else {
    const { text: indexText, skip: indexSkip } = scan(readFileSync(indexPath, 'utf8'));
    const declRe = /MERIDIAN_PATHWAY_CATALOG\s*(?::[^=]+)?=\s*\[/;
    const decl = declRe.exec(indexText);
    if (!decl) {
      errors.push(
        'packages/pathways/src/catalog/index.ts declares no MERIDIAN_PATHWAY_CATALOG array.\n' +
          '  This script verifies the shipped catalog through that constant. If the shipped ' +
          'set is now assembled some other way, re-anchor this check on it.',
      );
    } else {
      // The last character of the match is the array's own `[`. Searching
      // forward from the declaration instead would land on the one in the
      // `readonly Pathway[]` annotation.
      const open = decl.index + decl[0].length - 1;
      const close = matchDelimiter(indexText, indexSkip, open, '[', ']');
      const members = close < 0 ? [] : splitTopLevel(indexText, indexSkip, open + 1, close);
      const aggregateNames = new Set();
      for (const file of parsed) for (const name of file.aggregates.keys()) aggregateNames.add(name);

      let named = 0;
      for (const member of members) {
        const name = member.replace(/^\.\.\./, '').trim();
        if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) continue;
        named += 1;
        if (!aggregateNames.has(name) && !allPathwayConsts.has(name)) {
          errors.push(
            `MERIDIAN_PATHWAY_CATALOG includes \`${name}\`, which this script did not parse as ` +
              'either a pathway aggregate or a Pathway record.\n' +
              '  Whatever it holds is shipped to applicants and is going unchecked here.',
          );
        }
      }
      if (named === 0) {
        errors.push(
          'MERIDIAN_PATHWAY_CATALOG names nothing this script can follow, so no parsed ' +
            'pathway can be confirmed as shipped.',
        );
      }
    }
  }

  if (pathwayCount === 0) {
    errors.push(
      `parsed ${files.length} catalog files and found no pathways.\n` +
        '  This check would then pass by examining nothing. Either the catalog is empty ' +
        'or the parser no longer recognises how it is written.',
    );
  }
  if (citationCount === 0) {
    errors.push('parsed no citations at all — see above; the parser is not reading this catalog.');
  }

  report(errors, warnings, { files: files.length, pathwayCount, citationCount, referenceCount }, asOf);
}

function report(errors, warnings, counts, asOf) {
  for (const w of warnings) {
    if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning::${w.split('\n')[0]}`);
    console.warn(`  ! ${w}`);
  }

  if (errors.length > 0) {
    console.error('\ncheck-pathway-citations: FAILED\n');
    for (const e of errors) {
      if (process.env.GITHUB_ACTIONS === 'true') console.log(`::error::${e.split('\n')[0]}`);
      console.error(`- ${e}\n`);
    }
    process.exit(1);
  }

  console.log(
    `check-pathway-citations: OK — as of ${asOf}: ` +
      `${counts.files} catalog files, ${counts.pathwayCount} pathways, ` +
      `${counts.citationCount} citations, ${counts.referenceCount} criterion references resolved` +
      (warnings.length > 0 ? `, ${warnings.length} warnings` : ''),
  );
}

main();
