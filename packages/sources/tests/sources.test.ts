/**
 * Adapter and drift tests. No network: every response is handed to the adapter
 * through an injected fetch. The response bodies follow the shapes the two
 * services returned on 2026-11-10 (BOE's consolidated-legislation index, Tezca's
 * law detail); the dates for Código Civil arts. 20–24 are the ones BOE reported
 * that day. The multi-version Tezca record is constructed for the test, and says
 * so where it is built.
 */
import { describe, expect, it } from 'vitest';
import { isoDate, type Citation } from '@meridian/core';
import {
  assessDrift,
  boeArticleOfTitle,
  boeDate,
  createBoeSource,
  createTezcaSource,
  locateCitation,
  samePublisherUrl,
  summariseDrift,
  type FetchLike,
  type SourceLocator,
} from '../src/index.js';

const CC_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763';
const CPEUM_URL = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf';

function fakeFetch(routes: Record<string, { status: number; body: unknown }>): FetchLike & { calls: string[]; headers: Array<Readonly<Record<string, string>> | undefined> } {
  const calls: string[] = [];
  const headers: Array<Readonly<Record<string, string>> | undefined> = [];
  const fn = (async (url: string, init?: { headers?: Readonly<Record<string, string>> }) => {
    calls.push(url);
    headers.push(init?.headers);
    const route = routes[url];
    if (!route) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: route.status >= 200 && route.status < 300, status: route.status, json: async () => route.body };
  }) as FetchLike & { calls: string[]; headers: typeof headers };
  fn.calls = calls;
  fn.headers = headers;
  return fn;
}

const BOE_INDEX_URL =
  'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-1889-4763/texto/indice';
const boeIndexBody = {
  status: { code: '200', text: 'ok' },
  data: [
    {
      bloque: [
        { id: 'tpreliminar', titulo: 'TÍTULO PRELIMINAR', fecha_actualizacion: '19740709' },
        { id: 'art20', titulo: 'Art 20', fecha_actualizacion: '20210603' },
        { id: 'art21', titulo: 'Art 21', fecha_actualizacion: '20210603' },
        { id: 'art22', titulo: 'Art 22', fecha_actualizacion: '20210603' },
        { id: 'art23', titulo: 'Art 23', fecha_actualizacion: '20150625' },
        { id: 'art24', titulo: 'Art 24', fecha_actualizacion: '20220406' },
      ],
    },
  ],
};

const cite = (over: Partial<Citation>): Citation => ({
  id: 'c',
  kind: 'statute',
  instrument: 'Código Civil (España)',
  jurisdiction: 'ES',
  verifiedOn: isoDate('2026-07-25'),
  ...over,
});

describe('BOE parsing', () => {
  it('reads BOE compact dates and nothing else', () => {
    expect(boeDate('20210603')).toBe('2021-06-03');
    expect(boeDate('20210230')).toBeNull();
    expect(boeDate('2021-06-03')).toBeNull();
    expect(boeDate(20210603)).toBeNull();
  });

  it('reads article numbers from block titles, and ignores structural blocks', () => {
    expect(boeArticleOfTitle('Art 22')).toBe('22');
    expect(boeArticleOfTitle('Artículo 2 bis')).toBe('2 bis');
    expect(boeArticleOfTitle('Art. 5.')).toBe('5');
    expect(boeArticleOfTitle('CAPÍTULO I')).toBeNull();
    expect(boeArticleOfTitle('TÍTULO PRELIMINAR')).toBeNull();
  });
});

