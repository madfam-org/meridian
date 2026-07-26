/**
 * Flag assets for the atlas — provenance, posture, and an honest gap report.
 *
 * ## What this module is, and what it deliberately is not
 *
 * It is **metadata about images, not images**. The SVG bytes live on disk under
 * {@link FLAG_ASSET_DIRECTORY} and are never imported by any TypeScript in this
 * package, so nothing here puts a single byte of artwork into a JavaScript
 * bundle. `@meridian/atlas` is imported by three Next applications; a barrel of
 * 228 inlined SVGs would land in every one of them whether or not the route
 * renders a flag. The applications copy or serve the directory as static assets
 * and build a `src` with {@link flagPresentation}.
 *
 * ## The rule this module exists to enforce
 *
 * **A flag is never the carrier of meaning. The jurisdiction name is.**
 *
 * That is not a stylistic preference, and it is measurable rather than merely
 * asserted. Over the 249 codes the atlas holds, the pack we vendored draws only
 * 244 distinct images: `FR`, `GP`, `PM` and `RE` are byte-identical, as are
 * `NO`/`SJ` and `UM`/`US`. Normalise colour away and it collapses further — 232
 * distinct geometries, with `AM BG DE EE GA HU LT LU` all resolving to the same
 * horizontal tricolour. Neither the shape nor the palette identifies a
 * jurisdiction on its own, and at the 16–24 px a chip actually occupies the
 * palette is most of what a reader perceives. WCAG 2.2 SC 1.4.1 (Use of Color)
 * and SC 1.1.1 (Non-text Content) are Level A and both apply.
 *
 * So the API is shaped to make the right thing the easy thing:
 *
 * - {@link flagPresentation} takes a whole {@link Jurisdiction}, not a code. You
 *   cannot obtain an image without already holding the record that carries the
 *   name, and the name is copied onto the result next to the image so a
 *   renderer that destructures one has the other in hand.
 * - {@link FlagImage.alt} is the empty string and {@link FlagImage.decorative}
 *   is `true`, both fixed at the type level. The image is an adornment beside a
 *   name; giving it the country name as alternative text makes a screen reader
 *   announce the name twice, which is the defect this repository already fixed
 *   once when it removed the dual-language `bi()` rendering.
 * - The exception has a deliberately awkward name.
 *   {@link altTextForFlagUsedAsLabel} exists because a flag that genuinely is
 *   the only label needs real alternative text — but if you are reaching for it,
 *   the first question is why the name is not on screen.
 *
 * Removing every flag must leave the product functionally identical. If a screen
 * is unusable without them, the flags were carrying meaning and the design is
 * wrong.
 *
 * ## Three states, because two of them are different facts
 *
 * {@link FlagAvailability} distinguishes a flag we **decided** not to render
 * from one we have **not sourced**. Conflating them is how a gap silently
 * becomes a statement: "Taiwan has no flag here" is a considered position with a
 * recorded reason, and "we never got round to Taiwan" is a bug, and a consumer
 * that cannot tell them apart will report one as the other.
 *
 * The three states are computed from two *independent* inputs — the list of
 * assets actually on disk ({@link FLAG_ASSET_CODES}) and the suppression
 * decisions ({@link FLAG_SUPPRESSIONS}) — so `unsourced` is a state the data can
 * actually reach. Defining availability as "not suppressed" would make it
 * unreachable, and a gap report that cannot report a gap is the green-by-vacuity
 * shape this repository has been bitten by before.
 * `tests/flags.test.ts` reads the real directory and asserts
 * {@link FLAG_ASSET_CODES} matches it file for file, so the constant cannot
 * drift away from the bytes it claims to describe.
 *
 * ## Where flags may appear
 *
 * Browse and navigation surfaces only: the atlas list, a jurisdiction picker.
 * **Never on a surface carrying engine output.** Anything classified
 * `assessment` or `advice` — a day count, a checklist, a gap report, a handoff
 * package — is a document a person may hand to a lawyer or a border officer. A
 * flag adds no information to it and adds a recognition claim to it.
 *
 * ## Cost
 *
 * The compiled JavaScript of this module is a few kilobytes: 228 two-letter
 * strings, 21 suppression records with their prose, one provenance record and
 * the functions. The artwork is 148,728 bytes across 228 files (median 481 B,
 * largest `IO.svg` at 5,321 B), served as static files from our own origin,
 * cached per file, and fetched only for the flags a route actually renders. A
 * jurisdiction detail page fetches one. Nothing is fetched from a third-party
 * CDN — that would send an applicant's IP address and `Referer` to a stranger
 * every time they looked at a jurisdiction, which is a privacy cost this product
 * should not pay for decoration.
 *
 * @see docs/FLAG_ASSETS.md for the licence notice we owe and how it is served.
 * @see docs/research/2026-07-26-flag-assets.md for the sourcing research this
 * implements, including the candidates rejected and why.
 */

