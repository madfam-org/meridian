import { describe, expect, it } from 'vitest';
import type { LocalizedText, PartialLocalizedText } from '../src/text.js';
import { isComplete, missingHalves, pick, resolveText } from '../src/text.js';

/** The shape the catalog emits: mutable, non-optional, both halves non-empty. */
const catalogValue: { en: string; es: string } = {
  en: 'Continuous residence',
  es: 'Residencia continuada',
};

describe('pick', () => {
  it('returns the requested half', () => {
    expect(pick(catalogValue, 'en')).toBe('Continuous residence');
    expect(pick(catalogValue, 'es')).toBe('Residencia continuada');
  });

  it('accepts a catalog value with no adaptation', () => {
    // The compile-time half of the claim in the module doc: a mutable
    // `{ en: string; es: string }` satisfies the readonly interface.
    const asLocalized: LocalizedText = catalogValue;
    expect(pick(asLocalized, 'es')).toBe('Residencia continuada');
  });
});

describe('resolveText when the data is sound', () => {
  it('returns the requested half and reports no defect', () => {
    const resolved = resolveText(catalogValue, 'es');
    expect(resolved.value).toBe('Residencia continuada');
    expect(resolved.lang).toBe('es');
    expect(resolved.requested).toBe('es');
    expect(resolved.defect).toBeNull();
  });

  it('does not trim the value it returns', () => {
    const resolved = resolveText({ en: '  spaced  ', es: 'x' }, 'en');
    expect(resolved.value).toBe('  spaced  ');
    expect(resolved.defect).toBeNull();
  });
});

describe('resolveText when a half is missing', () => {
  it('reports `missing` when the key is absent', () => {
    const partial: PartialLocalizedText = { en: 'Only English' };
    const resolved = resolveText(partial, 'es');
    expect(resolved.defect).toBe('missing');
  });

  it('reports `missing` when the half is null', () => {
    const resolved = resolveText({ en: 'Only English', es: null }, 'es');
    expect(resolved.defect).toBe('missing');
  });

  it('falls back visibly, marked with the language it actually fell back to', () => {
    // The whole point: an English sentence a Spanish reader can see, tagged
    // `en` so it is pronounced as English, beats a blank element.
    const resolved = resolveText({ en: 'Only English' }, 'es');
    expect(resolved.value).toBe('Only English');
    expect(resolved.lang).toBe('en');
    expect(resolved.requested).toBe('es');
  });

  it('falls back in the other direction too', () => {
    const resolved = resolveText({ es: 'Solo español' }, 'en');
    expect(resolved.value).toBe('Solo español');
    expect(resolved.lang).toBe('es');
    expect(resolved.defect).toBe('missing');
  });
});

describe('resolveText when a half is present but blank', () => {
  it('distinguishes an empty string from an absent key', () => {
    expect(resolveText({ en: 'x', es: '' }, 'es').defect).toBe('empty');
    expect(resolveText({ en: 'x' }, 'es').defect).toBe('missing');
  });

  it('treats whitespace as empty', () => {
    const resolved = resolveText({ en: 'x', es: '   \n\t ' }, 'es');
    expect(resolved.defect).toBe('empty');
    expect(resolved.value).toBe('x');
    expect(resolved.lang).toBe('en');
  });
});

describe('resolveText when nothing is usable', () => {
  it('reports `unavailable` rather than inventing content', () => {
    const resolved = resolveText({ en: '', es: '  ' }, 'en');
    expect(resolved.defect).toBe('unavailable');
    expect(resolved.value).toBe('');
    expect(resolved.lang).toBe('en');
  });

  it('handles null and undefined records without throwing', () => {
    expect(resolveText(null, 'en').defect).toBe('unavailable');
    expect(resolveText(undefined, 'es').defect).toBe('unavailable');
    expect(resolveText({}, 'en').defect).toBe('unavailable');
  });
});

describe('missingHalves and isComplete', () => {
  it('says nothing is missing from a complete record', () => {
    expect(missingHalves(catalogValue)).toEqual([]);
    expect(isComplete(catalogValue)).toBe(true);
  });

  it('names each unusable half in canonical order', () => {
    expect(missingHalves({ es: 'Solo español' })).toEqual(['en']);
    expect(missingHalves({ en: 'x', es: '  ' })).toEqual(['es']);
    expect(missingHalves({ en: '', es: null })).toEqual(['en', 'es']);
  });

  it('treats an absent record as entirely missing', () => {
    expect(missingHalves(null)).toEqual(['en', 'es']);
    expect(isComplete(undefined)).toBe(false);
  });
});
