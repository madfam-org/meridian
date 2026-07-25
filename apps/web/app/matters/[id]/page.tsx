import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MERIDIAN_PATHWAY_CATALOG, pathwayById } from '@meridian/pathways';

import { bi } from '@/lib/i18n';
import { plural } from '@/lib/ui';
import { AS_OF } from '@/lib/sample/common';
import { sampleMatterById } from '@/lib/sample/matters';
import { buildMatterView } from '@/lib/matter-view';
import { resolveCitations } from '@/lib/citations';
import {
  REMEDY_FOR_RECOMMENDATION,
  RETAINED_AFTER_DOWNGRADE,
  WITHHELD_FROM_RECOMMENDATION,
  releaseRecommendationFor,
} from '@/lib/disclosure-view';
import { pathwayKindLabel, reviewStatusView, verdictView } from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { T, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { CitationList } from '@/components/Citations';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import { Card, Empty, Grid, Section, Stack } from '@/components/Layout';
import { PhaseTimeline } from '@/components/PhaseTimeline';
import { TaskList } from '@/components/TaskList';

import styles from './matter.module.css';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sample = sampleMatterById(id);
  return { title: sample === null ? 'Matter' : sample.name.en };
}

/**
 * The matter overview.
 *
 * Three things it is careful about:
 *
 * The representation statement is not a footnote. An applicant with nobody
 * accountable for advice needs to understand that before they read anything
 * else, so it is the first section and it carries the release gate's own
 * verdict rather than a paraphrase.
 *
 * The assessed routes are listed in **catalog order**, and the page says so.
 * Sorting them by how good the answer is would be a ranking, and a ranking is
 * advice — the same act the gate above just withheld.
 *
 * Every locked task names what is holding it.
 */
