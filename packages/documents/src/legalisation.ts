/**
 * Legalisation routing: how a document issued by one state is made usable by
 * another.
 *
 * A public document has no automatic force outside the state that issued it.
 * The receiving authority has no way to know that the signature on a Mexican
 * *acta de nacimiento* belongs to a real *oficial del registro civil*, so it
 * demands a chain of authentication it does recognise. There are exactly three
 * shapes that chain takes:
 *
 *   - **Apostille** — a single certificate issued by a competent authority of
 *     the state of origin, under the 1961 Hague Convention. Art. 3 makes it the
 *     *only* formality that may be required between Contracting States.
 *   - **Consular legalisation** — the pre-1961 chain, still the rule whenever
 *     either state is outside the Convention: authentication by the origin
 *     state's foreign ministry, then legalisation by the receiving state's
 *     consulate in that country.
 *   - **None** — the receiving state accepts the document as issued, either
 *     because it issued it itself or because a separate instrument (inside the
 *     EU, Regulation 2016/1191) abolishes the formality.
 *
 * And a fourth answer this module will give: **`'unknown'`**. When a country is
 * outside `@meridian/core`'s apostille catalog we say so, and we never fall
 * back to "apostille is probably fine". The failure mode of a wrong default is
 * not a warning in a log — it is an applicant flying to a consular appointment
 * with a document the consulate will not look at, losing the slot, and in a
 * quota-limited or deadline-bound route losing the application with it.
 *
 * What an apostille does **not** do is worth stating because clients routinely
 * assume otherwise: it certifies the origin of the signature and seal. It says
 * nothing about whether the content is true, and nothing about the language.
 * Translation is a separate requirement handled in `translation.ts`.
 */

import type { ApostilleStatus, Citation, CountryCode, IsoDate } from '@meridian/core';
import { apostilleStatus, compareDates, isoDate } from '@meridian/core';
import type { DocumentKind } from './model.js';

/**
 * The route a document must take to be usable in the receiving state.
 *
 * `'unknown'` is a first-class answer, not an error state. It means the catalog
 * does not cover the country pair and a human must confirm the route before the
 * applicant spends money or a consular slot on it.
 */
export type LegalisationRoute = 'none' | 'apostille' | 'consular' | 'unknown';

/**
 * How the 1961 Convention's notion of a "public document" maps onto the kinds
 * this catalog handles.
 *
 * Art. 1 of the Convention applies to documents emanating from an authority or
 * official connected with courts, administrative documents, notarial acts, and
 * official certificates placed on privately signed documents. Everything else
 * either travels as an original or, if it is a private instrument, only enters
 * the authentication chain once a notary has put an official certificate on it.
 */
export type DocumentAuthenticationClass =
  /** Emanates from a public authority. Authentication applies in the ordinary way. */
  | 'public_document'
  /**
   * Presented in original and inspected directly — identity and travel
   * documents, and artefacts of the application itself. Nobody apostilles a
   * passport; the authority reads the passport.
   */
  | 'presented_in_original'
  /**
   * Issued by a private party — an employer, a bank, an insurer, a landlord.
   * Whether the receiving authority wants it authenticated at all, and whether
   * it must first be notarised to become authenticable, is a question of that
   * authority's practice rather than of the Convention.
   */
  | 'private_instrument';

/**
 * Authentication class per document kind.
 *
 * This is a claim about how documents work, not about any one country's law,
 * which is why it is a single table rather than one per jurisdiction. Where a
 * specific pathway departs from it — an authority that wants an apostilled
 * employment contract — that belongs in the pathway's own requirement, and the
 * `note` on the resulting requirement will say a human confirmed it.
 */
export const DOCUMENT_AUTHENTICATION_CLASS: Readonly<
  Record<DocumentKind, DocumentAuthenticationClass>
