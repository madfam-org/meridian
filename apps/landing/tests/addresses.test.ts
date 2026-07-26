/**
 * Which addresses this site answers, and what it says at the ones it does not.
 *
 * Two documents exist: `/` in English and `/es` in Spanish. Everything else is
 * a 404 in the language the address was under. The failure modes are all quiet
 * ones — a canonical link on a not-found page telling a crawler that a mistyped
 * address *is* the home page, a matcher that turns `/sitemap.xml` into a 404, a
 * locale prefix that swallows `/estimate` — so each is asserted rather than
 * assumed.
 */

import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { generateMetadata as pageMetadata } from '@/app/[locale]/page';
import { generateMetadata as notFoundMetadata } from '@/app/[locale]/no-such-page/page';
import { config, middleware } from '@/middleware';
import { SITE_ALTERNATES } from '@/lib/i18n';
import { PORTAL_URL, REPO_URL, SITE_URL } from '@/lib/links';

function request(path: string): NextRequest {
  return new NextRequest(new URL(`${SITE_URL}${path}`));
}

function rewriteOf(path: string): { status: number; destination: string | null } {
  const response = middleware(request(path));
  return { status: response.status, destination: response.headers.get('x-middleware-rewrite') };
}

describe('the two addresses the site serves', () => {
  it('passes the English and Spanish documents straight through', () => {
    for (const path of ['/', '/es', '/es/', '/?ref=x']) {
      expect(rewriteOf(path), path).toEqual({ status: 200, destination: null });
    }
  });
});

describe('everything else refuses, in the reader’s own language', () => {
  it('refuses an unprefixed address in English', () => {
    expect(rewriteOf('/pricing')).toEqual({
      status: 404,
      destination: `${SITE_URL}/en/no-such-page`,
    });
  });

  it('refuses a Spanish-prefixed address in Spanish', () => {
    expect(rewriteOf('/es/precios')).toEqual({
      status: 404,
      destination: `${SITE_URL}/es/no-such-page`,
    });
  });

  it('treats /estimate as English, not as a Spanish path with a strange remainder', () => {
    // The prefix match is on segment boundaries. `startsWith('/es')` gets this
    // wrong, and it is the reason the path helpers are a shared package.
    for (const path of ['/estimate', '/españa', '/escalation', '/es-MX']) {
      expect(rewriteOf(path).destination, path).toBe(`${SITE_URL}/en/no-such-page`);
    }
  });

  it('refuses the not-found route by name, like any other address', () => {
    expect(rewriteOf('/no-such-page').status).toBe(404);
    expect(rewriteOf('/es/no-such-page')).toEqual({
      status: 404,
      destination: `${SITE_URL}/es/no-such-page`,
    });
  });

  it('rewrites rather than redirects, so the reader keeps the address they typed', () => {
    const response = middleware(request('/pricing'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.status).toBe(404);
  });

  it('leaves the metadata routes and Next’s own output alone', () => {
    expect(config.matcher).toHaveLength(1);
    const pattern = new RegExp(`^${config.matcher[0] as string}$`);
    for (const path of ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/icon.svg', '/_next/x']) {
      // A 404 on `/robots.txt` is how a site quietly stops being crawlable.
      expect(pattern.test(path), path).toBe(false);
    }
    for (const path of ['/', '/es', '/pricing']) {
      expect(pattern.test(path), path).toBe(true);
    }
  });
});

describe('what a crawler is told', () => {
  it('gives each locale its own canonical, and both the same alternates', async () => {
    const english = await pageMetadata({ params: Promise.resolve({ locale: 'en' }) });
    const spanish = await pageMetadata({ params: Promise.resolve({ locale: 'es' }) });
    expect(english.alternates?.canonical).toBe('/');
    expect(spanish.alternates?.canonical).toBe('/es');
    expect(english.alternates?.languages).toEqual(SITE_ALTERNATES);
    expect(spanish.alternates?.languages).toEqual(SITE_ALTERNATES);
  });

  it('refuses to canonicalise an address it does not serve', async () => {
    // A canonical of `/` on a page that failed to resolve tells a crawler the
    // address it could not find is the home page — the one thing a 404 exists
    // to deny.
    const bogus = await pageMetadata({ params: Promise.resolve({ locale: 'fr' }) });
    expect(bogus.alternates).toBeUndefined();
    expect(bogus.robots).toEqual({ index: false, follow: false });
  });

  it('keeps the not-found document out of the index and carries no canonical', async () => {
    for (const locale of ['en', 'es']) {
      const metadata = await notFoundMetadata({ params: Promise.resolve({ locale }) });
      expect(metadata.alternates, locale).toBeUndefined();
      expect(metadata.robots, locale).toEqual({ index: false, follow: true });
      expect(String(metadata.title), locale).toContain('Meridian');
    }
  });

  it('lists both documents in the sitemap, each declaring the other', () => {
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual([`${SITE_URL}/`, `${SITE_URL}/es`]);
    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual(SITE_ALTERNATES);
      // No `lastModified` and no `priority`: neither could be filled in
      // honestly from here, and a build clock would claim a change on every
      // deploy whether or not a word had moved.
      expect(entry.lastModified).toBeUndefined();
      expect(entry.priority).toBeUndefined();
    }
  });

  it('does not list the not-found address as something to index', () => {
    expect(sitemap().some((e) => e.url.includes('no-such-page'))).toBe(false);
  });

  it('allows crawlers in full and advertises the sitemap', () => {
    const rules = robots();
    expect(rules.rules).toEqual([{ userAgent: '*', allow: '/' }]);
    expect(rules.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe('the hosts this site links to', () => {
  it('keeps each destination flat under madfam.io, with no nested subdomain', () => {
    // Cloudflare universal SSL covers one label, so every Meridian host is flat.
    for (const url of [SITE_URL, PORTAL_URL]) {
      const host = new URL(url).hostname;
      expect(host.endsWith('.madfam.io'), host).toBe(true);
      expect(host.split('.'), host).toHaveLength(3);
    }
    expect(SITE_URL).toBe('https://meridian.madfam.io');
    expect(PORTAL_URL).toBe('https://meridian-app.madfam.io');
    expect(REPO_URL).toBe('https://github.com/madfam-org/meridian');
  });
});
