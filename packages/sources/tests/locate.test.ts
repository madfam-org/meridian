import { describe, expect, it } from 'vitest';
import { isoDate, type Citation } from '@meridian/core';
import { articlesOf, locateCitation, queryParam, urlParts } from '../src/locate.js';

describe('urlParts and queryParam', () => {
  it('splits host, path and query, normalising www., host case and a trailing slash', () => {
    expect(urlParts('https://WWW.BOE.es/buscar/act.php?id=BOE-A-1889-4763#a22')).toEqual({
      host: 'boe.es',
      path: '/buscar/act.php',
      query: 'id=BOE-A-1889-4763',
    });
    expect(urlParts('http://diputados.gob.mx:443/LeyesBiblio/pdf/CPEUM.pdf/')).toMatchObject({
      host: 'diputados.gob.mx',
      path: '/LeyesBiblio/pdf/CPEUM.pdf',
    });
    expect(urlParts('ftp://example.org/x')).toBeNull();
    expect(urlParts('not a url')).toBeNull();
  });

  it('reads a decoded query parameter and nothing that merely contains its name', () => {
    expect(queryParam('lang=es&id=BOE-A-1889-4763', 'id')).toBe('BOE-A-1889-4763');
    expect(queryParam('tid=x', 'id')).toBeNull();
    expect(queryParam('id=%E0%A4%A', 'id')).toBeNull();
  });
});

const cite = (over: Partial<Citation>): Citation => ({
  id: 'c',
  kind: 'statute',
  instrument: 'Código Civil (España)',
  jurisdiction: 'ES',
  verifiedOn: isoDate('2026-07-25'),
  ...over,
});

describe('articlesOf', () => {
  it.each([
    ['art. 22.1', ['22']],
    ['art. 22.3', ['22']],
    ['art. 2 bis', ['2 bis']],
    ['art. 26, apartado B', ['26']],
    ['arts. 145 y 146', ['145', '146']],
    ['arts. 16, 17 y 18', ['16', '17', '18']],
    ['arts. 72 a 74, reformados por Acuerdo DOF 2019-04-23', ['72', '73', '74']],
    ['Título IV, Capítulo VII, arts. 93-99', ['93', '94', '95', '96', '97', '98', '99']],
    ['art. 50, reformado por Acuerdo DOF 2016-09-30', ['50']],
    ['art. 6(1)-(2)', ['6']],
    ['art. 9.1.a', ['9']],
  ])('%s → %j', (provision, expected) => {
    expect(articlesOf(provision)).toEqual(expected);
  });

  it.each([
    'disposición adicional tercera',
    'Trámite 5 (Visa de Residencia Temporal)',
    'DOF 2026-01-09',
    'Appendix 2 to Annex 16-A',
  ])('names no articles: %s', (provision) => {
    expect(articlesOf(provision)).toBeNull();
  });

  it('refuses to expand an implausibly wide range rather than invent sixty articles', () => {
    expect(articlesOf('arts. 1 a 60')).toBeNull();
  });

  it('does not read the Spanish preposition "a" as a range when no number follows', () => {
    expect(articlesOf('art. 5 a efectos de cómputo')).toEqual(['5']);
  });
});

describe('locateCitation', () => {
  it('locates BOE consolidated legislation by its BOE-A identifier', () => {
    const out = locateCitation(
      cite({ id: 'es-cc-art-22-3', provision: 'art. 22.3', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763' }),
    );
    expect(out).toEqual({
      located: true,
      citationId: 'es-cc-art-22-3',
      locator: {
        scheme: 'boe',
        instrumentId: 'BOE-A-1889-4763',
        officialUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        articles: ['22'],
      },
    });
  });

  it('locates Cámara de Diputados LeyesBiblio files by their library path', () => {
    const out = locateCitation(
      cite({
        id: 'mx-cpeum-art-37',
        instrument: 'Constitución Política de los Estados Unidos Mexicanos',
        jurisdiction: 'MX',
        provision: 'art. 37',
        url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf',
      }),
    );
    expect(out.located && out.locator).toMatchObject({ scheme: 'diputados', instrumentId: 'pdf/CPEUM.pdf', articles: ['37'] });
  });

  it('reports a BOE gazette page as having no consolidated, dated text', () => {
    const out = locateCitation(cite({ provision: 'art. 6', url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2018-4305' }));
    expect(out).toMatchObject({ located: false, reason: 'not_consolidated_text' });
  });

  it('reports publishers it cannot read rather than guessing', () => {
    const out = locateCitation(cite({ provision: 'art. 6', url: 'https://eur-lex.europa.eu/eli/reg/2016/399/oj' }));
    expect(out).toMatchObject({ located: false, reason: 'unrecognised_publisher' });
  });

  it('reports a missing URL and a provision that names no article', () => {
    expect(locateCitation(cite({ provision: 'art. 6' }))).toMatchObject({ located: false, reason: 'no_url' });
    expect(
      locateCitation(cite({ provision: 'disposición adicional tercera', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-4184' })),
    ).toMatchObject({ located: false, reason: 'provision_not_articles' });
  });
});