> = {
  passport: 'presented_in_original',
  national_id: 'presented_in_original',
  birth_certificate: 'public_document',
  marriage_certificate: 'public_document',
  criminal_record: 'public_document',
  proof_of_income: 'private_instrument',
  proof_of_accommodation: 'private_instrument',
  health_insurance: 'private_instrument',
  degree_certificate: 'public_document',
  academic_transcript: 'public_document',
  professional_licence: 'public_document',
  employment_offer: 'private_instrument',
  employment_contract: 'private_instrument',
  cv: 'presented_in_original',
  photograph: 'presented_in_original',
  application_form: 'presented_in_original',
  payment_receipt: 'presented_in_original',
  biometrics_confirmation: 'presented_in_original',
  prior_visa: 'presented_in_original',
  travel_itinerary: 'presented_in_original',
};

export type LegalisationStepKind =
  /** A notary certifies a privately signed document so it can enter the chain. */
  | 'notarisation'
  /** The issuing authority certifies its own document in the form the next step requires. */
  | 'issuing_authority_certification'
  /** The single Hague certificate. */
  | 'apostille'
  /** Authentication by the origin state's ministry of foreign affairs. */
  | 'foreign_ministry_authentication'
  /** Legalisation by the receiving state's consulate accredited to the origin state. */
  | 'consular_legalisation'
  /** A human must establish the route before any of the above can be scheduled. */
  | 'route_verification';

export type LegalisationActor =
  | 'issuing_state_authority'
  | 'issuing_state_foreign_ministry'
  | 'receiving_state_consulate'
  | 'notary'
  | 'representative';

export interface LegalisationStep {
  readonly kind: LegalisationStepKind;
  readonly actor: LegalisationActor;
  readonly description: string;
}

export interface LegalisationRequirement {
  readonly route: LegalisationRoute;
  readonly documentKind: DocumentKind;
  readonly issuingCountry: CountryCode;
  readonly receivingCountry: CountryCode;
  /** Why this route and not another, in terms a caseworker can check against the citation. */
  readonly rationale: string;
  readonly citations: readonly Citation[];
  /** The acts to perform, in order. Empty when the route is `'none'`. */
  readonly steps: readonly LegalisationStep[];
  /**
   * True when a human must confirm before the applicant relies on this. Set for
   * `'unknown'`, for consular chains (which vary by post), and for private
   * instruments (where practice rather than the Convention governs).
   */
  readonly requiresVerification: boolean;
}

const D = (value: string): IsoDate => isoDate(value);

/** The date a human last checked every citation in this module against its source. */
const VERIFIED_ON: IsoDate = D('2026-07-25');

export const CITATION_HAGUE_1961_ART_1: Citation = {
  id: 'hcch-12-1961-art-1',
  kind: 'treaty',
  instrument:
    'Convention of 5 October 1961 Abolishing the Requirement of Legalisation for Foreign Public Documents (HCCH Convention No. 12)',
  provision: 'art. 1',
  url: 'https://www.hcch.net/en/instruments/conventions/specialised-sections/apostille',
  jurisdiction: 'X-HCCH',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 1 defines the public documents the Convention reaches: documents emanating from an authority or official connected with the courts, administrative documents, notarial acts, and official certificates placed on privately signed documents. It expressly excludes documents executed by diplomatic or consular agents and administrative documents dealing directly with commercial or customs operations.',
};

export const CITATION_HAGUE_1961_ART_3: Citation = {
  id: 'hcch-12-1961-art-3',
  kind: 'treaty',
  instrument:
    'Convention of 5 October 1961 Abolishing the Requirement of Legalisation for Foreign Public Documents (HCCH Convention No. 12)',
  provision: 'art. 3',
  url: 'https://www.hcch.net/en/instruments/conventions/specialised-sections/apostille',
  jurisdiction: 'X-HCCH',
  verifiedOn: VERIFIED_ON,
  note:
    'The apostille is the only formality that may be required to certify the origin of a public document moving between Contracting States. It certifies the authenticity of the signature, the capacity of the signatory and the identity of the seal — never the content of the document, and never its language.',
};

