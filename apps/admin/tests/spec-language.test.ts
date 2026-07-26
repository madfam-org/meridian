/**
 * Rendering an encoded rule back into something a lawyer can read.
 *
 * This module is part of the review gate rather than decoration: a reviewer who
 * cannot read the `EvaluatorSpec` tree cannot review the rule, which would put
 * the law back somewhere no reviewing lawyer looks.
 *
 * Two properties carry the weight. **Every operator renders**, because a branch
 * that fell through would show a reviewer a rule with a piece missing on the one
 * screen whose job is to show the whole rule. And **the operand is never
 * softened**: a reviewer has to be able to see that the record says `≥ 730` when
 * they expected `≥ 731`, so the threshold is identical in both languages and
 * "about two years" appears nowhere.
 */

import { isoDate } from '@meridian/core';
import type { EvaluatorSpec } from '@meridian/pathways';
import { describe, expect, it } from 'vitest';
import { describeSpec, specFactPaths, specSize } from '@/lib/spec-language';
import { LOCALES } from '@/lib/i18n';

/**
 * One spec per operator, keyed by the operator itself.
 *
 * A new operator in `@meridian/pathways` makes this object fail to compile,
 * which is the same guarantee `describeSpec`'s exhaustive switch gives — a test
 * that silently stopped covering an operator would report full coverage of a
 * union it had never heard of.
 */
const SPECS: Record<EvaluatorSpec['op'], EvaluatorSpec> = {
  is_present: { op: 'is_present', path: 'jobOffer' },
  is_true: { op: 'is_true', path: 'remoteWork' },
  is_false: { op: 'is_false', path: 'remoteWork' },
  equals: { op: 'equals', path: 'claimedNationality', value: 'MX' },
  one_of: { op: 'one_of', path: 'claimedNationality', values: ['MX', 'AR'] },
  gte: { op: 'gte', path: 'derived.continuousLegalResidenceDays', value: 730 },
  gt: { op: 'gt', path: 'ageYears', value: 17 },
  lte: { op: 'lte', path: 'derived.longestAbsenceDays', value: 180 },
  lt: { op: 'lt', path: 'ageYears', value: 65 },
  set_contains_any: { op: 'set_contains_any', path: 'nationalities', values: ['MX'] },
  set_contains_field: {
    op: 'set_contains_field',
    path: 'nationalities',
    otherPath: 'claimedNationality',
  },
  equals_field: {
    op: 'equals_field',
    path: 'residenceHeldUnderNationality',
    otherPath: 'claimedNationality',
  },
  date_before: { op: 'date_before', path: 'statusExpiresOn', value: isoDate('2026-12-31') },
  date_on_or_before: { op: 'date_on_or_before', path: 'statusExpiresOn', value: isoDate('2026-12-31') },
  date_after: { op: 'date_after', path: 'applicationLodgedOn', value: isoDate('2026-01-01') },
  date_on_or_after: { op: 'date_on_or_after', path: 'applicationLodgedOn', value: isoDate('2026-01-01') },
  ordinal_at_least: {
    op: 'ordinal_at_least',
    path: 'educationLevel',
    scale: ['secondary', 'bachelor', 'master'],
    value: 'bachelor',
  },
  duration_since_at_least: {
    op: 'duration_since_at_least',
    path: 'derived.continuousLegalResidenceSince',
    years: 2,
  },
  collection_any: {
    op: 'collection_any',
    path: 'residencePeriods',
    where: { op: 'is_present', path: 'country' },
  },
  all_of: { op: 'all_of', of: [{ op: 'is_present', path: 'jobOffer' }] },
  any_of: { op: 'any_of', of: [{ op: 'is_present', path: 'jobOffer' }] },
  not: { op: 'not', of: { op: 'is_true', path: 'remoteWork' } },
};

const ALL_SPECS = Object.entries(SPECS) as [EvaluatorSpec['op'], EvaluatorSpec][];

describe('describeSpec is total', () => {
  it('renders every operator in every language', () => {
    for (const [op, spec] of ALL_SPECS) {
      for (const locale of LOCALES) {
        const node = describeSpec(spec, locale);
        expect(node.text.trim(), `${op}/${locale}`).not.toBe('');
        // A leftover `{placeholder}` is a sentence that lost its operand.
        expect(node.text, `${op}/${locale}`).not.toMatch(/\{[a-z]+\}/i);
      }
    }
  });

  it('nests the operands of a compound rule rather than flattening them', () => {
    // A reviewer navigating by structure needs the depth; a flat rendering with
    // indentation loses it for exactly the reader who most needs it.
    const node = describeSpec(
      {
        op: 'all_of',
        of: [
          { op: 'is_present', path: 'jobOffer' },
          { op: 'not', of: { op: 'is_true', path: 'remoteWork' } },
        ],
      },
      'en',
    );
    expect(node.children).toHaveLength(2);
    expect(node.children[1]?.children).toHaveLength(1);
  });

  it('shows the ordered scale beneath an ordinal comparison', () => {
    // "at least bachelor" is meaningless without the scale it is ordered on.
    const node = describeSpec(SPECS.ordinal_at_least, 'en');
    expect(node.children).toHaveLength(1);
    expect(node.children[0]?.text).toContain('secondary < bachelor < master');
  });
});

