import type { ReactNode } from 'react';

import { cx } from '@/lib/ui';
import { Prose } from '@/components/Text';

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
  actions,
}: {
  readonly eyebrow?: ReactNode;
  readonly title: string;
  readonly lead?: string;
  readonly actions?: ReactNode;
}) {
  return (
    /*
     * A `div`, not a `header`. Chrome maps a `header` element inside `main` to
     * the banner landmark, and the site already has one of those around the
     * masthead — a second banner in the landmark list is a navigation aid that
     * lies about where the top of the page is. The `h1` below is what makes this
     * block findable, and it does that without a landmark.
     */
    <div className={styles.pageHeader}>
      {eyebrow !== undefined ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
      <h1>{title}</h1>
      {lead !== undefined ? <Prose className={styles.lead}>{lead}</Prose> : null}
      {actions !== undefined ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

/**
 * A titled region. Rendered as `<section>` with its heading wired up through
 * `aria-labelledby`, so the landmark tree a screen-reader user navigates matches
 * the visual structure rather than being a flat wall of divs. The `id` is also
 * the anchor the header nav links to, which is why every section on this site
 * has one.
 */
export function Section({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section className={styles.section} aria-labelledby={headingId} id={id}>
      <div className={styles.sectionHead}>
        <h2 id={headingId}>{title}</h2>
      </div>
      {description !== undefined ? (
        <Prose className={styles.sectionDescription}>{description}</Prose>
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
 * Auto-fitting columns. The two variants are fixed classes rather than an inline
 * custom property, so every grid on the site collapses at the same breakpoints
 * and nothing depends on a style attribute surviving hydration.
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
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
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

/** A figure with its unit, for counts and thresholds. */
export function Figure({
  value,
  unit,
  tone,
}: {
  readonly value: number | string;
  readonly unit?: string;
  readonly tone?: 'plain' | 'strong';
}) {
  return (
    <span className={cx(styles.figure, tone === 'strong' && styles.figureStrong)}>
      <span className={styles.figureValue}>{value}</span>
      {unit !== undefined ? <span className={styles.figureUnit}>{unit}</span> : null}
    </span>
  );
}

/** Wide content — tables, especially — scrolls inside its own box. */
export function ScrollX({ children }: { readonly children: ReactNode }) {
  return <div className={styles.scrollX}>{children}</div>;
}

/**
 * A link styled as a call to action.
 *
 * Every destination this site offers is on another host — the portal, the
 * repository — so these are plain anchors rather than `next/link`, and each one
 * says where it is going in its own text. `rel="noreferrer noopener"` is set
 * whenever a new tab is opened, because `target="_blank"` otherwise hands the
 * opened page a reference back to this one.
 */
export function ActionLink({
  href,
  label,
  variant = 'secondary',
  newTab = false,
}: {
  readonly href: string;
  readonly label: string;
  readonly variant?: 'primary' | 'secondary';
  readonly newTab?: boolean;
}) {
  const external = newTab ? { target: '_blank', rel: 'noreferrer noopener' } : {};
  return (
    <a
      className={cx(styles.action, variant === 'primary' ? styles.actionPrimary : undefined)}
      href={href}
      {...external}
    >
      {label}
    </a>
  );
}
