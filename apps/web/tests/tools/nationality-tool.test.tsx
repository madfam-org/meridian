/**
 * `/tools/nationality-es`, end to end through what a reader actually sees.
 *
 * `tests/lib/nationality.test.ts` proves the arithmetic. This file proves the
 * page says it — which is a separate failure mode, and the one that reaches a
 * person. A tool that computes `indeterminate` correctly and renders it as a
 * green tick has done more harm than one that crashed.
 *
 * The three cases driven below are the ones the tool exists to tell apart, and
 * each is loaded through the button a reader would press rather than by calling
 * the view model, so the wiring between form, engine and panel is under test
 * too.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { NationalityTool } from '@/app/[locale]/tools/nationality-es/NationalityTool';
import { FIELD, RESULT_ID } from '@/lib/tools/nationality';
import { uncoveredIn } from '@/lib/coverage';

import { KNOWN_ADVICE, assertScreenCatchesAdvice, expectNoAdvice } from '../support/advice';
import { watchEgress } from '../support/egress';

const REDUCED_HEADING = 'Spanish nationality by residence — two-year reduced period';
const GENERAL_HEADING = 'Spanish nationality by residence — general ten-year period';

const MEETS = 'Meets the encoded criteria';
const BLOCKED = 'Blocked on the recorded facts';
const UNDECIDABLE = 'Not decidable on the recorded facts';
const UNREVIEWED = 'Not reviewed by counsel';

const EXAMPLE = {
  byOrigin: 'Two years, nationality held by origin',
  dualNational: 'The same file, residing under a second nationality',
  unstated: 'The same file, with the acquisition mode unstated',
} as const;

/** Load one of the invented situations and press the button. */
async function runExample(label: string): Promise<HTMLElement> {
  const user = userEvent.setup();
  render(<NationalityTool locale="en" />);
  await user.click(screen.getByRole('button', { name: label }));
  await user.click(screen.getByRole('button', { name: 'Measure my answers' }));
  return screen.getByRole('region', { name: /measured against both regimes/i });
}

