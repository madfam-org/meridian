import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LANG_ATTR,
  LOCALES,
  LOCALE_ENDONYM,
  htmlLang,
  isLocale,
  otherLocale,
  parseLocale,
} from '../src/locale.js';

describe('the locale set', () => {
  it('is exactly the two languages the platform serves, default first', () => {
    expect(LOCALES).toEqual(['en', 'es']);
    expect(LOCALES[0]).toBe(DEFAULT_LOCALE);
  });

  it('has a lang tag and an endonym for every locale', () => {
    for (const locale of LOCALES) {
      expect(LANG_ATTR[locale].length).toBeGreaterThan(0);
      expect(LOCALE_ENDONYM[locale].length).toBeGreaterThan(0);
    }
  });

  it('names each language in that language, not in English', () => {
    // A switcher labelled "Spanish" is useless to the reader who needs it.
    expect(LOCALE_ENDONYM.es).toBe('Español');
    expect(LOCALE_ENDONYM.en).toBe('English');
  });

  it('uses unqualified BCP 47 tags, claiming no region we did not author for', () => {
    expect(htmlLang('en')).toBe('en');
    expect(htmlLang('es')).toBe('es');
  });
});

describe('isLocale', () => {
  it('accepts the locales and nothing else', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('es')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('survives values that are not strings', () => {
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(0)).toBe(false);
    expect(isLocale({ toString: () => 'es' })).toBe(false);
  });
});

describe('parseLocale', () => {
  it('returns the locale for a known segment', () => {
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('es')).toBe('es');
  });

  it('returns null rather than throwing on anything else', () => {
    expect(parseLocale('fr')).toBeNull();
    expect(parseLocale('')).toBeNull();
    expect(parseLocale('pricing')).toBeNull();
    expect(parseLocale(null)).toBeNull();
    expect(parseLocale(undefined)).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(parseLocale('  es  ')).toBe('es');
  });

  it('refuses casing and region variants that would duplicate a URL', () => {
    // Accepting these would serve one Spanish page at /es, /ES and /es-MX.
    expect(parseLocale('ES')).toBeNull();
    expect(parseLocale('es-MX')).toBeNull();
    expect(parseLocale('en-GB')).toBeNull();
  });
});

describe('otherLocale', () => {
  it('is the switcher target', () => {
    expect(otherLocale('en')).toBe('es');
    expect(otherLocale('es')).toBe('en');
  });

  it('is its own inverse', () => {
    for (const locale of LOCALES) {
      expect(otherLocale(otherLocale(locale))).toBe(locale);
    }
  });

  it('is only defined while exactly two locales ship', () => {
    // Guards the assumption rather than documenting it: a third locale must
    // fail loudly here, not silently drop a language from the switcher.
    expect(LOCALES.length).toBe(2);
  });
});
