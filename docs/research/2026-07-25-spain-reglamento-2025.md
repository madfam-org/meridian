# Spain — the 2025 Reglamento de Extranjería

**Research brief for pathway encoders. Read this before writing any Spanish criterion.**

- Researched: 2026-07-25. Use `verifiedOn: '2026-07-25'` for citations built from this brief.
- Author: an agent, not counsel. Nothing here is a review. Every pathway built from this
  brief still ships `reviewStatus: 'unreviewed'`.
- Every URL in the [source register](#9-source-register) was fetched during this sweep.
  Where a proposition rests on something I could **not** verify from an official source,
  it is in [§7](#7-what-i-could-not-establish). Prefer omitting a criterion to encoding
  anything from §7.

---

## 0. Bottom line

1. The instrument is **Real Decreto 1155/2024, de 19 de noviembre**. BOE núm. 280 of
   **20 November 2024**. In force **20 May 2025**. It repealed RD 557/2011 in full.
2. It has been amended **once**: by **Real Decreto 316/2026, de 14 de abril** (BOE núm. 92
   of 15 April 2026, in force 16 April 2026). Nothing else has touched it.
3. *Arraigo* is now **five named figures** in arts. 125–127, all sharing a **two-year**
   continuous-presence requirement (except *arraigo familiar*, which requires none).
   The old three-year *arraigo social* period is gone; *arraigo laboral* no longer exists
   under that name.
4. RD 316/2026 added **two further, time-limited arraigo figures** (DA 20ª and DA 21ª).
   Both closed to new applications on **30 June 2026** — i.e. before today. They must be
   encoded as `status: 'closed'`, not as open routes.
5. **Every citation in `packages/pathways/src/catalog/es.ts` that points at RD 557/2011 is
   now pointing at a repealed instrument.** One pathway (`es-non-lucrative-visa`) is
   affected directly; see [§3](#3-what-this-does-to-the-existing-catalog).
6. `packages/presence/src/continuity.ts` is **not** superseded — it encodes a *nationality*
   rule, and nationality is Código Civil territory, which RD 1155/2024 does not touch. But
   its 180-day figure could not be traced to an official source in this sweep, and there
   are now three *verifiable* Spanish absence rules it does not model. See
   [§4](#4-packagespresencesrccontinuityts).

---

## 1. The instrument

### 1.1 Identification

| Field | Value |
|---|---|
| Title | Real Decreto 1155/2024, de 19 de noviembre, por el que se aprueba el Reglamento de la Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social |
| BOE reference | `BOE-A-2024-24099` |
| Published | BOE núm. 280, **20 November 2024** |
| Signed | 19 November 2024 |
| Entered into force | **20 May 2025** |
| Consolidated text | <https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099> |

Entry into force is established four independent ways, all official, and they agree:

- **Disposición final cuarta** (verbatim): *"El presente Real Decreto y el Reglamento que
  por él se aprueba entrarán en vigor a los 6 meses de su publicación en el «Boletín
  Oficial del Estado»."* Published 20 November 2024 ⇒ 20 May 2025.
- The BOE consolidated header for the norm states: *"«BOE» núm. 280, de 20/11/2024.
  **Entrada en vigor: 20/05/2025**"*.
- BOE's structured metadata for the norm carries `fecha_vigencia = 20250520`, and **every**
  article block in the consolidated text is stamped `fecha_vigencia="20250520"` on its
  original version.
- The Secretaría de Estado de Migraciones' own Instrucciones SEM 1/2025 open by recording
  that the RLOEX *"deroga con efectos desde el 20 de mayo de 2025, el Reglamento aprobado
  por Real Decreto 557/2011, de 20 de abril"*.

**Do not approximate this date.** It is not "2025", not "mid-2025", and not the publication
date. It is 20 May 2025.

### 1.2 What it repealed

**Disposición derogatoria única** (verbatim): *"Quedan derogados el Reglamento de la Ley
Orgánica 4/2000 […] aprobado por el Real Decreto 557/2011, de 20 de abril […]; y cuantas
otras disposiciones, de igual o inferior rango, se opongan a lo dispuesto en este real
decreto y en el reglamento que por él se aprueba."*

BOE's own relations record for the norm states the repeal took effect *"con efectos desde
el 20 de mayo de 2025"*.

RD 557/2011 remains readable at <https://www.boe.es/buscar/act.php?id=BOE-A-2011-7703> and
is still the governing text for applications lodged before 20 May 2025 — see
[§6](#6-transitional-provisions).

### 1.3 The one amendment: RD 316/2026

| Field | Value |
|---|---|
| Title | Real Decreto 316/2026, de 14 de abril, por el que se modifica el Real Decreto 1155/2024, de 19 de noviembre […] |
| BOE reference | `BOE-A-2026-8284` |
| Published | BOE núm. 92, **15 April 2026** (pp. 53342–53362) |
| Entered into force | **16 April 2026** — *"el día siguiente al de su publicación"* |
| Text | <https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8284> · ELI <https://www.boe.es/eli/es/rd/2026/04/14/316> |

What it did, per BOE's own relations record for RD 1155/2024: *"SE DEROGA la disposición
transitoria 5 del Real Decreto, SE MODIFICA determinados preceptos y SE AÑADE las
disposiciones adicionales 20 y 21 a su Reglamento."*

Articles it touched that matter here: **126** (added requirement h), **127.c)** (rewrote the
*arraigo social* integration report), **130.5** (provisional work authorisation), **132.2.a)**
(prórroga), plus 97, 172, 190, 191. It added **DA 20ª** and **DA 21ª** and repealed
**DT 5ª**.

### 1.4 Nothing else has amended it

BOE's relations record for `BOE-A-2024-24099` lists exactly two subsequent instruments:
RD 316/2026 (the amendment above) and Orden ISM/164/2026, de 2 de marzo, which is *dictada
de conformidad* with art. 197.4.c) and creates the Registro Electrónico de Colaboradores de
Extranjería — it does not amend the Reglamento. The consolidated text's last published
update is **15/04/2026**.

This matters for [§2.4](#24-the-two-time-limited-figures-added-in-2026): there is **no BOE
instrument extending the 30 June 2026 window**.

### 1.5 How to write the citation

The Real Decreto approves a Reglamento; almost every substantive provision an encoder wants
is an article *of the Reglamento*, not of the Real Decreto. Suggested `instrument` string:

> `Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre`

with `provision` carrying the article (`art. 127.c)`), `kind: 'regulation'`, and
`url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099'`.

Where the operative text is the 2026 wording, say so in the `note` and cite RD 316/2026 as
a second citation. The BOE consolidated page serves the amended text at the same URL, so
one URL is honest for both; the `note` is what tells the reader which wording they are
looking at.

---

## 2. Arraigo

**This is the single most important section.** The structure changed, the names changed,
the qualifying periods changed, and one figure disappeared.

Architecture in the Reglamento: Título VII (*Residencia temporal por circunstancias
excepcionales*), Capítulo I, Sección 2ª.

| Article | Subject |
|---|---|
| 124 | Definition — the LO 4/2000 art. 31.3 hook |
| **125** | The types, and their duration |
| **126** | General requirements (common to all figures) |
| **127** | Specific requirements (per figure) |
| 130 | Procedure |
| 131 | Work authorisation attached to the residence |
| 132 | Prórroga |

### 2.1 The five figures (art. 125)

Art. 125.1 verbatim: *"Se concederá una autorización de residencia temporal por razones de
arraigo a las personas extranjeras que se encuentren en España, cuando existan vínculos con
el lugar en el que residen, ya sean de tipo económico, social, familiar, laboral o
formativo, siempre que cumplan con los requisitos establecidos en los artículos 126 y 127."*

| # | Name (ES) | Name (EN, suggested) | Continuous presence | Duration |
|---|---|---|---|---|
| a | arraigo de segunda oportunidad | second-chance rootedness | 2 years | 1 year |
| b | arraigo sociolaboral | socio-labour rootedness | 2 years | 1 year |
| c | arraigo social | social rootedness | 2 years | 1 year |
| d | arraigo socioformativo | socio-educational rootedness | 2 years | 1 year |
| e | arraigo familiar | family rootedness | **none** | **5 years** |

Art. 125.2 verbatim: *"La duración de estas autorizaciones es de un año, salvo por razón de
arraigo familiar, cuya duración será de cinco años."*

**What changed against RD 557/2011 art. 124** (the repealed text, read in its final
consolidated form as amended by RD 629/2022):

| Old figure | Old period | Now |
|---|---|---|
| arraigo **laboral** | 2 years + ≥6 months of proven prior employment | **Gone under that name.** The employment-based figure is now *arraigo sociolaboral*, which is forward-looking (a contract) rather than backward-looking (past work) |
| arraigo **social** | **3 years** | **2 years** |
| arraigo **familiar** | no period | no period |
| arraigo **para la formación** | 2 years | renamed *arraigo socioformativo*, 2 years |
| — | — | **new**: *arraigo de segunda oportunidad*, 2 years |

The reduction of *arraigo social* from three years to two is the headline change and the
one most likely to be got wrong from memory.

### 2.2 General requirements — art. 126

Applies cumulatively (*"cumpla de forma acumulativa"*) to **all five** figures.

| Limb | Requirement | Notes |
|---|---|---|
| a) | In Spain, and not an applicant for international protection at the time of filing or during processing | The Reglamento defines "applicant" as someone whose protection claim has no final decision, administrative and where applicable judicial |
| **b)** | **Continuous presence in Spain for at least the two years before filing** | *"El arraigo familiar no requerirá ninguna permanencia mínima."* Time spent in Spain while a protection claim was pending does **not** count |
| c) | Not a threat to public order, security or public health | |
| d) | No criminal record in Spain, or in countries of residence in the five years before entering Spain, for offences that exist in Spanish law | Note the framing: *five years before entering Spain*, not five years before filing |
| e) | Not listed as inadmissible in the territory of states with which Spain has an agreement to that effect | |
| f) | Not within a non-return commitment period | |
| g) | Fee paid | |
| **h)** | **Not the holder of a stay or residence authorisation, and not an interested party in any pending stay/residence grant, extension, renewal or modification procedure** | **Added by RD 316/2026 art. único.2, in force 16 April 2026.** This is new and it is exclusionary — encode it |

