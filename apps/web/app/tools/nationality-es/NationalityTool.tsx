'use client';

/**
 * The Spanish nationality-by-residence check.
 *
 * Everything happens in the reader's browser. The form has no `action`, the
 * submit handler calls `preventDefault`, and the only thing that touches the
 * answers is `readNationalityAnswers` followed by `runNationalityCheck` —
 * `@meridian/pathways` and `@meridian/core` compiled into this page's
 * JavaScript bundle. There is no `fetch`, no server action, no storage write and
 * no query-string round trip anywhere in this file. See `lib/tools/privacy.ts`
 * for why that is stated on screen as well as here.
 *
 * The output is `assessment`-class under `@meridian/core`: the reader's own
 * facts measured against a cited rule, with the comparison exposed. Every
 * verdict on screen is `evaluate`'s, every threshold is the catalog's, and every
 * citation is the one the criterion itself carries.
 *
 * What it must never say, and does not: which of the two regimes to apply under,
 * whether nationality would be granted, or what to do next. Both routes are
 * always shown, in the order the catalog records them, and neither is ever
 * described as better than the other.
 */

import { useState, type FormEvent } from 'react';

import { bi, type Bi } from '@/lib/i18n';
import {
  criterionKindLabel,
  criterionStatusView,
  criterionWeightView,
  pathwayStatusView,
  reviewStatusView,
  verdictView,
} from '@/lib/status';
import {
  ACQUISITION_OPTIONS,
  CCSE_OPTIONS,
  CERTIFICATE_OPTIONS,
  CLAIMED_NATIONALITY_OPTIONS,
  CONTINUITY_CAVEAT,
  DEFAULT_ASSESSMENT_DATE,
  DELE_OPTIONS,
  EMPTY_ANSWERS,
  FIELD,
  NATIONALITY_EXAMPLES,
  NOTE_TITLE,
  OTHER_COUNTRY,
  RESIDENCE_UNDER_OPTIONS,
  RESULT_ID,
  SECOND_NATIONALITY_OPTIONS,
  STATUS_OPTIONS,
  UNKNOWN_CAVEAT,
  UNREVIEWED_CAVEAT,
  readNationalityAnswers,
  runNationalityCheck,
  type CriterionView,
  type NationalityAnswers,
  type NationalityAssessment,
  type NoteView,
  type RouteAssessment,
} from '@/lib/tools/nationality';
import { sourceUrl } from '@/lib/tools/privacy';
import { issueFor, type FieldIssue } from '@/lib/tools/validation';
import { cx } from '@/lib/ui';

