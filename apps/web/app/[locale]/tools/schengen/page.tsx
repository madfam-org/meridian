/**
 * `/tools/schengen` — the 90/180 short-stay calculator.
 *
 * A server component that renders the page's framing and then hands off to
 * `SchengenTool`, which is where the interaction and the computation live. The
 * split is deliberate: `metadata` can only be exported from a server component,
 * and keeping the prose here means the part that ships to the browser is the
 * part that has to.
 *
 * Nothing on this route reads a request, a cookie, a header or a search
 * parameter, so Next prerenders it as static HTML. There is no server-side
 * handler that could receive a travel history even by accident.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { CoverageBoundary } from '@/components/CoverageBoundary';
import { Page, PageHeader, Section } from '@/components/Layout';

import { SchengenTool } from './SchengenTool';

const TITLE = {
  en: 'Schengen 90/180 calculator',
  es: 'Calculadora Schengen 90/180',
} as const;

const DESCRIPTION = {
  en:
    'Count your Schengen short-stay days against art. 6 of the Schengen Borders Code: the days used ' +
    'in the rolling 180-day window, which stay contributed which days, the worst day of a planned ' +
    'range, and the earliest date a stay of a given length fits. Runs entirely in your browser — ' +
    'nothing you type is transmitted or stored.',
  es:
    'Cuente sus días de estancia corta Schengen frente al art. 6 del Código de fronteras Schengen: los ' +
    'días usados en la ventana móvil de 180 días, qué estancia imputó qué días, el peor día de un ' +
    'intervalo previsto y la fecha más temprana en que cabe una estancia de una duración dada. Se ' +
    'ejecuta íntegramente en su navegador: nada de lo que escribe se transmite ni se almacena.',
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
    alternates: alternatesFor('/tools/schengen', locale),
  };
}

export default async function SchengenToolPage({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}) {
  const locale = await readLocale(params);
  const t = translator(locale);

  return (
    <Page>
      <PageHeader
        eyebrow={<Link href={localizedPath('/tools', locale)}>{t('Tools', 'Herramientas')}</Link>}
        title={t(
          'Schengen 90/180: what your own dates add up to',
          'Schengen 90/180: cuánto suman sus propias fechas',
        )}
        lead={t(
          'The short-stay rule permits 90 days of presence in any 180-day period. The 180 days are counted backwards from each day of the stay, which means there is no reset date, no annual allowance, and no single day on which the answer stays true. It is the arithmetic people most often get wrong by hand, and getting it wrong means an overstay.',
          'La norma de estancia corta permite 90 días de presencia en cualquier periodo de 180 días. Los 180 días se cuentan hacia atrás desde cada día de estancia, lo que significa que no hay fecha de reinicio, ni franquicia anual, ni un solo día en que la respuesta siga siendo válida. Es la aritmética que más se falla a mano, y fallarla supone una estancia irregular.',
        )}
      />

      <Section
        id="what-this-counts"
        title={t('What this counts, and what it cannot', 'Qué computa esto y qué no puede')}
      >
        <p>
          {t(
            'It counts days, and only days. Art. 6(1) of the Schengen Borders Code sets the 90-in-180 limit and also sets the other conditions of entry — the purpose of the visit, means of subsistence, the absence of an alert — and a border officer applies all of them. A count inside the allowance is therefore not permission to travel, and a count outside it is not a decision anybody has taken about you. What this page produces is your own dates measured against a published rule, with the window, the days charged and the days discarded all shown, so you can check every figure against your own documents.',
            'Computa días, y solo días. El art. 6(1) del Código de fronteras Schengen fija el límite de 90 en 180 y también las demás condiciones de entrada —la finalidad de la visita, los medios de subsistencia, la ausencia de descripción—, y el agente de fronteras las aplica todas. Un cómputo dentro de la franquicia no es, por tanto, un permiso para viajar, y un cómputo por encima no es una decisión que nadie haya tomado sobre usted. Lo que produce esta página son sus propias fechas contrastadas con una norma publicada, mostrando la ventana, los días imputados y los días descartados, para que pueda comprobar cada cifra con sus propios documentos.',
          )}
        </p>
        <p>
          {t(
            'Three things the arithmetic gets right that are easy to miss. The day of entry and the day of exit are both days of presence, so a same-day trip is one day and a 90-day allowance runs out sooner than a diary suggests. Membership of the area is time-varying, so days in Croatia before 2023-01-01 consumed nothing. And days spent in Bulgaria or Romania between the lifting of air and sea controls on 2024-03-31 and full accession on 2025-01-01 depend on how the border was crossed: those are reported as a question needing a person, because a day count cannot recover the answer from a list of dates and guessing is harmful in both directions.',
            'Tres cosas que la aritmética resuelve bien y que es fácil pasar por alto. El día de entrada y el de salida son ambos días de presencia, de modo que un viaje de ida y vuelta en el día es un día y la franquicia de 90 se agota antes de lo que sugiere una agenda. La pertenencia al espacio varía en el tiempo, así que los días en Croacia antes del 01-01-2023 no consumieron nada. Y los días pasados en Bulgaria o Rumanía entre el levantamiento de los controles aéreos y marítimos el 31-03-2024 y la adhesión plena el 01-01-2025 dependen de cómo se cruzara la frontera: se plantean como una pregunta que requiere una persona, porque un cómputo de días no puede deducir la respuesta de una lista de fechas y suponerla es dañino en ambas direcciones.',
          )}
        </p>
      </Section>

      {/*
        A day count that comes back over the allowance is the moment a reader
        starts asking what else there is — and what else there is, in this
        product, is a short catalog with large and specific holes in it. The
        result panel already states what a day count cannot decide; this states
        what the catalog behind the rest of the site does not contain, so the two
        limits are both visible from the page a person actually landed on.
      */}
      <CoverageBoundary locale={locale} />

      <SchengenTool locale={locale} />
    </Page>
  );
}