import type { IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';

import type { Jurisdiction, JurisdictionCode } from './types.js';
import { jurisdictionCode } from './types.js';

// ---------------------------------------------------------------------------
// Provenance — licence is data, not a footnote
// ---------------------------------------------------------------------------

/**
 * Where the artwork came from and under what terms.
 *
 * AGPL-3.0-only §7(b) expressly permits added material to carry a requirement to
 * preserve author attributions, so vendoring MIT-licensed art into this
 * repository does not absorb or extinguish its notice — the notice must ship.
 * §13 then makes that a *network* obligation rather than a repository one: a
 * user interacting with Meridian remotely has to be able to reach it. Recording
 * the licence as a structured value rather than as a sentence in a README is
 * what lets the running application render it.
 */
export interface FlagAssetSource {
  /** Stable id for this source, used in notices and in reason strings. */
  readonly id: string;
  readonly packageName: string;
  /** Exact version vendored. A licence claim that does not name a version names nothing. */
  readonly version: string;
  /** SPDX identifier. */
  readonly licence: string;
  /** The copyright line, verbatim from the licence file. */
  readonly copyright: string;
  /**
   * Where the licence text was read from. Not a homepage: the artefact whose
   * bytes were actually opened.
   */
  readonly licenceStatedAt: string;
  /** Repo-relative path to the unmodified licence file shipped beside the assets. */
  readonly licenceFile: string;
  readonly homepage: string;
  /** Subresource-integrity string published by the registry for this exact version. */
  readonly tarballIntegrity: string;
  /** When a human opened the licence file and checked what it said. */
  readonly verifiedOn: IsoDate;
  readonly note: string;
}

/**
 * The one source vendored today.
 *
 * `country-flag-icons` was chosen over `flag-icons` on three measured grounds —
 * both cover all 249 atlas codes including `XK`, but this one is roughly a tenth
 * the size (148,728 B for our set against ~1.6 MB) and ships 244 distinct images
 * for our codes against 238. The trade is stated rather than hidden: its own
 * README says the references came from image search and other packs, whereas
 * `flag-icons` traces to Wikimedia Commons renderings. For a chip beside a name
 * that is the right trade; for an accurate depiction of a national symbol —
 * printed output, something attached to a filing — it is not, and the answer
 * there is `flag-icons` or no flag at all.
 *
 * Both candidates are MIT, deliberately: swapping one for the other, or taking a
 * single file from the other, never changes the notices we owe.
 */
export const FLAG_ASSET_SOURCE: FlagAssetSource = {
  id: 'country-flag-icons',
  packageName: 'country-flag-icons',
  version: '1.6.20',
  licence: 'MIT',
  copyright: 'Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>',
  licenceStatedAt:
    'https://registry.npmjs.org/country-flag-icons/-/country-flag-icons-1.6.20.tgz (package/LICENSE)',
  licenceFile: 'packages/atlas/assets/flags/LICENSE',
  homepage: 'https://gitlab.com/catamphetamine/country-flag-icons',
  tarballIntegrity:
    'sha512-py8JiEKzjhYw6HPJ0L7SxLgCYim36UPRTZX43/kqGueUCZLSvnrqAiwW8HtQibur7mdkFQUkjOgdK+o/9FBtaw==',
  verifiedOn: isoDate('2026-07-26'),
  note:
    'The npm tarball was downloaded and its sha512 checked against the value the registry ' +
    'publishes for 1.6.20; they match. package/LICENSE was read directly from it and opens ' +
    '"(The MIT License)". The grant is blanket over the package: there is no per-file licence ' +
    'header and no per-flag provenance record, so it conveys whatever rights the packager holds ' +
    'in each drawing and cannot be audited flag by flag from outside. It also says nothing about ' +
    'emblem-protection statutes, which are a separate body of law from copyright — Wikimedia ' +
    'Commons tags 230 of the 247 flag files it holds for our codes with a warning that use of ' +
    'official insignia "is restricted in many countries" independently of copyright status. ' +
    'Whether any of that reaches a site published from Mexico is a question for counsel and is ' +
    'recorded as unresolved in docs/FLAG_ASSETS.md.',
};

/**
 * The notice the running service must display, verbatim.
 *
 * MIT requires that "the above copyright notice and this permission notice shall
 * be included in all copies or substantial portions of the Software". The full
 * permission notice is the unmodified file at
 * {@link FlagAssetSource.licenceFile}; this string is the attribution line that
 * belongs in a licences page next to a link to it.
 */
export const FLAG_ATTRIBUTION_NOTICE =
  'Flag artwork from country-flag-icons 1.6.20, used under the MIT licence. ' +
  'Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>. ' +
  'The full licence text ships unmodified at packages/atlas/assets/flags/LICENSE.';

/** Repo-relative directory holding the vendored SVGs and their licence file. */
export const FLAG_ASSET_DIRECTORY = 'packages/atlas/assets/flags';

/**
 * Default URL prefix under which the contents of {@link FLAG_ASSET_DIRECTORY}
 * are served. An application that mounts them elsewhere passes its own.
 */
export const FLAG_ASSET_DEFAULT_BASE_PATH = '/flags';

/**
 * Aspect ratio of every vendored file, so a caller can reserve space and avoid
 * layout shift without parsing an SVG.
 *
 * Measured, not assumed: every one of the 228 files declares a 3:2 `viewBox`,
 * although the intrinsic units vary (513×342, 512×341.333, 900×600, 22.5×15 and
 * others). Two files round the height to one decimal — 512×341.3 — a 0.01%
 * deviation from exact 3:2. Use `aspect-ratio: 3 / 2` in CSS rather than fixed
 * pixel dimensions.
 */
export const FLAG_ASPECT_RATIO: { readonly width: number; readonly height: number } = {
  width: 3,
  height: 2,
};

/**
 * SHA-256 over every `*.svg` in {@link FLAG_ASSET_DIRECTORY}, as
 * `name \0 bytes \0` in sorted filename order.
 *
 * The vendored files are byte-identical to the tarball's `3x2/` directory. This
 * digest is what makes that checkable: `tests/flags.test.ts` recomputes it from
 * disk, so an edit to any flag — a well-meant tweak, a lossy re-export, a
 * corrupted copy — fails a test instead of quietly becoming artwork we cannot
 * trace to the licence we ship.
 */
export const FLAG_ASSET_TREE_SHA256 =
  'd5ee0cc116f23723f92aefc97b811a594d51fce978d864ab705d51b7a792e9f4';

/** SHA-256 of the unmodified `LICENSE` file shipped beside the assets. */
export const FLAG_ASSET_LICENCE_SHA256 =
  '197bacbd1e1d9f40017ab2ae3dadd1383a5aa70bf7a2d749dcef474ec6e3c5eb';

/** Total bytes of the vendored SVGs, so a reader can size the static payload. */
export const FLAG_ASSET_TOTAL_BYTES = 148_728;

// ---------------------------------------------------------------------------
// What is actually on disk
// ---------------------------------------------------------------------------

/**
 * The codes for which an SVG exists, read from the directory on 2026-07-26.
 *
 * This is a statement about the filesystem, and it is checked against the
 * filesystem. It is *not* derived from {@link FLAG_SUPPRESSIONS} — deriving it
 * would make {@link FlagAvailability}'s `unsourced` state unreachable, which is
 * to say it would make the gap report incapable of reporting a gap.
 */
const ASSET_CODES: readonly string[] = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AS', 'AT', 'AU',
  'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ',
  'BM', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD',
  'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV',
  'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB',
  'GD', 'GE', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GU',
  'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN',
  'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH',
  'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI',
  'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG',
  'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU',
  'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO',
  'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL',
  'PN', 'PR', 'PT', 'PW', 'PY', 'QA', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB',
  'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TG', 'TH', 'TJ', 'TK', 'TL',
  'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WS', 'YE', 'ZA', 'ZM', 'ZW',
];