import { Badge, Chip } from '@/components/Badge';
import { T, TInline, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { CitationList, CitationRefs } from '@/components/Citations';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import { Card, CivilDate, Fact, Facts, Section, Stack } from '@/components/Layout';
import { ToolActionGroup, ToolActions, ToolButton } from '@/components/tools/Actions';
import { ErrorSummary } from '@/components/tools/ErrorSummary';
import { DateField, NumberField, SelectField, TextField } from '@/components/tools/Field';
import { PrivacyNote } from '@/components/tools/PrivacyNote';
import { ResultBlock, ResultPanel } from '@/components/tools/ResultPanel';

import styles from './nationality-es.module.css';

const SOURCE_PATH = 'apps/web/app/tools/nationality-es/NationalityTool.tsx';

export function NationalityTool() {
  const [answers, setAnswers] = useState<NationalityAnswers>(EMPTY_ANSWERS);
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const [assessment, setAssessment] = useState<NationalityAssessment | null>(null);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [resultFocusKey, setResultFocusKey] = useState(0);

  function update(patch: Partial<NationalityAnswers>): void {
    setAnswers((previous) => ({ ...previous, ...patch }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    // Nothing is submitted anywhere. Stopping the browser's default navigation
    // is what keeps the answers out of a URL, a request and a history entry.
    event.preventDefault();

    const reading = readNationalityAnswers(answers);
    if (reading.issues.length > 0 || reading.facts === null || reading.asOf === null) {
      setIssues(reading.issues);
      setAssessment(null);
      setErrorFocusKey((k) => k + 1);
      return;
    }

    setIssues([]);
    setAssessment(runNationalityCheck(reading.facts, reading.asOf));
    setResultFocusKey((k) => k + 1);
  }

  function clearAll(): void {
    setAnswers(EMPTY_ANSWERS);
    setIssues([]);
    setAssessment(null);
    document.getElementById(FIELD.claimed)?.focus();
  }

  function loadExample(example: NationalityAnswers): void {
    setAnswers(example);
    setIssues([]);
    setAssessment(null);
  }

  return (
    <Stack gap="lg">
      <ErrorSummary issues={issues} focusKey={errorFocusKey} />

      <Section
        id="nat-es-input"
        title={bi('Your situation', 'Su situación')}
        description={bi(
          'Every question may be left unanswered. An unanswered question is reported as not recorded, which holds the route at "not decidable" — it is never read as a failure, and it never produces a more favourable answer than the facts support.',
          'Puede dejar cualquier pregunta sin responder. Una pregunta sin responder se informa como «sin datos», lo que deja la vía en «no decidible»: nunca se interpreta como un incumplimiento ni produce una respuesta más favorable de lo que los datos permiten.',
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
                <T text={bi('Nationality', 'Nacionalidad')} />
              </legend>

              <SelectField
                id={FIELD.claimed}
                label={bi(
                  'The nationality you would apply under',
                  'La nacionalidad con la que solicitaría',
                )}
                hint={bi(
                  'Art. 22.1 shortens the residence period to two years for nationals of the states listed here. If yours is not among them, choose the last option and enter its two-letter code: the general ten-year regime is measured either way.',
                  'El art. 22.1 reduce el plazo de residencia a dos años para los nacionales de los Estados que aquí figuran. Si el suyo no está, elija la última opción e introduzca su código de dos letras: el régimen general de diez años se mide igualmente.',
                )}
                error={issueFor(FIELD.claimed, issues)}
                options={CLAIMED_NATIONALITY_OPTIONS}
                value={answers.claimed}
                onChange={(value) =>
                  update({
                    claimed: value,
                    // Discard a code that is no longer reachable rather than
                    // keeping it in state where it is invisible to the reader.
                    claimedOtherCode: value === OTHER_COUNTRY ? answers.claimedOtherCode : '',
                  })
                }
              />

              {answers.claimed === OTHER_COUNTRY ? (
                <TextField
                  id={FIELD.claimedOtherCode}
                  label={bi('Its two-letter country code', 'Su código de país de dos letras')}
                  hint={bi(
                    'ISO 3166-1 alpha-2 — MA for Morocco, CN for China, US for the United States.',
                    'ISO 3166-1 alfa-2: MA para Marruecos, CN para China, US para Estados Unidos.',
                  )}
                  error={issueFor(FIELD.claimedOtherCode, issues)}
                  value={answers.claimedOtherCode}
                  onChange={(value) => update({ claimedOtherCode: value })}
                  widthChars={6}
                  mono
                  autoComplete="off"
                />
              ) : null}

              <SelectField
                id={FIELD.acquisition}
                label={bi('How you came to hold it', 'Cómo llegó a ostentarla')}
                hint={bi(
                  'Art. 22.1 gives the two-year period to nationals de origen — by origin. Somebody who acquired a listed nationality later, by residence in that country, is on the ten-year regime instead. If you are not certain, leave this unanswered: the criterion is then reported as not recorded rather than guessed at.',
                  'El art. 22.1 concede el plazo de dos años a los nacionales de origen. Quien adquirió después una nacionalidad de la lista, por residencia en ese país, queda sujeto al régimen general de diez años. Si no está seguro, deje la pregunta sin responder: el criterio se informará como «sin datos» en lugar de suponerse.',
                )}
                error={issueFor(FIELD.acquisition, issues)}
                options={ACQUISITION_OPTIONS}
                value={answers.acquisition}
                onChange={(value) => update({ acquisition: value })}
              />

              <SelectField
                id={FIELD.second}
                label={bi(
                  'Any second nationality you hold',
                  'Cualquier segunda nacionalidad que ostente',
                )}
                hint={bi(
                  'Asked because holding two nationalities changes which rule applies to you, and because the next question needs something to point at.',
                  'Se pregunta porque tener dos nacionalidades cambia qué norma se le aplica, y porque la pregunta siguiente necesita algo a lo que referirse.',
                )}
                error={issueFor(FIELD.second, issues)}
                options={SECOND_NATIONALITY_OPTIONS}
                value={answers.second}
                onChange={(value) =>
                  update({
                    second: value,
                    secondOtherCode: value === OTHER_COUNTRY ? answers.secondOtherCode : '',
                  })
                }
              />

              {answers.second === OTHER_COUNTRY ? (
                <TextField
                  id={FIELD.secondOtherCode}
                  label={bi(
                    'The second nationality’s two-letter code',
                    'Código de dos letras de la segunda nacionalidad',
                  )}
                  hint={bi(
                    'ISO 3166-1 alpha-2 — IT for Italy, FR for France, DE for Germany.',
                    'ISO 3166-1 alfa-2: IT para Italia, FR para Francia, DE para Alemania.',
                  )}
                  error={issueFor(FIELD.secondOtherCode, issues)}
                  value={answers.secondOtherCode}
                  onChange={(value) => update({ secondOtherCode: value })}
                  widthChars={6}
                  mono
                  autoComplete="off"
                />
              ) : null}

              <SelectField
                id={FIELD.residenceUnder}
                label={bi(
                  'The nationality your residence in Spain is held under',
                  'La nacionalidad bajo la que consta su residencia en España',
                )}
                hint={bi(
                  'Where somebody holds more than one nationality, the civil registry examines the one they were admitted and reside under. A dual Italian-Mexican national registered in Spain as an EU citizen holds residence under the Italian nationality, and the two-year period does not follow from the Mexican passport. That treatment is administrative practice rather than statutory text, and the result below says so.',
                  'Cuando alguien tiene más de una nacionalidad, el registro civil examina aquella bajo la que fue admitido y reside. Un italo-mexicano inscrito en España como ciudadano de la UE ostenta la residencia bajo la nacionalidad italiana, y el plazo de dos años no se sigue del pasaporte mexicano. Ese criterio es práctica administrativa y no texto legal, y el resultado lo indica.',
                )}
                error={issueFor(FIELD.residenceUnder, issues)}
                options={RESIDENCE_UNDER_OPTIONS}
                value={answers.residenceUnder}
                onChange={(value) => update({ residenceUnder: value })}
              />
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T text={bi('Residence in Spain', 'Residencia en España')} />
              </legend>

              <DateField
                id={FIELD.residenceSince}
                label={bi(
                  'The date your current unbroken period of legal residence began',
                  'Fecha en que comenzó su periodo actual e ininterrumpido de residencia legal',
                )}
                hint={bi(
                  'One period, running from that date to the assessment date at the bottom of this form. Art. 22.3 requires the residence to be immediately prior to the application, so a total assembled from separate spells does not satisfy it — leave this blank if your residence is not continuous to today, and the criterion reads as not recorded rather than as met.',
                  'Un solo periodo, desde esa fecha hasta la fecha de evaluación que figura al final del formulario. El art. 22.3 exige que la residencia sea inmediatamente anterior a la solicitud, por lo que un total compuesto de periodos separados no lo cumple: deje la casilla vacía si su residencia no llega ininterrumpida hasta hoy, y el criterio se informará como «sin datos» y no como cumplido.',
                )}
                error={issueFor(FIELD.residenceSince, issues)}
                value={answers.residenceSince}
                onChange={(value) => update({ residenceSince: value })}
                max={answers.assessAsOf}
              />

              <SelectField
                id={FIELD.status}
                label={bi('Your situation in Spain today', 'Su situación en España a día de hoy')}
                hint={bi(
                  'A Spanish residence-and-work authorisation is a residence authorisation, so choose the first option for it. A student stay is not recorded as residence here, because the criterion names the authorisations art. 22.3 accepts.',
                  'Una autorización de residencia y trabajo en España es una autorización de residencia, así que elija para ella la primera opción. Una estancia por estudios no se registra aquí como residencia, porque el criterio nombra las autorizaciones que admite el art. 22.3.',
                )}
                error={issueFor(FIELD.status, issues)}
                options={STATUS_OPTIONS}
                value={answers.status}
                onChange={(value) => update({ status: value })}
              />
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T text={bi('Exams, language and conduct', 'Pruebas, idioma y conducta')} />
              </legend>

              <NumberField
                id={FIELD.ageYears}
                label={bi('Your age in completed years', 'Su edad en años cumplidos')}
                hint={bi(
                  'Optional, and no date of birth is asked for. Applicants under 18 are exempt from both statutory exams, so the check needs an age to reach that branch; nothing else on this page uses it.',
                  'Opcional, y no se pide la fecha de nacimiento. Los solicitantes menores de 18 años están exentos de ambas pruebas legales, por lo que la comprobación necesita una edad para llegar a esa vía; nada más en esta página la utiliza.',
                )}
                error={issueFor(FIELD.ageYears, issues)}
                value={answers.ageYears}
                onChange={(value) => update({ ageYears: value })}
                min={0}
                max={130}
              />

              <SelectField
                id={FIELD.ccse}
                label={bi(
                  'The CCSE test of constitutional and sociocultural knowledge',
                  'La prueba CCSE de conocimientos constitucionales y socioculturales',
                )}
                hint={bi(
                  'The check records only whether a pass exists. CCSE certificates have a limited validity period, which nothing here measures.',
                  'La comprobación solo registra si consta un aprobado. El certificado CCSE tiene un periodo de validez limitado que aquí no se mide.',
                )}
                error={issueFor(FIELD.ccse, issues)}
                options={CCSE_OPTIONS}
                value={answers.ccse}
                onChange={(value) => update({ ccse: value })}
              />

              <SelectField
                id={FIELD.dele}
                label={bi(
                  'A DELE diploma in Spanish, or another CEFR certificate',
                  'Un diploma DELE de español u otro certificado del MCER',
                )}
                hint={bi(
                  'The exemption follows the language, not the region: nationals of countries where Spanish is an official language do not need the diploma, and the check applies that branch on its own. Brazil, Portugal, Andorra and the Philippines reach the two-year period but are not exempt from the exam.',
                  'La exención sigue al idioma, no a la región: los nacionales de países donde el español es lengua oficial no necesitan el diploma, y la comprobación aplica esa vía por sí sola. Brasil, Portugal, Andorra y Filipinas acceden al plazo de dos años pero no están exentos del examen.',
                )}
                error={issueFor(FIELD.dele, issues)}
                options={DELE_OPTIONS}
                value={answers.dele}
                onChange={(value) => update({ dele: value })}
              />

              <SelectField
                id={FIELD.certificates}
                label={bi(
                  'Police certificates showing no convictions',
                  'Certificados de antecedentes penales sin condenas',
                )}
                hint={bi(
                  'Whether you hold the certificates, not what is on them. Nothing about an offence is asked for or recorded. Clear certificates are evidence toward the good civic conduct art. 22.4 requires; they are not the whole of that test, which is a discretionary assessment.',
                  'Si dispone de los certificados, no qué consta en ellos. No se pregunta ni se registra nada sobre delitos. Los certificados sin antecedentes son prueba de la buena conducta cívica que exige el art. 22.4, pero no agotan esa valoración, que es discrecional.',
                )}
                error={issueFor(FIELD.certificates, issues)}
                options={CERTIFICATE_OPTIONS}
                value={answers.certificates}
                onChange={(value) => update({ certificates: value })}
              />
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <T text={bi('The date this is measured at', 'La fecha a la que se mide')} />
              </legend>

              <DateField
                id={FIELD.assessAsOf}
                label={bi('Assess as at', 'Evaluar a fecha de')}
                hint={bi(
                  `This application reads no clock, so every figure it shows can be reproduced later by anyone who knows this date. It is fixed at ${DEFAULT_ASSESSMENT_DATE} for this build; if you are reading this in a later year, set today's date.`,
                  `Esta aplicación no consulta ningún reloj, de modo que toda cifra que muestra puede reproducirse después por quien conozca esta fecha. Está fijada en ${DEFAULT_ASSESSMENT_DATE} para esta compilación; si lee esto en un año posterior, ponga la fecha de hoy.`,
                )}
                error={issueFor(FIELD.assessAsOf, issues)}
                required
                value={answers.assessAsOf}
                onChange={(value) => update({ assessAsOf: value })}
              />
            </fieldset>

            <ToolActions>
              <ToolButton
                type="submit"
                variant="primary"
                label={bi('Measure my answers', 'Contrastar mis respuestas')}
                // Only once the region exists: `aria-controls` pointing at an
                // absent id is a dangling reference, not a relationship.
                controls={assessment !== null ? RESULT_ID : undefined}
              />
              <ToolButton
                variant="clear"
                label={bi('Clear everything', 'Borrar todo')}
                onClick={clearAll}
              />
            </ToolActions>

            <ToolActionGroup
              id="nat-es-examples"
              label={bi('Or load an invented situation', 'O cargue una situación inventada')}
            >
              {NATIONALITY_EXAMPLES.map((example) => (
                <ToolButton
                  key={example.id}
                  label={example.label}
                  onClick={() => loadExample(example.answers)}
                />
              ))}
            </ToolActionGroup>

            <p className={styles.exampleNote}>
              <T
                text={bi(
                  'The three situations are made up, and they differ from one another by a single answer each: the second changes only which nationality the residence is held under, and the third changes only whether the acquisition mode was stated. No name, no document number and no date of birth appears in any of them — Meridian carries no real personal data anywhere, including in its examples.',
                  'Las tres situaciones son inventadas y se diferencian entre sí por una sola respuesta: la segunda solo cambia bajo qué nacionalidad se ostenta la residencia, y la tercera solo cambia si se indicó el modo de adquisición. En ninguna figura un nombre, un número de documento ni una fecha de nacimiento: Meridian no contiene datos personales reales en ninguna parte, tampoco en sus ejemplos.',
                )}
              />
            </p>
          </form>
        </Card>
      </Section>

      {assessment !== null ? (
        <NationalityResult assessment={assessment} focusKey={resultFocusKey} />
      ) : null}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// The result
// ---------------------------------------------------------------------------

const PANEL_LEAD: Bi = bi(
  'Both regimes are measured on every run and both are always shown, in the order the catalog records them. That order is not a ranking and nothing below says which route to take: each verdict states whether the criteria Meridian has encoded are met on the answers you gave, which is not the same as saying an application would be granted. No authority is bound by this page.',
  'Ambos regímenes se evalúan en cada ejecución y ambos se muestran siempre, en el orden en que los recoge el catálogo. Ese orden no es una clasificación y nada de lo que sigue indica qué vía seguir: cada resultado señala si se cumplen los criterios que Meridian ha codificado con las respuestas que usted dio, lo cual no equivale a afirmar que una solicitud sería concedida. Ninguna autoridad queda vinculada por esta página.',
);

function unknownsLabel(count: number): Bi {
  if (count === 0) {
    return bi(
      'Your answers decided every criterion',
      'Sus respuestas decidieron todos los criterios',
    );
  }
  if (count === 1) {
    return bi('1 criterion is not decided by your answers', '1 criterio no queda decidido por sus respuestas');
  }
  return bi(
    `${count} criteria are not decided by your answers`,
    `${count} criterios no quedan decididos por sus respuestas`,
  );
}

/** Render a value the evaluator actually observed, without dressing it as prose. */
function showObserved(value: unknown): string {
  if (value === undefined) return 'not recorded';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} item(s)]`;
  return JSON.stringify(value);
}

const UNKNOWN_ROW_NOTE: Bi = bi(
  'Nothing you entered decides this one.',
  'Nada de lo que introdujo decide este criterio.',
);

function CriterionRow({ criterion }: { readonly criterion: CriterionView }) {
  const status = criterionStatusView(criterion.status);
  const weight = criterionWeightView(criterion.weight);

  return (
    <li className={cx(styles.criterion, styles[`is-${criterion.status}`])}>
      <div className={styles.criterionHead}>
        <h4 className={styles.criterionTitle}>
          <T text={criterion.label} />
        </h4>
        <Badge tone={status.tone} label={status.label} />
      </div>

      <p className={styles.criterionMeta}>
        <Chip>{criterionKindLabel(criterion.kind).en}</Chip>
        <Badge tone={weight.tone} label={weight.label} />
        <CitationRefs ids={criterion.citationIds} />
      </p>

      {criterion.status === 'unknown' ? (
        <p className={styles.unknownNote}>
          <T text={UNKNOWN_ROW_NOTE} />
        </p>
      ) : null}

      {/* The engine's own trace, in the engine's own words. It is English
          because that is how `@meridian/pathways` writes it, and paraphrasing a
          comparison into a second language would make it a different claim. */}
      <p className={styles.detail} lang="en">
        {criterion.detail}
      </p>

      {criterion.humanReviewReason !== undefined ? (
        <p className={styles.reviewReason} lang="en">
          {criterion.humanReviewReason}
        </p>
      ) : null}

      {criterion.guidance !== undefined ? (
        <TProse text={criterion.guidance} className={styles.guidance} />
      ) : null}

      {criterion.evidence.length > 0 ? (
        <details className={styles.evidence}>
          <summary className={styles.evidenceSummary}>
            <TInline
              text={bi('The values the rule read', 'Los valores que leyó la norma')}
            />
          </summary>
          <ul className={styles.evidenceList}>
            {criterion.evidence.map((item) => (
              <li key={item.path}>
                <code className={styles.evidencePath}>{item.path}</code>
                <span aria-hidden="true" className={styles.evidenceArrow}>
                  →
                </span>
                <span className={styles.evidenceValue}>{showObserved(item.observed)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

function RouteBlock({ route }: { readonly route: RouteAssessment }) {
  const { pathway, report } = route;
  const verdict = verdictView(report.verdict);
  const review = reviewStatusView(report.reviewStatus);
  const status = pathwayStatusView(report.pathwayStatus);

  return (
    <ResultBlock id={`${RESULT_ID}-${pathway.id}`} title={pathway.name} description={pathway.summary}>
      <div className={styles.routeBadges}>
        <Badge tone={verdict.tone} label={verdict.label} />
        <Badge tone={status.tone} label={status.label} />
        <Badge tone={review.tone} label={review.label} />
        <Chip>
          <code>{pathway.id}</code>
        </Chip>
      </div>

      <Facts>
        <Fact label={bi('Criteria', 'Criterios')}>{report.criteria.length}</Fact>
        <Fact label={bi('Blocking and unmet', 'Bloqueantes no cumplidos')}>
          {report.blockingFailures.length}
        </Fact>
        <Fact label={bi('Not recorded', 'Sin datos')}>{report.unknowns.length}</Fact>
        <Fact label={bi('Needs a person', 'Requiere revisión humana')}>
          {report.humanReviewCriterionIds.length}
        </Fact>
      </Facts>

      <ol className={styles.criteria}>
        {route.criteria.map((criterion) => (
          <CriterionRow key={criterion.id} criterion={criterion} />
        ))}
      </ol>
    </ResultBlock>
  );
}

function NoteCallout({ note }: { readonly note: NoteView }) {
  return (
    <Callout tone="warn" icon="!" title={NOTE_TITLE[note.code]}>
      {/* The note is `@meridian/pathways`' own text and is shown verbatim. */}
      <p className={styles.noteText} lang="en">
        {note.text}
      </p>
      {note.criteria.length > 0 ? (
        <div className={styles.noteAffects}>
          <p className={styles.noteAffectsLabel}>
            <TInline text={bi('It affects', 'Afecta a')} />
          </p>
          <ul className={styles.noteCriteria}>
            {note.criteria.map((label) => (
              <li key={label.en}>
                <T text={label} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {note.citationId !== undefined ? <CitationRefs ids={[note.citationId]} /> : null}
    </Callout>
  );
}

function NationalityResult({
  assessment,
  focusKey,
}: {
  readonly assessment: NationalityAssessment;
  readonly focusKey: number;
}) {
  const unreviewed = assessment.notes.find((n) => n.code === 'unreviewed_rule');
  const otherNotes = assessment.notes.filter((n) => n.code !== 'unreviewed_rule');
  const [reduced, general] = assessment.routes;

  return (
    <ResultPanel
      id={RESULT_ID}
      title={bi(
        'Your answers, measured against both regimes',
        'Sus respuestas, contrastadas con ambos regímenes',
      )}
      verdict={unknownsLabel(assessment.unknownCount)}
      tone={assessment.unknownCount > 0 ? 'warn' : 'info'}
      lead={PANEL_LEAD}
      focusKey={focusKey}
    >
      <p className={styles.asOfLine}>
        <TInline text={bi('Measured as at', 'Medido a fecha de')} />{' '}
        <CivilDate value={assessment.asOf} />
      </p>

      <Callout
        tone="warn"
        icon="!"
        title={NOTE_TITLE.unreviewed_rule}
      >
        {unreviewed !== undefined ? (
          <p className={styles.noteText} lang="en">
            {unreviewed.text}
          </p>
        ) : null}
        <TProse text={UNREVIEWED_CAVEAT} />
      </Callout>

      <Callout
        tone="info"
        icon="i"
        title={bi(
          'Not recorded is a third answer, not a soft no',
          '«Sin datos» es una tercera respuesta, no un no matizado',
        )}
      >
        <TProse text={UNKNOWN_CAVEAT} />
      </Callout>

      {reduced !== undefined ? <RouteBlock route={reduced} /> : null}

      {assessment.byOriginStatus === 'unknown' ? (
        <Callout
          tone="warn"
          icon="!"
          title={bi(
            'The two-year period turns on how you hold the nationality',
            'El plazo de dos años depende de cómo ostente la nacionalidad',
          )}
        >
          <TProse
            text={bi(
              'You have not said how you came to hold the nationality you would apply under, so the reduced route is undecided rather than open or closed. Art. 22.1 confers the two-year period on nationals de origen: somebody who acquired a listed nationality later, by residence in that country, is on the ten-year regime. Until that is established, this page will not treat the reduction as available — telling you otherwise would put you eight years closer than the article does.',
              'No ha indicado cómo llegó a ostentar la nacionalidad con la que solicitaría, por lo que la vía reducida queda indeterminada y no abierta ni cerrada. El art. 22.1 concede el plazo de dos años a los nacionales de origen: quien adquirió después una nacionalidad de la lista, por residencia en ese país, queda sujeto al régimen de diez años. Mientras eso no se acredite, esta página no dará por disponible la reducción: decirle lo contrario le situaría ocho años más cerca de lo que el precepto permite.',
            )}
          />
        </Callout>
      ) : null}

      {assessment.byOriginStatus === 'unmet' ? (
        <Callout
          tone="info"
          icon="i"
          title={bi(
            'A listed nationality acquired later is not a nationality by origin',
            'Una nacionalidad de la lista adquirida después no es una nacionalidad de origen',
          )}
        >
          <TProse
            text={bi(
              'You said the nationality was acquired after birth. Art. 22.1 reduces the period for nationals de origen, so the reduced route reports that criterion as unmet and the general ten-year regime below is the one this catalog measures you against. This is what the article says; it is not a view about your file.',
              'Ha indicado que la nacionalidad se adquirió después del nacimiento. El art. 22.1 reduce el plazo para los nacionales de origen, por lo que la vía reducida informa ese criterio como no cumplido y el régimen general de diez años que figura más abajo es aquel con el que este catálogo le compara. Esto es lo que dice el precepto; no es una opinión sobre su expediente.',
            )}
          />
        </Callout>
      ) : null}

      {assessment.residenceNationalityStatus === 'unmet' ||
      assessment.residenceNationalityStatus === 'unknown' ? (
        <Callout
          tone="warn"
          icon="!"
          title={bi(
            'Which nationality the residence is held under changes the answer',
            'Bajo qué nacionalidad se ostenta la residencia cambia la respuesta',
          )}
        >
          <TProse
            text={
              assessment.residenceNationalityStatus === 'unmet'
                ? bi(
                    'On your answers, the residence is not held under the nationality you would apply under. The registry examines the nationality a person was admitted and resides under, so a dual national registered in Spain as an EU citizen is not treated as residing as an Ibero-American national — whatever their second passport says. Note what this rests on: it is administrative practice recorded in the catalog with a caveat, not a line of the Civil Code, and it must be checked with counsel against the current instructions before anybody relies on it.',
                    'Según sus respuestas, la residencia no se ostenta bajo la nacionalidad con la que solicitaría. El registro examina la nacionalidad bajo la que la persona fue admitida y reside, de modo que un doble nacional inscrito en España como ciudadano de la UE no se considera residente como nacional iberoamericano, diga lo que diga su segundo pasaporte. Repare en el fundamento: es práctica administrativa recogida en el catálogo con su advertencia, no un artículo del Código Civil, y debe contrastarse con un profesional frente a las instrucciones vigentes antes de que nadie se apoye en ella.',
                  )
                : bi(
                    'You have not said which nationality your residence in Spain is held under, so this criterion is undecided. It matters: where somebody holds more than one nationality, the registry examines the one they were admitted and reside under, and a dual national registered as an EU citizen cannot reach back for the reduction on the strength of a second passport. That treatment is administrative practice recorded in the catalog with a caveat, not a line of the Civil Code.',
                    'No ha indicado bajo qué nacionalidad consta su residencia en España, por lo que este criterio queda indeterminado. Importa: cuando alguien tiene más de una nacionalidad, el registro examina aquella bajo la que fue admitido y reside, y un doble nacional inscrito como ciudadano de la UE no puede recuperar la reducción amparándose en un segundo pasaporte. Ese criterio es práctica administrativa recogida en el catálogo con su advertencia, no un artículo del Código Civil.',
                  )
            }
          />
        </Callout>
      ) : null}

      {general !== undefined ? <RouteBlock route={general} /> : null}

      {assessment.residenceDurationDecided ? (
        <Callout
          tone="warn"
          icon="!"
          title={bi(
            'What counts as continuous is not a number in the Code',
            'Qué se considera continuado no es una cifra del Código',
          )}
        >
          <TProse text={CONTINUITY_CAVEAT} />
        </Callout>
      ) : null}

      {otherNotes.map((note) => (
        <NoteCallout key={note.key} note={note} />
      ))}

      <ResultBlock
        id={`${RESULT_ID}-sources`}
        title={bi('The rules this applied', 'Las normas aplicadas')}
        description={bi(
          'Every source both routes rest on, listed once, with the date a human last read it against the instrument. A source marked as administrative practice is not a statutory threshold, and the criteria that lean on it say so above.',
          'Todas las fuentes en las que se apoyan ambas vías, enumeradas una sola vez, con la fecha en que una persona las contrastó por última vez con el instrumento. Una fuente marcada como práctica administrativa no es un umbral legal, y los criterios que se apoyan en ella lo indican más arriba.',
        )}
      >
        <CitationList citations={assessment.citations} asOf={assessment.asOf} />
      </ResultBlock>

      <DisclosureNotice
        shown="assessment"
        withheld={[
          bi(
            'Which of the two regimes to apply under. Both are measured and both are shown; choosing between them for you would be a recommendation, and there is no representative accountable for one here.',
            'Por cuál de los dos regímenes solicitar. Ambos se evalúan y ambos se muestran; elegir entre ellos por usted sería una recomendación, y aquí no hay ningún representante que responda de ella.',
          ),
          bi(
            'Whether nationality would be granted. Art. 22.4 requires an assessment of civic conduct and of integration into Spanish society, and neither is a test software performs — a clear record does not oblige the authority to decide in your favour.',
            'Si se concedería la nacionalidad. El art. 22.4 exige una valoración de la conducta cívica y de la integración en la sociedad española, y ninguna de las dos es una prueba que realice un programa: un expediente limpio no obliga a la autoridad a resolver a su favor.',
          ),
          bi(
            'Any estimate of the chance an application would succeed, and any suggestion about what to do next. No authority publishes the data that would make the first honest, and the second is a regulated act.',
            'Cualquier estimación de la probabilidad de éxito de una solicitud y cualquier sugerencia sobre qué hacer a continuación. Ninguna autoridad publica los datos que harían honesta la primera, y la segunda es un acto reservado.',
          ),
        ]}
      />
    </ResultPanel>
  );
}
