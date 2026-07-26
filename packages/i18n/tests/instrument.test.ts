import { describe, expect, it } from 'vitest';
import {
  INSTRUMENT_LANGUAGES,
  instrumentLang,
  instrumentLanguagePolicy,
  isInstrumentLanguageCertain,
} from '../src/instrument.js';

describe('instrumentLang from the jurisdiction', () => {
  it('marks a Spanish instrument as Spanish', () => {
    // "Código Civil (España)" — rendered verbatim on an English page, and
    // pronounced as Spanish because of this.
    expect(instrumentLang({ jurisdiction: 'ES' })).toBe('es');
  });

  it('marks a Canadian federal instrument as English', () => {
    expect(instrumentLang({ jurisdiction: 'CA' })).toBe('en');
  });

  it('marks a Québec instrument as French', () => {
    // "Loi sur l'immigration au Québec, RLRQ chapitre I-0.2.1" is neither of
    // the two UI languages, which is exactly why this is not a `Locale`.
    expect(instrumentLang({ jurisdiction: 'CA-QC' })).toBe('fr');
  });

  it('covers the blocs the catalog cites', () => {
    expect(instrumentLang({ jurisdiction: 'X-SCHENGEN' })).toBe('en');
    expect(instrumentLang({ jurisdiction: 'X-EU' })).toBe('en');
    expect(instrumentLang({ jurisdiction: 'X-HCCH' })).toBe('en');
  });

  it('is independent of the reader’s locale, by having no locale parameter', () => {
    // One call site, one answer, whichever language the page is in.
    expect(instrumentLang({ jurisdiction: 'ES' })).toBe('es');
    expect(instrumentLang({ jurisdiction: 'US' })).toBe('en');
  });
});

describe('instrumentLang when it does not know', () => {
  it('returns null for an unlisted jurisdiction rather than guessing English', () => {
    expect(instrumentLang({ jurisdiction: 'INT' })).toBeNull();
    expect(instrumentLang({ jurisdiction: 'JP' })).toBeNull();
  });

  it('returns null for an absent jurisdiction', () => {
    expect(instrumentLang({})).toBeNull();
    expect(instrumentLang({ jurisdiction: null })).toBeNull();
    expect(instrumentLang({ jurisdiction: '' })).toBeNull();
    expect(instrumentLang({ jurisdiction: '   ' })).toBeNull();
  });
});

describe('an explicit language on the citation', () => {
  it('wins over the jurisdiction default', () => {
    // The escape hatch for the Canada–Québec Accord, cited under its English title.
    expect(instrumentLang({ jurisdiction: 'CA-QC', language: 'en' })).toBe('en');
    expect(instrumentLang({ jurisdiction: 'CA', language: 'fr' })).toBe('fr');
  });

  it('works with no jurisdiction at all', () => {
    expect(instrumentLang({ language: 'pt' })).toBe('pt');
  });

  it('normalises the primary subtag and leaves the rest as authored', () => {
    expect(instrumentLang({ language: 'ES' })).toBe('es');
    expect(instrumentLang({ language: '  fr-CA  ' })).toBe('fr-CA');
  });

  it('ignores a value that is not a language tag and falls back to the jurisdiction', () => {
    expect(instrumentLang({ jurisdiction: 'ES', language: 'Spanish' })).toBe('es');
    expect(instrumentLang({ jurisdiction: 'ES', language: 'es_MX' })).toBe('es');
    expect(instrumentLang({ jurisdiction: 'ES', language: '' })).toBe('es');
  });
});

describe('jurisdiction code handling', () => {
  it('accepts sloppy casing and whitespace from seed data', () => {
    expect(instrumentLang({ jurisdiction: 'ca' })).toBe('en');
    expect(instrumentLang({ jurisdiction: ' ca-qc ' })).toBe('fr');
  });

  it('falls a subdivision back to its country', () => {
    // A province nobody has reviewed is still under the federal language rule.
    expect(instrumentLang({ jurisdiction: 'CA-ON' })).toBe('en');
  });

  it('prefers an exact subdivision entry over the country fallback', () => {
    expect(instrumentLang({ jurisdiction: 'CA' })).toBe('en');
    expect(instrumentLang({ jurisdiction: 'CA-QC' })).toBe('fr');
  });

  it('does not resolve an unknown bloc through the X namespace', () => {
    expect(instrumentLang({ jurisdiction: 'X-MERCOSUR' })).toBeNull();
  });
});

describe('instrumentLanguagePolicy', () => {
  it('reports the basis for every entry, so a reviewer can check it', () => {
    for (const [code, policy] of Object.entries(INSTRUMENT_LANGUAGES)) {
      expect(policy.defaultLanguage, code).toMatch(/^[a-z]{2,3}$/);
      expect(policy.basis.length, code).toBeGreaterThan(20);
    }
  });

  it('marks the multilingual jurisdictions as such', () => {
    expect(instrumentLanguagePolicy('CA')?.multilingual).toBe(true);
    expect(instrumentLanguagePolicy('CA-QC')?.multilingual).toBe(true);
    expect(instrumentLanguagePolicy('CA-NB')?.multilingual).toBe(true);
    expect(instrumentLanguagePolicy('X-EU')?.multilingual).toBe(true);
  });

  it('marks the single-language jurisdictions as such', () => {
    expect(instrumentLanguagePolicy('ES')?.multilingual).toBe(false);
    expect(instrumentLanguagePolicy('MX')?.multilingual).toBe(false);
    expect(instrumentLanguagePolicy('US')?.multilingual).toBe(false);
  });

  it('returns null for an unknown jurisdiction', () => {
    expect(instrumentLanguagePolicy('ZZ')).toBeNull();
    expect(instrumentLanguagePolicy(null)).toBeNull();
    expect(instrumentLanguagePolicy(undefined)).toBeNull();
  });
});

describe('isInstrumentLanguageCertain', () => {
  it('is true when the jurisdiction enacts in one language', () => {
    expect(isInstrumentLanguageCertain({ jurisdiction: 'ES' })).toBe(true);
    expect(isInstrumentLanguageCertain({ jurisdiction: 'MX' })).toBe(true);
  });

  it('is false when the jurisdiction is bilingual and the citation is silent', () => {
    // These are the citations the review console should ask an author about.
    expect(isInstrumentLanguageCertain({ jurisdiction: 'CA' })).toBe(false);
    expect(isInstrumentLanguageCertain({ jurisdiction: 'CA-QC' })).toBe(false);
  });

  it('is true once the citation states its language', () => {
    expect(isInstrumentLanguageCertain({ jurisdiction: 'CA', language: 'en' })).toBe(true);
    expect(isInstrumentLanguageCertain({ jurisdiction: 'CA-QC', language: 'fr' })).toBe(true);
  });

  it('is false for an unknown jurisdiction with no stated language', () => {
    expect(isInstrumentLanguageCertain({ jurisdiction: 'INT' })).toBe(false);
    expect(isInstrumentLanguageCertain({})).toBe(false);
  });

  it('is false when the stated language is not a language tag', () => {
    expect(isInstrumentLanguageCertain({ jurisdiction: 'CA', language: 'English' })).toBe(false);
  });
});
