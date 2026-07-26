/**
 * The append-only trail.
 *
 * Two properties are what make this evidence rather than a log, and both are
 * the kind of thing that regresses silently:
 *
 *  - a sequence number is assigned over the whole trail, once, before any
 *    filtering — otherwise the same event is #4 under one filter and #11 under
 *    another, and a reader loses the ability to say "an entry is missing";
 *  - a filtered view reports its own suppression — otherwise it can be
 *    screenshotted to prove something untrue.
 */

import { isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  AUDIT_ACTOR_KINDS,
  AUDIT_EVENT_KINDS,
  auditView,
  filterFromParams,
  filterIsActive,
  matterHistory,
} from '@/lib/audit-trail';
import { ASOF, auditRecord, firmRecords } from './fixtures';

const TRAIL = firmRecords({
  audit: [
    auditRecord({
      id: 'a3',
      on: isoDate('2026-05-10'),
      at: '11:00',
      kind: 'status_changed',
      actorId: 'staff-luz',
      actorKind: 'staff',
      matterId: 'm1',
      summary: 'Moved to awaiting authority',
    }),
    auditRecord({
      id: 'a1',
      on: isoDate('2026-03-02'),
      at: '09:15',
      kind: 'matter_opened',
      actorId: 'staff-luz',
      actorKind: 'staff',
      matterId: 'm1',
      summary: 'File opened',
    }),
    auditRecord({
      id: 'a4',
      on: isoDate('2026-06-01'),
      at: '16:40',
      kind: 'disclosure_downgraded',
      actorId: 'platform',
      actorKind: 'platform',
      matterId: 'm2',
      summary: 'Recommendation withheld',
      detail: 'Credential expired.',
      disclosure: {
        produced: 'advice',
        released: 'assessment',
        audience: 'applicant',
        reason: 'Representative credential expired.',
      },
    }),
    auditRecord({
      id: 'a2',
      on: isoDate('2026-03-02'),
      at: '09:15',
      kind: 'representative_assigned',
      actorId: 'staff-luz',
      actorKind: 'staff',
      matterId: 'm2',
      summary: 'Assigned to a representative',
    }),
    auditRecord({
      id: 'a5',
      on: isoDate('2026-06-20'),
      at: '08:00',
      kind: 'disclosure_released',
      actorId: 'rep-vega',
      actorKind: 'representative',
      matterId: 'm1',
      summary: 'Advice released',
      disclosure: { produced: 'advice', released: 'advice', audience: 'practitioner' },
    }),
  ],
});

describe('numbering', () => {
  it('numbers the whole trail in written order, tiebroken to a total order', () => {
    // `a1` and `a2` share a date and a wall-clock time. Without the id tiebreak
    // they would sort differently between renders, and a trail whose order
    // changes when you reload it is not evidence of anything.
    const view = auditView(TRAIL, {}, ASOF);
    expect(view.all.map((e) => `${e.seq}:${e.entry.id}`)).toEqual([
      '1:a1',
      '2:a2',
      '3:a3',
      '4:a4',
      '5:a5',
    ]);
  });

  it('keeps an entry’s number the same under every filter', () => {
    // The defect this catches: numbering after filtering. Entry 4 must be entry
    // 4 on every screen, forever.
    const unfiltered = auditView(TRAIL, {}, ASOF);
    const filtered = auditView(TRAIL, { matterId: 'm2' }, ASOF);
    const seqOf = (view: typeof unfiltered, id: string) =>
      view.all.concat(view.visible).find((e) => e.entry.id === id)?.seq;

    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5']) {
      expect(seqOf(filtered, id)).toBe(seqOf(unfiltered, id));
    }
    expect(filtered.visible.map((e) => e.seq)).toEqual([4, 2]);
  });

  it('ages each entry against the reference date, negative for the future', () => {
    const view = auditView(TRAIL, {}, isoDate('2026-06-01'));
    const entry = view.all.find((e) => e.entry.id === 'a4');
    const later = view.all.find((e) => e.entry.id === 'a5');
    expect(entry?.ageDays).toBe(0);
    expect(later?.ageDays).toBe(-19);
  });
});

