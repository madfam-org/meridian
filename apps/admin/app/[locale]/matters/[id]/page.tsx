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
 *
 * Everything the file itself says — its title, its tasks' titles, the audit
 * summaries — is record content and is rendered verbatim with the record's own
 * `lang`. Everything a package says about it — the gate's reason, a legalisation
 * rationale, a freshness rationale — is that package's own words, marked rather
 * than paraphrased. Only the console's own prose is translated.
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
  AUDIENCE_LABEL,
  AUDIT_ACTOR_LABEL,
  AUDIT_EVENT_LABEL,
  DISCLOSURE_CLASS_LABEL,
  DOCUMENT_KIND_LABEL,
  DOCUMENT_STATUS_LABEL,
  FRESHNESS_VERDICT_LABEL,
  LEGALISATION_ROUTE_LABEL,
  MATTER_PHASE_LABEL,
  PATHWAY_KIND_LABEL,
  TASK_ASSIGNEE_LABEL,
} from '@/lib/labels';
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
  CredentialName,
  MatterStatusBadge,
  PathwayStatusBadge,
  ReviewStatusBadge,
  StalenessBadge,
  TaskStatusBadge,
} from '@/components/state';
import {
  Badge,
  Callout,
  Definitions,
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

/** Prose produced by `@meridian/core` and `@meridian/documents`. Marked, never rewritten. */
const PACKAGE_LANG = 'en';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = parseLocale(rawLocale);
  if (locale === null) notFound();
  const record = findMatter(loadRecords(), id);
  return {
    title: record === null ? pick(UI.matterNotFound, locale) : record.reference,
    alternates: localeAlternates(`/matters/${id}`),
  };
}

