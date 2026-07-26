/**
 * One page, one language — and the parts of that which break silently.
 *
 * This site used to render English and Spanish into the same elements. Moving
 * to URL-based locale fixed `<html lang>`, halved the document, and introduced
 * four new ways to be wrong, each of which a reader in the *other* language is
 * the only person who ever notices:
 *
 *  - the document declaring a language it is not written in;
 *  - a switcher that goes to the home page instead of to this page;
 *  - a switcher whose label is in the language the reader is leaving;
 *  - and the one with legal consequence: a translated instrument name, which is
 *    a mis-citation rather than a translation.
 */

import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import RootLayout, { generateStaticParams } from '@/app/[locale]/layout';
import HomePage from '@/app/[locale]/page';
import NoSuchPage from '@/app/[locale]/no-such-page/page';
import { LocaleSwitch } from '@/components/LocaleSwitch';
import { Instrument } from '@/components/Text';
import { LOCALES, LOCALE_ENDONYM, SITE_ALTERNATES, VIEW_IN_LOCALE } from '@/lib/i18n';
import { SCHENGEN_CITATION } from '@/lib/schengen';
import { WORKED_CITATION } from '@/lib/worked-example';
import { SITE_URL } from '@/lib/links';

async function layoutHtml(locale: string): Promise<string> {
  const tree = await RootLayout({
    children: <p id="probe">child</p>,
    params: Promise.resolve({ locale }),
  });
  return renderToStaticMarkup(tree);
}

describe('the document declares the language it is written in', () => {
  it('serves lang="en" at the English address and lang="es" at the Spanish one', async () => {
    expect(await layoutHtml('en')).toContain('<html lang="en">');
    expect(await layoutHtml('es')).toContain('<html lang="es">');
  });

  it('falls back to English rather than emitting a locale nobody asked for', async () => {
    // Unreachable while the middleware is in front of the route, and this is
    // the value that becomes `<html lang>`, so it is a route param treated as
    // attacker-supplied string data until something has looked at it.
    for (const hostile of ['fr', 'ES', 'es-MX', '', 'en-US', '"><script>']) {
      const html = await layoutHtml(hostile);
      expect(html, hostile).toContain('<html lang="en">');
      expect(html, hostile).not.toContain('<script>');
    }
  });

  it('prerenders exactly the two locales it publishes', () => {
    expect(generateStaticParams()).toEqual([{ locale: 'en' }, { locale: 'es' }]);
    expect(LOCALES).toEqual(['en', 'es']);
  });

  it('writes its chrome in the served language', async () => {
    const english = await layoutHtml('en');
    const spanish = await layoutHtml('es');
    expect(english).toContain('Skip to main content');
    expect(spanish).toContain('Saltar al contenido principal');
    expect(spanish).not.toContain('Skip to main content');
  });

  it('puts the skip link first, pointing at a main that exists', async () => {
    const html = await layoutHtml('en');
    expect(html.indexOf('href="#main"')).toBeLessThan(html.indexOf('<header'));
    expect(html).toContain('id="main"');
  });
});

