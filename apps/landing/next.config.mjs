/**
 * Next configuration for the marketing site.
 *
 * `output: 'standalone'` is load-bearing. `Dockerfile.landing` copies
 * `.next/standalone` and has no other way to start the server; it fails the
 * build with an explicit message when the directory is absent.
 *
 * This site imports `@meridian/core` and `@meridian/pathways` so that the
 * figures it publishes — how many pathways ship, how many a lawyer has signed
 * off — are counted from the catalog at build time rather than typed into
 * copy. Those packages are consumed as **emitted JavaScript**: each builds with
 * `tsc -p tsconfig.build.json` and its `exports` default condition points at
 * `./dist/index.js`. Nothing here needs `transpilePackages` or an
 * `extensionAlias`, and adding either would send a valid JavaScript request
 * hunting for TypeScript that the packages do not publish.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  output: 'standalone',

  // TypeScript errors still fail the build (`typescript.ignoreBuildErrors`
  // stays at its default of `false`). ESLint is not part of this workspace's
  // toolchain yet — no shared config, no eslint dependency — and an absent
  // linter must not turn a production build into an interactive prompt.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
