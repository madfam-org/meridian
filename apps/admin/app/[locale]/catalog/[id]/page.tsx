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
 *
 * ## Both halves of the catalog text, on purpose
 *
 * Everywhere else in this console the page picks one language. Here it shows the
 * reader's half *and* the other one, and that is not a relapse into the
 * side-by-side rendering this change removed. The catalog authors `{ en, es }`
 * together and a sign-off signs both; a reviewer who cannot see the half they
 * are not reading cannot check that it says the same thing. So the other half
 * appears once, labelled as what it is, marked with its own `lang`, and only on
 * the screen whose job is to review it.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isTerminal } from '@meridian/core';
import { instrumentLang, otherLocale } from '@meridian/i18n';
import { MERIDIAN_PATHWAY_CATALOG, pathwayById, statusOn } from '@meridian/pathways';
import { previewSignOff, reviewQueue } from '@/lib/catalog-review';
import { AS_OF_PARAM, firstParam, resolveAsOf } from '@/lib/clock';
import {
  COUNTS,
  LANG_ATTR,
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
  CRITERION_KIND_LABEL,
  CRITERION_WEIGHT_LABEL,
  ISSUE_SEVERITY_LABEL,
  MATTER_PHASE_LABEL,
  PATHWAY_KIND_LABEL,
  SOURCE_KIND_LABEL,
} from '@/lib/labels';
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
  Rich,
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

/** `@meridian/pathways` writes its linter messages in English. Marked, not rewritten. */
const PACKAGE_LANG = 'en';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = parseLocale(rawLocale);
  if (locale === null) notFound();
  const pathway = pathwayById(id);
  return {
    title: pathway === null ? pick(UI.pathwayNotFound, locale) : pathway.id,
    alternates: localeAlternates(`/catalog/${id}`),
  };
}

