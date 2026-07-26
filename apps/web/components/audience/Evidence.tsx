import type { ThresholdBasis, ThresholdComparison } from '@meridian/presence';
import { CEC_CITATIONS, TAX_DAY_COUNT_THRESHOLDS, requiredDays } from '@meridian/presence';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, translator } from '@/lib/i18n';
import { AS_OF } from '@/lib/sample/common';
import {
  ADVICE_GATE_OUTCOMES,
  ADVICE_REFUSAL,
  CEC_FACTS,
  INCONSISTENCY_LABEL,
  PRESENCE_CONFIDENCE_LABEL,
  PRESENCE_SOURCE_LABEL,
  type EvidenceId,
} from '@/lib/audiences';
import { Badge, Chip } from '@/components/Badge';
import { CitationList } from '@/components/Citations';
import { CoverageBoundary } from '@/components/CoverageBoundary';
import { Card, ScrollX } from '@/components/Layout';
import { disclosureClassView } from '@/components/DisclosureNotice';

import styles from './Evidence.module.css';

/**
 * The blocks on an audience page that are computed rather than written.
 *
 * A page addressed to a buyer is the place in a codebase where a claim has no
 * compiler, no test and no reviewer behind it. So the load-bearing claims on
 * these pages are not claims: they are renderings of what the packages actually
 * hold. The release gate is *run*, on this page, and its refusal is quoted in
 * its own words. The day-count thresholds are read out of
 * `@meridian/presence`, comparison operator included. The provenance vocabulary
 * is typed against the package's own unions, so a source or contradiction kind
 * added upstream fails this build until somebody says what it means to a reader
 * rather than silently shipping a page that describes an incomplete list.
 *
 * If a package changes, these blocks change with it or the build stops. That is
 * the only kind of marketing claim this repository is willing to make.
 */

const BASIS_LABEL: Record<ThresholdBasis, Bi> = {
  calendar_year: bi('Calendar year', 'Año natural'),
  rolling_12_months: bi(
    'Twelve months ending on the reference date',
    'Doce meses que terminan en la fecha de referencia',
  ),
};

const COMPARISON_LABEL: Record<ThresholdComparison, Bi> = {
  more_than: bi('More than', 'Más de'),
  at_least: bi('At least', 'Al menos'),
};

/**
 * The gate, run against three audiences with no representative attached.
 *
 * The refusal text is `@meridian/core`'s own, quoted rather than paraphrased
 * and tagged `lang="en"` because that is the language core writes it in. A
 * paraphrase of a compliance determination is a different statement, and the
 * portal's release notices already hold that line.
 */