describe('BOE source', () => {
  it('dates each cited article and links straight to it', async () => {
    const fetch = fakeFetch({ [BOE_INDEX_URL]: { status: 200, body: boeIndexBody } });
    const source = createBoeSource({ fetch });
    const outcome = locateCitation(cite({ id: 'es-cc-art-22-3', provision: 'art. 22.3', url: CC_URL }));
    if (!outcome.located) throw new Error('expected located');
    const reading = await source.read(outcome.locator);
    expect(reading).toMatchObject({
      status: 'read',
      articles: [
        {
          article: '22',
          lastChangedOn: '2021-06-03',
          history: 'article',
          readerUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763#art22',
          missing: false,
        },
      ],
    });
    expect(fetch.headers[0]).toEqual({ Accept: 'application/json' });
  });

  it('asks BOE once per instrument however many citations share it', async () => {
    const fetch = fakeFetch({ [BOE_INDEX_URL]: { status: 200, body: boeIndexBody } });
    const source = createBoeSource({ fetch });
    for (const provision of ['art. 22.1', 'art. 23', 'art. 24.1']) {
      const o = locateCitation(cite({ provision, url: CC_URL }));
      if (o.located) await source.read(o.locator);
    }
    expect(fetch.calls).toEqual([BOE_INDEX_URL]);
  });

  it('marks an article the index does not contain as missing, not as unchanged', async () => {
    const fetch = fakeFetch({ [BOE_INDEX_URL]: { status: 200, body: boeIndexBody } });
    const reading = await createBoeSource({ fetch }).read({
      scheme: 'boe',
      instrumentId: 'BOE-A-1889-4763',
      officialUrl: CC_URL,
      articles: ['999'],
    });
    expect(reading.status === 'read' && reading.articles[0]).toMatchObject({ missing: true, lastChangedOn: null });
  });

  it('names the failure: not found, rate limited, unexpected body', async () => {
    const loc: SourceLocator = { scheme: 'boe', instrumentId: 'BOE-A-1889-4763', officialUrl: CC_URL, articles: ['22'] };
    const notFound = await createBoeSource({ fetch: fakeFetch({}) }).read(loc);
    expect(notFound).toMatchObject({ status: 'unreadable', reason: 'not_found' });
    const limited = await createBoeSource({ fetch: fakeFetch({ [BOE_INDEX_URL]: { status: 429, body: {} } }) }).read(loc);
    expect(limited).toMatchObject({ status: 'unreadable', reason: 'rate_limited' });
    const odd = await createBoeSource({ fetch: fakeFetch({ [BOE_INDEX_URL]: { status: 200, body: { data: [] } } }) }).read(loc);
    expect(odd).toMatchObject({ status: 'unreadable', reason: 'upstream_error' });
  });
});

const TEZCA_CPEUM_URL = 'https://api.tezca.mx/api/v1/laws/cpeum/';
const tezcaCpeumBody = {
  id: 'cpeum',
  name: 'Constitución Política de los Estados Unidos Mexicanos',
  status: 'unknown',
  last_verified: null,
  source_url: CPEUM_URL,
  versions: [{ publication_date: '1917-02-05', valid_from: null, valid_to: null }],
};

const cpeumLocator: SourceLocator = {
  scheme: 'diputados',
  instrumentId: 'pdf/CPEUM.pdf',
  officialUrl: CPEUM_URL,
  articles: ['37'],
};

