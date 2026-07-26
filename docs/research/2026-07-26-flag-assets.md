# Flag assets for the atlas — licence, coverage and posture

**Sourcing brief. Read before adding any flag image to any Meridian surface.**

- Researched: 2026-07-26. Every figure below was measured on that date from the
  artefact named, not recalled. The commands are in
  [§1](#1-how-every-number-here-was-obtained) so a reviewer can re-run them.
- Author: an agent, not counsel. Licence *identification* here is evidence-gathering —
  I read the licence file and say what it says. Licence *compatibility* is a legal
  question and [§9](#9-what-agpl-30-only-obliges-us-to-carry) marks where the answer
  stops being something I can establish.
- **This is not a jurisdiction brief.** The other files in this directory are legal
  research written immediately before encoding a country. This one is asset sourcing.
  It encodes no law and no pathway is built from it.
- Nothing here has been implemented. This is a brief an implementer can act on.

---

## 0. Bottom line

1. **CC0 for all 249 of our jurisdictions is not achievable from any ready-made
   source.** Exactly one candidate is genuinely CC0 — CoreUI Icons Free flags — and it
   covers **198 of our 249 codes**, missing 51, named in [§5.3](#53-coreui-icons-free-flags-cif--the-only-genuine-cc0-set).
   The 51 are almost entirely the territories a migration atlas exists to hold:
   Puerto Rico, Guam, the Cayman Islands, Gibraltar, Greenland, the Falklands,
   Palestine, Western Sahara, Macao. A CC0-only rule buys licence purity at the cost
   of the part of the atlas that is hardest to replace.
2. **Nothing widely used is CC0.** `flag-icons`, `flagpack` and `country-flag-icons`
   are **MIT**; Twemoji graphics are **CC BY 4.0**; OpenMoji is **CC BY-SA 4.0**.
   Reporting any of these as CC0 because it is free would be wrong.
   [§5](#5-source-by-source-what-the-licence-actually-says) gives the exact text and
   where it is stated for each.
3. **Two sources have no licence at all.** `flagcdn`/flagpedia.net and
   `hampusborgos/country-flags` each *assert* that flags are public domain. An
   assertion of fact about copyright status is not a grant of rights, and the GitHub
   API reports `license: null` for the latter. Neither should be adopted.
4. **Wikimedia Commons is per-file and is not uniform.** Of the 247 atlas codes for
   which Wikidata carries a flag image, the licence tags are 237 `Public domain`,
   **7 `CC0`, 1 `CC BY 2.5`, 1 `CC BY-SA 4.0` and 1 `OGL-om 1.0`** — and the two
   non-CC0-compatible ones (Saint Barthélemy, Cocos (Keeling) Islands) are territories,
   again. **230 of the 247 also carry Commons' `{{Insignia}}` warning**, which says in
   terms that use of flags "is restricted in many countries" and that those
   restrictions "are independent of the copyright status."
5. **A flag is not a jurisdiction identifier, and this is measurable.** In
   `flag-icons`, 15 of our 249 codes resolve to only 4 distinct images — BL, FR, GF,
   GP, MF, PM, RE, WF and YT are byte-identical; so are GB/SH, AU/HM and UM/US. The
   pack ships **238 distinct images for 249 jurisdictions**. `country-flag-icons`
   ships 244. Either way the jurisdiction name must carry the meaning.
6. **The two best candidates disagree with each other about nine of our
   jurisdictions**, and each disagreement is a political choice, not a bug.
   `flag-icons` draws the French tricolour for Mayotte, Saint Barthélemy, Saint Martin
   and Wallis and Futuna; `country-flag-icons` draws local emblems. See
   [§7](#7-flags-are-political).
7. **Recommended posture:** the jurisdiction *name* is always present and always the
   carrier of meaning; flags appear on exactly one surface (atlas browse), never on
   engine output; and a **suppression list in data, with a reason per code**, renders
   the name alone where a flag would assert recognition we are not in a position to
   assert. [§7.4](#74-the-posture-i-recommend) defends this and states the cheaper
   alternative — no flags anywhere — which is also defensible.
8. **Recommended source:** primary `country-flag-icons@1.6.20`, **MIT**; fallback
   `flag-icons@7.5.0`, **MIT**. Same licence on both, so swapping one for the other
   never changes the notices we owe. [§8](#8-recommendation) gives the reasoning,
   including the one respect in which the fallback is the better artefact.
9. **AGPL-3.0-only does not erase the MIT notice.** AGPL §7(b) expressly permits
   added material to carry a requirement to preserve author attributions, so the MIT
   copyright line and permission notice must ship — and, because of AGPL §13, must be
   reachable from the running network service, not only from the repository.

---

## 1. How every number here was obtained

Nothing below is from memory. Each source was enumerated from its own published
artefact and diffed against the real atlas.

**The denominator** — read from the built package, not parsed from source:

```bash
cd packages/atlas
node -e "import('./dist/index.js').then(m => console.log(m.ALL_JURISDICTIONS.length))"
# 249
```

**Each candidate's coverage** — the file list came from the GitHub trees API
(`/git/trees/<branch>?recursive=1`, `truncated: false` verified on every call) or from
the published npm tarball, and was intersected with those 249 codes.

**Bundle sizes** — measured from the npm tarballs `flag-icons-7.5.0.tgz` and
`country-flag-icons-1.6.20.tgz`, restricted to our 249 codes, with `zlib.gzipSync`
and `zlib.brotliCompressSync` over the concatenation.

**Commons licences** — Wikidata SPARQL for items carrying both `P297` (ISO 3166-1
alpha-2) and `P41` (flag image), then the Commons API
(`action=query&prop=imageinfo&iiprop=extmetadata`) for `LicenseShortName` and
`Restrictions` on each resulting file, in batches of 25.

**Duplicate artwork** — SHA-1 over each SVG with the jurisdiction code string
normalised out, so that a differing `id="flag-icons-xx"` attribute could not hide a
genuine duplicate.

---

## 2. The denominator is 249, and it is not 195

`scripts/atlas-coverage.mjs` states this at the top of its own report and it governs
everything here: the atlas holds **249 jurisdictions**, assembled from five region
files and deduplicated by ISO 3166-1 alpha-2 code — africa 60, americas 57, asia 50,
europe 53, oceania 29.

Three properties of that list matter for flags specifically.

**It includes places with no permanent population.** Bouvet Island (BV), Heard and
McDonald (HM), the French Southern Territories (TF), the US Minor Outlying Islands
(UM), South Georgia and the South Sandwich Islands (GS). A flag next to these is at
best decorative and at worst suggests a residence system that does not exist.

**It includes one code that is not ISO 3166-1 at all.** `XK` for Kosovo is a
user-assigned code, adopted by the EU, the IMF and SWIFT, and `packages/atlas/src/regions/europe.ts`
says so in its header. Any flag set keyed strictly to ISO 3166-1 will not have it.
This is the single most useful discriminator between the candidates: `flagpack` has
no XK; `flag-icons`, `country-flag-icons`, `flagcdn`, Twemoji and OpenMoji all do.

**It excludes about seven entry-controlling authorities that have no code** —
Somaliland, Northern Cyprus, Abkhazia, South Ossetia, the UK Sovereign Base Areas,
Transnistria and Mount Athos — each recorded as a note on the nearest coded entry
rather than given an invented code. A flag column therefore cannot represent them
even in principle, and a UI built as "one row, one flag" will silently reassert their
absence. That is an argument for the name being the row's identity, developed in
[§7](#7-flags-are-political).

---

## 3. Coverage against our 249, measured

| Source | Version / ref checked | Two-letter codes shipped | Covers of our 249 | Missing |
|---|---|---|---|---|
| `flag-icons` | 7.5.0 (npm, published 2025-05-29) | 257 | **249** | none |
| `country-flag-icons` | 1.6.20 (npm, published 2026-07-01) | 257 | **249** | none |
| `flagcdn` | `/en/codes.json`, fetched 2026-07-26 | 252 | **249** | none |
| Twemoji (`jdecked/twemoji`) | `main`, 2026-07-26 | 259 flag SVGs | **249** | none |
| OpenMoji (`hfg-gmuend/openmoji`) | `master`, 2026-07-26 | 259 regional-indicator flags | **249** | none |
| Unicode RGI flag sequences | Emoji 17.0, `emoji-sequences.txt` dated 2025-07-25 | 260 sequences | **249** | none |
| `hampusborgos/country-flags` | `main`, 2026-07-26 | 251 | **249** | none |
| `flagpack-core` | 2.1.0 (npm, published 2025-12-01) | 247 | **246** | **BQ, GB, XK** |
| CoreUI Icons Free flags (CIF) | `main`, 2026-07-26 | 198 | **198** | **51 — see §5.3** |
| Wikimedia Commons (via Wikidata `P41`) | queried 2026-07-26 | n/a — per file | **247** have a flag image | **BQ, EH** |

Two notes on the table, because both are more interesting than the number.

**`flagpack`'s three misses are structural, not accidental.** It ships `GB-UKM` rather
than `GB`, and splits `BQ` into `BQ-BO`, `BQ-SA` and `BQ-SE`. Those two are alias
problems an implementer can solve in a mapping table. `XK` is simply absent — there is
no file for Kosovo under any name, verified by grepping the whole tree for `xk` and
`kosovo`. That is a real gap, and it is the reason `flagpack` is not recommended.

**Commons' two misses are both substantive facts, not data quality.** `BQ` has no
single flag because Bonaire, Sint Eustatius and Saba each fly their own — which is
exactly why `flagpack` and `country-flag-icons` both split it. And the Wikidata item
that carries `P297 = EH` carries no `P41`: the flag associated with the territory is
the Sahrawi Arab Democratic Republic's, and which item it hangs from is itself the
disputed question. Both are worth carrying into the implementation as suppression
entries rather than treating as gaps to fill.

---

## 4. Is CC0 achievable? No — and here is the precise shape of the "no"

The request was CC0 specifically. The honest answer:

- **Genuinely CC0, blanket:** CoreUI Icons Free flags only. **198 / 249.**
- **CC0 per file, on Commons:** 7 of our codes (GG, GS, IM, IO, NF, PF, YT).
- **Public-domain-tagged per file, on Commons:** 237 of our codes. Public domain is
  not CC0 — it is a *status*, asserted by a Commons contributor applying a template,
  not a *dedication* by a rights holder — but for our purposes it imposes no
  downstream obligation, so it is CC0-equivalent in effect.
- **Permissive but not CC0:** `flag-icons` (MIT), `country-flag-icons` (MIT),
  `flagpack` (MIT), Twemoji graphics (CC BY 4.0), Oman's flag on Commons (OGL-om 1.0).
- **Share-alike:** OpenMoji (CC BY-SA 4.0), and one Commons file — Cocos (Keeling)
  Islands, CC BY-SA 4.0.
- **No licence stated at all:** `flagcdn`/flagpedia.net, `hampusborgos/country-flags`.

A CC0-only assembly is therefore possible only by mixing: CoreUI for 198, Commons
per-file for most of the remainder, and then a residue — at minimum Saint Barthélemy
(CC BY 2.5), Cocos (CC BY-SA 4.0), Oman (OGL-om 1.0), Bonaire (no single flag) and
Western Sahara (no image on the coded item) — with no CC0 answer at all. That is a
per-file audit of roughly 51 files, a mixed visual style across a single list, and a
maintenance burden that recurs every time a flag changes. It buys nothing that MIT
does not already give us, because **both CC0 and MIT are compatible with the GNU GPL**
(FSF licence list). The only practical difference is that MIT requires a notice and
CC0 does not, and we owe a notices file anyway.

**Recommendation: do not pursue CC0.** Take MIT, state it exactly, and ship the
notice. Say so plainly wherever the CC0 requirement was recorded, rather than letting
"free" quietly stand in for "CC0".

---

## 5. Source by source: what the licence actually says

### 5.1 `flag-icons` — MIT, blanket

- **Licence:** MIT. `LICENSE` at the repository root opens `The MIT License (MIT)` /
  `Copyright (c) 2013 Panayiotis Lipiridis`.
- **Where stated:** `LICENSE` at the repository root, and `"license": "MIT"` in
  `package.json` (confirmed on the npm registry for 7.5.0).
- **Blanket or per-file:** blanket, over the whole repository. There is no per-file
  licence header and no NOTICE file. The README contains **no licence statement at
  all** — it credits "the now deleted collection of SVG flags by koppi" and nothing
  else. So the repository-root MIT is the entire grant, and there is no per-flag
  provenance record to audit.
- **Coverage:** 249 / 249, including XK.
- **Caveat that applies to every MIT flag pack:** an MIT grant conveys whatever
  rights the packager holds in the *drawing*. It cannot and does not speak to
  emblem-protection statutes, which are a separate body of law and are the subject of
  [§7.2](#72-non-copyright-restrictions-are-real-and-they-are-tallied).

### 5.2 `country-flag-icons` — MIT, blanket

- **Licence:** MIT. `LICENSE` opens `(The MIT License)` /
  `Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>`.
- **Where stated:** `LICENSE` at the repository root, `"license": "MIT"` in
  `package.json` (confirmed on npm for 1.6.20). The README does **not** state a
  licence; it does state provenance: "I used Google image search for flag references,
  and various country flag packs (including FlagKit / flagpack) for design ideas."
- **Blanket or per-file:** blanket.
- **Coverage:** 249 / 249 in both `3x2` and `1x1`, including XK.
- **Note on provenance:** that README sentence is a weaker provenance claim than
  `flag-icons` or `hampusborgos` make. The flags are redrawn approximations rather
  than renderings traced to a published specification. For a chip beside a name that
  is acceptable; for anything that purports to depict a national symbol accurately it
  is not, and [§8](#8-recommendation) turns on that distinction.

### 5.3 CoreUI Icons Free flags (CIF) — the only genuine CC0 set

- **Licence:** **CC0 1.0 Universal**, for the flags specifically. The repository
  `LICENSE` has two parts: a first section putting the general icons under CC BY 4.0,
  and a second headed `CoreUI Icons Brand and Flags License` which reproduces the
  full CC0 1.0 Universal text.
- **Where stated:** `LICENSE` at the root of `coreui/coreui-icons`. Note the GitHub
  API reports the repository licence as `NOASSERTION`, because the file is a
  composite — so the licence must be read, not taken from metadata.
- **Blanket or per-file:** blanket over the flags directory
  (`svg/flag/cif-<code>.svg`).
- **Coverage: 198 / 249.** The **51 missing** codes are:

  > AI, AS, AW, AX, BL, BM, BQ, BV, CC, CW, CX, EH, FK, FO, GF, GG, GI, GL, GP, GS,
  > GU, HM, IM, IO, JE, KY, MF, MO, MP, MQ, MS, NC, NF, PF, PM, PN, PR, PS, RE, SH,
  > SJ, SX, TC, TF, TK, UM, VG, VI, VU, WF, YT

  Fifty of those are territories and dependencies; the fifty-first, Vanuatu, appears
  to be a plain omission. Palestine and Western Sahara are both absent. Hong Kong,
  Taiwan and Kosovo are all present. It is a sovereign-states-plus set, and the
  territories are the part of our atlas a generic set will always handle worst.

### 5.4 `flagpack` (`flagpack-core`) — MIT, blanket, but no Kosovo

- **Licence:** MIT, `Copyright (c) 2021 Yummygum`, in `LICENSE` at the repository
  root and `"license": "MIT"` in `package.json`.
- **Blanket or per-file:** blanket.
- **Coverage:** 246 / 249. `GB` ships as `GB-UKM`; `BQ` ships as three island files;
  **`XK` does not exist**. Three sizes are shipped (`svg/s`, `svg/m`, `svg/l`) with
  drawn detail rather than scaled copies.
- **Why not recommended:** the XK gap is a real hole in an atlas that deliberately
  carries XK, and closing it would mean introducing a foreign asset into an otherwise
  uniform set.

### 5.5 `flagcdn` / flagpedia.net — no licence

- **Licence:** **none stated.** flagpedia.net's about page says "Flag images are in
  the public domain (exempt from copyright). They are completely free for
  non-commercial and even commercial use." The API page adds only that "we appreciate
  backlink to https://flagpedia.net."
- **What that is:** a *claim about the copyright status of the underlying flags*, made
  by the site operator, not a licence grant covering the specific renderings the CDN
  serves. It is blanket where the underlying question is per-file, and it is
  contradicted for at least two of our codes by Commons' own per-file tags
  ([§5.7](#57-wikimedia-commons--per-file-and-genuinely-mixed)).
- **Two further reasons to reject it regardless of licence:** it is a third-party
  runtime dependency on the critical path of a page, and it would send a request —
  and therefore an IP address and a Referer — to a third party every time an applicant
  looks at a jurisdiction. That is a privacy cost this product should not pay for
  decoration.
- **Coverage:** 249 / 249 (252 two-letter codes).

### 5.6 `hampusborgos/country-flags` — no licence file

- **Licence:** **none.** There is no `LICENSE` file (HTTP 404) and the GitHub API
  reports `license: null`. The README states: "The flags are not under copyright
  protection since flags are in public domain (there may be other restrictions on how
  the flag can be used though)."
- **Assessment:** the same category error as flagcdn — an assertion about the
  underlying designs, not a grant covering these renderings. To its credit it is the
  only source that volunteers the non-copyright-restriction caveat, and it is
  explicit that "the source files were taken from Wikimedia Commons," which makes it
  a useful cross-check but not an adoptable dependency.
- **Coverage:** 249 / 249 (251 two-letter codes), including XK, which the README calls
  out by name.

### 5.7 Wikimedia Commons — per-file, and genuinely mixed

Queried by taking, for each atlas code, the flag image (`P41`) on the Wikidata item
bearing that ISO code (`P297`), then reading the Commons licence tag for that file.
247 of our 249 codes resolved; BQ and EH did not, for the reasons in
[§3](#3-coverage-against-our-249-measured).

| Commons `LicenseShortName` | Files | Codes |
|---|---|---|
| Public domain | 237 | — |
| CC0 | 7 | GG, GS, IM, IO, NF, PF, YT |
| CC BY 2.5 | 1 | BL (`Flag of Saint Barthélemy (local).svg`) |
| CC BY-SA 4.0 | 1 | CC (`Flag of the Cocos (Keeling) Island.svg`) |
| OGL-om 1.0 | 1 | OM (`Flag of Oman.svg`) |

This is the point the assignment flagged, confirmed with numbers: **"Commons flags are
public domain" is true of most files and false of some, and it is a per-file fact.**
It is also per-*rendering*: a different SVG of the same flag can carry a different
tag, so a result obtained for one filename does not transfer to another.

Two of these deserve a line each. `OGL-om 1.0` is the Open Government Licence –
Oman 1.0; it permits commercial use and requires acknowledgement of the source, but
it **excludes government emblems from the data it licenses** — which is awkward for a
flag, and enough on its own to prefer a redrawn version. And the Wikidata-chosen
images for BL and YT are both titled "(local)": for Saint Barthélemy and Mayotte the
officially flown flag is the French tricolour, and Wikidata's choice of the local
emblem is itself the political judgement discussed in [§7.3](#73-where-the-candidates-disagree-with-each-other).

### 5.8 Twemoji flag glyphs — two different things, only one of which is CC BY 4.0

These must not be conflated.

**(a) Shipping Twemoji's SVG assets.** The maintained fork `jdecked/twemoji` ships
4,009 SVGs, of which 259 are regional-indicator flag pairs covering all 249 of our
codes. **Graphics are CC BY 4.0; code is MIT** — stated in the README ("Graphics
licensed under CC-BY 4.0", "Code licensed under the MIT License") and reproduced in
full in `LICENSE-GRAPHICS`. Blanket. The README also states what attribution they
accept: "a mention in a project README or an 'About' section or footer on a website."

**(b) Rendering the emoji characters themselves** — putting `🇪🇸` in the DOM and
letting the reader's font draw it. This ships no asset and needs no licence, and it
is the option most likely to be reached for because it looks free. It is not
recommended, for a reason that has nothing to do with licensing: **on Windows, the
Segoe UI Emoji font contains no flag glyphs, so a flag emoji renders as the two
letters of the country code.** Our reader would see `ES` where a Mac reader sees a
flag — the two-letter code being the exact thing `apps/web/components/LocaleSwitch.tsx`
already argues would "read as one more jurisdiction". A visual element that silently
becomes a different visual element on one major platform is not a component.

Unicode's own list is worth recording because it is the most neutral enumeration
available: `emoji-sequences.txt` for Emoji 17.0 (dated 2025-07-25) carries 260
`RGI_Emoji_Flag_Sequence` entries, and **all 249 of our codes are among them,
including EH, PS, TW and XK.** Unicode's inclusion is a statement about interchange,
not about recognition, and it is a reasonable neutral reference point for [§7](#7-flags-are-political).

### 5.9 OpenMoji — CC BY-SA 4.0, share-alike

- **Licence:** CC BY-SA 4.0, stated on the project FAQ, with a required attribution
  string: "All emojis designed by OpenMoji – the open-source emoji and icon project.
  License: CC BY-SA 4.0". Blanket.
- **Coverage:** 249 / 249 (259 regional-indicator flags).
- **Why not recommended, on two independent grounds.**
  - *Licence.* This repository is **AGPL-3.0-only**. Creative Commons declares CC BY-SA
    4.0 one-way compatible with **GPLv3** — and its compatible-licences page lists
    exactly two licences, the Free Art License 1.3 and GPLv3. **AGPLv3 is not on that
    list.** The FSF states the same one-way compatibility, naming GPL version 3. I
    could not find any statement extending it to AGPLv3, so combining share-alike art
    into this repository sits on an unresolved question. Taking MIT art costs nothing
    and removes the question entirely.
  - *Fidelity.* OpenMoji flags are redrawn in the project's house style rather than
    rendered to specification. Inspecting the Spanish flag (`color/svg/1F1EA-1F1F8.svg`)
    shows the project palette substituted for the flag's colours and a simplified
    line-drawn coat of arms, on a 72×72 canvas the flag does not fill. For an emoji set
    that is the point; for a jurisdiction list it means the artwork is a deliberate
    reinterpretation of a national symbol, which is a poor fit for a product whose
    posture is not to restate things it cannot source.

---

## 6. Flags are not identifiers — and the shipped data proves it

This is usually argued from principle. It can be measured, so it is measured here.

Hashing each pack's SVG for our 249 codes, with the code string normalised out so that
a differing element `id` cannot mask a genuine duplicate:

| Pack | Distinct images for 249 codes | Byte-identical groups |
|---|---|---|
| `flag-icons` 7.5.0 (4x3) | **238** | `BL FR GF GP MF PM RE WF YT` · `GB SH` · `AU HM` · `UM US` |
| `country-flag-icons` 1.6.20 (3x2) | **244** | `FR GP PM RE` · `NO SJ` · `UM US` |

Nine of our jurisdictions render as an identical image to France in `flag-icons`. Saint
Helena renders as the United Kingdom. Heard and McDonald renders as Australia. The US
Minor Outlying Islands render as the United States in both packs. These are not
errors — several of those territories genuinely fly the metropolitan flag — but they
mean **a flag cannot be the thing that tells a reader which row they are looking at.**

Colour alone is weaker still. Restricting to the simple flags in
`country-flag-icons` — those under 1,500 bytes, with two to four fill colours — and
grouping by identical palette produces, among our own codes:

- `CR DO IS KH LA NP SK TH TW WS` — blue, red, white
- `AT BH GL JP TN TO TT YE` — red, white
- `CN DE KG MK VN` — red, yellow
- `GN GW LT ST VU` — green, red, yellow
- `HU IR JO KW` — green, red, white
- `FR GP PM RE` — blue, red, white in the French arrangement
- `TK XK` — blue, yellow, white

At the 16–24 px a chip actually occupies, palette is most of what a reader perceives.

**The accessibility rule that follows is not a nicety, it is WCAG Level A twice
over.** SC 1.4.1 Use of Color: "Color is not used as the only visual means of
conveying information, indicating an action, prompting a response, or distinguishing a
visual element." SC 1.1.1 Non-text Content: non-text content must have "a text
alternative that serves the equivalent purpose."

Concretely, for an implementer:

1. **The jurisdiction name is always rendered, in the reader's locale.**
   `Jurisdiction.name` is `{ en, es }` for all 249; use `pick`. The flag is never the
   label and never the only content of a cell, a chip or a link.
2. **The flag image is decorative and marked as such** — `alt=""` on an `<img>`, or
   `aria-hidden="true"` with `focusable="false"` on an inline `<svg>`. Giving it the
   country name as its alternative text makes a screen reader announce the name twice,
   which is the same defect the repository already fixed once when it removed the
   dual-language `bi()` rendering.
3. **Removing every flag must leave the product functionally identical.** If a screen
   is unusable without flags, the flags were carrying meaning and the design is wrong.

---

## 7. Flags are political

### 7.1 What our atlas deliberately contains

`packages/atlas/src/index.ts` records the position in its own module doc, and it is
sharper than most flag sets can accommodate:

- **EH (Western Sahara)** has a code. Every candidate pack that covers it draws the
  Sahrawi Arab Democratic Republic's flag — verified in `country-flag-icons`, whose
  `EH.svg` is the black/white/green tricolour with the red chevron, crescent and star.
  Morocco administers most of the territory and disputes that flag's application to
  it. CoreUI omits EH entirely. Wikidata carries no flag on the item bearing the code.
  Three sources, three different answers, none of them neutral.
- **Somaliland, Northern Cyprus, Abkhazia, South Ossetia and Transnistria have no
  code** and are notes on the nearest coded entry. A flag column cannot show them.
  A UI whose visual grammar is "every row has a flag" therefore renders their absence
  as a positive statement, which is more than the atlas says.
- **TW and PS are contested in different ways and are resolved differently by
  different sources.** Both are in Unicode's RGI set. Both are drawn by `flag-icons`,
  `country-flag-icons`, `flagcdn`, Twemoji and OpenMoji. CoreUI ships TW and omits PS.
  Commons tags both as public domain, and adds `{{noresize}}` to the Palestinian flag.
- **XK** is drawn by everything except `flagpack` — but it is drawn *because* the
  packs follow CLDR and Unicode, not because they took a position, and it is worth
  knowing that the reason we have an XK flag available is a software convention.
- **BQ has no single flag.** Bonaire, Sint Eustatius and Saba each fly their own.
  Whatever we render for BQ is a choice among three.

### 7.2 Non-copyright restrictions are real, and they are tallied

Commons maintains a separate axis from licensing for exactly this. Its
`Commons:Non-copyright restrictions` page defines them as "restrictions on the use of
material which are distinct from copyright; such restrictions may apply to works in
the public domain," and says of flags specifically that they "are often restricted
from being used by parties other than those symbolized."

Across the 247 atlas flag files queried:

| Commons restriction template | Count | Our codes |
|---|---|---|
| `{{Insignia}}` | 230 | — |
| `{{Communist symbol}}` | 9 | AO, CN, CU, CZ, HU, KP, LA, MZ, VN |
| `{{noresize}}` | 4 | AF, IR, PS, SA |
| Russian militarism | 2 | BY, RU |
| Terrorism-related | 1 | AF |
| Trademarked | 1 | CA |
| Israeli flag | 1 | IL |

`{{Insignia}}` reads, in full: "This image shows a flag, a coat of arms, a seal or
some other official insignia. The use of such symbols is restricted in many countries.
These restrictions are independent of the copyright status."

`{{Communist symbol}}` is more specific, and directly relevant to a product whose
users cross borders: it names Georgia, Indonesia, Latvia, Lithuania, South Korea and
Ukraine as jurisdictions restricting display of those symbols, citing an instrument
in each case. Nine of our jurisdictions' flags carry it. Meridian is a website, not a
public event in Riga, and I am not asserting any of these creates liability for us —
that is a question for counsel, and it is in
[§10](#10-what-i-could-not-establish). What they establish is narrower and sufficient:
**"the flag is public domain" resolves the copyright question and no other question,
and at least seven of the flags we would ship are the subject of a live legal
restriction somewhere.**

### 7.3 Where the candidates disagree with each other

The eight jurisdictions on which the two recommended packs differ. The column entries
state what was *measured* — byte-identity with another code's file, or a distinct
file — and name the depicted flag only where inspecting the SVG made it unambiguous:

| Code | `flag-icons` ships | `country-flag-icons` ships |
|---|---|---|
| BL Saint Barthélemy | identical to `FR` | distinct file (a local emblem) |
| GF French Guiana | identical to `FR` | distinct file (yellow/green with red star) |
| MF Saint Martin | identical to `FR` | distinct file (a local emblem) |
| WF Wallis and Futuna | identical to `FR` | distinct file (a local emblem) |
| YT Mayotte | identical to `FR` | distinct file (a local emblem) |
| SH Saint Helena | identical to `GB` | distinct file (a blue ensign with the territory's arms) |
| HM Heard and McDonald | identical to `AU` | distinct file |
| SJ Svalbard and Jan Mayen | distinct file | identical to `NO` |

Neither column is neutral. The tricolour is what is officially flown in the French
overseas collectivities; the local emblems are what residents largely use, and several
have no official status. **We should not be making this choice implicitly, by picking
a dependency.** Whichever pack is adopted, the codes above belong in the suppression
list or in an explicit override with a recorded reason.

New Caledonia is worth naming separately because the two packs *agree* and the
agreement is itself a choice: both render the Kanak flag (green, red and blue with a
yellow disc), not the French tricolour. Two flags are associated with the territory
and which is flown has been a live political question there. Agreement between two
dependencies is not neutrality, and NC belongs on the review list for the same reason
the eight above do.

### 7.4 The posture I recommend

The repository has already decided a smaller version of this question. From
`apps/web/components/LocaleSwitch.tsx`:

> Not an icon, not a flag, not a two-letter code: a flag is a country and a language
> is not, and on a page that prints `ES` and `CA` as jurisdiction chips a two-letter
> language code would read as one more jurisdiction.

That reasoning generalises. The proposed posture, in four rules:

**Rule 1 — The name is the identity; a flag is at most an adornment beside it.** Never
a flag alone, never a flag as the link target's accessible name, never a flag in a
table cell without the name in the same cell. This follows from
[§6](#6-flags-are-not-identifiers--and-the-shipped-data-proves-it) on its own; the
political argument only reinforces it.

**Rule 2 — No flags on any surface that carries engine output.** Anything classified
`assessment` or `advice` — a day count, a checklist, a gap report, a handoff package —
is a document a person may take to a lawyer or a border officer. A flag adds no
information to it and adds a recognition claim to it. Flags belong on browse and
navigation surfaces only: the atlas list, a jurisdiction picker.

**Rule 3 — A suppression list, in data, with a reason per code.** Not a silent
absence, and not a hardcoded `if`. Something of the shape:

```ts
/** Codes for which we render the jurisdiction name alone, and why. */
const FLAG_SUPPRESSED: Readonly<Record<string, string>> = {
  EH: 'sovereignty disputed; every available asset renders the SADR flag, which asserts a position we are not in a position to assert',
  BQ: 'no single flag exists; Bonaire, Sint Eustatius and Saba each fly their own',
  // ...
};
```

The reason string is the load-bearing part. It is what stops the list from being
quietly edited by someone who reads the absence as a bug, and it is what a reviewer
reads when they ask why Taiwan has no flag. My proposed starting membership:

- **Contested recognition:** EH, PS, TW, XK. Rendering any of these asserts a
  recognition position; rendering some and not others asserts a comparison.
- **No single flag:** BQ.
- **Metropolitan-flag duplicates, where the flag would identify the wrong
  jurisdiction:** BL, GF, GP, MF, PM, RE, WF, YT, SH, SJ, UM, HM. These are the
  measured duplicate groups from [§6](#6-flags-are-not-identifiers--and-the-shipped-data-proves-it),
  and the reason here is not political but informational — a row labelled "Mayotte"
  next to the French flag tells the reader something false about which system governs.
- **No permanent population, no residence route:** BV, HM, TF, UM, GS. A flag implies
  a system.

That is on the order of 20 of 249. The remaining ~229 render a flag; the whole 249
render a name.

**Rule 4 — The suppression list is versioned and dated, like a citation.** When it
changes, the change is a reviewed decision with a date, not a dependency bump.

**The alternative, which is also defensible: ship no flags at all.** It removes the
recognition question outright, removes ~20 judgement calls, removes a dependency and
its notices, removes the bundle discussed in [§8](#8-recommendation), and costs
nothing the product needs — the atlas is already navigable as a region-grouped,
alphabetised list of names, and the measurements in
[§6](#6-flags-are-not-identifiers--and-the-shipped-data-proves-it) show the flags would
not be doing much disambiguating work anyway. I recommend the four rules over the
blanket refusal only because a visual anchor genuinely helps a reader scan a 249-row
list, and because a suppression list with reasons is a more honest artefact than a
blanket policy that never has to explain itself. If the product decides the browse
surface does not need the anchor, the blanket refusal is the better answer and this
whole brief resolves to "we looked; we are not shipping flags; here is why."

---

## 8. Recommendation

**Primary: `country-flag-icons@1.6.20` — MIT.**
Exact licence text: `(The MIT License)` / `Copyright (c) 2020 @catamphetamine
<purecatamphetamine@gmail.com>`, stated in `LICENSE` at the repository root and as
`"license": "MIT"` in `package.json`. Blanket over the package.

**Fallback: `flag-icons@7.5.0` — MIT.**
Exact licence text: `The MIT License (MIT)` / `Copyright (c) 2013 Panayiotis
Lipiridis`, stated in `LICENSE` at the repository root and as `"license": "MIT"` in
`package.json`. Blanket over the repository.

Why this pair, and in this order:

1. **Both cover 249 / 249**, including XK. No other pair does.
2. **Identical licence.** Swapping primary for fallback, or taking one flag from the
   other, never changes the notices we owe. That is a deliberate property: a mixed
   MIT/CC-BY set would make the notices file depend on which flags are in the build.
3. **Bundle.** Measured over exactly our 249 codes, from the published npm tarballs:

   | | raw | gzip (bundled) | brotli (bundled) | median file |
   |---|---|---|---|---|
   | `country-flag-icons` 3x2 | 161 kB | **42 kB** | 36 kB | 639 B |
   | `flag-icons` 4x3 | 1,604 kB | 487 kB | 411 kB | 761 B |

   `flag-icons` is roughly ten times larger because it renders detail faithfully — its
   Serbian flag alone is 177 kB, Bolivia 100 kB, Mexico 83 kB, Spain 79 kB, all of
   them coats of arms. That detail is invisible at chip size and is the whole
   difference.
4. **Fewer misleading duplicates.** 244 distinct images versus 238
   ([§6](#6-flags-are-not-identifiers--and-the-shipped-data-proves-it)).

**The one respect in which the fallback is the better artefact, stated plainly.**
`flag-icons` traces to Commons renderings; `country-flag-icons`' own README says its
references came from image search and other packs. If a surface ever needs an accurate
depiction of a national symbol rather than a chip — printed output, a document
attached to a filing — use `flag-icons` for it, or do not use a flag. For the browse
surface this brief is about, the smaller and more differentiated set is the right
trade, and I would rather state that trade than pretend it is not one.

**Not recommended, with the reason in one line each:** `flagpack` (MIT, but no
Kosovo); CoreUI CIF (CC0, but 51 of our codes missing); OpenMoji (CC BY-SA 4.0 — a
share-alike whose declared GPL compatibility names GPLv3 and not AGPLv3); Twemoji
assets (CC BY 4.0 — workable, but a second licence for no gain); native emoji glyphs
(renders as two letters on Windows); flagcdn and `hampusborgos/country-flags` (no
licence grant, and flagcdn is also a third-party runtime request per page view).

### 8.1 Bundle strategy — 249 inline SVGs is not free

Even at 42 kB gzipped, do not inline all 249 into every page. Concretely:

- **Ship only what a route renders.** The atlas browse page may show 249; a
  jurisdiction detail page shows one. Import per code, not a barrel.
- **Do not build a sprite sheet of all 249.** A sprite is one request but it is also
  one cache entry that is invalidated whenever any single flag changes, and flags do
  change.
- **Serve from our own origin.** Either as static assets under the app's `public/`
  with a content hash, or as React components. Never from a third-party CDN — see
  [§5.5](#55-flagcdn--flagpedianet--no-licence).
- **`1x1` versus `3x2`.** `country-flag-icons` ships both for all 249, but the README
  is explicit that the `1x1` files are crops of the `3x2` originals rather than
  designed square marks. Prefer `3x2`, which is also the ratio most national flags
  actually use.
- **Do not re-encode to PNG.** SVG is smaller here, scales, and — relevant to
  [§7.2](#72-non-copyright-restrictions-are-real-and-they-are-tallied) — leaves the
  four flags Commons marks `{{noresize}}` rendered at their correct proportions.
- **The suppression list shrinks the bundle too.** ~20 codes that render no image are
  ~20 assets not shipped.

---

## 9. What AGPL-3.0-only obliges us to carry

The repository is `AGPL-3.0-only` (root `package.json`), and `LICENSE` is the GNU
Affero General Public License version 3, 19 November 2007.

**The MIT notice survives.** AGPL §7 permits material added to a covered work to
carry supplementary terms including, at §7(b), "Requiring preservation of specified
reasonable legal notices or author attributions in that material or in the Appropriate
Legal Notices displayed by works containing it". MIT's own condition is that "the
above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software". So relicensing the product under AGPL does not
absorb or extinguish the MIT notice — it must ship.

**Compatibility direction is settled for MIT.** The FSF licence list describes the
Expat/MIT licence as "a lax, permissive non-copyleft free software license, compatible
with the GNU GPL," and says of CC0 that "both public domain works and the lax license
provided by CC0 are compatible with the GNU GPL." Either would combine cleanly. CC
BY 4.0 is likewise described as "compatible with all versions of the GNU GPL". CC
BY-SA 4.0 is the one that is not settled for us: its declared compatibility is
one-way and names **GPLv3**, and AGPLv3 is absent from Creative Commons' compatible-licences
list. That is the specific reason [§8](#8-recommendation) declines share-alike art.

**AGPL §13 makes this a network obligation, not only a repository one.** A modified
version that users interact with remotely "must prominently offer all users
interacting with it remotely through a computer network […] an opportunity to receive
the Corresponding Source". Meridian is exactly that. So the flag assets and their
licence notice have to be reachable from the running service, not merely present in a
git tree someone could clone.

**What an implementer should actually do — four concrete items:**

1. Add `THIRD-PARTY-NOTICES.md` at the repository root containing, verbatim, the MIT
   permission notice and the copyright line of whichever pack is used
   (`Copyright (c) 2020 @catamphetamine` for the primary,
   `Copyright (c) 2013 Panayiotis Lipiridis` for the fallback). If both are used,
   both entries.
2. Link that file from a page the running application serves — the existing footer or
   an about/licences route — so §13 is satisfied by the deployed service and not only
   by GitHub.
3. Name the package, its exact version, and its licence in the notices entry, so a
   future reader can tell which artwork the notice covers.
4. If the pack is ever vendored rather than depended on, keep its `LICENSE` file in
   the vendored directory unmodified. That is the cheapest way to keep the MIT
   condition satisfied by construction.

None of this is legal advice, and item 2 in particular is a judgement about what "the
Corresponding Source" and "prominently offer" require of a deployed service. It should
be confirmed by someone qualified before release.

---

## 10. What I could not establish

Recorded so nobody mistakes the confident parts for the whole.

1. **Whether AGPLv3 may incorporate CC BY-SA 4.0 material.** Creative Commons lists
   GPLv3 and the Free Art License 1.3 and nothing else; the FSF names GPL version 3.
   Neither addresses AGPLv3. I found no authority either way, so
   [§8](#8-recommendation) avoids the question rather than answering it.
2. **Whether any of the non-copyright restrictions in
   [§7.2](#72-non-copyright-restrictions-are-real-and-they-are-tallied) reach a website
   published from Mexico.** I established that the restrictions exist and which of our
   flags Commons tags with them. Whether displaying a small image of the Vietnamese
   flag on a Mexican-operated site engages Ukrainian or Latvian law is a conflicts
   question I am not equipped to answer and did not attempt.
3. **The per-file provenance of any pack's individual flags.** None of `flag-icons`,
   `country-flag-icons` or `flagpack` records where each SVG came from. Their MIT
   grants are blanket, so a flag inside one of them that was copied from a CC BY-SA
   Commons file would be mislicensed by the packager, and I have no way to detect that
   from outside. This is an argument for the MIT packs over hand-assembling from
   Commons — the risk exists either way, and with a pack it sits with a maintainer who
   has taken a public position on it — but it is a residual risk, not zero.
4. **Whether the Commons licence tags are correct.** I read what the templates say. A
   Commons licence tag is a contributor's assertion, reviewed by volunteers, not an
   adjudication. The `CC BY 2.5` on Saint Barthélemy and the `CC BY-SA 4.0` on Cocos
   are the two that would matter, and I did not go behind either.
5. **Whether the packs' EH, TW, PS and XK renderings are the flags those authorities
   themselves use.** I confirmed what each pack draws. I did not verify any against a
   primary source, and for EH in particular the primary source is the disputed
   question. This is one reason those four are in the suppression list rather than
   merely flagged for review.
6. **Whether CoreUI's omission of Vanuatu is deliberate.** Every other absent code is
   a territory or a contested entity; VU is a UN member state. I could find no
   statement of intent and did not open an issue.
7. **Nothing here was tested in a browser.** No component was built, no rendering was
   observed, no screen reader was run. The accessibility rules in
   [§6](#6-flags-are-not-identifiers--and-the-shipped-data-proves-it) are derived from
   WCAG text and from measured properties of the assets, not from use.

---

## 11. Source register

Every URL was fetched on 2026-07-26.

**Licence texts and package metadata**

- `flag-icons` — https://raw.githubusercontent.com/lipis/flag-icons/main/LICENSE ·
  https://registry.npmjs.org/flag-icons (7.5.0)
- `country-flag-icons` — https://raw.githubusercontent.com/catamphetamine/country-flag-icons/master/LICENSE ·
  https://registry.npmjs.org/country-flag-icons (1.6.20)
- `flagpack-core` — https://raw.githubusercontent.com/Yummygum/flagpack-core/main/LICENSE ·
  https://registry.npmjs.org/flagpack-core (2.1.0)
- CoreUI Icons Free — https://raw.githubusercontent.com/coreui/coreui-icons/main/LICENSE
- Twemoji — https://raw.githubusercontent.com/jdecked/twemoji/main/README.md ·
  https://raw.githubusercontent.com/jdecked/twemoji/main/LICENSE-GRAPHICS
- OpenMoji — https://openmoji.org/faq/
- flagpedia / flagcdn — https://flagpedia.net/about · https://flagpedia.net/download/api
- `hampusborgos/country-flags` — https://raw.githubusercontent.com/hampusborgos/country-flags/main/README.md
  (no `LICENSE`; GitHub API reports `license: null`)

**Coverage enumeration**

- GitHub trees API, `?recursive=1`, for `lipis/flag-icons`,
  `catamphetamine/country-flag-icons`, `Yummygum/flagpack-core`, `jdecked/twemoji`,
  `hfg-gmuend/openmoji`, `coreui/coreui-icons`, `hampusborgos/country-flags`
- npm tarballs `flag-icons-7.5.0.tgz`, `country-flag-icons-1.6.20.tgz`
- https://flagcdn.com/en/codes.json
- https://unicode.org/Public/emoji/latest/emoji-sequences.txt (Emoji 17.0, file dated
  2025-07-25)

**Licence status of individual flag files**

- Wikidata Query Service, SPARQL over `P297` (ISO 3166-1 alpha-2) and `P41` (flag
  image) — https://query.wikidata.org/sparql
- Wikimedia Commons API, `action=query&prop=imageinfo&iiprop=extmetadata` —
  https://commons.wikimedia.org/w/api.php
- https://commons.wikimedia.org/wiki/Commons:Non-copyright_restrictions
- https://commons.wikimedia.org/wiki/Template:Insignia (English subpage)
- https://commons.wikimedia.org/wiki/Template:Communist_symbol
- https://commons.wikimedia.org/wiki/Template:OGL-om

**Licence compatibility**

- FSF licence list — https://www.gnu.org/licenses/license-list.en.html
- Creative Commons compatible licences —
  https://creativecommons.org/share-your-work/licensing-considerations/compatible-licenses/

**Accessibility and platform rendering**

- WCAG 2.2, SC 1.4.1 Use of Color and SC 1.1.1 Non-text Content —
  https://www.w3.org/TR/WCAG22/#use-of-color
- Segoe UI Emoji and flag rendering — https://learn.microsoft.com/en-us/answers/questions/5554132/it-s-time-for-microsoft-to-fully-support-flag-emoj
  (Microsoft Q&A thread; this one is community discussion rather than product
  documentation, and is cited as evidence that the behaviour is observed and
  long-standing, not as a specification)

**In this repository**

- `packages/atlas/src/index.ts` — the denominator, the coded/uncoded boundary, and the
  seven authorities with no ISO code
- `packages/atlas/src/regions/europe.ts` — why XK is present and what has no code
- `packages/atlas/src/types.ts` — `Jurisdiction.name` as `{ en, es }`
- `apps/web/components/LocaleSwitch.tsx` — the existing decision not to use a flag for
  a language
- `scripts/atlas-coverage.mjs` — the coverage report and its caveats
- `LICENSE` — AGPL-3.0-only, §7 and §13 as quoted
