import type { IsoDate } from '@meridian/core';

import type { Locale } from '@/lib/i18n';
import { translator } from '@/lib/i18n';

import styles from './WorkedExample.module.css';

/**
 * The banner that says "this is not your data".
 *
 * Every matter, stay, document and applicant fact in this build is a worked
 * example declared in `lib/sample/`. There is no database, no account and no
 * upload path yet. The *computation* over that example is entirely real — the
 * day counts come from `@meridian/presence` and the eligibility results from
 * `@meridian/pathways`, with no figure typed in by hand — but the inputs are
 * invented, and a portal about someone's legal status must never leave that
 * ambiguous.
 *
 * It also names the evaluation date. Every page here is computed as at one
 * fixed civil date rather than a clock read at render time. That is deliberate:
 * a legal output must be reproducible, and "how many days had I used?" is a
 * question about a specific day. The date is a parameter everywhere in the
 * engine, and the portal supplies one constant.
 */
export function WorkedExampleBanner({
  asOf,
  locale,
}: {
  readonly asOf: IsoDate;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  return (
    <div className={styles.banner} role="note">
      <span aria-hidden="true" className={styles.mark}>
        ▲
      </span>
      <div className={styles.body}>
        <p className={styles.title}>
          {t(
            'Worked example — not a real person and not your data',
            'Ejemplo resuelto — no es una persona real ni son sus datos',
          )}
        </p>
        <p className={styles.detail}>
          {t(
            'The facts below are invented and declared in this application’s source. Every number derived from them is computed by the Meridian engines at build time; none is typed in by hand.',
            'Los datos que siguen son inventados y están declarados en el código de esta aplicación. Todas las cifras derivadas de ellos las calculan los motores de Meridian en la compilación; ninguna se ha escrito a mano.',
          )}
        </p>
        <p className={styles.detail}>
          {t('Computed as at', 'Calculado a fecha de')}{' '}
          <time dateTime={asOf} className={styles.date}>
            {asOf}
          </time>
          {'. '}
          {t(
            'The evaluation date is a fixed parameter, not the time you loaded the page, so the same inputs always give the same figures.',
            'La fecha de evaluación es un parámetro fijo, no el momento en que cargó la página, de modo que los mismos datos dan siempre las mismas cifras.',
          )}
        </p>
      </div>
    </div>
  );
}
