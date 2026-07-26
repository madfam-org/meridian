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
 *
 * ## Both languages, same literalism
 *
 * The phrasing is bilingual because a Spanish-speaking reviewer signing off a
 * Spanish pathway is the whole point of the queue, and a rule they cannot read
 * is a rule they cannot review. The phrase table lives in this file rather than
 * in `lib/i18n.ts` deliberately: each entry is the rendering of one operator and
 * belongs beside the `case` that emits it, where a reviewer of *this file* can
 * check that `gte` still says `≥` in both halves and that neither half has
 * quietly acquired a softening word.
 *
 * What is translated is the connective tissue — "is recorded", "at least one
 * entry in", "all of". What is never translated is the operator symbol, the
 * fact path, or the operand: `≥ 730` is `≥ 730` in both languages, because a
 * threshold rendered differently in two places is a threshold nobody can
 * reconcile.
 */

import { walkSpecs, type EvaluatorSpec } from '@meridian/pathways';
import type { Bi, Locale } from '@/lib/i18n';
import { bi, fill, pick } from '@/lib/i18n';

/** One line of the rendered rule, with its nested operands beneath it. */
export interface SpecNode {
  readonly text: string;
  readonly children: readonly SpecNode[];
}

/**
 * How each operator reads. `{path}`, `{value}`, `{other}` and `{scale}` are
 * substituted verbatim from the record and never localised.
 */
const PHRASE = {
  isPresent: bi('{path} is recorded', '{path} está registrado'),
  isTrue: bi('{path} is true', '{path} es verdadero'),
  isFalse: bi('{path} is false', '{path} es falso'),
  equals: bi('{path} equals {value}', '{path} es igual a {value}'),
  oneOf: bi('{path} is one of: {values}', '{path} es uno de: {values}'),
  comparison: bi('{path} {operator} {value}', '{path} {operator} {value}'),
  setContainsAny: bi(
    '{path} contains any of: {values}',
    '{path} contiene alguno de: {values}',
  ),
  setContainsField: bi(
    '{path} contains the value found at {other}',
    '{path} contiene el valor hallado en {other}',
  ),
  equalsField: bi(
    '{path} equals the value found at {other}',
    '{path} es igual al valor hallado en {other}',
  ),
  dateBefore: bi('{path} is before {value}', '{path} es anterior a {value}'),
  dateOnOrBefore: bi(
    '{path} is on or before {value}',
    '{path} es igual o anterior a {value}',
  ),
  dateAfter: bi('{path} is after {value}', '{path} es posterior a {value}'),
  dateOnOrAfter: bi(
    '{path} is on or after {value}',
    '{path} es igual o posterior a {value}',
  ),
  ordinalAtLeast: bi('{path} is at least {value}', '{path} es al menos {value}'),
  ordinalScale: bi('on the ordered scale: {scale}', 'en la escala ordenada: {scale}'),
  durationSince: bi(
    'at least {duration} have elapsed since {path}, counted as whole calendar periods',
    'han transcurrido al menos {duration} desde {path}, contados como periodos naturales completos',
  ),
  collectionAny: bi(
    'at least one entry in {path} satisfies:',
    'al menos una entrada de {path} cumple:',
  ),
  allOf: bi('all of:', 'todo lo siguiente:'),
  anyOf: bi('any of:', 'alguno de lo siguiente:'),
  not: bi('not:', 'no se cumple:'),
  /**
   * The schema cannot enforce "at least one of years, months, days" inside a
   * discriminated union, so the integrity linter does. Both halves say plainly
   * that the period is missing rather than rendering "at least  have elapsed".
   */
  noPeriod: bi('no period is specified', 'no se especifica ningún periodo'),
  year: bi('{count} year', '{count} año'),
  years: bi('{count} years', '{count} años'),
  month: bi('{count} month', '{count} mes'),
  months: bi('{count} months', '{count} meses'),
  day: bi('{count} day', '{count} día'),
  days: bi('{count} days', '{count} días'),
} as const satisfies Readonly<Record<string, Bi>>;

function leaf(text: string): SpecNode {
  return { text, children: [] };
}

function listValues(values: readonly (string | number)[]): string {
  return values.map((v) => String(v)).join(', ');
}

