/**
 * Representative standing.
 *
 * A lapsed credential has no symptom. `canRelease` stops releasing advice
 * through it, the applicant quietly receives an assessment instead of a
 * recommendation, and nothing else on any screen changes. So the tests here are
 * about two things: that the bands land on the right side of the boundary, and
 * that the roster's own verdict never disagrees with the gate's — because the
 * moment it does, the page says a credential is fine while every output behind
 * it has already been downgraded.
 */

import { canRelease, type AuthorizedRepresentative } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import {
  CREDENTIAL_EXPIRY_WARNING_DAYS,
  VERIFICATION_DUE_DAYS,
  VERIFICATION_OVERDUE_DAYS,
  danglingRepresentativeAssignments,
  representativeStandings,
  unrepresentedLiveMatters,
} from '@/lib/roster';
import { ASOF, daysFrom, firmRecords, matterRecord, representative } from './fixtures';

/** One representative, one live matter, standing computed as at `ASOF`. */
function standingWith(credentialOverrides: Partial<AuthorizedRepresentative>) {
  const rep = representative({ credential: credentialOverrides });
  const records = firmRecords({
    representatives: [rep],
    matters: [matterRecord({ matter: { representativeId: rep.credential.id } })],
  });
  const [standing] = representativeStandings(records, ASOF);
  if (standing === undefined) throw new Error('fixture produced no standing');
  return standing;
}

describe('licence standing bands', () => {
  it('is live when the expiry is beyond the firm’s lead time', () => {
    const standing = standingWith({
      expiresOn: daysFrom(ASOF, CREDENTIAL_EXPIRY_WARNING_DAYS + 1),
    });
    expect(standing.licence.standing).toBe('live');
    expect(standing.licence.daysRemaining).toBe(CREDENTIAL_EXPIRY_WARNING_DAYS + 1);
    expect(standing.needsAttention).toBe(false);
  });

  it('is expiring on the last day of the lead time, not the day after', () => {
    // Off-by-one here is the difference between sixty days of warning and
    // fifty-nine. The band is the firm's own policy, so the boundary is ours to
    // get right rather than to guess at.
    expect(standingWith({ expiresOn: daysFrom(ASOF, CREDENTIAL_EXPIRY_WARNING_DAYS) }).licence
      .standing).toBe('expiring');
    expect(standingWith({ expiresOn: daysFrom(ASOF, CREDENTIAL_EXPIRY_WARNING_DAYS + 1) }).licence
      .standing).toBe('live');
  });

  it('is still expiring — not lapsed — on the expiry date itself', () => {
    // A licence that expires today has not expired. Calling it lapsed would
    // report a refusal the gate is not making.
    const standing = standingWith({ expiresOn: ASOF });
    expect(standing.licence.standing).toBe('expiring');
    expect(standing.licence.daysRemaining).toBe(0);
  });

  it('is lapsed the day after the expiry date', () => {
    const standing = standingWith({ expiresOn: daysFrom(ASOF, -1) });
    expect(standing.licence.standing).toBe('lapsed');
    expect(standing.licence.daysRemaining).toBe(-1);
  });

  it('distinguishes "no expiry published" from "expires a long way off"', () => {
    // A register that publishes no expiry has told us nothing. Rendering that
    // as a healthy licence turns an absence of evidence into a reassurance.
    const standing = standingWith({ expiresOn: undefined });
    expect(standing.licence.standing).toBe('no_expiry_recorded');
    expect(standing.licence.expiresOn).toBeNull();
    expect(standing.licence.daysRemaining).toBeNull();
  });

  it('reports an unreadable expiry as a data defect rather than guessing at it', () => {
    // 2026-02-30 parses as text and is not a date. Neither "lapsed" nor "live"
    // is an honest answer, and both would be acted on.
    const standing = standingWith({ expiresOn: '2026-02-30' });
    expect(standing.licence.standing).toBe('unreadable_expiry');
    expect(standing.licence.expiresOn).toBe('2026-02-30');
    expect(standing.licence.daysRemaining).toBeNull();
    expect(standing.needsAttention).toBe(true);
  });

  it('handles a leap day as a real date', () => {
    const standing = standingWith({ expiresOn: '2028-02-29' });
    expect(standing.licence.standing).toBe('live');
    expect(standing.licence.daysRemaining).toBeGreaterThan(0);
  });
});

