/**
 * Mexico: federal legislation, read through Tezca.
 *
 * Tezca is MADFAM's Mexican-law corpus. It ingests the Cámara de Diputados
 * LeyesBiblio library and keeps, on every law, the publisher URL it came from
 * (`source_url`). Meridian's catalog cites that same publisher URL, so the two
 * systems meet on the official publication rather than on each other's
 * internal identifiers.
 *
 * Division of labour, which this adapter must not blur:
 *
 *  - Tezca owns the text, its versions and its identifiers. Meridian never
 *    copies article text into the catalog or a report; it links to Tezca's
 *    reader instead.
 *  - Meridian owns the rule: which provision a criterion rests on, and when a
 *    person last read it. Tezca never sees a criterion, a matter or a fact
 *    about an applicant. The only thing sent is a law identifier.
 *
 * Identity. Tezca does not yet offer a lookup by publisher URL, so the adapter
 * carries a small table from LeyesBiblio file to Tezca record and **checks it on
 * every read**: if the record Tezca returns does not carry the cited URL as its
 * `source_url`, the reading is `identity_mismatch`, never a silent success. When
 * Tezca exposes a lookup by source URL, the table is replaced by that call and
 * nothing else changes.
 *
 * Change history. As of 2026-11-10 Tezca records most federal laws with a
 * single version dated to the original publication (the Constitution as
 * 1917-02-05) and no `valid_from`. That is a record of the text, not of its
 * reforms, so the adapter reports `history: 'none'` for it and drift comes back
 * undeterminable. It does not read "one version, 1917" as "unchanged since
 * 1917". Where Tezca holds several versions, their dates are law-wide, and the
 * reading says `history: 'instrument'`.
 */
