import Link from 'next/link';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, localizedPath, translator } from '@/lib/i18n';
import { CAPABILITIES, releasableToUnrepresented, type CapabilityId } from '@/lib/audiences';
import { Badge } from '@/components/Badge';
import { disclosureClassView } from '@/components/DisclosureNotice';

import styles from './CapabilityList.module.css';

/**
 * What Meridian does for a reader, each item carrying the two facts that decide
 * where it sits commercially.
 *
 * The first is its **disclosure class**, rendered through the same
 * `disclosureClassView` the release notices use, so "assessment" means the same
 * thing on a sales page as it does on a result page. The second is whether it
 * is **released without a representative**, which is not a claim written here —
 * it is the answer `@meridian/core`'s gate gives when asked, at build time, for
 * every jurisdiction in the catalog.
 *
 * Together those two are the pricing argument, made in the reader's presence
 * rather than asserted: everything the gate hands to an unrepresented person is
 * free, and the one thing it refuses is the one thing a licence exists to make
 * releasable.
 *
 * Anything not built says so, on the item, in a warn tone. A capability list is
 * the most tempting place in a product to describe the roadmap in the present
 * tense, so the state is a required field and this component always renders it.
 *
 * The release sentence appears per item only where the list is mixed. Where the
 * gate answered the same way for everything — the free tier, for instance —
 * repeating it five times trains the reader to skip the line carrying the whole
 * argument, so it is stated once beneath the list instead.
 */

const RELEASED: Bi = bi(
  'The release gate hands this to a reader with no representative attached: no licence is engaged by it.',
  'El control de divulgación entrega esto a un lector sin representante vinculado: no interviene ninguna licencia.',
);

const REFUSED: Bi = bi(
  'The release gate refuses this to a reader with no representative attached. A licensed person has to be accountable for it.',
  'El control de divulgación deniega esto a un lector sin representante vinculado. Una persona con licencia debe responder de ello.',
);

const ALL_RELEASED: Bi = bi(
  'Asked at build time, for every jurisdiction in the catalog: the release gate hands every one of these to a reader with no representative attached, so no licence is engaged by any of them. Where one is nonetheless paid for, it is because it has to remember something between visits — never because an opinion is being withheld until you pay.',
  'Preguntado al compilar, para todas las jurisdicciones del catálogo: el control de divulgación entrega todos estos a un lector sin representante vinculado, de modo que en ninguno interviene una licencia. Cuando aun así se paga por alguno, es porque tiene que recordar algo entre visitas, nunca porque se retenga una opinión hasta que usted pague.',
);

const ALL_REFUSED: Bi = bi(
  'Asked at build time, for every jurisdiction in the catalog: the release gate refuses every one of these to a reader with no representative attached. Each needs a licensed person accountable for it.',
  'Preguntado al compilar, para todas las jurisdicciones del catálogo: el control de divulgación deniega todos estos a un lector sin representante vinculado. Cada uno necesita una persona con licencia que responda de él.',
);

export function CapabilityList({
  ids,
  locale,
}: {
  readonly ids: readonly CapabilityId[];
  readonly locale: Locale;
}) {
  const t = translator(locale);
  const releases = ids.map((id) => releasableToUnrepresented(CAPABILITIES[id].produces));
  const mixed = new Set(releases).size > 1;

  return (
    <>
      <ul className={styles.list}>
        {ids.map((id, index) => {
          const capability = CAPABILITIES[id];
          const view = disclosureClassView(capability.produces);
          const ungated = releases[index] === true;

          return (
            <li className={styles.item} key={capability.id}>
              <div className={styles.head}>
                <h3 className={styles.name}>
                  {capability.href !== undefined && capability.state === 'shipped' ? (
                    <Link href={localizedPath(capability.href, locale)}>{t(capability.name)}</Link>
                  ) : (
                    t(capability.name)
                  )}
                </h3>
                <div className={styles.badges}>
                  <Badge tone={view.tone} label={t(view.label)} />
                  <Badge
                    tone={capability.state === 'shipped' ? 'ok' : 'warn'}
                    label={t(
                      capability.state === 'shipped'
                        ? bi('Built', 'Construido')
                        : bi('Not built', 'No construido'),
                    )}
                  />
                </div>
              </div>

              <p className={styles.detail}>{t(capability.detail)}</p>

              {mixed ? (
                <p className={styles.release}>
                  <span aria-hidden="true" className={styles.releaseMark}>
                    §
                  </span>{' '}
                  {t(ungated ? RELEASED : REFUSED)}
                </p>
              ) : null}

              {capability.caveat === undefined ? null : (
                <p className={styles.caveat}>
                  <span className={styles.caveatLabel}>{t('Limit', 'Límite')}</span>{' '}
                  {t(capability.caveat)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {mixed || ids.length === 0 ? null : (
        <p className={styles.summary}>
          <span aria-hidden="true" className={styles.releaseMark}>
            §
          </span>{' '}
          {t(releases[0] === true ? ALL_RELEASED : ALL_REFUSED)}
        </p>
      )}
    </>
  );
}
