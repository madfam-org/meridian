'use client';

/**
 * The Schengen 90/180 calculator.
 *
 * Everything happens in the reader's browser. The form has no `action`, the
 * submit handler calls `preventDefault`, and the only thing that touches the
 * dates is `readSchengenForm` followed by `runSchengenCheck` —
 * `@meridian/presence` and `@meridian/core` compiled into this page's
 * JavaScript bundle. There is no `fetch`, no server action, no storage write and
 * no query-string round trip anywhere in this file, and a travel history is
 * exactly the kind of thing that must not end up in a server log or a browser
 * history entry. See `lib/tools/privacy.ts` for why that is said on screen as
 * well as here.
 *
 * The output is `assessment`-class under `@meridian/core`: the reader's own
 * facts measured against a cited rule, with the arithmetic exposed. Three
 * questions are answered and all three are measurements —
 *
 *   - the position on a named day, with the window and the per-stay attribution
 *     that produced it;
 *   - the *worst* day across a range, because the window slides underneath a
 *     traveller and the day of departure is not the day that decides;
 *   - the earliest date on which a stay of a given length would be inside the
 *     allowance for every one of its days.
 *
 * What it must never say, and does not: whether the traveller will be let in,
 * when they should go, which of two dates is better, or what to do about an
 * overstay. Reporting the first date the arithmetic permits is a measurement;
 * recommending it would be advice, and no representative is accountable for an
 * answer a web page gives.
 */

import { useEffect, useState, type FormEvent } from 'react';

import { bi, type Bi } from '@/lib/i18n';
import { sourceUrl } from '@/lib/tools/privacy';
import {
  MAX_PROPOSED_STAY_DAYS,
  MAX_STAYS,
  SCHENGEN_EXAMPLES,
  runSchengenCheck,
  type SchengenExample,
  type SchengenReport,
} from '@/lib/tools/schengen';
import {
  EMPTY_ANSWERS,
  FIELD,
  NEXT_STAY_KEY,
  STATE_OPTIONS,
  answersFromExample,
  atStayLimit,
  blankStayRow,
  readSchengenForm,
  stayFieldId,
  stayRowKey,
  type SchengenAnswers,
  type StayRow,
} from '@/lib/tools/schengen-form';
import { issueFor, type FieldIssue } from '@/lib/tools/validation';

import { T, TInline } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { Card, Section, Stack } from '@/components/Layout';
import { ToolActionGroup, ToolActions, ToolButton } from '@/components/tools/Actions';
import { ErrorSummary } from '@/components/tools/ErrorSummary';
import {
  CheckboxField,
  DateField,
  FieldRow,
  NumberField,
  SelectField,
} from '@/components/tools/Field';
import { PrivacyNote } from '@/components/tools/PrivacyNote';

import { SCHENGEN_RESULT_ID, SchengenResult } from './SchengenResult';

import styles from './schengen.module.css';

const SOURCE_PATH = 'apps/web/app/tools/schengen/SchengenTool.tsx';

/**
 * Both endpoints of every range are inclusive, everywhere in Meridian, because
 * art. 6(2) makes the date of entry the first day of stay and the date of exit
 * the last. Said once here and repeated in the hints, because it is the single
 * assumption a hand calculation gets wrong most often.
 */
const ENDPOINTS_NOTE: Bi = bi(
  'The day you entered and the day you left both count as days of presence, so a trip that arrives and leaves on the same day is one day and not none.',
  'Tanto el día de entrada como el de salida cuentan como días de presencia, de modo que un viaje que llega y sale el mismo día es un día, no ninguno.',
);