### 2.3 Specific requirements — art. 127

**a) Arraigo de segunda oportunidad.** Must have *held* a residence authorisation — one not
granted on exceptional-circumstances grounds — in the **two years immediately before**
filing, whose renewal did not occur for reasons other than public order, security or public
health. Applications remain possible where there is an acquittal, dismissal or a decision
denying the penalty.

**b) Arraigo sociolaboral.** One or more employment contracts guaranteeing at least the
*salario mínimo interprofesional* or the applicable collective-agreement wage, in proportion
to hours worked, and totalling a weekly working time of **not less than 20 hours** in
aggregate. Multiple contracts are admitted for (1) seasonal work and (2) simultaneous
part-time work for more than one employer. The employer must satisfy art. 74 except
art. 74.1.a).

> *Compare with the old law*: RD 557/2011 required **30 hours/week** for *arraigo social*
> (20 only where the applicant had dependants). The threshold is now 20 hours across the
> board. Do not carry the 30-hour figure forward.

**c) Arraigo social.** Two alternative routes, both requiring means:

- *Family-ties route*: family ties to other foreign nationals **holding a residence
  authorisation**, limited to spouse or registered partner and first-degree relatives in the
  direct line.
- *Integration route*: where those ties are not shown, *"se valorará el esfuerzo de
  integración de la persona extranjera"*, evidenced by a favourable social-integration
  report from the Comunidad Autónoma (or, where the CA has so provided and notified the
  Secretaría de Estado de Migraciones, the local Corporación). One-month issuing deadline;
  if not issued in time, and the applicant proves that, the requirement may be met by any
  means of proof.

Means: *"deberán alcanzar, al menos, el 100 % del IPREM"*, available in Spain. The
2026 wording says the means *"podrán proceder de los familiares mencionados en este
párrafo"* (the 2025 wording said *"procederán"* — RD 316/2026 relaxed this from mandatory
to permissive). Self-employment income may be relied on where art. 84 is satisfied.

