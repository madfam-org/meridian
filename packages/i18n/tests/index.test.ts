import { describe, expect, it } from 'vitest';
import * as i18n from '../src/index.js';

/**
 * The package's only public surface is `src/index.ts`, and the apps import the
 * emitted JavaScript. A symbol that exists in a module but was never re-exported
 * compiles fine here and fails in three apps at once, so the surface is asserted
 * rather than assumed.
 */
describe('the public surface', () => {
  it('exports every function the apps resolve against', () => {
    const expected = [
      'isLocale',
      'parseLocale',
      'otherLocale',
      'htmlLang',
      'pick',
      'resolveText',
      'missingHalves',
      'isComplete',
      'parseAcceptLanguage',
      'negotiateLocale',
      'splitLocalePath',
      'localizedPath',
      'alternatePaths',
      'instrumentLang',
      'instrumentLanguagePolicy',
      'isInstrumentLanguageCertain',
    ] as const;

    for (const name of expected) {
      expect(typeof i18n[name], name).toBe('function');
    }
  });

  it('exports every constant the apps resolve against', () => {
    expect(i18n.DEFAULT_LOCALE).toBe('en');
    expect(i18n.LOCALES).toEqual(['en', 'es']);
    expect(i18n.LANG_ATTR).toEqual({ en: 'en', es: 'es' });
    expect(i18n.LOCALE_ENDONYM.es).toBe('Español');
    expect(i18n.LOCALE_PREFIX).toEqual({ en: '', es: '/es' });
    expect(Object.keys(i18n.INSTRUMENT_LANGUAGES).length).toBeGreaterThan(0);
  });
});

describe('the pieces used together', () => {
  it('resolves a request with no URL locale into a page and its alternates', () => {
    const locale = i18n.negotiateLocale('es-MX,es;q=0.9,en;q=0.8');
    expect(locale).toBe('es');
    expect(i18n.localizedPath('/pricing', locale)).toBe('/es/pricing');
    expect(i18n.htmlLang(locale)).toBe('es');
    expect(i18n.alternatePaths('/es/pricing')).toEqual({
      en: '/pricing',
      es: '/es/pricing',
      'x-default': '/pricing',
    });
  });

  it('renders a Spanish page whose citation stays in the instrument’s own language', () => {
    const locale = i18n.parseLocale('es');
    expect(locale).toBe('es');

    const explanation = {
      en: 'Two years of legal residence, for nationals of the listed states by origin.',
      es: 'Dos años de residencia legal, para nacionales de origen de los Estados enumerados.',
    };
    const prose = i18n.resolveText(explanation, 'es');
    expect(prose.value).toBe(explanation.es);
    expect(prose.lang).toBe('es');

    // The instrument name is not translated and not marked as page language.
    const citation = { instrument: 'Immigration and Refugee Protection Act', jurisdiction: 'CA' };
    expect(i18n.instrumentLang(citation)).toBe('en');
  });
});
