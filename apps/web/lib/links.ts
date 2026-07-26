/**
 * The addresses this portal knows about.
 *
 * Constants rather than literals scattered through the pages, because a
 * hostname is a deployment decision and not copy. The portal is
 * `meridian-app.madfam.io`, a sibling of the explainer at `meridian.madfam.io`
 * rather than a child of it: Cloudflare's universal certificate covers one label
 * under `madfam.io`, so `app.meridian.madfam.io` would serve a certificate error
 * to every visitor. `enclii.yaml` and `infra/k8s/production/` declare the same
 * pair. Only the addresses this application actually emits are declared here —
 * the explainer's is not among them, and an unused constant naming it would be a
 * second place for the hostname to go stale.
 *
 * `SELF_URL` is used for `metadataBase`, the sitemap and the share metadata, all
 * of which need an absolute address that a crawler or a chat client can resolve
 * without a request context. It is the address this service is configured to
 * serve on, not an observation that it is answering: nothing in this application
 * fetches, so it has no way to check, and a claim about reachability written
 * into a constant would be a guess.
 */

/** This application — the applicant portal (`@meridian/web`). */
export const SELF_URL = 'https://meridian-app.madfam.io';

/** Public source, including the rule catalog and every citation in it. */
export const REPO_URL = 'https://github.com/madfam-org/meridian';
