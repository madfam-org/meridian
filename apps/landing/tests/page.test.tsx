/**
 * What the page states.
 *
 * The assertions here are chosen by asking what would be a *defect if it were
 * absent*, not by walking the DOM. A test that a heading exists is worth
 * nothing; a test that the coverage boundary still renders, that a withheld
 * output is named rather than silently downgraded, that an unreviewed pathway
 * says it is unreviewed, and that a discretionary rule is marked discretionary
 * — those are the four sentences that make this product safe to put in front of
 * a person who is deciding whether they have overstayed.
 *
 * Everything the page prints is counted from the shipped catalog at build time,
 * so the expectations below are derived from the same modules rather than typed
 * out. A test that hard-coded "84 pathways" would go stale the day a pathway is
 * added and would be silenced by editing a number.
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '@/app/[locale]/page';
import { CATALOG, NOTHING_IS_COUNSEL_REVIEWED } from '@/lib/catalog-facts';
import {
  ADJACENT_READERS,
  CLINIC_BODY,
  CLINIC_TITLE,
  DOORS,
  FREE_CLASSES_ARE_THE_UNREGULATED_ONES,
  releaseOf,
} from '@/lib/audiences';
import {
  COVERAGE_NOT_EXHAUSTIVE,
  COVERAGE_OUT_OF_SCOPE,
  COVERAGE_WHERE_TO_ASK,
  JURISDICTIONS_WITHOUT_REGISTER,
  UNCOVERED_ROUTES,
} from '@/lib/coverage';
import {
  MISSING_CRITERION_ID,
  WORKED_CITATION,
  WORKED_CRITERIA,
  WORKED_NOTES,
  WORKED_REPORT,
  WORKED_TALLY,
} from '@/lib/worked-example';
import { PORTAL_URL } from '@/lib/links';

async function renderPage(locale: 'en' | 'es' = 'en') {
  const tree = await HomePage({ params: Promise.resolve({ locale }) });
  const utils = render(tree);
  return { ...utils, text: utils.container.textContent ?? '' };
}

describe('the coverage boundary', () => {
  it('names every uncovered route the register still holds', () => {
    // The register retires an entry once the catalog answers it, so this list
    // can only shrink on its own. What it must never do is stop rendering.
    expect(UNCOVERED_ROUTES.length).toBeGreaterThan(0);
    return renderPage().then(({ text }) => {
      for (const route of UNCOVERED_ROUTES) {
        expect(text, route.key).toContain(route.name.en);
      }
    });
  });

  it('says the list is not an inventory of everything missing', async () => {
    const { text } = await renderPage();
    expect(text).toContain(COVERAGE_NOT_EXHAUSTIVE.en);
  });

  it('marks a jurisdiction with no register entry as unknown, not as covered', async () => {
    // An empty gap list because every gap closed and an empty gap list because
    // nobody wrote one mean opposite things to a reader.
    expect(JURISDICTIONS_WITHOUT_REGISTER.length).toBeGreaterThan(0);
    const { text } = await renderPage();
    for (const code of JURISDICTIONS_WITHOUT_REGISTER) {
      expect(text).toContain(code);
    }
    expect(text).toContain('as unknown rather than complete');
  });

  it('says protection claims are permanently out of scope, not merely unbuilt', async () => {
    const { text } = await renderPage();
    expect(text).toContain(COVERAGE_OUT_OF_SCOPE.en);
    expect(text).toContain('Meridian will not encode them');
  });

  it('sends a reader whose route is missing to a person who is accountable', async () => {
    const { text } = await renderPage();
    expect(text).toContain(COVERAGE_WHERE_TO_ASK.en);
    expect(text).toContain('names no firm and takes nothing from anybody for a referral');
  });

  it('places the boundary after the flattering corridor counts, not at the bottom', async () => {
    const { container } = await renderPage();
    const corridors = container.querySelector('#corridors');
    const coverage = container.querySelector('#coverage');
    const boundary = container.querySelector('#advice-boundary');
    expect(corridors).not.toBeNull();
    // DOCUMENT_POSITION_FOLLOWING: coverage comes after corridors, and the
    // advice boundary is in the middle of the page rather than in a footer.
    expect(corridors?.compareDocumentPosition(coverage as Node) ?? 0 & 4).toBeTruthy();
    expect(coverage?.compareDocumentPosition(boundary as Node) ?? 0 & 4).toBeTruthy();
  });
});

describe('the release gate is run, not described', () => {
  it('reports the same verdicts canRelease returned at build time', async () => {
    const { text } = await renderPage();
    expect(releaseOf('information').released).toBe(true);
    expect(releaseOf('assessment').released).toBe(true);
    expect(releaseOf('advice').released).toBe(false);
    // Two released, one withheld — and the withheld one is named as withheld
    // rather than left as a gap in the table.
    expect(screen.getAllByText('Released')).toHaveLength(2);
    expect(screen.getAllByText('Withheld, and named')).toHaveLength(1);
    expect(text).toContain('Free, forever');
  });

  it('prints the gate’s own reason for withholding, verbatim and marked English', async () => {
    const reason = releaseOf('advice').reason;
    expect(reason).not.toBeNull();
    const { container, text } = await renderPage();
    expect(text).toContain(reason as string);

    // The reason is the engine's English, not translated copy, so it carries
    // its own language even on the Spanish document.
    const marked = Array.from(container.querySelectorAll('[lang="en"]')).some((el) =>
      (el.textContent ?? '').includes(reason as string),
    );
    expect(marked).toBe(true);
  });

  it('names the downgrade rather than applying it silently', async () => {
    const decision = releaseOf('advice');
    expect(decision.downgradeTo).toBe('assessment');
    const { text } = await renderPage();
    // The reason itself says what the reader gets instead of the recommendation.
    expect(decision.reason).toContain('limited to the applicant');
    expect(text).toContain('you are told which output was withheld, the reason the gate returned');
    expect(text).toContain('Classification can move down; it never moves up');
  });

  it('would say so, loudly, if the gate ever released advice to an unrepresented reader', async () => {
    expect(FREE_CLASSES_ARE_THE_UNREGULATED_ONES).toBe(true);
    const { text } = await renderPage();
    expect(text).not.toContain('WARNING: the release gate is no longer withholding advice');
    expect(text).toContain('The fourth column is not a description of the gate. It is the gate');
  });

  it('renders the same verdicts on the Spanish document', async () => {
    const { text } = await renderPage('es');
    expect(screen.getAllByText('Se entrega')).toHaveLength(2);
    expect(screen.getAllByText('Se retiene, y se indica')).toHaveLength(1);
    expect(text).toContain(releaseOf('advice').reason as string);
  });
});

describe('nothing is counsel-reviewed, and the page says so', () => {
  it('states the unreviewed count as the counted figure', async () => {
    // If a pathway is ever signed off this assertion fails — correctly. The
    // page's claims change at the same moment, and both must be re-read
    // together rather than one drifting behind the other.
    expect(NOTHING_IS_COUNSEL_REVIEWED).toBe(true);
    expect(CATALOG.counselReviewed).toBe(0);

    const { text } = await renderPage();
    expect(text).toContain('No pathway in this catalog has been reviewed by counsel');
    expect(text).toContain(
      `${CATALOG.counselReviewed} of ${CATALOG.pathways} pathways carry a licensed sign-off`,
    );
    expect(text).toContain(`${CATALOG.counselReviewed} / ${CATALOG.pathways}`);
  });

  it('explains that an unreviewed pathway may be shown but never recommended', async () => {
    const { text } = await renderPage();
    expect(text).toContain('may not be built into a recommendation');
    expect(text).toContain('the ranking function excludes it and attaches the reason');
    expect(text).toContain('sign-off is a workflow step with a named licensed human attached');
  });

  it('warns the reader before the rest of the page, not after it', async () => {
    const { container, text } = await renderPage();
    expect(text).toContain('Before you believe anything else on this page');
    const callout = screen.getByRole('heading', {
      name: 'Before you believe anything else on this page',
    });
    const doors = container.querySelector('#doors');
    expect(callout.compareDocumentPosition(doors as Node) & 4).toBeTruthy();
  });

  it('prints every catalog figure as the counted one', async () => {
    const { text } = await renderPage();
    expect(text).toContain(`${CATALOG.open} / ${CATALOG.pathways}`);
    expect(text).toContain(`${CATALOG.agingCitations} / ${CATALOG.citations}`);
    expect(text).toContain(
      `${CATALOG.citationsWithUrl} carry a link we are confident is canonical`,
    );
    expect(text).toContain(CATALOG.asOf);
    for (const jurisdiction of CATALOG.jurisdictions) {
      expect(text, jurisdiction.code).toContain(jurisdiction.code);
    }
  });
});

describe('the worked example, computed rather than written', () => {
  it('renders the verdict the engine actually returned', async () => {
    expect(WORKED_REPORT.verdict).toBe('indeterminate');
    const { text } = await renderPage();
    expect(text).toContain('Cannot be decided');
    expect(text).toContain(
      `${WORKED_TALLY.met} of ${WORKED_TALLY.total} criteria met, ${WORKED_TALLY.unmet} unmet, ${WORKED_TALLY.unknown} not recorded.`,
    );
  });

  it('shows every criterion, in catalog order, with its own id', async () => {
    const { text } = await renderPage();
    for (const criterion of WORKED_CRITERIA) {
      expect(text, criterion.id).toContain(criterion.id);
      expect(text, criterion.id).toContain(criterion.label.en);
    }
    // Never sorted by outcome — a sort order is a recommendation.
    expect(text).toContain('never sorted by outcome, because a sort order is a recommendation');
  });

  it('marks the one fact that is not on file as not recorded, not as unmet', async () => {
    const missing = WORKED_CRITERIA.find((c) => c.id === MISSING_CRITERION_ID);
    expect(missing?.status).toBe('unknown');
    const { text } = await renderPage();
    expect(text).toContain('Not recorded');
    expect(text).toContain('NOT RECORDED: whether the Mexican nationality is held by origin');
    expect(text).toContain('It does not assume the answer, does not weight it, does not guess');
  });

  it('renders the engine’s own trace verbatim, marked as English', async () => {
    const { container } = await renderPage('es');
    const marked = Array.from(container.querySelectorAll('[lang="en"]')).map(
      (el) => el.textContent ?? '',
    );
    for (const criterion of WORKED_CRITERIA) {
      expect(marked.some((t) => t.includes(criterion.detail)), criterion.id).toBe(true);
    }
  });

  it('keeps every caveat the engine attached to its own answer', async () => {
    // A discretionary rule must say it is discretionary wherever it is applied.
    // Two of these notes carry the same code and the same citation id, so a
    // list that de-duplicated by either would drop a caveat on a legal rule.
    expect(WORKED_NOTES.length).toBeGreaterThan(0);
    expect(WORKED_NOTES.some((n) => n.code === 'discretionary_source')).toBe(true);
    expect(WORKED_NOTES.some((n) => n.code === 'unreviewed_rule')).toBe(true);

    const { container, text } = await renderPage();
    for (const note of WORKED_NOTES) {
      expect(text, note.code).toContain(note.text);
      expect(text, note.code).toContain(note.code);
    }

    const heading = screen.getByRole('heading', {
      name: 'And the caveats the engine attached to its own answer',
    });
    const list = heading.closest('aside')?.querySelector('ul');
    expect(list?.children.length).toBe(WORKED_NOTES.length);
    expect(container.textContent).toContain('nobody can suppress them at render time');
  });

  it('shows the citation behind the undecidable criterion, with its verification date', async () => {
    expect(WORKED_CITATION).not.toBeNull();
    const citation = WORKED_CITATION;
    if (citation === null) return;
    const { text } = await renderPage();
    expect(text).toContain(citation.kind);
    expect(text).toContain(citation.jurisdiction);
    expect(text).toContain(citation.verifiedOn);
    if (citation.url !== undefined) expect(text).toContain(citation.url);
  });

  it('names what is missing from the output and why', async () => {
    const { text } = await renderPage();
    expect(text).toContain('no estimate of the chance an application succeeds');
    expect(text).toContain('a recommendation is the regulated act');
  });
});

describe('the three doors', () => {
  function doorCard(who: string): HTMLElement {
    const heading = screen.getByRole('heading', { level: 3, name: who });
    const card = heading.parentElement;
    if (card === null) throw new Error(`no card around "${who}"`);
    return card;
  }

  it('badges every unbuilt door as unbuilt, in the same breath as the offer', async () => {
    const unbuilt = DOORS.filter((d) => d.cta === null);
    expect(unbuilt.length).toBe(2);

    await renderPage();
    for (const door of unbuilt) {
      const card = doorCard(door.who.en);
      expect(within(card).getByText('Not built yet'), door.id).toBeInTheDocument();
      expect(card.textContent, door.id).toContain('NOT BUILT YET');
    }
  });

  it('offers no call to action on a door that cannot be bought', async () => {
    await renderPage();
    for (const door of DOORS.filter((d) => d.cta === null)) {
      // A link on a card describing an unbuilt subscription is the oldest way
      // of technically disclosing something.
      expect(within(doorCard(door.who.en)).queryAllByRole('link'), door.id).toHaveLength(0);
    }
  });

  it('sends the free door at the working tools', async () => {
    const working = DOORS.filter((d) => d.cta !== null);
    expect(working).toHaveLength(1);
    await renderPage();
    const card = doorCard(working[0]?.who.en ?? '');
    expect(within(card).getByText('Working today')).toBeInTheDocument();
    expect(within(card).getByRole('link')).toHaveAttribute('href', `${PORTAL_URL}/tools`);
  });

  it('puts the availability badge before the price on every card', async () => {
    const { container } = await renderPage();
    for (const door of DOORS) {
      const card = doorCard(door.who.en);
      const availability = within(card).getByText(door.availability.en).parentElement as HTMLElement;
      const price = within(card).getByText(door.price.en);
      expect(availability.compareDocumentPosition(price) & 4, door.id).toBeTruthy();
    }
    expect(container).toBeTruthy();
  });

  it('names the adjacent readers without turning them into a product line', async () => {
    const { text } = await renderPage();
    for (const reader of ADJACENT_READERS) {
      expect(text).toContain(reader.title.en);
      expect(text).toContain(reader.body.en);
    }
  });

  it('records the clinic commitment before any price exists', async () => {
    const { text } = await renderPage();
    expect(text).toContain(CLINIC_TITLE.en);
    for (const paragraph of CLINIC_BODY) expect(text).toContain(paragraph.en);
    expect(text).toContain('so that it predates the pricing rather than being retrofitted to it');
  });
});

describe('what the page must never contain', () => {
  it('prints no price, because none is set', async () => {
    const { text } = await renderPage();
    expect(text).not.toMatch(/[$€£]\s?\d/);
    expect(text).not.toMatch(/\b\d+(?:[.,]\d+)?\s?(?:USD|EUR|MXN|CAD)\b/);
    expect(text).toContain('No price is set yet');
  });

  it('prints no percentage, because a chance of success would be fabricated', async () => {
    const { text } = await renderPage();
    expect(text).not.toMatch(/\d\s?%/);
    expect(text).toContain('Any estimate of the chance an application will succeed');
  });

  it('claims no adoption, no customers and no testimonials', async () => {
    const { text } = await renderPage();
    for (const tell of [
      /\btrusted by\b/i,
      /\btestimonial/i,
      /\bsuccess rate\b/i,
      /\bcase stud(?:y|ies)\b/i,
      /\b\d[\d,.]*\+?\s+(?:customers|clients|users|companies|firms|installs|downloads)\b/i,
      /\b\d(?:\.\d)?\s*(?:★|stars?)\b/i,
      /\baward[- ]winning\b/i,
      /\bindustry[- ]leading\b/i,
    ]) {
      expect(text, String(tell)).not.toMatch(tell);
    }
  });

  it('claims nothing about reachability, which it has no way to observe', async () => {
    const { text } = await renderPage();
    // A statement that falsifies itself the moment it is read from a host that
    // is answering.
    expect(text).not.toContain('Nothing is deployed');
    expect(text).not.toContain('currently unavailable');
  });

  it('carries no personal data in the demonstration', async () => {
    const { text } = await renderPage();
    expect(text).toContain('No name, no document number, no address');
    // No email address, no telephone number, no document-shaped identifier.
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
    expect(text).not.toMatch(/\b[A-Z]{2}\d{6,9}\b/);
  });
});

describe('accessibility invariants that regress silently', () => {
  it('has exactly one h1', async () => {
    await renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('never skips a heading level', async () => {
    const { container } = await renderPage();
    const levels = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) =>
      Number(h.tagName.slice(1)),
    );
    expect(levels.length).toBeGreaterThan(10);
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      const previous = levels[i - 1] as number;
      const current = levels[i] as number;
      // Going back up any distance is fine; going down more than one step tells
      // a screen-reader user there is a missing level between them.
      expect(current - previous, `${previous} → ${current} at index ${i}`).toBeLessThanOrEqual(1);
    }
  });

  it('gives every section a heading that names it', async () => {
    const { container } = await renderPage();
    const sections = container.querySelectorAll('section[aria-labelledby]');
    expect(sections.length).toBeGreaterThan(5);
    for (const section of sections) {
      const id = section.getAttribute('aria-labelledby') ?? '';
      const heading = document.getElementById(id);
      expect(heading, id).not.toBeNull();
      expect(heading?.textContent?.trim().length, id).toBeGreaterThan(0);
    }
  });

  it('lands every in-page link on an element that exists', async () => {
    // A dead fragment link is silent: the page simply does not move.
    const { container } = await renderPage();
    const fragments = Array.from(container.querySelectorAll('a[href^="#"]')).map((a) =>
      (a.getAttribute('href') ?? '').slice(1),
    );
    expect(fragments.length).toBeGreaterThan(0);
    for (const fragment of fragments) {
      expect(document.getElementById(fragment), `#${fragment}`).not.toBeNull();
    }
  });

  it('opens a new tab only with a rel that severs the reference back', async () => {
    const { container } = await renderPage();
    const external = container.querySelectorAll('a[target="_blank"]');
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.getAttribute('rel') ?? '', link.getAttribute('href') ?? '').toContain('noopener');
    }
  });

  it('gives every table a caption saying what it holds', async () => {
    const { container } = await renderPage();
    const tables = container.querySelectorAll('table');
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      expect(table.querySelector('caption')?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      // Row and column headers, so a cell can be announced with its meaning.
      expect(table.querySelectorAll('th[scope="col"]').length).toBeGreaterThan(0);
      expect(table.querySelectorAll('th[scope="row"]').length).toBeGreaterThan(0);
    }
  });

  it('never carries meaning in colour alone: every status badge has a word', async () => {
    const { container } = await renderPage();
    const glyphs = container.querySelectorAll('[aria-hidden="true"]');
    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) {
      // The glyph is decorative; the text beside it inside the same badge is
      // what carries the status.
      const parentText = glyph.parentElement?.textContent ?? '';
      const withoutGlyph = parentText.replace(glyph.textContent ?? '', '').trim();
      expect(withoutGlyph.length, parentText).toBeGreaterThan(0);
    }
  });

  it('gives every link discernible text', async () => {
    const { container } = await renderPage();
    for (const link of container.querySelectorAll('a')) {
      const name = (link.textContent ?? '').trim() || (link.getAttribute('aria-label') ?? '');
      expect(name.length, link.getAttribute('href') ?? '').toBeGreaterThan(0);
    }
  });
});
