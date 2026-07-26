/**
 * Caseload overview.
 *
 * The brief for this screen was "not a dashboard of vanity tiles", and the
 * organising principle that follows is that every block answers a question a
 * practitioner actually asks at nine in the morning: what runs out soonest, what
 * is stuck and whose move is it, where is everything, and what am I resting all
 * of this on.
 *
 * Nothing here is a stored figure. The distribution is counted from the matters,
 * the blockers are derived from status, representative standing and catalog
 * resolution, and every date calculation goes through `@meridian/core`. An empty
 * caseload renders as an empty caseload: no sample rows, no skeleton, no
 * "0 of 0" tiles pretending there is a pipeline.
 *
 * Three kinds of string are not translated and are marked instead. A matter's
 * title and a task's title are record content, rendered with
 * `lang={records.recordLanguage}`. The advice gate's refusal reason comes from
 * `@meridian/core` in English and is marked `lang="en"` — paraphrasing it would
 * put words in the gate's mouth on the one screen that exists to report exactly
 * what the gate said. A pathway's name comes from the catalog, which carries
 * both halves, so `pick` selects the reader's.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MATTER_PHASE_ORDER, phaseIndex } from '@meridian/core';
import {
  APPROACHING_WINDOW_DAYS,
  CRITICAL_WINDOW_DAYS,
  blockers,
  blockersByOwner,
  catalogDependencies,
  deadlines,
  distribution,
  timeCritical,
  workInHand,
} from '@/lib/caseload';
import { AS_OF_PARAM, resolveAsOf } from '@/lib/clock';
import {
  COUNTS,
  UI,
  countOf,
  fill,
  linker,
  localeAlternates,
  parseLocale,
  pick,
  relativeDays,
} from '@/lib/i18n';
import {
  BLOCKER_OWNER_LABEL,
  DEADLINE_KIND_LABEL,
  MATTER_PHASE_LABEL,
  MATTER_STATUS_LABEL,
  PATHWAY_STATUS_LABEL,
  REVIEW_STATUS_LABEL,
  TASK_ASSIGNEE_LABEL,
} from '@/lib/labels';
import { loadRecords } from '@/lib/records';
import {
  danglingRepresentativeAssignments,
  representativeStandings,
  unrepresentedLiveMatters,
} from '@/lib/roster';
import { PageHeader } from '@/components/page';
import { severityTone } from '@/components/state';
import {
  Badge,
  Bar,
  Callout,
  Count,
  Detail,
  EmptyState,
  Meta,
  Mono,
  Rich,
  Section,
  Subhead,
  TableWrap,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

/** Locale-free path of this page, for the header form and the alternates. */
const SELF = '/';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();
  return { title: pick(UI.caseloadTitle, locale), alternates: localeAlternates(SELF) };
}

