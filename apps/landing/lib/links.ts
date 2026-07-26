/**
 * The two destinations this site sends people to.
 *
 * They are constants rather than literals scattered through the page because
 * the hostnames are a deployment decision, not copy. `meridian.madfam.io` is
 * this site; the applicant portal moved to `meridian-app.madfam.io` when the two
 * were split, following the same pattern as the rest of the ecosystem
 * (`avala.studio` / `app.avala.studio`). Nested subdomains are not an option —
 * Cloudflare universal SSL covers one label — so every Meridian host is flat
 * under `madfam.io`.
 *
 * Each constant is the address the corresponding service is configured to serve
 * on, in `enclii.yaml` and in `infra/k8s/production/`. Whether a host is
 * answering at any given moment is a fact about the cluster, and this
 * application has no way to observe it: nothing here fetches, so a claim about
 * reachability written into copy would be a guess that ages badly in both
 * directions. The page therefore states what it can check — what the catalog
 * contains and what the applications hold — and leaves reachability to the
 * browser, which finds out for certain by trying.
 */

/** The marketing site itself — this application. */
export const SITE_URL = 'https://meridian.madfam.io';

/** The applicant portal (`@meridian/web`). */
export const PORTAL_URL = 'https://meridian-app.madfam.io';

/** Public source, including the rule catalog and every citation in it. */
export const REPO_URL = 'https://github.com/madfam-org/meridian';
