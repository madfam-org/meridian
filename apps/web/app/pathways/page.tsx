import type { Metadata } from 'next';
import Link from 'next/link';

import { compareDates, staleness } from '@meridian/core';
import { MERIDIAN_PATHWAY_CATALOG, isCounselReviewed, statusOn } from '@meridian/pathways';
import type { Pathway, PathwayCitation } from '@meridian/pathways';

import { bi } from '@/lib/i18n';
import { plural } from '@/lib/ui';
import { AS_OF } from '@/lib/sample/common';
import { pathwayKindLabel, pathwayStatusView, reviewStatusView } from '@/lib/status';
import { Badge, Chip } from '@/components/Badge';
import { T, TInline, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import { Card, Empty, Page, PageHeader, Section, Stack } from '@/components/Layout';

import styles from './pathways.module.css';

export const metadata: Metadata = {
  title: 'Pathways',
};

const JURISDICTIONS = [...new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.jurisdiction))].sort();
const KINDS = [...new Set(MERIDIAN_PATHWAY_CATALOG.map((p) => p.kind))].sort();

/** A query value that may arrive repeated. The first occurrence wins, deterministically. */
function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/**
 * A pathway is only as fresh as its least recently verified source, so the
 * freshness shown on the card is the oldest one rather than an average. Dates
 * are compared through core's comparator rather than with `<`: lexicographic
 * comparison happens to work for `YYYY-MM-DD`, which is exactly what makes it a
 * trap the day something is stored in another shape.
 */
function oldestCitation(pathway: Pathway): PathwayCitation | null {
  return pathway.citations.reduce<PathwayCitation | null>(
    (oldest, next) =>
      oldest === null || compareDates(next.verifiedOn, oldest.verifiedOn) < 0 ? next : oldest,
    null,
  );
}

