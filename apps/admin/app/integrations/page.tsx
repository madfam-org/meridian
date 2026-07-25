/**
 * The government-integration status board.
 *
 * Nothing on this page is asserted by the console. Each adapter in
 * `@meridian/govtech` computes its own capability state from its own declared
 * preconditions, and this page renders the result verbatim — the reasons, the
 * outstanding requirement *names*, and the unblock paths. A status page that
 * decided its own green ticks is the standard way an estate ends up showing a
 * wall of green over an unprovisioned estate, and the first person to find out
 * is a client whose filing did not happen.
 *
 * Three states are rendered as genuinely different things, because they have
 * genuinely different owners:
 *
 *  - `not_provisioned` — the code exists, nothing is configured. An **operator**
 *    signs or provisions something. Engineering has nothing to do.
 *  - `not_implemented` — there is no integration, because none can be built
 *    responsibly yet. **Engineering, or a prior legal question**, owns it.
 *  - `refused_by_policy` — we will not build this. **Nobody** owns it, because
 *    it is a decision rather than a gap. Those rows carry the policy in full, so
 *    that a new engineer reading this board learns why credential custody is not
 *    on the roadmap instead of filing a ticket to finish it.
 *
 * The no-synthetic-success check at the bottom is executed, not claimed: it runs
 * every government operation probe in the registry and reports anything that
 * returned data while its capability was unavailable. It also reports how many
 * probes ran, so "no findings" can never quietly mean "nothing was checked".
 */

