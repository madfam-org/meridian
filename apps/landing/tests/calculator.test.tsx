/**
 * The calculator as a reader meets it.
 *
 * `tests/schengen-count.test.ts` proves the arithmetic. This proves the page
 * says it — which is a separate failure mode, and the more dangerous one: a
 * correct `undetermined` that renders as a reassuring "39 days remain unused"
 * is worse than a wrong number, because it looks like an answer.
 */

import { fireEvent, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SchengenCalculator } from '@/components/SchengenCalculator';
import { SCHENGEN_CITATION, SCHENGEN_MAX_DAYS, MAX_STAYS } from '@/lib/schengen';

import {
  fillTrip,
  renderCalculator,
  resultRegion,
  resultText,
  setReferenceDate,
  submit,
  tripGroup,
  UI_TEXT,
} from './helpers.js';

/** The itinerary whose answer is that there is no answer. */
function enterStagedAccessionRecord(): void {
  setReferenceDate('2024-12-31');
  fillTrip(1, { country: 'ES', start: '2024-10-01', end: '2024-12-01' });
  fillTrip(2, { country: 'BG', start: '2024-12-02', end: '2024-12-31' });
}

describe('the record that cannot decide', () => {
  beforeEach(() => {
    renderCalculator('en');
    enterStagedAccessionRecord();
    submit();
  });

  it('says the record cannot decide, in words rather than by omission', () => {
    expect(resultText()).toContain('The record cannot decide');
  });

  it('gives the range and says the upper end breaches, instead of a single figure', () => {
    const text = resultText();
    expect(text).toContain('Somewhere between 62 and 92 days are consumed on 2024-12-31');
    expect(text).toContain(`the upper end is past the ${SCHENGEN_MAX_DAYS}`);
  });

  it('never prints a remaining-days reassurance while the outcome is undetermined', () => {
    // This is the single most dangerous sentence this page could produce: a
    // determinate reassurance built on an indeterminate count. Its absence is
    // the assertion.
    const text = resultText();
    expect(text).not.toContain('remain unused');
    expect(text).not.toContain('remains unused');
    expect(text).not.toMatch(/\bInside the allowance\b/);
    expect(text).not.toMatch(/\bOver the allowance\b/);
  });

  it('names the unresolvable period, its dates, and what the total would be', () => {
    const text = resultText();
    expect(text).toContain('Some of these days cannot be resolved by arithmetic');
    expect(text).toContain('30 days in Bulgaria fall between 2024-03-31 and 2025-01-01');
    expect(text).toContain('the total would be 92 if every one of them charged');
    expect(text).toContain('does not charge them and does not assert they are free');
  });

  it('still shows the trip that charged nothing, with the reason', () => {
    // Dropping a zero-charge row would leave somebody scanning the table for a
    // trip they know they took.
    const text = resultText();
    expect(text).toContain('Bulgaria');
    expect(text).toContain('staged-accession window');
  });

  it('carries a status word beside the badge glyph, never colour alone', () => {
    const badge = within(resultRegion() as HTMLElement).getByText('The record cannot decide');
    expect(badge).toBeInTheDocument();
    // The glyph next to it is decorative and hidden from assistive technology,
    // so the meaning is carried by the word.
    const glyph = badge.parentElement?.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toBe('?');
  });

});

describe('the record that cannot decide, in Spanish', () => {
  it('refuses in the served language and still names the range', () => {
    renderCalculator('es');
    setReferenceDate('2024-12-31', 'es');
    fillTrip(1, { country: 'ES', start: '2024-10-01', end: '2024-12-01' }, 'es');
    fillTrip(2, { country: 'BG', start: '2024-12-02', end: '2024-12-31' }, 'es');
    submit('es');

    const text = resultText();
    expect(text).toContain('El registro no puede decidirlo');
    expect(text).toContain('Se consumen entre 62 y 92 días el 2024-12-31');
    expect(text).toContain('el extremo superior supera los 90');
    // No reassuring figure in this language either.
    expect(text).not.toContain('sin consumir');
    expect(text).not.toContain('Dentro de la franquicia');
  });
});

