/**
 * The roster, as a reader meets it.
 *
 * This page exists because of a failure with no other symptom. When a credential
 * lapses, `canRelease` stops releasing advice through it and downgrades the
 * output to an assessment — correctly, quietly, and with nothing on any other
 * screen changing. The client keeps receiving their own figures against the
 * cited rule and simply stops receiving a recommendation.
 *
 * So the assertions here are about statements whose absence is the defect: that
 * the downgrade is *named* rather than silently applied, that the gate's own
 * reason is reproduced verbatim, and that a credential which is perfectly live
 * but authorised in the wrong country is surfaced just as loudly.
 *
 * The reference date is pinned. Every figure below is derived from the shipped
 * record set as at that date, so the test is asserting a computation rather than
 * a snapshot of what happens to be true today.
 */

import { isoDate } from '@meridian/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RepresentativesPage from '@/app/[locale]/representatives/page';
import { COUNTS, UI, countOf, fill, pick, type Locale } from '@/lib/i18n';
import { DISCLOSURE_CLASS_LABEL, LICENCE_STANDING_LABEL } from '@/lib/labels';
import { loadRecords } from '@/lib/records';
import { representativeStandings, unrepresentedLiveMatters } from '@/lib/roster';

afterEach(cleanup);

const AS_OF = isoDate('2026-07-26');
const records = loadRecords();
const standings = representativeStandings(records, AS_OF);

async function renderRoster(locale: Locale) {
  return render(
    await RepresentativesPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve({ asOf: AS_OF }),
    }),
  );
}

describe('a downgrade is named, not silently applied', () => {
  it('raises a callout counting the matters where advice is refused', async () => {
    const downgraded = standings.reduce((n, s) => n + s.downgrading.length, 0);
    expect(downgraded).toBeGreaterThan(0);

    await renderRoster('en');
    expect(screen.getByText(pick(UI.representativesDowngradedBody, 'en'))).toBeInTheDocument();
    expect(
      screen.getByText(
        fill(UI.representativesDowngradedTitle, 'en', {
          matters: countOf('en', downgraded, COUNTS.liveMatterIs),
        }),
      ),
    ).toBeInTheDocument();
  });

  it('says what the output was downgraded *to*, on the matter row itself', async () => {
    // "Refused" alone tells a practitioner nothing about what their client
    // actually received. The class is the information.
    const { container } = await renderRoster('en');
    const expected = fill(UI.downgradedTo, 'en', {
      class: pick(DISCLOSURE_CLASS_LABEL.assessment, 'en').toLocaleLowerCase('en'),
    });
    const badges = within(container).getAllByText(expected);
    expect(badges.length).toBe(standings.reduce((n, s) => n + s.downgrading.length, 0));
  });

  it('reproduces the gate’s own reason verbatim, marked as its own language', async () => {
    // Paraphrasing it would put words in the gate's mouth on the one screen
    // that exists to report exactly what the gate said.
    const { container } = await renderRoster('es');
    const reasons = standings
      .flatMap((s) => s.downgrading)
      .map((g) => (g.toApplicant.allowed ? '' : g.toApplicant.reason))
      .filter((r) => r.length > 0);

    expect(reasons.length).toBeGreaterThan(0);
    const marked = [...container.querySelectorAll('[lang="en"]')].map((el) => el.textContent);
    for (const reason of reasons) {
      expect(marked, reason).toContain(reason);
    }
  });
});

