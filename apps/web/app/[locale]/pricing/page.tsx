import type { Metadata } from 'next';
import Link from 'next/link';

import { bi, localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { plural } from '@/lib/ui';
import {
  ADVICE_REFUSAL,
  AUDIENCES,
  CAPABILITIES,
  FREE_CAPABILITY_IDS,
  TIERS,
  TIERS_RELEASING_ADVICE,
  TIERS_RELEASING_ADVICE_TO_UNLICENSED_BUYERS,
  UNAVAILABLE_TIERS,
  releasableToUnrepresented,
  tierById,
} from '@/lib/audiences';
import { Chip } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { Grid, Page, PageHeader, Section, Stack } from '@/components/Layout';
import { AudienceCards } from '@/components/audience/AudienceCards';
import { CapabilityList } from '@/components/audience/CapabilityList';
import { Evidence } from '@/components/audience/Evidence';
import { TierCard } from '@/components/audience/TierCard';

import styles from './pricing.module.css';

/**
 * What is free, what is paid, and why the line is where it is.
 *
 * ── The one claim this page makes, and how it is made ───────────────────────
 *
 * Meridian's commercial line is its legal line: `information` and `assessment`
 * release to anybody, so they are free permanently; `advice` requires an
 * authorised representative, so it is bought by the professional whose licence
 * covers it. This page does not assert that. It renders the release gate being
 * asked, quotes the refusal in the gate's own words, and derives the free
 * tier's contents from the answer. If the gate changed, this page would change
 * with it on the next build.
 *
 * ── What is deliberately absent ─────────────────────────────────────────────
 *
 * No price. Prices are not decided, `Tier` has no field that could hold one,
 * and a plausible-looking figure printed here would be the first fabricated
 * number in a product whose entire proposition is that its numbers are
 * checkable.
 *
 * No testimonial, no logo wall, no customer count, no "most popular" tier, no
 * countdown, no scarcity. Meridian has zero customers, so every one of those
 * would be an invention — and the honest alternative is stronger anyway: the
 * free tier works right now, in the reader's browser, and they can go and check
 * it before believing a word of this page.
 *
 * No claim that any of the paid tiers can be bought. Four of the five cannot,
 * because there is no account system, no billing and no serving API, and each
 * card says so above its own feature list rather than in a footnote.
 */

const TITLE = { en: 'Pricing', es: 'Precios' } as const;

const DESCRIPTION = {
  en:
    'What is free in Meridian, what is paid, and why the line falls where the advice boundary falls. ' +
    'Prices are not set, four of the five tiers cannot be bought yet, and this page says both.',
  es:
    'Qué es gratuito en Meridian, qué es de pago y por qué la línea cae donde cae la frontera del ' +
    'asesoramiento. Los precios no están fijados, cuatro de los cinco niveles todavía no pueden ' +
    'comprarse, y esta página dice ambas cosas.',
} as const;

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  return {
    title: TITLE[locale],
    description: DESCRIPTION[locale],
    alternates: alternatesFor('/pricing', locale),
  };
}

const clinicTier = tierById('clinic');
const professionalTier = tierById('professional');

const unavailableCount = UNAVAILABLE_TIERS.length;
const adviceTierNames = TIERS_RELEASING_ADVICE.map((tier) => tier.name.en).join(' and ');
const adviceTierNamesEs = TIERS_RELEASING_ADVICE.map((tier) => tier.name.es).join(' y ');

/**
 * The capabilities a licence actually gates, counted by asking the gate rather
 * than by reading a label off them. One, today — which is the point of the
 * sentence it appears in: the licence boundary is narrow, and everything else
 * that is paid for is continuity.
 */
const gatedCapabilities = professionalTier.capabilities.filter(
  (id) => !releasableToUnrepresented(CAPABILITIES[id].produces),
);

