# ADR 0007 — One language per page, addressed by URL

- **Status**: Accepted
- **Date**: 2026-07-26
- **Implemented in**: `packages/i18n/` — `locale.ts`, `text.ts`, `negotiate.ts`,
  `path.ts`, `instrument.ts`; and in all three applications —
  `apps/{landing,web,admin}/middleware.ts`, `next.config.mjs`,
  `app/[locale]/layout.tsx`, `app/sitemap.ts`, `components/LocaleSwitch.tsx`
- **Related**: [ADR 0005](0005-data-driven-pathway-catalog.md),
  [ARCHITECTURE.md §7](../ARCHITECTURE.md)

> **Boundary note (Lane C, public-safe).** Public-safe design rationale.

---

## Context

Meridian's catalog is bilingual in its data model and always has been.
`LocalizedText` is `{ en, es }`, and every pathway name, summary, criterion label
and guidance string carries both halves. [ADR 0005](0005-data-driven-pathway-catalog.md)
requires it: a criterion that reads as a bright line in English and as a soft
factor in Spanish is a defect, and having both in one record next to each other is
what makes that checkable.

The applications were built on the assumption that what is true of the data
should be true of the page, and rendered **both languages into the same
elements** — every heading, every paragraph, every label, twice.

The argument for it was real: the catalog authors both halves together and
neither is subordinate. Spanish is not a translation of Meridian, it is one of the
two languages Meridian is written in, and demoting it to a toggle risked it
rotting the way a secondary locale usually does.

Four things were wrong with it, and they compound:

1. **A screen-reader user heard every sentence twice.** There is no way to render
   two languages into one element that does not do this. It is the most serious of
   the four and it affects the readers with the least slack.
2. **`<html lang>` could not be correct.** The page was two languages at once, so
   whatever the attribute said was false about half the document. That degrades
   screen-reader pronunciation, hyphenation, and translation tooling.
3. **Every reader paid scanning cost to discard half the page.** The document was
   roughly twice as long as it needed to be for anybody.
4. **Search engines saw one document with duplicated content**, and there was no
   coherent `hreflang` story to tell about it.

The counter-argument — that a mixed-language household is served by having both
on screen — does not survive contact with the mechanism. A reader in their own
language with a one-click switch to the other serves that household better than
making both people read both.

So: one language per page. That decides the display question and immediately
raises the addressing question, which is the harder one and the reason this ADR
exists.

## Decision

**One language per page. The URL says which. English is unprefixed; Spanish is
`/es`.**

### 1. The locale is a URL segment, not client state

Routes live under `app/[locale]`. `generateStaticParams` publishes both variants
and both are statically prerendered. The served locale becomes `<html lang>`, via
`parseLocale`, which is strict about case and region subtags.

Nothing about the language is held in a cookie, in `localStorage`, or in React
state. A URL is shareable, linkable, cacheable, crawlable and survives a reload;
client state is none of those, and a page whose language depends on invisible
state cannot be linked to.

### 2. English is served unprefixed

`/` is English. `/es` is Spanish. The routes generate as `/en` and `/es`, and a
`beforeFiles` rewrite serves the `/en` route at `/`. The reader's URL stays `/`,
and what comes back is the document Next already prerendered — nothing here makes
the site dynamic.

`/en` is **not** a published address. Left alone it would be reachable directly,
putting the same English document at two URLs and splitting its ranking, so `/en`
and `/en/:path*` redirect permanently to the unprefixed form.

The reason is not aesthetic. `meridian.madfam.io/` is the address on the business
card, in this repository, in `enclii.yaml` and in every link already published.
Moving English to `/en` turns all of them into redirects and helps no reader.

### 3. `Accept-Language` may make exactly one decision

Where to send a reader who stated **no** preference. It must never override an
explicit locale in a URL. A reader whose URL says `/es` has stated a preference,
and a browser header is not evidence about them — it is evidence about whoever
configured the browser.

### 4. The switcher is a link

An `<a>` with a real `href`, rendered on the server, pointing at **this page** in
the other language and carrying the query string across.

- It works with JavaScript disabled.
- It is crawlable.
- Middle-clicking opens the other language in a new tab.
- There is no client state to fall out of step with the URL.

A `<button onClick>` fails all four, and would force the whole header to become a
client component to do it.

It points at the current page, never the home page. Sending a reader who is
halfway through the day counter back to `/` because they wanted Spanish loses
their place and everything they typed.

Each option is labelled with its **endonym** — *English*, *Español* — carrying a
matching `lang`, with the link's accessible name a full sentence in the language
it leads to. A control labelled "Spanish" is useless to the person who needs it,
because that person is not reading English. Not a flag: a flag is a country and a
language is not, and on pages that print `ES` and `CA` as jurisdiction chips a
two-letter language code would read as one more jurisdiction.

### 5. Instrument names are never translated

This is the limb with legal consequence, and it is why `instrument.ts` exists.

