import { describe, expect, it } from 'vitest';
import type { IsoDate } from '@meridian/core';
import { rangeLengthDays } from '@meridian/core';
import { adapterContext, noCredentials } from '../src/adapter.js';
import { IRCC_CAPABILITY, createIrccAdapter } from '../src/adapters/ircc.js';
import type { ProcessingTimelineInput } from '../src/adapters/ircc.js';
import { checkDestination } from '../src/handoff.js';

const ASOF = '2026-07-25' as IsoDate;
const ctx = adapterContext(ASOF, noCredentials);
const ircc = createIrccAdapter();

/** Entirely synthetic. No real employer, no real person, no real document number. */
const offer = () => ({
  employer: {
    legalName: 'Example Robotics Incorporated',
    businessNumber: '123456789RP0001',
    address: { line1: '1 Example Street', city: 'Toronto', provinceCode: 'ON', postalCode: 'M0M 0M0' },
    contactName: 'Example Contact',
    contactEmail: 'people@example.invalid',
  },
  foreignNational: {
    givenNames: 'Test',
    familyName: 'Testerson',
    dateOfBirth: '1990-06-15',
    citizenship: 'MX',
    travelDocumentNumber: 'X1234567',
  },
  position: {
    title: 'Software developer',
    nocCode: '21232',
    mainDuties: ['Write software', 'Review software'],
    workLocation: { line1: '1 Example Street', city: 'Toronto', provinceCode: 'ON', postalCode: 'M0M 0M0' },
    hoursPerWeek: 37.5,
    wage: { amount: 110000, currency: 'CAD', unit: 'year' as const },
    startOn: '2026-10-01',
    endOn: '2029-09-30',
  },
  exemption: { code: 'C12', rationale: 'Intra-company transferee, specialised knowledge.' },
});

const timeline = (over: Partial<ProcessingTimelineInput> = {}): ProcessingTimelineInput => ({
  stream: 'Work permit, LMIA-exempt, applied from outside Canada',
  asOf: ASOF,
  publishedProcessingDays: 56,
  publishedOn: ASOF,
  outstandingCompletenessDays: 14,
  biometrics: { required: true, instructionLetterDays: 2, appointmentLeadDays: 12, collectionToFileDays: 3 },
  postDecisionDays: 10,
  ...over,
});

describe('what IRCC will not do, and why it says so', () => {
  it('declares portal and status automation unimplemented, not merely missing', () => {
    const report = ircc.describeCapabilities(ctx);
    for (const id of [
      IRCC_CAPABILITY.employerPortalSubmission,
      IRCC_CAPABILITY.applicantSubmission,
      IRCC_CAPABILITY.statusPolling,
    ]) {
      const capability = report.capabilities.find((c) => c.id === id);
      expect(capability?.state).toBe('not_implemented');
      expect(capability?.reason).toMatch(/no open application programming interface/i);
      expect(capability?.reason).toMatch(/terms-of-service question/);
      expect(capability?.reason).toMatch(/fails silently/);
      expect(capability?.alternative).not.toBeNull();
    }
  });

  it('keeps unimplemented distinct from unprovisioned', () => {
    // Different problems with different owners. Collapsing them wastes the time
    // of whoever is trying to fix it.
    const states = ircc.describeCapabilities(ctx).capabilities.map((c) => c.state);
    expect(states).toContain('not_implemented');
    expect(states).not.toContain('not_provisioned');
  });

  it('refuses account credential custody permanently', () => {
    const capability = ircc
      .describeCapabilities(ctx)
      .capabilities.find((c) => c.id === IRCC_CAPABILITY.credentialCustody);
    expect(capability?.state).toBe('refused_by_policy');
    expect(capability?.policy).toBe('no_credential_custody');
    expect(capability?.unblockPath).toEqual([]);
  });
});

