/**
 * The two filtered screens: the matter list and the audit trail.
 *
 * A filtered view is only useful if it is *sendable* — a practitioner who finds
 * the three files blocked on a lapsed credential has to be able to paste the URL
 * to a colleague and have the colleague see the same three files, on the same
 * reference date. That is why the filters live in the query string and why the
 * form re-emits them.
 *
 * The audit trail carries a stronger obligation. A filtered audit view that does
 * not report its own suppression is a view that can be screenshotted to prove
 * something untrue, so the page has to say how many rows it removed — and the
 * sequence numbers have to stay positions in the whole trail, so that a gap in
 * the numbering reads as the filter rather than as a missing record.
 */

import { isoDate } from '@meridian/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AuditPage from '@/app/[locale]/audit/page';
import MattersPage from '@/app/[locale]/matters/page';
import { auditView, filterFromParams } from '@/lib/audit-trail';
import { applyMatterFilter, matterFilterFromParams } from '@/lib/matter-filter';
import { COUNTS, UI, countOf, fill, pick, type Locale } from '@/lib/i18n';
import { loadRecords } from '@/lib/records';

afterEach(cleanup);

const AS_OF = isoDate('2026-07-26');
const records = loadRecords();

async function renderMatters(query: Record<string, string>, locale: Locale = 'en') {
  return render(
    await MattersPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve({ asOf: AS_OF, ...query }),
    }),
  );
}

async function renderAudit(query: Record<string, string>, locale: Locale = 'en') {
  return render(
    await AuditPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve({ asOf: AS_OF, ...query }),
    }),
  );
}

describe('a filtered matter list is sendable', () => {
  it('renders exactly the matters the filter admits', async () => {
    const query = { state: 'live', rep: 'unassigned' };
    const expected = applyMatterFilter(
      records,
      matterFilterFromParams((key) => query[key as keyof typeof query]),
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(records.matters.length);

    const { container } = await renderMatters(query);
    const rows = [...(container.querySelector('#matter-list')?.querySelectorAll('tbody tr') ?? [])];
    expect(rows).toHaveLength(expected.length);
    for (const record of expected) {
      expect(container.textContent).toContain(record.reference);
    }
  });

  it('says how many of the whole caseload it is showing', async () => {
    // A filtered count with no denominator reads as the whole caseload.
    const query = { state: 'live', rep: 'unassigned' };
    const shown = applyMatterFilter(
      records,
      matterFilterFromParams((key) => query[key as keyof typeof query]),
    ).length;
    const { container } = await renderMatters(query);
    expect(container.textContent).toContain(
      fill(UI.mattersDescriptionFiltered, 'en', {
        shown: countOf('en', shown, COUNTS.matterMatches),
        total: records.matters.length,
      }),
    );
  });

  it('re-selects the reader’s filter in the form, so a resubmission keeps it', async () => {
    // A form that reset itself on every render would drop the filter the moment
    // the reader changed the date or searched again.
    await renderMatters({ state: 'live', phase: 'submission', rep: 'unassigned', q: 'MDR' });
    expect(screen.getByLabelText(pick(UI.filterState, 'en'))).toHaveValue('live');
    expect(screen.getByLabelText(pick(UI.filterPhase, 'en'))).toHaveValue('submission');
    expect(screen.getByLabelText(pick(UI.filterRepresentative, 'en'))).toHaveValue('unassigned');
    expect(screen.getByLabelText(pick(UI.filterSearch, 'en'))).toHaveValue('MDR');
  });

  it('carries the filter through the as-at form as hidden fields', async () => {
    // Changing the date must not silently clear the filter.
    const { container } = await renderMatters({ state: 'live', q: 'MDR' });
    const asOfForm = [...container.querySelectorAll('form')].find(
      (f) => f.querySelector('input[type="date"]') !== null,
    );
    const hidden = [...(asOfForm?.querySelectorAll('input[type="hidden"]') ?? [])].map((i) => [
      i.getAttribute('name'),
      i.getAttribute('value'),
    ]);
    expect(hidden).toContainEqual(['state', 'live']);
    expect(hidden).toContainEqual(['q', 'MDR']);
  });

  it('drops a filter value the domain does not define instead of showing nothing', async () => {
    // A hand-edited or stale URL naming a phase that no longer exists would
    // otherwise render an empty table indistinguishable from an empty caseload.
    const { container } = await renderMatters({ phase: 'triage' });
    const rows = [...(container.querySelector('#matter-list')?.querySelectorAll('tbody tr') ?? [])];
    expect(rows).toHaveLength(records.matters.length);
    expect(container.textContent).not.toContain(pick(UI.mattersNoneMatch, 'en'));
  });

  it('distinguishes "no matches" from "no matters" when a filter admits nothing', async () => {
    const { container } = await renderMatters({ q: 'zzzz-no-such-reference' });
    expect(container.textContent).toContain(pick(UI.mattersNoneMatch, 'en'));
    expect(container.textContent).not.toContain(pick(UI.caseloadEmptyTitle, 'en'));
    // And it offers the way back out.
    expect(within(container).getByText(pick(UI.mattersClearFilterLink, 'en'))).toBeInTheDocument();
  });

  it('has exactly one h1 and labels every filter control', async () => {
    await renderMatters({});
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const label of [
      UI.filterSearch,
      UI.filterState,
      UI.filterPhase,
      UI.filterStatus,
      UI.filterJurisdiction,
      UI.filterRepresentative,
    ]) {
      expect(screen.getByLabelText(pick(label, 'en'))).toBeInTheDocument();
    }
  });

  it('keeps the filter form a plain GET form pointed at the localised page', async () => {
    const { container } = await renderMatters({ state: 'live' }, 'es');
    const filterForm = [...container.querySelectorAll('form')].find(
      (f) => f.querySelector('#filter-state') !== null,
    );
    expect(filterForm?.getAttribute('method')).toBe('get');
    expect(filterForm?.getAttribute('action')).toBe('/es/matters');
  });
});