/**
 * Codes with a vendored SVG. Branded at load, so a malformed entry throws here
 * rather than producing a broken `src` in a browser.
 */
export const FLAG_ASSET_CODES: readonly JurisdictionCode[] = ASSET_CODES.map(jurisdictionCode);

const ASSET_CODE_SET: ReadonlySet<string> = new Set(ASSET_CODES);

/** File name inside {@link FLAG_ASSET_DIRECTORY} for a code. Uppercase, as vendored. */
export function flagFileName(code: JurisdictionCode): string {
  return `${code}.svg`;
}

// ---------------------------------------------------------------------------
// Suppression — a decision, with a reason, with a date
// ---------------------------------------------------------------------------

/**
 * Why a jurisdiction renders its name without a flag.
 *
 * The kind is for grouping and for tests. The prose reason is the load-bearing
 * part: it is what stops the list being quietly edited by someone who reads an
 * absence as a bug, and it is what a reviewer reads when they ask why Taiwan has
 * no flag.
 */
export type FlagSuppressionKind =
  /** Rendering any flag here asserts a recognition position we are not in a position to assert. */
  | 'contested_recognition'
  /** No single flag exists for the code. */
  | 'no_single_flag'
  /** The vendored image is byte-identical to another jurisdiction's, so it identifies the wrong row. */
  | 'image_identifies_another_jurisdiction'
  /** Competing flags exist and the dependency picked one; adopting it would make that choice silently. */
  | 'source_chose_among_competing_flags'
  /** One ISO code covers several immigration systems with several flags. */
  | 'one_code_several_systems'
  /** No resident population and no residence route; a flag implies a system that does not exist. */
  | 'no_resident_population';