describe('the two determinate answers', () => {
  it('reports the allowance left when the record is inside it', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-06-01', end: '2026-06-30' });
    submit();
    const text = resultText();
    expect(text).toContain('Inside the allowance');
    expect(text).toContain('60 days of the allowance remain unused on 2026-07-25');
    expect(text).not.toContain('beyond the allowance');
  });

  it('reports the breach, by how much, when the record is over it', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-04-26', end: '2026-07-25' });
    submit();
    const text = resultText();
    expect(text).toContain('Over the allowance');
    expect(text).toContain('That is 1 day beyond the allowance on 2026-07-25');
    expect(text).not.toContain('remain unused');
  });

  it('shows the exactly-ninety case as inside, with nothing left', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-04-27', end: '2026-07-25' });
    submit();
    const text = resultText();
    expect(text).toContain('Inside the allowance');
    expect(text).toContain('0 days of the allowance remain unused');
  });

  it('shows the working: the window, the per-trip columns and the merged total', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-07-01', end: '2026-07-10' });
    fillTrip(2, { country: 'FR', start: '2026-07-05', end: '2026-07-15' });
    submit();
    const text = resultText();
    expect(text).toContain('Measured over the 180 days from 2026-01-27 to 2026-07-25');
    // 10 + 11 in the column, 15 in the total, and the page explains the gap.
    expect(text).toContain('Total, with any day counted once');
    expect(text).toContain('a person cannot spend a day twice');
    const total = within(resultRegion() as HTMLElement)
      .getByRole('table')
      .querySelector('tfoot strong');
    expect(total?.textContent).toBe('15');
  });
});

describe('the rule the count was measured against', () => {
  beforeEach(() => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-06-01', end: '2026-06-30' });
    submit();
  });

  it('names the instrument verbatim and marks its own language', () => {
    const cite = (resultRegion() as HTMLElement).querySelector('cite');
    expect(cite?.textContent).toBe(
      `${SCHENGEN_CITATION.instrument}, ${SCHENGEN_CITATION.provision}`,
    );
    // X-SCHENGEN cites the English text, so the name carries lang="en" even on
    // the Spanish document. It is never translated.
    expect(cite?.getAttribute('lang')).toBe('en');
  });

  it('prints the date a person last checked the text against its source', () => {
    expect(resultText()).toContain(
      `last checked against its source on ${SCHENGEN_CITATION.verifiedOn}`,
    );
  });

  it('links the canonical text, in a tab that cannot reach back', () => {
    const link = within(resultRegion() as HTMLElement).getByRole('link', {
      name: SCHENGEN_CITATION.url ?? '',
    });
    expect(link).toHaveAttribute('href', SCHENGEN_CITATION.url);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('leaves the package’s own caveat in the language it was written in', () => {
    const note = (resultRegion() as HTMLElement).querySelector('[lang="en"]');
    expect(note).not.toBeNull();
    expect(resultText()).toContain('a compliant count is not a right of entry');
  });

  it('says what the number is not: not permission, not a prediction, not advice', () => {
    const text = resultText();
    expect(text).toContain('It is an assessment');
    expect(text).toContain('not permission to travel');
    expect(text).toContain('not advice about what to do next');
  });
});

describe('the privacy claim sits beside the input', () => {
  it('states it above the form rather than in a footer', () => {
    const { container } = renderCalculator('en');
    const claim = screen.getByRole('heading', {
      name: /Runs in your browser\. Nothing you type is transmitted or stored\./,
    });
    const form = container.querySelector('form') as HTMLElement;
    // Node.DOCUMENT_POSITION_FOLLOWING — the form comes after the claim.
    expect(claim.compareDocumentPosition(form) & 4).toBeTruthy();
  });

  it('offers the evidence without hiding it behind a tooltip', () => {
    const { container } = renderCalculator('en');
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.textContent).toContain('It makes no network request with your dates');
    expect(details?.textContent).toContain('There is no analytics, no telemetry');
    // And it points at the file, so the claim is checkable.
    const source = within(details as HTMLElement).getByRole('link');
    expect(source).toHaveAttribute(
      'href',
      expect.stringContaining('apps/landing/components/SchengenCalculator.tsx'),
    );
  });

  it('says what happens with scripting off, instead of failing silently', () => {
    // Asserted against the server-rendered HTML, because that is the only
    // rendering a reader with scripting off ever receives — React deliberately
    // does not materialise `<noscript>` children on the client, so a jsdom
    // render would report an empty element whether or not the copy existed.
    const html = renderToStaticMarkup(<SchengenCalculator locale="en" />);
    expect(html).toContain('<noscript>');
    expect(html).toContain('This counter needs JavaScript');
    expect(html).toContain('the form below will not answer');
  });
});

