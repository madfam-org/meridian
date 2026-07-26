import type { Metadata } from 'next';
import Link from 'next/link';

import { localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { AUDIENCES } from '@/lib/audiences';
import { Callout } from '@/components/Callout';
import { Page, PageHeader, Section, Stack } from '@/components/Layout';
import { AudienceCards } from '@/components/audience/AudienceCards';

import styles from './for.module.css';

/**
 * The index of audience pages.
 *
 * Six readers, each with a page that opens on their problem rather than on our
 * feature list. The order is the order Meridian was designed around — the one
 * in `lib/audiences.ts` — and the page says outright that this is a statement
 * about our roadmap and not a ranking of the people in it. Nothing on this page
 * reorders itself around a visitor: a list that did would be making a claim
 * about them, and this site does not make claims about people it has not met.
 */

const TITLE = {
  en: 'Who Meridian is for',
  es: 'Para quién es Meridian',
} as const;

const DESCRIPTION = {
  en:
    'Six readers, six pages: the licensed practitioner, the mobility team, the person moving, ' +
    'the cross-border tax adviser, the university international office, and legal-aid clinics.',
  es:
    'Seis lectores, seis páginas: el profesional con licencia, el equipo de movilidad, la persona que ' +
    'se muda, el asesor fiscal transfronterizo, la oficina internacional universitaria y las clínicas ' +
    'jurídicas gratuitas.',
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
    alternates: alternatesFor('/for', locale),
  };
}

export default async function AudienceIndexPage({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const at = (path: string): string => localizedPath(path, locale);

  return (
    <Page>
      <PageHeader
        title={t('Who this is built for', 'Para quién está construido esto')}
        lead={t(
          'Meridian does one thing — it does the arithmetic of migration law and refuses the judgement — and that lands very differently depending on which side of the desk you sit on. Each page below states the problem that reader actually has, which part of Meridian meets it, and what it costs.',
          'Meridian hace una sola cosa —la aritmética del derecho migratorio, rehusando el criterio— y eso encaja de forma muy distinta según de qué lado de la mesa se siente uno. Cada página siguiente expone el problema que tiene realmente ese lector, qué parte de Meridian lo atiende y cuánto cuesta.',
        )}
      />

      <Callout
        tone="info"
        icon="i"
        title={t(
          'The order below means one thing only',
          'El orden siguiente significa una sola cosa',
        )}
      >
        <p>
          {t(
            'It is the order Meridian was designed around, which is a statement about our own roadmap. It is not a ranking of who matters, it does not change with who is reading, and nothing on any of these pages is ordered by anything measured against a person’s facts — an ordering of options is a recommendation, and a recommendation is regulated.',
            'Es el orden en torno al que se diseñó Meridian, es decir, una afirmación sobre nuestra propia hoja de ruta. No es una clasificación de quién importa, no cambia según quién lea, y en ninguna de estas páginas hay nada ordenado por algo medido frente a los datos de una persona: ordenar opciones es recomendar, y recomendar está regulado.',
          )}
        </p>
      </Callout>

      <Section
        id="audiences"
        title={t('The six', 'Los seis')}
        description={t(
          'The individual migrant is the largest of these audiences and the one least likely to pay, which is exactly why the free tier exists and why it is permanent.',
          'La persona migrante es el más numeroso de estos públicos y el que menos probablemente pagará, y por eso existe el nivel gratuito y por eso es permanente.',
        )}
      >
        <AudienceCards locale={locale} audiences={AUDIENCES} />
      </Section>

      <Section id="none-of-these" title={t('If none of these is you', 'Si no es ninguno de estos')}>
        <Stack gap="md">
          <p>
            {t(
              'The free tier does not ask who you are, so nothing on this site depends on finding yourself in a list. Every calculator and the whole rule catalog are open with no account, and they behave identically whichever page you arrived from.',
              'El nivel gratuito no pregunta quién es usted, así que nada de este sitio depende de que se reconozca en una lista. Todas las calculadoras y el catálogo completo de normas están abiertos sin cuenta, y se comportan igual desde cualquier página de la que venga.',
            )}
          </p>
          <p className={styles.links}>
            <Link href={at('/tools')}>
              {t('Use the tools', 'Usar las herramientas')}
              <span aria-hidden="true"> →</span>
            </Link>
            <Link href={at('/pathways')}>
              {t('Read the rule catalog', 'Leer el catálogo de normas')}
              <span aria-hidden="true"> →</span>
            </Link>
            <Link href={at('/pricing')}>
              {t('See every tier', 'Ver todos los niveles')}
              <span aria-hidden="true"> →</span>
            </Link>
          </p>
          <p>
            {t(
              'And if the answer you need is a recommendation — which route to take — Meridian will not give it to you, and neither should any unlicensed platform. Take the figures to a lawyer admitted in the jurisdiction concerned. We name no firm, refer you to nobody, and are paid nothing by anybody for sending you to them.',
              'Y si la respuesta que necesita es una recomendación —qué vía tomar—, Meridian no se la dará, ni debería dársela ninguna plataforma sin licencia. Lleve las cifras a un abogado habilitado en la jurisdicción de que se trate. No nombramos ningún despacho, no le derivamos a nadie y nadie nos paga por enviarle allí.',
            )}
          </p>
        </Stack>
      </Section>

      <Section
        id="also"
        title={t('One more thing that is true of all six', 'Algo más cierto para los seis')}
      >
        <p>
          {t(
            'Meridian will not hold a government authentication credential — no Cl@ve PIN, no portal password, no e.firma key — and will not act before an authority while presenting as somebody. That refusal is in the type system rather than in a policy page, and it does not have a price at which it is lifted.',
            'Meridian no custodiará una credencial de autenticación pública —ni PIN de Cl@ve, ni contraseña de portal, ni clave de e.firma— ni actuará ante una administración haciéndose pasar por alguien. Ese rechazo está en el sistema de tipos y no en una página de políticas, y no tiene un precio al que se levante.',
          )}
        </p>
        <p className={styles.note}>
          {t(
            'Nothing on this site is counsel-reviewed, no government integration is provisioned, and there is no account system. Each page says which of its limits apply to that reader.',
            'Nada en este sitio está revisado por letrado, no hay ninguna integración con la administración aprovisionada y no existe sistema de cuentas. Cada página indica cuáles de sus límites afectan a ese lector.',
          )}
        </p>
      </Section>
    </Page>
  );
}
