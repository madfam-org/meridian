/**
 * `lib/locale.ts` and the locale surface of `lib/i18n.ts`.
 *
 * English is unprefixed and Spanish lives under `/es`. `middleware.ts` rewrites
 * `/pricing` to `/en/pricing` so a `[locale]` segment has something to match,
 * which means this app carries two forms of every path — the routed one and the
 * public one — and exactly one place is allowed to know the difference.
 *
 * The bugs on this seam are all quiet ones: a switcher whose target changes on
 * hydration, a page that declares its translation as canonical, an `hreflang`
 * set that publishes an address nobody serves.
 */

import { describe, expect, it } from 'vitest';

import type { Citation } from '@meridian/core';
import { isoDate } from '@meridian/core';

import { SELF_URL } from '@/lib/links';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_ENDONYM,
  LOCALE_PREFIX,
  htmlLang,
  instrumentLang,
  isLocale,
  localizedPath,
  otherLocale,
  parseLocale,
} from '@/lib/i18n';
import { alternatesFor, publicPath, readLocale } from '@/lib/locale';

describe('the locale scheme', () => {
  it('publishes exactly two locales, English unprefixed', () => {
    expect([...LOCALES].sort()).toEqual(['en', 'es']);
    expect(DEFAULT_LOCALE).toBe('en');
    expect(LOCALE_PREFIX.en).toBe('');
    expect(LOCALE_PREFIX.es).toBe('/es');
  });

  it('names each language in itself', () => {
    // A control labelled "Spanish" is useless to the person who needs it,
    // because that person is not reading English.
    expect(LOCALE_ENDONYM.en).toBe('English');
    expect(LOCALE_ENDONYM.es).toBe('Español');
  });

  it('accepts only the locales it publishes', () => {
    expect(parseLocale('es')).toBe('es');
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('de')).toBeNull();
    expect(parseLocale('EN')).toBeNull();
    expect(parseLocale('')).toBeNull();
    expect(isLocale('es')).toBe(true);
    expect(isLocale('pt-BR')).toBe(false);
  });

  it('is its own inverse', () => {
    expect(otherLocale('en')).toBe('es');
    expect(otherLocale('es')).toBe('en');
    expect(htmlLang('en')).toBe('en');
    expect(htmlLang('es')).toBe('es');
  });
});

describe('the routed path and the public one', () => {
  it('strips the middleware rewrite and nothing else', () => {
    // `usePathname()` returns `/en/pricing` during prerender and `/pricing` in
    // the browser. Both have to produce the same switcher target, or the link
    // changes under the reader on hydration.
    expect(publicPath('/en/pricing')).toBe('/pricing');
    expect(publicPath('/en')).toBe('/');
    expect(publicPath('/pricing')).toBe('/pricing');
    expect(publicPath('/es/pricing')).toBe('/es/pricing');
    expect(publicPath('/')).toBe('/');
  });

  it('does not strip a segment that merely begins with the prefix', () => {
    expect(publicPath('/enclosures')).toBe('/enclosures');
    expect(publicPath('/entry/1')).toBe('/entry/1');
  });

  it('round-trips a routed path into the other locale', () => {
    // This is what the switcher computes: the same page, in the other
    // language, never the home page.
    const routed = '/en/matters/m-001/presence';

    expect(localizedPath(publicPath(routed), 'es')).toBe('/es/matters/m-001/presence');
    expect(localizedPath(publicPath(routed), 'en')).toBe('/matters/m-001/presence');
  });

  it('keeps a query string when switching language', () => {
    // `/pathways` carries the reader's filters in the query. A switch that
    // dropped them would hand a Spanish reader an unfiltered list.
    expect(localizedPath(`${publicPath('/en/pathways')}?jurisdiction=ES`, 'es')).toBe(
      '/es/pathways?jurisdiction=ES',
    );
  });
});

describe('hreflang alternates', () => {
  it('declare the page in its own locale as canonical', () => {
    // A page that declared its translation as canonical would be asking to be
    // de-indexed in favour of it.
    const english = alternatesFor('/tools/schengen', 'en');
    const spanish = alternatesFor('/tools/schengen', 'es');

    expect(english.canonical).toBe(`${SELF_URL}/tools/schengen`);
    expect(spanish.canonical).toBe(`${SELF_URL}/es/tools/schengen`);
  });

  it('publish both languages plus x-default, as absolute URLs', () => {
    const { languages } = alternatesFor('/tools/schengen', 'en');

    expect(Object.keys(languages).sort()).toEqual(['en', 'es', 'x-default']);
    expect(languages['x-default']).toBe(languages.en);
    for (const url of Object.values(languages)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('describe the document, not the query', () => {
    // `hreflang` describes documents, and the document at
    // `/pathways?jurisdiction=ES` is the document at `/pathways`.
    expect(alternatesFor('/pathways?jurisdiction=ES', 'en').languages.es).toBe(
      `${SELF_URL}/es/pathways`,
    );
  });

  it('handle the home page', () => {
    const home = alternatesFor('/', 'es');

    expect(home.canonical).toBe(`${SELF_URL}/es`);
    expect(home.languages.en).toBe(`${SELF_URL}/`);
  });
});

describe('the served locale', () => {
  it('reads a published locale from the route segment', async () => {
    await expect(readLocale(Promise.resolve({ locale: 'es' }))).resolves.toBe('es');
    await expect(readLocale(Promise.resolve({ locale: 'en' }))).resolves.toBe('en');
  });

  it('refuses an unknown segment instead of falling back to English', async () => {
    // The segment is attacker-controlled. Serving English under `/de/pricing`
    // would invent a third address for a page that already has two.
    await expect(readLocale(Promise.resolve({ locale: 'de' }))).rejects.toThrow(/404/);
    await expect(readLocale(Promise.resolve({ locale: '../en' }))).rejects.toThrow(/404/);
  });
});

describe('the language of a legal instrument', () => {
  it('is the instrument’s own, not the page’s', () => {
    // Rendering "Civil Code, art. 22.1" to an English reader is not a
    // translation but a mis-citation: it names an instrument that does not
    // exist under that title.
    const spanish: Citation = {
      id: 'es-cc-art-22-1',
      kind: 'statute',
      instrument: 'Código Civil (España)',
      provision: 'art. 22.1',
      jurisdiction: 'ES',
      verifiedOn: isoDate('2026-07-25'),
    };

    expect(instrumentLang(spanish)).toBe('es');
  });

  it('declines to answer rather than guessing', () => {
    // An unmarked run inherits the document language and makes no claim; a
    // confidently wrong `lang` mispronounces a statute.
    const international: Citation = {
      id: 'icao-doc-9303-p3',
      kind: 'official_guidance',
      instrument: 'ICAO Doc 9303',
      jurisdiction: 'INT',
      verifiedOn: isoDate('2026-07-25'),
    };

    expect(instrumentLang(international)).toBeNull();
  });
});