import { compareDates, tryIsoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';
import type { ArticleReading, FetchLike, LegalSource, SourceLocator, SourceReading } from './model.js';
import { urlParts } from './locate.js';

export const TEZCA_DEFAULT_API_BASE_URL = 'https://api.tezca.mx';
export const TEZCA_DEFAULT_READER_BASE_URL = 'https://tezca.mx';
const VIA = 'Tezca (Mexican federal legislation)';

/**
 * LeyesBiblio file → Tezca record, for the instruments the catalog cites.
 *
 * Each pair was read from Tezca's own `source_url` on 2026-11-10, and every
 * read re-checks it. Two entries need Tezca's attention rather than ours:
 * `pdf/LMigra.pdf` is held twice (`lm` and `lmigra`), and the Ley de
 * Nacionalidad's record id is the bare file number `53`.
 */
export const LEYESBIBLIO_TO_TEZCA: Readonly<Record<string, string>> = {
  'pdf/CPEUM.pdf': 'cpeum',
  'pdf/LMigra.pdf': 'lmigra',
  'regley/Reg_LMigra.pdf': 'reg_reg_lmigra',
  'pdf/53.pdf': '53',
  'regley/Reg_LNac.pdf': 'reg_reg_lnac',
  'pdf/LRPCAP.pdf': 'lrpcap',
  'pdf/LDVUMA_301216.pdf': 'ldvuma_301216',
  'pdf/LNEP.pdf': 'lnep',
  'pdf/LISR.pdf': 'lisr',
  'pdf/CFF.pdf': 'cff',
};

interface TezcaVersion {
  readonly publicationDate: IsoDate | null;
  readonly validFrom: IsoDate | null;
}

interface TezcaLaw {
  readonly id: string;
  readonly sourceUrl: string | null;
  readonly versions: readonly TezcaVersion[];
}

/** Tezca returns dates as `YYYY-MM-DD` or occasionally with a time part; keep the civil date only. */
function tezcaDate(raw: unknown): IsoDate | null {
  if (typeof raw !== 'string') return null;
  return tryIsoDate(raw.slice(0, 10));
}

export function parseTezcaLaw(body: unknown): TezcaLaw | null {
  if (typeof body !== 'object' || body === null) return null;
  const { id, source_url, versions } = body as Record<string, unknown>;
  if (typeof id !== 'string') return null;
  const parsed: TezcaVersion[] = [];
  if (Array.isArray(versions)) {
    for (const v of versions) {
      if (typeof v !== 'object' || v === null) continue;
      const rec = v as Record<string, unknown>;
      parsed.push({ publicationDate: tezcaDate(rec.publication_date), validFrom: tezcaDate(rec.valid_from) });
    }
  }
  return { id, sourceUrl: typeof source_url === 'string' ? source_url : null, versions: parsed };
}

/** Compare publisher URLs by host and path; scheme, `www.`, case of host and a trailing slash do not matter. */
export function samePublisherUrl(a: string, b: string): boolean {
  const x = urlParts(a);
  const y = urlParts(b);
  return x !== null && y !== null && x.host === y.host && x.path === y.path;
}

/**
 * What a Tezca law record can say about when its text changed.
 *
 * Several versions, or any version with a `valid_from`, is a reform history at
 * law level: the latest of those dates is when the law last changed. One
 * version with no `valid_from`, or none, is a text without a history.
 */
export function tezcaChangeHistory(law: TezcaLaw): { history: 'instrument' | 'none'; lastChangedOn: IsoDate | null } {
  const hasHistory = law.versions.length >= 2 || law.versions.some((v) => v.validFrom !== null);
  if (!hasHistory) return { history: 'none', lastChangedOn: null };
  let latest: IsoDate | null = null;
  for (const v of law.versions) {
    for (const d of [v.publicationDate, v.validFrom]) {
      if (d !== null && (latest === null || compareDates(d, latest) > 0)) latest = d;
    }
  }
  return latest === null ? { history: 'none', lastChangedOn: null } : { history: 'instrument', lastChangedOn: latest };
}

export interface TezcaSourceOptions {
  readonly fetch: FetchLike;
  readonly apiBaseUrl?: string;
  readonly readerBaseUrl?: string;
  /**
   * A Tezca API key with the `read` scope. Optional: the law detail endpoint
   * answers without one, at a lower rate limit. Never logged or echoed.
   */
  readonly apiKey?: string;
  /** Override the identity table, e.g. once Tezca can resolve a publisher URL itself. */
  readonly resolveRecordId?: (locator: SourceLocator) => string | null;
}

export function createTezcaSource(options: TezcaSourceOptions): LegalSource {
  const api = (options.apiBaseUrl ?? TEZCA_DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  const reader = (options.readerBaseUrl ?? TEZCA_DEFAULT_READER_BASE_URL).replace(/\/+$/, '');
  const resolve =
    options.resolveRecordId ?? ((locator: SourceLocator) => LEYESBIBLIO_TO_TEZCA[locator.instrumentId] ?? null);
  const cache = new Map<string, Promise<{ ok: true; law: TezcaLaw } | { ok: false; status: number; detail: string }>>();

  async function load(recordId: string) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.apiKey) headers['X-API-Key'] = options.apiKey;
    try {
      const response = await options.fetch(`${api}/api/v1/laws/${encodeURIComponent(recordId)}/`, { headers });
      if (!response.ok) return { ok: false as const, status: response.status, detail: `Tezca answered ${response.status}.` };
      const law = parseTezcaLaw(await response.json());
      if (!law) return { ok: false as const, status: 502, detail: 'Tezca returned a body without a law record.' };
      return { ok: true as const, law };
    } catch (e) {
      return { ok: false as const, status: 0, detail: `Request failed: ${String(e)}` };
    }
  }

  return {
    scheme: 'diputados',
    via: VIA,
    async read(locator: SourceLocator): Promise<SourceReading> {
      const recordId = resolve(locator);
      if (recordId === null) {
        return {
          status: 'unreadable',
          locator,
          via: VIA,
          reason: 'not_found',
          detail: `No Tezca record is mapped to LeyesBiblio ${locator.instrumentId}.`,
        };
      }
      let pending = cache.get(recordId);
      if (!pending) {
        pending = load(recordId);
        cache.set(recordId, pending);
      }
      const result = await pending;
      if (!result.ok) {
        const reason = result.status === 404 ? 'not_found' : result.status === 429 ? 'rate_limited' : 'upstream_error';
        return { status: 'unreadable', locator, via: VIA, reason, detail: result.detail };
      }
      const { law } = result;
      if (law.sourceUrl === null || !samePublisherUrl(law.sourceUrl, locator.officialUrl)) {
        return {
          status: 'unreadable',
          locator,
          via: VIA,
          reason: 'identity_mismatch',
          detail:
            `Tezca record ${recordId} carries source_url ${law.sourceUrl ?? '(none)'}, ` +
            `not the cited ${locator.officialUrl}.`,
        };
      }
      const { history, lastChangedOn } = tezcaChangeHistory(law);
      const articles: ArticleReading[] = locator.articles.map((article) => ({
        article,
        lastChangedOn,
        history,
        readerUrl: /^\d+$/.test(article)
          ? `${reader}/leyes/${encodeURIComponent(law.id)}#article-${article}`
          : `${reader}/leyes/${encodeURIComponent(law.id)}`,
        missing: false,
      }));
      return { status: 'read', locator, via: VIA, sourceRecordId: law.id, articles };
    },
  };
}