An instrument name is the **identity of a source**. *Real Decreto 1155/2024* is
not "Royal Decree 1155/2024": a reader who searches for the translation finds
nothing, and a reader who cites it cites a document that does not exist.
`instrumentLang(jurisdiction)` therefore reports what language a name is *in*, so
it can be marked with a correct `lang` attribute inside an otherwise-English or
otherwise-Spanish page — and returns `null` where it does not know, rather than
guessing. A confident wrong `lang` on a statute is worse than a missing one.

### 6. The resolution layer is a leaf package with no dependencies

`@meridian/i18n` depends on nothing. Not even `@meridian/core`.

Every one of its functions runs in a client component, and the landing site had
already learned what happens when a client module reaches into
`@meridian/pathways`: the whole catalog and zod follow it into the browser
bundle. The shapes it needs from elsewhere — a bilingual string, a citation's
jurisdiction — are declared **structurally**, so real catalog values satisfy them
with no adaptation and no import.

It holds no copy and no components. Those belong to the applications. It holds
only the decisions that would otherwise be made slightly differently in each of
the three.

## Consequences

### Better

- One `lang` per document, correct. Screen readers pronounce correctly and read
  each sentence once.
- Pages are about half as long.
- `hreflang` alternates with an `x-default` become expressible, per route and in
  the sitemap, because there are now two documents to point at each other.
- The default language keeps its canonical address, so no published link breaks.
- Language is linkable. "Here, in Spanish" is a URL.

### Worse

- **Adding and removing a locale prefix are not inverses.** This is the direct
  cost of §2, and it is a trap: a hand-rolled `startsWith('/es')` decides that
  `/estimate` is Spanish. It is why `path.ts` exists and why nothing may
  re-derive that logic locally.
- **Every page now exists twice**, so every route needs `generateStaticParams`,
  every metadata export needs alternates, and a page added without them is
  silently English-only.
- **A reader can land on a page in a language they do not read** and must act to
  change it. Under simultaneous rendering they could not. The switcher is the
  mitigation and it has to stay visible.
- **`otherLocale()` assumes exactly two languages.** At three the switcher becomes
  a menu and this design needs revisiting. `Locale` is a closed union of two,
  which makes that a compile error rather than a silent bug — but it is a real
  ceiling, and [PERSONAS.md](../PERSONAS.md) records "two languages" as the gap
  most likely to make Meridian unusable in the setting it was most designed to
  serve.
- **Three surfaces must agree.** The middleware, the rewrite and the alternates
  each encode the same asymmetry, and a disagreement between them produces a
  redirect loop or a document at two addresses.

### Now impossible

- Rendering both languages into one element. That is the point.
- Deciding the language from a cookie or from `Accept-Language` when the URL
  already says. The URL is the authority.
- Translating an instrument name anywhere in the product.

### Test status at the time of this decision

`@meridian/i18n` is well covered — 6 files, 124 tests — but that covers the
*resolution layer*, not the wiring. The middleware, the `/` rewrite, the `/en`
redirect, `generateStaticParams` and the alternates all live in the three
applications, which had **no tests at all** when this ADR was accepted. Suites for
them were in flight as it was written.

Recorded because it bears directly on how much weight this record carries: the
properties in §1–§4 were, at acceptance, asserted by reading the code and by
`pnpm build` succeeding — not by a suite. Check the current state before assuming
otherwise.

## Alternatives considered

**Keep rendering both languages.** Rejected on the screen-reader argument alone,
which no amount of CSS fixes: the second language is in the accessibility tree or
it is not on the page.

**`/en` and `/es`, both prefixed.** Symmetric, and `path.ts` would collapse to
almost nothing. Rejected because it turns every already-published link into a
redirect for no reader's benefit. The asymmetry is a real cost paid deliberately
for a canonical root.

**Subdomains — `es.meridian.madfam.io`.** Rejected: a wildcard certificate per
environment, cookie-scope questions Meridian does not want, and it splits the
origin for no gain over a path prefix.

**A client-side toggle over one document containing both.** Rejected: the second
language is still in the DOM, so the screen-reader problem and the page-weight
problem both survive, and `<html lang>` is still wrong until hydration.

**Cookie-persisted preference.** Rejected as the *authority* — a URL that renders
differently for two people is not shareable, and it makes caching a per-reader
problem. Nothing prevents a future cookie being consulted for the one decision
§3 allows, where no locale is in the URL.

**`next-intl` or a similar framework.** Not adopted. What was needed is a locale
union, a text picker, a path helper and a negotiation function — about 900 lines
including the instrument-language rule, which no off-the-shelf library has
because it is specific to citing law. A dependency would have brought a message
catalog and an ICU formatter that nothing here uses.

## References

- `packages/i18n/src/index.ts` — the module doc states this decision at source
- `apps/landing/next.config.mjs` — the rewrite and the `/en` redirect
- `apps/landing/middleware.ts` — locale-aware refusal by rewrite, not `notFound()`
- `apps/landing/components/LocaleSwitch.tsx` — the switcher, and why it is a link
- [ARCHITECTURE.md §7](../ARCHITECTURE.md) — how the three apps are wired
