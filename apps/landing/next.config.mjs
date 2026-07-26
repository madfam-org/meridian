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

  /**
   * English is served unprefixed.
   *
   * The routes live under `app/[locale]`, so the English document is generated
   * as `/en` and the Spanish one as `/es`. A rewrite — not a redirect — makes
   * `/` serve the English document at its own address: the reader's URL stays
   * `/`, and what is returned is the page Next already prerendered, so nothing
   * about this makes the site dynamic.
   *
   * `beforeFiles` matters. An `afterFiles` rewrite would run only once the
   * filesystem had failed to match, and `/` matches nothing here, so either
   * position happens to work — but `beforeFiles` states the intent, which is
   * that this is a routing decision rather than a fallback.
   *
   * Why unprefixed at all: `meridian.madfam.io/` is the address on the
   * business card, in the repository, in `enclii.yaml` and in every link
   * already published. Moving the English page to `/en` would turn all of them
   * into redirects, and there is no reader it would help.
   */
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/en' }],
      afterFiles: [],
      fallback: [],
    };
  },

  /**
   * `/en` is not an address this site publishes.
   *
   * The route exists — it is what `/` rewrites to — and left alone it would be
   * reachable directly, which would put the same English document at two URLs
   * and split its search ranking between them. `hreflang` says the English
   * document is at `/`, so anything that arrives at `/en` is sent there, once,
   * permanently. The redirect is evaluated against the incoming request only;
   * the rewrite above resolves internally and is not fed back through it.
   *
   * `/es` needs no such treatment: it is the address the Spanish document is
   * published at.
   */
  async redirects() {
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
