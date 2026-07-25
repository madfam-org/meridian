import { describe, expect, it } from 'vitest';
import {
  findTaskCycles,
  isoDate,
  unlockTasks,
  type Citation,
  type CountryCode,
  type IsoDate,
  type Task,
} from '@meridian/core';
import {
  buildChecklist,
  checklistDisclosure,
  checklistToTasks,
  requirementKey,
  type ChecklistFacts,
  type DocumentRequirement,
  type PathwayLike,
} from '../src/checklist.js';
import { CASTILIAN, ENGLISH, languageTag } from '../src/language.js';

const d = (s: string): IsoDate => isoDate(s);
const c = (s: string): CountryCode => s as CountryCode;
const TODAY = d('2026-07-25');

const cite = (id: string): Citation => ({
  id,
  kind: 'statute',
  instrument: 'Código Civil (España)',
  provision: 'art. 22',
  jurisdiction: 'ES',
  verifiedOn: TODAY,
});

const req = (over: Partial<DocumentRequirement> & Pick<DocumentRequirement, 'kind'>): DocumentRequirement => ({
  criterion: 'Identity and civil status must be evidenced.',
  citation: cite(`es-cc-art-22-${over.slug ?? over.kind}`),
  ...over,
});

const pathway = (requirements: readonly DocumentRequirement[], over: Partial<PathwayLike> = {}): PathwayLike => ({
  id: 'es-nacionalidad-residencia',
  targetJurisdiction: c('ES'),
  documentRequirements: requirements,
  ...over,
});

const facts = (over: Partial<ChecklistFacts> = {}): ChecklistFacts => ({
  matterId: 'matter-1',
  defaultIssuingCountry: c('MX'),
  defaultLanguage: CASTILIAN,
  ...over,
});

const byId = (tasks: readonly Task[], id: string): Task => {
  const t = tasks.find((x) => x.id === id);
  if (t === undefined) throw new Error(`no task ${id}; have ${tasks.map((x) => x.id).join(', ')}`);
  return t;
};

