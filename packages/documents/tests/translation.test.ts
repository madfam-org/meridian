import { describe, expect, it } from 'vitest';
import type { CountryCode } from '@meridian/core';
import {
  BASQUE,
  CASTILIAN,
  CATALAN,
  ENGLISH,
  GALICIAN,
  OCCITAN,
  languageAccepted,
  languageTag,
  primaryLanguage,
  sameLanguage,
} from '../src/language.js';
import {
  SPAIN_CO_OFFICIAL_ZONES,
  TRANSLATION_PROFILES,
  coOfficialZone,
  translationProfile,
  translationRequirement,
  translationSatisfied,
} from '../src/translation.js';
import { untranslated, type DocumentTranslation } from '../src/model.js';

const c = (s: string): CountryCode => s as CountryCode;

describe('language tag normalisation', () => {
  it('compares on the primary subtag so es-MX is Spanish', () => {
    expect(primaryLanguage(languageTag('es-MX'))).toBe('es');
    expect(sameLanguage(languageTag('es-MX'), CASTILIAN)).toBe(true);
    expect(sameLanguage(languageTag('ca-valencia'), CATALAN)).toBe(true);
    expect(sameLanguage(languageTag('en-CA'), languageTag('en-GB'))).toBe(true);
    expect(sameLanguage(CASTILIAN, CATALAN)).toBe(false);
  });

  it('handles an empty accepted set without claiming acceptance', () => {
    expect(languageAccepted(CASTILIAN, [])).toBe(false);
  });
});

describe('Spain: traductor jurado', () => {
  it('requires a sworn translator for an English-language document', () => {
    const r = translationRequirement({
      documentKind: 'criminal_record',
      documentLanguage: ENGLISH,
      receivingCountry: c('ES'),
    });
    expect(r.required).toBe(true);
    expect(r.acceptedStandards).toEqual(['sworn_traductor_jurado']);
    expect(r.rationale).toContain('traductor-intérprete jurado');
    expect(r.citations.map((x) => x.id)).toContain('es-rd-724-2020-traductor-jurado');
  });

  it('does not ask for a translation of a document already in Castilian', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CASTILIAN,
      receivingCountry: c('ES'),
    });
    expect(r.required).toBe(false);
    expect(r.acceptedStandards).toEqual(['none']);
    expect(r.requiresVerification).toBe(false);
  });

  it('does not mistake a Mexican Spanish document for a foreign-language one', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: languageTag('es-MX'),
      receivingCountry: c('ES'),
    });
    expect(r.required).toBe(false);
  });

  it('is satisfied only by a sworn translation into an accepted language', () => {
    const requirement = translationRequirement({
      documentKind: 'criminal_record',
      documentLanguage: ENGLISH,
      receivingCountry: c('ES'),
    });
    const sworn: DocumentTranslation = {
      sourceLanguage: ENGLISH,
      intoLanguage: CASTILIAN,
      standard: 'sworn_traductor_jurado',
    };
    expect(translationSatisfied(requirement, sworn)).toBe(true);
    expect(
      translationSatisfied(requirement, { ...sworn, standard: 'translator_certification' }),
    ).toBe(false);
    expect(translationSatisfied(requirement, { ...sworn, intoLanguage: languageTag('pt') })).toBe(
      false,
    );
    expect(translationSatisfied(requirement, untranslated(ENGLISH))).toBe(false);
    expect(translationSatisfied(requirement, { sourceLanguage: ENGLISH, intoLanguage: CASTILIAN })).toBe(
      false,
    );
  });
});