export default async function PricingPage({ params }: { readonly params: Promise<LocaleParams> }) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const at = (path: string): string => localizedPath(path, locale);

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Chip>{t('Pricing', 'Precios')}</Chip>
            <Chip>{t('Prices not set', 'Precios no fijados')}</Chip>
          </>
        }
        title={t(
          'The advice boundary is the price boundary',
          'La frontera del asesoramiento es la frontera del precio',
        )}
        lead={t(
          'Everything the release gate hands to a person with nobody accountable for them is free, permanently and without an account. The one thing it refuses is a recommendation, because a recommendation needs somebody a regulator can hold answerable — and that is what the Professional tier is. The commercial line and the legal line are the same line, and this page shows the gate drawing it.',
          'Todo lo que el control de divulgación entrega a una persona sin nadie que responda por ella es gratuito, de forma permanente y sin cuenta. Lo único que deniega es una recomendación, porque una recomendación exige alguien a quien un regulador pueda exigir cuentas, y en eso consiste el nivel Profesional. La línea comercial y la línea jurídica son la misma línea, y esta página muestra al control trazándola.',
        )}
      />

      {/* The state of the product, stated before anything is described. A
          pricing page for something nobody can buy is honest if it opens with
          that and dishonest if it mentions it at the bottom. The count is
          derived, so it corrects itself the day a tier becomes obtainable. */}
      <Callout
        tone={unavailableCount === 0 ? 'info' : 'warn'}
        icon={unavailableCount === 0 ? 'i' : '!'}
        title={t(
          unavailableCount === 0
            ? bi(
                'Every tier below can be obtained today',
                'Todos los niveles siguientes pueden obtenerse hoy',
              )
            : bi(
                'Most of what is below cannot be bought today',
                'La mayor parte de lo que sigue no puede comprarse hoy',
              ),
        )}
      >
        <p>
          {t(
            `${unavailableCount} of the ${TIERS.length} tiers on this page cannot be obtained by anybody right now. There is no account system, no billing has ever been connected, and the API is not serving. What does work today is the free tier, in full, in your browser, with no sign-in — which is the part you can verify for yourself before believing anything else here.`,
            `${unavailableCount} de los ${TIERS.length} niveles de esta página no puede obtenerlos nadie ahora mismo. No hay sistema de cuentas, nunca se ha conectado la facturación y la API no está en servicio. Lo que sí funciona hoy es el nivel gratuito, íntegro, en su navegador y sin registro, que es la parte que puede comprobar usted mismo antes de creer nada más de lo que aquí se dice.`,
          )}
        </p>
        <p>
          {t(
            'This page is published in that state on purpose. A buyer deciding whether to build a practice around a tool is entitled to know what exists, what is intended, and which is which — and to be told before they ask.',
            'Esta página se publica en ese estado a propósito. Quien esté decidiendo si monta su práctica en torno a una herramienta tiene derecho a saber qué existe, qué está previsto y qué es cada cosa, y a que se lo digan antes de preguntar.',
          )}
        </p>
      </Callout>

      <Section
        id="the-line"
        title={t('Where the line falls, and why', 'Dónde cae la línea y por qué')}
        description={t(
          'Not a packaging decision. Under s.91 of Canada’s Immigration and Refugee Protection Act and Spain’s reserved-activity rules for legal advice, a recommendation made to a person who has nobody accountable for it is a regulated act performed unlawfully. Meridian therefore classifies every output where it is produced and puts one gate between that class and the reader.',
          'No es una decisión de empaquetado. Conforme al art. 91 de la Immigration and Refugee Protection Act de Canadá y a las reglas españolas de actividad reservada para el asesoramiento jurídico, una recomendación dirigida a una persona sin nadie que responda de ella es un acto reservado realizado ilícitamente. Por eso Meridian clasifica cada resultado donde se produce y coloca un único control entre esa clase y el lector.',
        )}
      >
        <Stack gap="md">
          <p>
            {t(
              'Stating what a published rule says is information. Measuring your own recorded facts against that rule and showing the arithmetic is an assessment. Neither is reserved anywhere Meridian operates, so neither is something anybody should have to pay us for — and both are free here, permanently, with no account and no limit.',
              'Exponer lo que dice una norma publicada es información. Medir sus propios datos registrados frente a esa norma y mostrar la aritmética es una evaluación. Ninguna de las dos es actividad reservada allí donde opera Meridian, así que ninguna es algo por lo que nadie deba pagarnos, y ambas son gratuitas aquí, de forma permanente, sin cuenta y sin límite.',
            )}
          </p>
          <p>
            {t(
              'Ranking your options, or saying which one to pursue, is advice. That is the regulated act, and it is not withheld to create a paid tier — it is withheld because releasing it to someone with no licensed person behind it would be an offence committed on their behalf. The Professional tier does not buy permission to see a recommendation. It is the arrangement in which a licensed person becomes accountable for one, which is the only thing that makes it releasable at all.',
              'Ordenar sus opciones, o decir cuál seguir, es asesoramiento. Ese es el acto reservado, y no se retiene para crear un nivel de pago: se retiene porque entregarlo a alguien sin una persona con licencia detrás sería cometer una infracción por su cuenta. El nivel Profesional no compra el permiso de ver una recomendación. Es el arreglo por el cual una persona con licencia pasa a responder de ella, que es lo único que la hace entregable.',
            )}
          </p>
          {ADVICE_REFUSAL === null ? null : (
            <p>
              {t(
                `That is why exactly ${plural(gatedCapabilities.length, 'capability', 'capabilities')} in this entire product sits behind a licence, and why the rest of the paid tiers are about something completely different: continuity. The one-off answer is free. The file that remembers it, and the clock that keeps running while you are not looking, are what a subscription is for.`,
                `Por eso exactamente ${gatedCapabilities.length} funcionalidad de todo el producto queda detrás de una licencia, y por eso el resto de los niveles de pago trata de algo completamente distinto: la continuidad. La respuesta puntual es gratuita. El expediente que la recuerda, y el reloj que sigue corriendo mientras usted no mira, son para lo que sirve una suscripción.`,
              )}
            </p>
          )}
        </Stack>
      </Section>

      {/* The gate, run. Placed here rather than in an appendix because it is the
          evidence for the claim immediately above it, and a claim whose evidence
          is three screens away is a claim being asserted. */}
      <Evidence locale={locale} id="release-gate" />

      <Section
        id="free"
        title={t(
          'The free tier, listed by asking the gate',
          'El nivel gratuito, enumerado preguntando al control',
        )}
        description={t(
          'These are not the features we decided to give away. They are the outputs the release gate hands to a reader with no representative attached, filtered to what is built today and what needs nothing remembered between visits. The list below is computed from that, not typed out.',
          'Estas no son las funcionalidades que decidimos regalar. Son los resultados que el control de divulgación entrega a un lector sin representante vinculado, filtrados a lo que está construido hoy y a lo que no necesita recordar nada entre visitas. La lista siguiente se calcula a partir de eso, no se escribe a mano.',
        )}
      >
        <CapabilityList locale={locale} ids={FREE_CAPABILITY_IDS} />
        <Callout
          tone="accent"
          icon="◆"
          title={t(
            'No result is ever held back for an email address',
            'Ningún resultado se retiene a cambio de un correo',
          )}
        >
          <p>
            {t(
              'Nothing in Meridian computes an answer and then asks who you are before showing it. If the arithmetic runs, you see it, along with the rule it was measured against and the date a person last checked that rule. Trading a result for a contact detail is the behaviour this product exists to be an alternative to, and it is not a growth tactic we are keeping in reserve.',
              'Nada en Meridian calcula una respuesta y luego pregunta quién es usted antes de mostrarla. Si la aritmética se ejecuta, usted la ve, junto con la norma frente a la que se midió y la fecha en que una persona comprobó esa norma por última vez. Cambiar un resultado por un dato de contacto es la práctica frente a la que existe este producto, y no es una táctica de crecimiento que estemos guardando.',
            )}
          </p>
        </Callout>
      </Section>

      <Section
        id="tiers"
        title={t('The tiers', 'Los niveles')}
        description={t(
          'In order of what each one adds, not of what we would prefer you to choose. Nothing here is highlighted as recommended, because a recommended tier is a claim about you and we have never met you.',
          'En orden de lo que añade cada uno, no de lo que preferiríamos que eligiera. Aquí no hay nada destacado como recomendado, porque un nivel recomendado es una afirmación sobre usted y no le conocemos.',
        )}
      >
        <Grid>
          {TIERS.map((tier) => (
            <TierCard locale={locale} key={tier.id} tier={tier} />
          ))}
        </Grid>

        {TIERS_RELEASING_ADVICE_TO_UNLICENSED_BUYERS.length === 0 ? (
          <Callout
            tone="info"
            icon="§"
            title={t(
              'Advice-class output appears only where a licence backs it',
              'Los resultados de clase asesoramiento solo aparecen donde los respalda una licencia',
            )}
          >
            <p>
              {t(
                `Checked at build time across every tier on this page: ${adviceTierNames} are the only ones containing a capability the gate will not release to an unrepresented reader, and both are held by somebody whose licence covers it. No tier bought by an unlicensed buyer contains one — an employer paying a larger contract does not become a licensed audience, and paying nothing at all does not either.`,
                `Comprobado al compilar sobre todos los niveles de esta página: ${adviceTierNamesEs} son los únicos que contienen una funcionalidad que el control no entrega a un lector sin representación, y ambos los ostenta alguien cuya licencia lo ampara. Ningún nivel adquirido por un comprador sin licencia contiene ninguna: un empleador que paga un contrato mayor no se convierte en destinatario con licencia, y no pagar nada tampoco.`,
              )}
            </p>
          </Callout>
        ) : (
          <Callout
            tone="bad"
            icon="✕"
            title={t(
              'A tier contains gated output its buyer is not licensed for',
              'Un nivel contiene resultados restringidos para los que su comprador no tiene licencia',
            )}
          >
            <p>
              {t(
                `${TIERS_RELEASING_ADVICE_TO_UNLICENSED_BUYERS.map((t) => t.name.en).join(', ')} include a capability the release gate refuses to an unrepresented reader, and are described as bought by somebody without a licence covering it. That is a defect in this page’s own data, and it is reported here rather than hidden.`,
                `${TIERS_RELEASING_ADVICE_TO_UNLICENSED_BUYERS.map((t) => t.name.es).join(', ')} incluyen una funcionalidad que el control de divulgación deniega a un lector sin representación, y se describen como adquiridos por alguien sin licencia que la ampare. Es un defecto en los propios datos de esta página, y se comunica aquí en lugar de ocultarse.`,
              )}
            </p>
          </Callout>
        )}
      </Section>

      <Section
        id="clinics"
        title={t(
          'Legal aid and NGO clinics: free, permanently',
          'Clínicas jurídicas y ONG: gratis, de forma permanente',
        )}
        description={t(
          'A public commitment rather than a discount anyone has to ask for. It is on this page so it can be pointed at.',
          'Un compromiso público y no un descuento que haya que pedir. Está en esta página para que pueda señalarse.',
        )}
      >
        <Stack gap="md">
          <p>
            {t(
              'A legal-aid office, a university law clinic or an NGO doing this work gets the full Professional tier at no charge, for as long as this product exists. Not a discount, not a grant programme with a form, not a thing renewed annually, and not something to justify. Tell us you are one and you are one.',
              'Un servicio de orientación jurídica gratuita, una clínica jurídica universitaria o una ONG que haga este trabajo obtiene el nivel Profesional completo sin coste, mientras exista este producto. No es un descuento, ni un programa de subvenciones con formulario, ni algo que se renueve cada año, ni algo que haya que justificar. Díganos que lo son y lo son.',
            )}
          </p>
          <p>
            {t(
              'The reason is not sentimental. Clinics see the cases the commercial market never does — irregular status, expired documents, records with whole years missing — which is exactly where the arithmetic is hardest and where software that surfaces contradictions instead of smoothing them over earns its place. The marginal cost of another clinic is close to nothing. Charging one would be collecting rent on the part of this that has no cost.',
              'La razón no es sentimental. Las clínicas ven los casos que el mercado comercial nunca ve —situación irregular, documentos caducados, historiales con años enteros ausentes—, que es justo donde la aritmética es más difícil y donde un software que muestra las contradicciones en lugar de suavizarlas se gana su sitio. El coste marginal de una clínica más es prácticamente nulo. Cobrarle sería cobrar renta por la parte de esto que no cuesta nada.',
            )}
          </p>
          <p>
            {t(
              'There is nothing to grant access to yet — there is no account system for the commitment to attach to. When there is, this is where it will be described. Until then, the guarantee we are actually in a position to offer is that this paragraph lives in a public repository, so its removal would be visible in the history.',
              'Todavía no hay a qué dar acceso: no existe un sistema de cuentas al que vincular el compromiso. Cuando lo haya, aquí se describirá. Hasta entonces, la garantía que realmente podemos ofrecer es que este párrafo vive en un repositorio público, de modo que su retirada sería visible en el historial.',
            )}
          </p>
          <div className={styles.clinicCard}>
            <TierCard locale={locale} tier={clinicTier} />
          </div>
        </Stack>
      </Section>

      <Section
        id="no-prices"
        title={t(
          'Why there is no number on this page',
          'Por qué en esta página no hay ninguna cifra',
        )}
      >
        <Stack gap="md">
          <p>
            {t(
              'Because we have not decided, and a plausible-looking figure would be the first fabricated number in a product whose whole proposition is that its numbers are checkable. Every other figure on this site is derived from the catalog or computed by an engine, with the source attached. A price invented to fill a card would sit next to those and look exactly like them.',
              'Porque no lo hemos decidido, y una cifra verosímil sería el primer número fabricado en un producto cuya propuesta entera consiste en que sus cifras son comprobables. Todas las demás cifras de este sitio se derivan del catálogo o las calcula un motor, con la fuente adjunta. Un precio inventado para rellenar una tarjeta se colocaría junto a ellas y parecería exactamente igual.',
            )}
          </p>
          <p>
            {t(
              'So the tiers describe what they include and state plainly that pricing is not set. There is no field in the code that could hold an amount, which is the enforcement rather than the intention: the card cannot print a price because it is never given one.',
              'Por eso los niveles describen qué incluyen y declaran sin rodeos que el precio no está fijado. En el código no existe ningún campo que pudiera contener un importe, y esa es la garantía y no la intención: la tarjeta no puede imprimir un precio porque nunca se le da uno.',
            )}
          </p>
          <p>
            {t(
              'What can be said now: the free tier is permanent and is not a trial, nothing currently free moves behind a paywall later, and the clinic commitment is not conditional on the pricing that eventually lands.',
              'Lo que sí puede afirmarse ya: el nivel gratuito es permanente y no es una prueba, nada de lo que ahora es gratuito pasará después detrás de un muro de pago, y el compromiso con las clínicas no depende de los precios que finalmente se fijen.',
            )}
          </p>
        </Stack>
      </Section>

      <Section
        id="audiences"
        title={t('Which of these is you', 'Cuál de estos es usted')}
        description={t(
          'Each page states the problem that reader has, the capability that meets it, and what it costs. They are listed in the order Meridian was designed around, which is a statement about our roadmap and not about the people in it.',
          'Cada página expone el problema que tiene ese lector, la funcionalidad que lo atiende y lo que cuesta. Se enumeran en el orden en torno al que se diseñó Meridian, que es una afirmación sobre nuestra hoja de ruta y no sobre las personas que la componen.',
        )}
      >
        <AudienceCards locale={locale} audiences={AUDIENCES} />
        <p className={styles.footLink}>
          <Link href={at('/tools')}>
            {t(
              'Or skip all of this and use the free tools right now',
              'O sáltese todo esto y use ya las herramientas gratuitas',
            )}
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      </Section>
    </Page>
  );
}
