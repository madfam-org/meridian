/**
 * `/tools/schengen`, end to end through what a reader sees.
 *
 * The portal's day counter answers two questions the landing page's version
 * deliberately omits, and both of them exist because the window slides:
 *
 *  - the **worst** day across a range, since a trip that is lawful on the day it
 *    starts can breach on its twelfth day and be lawful again by the day it
 *    ends. A calculator that checks the departure date answers a question
 *    nobody asked, and answers it reassuringly.
 *  - the **earliest** date a stay of a given length fits — reported as the first
 *    date the arithmetic permits, never as a suggestion to travel then.
 *
 * The third case is the one where the honest answer is that there is no answer:
 * days inside Bulgaria's and Romania's staged accession, where charging invents
 * an overstay and waiving hands the traveller days they may not have.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { SchengenTool } from '@/app/[locale]/tools/schengen/SchengenTool';
import { SCHENGEN_RESULT_ID } from '@/app/[locale]/tools/schengen/SchengenResult';
import { FIELD, stayFieldId, stayRowKey } from '@/lib/tools/schengen-form';

import { expectNoAdvice } from '../support/advice';
import { watchEgress } from '../support/egress';

const COUNT = 'Count the days';

const EXAMPLE = {
  worstDay: 'The day you fly home is not the day that decides',
  ninety: 'Exactly ninety days',
  ninetyOne: 'The same stay, one day earlier',
  staged: 'Bulgaria mid-accession',
  croatia: 'Croatia before it joined',
  edge: 'A stay across the window edge',
} as const;

/** Load one of the invented itineraries and press the button. */
async function runExample(label: string): Promise<HTMLElement> {
  const user = userEvent.setup();
  render(<SchengenTool locale="en" />);
  // The example buttons appear once in the loader group and their names appear
  // again in the prose list below it, so the group is the scope.
  const group = screen.getByRole('group', { name: /load an invented itinerary/i });
  await user.click(within(group).getByRole('button', { name: label }));
  await user.click(screen.getByRole('button', { name: COUNT }));
  return screen.getByRole('region', { name: /against the 90 days/i });
}

