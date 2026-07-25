/**
 * Next configuration for the firm console.
 *
 * `transpilePackages` is not an optimisation here — it is the only way this app
 * builds. The Meridian workspace packages are published as TypeScript *source*
 * (`"exports": { ".": "./src/index.ts" }`, no build step), so webpack has to
 * compile them rather than consume emitted JavaScript.
 *
 * `experimental.extensionAlias` is the companion half that is easy to miss.
 * Those packages use `verbatimModuleSyntax` with ESM-correct relative imports
 * ending in `.js` (`./civil-date.js`), while the file on disk is
 * `./civil-date.ts`. Without the alias webpack resolves the literal request,
 * finds nothing, and the build dies with a module-not-found on a file that is
 * plainly there. This maps the request back to the source extension.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  /**
   * `Dockerfile.admin` copies `.next/standalone` and has no other way to start
   * the server — it fails the build with an explicit message if the directory is
   * absent. Declaring it here keeps the container image and the app in agreement.
   */
  output: 'standalone',
  transpilePackages: [
    '@meridian/core',
    '@meridian/pathways',
    '@meridian/documents',
    '@meridian/govtech',
  ],
  experimental: {
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    },
  },
  eslint: {
    // The repo has no shared ESLint configuration yet; `next build` must not
    // fail on a linter that does not exist. Type checking still runs.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
