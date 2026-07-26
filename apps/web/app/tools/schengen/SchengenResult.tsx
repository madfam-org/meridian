'use client';

/**
 * The result of a 90/180 check, rendered.
 *
 * Split out of `SchengenTool` because the two halves have nothing to say to
 * each other: the form owns state and validation, this file owns nothing and
 * renders a value. Every figure below comes from `@meridian/presence` or from
 * `lib/tools/schengen.ts`; nothing here computes a day count, and nothing here
 * decides what a number means.
 *
 * The rule that governs what may appear: this is `assessment`-class output —
 * the reader's own facts measured against a cited rule with the arithmetic
 * exposed — and it must stay there. So there is no ranking of the stays, no
 * ordering by importance, no "best time to travel", no probability, and no
 * sentence beginning "you should". The nearest this comes to the boundary is
 * the earliest date on which a proposed stay would be inside the allowance,
 * which is a measurement of the rule against the record and is reported as one.
 */

import type { DateRange } from '@meridian/core';
import { rangeLengthDays } from '@meridian/core';
import { SCHENGEN_MAX_DAYS, SCHENGEN_WINDOW_DAYS } from '@meridian/presence';

import { bi, type Bi } from '@/lib/i18n';
import { days, plural } from '@/lib/ui';
import {
  DEFAULT_REFERENCE_DATE,
  SCHENGEN_CITATION,
  schengenState,
  type AllowanceOutcome,
  type SchengenReport,
  type StayAnalysis,
} from '@/lib/tools/schengen';
import type { Tone } from '@/components/Badge';
import { Badge, Chip } from '@/components/Badge';
import { T, TInline, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { CitationList } from '@/components/Citations';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import { CivilDate, Empty, Fact, Facts, Figure, ScrollX } from '@/components/Layout';
import { Meter, Working, type WorkingRow } from '@/components/Working';
import { ResultBlock, ResultPanel } from '@/components/tools/ResultPanel';

import styles from './schengen.module.css';

export const SCHENGEN_RESULT_ID = 'schengen-result';

/** `2026-01-27 → 2026-07-25`, both endpoints machine-readable. */
function RangeText({ range }: { readonly range: DateRange }) {
  return (
    <span className={styles.range}>
      <CivilDate value={range.start} />
      <span aria-hidden="true" className={styles.rangeArrow}>
        →
      </span>
      <CivilDate value={range.end} />
    </span>
  );
}

interface OutcomeView {
  readonly tone: Tone;
  readonly verdict: Bi;
}

function outcomeView(outcome: AllowanceOutcome): OutcomeView {
  switch (outcome) {
    case 'within':
      return { tone: 'ok', verdict: bi('Within the allowance', 'Dentro de la franquicia') };
    case 'over':
      return { tone: 'bad', verdict: bi('Over the allowance', 'Por encima de la franquicia') };
    case 'undetermined':
      return {
        tone: 'review',
        verdict: bi('Not determinable on this record', 'No determinable con este registro'),
      };
  }
}

function outcomeLead(report: SchengenReport): Bi {
  const used = report.status.value.daysUsed;
  const over = report.status.value.daysOverLimit;
  const upper = report.daysUsedIfAmbiguousCounted;

  switch (report.outcome) {
    case 'within':
      return bi(
        `On the stays entered, ${used} of the 90 days are charged in the 180 days ending on ${report.referenceDate}. A count inside the allowance is not permission to enter: art. 6(1) sets conditions beyond the day count — purpose, means of subsistence, the absence of an alert — and none of them is tested here.`,
        `Con las estancias introducidas, se imputan ${used} de los 90 días en los 180 que terminan el ${report.referenceDate}. Un cómputo dentro de la franquicia no es permiso de entrada: el art. 6(1) establece condiciones más allá del cómputo de días —finalidad, medios de subsistencia, ausencia de descripción— y aquí no se comprueba ninguna.`,
      );
    case 'over':
      return bi(
        `On the stays entered, ${used} days are charged in the 180 days ending on ${report.referenceDate}. That is ${over} beyond the 90 the rule allows. What follows is the arithmetic and the stays that produced it, so you can check every day of it against your own documents.`,
        `Con las estancias introducidas, se imputan ${used} días en los 180 que terminan el ${report.referenceDate}. Son ${over} por encima de los 90 que permite la norma. A continuación figuran la aritmética y las estancias que la produjeron, para que pueda contrastar cada día con sus propios documentos.`,
      );
    case 'undetermined':
      return bi(
        `Between ${used} and ${upper} of the 90 days are charged, depending on how days inside a staged-accession window are treated. The limit falls between those two figures, so this record on its own does not decide the question — and Meridian will not decide it by picking one.`,
        `Se imputan entre ${used} y ${upper} de los 90 días, según cómo se traten los días situados dentro de una ventana de adhesión escalonada. El límite queda entre esas dos cifras, de modo que este registro por sí solo no resuelve la cuestión, y Meridian no la resolverá eligiendo una.`,
      );
  }
}

/** The terms that produced the total, in the order they were applied. */
function windowWorking(report: SchengenReport): WorkingRow[] {
  const status = report.status.value;
  const rows: WorkingRow[] = [
    {
      label: bi(
        'Allowance in any 180-day period',
        'Franquicia en cualquier periodo de 180 días',
      ),
      value: days(SCHENGEN_MAX_DAYS),
      note: bi(
        'Measured backwards from each day of the stay, not from a fixed date. There is no reset day.',
        'Se mide hacia atrás desde cada día de estancia, no desde una fecha fija. No hay día de reinicio.',
      ),
    },
    {
      label: bi(
        `The ${SCHENGEN_WINDOW_DAYS} days ending on ${report.referenceDate}`,
        `Los ${SCHENGEN_WINDOW_DAYS} días que terminan el ${report.referenceDate}`,
      ),
      value: `${report.window.start} → ${report.window.end}`,
      note: bi(
        'The reference day is one of the 180 and its own presence is counted.',
        'El día de referencia es uno de los 180 y su propia presencia se computa.',
      ),
    },
  ];

  for (const range of status.countedRanges) {
    rows.push({
      label: bi(`${range.start} to ${range.end}`, `${range.start} a ${range.end}`),
      op: '+',
      value: days(rangeLengthDays(range)),
    });
  }

  rows.push({
    label: bi('Days charged against the allowance', 'Días imputados a la franquicia'),
    op: '=',
    value: days(status.daysUsed),
    note: bi(
      'Each calendar day counts once however many stays cover it — a person cannot spend a day twice.',
      'Cada día natural cuenta una sola vez por muchas estancias que lo cubran: nadie puede gastar un día dos veces.',
    ),
  });

  rows.push({
    label: status.compliant
      ? bi('Days still available', 'Días aún disponibles')
      : bi('Days beyond the limit', 'Días por encima del límite'),
    op: '=',
    value: status.compliant
      ? `${SCHENGEN_MAX_DAYS} − ${status.daysUsed} = ${status.daysRemaining}`
      : `${status.daysUsed} − ${SCHENGEN_MAX_DAYS} = ${status.daysOverLimit}`,
    emphasis: true,
    tone: status.compliant ? 'ok' : 'bad',
  });

  if (report.daysUsedIfAmbiguousCounted !== status.daysUsed) {
    rows.push({
      label: bi(
        'If every unresolved day charged instead',
        'Si en cambio se imputaran todos los días sin resolver',
      ),
      op: '=',
      value: days(report.daysUsedIfAmbiguousCounted),
      note: bi(
        'The same window with the staged-accession days added, de-duplicated against the days already counted.',
        'La misma ventana con los días de adhesión escalonada añadidos, sin duplicar los ya computados.',
      ),
      tone: 'review',
    });
  }

  return rows;
}

function StayRow({ stay }: { readonly stay: StayAnalysis }) {
  return (
    <tr>
      <td>
        <Chip>{stay.country}</Chip>{' '}
        <T text={stay.countryName} />
      </td>
      <td>
        <RangeText range={stay.range} />
      </td>
      <td className={styles.numeric}>{stay.stayDays}</td>
      <td>
        {stay.countedRanges.length === 0 ? (
          <span className={styles.muted}>
            <TInline text={bi('Nothing charged', 'Nada imputado')} />
          </span>
        ) : (
          <ul className={styles.countedList}>
            {stay.countedRanges.map((range) => (
              <li key={`${range.start}-${range.end}`}>
                <RangeText range={range} />
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className={styles.numeric}>{stay.countedDays}</td>
      <td>
        {stay.uncounted.length === 0 ? (
          <span className={styles.muted}>
            <TInline text={bi('Every day charged', 'Todos los días imputados')} />
          </span>
        ) : (
          <ul className={styles.why}>
            {stay.uncounted.map((reason) => (
              <li key={reason.key}>
                <span className={styles.whyDays}>{days(reason.days)}</span>{' '}
                <T text={reason.text} />
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}

export function SchengenResult({
  report,
  focusKey,
}: {
  readonly report: SchengenReport;
  readonly focusKey: number;
}) {
  const status = report.status.value;
  const view = outcomeView(report.outcome);
  const statesUsed = [...new Set(report.stays.map((s) => s.country))].sort();
  const contributionTotal = report.stays.reduce((sum, s) => sum + s.countedDays, 0);

  return (
    <ResultPanel
      id={SCHENGEN_RESULT_ID}
      title={bi('Where this record sits against the 90 days', 'Qué dice este registro frente a los 90 días')}
      verdict={view.verdict}
      tone={view.tone}
      lead={outcomeLead(report)}
      focusKey={focusKey}
    >
      {report.conflicts.length > 0 ? (
        <Callout
          tone="bad"
          icon="✕"
          title={bi(
            'The record places you in two countries on the same day',
            'El registro le sitúa en dos países el mismo día',
          )}
        >
          <TProse
            text={bi(
              'At most one of those stays can be true, and nothing here can tell which. Every figure below still counts each day once, so the total is not inflated — but the attribution over these days rests on records that contradict each other.',
              'Como mucho una de esas estancias puede ser cierta, y nada aquí puede decir cuál. Todas las cifras siguientes siguen contando cada día una sola vez, de modo que el total no está inflado, pero la atribución de esos días se apoya en registros que se contradicen.',
            )}
          />
          <ul className={styles.conflictList}>
            {report.conflicts.map((conflict, index) => (
              <li key={`${conflict.range.start}-${index}`}>
                <div className={styles.periodHead}>
                  <RangeText range={conflict.range} />
                  <span className={styles.numeric}>{days(conflict.days)}</span>
                  {conflict.countries.map((country) => (
                    <Chip key={country}>{country}</Chip>
                  ))}
                </div>
                <p className={styles.conflictDetail} lang="en">
                  {conflict.detail}
                </p>
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}

      {report.ambiguous.length > 0 ? (
        <Callout
          tone="review"
          icon="?"
          title={bi(
            'Part of this period needs a person, not a calculator',
            'Parte de este periodo requiere una persona, no una calculadora',
          )}
        >
          <TProse
            text={bi(
              'Bulgaria and Romania acceded to the Schengen area in two steps: internal air and sea border controls were lifted on 2024-03-31, and full accession followed on 2025-01-01. Whether time spent in either State in between consumed the short-stay allowance depends on how the border was crossed and which controls applied to that crossing. A day count cannot recover that from a list of dates, and guessing is harmful in both directions — charging those days invents an overstay, and waiving them hands you days you may not have.',
              'Bulgaria y Rumanía se adhirieron al espacio Schengen en dos fases: los controles fronterizos interiores aéreos y marítimos se levantaron el 31-03-2024 y la adhesión plena llegó el 01-01-2025. Que el tiempo pasado en cualquiera de los dos Estados en ese intervalo consumiera o no la franquicia de estancia corta depende de cómo se cruzó la frontera y de qué controles se aplicaron a ese cruce. Un cómputo de días no puede deducirlo de una lista de fechas, y suponerlo es dañino en ambas direcciones: imputar esos días inventa una estancia irregular y eximirlos le atribuye días que quizá no tenga.',
            )}
          />
          <ul className={styles.periodList}>
            {report.ambiguous.map((period) => (
              <li className={styles.period} key={period.key}>
                <div className={styles.periodHead}>
                  <Chip>{period.country}</Chip>
                  <T text={period.countryName} />
                  <RangeText range={period.range} />
                  <span className={styles.numeric}>{days(period.days)}</span>
                </div>
                <p className={styles.periodDetail}>
                  <T
                    text={bi(
                      `${period.daysInsideWindow} of those days fall inside the 180-day window being measured. The staged window for this State runs from ${period.partialSince} up to, but not including, ${period.since}.`,
                      `${period.daysInsideWindow} de esos días caen dentro de la ventana de 180 días que se está midiendo. La fase escalonada de este Estado va del ${period.partialSince} hasta el ${period.since}, sin incluirlo.`,
                    )}
                  />
                </p>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>
            <T
              text={bi(
                `The totals below are shown both ways: ${status.daysUsed} days with these excluded, and ${report.daysUsedIfAmbiguousCounted} with them charged.`,
                `Los totales siguientes se muestran de las dos maneras: ${status.daysUsed} días excluyéndolos y ${report.daysUsedIfAmbiguousCounted} imputándolos.`,
              )}
            />
          </p>
        </Callout>
      ) : null}

      <ResultBlock
        id="schengen-window"
        title={bi('The window, and what is in it', 'La ventana y lo que contiene')}
        description={bi(
          'The rule asks the question afresh for every day of a stay, against the 180 days ending on and including that day. This block answers it for the reference date you gave.',
          'La norma plantea la pregunta de nuevo para cada día de estancia, frente a los 180 días que terminan en ese día, incluido. Este bloque la responde para la fecha de referencia que usted indicó.',
        )}
      >
        <div className={styles.headline}>
          <Figure
            value={status.daysUsed}
            unit={bi(`of ${SCHENGEN_MAX_DAYS} days charged`, `de ${SCHENGEN_MAX_DAYS} días imputados`)}
            tone="strong"
          />
          <Badge tone={view.tone} label={view.verdict} />
        </div>

        <Meter
          used={status.daysUsed}
          limit={SCHENGEN_MAX_DAYS}
          tone={report.outcome === 'within' ? 'accent' : report.outcome === 'over' ? 'bad' : 'review'}
        />

        <Facts>
          <Fact label={bi('Window measured', 'Ventana medida')}>
            <RangeText range={report.window} />
          </Fact>
          <Fact label={bi('Days charged', 'Días imputados')}>
            <Figure value={status.daysUsed} unit={bi('days', 'días')} />
          </Fact>
          <Fact label={bi('Days still available', 'Días aún disponibles')}>
            <Figure value={status.daysRemaining} unit={bi('days', 'días')} />
          </Fact>
          <Fact label={bi('Days beyond the limit', 'Días por encima del límite')}>
            <Figure value={status.daysOverLimit} unit={bi('days', 'días')} />
          </Fact>
        </Facts>

        {status.countedRanges.length === 0 ? (
          <Empty
            text={bi(
              'No day inside this window was charged against the short-stay allowance.',
              'Ningún día de esta ventana se imputó a la franquicia de estancia corta.',
            )}
          />
        ) : null}

        <Working rows={windowWorking(report)} />
      </ResultBlock>

      <ResultBlock
        id="schengen-stays"
        title={bi('Which stays charged which days', 'Qué estancias imputaron qué días')}
        description={bi(
          'A stay can straddle the edge of the window, so the days charged are often fewer than the days travelled. The last column says where every uncharged day went, because "we counted fewer days than you spent" is a claim that has to be checkable.',
          'Una estancia puede quedar a caballo del borde de la ventana, de modo que los días imputados suelen ser menos que los días viajados. La última columna indica adónde fue cada día no imputado, porque «hemos contado menos días de los que usted pasó» es una afirmación que debe poder comprobarse.',
        )}
      >
        <ScrollX>
          <table>
            <caption className={styles.caption}>
              <T
                text={bi(
                  'Stays in the order they were entered. Summing the charged column can exceed the total above when two stays overlap in time; that is a defect in the record rather than in the count, and the total counts each day once regardless.',
                  'Estancias en el orden en que se introdujeron. La suma de la columna de días imputados puede superar el total anterior cuando dos estancias se solapan en el tiempo; eso es un defecto del registro, no del cómputo, y el total sigue contando cada día una sola vez.',
                )}
              />
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <TInline text={bi('State', 'Estado')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Stay as entered', 'Estancia introducida')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Days', 'Días')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Charged period', 'Periodo imputado')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Days charged', 'Días imputados')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Where the rest went', 'Adónde fue el resto')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {report.stays.map((stay) => (
                <StayRow key={stay.id} stay={stay} />
              ))}
            </tbody>
          </table>
        </ScrollX>

        <p className={styles.footnote}>
          <T
            text={bi(
              `Charged days summed across the stays: ${contributionTotal}. The window total is ${status.daysUsed}. Where the two differ, stays overlap in time and the window has de-duplicated them.`,
              `Suma de días imputados por estancia: ${contributionTotal}. El total de la ventana es ${status.daysUsed}. Cuando ambas cifras difieren, hay estancias solapadas en el tiempo y la ventana las ha deduplicado.`,
            )}
          />
        </p>

        {status.exemptStayIds.length > 0 ? (
          <Callout
            tone="info"
            icon="i"
            title={bi(
              `${plural(status.exemptStayIds.length, 'stay is', 'stays are')} outside the short-stay count`,
              `${status.exemptStayIds.length} ${status.exemptStayIds.length === 1 ? 'estancia queda' : 'estancias quedan'} fuera del cómputo de estancia corta`,
            )}
          >
            <TProse
              text={bi(
                'The 90/180 rule governs short stays. Days spent in the State that issued your own residence permit or long-stay visa are not short-stay days, and charging them against your 90 would report an overstay for somebody sitting at home. Days in other Schengen States on the strength of that permit are still short stays and are counted above.',
                'La regla 90/180 rige las estancias cortas. Los días pasados en el Estado que expidió su propia autorización de residencia o visado de larga duración no son días de estancia corta, e imputarlos a sus 90 señalaría una estancia irregular a quien está en su propia casa. Los días en otros Estados Schengen al amparo de esa autorización siguen siendo estancia corta y se computan arriba.',
              )}
            />
          </Callout>
        ) : null}
      </ResultBlock>

      {report.plannedTrip !== null ? (
        <ResultBlock
          id="schengen-worst-day"
          title={bi('The worst day of the range you gave', 'El peor día del intervalo indicado')}
          description={bi(
            'The window slides underneath a traveller, so usage rises and falls during a trip. A trip that is inside the allowance on the day it starts can breach on its twelfth day and be back inside it by the day it ends. The day that decides whether the trip is lawful is the highest one, and checking the departure date answers a different question.',
            'La ventana se desplaza bajo los pies del viajero, de modo que el consumo sube y baja durante un viaje. Un viaje que está dentro de la franquicia el día que empieza puede superarla en su duodécimo día y volver a estar dentro el día que termina. El día que decide si el viaje es conforme es el más alto, y comprobar la fecha de salida responde a otra pregunta.',
          )}
        >
          <Facts>
            <Fact label={bi('Range scanned', 'Intervalo analizado')}>
              <RangeText range={report.plannedTrip.range} />
              <div className={styles.footnote}>
                <T
                  text={bi(
                    `${report.plannedTrip.rangeDays} days, both endpoints included.`,
                    `${report.plannedTrip.rangeDays} días, con ambos extremos incluidos.`,
                  )}
                />
              </div>
            </Fact>
            <Fact label={bi('Highest usage falls on', 'El consumo más alto cae el')}>
              <CivilDate value={report.plannedTrip.assessment.value.date} />
            </Fact>
            <Fact label={bi('Days charged on that day', 'Días imputados ese día')}>
              <Figure
                value={report.plannedTrip.assessment.value.status.daysUsed}
                unit={bi(`of ${SCHENGEN_MAX_DAYS}`, `de ${SCHENGEN_MAX_DAYS}`)}
                tone="strong"
              />
              <div className={styles.footnote}>
                <T
                  text={bi(
                    `Measured over ${report.plannedTrip.assessment.value.status.windowStart} → ${report.plannedTrip.assessment.value.status.windowEnd}.`,
                    `Medido sobre ${report.plannedTrip.assessment.value.status.windowStart} → ${report.plannedTrip.assessment.value.status.windowEnd}.`,
                  )}
                />
              </div>
            </Fact>
            <Fact label={bi('Days charged on the last day', 'Días imputados el último día')}>
              <Figure
                value={report.plannedTrip.lastDay.value.daysUsed}
                unit={bi(`of ${SCHENGEN_MAX_DAYS}`, `de ${SCHENGEN_MAX_DAYS}`)}
              />
              <div className={styles.footnote}>
                <T
                  text={bi(
                    'Shown for comparison. Where this is lower than the figure beside it, the day of departure understates the trip.',
                    'Se muestra a efectos de comparación. Cuando es inferior a la cifra contigua, el día de salida subestima el viaje.',
                  )}
                />
              </div>
            </Fact>
          </Facts>

          <Working
            title={bi('The worst day, spelled out', 'El peor día, detallado')}
            rows={[
              {
                label: bi('Allowance', 'Franquicia'),
                value: days(SCHENGEN_MAX_DAYS),
              },
              {
                label: bi('Charged on that day', 'Imputados ese día'),
                op: '−',
                value: days(report.plannedTrip.assessment.value.status.daysUsed),
              },
              {
                label: report.plannedTrip.assessment.value.status.compliant
                  ? bi('Days still available on that day', 'Días aún disponibles ese día')
                  : bi('Days beyond the limit on that day', 'Días por encima del límite ese día'),
                op: '=',
                value: report.plannedTrip.assessment.value.status.compliant
                  ? days(report.plannedTrip.assessment.value.status.daysRemaining)
                  : days(report.plannedTrip.assessment.value.status.daysOverLimit),
                emphasis: true,
                tone: report.plannedTrip.assessment.value.status.compliant ? 'ok' : 'bad',
              },
            ]}
          />

          {report.plannedTrip.uncoveredDays > 0 ? (
            <Callout
              tone="warn"
              icon="!"
              title={bi(
                'Part of that range is not covered by any stay you entered',
                'Parte de ese intervalo no está cubierta por ninguna estancia introducida',
              )}
            >
              <TProse
                text={bi(
                  `${report.plannedTrip.uncoveredDays} of the days in that range are not inside any stay above, so the scan treated them as time outside the area. If the trip you are checking has not been entered as a stay, the figures in this block describe staying at home rather than travelling.`,
                  `${report.plannedTrip.uncoveredDays} de los días de ese intervalo no están dentro de ninguna estancia de las anteriores, por lo que el análisis los ha tratado como tiempo fuera del espacio. Si el viaje que está comprobando no se ha introducido como estancia, las cifras de este bloque describen quedarse en casa, no viajar.`,
                )}
              />
              <ul className={styles.periodList}>
                {report.plannedTrip.uncovered.map((range) => (
                  <li key={`${range.start}-${range.end}`}>
                    <RangeText range={range} />{' '}
                    <span className={styles.numeric}>{days(rangeLengthDays(range))}</span>
                  </li>
                ))}
              </ul>
            </Callout>
          ) : null}
        </ResultBlock>
      ) : null}

      {report.proposedStay !== null ? (
        <ResultBlock
          id="schengen-next-entry"
          title={bi(
            'The earliest date an unbroken stay of that length is inside the allowance',
            'La fecha más temprana en que una estancia ininterrumpida de esa duración cabe en la franquicia',
          )}
          description={bi(
            'The test is applied to every day of the hypothetical stay, not only to its first or its last, because the window keeps sliding while the traveller sits there. Stays already entered — including ones in the future — are counted, since they fall inside the same windows.',
            'La comprobación se aplica a todos los días de la estancia hipotética, no solo al primero o al último, porque la ventana sigue desplazándose mientras el viajero permanece allí. Las estancias ya introducidas, incluidas las futuras, se computan, porque caen dentro de las mismas ventanas.',
          )}
        >
          {report.proposedStay.assessment.value === null ? (
            <>
              <div className={styles.answer}>
                <Badge
                  tone={report.proposedStay.exceedsAllowance ? 'bad' : 'warn'}
                  label={bi('No such date', 'No hay tal fecha')}
                />
              </div>
              <TProse
                text={
                  report.proposedStay.exceedsAllowance
                    ? bi(
                        `An unbroken stay of ${report.proposedStay.stayDays} days exceeds the ${SCHENGEN_MAX_DAYS}-day allowance on its own. Whenever it began, it would breach on its ${SCHENGEN_MAX_DAYS + 1}st day, so there is no start date that makes it lawful under this rule. A stay longer than the allowance is a different question — one about long-stay visas and residence permits, which this tool does not answer.`,
                        `Una estancia ininterrumpida de ${report.proposedStay.stayDays} días supera por sí sola la franquicia de ${SCHENGEN_MAX_DAYS} días. Empezara cuando empezara, la superaría en su día ${SCHENGEN_MAX_DAYS + 1}, de modo que no hay fecha de inicio que la haga conforme con esta norma. Una estancia superior a la franquicia es otra cuestión —de visados de larga duración y autorizaciones de residencia— que esta herramienta no responde.`,
                      )
                    : bi(
                        `No day inside the next ${report.proposedStay.horizonDays} days from ${report.proposedStay.notBefore} would carry a stay of ${report.proposedStay.stayDays} days for all of its days. The search stops at that horizon; it does not report that no such date exists, only that none was found inside it.`,
                        `Ningún día dentro de los ${report.proposedStay.horizonDays} días siguientes al ${report.proposedStay.notBefore} admitiría una estancia de ${report.proposedStay.stayDays} días en todos sus días. La búsqueda se detiene en ese horizonte; no afirma que no exista tal fecha, solo que no se encontró dentro de él.`,
                      )
                }
              />
            </>
          ) : (
            <>
              <div className={styles.answer}>
                <CivilDate value={report.proposedStay.assessment.value} />
                <Badge
                  tone="info"
                  label={
                    report.proposedStay.waitDays === 0
                      ? bi('From the date you gave', 'Desde la fecha indicada')
                      : bi(
                          `${report.proposedStay.waitDays ?? 0} days after the date you gave`,
                          `${report.proposedStay.waitDays ?? 0} días después de la fecha indicada`,
                        )
                  }
                />
              </div>
              <Working
                title={bi('How that date was found', 'Cómo se halló esa fecha')}
                rows={[
                  {
                    label: bi('Stay length tested', 'Duración de estancia comprobada'),
                    value: days(report.proposedStay.stayDays),
                    note: bi(
                      'Every day of it is tested against its own 180-day window, not just the first.',
                      'Cada uno de sus días se comprueba frente a su propia ventana de 180 días, no solo el primero.',
                    ),
                  },
                  {
                    label: bi('Earliest start considered', 'Inicio más temprano considerado'),
                    value: report.proposedStay.notBefore,
                  },
                  {
                    label: bi('Days searched forward', 'Días buscados hacia delante'),
                    value: days(report.proposedStay.horizonDays),
                  },
                  {
                    label: bi('First start date that fits', 'Primera fecha de inicio que encaja'),
                    op: '=',
                    value: report.proposedStay.assessment.value,
                    emphasis: true,
                    tone: 'info',
                  },
                ]}
              />
            </>
          )}

          <p className={styles.footnote}>
            <T
              text={bi(
                'This is the first date the arithmetic permits, on the record entered. It is not a suggestion to travel then, and Meridian is not saying it is a good date — only that it is the earliest one where the day count does not stand in the way.',
                'Es la primera fecha que permite la aritmética con el registro introducido. No es una sugerencia de viajar entonces, y Meridian no afirma que sea una buena fecha: solo que es la más temprana en la que el cómputo de días no se interpone.',
              )}
            />
          </p>
        </ResultBlock>
      ) : null}

      <ResultBlock
        id="schengen-membership"
        title={bi('The accession dates this used', 'Las fechas de adhesión utilizadas')}
        description={bi(
          'Membership of the area is time-varying, and the count resolves it for each individual day. These are the dates applied to the States you entered.',
          'La pertenencia al espacio varía en el tiempo, y el cómputo la resuelve día a día. Estas son las fechas aplicadas a los Estados que usted introdujo.',
        )}
      >
        <ScrollX>
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <TInline text={bi('State', 'Estado')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Counted from', 'Computa desde')} />
                </th>
                <th scope="col">
                  <TInline text={bi('Staged from', 'Fase previa desde')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {statesUsed.map((code) => {
                const state = schengenState(code);
                return (
                  <tr key={code}>
                    <td>
                      <Chip>{code}</Chip>{' '}
                      {state === null ? code : <T text={state.name} />}
                    </td>
                    <td>{state === null ? '—' : <CivilDate value={state.since} />}</td>
                    <td>
                      {state === null || state.partialSince === null ? (
                        <span aria-hidden="true" className={styles.muted}>
                          —
                        </span>
                      ) : (
                        <CivilDate value={state.partialSince} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollX>

        <Callout
          tone="warn"
          icon="!"
          title={bi(
            'These dates are data, not a citation',
            'Estas fechas son datos, no una cita',
          )}
        >
          <TProse
            text={bi(
              'The accession dates come from the membership table in @meridian/core. Unlike the 90/180 rule itself, that table is not modelled as a Citation in this build and no lawyer has signed it off — docs/LEGAL_CATALOG_REVIEW.md records it as such. Meridian would rather show you the dates it applied and say they are unverified than attach a pin-cite nobody checked.',
              'Las fechas de adhesión proceden de la tabla de pertenencia de @meridian/core. A diferencia de la propia regla 90/180, esa tabla no está modelada como Citation en esta compilación y ningún letrado la ha validado; así consta en docs/LEGAL_CATALOG_REVIEW.md. Meridian prefiere mostrarle las fechas aplicadas y advertir que no están verificadas antes que añadir una referencia que nadie ha comprobado.',
            )}
          />
        </Callout>
      </ResultBlock>

      <ResultBlock
        id="schengen-sources"
        title={bi('The rule this applied', 'La norma aplicada')}
        description={bi(
          'Freshness is shown against the date this build was compiled as at, not against the reference date you chose — the two answer different questions.',
          'La antigüedad se muestra frente a la fecha en la que se compiló esta versión, no frente a la fecha de referencia que usted eligió: responden a preguntas distintas.',
        )}
      >
        <CitationList citations={[SCHENGEN_CITATION]} asOf={DEFAULT_REFERENCE_DATE} />
      </ResultBlock>

      <DisclosureNotice
        shown="assessment"
        withheld={[
          bi(
            'Whether you will be allowed in. The day count is one of the conditions in art. 6(1); purpose of travel, means of subsistence and the absence of an alert are others, and a border officer applies all of them.',
            'Si le dejarán entrar. El cómputo de días es una de las condiciones del art. 6(1); la finalidad del viaje, los medios de subsistencia y la ausencia de descripción son otras, y el agente de fronteras las aplica todas.',
          ),
          bi(
            'When you should travel, or whether to book. Reporting the earliest date the arithmetic permits is a measurement; recommending a date is advice, and no representative is accountable for an answer a web page gives you.',
            'Cuándo debería viajar o si conviene reservar. Informar de la fecha más temprana que permite la aritmética es una medición; recomendar una fecha es asesoramiento, y ningún representante responde de una respuesta que le dé una página web.',
          ),
          bi(
            'What follows from an overstay, and what to do about one. That depends on the State, on the circumstances and on documents nobody here has seen.',
            'Qué se deriva de una estancia irregular y qué hacer al respecto. Eso depende del Estado, de las circunstancias y de documentos que aquí nadie ha visto.',
          ),
        ]}
      />
    </ResultPanel>
  );
}
