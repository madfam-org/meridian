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
 */

import Link from 'next/link';
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
import { AS_OF_PARAM, resolveAsOf, withAsOf } from '@/lib/clock';
import { countOf, humanise, relativeDays } from '@/lib/format';
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
  Section,
  Subhead,
  TableWrap,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Caseload' };

export default async function CaseloadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asOf = resolveAsOf(params[AS_OF_PARAM]);
  const records = loadRecords();
  const link = (href: string): string => withAsOf(href, asOf);

  const standings = representativeStandings(records, asOf.date);
  const dist = distribution(records.matters);
  const allDeadlines = deadlines(records, standings, asOf.date);
  const urgent = timeCritical(allDeadlines);
  const approaching = allDeadlines.filter((d) => d.severity === 'approaching');
  const allBlockers = blockers(records, standings, asOf.date);
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
        path="/"
        asOf={asOf}
        title="Caseload"
        description={
          <>
            {countOf(dist.total, 'matter', 'matters')} on the books, {dist.live} still running.
            Every figure below is counted from the records as at {asOf.date}; nothing is cached and
            nothing is stored pre-computed.
          </>
        }
      />

      {records.matters.length === 0 ? (
        <EmptyState title="No matters have been opened.">
          <p>
            This tenant has{' '}
            {countOf(records.representatives.length, 'representative', 'representatives')} on the
            roster and no files. The caseload views stay empty until a matter exists — they do not
            fill with examples.
          </p>
          <p>
            The <Link href={link('/catalog')}>catalog review queue</Link> and the{' '}
            <Link href={link('/integrations')}>integration status board</Link> are populated
            regardless, because both describe the platform rather than the caseload.
          </p>
        </EmptyState>
      ) : (
        <>
          {lapsedGating.length > 0 ? (
            <Callout
              tone="danger"
              title={`${countOf(lapsedGating.length, 'credential has', 'credentials have')} lapsed while still gating live matters`}
            >
              <ul>
                {lapsedGating.map((s) => (
                  <li key={s.record.credential.id}>
                    {s.record.displayName} ({s.record.credential.jurisdiction}) — expired{' '}
                    <Mono>{s.licence.expiresOn}</Mono>, gating{' '}
                    {countOf(s.liveGating.length, 'live matter', 'live matters')}
                  </li>
                ))}
              </ul>
              <p>
                A lapsed standing raises no error anywhere. The advice gate simply stops releasing
                recommendations through it and downgrades them to assessments, silently and
                correctly. See the <Link href={link('/representatives')}>representative roster</Link>
                .
              </p>
            </Callout>
          ) : null}

          {downgradedCount > 0 ? (
            <Callout
              tone="warn"
              title={`Advice to the applicant is currently refused on ${countOf(downgradedCount, 'live matter', 'live matters')}`}
            >
              <ul>
                {downgrading.flatMap((s) =>
                  s.downgrading.map((m) => (
                    <li key={`${s.record.credential.id}:${m.matterId}`}>
                      <Link href={link(`/matters/${m.matterId}`)}>{m.reference}</Link> —{' '}
                      {m.toApplicant.allowed ? null : m.toApplicant.reason}
                    </li>
                  )),
                )}
              </ul>
            </Callout>
          ) : null}

          {unrepresented.length > 0 || dangling.length > 0 ? (
            <Callout tone="warn" title="Matters with nobody accountable">
              {unrepresented.length > 0 ? (
                <p>
                  {countOf(unrepresented.length, 'live matter has', 'live matters have')} no
                  representative assigned: {unrepresented.map((m) => m.reference).join(', ')}.
                </p>
              ) : null}
              {dangling.length > 0 ? (
                <p>
                  {countOf(dangling.length, 'matter names', 'matters name')} a representative who is
                  not on the roster:{' '}
                  {dangling.map((d) => `${d.matter.reference} → ${d.representativeId}`).join(', ')}.
                </p>
              ) : null}
            </Callout>
          ) : null}

          <Section
            id="time-critical"
            title="Time-critical"
            count={`${urgent.length} at or past the line · ${approaching.length} approaching`}
            note={
              <>
                Dates set by an authority, by a cited acceptance rule, or by someone on the file.
                The bands — {CRITICAL_WINDOW_DAYS} days and {APPROACHING_WINDOW_DAYS} days — are
                this console&rsquo;s triage thresholds, not anybody&rsquo;s law. Anything already
                passed sorts to the top, because a missed date is more urgent than an imminent one.
              </>
            }
          >
            {urgent.length === 0 ? (
              <EmptyState title="Nothing is inside the critical window.">
                <p>
                  {approaching.length > 0
                    ? `${countOf(approaching.length, 'deadline is', 'deadlines are')} between ${CRITICAL_WINDOW_DAYS + 1} and ${APPROACHING_WINDOW_DAYS} days out; each appears on its own matter.`
                    : 'No dated obligation on any live matter falls inside the next two weeks.'}
                </p>
              </EmptyState>
            ) : (
              <TableWrap>
                <table>
                  <caption>
                    Deadlines at or inside {CRITICAL_WINDOW_DAYS} days of {asOf.date}, plus anything
                    already passed. Soonest first.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">When</th>
                      <th scope="col">Kind</th>
                      <th scope="col">What</th>
                      <th scope="col">Matter</th>
                      <th scope="col">Cites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgent.map((d) => (
                      <tr key={d.id}>
                        <td className={`${monoCell} ${nowrapCell}`}>{d.on}</td>
                        <td className={nowrapCell}>
                          <Badge tone={severityTone(d.severity)}>
                            {relativeDays(d.daysRemaining)}
                          </Badge>
                        </td>
                        <td className={nowrapCell}>
                          <Meta>{humanise(d.kind)}</Meta>
                        </td>
                        <td>
                          {d.label}
                          <Detail>{d.detail}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          {d.matterId === null ? (
                            <Link href={link('/representatives')}>Roster</Link>
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
            title="Blocked, and on whom"
            count={`${allBlockers.length} across ${dist.live} live matters`}
            note="Grouped by who has to move. A file can be blocked on more than one party at once, and each is listed separately rather than collapsed into a single status."
          >
            {ownerGroups.length === 0 ? (
              <EmptyState title="Nothing is blocked.">
                <p>Every live matter has an owner who can act and no outstanding defect.</p>
              </EmptyState>
            ) : (
              ownerGroups.map((group) => (
                <div key={group.owner}>
                  <Subhead id={`blocked-${group.owner}`}>
                    {humanise(group.owner)} · {group.blockers.length}
                  </Subhead>
                  <TableWrap>
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Matter</th>
                          <th scope="col">File last moved</th>
                          <th scope="col">Blocker</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.blockers.map((b) => (
                          <tr key={b.id}>
                            <td className={nowrapCell}>
                              <Link href={link(`/matters/${b.matterId}`)}>{b.matterReference}</Link>
                              <Detail>{b.matterTitle}</Detail>
                            </td>
                            <td className={nowrapCell}>
                              {b.since === undefined ? (
                                <Meta>no state change recorded</Meta>
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
                                    {b.ageDays === undefined ? null : relativeDays(-b.ageDays)}
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
            title="By phase and status"
            count={`${dist.total} total · ${dist.live} live · ${dist.closed} closed`}
            note="Every phase is listed, including the empty ones — an empty phase means nothing is at that stage, which is information. Only statuses that actually occur get a column."
          >
            <TableWrap>
              <table>
                <caption>
                  Phase order is the sequential model in <Mono>@meridian/core</Mono>: work in a later
                  phase stays locked while an earlier one is incomplete.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Phase</th>
                    <th scope="col" className={numericCell}>
                      Total
                    </th>
                    {dist.occupiedStatuses.map((status) => (
                      <th key={status} scope="col" className={numericCell}>
                        {humanise(status)}
                      </th>
                    ))}
                    <th scope="col">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {dist.rows.map((row) => (
                    <tr key={row.phase}>
                      <th scope="row">
                        <Meta>{phaseIndex(row.phase) + 1}.</Meta> {humanise(row.phase)}
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
                          label={`${humanise(row.phase)} matters`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">All phases</th>
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
            title="Work in hand"
            count={`${actionable} actionable`}
            note="Counted after the phase gate and the dependency graph have been resolved, so 'available' means genuinely startable now rather than merely unfinished. Terminal matters are excluded."
          >
            {work.length === 0 ? (
              <EmptyState title="No tasks on any live matter." />
            ) : (
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Owner</th>
                      <th scope="col" className={numericCell}>
                        Available
                      </th>
                      <th scope="col" className={numericCell}>
                        In progress
                      </th>
                      <th scope="col" className={numericCell}>
                        Still locked
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {work.map((row) => (
                      <tr key={row.assignee}>
                        <th scope="row">{humanise(row.assignee)}</th>
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
            title="What the caseload rests on"
            count={`${dependencies.length} catalog ${dependencies.length === 1 ? 'record' : 'records'}`}
            note={
              <>
                Live matters grouped by the catalog record they are assessed against. A record
                nobody has signed off can still produce an assessment — the applicant&rsquo;s own
                figures measured against the cited rule — but it can never appear in a
                recommendation.
              </>
            }
            actions={<Link href={link('/catalog')}>Open the review queue</Link>}
          >
            {unreviewedMatterCount > 0 ? (
              <Callout
                tone="warn"
                title={`${countOf(unreviewedMatterCount, 'live matter rests', 'live matters rest')} on catalog records nobody has signed off`}
              >
                <p>
                  This is the bottleneck, not a warning to dismiss. Until a licensed person reads a
                  record and their name is on it, the engine will not rank it, whatever it computes.
                </p>
              </Callout>
            ) : null}
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Pathway</th>
                    <th scope="col" className={numericCell}>
                      Live matters
                    </th>
                    <th scope="col">Review</th>
                    <th scope="col">Status as at {asOf.date}</th>
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
                            ? 'Not in the catalog. No criteria or citations can be resolved for it.'
                            : dep.pathway.name.en}
                        </Detail>
                      </td>
                      <td className={numericCell}>{dep.liveMatters.length}</td>
                      <td>
                        {dep.pathway === null ? (
                          <Badge tone="danger">Unresolvable</Badge>
                        ) : dep.reviewed ? (
                          <Badge tone="ok">Counsel reviewed</Badge>
                        ) : (
                          <Badge tone="warn">{humanise(dep.pathway.reviewStatus)}</Badge>
                        )}
                      </td>
                      <td>
                        {dep.pathway === null ? (
                          <Meta>—</Meta>
                        ) : dep.closedAsOf ? (
                          <Badge tone="neutral">Closed to new applications</Badge>
                        ) : (
                          <Badge tone="ok">Open</Badge>
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
            title="Phase model"
            note="The sequential model every matter moves through. The ordering is what makes task unlocking meaningful: a task in a later phase stays locked while earlier work is outstanding."
          >
            <ol>
              {MATTER_PHASE_ORDER.map((phase) => (
                <li key={phase}>
                  {humanise(phase)} —{' '}
                  {countOf(dist.rows.find((r) => r.phase === phase)?.total ?? 0, 'matter', 'matters')}
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </>
  );
}
