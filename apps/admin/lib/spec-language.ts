/**
 * Rendering a declarative criterion back into something a lawyer can read.
 *
 * The catalog is data on purpose: a rule expressed as a closure cannot be
 * diffed, exported, or signed off. The cost of that choice is that the rule
 * arrives at the review queue as an `EvaluatorSpec` tree, and a reviewer who
 * cannot read the tree cannot review the rule — which would put the whole
 * design back where it started, with the law in a place no reviewing lawyer
 * looks.
 *
 * So this module is part of the review gate, not decoration. It is deliberately
 * literal: it restates the encoded operation and the encoded operands, and it
 * does not paraphrase, summarise, or soften. A reviewer has to be able to see
 * that the record says `≥ 730` when they expected `≥ 731`, and a friendly
 * rendering that said "about two years" would hide precisely the error they are
 * there to catch.
 *
 * Fact paths are printed verbatim for the same reason. `derived.continuousLegalResidenceDays`
 * is not pretty, but it names the exact field the engine reads, and a reviewer
 * asking "measured from what?" needs the real name to ask about.
 */

import { walkSpecs, type EvaluatorSpec } from '@meridian/pathways';

/** One line of the rendered rule, with its nested operands beneath it. */
export interface SpecNode {
  readonly text: string;
  readonly children: readonly SpecNode[];
}

function leaf(text: string): SpecNode {
  return { text, children: [] };
}

function listValues(values: readonly (string | number)[]): string {
  return values.map((v) => String(v)).join(', ');
}

function durationText(spec: {
  readonly years?: number;
  readonly months?: number;
  readonly days?: number;
}): string {
  const parts: string[] = [];
  if (spec.years !== undefined) parts.push(`${spec.years} ${spec.years === 1 ? 'year' : 'years'}`);
  if (spec.months !== undefined) {
    parts.push(`${spec.months} ${spec.months === 1 ? 'month' : 'months'}`);
  }
  if (spec.days !== undefined) parts.push(`${spec.days} ${spec.days === 1 ? 'day' : 'days'}`);
  // The schema cannot enforce "at least one of years, months, days" inside a
  // discriminated union, so the integrity linter does. Say plainly what an
  // empty period means rather than rendering "at least  have elapsed".
  return parts.length === 0 ? 'no period is specified' : parts.join(' + ');
}

/**
 * Render a spec tree.
 *
 * Every branch of the union is handled explicitly; there is no default case, so
 * a new operator added to `@meridian/pathways` makes this file fail to compile
 * rather than silently rendering as nothing on the one screen whose job is to
 * show a reviewer the whole rule.
 */
export function describeSpec(spec: EvaluatorSpec): SpecNode {
  switch (spec.op) {
    case 'is_present':
      return leaf(`${spec.path} is recorded`);
    case 'is_true':
      return leaf(`${spec.path} is true`);
    case 'is_false':
      return leaf(`${spec.path} is false`);
    case 'equals':
      return leaf(`${spec.path} equals ${String(spec.value)}`);
    case 'one_of':
      return leaf(`${spec.path} is one of: ${listValues(spec.values)}`);
    case 'gte':
      return leaf(`${spec.path} ≥ ${spec.value}`);
    case 'gt':
      return leaf(`${spec.path} > ${spec.value}`);
    case 'lte':
      return leaf(`${spec.path} ≤ ${spec.value}`);
    case 'lt':
      return leaf(`${spec.path} < ${spec.value}`);
    case 'set_contains_any':
      return leaf(`${spec.path} contains any of: ${listValues(spec.values)}`);
    case 'set_contains_field':
      return leaf(`${spec.path} contains the value found at ${spec.otherPath}`);
    case 'equals_field':
      return leaf(`${spec.path} equals the value found at ${spec.otherPath}`);
    case 'date_before':
      return leaf(`${spec.path} is before ${spec.value}`);
    case 'date_on_or_before':
      return leaf(`${spec.path} is on or before ${spec.value}`);
    case 'date_after':
      return leaf(`${spec.path} is after ${spec.value}`);
    case 'date_on_or_after':
      return leaf(`${spec.path} is on or after ${spec.value}`);
    case 'ordinal_at_least':
      return {
        text: `${spec.path} is at least ${spec.value}`,
        children: [leaf(`on the ordered scale: ${spec.scale.join(' < ')}`)],
      };
    case 'duration_since_at_least':
      return leaf(
        `at least ${durationText(spec)} have elapsed since ${spec.path}, counted as whole calendar periods`,
      );
    case 'collection_any':
      return {
        text: `at least one entry in ${spec.path} satisfies:`,
        children: [describeSpec(spec.where)],
      };
    case 'all_of':
      return { text: 'all of:', children: spec.of.map(describeSpec) };
    case 'any_of':
      return { text: 'any of:', children: spec.of.map(describeSpec) };
    case 'not':
      return { text: 'not:', children: [describeSpec(spec.of)] };
  }
}

export interface FactPath {
  readonly path: string;
  /** False inside a `collection_any`, where the path resolves against the element. */
  readonly rootScope: boolean;
}

/**
 * Every fact the rule reads, de-duplicated.
 *
 * A reviewer's first question about an encoded rule is "what does it look at",
 * and the answer is not visible from the criterion label. This is also how a
 * reviewer notices that a residence criterion never reads an absence field.
 */
export function specFactPaths(spec: EvaluatorSpec): FactPath[] {
  const seen = new Set<string>();
  const out: FactPath[] = [];
  const record = (path: string, rootScope: boolean): void => {
    const key = `${rootScope ? 'root' : 'item'}:${path}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ path, rootScope });
  };
  walkSpecs(spec, (s, rootScope) => {
    if ('path' in s) record(s.path, rootScope);
    if ('otherPath' in s) record(s.otherPath, rootScope);
  });
  return out;
}

/** Count of operator nodes. A blunt but honest proxy for how much there is to read. */
export function specSize(spec: EvaluatorSpec): number {
  let count = 0;
  walkSpecs(spec, () => {
    count += 1;
  });
  return count;
}
