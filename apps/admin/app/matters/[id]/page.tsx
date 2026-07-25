/**
 * One matter, in full.
 *
 * The three things the brief asked for — phase machine, task graph, audit trail
 * — plus the two that make them mean something on a real file: what the advice
 * gate would do for each audience, and what state every document is actually in
 * once the legalisation, translation and freshness rules have been applied.
 *
 * The disclosure panel is the most important block on the page and the least
 * obvious. `canRelease` is run for all four audiences against this matter's own
 * representative and jurisdiction, so a practitioner can see the shape of the
 * boundary rather than being told about it: advice reaches them because they are
 * the professional, and the same output reaching their client depends on a
 * credential that may have quietly lapsed.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MATTER_PHASE_ORDER,
  canRelease,
  diffDays,
  findTaskCycles,
  isTerminal,
  phaseIndex,
  staleness,
  type Audience,
} from '@meridian/core';
import { pathwayById, statusOn } from '@meridian/pathways';
import { resolvedTasks } from '@/lib/caseload';
import { AS_OF_PARAM, resolveAsOf, withAsOf } from '@/lib/clock';
import { countOf, humanise, relativeDays } from '@/lib/format';
import { documentRouting, documentTotals } from '@/lib/matter-documents';
import { matterHistory } from '@/lib/audit-trail';
import {
  applicantName,
  findApplicant,
  findMatter,
  findRepresentative,
  loadRecords,
} from '@/lib/records';
import { PageHeader } from '@/components/page';
import {
  MatterStatusBadge,
  PathwayStatusBadge,
  ReviewStatusBadge,
  StalenessBadge,
  TaskStatusBadge,
  credentialLabel,
} from '@/components/state';
import {
  Badge,
  Callout,
  Definitions,
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
  phaseOrdinalClass,
  phaseStepClass,
  phaseStepCurrentClass,
  phaseStepDoneClass,
  phaseTrackClass,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

/** Every audience the gate knows about, so the panel cannot quietly omit one. */
const AUDIENCES: readonly Audience[] = [
  'applicant',
  'corporate_sponsor',
  'practitioner',
  'platform_operator',
];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = findMatter(loadRecords(), id);
  return { title: record === null ? 'Matter not found' : record.reference };
}

