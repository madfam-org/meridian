import {
  LOCALE_ENDONYM,
  UI,
  VIEW_IN_LOCALE,
  htmlLang,
  localizedPath,
  otherLocale,
  translator,
  type Locale,
} from '@/lib/i18n';

import styles from './LocaleSwitch.module.css';

/**
 * The language switcher.
 *
 * ── It is a link, not a control ──────────────────────────────────────────────
 *
 * An anchor with a real `href`, rendered on the server. It works with
 * JavaScript disabled, it is crawlable, middle-clicking it opens the other
 * language in a tab, and there is no state to get out of step with the URL.
 * A button with an `onClick` would fail all four, and would need this whole
 * header to become a client component to do it.
 *
 * ── Where it points ─────────────────────────────────────────────────────────
 *
 * At *this* page in the other language, never at the home page — `path` is the
 * locale-free path of the page the switcher is sitting on, and `localizedPath`
 * carries any query string across. Sending a reader who is halfway through the
 * day counter back to `/` because they wanted to read it in Spanish loses their
 * place and everything they typed. This site serves one document, so its layout
 * passes `'/'`; an application with more than one route has to thread its own
 * route path through, and must not substitute the home page for it.
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
 * language is not, and on a page that prints `ES` and `CA` as jurisdiction
 * chips a two-letter language code would read as one more jurisdiction.
 */
export function LocaleSwitch({
  locale,
  path,
}: {
  readonly locale: Locale;
  /** The path of the current page with no locale prefix. `/` for this site. */
  readonly path: string;
}) {
  const t = translator(locale);
  const other = otherLocale(locale);

  return (
    <nav className={styles.switch} aria-label={t(UI.languageNav)}>
      <span className={styles.current} lang={htmlLang(locale)} aria-current="true">
        {LOCALE_ENDONYM[locale]}
      </span>
      <a
        className={styles.link}
        href={localizedPath(path, other)}
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
