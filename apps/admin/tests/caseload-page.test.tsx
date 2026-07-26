/**
 * The caseload overview, as a reader meets it.
 *
 * The brief for this screen was "not a dashboard of vanity tiles", and the two
 * things a test can usefully hold it to are the two ways such a screen goes
 * wrong: it stops naming the failure that has no other symptom, or it dresses an
 * empty caseload up as a demo.
 *
 * The reference date is pinned, so every figure asserted below is a computation
 * over the shipped record set rather than whatever happens to be true today.
 */

import { isoDate } from '@meridian/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CaseloadPage from '@/app/[locale]/page';
import { blockers, deadlines, distribution, timeCritical } from '@/lib/caseload';
import { COUNTS, UI, countOf, fill, pick, type Locale } from '@/lib/i18n';
import { loadRecords } from '@/lib/records';
import { representativeStandings } from '@/lib/roster';

afterEach(() => {
  cleanup();
  delete process.env.MERIDIAN_ADMIN_DATASET;
});

const AS_OF = isoDate('2026-07-26');

async function renderCaseload(locale: Locale) {
  return render(
    await CaseloadPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve({ asOf: AS_OF }),
    }),
  );
}

describe('the failure with no other symptom', () => {
  it('names each lapsed credential, its expiry date, and what it is gating', () => {
    // Everything the callout claims is derived, so the test derives it too. A
    // hard-coded name would pass against a page that had stopped computing.
    const records = loadRecords();
    const lapsed = representativeStandings(records, AS_OF).filter(
      (s) => s.licence.standing === 'lapsed' && s.liveGating.length > 0,
    );
    expect(lapsed.length).toBeGreaterThan(0);
    return renderCaseload('en').then(({ container }) => {
      expect(container.textContent).toContain(
        fill(UI.caseloadLapsedTitle, 'en', {
          credentials: countOf('en', lapsed.length, COUNTS.credentialHas),
        }),
      );
      for (const standing of lapsed) {
        expect(container.textContent).toContain(standing.record.displayName);
        expect(container.textContent).toContain(standing.licence.expiresOn ?? '');
        expect(container.textContent).toContain(
          countOf('en', standing.liveGating.length, COUNTS.liveMatter),
        );
      }
    });
  });

  it('explains that a lapse raises no error anywhere', async () => {
    // The sentence a practitioner needs in order to believe the callout at all.
    await renderCaseload('en');
    expect(pick(UI.caseloadLapsedBodyBefore, 'en')).toMatch(/raises no error anywhere/);
    expect(document.body.textContent).toContain(pick(UI.caseloadLapsedBodyBefore, 'en'));
  });

  it('lists each downgraded matter with the gate’s own reason, marked as English', async () => {
    const records = loadRecords();
    const downgraded = representativeStandings(records, AS_OF).flatMap((s) => s.downgrading);
    expect(downgraded.length).toBeGreaterThan(0);

    const { container } = await renderCaseload('es');
    const marked = [...container.querySelectorAll('[lang="en"]')].map((el) => el.textContent);
    for (const gated of downgraded) {
      expect(container.textContent).toContain(gated.reference);
      if (!gated.toApplicant.allowed) expect(marked).toContain(gated.toApplicant.reason);
    }
  });

  it('names the matters with nobody accountable', async () => {
    await renderCaseload('en');
    expect(screen.getByText(pick(UI.caseloadUnaccountableTitle, 'en'))).toBeInTheDocument();
  });
});

describe('the numbers are derived, not stored', () => {
  it('agrees with the derivations the page is rendered from', () => {
    const records = loadRecords();
    const standings = representativeStandings(records, AS_OF);
    const dist = distribution(records.matters);
    const urgent = timeCritical(deadlines(records, standings, AS_OF, 'en'));
    const allBlockers = blockers(records, standings, AS_OF, 'en');

    return renderCaseload('en').then(({ container }) => {
      expect(container.textContent).toContain(
        fill(UI.caseloadDescription, 'en', {
          matters: countOf('en', dist.total, COUNTS.matter),
          live: dist.live,
          date: AS_OF,
        }),
      );
      const critical = container.querySelector('#time-critical');
      expect(critical?.textContent).toContain(String(urgent.length));
      expect(allBlockers.length).toBeGreaterThan(0);
      const blocked = container.querySelector('#blocked');
      expect(blocked).not.toBeNull();
      for (const blocker of allBlockers.slice(0, 3)) {
        expect(blocked?.textContent, blocker.code).toContain(blocker.matterReference);
      }
    });
  });

  it('recomputes every relative day against the reference date', async () => {
    // The "days remaining" figures are the ones a practitioner acts on, and
    // they are the first thing a cached total would get wrong.
    const { container } = await renderCaseload('en');
    expect(container.textContent).toContain(AS_OF);
    expect(container.textContent).not.toMatch(/NaN|undefined|Invalid Date/);
  });
});