function durationText(
  spec: {
    readonly years?: number;
    readonly months?: number;
    readonly days?: number;
  },
  locale: Locale,
): string {
  const parts: string[] = [];
  if (spec.years !== undefined) {
    parts.push(fill(spec.years === 1 ? PHRASE.year : PHRASE.years, locale, { count: spec.years }));
  }
  if (spec.months !== undefined) {
    parts.push(
      fill(spec.months === 1 ? PHRASE.month : PHRASE.months, locale, { count: spec.months }),
    );
  }
  if (spec.days !== undefined) {
    parts.push(fill(spec.days === 1 ? PHRASE.day : PHRASE.days, locale, { count: spec.days }));
  }
  return parts.length === 0 ? pick(PHRASE.noPeriod, locale) : parts.join(' + ');
}

/**
 * Render a spec tree.
 *
 * Every branch of the union is handled explicitly; there is no default case, so
 * a new operator added to `@meridian/pathways` makes this file fail to compile
 * rather than silently rendering as nothing on the one screen whose job is to
 * show a reviewer the whole rule.
 */
export function describeSpec(spec: EvaluatorSpec, locale: Locale): SpecNode {
  switch (spec.op) {
    case 'is_present':
      return leaf(fill(PHRASE.isPresent, locale, { path: spec.path }));
    case 'is_true':
      return leaf(fill(PHRASE.isTrue, locale, { path: spec.path }));
    case 'is_false':
      return leaf(fill(PHRASE.isFalse, locale, { path: spec.path }));
    case 'equals':
      return leaf(fill(PHRASE.equals, locale, { path: spec.path, value: String(spec.value) }));
    case 'one_of':
      return leaf(fill(PHRASE.oneOf, locale, { path: spec.path, values: listValues(spec.values) }));
    case 'gte':
      return leaf(
        fill(PHRASE.comparison, locale, { path: spec.path, operator: '≥', value: spec.value }),
      );
    case 'gt':
      return leaf(
        fill(PHRASE.comparison, locale, { path: spec.path, operator: '>', value: spec.value }),
      );
    case 'lte':
      return leaf(
        fill(PHRASE.comparison, locale, { path: spec.path, operator: '≤', value: spec.value }),
      );
    case 'lt':
      return leaf(
        fill(PHRASE.comparison, locale, { path: spec.path, operator: '<', value: spec.value }),
      );
    case 'set_contains_any':
      return leaf(
        fill(PHRASE.setContainsAny, locale, {
          path: spec.path,
          values: listValues(spec.values),
        }),
      );
    case 'set_contains_field':
      return leaf(
        fill(PHRASE.setContainsField, locale, { path: spec.path, other: spec.otherPath }),
      );
    case 'equals_field':
      return leaf(fill(PHRASE.equalsField, locale, { path: spec.path, other: spec.otherPath }));
    case 'date_before':
      return leaf(fill(PHRASE.dateBefore, locale, { path: spec.path, value: spec.value }));
    case 'date_on_or_before':
      return leaf(fill(PHRASE.dateOnOrBefore, locale, { path: spec.path, value: spec.value }));
    case 'date_after':
      return leaf(fill(PHRASE.dateAfter, locale, { path: spec.path, value: spec.value }));
    case 'date_on_or_after':
      return leaf(fill(PHRASE.dateOnOrAfter, locale, { path: spec.path, value: spec.value }));
    case 'ordinal_at_least':
      return {
        text: fill(PHRASE.ordinalAtLeast, locale, { path: spec.path, value: spec.value }),
        children: [
          leaf(fill(PHRASE.ordinalScale, locale, { scale: spec.scale.join(' < ') })),
        ],
      };
    case 'duration_since_at_least':
      return leaf(
        fill(PHRASE.durationSince, locale, {
          duration: durationText(spec, locale),
          path: spec.path,
        }),
      );
    case 'collection_any':
      return {
        text: fill(PHRASE.collectionAny, locale, { path: spec.path }),
        children: [describeSpec(spec.where, locale)],
      };
    case 'all_of':
      return { text: pick(PHRASE.allOf, locale), children: spec.of.map((s) => describeSpec(s, locale)) };
    case 'any_of':
      return { text: pick(PHRASE.anyOf, locale), children: spec.of.map((s) => describeSpec(s, locale)) };
    case 'not':
      return { text: pick(PHRASE.not, locale), children: [describeSpec(spec.of, locale)] };
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
