/**
 * `/tools/mrz`, end to end through what a reader sees.
 *
 * Two properties are load-bearing on this page and neither is about arithmetic.
 *
 * **The defect has to be findable.** Somebody is holding a passport and a
 * keyboard, and the answer they need is "the date-of-birth digit at line 2
 * column 20 disagrees", not "invalid". A page that renders the verdict as a red
 * badge and stops has thrown away the useful half.
 *
 * **The pasted lines must not go anywhere.** A machine-readable zone is a
 * document number and a date of birth. The page states that nothing typed into
 * it is transmitted or stored; that claim is a property of the code, and a
 * property is testable.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { MRZ_SPECIMENS, specimenText } from '@/lib/tools/mrz';
import { MrzTool } from '@/components/tools/MrzTool';

import { expectNoAdvice } from '../support/advice';
import { watchEgress } from '../support/egress';

const CHECK = 'Check the zone';
const CLEAR = 'Clear everything';
const LINES_LABEL = /machine-readable lines/i;

function specimen(id: string): string {
  const found = MRZ_SPECIMENS.find((s) => s.id === id);
  if (found === undefined) throw new Error(`no such specimen: ${id}`);
  return specimenText(found);
}

/** Paste text and press the button. `userEvent.type` would take a minute here. */
async function checkZone(text: string): Promise<HTMLElement> {
  const user = userEvent.setup();
  render(<MrzTool locale="en" />);
  const box = screen.getByLabelText(LINES_LABEL);
  await user.click(box);
  await user.paste(text);
  await user.click(screen.getByRole('button', { name: CHECK }));
  return screen.getByRole('region', { name: /What the zone says/i });
}

/**
 * The row of the check-digit table for one field.
 *
 * Scoped to the check-digit block: the field table above it carries the same
 * row headers, and a query that matched either would silently start asserting
 * against the wrong table.
 */
function digitRow(panel: HTMLElement, field: string): HTMLElement {
  const block = panel.querySelector<HTMLElement>('#mrz-check-digits');
  if (block === null) throw new Error('no check-digit block');
  const header = within(block).getByRole('rowheader', { name: new RegExp(field) });
  const row = header.closest('tr');
  if (row === null) throw new Error(`no row for ${field}`);
  return row;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a well-formed zone', () => {
  it('reads as internally consistent, and says what that does not mean', async () => {
    const panel = await checkZone(specimen('td3'));

    expect(within(panel).getByText('Internally consistent')).toBeInTheDocument();
    // The one sentence that stops a clean result being read as "genuine".
    expect(
      within(panel).getByText(/it does not mean the document is genuine/),
    ).toBeInTheDocument();
  });

  it('names the format and echoes the lines it actually read', async () => {
    const panel = await checkZone(specimen('td3'));

    expect(within(panel).getByText('TD3')).toBeInTheDocument();
    expect(within(panel).getByText(/TD3 — passport, 2 lines of 44/)).toBeInTheDocument();
    for (const line of specimen('td3').split('\n')) {
      expect(within(panel).getByText(line)).toBeInTheDocument();
    }
  });

  it('shows every check digit separately, with the string it is computed over', async () => {
    const panel = await checkZone(specimen('td3'));
    const dob = digitRow(panel, 'Date of birth');

    expect(within(dob).getByText('800101')).toBeInTheDocument();
    expect(within(dob).getByText('line 2, column 20')).toBeInTheDocument();
    expect(within(dob).getByText('Matches')).toBeInTheDocument();
  });

  it('reads a three-line identity card as well as a passport', async () => {
    const panel = await checkZone(specimen('td1'));

    expect(within(panel).getByText('TD1')).toBeInTheDocument();
    expect(within(panel).getByText('Internally consistent')).toBeInTheDocument();
  });

  it('marks the century resolution as a convention rather than the standard', async () => {
    const panel = await checkZone(specimen('td3'));

    expect(
      within(panel).getByRole('heading', { name: /The century is a convention, not the standard/ }),
    ).toBeInTheDocument();
    expect(panel.querySelector('time')?.getAttribute('datetime')).toBe('2026-07-25');
  });
});

describe('a corrupted check digit', () => {
  /** The TD3 specimen with the date-of-birth check digit changed from 4 to 5. */
  function corrupted(): string {
    const lines = specimen('td3').split('\n');
    const second = lines[1];
    if (second === undefined) throw new Error('no second line');
    lines[1] = `${second.slice(0, 19)}5${second.slice(20)}`;
    return lines.join('\n');
  }

  it('says which field failed, not merely that something did', async () => {
    const panel = await checkZone(corrupted());

    expect(within(panel).getByText('Not internally consistent')).toBeInTheDocument();
    expect(within(digitRow(panel, 'Date of birth')).getByText('Does not match')).toBeInTheDocument();
    // And the fields that are fine still say so, which is what turns the table
    // into a way of finding the character to re-read.
    expect(within(digitRow(panel, 'Document number')).getByText('Matches')).toBeInTheDocument();
    expect(within(digitRow(panel, 'Date of expiry')).getByText('Matches')).toBeInTheDocument();
  });

  it('locates it to a line and a column the reader can count to', async () => {
    const panel = await checkZone(corrupted());
    const failures = within(panel)
      .getByRole('heading', { name: 'What does not add up' })
      .closest('section');
    if (failures === null) throw new Error('no failures block');

    expect(within(failures).getAllByText(/line 2, column 20/).length).toBeGreaterThan(0);
    expect(
      within(failures).getByText(/date of birth check digit at line 2 column 20/),
    ).toBeInTheDocument();
  });

  it('shows both numbers so the arithmetic can be redone by hand', async () => {
    const panel = await checkZone(corrupted());
    const dob = digitRow(panel, 'Date of birth');

    // Present in the document, and computed from the field.
    expect(within(dob).getByText('5')).toBeInTheDocument();
    expect(within(dob).getByText('4')).toBeInTheDocument();
  });

  it('quotes the engine’s own wording rather than paraphrasing it', async () => {
    const { container } = render(<MrzTool locale="es" />);
    const user = userEvent.setup();
    const box = screen.getByLabelText(/Líneas de lectura mecánica/i);
    await user.click(box);
    await user.paste(corrupted());
    await user.click(screen.getByRole('button', { name: 'Comprobar la zona' }));

    const quoted = [...container.querySelectorAll('p[lang="en"]')].map((p) => p.textContent ?? '');
    expect(quoted.some((text) => text.includes('check digit'))).toBe(true);
  });
});