export default async function MatterPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id } = await params;
  const sample = sampleMatterById(id);
  if (sample === null) notFound();

  const view = buildMatterView(sample.tasks, sample.matter.phase);
  const pathway = pathwayById(sample.matter.pathwayId);
  const release = releaseRecommendationFor(sample, MERIDIAN_PATHWAY_CATALOG, AS_OF);

  const taskCitationIds = sample.tasks.flatMap((t) => t.task.citationIds);
  const resolved = resolveCitations(taskCitationIds, pathway);

  // The union is discriminated, so on the withheld branch there is no way to
  // reach the ranking at all — it is not merely hidden, it is not in scope.
  const withheld = !release.released.allowed;
  const reason =
    !release.released.allowed && !release.released.decision.allowed
      ? release.released.decision.reason
      : undefined;
  const assessments = release.released.allowed
    ? release.released.value.value.assessments
    : release.released.value.value.assessments;

  return (
    <>
      <Section
        id="representation"
        title={bi('Who is accountable', 'Quién responde')}
        description={bi(
          'Whether anybody licensed is answerable for advice on this matter, and what follows from the answer.',
          'Si hay alguien con licencia que responda del asesoramiento en este expediente, y qué se deriva de ello.',
        )}
      >
        <Stack gap="md">
          {sample.matter.representativeId === null ? (
            <Callout
              tone="review"
              icon="§"
              title={bi(
                'No authorised representative is assigned to this matter',
                'No hay representante autorizado asignado a este expediente',
              )}
            >
              <TProse
                text={bi(
                  'Nobody licensed is currently answerable for advice on this file. That does not limit what you can see about your own record: your day counts, the criteria you meet, the documents you need and the source behind every rule are all here. What it removes is anyone telling you which route to take.',
                  'Actualmente no hay nadie con licencia que responda del asesoramiento en este expediente. Eso no limita lo que puede ver sobre su propio registro: su cómputo de días, los criterios que cumple, los documentos que necesita y la fuente de cada norma están todos aquí. Lo que se suprime es que alguien le indique qué vía seguir.',
                )}
              />
              <TProse
                text={bi(
                  'This portal has no way to attach a representative yet. When it does, the release gate below will open on its own — it is a function call, not a setting.',
                  'Este portal todavía no permite vincular un representante. Cuando lo permita, el control de divulgación se abrirá por sí solo: es una llamada a una función, no una preferencia.',
                )}
              />
            </Callout>
          ) : (
            <Callout
              tone="ok"
              icon="§"
              title={bi('A representative is assigned', 'Hay un representante asignado')}
            >
              <TProse
                text={bi(
                  'A licensed professional is accountable for advice on this matter.',
                  'Un profesional con licencia responde del asesoramiento en este expediente.',
                )}
              />
            </Callout>
          )}

          <DisclosureNotice
            shown={release.released.value.classification}
            requested={withheld ? 'advice' : undefined}
            reason={reason}
            withheld={withheld ? WITHHELD_FROM_RECOMMENDATION : undefined}
            remedy={withheld ? REMEDY_FOR_RECOMMENDATION : undefined}
          />

          {withheld ? (
            <Card tone="sunken">
              <h3 className={styles.subheading}>
                <T text={bi('What you keep', 'Qué conserva')} />
              </h3>
              <ul className={styles.plainList}>
                {RETAINED_AFTER_DOWNGRADE.map((item) => (
                  <li key={item.en}>
                    <T text={item} />
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                <T
                  text={bi(
                    `A second gate applies independently of representation: ${release.counselReviewedCount} of ${plural(release.catalogSize, 'route', 'routes')} for this jurisdiction has rules a licensed person has signed off on. A route nobody qualified has read never enters a recommendation, however good the arithmetic looks.`,
                    `Se aplica además un segundo control con independencia de la representación: ${release.counselReviewedCount} de ${release.catalogSize} vías de esta jurisdicción tienen normas validadas por una persona con licencia. Una vía que nadie cualificado haya leído nunca entra en una recomendación, por buena que parezca la aritmética.`,
                  )}
                />
              </p>
            </Card>
          ) : null}
        </Stack>
      </Section>

      <Section
        id="route"
        title={bi('The route being pursued', 'La vía que se sigue')}
        description={bi(
          'The pathway this matter was opened under, and every other route in the catalog for this jurisdiction assessed against the same facts.',
          'La vía por la que se abrió este expediente, y todas las demás vías del catálogo para esta jurisdicción evaluadas con los mismos datos.',
        )}
      >
        {pathway === null ? (
          <Empty
            text={bi(
              'This matter names a pathway that is not in the catalog. That is a defect, not an empty state.',
              'Este expediente indica una vía que no está en el catálogo. Es un defecto, no un estado vacío.',
            )}
          />
        ) : (
          <Card>
            <div className={styles.routeHead}>
              <h3 className={styles.subheading}>
                <Link href={`/pathways/${pathway.id}`}>
                  <T text={pathway.name} />
                </Link>
              </h3>
              <div className={styles.routeBadges}>
                <Chip>
                  <span lang="en">{pathwayKindLabel(pathway.kind).en}</span>
                </Chip>
                <Badge {...reviewStatusView(pathway.reviewStatus)} />
              </div>
            </div>
            <TProse text={pathway.summary} />
          </Card>
        )}

        <p className={styles.orderNote}>
          <span aria-hidden="true">↓ </span>
          <T
            text={bi(
              'Listed in catalog order, not best-first. Ordering these by how good the answer is would be a ranking, and a ranking is the regulated act the gate above withheld.',
              'Se enumeran en el orden del catálogo, no de mejor a peor. Ordenarlas según lo favorable del resultado sería una clasificación, y una clasificación es el acto reservado que el control anterior ha retenido.',
            )}
          />
        </p>

        <Grid>
          {assessments.map((report) => {
            const verdict = verdictView(report.verdict);
            const target = pathwayById(report.pathwayId);
            return (
              <Card key={report.pathwayId}>
                <h4 className={styles.assessmentTitle}>
                  <Link href={`/pathways/${report.pathwayId}`}>
                    {target === null ? report.pathwayId : <T text={target.name} />}
                  </Link>
                </h4>
                <div className={styles.assessmentBadges}>
                  <Badge tone={verdict.tone} label={verdict.label} />
                </div>
                <p className={styles.assessmentMeta}>
                  {report.criteria.length} criteria · {report.blockingFailures.length} blocking
                  unmet · {report.unknowns.length} not recorded
                </p>
              </Card>
            );
          })}
        </Grid>
      </Section>

      <Section
        id="phases"
        title={bi('Where the matter stands', 'En qué punto está el expediente')}
        description={bi(
          'Six stages, in order. A stage does not open until the one before it is done, which is what keeps a document being obtained before the thing that depends on it.',
          'Seis fases, en orden. Una fase no se abre hasta que se completa la anterior, que es lo que hace que un documento se obtenga antes que aquello que depende de él.',
        )}
      >
        <PhaseTimeline phases={view.phases} />
      </Section>

      <Section
        id="tasks"
        title={bi('Tasks', 'Tareas')}
        description={bi(
          `${view.completedCount} of ${view.tasks.length} complete. ${plural(view.openTasks.length, 'task is', 'tasks are')} open, and ${plural(view.lockedTasks.length, 'is', 'are')} locked — each locked task says exactly what is holding it.`,
          `${view.completedCount} de ${view.tasks.length} completadas. Hay ${view.openTasks.length} tareas abiertas y ${view.lockedTasks.length} bloqueadas; cada tarea bloqueada indica exactamente qué la retiene.`,
        )}
      >
        <TaskList
          tasks={view.tasks}
          hasRepresentative={sample.matter.representativeId !== null}
          citations={resolved.found}
        />
      </Section>

      <Section
        id="sources"
        title={bi('Sources behind these tasks', 'Fuentes de estas tareas')}
        description={bi(
          'Not every task rests on a specific provision. Meridian encodes the routing and eligibility rules with a source; the shape of an office’s own checklist is set by that office, and where nothing is cited the task simply carries no source rather than a borrowed one.',
          'No toda tarea se apoya en un precepto concreto. Meridian codifica con fuente las reglas de enrutado y elegibilidad; la forma de la lista de una oficina la fija esa oficina, y cuando no hay nada que citar la tarea sencillamente no lleva fuente en lugar de llevar una prestada.',
        )}
      >
        <CitationList citations={resolved.found} asOf={AS_OF} />
      </Section>
    </>
  );
}
