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
 *
 * An entry's own summary and detail are what was written into the trail. They
 * are rendered verbatim with the record's `lang` and never translated: a trail
 * whose text changes with the reader's language preference is not evidence of
 * anything.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AS_OF_PARAM, resolveAsOf } from '@/lib/clock';
import {
  AUDIT_ACTOR_KINDS,
  AUDIT_EVENT_KINDS,
  auditView,
  filterFromParams,
  filterIsActive,
} from '@/lib/audit-trail';
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
  relativeDays,
} from '@/lib/i18n';
import { AUDIT_ACTOR_LABEL, AUDIT_EVENT_LABEL, DISCLOSURE_CLASS_LABEL } from '@/lib/labels';
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
  Rich,
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

const SELF = '/audit';

/** The advice gate writes its reasons in English. Marked, never rewritten. */
const PACKAGE_LANG = 'en';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();
  return { title: pick(UI.auditTitle, locale), alternates: localeAlternates(SELF) };
}

export default async function AuditPage({
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
  const filter = filterFromParams(get);
  const view = auditView(records, filter, asOf.date);
  const bounds = auditDateBounds(records);
  const active = filterIsActive(filter);
  const link = linker(locale, asOf);
  const self = localizedPath(SELF, locale);
  const recordLang = records.recordLanguage;

  const matterLabel = (matterId: string): string =>
    records.matters.find((m) => m.matter.id === matterId)?.reference ?? matterId;

  return (
    <>
      <PageHeader
        path={SELF}
        asOf={asOf}
        locale={locale}
        title={pick(UI.auditTitle, locale)}
        description={
          <>
            {fill(UI.auditDescription, locale, {
              entries: countOf(locale, view.all.length, COUNTS.entry),
              disclosures: view.facets.disclosures,
              downgrades: view.facets.downgrades,
            })}
            {bounds === null
              ? ''
              : fill(UI.auditRecordedBetween, locale, {
                  first: bounds.first,
                  last: bounds.last,
                })}
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
        <EmptyState title={pick(UI.auditEmpty, locale)}>
          <p>{pick(UI.auditEmptyBody, locale)}</p>
        </EmptyState>
      ) : (
        <>
          <form className={filterBarClass} method="get" action={self}>
            {asOf.source === 'url' ? (
              <input type="hidden" name={AS_OF_PARAM} value={asOf.date} />
            ) : null}

            <div className={fieldClass}>
              <label htmlFor="audit-q">{pick(UI.filterSearch, locale)}</label>
              <input
                id="audit-q"
                name="q"
                type="search"
                size={24}
                defaultValue={filter.query ?? ''}
                placeholder={pick(UI.auditSearchPlaceholder, locale)}
                {...{ [QUICK_FILTER_ATTRIBUTE]: 'true' }}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-kind">{pick(UI.auditFilterEvent, locale)}</label>
              <select id="audit-kind" name="kind" defaultValue={filter.kind ?? ''}>
                <option value="">{pick(UI.filterAny, locale)}</option>
                {AUDIT_EVENT_KINDS.map((kind) => {
                  const facet = view.facets.kinds.find((f) => f.value === kind);
                  return (
                    <option key={kind} value={kind} disabled={facet === undefined}>
                      {pick(AUDIT_EVENT_LABEL[kind], locale)} ({facet?.count ?? 0})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-actor-kind">{pick(UI.auditFilterActorKind, locale)}</label>
              <select id="audit-actor-kind" name="actorKind" defaultValue={filter.actorKind ?? ''}>
                <option value="">{pick(UI.filterAny, locale)}</option>
                {AUDIT_ACTOR_KINDS.map((kind) => {
                  const facet = view.facets.actorKinds.find((f) => f.value === kind);
                  return (
                    <option key={kind} value={kind} disabled={facet === undefined}>
                      {pick(AUDIT_ACTOR_LABEL[kind], locale)} ({facet?.count ?? 0})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-actor">{pick(UI.auditFilterActor, locale)}</label>
              <select id="audit-actor" name="actor" defaultValue={filter.actorId ?? ''}>
                <option value="">{pick(UI.filterAny, locale)}</option>
                {view.facets.actors.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {facet.value} ({facet.count})
                  </option>
                ))}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-matter">{pick(UI.auditFilterMatter, locale)}</label>
              <select id="audit-matter" name="matter" defaultValue={filter.matterId ?? ''}>
                <option value="">{pick(UI.filterAny, locale)}</option>
                {view.facets.matters.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {matterLabel(facet.value)} ({facet.count})
                  </option>
                ))}
              </select>
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-from">{pick(UI.auditFilterFrom, locale)}</label>
              <input
                id="audit-from"
                name="from"
                type="date"
                defaultValue={filter.from ?? ''}
                {...(bounds === null ? {} : { min: bounds.first, max: bounds.last })}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-to">{pick(UI.auditFilterTo, locale)}</label>
              <input
                id="audit-to"
                name="to"
                type="date"
                defaultValue={filter.to ?? ''}
                {...(bounds === null ? {} : { min: bounds.first, max: bounds.last })}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="audit-disclosure">{pick(UI.auditFilterDisclosure, locale)}</label>
              <select
                id="audit-disclosure"
                name="disclosure"
                defaultValue={filter.disclosureOnly === true ? '1' : ''}
              >
                <option value="">{pick(UI.auditFilterAllEntries, locale)}</option>
                <option value="1">
                  {fill(UI.auditFilterWithDisclosure, locale, {
                    count: view.facets.disclosures,
                  })}
                </option>
              </select>
            </div>

            <div className={filterActionsClass}>
              <button type="submit" className={`${shell.button} ${shell.buttonPrimary}`}>
                {pick(UI.filterApply, locale)}
              </button>
              {active ? <a href={link(SELF)}>{pick(UI.filterClear, locale)}</a> : null}
            </div>
          </form>

          {active ? (
            <Callout
              tone="info"
              title={fill(UI.auditFilteredTitle, locale, {
                shown: view.visible.length,
                total: view.all.length,
              })}
            >
              <p>
                {fill(UI.auditFilteredBody, locale, {
                  hidden: countOf(locale, view.suppressed, COUNTS.entryIsHidden),
                })}
              </p>
            </Callout>
          ) : null}

          <Section
            id="entries"
            title={pick(UI.auditEntriesTitle, locale)}
            count={fill(UI.auditEntriesCount, locale, { count: view.visible.length })}
            note={pick(UI.auditEntriesNote, locale)}
          >
            {view.visible.length === 0 ? (
              <EmptyState title={pick(UI.auditNoMatch, locale)}>
                <p>
                  {fill(UI.auditNoMatchBefore, locale, {
                    total: countOf(locale, view.all.length, COUNTS.entryIs),
                  })}
                  <a href={link(SELF)}>{pick(UI.mattersClearFilterLink, locale)}</a>
                  {pick(UI.mattersNoneMatchBodyAfter, locale)}
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
                      <th scope="col">{pick(UI.auditWhen, locale)}</th>
                      <th scope="col">{pick(UI.auditFilterActor, locale)}</th>
                      <th scope="col">{pick(UI.auditFilterMatter, locale)}</th>
                      <th scope="col">{pick(UI.auditFilterEvent, locale)}</th>
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
                          <Detail>{relativeDays(locale, -ageDays)}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          <Mono>{entry.actorId}</Mono>
                          <Detail>{pick(AUDIT_ACTOR_LABEL[entry.actorKind], locale)}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          {entry.matterId === null ? (
                            <Meta>{pick(UI.auditFirmWide, locale)}</Meta>
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
                                  {'. '}
                                  <span lang={PACKAGE_LANG}>{entry.disclosure.reason}</span>
                                </>
                              )}
                              {entry.disclosure.citationIds === undefined ||
                              entry.disclosure.citationIds.length === 0
                                ? ''
                                : fill(UI.auditCites, locale, {
                                    list: entry.disclosure.citationIds.join(', '),
                                  })}
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
            title={pick(UI.auditFacetsTitle, locale)}
            note={pick(UI.auditFacetsNote, locale)}
          >
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{pick(UI.auditFilterEvent, locale)}</th>
                    <th scope="col" className={numericCell}>
                      {pick(UI.colEntries, locale)}
                    </th>
                    <th scope="col">{pick(UI.colFilter, locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.facets.kinds.map((facet) => (
                    <tr key={facet.value}>
                      <th scope="row">{pick(AUDIT_EVENT_LABEL[facet.value], locale)}</th>
                      <td className={numericCell}>{facet.count}</td>
                      <td>
                        <a href={link(`${SELF}?kind=${encodeURIComponent(facet.value)}`)}>
                          {pick(UI.auditShowOnlyThese, locale)}
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
