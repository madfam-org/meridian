'use client';

/**
 * The Schengen 90/180 calculator, on the marketing page itself.
 *
 * ── Why it is here rather than behind a link ─────────────────────────────────
 *
 * Everything else this site says — that the arithmetic is shown, that every
 * rule carries its source, that a missing fact is never a refusal, that the
 * product refuses to recommend — reads as marketing until somebody has watched
 * it happen once, and reads as integrity immediately afterwards. So the first
 * thing on the page is a working instrument rather than a description of one.
 *
 * ── Why nothing leaves the device ────────────────────────────────────────────
 *
 * The form has no `action`, the submit handler calls `preventDefault`, and the
 * only thing that touches the dates is `readSchengenForm` followed by
 * `countSchengenDays` — pure computation over `@meridian/core`, compiled into
 * this page's JavaScript bundle. There is no `fetch`, no server action, no
 * storage write and no query-string round trip anywhere in this file, and no
 * analytics or third-party script anywhere in this application. A travel
 * history is exactly the kind of thing that must not end up in a server log or
 * a browser history entry, and the claim beside the form is a property of this
 * code rather than an undertaking someone has given.
 *
 * ── What the output is ───────────────────────────────────────────────────────
 *
 * `assessment`-class under `@meridian/core`: the reader's own facts measured
 * against a cited rule, with the arithmetic exposed. That class releases to
 * anyone with no representative attached, which is precisely why this can be
 * free, unauthenticated and unlimited.
 *
 * What it must never say, and does not: whether the traveller will be admitted,
 * when they should travel, which of two dates is better, or what to do about an
 * overstay. Reporting a count is a measurement; recommending a course of action
 * is the regulated act, and nobody licensed is accountable for an answer a web
 * page gives.
 */

import { useEffect, useState, type FormEvent } from 'react';

import { bi, translator, type Locale, type LocalizedText } from '@/lib/i18n';
import { plural } from '@/lib/ui';
import { PORTAL_URL, REPO_URL } from '@/lib/links';
import {
  MAX_STAYS,
  SCHENGEN_CITATION,
  SCHENGEN_EXAMPLES,
  SCHENGEN_MAX_DAYS,
  SCHENGEN_WINDOW_DAYS,
  countSchengenDays,
  type SchengenCount,
  type SchengenExample,
} from '@/lib/schengen';
import {
  EMPTY_ANSWERS,
  FIELD,
  NEXT_STAY_KEY,
  stateOptions,
  answersFromExample,
  atStayLimit,
  blankStayRow,
  readSchengenForm,
  stayFieldId,
  stayRowKey,
  type SchengenAnswers,
  type StayRow,
} from '@/lib/schengen-form';
import { messageFor, type FieldIssue } from '@/lib/validation';

import { Badge, Chip } from '@/components/Badge';
import { Instrument, Prose } from '@/components/Text';
import { Actions, Button, DateField, FieldRow, SelectField } from '@/components/Field';
import { ErrorSummary } from '@/components/ErrorSummary';

import styles from './SchengenCalculator.module.css';

const RESULT_ID = 'sch-result';
const RESULT_HEADING_ID = 'sch-result-heading';

/**
 * The one assumption a hand calculation gets wrong most often, stated in one
 * line above the fields. Its consequence — that a same-day trip is one day
 * rather than none — is spelled out below the rows, where there is room.
 */
const ENDPOINTS_NOTE: LocalizedText = bi(
  'Both the day you arrived and the day you left count as days of presence.',
  'Tanto el día de llegada como el de salida cuentan como días de presencia.',
);

