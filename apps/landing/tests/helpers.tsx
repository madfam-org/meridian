/**
 * Shared machinery for the landing tests.
 *
 * Two kinds of helper live here, and the distinction matters.
 *
 * `stayFacts` / `countOn` build inputs for {@link countSchengenDays} out of the
 * same `@meridian/core` constructors the application uses, so an arithmetic
 * test never asserts against a hand-written object literal that has drifted
 * from the real shape.
 *
 * `renderCalculator`, `fillTrip` and `submit` drive the rendered instrument
 * through its *accessible* names — the label a screen reader reads, the button
 * text a person clicks — rather than through DOM ids. That is deliberate: it
 * means every behavioural test also exercises the labelling, so a control that
 * loses its `<label for>` fails a dozen tests rather than passing them all and
 * quietly becoming unreachable.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { countryCode, dateRange, isSchengenOn, isoDate } from '@meridian/core';
import type { IsoDate } from '@meridian/core';

import { SchengenCalculator } from '@/components/SchengenCalculator';
import type { Locale } from '@/lib/i18n';
import { countSchengenDays, type SchengenCount, type StayFacts } from '@/lib/schengen';

// ---------------------------------------------------------------------------
// Inputs for the counter
// ---------------------------------------------------------------------------

export function stayFacts(id: string, country: string, start: string, end: string): StayFacts {
  return {
    id,
    country: countryCode(country),
    range: dateRange(isoDate(start), isoDate(end)),
  };
}

/** `countOn('2026-07-25', ['a', 'ES', ...])` — reference date first, as the rule reads. */
export function countOn(
  referenceDate: string,
  ...stays: readonly (readonly [string, string, string, string])[]
): SchengenCount {
  return countSchengenDays({
    referenceDate: isoDate(referenceDate),
    stays: stays.map(([id, country, start, end]) => stayFacts(id, country, start, end)),
  });
}

/**
 * The same count, recomputed day by day with no shared code beyond the
 * membership table itself.
 *
 * AGENTS.md asks for a cross-check against an independent brute force rather
 * than a restatement of the implementation, and this is it: walk every day of
 * the window, ask whether any stay covers it and whether that State was inside
 * the area, and count the days that answer yes. It shares no branch with
 * `countedRunsForStay`, `mergeRanges` or `totalDays`, so an off-by-one in the
 * clipping, a run that fails to close at the end of a stay, or a merge that
 * double-counts an overlap all show up as a disagreement.
 */
export function bruteForceDaysUsed(
  referenceDate: string,
  stays: readonly (readonly [string, string, string, string])[],
): number {
  let used = 0;
  // 180 days ending on the reference date, both included.
  for (let back = 0; back < 180; back++) {
    const day = shiftBack(referenceDate, back);
    const covered = stays.some(
      ([, country, start, end]) =>
        day >= start && day <= end && isSchengenOn(countryCode(country), day),
    );
    if (covered) used += 1;
  }
  return used;
}

/**
 * `referenceDate` minus `n` days, computed with the calendar rather than with a
 * `Date`. Written out here so the brute force does not borrow `addDays` from
 * the same module the engine walks the window with.
 */
function shiftBack(referenceDate: string, n: number): IsoDate {
  const parts = referenceDate.split('-').map((p) => Number(p));
  const [y, m, d] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  // Days since an arbitrary epoch, by the proleptic Gregorian civil calendar.
  const serial = toSerial(y, m, d) - n;
  return fromSerial(serial);
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function monthLength(y: number, m: number): number {
  return m === 2 && isLeap(y) ? 29 : (MONTH_LENGTHS[m - 1] ?? 30);
}

function toSerial(y: number, m: number, d: number): number {
  let days = 0;
  for (let year = 1; year < y; year++) days += isLeap(year) ? 366 : 365;
  for (let month = 1; month < m; month++) days += monthLength(y, month);
  return days + d;
}

function fromSerial(serial: number): IsoDate {
  let remaining = serial;
  let y = 1;
  for (;;) {
    const inYear = isLeap(y) ? 366 : 365;
    if (remaining <= inYear) break;
    remaining -= inYear;
    y += 1;
  }
  let m = 1;
  for (;;) {
    const inMonth = monthLength(y, m);
    if (remaining <= inMonth) break;
    remaining -= inMonth;
    m += 1;
  }
  const pad = (n: number, width: number): string => String(n).padStart(width, '0');
  return isoDate(`${pad(y, 4)}-${pad(m, 2)}-${pad(remaining, 2)}`);
}

/**
 * A deterministic permutation. AGENTS.md asks for a seeded shuffle rather than
 * `Math.random`, so a failure is reproducible from the seed printed with it.
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    // xorshift32 — small, deterministic, and not a security primitive.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const j = state % (i + 1);
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Driving the rendered instrument
// ---------------------------------------------------------------------------

export const UI_TEXT = {
  en: {
    submit: 'Count my days',
    clear: 'Clear',
    addTrip: 'Add a trip',
    state: /^State/,
    arrived: /Day you arrived/,
    left: /Day you left/,
    reference: /Measure the window ending on/,
    trip: (n: number) => new RegExp(`^Trip ${n}\\b`),
  },
  es: {
    submit: 'Contar mis días',
    clear: 'Borrar',
    addTrip: 'Añadir un viaje',
    state: /^Estado/,
    arrived: /Día de llegada/,
    left: /Día de salida/,
    reference: /Medir la ventana que termina el/,
    trip: (n: number) => new RegExp(`^Viaje ${n}\\b`),
  },
} as const;

export interface RenderedCalculator {
  readonly container: HTMLElement;
  readonly unmount: () => void;
}

/**
 * The return type is narrowed by hand to the two members these tests use.
 * Testing Library's own `RenderResult` cannot be named from here without
 * reaching into a pnpm-hashed path, which `tsc` rejects as unportable.
 */
export function renderCalculator(locale: Locale = 'en'): RenderedCalculator {
  const { container, unmount } = render(<SchengenCalculator locale={locale} />);
  return { container, unmount };
}

/** The fieldset for one trip, addressed by the legend a reader sees. */
export function tripGroup(n: number, locale: Locale = 'en'): HTMLElement {
  return screen.getByRole('group', { name: UI_TEXT[locale].trip(n) });
}

/** Set a control's value the way a browser does — through a change event. */
function setValue(control: HTMLElement, value: string): void {
  fireEvent.change(control, { target: { value } });
}

export function fillTrip(
  n: number,
  facts: { country?: string; start?: string; end?: string },
  locale: Locale = 'en',
): void {
  const group = tripGroup(n, locale);
  const text = UI_TEXT[locale];
  if (facts.country !== undefined) {
    setValue(within(group).getByLabelText(text.state), facts.country);
  }
  if (facts.start !== undefined) {
    setValue(within(group).getByLabelText(text.arrived), facts.start);
  }
  if (facts.end !== undefined) {
    setValue(within(group).getByLabelText(text.left), facts.end);
  }
}

export function setReferenceDate(value: string, locale: Locale = 'en'): void {
  setValue(screen.getByLabelText(UI_TEXT[locale].reference), value);
}

export function submit(locale: Locale = 'en'): void {
  fireEvent.click(screen.getByRole('button', { name: UI_TEXT[locale].submit }));
}

/** The result region, or `null` when the calculator has produced no answer. */
export function resultRegion(): HTMLElement | null {
  return document.getElementById('sch-result');
}

export function resultText(): string {
  const region = resultRegion();
  if (region === null) throw new Error('the calculator rendered no result region');
  return region.textContent ?? '';
}
