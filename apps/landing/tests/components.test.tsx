/**
 * The vocabulary the page is written in.
 *
 * Each of these is small enough that a bug in it looks like nothing in review
 * and reaches every screen at once: a badge that carries its meaning in hue, a
 * callout that is a coloured rectangle rather than an entry in the document
 * outline, an error summary that appears and never takes focus, a second
 * `banner` landmark that lies about where the top of the page is.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { Badge, Chip, PlainBadge, type Tone } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { ErrorSummary } from '@/components/ErrorSummary';
import { Button, DateField, SelectField } from '@/components/Field';
import { ActionLink, PageHeader, Section } from '@/components/Layout';
import { Instrument, Lang, Prose } from '@/components/Text';
import { bi } from '@/lib/i18n';
import { cx, plural } from '@/lib/ui';
import { issue } from '@/lib/validation';

const TONES: readonly Tone[] = ['ok', 'warn', 'bad', 'info', 'review', 'neutral', 'accent'];

describe('status is never carried by colour alone', () => {
  it('gives every tone its own glyph, so a badge survives greyscale', () => {
    // Roughly one man in twelve has a colour vision deficiency, and "built"
    // versus "refused" is not something anyone should infer from hue.
    const glyphs = TONES.map((tone) => {
      const { container, unmount } = render(<Badge tone={tone} label="Status" />);
      const glyph = container.querySelector('[aria-hidden="true"]')?.textContent ?? '';
      unmount();
      return glyph;
    });
    expect(new Set(glyphs).size).toBe(TONES.length);
    expect(glyphs.every((g) => g.length > 0)).toBe(true);
  });

  it('hides the glyph from assistive technology and keeps the word', () => {
    render(<Badge tone="bad" label="Over the allowance" />);
    const label = screen.getByText('Over the allowance');
    expect(label).toBeInTheDocument();
    const glyph = label.parentElement?.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toBe('✕');
  });

  it('applies a distinct class per tone, so the styling is not the meaning', () => {
    const classes = TONES.map((tone) => {
      const { container, unmount } = render(<Badge tone={tone} label="x" />);
      const className = container.firstElementChild?.className ?? '';
      unmount();
      return className;
    });
    expect(new Set(classes).size).toBe(TONES.length);
  });

  it('renders an untranslated value through PlainBadge without losing the glyph', () => {
    render(<PlainBadge tone="info">ES</PlainBadge>);
    expect(screen.getByText('ES')).toBeInTheDocument();
  });

  it('renders a chip with no status meaning at all', () => {
    const { container } = render(<Chip>CA</Chip>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(container.textContent).toBe('CA');
  });
});

describe('a callout is part of the document outline', () => {
  it('is a note rather than an alert — a limitation is not an error condition', () => {
    render(
      <Callout tone="warn" title="What is not built">
        <Prose>Body</Prose>
      </Callout>,
    );
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('takes its heading level from its position, not from its size', () => {
    // The one callout sitting directly under the page title has to be an h2, or
    // the outline jumps from h1 to h3 and a screen-reader user is told there is
    // a level missing between them.
    const { unmount } = render(<Callout tone="info" title="Top level" level={2}>x</Callout>);
    expect(screen.getByRole('heading', { level: 2, name: 'Top level' })).toBeInTheDocument();
    unmount();
    render(<Callout tone="info" title="Inside a section">x</Callout>);
    expect(screen.getByRole('heading', { level: 3, name: 'Inside a section' })).toBeInTheDocument();
  });

  it('keeps a decorative icon out of the accessible name', () => {
    render(<Callout tone="bad" icon="✕" title="Refused">x</Callout>);
    // The icon is inside the heading but hidden, so the heading is named by its
    // words rather than by punctuation read aloud.
    expect(screen.getByRole('heading', { name: 'Refused' })).toBeInTheDocument();
  });
});

describe('the error summary', () => {
  const issues = [
    issue('field-a', bi('Trip 1 — choose the State', 'Viaje 1 — elija el Estado')),
    issue('field-b', bi('Trip 2 — enter a date', 'Viaje 2 — introduzca una fecha')),
  ];

  it('renders nothing at all when there is nothing to say', () => {
    const { container } = render(<ErrorSummary locale="en" issues={[]} focusKey={3} />);
    expect(container.firstChild).toBeNull();
  });

  it('is an alert, so a reader whose focus moved still hears the failure', () => {
    render(<ErrorSummary locale="en" issues={issues} focusKey={1} />);
    const summary = screen.getByRole('alert');
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(summary.getAttribute('aria-labelledby')).toBe('sch-error-summary-heading');
    expect(document.getElementById('sch-error-summary-heading')?.textContent).toContain(
      'Nothing was counted, because:',
    );
  });

  it('does not grab focus before a submission has failed', () => {
    // `focusKey` starts at zero. A summary that focused on mount would steal the
    // caret from a reader who had not pressed anything.
    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    anchor.focus();
    render(<ErrorSummary locale="en" issues={issues} focusKey={0} />);
    expect(document.activeElement).toBe(anchor);
    anchor.remove();
  });

  it('links each entry to the control it belongs to', () => {
    render(<ErrorSummary locale="en" issues={issues} focusKey={1} />);
    const links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#field-a', '#field-b']);
  });

  it('resolves each message to the served locale, once', () => {
    render(<ErrorSummary locale="es" issues={issues} focusKey={1} />);
    const text = screen.getByRole('alert').textContent ?? '';
    expect(text).toContain('Viaje 1 — elija el Estado');
    expect(text).not.toContain('Trip 1');
  });

  it('lists the issues in the order they were given', () => {
    render(<ErrorSummary locale="en" issues={issues} focusKey={1} />);
    const items = within(screen.getByRole('alert')).getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Trip 1');
    expect(items[1]?.textContent).toContain('Trip 2');
  });
});

describe('form controls', () => {
  it('associates a label with a real control, not a placeholder', () => {
    render(
      <DateField
        id="d1"
        locale="en"
        label="Day you arrived"
        value="2026-07-25"
        onChange={() => undefined}
        required
      />,
    );
    const control = screen.getByLabelText(/Day you arrived/) as HTMLInputElement;
    expect(control.type).toBe('date');
    expect(control.getAttribute('placeholder')).toBeNull();
    expect(control).toHaveAttribute('aria-required', 'true');
    expect(control.getAttribute('aria-invalid')).toBeNull();
  });

  it('exchanges its value as YYYY-MM-DD, with no Date anywhere in the exchange', () => {
    const onChange = vi.fn();
    render(
      <DateField id="d2" locale="en" label="Day you left" value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/Day you left/), { target: { value: '2024-02-29' } });
    expect(onChange).toHaveBeenCalledWith('2024-02-29');
    expect(onChange.mock.calls[0]?.[0]).toBeTypeOf('string');
  });

  it('describes a control by its hint and its error together', () => {
    render(
      <DateField
        id="d3"
        locale="en"
        label="Measure the window ending on"
        hint="Set today if you are reading later."
        error="Enter a date in YYYY-MM-DD form."
        value=""
        onChange={() => undefined}
      />,
    );
    const control = screen.getByLabelText(/Measure the window/);
    expect(control.getAttribute('aria-describedby')).toBe('d3-hint d3-error');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('d3-hint')).not.toBeNull();
    expect(document.getElementById('d3-error')?.textContent).toContain('Error');
  });

  it('states the requirement in words in the served language', () => {
    const { unmount } = render(
      <SelectField
        id="s1"
        locale="es"
        label="Estado"
        value=""
        onChange={() => undefined}
        options={[{ value: '', label: 'Elija un Estado' }]}
        required
      />,
    );
    expect(screen.getByLabelText(/Estado/).closest('div')?.textContent).toContain('obligatorio');
    unmount();
  });

  it('defaults a button to type=button, so a row action cannot submit a form', () => {
    // "Remove trip 2" silently running the whole calculation is the classic
    // version of this bug.
    render(<Button label="Remove trip 2" />);
    expect(screen.getByRole('button', { name: 'Remove trip 2' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('sets aria-controls only when it was given a target', () => {
    const { unmount } = render(<Button label="Count" />);
    expect(screen.getByRole('button').getAttribute('aria-controls')).toBeNull();
    unmount();
    render(<Button label="Count" controls="sch-result" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'sch-result');
  });
});

describe('layout primitives', () => {
  it('does not create a second banner landmark inside main', () => {
    // Chrome maps a `header` inside `main` to the banner landmark, and the site
    // already has one around the masthead.
    const html = renderToStaticMarkup(<PageHeader title="Count your Schengen days" />);
    expect(html).not.toContain('<header');
    expect(html).toContain('<h1>');
  });

  it('names a section landmark by its own heading', () => {
    render(
      <Section id="coverage" title="What the catalog does not cover">
        <p>x</p>
      </Section>,
    );
    const section = screen.getByRole('region', { name: 'What the catalog does not cover' });
    expect(section).toHaveAttribute('id', 'coverage');
    expect(section.getAttribute('aria-labelledby')).toBe('coverage-heading');
    expect(document.getElementById('coverage-heading')?.tagName).toBe('H2');
  });

  it('severs the reference back when it opens a new tab, and not otherwise', () => {
    const { unmount } = render(<ActionLink href="https://example.org" label="Read" newTab />);
    const external = screen.getByRole('link');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external.getAttribute('rel')).toContain('noopener');
    unmount();
    render(<ActionLink href="/tools" label="Open" />);
    expect(screen.getByRole('link').getAttribute('target')).toBeNull();
  });
});

describe('text primitives', () => {
  it('renders resolved prose as a paragraph', () => {
    const { container } = render(<Prose>Already chosen.</Prose>);
    expect(container.querySelector('p')?.textContent).toBe('Already chosen.');
  });

  it('marks a run of text in a language that is not the document’s', () => {
    const { container } = render(<Lang code="en">unreviewed_rule</Lang>);
    expect(container.firstElementChild).toHaveAttribute('lang', 'en');
  });

  it('renders an instrument as a cite, with the provision appended', () => {
    const { container } = render(
      <Instrument source={{ instrument: 'Código Civil (España)', provision: 'art. 22.1', jurisdiction: 'ES' }} />,
    );
    const cite = container.querySelector('cite');
    expect(cite?.textContent).toBe('Código Civil (España), art. 22.1');
    expect(cite).toHaveAttribute('lang', 'es');
  });

  it('omits the provision cleanly when there is none', () => {
    const { container } = render(
      <Instrument source={{ instrument: 'Immigration and Refugee Protection Act', jurisdiction: 'CA' }} />,
    );
    expect(container.querySelector('cite')?.textContent).toBe(
      'Immigration and Refugee Protection Act',
    );
  });
});

describe('presentation helpers', () => {
  it('drops falsy class names rather than emitting "undefined"', () => {
    // CSS Modules are typed as an index signature, so `styles.foo` is
    // `string | undefined` under `noUncheckedIndexedAccess`.
    expect(cx('a', undefined, null, false, '', 'b')).toBe('a b');
    expect(cx()).toBe('');
  });

  it('agrees with the caller’s own nouns on the singular', () => {
    expect(plural(1, 'day', 'days')).toBe('1 day');
    expect(plural(0, 'day', 'days')).toBe('0 days');
    expect(plural(2, 'día', 'días')).toBe('2 días');
  });
});
