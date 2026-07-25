/**
 * The append-only trail.
 *
 * Two properties make a trail evidence rather than a log, and this page depends
 * on both being true rather than asserting them:
 *
 * **Sequence numbers are permanent.** They are assigned once over the whole
 * trail, before any filter runs. Entry 17 is entry 17 under every filter and on
 * every screen, including the extract on a matter page. Numbering after
 * filtering would let the same event be #4 under one filter and #11 under
 * another, which destroys a reader's ability to notice that something is
 * missing.
 *
 * **A filtered view reports its own suppression.** The count of hidden entries
 * is always on screen. A filtered audit view that does not say what it is hiding
 * is a view that can be screenshotted to prove something untrue.
 *
 * Disclosure downgrades get their own filter because they are the entries a
 * regulator would ask about. When `canRelease` refuses advice, the applicant
 * simply receives an assessment; nothing else anywhere records that a
 * recommendation existed at all. These entries are that record, and they carry
 * both the class produced and the class released rather than only the outcome.
 */

import Link from 'next/link';
import { AS_OF_PARAM, resolveAsOf, withAsOf } from '@/lib/clock';
import {
  AUDIT_ACTOR_KINDS,
  AUDIT_EVENT_KINDS,
  auditView,
  filterFromParams,
  filterIsActive,
} from '@/lib/audit-trail';
import { countOf, humanise, relativeDays } from '@/lib/format';
import { auditDateBounds, loadRecords } from '@/lib/records';
import { PageHeader } from '@/components/page';
import { QUICK_FILTER_ATTRIBUTE } from '@/components/constants';
import {
  Badge,
  Callout,
  Detail,
  EmptyState,
  Meta,
  Mono,
  Section,
  TableWrap,
  fieldClass,
  filterActionsClass,
  filterBarClass,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';
import shell from '@/components/shell.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Audit' };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const asOf = resolveAsOf(params[AS_OF_PARAM]);
  const records = loadRecords();
  const filter = filterFromParams(get);
  const view = auditView(records, filter, asOf.date);
  const bounds = auditDateBounds(records);
  const active = filterIsActive(filter);
  const link = (href: string): string => withAsOf(href, asOf);

  const matterLabel = (matterId: string): string =>
    records.matters.find((m) => m.matter.id === matterId)?.reference ?? matterId;

  return (
    <>
      <PageHeader
        path="/audit"
        asOf={asOf}
        title="Audit trail"
        description={
          <>
            {countOf(view.all.length, 'entry', 'entries')}, {view.facets.disclosures} carrying a
            disclosure decision and {view.facets.downgrades} of those a downgrade.
            {bounds === null
              ? ''
              : ` Recorded between ${bounds.first} and ${bounds.last}.`}
          </>
        }
        preserve={{
          kind: filter.kind,
          actorKind: filter.actorKind,
          actor: filter.actorId,
          matter: filter.matterId,
          from: filter.from,
          to: filter.to,
          disclosure: filter.disclosureOnly === true ? '1' : undefined,
          q: filter.query,
        }}
      />

      {records.audit.length === 0 ? (
        <EmptyState title="Nothing has been recorded yet.">
          <p>
            The trail is append-only and starts empty. It is not seeded, and an empty trail is
            rendered as empty rather than as a sample history.
          </p>
        </EmptyState>
      ) : (
        <>
          <form className={filterBarClass} method="get" action="/audit">
            {asOf.source === 'url' ? (
              <input type="hidden" name={AS_OF_PARAM} value={asOf.date} />
            ) : null}

            <div className={fieldClass}>
              <label htmlFor="audit-q">Search</label>
              <input
                id="audit-q"
                name="q"
                type="search"
                size={24}
                defaultValue={filter.query ?? ''}
                placeholder="summary, detail, actor"
                {...{ [QUICK_FILTER_ATTRIBUTE]: 'true' }}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-kind">Event</label>
              <select id="audit-kind" name="kind" defaultValue={filter.kind ?? ''}>
                <option value="">Any</option>
                {AUDIT_EVENT_KINDS.map((kind) => {
                  const facet = view.facets.kinds.find((f) => f.value === kind);
                  return (
                    <option key={kind} value={kind} disabled={facet === undefined}>
                      {humanise(kind)} ({facet?.count ?? 0})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-actor-kind">Actor type</label>
              <select id="audit-actor-kind" name="actorKind" defaultValue={filter.actorKind ?? ''}>
                <option value="">Any</option>
                {AUDIT_ACTOR_KINDS.map((kind) => {
                  const facet = view.facets.actorKinds.find((f) => f.value === kind);
                  return (
                    <option key={kind} value={kind} disabled={facet === undefined}>
                      {humanise(kind)} ({facet?.count ?? 0})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-actor">Actor</label>
              <select id="audit-actor" name="actor" defaultValue={filter.actorId ?? ''}>
                <option value="">Any</option>
                {view.facets.actors.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {facet.value} ({facet.count})
                  </option>
                ))}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-matter">Matter</label>
              <select id="audit-matter" name="matter" defaultValue={filter.matterId ?? ''}>
                <option value="">Any</option>
                {view.facets.matters.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {matterLabel(facet.value)} ({facet.count})
                  </option>
                ))}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-from">From</label>
              <input
                id="audit-from"
                name="from"
                type="date"
                defaultValue={filter.from ?? ''}
                {...(bounds === null ? {} : { min: bounds.first, max: bounds.last })}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-to">To</label>
              <input
                id="audit-to"
                name="to"
                type="date"
                defaultValue={filter.to ?? ''}
                {...(bounds === null ? {} : { min: bounds.first, max: bounds.last })}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-disclosure">Disclosure</label>
              <select
                id="audit-disclosure"
                name="disclosure"
                defaultValue={filter.disclosureOnly === true ? '1' : ''}
              >
                <option value="">All entries</option>
                <option value="1">With a disclosure decision ({view.facets.disclosures})</option>
              </select>
            </div>

            <div className={filterActionsClass}>
              <button type="submit" className={`${shell.button} ${shell.buttonPrimary}`}>
                Filter
              </button>
              {active ? <a href={link('/audit')}>Clear</a> : null}
            </div>
          </form>

          {active ? (
            <Callout
              tone="info"
              title={`Filtered view — ${view.visible.length} of ${view.all.length} entries shown`}
            >
              <p>
                {countOf(view.suppressed, 'entry is', 'entries are')} hidden by the current filter.
                Sequence numbers are positions in the whole trail, so they stay stable as the filter
                changes — a gap in the numbering is the filter, never a missing record.
              </p>
            </Callout>
          ) : null}

          <Section
            id="entries"
            title="Entries"
            count={`${view.visible.length} shown, newest first`}
            note="Times are wall-clock in the recording tenant's own zone, alongside the civil date. Deliberately not an instant: an instant re-renders as a different calendar day depending on where it is read, and an audit entry that moves between days under the reader's feet is worse than useless."
          >
            {view.visible.length === 0 ? (
              <EmptyState title="No entry matches this filter.">
                <p>
                  {countOf(view.all.length, 'entry is', 'entries are')} in the trail.{' '}
                  <a href={link('/audit')}>Clear the filter</a> to see them.
                </p>
              </EmptyState>
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
                      <th scope="col">Matter</th>
                      <th scope="col">Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map(({ seq, entry, ageDays }) => (
                      <tr key={entry.id}>
                        <th scope="row" className={`${numericCell} ${monoCell}`}>
                          {seq}
                        </th>
                        <td className={nowrapCell}>
                          <Mono>{entry.on}</Mono>
                          <Detail>
                            {entry.at} {entry.timezone}
                          </Detail>
                          <Detail>{relativeDays(-ageDays)}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          <Mono>{entry.actorId}</Mono>
                          <Detail>{humanise(entry.actorKind)}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          {entry.matterId === null ? (
                            <Meta>firm-wide</Meta>
                          ) : (
                            <Link href={link(`/matters/${entry.matterId}`)}>
                              {matterLabel(entry.matterId)}
                            </Link>
                          )}
                        </td>
                        <td>
                          <Badge
                            tone={
                              entry.kind === 'disclosure_downgraded'
                                ? 'warn'
                                : entry.kind === 'integration_refused'
                                  ? 'refused'
                                  : entry.kind === 'disclosure_released'
                                    ? 'ok'
                                    : 'neutral'
                            }
                          >
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
                                : `. ${entry.disclosure.reason}`}
                              {entry.disclosure.citationIds === undefined ||
                              entry.disclosure.citationIds.length === 0
                                ? ''
                                : ` Cites ${entry.disclosure.citationIds.join(', ')}.`}
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

          <Section
            id="facets"
            title="What is in the trail"
            note="Counted over the whole trail rather than the filtered view. A facet list that shrank as you filtered could not tell you what else is there, which is the only reason to offer one."
          >
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col" className={numericCell}>
                      Entries
                    </th>
                    <th scope="col">Filter</th>
                  </tr>
                </thead>
                <tbody>
                  {view.facets.kinds.map((facet) => (
                    <tr key={facet.value}>
                      <th scope="row">{humanise(facet.value)}</th>
                      <td className={numericCell}>{facet.count}</td>
                      <td>
                        <a href={link(`/audit?kind=${encodeURIComponent(facet.value)}`)}>
                          Show only these
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Section>
        </>
      )}
    </>
  );
}
