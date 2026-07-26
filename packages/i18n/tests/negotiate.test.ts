import { describe, expect, it } from 'vitest';
import { negotiateLocale, parseAcceptLanguage } from '../src/negotiate.js';

describe('parseAcceptLanguage', () => {
  it('defaults an absent q to 1', () => {
    expect(parseAcceptLanguage('es')).toEqual([{ range: 'es', quality: 1 }]);
  });

  it('orders by quality, best first', () => {
    expect(parseAcceptLanguage('en;q=0.3,es;q=0.9,fr;q=0.6')).toEqual([
      { range: 'es', quality: 0.9 },
      { range: 'fr', quality: 0.6 },
      { range: 'en', quality: 0.3 },
    ]);
  });

  it('keeps the client order for equal quality, so `es,en` differs from `en,es`', () => {
    expect(parseAcceptLanguage('es,en').map((r) => r.range)).toEqual(['es', 'en']);
    expect(parseAcceptLanguage('en,es').map((r) => r.range)).toEqual(['en', 'es']);
  });

  it('tolerates the whitespace real browsers send', () => {
    expect(parseAcceptLanguage('  es-MX , es ; q=0.9 ,en;q=0.8 ')).toEqual([
      { range: 'es-mx', quality: 1 },
      { range: 'es', quality: 0.9 },
      { range: 'en', quality: 0.8 },
    ]);
  });

  it('lowercases ranges so matching does not have to care', () => {
    expect(parseAcceptLanguage('ES-mx').map((r) => r.range)).toEqual(['es-mx']);
  });

  it('keeps the wildcard as a range', () => {
    expect(parseAcceptLanguage('*;q=0.5')).toEqual([{ range: '*', quality: 0.5 }]);
  });

  it('keeps q=0, which is a refusal rather than an absence', () => {
    expect(parseAcceptLanguage('en;q=0')).toEqual([{ range: 'en', quality: 0 }]);
  });

  it('returns nothing for an empty or absent header', () => {
    expect(parseAcceptLanguage('')).toEqual([]);
    expect(parseAcceptLanguage('   ')).toEqual([]);
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage(undefined)).toEqual([]);
  });

  it('drops malformed entries and keeps the rest of the header', () => {
    expect(parseAcceptLanguage(',,es,,')).toEqual([{ range: 'es', quality: 1 }]);
    expect(parseAcceptLanguage('not a language,es').map((r) => r.range)).toEqual(['es']);
    expect(parseAcceptLanguage('es_MX,en').map((r) => r.range)).toEqual(['en']);
    expect(parseAcceptLanguage('toolongsubtag,en').map((r) => r.range)).toEqual(['en']);
  });

  it('drops an entry whose q it cannot read, rather than promoting it to 1', () => {
    expect(parseAcceptLanguage('en;q=abc,es').map((r) => r.range)).toEqual(['es']);
    expect(parseAcceptLanguage('en;q=,es').map((r) => r.range)).toEqual(['es']);
    expect(parseAcceptLanguage('en;q=2,es').map((r) => r.range)).toEqual(['es']);
    expect(parseAcceptLanguage('en;q=0.1234,es').map((r) => r.range)).toEqual(['es']);
  });

  it('ignores parameters that are not q', () => {
    expect(parseAcceptLanguage('es;charset=utf-8;q=0.5')).toEqual([{ range: 'es', quality: 0.5 }]);
  });

  it('survives a header of pure punctuation', () => {
    expect(parseAcceptLanguage(';;;')).toEqual([]);
    expect(parseAcceptLanguage('=,;q=0.5')).toEqual([]);
  });
});

describe('negotiateLocale', () => {
  it('picks the highest-quality supported language', () => {
    expect(negotiateLocale('es;q=0.9,en;q=0.8')).toBe('es');
    expect(negotiateLocale('en;q=0.9,es;q=0.8')).toBe('en');
  });

  it('matches a regional variant to its base locale', () => {
    expect(negotiateLocale('es-MX')).toBe('es');
    expect(negotiateLocale('es-419,en;q=0.5')).toBe('es');
    expect(negotiateLocale('en-GB')).toBe('en');
  });

  it('does not match a locale to an unrelated range with a shared prefix', () => {
    // `est` (Estonian) is not Spanish; prefix matching must be on subtag
    // boundaries. Falls through to the default.
    expect(negotiateLocale('est')).toBe('en');
  });

  it('skips languages it cannot serve and takes the next best', () => {
    expect(negotiateLocale('de;q=0.9,fr;q=0.8,es;q=0.7')).toBe('es');
  });

  it('falls back to the default when nothing matches', () => {
    expect(negotiateLocale('de,fr,ja')).toBe('en');
  });

  it('falls back to the default for an empty or absent header', () => {
    expect(negotiateLocale('')).toBe('en');
    expect(negotiateLocale(null)).toBe('en');
    expect(negotiateLocale(undefined)).toBe('en');
    expect(negotiateLocale('   ')).toBe('en');
  });

  it('falls back to the default for a header it cannot parse at all', () => {
    expect(negotiateLocale(';;;')).toBe('en');
    expect(negotiateLocale('%%%,###')).toBe('en');
  });

  it('resolves a quality tie by the order the client sent', () => {
    expect(negotiateLocale('es;q=0.5,en;q=0.5')).toBe('es');
    expect(negotiateLocale('en;q=0.5,es;q=0.5')).toBe('en');
  });

  it('reads a bare wildcard as no preference', () => {
    expect(negotiateLocale('*')).toBe('en');
  });

  it('honours q=0 as a refusal', () => {
    // "anything but English" must not be answered with English.
    expect(negotiateLocale('en;q=0,*')).toBe('es');
  });

  it('honours a refusal even when the header offers nothing positive', () => {
    expect(negotiateLocale('en;q=0')).toBe('es');
  });

  it('lets an explicit entry beat a wildcard refusal', () => {
    // `*;q=0, es;q=0.5` is the standard way to say "Spanish only".
    expect(negotiateLocale('*;q=0,es;q=0.5')).toBe('es');
  });

  it('refuses a base locale via a refused regional range', () => {
    expect(negotiateLocale('en-GB;q=0,*')).toBe('es');
  });

  it('returns the fallback when every locale is refused', () => {
    expect(negotiateLocale('en;q=0,es;q=0')).toBe('en');
  });

  it('honours a restricted supported set', () => {
    expect(negotiateLocale('es,en', { supported: ['en'] })).toBe('en');
    expect(negotiateLocale('en,es', { supported: ['es'] })).toBe('es');
  });

  it('honours an overridden fallback', () => {
    expect(negotiateLocale('de', { fallback: 'es' })).toBe('es');
    expect(negotiateLocale(null, { fallback: 'es' })).toBe('es');
  });

  it('returns the fallback when nothing at all is supported', () => {
    expect(negotiateLocale('es', { supported: [], fallback: 'en' })).toBe('en');
  });

  it('reads a real Chrome header', () => {
    expect(negotiateLocale('es-419,es;q=0.9,en;q=0.8,en-US;q=0.7')).toBe('es');
    expect(negotiateLocale('en-US,en;q=0.9,es;q=0.8')).toBe('en');
  });
});