describe('offer of employment validation', () => {
  it('accepts a well-formed package but still demands human verification', () => {
    const result = ircc.validateOfferOfEmployment(offer(), ASOF);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.classification).toBe('assessment');
    expect(result.value.value.ready).toBe(true);
    // Wage adequacy and exemption-code selection are not encoded, and the
    // validator says so rather than letting silence read as approval.
    expect(result.value.value.humanVerificationRequired).toBe(true);
    const paths = result.value.value.findings
      .filter((f) => f.severity === 'needs_human_verification')
      .map((f) => f.path);
    expect(paths).toContain('position.wage');
    expect(paths).toContain('exemption.code');
  });

  it('never predicts an outcome — `ready` is about shape only', () => {
    const result = ircc.validateOfferOfEmployment(offer(), ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.classification).not.toBe('advice');
  });

  it('counts the offer duration inclusively', () => {
    const single = offer();
    single.position.startOn = '2027-01-01';
    single.position.endOn = '2027-01-01';
    const result = ircc.validateOfferOfEmployment(single, ASOF);
    if (!result.ok) throw result.error;
    // One day of employment, not zero.
    expect(result.value.value.offerDurationDays).toBe(1);
  });

  it('counts a leap day when the offer spans one', () => {
    const leap = offer();
    leap.position.startOn = '2028-02-28';
    leap.position.endOn = '2028-03-01';
    const result = ircc.validateOfferOfEmployment(leap, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.offerDurationDays).toBe(3);
  });

  it('rejects an end date before the start date, and reports no duration', () => {
    const backwards = offer();
    backwards.position.startOn = '2027-06-01';
    backwards.position.endOn = '2027-05-31';
    const result = ircc.validateOfferOfEmployment(backwards, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.ready).toBe(false);
    expect(result.value.value.offerDurationDays).toBeNull();
  });

  it.each([
    ['2123', 'four digits'],
    ['212321', 'six digits'],
    ['2A232', 'a letter'],
  ])('rejects the NOC code %s (%s)', (nocCode) => {
    const bad = offer();
    bad.position.nocCode = nocCode;
    const result = ircc.validateOfferOfEmployment(bad, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.findings.some((f) => f.severity === 'error' && f.path === 'position.nocCode')).toBe(
      true,
    );
  });

  it('rejects a NOC code whose TEER digit is out of range', () => {
    const bad = offer();
    bad.position.nocCode = '29232';
    const result = ircc.validateOfferOfEmployment(bad, ASOF);
    if (!result.ok) throw result.error;
    const teer = result.value.value.findings.find(
      (f) => f.path === 'position.nocCode' && f.message.includes('TEER'),
    );
    expect(teer?.severity).toBe('error');
  });

  it('accepts both the bare and the program-account forms of a business number', () => {
    for (const businessNumber of ['123456789', '123456789RP0001', '123 456 789']) {
      const candidate = offer();
      candidate.employer.businessNumber = businessNumber;
      const result = ircc.validateOfferOfEmployment(candidate, ASOF);
      if (!result.ok) throw result.error;
      expect(
        result.value.value.findings.some((f) => f.severity === 'error' && f.path === 'employer.businessNumber'),
      ).toBe(false);
    }
  });

  it('rejects a malformed business number', () => {
    const bad = offer();
    bad.employer.businessNumber = '12345';
    const result = ircc.validateOfferOfEmployment(bad, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.ready).toBe(false);
  });

  it('rejects a province code that is not Canadian', () => {
    const bad = offer();
    bad.position.workLocation.provinceCode = 'XX';
    const result = ircc.validateOfferOfEmployment(bad, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.ready).toBe(false);
  });

  it('flags a Quebec work location for the separate provincial question', () => {
    const quebec = offer();
    quebec.position.workLocation.provinceCode = 'QC';
    const result = ircc.validateOfferOfEmployment(quebec, ASOF);
    if (!result.ok) throw result.error;
    const finding = result.value.value.findings.find(
      (f) => f.path === 'position.workLocation.provinceCode' && f.severity === 'needs_human_verification',
    );
    expect(finding?.message).toMatch(/provincial process/);
  });

  it('flags part-time hours for the stream question rather than deciding it', () => {
    const partTime = offer();
    partTime.position.hoursPerWeek = 20;
    const result = ircc.validateOfferOfEmployment(partTime, ASOF);
    if (!result.ok) throw result.error;
    const finding = result.value.value.findings.find(
      (f) => f.path === 'position.hoursPerWeek' && f.severity === 'needs_human_verification',
    );
    expect(finding).toBeDefined();
    expect(result.value.value.ready).toBe(true);
  });

  it.each([0, -5, 200])('rejects impossible weekly hours: %s', (hoursPerWeek) => {
    const bad = offer();
    bad.position.hoursPerWeek = hoursPerWeek;
    const result = ircc.validateOfferOfEmployment(bad, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.ready).toBe(false);
  });

  it('warns about a non-Canadian currency without blocking the package', () => {
    const usd = offer();
    usd.position.wage.currency = 'USD';
    const result = ircc.validateOfferOfEmployment(usd, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.findings.some((f) => f.path === 'position.wage.currency')).toBe(true);
    expect(result.value.value.ready).toBe(true);
  });

  it('rejects a date of birth in the future and warns about a start date in the past', () => {
    const future = offer();
    future.foreignNational.dateOfBirth = '2030-01-01';
    const futureResult = ircc.validateOfferOfEmployment(future, ASOF);
    if (!futureResult.ok) throw futureResult.error;
    expect(futureResult.value.value.ready).toBe(false);

    const stale = offer();
    stale.position.startOn = '2020-01-01';
    stale.position.endOn = '2021-01-01';
    const staleResult = ircc.validateOfferOfEmployment(stale, ASOF);
    if (!staleResult.ok) throw staleResult.error;
    expect(
      staleResult.value.value.findings.some((f) => f.path === 'position.startOn' && f.severity === 'warning'),
    ).toBe(true);
  });

  it('reports every shape problem at once rather than stopping at the first', () => {
    const result = ircc.validateOfferOfEmployment({ employer: {} }, ASOF);
    if (!result.ok) throw result.error;
    expect(result.value.value.ready).toBe(false);
    expect(result.value.value.findings.length).toBeGreaterThan(3);
    expect(result.value.value.findings.every((f) => f.severity === 'error')).toBe(true);
  });

  it('refuses a package carrying a credential', () => {
    const withCredential = { ...offer(), portalPassword: 'hunter2' };
    const result = ircc.validateOfferOfEmployment(withCredential, ASOF);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CREDENTIAL_CUSTODY_REFUSED');
  });

  it('rejects input that is not an object, and an impossible as-of date', () => {
    expect(ircc.validateOfferOfEmployment('a string', ASOF).ok).toBe(false);
    expect(ircc.validateOfferOfEmployment(null, ASOF).ok).toBe(false);
    expect(ircc.validateOfferOfEmployment(offer(), '2026-02-30' as IsoDate).ok).toBe(false);
  });
});

