/**
 * The integration status board, as a reader meets it.
 *
 * Three states have to arrive on this page as genuinely different things,
 * because they have genuinely different owners: an operator can fix
 * `not_provisioned`, an engineer can fix `not_implemented`, and nobody is going
 * to fix `refused_by_policy` because it is a decision rather than a gap. A board
 * that rendered all three as "unavailable" would send an engineer to provision
 * a secret and invite a new joiner to file a ticket to "finish" credential
 * custody.
 *
 * The other property is the read-proof on the synthetic-success check: the page
 * has to say how many probes ran, so "no findings" can never quietly mean
 * "nothing was checked".
 */

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import IntegrationsPage from '@/app/[locale]/integrations/page';
import { CAPABILITY_STATE_ORDER, integrationsView } from '@/lib/integrations';
import { UI, pick, type Locale } from '@/lib/i18n';
import { CAPABILITY_STATE_LABEL, POLICY_REFUSAL_LABEL } from '@/lib/labels';

afterEach(cleanup);

const AS_OF = '2026-07-26';
const view = await integrationsView(AS_OF as Parameters<typeof integrationsView>[0]);

async function renderBoard(locale: Locale, query: Record<string, string> = { asOf: AS_OF }) {
  return render(
    await IntegrationsPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve(query),
    }),
  );
}

/** The row of the state-totals table headed by `label`. */
function stateRow(label: string): HTMLElement {
  const heading = screen.getByRole('rowheader', { name: new RegExp(label) });
  const row = heading.closest('tr');
  if (row === null) throw new Error(`no row for ${label}`);
  return row;
}

describe('the three unavailable states are three different answers', () => {
  it('names each state and says who owns it', async () => {
    await renderBoard('en');
    const owners = [
      ['not_provisioned', UI.ownerNotProvisioned],
      ['not_implemented', UI.ownerNotImplemented],
      ['refused_by_policy', UI.ownerRefused],
      ['available', UI.ownerAvailable],
      ['degraded', UI.ownerDegraded],
    ] as const;

    for (const [state, owner] of owners) {
      const row = stateRow(pick(CAPABILITY_STATE_LABEL[state], 'en'));
      expect(within(row).getByText(pick(owner, 'en')), state).toBeInTheDocument();
    }
  });

  it('says that a policy refusal is nobody’s to fix', async () => {
    // The sentence that stops a ticket being filed.
    await renderBoard('en');
    expect(pick(UI.ownerRefused, 'en')).toMatch(/decision, not a gap/i);
    expect(screen.getByText(pick(UI.ownerRefused, 'en'))).toBeInTheDocument();
  });

  it('gives every state a row even when nothing is in it', async () => {
    // `degraded` is zero today. Dropping the row would make the board look like
    // it has no notion of partial failure.
    await renderBoard('en');
    for (const state of CAPABILITY_STATE_ORDER) {
      const row = stateRow(pick(CAPABILITY_STATE_LABEL[state], 'en'));
      expect(row.querySelectorAll('td')[0]?.textContent, state).toBe(
        String(view.board.totals[state]),
      );
    }
    expect(view.board.totals.degraded).toBe(0);
  });

  it('labels the three states differently in both languages', async () => {
    for (const locale of ['en', 'es'] as const) {
      const labels = new Set(
        (['not_provisioned', 'not_implemented', 'refused_by_policy'] as const).map((s) =>
          pick(CAPABILITY_STATE_LABEL[s], locale),
        ),
      );
      expect(labels.size, locale).toBe(3);
    }
  });
});

describe('the refusal rows explain the policy', () => {
  it('names the refusal, what it refuses, why, and what happens instead', async () => {
    // This is how a new engineer learns why credential custody is not on the
    // roadmap. A bare "refused" would read as an unfinished feature.
    const { container } = await renderBoard('en');
    const policy = container.querySelector('#policy');
    expect(policy).not.toBeNull();

    const section = policy as HTMLElement;
    expect(within(section).getByText(pick(UI.integrationsWhatIsRefused, 'en'))).toBeInTheDocument();
    expect(within(section).getByText(pick(UI.integrationsWhy, 'en'))).toBeInTheDocument();
    expect(within(section).getByText(pick(UI.integrationsInsteadDo, 'en'))).toBeInTheDocument();

    // The policy's own text, from `@meridian/govtech`, not a paraphrase.
    expect(section.textContent).toContain(view.policy.summary);
    for (const item of view.policy.refuses) expect(section.textContent).toContain(item);
    for (const item of view.policy.because) expect(section.textContent).toContain(item);
    for (const item of view.policy.insteadDo) expect(section.textContent).toContain(item);
  });

  it('lists every refused capability with its reason and an alternative', async () => {
    const { container } = await renderBoard('en');
    const policy = container.querySelector('#policy') as HTMLElement;
    const refused = view.adapters
      .flatMap((a) => a.capabilities)
      .filter((c) => c.capability.state === 'refused_by_policy');

    expect(refused.length).toBeGreaterThan(0);
    for (const { capability } of refused) {
      expect(policy.textContent, capability.id).toContain(capability.id);
      expect(policy.textContent, capability.id).toContain(capability.reason);
      expect(policy.textContent, capability.id).toContain(
        capability.alternative?.description ?? '',
      );
    }
  });

  it('names the credential-custody refusal on the board', async () => {
    await renderBoard('en');
    expect(
      screen.getAllByText(pick(POLICY_REFUSAL_LABEL.no_credential_custody, 'en')).length,
    ).toBeGreaterThan(0);
  });
});

