/**
 * Mexico's corridors, with no lower bound — the country slice `stock.ts` cannot
 * hold.
 *
 * ## Why this file exists
 *
 * `stock.ts` encodes every corridor in the world at or above
 * {@link CORRIDOR_STOCK_MINIMUM} persons. That is a defensible rule and it makes
 * the table blind to almost all of Mexico. Ask it for corridors with Mexico at
 * either end and it returns two rows — Mexico to the United States, and the
 * United States to Mexico — because those are the only two above the floor. The
 * next largest, Honduras to Mexico, is 166,398 and falls out. So do Mexicans in
 * Spain and Canada, and the Central American, Venezuelan, Haitian, Cuban and
 * Colombian populations resident in Mexico: everything about the country except
 * the two corridors it shares with the United States, absent because a global
 * threshold does not know it is looking at Mexico.
 *
 * This file is the same source read again with the threshold removed. Every cell
 * of the bilateral matrix with Mexico at either end is here: 79 corridors into
 * Mexico and 55 out of it, 134 rows, the smallest of them two persons.
 *
 * ## Source
 *
 * United Nations, Department of Economic and Social Affairs, Population Division.
 * *International Migrant Stock 2024*, POP/DB/MIG/Stock/Rev.2024, table 1
 * (international migrant stock at mid-year by sex and by region, country or area
 * of destination and origin, 1990-2024), both sexes combined, column 2024.
 * Downloaded and read on 2026-07-26 from {@link CORRIDOR_STOCK_SOURCE_URL} —
 * the same workbook `stock.ts` cites, so the two files cannot drift onto
 * different vintages, and both constants are imported rather than restated for
 * the same reason.
 *
 * Every row is one cell of that table: persons born in the origin, resident in
 * the destination, estimated as at mid-2024. Nothing is interpolated, inferred
 * from a secondary report, or estimated by us. Each comment carries the source's
 * own label for the two areas, origin first, and then the figure exactly as the
 * source publishes it, so a reader can check both the naming and our rounding
 * without opening the spreadsheet.
 *
 * The slice is complete against its own source, and that is checkable:
 *
 * - The 79 inbound rows sum to 1,697,453 published persons. The source's
 *   World-to-Mexico cell is {@link MEXICO_FOREIGN_BORN_STOCK} (1,726,089), and
 *   the difference is exactly {@link MEXICO_UNATTRIBUTED_ORIGIN_STOCK} (28,636),
 *   the Mexico row of the "Others" origin bucket. There is no third residual.
 * - The 55 outbound rows sum to 11,596,529 published persons, which is the
 *   source's Mexico-to-World cell {@link MEXICO_BORN_ABROAD_STOCK} to the person.
 *
 * Origin "Others" is deliberately not a row. It is not a country pair, it can
 * never resolve to a jurisdiction, and encoding it would put 28,636 people into
 * the weighted denominator on a corridor no one can ever cover. It is stated as
 * a constant instead. Note the asymmetry it creates: Mexicans counted by a
 * destination that records foreign-born without a country of birth sit inside
 * *that* destination's "Others" row and never reach Mexico's outbound total, so
 * the outbound side is complete against the source and the source is not
 * complete against the world.
 *
 * ## Stock is not transit, and Mexico is the country where that matters most
 *
 * Stock counts who **stayed**. Every figure below is a person resident in the
 * destination at mid-2024, however long ago they arrived. The measure has no
 * opinion about how anyone got there and no way to represent someone who is
 * still moving.
 *
 * Mexico's defining migration fact is the population this measure structurally
 * cannot see: people who cross the country without becoming resident in it.
 * They are not undercounted here; they are *out of scope*. A Honduran who
 * crossed Mexico and settled in the United States is one person in the
 * `HN → US` cell, and nothing in the matrix records that Mexico was on the
 * route. A Honduran still in transit is in no cell of the 2024 column at all
 * unless they happened to be resident somewhere at mid-year. A reader who takes
 * `US → MX 824,000` as "what Mexican migration is about" has been misled by a
 * table that is not lying.
 *
 * There is an authoritative flow series, and it is **deliberately not in this
 * file**. Mexico's Unidad de Política Migratoria, Registro e Identidad de
 * Personas (SEGOB) publishes, in its Boletín Estadístico 2024, cuadro 3.1.1
 * "Eventos de personas en situación migratoria irregular en México, según
 * continente y país de nacionalidad", **1,234,698 events** in calendar 2024 —
 * 986,314 "Presentados" plus 248,384 "Canalizados" — of which 361,203 were
 * Venezuelan, 118,495 Ecuadorian, 90,097 Honduran, 85,211 Colombian, 82,126
 * Guatemalan, 77,720 Salvadoran, 62,349 Nicaraguan, 43,018 Cuban and 41,653
 * Haitian. Read on 2026-07-26 from {@link MEXICO_IRREGULAR_MIGRATION_FLOW_URL}.
 * The sheet marks itself preliminary and records that September to December were
 * still in validation.
 *
 * Three reasons that number is prose and not a row:
 *
 * 1. **Its unit is events, not people.** One person encountered twice is two.
 *    Nothing in {@link CorridorStock} can carry that distinction, so a consumer
 *    would sum it with persons.
 * 2. **Its period is a year, not an instant.** A stock and a flow do not share a
 *    denominator. 111,000 Venezuelan-born residents of Mexico and 361,203
 *    Venezuelan irregular-migration events in one year are both true; the ratio
 *    between them means nothing at all.
 * 3. **Two measures in one column is how a metric starts lying.** Weighted
 *    coverage would silently become a weighted average of "people who live
 *    there" and "times someone was stopped", and no downstream reader would be
 *    able to tell.
 *
 * If Meridian ever needs flow, it needs its own type, its own table and its own
 * coverage arithmetic — not a wider `stock` field.
 *
 * ## What merging this into the main table does to the denominator
 *
 * Read this before concatenating anything.
 *
 * - **Two rows here are already in `stock.ts`.** `MX → US` (11,280,000) and
 *   `US → MX` (824,000) are the only Mexico corridors at or above the main
 *   table's floor, so they appear in both files, with identical values, because
 *   both derive from the same cell. {@link MEXICO_CORRIDOR_STOCK_ROWS_IN_MAIN_TABLE}
 *   is that overlap, computed against the real `CORRIDOR_STOCK` rather than
 *   written down, and {@link MEXICO_CORRIDOR_STOCK_VALUE_DISAGREEMENTS} is empty
 *   only when the two files still agree on what those rows say.
 * - **Concatenate {@link MEXICO_CORRIDOR_STOCK_ADDITIONS}, not
 *   {@link MEXICO_CORRIDOR_STOCK}.** The additions are the 132 rows not already
 *   present, summing to {@link MEXICO_CORRIDOR_STOCK_ADDITIONS_TOTAL}
 *   (1,188,236). A naive `[...CORRIDOR_STOCK, ...MEXICO_CORRIDOR_STOCK]` counts
 *   12,104,000 people twice: measured on 2026-07-26, `knownStock` would read
 *   211,937,236 instead of 199,833,236 and `stockTableCompleteness` would report
 *   69.7% instead of 65.7% — a four-point gain manufactured entirely by counting
 *   two corridors twice. `checkAtlasIntegrity` does catch it, as two
 *   `duplicate_stock_row` findings, which is the only reason that mistake is
 *   loud rather than flattering.
 * - **All 132 additions are below {@link CORRIDOR_STOCK_MINIMUM}**, and today
 *   that set coincides exactly with "not already in the main table", because the
 *   floor *is* the main table's inclusion rule. Prefer the additions export
 *   anyway: it stays correct if `stock.ts` ever extends downward, and a filter
 *   on the floor would not.
 * - **The merged table stops being "every corridor above a floor".** It becomes
 *   "every corridor above a floor, plus one complete country slice". Any test or
 *   document asserting that every row of the shipped stock table is at or above
 *   `CORRIDOR_STOCK_MINIMUM` is false after the merge and must be restated
 *   against `CORRIDOR_STOCK` alone. The constants `GLOBAL_MIGRANT_STOCK`,
 *   `UNATTRIBUTED_ORIGIN_STOCK` and `ATTRIBUTABLE_BILATERAL_STOCK` do not move —
 *   this changes what the table holds, never what the world contains.
 * - **The arithmetic, measured on 2026-07-26.** `CORRIDOR_STOCK` alone: 280
 *   rows, `knownStock` 198,645,000, `stockTableCompleteness` 0.6534. Merged
 *   correctly: 412 rows, `knownStock` 199,833,236, `stockTableCompleteness`
 *   0.6573. The tail `stock.ts` describes shrinks by these 132 pairs; it does
 *   not disappear.
 * - **Weighted coverage gets worse, and that is the point.** Mexico is
 *   `researched`, not `encoded`, so no corridor here has both ends encoded and
 *   `coveredStock` does not move: 1,207,000 before and after. `coveredFraction`
 *   therefore falls from 0.006076 to 0.006040. Every row added is a row of work
 *   admitted, and a change that lowers the headline number is not one that was
 *   made to flatter it.
 * - **The work queue barely notices, which is itself worth knowing.**
 *   `largestUncovered` at its default limit of 25 is unchanged: the 25th largest
 *   uncovered corridor carries 1,597,000 people, and the largest new Mexican row
 *   is 166,000, ranking 279th of 410. If Mexico were promoted to `encoded`
 *   against the merged table, `coveredStock` would go from 1,207,000 to
 *   13,529,000 and `coveredFraction` from 0.60% to 6.77% — but 12,104,000 of
 *   that 12,322,000 comes from the two rows that were in the table already, and
 *   only 218,000 from everything this file adds, because Mexico's other encoded
 *   partners are just Canada and Spain. The reason to encode Mexico is that
 *   someone asking about Mexico gets an answer. The weighted metric is the right
 *   headline and it is not the whole argument.
 *
 * ## Cross-checks against national sources
 *
 * Run because a bilateral matrix is a model and national registers are counts.
 * They agree closely enough to trust the slice and differ enough that the
 * differences must be stated rather than averaged away. None of these figures
 * are encoded below — they are a different measure from a different authority,
 * which is the same reason the flow series is not encoded either.
 *
 * - **Spain.** INE, Estadística Continua de Población, table 56937, país de
 *   nacimiento México, both sexes, all ages: **81,464** resident in Spain at
 *   2024-07-01, and 87,575 at 2025-01-01. The `MX → ES` row below encodes the
 *   source's 77,724 for that same 2024-07-01 reference date, so the Spanish
 *   register is 4.8% higher on identical terms. Retrieved on 2026-07-26 from
 *   `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/56937`.
 * - **Canada.** Statistics Canada, 2021 Census of Population, table
 *   98-10-0349-01, place of birth Mexico, total immigrant population, Canada:
 *   **90,585**. The nearest comparable figure in the source is its mid-2020
 *   estimate, 91,284 — within 0.8%, though the census counts landed immigrants
 *   and excludes non-permanent residents while the source counts the
 *   foreign-born, so this is corroboration and not equality. The `MX → CA` row
 *   below is the mid-2024 estimate, 103,620, four years later than the census.
 *   Retrieved on 2026-07-26 via the Statistics Canada Web Data Service.
 * - **Mexico.** CONAPO, reporting the Censo de Población y Vivienda 2020,
 *   published 2021-03-04: **1,212,252** persons born abroad resident in Mexico.
 *   The source's mid-2020 estimate is 1,335,154, 10.1% higher. Two known
 *   differences account for some unknown share of that gap: the reference dates
 *   are not the same, and the source's Mexico-as-destination series carries type
 *   of data "B R", meaning UNHCR-reported refugees, persons in refugee-like
 *   situations, asylum seekers and Venezuelans displaced abroad were added on top
 *   of the foreign-born data. We have not established the decomposition and do
 *   not claim one.
 *   `https://www.gob.mx/conapo/articulos/la-poblacion-nacida-en-el-extranjero-en-el-censo-de-poblacion-y-vivienda-2020`
 * - **Not obtained.** INEGI's own country-of-birth breakdown could not be
 *   retrieved: the interactive tabulados render client-side and returned no data
 *   to a fetch on 2026-07-26. So the Mexican national total is corroborated and
 *   the individual inbound corridors are not.
 *
 * ## Rounding, and the one place the parent rule breaks
 *
 * `stock.ts` rounds to the nearest thousand so that nobody mistakes an estimate
 * for a measurement. That rule was written for a table with a 200,000 floor.
 * Applied here it would report the 64 rows below 1,000 as zero or as a thousand,
 * deleting or inflating the very corridors this file exists to show — a much
 * larger error than the false precision the rounding prevents.
 *
 * So: **at or above 1,000, the nearest thousand; below 1,000, the source's own
 * figure.** One branch, monotone across it, and visible in the data: no
 * published figure at or above 1,000 in this slice is an exact multiple of a
 * thousand, so a row whose encoded value equals its parenthetical is a row below
 * the branch.
 *
 * Those 64 rows are 24,236 people between them, 0.18% of this file. Read them as
 * model output, not as counts of identifiable persons: they exist so the slice
 * is complete and checkable, not because four people are a market. The source's
 * notes also describe a suppression marker for cells below five, which these
 * cells do not carry, so we cannot tell whether the smallest of them were
 * measured or imputed.
 *
 * ## Three more things a reader will otherwise get wrong
 *
 * - **Some rows are not immigration corridors.** `MX → PR` (2,000) and
 *   `MX → GU` (10) are governed by United States immigration law, not by a
 *   system Puerto Rico or Guam runs; the atlas records both as `delegated`. They
 *   are here because they are in the source, and dropping rows on our own
 *   judgement would be a silent editorial filter on a metric meant to be
 *   checkable. `stock.ts` makes the same choice for `PR → US`.
 * - **Direction is place of birth, not intent, and not nationality.** `MX → CU`
 *   (75) and `MX → HT` (310) are people born in Mexico who live in Cuba and
 *   Haiti. Nothing here says they migrated, or in which direction anyone
 *   travelled, or what passport they hold.
 * - **The two sides of this file are not the same construct.** In the source's
 *   own "Type of data" column, Mexico as a destination is "B R" — foreign-born
 *   data with UNHCR-reported refugees, persons in refugee-like situations,
 *   asylum seekers and Venezuelans displaced abroad added. Spain as a destination
 *   is also "B R"; the United States and Canada are plain "B". So the inbound
 *   rows carry a refugee adjustment that the largest outbound rows do not, and
 *   the Venezuelan, Haitian and Cuban inbound figures are the ones most affected
 *   by it. An inbound and an outbound row are not two halves of one measurement.
 *
 * ## Codes
 *
 * ISO 3166-1 alpha-2, joined from the source's M49 codes. Every endpoint below
 * resolves to a jurisdiction in the atlas, checked on 2026-07-26 against
 * `ALL_JURISDICTIONS`; Puerto Rico (PR), Guam (GU), French Guiana (GF), the
 * Cayman Islands (KY), Curaçao (CW) and Taiwan (TW) appear because the source
 * counts them separately, and each is already in the atlas. 95 partner
 * jurisdictions plus Mexico, 96 in all.
 */