describe('checklist assembly', () => {
  it('routes each requirement and records why it is required', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'birth_certificate' }), req({ kind: 'criminal_record' })]),
      facts({ targetSubmissionDate: d('2026-10-01') }),
      TODAY,
    );
    expect(list.items).toHaveLength(2);
    const birth = list.items.find((i) => i.kind === 'birth_certificate');
    expect(birth?.legalisation.route).toBe('apostille');
    expect(birth?.translation.required).toBe(false);
    expect(birth?.criterion).toContain('civil status');
    expect(birth?.citations.map((x) => x.id)).toContain('es-cc-art-22-birth_certificate');

    const criminal = list.items.find((i) => i.kind === 'criminal_record');
    expect(criminal?.acceptanceWindow?.amount).toBe(3);
    expect(criminal?.obtainNoEarlierThan).toBe('2026-07-02');
    expect(list.warnings).toEqual([]);
  });

  it('omits obtainNoEarlierThan when there is no target submission date to work back from', () => {
    const list = buildChecklist(pathway([req({ kind: 'criminal_record' })]), facts(), TODAY);
    expect(list.items[0]?.obtainNoEarlierThan).toBeUndefined();
    expect(list.targetSubmissionDate).toBeUndefined();
  });

  it('assembles a Spanish file requiring a traductor jurado for a Canadian police certificate', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'criminal_record', slug: 'criminal_record_ca' })]),
      facts({
        issuingCountries: { criminal_record_ca: c('CA') },
        documentLanguages: { criminal_record_ca: ENGLISH },
      }),
      TODAY,
    );
    const item = list.items[0];
    expect(item?.issuingCountry).toBe('CA');
    expect(item?.legalisation.route).toBe('apostille');
    expect(item?.translation.required).toBe(true);
    expect(item?.translation.acceptedStandards).toEqual(['sworn_traductor_jurado']);
    expect(item?.requiresVerification).toBe(true);

    const tasks = checklistToTasks(list);
    const translate = byId(tasks, `${item!.id}:translate`);
    expect(translate.title).toContain('sworn_traductor_jurado');
    expect(translate.dependsOn).toEqual([`${item!.id}:legalise`]);
  });

  it('lets a requirement fix its own issuing state and language', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'employment_offer', issuingCountry: c('CA'), language: ENGLISH })]),
      facts(),
      TODAY,
    );
    expect(list.items[0]?.issuingCountry).toBe('CA');
    expect(list.items[0]?.documentLanguage).toBe('en');
  });

  it('honours per-requirement overrides over the matter default', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'criminal_record' }), req({ kind: 'birth_certificate' })]),
      facts({
        issuingCountries: { criminal_record: c('CA') },
        documentLanguages: { criminal_record: ENGLISH },
      }),
      TODAY,
    );
    expect(list.items.find((i) => i.kind === 'criminal_record')?.issuingCountry).toBe('CA');
    expect(list.items.find((i) => i.kind === 'birth_certificate')?.issuingCountry).toBe('MX');
  });

  it('keeps two same-kind requirements apart so they route independently', () => {
    const list = buildChecklist(
      pathway([
        req({ kind: 'criminal_record', slug: 'pcc_mx' }),
        req({ kind: 'criminal_record', slug: 'pcc_ca' }),
      ]),
      facts({ issuingCountries: { pcc_ca: c('CA') } }),
      TODAY,
    );
    expect(list.items.map((i) => i.issuingCountry).sort()).toEqual(['CA', 'MX']);
    expect(new Set(list.items.map((i) => i.id)).size).toBe(2);
  });

  it('warns and disambiguates rather than collapsing duplicate requirement keys', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'criminal_record' }), req({ kind: 'criminal_record' })]),
      facts(),
      TODAY,
    );
    expect(list.items).toHaveLength(2);
    expect(list.items.map((i) => i.requirementKey).sort()).toEqual([
      'criminal_record',
      'criminal_record#2',
    ]);
    expect(list.warnings[0]).toContain('criminal_record');
  });

  it('warns about a dependency naming a requirement the pathway does not have', () => {
    const list = buildChecklist(
      pathway([req({ kind: 'criminal_record', dependsOn: ['passport'] })]),
      facts(),
      TODAY,
    );
    expect(list.items[0]?.dependsOn).toEqual([]);
    expect(list.warnings[0]).toContain('passport');
  });

  it('derives the requirement key from the slug when there is one', () => {
    expect(requirementKey({ kind: 'criminal_record', criterion: '', citation: cite('x') })).toBe(
      'criminal_record',
    );
    expect(
      requirementKey({ kind: 'criminal_record', slug: 'pcc_ca', criterion: '', citation: cite('x') }),
    ).toBe('pcc_ca');
  });

  it('handles an empty pathway without inventing work', () => {
    const list = buildChecklist(pathway([]), facts(), TODAY);
    expect(list.items).toEqual([]);
    expect(list.warnings).toEqual([]);
    const tasks = checklistToTasks(list);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.phase).toBe('submission');
    expect(tasks[0]?.dependsOn).toEqual([]);
  });
});

