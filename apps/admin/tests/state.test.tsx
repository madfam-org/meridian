/**
 * Domain state to tone, and domain state to words.
 *
 * `components/state.tsx` exists so that "what colour is `awaiting_authority`"
 * has one answer across six screens, and every mapping in it is a total function
 * over a closed union with no default branch. The point of that design is that
 * adding a status to `@meridian/core` breaks compilation instead of rendering
 * the new state as neutral grey on every page at once.
 *
 * These tests are the runtime half of the same guarantee. Each union is
 * enumerated through a `Record<Union, true>` literal, so adding a member to core
 * makes **this file** fail to compile too — a test that quietly stopped covering
 * a new state would be worse than no test, because it would report full coverage
 * of a union it had never heard of.
 */

import type { MatterStatus, RepresentativeCredential, Staleness, TaskStatus } from '@meridian/core';
import type { CapabilityState } from '@meridian/govtech';
import type { PathwayStatus, ReviewStatus } from '@meridian/pathways';
import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { DeadlineSeverity } from '@/lib/caseload';
import type { LicenceStanding, VerificationStanding } from '@/lib/roster';
import { LOCALES, type Locale } from '@/lib/i18n';
import {
  CapabilityStateBadge,
  CredentialName,
  MatterStatusBadge,
  PathwayStatusBadge,
  ReviewStatusBadge,
  TaskStatusBadge,
  capabilityStateTone,
  licenceStandingTone,
  matterStatusTone,
  pathwayStatusTone,
  reviewStatusTone,
  severityTone,
  stalenessTone,
  taskStatusTone,
  verificationTone,
} from '@/components/state';
import type { Tone } from '@/components/ui';

afterEach(cleanup);

/**
 * Every member of a closed union, checked by the compiler.
 *
 * A missing key is a type error here, which is the only way a list like this
 * stays honest as the domain grows.
 */
function every<T extends string>(table: Record<T, true>): T[] {
  return Object.keys(table) as T[];
}

const TONES: readonly Tone[] = ['ok', 'warn', 'danger', 'info', 'neutral', 'refused'];

const MATTER_STATUSES = every<MatterStatus>({
  draft: true,
  active: true,
  awaiting_applicant: true,
  awaiting_authority: true,
  awaiting_representative_review: true,
  submitted: true,
  granted: true,
  refused: true,
  withdrawn: true,
  abandoned: true,
});

const TASK_STATUSES = every<TaskStatus>({
  locked: true,
  available: true,
  in_progress: true,
  submitted: true,
  complete: true,
  waived: true,
});

const SEVERITIES = every<DeadlineSeverity>({
  passed: true,
  critical: true,
  approaching: true,
  scheduled: true,
});

const STALENESS_BANDS = every<Staleness>({ fresh: true, aging: true, stale: true });

const REVIEW_STATUSES = every<ReviewStatus>({
  unreviewed: true,
  counsel_reviewed: true,
  needs_reverification: true,
});

const PATHWAY_STATUSES = every<PathwayStatus>({ open: true, closed: true, suspended: true });

const CAPABILITY_STATES = every<CapabilityState>({
  available: true,
  not_provisioned: true,
  not_implemented: true,
  degraded: true,
  refused_by_policy: true,
});

const LICENCE_STANDINGS = every<LicenceStanding>({
  live: true,
  expiring: true,
  lapsed: true,
  no_expiry_recorded: true,
  unreadable_expiry: true,
});

const VERIFICATION_STANDINGS = every<VerificationStanding>({
  current: true,
  due: true,
  overdue: true,
  unreadable: true,
});

const TONE_FUNCTIONS = [
  ['matterStatusTone', MATTER_STATUSES, matterStatusTone],
  ['taskStatusTone', TASK_STATUSES, taskStatusTone],
  ['severityTone', SEVERITIES, severityTone],
  ['stalenessTone', STALENESS_BANDS, stalenessTone],
  ['reviewStatusTone', REVIEW_STATUSES, reviewStatusTone],
  ['pathwayStatusTone', PATHWAY_STATUSES, pathwayStatusTone],
  ['capabilityStateTone', CAPABILITY_STATES, capabilityStateTone],
  ['licenceStandingTone', LICENCE_STANDINGS, licenceStandingTone],
  ['verificationTone', VERIFICATION_STANDINGS, verificationTone],
] as const;

describe('tone mappings are total', () => {
  for (const [name, members, toneOf] of TONE_FUNCTIONS) {
    it(`${name} answers for every member of its union`, () => {
      expect(members.length).toBeGreaterThan(0);
      for (const member of members) {
        // `undefined` here is what a missing `case` produces at runtime: a
        // badge with no tone class, rendered grey, on every page at once.
        const tone = toneOf(member as never);
        expect(TONES, `${name}(${member})`).toContain(tone);
      }
    });
  }
});