RD 316/2026 also rewrote what the report must contain: time at the habitual address,
economic means, and integration efforts through socio-labour and cultural insertion
programmes. The 2025 wording had instead required certification of *"el conocimiento y
respeto de los valores constitucionales de España […] y, en su caso, el aprendizaje de las
lenguas oficiales"*. **If you are encoding the integration report, encode the 2026
wording** and note the change.

**d) Arraigo socioformativo.** Enrolled in, or taking, one of the trainings referred to in
arts. 52.1.b) and 52.1.e)5.º (including level one), or the in-person offer of compulsory
adult education. Where enrolment has an official window, the application must be filed in
the **two months before** that window opens; proof of enrolment must reach the oficina de
extranjería within **three months** of notification of the grant, and failure to do so
**extinguishes** the authorisation. Alternatively, a commitment to training promoted by the
public employment services aimed at occupations in the art. 75.1 catalogue. A social
integration report under (c) is **also** required.

**e) Arraigo familiar.** Two cases, both requiring the family member be **a national of
another EU member state, the EEA or Switzerland**:

1. Parent or guardian of a minor who is such a national, where the applicant resides in
   Spain, has the minor in their care and lives with them or is current with parental
   obligations.
2. A person providing support to a person with a disability who is such a national, for the
   exercise of legal capacity, where the applicant is a relative, has that person in their
   care and lives with them.

> **This is a substantive narrowing and it is easy to get wrong.** Under RD 557/2011
> art. 124.3, *arraigo familiar* was built around family members of **Spanish** nationals
> (parent of a Spanish minor; spouse/partner, ascendants and descendants of a Spanish
> national; children of a formerly-Spanish parent). Under RD 1155/2024 the Spanish-national
> cases have moved out of arraigo entirely — they are now *"Residencia temporal de
> familiares de personas con nacionalidad española"*, Título IV Capítulo VII, arts. 93–99.
> Encoding a route to "parent of a Spanish child" as *arraigo familiar* would be wrong.

### 2.4 The two time-limited figures added in 2026

RD 316/2026 inserted two additional arraigo authorisations as *disposiciones adicionales* of
the Reglamento. Both are **closed**.

| | DA vigésima (20ª) | DA vigesimoprimera (21ª) |
|---|---|---|
| Name | *arraigo* for international-protection applicants | *arraigo extraordinario* |
| Population | Applied for international protection in Spain **before 1 January 2026** | Present in Spain **before 1 January 2026** |
| Presence required | **5 months** uninterrupted before filing | **5 months** uninterrupted before filing |
| Additional test | — | At least one of: work done or intended (contracts totalling >90 days in a year); living with minor/dependent children or first-degree ascendants; certified **vulnerability** |
| Filing window closes | **30 June 2026** | **30 June 2026** |
| Grant | 1 year, treated as *arraigo social*, full work rights | 1 year, full work rights |
| Notable condition | On a favourable decision the applicant **must withdraw** the protection claim or pending appeal | — |

Both texts carry the same closing words: *"podrá ser solicitada hasta el 30 de junio de
2026"* (DA 20.6 and DA 21.6). The Dirección General de Gestión Migratoria's *Criterios
interpretativos* on RD 316/2026 (signed 22 April 2026) repeat the 30 June 2026 date for the
associated minors' applications.

**As at 2026-07-25 the window has passed and no BOE instrument extends it** ([§1.4](#14-nothing-else-has-amended-it)).
Encode both as `status: 'closed'`, `closedOn: '2026-06-30'`, with a `closureNote` — people
who filed in the window are waiting on decisions right now, and a 404 is not an answer for
them. Note the encoding subtlety: `statusOn()` treats `closedOn` as the first day the route
was **not** available, so the last day on which an application could be lodged is
2026-06-30 and `closedOn` should be **2026-07-01**. Check `statusOn`'s semantics against the
tests before choosing.

DA 20ª also sits close to the asylum exclusion — see [§8](#8-scope-boundary-asylum).

### 2.5 The 90-day absence rule is guidance, not regulation

Art. 126.b) requires presence *"de forma continuada"* over two years and **fixes no number**.
The number applicants are actually measured against comes from the ministry:

> **Instrucciones SEM 1/2025**, Instrucción PRIMERA.2, verbatim:
> *"A efectos del cómputo de permanencia continuada, las ausencias de España no podrán
> superar los 90 días naturales en un período de dos años."*

Issued by the Secretaría de Estado de Migraciones, signed by Pilar Cancela Rodríguez,
**13 May 2025** — a week before the Reglamento took effect. Title: *"Instrucciones SEM
1/2025 sobre las autorizaciones de residencia temporal por circunstancias excepcionales por
razón de arraigo previstas en el Reglamento de Extranjería, aprobado por el Real Decreto
1155/2024, de 19 de noviembre"*.

**Encode with `kind: 'official_guidance'` and `discretionary: true`.** It is a ministerial
instruction, revisable without legislative process, and the two-year presence limb it
qualifies is regulatory text that contains no figure at all.

### 2.6 Other things the SEM instructions fix that the Reglamento does not

Same source, same `discretionary: true` treatment:

- **Arraigo social means, family-ties route**: the instruction reads art. 127.c) as
  requiring **200% IPREM in total** — *"100% por el familiar con residencia legal […] y 100%
  para el solicitante del arraigo, en total un 200% del IPREM, con independencia de los
  miembros que conformen la unidad de convivencia"*. The Reglamento says only *"al menos, el
  100 % del IPREM"*. The doubling is the ministry's reading, not the regulation's text.
- **Arraigo sociolaboral contract length**: fixed-term contracts, or their sum, must exceed
  **90 days**. Not in art. 127.b).

### 2.7 Work authorisation and prórroga

- **Art. 131**: the residence carries a work authorisation for employment or
  self-employment, unrestricted by geography or occupation, with two exceptions — applicants
  under the minimum working age, and *arraigo socioformativo*, which permits employment of
  **at most 30 hours a week** in aggregate.
