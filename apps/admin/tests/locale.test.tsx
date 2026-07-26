/**
 * The locale system.
 *
 * English is unprefixed and Spanish lives at `/es`, so "add the locale" and
 * "remove the locale" are not inverses — which is why every path in this console
 * goes through the helpers rather than through a `startsWith('/es')` written
 * three times.
 *
 * The switcher is the part that breaks silently. It has to point at *this* page
 * in the other language, carrying the query string and the as-at override.
 * Sending a reader to the home page because they wanted to read in Spanish loses
 * their place and everything they typed, and is the single most common defect in
 * a language switcher.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const routerState = { pathname: '/en/audit', search: 'kind=disclosure_downgraded&asOf=2025-04-02' };

vi.mock('next/navigation', () => ({
  usePathname: () => routerState.pathname,
  useSearchParams: () => new URLSearchParams(routerState.search),
}));

const { LocaleSwitch } = await import('@/components/locale-switch');
const {
  DEFAULT_LOCALE,
  LANG_ATTR,
  LOCALES,
  LOCALE_ENDONYM,
  LOCALE_SWITCH_LABEL,
  htmlLang,
  linker,
  localeAlternates,
  parseLocale,
  publicPath,
  relativeDays,
  servedLocale,
} = await import('@/lib/i18n');
const { resolveAsOf } = await import('@/lib/clock');

afterEach(cleanup);

describe('publicPath', () => {
  it('strips the internal rewrite prefix the router may hand over', () => {
    // `/en/...` is never a public URL of this application, so a leading `/en`
    // can only be the middleware's rewrite.
    expect(publicPath('/en/matters')).toBe('/matters');
    expect(publicPath('/en')).toBe('/');
  });

  it('leaves a Spanish path and an ordinary English path alone', () => {
    expect(publicPath('/es/matters')).toBe('/es/matters');
    expect(publicPath('/matters')).toBe('/matters');
  });

  it('does not mistake a path that merely starts with the letters for a locale', () => {
    // `/estimate` is not Spanish and `/english` is not the rewrite prefix.
    expect(publicPath('/estimate')).toBe('/estimate');
    expect(publicPath('/english')).toBe('/english');
  });

  it('renders an absent path as the root rather than as an empty href', () => {
    // An empty `href` reloads the current URL, which is a link that appears to
    // do nothing.
    expect(publicPath(null)).toBe('/');
    expect(publicPath(undefined)).toBe('/');
    expect(publicPath('')).toBe('/');
  });
});

describe('servedLocale', () => {
  it('reads the locale the middleware attached', () => {
    expect(servedLocale('es')).toBe('es');
    expect(servedLocale('en')).toBe('en');
  });

  it('renders in some language rather than failing when the header is absent', () => {
    // The 404 page and the root layout have no route params. Throwing here
    // would replace a translated 404 with a framework error shell.
    expect(servedLocale(null)).toBe(DEFAULT_LOCALE);
    expect(servedLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(servedLocale('de')).toBe(DEFAULT_LOCALE);
  });
});

describe('linker', () => {
  it('carries both the locale and the as-at override across a link', () => {
    // Dropping the first sends a Spanish reader into an English page; dropping
    // the second silently snaps a caseload rendered as at 2025 back to today.
    const asOf = resolveAsOf('2025-04-02');
    expect(linker('es', asOf)('/matters')).toBe('/es/matters?asOf=2025-04-02');
    expect(linker('en', asOf)('/matters')).toBe('/matters?asOf=2025-04-02');
  });

  it('adds no parameter when the reader has not overridden the date', () => {
    const asOf = resolveAsOf(undefined);
    expect(linker('es', asOf)('/catalog/es-fixture-route')).toBe('/es/catalog/es-fixture-route');
  });

  it('is idempotent on an already-localised path', () => {
    const asOf = resolveAsOf(undefined);
    expect(linker('es', asOf)('/es/matters')).toBe('/es/matters');
  });
});

describe('localeAlternates', () => {
  it('emits absolute hreflang alternates including x-default', () => {
    // Search engines reject relative `hreflang` values.
    const alternates = localeAlternates('/matters');
    expect(alternates.canonical).toBe('https://meridian-admin.madfam.io/matters');
    expect(alternates.languages[LANG_ATTR.en]).toBe('https://meridian-admin.madfam.io/matters');
    expect(alternates.languages[LANG_ATTR.es]).toBe('https://meridian-admin.madfam.io/es/matters');
    expect(alternates.languages['x-default']).toBe(alternates.canonical);
  });

  it('does not publish one reader’s query string as a page', () => {
    expect(localeAlternates('/matters?q=okonkwo').canonical).toBe(
      'https://meridian-admin.madfam.io/matters',
    );
  });
});

describe('htmlLang', () => {
  it('gives each locale a distinct BCP 47 tag for <html lang>', () => {
    const tags = LOCALES.map((locale) => htmlLang(locale));
    expect(new Set(tags).size).toBe(LOCALES.length);
    for (const tag of tags) expect(tag.length).toBeGreaterThan(0);
  });

  it('agrees with the tag the switcher puts on its own link', () => {
    for (const locale of LOCALES) expect(LANG_ATTR[locale]).toBe(htmlLang(locale));
  });
});

describe('parseLocale', () => {
  it('accepts only the locales this console serves', () => {
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('es')).toBe('es');
    expect(parseLocale('fr')).toBeNull();
    expect(parseLocale('../etc')).toBeNull();
    expect(parseLocale(null)).toBeNull();
  });
});

describe('relativeDays', () => {
  it('says today rather than "in 0 days", in both languages', () => {
    // A deadline falling today is the one a practitioner most needs to read
    // correctly at a glance.
    expect(relativeDays('en', 0)).toBe('today');
    expect(relativeDays('es', 0)).toBe('hoy');
  });

  it('distinguishes ahead from behind with each language’s own word order', () => {
    expect(relativeDays('en', 5)).toBe('in 5 days');
    expect(relativeDays('en', -5)).toBe('5 days ago');
    expect(relativeDays('es', 5)).toBe('dentro de 5 días');
    expect(relativeDays('es', -5)).toBe('hace 5 días');
  });

  it('never renders a negative number to the reader', () => {
    for (const locale of LOCALES) {
      for (const days of [-1, -5, -365]) {
        expect(relativeDays(locale, days)).not.toContain('-');
      }
    }
  });

  it('handles the singular days either side of today', () => {
    expect(relativeDays('en', 1)).toBe('tomorrow');
    expect(relativeDays('en', -1)).toBe('yesterday');
    expect(relativeDays('es', 1)).toBe('mañana');
    expect(relativeDays('es', -1)).toBe('ayer');
  });
});

describe('the language switcher', () => {
  it('points at the same page in the other language, not at the home page', () => {
    routerState.pathname = '/en/audit';
    routerState.search = 'kind=disclosure_downgraded&asOf=2025-04-02';
    render(<LocaleSwitch />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe(
      '/es/audit?kind=disclosure_downgraded&asOf=2025-04-02',
    );
  });

  it('carries a reader’s filters and reference date across the change', () => {
    // A practitioner three filters deep, rendered as at a date in 2025, must
    // arrive at exactly that view in the other language.
    routerState.pathname = '/es/matters';
    routerState.search = 'state=live&rep=unassigned&asOf=2025-04-02';
    render(<LocaleSwitch />);
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/matters?state=live&rep=unassigned&asOf=2025-04-02',
    );
  });

  it('is a real link, so it works with scripting disabled', () => {
    // Not a button, not a select, not a cookie write. The `href` is in the HTML
    // a browser receives, and a reader can copy it or open it in a new tab.
    routerState.pathname = '/en';
    routerState.search = '';
    const { container } = render(<LocaleSwitch />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/es');
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
  });

  it('announces itself in the language it switches to', () => {
    // A control labelled "Spanish" is no use to the person who needs it.
    routerState.pathname = '/en/catalog';
    routerState.search = '';
    render(<LocaleSwitch />);
    const link = screen.getByRole('link', { name: LOCALE_SWITCH_LABEL.es });
    expect(link.textContent).toBe(LOCALE_ENDONYM.es);
    expect(link.getAttribute('lang')).toBe(LANG_ATTR.es);
    expect(link.getAttribute('hreflang')).toBe(LANG_ATTR.es);
  });

  it('keeps the accessible name containing the visible text', () => {
    // WCAG's label-in-name requirement: a voice-control user says what they
    // can see.
    routerState.pathname = '/es/catalog';
    routerState.search = '';
    render(<LocaleSwitch />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toContain(link.textContent ?? '');
  });

  it('adds no second navigation landmark', () => {
    // The console's contract is one of each landmark. A switcher that wrapped
    // itself in a `<nav>` would give the page two.
    routerState.pathname = '/en';
    routerState.search = '';
    const { container } = render(<LocaleSwitch />);
    expect(container.querySelector('nav')).toBeNull();
  });
});
