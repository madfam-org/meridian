#!/usr/bin/env node
/**
 * The advice boundary, checked at the edge of the system.
 *
 * WHY
 *
 * Under s.91 of Canada's Immigration and Refugee Protection Act, advising a
 * person for consideration in connection with an application is an offence
 * unless you are a lawyer, a Quebec notary, or a CICC licensee. Spain reserves
 * asesoramiento jurídico similarly. So "you should apply under art. 22", sent to
 * a paying applicant with no licensed representative attached, is not a product
 * decision — it is an offence committed by whoever operates the platform.
 *
 * `@meridian/core` handles this by classifying every engine output at birth and
 * putting one gate, `canRelease`, between a classification and an audience. The
 * engines are disciplined about it. The risk is not in the engines: it is in the
 * two lines of a route handler that take an engine result and put it in a
 * response body, where the classification is right there in the object and
 * nobody looked at it.
 *
 * WHAT IS CHECKED
 *
 *   1. The gate still exists and can still say no. A `canRelease` that returns
 *      `{ allowed: true }` on every path is worse than no gate, because
 *      everything downstream is written as if it were real.
 *   2. `recommend()` still carries `advice`. It is the only advice-class
 *      producer in the catalog engine; if its classification is quietly lowered
 *      the gate never fires and every other check here still passes.
 *   3. The API's central gate seam is real: routes mark engine output with
 *      `engineOutput()` and rely on one preSerialization hook to apply
 *      `canRelease`. If the marker survives but nothing applies the gate to it,
 *      every route is ungated at once, and that is the loudest failure here.
 *   4. No route reaches an advice-class producer without a gate.
 *   5. No route, and no module behind one, unwraps a `Disclosable` with `.value`
 *      outside a gate — `.value` is where the classification and its citations
 *      get dropped on the floor.
 *   6. No application file hand-builds an `advice` payload, bypassing the
 *      engines that would have classified it.
 *   7. No `canRelease` call has its result discarded, and nothing outside
 *      `@meridian/core` defines a function by that name.
 *
 * WHAT IS NOT CHECKED
 *
 * This is a static reader, not a type checker. It cannot see that a value which
 * reached a response body came from an engine three calls back. The real
 * enforcement is `Disclosable<T>` in the type system, the runtime hook in
 * apps/api/src/disclosure, and the tests in packages/pathways; this catches the
 * shapes those miss, cheaply, on every push, with no install.
 *
 * ANTI-VACUITY
 *
 * A gate that reads nothing agrees with everything. Every run prints what it
 * examined. If the tree plainly serves HTTP and no file is recognised as a
 * route, that is a failure rather than a quiet pass — a detector that has
 * stopped matching is how this check would turn decorative. An application
 * still being written, with no HTTP surface yet, is a legitimate state and says
 * so instead.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
]);

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/** The gate, and the one wrapper in @meridian/pathways that applies it. */
const GATE_SYMBOLS = ['canRelease', 'releaseRecommendation'];

/**
 * The API does not call the gate in each handler. It marks a response as engine
 * output with `engineOutput({ disclosable, ... })` and applies `canRelease` once,
 * in a preSerialization hook, for every route at once — which is stronger than
 * per-route discipline, because a handler that forgets fails loudly instead of
 * quietly returning ungated content.
 *
 * So `engineOutput` counts as a gate reference — but only while something under
 * the seam directory actually applies `canRelease`. If that stops being true the
 * marker means nothing, and every route in the API would silently become
 * "gated" in this check while releasing whatever it likes. That case is a
 * failure, not an allowance.
 */
const API_GATE_SEAM_DIR = 'apps/api/src/disclosure';
const API_GATE_SEAM_SYMBOL = 'engineOutput';

/**
 * Producers whose output is advice-class. Ranking, recommending, or predicting
 * an outcome all land here; today that is exactly one function.
 */
const ADVICE_PRODUCERS = ['recommend'];

/**
 * Producers that return a `Disclosable<T>`. Reaching `.value` on one of these
 * without consulting the gate discards the classification the engine attached.
 */
const DISCLOSABLE_PRODUCERS = [
  'recommend',
  'assess',
  'downgradeToAssessment',
  'assessmentOf',
  'analyseGaps',
  'checklistDisclosure',
  'assessSchengenStatus',
  'assessSchengenWorstDay',
  'assessSchengenNextEntry',
  'assessSchengenDaysUntilEligible',
  'assessDayCountThreshold',
  'assessContinuousResidence',
  'assessQualifyingWork',
  'assessCanadianExperienceClass',
  'validateOfferOfEmployment',
  'estimateProcessingTimeline',
];

