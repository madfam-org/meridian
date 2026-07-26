/**
 * Document routing for one matter.
 *
 * Every legal answer here comes from `@meridian/documents`; what this module
 * decides is which question to ask and how to count the answers. Two of those
 * decisions are load-bearing:
 *
 *  - freshness is projected against the **submission** date, so a certificate
 *    that is fine today and out of its window on filing day fails here rather
 *    than at the counter;
 *  - "unknown" is counted apart from both "fine" and "a problem", because
 *    rendering unchecked as acceptable is how a console starts lying by
 *    omission.
 */

import { countryCode, isoDate } from '@meridian/core';
import { describe, expect, it } from 'vitest';
import { documentRouting, documentTotals } from '@/lib/matter-documents';
import { ASOF, CASTILIAN_TAG, daysFrom, document, matterRecord } from './fixtures';

describe('documentRouting', () => {
  it('routes a document the firm does not hold yet', () => {
    // A practitioner needs to know what a replacement costs in time *before*
    // ordering it, so a `required` document is still routed — it is just not
    // present.
    const record = matterRecord({
      documents: [document({ id: 'doc-missing', status: 'required' })],
    });
    const [routing] = documentRouting(record, ASOF);
    expect(routing?.present).toBe(false);
    expect(routing?.legalisation).toBeDefined();
    expect(routing?.translation).toBeDefined();
  });

  it('asks about the submission date rather than about today', () => {
    const doc = document({ id: 'doc-record', issuedOn: isoDate('2026-07-01') });
    const record = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [doc],
      targetSubmissionDate: daysFrom(ASOF, 300),
    });
    const [routing] = documentRouting(record, ASOF);
    expect(routing?.freshness.submissionDate).toBe(daysFrom(ASOF, 300));
    expect(routing?.freshness.asOf).toBe(ASOF);
  });

  it('falls back to the reference date when the filing date is unknown', () => {
    // An unknown filing date makes the answer weaker, not absent.
    const record = matterRecord({ documents: [document()] });
    expect(documentRouting(record, ASOF)[0]?.freshness.submissionDate).toBe(ASOF);
  });

  it('carries the receiving region through, because it changes the answer', () => {
    // Spain's co-official regime is the live case: an organ in Catalonia
    // accepts languages the general answer for Spain does not name. Dropping
    // the region would tell an applicant to pay for a translation they do not
    // need — or, worse, to skip one they do.
    const doc = document({ id: 'doc-lang', issuingCountry: countryCode('MX') });
    const withRegion = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [doc],
      receivingRegion: 'ES-CT',
    });
    const withoutRegion = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [doc],
    });
    expect(documentRouting(withoutRegion, ASOF)[0]?.translation.acceptedLanguages).toEqual(['es']);
    expect(documentRouting(withRegion, ASOF)[0]?.translation.acceptedLanguages).toEqual([
      'es',
      'ca',
      'oc',
    ]);
  });

  it('reports a route nobody has confirmed as unsatisfied, whatever was done', () => {
    // `legalisationSatisfied` returns false for an `unknown` route even when a
    // route has been completed on the file. A route nobody has confirmed is not
    // a route, and marking it done would send an applicant to a ministry that
    // will not stamp their document.
    const record = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [
        document({
          id: 'doc-unknown-route',
          issuingCountry: countryCode('CN'),
          legalisation: { route: 'apostille', completedOn: isoDate('2026-05-01') },
        }),
      ],
    });
    const [routing] = documentRouting(record, ASOF);
    expect(routing?.legalisation.route).toBe('unknown');
    expect(routing?.legalisationSatisfied).toBe(false);
    expect(routing?.needsVerification).toBe(true);
  });

  it('accepts a completed route the catalog actually knows about', () => {
    // The other side of the same test: a confirmed apostille route, completed,
    // is satisfied. Without this the one above would pass on a module that
    // refused everything.
    const record = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [
        document({
          id: 'doc-apostilled',
          issuingCountry: countryCode('MX'),
          legalisation: { route: 'apostille', completedOn: isoDate('2026-05-01') },
        }),
      ],
    });
    const [routing] = documentRouting(record, ASOF);
    expect(routing?.legalisation.route).toBe('apostille');
    expect(routing?.legalisationSatisfied).toBe(true);
    expect(routing?.needsVerification).toBe(false);
  });

  it('routes every document held, in the order the record holds them', () => {
    const record = matterRecord({
      documents: [
        document({ id: 'doc-1' }),
        document({ id: 'doc-2', kind: 'passport', status: 'provided' }),
        document({ id: 'doc-3', status: 'rejected' }),
      ],
    });
    expect(documentRouting(record, ASOF).map((r) => r.document.id)).toEqual([
      'doc-1',
      'doc-2',
      'doc-3',
    ]);
  });
});

