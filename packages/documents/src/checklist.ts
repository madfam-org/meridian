/**
 * Checklist assembly: turning a pathway's document requirements into an ordered
 * plan of work.
 *
 * A list of document names is not a plan. Every document on a real migration
 * file carries three attached obligations that each take weeks and money —
 * obtain it, authenticate it, translate it — and they are strictly ordered.
 * Getting that order wrong is not an inefficiency, it is a bill:
 *
 *   - The apostille attaches to the document, so the document must exist first,
 *     and in the form the competent authority will accept.
 *   - The **sworn translation comes after the apostille**, because the apostille
 *     is itself a certificate bearing text, and the receiving authority expects
 *     it translated along with the document underneath. An applicant who has the
 *     birth certificate translated first pays a sworn translator twice.
 *   - The consular appointment comes after everything, because a post that finds
 *     one missing translation will not hold the file open — it sends the
 *     applicant away and gives the slot to somebody else.
 *
 * That is why {@link checklistToTasks} exists alongside the checklist itself. It
 * emits `Task` records from `@meridian/core` with `dependsOn` wired to that
 * ordering, all of them `locked`, so that `unlockTasks` reveals exactly the work
 * that can actually be started today. Showing an applicant "book your consular
 * appointment" in week one is how a file gets rebooked three times.
 *
 * ## The advice boundary
 *
 * Nothing here recommends anything. A checklist restates what a cited rule
 * requires and routes it through the applicant's own facts — which country
 * issues their birth certificate, what language it is in. That is `assessment`
 * in the sense of `@meridian/core`'s `DisclosureClass`, and
 * {@link checklistDisclosure} classifies it as such. It does not rank pathways,
 * suggest which consulate is quicker, or predict whether the file will succeed.
 * Those are the regulated acts, and they are not this package's job.
 *
 * ## On the pathway type
 *
 * {@link PathwayLike} is a structural type declared here rather than imported
 * from `@meridian/pathways`. That package's catalog is being built in parallel
 * and has no published entry point yet. The shape is deliberately minimal — an
 * id, a target jurisdiction, and requirements — so the catalog's real `Pathway`
 * satisfies it without change once it lands.
 */

import type { Citation, CountryCode, Disclosable, IsoDate, Task } from '@meridian/core';
import { disclosable } from '@meridian/core';
import type { LanguageTag } from './language.js';
import type { AcceptanceWindow } from './freshness.js';
import { acceptanceWindowFor, earliestSafeIssueDate } from './freshness.js';
import type { LegalisationRequirement } from './legalisation.js';
import { legalisationRoute } from './legalisation.js';
import type { DocumentKind } from './model.js';
import type { TranslationRequirement } from './translation.js';
import { translationRequirement } from './translation.js';

/** How the completed file reaches the authority. Determines the shape of the final task. */
export type SubmissionChannel = 'consular_post' | 'in_country_authority' | 'online';

/**
 * One document a pathway requires, and the rule that makes it required.
 *
 * `citation` is mandatory. A checklist line with no source is a demand on
 * somebody's time and money that nobody can check, and the whole point of
 * `@meridian/core`'s `Citation` is that those do not ship.
 */
export interface DocumentRequirement {
  readonly kind: DocumentKind;
  /**
   * Distinguishes two requirements of the same kind. A pathway that wants a
   * police certificate from every country of residence over the last five years
   * produces several `criminal_record` requirements, and they route differently
   * because they are issued by different states.
   */
  readonly slug?: string;
  /** The eligibility criterion this document evidences, in the catalog's own words. */
  readonly criterion: string;
  readonly citation: Citation;
  /** True when the requirement is conditional on facts the catalog cannot evaluate here. */
  readonly optional?: boolean;
  /** Fixed issuing state, where the rule fixes it — an employment offer comes from the employer's state. */
  readonly issuingCountry?: CountryCode;
  /** Fixed document language, where the rule fixes it. */
  readonly language?: LanguageTag;
  readonly note?: string;
  /** Requirement keys (`slug ?? kind`) that must be obtained before this one. */
  readonly dependsOn?: readonly string[];
}

/**
 * The minimum a pathway must expose for a checklist to be assembled from it.
 * See the module note on why this is structural rather than imported.
 */
export interface PathwayLike {
  readonly id: string;
  /** The state the application is made to. Drives legalisation and translation routing. */
  readonly targetJurisdiction: CountryCode;
  readonly documentRequirements: readonly DocumentRequirement[];
  /** ISO 3166-2 code of the sub-national unit whose organ receives the file, where it matters. */
  readonly receivingRegion?: string;
  readonly submissionChannel?: SubmissionChannel;
}

