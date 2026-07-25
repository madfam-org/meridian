/**
 * Next configuration for the firm console.
 *
 * `output: 'standalone'` is not a preference. `Dockerfile.admin` copies
 * `.next/standalone` and has no other way to start the server — it fails the
 * build with an explicit message if the directory is absent. Declaring it here
 * keeps the container image and the app in agreement.
 *
 * The Meridian workspace packages are consumed as **emitted JavaScript**. Each
 * builds with `tsc -p tsconfig.build.json` and points its `exports` default
 * condition at `./dist/index.js`. This app therefore imports JavaScript, not
 * TypeScript source. The packages once published `"main": "./src/index.ts"` and
 * shipped no build step; that stopped being viable because the API container
 * cannot run TypeScript — Node executes JavaScript, so a package without a
 * `dist/` fails at process start rather than at build time.
 *
 * Two settings that served the old arrangement are gone, recorded here so
 * nobody restores them out of habit:
 *
 *  - `transpilePackages` existed so webpack would compile the `.ts` files it
 *    met inside `@meridian/*`. It meets none now.
 *  - `experimental.extensionAlias` rewrote a `./civil-date.js` request to
 *    `civil-date.ts`. The emitted tree has a real `civil-date.js` at that path,
 *    so the alias would now send a valid JavaScript request hunting for
 *    TypeScript that is not published.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // The repo has no shared ESLint configuration yet; `next build` must not
    // fail on a linter that does not exist. Type checking still runs.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