export default async function PathwaysPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const jurisdiction = single(query['jurisdiction']);
  const kind = single(query['kind']);

  const filtered = MERIDIAN_PATHWAY_CATALOG.filter(
    (p) =>
      (jurisdiction === '' || p.jurisdiction === jurisdiction) && (kind === '' || p.kind === kind),
  );

  const reviewedCount = MERIDIAN_PATHWAY_CATALOG.filter(isCounselReviewed).length;

  return (
    <Page>
      <PageHeader
        title={bi('The rule catalog', 'El catálogo de normas')}
        lead={bi(
          'Every route Meridian encodes, with its criteria, its sources and the date a human last checked each one. The review status on each record is shown exactly as it stands — an unreviewed route is labelled unreviewed.',
          'Todas las vías que codifica Meridian, con sus criterios, sus fuentes y la fecha en que una persona comprobó cada una por última vez. El estado de revisión de cada registro se muestra tal cual es: una vía sin revisar se etiqueta como sin revisar.',
        )}
      />

      <Callout
        tone={reviewedCount === 0 ? 'warn' : 'ok'}
        icon={reviewedCount === 0 ? '!' : '✓'}
        title={bi(
          `${reviewedCount} of ${MERIDIAN_PATHWAY_CATALOG.length} routes have been reviewed by counsel`,
          `${reviewedCount} de ${MERIDIAN_PATHWAY_CATALOG.length} vías han sido revisadas por letrado`,
        )}
      >
        <TProse
          text={bi(
            'An unreviewed route may be shown as a restatement of the sources it cites, and your own figures may be measured against it. It may never appear in a recommendation, because recommending a route no licensed person has read is exactly the risk the disclosure system exists to contain.',
            'Una vía sin revisar puede mostrarse como exposición de las fuentes que cita, y sus propias cifras pueden medirse frente a ella. Nunca puede aparecer en una recomendación, porque recomendar una vía que ninguna persona con licencia ha leído es precisamente el riesgo que el sistema de divulgación existe para contener.',
          )}
        />
      </Callout>

      <Section
        id="filter"
        title={bi('Narrow the list', 'Acotar la lista')}
        description={bi(
          'Filtering runs on the server with a plain form, so the result is a real address you can share or bookmark.',
          'El filtrado se ejecuta en el servidor con un formulario simple, de modo que el resultado es una dirección real que puede compartir o guardar.',
        )}
      >
        <Card tone="sunken">
          <form method="get" action="/pathways" className={styles.filterForm}>
            <div className={styles.field}>
              <label htmlFor="jurisdiction-select" className={styles.label}>
                <T text={bi('Jurisdiction', 'Jurisdicción')} />
              </label>
              <select
                id="jurisdiction-select"
                name="jurisdiction"
                defaultValue={jurisdiction}
                className={styles.select}
              >
                <option value="">All jurisdictions / Todas</option>
                {JURISDICTIONS.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="kind-select" className={styles.label}>
                <T text={bi('Kind of route', 'Tipo de vía')} />
              </label>
              <select id="kind-select" name="kind" defaultValue={kind} className={styles.select}>
                <option value="">All kinds / Todos</option>
                {KINDS.map((value) => (
                  <option key={value} value={value}>
                    {pathwayKindLabel(value).en}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submit}>
                <T text={bi('Apply', 'Aplicar')} />
              </button>
              <Link href="/pathways" className={styles.reset}>
                <T text={bi('Clear', 'Limpiar')} />
              </Link>
            </div>
          </form>
        </Card>
      </Section>

      <Section
        id="catalog"
        title={bi('Routes', 'Vías')}
        description={bi(
          `Showing ${plural(filtered.length, 'route', 'routes')} of ${MERIDIAN_PATHWAY_CATALOG.length}, in catalog order. The order does not change with anybody's facts — an order that did would be a ranking.`,
          `Se muestran ${filtered.length} de ${MERIDIAN_PATHWAY_CATALOG.length} vías, en el orden del catálogo. El orden no cambia con los datos de nadie: un orden que cambiara sería una clasificación.`,
        )}
      >
        {filtered.length === 0 ? (
          <Empty
            text={bi(
              'No route in the catalog matches that combination.',
              'Ninguna vía del catálogo coincide con esa combinación.',
            )}
          />
        ) : (
          <Stack gap="md">
            {filtered.map((pathway) => {
              const status = pathwayStatusView(statusOn(pathway, AS_OF));
              const review = reviewStatusView(pathway.reviewStatus);
              const discretionary = pathway.citations.filter((c) => c.discretionary === true).length;
              const oldest = oldestCitation(pathway);
              const band = oldest === null ? null : staleness(oldest, AS_OF);

              return (
                <article key={pathway.id} className={styles.pathway}>
                  <div className={styles.pathwayHead}>
                    <h3 className={styles.pathwayTitle}>
                      <Link href={`/pathways/${pathway.id}`}>
                        <T text={pathway.name} />
                      </Link>
                    </h3>
                    <div className={styles.pathwayBadges}>
                      <Chip>{pathway.jurisdiction}</Chip>
                      <Chip>{pathwayKindLabel(pathway.kind).en}</Chip>
                      <Badge tone={status.tone} label={status.label} />
                      <Badge tone={review.tone} label={review.label} />
                    </div>
                  </div>

                  <TProse text={pathway.summary} className={styles.pathwaySummary} />

                  <ul className={styles.pathwayStats}>
                    <li>
                      <TInline text={bi('Criteria', 'Criterios')} />
                      {': '}
                      <strong>{pathway.criteria.length}</strong>
                    </li>
                    <li>
                      <TInline text={bi('Sources', 'Fuentes')} />
                      {': '}
                      <strong>{pathway.citations.length}</strong>
                    </li>
                    <li>
                      <TInline text={bi('Practice-based sources', 'Fuentes de práctica administrativa')} />
                      {': '}
                      <strong>{discretionary}</strong>
                    </li>
                    {oldest !== null && band !== null ? (
                      <li>
                        <TInline text={bi('Oldest verification', 'Verificación más antigua')} />
                        {': '}
                        <time dateTime={oldest.verifiedOn} className={styles.date}>
                          {oldest.verifiedOn}
                        </time>{' '}
                        <span className={styles.band}>({band})</span>
                      </li>
                    ) : null}
                  </ul>

                  {pathway.closedOn !== undefined && pathway.closureNote !== undefined ? (
                    <div className={styles.closure}>
                      <strong>
                        <TInline text={bi('Closed to new applications', 'Cerrada a nuevas solicitudes')} />
                        {' — '}
                        <time dateTime={pathway.closedOn}>{pathway.closedOn}</time>
                      </strong>
                      <TProse text={pathway.closureNote} />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </Stack>
        )}
      </Section>

      <Section
        id="catalog-disclosure"
        title={bi('What this catalog is', 'Qué es este catálogo')}
      >
        <DisclosureNotice
          shown="information"
          withheld={[
            bi(
              'Any ordering of these routes from best to worst. This page lists what the rules are; it does not measure them against anybody.',
              'Cualquier ordenación de estas vías de mejor a peor. Esta página expone cuáles son las normas; no las mide frente a nadie.',
            ),
          ]}
        />
      </Section>
    </Page>
  );
}
