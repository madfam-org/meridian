# Mexico — the inbound statutory frame

**Research brief for pathway encoders. Read this before writing any MX criterion.**

- Researched: 2026-07-26. Use `verifiedOn: '2026-07-26'` for citations built from this brief.
- Author: an agent, not counsel. Nothing here is a review. Every pathway built from this
  brief ships `reviewStatus: 'unreviewed'`.
- Every URL in the [source register](#13-source-register) was fetched during this sweep and
  the text was read, not summarised from a search result. Where a proposition rests on
  something I could **not** verify from an official source it is in
  [§11](#11-what-i-could-not-establish). Prefer omitting a criterion to encoding anything
  from §11.
- **Scope exclusions are in [§10](#10-scope-exclusions-and-how-to-name-them).** Refugee
  status, complementary protection and political asylum are out of scope and must not be
  encoded. Mexico grants them at scale and they are exactly the category a self-serve
  checker must not touch.

Mexico appears in this catalog today only as an origin — a nationality on the Spanish
art. 22.1 list and a party to CUSMA. Its own inbound system is absent. This brief is the
frame an encoder needs to close that gap.

---

## 0. Bottom line

1. **Three instruments, three authorities, and the split matters.** The *Ley de Migración*
   and its *Reglamento* govern entry and stay and are administered by the Secretaría de
   Gobernación through the Instituto Nacional de Migración. The *Ley de Nacionalidad* and
   its *Reglamento* govern naturalisation and are administered by the Secretaría de
   Relaciones Exteriores. A visa is issued by a Mexican consular office; a *condición de
   estancia* is authorised by INM. Conflating them will mislead on every route.
   See [§1](#1-the-architecture).
2. **The `condiciones de estancia` are a closed list of nine, all in art. 52 of the Ley de
   Migración**, and only three of them are residence: *residente temporal*, *residente
   temporal estudiante*, *residente permanente*. The other six are all *visitante*
   variants. Art. 61 forbids holding two at once. See [§2](#2-the-condiciones-de-estancia--art-52).
3. **A visitor generally cannot become a resident from inside Mexico.** Art. 53 is a
   bright-line statutory bar: visitors, *except* those on humanitarian grounds and those
   with a family link to a Mexican or to a foreigner with regular residence, may not change
   condición de estancia and must leave when their authorised period ends. This is the single
   most consequential rule for anyone imagining they can arrive as a tourist and convert.
   See [§2.9](#29-art-53--the-bar-on-converting-from-visitante).
4. **Residente permanente has seven statutory doors (art. 54)** and only one of them is the
   familiar "four years of temporary residence". The retired/pensioner door, the
   Mexican-children door and the direct-line ascendant/descendant door are all direct and do
   not require any prior residence. See [§3](#3-residente-permanente--art-54).
5. **The points system is on the statute book and, as far as I can establish, has never been
   switched on.** Art. 57 and Reglamento art. 139.IV both make it conditional on an *acuerdo*
   published in the DOF. The 2012 INM instrument, the 2025 consular Lineamientos and INM's own
   current public page all still refer to that acuerdo in the future tense, thirteen years
   after the law. Encode it, if at all, as a `closed`/`suspended` record with a note — never
   as an available route. See [§3.4](#34-the-sistema-de-puntos-art-57).
6. **Every economic threshold is a multiple of a published index, and the index moves every
   February.** The consular instrument states them in *días de UMA*; the INM instrument still
   states them in *días de salario mínimo general vigente en el Distrito Federal*, a unit that
   the Constitution's 2016 de-indexation reform converts to UMA by operation of a transitional
   article. **Never encode a peso amount.** See [§6](#6-the-economic-thresholds-and-the-uma).
7. **The consular figures and the INM figures are different numbers for the same-sounding
   test**, because they live in two instruments written thirteen years apart and neither
   defers to the other. Residente temporal solvency is 11,460 días UMA of average balance at
   a consulate and 20,000 días at an INM counter. An encoder who treats them as one rule will
   be wrong on one of the two paths. See [§6.3](#63-the-two-instruments-disagree).
8. **Naturalisation is five years of residence, reduced to two for a long and specific list**
   — including nationals of Latin American countries and of the Iberian Peninsula, spouses of
   Mexicans, parents of Mexican-born children, and direct-line descendants of Mexicans by
   birth. Residence is proved **only** with a *residente temporal* or *residente permanente*
   card, so visitor time counts for nothing. See [§5](#5-nationality).
9. **Mexico's dual-nationality position is asymmetric, and it bears directly on the Spanish
   art. 22 route this catalog already encodes.** A Mexican **by birth** can never be deprived
   of Mexican nationality (Const. art. 37(A)). A Mexican **by naturalisation** loses it on
   voluntarily acquiring a foreign nationality (art. 37(B)(I)). The catalog's Spanish records
   must not assume the Mexican side is symmetric. See [§5.4](#54-dual-nationality-and-the-spanish-art-22-route).
10. **Two live administrative changes landed in the last twelve months**: the visa Lineamientos
    were entirely replaced on 2025-07-25 (repealing the 2014 instrument and re-denominating
    every threshold in UMA), and an *Acuerdo* of 2026-05-15 added a new residente-temporal
    ground for high-specialisation technical assistance. Do not encode from memory here.
    See [§8](#8-live-changes-and-live-conflicts).

---

## 1. The architecture

### 1.1 The instruments

| Layer | Instrument | First published | Text used here |
|---|---|---|---|
| Constitution | Constitución Política de los Estados Unidos Mexicanos | 1917-02-05 | últimas reformas DOF 2026-06-02 |
| Statute — migration | Ley de Migración | DOF 2011-05-25 | última reforma DOF 2026-01-15 |
| Regulation — migration | Reglamento de la Ley de Migración | DOF 2012-09-28 | última reforma DOF 2014-05-23 |
| Statute — nationality | Ley de Nacionalidad | DOF 1998-01-23 | última reforma DOF 2012-04-23 |
| Regulation — nationality | Reglamento de la Ley de Nacionalidad | DOF 2009-06-17 | última reforma DOF 2013-11-25 |
| Administrative — visas (consular) | Lineamientos Generales para la expedición de visas que emiten las secretarías de Gobernación y de Relaciones Exteriores | DOF 2025-07-25 | as amended DOF 2026-05-15 |
| Administrative — trámites (INM) | Lineamientos para trámites y procedimientos migratorios | DOF 2012-11-08 | as amended, most recently DOF 2019-04-23 |
| Statute — index | Ley para Determinar el Valor de la Unidad de Medida y Actualización | DOF 2016-12-30 | as published |

The 2026-01-15 reform of the Ley de Migración amended arts. 2, 20, 30, 67, 70, 71, 73, 75,
108, 110, 113 and 120 as part of a multi-statute gender-equality decree. **It did not touch
arts. 40-61 or 132-136**, so nothing in the condiciones de estancia, the residente
permanente grounds or the regularización chapter moved. Verified against the reform history
printed in the Cámara de Diputados consolidated text.

### 1.2 Who decides what

Three separate decision-makers, and a route usually needs two of them.

- **Secretaría de Relaciones Exteriores (SRE)**, through Mexican consular offices abroad:
  issues visas (Ley de Migración art. 41). Also the sole authority for naturalisation
  (Ley de Nacionalidad art. 1).
- **Secretaría de Gobernación (SEGOB)**, through the **Instituto Nacional de Migración (INM)**:
  authorises condiciones de estancia, issues residence cards, decides changes of status and
  regularisation, and — for family-unity, job-offer and humanitarian cases — *authorises* a
  visa that the consulate then merely *issues* (art. 41, second paragraph; Lineamientos 2025,
  DÉCIMO SÉPTIMO).
- **The migration officer at the port of entry**: decides admission. The visa does not.

Art. 40, final paragraph, and the 2025 Lineamientos DÉCIMO TERCERO both say this in terms:

> La visa acredita requisitos para una condición de estancia y autoriza al extranjero para
> presentarse en cualquier lugar destinado al tránsito internacional de personas y solicitar
> su ingreso al país en dicha condición de estancia…

> La visa no garantiza la internación a territorio nacional.

**Encoder consequence.** A Mexican route is at minimum a two-step object: *visa → condición
de estancia → (within 30 natural days of entry) tarjeta de residencia* (art. 59). The
catalog's `Pathway` shape has no first-class notion of a two-agency sequence; model the
consular step and the INM step as separate `procedural` criteria on the same pathway, and
put the 30-day card deadline in `durations.note`, not in `initialGrantMonths`.

### 1.3 Naming a Mexican instrument in a `Citation`

Instrument names are never translated (AGENTS.md invariant 2). Use the Spanish name exactly
as the Cámara de Diputados prints it, and carry the DOF date of the version you read in
`note` — Mexican administrative instruments are amended by free-standing *acuerdos* rather
than reissued, so "the Lineamientos" without a date names several different documents.

```ts
{
  id: 'mx-lmigra-art-52',
  kind: 'statute',
  instrument: 'Ley de Migración (México)',
  provision: 'art. 52',
  url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LMigra.pdf',
  jurisdiction: 'MX',
  verifiedOn: '2026-07-26',
  note: 'Texto vigente, última reforma DOF 2026-01-15.',
}
```

`kind` mapping, which is load-bearing for [§7](#7-statutory-vs-reglamentario-vs-administrative--the-discretionary-decision-table):

| Source | `kind` |
|---|---|
| Constitución | `treaty` is wrong; use `statute` and say `Constitución` in `instrument` |
| Ley de Migración, Ley de Nacionalidad, Ley sobre Refugiados… | `statute` |
| Reglamento de la Ley de Migración / de Nacionalidad | `regulation` |
| Lineamientos and *acuerdos* published in the DOF | `policy` — they are binding published administrative instructions |
| An INM or SRE web page (`gob.mx/inm`, `sre.gob.mx`) | `official_guidance`, and almost always `discretionary: true` |

`instrumentLang()` from `@meridian/i18n` should return `'es'` for all of these: Mexico
enacts in Spanish and there is no second authoritative language, so unlike Canada or the EU
the jurisdiction does settle the question.

---

## 2. The `condiciones de estancia` — art. 52

Art. 52 opens:

> Los extranjeros podrán permanecer en el territorio nacional en las condiciones de estancia
> de visitante, residente temporal y residente permanente, siempre que cumplan con los
> requisitos establecidos en esta Ley, su Reglamento y demás disposiciones jurídicas
> aplicables…

Nine numbered fractions follow. **Art. 61: `Ningún extranjero podrá tener dos condiciones de
estancia simultáneamente.`** The only sanctioned near-exception is a *visitante regional* or
*visitante trabajador fronterizo* card-holder who separately obtains an ordinary visitor
permission for travel beyond the frontier region, and even then Reglamento arts. 154 and 155
require that each single entry, stay and exit be made under one condition only — using the
other one mid-stay cancels **both** documents.

### 2.1 I — Visitante sin permiso para realizar actividades remuneradas

- **Duration**: `un tiempo ininterrumpido no mayor a ciento ochenta días, contados a partir
  de la fecha de entrada` (art. 52.I). The matching visa is art. 40.I with the same ceiling.
- **No paid activity.** Art. 40, penultimate paragraph: `Ninguna de las visas otorga el
  permiso para trabajar a cambio de una remuneración, a menos que sea explícitamente
  referido en dicho documento.`
- **Grounds** (Reglamento art. 129): sufficient economic solvency to cover lodging and
  maintenance, **or** an invitation from an organisation or public/private institution
  established in Mexico for an unpaid activity, the inviting body proving its own solvency.
- **Consular evidence** (Lineamientos 2025, Trámite 1, fracción III): one of
  - *arraigo* — a registered property deed at least two years old **plus** proof of stable
    employment of at least two years, or that deed plus proof of business ownership or
    participation at least two years old;
  - *solvencia económica* — employment or pension with monthly income free of encumbrances
    **greater than 220 días UMA** over the last three months plus a stable-employment
    certificate of at least one year; **or** investments or bank accounts with an average
    monthly balance equivalent to **680 días UMA** over the last three months; **or**, for a
    person enrolled in higher education, a study certificate plus employment, pension or
    scholarship income of **130 días UMA** over the last three months;
  - an invitation, where a private inviting body must show an average monthly balance of
    **2,290 días UMA** over twelve months (public bodies and Sistema Educativo Nacional
    institutions are exempt);
  - cargo-transport driver, and several further specific grounds.
- **Visa may be granted for up to ten years** where the applicant shows solvency, frequent
  travel, standing as a researcher/scientist/artist/athlete/journalist of national or
  international repute, or a close family link to a Mexican or resident where no residence is
  intended (Reglamento art. 103). The ten years is the *visa* validity; the stay per entry
  stays at 180 days.
- **Visa-free entry.** Art. 40 is subject to bilateral visa-suppression agreements and
  unilateral decisions (Lineamientos 2025, TERCERO). Separately, INM's Lineamientos 2012
  art. 26 admits without a Mexican visa anyone holding permanent residence in Canada, the
  United States, Japan, the United Kingdom or any Schengen state; **a valid United States
  visa**; or a Mexico-approved APEC Business Travel Card. That last is the single most
  used facilitation for a Latin American traveller and it is a citable primary source, not
  folklore.
- The authorised period at the port of entry is set by the officer on the FMM; the
  Lineamientos 2012 art. 26 records `Vigencia de la autorización: 180 días naturales` as the
  standard. **The officer may grant less.** Encode 180 as the statutory ceiling with
  `discretionary: true` on the practice of granting it in full.

### 2.2 II — Visitante con permiso para realizar actividades remuneradas

- **Duration**: also `no mayor a ciento ochenta días` (art. 52.II).
- **Grounds**: an offer of employment; **or** an invitation from an authority or an academic,
  artistic, sporting or cultural institution under which the person is paid in Mexico;
  **or** seasonal paid work under an inter-institutional agreement with foreign entities.
- The visa is applied for **at INM**, not at the consulate, because it is an oferta-de-empleo
  case (art. 41 second paragraph; Lineamientos 2025 Trámite 10, as amended 2026-05-15). The
  employer must hold a *constancia de inscripción del empleador* issued by INM
  (Reglamento art. 131; Lineamientos 2012 arts. 64-65).
- Reglamento art. 140 and the 2026 amendment both say plainly that a work permission is
  **not** a professional licence: it validates the truthfulness of the job offer, nothing
  about competence, and any regulated occupation still needs its own authorisation.

### 2.3 III — Visitante regional

- **Statutory duration**: `sin que su permanencia exceda de siete días` (art. 52.III, as
  reformed DOF 2017-05-19). **The Reglamento was never updated** and arts. 133.I.b) and 154
  still say `hasta por tres días naturales`, as does Lineamientos 2012 art. 27. The later
  statute governs; INM's own 2019 *acuerdo* recites the seven days in its considerandos and
  INM's current public page states seven. See [§8.3](#83-the-three-day--seven-day-conflict).
- **Who qualifies**: art. 52.III says `el extranjero nacional o residente de los países
  vecinos`. Lineamientos 2012 art. 72, **as reformed DOF 2019-04-23**, extends this to
  nationals of **Guatemala, Belize, El Salvador and Honduras** and to foreigners permanently
  resident in those countries. El Salvador and Honduras do not border Mexico; SEGOB justified
  the extension by reference to the Mexico–Central America free trade agreement and a 2018
  four-state political declaration. Treat the nationality list as administrative and
  `discretionary: true`; do not generalise "vecino" to any other state.
- **Where**: the *región fronteriza* is, per Lineamientos 2012 art. 73 as reformed
  2019-04-23, all cities and municipalities of **Campeche, Chiapas, Tabasco, Quintana Roo and
  Yucatán**.
- **Card validity**: five years, multiple entries (Reglamento art. 154; Lineamientos 2012
  art. 74). **No paid activity.** Applied for in person at a land port of entry or an
  INM-enabled location.

### 2.4 IV — Visitante trabajador fronterizo

- **Duration**: `permanecer hasta por un año en las entidades federativas que determine la
  Secretaría` (art. 52.IV), with the card valid one year and multiple entries
  (Reglamento art. 155).
- **Who qualifies**: art. 52.IV says nationals of countries sharing a land border with
  Mexico. Lineamientos 2012 art. 75 narrows this operationally to **Guatemalan and Belizean
  nationals aged 16 or over holding a job offer**, valid for work in **Campeche, Chiapas,
  Quintana Roo and Tabasco** (art. 76). Note that this instrument, unlike art. 72, was **not**
  extended in 2019 — the frontier-worker list is still two countries.
- Carries a work permission tied to the occupation in the offer, and permits the entry of a
  spouse or partner and their minor children (Reglamento art. 134).

### 2.5 V — Visitante por razones humanitarias

Art. 52.V lists three statutory grounds plus a residual discretion:

- **a)** being the injured party, victim or witness of a crime committed in Mexico.
  Authorised **until the process concludes**, with multiple entries and a **work permission**.
  Afterwards the person `podrá solicitar la condición de estancia de residente permanente`.
- **b)** being a migrant child or adolescent under art. 74. The authorisation
  `deberá ser inmediata y no podrá negarse o condicionarse a la presentación de documental
  alguna ni al pago de derechos`, must carry the CURP, and benefits the accompanying adult
  carer solidarily unless the Procuraduría de Protección has found that adult contrary to the
  child's best interests.
- **c)** being an applicant for political asylum, recognition as a refugee, or complementary
  protection, `hasta en tanto no se resuelva su situación migratoria`. **This is the hinge
  into the out-of-scope area — see [§10](#10-scope-exclusions-and-how-to-name-them).**
- Residual: SEGOB `podrá autorizar` the condition to anyone else where a humanitarian cause
  or the public interest makes entry or regularisation necessary, in which case a work
  permission is included.

Reglamento art. 153: renewals as many times as needed until the process or cause ends;
Lineamientos 2012 art. 50 sets the card at one year, renewable, and the trámite is exempt
from the fee.

**This route is not out of scope** — it is a migration status, not a protection status. But
its ground (c) is entirely parasitic on a COMAR or SRE process that *is* out of scope, so a
checker must route (c) to qualified help rather than assess it.

### 2.6 VI — Visitante con fines de adopción

Authorises a foreigner engaged in an adoption in Mexico to remain until the judgment is
final, the adopted child's new birth record is registered, the passport is issued and every
step needed to guarantee the child's exit is complete. **Only available to citizens of
countries with which Mexico has signed a convention on the matter** (art. 52.VI, art. 40.III).
Card obtained within 30 natural days of entry (Lineamientos 2025, Trámite 4).

### 2.7 VII — Residente temporal

- **Duration**: `por un tiempo no mayor a cuatro años` (art. 52.VII).
- **Card arithmetic, which is what actually matters.** Reglamento art. 156: the card may run
  one, two, three or four years from the grant, and renewals may be requested in the 30
  natural days before expiry **`hasta completar cuatro años contados a partir de que obtuvo
  la condición de estancia`**. In INM's own trámite sheets the first card issued on *canje* —
  the exchange of the entry FMM for a card after arriving on a residente temporal visa — is
  **one year, counted from entry** (Lineamientos 2012 art. 32), and renewals are
  **one year, or two or three where there is `continuidad laboral` for the same period**
  (art. 34). Where the resident holds a work permission, the card runs for the same period as
  the job offer (Reglamento art. 156 second paragraph).
- **Work**: only `con la posibilidad de obtener un permiso para trabajar … sujeto a una
  oferta de empleo`. A residente temporal is **not** automatically allowed to work.
- **Family unity built into the status.** Art. 52.VII lets the holder bring, or later apply
  for, their minor unmarried children and the minor unmarried children of their spouse or
  partner, their spouse, their partner (*concubinario/a* or equivalent), and their father or
  mother. Those people receive **residente temporal** for the duration of the principal's
  permission, with the same conditional work permission.
- **Grounds** (Reglamento art. 138): family link; job offer; RFC registration for
  self-employed paid activity; invitation for an unpaid activity; economic solvency; real
  property of a value set administratively; or investment in a Mexican company, in fixed
  assets, or in economic activity generating formal employment.
- **Consular evidence** (Lineamientos 2025, Trámite 5, fracción III): solvency of
  **11,460 días UMA** average monthly balance over twelve months, **or** employment or pension
  income free of encumbrances **greater than 680 días UMA** monthly over six months; real
  property exceeding **91,710 días UMA**; investment exceeding **45,850 días UMA** (or fixed
  assets of the same value, or documented business activity including IMSS proof of at least
  three employees); scientific research in Mexican waters; invitation; family unity; mobility
  under an international instrument; and, since 2026-05-15, high-specialisation technical
  assistance (see [§8.2](#82-the-2026-05-15-acuerdo-adds-a-technical-assistance-ground)).
- The visa itself is valid **180 days, one entry** — it is a travel authorisation to arrive
  and claim the status, not the status.

### 2.8 VIII — Residente temporal estudiante

- **Duration**: for the length of the courses, studies, research or training at an institution
  belonging to the **sistema educativo nacional**, `hasta la obtención del certificado,
  constancia, diploma, título o grado académico correspondiente`.
- **Renewed annually**, on proof that the conditions for the original authorisation subsist
  (art. 52.VIII second paragraph). Lineamientos 2012 art. 34 sets the renewal card at one year.
- **Work**: permitted **only for higher education, postgraduate study and research**, and even
  then only where the institution issues a *carta de conformidad* and the work is under a job
  offer related to the subject of study. INM grants the permission; it is not automatic.
- Carries the same family-unity right as the residente temporal.
- **Consular evidence** (Lineamientos 2025, Trámite 6): acceptance letter plus solvency to
  cover tuition, lodging and maintenance; the solvency may be proved by the applicant, their
  parents or whoever holds *patria potestad*.
- May change to plain residente temporal at any time (Reglamento art. 141.VII).

### 2.9 IX — Residente permanente, and art. 53 — the bar on converting from `visitante`

Art. 52.IX: indefinite stay, `con permiso para trabajar a cambio de una remuneración en el
país`.

**Art. 53 is the rule an applicant most needs to hear and least expects:**

> Los visitantes, con excepción de aquéllos por razones humanitarias y de quienes tengan
> vínculo con mexicano o con extranjero con residencia regular en México, no podrán cambiar
> de condición de estancia y tendrán que salir del país al concluir el período de permanencia
> autorizado.

So: arriving as a tourist and "switching to residency" is barred, unless the person is on
humanitarian grounds or has a qualifying family link. Reglamento art. 141 enumerates exactly
which conversions are permitted, and it is a closed list. **This must be a `blocking`
criterion on every Mexican residence pathway that a visitor might otherwise think they
qualify for.**

Reglamento art. 141 permits, among others:

- visitante or residente temporal estudiante → **residente temporal** by family link, where
  the person falls within a residente temporal family-unity ground;
- any visitante variant → **visitante por razones humanitarias** on the listed grounds
  (victim/witness; unaccompanied minor; asylum/refugee/statelessness applicant; risk to health
  or life; a direct relative in state custody needing their authorisation for medical or
  psychological assistance or for identification or recovery of a body; the need to attend a
  direct relative in grave health);
- visitante por razones humanitarias → **residente permanente** on recognition as a refugee,
  grant of complementary protection, political asylum or a statelessness determination;
- visitante por razones humanitarias (victim/witness) → **residente temporal** when the
  process concludes;
- residente temporal or residente temporal estudiante → **residente permanente** where they
  qualify on points, are a pensioner with sufficient foreign income, or have completed four
  years as residente temporal.

Reglamento art. 141.I(c) and (e), read with art. 139, also permit direct change to residente
permanente for the spouse or partner of a Mexican or permanent resident after **two years**
of regular stay as residente temporal with the bond subsisting, and for a
grandparent/parent/child/grandchild of a Mexican by birth.

---

## 3. Residente permanente — art. 54

> Se otorgará la condición de residente permanente al extranjero que se ubique en cualquiera
> de los siguientes supuestos:

| Fr. | Ground | Prior residence required? |
|---|---|---|
| I | Political asylum, recognition as refugee, complementary protection, or statelessness determination | No — **out of scope, see §10** |
| II | Family unity under art. 55 | No |
| III | Retired or pensioned, with income from a foreign government, an international organisation or a private company for services rendered abroad, sufficient to live in Mexico | No |
| IV | Decision of INM under the *sistema de puntos* of art. 57 | No — **not in force, see §3.4** |
| V | Four years having elapsed since the person held a *permiso de residencia temporal* | Yes — four years |
| VI | Having children of Mexican nationality **by birth** | No |
| VII | Being an ascendant or descendant **in the direct line up to the second degree** of a Mexican **by birth** | No |

Note the wording drafting trap: art. 54's own closing paragraph says permanent residents
`tendrán la posibilidad de obtener un permiso para trabajar … sujeto a una oferta de empleo`,
which reads narrower than art. 52.IX's unconditional `con permiso para trabajar`.
**Reglamento art. 157 settles it operationally**: the residente permanente card
`implicará … que cuenta con permiso de trabajo en el caso de ser mayores de edad`. Encode the
unrestricted reading, flag the inconsistency in the criterion `note`, and set
`requiresHumanReview` if a matter turns on it.

### 3.1 The four-year route (art. 54.V)

Reglamento art. 139.V says the four years must be `situación migratoria regular por cuatro
años consecutivos, en el caso de los residentes temporales`. Read with Reglamento art. 156
(renewals only up to four years total from the grant) and Lineamientos 2012 art. 32 (first
card one year from entry), the arithmetic an encoder must reproduce is:

1. residente temporal granted, first card one year from entry;
2. renewals of one, two or three years, capped at four years total from the grant;
3. at four years, application for change to residente permanente — Lineamientos 2012
   art. 44, requisito 6: the applicant must **expressly state in the application** that they
   are applying by this route.

This is calendar arithmetic on a start date, not a day count. Use
`duration_since_at_least` with `years: 4` against a residence start date; do **not** use
`legalResidenceDaysTotal`, which would silently accept four years assembled from broken
periods. The regulation says *consecutivos*.

**The status must still be alive.** A residente temporal whose card lapsed is irregular and
is in the regularización chapter, not this one.

### 3.2 The pensioner route (art. 54.III)

- The statute requires income **from a foreign source** — `de un gobierno extranjero o de
  organismos internacionales o de empresas particulares por servicios prestados en el
  exterior`. Mexican-sourced pension income does not satisfy it on the face of the text.
- Reglamento art. 139.III restates it as `ser pensionado o jubilado con ingresos mensuales
  suficientes para su manutención`.
- **Consular figures** (Lineamientos 2025, Trámite 7, fracción III.a): average monthly
  balance of **45,850 días UMA** over the last twelve months, **or** pension income free of
  encumbrances **greater than 1,140 días UMA** monthly over the last six months.
- **INM figures** for a residente temporal changing to permanent on this ground
  (Lineamientos 2012 art. 44, requisito 5): average monthly balance of **25,000 días** over
  twelve months, **or** income or pension of **500 días** monthly over six months. See
  [§6.3](#63-the-two-instruments-disagree).

### 3.3 The family routes (arts. 54.II, 54.VI, 54.VII, and art. 55)

Art. 55 gives a residente permanente the right to bring, or later apply for, the following,
who reside under the **same** condition of stay:

| Fr. | Relative | Status granted |
|---|---|---|
| I | Father or mother of the permanent resident | Residente permanente |
| II | Spouse | **Residente temporal for two years**, then residente permanente if the marriage subsists |
| III | *Concubinario*, *concubina* or equivalent | **Residente temporal for two years**, then residente permanente if the union subsists |
| IV | Children of the resident, and children of the spouse or partner, where minors, unmarried, or under the resident's guardianship | Residente permanente |
| V | Siblings of the resident, where minors and unmarried, or under legal representation | Residente permanente |

Art. 56 gives **Mexicans** the equivalent right over: father or mother; spouse (residente
temporal two years first); partner (same); children born abroad who are not Mexican under
Const. art. 30; the minor unmarried children of a foreign spouse or partner; and minor
unmarried siblings.

**The two-year spousal step is a hard rule and the 2025 Lineamientos say so explicitly** in
the closing notes to Trámite 7:

> La persona extranjera cónyuge, concubina o concubinario de mexicano o de persona extranjera
> con condición de estancia de residente permanente, en ningún caso podrá ser documentado con
> la visa de residente permanente.

Reglamento art. 141.I(c) fixes when the two years start: `a partir de que el cónyuge …
adquiere la condición de estancia de residente temporal por el vínculo con el mexicano o con
el residente permanente` — not from the wedding.

**Arts. 54.VI and 54.VII are direct and immediate.** A parent of a Mexican child by birth,
and an ascendant or descendant in the direct line to the second degree of a Mexican by birth,
get residente permanente without any residence period. Reglamento art. 141.I(e) states the
second as `abuelo, abuela, padre, madre, hijo, hija, nieto, o nieta de mexicano por
nacimiento`, which is the operational reading of "second degree in the direct line".

Note the qualifier **`por nacimiento`** in both fractions. A child or parent who is Mexican
*by naturalisation* does not trigger these. This distinction is exactly what
`ApplicantFacts.claimedNationalityAcquisition` exists for on the Spanish side, and the same
discipline is needed here — but about the *relative's* nationality, not the applicant's,
which the fact model does not currently express. See [§9.2](#92-facts-the-mx-routes-need-that-applicantfacts-does-not-model).

### 3.4 The `sistema de puntos` (art. 57)

Art. 57 says SEGOB `podrá establecer` a points system by general administrative provisions
published in the DOF, letting foreigners acquire permanent residence **without** the four
years of prior residence, and specifies what such a system must contain at minimum
(admission criteria under art. 18.II quotas; the applicant's capacities including education,
work experience, aptitude in science and technology, international recognition, and aptitude
for activities the country needs; and the procedure).

Every downstream instrument still speaks of that acuerdo prospectively:

- Reglamento art. 139.IV — `conforme a las disposiciones administrativas de carácter general
  que emita la Secretaría y que serán publicadas en el Diario Oficial de la Federación`;
- Lineamientos 2012 art. 44, requisito 4 — `conforme al acuerdo que al efecto se publique en
  el Diario Oficial de la Federación`;
- Lineamientos 2025, Trámite 7.III.c — `los requisitos que al efecto se establezcan en el
  acuerdo correspondiente que será publicado en el Diario Oficial de la Federación`;
- INM's own current public page names the points system in its opening line and then never
  explains it, listing only the pensioner and four-year routes.

I searched the DOF for a published points-system acuerdo and found none. **I cannot prove a
negative**, and this is recorded in [§11](#11-what-i-could-not-establish). What I can say is
that the administrative instrument published on 2025-07-25 — thirteen years after the law and
after a full replacement of the visa framework — still describes the acuerdo in the future
tense, which is strong evidence it does not exist.

**Encoder instruction.** Do not ship a `mx-points-system` pathway with criteria. If it is
recorded at all, record it as `status: 'suspended'` with a `closureNote`-style summary in
`summary`, no criteria beyond a single `informational` one pointing at art. 57, and a note
that no implementing acuerdo has been published. A route that cannot be applied for must
never appear as available.

---

## 4. Regularización — arts. 132-136

This is the chapter that matters most for the Central American and Venezuelan population
already inside Mexico, and it is unusually generous on paper.

### 4.1 The right to ask — art. 132

> Los extranjeros tendrán derecho a solicitar la regularización de su situación migratoria,
> cuando se encuentren en alguno de los siguientes supuestos:
> I. Que carezcan de la documentación necesaria para acreditar su situación migratoria regular;
> II. Que la documentación con la que acrediten su situación migratoria se encuentre vencida, o
> III. Que hayan dejado de satisfacer los requisitos en virtud de los cuales se les otorgó una
> determinada condición de estancia.

Lineamientos 2012 art. 45 adds the operational teeth: `la autoridad migratoria deberá recibir
todas las solicitudes de regularización que se presenten`.

### 4.2 Art. 133 — the discretionary paragraph and the entitlement paragraph

Art. 133 has two paragraphs and **they carry different verbs**, which decides which way
`discretionary` goes.

**First paragraph — discretion.** `El Instituto podrá regularizar la situación migratoria de
los extranjeros que se ubiquen en territorio nacional y manifiesten su interés de residir de
forma temporal o permanente…, siempre y cuando cumplan con los requisitos`. This is the
general power, and Reglamento art. 143 is the hook under which SEGOB may issue **temporary**
programmes.

**Second paragraph — entitlement.** `Con independencia de lo anterior, tienen derecho a la
regularización de su situación migratoria los extranjeros que se ubiquen en territorio
nacional y se encuentren en alguno de los siguientes supuestos:`

| Fr. | Ground |
|---|---|
| I | Spouse, *concubina* or *concubinario* of a Mexican or of a foreigner with resident status |
| II | Parent or child of, or holding legal representation or custody of, a Mexican or a foreigner with resident status |
| III | Identified by INM or a competent authority as the victim or witness of a serious crime committed in Mexico |
| IV | A degree of vulnerability making deportation or assisted return difficult or impossible |
| V | A child or adolescent subject to international child-abduction/restitution proceedings |

Reglamento art. 144 expands IV with a non-exhaustive list: unaccompanied migrant children
where it serves their best interests; pregnant women, older adults, persons with disabilities,
and indigenous persons; persons with a grave health condition whose transfer would risk their
life; persons in danger of life or physical integrity from violence or natural disaster; and
applicants for refugee status, political asylum, or a statelessness determination until that
procedure concludes.

**This is a right, not a discretion.** Encode arts. 133.I-133.V as `blocking` criteria whose
satisfaction produces eligibility, with `discretionary: false`. Encode the first paragraph's
general power as `discretionary: true`.

**No economic threshold applies to the family route.** Lineamientos 2012 art. 51 —
*regularización por vínculo familiar* — asks only for identity documents, the fee, the
migratory document if the person ever held one, the fine, and proof of the relationship. There
is no solvency requirement in the ficha. Compare art. 52, which does have one. This asymmetry
is the whole point of the family route and must survive into the catalog.

### 4.3 Art. 134 — overstay and wrong-activity regularisation

> Los extranjeros también podrán solicitar la regularización de su situación migratoria, salvo
> lo dispuesto en el artículo 43 de esta Ley, cuando:
> I. Habiendo obtenido autorización para internarse de forma regular al país, hayan excedido
> el período de estancia inicialmente otorgado, **siempre y cuando presenten su solicitud
> dentro de los sesenta días naturales siguientes al vencimiento** del período de estancia
> autorizado, o
> II. Realicen actividades distintas a las que les permita su condición de estancia.

**The sixty natural days is a hard statutory deadline and it is the single most encodable
number in this chapter.** It runs from the expiry of the authorised stay, not from entry.
Reglamento art. 144.V restates it as `tener documento migratorio con vencimiento no mayor a
sesenta días naturales`.

Art. 134 is expressly subject to art. 43 — the refusal grounds — which is the only place in
the chapter where the national-security and public-security screens bite by cross-reference.

### 4.4 Procedure and consequences — arts. 135, 136, 145, 146

- **Art. 135** — what the applicant must file: a written request specifying the irregularity;
  an official identity document; documents proving a family link where relied on; the expired
  migratory document where relied on; **proof of payment of the fine**; and the requirements
  for the condition of stay sought.
- **Art. 136** — `El Instituto no podrá presentar al extranjero que acuda ante el mismo a
  solicitar la regularización de su situación migratoria.` Attending an INM office to
  regularise cannot itself trigger detention. Reglamento art. 146 qualifies this: the
  protection is lost if the person previously failed to comply with an exit order or
  previously filed false information or forged documents. A person already in a *estación
  migratoria* who falls within arts. 133 or 134 must be issued an *oficio de salida* within
  24 hours of proving the requirements.
- **Time limit**: 30 natural days for INM to decide (art. 136 final paragraph). Reglamento
  art. 146.III says 20 *working* days for applications filed at trámite offices. Both figures
  are in force in their own instruments; the statute governs where they conflict.
- **Fines**: art. 145 — 20 to 40 *días de salario mínimo* for regularisation under art. 133
  fractions I and II, and **no fine at all** for fractions III, IV and V. Art. 146 — 20 to 100
  *días* for art. 134 regularisation. These are the same unit problem as everything else; see
  [§6](#6-the-economic-thresholds-and-the-uma).
- **Refusal has a cost**: Reglamento art. 146 final paragraph — a person refused must leave in
  the period given and **may not apply again for six months**.
- Reglamento art. 145: regularisation does **not** by itself change the condition of stay,
  except in the art. 53 cases; and where the person was still holding a valid document when
  they went irregular by doing unauthorised activities, the regularised authorisation runs only
  for the remainder of that document.

### 4.5 Current programmes

Reglamento art. 143 lets SEGOB publish temporary programmes. Two were published: a 2015
programme and the *Programa Temporal de Regularización Migratoria* of DOF 2016-10-11, which
covered people who entered before 2015-01-09 and were irregular on 2017-01-09, and whose
transitional article says in terms that it `entrará en vigor el 09 de enero de 2017 y
concluirá su vigencia el 19 de diciembre de 2017`. **It is expired.**

**I could not establish that any temporary regularisation programme is open as at
2026-07-26.** See [§11](#11-what-i-could-not-establish). Encode only the permanent statutory
routes.

---

## 5. Nationality

### 5.1 By birth — Constitución art. 30(A)

> A) Son mexicanos por nacimiento:
> I. Los que nazcan en territorio de la República, sea cual fuere la nacionalidad de sus padres.
> II. Los que nazcan en el extranjero, hijos de padres mexicanos, de madre mexicana o de padre mexicano;
> III. Los que nazcan en el extranjero, hijos de padres mexicanos por naturalización, de padre mexicano por naturalización, o de madre mexicana por naturalización, y
> IV. Los que nazcan a bordo de embarcaciones o aeronaves mexicanas, sean de guerra o mercantes.

Unrestricted *ius soli* in fraction I, and *ius sanguinis* in II and III **with no generational
limit expressed in the constitutional text**. Fraction III is the one people miss: children born
abroad to a naturalised Mexican are Mexican by birth. In the *certificado de nacionalidad
mexicana* trámite, Reglamento de la Ley de Nacionalidad art. 12 requires such a child to file a
certified copy of the parent's *carta de naturalización* **issued before the child's birth** —
useful as an evidential signal of how SRE reads fraction III, though the article governs that
trámite rather than the attribution of nationality itself.

`NationalityAcquisition` in `@meridian/core` already distinguishes birth from naturalisation,
which is exactly the distinction art. 30 turns on. Reuse it; do not invent an MX-specific enum.

### 5.2 By naturalisation — Ley de Nacionalidad arts. 19-21

**Art. 19** — the applicant must: file the application with SRE; make the renunciations and
protest of art. 17 (which SRE `no podrá exigir` until it has decided to grant, so it is a
condition of issue, not of application); **prove they speak Spanish, know the country's history
and are integrated into the national culture**; and prove residence for the period set by art. 20.

**Art. 20** — the general period is **five years** of residence in national territory
`cuando menos durante los últimos cinco años inmediatos anteriores a la fecha de su solicitud`,
with these reductions:

| Provision | Period | Who |
|---|---|---|
| art. 20.I(a) | **2 years** | Direct-line descendant of a Mexican **by birth** |
| art. 20.I(a) ¶2 | **exempt from residence** | Direct-line descendant in the **second degree** of a Mexican by birth, provided they hold no other nationality at the time of application, or are not recognised the rights acquired at birth |
| art. 20.I(b) | **2 years** | Has Mexican children **by birth** |
| art. 20.I(c) | **2 years** | `Sea originario de un país latinoamericano o de la Península Ibérica` |
| art. 20.I(d) | **2 years**, or none at the President's discretion in exceptional cases | Has rendered outstanding services or works in cultural, social, scientific, technical, artistic, sporting or business matters benefiting the Nation, **in SRE's judgement** |
| art. 20.II | **2 years** | Spouse of a Mexican, having `residido y vivido de consuno en el domicilio conyugal establecido en territorio nacional` for the two years immediately preceding the application |
| art. 20.III | **1 year, uninterrupted** | Adoptees, and minor descendants to the second degree under the *patria potestad* of Mexicans |

Art. 20.II carries two riders worth encoding: the conjugal domicile need not be in Mexico where
the Mexican spouse is abroad on a Mexican government posting; and where two foreigners are
married and one later naturalises, the other may use this fraction. Art. 22: nationality
acquired under art. 20.II survives dissolution of the marriage, except on annulment
attributable to the naturalised spouse.

Reglamento art. 18.I adds that the marriage certificate must show a **date of celebration at
least two years before** the application — so the two years is of marriage *and* of conjugal
residence, not either.

**Art. 21 — absences, and this is the arithmetic rule.**

> Las ausencias temporales del país no interrumpirán la residencia, salvo que éstas se
> presenten durante los dos años anteriores a la presentación de la solicitud y excedan en
> total seis meses. La residencia a que se refiere la fracción III del artículo anterior,
> deberá ser ininterrumpida.

Read it precisely. Absences **before** the final two years do not count at all. Absences
**within** the final two years break residence only if they total more than six months. For
the one-year route in art. 20.III the residence must be unbroken outright.

For a two-year route, the whole qualifying period sits inside the two-year window, so the
six-month cap applies to all of it. For the five-year route, only the last two years are
tested. This is a `lookbackWindow` computation, not a total-absence count, and the existing
`DerivedFacts.absenceDaysTotal` is the wrong field for it — see
[§9.2](#92-facts-the-mx-routes-need-that-applicantfacts-does-not-model).

### 5.3 What counts as residence, and what does not

**Reglamento de la Ley de Nacionalidad art. 14** is decisive and short:

> Para efectos de lo dispuesto en los artículos 20 y 21 de la Ley, el interesado deberá
> acreditar la residencia en territorio nacional con cualquiera de los siguientes documentos:
> I. Con la tarjeta expedida por la Secretaría de Gobernación que acredite la condición de
> estancia de residente temporal, o
> II. Con la tarjeta expedida por la Secretaría de Gobernación que acredite la condición de
> estancia de residente permanente.

**Time as a *visitante* — including 180-day tourist stays repeated for years — proves nothing.**
Nor does irregular presence. Reglamento arts. 16.III, 17 and 18.III add that the card must have
at least **six months of validity remaining** after the application is filed.

Other requirements from Reglamento art. 16: majority of age and civil capacity; certified copy
of the foreign birth certificate, legalised or apostilled and translated (waivable for a person
SEGOB considers a refugee); a valid foreign passport or travel and identity document; a
statement under oath listing every entry and exit in the relevant period, for the art. 21
absence computation; a **federal and local criminal-record certificate**; photographs; and the fee.

**The examination.** Reglamento art. 15: every applicant must prove they speak Spanish, know the
country's history and are integrated into the national culture, `para lo cual deberá presentar y
aprobar los exámenes de acuerdo con los contenidos aprobados por el Instituto Matías Romero de
la Secretaría`. **Exempt from the history and culture element**, needing only to show they speak
Spanish: persons SEGOB considers refugees, minors, and **persons over sixty**.

SRE publishes a *guía de estudios*. I found **two inconsistent official statements of the pass
mechanics** and therefore encode none of them — see [§11](#11-what-i-could-not-establish).

**Discretion at the end.** Art. 23: SRE must first obtain SEGOB's opinion in every case.
Art. 24: the procedure is suspended if the applicant is committed for trial in Mexico or its
foreign equivalent. Art. 25: no *carta* is issued where the applicant fails the requirements, is
serving a custodial sentence for an intentional offence in Mexico or abroad, **or**
`cuando no sea conveniente a juicio de la Secretaría, en cuyo caso deberá fundar y motivar su
decisión`. That last is an open-ended discretion with only a reasons requirement attached, and
it means **no Mexican naturalisation criterion may ever produce a confident `eligible`**.

### 5.4 Dual nationality, and the Spanish art. 22 route

Constitución art. 37:

> A) Ningún mexicano por nacimiento podrá ser privado de su nacionalidad.
> B) La nacionalidad mexicana por naturalización se perderá en los siguientes casos:
> I. Por adquisición voluntaria de una nacionalidad extranjera, por hacerse pasar en cualquier
> instrumento público como extranjero, por usar un pasaporte extranjero, o por aceptar o usar
> títulos nobiliarios que impliquen sumisión a un Estado extranjero, y
> II. Por residir durante cinco años continuos en el extranjero.

**The asymmetry is total and it is directly relevant to this catalog.**

`packages/pathways/src/catalog/es-family-nationality.ts` already encodes Código Civil art. 22.1,
which confers the two-year Spanish residence period on `los nacionales de origen de los países
iberoamericanos, Andorra, Filipinas, Guinea Ecuatorial y Portugal`, and art. 23(b)'s
renunciation condition with the art. 24.1 exception. Mexico is an *país iberoamericano*.

- A **Mexican by birth** who naturalises in Spain under that route **cannot be deprived of
  Mexican nationality** — art. 37(A) admits no exception. This is why the catalog's Spanish
  records are safe to present to a Mexican-by-birth applicant.
- A **Mexican by naturalisation** who acquires Spanish nationality **loses Mexican nationality**
  under art. 37(B)(I), by operation of law, subject to a hearing (Ley de Nacionalidad arts. 27
  and 32: SRE declares the loss `previa audiencia del interesado` and revokes the *carta*).
  Art. 29: the loss affects only the person it falls on, not their family.
- Ley de Nacionalidad art. 28 obliges authorities and *fedatarios públicos* to report such cases
  to SRE within 40 working days of learning of them, which is why this is not theoretical.

**Encoder instruction.** Any pathway or guidance that mentions acquiring a second nationality
must branch on how the *Mexican* nationality was acquired. The existing
`ApplicantFacts.claimedNationalityAcquisition` carries exactly this, and a Mexican-facing rule
must treat it as absent-means-unknown rather than assuming birth. Getting this wrong tells a
naturalised Mexican that they may safely acquire another nationality when in fact they would
lose the one they have.

Two further consequences of the Constitution that a Mexican dual national needs surfaced:

- **Ley de Nacionalidad art. 12**: Mexicans by birth must enter and leave Mexico
  `ostentándose como nacionales, aun cuando posean o hayan adquirido otra nacionalidad`.
  Entering Mexico on the foreign passport is a breach, and art. 33.I attaches a fine.
- **Const. art. 32 ¶2 and Ley de Nacionalidad arts. 15-17**: offices reserved by the
  Constitution to Mexicans by birth are further reserved to those who **have not acquired
  another nationality**. To take such an office a dual national must obtain a *certificado de
  nacionalidad mexicana*, which requires an express renunciation of the other nationality, and
  if they acquire another nationality while in office they cease immediately.

None of this belongs in an automated eligibility verdict. It belongs in `guidance` text, and it
should carry a pointer to counsel.

---

## 6. The economic thresholds, and the UMA

### 6.1 The mechanism

Neither the Ley de Migración nor its Reglamento states a single monetary figure for solvency.
Reglamento arts. 129, 138 and 139 all say `solvencia económica suficiente` and defer the amount
to `disposiciones administrativas de carácter general que serán publicadas en el Diario Oficial
de la Federación`. Those are the two Lineamientos.

Both express their thresholds as a **number of days of an index**, never as pesos.

The index is the **Unidad de Medida y Actualización (UMA)**:

- **Constitución art. 26, apartado B** (paragraphs added DOF 2016-01-27): INEGI
  `calculará … el valor de la Unidad de Medida y Actualización que será utilizada como unidad
  de cuenta, índice, base, medida o referencia para determinar la cuantía del pago de las
  obligaciones y supuestos previstos en las leyes federales`; obligations denominated in UMA are
  of determinate amount and are settled by multiplying the number of units by the value of the
  unit at the relevant date.
- **Transitional art. Tercero of that same decree**: `todas las menciones al salario mínimo como
  unidad de cuenta, índice, base, medida o referencia … se entenderán referidas a la Unidad de
  Medida y Actualización.`
- **Ley para Determinar el Valor de la UMA art. 4**: daily value = previous year's daily value ×
  (1 + the December year-on-year change in the Índice Nacional de Precios al Consumidor); monthly
  value = daily × 30.4; annual value = monthly × 12.
- **Art. 5**: INEGI publishes the daily, monthly and annual values in the DOF **within the first
  ten days of January**, and **they take effect on 1 February** of that year.

So the figure changes on a fixed annual cadence, every 1 February, by an amount nobody can
predict in advance.

**The current published values** (INEGI, DOF 2026-01-09): daily **$117.31 MXN**, monthly
**$3,566.22 MXN**, annual **$42,794.64 MXN**, in force from **2026-02-01**.

Record that figure as a `statistics` citation with its own `verifiedOn`, and **never multiply it
into a threshold inside the catalog**. A threshold is `N días UMA`; the peso amount is the
caller's arithmetic at the moment of the question, exactly as `ReferenceIndices` already handles
IPREM and SMI for Spain.

### 6.2 The multiples, as published

**Consular — Lineamientos Generales para la expedición de visas, DOF 2025-07-25** (all figures
`días en UMA`; "balance" means `saldo promedio mensual` of investments or bank accounts, "income"
means `ingresos mensuales libres de gravámenes`):

| Trámite | Ground | Balance | Look-back | Income | Look-back |
|---|---|---|---|---|---|
| 1 — Visitante sin permiso | Solvency, employment/pension | — | — | **> 220** | 3 months (+ 1 year stable-employment certificate) |
| 1 | Solvency, savings | **680** | 3 months | — | — |
| 1 | Solvency, higher-education student | — | — | **130** | 3 months |
| 1 | Private inviting body | **2,290** | 12 months | — | — |
| 5 — Residencia temporal | Solvency, savings | **11,460** | 12 months | — | — |
| 5 | Solvency, employment/pension | — | — | **> 680** | 6 months |
| 5 | Invitation, host not covering maintenance | **11,460** | 12 months | **450** | 6 months |
| 5 | Private inviting body | **22,920** | 12 months | — | — |
| 5 | Real property in Mexico | value exceeding **91,710** | — | — | — |
| 5 | Investor — share capital / fixed assets | value exceeding **45,850** | — | — | — |
| 7 — Residencia permanente | Retired or pensioned, savings | **45,850** | 12 months | — | — |
| 7 | Retired or pensioned, pension income | — | — | **> 1,140** | 6 months |
| 7 | Family unity — maintenance per relative | **220** | 12 months | **> 220** | 6 months |

**INM — Lineamientos para trámites y procedimientos migratorios, DOF 2012-11-08, arts. 44 and 52
as reformed DOF 2016-09-30** (figures stated as `días de salario mínimo general vigente en el
Distrito Federal`):

| Article | Ground | Balance | Look-back | Income | Look-back |
|---|---|---|---|---|---|
| 52 — Regularización | Solvency (resident outcome) | **20,000** | 12 months | **400** | 6 months |
| 52 | Solvency (visitante sin permiso outcome) | **500** | 6 months | **150** | 6 months |
| 52 | Real property | value **40,000** | — | — | — |
| 52 | Investor | **20,000** | — | — | — (+ IMSS proof of at least 5 workers) |
| 52 | Student (resident outcome) | **20,000** | 12 months | **150** | — |
| 52 | Student (visitante outcome) | **300** | 6 months | **100** | — |
| 44 — Cambio a residente permanente | Retired or pensioned | **25,000** | 12 months | **500** | 6 months |

### 6.3 The two instruments disagree

Set the two side by side for the same-sounding test:

| Test | Consular (2025) | INM (2012) |
|---|---|---|
| Residente temporal — savings | 11,460 días | 20,000 días |
| Residente temporal — monthly income | > 680 días | 400 días |
| Residente permanente pensioner — savings | 45,850 días | 25,000 días |
| Residente permanente pensioner — income | > 1,140 días | 500 días |
| Investor | 45,850 días | 20,000 días (+ 5 workers vs 3) |
| Real property | 91,710 días | 40,000 días |

These are not the same rule seen twice. They are two instruments, thirteen years apart, neither
of which repeals or defers to the other, applying to two different application channels: the
consulate abroad and the INM counter in Mexico. **An encoder must therefore attach the threshold
to the channel, not to the status.** A pathway that models "residente temporal" with one solvency
criterion will be wrong for whichever channel it did not encode.

The most defensible encoding is two pathways — `mx-residente-temporal-consular` and
`mx-residente-temporal-regularizacion` — each carrying its own citation and its own multiple,
with `leadsTo` linking them where a conversion exists.

### 6.4 Three reasons not to compute a peso figure

1. **The index moves every 1 February.** A catalog shipping quarterly guarantees a wrong number.
2. **The INM instrument's unit no longer exists as named.** The *Distrito Federal* was renamed
   Ciudad de México in 2016, and the general minimum wage is now a national figure with a
   separate, higher rate for the *Zona Libre de la Frontera Norte*. The 2016 transitional article
   converts the reference to UMA as a matter of law, but **INM's own current public page still
   prints `salario mínimo general vigente en el Distrito Federal`**, so which number an INM
   officer actually applies is not something I could establish. See
   [§11](#11-what-i-could-not-establish).
3. **`libres de gravámenes` and `saldo promedio mensual` are themselves adjudicated terms.**
   Neither instrument defines how an average monthly balance is computed across accounts or
   currencies. Any peso arithmetic would be building on that sand.

Encode the multiple as data. Let the caller supply the index, exactly as `ReferenceIndices`
already does for Spain — a new `umaDailyMinorUnits` field is the natural extension, and when it
is absent the rule must yield `unknown` rather than a wrong answer.

---

## 7. Statutory vs reglamentario vs administrative — the `discretionary` decision table

| Proposition | Source layer | `kind` | `discretionary` | Weight |
|---|---|---|---|---|
| The nine condiciones de estancia and their maximum durations | Ley de Migración art. 52 | `statute` | `false` | `blocking` |
| Visitor 180-day ceiling | art. 52.I, art. 40.I | `statute` | `false` | `blocking` |
| Days actually granted at the port of entry | Lineamientos 2012 art. 26 + officer decision | `policy` | **`true`** | `informational` |
| Art. 53 bar on converting from visitante | Ley de Migración art. 53 | `statute` | `false` | `blocking` |
| The seven art. 54 permanent-residence grounds | Ley de Migración art. 54 | `statute` | `false` | `blocking` |
| Four years must be *consecutivos* as residente temporal | Reglamento art. 139.V | `regulation` | `false` | `blocking` |
| Two-year residente temporal step for spouses | art. 55.II/III, art. 56.II/III; Reglamento art. 141.I(c) | `statute` + `regulation` | `false` | `blocking` |
| Residence-card validity of one, two, three or four years | Reglamento art. 156 | `regulation` | `false` | `material` |
| First card is one year from entry; renewals 1/2/3 years | Lineamientos 2012 arts. 32, 34 | `policy` | **`true`** | `material` |
| Solvency multiples in *días UMA* | Lineamientos 2025 | `policy` | **`true`** | `material` |
| Solvency multiples in *días de salario mínimo* | Lineamientos 2012 | `policy` | **`true`** | `material` |
| UMA daily/monthly/annual values | INEGI, DOF 2026-01-09 | `statistics` | `false` | n/a — carry as a reference, not a criterion |
| Sixty-day window to regularise an overstay | Ley de Migración art. 134.I | `statute` | `false` | `blocking` |
| Right to regularise on the art. 133 ¶2 grounds | Ley de Migración art. 133 ¶2 | `statute` | `false` | `blocking` |
| INM's general power to regularise (art. 133 ¶1) | Ley de Migración art. 133 ¶1 | `statute` | **`true`** | `material` |
| Refusal grounds — national security, public security, inauthentic documents | Ley de Migración art. 43 | `statute` | **`true`** | `material` + `requiresHumanReview` |
| Naturalisation periods (5 / 2 / 1 years) | Ley de Nacionalidad art. 20 | `statute` | `false` | `blocking` |
| Absence rule (6 months in the final 2 years) | Ley de Nacionalidad art. 21 | `statute` | `false` | `blocking` |
| Residence proved only by a resident card | Reglamento de la Ley de Nacionalidad art. 14 | `regulation` | `false` | `blocking` |
| Spanish / history / culture examination | Reglamento de la Ley de Nacionalidad art. 15 | `regulation` | `false` (that it exists) | `material` |
| Exam pass mechanics | SRE administrative documents | — | — | **do not encode — see §11** |
| SRE may refuse `cuando no sea conveniente` | Ley de Nacionalidad art. 25.III | `statute` | **`true`** | `material` + `requiresHumanReview` |
| Visitante regional nationality list and frontier region | Lineamientos 2012 arts. 72-73 as reformed 2019 | `policy` | **`true`** | `material` |
| Visa-free entry on a valid US visa or third-country permanent residence | Lineamientos 2012 art. 26 | `policy` | **`true`** | `informational` |

**Two rules always escalate.** Art. 43 (refusal of a visa, of entry, or of stay, on
national-security, public-security, non-compliance, document-authenticity, express-prohibition or
other-provision grounds) and Ley de Nacionalidad art. 25.III (SRE's convenience discretion) are
both open-ended officer judgements with no threshold. Set `requiresHumanReview: true` on any
criterion that touches them. Neither is a thing software can decide, and a green tick next to
either would be the most damaging output this catalog could produce.

---

## 8. Live changes and live conflicts

### 8.1 The visa Lineamientos were entirely replaced on 2025-07-25

The *Lineamientos Generales para la expedición de visas* published in the DOF on 2014-10-10 were
**abrogated**, not amended. Transitional art. SEGUNDO of the 2025 instrument:

> Se abrogan los Lineamientos Generales para la expedición de visas que emiten las secretarías de
> Gobernación y de Relaciones Exteriores, publicados en el Diario Oficial de la Federación el 10
> de octubre de 2014, así como todas las disposiciones administrativas que se opongan al presente
> ordenamiento.

Transitional art. PRIMERO: in force fifteen natural days after publication. Every threshold is
now denominated in **UMA**, where the 2014 instrument used *días de salario mínimo*. Anything
written from the 2014 text — including most practitioner commentary still on the web — is
citing a repealed instrument.

The 2025 instrument also introduces an **electronic visa** (*Visa Electrónica*) for visitante sin
permiso applicants travelling by air, of nationalities the Mexican state designates, with the
system to be implemented within 180 natural days of entry into force (transitional arts. TERCERO
and SEXTO). It requires biometric capture — face, iris and fingerprints — at consular interviews
(DÉCIMO QUINTO.II).

### 8.2 The 2026-05-15 *Acuerdo* adds a technical-assistance ground

Published DOF 2026-05-15 (edición vespertina), in force the day after publication. It:

- **adds a new ground `h.` to Trámite 5** (Visa de Residencia Temporal) —
  *Asistencia técnica de alta especialidad y transferencia de conocimientos en proyectos
  estratégicos*. **It carries no monetary threshold at all.** What it requires is a *carta
  responsiva* from a Mexican legal person describing the strategic project, an express commitment
  to run a knowledge-transfer and training programme for Mexican staff, a sworn statement that the
  arrangement is not subordinate employment, does not displace national talent and carries no
  Mexican-source remuneration, and joint-and-several responsibility for maintenance and return;
  plus documents proving the foreigner's specialisation;
- **amends Trámite 10** (residencia temporal or visitante con permiso by job offer, filed at INM)
  to require the occupation to be stated per the *Sistema Nacional de Clasificación de
  Ocupaciones*, the work modality (in person, remote or mixed), every address where the work will
  be done, and the amount and periodicity of remuneration; and, for strategic projects, the
  knowledge-transfer programme and evidence of the foreigner's qualifications;
- **amends Trámite 11** correspondingly;
- adds to art. DÉCIMO NOVENO(B) that `la autoridad consular no podrá solicitar a la persona
  extranjera interesada requisitos adicionales a los previstos en la Ley, el Reglamento, los
  presentes Lineamientos y demás disposiciones jurídicas aplicables`.

Transitional art. Tercero is unusual and worth carrying in a note: the Mexican state may suspend
the *Acuerdo* temporarily or permanently for reasons of national security, public order or public
health. A route that can be switched off by administrative decision is not a stable route.

### 8.3 The three-day / seven-day conflict

| Source | Date | Says |
|---|---|---|
| Ley de Migración art. 52.III | reformed DOF 2017-05-19 | `sin que su permanencia exceda de siete días` |
| Reglamento arts. 133.I.b) and 154 | DOF 2012, last reform 2014 | `hasta por tres días naturales` |
| Lineamientos 2012 art. 27 | DOF 2012 | `tres días` |
| *Acuerdo* DOF 2019-04-23, considerandos | 2019 | recites `siete días` from the statute |
| INM public page (fetched 2026-07-26) | current | `hasta por siete días` |

The statute is later and higher, and INM's own instrument and public page follow it. Encode
**seven days**, cite art. 52.III, and put the unrepealed regulation in the criterion `note` so a
reviewing lawyer sees the conflict rather than rediscovering it. This is a live example of the
general pattern in Mexican migration law: **the Reglamento has not been amended since 2014 and
the statute has been amended repeatedly since.** Always check the statute last.

### 8.4 The de-indexation the INM instrument never absorbed

The 2016-01-27 constitutional reform converted every "salario mínimo as a unit of account"
reference to UMA, and gave legislatures and administrations **one year** to rewrite their texts
(transitional art. Cuarto). Ten years later the *Lineamientos para trámites y procedimientos
migratorios* still print the old unit, as do the fine provisions in Ley de Migración arts. 145-158
and Ley de Nacionalidad arts. 33-34. The conversion happens by operation of the transitional
article, but the texts do not say so, which is why every figure in
[§6.2](#62-the-multiples-as-published)'s second table needs `discretionary: true`.

---

## 9. What this means for the existing catalog

### 9.1 The `MX` gap is an origin/destination asymmetry

`packages/atlas` already carries MX as a jurisdiction and the US→MX corridor by weight; the
CUSMA professions file already treats Mexico as a treaty party. What is missing is any `Pathway`
with `jurisdiction: 'MX'`. Adding one changes no engine code — the evaluator is law-free — but it
does add a fourth jurisdiction to `catalog/index.ts` and to the integrity checks, so expect the
catalog counts asserted in `packages/pathways/tests/` to move.

### 9.2 Facts the MX routes need that `ApplicantFacts` does not model

Five gaps, in descending order of how badly their absence would distort an answer.

1. **The nationality-acquisition mode of a *relative*, not of the applicant.** Arts. 54.VI and
   54.VII, and Ley de Nacionalidad art. 20.I(a) and (b), all turn on a relative being Mexican
   **por nacimiento**. `claimedNationalityAcquisition` describes the applicant. There is no field
   for "my child is Mexican, and Mexican by birth". Without it, a criterion for art. 54.VI can
   only evaluate to `unknown`, which is the correct failure mode but a useless product.
2. **An absence window anchored to the final two years.** Ley de Nacionalidad art. 21 tests
   absences *within the two years before the application*, not lifetime absences.
   `DerivedFacts.absenceDaysTotal` and `longestAbsenceDays` are both lifetime figures. The
   computation needed is `intersectRanges(absence, lookbackWindow(applicationDate, 2 years))`
   summed — all of which exists in `@meridian/core`; only the derived field does not.
3. **A UMA index.** `ReferenceIndices` carries `ipremAnnualMinorUnits` and `smiAnnualMinorUnits`.
   Mexican thresholds are multiples of a **daily** value, and the derived multiple the catalog
   needs is `monthlyIncome / dailyUma` and `averageBalance / dailyUma` — different arithmetic from
   the Spanish annual ratios. Do not reuse the IPREM field for a different index; a silently
   mismatched index is worse than an absent one.
4. **An average account balance over a stated look-back.** Every Mexican savings-based ground is
   `saldo promedio mensual … durante los últimos N meses`. `MonetaryAmount` models a single
   annual or monthly figure. There is no representation of a balance, of an averaging period, or
   of "free of encumbrances".
5. **The channel.** Consular versus INM decides which threshold applies
   ([§6.3](#63-the-two-instruments-disagree)) and whether art. 53 bars the route at all. Today the
   only nearby fact is `currentStatus`, which does not distinguish "outside Mexico applying at a
   consulate" from "inside Mexico on a tourist permit".

**Do not add any of these to `packages/core`.** They are `packages/pathways` facts, and the
package-boundary rule in AGENTS.md is explicit that a domain package must not grow a helper in
core. Gaps 1, 2 and 4 are new optional fields on `ApplicantFacts` plus new optional
`DerivedFacts`; gap 3 is one new optional field on `ReferenceIndices`; gap 5 is one new optional
field on `Intent` or a new small interface.

### 9.3 What can be encoded today without any fact-model change

- Art. 52 durations and work permissions as `information`.
- The art. 53 bar, as a `blocking` criterion on `currentStatus === 'visitor'`.
- The art. 134.I sixty-day regularisation window, using `date_on_or_before` against the status
  expiry — this is a clean calendar test with an existing operator.
- The art. 54.V four-year route, using `duration_since_at_least` with `years: 4`.
- The art. 55/56 two-year spousal step, using `duration_since_at_least` with `years: 2`.
- The Ley de Nacionalidad art. 20 periods, using `duration_since_at_least` with `years: 5`, `2`
  or `1`, subject to the art. 21 absence rule escalating to human review until the derived field
  exists.
- The nationality-by-birth rules of Const. art. 30(A) as `information`.

Everything with a money figure in it needs the index first. Encode the criterion with the
multiple and let it return `unknown` — that is the designed behaviour and it is honest.

---

## 10. Scope exclusions, and how to name them

**Out of scope, absolutely, and not to be encoded as an assessable pathway:**

- **Recognition of the condition of refugee** — Ley sobre Refugiados, Protección Complementaria y
  Asilo Político art. 13, on the three grounds: a well-founded fear of persecution for race,
  religion, nationality, gender, membership of a particular social group or political opinion;
  having fled because life, security or liberty were threatened by generalised violence, foreign
  aggression, internal conflict, massive human-rights violation or other circumstances gravely
  disturbing public order; and *sur place* claims.
- **Complementary protection** — art. 2.VII: SEGOB's protection of a person not recognised as a
  refugee, consisting of not returning them to a territory where their life would be threatened or
  they would risk torture or other cruel, inhuman or degrading treatment or punishment.
- **Political asylum** — art. 2.I, granted by SRE, diplomatic or territorial.
- **Statelessness determination** — Ley de Migración art. 54.I, Reglamento arts. 149-151.

**Why.** These are not eligibility arithmetic. They are individualised risk assessments in which a
wrong answer can return someone to danger, they are decided by a specialist body on evidence a
form cannot capture, and they carry a **30-working-day filing deadline** from the day after entry
(Ley sobre Refugiados art. 18) that a person who trusted a self-serve tool could miss
irrecoverably.

**What the catalog may say**, as `information` only:

- That these procedures exist and are separate.
- That the competent body is the **Comisión Mexicana de Ayuda a Refugiados (COMAR)** for refugee
  status and complementary protection, and **SRE** for political asylum.
- That an applicant is entitled to *visitante por razones humanitarias* status while the procedure
  runs (Ley de Migración art. 52.V(c)), and that on a positive decision the person receives
  **residente permanente** (art. 54.I; Ley sobre Refugiados art. 44.VII).
- That the deadline is 30 working days from the day after entry, or from when it became materially
  possible to file, and that this is a statutory deadline.
- **That the person should obtain qualified help immediately**, with a pointer to
  <https://www.gob.mx/comar>.

**What it must never do**: assess whether the fear is well-founded, rank protection against a
migration route, or state a likelihood of recognition. Any function that produced such an output
would be `advice` with an empty evidence base, which is the exact failure `DisclosureClass`
exists to prevent.

The same treatment applies to the *visitante por razones humanitarias* ground in art. 52.V(c) and
to the regularisation ground in Reglamento art. 144.IV(e): both are **derivative** of a protection
procedure. Encode the migration consequence, never the protection question.

---

## 11. What I could not establish

Prefer omitting a criterion to encoding anything in this section.

1. **Whether the `sistema de puntos` has ever been implemented.** No published *acuerdo* surfaced
   in DOF searching. Three administrative instruments spanning 2012-2025 and INM's current public
   page all still speak of it prospectively, which is strong but not conclusive. I cannot prove a
   negative. **Do not encode the route as available.**
2. **Whether any temporary regularisation programme is open as at 2026-07-26.** The 2015 and 2016
   programmes are expired by their own transitional articles; I found no successor. Reglamento
   art. 143 makes a new one possible at any time and it would be published in the DOF. Re-check
   before shipping and again at every review.
3. **Which numeric value INM actually applies to the `salario mínimo general vigente en el
   Distrito Federal` figures in its 2012 Lineamientos.** The 2016 constitutional transitional
   article converts the reference to UMA as a matter of law. INM's own live FAQ still prints the
   old unit. Whether officers apply the UMA daily value, the current national minimum wage, or the
   *Zona Libre de la Frontera Norte* wage is not something I could source. **Encode the multiple,
   not the unit-to-peso conversion, and mark it `discretionary: true`.**
4. **The naturalisation exam pass mechanics.** I found two inconsistent official statements: an
   SRE procedure document for *Delegaciones Foráneas* (PR-DGAJ-17, dated 2012-03-01) specifying
   five questions, four correct to pass, fifteen minutes, and a retake every ten days; and SRE's
   current naturalisation trámite page stating a retake after fifteen working days, two attempts
   permitted, and a one-year wait after failing twice. I could not reach SRE's *guía de estudios*
   page — it is behind bot protection that redirects to a validation host, which I did not follow.
   **Encode only that an exam exists under Reglamento art. 15 and that its contents are approved
   by the Instituto Matías Romero. No question counts, no pass marks, no timings.**
5. **Which countries count as `un país latinoamericano` or `la Península Ibérica` for
   Ley de Nacionalidad art. 20.I(c).** Neither the statute, the Reglamento, nor the SRE trámite
   page I fetched enumerates them. This is the same problem the Spanish records have with
   `países iberoamericanos`, and it must be resolved the same way: escalate rather than guess.
   Note that the two lists are not obviously identical — Spain's art. 24.1 list is
   *iberoamericano* plus Andorra, the Philippines, Equatorial Guinea and Portugal; Mexico's is
   *latinoamericano* plus the Iberian Peninsula, which reads as including Spain, Portugal and
   arguably Andorra but excluding the Philippines and Equatorial Guinea.
6. **The current list of nationalities requiring a Mexican visa.** Art. 40 defers to
   visa-suppression agreements and unilateral decisions (Lineamientos 2025, TERCERO), and the list
   is administrative and changes without amendment of any instrument. I did not locate a
   canonical, dated, machine-readable list. **Do not encode a country list.** Encode the
   mechanism, and the art. 26 facilitation (US visa or third-country permanent residence) which
   *is* in a dated instrument.
7. **Whether the *visitante trabajador fronterizo* nationality list was ever extended.** The 2019
   *acuerdo* extended the *visitante regional* list (art. 72) to El Salvador and Honduras but did
   not touch art. 75, which still names Guatemala and Belize. Whether that was deliberate or an
   oversight, and what INM does in practice, I could not establish.
8. **How `saldo promedio mensual` and `libres de gravámenes` are computed** — across multiple
   accounts, across currencies, or where income is irregular. Neither Lineamientos defines them.
9. **Processing times.** Both Lineamientos state *maximum* statutory decision periods (10 working
   days for a consular visa; 20 working days for a change of status; 30 natural days for
   regularisation under art. 136). Those are legal ceilings, not service standards, and INM
   publishes no service standard I could find. **`publishedProcessingDays` must stay unset.** Put
   the statutory maximum in a `note` if it is useful, and say it is a legal deadline, not an
   estimate.
10. **Whether the Reglamento de la Ley de Migración has been amended since 2014-05-23.** The
    Cámara de Diputados consolidated text says it has not. I did not independently sweep the DOF
    for a later reform, so a very recent one could be missing.

---

## 12. How to write the citations

Ten citations cover most of what an encoder will need. Ids follow the existing `xx-...`
convention.

| Id | `kind` | `instrument` | `provision` |
|---|---|---|---|
| `mx-cpeum-art-30` | `statute` | `Constitución Política de los Estados Unidos Mexicanos` | `art. 30` |
| `mx-cpeum-art-37` | `statute` | `Constitución Política de los Estados Unidos Mexicanos` | `art. 37` |
| `mx-cpeum-art-26b-uma` | `statute` | `Constitución Política de los Estados Unidos Mexicanos` | `art. 26, apartado B` |
| `mx-lmigra-art-52` | `statute` | `Ley de Migración (México)` | `art. 52` |
| `mx-lmigra-art-53` | `statute` | `Ley de Migración (México)` | `art. 53` |
| `mx-lmigra-art-54` | `statute` | `Ley de Migración (México)` | `art. 54` |
| `mx-lmigra-art-133` | `statute` | `Ley de Migración (México)` | `art. 133` |
| `mx-lmigra-art-134` | `statute` | `Ley de Migración (México)` | `art. 134` |
| `mx-reg-lmigra-art-139` | `regulation` | `Reglamento de la Ley de Migración` | `art. 139` |
| `mx-reg-lmigra-art-156` | `regulation` | `Reglamento de la Ley de Migración` | `art. 156` |
| `mx-lnac-art-20` | `statute` | `Ley de Nacionalidad` | `art. 20` |
| `mx-lnac-art-21` | `statute` | `Ley de Nacionalidad` | `art. 21` |
| `mx-lnac-art-25` | `statute` | `Ley de Nacionalidad` | `art. 25` |
| `mx-reg-lnac-art-14` | `regulation` | `Reglamento de la Ley de Nacionalidad` | `art. 14` |
| `mx-lineamientos-visas-2025-t5` | `policy` | `Lineamientos Generales para la expedición de visas que emiten las secretarías de Gobernación y de Relaciones Exteriores` | `Trámite 5` |
| `mx-lineamientos-visas-2025-t7` | `policy` | *(as above)* | `Trámite 7` |
| `mx-lineamientos-tramites-2012-art-52` | `policy` | `Lineamientos para trámites y procedimientos migratorios` | `art. 52` |
| `mx-uma-2026` | `statistics` | `Unidad de Medida y Actualización (INEGI)` | `DOF 2026-01-09` |

Rules for this jurisdiction specifically:

- **Always put the DOF date of the version you read in `note`.** `Ley de Migración art. 52`
  without `última reforma DOF 2026-01-15` names four different texts since 2011.
- **`policy` for both Lineamientos, never `regulation`.** They are administrative instructions
  issued by secretaries, not decrees issued by the President. The distinction decides whether an
  applicant can argue the rule is *ultra vires* the Reglamento, which is precisely the argument
  live in [§8.3](#83-the-three-day--seven-day-conflict).
- **`discretionary: true` on every `policy` citation.** Both Lineamientos are amended by
  free-standing acuerdos with no consolidated official text, so the version you read is a snapshot.
- Prefer the Cámara de Diputados consolidated PDFs for statutes and reglamentos, and
  `sidof.segob.gob.mx/notas/docFuente/<id>` for DOF instruments — the latter is the official DOF
  system and serves the full text without the certificate problems the `dof.gob.mx` front end has.

---

## 13. Source register

Every URL below was fetched on **2026-07-26** and its text read.

### Statutes and regulations — Cámara de Diputados, *texto vigente*

| Instrument | URL | Version read |
|---|---|---|
| Constitución Política de los Estados Unidos Mexicanos | <https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf> | últimas reformas DOF 2026-06-02 |
| Ley de Migración | <https://www.diputados.gob.mx/LeyesBiblio/pdf/LMigra.pdf> | DOF 2011-05-25, última reforma DOF 2026-01-15 |
| Reglamento de la Ley de Migración | <https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LMigra.pdf> | DOF 2012-09-28, última reforma DOF 2014-05-23 |
| Ley de Nacionalidad | <https://www.diputados.gob.mx/LeyesBiblio/pdf/53.pdf> | DOF 1998-01-23, última reforma DOF 2012-04-23 |
| Reglamento de la Ley de Nacionalidad | <https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LNac.pdf> | DOF 2009-06-17, última reforma DOF 2013-11-25 |
| Ley sobre Refugiados, Protección Complementaria y Asilo Político | <https://www.diputados.gob.mx/LeyesBiblio/pdf/LRPCAP.pdf> | DOF 2011-01-27, última reforma DOF 2022-02-18 |
| Ley para Determinar el Valor de la Unidad de Medida y Actualización | <https://www.diputados.gob.mx/LeyesBiblio/pdf/LDVUMA_301216.pdf> | DOF 2016-12-30 |

### Administrative instruments — Sistema de Información del Diario Oficial de la Federación

| Instrument | URL | DOF date |
|---|---|---|
| Lineamientos Generales para la expedición de visas que emiten las secretarías de Gobernación y de Relaciones Exteriores | <https://sidof.segob.gob.mx/notas/docFuente/5763837> | 2025-07-25 |
| Acuerdo por el que se reforman y adicionan los Lineamientos Generales para la expedición de visas… | <https://sidof.segob.gob.mx/notas/docFuente/5787660> | 2026-05-15 |
| Lineamientos para trámites y procedimientos migratorios | <https://sidof.segob.gob.mx/notas/docFuente/5276967> | 2012-11-08 |
| Acuerdo por el que se modifica el artículo 73 de los Lineamientos para trámites y procedimientos migratorios | <https://sidof.segob.gob.mx/notas/docFuente/5356563> | 2014-08-15 |
| Acuerdo por el que se reforman y adicionan los Lineamientos para trámites y procedimientos migratorios (arts. 2, 50, 51, 52; adds 24 Bis, 24 Ter) | <https://sidof.segob.gob.mx/notas/docFuente/5455318> | 2016-09-30 |
| Acuerdo por el que se reforman los Lineamientos para trámites y procedimientos migratorios (arts. 72, 73, 74) | <https://sidof.segob.gob.mx/notas/docFuente/5558294> | 2019-04-23 |
| Programa Temporal de Regularización Migratoria — **expired 2017-12-19** | <https://sidof.segob.gob.mx/notas/docFuente/5456183> | 2016-10-11 |
| Unidad de Medida y Actualización — INEGI, values in force from 2026-02-01 | <https://sidof.segob.gob.mx/notas/docFuente/5778072> | 2026-01-09 |

A consular reproduction of the 2025 Lineamientos was also fetched at
<https://consulmex.sre.gob.mx/houston/images/lineamientos-visas-25-jul-2025.pdf> and spot-checked
against the DOF text for six of the UMA multiples. They match. Cite the DOF, not the consulate.

### Agency guidance — `official_guidance`, all `discretionary: true`

| Page | URL |
|---|---|
| INM — Tarjeta de Visitante Regional (TVR) | <https://www.gob.mx/inm/acciones-y-programas/tarjeta-de-visitante-regional-tvr> |
| INM — becoming a residente permanente | <https://www.gob.mx/inm/articulos/todo-lo-que-necesitas-saber-para-convertirte-en-residente-permanente-en-mexico> |
| INM — FAQ, regularisation for an expired document or unauthorised activities | <https://www.gob.mx/inm/documentos/preguntas-frecuentes-para-solicitar-la-regularizacion-por-tener-documento-vencido-o-realizar-actividades-no-autorizadas> |
| INM — FAQ, issue of the migratory document on authorisation of a condición de estancia | <https://www.gob.mx/inm/es/documentos/preguntas-frecuentes-para-solicitar-la-expedicion-de-documento-migratorio-por-autorizacion-de-condicion-de-estancia> |
| SRE — carta de naturalización for nationals of a Latin American country or the Iberian Peninsula | <https://portales.sre.gob.mx/tramites-dgaj/naturalizacion/carta-de-naturalizacion-por-ser-originario-de-un-pais-latinoamericano-o-de-la-peninsula-iberica> |
| SRE — PR-DGAJ-17, *Obtención de la Carta de Naturalización en Delegaciones Foráneas* (2012-03-01) | <https://sre.gob.mx/images/stories/docnormateca/manproce/om/dgaj/pr-dgaj-17.pdf> |
| COMAR | <https://www.gob.mx/comar> |

### Reached for, and not used

- `https://portales.sre.gob.mx/tramites-dgaj/naturalizacion/carta-de-naturalizacion-por-residencia`
  and `.../guia-de-estudios` — both returned a 302 to a bot-validation host. **Not followed.**
  Nothing in this brief rests on them.
- `dof.gob.mx/nota_detalle.php` — TLS chain could not be verified from this environment. The same
  documents were read through `sidof.segob.gob.mx`, which is the same publisher's system.
- Search-engine result summaries. Several appeared during this sweep with plausible figures for
  the naturalisation exam and for the visa-requiring nationality list. **None of them is cited
  anywhere above**, and the propositions they carried are in [§11](#11-what-i-could-not-establish)
  instead.
