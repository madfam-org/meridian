/**
 * Caseload derivations.
 *
 * The deadline arithmetic is the part a practitioner acts on, so the tests are
 * weighted towards the edges of the triage bands, the ordering of a list that
 * must not bury a missed date, and the one projection that distinguishes this
 * console from a today-shaped check: a document is asked about the *submission*
 * date, not about now.
 */

import { countryCode, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  APPROACHING_WINDOW_DAYS,
  CRITICAL_WINDOW_DAYS,
  MATTER_STATUS_ORDER,
  blockers,
  blockersByOwner,
  catalogDependencies,
  deadlines,
  distribution,
  documentFreshness,
  lastStateChange,
  resolvedTasks,
  severityFor,
  timeCritical,
  workInHand,
} from '@/lib/caseload';
import { representativeStandings } from '@/lib/roster';
import {
  ASOF,
  auditRecord,
  daysFrom,
  document,
  firmRecords,
  matterRecord,
  representative,
  task,
} from './fixtures';

describe('severityFor', () => {
  it('lands on the right side of every band edge', () => {
    // The bands are the console's own thresholds for how loudly to speak, and
    // an off-by-one at 14 moves a file off the front page on the day it most
    // needs to be on it.
    expect(severityFor(-1)).toBe('passed');
    expect(severityFor(0)).toBe('critical');
    expect(severityFor(CRITICAL_WINDOW_DAYS)).toBe('critical');
    expect(severityFor(CRITICAL_WINDOW_DAYS + 1)).toBe('approaching');
    expect(severityFor(APPROACHING_WINDOW_DAYS)).toBe('approaching');
    expect(severityFor(APPROACHING_WINDOW_DAYS + 1)).toBe('scheduled');
  });

  it('treats today as critical, not as passed', () => {
    expect(severityFor(0)).toBe('critical');
  });
});

describe('distribution', () => {
  it('renders every phase, including the ones nothing is in', () => {
    // An empty phase is information — nothing is at that stage. Dropping the
    // row would make an empty pipeline look like a short one.
    const dist = distribution([matterRecord({ matter: { phase: 'submission' } })]);
    expect(dist.rows).toHaveLength(6);
    expect(dist.rows.map((r) => r.phase)).toEqual([
      'intake',
      'identity_validation',
      'document_assembly',
      'submission',
      'post_arrival_tracking',
      'status_transition',
    ]);
    expect(dist.rows.filter((r) => r.total === 0)).toHaveLength(5);
  });

  it('counts an empty caseload as empty rather than as nothing', () => {
    const dist = distribution([]);
    expect(dist.total).toBe(0);
    expect(dist.live).toBe(0);
    expect(dist.closed).toBe(0);
    expect(dist.occupiedStatuses).toEqual([]);
    expect(dist.rows).toHaveLength(6);
  });

  it('separates live from closed by core’s own terminal test', () => {
    const dist = distribution([
      matterRecord({ matter: { id: 'a', status: 'active' } }),
      matterRecord({ matter: { id: 'b', status: 'granted' } }),
      matterRecord({ matter: { id: 'c', status: 'abandoned' } }),
    ]);
    expect(dist.total).toBe(3);
    expect(dist.live).toBe(1);
    expect(dist.closed).toBe(2);
  });

  it('lists occupied statuses in canonical order, not in encounter order', () => {
    const dist = distribution([
      matterRecord({ matter: { id: 'a', status: 'granted' } }),
      matterRecord({ matter: { id: 'b', status: 'draft' } }),
      matterRecord({ matter: { id: 'c', status: 'submitted' } }),
    ]);
    expect(dist.occupiedStatuses).toEqual(['draft', 'submitted', 'granted']);
    expect(MATTER_STATUS_ORDER.indexOf('draft')).toBeLessThan(
      MATTER_STATUS_ORDER.indexOf('granted'),
    );
  });

  it('does not change with the order the matters arrive in', () => {
    const a = matterRecord({ matter: { id: 'a', status: 'active', phase: 'intake' } });
    const b = matterRecord({ matter: { id: 'b', status: 'granted', phase: 'submission' } });
    expect(distribution([a, b])).toEqual(distribution([b, a]));
  });
});

describe('lastStateChange', () => {
  const trail = [
    auditRecord({ id: 'e1', on: isoDate('2026-01-05'), kind: 'matter_opened' }),
    auditRecord({ id: 'e2', on: isoDate('2026-03-01'), kind: 'status_changed' }),
    auditRecord({ id: 'e3', on: isoDate('2026-05-20'), kind: 'phase_advanced' }),
    // Not a state change. A document arriving does not mean the file moved.
    auditRecord({ id: 'e4', on: isoDate('2026-07-01'), kind: 'document_received' }),
    auditRecord({ id: 'e5', on: isoDate('2026-07-10'), kind: 'status_changed', matterId: 'other' }),
  ];

  it('reads the latest state-changing entry for the matter', () => {
    expect(lastStateChange(trail, 'matter-fixture')).toBe('2026-05-20');
  });

  it('returns null when the trail records nothing about the matter', () => {
    expect(lastStateChange(trail, 'matter-unknown')).toBeNull();
  });

  it('does not depend on the order of the trail it is handed', () => {
    expect(lastStateChange([...trail].reverse(), 'matter-fixture')).toBe('2026-05-20');
  });
});

