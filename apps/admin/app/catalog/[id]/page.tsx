/**
 * One catalog record, as a reviewer needs to see it.
 *
 * Four things have to be on the page for a sign-off to be a real act rather than
 * a formality: the encoded rule, the provenance with its age, everything the
 * linter already knows, and what the firm is resting on the record today.
 *
 * The encoded rule is rendered from the `EvaluatorSpec` tree, literally. It is
 * not paraphrased and not softened — a reviewer has to be able to see that the
 * record says `≥ 730` where they expected `≥ 731`, and a friendly rendering that
 * said "about two years" would hide exactly the error they are here to catch.
 * The fact paths are printed verbatim for the same reason: they name the field
 * the engine actually reads, which is what a reviewer needs in order to ask
 * "measured from what?".
 *
 * The sign-off panel records nothing. This console has no write path into the
 * catalog, which is compiled TypeScript inside `@meridian/pathways`, and a
 * button that pretended otherwise would be worse than no button. What it does
 * instead is construct the record a sign-off *would* produce, run the real
 * `validateCatalog` over the resulting catalog, and report whether the sign-off
 * would be accepted — so a reviewer discovers that their signature would trip
 * `counsel_review_stale` here, rather than in a pull request.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isTerminal } from '@meridian/core';
import { MERIDIAN_PATHWAY_CATALOG, pathwayById, statusOn } from '@meridian/pathways';
import { previewSignOff, reviewQueue } from '@/lib/catalog-review';
import { AS_OF_PARAM, firstParam, resolveAsOf, withAsOf } from '@/lib/clock';
import { countOf, humanise } from '@/lib/format';
import { loadRecords } from '@/lib/records';
import { describeSpec, specFactPaths, specSize } from '@/lib/spec-language';
import { PageHeader } from '@/components/page';
import {
  MatterStatusBadge,
  PathwayStatusBadge,
  ReviewStatusBadge,
  StalenessBadge,
} from '@/components/state';
import {
  Badge,
  Callout,
  Chip,
  Definitions,
  Detail,
  EmptyState,
  Meta,
  Mono,
  Panel,
  PillRow,
  Section,
  Subhead,
  TableWrap,
  Tree,
  checkItemClass,
  checkListClass,
  fieldClass,
  filterActionsClass,
  filterBarClass,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';
import shell from '@/components/shell.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pathway = pathwayById(id);
  return { title: pathway === null ? 'Pathway not found' : pathway.id };
}

export default async function CatalogRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const asOf = resolveAsOf(query[AS_OF_PARAM]);
  const pathway = pathwayById(id);
  if (pathway === null) notFound();

  const records = loadRecords();
  const link = (href: string): string => withAsOf(href, asOf);
  const { reviews } = reviewQueue(MERIDIAN_PATHWAY_CATALOG, records.matters, asOf.date);
  const review = reviews.find((r) => r.pathway.id === pathway.id);
  if (review === undefined) notFound();

  const reviewerParam = firstParam(query.reviewer) ?? null;
  const signOff = previewSignOff(MERIDIAN_PATHWAY_CATALOG, pathway, reviewerParam, asOf.date);
  const liveMatters = review.liveMatters.filter((m) => !isTerminal(m.matter.status));
  const citationById = new Map(review.citations.map((c) => [c.citation.id, c]));

  return (
    <>
      <PageHeader
        path={`/catalog/${pathway.id}`}
        asOf={asOf}
        title={pathway.id}
        description={
          <>
            {pathway.name.en} · v{pathway.version} · {humanise(pathway.kind)} ·{' '}
            {pathway.jurisdiction}
          </>
        }
        preserve={{ reviewer: reviewerParam ?? undefined }}
      >
        <p>
          <ReviewStatusBadge status={pathway.reviewStatus} />{' '}
          <PathwayStatusBadge status={review.statusAsOf} />{' '}
          <Badge tone="neutral">
            {countOf(pathway.criteria.length, 'criterion', 'criteria')}
          </Badge>{' '}
          <Badge tone="neutral">
            {countOf(pathway.citations.length, 'citation', 'citations')}
          </Badge>{' '}
          <Badge tone={liveMatters.length > 0 ? 'info' : 'neutral'}>
            {countOf(liveMatters.length, 'live matter', 'live matters')}
          </Badge>
        </p>
      </PageHeader>

      {review.statusAsOf === 'closed' ? (
        <Callout
          tone="info"
          title={`Closed to new applications on ${pathway.closedOn ?? 'an unrecorded date'}`}
        >
          <p>{pathway.closureNote?.en}</p>
          <p>
            The record stays in the catalog rather than being deleted, because people hold status
            under closed routes for years afterwards and a renewal question deserves an answer
            rather than a 404.
          </p>
        </Callout>
      ) : null}

      <Section
        id="summary"
        title="Record"
        note={pathway.summary.en}
      >
        <Definitions
          items={[
            { term: 'Id', value: <Mono>{pathway.id}</Mono> },
            {
              term: 'Version',
              value: (
                <>
                  <Mono>{pathway.version}</Mono>{' '}
                  <Meta>semver of the rule content, not of the package</Meta>
                </>
              ),
            },
            { term: 'Kind', value: humanise(pathway.kind) },
            { term: 'Jurisdiction', value: <Mono>{pathway.jurisdiction}</Mono> },
            {
              term: 'Opened',
              value:
                pathway.openedOn === undefined ? <Meta>Not recorded</Meta> : <Mono>{pathway.openedOn}</Mono>,
            },
            {
              term: 'Closed',
              value:
                pathway.closedOn === undefined ? <Meta>Still accepting</Meta> : <Mono>{pathway.closedOn}</Mono>,
            },
            {
              term: 'Stored status',
              value: (
                <>
                  {humanise(pathway.status)}{' '}
                  <Meta>
                    (as at {asOf.date}: {statusOn(pathway, asOf.date)})
                  </Meta>
                </>
              ),
            },
            {
              term: 'Reviewed by',
              value:
                pathway.reviewedBy === undefined ? (
                  <Meta>Nobody. The record has never been signed off.</Meta>
                ) : (
                  `${pathway.reviewedBy} on ${pathway.reviewedOn ?? 'an unrecorded date'}`
                ),
            },
            {
              term: 'Leads to',
              value:
                pathway.leadsTo.length === 0 ? (
                  <Meta>Nothing recorded</Meta>
                ) : (
                  <PillRow>
                    {pathway.leadsTo.map((target) => (
                      <Link key={target} href={link(`/catalog/${target}`)}>
                        <Chip>{target}</Chip>
                      </Link>
                    ))}
                  </PillRow>
                ),
            },
            { term: 'Spanish summary', value: <Meta>{pathway.summary.es}</Meta> },
          ]}
        />
      </Section>

      <Section
        id="sign-off"
        title="Sign-off"
        note={
          <>
            This panel does not record a review. The catalog is compiled TypeScript in{' '}
            <Mono>@meridian/pathways</Mono> and this console has no write path into it. What it does
            is build the record a sign-off would produce and run the real{' '}
            <Mono>validateCatalog</Mono> over the resulting catalog, so a reviewer can see whether
            the signature would be accepted before writing it into the source.
          </>
        }
      >
        <form className={filterBarClass} method="get" action={`/catalog/${pathway.id}`}>
          {asOf.source === 'url' ? (
            <input type="hidden" name={AS_OF_PARAM} value={asOf.date} />
          ) : null}
          <div className={fieldClass}>
            <label htmlFor="reviewer">Reviewer</label>
            <input
              id="reviewer"
              name="reviewer"
              type="text"
              size={32}
              defaultValue={reviewerParam ?? ''}
              placeholder="Name and standing of the licensed reviewer"
            />
          </div>
          <div className={filterActionsClass}>
            <button type="submit" className={`${shell.button} ${shell.buttonPrimary}`}>
              Check this sign-off
            </button>
            {reviewerParam === null ? null : (
              <a href={link(`/catalog/${pathway.id}`)}>Clear</a>
            )}
          </div>
        </form>

        <Panel>
          <ul className={checkListClass}>
            {signOff.checks.map((check) => (
              <li key={check.id} className={checkItemClass}>
                <Badge tone={check.met === true ? 'ok' : check.met === false ? 'danger' : 'neutral'}>
                  {check.met === true ? 'Met' : check.met === false ? 'Not met' : 'Not evaluated'}
                </Badge>
                <span>
                  {check.label}
                  <Detail>{check.detail}</Detail>
                </span>
              </li>
            ))}
          </ul>

          <Subhead>Outcome</Subhead>
          {signOff.wouldBeAccepted ? (
            <>
              <p>
                <Badge tone="ok">The catalog would validate with this sign-off applied.</Badge>
              </p>
              <p>
                Transcribe the following onto the record in{' '}
                <Mono>packages/pathways/src/catalog/</Mono> and ship it. Nothing here has been
                written anywhere.
              </p>
              <Definitions
                items={Object.entries(signOff.patch ?? {}).map(([field, value]) => ({
                  term: field,
                  value: <Mono>{value}</Mono>,
                }))}
              />
            </>
          ) : (
            <p>
              <Badge tone="warn">This sign-off would not be accepted yet.</Badge>{' '}
              <Meta>Clear the unmet checks above first.</Meta>
            </p>
          )}
        </Panel>
      </Section>

      <Section
        id="criteria"
        title="Criteria"
        count={`${review.counts.blocking} blocking · ${review.counts.material} material · ${review.counts.informational} informational`}
        note={
          <>
            <strong>Blocking</strong> means failing it makes the application impossible and the
            engine will say so. <strong>Material</strong> can hold back a yes but never produces a
            no, because &ldquo;probably refused&rdquo; is a prediction and predictions are advice.
            <strong> Informational</strong> is shown and never affects the verdict.
          </>
        }
      >
        {pathway.criteria.map((criterion) => {
          const paths = specFactPaths(criterion.evaluator);
          return (
            <div key={criterion.id}>
              <Subhead id={`criterion-${criterion.id}`}>
                <Mono>{criterion.id}</Mono>
              </Subhead>
              <Panel>
                <Definitions
                  items={[
                    { term: 'Label', value: criterion.label.en },
                    { term: 'Etiqueta', value: <Meta>{criterion.label.es}</Meta> },
                    {
                      term: 'Weight',
                      value: (
                        <Badge
                          tone={
                            criterion.weight === 'blocking'
                              ? 'danger'
                              : criterion.weight === 'material'
                                ? 'warn'
                                : 'neutral'
                          }
                        >
                          {humanise(criterion.weight)}
                        </Badge>
                      ),
                    },
                    { term: 'Kind', value: humanise(criterion.kind) },
                    {
                      term: 'Cites',
                      value: (
                        <PillRow>
                          {criterion.citationIds.map((citationId) => {
                            const standing = citationById.get(citationId);
                            return (
                              <span key={citationId}>
                                <a href={`#citation-${citationId}`}>
                                  <Chip>{citationId}</Chip>
                                </a>{' '}
                                {standing === undefined ? (
                                  <Badge tone="danger">Not declared on this record</Badge>
                                ) : (
                                  <StalenessBadge
                                    band={standing.band}
                                    ageDays={standing.ageDays}
                                  />
                                )}
                              </span>
                            );
                          })}
                        </PillRow>
                      ),
                    },
                    {
                      term: 'Encoded rule',
                      value: (
                        <>
                          <Tree node={describeSpec(criterion.evaluator)} />
                          <Detail>
                            {countOf(specSize(criterion.evaluator), 'operator', 'operators')}.
                            Rendered literally from the record, not paraphrased.
                          </Detail>
                        </>
                      ),
                    },
                    {
                      term: 'Facts read',
                      value: (
                        <PillRow>
                          {paths.map((p) => (
                            <Chip key={`${p.path}-${p.rootScope ? 'root' : 'item'}`}>
                              {p.path}
                              {p.rootScope ? '' : ' (per item)'}
                            </Chip>
                          ))}
                        </PillRow>
                      ),
                    },
                    ...(criterion.requiresHumanReview === true
                      ? [
                          {
                            term: 'Escalation',
                            value: (
                              <>
                                <Badge tone="warn">Always requires a human</Badge>
                                {criterion.humanReviewReason === undefined ? null : (
                                  <Detail>{criterion.humanReviewReason.en}</Detail>
                                )}
                              </>
                            ),
                          },
                        ]
                      : []),
                    ...(criterion.humanReviewWhen === undefined
                      ? []
                      : [
                          {
                            term: 'Escalates when',
                            value: (
                              <>
                                <Tree node={describeSpec(criterion.humanReviewWhen)} />
                                {criterion.humanReviewReason === undefined ? null : (
                                  <Detail>{criterion.humanReviewReason.en}</Detail>
                                )}
                              </>
                            ),
                          },
                        ]),
                    ...(criterion.guidance === undefined
                      ? []
                      : [{ term: 'Guidance', value: criterion.guidance.en }]),
                  ]}
                />
              </Panel>
            </div>
          );
        })}
      </Section>

      <Section
        id="citations"
        title="Provenance"
        count={`${review.citations.length} · ${review.staleCount} stale · ${review.agingCount} aging`}
        note={
          <>
            Every applied rule carries a citation, and <Mono>verifiedOn</Mono> is when a human last
            checked the cited text against the source. A citation nobody has read in six months is a
            defect rather than a nuisance — the freshness bands exist because Spain repealed its
            investor route on roughly three months&rsquo; notice.
          </>
        }
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Kind</th>
                <th scope="col">Instrument</th>
                <th scope="col">Verified</th>
                <th scope="col">Band</th>
                <th scope="col">Used</th>
              </tr>
            </thead>
            <tbody>
              {review.citations.map((standing) => {
                const c = standing.citation;
                return (
                  <tr key={c.id} id={`citation-${c.id}`}>
                    <th scope="row" className={monoCell}>
                      {c.id}
                    </th>
                    <td className={nowrapCell}>
                      {humanise(c.kind)}
                      {c.discretionary === true ? (
                        <Detail>
                          <Badge tone="info">Discretionary</Badge>
                        </Detail>
                      ) : null}
                    </td>
                    <td>
                      {c.instrument}
                      {c.provision === undefined ? null : <Detail>{c.provision}</Detail>}
                      {c.url === undefined ? (
                        <Detail>
                          <Meta>
                            No canonical URL recorded. A wrong link teaches the reader to stop
                            checking, so none is guessed.
                          </Meta>
                        </Detail>
                      ) : (
                        <Detail>
                          <a href={c.url} rel="noreferrer noopener nofollow">
                            {c.url}
                          </a>
                        </Detail>
                      )}
                      {c.note === undefined ? null : <Detail>{c.note}</Detail>}
                    </td>
                    <td className={`${monoCell} ${nowrapCell}`}>{c.verifiedOn}</td>
                    <td className={nowrapCell}>
                      <StalenessBadge band={standing.band} ageDays={standing.ageDays} />
                    </td>
                    <td className={nowrapCell}>
                      {standing.referenced ? (
                        <Badge tone="ok">Cited</Badge>
                      ) : (
                        <Badge tone="warn">Declared, never cited</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section
        id="durations"
        title="Durations"
        note="Deliberately sparse. A processing-time figure appears only where the authority publishes a service standard; an applicant who books a flight on an invented number pays for the invention."
      >
        <Definitions
          items={[
            {
              term: 'Initial grant',
              value:
                pathway.durations.initialGrantMonths === undefined ? (
                  <Meta>Not recorded</Meta>
                ) : (
                  `${pathway.durations.initialGrantMonths} months`
                ),
            },
            {
              term: 'Renewal',
              value:
                pathway.durations.renewalMonths === undefined ? (
                  <Meta>Not recorded</Meta>
                ) : (
                  `${pathway.durations.renewalMonths} months`
                ),
            },
            {
              term: 'Maximum renewals',
              value:
                pathway.durations.maxRenewals === undefined ? (
                  <Meta>Not recorded</Meta>
                ) : (
                  String(pathway.durations.maxRenewals)
                ),
            },
            {
              term: 'Counts toward naturalisation',
              value:
                pathway.durations.countsTowardNaturalisation === undefined ? (
                  <Meta>Not asserted</Meta>
                ) : pathway.durations.countsTowardNaturalisation ? (
                  <Badge tone="ok">Yes</Badge>
                ) : (
                  <Badge tone="neutral">No</Badge>
                ),
            },
            {
              term: 'Published processing time',
              value:
                pathway.durations.publishedProcessingDays === undefined ? (
                  <Meta>
                    None published by the authority, so none is shown. No estimate is invented here.
                  </Meta>
                ) : (
                  `${pathway.durations.publishedProcessingDays.min}–${pathway.durations.publishedProcessingDays.max} days`
                ),
            },
            {
              term: 'Cites',
              value: (
                <PillRow>
                  {pathway.durations.citationIds.map((citationId) => (
                    <a key={citationId} href={`#citation-${citationId}`}>
                      <Chip>{citationId}</Chip>
                    </a>
                  ))}
                </PillRow>
              ),
            },
            ...(pathway.durations.note === undefined
              ? []
              : [{ term: 'Note', value: pathway.durations.note.en }]),
          ]}
        />
      </Section>

      <Section
        id="linter"
        title="Linter findings for this record"
        count={`${review.errorCount} errors · ${review.warningCount} warnings`}
      >
        {review.issues.length === 0 ? (
          <EmptyState title="No integrity findings against this record as at this date." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Severity</th>
                  <th scope="col">Code</th>
                  <th scope="col">Where</th>
                  <th scope="col">Message</th>
                </tr>
              </thead>
              <tbody>
                {review.issues.map((issue, index) => (
                  <tr key={`${issue.code}-${index}`}>
                    <td className={nowrapCell}>
                      <Badge tone={issue.severity === 'error' ? 'danger' : 'warn'}>
                        {humanise(issue.severity)}
                      </Badge>
                    </td>
                    <td className={monoCell}>{issue.code}</td>
                    <td className={monoCell}>
                      {issue.criterionId ?? issue.citationId ?? <Meta>record</Meta>}
                    </td>
                    <td>{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Section>

      <Section
        id="dependent-matters"
        title="Matters resting on this record"
        count={`${liveMatters.length} live of ${review.liveMatters.length}`}
        note="What the firm is currently measuring against these rules. This is what makes a sign-off urgent rather than tidy."
      >
        {review.liveMatters.length === 0 ? (
          <EmptyState title="No matter in this tenant is assessed against this record." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Matter</th>
                  <th scope="col">Phase</th>
                  <th scope="col">Status</th>
                  <th scope="col" className={numericCell}>
                    Documents
                  </th>
                </tr>
              </thead>
              <tbody>
                {review.liveMatters.map((record) => (
                  <tr key={record.matter.id}>
                    <th scope="row" className={nowrapCell}>
                      <Link href={link(`/matters/${record.matter.id}`)}>{record.reference}</Link>
                      <Detail>{record.title}</Detail>
                    </th>
                    <td className={nowrapCell}>{humanise(record.matter.phase)}</td>
                    <td className={nowrapCell}>
                      <MatterStatusBadge status={record.matter.status} />
                    </td>
                    <td className={numericCell}>{record.documents.length}</td>
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