describe('documentTotals', () => {
  it('keeps "unknown" apart from "fine" and from "a problem"', () => {
    // The whole point of the separate counter. A document with no recorded
    // acceptance window has not been checked; folding it into either bucket
    // makes the page assert something nobody established.
    const record = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [
        document({ id: 'doc-cv', kind: 'cv', status: 'accepted', issuedOn: undefined }),
      ],
    });
    const totals = documentTotals(documentRouting(record, ASOF));
    expect(documentRouting(record, ASOF)[0]?.freshness.verdict).toBe('unknown');
    expect(totals.held).toBe(1);
    expect(totals.present).toBe(1);
    expect(totals.freshnessUnknown).toBe(1);
    expect(totals.freshnessProblems).toBe(0);
  });

  it('counts an expired document as held but not present', () => {
    // An expired police certificate is in the folder and is exactly as useful
    // as an empty folder.
    const record = matterRecord({
      documents: [
        document({ id: 'doc-expired', status: 'expired' }),
        document({ id: 'doc-ok', status: 'accepted' }),
      ],
    });
    const totals = documentTotals(documentRouting(record, ASOF));
    expect(totals.held).toBe(2);
    expect(totals.present).toBe(1);
  });

  it('does not count outstanding work against a document nobody holds', () => {
    // A `required` document has no legalisation or translation outstanding —
    // it has no document. Counting it twice would double the apparent backlog.
    const record = matterRecord({
      matter: { targetJurisdiction: countryCode('ES') },
      documents: [document({ id: 'doc-missing', status: 'required' })],
    });
    const totals = documentTotals(documentRouting(record, ASOF));
    expect(totals.present).toBe(0);
    expect(totals.legalisationOutstanding).toBe(0);
    expect(totals.translationOutstanding).toBe(0);
    expect(totals.freshnessProblems).toBe(0);
    expect(totals.freshnessUnknown).toBe(0);
  });

  it('counts nothing for an empty folder', () => {
    expect(documentTotals(documentRouting(matterRecord(), ASOF))).toEqual({
      held: 0,
      present: 0,
      legalisationOutstanding: 0,
      translationOutstanding: 0,
      freshnessProblems: 0,
      freshnessUnknown: 0,
      needsVerification: 0,
    });
  });

  it('counts an untranslated foreign-language document as outstanding', () => {
    // A Castilian document going to Canada, where the accepted languages are
    // English and French. Nothing about the folder says so; only the routing.
    const record = matterRecord({
      matter: { targetJurisdiction: countryCode('CA') },
      documents: [
        document({
          id: 'doc-es',
          issuingCountry: countryCode('ES'),
          status: 'accepted',
          translation: { sourceLanguage: CASTILIAN_TAG },
        }),
      ],
    });
    const [routing] = documentRouting(record, ASOF);
    expect(routing?.translation.acceptedLanguages).toEqual(['en', 'fr']);
    expect(routing?.translationSatisfied).toBe(false);
    expect(documentTotals(documentRouting(record, ASOF)).translationOutstanding).toBe(1);
  });
});
