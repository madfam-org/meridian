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
 *
 * ## What is translated here, and what is not
 *
 * The state names, the ownership column and the console's own prose are the
 * reader's language. An adapter's `reason`, `summary`, `unblockPath` and its
 * requirement descriptions are **not**: they are the adapter's own account of
 * itself, written in English inside `@meridian/govtech`, and the point of this
 * page is that it renders that account unchanged. Rewriting it in Spanish would
 * make the console the author of a claim it exists to relay, so those strings
 * are marked `lang="en"` instead. The same rule the citation module applies to a
 * statute's title, applied to a machine's own words about itself.
 */

import { notFound } from 'next/navigation';
import { instrumentLang } from '@meridian/i18n';
import { AS_OF_PARAM, resolveAsOf } from '@/lib/clock';
import {
  COUNTS,
  UI,
  countOf,
  fill,
  localeAlternates,
  parseLocale,
  pick,
} from '@/lib/i18n';
import {
  CAPABILITY_SURFACE_LABEL,
  POLICY_REFUSAL_LABEL,
  REQUIREMENT_KIND_LABEL,
  policyRefusalLabel,
} from '@/lib/labels';
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

const SELF = '/integrations';

/** The adapter's own language. Every string below marked with it comes from `@meridian/govtech`. */
const ADAPTER_LANG = 'en';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parseLocale((await params).locale);
  if (locale === null) notFound();
  return { title: pick(UI.integrationsTitle, locale), alternates: localeAlternates(SELF) };
}

