import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { localizedPath, translator } from '@/lib/i18n';
import { type AudienceDefinition } from '@/lib/audiences';

import styles from './AudienceCards.module.css';

/**
 * The doors. One card per audience, each stating who it is for and the problem
 * it addresses before it says anything about the product.
 *
 * Order is the caller's, and every surface that renders these takes it from
 * `AUDIENCES` in `lib/audiences.ts` — the order Meridian was designed around.
 * That is a statement about our roadmap, not a ranking of readers, and the page
 * rendering these says so. There is no highlighted card, no "recommended for
 * you", and nothing here changes with who is reading: a list that reordered
 * itself around a visitor would be making a claim about them.
 */
export function AudienceCards({
  audiences,
  currentId,
  locale,
}: {
  readonly audiences: readonly AudienceDefinition[];
  /** Omit the reader's current page from its own list of doors. */
  readonly currentId?: string;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  const shown = audiences.filter((audience) => audience.id !== currentId);
  if (shown.length === 0) return null;

  return (
    <ul className={styles.cards}>
      {shown.map((audience) => (
        <li className={styles.card} key={audience.id}>
          <h3 className={styles.name}>
            <Link href={localizedPath(audience.href, locale)}>{t(audience.door)}</Link>
          </h3>
          <p className={styles.who}>{t(audience.who)}</p>
          <p className={styles.link}>
            <Link href={localizedPath(audience.href, locale)}>
              {t(audience.name)}
              <span aria-hidden="true"> →</span>
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** A single line back to the pricing page, for the foot of an audience page. */
export function PricingLink({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  return (
    <p className={styles.pricingLink}>
      <Link href={localizedPath('/pricing', locale)}>
        {t(
          'Every tier, what it includes, and what is not available yet',
          'Todos los niveles, qué incluyen y qué aún no está disponible',
        )}
        <span aria-hidden="true"> →</span>
      </Link>
    </p>
  );
}
