import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  SITE_ALTERNATES,
  bi,
  localizedPath,
  parseLocale,
  translator,
  type Translate,
} from '@/lib/i18n';
import { plural } from '@/lib/ui';
import { CATALOG, NOTHING_IS_COUNSEL_REVIEWED } from '@/lib/catalog-facts';
import {
  ADJACENT_READERS,
  CLINIC_BODY,
  CLINIC_TITLE,
  DOORS,
  FREE_CLASSES_ARE_THE_UNREGULATED_ONES,
  releaseOf,
  type ClassRelease,
} from '@/lib/audiences';
import {
  COVERAGE_LEAD,
  COVERAGE_NOT_EXHAUSTIVE,
  COVERAGE_OUT_OF_SCOPE,
  COVERAGE_TITLE,
  COVERAGE_WHERE_TO_ASK,
  JURISDICTIONS_WITHOUT_REGISTER,
  UNCOVERED_ROUTES,
} from '@/lib/coverage';
import { PORTAL_URL, REPO_URL } from '@/lib/links';
import {
  MISSING_CRITERION_ID,
  WORKED_CITATION,
  WORKED_CRITERIA,
  WORKED_FACTS_SHOWN,
  WORKED_NOTES,
  WORKED_REPORT,
  WORKED_TALLY,
} from '@/lib/worked-example';
import { Badge, Chip, type Tone } from '@/components/Badge';
import { Instrument, Lang, Prose } from '@/components/Text';
import { Callout } from '@/components/Callout';
import { SchengenCalculator } from '@/components/SchengenCalculator';
import {
  ActionLink,
  Card,
  CivilDate,
  Fact,
  Facts,
  Figure,
  Grid,
  Page,
  PageHeader,
  ScrollX,
  Section,
  Stack,
} from '@/components/Layout';

import styles from './page.module.css';

/**
 * The marketing site.
 *
 * ── The one structural decision ──────────────────────────────────────────────
 *
 * A working instrument comes first, before any prose. This page used to open by
 * explaining, accurately and at length, that Meridian shows its arithmetic,
 * cites every rule, and refuses to recommend. All of that is true and none of
 * it is believable from a stranger, because every product in this category
 * claims the same things. So the first thing on the page is a real 90/180
 * counter that answers a real question about the reader's own travel history,
 * in their browser, with the working and the citation shown — and everything
 * below it is then read by somebody who has already watched the claim hold.
 *
 * ── The three rules that govern the rest ─────────────────────────────────────
 *
 * **Every number is counted, not written.** The catalog figures come from
 * `lib/catalog-facts.ts`; the worked eligibility report comes from
 * `lib/worked-example.ts`, which runs `evaluate` from `@meridian/pathways` at
 * build time and renders whatever comes back. There are no adoption numbers, no
 * processing-time estimates, no success rates, no testimonials, no customer
 * logos and no roadmap dressed as a feature list, because none of those would be
 * true — Meridian has no customers — and a platform that tells someone whether
 * they have overstayed cannot spend its credibility on marketing.
 *
 * **The limits get the same prominence as the capabilities.** The advice
 * boundary and the credential refusal are not disclaimers at the bottom; they
 * are the middle of the page, because they are the reason the product can be
 * trusted with a matter at all. Every card describing an unbuilt paid
 * capability says so in the same size type as the offer.
 *
 * **A limitation is only worth stating if it will still be true tomorrow.**
 * Statements that would falsify themselves — "nothing is deployed", read from a
 * host that is answering — are not made. What is stated is the set that holds
 * in either state: no pathway is counsel-reviewed until one is signed off
 * (counted), no government integration is provisioned, and none of the three
 * applications has an account, a sign-in or a database.
 */

interface LocaleParams {
  readonly params: Promise<{ readonly locale: string }>;
}

/**
 * The canonical address and the `hreflang` alternates, declared on the route
 * rather than on the layout.
 *
 * They belong here because they are true of exactly this route. Layout
 * metadata is inherited by every page under the layout, including the
 * not-found document, and a 404 carrying `<link rel="canonical" href="/">`
 * tells a crawler that the address it failed to find *is* the home page —
 * which is the one thing a not-found page exists to deny.
 *
 * Each locale's canonical is its own URL, so the two variants are indexed as two
 * documents rather than one being folded into the other; the alternates then say
 * they are the same document in two languages. `x-default` points at English,
 * which is what a reader whose language we have no basis to guess is served.
 */
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = parseLocale((await params).locale);
  if (locale === null) {
    // Unreachable while the middleware is in front of this route, and cheap
    // insurance if it ever is not: an address this site does not serve must not
    // carry a canonical pointing at the home page, which would tell a crawler
    // that the address it failed to resolve *is* that page.
    return { robots: { index: false, follow: false } };
  }
  return {
    alternates: {
      canonical: localizedPath('/', locale),
      languages: SITE_ALTERNATES,
    },
  };
}

const CATALOG_JURISDICTIONS = CATALOG.jurisdictions.map((j) => j.code).join(', ');

/** Per-criterion outcome, as tone plus word plus glyph — never colour alone. */
const CRITERION_TONE: Record<string, Tone> = {
  met: 'ok',
  unmet: 'bad',
  unknown: 'review',
  requires_human_review: 'warn',
};

const CRITERION_LABEL = {
  met: bi('Met', 'Cumplido'),
  unmet: bi('Unmet', 'Incumplido'),
  unknown: bi('Not recorded', 'Sin datos'),
  requires_human_review: bi('Needs a person', 'Requiere una persona'),
} as const;

const VERDICT_LABEL = {
  eligible: bi('Meets the encoded criteria', 'Cumple los criterios codificados'),
  ineligible: bi('Does not meet them', 'No los cumple'),
  indeterminate: bi('Cannot be decided', 'No puede decidirse'),
  requires_human_review: bi('Needs a person', 'Requiere una persona'),
} as const;

const VERDICT_TONE: Record<string, Tone> = {
  eligible: 'ok',
  ineligible: 'bad',
  indeterminate: 'review',
  requires_human_review: 'warn',
};

/**
 * The "without a representative" cell of the boundary table.
 *
 * The verdict is not written here — {@link releaseOf} calls the real
 * `canRelease` from `@meridian/core` at build time and this renders whatever
 * came back, including the gate's own reason when it withholds. A table that
 * *described* the gate would keep printing "Withheld" for as long as the words
 * stayed on the page, whatever the code underneath had started doing.
 */
function GateVerdict({ decision, t }: { readonly decision: ClassRelease; readonly t: Translate }) {
  return (
    <>
      <Badge
        tone={decision.released ? 'ok' : 'warn'}
        label={
          decision.released
            ? t('Released', 'Se entrega')
            : t('Withheld, and named', 'Se retiene, y se indica')
        }
      />
      {decision.reason !== null ? (
        <Lang code="en" className={styles.gateReason}>
          {decision.reason}
        </Lang>
      ) : null}
    </>
  );
}