function ReleaseGateEvidence({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  return (
    <Card tone="sunken">
      <h2 className={styles.title}>
        {t(
          'The gate, asked the same question three times',
          'El control, con la misma pregunta hecha tres veces',
        )}
      </h2>
      <p className={styles.lead}>
        {t(
          'Each row below is a real call to the release gate in @meridian/core, made when this page was built, asking whether a recommendation may reach that reader. No representative is attached in any of them — no licence number is invented anywhere on this site.',
          'Cada fila siguiente es una llamada real al control de divulgación de @meridian/core, hecha al compilar esta página, preguntando si una recomendación puede llegar a ese lector. En ninguna hay un representante vinculado: en este sitio no se inventa ningún número de licencia.',
        )}
      </p>

      <ScrollX>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t('Reader', 'Lector')}</th>
              <th scope="col">{t('Audience', 'Destinatario')}</th>
              <th scope="col">{t('Advice released?', '¿Se entrega asesoramiento?')}</th>
            </tr>
          </thead>
          <tbody>
            {ADVICE_GATE_OUTCOMES.map((row) => (
              <tr key={row.audience}>
                <th scope="row" className={styles.rowHead}>
                  {t(row.label)}
                  <span className={styles.rowDetail}>{t(row.detail)}</span>
                </th>
                <td>
                  <code className={styles.code}>{row.audience}</code>
                </td>
                <td>
                  <Badge
                    tone={row.decision.allowed ? 'ok' : 'bad'}
                    label={t(
                      row.decision.allowed
                        ? bi('Released', 'Entregado')
                        : bi('Refused, and downgraded', 'Denegado, y degradado'),
                    )}
                  />
                  {row.decision.allowed ? null : (
                    <span className={styles.downgrade}>
                      {t('Falls back to', 'Pasa a')}{' '}
                      <Badge
                        tone={disclosureClassView(row.decision.downgradeTo).tone}
                        label={t(disclosureClassView(row.decision.downgradeTo).label)}
                      />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollX>

      {ADVICE_REFUSAL === null ? (
        <p className={styles.alarm}>
          {t(
            'The gate released advice to every audience above, including the unrepresented ones. That is not the intended state of this system, and this page is reporting it rather than hiding it.',
            'El control entregó asesoramiento a todos los destinatarios anteriores, incluidos los que no tienen representación. Ese no es el estado previsto de este sistema, y esta página lo comunica en lugar de ocultarlo.',
          )}
        </p>
      ) : (
        <div className={styles.quoteBlock}>
          <h3 className={styles.subheading}>
            {t('The gate’s own words', 'Las palabras del propio control')}
          </h3>
          <blockquote className={styles.quote} lang="en" cite="urn:meridian:core:canRelease">
            {ADVICE_REFUSAL.reason}
          </blockquote>
        </div>
      )}
    </Card>
  );
}

/**
 * The thresholds, with the operator kept separate from the figure.
 *
 * The two columns that matter sit next to each other: the number as the
 * instrument states it, and the first count that actually satisfies it. Spain
 * says "more than 183", so 184 is the first qualifying day; Canada says "183 or
 * more", so 183 is. One word of statutory text, one day of difference, and in a
 * marginal year one residence.
 */
function DayCountEvidence({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  return (
    <Card tone="sunken">
      <h2 className={styles.title}>
        {t(
          'Every day-count threshold this engine holds',
          'Todos los umbrales de cómputo de días que sostiene este motor',
        )}
      </h2>
      <p className={styles.lead}>
        {t(
          'Read out of @meridian/presence at build time, not transcribed. The figure is stored exactly as the instrument states it and the comparison operator is stored separately, so what is encoded is what a reviewer will find when they open the statute.',
          'Leídos de @meridian/presence al compilar, no transcritos. La cifra se guarda exactamente como la enuncia la norma y el operador de comparación se guarda por separado, de modo que lo codificado es lo que un revisor encontrará al abrir el texto legal.',
        )}
      </p>

      <ScrollX>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t('Threshold', 'Umbral')}</th>
              <th scope="col">{t('Window', 'Ventana')}</th>
              <th scope="col">
                {t('As the instrument states it', 'Tal como lo enuncia la norma')}
              </th>
              <th scope="col">{t('First qualifying count', 'Primer cómputo que la satisface')}</th>
            </tr>
          </thead>
          <tbody>
            {TAX_DAY_COUNT_THRESHOLDS.map((threshold) => (
              <tr key={threshold.id}>
                <th scope="row" className={styles.rowHead}>
                  <Chip>{threshold.country}</Chip> <span lang="en">{threshold.label}</span>
                  <span className={styles.rowDetail}>
                    <code className={styles.code}>{threshold.id}</code>
                  </span>
                </th>
                <td>{t(BASIS_LABEL[threshold.basis])}</td>
                <td>
                  {t(COMPARISON_LABEL[threshold.comparison])}{' '}
                  <strong className={styles.figure}>{threshold.thresholdDays}</strong>{' '}
                  {t('days', 'días')}
                </td>
                <td>
                  <strong className={styles.figure}>{requiredDays(threshold)}</strong>{' '}
                  {t('days', 'días')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollX>

      <div className={styles.sources}>
        <h3 className={styles.subheading}>
          {t('The sources behind them', 'Las fuentes que los sustentan')}
        </h3>
        <CitationList
          locale={locale}
          citations={TAX_DAY_COUNT_THRESHOLDS.map((t) => t.citation)}
          asOf={AS_OF}
        />
      </div>
    </Card>
  );
}

/** What a day in the ledger carries with it, and what the engine refuses to resolve. */
function ProvenanceEvidence({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  return (
    <Card tone="sunken">
      <h2 className={styles.title}>
        {t(
          'What travels with a day, and what is never quietly fixed',
          'Qué acompaña a cada día y qué nunca se corrige en silencio',
        )}
      </h2>
      <p className={styles.lead}>
        {t(
          'A day from a border stamp and a day from a phone’s location history both produce the integer 1. They are not the same evidentiary object, so source and confidence are required fields on every record rather than optional annotations.',
          'Un día procedente de un sello fronterizo y uno procedente del historial de ubicación de un teléfono producen ambos el número 1. No son el mismo objeto probatorio, de modo que la fuente y la fiabilidad son campos obligatorios de cada registro, no anotaciones opcionales.',
        )}
      </p>

      <div className={styles.columns}>
        <div>
          <h3 className={styles.subheading}>
            {t('Where a day came from', 'De dónde procede un día')}
          </h3>
          <ul className={styles.plainList}>
            {Object.entries(PRESENCE_SOURCE_LABEL).map(([key, label]) => (
              <li key={key}>
                <code className={styles.code}>{key}</code> — {t(label)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={styles.subheading}>
            {t('How much weight it bears', 'Cuánto peso soporta')}
          </h3>
          <ul className={styles.plainList}>
            {Object.entries(PRESENCE_CONFIDENCE_LABEL).map(([key, label]) => (
              <li key={key}>
                <code className={styles.code}>{key}</code> — {t(label)}
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>
            {t(
              'Assumed days still count in every total. Omitting them would understate exposure — but a total resting on them is a different thing from one resting on stamps, and the report says which.',
              'Los días supuestos computan igualmente en todos los totales. Omitirlos infravaloraría la exposición, pero un total que se apoya en ellos no es lo mismo que uno que se apoya en sellos, y el informe indica cuál es cuál.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.sources}>
        <h3 className={styles.subheading}>
          {t(
            'Contradictions, reported not resolved',
            'Contradicciones: se informan, no se resuelven',
          )}
        </h3>
        <ul className={styles.plainList}>
          {Object.entries(INCONSISTENCY_LABEL).map(([key, label]) => (
            <li key={key}>
              <code className={styles.code}>{key}</code> — {t(label)}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/** The hours limb of the Canadian Experience Class, from the package's constants. */
function CecEvidence({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  return (
    <Card tone="sunken">
      <h2 className={styles.title}>
        {t(
          'The hours limb, measured in hours rather than months',
          'El elemento de horas, medido en horas y no en meses',
        )}
      </h2>
      <p className={styles.lead}>
        {t(
          'These three figures are the package’s own constants, rendered here rather than restated. Part-time work counts toward the total; hours above the full-time rate do not accumulate, and the cap applies across concurrent jobs rather than per job.',
          'Estas tres cifras son las constantes del propio paquete, mostradas aquí y no reformuladas. El trabajo a tiempo parcial computa para el total; las horas por encima de la jornada completa no acumulan, y el tope se aplica al conjunto de empleos simultáneos y no a cada empleo.',
        )}
      </p>

      <dl className={styles.figures}>
        <div>
          <dt>{t('Hours required', 'Horas exigidas')}</dt>
          <dd>
            <strong className={styles.figure}>{CEC_FACTS.requiredHours}</strong>
          </dd>
        </div>
        <div>
          <dt>{t('Weekly hours cap', 'Tope de horas semanales')}</dt>
          <dd>
            <strong className={styles.figure}>{CEC_FACTS.weeklyCap}</strong>
          </dd>
        </div>
        <div>
          <dt>{t('Lookback, in years', 'Periodo de referencia, en años')}</dt>
          <dd>
            <strong className={styles.figure}>{CEC_FACTS.lookbackYears}</strong>
          </dd>
        </div>
      </dl>

      <p className={styles.footnote}>
        {t(
          'Whether a period qualifies at all — authorised work, a skilled occupation, not work during full-time study — is a legal characterisation the engine does not attempt. It is an input, and periods marked otherwise are excluded and reported by name.',
          'Si un periodo computa siquiera —trabajo autorizado, ocupación cualificada, no trabajo durante estudios a tiempo completo— es una calificación jurídica que el motor no intenta. Es un dato de entrada, y los periodos marcados de otro modo se excluyen y se informan por su nombre.',
        )}
      </p>

      <div className={styles.sources}>
        <h3 className={styles.subheading}>
          {t('The sources behind them', 'Las fuentes que los sustentan')}
        </h3>
        <CitationList locale={locale} citations={CEC_CITATIONS} asOf={AS_OF} />
      </div>
    </Card>
  );
}

export function Evidence({
  id,
  jurisdictions,
  locale,
}: {
  readonly id: EvidenceId;
  readonly jurisdictions?: readonly string[];
  readonly locale: Locale;
}) {
  switch (id) {
    case 'release-gate':
      return <ReleaseGateEvidence locale={locale} />;
    case 'day-count-thresholds':
      return <DayCountEvidence locale={locale} />;
    case 'ledger-provenance':
      return <ProvenanceEvidence locale={locale} />;
    case 'cec-hours':
      return <CecEvidence locale={locale} />;
    case 'catalog-coverage':
      return <CoverageBoundary locale={locale} jurisdictions={jurisdictions} />;
  }
}