- **Art. 130.5** (2026 wording): once an *arraigo sociolaboral* application is admitted, the
  applicant is **provisionally authorised to reside and work as an employee** until the
  procedure is resolved. The 2025 wording had instead conditioned the authorisation's
  effectiveness on Social Security registration within one month.
- **Art. 132.1**: prórrogas run **one year**, except *arraigo familiar* at five.
- **Art. 132.2.a)** (2026 wording): prórroga of second-chance, sociolaboral or social arraigo
  requires proof of **active job-seeking and registration with the public employment
  service** — *"No obstante, se podrá prorrogar sin necesidad de acreditar los anteriores
  requisitos si concurren circunstancias que impidan el acceso al empleo por razones
  debidamente justificadas, tales como, enfermedad o discapacidad o haber alcanzado la edad
  legal de jubilación."* The 2025 wording had also required continued satisfaction of the
  original requirements; RD 316/2026 dropped that.
- **Art. 132.3**: filing window is the **two months before** expiry; filing then extends the
  prior authorisation until resolution. Filing within **three months after** expiry also
  extends it, without prejudice to a penalty procedure.

---

## 3. What this does to the existing catalog

### 3.1 `es-non-lucrative-visa` — needs re-citing, and has two substantive defects

The route survives. Its regulation does not: RD 1155/2024 **Título IV Capítulo I, arts.
60–64** replaces RD 557/2011 arts. 46–51. The citation `es-rd-557-2011-no-lucrativa` is now
a citation to repealed text.

| Encoded today | Position under RD 1155/2024 |
|---|---|
| `initialGrantMonths: 12` | **Correct.** Art. 61.4: *"La autorización inicial […] tendrá la duración de un año."* |
| `renewalMonths: 24` | **Correct.** Art. 64.7: renewed authorisation valid **two years**, unless long-term residence is due instead |
| Means = "400% of the **annual** IPREM" | **Imprecise.** Art. 62.1.a) sets *"una cantidad que represente **mensualmente** en euros el 400 % del IPREM"*, and art. 62.2 requires the global amount to be that monthly figure scaled by the authorisation's validity period. The multiple is unchanged from RD 557/2011 art. 47 — only the article number moved — but the unit is **monthly**, and the label as written is only accidentally right for a 12-month grant. Family members: **100% monthly IPREM each**, additional (art. 62.1.b)) |
| Health cover: private **and** insurer authorised in Spain | **Over-stated.** Art. 61.2.b) says only *"Contar con un seguro de enfermedad."* RD 557/2011 art. 46.e) had said *"un seguro público o un seguro privado de enfermedad concertado con una Entidad aseguradora autorizada para operar en España"* — the "authorised in Spain" limb and the public/private distinction are **not carried into the new text**. I found no official source restoring it. Recommend re-citing to art. 61.2.b), dropping the `insurerAuthorizedIn` limb or demoting it to `material` + `discretionary: true` with a note that it reflects prior regulation and possible consular practice |
| Criminal record | Art. 61.2.d) frames it as *not being a threat to public order/security/public health*, established by checking for the absence of a criminal record **in Spain** and by a police report. The five-countries-in-five-years documentary requirement is not in art. 61 |

**New in art. 64.2 that nothing in the catalog models** — renewal now requires:

- f) *"Haber residido de forma real y efectiva en España durante más de ciento ochenta y
  tres días durante el año natural."* — a **bright-line regulatory presence rule**, 183 days
  per calendar year. Not discretionary.
- d) Compulsory-school-age dependants must be enrolled in school.
- 64.6: *esfuerzo de integración* is **valued** on renewal, via a favourable CA report,
  *"principalmente en caso de que no acredite el cumplimiento de alguno de los requisitos"*.
  That one is discretionary by construction.

### 3.2 `es-digital-nomad-visa` — untouched by the Reglamento, but two precision defects

International teleworking lives in **Ley 14/2013, Capítulo V bis, arts. 74 bis–74 quinquies**,
inserted by Ley 28/2022 disposición final 5.9. A Real Decreto cannot amend a Ley, and
RD 1155/2024 did not try. Those articles read today exactly as they did on 23 December 2022.

Two things in the catalog do not match the statute:

1. **The 20% cap is not universal.** Art. 74 bis.1 verbatim: *"En el caso de ejercicio de
   una actividad laboral, el titular […] solo podrá trabajar para empresas radicadas fuera
   del territorio nacional. En el supuesto de ejercicio de una actividad profesional, se
   permitirá al titular […] trabajar para una empresa ubicada en España, siempre y cuando el
   porcentaje de dicho trabajo no sea superior al 20 % del total de su actividad
   profesional."* So: **employees, 0%; self-employed professionals, up to 20%.** The
   criterion `es-dnv-spanish-activity-cap` applies 20% to everyone, which is wrong in the
   employed case and permissive in the direction that harms the applicant.
2. **The catalog cites a section of Ley 14/2013 without a pin-cite or URL.** Arts. 74 bis and
   74 ter are the provisions; <https://www.boe.es/buscar/act.php?id=BOE-A-2013-10074> is the
   consolidated text.

Confirmed correct as encoded: employer/group real and continuous activity for **at least one
year** (art. 74 ter.a)); employment or professional relationship subsisting for **at least
the last three months** (art. 74 ter.c) and d)); degree/postgraduate from a recognised
institution, vocational training or business school, **or three years' professional
experience** (art. 74 bis.2).

### 3.3 `es-highly-qualified-professional` — untouched, but under-specified

Ley 14/2013 art. 71, as rewritten by Ley 11/2023 art. 32.5 (in force 10 May 2023). Two
modalities, and the catalog collapses them:

- **71.2.a) — EU Blue Card holders**: higher education of **at least three years** at
  EQF level 6 / MECES level 2, *or* **five years** of comparable professional experience
  (**three** years within the preceding seven for ICT professionals and managers).
- **71.2.b) — national HQP authorisation**: qualification at MECES level 1 / EQF 5A, *or*
  **three years** of comparable experience, on terms set by the instructions under DA 20ª of
  that Ley.

