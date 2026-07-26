import { describe, expect, it } from 'vitest';
import { LOCALES } from '../src/locale.js';
import { LOCALE_PREFIX, alternatePaths, localizedPath, splitLocalePath } from '../src/path.js';

describe('the prefix table', () => {
  it('gives the default locale the bare paths and every other locale a prefix', () => {
    expect(LOCALE_PREFIX.en).toBe('');
    expect(LOCALE_PREFIX.es).toBe('/es');
  });

  it('covers every locale', () => {
    for (const locale of LOCALES) {
      expect(typeof LOCALE_PREFIX[locale]).toBe('string');
    }
  });
});

describe('splitLocalePath: reading the locale out', () => {
  it('reads an unprefixed path as the default locale, not declared', () => {
    expect(splitLocalePath('/pricing')).toEqual({
      locale: 'en',
      explicit: false,
      path: '/pricing',
      suffix: '',
    });
  });

  it('reads a prefixed path as declared', () => {
    expect(splitLocalePath('/es/pricing')).toEqual({
      locale: 'es',
      explicit: true,
      path: '/pricing',
      suffix: '',
    });
  });

  it('reduces the localised root to `/`, never to an empty string', () => {
    // An empty href reloads the current page: a switcher that appears dead.
    expect(splitLocalePath('/es')).toEqual({
      locale: 'es',
      explicit: true,
      path: '/',
      suffix: '',
    });
  });

  it('reads the bare root', () => {
    expect(splitLocalePath('/')).toEqual({
      locale: 'en',
      explicit: false,
      path: '/',
      suffix: '',
    });
  });

  it('does not mistake a path that merely starts with the prefix letters', () => {
    // The single most likely hand-rolled bug: `startsWith('/es')`.
    expect(splitLocalePath('/estimate').locale).toBe('en');
    expect(splitLocalePath('/estimate').path).toBe('/estimate');
    expect(splitLocalePath('/escalation').explicit).toBe(false);
    expect(splitLocalePath('/es-mx/pricing').locale).toBe('en');
    expect(splitLocalePath('/espanol').locale).toBe('en');
  });

  it('does not treat `/en` as a locale prefix, because English is unprefixed', () => {
    // Recognising it would publish every English page at two addresses.
    expect(splitLocalePath('/en/pricing')).toEqual({
      locale: 'en',
      explicit: false,
      path: '/en/pricing',
      suffix: '',
    });
  });

  it('is case-sensitive, so `/ES` is not a Spanish URL', () => {
    expect(splitLocalePath('/ES/pricing').locale).toBe('en');
    expect(splitLocalePath('/ES/pricing').path).toBe('/ES/pricing');
  });
});

describe('splitLocalePath: normalisation', () => {
  it('strips a trailing slash', () => {
    expect(splitLocalePath('/pricing/').path).toBe('/pricing');
    expect(splitLocalePath('/es/pricing/').path).toBe('/pricing');
  });

  it('reduces a trailing-slash localised root to `/`', () => {
    expect(splitLocalePath('/es/')).toEqual({
      locale: 'es',
      explicit: true,
      path: '/',
      suffix: '',
    });
  });

  it('collapses repeated and trailing slashes', () => {
    expect(splitLocalePath('//es//pricing///').path).toBe('/pricing');
    expect(splitLocalePath('//es//pricing///').locale).toBe('es');
  });

  it('accepts a path with no leading slash', () => {
    expect(splitLocalePath('pricing').path).toBe('/pricing');
    expect(splitLocalePath('es/pricing').locale).toBe('es');
  });

  it('treats an empty path as the root', () => {
    expect(splitLocalePath('').path).toBe('/');
    expect(splitLocalePath('').locale).toBe('en');
  });
});

describe('splitLocalePath: query strings and fragments', () => {
  it('separates the query from the path', () => {
    expect(splitLocalePath('/es/pricing?plan=annual')).toEqual({
      locale: 'es',
      explicit: true,
      path: '/pricing',
      suffix: '?plan=annual',
    });
  });

  it('separates a fragment', () => {
    expect(splitLocalePath('/pricing#fees').suffix).toBe('#fees');
    expect(splitLocalePath('/pricing#fees').path).toBe('/pricing');
  });

  it('keeps a query and fragment together, in order', () => {
    expect(splitLocalePath('/es/pricing?plan=annual#fees').suffix).toBe('?plan=annual#fees');
  });

  it('does not confuse a slash inside the query with a path segment', () => {
    const split = splitLocalePath('/pricing?next=/es/matters');
    expect(split.path).toBe('/pricing');
    expect(split.suffix).toBe('?next=/es/matters');
    expect(split.locale).toBe('en');
  });

  it('handles a query on the root', () => {
    expect(splitLocalePath('/?ref=x')).toEqual({
      locale: 'en',
      explicit: false,
      path: '/',
      suffix: '?ref=x',
    });
  });
});