describe('filtering', () => {
  it('reads newest first while the sequence preserves the written order', () => {
    const view = auditView(TRAIL, {}, ASOF);
    expect(view.visible.map((e) => e.entry.id)).toEqual(['a5', 'a4', 'a3', 'a2', 'a1']);
  });

  it('always reports how many rows it removed', () => {
    // A filtered audit view that does not report its own suppression can be
    // screenshotted to prove something untrue.
    const view = auditView(TRAIL, { actorKind: 'representative' }, ASOF);
    expect(view.visible).toHaveLength(1);
    expect(view.suppressed).toBe(4);
    expect(view.suppressed + view.visible.length).toBe(view.all.length);
  });

  it('reports zero suppression when nothing is filtered', () => {
    expect(auditView(TRAIL, {}, ASOF).suppressed).toBe(0);
  });

  it('never removes anything from the trail itself', () => {
    expect(auditView(TRAIL, { kind: 'matter_opened' }, ASOF).all).toHaveLength(5);
  });

  it('restricts to entries carrying a disclosure decision', () => {
    const view = auditView(TRAIL, { disclosureOnly: true }, ASOF);
    expect(view.visible.map((e) => e.entry.id)).toEqual(['a5', 'a4']);
  });

  it('bounds a date range inclusively at both ends', () => {
    const view = auditView(
      TRAIL,
      { from: isoDate('2026-03-02'), to: isoDate('2026-05-10') },
      ASOF,
    );
    expect(view.visible.map((e) => e.entry.id)).toEqual(['a3', 'a2', 'a1']);
  });

  it('searches summary, detail, actor and kind case-insensitively', () => {
    expect(auditView(TRAIL, { query: 'CREDENTIAL' }, ASOF).visible.map((e) => e.entry.id)).toEqual([
      'a4',
    ]);
    expect(auditView(TRAIL, { query: 'rep-vega' }, ASOF).visible.map((e) => e.entry.id)).toEqual([
      'a5',
    ]);
    expect(
      auditView(TRAIL, { query: 'disclosure_downgraded' }, ASOF).visible.map((e) => e.entry.id),
    ).toEqual(['a4']);
  });
});

describe('facets', () => {
  it('counts over the whole trail, not over the filtered view', () => {
    // A facet list that shrinks as you filter cannot tell you what else is
    // there, which defeats the point of offering it.
    const unfiltered = auditView(TRAIL, {}, ASOF).facets;
    const filtered = auditView(TRAIL, { matterId: 'm1' }, ASOF).facets;
    expect(filtered).toEqual(unfiltered);
  });

  it('lists event kinds in the canonical order, omitting kinds that never occur', () => {
    const { kinds } = auditView(TRAIL, {}, ASOF).facets;
    const order = kinds.map((k) => AUDIT_EVENT_KINDS.indexOf(k.value));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(kinds.map((k) => k.value)).not.toContain('integration_refused');
  });

  it('counts a downgrade only where the released class differs from the produced one', () => {
    // The entry a regulator asks about. An advice-in, advice-out release is not
    // a downgrade, and counting it would bury the ones that are.
    const { disclosures, downgrades } = auditView(TRAIL, {}, ASOF).facets;
    expect(disclosures).toBe(2);
    expect(downgrades).toBe(1);
  });

  it('orders actor facets by count, then by name', () => {
    const { actors } = auditView(TRAIL, {}, ASOF).facets;
    expect(actors[0]).toEqual({ value: 'staff-luz', count: 3 });
    expect(actors.slice(1).map((a) => a.value)).toEqual(['platform', 'rep-vega']);
  });

  it('offers every actor kind the vocabulary defines, in a fixed order', () => {
    expect(AUDIT_ACTOR_KINDS).toContain('authority');
    const { actorKinds } = auditView(TRAIL, {}, ASOF).facets;
    const order = actorKinds.map((k) => AUDIT_ACTOR_KINDS.indexOf(k.value));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('matterHistory', () => {
  it('reads oldest first, carrying the trail-wide sequence numbers', () => {
    // A case history reads forwards, but the numbers stay global so an entry
    // can be matched against the full trail.
    const history = matterHistory(TRAIL, 'm1', ASOF);
    expect(history.map((e) => `${e.seq}:${e.entry.id}`)).toEqual(['1:a1', '3:a3', '5:a5']);
  });

  it('is empty for a matter with no entries, rather than falling back to everything', () => {
    expect(matterHistory(TRAIL, 'm-unknown', ASOF)).toEqual([]);
  });
});

describe('filterFromParams', () => {
  const from = (query: Record<string, string>) => filterFromParams((key) => query[key]);

  it('accepts the vocabulary and drops everything else', () => {
    expect(from({ kind: 'status_changed' }).kind).toBe('status_changed');
    expect(from({ kind: 'file_deleted' }).kind).toBeUndefined();
    expect(from({ actorKind: 'staff' }).actorKind).toBe('staff');
    expect(from({ actorKind: 'robot' }).actorKind).toBeUndefined();
  });

  it('rejects a date that is well-formed and impossible', () => {
    // 2026-02-30 goes through core's parser here exactly as it would anywhere
    // else in Meridian. A silently applied bad bound shows an empty trail.
    expect(from({ from: '2026-02-30' }).from).toBeUndefined();
    expect(from({ to: 'last-tuesday' }).to).toBeUndefined();
    expect(from({ from: '2026-02-28' }).from).toBe('2026-02-28');
  });

  it('reads the disclosure toggle only on an explicit 1', () => {
    expect(from({ disclosure: '1' }).disclosureOnly).toBe(true);
    expect(from({ disclosure: '0' }).disclosureOnly).toBeUndefined();
    expect(from({ disclosure: 'true' }).disclosureOnly).toBeUndefined();
  });

  it('agrees with filterIsActive about whether anything is filtered', () => {
    expect(filterIsActive(from({}))).toBe(false);
    expect(filterIsActive(from({ q: '   ' }))).toBe(false);
    expect(filterIsActive(from({ kind: 'nonsense' }))).toBe(false);
    expect(filterIsActive(from({ q: 'vega' }))).toBe(true);
    expect(filterIsActive(from({ disclosure: '1' }))).toBe(true);
  });
});
