import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { Citation, DateRange } from '@meridian/core';
import { rangeLengthDays } from '@meridian/core';
import { SCHENGEN_MAX_DAYS, SCHENGEN_WINDOW_DAYS } from '@meridian/presence';

import type { Locale } from '@/lib/i18n';
import { bi, translator } from '@/lib/i18n';
import { readLocale, type LocaleParams } from '@/lib/locale';
import { days, plural } from '@/lib/ui';
import { AS_OF } from '@/lib/sample/common';
import { sampleMatterById } from '@/lib/sample/matters';
import { PRESENCE_CONFIDENCE_LABEL, PRESENCE_SOURCE_LABEL } from '@/lib/audiences';
import { presenceScopeFor } from '@/lib/sample/presence';
import { buildPresenceReport } from '@/lib/presence-view';
import { resolveCitations } from '@/lib/citations';
import { continuityLimbLabel, inconsistencyView } from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { CitationList, CitationRefs } from '@/components/Citations';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import {
  Card,
  CivilDate,
  Empty,
  Facts,
  Fact,
  Figure,
  ScrollX,
  Section,
  Stack,
} from '@/components/Layout';
import { Meter, Working, type WorkingRow } from '@/components/Working';

import styles from './presence.module.css';

interface MatterParams extends LocaleParams {
  readonly id: string;
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<MatterParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  const { id } = await params;
  const t = translator(locale);
  const sample = sampleMatterById(id);
  const heading = t('Day counters', 'Cómputo de días');
  return {
    title: sample === null ? heading : `${heading} — ${t(sample.name)}`,
  };
}

/** `2026-04-20 → 2026-06-14` with both endpoints machine-readable. */
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

/** Rows that spell out a merged set of ranges and the total they sum to. */
function rangeRows(ranges: readonly DateRange[], locale: Locale): WorkingRow[] {
  return ranges.map((r) => ({
    label: bi(`${r.start} to ${r.end}`, `${r.start} a ${r.end}`),
    op: '+',
    value: days(rangeLengthDays(r), locale),
  }));
}

