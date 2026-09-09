/**
 * The response-header filter drops exactly one name and nothing else.
 *
 * `server-entry.mjs` patches `http.ServerResponse.prototype.setHeader` so Next's
 * internal `x-middleware-rewrite` never reaches a visitor. That patch is one
 * function, and it sits in the path of EVERY header this application sends — so the
 * property worth pinning is not only "the internal name is dropped" but "nothing
 * else is", which is the half that fails silently if the matcher is ever
 * loosened to a prefix or a regex.
 *
 * ── Why this file re-implements the filter rather than importing it ──────────
 *
 * `server-entry.mjs` cannot be imported here: its last statement is
 * `await import('./server.js')`, and that file only exists inside
 * `.next/standalone` after a build. Importing it from a test would either fail
 * to resolve or, worse, boot a server.
 *
 * So the entry is treated the way `source-invariants.test.ts` treats the app's
 * own source — READ AS TEXT and asserted against. The behavioural tests below
 * run against a filter built from the entry's own declared header list, so a
 * test cannot pass while the deployed list says something different.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY_PATH = join(APP_ROOT, 'server-entry.mjs');
const ENTRY_SOURCE = readFileSync(ENTRY_PATH, 'utf8');

/** The header list the deployed entry actually declares, read from the entry. */
function declaredHeaders(source: string): string[] {
  const match = source.match(/const INTERNAL_RESPONSE_HEADERS = \[([^\]]*)\]/);
  const body = match?.[1];
  if (body === undefined) {
    throw new Error('server-entry.mjs declares no INTERNAL_RESPONSE_HEADERS array');
  }
  // `noUncheckedIndexedAccess` is on: a capture group is `string | undefined` to
  // the compiler even though a matched group always has one here.
  // Either quote style: this repo has no prettier config, so a `--write` run
  // rewrites the entry to double quotes without changing what it does.
  return [...body.matchAll(/['"]([^'"]+)['"]/g)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]));
}

const INTERNAL_RESPONSE_HEADERS = declaredHeaders(ENTRY_SOURCE);

/**
 * A stand-in for `http.ServerResponse` carrying only what the patch touches.
 *
 * The real prototype is deliberately not patched in this process: vitest and
 * jsdom both hold live servers, and a global patch would outlive the file.
 */
class FakeResponse {
  readonly headers = new Map<string, unknown>();

  setHeader(name: string, value: unknown): this {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }
}

/** The entry's patch, applied to any object with a `setHeader`. */
function installFilter<T extends { setHeader: (name: string, value: unknown) => unknown }>(
  target: T,
): T {
  const blocked = new Set(INTERNAL_RESPONSE_HEADERS);
  const original = target.setHeader;
  target.setHeader = function patchedSetHeader(this: unknown, name: string, value: unknown) {
    if (typeof name === 'string' && blocked.has(name.toLowerCase())) return this;
    return original.call(this, name, value);
  };
  return target;
}

