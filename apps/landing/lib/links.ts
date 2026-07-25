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
 * Neither host is serving yet. The links are correct for where each service is
 * configured to run, and the status section says plainly that nothing is
 * deployed, so a visitor is not left to discover it by clicking.
 */

/** The marketing site itself — this application. */
export const SITE_URL = 'https://meridian.madfam.io';

/** The applicant portal (`@meridian/web`). */
export const PORTAL_URL = 'https://meridian-app.madfam.io';

/** Public source, including the rule catalog and every citation in it. */
export const REPO_URL = 'https://github.com/madfam-org/meridian';