export const CITATION_CONSULAR_LEGALISATION: Citation = {
  id: 'consular-legalisation-practice',
  kind: 'official_guidance',
  instrument: 'Consular legalisation practice of the receiving state',
  jurisdiction: 'X-HCCH',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Where the 1961 Convention does not apply between the two states, the document must be authenticated by the origin state and then legalised by the receiving state\'s consulate. The number of intermediate steps, the fees, the acceptable document format and the appointment mechanics are set by each individual consular post as administrative practice, not by any single published instrument. Confirm the chain with the specific post before the applicant travels or pays.',
};

export const CITATION_EU_2016_1191: Citation = {
  id: 'eu-reg-2016-1191-art-4',
  kind: 'regulation',
  instrument:
    'Regulation (EU) 2016/1191 of the European Parliament and of the Council of 6 July 2016 on promoting the free movement of citizens by simplifying the requirements for presenting certain public documents in the European Union',
  provision: 'art. 2 and art. 4',
  url: 'https://eur-lex.europa.eu/eli/reg/2016/1191/oj',
  jurisdiction: 'X-EU',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 4 exempts the public documents within its scope from all forms of legalisation and similar formality between Member States. Art. 2 fixes that scope, which includes documents establishing birth, marriage, domicile or residence, nationality and the absence of a criminal record. It does not reach educational or professional documents. The exemption removes the authentication formality only — the receiving authority may still require the document itself, and may still require it to be intelligible.',
};

/**
 * EU Member States, for Regulation (EU) 2016/1191.
 *
 * This table lives here rather than in `@meridian/core` because core publishes
 * Schengen membership — which is a different set for a different purpose — and
 * no EU table. Schengen is not a substitute: Ireland is an EU Member State and
 * outside Schengen, and Switzerland, Norway and Iceland are the reverse. Using
 * the Schengen list here would exempt Swiss documents from a formality that
 * still applies to them and refuse Irish documents an exemption they have.
 *
 * If `@meridian/core` later publishes EU membership, delete this and use it.
 */
export const EU_MEMBER_STATES: readonly CountryCode[] = [
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
].map((c) => c as CountryCode);

export function isEuMemberState(country: CountryCode): boolean {
  return EU_MEMBER_STATES.includes(country.toUpperCase() as CountryCode);
}

/**
 * Document kinds inside the material scope of Regulation (EU) 2016/1191.
 *
 * Deliberately narrower than the Regulation's own list, because it is the
 * intersection of that list with the kinds this catalog models. Education is
 * absent because the Regulation does not reach it — a German degree presented
 * in Spain still needs an apostille.
 */
export const EU_2016_1191_COVERED_KINDS: readonly DocumentKind[] = [
  'birth_certificate',
  'marriage_certificate',
  'criminal_record',
];

/**
 * Date from which Regulation (EU) 2016/1191 applies.
 *
 * Routing is date-aware because a rule with a commencement date does not
 * retroactively bless a document legalised before it. A file assembled in 2018
 * took the apostille route lawfully, and a system that re-evaluates that file
 * today under today's rule will wrongly report the apostille as unnecessary.
 */
export const EU_2016_1191_APPLIES_FROM: IsoDate = D('2019-02-16');

export interface LegalisationQuery {
  readonly documentKind: DocumentKind;
  readonly issuingCountry: CountryCode;
  readonly receivingCountry: CountryCode;
  /**
   * The date the question is being asked. Legalisation rules have commencement
   * dates and accession dates, and both matter — Canada only became a party to
   * the 1961 Convention on 2024-01-11.
   */
  readonly asOf: IsoDate;
}

function apostilleSteps(issuing: CountryCode, receiving: CountryCode): readonly LegalisationStep[] {
  return [
    {
      kind: 'issuing_authority_certification',
      actor: 'issuing_state_authority',
      description: `Obtain the document from the ${issuing} issuing authority in the form its competent apostille authority will accept — normally a recent certified copy rather than an old original.`,
    },
    {
      kind: 'apostille',
      actor: 'issuing_state_authority',
      description: `Have the competent authority designated by ${issuing} affix the apostille. This is the only authentication formality ${receiving} may require for this document.`,
    },
  ];
}