describe('a filtered audit view reports its own suppression', () => {
  it('says how many entries the filter removed', async () => {
    const query = { kind: 'disclosure_downgraded' };
    const view = auditView(
      records,
      filterFromParams((key) => query[key as keyof typeof query]),
      AS_OF,
    );
    expect(view.suppressed).toBeGreaterThan(0);

    const { container } = await renderAudit(query);
    expect(container.textContent).toContain(
      fill(UI.auditFilteredTitle, 'en', { shown: view.visible.length, total: view.all.length }),
    );
    expect(container.textContent).toContain(
      fill(UI.auditFilteredBody, 'en', {
        hidden: countOf('en', view.suppressed, COUNTS.entryIsHidden),
      }),
    );
  });

  it('explains that a gap in the numbering is the filter, never a missing record', async () => {
    const { container } = await renderAudit({ kind: 'disclosure_downgraded' });
    expect(pick(UI.auditFilteredBody, 'en')).toMatch(/never a missing record/);
    expect(container.textContent).toMatch(/never a missing record/);
  });

  it('raises no suppression notice when nothing is filtered', async () => {
    // A permanent "this view is filtered" banner on an unfiltered view teaches
    // a reader to ignore it on the view that is.
    const unfiltered = await renderAudit({});
    const notice = pick(UI.auditFilteredBody, 'en').split('{hidden}')[1] ?? '';
    expect(notice.length).toBeGreaterThan(0);
    expect(unfiltered.container.textContent).not.toContain(notice);
    expect(auditView(records, {}, AS_OF).suppressed).toBe(0);
    cleanup();

    const filtered = await renderAudit({ kind: 'disclosure_downgraded' });
    expect(filtered.container.textContent).toContain(notice);
  });

  it('keeps an entry’s sequence number the same with and without a filter', async () => {
    // The property that makes the trail evidence. Numbering after filtering
    // would make the same event #4 under one filter and #11 under another.
    const unfiltered = auditView(records, {}, AS_OF);
    const target = unfiltered.all.find((e) => e.entry.kind === 'disclosure_downgraded');
    expect(target).toBeDefined();

    const { container } = await renderAudit({ kind: 'disclosure_downgraded' });
    const cells = [...container.querySelectorAll('#entries tbody tr')].map(
      (row) => row.querySelector('th, td')?.textContent ?? '',
    );
    expect(cells.some((c) => c.includes(String(target?.seq)))).toBe(true);
  });

  it('reads newest first', async () => {
    const view = auditView(records, {}, AS_OF);
    const { container } = await renderAudit({});
    const first = container.querySelector('#entries tbody tr');
    expect(first?.textContent).toContain(view.visible[0]?.entry.summary ?? '');
  });

  it('rejects an impossible date bound rather than rendering an empty trail', async () => {
    // `?from=2026-02-30` goes through core's parser. Applying it silently would
    // show nothing and look like a trail with nothing in it.
    const { container } = await renderAudit({ from: '2026-02-30' });
    const rows = [...container.querySelectorAll('#entries tbody tr')];
    expect(rows).toHaveLength(auditView(records, {}, AS_OF).visible.length);
  });

  it('renders an audit summary verbatim, in the language it was written in', async () => {
    const { container } = await renderAudit({}, 'es');
    const marked = [...container.querySelectorAll(`[lang="${records.recordLanguage}"]`)].map(
      (el) => el.textContent,
    );
    expect(marked.length).toBeGreaterThan(0);
    const summaries = records.audit.map((e) => e.summary);
    expect(marked.some((text) => summaries.includes(text ?? ''))).toBe(true);
  });

  it('has exactly one h1 and labels every filter control', async () => {
    // Date inputs and search inputs have no implicit role a query can reach, so
    // this walks the actual controls — which is also the only way to notice a
    // new unlabelled one being added later.
    const { container } = await renderAudit({});
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    const controls = [
      ...container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]), select, textarea',
      ),
    ];
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      const named =
        (control.labels?.length ?? 0) > 0 ||
        control.getAttribute('aria-label') !== null ||
        control.getAttribute('aria-labelledby') !== null;
      expect(named, control.getAttribute('name') ?? control.id).toBe(true);
    }
  });
});
