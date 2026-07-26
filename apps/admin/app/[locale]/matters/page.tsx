/**
 * The matter list.
 *
 * A dense, filterable index rather than a set of cards. The filter is a plain
 * GET form: it works without JavaScript, every state is a URL, and the reference
 * date rides along in a hidden field so filtering does not silently snap the
 * page back to today. The form's `action` is the localised path, so submitting
 * it keeps a Spanish reader in Spanish.
 *
 * The "advice" column is the one worth explaining. It runs the real
 * `canRelease('advice', …)` for the **applicant** audience against each matter's
 * own representative, so the list answers the question a practitioner cannot
 * otherwise see: on which of my files would a recommendation actually reach the
 * client, and on which is it being quietly downgraded to an assessment?
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MATTER_PHASE_ORDER, canRelease, isTerminal } from '@meridian/core';
import { MATTER_STATUS_ORDER } from '@/lib/caseload';
import { AS_OF_PARAM, resolveAsOf } from '@/lib/clock';
import {
  COUNTS,
  UI,
  countOf,
  fill,
  linker,
  localeAlternates,
  localizedPath,
  parseLocale,
  pick,
} from '@/lib/i18n';
import {
  DISCLOSURE_CLASS_LABEL,
  MATTER_PHASE_LABEL,
  MATTER_STATUS_LABEL,
} from '@/lib/labels';
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
  Rich,
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

const SELF = '/matters';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();
  return { title: pick(UI.mattersTitle, locale), alternates: localeAlternates(SELF) };
}

export default async function MattersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();

  const query = await searchParams;
  const get = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const asOf = resolveAsOf(query[AS_OF_PARAM]);
  const records = loadRecords();
  const filter = matterFilterFromParams(get);
  const matters = orderMatters(applyMatterFilter(records, filter));
  const link = linker(locale, asOf);
  const self = localizedPath(SELF, locale);
  const active = matterFilterIsActive(filter);
  const recordLang = records.recordLanguage;

  return (
    <>
      <PageHeader
        path={SELF}
        asOf={asOf}
        locale={locale}
        title={pick(UI.mattersTitle, locale)}
        description={
          active
            ? fill(UI.mattersDescriptionFiltered, locale, {
                shown: countOf(locale, matters.length, COUNTS.matterMatches),
                total: records.matters.length,
              })
            : fill(UI.mattersDescriptionAll, locale, {
                total: countOf(locale, records.matters.length, COUNTS.matter),
              })
        }
        preserve={matterFilterToParams(filter)}
      />

      <form className={filterBarClass} method="get" action={self}>
        {asOf.source === 'url' ? (
          <input type="hidden" name={AS_OF_PARAM} value={asOf.date} />
        ) : null}

        <div className={fieldClass}>
          <label htmlFor="filter-q">{pick(UI.filterSearch, locale)}</label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={filter.query ?? ''}
            placeholder={pick(UI.mattersSearchPlaceholder, locale)}
            size={24}
            {...{ [QUICK_FILTER_ATTRIBUTE]: 'true' }}
          />
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-state">{pick(UI.filterState, locale)}</label>
          <select id="filter-state" name="state" defaultValue={filter.openState ?? ''}>
            <option value="">{pick(UI.filterAny, locale)}</option>
            <option value="live">{pick(UI.filterStateLive, locale)}</option>
            <option value="closed">{pick(UI.filterStateClosed, locale)}</option>
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-phase">{pick(UI.filterPhase, locale)}</label>
          <select id="filter-phase" name="phase" defaultValue={filter.phase ?? ''}>
            <option value="">{pick(UI.filterAny, locale)}</option>
            {MATTER_PHASE_ORDER.map((phase) => (
              <option key={phase} value={phase}>
                {pick(MATTER_PHASE_LABEL[phase], locale)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-status">{pick(UI.filterStatus, locale)}</label>
          <select id="filter-status" name="status" defaultValue={filter.status ?? ''}>
            <option value="">{pick(UI.filterAny, locale)}</option>
            {MATTER_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {pick(MATTER_STATUS_LABEL[status], locale)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-jurisdiction">{pick(UI.filterJurisdiction, locale)}</label>
          <select
            id="filter-jurisdiction"
            name="jurisdiction"
            defaultValue={filter.jurisdiction ?? ''}
          >
            <option value="">{pick(UI.filterAny, locale)}</option>
            {jurisdictionsIn(records).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="filter-rep">{pick(UI.filterRepresentative, locale)}</label>
          <select
            id="filter-rep"
            name="rep"
            defaultValue={filter.unassigned === true ? 'unassigned' : (filter.representativeId ?? '')}
          >
            <option value="">{pick(UI.filterAny, locale)}</option>
            <option value="unassigned">{pick(UI.filterUnassigned, locale)}</option>
            {records.representatives.map((rep) => (
              <option key={rep.credential.id} value={rep.credential.id}>
                {rep.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className={filterActionsClass}>
          <button type="submit" className={`${shell.button} ${shell.buttonPrimary}`}>
            {pick(UI.filterApply, locale)}
          </button>
          {active ? <a href={link(SELF)}>{pick(UI.filterClear, locale)}</a> : null}
        </div>
      </form>

      <Section
        id="matter-list"
        title={pick(UI.mattersListTitle, locale)}
        count={fill(UI.mattersListCount, locale, { count: matters.length })}
        note={pick(UI.mattersListNote, locale)}
      >
        {matters.length === 0 ? (
          <EmptyState
            title={
              active ? pick(UI.mattersNoneMatch, locale) : pick(UI.caseloadEmptyTitle, locale)
            }
          >
            {active ? (
              <p>
                {fill(UI.mattersNoneMatchBodyBefore, locale, {
                  total: countOf(locale, records.matters.length, COUNTS.matterIs),
                })}
                <a href={link(SELF)}>{pick(UI.mattersClearFilterLink, locale)}</a>
                {pick(UI.mattersNoneMatchBodyAfter, locale)}
              </p>
            ) : (
              <p>{pick(UI.mattersEmptyBody, locale)}</p>
            )}
          </EmptyState>
        ) : (
          <TableWrap>
            <table>
              <caption>
                <Rich text={fill(UI.mattersCaption, locale, { date: asOf.date })} />
              </caption>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colReference, locale)}</th>
                  <th scope="col">{pick(UI.colApplicant, locale)}</th>
                  <th scope="col">{pick(UI.colPathway, locale)}</th>
                  <th scope="col">{pick(UI.colPhase, locale)}</th>
                  <th scope="col">{pick(UI.colStatus, locale)}</th>
                  <th scope="col">{pick(UI.colRepresentative, locale)}</th>
                  <th scope="col">{pick(UI.colAdviceToApplicant, locale)}</th>
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
                        <Detail lang={recordLang}>{record.title}</Detail>
                      </th>
                      <td>
                        {applicantName(applicant, locale)}
                        <Detail>
                          {applicant === null
                            ? fill(UI.mattersApplicantMissing, locale, { id: matter.applicantId })
                            : fill(UI.mattersApplicantDetail, locale, {
                                reference: applicant.reference,
                                claimed: matter.claimedNationality,
                                held: applicant.nationalities.join(', '),
                              })}
                        </Detail>
                      </td>
                      <td className={monoCell}>
                        {matter.pathwayId}
                        <Detail>
                          {fill(UI.mattersFiledIn, locale, {
                            jurisdiction: matter.targetJurisdiction,
                          })}
                        </Detail>
                      </td>
                      <td className={nowrapCell}>
                        <Meta>{MATTER_PHASE_ORDER.indexOf(matter.phase) + 1}/6</Meta>{' '}
                        {pick(MATTER_PHASE_LABEL[matter.phase], locale)}
                      </td>
                      <td className={nowrapCell}>
                        <MatterStatusBadge status={matter.status} locale={locale} />
                      </td>
                      <td className={nowrapCell}>
                        {rep === null ? (
                          matter.representativeId === null ? (
                            <Badge tone="warn">{pick(UI.filterUnassigned, locale)}</Badge>
                          ) : (
                            <Badge tone="danger">{pick(UI.mattersNotOnRoster, locale)}</Badge>
                          )
                        ) : (
                          <Link href={link('/representatives')}>{rep.displayName}</Link>
                        )}
                      </td>
                      <td>
                        {isTerminal(matter.status) ? (
                          <Meta>{pick(UI.mattersClosed, locale)}</Meta>
                        ) : decision.allowed ? (
                          <Badge tone="ok">{pick(UI.released, locale)}</Badge>
                        ) : (
                          <>
                            <Badge tone="warn">
                              {fill(UI.downgradedTo, locale, {
                                class: pick(
                                  DISCLOSURE_CLASS_LABEL[decision.downgradeTo],
                                  locale,
                                ).toLocaleLowerCase(locale),
                              })}
                            </Badge>
                            {/* The gate's own reason, in the gate's own language. */}
                            <Detail lang="en">{decision.reason}</Detail>
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