**Durations are statutory and can be encoded**, which the catalog currently declines to do:
art. 71.3 — validity **three years**, or the contract's duration plus three months where the
contract runs under three years, capped at three years; renewal **two years**, applied for in
the **60 days** before expiry; long-term residence available at five years.

The `es-uge-criterios` citation and its `discretionary: true` treatment remain right: the
salary levels are UGE-CE criteria, not statute, and art. 71.2.b) expressly defers to
ministerial instructions.

### 3.4 `es-golden-visa` — confirmed correct; add the URL

Everything the catalog asserts checks out, and the repeal mechanics are worth recording
precisely because a future reader will want them:

- **Ley Orgánica 1/2025, de 2 de enero**, `BOE-A-2025-76`, BOE núm. 3 of **3 January 2025**.
  Consolidated at <https://www.boe.es/buscar/act.php?id=BOE-A-2025-76>. Includes a
  corrección de errores at `BOE-A-2025-461` (BOE núm. 10, 11 January 2025).
- **Disposición final trigésima octava.1**: *"La presente ley entrará en vigor a los tres
  meses de su publicación en el Boletín oficial del Estado."* BOE's header states
  *"Entrada en vigor: 03/04/2025"*. ⇒ **3 April 2025**, exactly as encoded.
- **Disposición final 21.1** left Ley 14/2013 art. 63 *"(Sin contenido)"* with effect from
  3 April 2025. Arts. 64–67 were treated the same way.
- The investment thresholds the catalog encodes match art. 63.2 in its final (Ley 25/2015)
  wording: €2,000,000 public debt; €1,000,000 shares in Spanish capital companies with real
  business activity, investment/closed-end/venture funds constituted in Spain, or bank
  deposits in Spanish institutions; €500,000 real estate per applicant; or a business project
  of general interest with no fixed amount. **One caveat**: art. 63.2.b) as it stood says
  only *"La adquisición de bienes inmuebles en España con una inversión de valor igual o
  superior a 500.000 euros por cada solicitante."* The catalog's citation note adds *"free of
  any encumbrance"*; that phrase is in art. 66's proof requirements, not art. 63.2.b), and I
  did not read art. 66 in this sweep. Move it or verify it.

**Transitional provisions, added to Ley 14/2013 by LO 1/2025 DF 21.2 and 21.3, verbatim:**

> *Disposición transitoria primera.* *"Aquellos inversores o familiares de inversores que,
> con anterioridad a la fecha de entrada en vigor de esta disposición transitoria, hubieran
> presentado la correspondiente solicitud, podrán recibir el visado o autorización
> correspondiente conforme a la normativa vigente en la fecha de presentación de la
> solicitud."*
>
> *Disposición transitoria segunda.* *"Los visados y autorizaciones para inversores que
> tengan validez a la fecha de la entrada en vigor de esta disposición transitoria,
> conservarán dicha validez durante el tiempo para el que hubieran sido expedidos. En el
> caso de presentarse solicitudes de renovación, se tramitarán y resolverán conforme a la
> normativa vigente en la fecha de concesión de la autorización inicial."*

The catalog's `closureNote` is consistent with both. The renewal rule is worth surfacing
verbatim: renewals are decided under the law **in force when the initial authorisation was
granted**, not the law in force when the renewal is filed.

### 3.5 The two naturalisation pathways — unaffected by the Reglamento

RD 1155/2024 governs *extranjería*. Nationality is Código Civil plus RD 1004/2015, and
neither has moved:

- **Código Civil art. 22** — last amended by Ley 8/2021, in force **3 September 2021**.
  Art. 22.1 verbatim: *"Para la concesión de la nacionalidad por residencia se requiere que
  ésta haya durado diez años. Serán suficientes cinco años para los que hayan obtenido la
  condición de refugiado y dos años cuando se trate de nacionales de origen de países
  iberoamericanos, Andorra, Filipinas, Guinea Ecuatorial o Portugal o de sefardíes."*
  Art. 22.3, 22.4 as encoded. <https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763>
- **RD 1004/2015** — art. 6 last amended by RD 1049/2020, in force 3 December 2020. Still in
  force. <https://www.boe.es/buscar/act.php?id=BOE-A-2015-12047>

Three observations, offered as observations rather than defects:

1. **The DELE A2 exemption is a closed list of nationalities, not a language test.**
   Art. 6.5 exempts holders of a prior DELE at A2 or above, *"así como los nacionales de:"*
   Argentina, Bolivia, Chile, Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Guatemala,
   Guinea Ecuatorial, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, **Puerto Rico**,
   República Dominicana, Uruguay, Venezuela — **20 entries**. The catalog's
   `SPANISH_OFFICIAL_LANGUAGE_COUNTRIES` has 19 and omits Puerto Rico. Whether to add `PR`
   is a judgement call, since a Puerto Rican applicant's `claimedNationality` will normally
   be `US`; but the doc comment's framing ("countries or territories where Spanish is an
   official language") is a paraphrase of a closed enumeration, and the enumeration is what
   the registry applies. The catalog's substantive point — that the exemption list is
   narrower than the two-year residence list — is correct and well made.
2. **The prior-DELE limb is not modelled.** Art. 6.5 exempts anyone already holding a DELE at
   A2+, which the catalog's `ordinal_at_least` check happens to cover for CEFR-framework
   certifications but not for a DELE recorded another way.
3. **Two residence periods in art. 22 are not encoded**: five years for those who have
   obtained refugee status (art. 22.1) and one year for the six cases in art. 22.2 (born in
   Spain; failure to exercise the option in time; two years under Spanish guardianship or
   care; one year married to a Spanish national and not separated; widow/widower of a Spanish
   national; born abroad to a Spanish-origin parent or grandparent). These are gaps, not
   errors. The refugee limb touches [§8](#8-scope-boundary-asylum).

### 3.6 Long-term residence — not in the catalog, and now well-specified

Título X. Three chapters: **larga duración-UE** (arts. 175–178), **mobility of an EU
long-term resident** (arts. 179–181), **larga duración nacional** (arts. 182–185).

Both the EU and national variants require **five years of legal, continuous residence** and
carry the **same, explicit, numeric absence rules**:

> Art. 176.a) / art. 183.2 verbatim: *"La continuidad no quedará afectada por ausencias del
> territorio español de hasta seis meses continuados, siempre que la suma de éstas no supere
> el total de diez meses dentro del periodo de permanencia de cinco años exigible, salvo que
> las correspondientes salidas se hubieran efectuado de manera irregular. En caso de
> ausencias por motivos laborales, la continuidad de la residencia no quedará afectada por
> ausencias del territorio español de hasta seis meses continuados, siempre que la suma de
> éstas no supere el total de dieciocho meses dentro de los cinco años requeridos."*

