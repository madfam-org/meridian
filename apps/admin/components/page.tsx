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
 */

import type { ReactNode } from 'react';
import type { AsOf } from '@/lib/clock';
import { AS_OF_PARAM } from '@/lib/clock';
import { Callout } from '@/components/ui';
import styles from '@/components/shell.module.css';

function AsOfControl({
  path,
  asOf,
  preserve,
}: {
  path: string;
  asOf: AsOf;
  preserve: Readonly<Record<string, string | undefined>>;
}) {
  return (
    <form className={styles.asOfForm} method="get" action={path}>
      {Object.entries(preserve)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <label htmlFor="as-of-input">As at</label>
      <input
        id="as-of-input"
        type="date"
        name={AS_OF_PARAM}
        defaultValue={asOf.date}
        max="2999-12-31"
      />
      <button type="submit" className={styles.button}>
        Apply
      </button>
      {asOf.source === 'url' ? (
        <a href={path}>Today</a>
      ) : null}
    </form>
  );
}

export function PageHeader({
  path,
  asOf,
  title,
  description,
  preserve = {},
  children,
}: {
  path: string;
  asOf: AsOf;
  title: string;
  description?: ReactNode;
  preserve?: Readonly<Record<string, string | undefined>>;
  children?: ReactNode;
}) {
  return (
    <div className={styles.pageHead}>
      <div className={styles.pageTitleRow}>
        <h1>{title}</h1>
        <AsOfControl path={path} asOf={asOf} preserve={preserve} />
      </div>
      {description !== undefined ? <p className={styles.pageDescription}>{description}</p> : null}

      {asOf.rejected !== undefined ? (
        <Callout tone="warn" title="As-at date ignored">
          <p>
            <code>{asOf.rejected.raw}</code> from the {asOf.rejected.from} is not a valid civil date,
            so this page is rendered as at {asOf.today}. It was rejected rather than repaired: a
            typo that quietly falls back to today produces a page that looks right and answers a
            different question.
          </p>
        </Callout>
      ) : null}

      {asOf.overridden ? (
        <Callout tone="info" title={`Rendered as at ${asOf.date}, not ${asOf.today}`}>
          <p>
            Every figure below — day counts, citation staleness, licence expiry, pathway status — is
            computed against {asOf.date}. Rules that opened or closed between the two dates are
            resolved as they stood on {asOf.date}, which is how a decision taken before a repeal can
            still be explained.
          </p>
        </Callout>
      ) : null}

      {children}
    </div>
  );
}
