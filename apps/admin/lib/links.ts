/**
 * The addresses this console knows about.
 *
 * A constant rather than a literal in the metadata block, because a hostname is
 * a deployment decision and not copy. `enclii.yaml` and
 * `infra/k8s/production/admin-deployment.yaml` declare the same host, flat under
 * `madfam.io` rather than nested — Cloudflare's universal certificate covers one
 * label, so a nested host would serve a certificate error to every visitor.
 *
 * `SELF_URL` exists so `metadataBase` can resolve share metadata to an absolute
 * address. It is where this service is configured to serve, not an observation
 * that it is answering; this application makes no request and could not check.
 */

/** This application — the firm console (`@meridian/admin`). */
export const SELF_URL = 'https://meridian-admin.madfam.io';