export default async function MatterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = parseLocale(rawLocale);
  if (locale === null) notFound();

  const query = await searchParams;
  const asOf = resolveAsOf(query[AS_OF_PARAM]);
  const records = loadRecords();
  const record = findMatter(records, id);
  if (record === null) notFound();

  const { matter } = record;
  const link = linker(locale, asOf);
  const recordLang = records.recordLanguage;
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
  const freshnessDate = record.targetSubmissionDate;

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
        locale={locale}
        title={record.reference}
        description={
          <Rich
            text={fill(UI.matterDescription, locale, {
              title: record.title,
              opened: matter.openedOn,
              closed:
                matter.closedOn === undefined
                  ? ''
                  : fill(UI.matterClosedOn, locale, { date: matter.closedOn }),
              jurisdiction: matter.targetJurisdiction,
              pathway: matter.pathwayId,
            })}
          />
        }
      >
        <p>
          <MatterStatusBadge status={matter.status} locale={locale} />{' '}
          <Badge tone="neutral">
            {fill(UI.matterPhaseBadge, locale, {
              index: currentPhaseIndex + 1,
              total: MATTER_PHASE_ORDER.length,
              phase: pick(MATTER_PHASE_LABEL[matter.phase], locale),
            })}
          </Badge>{' '}
          {terminal ? <Badge tone="neutral">{pick(UI.matterTerminal, locale)}</Badge> : null}
        </p>
      </PageHeader>

      {pathway === null ? (
        <Callout
          tone="danger"
          title={fill(UI.matterPathwayMissingTitle, locale, { pathway: matter.pathwayId })}
        >
          <p>{pick(UI.matterPathwayMissingBody, locale)}</p>
        </Callout>
      ) : statusOn(pathway, asOf.date) === 'closed' ? (
        <Callout
          tone="info"
          title={fill(UI.matterRouteClosedTitle, locale, {
            date: pathway.closedOn ?? pick(UI.catalogRecordUnrecordedDate, locale),
          })}
        >
          {pathway.closureNote === undefined ? null : (
            <p>{pick(pathway.closureNote, locale)}</p>
          )}
          <p>{pick(UI.matterRouteClosedBody, locale)}</p>
        </Callout>
      ) : null}

      <Section
        id="summary"
        title={pick(UI.matterFileTitle, locale)}
        note={pick(UI.matterFileNote, locale)}
      >
        <Definitions
          items={[
            { term: pick(UI.matterId, locale), value: <Mono>{matter.id}</Mono> },
            {
              term: pick(UI.colApplicant, locale),
              value:
                applicant === null ? (
                  <Badge tone="danger">
                    {fill(UI.matterApplicantMissing, locale, { id: matter.applicantId })}
                  </Badge>
                ) : (
                  <>
                    {applicantName(applicant, locale)} <Meta>({applicant.reference})</Meta>
                    <Detail>
                      {fill(UI.matterHolds, locale, {
                        list: applicant.nationalities.join(', '),
                      })}
                      {applicant.dateOfBirth === undefined
                        ? pick(UI.matterNoDob, locale)
                        : fill(UI.matterBorn, locale, { date: applicant.dateOfBirth })}
                    </Detail>
                  </>
                ),
            },
            {
              term: pick(UI.matterClaimedNationality, locale),
              value: <Mono>{matter.claimedNationality}</Mono>,
            },
            {
              term: pick(UI.matterTargetJurisdiction, locale),
              value: <Mono>{matter.targetJurisdiction}</Mono>,
            },
            {
              term: pick(UI.matterReceivingRegion, locale),
              value:
                record.receivingRegion === undefined ? (
                  <Meta>{pick(UI.matterNotSubNational, locale)}</Meta>
                ) : (
                  <Mono>{record.receivingRegion}</Mono>
                ),
            },
            {
              term: pick(UI.colRepresentative, locale),
              value:
                rep === null ? (
                  matter.representativeId === null ? (
                    <Badge tone="warn">{pick(UI.matterUnassignedNobody, locale)}</Badge>
                  ) : (
                    <Badge tone="danger">
                      {fill(UI.matterRepNotOnRoster, locale, { id: matter.representativeId })}
                    </Badge>
                  )
                ) : (
                  <>
                    <Link href={link('/representatives')}>{rep.displayName}</Link>{' '}
                    <Meta>
                      <CredentialName
                        credential={rep.credential.credential}
                        locale={locale}
                      />{' '}
                      · {rep.credential.jurisdiction} · {rep.credential.licenceNumber}
                    </Meta>
                    <Detail lang={recordLang}>{rep.regulator}</Detail>
                  </>
                ),
            },
            {
              term: pick(UI.matterCurrentAuthorisation, locale),
              value:
                record.statusExpiresOn === undefined ? (
                  <Meta>{pick(UI.matterNotEstablished, locale)}</Meta>
                ) : (
                  <>
                    <Mono>{record.statusExpiresOn}</Mono>{' '}
                    <Meta>
                      ({relativeDays(locale, diffDays(asOf.date, record.statusExpiresOn))})
                    </Meta>
                  </>
                ),
            },
            {
              term: pick(UI.matterPlannedFiling, locale),
              value:
                freshnessDate === undefined ? (
                  <Meta>{fill(UI.matterNoFilingDate, locale, { date: asOf.date })}</Meta>
                ) : (
                  <>
                    <Mono>{freshnessDate}</Mono>{' '}
                    <Meta>({relativeDays(locale, diffDays(asOf.date, freshnessDate))})</Meta>
                  </>
                ),
            },
            {
              term: pick(UI.matterDocumentLanguage, locale),
              value: <Mono>{record.defaultDocumentLanguage}</Mono>,
            },
          ]}
        />
      </Section>

      <Section
        id="disclosure"
        title={pick(UI.matterDisclosureTitle, locale)}
        note={fill(UI.matterDisclosureNote, locale, { date: asOf.date })}
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">{pick(UI.colAudience, locale)}</th>
                <th scope="col">{pick(UI.colAdvice, locale)}</th>
                <th scope="col">{pick(UI.colGateReason, locale)}</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map(({ audience, decision }) => (
                <tr key={audience}>
                  <th scope="row" className={nowrapCell}>
                    {pick(AUDIENCE_LABEL[audience], locale)}
                  </th>
                  <td className={nowrapCell}>
                    {decision.allowed ? (
                      <Badge tone="ok">{pick(UI.released, locale)}</Badge>
                    ) : (
                      <Badge tone="warn">
                        {fill(UI.downgradedTo, locale, {
                          class: pick(
                            DISCLOSURE_CLASS_LABEL[decision.downgradeTo],
                            locale,
                          ).toLocaleLowerCase(locale),
                        })}
                      </Badge>
                    )}
                  </td>
                  <td>
                    {decision.allowed ? (
                      <Meta>
                        {audience === 'practitioner' || audience === 'platform_operator'
                          ? pick(UI.matterGateProfessional, locale)
                          : pick(UI.matterGateLiveRepresentative, locale)}
                      </Meta>
                    ) : (
                      <span lang={PACKAGE_LANG}>{decision.reason}</span>
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
        title={pick(UI.matterPhaseTitle, locale)}
        count={fill(UI.matterPhaseCount, locale, {
          index: currentPhaseIndex + 1,
          total: MATTER_PHASE_ORDER.length,
        })}
        note={pick(UI.matterPhaseNote, locale)}
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
                {pick(MATTER_PHASE_LABEL[phase], locale)}
                <Meta>
                  {done
                    ? pick(UI.matterPhasePassed, locale)
                    : current
                      ? pick(UI.matterPhaseCurrent, locale)
                      : pick(UI.matterPhaseAhead, locale)}
                </Meta>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section
        id="tasks"
        title={pick(UI.matterTasksTitle, locale)}
        count={fill(UI.matterTasksCount, locale, {
          tasks: countOf(locale, tasks.length, COUNTS.task),
          cycles: cycles.length,
        })}
        note={pick(UI.matterTasksNote, locale)}
      >
        {cycles.length > 0 ? (
          <Callout tone="danger" title={pick(UI.matterCycleTitle, locale)}>
            <p>
              {fill(UI.matterCycleBody, locale, {
                cycles: cycles.map((c) => c.join(' → ')).join('; '),
              })}
            </p>
          </Callout>
        ) : null}

        {tasks.length === 0 ? (
          <EmptyState title={pick(UI.matterNoTasks, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colTask, locale)}</th>
                  <th scope="col">{pick(UI.colPhase, locale)}</th>
                  <th scope="col">{pick(UI.colOwner, locale)}</th>
                  <th scope="col">{pick(UI.colStatus, locale)}</th>
                  <th scope="col">{pick(UI.colDue, locale)}</th>
                  <th scope="col">{pick(UI.colDependsOn, locale)}</th>
                  <th scope="col">{pick(UI.colCites, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <th scope="row">
                      <span lang={recordLang}>{task.title}</span>
                      <Detail>
                        <Mono>{task.id}</Mono>
                      </Detail>
                    </th>
                    <td className={nowrapCell}>
                      <Meta>{phaseIndex(task.phase) + 1}.</Meta>{' '}
                      {pick(MATTER_PHASE_LABEL[task.phase], locale)}
                    </td>
                    <td className={nowrapCell}>
                      {pick(TASK_ASSIGNEE_LABEL[task.assignee], locale)}
                    </td>
                    <td className={nowrapCell}>
                      <TaskStatusBadge status={task.status} locale={locale} />
                    </td>
                    <td className={nowrapCell}>
                      {task.dueOn === undefined ? (
                        <Meta>—</Meta>
                      ) : (
                        <>
                          <Mono>{task.dueOn}</Mono>
                          <Detail>
                            {relativeDays(locale, diffDays(asOf.date, task.dueOn))}
                          </Detail>
                        </>
                      )}
                    </td>
                    <td className={monoCell}>
                      {task.dependsOn.length === 0 ? <Meta>—</Meta> : task.dependsOn.join(', ')}
                    </td>
                    <td className={monoCell}>
                      {task.citationIds.length === 0 ? (
                        <Meta>
                          <abbr title={pick(UI.matterNoCitationTitle, locale)}>
                            {pick(UI.matterNoCitation, locale)}
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
        title={pick(UI.matterDocumentsTitle, locale)}
        count={fill(UI.matterDocumentsCount, locale, {
          present: totals.present,
          held: totals.held,
        })}
        note={
          <Rich
            text={fill(UI.matterDocumentsNote, locale, {
              date:
                freshnessDate === undefined
                  ? fill(UI.matterDocumentsNoFilingDate, locale, { date: asOf.date })
                  : freshnessDate,
            })}
          />
        }
      >
        {totals.freshnessUnknown > 0 ? (
          <Callout
            tone="info"
            title={fill(UI.matterFreshnessUnknownTitle, locale, {
              documents: countOf(locale, totals.freshnessUnknown, COUNTS.documentHas),
            })}
          >
            <p>{pick(UI.matterFreshnessUnknownBody, locale)}</p>
          </Callout>
        ) : null}

        {routings.length === 0 ? (
          <EmptyState title={pick(UI.matterNoDocuments, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colDocument, locale)}</th>
                  <th scope="col">{pick(UI.colIssued, locale)}</th>
                  <th scope="col">{pick(UI.colStatus, locale)}</th>
                  <th scope="col">{pick(UI.colLegalisation, locale)}</th>
                  <th scope="col">{pick(UI.colTranslation, locale)}</th>
                  <th scope="col">{pick(UI.colOnFilingDay, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {routings.map((routing) => {
                  const { document: doc, freshness } = routing;
                  return (
                    <tr key={doc.id}>
                      <th scope="row">
                        {pick(DOCUMENT_KIND_LABEL[doc.kind], locale)}
                        <Detail>
                          <Rich
                            text={fill(UI.matterDocumentDetail, locale, {
                              id: doc.id,
                              country: doc.issuingCountry,
                              language: doc.translation.sourceLanguage,
                            })}
                          />
                        </Detail>
                      </th>
                      <td className={nowrapCell}>
                        <Mono>{doc.issuedOn ?? '—'}</Mono>
                        <Detail>
                          {doc.expiresOn === undefined
                            ? pick(UI.matterNoPrintedExpiry, locale)
                            : fill(UI.matterExpires, locale, { date: doc.expiresOn })}
                        </Detail>
                      </td>
                      <td className={nowrapCell}>
                        <Badge tone={routing.present ? 'ok' : 'warn'}>
                          {pick(DOCUMENT_STATUS_LABEL[doc.status], locale)}
                        </Badge>
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
                          {pick(LEGALISATION_ROUTE_LABEL[routing.legalisation.route], locale)}
                          {routing.legalisationSatisfied
                            ? ` · ${pick(UI.matterDone, locale)}`
                            : ` · ${pick(UI.matterOutstanding, locale)}`}
                        </Badge>
                        <Detail lang={PACKAGE_LANG}>{routing.legalisation.rationale}</Detail>
                      </td>
                      <td>
                        <Badge tone={routing.translationSatisfied ? 'ok' : 'warn'}>
                          {routing.translation.required
                            ? pick(UI.matterTranslationRequired, locale)
                            : pick(UI.matterTranslationNotRequired, locale)}
                          {routing.translationSatisfied
                            ? ` · ${pick(UI.matterTranslationSatisfied, locale)}`
                            : ` · ${pick(UI.matterOutstanding, locale)}`}
                        </Badge>
                        <Detail lang={PACKAGE_LANG}>{routing.translation.rationale}</Detail>
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
                          {pick(FRESHNESS_VERDICT_LABEL[freshness.verdict], locale)}
                        </Badge>
                        <Detail lang={PACKAGE_LANG}>{freshness.rationale}</Detail>
                        {freshness.obtainNoEarlierThan === undefined ? null : (
                          <Detail>
                            <Rich
                              text={fill(UI.matterReplacementAfter, locale, {
                                date: freshness.obtainNoEarlierThan,
                              })}
                            />
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

        <Subhead>{pick(UI.matterRoutingConfirmTitle, locale)}</Subhead>
        {totals.needsVerification === 0 ? (
          <p>
            <Meta>{pick(UI.matterRoutingNoneFlagged, locale)}</Meta>
          </p>
        ) : (
          <ul>
            {routings
              .filter((r) => r.needsVerification)
              .map((r) => (
                <li key={r.document.id}>
                  <Mono>{r.document.id}</Mono> — {pick(DOCUMENT_KIND_LABEL[r.document.kind], locale)}
                  :{' '}
                  {r.legalisation.requiresVerification
                    ? pick(UI.matterRoutingLegalisation, locale)
                    : null}
                  {r.legalisation.requiresVerification && r.translation.requiresVerification
                    ? pick(UI.matterRoutingAnd, locale)
                    : null}
                  {r.translation.requiresVerification
                    ? pick(UI.matterRoutingTranslation, locale)
                    : null}
                  {pick(UI.matterRoutingNeedsConfirming, locale)}
                </li>
              ))}
          </ul>
        )}
      </Section>

      {pathway === null ? null : (
        <Section
          id="catalog"
          title={pick(UI.matterCatalogTitle, locale)}
          count={fill(UI.matterCatalogCount, locale, {
            criteria: pathway.criteria.length,
            citations: pathway.citations.length,
          })}
          actions={
            <Link href={link(`/catalog/${pathway.id}`)}>
              {pick(UI.matterCatalogAction, locale)}
            </Link>
          }
          note={pick(UI.matterCatalogNote, locale)}
        >
          <Definitions
            items={[
              { term: pick(UI.fieldPathway, locale), value: <Mono>{pathway.id}</Mono> },
              { term: pick(UI.fieldVersion, locale), value: <Mono>{pathway.version}</Mono> },
              { term: pick(UI.fieldName, locale), value: pick(pathway.name, locale) },
              {
                term: pick(UI.fieldKind, locale),
                value: pick(PATHWAY_KIND_LABEL[pathway.kind], locale),
              },
              {
                term: fill(UI.fieldStatusAsAt, locale, { date: asOf.date }),
                value: (
                  <PathwayStatusBadge status={statusOn(pathway, asOf.date)} locale={locale} />
                ),
              },
              {
                term: pick(UI.fieldReview, locale),
                value: <ReviewStatusBadge status={pathway.reviewStatus} locale={locale} />,
              },
              {
                term: pick(UI.fieldCitationFreshness, locale),
                value: (
                  <>
                    {pathway.citations.map((citation) => (
                      <span key={citation.id} style={{ marginRight: '0.4rem' }}>
                        <Mono>{citation.id}</Mono>{' '}
                        <StalenessBadge
                          band={staleness(citation, asOf.date)}
                          ageDays={diffDays(citation.verifiedOn, asOf.date)}
                          locale={locale}
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
        title={pick(UI.matterHistoryTitle, locale)}
        count={countOf(locale, history.length, COUNTS.entry)}
        actions={
          <Link href={link(`/audit?matter=${encodeURIComponent(matter.id)}`)}>
            {pick(UI.matterHistoryAction, locale)}
          </Link>
        }
        note={pick(UI.matterHistoryNote, locale)}
      >
        {history.length === 0 ? (
          <EmptyState title={pick(UI.matterHistoryEmpty, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col" className={numericCell}>
                    #
                  </th>
                  <th scope="col">{pick(UI.auditWhen, locale)}</th>
                  <th scope="col">{pick(UI.auditFilterActor, locale)}</th>
                  <th scope="col">{pick(UI.auditFilterEvent, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {history.map(({ seq, entry, ageDays }) => (
                  <tr key={entry.id}>
                    <td className={`${numericCell} ${monoCell}`}>{seq}</td>
                    <td className={nowrapCell}>
                      <Mono>{entry.on}</Mono>
                      <Detail>
                        {entry.at} {entry.timezone} · {relativeDays(locale, -ageDays)}
                      </Detail>
                    </td>
                    <td className={nowrapCell}>
                      <Mono>{entry.actorId}</Mono>
                      <Detail>{pick(AUDIT_ACTOR_LABEL[entry.actorKind], locale)}</Detail>
                    </td>
                    <td>
                      <Badge tone={entry.kind === 'disclosure_downgraded' ? 'warn' : 'neutral'}>
                        {pick(AUDIT_EVENT_LABEL[entry.kind], locale)}
                      </Badge>{' '}
                      <span lang={recordLang}>{entry.summary}</span>
                      {entry.detail === undefined ? null : (
                        <Detail lang={recordLang}>{entry.detail}</Detail>
                      )}
                      {entry.disclosure === undefined ? null : (
                        <Detail>
                          <Rich
                            text={fill(UI.auditProducedAs, locale, {
                              produced: pick(
                                DISCLOSURE_CLASS_LABEL[entry.disclosure.produced],
                                locale,
                              ).toLocaleLowerCase(locale),
                              released: pick(
                                DISCLOSURE_CLASS_LABEL[entry.disclosure.released],
                                locale,
                              ).toLocaleLowerCase(locale),
                              audience: entry.disclosure.audience,
                            })}
                          />
                          {entry.disclosure.reason === undefined ? (
                            '.'
                          ) : (
                            <>
                              {': '}
                              <span lang={PACKAGE_LANG}>{entry.disclosure.reason}</span>
                            </>
                          )}
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
