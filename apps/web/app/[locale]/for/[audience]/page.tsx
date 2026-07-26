import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import {
  ADVICE_REFUSAL,
  AUDIENCES,
  audienceById,
  tierById,
  type AdviceRoute,
  type AudienceDefinition,
} from '@/lib/audiences';
import { Chip } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { Page, PageHeader, Section, Stack } from '@/components/Layout';
import { AudienceCards, PricingLink } from '@/components/audience/AudienceCards';
import { CapabilityList } from '@/components/audience/CapabilityList';
import { Evidence } from '@/components/audience/Evidence';
import { TierCard } from '@/components/audience/TierCard';

import styles from './audience.module.css';

/**
 * One page per audience, rendered from `lib/audiences.ts`.
 *
 * A single template rather than six hand-built pages, for the reason the tools
 * index is a registry: six pages drift, and the one that drifts is always the
 * one stating a limit. Every page here therefore carries the same four things
 * in the same order — the problem, what meets it, what it costs, and what
 * Meridian does not do for this reader — and the last of those cannot be
 * omitted from a page, because the template renders it from a required field.
 *
 * The depth varies with the audience, which is what `sections` and `evidence`
 * are for. The cross-border tax adviser gets five sections and two computed
 * evidence blocks because their case is the least obvious and the most
 * checkable; the university office leads with a gap in the catalog rather than
 * with a capability, because telling an institutional buyer what is missing is
 * worth more than telling them what is present.
 */

const ADVICE_ROUTE_NOTE: Record<AdviceRoute, { readonly title: Bi; readonly body: Bi }> = {
  own_licence: {
    title: bi(
      'Your own licence carries the advice',
      'Su propia licencia sostiene el asesoramiento',
    ),
    body: bi(
      'The release gate treats you as a practitioner: the engine is a tool in your hands and the judgement is yours. That is what a practitioner seat is — not permission to see a recommendation, but the arrangement in which a licensed person becomes accountable for one. The tier below carries it.',
      'El control de divulgación le trata como profesional: el motor es una herramienta en sus manos y el criterio es suyo. En eso consiste un puesto de profesional: no en el permiso para ver una recomendación, sino en el arreglo por el cual una persona con licencia pasa a responder de ella. El nivel siguiente lo incorpora.',
    ),
  },
  needs_representative: {
    title: bi(
      'Someone else’s licence has to carry the advice',
      'La licencia de otra persona debe sostener el asesoramiento',
    ),
    body: bi(
      'The gate treats you as a protected audience, and no amount paid changes that. You get every figure, every criterion and every source; a recommendation comes from an authorised representative attached to the matter, which is where the liability for it already sits.',
      'El control le trata como destinatario protegido, y ningún importe pagado cambia eso. Usted obtiene todas las cifras, todos los criterios y todas las fuentes; la recomendación procede de un representante autorizado vinculado al expediente, que es donde ya reside la responsabilidad por ella.',
    ),
  },
  not_engaged: {
    title: bi(
      'No licence gate applies to your use of this',
      'Ningún control de licencia se aplica a su uso de esto',
    ),
    body: bi(
      'Everything you need from Meridian is assessment-class — recorded facts measured against a cited rule, with the arithmetic shown. The gate that governs migration advice never engages in either direction: you need no migration licence to use it, and Meridian will not release migration advice to you on the strength of your own credentials either.',
      'Todo lo que necesita de Meridian es de clase evaluación: datos registrados medidos frente a una norma citada y con la aritmética a la vista. El control que rige el asesoramiento migratorio no se activa en ningún sentido: usted no necesita licencia migratoria para usarlo, y Meridian tampoco le entregará asesoramiento migratorio por sus propias credenciales.',
    ),
  },
};

interface AudienceParams extends LocaleParams {
  readonly audience: string;
}

/**
 * One set of params per audience. Next combines them with the values the
 * `[locale]` layout published, so both language variants of all six pages are
 * prerendered.
 */
