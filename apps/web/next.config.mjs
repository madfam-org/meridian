/**
 * Next configuration for the applicant portal.
 *
 * Two settings here are load-bearing rather than stylistic.
 *
 * `transpilePackages` — the Meridian domain packages are consumed as
 * TypeScript *source*. They publish `"main": "./src/index.ts"` and ship no
 * build step, deliberately: a single compiler pass over the whole workspace
 * means the app cannot drift from a stale `dist/` of the rules engine, and a
 * legal-rule change is visible in the app the moment it lands. Next will not
 * compile files under `node_modules` unless it is told to, so without this the
 * build fails on the first `.ts` file it meets inside `@meridian/core`.
 *
 * `experimental.extensionAlias` — those same packages are strict ESM and write
 * their relative imports as `./civil-date.js` while the file on disk is
 * `civil-date.ts`. That is the correct ESM spelling and TypeScript resolves it
 * under `moduleResolution: "bundler"`, but webpack takes an explicit extension
 * literally and would look for a `.js` that does not exist. The alias tells it
 * to try `.ts` and `.tsx` first and fall back to `.js`, so genuine JavaScript
 * still resolves normally.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['@meridian/core', '@meridian/pathways', '@meridian/presence'],

  experimental: {
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
    },
  },

  // TypeScript errors still fail the build (`typescript.ignoreBuildErrors`
  // stays at its default of `false`). ESLint is not yet part of this
  // workspace's toolchain — there is no shared config and no eslint dependency
  // — and an absent linter must not turn a production build into an
  // interactive prompt.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
