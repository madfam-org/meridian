/**
 * From a citation to the place its text is published.
 *
 * The catalog already says where every rule comes from: `url` points at the
 * official publication and `provision` names the article. This module reads
 * those two fields and nothing else. It does not add identifiers to the catalog,
 * so the catalog keeps citing the publisher (BOE, Cámara de Diputados) rather
 * than any one service's internal record number, and a source that renumbers
 * its records does not touch the law Meridian encodes.
 *
 * Parsing is deliberately narrow. A provision is read as articles only when it
 * says "art." or "arts." followed by numbers; anything else is reported as not
 * locatable with the reason, never guessed at.
 */
import type { Citation } from '@meridian/core';
import type { LocateOutcome, SourceLocator } from './model.js';

const ARTICLE_SUFFIXES = 'bis|ter|quater|quinquies|sexies|septies|octies|nonies|novies|decies';
const ART_HEAD = /\barts?\.\s*/i;
const ITEM = new RegExp(`^(\\d+)(?:\\s+(${ARTICLE_SUFFIXES})\\b)?(?:\\.\\d+)*`, 'i');
const LIST_SEP = /^\s*(?:,\s*|\s+y\s+|\s+e\s+|\s+and\s+)/i;
const RANGE_SEP = /^\s*(?:-|–|\s+a\s+|\s+to\s+)\s*/i;

/** Longest range expanded into individual articles. A wider span is reported, not expanded. */
const MAX_RANGE = 30;

/**
 * The article identifiers a provision names, or `null` when it names none.
 *
 * `art. 22.3` → `['22']`; `arts. 145 y 146` → `['145', '146']`;
 * `arts. 72 a 74, reformados por…` → `['72', '73', '74']`; `art. 2 bis` →
 * `['2 bis']`; `art. 26, apartado B` → `['26']`;
 * `disposición adicional tercera` → `null`.
 */
export function articlesOf(provision: string): readonly string[] | null {
  const head = ART_HEAD.exec(provision);
  if (!head) return null;
  let rest = provision.slice(head.index + head[0].length);
  const out: string[] = [];
  for (;;) {
    const m = ITEM.exec(rest);
    if (!m) break;
    const number = m[1] as string;
    const suffix = m[2]?.toLowerCase();
    rest = rest.slice(m[0].length);

    const range = suffix === undefined ? RANGE_SEP.exec(rest) : null;
    const end = range ? ITEM.exec(rest.slice(range[0].length)) : null;
    if (range && end && end[2] === undefined) {
      const from = Number(number);
      const to = Number(end[1]);
      if (to < from || to - from > MAX_RANGE) return null;
      for (let n = from; n <= to; n += 1) out.push(String(n));
      rest = rest.slice(range[0].length + end[0].length);
    } else {
      out.push(suffix === undefined ? number : `${number} ${suffix}`);
    }

    const sep = LIST_SEP.exec(rest);
    if (!sep || !ITEM.test(rest.slice(sep[0].length))) break;
    rest = rest.slice(sep[0].length);
  }
  return out.length > 0 ? [...new Set(out)] : null;
}

/** The parts of an http(s) URL this package compares. */
export interface UrlParts {
  /** Lower-cased, without a leading `www.`. */
  readonly host: string;
  /** Without a trailing slash. */
  readonly path: string;
  readonly query: string;
}

const URL_RE = /^https?:\/\/([^/?#:]+)(?::\d+)?([^?#]*)(?:\?([^#]*))?/i;

/**
 * Split an http(s) URL into host, path and query, or `null`.
 *
 * Written out rather than using the `URL` global, which this package's
 * environment-neutral build (ES2022, no DOM or Node types) does not declare.
 */
export function urlParts(raw: string): UrlParts | null {
  const m = URL_RE.exec(raw.trim());
  if (!m) return null;
  return {
    host: (m[1] as string).toLowerCase().replace(/^www\./, ''),
    path: (m[2] ?? '').replace(/\/+$/, ''),
    query: m[3] ?? '',
  };
}

/** The first value of a query parameter, decoded, or `null`. */
export function queryParam(query: string, name: string): string | null {
  for (const pair of query.split('&')) {
    const eq = pair.indexOf('=');
    const key = eq < 0 ? pair : pair.slice(0, eq);
    if (key !== name) continue;
    try {
      return decodeURIComponent(eq < 0 ? '' : pair.slice(eq + 1));
    } catch {
      return null;
    }
  }
  return null;
}

const BOE_ID = /^BOE-A-\d{4}-\d+$/;

/** Where a citation's text is published, or why it cannot be located. */
export function locateCitation(citation: Citation): LocateOutcome {
  const citationId = citation.id;
  if (!citation.url) {
    return { located: false, citationId, reason: 'no_url', detail: 'The citation carries no URL.' };
  }
  const url = urlParts(citation.url);
  if (!url) {
    return {
      located: false,
      citationId,
      reason: 'unrecognised_publisher',
      detail: `Not an http(s) URL: ${citation.url}`,
    };
  }

  let scheme: SourceLocator['scheme'];
  let instrumentId: string;
  const { host } = url;

  if (host === 'boe.es') {
    const id = queryParam(url.query, 'id') ?? '';
    if (url.path !== '/buscar/act.php' || !BOE_ID.test(id)) {
      return {
        located: false,
        citationId,
        reason: 'not_consolidated_text',
        detail:
          'A BOE gazette page rather than consolidated legislation. BOE dates articles only in ' +
          'its consolidated texts (/buscar/act.php?id=BOE-A-…).',
      };
    }
    scheme = 'boe';
    instrumentId = id;
  } else if (host === 'diputados.gob.mx') {
    const marker = '/LeyesBiblio/';
    const at = url.path.indexOf(marker);
    if (at < 0 || !url.path.toLowerCase().endsWith('.pdf')) {
      return {
        located: false,
        citationId,
        reason: 'unrecognised_publisher',
        detail: 'A Cámara de Diputados page outside the LeyesBiblio federal legislation library.',
      };
    }
    scheme = 'diputados';
    instrumentId = url.path.slice(at + marker.length);
  } else {
    return {
      located: false,
      citationId,
      reason: 'unrecognised_publisher',
      detail: `No source adapter reads ${host}.`,
    };
  }

  const articles = citation.provision ? articlesOf(citation.provision) : null;
  if (!articles) {
    return {
      located: false,
      citationId,
      reason: 'provision_not_articles',
      detail: citation.provision
        ? `The provision "${citation.provision}" does not name articles.`
        : 'The citation names no provision.',
    };
  }

  return {
    located: true,
    citationId,
    locator: { scheme, instrumentId, officialUrl: citation.url, articles },
  };
}