import type { CorridorStock } from './types.js';
import { jurisdictionCode } from './types.js';
import { CORRIDOR_STOCK, CORRIDOR_STOCK_AS_OF_YEAR, CORRIDOR_STOCK_SOURCE_URL } from './stock.js';

/**
 * Mexico's irregular-migration flow series — cited here, encoded nowhere.
 *
 * Unidad de Política Migratoria, Registro e Identidad de Personas, SEGOB,
 * Boletín Estadístico 2024, cuadro 3.1.1. Its unit is events in a calendar year,
 * not persons resident at an instant, and it must never be summed with,
 * subtracted from or divided by anything in the `stock` column above.
 */
export const MEXICO_IRREGULAR_MIGRATION_FLOW_URL =
  'https://portales.segob.gob.mx/work/models/PoliticaMigratoria/CEM/Estadisticas/Boletines_Estadisticos/2024/Cuadros2024/cuadro3.1.1_.xls';

/**
 * Total foreign-born population of Mexico, mid-2024: the source's World-to-Mexico
 * cell, 1,726,089, rounded.
 *
 * The denominator for "how much of Mexico's inbound migration does this slice
 * hold". On the source's published figures, before our rounding, the 79 inbound
 * rows plus {@link MEXICO_UNATTRIBUTED_ORIGIN_STOCK} reproduce it to the person:
 * 1,697,453 + 28,636 = 1,726,089.
 */
