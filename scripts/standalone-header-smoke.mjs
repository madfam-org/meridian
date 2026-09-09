#!/usr/bin/env node
/**
 * Boot a built application the way its container boots it, and check the wire.
 *
 * WHY THIS IS NOT A UNIT TEST
 *
 * The header this guards against is written by Next's ROUTER SERVER, in code no
 * test of `middleware.ts` can reach: the middleware's own response object MUST
 * carry `x-middleware-rewrite`, because that is where Next reads the rewrite
 * from. A unit test asserting the header is absent from a middleware response
 * would be asserting that the rewrite does not happen. The only place the
 * question "does a visitor see it?" has an answer is a real HTTP response from a
 * real standalone build, which is what this does.
 *
 * WHAT IT ASSERTS, PER APPLICATION
 *
 *   1. A rewritten address still SERVES — same status, non-empty body. Removing
 *      the header the wrong way (deleting it inside the middleware) turns every
 *      rewrite into a blank 200 with no error, so "the header is gone" alone is
 *      satisfied by the broken fix as well as the working one. Both halves or
 *      neither.
 *   2. `x-middleware-rewrite` is ABSENT from that response.
 *   3. The boot line says the filter installed. Without this, an application
 *      that stopped rewriting entirely would pass (2) vacuously.
 *   4. The log contains no `Failed to proxy`. That is the cheapest and loudest
 *      signal in this whole class, and the only one that exists when a rewrite
 *      is being proxied out to a foreign origin instead of routed internally.
 *
 * THE BOOT HOSTNAME IS PART OF THE TEST, NOT SETUP
 *
 * This binds `HOSTNAME=0.0.0.0`, which is what every Dockerfile in this repo
 * sets. Booting `127.0.0.1` instead would be a DIFFERENT configuration, not a
 * convenience: Next composes `initUrl` from the bound hostname and Node
 * canonicalises the loopback literal, so the origins stop comparing equal,
 * `relativizeURL` returns an absolute URL, and Next PROXIES the rewrite rather
 * than routing it. The bug then looks fixed while it is not. Keep these in
 * agreement with Dockerfile.<app>; they are the same knob.
 *
 * USAGE
 *
 *   pnpm --filter "@meridian/landing..." build
 *   node scripts/standalone-header-smoke.mjs landing
 *
 * With no argument it checks every application that has a built standalone tree,
 * and fails if there are none — a smoke that examined nothing has not passed.
 */

import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT, 'apps');

/**
 * An address each application rewrites, and what the rewrite is expected to hit.
 *
 * Every one of these is reachable WITHOUT A SESSION. An assertion placed behind
 * an authentication gate passes vacuously — the middleware answers with a
 * redirect to the login wall, no rewrite happens, and the absent header proves
 * nothing. If one of these ever moves behind a gate, seal a session here rather
 * than quietly letting the assertion go hollow.
 */
const REWRITTEN_PATHS = {
  // Any address the site does not serve is rewritten to the locale's 404 page.
  landing: { path: '/an-address-this-site-does-not-have', expectStatus: 404 },
  // Unprefixed English is served by the /en route tree.
  web: { path: '/', expectStatus: 200 },
  admin: { path: '/', expectStatus: 200 },
};

const PORT_BASE = Number(process.env.SMOKE_PORT_BASE ?? 34100);

let failures = 0;
let checks = 0;

function pass(message) {
  checks += 1;
  console.log(`  ok   ${message}`);
}

