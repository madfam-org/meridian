/**
 * Presence records for the worked-example matters, and the rules each one is
 * measured against.
 *
 * A ledger is a list of continuous stays in one country, closed at both ends —
 * the day of entry and the day of exit are both days of presence. The records
 * below tile without gaps or overlaps, which is what a well-kept record looks
 * like; the one imperfection is deliberate and is described where it appears.
 *
 * **Which rules apply is data, not a guess.** Nothing here assumes that every
 * traveller needs a Schengen count. A matter declares the counters that bear on
 * it, and the page says plainly when a counter was not assessed and why. A
 * portal that showed a Canadian applicant an empty Schengen panel would be
 * inviting them to conclude something from a number that was never about them.
 */

import type { CountryCode, DateRange } from '@meridian/core';
import type { ContinuityPolicy, DayCountThreshold, StayInput } from '@meridian/presence';
import {
  CANADA_SOJOURNER_DAY_COUNT,
  SPAIN_IRPF_DAY_COUNT,
  SPAIN_NATIONALITY_CONTINUITY,
} from '@meridian/presence';

import { bi, type Bi } from '@/lib/i18n';

import { c, d, range } from './common';

/** The continuous-residence assessment needs a period; the period is a legal choice. */
export interface ContinuityScope {
  readonly policy: ContinuityPolicy;
  readonly window: DateRange;
  /** Why this window and not another. Shown to the reader. */
  readonly basis: Bi;
}

export interface PresenceScope {
  readonly stays: readonly StayInput[];
  /** Whether the Schengen short-stay allowance is relevant to this matter at all. */
  readonly schengen: boolean;
  /** Why Schengen is or is not assessed. */
  readonly schengenBasis: Bi;
  readonly thresholds: readonly DayCountThreshold[];
  readonly continuity: ContinuityScope | null;
  /** Stated when no continuity policy is available for the jurisdiction. */
  readonly continuityAbsent?: Bi;
  /** The country whose in-country presence the residence counters are about. */
  readonly homeCountry: CountryCode;
  /** The window the record is expected to account for, for gap detection. */
  readonly expectedCoverage: DateRange;
}

// ---------------------------------------------------------------------------
// Matter 1 — resident in Spain, with travel inside the Schengen area
// ---------------------------------------------------------------------------

/**
 * The Spanish stays are flagged `exemptFromSchengenShortStay`.
 *
 * That flag is the difference between a useful number and a terrifying wrong
 * one. The 90/180 rule in the Schengen Borders Code governs *short* stays. Days
 * spent in the Member State that issued the traveller's own residence permit
 * are not short-stay days, so charging a Spanish resident's days at home
 * against their 90 would report an overstay for someone sitting in their own
 * flat.
 *
 * Days in *other* Schengen States are a different matter. A residence-permit
 * holder moving around the area is exercising a short-stay right, so the trips
 * to Portugal and Italy below are not flagged and do count.
 */
const esStays: readonly StayInput[] = [
  {
    id: 'sty-es-01',
    country: c('ES'),
    start: d('2023-09-01'),
    end: d('2024-05-31'),
    source: 'declared',
    confidence: 'confirmed',
    exemptFromSchengenShortStay: true,
  },
  {
    id: 'sty-es-02',
    country: c('MX'),
    start: d('2024-06-01'),
    end: d('2025-01-15'),
    source: 'border_stamp',
    confidence: 'confirmed',
  },
  {
    id: 'sty-es-03',
    country: c('ES'),
    start: d('2025-01-16'),
    end: d('2025-06-30'),
    source: 'declared',
    confidence: 'confirmed',
    exemptFromSchengenShortStay: true,
  },
  {
    id: 'sty-es-04',
    country: c('PT'),
    start: d('2025-07-01'),
    end: d('2025-07-20'),
    source: 'itinerary',
    confidence: 'probable',
  },
  {
    id: 'sty-es-05',
    country: c('ES'),
    start: d('2025-07-21'),
    end: d('2025-12-19'),
    source: 'declared',
    confidence: 'confirmed',
    exemptFromSchengenShortStay: true,
  },
  {
    id: 'sty-es-06',
    country: c('MX'),
    start: d('2025-12-20'),
    end: d('2026-01-18'),
    source: 'border_stamp',
    confidence: 'confirmed',
  },
  {
    id: 'sty-es-07',
    country: c('ES'),
    start: d('2026-01-19'),
    end: d('2026-04-19'),
    source: 'declared',
    confidence: 'confirmed',
    exemptFromSchengenShortStay: true,
  },
  {
    id: 'sty-es-08',
    country: c('IT'),
    start: d('2026-04-20'),
    end: d('2026-06-14'),
    source: 'itinerary',
    confidence: 'probable',
  },
  {
    // Open-ended: no departure recorded. The ledger imputes an end date from
    // the evaluation date and marks the stay so the imputation is visible in
    // the inconsistency report rather than laundered into a total.
    id: 'sty-es-09',
    country: c('ES'),
    start: d('2026-06-15'),
    end: null,
    source: 'declared',
    confidence: 'confirmed',
    exemptFromSchengenShortStay: true,
  },
];