describe('the standings that are doing damage', () => {
  it('names a lapsed credential as lapsed, with the date it expired', async () => {
    const lapsed = standings.filter((s) => s.licence.standing === 'lapsed');
    expect(lapsed.length).toBeGreaterThan(0);

    const { container } = await renderRoster('en');
    expect(container.textContent).toContain(pick(LICENCE_STANDING_LABEL.lapsed, 'en'));
    for (const standing of lapsed) {
      expect(container.textContent).toContain(standing.licence.expiresOn ?? '');
      expect(container.textContent).toContain(standing.record.displayName);
    }
  });

  it('surfaces a live credential authorised in the wrong jurisdiction', async () => {
    // The silent one: the licence is in perfect standing and every output on
    // the file is still downgraded. A roster that only checked expiry would
    // render this row as green.
    const misplaced = standings.filter(
      (s) => s.licence.standing !== 'lapsed' && s.downgrading.length > 0,
    );
    expect(misplaced.length).toBeGreaterThan(0);

    const { container } = await renderRoster('en');
    for (const standing of misplaced) {
      const section = container.querySelector(`#rep-${standing.record.credential.id}`);
      expect(section, standing.record.credential.id).not.toBeNull();
      expect(section?.textContent).toContain(pick(UI.rosterRefusedOnMarked, 'en'));
    }
  });

  it('puts the worst standing first', async () => {
    // Ordered by how much damage a standing is doing, not alphabetically.
    const { container } = await renderRoster('en');
    const rows = [...(container.querySelector('#roster')?.querySelectorAll('tbody tr') ?? [])];
    expect(rows).toHaveLength(standings.length);
    expect(rows.map((r) => r.querySelector('th')?.textContent ?? '')).toEqual(
      standings.map((s) => expect.stringContaining(s.record.credential.id)),
    );
  });

  it('does not render an unpublished expiry as a reassurance', async () => {
    // A register that publishes no expiry has told us nothing. It must not read
    // like a licence with a long time to run.
    const unpublished = standings.filter((s) => s.licence.standing === 'no_expiry_recorded');
    expect(unpublished.length).toBeGreaterThan(0);

    const { container } = await renderRoster('en');
    expect(container.textContent).toContain(pick(UI.rosterNoExpiryPublished, 'en'));
    expect(container.textContent).toContain(pick(LICENCE_STANDING_LABEL.no_expiry_recorded, 'en'));
  });
});

describe('matters with nobody accountable', () => {
  it('lists an unassigned live file and says what it costs the applicant', async () => {
    const unrepresented = unrepresentedLiveMatters(records);
    expect(unrepresented.length).toBeGreaterThan(0);

    const { container } = await renderRoster('en');
    const section = container.querySelector('#unattached');
    expect(section).not.toBeNull();
    for (const record of unrepresented) {
      expect(section?.textContent).toContain(record.reference);
    }
    expect(section?.textContent).toContain(pick(UI.unattachedDowngradeDetail, 'en'));
  });
});

describe('what is not translated', () => {
  it('renders record content in the language it was written in, in both locales', async () => {
    // A regulator's name and a matter title are what somebody typed into the
    // record. Translating either would be editing the evidence.
    const lang = records.recordLanguage;
    for (const locale of ['en', 'es'] as const) {
      const { container } = await renderRoster(locale);
      const marked = [...container.querySelectorAll(`[lang="${lang}"]`)].map((e) => e.textContent);
      expect(marked.length, locale).toBeGreaterThan(0);
      expect(marked, locale).toContain(records.representatives[0]?.regulator);
      cleanup();
    }
  });

  it('does not translate a credential name between locales', async () => {
    // RCIC is an initialism of the College's own title; *Abogado colegiado* is
    // what the Spanish standing is called. Neither changes with the page.
    const enRoster = (await renderRoster('en')).container.textContent ?? '';
    cleanup();
    const esRoster = (await renderRoster('es')).container.textContent ?? '';

    expect(enRoster).toContain('RCIC');
    expect(esRoster).toContain('RCIC');
    expect(enRoster).toContain('Abogado colegiado');
    expect(esRoster).toContain('Abogado colegiado');
  });

  it('writes the console’s own copy in the reader’s language', async () => {
    const { container } = await renderRoster('es');
    expect(container.textContent).toContain(pick(UI.rosterTitle, 'es'));
    expect(container.textContent).not.toContain(pick(UI.rosterRefusedOnMarked, 'en'));
  });
});

describe('accessibility', () => {
  it('has exactly one h1', async () => {
    await renderRoster('en');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('gives every section an accessible name', async () => {
    const { container } = await renderRoster('en');
    const sections = [...container.querySelectorAll('section')];
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy).not.toBeNull();
      expect(container.querySelector(`#${labelledBy}`)?.textContent ?? '').not.toBe('');
    }
  });

  it('does not skip a heading level between the page title and a subsection', async () => {
    const { container } = await renderRoster('en');
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
      Number(h.tagName.slice(1)),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] ?? 0).toBeLessThanOrEqual((levels[i - 1] ?? 0) + 1);
    }
  });

  it('scopes every table header', async () => {
    const { container } = await renderRoster('en');
    const headers = [...container.querySelectorAll('th')];
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      expect(['col', 'row']).toContain(header.getAttribute('scope'));
    }
  });

  it('states the refusal in words as well as in colour', async () => {
    const { container } = await renderRoster('en');
    const expected = fill(UI.downgradedTo, 'en', {
      class: pick(DISCLOSURE_CLASS_LABEL.assessment, 'en').toLocaleLowerCase('en'),
    });
    const badge = within(container).getAllByText(expected)[0]?.closest('span');
    expect(badge).not.toBeNull();
    expect(badge?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
