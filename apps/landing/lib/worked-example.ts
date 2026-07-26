/**
 * One real evaluation, run when this site is built.
 *
 * Everywhere else on this page a property is *claimed*: that evaluation is
 * three-valued, that a missing fact is never a refusal, that every criterion
 * carries the instrument it came from, that an unreviewed rule cannot become a
 * recommendation. A visitor has no reason to believe any of it. So instead of
 * asserting them, this module runs `evaluate` from `@meridian/pathways` over a
 * real pathway in the shipped catalog and the page renders whatever comes back.
 *
 * Nothing here is a fixture of the *output*. The facts are an input; the
 * verdict, the per-criterion statuses, the engine's own trace of each
 * comparison, the citations and the notes are all computed at build time from
 * the same catalog the engine evaluates. If a criterion is added, the table on
 * the page grows. If somebody re-words a rule, the trace changes with it. If
 * counsel signs the pathway off, the `unreviewed_rule` note disappears by
 * itself.
 *
 * ── The facts ────────────────────────────────────────────────────────────────
 *
 * Invented, and thin on purpose: country codes, dates and a handful of
 * recorded outcomes. No name, no document number, no address — this repository
 * holds no real personal data anywhere, including in its examples.
 *
 * One fact is *deliberately absent*: `claimedNationalityAcquisition`. Art. 22.1
 * of the Civil Code gives the two-year period to nationals **by origin**, and
 * somebody who acquired a qualifying nationality by residence is on the ten-year
 * general regime. The record does not say which, so the criterion evaluates to
 * `unknown` and the whole pathway comes back `indeterminate` — with every other
 * criterion met. That is the single most important thing this engine does,
 * and it is far more persuasive watched than described: the alternative, which
 * most of this category ships, is telling a person they are eight years closer
 * than they are.
 */

import { countryCode, isoDate } from '@meridian/core';
import type { ApplicantFacts, Criterion, CriterionResult, EligibilityReport, Pathway } from '@meridian/pathways';
import { MERIDIAN_PATHWAY_CATALOG, evaluate } from '@meridian/pathways';

import { AS_OF } from '@/lib/catalog-facts';
import { bi, type LocalizedText } from '@/lib/i18n';

/**
 * The pathway the demonstration runs against.
 *
 * The reduced-period route to Spanish nationality: the corridor this platform
 * starts from, and the pathway with the most criteria, so the table shows a
 * real mix rather than a toy.
 */
const PATHWAY_ID = 'es-nationality-residence-reduced';

/** The absent fact, named so the page can point at exactly one row. */
export const MISSING_CRITERION_ID = 'es-nat-red-nationality-by-origin';

function findPathway(id: string): Pathway {
  const found = MERIDIAN_PATHWAY_CATALOG.find((p) => p.id === id);
  if (found === undefined) {
    // A build-time throw rather than a silent fallback. This page's argument is
    // that it shows real output; rendering a placeholder because a catalog id
    // moved would quietly turn the demonstration into the marketing it exists
    // to replace.
    throw new Error(
      `worked-example: no pathway '${id}' in MERIDIAN_PATHWAY_CATALOG. ` +
        `The landing page's demonstration is anchored to it; point it at a pathway that exists.`,
    );
  }
  return found;
}

const PATHWAY: Pathway = findPathway(PATHWAY_ID);

/**
 * The invented applicant.
 *
 * Deliberately absent: `claimedNationalityAcquisition`. See the module note.
 */
const MX = countryCode('MX');
const ES = countryCode('ES');

const FACTS: ApplicantFacts = {
  applicantId: 'worked-example',
  nationalities: [MX],
  claimedNationality: MX,
  residenceHeldUnderNationality: MX,
  dateOfBirth: isoDate('1992-03-14'),
  targetJurisdiction: ES,
  currentStatus: 'resident',
  residencePeriods: [{ start: isoDate('2024-02-01'), end: AS_OF }],
  examResults: [{ code: 'CCSE', passed: true, takenOn: isoDate('2026-02-10') }],
  criminalRecord: {
    certificates: [
      { jurisdiction: ES, clear: true, issuedOn: isoDate('2026-06-01') },
      { jurisdiction: MX, clear: true, issuedOn: isoDate('2026-06-01') },
    ],
  },
};

/** The report, computed at build time. */
export const WORKED_REPORT: EligibilityReport = evaluate(PATHWAY, FACTS, AS_OF);