describe('tone choices that carry a judgement', () => {
  it('does not paint waiting on an authority as a problem', () => {
    // The clock is outside the firm's control. Painting it as a fault trains
    // people to ignore the colour — including on the states that are theirs.
    expect(matterStatusTone('awaiting_authority')).toBe('info');
    expect(matterStatusTone('awaiting_representative_review')).toBe('warn');
    expect(matterStatusTone('awaiting_applicant')).toBe('warn');
  });

  it('gives a settled policy refusal its own tone rather than a red one', () => {
    // `refused_by_policy` is a decision, not a fault. Rendering it as danger
    // would invite somebody to file a ticket to "finish" it.
    expect(capabilityStateTone('refused_by_policy')).toBe('refused');
    expect(capabilityStateTone('not_provisioned')).not.toBe('refused');
    expect(capabilityStateTone('not_implemented')).not.toBe('refused');
    expect(
      new Set([
        capabilityStateTone('not_provisioned'),
        capabilityStateTone('not_implemented'),
        capabilityStateTone('refused_by_policy'),
      ]).size,
    ).toBe(3);
  });

  it('treats an unreviewed catalog record as something to act on', () => {
    expect(reviewStatusTone('unreviewed')).toBe('warn');
    expect(reviewStatusTone('needs_reverification')).toBe('danger');
    expect(reviewStatusTone('counsel_reviewed')).toBe('ok');
  });

  it('treats a lapsed and an unreadable credential with the same seriousness', () => {
    // Neither can be relied on. An unreadable expiry rendered as neutral would
    // read as "nothing to see".
    expect(licenceStandingTone('lapsed')).toBe('danger');
    expect(licenceStandingTone('unreadable_expiry')).toBe('danger');
    expect(licenceStandingTone('no_expiry_recorded')).toBe('neutral');
  });

  it('does not render a missed deadline more quietly than an imminent one', () => {
    expect(severityTone('passed')).toBe('danger');
    expect(severityTone('critical')).toBe('danger');
  });
});

/**
 * Each badge with the union it renders, wrapped so the element is constructed
 * with its real prop type rather than through a cast — a cast here would hide
 * exactly the kind of mismatch these tests exist to catch.
 */
interface BadgeCase {
  readonly name: string;
  readonly members: readonly string[];
  readonly render: (member: string, locale: Locale) => ReactElement;
}

const BADGES: readonly BadgeCase[] = [
  {
    name: 'MatterStatusBadge',
    members: MATTER_STATUSES,
    render: (m, locale) => <MatterStatusBadge status={m as MatterStatus} locale={locale} />,
  },
  {
    name: 'TaskStatusBadge',
    members: TASK_STATUSES,
    render: (m, locale) => <TaskStatusBadge status={m as TaskStatus} locale={locale} />,
  },
  {
    name: 'ReviewStatusBadge',
    members: REVIEW_STATUSES,
    render: (m, locale) => <ReviewStatusBadge status={m as ReviewStatus} locale={locale} />,
  },
  {
    name: 'PathwayStatusBadge',
    members: PATHWAY_STATUSES,
    render: (m, locale) => <PathwayStatusBadge status={m as PathwayStatus} locale={locale} />,
  },
  {
    name: 'CapabilityStateBadge',
    members: CAPABILITY_STATES,
    render: (m, locale) => <CapabilityStateBadge state={m as CapabilityState} locale={locale} />,
  },
];

/** The text a reader sees, minus the decorative glyph. */
function visibleLabel(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
  return (clone.textContent ?? '').trim();
}

describe('every badge says the state in words', () => {
  for (const { name, members, render: renderBadge } of BADGES) {
    for (const locale of LOCALES) {
      it(`${name} labels every member in ${locale}`, () => {
        const labels = new Set<string>();
        for (const member of members) {
          const { container } = render(renderBadge(member, locale));
          const label = visibleLabel(container);
          expect(label, `${name}(${member}) in ${locale}`).not.toBe('');
          labels.add(label);
          cleanup();
        }
        // Two states that render the same words are two states a reader cannot
        // tell apart, which is the same defect as rendering both grey.
        expect(labels.size, `${name} in ${locale}`).toBe(members.length);
      });
    }
  }
});