export interface ChecklistFacts {
  readonly matterId: string;
  /** Where documents are issued unless a requirement or an override says otherwise. */
  readonly defaultIssuingCountry: CountryCode;
  /**
   * The language documents are in unless overridden. Explicit because there is
   * no safe inference from the issuing country — see `translation.ts`.
   */
  readonly defaultLanguage: LanguageTag;
  /** Per-requirement issuing state, keyed by requirement key (`slug ?? kind`). */
  readonly issuingCountries?: Readonly<Record<string, CountryCode>>;
  /** Per-requirement document language, keyed by requirement key. */
  readonly documentLanguages?: Readonly<Record<string, LanguageTag>>;
  /**
   * The date the file is expected to be lodged. Supplying it is what makes the
   * freshness projection useful — without it there is no date to project to.
   */
  readonly targetSubmissionDate?: IsoDate;
  /** Overrides the pathway's receiving region for this matter. */
  readonly receivingRegion?: string;
}

export interface ChecklistItem {
  /** Stable within a matter: `${matterId}:doc:${requirementKey}`. */
  readonly id: string;
  readonly requirementKey: string;
  readonly kind: DocumentKind;
  readonly issuingCountry: CountryCode;
  readonly documentLanguage: LanguageTag;
  /** The eligibility criterion that makes this document required. */
  readonly criterion: string;
  readonly optional: boolean;
  readonly legalisation: LegalisationRequirement;
  readonly translation: TranslationRequirement;
  /** The acceptance window that applies, or `null` when the catalog records none. */
  readonly acceptanceWindow: AcceptanceWindow | null;
  /**
   * Earliest date this document can be issued and still be inside its window on
   * the target submission date. Present only when both a window and a target
   * date are known. This is the number that prevents the classic failure of
   * ordering a police certificate five months before the appointment.
   */
  readonly obtainNoEarlierThan?: IsoDate;
  /** Checklist item ids that must be obtained before this one. */
  readonly dependsOn: readonly string[];
  /** Dependency depth. Items with rank 0 can be started immediately. */
  readonly order: number;
  /** Every citation this item rests on, de-duplicated by id. */
  readonly citations: readonly Citation[];
  /** True when any component of the routing needs a human to confirm it. */
  readonly requiresVerification: boolean;
  readonly note?: string;
}

export interface DocumentChecklist {
  readonly matterId: string;
  readonly pathwayId: string;
  readonly receivingCountry: CountryCode;
  readonly receivingRegion?: string;
  readonly submissionChannel: SubmissionChannel;
  readonly asOf: IsoDate;
  readonly targetSubmissionDate?: IsoDate;
  /** Sorted by `order`, then by requirement key, so the output is stable. */
  readonly items: readonly ChecklistItem[];
  /**
   * Authoring problems found while assembling — a duplicated requirement key, a
   * dependency naming a requirement that does not exist. Non-fatal, and
   * surfaced rather than swallowed: a dependency silently dropped is an
   * unlocking order that silently stops matching the law.
   */
  readonly warnings: readonly string[];
}

/**
 * Procedural orderings that hold regardless of jurisdiction.
 *
 * These encode sequence, not law. A contract cannot precede the offer it
 * accepts, and neither a fee receipt nor a biometrics confirmation can exist
 * before there is an application for them to attach to. A pathway that needs a
 * different order states it explicitly on the requirement.
 */
export const STRUCTURAL_DEPENDENCIES: Readonly<Partial<Record<DocumentKind, readonly DocumentKind[]>>> =
  {
    employment_contract: ['employment_offer'],
    payment_receipt: ['application_form'],
    biometrics_confirmation: ['application_form'],
  };

export function requirementKey(requirement: DocumentRequirement): string {
  return requirement.slug ?? requirement.kind;
}

function dedupeCitations(citations: readonly Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of citations) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/**
 * Dependency depth, computed with an explicit visiting set.
 *
 * Back edges are ignored *for ranking only*. The declared `dependsOn` is left
 * exactly as the pathway author wrote it, so a cycle survives into the emitted
 * tasks and `findTaskCycles` from `@meridian/core` reports it truthfully.
 * Quietly repairing the graph here would hide an authoring error behind a
 * checklist that looks fine and deadlocks a matter later.
 */
function computeRanks(edges: ReadonlyMap<string, readonly string[]>): Map<string, number> {
  const ranks = new Map<string, number>();
  const visiting = new Set<string>();

  const rankOf = (key: string): number => {
    const cached = ranks.get(key);
    if (cached !== undefined) return cached;
    if (visiting.has(key)) return 0;
    visiting.add(key);
    let best = 0;
    for (const dep of edges.get(key) ?? []) {
      if (!edges.has(dep)) continue;
      best = Math.max(best, rankOf(dep) + 1);
    }
    visiting.delete(key);
    ranks.set(key, best);
    return best;
  };

  for (const key of edges.keys()) rankOf(key);
  return ranks;
}

