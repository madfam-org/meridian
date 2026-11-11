/**
 * The shapes shared by every legal source.
 *
 * A *source* is a service that holds the published text of law and can say when
 * a provision last changed. Meridian does not hold law text and does not try to:
 * the catalog encodes rules and cites the official publication, and this package
 * asks the system that keeps the text whether the cited provision has moved.
 *
 * The boundary, stated once so every adapter keeps to it:
 *
 *  - A source answers questions about **law**, never about a person. No adapter
 *    takes a fact about an applicant, and nothing a user typed is ever sent to a
 *    source. The only thing that crosses the wire is an instrument identifier.
 *  - A source can only **lower** trust in a citation, never raise it.
 *    `Citation.verifiedOn` records when a human read the text; a machine noticing
 *    that the text has not changed is not a human reading it, so nothing here
 *    writes or extends `verifiedOn`. See `drift.ts`.
 *  - A source says how much it knows. Spain's BOE dates every article; Tezca, as
 *    of this writing, records most Mexican laws with only their original
 *    publication date. Those are different capabilities and the reading carries
 *    which one produced it, so "no change recorded" is never confused with "no
 *    change happened".
 */
import type { IsoDate } from '@meridian/core';

/**
 * Who published the official text a citation points at.
 *
 * - `boe` — Spain's Boletín Oficial del Estado, consolidated legislation
 *   (`/buscar/act.php?id=BOE-A-…`). Read through BOE's open-data API.
 * - `diputados` — Mexico's Cámara de Diputados federal legislation library
 *   (`/LeyesBiblio/…`). Read through Tezca, which ingests that library and keeps
 *   the publisher's URL on each law it holds.
 */
export type SourceScheme = 'boe' | 'diputados';

/** Where the official text of a cited provision lives, derived from the citation itself. */
export interface SourceLocator {
  readonly scheme: SourceScheme;
  /**
   * The publisher's own identifier for the instrument: `BOE-A-1889-4763` for the
   * Código Civil, or the LeyesBiblio path `pdf/CPEUM.pdf` for the Constitution.
   */
  readonly instrumentId: string;
  /** The citation's URL, unchanged. Adapters check their records against it. */
  readonly officialUrl: string;
  /**
   * Article identifiers as the provision names them: `22` for "art. 22.3",
   * `2 bis`, or several for "arts. 145 y 146". Paragraph numbers are dropped,
   * because publishers date articles, not paragraphs.
   */
  readonly articles: readonly string[];
}

/** Why a citation could not be pointed at a readable source. */
export type UnlocatedReason =
  /** The citation carries no URL. */
  | 'no_url'
  /** The URL belongs to a publisher no adapter here reads. */
  | 'unrecognised_publisher'
  /** A BOE gazette page (`txt.php`, `doc.php`), which has no consolidated, dated text. */
  | 'not_consolidated_text'
  /** The provision does not name articles — an annex, a disposición, a trámite. */
  | 'provision_not_articles';

export type LocateOutcome =
  | { readonly located: true; readonly citationId: string; readonly locator: SourceLocator }
  | {
      readonly located: false;
      readonly citationId: string;
      readonly reason: UnlocatedReason;
      readonly detail: string;
    };

/**
 * What a reading's date is evidence of.
 *
 * - `article` — the source dates each article separately (BOE).
 * - `instrument` — the source dates the law as a whole, so a change anywhere in
 *   it moves the date. Conservative: it can report a change the cited article
 *   did not undergo, never the reverse.
 * - `none` — the source records no change history for this instrument. It holds
 *   the text, but cannot say when the text last moved.
 */
export type ChangeHistory = 'article' | 'instrument' | 'none';

export interface ArticleReading {
  readonly article: string;
  /** Present only when the source records a history that covers this article. */
  readonly lastChangedOn: IsoDate | null;
  readonly history: ChangeHistory;
  /** A link that opens this article's text, when the source has one. */
  readonly readerUrl: string | null;
  /** Set when the article was not found in the source's index. */
  readonly missing: boolean;
}

/** Why a source could not be read. Each has a different owner. */
export type UnreadableReason =
  /** No record in the source matches the instrument. */
  | 'not_found'
  /** The source's record for this instrument does not carry the cited URL. */
  | 'identity_mismatch'
  /** The source asked us to slow down. Retry later; nothing is wrong with the citation. */
  | 'rate_limited'
  /** The source answered with an error, or with a body this adapter cannot read. */
  | 'upstream_error'
  /** No adapter is configured for this scheme in the current run. */
  | 'not_provisioned';

export type SourceReading =
  | {
      readonly status: 'read';
      readonly locator: SourceLocator;
      /** Human-readable name of the system the reading came from. */
      readonly via: string;
      /** The source's own identifier for the instrument, when it differs from the publisher's. */
      readonly sourceRecordId: string;
      readonly articles: readonly ArticleReading[];
    }
  | {
      readonly status: 'unreadable';
      readonly locator: SourceLocator;
      readonly via: string;
      readonly reason: UnreadableReason;
      readonly detail: string;
    };

/** A system that holds the text of law for one publisher. */
export interface LegalSource {
  readonly scheme: SourceScheme;
  /** Shown in reports, e.g. "BOE open data (consolidated legislation)". */
  readonly via: string;
  read(locator: SourceLocator): Promise<SourceReading>;
}

/**
 * The slice of `fetch` the adapters use. Injected, so tests run with no network
 * and a caller decides timeouts, retries and egress.
 */
export type FetchLike = (
  url: string,
  init?: { readonly headers?: Readonly<Record<string, string>> },
) => Promise<{ readonly ok: boolean; readonly status: number; json(): Promise<unknown> }>;
