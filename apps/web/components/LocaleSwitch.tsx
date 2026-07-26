'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import {
  LOCALE_ENDONYM,
  UI,
  VIEW_IN_LOCALE,
  htmlLang,
  localizedPath,
  otherLocale,
  translator,
} from '@/lib/i18n';
import { publicPath } from '@/lib/locale';

import styles from './LocaleSwitch.module.css';

/**
 * The language switcher.
 *
 * ── It is a link, not a control ──────────────────────────────────────────────
 *
 * An anchor with a real `href`, present in the prerendered HTML. It works with
 * JavaScript disabled, it is crawlable, and middle-clicking it opens the other
 * language in a tab. A button with an `onClick` would fail all three.
 *
 * A plain `<a>` rather than `next/link`, deliberately: this link replaces the
 * language of the whole document — `<html lang>`, and with it the hyphenation
 * dictionary, the quotation rules and the voice a screen reader uses. A
 * client-side navigation asks React to patch those on a live document, which is
 * the kind of thing that works until it quietly does not. A document load
 * cannot get it wrong, and costs one request a reader makes at most once a
 * visit.
 *
 * ── Where it points ─────────────────────────────────────────────────────────
 *
 * At *this* page in the other language, never at the home page. Sending a
 * reader who is halfway through the day counter back to `/` because they wanted
 * to read it in Spanish loses their place and everything they typed.
 *
 * This portal has fourteen routes, so — unlike the single-document explainer,
 * whose layout can pass a literal path — the path has to come from the router,
 * which makes this a client component. `usePathname` runs during prerender too,
 * so the `href` is baked into the static HTML rather than filled in after
 * hydration. What it reports is the *routed* path, so `publicPath` undoes the
 * middleware's `/en` rewrite before `localizedPath` touches it:
 * `@meridian/i18n` deliberately does not recognise `/en` as a locale prefix,
 * because English is unprefixed and recognising it would publish every page
 * twice.
 *
 * ── The query string ────────────────────────────────────────────────────────
 *
 * `/pathways` carries the reader's filters in the query, and a switch that
 * dropped them would hand a Spanish reader an unfiltered list. `useSearchParams`
 * is the framework's answer and cannot be used here: on a statically rendered
 * route it forces the whole subtree to client-render, which would replace the
 * prerendered `href` with nothing until JavaScript arrives — the exact property
 * this component exists to keep. So the query is read from `window.location`
 * after mount. The first client render matches the server's, so there is no
 * hydration mismatch; the link merely improves once JavaScript is available, and
 * without it still resolves to the same page in the other language.
 *
 * ── Both languages are named, in their own language ─────────────────────────
 *
 * A control labelled "Spanish" is useless to the person who needs it, because
 * that person is not reading English. So each option carries its endonym with a
 * `lang` matching what it names, and the link's accessible name is a whole
 * sentence in the language it leads to. The current language is shown too,
 * marked `aria-current`, so a reader can see which of the two they are in
 * rather than inferring it from which one is missing.
 *
 * Not an icon, not a flag, not a two-letter code: a flag is a country and a
 * language is not, and on a page that prints `ES` and `CA` as jurisdiction chips
 * a two-letter language code would read as one more jurisdiction.
 */
export function LocaleSwitch({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  const other = otherLocale(locale);
  const routed = usePathname();
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch(window.location.search);
  }, [routed]);

  return (
    <nav className={styles.switch} aria-label={t(UI.languageNav)}>
      <span className={styles.current} lang={htmlLang(locale)} aria-current="true">
        {LOCALE_ENDONYM[locale]}
      </span>
      <a
        className={styles.link}
        href={localizedPath(`${publicPath(routed)}${search}`, other)}
        lang={htmlLang(other)}
        hrefLang={htmlLang(other)}
      >
        {/*
          The accessible name is the full sentence; the visible text is the
          language's own name. Both are in the target language. Spelling the
          sentence out visibly would put four words of Spanish in an English
          header for no gain, and leaving it out entirely would announce a bare
          "Español" whose purpose a screen-reader user has to guess.
        */}
        <span className={styles.assistive}>{VIEW_IN_LOCALE[other]}</span>
        <span aria-hidden="true">{LOCALE_ENDONYM[other]}</span>
      </a>
    </nav>
  );
}
