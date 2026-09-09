#!/usr/bin/env node
/**
 * Every Next application ships the response-header filter, and all of them
 * filter the same names.
 *
 * WHY
 *
 * Next 15.1.3 copies its internal router signal `x-middleware-rewrite` onto the
 * CLIENT response for every rewrite, with no same-origin check. All three of
 * these applications rewrite on their most-visited path — `/pricing` is served
 * by `/en/pricing`, an unknown address is served by `/en/no-such-page` — so all
 * three publish the internal route name to every visitor. The full argument,
 * with the two lines of Next that do it and the measurement, is in the header of
 * `apps/landing/server-entry.mjs`.
 *
 * The fix is a process entry that drops the header on the Node response after
 * Next has already routed, wired in through each Dockerfile's CMD. It cannot be
 * a shared workspace package: the standalone tree has no bundler and no
 * TypeScript, and `@meridian/*` resolves through node_modules the output tracer
 * prunes. So each application carries its own copy of a file that must not
 * differ, which is exactly the arrangement that rots.
 *
 * This is the executable form of "they must not differ". A comment saying "keep
 * these in sync" is not a control — the failure it prevents is a header quietly
 * reappearing on one surface after somebody edits another, and no test of any
 * one application can see that.
 *
 * WHAT IS CHECKED
 *
 *   1. Every Next application (one with a `next.config.*` and a `middleware.ts`)
 *      has a `server-entry.mjs`.
 *   2. All entries declare the same INTERNAL_RESPONSE_HEADERS list, in the same
 *      order.
 *   3. Every entry actually installs a filter and hands over to `./server.js` —
 *      a file that imports the server without patching would satisfy a mere
 *      existence check and ship the leak.
 *   4. Every entry announces itself on boot with a distinct name, which is what
 *      the smoke and an operator read to tell a filtered boot from an unfiltered
 *      one.
 *   5. The Dockerfile for each application starts that entry rather than
 *      `server.js` directly. This is the step that actually deploys the fix; the
 *      other four are inert without it.
 *
 * ANTI-VACUITY
 *
 * A checker that finds no applications agrees with everything. If this repo has
 * Next applications and none are recognised, that is a failure rather than a
 * quiet pass, and the run prints what it examined so a reader can tell the
 * difference between "all correct" and "nothing looked at".
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT, 'apps');

/**
 * The name the applications must filter. Spelled here as well as in each entry
 * so that this script fails when an entry drops it, rather than agreeing with
 * three files that all dropped it together.
 */
const REQUIRED_HEADERS = ['x-middleware-rewrite'];

const problems = [];
const examined = [];

/** Applications with a Next config and a middleware — the ones that can leak. */
function nextApps() {
  if (!existsSync(APPS_DIR)) return [];
  return readdirSync(APPS_DIR)
    .map((name) => ({ name, dir: join(APPS_DIR, name) }))
    .filter(({ dir }) => {
      const hasConfig = ['next.config.mjs', 'next.config.js', 'next.config.ts'].some((f) =>
        existsSync(join(dir, f)),
      );
      return hasConfig && existsSync(join(dir, 'middleware.ts'));
    });
}

/**
 * The header list an entry declares, as written.
 *
 * Parsed out of the source rather than imported: importing would execute the
 * file, which patches `http.ServerResponse.prototype` in this process and then
 * imports a `./server.js` that does not exist here.
 */
function declaredHeaders(source) {
  const match = source.match(/const INTERNAL_RESPONSE_HEADERS = \[([^\]]*)\]/);
  if (!match) return null;
  // Either quote style. This repository has no prettier configuration, so
  // `prettier --write` rewrites these files to double quotes while the code
  // around them is single-quoted; a matcher pinned to one style would report a
  // missing filter after a purely cosmetic reformat.
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

const apps = nextApps();

if (apps.length === 0) {
  console.error(
    'FAIL: no Next applications found under apps/. This check examined nothing,\n' +
      '      which is not the same as passing. If the layout changed, fix this script.',
  );
  process.exit(1);
}