describe('localizedPath: adding a locale', () => {
  it('prefixes an English path', () => {
    expect(localizedPath('/pricing', 'es')).toBe('/es/pricing');
  });

  it('prefixes the root without leaving a trailing slash', () => {
    expect(localizedPath('/', 'es')).toBe('/es');
    expect(localizedPath('', 'es')).toBe('/es');
  });

  it('prefixes a deep path', () => {
    expect(localizedPath('/matters/abc/documents', 'es')).toBe('/es/matters/abc/documents');
  });
});

describe('localizedPath: removing a locale', () => {
  it('unprefixes a Spanish path', () => {
    expect(localizedPath('/es/pricing', 'en')).toBe('/pricing');
  });

  it('returns the root as `/`, not as an empty string', () => {
    expect(localizedPath('/es', 'en')).toBe('/');
    expect(localizedPath('/es/', 'en')).toBe('/');
  });
});

describe('localizedPath: already in the target locale', () => {
  it('is idempotent for Spanish', () => {
    expect(localizedPath('/es/pricing', 'es')).toBe('/es/pricing');
    expect(localizedPath(localizedPath('/pricing', 'es'), 'es')).toBe('/es/pricing');
  });

  it('is idempotent for English', () => {
    expect(localizedPath('/pricing', 'en')).toBe('/pricing');
    expect(localizedPath('/', 'en')).toBe('/');
  });

  it('never stacks prefixes', () => {
    expect(localizedPath(localizedPath(localizedPath('/x', 'es'), 'es'), 'es')).toBe('/es/x');
  });

  it('round-trips through the other locale and back', () => {
    for (const path of ['/', '/pricing', '/matters/abc', '/estimate']) {
      expect(localizedPath(localizedPath(path, 'es'), 'en')).toBe(path);
    }
  });
});

describe('localizedPath: query strings', () => {
  it('carries the query across a locale change', () => {
    // Losing it means losing the reader's filters and form state.
    expect(localizedPath('/pricing?plan=annual', 'es')).toBe('/es/pricing?plan=annual');
    expect(localizedPath('/es/pricing?plan=annual', 'en')).toBe('/pricing?plan=annual');
  });

  it('carries a fragment across', () => {
    expect(localizedPath('/pricing#fees', 'es')).toBe('/es/pricing#fees');
    expect(localizedPath('/es/pricing?a=1#fees', 'en')).toBe('/pricing?a=1#fees');
  });

  it('keeps a query on the root', () => {
    expect(localizedPath('/?ref=x', 'es')).toBe('/es?ref=x');
    expect(localizedPath('/es?ref=x', 'en')).toBe('/?ref=x');
  });

  it('leaves a query value that looks like a locale path alone', () => {
    expect(localizedPath('/pricing?next=/es/matters', 'es')).toBe('/es/pricing?next=/es/matters');
  });
});

describe('localizedPath: normalisation', () => {
  it('canonicalises trailing slashes rather than emitting a pre-redirect URL', () => {
    expect(localizedPath('/pricing/', 'es')).toBe('/es/pricing');
    expect(localizedPath('/es/pricing/', 'en')).toBe('/pricing');
  });
});

describe('alternatePaths', () => {
  it('lists both locales and an x-default pointing at the default', () => {
    expect(alternatePaths('/pricing')).toEqual({
      en: '/pricing',
      es: '/es/pricing',
      'x-default': '/pricing',
    });
  });

  it('gives the same set whichever locale the page was requested in', () => {
    expect(alternatePaths('/es/pricing')).toEqual(alternatePaths('/pricing'));
  });

  it('handles the root', () => {
    expect(alternatePaths('/')).toEqual({ en: '/', es: '/es', 'x-default': '/' });
    expect(alternatePaths('/es')).toEqual({ en: '/', es: '/es', 'x-default': '/' });
  });

  it('drops the query, because hreflang describes documents rather than requests', () => {
    expect(alternatePaths('/pricing?ref=x')).toEqual({
      en: '/pricing',
      es: '/es/pricing',
      'x-default': '/pricing',
    });
  });

  it('covers every locale', () => {
    const alternates = alternatePaths('/pricing');
    for (const locale of LOCALES) {
      expect(alternates[locale]).toBe(localizedPath('/pricing', locale));
    }
  });
});