Also: study/mobility/volunteering/training stays count at **50%** of their duration
(art. 176.a)); art. 183.2 additionally excuses absences for *fuerza mayor* on an
individualised assessment, and absences by NGO cooperantes. Art. 183.3 lists seven
alternative routes to national long-term residence that require no five-year period at all
(contributory retirement pension; absolute permanent incapacity or *gran invalidez* pension;
born in Spain with three years' legal continuous residence at majority; former Spanish
nationals by origin; five years under the guardianship of a Spanish public entity;
stateless persons, refugees and beneficiaries of subsidiary protection; and notable
contribution to Spain's economic, scientific or cultural progress).

This is a well-specified pathway with bright-line thresholds and would encode cleanly.

---

## 4. `packages/presence/src/continuity.ts`

### 4.1 Is `SPAIN_NATIONALITY_CONTINUITY` still right?

**It is not superseded.** The policy is about continuity of residence for **nationality by
residence** under Código Civil art. 22.3. RD 1155/2024 is an *extranjería* regulation and
does not govern nationality. The Código Civil article it cites is unchanged since 2021, and
the module's own commentary — that art. 22.3 requires *"legal, continuada e inmediatamente
anterior a la petición"* residence and **fixes no figure** — is exactly right. The
`discretionary: true` flag and the refusal to encode cumulative limbs are both good calls.

**But the 180-day figure could not be traced to an official source in this sweep.** I
searched for it against the Reglamento, the Ministerio de Inclusión guidance, and the SEM
instructions; the only official absence figures I found for Spain are the four in §4.2, and
none of them is 180 days in a nationality context. The figure may well be sound — it is a
practitioner commonplace, and the module already says it is a screening criterion rather
than law — but "widely repeated" is not a source. See [§7](#7-what-i-could-not-establish)
for what would settle it. Meanwhile the note is honest about the figure's status, which is
the safe posture; my recommendation is to add one clause recording that the figure has not
been traced to a published official instrument.

### 4.2 Four Spanish absence rules that *are* verifiable, and their character

The presence engine could carry these as named policies, and three of the four are
**bright-line regulatory text** rather than practice.

| Rule | Source | Character | `discretionary` |
|---|---|---|---|
| Absences ≤ **6 months** consecutive, ≤ **10 months** total across the 5-year period (≤ **18 months** where the absences are for work) | Reglamento arts. 176.a) and 183.2 | Regulation | **false** |
| More than **183 days** of real and effective residence in Spain per calendar year, for non-lucrative renewal | Reglamento art. 64.2.f) | Regulation | **false** |
| Absences ≤ **90 calendar days** over the 2-year arraigo qualifying period | Instrucciones SEM 1/2025, Instrucción PRIMERA.2 | Ministerial instruction | **true** |
| Single absence ≤ **180 days**, nationality by residence | *not established* — see §7 | unknown | **true**, and say the source is untraced |

Note that these are **different shapes**, and the `ContinuityPolicy` type handles three of
them cleanly: the long-term residence rule uses `maxSingleAbsenceDays` **and**
`maxCumulativeAbsenceDaysTotal` together; the arraigo rule is `maxCumulativeAbsenceDaysTotal`
over a two-year window. The 183-day NLV rule is the odd one — it is a **presence floor per
calendar year**, not an absence ceiling per residence year, and `residenceYears()` slices
from the start of the window rather than from January. Do not force it into
`maxCumulativeAbsenceDaysPerYear`: 365 − 183 = 182 is *not* the same rule, because the
statutory year is the calendar year and a residence year is not. It needs either its own
limb or its own function, and the module's own doctrine — a policy limb left `undefined` is
"not tested", never "unlimited" — says inventing an equivalence here would fabricate law.

The 18-month work-absence variant also has no home in the current type: it is a *conditional*
total that depends on the reason for the absence, and the ledger does not record reasons.
Encoding only the 10-month limb is the safe under-claim; say so in the note.

---

## 5. Statutory vs. discretionary — the encoder's decision table

