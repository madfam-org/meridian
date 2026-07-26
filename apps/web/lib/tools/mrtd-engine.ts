/**
 * The one seam through which the browser reaches `@meridian/mrtd`.
 *
 * WHY THIS FILE EXISTS, AND WHY IT DOES NOT IMPORT THE PACKAGE BY NAME
 *
 * `@meridian/mrtd`'s public surface is `src/index.ts`, and that file ends with
 * `export * from './bac.js'`. `bac.ts` imports `node:crypto` — it is the only
 * Node builtin anywhere under `packages/` — because Basic Access Control's key
 * seed is a SHA-1 digest and the specification says so.
 *
 * A browser bundle cannot resolve `node:crypto`. Importing the package index
 * from a client component fails the build outright:
 *
 *     Module build failed: UnhandledSchemeError:
 *     Reading from "node:crypto" is not handled by plugins.
 *     Import trace: node:crypto → packages/mrtd/dist/bac.js
 *                              → packages/mrtd/dist/index.js
 *
 * Webpack cannot drop `bac.js` on its own: it is reached by a re-export, and
 * `@meridian/mrtd` does not declare `"sideEffects": false`, so the module is
 * built whether or not anything in it is used.
 *
 * So the value import below addresses the emitted `validate.js` directly. The
 * types still come from the package's public surface — `import type` is erased
 * by `verbatimModuleSyntax` and pulls no runtime module into the graph — which
 * keeps the contract honest even though one function bypasses the index.
 *
 * THIS IS A DOCUMENTED EXCEPTION, NOT A PATTERN. AGENTS.md is explicit that a
 * package's `src/index.ts` is its only public surface. Nothing else in this
 * repository reaches past it and nothing else should. Two upstream fixes would
 * remove the exception, and either one makes this file a one-line re-export of
 * `validateMrz` from `@meridian/mrtd`:
 *
 *   1. Stop re-exporting `bac.js` from `packages/mrtd/src/index.ts` and give it
 *      its own entry in the package `exports` map, so a caller that wants a BAC
 *      key seed asks for it and a caller that wants an MRZ verdict does not pay
 *      for `node:crypto`; or
 *   2. Defer the `createHash` import inside `bac.ts` so the module carries no
 *      static dependency on a Node builtin.
 *
 * Until then, everything that computes on MRZ text in the browser goes through
 * here, so there is exactly one place to change.
 *
 * `@meridian/mrtd` is a declared dependency of `@meridian/web` even though the
 * value import is a path. That declaration is what makes `turbo`'s `^build` and
 * the Docker builder's `pnpm --filter "@meridian/web..." build` emit
 * `packages/mrtd/dist` before this app compiles; without it the path resolves
 * to nothing in a clean tree.
 */

import { validateMrz as validateMrzFromDist } from '../../../../packages/mrtd/dist/validate.js';
import type { MrzOptions, MrzValidation } from '@meridian/mrtd';

/**
 * Parse an MRZ and verify every check digit the detected format defines.
 *
 * Pure. No I/O, no clock, no storage. `options.referenceDate` is required by
 * this wrapper rather than optional as it is upstream: the package's default is
 * its own `todayUtc()`, and this application deliberately reads no clock, so
 * leaving the choice implicit here would smuggle one in.
 */
export function validateMrz(
  raw: string,
  options: MrzOptions & { readonly referenceDate: string },
): MrzValidation {
  return validateMrzFromDist(raw, options);
}
