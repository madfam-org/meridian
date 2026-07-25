/**
 * Running the advice boundary for real, at the point of render.
 *
 * The portal never decides for itself whether something "counts as advice".
 * `@meridian/pathways` produces a ranking that is *born* classified `advice`,
 * and `releaseRecommendation` hands it to `@meridian/core`'s `canRelease`,
 * which either releases it or returns the downgraded form plus the reason. The
 * page renders whatever comes back and has no way to reach past it — the
 * discriminated union makes the withheld value structurally unavailable on the
 * branch where it was withheld.
 *
 * That is the entire point of the design. A render-time judgement about whether
 * a screen is "really" giving advice is a judgement somebody eventually gets
 * wrong under deadline, and under s.91 of Canada's Immigration and Refugee
 * Protection Act getting it wrong is an offence rather than a bug.
 *
 * Note what happens with this worked example even before the audience is
 * considered: every pathway in the shipped catalog is `unreviewed`, so the
 * catalog gate holds all of them out of the ranking regardless. Attaching a
 * representative would not produce a recommendation here. Both gates are shown
 * because both are real.
 */

import type { CountryCode, IsoDate, ReleaseContext } from '@meridian/core';
import { audienceFor, representativeFor } from '@meridian/core';
import type { Pathway, ReleasedRecommendation } from '@meridian/pathways';
import { isCounselReviewed, recommend, releaseRecommendation } from '@meridian/pathways';

import { bi, type Bi } from '@/lib/i18n';
import type { SampleMatter } from '@/lib/sample/matters';

export interface RecommendationRelease {
  readonly context: ReleaseContext;
  readonly released: ReleasedRecommendation;
  /** Pathways in the catalog whose rules a licensed person has signed off on. */
  readonly counselReviewedCount: number;
  readonly catalogSize: number;
}

/**
 * Build the release context from the matter, rather than from a constant.
 *
 * `audienceFor` maps the tenant kind, and `representativeFor` looks for a live,
 * unexpired credential in the right jurisdiction. Both worked-example matters
 * resolve to `applicant` with no representative, which is the protected case.
 */
export function releaseContextFor(sample: SampleMatter, asOf: IsoDate): ReleaseContext {
  const jurisdiction = sample.matter.targetJurisdiction;
  return {
    audience: audienceFor(sample.tenant.kind),
    jurisdiction,
    representative: representativeFor(sample.tenant, jurisdiction, asOf),
    // The worked example is not a paying engagement. s.91 turns on
    // consideration, but the downgrade applies either way: an unlicensed
    // recommendation that happens to be lawful is still one nobody is
    // accountable for.
    forConsideration: false,
    asOf,
  };
}

export function releaseRecommendationFor(
  sample: SampleMatter,
  catalog: readonly Pathway[],
  asOf: IsoDate,
): RecommendationRelease {
  const context = releaseContextFor(sample, asOf);
  const jurisdictional = catalog.filter(
    (p) => p.jurisdiction === (sample.matter.targetJurisdiction as CountryCode),
  );
  const recommendation = recommend(sample.facts, jurisdictional, asOf);

  return {
    context,
    released: releaseRecommendation(recommendation, context),
    counselReviewedCount: jurisdictional.filter(isCounselReviewed).length,
    catalogSize: jurisdictional.length,
  };
}

/** What a downgraded recommendation removed, stated specifically. */
export const WITHHELD_FROM_RECOMMENDATION: readonly Bi[] = [
  bi(
    'The ordering of these pathways from best to worst for your circumstances.',
    'La ordenación de estas vías de mejor a peor para su situación.',
  ),
  bi(
    'A statement of which route you should pursue, and why that one rather than another.',
    'Una indicación de qué vía debería seguir, y por qué esa y no otra.',
  ),
  bi(
    'Any estimate of the chance that an application would succeed. Meridian does not produce one for anybody, licensed or not — no authority publishes the data that would make such a number true.',
    'Cualquier estimación de la probabilidad de éxito de una solicitud. Meridian no la produce para nadie, con licencia o sin ella: ninguna autoridad publica los datos que harían cierta esa cifra.',
  ),
];

export const REMEDY_FOR_RECOMMENDATION: readonly Bi[] = [
  bi(
    'An authorised representative — a lawyer, a Quebec notary, a CICC licensee, or a Spanish abogado or gestor administrativo — attached to this matter and licensed in the jurisdiction it concerns.',
    'Un representante autorizado —abogado, notario de Quebec, colegiado del CICC, o abogado o gestor administrativo español— vinculado a este expediente y habilitado en la jurisdicción de que se trate.',
  ),
  bi(
    'Rules that a licensed person has read and signed off on. A route nobody qualified has checked never enters a recommendation, whatever the engine computes about it.',
    'Normas que una persona con licencia haya leído y validado. Una vía que nadie cualificado haya revisado nunca entra en una recomendación, sea cual sea el resultado del motor.',
  ),
];

/** Everything you keep after the downgrade. Stated so the loss is not overstated. */
export const RETAINED_AFTER_DOWNGRADE: readonly Bi[] = [
  bi(
    'Every pathway that was assessed, in catalog order, with its verdict.',
    'Todas las vías evaluadas, en el orden del catálogo, con su resultado.',
  ),
  bi(
    'Every criterion, its result, and the comparison the engine performed.',
    'Todos los criterios, su resultado y la comparación que realizó el motor.',
  ),
  bi(
    'Every source, with the date a human last checked it against the instrument.',
    'Todas las fuentes, con la fecha en que una persona las contrastó por última vez con la norma.',
  ),
];