export const MEXICO_FOREIGN_BORN_STOCK = 1_726_000;

/**
 * Total population born in Mexico and resident abroad, mid-2024: the source's
 * Mexico-to-World cell, 11,596,529, rounded.
 *
 * The 55 outbound rows reproduce it to the person before rounding. 97.3% of it
 * is one corridor.
 */
export const MEXICO_BORN_ABROAD_STOCK = 11_597_000;

/**
 * Foreign-born residents of Mexico the source cannot assign to a country of
 * birth, mid-2024: 28,636, rounded.
 *
 * Mexico's share of the "Others" origin bucket described in `stock.ts`. Not a
 * row, because it is not a country pair and could never resolve to a
 * jurisdiction; stated so the inbound side of this file can be reconciled
 * against {@link MEXICO_FOREIGN_BORN_STOCK} without a residual nobody can name.
 */
export const MEXICO_UNATTRIBUTED_ORIGIN_STOCK = 29_000;

const c = (origin: string, destination: string, stock: number): CorridorStock => ({
  origin: jurisdictionCode(origin),
  destination: jurisdictionCode(destination),
  stock,
  sourceUrl: CORRIDOR_STOCK_SOURCE_URL,
  asOfYear: CORRIDOR_STOCK_AS_OF_YEAR,
});

