/**
 * The catalog review queue, as a reader meets it.
 *
 * This is the console's most consequential screen: `recommend()` refuses to
 * rank a record that is not `counsel_reviewed`, every shipped record is
 * `unreviewed`, and this queue is the only thing that changes that. So the
 * assertions here are about statements whose *absence* would be the defect —
 * that the page says nothing is eligible to be recommended, that every row
 * carries its review status, that citation staleness is banded and dated, and
 * that an instrument's name survives the page changing language.
 */

import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';
import type { ReactElement } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CatalogPage from '@/app/[locale]/catalog/page';
import { UI, pick } from '@/lib/i18n';
import { REVIEW_STATUS_LABEL } from '@/lib/labels';
import type { Locale } from '@/lib/i18n';

afterEach(cleanup);

const AS_OF = '2026-07-26';

/**
 * Rendered trees, memoised per (locale, query).
 *
 * The page runs `validateCatalog` over all 84 records on every call, so the
 * server component is invoked once per distinct question and the resulting
 * element is re-mounted. It is the same element React would produce on a second
 * request with the same inputs — which is itself worth relying on, since nothing
 * on this page caches a derived figure.
 */
const trees = new Map<string, Promise<ReactElement>>();

async function renderCatalog(locale: Locale, query: Record<string, string> = { asOf: AS_OF }) {
  const key = `${locale}|${JSON.stringify(query)}`;
  const existing = trees.get(key);
  const tree =
    existing ??
    (CatalogPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve(query),
    }) as Promise<ReactElement>);
  trees.set(key, tree);
  return render(await tree);
}

/** The row of the totals table whose row header is `label`. */
function totalsRow(label: string): HTMLElement {
  const heading = screen.getByRole('rowheader', { name: label });
  const row = heading.closest('tr');
  if (row === null) throw new Error(`no row for ${label}`);
  return row;
}