describe('nothing leaves the device', () => {
  const calls = {
    fetch: vi.fn(),
    xhrOpen: vi.fn(),
    beacon: vi.fn(),
    setItem: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn(),
  };

  beforeEach(() => {
    for (const spy of Object.values(calls)) spy.mockClear();
    vi.stubGlobal('fetch', calls.fetch);
    vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(calls.xhrOpen);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(calls.setItem);
    vi.spyOn(window.history, 'pushState').mockImplementation(calls.pushState);
    vi.spyOn(window.history, 'replaceState').mockImplementation(calls.replaceState);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: calls.beacon,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('makes no request and writes no storage across a full interaction', () => {
    // The claim printed beside the input is meant to be a property of the code
    // rather than an undertaking. This is the test that keeps it one.
    const addressBefore = window.location.href;
    renderCalculator('en');

    fillTrip(1, { country: 'ES', start: '2026-06-01', end: '2026-06-30' });
    submit();
    fireEvent.click(screen.getByRole('button', { name: 'Exactly ninety days' }));
    submit();
    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.addTrip }));
    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.clear }));

    expect(calls.fetch).not.toHaveBeenCalled();
    expect(calls.xhrOpen).not.toHaveBeenCalled();
    expect(calls.beacon).not.toHaveBeenCalled();
    expect(calls.setItem).not.toHaveBeenCalled();
    expect(calls.pushState).not.toHaveBeenCalled();
    expect(calls.replaceState).not.toHaveBeenCalled();
    expect(document.cookie).toBe('');
    expect(window.location.href).toBe(addressBefore);
  });

  it('has no form action, so the browser cannot put the dates in a URL either', () => {
    const { container } = renderCalculator('en');
    const form = container.querySelector('form') as HTMLFormElement;
    expect(form.getAttribute('action')).toBeNull();
    // `noValidate`, because the browser's own bubbles speak the browser's
    // language and never reach the error summary.
    expect(form).toHaveAttribute('noValidate');
  });
});

describe('the error summary', () => {
  function failSubmission(): HTMLElement {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-07-25', end: '2026-07-01' });
    submit();
    return screen.getByRole('alert');
  }

  it('does not exist until a submission fails', () => {
    renderCalculator('en');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('appears, takes focus, and says what happened', () => {
    const summary = failSubmission();
    expect(document.activeElement).toBe(summary);
    expect(summary.textContent).toContain('Nothing was counted, because:');
  });

  it('links each complaint to the control that has to change', () => {
    const summary = failSubmission();
    const link = within(summary).getAllByRole('link')[0] as HTMLAnchorElement;
    const target = link.getAttribute('href')?.slice(1) ?? '';
    expect(target).toBe('sch-stay-1-end');
    // The link is only useful if the id it points at is really on the page.
    expect(document.getElementById(target)).not.toBeNull();
  });

  it('re-announces on a second failed submit rather than sitting silent', () => {
    // Somebody who presses the button again with the same errors otherwise has
    // no way to know whether the press registered.
    const summary = failSubmission();
    (document.getElementById('sch-stay-1-start') as HTMLElement).focus();
    expect(document.activeElement).not.toBe(summary);
    submit();
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });

  it('does not steal focus while somebody is typing', () => {
    failSubmission();
    const field = document.getElementById('sch-stay-1-start') as HTMLInputElement;
    field.focus();
    fireEvent.change(field, { target: { value: '2026-06-01' } });
    expect(document.activeElement).toBe(field);
  });

  it('withholds the answer entirely when the form does not read', () => {
    failSubmission();
    expect(resultRegion()).toBeNull();
  });

  it('clears once the form reads, and moves focus to the answer', () => {
    failSubmission();
    fillTrip(1, { end: '2026-07-26' });
    setReferenceDate('2026-07-26');
    submit();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.activeElement).toBe(resultRegion());
  });
});

describe('every control is announced properly', () => {
  it('gives each field a real label, a stable id, and a stated requirement', () => {
    const { container } = renderCalculator('en');
    const controls = container.querySelectorAll('input, select, textarea');
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      const element = control as HTMLInputElement;
      expect(element.id, element.outerHTML).not.toBe('');
      expect(element.labels?.length, element.id).toBeGreaterThan(0);
      // "required" in words, not a bare asterisk, and `aria-required` rather
      // than the HTML attribute because the form carries `noValidate`.
      expect(element.getAttribute('aria-required'), element.id).toBe('true');
      expect(element.labels?.[0]?.textContent, element.id).toContain('required');
    }
  });

  it('says "obligatorio" on the Spanish document', () => {
    renderCalculator('es');
    const control = screen.getByLabelText(UI_TEXT.es.reference) as HTMLInputElement;
    expect(control.labels?.[0]?.textContent).toContain('obligatorio');
  });

  it('wires the reference field to its hint through aria-describedby', () => {
    renderCalculator('en');
    const control = screen.getByLabelText(UI_TEXT.en.reference);
    const described = (control.getAttribute('aria-describedby') ?? '').split(' ');
    expect(described).toContain('sch-reference-date-hint');
    expect(document.getElementById('sch-reference-date-hint')?.textContent).toContain(
      'no reset date and no annual allowance',
    );
  });

  it('associates an error with its control, and marks the control invalid', () => {
    // A calendar-impossible date cannot be typed into `type="date"` — the
    // control refuses it and hands back the empty string, which is why the
    // malformed-input cases live in `tests/validation.test.ts` and this one
    // exercises the path a person actually reaches: a trip half filled in.
    renderCalculator('en');
    fillTrip(1, { country: 'ES', end: '2026-07-01' });
    submit();

    const field = document.getElementById('sch-stay-1-start') as HTMLInputElement;
    expect(field).toHaveAttribute('aria-invalid', 'true');
    const described = (field.getAttribute('aria-describedby') ?? '').split(' ');
    expect(described).toContain('sch-stay-1-start-error');

    const message = document.getElementById('sch-stay-1-start-error') as HTMLElement;
    expect(message.textContent).toContain('Trip 1');
    expect(message.textContent).toContain('YYYY-MM-DD');
    // Not colour alone: the word "Error" is in the message, beside a glyph that
    // assistive technology is told to ignore.
    expect(message.textContent).toContain('Error');
    expect(message.querySelector('[aria-hidden="true"]')?.textContent).toBe('✕');
  });

  it('drops aria-invalid and the description again once the field is fixed', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', end: '2026-07-01' });
    submit();
    fillTrip(1, { start: '2026-06-01' });
    submit();
    const field = document.getElementById('sch-stay-1-start') as HTMLInputElement;
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(document.getElementById('sch-stay-1-start-error')).toBeNull();
  });

  it('points aria-controls at the result only once the result exists', () => {
    renderCalculator('en');
    const button = screen.getByRole('button', { name: UI_TEXT.en.submit });
    expect(button.getAttribute('aria-controls')).toBeNull();
    fillTrip(1, { country: 'ES', start: '2026-06-01', end: '2026-06-30' });
    submit();
    expect(button).toHaveAttribute('aria-controls', 'sch-result');
    expect(document.getElementById('sch-result')).not.toBeNull();
  });

  it('makes every button an explicit type, so a row action cannot submit the form', () => {
    const { container } = renderCalculator('en');
    for (const button of container.querySelectorAll('button')) {
      expect(['button', 'submit'], button.textContent ?? '').toContain(button.getAttribute('type'));
    }
    const submits = container.querySelectorAll('button[type="submit"]');
    expect(submits).toHaveLength(1);
  });
});

