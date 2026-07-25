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
 */

import Link from 'next/link';
import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';
import { AS_OF_PARAM, resolveAsOf, withAsOf } from '@/lib/clock';
import {
  orderQueue,
  queueTotals,
  reverificationQueue,
  reviewQueue,
} from '@/lib/catalog-review';
import { countOf, humanise } from '@/lib/format';
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
  Section,
  TableWrap,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Catalog review' };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asOf = resolveAsOf(params[AS_OF_PARAM]);
  const records = loadRecords();
  const link = (href: string): string => withAsOf(href, asOf);

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
        path="/catalog"
        asOf={asOf}
        title="Catalog review"
        description={
          <>
            {countOf(totals.pathways, 'record', 'records')} in the shipped catalog,{' '}
            {totals.reviewed} signed off. An unreviewed record can still produce an assessment — the
            applicant&rsquo;s own figures measured against the cited rule — but it can never enter a
            recommendation, whatever the engine computes.
          </>
        }
      />

      {totals.reviewed === 0 ? (
        <Callout tone="warn" title="Nothing in this catalog is eligible to be recommended">
          <p>
            All {totals.pathways} records are <Mono>unreviewed</Mono>, so{' '}
            <Mono>recommend()</Mono> returns an empty ranking and every output the engine produces
            for an applicant is capped at assessment. That is the correct live state of the
            platform, not a defect to route around.
          </p>
        </Callout>
      ) : null}

      {errors.length > 0 ? (
        <Callout
          tone="danger"
          title={`${countOf(errors.length, 'integrity error', 'integrity errors')} across the catalog`}
        >
          <p>
            These fail the same check CI runs. A record carrying one cannot be signed off — the
            linter refuses it, not this console.
          </p>
        </Callout>
      ) : null}

      <Section
        id="totals"
        title="Where the catalog stands"
        note="Counted from the records at render time. Citation counts are per declaration, so an instrument cited by two pathways is two things to re-verify — collapsing them would understate the work."
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col" className={numericCell}>
                  Count
                </th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Pathways</th>
                <td className={numericCell}>{totals.pathways}</td>
                <td>Records in the shipped catalog.</td>
              </tr>
              <tr>
                <th scope="row">Counsel reviewed</th>
                <td className={numericCell}>
                  <Count value={totals.reviewed} />
                </td>
                <td>Eligible to appear in an advice-class recommendation.</td>
              </tr>
              <tr>
                <th scope="row">Unreviewed</th>
                <td className={numericCell}>
                  <Count value={totals.unreviewed} />
                </td>
                <td>Usable for assessment only.</td>
              </tr>
              <tr>
                <th scope="row">Needs re-verification</th>
                <td className={numericCell}>
                  <Count value={totals.needsReverification} />
                </td>
                <td>Previously reviewed against text that has since moved. Treated as unreviewed.</td>
              </tr>
              <tr>
                <th scope="row">Citations</th>
                <td className={numericCell}>{totals.citations}</td>
                <td>
                  {totals.staleCitations} stale, {totals.agingCitations} aging as at {asOf.date}.
                </td>
              </tr>
              <tr>
                <th scope="row">Discretionary citations</th>
                <td className={numericCell}>
                  <Count value={totals.discretionaryCitations} />
                </td>
                <td>
                  Administrative practice or a published operational equivalence rather than a
                  bright-line statutory threshold. Must be surfaced to the reader as such.
                </td>
              </tr>
              <tr>
                <th scope="row">Records with stale citations</th>
                <td className={numericCell}>
                  <Count value={totals.withStaleCitations} />
                </td>
                <td>
                  A record resting on text nobody has re-read in 180 days. Marking one
                  counsel_reviewed is refused by the linter until the sources are checked again.
                </td>
              </tr>
              <tr>
                <th scope="row">Records with integrity errors</th>
                <td className={numericCell}>
                  <Count value={totals.withErrors} />
                </td>
                <td>Cannot be signed off until cleared.</td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section
        id="queue"
        title="Review queue"
        count={`${ordered.length} records`}
        note="Unreviewed records first, then by how many live matters in this firm's caseload rest on the record. Deliberately not ordered by how close a record is to being signable."
      >
        {ordered.length === 0 ? (
          <EmptyState title="The catalog is empty." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Pathway</th>
                  <th scope="col">Review</th>
                  <th scope="col">Status as at {asOf.date}</th>
                  <th scope="col" className={numericCell}>
                    Live matters
                  </th>
                  <th scope="col">Criteria</th>
                  <th scope="col">Provenance</th>
                  <th scope="col">Linter</th>
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
                        {review.pathway.name.en} · v{review.pathway.version} ·{' '}
                        {review.pathway.jurisdiction}
                      </Detail>
                    </th>
                    <td className={nowrapCell}>
                      <ReviewStatusBadge status={review.pathway.reviewStatus} />
                      {review.pathway.reviewedBy === undefined ? null : (
                        <Detail>
                          {review.pathway.reviewedBy} · {review.pathway.reviewedOn}
                        </Detail>
                      )}
                    </td>
                    <td className={nowrapCell}>
                      <PathwayStatusBadge status={review.statusAsOf} />
                      {review.notYetOpen ? <Detail>Had not opened on this date.</Detail> : null}
                    </td>
                    <td className={numericCell}>
                      <Count value={review.liveMatters.length} />
                    </td>
                    <td className={nowrapCell}>
                      {review.counts.blocking} blocking
                      <Detail>
                        {review.counts.material} material · {review.counts.informational}{' '}
                        informational
                      </Detail>
                      {review.escalatingCriterionIds.length > 0 ? (
                        <Detail>
                          escalates to a human: {review.escalatingCriterionIds.length} of{' '}
                          {review.pathway.criteria.length}
                        </Detail>
                      ) : null}
                    </td>
                    <td className={nowrapCell}>
                      <StalenessBadge
                        band={review.worstBand}
                        ageDays={review.oldestCitationAgeDays}
                      />
                      <Detail>
                        {review.citations.length} cited ·{' '}
                        {review.citations.filter((c) => c.citation.discretionary === true).length}{' '}
                        discretionary
                      </Detail>
                    </td>
                    <td className={nowrapCell}>
                      {review.errorCount > 0 ? (
                        <Badge tone="danger">{review.errorCount} errors</Badge>
                      ) : review.warningCount > 0 ? (
                        <Badge tone="warn">{review.warningCount} warnings</Badge>
                      ) : (
                        <Badge tone="ok">Clean</Badge>
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
        title="Citations due for re-verification"
        count={`${reverification.length} of ${totals.citations}`}
        note={
          <>
            Bands come from <Mono>staleness()</Mono> in <Mono>@meridian/core</Mono>: fresh to 90
            days, aging to 180, stale beyond. Staleness is an error rather than a warning because
            immigration rules move at the tempo of Spain repealing its investor route on roughly
            three months&rsquo; notice.
          </>
        }
      >
        {reverification.length === 0 ? (
          <EmptyState title="Every citation in the catalog was verified within the last 90 days.">
            <p>Nothing is due for re-reading as at {asOf.date}.</p>
          </EmptyState>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Citation</th>
                  <th scope="col">Pathway</th>
                  <th scope="col">Instrument</th>
                  <th scope="col">Verified</th>
                  <th scope="col">Band</th>
                </tr>
              </thead>
              <tbody>
                {reverification.map(({ pathwayId, standing }) => (
                  <tr key={`${pathwayId}:${standing.citation.id}`}>
                    <th scope="row" className={monoCell}>
                      {standing.citation.id}
                      {standing.citation.discretionary === true ? (
                        <Detail>
                          <Badge tone="info">Discretionary</Badge>
                        </Detail>
                      ) : null}
                    </th>
                    <td className={monoCell}>
                      <Link href={link(`/catalog/${pathwayId}`)}>{pathwayId}</Link>
                    </td>
                    <td>
                      {standing.citation.instrument}
                      {standing.citation.provision === undefined ? null : (
                        <Detail>{standing.citation.provision}</Detail>
                      )}
                    </td>
                    <td className={`${monoCell} ${nowrapCell}`}>{standing.citation.verifiedOn}</td>
                    <td className={nowrapCell}>
                      <StalenessBadge band={standing.band} ageDays={standing.ageDays} />
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
        title="Catalog linter"
        count={`${errors.length} errors · ${warnings.length} warnings`}
        note={
          <>
            Produced by <Mono>validateCatalog</Mono> — the same function CI runs, not a
            re-implementation of its rules. A dangling citation id or a <Mono>leadsTo</Mono> naming
            a record that no longer exists evaluates fine and quietly loses its provenance, which is
            why these are checked rather than trusted.
          </>
        }
      >
        {validation.issues.length === 0 ? (
          <EmptyState title="The catalog passes every integrity check as at this date." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Severity</th>
                  <th scope="col">Code</th>
                  <th scope="col">Pathway</th>
                  <th scope="col">Message</th>
                </tr>
              </thead>
              <tbody>
                {validation.issues.map((issue, index) => (
                  <tr key={`${issue.code}-${issue.pathwayId ?? ''}-${issue.citationId ?? ''}-${index}`}>
                    <td className={nowrapCell}>
                      <Badge tone={issue.severity === 'error' ? 'danger' : 'warn'}>
                        {humanise(issue.severity)}
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
                    <td>{issue.message}</td>
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
