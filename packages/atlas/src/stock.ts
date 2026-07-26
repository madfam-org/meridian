/**
 * Migrant-stock weights: how many people each corridor actually concerns.
 *
 * ## What this file is for
 *
 * A structural coverage count — systems encoded over systems that exist — treats
 * Mexico-to-United States and Tuvalu-to-San Marino as equal units of progress.
 * Migration is not distributed that way. One corridor carries 11.3 million
 * people; the median country pair carries almost nobody. Without weighting we
 * could raise the coverage percentage a long way while helping hardly anyone,
 * and the number would applaud us for it.
 *
 * So {@link CoverageReport} weights coverage by stock, and this table supplies
 * the weights. It is not a finding and must never be quoted as one. Every figure
 * is an estimate produced by someone else, rounded by us to the nearest thousand
 * precisely so that nobody mistakes it for a measurement.
 *
 * ## Source
 *
 * United Nations, Department of Economic and Social Affairs, Population Division
 * (2025). *International Migrant Stock 2024*, POP/DB/MIG/Stock/Rev.2024, table 1
 * (both sexes, by destination and origin), column 2024. Downloaded and read on
 * 2026-07-25 from {@link CORRIDOR_STOCK_SOURCE_URL}.
 *
 * Every row below is a cell of that table: persons born in the origin, resident
 * in the destination, estimated as at mid-2024. Nothing here is interpolated,
 * inferred from a secondary report, or estimated by us. The comment on each row
 * carries the source's own label for the two areas, so a reader can find the
 * cell again without trusting our naming.
 *
 * The vintage matters. In the 2024 edition, 60 countries and areas received a
 * full reassessment against new censuses, registers or UNHCR data; figures for
 * the remainder are extrapolations of the 2020 edition. Precision is uneven
 * across the table and is worst exactly where administrative data is worst.
 *
 * ## What is in the table, and what cannot be
 *
 * Every country-pair corridor at or above {@link CORRIDOR_STOCK_MINIMUM}
 * persons, in descending order: {@link CORRIDOR_STOCK} rows summing to
 * {@link CORRIDOR_STOCK_TOTAL}.
 *
 * Two gaps are structural, not laziness, and `stockTableCompleteness` should be
 * read against them:
 *
 * 1. **Unattributed origin.** Of the {@link GLOBAL_MIGRANT_STOCK} migrants
 *    worldwide, the source assigns {@link UNATTRIBUTED_ORIGIN_STOCK} to origin
 *    "Others" — destinations that report a foreign-born population without a
 *    usable country of birth. No bilateral table can ever reach those people, so
 *    the ceiling on this metric is {@link ATTRIBUTABLE_BILATERAL_STOCK}, about
 *    92.7% of the world total, not 100%.
 * 2. **The tail.** 9,068 further country pairs sit below the threshold and carry
 *    roughly 83.3 million people between them. They are individually small and
 *    collectively large. Extending the table downward raises completeness; it
 *    does not change which corridors matter most.
 *
 * ## Three things a reader will otherwise get wrong
 *
 * - **Stock is not flow.** These are people resident now, however long ago they
 *   moved. The Russia-Ukraine, Ukraine-Russia and Kazakhstan-Russia rows include
 *   large numbers of people who never crossed a border at all: the border moved
 *   in 1991 and made them foreign-born. Such a corridor is real in the statistics
 *   and substantially historical in the law.
 * - **Some rows are not immigration corridors.** Puerto Rico to the United States
 *   is 1.9 million people who are US citizens by birth and face no immigration
 *   process whatever. It is here because it is in the source, and dropping rows
 *   on our own judgement would be a silent editorial filter on a metric that is
 *   supposed to be checkable. Weighting engines should know it is there.
 * - **Direction here means place of birth, not intent.** A few rows are unlikely
 *   to describe a route anyone travels — Malaysia to Bangladesh, 274,000, is the
 *   clearest. We have not established what those figures represent; they are
 *   reproduced as the source gives them and should not be read as a demand
 *   signal.
 *
 * ## Codes
 *
 * ISO 3166-1 alpha-2, joined from the source's M49 codes. Hong Kong (HK), Macao
 * (MO) and Taiwan (TW) appear as their own jurisdictions because they run their
 * own immigration control, which is the distinction {@link SystemAutonomy}
 * exists to record; Puerto Rico (PR) appears because the source counts it
 * separately, though its control is delegated to the United States; the State of
 * Palestine (PS) appears as the source records it. Those five, plus 122
 * sovereign states, are the 127 jurisdictions this table touches.
 */

