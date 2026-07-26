'use client';

/**
 * The machine-readable zone check.
 *
 * Everything here happens in the reader's browser. The form has no `action`,
 * the submit handler calls `preventDefault`, and the only thing that touches the
 * pasted text is `runMrzCheck`, which is `@meridian/mrtd` compiled into this
 * page's JavaScript bundle. There is no `fetch`, no server action, no storage
 * write and no query-string round trip anywhere in this file — see
 * `lib/tools/privacy.ts` for why that is stated on screen as well as here.
 *
 * The output is `assessment`-class under `@meridian/core`: the reader's own
 * facts measured against a cited rule with the arithmetic exposed. It names the
 * instrument, shows the substring each check digit is computed over, and reports
 * every digit separately — because "invalid passport" is useless to somebody
 * trying to find which character an OCR pass misread, which is the whole reason
 * `@meridian/mrtd` reports per field rather than per document.
 *
 * What it must never say, and does not: whether the document is genuine, whether
 * an application will succeed, or what the reader should do next.
 */

import { useState, type FormEvent } from 'react';

import type { IsoDate } from '@meridian/core';

import { bi, type Bi } from '@/lib/i18n';
import { cx } from '@/lib/ui';
import {
  CENTURY_WINDOW_NOTE,
  DEFAULT_REFERENCE_DATE,
  ICAO_9303_CITATION,
  MRZ_SPECIMENS,
  runMrzCheck,
  specimenText,
  type MrzReport,
} from '@/lib/tools/mrz';
import { sourceUrl } from '@/lib/tools/privacy';
import { collect, issueFor, readDateField, requireText, type FieldIssue } from '@/lib/tools/validation';

