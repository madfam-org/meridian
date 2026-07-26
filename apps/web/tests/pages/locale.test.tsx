/**
 * URL-based locale, as it reaches a reader.
 *
 * This portal used to render English and Spanish into the same elements. A
 * screen-reader user heard every sentence twice, the document was about twice as
 * long as it needed to be, and `<html lang>` could not be honest because the
 * document was two languages at once. Now English is unprefixed, Spanish lives
 * under `/es`, both are prerendered, and one switcher moves between them.
 *
 * The failures on that seam are all quiet:
 *
 *  - a switcher that sends a reader halfway through the day counter back to the
 *    home page, losing everything they typed;
 *  - an `<html lang>` that does not match the words on the page;
 *  - and the one that is a mis-citation rather than a translation: a legal
 *    instrument rendered in the language of the page instead of its own.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import type { Citation } from '@meridian/core';
import { isoDate } from '@meridian/core';

const ROUTED_PATH = '/en/tools/schengen';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/navigation');
  return { ...actual, usePathname: () => ROUTED_PATH };
});

import { LOCALES, LOCALE_ENDONYM, VIEW_IN_LOCALE, htmlLang } from '@/lib/i18n';
import { SELF_URL } from '@/lib/links';
import LocaleLayout, { generateMetadata, generateStaticParams } from '@/app/[locale]/layout';
import { generateMetadata as schengenMetadata } from '@/app/[locale]/tools/schengen/page';
import { LocaleSwitch } from '@/components/LocaleSwitch';
import { InstrumentName } from '@/components/Citations';
import { ROUTES } from '../support/routes';

const CIVIL_CODE: Citation = {
  id: 'es-cc-art-22-1',
  kind: 'statute',
  instrument: 'Código Civil (España)',
  provision: 'art. 22.1',
  jurisdiction: 'ES',
  verifiedOn: isoDate('2026-07-25'),
};

const IRPA: Citation = {
  id: 'ca-irpa-s91',
  kind: 'statute',
  instrument: 'Immigration and Refugee Protection Act',
  provision: 's. 91(2)',
  jurisdiction: 'CA',
  verifiedOn: isoDate('2026-07-25'),
};

describe('the document shell', () => {
  it('publishes both locales as separate prerendered documents', () => {
    expect(generateStaticParams()).toEqual([{ locale: 'en' }, { locale: 'es' }]);
    expect(LOCALES).toHaveLength(2);
  });

  it('declares the language the document is actually written in', async () => {
    for (const locale of LOCALES) {
      const element = (await LocaleLayout({
        children: null,
        params: Promise.resolve({ locale }),
      })) as ReactElement<{ lang: string }>;

      expect(element.type).toBe('html');
      expect(element.props.lang).toBe(htmlLang(locale));
    }
  });

  it('names the other language as an alternate rather than folding it in', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'es' }) });

    // One document, one language, declared as the same tag `<html lang>`
    // carries — with the other named as an alternate rather than folded in.
    expect(metadata.openGraph?.locale).toBe(htmlLang('es'));
    expect(metadata.openGraph?.alternateLocale).toEqual([htmlLang('en')]);
    expect(metadata.alternates?.canonical).toBe(`${SELF_URL}/es`);
    expect(metadata.alternates?.languages?.en).toBe(`${SELF_URL}/`);
    expect(metadata.alternates?.languages?.['x-default']).toBe(`${SELF_URL}/`);
  });

  it('gives each route its own alternates, not the layout’s', async () => {
    // A layout cannot know which path is rendered beneath it, so a page that
    // did not declare its own would publish the home page as its canonical.
    const english = await schengenMetadata({ params: Promise.resolve({ locale: 'en' }) });
    const spanish = await schengenMetadata({ params: Promise.resolve({ locale: 'es' }) });

    expect(english.alternates?.canonical).toBe(`${SELF_URL}/tools/schengen`);
    expect(spanish.alternates?.canonical).toBe(`${SELF_URL}/es/tools/schengen`);
    expect(english.alternates?.languages?.es).toBe(`${SELF_URL}/es/tools/schengen`);
  });
});

describe('the language switcher', () => {
  it('points at this page in the other language, never at the home page', () => {
    // Sending a reader who is halfway through the day counter back to `/`
    // because they wanted to read it in Spanish loses their place and
    // everything they typed.
    render(<LocaleSwitch locale="en" />);
    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', '/es/tools/schengen');
    expect(link.getAttribute('href')).not.toBe('/');
  });

  it('undoes the middleware rewrite before building the target', () => {
    // `usePathname` reports `/en/tools/schengen` during prerender. `/en` is not
    // a public path — recognising it as a locale prefix would publish every
    // page twice.
    render(<LocaleSwitch locale="en" />);

    expect(screen.getByRole('link').getAttribute('href')?.startsWith('/en')).toBe(false);
  });

  it('is a real link, so it works before JavaScript arrives', () => {
    // A button with an onClick would not be crawlable, would not middle-click
    // into a tab, and would ask React to patch `<html lang>` on a live
    // document.
    const { container } = render(<LocaleSwitch locale="es" />);
    const link = container.querySelector('a');

    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/tools/schengen');
  });

  it('names each language in itself, and marks the current one', () => {
    // A control labelled "Spanish" is useless to the person who needs it,
    // because that person is not reading English.
    const { container } = render(<LocaleSwitch locale="en" />);
    const current = container.querySelector('[aria-current="true"]');
    const link = screen.getByRole('link');

    expect(current?.textContent).toBe(LOCALE_ENDONYM.en);
    expect(current?.getAttribute('lang')).toBe('en');
    expect(link).toHaveAttribute('lang', 'es');
    expect(link).toHaveAttribute('hreflang', 'es');
    expect(link).toHaveAccessibleName(VIEW_IN_LOCALE.es);
  });

  it('is a landmark with a name in the served language', () => {
    render(<LocaleSwitch locale="es" />);
    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument();
  });
});

describe('a legal instrument’s name', () => {
  it('is never translated, and carries its own language on an English page', () => {
    // "Civil Code, art. 22.1" is not a translation but a mis-citation: it names
    // an instrument that does not exist under that title, and a person trying
    // to verify it will not find it.
    const { container } = render(<InstrumentName citation={CIVIL_CODE} />);
    const cite = container.querySelector('cite');

    expect(cite?.textContent).toBe('Código Civil (España), art. 22.1');
    expect(cite?.getAttribute('lang')).toBe('es');
    expect(container.textContent).not.toContain('Civil Code');
  });

  it('works in the other direction too, which is why it takes no locale', () => {
    // A Spanish page quoting an English statute would otherwise have a screen
    // reader pronounce English words with Spanish phonetics.
    const { container } = render(<InstrumentName citation={IRPA} />);
    const cite = container.querySelector('cite');

    expect(cite?.getAttribute('lang')).toBe('en');
    expect(cite?.textContent).toContain('Immigration and Refugee Protection Act');
  });

  it('appears untranslated inside an English page that cites it', async () => {
    // The whole point, checked where it actually renders rather than in
    // isolation: a Spanish instrument name inside an English document.
    const route = ROUTES.find((r) => r.path === '/pathways/[id]');
    if (route === undefined) throw new Error('no pathway detail route');
    const { container } = render(await route.mount('en'));

    const cites = [...container.querySelectorAll('cite')];
    const spanish = cites.filter((c) => c.getAttribute('lang') === 'es');

    expect(spanish.length).toBeGreaterThan(0);
    expect(spanish.some((c) => (c.textContent ?? '').startsWith('Código Civil'))).toBe(true);
  });
});

describe('both locales render every route', () => {
  for (const route of ROUTES) {
    it(`${route.path} renders in Spanish with its own words`, async () => {
      const { container: spanish } = render(await route.mount('es'));
      const spanishText = spanish.textContent ?? '';
      document.body.innerHTML = '';

      const { container: english } = render(await route.mount('en'));
      const englishText = english.textContent ?? '';

      // Not merely non-empty: actually different, so a page that forgot to
      // resolve its `Bi` values fails here.
      expect(spanishText.length).toBeGreaterThan(200);
      expect(spanishText).not.toBe(englishText);
    });
  }
});