/**
 * Assemble the document checklist for one matter under one pathway.
 *
 * `asOf` is threaded into legalisation routing rather than being taken from the
 * clock, because routing rules have commencement dates: Regulation (EU)
 * 2016/1191 applies from 2019-02-16 and Canada acceded to the 1961 Convention
 * on 2024-01-11. A file assembled before either date took a different and
 * lawful route, and re-deriving it against today's rules would misreport work
 * that was correctly done.
 */
export function buildChecklist(
  pathway: PathwayLike,
  facts: ChecklistFacts,
  asOf: IsoDate,
): DocumentChecklist {
  const receiving = pathway.targetJurisdiction.toUpperCase() as CountryCode;
  const region = facts.receivingRegion ?? pathway.receivingRegion;
  const warnings: string[] = [];

  const seenKeys = new Map<string, number>();
  const keyed = pathway.documentRequirements.map((requirement) => {
    const raw = requirementKey(requirement);
    const occurrence = (seenKeys.get(raw) ?? 0) + 1;
    seenKeys.set(raw, occurrence);
    if (occurrence > 1) {
      warnings.push(
        `Pathway ${pathway.id} declares requirement key "${raw}" ${occurrence} times; ` +
          `this occurrence was disambiguated as "${raw}#${occurrence}". Give same-kind requirements distinct slugs — ` +
          `two police certificates from different countries route differently and must not collapse into one line.`,
      );
    }
    return { requirement, key: occurrence === 1 ? raw : `${raw}#${occurrence}` };
  });

  const itemId = (key: string): string => `${facts.matterId}:doc:${key}`;
  const knownKeys = new Set(keyed.map((k) => k.key));
  const keysByKind = new Map<DocumentKind, string[]>();
  for (const { requirement, key } of keyed) {
    const list = keysByKind.get(requirement.kind) ?? [];
    list.push(key);
    keysByKind.set(requirement.kind, list);
  }

  const edges = new Map<string, readonly string[]>();
  for (const { requirement, key } of keyed) {
    const declared: string[] = [];
    for (const dep of requirement.dependsOn ?? []) {
      if (knownKeys.has(dep)) {
        declared.push(dep);
      } else {
        warnings.push(
          `Requirement "${key}" in pathway ${pathway.id} depends on "${dep}", which is not a requirement of this pathway. The dependency was not applied.`,
        );
      }
    }
    for (const kind of STRUCTURAL_DEPENDENCIES[requirement.kind] ?? []) {
      for (const dep of keysByKind.get(kind) ?? []) {
        if (dep !== key && !declared.includes(dep)) declared.push(dep);
      }
    }
    edges.set(key, declared);
  }

  const ranks = computeRanks(edges);

  const items: ChecklistItem[] = keyed.map(({ requirement, key }) => {
    const issuingCountry = (
      requirement.issuingCountry ??
      facts.issuingCountries?.[key] ??
      facts.defaultIssuingCountry
    ).toUpperCase() as CountryCode;
    const documentLanguage =
      requirement.language ?? facts.documentLanguages?.[key] ?? facts.defaultLanguage;

    const legalisation = legalisationRoute({
      documentKind: requirement.kind,
      issuingCountry,
      receivingCountry: receiving,
      asOf,
    });
    const translation = translationRequirement({
      documentKind: requirement.kind,
      documentLanguage,
      receivingCountry: receiving,
      receivingRegion: region,
      issuingCountry,
    });
    const acceptanceWindow = acceptanceWindowFor(requirement.kind, receiving);
    const obtainNoEarlierThan =
      acceptanceWindow !== null && facts.targetSubmissionDate !== undefined
        ? earliestSafeIssueDate(acceptanceWindow, facts.targetSubmissionDate)
        : undefined;

    return {
      id: itemId(key),
      requirementKey: key,
      kind: requirement.kind,
      issuingCountry,
      documentLanguage,
      criterion: requirement.criterion,
      optional: requirement.optional === true,
      legalisation,
      translation,
      acceptanceWindow,
      obtainNoEarlierThan,
      dependsOn: (edges.get(key) ?? []).map(itemId),
      order: ranks.get(key) ?? 0,
      citations: dedupeCitations([
        requirement.citation,
        ...legalisation.citations,
        ...translation.citations,
        ...(acceptanceWindow === null ? [] : [acceptanceWindow.citation]),
      ]),
      requiresVerification: legalisation.requiresVerification || translation.requiresVerification,
      note: requirement.note,
    };
  });

  items.sort((a, b) => a.order - b.order || a.requirementKey.localeCompare(b.requirementKey));

  return {
    matterId: facts.matterId,
    pathwayId: pathway.id,
    receivingCountry: receiving,
    receivingRegion: region,
    submissionChannel: pathway.submissionChannel ?? 'consular_post',
    asOf,
    targetSubmissionDate: facts.targetSubmissionDate,
    items,
    warnings,
  };
}