describe('input the tool cannot read', () => {
  it('says the geometry matches nothing rather than inventing a format', async () => {
    const panel = await checkZone('NOT<AN<MRZ');

    expect(within(panel).getByText(/match no ICAO 9303 geometry/)).toBeInTheDocument();
    expect(within(panel).queryByRole('heading', { name: 'Every field it could read' })).toBeNull();
  });

  it('refuses an empty submission and says which field is empty', async () => {
    const user = userEvent.setup();
    render(<MrzTool locale="en" />);
    await user.click(screen.getByRole('button', { name: CHECK }));

    const summary = screen.getByRole('alert');
    expect(document.activeElement).toBe(summary);
    const link = within(summary).getByRole('link');
    expect(link).toHaveAttribute('href', '#mrz-lines');
    expect(document.getElementById('mrz-lines')?.tagName).toBe('TEXTAREA');
  });
});

describe('what the tool does with the pasted lines', () => {
  it('stores them nowhere and sends them nowhere', async () => {
    const watch = watchEgress();
    try {
      const panel = await checkZone(specimen('td3'));

      expect(within(panel).getByText('Internally consistent')).toBeInTheDocument();
      watch.expectSilent();
      // Nor into a URL, a request or a history entry.
      expect(window.location.search).toBe('');
      expect(window.location.hash).toBe('');
    } finally {
      watch.restore();
    }
  });

  it('keeps them out of the browser’s own caches too', async () => {
    // An autocorrect pass over a document number produces a number belonging to
    // somebody else, and a browser that remembers the value has stored a travel
    // document in a form-fill cache.
    render(<MrzTool locale="en" />);
    const box = screen.getByLabelText(LINES_LABEL);

    expect(box).toHaveAttribute('autocomplete', 'off');
    expect(box).toHaveAttribute('autocapitalize', 'off');
    expect(box).toHaveAttribute('autocorrect', 'off');
    expect(box).toHaveAttribute('spellcheck', 'false');
  });

  it('has no form action to submit to', async () => {
    const { container } = render(<MrzTool locale="en" />);
    const form = container.querySelector('form');

    expect(form?.hasAttribute('action')).toBe(false);
    expect(form?.noValidate).toBe(true);
  });

  it('lets the reader wipe the value from a shared screen', async () => {
    const user = userEvent.setup();
    render(<MrzTool locale="en" />);
    const box = screen.getByLabelText(LINES_LABEL);
    await user.click(box);
    await user.paste(specimen('td3'));
    await user.click(screen.getByRole('button', { name: CHECK }));

    await user.click(screen.getByRole('button', { name: CLEAR }));
    expect(box).toHaveValue('');
    expect(screen.queryByRole('region', { name: /What the zone says/i })).toBeNull();
  });
});

describe('the boundary of what an MRZ check can say', () => {
  it('states what is withheld, including whether the document is genuine', async () => {
    const panel = await checkZone(specimen('td3'));

    expect(within(panel).getByText('Assessment')).toBeInTheDocument();
    expect(within(panel).getByText(/Whether the document is genuine/)).toBeInTheDocument();
    expect(
      within(panel).getByText(/Whether the holder may travel, enter or remain anywhere/),
    ).toBeInTheDocument();
  });

  it('cites the instrument it applied', async () => {
    const panel = await checkZone(specimen('td3'));

    expect(within(panel).getByText(/ICAO Doc 9303/)).toBeInTheDocument();
    expect(
      within(panel).getByText(/The catalog omits a URL rather than guess one/),
    ).toBeInTheDocument();
  });

  it('says nothing that reads as advice', async () => {
    const panel = await checkZone(specimen('td3'));
    expectNoAdvice(panel.textContent ?? '');
  });

  it('moves focus to the answer, which otherwise appears silently', async () => {
    const panel = await checkZone(specimen('td3'));

    expect(document.activeElement).toBe(panel);
  });
});

describe('the synthetic specimens the page offers', () => {
  it('loads one without submitting the form', async () => {
    const user = userEvent.setup();
    render(<MrzTool locale="en" />);

    await user.click(screen.getByRole('button', { name: 'TD3 passport' }));
    expect(screen.getByLabelText(LINES_LABEL)).toHaveValue(specimen('td3'));
    expect(screen.queryByRole('region', { name: /What the zone says/i })).toBeNull();
  });

  it('says on screen that they belong to nobody', async () => {
    render(<MrzTool locale="en" />);

    expect(
      screen.getByText(/No real travel-document number appears anywhere in Meridian/),
    ).toBeInTheDocument();
  });
});