export default async function HomePage({ params }: LocaleParams) {
  // The only two values this segment serves. `middleware.ts` refuses anything
  // else before it reaches the router, so this is a backstop rather than the
  // mechanism — but it is the backstop that keeps `/fr` from being answered in
  // English under a third address if the middleware is ever narrowed.
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();

  const t = translator(locale);

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Chip>Migration lifecycle engine</Chip>
            <Chip>{CATALOG_JURISDICTIONS}</Chip>
            <Chip>AGPL-3.0</Chip>
          </>
        }
        title={t(
          'Count your Schengen days. Right here, right now.',
          'Cuente sus días Schengen. Aquí y ahora.',
        )}
        lead={t(
          'Enter a couple of trips, get your real number with the arithmetic and the source. Free, no account, computed in your browser.',
          'Introduzca un par de viajes y obtenga su cifra real con la aritmética y la fuente. Gratis, sin cuenta, calculado en su navegador.',
        )}
      />

      {/*
        No section description here, deliberately. Everything a reader needs
        before typing is inside the instrument — beside the field it applies to
        — and two more paragraphs at this point would be another 150 pixels
        between a stranger and the first input on the one screen whose whole
        job is to prove the product works.
      */}
      <Section
        id="calculator"
        title={t(
          'The Schengen 90/180 short-stay allowance',
          'La franquicia Schengen 90/180 de estancia corta',
        )}
      >
        <SchengenCalculator locale={locale} />
      </Section>

      {/*
        Immediately after the instrument rather than before it. A reader who has
        just watched the counter work is exactly the reader who should be told,
        in the next breath, how small the reviewed catalog is and what these
        applications do not hold. The counsel figure is counted, so the sentence
        built on it stops applying by itself once a record is signed off.
      */}
      <Callout
        tone="info"
        icon="i"
        level={2}
        title={t(
          'Before you believe anything else on this page',
          'Antes de creer nada más de esta página',
        )}
      >
        <Prose>
          {t(
            `The day counter above is real and complete. The rest of the catalog is small: ${plural(CATALOG.pathways, 'pathway', 'pathways')} ship, of which ${CATALOG.counselReviewed} ${CATALOG.counselReviewed === 1 ? 'carries' : 'carry'} a counsel sign-off. ${NOTHING_IS_COUNSEL_REVIEWED ? 'That is why every recommendation-class output is blocked today' : 'Only the signed-off records may enter a recommendation'} — by design, not by accident. No government integration is provisioned, and no application in this product holds an account, a sign-in or a database.`,
            `El cómputo de días de arriba es real y está completo. El resto del catálogo es pequeño: se publican ${CATALOG.pathways} vías, de las cuales ${CATALOG.counselReviewed} ${CATALOG.counselReviewed === 1 ? 'cuenta' : 'cuentan'} con validación de letrado. ${NOTHING_IS_COUNSEL_REVIEWED ? 'Por eso hoy todo resultado de clase recomendación está bloqueado' : 'Solo los registros validados pueden formar parte de una recomendación'}: por diseño, no por descuido. No hay ninguna integración pública aprovisionada, y ninguna aplicación de este producto tiene cuenta, inicio de sesión ni base de datos.`,
          )}
        </Prose>
        <p className={styles.calloutLink}>
          <a href="#status">
            {t('The full status, with counts', 'El estado completo, con cifras')}
          </a>
        </p>
        <p className={styles.calloutLink}>
          <a href="#coverage">
            {t(
              'What the catalog does not cover, named route by route',
              'Qué no cubre el catálogo, vía por vía',
            )}
          </a>
        </p>
      </Callout>

      {/* -------------------------------------------------------------------
          Three doors
          ------------------------------------------------------------------- */}
      <Section
        id="doors"
        title={t('Which of these is you?', '¿Cuál de estos es usted?')}
        description={t(
          'The same engine, gated differently — and priced by the same line. Meridian classifies every output as information, assessment or advice. The first two release to anybody, so they are free forever. Advice needs a licensed representative accountable for it, so it is bought by the professional whose licence covers it. The commercial line and the legal line are the same line, and there is no second paywall behind it.',
          'El mismo motor, con distinto control, y con el mismo criterio de precio. Meridian clasifica cada resultado como información, evaluación o asesoramiento. Los dos primeros se entregan a cualquiera, de modo que son gratuitos para siempre. El asesoramiento exige un representante colegiado que responda de él, así que lo adquiere la persona profesional cuya colegiación lo ampara. La línea comercial y la línea jurídica son la misma, y detrás no hay un segundo muro de pago.',
        )}
      >
        <Grid>
          {DOORS.map((door) => (
            <Card key={door.id}>
              {/*
                Order is a scan order, and it is deliberate: who you are, who
                that means, WHETHER IT EXISTS, what it costs, and only then the
                detail. The availability badge sits third rather than last
                because a reader who gives this card ten seconds must not be
                able to come away thinking they can buy something that is not
                written. Putting the caveat at the bottom of a long card is the
                oldest way of technically disclosing it.
              */}
              <h3 className={styles.doorWho}>{t(door.who)}</h3>
              <p className={styles.doorPersona}>{t(door.persona)}</p>

              <div className={styles.doorAvailability}>
                <Badge
                  tone={door.cta === null ? 'warn' : 'ok'}
                  label={
                    door.cta === null
                      ? t('Not built yet', 'Aún no construido')
                      : t('Working today', 'Funciona hoy')
                  }
                />
                <Prose>{t(door.availability)}</Prose>
              </div>

              <div className={styles.doorPrice}>
                <h4 className={styles.doorLabel}>{t('What it costs', 'Cuánto cuesta')}</h4>
                <Prose>{t(door.price)}</Prose>
              </div>

              <div className={styles.doorGets}>
                <h4 className={styles.doorLabel}>{t('What you get', 'Qué obtiene')}</h4>
                <ul className={styles.list}>
                  {door.gets.map((item) => (
                    <li key={item.en}>{t(item)}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.doorBoundary}>
                <h4 className={styles.doorLabel}>
                  {t('Where the boundary falls', 'Dónde queda la frontera')}
                </h4>
                <Prose>{t(door.boundary)}</Prose>
              </div>

              {door.cta !== null ? (
                <div className={styles.doorCta}>
                  <ActionLink href={door.cta.href} variant="primary" label={t(door.cta.label)} />
                </div>
              ) : null}
            </Card>
          ))}
        </Grid>

        <Grid>
          {ADJACENT_READERS.map((reader) => (
            <Card key={reader.title.en} tone="sunken">
              <h3 className={styles.cardTitle}>{t(reader.title)}</h3>
              <Prose>{t(reader.body)}</Prose>
            </Card>
          ))}
        </Grid>

        <Callout tone="accent" icon="◆" title={t(CLINIC_TITLE)}>
          {CLINIC_BODY.map((paragraph) => (
            <Prose key={paragraph.en}>{t(paragraph)}</Prose>
          ))}
        </Callout>
      </Section>

      {/* -------------------------------------------------------------------
          The demonstration
          ------------------------------------------------------------------- */}
      <Section
        id="worked-example"
        title={t(
          'A missing fact is never a refusal. Watch it happen.',
          'Un dato ausente nunca es una denegación. Véalo ocurrir.',
        )}
        description={t(
          'Everything below is computed when this site is built, by running the engine over a pathway in the shipped catalog with an invented set of facts. The verdict, every per-criterion status, the engine’s own trace of each comparison, the citations and the caveats are whatever came back — not copy written to describe them.',
          'Todo lo que sigue se calcula al compilar este sitio, ejecutando el motor sobre una vía del catálogo publicado con un conjunto inventado de datos. El resultado, cada estado por criterio, el propio rastro del motor de cada comparación, las citas y las advertencias son lo que devolvió: no es texto redactado para describirlos.',
        )}
      >
        <Stack gap="md">
          <Card tone="sunken">
            <h3 className={styles.cardTitle}>
              {t('The invented applicant', 'La persona solicitante inventada')}
            </h3>
            <Prose>
              {t(
                'Country codes, dates and a few recorded outcomes. No name, no document number, no address — this repository holds no real personal data anywhere, including in its examples.',
                'Códigos de país, fechas y unos pocos resultados registrados. Sin nombre, sin número de documento, sin domicilio: este repositorio no contiene datos personales reales en ninguna parte, tampoco en sus ejemplos.',
              )}
            </Prose>
            <ul className={styles.facts}>
              {WORKED_FACTS_SHOWN.map((fact) => (
                <li key={fact.en}>{t(fact)}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className={styles.verdict}>
              <div>
                <div className={styles.verdictLabel}>{t('Verdict', 'Resultado')}</div>
                <Badge
                  tone={VERDICT_TONE[WORKED_REPORT.verdict] ?? 'neutral'}
                  label={t(VERDICT_LABEL[WORKED_REPORT.verdict])}
                />
              </div>
              <p className={styles.verdictTally}>
                {t(
                  `${WORKED_TALLY.met} of ${WORKED_TALLY.total} criteria met, ${WORKED_TALLY.unmet} unmet, ${WORKED_TALLY.unknown} not recorded.`,
                  `${WORKED_TALLY.met} de ${WORKED_TALLY.total} criterios cumplidos, ${WORKED_TALLY.unmet} incumplidos, ${WORKED_TALLY.unknown} sin datos.`,
                )}
              </p>
            </div>

            {/* The figures in this sentence are the counted ones, not written
                ones: if a criterion is added to the pathway, or the facts stop
                satisfying one, the sentence moves with the table above it. */}
            <Prose>
              {t(
                `${WORKED_TALLY.met} of ${WORKED_TALLY.total} criteria are met and the engine still declines to say yes, because ${WORKED_TALLY.unknown === 1 ? 'a fact it needs is' : `${WORKED_TALLY.unknown} facts it needs are`} simply not on file. It does not assume the answer, does not weight it, does not guess. A platform that resolved that silently would tell this person they are eight years closer to Spanish nationality than they may be — and they would act on it.`,
                `${WORKED_TALLY.met} de ${WORKED_TALLY.total} criterios se cumplen y aun así el motor se niega a decir que sí, porque ${WORKED_TALLY.unknown === 1 ? 'un dato que necesita no consta' : `${WORKED_TALLY.unknown} datos que necesita no constan`}. No supone la respuesta, ni la pondera, ni la adivina. Una plataforma que resolviera eso en silencio le diría a esta persona que está ocho años más cerca de la nacionalidad española de lo que quizá esté, y actuaría en consecuencia.`,
              )}
            </Prose>

            <ScrollX>
              <table>
                <caption className={styles.tableCaption}>
                  {t(
                    'Every criterion of the pathway, in catalog order — never sorted by outcome, because a sort order is a recommendation.',
                    'Todos los criterios de la vía, en el orden del catálogo, nunca ordenados por resultado, porque un orden de clasificación es una recomendación.',
                  )}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{t('Criterion', 'Criterio')}</th>
                    <th scope="col">{t('Weight', 'Peso')}</th>
                    <th scope="col">{t('Result', 'Resultado')}</th>
                    <th scope="col">{t('What the engine compared', 'Qué comparó el motor')}</th>
                  </tr>
                </thead>
                <tbody>
                  {WORKED_CRITERIA.map((criterion) => (
                    <tr
                      key={criterion.id}
                      className={
                        criterion.id === MISSING_CRITERION_ID ? styles.rowHighlight : undefined
                      }
                    >
                      <th scope="row" className={styles.criterionHead}>
                        {t(criterion.label)}
                        <span className={styles.criterionId}>{criterion.id}</span>
                      </th>
                      <td>
                        <Chip>{criterion.weight}</Chip>
                      </td>
                      <td>
                        <Badge
                          tone={CRITERION_TONE[criterion.status] ?? 'neutral'}
                          label={t(CRITERION_LABEL[criterion.status])}
                        />
                      </td>
                      <td>
                        {/* The engine's own words, verbatim and in the language
                            it writes them. A paraphrase of a trace is a
                            different statement, and this column exists so the
                            comparison can be checked rather than trusted. */}
                        <Lang code="en" className={styles.trace}>
                          {criterion.detail}
                        </Lang>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>

            <p className={styles.note}>
              {t(
                'The right-hand column is the engine’s own trace of the comparison it performed, rendered verbatim rather than paraphrased. The engine writes it in English, so it is marked as English and left alone: paraphrasing a trace would make it a different statement, and this column exists to be checked rather than trusted.',
                'La columna de la derecha es el propio rastro del motor de la comparación que realizó, reproducido literalmente y no parafraseado. El motor lo escribe en inglés, así que se marca como inglés y se deja tal cual: parafrasear un rastro lo convertiría en otra afirmación, y esta columna existe para poder comprobarla, no para creerla.',
              )}
            </p>
          </Card>

          {WORKED_CITATION !== null ? (
            <Card>
              <h3 className={styles.cardTitle}>
                {t(
                  'The rule behind the criterion that could not be decided',
                  'La norma que respalda el criterio que no pudo decidirse',
                )}
              </h3>
              <Prose>
                {t(
                  'Not a footnote and not a link to a summary. Every criterion in the catalog carries the instrument it comes from, the provision inside it, the canonical text, and the date a person last read that text against its source — and the engine refuses to apply a rule that has none.',
                  'No es una nota al pie ni un enlace a un resumen. Cada criterio del catálogo lleva el instrumento del que procede, el precepto concreto, el texto canónico y la fecha en que una persona contrastó por última vez ese texto con su fuente, y el motor se niega a aplicar una norma que carezca de ello.',
                )}
              </Prose>
              <dl className={styles.citation}>
                <div>
                  <dt>{t('Instrument', 'Instrumento')}</dt>
                  {/*
                    An instrument name is never translated, in either locale: it
                    is the identity of a source, and "Civil Code art. 22.1"
                    names an instrument that does not exist under that title, so
                    a reader who tried to verify it would not find it. It is
                    *marked* with its own language instead, which is what stops
                    a Spanish page pronouncing an English statute title with
                    Spanish phonetics and an English page doing the reverse. The
                    tag is derived from the citation rather than written beside
                    the value, because the value comes from the catalog and a
                    hard-coded `lang` would start lying the moment this section
                    is pointed at a different pathway.
                  */}
                  <dd>
                    <Instrument source={WORKED_CITATION} />
                  </dd>
                </div>
                <div>
                  <dt>{t('Kind, and jurisdiction', 'Tipo y jurisdicción')}</dt>
                  <dd>
                    <Chip>{WORKED_CITATION.kind}</Chip> <Chip>{WORKED_CITATION.jurisdiction}</Chip>
                  </dd>
                </div>
                <div>
                  <dt>{t('Last checked against its source', 'Contrastada por última vez')}</dt>
                  <dd>
                    <CivilDate value={WORKED_CITATION.verifiedOn} />
                  </dd>
                </div>
                {WORKED_CITATION.url !== undefined ? (
                  <div>
                    <dt>{t('Canonical text', 'Texto canónico')}</dt>
                    <dd className={styles.citationUrl}>
                      <a href={WORKED_CITATION.url} rel="noreferrer noopener" target="_blank">
                        {WORKED_CITATION.url}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Card>
          ) : null}

          {WORKED_NOTES.length > 0 ? (
            <Callout
              tone="warn"
              icon="⚑"
              title={t(
                'And the caveats the engine attached to its own answer',
                'Y las advertencias que el motor adjuntó a su propia respuesta',
              )}
            >
              <Prose>
                {t(
                  'These came back with the report. Nobody wrote them for this page, and nobody can suppress them at render time: a rule that rests on administrative practice rather than a statutory threshold has to say so wherever it is applied, and a rule no licensed person has read cannot be built into a recommendation at all.',
                  'Estas vinieron con el informe. Nadie las redactó para esta página y nadie puede suprimirlas al mostrarla: una norma que se apoya en la práctica administrativa y no en un umbral legal debe declararlo allí donde se aplica, y una norma que ninguna persona colegiada ha leído no puede convertirse en una recomendación.',
                )}
              </Prose>
              <ul className={styles.notes}>
                {WORKED_NOTES.map((note, index) => (
                  <li key={`${note.code}-${note.citationId ?? index}`}>
                    <Chip>{note.code}</Chip> <Lang code="en">{note.text}</Lang>
                  </li>
                ))}
              </ul>
            </Callout>
          ) : null}

          <Callout
            tone="bad"
            icon="✕"
            title={t(
              'What is missing from that output, and why',
              'Qué falta en ese resultado y por qué',
            )}
          >
            <Prose>
              {t(
                'There is no ranking of this applicant’s options, no "best route", no estimate of the chance an application succeeds, and no suggestion of what to do next. None of those is an omission. Each is a recommendation, a recommendation is the regulated act, and no licensed person is accountable for an answer this page gives. The engine’s ranking function exists — and it excludes every unreviewed pathway and attaches the reason, which today is all of them.',
                'No hay clasificación de las opciones de esta persona, ni «mejor vía», ni estimación de la probabilidad de éxito de una solicitud, ni sugerencia sobre qué hacer a continuación. Ninguna de esas ausencias es un descuido. Cada una es una recomendación, una recomendación es el acto reservado y ninguna persona colegiada responde de una respuesta que dé esta página. La función de clasificación del motor existe, y excluye toda vía no revisada adjuntando el motivo, que hoy son todas.',
              )}
            </Prose>
            <p className={styles.calloutLink}>
              <a href="#advice-boundary">
                {t(
                  'How the boundary is enforced, in the type system rather than in a disclaimer',
                  'Cómo se impone la frontera, en el sistema de tipos y no en un descargo de responsabilidad',
                )}
              </a>
            </p>
          </Callout>
        </Stack>
      </Section>

      {/* -------------------------------------------------------------------
          What it is
          ------------------------------------------------------------------- */}
      <Section
        id="what-it-is"
        title={t('What else the engine does', 'Qué más hace el motor')}
        description={t(
          'Four engines over one shared contract. Each produces a value you can reconstruct by hand from what is on the screen, and each cites the rule it applied.',
          'Cuatro motores sobre un mismo contrato compartido. Cada uno produce un valor que usted puede reconstruir a mano a partir de lo que ve en pantalla, y cada uno cita la norma que aplicó.',
        )}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              {t('Eligibility, against cited rules', 'Elegibilidad, frente a normas citadas')}
            </h3>
            <Prose>
              {t(
                'A pathway is a list of criteria, each attached to the instrument and provision it comes from and the date a person last checked that text. Evaluation is three-valued: met, unmet, or not recorded. You have just watched one run.',
                'Una vía es una lista de criterios, cada uno vinculado al instrumento y precepto del que procede y a la fecha en que una persona contrastó ese texto por última vez. La evaluación es de tres valores: cumplido, incumplido o sin datos. Acaba de ver una ejecutarse.',
              )}
            </Prose>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              {t(
                'Documents, in the order they must exist',
                'Documentos, en el orden en que deben existir',
              )}
            </h3>
            <Prose>
              {t(
                'Which document needs legalisation and by which route, which needs a sworn translation and into which language, and how long each stays current — projected forward to the date you intend to file rather than to today, because a certificate that is valid now and expired then is a wasted appointment.',
                'Qué documento necesita legalización y por qué vía, cuál necesita traducción jurada y a qué idioma, y cuánto tiempo sigue vigente cada uno, proyectado a la fecha en que piensa presentar y no a hoy, porque un certificado vigente ahora y caducado entonces es una cita perdida.',
              )}
            </Prose>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              {t(
                'Travel documents, to ICAO Doc 9303',
                'Documentos de viaje, conforme al Doc 9303 de OACI',
              )}
            </h3>
            <Prose>
              {t(
                'Machine-readable zone parsing with the check digits recomputed and the two-digit year windows resolved as the standard specifies. The verdict is returned; the fields read off the document are discarded rather than stored.',
                'Lectura de la zona de lectura mecánica con recálculo de los dígitos de control y resolución de las ventanas de año de dos cifras según especifica la norma. Se devuelve el resultado; los campos leídos del documento se descartan en lugar de almacenarse.',
              )}
            </Prose>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              {t('Presence, counted day by day', 'Presencia, contada día a día')}
            </h3>
            <Prose>
              {t(
                'One ledger of where you were, feeding tax-residency day counts, the Schengen 90/180 allowance you have just used, continuous-residence tests and accumulated work. Entry and exit days both count, and every calculation is civil-date arithmetic: there is no timezone anywhere in it to lose a day to.',
                'Un único registro de dónde estuvo, que alimenta el cómputo fiscal de días, la franquicia Schengen 90/180 que acaba de usar, las pruebas de residencia continuada y el trabajo acumulado. Los días de entrada y de salida cuentan ambos, y todo el cálculo es aritmética de fechas civiles: no hay ninguna zona horaria en la que perder un día.',
              )}
            </Prose>
          </Card>
        </Grid>
      </Section>

      <Section
        id="corridors"
        title={t('Two corridors seed the catalog', 'Dos corredores siembran el catálogo')}
        description={t(
          'The engine is jurisdiction-generic. The corridors are data — the evaluator contains no country name and no threshold, so adding a jurisdiction is a new catalog file that a lawyer can read, not a change to the code that applies it.',
          'El motor es genérico respecto a la jurisdicción. Los corredores son datos: el evaluador no contiene ningún nombre de país ni ningún umbral, de modo que añadir una jurisdicción es un nuevo archivo de catálogo que un letrado puede leer, no un cambio en el código que lo aplica.',
        )}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>{t('Mexico to Spain', 'De México a España')}</h3>
            <div className={styles.cardMeta}>
              <Chip>ES</Chip>
              <Chip>
                {plural(
                  CATALOG.jurisdictions.find((j) => j.code === 'ES')?.pathways ?? 0,
                  'pathway',
                  'pathways',
                )}
              </Chip>
            </div>
            <Prose>
              {t(
                'Built around nationality by residence on the reduced period that the Civil Code provides for nationals of certain countries, Mexico among them, with the residence permits that can build toward it recorded alongside it — including one route recorded as closed, because a person already holding that status still needs an answer.',
                'Construido en torno a la nacionalidad por residencia con el plazo reducido que el Código Civil prevé para nacionales de determinados países, México entre ellos, junto con las autorizaciones de residencia que pueden conducir a ella, incluida una vía registrada como cerrada, porque quien ya tiene ese estatus sigue necesitando una respuesta.',
              )}
            </Prose>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>{t('Mexico to Canada', 'De México a Canadá')}</h3>
            <div className={styles.cardMeta}>
              <Chip>CA</Chip>
              <Chip>
                {plural(
                  CATALOG.jurisdictions.find((j) => j.code === 'CA')?.pathways ?? 0,
                  'pathway',
                  'pathways',
                )}
              </Chip>
            </div>
            <Prose>
              {t(
                'The professional work permit under CUSMA Chapter 16, and the Canadian Experience Class it can bridge to once enough authorised Canadian work has accumulated. The catalog records that bridge explicitly, so the work a permit builds is visible while it is being built rather than after.',
                'El permiso de trabajo profesional del capítulo 16 del T-MEC y la Canadian Experience Class a la que puede conducir una vez acumulado suficiente trabajo autorizado en Canadá. El catálogo registra ese enlace de forma explícita, de modo que el tiempo que un permiso va acumulando es visible mientras se acumula y no después.',
              )}
            </Prose>
          </Card>
        </Grid>

        <Card tone="sunken">
          <Facts>
            <Fact label={t('Pathways encoded', 'Vías codificadas')}>
              <Figure value={CATALOG.pathways} unit={t('routes', 'vías')} />
            </Fact>
            <Fact label={t('Jurisdictions', 'Jurisdicciones')}>
              <Figure value={CATALOG.jurisdictions.length} />
              {/* ISO country codes are not translated and carry no locale: they
                  are the same string in both documents, so they go through no
                  translator and are marked with no language. */}
              <div className={styles.factCodes}>{CATALOG_JURISDICTIONS}</div>
            </Fact>
            <Fact label={t('Eligibility criteria', 'Criterios de elegibilidad')}>
              <Figure value={CATALOG.criteria} />
            </Fact>
            <Fact label={t('Distinct sources cited', 'Fuentes distintas citadas')}>
              <Figure value={CATALOG.citations} />
              <div className={styles.factNote}>
                {t(
                  `${CATALOG.discretionaryCitations} marked as administrative practice rather than a statutory threshold`,
                  `${CATALOG.discretionaryCitations} marcadas como práctica administrativa y no como umbral legal`,
                )}
              </div>
            </Fact>
          </Facts>
        </Card>
      </Section>

      {/*
        Immediately after the corridors, because the corridors section is where
        this page is at its most flattering: two country cards, a count of
        pathways, a count of criteria, a count of sources. Everything in it is
        true and none of it says how small the sample is. A reader who stops
        there leaves believing Meridian has something to say about their case,
        and for most people arriving from either corridor it does not.

        The list is not decoration and not a roadmap — nothing here is promised.
        It is the set of routes a person could reasonably expect to find and will
        not, named specifically enough to take to somebody qualified. Each entry
        retires itself from `lib/coverage.ts` once the catalog answers it, so this
        section cannot go on claiming a hole that has been filled, and cannot
        quietly stop mentioning one that has not.
      */}
      <Section
        id="coverage"
        title={t('What the catalog does not cover', 'Qué no cubre el catálogo')}
        description={t(
          'The counts above are real and they are small. This is the other half of that sentence: the significant routes in the same two countries that Meridian does not encode at all.',
          'Las cifras anteriores son reales y son pequeñas. Esta es la otra mitad de la frase: las vías importantes de esos mismos dos países que Meridian no codifica en absoluto.',
        )}
      >
        <Stack gap="md">
          <Callout tone="warn" icon="⚑" title={t(COVERAGE_TITLE)}>
            <Prose>{t(COVERAGE_LEAD)}</Prose>
          </Callout>

          <Card>
            <h3 className={styles.cardTitle}>{t('Not encoded', 'Sin codificar')}</h3>
            <ul className={styles.gaps}>
              {UNCOVERED_ROUTES.map((route) => (
                <li key={route.key}>
                  <Chip>{route.jurisdiction}</Chip> {t(route.name)}
                </li>
              ))}
            </ul>

            {JURISDICTIONS_WITHOUT_REGISTER.length > 0 ? (
              <Prose>
                {t(
                  `The catalog also encodes routes for ${JURISDICTIONS_WITHOUT_REGISTER.join(', ')}, and nobody has recorded what is missing there. Treat coverage for ${JURISDICTIONS_WITHOUT_REGISTER.length === 1 ? 'that jurisdiction' : 'those jurisdictions'} as unknown rather than complete.`,
                  `El catálogo también codifica vías para ${JURISDICTIONS_WITHOUT_REGISTER.join(', ')}, y nadie ha dejado constancia de qué falta allí. Considere la cobertura de ${JURISDICTIONS_WITHOUT_REGISTER.length === 1 ? 'esa jurisdicción' : 'esas jurisdicciones'} como desconocida y no como completa.`,
                )}
              </Prose>
            ) : null}

            <Prose>{t(COVERAGE_NOT_EXHAUSTIVE)}</Prose>
          </Card>

          <Callout
            tone="neutral"
            icon="◆"
            title={t(
              'Permanently out of scope: protection claims',
              'Fuera de alcance de forma permanente: la protección internacional',
            )}
          >
            <Prose>{t(COVERAGE_OUT_OF_SCOPE)}</Prose>
          </Callout>

          <Callout
            tone="accent"
            icon="§"
            title={t('Who to ask instead', 'A quién preguntar en su lugar')}
          >
            <Prose>{t(COVERAGE_WHERE_TO_ASK)}</Prose>
          </Callout>
        </Stack>
      </Section>

      <Section
        id="advice-boundary"
        title={t('The advice boundary', 'La frontera del asesoramiento')}
        description={t(
          'Meridian is software. Regulated immigration advice requires an authorised representative attached to the matter, and this platform enforces that in the type system rather than in a disclaimer nobody reads. It is also, exactly, the line the pricing follows.',
          'Meridian es software. El asesoramiento migratorio reservado exige un representante autorizado vinculado al expediente, y esta plataforma lo impone en el sistema de tipos y no en un descargo de responsabilidad que nadie lee. Es también, exactamente, la línea que sigue el precio.',
        )}
      >
        <Stack gap="md">
          <Prose>
            {t(
              'Under s.91 of Canada’s Immigration and Refugee Protection Act, advising or representing a person for consideration in connection with an application is an offence unless the adviser is a lawyer or paralegal in good standing of a law society, a Quebec notary, or a licensee of the College of Immigration and Citizenship Consultants. Spain has its own reserved-activity rules for legal advice. A platform that tells an unrepresented paying consumer which route to take is not shipping a feature; it is committing an offence on behalf of whoever operates it.',
              'Conforme al art. 91 de la Immigration and Refugee Protection Act de Canadá, asesorar o representar a una persona a cambio de contraprestación en relación con una solicitud es delito salvo que quien asesora sea abogado o paralegal colegiado, notario de Quebec o colegiado del College of Immigration and Citizenship Consultants. España tiene sus propias reglas de actividad reservada para el asesoramiento jurídico. Una plataforma que dice a un consumidor de pago y sin representación qué vía tomar no está lanzando una funcionalidad: está cometiendo una infracción por cuenta de quien la explota.',
            )}
          </Prose>
          <Prose>
            {t(
              'So every output is classified where it is produced, never where it is displayed, and it can only ever be moved down. There are exactly three classes, and the first two are what you have been using on this page for free.',
              'Por eso cada resultado se clasifica donde se produce, nunca donde se muestra, y solo puede moverse hacia abajo. Hay exactamente tres clases, y las dos primeras son las que ha estado usando gratis en esta página.',
            )}
          </Prose>
          {/*
            The verdicts in the fourth column below are not copy. Each is the
            return value of `canRelease` from `@meridian/core` — the same gate
            the engine calls — asked at build time about a reader with no
            representative attached, and rendered along with the gate's own
            reason for withholding. This sentence branches on the same values,
            so the page cannot go on describing a boundary the code has stopped
            enforcing.
          */}
          <Prose>
            {FREE_CLASSES_ARE_THE_UNREGULATED_ONES
              ? t(
                  'The fourth column is not a description of the gate. It is the gate: each verdict is what `canRelease` returned when this site was built, asked about a reader with nobody on the hook, and the refusal text is the gate’s own.',
                  'La cuarta columna no describe el control: es el control. Cada veredicto es lo que devolvió `canRelease` al compilar este sitio, preguntado por una persona lectora sin nadie que responda por ella, y el texto de la negativa es el suyo propio.',
                )
              : t(
                  'WARNING: the release gate is no longer withholding advice from an unrepresented reader. The fourth column below is what `canRelease` actually returned when this site was built. Treat this as a defect in the platform rather than as a feature.',
                  'ADVERTENCIA: el control de divulgación ya no retiene el asesoramiento frente a una persona lectora sin representante. La cuarta columna refleja lo que devolvió `canRelease` al compilar este sitio. Considérelo un defecto de la plataforma y no una funcionalidad.',
                )}
          </Prose>

          <ScrollX>
            <table>
              <caption className={styles.tableCaption}>
                {t(
                  'The three output classes, what reaches an applicant with no representative attached, and what each costs',
                  'Las tres clases de resultado, lo que llega a un solicitante sin representante vinculado y cuánto cuesta cada una',
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t('Class', 'Clase')}</th>
                  <th scope="col">{t('What it is', 'Qué es')}</th>
                  <th scope="col">{t('Example', 'Ejemplo')}</th>
                  <th scope="col">{t('Without a representative', 'Sin representante')}</th>
                  <th scope="col">{t('Price', 'Precio')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className={styles.rowHead}>
                    {t('Information', 'Información')}
                  </th>
                  <td>
                    {t(
                      'A neutral restatement of what a published rule says, with its source. Not applied to anybody’s facts.',
                      'Exposición neutral de lo que dice una norma publicada, con su fuente. No se aplica a los datos de nadie.',
                    )}
                  </td>
                  <td>
                    {t(
                      '“The Civil Code sets a two-year residence period for the listed nationalities.”',
                      '«El Código Civil fija un plazo de residencia de dos años para las nacionalidades enumeradas.»',
                    )}
                  </td>
                  <td>
                    <GateVerdict decision={releaseOf('information')} t={t} />
                  </td>
                  <td>{t('Free, forever', 'Gratis, siempre')}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.rowHead}>
                    {t('Assessment', 'Evaluación')}
                  </th>
                  <td>
                    {t(
                      'Your own recorded facts measured against a cited rule, with the arithmetic shown so you can check it. Reproducible, and not a recommendation.',
                      'Sus propios datos registrados medidos frente a una norma citada, con la aritmética a la vista para que pueda comprobarla. Reproducible, y no es una recomendación.',
                    )}
                  </td>
                  <td>
                    {t(
                      '“You have 610 recorded days of residence; the rule states 730.” The counter at the top of this page.',
                      '«Tiene 610 días de residencia registrados; la norma exige 730.» El cómputo del principio de esta página.',
                    )}
                  </td>
                  <td>
                    <GateVerdict decision={releaseOf('assessment')} t={t} />
                  </td>
                  <td>{t('Free, forever', 'Gratis, siempre')}</td>
                </tr>
                <tr>
                  <th scope="row" className={styles.rowHead}>
                    {t('Advice', 'Asesoramiento')}
                  </th>
                  <td>
                    {t(
                      'A recommendation, a ranking, a strategy, or a prediction of outcome. A sort order is a recommendation. This is the regulated act.',
                      'Una recomendación, una clasificación, una estrategia o una predicción de resultado. Un orden de clasificación es una recomendación. Este es el acto reservado.',
                    )}
                  </td>
                  <td>
                    {t(
                      '“Apply under the work-permit route first.”',
                      '«Solicite primero por la vía del permiso de trabajo.»',
                    )}
                  </td>
                  <td>
                    <GateVerdict decision={releaseOf('advice')} t={t} />
                  </td>
                  <td>
                    {t(
                      'Bought by the licensee accountable for it',
                      'Lo adquiere el colegiado que responde de ello',
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollX>

          <Callout
            tone="accent"
            icon="§"
            title={t(
              'Withholding is stated, never silent',
              'La retención se declara, nunca es silenciosa',
            )}
          >
            <Prose>
              {t(
                'When a recommendation cannot lawfully reach you, it is downgraded to the same facts without the opinion — and you are told which output was withheld, the reason the gate returned, and what would change it. A person handed the downgraded version with no explanation cannot tell it apart from a bug, an empty database, or a product with nothing to say about their case.',
                'Cuando una recomendación no puede llegarle lícitamente, se degrada a los mismos hechos sin la opinión, y se le indica qué resultado se ha retenido, el motivo que devolvió el control y qué cambiaría eso. Quien recibe la versión degradada sin explicación no puede distinguirla de un error, de una base de datos vacía o de un producto que no tiene nada que decir sobre su caso.',
              )}
            </Prose>
            <Prose>
              {t(
                'A downgrade is re-checked rather than trusted, so a downgrade that still returns a recommendation cannot walk past the boundary. Classification can move down; it never moves up. This is a differentiator, not a disclaimer: it is the reason the assessments this platform does release are worth relying on.',
                'La degradación se vuelve a comprobar en lugar de darse por buena, de modo que una degradación que siga devolviendo una recomendación no puede cruzar la frontera. La clasificación puede bajar; nunca sube. Esto es un rasgo diferencial, no un descargo de responsabilidad: es la razón por la que las evaluaciones que sí se entregan merecen confianza.',
              )}
            </Prose>
          </Callout>
        </Stack>
      </Section>

      <Section
        id="refused"
        title={t('What we refuse to build', 'Lo que nos negamos a construir')}
        description={t(
          'Two capabilities a competitor may well offer you. Both are refused permanently, and the refusal is in the code rather than in a policy page.',
          'Dos funcionalidades que un competidor podría ofrecerle. Ambas están rechazadas de forma permanente, y el rechazo está en el código y no en una página de políticas.',
        )}
      >
        <Stack gap="md">
          <Grid>
            <Card>
              <h3 className={styles.cardTitle}>
                <Badge
                  tone="bad"
                  label={t('No custody of your credential', 'Sin custodia de su credencial')}
                />
              </h3>
              <Prose>
                {t(
                  'Meridian does not accept, store, relay or transmit the authentication credential you use before your own government, and does not act before an authority while presenting as you. That credential is not a website login: it is the key that reaches your tax file, your social security record and your civil registry entries.',
                  'Meridian no acepta, almacena, retransmite ni transmite la credencial de autenticación que usted usa ante su propia administración, ni actúa ante una autoridad haciéndose pasar por usted. Esa credencial no es el acceso a una web: es la llave que alcanza su expediente fiscal, su historial de seguridad social y sus asientos del registro civil.',
                )}
              </Prose>
              <ul className={styles.list}>
                <li>
                  {t(
                    'Holding it would make the operator a custodian for a state identity system — a role nobody involved has signed up for.',
                    'Custodiarla convertiría al operador en depositario de un sistema de identidad estatal, un papel que nadie de los implicados ha asumido.',
                  )}
                </li>
                <li>
                  {t(
                    'These schemes’ own terms treat the credential as personal and non-transferable.',
                    'Las propias condiciones de estos sistemas tratan la credencial como personal e intransferible.',
                  )}
                </li>
                <li>
                  {t(
                    'A breach of this platform would stop being a data incident and become an identity-fraud event against your tax, social security and civil registry records.',
                    'Una brecha en esta plataforma dejaría de ser un incidente de datos para convertirse en un fraude de identidad contra sus registros fiscales, de seguridad social y del registro civil.',
                  )}
                </li>
                <li>
                  {t(
                    'A filing made with your credential is legally your act, performed by someone else, with no record of your consent to that specific act on that specific day.',
                    'Una presentación hecha con su credencial es jurídicamente su acto, realizado por otro, sin constancia de su consentimiento a ese acto concreto en esa fecha concreta.',
                  )}
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className={styles.cardTitle}>
                <Badge
                  tone="ok"
                  label={t('Assisted handoff instead', 'En su lugar, entrega asistida')}
                />
              </h3>
              <Prose>
                {t(
                  'Meridian computes the values, assembles the documents, and hands you an ordered package you carry to the portal or the appointment yourself: the exact destination, the steps in sequence, which of your documents each step consumes, the field values already worked out for you to copy, and what you must bring back so the matter can continue.',
                  'Meridian calcula los valores, prepara la documentación y le entrega un paquete ordenado que usted mismo lleva al portal o a la cita: el destino exacto, los pasos en secuencia, qué documentos suyos consume cada paso, los valores de cada campo ya calculados para que los copie y lo que debe traer de vuelta para que el expediente continúe.',
                )}
              </Prose>
              <ul className={styles.list}>
                <li>
                  {t(
                    'The legal act stays yours. You authenticate, you declare, you submit.',
                    'El acto jurídico sigue siendo suyo. Usted se autentica, usted declara, usted presenta.',
                  )}
                </li>
                <li>
                  {t(
                    'The audit trail lands in your account on the authority’s own system, where an authority will actually look for it.',
                    'El rastro de auditoría queda en su cuenta del propio sistema de la administración, que es donde una administración lo buscará.',
                  )}
                </li>
                <li>
                  {t(
                    'It survives the portal changing. Robotic submission breaks silently the week a form gains a field; a handoff degrades to a person reading a slightly different screen.',
                    'Sobrevive a los cambios del portal. La presentación robotizada se rompe en silencio la semana en que un formulario gana un campo; una entrega asistida se degrada a una persona leyendo una pantalla algo distinta.',
                  )}
                </li>
                <li>
                  {t(
                    'Spanish administrative law reaches the same answer: Ley 39/2015 art. 12 provides for assistance in the use of electronic means, and contemplates acting for someone only through designated officials with their express recorded consent.',
                    'El derecho administrativo español llega a la misma conclusión: el art. 12 de la Ley 39/2015 prevé la asistencia en el uso de medios electrónicos y contempla actuar por otro solo a través de funcionarios habilitados y con su consentimiento expreso y registrado.',
                  )}
                </li>
              </ul>
            </Card>
          </Grid>

          <Callout
            tone="neutral"
            icon="◆"
            title={t(
              'Also refused: any estimate of your chance of success',
              'También rechazado: cualquier estimación de su probabilidad de éxito',
            )}
          >
            <Prose>
              {t(
                'It is a prediction of outcome, it is the most heavily regulated thing an unlicensed adviser can say, and no authority publishes the data that would make such a number true. A percentage invented to look authoritative is worse than silence, because it is acted on.',
                'Es una predicción de resultado, es lo más regulado que puede decir quien carece de licencia y ninguna autoridad publica los datos que harían cierta esa cifra. Un porcentaje inventado para parecer solvente es peor que el silencio, porque la gente actúa sobre él.',
              )}
            </Prose>
            <Prose>
              {t(
                'The refusals above are enforced by the type system, a runtime guard on every untyped boundary, and repository checks that run in CI before anything else. They are not promises in a document; they are conditions the build has to satisfy.',
                'Los rechazos anteriores se imponen mediante el sistema de tipos, una comprobación en tiempo de ejecución en cada frontera no tipada y controles del repositorio que se ejecutan en CI antes que nada. No son promesas de un documento: son condiciones que la compilación debe cumplir.',
              )}
            </Prose>
          </Callout>
        </Stack>
      </Section>

      <Section
        id="status"
        title={t('Where the build actually stands', 'En qué punto está realmente el desarrollo')}
        description={t(
          'Counted from the catalog this site ships, at build time, as at the date below. Everything in this section is a fact about the repository rather than a plan.',
          'Contado sobre el catálogo que incluye este sitio, en tiempo de compilación y a la fecha indicada. Todo lo de esta sección es un hecho sobre el repositorio, no un plan.',
        )}
      >
        <Card tone="sunken">
          <Facts>
            <Fact label={t('Pathways encoded', 'Vías codificadas')}>
              <Figure value={CATALOG.pathways} />
            </Fact>
            <Fact label={t('Reviewed by counsel', 'Revisadas por letrado')}>
              <Figure value={`${CATALOG.counselReviewed} / ${CATALOG.pathways}`} />
              <div className={styles.factBadge}>
                <Badge
                  tone={NOTHING_IS_COUNSEL_REVIEWED ? 'warn' : 'ok'}
                  label={
                    NOTHING_IS_COUNSEL_REVIEWED
                      ? t('None, today', 'Ninguna, a día de hoy')
                      : t('Some reviewed', 'Algunas revisadas')
                  }
                />
              </div>
            </Fact>
            <Fact label={t('Open to new applications', 'Abiertas a nuevas solicitudes')}>
              <Figure value={`${CATALOG.open} / ${CATALOG.pathways}`} />
            </Fact>
            <Fact label={t('Distinct sources cited', 'Fuentes distintas citadas')}>
              <Figure value={CATALOG.citations} />
              <div className={styles.factNote}>
                {t(
                  `${CATALOG.citationsWithUrl} carry a link we are confident is canonical`,
                  `${CATALOG.citationsWithUrl} llevan un enlace que consideramos canónico`,
                )}
              </div>
            </Fact>
            <Fact
              label={t('Sources past the freshest band', 'Fuentes fuera de la banda más reciente')}
            >
              <Figure value={`${CATALOG.agingCitations} / ${CATALOG.citations}`} />
            </Fact>
            <Fact label={t('Figures computed as at', 'Cifras calculadas a fecha de')}>
              <CivilDate value={CATALOG.asOf} />
            </Fact>
          </Facts>
        </Card>

        {/*
          Title and body both branch on the counted figure. The unreviewed state
          is the one that holds today, but it is not written as though it were
          permanent: the day a licensed person signs a record off, this callout
          has to stop saying nothing has been signed off, and it does so without
          anybody remembering to edit copy.
        */}
        <Callout
          tone={NOTHING_IS_COUNSEL_REVIEWED ? 'warn' : 'info'}
          icon={NOTHING_IS_COUNSEL_REVIEWED ? '!' : 'i'}
          title={
            NOTHING_IS_COUNSEL_REVIEWED
              ? t(
                  'No pathway in this catalog has been reviewed by counsel',
                  'Ninguna vía de este catálogo ha sido revisada por letrado',
                )
              : t(
                  'Only counsel-reviewed pathways can enter a recommendation',
                  'Solo las vías revisadas por letrado pueden formar parte de una recomendación',
                )
          }
        >
          <Prose>
            {t(
              `${CATALOG.counselReviewed} of ${CATALOG.pathways} pathways carry a licensed sign-off; the rest ship marked unreviewed. An unreviewed pathway may be shown as a restatement of the sources it cites, and your own figures may be measured against it, but it may not be built into a recommendation: the ranking function excludes it and attaches the reason. That is the system working as designed, not a placeholder waiting to be tidied — sign-off is a workflow step with a named licensed human attached, not a constant somebody flips.`,
              `${CATALOG.counselReviewed} de ${CATALOG.pathways} vías cuentan con validación de una persona colegiada; el resto se publican marcadas como no revisadas. Una vía no revisada puede mostrarse como exposición de las fuentes que cita, y sus propias cifras pueden medirse frente a ella, pero no puede convertirse en una recomendación: la función de clasificación la excluye y adjunta el motivo. Así es como debe funcionar el sistema, no un marcador de posición pendiente de arreglar: la validación es un paso del flujo con una persona colegiada concreta detrás, no una constante que alguien cambia.`,
            )}
          </Prose>
          <Prose>
            {t(
              `Of the ${CATALOG.citations} distinct sources cited, ${plural(CATALOG.discretionaryCitations, 'is', 'are')} marked as administrative practice rather than a statutory threshold. Those are surfaced as such wherever they are applied, instead of being presented as settled law.`,
              `De las ${CATALOG.citations} fuentes distintas citadas, ${CATALOG.discretionaryCitations} están marcadas como práctica administrativa y no como umbral legal. Se muestran como tales allí donde se aplican, en lugar de presentarse como derecho consolidado.`,
            )}
          </Prose>
        </Callout>

        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="ok" label={t('Working today', 'Funciona hoy')} />
            </h3>
            <ul className={styles.list}>
              <li>
                {t(
                  'The day counter at the top of this page, and the tools in the portal. Nothing entered in them is transmitted or stored.',
                  'El cómputo de días del principio de esta página y las herramientas del portal. Nada de lo que se introduce en ellos se transmite ni se almacena.',
                )}
              </li>
              <li>
                {t(
                  'Civil-date arithmetic with no timezone and no Date object anywhere in the stack.',
                  'Aritmética de fechas civiles sin zonas horarias y sin ningún objeto Date en toda la pila.',
                )}
              </li>
              <li>
                {t(
                  'Presence ledger, Schengen 90/180, tax day counts, continuous residence and accumulated work.',
                  'Registro de presencia, Schengen 90/180, cómputo fiscal de días, residencia continuada y trabajo acumulado.',
                )}
              </li>
              <li>
                {t(
                  'A declarative rules engine whose evaluator contains no country name and no threshold, plus the release gate described above.',
                  'Un motor de reglas declarativo cuyo evaluador no contiene ningún nombre de país ni ningún umbral, más el control de divulgación descrito arriba.',
                )}
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="warn" label={t('Not built yet', 'Aún no construido')} />
            </h3>
            <ul className={styles.list}>
              <li>
                {t(
                  'No account, no sign-in and no database in any of the applications. Everything described above as a paid capability depends on those, so none of it can be bought today.',
                  'Ninguna de las aplicaciones tiene cuenta, inicio de sesión ni base de datos. Todo lo descrito arriba como función de pago depende de eso, de modo que nada de ello puede contratarse hoy.',
                )}
              </li>
              <li>
                {t(
                  'No government integration is provisioned. Nothing here files anything with anybody, and the adapters that would say otherwise report their own unavailability rather than inventing a response.',
                  'No hay ninguna integración pública aprovisionada. Nada de esto presenta nada ante nadie, y los adaptadores que podrían indicar lo contrario informan de su propia indisponibilidad en lugar de inventarse una respuesta.',
                )}
              </li>
              <li>
                {t(
                  'Every screen in the portal renders from sample data declared in the application’s own source, and every catalog figure on this page is computed when the site is built rather than fetched from a service.',
                  'Cada pantalla del portal se dibuja a partir de datos de ejemplo declarados en el propio código de la aplicación, y cada cifra de catálogo de esta página se calcula al compilar el sitio en lugar de obtenerse de un servicio.',
                )}
              </li>
              <li>
                {t(
                  'None of the three applications has a test suite. The libraries underneath them do; the screens do not, and that is the largest gap in the repository.',
                  'Ninguna de las tres aplicaciones tiene pruebas. Las bibliotecas sobre las que se apoyan sí; las pantallas no, y esa es la mayor carencia del repositorio.',
                )}
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="bad" label={t('Permanently refused', 'Rechazado de forma permanente')} />
            </h3>
            <ul className={styles.list}>
              <li>
                {t(
                  'Custody of a government authentication credential, and acting before an authority while presenting as the user.',
                  'La custodia de una credencial de autenticación pública y actuar ante una autoridad haciéndose pasar por la persona usuaria.',
                )}
              </li>
              <li>
                {t(
                  'Any estimate of the chance an application will succeed.',
                  'Cualquier estimación de la probabilidad de éxito de una solicitud.',
                )}
              </li>
              <li>
                {t(
                  'Any recommendation drawn from rules nobody qualified has read.',
                  'Cualquier recomendación basada en normas que nadie cualificado haya leído.',
                )}
              </li>
              <li>
                {t(
                  'Fixture data dressed as a government response. An adapter that cannot do something says so, with a reason and an owner.',
                  'Datos de prueba disfrazados de respuesta oficial. Un adaptador que no puede hacer algo lo dice, con un motivo y un responsable.',
                )}
              </li>
            </ul>
          </Card>
        </Grid>

        <div className={styles.closing}>
          <ActionLink
            href={`${PORTAL_URL}/tools`}
            variant="primary"
            label={t('Open the free tools', 'Abrir las herramientas gratuitas')}
          />
          <ActionLink
            href={REPO_URL}
            newTab
            label={t(
              'Read the source, including the catalog',
              'Ver el código fuente, catálogo incluido',
            )}
          />
        </div>
      </Section>
    </Page>
  );
}