/** The block a single regime's verdict is rendered in. */
function routeBlock(panel: HTMLElement, heading: string): HTMLElement {
  const block = within(panel).getByRole('heading', { name: heading }).closest('section');
  if (block === null) throw new Error(`no result block for ${heading}`);
  return block;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// The three headline cases, as rendered
// ---------------------------------------------------------------------------

describe('the three cases, on screen', () => {
  it('shows a Mexican national by origin with two years as meeting the reduced criteria', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);
    const reduced = routeBlock(panel, REDUCED_HEADING);

    expect(within(reduced).getByText(MEETS)).toBeInTheDocument();
    expect(within(reduced).queryByText(UNDECIDABLE)).toBeNull();
  });

  it('does not extend the reduction to the same person residing under an Italian passport', async () => {
    const panel = await runExample(EXAMPLE.dualNational);
    const reduced = routeBlock(panel, REDUCED_HEADING);

    expect(within(reduced).queryByText(MEETS)).toBeNull();
    expect(within(reduced).getByText(BLOCKED)).toBeInTheDocument();
  });

  it('explains that refusal by the nationality the residence is held under, and marks it as practice', async () => {
    // The reader is entitled to know the reduction failed on registry practice
    // rather than on a line of the Civil Code, because the two call for
    // different next steps.
    const panel = await runExample(EXAMPLE.dualNational);

    expect(
      within(panel).getByRole('heading', {
        name: /Which nationality the residence is held under changes the answer/,
      }),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/administrative practice recorded in the catalog/)).toBeInTheDocument();
  });

  it('renders an unstated acquisition mode as its own state, never as a favourable guess', async () => {
    const panel = await runExample(EXAMPLE.unstated);
    const reduced = routeBlock(panel, REDUCED_HEADING);

    expect(within(reduced).getByText(UNDECIDABLE)).toBeInTheDocument();
    expect(within(reduced).queryByText(MEETS)).toBeNull();
    // And the criterion itself reads "Not recorded", not "Unmet".
    expect(within(reduced).getAllByText('Not recorded').length).toBeGreaterThan(0);
  });

  it('says in words why an unstated acquisition mode holds the route open', async () => {
    const panel = await runExample(EXAMPLE.unstated);

    expect(
      within(panel).getByRole('heading', {
        name: /The two-year period turns on how you hold the nationality/,
      }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/would put you eight years closer than the article does/),
    ).toBeInTheDocument();
  });

  it('never renders "Unmet" for a question the reader simply did not answer', async () => {
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);
    await user.click(screen.getByRole('button', { name: 'Measure my answers' }));

    const panel = screen.getByRole('region', { name: /measured against both regimes/i });
    expect(within(panel).queryAllByText('Unmet')).toEqual([]);
    expect(within(panel).getAllByText('Not recorded').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText(UNDECIDABLE).length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// What the panel must always carry
// ---------------------------------------------------------------------------

describe('what every result carries', () => {
  it('shows both regimes, in catalog order, whatever the outcome', async () => {
    for (const label of [EXAMPLE.byOrigin, EXAMPLE.dualNational, EXAMPLE.unstated]) {
      const panel = await runExample(label);
      const headings = within(panel)
        .getAllByRole('heading')
        .map((h) => h.textContent ?? '')
        .filter((text) => text === REDUCED_HEADING || text === GENERAL_HEADING);

      expect(headings, `order moved for ${label}`).toEqual([REDUCED_HEADING, GENERAL_HEADING]);
      document.body.innerHTML = '';
    }
  });

  it('marks every pathway as unreviewed, once per regime, plus the caveat', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);

    // Both records in the shipped catalog are unreviewed and the page says so
    // on each of them, not once at the bottom.
    expect(within(panel).getAllByText(UNREVIEWED)).toHaveLength(2);
    expect(
      within(panel).getByRole('heading', { name: /No licensed person has signed off on these rules/ }),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/the engine that would rank routes refuses/i)).toBeInTheDocument();
  });

  it('carries the coverage boundary inside the panel, naming what is not encoded', async () => {
    // The boundary at the top of the page is off screen by the time the verdict
    // appears, and the verdict is the moment a wrong conclusion gets drawn.
    const panel = await runExample(EXAMPLE.dualNational);
    const heading = within(panel).getByRole('heading', { name: /not the whole of the law/ });
    const notice = heading.closest('aside');

    expect(notice, 'the coverage notice is not a region of its own').not.toBeNull();
    expect(notice).toHaveAttribute('role', 'note');
    if (notice === null) throw new Error('unreachable');
    for (const route of uncoveredIn(['ES'])) {
      expect(within(notice).getByText(route.name.en), `${route.key} is not named`).toBeInTheDocument();
    }
  });

  it('does not list Canadian omissions under a Spanish result', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);

    for (const route of uncoveredIn(['CA'])) {
      expect(within(panel).queryByText(route.name.en), `${route.key} leaked in`).toBeNull();
    }
  });

  it('states what the page withheld and why', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);

    expect(within(panel).getByText('Assessment')).toBeInTheDocument();
    expect(
      within(panel).getByRole('heading', { name: 'Not shown on this page' }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/Which of the two regimes to apply under/),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/Whether nationality would be granted/)).toBeInTheDocument();
  });

  it('says explicitly that the order of the two regimes is not a ranking', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);

    expect(within(panel).getByText(/That order is not a ranking/)).toBeInTheDocument();
  });

  it('reports the date it was measured at, because the page reads no clock', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);
    const time = panel.querySelector('time');

    expect(time?.getAttribute('datetime')).toBe('2026-07-25');
  });

  it('shows the engine’s own comparison trace, tagged as English', async () => {
    // A paraphrase of an arithmetic trace is a different statement, so it is
    // quoted rather than translated — including on the Spanish page.
    const { container } = render(<NationalityTool locale="es" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Dos años, nacionalidad ostentada de origen' }));
    await user.click(screen.getByRole('button', { name: 'Contrastar mis respuestas' }));

    const traces = [...container.querySelectorAll(`#${RESULT_ID} p[lang="en"]`)];
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.some((p) => (p.textContent ?? '').includes('claimedNationality'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The boundary the whole product rests on
// ---------------------------------------------------------------------------

describe('the advice boundary, in the rendered output', () => {
  it('has a screen that actually catches advisory language', () => {
    // A screen that matches nothing and a screen that *can* match nothing
    // produce the same green tick. This is the read-proof.
    assertScreenCatchesAdvice();
    expect(KNOWN_ADVICE.length).toBeGreaterThan(5);
  });

  it('finds none of it in any of the three results', async () => {
    for (const label of Object.values(EXAMPLE)) {
      const panel = await runExample(label);
      expectNoAdvice(panel.textContent ?? '');
      document.body.innerHTML = '';
    }
  });

  it('finds none of it on the empty form either', async () => {
    const user = userEvent.setup();
    const { container } = render(<NationalityTool locale="en" />);
    await user.click(screen.getByRole('button', { name: 'Measure my answers' }));

    expectNoAdvice(container.textContent ?? '');
  });
});

// ---------------------------------------------------------------------------
// The instrument name
// ---------------------------------------------------------------------------

describe('the sources the result cites', () => {
  it('renders a Spanish instrument untranslated, with its own lang, on an English page', async () => {
    // "Civil Code, art. 22.1" is not a translation but a mis-citation: it names
    // an instrument that does not exist under that title, and a reader who
    // tries to verify it will not find it.
    const panel = await runExample(EXAMPLE.byOrigin);
    const cites = [...panel.querySelectorAll('cite')];
    const civilCode = cites.find((c) => (c.textContent ?? '').startsWith('Código Civil (España)'));

    expect(civilCode, 'the Civil Code is not cited by name').toBeDefined();
    expect(civilCode?.getAttribute('lang')).toBe('es');
    expect(civilCode?.textContent).toContain('art. 22.1');
    expect(panel.textContent).not.toContain('Civil Code, art. 22.1');
  });

  it('lists each source once, with the date a human last read it', async () => {
    const panel = await runExample(EXAMPLE.byOrigin);
    const ids = [...panel.querySelectorAll('[id^="cite-"]')].map((el) => el.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(within(panel).getAllByText(/Last verified against the source/).length).toBe(ids.length);
  });

  it('marks the discretionary source as not a statutory threshold', async () => {
    const panel = await runExample(EXAMPLE.dualNational);

    expect(within(panel).getAllByText('Not a statutory threshold').length).toBeGreaterThan(0);
    expect(
      within(panel).getAllByText(/administrative practice, not a bright-line statutory threshold/)
        .length,
    ).toBeGreaterThan(0);
  });

  it('every inline citation reference resolves to an entry on the same page', async () => {
    // A reference that jumps nowhere is a rule the reader cannot check, which
    // is the state the `Citation` type exists to prevent.
    const panel = await runExample(EXAMPLE.byOrigin);
    const refs = [...panel.querySelectorAll('a[href^="#cite-"]')];

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const target = (ref.getAttribute('href') ?? '').slice(1);
      expect(panel.querySelector(`[id="${target}"]`), `${target} resolves nowhere`).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('accessibility of the form and its answer', () => {
  it('moves focus to the result when one arrives', async () => {
    // A result computed in the browser appears silently: nothing navigates and
    // no page reloads, so a reader not looking at the right part of the screen
    // has no way to know the answer came.
    const panel = await runExample(EXAMPLE.byOrigin);

    expect(document.activeElement).toBe(panel);
    expect(panel).toHaveAttribute('tabindex', '-1');
  });

  it('announces a failed submission and takes focus to the summary', async () => {
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);

    await user.selectOptions(
      screen.getByLabelText(/nationality you would apply under/i),
      'other',
    );
    await user.type(screen.getByLabelText(/two-letter country code/i), 'MEX');
    await user.click(screen.getByRole('button', { name: 'Measure my answers' }));

    const summary = screen.getByRole('alert');
    expect(document.activeElement).toBe(summary);
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(within(summary).getByRole('heading')).toHaveTextContent('This form was not checked');
  });

  it('links every summary entry to a control that exists and can take focus', async () => {
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);

    await user.selectOptions(screen.getByLabelText(/nationality you would apply under/i), 'other');
    await user.type(screen.getByLabelText(/two-letter country code/i), '??');
    await user.click(screen.getByRole('button', { name: 'Measure my answers' }));

    const links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const id = (link.getAttribute('href') ?? '').slice(1);
      const control = document.getElementById(id);
      expect(control, `#${id} is a link to nowhere`).not.toBeNull();
      expect(['INPUT', 'SELECT', 'TEXTAREA']).toContain(control?.tagName);
    }
  });

  it('wires the inline message to the control, and does not signal by colour alone', async () => {
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);

    await user.selectOptions(screen.getByLabelText(/nationality you would apply under/i), 'other');
    await user.type(screen.getByLabelText(/two-letter country code/i), 'MEX');
    await user.click(screen.getByRole('button', { name: 'Measure my answers' }));

    const control = document.getElementById(FIELD.claimedOtherCode);
    expect(control).toHaveAttribute('aria-invalid', 'true');

    const describedBy = (control?.getAttribute('aria-describedby') ?? '').split(' ');
    expect(describedBy).toContain(`${FIELD.claimedOtherCode}-error`);

    const message = document.getElementById(`${FIELD.claimedOtherCode}-error`);
    expect(message?.textContent).toContain('Error');
    expect(message?.textContent).toContain('MEX');
  });

  it('states which field is required in words, not with a bare marker', async () => {
    render(<NationalityTool locale="en" />);
    const asOf = document.getElementById(FIELD.assessAsOf);

    expect(asOf).toHaveAttribute('aria-required', 'true');
    const label = document.querySelector(`label[for="${FIELD.assessAsOf}"]`);
    expect(label?.textContent).toContain('required');
  });

  it('gives every control a real label', async () => {
    const { container } = render(<NationalityTool locale="en" />);

    for (const control of container.querySelectorAll('input, select, textarea')) {
      const id = control.getAttribute('id');
      expect(id, control.outerHTML).not.toBeNull();
      expect(container.querySelector(`label[for="${id ?? ''}"]`), `no label for #${id ?? ''}`).not.toBeNull();
    }
  });

  it('does not point aria-controls at a region that does not exist yet', async () => {
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);

    const submit = screen.getByRole('button', { name: 'Measure my answers' });
    expect(submit).not.toHaveAttribute('aria-controls');

    await user.click(submit);
    expect(submit).toHaveAttribute('aria-controls', RESULT_ID);
    expect(document.getElementById(RESULT_ID)).not.toBeNull();
  });

  it('loads an example without submitting the form', async () => {
    // A `<button>` inside a form defaults to `submit` in HTML, so a loader
    // written without a type would run the check against whatever was there a
    // moment ago.
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);

    await user.click(screen.getByRole('button', { name: EXAMPLE.byOrigin }));
    expect(screen.queryByRole('region', { name: /measured against both regimes/i })).toBeNull();
  });

  it('clears the answers and the result together', async () => {
    const user = userEvent.setup();
    render(<NationalityTool locale="en" />);

    await user.click(screen.getByRole('button', { name: EXAMPLE.byOrigin }));
    await user.click(screen.getByRole('button', { name: 'Measure my answers' }));
    expect(screen.getByRole('region', { name: /measured against both regimes/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear everything' }));
    expect(screen.queryByRole('region', { name: /measured against both regimes/i })).toBeNull();
    expect(screen.getByLabelText(/nationality you would apply under/i)).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

describe('what the tool does with the answers', () => {
  it('sends them nowhere and stores them nowhere', async () => {
    const watch = watchEgress();
    try {
      const user = userEvent.setup();
      render(<NationalityTool locale="en" />);

      await user.click(screen.getByRole('button', { name: EXAMPLE.byOrigin }));
      await user.click(screen.getByRole('button', { name: 'Measure my answers' }));

      expect(screen.getByRole('region', { name: /measured against both regimes/i })).toBeInTheDocument();
      watch.expectSilent();
      expect(window.location.search).toBe('');
    } finally {
      watch.restore();
    }
  });

  it('has a form with no action to submit to', async () => {
    const { container } = render(<NationalityTool locale="en" />);
    const form = container.querySelector('form');

    expect(form).not.toBeNull();
    expect(form?.hasAttribute('action')).toBe(false);
    // The browser's own validation bubble is monolingual and never appears in
    // the error summary, so the page owns the messages instead.
    expect(form?.hasAttribute('noValidate') || form?.noValidate).toBeTruthy();
  });

  it('says so on screen, above the input, with a link to the source', async () => {
    render(<NationalityTool locale="en" />);
    const note = screen.getByRole('note', { name: /Nothing you type here leaves your device/i });

    expect(note).toBeInTheDocument();
    // "Check for yourself" is a real answer on an AGPL-3.0 public repository,
    // so the note points at the file that does the work.
    const href = within(note).getByRole('link').getAttribute('href') ?? '';
    expect(href).toContain('NationalityTool.tsx');
    expect(href.startsWith('https://')).toBe(true);
  });
});