The rule of thumb this brief applies: **if the number is in the Reglamento or the Ley, it is
not discretionary; if the number exists only because the ministry published a reading, it
is.** Where the instrument itself uses evaluative language (*"se valorará"*, *"esfuerzo de
integración"*, *"informe favorable"*), the criterion is discretionary even though its source
is regulatory — the regulation is delegating a judgement, not fixing a threshold.

| Requirement | Source | `kind` | `discretionary` |
|---|---|---|---|
| 2 years' continuous presence for arraigo | Reglamento art. 126.b) | `regulation` | false |
| No pending stay/residence procedure (arraigo) | Reglamento art. 126.h), added 2026 | `regulation` | false |
| Arraigo authorisation duration 1 yr / familiar 5 yrs | Reglamento art. 125.2 | `regulation` | false |
| ≥20 hrs/week contract, ≥SMI (arraigo sociolaboral) | Reglamento art. 127.b) | `regulation` | false |
| 100% IPREM means (arraigo social) | Reglamento art. 127.c) | `regulation` | false |
| **200% IPREM total on the family-ties route** | SEM 1/2025, Instrucción CUARTA | `official_guidance` | **true** |
| **90 days' permitted absence over 2 years** | SEM 1/2025, Instrucción PRIMERA.2 | `official_guidance` | **true** |
| **Fixed-term contract must exceed 90 days** | SEM 1/2025, Instrucción TERCERA | `official_guidance` | **true** |
| ***Esfuerzo de integración* report (arraigo social/socioformativo)** | Reglamento art. 127.c) | `regulation` | **true** — the regulation says *"se valorará"* and requires a *favourable* report; that is a judgement, not a threshold |
| 30 hrs/week work cap on arraigo socioformativo | Reglamento art. 131.b) | `regulation` | false |
| Active job-seeking for prórroga | Reglamento art. 132.2.a) | `regulation` | false |
| **The justified-circumstances escape from that** | Reglamento art. 132.2.a) | `regulation` | **true** — *"razones debidamente justificadas"* is assessed |
| 400%/100% monthly IPREM (non-lucrative) | Reglamento art. 62.1 | `regulation` | false |
| 183 days' effective residence (NLV renewal) | Reglamento art. 64.2.f) | `regulation` | false |
| ***Esfuerzo de integración* on NLV renewal** | Reglamento art. 64.6 | `regulation` | **true** — *"se valorará"* |
| 5 yrs + 6/10/18-month absence limits (long-term residence) | Reglamento arts. 176.a), 183.2 | `regulation` | false |
| *Fuerza mayor* excusing absences | Reglamento art. 183.2 | `regulation` | **true** — *"valorar de forma individualizada"* |
| Teleworking: 1 yr employer activity, 3 months' relationship, 20% cap, degree-or-3-yrs | Ley 14/2013 arts. 74 bis, 74 ter | `statute` | false |
| HQP qualification tiers and 3-yr/2-yr validity | Ley 14/2013 art. 71 | `statute` | false |
| **UGE-CE salary and income levels** | UGE-CE published criteria | `official_guidance` | **true** — and art. 71.2.b) expressly defers to instructions |
| Nationality: 10/2 years, legal+continuous+immediately prior | Código Civil arts. 22.1, 22.3 | `statute` | false |
| **Nationality: good civic conduct, sufficient integration** | Código Civil art. 22.4 | `statute` | **true** |
| CCSE and DELE A2, and the 20-nationality exemption list | RD 1004/2015 art. 6 | `regulation` | false |
| **Nationality continuity absence figure** | untraced | — | **true**, with the source gap stated |

---

## 6. Transitional provisions

### 6.1 RD 1155/2024's own — five, one now repealed

**DT primera — validity of existing authorisations** (verbatim): *"Las distintas
autorizaciones o tarjetas que habilitan para entrar, residir y trabajar en España […] y que
tengan validez a la fecha de su entrada en vigor, conservarán dicha validez durante el
tiempo para el que hubieren sido expedidas."*

**DT segunda — applications lodged before 20 May 2025** (verbatim, and this is the one that
matters most for a catalog that models historical states):

> *"Las solicitudes presentadas con anterioridad a la entrada en vigor de este real decreto
> se tramitarán y resolverán conforme a la normativa vigente en la fecha de su presentación,
> salvo que el interesado solicite la aplicación de lo dispuesto en el Reglamento […] y
> siempre que se acredite el cumplimiento de los requisitos exigidos para cada tipo de
> solicitud."*

So it is **old law by default, new law at the applicant's election** — a two-way rule, not
the one-way "law at filing" rule the golden-visa repeal used. A catalog that models this
needs to know that both regimes can govern a pre-20-May-2025 application depending on what
the applicant asked for. `statusOn()` already lets the catalog answer "what was the position
on date X"; this provision is why that matters for Spain beyond the investor route.

**DT tercera** — holders of *arraigo familiar* authorisations or EU-family-member residence
cards based on a tie to a Spanish national, valid at entry into force, keep their residence
while they satisfy Título IV Capítulo VII, without needing to file the new application. This
is the bridge for the §2.3(e) narrowing.

**DT cuarta** — a **six-month window from entry into force** (i.e. to 20 November 2025) for
persons in art. 94.1.d) and e) who held the family tie and were in Spain at the date of
publication to apply under Título IV Capítulo VII. **Expired.**

**DT quinta** — a twelve-month window for persons left irregular by a final refusal of an
international protection claim to apply for arraigo without the presence requirement, subject
to six months' irregular presence. **Repealed by RD 316/2026's disposición derogatoria
única**, and replaced by the DA 20ª regime.

### 6.2 RD 316/2026's own

- **DT primera** — flexibilised authorisations for accompanying minors of DA 20ª/21ª
  applicants; per the DG Gestión Migratoria criteria, applications under Título IX Capítulo I
  could be filed until **30 June 2026** so both decisions issue simultaneously.
- **DT segunda** — applications already lodged under the now-repealed DT quinta require, for
  a grant, *"únicamente, que las personas solicitantes acrediten la carencia de antecedentes
  penales y que no representen una amenaza al orden público, seguridad pública y salud
  pública"*. It applies to applications in progress and those filed **up to 30 June 2026**.
  This is a **rescue provision**: it does not extinguish pending DT quinta applications, it
  lowers their test.
- **Disposición derogatoria única** — repeals DT quinta.
- Entry into force — the day after publication, **16 April 2026**.

### 6.3 The golden-visa transitional regime

Set out verbatim in [§3.4](#34-es-golden-visa--confirmed-correct-add-the-url). The catalog
already models it; the encoder's job is to add the URL and, if the "free of encumbrance"
phrase is retained, move it to the right article or drop it.

---

## 7. What I could not establish

Listed so nobody encodes it on my say-so.

1. **The official source of the 180-day nationality-continuity figure.** Not found in the
   Reglamento, the Código Civil, RD 1004/2015, or the SEM guidance I read. *What would settle
   it*: an instruction or circular of the Dirección General de Seguridad Jurídica y Fe
   Pública on *residencia continuada* in nationality files, or a Tribunal Supremo judgment on
   art. 22.3 continuity. Until then keep `discretionary: true` and record that the figure's
   published source is untraced.
2. **Whether the DGSJFP has published any current instruction on nationality continuity at
   all.** I did not search the DGSJFP's own publication series.
3. **Whether "insurer authorised to operate in Spain" survives as a non-lucrative
   requirement in practice.** The Reglamento dropped the phrase RD 557/2011 art. 46.e)
   contained. *What would settle it*: the Ministerio de Asuntos Exteriores consular visa
   information sheet for the *visado de residencia no lucrativa*, or the Ministerio de
   Inclusión hoja informativa for that authorisation. I read neither.