/** One suppression decision. Versioned and dated, like a citation. */
export interface FlagSuppression {
  readonly code: JurisdictionCode;
  readonly kind: FlagSuppressionKind;
  /** Why, in enough detail that a reviewer can disagree with it specifically. */
  readonly reason: string;
  /** When a human made this decision. Not a build date. */
  readonly decidedOn: IsoDate;
}

const DECIDED_ON = '2026-07-26';

/** When the suppression list below was last reviewed as a whole. */
export const FLAG_SUPPRESSIONS_DECIDED_ON: IsoDate = isoDate(DECIDED_ON);

function suppression(code: string, kind: FlagSuppressionKind, reason: string): FlagSuppression {
  return { code: jurisdictionCode(code), kind, reason, decidedOn: isoDate(DECIDED_ON) };
}

/**
 * The 21 codes of 249 that render a name and no image.
 *
 * Every measurement quoted below was taken on 2026-07-26 from the vendored
 * tarball itself, with the code string normalised out of each SVG so a differing
 * element id could not mask a genuine duplicate. Where a claim concerns
 * `flag-icons` — the pack we did *not* vendor — it comes from
 * docs/research/2026-07-26-flag-assets.md §7.3 rather than from a measurement
 * here, and says so.
 */
export const FLAG_SUPPRESSIONS: readonly FlagSuppression[] = [
  suppression(
    'BL',
    'source_chose_among_competing_flags',
    'The two candidate packs disagree. country-flag-icons draws a distinct local emblem (2,878 B, ' +
      'eight fill colours); flag-icons draws a file byte-identical to FR (research brief §7.3). ' +
      'Which one is right is a question about the official status of a local emblem that we did ' +
      'not research, and adopting a dependency would answer it silently.',
  ),
  suppression(
    'BQ',
    'no_single_flag',
    'Bonaire, Sint Eustatius and Saba each fly their own flag. The pack itself concedes the point ' +
      'by shipping four files — BQ, BQ-BO, BQ-SA and BQ-SE — and its BQ.svg is Bonaire’s flag ' +
      'alone (white and blue diagonal, yellow triangle, red star inside a black compass ring). ' +
      'Rendering one of three as though it were the territory’s is a choice presented as a fact.',
  ),
  suppression(
    'BV',
    'no_resident_population',
    'The atlas record calls Bouvet Island an uninhabited Norwegian dependency with no resident ' +
      'population, listed only for enumeration completeness. A flag beside a row implies a ' +
      'migration system, and there is none.',
  ),
  suppression(
    'EH',
    'contested_recognition',
    'The vendored EH.svg is the Sahrawi Arab Democratic Republic’s flag — black, white and green ' +
      'bands with a red chevron, crescent and star. Morocco administers most of the territory and ' +
      'disputes that flag’s application to it. Three sources give three different answers: CoreUI ' +
      'omits EH entirely, and the Wikidata item bearing ISO code EH carries no flag image at all. ' +
      'The atlas’s own record leaves autonomy `unknown` because "a guess here would be a political ' +
      'claim wearing a data type"; the same reasoning governs the image.',
  ),
  suppression(
    'GF',
    'source_chose_among_competing_flags',
    'country-flag-icons draws a distinct local flag for French Guiana (green, red and yellow with ' +
      'a star); flag-icons draws the tricolour (research brief §7.3). The flag flown officially in ' +
      'the French overseas collectivities and the flag residents largely use are not the same ' +
      'thing, and we did not research which has official status here.',
  ),
  suppression(
    'GP',
    'image_identifies_another_jurisdiction',
    'GP.svg is byte-identical to FR.svg in the vendored set, alongside PM and RE. An image that is ' +
      'the same bytes as another row’s cannot tell a reader which row they are looking at, and a ' +
      'reader who takes it as identification is reading it wrong.',
  ),
  suppression(
    'GS',
    'no_resident_population',
    'The atlas record for South Georgia and the South Sandwich Islands states there is no permanent ' +
      'resident population and that presence is by permit only. A flag implies a residence system ' +
      'that does not exist.',
  ),
  suppression(
    'HM',
    'no_resident_population',
    'The atlas record calls Heard Island and McDonald Islands an uninhabited Australian external ' +
      'territory with no resident population and, as far as is known, no migration route of any ' +
      'kind. It is listed so a coverage denominator can exclude it; a flag would suggest otherwise.',
  ),
  suppression(
    'MF',
    'source_chose_among_competing_flags',
    'country-flag-icons draws a distinct local emblem for Saint Martin; flag-icons draws a file ' +
      'byte-identical to FR (research brief §7.3). Same unresearched question of official status as ' +
      'BL, GF, WF and YT.',
  ),
  suppression(
    'NC',
    'source_chose_among_competing_flags',
    'Both candidate packs draw the Kanak flag for New Caledonia — the vendored NC.svg is blue, ' +
      'green and red with a yellow disc — rather than the tricolour. Two flags are associated with ' +
      'the territory and which is flown has been a live political question there. Agreement between ' +
      'two dependencies is not neutrality; it is two packagers making the same choice.',
  ),
  suppression(
    'PM',
    'image_identifies_another_jurisdiction',
    'PM.svg is byte-identical to FR.svg in the vendored set, alongside GP and RE. See GP.',
  ),
  suppression(
    'PS',
    'contested_recognition',
    'Rendering a flag for Palestine asserts a recognition position, and rendering flags for some ' +
      'contested entities and not others asserts a comparison between them. The atlas carries PS ' +
      'because an entry-control system exists there; the name says that and nothing more. Wikimedia ' +
      'Commons additionally tags the Palestinian flag {{noresize}}.',
  ),
  suppression(
    'RE',
    'image_identifies_another_jurisdiction',
    'RE.svg is byte-identical to FR.svg in the vendored set, alongside GP and PM. See GP.',
  ),
  suppression(
    'SH',
    'one_code_several_systems',
    'The atlas record says it plainly: SH is really three controls behind one ISO code. Saint ' +
      'Helena, Ascension and Tristan da Cunha maintain separate immigration requirements under ' +
      'their own laws and fly separate flags. One image asserts one of the three and hides the ' +
      'other two, which is exactly the fact a reader of this row most needs.',
  ),
  suppression(
    'SJ',
    'image_identifies_another_jurisdiction',
    'SJ.svg is byte-identical to NO.svg in the vendored set. flag-icons makes the opposite choice ' +
      'and ships a distinct file (research brief §7.3), which is a further reason not to let the ' +
      'dependency decide.',
  ),
  suppression(
    'TF',
    'no_resident_population',
    'The atlas record cites a source describing the French Southern Territories as a "territory ' +
      'without permanent population nor elected officials", and records that there is accordingly ' +
      'no residence route. Its empty `inbound` array is one of the few places in the atlas where ' +
      'emptiness is a positive assertion rather than a gap.',
  ),
  suppression(
    'TW',
    'contested_recognition',
    'Rendering a flag for Taiwan asserts a recognition position. The atlas carries TW because it ' +
      'operates its own immigration control, which is a statement about entry, not about ' +
      'statehood; a flag would blur the two. Treated the same way as EH, PS and XK, because ' +
      'treating them differently would itself be the comparison.',
  ),
  suppression(
    'UM',
    'image_identifies_another_jurisdiction',
    'UM.svg is byte-identical to US.svg in both candidate packs. Independently, the atlas record ' +
      'describes an ISO/M49 aggregate of scattered insular areas with no permanent civilian ' +
      'population and no migration route — so either ground alone would suppress it.',
  ),
  suppression(
    'WF',
    'source_chose_among_competing_flags',
    'country-flag-icons draws a distinct local flag for Wallis and Futuna; flag-icons draws a file ' +
      'byte-identical to FR (research brief §7.3). Same unresearched question of official status as ' +
      'BL, GF, MF and YT.',
  ),
  suppression(
    'XK',
    'contested_recognition',
    'XK is not an ISO 3166-1 assignment; it is the user-assigned code the European Commission, the ' +
      'IMF and SWIFT use, and the atlas record says in terms that it "takes no position" on ' +
      'Kosovo’s status. Every pack that draws XK does so because it follows CLDR and Unicode, not ' +
      'because it took a view — so the availability of the image is a software convention, and ' +
      'rendering it would convert that convention into a claim.',
  ),
  suppression(
    'YT',
    'source_chose_among_competing_flags',
    'country-flag-icons draws a distinct local emblem for Mayotte; flag-icons draws a file ' +
      'byte-identical to FR (research brief §7.3). Wikidata’s own choice for this code is titled ' +
      '"(local)", which is the same judgement made a third time by a third party.',
  ),
];

