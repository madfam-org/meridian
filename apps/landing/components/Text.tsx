import type { ReactNode } from 'react';

import { instrumentLang } from '@/lib/i18n';
import { cx } from '@/lib/ui';

import styles from './Text.module.css';

/**
 * Text primitives for a page served in one language.
 *
 * This file replaces the pair of `lang`-tagged runs the site used to emit for
 * every string. With the whole document in one language, `<html lang>` covers
 * ordinary prose and marking each paragraph again would be noise. What remains
 * is the case that is *not* covered by the document language, and that case is
 * the reason this file still exists: {@link Instrument}.
 */

/**
 * A paragraph of resolved prose.
 *
 * Takes a string rather than a bilingual pair: the caller has already chosen a
 * language, and the compiler enforces that — a `LocalizedText` passed here does
 * not type-check, which is how a call site that was missed during the
 * conversion fails loudly instead of rendering `[object Object]`.
 */
export function Prose({
  children,
  className,
}: {
  readonly children: string;
  readonly className?: string;
}) {
  return <p className={cx(styles.prose, className)}>{children}</p>;
}

/**
 * The shape this component needs from a citation.
 *
 * Structural, so a `Citation` from `@meridian/core` satisfies it without this
 * file importing that package — which matters because the calculator is a
 * client component and its citation must not drag the catalog into the browser
 * bundle. `language` is here for the day a citation records the language of the
 * text it quotes; nothing populates it yet.
 */
export interface CitedInstrument {
  readonly instrument: string;
  readonly provision?: string;
  readonly language?: string | null;
  readonly jurisdiction?: string | null;
}

/**
 * The name of a legal instrument, and the provision inside it.
 *
 * **Never translated, in either locale.** "Código Civil, art. 22.1" is the
 * identity of a source, not prose about it; rendering "Civil Code art. 22.1" to
 * an English reader names an instrument that does not exist under that title,
 * and a person who tries to verify it — or a lawyer who tries to rely on it —
 * will not find it. So the name renders verbatim and is *marked* with its own
 * language instead, which is what stops a Spanish page reading "Immigration and
 * Refugee Protection Act" with Spanish phonetics.
 *
 * The language comes from `instrumentLang`, which infers it from the issuing
 * jurisdiction and returns `null` when it cannot without guessing — in which
 * case no `lang` is emitted and no claim is made about how to pronounce the
 * name. Surrounding explanatory prose is translated normally; only the name is
 * exempt.
 */
export function Instrument({
  source,
  className,
}: {
  readonly source: CitedInstrument;
  readonly className?: string;
}) {
  const lang = instrumentLang(source);
  return (
    <cite className={cx(styles.instrument, className)} lang={lang ?? undefined}>
      {source.instrument}
      {source.provision !== undefined ? `, ${source.provision}` : ''}
    </cite>
  );
}

/**
 * Wrap a run of text in a language annotation.
 *
 * For values that are in a known language which is not the page's — the
 * engine's own English trace of a comparison, a note the catalog carries in one
 * language only. Not for ordinary prose, which inherits `<html lang>`.
 */
export function Lang({
  code,
  children,
  className,
}: {
  readonly code: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span className={className} lang={code}>
      {children}
    </span>
  );
}
