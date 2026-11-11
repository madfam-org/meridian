/**
 * Spain: BOE consolidated legislation, read through BOE's open-data API.
 *
 * The API publishes, for every consolidated instrument, an index of its blocks
 * (`/datosabiertos/api/legislacion-consolidada/id/{id}/texto/indice`). Each
 * block carries `fecha_actualizacion`: the date of the last change to that
 * block's consolidated text. For articles that is exactly the evidence drift
 * detection needs, at article granularity, from the official publisher.
 *
 * Only the instrument identifier is sent. One index request per instrument per
 * adapter instance; the result is memoised, so a catalog that cites the Código
 * Civil thirty times costs one request.
 */
import { compareDates, tryIsoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';
import type { ArticleReading, FetchLike, LegalSource, SourceLocator, SourceReading } from './model.js';

export const BOE_DEFAULT_BASE_URL = 'https://www.boe.es';
const VIA = 'BOE open data (consolidated legislation)';

interface BoeBlock {
  readonly id: string;
  readonly titulo: string;
  readonly fechaActualizacion: IsoDate | null;
}

type IndexResult =
  | { readonly ok: true; readonly blocks: readonly BoeBlock[] }
  | { readonly ok: false; readonly reading: Omit<Extract<SourceReading, { status: 'unreadable' }>, 'locator'> };

/** True when `a` is a date and either `b` is not or `a` falls after it. */
function isLater(a: IsoDate | null, b: IsoDate | null): boolean {
  if (a === null) return false;
  if (b === null) return true;
  return compareDates(a, b) > 0;
}

/** `20210603` → `2021-06-03`; anything else → `null`. */
export function boeDate(raw: unknown): IsoDate | null {
  if (typeof raw !== 'string' || !/^\d{8}$/.test(raw)) return null;
  return tryIsoDate(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`);
}

/**
 * The article number a block title names, normalised to the form `articlesOf`
 * produces: `Art 22` → `22`, `Artículo 2 bis` → `2 bis`, `CAPÍTULO I` → `null`.
 */
export function boeArticleOfTitle(titulo: string): string | null {
  const t = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
  const m = /^(?:articulo|art)\.?\s+(\d+)(?:\s+(bis|ter|quater|quinquies|sexies|septies|octies|nonies|novies|decies))?\.?$/.exec(t);
  if (!m) return null;
  return m[2] ? `${m[1]} ${m[2]}` : (m[1] as string);
}

/** Read the `bloque` list out of an index response, tolerating the API's array wrapper. */
export function parseBoeIndex(body: unknown): BoeBlock[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const data = (body as { data?: unknown }).data;
  const container = Array.isArray(data) ? data[0] : data;
  if (typeof container !== 'object' || container === null) return null;
  const bloque = (container as { bloque?: unknown }).bloque;
  if (!Array.isArray(bloque)) return null;
  const blocks: BoeBlock[] = [];
  for (const b of bloque) {
    if (typeof b !== 'object' || b === null) continue;
    const { id, titulo, fecha_actualizacion } = b as Record<string, unknown>;
    if (typeof id !== 'string' || typeof titulo !== 'string') continue;
    blocks.push({ id, titulo, fechaActualizacion: boeDate(fecha_actualizacion) });
  }
  return blocks;
}

export interface BoeSourceOptions {
  readonly fetch: FetchLike;
  /** Override for tests or a mirror. Defaults to {@link BOE_DEFAULT_BASE_URL}. */
  readonly baseUrl?: string;
}

export function createBoeSource(options: BoeSourceOptions): LegalSource {
  const base = (options.baseUrl ?? BOE_DEFAULT_BASE_URL).replace(/\/+$/, '');
  const cache = new Map<string, Promise<IndexResult>>();

  async function loadIndex(instrumentId: string): Promise<IndexResult> {
    const url = `${base}/datosabiertos/api/legislacion-consolidada/id/${encodeURIComponent(instrumentId)}/texto/indice`;
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await options.fetch(url, { headers: { Accept: 'application/json' } });
    } catch (e) {
      return {
        ok: false,
        reading: { status: 'unreadable', via: VIA, reason: 'upstream_error', detail: `Request failed: ${String(e)}` },
      };
    }
    if (response.status === 404) {
      return {
        ok: false,
        reading: {
          status: 'unreadable',
          via: VIA,
          reason: 'not_found',
          detail: `BOE has no consolidated text for ${instrumentId}.`,
        },
      };
    }
    if (response.status === 429) {
      return {
        ok: false,
        reading: { status: 'unreadable', via: VIA, reason: 'rate_limited', detail: 'BOE answered 429.' },
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        reading: { status: 'unreadable', via: VIA, reason: 'upstream_error', detail: `BOE answered ${response.status}.` },
      };
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        ok: false,
        reading: { status: 'unreadable', via: VIA, reason: 'upstream_error', detail: 'BOE returned a body that is not JSON.' },
      };
    }
    const blocks = parseBoeIndex(body);
    if (!blocks) {
      return {
        ok: false,
        reading: {
          status: 'unreadable',
          via: VIA,
          reason: 'upstream_error',
          detail: 'BOE returned JSON without the expected data.bloque index.',
        },
      };
    }
    return { ok: true, blocks };
  }

  return {
    scheme: 'boe',
    via: VIA,
    async read(locator: SourceLocator): Promise<SourceReading> {
      let pending = cache.get(locator.instrumentId);
      if (!pending) {
        pending = loadIndex(locator.instrumentId);
        cache.set(locator.instrumentId, pending);
      }
      const index = await pending;
      if (!index.ok) return { ...index.reading, locator };

      const byArticle = new Map<string, BoeBlock>();
      for (const block of index.blocks) {
        const article = boeArticleOfTitle(block.titulo);
        if (article === null) continue;
        const seen = byArticle.get(article);
        // If two blocks carry the same article title, keep the later date, so
        // the comparison errs toward reporting a change rather than hiding one.
        if (!seen || isLater(block.fechaActualizacion, seen.fechaActualizacion)) {
          byArticle.set(article, block);
        }
      }

      const articles: ArticleReading[] = locator.articles.map((article) => {
        const block = byArticle.get(article);
        if (!block) {
          return { article, lastChangedOn: null, history: 'article', readerUrl: null, missing: true };
        }
        return {
          article,
          lastChangedOn: block.fechaActualizacion,
          history: 'article',
          readerUrl: `${base}/buscar/act.php?id=${encodeURIComponent(locator.instrumentId)}#${encodeURIComponent(block.id)}`,
          missing: false,
        };
      });

      return { status: 'read', locator, via: VIA, sourceRecordId: locator.instrumentId, articles };
    },
  };
}
