/**
 * The catalog review queue.
 *
 * `recommend()` in `@meridian/pathways` refuses to rank a pathway that is not
 * `counsel_reviewed`. Every record in the shipped catalog is `unreviewed`. So
 * today the engine ranks nothing at all, and this queue is the only thing that
 * changes that — which makes it the narrowest point between a working rules
 * engine and a product that can advise anybody.
 *
 * The queue is ordered by how much live work rests on each record, not by how
 * ready each record looks. Sorting by readiness would put the easy ones on top
 * and bury the record that eight files depend on, which is the opposite of what
 * a bottleneck queue is for.
 *
 * There is no completeness score anywhere on this page. A number that summarised
 * "how reviewed" a record is would be exactly the kind of figure a reviewer
 * starts trusting instead of reading the rule.
 *
 * The Spanish half of this page is written to be exactly as unflattering as the
 * English. *Sin revisar* means nobody has read it, not that somebody is about
 * to; see the note on `REVIEW_STATUS_LABEL` in `lib/labels.ts`.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { instrumentLang } from '@meridian/i18n';
import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';
import { AS_OF_PARAM, resolveAsOf } from '@/lib/clock';
import { orderQueue, queueTotals, reverificationQueue, reviewQueue } from '@/lib/catalog-review';
import {
  COUNTS,
  UI,
  countOf,
  fill,
  linker,
  localeAlternates,
  parseLocale,
  pick,
} from '@/lib/i18n';
import { ISSUE_SEVERITY_LABEL } from '@/lib/labels';
import { loadRecords } from '@/lib/records';
import { PageHeader } from '@/components/page';
import { PathwayStatusBadge, ReviewStatusBadge, StalenessBadge } from '@/components/state';
import {
  Badge,
  Callout,
  Count,
  Detail,
  EmptyState,
  Meta,
  Mono,
  Rich,
  Section,
  TableWrap,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

const SELF = '/catalog';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();
  return { title: pick(UI.catalogTitle, locale), alternates: localeAlternates(SELF) };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();

  const query = await searchParams;
  const asOf = resolveAsOf(query[AS_OF_PARAM]);
  const records = loadRecords();
  const link = linker(locale, asOf);

  const { validation, reviews } = reviewQueue(
    MERIDIAN_PATHWAY_CATALOG,
    records.matters,
    asOf.date,
  );
  const ordered = orderQueue(reviews);
  const totals = queueTotals(reviews);
  const reverification = reverificationQueue(reviews);
  const errors = validation.issues.filter((i) => i.severity === 'error');
  const warnings = validation.issues.filter((i) => i.severity === 'warning');

  return (
    <>
      <PageHeader
        path={SELF}
        asOf={asOf}
        locale={locale}
        title={pick(UI.catalogTitle, locale)}
        description={fill(UI.catalogDescription, locale, {
          records: countOf(locale, totals.pathways, COUNTS.record),
          reviewed: totals.reviewed,
        })}
      />

      {totals.reviewed === 0 ? (
        <Callout tone="warn" title={pick(UI.catalogNoneEligibleTitle, locale)}>
          <p>
            <Rich text={fill(UI.catalogNoneEligibleBody, locale, { total: totals.pathways })} />
          </p>
        </Callout>
      ) : null}

      {errors.length > 0 ? (
        <Callout
          tone="danger"
          title={fill(UI.catalogErrorsTitle, locale, {
            errors: countOf(locale, errors.length, COUNTS.integrityError),
          })}
        >
          <p>{pick(UI.catalogErrorsBody, locale)}</p>
        </Callout>
      ) : null}

      <Section
        id="totals"
        title={pick(UI.catalogTotalsTitle, locale)}
        note={pick(UI.catalogTotalsNote, locale)}
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">{pick(UI.colMeasure, locale)}</th>
                <th scope="col" className={numericCell}>
                  {pick(UI.colCount, locale)}
                </th>
                <th scope="col">{pick(UI.colMeaning, locale)}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{pick(UI.catalogRowPathways, locale)}</th>
                <td className={numericCell}>{totals.pathways}</td>
                <td>{pick(UI.catalogRowPathwaysMeaning, locale)}</td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowReviewed, locale)}</th>
                <td className={numericCell}>
                  <Count value={totals.reviewed} />
                </td>
                <td>{pick(UI.catalogRowReviewedMeaning, locale)}</td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowUnreviewed, locale)}</th>
                <td className={numericCell}>
                  <Count value={totals.unreviewed} />
                </td>
                <td>{pick(UI.catalogRowUnreviewedMeaning, locale)}</td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowNeedsReverification, locale)}</th>
                <td className={numericCell}>
                  <Count value={totals.needsReverification} />
                </td>
                <td>{pick(UI.catalogRowNeedsReverificationMeaning, locale)}</td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowCitations, locale)}</th>
                <td className={numericCell}>{totals.citations}</td>
                <td>
                  {fill(UI.catalogRowCitationsMeaning, locale, {
                    stale: totals.staleCitations,
                    aging: totals.agingCitations,
                    date: asOf.date,
                  })}
                </td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowDiscretionary, locale)}</th>
                <td className={numericCell}>
                  <Count value={totals.discretionaryCitations} />
                </td>
                <td>{pick(UI.catalogRowDiscretionaryMeaning, locale)}</td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowStaleRecords, locale)}</th>
                <td className={numericCell}>
                  <Count value={totals.withStaleCitations} />
                </td>
                <td>{pick(UI.catalogRowStaleRecordsMeaning, locale)}</td>
              </tr>
              <tr>
                <th scope="row">{pick(UI.catalogRowErrorRecords, locale)}</th>
                <td className={numericCell}>
                  <Count value={totals.withErrors} />
                </td>
                <td>{pick(UI.catalogRowErrorRecordsMeaning, locale)}</td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section
        id="queue"
        title={pick(UI.catalogQueueTitle, locale)}
        count={fill(UI.catalogQueueCount, locale, { count: ordered.length })}
        note={pick(UI.catalogQueueNote, locale)}
      >
        {ordered.length === 0 ? (
          <EmptyState title={pick(UI.catalogEmpty, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colPathway, locale)}</th>
                  <th scope="col">{pick(UI.fieldReview, locale)}</th>
                  <th scope="col">{fill(UI.fieldStatusAsAt, locale, { date: asOf.date })}</th>
                  <th scope="col" className={numericCell}>
                    {pick(UI.colLiveMatters, locale)}
                  </th>
                  <th scope="col">{pick(UI.colCriteria, locale)}</th>
                  <th scope="col">{pick(UI.colProvenance, locale)}</th>
                  <th scope="col">{pick(UI.colLinter, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((review) => (
                  <tr key={review.pathway.id}>
                    <th scope="row">
                      <Link href={link(`/catalog/${review.pathway.id}`)}>
                        <Mono>{review.pathway.id}</Mono>
                      </Link>
                      <Detail>
                        {pick(review.pathway.name, locale)} · v{review.pathway.version} ·{' '}
                        {review.pathway.jurisdiction}
                      </Detail>
                    </th>
                    <td className={nowrapCell}>
                      <ReviewStatusBadge status={review.pathway.reviewStatus} locale={locale} />
                      {review.pathway.reviewedBy === undefined ? null : (
                        <Detail>
                          {review.pathway.reviewedBy} · {review.pathway.reviewedOn}
                        </Detail>
                      )}
                    </td>
                    <td className={nowrapCell}>
                      <PathwayStatusBadge status={review.statusAsOf} locale={locale} />
                      {review.notYetOpen ? (
                        <Detail>{pick(UI.catalogNotYetOpen, locale)}</Detail>
                      ) : null}
                    </td>
                    <td className={numericCell}>
                      <Count value={review.liveMatters.length} />
                    </td>
                    <td className={nowrapCell}>
                      {fill(UI.catalogBlocking, locale, { count: review.counts.blocking })}
                      <Detail>
                        {fill(UI.catalogCriteriaDetail, locale, {
                          material: review.counts.material,
                          informational: review.counts.informational,
                        })}
                      </Detail>
                      {review.escalatingCriterionIds.length > 0 ? (
                        <Detail>
                          {fill(UI.catalogEscalates, locale, {
                            escalating: review.escalatingCriterionIds.length,
                            total: review.pathway.criteria.length,
                          })}
                        </Detail>
                      ) : null}
                    </td>
                    <td className={nowrapCell}>
                      <StalenessBadge
                        band={review.worstBand}
                        ageDays={review.oldestCitationAgeDays}
                        locale={locale}
                      />
                      <Detail>
                        {fill(UI.catalogProvenanceDetail, locale, {
                          cited: review.citations.length,
                          discretionary: review.citations.filter(
                            (c) => c.citation.discretionary === true,
                          ).length,
                        })}
                      </Detail>
                    </td>
                    <td className={nowrapCell}>
                      {review.errorCount > 0 ? (
                        <Badge tone="danger">
                          {fill(UI.catalogErrorsBadge, locale, { count: review.errorCount })}
                        </Badge>
                      ) : review.warningCount > 0 ? (
                        <Badge tone="warn">
                          {fill(UI.catalogWarningsBadge, locale, { count: review.warningCount })}
                        </Badge>
                      ) : (
                        <Badge tone="ok">{pick(UI.catalogClean, locale)}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Section>

      <Section
        id="reverification"
        title={pick(UI.catalogReverificationTitle, locale)}
        count={fill(UI.catalogReverificationCount, locale, {
          due: reverification.length,
          total: totals.citations,
        })}
        note={<Rich text={pick(UI.catalogReverificationNote, locale)} />}
      >
        {reverification.length === 0 ? (
          <EmptyState title={pick(UI.catalogAllFresh, locale)}>
            <p>{fill(UI.catalogNothingDue, locale, { date: asOf.date })}</p>
          </EmptyState>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colCitation, locale)}</th>
                  <th scope="col">{pick(UI.colPathway, locale)}</th>
                  <th scope="col">{pick(UI.colInstrument, locale)}</th>
                  <th scope="col">{pick(UI.colVerified, locale)}</th>
                  <th scope="col">{pick(UI.colBand, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {reverification.map(({ pathwayId, standing }) => (
                  <tr key={`${pathwayId}:${standing.citation.id}`}>
                    <th scope="row" className={monoCell}>
                      {standing.citation.id}
                      {standing.citation.discretionary === true ? (
                        <Detail>
                          <Badge tone="info">{pick(UI.discretionary, locale)}</Badge>
                        </Detail>
                      ) : null}
                    </th>
                    <td className={monoCell}>
                      <Link href={link(`/catalog/${pathwayId}`)}>{pathwayId}</Link>
                    </td>
                    <td>
                      {/* An instrument name is the identity of the source. It is
                          rendered verbatim in the language it was enacted in and
                          marked with that language, whatever the page locale. */}
                      <cite lang={instrumentLang(standing.citation) ?? undefined}>
                        {standing.citation.instrument}
                      </cite>
                      {standing.citation.provision === undefined ? null : (
                        <Detail lang={instrumentLang(standing.citation) ?? undefined}>
                          {standing.citation.provision}
                        </Detail>
                      )}
                    </td>
                    <td className={`${monoCell} ${nowrapCell}`}>{standing.citation.verifiedOn}</td>
                    <td className={nowrapCell}>
                      <StalenessBadge
                        band={standing.band}
                        ageDays={standing.ageDays}
                        locale={locale}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Section>

      <Section
        id="integrity"
        title={pick(UI.catalogLinterTitle, locale)}
        count={fill(UI.catalogLinterCount, locale, {
          errors: errors.length,
          warnings: warnings.length,
        })}
        note={<Rich text={pick(UI.catalogLinterNote, locale)} />}
      >
        {validation.issues.length === 0 ? (
          <EmptyState title={pick(UI.catalogLinterClean, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colSeverity, locale)}</th>
                  <th scope="col">{pick(UI.colCode, locale)}</th>
                  <th scope="col">{pick(UI.colPathway, locale)}</th>
                  <th scope="col">{pick(UI.colMessage, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {validation.issues.map((issue, index) => (
                  <tr key={`${issue.code}-${issue.pathwayId ?? ''}-${issue.citationId ?? ''}-${index}`}>
                    <td className={nowrapCell}>
                      <Badge tone={issue.severity === 'error' ? 'danger' : 'warn'}>
                        {pick(ISSUE_SEVERITY_LABEL[issue.severity], locale)}
                      </Badge>
                    </td>
                    <td className={monoCell}>{issue.code}</td>
                    <td className={monoCell}>
                      {issue.pathwayId === undefined ? (
                        <Meta>—</Meta>
                      ) : (
                        <Link href={link(`/catalog/${issue.pathwayId}`)}>{issue.pathwayId}</Link>
                      )}
                      {issue.criterionId === undefined ? null : (
                        <Detail>{issue.criterionId}</Detail>
                      )}
                    </td>
                    {/* The linter's own message, verbatim: it is the text CI
                        prints, and a reviewer has to be able to match the two. */}
                    <td lang="en">{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Section>
    </>
  );
}