describe('blockers', () => {
  const rep = representative({ credential: { id: 'rep-live', expiresOn: daysFrom(ASOF, 400) } });

  function blockersFor(records: Parameters<typeof blockers>[0]) {
    return blockers(records, representativeStandings(records, ASOF), ASOF, 'en');
  }

  it('says nothing about a closed matter', () => {
    const records = firmRecords({
      matters: [matterRecord({ matter: { status: 'granted', representativeId: null } })],
    });
    expect(blockersFor(records)).toHaveLength(0);
  });

  it('names an unassigned file and a file naming somebody off the roster differently', () => {
    const records = firmRecords({
      representatives: [rep],
      matters: [
        matterRecord({ matter: { id: 'm-none', representativeId: null } }),
        matterRecord({ matter: { id: 'm-ghost', representativeId: 'rep-ghost' } }),
      ],
    });
    const codes = blockersFor(records).map((b) => b.code);
    expect(codes).toContain('no_representative');
    expect(codes).toContain('representative_not_on_roster');
  });

  it('reports a downgrade as its own blocker, owned by the firm', () => {
    const lapsed = representative({
      credential: { id: 'rep-lapsed', expiresOn: daysFrom(ASOF, -1) },
    });
    const records = firmRecords({
      representatives: [lapsed],
      matters: [matterRecord({ matter: { representativeId: 'rep-lapsed' } })],
    });
    const downgrade = blockersFor(records).find((b) => b.code === 'advice_downgraded');
    expect(downgrade).toBeDefined();
    expect(downgrade?.owner).toBe('firm');
  });

  it('attaches the age of the file to every blocker on it, not only the status one', () => {
    // A reader asking "how long has this been stuck" means the file. Omitting
    // the date elsewhere rendered a recorded date as "not recorded".
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { status: 'awaiting_applicant', representativeId: null } }),
      ],
      audit: [auditRecord({ on: isoDate('2026-06-26'), kind: 'status_changed' })],
    });
    const found = blockersFor(records);
    expect(found.length).toBeGreaterThan(1);
    for (const blocker of found) {
      expect(blocker.since).toBe('2026-06-26');
      expect(blocker.ageDays).toBe(30);
    }
  });

  it('leaves the age absent rather than inventing one when the trail is silent', () => {
    const records = firmRecords({
      matters: [matterRecord({ matter: { representativeId: null } })],
    });
    for (const blocker of blockersFor(records)) {
      expect(blocker.since).toBeUndefined();
      expect(blocker.ageDays).toBeUndefined();
    }
  });

  it('reports a pathway that is not in the catalog', () => {
    const records = firmRecords({
      representatives: [rep],
      matters: [
        matterRecord({ matter: { representativeId: 'rep-live', pathwayId: 'zz-not-a-pathway' } }),
      ],
    });
    const missing = blockersFor(records).find((b) => b.code === 'pathway_not_in_catalog');
    expect(missing).toBeDefined();
    expect(missing?.summary).toContain('zz-not-a-pathway');
  });

  it('reports a task dependency cycle as the platform’s problem, not the firm’s', () => {
    // A cycle is a defect in whatever generated the tasks. Routing it to the
    // caseworker would ask them to fix something they cannot reach.
    const records = firmRecords({
      representatives: [rep],
      matters: [
        matterRecord({
          matter: { representativeId: 'rep-live' },
          tasks: [
            task({ id: 't1', dependsOn: ['t2'], status: 'locked' }),
            task({ id: 't2', dependsOn: ['t1'], status: 'locked' }),
          ],
        }),
      ],
    });
    const cycle = blockersFor(records).find((b) => b.code === 'task_dependency_cycle');
    expect(cycle).toBeDefined();
    expect(cycle?.owner).toBe('platform');
  });

  it('writes the summary in the reader’s language', () => {
    const records = firmRecords({
      matters: [matterRecord({ matter: { representativeId: null } })],
    });
    const en = blockers(records, [], ASOF, 'en');
    const es = blockers(records, [], ASOF, 'es');
    expect(en[0]?.summary).not.toBe('');
    expect(es[0]?.summary).not.toBe('');
    expect(es[0]?.summary).not.toBe(en[0]?.summary);
    expect(es[0]?.code).toBe(en[0]?.code);
  });

  it('groups by owner in a fixed order and drops empty groups', () => {
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { id: 'm1', status: 'awaiting_authority', representativeId: null } }),
      ],
    });
    const groups = blockersByOwner(blockersFor(records));
    expect(groups.map((g) => g.owner)).toEqual(['firm', 'authority']);
    expect(groups.every((g) => g.blockers.length > 0)).toBe(true);
  });
});