const SUPPRESSION_BY_CODE: ReadonlyMap<string, FlagSuppression> = new Map(
  FLAG_SUPPRESSIONS.map((entry) => [entry.code as string, entry] as const),
);

/** The suppression record for a code, or `null` if it is not suppressed. */
export function flagSuppression(code: JurisdictionCode): FlagSuppression | null {
  return SUPPRESSION_BY_CODE.get(code) ?? null;
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

/**
 * Whether we render a flag for a jurisdiction, and if not, which kind of "not".
 *
 * `suppressed` and `unsourced` are different facts and must stay
 * distinguishable: one is a decision with a reason, the other is a gap.
 */
export type FlagAvailability =
  /** An asset is vendored and no suppression applies. */
  | 'available'
  /** We hold a decision not to render one. See {@link FlagPresentation.suppression}. */
  | 'suppressed'
  /** No asset and no decision — a gap. Empty today; see {@link flagCoverage}. */
  | 'unsourced';

/**
 * A renderable flag.
 *
 * `alt` and `decorative` are fixed at the type level so no caller can quietly
 * turn the image into the label. If a flag really is the only label on the
 * screen, the design is wrong; if it is unavoidably the only label,
 * {@link altTextForFlagUsedAsLabel} is the escape hatch and it is named to be
 * noticed in review.
 */
export interface FlagImage {
  /** File name inside {@link FLAG_ASSET_DIRECTORY}. */
  readonly fileName: string;
  /** Ready for `<img src>`: the base path joined to the file name. */
  readonly src: string;
  /** Always the empty string. The jurisdiction name carries the meaning. */
  readonly alt: '';
  /** Always true. Mark it `aria-hidden="true"` if you inline the SVG. */
  readonly decorative: true;
}

export interface FlagPresentationOptions {
  /**
   * URL prefix under which {@link FLAG_ASSET_DIRECTORY} is served.
   * Defaults to {@link FLAG_ASSET_DEFAULT_BASE_PATH}. A trailing slash is
   * tolerated; an empty string yields a root-relative `/XX.svg`.
   */
  readonly basePath?: string;
}

/**
 * Everything needed to render one jurisdiction — with the name first.
 *
 * Exactly one of `image` and `suppression` is non-null when `availability` is
 * `available` or `suppressed` respectively; both are null when `unsourced`.
 */
export interface FlagPresentation {
  readonly code: JurisdictionCode;
  /**
   * The label. Present for all 249 jurisdictions in both halves, which is why it
   * is on this object at all: a caller that has the image has the name.
   */
  readonly name: { readonly en: string; readonly es: string };
  readonly availability: FlagAvailability;
  readonly image: FlagImage | null;
  readonly suppression: FlagSuppression | null;
}

function joinBasePath(basePath: string, fileName: string): string {
  const trimmed = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${trimmed}/${fileName}`;
}

/**
 * Build the presentation for a jurisdiction.
 *
 * Takes the whole {@link Jurisdiction} rather than a code on purpose. There is
 * no call in this API that hands back an image to a caller who is not already
 * holding the name, which is the cheapest structural defence against a flag-only
 * cell there is.
 */
export function flagPresentation(
  jurisdiction: Jurisdiction,
  options?: FlagPresentationOptions,
): FlagPresentation {
  const code = jurisdiction.code;
  const name = { en: jurisdiction.name.en, es: jurisdiction.name.es };
  const suppressed = SUPPRESSION_BY_CODE.get(code as string);

  if (suppressed !== undefined) {
    return { code, name, availability: 'suppressed', image: null, suppression: suppressed };
  }
  if (!ASSET_CODE_SET.has(code as string)) {
    return { code, name, availability: 'unsourced', image: null, suppression: null };
  }

  const fileName = flagFileName(code);
  const basePath = options?.basePath ?? FLAG_ASSET_DEFAULT_BASE_PATH;
  return {
    code,
    name,
    availability: 'available',
    image: { fileName, src: joinBasePath(basePath, fileName), alt: '', decorative: true },
    suppression: null,
  };
}

/** The two halves {@link Jurisdiction.name} carries. Declared locally so this package stays dependency-free beyond `@meridian/core`. */
export type FlagTextLocale = 'en' | 'es';

/**
 * Alternative text for the one case where a flag genuinely is the only label.
 *
 * Named to be conspicuous in a diff. Reach for it only when the name cannot be
 * on screen — and note that "cannot" almost always means "did not fit", which is
 * a layout problem rather than a licence to drop the label. Everywhere else,
 * {@link FlagImage.alt} is the empty string and the visible name does the work.
 */
export function altTextForFlagUsedAsLabel(
  jurisdiction: Jurisdiction,
  locale: FlagTextLocale,
): string {
  return jurisdiction.name[locale];
}

// ---------------------------------------------------------------------------
// Coverage — the gap, reported so it cannot drift
// ---------------------------------------------------------------------------

/** Ways the flag data can be wrong without anything throwing. */
export type FlagCoverageRule =
  /** A jurisdiction with neither an asset nor a suppression decision. The silent gap. */
  | 'unsourced_jurisdiction'
  /** A code is both suppressed and shipped — we vendored artwork we decided never to render. */
  | 'suppressed_code_still_shipped'
  /** A suppression record names a code the atlas does not have. */
  | 'suppression_without_jurisdiction'
  /** An asset exists for a code the atlas does not have. */
  | 'asset_without_jurisdiction'
  /** The same code suppressed twice. */
  | 'duplicate_suppression'
  /** A jurisdiction missing one or both halves of its name — the label itself is broken. */
  | 'jurisdiction_without_name';

export interface FlagCoverageFinding {
  readonly rule: FlagCoverageRule;
  /** A jurisdiction code. */
  readonly subject: string;
  readonly detail: string;
}

/**
 * What we can honestly say about flag coverage.
 *
 * `namedFraction` is the number that matters and it should be 1: every
 * jurisdiction renders a name whether or not it renders an image. If it ever
 * drops below 1 the flags are the least of the problem.
 */
export interface FlagCoverageReport {
  readonly totalJurisdictions: number;
  readonly available: readonly JurisdictionCode[];
  readonly suppressed: readonly JurisdictionCode[];
  readonly unsourced: readonly JurisdictionCode[];
  /** available / total. 0-1. */
  readonly availableFraction: number;
  /** Jurisdictions with both name halves, over total. 0-1. Should be 1. */
  readonly namedFraction: number;
  readonly findings: readonly FlagCoverageFinding[];
  /**
   * What the run actually read.
   *
   * A report that examined nothing and a report that examined everything and
   * found nothing wrong must not print the same thing. These counts are the
   * difference.
   */
  readonly examined: {
    readonly jurisdictions: number;
    readonly assetCodes: number;
    readonly suppressions: number;
  };
}

const RULE_ORDER: readonly FlagCoverageRule[] = [
  'unsourced_jurisdiction',
  'suppressed_code_still_shipped',
  'suppression_without_jurisdiction',
  'asset_without_jurisdiction',
  'duplicate_suppression',
  'jurisdiction_without_name',
];

/**
 * Partition the given jurisdictions across the three availability states and
 * report every way the flag data disagrees with the atlas.
 *
 * Pure, and takes the jurisdictions as an argument rather than importing
 * `ALL_JURISDICTIONS`, both to avoid an import cycle through `index.ts` and so a
 * test can hand it a deliberately broken atlas and watch each rule fire.
 * Findings are sorted by rule then subject, so two runs over the same input
 * produce byte-identical output.
 */
export function flagCoverage(jurisdictions: readonly Jurisdiction[]): FlagCoverageReport {
  const findings: FlagCoverageFinding[] = [];
  const add = (rule: FlagCoverageRule, subject: string, detail: string): void => {
    findings.push({ rule, subject, detail });
  };

  const seenSuppression = new Set<string>();
  for (const entry of FLAG_SUPPRESSIONS) {
    if (seenSuppression.has(entry.code as string)) {
      add(
        'duplicate_suppression',
        entry.code as string,
        'suppressed twice; the first record is used and the second is unreachable.',
      );
      continue;
    }
    seenSuppression.add(entry.code as string);
    if (ASSET_CODE_SET.has(entry.code as string)) {
      add(
        'suppressed_code_still_shipped',
        entry.code as string,
        `an SVG is vendored at ${FLAG_ASSET_DIRECTORY}/${entry.code}.svg for a code we decided not ` +
          'to render. Either the decision or the file is stale; delete the file or the record.',
      );
    }
  }

  const known = new Set<string>();
  const available: JurisdictionCode[] = [];
  const suppressed: JurisdictionCode[] = [];
  const unsourced: JurisdictionCode[] = [];
  let named = 0;

  for (const jurisdiction of jurisdictions) {
    const code = jurisdiction.code as string;
    known.add(code);
    if (jurisdiction.name.en.length > 0 && jurisdiction.name.es.length > 0) {
      named += 1;
    } else {
      add(
        'jurisdiction_without_name',
        code,
        'the name is the label a flag can never replace, and one of its halves is empty.',
      );
    }

    if (seenSuppression.has(code)) {
      suppressed.push(jurisdiction.code);
    } else if (ASSET_CODE_SET.has(code)) {
      available.push(jurisdiction.code);
    } else {
      unsourced.push(jurisdiction.code);
      add(
        'unsourced_jurisdiction',
        code,
        'no vendored asset and no suppression decision. This is a gap, not a position: either ' +
          `add ${code}.svg to ${FLAG_ASSET_DIRECTORY} or add a suppression record saying why not.`,
      );
    }
  }

  for (const entry of FLAG_SUPPRESSIONS) {
    if (!known.has(entry.code as string)) {
      add(
        'suppression_without_jurisdiction',
        entry.code as string,
        'a suppression decision for a code the atlas does not carry. It has no effect and will ' +
          'mislead the next reader of the list.',
      );
    }
  }
  for (const code of ASSET_CODES) {
    if (!known.has(code)) {
      add(
        'asset_without_jurisdiction',
        code,
        `${code}.svg is vendored for a code the atlas does not carry; it ships bytes nothing can ` +
          'render.',
      );
    }
  }

  findings.sort((a, b) => {
    const byRule = RULE_ORDER.indexOf(a.rule) - RULE_ORDER.indexOf(b.rule);
    return byRule !== 0 ? byRule : a.subject.localeCompare(b.subject);
  });

  const total = jurisdictions.length;
  return {
    totalJurisdictions: total,
    available,
    suppressed,
    unsourced,
    availableFraction: total === 0 ? 0 : available.length / total,
    namedFraction: total === 0 ? 0 : named / total,
    findings,
    examined: {
      jurisdictions: total,
      assetCodes: ASSET_CODES.length,
      suppressions: FLAG_SUPPRESSIONS.length,
    },
  };
}

/** Number of rules {@link flagCoverage} exercises, so a caller can print what was checked. */
export const FLAG_COVERAGE_RULE_COUNT: number = RULE_ORDER.length;