export default async function CaseloadPage({
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
  const recordLang = records.recordLanguage;

  const standings = representativeStandings(records, asOf.date);
  const dist = distribution(records.matters);
  const allDeadlines = deadlines(records, standings, asOf.date, locale);
  const urgent = timeCritical(allDeadlines);
  const approaching = allDeadlines.filter((d) => d.severity === 'approaching');
  const allBlockers = blockers(records, standings, asOf.date, locale);
  const ownerGroups = blockersByOwner(allBlockers);
  const work = workInHand(records.matters);
  const dependencies = catalogDependencies(records, asOf.date);

  const lapsedGating = standings.filter(
    (s) => s.licence.standing === 'lapsed' && s.liveGating.length > 0,
  );
  const downgrading = standings.filter((s) => s.downgrading.length > 0);
  const downgradedCount = downgrading.reduce((n, s) => n + s.downgrading.length, 0);
  const unrepresented = unrepresentedLiveMatters(records);
  const dangling = danglingRepresentativeAssignments(records);
  const unreviewedMatterCount = dependencies
    .filter((d) => !d.reviewed)
    .reduce((n, d) => n + d.liveMatters.length, 0);
  const actionable = work.reduce((n, w) => n + w.available + w.inProgress, 0);

  return (
    <>
      <PageHeader
        path={SELF}
        asOf={asOf}
        locale={locale}
        title={pick(UI.caseloadTitle, locale)}
        description={fill(UI.caseloadDescription, locale, {
          matters: countOf(locale, dist.total, COUNTS.matter),
          live: dist.live,
          date: asOf.date,
        })}
      />

      {records.matters.length === 0 ? (
        <EmptyState title={pick(UI.caseloadEmptyTitle, locale)}>
          <p>
            {fill(UI.caseloadEmptyBody, locale, {
              representatives: countOf(
                locale,
                records.representatives.length,
                COUNTS.representative,
              ),
            })}
          </p>
          <p>
            {pick(UI.caseloadEmptyElsewhereBefore, locale)}
            <Link href={link('/catalog')}>{pick(UI.caseloadEmptyReviewQueue, locale)}</Link>
            {pick(UI.caseloadEmptyElsewhereMiddle, locale)}
            <Link href={link('/integrations')}>{pick(UI.caseloadEmptyStatusBoard, locale)}</Link>
            {pick(UI.caseloadEmptyElsewhereAfter, locale)}
          </p>
        </EmptyState>
      ) : (
        <>
          {lapsedGating.length > 0 ? (
            <Callout
              tone="danger"
              title={fill(UI.caseloadLapsedTitle, locale, {
                credentials: countOf(locale, lapsedGating.length, COUNTS.credentialHas),
              })}
            >
              <ul>
                {lapsedGating.map((s) => (
                  <li key={s.record.credential.id}>
                    <span lang={recordLang}>{s.record.displayName}</span> (
                    {s.record.credential.jurisdiction}) — {pick(UI.caseloadLapsedExpired, locale)}{' '}
                    <Mono>{s.licence.expiresOn}</Mono>, {pick(UI.caseloadLapsedGating, locale)}{' '}
                    {countOf(locale, s.liveGating.length, COUNTS.liveMatter)}
                  </li>
                ))}
              </ul>
              <p>
                {pick(UI.caseloadLapsedBodyBefore, locale)}
                <Link href={link('/representatives')}>
                  {pick(UI.caseloadLapsedRosterLink, locale)}
                </Link>
                .
              </p>
            </Callout>
          ) : null}

          {downgradedCount > 0 ? (
            <Callout
              tone="warn"
              title={fill(UI.caseloadDowngradedTitle, locale, {
                matters: countOf(locale, downgradedCount, COUNTS.liveMatter),
              })}
            >
              <ul>
                {downgrading.flatMap((s) =>
                  s.downgrading.map((m) => (
                    <li key={`${s.record.credential.id}:${m.matterId}`}>
                      <Link href={link(`/matters/${m.matterId}`)}>{m.reference}</Link>
                      {m.toApplicant.allowed ? null : (
                        <>
                          {' — '}
                          <span lang="en">{m.toApplicant.reason}</span>
                        </>
                      )}
                    </li>
                  )),
                )}
              </ul>
            </Callout>
          ) : null}

          {unrepresented.length > 0 || dangling.length > 0 ? (
            <Callout tone="warn" title={pick(UI.caseloadUnaccountableTitle, locale)}>
              {unrepresented.length > 0 ? (
                <p>
                  {fill(UI.caseloadUnrepresented, locale, {
                    matters: countOf(locale, unrepresented.length, COUNTS.liveMatterHas),
                    list: unrepresented.map((m) => m.reference).join(', '),
                  })}
                </p>
              ) : null}
              {dangling.length > 0 ? (
                <p>
                  {fill(UI.caseloadDangling, locale, {
                    matters: countOf(locale, dangling.length, COUNTS.matterNames),
                    list: dangling
                      .map((d) => `${d.matter.reference} → ${d.representativeId}`)
                      .join(', '),
                  })}
                </p>
              ) : null}
            </Callout>
          ) : null}

          <Section
            id="time-critical"
            title={pick(UI.caseloadTimeCriticalTitle, locale)}
            count={fill(UI.caseloadTimeCriticalCount, locale, {
              urgent: urgent.length,
              approaching: approaching.length,
            })}
            note={fill(UI.caseloadTimeCriticalNote, locale, {
              critical: CRITICAL_WINDOW_DAYS,
              approaching: APPROACHING_WINDOW_DAYS,
            })}
          >
            {urgent.length === 0 ? (
              <EmptyState title={pick(UI.caseloadNothingCritical, locale)}>
                <p>
                  {approaching.length > 0
                    ? fill(UI.caseloadApproachingBody, locale, {
                        deadlines: countOf(locale, approaching.length, COUNTS.deadlineIs),
                        from: CRITICAL_WINDOW_DAYS + 1,
                        to: APPROACHING_WINDOW_DAYS,
                      })
                    : pick(UI.caseloadNothingInTwoWeeks, locale)}
                </p>
              </EmptyState>
            ) : (
              <TableWrap>
                <table>
                  <caption>
                    {fill(UI.caseloadDeadlineCaption, locale, {
                      critical: CRITICAL_WINDOW_DAYS,
                      date: asOf.date,
                    })}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">{pick(UI.colDate, locale)}</th>
                      <th scope="col">{pick(UI.auditWhen, locale)}</th>
                      <th scope="col">{pick(UI.fieldKind, locale)}</th>
                      <th scope="col">{pick(UI.colWhat, locale)}</th>
                      <th scope="col">{pick(UI.colMatter, locale)}</th>
                      <th scope="col">{pick(UI.colCites, locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgent.map((d) => (
                      <tr key={d.id}>
                        <td className={`${monoCell} ${nowrapCell}`}>{d.on}</td>
                        <td className={nowrapCell}>
                          <Badge tone={severityTone(d.severity)}>
                            {relativeDays(locale, d.daysRemaining)}
                          </Badge>
                        </td>
                        <td className={nowrapCell}>
                          <Meta>{pick(DEADLINE_KIND_LABEL[d.kind], locale)}</Meta>
                        </td>
                        <td>
                          <span lang={d.labelIsRecord ? recordLang : undefined}>{d.label}</span>
                          <Detail lang={d.detailIsForeign ? 'en' : undefined}>{d.detail}</Detail>
                          {d.matterTitle === null ? null : (
                            <Detail lang={recordLang}>{d.matterTitle}</Detail>
                          )}
                        </td>
                        <td className={nowrapCell}>
                          {d.matterId === null ? (
                            <Link href={link('/representatives')}>
                              {pick(UI.rosterTitle, locale)}
                            </Link>
                          ) : (
                            <Link href={link(`/matters/${d.matterId}`)}>{d.matterReference}</Link>
                          )}
                        </td>
                        <td className={monoCell}>
                          {d.citationIds.length === 0 ? <Meta>—</Meta> : d.citationIds.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Section>

          <Section
            id="blocked"
            title={pick(UI.caseloadBlockedTitle, locale)}
            count={fill(UI.caseloadBlockedCount, locale, {
              blockers: allBlockers.length,
              live: dist.live,
            })}
            note={pick(UI.caseloadBlockedNote, locale)}
          >
            {ownerGroups.length === 0 ? (
              <EmptyState title={pick(UI.caseloadNothingBlocked, locale)}>
                <p>{pick(UI.caseloadNothingBlockedBody, locale)}</p>
              </EmptyState>
            ) : (
              ownerGroups.map((group) => (
                <div key={group.owner}>
                  <Subhead id={`blocked-${group.owner}`}>
                    {pick(BLOCKER_OWNER_LABEL[group.owner], locale)} · {group.blockers.length}
                  </Subhead>
                  <TableWrap>
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">{pick(UI.colMatter, locale)}</th>
                          <th scope="col">{pick(UI.caseloadBlockedSince, locale)}</th>
                          <th scope="col">{pick(UI.caseloadBlockedBlocker, locale)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.blockers.map((b) => (
                          <tr key={b.id}>
                            <td className={nowrapCell}>
                              <Link href={link(`/matters/${b.matterId}`)}>{b.matterReference}</Link>
                              <Detail lang={recordLang}>{b.matterTitle}</Detail>
                            </td>
                            <td className={nowrapCell}>
                              {b.since === undefined ? (
                                <Meta>{pick(UI.caseloadNoStateChange, locale)}</Meta>
                              ) : (
                                <>
                                  <Mono>{b.since}</Mono>
                                  <Detail>
                                    {/* `ageDays` is measured from the change to the
                                        reference date, so it is negated here to get
                                        the signed form. Under an as-at override the
                                        change can legitimately be in the future, and
                                        an unsigned magnitude would report it as
                                        having already happened. */}
                                    {b.ageDays === undefined
                                      ? null
                                      : relativeDays(locale, -b.ageDays)}
                                  </Detail>
                                </>
                              )}
                            </td>
                            <td>
                              {b.summary}
                              <Detail>{b.detail}</Detail>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                </div>
              ))
            )}
          </Section>

          <Section
            id="distribution"
            title={pick(UI.caseloadDistributionTitle, locale)}
            count={fill(UI.caseloadDistributionCount, locale, {
              total: dist.total,
              live: dist.live,
              closed: dist.closed,
            })}
            note={pick(UI.caseloadDistributionNote, locale)}
          >
            <TableWrap>
              <table>
                <caption>
                  <Rich text={pick(UI.caseloadDistributionCaption, locale)} />
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{pick(UI.colPhase, locale)}</th>
                    <th scope="col" className={numericCell}>
                      {pick(UI.colTotal, locale)}
                    </th>
                    {dist.occupiedStatuses.map((status) => (
                      <th key={status} scope="col" className={numericCell}>
                        {pick(MATTER_STATUS_LABEL[status], locale)}
                      </th>
                    ))}
                    <th scope="col">{pick(UI.caseloadShare, locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {dist.rows.map((row) => (
                    <tr key={row.phase}>
                      <th scope="row">
                        <Meta>{phaseIndex(row.phase) + 1}.</Meta>{' '}
                        {pick(MATTER_PHASE_LABEL[row.phase], locale)}
                      </th>
                      <td className={numericCell}>
                        <Count value={row.total} />
                      </td>
                      {dist.occupiedStatuses.map((status) => (
                        <td key={status} className={numericCell}>
                          <Count value={row.byStatus[status]} />
                        </td>
                      ))}
                      <td>
                        <Bar
                          value={row.total}
                          total={dist.total}
                          label={fill(UI.caseloadPhaseShare, locale, {
                            phase: pick(MATTER_PHASE_LABEL[row.phase], locale),
                          })}
                          description={fill(UI.barOfTotal, locale, {
                            value: row.total,
                            total: dist.total,
                          })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">{pick(UI.caseloadAllPhases, locale)}</th>
                    <td className={numericCell}>{dist.total}</td>
                    {dist.occupiedStatuses.map((status) => (
                      <td key={status} className={numericCell}>
                        {dist.statusTotals[status]}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </TableWrap>
          </Section>

          <Section
            id="work"
            title={pick(UI.caseloadWorkTitle, locale)}
            count={fill(UI.caseloadWorkCount, locale, { count: actionable })}
            note={pick(UI.caseloadWorkNote, locale)}
          >
            {work.length === 0 ? (
              <EmptyState title={pick(UI.caseloadNoTasks, locale)} />
            ) : (
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{pick(UI.colOwner, locale)}</th>
                      <th scope="col" className={numericCell}>
                        {pick(UI.caseloadAvailable, locale)}
                      </th>
                      <th scope="col" className={numericCell}>
                        {pick(UI.caseloadInProgress, locale)}
                      </th>
                      <th scope="col" className={numericCell}>
                        {pick(UI.caseloadStillLocked, locale)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {work.map((row) => (
                      <tr key={row.assignee}>
                        <th scope="row">{pick(TASK_ASSIGNEE_LABEL[row.assignee], locale)}</th>
                        <td className={numericCell}>
                          <Count value={row.available} />
                        </td>
                        <td className={numericCell}>
                          <Count value={row.inProgress} />
                        </td>
                        <td className={numericCell}>
                          <Count value={row.locked} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Section>

          <Section
            id="catalog-dependency"
            title={pick(UI.caseloadDependencyTitle, locale)}
            count={fill(UI.caseloadDependencyCount, locale, {
              count: countOf(locale, dependencies.length, COUNTS.record),
            })}
            note={pick(UI.caseloadDependencyNote, locale)}
            actions={
              <Link href={link('/catalog')}>{pick(UI.caseloadOpenReviewQueue, locale)}</Link>
            }
          >
            {unreviewedMatterCount > 0 ? (
              <Callout
                tone="warn"
                title={fill(UI.caseloadUnreviewedTitle, locale, {
                  matters: countOf(locale, unreviewedMatterCount, COUNTS.liveMatterRests),
                })}
              >
                <p>{pick(UI.caseloadUnreviewedBody, locale)}</p>
              </Callout>
            ) : null}
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{pick(UI.colPathway, locale)}</th>
                    <th scope="col" className={numericCell}>
                      {pick(UI.colLiveMatters, locale)}
                    </th>
                    <th scope="col">{pick(UI.fieldReview, locale)}</th>
                    <th scope="col">{fill(UI.fieldStatusAsAt, locale, { date: asOf.date })}</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencies.map((dep) => (
                    <tr key={dep.pathwayId}>
                      <td className={monoCell}>
                        {dep.pathway === null ? (
                          dep.pathwayId
                        ) : (
                          <Link href={link(`/catalog/${dep.pathwayId}`)}>{dep.pathwayId}</Link>
                        )}
                        <Detail>
                          {dep.pathway === null
                            ? pick(UI.caseloadNotInCatalog, locale)
                            : pick(dep.pathway.name, locale)}
                        </Detail>
                      </td>
                      <td className={numericCell}>{dep.liveMatters.length}</td>
                      <td>
                        {dep.pathway === null ? (
                          <Badge tone="danger">{pick(UI.caseloadUnresolvable, locale)}</Badge>
                        ) : dep.reviewed ? (
                          <Badge tone="ok">
                            {pick(REVIEW_STATUS_LABEL.counsel_reviewed, locale)}
                          </Badge>
                        ) : (
                          <Badge tone="warn">
                            {pick(REVIEW_STATUS_LABEL[dep.pathway.reviewStatus], locale)}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {dep.pathway === null ? (
                          <Meta>—</Meta>
                        ) : dep.closedAsOf ? (
                          <Badge tone="neutral">{pick(UI.caseloadClosedToNew, locale)}</Badge>
                        ) : (
                          <Badge tone="ok">{pick(PATHWAY_STATUS_LABEL.open, locale)}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Section>

          <Section
            id="phase-legend"
            title={pick(UI.caseloadPhaseLegendTitle, locale)}
            note={pick(UI.caseloadPhaseLegendNote, locale)}
          >
            <ol>
              {MATTER_PHASE_ORDER.map((phase) => (
                <li key={phase}>
                  {pick(MATTER_PHASE_LABEL[phase], locale)} —{' '}
                  {countOf(
                    locale,
                    dist.rows.find((r) => r.phase === phase)?.total ?? 0,
                    COUNTS.matter,
                  )}
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </>
  );
}