4. **The current UGE-CE salary and income criteria**, for either the highly-qualified route
   or teleworking. Not fetched. The catalog is right not to assert a figure.
5. **Ley 14/2013 art. 66**, and therefore whether the "free of any encumbrance" condition on
   the €500,000 real-estate investment sits there. Not read.
6. **An affirmative official statement that the DA 20ª/21ª window closed on 30 June 2026.**
   What I have is strong but indirect: the enacted text of DA 20.6 and DA 21.6 says *"hasta
   el 30 de junio de 2026"*, BOE's relations record for RD 1155/2024 shows no instrument
   after RD 316/2026, and the consolidated text's last published update is 15 April 2026. I
   did **not** find a ministry notice announcing closure. *What would settle it*: the
   Ministerio de Inclusión hoja informativa 28 Ter restating a closing date — as fetched on
   2026-07-25 it gives opening dates (telematic 16 April, in person 20 April) and does not
   restate the closing date.
7. **Whether art. 126.b)'s *"de forma continuada"* has been construed by the courts beyond
   the SEM instruction.** No case-law search was run.
8. **Arts. 128–129** (humanitarian grounds, collaboration with the authorities, national
   security) and **Capítulos II–V of Título VII** (gender violence, sexual violence,
   trafficking). Read only at heading level. Several are protection-adjacent — see §8.

---

## 8. Scope boundary: asylum

Asylum, refugee protection and humanitarian/compassionate claims are out of scope for this
catalog by explicit decision, and nothing in this brief changes that. Three points where the
Spanish material brushes against the line:

1. **DA 20ª is not an asylum route, but it is entangled with one.** It is a residence
   authorisation for people who *applied* for international protection before 1 January 2026,
   and a favourable decision **obliges the applicant to withdraw** the protection claim or
   pending appeal (DA 20.4). That trade — give up a protection claim for a one-year residence
   authorisation — is a decision no self-serve eligibility checker should be nudging anyone
   through, and it is now moot for new applicants in any case. If it is encoded at all, it
   should be encoded as the closed historical route it is, with the withdrawal condition
   stated plainly and a pointer to qualified legal help.
2. **Código Civil art. 22.1 gives refugees a five-year naturalisation period.** That is a
   residence-period rule keyed to a status the applicant already holds, not a test of who
   qualifies for protection. It is encodable in principle. But it requires the catalog to
   hold "this person has refugee status", and that is a fact worth thinking carefully about
   collecting.
3. **Título VII Capítulos II–V** (victims of gender violence, sexual violence, trafficking)
   and **art. 128** (humanitarian grounds) are squarely in the excluded territory:
   credibility-assessed, concerning people at risk. Do not encode them.

Whatever is decided, the catalog should **name** asylum as out of scope somewhere a user can
see it, with a pointer to qualified legal help, rather than leaving its absence to look like
an oversight.

---

## 9. Source register

Every URL below was fetched during this sweep on 2026-07-25 and returned the document named.

### Primary — BOE consolidated texts

| Instrument | BOE id | URL |
|---|---|---|
| RD 1155/2024 (the Reglamento) | `BOE-A-2024-24099` | <https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099> |
| RD 316/2026 (the amendment) | `BOE-A-2026-8284` | <https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8284> · <https://www.boe.es/eli/es/rd/2026/04/14/316> |
| RD 557/2011 (repealed) | `BOE-A-2011-7703` | <https://www.boe.es/buscar/act.php?id=BOE-A-2011-7703> |
| Ley 14/2013 (mobility regime) | `BOE-A-2013-10074` | <https://www.boe.es/buscar/act.php?id=BOE-A-2013-10074> |
| LO 1/2025 (golden-visa repeal) | `BOE-A-2025-76` | <https://www.boe.es/buscar/act.php?id=BOE-A-2025-76> |
| Código Civil | `BOE-A-1889-4763` | <https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763> |
| RD 1004/2015 (nationality procedure) | `BOE-A-2015-12047` | <https://www.boe.es/buscar/act.php?id=BOE-A-2015-12047> |

Article-level text was read through BOE's open-data consolidation API, which serves each
block with its `fecha_vigencia` and every superseded version alongside the current one —
that is how the 2025-vs-2026 wording comparisons in §2 were made. Pattern:
`https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/<BOE-id>/texto/bloque/<block-id>`
(requires an `Accept: application/xml` header). The `/texto/indice`, `/metadatos` and
`/analisis` endpoints of the same API supplied the block index, the entry-into-force stamp
and the amendment history relied on in §1.4.

### Official guidance — Ministerio de Inclusión, Seguridad Social y Migraciones

| Document | URL |
|---|---|
| Instrucciones SEM 1/2025 on arraigo (signed 13 May 2025) | <https://www.inclusion.gob.es/documents/d/migraciones/instrucciones-sem-1_2025-sobre-las-autorizaciones-de-residencia-temporal-por-circunstancias-excepcionales-por-razon-de-arraigo-aprobado-por-el-real-decreto-1155_2024> |
| Criterios interpretativos de la DG de Gestión Migratoria on RD 316/2026 (signed 22 April 2026) | <https://www.inclusion.gob.es/documents/20121/7817425/Criterios%20interpretativo%20RD%20316_2026.pdf/978f6bce-6e14-eb57-b93f-0acdae0f7c74> |
| Hoja informativa 28 — arraigo social | <https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social> |
| Hoja informativa 28 Ter — arraigo extraordinario | <https://www.inclusion.gob.es/en/web/migraciones/w/28-ter.-autorizacion-de-residencia-por-circunstancias-excepcionales-por-razon-de-arraigo-extraordinario> |

Note for anyone re-verifying: `inclusion.gob.es` sits behind a web application firewall that
rejects plain command-line fetches. The pages are reachable through a normal fetch tool.

### Not used as authority

Practitioner commentary surfaced in searches corroborated the 30 June 2026 closure but is
**not** relied on for any proposition in this brief. Every factual claim above traces to the
BOE text or to a ministry document in the table immediately preceding.
