/**
 * Next configuration for the applicant portal.
 *
 * `output: 'standalone'` is load-bearing rather than stylistic. `Dockerfile.web`
 * copies `.next/standalone` and has no other way to start the server; it fails
 * the build with an explicit message when the directory is absent. Declaring it
 * here keeps the image and the app in agreement.
 *
 * The Meridian workspace packages are consumed as **emitted JavaScript**. Each
 * one builds with `tsc -p tsconfig.build.json` and points its `exports` default
 * condition at `./dist/index.js`, so nothing under `node_modules/@meridian`
 * needs a TypeScript pass from this app. That was not always true — the packages
 * once published `"main": "./src/index.ts"` — and it changed because the API
 * container cannot run TypeScript: Node executes JavaScript, so a package
 * without a `dist/` fails at process start rather than at build time.
 *
 * Two settings that existed to serve the old arrangement have therefore been
 * removed, and this note records why so nobody restores them by reflex:
 *
 *  - `transpilePackages` compiled the `.ts` sources webpack met inside
 *    `@meridian/*`. There are none to meet now.
 *  - `experimental.extensionAlias` mapped a `./civil-date.js` request onto
 *    `civil-date.ts`. The emitted tree has a real `civil-date.js` at that path,
 *    and remapping it would send a genuine JavaScript request looking for
 *    TypeScript that is not shipped.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  output: 'standalone',

  // TypeScript errors still fail the build (`typescript.ignoreBuildErrors`
  // stays at its default of `false`). ESLint is not yet part of this
  // workspace's toolchain — there is no shared config and no eslint dependency
  // — and an absent linter must not turn a production build into an
  // interactive prompt.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