/**
 * Every corridor with Mexico at either end, with no lower bound: 134 rows.
 *
 * Ordered inbound first, then outbound, each block descending by the source's
 * published figure with ties broken by the other endpoint's code — so two runs
 * over the same source produce the same file, and the block structure matches
 * the destination-major layout of the spreadsheet a reviewer will have open.
 * Rounding is the rule stated above. Comments give the source's own labels,
 * origin first, then the published figure.
 */
export const MEXICO_CORRIDOR_STOCK: readonly CorridorStock[] = [
  // --- Resident in Mexico, by country of birth (79 corridors) ---------------
  c('US', 'MX', 824_000), // United States of America → Mexico (823,502)
  c('HN', 'MX', 166_000), // Honduras → Mexico (166,398)
  c('VE', 'MX', 111_000), // Venezuela (Bolivarian Republic of) → Mexico (111,191)
  c('HT', 'MX', 92_000), // Haiti → Mexico (91,622)
  c('GT', 'MX', 81_000), // Guatemala → Mexico (81,012)
  c('CU', 'MX', 72_000), // Cuba → Mexico (72,440)
  c('SV', 'MX', 55_000), // El Salvador → Mexico (55,410)
  c('CO', 'MX', 51_000), // Colombia → Mexico (51,112)
  c('ES', 'MX', 22_000), // Spain → Mexico (21,623)
  c('AR', 'MX', 21_000), // Argentina → Mexico (21,195)
  c('BR', 'MX', 19_000), // Brazil → Mexico (18,794)
  c('NI', 'MX', 18_000), // Nicaragua → Mexico (18,139)
  c('CL', 'MX', 16_000), // Chile → Mexico (15,510)
  c('CA', 'MX', 14_000), // Canada → Mexico (14,431)
  c('CN', 'MX', 12_000), // China → Mexico (12,070)
  c('PE', 'MX', 10_000), // Peru → Mexico (10,394)
  c('FR', 'MX', 10_000), // France → Mexico (9,938)
  c('KR', 'MX', 9_000), // Republic of Korea → Mexico (9,104)
  c('EC', 'MX', 8_000), // Ecuador → Mexico (7,582)
  c('IT', 'MX', 7_000), // Italy → Mexico (7,359)
  c('DE', 'MX', 7_000), // Germany → Mexico (7,151)
  c('JP', 'MX', 7_000), // Japan → Mexico (6,655)
  c('DO', 'MX', 5_000), // Dominican Republic → Mexico (5,267)
  c('CR', 'MX', 5_000), // Costa Rica → Mexico (4,592)
  c('GB', 'MX', 4_000), // United Kingdom → Mexico (4,322)
  c('IN', 'MX', 4_000), // India → Mexico (3,620)
  c('BZ', 'MX', 3_000), // Belize → Mexico (3,170)
  c('RU', 'MX', 3_000), // Russian Federation → Mexico (2,995)
  c('UY', 'MX', 3_000), // Uruguay → Mexico (2,946)
  c('BO', 'MX', 3_000), // Bolivia (Plurinational State of) → Mexico (2,805)
  c('AO', 'MX', 2_000), // Angola → Mexico (2,457)
  c('AF', 'MX', 2_000), // Afghanistan → Mexico (2,262)
  c('PA', 'MX', 2_000), // Panama → Mexico (2,241)
  c('CH', 'MX', 2_000), // Switzerland → Mexico (1,520)
  c('PR', 'MX', 1_000), // Puerto Rico → Mexico (1,461)
  c('SN', 'MX', 1_000), // Senegal → Mexico (1,393)
  c('NL', 'MX', 1_000), // Netherlands → Mexico (1,296)
  c('IL', 'MX', 1_000), // Israel → Mexico (1,268)
  c('BE', 'MX', 1_000), // Belgium → Mexico (1,104)
  c('UA', 'MX', 1_000), // Ukraine → Mexico (1,099)
  c('CD', 'MX', 1_000), // Democratic Republic of the Congo → Mexico (1,016)
  c('PH', 'MX', 999), // Philippines → Mexico (999)
  c('NG', 'MX', 944), // Nigeria → Mexico (944)
  c('PL', 'MX', 910), // Poland → Mexico (910)
  c('LB', 'MX', 893), // Lebanon → Mexico (893)
  c('PT', 'MX', 869), // Portugal → Mexico (869)
  c('TW', 'MX', 762), // China, Taiwan Province of China → Mexico (762)
  c('PY', 'MX', 736), // Paraguay → Mexico (736)
  c('GH', 'MX', 714), // Ghana → Mexico (714)
  c('CM', 'MX', 680), // Cameroon → Mexico (680)
  c('RO', 'MX', 655), // Romania → Mexico (655)
  c('TR', 'MX', 645), // Türkiye → Mexico (645)
  c('AU', 'MX', 566), // Australia → Mexico (566)
  c('PK', 'MX', 546), // Pakistan → Mexico (546)
  c('AT', 'MX', 537), // Austria → Mexico (537)
  c('MA', 'MX', 515), // Morocco → Mexico (515)
  c('GN', 'MX', 488), // Guinea → Mexico (488)
  c('SE', 'MX', 465), // Sweden → Mexico (465)
  c('IR', 'MX', 401), // Iran (Islamic Republic of) → Mexico (401)
  c('BD', 'MX', 400), // Bangladesh → Mexico (400)
  c('JM', 'MX', 381), // Jamaica → Mexico (381)
  c('HU', 'MX', 374), // Hungary → Mexico (374)
  c('IE', 'MX', 370), // Ireland → Mexico (370)
  c('DK', 'MX', 359), // Denmark → Mexico (359)
  c('ZA', 'MX', 355), // South Africa → Mexico (355)
  c('EG', 'MX', 349), // Egypt → Mexico (349)
  c('SY', 'MX', 327), // Syrian Arab Republic → Mexico (327)
  c('GF', 'MX', 318), // French Guiana → Mexico (318)
  c('CZ', 'MX', 316), // Czechia → Mexico (316)
  c('MR', 'MX', 299), // Mauritania → Mexico (299)
  c('BG', 'MX', 289), // Bulgaria → Mexico (289)
  c('GR', 'MX', 256), // Greece → Mexico (256)
  c('FI', 'MX', 222), // Finland → Mexico (222)
  c('NO', 'MX', 214), // Norway → Mexico (214)
  c('ID', 'MX', 208), // Indonesia → Mexico (208)
  c('CG', 'MX', 206), // Congo → Mexico (206)
  c('DZ', 'MX', 205), // Algeria → Mexico (205)
  c('SA', 'MX', 204), // Saudi Arabia → Mexico (204)
  c('GU', 'MX', 10), // Guam → Mexico (10)
  // --- Born in Mexico, by country of residence (55 corridors) --------------
  c('MX', 'US', 11_280_000), // Mexico → United States of America (11,279,561)
  c('MX', 'CA', 104_000), // Mexico → Canada (103,620)
  c('MX', 'ES', 78_000), // Mexico → Spain (77,724)
  c('MX', 'GT', 21_000), // Mexico → Guatemala (20,758)
  c('MX', 'BO', 12_000), // Mexico → Bolivia (Plurinational State of) (11,841)
  c('MX', 'IT', 11_000), // Mexico → Italy (11,351)
  c('MX', 'AU', 9_000), // Mexico → Australia (9,381)
  c('MX', 'PA', 9_000), // Mexico → Panama (8,850)
  c('MX', 'CL', 7_000), // Mexico → Chile (7,285)
  c('MX', 'CO', 6_000), // Mexico → Colombia (6,422)
  c('MX', 'AR', 6_000), // Mexico → Argentina (5,941)
  c('MX', 'CR', 4_000), // Mexico → Costa Rica (4,489)
  c('MX', 'BZ', 4_000), // Mexico → Belize (4,426)
  c('MX', 'PE', 4_000), // Mexico → Peru (4,077)
  c('MX', 'BE', 4_000), // Mexico → Belgium (3,940)
  c('MX', 'JP', 4_000), // Mexico → Japan (3,503)
  c('MX', 'VE', 3_000), // Mexico → Venezuela (Bolivarian Republic of) (3,444)
  c('MX', 'BR', 3_000), // Mexico → Brazil (3,278)
  c('MX', 'IL', 3_000), // Mexico → Israel (3,237)
  c('MX', 'DK', 2_000), // Mexico → Denmark (2,302)
  c('MX', 'PY', 2_000), // Mexico → Paraguay (1,854)
  c('MX', 'EC', 2_000), // Mexico → Ecuador (1,797)
  c('MX', 'SV', 2_000), // Mexico → El Salvador (1,765)
  c('MX', 'NO', 2_000), // Mexico → Norway (1,701)
  c('MX', 'DO', 2_000), // Mexico → Dominican Republic (1,686)
  c('MX', 'PR', 2_000), // Mexico → Puerto Rico (1,655)
  c('MX', 'HN', 2_000), // Mexico → Honduras (1,631)
  c('MX', 'CN', 2_000), // Mexico → China (1,590)
  c('MX', 'FI', 1_000), // Mexico → Finland (1,171)
  c('MX', 'NI', 918), // Mexico → Nicaragua (918)
  c('MX', 'HU', 835), // Mexico → Hungary (835)
  c('MX', 'UY', 819), // Mexico → Uruguay (819)
  c('MX', 'PL', 557), // Mexico → Poland (557)
  c('MX', 'LU', 490), // Mexico → Luxembourg (490)
  c('MX', 'GR', 427), // Mexico → Greece (427)
  c('MX', 'PT', 339), // Mexico → Portugal (339)
  c('MX', 'HT', 310), // Mexico → Haiti (310)
  c('MX', 'ZA', 261), // Mexico → South Africa (261)
  c('MX', 'IS', 240), // Mexico → Iceland (240)
  c('MX', 'SK', 172), // Mexico → Slovakia (172)
  c('MX', 'BS', 151), // Mexico → Bahamas (151)
  c('MX', 'EE', 134), // Mexico → Estonia (134)
  c('MX', 'BG', 133), // Mexico → Bulgaria (133)
  c('MX', 'SI', 107), // Mexico → Slovenia (107)
  c('MX', 'CU', 75), // Mexico → Cuba (75)
  c('MX', 'CY', 64), // Mexico → Cyprus (64)
  c('MX', 'KY', 47), // Mexico → Cayman Islands (47)
  c('MX', 'LT', 35), // Mexico → Lithuania (35)
  c('MX', 'HR', 34), // Mexico → Croatia (34)
  c('MX', 'LI', 34), // Mexico → Liechtenstein (34)
  c('MX', 'LV', 24), // Mexico → Latvia (24)
  c('MX', 'CW', 21), // Mexico → Curaçao (21)
  c('MX', 'LC', 16), // Mexico → Saint Lucia (16)
  c('MX', 'AG', 4), // Mexico → Antigua and Barbuda (4)
  c('MX', 'CV', 2), // Mexico → Cabo Verde (2)
];