const GATE_ANCHOR = {
  path: 'packages/core/src/disclosure.ts',
  needles: [
    { text: 'export function canRelease', why: 'the gate is no longer exported' },
    {
      text: 'allowed: false',
      why: 'the gate has no path that refuses release — it can only say yes',
    },
    {
      text: 'downgradeTo',
      why: 'the gate no longer tells callers what to fall back to, so callers will invent something',
    },
  ],
};

const PRODUCER_ANCHOR = {
  path: 'packages/pathways/src/recommend.ts',
  needles: [
    {
      text: "'advice'",
      why: 'recommend() no longer classifies its output as advice, so the gate will never fire on it',
    },
    {
      text: 'canRelease',
      why: 'recommend() no longer references the gate it exists to be filtered by',
    },
  ],
};

function collectSources(dir, out) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectSources(join(dir, entry.name), out);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.some((e) => entry.name.endsWith(e))) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

/**
 * Route detection. Path shape first, then registration syntax, because a repo
 * that renames its directories should not silently lose the check — which is
 * what the anti-vacuity rule at the end exists to catch.
 */
function isRouteFile(relPath, text) {
  const posix = relPath.split(sep).join('/');
  const base = basename(posix);

  if (posix.includes('/routes/') || posix.includes('/route/')) return true;
  if (/^route\.tsx?$/.test(base)) return true;
  if (/\.routes?\.tsx?$/.test(base)) return true;

  // Fastify registration.
  if (/\b(?:fastify|app|server|instance|router)\s*\.\s*(?:get|post|put|patch|delete|head|options|route|register)\s*\(/.test(text)) {
    return true;
  }
  // Next route handlers.
  if (/export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/.test(text)) {
    return true;
  }
  if (/export\s+const\s+(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*[:=]/.test(text)) {
    return true;
  }
  return false;
}

/**
 * Value imports only. A `import type { Disclosable }` cannot be called, so
 * counting it as a producer reference would produce failures nobody can fix.
 */
function importedValueSymbols(text) {
  const named = new Set();
  const namespaces = new Set();

  const namedRe = /import\s+(type\s+)?\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]/g;
  for (let m = namedRe.exec(text); m !== null; m = namedRe.exec(text)) {
    if (m[1]) continue;
    for (const raw of (m[2] ?? '').split(',')) {
      const part = raw.trim();
      if (part.length === 0) continue;
      if (part.startsWith('type ')) continue;
      const alias = part.split(/\s+as\s+/);
      named.add((alias[alias.length - 1] ?? part).trim());
    }
  }

  const nsRe = /import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s*from\s*['"]([^'"]+)['"]/g;
  for (let m = nsRe.exec(text); m !== null; m = nsRe.exec(text)) {
    if (m[1]) namespaces.add(m[1]);
  }

  return { named, namespaces };
}

function usesProducer(text, imports, producers) {
  const found = [];
  for (const producer of producers) {
    if (imports.named.has(producer) && new RegExp(`\\b${producer}\\s*\\(`).test(text)) {
      found.push(producer);
      continue;
    }
    for (const ns of imports.namespaces) {
      if (new RegExp(`\\b${ns}\\.${producer}\\s*\\(`).test(text)) {
        found.push(`${ns}.${producer}`);
        break;
      }
    }
  }
  return found;
}

function referencesGate(text, seamProven) {
  if (GATE_SYMBOLS.some((symbol) => new RegExp(`\\b${symbol}\\b`).test(text))) return true;
  return seamProven && new RegExp(`\\b${API_GATE_SEAM_SYMBOL}\\s*\\(`).test(text);
}

function usesSeamMarker(text) {
  return new RegExp(`\\b${API_GATE_SEAM_SYMBOL}\\s*\\(`).test(text);
}

function lineNumberOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

function annotate(relPath, line, message) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::error file=${relPath},line=${line}::${message}`);
  }
}

function warn(message) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::warning::${message}`);
  }
  console.warn(`  ! ${message}`);
}

function checkAnchor(anchor, failures) {
  const abs = join(REPO_ROOT, anchor.path);
  if (!existsSync(abs)) {
    failures.push(
      `${anchor.path} does not exist.\n` +
        '  The advice boundary is anchored there. If it moved, point this script\n' +
        '  at the new location in the same commit that moves it.',
    );
    return;
  }
  const text = readFileSync(abs, 'utf8');
  for (const needle of anchor.needles) {
    if (!text.includes(needle.text)) {
      failures.push(
        `${anchor.path} no longer contains \`${needle.text}\` — ${needle.why}.`,
      );
    }
  }
}