describe('verification bands', () => {
  const at = (ageDays: number) => standingWith({ verifiedOn: daysFrom(ASOF, -ageDays) }).verification;

  it('mirrors core’s citation freshness boundaries exactly', () => {
    // These are the same 90/180 the rest of the codebase uses for "how long may
    // a human-checked fact go unchecked". A second convention would be a second
    // number nobody can keep straight.
    expect(at(VERIFICATION_DUE_DAYS).standing).toBe('current');
    expect(at(VERIFICATION_DUE_DAYS + 1).standing).toBe('due');
    expect(at(VERIFICATION_OVERDUE_DAYS).standing).toBe('due');
    expect(at(VERIFICATION_OVERDUE_DAYS + 1).standing).toBe('overdue');
  });

  it('reports an unreadable verification date rather than treating it as current', () => {
    const verification = standingWith({ verifiedOn: '2026-13-01' }).verification;
    expect(verification.standing).toBe('unreadable');
    expect(verification.ageDays).toBeNull();
  });

  it('counts age from the verification date to the reference date', () => {
    expect(at(120).ageDays).toBe(120);
  });
});

describe('the roster’s verdict and the advice gate’s verdict', () => {
  /**
   * The property that matters. If these two ever disagree, the page reports a
   * standing the engine is not honouring — and the client stops receiving
   * recommendations with nobody told.
   */
  it('agrees with canRelease on the day of expiry and the day after', () => {
    const onExpiry = standingWith({ expiresOn: ASOF });
    expect(onExpiry.licence.standing).not.toBe('lapsed');
    expect(onExpiry.downgrading).toHaveLength(0);
    expect(onExpiry.gating[0]?.toApplicant.allowed).toBe(true);

    const afterExpiry = standingWith({ expiresOn: daysFrom(ASOF, -1) });
    expect(afterExpiry.licence.standing).toBe('lapsed');
    expect(afterExpiry.downgrading).toHaveLength(1);
    const decision = afterExpiry.gating[0]?.toApplicant;
    expect(decision?.allowed).toBe(false);
    if (decision?.allowed === false) {
      expect(decision.downgradeTo).toBe('assessment');
      expect(decision.reason).toContain('expired');
    }
  });

  it('asks the gate about the applicant, not the practitioner', () => {
    // Advice to a professional is released whatever the standing, so a roster
    // that tested the practitioner audience would report every credential as
    // fine — a page that always says "fine" is a page nobody reads.
    const rep = representative({ credential: { expiresOn: daysFrom(ASOF, -1) } });
    const asPractitioner = canRelease('advice', {
      audience: 'practitioner',
      jurisdiction: 'ES',
      representative: rep.credential,
      forConsideration: true,
      asOf: ASOF,
    });
    expect(asPractitioner.allowed).toBe(true);
    expect(standingWith({ expiresOn: daysFrom(ASOF, -1) }).downgrading).toHaveLength(1);
  });

  it('catches a live credential authorised in the wrong jurisdiction', () => {
    // The silent one: assigning a Canadian consultant to a Spanish file takes
    // one click, produces no error, and downgrades every output on that file.
    const standing = standingWith({
      jurisdiction: 'CA',
      credential: 'rcic',
      expiresOn: daysFrom(ASOF, 365),
    });
    expect(standing.licence.standing).toBe('live');
    expect(standing.downgrading).toHaveLength(1);
    expect(standing.needsAttention).toBe(true);
  });

  it('does not count a closed matter as being gated by a lapsed credential', () => {
    // A file that is already granted does not need a live credential behind it,
    // and counting it inflates the damage a lapse is doing.
    const rep = representative({ credential: { expiresOn: daysFrom(ASOF, -1) } });
    const records = firmRecords({
      representatives: [rep],
      matters: [
        matterRecord({
          matter: { id: 'm-open', representativeId: rep.credential.id, status: 'active' },
        }),
        matterRecord({
          reference: 'MAT-0002',
          matter: { id: 'm-granted', representativeId: rep.credential.id, status: 'granted' },
        }),
      ],
    });
    const [standing] = representativeStandings(records, ASOF);
    expect(standing?.gating).toHaveLength(2);
    expect(standing?.liveGating).toHaveLength(1);
    expect(standing?.downgrading.map((g) => g.matterId)).toEqual(['m-open']);
  });
});