export default async function MatterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const asOf = resolveAsOf(query[AS_OF_PARAM]);
  const records = loadRecords();
  const record = findMatter(records, id);
  if (record === null) notFound();

  const { matter } = record;
  const link = (href: string): string => withAsOf(href, asOf);
  const applicant = findApplicant(records, matter.applicantId);
  const rep = findRepresentative(records, matter.representativeId);
  const pathway = pathwayById(matter.pathwayId);
  const tasks = resolvedTasks(record);
  const cycles = findTaskCycles(record.tasks);
  const routings = documentRouting(record, asOf.date);
  const totals = documentTotals(routings);
  const history = matterHistory(records, matter.id, asOf.date);
  const currentPhaseIndex = phaseIndex(matter.phase);
  const terminal = isTerminal(matter.status);

  const decisions = AUDIENCES.map((audience) => ({
    audience,
    decision: canRelease('advice', {
      audience,
      jurisdiction: matter.targetJurisdiction,
      representative: rep?.credential ?? null,
      forConsideration: true,
      asOf: asOf.date,
    }),
  }));

  return (
    <>
      <PageHeader
        path={`/matters/${matter.id}`}
        asOf={asOf}
        title={record.reference}
        description={
          <>
            {record.title}. Opened {matter.openedOn}
            {matter.closedOn === undefined ? '' : `, closed ${matter.closedOn}`}. Filed in{' '}
            {matter.targetJurisdiction} under <Mono>{matter.pathwayId}</Mono>.
          </>
        }
      >
        <p>
          <MatterStatusBadge status={matter.status} />{' '}
          <Badge tone="neutral">
            Phase {currentPhaseIndex + 1}/6 · {humanise(matter.phase)}
          </Badge>{' '}
          {terminal ? <Badge tone="neutral">Terminal — no further automated work</Badge> : null}
        </p>
      </PageHeader>

      {pathway === null ? (
        <Callout tone="danger" title={`Pathway ${matter.pathwayId} is not in the catalog`}>
          <p>
            No criteria, citations or durations resolve for this file, so nothing on this page can
            be measured against a rule. The record was either renamed or retired. Re-point the
            matter at a catalog record before assessing it.
          </p>
        </Callout>
      ) : statusOn(pathway, asOf.date) === 'closed' ? (
        <Callout tone="info" title={`This route was closed to new applications on ${pathway.closedOn}`}>
          <p>{pathway.closureNote?.en}</p>
          <p>
            A closed route does not invalidate an existing holder&rsquo;s status. Renewals and
            transitions have to be planned against a different record, which is why the catalog
            keeps closed pathways rather than deleting them.
          </p>
        </Callout>
      ) : null}

      <Section
        id="summary"
        title="File"
        note="The claimed nationality is stored separately from the nationalities held, because they are legally distinct: a route open to a national of one state is not open to a dual national who entered and holds residence as a national of another."
      >
        <Definitions
          items={[
            { term: 'Matter id', value: <Mono>{matter.id}</Mono> },
            {
              term: 'Applicant',
              value:
                applicant === null ? (
                  <Badge tone="danger">
                    {matter.applicantId} is not in the record set
                  </Badge>
                ) : (
                  <>
                    {applicantName(applicant)} <Meta>({applicant.reference})</Meta>
                    <Detail>
                      Holds {applicant.nationalities.join(', ')}
                      {applicant.dateOfBirth === undefined
                        ? '; date of birth not recorded'
                        : `; born ${applicant.dateOfBirth}`}
                    </Detail>
                  </>
                ),
            },
            { term: 'Claimed nationality', value: <Mono>{matter.claimedNationality}</Mono> },
            { term: 'Target jurisdiction', value: <Mono>{matter.targetJurisdiction}</Mono> },
            {
              term: 'Receiving region',
              value:
                record.receivingRegion === undefined ? (
                  <Meta>Not sub-national</Meta>
                ) : (
                  <Mono>{record.receivingRegion}</Mono>
                ),
            },
            {
              term: 'Representative',
              value:
                rep === null ? (
                  matter.representativeId === null ? (
                    <Badge tone="warn">Unassigned — nobody is accountable</Badge>
                  ) : (
                    <Badge tone="danger">
                      {matter.representativeId} is not on the roster
                    </Badge>
                  )
                ) : (
                  <>
                    <Link href={link('/representatives')}>{rep.displayName}</Link>{' '}
                    <Meta>
                      {credentialLabel(rep.credential.credential)} · {rep.credential.jurisdiction} ·{' '}
                      {rep.credential.licenceNumber}
                    </Meta>
                    <Detail>{rep.regulator}</Detail>
                  </>
                ),
            },
            {
              term: 'Current authorisation',
              value:
                record.statusExpiresOn === undefined ? (
                  <Meta>Not established</Meta>
                ) : (
                  <>
                    <Mono>{record.statusExpiresOn}</Mono>{' '}
                    <Meta>({relativeDays(diffDays(asOf.date, record.statusExpiresOn))})</Meta>
                  </>
                ),
            },
            {
              term: 'Planned filing',
              value:
                record.targetSubmissionDate === undefined ? (
                  <Meta>
                    Not set — freshness is projected to {asOf.date} instead, which speaks only to
                    today
                  </Meta>
                ) : (
                  <>
                    <Mono>{record.targetSubmissionDate}</Mono>{' '}
                    <Meta>
                      ({relativeDays(diffDays(asOf.date, record.targetSubmissionDate))})
                    </Meta>
                  </>
                ),
            },
            {
              term: 'Document language',
              value: <Mono>{record.defaultDocumentLanguage}</Mono>,
            },
          ]}
        />
      </Section>

      <Section
        id="disclosure"
        title="Advice boundary on this file"
        note={
          <>
            The real gate, run against this matter&rsquo;s own representative and jurisdiction as at{' '}
            {asOf.date}. Information and assessment are releasable to everyone everywhere; only
            advice — a recommendation, a ranking, or a prediction of outcome — is gated.
          </>
        }
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">Audience</th>
                <th scope="col">Advice</th>
                <th scope="col">Gate&rsquo;s reason</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map(({ audience, decision }) => (
                <tr key={audience}>
                  <th scope="row" className={nowrapCell}>
                    {humanise(audience)}
                  </th>
                  <td className={nowrapCell}>
                    {decision.allowed ? (
                      <Badge tone="ok">Released</Badge>
                    ) : (
                      <Badge tone="warn">Downgraded to {decision.downgradeTo}</Badge>
                    )}
                  </td>
                  <td>
                    {decision.allowed ? (
                      <Meta>
                        {audience === 'practitioner' || audience === 'platform_operator'
                          ? 'This audience is the professional, not the protected party.'
                          : 'A live representative authorised in this jurisdiction is attached.'}
                      </Meta>
                    ) : (
                      decision.reason
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section
        id="phase"
        title="Phase machine"
        count={`${currentPhaseIndex + 1} of ${MATTER_PHASE_ORDER.length}`}
        note="Phases are ordered and gating: a task in a later phase stays locked while an earlier phase has incomplete work. Completed phases are marked in text as well as in colour."
      >
        <ol className={phaseTrackClass}>
          {MATTER_PHASE_ORDER.map((phase, index) => {
            const done = index < currentPhaseIndex;
            const current = index === currentPhaseIndex;
            const className = done
              ? `${phaseStepClass} ${phaseStepDoneClass}`
              : current
                ? `${phaseStepClass} ${phaseStepCurrentClass}`
                : phaseStepClass;
            return (
              <li key={phase} className={className} aria-current={current ? 'step' : undefined}>
                <span className={phaseOrdinalClass}>{index + 1}</span>
                {humanise(phase)}
                <Meta>{done ? 'passed' : current ? 'current' : 'ahead'}</Meta>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section
        id="tasks"
        title="Task graph"
        count={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} · ${cycles.length} cycles`}
        note="Statuses shown after the phase gate and the dependency graph have been resolved. A task listed as available is genuinely startable now."
      >
        {cycles.length > 0 ? (
          <Callout tone="danger" title="Dependency cycle detected">
            <p>
              Nothing inside a cycle can ever unlock. {cycles.map((c) => c.join(' → ')).join('; ')}.
            </p>
          </Callout>
        ) : null}

        {tasks.length === 0 ? (
          <EmptyState title="No tasks have been generated for this matter." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Phase</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Status</th>
                  <th scope="col">Due</th>
                  <th scope="col">Depends on</th>
                  <th scope="col">Cites</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <th scope="row">
                      {task.title}
                      <Detail>
                        <Mono>{task.id}</Mono>
                      </Detail>
                    </th>
                    <td className={nowrapCell}>
                      <Meta>{phaseIndex(task.phase) + 1}.</Meta> {humanise(task.phase)}
                    </td>
                    <td className={nowrapCell}>{humanise(task.assignee)}</td>
                    <td className={nowrapCell}>
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className={nowrapCell}>
                      {task.dueOn === undefined ? (
                        <Meta>—</Meta>
                      ) : (
                        <>
                          <Mono>{task.dueOn}</Mono>
                          <Detail>{relativeDays(diffDays(asOf.date, task.dueOn))}</Detail>
                        </>
                      )}
                    </td>
                    <td className={monoCell}>
                      {task.dependsOn.length === 0 ? <Meta>—</Meta> : task.dependsOn.join(', ')}
                    </td>
                    <td className={monoCell}>
                      {task.citationIds.length === 0 ? (
                        <Meta>
                          <abbr title="A firm-internal step with no legal rule behind it.">
                            none
                          </abbr>
                        </Meta>
                      ) : (
                        task.citationIds.join(', ')
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
        id="documents"
        title="Documents"
        count={`${totals.present} of ${totals.held} in the folder`}
        note={
          <>
            Legalisation and translation routing come from <Mono>@meridian/documents</Mono>.
            Freshness is projected to{' '}
            {record.targetSubmissionDate === undefined
              ? `${asOf.date} because no filing date is set`
              : record.targetSubmissionDate}
            , not to today — a certificate that is current now and out of its window on filing day
            passes every check except the one that matters.
          </>
        }
      >
        {totals.freshnessUnknown > 0 ? (
          <Callout
            tone="info"
            title={`${countOf(totals.freshnessUnknown, 'document has', 'documents have')} no acceptance window in the catalog`}
          >
            <p>
              Unchecked is not the same as acceptable. These are reported separately rather than
              counted as fine.
            </p>
          </Callout>
        ) : null}

        {routings.length === 0 ? (
          <EmptyState title="No documents are recorded on this matter." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Issued</th>
                  <th scope="col">Status</th>
                  <th scope="col">Legalisation</th>
                  <th scope="col">Translation</th>
                  <th scope="col">On filing day</th>
                </tr>
              </thead>
              <tbody>
                {routings.map((routing) => {
                  const { document: doc, freshness } = routing;
                  return (
                    <tr key={doc.id}>
                      <th scope="row">
                        {humanise(doc.kind)}
                        <Detail>
                          <Mono>{doc.id}</Mono> · issued by {doc.issuingCountry} · in{' '}
                          {doc.translation.sourceLanguage}
                        </Detail>
                      </th>
                      <td className={nowrapCell}>
                        <Mono>{doc.issuedOn ?? '—'}</Mono>
                        <Detail>
                          {doc.expiresOn === undefined ? 'no printed expiry' : `expires ${doc.expiresOn}`}
                        </Detail>
                      </td>
                      <td className={nowrapCell}>
                        <Badge tone={routing.present ? 'ok' : 'warn'}>{humanise(doc.status)}</Badge>
                      </td>
                      <td>
                        <Badge
                          tone={
                            routing.legalisation.route === 'unknown'
                              ? 'warn'
                              : routing.legalisationSatisfied
                                ? 'ok'
                                : 'warn'
                          }
                        >
                          {humanise(routing.legalisation.route)}
                          {routing.legalisationSatisfied ? ' · done' : ' · outstanding'}
                        </Badge>
                        <Detail>{routing.legalisation.rationale}</Detail>
                      </td>
                      <td>
                        <Badge tone={routing.translationSatisfied ? 'ok' : 'warn'}>
                          {routing.translation.required ? 'required' : 'not required'}
                          {routing.translationSatisfied ? ' · satisfied' : ' · outstanding'}
                        </Badge>
                        <Detail>{routing.translation.rationale}</Detail>
                      </td>
                      <td>
                        <Badge
                          tone={
                            freshness.verdict === 'valid'
                              ? 'ok'
                              : freshness.verdict === 'unknown'
                                ? 'info'
                                : 'danger'
                          }
                        >
                          {humanise(freshness.verdict)}
                        </Badge>
                        <Detail>{freshness.rationale}</Detail>
                        {freshness.obtainNoEarlierThan === undefined ? null : (
                          <Detail>
                            A replacement must be issued on or after{' '}
                            <Mono>{freshness.obtainNoEarlierThan}</Mono> to still be inside its
                            window on filing day.
                          </Detail>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        <Subhead>Routing that a human must confirm</Subhead>
        {totals.needsVerification === 0 ? (
          <p>
            <Meta>
              Every routing decision on this file came from a catalogued rule. None is flagged for
              confirmation.
            </Meta>
          </p>
        ) : (
          <ul>
            {routings
              .filter((r) => r.needsVerification)
              .map((r) => (
                <li key={r.document.id}>
                  <Mono>{r.document.id}</Mono> — {humanise(r.document.kind)}:{' '}
                  {r.legalisation.requiresVerification ? 'legalisation route' : null}
                  {r.legalisation.requiresVerification && r.translation.requiresVerification
                    ? ' and '
                    : null}
                  {r.translation.requiresVerification ? 'translation standard' : null} needs
                  confirming before the applicant acts on it.
                </li>
              ))}
          </ul>
        )}
      </Section>

      {pathway === null ? null : (
        <Section
          id="catalog"
          title="Catalog record"
          count={`${pathway.criteria.length} criteria · ${pathway.citations.length} citations`}
          actions={<Link href={link(`/catalog/${pathway.id}`)}>Open in the review queue</Link>}
          note="What this file is being measured against, and whether anybody has signed it off."
        >
          <Definitions
            items={[
              { term: 'Pathway', value: <Mono>{pathway.id}</Mono> },
              { term: 'Version', value: <Mono>{pathway.version}</Mono> },
              { term: 'Name', value: pathway.name.en },
              { term: 'Kind', value: humanise(pathway.kind) },
              {
                term: `Status as at ${asOf.date}`,
                value: <PathwayStatusBadge status={statusOn(pathway, asOf.date)} />,
              },
              { term: 'Review', value: <ReviewStatusBadge status={pathway.reviewStatus} /> },
              {
                term: 'Citation freshness',
                value: (
                  <>
                    {pathway.citations.map((citation) => (
                      <span key={citation.id} style={{ marginRight: '0.4rem' }}>
                        <Mono>{citation.id}</Mono>{' '}
                        <StalenessBadge
                          band={staleness(citation, asOf.date)}
                          ageDays={diffDays(citation.verifiedOn, asOf.date)}
                        />
                      </span>
                    ))}
                  </>
                ),
              },
            ]}
          />
        </Section>
      )}

      <Section
        id="history"
        title="Audit trail"
        count={`${history.length} ${history.length === 1 ? 'entry' : 'entries'}`}
        actions={
          <Link href={link(`/audit?matter=${encodeURIComponent(matter.id)}`)}>
            Open in the full trail
          </Link>
        }
        note="Oldest first, as a case history reads. Sequence numbers are positions in the whole firm-wide trail, not in this extract — entry 17 is entry 17 everywhere."
      >
        {history.length === 0 ? (
          <EmptyState title="Nothing has been recorded against this matter." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col" className={numericCell}>
                    #
                  </th>
                  <th scope="col">When</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Event</th>
                </tr>
              </thead>
              <tbody>
                {history.map(({ seq, entry, ageDays }) => (
                  <tr key={entry.id}>
                    <td className={`${numericCell} ${monoCell}`}>{seq}</td>
                    <td className={nowrapCell}>
                      <Mono>{entry.on}</Mono>
                      <Detail>
                        {entry.at} {entry.timezone} · {relativeDays(-ageDays)}
                      </Detail>
                    </td>
                    <td className={nowrapCell}>
                      <Mono>{entry.actorId}</Mono>
                      <Detail>{humanise(entry.actorKind)}</Detail>
                    </td>
                    <td>
                      <Badge tone={entry.kind === 'disclosure_downgraded' ? 'warn' : 'neutral'}>
                        {humanise(entry.kind)}
                      </Badge>{' '}
                      {entry.summary}
                      {entry.detail === undefined ? null : <Detail>{entry.detail}</Detail>}
                      {entry.disclosure === undefined ? null : (
                        <Detail>
                          Produced as <strong>{entry.disclosure.produced}</strong>, released as{' '}
                          <strong>{entry.disclosure.released}</strong> to the{' '}
                          {entry.disclosure.audience} audience
                          {entry.disclosure.reason === undefined
                            ? '.'
                            : `: ${entry.disclosure.reason}`}
                        </Detail>
                      )}
                    </td>
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