/** The caveat a discretionary source obliges the page to show in place of the number. */
function DiscretionaryCaveat({
  citation,
  locale,
}: {
  readonly citation: Citation;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  if (citation.discretionary !== true) return null;
  return (
    <Callout
      tone="warn"
      icon="!"
      title={t(
        'This figure is administrative practice, not a statutory threshold',
        'Esta cifra es práctica administrativa, no un umbral legal',
      )}
    >
      <p lang="en" className={styles.caveatText}>
        {citation.note ??
          `${citation.instrument} records administrative practice rather than a bright-line rule.`}
      </p>
      <p>
        {t(
          'Treat a result against it as "this would attract scrutiny under the criterion normally applied", not as "this fails". Counsel must confirm the criterion the deciding office actually uses.',
          'Interprete el resultado como «esto sería objeto de examen conforme al criterio que suele aplicarse», no como «esto no cumple». Un letrado debe confirmar el criterio que realmente aplica la oficina que resuelve.',
        )}
      </p>
    </Callout>
  );
}

export default async function PresencePage({ params }: { readonly params: Promise<MatterParams> }) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const { id } = await params;
  const sample = sampleMatterById(id);
  if (sample === null) notFound();

  const scope = presenceScopeFor(sample.matter.id);
  if (scope === null) notFound();

  const report = buildPresenceReport(scope, AS_OF);

  const usedCitationIds = [
    ...(report.schengen?.citationIds ?? []),
    ...report.thresholds.flatMap((t) => t.assessment.citationIds),
    ...(report.continuity?.citationIds ?? []),
  ];
  const resolved = resolveCitations(usedCitationIds);

  return (
    <>
      <Section
        id="record"
        title={t('The record these counts rest on', 'El registro en el que se basan los cómputos')}
        description={t(
          'Each stay is closed at both ends: the day you arrived and the day you left are both days of presence. A stay of one day is one day, not zero.',
          'Cada estancia es cerrada en ambos extremos: el día de llegada y el de salida cuentan ambos como días de presencia. Una estancia de un día es un día, no cero.',
        )}
      >
        <ScrollX>
          <table>
            <caption className={styles.caption}>
              {t(
                'Recorded stays, in chronological order. Ordering is normalised when the ledger is built, so the same records in a different order produce the same figures.',
                'Estancias registradas, en orden cronológico. La ordenación se normaliza al construir el registro, de modo que los mismos datos en otro orden producen las mismas cifras.',
              )}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('Country', 'País')}</th>
                <th scope="col">{t('Period', 'Periodo')}</th>
                <th scope="col">{t('Days', 'Días')}</th>
                <th scope="col">{t('Source', 'Procedencia')}</th>
                <th scope="col">{t('Confidence', 'Fiabilidad')}</th>
                <th scope="col">{t('Notes', 'Notas')}</th>
              </tr>
            </thead>
            <tbody>
              {report.ledger.stays.map((stay) => (
                <tr key={stay.id}>
                  <td>
                    <Chip>{stay.country}</Chip>
                  </td>
                  <td>
                    <RangeText range={stay.range} />
                  </td>
                  <td className={styles.numeric}>{rangeLengthDays(stay.range)}</td>
                  <td className={styles.small}>{t(PRESENCE_SOURCE_LABEL[stay.source])}</td>
                  <td className={styles.small}>{t(PRESENCE_CONFIDENCE_LABEL[stay.confidence])}</td>
                  <td className={styles.small}>
                    <div className={styles.noteStack}>
                      {stay.openEnded === true ? (
                        <Badge
                          tone="warn"
                          label={t('Departure date imputed', 'Fecha de salida imputada')}
                        />
                      ) : null}
                      {stay.exemptFromSchengenShortStay === true ? (
                        <Badge tone="info" label={t('Not a short stay', 'No es estancia corta')} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollX>

        <div>
          <h3 className={styles.subheading}>{t('Record quality', 'Calidad del registro')}</h3>
          {report.inconsistencies.length === 0 ? (
            <Empty
              text={t(
                'No contradictions or unaccounted days found in the period the record is expected to cover.',
                'No se han encontrado contradicciones ni días sin justificar en el periodo que el registro debe cubrir.',
              )}
            />
          ) : (
            <ul className={styles.issueList}>
              {report.inconsistencies.map((issue, index) => (
                <li key={`${issue.kind}-${issue.range.start}-${index}`} className={styles.issue}>
                  <div className={styles.issueHead}>
                    <Badge
                      tone={inconsistencyView(issue.kind).tone}
                      label={t(inconsistencyView(issue.kind).label)}
                    />
                    <RangeText range={issue.range} />
                    <span className={styles.numeric}>{days(issue.days, locale)}</span>
                  </div>
                  <p className={styles.issueDetail} lang="en">
                    {issue.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.footnote}>
            {t(
              'A gap in the record is treated as absence everywhere in this page. That overstates time away, which is the safe direction, but it means a missing entry and a real departure look the same to the arithmetic — which is why they are listed here separately.',
              'En toda esta página, un hueco del registro se trata como ausencia. Eso sobrestima el tiempo fuera, que es la dirección prudente, pero implica que un dato que falta y una salida real son indistinguibles para la aritmética, y por eso se enumeran aquí por separado.',
            )}
          </p>
        </div>
      </Section>

      {report.schengen !== null ? (
        <Section
          id="schengen"
          title={t('Schengen short-stay allowance', 'Franquicia Schengen de estancia corta')}
          description={t(scope.schengenBasis)}
          actions={<CitationRefs ids={report.schengen.citationIds} />}
        >
          <Card>
            <div className={styles.headline}>
              <Figure
                value={report.schengen.value.daysUsed}
                unit={t(`of ${SCHENGEN_MAX_DAYS} days used`, `de ${SCHENGEN_MAX_DAYS} días usados`)}
                tone="strong"
              />
              <Badge
                tone={report.schengen.value.compliant ? 'ok' : 'bad'}
                label={t(
                  report.schengen.value.compliant
                    ? bi('Within the allowance', 'Dentro de la franquicia')
                    : bi('Over the allowance', 'Por encima de la franquicia'),
                )}
              />
            </div>

            <Meter
              used={report.schengen.value.daysUsed}
              limit={SCHENGEN_MAX_DAYS}
              tone={report.schengen.value.compliant ? 'accent' : 'bad'}
            />

            <Facts>
              <Fact label={t('Window assessed', 'Ventana evaluada')}>
                <RangeText
                  range={{
                    start: report.schengen.value.windowStart,
                    end: report.schengen.value.windowEnd,
                  }}
                />
                <div className={styles.factNote}>
                  {t(
                    `${SCHENGEN_WINDOW_DAYS} days ending on, and including, the evaluation date.`,
                    `${SCHENGEN_WINDOW_DAYS} días que terminan en la fecha de evaluación, incluida esta.`,
                  )}
                </div>
              </Fact>
              <Fact label={t('Days still available', 'Días aún disponibles')}>
                <Figure value={report.schengen.value.daysRemaining} unit={t('days', 'días')} />
              </Fact>
              <Fact label={t('Days over the limit', 'Días por encima del límite')}>
                <Figure value={report.schengen.value.daysOverLimit} unit={t('days', 'días')} />
              </Fact>
            </Facts>

            <Working
              locale={locale}
              rows={[
                {
                  label: bi(
                    'Allowance in any 180-day period',
                    'Franquicia en cualquier periodo de 180 días',
                  ),
                  value: days(SCHENGEN_MAX_DAYS, locale),
                  note: bi(
                    'Counting backwards from each day of the stay, not from a fixed date.',
                    'Se cuenta hacia atrás desde cada día de la estancia, no desde una fecha fija.',
                  ),
                },
                ...rangeRows(report.schengen.value.countedRanges, locale),
                {
                  label: bi('Days charged against the allowance', 'Días imputados a la franquicia'),
                  op: '=',
                  value: days(report.schengen.value.daysUsed, locale),
                  note: bi(
                    'Each calendar day counts once however many records cover it — a person cannot spend a day twice.',
                    'Cada día natural cuenta una sola vez por muchos registros que lo cubran: nadie puede gastar un día dos veces.',
                  ),
                },
                {
                  label: bi('Remaining', 'Restantes'),
                  op: '=',
                  value: `${SCHENGEN_MAX_DAYS} − ${report.schengen.value.daysUsed} = ${report.schengen.value.daysRemaining}`,
                  emphasis: true,
                  tone: report.schengen.value.compliant ? 'ok' : 'bad',
                },
              ]}
            />

            {report.schengen.value.contributingStays.length > 0 ? (
              <ScrollX>
                <table>
                  <caption className={styles.caption}>
                    {t(
                      'Which stays charged which days. Summing this column can exceed the total above when two records overlap; that is a defect in the record, not in the count.',
                      'Qué estancias imputaron qué días. La suma de esta columna puede superar el total anterior cuando dos registros se solapan; eso es un defecto del registro, no del cómputo.',
                    )}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('Country', 'País')}</th>
                      <th scope="col">{t('Counted period', 'Periodo computado')}</th>
                      <th scope="col">{t('Days', 'Días')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.schengen.value.contributingStays.map((contribution) => (
                      <tr key={contribution.stayId}>
                        <td>
                          <Chip>{contribution.country}</Chip>
                        </td>
                        <td>
                          <RangeText range={contribution.countedRange} />
                        </td>
                        <td className={styles.numeric}>{contribution.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>
            ) : (
              <Empty
                text={t(
                  'No stay in this window charged against the short-stay allowance.',
                  'Ninguna estancia de esta ventana se ha imputado a la franquicia de estancia corta.',
                )}
              />
            )}

            {report.schengen.value.exemptStayIds.length > 0 ? (
              <Callout
                tone="info"
                icon="i"
                title={t(
                  `${plural(report.schengen.value.exemptStayIds.length, 'stay was', 'stays were')} excluded from the count`,
                  `${report.schengen.value.exemptStayIds.length} estancias se han excluido del cómputo`,
                )}
              >
                <p>
                  {t(
                    'The 90/180 rule governs short stays. Days spent in the State that issued your own residence permit or long-stay visa are not short-stay days, and charging them against your 90 would report an overstay for someone sitting at home. Days in other Schengen States on the strength of that permit still count, and are included above.',
                    'La regla 90/180 rige las estancias cortas. Los días pasados en el Estado que expidió su propia autorización de residencia o visado de larga duración no son días de estancia corta, e imputarlos a sus 90 señalaría una estancia irregular a quien está en su propia casa. Los días en otros Estados Schengen al amparo de esa autorización sí cuentan, y están incluidos arriba.',
                  )}
                </p>
              </Callout>
            ) : null}
          </Card>
        </Section>
      ) : (
        <Section
          id="schengen"
          title={t('Schengen short-stay allowance', 'Franquicia Schengen de estancia corta')}
        >
          <Empty text={t(scope.schengenBasis)} />
        </Section>
      )}

      <Section
        id="tax-day-counts"
        title={t('Tax residence day counts', 'Cómputo de días para residencia fiscal')}
        description={t(
          'How many days the record puts you in the country, against the figure the instrument states. This counts days. It does not determine tax residence, and it applies no treaty tie-breaker.',
          'Cuántos días le sitúa el registro en el país, frente a la cifra que establece la norma. Esto cuenta días. No determina la residencia fiscal ni aplica ningún criterio de desempate de convenio.',
        )}
      >
        <Stack gap="lg">
          {report.thresholds.map(({ threshold, assessment }) => {
            const value = assessment.value;
            return (
              <Card key={threshold.id}>
                <div className={styles.headline}>
                  <div>
                    <h3 className={styles.subheading} lang="en">
                      {threshold.label}
                    </h3>
                    <p className={styles.thresholdMeta}>
                      <Chip>{threshold.country}</Chip> <CitationRefs ids={assessment.citationIds} />
                    </p>
                  </div>
                  {/* Neither outcome is "good": crossing a day-count threshold is
                      a consequence to be aware of, not a failure, and staying
                      under one is not an achievement. `info` rather than `ok`
                      keeps the page from editorialising about someone's tax
                      position. */}
                  <Badge
                    tone={value.met ? 'warn' : 'info'}
                    label={t(
                      value.met
                        ? bi('Threshold reached', 'Umbral alcanzado')
                        : bi('Threshold not reached', 'Umbral no alcanzado'),
                    )}
                  />
                </div>

                <Facts>
                  <Fact label={t('Days recorded', 'Días registrados')}>
                    <Figure value={value.daysPresent} unit={t('days', 'días')} tone="strong" />
                  </Fact>
                  <Fact label={t('Days needed', 'Días necesarios')}>
                    <Figure value={value.requiredDays} unit={t('days', 'días')} />
                  </Fact>
                  <Fact label={t('Margin', 'Margen')}>
                    <Figure value={Math.abs(value.marginDays)} unit={t('days', 'días')} />
                    <div className={styles.factNote}>
                      {t(
                        value.met
                          ? bi('Days past the threshold.', 'Días por encima del umbral.')
                          : bi('Further days before it is reached.', 'Días más hasta alcanzarlo.'),
                      )}
                    </div>
                  </Fact>
                  <Fact label={t('Window counted', 'Ventana computada')}>
                    <RangeText range={value.window} />
                  </Fact>
                </Facts>

                <Working
                  locale={locale}
                  rows={[
                    {
                      label: bi(
                        `The instrument states ${threshold.thresholdDays} days`,
                        `La norma establece ${threshold.thresholdDays} días`,
                      ),
                      value: days(threshold.thresholdDays, locale),
                      note:
                        threshold.comparison === 'more_than'
                          ? bi(
                              '"More than", so the stated figure is not enough on its own.',
                              '«Más de», por lo que la cifra indicada por sí sola no basta.',
                            )
                          : bi(
                              '"At least", so the stated figure is enough.',
                              '«Al menos», por lo que la cifra indicada basta.',
                            ),
                    },
                    {
                      label: bi('First count that meets it', 'Primer cómputo que lo cumple'),
                      op: '=',
                      value: days(value.requiredDays, locale),
                    },
                    ...rangeRows(value.countedRanges, locale),
                    {
                      label: bi('Days present in the window', 'Días presentes en la ventana'),
                      op: '=',
                      value: days(value.daysPresent, locale),
                    },
                    {
                      label: value.met
                        ? bi('Days past the threshold', 'Días por encima del umbral')
                        : bi('Further days required', 'Días adicionales necesarios'),
                      op: '=',
                      value: `${value.requiredDays} − ${value.daysPresent} = ${value.marginDays}`,
                      emphasis: true,
                      tone: value.met ? 'warn' : 'ok',
                    },
                  ]}
                />

                <Facts>
                  <Fact label={t('Reached on', 'Alcanzado el')}>
                    {value.metOn === null ? (
                      <span className={styles.muted}>{t('Not reached', 'No alcanzado')}</span>
                    ) : (
                      <CivilDate value={value.metOn} />
                    )}
                  </Fact>
                  <Fact label={t('Would be reached on', 'Se alcanzaría el')}>
                    {value.projectedCrossingOn === null ? (
                      <span className={styles.muted}>
                        {t(
                          'Not inside the projection horizon',
                          'Fuera del horizonte de proyección',
                        )}
                      </span>
                    ) : (
                      <CivilDate value={value.projectedCrossingOn} />
                    )}
                    <div className={styles.factNote}>
                      {t(
                        'If you were present every day from tomorrow onward. A what-if, not a forecast of what you will do — stays already recorded after the evaluation date are deliberately ignored here so they are not counted twice.',
                        'Si estuviera presente todos los días a partir de mañana. Es una hipótesis, no una previsión de lo que hará: las estancias ya registradas posteriores a la fecha de evaluación se ignoran a propósito para no contarlas dos veces.',
                      )}
                    </div>
                  </Fact>
                </Facts>

                <DiscretionaryCaveat locale={locale} citation={threshold.citation} />
              </Card>
            );
          })}
        </Stack>
      </Section>

      <Section
        id="continuity"
        title={t('Continuity of residence', 'Continuidad de la residencia')}
        description={t(
          scope.continuity?.basis ??
            bi(
              'No continuity policy applies to this matter.',
              'A este expediente no le aplica ninguna política de continuidad.',
            ),
        )}
      >
        {report.continuity === null ? (
          <Empty
            text={t(
              scope.continuityAbsent ??
                bi(
                  'No continuous-residence policy is encoded for this jurisdiction.',
                  'No hay política de residencia continuada codificada para esta jurisdicción.',
                ),
            )}
          />
        ) : (
          <Card>
            <div className={styles.headline}>
              <div>
                <h3 className={styles.subheading} lang="en">
                  {report.continuity.value.policy.label}
                </h3>
                <p className={styles.thresholdMeta}>
                  <Chip>{report.continuity.value.policy.country}</Chip>{' '}
                  <CitationRefs ids={report.continuity.citationIds} />
                </p>
              </div>
              <Badge
                tone={report.continuity.value.satisfied ? 'ok' : 'warn'}
                label={t(
                  report.continuity.value.satisfied
                    ? bi(
                        'No absence exceeds the screening criterion',
                        'Ninguna ausencia supera el criterio de examen',
                      )
                    : bi(
                        'An absence exceeds the screening criterion',
                        'Una ausencia supera el criterio de examen',
                      ),
                )}
              />
            </div>

            <DiscretionaryCaveat
              locale={locale}
              citation={report.continuity.value.policy.citation}
            />

            <Facts>
              <Fact label={t('Period assessed', 'Periodo evaluado')}>
                <RangeText range={report.continuity.value.window} />
              </Fact>
              <Fact label={t('Days in country', 'Días en el país')}>
                <Figure value={report.continuity.value.presenceDays} unit={t('days', 'días')} />
              </Fact>
              <Fact label={t('Days absent', 'Días de ausencia')}>
                <Figure value={report.continuity.value.totalAbsenceDays} unit={t('days', 'días')} />
              </Fact>
              <Fact label={t('Longest single absence', 'Ausencia continua más larga')}>
                <Figure
                  value={report.continuity.value.longestAbsenceDays}
                  unit={t('days', 'días')}
                  tone="strong"
                />
              </Fact>
            </Facts>

            <div>
              <h4 className={styles.subheading}>
                {t('What the policy limits', 'Qué limita la política')}
              </h4>
              <ul className={styles.limbList}>
                <li>
                  {t('Longest single absence', 'Ausencia continua más larga')}
                  {': '}
                  {report.continuity.value.policy.maxSingleAbsenceDays === undefined ? (
                    <span className={styles.muted}>
                      {t('no limit encoded', 'sin límite codificado')}
                    </span>
                  ) : (
                    <strong className={styles.numeric}>
                      {days(report.continuity.value.policy.maxSingleAbsenceDays, locale)}
                    </strong>
                  )}
                </li>
                <li>
                  {t(
                    'Absence within one residence year',
                    'Ausencia dentro de un año de residencia',
                  )}
                  {': '}
                  {report.continuity.value.policy.maxCumulativeAbsenceDaysPerYear === undefined ? (
                    <span className={styles.muted}>
                      {t('no limit encoded', 'sin límite codificado')}
                    </span>
                  ) : (
                    <strong className={styles.numeric}>
                      {days(report.continuity.value.policy.maxCumulativeAbsenceDaysPerYear, locale)}
                    </strong>
                  )}
                </li>
                <li>
                  {t('Absence across the whole period', 'Ausencia en todo el periodo')}
                  {': '}
                  {report.continuity.value.policy.maxCumulativeAbsenceDaysTotal === undefined ? (
                    <span className={styles.muted}>
                      {t('no limit encoded', 'sin límite codificado')}
                    </span>
                  ) : (
                    <strong className={styles.numeric}>
                      {days(report.continuity.value.policy.maxCumulativeAbsenceDaysTotal, locale)}
                    </strong>
                  )}
                </li>
              </ul>
              <p className={styles.footnote}>
                {t(
                  'Where a limb says "no limit encoded", that is not a finding that unlimited absence is acceptable. Figures do circulate for the cumulative limbs, and none is settled enough to assert against a rule where being wrong restarts a ten-year clock.',
                  'Cuando un apartado indica «sin límite codificado», no significa que una ausencia ilimitada sea aceptable. Circulan cifras para los apartados acumulativos, y ninguna está lo bastante asentada como para afirmarla frente a una norma en la que equivocarse reinicia un plazo de diez años.',
                )}
              </p>
            </div>

            {report.continuity.value.breaches.length > 0 ? (
              <div>
                <h4 className={styles.subheading}>
                  {t('Where the criterion is exceeded', 'Dónde se supera el criterio')}
                </h4>
                <ul className={styles.issueList}>
                  {report.continuity.value.breaches.map((breach, index) => (
                    <li key={`${breach.limb}-${index}`} className={styles.issue}>
                      <div className={styles.issueHead}>
                        <Badge tone="warn" label={t(continuityLimbLabel(breach.limb))} />
                        <RangeText range={breach.range} />
                        <span className={styles.numeric}>
                          {days(breach.days, locale)} / {days(breach.limitDays, locale)}
                        </span>
                      </div>
                      <p className={styles.issueDetail} lang="en">
                        {breach.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h4 className={styles.subheading}>{t('Residence years', 'Años de residencia')}</h4>
              <p className={styles.footnote}>
                {t(
                  'Twelve-month periods measured from the date residence began, not from January. A long absence over New Year would be split in half by calendar-year slicing and would pass two annual caps it should fail.',
                  'Periodos de doce meses medidos desde la fecha en que comenzó la residencia, no desde enero. Una ausencia larga a caballo del cambio de año quedaría partida en dos si se troceara por años naturales y superaría dos topes anuales que debería incumplir.',
                )}
              </p>
              <ScrollX>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{t('Year', 'Año')}</th>
                      <th scope="col">{t('Period', 'Periodo')}</th>
                      <th scope="col">{t('Days absent', 'Días de ausencia')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.continuity.value.residenceYears.map((year) => (
                      <tr key={year.index}>
                        <td className={styles.numeric}>{year.index + 1}</td>
                        <td>
                          <RangeText range={year.range} />
                        </td>
                        <td className={styles.numeric}>{year.absenceDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>
            </div>

            <div>
              <h4 className={styles.subheading}>{t('Absences counted', 'Ausencias computadas')}</h4>
              {report.continuity.value.absences.length === 0 ? (
                <Empty
                  text={t(
                    'The record shows unbroken presence across the whole period.',
                    'El registro muestra presencia ininterrumpida durante todo el periodo.',
                  )}
                />
              ) : (
                <Working
                  locale={locale}
                  title={bi('Absences, and their total', 'Ausencias y su total')}
                  rows={[
                    ...rangeRows(report.continuity.value.absences, locale),
                    {
                      label: bi('Total days absent', 'Total de días de ausencia'),
                      op: '=',
                      value: days(report.continuity.value.totalAbsenceDays, locale),
                      emphasis: true,
                    },
                  ]}
                />
              )}
            </div>
          </Card>
        )}
      </Section>

      <Section id="presence-disclosure" title={t('What these figures are', 'Qué son estas cifras')}>
        <DisclosureNotice
          locale={locale}
          shown="assessment"
          withheld={[
            bi(
              'Any statement about when you should travel, when you should file, or which of these thresholds you should try to stay under.',
              'Cualquier indicación sobre cuándo debería viajar, cuándo presentar o bajo cuál de estos umbrales debería intentar mantenerse.',
            ),
            bi(
              'Any conclusion about whether you are tax resident anywhere. This page counts days; residence is a separate test with limbs that have nothing to do with day counts.',
              'Cualquier conclusión sobre si es residente fiscal en algún sitio. Esta página cuenta días; la residencia es una prueba distinta con apartados que nada tienen que ver con el cómputo de días.',
            ),
          ]}
        />
      </Section>

      <Section
        id="presence-sources"
        title={t('Sources', 'Fuentes')}
        description={t(
          'Every rule applied above, with the date a human last read it against the instrument it comes from.',
          'Todas las normas aplicadas arriba, con la fecha en que una persona las contrastó por última vez con el instrumento del que proceden.',
        )}
      >
        <CitationList locale={locale} citations={resolved.found} asOf={AS_OF} />
      </Section>
    </>
  );
}