describe('workInHand', () => {
  it('counts against the unlocked view, not the raw task statuses', () => {
    // A raw count of locked tasks tells a practitioner nothing; most are locked
    // for a good reason. What is actionable is what became available once the
    // phase and the dependencies resolved.
    const records = [
      matterRecord({
        matter: { phase: 'intake' },
        tasks: [
          task({ id: 't1', status: 'complete', assignee: 'applicant' }),
          task({ id: 't2', status: 'locked', dependsOn: ['t1'], assignee: 'applicant' }),
        ],
      }),
    ];
    const rows = workInHand(records);
    const applicant = rows.find((r) => r.assignee === 'applicant');
    expect(applicant?.available).toBe(1);
    expect(applicant?.locked).toBe(0);
  });

  it('ignores tasks on a closed matter', () => {
    const records = [
      matterRecord({
        matter: { status: 'withdrawn' },
        tasks: [task({ id: 't1', status: 'available' })],
      }),
    ];
    expect(workInHand(records)).toEqual([]);
  });
});

describe('resolvedTasks', () => {
  it('orders by phase, then by dependency count, then by id — totally', () => {
    const record = matterRecord({
      matter: { phase: 'submission' },
      tasks: [
        task({ id: 'b', phase: 'submission', dependsOn: ['a'], status: 'available' }),
        task({ id: 'a', phase: 'intake', status: 'available' }),
        task({ id: 'c', phase: 'submission', status: 'available' }),
      ],
    });
    expect(resolvedTasks(record).map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('deadlines', () => {
  const rep = representative({ credential: { id: 'rep-live', expiresOn: daysFrom(ASOF, 400) } });

  it('sorts by date so a missed deadline sits above an imminent one', () => {
    // Something already missed is more urgent than something about to be, and a
    // list that buries it under today's work is how it stays missed.
    const records = firmRecords({
      representatives: [rep],
      matters: [
        matterRecord({
          matter: { id: 'm1', representativeId: 'rep-live' },
          statusExpiresOn: daysFrom(ASOF, -5),
          targetSubmissionDate: daysFrom(ASOF, 3),
        }),
      ],
    });
    const list = deadlines(records, [], ASOF, 'en');
    expect(list.map((d) => d.severity)).toEqual(['passed', 'critical']);
    expect(list[0]?.daysRemaining).toBe(-5);
    expect(timeCritical(list)).toHaveLength(2);
  });

  it('produces the same order whichever order the matters arrive in', () => {
    const one = matterRecord({
      reference: 'MAT-1',
      matter: { id: 'm1', representativeId: null },
      statusExpiresOn: daysFrom(ASOF, 10),
    });
    const two = matterRecord({
      reference: 'MAT-2',
      matter: { id: 'm2', representativeId: null },
      statusExpiresOn: daysFrom(ASOF, 10),
    });
    const forwards = deadlines(firmRecords({ matters: [one, two] }), [], ASOF, 'en');
    const backwards = deadlines(firmRecords({ matters: [two, one] }), [], ASOF, 'en');
    expect(backwards.map((d) => d.id)).toEqual(forwards.map((d) => d.id));
  });

  it('counts days across a leap day correctly', () => {
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { representativeId: null }, statusExpiresOn: isoDate('2028-03-01') }),
      ],
    });
    const [deadline] = deadlines(records, [], isoDate('2028-02-28'), 'en');
    expect(deadline?.daysRemaining).toBe(2);
  });

  it('marks a task title as record content and its own copy as not', () => {
    // A task title is what somebody typed on the file. It is reproduced
    // verbatim, and the page needs to know that to mark the language.
    const records = firmRecords({
      matters: [
        matterRecord({
          matter: { representativeId: null },
          tasks: [
            task({ id: 't1', status: 'available', title: 'Pedir certificado de antecedentes', dueOn: daysFrom(ASOF, 5) }),
          ],
        }),
      ],
    });
    const taskDeadline = deadlines(records, [], ASOF, 'en').find((d) => d.kind === 'task_due');
    expect(taskDeadline?.label).toBe('Pedir certificado de antecedentes');
    expect(taskDeadline?.labelIsRecord).toBe(true);
  });

  it('does not chase a task that is already done', () => {
    const records = firmRecords({
      matters: [
        matterRecord({
          matter: { representativeId: null },
          tasks: [
            task({ id: 't1', status: 'complete', dueOn: daysFrom(ASOF, 5) }),
            task({ id: 't2', status: 'waived', dueOn: daysFrom(ASOF, 5) }),
          ],
        }),
      ],
    });
    expect(deadlines(records, [], ASOF, 'en').filter((d) => d.kind === 'task_due')).toHaveLength(0);
  });

  it('raises a credential expiry only when it is lapsed or gating live work', () => {
    // A licence expiring in a year on a representative carrying nothing is not
    // a deadline. Listing it would drown the ones that are.
    const idle = representative({
      displayName: 'Idle',
      credential: { id: 'rep-idle', expiresOn: daysFrom(ASOF, 30) },
    });
    const busy = representative({
      displayName: 'Busy',
      credential: { id: 'rep-busy', expiresOn: daysFrom(ASOF, 30) },
    });
    const records = firmRecords({
      representatives: [idle, busy],
      matters: [matterRecord({ matter: { representativeId: 'rep-busy' } })],
    });
    const standings = representativeStandings(records, ASOF);
    const credentialDeadlines = deadlines(records, standings, ASOF, 'en').filter(
      (d) => d.kind === 'credential_expiry',
    );
    expect(credentialDeadlines).toHaveLength(1);
    expect(credentialDeadlines[0]?.id).toBe('credential:rep-busy');
    expect(credentialDeadlines[0]?.matterId).toBeNull();
  });

  it('marks a package’s own rationale as foreign rather than paraphrasing it', () => {
    const records = firmRecords({
      matters: [
        matterRecord({
          matter: { representativeId: null, targetJurisdiction: countryCode('ES') },
          targetSubmissionDate: daysFrom(ASOF, 60),
          documents: [document({ id: 'doc-police', issuedOn: isoDate('2026-06-01') })],
        }),
      ],
    });
    const window = deadlines(records, [], ASOF, 'en').find((d) => d.kind === 'acceptance_window');
    if (window !== undefined) {
      expect(window.detailIsForeign).toBe(true);
      expect(window.detail.length).toBeGreaterThan(0);
    }
  });
});

