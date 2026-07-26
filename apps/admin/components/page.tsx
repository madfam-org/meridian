/**
 * Page furniture: the heading, the as-at control, and the notices that go with
 * being asked about a date other than today.
 *
 * The wrapper is a plain `div` rather than a `header`. A second `header` inside
 * `main` risks mapping to a second `banner` landmark depending on the user
 * agent's implementation of the HTML accessibility mappings, and one page with
 * two banners is worse than one page with none — the `h1` inside it already
 * gives the region its structure.
 *
 * The as-at control is a plain GET form. No JavaScript is involved, the result
 * is a shareable URL, and the whole page — every count, every staleness band,
 * every "days remaining" — recomputes against the new date because nothing in
 * this console caches a derived figure. `preserve` carries the page's own
 * filters through as hidden fields so that changing the date does not silently
 * clear them.
 *
 * `path` arrives **locale-free** and is localised here. That is the one thing a
 * caller must not be trusted to do for itself: a form whose `action` lost the
 * `/es` prefix would answer a Spanish reader's question in English, and it would
 * do it on submit rather than on load — exactly the kind of defect that survives
 * a screenshot review.
 */

import type { ReactNode } from 'react';
import type { AsOf } from '@/lib/clock';
import { AS_OF_PARAM } from '@/lib/clock';
import type { Locale } from '@/lib/i18n';
import { UI, fill, localizedPath, pick } from '@/lib/i18n';
import { Callout, Rich } from '@/components/ui';
import styles from '@/components/shell.module.css';

function AsOfControl({
  path,
  asOf,
  locale,
  preserve,
}: {
  path: string;
  asOf: AsOf;
  locale: Locale;
  preserve: Readonly<Record<string, string | undefined>>;
}) {
  return (
    <form className={styles.asOfForm} method="get" action={path}>
      {Object.entries(preserve)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <label htmlFor="as-of-input">{pick(UI.asAt, locale)}</label>
      <input
        id="as-of-input"
        type="date"
        name={AS_OF_PARAM}
        defaultValue={asOf.date}
        max="2999-12-31"
      />
      <button type="submit" className={styles.button}>
        {pick(UI.apply, locale)}
      </button>
      {asOf.source === 'url' ? <a href={path}>{pick(UI.today, locale)}</a> : null}
    </form>
  );
}

export function PageHeader({
  path,
  asOf,
  locale,
  title,
  description,
  preserve = {},
  children,
}: {
  /** Locale-free path of this page. Localised here, never by the caller. */
  path: string;
  asOf: AsOf;
  locale: Locale;
  title: string;
  description?: ReactNode;
  preserve?: Readonly<Record<string, string | undefined>>;
  children?: ReactNode;
}) {
  const self = localizedPath(path, locale);

  return (
    <div className={styles.pageHead}>
      <div className={styles.pageTitleRow}>
        <h1>{title}</h1>
        <AsOfControl path={self} asOf={asOf} locale={locale} preserve={preserve} />
      </div>
      {description !== undefined ? <p className={styles.pageDescription}>{description}</p> : null}

      {asOf.rejected !== undefined ? (
        <Callout tone="warn" title={pick(UI.asOfRejectedTitle, locale)}>
          <p>
            <Rich
              text={fill(UI.asOfRejectedBody, locale, {
                raw: asOf.rejected.raw,
                source: pick(
                  asOf.rejected.from === 'url' ? UI.asOfSourceUrl : UI.asOfSourceEnvironment,
                  locale,
                ),
                today: asOf.today,
              })}
            />
          </p>
        </Callout>
      ) : null}

      {asOf.overridden ? (
        <Callout
          tone="info"
          title={fill(UI.asOfOverriddenTitle, locale, { date: asOf.date, today: asOf.today })}
        >
          <p>{fill(UI.asOfOverriddenBody, locale, { date: asOf.date })}</p>
        </Callout>
      ) : null}

      {children}
    </div>
  );
}