describe('nothing about the rule is softened', () => {
  it('renders a threshold identically in both languages', () => {
    // A threshold rendered differently in two places is a threshold nobody can
    // reconcile.
    for (const locale of LOCALES) {
      expect(describeSpec(SPECS.gte, 'en').text).toContain('≥ 730');
      expect(describeSpec(SPECS.gte, locale).text, locale).toContain('≥ 730');
    }
  });

  it('uses a distinct symbol for each comparison operator', () => {
    // `≥` and `>` decide whether the applicant on day 730 qualifies.
    const symbols = (['gte', 'gt', 'lte', 'lt'] as const).map((op) => {
      const match = /([≥>≤<])/.exec(describeSpec(SPECS[op], 'en').text);
      return match?.[1] ?? '';
    });
    expect(symbols).toEqual(['≥', '>', '≤', '<']);
  });

  it('prints the fact path verbatim, however unpretty', () => {
    // `derived.continuousLegalResidenceDays` names the exact field the engine
    // reads. A reviewer asking "measured from what?" needs the real name.
    for (const locale of LOCALES) {
      expect(describeSpec(SPECS.gte, locale).text).toContain(
        'derived.continuousLegalResidenceDays',
      );
    }
  });

  it('never paraphrases a duration into an approximation', () => {
    const text = describeSpec(SPECS.duration_since_at_least, 'en').text;
    expect(text).toContain('2 years');
    expect(text).not.toMatch(/about|roughly|approximately/i);
    expect(text).toContain('whole calendar periods');
  });

  it('says plainly when a duration specifies no period at all', () => {
    // The schema cannot enforce "at least one of years, months, days" inside a
    // discriminated union, so this spec is constructible. Rendering it as
    // "at least  have elapsed" would look like a display bug rather than the
    // data defect it is.
    const spec: EvaluatorSpec = { op: 'duration_since_at_least', path: 'dateOfBirth' };
    for (const locale of LOCALES) {
      const text = describeSpec(spec, locale).text;
      expect(text, locale).not.toMatch(/least\s{2,}/);
      expect(text.length, locale).toBeGreaterThan(0);
    }
    expect(describeSpec(spec, 'en').text).toContain('no period is specified');
    expect(describeSpec(spec, 'es').text).toContain('no se especifica ningún periodo');
  });

  it('renders the connective tissue in the reader’s language', () => {
    // A Spanish reviewer signing off a Spanish pathway is the point of the
    // queue, and a rule they cannot read is a rule they cannot review.
    expect(describeSpec(SPECS.all_of, 'en').text).toBe('all of:');
    expect(describeSpec(SPECS.all_of, 'es').text).toBe('todo lo siguiente:');
    expect(describeSpec(SPECS.not, 'en').text).not.toBe(describeSpec(SPECS.not, 'es').text);
  });

  it('handles a singular period without saying "1 years"', () => {
    expect(describeSpec({ op: 'duration_since_at_least', path: 'x', years: 1 }, 'en').text).toContain(
      '1 year',
    );
    expect(
      describeSpec({ op: 'duration_since_at_least', path: 'x', years: 1 }, 'en').text,
    ).not.toContain('1 years');
    expect(describeSpec({ op: 'duration_since_at_least', path: 'x', days: 1 }, 'es').text).toContain(
      '1 día',
    );
  });

  it('joins a compound period rather than dropping a component', () => {
    const text = describeSpec(
      { op: 'duration_since_at_least', path: 'x', years: 1, months: 6, days: 2 },
      'en',
    ).text;
    expect(text).toContain('1 year');
    expect(text).toContain('6 months');
    expect(text).toContain('2 days');
  });
});

describe('specFactPaths', () => {
  it('lists every fact the rule reads, including both sides of a field comparison', () => {
    // A reviewer's first question is "what does it look at", and the answer is
    // not visible from the criterion label.
    expect(specFactPaths(SPECS.equals_field)).toEqual([
      { path: 'residenceHeldUnderNationality', rootScope: true },
      { path: 'claimedNationality', rootScope: true },
    ]);
  });

  it('de-duplicates a path the rule reads twice', () => {
    const spec: EvaluatorSpec = {
      op: 'all_of',
      of: [
        { op: 'gte', path: 'ageYears', value: 18 },
        { op: 'lt', path: 'ageYears', value: 65 },
      ],
    };
    expect(specFactPaths(spec)).toEqual([{ path: 'ageYears', rootScope: true }]);
  });

  it('distinguishes a path inside a collection from one at the root', () => {
    // Inside `collection_any` the path resolves against the element, so the
    // same name is a different fact. Collapsing them would tell a reviewer the
    // rule reads a field it does not.
    const spec: EvaluatorSpec = {
      op: 'all_of',
      of: [
        { op: 'is_present', path: 'country' },
        { op: 'collection_any', path: 'residencePeriods', where: { op: 'is_present', path: 'country' } },
      ],
    };
    expect(specFactPaths(spec)).toEqual([
      { path: 'country', rootScope: true },
      { path: 'residencePeriods', rootScope: true },
      { path: 'country', rootScope: false },
    ]);
  });

  it('reads nothing from a rule with no paths in it', () => {
    expect(specFactPaths({ op: 'all_of', of: [{ op: 'not', of: { op: 'is_true', path: 'x' } }] })).toEqual(
      [{ path: 'x', rootScope: true }],
    );
  });
});

describe('specSize', () => {
  it('counts every operator node, nested ones included', () => {
    expect(specSize(SPECS.is_present)).toBe(1);
    expect(specSize(SPECS.not)).toBe(2);
    expect(
      specSize({
        op: 'all_of',
        of: [
          { op: 'is_present', path: 'a' },
          { op: 'any_of', of: [{ op: 'is_true', path: 'b' }, { op: 'is_false', path: 'c' }] },
        ],
      }),
    ).toBe(5);
  });
});