import { AS_OF_PARAM, resolveAsOf } from '@/lib/clock';
import { countOf, humanise } from '@/lib/format';
import { CAPABILITY_STATE_ORDER, integrationsView, refusalsByPolicy } from '@/lib/integrations';
import { PageHeader } from '@/components/page';
import { CapabilityStateBadge, StalenessBadge } from '@/components/state';
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
  Section,
  Subhead,
  TableWrap,
  monoCell,
  nowrapCell,
  numericCell,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Integrations' };

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asOf = resolveAsOf(params[AS_OF_PARAM]);
  const view = await integrationsView(asOf.date);
  const { board } = view;
  const refusalGroups = refusalsByPolicy(view);
  const totalCapabilities = CAPABILITY_STATE_ORDER.reduce((n, s) => n + board.totals[s], 0);

  return (
    <>
      <PageHeader
        path="/integrations"
        asOf={asOf}
        title="Integrations"
        description={
          <>
            {countOf(board.reports.length, 'adapter', 'adapters')} declaring{' '}
            {countOf(totalCapabilities, 'capability', 'capabilities')} as at {board.generatedOn}.
            Each state is computed by the adapter from its own preconditions; this page renders it
            unchanged.
          </>
        }
      />

      {board.totals.available === 0 ? (
        <Callout tone="info" title="No government integration is live">
          <p>
            Every capability that would cross into a government system is unavailable, and the
            reasons below say which are waiting on an operator, which are waiting on engineering,
            and which are settled refusals. That is the honest state of this repository.
          </p>
        </Callout>
      ) : null}

      {board.consistent ? null : (
        <Callout
          tone="danger"
          title={`${countOf(board.defects.length, 'capability defect', 'capability defects')} in the reports themselves`}
        >
          <p>
            An adapter is describing itself in a way that breaks the honesty invariants — for
            example claiming availability with an unmet requirement. The board renders the adapter
            rather than crashing on it, and lists the defect below.
          </p>
        </Callout>
      )}

      <Section
        id="totals"
        title="Capability states"
        note="Counted across every adapter. States are ordered by how much attention they deserve, with settled refusals last — putting a decision above an open problem would misrepresent where an operator's time belongs."
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col" className={numericCell}>
                  Count
                </th>
                <th scope="col">Who owns it</th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_STATE_ORDER.map((state) => (
                <tr key={state}>
                  <th scope="row" className={nowrapCell}>
                    <CapabilityStateBadge state={state} />
                  </th>
                  <td className={numericCell}>{board.totals[state]}</td>
                  <td>
                    {state === 'available'
                      ? 'Working now, with the credentials and agreements currently in place.'
                      : state === 'not_provisioned'
                        ? 'An operator. Something must be signed, issued or configured.'
                        : state === 'not_implemented'
                          ? 'Engineering, or a legal question that has to be answered first.'
                          : state === 'degraded'
                            ? 'Engineering. It works partially and callers should know before depending on it.'
                            : 'Nobody. This is a decision, not a gap.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      {view.adapters.map((adapter) => (
        <Section
          key={adapter.report.adapterId}
          id={`adapter-${adapter.report.adapterId}`}
          title={adapter.report.displayName}
          count={`${adapter.report.jurisdiction} · ${adapter.report.capabilities.length} capabilities`}
          note={adapter.summary}
        >
          {adapter.defects.length > 0 ? (
            <Callout tone="danger" title="This adapter's self-description is inconsistent">
              <ul>
                {adapter.defects.map((defect) => (
                  <li key={`${defect.code}-${defect.capabilityId ?? 'report'}`}>
                    <Mono>{defect.code}</Mono>
                    {defect.capabilityId === null ? '' : ` (${defect.capabilityId})`} —{' '}
                    {defect.message}
                  </li>
                ))}
              </ul>
            </Callout>
          ) : null}

          {adapter.capabilities.map(({ capability, outstanding, citationBands, alternativeResolves }) => (
            <div key={capability.id}>
              <Subhead id={`capability-${capability.id}`}>
                <Mono>{capability.id}</Mono>
              </Subhead>
              <Panel>
                <Definitions
                  items={[
                    { term: 'Capability', value: capability.title },
                    {
                      term: 'State',
                      value: (
                        <>
                          <CapabilityStateBadge state={capability.state} />{' '}
                          <Badge tone="neutral">{humanise(capability.surface)}</Badge>
                        </>
                      ),
                    },
                    { term: 'Reason', value: capability.reason },
                    ...(capability.policy === null
                      ? []
                      : [
                          {
                            term: 'Policy',
                            value: (
                              <>
                                <Badge tone="refused">{humanise(capability.policy)}</Badge>
                                <Detail>
                                  {capability.policy === 'no_credential_custody'
                                    ? 'Meridian does not accept, store, relay or transmit a user’s government authentication credential.'
                                    : 'Meridian does not perform acts before an authority while presenting as the user.'}
                                </Detail>
                              </>
                            ),
                          },
                        ]),
                    ...(capability.requirements.length === 0
                      ? []
                      : [
                          {
                            term: 'Preconditions',
                            value: (
                              <ul>
                                {capability.requirements.map((requirement) => (
                                  <li key={requirement.key}>
                                    <Badge tone={requirement.satisfied ? 'ok' : 'warn'}>
                                      {requirement.satisfied ? 'satisfied' : 'outstanding'}
                                    </Badge>{' '}
                                    <Mono>{requirement.key}</Mono>{' '}
                                    <Meta>({humanise(requirement.kind)})</Meta>
                                    <Detail>{requirement.description}</Detail>
                                  </li>
                                ))}
                              </ul>
                            ),
                          },
                        ]),
                    ...(outstanding.length === 0
                      ? []
                      : [
                          {
                            term: 'Outstanding',
                            value: (
                              <>
                                <PillRow>
                                  {outstanding.map((key) => (
                                    <Chip key={key}>{key}</Chip>
                                  ))}
                                </PillRow>
                                <Detail>
                                  Key names only. No value is read, stored, logged or rendered —
                                  which is what makes it safe to show an operator exactly what is
                                  missing.
                                </Detail>
                              </>
                            ),
                          },
                        ]),
                    ...(capability.unblockPath.length === 0
                      ? []
                      : [
                          {
                            term: 'To unblock',
                            value: (
                              <ol>
                                {capability.unblockPath.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ol>
                            ),
                          },
                        ]),
                    ...(capability.alternative === null
                      ? []
                      : [
                          {
                            term: 'Instead',
                            value: (
                              <>
                                {capability.alternative.description}
                                {capability.alternative.capabilityId === null ? null : (
                                  <Detail>
                                    {alternativeResolves ? (
                                      <a href={`#capability-${capability.alternative.capabilityId}`}>
                                        <Mono>{capability.alternative.capabilityId}</Mono>
                                      </a>
                                    ) : (
                                      <Badge tone="danger">
                                        names {capability.alternative.capabilityId}, which this
                                        adapter does not declare
                                      </Badge>
                                    )}
                                  </Detail>
                                )}
                              </>
                            ),
                          },
                        ]),
                    ...(capability.citations.length === 0
                      ? []
                      : [
                          {
                            term: 'Cites',
                            value: (
                              <ul>
                                {capability.citations.map((citation) => {
                                  const band = citationBands.find((b) => b.citationId === citation.id);
                                  return (
                                    <li key={citation.id}>
                                      <Mono>{citation.id}</Mono> — {citation.instrument}
                                      {citation.provision === undefined
                                        ? ''
                                        : `, ${citation.provision}`}{' '}
                                      {band === undefined ? null : (
                                        <StalenessBadge band={band.band} ageDays={band.ageDays} />
                                      )}
                                      {citation.discretionary === true ? (
                                        <Detail>
                                          <Badge tone="info">Discretionary</Badge>{' '}
                                          {citation.note ?? ''}
                                        </Detail>
                                      ) : citation.note === undefined ? null : (
                                        <Detail>{citation.note}</Detail>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            ),
                          },
                        ]),
                  ]}
                />
              </Panel>
            </div>
          ))}
        </Section>
      ))}

      <Section
        id="policy"
        title="Why credential custody is refused"
        count={`${refusalGroups.reduce((n, g) => n + g.capabilities.length, 0)} refused capabilities`}
        note="This is the block a new engineer should read before proposing to 'finish' one of the refused capabilities. It is not a backlog item."
      >
        <Panel>
          <p>{view.policy.summary}</p>

          <Subhead>What is refused</Subhead>
          <ul>
            {view.policy.refuses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <Subhead>Why</Subhead>
          <ul>
            {view.policy.because.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <Subhead>What is done instead</Subhead>
          <ul>
            {view.policy.insteadDo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>

        {refusalGroups.length === 0 ? (
          <EmptyState title="No capability on this board is refused by policy." />
        ) : (
          refusalGroups.map((group) => (
            <div key={group.policy}>
              <Subhead>{humanise(group.policy)}</Subhead>
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Adapter</th>
                      <th scope="col">Capability</th>
                      <th scope="col">Reason</th>
                      <th scope="col">Honest alternative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.capabilities.map(({ adapterId, capability }) => (
                      <tr key={`${adapterId}:${capability.id}`}>
                        <td className={monoCell}>{adapterId}</td>
                        <td className={monoCell}>
                          {capability.id}
                          <Detail>{capability.title}</Detail>
                        </td>
                        <td>{capability.reason}</td>
                        <td>
                          {capability.alternative === null ? (
                            <Badge tone="danger">
                              None offered — a refusal without an alternative is not an answer
                            </Badge>
                          ) : (
                            capability.alternative.description
                          )}
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
        id="synthetic"
        title="No-synthetic-success check"
        count={`${view.probesRun} probes run · ${view.syntheticSuccess.length} findings`}
        note={
          <>
            Every government operation in the registry was executed with a minimal, credential-free
            payload. Anything that returned data while its capability was unavailable would have
            fabricated it. The probe count is shown so that a clean result cannot quietly mean
            nothing was checked.
          </>
        }
      >
        {view.syntheticSuccess.length === 0 ? (
          <EmptyState
            title={`${view.probesRun} probes ran and none returned data it could not have obtained.`}
          >
            <p>
              This is a check that executed, not a claim on a page. With nothing provisioned, a
              probe returning a plausible government response is the failure it is designed to
              catch.
            </p>
          </EmptyState>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">Adapter</th>
                  <th scope="col">Capability</th>
                  <th scope="col">Finding</th>
                </tr>
              </thead>
              <tbody>
                {view.syntheticSuccess.map((finding) => (
                  <tr key={`${finding.adapterId}:${finding.capabilityId}`}>
                    <td className={monoCell}>{finding.adapterId}</td>
                    <td className={monoCell}>{finding.capabilityId}</td>
                    <td>{finding.message}</td>
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
