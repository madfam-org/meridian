/**
 * The matter list.
 *
 * A dense, filterable index rather than a set of cards. The filter is a plain
 * GET form: it works without JavaScript, every state is a URL, and the reference
 * date rides along in a hidden field so filtering does not silently snap the
 * page back to today.
 *
 * The "advice" column is the one worth explaining. It runs the real
 * `canRelease('advice', …)` for the **applicant** audience against each matter's
 * own representative, so the list answers the question a practitioner cannot
 * otherwise see: on which of my files would a recommendation actually reach the
 * client, and on which is it being quietly downgraded to an assessment?
 */

import Link from 'next/link';
import { MATTER_PHASE_ORDER, canRelease, isTerminal } from '@meridian/core';
import { MATTER_STATUS_ORDER } from '@/lib/caseload';
import { AS_OF_PARAM, resolveAsOf, withAsOf } from '@/lib/clock';
import { countOf, humanise } from '@/lib/format';
import {
  applyMatterFilter,
  jurisdictionsIn,
  matterFilterFromParams,
  matterFilterIsActive,
  matterFilterToParams,
  orderMatters,
} from '@/lib/matter-filter';
import { applicantName, findApplicant, findRepresentative, loadRecords } from '@/lib/records';
import { PageHeader } from '@/components/page';
import { MatterStatusBadge } from '@/components/state';
import {
  Badge,
  Detail,
  EmptyState,
  Meta,
  Section,
  TableWrap,
  fieldClass,
  filterActionsClass,
  filterBarClass,
  monoCell,
  nowrapCell,
} from '@/components/ui';
import { QUICK_FILTER_ATTRIBUTE } from '@/components/constants';
import shell from '@/components/shell.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Matters' };