describe('documentFreshness', () => {
  it('projects against the target submission date, not against today', () => {
    // The whole point. A certificate that is fine now and three weeks out of
    // its window when the file is lodged passes a today-shaped check and fails
    // the only check that counts.
    const doc = document({ id: 'doc-police', issuedOn: isoDate('2026-06-01') });
    const soon = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [doc],
      targetSubmissionDate: daysFrom(ASOF, 1),
    });
    const later = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [doc],
      targetSubmissionDate: daysFrom(ASOF, 400),
    });
    expect(documentFreshness(soon, ASOF)[0]?.projection.submissionDate).toBe(daysFrom(ASOF, 1));
    expect(documentFreshness(later, ASOF)[0]?.projection.submissionDate).toBe(daysFrom(ASOF, 400));
  });

  it('falls back to the reference date when no filing date is known', () => {
    const record = matterRecord({ documents: [document()] });
    expect(documentFreshness(record, ASOF)[0]?.projection.submissionDate).toBe(ASOF);
  });

  it('does not project a document the firm does not hold', () => {
    const record = matterRecord({
      documents: [document({ id: 'doc-missing', status: 'required' })],
    });
    expect(documentFreshness(record, ASOF)).toHaveLength(0);
  });
});

describe('catalogDependencies', () => {
  it('orders by how much live work rests on the record', () => {
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { id: 'm1', pathwayId: 'zz-one', representativeId: null } }),
        matterRecord({ matter: { id: 'm2', pathwayId: 'zz-two', representativeId: null } }),
        matterRecord({ matter: { id: 'm3', pathwayId: 'zz-two', representativeId: null } }),
      ],
    });
    const deps = catalogDependencies(records, ASOF);
    expect(deps.map((d) => d.pathwayId)).toEqual(['zz-two', 'zz-one']);
    expect(deps[0]?.liveMatters).toHaveLength(2);
  });

  it('does not count closed matters as a dependency on the catalog', () => {
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { id: 'm1', pathwayId: 'zz-one', status: 'granted' } }),
      ],
    });
    expect(catalogDependencies(records, ASOF)).toEqual([]);
  });

  it('reports a pathway missing from the catalog as unreviewed and unresolved', () => {
    // `reviewed` must never be true for a record nobody can read. A null
    // pathway that defaulted to reviewed would let an unknown id look signed
    // off.
    const records = firmRecords({
      matters: [matterRecord({ matter: { pathwayId: 'zz-nope', representativeId: null } })],
    });
    const [dep] = catalogDependencies(records, ASOF);
    expect(dep?.pathway).toBeNull();
    expect(dep?.reviewed).toBe(false);
    expect(dep?.closedAsOf).toBe(false);
  });
});
