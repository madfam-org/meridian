# Flag assets

**This file is the attribution notice for the flag artwork Meridian ships.** It is
not a design document that happens to mention a licence. If you are looking for
the MIT permission notice we are obliged to carry, it is in
[§2](#2-the-notice-we-owe) in full.

- Implemented: 2026-07-26. Every figure here was measured on that date from the
  artefact named. Where something is not yet done, it says so in
  [§8](#8-what-is-not-done-yet) rather than being described as though it were.
- The sourcing research behind these decisions — the candidates considered, the
  licences read, and why CC0 was not achievable — is
  [docs/research/2026-07-26-flag-assets.md](research/2026-07-26-flag-assets.md).
- The code is the source of truth for everything below.
  `packages/atlas/src/flags.ts` carries the provenance record, the suppression
  list and the coverage arithmetic; this file explains and reproduces it.
  `packages/atlas/tests/flags.test.ts` asserts the two agree with the bytes on
  disk.

---

## 1. What ships

| | |
|---|---|
| Package vendored | `country-flag-icons` **1.6.20** |
| Licence | **MIT** |
| Copyright | `Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>` |
| Read from | the npm tarball `country-flag-icons-1.6.20.tgz`, file `package/LICENSE` |
| Registry integrity | `sha512-py8JiEKzjhYw6HPJ0L7SxLgCYim36UPRTZX43/kqGueUCZLSvnrqAiwW8HtQibur7mdkFQUkjOgdK+o/9FBtaw==` |
| Where the files are | `packages/atlas/assets/flags/` |
| What is there | 228 SVGs (`XX.svg`, uppercase ISO 3166-1 alpha-2) plus the unmodified `LICENSE` |
| Ratio | `3x2`, from the tarball's `3x2/` directory |
| Total size | 148,728 bytes; median file 481 B; largest `IO.svg` at 5,321 B |

The SVGs are byte-identical to the tarball's `3x2/` directory. Nothing was
re-drawn, re-encoded or optimised. That is deliberate: an unmodified copy beside
an unmodified `LICENSE` keeps the MIT condition satisfied by construction, and it
means anyone can re-download the tarball and diff.

It is also checked rather than promised. `FLAG_ASSET_TREE_SHA256` in
`flags.ts` is a SHA-256 over every `*.svg` as `name \0 bytes \0` in sorted order,
and the test suite recomputes it from the real directory. Appending ten bytes to
one flag fails two tests.

**`country-flag-icons` is a *vendored* copy, not a dependency.** It appears in no
`package.json`, `pnpm install` does not fetch it, and no application imports it.
The consequence worth knowing: a `pnpm audit` or a dependency bot will never see
it, so updating it is a manual act — see [§7](#7-updating-the-artwork).

### Why this package and not another

Both `country-flag-icons` and `flag-icons` cover all 249 atlas codes including
`XK`, and both are MIT — chosen so that swapping one for the other, or taking a
single file from the other, never changes the notices we owe. This one was taken
because it is roughly a tenth the size (148,728 B for our set against ~1.6 MB)
and draws 244 distinct images for our codes against 238.

The trade, stated rather than buried: `flag-icons` traces to Wikimedia Commons
renderings, while `country-flag-icons`' own README says its references came from
image search and other flag packs. For a chip beside a name that is the right
trade. **For an accurate depiction of a national symbol — printed output,
something attached to a filing — it is not.** Use `flag-icons` for that, or use
no flag.

CC0 was asked for and is not achievable: the only genuinely CC0 set, CoreUI Icons
Free, covers 198 of our 249 and omits almost exactly the territories a migration
atlas exists to hold. Both CC0 and MIT are GPL-compatible, so the practical
difference is a notice we owe anyway. The full argument, with the 51 missing
codes named, is in the research brief §4.

---

## 2. The notice we owe

MIT requires that "the above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software". AGPL-3.0-only
§7(b) expressly permits added material to carry a requirement to preserve author
attributions, so relicensing Meridian under the AGPL does not absorb or
extinguish that notice.

Reproduced in full, from `packages/atlas/assets/flags/LICENSE`. The vendored file
itself is 1,129 bytes with CRLF line endings and no trailing newline, exactly as
it came out of the tarball; the block below is the same text with the line
endings a Markdown code fence can carry, so a byte-for-byte diff will differ in
line terminators and in nothing else.

```
(The MIT License)

Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

`FLAG_ATTRIBUTION_NOTICE` in `flags.ts` is the one-paragraph form an application
can print beside a link to that file:

> Flag artwork from country-flag-icons 1.6.20, used under the MIT licence.
> Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>. The full
> licence text ships unmodified at packages/atlas/assets/flags/LICENSE.

### What the grant does and does not reach

- It is **blanket over the package**. There is no per-file licence header and no
  per-flag provenance record, so it conveys whatever rights the packager holds in
  each drawing and cannot be audited flag by flag from outside. A flag inside the
  pack that was copied from a share-alike source would be mislicensed by the
  packager, and there is no way to detect that from here. That residual risk sits
  with a maintainer who has taken a public position, which is better than
  hand-assembling from mixed per-file sources, but it is not zero.
- It says **nothing about emblem-protection law**, which is a separate body of
  law from copyright. Wikimedia Commons tags 230 of the 247 flag files it holds
  for our codes with a warning that use of official insignia "is restricted in
  many countries" and that those restrictions "are independent of the copyright
  status." Nine of our jurisdictions' flags additionally carry Commons'
  `{{Communist symbol}}` template, which names six countries restricting display
  of such symbols. Whether any of that reaches a website published from Mexico is
  a conflicts question this repository has not answered — see
  [§9](#9-open-questions-for-counsel).

---

## 3. The posture

**A flag is never the carrier of meaning. The jurisdiction name is.**

That is measured, not asserted. Over the 249 codes the atlas holds, the pack
draws only **244 distinct images**: `FR`, `GP`, `PM` and `RE` are byte-identical,
as are `NO`/`SJ` and `UM`/`US`. Normalise colour away and it collapses further —
**232 distinct geometries**, with `AM BG DE EE GA HU LT LU` all resolving to the
same horizontal tricolour. So neither the shape nor the palette identifies a
jurisdiction on its own, and at the 16–24 px a chip occupies the palette is most
of what a reader perceives. WCAG 2.2 SC 1.4.1 (Use of Color) and SC 1.1.1
(Non-text Content) are both Level A and both apply.

Four rules follow.

1. **The name is the identity; a flag is at most an adornment beside it.** Never
   a flag alone, never a flag as a link's accessible name, never a flag in a cell
   without the name in the same cell.
2. **No flags on any surface carrying engine output.** Anything classified
   `assessment` or `advice` — a day count, a checklist, a gap report, a handoff
   package — is a document a person may hand to a lawyer or a border officer. A
   flag adds no information to it and adds a recognition claim to it. Flags
   belong on browse and navigation surfaces: the atlas list, a jurisdiction
   picker.
3. **Suppression is data with a reason per code**, not a hardcoded `if` and not a
   silent absence. See [§4](#4-the-suppression-list).
4. **The suppression list is versioned and dated, like a citation.** Every record
   carries `decidedOn`. Changing it is a reviewed decision, not a dependency
   bump.

The API is shaped to make rule 1 the path of least resistance:
`flagPresentation()` takes a whole `Jurisdiction`, not a code, so you cannot
obtain an image without already holding the name; `FlagImage.alt` is the empty
string and `FlagImage.decorative` is `true`, both fixed at the type level. Giving
a decorative flag the country name as alternative text makes a screen reader
announce the name twice — the same defect this repository already fixed once when
it removed the dual-language `bi()` rendering.

The exception is `altTextForFlagUsedAsLabel()`, which returns the name in a
locale for the case where a flag genuinely is the only label. It is named to be
conspicuous in review. If you are reaching for it, the first question is why the
name is not on screen; "it did not fit" is a layout problem, not a licence to
drop the label.

**Removing every flag must leave the product functionally identical.** If a
screen is unusable without them, the flags were carrying meaning and the design
is wrong. Shipping no flags at all was and remains a defensible answer; it was
not taken only because a visual anchor helps a reader scan a 249-row list.

---

## 4. The suppression list

21 of 249 codes render the name and no image. `FLAG_SUPPRESSIONS` in `flags.ts`
is canonical and carries the full reason for each; this table is the summary.

Every measurement below was taken on 2026-07-26 from the vendored tarball, with
the code string normalised out of each SVG so a differing element id could not
mask a genuine duplicate. Claims about `flag-icons` — the pack that was **not**
vendored — come from the research brief §7.3, and the code says so in each
reason.

| Code | Jurisdiction | Kind | In one line |
|---|---|---|---|
| `EH` | Western Sahara | contested recognition | The vendored file is the SADR flag; Morocco administers most of the territory and disputes it. CoreUI omits `EH`; Wikidata's item for the code carries no flag at all. |
| `PS` | Palestine | contested recognition | Rendering asserts a recognition position; rendering some contested entities and not others asserts a comparison. |
| `TW` | Taiwan | contested recognition | The atlas carries `TW` because it runs its own entry control — a statement about entry, not statehood. |
| `XK` | Kosovo | contested recognition | Not an ISO 3166-1 assignment. Packs draw it because they follow CLDR and Unicode, so the image's availability is a software convention. |
| `BQ` | Bonaire, Sint Eustatius and Saba | no single flag | Each island flies its own. The pack ships four files (`BQ`, `BQ-BO`, `BQ-SA`, `BQ-SE`) and `BQ.svg` is byte-identical to `BQ-BO.svg` — Bonaire's flag under another name. |
| `GP` | Guadeloupe | image identifies another jurisdiction | Byte-identical to `FR.svg`. |
| `PM` | Saint Pierre and Miquelon | image identifies another jurisdiction | Byte-identical to `FR.svg`. |
| `RE` | Réunion | image identifies another jurisdiction | Byte-identical to `FR.svg`. Not wrong — the tricolour is what is flown — but it does not discriminate. |
| `SJ` | Svalbard and Jan Mayen | image identifies another jurisdiction | Byte-identical to `NO.svg`. `flag-icons` makes the opposite choice. |
| `UM` | US Minor Outlying Islands | image identifies another jurisdiction | Byte-identical to `US.svg` in both packs; also no permanent civilian population. |
| `BL` | Saint Barthélemy | source chose among competing flags | The two packs disagree: a local emblem here, the tricolour in `flag-icons`. |
| `GF` | French Guiana | source chose among competing flags | Local flag here, tricolour in `flag-icons`. |
| `MF` | Saint Martin | source chose among competing flags | Local emblem here, tricolour in `flag-icons`. |
| `WF` | Wallis and Futuna | source chose among competing flags | Local flag here, tricolour in `flag-icons`. |
| `YT` | Mayotte | source chose among competing flags | Local emblem here, tricolour in `flag-icons`. Wikidata's own choice is titled "(local)". |
| `NC` | New Caledonia | source chose among competing flags | Both packs draw the Kanak flag rather than the tricolour. Agreement between two dependencies is not neutrality. |
| `SH` | Saint Helena, Ascension and Tristan da Cunha | one code, several systems | The atlas record says it: `SH` is three controls behind one ISO code. One image can stand for at most one of them. |
| `BV` | Bouvet Island | no resident population | Uninhabited; listed only for enumeration completeness. |
| `GS` | South Georgia and the South Sandwich Islands | no resident population | No permanent resident population; presence is by permit only. |
| `HM` | Heard Island and McDonald Islands | no resident population | Uninhabited; no migration route of any kind. |
| `TF` | French Southern Territories | no resident population | A "territory without permanent population nor elected officials"; no residence route. |

Two properties of this list are worth stating because they are easy to lose.

**The reason string is the load-bearing part.** It is what stops the list being
quietly edited by someone who reads an absence as a bug, and it is what a
reviewer reads when they ask why Taiwan has no flag. A test asserts every reason
is over 120 characters — not because length is a virtue, but because a
cross-reference like "see `GP`" is exactly what someone in a hurry will not
follow.

**Suppression removes the duplicates, and that is checkable.** After suppression
the 228 shipped images are pairwise distinct, so no row can be mistaken for
another by its picture. A test asserts it, and it will fail the moment a
duplicate returns.

---

## 5. Coverage today

Computed by `flagCoverage(ALL_JURISDICTIONS)` and asserted in the test suite.

| | |
|---|---|
| Jurisdictions in the atlas | 249 |
| `available` — an asset is vendored | **228** (91.6%) |
| `suppressed` — a decision, with a reason | **21** |
| `unsourced` — a gap, neither asset nor decision | **0** |
| Jurisdictions rendering a name | **249** (100%) — the number that matters |

`suppressed` and `unsourced` are different facts and the API keeps them apart.
Conflating them is how a gap silently becomes a statement: "Taiwan has no flag
here" is a considered position, "we never got round to Taiwan" is a bug, and a
consumer that cannot tell them apart will report one as the other.

The three states are computed from two **independent** inputs — the list of
assets actually on disk and the suppression decisions — so `unsourced` is a state
the data can reach. Defining availability as "not suppressed" would make it
unreachable, which is to say it would make the gap report incapable of reporting
a gap. The test suite reads the real directory and asserts `FLAG_ASSET_CODES`
matches it file for file, so the constant cannot drift away from the bytes.

`FlagCoverageReport.examined` reports how many jurisdictions, asset codes and
suppression records the run actually read. A report that examined nothing and a
report that examined everything and found nothing wrong must not print the same
thing.

Adding a 250th jurisdiction to the atlas without either vendoring its flag or
recording a suppression produces an `unsourced_jurisdiction` finding naming the
code, and the test suite fails.

---

## 6. Rendering

Once `index.ts` re-exports the module — see item 3 of
[§8](#8-what-is-not-done-yet) — this is the whole of it:

```ts
import { ALL_JURISDICTIONS, flagPresentation } from '@meridian/atlas';

for (const jurisdiction of ALL_JURISDICTIONS) {
  const flag = flagPresentation(jurisdiction, { basePath: '/flags' });

  // The name is always rendered, in the reader's locale. Always.
  // The image, when there is one, sits beside it and is decorative.
  //
  //   <li>
  //     {flag.image && (
  //       <img src={flag.image.src} alt={flag.image.alt}
  //            width={24} style={{ aspectRatio: '3 / 2' }} />
  //     )}
  //     <span>{locale === 'es' ? flag.name.es : flag.name.en}</span>
  //   </li>
}
```

Notes an implementer will otherwise have to rediscover:

- **`basePath` is where *you* serve the directory.** Default `/flags`. The assets
  are not published to npm and are not imported by any module, so an application
  must copy `packages/atlas/assets/flags/*.svg` into its own `public/` (or serve
  the directory) as a build step. `FLAG_ASSET_DIRECTORY` is the repo-relative
  source path for that script.
- **Reserve space with `aspect-ratio: 3 / 2`,** not with fixed pixel dimensions.
  Every file declares a 3:2 `viewBox`, but the intrinsic units vary (513×342,
  512×341.333, 900×600, 22.5×15 and others).
- **Do not re-encode to PNG.** SVG is smaller here, scales, and leaves the four
  flags Commons marks `{{noresize}}` at their correct proportions.
- **Do not build a sprite sheet of all 228.** One request, but also one cache
  entry invalidated whenever any single flag changes — and flags change.
- **Never serve from a third-party CDN.** `flagcdn` is convenient, has no licence
  grant at all, and would send an applicant's IP address and `Referer` to a
  stranger every time they looked at a jurisdiction.

### Cost

| | raw | gzip |
|---|---|---|
| `dist/flags.js` as emitted (doc comments retained) | 27,864 B | 10,350 B |
| the same with comments stripped, as a bundler would | 17,345 B | 6,118 B |
| the 228 SVGs, all of them | 148,728 B | 39,050 B |

The SVG bytes are **not** in the JavaScript bundle. No TypeScript in
`@meridian/atlas` imports an SVG, so nothing puts artwork into an application
bundle; the files are static assets, cached individually, fetched only for the
flags a route renders. A jurisdiction detail page fetches one file — 481 bytes at
the median.

The module itself is the real cost, and it is data an application either uses or
does not: 228 two-letter strings, 21 suppression records with their prose, one
provenance record. `packages/atlas/package.json` declares no `"sideEffects"`
field; adding `"sideEffects": false` would let a bundler drop this module
entirely from applications that never call `flagPresentation`. That is a
one-line manifest change and it was deliberately left to whoever owns the
manifest, because it affects every module in the package and not just this one.

---

## 7. Updating the artwork

Because the pack is vendored rather than depended on, nothing will tell you a new
version exists. When you update:

1. Download the tarball and check its `sha512` against the value the registry
   publishes for that exact version. Do not skip this; it is the only integrity
   check in the chain.
2. Read `package/LICENSE` again. Do not carry the old licence record forward — a
   copyright line or an SPDX identifier can change between versions, and a stale
   licence record is worse than none because it reads as verified.
3. Copy `3x2/XX.svg` for every atlas code that is **not** in `FLAG_SUPPRESSIONS`,
   unmodified, and copy `LICENSE` beside them.
4. Recompute `FLAG_ASSET_TREE_SHA256`, `FLAG_ASSET_LICENCE_SHA256` and
   `FLAG_ASSET_TOTAL_BYTES`, and update `FLAG_ASSET_SOURCE.version`,
   `.tarballIntegrity` and `.verifiedOn`. `verifiedOn` is the day a human opened
   the licence file — never bump it for a file you did not open.
5. Re-run the duplicate check. A new version can introduce a byte-identical pair
   that the suppression list does not cover, or make an existing suppression
   reason untrue. The test asserts all 228 shipped images are distinct, so it
   will tell you.
6. `cd packages/atlas && pnpm exec tsc --noEmit && pnpm exec vitest run`.

Changing the suppression list is a separate act with its own review: add or
remove a record, write the reason, set `decidedOn` to the day the decision was
made, and update the table in [§4](#4-the-suppression-list).

---

## 8. What is not done yet

Stated plainly, because a notices file that describes an intention as a fact is
worse than one that admits a gap.

1. **No page of the running application displays the notice.** AGPL-3.0-only §13
   requires a modified version users interact with remotely to "prominently
   offer" them the Corresponding Source, and the research brief reads that as
   requiring the flag notice to be reachable from the deployed service rather
   than only from the git tree. Today it is reachable only from this file on
   GitHub. `FLAG_ATTRIBUTION_NOTICE` exists so a licences route can print it;
   that route does not exist. **This must be built before flags appear on a
   deployed surface.**
2. **No application renders a flag.** `packages/atlas` exposes the data; no
   surface in `apps/` consumes it, and no build step copies the assets into an
   application's `public/`.
3. **`packages/atlas/src/index.ts` does not re-export `flags.ts` yet.** Until it
   gains `export * from './flags.js';`, nothing outside the package can import
   any of this. The tests import the module directly, which is why they pass.
4. **Nothing here was tested in a browser.** No component was built, no rendering
   was observed, no screen reader was run. The accessibility rules in
   [§3](#3-the-posture) are derived from WCAG text and from measured properties
   of the assets, not from use.
5. **`packages/atlas/package.json` still declares `"files": ["dist"]`.** The
   package is `private: true` and is never published, so this is inert today; if
   it is ever published, `"assets"` must be added or the artwork will be missing
   from the tarball while the code still points at it.

---

## 9. Open questions for counsel

None of this file is legal advice, and these three are the points where an agent's
evidence-gathering stops being enough.

1. **What AGPL §13's "prominently offer" requires of a deployed service** in
   respect of a vendored MIT component. Item 1 of [§8](#8-what-is-not-done-yet)
   assumes a linked licences page satisfies it. That is a judgement, not a
   finding.
2. **Whether any of the non-copyright restrictions Commons records reach a site
   published from Mexico.** The restrictions exist and we know which of our flags
   carry which tags. Whether displaying a small image of a particular flag on a
   Mexican-operated site engages another country's law is a conflicts question
   this repository has not attempted.
3. **Whether the packager held the rights it granted, flag by flag.** The MIT
   grant is blanket and there is no per-file provenance record, so this cannot be
   verified from outside. It is a residual risk, not zero.

Two further limits are recorded in the research brief and are inherited here: it
could not be established whether AGPLv3 may incorporate CC BY-SA 4.0 material
(which is why no share-alike artwork was taken), and the `EH`, `TW`, `PS` and
`XK` renderings were never verified against a primary source — which is one
reason all four are suppressed rather than merely flagged.

---

## 10. Rejected sources, one line each

Full reasoning in the research brief §5 and §8.

| Source | Licence | Why not |
|---|---|---|
| `flag-icons` 7.5.0 | MIT | Kept as the documented fallback, and the better artefact for accurate depiction; ~10× the bytes and six more duplicate images for our codes. |
| CoreUI Icons Free | **CC0 1.0** | Covers only 198 of our 249. The 51 missing are almost entirely the territories the atlas exists to hold. |
| `flagpack-core` 2.1.0 | MIT | No Kosovo at all — no file under any name. The atlas deliberately carries `XK`. |
| Twemoji assets | CC BY 4.0 (graphics) | Workable, but a second licence for no gain. |
| Native emoji glyphs (`🇪🇸`) | n/a | Segoe UI Emoji ships no flag glyphs, so a Windows reader sees the two letters of the country code — the exact thing `apps/web/components/LocaleSwitch.tsx` already argues reads as one more jurisdiction. |
| OpenMoji | CC BY-SA 4.0 | Share-alike whose declared GPL compatibility names GPLv3; AGPLv3 is absent from Creative Commons' compatible-licences list. Also redrawn in a house style. |
| `flagcdn` / flagpedia.net | **none** | An assertion that flags are public domain is not a grant. Also a third-party runtime request per page view. |
| `hampusborgos/country-flags` | **none** | No `LICENSE` file; the GitHub API reports `license: null`. |
| Wikimedia Commons, per file | mixed | Per-file and not uniform: of 247 atlas codes, 237 public domain, 7 CC0, and one each CC BY 2.5, CC BY-SA 4.0 and OGL-om 1.0. A per-file audit with a residue that has no CC0 answer at all. |
