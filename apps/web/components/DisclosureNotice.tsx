import type { DisclosureClass } from '@meridian/core';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, translator } from '@/lib/i18n';
import { Badge } from '@/components/Badge';
import type { Tone } from '@/components/Badge';

import styles from './DisclosureNotice.module.css';

/**
 * What the reader is seeing, what they are not, and why.
 *
 * This is a first-class part of the interface rather than an error state, and
 * the distinction matters. `@meridian/core`'s release gate never suppresses an
 * output silently and never upgrades one: when a recommendation cannot lawfully
 * reach an unrepresented applicant it is *downgraded* to the same facts without
 * the opinion. A person who is handed the downgraded version with no
 * explanation has no way to tell it apart from a bug, an empty database, or a
 * product that simply has nothing to say about their case.
 *
 * So this component states three things plainly:
 *
 *   1. the class of statement on the page, and what that class means;
 *   2. exactly which outputs were withheld;
 *   3. the reason the gate gave, verbatim, plus what would change it.
 *
 * The gate's own `reason` string is produced in English by
 * `@meridian/core`. It is shown as a quotation, tagged `lang="en"`, and is not
 * paraphrased into Spanish — a paraphrase of a compliance determination is a
 * different statement. The bilingual explanation around it is Meridian's own
 * wording and is authored in both languages.
 */

export interface DisclosureClassView {
  readonly tone: Tone;
  readonly label: Bi;
  readonly meaning: Bi;
}

export function disclosureClassView(value: DisclosureClass): DisclosureClassView {
  switch (value) {
    case 'information':
      return {
        tone: 'info',
        label: bi('Information', 'Información'),
        meaning: bi(
          'A neutral restatement of what a published rule says, with its source. It is not applied to your facts.',
          'Una exposición neutral de lo que dice una norma publicada, con su fuente. No se aplica a sus datos.',
        ),
      };
    case 'assessment':
      return {
        tone: 'accent',
        label: bi('Assessment', 'Evaluación'),
        meaning: bi(
          'Your own recorded facts measured against a cited rule, with the arithmetic shown so you can check it. It is not a recommendation and not a prediction of the outcome.',
          'Sus propios datos registrados medidos frente a una norma citada, con la aritmética a la vista para que pueda comprobarla. No es una recomendación ni una predicción del resultado.',
        ),
      };
    case 'advice':
      return {
        tone: 'review',
        label: bi('Advice', 'Asesoramiento'),
        meaning: bi(
          'A recommendation, a ranking, or a statement about what you should do. In Canada and Spain this is a regulated act that only an authorised representative may perform.',
          'Una recomendación, una clasificación o una indicación sobre lo que debería hacer. En Canadá y en España es un acto reservado que solo puede realizar un representante autorizado.',
        ),
      };
  }
}

export interface DisclosureNoticeProps {
  /** The class of the output actually on this page. */
  readonly shown: DisclosureClass;
  /** The class the engine produced, when it was higher than `shown`. */
  readonly requested?: DisclosureClass;
  /** The gate's own reason, verbatim. English, because that is how core writes it. */
  readonly reason?: string;
  /** Specific things this page therefore does not contain. */
  readonly withheld?: readonly Bi[];
  /** What would have to be true for the withheld output to be releasable. */
  readonly remedy?: readonly Bi[];
  readonly locale: Locale;
}

const DOWNGRADED_TITLE = bi(
  'Part of this output was withheld',
  'Parte de este resultado se ha retenido',
);

const RELEASED_TITLE = bi('What you are reading', 'Qué está leyendo');

export function DisclosureNotice({
  shown,
  requested,
  reason,
  withheld,
  remedy,
  locale,
}: DisclosureNoticeProps) {
  const t = translator(locale);
  const shownView = disclosureClassView(shown);
  const downgraded = requested !== undefined && requested !== shown;
  const requestedView = requested !== undefined ? disclosureClassView(requested) : null;

  return (
    <aside
      className={[styles.notice, downgraded ? styles.downgraded : styles.plain].join(' ')}
      role="note"
      aria-labelledby="disclosure-notice-heading"
    >
      <div className={styles.head}>
        <h3 id="disclosure-notice-heading" className={styles.title}>
          <span aria-hidden="true" className={styles.mark}>
            §
          </span>
          {t(downgraded ? DOWNGRADED_TITLE : RELEASED_TITLE)}
        </h3>
        <div className={styles.badges}>
          {downgraded && requestedView !== null ? (
            <>
              <Badge tone={requestedView.tone} label={t(requestedView.label)} />
              <span aria-hidden="true" className={styles.arrow}>
                →
              </span>
            </>
          ) : null}
          <Badge tone={shownView.tone} label={t(shownView.label)} />
        </div>
      </div>

      <p className={styles.meaning}>{t(shownView.meaning)}</p>

      {withheld !== undefined && withheld.length > 0 ? (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>
            {t('Not shown on this page', 'No se muestra en esta página')}
          </h4>
          <ul className={styles.list}>
            {withheld.map((item) => (
              <li key={item.en}>{t(item)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {reason !== undefined ? (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>
            {t(
              'Reason returned by the release gate',
              'Motivo devuelto por el control de divulgación',
            )}
          </h4>
          <blockquote className={styles.reason} lang="en" cite="urn:meridian:core:canRelease">
            {reason}
          </blockquote>
        </div>
      ) : null}

      {remedy !== undefined && remedy.length > 0 ? (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>{t('What would change this', 'Qué cambiaría esto')}</h4>
          <ul className={styles.list}>
            {remedy.map((item) => (
              <li key={item.en}>{t(item)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
