import type { ReactNode } from 'react';

import type { Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import { T, TProse } from '@/components/Bilingual';

import styles from './Layout.module.css';

/**
 * Structural primitives. No status meaning, no legal meaning — these decide
 * where a thing sits on the page and nothing else.
 */

export function Page({ children }: { readonly children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  aside,
}: {
  readonly eyebrow?: ReactNode;
  readonly title: Bi;
  readonly lead?: Bi;
  readonly aside?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      {eyebrow !== undefined ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
      <div className={styles.pageHeaderRow}>
        <h1>
          <T text={title} />
        </h1>
        {aside !== undefined ? <div className={styles.pageHeaderAside}>{aside}</div> : null}
      </div>
      {lead !== undefined ? <TProse text={lead} className={styles.lead} /> : null}
    </header>
  );
}

/**
 * A titled region. Rendered as `<section>` with its heading wired up through
 * `aria-labelledby`, so the landmark tree a screen-reader user navigates
 * matches the visual structure rather than being a flat wall of divs.
 */
export function Section({
  id,
  title,
  description,
  actions,
  children,
}: {
  readonly id: string;
  readonly title: Bi;
  readonly description?: Bi;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section className={styles.section} aria-labelledby={headingId} id={id}>
      <div className={styles.sectionHead}>
        <h2 id={headingId}>
          <T text={title} />
        </h2>
        {actions !== undefined ? <div className={styles.sectionActions}>{actions}</div> : null}
      </div>
      {description !== undefined ? (
        <TProse text={description} className={styles.sectionDescription} />
      ) : null}
      {children}
    </section>
  );
}

export function Card({
  children,
  className,
  tone,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly tone?: 'plain' | 'sunken';
}) {
  return (
    <div className={cx(styles.card, tone === 'sunken' && styles.cardSunken, className)}>
      {children}
    </div>
  );
}

/**
 * Auto-fitting columns. The two variants are fixed classes rather than an
 * inline custom property, so every grid on the site collapses at the same
 * breakpoints and nothing depends on a style attribute surviving hydration.
 */
export function Grid({
  children,
  size = 'md',
}: {
  readonly children: ReactNode;
  readonly size?: 'sm' | 'md';
}) {
  return <div className={cx(styles.grid, size === 'sm' && styles.gridSm)}>{children}</div>;
}

export function Stack({
  children,
  gap = 'md',
}: {
  readonly children: ReactNode;
  readonly gap?: 'sm' | 'md' | 'lg';
}) {
  return <div className={cx(styles.stack, styles[`stack-${gap}`])}>{children}</div>;
}

export function Row({ children }: { readonly children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/** A key/value list. Values are wrapped so long ids and dates can break. */
export function Facts({ children }: { readonly children: ReactNode }) {
  return <dl className={styles.facts}>{children}</dl>;
}

export function Fact({
  label,
  children,
}: {
  readonly label: Bi;
  readonly children: ReactNode;
}) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>
        <T text={label} />
      </dt>
      <dd className={styles.factValue}>{children}</dd>
    </div>
  );
}

/** A civil date. Always machine-readable, always rendered in ISO form. */
export function CivilDate({ value }: { readonly value: string }) {
  return (
    <time dateTime={value} className={styles.date}>
      {value}
    </time>
  );
}

/** A figure with its unit, for day counts and thresholds. */
export function Figure({
  value,
  unit,
  tone,
}: {
  readonly value: number | string;
  readonly unit?: Bi;
  readonly tone?: 'plain' | 'strong';
}) {
  return (
    <span className={cx(styles.figure, tone === 'strong' && styles.figureStrong)}>
      <span className={styles.figureValue}>{value}</span>
      {unit !== undefined ? (
        <span className={styles.figureUnit}>
          <T text={unit} />
        </span>
      ) : null}
    </span>
  );
}

/** Wide content — tables, especially — scrolls inside its own box. */
export function ScrollX({ children }: { readonly children: ReactNode }) {
  return <div className={styles.scrollX}>{children}</div>;
}

/** An honest empty state. Never styled as an error; absence of data is normal. */
export function Empty({ text }: { readonly text: Bi }) {
  return (
    <p className={styles.empty}>
      <T text={text} />
    </p>
  );
}
