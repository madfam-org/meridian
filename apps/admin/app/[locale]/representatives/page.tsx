/**
 * The representative roster.
 *
 * This page exists because of a failure mode with no other symptom. When a
 * credential lapses, `canRelease` stops releasing advice through it and
 * downgrades the output to an assessment — correctly, quietly, and with nothing
 * on any other screen changing. The client keeps receiving their own figures
 * against the cited rule and simply stops receiving a recommendation. Nobody is
 * notified, because from the gate's point of view nothing went wrong.
 *
 * So the roster is ordered by how much damage a standing is doing rather than
 * alphabetically, and each row shows the gate's own verdict on each matter that
 * representative is accountable for. The verdict is computed for the
 * **applicant** audience: testing the practitioner audience would report every
 * credential as fine, because advice to a professional is released regardless of
 * standing, and a page that always says "fine" is a page nobody reads.
 *
 * Two failures that are not a representative's fault appear here anyway, because
 * they are the same hole seen from the other side: matters with nobody attached,
 * and matters naming somebody who is not on the roster. The second is worse than
 * the first — an unassigned file looks unassigned, whereas a dangling assignment
 * looks covered.
 *
 * Credential names carry their regulator's own language, not the page's. See
 * `credentialLabel` in `lib/labels.ts`: naming a Canadian standing with a
 * Spanish title of art would assert an equivalence between two regulators that
 * nobody has established.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isTerminal } from '@meridian/core';
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
  DISCLOSURE_CLASS_LABEL,
  LICENCE_STANDING_LABEL,
  VERIFICATION_STANDING_LABEL,
} from '@/lib/labels';
import { applicantName, findApplicant, loadRecords } from '@/lib/records';
import {
  CREDENTIAL_EXPIRY_WARNING_DAYS,
  VERIFICATION_DUE_DAYS,
  VERIFICATION_OVERDUE_DAYS,
  danglingRepresentativeAssignments,
  representativeStandings,
  unrepresentedLiveMatters,
} from '@/lib/roster';
import { PageHeader } from '@/components/page';
import {
  CredentialName,
  MatterStatusBadge,
  licenceStandingTone,
  verificationTone,
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
} from '@/components/ui';

export const dynamic = 'force-dynamic';

const SELF = '/representatives';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();
  return { title: pick(UI.representativesTitle, locale), alternates: localeAlternates(SELF) };
}

export default async function RepresentativesPage({
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
  const unrepresented = unrepresentedLiveMatters(records);
  const dangling = danglingRepresentativeAssignments(records);
  const needingAttention = standings.filter((s) => s.needsAttention);
  const downgradedTotal = standings.reduce((n, s) => n + s.downgrading.length, 0);

  return (
    <>
      <PageHeader
        path={SELF}
        asOf={asOf}
        locale={locale}
        title={pick(UI.representativesTitle, locale)}
        description={
          <Rich
            text={fill(UI.representativesDescription, locale, {
              standings: countOf(locale, standings.length, COUNTS.standing),
              attention: countOf(locale, needingAttention.length, COUNTS.needing),
              date: asOf.date,
            })}
          />
        }
      />

      {records.representatives.length === 0 ? (
        <EmptyState title={pick(UI.representativesEmpty, locale)}>
          <p>{pick(UI.representativesEmptyBody, locale)}</p>
          {unrepresented.length > 0 ? (
            <p>
              {fill(UI.representativesEmptyUnrepresented, locale, {
                matters: countOf(locale, unrepresented.length, COUNTS.liveMatterIsOpen),
              })}
            </p>
          ) : null}
        </EmptyState>
      ) : (
        <>
          {downgradedTotal > 0 ? (
            <Callout
              tone="danger"
              title={fill(UI.representativesDowngradedTitle, locale, {
                matters: countOf(locale, downgradedTotal, COUNTS.liveMatterIs),
              })}
            >
              <p>{pick(UI.representativesDowngradedBody, locale)}</p>
            </Callout>
          ) : null}

          <Section
            id="roster"
            title={pick(UI.rosterTitle, locale)}
            count={fill(UI.rosterCount, locale, { count: standings.length })}
            note={
              <>
                <Rich
                  text={fill(UI.rosterNote, locale, {
                    warning: CREDENTIAL_EXPIRY_WARNING_DAYS,
                    due: VERIFICATION_DUE_DAYS,
                    overdue: VERIFICATION_OVERDUE_DAYS,
                  })}
                />{' '}
                {pick(UI.rosterCredentialNote, locale)}
              </>
            }
          >
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{pick(UI.colRepresentative, locale)}</th>
                    <th scope="col">{pick(UI.colCredential, locale)}</th>
                    <th scope="col">{pick(UI.colLicence, locale)}</th>
                    <th scope="col">{pick(UI.colLastVerified, locale)}</th>
                    <th scope="col">{pick(UI.colGating, locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing) => {
                    const { record, licence, verification } = standing;
                    return (
                      <tr key={record.credential.id}>
                        <th scope="row">
                          {record.displayName}
                          <Detail>
                            <Mono>{record.credential.id}</Mono> ·{' '}
                            <span lang={recordLang}>{record.regulator}</span>
                          </Detail>
                          {record.note === undefined ? null : (
                            <Detail lang={recordLang}>{record.note}</Detail>
                          )}
                        </th>
                        <td className={nowrapCell}>
                          <CredentialName
                            credential={record.credential.credential}
                            locale={locale}
                          />
                          <Detail>
                            <Mono>{record.credential.licenceNumber}</Mono> ·{' '}
                            {record.credential.jurisdiction}
                          </Detail>
                          <Detail lang={recordLang}>{record.publicRegister}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          <Badge tone={licenceStandingTone(licence.standing)}>
                            {pick(LICENCE_STANDING_LABEL[licence.standing], locale)}
                          </Badge>
                          <Detail>
                            {licence.expiresOn === null ? (
                              pick(UI.rosterNoExpiryPublished, locale)
                            ) : (
                              <>
                                <Mono>{licence.expiresOn}</Mono>
                                {licence.daysRemaining === null
                                  ? pick(UI.rosterUnreadableDate, locale)
                                  : ` — ${relativeDays(locale, licence.daysRemaining)}`}
                              </>
                            )}
                          </Detail>
                        </td>
                        <td className={nowrapCell}>
                          <Badge tone={verificationTone(verification.standing)}>
                            {pick(VERIFICATION_STANDING_LABEL[verification.standing], locale)}
                          </Badge>
                          <Detail>
                            <Mono>{verification.verifiedOn}</Mono>
                            {verification.ageDays === null
                              ? pick(UI.rosterUnreadableDate, locale)
                              : ` — ${relativeDays(locale, -verification.ageDays)}`}
                          </Detail>
                        </td>
                        <td className={nowrapCell}>
                          {fill(UI.rosterLive, locale, { count: standing.liveGating.length })}
                          <Detail>
                            {fill(UI.rosterGatingDetail, locale, {
                              closed: standing.gating.length - standing.liveGating.length,
                              refusing: standing.downgrading.length,
                            })}
                          </Detail>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </Section>

          {standings.map((standing) => (
            <Section
              key={standing.record.credential.id}
              id={`rep-${standing.record.credential.id}`}
              title={standing.record.displayName}
              count={countOf(locale, standing.liveGating.length, COUNTS.liveMatter)}
              note={
                standing.downgrading.length > 0
                  ? pick(UI.rosterRefusedOnMarked, locale)
                  : pick(UI.rosterReleasesOnAll, locale)
              }
            >
              <Definitions
                items={[
                  {
                    term: pick(UI.fieldRegulator, locale),
                    value: <span lang={recordLang}>{standing.record.regulator}</span>,
                  },
                  {
                    term: pick(UI.fieldPublicRegister, locale),
                    value: <span lang={recordLang}>{standing.record.publicRegister}</span>,
                  },
                  {
                    term: pick(UI.fieldLicenceNumber, locale),
                    value: <Mono>{standing.record.credential.licenceNumber}</Mono>,
                  },
                  {
                    term: pick(UI.fieldAuthorisedIn, locale),
                    value: <Mono>{standing.record.credential.jurisdiction}</Mono>,
                  },
                  {
                    term: pick(UI.fieldVerifiedOn, locale),
                    value: <Mono>{standing.record.credential.verifiedOn}</Mono>,
                  },
                  {
                    term: pick(UI.fieldExpiresOn, locale),
                    value:
                      standing.record.credential.expiresOn === undefined ? (
                        <Meta>{pick(UI.fieldNotPublished, locale)}</Meta>
                      ) : (
                        <Mono>{standing.record.credential.expiresOn}</Mono>
                      ),
                  },
                ]}
              />

              <Subhead>{pick(UI.rosterGatedMatters, locale)}</Subhead>
              {standing.gating.length === 0 ? (
                <p>
                  <Meta>{pick(UI.rosterNoMattersAttached, locale)}</Meta>
                </p>
              ) : (
                <TableWrap>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">{pick(UI.colMatter, locale)}</th>
                        <th scope="col">{pick(UI.colApplicant, locale)}</th>
                        <th scope="col">{pick(UI.colJurisdiction, locale)}</th>
                        <th scope="col">{pick(UI.colStatus, locale)}</th>
                        <th scope="col">{pick(UI.colAdviceToApplicant, locale)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standing.gating.map((gated) => {
                        const matterRecord = records.matters.find(
                          (m) => m.matter.id === gated.matterId,
                        );
                        const applicant =
                          matterRecord === undefined
                            ? null
                            : findApplicant(records, matterRecord.matter.applicantId);
                        return (
                          <tr key={gated.matterId}>
                            <th scope="row" className={nowrapCell}>
                              <Link href={link(`/matters/${gated.matterId}`)}>
                                {gated.reference}
                              </Link>
                              <Detail lang={recordLang}>{gated.title}</Detail>
                            </th>
                            <td>{applicantName(applicant, locale)}</td>
                            <td className={monoCell}>{gated.jurisdiction}</td>
                            <td className={nowrapCell}>
                              <MatterStatusBadge status={gated.status} locale={locale} />
                            </td>
                            <td>
                              {gated.terminal ? (
                                <Meta>{pick(UI.rosterMatterClosed, locale)}</Meta>
                              ) : gated.toApplicant.allowed ? (
                                <Badge tone="ok">{pick(UI.released, locale)}</Badge>
                              ) : (
                                <>
                                  <Badge tone="danger">
                                    {fill(UI.downgradedTo, locale, {
                                      class: pick(
                                        DISCLOSURE_CLASS_LABEL[gated.toApplicant.downgradeTo],
                                        locale,
                                      ).toLocaleLowerCase(locale),
                                    })}
                                  </Badge>
                                  {/* The gate's own words, in the gate's own language. */}
                                  <Detail lang="en">{gated.toApplicant.reason}</Detail>
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
          ))}
        </>
      )}

      <Section
        id="unattached"
        title={pick(UI.unattachedTitle, locale)}
        count={fill(UI.unattachedCount, locale, {
          unassigned: unrepresented.length,
          dangling: dangling.length,
        })}
        note={pick(UI.unattachedNote, locale)}
      >
        {unrepresented.length === 0 && dangling.length === 0 ? (
          <EmptyState
            title={
              records.matters.length === 0
                ? pick(UI.unattachedNoMatters, locale)
                : pick(UI.unattachedAllCovered, locale)
            }
          />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colMatter, locale)}</th>
                  <th scope="col">{pick(UI.colStatus, locale)}</th>
                  <th scope="col">{pick(UI.colProblem, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {unrepresented.map((record) => (
                  <tr key={record.matter.id}>
                    <th scope="row" className={nowrapCell}>
                      <Link href={link(`/matters/${record.matter.id}`)}>{record.reference}</Link>
                      <Detail lang={recordLang}>{record.title}</Detail>
                    </th>
                    <td className={nowrapCell}>
                      <MatterStatusBadge status={record.matter.status} locale={locale} />
                    </td>
                    <td>
                      <Badge tone="warn">{pick(UI.filterUnassigned, locale)}</Badge>
                      <Detail>{pick(UI.unattachedDowngradeDetail, locale)}</Detail>
                    </td>
                  </tr>
                ))}
                {dangling.map(({ matter: record, representativeId }) => (
                  <tr key={`dangling-${record.matter.id}`}>
                    <th scope="row" className={nowrapCell}>
                      <Link href={link(`/matters/${record.matter.id}`)}>{record.reference}</Link>
                      <Detail lang={recordLang}>{record.title}</Detail>
                    </th>
                    <td className={nowrapCell}>
                      <MatterStatusBadge status={record.matter.status} locale={locale} />
                      {isTerminal(record.matter.status) ? (
                        <Detail>{pick(UI.unattachedClosed, locale)}</Detail>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone="danger">
                        {fill(UI.unattachedNames, locale, { id: representativeId })}
                      </Badge>
                      <Detail>{pick(UI.unattachedDanglingDetail, locale)}</Detail>
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
