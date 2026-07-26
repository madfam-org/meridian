import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { bi, localizedPath, translator } from '@/lib/i18n';
import { CAPABILITIES, type Tier } from '@/lib/audiences';
import { Badge, Chip } from '@/components/Badge';

import styles from './TierCard.module.css';

/**
 * One commercial tier, rendered with its availability attached.
 *
 * Two rules govern this component and neither is stylistic.
 *
 * **It cannot print a price, because it is never given one.** `Tier.price` is a
 * two-valued state — charged or not charged — and there is no field anywhere in
 * `lib/audiences.ts` that could hold a currency amount. A tier whose price is
 * undecided renders "not set" and says why. That is not a placeholder waiting
 * for a number; it is the honest state, and it is structurally the only thing
 * this component can render until a real price is decided in code.
 *
 * **It cannot print a tier without its availability.** Four of the five tiers
 * cannot be obtained by anybody today — there is no account system, no billing
 * and no serving API — and a pricing card that omits that is a lie told by
 * arrangement rather than by sentence. So availability is rendered inside the
 * card, above the capability list, not in a footnote below the grid.
 *
 * There is no "most popular" flag, no highlighted tier and no default
 * selection. Every one of those is a nudge, this product has no customers to
 * derive a popular tier from, and a nudge invented for a product with zero
 * customers is a fabricated one.
 */
export function TierCard({ tier, locale }: { readonly tier: Tier; readonly locale: Locale }) {
  const t = translator(locale);
  const capabilities = tier.capabilities.map((id) => CAPABILITIES[id]);
  const shipped = capabilities.filter((c) => c.state === 'shipped').length;

  return (
    <article className={styles.tier} aria-labelledby={`tier-${tier.id}-heading`}>
      <header className={styles.head}>
        <h3 className={styles.name} id={`tier-${tier.id}-heading`}>
          {t(tier.name)}
        </h3>

        <p className={styles.premise}>{t(tier.premise)}</p>
      </header>

      <div className={styles.priceRow}>
        {tier.price === 'no_charge' ? (
          <>
            <span className={styles.priceValue}>{t('No charge', 'Sin coste')}</span>
            <span className={styles.priceNote}>
              {t(
                'Permanent. Not a trial, and not a tier that becomes paid later.',
                'Permanente. No es una prueba ni un nivel que después pase a ser de pago.',
              )}
            </span>
          </>
        ) : (
          <>
            <span className={styles.priceValue}>{t('Price not set', 'Precio no fijado')}</span>
            <span className={styles.priceNote}>
              {t(
                'We have not decided what this costs. Rather than print a plausible-looking figure, this page says so — there is no field in the code that could hold one.',
                'No hemos decidido cuánto cuesta. En lugar de imprimir una cifra verosímil, esta página lo dice: no existe en el código ningún campo que pudiera contenerla.',
              )}
            </span>
          </>
        )}
        <span className={styles.unit}>
          <Chip>{t(tier.unit)}</Chip>
        </span>
      </div>

      <div className={styles.availability}>
        <Badge
          tone={tier.availableToday ? 'ok' : 'warn'}
          label={t(
            tier.availableToday
              ? bi('Available today', 'Disponible hoy')
              : bi('Not available yet', 'Aún no disponible'),
          )}
        />
        {tier.blockedOn.length === 0 ? null : (
          <ul className={styles.blockedOn}>
            {tier.blockedOn.map((item) => (
              <li key={item.en}>{t(item)}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.who}>
        <h4 className={styles.subheading}>{t('Who this is for', 'Para quién es')}</h4>
        <p className={styles.whoBody}>{t(tier.buyer)}</p>
      </div>

      <div className={styles.includes}>
        <h4 className={styles.subheading}>
          {t('What is included', 'Qué incluye')}
          <span className={styles.count}>
            {shipped}/{capabilities.length} {t('built today', 'construido hoy')}
          </span>
        </h4>
        <ul className={styles.capabilities}>
          {capabilities.map((capability) => (
            <li key={capability.id} className={styles.capability}>
              <span className={styles.capabilityName}>
                {capability.href !== undefined && capability.state === 'shipped' ? (
                  <Link href={localizedPath(capability.href, locale)}>{t(capability.name)}</Link>
                ) : (
                  t(capability.name)
                )}
              </span>
              {capability.state === 'shipped' ? null : (
                <Badge tone="warn" label={t('Not built', 'No construido')} />
              )}
            </li>
          ))}
        </ul>
      </div>

      {tier.notes.length === 0 ? null : (
        <div className={styles.notes}>
          {tier.notes.map((note) => (
            <p className={styles.note}>{t(note)}</p>
          ))}
        </div>
      )}
    </article>
  );
}
