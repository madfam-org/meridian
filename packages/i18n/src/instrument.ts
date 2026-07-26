/**
 * The language a legal instrument's name is written in.
 *
 * **Instrument names and provisions are never translated.** This is the one
 * rule in this package with legal consequence, so it is stated plainly: a
 * `Citation` carries `instrument` and `provision` — "Código Civil (España)",
 * "art. 22.1", "Immigration and Refugee Protection Act", "s.91" — and those are
 * the *identity of the source*, not prose about it. Rendering "Civil Code
 * art. 22.1" to an English reader is not a translation, it is a mis-citation:
 * it names an instrument that does not exist under that title, and a person who
 * tries to verify it — or a lawyer who tries to rely on it — will not find it.
 * The surrounding explanatory prose is translated normally; the name is not.
 *
 * That leaves a real accessibility problem, which is what this module solves.
 * A Spanish page that quotes "Immigration and Refugee Protection Act" in the
 * middle of a Spanish sentence will have a screen reader pronounce English
 * words with Spanish phonetics unless the element says otherwise. So the name
 * gets its own `lang`, matching the instrument rather than the page:
 *
 * ```tsx
 * <cite lang={instrumentLang(citation) ?? undefined}>{citation.instrument}</cite>
 * ```
 *
 * ## Where the language comes from, and where it is a convention
 *
 * `Citation` has no language field today, so the language is inferred from the
 * issuing jurisdiction. For Spain and Mexico that inference is a fact: those
 * states enact in one language. For Canada, Québec, New Brunswick, the EU and
 * the Hague Conference it is *not* — those bodies enact in two or more
 * languages, each text equally authoritative, and which one a given citation
 * used is a property of the string, not of the jurisdiction.
 *
 * Rather than pretend otherwise, each entry records whether it is multilingual
 * and what the default rests on. The default is the language this catalog
 * actually cites that jurisdiction in, which is right for the overwhelming
 * majority of its citations and wrong for the exceptions — Québec's catalog
 * entries are French titles except the Canada–Québec Accord, which is cited in
 * English. The fix for an exception is an explicit `language` on the citation,
 * which {@link instrumentLang} always prefers; {@link isInstrumentLanguageCertain}
 * exists so the review console can list the citations where that is worth
 * doing. A wrong `lang` mispronounces a name; it never alters it.
 *
 * A jurisdiction with no entry returns `null` — the caller omits `lang` and
 * makes no claim at all. Guessing "probably English" about an instrument nobody
 * has checked is exactly the kind of confident wrongness this codebase refuses
 * elsewhere.
 */

export interface InstrumentLanguagePolicy {
  /**
   * BCP 47 tag to mark an instrument name from this jurisdiction with, when the
   * citation itself does not say.
   */
  readonly defaultLanguage: string;
  /**
   * True when the jurisdiction enacts in more than one language. The default is
   * then a convention of this catalog rather than a property of the instrument,
   * and a citation using another of its languages needs an explicit one.
   */
  readonly multilingual: boolean;
  /** Where the default comes from, in a form a reviewer can check. */
  readonly basis: string;
}

/**
 * Keyed by the same jurisdiction codes `Citation.jurisdiction` uses: ISO 3166-1
 * alpha-2, ISO 3166-2 for subdivisions, and the `X-` bloc codes.
 *
 * Deliberately narrow — it covers the jurisdictions the shipped catalog
 * actually cites, and nothing else. An incomplete table that returns `null` is
 * safe; a table populated by guessing is not.
 */
export const INSTRUMENT_LANGUAGES: Readonly<Record<string, InstrumentLanguagePolicy>> = {
  ES: {
    defaultLanguage: 'es',
    multilingual: false,
    basis:
      'Spanish state legislation is enacted in castellano and the BOE text is the authentic one. ' +
      'Instruments of an autonomous community published in a co-official language need an explicit language.',
  },
  MX: {
    defaultLanguage: 'es',
    multilingual: false,
    basis: 'Mexican federal legislation is published in Spanish in the Diario Oficial de la Federación.',
  },
  US: {
    defaultLanguage: 'en',
    multilingual: false,
    basis: 'United States federal law is published in English in the Statutes at Large and the CFR.',
  },
  CA: {
    defaultLanguage: 'en',
    multilingual: true,
    basis:
      'Canadian federal instruments are enacted in English and French and both texts are equally ' +
      'authoritative. This catalog cites the English titles; a citation using the French title needs ' +
      'an explicit language.',
  },
  'CA-QC': {
    defaultLanguage: 'fr',
    multilingual: true,
    basis:
      'Québec enacts in French and English; the RLRQ titles this catalog cites are French. The ' +
      'Canada–Québec Accord is cited under its English title and needs an explicit language.',
  },
  'CA-NB': {
    defaultLanguage: 'en',
    multilingual: true,
    basis:
      'New Brunswick is constitutionally bilingual and publishes in English and French. The ' +
      'provincial nominee guidance this catalog cites is titled in English.',
  },
  'X-EU': {
    defaultLanguage: 'en',
    multilingual: true,
    basis:
      'EU instruments are authentic in every official language of the Union. This catalog cites the ' +
      'English text, which is the EUR-Lex language its URLs resolve to.',
  },
  'X-SCHENGEN': {
    defaultLanguage: 'en',
    multilingual: true,
    basis:
      'The Schengen Borders Code is an EU regulation, authentic in every official language. This ' +
      'catalog cites the English text.',
  },
  'X-HCCH': {
    defaultLanguage: 'en',
    multilingual: true,
    basis:
      'Hague Conference conventions are done in French and English, both authentic. This catalog ' +
      'cites the English text.',
  },
  'X-HAGUE': {
    defaultLanguage: 'en',
    multilingual: true,
    basis:
      'Hague Conference conventions are done in French and English, both authentic. This catalog ' +
      'cites the English text.',
  },
};

