/**
 * The staleness badge, and the negative age.
 *
 * The as-at control makes it trivial to ask this console about a date before a
 * citation was verified. When that happens the age is genuinely negative, and
 * the honest answer is that nobody had checked the rule yet. Rendering
 * "Fresh · -479d" reads as a defect, invites somebody to clamp it, and a clamped
 * age is a page claiming a rule was verified on a date it was not.
 *
 * The band label is the other half: "Aging" alone means nothing to a reviewer
 * deciding whether to re-read a statute this week, so the number travels with it.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StalenessBadge } from '@/components/state';
import { LOCALES } from '@/lib/i18n';
import { STALENESS_LABEL } from '@/lib/labels';

afterEach(cleanup);

describe('a citation verified after the date being asked about', () => {
  it('says so rather than rendering a negative age', () => {
    const { container } = render(<StalenessBadge band="fresh" ageDays={-479} locale="en" />);
    const text = container.textContent ?? '';
    expect(text).not.toContain('-479');
    expect(text).toContain('479');
    expect(text.toLowerCase()).not.toContain(
      STALENESS_LABEL.fresh.en.toLowerCase(),
    );
  });

  it('says so in both languages', () => {
    for (const locale of LOCALES) {
      const { container } = render(<StalenessBadge band="stale" ageDays={-30} locale={locale} />);
      const text = container.textContent ?? '';
      expect(text, locale).not.toContain('-30');
      expect(text, locale).toContain('30');
      // Not the stale band either: the record is not stale on a date before
      // anybody had read it. It is unanswerable, and it says which.
      expect(text.toLowerCase(), locale).not.toContain(
        STALENESS_LABEL.stale[locale].toLowerCase(),
      );
      cleanup();
    }
  });

  it('carries an explanation a reader can hover, not just a number', () => {
    const { container } = render(<StalenessBadge band="fresh" ageDays={-1} locale="en" />);
    const title = container.querySelector('[title]')?.getAttribute('title') ?? '';
    expect(title.length).toBeGreaterThan(0);
  });

  it('treats zero as an ordinary age, not as a negative one', () => {
    // Verified today. The boundary belongs on the band side, not on the
    // "nobody had checked it" side.
    const { container } = render(<StalenessBadge band="fresh" ageDays={0} locale="en" />);
    expect((container.textContent ?? '').toLowerCase()).toContain(
      STALENESS_LABEL.fresh.en.toLowerCase(),
    );
  });
});

describe('an ordinary age', () => {
  it('says the band and the number together', () => {
    render(<StalenessBadge band="aging" ageDays={120} locale="en" />);
    const badge = screen.getByTitle(/./);
    expect(badge.textContent?.toLowerCase()).toContain(STALENESS_LABEL.aging.en.toLowerCase());
    expect(badge.textContent).toContain('120');
  });

  it('says the band in the reader’s language', () => {
    const en = render(<StalenessBadge band="stale" ageDays={600} locale="en" />).container
      .textContent;
    cleanup();
    const es = render(<StalenessBadge band="stale" ageDays={600} locale="es" />).container
      .textContent;
    expect(es).not.toBe(en);
    expect(es?.toLowerCase()).toContain(STALENESS_LABEL.stale.es.toLowerCase());
    expect(es).toContain('600');
  });

  it('is not carried by colour alone', () => {
    const { container } = render(<StalenessBadge band="stale" ageDays={600} locale="en" />);
    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph).not.toBeNull();
    expect((glyph?.textContent ?? '').trim()).not.toBe('');
  });
});