function main() {
  const failures = [];

  checkAnchor(GATE_ANCHOR, failures);
  checkAnchor(PRODUCER_ANCHOR, failures);

  const appFiles = collectSources(join(REPO_ROOT, 'apps'), []);
  const packageFiles = collectSources(join(REPO_ROOT, 'packages'), []);

  let routeCount = 0;
  const httpEvidence = [];

  // Is the central seam real? Established before any file is judged by it.
  const seamAppliers = appFiles.filter((abs) => {
    const rel = relative(REPO_ROOT, abs).split(sep).join('/');
    if (!rel.startsWith(`${API_GATE_SEAM_DIR}/`)) return false;
    return /\bcanRelease\s*\(/.test(readFileSync(abs, 'utf8'));
  });
  const seamProven = seamAppliers.length > 0;

  const seamUsers = appFiles.filter((abs) => usesSeamMarker(readFileSync(abs, 'utf8')));
  if (seamUsers.length > 0 && !seamProven) {
    failures.push(
      `${seamUsers.length} application files mark responses with ${API_GATE_SEAM_SYMBOL}(), ` +
        `but no module under ${API_GATE_SEAM_DIR}/ calls canRelease.\n` +
        '  The marker is what those routes rely on to be gated centrally. With\n' +
        '  nothing applying the gate to it, every one of them returns engine\n' +
        '  output that no one classified for the audience receiving it.',
    );
  }

  for (const abs of appFiles) {
    const rel = relative(REPO_ROOT, abs).split(sep).join('/');
    const text = readFileSync(abs, 'utf8');

    // Independent of route detection: does this tree serve HTTP at all? Used by
    // the anti-vacuity rule at the end.
    if (
      /from\s+['"]fastify['"]|\bFastify(?:Instance|Request|Reply|PluginAsync)\b|from\s+['"]next\/server['"]|\bNext(?:Request|Response)\b/.test(
        text,
      )
    ) {
      httpEvidence.push(rel);
    }

    // 5. Hand-built advice, anywhere in an application.
    //
    // Test files are exempt from THIS RULE ONLY. A test for the gate has to
    // construct the thing the gate is supposed to catch — the leak detector is
    // only proven to work by feeding it a payload carrying an advice
    // classification and asserting it is found. Flagging that is the check
    // punishing the one file that demonstrates it works, and the pressure it
    // creates is to delete the test, which is the opposite of the intent.
    //
    // The exemption is deliberately narrow: tests remain subject to every other
    // rule here, including the `.value` unwrap and discarded-`canRelease` rules,
    // because those describe mistakes a test can make for real. Test files are
    // never imported by a route, so a hand-built advice payload in one cannot
    // reach a response body.
    const isTestFile = /(?:^|\/)tests?\//.test(rel) || /\.(?:test|spec)\.tsx?$/.test(rel);
    const handBuilt = isTestFile
      ? null
      : /classification\s*:\s*['"]advice['"]|disclosable\s*\(\s*['"]advice['"]/.exec(text);
    if (handBuilt) {
      const line = lineNumberOf(text, handBuilt.index);
      const message =
        'an advice-class payload is constructed here by hand rather than by an engine';
      annotate(rel, line, message);
      failures.push(
        `${rel}:${line}\n` +
          `  ${message}.\n` +
          '  Classification is assigned where the reasoning happens, so that the\n' +
          '  citations travel with it. An application that labels its own output\n' +
          '  advice has decided it is advice without the engine agreeing, and the\n' +
          '  gate has nothing to check against.',
      );
    }

    const imports = importedValueSymbols(text);
    const gated = referencesGate(text, seamProven);

    // Applies everywhere in an application, not only to routes. This API layers
    // routes over a service module, and an advice-class result unwrapped one
    // layer down reaches the response just as surely — with the difference that
    // the route it came from looks clean in review.
    //
    // Two conditions together, so a service that calls an engine and hands the
    // Disclosable upward untouched stays legal: the classification is only lost
    // when somebody reaches through it.
    if (!isRouteFile(rel, text)) {
      const adviceOutsideRoute = usesProducer(text, imports, ADVICE_PRODUCERS);
      if (adviceOutsideRoute.length > 0 && !gated) {
        const unwrap = /\.value\b/.exec(text);
        if (unwrap) {
          const line = lineNumberOf(text, unwrap.index);
          const message = `advice-class output from ${adviceOutsideRoute.join(', ')} is unwrapped with .value outside any gate`;
          annotate(rel, line, message);
          failures.push(
            `${rel}:${line}\n` +
              `  ${message}.\n` +
              '  Return the Disclosable and let the route gate it, or gate it here.\n' +
              '  Unwrapping is where the classification and its citations are lost, and\n' +
              '  after that no layer above can tell advice from an assessment.',
          );
        }
      }
      continue;
    }

    routeCount += 1;

    // 3. Advice reachable from a route with no gate in sight.
    const adviceUses = usesProducer(text, imports, ADVICE_PRODUCERS);
    if (adviceUses.length > 0 && !gated) {
      const message = `route calls ${adviceUses.join(', ')} (advice-class) without referencing ${GATE_SYMBOLS.join(' or ')}`;
      annotate(rel, 1, message);
      failures.push(
        `${rel}\n` +
          `  ${message}.\n` +
          '  Pass the result through releaseRecommendation() with the matter\'s\n' +
          '  ReleaseContext. Where no licensed representative is attached the gate\n' +
          '  returns the assessment form instead — the applicant still sees their\n' +
          '  own figures and the rule, just not a recommendation.',
      );
    }

    // 4. A Disclosable unwrapped with .value and no gate anywhere in the file.
    const disclosableUses = usesProducer(text, imports, DISCLOSABLE_PRODUCERS);
    if (disclosableUses.length > 0 && !gated) {
      const unwrap = /\.value\b/.exec(text);
      if (unwrap) {
        const line = lineNumberOf(text, unwrap.index);
        const message =
          `route unwraps a Disclosable with .value (from ${disclosableUses.join(', ')}) without referencing the gate`;
        annotate(rel, line, message);
        failures.push(
          `${rel}:${line}\n` +
            `  ${message}.\n` +
            '  `.value` drops the classification and the citation ids. Send the\n' +
            '  Disclosable itself, or gate it first — the classification is what\n' +
            '  tells the client what it is allowed to render.',
        );
      }
    }
  }

  // 6. A gate call whose answer is thrown away, or a second definition of it.
  for (const abs of [...appFiles, ...packageFiles]) {
    const rel = relative(REPO_ROOT, abs).split(sep).join('/');
    if (rel === GATE_ANCHOR.path) continue;
    const text = readFileSync(abs, 'utf8');
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      const previous = i > 0 ? (lines[i - 1] ?? '') : '';

      if (/(?:function|const|let|var)\s+canRelease\b/.test(line)) {
        const message = 'canRelease is redefined outside @meridian/core';
        annotate(rel, i + 1, message);
        failures.push(
          `${rel}:${i + 1}\n` +
            `  ${message}.\n` +
            '  There is one gate. A local one shadows it at the call sites that\n' +
            '  matter most and will not be reviewed as a legal control.',
        );
      }

      const callAt = line.search(/(?<![\w.$])canRelease\s*\(/);
      if (callAt < 0) continue;

      // A discarded result is one whose call *begins a statement* and is neither
      // bound nor returned. Anything to the left — `const decision =`,
      // `toApplicant:`, `expect(`, `return` — means the answer went somewhere,
      // and treating those as violations is how a checker earns a blanket
      // suppression. A call split across lines is judged with the line above it.
      const before = line.slice(0, callAt).trim();
      const startsStatement =
        before === '' || before.endsWith(';') || before.endsWith('{') || before.endsWith('}');
      const boundOnPreviousLine = /[=?]\s*$|return\s*$|\(\s*$|&&\s*$|\|\|\s*$/.test(previous);
      const isProse = /^\s*(?:\*|\/\/)/.test(line);
      if (startsStatement && !boundOnPreviousLine && !isProse) {
        const message = 'the result of canRelease is discarded';
        annotate(rel, i + 1, message);
        failures.push(
          `${rel}:${i + 1}\n` +
            `  ${line.trim().slice(0, 160)}\n` +
            `  ${message}. Calling the gate and ignoring its answer releases\n` +
            '  everything while looking, in review, like it releases nothing.',
        );
      }
    }
  }

  // Anti-vacuity, stated as narrowly as it can be: fail when the tree plainly
  // serves HTTP and yet nothing was recognised as a route. An application still
  // being written — domain modules, no server wired up — is a legitimate state
  // and must not turn the build red; a detector that has quietly stopped
  // matching a live HTTP surface must.
  if (httpEvidence.length > 0 && routeCount === 0) {
    failures.push(
      `application files handling HTTP: ${httpEvidence.length}; recognised as routes: 0.\n` +
        `  For example: ${httpEvidence.slice(0, 3).join(', ')}\n` +
        '  Route detection has drifted from how this codebase is written, so\n' +
        '  checks 3 and 4 above examined nothing. Update isRouteFile() in this\n' +
        '  script to match the current shape.',
    );
  }

  if (failures.length > 0) {
    console.error('\ncheck-advice-boundary: FAILED\n');
    for (const f of failures) console.error(`- ${f}\n`);
    process.exit(1);
  }

  console.log(
    `check-advice-boundary: OK — gate and producer anchors verified, ` +
      `${appFiles.length} application files read, ${routeCount} routes examined.`,
  );

  if (routeCount === 0) {
    warn(
      'no route files were recognised, so the route-level checks examined nothing. ' +
        'What is holding right now is the gate anchor in packages/core, the ' +
        'advice classification on recommend(), and the hand-built-advice and ' +
        'discarded-gate scans.',
    );
  }
}

main();