import { Badge, Chip, PlainBadge } from '@/components/Badge';
import { T, TInline, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { CitationList } from '@/components/Citations';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import { Card, Empty, ScrollX, Section, Stack } from '@/components/Layout';
import { ToolActionGroup, ToolActions, ToolButton } from '@/components/tools/Actions';
import { ErrorSummary } from '@/components/tools/ErrorSummary';
import { DateField, TextAreaField } from '@/components/tools/Field';
import { PrivacyNote } from '@/components/tools/PrivacyNote';
import { ResultBlock, ResultPanel } from '@/components/tools/ResultPanel';

import styles from './MrzTool.module.css';

/** DOM ids. Stable, because the error summary links to them. */
const LINES_ID = 'mrz-lines';
const REFERENCE_ID = 'mrz-reference-date';
const RESULT_ID = 'mrz-result';

const SOURCE_PATH = 'apps/web/components/tools/MrzTool.tsx';

const NOT_RECORDED: Bi = bi('Not recorded', 'Sin registrar');

/**
 * A column ruler for the monospace echo of the zone.
 *
 * Every location this tool reports is a line and a column — "line 2, column 20"
 * — and counting to column 20 by eye across 44 characters is exactly the kind of
 * thing that produces a second transcription error while fixing the first.
 */
function columnRuler(width: number): string {
  let out = '';
  for (let i = 1; i <= width; i += 1) out += String(i % 10);
  return out;
}

export function MrzTool() {
  const [lines, setLines] = useState('');
  const [reference, setReference] = useState<string>(DEFAULT_REFERENCE_DATE);
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const [report, setReport] = useState<MrzReport | null>(null);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [resultFocusKey, setResultFocusKey] = useState(0);

  function fail(found: readonly FieldIssue[]): void {
    setIssues(found);
    setReport(null);
    setErrorFocusKey((k) => k + 1);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    // Nothing is submitted anywhere. The handler stops the browser's default
    // navigation, which is the only mechanism on this page that could put the
    // pasted text into a URL, a request, or a history entry.
    event.preventDefault();

    const dateResult = readDateField(REFERENCE_ID, reference, { required: true });
    const found = collect([
      requireText(
        LINES_ID,
        lines,
        bi(
          'Paste the two or three machine-readable lines from the document.',
          'Pegue las dos o tres líneas de lectura mecánica del documento.',
        ),
      ),
      dateResult.issue,
    ]);

    // `readDateField` with `required: true` yields an issue whenever it yields
    // no date, so `found` is non-empty on this branch whenever `date` is null.
    const date: IsoDate | null = dateResult.date;
    if (found.length > 0 || date === null) {
      fail(found);
      return;
    }

    setIssues([]);
    setReport(runMrzCheck(lines, date));
    setResultFocusKey((k) => k + 1);
  }

  function clearAll(): void {
    setLines('');
    setReference(DEFAULT_REFERENCE_DATE);
    setIssues([]);
    setReport(null);
    document.getElementById(LINES_ID)?.focus();
  }

  function loadSpecimen(text: string): void {
    setLines(text);
    setIssues([]);
    setReport(null);
  }

  return (
    <Stack gap="lg">
      <ErrorSummary issues={issues} focusKey={errorFocusKey} />

      <Section
        id="mrz-input"
        title={bi('The lines from the document', 'Las líneas del documento')}
        description={bi(
          'The machine-readable zone is the block of code at the bottom of a passport page or on the back of an identity card: two lines on a passport, three on a card. Type or paste them exactly as printed, including the chevrons. Spacing, line breaks and letter case are normalised for you; characters are never repaired, because a parser that "fixes" a 0 into an O produces a document number belonging to somebody else.',
          'La zona de lectura mecánica es el bloque de código de la parte inferior de la página del pasaporte o del reverso de un documento de identidad: dos líneas en un pasaporte, tres en una tarjeta. Escríbalas o péguelas exactamente como están impresas, incluidos los chevrones. Los espacios, los saltos de línea y las mayúsculas se normalizan automáticamente; los caracteres nunca se corrigen, porque un analizador que «arregla» un 0 convirtiéndolo en O produce un número de documento que pertenece a otra persona.',
        )}
      >
        <PrivacyNote sourceHref={sourceUrl(SOURCE_PATH)} sourceLabel={SOURCE_PATH} />

        <Card tone="sunken">
          {/* `noValidate`: the browser's own validation messages are
              monolingual, never appear in the error summary, and vanish on the
              next keystroke. The messages below are ours, in both languages,
              and are listed in one place. */}
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <TextAreaField
              id={LINES_ID}
              label={bi('Machine-readable lines', 'Líneas de lectura mecánica')}
              hint={bi(
                'Two lines for a passport or visa, three for an identity card. One line per row.',
                'Dos líneas para un pasaporte o visado, tres para un documento de identidad. Una línea por fila.',
              )}
              error={issueFor(LINES_ID, issues)}
              required
              mono
              verbatim
              rows={4}
              value={lines}
              onChange={setLines}
            />

            <DateField
              id={REFERENCE_ID}
              label={bi('Resolve two-digit years as at', 'Resolver los años de dos dígitos a fecha de')}
              hint={bi(
                `This application reads no clock, so every figure it shows can be reproduced later. The date is fixed at ${DEFAULT_REFERENCE_DATE} for this build; if you are reading this in a later year, set today's date.`,
                `Esta aplicación no consulta ningún reloj, de modo que toda cifra que muestra puede reproducirse después. La fecha está fijada en ${DEFAULT_REFERENCE_DATE} para esta compilación; si lee esto en un año posterior, ponga la fecha de hoy.`,
              )}
              error={issueFor(REFERENCE_ID, issues)}
              required
              value={reference}
              onChange={setReference}
            />

            <ToolActions>
              <ToolButton
                type="submit"
                variant="primary"
                label={bi('Check the zone', 'Comprobar la zona')}
                // Only once the region exists: `aria-controls` pointing at an
                // absent id is a dangling reference, not a relationship.
                controls={report !== null ? RESULT_ID : undefined}
              />
              <ToolButton
                variant="clear"
                label={bi('Clear everything', 'Borrar todo')}
                onClick={clearAll}
              />
            </ToolActions>

            <ToolActionGroup
              id="mrz-specimens"
              label={bi('Or load a synthetic specimen', 'O cargue un ejemplar sintético')}
            >
              {MRZ_SPECIMENS.map((specimen) => (
                <ToolButton
                  key={specimen.id}
                  label={specimen.label}
                  onClick={() => loadSpecimen(specimenText(specimen))}
                />
              ))}
            </ToolActionGroup>

            <p className={styles.specimenNote}>
              <T
                text={bi(
                  'The specimens are made up. Their issuing state and nationality are ZZZ, which ICAO assigns to nobody; the surname is literally SPECIMEN; the document numbers are fabricated and their check digits were computed from the fabrication. No real travel-document number appears anywhere in Meridian, including in its tests.',
                  'Los ejemplares son inventados. Su Estado emisor y su nacionalidad son ZZZ, que la OACI no asigna a nadie; el apellido es literalmente SPECIMEN; los números de documento son ficticios y sus dígitos de control se calcularon a partir de esa ficción. En Meridian no aparece ningún número real de documento de viaje, tampoco en sus pruebas.',
                )}
              />
            </p>
          </form>
        </Card>
      </Section>

      {report !== null ? <MrzResult report={report} focusKey={resultFocusKey} /> : null}
    </Stack>
  );
}

const VERDICT_SOUND: Bi = bi('Internally consistent', 'Internamente coherente');
const VERDICT_BROKEN: Bi = bi('Not internally consistent', 'No es internamente coherente');

const VERDICT_LEAD_SOUND: Bi = bi(
  'Every check digit the detected format defines matches the field it covers. That means the transcription in front of you is arithmetically sound — it does not mean the document is genuine, and no arithmetic can tell you that.',
  'Todos los dígitos de control que define el formato detectado coinciden con el campo que cubren. Eso significa que la transcripción que tiene delante es aritméticamente correcta; no significa que el documento sea auténtico, y ninguna aritmética puede decírselo.',
);

const VERDICT_LEAD_BROKEN: Bi = bi(
  'At least one thing does not add up. Each defect below names the field it belongs to and the line and column it sits at, so you can compare that one character against the document rather than starting the transcription again.',
  'Al menos algo no cuadra. Cada defecto que figura a continuación indica el campo al que pertenece y la línea y columna en que se encuentra, de modo que pueda comparar ese carácter concreto con el documento en lugar de rehacer toda la transcripción.',
);

function MrzResult({ report, focusKey }: { readonly report: MrzReport; readonly focusKey: number }) {
  const width = report.lines.reduce((max, line) => Math.max(max, line.length), 0);

  return (
    <ResultPanel
      id={RESULT_ID}
      title={bi('What the zone says', 'Qué dice la zona')}
      verdict={report.selfConsistent ? VERDICT_SOUND : VERDICT_BROKEN}
      tone={report.selfConsistent ? 'ok' : 'bad'}
      lead={report.selfConsistent ? VERDICT_LEAD_SOUND : VERDICT_LEAD_BROKEN}
      focusKey={focusKey}
    >
      <ResultBlock
        id="mrz-format"
        title={bi('Format', 'Formato')}
        description={bi(
          'Detected from the line count and line length, and — for the two visa geometries, which are byte-identical to a passport up to position 29 — from the document code. A visa carries no composite check digit, so reading one as a passport rejects a perfectly valid document.',
          'Se detecta a partir del número de líneas y su longitud y, en el caso de las dos geometrías de visado, que son idénticas byte a byte a las de un pasaporte hasta la posición 29, a partir del código de documento. Un visado no lleva dígito de control compuesto, por lo que leerlo como pasaporte rechaza un documento perfectamente válido.',
        )}
      >
        {report.formatName === null ? (
          <Empty
            text={bi(
              'The lines match no ICAO 9303 geometry, so no field could be located. Check that every line is present and that none has been wrapped or truncated.',
              'Las líneas no coinciden con ninguna geometría del Doc 9303 de la OACI, por lo que no se pudo localizar ningún campo. Compruebe que están todas las líneas y que ninguna se ha partido ni truncado.',
            )}
          />
        ) : (
          <p className={styles.formatLine}>
            <PlainBadge tone="info">{report.format}</PlainBadge>{' '}
            <T text={report.formatName} />
          </p>
        )}

        {report.lines.length > 0 ? (
          <div className={styles.zone}>
            <p className={styles.zoneCaption}>
              <T
                text={bi(
                  'The lines as read, after whitespace was removed and letters were upper-cased. The ruler counts columns.',
                  'Las líneas tal como se leyeron, tras eliminar los espacios y poner las letras en mayúscula. La regla numera las columnas.',
                )}
              />
            </p>
            <div className={styles.zoneScroll}>
              <pre className={styles.zoneRuler} aria-hidden="true">
                {columnRuler(width)}
              </pre>
              <ol className={styles.zoneLines}>
                {report.lines.map((line, index) => (
                  <li key={`${index}-${line}`} className={styles.zoneLine}>
                    <span className={styles.zoneNumber} aria-hidden="true">
                      {index + 1}
                    </span>
                    <code className={styles.zoneText}>{line}</code>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </ResultBlock>

      {report.fields.length > 0 ? (
        <ResultBlock
          id="mrz-fields"
          title={bi('Every field it could read', 'Todos los campos que pudo leer')}
          description={bi(
            'The reading, and the characters exactly as they appear in the zone where the two differ. The zone transliterates apostrophes, hyphens and spaces away, so a name here may be spelled differently from the one on the biographical page — that is the document, not an error.',
            'La lectura y, cuando difieren, los caracteres tal como aparecen en la zona. La zona elimina por transliteración apóstrofos, guiones y espacios, de modo que un nombre puede aparecer aquí escrito de forma distinta a la de la página biográfica: eso es el documento, no un error.',
          )}
        >
          <ScrollX>
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <TInline text={bi('Field', 'Campo')} />
                  </th>
                  <th scope="col">
                    <TInline text={bi('Reading', 'Lectura')} />
                  </th>
                  <th scope="col">
                    <TInline text={bi('As printed', 'Tal como está impreso')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.fields.map((field) => (
                  <tr key={field.key}>
                    <th scope="row" className={styles.fieldName}>
                      <T text={field.label} />
                    </th>
                    <td>
                      {field.value === '' ? (
                        <span className={styles.absent}>
                          <TInline text={NOT_RECORDED} />
                        </span>
                      ) : (
                        <code className={cx(styles.value, field.tone === 'bad' && styles.valueBad)}>
                          {field.value}
                        </code>
                      )}
                      {field.note !== undefined ? (
                        <p className={styles.fieldNote}>
                          <T text={field.note} />
                        </p>
                      ) : null}
                    </td>
                    <td>
                      {field.printed !== undefined ? (
                        <code className={styles.printed}>{field.printed}</code>
                      ) : (
                        <span aria-hidden="true" className={styles.absent}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </ResultBlock>
      ) : null}

      {report.checks.length > 0 ? (
        <ResultBlock
          id="mrz-check-digits"
          title={bi('Each check digit, separately', 'Cada dígito de control, por separado')}
          description={bi(
            'Each character of the covered string is valued — 0-9 as itself, A-Z as 10 to 35, the filler < as zero — multiplied by the repeating weights 7, 3, 1, summed, and reduced modulo 10. That result is what the digit in the document should be. Both numbers are shown so you can redo the arithmetic yourself.',
            'Cada carácter de la cadena cubierta recibe un valor —del 0 al 9 su propio valor, de la A a la Z de 10 a 35, y el relleno < vale cero—, se multiplica por los pesos repetidos 7, 3 y 1, se suma y se reduce módulo 10. Ese resultado es el dígito que debería figurar en el documento. Se muestran ambas cifras para que pueda rehacer usted mismo la aritmética.',
          )}
        >
          <ScrollX>
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <TInline text={bi('Digit for', 'Dígito de')} />
                  </th>
                  <th scope="col">
                    <TInline text={bi('At', 'En')} />
                  </th>
                  <th scope="col">
                    <TInline text={bi('In the document', 'En el documento')} />
                  </th>
                  <th scope="col">
                    <TInline text={bi('Computed', 'Calculado')} />
                  </th>
                  <th scope="col">
                    <TInline text={bi('Verdict', 'Veredicto')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.checks.map((check) => (
                  <tr key={check.key}>
                    <th scope="row" className={styles.fieldName}>
                      <T text={check.label} />
                      {check.covers !== '' ? (
                        <p className={styles.covers}>
                          <span className={styles.coversLabel}>
                            <TInline text={bi('Computed over', 'Calculado sobre')} />
                          </span>{' '}
                          <code className={styles.coversText}>{check.covers}</code>
                        </p>
                      ) : null}
                    </th>
                    <td className={styles.nowrap}>
                      <TInline text={bi('line', 'línea')} /> {check.line},{' '}
                      <TInline text={bi('column', 'columna')} /> {check.column}
                    </td>
                    <td>
                      <code className={cx(styles.value, !check.ok && styles.valueBad)}>
                        {check.present}
                      </code>
                    </td>
                    <td>
                      {check.expected === null ? (
                        <span className={styles.absent}>
                          <TInline text={bi('Filler permitted', 'Se admite relleno')} />
                        </span>
                      ) : (
                        <code className={styles.value}>{check.expected}</code>
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={check.ok ? 'ok' : 'bad'}
                        label={
                          check.ok
                            ? bi('Matches', 'Coincide')
                            : bi('Does not match', 'No coincide')
                        }
                      />
                      {check.note !== undefined ? (
                        <p className={styles.fieldNote} lang="en">
                          {check.note}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </ResultBlock>
      ) : null}

      {report.failures.length > 0 ? (
        <ResultBlock
          id="mrz-failures"
          title={bi('What does not add up', 'Qué no cuadra')}
          description={bi(
            'Each defect names its field and, where it has one, its position. The wording comes from @meridian/mrtd itself and is shown verbatim rather than paraphrased.',
            'Cada defecto indica su campo y, cuando la tiene, su posición. La redacción procede del propio paquete @meridian/mrtd y se muestra literalmente, sin parafrasear.',
          )}
        >
          <ul className={styles.failures}>
            {report.failures.map((failure) => (
              <li className={styles.failure} key={failure.key}>
                <div className={styles.failureHead}>
                  <Badge tone="bad" label={failure.code} />
                  {failure.line !== undefined && failure.column !== undefined ? (
                    <Chip>
                      <TInline text={bi('line', 'línea')} /> {failure.line},{' '}
                      <TInline text={bi('column', 'columna')} /> {failure.column}
                    </Chip>
                  ) : null}
                </div>
                <p className={styles.failureMessage} lang="en">
                  {failure.message}
                </p>
              </li>
            ))}
          </ul>
        </ResultBlock>
      ) : null}

      {report.resolvedADate ? (
        <Callout
          tone="warn"
          icon="!"
          title={bi(
            'The century is a convention, not the standard',
            'El siglo es una convención, no la norma',
          )}
        >
          <TProse text={CENTURY_WINDOW_NOTE} />
          <p className={styles.referenceLine}>
            <TInline
              text={bi('Two-digit years were resolved as at', 'Los años de dos dígitos se resolvieron a fecha de')}
            />{' '}
            <time className={styles.referenceDate} dateTime={report.referenceDate}>
              {report.referenceDate}
            </time>
          </p>
        </Callout>
      ) : null}

      <ResultBlock id="mrz-sources" title={bi('The rule this applied', 'La norma aplicada')}>
        <CitationList citations={[ICAO_9303_CITATION]} asOf={report.referenceDate} />
      </ResultBlock>

      <DisclosureNotice
        shown="assessment"
        withheld={[
          bi(
            'Whether the document is genuine. A check digit detects a transcription error; it cannot see a forgery, and nothing on this page inspects the chip, the substrate or the security printing.',
            'Si el documento es auténtico. Un dígito de control detecta un error de transcripción; no ve una falsificación, y nada en esta página examina el chip, el soporte ni la impresión de seguridad.',
          ),
          bi(
            'Whether the holder may travel, enter or remain anywhere. That depends on rules about people, not on arithmetic about characters.',
            'Si el titular puede viajar, entrar o permanecer en algún lugar. Eso depende de normas sobre personas, no de la aritmética de unos caracteres.',
          ),
          bi(
            'What to do next. Meridian will not recommend a course of action to somebody with no representative accountable for the answer.',
            'Qué hacer a continuación. Meridian no recomienda un curso de acción a quien no tiene un representante que responda de la respuesta.',
          ),
        ]}
      />
    </ResultPanel>
  );
}