/**
 * Stock represented by {@link MEXICO_CORRIDOR_STOCK}, computed rather than
 * written down so it cannot drift from the list above. Not the number to add to
 * the main table — see {@link MEXICO_CORRIDOR_STOCK_ADDITIONS_TOTAL}.
 */
export const MEXICO_CORRIDOR_STOCK_TOTAL: number = MEXICO_CORRIDOR_STOCK.reduce(
  (sum, corridor) => sum + corridor.stock,
  0,
);

/** `ORIGIN>DESTINATION` — the key `checkAtlasIntegrity` uses to detect a duplicate row. */
const pairKey = (row: CorridorStock): string => `${row.origin}>${row.destination}`;

const MAIN_TABLE_BY_PAIR: ReadonlyMap<string, CorridorStock> = new Map(
  CORRIDOR_STOCK.map((row): [string, CorridorStock] => [pairKey(row), row]),
);

/**
 * The rows here that `stock.ts` already carries: `MX → US` and `US → MX`.
 *
 * Computed against the real `CORRIDOR_STOCK` rather than written down, so it
 * stays true if either file changes. Concatenating {@link MEXICO_CORRIDOR_STOCK}
 * whole double-counts exactly these rows — 12,104,000 people — and inflates
 * `knownStock` and `stockTableCompleteness` accordingly.
 */