function block(panel: HTMLElement, id: string): HTMLElement {
  const found = panel.querySelector<HTMLElement>(`#${id}`);
  if (found === null) throw new Error(`no result block ${id}`);
  return found;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// The allowance
// ---------------------------------------------------------------------------

describe('the count against the 90 days', () => {
  it('reads 90 days as within the allowance and 91 as over it', async () => {
    const ninety = await runExample(EXAMPLE.ninety);
    expect(within(ninety).getAllByText('Within the allowance').length).toBeGreaterThan(0);
    expect(
      within(ninety).getByText(/On the stays entered, 90 of the 90 days are charged/),
    ).toBeInTheDocument();
    document.body.innerHTML = '';

    const over = await runExample(EXAMPLE.ninetyOne);
    expect(within(over).getAllByText('Over the allowance').length).toBeGreaterThan(0);
    expect(within(over).getByText(/That is 1 beyond the 90 the rule allows/)).toBeInTheDocument();
  });

  it('says a count inside the allowance is not permission to enter', async () => {
    const panel = await runExample(EXAMPLE.ninety);

    expect(within(panel).getByText(/is not permission to enter/)).toBeInTheDocument();
    expect(within(panel).getByText(/art\. 6\(1\) sets conditions beyond the day count/)).toBeInTheDocument();
  });

  it('shows the window it measured and the terms that produced the total', async () => {
    const panel = await runExample(EXAMPLE.ninety);
    const window = block(panel, 'schengen-window');

    expect(within(window).getByText(/The 180 days ending on 2026-07-25/)).toBeInTheDocument();
    expect(within(window).getByText('90 − 90 = 0')).toBeInTheDocument();
  });

  it('says where every uncharged day went', async () => {
    const panel = await runExample(EXAMPLE.edge);
    const stays = block(panel, 'schengen-stays');

    expect(within(stays).getAllByText(/Outside the 180-day window/).length).toBeGreaterThan(0);
    expect(
      within(stays).getByRole('columnheader', { name: 'Where the rest went' }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// The worst day
// ---------------------------------------------------------------------------

describe('the worst day of a range', () => {
  it('is reported alongside the last day, so the difference is visible', async () => {
    const panel = await runExample(EXAMPLE.worstDay);
    const worst = block(panel, 'schengen-worst-day');

    expect(within(worst).getByText('Highest usage falls on')).toBeInTheDocument();
    expect(within(worst).getAllByText('2026-08-01').length).toBeGreaterThan(0);
    // 59 on the worst day against 55 on the day of departure: reading the
    // departure date understates the trip by four days.
    expect(within(worst).getAllByText('59').length).toBeGreaterThan(0);
    expect(within(worst).getAllByText('55').length).toBeGreaterThan(0);
    expect(
      within(worst).getByText(/the day of departure understates the trip/),
    ).toBeInTheDocument();
  });

  it('explains why the last day is the wrong day to check', async () => {
    const panel = await runExample(EXAMPLE.worstDay);
    const worst = block(panel, 'schengen-worst-day');

    expect(within(worst).getByText(/can breach on its twelfth day/)).toBeInTheDocument();
  });

  it('warns when part of the scanned range is in no entered stay', async () => {
    // A trip that is not in the record is measured as time at home, and the
    // resulting figure looks reassuring and means nothing.
    const panel = await runExample(EXAMPLE.worstDay);
    const worst = block(panel, 'schengen-worst-day');

    expect(
      within(worst).getByRole('heading', { name: /not covered by any stay you entered/ }),
    ).toBeInTheDocument();
    expect(within(worst).getByText(/describe staying at home rather than travelling/)).toBeInTheDocument();
  });

  it('omits the block entirely when no range was given', async () => {
    const panel = await runExample(EXAMPLE.ninety);
    expect(panel.querySelector('#schengen-worst-day')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The earliest date a stay fits
// ---------------------------------------------------------------------------

describe('the earliest date an unbroken stay of a given length fits', () => {
  it('is reported with the wait it implies, as a measurement', async () => {
    const panel = await runExample(EXAMPLE.ninety);
    const next = block(panel, 'schengen-next-entry');

    expect(within(next).getAllByText('2026-10-24').length).toBeGreaterThan(0);
    expect(within(next).getByText('90 days after the date you gave')).toBeInTheDocument();
    expect(
      within(next).getByText(/It is not a suggestion to travel then/),
    ).toBeInTheDocument();
  });

  it('shows how the date was found rather than asserting it', async () => {
    const panel = await runExample(EXAMPLE.ninety);
    const next = block(panel, 'schengen-next-entry');

    expect(within(next).getByText('Stay length tested')).toBeInTheDocument();
    expect(
      within(next).getByText(/Every day of it is tested against its own 180-day window/),
    ).toBeInTheDocument();
  });

  it('says there is no such date when the stay is longer than the allowance', async () => {
    const user = userEvent.setup();
    render(<SchengenTool locale="en" />);

    const row = stayRowKey(1);
    await user.selectOptions(screen.getByLabelText(/^State/), 'ES');
    await user.type(screen.getByLabelText(/^Day you entered/), '2026-07-01');
    await user.type(screen.getByLabelText(/^Day you left/), '2026-07-05');
    await user.type(screen.getByLabelText(/Length of the stay, in days/), '120');
    await user.type(screen.getByLabelText(/Not starting before/), '2026-08-01');
    expect(document.getElementById(stayFieldId(row, 'country'))).not.toBeNull();

    await user.click(screen.getByRole('button', { name: COUNT }));
    const next = block(screen.getByRole('region', { name: /against the 90 days/i }), 'schengen-next-entry');

    expect(within(next).getByText('No such date')).toBeInTheDocument();
    // Not "none found inside the horizon" — the two null cases mean different
    // things and only one of them invites the reader to try again later.
    expect(within(next).getByText(/there is no start date that makes it lawful/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Staged accession
// ---------------------------------------------------------------------------

describe('the staged-accession window', () => {
  it('reports the position as not determinable rather than picking a side', async () => {
    const panel = await runExample(EXAMPLE.staged);

    expect(within(panel).getAllByText('Not determinable on this record').length).toBeGreaterThan(0);
    expect(
      within(panel).getByText(/Meridian will not decide it by picking one/),
    ).toBeInTheDocument();
  });

  it('shows both totals, so the reader can see where the limit falls', async () => {
    const panel = await runExample(EXAMPLE.staged);

    expect(within(panel).getByText(/Between 51 and 114 of the 90 days are charged/)).toBeInTheDocument();
    expect(within(panel).getByText(/51 days with these excluded, and 114 with them charged/)).toBeInTheDocument();
  });

  it('names the period, the State and the two accession dates', async () => {
    const panel = await runExample(EXAMPLE.staged);

    expect(
      within(panel).getByRole('heading', { name: /needs a person, not a calculator/ }),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/guessing is harmful in both directions/)).toBeInTheDocument();
    expect(
      within(panel).getByText(/The staged window for this State runs from 2024-03-31 up to, but not including, 2025-01-01/),
    ).toBeInTheDocument();
  });

  it('does not raise the escalation when membership was never staged', async () => {
    const panel = await runExample(EXAMPLE.croatia);

    expect(panel.querySelector('[class*="period"]')).toBeNull();
    expect(within(panel).queryByRole('heading', { name: /needs a person, not a calculator/ })).toBeNull();
    expect(within(panel).getAllByText(/was outside the Schengen area on those days/).length).toBe(1);
  });

  it('shows the accession dates it applied, and says they are unverified data', async () => {
    const panel = await runExample(EXAMPLE.croatia);
    const membership = block(panel, 'schengen-membership');

    expect(within(membership).getByText('2023-01-01')).toBeInTheDocument();
    expect(
      within(membership).getByRole('heading', { name: /These dates are data, not a citation/ }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Form behaviour and accessibility
// ---------------------------------------------------------------------------

describe('the form', () => {
  it('names the row a complaint belongs to', async () => {
    const user = userEvent.setup();
    render(<SchengenTool locale="en" />);

    await user.selectOptions(screen.getByLabelText(/^State/), 'ES');
    await user.type(screen.getByLabelText(/^Day you entered/), '2026-07-10');
    await user.type(screen.getByLabelText(/^Day you left/), '2026-07-01');
    await user.click(screen.getByRole('button', { name: COUNT }));

    const summary = screen.getByRole('alert');
    expect(document.activeElement).toBe(summary);
    expect(within(summary).getByRole('link').textContent).toMatch(/^Stay 1 —/);
    expect(within(summary).getByRole('link')).toHaveAttribute(
      'href',
      `#${stayFieldId(stayRowKey(1), 'end')}`,
    );
  });

  it('refuses to run with no stay at all', async () => {
    const user = userEvent.setup();
    render(<SchengenTool locale="en" />);
    await user.click(screen.getByRole('button', { name: COUNT }));

    expect(screen.queryByRole('region', { name: /against the 90 days/i })).toBeNull();
    expect(within(screen.getByRole('alert')).getByRole('link').textContent).toContain(
      'Enter at least one stay',
    );
  });

  it('keeps a row to type into after the last one is removed', async () => {
    const user = userEvent.setup();
    render(<SchengenTool locale="en" />);

    await user.click(screen.getByRole('button', { name: 'Remove stay 1' }));
    expect(screen.getByLabelText(/^State/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Stay 1' })).toBeInTheDocument();
  });

  it('adds a row and moves focus into it', async () => {
    const user = userEvent.setup();
    render(<SchengenTool locale="en" />);

    await user.click(screen.getByRole('button', { name: 'Add a stay' }));
    expect(screen.getAllByLabelText(/^State/)).toHaveLength(2);
    // Removing the element that had focus otherwise drops the caret onto the
    // document body, stranding a keyboard user at the top of the page.
    expect(document.activeElement?.id).toBe(stayFieldId(stayRowKey(2), 'country'));
  });

  it('gives every control a real label and marks the reference date required', async () => {
    const { container } = render(<SchengenTool locale="en" />);

    for (const control of container.querySelectorAll('input, select, textarea')) {
      const id = control.getAttribute('id');
      expect(id, control.outerHTML).not.toBeNull();
      expect(container.querySelector(`label[for="${id ?? ''}"]`), `no label for #${id ?? ''}`).not.toBeNull();
    }
    expect(document.getElementById(FIELD.reference)).toHaveAttribute('aria-required', 'true');
  });

  it('moves focus to the answer once it arrives', async () => {
    const panel = await runExample(EXAMPLE.ninety);

    expect(document.activeElement).toBe(panel);
    expect(panel.id).toBe(SCHENGEN_RESULT_ID);
  });
});

describe('what the counter does with a travel history', () => {
  it('sends it nowhere and stores it nowhere', async () => {
    const watch = watchEgress();
    try {
      const panel = await runExample(EXAMPLE.staged);

      expect(within(panel).getAllByText('Not determinable on this record').length).toBeGreaterThan(0);
      watch.expectSilent();
      expect(window.location.search).toBe('');
    } finally {
      watch.restore();
    }
  });

  it('states what it will not tell you', async () => {
    const panel = await runExample(EXAMPLE.ninety);

    expect(within(panel).getByText('Assessment')).toBeInTheDocument();
    expect(within(panel).getByText(/Whether you will be allowed in/)).toBeInTheDocument();
    expect(within(panel).getByText(/When you should travel, or whether to book/)).toBeInTheDocument();
  });

  it('says nothing that reads as advice', async () => {
    for (const label of [EXAMPLE.worstDay, EXAMPLE.ninetyOne, EXAMPLE.staged]) {
      const panel = await runExample(label);
      expectNoAdvice(panel.textContent ?? '');
      document.body.innerHTML = '';
    }
  });
});