describe('adding and removing trips', () => {
  it('keeps focus in the form when a row is added', () => {
    renderCalculator('en');
    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.addTrip }));
    expect(tripGroup(3)).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('sch-stay-3-country');
  });

  it('never leaves the form with no row to type in', () => {
    // Removing the last row would otherwise drop the caret onto the body and
    // strand a keyboard user at the top of the page.
    renderCalculator('en');
    fireEvent.click(screen.getByRole('button', { name: 'Remove trip 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove trip 1' }));
    expect(tripGroup(1)).toBeInTheDocument();
    expect(document.activeElement?.tagName).toBe('SELECT');
  });

  it('drops stale complaints when a removal renumbers the trips', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES' });
    submit();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove trip 1' }));
    // "Trip 1 — …" would now point at what used to be trip 2.
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('stops at the row limit and says where the reader stands', () => {
    renderCalculator('en');
    const add = () => screen.getByRole('button', { name: UI_TEXT.en.addTrip });
    for (let i = 2; i < MAX_STAYS; i++) fireEvent.click(add());
    expect(screen.getByText(`${MAX_STAYS} of ${MAX_STAYS} rows`)).toBeInTheDocument();
    expect(add()).toBeDisabled();
    expect(tripGroup(MAX_STAYS)).toBeInTheDocument();
  });

  it('resets everything, including a rendered answer', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-06-01', end: '2026-06-30' });
    submit();
    expect(resultRegion()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.clear }));
    expect(resultRegion()).toBeNull();
    expect(screen.getByText(`2 of ${MAX_STAYS} rows`)).toBeInTheDocument();
    expect((document.getElementById('sch-stay-1-country') as HTMLSelectElement).value).toBe('');
  });
});

describe('the worked itineraries offered beside the form', () => {
  it('fills the form in one press and clears the previous answer', () => {
    renderCalculator('en');
    fillTrip(1, { country: 'ES', start: '2026-06-01', end: '2026-06-30' });
    submit();
    fireEvent.click(screen.getByRole('button', { name: 'Three trips, one window' }));
    // The old answer is not left sitting above the new input.
    expect(resultRegion()).toBeNull();
    submit();
    expect(resultText()).toContain('Inside the allowance');
  });

  it('says the itineraries carry no personal data', () => {
    renderCalculator('en');
    expect(
      screen.getByText(/No name, no document number, no date of birth/),
    ).toBeInTheDocument();
  });
});