describe('the language switcher', () => {
  it('points at this page in the other language, never at the home page', () => {
    // Sending a reader who is halfway through the day counter back to `/`
    // because they wanted to read it in Spanish loses their place.
    render(<LocaleSwitch locale="en" path="/tools/schengen" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/es/tools/schengen');
  });

  it('removes the prefix going the other way, and never emits an empty href', () => {
    render(<LocaleSwitch locale="es" path="/tools/schengen" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tools/schengen');
  });

  it('carries the query string and fragment across the change', () => {
    render(<LocaleSwitch locale="en" path="/tools?stay=1#result" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/es/tools?stay=1#result');
  });

  it('maps the two roots to each other', () => {
    const { unmount } = render(<LocaleSwitch locale="en" path="/" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/es');
    unmount();
    render(<LocaleSwitch locale="es" path="/" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('names the destination in the destination’s own language', () => {
    // A control labelled "Spanish" is useless to the person who needs it,
    // because that person is not reading English.
    render(<LocaleSwitch locale="en" path="/" />);
    const link = screen.getByRole('link', { name: VIEW_IN_LOCALE.es });
    expect(link).toHaveAttribute('lang', 'es');
    expect(link).toHaveAttribute('hreflang', 'es');
    expect(within(link).getByText(LOCALE_ENDONYM.es)).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows which of the two the reader is currently in', () => {
    render(<LocaleSwitch locale="es" path="/" />);
    const current = screen.getByText(LOCALE_ENDONYM.es, { selector: '[aria-current]' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveAttribute('lang', 'es');
  });

  it('is a real anchor, so it works with scripting off and can be middle-clicked', () => {
    const html = renderToStaticMarkup(<LocaleSwitch locale="en" path="/" />);
    expect(html).toContain('<a ');
    expect(html).not.toContain('<button');
    expect(html).toContain('href="/es"');
    expect(html).not.toContain('onclick');
  });

  it('is a labelled landmark in the language of the page it sits on', () => {
    const { unmount } = render(<LocaleSwitch locale="en" path="/" />);
    expect(screen.getByRole('navigation', { name: 'Language' })).toBeInTheDocument();
    unmount();
    render(<LocaleSwitch locale="es" path="/" />);
    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument();
  });

  it('is wired into the layout at the path this site serves', async () => {
    expect(await layoutHtml('en')).toContain('href="/es"');
    expect(await layoutHtml('es')).toContain('href="/"');
  });
});

describe('an instrument name is not translated, and carries its own language', () => {
  it('renders the Spanish statute title verbatim on the English document', async () => {
    const citation = WORKED_CITATION;
    expect(citation).not.toBeNull();
    if (citation === null) return;

    const tree = await HomePage({ params: Promise.resolve({ locale: 'en' }) });
    const { container } = render(tree);
    const cite = container.querySelector('cite');
    // "Civil Code, art. 22.1" names an instrument that does not exist under
    // that title. A reader who tried to verify it would not find it.
    expect(cite?.textContent).toBe(`${citation.instrument}, ${citation.provision}`);
    expect(cite?.textContent).toContain('Código Civil');
    expect(cite?.getAttribute('lang')).toBe('es');
  });

  it('renders the same string, byte for byte, on the Spanish document', async () => {
    const english = await HomePage({ params: Promise.resolve({ locale: 'en' }) });
    const en = render(english).container.querySelector('cite')?.outerHTML;
    const spanish = await HomePage({ params: Promise.resolve({ locale: 'es' }) });
    const es = render(spanish).container.querySelector('cite')?.outerHTML;
    expect(es).toBe(en);
  });

  it('marks an EU instrument as English wherever it is cited', () => {
    render(<Instrument source={SCHENGEN_CITATION} />);
    const cite = screen.getByText(/Regulation \(EU\) 2016\/399/);
    expect(cite.tagName).toBe('CITE');
    expect(cite).toHaveAttribute('lang', 'en');
  });

  it('emits no lang at all rather than guessing one', () => {
    // Confident wrongness about how to pronounce a source is worse than
    // silence, so an unknown jurisdiction makes no claim.
    const { container } = render(
      <Instrument source={{ instrument: 'Some Act', jurisdiction: 'ZZ' }} />,
    );
    const cite = container.querySelector('cite');
    expect(cite?.getAttribute('lang')).toBeNull();
    expect(cite?.textContent).toBe('Some Act');
  });

  it('prefers a language the citation states over the jurisdiction default', () => {
    const { container } = render(
      <Instrument source={{ instrument: 'Loi sur l’immigration', jurisdiction: 'CA', language: 'fr' }} />,
    );
    expect(container.querySelector('cite')).toHaveAttribute('lang', 'fr');
  });
});

describe('both documents render, and they are different documents', () => {
  it('serves the page in each language', async () => {
    const english = render(await HomePage({ params: Promise.resolve({ locale: 'en' }) }));
    expect(english.container.textContent).toContain('Count your Schengen days');
    english.unmount();

    const spanish = render(await HomePage({ params: Promise.resolve({ locale: 'es' }) }));
    expect(spanish.container.textContent).toContain('Cuente sus días Schengen');
    expect(spanish.container.textContent).not.toContain('Count your Schengen days');
    expect(spanish.container.textContent).not.toContain('Which of these is you?');
  });

  it('leaves ISO codes untranslated and unmarked, because they are the same string', async () => {
    const english = render(await HomePage({ params: Promise.resolve({ locale: 'en' }) }));
    const enChips = Array.from(english.container.querySelectorAll('*'))
      .filter((el) => el.children.length === 0 && /^[A-Z]{2}$/.test(el.textContent ?? ''))
      .map((el) => el.textContent);
    english.unmount();

    const spanish = render(await HomePage({ params: Promise.resolve({ locale: 'es' }) }));
    const esChips = Array.from(spanish.container.querySelectorAll('*'))
      .filter((el) => el.children.length === 0 && /^[A-Z]{2}$/.test(el.textContent ?? ''))
      .map((el) => el.textContent);

    expect(enChips.length).toBeGreaterThan(0);
    expect(esChips).toEqual(enChips);
  });

  it('refuses an unknown address in the language that address was under', async () => {
    const english = render(await NoSuchPage({ params: Promise.resolve({ locale: 'en' }) }));
    expect(english.container.textContent).toContain('That address does not resolve');
    // And it offers a way back into the same locale, not into the other one.
    expect(within(english.container).getByRole('link', { name: 'What Meridian is' })).toHaveAttribute(
      'href',
      '/',
    );
    english.unmount();

    const spanish = render(await NoSuchPage({ params: Promise.resolve({ locale: 'es' }) }));
    expect(spanish.container.textContent).toContain('Esa dirección no existe');
    expect(within(spanish.container).getByRole('link', { name: 'Qué es Meridian' })).toHaveAttribute(
      'href',
      '/es',
    );
  });
});

describe('the alternates a search engine reads', () => {
  it('declares both variants and an x-default, as absolute URLs', () => {
    expect(SITE_ALTERNATES).toEqual({
      en: `${SITE_URL}/`,
      es: `${SITE_URL}/es`,
      'x-default': `${SITE_URL}/`,
    });
    for (const url of Object.values(SITE_ALTERNATES)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });
});