describe('preconditions', () => {
  it('shows outstanding requirements by key name and says so', async () => {
    // Naming the key is safe precisely because no value is read. The page has
    // to say that, or an operator reasonably assumes the opposite.
    const { container } = await renderBoard('en');
    const outstanding = view.adapters.flatMap((a) => a.capabilities).flatMap((c) => c.outstanding);
    expect(outstanding.length).toBeGreaterThan(0);
    for (const key of outstanding) expect(container.textContent).toContain(key);
    expect(screen.getAllByText(pick(UI.integrationsKeyNamesOnly, 'en')).length).toBeGreaterThan(0);
  });

  it('renders no environment value anywhere on the page', async () => {
    process.env.MERIDIAN_CLAVE_ENDPOINT_TEST_CANARY = 'canary-value-must-not-render';
    try {
      const { container } = await renderBoard('en');
      expect(container.textContent).not.toContain('canary-value-must-not-render');
    } finally {
      delete process.env.MERIDIAN_CLAVE_ENDPOINT_TEST_CANARY;
    }
  });
});

describe('the no-synthetic-success check', () => {
  it('reports how many probes ran, not only that nothing was found', async () => {
    // The read-proof. "0 findings" from 0 probes and "0 findings" from 6 probes
    // must never print the same thing.
    const { container } = await renderBoard('en');
    expect(view.probesRun).toBeGreaterThan(0);
    expect(container.textContent).toContain(
      `${view.probesRun} probes ran and none returned data it could not have obtained.`,
    );
  });
});

describe('what the adapters say, in their own words', () => {
  it('marks an adapter’s own English prose rather than translating it', async () => {
    // The page exists to relay the adapter's account of itself. Rewriting it in
    // Spanish would make the console the author of a claim it exists to carry.
    const { container } = await renderBoard('es');
    const marked = [...container.querySelectorAll('[lang="en"]')];
    expect(marked.length).toBeGreaterThan(0);

    const firstReason = view.adapters[0]?.capabilities[0]?.capability.reason ?? '';
    expect(firstReason.length).toBeGreaterThan(0);
    expect(marked.some((el) => el.textContent?.includes(firstReason))).toBe(true);
  });

  it('renders the console’s own copy in Spanish on the same page', async () => {
    const { container } = await renderBoard('es');
    expect(container.textContent).toContain(pick(UI.integrationsPolicyTitle, 'es'));
    expect(container.textContent).toContain(pick(UI.ownerRefused, 'es'));
  });

  it('marks a cited instrument with the language it was enacted in', async () => {
    const { container } = await renderBoard('es');
    const cites = [...container.querySelectorAll('cite')];
    expect(cites.length).toBeGreaterThan(0);
    expect(cites.some((c) => c.getAttribute('lang') !== null)).toBe(true);
  });
});

describe('accessibility', () => {
  it('has exactly one h1', async () => {
    await renderBoard('en');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('gives every section an accessible name', async () => {
    const { container } = await renderBoard('en');
    const sections = [...container.querySelectorAll('section')];
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy).not.toBeNull();
      expect(container.querySelector(`#${labelledBy}`)?.textContent ?? '').not.toBe('');
    }
  });

  it('states every capability in words, never by colour alone', async () => {
    const { container } = await renderBoard('en');
    for (const state of CAPABILITY_STATE_ORDER) {
      if (view.board.totals[state] === 0) continue;
      expect(container.textContent, state).toContain(pick(CAPABILITY_STATE_LABEL[state], 'en'));
    }
  });

  it('links an honest alternative to a capability that is actually on the page', async () => {
    // A dangling in-page anchor is a link a reader follows to nothing.
    const { container } = await renderBoard('en');
    for (const anchor of container.querySelectorAll('a[href^="#capability-"]')) {
      const id = anchor.getAttribute('href')?.slice(1) ?? '';
      expect(container.querySelector(`[id="${id}"]`), id).not.toBeNull();
    }
  });
});