export default async function CatalogRecordPage({
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
  const pathway = pathwayById(id);
  if (pathway === null) notFound();

  const records = loadRecords();
  const link = linker(locale, asOf);
  const self = localizedPath(`/catalog/${pathway.id}`, locale);
  const other = otherLocale(locale);
  const recordLang = records.recordLanguage;
  const { reviews } = reviewQueue(MERIDIAN_PATHWAY_CATALOG, records.matters, asOf.date);
  const review = reviews.find((r) => r.pathway.id === pathway.id);
  if (review === undefined) notFound();

  const reviewerParam = firstParam(query.reviewer) ?? null;
  const signOff = previewSignOff(
    MERIDIAN_PATHWAY_CATALOG,
    pathway,
    reviewerParam,
    asOf.date,
    locale,
  );
  const liveMatters = review.liveMatters.filter((m) => !isTerminal(m.matter.status));
  const citationById = new Map(review.citations.map((c) => [c.citation.id, c]));

  return (
    <>
      <PageHeader
        path={`/catalog/${pathway.id}`}
        asOf={asOf}
        locale={locale}
        title={pathway.id}
        description={
          <>
            {pick(pathway.name, locale)} · v{pathway.version} ·{' '}
            {pick(PATHWAY_KIND_LABEL[pathway.kind], locale)} · {pathway.jurisdiction}
          </>
        }
        preserve={{ reviewer: reviewerParam ?? undefined }}
      >
        <p>
          <ReviewStatusBadge status={pathway.reviewStatus} locale={locale} />{' '}
          <PathwayStatusBadge status={review.statusAsOf} locale={locale} />{' '}
          <Badge tone="neutral">
            {countOf(locale, pathway.criteria.length, COUNTS.criterion)}
          </Badge>{' '}
          <Badge tone="neutral">
            {countOf(locale, pathway.citations.length, COUNTS.citation)}
          </Badge>{' '}
          <Badge tone={liveMatters.length > 0 ? 'info' : 'neutral'}>
            {countOf(locale, liveMatters.length, COUNTS.liveMatter)}
          </Badge>
        </p>
      </PageHeader>

      {review.statusAsOf === 'closed' ? (
        <Callout
          tone="info"
          title={fill(UI.catalogRecordClosedTitle, locale, {
            date: pathway.closedOn ?? pick(UI.catalogRecordUnrecordedDate, locale),
          })}
        >
          {pathway.closureNote === undefined ? null : (
            <p>{pick(pathway.closureNote, locale)}</p>
          )}
          <p>{pick(UI.catalogRecordClosedBody, locale)}</p>
        </Callout>
      ) : null}

      <Section
        id="summary"
        title={pick(UI.catalogRecordTitle, locale)}
        note={pick(pathway.summary, locale)}
      >
        <Definitions
          items={[
            { term: pick(UI.fieldId, locale), value: <Mono>{pathway.id}</Mono> },
            {
              term: pick(UI.fieldVersion, locale),
              value: (
                <>
                  <Mono>{pathway.version}</Mono>{' '}
                  <Meta>{pick(UI.catalogRecordVersionNote, locale)}</Meta>
                </>
              ),
            },
            {
              term: pick(UI.fieldKind, locale),
              value: pick(PATHWAY_KIND_LABEL[pathway.kind], locale),
            },
            {
              term: pick(UI.colJurisdiction, locale),
              value: <Mono>{pathway.jurisdiction}</Mono>,
            },
            {
              term: pick(UI.fieldOpened, locale),
              value:
                pathway.openedOn === undefined ? (
                  <Meta>{pick(UI.fieldNotRecorded, locale)}</Meta>
                ) : (
                  <Mono>{pathway.openedOn}</Mono>
                ),
            },
            {
              term: pick(UI.fieldClosed, locale),
              value:
                pathway.closedOn === undefined ? (
                  <Meta>{pick(UI.fieldStillAccepting, locale)}</Meta>
                ) : (
                  <Mono>{pathway.closedOn}</Mono>
                ),
            },
            {
              term: pick(UI.fieldStoredStatus, locale),
              value: (
                <>
                  <Mono>{pathway.status}</Mono>{' '}
                  <Meta>
                    (
                    {fill(UI.catalogRecordAsAt, locale, {
                      date: asOf.date,
                      status: statusOn(pathway, asOf.date),
                    })}
                    )
                  </Meta>
                </>
              ),
            },
            {
              term: pick(UI.fieldReviewedBy, locale),
              value:
                pathway.reviewedBy === undefined ? (
                  <Meta>{pick(UI.catalogRecordNeverSigned, locale)}</Meta>
                ) : (
                  fill(UI.catalogRecordReviewedOn, locale, {
                    reviewer: pathway.reviewedBy,
                    date: pathway.reviewedOn ?? pick(UI.catalogRecordUnrecordedDate, locale),
                  })
                ),
            },
            {
              term: pick(UI.fieldLeadsTo, locale),
              value:
                pathway.leadsTo.length === 0 ? (
                  <Meta>{pick(UI.fieldNothingRecorded, locale)}</Meta>
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
            {
              term: pick(UI.catalogRecordOtherHalf, locale),
              value: (
                <>
                  <span lang={LANG_ATTR[other]}>{pathway.summary[other]}</span>
                  <Detail>{pick(UI.catalogRecordOtherHalfNote, locale)}</Detail>
                </>
              ),
            },
          ]}
        />
      </Section>

      <Section
        id="sign-off"
        title={pick(UI.signOffTitle, locale)}
        note={<Rich text={pick(UI.signOffNote, locale)} />}
      >
        <form className={filterBarClass} method="get" action={self}>
          {asOf.source === 'url' ? (
            <input type="hidden" name={AS_OF_PARAM} value={asOf.date} />
          ) : null}
          <div className={fieldClass}>
            <label htmlFor="reviewer">{pick(UI.signOffReviewer, locale)}</label>
            <input
              id="reviewer"
              name="reviewer"
              type="text"
              size={32}
              defaultValue={reviewerParam ?? ''}
              placeholder={pick(UI.signOffReviewerPlaceholder, locale)}
            />
          </div>
          <div className={filterActionsClass}>
            <button type="submit" className={`${shell.button} ${shell.buttonPrimary}`}>
              {pick(UI.signOffCheck, locale)}
            </button>
            {reviewerParam === null ? null : (
              <a href={link(`/catalog/${pathway.id}`)}>{pick(UI.filterClear, locale)}</a>
            )}
          </div>
        </form>

        <Panel>
          <ul className={checkListClass}>
            {signOff.checks.map((check) => (
              <li key={check.id} className={checkItemClass}>
                <Badge tone={check.met === true ? 'ok' : check.met === false ? 'danger' : 'neutral'}>
                  {check.met === true
                    ? pick(UI.signOffMet, locale)
                    : check.met === false
                      ? pick(UI.signOffNotMet, locale)
                      : pick(UI.signOffNotEvaluated, locale)}
                </Badge>
                <span>
                  {check.label}
                  <Detail>
                    <Rich text={check.detail} />
                  </Detail>
                </span>
              </li>
            ))}
          </ul>

          <Subhead>{pick(UI.signOffOutcome, locale)}</Subhead>
          {signOff.wouldBeAccepted ? (
            <>
              <p>
                <Badge tone="ok">{pick(UI.signOffWouldValidate, locale)}</Badge>
              </p>
              <p>
                <Rich text={pick(UI.signOffTranscribe, locale)} />
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
              <Badge tone="warn">{pick(UI.signOffWouldNotBeAccepted, locale)}</Badge>{' '}
              <Meta>{pick(UI.signOffClearUnmet, locale)}</Meta>
            </p>
          )}
        </Panel>
      </Section>

      <Section
        id="criteria"
        title={pick(UI.criteriaTitle, locale)}
        count={fill(UI.criteriaCount, locale, {
          blocking: review.counts.blocking,
          material: review.counts.material,
          informational: review.counts.informational,
        })}
        note={<Rich text={pick(UI.criteriaNote, locale)} />}
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
                    { term: pick(UI.fieldLabel, locale), value: pick(criterion.label, locale) },
                    {
                      term: pick(UI.catalogRecordOtherHalf, locale),
                      value: (
                        <Meta lang={LANG_ATTR[other]}>{criterion.label[other]}</Meta>
                      ),
                    },
                    {
                      term: pick(UI.fieldWeight, locale),
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
                          {pick(CRITERION_WEIGHT_LABEL[criterion.weight], locale)}
                        </Badge>
                      ),
                    },
                    {
                      term: pick(UI.fieldKind, locale),
                      value: pick(CRITERION_KIND_LABEL[criterion.kind], locale),
                    },
                    {
                      term: pick(UI.colCites, locale),
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
                                  <Badge tone="danger">
                                    {pick(UI.criteriaNotDeclared, locale)}
                                  </Badge>
                                ) : (
                                  <StalenessBadge
                                    band={standing.band}
                                    ageDays={standing.ageDays}
                                    locale={locale}
                                  />
                                )}
                              </span>
                            );
                          })}
                        </PillRow>
                      ),
                    },
                    {
                      term: pick(UI.fieldEncodedRule, locale),
                      value: (
                        <>
                          <Tree node={describeSpec(criterion.evaluator, locale)} />
                          <Detail>
                            {fill(UI.criteriaOperators, locale, {
                              operators: countOf(
                                locale,
                                specSize(criterion.evaluator),
                                COUNTS.operator,
                              ),
                            })}
                          </Detail>
                        </>
                      ),
                    },
                    {
                      term: pick(UI.fieldFactsRead, locale),
                      value: (
                        <PillRow>
                          {paths.map((p) => (
                            <Chip key={`${p.path}-${p.rootScope ? 'root' : 'item'}`}>
                              {p.path}
                              {p.rootScope ? '' : pick(UI.criteriaPerItem, locale)}
                            </Chip>
                          ))}
                        </PillRow>
                      ),
                    },
                    ...(criterion.requiresHumanReview === true
                      ? [
                          {
                            term: pick(UI.fieldEscalation, locale),
                            value: (
                              <>
                                <Badge tone="warn">{pick(UI.criteriaAlwaysHuman, locale)}</Badge>
                                {criterion.humanReviewReason === undefined ? null : (
                                  <Detail>{pick(criterion.humanReviewReason, locale)}</Detail>
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
                            term: pick(UI.fieldEscalatesWhen, locale),
                            value: (
                              <>
                                <Tree node={describeSpec(criterion.humanReviewWhen, locale)} />
                                {criterion.humanReviewReason === undefined ? null : (
                                  <Detail>{pick(criterion.humanReviewReason, locale)}</Detail>
                                )}
                              </>
                            ),
                          },
                        ]),
                    ...(criterion.guidance === undefined
                      ? []
                      : [
                          {
                            term: pick(UI.fieldGuidance, locale),
                            value: pick(criterion.guidance, locale),
                          },
                        ]),
                  ]}
                />
              </Panel>
            </div>
          );
        })}
      </Section>

      <Section
        id="citations"
        title={pick(UI.provenanceTitle, locale)}
        count={fill(UI.provenanceCount, locale, {
          total: review.citations.length,
          stale: review.staleCount,
          aging: review.agingCount,
        })}
        note={<Rich text={pick(UI.provenanceNote, locale)} />}
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">{pick(UI.fieldId, locale)}</th>
                <th scope="col">{pick(UI.fieldKind, locale)}</th>
                <th scope="col">{pick(UI.colInstrument, locale)}</th>
                <th scope="col">{pick(UI.colVerified, locale)}</th>
                <th scope="col">{pick(UI.colBand, locale)}</th>
                <th scope="col">{pick(UI.colUsed, locale)}</th>
              </tr>
            </thead>
            <tbody>
              {review.citations.map((standing) => {
                const c = standing.citation;
                const lang = instrumentLang(c) ?? undefined;
                return (
                  <tr key={c.id} id={`citation-${c.id}`}>
                    <th scope="row" className={monoCell}>
                      {c.id}
                    </th>
                    <td className={nowrapCell}>
                      {pick(SOURCE_KIND_LABEL[c.kind], locale)}
                      {c.discretionary === true ? (
                        <Detail>
                          <Badge tone="info">{pick(UI.discretionary, locale)}</Badge>
                        </Detail>
                      ) : null}
                    </td>
                    <td>
                      {/* The instrument's name and provision are the identity of
                          the source. Verbatim, in their own language, whatever
                          the page locale — a translated title names an instrument
                          that does not exist. */}
                      <cite lang={lang}>{c.instrument}</cite>
                      {c.provision === undefined ? null : (
                        <Detail lang={lang}>{c.provision}</Detail>
                      )}
                      {c.url === undefined ? (
                        <Detail>
                          <Meta>{pick(UI.provenanceNoUrl, locale)}</Meta>
                        </Detail>
                      ) : (
                        <Detail>
                          <a href={c.url} rel="noreferrer noopener nofollow">
                            {c.url}
                          </a>
                        </Detail>
                      )}
                      {c.note === undefined ? null : (
                        <Detail lang={PACKAGE_LANG}>{c.note}</Detail>
                      )}
                    </td>
                    <td className={`${monoCell} ${nowrapCell}`}>{c.verifiedOn}</td>
                    <td className={nowrapCell}>
                      <StalenessBadge
                        band={standing.band}
                        ageDays={standing.ageDays}
                        locale={locale}
                      />
                    </td>
                    <td className={nowrapCell}>
                      {standing.referenced ? (
                        <Badge tone="ok">{pick(UI.provenanceCited, locale)}</Badge>
                      ) : (
                        <Badge tone="warn">{pick(UI.provenanceNeverCited, locale)}</Badge>
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
        title={pick(UI.durationsTitle, locale)}
        note={pick(UI.durationsNote, locale)}
      >
        <Definitions
          items={[
            {
              term: pick(UI.durationsInitialGrant, locale),
              value:
                pathway.durations.initialGrantMonths === undefined ? (
                  <Meta>{pick(UI.fieldNotRecorded, locale)}</Meta>
                ) : (
                  fill(UI.durationsMonths, locale, {
                    count: pathway.durations.initialGrantMonths,
                  })
                ),
            },
            {
              term: pick(UI.durationsRenewal, locale),
              value:
                pathway.durations.renewalMonths === undefined ? (
                  <Meta>{pick(UI.fieldNotRecorded, locale)}</Meta>
                ) : (
                  fill(UI.durationsMonths, locale, { count: pathway.durations.renewalMonths })
                ),
            },
            {
              term: pick(UI.durationsMaxRenewals, locale),
              value:
                pathway.durations.maxRenewals === undefined ? (
                  <Meta>{pick(UI.fieldNotRecorded, locale)}</Meta>
                ) : (
                  String(pathway.durations.maxRenewals)
                ),
            },
            {
              term: pick(UI.durationsCountsToward, locale),
              value:
                pathway.durations.countsTowardNaturalisation === undefined ? (
                  <Meta>{pick(UI.durationsNotAsserted, locale)}</Meta>
                ) : pathway.durations.countsTowardNaturalisation ? (
                  <Badge tone="ok">{pick(UI.yes, locale)}</Badge>
                ) : (
                  <Badge tone="neutral">{pick(UI.no, locale)}</Badge>
                ),
            },
            {
              term: pick(UI.durationsPublishedProcessing, locale),
              value:
                pathway.durations.publishedProcessingDays === undefined ? (
                  <Meta>{pick(UI.durationsNonePublished, locale)}</Meta>
                ) : (
                  fill(UI.durationsDays, locale, {
                    min: pathway.durations.publishedProcessingDays.min,
                    max: pathway.durations.publishedProcessingDays.max,
                  })
                ),
            },
            {
              term: pick(UI.colCites, locale),
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
              : [
                  {
                    term: pick(UI.fieldNote, locale),
                    value: pick(pathway.durations.note, locale),
                  },
                ]),
          ]}
        />
      </Section>

      <Section
        id="linter"
        title={pick(UI.recordLinterTitle, locale)}
        count={fill(UI.catalogLinterCount, locale, {
          errors: review.errorCount,
          warnings: review.warningCount,
        })}
      >
        {review.issues.length === 0 ? (
          <EmptyState title={pick(UI.recordLinterClean, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colSeverity, locale)}</th>
                  <th scope="col">{pick(UI.colCode, locale)}</th>
                  <th scope="col">{pick(UI.colWhere, locale)}</th>
                  <th scope="col">{pick(UI.colMessage, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {review.issues.map((issue, index) => (
                  <tr key={`${issue.code}-${index}`}>
                    <td className={nowrapCell}>
                      <Badge tone={issue.severity === 'error' ? 'danger' : 'warn'}>
                        {pick(ISSUE_SEVERITY_LABEL[issue.severity], locale)}
                      </Badge>
                    </td>
                    <td className={monoCell}>{issue.code}</td>
                    <td className={monoCell}>
                      {issue.criterionId ?? issue.citationId ?? (
                        <Meta>{pick(UI.catalogRecordTitle, locale)}</Meta>
                      )}
                    </td>
                    <td lang={PACKAGE_LANG}>{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Section>

      <Section
        id="dependent-matters"
        title={pick(UI.dependentMattersTitle, locale)}
        count={fill(UI.dependentMattersCount, locale, {
          live: liveMatters.length,
          total: review.liveMatters.length,
        })}
        note={pick(UI.dependentMattersNote, locale)}
      >
        {review.liveMatters.length === 0 ? (
          <EmptyState title={pick(UI.dependentMattersEmpty, locale)} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colMatter, locale)}</th>
                  <th scope="col">{pick(UI.colPhase, locale)}</th>
                  <th scope="col">{pick(UI.colStatus, locale)}</th>
                  <th scope="col" className={numericCell}>
                    {pick(UI.colDocuments, locale)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {review.liveMatters.map((matterRecord) => (
                  <tr key={matterRecord.matter.id}>
                    <th scope="row" className={nowrapCell}>
                      <Link href={link(`/matters/${matterRecord.matter.id}`)}>
                        {matterRecord.reference}
                      </Link>
                      <Detail lang={recordLang}>{matterRecord.title}</Detail>
                    </th>
                    <td className={nowrapCell}>
                      {pick(MATTER_PHASE_LABEL[matterRecord.matter.phase], locale)}
                    </td>
                    <td className={nowrapCell}>
                      <MatterStatusBadge status={matterRecord.matter.status} locale={locale} />
                    </td>
                    <td className={numericCell}>{matterRecord.documents.length}</td>
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
