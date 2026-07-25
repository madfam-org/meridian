import { describe, expect, it } from 'vitest';
import {
  canRelease,
  disclosable,
  maxDisclosure,
  maxDisclosureOf,
  type AuthorizedRepresentative,
  type ReleaseContext,
} from '../src/disclosure.js';
import { audienceFor, representativeFor, type Tenant } from '../src/tenancy.js';
import { isoDate } from '../src/civil-date.js';
import {
  countryCode,
  isSchengenOn,
  qualifiesForSpainReducedResidency,
  schengenAccessionAmbiguity,
  spainReducedResidencyEligibility,
} from '../src/jurisdiction.js';

const rcic: AuthorizedRepresentative = {
  id: 'rep-1',
  jurisdiction: 'CA',
  credential: 'rcic',
  licenceNumber: 'R000000',
  verifiedOn: '2026-07-01',
};

const ctx = (over: Partial<ReleaseContext> = {}): ReleaseContext => ({
  audience: 'applicant',
  jurisdiction: 'CA',
  representative: null,
  forConsideration: true,
  asOf: '2026-07-25',
  ...over,
});

describe('disclosure ordering', () => {
  it('ranks advice above assessment above information', () => {
    expect(maxDisclosure('information', 'assessment')).toBe('assessment');
    expect(maxDisclosure('assessment', 'advice')).toBe('advice');
    expect(maxDisclosureOf(['information', 'advice', 'assessment'])).toBe('advice');
  });

  it('defaults to information for an empty set', () => {
    expect(maxDisclosureOf([])).toBe('information');
  });
});

describe('canRelease', () => {
  it('always releases information and assessment, representative or not', () => {
    expect(canRelease('information', ctx()).allowed).toBe(true);
    expect(canRelease('assessment', ctx()).allowed).toBe(true);
    expect(canRelease('assessment', ctx({ forConsideration: false })).allowed).toBe(true);
  });

  it('blocks advice to an applicant with no representative and downgrades to assessment', () => {
    const decision = canRelease('advice', ctx());
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.downgradeTo).toBe('assessment');
      expect(decision.reason).toMatch(/authorized representative/i);
    }
  });

  it('blocks advice to a corporate sponsor with no representative', () => {
    expect(canRelease('advice', ctx({ audience: 'corporate_sponsor' })).allowed).toBe(false);
  });

  it('does not treat a free product as a loophole', () => {
    expect(canRelease('advice', ctx({ forConsideration: false })).allowed).toBe(false);
  });

  it('releases advice to a practitioner — they own the judgement', () => {
    expect(canRelease('advice', ctx({ audience: 'practitioner' })).allowed).toBe(true);
  });

  it('releases advice to an applicant once a live representative is attached', () => {
    expect(canRelease('advice', ctx({ representative: rcic })).allowed).toBe(true);
  });

  it('rejects a representative licensed in the wrong jurisdiction', () => {
    const decision = canRelease('advice', ctx({ jurisdiction: 'ES', representative: rcic }));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toMatch(/authorized in CA, not ES/);
  });

  it('rejects an expired credential', () => {
    const expired = { ...rcic, expiresOn: '2026-01-01' };
    const decision = canRelease('advice', ctx({ representative: expired }));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toMatch(/expired/);
  });

  it('accepts a credential expiring today', () => {
    const today = { ...rcic, expiresOn: '2026-07-25' };
    expect(canRelease('advice', ctx({ representative: today })).allowed).toBe(true);
  });

  it('is case-insensitive on jurisdiction codes', () => {
    const lower = { ...rcic, jurisdiction: 'ca' };
    expect(canRelease('advice', ctx({ representative: lower })).allowed).toBe(true);
  });
});

