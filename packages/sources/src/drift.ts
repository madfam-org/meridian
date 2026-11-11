/**
 * Drift: has the cited text changed since a person last read it?
 *
 * `Citation.verifiedOn` is a human act — someone opened the instrument and read
 * the provision. Staleness (`@meridian/core` `staleness()`) measures how long ago
 * that was. Drift is the other half: whether the publisher's own record shows
 * the text moving after that date.
 *
 * The two never trade. A citation verified last week whose article BOE amended
 * yesterday is fresh and drifted, and it needs a person. A citation verified
 * eight months ago whose article has not changed since 2021 is stale and
 * undrifted, and it still needs a person: the drift check reading a date off an
 * index is not someone reading the law. So this module only ever reports; it
 * has no code path that produces a new `verifiedOn`, and no finding here makes
 * a citation more trusted than it already was.
 */
import { compareDates } from '@meridian/core';
import type { Citation, IsoDate } from '@meridian/core';
import type { ChangeHistory, LocateOutcome, SourceReading, SourceScheme } from './model.js';

export type DriftStatus =
  /** The source dates a change to the cited text after `verifiedOn`. A person must re-read it. */
  | 'changed_since_verification'
  /** The source's latest recorded change is on or before `verifiedOn`. */
  | 'unchanged_since_verification'
  /** The source could not be located, read, or has no history to compare against. */
  | 'undeterminable';

export interface DriftFinding {
  readonly citationId: string;
  readonly instrument: string;
  readonly provision: string | null;
  readonly verifiedOn: IsoDate;
  readonly status: DriftStatus;
  readonly scheme: SourceScheme | null;
  /** Null when the finding is about the citation as a whole (not located, or unreadable). */
  readonly article: string | null;
  readonly lastChangedOn: IsoDate | null;
  readonly history: ChangeHistory | null;
  readonly readerUrl: string | null;
  /** Why the status is what it is, in a sentence a maintainer can act on. */
  readonly reason: string;
}

/**
 * One finding per cited article, or a single finding for the citation when it
 * could not be located or read.
 *
 * `reading` must be the reading of `outcome.locator`; pass `null` when the
 * citation was not located or no source was consulted for its scheme.
 */
export function assessDrift(
  citation: Citation,
  outcome: LocateOutcome,
  reading: SourceReading | null,
): DriftFinding[] {
  const base = {
    citationId: citation.id,
    instrument: citation.instrument,
    provision: citation.provision ?? null,
    verifiedOn: citation.verifiedOn,
  };

  if (!outcome.located) {
    return [
      {
        ...base,
        status: 'undeterminable',
        scheme: null,
        article: null,
        lastChangedOn: null,
        history: null,
        readerUrl: null,
        reason: `Not located (${outcome.reason}): ${outcome.detail}`,
      },
    ];
  }
  const { scheme } = outcome.locator;

  if (reading === null) {
    return [
      {
        ...base,
        status: 'undeterminable',
        scheme,
        article: null,
        lastChangedOn: null,
        history: null,
        readerUrl: null,
        reason: `No source was consulted for ${scheme} in this run.`,
      },
    ];
  }
  if (reading.status === 'unreadable') {
    return [
      {
        ...base,
        status: 'undeterminable',
        scheme,
        article: null,
        lastChangedOn: null,
        history: null,
        readerUrl: null,
        reason: `${reading.via}: ${reading.reason} — ${reading.detail}`,
      },
    ];
  }

  return reading.articles.map((a): DriftFinding => {
    const common = { ...base, scheme, article: a.article, history: a.history, readerUrl: a.readerUrl };
    if (a.missing) {
      return {
        ...common,
        status: 'undeterminable',
        lastChangedOn: null,
        reason: `${reading.via} has no article ${a.article} in ${reading.sourceRecordId}.`,
      };
    }
    if (a.history === 'none' || a.lastChangedOn === null) {
      return {
        ...common,
        status: 'undeterminable',
        lastChangedOn: null,
        reason:
          `${reading.via} holds ${reading.sourceRecordId} without a reform history, ` +
          'so it cannot say when this article last changed.',
      };
    }
    if (compareDates(a.lastChangedOn, citation.verifiedOn) > 0) {
      return {
        ...common,
        status: 'changed_since_verification',
        lastChangedOn: a.lastChangedOn,
        reason:
          a.history === 'article'
            ? `Article ${a.article} changed on ${a.lastChangedOn}, after it was verified on ${citation.verifiedOn}.`
            : `${reading.sourceRecordId} changed on ${a.lastChangedOn}, after verification on ` +
              `${citation.verifiedOn}. The date is law-wide, so article ${a.article} may be untouched; read it.`,
      };
    }
    return {
      ...common,
      status: 'unchanged_since_verification',
      lastChangedOn: a.lastChangedOn,
      reason:
        `${a.history === 'article' ? `Article ${a.article}` : reading.sourceRecordId} last changed on ` +
        `${a.lastChangedOn}, on or before verification on ${citation.verifiedOn}.`,
    };
  });
}

/** Counts by status, for a report header. */
export function summariseDrift(findings: readonly DriftFinding[]): Record<DriftStatus, number> {
  const out: Record<DriftStatus, number> = {
    changed_since_verification: 0,
    unchanged_since_verification: 0,
    undeterminable: 0,
  };
  for (const f of findings) out[f.status] += 1;
  return out;
}