describe('roster ordering', () => {
  it('puts a lapsed credential that is gating live work above every other problem', () => {
    const lapsedGating = representative({
      displayName: 'Zulema Lapsed',
      credential: { id: 'rep-lapsed', expiresOn: daysFrom(ASOF, -1) },
    });
    const expiring = representative({
      displayName: 'Ana Expiring',
      credential: { id: 'rep-expiring', expiresOn: daysFrom(ASOF, 10) },
    });
    const clean = representative({
      displayName: 'Berta Clean',
      credential: { id: 'rep-clean', expiresOn: daysFrom(ASOF, 400) },
    });
    const records = firmRecords({
      representatives: [clean, expiring, lapsedGating],
      matters: [matterRecord({ matter: { representativeId: 'rep-lapsed' } })],
    });

    expect(representativeStandings(records, ASOF).map((s) => s.record.credential.id)).toEqual([
      'rep-lapsed',
      'rep-expiring',
      'rep-clean',
    ]);
  });

  it('is a total order, so the page does not reshuffle between renders', () => {
    // Two rows with the same rank fall back to the display name. Without the
    // tiebreak the roster reorders itself on reload and a reader cannot say
    // whether a row moved because something changed.
    const a = representative({
      displayName: 'Aurora Same',
      credential: { id: 'rep-a', expiresOn: daysFrom(ASOF, 400) },
    });
    const b = representative({
      displayName: 'Zenaida Same',
      credential: { id: 'rep-b', expiresOn: daysFrom(ASOF, 400) },
    });
    const forwards = representativeStandings(firmRecords({ representatives: [a, b] }), ASOF);
    const backwards = representativeStandings(firmRecords({ representatives: [b, a] }), ASOF);
    expect(forwards.map((s) => s.record.credential.id)).toEqual(['rep-a', 'rep-b']);
    expect(backwards.map((s) => s.record.credential.id)).toEqual(
      forwards.map((s) => s.record.credential.id),
    );
  });
});

describe('matters with nobody accountable', () => {
  it('separates an unassigned file from one naming somebody off the roster', () => {
    // The fix is different for each: one needs an assignment, the other is a
    // dangling reference that *looks* covered on every list that shows a name.
    const records = firmRecords({
      representatives: [representative({ credential: { id: 'rep-known' } })],
      matters: [
        matterRecord({ reference: 'MAT-A', matter: { id: 'm-a', representativeId: null } }),
        matterRecord({ reference: 'MAT-B', matter: { id: 'm-b', representativeId: 'rep-ghost' } }),
        matterRecord({ reference: 'MAT-C', matter: { id: 'm-c', representativeId: 'rep-known' } }),
      ],
    });

    expect(unrepresentedLiveMatters(records).map((m) => m.matter.id)).toEqual(['m-a']);
    expect(danglingRepresentativeAssignments(records)).toEqual([
      { matter: expect.objectContaining({ reference: 'MAT-B' }), representativeId: 'rep-ghost' },
    ]);
  });

  it('does not report a closed unassigned matter as needing an owner', () => {
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { id: 'm-closed', representativeId: null, status: 'withdrawn' } }),
      ],
    });
    expect(unrepresentedLiveMatters(records)).toHaveLength(0);
  });

  it('reports a dangling assignment even on a closed matter', () => {
    // Terminal or not, the id names nobody. The trail will still show it.
    const records = firmRecords({
      matters: [
        matterRecord({ matter: { id: 'm-closed', representativeId: 'rep-ghost', status: 'granted' } }),
      ],
    });
    expect(danglingRepresentativeAssignments(records)).toHaveLength(1);
  });
});