const esPresence: PresenceScope = {
  stays: esStays,
  schengen: true,
  schengenBasis: bi(
    'Assessed. The record includes stays in Schengen States other than the one that issued the residence permit, and those days charge against the short-stay allowance.',
    'Se evalúa. El registro incluye estancias en Estados Schengen distintos del que expidió la autorización de residencia, y esos días consumen la franquicia de estancia corta.',
  ),
  thresholds: [SPAIN_IRPF_DAY_COUNT],
  continuity: {
    policy: SPAIN_NATIONALITY_CONTINUITY,
    window: range('2023-09-01', '2026-07-25'),
    basis: bi(
      'Measured from the first day of recorded legal residence to the evaluation date. Art. 22.3 requires residence that is continuous and immediately prior to the application, so the period runs to today rather than to a fixed anniversary.',
      'Se mide desde el primer día de residencia legal registrada hasta la fecha de evaluación. El art. 22.3 exige residencia continuada e inmediatamente anterior a la solicitud, por lo que el periodo llega hasta hoy y no hasta un aniversario fijo.',
    ),
  },
  homeCountry: c('ES'),
  expectedCoverage: range('2023-09-01', '2026-07-25'),
};

// ---------------------------------------------------------------------------
// Matter 2 — alternating between Mexico and Canada
// ---------------------------------------------------------------------------

const caStays: readonly StayInput[] = [
  {
    id: 'sty-ca-01',
    country: c('MX'),
    start: d('2025-01-01'),
    end: d('2025-05-31'),
    source: 'declared',
    confidence: 'confirmed',
  },
  {
    id: 'sty-ca-02',
    country: c('CA'),
    start: d('2025-06-01'),
    end: d('2025-09-30'),
    source: 'border_stamp',
    confidence: 'confirmed',
  },
  {
    id: 'sty-ca-03',
    country: c('MX'),
    start: d('2025-10-01'),
    end: d('2026-02-28'),
    source: 'declared',
    confidence: 'confirmed',
  },
  {
    id: 'sty-ca-04',
    country: c('CA'),
    start: d('2026-03-01'),
    end: null,
    source: 'border_stamp',
    confidence: 'confirmed',
  },
];

const caPresence: PresenceScope = {
  stays: caStays,
  schengen: false,
  schengenBasis: bi(
    'Not assessed. This record contains no presence in the Schengen area, so there is no short-stay allowance to report on. An empty 90/180 panel would invite a conclusion the record cannot support.',
    'No se evalúa. Este registro no contiene presencia en el espacio Schengen, por lo que no hay franquicia de estancia corta que informar. Un panel 90/180 vacío invitaría a una conclusión que el registro no sostiene.',
  ),
  thresholds: [CANADA_SOJOURNER_DAY_COUNT],
  continuity: null,
  continuityAbsent: bi(
    'No continuous-residence policy for Canada is encoded in the shared catalog, so no continuity assessment is produced. That is a gap in the catalog, not a finding that continuity is unrestricted.',
    'El catálogo compartido no codifica ninguna política de residencia continuada para Canadá, por lo que no se produce evaluación de continuidad. Es una laguna del catálogo, no la conclusión de que la continuidad no esté sujeta a límites.',
  ),
  homeCountry: c('CA'),
  expectedCoverage: range('2025-01-01', '2026-07-25'),
};

// ---------------------------------------------------------------------------

const BY_MATTER: Readonly<Record<string, PresenceScope>> = {
  'mtr-sample-es': esPresence,
  'mtr-sample-ca': caPresence,
};

export function presenceScopeFor(matterId: string): PresenceScope | null {
  return Object.prototype.hasOwnProperty.call(BY_MATTER, matterId)
    ? (BY_MATTER[matterId] ?? null)
    : null;
}