export default async function MattersPage({
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
  const filter = matterFilterFromParams(get);
  const matters = orderMatters(applyMatterFilter(records, filter));
  const link = (href: string): string => withAsOf(href, asOf);
  const active = matterFilterIsActive(filter);

  return (
    <>
      <PageHeader
        path="/matters"
        asOf={asOf}
        title="Matters"
        description={
          active
            ? `${countOf(matters.length, 'matter', 'matters')} match the current filter, out of ${records.matters.length} on the books.`
            : `${countOf(records.matters.length, 'matter', 'matters')} on the books.`
        }
        preserve={matterFilterToParams(filter)}
      />

      <form className={filterBarClass} method="get" action="/matters">
        {asOf.source === 'url' ? (
          <input type="hidden" name={AS_OF_PARAM} value={asOf.date} />
        ) : null}

        <div className={fieldClass}>
          <label htmlFor="filter-q">Search</label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={filter.query ?? ''}
            placeholder="reference, applicant, pathway"
            size={24}
            {...{ [QUICK_FILTER_ATTRIBUTE]: 'true' }}
          />
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-state">State</label>
          <select id="filter-state" name="state" defaultValue={filter.openState ?? ''}>
            <option value="">Any</option>
            <option value="live">Live</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-phase">Phase</label>
          <select id="filter-phase" name="phase" defaultValue={filter.phase ?? ''}>
            <option value="">Any</option>
            {MATTER_PHASE_ORDER.map((phase) => (
              <option key={phase} value={phase}>
                {humanise(phase)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-status">Status</label>
          <select id="filter-status" name="status" defaultValue={filter.status ?? ''}>
            <option value="">Any</option>
            {MATTER_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {humanise(status)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-jurisdiction">Jurisdiction</label>
          <select
            id="filter-jurisdiction"
            name="jurisdiction"
            defaultValue={filter.jurisdiction ?? ''}
          >
            <option value="">Any</option>
            {jurisdictionsIn(records).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-rep">Representative</label>
          <select
            id="filter-rep"
            name="rep"
            defaultValue={filter.unassigned === true ? 'unassigned' : (filter.representativeId ?? '')}
          >
            <option value="">Any</option>
            <option value="unassigned">Unassigned</option>
            {records.representatives.map((rep) => (
              <option key={rep.credential.id} value={rep.credential.id}>
                {rep.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className={filterActionsClass}>
          <button type="submit" className={`${shell.button} ${shell.buttonPrimary}`}>
            Filter
          </button>
          {active ? <a href={link('/matters')}>Clear</a> : null}
        </div>
      </form>

      <Section
        id="matter-list"
        title="Files"
        count={`${matters.length} shown`}
        note="Ordered by live work first, then by position in the phase model, then by reference. Not ordered by urgency — an ordering the software chose would be a ranking, and ranking is a reserved act."
      >
        {matters.length === 0 ? (
          <EmptyState
            title={active ? 'No matters match this filter.' : 'No matters have been opened.'}
          >
            {active ? (
              <p>
                {countOf(records.matters.length, 'matter is', 'matters are')} on the books. <a href={link('/matters')}>Clear the filter</a> to see
                them.
              </p>
            ) : (
              <p>The list stays empty until a file exists. It does not fill with examples.</p>
            )}
          </EmptyState>
        ) : (
          <TableWrap>
            <table>
              <caption>
                Advice release is evaluated for the <strong>applicant</strong> audience as at{' '}
                {asOf.date}, which is the question the practitioner cannot see from the file itself.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Applicant</th>
                  <th scope="col">Pathway</th>
                  <th scope="col">Phase</th>
                  <th scope="col">Status</th>
                  <th scope="col">Representative</th>
                  <th scope="col">Advice to applicant</th>
                </tr>
              </thead>
              <tbody>
                {matters.map((record) => {
                  const { matter } = record;
                  const applicant = findApplicant(records, matter.applicantId);
                  const rep = findRepresentative(records, matter.representativeId);
                  const decision = canRelease('advice', {
                    audience: 'applicant',
                    jurisdiction: matter.targetJurisdiction,
                    representative: rep?.credential ?? null,
                    forConsideration: true,
                    asOf: asOf.date,
                  });
                  return (
                    <tr key={matter.id}>
                      <th scope="row" className={nowrapCell}>
                        <Link href={link(`/matters/${matter.id}`)}>{record.reference}</Link>
                        <Detail>{record.title}</Detail>
                      </th>
                      <td>
                        {applicantName(applicant)}
                        <Detail>
                          {applicant === null
                            ? `Applicant ${matter.applicantId} is not in the record set.`
                            : `${applicant.reference} · claimed ${matter.claimedNationality} · holds ${applicant.nationalities.join(', ')}`}
                        </Detail>
                      </td>
                      <td className={monoCell}>
                        {matter.pathwayId}
                        <Detail>Filed in {matter.targetJurisdiction}</Detail>
                      </td>
                      <td className={nowrapCell}>
                        <Meta>{MATTER_PHASE_ORDER.indexOf(matter.phase) + 1}/6</Meta>{' '}
                        {humanise(matter.phase)}
                      </td>
                      <td className={nowrapCell}>
                        <MatterStatusBadge status={matter.status} />
                      </td>
                      <td className={nowrapCell}>
                        {rep === null ? (
                          matter.representativeId === null ? (
                            <Badge tone="warn">Unassigned</Badge>
                          ) : (
                            <Badge tone="danger">Not on roster</Badge>
                          )
                        ) : (
                          <Link href={link('/representatives')}>{rep.displayName}</Link>
                        )}
                      </td>
                      <td>
                        {isTerminal(matter.status) ? (
                          <Meta>Matter closed</Meta>
                        ) : decision.allowed ? (
                          <Badge tone="ok">Released</Badge>
                        ) : (
                          <>
                            <Badge tone="warn">Downgraded to {decision.downgradeTo}</Badge>
                            <Detail>{decision.reason}</Detail>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Section>
    </>
  );
}