/**
 * The shape this module needs from a citation.
 *
 * Structural, so `Citation` from `@meridian/core` satisfies it without this
 * package depending on core — a leaf package is what keeps a client component
 * that renders one citation from dragging the whole catalog into the browser
 * bundle. `language` is here for the day a citation records its own; nothing
 * populates it yet.
 */
export interface InstrumentSource {
  /** BCP 47 tag of the text this citation quotes, when the author recorded one. */
  readonly language?: string | null;
  /** ISO 3166-1 alpha-2, ISO 3166-2, or an `X-` bloc code. */
  readonly jurisdiction?: string | null;
}

/** Loose BCP 47 shape: enough to reject `"english"` and `"es_MX"`, not a full validator. */
const LANGUAGE_TAG_RE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/;

/**
 * Normalise an authored tag: primary subtag lowercased, the rest left as
 * written. `ES` becomes `es`; `es-MX` stays `es-MX`.
 */
function normalizeTag(tag: string): string | null {
  const trimmed = tag.trim();
  if (!LANGUAGE_TAG_RE.test(trimmed)) return null;
  const [primary, ...rest] = trimmed.split('-');
  if (primary === undefined) return null;
  return [primary.toLowerCase(), ...rest].join('-');
}

/** Jurisdiction codes are uppercase; accept sloppy casing from seed data. */
function normalizeJurisdiction(jurisdiction: string | null | undefined): string | null {
  if (typeof jurisdiction !== 'string') return null;
  const trimmed = jurisdiction.trim().toUpperCase();
  return trimmed === '' ? null : trimmed;
}

/**
 * The policy for a jurisdiction, or `null` when there is none.
 *
 * A subdivision with no entry of its own falls back to its country — `CA-ON`
 * resolves through `CA` — because a province that has not been reviewed is
 * still governed by the federal language rule. Bloc codes have no country part
 * to fall back to and simply return `null` when unknown.
 */
export function instrumentLanguagePolicy(
  jurisdiction: string | null | undefined,
): InstrumentLanguagePolicy | null {
  const code = normalizeJurisdiction(jurisdiction);
  if (code === null) return null;

  const exact = INSTRUMENT_LANGUAGES[code];
  if (exact !== undefined) return exact;

  const dash = code.indexOf('-');
  if (dash > 0) {
    const country = code.slice(0, dash);
    // `X-` is a bloc namespace, not a country: `X-FOO` must not resolve through `X`.
    if (country !== 'X') {
      const parent = INSTRUMENT_LANGUAGES[country];
      if (parent !== undefined) return parent;
    }
  }

  return null;
}

/**
 * The `lang` attribute an instrument name should carry, or `null` when it
 * cannot be determined without guessing.
 *
 * An explicit `language` on the citation always wins — it is the author's
 * statement about the text they actually quoted, and it is the escape hatch for
 * every multilingual jurisdiction. Otherwise the jurisdiction's default
 * applies. `null` means: render the name verbatim with no `lang`, and make no
 * claim about how to pronounce it.
 *
 * The returned tag is independent of the UI locale by design. An English page
 * marks "Código Civil (España)" as `es`, and a Spanish page marks "Immigration
 * and Refugee Protection Act" as `en`. That is the correct behaviour in both
 * directions, and it is the reason this function takes no `Locale`.
 */
export function instrumentLang(source: InstrumentSource): string | null {
  if (typeof source.language === 'string') {
    const explicit = normalizeTag(source.language);
    if (explicit !== null) return explicit;
  }
  return instrumentLanguagePolicy(source.jurisdiction)?.defaultLanguage ?? null;
}

/**
 * True when the language of an instrument name is known rather than assumed:
 * the citation states it, or the jurisdiction enacts in only one language.
 *
 * False for a citation from a bilingual jurisdiction that does not state its
 * language, and for one whose jurisdiction has no policy at all. The review
 * console can use this to list the citations where recording an explicit
 * language would remove an assumption.
 */
export function isInstrumentLanguageCertain(source: InstrumentSource): boolean {
  if (typeof source.language === 'string' && normalizeTag(source.language) !== null) return true;
  const policy = instrumentLanguagePolicy(source.jurisdiction);
  return policy !== null && !policy.multilingual;
}