describe('Tezca source', () => {
  it('reads a law held without reform history as history "none", never as unchanged since 1917', async () => {
    const fetch = fakeFetch({ [TEZCA_CPEUM_URL]: { status: 200, body: tezcaCpeumBody } });
    const reading = await createTezcaSource({ fetch }).read(cpeumLocator);
    expect(reading).toMatchObject({
      status: 'read',
      sourceRecordId: 'cpeum',
      articles: [{ article: '37', history: 'none', lastChangedOn: null, readerUrl: 'https://tezca.mx/leyes/cpeum#article-37' }],
    });
  });

  it('dates the whole law when Tezca holds several versions', async () => {
    // Constructed for the test: a record with a reform history, which Tezca
    // does not yet hold for the Constitution.
    const body = {
      ...tezcaCpeumBody,
      versions: [
        { publication_date: '1917-02-05', valid_from: null, valid_to: '2026-06-02' },
        { publication_date: '2026-06-02', valid_from: '2026-06-03', valid_to: null },
      ],
    };
    const reading = await createTezcaSource({ fetch: fakeFetch({ [TEZCA_CPEUM_URL]: { status: 200, body } }) }).read(cpeumLocator);
    expect(reading.status === 'read' && reading.articles[0]).toMatchObject({ history: 'instrument', lastChangedOn: '2026-06-03' });
  });

  it('refuses a record that does not carry the cited publisher URL', async () => {
    const body = { ...tezcaCpeumBody, source_url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LMigra.pdf' };
    const reading = await createTezcaSource({ fetch: fakeFetch({ [TEZCA_CPEUM_URL]: { status: 200, body } }) }).read(cpeumLocator);
    expect(reading).toMatchObject({ status: 'unreadable', reason: 'identity_mismatch' });
  });

  it('reports an unmapped instrument and a rate limit by name', async () => {
    const unmapped = await createTezcaSource({ fetch: fakeFetch({}) }).read({ ...cpeumLocator, instrumentId: 'pdf/LFT.pdf' });
    expect(unmapped).toMatchObject({ status: 'unreadable', reason: 'not_found' });
    const limited = await createTezcaSource({ fetch: fakeFetch({ [TEZCA_CPEUM_URL]: { status: 429, body: {} } }) }).read(cpeumLocator);
    expect(limited).toMatchObject({ status: 'unreadable', reason: 'rate_limited' });
  });

  it('sends the API key as a header only when one is configured, and sends nothing else', async () => {
    const fetch = fakeFetch({ [TEZCA_CPEUM_URL]: { status: 200, body: tezcaCpeumBody } });
    await createTezcaSource({ fetch, apiKey: 'test-key' }).read(cpeumLocator);
    expect(fetch.calls).toEqual([TEZCA_CPEUM_URL]);
    expect(fetch.headers[0]).toEqual({ Accept: 'application/json', 'X-API-Key': 'test-key' });
  });

  it('compares publisher URLs by host and path only', () => {
    expect(samePublisherUrl('http://diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf', CPEUM_URL)).toBe(true);
    expect(samePublisherUrl(CPEUM_URL + '/', CPEUM_URL)).toBe(true);
    expect(samePublisherUrl('https://www.diputados.gob.mx/LeyesBiblio/pdf/53.pdf', CPEUM_URL)).toBe(false);
  });
});

describe('assessDrift', () => {
  it('reports unchanged when the article last moved before verification', async () => {
    const citation = cite({ id: 'es-cc-art-22-3', provision: 'art. 22.3', url: CC_URL });
    const outcome = locateCitation(citation);
    if (!outcome.located) throw new Error('expected located');
    const reading = await createBoeSource({ fetch: fakeFetch({ [BOE_INDEX_URL]: { status: 200, body: boeIndexBody } }) }).read(outcome.locator);
    const [finding] = assessDrift(citation, outcome, reading);
    expect(finding).toMatchObject({ status: 'unchanged_since_verification', lastChangedOn: '2021-06-03' });
  });

  it('reports a change after verification, and leaves verifiedOn exactly as it was', async () => {
    const citation = cite({ id: 'es-cc-art-24-1', provision: 'art. 24.1', url: CC_URL, verifiedOn: isoDate('2020-01-01') });
    const outcome = locateCitation(citation);
    if (!outcome.located) throw new Error('expected located');
    const reading = await createBoeSource({ fetch: fakeFetch({ [BOE_INDEX_URL]: { status: 200, body: boeIndexBody } }) }).read(outcome.locator);
    const [finding] = assessDrift(citation, outcome, reading);
    expect(finding).toMatchObject({ status: 'changed_since_verification', lastChangedOn: '2022-04-06', verifiedOn: '2020-01-01' });
    expect(citation.verifiedOn).toBe('2020-01-01');
  });

  it('is undeterminable, with the reason, when the source has no history', async () => {
    const citation = cite({ id: 'mx-cpeum-art-37', jurisdiction: 'MX', provision: 'art. 37', url: CPEUM_URL });
    const outcome = locateCitation(citation);
    const reading = outcome.located
      ? await createTezcaSource({ fetch: fakeFetch({ [TEZCA_CPEUM_URL]: { status: 200, body: tezcaCpeumBody } }) }).read(outcome.locator)
      : null;
    const findings = assessDrift(citation, outcome, reading);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ status: 'undeterminable', history: 'none' });
    expect(findings[0]?.reason).toMatch(/without a reform history/);
  });

  it('carries a not-located citation through as one undeterminable finding', () => {
    const citation = cite({ provision: 'disposición adicional tercera', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-4184' });
    const findings = assessDrift(citation, locateCitation(citation), null);
    expect(summariseDrift(findings)).toEqual({ changed_since_verification: 0, unchanged_since_verification: 0, undeterminable: 1 });
    expect(findings[0]?.reason).toMatch(/provision_not_articles/);
  });
});
