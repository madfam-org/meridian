/**
 * The process entry for this application's container. Installs one response
 * header filter, then hands over to Next's generated standalone server.
 *
 * ── What leaks, and why it is not this application's bug ─────────────────────
 *
 * Every internal rewrite this application performs answers the visitor with a header
 * naming the route the middleware chose:
 *
 *   GET /anything-this-site-does-not-have
 *   -> 404
 *      x-middleware-rewrite: /en/no-such-page
 *
 * Measured on this repository's own `.next/standalone` at Next 15.1.3, bound to
 * `0.0.0.0` as the Dockerfile binds it. That header is Next's internal router
 * signal, and Next classifies it as internal itself: `x-middleware-rewrite` is
 * the FIRST entry of `INTERNAL_HEADERS` in
 * `next/dist/server/lib/server-ipc/utils.js`, the list Next strips from INBOUND
 * requests so a caller cannot forge one. The same list is never applied on the
 * way out:
 *
 *   // next/dist/server/lib/router-utils/resolve-routes.js:405
 *   if (middlewareHeaders['x-middleware-rewrite']) {
 *     const value = middlewareHeaders['x-middleware-rewrite'];
 *     const rel = relativizeURL(value, initUrl);
 *     resHeaders['x-middleware-rewrite'] = rel;   // <- the client copy
 *     parsedUrl = url.parse(rel, true);           // <- the actual routing
 *   }
 *
 *   // next/dist/server/lib/router-server.js:306
 *   for (const key of Object.keys(resHeaders || {})) {
 *     res.setHeader(key, resHeaders[key]);        // <- onto the wire
 *   }
 *
 * There is no configuration option that suppresses it. `vercel/next.js#58366`
 * is open with no official fix; what people deploy is an nginx
 * `proxy_hide_header`, a Cloudflare rule, or `patch-package`.
 *
 * ── Why the fix is not in `middleware.ts`, which is where it looks like it goes
 *
 * The obvious move — deleting the header from the response the middleware
 * returns — is the one move that must never be made, because it fails SILENTLY.
 * Read the snippet again: the same value that becomes the client header on one
 * line is what `parsedUrl` is built from on the next. Next reads the rewrite out
 * of the middleware's own response object, so deleting it there does not hide
 * the rewrite — it CANCELS it, and every rewritten address becomes an empty 200
 * with no error and no log line.
 *
 * `next.config.mjs`'s `headers()` cannot do it either: those are applied earlier
 * in the same route list than the middleware branch that writes the value, so a
 * header route runs before the value exists.
 *
 * ── So it is done on the Node response, after Next has already routed ────────
 *
 * By the time `router-server.js` calls `res.setHeader`, `parsedUrl` is computed
 * and the rewrite is decided. Dropping the header THERE removes the wire copy
 * and changes no routing — which is the whole property, and it is asserted both
 * ways in `tests/internal-response-headers.test.ts` (the header is dropped,
 * every other header passes) and over real HTTP in
 * `scripts/standalone-header-smoke.mjs` (the rewrite still resolves — the page
 * body is present — while the header is absent).
 *
 * ── Plain `.mjs`, and the duplication across the three apps is deliberate ────
 *
 * The standalone tree ships no TypeScript compiler and no bundler, so this file
 * cannot import a workspace package: `@meridian/*` resolves through
 * node_modules that the tracer prunes, and a `.ts` source would not run at all.
 * Each application therefore carries its own copy next to its own `server.js`,
 * and `scripts/check-response-header-filter.mjs` READS all three and fails CI if
 * they drift from each other or from the header list. That is the same
 * discipline `check-workspace-manifests.mjs` applies to the Dockerfile COPY
 * lines, for the same reason: the consumer runs somewhere the import cannot
 * reach, so the rule is executable rather than a comment.
 *
 * ── Why here and not `instrumentation.ts` ────────────────────────────────────
 *
 * An instrumentation hook is compiled for the edge runtime too, where
 * `node:http` does not exist, and it is loaded lazily by the RENDER server while
 * this header is written by the ROUTER server. Patching here runs before Next's
 * server module is evaluated, so the filter is in place before the listener
 * binds and no request can arrive ahead of it.
 */

import http from 'node:http';

/**
 * Response headers Next writes for its own router and must not put on the wire.
 *
 * One name today, and deliberately a list: `x-middleware-rewrite` is the one
 * these applications provably emit, but Next's own `INTERNAL_HEADERS` holds
 * seven more and `x-middleware-redirect` and `x-matched-path` reach `resHeaders`
 * by the same unconditional copy if a future branch produces them.
 *
 * ONLY NAMES NEXT SETS FOR ITSELF BELONG HERE. Anything a page or route handler
 * sets deliberately must pass through untouched.
 */
const INTERNAL_RESPONSE_HEADERS = ['x-middleware-rewrite'];

const blocked = new Set(INTERNAL_RESPONSE_HEADERS);
const proto = http.ServerResponse.prototype;

/**
 * Marker proving the patch is installed, so a double import cannot wrap
 * `setHeader` twice. A symbol rather than a string property: it must not appear
 * in `Object.keys` of anything.
 */
const installed = Symbol.for('meridian.internal-response-headers.installed');

if (proto[installed] !== true) {
  const original = proto.setHeader;
  proto.setHeader = function patchedSetHeader(name, value) {
    // `return this`, not undefined: `setHeader` is documented to return the
    // response for chaining and Next relies on the ServerResponse contract.
    if (typeof name === 'string' && blocked.has(name.toLowerCase())) return this;
    return original.call(this, name, value);
  };
  proto[installed] = true;
}

// Read proof rather than a comment claiming the patch is on. A boot that did not
// install the filter must be distinguishable in the log from one that did — this
// line is what the smoke checks alongside the absent-header assertion, and what
// an operator reads in pod logs.
console.log(
  `meridian-admin: internal response header filter active for ${INTERNAL_RESPONSE_HEADERS.join(', ')}`,
);

// Next's generated standalone server. It calls `process.chdir(__dirname)` and
// binds the listener, so nothing may be added after this point.
await import('./server.js');