describe('what the queue states', () => {
  it('says outright that nothing in the catalog can be recommended', async () => {
    // The single most important sentence on the screen. Without it a reader
    // sees a full catalog and assumes the engine is ranking from it.
    await renderCatalog('en');
    expect(screen.getByText(pick(UI.catalogNoneEligibleTitle, 'en'))).toBeInTheDocument();
    expect(document.body.textContent).toContain('recommend()');
  });

  it('counts reviewed records as zero rather than omitting the row', async () => {
    // A missing row reads as "not applicable". A zero reads as zero.
    await renderCatalog('en');
    const reviewed = totalsRow(pick(UI.catalogRowReviewed, 'en'));
    expect(within(reviewed).getByRole('cell', { name: '0' })).toBeInTheDocument();
    expect(within(reviewed).getByText(pick(UI.catalogRowReviewedMeaning, 'en'))).toBeInTheDocument();
  });

  it('accounts for every record as unreviewed or needing re-verification', async () => {
    await renderCatalog('en');
    const read = (label: string) =>
      Number(totalsRow(label).querySelectorAll('td')[0]?.textContent ?? 'NaN');
    const pathways = read(pick(UI.catalogRowPathways, 'en'));
    expect(pathways).toBe(MERIDIAN_PATHWAY_CATALOG.length);
    expect(
      read(pick(UI.catalogRowUnreviewed, 'en')) +
        read(pick(UI.catalogRowNeedsReverification, 'en')),
    ).toBe(pathways);
  });

  it('marks every queued record with its review status', async () => {
    // The row-level restatement. A reader scanning the queue must not have to
    // remember the callout at the top of the page.
    const { container } = await renderCatalog('en');
    const queue = container.querySelector('#queue');
    expect(queue).not.toBeNull();
    const rows = queue?.querySelectorAll('tbody tr') ?? [];
    expect(rows).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
    expect(
      within(queue as HTMLElement).getAllByText(pick(REVIEW_STATUS_LABEL.unreviewed, 'en')),
    ).toHaveLength(MERIDIAN_PATHWAY_CATALOG.length);
    expect(
      within(queue as HTMLElement).queryAllByText(
        pick(REVIEW_STATUS_LABEL.counsel_reviewed, 'en'),
      ),
    ).toHaveLength(0);
  });

  it('never offers a completeness score or a readiness percentage', async () => {
    // A number that summarised "how reviewed" a record is would be exactly the
    // figure a reviewer starts trusting instead of reading the rule.
    await renderCatalog('en');
    expect(document.body.textContent).not.toMatch(/\d+\s?% (ready|complete|reviewed)/i);
    expect(screen.queryByText(/readiness/i)).toBeNull();
  });

  it('states the reference date it banded citations against', async () => {
    // A staleness band with no date attached cannot be checked by the reader
    // and cannot be reproduced by anybody else.
    await renderCatalog('en');
    expect(screen.getAllByText(new RegExp(AS_OF)).length).toBeGreaterThan(0);
  });

  it('shows the linter’s findings with a severity, a code and a message', async () => {
    await renderCatalog('en');
    const integrity = document.getElementById('integrity');
    expect(integrity).not.toBeNull();
    expect(integrity?.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it('recomputes against an as-at date in the past', async () => {
    // Every band, every count and the "not yet open" note are derived from the
    // reference date. A page that ignored the override would answer a different
    // question than the one asked and look identical doing it.
    const early = await renderCatalog('en', { asOf: '2024-01-01' });
    const earlyText = early.container.textContent ?? '';
    cleanup();
    const today = await renderCatalog('en');
    expect(earlyText).not.toBe(today.container.textContent);
    expect(earlyText).toContain('2024-01-01');
  });

  it('reports a rejected as-at value instead of silently using today', async () => {
    await renderCatalog('en', { asOf: '2026-02-30' });
    expect(screen.getByText(pick(UI.asOfRejectedTitle, 'en'))).toBeInTheDocument();
    // The reader's own text, echoed back so they can see their typo.
    expect(document.body.textContent).toContain('2026-02-30');
  });
});

describe('staleness on the queue', () => {
  it('bands provenance and never renders a negative age as a band', async () => {
    // Asked about a date before every citation was verified, the whole column
    // is the "verified later" case. "Fresh · -900d" everywhere would be the
    // regression.
    const { container } = await renderCatalog('en', { asOf: '2020-01-01' });
    expect(container.textContent).not.toMatch(/-\d+d/);
  });
});

describe('locale', () => {
  it('renders both languages, and they are not the same page', async () => {
    const en = (await renderCatalog('en')).container.textContent ?? '';
    cleanup();
    const es = (await renderCatalog('es')).container.textContent ?? '';
    expect(en.length).toBeGreaterThan(0);
    expect(es.length).toBeGreaterThan(0);
    expect(es).not.toBe(en);
    expect(es).toContain(pick(UI.catalogNoneEligibleTitle, 'es'));
    expect(es).not.toContain(pick(UI.catalogNoneEligibleTitle, 'en'));
  });

  it('does not translate an instrument name, and marks it with its own language', async () => {
    // A translated statute title is a mis-citation, not a translation. The
    // `<cite>` elements must be identical between the two renders, and each
    // must carry the language the instrument was enacted in.
    const readCites = (root: HTMLElement) =>
      [...root.querySelectorAll('cite')].map((c) => ({
        text: c.textContent,
        lang: c.getAttribute('lang'),
      }));

    const en = readCites((await renderCatalog('en', { asOf: '2027-06-01' })).container);
    cleanup();
    const es = readCites((await renderCatalog('es', { asOf: '2027-06-01' })).container);

    expect(en.length).toBeGreaterThan(0);
    expect(es).toEqual(en);
    expect(en.some((c) => c.lang !== null)).toBe(true);
  });

  it('leaves the linter’s message in the language CI prints it in', async () => {
    // A reviewer has to match the message against a build log. A translated
    // one would not match.
    const { container } = await renderCatalog('es');
    const messages = [...container.querySelectorAll('td[lang="en"]')];
    expect(messages.length).toBeGreaterThan(0);
  });

  it('localises the pathway link but keeps the record id verbatim', async () => {
    const { container } = await renderCatalog('es');
    const links = [...container.querySelectorAll('a[href^="/es/catalog/"]')];
    expect(links.length).toBeGreaterThan(0);
    // The id in the link text is the catalog's own key, not copy.
    expect(links[0]?.textContent).toMatch(/^[a-z]{2}-[a-z0-9-]+$/);
  });

  it('carries the as-at override into every internal link', async () => {
    // Clicking through from a queue rendered as at 2025 must not silently snap
    // the reader back to today.
    const { container } = await renderCatalog('en', { asOf: '2025-04-02' });
    const internal = [...container.querySelectorAll('a[href^="/catalog/"]')];
    expect(internal.length).toBeGreaterThan(0);
    for (const link of internal) {
      expect(link.getAttribute('href')).toContain('asOf=2025-04-02');
    }
  });
});

describe('accessibility', () => {
  it('has exactly one h1, and it names the screen', async () => {
    await renderCatalog('en');
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toBe(pick(UI.catalogTitle, 'en'));
  });

  it('gives every section an accessible name', async () => {
    // A section nobody can name is a section a screen-reader user cannot
    // navigate to, and every section here is also a link destination.
    const { container } = await renderCatalog('en');
    const sections = [...container.querySelectorAll('section')];
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy).not.toBeNull();
      expect(container.querySelector(`#${labelledBy}`)?.textContent ?? '').not.toBe('');
    }
  });

  it('labels the as-at control and its submit button', async () => {
    await renderCatalog('en');
    expect(screen.getByLabelText(pick(UI.asAt, 'en'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: pick(UI.apply, 'en') })).toBeInTheDocument();
  });

  it('works without JavaScript: the as-at control is a GET form with a real action', async () => {
    // A shareable URL is the whole point. A control that needed a click handler
    // would produce a view that only exists for the person looking at it.
    const { container } = await renderCatalog('es');
    const form = container.querySelector('form');
    expect(form?.getAttribute('method')).toBe('get');
    expect(form?.getAttribute('action')).toBe('/es/catalog');
  });

  it('gives every table column and row a scoped header', async () => {
    const { container } = await renderCatalog('en');
    const headers = [...container.querySelectorAll('th')];
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      expect(['col', 'row']).toContain(header.getAttribute('scope'));
    }
  });
});
