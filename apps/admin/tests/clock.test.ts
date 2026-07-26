/**
 * The reference date.
 *
 * Everything on every screen is computed against `AsOf.date`, so the two
 * failures worth guarding are the ones that produce a page which *looks* right
 * and answers a different question: a typo that silently falls back to today,
 * and an override that quietly stops travelling when the reader navigates.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { AS_OF_PARAM, firstParam, resolveAsOf, withAsOf } from '@/lib/clock';

const ENV_KEY = 'MERIDIAN_ASOF';

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe('firstParam', () => {
  it('takes the first value when Next delivers a repeated parameter', () => {
    // `?asOf=2025-01-01&asOf=2026-01-01` arrives as an array. Rendering against
    // the last one would make the answer depend on link-builder order.
    expect(firstParam(['2025-01-01', '2026-01-01'])).toBe('2025-01-01');
    expect(firstParam('2025-01-01')).toBe('2025-01-01');
    expect(firstParam(undefined)).toBeUndefined();
    expect(firstParam([])).toBeUndefined();
  });
});

describe('resolveAsOf', () => {
  it('reads a valid date out of the URL and marks it as an override', () => {
    const asOf = resolveAsOf('2025-04-02');
    expect(asOf.date).toBe('2025-04-02');
    expect(asOf.source).toBe('url');
    expect(asOf.overridden).toBe(true);
    expect(asOf.rejected).toBeUndefined();
  });

  it('does not call it an override when the URL names the system date', () => {
    // The banner keys off `overridden`. `?asOf=<today>` must not raise one:
    // a permanent "you are looking at another date" notice on a page showing
    // today is the fastest way to teach a reader to ignore the notice.
    const today = resolveAsOf(undefined).today;
    const asOf = resolveAsOf(today);
    expect(asOf.date).toBe(today);
    expect(asOf.source).toBe('url');
    expect(asOf.overridden).toBe(false);
  });

  it('reports an unparseable URL override instead of silently using today', () => {
    // 2026-02-30 is well-formed and not a date. Falling back without saying so
    // renders a page that answers a question nobody asked.
    const asOf = resolveAsOf('2026-02-30');
    expect(asOf.rejected).toEqual({ raw: '2026-02-30', from: 'url' });
    expect(asOf.date).toBe(asOf.today);
    expect(asOf.source).toBe('system_clock');
    expect(asOf.overridden).toBe(false);
  });

  it('echoes the reader’s own text back, never a repaired version of it', () => {
    const asOf = resolveAsOf('yesterday');
    expect(asOf.rejected?.raw).toBe('yesterday');
    expect(asOf.date).not.toBe('yesterday');
  });

  it('ignores an empty or whitespace-only parameter', () => {
    // `?asOf=` is what an empty date input submits. It is not a rejection.
    expect(resolveAsOf('').rejected).toBeUndefined();
    expect(resolveAsOf('').source).toBe('system_clock');
    expect(resolveAsOf('   ').source).toBe('system_clock');
  });

  it('accepts a URL value with surrounding whitespace', () => {
    expect(resolveAsOf(' 2025-04-02 ').date).toBe('2025-04-02');
  });

  it('prefers the URL over the environment', () => {
    process.env[ENV_KEY] = '2024-01-01';
    const asOf = resolveAsOf('2025-04-02');
    expect(asOf.date).toBe('2025-04-02');
    expect(asOf.source).toBe('url');
  });

  it('falls back to a pinned environment date when the URL says nothing', () => {
    process.env[ENV_KEY] = '2024-01-01';
    const asOf = resolveAsOf(undefined);
    expect(asOf.date).toBe('2024-01-01');
    expect(asOf.source).toBe('environment');
    expect(asOf.overridden).toBe(true);
  });

  it('reports an unparseable environment pin rather than booting on today', () => {
    process.env[ENV_KEY] = 'not-a-date';
    const asOf = resolveAsOf(undefined);
    expect(asOf.rejected).toEqual({ raw: 'not-a-date', from: 'environment' });
    expect(asOf.source).toBe('system_clock');
  });

  it('reads the system clock as a UTC calendar date', () => {
    const asOf = resolveAsOf(undefined);
    expect(asOf.source).toBe('system_clock');
    expect(asOf.date).toBe(asOf.today);
    expect(asOf.date).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe('withAsOf', () => {
  it('carries a URL override across a link', () => {
    const asOf = resolveAsOf('2025-04-02');
    expect(withAsOf('/matters', asOf)).toBe(`/matters?${AS_OF_PARAM}=2025-04-02`);
  });

  it('appends to a link that already has a query rather than replacing it', () => {
    // The matters list keeps its filters in the query string. A link builder
    // that overwrote them would drop the filter on every navigation.
    const asOf = resolveAsOf('2025-04-02');
    expect(withAsOf('/matters?state=live', asOf)).toBe(
      `/matters?state=live&${AS_OF_PARAM}=2025-04-02`,
    );
  });

  it('adds nothing when the date came from the clock or the environment', () => {
    // An environment pin applies to every render of that deployment already.
    // Writing it into every href would publish it as though a reader chose it.
    process.env[ENV_KEY] = '2024-01-01';
    expect(withAsOf('/matters', resolveAsOf(undefined))).toBe('/matters');
    delete process.env[ENV_KEY];
    expect(withAsOf('/matters', resolveAsOf(undefined))).toBe('/matters');
  });

  it('adds nothing when the override was rejected', () => {
    // The page is showing today. Propagating the typo would spread it.
    const asOf = resolveAsOf('2026-02-30');
    expect(withAsOf('/matters', asOf)).toBe('/matters');
  });
});