describe('tenancy', () => {
  const firm: Tenant = {
    id: 't-firm',
    kind: 'firm',
    displayName: 'Example Immigration Law',
    homeJurisdiction: 'CA',
    representatives: [rcic],
  };

  const aspiring: Tenant = {
    id: 't-madfam',
    kind: 'madfam_represented',
    displayName: 'MADFAM',
    homeJurisdiction: 'MX',
    representatives: [],
  };

  it('maps tenant kinds to audiences', () => {
    expect(audienceFor('firm')).toBe('practitioner');
    expect(audienceFor('individual')).toBe('applicant');
    expect(audienceFor('corporate')).toBe('corporate_sponsor');
    expect(audienceFor('madfam_represented')).toBe('applicant');
  });

  it('finds a live representative for the jurisdiction', () => {
    expect(representativeFor(firm, 'CA', '2026-07-25')).toEqual(rcic);
    expect(representativeFor(firm, 'ES', '2026-07-25')).toBeNull();
  });

  it('ignores an expired representative', () => {
    const lapsed: Tenant = { ...firm, representatives: [{ ...rcic, expiresOn: '2026-01-01' }] };
    expect(representativeFor(lapsed, 'CA', '2026-07-25')).toBeNull();
  });

  it('gives a madfam_represented tenant with no licence no more power than an individual', () => {
    expect(representativeFor(aspiring, 'CA', '2026-07-25')).toBeNull();
    const decision = canRelease(
      'advice',
      ctx({
        audience: audienceFor(aspiring.kind),
        representative: representativeFor(aspiring, 'CA', '2026-07-25'),
      }),
    );
    expect(decision.allowed).toBe(false);
  });
});

describe('nationality of origin — art. 22.1 Código Civil', () => {
  it('qualifies a listed nationality held by origin', () => {
    expect(spainReducedResidencyEligibility(countryCode('MX'), 'by_origin')).toBe('qualifies');
    expect(spainReducedResidencyEligibility(countryCode('PT'), 'by_origin')).toBe('qualifies');
  });

  it('refuses a listed nationality acquired by residence or naturalisation', () => {
    // Born in Haiti, Dominican nationality by residence: ten-year regime.
    expect(spainReducedResidencyEligibility(countryCode('DO'), 'by_residence')).toBe(
      'does_not_qualify',
    );
    expect(spainReducedResidencyEligibility(countryCode('MX'), 'by_naturalization')).toBe(
      'does_not_qualify',
    );
  });

  it('is indeterminate when the acquisition mode is unrecorded', () => {
    expect(spainReducedResidencyEligibility(countryCode('MX'), 'unknown')).toBe('indeterminate');
  });

  it('refuses an unlisted nationality regardless of how it was acquired', () => {
    expect(spainReducedResidencyEligibility(countryCode('IT'), 'by_origin')).toBe(
      'does_not_qualify',
    );
    expect(spainReducedResidencyEligibility(countryCode('IT'), 'unknown')).toBe('does_not_qualify');
  });

  it('keeps list membership available on its own for rendering', () => {
    expect(qualifiesForSpainReducedResidency(countryCode('MX'))).toBe(true);
    expect(qualifiesForSpainReducedResidency(countryCode('IT'))).toBe(false);
  });
});

describe('Schengen staged accession', () => {
  it('treats Bulgaria and Romania as full members only from 2025-01-01', () => {
    expect(isSchengenOn(countryCode('RO'), isoDate('2024-12-31'))).toBe(false);
    expect(isSchengenOn(countryCode('RO'), isoDate('2025-01-01'))).toBe(true);
    expect(isSchengenOn(countryCode('BG'), isoDate('2024-06-15'))).toBe(false);
  });

  it('flags the window between partial effects and full accession as ambiguous', () => {
    expect(schengenAccessionAmbiguity(countryCode('BG'), isoDate('2024-03-30'))).toBe(false);
    expect(schengenAccessionAmbiguity(countryCode('BG'), isoDate('2024-03-31'))).toBe(true);
    expect(schengenAccessionAmbiguity(countryCode('BG'), isoDate('2024-12-31'))).toBe(true);
    expect(schengenAccessionAmbiguity(countryCode('BG'), isoDate('2025-01-01'))).toBe(false);
  });

  it('reports no ambiguity for a single-step accession or a non-member', () => {
    expect(schengenAccessionAmbiguity(countryCode('HR'), isoDate('2022-06-01'))).toBe(false);
    expect(schengenAccessionAmbiguity(countryCode('GB'), isoDate('2024-06-01'))).toBe(false);
  });

  it('still excludes Croatia before its accession', () => {
    expect(isSchengenOn(countryCode('HR'), isoDate('2022-12-31'))).toBe(false);
    expect(isSchengenOn(countryCode('HR'), isoDate('2023-01-01'))).toBe(true);
  });
});

describe('disclosable', () => {
  it('carries its classification and citations', () => {
    const out = disclosable('assessment', { days: 610 }, ['es-cc-art-22']);
    expect(out.classification).toBe('assessment');
    expect(out.citationIds).toEqual(['es-cc-art-22']);
    expect(out.value).toEqual({ days: 610 });
  });
});
