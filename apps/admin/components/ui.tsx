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
import { Fragment } from 'react';
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

/**
 * `lang` is optional on the muted text primitives and it is not decoration.
 *
 * Three kinds of string reach this console in a language that is not the page's:
 * a regulator's own name, a reason returned verbatim by a package that only
 * speaks English, and record content the firm typed in whatever language it
 * works in. None of the three is translated — translating a reason would put
 * words in the gate's mouth and translating a matter title would edit the
 * evidence — so each is marked instead, exactly as `@meridian/i18n` marks the
 * name of a statute. Without the mark a screen reader pronounces English words
 * with Spanish phonetics, which is the defect this whole change exists to fix.
 */
export function Meta({ children, lang }: { children: ReactNode; lang?: string }) {
  return (
    <span className={styles.meta} lang={lang}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Light markup                                                               */
/* -------------------------------------------------------------------------- */

const RICH_SEGMENT = /(`[^`]+`|\*[^*]+\*)/g;

/**
 * Renders the two inline marks the string table is allowed to carry:
 * `` `code` `` becomes {@link Mono} and `*emphasis*` becomes `<strong>`.
 *
 * The alternative was splitting one sentence into three exported fragments so a
 * `<Mono>` could sit between them, which is how a translation ends up in English
 * word order: the Spanish for "decided by `canRelease` in `@meridian/core`" does
 * not put the identifier where the English does, and a call site that
 * concatenates fragments has already decided that it must. Keeping the sentence
 * whole leaves that decision with the language that owns it.
 *
 * Deliberately not a markdown renderer and deliberately not HTML. It never
 * interprets a tag, so a string in the table cannot become markup, and there is
 * no `dangerouslySetInnerHTML` anywhere near it.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(RICH_SEGMENT).filter((part) => part.length > 0);
  return (
    <>
      {parts.map((part, index) => {
        if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
          return <Mono key={index}>{part.slice(1, -1)}</Mono>;
        }
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
          return <strong key={index}>{part.slice(1, -1)}</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
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
 *
 * The digits are `aria-hidden` and the bar carries the whole sentence in its
 * `aria-label`, which makes that label the *only* thing a screen reader gets
 * here — so it is the one string in this file that has to be composed by the
 * caller rather than assembled from an English connective. "3 of 12" and "3 de
 * 12" are not the same string, and a component that hard-coded the English one
 * would leave a Spanish page announcing half a sentence in the wrong language
 * to the reader least able to see that it happened.
 */
export function Bar({
  value,
  total,
  label,
  description,
}: {
  value: number;
  total: number;
  label: string;
  /** The full accessible sentence, already in the reader's language. */
  description: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={styles.barRow}>
      <div className={styles.barTrack} role="img" aria-label={`${label}: ${description}`}>
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

/** See {@link Meta} on `lang`: a panel of a package's own prose is marked, not translated. */
export function Panel({ children, lang }: { children: ReactNode; lang?: string }) {
  return (
    <div className={styles.panel} lang={lang}>
      {children}
    </div>
  );
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

/** Muted supporting line under a table cell's primary content. See {@link Meta} on `lang`. */
export function Detail({ children, lang }: { children: ReactNode; lang?: string }) {
  return (
    <span className={styles.detailText} lang={lang}>
      {children}
    </span>
  );
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
