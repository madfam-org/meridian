/**
 * Presentational primitives.
 *
 * The one rule these enforce is the accessibility rule that is easiest to break
 * by accident: **no state is encoded by colour alone**. `Badge` will not render
 * without a text label, and every tone carries a glyph as a second channel, so
 * the same distinction survives greyscale printing, a projector, and colour
 * vision deficiency. The glyph is `aria-hidden` because the label already says
 * the thing — announcing "black circle, live" would be worse, not better.
 *
 * Nothing here decides what state something is in. That work belongs to `lib/`,
 * where it is computed from the records and can be reasoned about; a component
 * that inferred severity from a number would put a legal judgement in a JSX file.
 */

import type { CSSProperties, ReactNode } from 'react';
import styles from '@/components/ui.module.css';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'refused';

/**
 * `noUncheckedIndexedAccess` makes every CSS-module lookup `string | undefined`,
 * which is honest — the class really might not exist if the stylesheet changes.
 * The maps below carry that type rather than casting it away, and every use site
 * is a template literal or a `className`, both of which tolerate `undefined`
 * without producing a literal "undefined" class.
 */
const TONE_CLASS: Record<Tone, string | undefined> = {
  ok: styles.toneOk,
  warn: styles.toneWarn,
  danger: styles.toneDanger,
  info: styles.toneInfo,
  neutral: styles.toneNeutral,
  refused: styles.toneRefused,
};

/**
 * The redundant, non-colour channel. Shapes are chosen to stay distinguishable
 * at small sizes and in monochrome: filled, half, triangle, hollow, dash, cross.
 */
const TONE_GLYPH: Record<Tone, string> = {
  ok: '●',
  warn: '◐',
  danger: '▲',
  info: '○',
  neutral: '–',
  refused: '⨯',
};

export function Badge({
  tone,
  children,
  title,
}: {
  tone: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className={`${styles.badge} ${TONE_CLASS[tone]}`} title={title}>
      <span className={styles.badgeGlyph} aria-hidden="true">
        {TONE_GLYPH[tone]}
      </span>
      {children}
    </span>
  );
}

export function Callout({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.callout} ${TONE_CLASS[tone]}`} role="note">
      <p className={styles.calloutTitle}>
        <span className={styles.badgeGlyph} aria-hidden="true">
          {TONE_GLYPH[tone]}
        </span>
        {title}
      </p>
      <div className={styles.calloutBody}>{children}</div>
    </div>
  );
}

/**
 * A landmark-bearing section.
 *
 * `id` is required because every section is a keyboard-navigation target and a
 * link destination; a section nobody can link to is a section a practitioner
 * cannot send to a colleague.
 */
export function Section({
  id,
  title,
  count,
  note,
  actions,
  children,
}: {
  id: string;
  title: string;
  count?: string;
  note?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`} id={id}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <h2 id={`${id}-heading`}>{title}</h2>
          {count !== undefined ? <span className={styles.sectionCount}>{count}</span> : null}
        </div>
        {actions !== undefined ? <div className={styles.sectionActions}>{actions}</div> : null}
      </div>
      {note !== undefined ? <p className={styles.sectionNote}>{note}</p> : null}
      {children}
    </section>
  );
}

/**
 * What nothing looks like.
 *
 * Deliberately not a spinner, not a placeholder graphic, and not a sample row.
 * A console that dresses an empty caseload up as a demo teaches its user to
 * distrust every other number on the page.
 */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {children}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className={styles.tableWrap}>{children}</div>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className={styles.mono}>{children}</span>;
}

export function Meta({ children }: { children: ReactNode }) {
  return <span className={styles.meta}>{children}</span>;
}

export function PillRow({ children }: { children: ReactNode }) {
  return <div className={styles.pillRow}>{children}</div>;
}

/** A bordered token, for identifiers that would otherwise run together. */
export function Chip({ children }: { children: ReactNode }) {
  return <span className={styles.chip}>{children}</span>;
}

export const numericCell = styles.numeric;
export const nowrapCell = styles.nowrap;
export const monoCell = styles.mono;

export interface Definition {
  readonly term: string;
  readonly value: ReactNode;
}

const CONTENTS: CSSProperties = { display: 'contents' };

export function Definitions({ items }: { items: readonly Definition[] }) {
  return (
    <dl className={styles.definitions}>
      {items.map((item) => (
        <div key={item.term} style={CONTENTS}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A proportional bar over two real counts.
 *
 * `value` and `total` are both rendered as digits next to the bar, because the
 * bar is the decoration and the numbers are the information. A bar with no
 * number beside it is how a dashboard starts implying precision it does not have.
 */
export function Bar({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={styles.barRow}>
      <div className={styles.barTrack} role="img" aria-label={`${label}: ${value} of ${total}`}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.barValue} aria-hidden="true">
        {value}/{total}
      </span>
    </div>
  );
}

/** A count cell that greys out a zero so a dense matrix reads as a shape. */
export function Count({ value }: { value: number }) {
  return <span className={value === 0 ? styles.zero : undefined}>{value}</span>;
}

/* -------------------------------------------------------------------------- */
/* Spec tree                                                                  */
/* -------------------------------------------------------------------------- */

export interface TreeNode {
  readonly text: string;
  readonly children: readonly TreeNode[];
}

function TreeItems({ nodes, root }: { nodes: readonly TreeNode[]; root: boolean }) {
  return (
    <ul className={root ? `${styles.tree} ${styles.treeRoot}` : styles.tree}>
      {nodes.map((node, index) => (
        <li key={`${node.text}-${index}`} className={styles.treeItem}>
          {node.text}
          {node.children.length > 0 ? <TreeItems nodes={node.children} root={false} /> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders a nested rule as a real nested list, so a screen reader announces the
 * nesting depth. A flat rendering with indentation would lose the structure for
 * exactly the reader who most needs it.
 */
export function Tree({ node }: { node: TreeNode }) {
  return <TreeItems nodes={[node]} root />;
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export function Columns({ children }: { children: ReactNode }) {
  return <div className={styles.columns}>{children}</div>;
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className={styles.panel}>{children}</div>;
}

/**
 * A labelled sub-group inside a section.
 *
 * Renders a real heading rather than a styled paragraph, so the document outline
 * still describes the page for anyone navigating by headings.
 */
export function Subhead({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 className={styles.subhead} id={id}>
      {children}
    </h3>
  );
}

/** Muted supporting line under a table cell's primary content. */
export function Detail({ children }: { children: ReactNode }) {
  return <span className={styles.detailText}>{children}</span>;
}

export const filterBarClass = styles.filterBar;
export const fieldClass = styles.field;
export const filterActionsClass = styles.filterActions;
export const checkListClass = styles.checkList;
export const checkItemClass = styles.checkItem;
export const phaseTrackClass = styles.phaseTrack;
export const phaseStepClass = styles.phaseStep;
export const phaseStepDoneClass = styles.phaseStepDone;
export const phaseStepCurrentClass = styles.phaseStepCurrent;
export const phaseOrdinalClass = styles.phaseOrdinal;