import type { CorridorStock } from './types.js';
import { jurisdictionCode } from './types.js';

/** UN DESA *International Migrant Stock 2024*, bilateral matrix (destination × origin). */
export const CORRIDOR_STOCK_SOURCE_URL =
  'https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx';

/** Reference year of every figure in this file: mid-2024. */
export const CORRIDOR_STOCK_AS_OF_YEAR = 2024;

/**
 * Total international migrants worldwide, mid-2024.
 *
 * The source's own World × World cell. Its published headline rounds this to
 * "304 million"; the exact cell is kept here because it is the denominator of
 * `stockTableCompleteness`, and a denominator that has been quietly rounded is
 * how a metric starts drifting from the thing it claims to measure.
 */
export const GLOBAL_MIGRANT_STOCK = 304_021_813;

/**
 * Migrants the source cannot assign to any country of origin ("Others").
 *
 * 7.3% of the world total. Unreachable by any bilateral table, including a
 * perfect one.
 */
export const UNATTRIBUTED_ORIGIN_STOCK = 22_065_614;

/**
 * Global stock that is attributable to a specific country pair.
 *
 * `GLOBAL_MIGRANT_STOCK - UNATTRIBUTED_ORIGIN_STOCK`, stated explicitly because
 * it is the real ceiling on `stockTableCompleteness` — about 92.7%.
 */
export const ATTRIBUTABLE_BILATERAL_STOCK = 281_956_199;

/**
 * Inclusion rule: every corridor whose 2024 figure in the source, before our
 * rounding, is at or above this number is in the table, and nothing is in the
 * table that is not in the source. Stated as a constant so a test can assert the
 * rule rather than trusting the list.
 */
export const CORRIDOR_STOCK_MINIMUM = 200_000;

const c = (origin: string, destination: string, stock: number): CorridorStock => ({
  origin: jurisdictionCode(origin),
  destination: jurisdictionCode(destination),
  stock,
  sourceUrl: CORRIDOR_STOCK_SOURCE_URL,
  asOfYear: CORRIDOR_STOCK_AS_OF_YEAR,
});

/**
 * The 280 largest bilateral migrant corridors, descending by stock.
 *
 * Rounded to the nearest thousand. Comments give the source's labels, origin
 * first, destination second — the same order as the fields.
 */