describe('the deployed entry', () => {
  it('filters x-middleware-rewrite', () => {
    // Not merely "declares a list": this is the name Next puts on the wire for
    // every rewrite, and it is the reason the file exists.
    expect(INTERNAL_RESPONSE_HEADERS).toContain('x-middleware-rewrite');
  });

  it('installs the patch before importing the server it wraps', () => {
    // Order is the property. A patch installed after `server.js` is imported is
    // a patch installed after the listener binds, and a request can arrive in
    // between.
    const patchAt = ENTRY_SOURCE.indexOf('proto.setHeader =');
    const importAt = ENTRY_SOURCE.search(/await import\(['"]\.\/server\.js['"]\)/);
    expect(patchAt).toBeGreaterThan(-1);
    expect(importAt).toBeGreaterThan(-1);
    expect(patchAt).toBeLessThan(importAt);
  });

  it('announces itself on boot', () => {
    // The absent-header assertion in the smoke cannot distinguish "the filter
    // works" from "this build performs no rewrites". The boot line can.
    expect(ENTRY_SOURCE).toContain('meridian-web: internal response header filter active');
  });

  it('guards against being installed twice', () => {
    // A second import must not wrap the wrapper: each layer would be one more
    // frame in the path of every header the process ever sends.
    expect(ENTRY_SOURCE).toContain('Symbol.for(');
    expect(ENTRY_SOURCE).toMatch(/if \(proto\[installed\] !== true\)/);
  });
});

describe('the filter', () => {
  it('drops every internal name, in any casing', () => {
    const res = installFilter(new FakeResponse());
    for (const name of INTERNAL_RESPONSE_HEADERS) {
      res.setHeader(name, '/en/somewhere');
      res.setHeader(name.toUpperCase(), '/en/somewhere');
      // HTTP header names are case-insensitive and `setHeader` is called with
      // whatever casing the caller used, so matching Next's exact spelling
      // would be one refactor away from inert.
      expect(res.headers.has(name)).toBe(false);
    }
  });

  it('passes every other header through untouched', () => {
    // The half that fails silently. This patch sits in front of every header
    // the site sends: a matcher loosened to a prefix would take `x-nextjs-cache`
    // with it, and nothing about the rendered page would change.
    const res = installFilter(new FakeResponse());
    const kept: Record<string, string> = {
      'content-type': 'text/html; charset=utf-8',
      'set-cookie': 'session=abc; Path=/',
      location: '/es/pricing',
      etag: '"xdw50qt9sreg9"',
      'cache-control': 's-maxage=31536000',
      'x-nextjs-cache': 'HIT',
      'x-nextjs-prerender': '1',
      vary: 'RSC, Accept-Encoding',
      'x-robots-tag': 'index, follow',
      // Adjacent by name and NOT filtered: only names Next sets for its own
      // router belong on the list.
      'x-middleware-request-id': 'abc123',
    };
    for (const [name, value] of Object.entries(kept)) res.setHeader(name, value);
    for (const [name, value] of Object.entries(kept)) {
      expect(res.headers.get(name)).toBe(value);
    }
  });

  it('keeps setHeader chainable', () => {
    // `setHeader` is documented to return the response. Returning undefined for
    // the filtered name would break `res.setHeader(a).setHeader(b)` only on the
    // rewritten paths — the ones this whole file is about.
    const res = installFilter(new FakeResponse());
    expect(res.setHeader('x-middleware-rewrite', '/en')).toBe(res);
    expect(res.setHeader('content-type', 'text/html')).toBe(res);
  });

  it('hands a non-string name to the underlying setHeader rather than eating it', () => {
    // The `typeof name === 'string'` guard in the patch exists so a non-string
    // name is not swallowed by `.toLowerCase()` inside the FILTER. What happens
    // next is Node's business — the real `http.ServerResponse.setHeader` throws
    // ERR_INVALID_HTTP_TOKEN on one — and the patch must not convert that into a
    // silently dropped header, which would hide a caller's bug.
    let received: unknown = 'not called';
    const target = {
      setHeader(name: unknown) {
        received = name;
        return this;
      },
    };
    installFilter(target as unknown as { setHeader: (n: string, v: unknown) => unknown });
    (target as { setHeader: (n: unknown, v: unknown) => unknown }).setHeader(undefined, 'x');
    expect(received).toBeUndefined();
  });
});

describe('the entry and this test agree with the other applications', () => {
  it('declares the same list the other two applications declare', () => {
    // Three copies of a file that must not differ is exactly the arrangement
    // that rots. `scripts/check-response-header-filter.mjs` is the repo-wide
    // form of this; asserting it here too means the app's own suite fails when
    // its copy drifts, rather than only the policy job.
    const REPO_ROOT = resolve(APP_ROOT, '..', '..');
    for (const app of ['landing', 'admin']) {
      const other = readFileSync(join(REPO_ROOT, 'apps', app, 'server-entry.mjs'), 'utf8');
      expect(declaredHeaders(other)).toEqual(INTERNAL_RESPONSE_HEADERS);
    }
  });
});