describe('dependency ordering', () => {
  const ordered = () =>
    buildChecklist(
      pathway([
        req({ kind: 'biometrics_confirmation' }),
        req({ kind: 'payment_receipt' }),
        req({ kind: 'application_form' }),
        req({ kind: 'employment_contract' }),
        req({ kind: 'employment_offer' }),
      ]),
      facts(),
      TODAY,
    );

  it('places structurally dependent documents after what they depend on', () => {
    const list = ordered();
    const rank = new Map(list.items.map((i) => [i.kind, i.order]));
    expect(rank.get('application_form')).toBe(0);
    expect(rank.get('employment_offer')).toBe(0);
    expect(rank.get('payment_receipt')).toBe(1);
    expect(rank.get('biometrics_confirmation')).toBe(1);
    expect(rank.get('employment_contract')).toBe(1);
  });

  it('sorts items by rank and then stably by key', () => {
    const list = ordered();
    const orders = list.items.map((i) => i.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it('produces the same checklist whichever order the requirements arrive in', () => {
    const forward = ordered();
    const reversed = buildChecklist(
      pathway([...ordered().items].map((i) => req({ kind: i.kind })).reverse()),
      facts(),
      TODAY,
    );
    expect(reversed.items.map((i) => i.requirementKey)).toEqual(
      forward.items.map((i) => i.requirementKey),
    );
  });

  it('respects an explicit dependency declared by the pathway', () => {
    const list = buildChecklist(
      pathway([
        req({ kind: 'professional_licence', dependsOn: ['degree_certificate'] }),
        req({ kind: 'degree_certificate' }),
      ]),
      facts(),
      TODAY,
    );
    const licence = list.items.find((i) => i.kind === 'professional_licence');
    const degree = list.items.find((i) => i.kind === 'degree_certificate');
    expect(licence?.dependsOn).toEqual([degree!.id]);
    expect(licence?.order).toBe(1);
  });

  it('does not hang, and does not hide the problem, when a pathway declares a cycle', () => {
    const list = buildChecklist(
      pathway([
        req({ kind: 'degree_certificate', dependsOn: ['academic_transcript'] }),
        req({ kind: 'academic_transcript', dependsOn: ['degree_certificate'] }),
      ]),
      facts(),
      TODAY,
    );
    expect(list.items).toHaveLength(2);
    const cycles = findTaskCycles(checklistToTasks(list));
    expect(cycles.length).toBeGreaterThan(0);
  });
});

describe('task generation', () => {
  const list = buildChecklist(
    pathway([
      req({ kind: 'birth_certificate' }),
      req({ kind: 'criminal_record', slug: 'pcc_ca' }),
      req({ kind: 'passport' }),
      req({ kind: 'application_form' }),
      req({ kind: 'payment_receipt' }),
    ]),
    facts({
      issuingCountries: { pcc_ca: c('CA') },
      documentLanguages: { pcc_ca: ENGLISH },
      targetSubmissionDate: d('2026-11-02'),
    }),
    TODAY,
  );
  const tasks = checklistToTasks(list);

  it('has no dependency cycles', () => {
    expect(findTaskCycles(tasks)).toEqual([]);
  });

  it('references only tasks it also emits', () => {
    const ids = new Set(tasks.map((t) => t.id));
    for (const t of tasks) {
      for (const dep of t.dependsOn) expect(ids.has(dep)).toBe(true);
    }
  });

  it('emits unique task ids', () => {
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length);
  });

  it('chains obtain -> apostille -> sworn translation for a foreign-language document', () => {
    const item = list.items.find((i) => i.requirementKey === 'pcc_ca')!;
    expect(byId(tasks, `${item.id}:obtain`).dependsOn).toEqual([]);
    expect(byId(tasks, `${item.id}:legalise`).dependsOn).toEqual([`${item.id}:obtain`]);
    expect(byId(tasks, `${item.id}:translate`).dependsOn).toEqual([`${item.id}:legalise`]);
  });

  it('emits no legalisation or translation task where neither is required', () => {
    const passport = list.items.find((i) => i.kind === 'passport')!;
    expect(tasks.some((t) => t.id === `${passport.id}:legalise`)).toBe(false);
    expect(tasks.some((t) => t.id === `${passport.id}:translate`)).toBe(false);
  });

  it('waits for the whole file before the consular appointment', () => {
    const submission = byId(tasks, 'matter-1:file:submission');
    expect(submission.phase).toBe('submission');
    expect(submission.title).toContain('consular appointment');
    expect(submission.dueOn).toBe('2026-11-02');
    const pcc = list.items.find((i) => i.requirementKey === 'pcc_ca')!;
    expect(submission.dependsOn).toContain(`${pcc.id}:translate`);
    const birth = list.items.find((i) => i.kind === 'birth_certificate')!;
    expect(submission.dependsOn).toContain(`${birth.id}:legalise`);
    expect(submission.dependsOn).toHaveLength(list.items.length);
  });

  it('emits every task locked so that unlockTasks owns promotion', () => {
    expect(tasks.every((t) => t.status === 'locked')).toBe(true);
  });

  it('unlocks only the work that can actually start today', () => {
    const unlocked = unlockTasks(tasks, 'document_assembly').filter(
      (t) => t.status === 'available',
    );
    const ids = unlocked.map((t) => t.id);
    expect(ids.every((id) => id.endsWith(':obtain'))).toBe(true);
    const paymentItem = list.items.find((i) => i.kind === 'payment_receipt')!;
    expect(ids).not.toContain(`${paymentItem.id}:obtain`);
    expect(ids).not.toContain('matter-1:file:submission');
  });

  it('keeps the submission task locked while the matter is still assembling documents', () => {
    const unlocked = unlockTasks(tasks, 'document_assembly');
    expect(byId(unlocked, 'matter-1:file:submission').status).toBe('locked');
  });

  it('assigns an unresolved legalisation route to the representative, not the applicant', () => {
    const unknownRoute = buildChecklist(
      pathway([req({ kind: 'birth_certificate' })]),
      facts({ defaultIssuingCountry: c('JP'), defaultLanguage: languageTag('ja') }),
      TODAY,
    );
    const item = unknownRoute.items[0]!;
    expect(item.legalisation.route).toBe('unknown');
    const legalise = byId(checklistToTasks(unknownRoute), `${item.id}:legalise`);
    expect(legalise.assignee).toBe('representative');
    expect(legalise.title).toContain('Confirm the legalisation route');
  });

  it('marks optional requirements in the task title', () => {
    const optional = buildChecklist(
      pathway([req({ kind: 'marriage_certificate', optional: true })]),
      facts(),
      TODAY,
    );
    const item = optional.items[0]!;
    expect(item.optional).toBe(true);
    expect(byId(checklistToTasks(optional), `${item.id}:obtain`).title).toContain('(if applicable)');
  });

  it('omits a due date when no submission date is known rather than inventing one', () => {
    const undated = buildChecklist(pathway([req({ kind: 'passport' })]), facts(), TODAY);
    expect(byId(checklistToTasks(undated), 'matter-1:file:submission').dueOn).toBeUndefined();
  });

  it('titles the terminal task by submission channel', () => {
    const online = buildChecklist(
      pathway([], { submissionChannel: 'online' }),
      facts(),
      TODAY,
    );
    expect(checklistToTasks(online)[0]?.title).toContain('online portal');
  });
});

describe('the advice boundary', () => {
  it('classifies a checklist as assessment, never as advice', () => {
    const list = buildChecklist(pathway([req({ kind: 'birth_certificate' })]), facts(), TODAY);
    const envelope = checklistDisclosure(list);
    expect(envelope.classification).toBe('assessment');
    expect(envelope.citationIds.length).toBeGreaterThan(0);
    expect(new Set(envelope.citationIds).size).toBe(envelope.citationIds.length);
  });

  it('carries a citation on every checklist item', () => {
    const list = buildChecklist(
      pathway([
        req({ kind: 'birth_certificate' }),
        req({ kind: 'criminal_record' }),
        req({ kind: 'passport' }),
      ]),
      facts(),
      TODAY,
    );
    for (const item of list.items) {
      expect(item.citations.length).toBeGreaterThan(0);
      for (const citation of item.citations) {
        expect(citation.id.trim().length).toBeGreaterThan(0);
        expect(citation.instrument.trim().length).toBeGreaterThan(0);
        expect(citation.jurisdiction.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('routing is evaluated as at the date given, not as at today', () => {
  it('reproduces the route that applied when the file was assembled', () => {
    const p = pathway([req({ kind: 'birth_certificate' })]);
    const f = facts({ defaultIssuingCountry: c('FR'), defaultLanguage: languageTag('fr') });
    expect(buildChecklist(p, f, d('2026-07-25')).items[0]?.legalisation.route).toBe('none');
    expect(buildChecklist(p, f, d('2018-06-01')).items[0]?.legalisation.route).toBe('unknown');
  });
});