export const CORRIDOR_STOCK: readonly CorridorStock[] = [
  c('MX', 'US', 11_280_000), // Mexico → United States of America
  c('AF', 'IR', 3_752_000), // Afghanistan → Iran (Islamic Republic of)
  c('SY', 'TR', 3_564_000), // Syrian Arab Republic → Türkiye
  c('RU', 'UA', 3_375_000), // Russian Federation → Ukraine
  c('IN', 'AE', 3_249_000), // India → United Arab Emirates
  c('IN', 'US', 3_165_000), // India → United States of America
  c('VE', 'CO', 2_905_000), // Venezuela (Bolivarian Republic of) → Colombia
  c('UA', 'RU', 2_873_000), // Ukraine → Russian Federation
  c('CN', 'HK', 2_490_000), // China → China, Hong Kong SAR
  c('CN', 'US', 2_489_000), // China → United States of America
  c('PS', 'JO', 2_380_000), // State of Palestine → Jordan
  c('BD', 'SA', 2_363_000), // Bangladesh → Saudi Arabia
  c('BD', 'IN', 2_294_000), // Bangladesh → India
  c('PH', 'US', 2_264_000), // Philippines → United States of America
  c('YE', 'SA', 2_000_000), // Yemen → Saudi Arabia
  c('IN', 'SA', 1_953_000), // India → Saudi Arabia
  c('PK', 'SA', 1_937_000), // Pakistan → Saudi Arabia
  c('PR', 'US', 1_925_000), // Puerto Rico → United States of America
  c('AF', 'PK', 1_923_000), // Afghanistan → Pakistan
  c('PL', 'DE', 1_884_000), // Poland → Germany
  c('BF', 'CI', 1_821_000), // Burkina Faso → Côte d'Ivoire
  c('ID', 'MY', 1_762_000), // Indonesia → Malaysia
  c('MM', 'TH', 1_709_000), // Myanmar → Thailand
  c('IN', 'PK', 1_597_000), // India → Pakistan
  c('VE', 'PE', 1_597_000), // Venezuela (Bolivarian Republic of) → Peru
  c('SY', 'JO', 1_594_000), // Syrian Arab Republic → Jordan
  c('SV', 'US', 1_570_000), // El Salvador → United States of America
  c('MY', 'SG', 1_553_000), // Malaysia → Singapore
  c('SS', 'SD', 1_508_000), // South Sudan → Sudan
  c('TR', 'DE', 1_505_000), // Türkiye → Germany
  c('EG', 'SA', 1_498_000), // Egypt → Saudi Arabia
  c('DO', 'US', 1_483_000), // Dominican Republic → United States of America
  c('VN', 'US', 1_435_000), // Viet Nam → United States of America
  c('UA', 'DE', 1_417_000), // Ukraine → Germany
  c('DZ', 'FR', 1_405_000), // Algeria → France
  c('CU', 'US', 1_395_000), // Cuba → United States of America
  c('KZ', 'RU', 1_321_000), // Kazakhstan → Russian Federation
  c('GT', 'US', 1_299_000), // Guatemala → United States of America
  c('MM', 'BD', 1_247_000), // Myanmar → Bangladesh
  c('IN', 'KW', 1_231_000), // India → Kuwait
  c('DE', 'US', 1_138_000), // Germany → United States of America
  c('RU', 'DE', 1_137_000), // Russian Federation → Germany
  c('GB', 'AU', 1_107_000), // United Kingdom → Australia
  c('UA', 'PL', 1_103_000), // Ukraine → Poland
  c('MA', 'ES', 1_088_000), // Morocco → Spain
  c('KR', 'US', 1_083_000), // Republic of Korea → United States of America
  c('ZW', 'ZA', 1_073_000), // Zimbabwe → South Africa
  c('SD', 'TD', 1_071_000), // Sudan → Chad
  c('MA', 'FR', 1_066_000), // Morocco → France
  c('IN', 'GB', 1_045_000), // India → United Kingdom
  c('BD', 'AE', 1_025_000), // Bangladesh → United Arab Emirates
  c('IN', 'CA', 1_016_000), // India → Canada
  c('CO', 'US', 1_009_000), // Colombia → United States of America
  c('RO', 'DE', 969_000), // Romania → Germany
  c('CA', 'US', 950_000), // Canada → United States of America
  c('HN', 'US', 935_000), // Honduras → United States of America
  c('PK', 'AE', 932_000), // Pakistan → United Arab Emirates
  c('SS', 'UG', 924_000), // South Sudan → Uganda
  c('JM', 'US', 911_000), // Jamaica → United States of America
  c('PL', 'GB', 902_000), // Poland → United Kingdom
  c('KZ', 'DE', 896_000), // Kazakhstan → Germany
  c('SD', 'SA', 896_000), // Sudan → Saudi Arabia
  c('GB', 'US', 895_000), // United Kingdom → United States of America
  c('RO', 'IT', 880_000), // Romania → Italy
  c('IN', 'AU', 876_000), // India → Australia
  c('CO', 'VE', 876_000), // Colombia → Venezuela (Bolivarian Republic of)
  c('RU', 'UZ', 866_000), // Russian Federation → Uzbekistan
  c('SY', 'DE', 861_000), // Syrian Arab Republic → Germany
  c('EG', 'AE', 842_000), // Egypt → United Arab Emirates
  c('PH', 'CA', 836_000), // Philippines → Canada
  c('US', 'MX', 824_000), // United States of America → Mexico
  c('CN', 'JP', 810_000), // China → Japan
  c('IN', 'OM', 803_000), // India → Oman
  c('HT', 'US', 798_000), // Haiti → United States of America
  c('CO', 'ES', 792_000), // Colombia → Spain
  c('SY', 'LB', 785_000), // Syrian Arab Republic → Lebanon
  c('UZ', 'RU', 778_000), // Uzbekistan → Russian Federation
  c('CN', 'CA', 772_000), // China → Canada
  c('PK', 'IN', 768_000), // Pakistan → India
  c('EG', 'JO', 768_000), // Egypt → Jordan
  c('VE', 'US', 764_000), // Venezuela (Bolivarian Republic of) → United States of America
  c('CN', 'KR', 757_000), // China → Republic of Korea
  c('PH', 'SA', 755_000), // Philippines → Saudi Arabia
  c('UZ', 'KZ', 744_000), // Uzbekistan → Kazakhstan
  c('BR', 'US', 739_000), // Brazil → United States of America
  c('BD', 'OM', 737_000), // Bangladesh → Oman
  c('IN', 'QA', 737_000), // India → Qatar
  c('RO', 'GB', 714_000), // Romania → United Kingdom
  c('PK', 'GB', 703_000), // Pakistan → United Kingdom
  c('RU', 'BY', 665_000), // Russian Federation → Belarus
  c('NP', 'IN', 664_000), // Nepal → India
  c('CN', 'AU', 656_000), // China → Australia
  c('CD', 'UG', 637_000), // Democratic Republic of the Congo → Uganda
  c('PS', 'SY', 615_000), // State of Palestine → Syrian Arab Republic
  c('SD', 'SS', 609_000), // Sudan → South Sudan
  c('VE', 'ES', 603_000), // Venezuela (Bolivarian Republic of) → Spain
  c('VN', 'JP', 590_000), // Viet Nam → Japan
  c('NZ', 'AU', 588_000), // New Zealand → Australia
  c('PT', 'FR', 586_000), // Portugal → France
  c('CI', 'BF', 574_000), // Côte d'Ivoire → Burkina Faso
  c('VE', 'BR', 572_000), // Venezuela (Bolivarian Republic of) → Brazil
  c('NG', 'US', 565_000), // Nigeria → United States of America
  c('EC', 'US', 562_000), // Ecuador → United States of America
  c('RU', 'KZ', 552_000), // Russian Federation → Kazakhstan
  c('JP', 'US', 547_000), // Japan → United States of America
  c('AL', 'IT', 543_000), // Albania → Italy
  c('HT', 'DO', 535_000), // Haiti → Dominican Republic
  c('CN', 'SG', 534_000), // China → Singapore
  c('PH', 'AE', 529_000), // Philippines → United Arab Emirates
  c('RO', 'ES', 523_000), // Romania → Spain
  c('PY', 'AR', 517_000), // Paraguay → Argentina
  c('UA', 'CZ', 515_000), // Ukraine → Czechia
  c('PE', 'US', 512_000), // Peru → United States of America
  c('NP', 'MY', 503_000), // Nepal → Malaysia
  c('SD', 'EG', 500_000), // Sudan → Egypt
  c('SY', 'SA', 496_000), // Syrian Arab Republic → Saudi Arabia
  c('PS', 'LB', 491_000), // State of Palestine → Lebanon
  c('VE', 'EC', 488_000), // Venezuela (Bolivarian Republic of) → Ecuador
  c('AL', 'GR', 474_000), // Albania → Greece
  c('MA', 'IT', 473_000), // Morocco → Italy
  c('PK', 'US', 453_000), // Pakistan → United States of America
  c('RU', 'US', 453_000), // Russian Federation → United States of America
  c('EG', 'KW', 450_000), // Egypt → Kuwait
  c('UA', 'US', 448_000), // Ukraine → United States of America
  c('SS', 'ET', 444_000), // South Sudan → Ethiopia
  c('TN', 'FR', 444_000), // Tunisia → France
  c('IT', 'DE', 437_000), // Italy → Germany
  c('EC', 'ES', 432_000), // Ecuador → Spain
  c('IR', 'US', 431_000), // Iran (Islamic Republic of) → United States of America
  c('GB', 'CA', 428_000), // United Kingdom → Canada
  c('VE', 'CL', 428_000), // Venezuela (Bolivarian Republic of) → Chile
  c('NI', 'CR', 423_000), // Nicaragua → Costa Rica
  c('HK', 'CN', 422_000), // China, Hong Kong SAR → China
  c('TJ', 'RU', 416_000), // Tajikistan → Russian Federation
  c('IN', 'NP', 412_000), // India → Nepal
  c('MZ', 'ZA', 412_000), // Mozambique → South Africa
  c('BD', 'KW', 406_000), // Bangladesh → Kuwait
  c('BJ', 'NG', 404_000), // Benin → Nigeria
  c('IQ', 'TR', 404_000), // Iraq → Türkiye
  c('ML', 'CI', 404_000), // Mali → Côte d'Ivoire
  c('TW', 'US', 404_000), // China, Taiwan Province of China → United States of America
  c('SO', 'KE', 402_000), // Somalia → Kenya
  c('PL', 'US', 397_000), // Poland → United States of America
  c('UA', 'IT', 396_000), // Ukraine → Italy
  c('KR', 'JP', 394_000), // Republic of Korea → Japan
  c('AR', 'ES', 391_000), // Argentina → Spain
  c('SO', 'ET', 389_000), // Somalia → Ethiopia
  c('ER', 'SD', 384_000), // Eritrea → Sudan
  c('IN', 'SG', 377_000), // India → Singapore
  c('KH', 'TH', 376_000), // Cambodia → Thailand
  c('DE', 'CH', 372_000), // Germany → Switzerland
  c('CF', 'CD', 368_000), // Central African Republic → Democratic Republic of the Congo
  c('MM', 'CN', 367_000), // Myanmar → China
  c('DE', 'TR', 364_000), // Germany → Türkiye
  c('ET', 'US', 364_000), // Ethiopia → United States of America
  c('BA', 'HR', 363_000), // Bosnia and Herzegovina → Croatia
  c('PK', 'KW', 362_000), // Pakistan → Kuwait
  c('IT', 'US', 361_000), // Italy → United States of America
  c('IE', 'GB', 360_000), // Ireland → United Kingdom
  c('AF', 'DE', 359_000), // Afghanistan → Germany
  c('BD', 'US', 358_000), // Bangladesh → United States of America
  c('PH', 'AU', 357_000), // Philippines → Australia
  c('PE', 'ES', 352_000), // Peru → Spain
  c('BG', 'TR', 348_000), // Bulgaria → Türkiye
  c('CZ', 'DE', 345_000), // Czechia → Germany
  c('IT', 'GB', 342_000), // Italy → United Kingdom
  c('AM', 'RU', 341_000), // Armenia → Russian Federation
  c('BG', 'DE', 338_000), // Bulgaria → Germany
  c('BO', 'AR', 337_000), // Bolivia (Plurinational State of) → Argentina
  c('CF', 'CM', 336_000), // Central African Republic → Cameroon
  c('KG', 'RU', 334_000), // Kyrgyzstan → Russian Federation
  c('AF', 'TR', 332_000), // Afghanistan → Türkiye
  c('IN', 'BH', 328_000), // India → Bahrain
  c('NG', 'GB', 324_000), // Nigeria → United Kingdom
  c('PS', 'LY', 323_000), // State of Palestine → Libya
  c('BA', 'DE', 320_000), // Bosnia and Herzegovina → Germany
  c('PH', 'JP', 320_000), // Philippines → Japan
  c('CN', 'MO', 318_000), // China → China, Macao SAR
  c('GY', 'US', 315_000), // Guyana → United States of America
  c('AZ', 'RU', 308_000), // Azerbaijan → Russian Federation
  c('MM', 'MY', 308_000), // Myanmar → Malaysia
  c('TH', 'US', 308_000), // Thailand → United States of America
  c('IT', 'FR', 304_000), // Italy → France
  c('RS', 'DE', 304_000), // Serbia → Germany
  c('BD', 'GB', 299_000), // Bangladesh → United Kingdom
  c('ID', 'AE', 298_000), // Indonesia → United Arab Emirates
  c('NP', 'SA', 298_000), // Nepal → Saudi Arabia
  c('GB', 'ES', 295_000), // United Kingdom → Spain
  c('NI', 'US', 295_000), // Nicaragua → United States of America
  c('GB', 'IE', 294_000), // United Kingdom → Ireland
  c('VN', 'AU', 294_000), // Viet Nam → Australia
  c('ID', 'TW', 293_000), // Indonesia → China, Taiwan Province of China
  c('DE', 'GB', 288_000), // Germany → United Kingdom
  c('LA', 'TH', 286_000), // Lao People's Democratic Republic → Thailand
  c('RW', 'CD', 286_000), // Rwanda → Democratic Republic of the Congo
  c('SO', 'YE', 285_000), // Somalia → Yemen
  c('IR', 'DE', 283_000), // Iran (Islamic Republic of) → Germany
  c('BD', 'MY', 282_000), // Bangladesh → Malaysia
  c('PK', 'OM', 280_000), // Pakistan → Oman
  c('BA', 'RS', 278_000), // Bosnia and Herzegovina → Serbia
  c('BD', 'QA', 275_000), // Bangladesh → Qatar
  c('UG', 'KE', 275_000), // Uganda → Kenya
  c('IT', 'CH', 274_000), // Italy → Switzerland
  c('MY', 'BD', 274_000), // Malaysia → Bangladesh
  c('UA', 'GB', 274_000), // Ukraine → United Kingdom
  c('IQ', 'US', 272_000), // Iraq → United States of America
  c('HR', 'DE', 271_000), // Croatia → Germany
  c('HK', 'US', 269_000), // China, Hong Kong SAR → United States of America
  c('DE', 'AT', 268_000), // Germany → Austria
  c('IN', 'DE', 267_000), // India → Germany
  c('NP', 'QA', 267_000), // Nepal → Qatar
  c('PK', 'CA', 267_000), // Pakistan → Canada
  c('IQ', 'DE', 264_000), // Iraq → Germany
  c('NP', 'US', 264_000), // Nepal → United States of America
  c('EG', 'US', 263_000), // Egypt → United States of America
  c('VN', 'TW', 263_000), // Viet Nam → China, Taiwan Province of China
  c('PE', 'CL', 262_000), // Peru → Chile
  c('VN', 'KR', 261_000), // Viet Nam → Republic of Korea
  c('TR', 'FR', 260_000), // Türkiye → France
  c('GH', 'US', 258_000), // Ghana → United States of America
  c('SY', 'IQ', 258_000), // Syrian Arab Republic → Iraq
  c('US', 'CA', 257_000), // United States of America → Canada
  c('GH', 'NG', 256_000), // Ghana → Nigeria
  c('PH', 'MY', 256_000), // Philippines → Malaysia
  c('BY', 'RU', 255_000), // Belarus → Russian Federation
  c('ES', 'FR', 255_000), // Spain → France
  c('GB', 'NZ', 255_000), // United Kingdom → New Zealand
  c('LK', 'IN', 254_000), // Sri Lanka → India
  c('BY', 'UA', 253_000), // Belarus → Ukraine
  c('FR', 'US', 253_000), // France → United States of America
  c('RO', 'HU', 253_000), // Romania → Hungary
  c('CN', 'TW', 250_000), // China → China, Taiwan Province of China
  c('MA', 'BE', 247_000), // Morocco → Belgium
  c('PK', 'QA', 247_000), // Pakistan → Qatar
  c('ZA', 'GB', 245_000), // South Africa → United Kingdom
  c('US', 'GB', 244_000), // United States of America → United Kingdom
  c('GR', 'DE', 243_000), // Greece → Germany
  c('SY', 'SE', 243_000), // Syrian Arab Republic → Sweden
  c('TT', 'US', 242_000), // Trinidad and Tobago → United States of America
  c('BI', 'TZ', 241_000), // Burundi → United Republic of Tanzania
  c('CN', 'IT', 241_000), // China → Italy
  c('LS', 'ZA', 238_000), // Lesotho → South Africa
  c('CD', 'RW', 236_000), // Democratic Republic of the Congo → Rwanda
  c('RU', 'TJ', 236_000), // Russian Federation → Tajikistan
  c('KM', 'FR', 232_000), // Comoros → France
  c('SK', 'CZ', 231_000), // Slovakia → Czechia
  c('KZ', 'UA', 229_000), // Kazakhstan → Ukraine
  c('UZ', 'UA', 226_000), // Uzbekistan → Ukraine
  c('CD', 'BI', 224_000), // Democratic Republic of the Congo → Burundi
  c('HR', 'RS', 223_000), // Croatia → Serbia
  c('MW', 'ZA', 220_000), // Malawi → South Africa
  c('UA', 'BY', 220_000), // Ukraine → Belarus
  c('CI', 'ML', 219_000), // Côte d'Ivoire → Mali
  c('CN', 'BD', 219_000), // China → Bangladesh
  c('HN', 'ES', 219_000), // Honduras → Spain
  c('IQ', 'JO', 219_000), // Iraq → Jordan
  c('MD', 'IT', 219_000), // Republic of Moldova → Italy
  c('FR', 'ES', 218_000), // France → Spain
  c('UA', 'ES', 218_000), // Ukraine → Spain
  c('TR', 'NL', 217_000), // Türkiye → Netherlands
  c('CU', 'ES', 215_000), // Cuba → Spain
  c('AT', 'DE', 213_000), // Austria → Germany
  c('ZA', 'AU', 213_000), // South Africa → Australia
  c('AR', 'US', 212_000), // Argentina → United States of America
  c('ES', 'GB', 212_000), // Spain → United Kingdom
  c('HU', 'DE', 212_000), // Hungary → Germany
  c('KE', 'US', 211_000), // Kenya → United States of America
  c('PL', 'NL', 211_000), // Poland → Netherlands
  c('PH', 'KW', 210_000), // Philippines → Kuwait
  c('IQ', 'SY', 209_000), // Iraq → Syrian Arab Republic
  c('JO', 'SA', 209_000), // Jordan → Saudi Arabia
  c('BR', 'JP', 207_000), // Brazil → Japan
  c('LT', 'GB', 207_000), // Lithuania → United Kingdom
  c('ID', 'BD', 206_000), // Indonesia → Bangladesh
  c('HK', 'CA', 205_000), // China, Hong Kong SAR → Canada
  c('IR', 'CA', 205_000), // Iran (Islamic Republic of) → Canada
  c('AO', 'CD', 202_000), // Angola → Democratic Republic of the Congo
  c('AO', 'PT', 202_000), // Angola → Portugal
  c('DO', 'ES', 202_000), // Dominican Republic → Spain
  c('PT', 'CH', 202_000), // Portugal → Switzerland
];

/**
 * Stock represented by {@link CORRIDOR_STOCK}, computed rather than written down
 * so it cannot drift from the list above.
 */
export const CORRIDOR_STOCK_TOTAL: number = CORRIDOR_STOCK.reduce(
  (sum, corridor) => sum + corridor.stock,
  0,
);
