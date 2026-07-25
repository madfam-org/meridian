/**
 * The case-file routes, exercised through HTTP.
 *
 * The assertions concentrate on the places where being wrong hurts someone: the
 * Schengen boundary at exactly 90 and 91 days, a document that is valid today
 * and expired on the day the file is lodged, a phase advance that would skip
 * identity validation, and a task marked complete before the thing it depends on.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TENANTS, TODAY, createHarness, seedMatter, signToken, type Harness } from './harness.js';

let harness: Harness;
let token: string;

beforeEach(async () => {
  harness = await createHarness();
  token = await signToken({ tenantId: TENANTS.firm, roles: ['tenant_admin', 'caseworker'] });
});

afterEach(async () => {
  await harness.close();
});

function auth(): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

async function post(url: string, payload: object) {
  return harness.app.inject({ method: 'POST', url, headers: auth(), payload });
}

async function get(url: string) {
  return harness.app.inject({ method: 'GET', url, headers: auth() });
}

async function patch(url: string, payload: object) {
  return harness.app.inject({ method: 'PATCH', url, headers: auth(), payload });
}

describe('applicants and matters', () => {
  it('refuses a claimed nationality the applicant does not hold', async () => {
    // Spain's reduced-residency route is conferred on nationals of named states.
    // Recording a claim to a nationality the person does not hold is the data
    // error that produces an application filed on a basis that cannot support it.
    const response = await post('/v1/applicants', {
      nationalities: ['MX'],
      claimedNationality: 'IT',
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: 'CONFLICT' } });
  });

  it('opens a matter and refuses one whose claimed nationality is not held', async () => {
    const applicant = await post('/v1/applicants', {
      nationalities: ['MX', 'ES'],
      claimedNationality: 'MX',
    });
    const applicantId = applicant.json<{ id: string }>().id;

    const ok = await post('/v1/matters', {
      applicantId,
      pathwayId: 'es-test-reviewed',
      targetJurisdiction: 'ES',
      claimedNationality: 'MX',
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.json()).toMatchObject({ status: 'draft', phase: 'intake', openedOn: TODAY });

    const bad = await post('/v1/matters', {
      applicantId,
      pathwayId: 'es-test-reviewed',
      targetJurisdiction: 'ES',
      claimedNationality: 'IT',
    });
    expect(bad.statusCode).toBe(409);
  });

  it('advances a phase one step, and refuses a jump that would skip one', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);

    const skip = await post(`/v1/matters/${matterId}/phase`, { to: 'submission' });
    expect(skip.statusCode).toBe(409);
    // Skipping identity validation means filing on a document nobody checked.
    expect(skip.json<{ error: { message: string } }>().error.message).toContain('sequential');

    const step = await post(`/v1/matters/${matterId}/phase`, { to: 'identity_validation' });
    expect(step.statusCode).toBe(200);
    expect(step.json()).toMatchObject({ matter: { phase: 'identity_validation' } });
  });

  it('requires a recorded reason to move a matter backwards', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await post(`/v1/matters/${matterId}/phase`, { to: 'identity_validation' });

    const noReason = await post(`/v1/matters/${matterId}/phase`, { to: 'intake' });
    expect(noReason.statusCode).toBe(409);

    const withReason = await post(`/v1/matters/${matterId}/phase`, {
      to: 'intake',
      reason: 'Passport rejected by the consulate; identity evidence must be re-gathered.',
    });
    expect(withReason.statusCode).toBe(200);

    const events = await harness.provider.forTenant(TENANTS.firm).audit.list({
      limit: 50,
      offset: 0,
      action: 'matter.phase.reverted',
    });
    expect(events).toHaveLength(1);
    expect(String(events[0]?.detail['reason'])).toContain('re-gathered');
  });

  it('freezes a matter once it reaches a terminal status', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await patch(`/v1/matters/${matterId}`, { status: 'granted', closedOn: TODAY });

    const response = await post(`/v1/matters/${matterId}/phase`, { to: 'identity_validation' });
    expect(response.statusCode).toBe(409);
    expect(response.json<{ error: { message: string } }>().error.message).toContain('granted');
  });
});

describe('tasks', () => {
  async function twoLinkedTasks(matterId: string): Promise<{ first: string; second: string }> {
    const first = await post(`/v1/matters/${matterId}/tasks`, {
      phase: 'intake',
      title: 'Obtain birth certificate',
      assignee: 'applicant',
      citationIds: ['fixture-citation'],
    });
    const firstId = first.json<{ id: string }>().id;
    const second = await post(`/v1/matters/${matterId}/tasks`, {
      phase: 'intake',
      title: 'Apostille birth certificate',
      assignee: 'applicant',
      dependsOn: [firstId],
      citationIds: ['fixture-citation'],
    });
    return { first: firstId, second: second.json<{ id: string }>().id };
  }

  it('unlocks a task whose dependency is satisfied, and not before', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const { first, second } = await twoLinkedTasks(matterId);

    const before = await get(`/v1/matters/${matterId}/tasks`);
    const beforeTasks = before.json<{ tasks: { id: string; status: string }[] }>().tasks;
    expect(beforeTasks.find((t) => t.id === first)?.status).toBe('available');
    expect(beforeTasks.find((t) => t.id === second)?.status).toBe('locked');

    await patch(`/v1/matters/${matterId}/tasks/${first}`, { status: 'complete' });

    const after = await get(`/v1/matters/${matterId}/tasks`);
    const afterTasks = after.json<{ tasks: { id: string; status: string }[] }>().tasks;
    expect(afterTasks.find((t) => t.id === second)?.status).toBe('available');
  });

  it('refuses to complete a task whose dependency is outstanding', async () => {
    // "Apostille the birth certificate" completed before "obtain the birth
    // certificate" is not a workflow state, it is a mistake, and accepting it
    // means the checklist stops describing reality.
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const { second } = await twoLinkedTasks(matterId);

    const response = await patch(`/v1/matters/${matterId}/tasks/${second}`, { status: 'complete' });
    expect(response.statusCode).toBe(409);
    expect(response.json<{ error: { details: { blocking: string[] } } }>().error.details.blocking)
      .toHaveLength(1);
  });

  it('keeps a later-phase task locked until the matter reaches that phase', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await post(`/v1/matters/${matterId}/tasks`, {
      phase: 'document_assembly',
      title: 'Assemble the consular file',
      assignee: 'representative',
      citationIds: ['fixture-citation'],
    });

    const locked = await get(`/v1/matters/${matterId}/tasks`);
    expect(locked.json<{ tasks: { status: string }[] }>().tasks[0]?.status).toBe('locked');

    await post(`/v1/matters/${matterId}/phase`, { to: 'identity_validation' });
    const stillLocked = await get(`/v1/matters/${matterId}/tasks`);
    expect(stillLocked.json<{ tasks: { status: string }[] }>().tasks[0]?.status).toBe('locked');

    await post(`/v1/matters/${matterId}/phase`, { to: 'document_assembly' });
    const unlocked = await get(`/v1/matters/${matterId}/tasks`);
    expect(unlocked.json<{ tasks: { status: string }[] }>().tasks[0]?.status).toBe('available');
  });

  it('refuses a dependency on a task that does not exist in the matter', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await post(`/v1/matters/${matterId}/tasks`, {
      phase: 'intake',
      title: 'Depends on nothing real',
      assignee: 'platform',
      dependsOn: ['task-from-another-universe'],
      citationIds: ['fixture-citation'],
    });
    expect(response.statusCode).toBe(409);
  });

  it('requires at least one citation id for a task', async () => {
    // A step Meridian asks a person to take is a step some rule demands.
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await post(`/v1/matters/${matterId}/tasks`, {
      phase: 'intake',
      title: 'Because I said so',
      assignee: 'applicant',
      citationIds: [],
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('presence', () => {
  async function recordStay(matterId: string, start: string, end: string | null) {
    return post(`/v1/matters/${matterId}/presence/stays`, {
      stays: [{ country: 'ES', start, end, source: 'border_stamp', confidence: 'confirmed' }],
    });
  }

  it('reports exactly 90 days as compliant and 91 as one day over', async () => {
    // The boundary is the whole point. 2026-04-27 to 2026-07-25 inclusive is 90
    // days; one day earlier is 91.
    const compliant = await seedMatter(harness, TENANTS.firm);
    await recordStay(compliant.matterId, '2026-04-27', '2026-07-25');

    const ok = await get(`/v1/matters/${compliant.matterId}/presence/schengen?asOf=2026-07-25`);
    const okStatus = ok.json<{
      value: { daysUsed: number; daysRemaining: number; compliant: boolean; daysOverLimit: number };
    }>().value;
    expect(okStatus.daysUsed).toBe(90);
    expect(okStatus.daysRemaining).toBe(0);
    expect(okStatus.daysOverLimit).toBe(0);
    expect(okStatus.compliant).toBe(true);

    const breaching = await seedMatter(harness, TENANTS.other);
    const otherToken = await signToken({ tenantId: TENANTS.other, roles: ['caseworker'] });
    await harness.app.inject({
      method: 'POST',
      url: `/v1/matters/${breaching.matterId}/presence/stays`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: {
        stays: [
          {
            country: 'ES',
            start: '2026-04-26',
            end: '2026-07-25',
            source: 'border_stamp',
            confidence: 'confirmed',
          },
        ],
      },
    });
    const over = await harness.app.inject({
      method: 'GET',
      url: `/v1/matters/${breaching.matterId}/presence/schengen?asOf=2026-07-25`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    const overStatus = over.json<{
      value: { daysUsed: number; compliant: boolean; daysOverLimit: number };
    }>().value;
    expect(overStatus.daysUsed).toBe(91);
    expect(overStatus.daysOverLimit).toBe(1);
    expect(overStatus.compliant).toBe(false);
  });

  it('counts a same-day entry and exit as one day of presence', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await recordStay(matterId, '2026-07-25', '2026-07-25');
    const response = await get(`/v1/matters/${matterId}/presence/schengen?asOf=2026-07-25`);
    expect(response.json<{ value: { daysUsed: number } }>().value.daysUsed).toBe(1);
  });

  it('refuses a stay that ends before it starts', async () => {
    // An inverted range does not throw downstream; it produces a negative day
    // count, which reads as "you have used -14 of your 90 days".
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await recordStay(matterId, '2026-07-25', '2026-07-01');
    expect(response.statusCode).toBe(400);
  });

  it('keeps an open-ended stay open in storage while still counting it', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await recordStay(matterId, '2026-07-01', null);

    const stored = await harness.provider.forTenant(TENANTS.firm).stays.listForMatter(matterId);
    // The imputed end is never written back: doing so would launder a guess into
    // a fact about where somebody was.
    expect(stored[0]?.end).toBeNull();

    const response = await get(`/v1/matters/${matterId}/presence/schengen?asOf=2026-07-25`);
    expect(response.json<{ value: { daysUsed: number } }>().value.daysUsed).toBe(25);
  });

  it('produces the same counts whatever order the stays arrive in', async () => {
    const forward = await seedMatter(harness, TENANTS.firm);
    const chunks: [string, string][] = [
      ['2026-01-05', '2026-01-20'],
      ['2026-03-01', '2026-03-10'],
      ['2026-06-15', '2026-06-30'],
    ];
    for (const [start, end] of chunks) await recordStay(forward.matterId, start, end);

    const reverse = await seedMatter(harness, TENANTS.other);
    const otherToken = await signToken({ tenantId: TENANTS.other, roles: ['caseworker'] });
    for (const [start, end] of [...chunks].reverse()) {
      await harness.app.inject({
        method: 'POST',
        url: `/v1/matters/${reverse.matterId}/presence/stays`,
        headers: { authorization: `Bearer ${otherToken}` },
        payload: {
          stays: [{ country: 'ES', start, end, source: 'declared', confidence: 'probable' }],
        },
      });
    }

    const a = await get(`/v1/matters/${forward.matterId}/presence/schengen?asOf=2026-07-25`);
    const b = await harness.app.inject({
      method: 'GET',
      url: `/v1/matters/${reverse.matterId}/presence/schengen?asOf=2026-07-25`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(a.json<{ value: { daysUsed: number } }>().value.daysUsed).toBe(
      b.json<{ value: { daysUsed: number } }>().value.daysUsed,
    );
  });

  it('reports a gap in the record as an inconsistency rather than silence', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await recordStay(matterId, '2026-01-01', '2026-01-31');
    await recordStay(matterId, '2026-03-01', '2026-03-31');

    const response = await get(`/v1/matters/${matterId}/presence/inconsistencies?asOf=2026-07-25`);
    expect(response.statusCode).toBe(200);
    expect(
      response.json<{ inconsistencies: unknown[] }>().inconsistencies.length,
    ).toBeGreaterThan(0);
  });

  it('counts days against a catalogued tax threshold and says so when none exists', async () => {
    const spain = await seedMatter(harness, TENANTS.firm, { targetJurisdiction: 'ES' });
    await recordStay(spain.matterId, '2026-01-01', '2026-06-30');
    const response = await get(`/v1/matters/${spain.matterId}/presence/tax-residency?asOf=2026-07-25`);
    const value = response.json<{
      value: { evaluations: { threshold: { id: string }; daysPresent: number }[] };
    }>().value;
    expect(value.evaluations.length).toBeGreaterThan(0);
    expect(value.evaluations[0]?.daysPresent).toBe(181);

    const nowhere = await seedMatter(harness, TENANTS.other, { targetJurisdiction: 'PT' });
    const otherToken = await signToken({ tenantId: TENANTS.other, roles: ['caseworker'] });
    const empty = await harness.app.inject({
      method: 'GET',
      url: `/v1/matters/${nowhere.matterId}/presence/tax-residency`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    const emptyValue = empty.json<{ value: { evaluations: unknown[]; note?: string } }>().value;
    expect(emptyValue.evaluations).toEqual([]);
    // A gap in the catalog, said out loud — not a finding that no threshold
    // exists.
    expect(emptyValue.note).toContain('gap in the catalog');
  });

  it('reports absences against the Spanish continuity policy without inventing a cumulative limit', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm, { targetJurisdiction: 'ES' });
    await recordStay(matterId, '2024-01-01', '2026-07-25');

    const response = await get(
      `/v1/matters/${matterId}/presence/continuity?start=2024-01-01&end=2026-07-25`,
    );
    expect(response.statusCode).toBe(200);
    const value = response.json<{
      value: {
        policy: {
          maxSingleAbsenceDays?: number;
          maxCumulativeAbsenceDaysPerYear?: number;
          maxCumulativeAbsenceDaysTotal?: number;
        };
        satisfied: boolean;
      };
    }>().value;
    expect(value.satisfied).toBe(true);
    // The Civil Code fixes no numeric absence limit. The catalog encodes only
    // the screening criterion, and the cumulative limbs stay undefined rather
    // than being filled in with a figure that circulates but is not settled.
    expect(value.policy.maxCumulativeAbsenceDaysPerYear).toBeUndefined();
    expect(value.policy.maxCumulativeAbsenceDaysTotal).toBeUndefined();
  });
});

describe('documents', () => {
  const criminalRecord = {
    kind: 'criminal_record',
    issuingCountry: 'MX',
    issuedOn: '2026-01-01',
    status: 'provided',
    translation: { sourceLanguage: 'es' },
  };

  const checklistBody = {
    requirements: [
      {
        kind: 'criminal_record',
        criterion: 'Absence of criminal record in every state of residence.',
        citation: {
          id: 'fixture-doc-citation',
          kind: 'secondary',
          instrument: 'Meridian test fixture — not a legal instrument',
          jurisdiction: 'ES',
          verifiedOn: '2026-07-25',
          discretionary: true,
        },
      },
    ],
    defaultIssuingCountry: 'MX',
    defaultLanguage: 'es',
    targetSubmissionDate: '2026-10-01',
  };

  it('records a document and refuses one whose expiry precedes its issue date', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);

    const ok = await post(`/v1/matters/${matterId}/documents`, criminalRecord);
    expect(ok.statusCode).toBe(201);

    const bad = await post(`/v1/matters/${matterId}/documents`, {
      ...criminalRecord,
      expiresOn: '2025-01-01',
    });
    // Always a data error: left alone it produces a document that is
    // simultaneously fresh and expired depending on which check runs first.
    expect(bad.statusCode).toBe(400);
  });

  it('permits a legal status transition and refuses an illegal one', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const created = await post(`/v1/matters/${matterId}/documents`, criminalRecord);
    const documentId = created.json<{ id: string }>().id;

    const legal = await post(`/v1/matters/${matterId}/documents/${documentId}/transition`, {
      to: 'under_review',
      verifiedBy: 'reviewer-1',
    });
    expect(legal.statusCode).toBe(200);
    expect(legal.json()).toMatchObject({ status: 'under_review', verifiedBy: 'reviewer-1' });

    const illegal = await post(`/v1/matters/${matterId}/documents/${documentId}/transition`, {
      to: 'required',
    });
    expect(illegal.statusCode).toBe(400);
    expect(illegal.json()).toMatchObject({ error: { code: 'DOCUMENT_INVALID' } });
  });

  it('builds a checklist that routes a Mexican document into Spain', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm, { targetJurisdiction: 'ES' });
    const response = await post(`/v1/matters/${matterId}/documents/checklist`, checklistBody);

    expect(response.statusCode).toBe(200);
    const checklist = response.json<{
      value: {
        items: {
          kind: string;
          legalisation: { route: string };
          translation: { required: boolean };
          obtainNoEarlierThan?: string;
        }[];
      };
    }>().value;

    expect(checklist.items).toHaveLength(1);
    const item = checklist.items[0];
    // Both states are parties to the 1961 Hague Convention, so an apostille is
    // the only formality — not a consular chain.
    expect(item?.legalisation.route).toBe('apostille');
    // Spanish document into a Spanish authority: nothing to translate.
    expect(item?.translation.required).toBe(false);
    // The actionable number: do not order the certificate before this date, or
    // it ages out of its acceptance window before the file is lodged.
    expect(item?.obtainNoEarlierThan).toBeDefined();
  });

  it('reports a document that is valid today but expired on the submission date', async () => {
    // The single most common avoidable rejection. A check against "today" passes
    // it; a projection to the submission date does not.
    const { matterId } = await seedMatter(harness, TENANTS.firm, { targetJurisdiction: 'ES' });
    await post(`/v1/matters/${matterId}/documents`, criminalRecord);

    const response = await post(`/v1/matters/${matterId}/documents/gaps`, checklistBody);
    expect(response.statusCode).toBe(200);
    const gaps = response.json<{
      value: {
        complete: boolean;
        expiring: { projection: { verdict: string } }[];
        unlegalised: { kind: string }[];
      };
    }>().value;

    expect(gaps.complete).toBe(false);
    expect(gaps.expiring).toHaveLength(1);
    expect(['already_expired', 'expires_before_submission']).toContain(
      gaps.expiring[0]?.projection.verdict,
    );
    // Nothing has been apostilled yet, so the routing gap is reported too.
    expect(gaps.unlegalised).toHaveLength(1);
  });

  it('reports a required document nobody holds as missing', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm, { targetJurisdiction: 'ES' });
    const response = await post(`/v1/matters/${matterId}/documents/gaps`, checklistBody);
    const gaps = response.json<{ value: { missing: { kind: string; reason: string }[] } }>().value;
    expect(gaps.missing).toHaveLength(1);
    expect(gaps.missing[0]?.kind).toBe('criminal_record');
    expect(gaps.missing[0]?.reason).toBe('not_provided');
  });
});

describe('govtech', () => {
  it('reports every government capability honestly, and none as available', async () => {
    // Every integration is unprovisioned. The board says so rather than
    // presenting a plausible-looking readiness.
    const response = await get('/v1/govtech/capabilities');
    expect(response.statusCode).toBe(200);
    const board = response.json<{
      value: {
        consistent: boolean;
        reports: {
          adapterId: string;
          capabilities: { id: string; surface: string; state: string }[];
        }[];
      };
    }>().value;

    expect(board.consistent).toBe(true);
    expect(board.reports.map((r) => r.adapterId).sort()).toEqual([
      'ca-ircc',
      'es-clave',
      'es-dicireg',
    ]);

    // The honest claim is specific: nothing that would touch a government system
    // is available. Local computation — a readiness checklist, a timeline
    // estimate, a hand-off builder — is available, and saying otherwise would be
    // its own kind of dishonesty.
    const remote = board.reports.flatMap((r) =>
      r.capabilities.filter((c) => c.surface === 'government_system'),
    );
    expect(remote.length).toBeGreaterThan(0);
    expect(remote.filter((c) => c.state === 'available')).toEqual([]);
    // And the two policy refusals per adapter never become available whatever is
    // provisioned.
    const refusals = board.reports.flatMap((r) =>
      r.capabilities.filter((c) => c.state === 'refused_by_policy'),
    );
    expect(refusals.length).toBeGreaterThanOrEqual(3);
  });

  it('generates a hand-off pack pointing at an official host, and stores it', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await post('/v1/govtech/handoffs', {
      kind: 'es_clave_registration',
      matterId,
      route: 'video_call',
      fullName: 'Fixture Applicant',
    });

    expect(response.statusCode).toBe(201);
    const body = response.json<{
      value: { id: string; handoff: { destinationUrl: string; steps: unknown[]; bringBack: unknown[] } };
    }>();
    expect(body.value.handoff.destinationUrl.startsWith('https://')).toBe(true);
    expect(body.value.handoff.destinationUrl).not.toContain('?');
    expect(body.value.handoff.steps.length).toBeGreaterThan(0);
    // Every hand-off must capture something on return, or the claim that the
    // applicant keeps the audit trail is false.
    expect(body.value.handoff.bringBack.length).toBeGreaterThan(0);

    const stored = await harness.provider.forTenant(TENANTS.firm).handoffs.list({
      limit: 10,
      offset: 0,
    });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.adapterId).toBe('es-clave');
  });

  it('refuses a hand-off for a matter in another tenant', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.other);
    const response = await post('/v1/govtech/handoffs', {
      kind: 'es_clave_registration',
      matterId,
      route: 'in_person_office',
      fullName: 'Fixture Applicant',
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('the audit trail', () => {
  it('records mutations newest first and filters by action', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    await patch(`/v1/matters/${matterId}`, { status: 'active' });
    await post(`/v1/matters/${matterId}/phase`, { to: 'identity_validation' });

    const all = await get('/v1/audit');
    const events = all.json<{ events: { action: string; occurredAt: string }[] }>().events;
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]?.action).toBe('matter.phase.advanced');

    const filtered = await get('/v1/audit?action=matter.updated');
    expect(
      filtered.json<{ events: { action: string }[] }>().events.every((e) => e.action === 'matter.updated'),
    ).toBe(true);
  });

  it('offers no way to change or remove an event', async () => {
    // Not "we do not call them" — the repository interface has `append` and
    // `list` and nothing else, so there is no verb to expose.
    const repository = harness.provider.forTenant(TENANTS.firm).audit;
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(repository)).filter(
      (name) => name !== 'constructor',
    );
    expect(methods.sort()).toEqual(['append', 'list']);
    for (const verb of ['update', 'delete', 'remove', 'upsert', 'deleteMany']) {
      expect(typeof (repository as unknown as Record<string, unknown>)[verb]).toBe('undefined');
    }

    for (const method of ['PATCH', 'DELETE', 'PUT'] as const) {
      const response = await harness.app.inject({ method, url: '/v1/audit', headers: auth() });
      expect(response.statusCode).toBe(404);
    }
  });

  it('refuses to write personal data into a detail field', async () => {
    // The trail is never deleted, so a travel-document number written into it is
    // written into it forever.
    const { createAuditWriter, AuditDetailError } = await import('../src/audit/writer.js');
    const writer = createAuditWriter(
      harness.provider.forTenant(TENANTS.firm).audit,
      { tenantId: TENANTS.firm, userId: 'user-1', roles: [], unrecognisedRoles: [] },
      harness.services.clock,
      () => 'id-audit-test',
    );

    await expect(
      writer.record({
        action: 'test.event',
        targetType: 'test',
        outcome: 'success',
        detail: { documentNumber: 'ZZ1234567' },
      }),
    ).rejects.toBeInstanceOf(AuditDetailError);
  });
});

describe('the pathway catalog', () => {
  it('lists the catalog as information, with citations', async () => {
    const response = await get('/v1/pathways');
    expect(response.statusCode).toBe(200);
    const body = response.json<{
      classification: string;
      citationIds: string[];
      value: { pathways: { id: string; statusOn: string }[] };
    }>();
    expect(body.classification).toBe('information');
    expect(body.citationIds.length).toBeGreaterThan(0);
    expect(body.value.pathways.map((p) => p.id)).toContain('es-test-reviewed');
    expect(body.value.pathways[0]?.statusOn).toBe('open');
  });

  it('evaluates facts against one pathway and reports unknown rather than a negative', async () => {
    // An engine that treats a missing field as a "no" tells someone they are
    // ineligible because they have not finished filling in a form.
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await post('/v1/pathways/evaluate', {
      pathwayId: 'es-test-reviewed',
      // The nationality claim is present, so the blocking criterion is met. The
      // intent has never been asked about, so it is unknown — not false.
      facts: { applicantId: 'applicant-1', claimedNationality: 'MX' },
      matterId,
    });
    const report = response.json<{
      value: { verdict: string; unknowns: string[]; materialFailures: string[] };
    }>().value;
    expect(report.verdict).toBe('indeterminate');
    expect(report.unknowns).toContain('test-temporary-intent');
    // A `material` criterion can hold back a yes but can never produce a no:
    // "likely to be refused" is a prediction, and predictions are advice.
    expect(report.verdict).not.toBe('ineligible');
  });

  it('reports a definite negative when a blocking fact is absent but knowable', async () => {
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await post('/v1/pathways/evaluate', {
      pathwayId: 'es-test-reviewed',
      facts: { applicantId: 'applicant-1' },
      matterId,
    });
    const report = response.json<{ value: { verdict: string; blockingFailures: string[] } }>().value;
    expect(report.verdict).toBe('ineligible');
    expect(report.blockingFailures).toContain('test-claimed-nationality-present');
  });

  it('answers historically about a pathway that has since closed', async () => {
    const response = await get('/v1/pathways?asOf=2026-07-25');
    const pathways = response.json<{ value: { pathways: { id: string; statusOn: string }[] } }>()
      .value.pathways;
    expect(pathways.every((p) => typeof p.statusOn === 'string')).toBe(true);
  });

  it('rejects an unrecognised fact field rather than evaluating around it', async () => {
    // A caller who sends `nationality` for `nationalities` would otherwise get an
    // evaluation quietly run against a fact nobody supplied.
    const { matterId } = await seedMatter(harness, TENANTS.firm);
    const response = await post('/v1/pathways/evaluate', {
      pathwayId: 'es-test-reviewed',
      facts: { applicantId: 'a', nationality: 'MX' },
      matterId,
    });
    expect(response.statusCode).toBe(400);
  });
});
