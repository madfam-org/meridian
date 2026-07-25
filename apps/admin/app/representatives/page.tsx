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
 */

import Link from 'next/link';
import { isTerminal } from '@meridian/core';
import { AS_OF_PARAM, resolveAsOf, withAsOf } from '@/lib/clock';
import { countOf, humanise, relativeDays } from '@/lib/format';
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
  MatterStatusBadge,
  credentialLabel,
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
  Section,
  Subhead,
  TableWrap,
  monoCell,
  nowrapCell,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Representatives' };

export default async function RepresentativesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asOf = resolveAsOf(params[AS_OF_PARAM]);
  const records = loadRecords();
  const link = (href: string): string => withAsOf(href, asOf);

  const standings = representativeStandings(records, asOf.date);
  const unrepresented = unrepresentedLiveMatters(records);
  const dangling = danglingRepresentativeAssignments(records);
  const needingAttention = standings.filter((s) => s.needsAttention);
  const downgradedTotal = standings.reduce((n, s) => n + s.downgrading.length, 0);

  return (
    <>
      <PageHeader
        path="/representatives"
        asOf={asOf}
        title="Representatives"
        description={
          <>
            {countOf(standings.length, 'standing', 'standings')} on the roster,{' '}
            {countOf(needingAttention.length, 'needing', 'needing')} attention as at {asOf.date}.
            Licence validity is decided by <Mono>canRelease</Mono> in{' '}
            <Mono>@meridian/core</Mono>, not re-implemented here — if the gate and this page could
            disagree, the page would be the one lying.
          </>
        }
      />

      {records.representatives.length === 0 ? (
        <EmptyState title="No representatives are on the roster.">
          <p>
            With nobody on the roster, every advice-class output in this tenant is downgraded to an
            assessment before it reaches an applicant. That is the correct behaviour, not an outage.
          </p>
          {unrepresented.length > 0 ? (
            <p>
              {countOf(unrepresented.length, 'live matter is', 'live matters are')} currently open
              with no accountable representative.
            </p>
          ) : null}
        </EmptyState>
      ) : (
        <>
          {downgradedTotal > 0 ? (
            <Callout
              tone="danger"
              title={`${countOf(downgradedTotal, 'live matter is', 'live matters are')} having advice refused through the credential attached to the file`}
            >
              <p>
                Each line below is the advice gate&rsquo;s own reason, verbatim. Nothing on the
                matter itself will show this — the file looks normal and the client simply stops
                receiving recommendations.
              </p>
            </Callout>
          ) : null}

          <Section
            id="roster"
            title="Roster"
            count={`${standings.length} · ordered by what needs doing`}
            note={
              <>
                Renewal lead time is {CREDENTIAL_EXPIRY_WARNING_DAYS} days and re-verification is
                due at {VERIFICATION_DUE_DAYS} days, overdue at {VERIFICATION_OVERDUE_DAYS}. Those
                are this firm&rsquo;s operational thresholds; the re-verification bands deliberately
                mirror the citation freshness bands in <Mono>@meridian/core</Mono> so there is one
                convention for how long a human-checked fact may go unchecked.
              </>
            }
          >
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Representative</th>
                    <th scope="col">Credential</th>
                    <th scope="col">Licence</th>
                    <th scope="col">Last verified</th>
                    <th scope="col">Gating</th>
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
                            <Mono>{record.credential.id}</Mono> · {record.regulator}
                          </Detail>
                          {record.note === undefined ? null : <Detail>{record.note}</Detail>}
                        </th>
                        <td className={nowrapCell}>
                          {credentialLabel(record.credential.credential)}
                          <Detail>
                            <Mono>{record.credential.licenceNumber}</Mono> ·{' '}
                            {record.credential.jurisdiction}
                          </Detail>
                          <Detail>{record.publicRegister}</Detail>
                        </td>
                        <td className={nowrapCell}>
                          <Badge tone={licenceStandingTone(licence.standing)}>
                            {humanise(licence.standing)}
                          </Badge>
                          <Detail>
                            {licence.expiresOn === null ? (
                              'No expiry published on the register.'
                            ) : (
                              <>
                                <Mono>{licence.expiresOn}</Mono>
                                {licence.daysRemaining === null
                                  ? ' — not a readable civil date'
                                  : ` — ${relativeDays(licence.daysRemaining)}`}
                              </>
                            )}
                          </Detail>
                        </td>
                        <td className={nowrapCell}>
                          <Badge tone={verificationTone(verification.standing)}>
                            {humanise(verification.standing)}
                          </Badge>
                          <Detail>
                            <Mono>{verification.verifiedOn}</Mono>
                            {verification.ageDays === null
                              ? ' — not a readable civil date'
                              : ` — ${relativeDays(-verification.ageDays)}`}
                          </Detail>
                        </td>
                        <td className={nowrapCell}>
                          {standing.liveGating.length} live
                          <Detail>
                            {standing.gating.length - standing.liveGating.length} closed ·{' '}
                            {standing.downgrading.length} refusing advice
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
              count={`${countOf(standing.liveGating.length, 'live matter', 'live matters')}`}
              note={
                standing.downgrading.length > 0
                  ? 'Advice to the applicant is currently refused on the matters marked below.'
                  : 'The advice gate releases through this standing on every live matter attached to it.'
              }
            >
              <Definitions
                items={[
                  { term: 'Regulator', value: standing.record.regulator },
                  { term: 'Public register', value: standing.record.publicRegister },
                  {
                    term: 'Licence number',
                    value: <Mono>{standing.record.credential.licenceNumber}</Mono>,
                  },
                  {
                    term: 'Authorised in',
                    value: <Mono>{standing.record.credential.jurisdiction}</Mono>,
                  },
                  {
                    term: 'Verified on',
                    value: <Mono>{standing.record.credential.verifiedOn}</Mono>,
                  },
                  {
                    term: 'Expires on',
                    value:
                      standing.record.credential.expiresOn === undefined ? (
                        <Meta>Not published</Meta>
                      ) : (
                        <Mono>{standing.record.credential.expiresOn}</Mono>
                      ),
                  },
                ]}
              />

              <Subhead>Matters gated by this credential</Subhead>
              {standing.gating.length === 0 ? (
                <p>
                  <Meta>No matters are attached to this representative.</Meta>
                </p>
              ) : (
                <TableWrap>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Matter</th>
                        <th scope="col">Applicant</th>
                        <th scope="col">Jurisdiction</th>
                        <th scope="col">Status</th>
                        <th scope="col">Advice to applicant</th>
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
                              <Detail>{gated.title}</Detail>
                            </th>
                            <td>{applicantName(applicant)}</td>
                            <td className={monoCell}>{gated.jurisdiction}</td>
                            <td className={nowrapCell}>
                              <MatterStatusBadge status={gated.status} />
                            </td>
                            <td>
                              {gated.terminal ? (
                                <Meta>Matter closed — no live output to gate</Meta>
                              ) : gated.toApplicant.allowed ? (
                                <Badge tone="ok">Released</Badge>
                              ) : (
                                <>
                                  <Badge tone="danger">
                                    Downgraded to {gated.toApplicant.downgradeTo}
                                  </Badge>
                                  <Detail>{gated.toApplicant.reason}</Detail>
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
        title="Matters with nobody accountable"
        count={`${unrepresented.length} unassigned · ${dangling.length} dangling`}
        note="Not a roster problem, but the same hole from the other side. An unassigned matter looks unassigned; a matter naming somebody who is not on the roster looks covered and is not."
      >
        {unrepresented.length === 0 && dangling.length === 0 ? (
          <EmptyState
            title={
              records.matters.length === 0
                ? 'No matters are open, so nothing needs an accountable representative yet.'
                : 'Every live matter has an accountable representative on the roster.'
            }
          />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Matter</th>
                  <th scope="col">Status</th>
                  <th scope="col">Problem</th>
                </tr>
              </thead>
              <tbody>
                {unrepresented.map((record) => (
                  <tr key={record.matter.id}>
                    <th scope="row" className={nowrapCell}>
                      <Link href={link(`/matters/${record.matter.id}`)}>{record.reference}</Link>
                      <Detail>{record.title}</Detail>
                    </th>
                    <td className={nowrapCell}>
                      <MatterStatusBadge status={record.matter.status} />
                    </td>
                    <td>
                      <Badge tone="warn">Unassigned</Badge>
                      <Detail>
                        Every advice-class output on this file is downgraded to an assessment before
                        it reaches the applicant.
                      </Detail>
                    </td>
                  </tr>
                ))}
                {dangling.map(({ matter: record, representativeId }) => (
                  <tr key={`dangling-${record.matter.id}`}>
                    <th scope="row" className={nowrapCell}>
                      <Link href={link(`/matters/${record.matter.id}`)}>{record.reference}</Link>
                      <Detail>{record.title}</Detail>
                    </th>
                    <td className={nowrapCell}>
                      <MatterStatusBadge status={record.matter.status} />
                      {isTerminal(record.matter.status) ? <Detail>closed</Detail> : null}
                    </td>
                    <td>
                      <Badge tone="danger">Names {representativeId}, who is not on the roster</Badge>
                      <Detail>
                        The gate resolves no credential for this matter, so it behaves exactly like
                        an unassigned file while appearing to be covered.
                      </Detail>
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
