import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Locale } from '@/lib/i18n';
import {
  LANG_ATTR,
  LOCALES,
  UI,
  htmlLang,
  localizedPath,
  otherLocale,
  translator,
} from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { LocaleSwitch } from '@/components/LocaleSwitch';
import { NavLink } from '@/components/NavLink';
import { REPO_URL, SELF_URL } from '@/lib/links';

import '../globals.css';
import styles from './layout.module.css';

/**
 * The document shell, and this application's root layout.
 *
 * Every route lives under `[locale]`, so this is where `<html>` and `<body>`
 * are — which is the point of the whole arrangement. `lang` has to be the
 * language the document is actually written in, and before this change it could
 * not be: the page was two languages at once and `lang="en"` was a claim about
 * half of it.
 *
 * That has one known cost, recorded here rather than discovered later. Next
 * renders `app/not-found.tsx` for an address that matched no route, and such an
 * address has no locale segment — so a root `not-found.tsx` would need a root
 * layout *outside* `[locale]`, and that layout could not know which language to
 * put on `<html>` without either giving up static generation or lying on every
 * page. A truthful `lang` on the ~170 pages a reader actually visits is worth
 * more than a styled page on the one they reach by mistyping a URL, so an
 * unmatched address gets a correct `404` status and Next's own plain document.
 * `notFound()` from inside a page — an unknown matter or pathway id — lands
 * there too.
 *
 * `generateStaticParams` publishes both variants, so `/pricing` and
 * `/es/pricing` are two prerendered documents rather than one document that
 * decides at request time. `middleware.ts` maps the public address onto the
 * routed one.
 *
 * The landmark structure — `banner`, `navigation`, `main`, `contentinfo` — is
 * real, not decorative, and the skip link is the first focusable thing on the
 * page. A portal that tells someone whether they have overstayed has to be
 * usable by someone who cannot use a mouse.
 */

export function generateStaticParams(): LocaleParams[] {
  return LOCALES.map((locale) => ({ locale }));
}

const TITLE: Record<Locale, string> = {
  en: 'Meridian — applicant portal',
  es: 'Meridian — portal del solicitante',
};

const DESCRIPTION: Record<Locale, string> = {
  en:
    'Meridian is software for migration law and logistics. It shows an applicant their own day counts, ' +
    'document requirements and eligibility assessment against cited sources, with the arithmetic exposed. ' +
    'It is not a law firm and does not give legal advice.',
  es:
    'Meridian es software para el derecho y la logística migratoria. Muestra al solicitante su propio ' +
    'cómputo de días, los requisitos documentales y la evaluación de elegibilidad frente a fuentes citadas, ' +
    'con la aritmética a la vista. No es un despacho de abogados y no presta asesoramiento jurídico.',
};

/**
 * The short form, for a link preview.
 *
 * A card in a chat window truncates at roughly two lines. This says what the
 * portal is and what it withholds, which are the two things a reader deciding
 * whether to open it needs; it claims nothing the long description does not.
 */
const SHARE_DESCRIPTION: Record<Locale, string> = {
  en:
    'Your own day counts, document sequence and eligibility measured against cited rules, with the ' +
    'arithmetic shown. Software, not a law firm: no recommendation without an accountable representative.',
  es:
    'Su propio cómputo de días, la secuencia documental y la elegibilidad medidos frente a normas citadas, ' +
    'con la aritmética a la vista. Software, no un despacho de abogados: ninguna recomendación sin un ' +
    'representante que responda de ella.',
};

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  const other = otherLocale(locale);

  return {
    // Absolute URLs for anything a crawler or a chat client resolves. Without it
    // Next emits relative og:url values, which unfurl to nothing.
    metadataBase: new URL(SELF_URL),
    title: {
      default: TITLE[locale],
      template: '%s · Meridian',
    },
    description: DESCRIPTION[locale],
    // The home page's own alternates. Every other route declares its own, since
    // a layout cannot know which path is being rendered beneath it.
    alternates: alternatesFor('/', locale),
    openGraph: {
      type: 'website',
      siteName: 'Meridian',
      url: `${SELF_URL}${localizedPath('/', locale)}`,
      title: TITLE[locale],
      description: SHARE_DESCRIPTION[locale],
      // One document, one language, declared as such. The other variant is named
      // as an alternate rather than folded into this one.
      locale: LANG_ATTR[locale],
      alternateLocale: [LANG_ATTR[other]],
    },
    twitter: {
      // `summary`, not `summary_large_image`: no image ships, and declaring a
      // large-image card without one produces the empty grey banner this metadata
      // exists to avoid.
      card: 'summary',
      title: TITLE[locale],
      description: SHARE_DESCRIPTION[locale],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<LocaleParams>;
}) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const at = (path: string): string => localizedPath(path, locale);

  return (
    <html lang={htmlLang(locale)}>
      <body>
        <a className="skipLink" href="#main">
          {t(UI.skipToContent)}
        </a>

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href={at('/')} className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">
                ◈
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>Meridian</span>
                <span className={styles.brandTagline}>{t(UI.siteTagline)}</span>
              </span>
            </Link>

            <div className={styles.headerActions}>
              <nav className={styles.nav} aria-label={t('Primary', 'Principal')}>
                <NavLink href={at('/')} label={t(UI.navHome)} exact />
                <NavLink href={at('/matters')} label={t(UI.navMatters)} />
                <NavLink href={at('/pathways')} label={t(UI.navPathways)} />
              </nav>
              <LocaleSwitch locale={locale} />
            </div>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p className={styles.footerLine}>{t(UI.footerNotAdvice)}</p>
            <p className={styles.footerLine}>{t(UI.footerLicence)}</p>
            <p className={styles.footerMeta}>
              Innovaciones MADFAM S.A.S. de C.V. ·{' '}
              <a href={REPO_URL} rel="noreferrer noopener" target="_blank">
                github.com/madfam-org/meridian
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