const lists = new Map();

for (const { name, dir } of apps) {
  const entryPath = join(dir, 'server-entry.mjs');
  examined.push(`apps/${name}/server-entry.mjs`);

  if (!existsSync(entryPath)) {
    problems.push(
      `apps/${name} is a Next application with a middleware but has no server-entry.mjs.\n` +
        `  Without it the container starts Next's own server.js and every rewrite this\n` +
        `  app performs publishes x-middleware-rewrite to the visitor.`,
    );
    continue;
  }

  const source = readFileSync(entryPath, 'utf8');

  const headers = declaredHeaders(source);
  if (headers === null) {
    problems.push(`apps/${name}/server-entry.mjs declares no INTERNAL_RESPONSE_HEADERS array.`);
  } else {
    lists.set(name, headers);
    for (const required of REQUIRED_HEADERS) {
      if (!headers.includes(required)) {
        problems.push(
          `apps/${name}/server-entry.mjs does not filter ${required}.\n` +
            `  That is the header Next puts on the wire for every rewrite.`,
        );
      }
    }
  }

  // A file that imports the server without patching passes an existence check
  // and ships the leak, so the patch itself is what is asserted.
  if (!/proto\.setHeader\s*=/.test(source)) {
    problems.push(
      `apps/${name}/server-entry.mjs never assigns http.ServerResponse.prototype.setHeader.\n` +
        `  It would hand over to Next without filtering anything.`,
    );
  }
  if (!/await import\(['"]\.\/server\.js['"]\)/.test(source)) {
    problems.push(
      `apps/${name}/server-entry.mjs does not hand over to ./server.js.\n` +
        `  The container would start, install a filter and serve nothing.`,
    );
  }
  if (!new RegExp(`meridian-${name}: internal response header filter active`).test(source)) {
    problems.push(
      `apps/${name}/server-entry.mjs does not announce itself as "meridian-${name}" on boot.\n` +
        `  The boot line is how a filtered process is told from an unfiltered one in a log.`,
    );
  }

  // The step that actually deploys the fix. Everything above is inert if the
  // image still starts server.js.
  const dockerfile = join(ROOT, `Dockerfile.${name}`);
  if (existsSync(dockerfile)) {
    examined.push(`Dockerfile.${name}`);
    const docker = readFileSync(dockerfile, 'utf8');
    if (!docker.includes(`apps/${name}/server-entry.mjs`)) {
      problems.push(
        `Dockerfile.${name} does not start apps/${name}/server-entry.mjs.\n` +
          `  The entry exists but nothing runs it, so the deployed container still leaks.`,
      );
    }
  } else {
    problems.push(
      `apps/${name} has no Dockerfile.${name}. This check cannot confirm the entry is\n` +
        `  what the image runs. Point this script at the right file rather than removing it.`,
    );
  }
}

// The lists must agree with each other, not merely each contain the required
// name: a future addition to one app is a header still leaking from the others.
const signatures = new Map();
for (const [name, headers] of lists) {
  const key = headers.join(',');
  if (!signatures.has(key)) signatures.set(key, []);
  signatures.get(key).push(name);
}
if (signatures.size > 1) {
  const shown = [...signatures.entries()]
    .map(([key, names]) => `    [${key}] in ${names.join(', ')}`)
    .join('\n');
  problems.push(
    `The applications filter different header lists:\n${shown}\n` +
      `  They face the same Next defect on the same version. A name worth dropping in\n` +
      `  one is worth dropping in all of them.`,
  );
}

console.log(`Examined ${examined.length} files:`);
for (const file of examined) console.log(`  ${file}`);

if (problems.length > 0) {
  console.error(`\nFAIL: ${problems.length} problem(s).\n`);
  for (const problem of problems) console.error(`  - ${problem}\n`);
  process.exit(1);
}

console.log(
  `\nOK: ${apps.length} Next application(s) filter [${REQUIRED_HEADERS.join(', ')}] and each image runs its entry.`,
);