/**
 * Wrap a checklist in the disclosure envelope.
 *
 * `assessment`, not `information`: the routing has been applied to this
 * applicant's own facts — the states that issue their documents, the language
 * those documents are in — and the output shows the arithmetic. It is still not
 * `advice`, because it recommends nothing and predicts nothing.
 */
export function checklistDisclosure(checklist: DocumentChecklist): Disclosable<DocumentChecklist> {
  const ids = dedupeCitations(checklist.items.flatMap((i) => i.citations)).map((c) => c.id);
  return disclosable('assessment', checklist, ids);
}

const SUBMISSION_TITLES: Readonly<Record<SubmissionChannel, string>> = {
  consular_post: 'Attend the consular appointment with the complete file',
  in_country_authority: 'Lodge the complete file with the receiving authority',
  online: "Submit the complete file through the authority's online portal",
};

/**
 * Emit `Task` records for a checklist, wired for sequential unlocking.
 *
 * Every task is emitted `locked`. Promotion is `unlockTasks`'s job in
 * `@meridian/core`, which honours both these dependencies and the matter's
 * phase — emitting anything `available` here would bypass the phase gate and
 * show a submission task to a matter still in intake.
 *
 * The chain per document is obtain → legalise → translate, and the reason
 * translation sits last is money: the apostille is a certificate in the issuing
 * state's language that the receiving authority expects translated with the
 * document it is attached to. Translate first and the sworn translator is paid
 * twice.
 *
 * Where the legalisation route is `'unknown'`, the intermediate task is
 * assigned to the `representative` rather than the applicant and is a
 * verification, not an errand. Sending an applicant to a ministry with no
 * confirmed route is how a day and a fee are spent on the wrong counter.
 */
export function checklistToTasks(checklist: DocumentChecklist): Task[] {
  const tasks: Task[] = [];
  /** Last task in each item's chain — what the submission task must wait on. */
  const terminalByItem = new Map<string, string>();

  for (const item of checklist.items) {
    const prefix = item.optional ? '(if applicable) ' : '';
    const obtainId = `${item.id}:obtain`;
    const citationIds = item.citations.map((c) => c.id);

    tasks.push({
      id: obtainId,
      matterId: checklist.matterId,
      phase: 'document_assembly',
      title: `${prefix}Obtain the ${item.kind.replace(/_/g, ' ')} issued by ${item.issuingCountry}`,
      assignee: 'applicant',
      dependsOn: item.dependsOn.map((dep) => `${dep}:obtain`),
      status: 'locked',
      citationIds,
    });

    let previous = obtainId;

    if (item.legalisation.route !== 'none') {
      const legaliseId = `${item.id}:legalise`;
      const unknownRoute = item.legalisation.route === 'unknown';
      tasks.push({
        id: legaliseId,
        matterId: checklist.matterId,
        phase: 'document_assembly',
        title: unknownRoute
          ? `${prefix}Confirm the legalisation route for the ${item.kind.replace(/_/g, ' ')} between ${item.issuingCountry} and ${checklist.receivingCountry}`
          : `${prefix}${item.legalisation.route === 'apostille' ? 'Apostille' : 'Legalise through the consular chain'} the ${item.kind.replace(/_/g, ' ')} issued by ${item.issuingCountry}`,
        assignee: unknownRoute ? 'representative' : 'applicant',
        dependsOn: [obtainId],
        status: 'locked',
        citationIds: item.legalisation.citations.map((c) => c.id),
      });
      previous = legaliseId;
    }

    if (item.translation.required) {
      const translateId = `${item.id}:translate`;
      tasks.push({
        id: translateId,
        matterId: checklist.matterId,
        phase: 'document_assembly',
        title: `${prefix}Have the ${item.kind.replace(/_/g, ' ')} translated to the ${item.translation.acceptedStandards.join(' or ')} standard`,
        assignee: 'applicant',
        dependsOn: [previous],
        status: 'locked',
        citationIds: item.translation.citations.map((c) => c.id),
      });
      previous = translateId;
    }

    terminalByItem.set(item.id, previous);
  }

  const submissionId = `${checklist.matterId}:file:submission`;
  const allCitationIds = dedupeCitations(checklist.items.flatMap((i) => i.citations)).map(
    (c) => c.id,
  );
  const submission: Task = {
    id: submissionId,
    matterId: checklist.matterId,
    phase: 'submission',
    title: SUBMISSION_TITLES[checklist.submissionChannel],
    assignee: 'applicant',
    dependsOn: [...terminalByItem.values()],
    status: 'locked',
    citationIds: allCitationIds,
  };
  tasks.push(
    checklist.targetSubmissionDate === undefined
      ? submission
      : { ...submission, dueOn: checklist.targetSubmissionDate },
  );

  return tasks;
}