function consularSteps(issuing: CountryCode, receiving: CountryCode): readonly LegalisationStep[] {
  return [
    {
      kind: 'issuing_authority_certification',
      actor: 'issuing_state_authority',
      description: `Obtain the document from the ${issuing} issuing authority in a form that authority will subsequently authenticate.`,
    },
    {
      kind: 'foreign_ministry_authentication',
      actor: 'issuing_state_foreign_ministry',
      description: `Have the ${issuing} ministry of foreign affairs authenticate the issuing authority's signature and seal.`,
    },
    {
      kind: 'consular_legalisation',
      actor: 'receiving_state_consulate',
      description: `Have the ${receiving} consulate accredited to ${issuing} legalise the document. Confirm the post's own required sequence, fees and appointment lead time first — these are set post by post.`,
    },
  ];
}

function verificationStep(issuing: CountryCode, receiving: CountryCode): LegalisationStep {
  return {
    kind: 'route_verification',
    actor: 'representative',
    description: `Establish with the ${receiving} authority or its consulate in ${issuing} which authentication route applies. Neither country pair is covered by the apostille catalog, so no route may be assumed.`,
  };
}

/**
 * Decide the legalisation route for one document.
 *
 * The order of the tests is the order in which the answers *foreclose* one
 * another, and it is not interchangeable:
 *
 *   1. Documents that are never authenticated (a passport, a completed form)
 *      short-circuit first, so a missing apostille catalog entry never produces
 *      a spurious "route unknown" for a passport.
 *   2. A document used in the state that issued it needs no authentication at
 *      all. This case exists in every real file — the applicant's local police
 *      certificate in an in-country renewal — and skipping it invents work.
 *   3. The EU exemption is checked *before* the apostille catalog, because it
 *      abolishes the formality regardless of whether either state appears in
 *      that catalog. A French birth certificate presented in Spain needs no
 *      apostille, and France is not in core's catalog; testing the catalog
 *      first would answer `'unknown'` for a case the law settles.
 *   4. Only then the catalog. An absent entry yields `'unknown'`, never a
 *      default.
 *
 * `resolveApostilleStatus` defaults to `@meridian/core`'s shared catalog and
 * exists as a seam for two reasons. A firm that has verified a country's
 * Convention status ahead of the shared catalog can supply it without waiting
 * for a release; and the consular branch below is otherwise unreachable, since
 * every country core currently records is a Convention party. An unreachable
 * branch that is never exercised is an unreviewed branch, and this one decides
 * whether somebody flies to the wrong ministry.
 */
