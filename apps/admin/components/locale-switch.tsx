'use client';

/**
 * The language switcher.
 *
 * It is a link. Not a button, not a `<select>`, not anything that needs
 * JavaScript to work: the `href` is computed during render, so it is in the HTML
 * a browser with scripting disabled receives, and it is a real destination a
 * crawler can follow and a reader can copy, bookmark or open in a new tab. A
 * toggle that swapped the language by writing a cookie would satisfy none of
 * that and would give the two languages one address between them.
 *
 * **It points at the same page.** `localizedPath` carries the current path and
 * the current query string across, so a practitioner three filters deep into the
 * audit trail, rendered as at a date in 2025, arrives at exactly that view in
 * the other language. Sending them to the home page because they wanted to read
 * in Spanish loses their place and everything they typed, and is the single most
 * common defect in a language switcher.
 *
 * ## Announcing what it is
 *
 * The visible text is the endonym — *Español*, *English* — with `lang` set to
 * the language it names, because a control labelled "Spanish" is no use to the
 * person who needs it and because the endonym has to be pronounced in its own
 * language to be recognised. The accessible name is the full sentence, also in
 * the target language, and it *contains* the visible text, which is what keeps
 * WCAG's label-in-name requirement satisfied while still saying what the link
 * does.
 *
 * There is no second `<nav>` landmark. The console's contract is one of each
 * landmark; this sits beside the theme control in the banner and is labelled the
 * same way that one is.
 */

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LANG_ATTR,
  LOCALE_ENDONYM,
  LOCALE_SWITCH_LABEL,
  UI,
  localizedPath,
  otherLocale,
  pick,
  publicPath,
  splitLocalePath,
} from '@/lib/i18n';
import styles from '@/components/shell.module.css';

function Switch({ search }: { search: string }) {
  const { locale, path } = splitLocalePath(publicPath(usePathname()));
  const target = otherLocale(locale);
  // `usePathname()` never carries the query, so the query arrives separately and
  // is appended before the locale is applied — `localizedPath` is the thing that
  // knows a query string has to survive a prefix change.
  const href = localizedPath(`${path}${search}`, target);

  return (
    <div className={styles.localeSwitch}>
      <span className={styles.localeSwitchLabel}>{pick(UI.languageLabel, locale)}</span>
      <a
        className={styles.localeSwitchLink}
        href={href}
        lang={LANG_ATTR[target]}
        hrefLang={LANG_ATTR[target]}
        aria-label={LOCALE_SWITCH_LABEL[target]}
      >
        {LOCALE_ENDONYM[target]}
      </a>
    </div>
  );
}

function SwitchWithQuery() {
  const params = useSearchParams();
  const query = params?.toString() ?? '';
  return <Switch search={query.length > 0 ? `?${query}` : ''} />;
}

/**
 * `useSearchParams` forces a Suspense boundary in a prerendered tree, so the
 * query-preserving form is suspended behind the path-only form. The fallback is
 * not a degraded state: it is the same link to the same page, built from the
 * path the router has already resolved. Only the query string is missing, and
 * only until hydration.
 */
export function LocaleSwitch() {
  return (
    <Suspense fallback={<Switch search="" />}>
      <SwitchWithQuery />
    </Suspense>
  );
}