/** What the reader was told about the applicant, so the input is not a black box. */
export const WORKED_FACTS_SHOWN: readonly LocalizedText[] = [
  bi('Holds Mexican nationality, and claims under it', 'Tiene nacionalidad mexicana y solicita al amparo de ella'),
  bi('Residence in Spain is held under that same nationality', 'La residencia en España se ostenta bajo esa misma nacionalidad'),
  bi(
    `Legal residence recorded from 2024-02-01, unbroken to ${AS_OF}`,
    `Residencia legal registrada desde el 01-02-2024, ininterrumpida hasta el ${AS_OF}`,
  ),
  bi('Currently holds a valid residence authorisation', 'Actualmente tiene una autorización de residencia vigente'),
  bi('CCSE test passed on 2026-02-10', 'Prueba CCSE superada el 10-02-2026'),
  bi(
    'Police certificates from Spain and Mexico, both clear',
    'Certificados de antecedentes de España y de México, ambos sin antecedentes',
  ),
  bi(
    'NOT RECORDED: whether the Mexican nationality is held by origin or was acquired later',
    'SIN CONSTANCIA: si la nacionalidad mexicana se ostenta de origen o se adquirió con posterioridad',
  ),
];

export interface CriterionRow {
  readonly id: string;
  readonly label: LocalizedText;
  readonly status: CriterionResult['status'];
  readonly weight: Criterion['weight'];
  /** The engine's own trace of the comparison it performed. English, verbatim. */
  readonly detail: string;
  readonly citationIds: readonly string[];
  /** Present on the criterion the demonstration is built around. */
  readonly guidance: LocalizedText | null;
}

function criterionOf(id: string): Criterion | undefined {
  return PATHWAY.criteria.find((c) => c.id === id);
}

/** One row per criterion, in catalog order — never sorted by outcome. */
export const WORKED_CRITERIA: readonly CriterionRow[] = WORKED_REPORT.criteria.map(
  (result): CriterionRow => {
    const criterion = criterionOf(result.criterionId);
    const label = criterion?.label;
    const guidance = criterion?.guidance;
    return {
      id: result.criterionId,
      label:
        label === undefined ? bi(result.criterionId, result.criterionId) : bi(label.en, label.es),
      status: result.status,
      weight: result.weight,
      detail: result.detail,
      citationIds: result.citationIds,
      guidance:
        result.criterionId === MISSING_CRITERION_ID && guidance !== undefined
          ? bi(guidance.en, guidance.es)
          : null,
    };
  },
);

/**
 * The citation behind the criterion that could not be decided.
 *
 * Resolved from the report's own citation list rather than typed out, so the
 * instrument, provision, URL and verification date on the page are the ones the
 * engine actually applied.
 */
export const WORKED_CITATION = (() => {
  const row = WORKED_CRITERIA.find((c) => c.id === MISSING_CRITERION_ID);
  const wanted = row?.citationIds[0];
  return WORKED_REPORT.citations.find((c) => c.id === wanted) ?? null;
})();

/** The report's own notes: why a rule is discretionary, why it is unreviewed. */
export const WORKED_NOTES = WORKED_REPORT.notes;

/**
 * A stable React key for one report note.
 *
 * The engine deduplicates notes on `criterionId:citationId` — see the
 * `discretionary_source` loop in `@meridian/pathways`'s `evaluate.ts`. That is
 * deliberate: one discretionary instrument can be cited by several criteria, and
 * a rule resting on administrative practice has to say so *at every criterion
 * that rests on it*, not once per document. Two notes with the same `code` and
 * the same `citationId` are therefore a normal outcome, not a duplicate.
 *
 * This key must use the same triple the engine uses. An earlier version keyed on
 * `code` and `citationId` alone and collided on
 * `discretionary_source-es-cc-art-22-4`, because art. 22.4 is discretionary and
 * two criteria of the reduced-residency route both rest on it. React warned, and
 * the warning was right about the key while being wrong about the cause: nothing
 * was duplicated, the key was simply narrower than the identity.
 *
 * Index is deliberately not used. A key that is really a position is stable only
 * until the list is filtered or reordered, at which point React reuses the
 * previous element's state under a new meaning — and these notes carry legal
 * qualifications, so quietly re-attaching one to a different rule is the exact
 * class of error this page exists to avoid.
 */
export function workedNoteKey(note: (typeof WORKED_NOTES)[number]): string {
  return `${note.code}:${note.criterionId ?? '-'}:${note.citationId ?? '-'}`;
}

/** Counts for the summary line above the table. Derived, never typed. */
export const WORKED_TALLY = {
  total: WORKED_CRITERIA.length,
  met: WORKED_CRITERIA.filter((c) => c.status === 'met').length,
  unmet: WORKED_CRITERIA.filter((c) => c.status === 'unmet').length,
  unknown: WORKED_CRITERIA.filter((c) => c.status === 'unknown').length,
  humanReview: WORKED_CRITERIA.filter((c) => c.status === 'requires_human_review').length,
} as const;