export const MEXICO_CORRIDOR_STOCK_ROWS_IN_MAIN_TABLE: readonly CorridorStock[] =
  MEXICO_CORRIDOR_STOCK.filter((row) => MAIN_TABLE_BY_PAIR.has(pairKey(row)));

/**
 * The 132 rows `stock.ts` does not already carry. **This is what a merge should
 * concatenate.**
 *
 * `[...CORRIDOR_STOCK, ...MEXICO_CORRIDOR_STOCK_ADDITIONS]` is duplicate-free by
 * construction and needs no judgement at the call site, which is the point: a
 * merge rule that lives in a comment is a merge rule that will eventually be
 * read by someone in a hurry.
 */
export const MEXICO_CORRIDOR_STOCK_ADDITIONS: readonly CorridorStock[] =
  MEXICO_CORRIDOR_STOCK.filter((row) => !MAIN_TABLE_BY_PAIR.has(pairKey(row)));

/** Stock the additions bring to the merged table: 1,188,236 today. */
export const MEXICO_CORRIDOR_STOCK_ADDITIONS_TOTAL: number =
  MEXICO_CORRIDOR_STOCK_ADDITIONS.reduce((sum, corridor) => sum + corridor.stock, 0);

/** One ordered pair on which the two files disagree about the number of people. */
export interface MexicoStockValueDisagreement {
  /** `ORIGIN>DESTINATION`. */
  readonly pair: string;
  readonly mainTableStock: number;
  readonly mexicoTableStock: number;
}

/**
 * Overlapping rows whose values differ between the two files. Empty is the only
 * correct value, and it is a claim worth being able to check.
 *
 * Both files read the same cell of the same workbook, so today they agree. If
 * one is ever re-read against a newer vintage and the other is not, a merge that
 * deduplicates by ordered pair would silently keep whichever row it saw first
 * and report a figure from a year nobody chose. This makes that state visible
 * instead.
 */
export const MEXICO_CORRIDOR_STOCK_VALUE_DISAGREEMENTS: readonly MexicoStockValueDisagreement[] =
  MEXICO_CORRIDOR_STOCK_ROWS_IN_MAIN_TABLE.flatMap(
    (row): MexicoStockValueDisagreement[] => {
      const existing = MAIN_TABLE_BY_PAIR.get(pairKey(row));
      if (existing === undefined || existing.stock === row.stock) return [];
      return [
        {
          pair: pairKey(row),
          mainTableStock: existing.stock,
          mexicoTableStock: row.stock,
        },
      ];
    },
  );
