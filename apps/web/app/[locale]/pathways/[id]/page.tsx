import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  MERIDIAN_PATHWAY_CATALOG,
  evaluate,
  notYetOpenOn,
  pathwayById,
  statusOn,
} from '@meridian/pathways';
import type { Criterion, EligibilityReport, Evidence, ReportNote } from '@meridian/pathways';

import type { Locale } from '@/lib/i18n';
import { bi, localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { plural } from '@/lib/ui';
import { AS_OF } from '@/lib/sample/common';
import { SAMPLE_MATTERS } from '@/lib/sample/matters';
import { resolveCitations } from '@/lib/citations';
import {
  criterionKindLabel,
  criterionStatusView,
  criterionWeightView,
  pathwayKindLabel,
  pathwayStatusView,
  reviewStatusView,
  verdictView,
} from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { CitationList, CitationRefs, UnresolvedCitation } from '@/components/Citations';
import { CoverageBoundary } from '@/components/CoverageBoundary';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import {
  Card,
  CivilDate,
  Empty,
  Facts,
  Fact,
  Page,
  PageHeader,
  Section,
  Stack,
} from '@/components/Layout';

import styles from './pathway.module.css';

interface PathwayParams extends LocaleParams {
  readonly id: string;
}

export function generateStaticParams(): { id: string }[] {
  return MERIDIAN_PATHWAY_CATALOG.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<PathwayParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  const { id } = await params;
  const t = translator(locale);
  const pathway = pathwayById(id);
  return {
    title: pathway === null ? t('Pathway', 'Vía') : t(pathway.name),
    alternates: alternatesFor(pathway === null ? '/pathways' : `/pathways/${pathway.id}`, locale),
  };
}

/** Render a value the evaluator actually observed, without pretending it is prose. */
function showObserved(value: unknown): string {
  if (value === undefined) return 'not recorded';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} item(s)]`;
  return JSON.stringify(value);
}

function EvidenceList({ evidence }: { readonly evidence: readonly Evidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <ul className={styles.evidence}>
      {evidence.map((item) => (
        <li key={item.path}>
          <code className={styles.evidencePath}>{item.path}</code>
          <span aria-hidden="true" className={styles.evidenceArrow}>
            →
          </span>
          <span className={styles.evidenceValue}>{showObserved(item.observed)}</span>
        </li>
      ))}
    </ul>
  );
}

const NOTE_TITLE: Record<ReportNote['code'], ReturnType<typeof bi>> = {
  discretionary_source: bi(
    'This result depends on administrative practice',
    'Este resultado depende de práctica administrativa',
  ),
  pathway_closed: bi('This route is closed', 'Esta vía está cerrada'),
  pathway_not_yet_open: bi('This route had not opened', 'Esta vía aún no estaba abierta'),
  unreviewed_rule: bi(
    'These rules have not been signed off by a licensed person',
    'Estas normas no han sido validadas por una persona con licencia',
  ),
};

function CriterionRow({
  criterion,
  report,
  locale,
}: {
  readonly criterion: Criterion;
  readonly report: EligibilityReport | null;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  const result = report?.criteria.find((r) => r.criterionId === criterion.id) ?? null;
  const weight = criterionWeightView(criterion.weight);

  return (
    <li className={styles.criterion}>
      <div className={styles.criterionHead}>
        <h3 className={styles.criterionTitle}>{t(criterion.label)}</h3>
        <div className={styles.criterionBadges}>
          <Chip>{t(criterionKindLabel(criterion.kind))}</Chip>
          <Badge tone={weight.tone} label={t(weight.label)} />
          {result !== null ? (
            <Badge
              tone={criterionStatusView(result.status).tone}
              label={t(criterionStatusView(result.status).label)}
            />
          ) : (
            <Badge tone="neutral" label={t('Not evaluated', 'No evaluado')} />
          )}
        </div>
      </div>

      <p className={styles.criterionMeta}>
        <code className={styles.criterionId}>{criterion.id}</code>
        <CitationRefs ids={criterion.citationIds} />
      </p>

      {criterion.guidance !== undefined ? (
        <p className={styles.guidance}>{t(criterion.guidance)}</p>
      ) : null}

      {result !== null ? (
        <div className={styles.result}>
          <h4 className={styles.resultTitle}>
            {t('What the engine compared', 'Qué comparó el motor')}
          </h4>
          <p className={styles.resultDetail} lang="en">
            {result.detail}
          </p>
          <EvidenceList evidence={result.evidence} />
          {result.humanReviewReason !== undefined ? (
            <p className={styles.reviewReason} lang="en">
              {result.humanReviewReason}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default async function PathwayPage({ params }: { readonly params: Promise<PathwayParams> }) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const { id } = await params;
  const pathway = pathwayById(id);
  if (pathway === null) notFound();

  const status = statusOn(pathway, AS_OF);
  const statusView = pathwayStatusView(status);
  const review = reviewStatusView(pathway.reviewStatus);

  // The assessment is run against whichever worked example concerns this
  // jurisdiction. There is no user account behind this page, and inventing a
  // second applicant to make a route look decidable would be exactly the kind
  // of flattering fiction the rest of the product refuses.
  const sample =
    SAMPLE_MATTERS.find((m) => m.matter.targetJurisdiction === pathway.jurisdiction) ?? null;
  const report = sample === null ? null : evaluate(pathway, sample.facts, AS_OF);

  const resolved = resolveCitations(
    pathway.citations.map((c) => c.id),
    pathway,
  );
  const criterionCitationIds = [...new Set(pathway.criteria.flatMap((c) => c.citationIds))];
  const unresolved = criterionCitationIds.filter(
    (cid) => !resolved.found.some((c) => c.id === cid),
  );

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Chip>{pathway.jurisdiction}</Chip>
            <Chip>{t(pathwayKindLabel(pathway.kind))}</Chip>
            <code className={styles.version}>v{pathway.version}</code>
          </>
        }
        title={t(pathway.name)}
        lead={t(pathway.summary)}
        aside={
          <>
            <Badge tone={statusView.tone} label={t(statusView.label)} />
            <Badge tone={review.tone} label={t(review.label)} />
          </>
        }
      />

      {pathway.reviewStatus !== 'counsel_reviewed' ? (
        <Callout
          tone="warn"
          icon="!"
          title={t(
            'No licensed person has signed off on these rules',
            'Ninguna persona con licencia ha validado estas normas',
          )}
        >
          <p>
            {t(
              'What follows is a restatement of the sources cited at the bottom of this page, and an arithmetic comparison against a worked example. It is not a determination, and it may not be built into a recommendation about what anybody should do.',
              'Lo que sigue es una exposición de las fuentes citadas al final de esta página y una comparación aritmética frente a un ejemplo resuelto. No es una resolución, y no puede convertirse en una recomendación sobre lo que nadie deba hacer.',
            )}
          </p>
        </Callout>
      ) : null}

      {status === 'closed' && pathway.closureNote !== undefined ? (
        <Callout
          tone="bad"
          icon="✕"
          title={t('Closed to new applications', 'Cerrada a nuevas solicitudes')}
        >
          <p className={styles.closureDate}>
            {t('Closed from', 'Cerrada desde el')}{' '}
            {pathway.closedOn !== undefined ? <CivilDate value={pathway.closedOn} /> : null}
          </p>
          <p>{t(pathway.closureNote)}</p>
          <p>
            {t(
              'The record stays in the catalog on purpose. People hold status under closed routes for years afterwards, and a renewal question is a live question — this page can still answer what the route required on a date before the repeal.',
              'El registro permanece en el catálogo a propósito. Hay personas que mantienen su situación al amparo de vías cerradas durante años, y una renovación es una cuestión viva: esta página puede seguir respondiendo qué exigía la vía en una fecha anterior a la derogación.',
            )}
          </p>
        </Callout>
      ) : null}

      {notYetOpenOn(pathway, AS_OF) ? (
        <Callout
          tone="info"
          icon="i"
          title={t(
            'Not yet open on the evaluation date',
            'Aún no abierta en la fecha de evaluación',
          )}
        >
          <p>
            {t(
              'This route began accepting applications after the date these pages are computed as at.',
              'Esta vía comenzó a admitir solicitudes después de la fecha a la que se calculan estas páginas.',
            )}
          </p>
        </Callout>
      ) : null}

      <Section
        id="facts"
        title={t('The record', 'El registro')}
        description={t(
          'How this route is described in the catalog. Durations are recorded only where the instrument states them; nothing here is an estimate.',
          'Cómo se describe esta vía en el catálogo. Las duraciones solo se registran cuando la norma las establece; nada de esto es una estimación.',
        )}
      >
        <Card tone="sunken">
          <Facts>
            <Fact label={t('Catalog id', 'Identificador del catálogo')}>
              <code className={styles.inlineCode}>{pathway.id}</code>
            </Fact>
            <Fact label={t('Rule version', 'Versión de la norma')}>
              <code className={styles.inlineCode}>{pathway.version}</code>
            </Fact>
            <Fact label={t('First grant', 'Primera concesión')}>
              {pathway.durations.initialGrantMonths === undefined ? (
                <span className={styles.muted}>{t('Not recorded', 'No consta')}</span>
              ) : (
                t(
                  plural(pathway.durations.initialGrantMonths, 'month', 'months'),
                  plural(pathway.durations.initialGrantMonths, 'mes', 'meses'),
                )
              )}
            </Fact>
            <Fact label={t('Renewal', 'Renovación')}>
              {pathway.durations.renewalMonths === undefined ? (
                <span className={styles.muted}>{t('Not recorded', 'No consta')}</span>
              ) : (
                t(
                  plural(pathway.durations.renewalMonths, 'month', 'months'),
                  plural(pathway.durations.renewalMonths, 'mes', 'meses'),
                )
              )}
            </Fact>
            <Fact label={t('Counts toward naturalisation', 'Computa para la nacionalidad')}>
              {pathway.durations.countsTowardNaturalisation === undefined ? (
                <span className={styles.muted}>{t('Not recorded', 'No consta')}</span>
              ) : (
                <Badge
                  tone={pathway.durations.countsTowardNaturalisation ? 'ok' : 'neutral'}
                  label={t(
                    pathway.durations.countsTowardNaturalisation ? bi('Yes', 'Sí') : bi('No', 'No'),
                  )}
                />
              )}
            </Fact>
            <Fact label={t('Published processing time', 'Plazo de tramitación publicado')}>
              {pathway.durations.publishedProcessingDays === undefined ? (
                <span className={styles.muted}>
                  {t(
                    'Not published by the authority, so not stated here',
                    'No publicado por la administración, por lo que no se indica aquí',
                  )}
                </span>
              ) : (
                <span className={styles.inlineCode}>
                  {pathway.durations.publishedProcessingDays.min}–
                  {pathway.durations.publishedProcessingDays.max} days
                </span>
              )}
            </Fact>
          </Facts>

          {pathway.durations.note !== undefined ? (
            <p className={styles.durationNote}>{t(pathway.durations.note)}</p>
          ) : null}

          {pathway.leadsTo.length > 0 ? (
            <div>
              <h3 className={styles.subheading}>{t('Leads to', 'Conduce a')}</h3>
              <ul className={styles.leadsTo}>
                {pathway.leadsTo.map((target) => {
                  const next = pathwayById(target);
                  return (
                    <li key={target}>
                      {next === null ? (
                        <code className={styles.inlineCode}>{target}</code>
                      ) : (
                        <Link href={localizedPath(`/pathways/${next.id}`, locale)}>
                          {t(next.name)}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </Card>
      </Section>

      <Section
        id="assessment"
        title={t('Assessment against a worked example', 'Evaluación frente a un ejemplo resuelto')}
        description={t(
          sample === null
            ? bi(
                'No worked example in this build concerns this jurisdiction, so the criteria below are shown without a result.',
                'Ningún ejemplo resuelto de esta compilación afecta a esta jurisdicción, por lo que los criterios siguientes se muestran sin resultado.',
              )
            : bi(
                `Run against the invented facts of ${sample.name.en}. The verdict states whether the encoded criteria are met, which is not the same as saying an application would be granted — no authority is bound by this engine.`,
                `Ejecutada sobre los datos inventados de ${sample.name.es}. El resultado indica si se cumplen los criterios codificados, lo cual no equivale a afirmar que una solicitud sería concedida: ninguna autoridad queda vinculada por este motor.`,
              ),
        )}
      >
        {report === null ? (
          <Empty
            text={t(
              'Nothing to measure. This page still lists every criterion and every source.',
              'Nada que medir. Esta página sigue enumerando todos los criterios y todas las fuentes.',
            )}
          />
        ) : (
          <Stack gap="md">
            <Card>
              <div className={styles.verdictHead}>
                <Badge
                  tone={verdictView(report.verdict).tone}
                  label={t(verdictView(report.verdict).label)}
                />
                <span className={styles.verdictMeta}>
                  {t('Evaluated as at', 'Evaluado a fecha de')} <CivilDate value={report.asOf} />
                </span>
              </div>
              <Facts>
                <Fact label={t('Criteria', 'Criterios')}>{report.criteria.length}</Fact>
                <Fact label={t('Blocking and unmet', 'Bloqueantes no cumplidos')}>
                  {report.blockingFailures.length}
                </Fact>
                <Fact label={t('Not recorded', 'Sin datos')}>{report.unknowns.length}</Fact>
                <Fact label={t('Needs a person', 'Requiere revisión humana')}>
                  {report.humanReviewCriterionIds.length}
                </Fact>
              </Facts>
              <p className={styles.verdictNote}>
                {t(
                  'A missing fact produces "not recorded", never "unmet". An engine that read absence as failure would tell someone half-way through onboarding that they are ineligible for a route they qualify for, and people act on that.',
                  'Un dato ausente produce «sin datos», nunca «no cumplido». Un motor que leyera la ausencia como incumplimiento diría a quien está a mitad de registrar sus datos que no reúne los requisitos de una vía a la que sí accede, y la gente actúa en consecuencia.',
                )}
              </p>
            </Card>

            {report.notes.length > 0 ? (
              <Stack gap="sm">
                {report.notes.map((note) => (
                  <Callout
                    // Same identity the engine deduplicates on —
                    // `criterionId:citationId` — never the array index. One
                    // discretionary instrument can be cited by several criteria
                    // and must say so at each; an index key survives only until
                    // the list is filtered, and then re-attaches a legal
                    // qualification to a different rule.
                    key={`${note.code}:${note.criterionId ?? '-'}:${note.citationId ?? '-'}`}
                    tone={note.code === 'pathway_closed' ? 'bad' : 'warn'}
                    icon="!"
                    title={t(NOTE_TITLE[note.code])}
                  >
                    <p lang="en" className={styles.noteText}>
                      {note.text}
                    </p>
                    {note.citationId !== undefined ? (
                      <CitationRefs ids={[note.citationId]} />
                    ) : null}
                  </Callout>
                ))}
              </Stack>
            ) : null}
          </Stack>
        )}
      </Section>

      {/*
        Directly under the verdict, scoped to this record's own jurisdiction.

        A reader who has just seen a route report "not met" against the worked
        example — or who has just read that this route is closed — is at the
        point of deciding there is nothing here for them. Naming the routes this
        catalog leaves out of the same country is the only thing on the page that
        can correct that, and listing the other jurisdiction's omissions here
        would bury it in material that does not apply.
      */}
      <CoverageBoundary locale={locale} jurisdictions={[pathway.jurisdiction]} />

      <Section
        id="criteria"
        title={t('Criteria', 'Criterios')}
        description={t(
          'A blocking criterion decides the answer. A material one can hold back a yes but can never produce a no, because "probably refused" is a prediction and predictions are advice.',
          'Un criterio bloqueante decide la respuesta. Uno relevante puede impedir un sí, pero nunca puede producir un no, porque «probablemente denegado» es una predicción y las predicciones son asesoramiento.',
        )}
      >
        <ol className={styles.criteriaList}>
          {pathway.criteria.map((criterion) => (
            <CriterionRow
              locale={locale}
              key={criterion.id}
              criterion={criterion}
              report={report}
            />
          ))}
        </ol>
      </Section>

      <Section id="pathway-disclosure" title={t('What this page is', 'Qué es esta página')}>
        <DisclosureNotice
          locale={locale}
          shown={report === null ? 'information' : 'assessment'}
          withheld={[
            bi(
              'Any statement that this route is the right one, or that it is better or worse than another in the catalog.',
              'Cualquier afirmación de que esta vía sea la correcta, o de que sea mejor o peor que otra del catálogo.',
            ),
            bi(
              'Any estimate of the chance an application under it would succeed.',
              'Cualquier estimación de la probabilidad de éxito de una solicitud por esta vía.',
            ),
          ]}
        />
      </Section>

      <Section
        id="pathway-sources"
        title={t('Sources', 'Fuentes')}
        description={t(
          'Every instrument this route rests on, with the date a human last read it. A source marked as administrative practice is not a statutory threshold, and the criteria that depend on it say so.',
          'Todos los instrumentos en los que se apoya esta vía, con la fecha en que una persona los leyó por última vez. Una fuente marcada como práctica administrativa no es un umbral legal, y los criterios que dependen de ella lo indican.',
        )}
      >
        <CitationList locale={locale} citations={resolved.found} asOf={AS_OF} />
        {unresolved.length > 0 ? (
          <ol className={styles.unresolvedList}>
            {unresolved.map((cid) => (
              <UnresolvedCitation locale={locale} key={cid} id={cid} />
            ))}
          </ol>
        ) : null}
      </Section>
    </Page>
  );
}