describe('processing timeline decomposition', () => {
  it('always reports all four components, and the total is their sum', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    const estimate = result.value.value;

    expect(estimate.components.map((c) => c.id)).toEqual([
      'application_completeness',
      'biometrics',
      'published_processing',
      'post_decision',
    ]);
    const sum = estimate.components.reduce((acc, c) => acc + c.days, 0);
    expect(estimate.totalDays).toBe(sum);
    expect(estimate.totalDays).toBe(14 + 17 + 56 + 10);
  });

  it('does not quote the headline figure as the answer', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    expect(result.value.value.totalDays).toBeGreaterThan(56);
    const published = result.value.value.components.find((c) => c.id === 'published_processing');
    expect(published?.days).toBe(56);
    expect(published?.explanation).toMatch(/after a complete application is received/);
  });

  it('attributes each clock to whoever is actually holding it up', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    const owners = Object.fromEntries(result.value.value.components.map((c) => [c.id, c.clockOwner]));
    expect(owners['application_completeness']).toBe('applicant');
    expect(owners['published_processing']).toBe('authority');
  });

  it('places milestones cumulatively, in order', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    const on = Object.fromEntries(result.value.value.milestones.map((m) => [m.id, m.on]));
    expect(on['application_complete']).toBe('2026-08-08'); // +14
    expect(on['biometrics_complete']).toBe('2026-08-25'); // +17
    expect(on['decision']).toBe('2026-10-20'); // +56
    expect(on['ready_to_start']).toBe('2026-10-30'); // +10
  });

  it('keeps elapsed days and calendar days apart', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    const estimate = result.value.value;
    // The range is closed at both ends, so it covers one more calendar day than
    // the elapsed duration. Conflating the two is the classic off-by-one.
    expect(rangeLengthDays(estimate.elapsedRange)).toBe(estimate.totalDays + 1);
    expect(estimate.elapsedRange.start).toBe(ASOF);
  });

  it('occupies today even when nothing is outstanding', () => {
    const result = ircc.estimateProcessingTimeline(
      timeline({
        publishedProcessingDays: 0,
        outstandingCompletenessDays: 0,
        postDecisionDays: 0,
        biometrics: { required: false, reason: 'already on file' },
      }),
    );
    if (!result.ok) throw result.error;
    expect(result.value.value.totalDays).toBe(0);
    expect(rangeLengthDays(result.value.value.elapsedRange)).toBe(1);
  });

  it('crosses a leap day correctly', () => {
    const result = ircc.estimateProcessingTimeline(
      timeline({
        asOf: '2028-02-28' as IsoDate,
        publishedOn: '2028-02-28' as IsoDate,
        outstandingCompletenessDays: 1,
        biometrics: { required: false, reason: 'already on file' },
        publishedProcessingDays: 0,
        postDecisionDays: 0,
      }),
    );
    if (!result.ok) throw result.error;
    const complete = result.value.value.milestones.find((m) => m.id === 'application_complete');
    expect(complete?.on).toBe('2028-02-29');
  });

  it('keeps a zero-day biometrics component visible rather than dropping it', () => {
    const result = ircc.estimateProcessingTimeline(
      timeline({ biometrics: { required: false, reason: 'valid biometrics already on file' } }),
    );
    if (!result.ok) throw result.error;
    const biometrics = result.value.value.components.find((c) => c.id === 'biometrics');
    expect(biometrics?.days).toBe(0);
    expect(biometrics?.explanation).toMatch(/valid biometrics already on file/);
    expect(result.value.value.totalDays).toBe(14 + 0 + 56 + 10);
  });

  it('measures a target start date against the estimate without recommending anything', () => {
    const result = ircc.estimateProcessingTimeline(timeline({ targetStartOn: '2026-12-01' as IsoDate }));
    if (!result.ok) throw result.error;
    const target = result.value.value.targetStart;
    expect(target?.met).toBe(true);
    expect(target?.earliestReadyOn).toBe('2026-10-30');
    expect(target?.slackDays).toBe(32);
    expect(result.value.classification).toBe('assessment');
  });

  it('reports a target that cannot be met as negative slack', () => {
    const result = ircc.estimateProcessingTimeline(timeline({ targetStartOn: '2026-09-01' as IsoDate }));
    if (!result.ok) throw result.error;
    expect(result.value.value.targetStart?.met).toBe(false);
    expect(result.value.value.targetStart?.slackDays).toBeLessThan(0);
  });

  it('treats a target exactly on the ready date as met', () => {
    const result = ircc.estimateProcessingTimeline(timeline({ targetStartOn: '2026-10-30' as IsoDate }));
    if (!result.ok) throw result.error;
    expect(result.value.value.targetStart?.slackDays).toBe(0);
    expect(result.value.value.targetStart?.met).toBe(true);
  });

  it('omits the target assessment when there is no target', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    expect(result.value.value.targetStart).toBeNull();
  });

  it('escalates its caveat as the published figure ages', () => {
    const fresh = ircc.estimateProcessingTimeline(timeline({ publishedOn: '2026-07-20' as IsoDate }));
    if (!fresh.ok) throw fresh.error;
    expect(fresh.value.value.publishedFigureAgeDays).toBe(5);
    expect(fresh.value.value.caveats.join(' ')).not.toMatch(/Re-read it/);

    const aging = ircc.estimateProcessingTimeline(timeline({ publishedOn: '2026-07-10' as IsoDate }));
    if (!aging.ok) throw aging.error;
    expect(aging.value.value.caveats.join(' ')).toMatch(/may already have moved/);

    const stale = ircc.estimateProcessingTimeline(timeline({ publishedOn: '2026-05-01' as IsoDate }));
    if (!stale.ok) throw stale.error;
    expect(stale.value.value.caveats.join(' ')).toMatch(/Re-read it before relying/);
  });

  it('warns when the estimate assumes a complete application today', () => {
    const result = ircc.estimateProcessingTimeline(timeline({ outstandingCompletenessDays: 0 }));
    if (!result.ok) throw result.error;
    expect(result.value.value.caveats.join(' ')).toMatch(/published clock has not started/);
  });

  it('says out loud that it is not a prediction', () => {
    const result = ircc.estimateProcessingTimeline(timeline());
    if (!result.ok) throw result.error;
    expect(result.value.value.caveats.join(' ')).toMatch(/not a prediction of the outcome/);
  });

  it('rejects a figure supposedly read in the future', () => {
    const result = ircc.estimateProcessingTimeline(timeline({ publishedOn: '2026-08-01' as IsoDate }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/cannot have been read in the future/);
  });

  it.each([
    ['publishedProcessingDays', { publishedProcessingDays: -1 }],
    ['outstandingCompletenessDays', { outstandingCompletenessDays: 1.5 }],
    ['postDecisionDays', { postDecisionDays: -10 }],
  ])('rejects a nonsensical %s', (_label, over) => {
    expect(ircc.estimateProcessingTimeline(timeline(over)).ok).toBe(false);
  });

  it('rejects nonsensical biometrics day counts', () => {
    const result = ircc.estimateProcessingTimeline(
      timeline({
        biometrics: { required: true, instructionLetterDays: -1, appointmentLeadDays: 5, collectionToFileDays: 1 },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it('rejects impossible dates', () => {
    expect(ircc.estimateProcessingTimeline(timeline({ asOf: '2026-02-30' as IsoDate })).ok).toBe(false);
    expect(ircc.estimateProcessingTimeline(timeline({ publishedOn: '2026-13-01' as IsoDate })).ok).toBe(false);
    expect(ircc.estimateProcessingTimeline(timeline({ targetStartOn: '2027-04-31' as IsoDate })).ok).toBe(false);
  });
});

describe('employer portal handoff', () => {
  const input = {
    matterId: 'm-1',
    employerLegalName: 'Example Robotics Incorporated',
    employerBusinessNumber: '123456789RP0001',
    positionTitle: 'Software developer',
    nocCode: '21232',
    startOn: '2026-10-01' as IsoDate,
    endOn: '2029-09-30' as IsoDate,
    generatedOn: ASOF,
  };

  it('builds a complete, ordered package pointing at the official site', () => {
    const result = ircc.buildEmployerPortalHandoff(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.steps.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5]);
    expect(result.value.steps.every((s) => s.actor === 'employer')).toBe(true);
    expect(checkDestination('CA', result.value.destinationUrl).valid).toBe(true);
  });

  it('computes the offer duration inclusively and marks it as computed', () => {
    const result = ircc.buildEmployerPortalHandoff(input);
    if (!result.ok) throw result.error;
    const duration = result.value.fields.find((f) => f.id === 'offer-duration-days');
    expect(duration?.source).toBe('computed');
    // Three years, inclusive of both endpoints, spanning the 2028 leap day:
    // 365 + 366 + 365 = 1096. Independently confirmed against a calendar.
    expect(duration?.value).toBe('1096');
    expect(result.value.classification).toBe('assessment');
  });

  it('stays information-only when there is no computed value', () => {
    const { endOn: _endOn, ...openEnded } = input;
    const result = ircc.buildEmployerPortalHandoff(openEnded);
    if (!result.ok) throw result.error;
    expect(result.value.fields.find((f) => f.id === 'offer-duration-days')).toBeUndefined();
    expect(result.value.classification).toBe('information');
  });

  it('tells the employer the sign-in credential stays theirs', () => {
    const result = ircc.buildEmployerPortalHandoff(input);
    if (!result.ok) throw result.error;
    expect(result.value.caveats.join(' ')).toMatch(/never asks for, stores or transmits the sign-in credential/);
  });

  it('does not assess whether the exemption relied on is correct', () => {
    const result = ircc.buildEmployerPortalHandoff(input);
    if (!result.ok) throw result.error;
    expect(result.value.caveats.join(' ')).toMatch(/judgement for an authorised representative/);
  });

  it('rejects reversed and impossible dates', () => {
    expect(ircc.buildEmployerPortalHandoff({ ...input, endOn: '2026-09-30' as IsoDate }).ok).toBe(false);
    expect(ircc.buildEmployerPortalHandoff({ ...input, startOn: '2026-02-30' as IsoDate }).ok).toBe(false);
    expect(ircc.buildEmployerPortalHandoff({ ...input, employerLegalName: '  ' }).ok).toBe(false);
  });
});