describe('Spain: co-official languages', () => {
  it('treats Catalan as foreign when the receiving organ is not identified', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CATALAN,
      receivingCountry: c('ES'),
    });
    expect(r.required).toBe(true);
    expect(r.acceptedLanguages).toEqual([CASTILIAN]);
  });

  it('accepts Catalan before an organ sitting in Catalonia, with the Ley 39/2015 caveat flagged', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CATALAN,
      receivingCountry: c('ES'),
      receivingRegion: 'ES-CT',
    });
    expect(r.required).toBe(false);
    expect(r.requiresVerification).toBe(true);
    expect(r.rationale).toContain('outside the Community');
    expect(r.citations.map((x) => x.id)).toContain('es-ley-39-2015-art-15');
  });

  it('accepts Valencian under the Catalan tag', () => {
    const r = translationRequirement({
      documentKind: 'marriage_certificate',
      documentLanguage: languageTag('ca-valencia'),
      receivingCountry: c('ES'),
      receivingRegion: 'ES-VC',
    });
    expect(r.required).toBe(false);
  });

  it('accepts Aranese Occitan only in Catalonia', () => {
    const inAran = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: OCCITAN,
      receivingCountry: c('ES'),
      receivingRegion: 'ES-CT',
    });
    expect(inAran.required).toBe(false);

    const elsewhere = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: OCCITAN,
      receivingCountry: c('ES'),
      receivingRegion: 'ES-GA',
    });
    expect(elsewhere.required).toBe(true);
  });

  it('warns that Basque is only co-official in part of Navarre', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: BASQUE,
      receivingCountry: c('ES'),
      receivingRegion: 'ES-NC',
    });
    expect(r.required).toBe(false);
    expect(r.requiresVerification).toBe(true);
    expect(r.rationale).toContain('official only in part');
  });

  it('does not warn about territorial limits in the País Vasco', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: BASQUE,
      receivingCountry: c('ES'),
      receivingRegion: 'ES-PV',
    });
    expect(r.required).toBe(false);
    expect(r.rationale).not.toContain('official only in part');
  });

  it('does not accept Galician outside Galicia', () => {
    expect(
      translationRequirement({
        documentKind: 'birth_certificate',
        documentLanguage: GALICIAN,
        receivingCountry: c('ES'),
        receivingRegion: 'ES-PV',
      }).required,
    ).toBe(true);
    expect(
      translationRequirement({
        documentKind: 'birth_certificate',
        documentLanguage: GALICIAN,
        receivingCountry: c('ES'),
        receivingRegion: 'ES-GA',
      }).required,
    ).toBe(false);
  });

  it('ignores an unknown or malformed region code rather than inventing a zone', () => {
    expect(coOfficialZone('ES-ZZ')).toBeNull();
    expect(coOfficialZone('')).toBeNull();
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CATALAN,
      receivingCountry: c('ES'),
      receivingRegion: 'ES-ZZ',
    });
    expect(r.required).toBe(true);
  });

  it('accepts region codes case-insensitively', () => {
    expect(coOfficialZone('es-ct')?.regionCode).toBe('ES-CT');
  });

  it('marks every co-official entry discretionary, since none pins an article', () => {
    for (const zone of SPAIN_CO_OFFICIAL_ZONES) {
      expect(zone.citation.discretionary).toBe(true);
      expect(zone.citation.note).toBeTruthy();
    }
  });
});

describe('other receiving jurisdictions', () => {
  it('accepts either official language in Canada', () => {
    for (const tag of [ENGLISH, languageTag('fr-CA')]) {
      expect(
        translationRequirement({
          documentKind: 'criminal_record',
          documentLanguage: tag,
          receivingCountry: c('CA'),
        }).required,
      ).toBe(false);
    }
  });

  it('offers Canada both the certified translator and the affidavit route', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CASTILIAN,
      receivingCountry: c('CA'),
    });
    expect(r.required).toBe(true);
    expect(r.acceptedStandards).toEqual(['certified_translator', 'affidavit_translation']);
    const affidavit: DocumentTranslation = {
      sourceLanguage: CASTILIAN,
      intoLanguage: ENGLISH,
      standard: 'affidavit_translation',
    };
    expect(translationSatisfied(r, affidavit)).toBe(true);
  });

  it("accepts the translator's own certification in the United States", () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CASTILIAN,
      receivingCountry: c('US'),
    });
    expect(r.acceptedStandards).toEqual(['translator_certification']);
    expect(r.citations.map((x) => x.id)).toEqual(['us-8cfr-103-2-b-3']);
  });

  it('requires a perito traductor in Mexico', () => {
    const r = translationRequirement({
      documentKind: 'degree_certificate',
      documentLanguage: ENGLISH,
      receivingCountry: c('MX'),
    });
    expect(r.acceptedStandards).toEqual(['perito_traductor']);
  });
});

describe('receiving jurisdictions outside the catalog', () => {
  it('assumes a translation is needed and refuses to name a standard', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CASTILIAN,
      receivingCountry: c('JP'),
    });
    expect(r.required).toBe(true);
    expect(r.acceptedStandards).toEqual(['unknown']);
    expect(r.requiresVerification).toBe(true);
    expect(r.citations).toEqual([]);
  });

  it('is never satisfied while the standard is unknown', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: CASTILIAN,
      receivingCountry: c('JP'),
    });
    expect(
      translationSatisfied(r, {
        sourceLanguage: CASTILIAN,
        intoLanguage: languageTag('ja'),
        standard: 'sworn_traductor_jurado',
      }),
    ).toBe(false);
  });

  it('resolves profiles case-insensitively and only for catalogued countries', () => {
    expect(translationProfile('es' as CountryCode)?.country).toBe('ES');
    expect(translationProfile(c('JP'))).toBeNull();
    expect(TRANSLATION_PROFILES.length).toBe(4);
  });
});

describe('EU multilingual standard forms', () => {
  it('notes the form when a covered document moves between member states', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: languageTag('de'),
      receivingCountry: c('ES'),
      issuingCountry: c('DE'),
    });
    expect(r.required).toBe(true);
    expect(r.rationale).toContain('multilingual standard form');
    expect(r.requiresVerification).toBe(true);
  });

  it('does not note it for a document from outside the Union', () => {
    const r = translationRequirement({
      documentKind: 'birth_certificate',
      documentLanguage: ENGLISH,
      receivingCountry: c('ES'),
      issuingCountry: c('CA'),
    });
    expect(r.rationale).not.toContain('multilingual standard form');
  });

  it('does not note it for a kind the Regulation does not reach', () => {
    const r = translationRequirement({
      documentKind: 'degree_certificate',
      documentLanguage: languageTag('de'),
      receivingCountry: c('ES'),
      issuingCountry: c('DE'),
    });
    expect(r.rationale).not.toContain('multilingual standard form');
  });
});