export function SchengenTool() {
  const [answers, setAnswers] = useState<SchengenAnswers>(EMPTY_ANSWERS);
  const [nextKey, setNextKey] = useState(NEXT_STAY_KEY);
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const [report, setReport] = useState<SchengenReport | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
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

  function update(patch: Partial<SchengenAnswers>): void {
    setAnswers((previous) => ({ ...previous, ...patch }));
  }

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
    // Complaints refer to rows by position, and a removal renumbers them.
    setIssues([]);
    const landing = next[next.length - 1];
    if (landing !== undefined) setPendingFocus(stayFieldId(landing.key, 'country'));
  }

  function fail(found: readonly FieldIssue[]): void {
    setIssues(found);
    setReport(null);
    setFailure(null);
    setErrorFocusKey((k) => k + 1);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    // Nothing is submitted anywhere. Stopping the browser's default navigation
    // is what keeps the dates out of a URL, a request and a history entry.
    event.preventDefault();

    const reading = readSchengenForm(answers);
    if (reading.issues.length > 0 || reading.query === null) {
      fail(reading.issues);
      return;
    }

    const outcome = runSchengenCheck(reading.query);
    setIssues([]);
    if (!outcome.ok) {
      // Rendered rather than swallowed. The form rejects everything the engine
      // refuses, so this is unreachable today; a future caller that widened a
      // bound would otherwise get a blank panel and a message nobody sees.
      setReport(null);
      setFailure(outcome.message);
      return;
    }
    setFailure(null);
    setReport(outcome.report);
    setResultFocusKey((k) => k + 1);
  }

  function clearAll(): void {
    setAnswers(EMPTY_ANSWERS);
    setNextKey(NEXT_STAY_KEY);
    setIssues([]);
    setReport(null);
    setFailure(null);
    setPendingFocus(stayFieldId(stayRowKey(1), 'country'));
  }

  function loadExample(example: SchengenExample): void {
    const loaded = answersFromExample(example, nextKey);
    setAnswers(loaded.answers);
    setNextKey(loaded.nextKey);
    setIssues([]);
    setReport(null);
    setFailure(null);
  }

  const stayCount = answers.stays.length;

  return (
    <Stack gap="lg">
      <ErrorSummary issues={issues} focusKey={errorFocusKey} />

      <Section
        id="schengen-input"
        title={bi('Your stays', 'Sus estancias')}
        description={bi(
          'One row per unbroken stay in one State, past or planned. Nothing is asked for beyond a State and two dates: no name, no document number, no reason for travel. What you enter is measured against the rule and then forgotten when you close the page.',
          'Una fila por cada estancia ininterrumpida en un Estado, pasada o prevista. No se pide nada más que un Estado y dos fechas: ni nombre, ni número de documento, ni motivo del viaje. Lo que introduzca se contrasta con la norma y se pierde al cerrar la página.',
        )}
      >
        <PrivacyNote sourceHref={sourceUrl(SOURCE_PATH)} sourceLabel={SOURCE_PATH} />

        <Card tone="sunken">
          {/* `noValidate`: the browser's own validation messages are
              monolingual, never appear in the error summary, and vanish on the
              next keystroke. The messages here are ours, in both languages, and
              are listed in one place. */}
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T text={bi('Where you were, and when', 'Dónde estuvo y cuándo')} />
              </legend>

              <p className={styles.groupHint}>
                <T text={ENDPOINTS_NOTE} />
              </p>
              <p className={styles.groupHint}>
                <T
                  text={bi(
                    'Only Schengen States are offered, because only they consume the allowance — time anywhere else does not need to be entered. Membership is resolved for each individual day, so a stay in Croatia before 2023-01-01 charges nothing, and a stay in Bulgaria or Romania between 2024-03-31 and 2025-01-01 is reported as a question for a person rather than answered.',
                    'Solo se ofrecen Estados Schengen, porque solo ellos consumen la franquicia: el tiempo en cualquier otro lugar no hace falta introducirlo. La pertenencia se resuelve día a día, de modo que una estancia en Croacia antes del 01-01-2023 no imputa nada, y una estancia en Bulgaria o Rumanía entre el 31-03-2024 y el 01-01-2025 se plantea como una pregunta para una persona en lugar de responderse.',
                  )}
                />
              </p>

              <ul className={styles.stayList}>
                {answers.stays.map((row, index) => {
                  const countryId = stayFieldId(row.key, 'country');
                  const startId = stayFieldId(row.key, 'start');
                  const endId = stayFieldId(row.key, 'end');
                  return (
                    <li className={styles.stayItem} key={row.key}>
                      <fieldset className={styles.stayFields}>
                        <legend className={styles.stayLegend}>
                          <T text={bi(`Stay ${index + 1}`, `Estancia ${index + 1}`)} />
                        </legend>

                        <FieldRow>
                          <SelectField
                            id={countryId}
                            label={bi('State', 'Estado')}
                            error={issueFor(countryId, issues)}
                            required
                            options={STATE_OPTIONS}
                            value={row.country}
                            onChange={(value) => updateStay(row.key, { country: value })}
                          />
                          <DateField
                            id={startId}
                            label={bi('Day you entered', 'Día de entrada')}
                            error={issueFor(startId, issues)}
                            required
                            value={row.start}
                            onChange={(value) => updateStay(row.key, { start: value })}
                          />
                          <DateField
                            id={endId}
                            label={bi('Day you left', 'Día de salida')}
                            error={issueFor(endId, issues)}
                            required
                            value={row.end}
                            onChange={(value) => updateStay(row.key, { end: value })}
                          />
                        </FieldRow>

                        <CheckboxField
                          id={stayFieldId(row.key, 'exempt')}
                          label={bi(
                            'This was time in the State that issued my own residence permit or long-stay visa',
                            'Fue tiempo en el Estado que expidió mi propia autorización de residencia o visado de larga duración',
                          )}
                          checked={row.exempt}
                          onChange={(checked) => updateStay(row.key, { exempt: checked })}
                        />

                        <ToolActions>
                          <ToolButton
                            variant="clear"
                            label={bi(
                              `Remove stay ${index + 1}`,
                              `Quitar la estancia ${index + 1}`,
                            )}
                            onClick={() => removeStay(row.key)}
                          />
                        </ToolActions>
                      </fieldset>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.stayFooter}>
                <ToolActions>
                  <ToolButton
                    label={bi('Add a stay', 'Añadir una estancia')}
                    onClick={addStay}
                    disabled={stayCount >= MAX_STAYS}
                  />
                </ToolActions>
                <p className={styles.stayCount}>
                  <T
                    text={
                      stayCount >= MAX_STAYS
                        ? bi(
                            `${stayCount} of ${MAX_STAYS} rows. That is as many as this form holds; it is a limit on how much typing can be lost at once, not on what the rule allows.`,
                            `${stayCount} de ${MAX_STAYS} filas. Es todo lo que admite este formulario; es un límite sobre cuánto se puede perder de una vez al escribir, no sobre lo que permite la norma.`,
                          )
                        : bi(
                            `${stayCount} of ${MAX_STAYS} rows.`,
                            `${stayCount} de ${MAX_STAYS} filas.`,
                          )
                    }
                  />
                </p>
              </div>

              <p className={styles.groupHint}>
                <T
                  text={bi(
                    'Tick the box only for time in the State that issued your own permit. The 90/180 rule governs short stays, and charging a Spanish resident’s days at home against their 90 would report an overstay for somebody sitting in their own flat. Days in other Schengen States on the strength of that permit are still short stays and stay unticked.',
                    'Marque la casilla solo para el tiempo pasado en el Estado que expidió su propia autorización. La regla 90/180 rige las estancias cortas, e imputar a sus 90 días los días que un residente en España pasa en casa señalaría una estancia irregular a quien está en su propio piso. Los días en otros Estados Schengen al amparo de esa autorización siguen siendo estancia corta y se dejan sin marcar.',
                  )}
                />
              </p>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T text={bi('The day to measure', 'El día que se mide')} />
              </legend>

              <p className={styles.groupHint}>
                <T
                  text={bi(
                    'The rule asks the question afresh for every day of a stay, against the 180 days ending on and including that day. There is no reset date and no annual allowance. This field chooses which day the first block of the result answers for.',
                    'La norma plantea la pregunta de nuevo para cada día de estancia, frente a los 180 días que terminan en ese día, incluido. No hay fecha de reinicio ni franquicia anual. Este campo elige para qué día responde el primer bloque del resultado.',
                  )}
                />
              </p>

              <DateField
                id={FIELD.reference}
                label={bi('Measure the window ending on', 'Medir la ventana que termina el')}
                hint={bi(
                  `This application reads no clock, so every figure it shows can be reproduced later. The date is pre-filled with ${EMPTY_ANSWERS.referenceDate}, the date this build computes as at; if you are reading this later, set today's date.`,
                  `Esta aplicación no consulta ningún reloj, de modo que toda cifra que muestra puede reproducirse después. La fecha viene rellenada con ${EMPTY_ANSWERS.referenceDate}, la fecha a la que calcula esta compilación; si lee esto más tarde, ponga la fecha de hoy.`,
                )}
                error={issueFor(FIELD.reference, issues)}
                required
                value={answers.referenceDate}
                onChange={(value) => update({ referenceDate: value })}
              />
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T
                  text={bi(
                    'A range to scan for its worst day',
                    'Un intervalo del que hallar su peor día',
                  )}
                />
              </legend>

              <p className={styles.groupHint}>
                <T
                  text={bi(
                    'Optional, and the reason this tool exists. The window slides underneath a traveller, so a trip that is inside the allowance on the day it starts can breach on its twelfth day. Meridian reports the highest day in the range, not the last one. Enter the trip in the rows above as well: the scan measures the record, so a trip that is not in the record is measured as time at home.',
                    'Opcional, y la razón de ser de esta herramienta. La ventana se desplaza bajo los pies del viajero, de modo que un viaje que está dentro de la franquicia el día que empieza puede superarla en su duodécimo día. Meridian informa del día más alto del intervalo, no del último. Introduzca también el viaje en las filas anteriores: el análisis mide el registro, así que un viaje que no está en el registro se mide como tiempo en casa.',
                  )}
                />
              </p>

              <FieldRow>
                <DateField
                  id={FIELD.plannedStart}
                  label={bi('First day of the range', 'Primer día del intervalo')}
                  error={issueFor(FIELD.plannedStart, issues)}
                  value={answers.plannedStart}
                  onChange={(value) => update({ plannedStart: value })}
                />
                <DateField
                  id={FIELD.plannedEnd}
                  label={bi('Last day of the range', 'Último día del intervalo')}
                  error={issueFor(FIELD.plannedEnd, issues)}
                  value={answers.plannedEnd}
                  onChange={(value) => update({ plannedEnd: value })}
                />
              </FieldRow>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T
                  text={bi(
                    'A stay you are considering',
                    'Una estancia que está considerando',
                  )}
                />
              </legend>

              <p className={styles.groupHint}>
                <T
                  text={bi(
                    'Optional. Meridian reports the earliest date on or after the one you give on which every day of an unbroken stay that long would be inside the allowance — including the stays already entered above, since they fall inside the same windows. It is the first date the arithmetic permits, not a suggestion to travel then.',
                    'Opcional. Meridian indica la fecha más temprana, igual o posterior a la que usted señale, en la que todos los días de una estancia ininterrumpida de esa duración quedarían dentro de la franquicia, contando también las estancias ya introducidas arriba, porque caen dentro de las mismas ventanas. Es la primera fecha que permite la aritmética, no una sugerencia de viajar entonces.',
                  )}
                />
              </p>

              <FieldRow>
                <NumberField
                  id={FIELD.proposedDays}
                  label={bi('Length of the stay, in days', 'Duración de la estancia, en días')}
                  hint={bi(
                    `1 to ${MAX_PROPOSED_STAY_DAYS}. A length above 90 has no lawful start date under this rule, and the result says so rather than searching for one.`,
                    `De 1 a ${MAX_PROPOSED_STAY_DAYS}. Una duración superior a 90 no tiene fecha de inicio conforme con esta norma, y el resultado lo indica en lugar de buscarla.`,
                  )}
                  error={issueFor(FIELD.proposedDays, issues)}
                  value={answers.proposedDays}
                  onChange={(value) => update({ proposedDays: value })}
                  min={1}
                  max={MAX_PROPOSED_STAY_DAYS}
                />
                <DateField
                  id={FIELD.proposedFrom}
                  label={bi('Not starting before', 'Sin empezar antes del')}
                  error={issueFor(FIELD.proposedFrom, issues)}
                  value={answers.proposedFrom}
                  onChange={(value) => update({ proposedFrom: value })}
                />
              </FieldRow>
            </fieldset>

            <ToolActions>
              <ToolButton
                type="submit"
                variant="primary"
                label={bi('Count the days', 'Contar los días')}
                // Only once the region exists: `aria-controls` pointing at an
                // absent id is a dangling reference, not a relationship.
                controls={report !== null ? SCHENGEN_RESULT_ID : undefined}
              />
              <ToolButton
                variant="clear"
                label={bi('Clear everything', 'Borrar todo')}
                onClick={clearAll}
              />
            </ToolActions>

            <ToolActionGroup
              id="schengen-examples"
              label={bi('Or load an invented itinerary', 'O cargue un itinerario inventado')}
            >
              {SCHENGEN_EXAMPLES.map((example) => (
                <ToolButton
                  key={example.id}
                  label={example.label}
                  onClick={() => loadExample(example)}
                />
              ))}
            </ToolActionGroup>

            <p className={styles.exampleNote}>
              <T
                text={bi(
                  'The itineraries are invented: country codes and dates, nothing else. No name, no document number and no date of birth appears in any of them — Meridian carries no real personal data anywhere, including in its examples. Each one is a case a hand calculation gets wrong.',
                  'Los itinerarios son inventados: códigos de país y fechas, nada más. En ninguno figura un nombre, un número de documento ni una fecha de nacimiento: Meridian no contiene datos personales reales en ninguna parte, tampoco en sus ejemplos. Cada uno es un caso que un cálculo a mano falla.',
                )}
              />
            </p>

            <ul className={styles.exampleList}>
              {SCHENGEN_EXAMPLES.map((example) => (
                <li key={example.id}>
                  <span className={styles.exampleName}>
                    <TInline text={example.label} />
                  </span>{' '}
                  <T text={example.note} />
                </li>
              ))}
            </ul>
          </form>
        </Card>
      </Section>

      {failure !== null ? (
        <Callout
          tone="bad"
          icon="✕"
          title={bi('The day counter refused this input', 'El cómputo rechazó esta entrada')}
        >
          {/* The engine's own message, in the engine's own words. English,
              because that is how `@meridian/presence` writes it, and a
              paraphrase of a refusal is a different statement. */}
          <p lang="en">{failure}</p>
        </Callout>
      ) : null}

      {report !== null ? <SchengenResult report={report} focusKey={resultFocusKey} /> : null}
    </Stack>
  );
}