export function legalisationRoute(
  query: LegalisationQuery,
  resolveApostilleStatus: (country: CountryCode) => ApostilleStatus | null = apostilleStatus,
): LegalisationRequirement {
  const issuing = query.issuingCountry.toUpperCase() as CountryCode;
  const receiving = query.receivingCountry.toUpperCase() as CountryCode;
  const base = {
    documentKind: query.documentKind,
    issuingCountry: issuing,
    receivingCountry: receiving,
  } as const;

  const authClass = DOCUMENT_AUTHENTICATION_CLASS[query.documentKind];

  if (authClass === 'presented_in_original') {
    return {
      ...base,
      route: 'none',
      rationale:
        'Presented in original and inspected directly by the receiving authority. It is not a public document circulated for use abroad, so no authentication chain applies.',
      citations: [CITATION_HAGUE_1961_ART_1],
      steps: [],
      requiresVerification: false,
    };
  }

  if (issuing === receiving) {
    return {
      ...base,
      route: 'none',
      rationale: `Issued and used in ${receiving}. A state does not authenticate its own documents to itself.`,
      citations: [CITATION_HAGUE_1961_ART_1],
      steps: [],
      requiresVerification: false,
    };
  }

  if (
    isEuMemberState(issuing) &&
    isEuMemberState(receiving) &&
    EU_2016_1191_COVERED_KINDS.includes(query.documentKind) &&
    compareDates(query.asOf, EU_2016_1191_APPLIES_FROM) >= 0
  ) {
    return {
      ...base,
      route: 'none',
      rationale: `Both ${issuing} and ${receiving} are EU Member States and this document is within the material scope of Regulation (EU) 2016/1191, which exempts it from legalisation and any similar formality. The exemption removes the authentication step only; the document itself is still required, and it may still need to be intelligible to the receiving authority.`,
      citations: [CITATION_EU_2016_1191],
      steps: [],
      requiresVerification: false,
    };
  }

  const issuingStatus = resolveApostilleStatus(issuing);
  const receivingStatus = resolveApostilleStatus(receiving);

  if (issuingStatus === null || receivingStatus === null) {
    const outside = [
      issuingStatus === null ? issuing : null,
      receivingStatus === null ? receiving : null,
    ].filter((c): c is CountryCode => c !== null);
    return {
      ...base,
      route: 'unknown',
      rationale: `Apostille status is not recorded for ${outside.join(' and ')}. The route cannot be determined, and it must not be assumed: presenting an apostilled document to a state that requires consular legalisation, or the reverse, wastes the appointment and any deadline riding on it.`,
      citations: [CITATION_HAGUE_1961_ART_3, CITATION_CONSULAR_LEGALISATION],
      steps: [verificationStep(issuing, receiving)],
      requiresVerification: true,
    };
  }

  const privateInstrument = authClass === 'private_instrument';
  const statusNotes = [issuingStatus.note, receivingStatus.note].filter(
    (n): n is string => n !== undefined,
  );

  if (issuingStatus.isParty && receivingStatus.isParty) {
    return {
      ...base,
      route: 'apostille',
      rationale:
        `${issuing} and ${receiving} are both parties to the 1961 Hague Convention, so a single apostille issued by the competent authority of ${issuing} is the only authentication formality ${receiving} may require.` +
        (privateInstrument
          ? ' This document is a private instrument: it must normally be notarised before a competent authority will apostille it, and whether the receiving authority wants it authenticated at all is that authority\'s practice rather than a rule of the Convention.'
          : '') +
        (statusNotes.length > 0 ? ` ${statusNotes.join(' ')}` : ''),
      citations: [CITATION_HAGUE_1961_ART_1, CITATION_HAGUE_1961_ART_3],
      steps: privateInstrument
        ? [
            {
              kind: 'notarisation',
              actor: 'notary',
              description: `Have a notary in ${issuing} certify the private document so that an official certificate exists for the apostille to attach to.`,
            },
            ...apostilleSteps(issuing, receiving),
          ]
        : apostilleSteps(issuing, receiving),
      requiresVerification: privateInstrument || statusNotes.length > 0,
    };
  }

  const nonParty = !issuingStatus.isParty ? issuing : receiving;
  return {
    ...base,
    route: 'consular',
    rationale:
      `${nonParty} is not a party to the 1961 Hague Convention, so the apostille is unavailable between ${issuing} and ${receiving} and the document must travel the consular chain: authentication in ${issuing}, then legalisation by the ${receiving} consulate accredited to ${issuing}.` +
      (privateInstrument
        ? ' As a private instrument it will normally need notarising before the chain can begin.'
        : ''),
    citations: [CITATION_CONSULAR_LEGALISATION],
    steps: privateInstrument
      ? [
          {
            kind: 'notarisation',
            actor: 'notary',
            description: `Have a notary in ${issuing} certify the private document so the authentication chain has an official signature to work from.`,
          },
          ...consularSteps(issuing, receiving),
        ]
      : consularSteps(issuing, receiving),
    requiresVerification: true,
  };
}

/**
 * True when the completed legalisation on a document satisfies the requirement.
 *
 * A route of `'unknown'` is never satisfied by anything already done, because
 * we do not know what "done" would mean. That is the whole point of the value.
 */
export function legalisationSatisfied(
  requirement: LegalisationRequirement,
  completed: LegalisationRoute | null,
): boolean {
  if (requirement.route === 'none') return true;
  if (requirement.route === 'unknown') return false;
  return completed === requirement.route;
}