export default async function IntegrationsPage({
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
  const view = await integrationsView(asOf.date);
  const { board } = view;
  const refusalGroups = refusalsByPolicy(view);
  const totalCapabilities = CAPABILITY_STATE_ORDER.reduce((n, s) => n + board.totals[s], 0);

  const ownerFor = (state: (typeof CAPABILITY_STATE_ORDER)[number]): string => {
    switch (state) {
      case 'available':
        return pick(UI.ownerAvailable, locale);
      case 'not_provisioned':
        return pick(UI.ownerNotProvisioned, locale);
      case 'not_implemented':
        return pick(UI.ownerNotImplemented, locale);
      case 'degraded':
        return pick(UI.ownerDegraded, locale);
      case 'refused_by_policy':
        return pick(UI.ownerRefused, locale);
    }
  };

  return (
    <>
      <PageHeader
        path={SELF}
        asOf={asOf}
        locale={locale}
        title={pick(UI.integrationsTitle, locale)}
        description={fill(UI.integrationsDescription, locale, {
          adapters: countOf(locale, board.reports.length, COUNTS.adapter),
          capabilities: countOf(locale, totalCapabilities, COUNTS.capability),
          date: board.generatedOn,
        })}
      />

      {board.totals.available === 0 ? (
        <Callout tone="info" title={pick(UI.integrationsNoneLiveTitle, locale)}>
          <p>{pick(UI.integrationsNoneLiveBody, locale)}</p>
        </Callout>
      ) : null}

      {board.consistent ? null : (
        <Callout
          tone="danger"
          title={fill(UI.integrationsDefectsTitle, locale, {
            defects: countOf(locale, board.defects.length, COUNTS.capabilityDefect),
          })}
        >
          <p>{pick(UI.integrationsDefectsBody, locale)}</p>
        </Callout>
      )}

      <Section
        id="totals"
        title={pick(UI.integrationsStatesTitle, locale)}
        note={pick(UI.integrationsStatesNote, locale)}
      >
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">{pick(UI.colState, locale)}</th>
                <th scope="col" className={numericCell}>
                  {pick(UI.colCount, locale)}
                </th>
                <th scope="col">{pick(UI.colWhoOwnsIt, locale)}</th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_STATE_ORDER.map((state) => (
                <tr key={state}>
                  <th scope="row" className={nowrapCell}>
                    <CapabilityStateBadge state={state} locale={locale} />
                  </th>
                  <td className={numericCell}>{board.totals[state]}</td>
                  <td>{ownerFor(state)}</td>
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
          count={fill(UI.integrationsAdapterCount, locale, {
            jurisdiction: adapter.report.jurisdiction,
            capabilities: adapter.report.capabilities.length,
          })}
          note={<span lang={ADAPTER_LANG}>{adapter.summary}</span>}
        >
          {adapter.defects.length > 0 ? (
            <Callout tone="danger" title={pick(UI.integrationsAdapterDefectTitle, locale)}>
              <ul>
                {adapter.defects.map((defect) => (
                  <li key={`${defect.code}-${defect.capabilityId ?? 'report'}`}>
                    <Mono>{defect.code}</Mono>
                    {defect.capabilityId === null ? '' : ` (${defect.capabilityId})`} —{' '}
                    <span lang={ADAPTER_LANG}>{defect.message}</span>
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
                    {
                      term: pick(UI.fieldCapability, locale),
                      value: <span lang={ADAPTER_LANG}>{capability.title}</span>,
                    },
                    {
                      term: pick(UI.fieldState, locale),
                      value: (
                        <>
                          <CapabilityStateBadge state={capability.state} locale={locale} />{' '}
                          <Badge tone="neutral">
                            {pick(CAPABILITY_SURFACE_LABEL[capability.surface], locale)}
                          </Badge>
                        </>
                      ),
                    },
                    {
                      term: pick(UI.fieldReason, locale),
                      value: <span lang={ADAPTER_LANG}>{capability.reason}</span>,
                    },
                    ...(capability.policy === null
                      ? []
                      : [
                          {
                            term: pick(UI.fieldPolicy, locale),
                            value: (
                              <>
                                <Badge tone="refused">
                                  {pick(POLICY_REFUSAL_LABEL[capability.policy], locale)}
                                </Badge>
                                <Detail>
                                  {capability.policy === 'no_credential_custody'
                                    ? pick(UI.policyNoCredentialCustody, locale)
                                    : pick(UI.policyNoImpersonation, locale)}
                                </Detail>
                              </>
                            ),
                          },
                        ]),
                    ...(capability.requirements.length === 0
                      ? []
                      : [
                          {
                            term: pick(UI.fieldPreconditions, locale),
                            value: (
                              <ul>
                                {capability.requirements.map((requirement) => (
                                  <li key={requirement.key}>
                                    <Badge tone={requirement.satisfied ? 'ok' : 'warn'}>
                                      {requirement.satisfied
                                        ? pick(UI.requirementSatisfied, locale)
                                        : pick(UI.requirementOutstanding, locale)}
                                    </Badge>{' '}
                                    <Mono>{requirement.key}</Mono>{' '}
                                    <Meta>
                                      ({pick(REQUIREMENT_KIND_LABEL[requirement.kind], locale)})
                                    </Meta>
                                    <Detail lang={ADAPTER_LANG}>{requirement.description}</Detail>
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
                            term: pick(UI.fieldOutstanding, locale),
                            value: (
                              <>
                                <PillRow>
                                  {outstanding.map((key) => (
                                    <Chip key={key}>{key}</Chip>
                                  ))}
                                </PillRow>
                                <Detail>{pick(UI.integrationsKeyNamesOnly, locale)}</Detail>
                              </>
                            ),
                          },
                        ]),
                    ...(capability.unblockPath.length === 0
                      ? []
                      : [
                          {
                            term: pick(UI.fieldToUnblock, locale),
                            value: (
                              <ol lang={ADAPTER_LANG}>
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
                            term: pick(UI.fieldInstead, locale),
                            value: (
                              <>
                                <span lang={ADAPTER_LANG}>
                                  {capability.alternative.description}
                                </span>
                                {capability.alternative.capabilityId === null ? null : (
                                  <Detail>
                                    {alternativeResolves ? (
                                      <a href={`#capability-${capability.alternative.capabilityId}`}>
                                        <Mono>{capability.alternative.capabilityId}</Mono>
                                      </a>
                                    ) : (
                                      <Badge tone="danger">
                                        {fill(UI.integrationsAlternativeMissing, locale, {
                                          id: capability.alternative.capabilityId,
                                        })}
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
                            term: pick(UI.colCites, locale),
                            value: (
                              <ul>
                                {capability.citations.map((citation) => {
                                  const band = citationBands.find((b) => b.citationId === citation.id);
                                  const lang = instrumentLang(citation) ?? undefined;
                                  return (
                                    <li key={citation.id}>
                                      <Mono>{citation.id}</Mono> —{' '}
                                      {/* The instrument's name and provision are the
                                          identity of the source: verbatim, in their
                                          own language, whatever the page locale. */}
                                      <cite lang={lang}>{citation.instrument}</cite>
                                      {citation.provision === undefined ? (
                                        ''
                                      ) : (
                                        <span lang={lang}>{`, ${citation.provision}`}</span>
                                      )}{' '}
                                      {band === undefined ? null : (
                                        <StalenessBadge
                                          band={band.band}
                                          ageDays={band.ageDays}
                                          locale={locale}
                                        />
                                      )}
                                      {citation.discretionary === true ? (
                                        <Detail>
                                          <Badge tone="info">{pick(UI.discretionary, locale)}</Badge>{' '}
                                          <span lang={ADAPTER_LANG}>{citation.note ?? ''}</span>
                                        </Detail>
                                      ) : citation.note === undefined ? null : (
                                        <Detail lang={ADAPTER_LANG}>{citation.note}</Detail>
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
        title={pick(UI.integrationsPolicyTitle, locale)}
        count={fill(UI.integrationsPolicyCount, locale, {
          count: refusalGroups.reduce((n, g) => n + g.capabilities.length, 0),
        })}
        note={pick(UI.integrationsPolicyNote, locale)}
      >
        <Panel lang={ADAPTER_LANG}>
          <p>{view.policy.summary}</p>

          <Subhead>{pick(UI.integrationsWhatIsRefused, locale)}</Subhead>
          <ul>
            {view.policy.refuses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <Subhead>{pick(UI.integrationsWhy, locale)}</Subhead>
          <ul>
            {view.policy.because.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <Subhead>{pick(UI.integrationsInsteadDo, locale)}</Subhead>
          <ul>
            {view.policy.insteadDo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>

        {refusalGroups.length === 0 ? (
          <EmptyState title={pick(UI.integrationsNoRefusals, locale)} />
        ) : (
          refusalGroups.map((group) => (
            <div key={group.policy}>
              <Subhead>{policyRefusalLabel(group.policy, locale)}</Subhead>
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{pick(UI.colAdapter, locale)}</th>
                      <th scope="col">{pick(UI.fieldCapability, locale)}</th>
                      <th scope="col">{pick(UI.fieldReason, locale)}</th>
                      <th scope="col">{pick(UI.colHonestAlternative, locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.capabilities.map(({ adapterId, capability }) => (
                      <tr key={`${adapterId}:${capability.id}`}>
                        <td className={monoCell}>{adapterId}</td>
                        <td className={monoCell}>
                          {capability.id}
                          <Detail lang={ADAPTER_LANG}>{capability.title}</Detail>
                        </td>
                        <td lang={ADAPTER_LANG}>{capability.reason}</td>
                        <td>
                          {capability.alternative === null ? (
                            <Badge tone="danger">
                              {pick(UI.integrationsNoAlternative, locale)}
                            </Badge>
                          ) : (
                            <span lang={ADAPTER_LANG}>{capability.alternative.description}</span>
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
        title={pick(UI.integrationsSyntheticTitle, locale)}
        count={fill(UI.integrationsSyntheticCount, locale, {
          probes: view.probesRun,
          findings: view.syntheticSuccess.length,
        })}
        note={pick(UI.integrationsSyntheticNote, locale)}
      >
        {view.syntheticSuccess.length === 0 ? (
          <EmptyState
            title={fill(UI.integrationsSyntheticClean, locale, { probes: view.probesRun })}
          >
            <p>{pick(UI.integrationsSyntheticCleanBody, locale)}</p>
          </EmptyState>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th scope="col">{pick(UI.colAdapter, locale)}</th>
                  <th scope="col">{pick(UI.fieldCapability, locale)}</th>
                  <th scope="col">{pick(UI.colFinding, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {view.syntheticSuccess.map((finding) => (
                  <tr key={`${finding.adapterId}:${finding.capabilityId}`}>
                    <td className={monoCell}>{finding.adapterId}</td>
                    <td className={monoCell}>{finding.capabilityId}</td>
                    <td lang={ADAPTER_LANG}>{finding.message}</td>
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