export function SchengenCalculator({ locale }: { readonly locale: Locale }) {
  const t = translator(locale);
  const [answers, setAnswers] = useState<SchengenAnswers>(EMPTY_ANSWERS);
  const [nextKey, setNextKey] = useState(NEXT_STAY_KEY);
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const [count, setCount] = useState<SchengenCount | null>(null);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [resultFocusKey, setResultFocusKey] = useState(0);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  /**
   * Adding or removing a row changes which controls exist, so focus has to move
   * after the render rather than during the handler — and it does have to move:
   * removing the element that had focus otherwise drops the caret onto the
   * document body, which strands a keyboard user at the top of the page.
   */
  useEffect(() => {
    if (pendingFocus === null) return;
    document.getElementById(pendingFocus)?.focus();
    setPendingFocus(null);
  }, [pendingFocus]);

  /** Move focus to the answer once there is one, so it is announced and reachable. */
  useEffect(() => {
    if (resultFocusKey === 0) return;
    document.getElementById(RESULT_ID)?.focus();
  }, [resultFocusKey]);

  function updateStay(key: string, patch: Partial<Omit<StayRow, 'key'>>): void {
    setAnswers((previous) => ({
      ...previous,
      stays: previous.stays.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
  }

  function addStay(): void {
    if (atStayLimit(answers)) return;
    const key = stayRowKey(nextKey);
    setNextKey(nextKey + 1);
    setAnswers((previous) => ({ ...previous, stays: [...previous.stays, blankStayRow(key)] }));
    setPendingFocus(stayFieldId(key, 'country'));
  }

  function removeStay(key: string): void {
    const remaining = answers.stays.filter((row) => row.key !== key);
    // The form always holds at least one row: a list with nothing in it offers
    // nowhere to type and no way back except reloading the page.
    const replacementKey = stayRowKey(nextKey);
    const next = remaining.length > 0 ? remaining : [blankStayRow(replacementKey)];
    if (remaining.length === 0) setNextKey(nextKey + 1);
    setAnswers((previous) => ({ ...previous, stays: next }));
    // Complaints refer to trips by position, and a removal renumbers them.
    setIssues([]);
    const landing = next[next.length - 1];
    if (landing !== undefined) setPendingFocus(stayFieldId(landing.key, 'country'));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    // Nothing is submitted anywhere. Stopping the browser's default navigation
    // is what keeps the dates out of a URL, a request and a history entry.
    event.preventDefault();

    const reading = readSchengenForm(answers);
    if (reading.issues.length > 0 || reading.query === null) {
      setIssues(reading.issues);
      setCount(null);
      setErrorFocusKey((k) => k + 1);
      return;
    }

    setIssues([]);
    setCount(countSchengenDays(reading.query));
    setResultFocusKey((k) => k + 1);
  }

  function clearAll(): void {
    setAnswers(EMPTY_ANSWERS);
    setNextKey(NEXT_STAY_KEY);
    setIssues([]);
    setCount(null);
    setPendingFocus(stayFieldId(stayRowKey(1), 'country'));
  }

  function loadExample(example: SchengenExample): void {
    const loaded = answersFromExample(example, nextKey);
    setAnswers(loaded.answers);
    setNextKey(loaded.nextKey);
    setIssues([]);
    setCount(null);
  }

  const stayCount = answers.stays.length;

  return (
    <div className={styles.calculator}>
      {/*
        The claim stays visible; the evidence for it is one press away.

        A travel history is exactly the kind of thing that must not reach a
        server log, and a reader who is not told will reasonably assume the
        opposite — so the headline sits beside the input rather than in a
        footer. The four supporting properties are real and worth reading, and
        they are also four paragraphs between a visitor and the first field,
        which is the wrong trade on the one screen that has to prove the
        product works. `<details>` is the honest compromise: nothing
        is hidden, nothing is a tooltip, and the disclosure triangle is
        keyboard-operable and announced by every screen reader without a line
        of script.
      */}
      <div className={styles.privacy}>
        <h3 className={styles.privacyTitle}>
          <span aria-hidden="true" className={styles.privacyGlyph}>
            ◆
          </span>
          {t(
            'Runs in your browser. Nothing you type is transmitted or stored.',
            'Se ejecuta en su navegador. Nada de lo que escriba se transmite ni se almacena.',
          )}
        </h3>
        <details className={styles.privacyDetails}>
          <summary className={styles.privacySummary}>
            {t('How to check that yourself', 'Cómo comprobarlo usted mismo')}
          </summary>
          <ul className={styles.privacyPoints}>
            <li>
              {t(
                'The counter is ordinary JavaScript loaded with this page. It makes no network request with your dates.',
                'El cómputo es JavaScript corriente cargado con esta página. No realiza ninguna petición de red con sus fechas.',
              )}
            </li>
            <li>
              {t(
                'Nothing is saved — not in local storage, not in a cookie, not in the address bar. Reload and it is gone.',
                'No se guarda nada: ni en el almacenamiento local, ni en una cookie, ni en la barra de direcciones. Al recargar desaparece.',
              )}
            </li>
            <li>
              {t(
                'There is no analytics, no telemetry and no third-party script in this site. Once the page has loaded you can disconnect from the network and it still works.',
                'Este sitio no tiene analítica, ni telemetría, ni scripts de terceros. Una vez cargada la página puede desconectarse de la red y seguirá funcionando.',
              )}
            </li>
          </ul>
          <p className={styles.privacySource}>
            {t(
              'You do not have to take our word for it — the source is public:',
              'No tiene por qué creernos sin más: el código es público:',
            )}{' '}
            <a
              href={`${REPO_URL}/blob/main/apps/landing/components/SchengenCalculator.tsx`}
              rel="noreferrer noopener"
              target="_blank"
            >
              <code>apps/landing/components/SchengenCalculator.tsx</code>
            </a>
          </p>
        </details>
      </div>

      {/*
        The whole instrument is the page's JavaScript. With scripting off the
        form still renders, and pressing the button would do exactly nothing —
        no navigation, no message, no answer — which is the worst kind of
        failure a page like this can have, because it looks like the product is
        broken rather than like the reader is missing a prerequisite. Saying so
        costs four lines and is the same courtesy the rest of the site extends.
      */}
      <noscript>
        <p className={styles.noscript}>
          {t(
            'This counter needs JavaScript, because the arithmetic runs on your own device rather than on a server. With scripting off the form below will not answer. That is also the reason nothing you type is ever transmitted.',
            'Este cómputo necesita JavaScript, porque la aritmética se ejecuta en su propio dispositivo y no en un servidor. Con el scripting desactivado, el formulario de abajo no responderá. Esa es también la razón por la que nada de lo que escriba se transmite nunca.',
          )}
        </p>
      </noscript>

      <ErrorSummary locale={locale} issues={issues} focusKey={errorFocusKey} />

      {/* `noValidate`: the browser's own validation messages appear in the
          browser's UI language rather than this document's, never appear in the
          error summary, and vanish on the next keystroke. The messages here are
          ours, in the served locale, and listed in one place. */}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t('Your trips', 'Sus viajes')}</legend>

          {/*
            One line before the fields, not four paragraphs. The rest of the
            guidance sits *below* the rows: it is context a reader wants while
            checking their answer rather than a prerequisite for typing a date,
            and a wall of preamble on the first screen is how an instrument
            turns back into a brochure.
          */}
          <p className={styles.hint}>{t(ENDPOINTS_NOTE)}</p>

          <ul className={styles.trips}>
            {answers.stays.map((row, index) => {
              const countryId = stayFieldId(row.key, 'country');
              const startId = stayFieldId(row.key, 'start');
              const endId = stayFieldId(row.key, 'end');
              return (
                <li className={styles.trip} key={row.key}>
                  <fieldset className={styles.tripFields}>
                    <legend className={styles.tripLegend}>
                      {t(`Trip ${index + 1}`, `Viaje ${index + 1}`)}
                    </legend>

                    <FieldRow>
                      <SelectField
                        locale={locale}
                        id={countryId}
                        label={t('State', 'Estado')}
                        error={messageFor(countryId, issues, locale)}
                        required
                        options={stateOptions(locale)}
                        value={row.country}
                        onChange={(value) => updateStay(row.key, { country: value })}
                      />
                      <DateField
                        locale={locale}
                        id={startId}
                        label={t('Day you arrived', 'Día de llegada')}
                        error={messageFor(startId, issues, locale)}
                        required
                        value={row.start}
                        onChange={(value) => updateStay(row.key, { start: value })}
                      />
                      <DateField
                        locale={locale}
                        id={endId}
                        label={t('Day you left', 'Día de salida')}
                        error={messageFor(endId, issues, locale)}
                        required
                        value={row.end}
                        onChange={(value) => updateStay(row.key, { end: value })}
                      />
                    </FieldRow>

                    <Actions>
                      <Button
                        variant="quiet"
                        label={t(`Remove trip ${index + 1}`, `Quitar el viaje ${index + 1}`)}
                        onClick={() => removeStay(row.key)}
                      />
                    </Actions>
                  </fieldset>
                </li>
              );
            })}
          </ul>

          <div className={styles.tripFooter}>
            <Actions>
              <Button
                label={t('Add a trip', 'Añadir un viaje')}
                onClick={addStay}
                disabled={stayCount >= MAX_STAYS}
              />
            </Actions>
            <p className={styles.tripCount}>
              {t(`${stayCount} of ${MAX_STAYS} rows`, `${stayCount} de ${MAX_STAYS} filas`)}
            </p>
          </div>

          <p className={styles.hint}>
            {t(
              'Both endpoints counting is why a trip that lands and leaves on the same day is one day and not none, and why a same-day return carries the same date twice.',
              'Que cuenten ambos extremos es la razón de que un viaje que llega y sale el mismo día sea un día y no ninguno, y de que una ida y vuelta en el día lleve dos veces la misma fecha.',
            )}
          </p>

          <p className={styles.hint}>
            {t(
              'Only Schengen States are offered, because only they consume the allowance — time anywhere else does not need to be entered. Membership is resolved day by day, so a stay in Croatia before 2023-01-01 charges nothing.',
              'Solo se ofrecen Estados Schengen, porque solo ellos consumen la franquicia: el tiempo en cualquier otro lugar no hace falta introducirlo. La pertenencia se resuelve día a día, de modo que una estancia en Croacia antes del 01-01-2023 no imputa nada.',
            )}
          </p>

          <p className={styles.hint}>
            {t(
              'Enter short stays only. If you hold a residence permit or long-stay visa issued by one of these States, days at home in that State are not short stays and do not belong here — the fuller tool in the portal takes that case, and this one would report an overstay for somebody sitting in their own flat.',
              'Introduzca solo estancias cortas. Si tiene una autorización de residencia o un visado de larga duración expedidos por uno de estos Estados, los días en casa en ese Estado no son estancia corta y no corresponden aquí: la herramienta completa del portal contempla ese caso, y esta señalaría una estancia irregular a quien está en su propio piso.',
            )}
          </p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t('The day to measure', 'El día que se mide')}</legend>

          <DateField
            locale={locale}
            id={FIELD.reference}
            label={t('Measure the window ending on', 'Medir la ventana que termina el')}
            hint={t(
              `The rule asks the question afresh for every day of a stay, against the ${SCHENGEN_WINDOW_DAYS} days ending on and including that day. There is no reset date and no annual allowance. This page reads no clock, so the field is pre-filled with ${EMPTY_ANSWERS.referenceDate}, the date this build computes as at; if you are reading later, set today.`,
              `La norma plantea la pregunta de nuevo para cada día de estancia, frente a los ${SCHENGEN_WINDOW_DAYS} días que terminan en ese día, incluido. No hay fecha de reinicio ni franquicia anual. Esta página no consulta ningún reloj, de modo que el campo viene rellenado con ${EMPTY_ANSWERS.referenceDate}, la fecha a la que calcula esta compilación; si lee esto más tarde, ponga hoy.`,
            )}
            error={messageFor(FIELD.reference, issues, locale)}
            required
            value={answers.referenceDate}
            onChange={(value) => setAnswers((p) => ({ ...p, referenceDate: value }))}
          />
        </fieldset>

        <Actions>
          <Button
            type="submit"
            variant="primary"
            label={t('Count my days', 'Contar mis días')}
            // Only once the region exists: `aria-controls` pointing at an absent
            // id is a dangling reference, not a relationship.
            controls={count !== null ? RESULT_ID : undefined}
          />
          <Button variant="secondary" label={t('Clear', 'Borrar')} onClick={clearAll} />
        </Actions>

        <div className={styles.examples}>
          <p className={styles.examplesLead} id="sch-examples-label">
            {t(
              'Or load an invented itinerary. Each is a case a hand calculation gets wrong.',
              'O cargue un itinerario inventado. Cada uno es un caso que un cálculo a mano falla.',
            )}
          </p>
          <ul className={styles.exampleList} aria-labelledby="sch-examples-label">
            {SCHENGEN_EXAMPLES.map((example) => (
              <li key={example.id}>
                <Button label={t(example.label)} onClick={() => loadExample(example)} />
                <span className={styles.exampleNote}>{t(example.note)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>
            {t(
              'The itineraries are country codes and dates, nothing else. No name, no document number, no date of birth: Meridian carries no real personal data anywhere, including in its examples.',
              'Los itinerarios son códigos de país y fechas, nada más. Sin nombre, sin número de documento, sin fecha de nacimiento: Meridian no contiene datos personales reales en ninguna parte, tampoco en sus ejemplos.',
            )}
          </p>
        </div>
      </form>

      {count !== null ? <CountResult count={count} locale={locale} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The answer
// ---------------------------------------------------------------------------

const OUTCOME_LABEL: Record<SchengenCount['outcome'], LocalizedText> = {
  within: bi('Inside the allowance', 'Dentro de la franquicia'),
  over: bi('Over the allowance', 'Por encima de la franquicia'),
  undetermined: bi('The record cannot decide', 'El registro no puede decidirlo'),
};

const OUTCOME_TONE = {
  within: 'ok',
  over: 'bad',
  undetermined: 'review',
} as const;

function CountResult({
  count,
  locale,
}: {
  readonly count: SchengenCount;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  // Every trip the reader entered appears, including the ones that charged
  // nothing. Dropping a row because it contributed zero would leave somebody
  // scanning the table for a trip they know they took, and the reason a trip
  // charged nothing is usually the most interesting line in the answer.
  return (
    <section
      className={styles.result}
      id={RESULT_ID}
      tabIndex={-1}
      aria-labelledby={RESULT_HEADING_ID}
    >
      <h3 className={styles.resultHeading} id={RESULT_HEADING_ID}>
        {t('What the rule makes of your dates', 'Qué dicen las normas de sus fechas')}
      </h3>

      <div className={styles.headline}>
        <p className={styles.headlineFigure}>
          <span className={styles.headlineNumber}>{count.daysUsed}</span>
          <span className={styles.headlineOf}>
            {t(
              `of your ${SCHENGEN_MAX_DAYS} days used`,
              `de sus ${SCHENGEN_MAX_DAYS} días consumidos`,
            )}
          </span>
        </p>
        <div className={styles.headlineBadge}>
          <Badge tone={OUTCOME_TONE[count.outcome]} label={t(OUTCOME_LABEL[count.outcome])} />
        </div>
        {/*
          Three branches, not two.

          When the outcome is `undetermined` the figure above is the *lower*
          bound: the record contains days inside a staged-accession window that
          may or may not have charged. Reporting "39 days remain unused" in that
          state would be the single most dangerous sentence this page could
          print — a determinate reassurance built on an indeterminate count —
          so the range is given instead, and the reader is told the upper end
          is over the limit.
        */}
        <p className={styles.headlineDetail}>
          {t(
            count.outcome === 'undetermined'
              ? bi(
                  `Somewhere between ${count.daysUsed} and ${count.daysUsedIfAmbiguousCounted} days are consumed on ${count.referenceDate}, and the upper end is past the ${SCHENGEN_MAX_DAYS}. Which it is depends on days this record cannot resolve — see below.`,
                  `Se consumen entre ${count.daysUsed} y ${count.daysUsedIfAmbiguousCounted} días el ${count.referenceDate}, y el extremo superior supera los ${SCHENGEN_MAX_DAYS}. Cuál de los dos depende de días que este registro no puede resolver: véase más abajo.`,
                )
              : count.daysOverLimit > 0
                ? bi(
                    `That is ${plural(count.daysOverLimit, 'day', 'days')} beyond the allowance on ${count.referenceDate}.`,
                    `${count.daysOverLimit === 1 ? 'Es' : 'Son'} ${plural(count.daysOverLimit, 'día', 'días')} por encima de la franquicia el ${count.referenceDate}.`,
                  )
                : bi(
                    `${plural(count.daysRemaining, 'day', 'days')} of the allowance ${count.daysRemaining === 1 ? 'remains' : 'remain'} unused on ${count.referenceDate}.`,
                    `${count.daysRemaining === 1 ? 'Queda' : 'Quedan'} ${plural(count.daysRemaining, 'día', 'días')} de franquicia sin consumir el ${count.referenceDate}.`,
                  ),
          )}
        </p>
      </div>

      <p className={styles.window}>
        {t(
          `Measured over the ${SCHENGEN_WINDOW_DAYS} days from ${count.window.start} to ${count.window.end}, both included.`,
          `Medido sobre los ${SCHENGEN_WINDOW_DAYS} días del ${count.window.start} al ${count.window.end}, ambos incluidos.`,
        )}
      </p>

      <h4 className={styles.subHeading}>{t('The arithmetic', 'La aritmética')}</h4>

      <div className={styles.scrollX}>
        <table className={styles.workingTable}>
          <caption className={styles.tableCaption}>
            {t(
              'Every trip you entered, how many of its days fell inside the window, and how many of those charged against the allowance.',
              'Cada viaje que introdujo, cuántos de sus días quedaron dentro de la ventana y cuántos de ellos se imputaron a la franquicia.',
            )}
          </caption>
          <thead>
            <tr>
              <th scope="col">{t('Trip', 'Viaje')}</th>
              <th scope="col">{t('Days in the trip', 'Días del viaje')}</th>
              <th scope="col">{t('Inside the window', 'Dentro de la ventana')}</th>
              <th scope="col">{t('Charged', 'Imputados')}</th>
            </tr>
          </thead>
          <tbody>
            {count.stays.map((stay) => (
              <tr key={stay.id}>
                <th scope="row" className={styles.rowHead}>
                  <span className={styles.tripName}>
                    <Chip>{stay.country}</Chip> {t(stay.countryName)}
                  </span>
                  <span className={styles.tripDates}>
                    <time dateTime={stay.range.start}>{stay.range.start}</time>
                    {' → '}
                    <time dateTime={stay.range.end}>{stay.range.end}</time>
                  </span>
                  {stay.uncounted.length > 0 ? (
                    <ul className={styles.reasons}>
                      {stay.uncounted.map((reason) => (
                        <li key={`${stay.id}-${reason.key}`}>
                          <span className={styles.reasonDays}>
                            {t(
                              `${plural(reason.days, 'day', 'days')} not charged`,
                              `${plural(reason.days, 'día', 'días')} sin imputar`,
                            )}
                          </span>{' '}
                          {t(reason.text)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </th>
                <td className={styles.num}>{stay.stayDays}</td>
                <td className={styles.num}>{stay.daysInsideWindow}</td>
                <td className={styles.num}>{stay.countedDays}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className={styles.rowHead}>
                {t('Total, with any day counted once', 'Total, contando cada día una sola vez')}
              </th>
              <td className={styles.num} />
              <td className={styles.num} />
              <td className={styles.num}>
                <strong>{count.daysUsed}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className={styles.note}>
        {t(
          'The total is taken over the merged days rather than by adding the column up, because a person cannot spend a day twice: two trips that overlap are a mistake in the record, and summing them would invent an overstay out of it.',
          'El total se toma sobre los días fusionados y no sumando la columna, porque nadie puede pasar dos veces el mismo día: dos viajes que se solapan son un error del registro, y sumarlos inventaría una estancia irregular.',
        )}
      </p>

      {count.ambiguous.length > 0 ? (
        <div className={styles.ambiguous}>
          <h4 className={styles.subHeading}>
            {t(
              'Some of these days cannot be resolved by arithmetic',
              'Algunos de estos días no puede resolverlos la aritmética',
            )}
          </h4>
          <ul className={styles.reasons}>
            {count.ambiguous.map((period) => (
              <li key={period.key}>
                {t(
                  `${plural(period.daysInsideWindow, 'day', 'days')} in ${period.countryName.en} fall between ${period.partialSince} and ${period.since}, while accession was still staged. Whether they consumed the allowance depends on how the border was crossed, which no record here holds. Meridian does not charge them and does not assert they are free: the total would be ${count.daysUsedIfAmbiguousCounted} if every one of them charged.`,
                  `${plural(period.daysInsideWindow, 'día', 'días')} en ${period.countryName.es} caen entre el ${period.partialSince} y el ${period.since}, con la adhesión aún escalonada. Que consumieran o no la franquicia depende de cómo se cruzó la frontera, dato que aquí no consta. Meridian no los imputa ni afirma que estén libres: el total sería ${count.daysUsedIfAmbiguousCounted} si todos ellos se imputaran.`,
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.citation}>
        <h4 className={styles.subHeading}>
          {t('The rule this measured against', 'La norma frente a la que se midió')}
        </h4>
        {/*
          The instrument's name and provision, verbatim in both locales and
          marked with the language they are in. "Reglamento (UE) 2016/399" is
          not what a reader would search EUR-Lex for from this page, and a
          translated statute title is a mis-citation rather than a translation.
        */}
        <p className={styles.citationInstrument}>
          <Instrument source={SCHENGEN_CITATION} />
        </p>
        <p className={styles.citationMeta}>
          <Chip>{SCHENGEN_CITATION.kind}</Chip> <Chip>{SCHENGEN_CITATION.jurisdiction}</Chip>{' '}
          <span className={styles.citationVerified}>
            {t(
              `last checked against its source on ${SCHENGEN_CITATION.verifiedOn}`,
              `contrastada con su fuente por última vez el ${SCHENGEN_CITATION.verifiedOn}`,
            )}
          </span>
        </p>
        {SCHENGEN_CITATION.url !== undefined ? (
          <p className={styles.citationLink}>
            <a href={SCHENGEN_CITATION.url} rel="noreferrer noopener" target="_blank">
              {SCHENGEN_CITATION.url}
            </a>
          </p>
        ) : null}
        {/*
          The note is `@meridian/presence`'s own restatement of what art. 6(1)
          and 6(2) provide, and of what this count does not model. It is left in
          the language the package wrote it in and marked as such. A Spanish
          translation maintained here would be a second, unreviewed statement of
          a legal rule that would go stale silently the next time the package
          revised the sentence — and the sentence is the caveat on a day count
          somebody may act on.
        */}
        {SCHENGEN_CITATION.note !== undefined ? (
          <p className={styles.citationNote} lang="en">
            {SCHENGEN_CITATION.note}
          </p>
        ) : null}
      </div>

      <div className={styles.boundary}>
        <h4 className={styles.subHeading}>
          {t('What this number is, and what it is not', 'Qué es esta cifra y qué no es')}
        </h4>
        <Prose>
          {t(
            'It is an assessment: your own dates measured against a published rule, with the rule named and the working shown so you can check it. It is not permission to travel, not a prediction of what a border officer will do, and not advice about what to do next. Art. 6(1) sets other entry conditions this does not model, and an overstay already in the past is a question for someone licensed to answer it.',
            'Es una evaluación: sus propias fechas medidas frente a una norma publicada, con la norma identificada y el cálculo a la vista para que pueda comprobarlo. No es permiso para viajar, ni una predicción de lo que hará un agente de fronteras, ni asesoramiento sobre qué hacer a continuación. El art. 6(1) fija otras condiciones de entrada que esto no modela, y una estancia irregular ya consumada es una cuestión para alguien con licencia para responderla.',
          )}
        </Prose>
        <p className={styles.onward}>
          <a href={`${PORTAL_URL}/tools/schengen`}>
            {t(
              'The fuller version in the portal: the worst day of a planned trip, and the earliest date a stay of a given length fits',
              'La versión completa en el portal: el peor día de un viaje previsto y la fecha más temprana en que cabe una estancia de una duración dada',
            )}
          </a>
        </p>
      </div>
    </section>
  );
}