export function generateStaticParams(): { audience: string }[] {
  return AUDIENCES.map((audience) => ({ audience: audience.id }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<AudienceParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  const { audience: slug } = await params;
  const t = translator(locale);
  const audience = audienceById(slug);
  if (audience === null) return { title: t('Not found', 'No encontrado') };

  return {
    title: t(audience.name),
    // The reader's own problem, in their words, is a better description than a
    // restatement of what the product does — and it is what a search result
    // needs to be recognisable to the person it is for.
    description: t(audience.who),
    alternates: alternatesFor(`/for/${audience.id}`, locale),
  };
}

function AudienceBody({
  audience,
  locale,
}: {
  readonly audience: AudienceDefinition;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  const tier = tierById(audience.tier);
  const routeNote = ADVICE_ROUTE_NOTE[audience.adviceRoute];

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Chip>{t('Who this is for', 'Para quién es')}</Chip>
            {(audience.jurisdictions ?? []).map((code) => (
              <Chip key={code}>{code}</Chip>
            ))}
          </>
        }
        title={t(audience.name)}
        lead={t(audience.who)}
      />

      <Section
        id="problem"
        title={t('The problem', 'El problema')}
        description={t(
          'Stated before anything about the product, because if this is not your problem then nothing below is worth your time.',
          'Se expone antes que nada del producto, porque si este no es su problema, nada de lo que sigue merece su tiempo.',
        )}
      >
        <p className={styles.problem}>{t(audience.problem)}</p>
      </Section>

      {audience.sections.map((section) => (
        <Section key={section.id} id={section.id} title={t(section.title)}>
          <Stack gap="md">
            {section.body.map((paragraph) => (
              <p>{t(paragraph)}</p>
            ))}
          </Stack>
        </Section>
      ))}

      <Section
        id="capabilities"
        title={t('What meets it', 'Qué lo atiende')}
        description={t(
          'Each item carries the class of statement it produces, whether the release gate hands it to a reader with no representative attached, and whether it is built today. Nothing that is not built is described in the present tense.',
          'Cada elemento indica la clase de enunciado que produce, si el control de divulgación lo entrega a un lector sin representante vinculado y si está construido hoy. Nada que no esté construido se describe en presente.',
        )}
      >
        <CapabilityList locale={locale} ids={audience.capabilities} />
      </Section>

      {audience.evidence.map((id) => (
        <Evidence locale={locale} key={id} id={id} jurisdictions={audience.jurisdictions} />
      ))}

      <Section
        id="cost"
        title={t('What it costs', 'Cuánto cuesta')}
        description={t(
          'Pricing is not set. The tier below states what it includes and whether anybody can obtain it today, which are the two things that can be said honestly right now.',
          'El precio no está fijado. El nivel siguiente indica qué incluye y si alguien puede obtenerlo hoy, que son las dos cosas que pueden afirmarse honestamente ahora mismo.',
        )}
      >
        <Stack gap="md">
          <Callout tone="info" icon="§" title={t(routeNote.title)}>
            <p>{t(routeNote.body)}</p>
            {audience.adviceRoute === 'needs_representative' && ADVICE_REFUSAL !== null ? (
              <blockquote className={styles.quote} lang="en" cite="urn:meridian:core:canRelease">
                {ADVICE_REFUSAL.reason}
              </blockquote>
            ) : null}
          </Callout>

          <div className={styles.tier}>
            <TierCard locale={locale} tier={tier} />
          </div>

          <PricingLink locale={locale} />
        </Stack>
      </Section>

      <Section
        id="limits"
        title={t('What Meridian does not do for you', 'Qué no hace Meridian por usted')}
        description={t(
          'Named, not gestured at. Every one of these is cheaper to read here than to discover while relying on the product.',
          'Enumerado, no insinuado. Cada uno de estos puntos es más barato de leer aquí que de descubrir mientras se confía en el producto.',
        )}
      >
        <ul className={styles.limits}>
          {audience.limits.map((limit) => (
            <li key={limit.en}>{t(limit)}</li>
          ))}
        </ul>
        <p className={styles.limitsNote}>
          {t(
            'And one that applies to every reader: no rule in the shipped catalog has been signed off by a licensed person, so nothing here is counsel-reviewed today.',
            'Y uno que afecta a todos los lectores: ninguna norma del catálogo publicado ha sido validada por una persona con licencia, de modo que hoy nada de esto está revisado por letrado.',
          )}
        </p>
      </Section>

      <Section
        id="others"
        title={t(
          'If you are also, or instead, one of these',
          'Si además, o en su lugar, es alguno de estos',
        )}
      >
        <AudienceCards locale={locale} audiences={AUDIENCES} currentId={audience.id} />
        <p className={styles.footLink}>
          <Link href={localizedPath('/for', locale)}>
            {t('All six, side by side', 'Los seis, uno al lado del otro')}
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      </Section>
    </Page>
  );
}

export default async function AudiencePage({
  params,
}: {
  readonly params: Promise<AudienceParams>;
}) {
  const locale = await readLocale(params);
  const { audience: slug } = await params;
  const audience = audienceById(slug);
  if (audience === null) notFound();

  return <AudienceBody audience={audience} locale={locale} />;
}