describe('an empty caseload', () => {
  it('renders as empty rather than as a broken demo', async () => {
    // A firm on its first day has no matters. No sample rows, no skeleton, no
    // "0 of 0" tiles pretending there is a pipeline — a console that dresses an
    // empty caseload up teaches its user to distrust every other number on it.
    process.env.MERIDIAN_ADMIN_DATASET = 'empty';
    const { container } = await renderCaseload('en');
    expect(screen.getByText(pick(UI.caseloadEmptyTitle, 'en'))).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(container.textContent).not.toContain(pick(UI.caseloadUnaccountableTitle, 'en'));
  });

  it('points an empty firm at the work that comes before a caseload', async () => {
    process.env.MERIDIAN_ADMIN_DATASET = 'empty';
    const { container } = await renderCaseload('es');
    const links = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toContain(`/es/catalog?asOf=${AS_OF}`);
    expect(links).toContain(`/es/integrations?asOf=${AS_OF}`);
  });
});

describe('accessibility', () => {
  it('has exactly one h1', async () => {
    await renderCaseload('en');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('gives every section an accessible name', async () => {
    const { container } = await renderCaseload('en');
    const sections = [...container.querySelectorAll('section')];
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy).not.toBeNull();
      expect(container.querySelector(`#${labelledBy}`)?.textContent ?? '').not.toBe('');
    }
  });

  it('does not skip a heading level', async () => {
    const { container } = await renderCaseload('en');
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
      Number(h.tagName.slice(1)),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] ?? 0).toBeLessThanOrEqual((levels[i - 1] ?? 0) + 1);
    }
  });

  it('scopes every table header and captions the deadline table', async () => {
    const { container } = await renderCaseload('en');
    for (const header of container.querySelectorAll('th')) {
      expect(header.getAttribute('scope')).toMatch(/^(col|row)$/);
    }
    // The caption says what the table is a list of and as at when — a table of
    // dates with no stated threshold cannot be checked by the reader.
    const caption = container.querySelector('#time-critical caption');
    expect(caption?.textContent).toContain(AS_OF);
  });

  it('gives a proportional bar a full accessible sentence, not "3 of 12" in English', async () => {
    // The digits beside the bar are `aria-hidden`, so the label is the only
    // thing a screen reader gets. A hard-coded English connective would leave a
    // Spanish reader with half a sentence in the wrong language.
    const { container } = await renderCaseload('es');
    const bars = [...container.querySelectorAll('[role="img"]')];
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      const label = bar.getAttribute('aria-label') ?? '';
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/\bof\b/);
    }
  });

  it('states a deadline’s urgency in words as well as in colour', async () => {
    const { container } = await renderCaseload('en');
    const critical = container.querySelector('#time-critical');
    const badges = [...(critical?.querySelectorAll('tbody td span') ?? [])].filter(
      (span) => span.querySelector('[aria-hidden="true"]') !== null,
    );
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      const clone = badge.cloneNode(true) as HTMLElement;
      for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
      expect((clone.textContent ?? '').trim()).not.toBe('');
    }
  });
});

describe('locale', () => {
  it('renders both languages and marks record content as record content', async () => {
    const records = loadRecords();
    const en = (await renderCaseload('en')).container.textContent ?? '';
    cleanup();
    const { container } = await renderCaseload('es');
    expect(container.textContent).not.toBe(en);
    expect(container.textContent).toContain(pick(UI.caseloadTimeCriticalTitle, 'es'));

    const marked = [...container.querySelectorAll(`[lang="${records.recordLanguage}"]`)];
    expect(marked.length).toBeGreaterThan(0);
    const titles = marked.map((el) => el.textContent);
    expect(titles.some((t) => records.matters.some((m) => m.title === t))).toBe(true);
  });

  it('keeps the as-at override on every link that navigates the console', async () => {
    // Dropping it would silently snap a caseload rendered as at another date
    // back to today on the first click.
    const { container } = await renderCaseload('en');
    const internal = [...container.querySelectorAll('a[href^="/"]')].filter(
      (a) => a.closest('form') === null,
    );
    expect(internal.length).toBeGreaterThan(0);
    for (const link of internal) {
      expect(link.getAttribute('href')).toContain(`asOf=${AS_OF}`);
    }
  });

  it('offers one link that deliberately drops the override: back to today', async () => {
    // The only escape from a pinned date. It has to be the *only* one, which is
    // why the test above excludes it explicitly rather than loosening.
    const { container } = await renderCaseload('en');
    const reset = [...(container.querySelector('form')?.querySelectorAll('a') ?? [])];
    expect(reset).toHaveLength(1);
    expect(reset[0]?.getAttribute('href')).toBe('/');
    expect(reset[0]?.textContent).toBe(pick(UI.today, 'en'));
  });

  it('labels the as-at control in the reader’s language', async () => {
    await renderCaseload('es');
    expect(screen.getByLabelText(pick(UI.asAt, 'es'))).toBeInTheDocument();
    const form = document.querySelector('form');
    expect(form?.getAttribute('action')).toBe('/es');
  });
});

describe('what the page does not say', () => {
  it('offers no ranking of which matter matters most', async () => {
    // Ordering a list of options by how urgent the software thinks they are is
    // a ranking, and ranking is the act the advice boundary reserves. The
    // time-critical view is a filter on a published threshold instead.
    const { container } = await renderCaseload('en');
    expect(container.textContent).not.toMatch(/most urgent|top priority|recommended action/i);
    expect(container.textContent).toContain(
      fill(UI.caseloadTimeCriticalNote, 'en', { critical: 14, approaching: 45 }),
    );
  });
});
