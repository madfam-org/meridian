/**
 * The one shape engine output may leave this service in.
 *
 * A route cannot return an `EligibilityReport`, a `SchengenStatus`, or a
 * `DocumentChecklist` directly. It returns an {@link EngineOutput} — a sealed
 * carrier holding the `Disclosable` the engine produced, plus the two facts the
 * gate needs to decide who may see it: which jurisdiction the output concerns,
 * and which matter (and therefore which representative) it belongs to.
 *
 * The carrier is branded with a module-private symbol. A hand-built object with
 * the same fields is not an `EngineOutput` and will not type-check, so
 * {@link engineOutput} is genuinely the only way to make one. The response hook
 * recognises the brand, applies the gate, and replaces the carrier with a
 * serialisable envelope — the carrier itself never reaches the wire.
 *
 * Why this rather than "remember to call `canRelease` in each handler": the
 * handler that forgets is the one written under deadline against a route that
 * "only returns numbers", and by the time anyone notices, an unlicensed
 * recommendation has been served to a paying consumer. Under IRPA s.91 that is
 * an offence, not a bug.
 */

import type { DisclosureClass, Disclosable } from '@meridian/core';

const ENGINE_OUTPUT = Symbol('meridian.engineOutput');

/**
 * What the output is about, for the audit trail.
 *
 * A closed set rather than free text so a reader can filter the trail by the
 * kind of statement made — "show me every recommendation this tenant produced"
 * is a question a regulator asks, and it cannot be answered against prose.
 */
export type EngineSubject =
  | 'pathway_catalog'
  | 'pathway_evaluation'
  | 'pathway_recommendation'
  | 'schengen_status'
  | 'tax_day_count'
  | 'continuous_residence'
  | 'document_checklist'
  | 'document_gaps'
  | 'mrz_validation'
  | 'govtech_capabilities'
  | 'govtech_handoff';

export interface EngineOutputSpec<T> {
  readonly subject: EngineSubject;
  readonly disclosable: Disclosable<T>;
  /** ISO 3166-1 alpha-2 (or a bloc code) the output concerns. Drives representative matching. */
  readonly jurisdiction: string;
  /**
   * The matter whose representative is accountable, when there is one.
   *
   * `null` is legitimate — a catalog listing belongs to no matter — and it is
   * not the same as "no representative": with no matter the gate falls back to a
   * tenant-level representative for the jurisdiction.
   */
  readonly matterId: string | null;
  /**
   * How to express the same content at a lower classification.
   *
   * Supplied by the route because only the route knows what survives. For a
   * recommendation it is `downgradeToAssessment`, which keeps every pathway,
   * verdict and citation and drops the ranking. When it is absent and release is
   * refused, the value is withheld entirely — the safe default, because a
   * *generic* downgrade would mean this module deciding which parts of an
   * unfamiliar payload constitute advice, and it has no basis for that.
   */
  readonly downgrade?: (value: T) => Disclosable<unknown>;
  /**
   * Called by the gate with what the reader actually received.
   *
   * Routes that store an assessment use this instead of writing the record in
   * the handler, because the handler runs *before* the gate and does not know
   * whether a downgrade happened. A stored report claiming it was released as
   * `advice` when the reader was shown an assessment is a false record in the
   * one place that has to be true.
   */
  readonly onRelease?: (result: ReleaseRecord) => Promise<void>;
}

/** What the gate decided, for routes that persist their output. */
export interface ReleaseRecord {
  /** What the reader received. */
  readonly classification: DisclosureClass;
  /** What the engine produced. */
  readonly producedClassification: DisclosureClass;
  readonly released: boolean;
}

export interface EngineOutput<T> extends EngineOutputSpec<T> {
  readonly [ENGINE_OUTPUT]: true;
}

/** The only constructor. See the module note. */
export function engineOutput<T>(spec: EngineOutputSpec<T>): EngineOutput<T> {
  return { ...spec, [ENGINE_OUTPUT]: true };
}

export function isEngineOutput(value: unknown): value is EngineOutput<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<PropertyKey, unknown>)[ENGINE_OUTPUT] === true
  );
}

/**
 * Machine-readable account of what the reader is not being shown, and why.
 *
 * Deliberately not a human sentence alone. A client that receives a downgrade
 * has to be able to *act* on it — offer to attach a representative, explain the
 * boundary in the user's language, suppress a UI affordance — and it cannot do
 * any of that by pattern-matching English prose.
 */
export interface WithheldExplanation {
  readonly code: 'ADVICE_BOUNDARY';
  /** `canRelease`'s own reason, unedited. */
  readonly reason: string;
  readonly downgradedTo: DisclosureClass;
  /** What would make release possible. Factual, not a sales prompt. */
  readonly requiredAction: string;
  readonly audience: string;
  readonly jurisdiction: string;
  readonly representativeAttached: boolean;
  /** Field names removed from `value` relative to the ungated form, where known. */
  readonly removedFields: readonly string[];
}

export interface DisclosureEnvelope {
  /** What the reader is actually getting. */
  readonly classification: DisclosureClass;
  /** What the engine produced. Equal to `classification` unless a downgrade happened. */
  readonly producedClassification: DisclosureClass;
  readonly released: boolean;
  readonly subject: EngineSubject;
  readonly jurisdiction: string;
  readonly matterId: string | null;
  /** Citation ids backing what is in `value` — not what was withheld. */
  readonly citationIds: readonly string[];
  readonly withheld: WithheldExplanation | null;
  readonly value: unknown;
}