function fail(message) {
  checks += 1;
  failures += 1;
  console.error(`  FAIL ${message}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Copy the pieces the Dockerfile copies but the tracer does not emit. */
function stageStandalone(app, standalone) {
  const staticSrc = join(APPS_DIR, app, '.next', 'static');
  const staticDest = join(standalone, 'apps', app, '.next', 'static');
  if (existsSync(staticSrc) && !existsSync(staticDest)) {
    mkdirSync(dirname(staticDest), { recursive: true });
    cpSync(staticSrc, staticDest, { recursive: true });
  }
  mkdirSync(join(standalone, 'apps', app, 'public'), { recursive: true });

  // The image copies the entry next to server.js; a source tree has not.
  const entrySrc = join(APPS_DIR, app, 'server-entry.mjs');
  const entryDest = join(standalone, 'apps', app, 'server-entry.mjs');
  if (existsSync(entrySrc)) cpSync(entrySrc, entryDest);
}

async function checkApp(app, port) {
  const spec = REWRITTEN_PATHS[app];
  if (!spec) {
    fail(`${app}: no rewritten path declared in this script. Add one rather than skipping it.`);
    return;
  }

  const standalone = join(APPS_DIR, app, '.next', 'standalone');
  if (!existsSync(standalone)) {
    fail(`${app}: no .next/standalone — run \`pnpm --filter "@meridian/${app}..." build\` first.`);
    return;
  }

  stageStandalone(app, standalone);

  const entry = join(standalone, 'apps', app, 'server-entry.mjs');
  if (!existsSync(entry)) {
    fail(`${app}: server-entry.mjs is not in the standalone tree.`);
    return;
  }

  console.log(`\n${app} — booting on 0.0.0.0:${port} (the Dockerfile's HOSTNAME)`);

  const child = spawn(process.execPath, [join('apps', app, 'server-entry.mjs')], {
    cwd: standalone,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));

  try {
    let ready = false;
    for (let i = 0; i < 60; i += 1) {
      await sleep(500);
      try {
        await fetch(`http://127.0.0.1:${port}/`);
        ready = true;
        break;
      } catch {
        // not listening yet
      }
    }
    if (!ready) {
      fail(`${app}: server never accepted a connection. Log:\n${log}`);
      return;
    }

    const res = await fetch(`http://127.0.0.1:${port}${spec.path}`, {
      redirect: 'manual',
    });
    const body = await res.text();

    // (1) The rewrite still resolves. Deleting the header inside middleware.ts
    // also makes it absent — and serves nothing. Both halves.
    if (res.status === spec.expectStatus) {
      pass(`${app}: GET ${spec.path} -> ${res.status}`);
    } else {
      fail(`${app}: GET ${spec.path} -> ${res.status}, expected ${spec.expectStatus}`);
    }
    if (body.length > 0) {
      pass(`${app}: body is ${body.length} bytes, not the blank 200 of a cancelled rewrite`);
    } else {
      fail(
        `${app}: EMPTY BODY. This is what deleting x-middleware-rewrite inside\n` +
          `       middleware.ts produces — the rewrite is cancelled, not hidden.`,
      );
    }

    // (2) The header is not on the wire.
    const leaked = res.headers.get('x-middleware-rewrite');
    if (leaked === null) {
      pass(`${app}: x-middleware-rewrite absent`);
    } else {
      fail(`${app}: x-middleware-rewrite: ${leaked} reached the client`);
    }

    // (3) Anti-vacuity: (2) is also satisfied by an app that stopped rewriting.
    if (log.includes(`meridian-${app}: internal response header filter active`)) {
      pass(`${app}: the entry reported installing the filter`);
    } else {
      fail(
        `${app}: no filter boot line in the log — the process that answered may be\n` +
          `       Next's own server.js, in which case the absent header above means\n` +
          `       only that this build performed no rewrite. Log:\n${log}`,
      );
    }

    // (4) The loudest signal in this class.
    if (log.includes('Failed to proxy')) {
      fail(
        `${app}: the log says "Failed to proxy" — the rewrite is being sent to a\n` +
          `       foreign origin instead of routed internally. Check the boot HOSTNAME\n` +
          `       against Dockerfile.${app}. Log:\n${log}`,
      );
    } else {
      pass(`${app}: no "Failed to proxy" in the log`);
    }
  } finally {
    child.kill('SIGKILL');
  }
}

const requested = process.argv.slice(2);
const candidates =
  requested.length > 0
    ? requested
    : readdirSync(APPS_DIR).filter((app) => existsSync(join(APPS_DIR, app, '.next', 'standalone')));

if (candidates.length === 0) {
  console.error(
    'FAIL: no application has a built .next/standalone, so this smoke examined\n' +
      '      nothing. That is not the same as passing. Build one first:\n' +
      '        pnpm --filter "@meridian/landing..." build',
  );
  process.exit(1);
}

for (const [index, app] of candidates.entries()) {
  await checkApp(app, PORT_BASE + index);
}

console.log(`\n${checks - failures}/${checks} checks passed across ${candidates.length} app(s).`);
// No pipelines above and an explicit exit: a `run:` step in GitHub Actions has
// no pipefail, so `cmd | tee || status=$?` never fires.
process.exit(failures > 0 ? 1 : 0);