describe('no state is carried by colour alone', () => {
  it('renders a second, non-colour channel beside every label', () => {
    // The glyph survives greyscale printing, a projector and colour vision
    // deficiency. It is `aria-hidden` because the label already says the thing.
    for (const { name, members, render: renderBadge } of BADGES) {
      for (const member of members) {
        const { container } = render(renderBadge(member, 'en'));
        const glyph = container.querySelector('[aria-hidden="true"]');
        expect(glyph, `${name}(${member})`).not.toBeNull();
        expect((glyph?.textContent ?? '').trim(), `${name}(${member})`).not.toBe('');
        cleanup();
      }
    }
  });

  it('gives each tone its own glyph, so two tones are distinguishable in monochrome', () => {
    // Between them these two unions reach all six tones. A glyph shared by two
    // tones would collapse the distinction for exactly the reader the second
    // channel exists for.
    const byTone = new Map<Tone, string>();
    const record = (tone: Tone, container: HTMLElement) => {
      byTone.set(tone, container.querySelector('[aria-hidden="true"]')?.textContent ?? '');
      cleanup();
    };
    for (const status of MATTER_STATUSES) {
      record(matterStatusTone(status), render(<MatterStatusBadge status={status} locale="en" />).container);
    }
    for (const state of CAPABILITY_STATES) {
      record(
        capabilityStateTone(state),
        render(<CapabilityStateBadge state={state} locale="en" />).container,
      );
    }

    expect([...byTone.keys()].sort()).toEqual([...TONES].sort());
    expect(new Set(byTone.values()).size).toBe(TONES.length);
  });
});

describe('both languages say something, and say something different', () => {
  it('never leaves a badge in the other language', () => {
    for (const { name, members, render: renderBadge } of BADGES) {
      for (const member of members) {
        const rendered = LOCALES.map((locale: Locale) => {
          const { container } = render(renderBadge(member, locale));
          const label = visibleLabel(container);
          cleanup();
          return label;
        });
        for (const label of rendered) expect(label, `${name}(${member})`).not.toBe('');
      }
    }
  });

  it('translates the words a reader acts on', () => {
    // A Spanish page rendering "Awaiting authority" is the same defect the
    // bilingual pages had, only one-sided.
    const en = render(<MatterStatusBadge status="awaiting_authority" locale="en" />);
    const enLabel = visibleLabel(en.container);
    cleanup();
    const es = render(<MatterStatusBadge status="awaiting_authority" locale="es" />);
    expect(visibleLabel(es.container)).not.toBe(enLabel);
  });
});

/* -------------------------------------------------------------------------- */
/* Credential names                                                           */
/* -------------------------------------------------------------------------- */

const CREDENTIALS = every<RepresentativeCredential>({
  rcic: true,
  canadian_lawyer: true,
  canadian_paralegal: true,
  quebec_notary: true,
  spanish_abogado: true,
  spanish_gestor: true,
  other_regulated: true,
});

describe('CredentialName', () => {
  it('names every credential in both languages', () => {
    for (const credential of CREDENTIALS) {
      for (const locale of LOCALES) {
        const { container } = render(<CredentialName credential={credential} locale={locale} />);
        expect((container.textContent ?? '').trim(), `${credential}/${locale}`).not.toBe('');
        cleanup();
      }
    }
  });

  it('does not translate RCIC, and does not mark it as foreign', () => {
    // An initialism of the College's own English title, read letter by letter
    // in both languages. Translating it would name a body that does not exist;
    // tagging it `lang="en"` would have a Spanish screen reader spell it out in
    // English when the letters are the same.
    for (const locale of LOCALES) {
      const { container } = render(<CredentialName credential="rcic" locale={locale} />);
      const span = container.querySelector('span');
      expect(span?.textContent).toBe('RCIC');
      expect(span?.getAttribute('lang')).toBeNull();
      cleanup();
    }
  });

  it('marks a standing written in a third language with that language', () => {
    // *Notaire du Québec* on a Spanish page, read with Spanish phonetics, is not
    // recognisable to the practitioner hearing it.
    const { container } = render(<CredentialName credential="quebec_notary" locale="es" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('Notaire du Québec');
    expect(span?.getAttribute('lang')).toBe('fr');
  });

  it('marks a Spanish standing as Spanish when the page is in English', () => {
    // The name of the standing *is* Spanish — "Abogado colegiado" — so on an
    // English page it is foreign text and carries `lang`, and on a Spanish page
    // it is not and does not.
    const inEnglish = render(<CredentialName credential="spanish_abogado" locale="en" />);
    expect(inEnglish.container.querySelector('span')?.textContent).toBe('Abogado colegiado');
    expect(inEnglish.container.querySelector('span')?.getAttribute('lang')).toBe('es');
    cleanup();

    const inSpanish = render(<CredentialName credential="spanish_abogado" locale="es" />);
    expect(inSpanish.container.querySelector('span')?.textContent).toBe('Abogado colegiado');
    expect(inSpanish.container.querySelector('span')?.getAttribute('lang')).toBeNull();
  });

  it('describes a Canadian class of licensee without borrowing a Spanish title of art', () => {
    // *Abogado de Canadá*, deliberately not *colegiado*: the second would imply
    // an equivalence between a provincial law society and a Spanish colegio
    // that nobody has established.
    const { container } = render(<CredentialName credential="canadian_lawyer" locale="es" />);
    expect(container.textContent).toBe('Abogado de Canadá');
    expect(container.textContent).not.toContain('colegiado');
    expect(container.querySelector('span')?.getAttribute('lang')).toBeNull();
  });
});
