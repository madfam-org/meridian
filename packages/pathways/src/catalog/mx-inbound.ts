/**
 * Mexico, as a destination.
 *
 * Mexico appeared in this catalog only as an *origin* — a nationality on the
 * Spanish art. 22.1 list, a CUSMA party, the other end of the largest migration
 * corridor in the world. Its own inbound system was absent. This file is that
 * system: the nine *condiciones de estancia* of art. 52 of the Ley de Migración,
 * the seven doors to *residente permanente* in art. 54, the *regularización*
 * chapter of arts. 132-136, and naturalisation under the Ley de Nacionalidad.
 *
 * Everything here is written from the research brief at
 * `docs/research/2026-07-26-mexico-inbound-frame.md`, and every statutory and
 * regulatory proposition below was additionally read against the Cámara de
 * Diputados consolidated text and the DOF instruments themselves on 2026-07-26.
 * That is what `verifiedOn: '2026-07-26'` claims and all it claims.
 *
 * Every record ships `reviewStatus: 'unreviewed'`. No licensed person has read
 * any of it, which is why none of it can enter an advice-class recommendation.
 *
 * ## Five things to know before editing anything here
 *
 * **1. Art. 53 is the rule applicants least expect.** A *visitante* — except on
 * humanitarian grounds, or with a family link to a Mexican or to a foreigner
 * with regular residence — **may not change condición de estancia** and must
 * leave when the authorised period ends. "Arrive as a tourist, convert to
 * resident" is barred by statute, not by practice. It is a `blocking` criterion
 * on the residence routes a visitor might otherwise think they qualify for, and
 * it is deliberately *absent* from the family and regularisation routes, because
 * those are exactly the exceptions the article carves out.
 *
 * **2. No peso figure appears in this file, and none may be added.** Every
 * economic threshold in Mexican migration law is a multiple of a published
 * index — *días de UMA* in the 2025 consular instrument, *días de salario mínimo
 * general vigente en el Distrito Federal* in the 2012 INM instrument, which the
 * 2016 de-indexation reform converts to UMA by operation of a transitional
 * article. INEGI republishes the UMA every January and the new value takes
 * effect on 1 February, so any peso amount encoded here would be wrong within a
 * year. {@link import('../facts.js').ReferenceIndices} carries IPREM and SMI for
 * Spain and has no UMA field, and the Spanish fields are *annual* where the
 * Mexican thresholds are *daily* — reusing one for the other would silently
 * compare a euro-shaped ratio to a peso-shaped one. So every solvency criterion
 * here carries `requiresHumanReview` and states the multiple, the look-back and
 * the index in its `humanReviewReason`. That is the honest failure mode: the
 * rule is shown with its pin-cite and nobody is told a number.
 *
 * **3. The consular threshold and the INM threshold are different numbers for
 * the same-sounding test.** Residente temporal solvency is **11,460 días UMA** of
 * average monthly balance at a Mexican consulate and **20,000 días** at an INM
 * counter; the pensioner figures are 45,850 / 1,140 consular against 25,000 / 500
 * at INM. Two instruments thirteen years apart, neither repealing nor deferring
 * to the other, applying to two different application channels. **The threshold
 * attaches to the channel, not to the status**, which is why
 * `mx-residente-temporal-consular` and `mx-regularizacion-solvencia` are separate
 * records rather than one record with one solvency criterion.
 *
 * **4. Where a fact does not exist, the criterion escalates rather than
 * guessing.** Several rules turn on facts
 * {@link import('../facts.js').ApplicantFacts} does not model — most importantly
 * *the nationality-acquisition mode of a relative*. Arts. 54.VI and 54.VII, and
 * Ley de Nacionalidad art. 20.I(a) and (b), all turn on somebody else being
 * Mexican **por nacimiento**; `claimedNationalityAcquisition` describes the
 * applicant, and there is no field for "my child is Mexican, and Mexican by
 * birth". Those criteria carry `requiresHumanReview` and, where no fact bears on
 * them at all, their evaluator is {@link NO_ENCODABLE_FACT} — a deliberate
 * placeholder that decides nothing, because an escalated criterion never returns
 * `met` or `unmet`. The same pattern, and the same reasoning, as
 * `catalog/es-arraigo.ts`. The full list of missing facts is in §9.2 of the
 * research brief.
 *
 * **5. The Reglamento has not been amended since 2014-05-23 and the statute has
 * moved repeatedly since.** Always check the statute last. The live example is
 * *visitante regional*: art. 52.III says **seven days** (reformed DOF 2017-05-19)
 * while Reglamento art. 154 and Lineamientos 2012 art. 27 still say three. Seven
 * is encoded, the statute is cited, and the unrepealed regulation is recorded in
 * the criterion note so a reviewing lawyer sees the conflict instead of
 * rediscovering it.
 *
 * ## Out of scope, and not by omission
 *
 * **Recognition of refugee status, complementary protection, political asylum
 * and statelessness determination are not encoded and must never be.** They are
 * individualised risk assessments in which a wrong answer can return somebody to
 * danger; they are decided by a specialist body on evidence a form cannot
 * capture; and Ley sobre Refugiados art. 18 attaches a **30-working-day** filing
 * deadline running from the day after entry, which a person who trusted a
 * self-serve tool could miss irrecoverably. The competent body is the **Comisión
 * Mexicana de Ayuda a Refugiados (COMAR)**, <https://www.gob.mx/comar>, for
 * refugee status and complementary protection, and the Secretaría de Relaciones
 * Exteriores for political asylum.
 *
 * What this file does encode is the *migration consequence* of those procedures
 * and nothing else: that an applicant is entitled to *visitante por razones
 * humanitarias* while the procedure runs (Ley de Migración art. 52.V(c)), that a
 * positive decision leads to *residente permanente* (art. 54.I), and that a
 * pending claim is a vulnerability ground for regularisation (Reglamento
 * art. 144.IV(e)). Each of those criteria escalates to a person and points at
 * COMAR. Nothing here assesses whether a fear is well-founded, ranks protection
 * against a migration route, or states a likelihood of recognition.
 *
 * ## Deliberately not encoded
 *
 * - **A list of nationalities that require a Mexican visa.** Art. 40 defers it
 *   to visa-suppression agreements and unilateral decisions; the list is
 *   administrative and changes without amending any instrument. The *mechanism*
 *   is recorded, and so is the art. 26 facilitation, which is in a dated
 *   instrument.
 * - **The naturalisation examination mechanics.** Two inconsistent official
 *   statements of the pass rules were found. Only the existence of the
 *   examination (Reglamento de la Ley de Nacionalidad art. 15) is encoded — no
 *   question counts, no pass marks, no timings.
 * - **Which countries count as *un país latinoamericano* or *la Península
 *   Ibérica*** for Ley de Nacionalidad art. 20.I(c). No instrument read
 *   enumerates them, and the list is visibly *not* the same as Spain's
 *   *iberoamericano* list, so the criterion escalates rather than guessing.
 * - **Any temporary regularisation programme.** Reglamento art. 143 lets SEGOB
 *   publish one at any time; the 2015 and 2016 programmes are expired by their
 *   own transitional articles and no successor was found. Only the permanent
 *   statutory routes are here. Re-check the DOF at every review.
 * - **Processing times.** Both Lineamientos state statutory *maximum* decision
 *   periods. Those are legal ceilings, not service standards, so
 *   `publishedProcessingDays` stays unset everywhere in this file and the
 *   statutory maximum appears in a `durations.note` labelled as a deadline.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import type { Pathway } from '../schema.js';

const MX: CountryCode = countryCode('MX');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-26');

// ---------------------------------------------------------------------------
// Sources
//
// Statutes and reglamentos come from the Cámara de Diputados *texto vigente*
// PDFs. DOF instruments come from `sidof.segob.gob.mx`, which is the DOF's own
// system and serves full text; the `dof.gob.mx` front end has a certificate
// chain that could not be verified from this environment.
//
// Mexican administrative instruments are amended by free-standing *acuerdos*
// with no consolidated official text, so a URL names a snapshot. Where the
// current wording of an article comes from an amending acuerdo, that acuerdo is
// the URL and the `provision` says so.
// ---------------------------------------------------------------------------

const CPEUM_URL = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf';
const LMIGRA_URL = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LMigra.pdf';
const REG_LMIGRA_URL = 'https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LMigra.pdf';
const LNAC_URL = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/53.pdf';
const REG_LNAC_URL = 'https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LNac.pdf';
const LRPCAP_URL = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LRPCAP.pdf';
const LDVUMA_URL = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LDVUMA_301216.pdf';
const VISAS_2025_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5763837';
const VISAS_2026_ACUERDO_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5787660';
const TRAMITES_2012_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5276967';
const TRAMITES_2016_ACUERDO_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5455318';
const TRAMITES_2019_ACUERDO_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5558294';
const UMA_2026_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5778072';
const COMAR_URL = 'https://www.gob.mx/comar';

const LMIGRA = 'Ley de Migración (México)';
const REG_LMIGRA = 'Reglamento de la Ley de Migración';
const CPEUM = 'Constitución Política de los Estados Unidos Mexicanos';
const LNAC = 'Ley de Nacionalidad';
const REG_LNAC = 'Reglamento de la Ley de Nacionalidad';
const VISAS_2025 =
  'Lineamientos Generales para la expedición de visas que emiten las secretarías de Gobernación y de Relaciones Exteriores';
const TRAMITES_2012 = 'Lineamientos para trámites y procedimientos migratorios';

/**
 * The evaluator for a criterion whose governing fact does not exist in
 * {@link import('../facts.js').ApplicantFacts}.
 *
 * `criterionSchema` requires an evaluator, and there is no honest one to write
 * for "my daughter is Mexican by birth" or "the marriage was celebrated at least
 * two years before the application". Every criterion using this placeholder also
 * carries `requiresHumanReview`, and an escalated criterion never returns `met`
 * or `unmet` — {@link import('../evaluate.js').evaluate} discards the spec's
 * truth value and reports `requires_human_review` with the criterion's
 * `humanReviewReason`. So the placeholder decides nothing. It is
 * `targetJurisdiction === 'MX'`, which is true of every applicant a record in
 * this file could concern, precisely so that it can never be mistaken for a test
 * that discriminates between applicants.
 *
 * What the reader gets instead of a verdict is the rule, its pin-cite, and a
 * statement of exactly which fact somebody has to go and establish. That is more
 * than a silent `unknown` would give them, and it is the same pattern
 * `catalog/es-arraigo.ts` uses for the same reason.
 */
const NO_ENCODABLE_FACT = { op: 'equals', path: 'targetJurisdiction', value: 'MX' } as const;

// ---------------------------------------------------------------------------
// Constitución
// ---------------------------------------------------------------------------

const cpeumArt30 = {
  id: 'mx-cpeum-art-30',
  kind: 'statute' as const,
  instrument: CPEUM,
  provision: 'art. 30',
  url: CPEUM_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Apartado A: Mexicans by birth are those born in the territory whatever their parents nationality; ' +
    'those born abroad to a Mexican father or mother; those born abroad to a parent who is Mexican by ' +
    'naturalisation; and those born aboard Mexican vessels or aircraft. Unrestricted ius soli in fraction I ' +
    'and ius sanguinis in II and III with no generational limit in the constitutional text. Fraction III is ' +
    'the one people miss: a child born abroad to a naturalised Mexican is Mexican by birth. Texto vigente, ' +
    'últimas reformas DOF 2026-06-02.',
};

const cpeumArt37 = {
  id: 'mx-cpeum-art-37',
  kind: 'statute' as const,
  instrument: CPEUM,
  provision: 'art. 37',
  url: CPEUM_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The asymmetry that governs dual nationality. Apartado A: no Mexican BY BIRTH may be deprived of ' +
    'Mexican nationality, without exception. Apartado B fraction I: Mexican nationality BY NATURALISATION ' +
    'is lost on voluntarily acquiring a foreign nationality, on holding oneself out as a foreigner in a ' +
    'public instrument, on using a foreign passport, or on accepting titles of nobility implying submission ' +
    'to a foreign state; fraction II adds five continuous years of residence abroad. Ley de Nacionalidad ' +
    'arts. 27 and 32 make the loss subject to a hearing, and art. 28 obliges authorities and fedatarios ' +
    'públicos to report such cases to the SRE within 40 working days, so it is not theoretical. Texto ' +
    'vigente, últimas reformas DOF 2026-06-02.',
};

const cpeumArt26b = {
  id: 'mx-cpeum-art-26b-uma',
  kind: 'statute' as const,
  instrument: CPEUM,
  provision: 'art. 26, apartado B',
  url: CPEUM_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Paragraphs added DOF 2016-01-27. INEGI calculates the value of the Unidad de Medida y Actualización, ' +
    'which is the unit of account, index, base, measure or reference for determining the amount of ' +
    'obligations under federal law; an obligation denominated in UMA is settled by multiplying the number ' +
    'of units by the value of the unit at the relevant date. Transitional art. Tercero of the same decree: ' +
    'every reference to the salario mínimo as a unit of account is to be read as a reference to the UMA. ' +
    'That transitional article is what converts the figures in the 2012 INM Lineamientos, which still print ' +
    'the old unit.',
};

// ---------------------------------------------------------------------------
// Ley de Migración
// ---------------------------------------------------------------------------

const lmigraArt40 = {
  id: 'mx-lmigra-art-40',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 40',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The visa types, and two propositions that govern every route in this file. Penultimate paragraph: ' +
    '"Ninguna de las visas otorga el permiso para trabajar a cambio de una remuneración, a menos que sea ' +
    'explícitamente referido en dicho documento." Final paragraph: a visa accredits the requirements for a ' +
    'condición de estancia and authorises the holder to present themselves at a place of international ' +
    'transit and request admission in that condition — it does not admit them. The officer at the port of ' +
    'entry decides. Texto vigente, última reforma DOF 2026-01-15.',
};

const lmigraArt41 = {
  id: 'mx-lmigra-art-41',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 41',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Visas are issued by Mexican consular offices abroad. Second paragraph: in family-unity, job-offer and ' +
    'humanitarian cases the Instituto Nacional de Migración AUTHORISES the visa and the consular office ' +
    'merely issues it, which is why those routes are filed in Mexico and collected abroad. A Mexican route ' +
    'is therefore at minimum a two-agency sequence, and the two steps appear here as separate procedural ' +
    'criteria on the same pathway.',
};

const lmigraArt43 = {
  id: 'mx-lmigra-art-43',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 43',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'AN OPEN-ENDED OFFICER JUDGEMENT WITH NO THRESHOLD. The migration authorities may refuse a visa, ' +
    'regular admission, or continued stay where: the persons record in Mexico or abroad compromises ' +
    'national or public security (I); they do not meet the requirements of the Ley, its Reglamento or ' +
    'other applicable provisions (II); the documents or elements supplied are verified as inauthentic ' +
    '(III); they are subject to an express prohibition by a competent authority (IV); or other legal ' +
    'provisions so provide (V). Art. 134 makes the whole overstay-regularisation route expressly subject ' +
    'to this article. Nothing software can decide, and a green tick next to it would be the most damaging ' +
    'output this catalog could produce.',
};

const lmigraArt52 = {
  id: 'mx-lmigra-art-52',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 52',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The closed list of nine condiciones de estancia, of which only three are residence: I visitante sin ' +
    'permiso para realizar actividades remuneradas, up to 180 uninterrupted days from entry; II visitante ' +
    'con permiso para realizar actividades remuneradas, also up to 180 days; III visitante regional, stay ' +
    'not exceeding seven days (paragraph reformed DOF 2017-05-19); IV visitante trabajador fronterizo, up ' +
    'to one year in the states the Secretaría determines; V visitante por razones humanitarias; VI ' +
    'visitante con fines de adopción; VII residente temporal, up to four years; VIII residente temporal ' +
    'estudiante, for the duration of the studies; IX residente permanente, indefinite, with permission to ' +
    'work. Texto vigente, última reforma DOF 2026-01-15, which amended arts. 2, 20, 30, 67, 70, 71, 73, 75, ' +
    '108, 110, 113 and 120 and did not touch arts. 40-61 or 132-136.',
};

const lmigraArt53 = {
  id: 'mx-lmigra-art-53',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 53',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'In full: "Los visitantes, con excepción de aquéllos por razones humanitarias y de quienes tengan ' +
    'vínculo con mexicano o con extranjero con residencia regular en México, no podrán cambiar de ' +
    'condición de estancia y tendrán que salir del país al concluir el período de permanencia autorizado." ' +
    'Arriving as a visitor and switching to residence is barred by statute. Reglamento art. 141 sets out ' +
    'the changes of condition that ARE permitted, and it is a closed list.',
};

const lmigraArt54 = {
  id: 'mx-lmigra-art-54',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 54',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Seven grounds for residente permanente: I asylum, refugee recognition, complementary protection or a ' +
    'statelessness determination; II family unity under art. 55; III being retired or pensioned with ' +
    'income from a foreign government, an international organisation or private undertakings for services ' +
    'rendered abroad, sufficient to live in the country; IV a decision of the Instituto under the sistema ' +
    'de puntos of art. 57; V four years having elapsed since the person held a permiso de residencia ' +
    'temporal; VI having children of Mexican nationality by birth; VII being an ascendant or descendant in ' +
    'the direct line up to the second degree of a Mexican by birth. Only fraction V requires any prior ' +
    'residence. The closing paragraph reads narrower than art. 52.IX on the right to work; Reglamento ' +
    'art. 157 settles it operationally in favour of the unrestricted reading for adults.',
};

const lmigraArt55 = {
  id: 'mx-lmigra-art-55',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 55',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'A residente permanente may bring, or later apply for, their father or mother (I); their spouse (II) ' +
    'and their concubinario, concubina or equivalent (III), each of whom receives RESIDENTE TEMPORAL FOR ' +
    'TWO YEARS and only then residente permanente, provided the bond subsists; their own children and the ' +
    'children of the spouse or partner where those are minors and unmarried or under their guardianship ' +
    '(IV); and their siblings where minors and unmarried or under their legal representation (V).',
};

const lmigraArt56 = {
  id: 'mx-lmigra-art-56',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 56',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The same right for Mexicans, over: father or mother (I); spouse (II) and partner (III), each on the ' +
    'same two-year residente temporal step; children born abroad who are not Mexican under Const. art. 30 ' +
    '(IV); the minor unmarried children of a foreign spouse or partner (V); and minor unmarried siblings ' +
    '(VI).',
};

const lmigraArt57 = {
  id: 'mx-lmigra-art-57',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 57',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The Secretaría MAY establish, by general administrative provisions published in the Diario Oficial de ' +
    'la Federación, a points system letting foreigners acquire permanent residence without the four years ' +
    'of prior residence, and such a system must at minimum cover the entry criteria under the art. 18.II ' +
    'quotas, the applicants capacities including education, work experience, aptitude in science and ' +
    'technology and international recognition, and the procedure. NO SUCH ACUERDO WAS FOUND. Reglamento ' +
    'art. 139.IV, Lineamientos 2012 art. 44 requisito 4, the 2025 consular Lineamientos Trámite 7.III.c ' +
    'and the INM public page all still speak of it in the future tense, fourteen years after the statute. ' +
    'A negative cannot be proved from a search; re-check the DOF before changing this record.',
};

const lmigraArt59 = {
  id: 'mx-lmigra-art-59',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 59',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Residentes temporales and permanentes have THIRTY NATURAL DAYS from entering the territory to apply ' +
    'to the Instituto for the corresponding tarjeta de residencia, which then evidences their regular ' +
    'status for as long as the stay is authorised. Applicants for asylum, refugee recognition or a ' +
    'statelessness determination are excepted and receive a residente permanente card at the end of that ' +
    'procedure. Once the card is issued the holder is entitled to a CURP.',
};

const lmigraArt61 = {
  id: 'mx-lmigra-art-61',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 61',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'In full: "Ningún extranjero podrá tener dos condiciones de estancia simultáneamente." Reglamento ' +
    'arts. 154 and 155 carry the only near-exception, for a visitante regional or visitante trabajador ' +
    'fronterizo who separately obtains an ordinary visitor permission for travel beyond the frontier ' +
    'region: each entry, stay and exit must still be made under one condition only, and using the other ' +
    'mid-stay cancels both documents.',
};

const lmigraArt132 = {
  id: 'mx-lmigra-art-132',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 132',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The right to ask. "Los extranjeros tendrán derecho a solicitar la regularización de su situación ' +
    'migratoria" where they lack the documentation to evidence regular status (I), where that ' +
    'documentation has expired (II), or where they have ceased to satisfy the requirements on which a ' +
    'condición de estancia was granted (III).',
};

const lmigraArt133 = {
  id: 'mx-lmigra-art-133',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 133',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'TWO PARAGRAPHS WITH DIFFERENT VERBS, and the difference decides which way discretion runs. First ' +
    'paragraph: the Instituto "podrá regularizar" the status of foreigners in the territory who express an ' +
    'interest in residing temporarily or permanently, provided they meet the requirements — a general ' +
    'power. Second paragraph: "tienen derecho a la regularización" those who are the spouse, concubina or ' +
    'concubinario of a Mexican or of a foreigner with resident status (I); the parent or child of, or who ' +
    'hold the legal representation or custody of, a Mexican or a foreigner with resident status (II); ' +
    'identified by the Instituto or a competent authority as the victim or witness of a serious crime ' +
    'committed in the territory (III); of a degree of vulnerability that makes deportation or assisted ' +
    'return difficult or impossible (IV); or children and adolescents subject to international ' +
    'child-abduction and restitution proceedings (V). Fractions I to V are an entitlement, not a ' +
    'discretion.',
};

const lmigraArt134 = {
  id: 'mx-lmigra-art-134',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 134',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Foreigners may also seek regularisation, EXPRESSLY SUBJECT TO ART. 43, where having been regularly ' +
    'admitted they have exceeded the stay initially granted, "siempre y cuando presenten su solicitud ' +
    'dentro de los sesenta días naturales siguientes al vencimiento del período de estancia autorizado" ' +
    '(I), or where they carry out activities other than those their condición de estancia permits (II). ' +
    'The sixty natural days run from the expiry of the authorised stay, not from entry. Reglamento ' +
    'art. 144.V restates it as holding a migratory document expired by no more than sixty natural days.',
};

const lmigraArt135 = {
  id: 'mx-lmigra-art-135',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 135',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'What a regularisation application must contain: a written request to the Instituto specifying the ' +
    'irregularity incurred; an official identity document; where a family link is relied on, the documents ' +
    'evidencing it; where the stay was exceeded, the expired migratory document; proof of payment of the ' +
    'fine; and the requirements of the condición de estancia sought.',
};

const lmigraArt136 = {
  id: 'mx-lmigra-art-136',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'art. 136',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'In full at its opening: "El Instituto no podrá presentar al extranjero que acuda ante el mismo a ' +
    'solicitar la regularización de su situación migratoria." Attending an INM office to regularise cannot ' +
    'itself trigger detention. A person already in an estación migratoria who falls within arts. 133 or ' +
    '134 must be issued an oficio de salida within twenty-four hours of proving the requirements. Final ' +
    'paragraph: the Instituto has thirty natural days from filing to decide. Reglamento art. 146 qualifies ' +
    'the protection — it is lost where the person previously failed to comply with an exit order or ' +
    'previously supplied false information or forged documents — and states twenty working days for ' +
    'applications filed at trámite offices.',
};

const lmigraArt145 = {
  id: 'mx-lmigra-art-145',
  kind: 'statute' as const,
  instrument: LMIGRA,
  provision: 'arts. 145 y 146',
  url: LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 145: a fine of twenty to forty días de salario mínimo general vigente en el Distrito Federal for ' +
    'regularisation under art. 133 fractions I and II, and NO FINE AT ALL for fractions III, IV and V. ' +
    'Art. 146: twenty to one hundred días for regularisation under art. 134. The unit is the one the 2016 ' +
    'constitutional transitional article converts to UMA; the statute has never been rewritten to say so.',
};

// ---------------------------------------------------------------------------
// Reglamento de la Ley de Migración
// ---------------------------------------------------------------------------

const regLmigraArt129 = {
  id: 'mx-reg-lmigra-art-129',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 129',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Visitante sin permiso para realizar actividades remuneradas is authorised to a person who shows ' +
    'either sufficient economic solvency to cover lodging and maintenance during the stay (I), or an ' +
    'invitation from an organisation or public or private institution established in the territory to take ' +
    'part in an activity for which they receive no income here, the inviting body evidencing its own ' +
    'solvency (II). The amounts are left to general administrative provisions published in the DOF. Texto ' +
    'vigente, última reforma DOF 2014-05-23.',
};

const regLmigraArt138 = {
  id: 'mx-reg-lmigra-art-138',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 138',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Grounds for residente temporal: a family link with a Mexican or with a foreign resident under the ' +
    'unity-of-family cases of arts. 55 and 56 of the Ley (I); a job offer stating the occupation, the ' +
    'period required, the place of work and the details of the employers constancia de inscripción (II); ' +
    'registration in the Registro Federal de Contribuyentes where the paid activity does not involve a job ' +
    'offer (III); an invitation for an unpaid activity (IV); economic solvency to cover lodging and ' +
    'maintenance (V); and further grounds including real property and investment. The amounts are left to ' +
    'general administrative provisions published in the DOF.',
};

const regLmigraArt139 = {
  id: 'mx-reg-lmigra-art-139',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 139',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The regulatory statement of the residente permanente grounds, and it carries one the statute does ' +
    'not spell out. Fr. V requires "situación migratoria regular por cuatro años CONSECUTIVOS, en el caso ' +
    'de los residentes temporales" — so four years assembled from broken periods does not qualify. Fr. VI ' +
    'is direct-line ascendant or descendant to the second degree of a Mexican by birth. Fr. VII, which has ' +
    'no counterpart in art. 54, grants it on two consecutive years of regular status as residente temporal ' +
    'where the condition was granted by reason of marriage, concubinato or an equivalent bond with a ' +
    'Mexican or a permanent resident and that bond subsists. Fr. IV, the points system, is conditional on ' +
    'an acuerdo to be published in the DOF.',
};

const regLmigraArt141 = {
  id: 'mx-reg-lmigra-art-141',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 141',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The closed list of permitted changes of condición de estancia, which is how art. 53 is operated. ' +
    'Fr. I: a visitante or residente temporal may change to RESIDENTE PERMANENTE by family link where they ' +
    'are a minor under the patria potestad or guardianship of a Mexican or permanent resident (a); the ' +
    'child of a Mexican born abroad who has not exercised their right to Mexican nationality (b); the ' +
    'spouse or partner of a Mexican or permanent resident who evidences two years of regular stay as ' +
    'residente temporal and subsistence of the bond for the same period, the two years running "a partir ' +
    'de que el cónyuge, concubina o concubinario o figura equivalente adquiere la condición de estancia de ' +
    'residente temporal por el vínculo" and not from the wedding (c); the minor unmarried sibling of a ' +
    'Mexican or permanent resident under their legal representation (d); or the grandparent, parent, ' +
    'child or grandchild of a Mexican BY BIRTH (e). Fr. II: a visitante or residente temporal estudiante ' +
    'may change to residente temporal by family link. Fr. III: any visitante variant may change to ' +
    'visitante por razones humanitarias on the listed grounds.',
};

const regLmigraArt143 = {
  id: 'mx-reg-lmigra-art-143',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 143',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'For the application of the first paragraph of art. 133 of the Ley, the Secretaría may issue general ' +
    'administrative provisions OF A TEMPORARY CHARACTER, published in the DOF, setting the cases, ' +
    'requirements and procedures for regularisation. This is the hook under which the 2015 and 2016 ' +
    'Programas Temporales de Regularización Migratoria were published. Both are expired by their own ' +
    'transitional articles — the 2016 programme ran from 2017-01-09 to 2017-12-19 — and no successor was ' +
    'found as at 2026-07-26. A new one could be published at any time and would appear in the DOF.',
};

const regLmigraArt144 = {
  id: 'mx-reg-lmigra-art-144',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 144',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The regulatory list of regularisation grounds. Fr. IV expands the statutory vulnerability ground with ' +
    'a non-exhaustive list: unaccompanied migrant children where it serves their best interests (a); ' +
    'pregnant women, older adults, persons with disabilities and indigenous persons (b); persons with a ' +
    'grave health condition whose transfer would risk their life (c); persons in danger of life or ' +
    'physical integrity from violence or natural disaster (d); and applicants for refugee status, ' +
    'political asylum or a statelessness determination, until that procedure concludes (e). Fr. V is ' +
    'holding a migratory document expired by no more than sixty natural days; fr. VI is carrying out ' +
    'activities other than those authorised; fr. VII is having obtained an oficio de salida from an ' +
    'estación migratoria.',
};

const regLmigraArt145 = {
  id: 'mx-reg-lmigra-art-145',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 145',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Regularisation does NOT by itself change the condición de estancia, except in the art. 53 cases: a ' +
    'visitante regularising under fractions V or VI of art. 144 regularises INTO THE VISITOR CONDITION ' +
    'matching the activity. And where the person still held a valid migratory document at the moment they ' +
    'went irregular by carrying out unauthorised activities, "la temporalidad de la condición de estancia ' +
    'que se autorice por regularización será la que resta al documento migratorio para su vencimiento" — ' +
    'the regularised authorisation runs only for the remainder of that document, not for a fresh term.',
};

const regLmigraArt146 = {
  id: 'mx-reg-lmigra-art-146',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 146',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Procedure at INM trámite offices: the documents of art. 135 of the Ley are filed with the application ' +
    '(I); the authority summons the person and records the circumstances and the reasons for the request ' +
    'in an acta (II); and it resolves within TWENTY WORKING DAYS after checking the requirements and the ' +
    'migration control lists (III), a negative decision being reasoned and carrying a period of not more ' +
    'than thirty and not less than twenty natural days to leave. The art. 136 protection against detention ' +
    'is lost where the person previously failed to comply with an exit order or previously supplied false ' +
    'information or apocryphal, altered or fraudulently obtained documents. Final paragraph: a person ' +
    'refused must leave in the period given AND MAY NOT APPLY AGAIN FOR SIX MONTHS from notification.',
};

const regLmigraArt153 = {
  id: 'mx-reg-lmigra-art-153',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 153',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Holders of visitante por razones humanitarias may request as many renewals as are necessary until the ' +
    'process or the cause that gave rise to the condition concludes, and the document carries multiple ' +
    'entries and exits.',
};

const regLmigraArt154 = {
  id: 'mx-reg-lmigra-art-154',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 154',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The visitante regional document is valid for up to FIVE YEARS from issue, with the right to remain ' +
    '"hasta por tres días naturales en cada visita" in the frontier regions the Secretaría determines. ' +
    'THE THREE DAYS ARE IN CONFLICT WITH THE STATUTE: art. 52.III has said seven days since the reform of ' +
    'DOF 2017-05-19, and the Reglamento has not been amended since DOF 2014-05-23. The later and higher ' +
    'instrument governs, and INM own 2019 acuerdo and public page follow it. A holder who wishes to travel ' +
    'beyond the authorised frontier region for unpaid activities must first obtain an ordinary visitor visa.',
};

const regLmigraArt155 = {
  id: 'mx-reg-lmigra-art-155',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 155',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The visitante trabajador fronterizo document is valid for ONE YEAR from issue, in the states the ' +
    'Secretaría determines, with multiple entries and exits. Travel to states beyond those authorised ' +
    'requires a separate visitor permission first.',
};

const regLmigraArt156 = {
  id: 'mx-reg-lmigra-art-156',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 156',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The residente temporal card may run one, two, three or four years from the grant of the condition. ' +
    'Where the holder obtains a work permission the card runs for the same period as the job offer. ' +
    'Renewals may be requested in the thirty natural days before expiry "hasta completar cuatro años ' +
    'contados a partir de que obtuvo la condición de estancia" — the four years are a ceiling measured ' +
    'from the grant, not a renewable term. Children under three receive one-year cards only.',
};

const regLmigraArt157 = {
  id: 'mx-reg-lmigra-art-157',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 157',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The residente permanente card is of indefinite validity, except for minors, who renew annually until ' +
    'three and every four years thereafter until majority. It carries multiple entries and exits and, ' +
    '"en el caso de ser mayores de edad", a work permission. This is what settles the drafting ' +
    'inconsistency between art. 52.IX and the closing paragraph of art. 54.',
};

// ---------------------------------------------------------------------------
// Lineamientos Generales para la expedición de visas — DOF 2025-07-25
//
// `policy`, never `regulation`: these are administrative instructions issued
// jointly by two secretaries, not a decree issued by the President. The
// distinction decides whether an applicant can argue a rule is ultra vires the
// Reglamento, which is precisely the argument live in the three-day / seven-day
// conflict above. Every one carries `discretionary: true`, because the
// instrument is amended by free-standing acuerdos with no consolidated official
// text and the version read is a snapshot.
// ---------------------------------------------------------------------------

const visasT1 = {
  id: 'mx-lineamientos-visas-2025-t1',
  kind: 'policy' as const,
  instrument: VISAS_2025,
  provision: 'Trámite 1 (Visa de Visitante sin permiso para realizar actividades remuneradas)',
  url: VISAS_2025_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DOF 2025-07-25, in force fifteen natural days after publication. Transitional art. SEGUNDO abrogated ' +
    'the Lineamientos of DOF 2014-10-10 outright, so anything written from the 2014 text cites a repealed ' +
    'instrument, and every threshold is now denominated in UMA where the 2014 instrument used días de ' +
    'salario mínimo. Trámite 1 fracción III accepts, among others: arraigo, being a registered property ' +
    'deed at least two years old plus proof of two years of stable employment or of business ownership; ' +
    'solvencia económica, being employment or pension income free of encumbrances GREATER THAN 220 DÍAS ' +
    'UMA monthly over the last three months plus a one-year stable-employment certificate, OR investments ' +
    'or bank accounts with an average monthly balance of 680 DÍAS UMA over the last three months, OR, for ' +
    'a person enrolled in higher education, a study certificate plus employment, pension or scholarship ' +
    'income of 130 DÍAS UMA over the last three months; or an invitation, where a private inviting body ' +
    'must show an average monthly balance of 2,290 DÍAS UMA over twelve months and public bodies and ' +
    'Sistema Educativo Nacional institutions are exempt.',
};

const visasT4 = {
  id: 'mx-lineamientos-visas-2025-t4',
  kind: 'policy' as const,
  instrument: VISAS_2025,
  provision: 'Trámite 4 (Visa de Visitante para realizar trámites de adopción)',
  url: VISAS_2025_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The consular procedure for the adoption visitor condition. The visa is applied for at a Mexican ' +
    'consular office, and once in Mexico the holder must obtain the corresponding card from the Instituto ' +
    'within thirty natural days of entry.',
};

const visasT5 = {
  id: 'mx-lineamientos-visas-2025-t5',
  kind: 'policy' as const,
  instrument: VISAS_2025,
  provision: 'Trámite 5 (Visa de Residencia Temporal)',
  url: VISAS_2025_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DOF 2025-07-25. Maximum visa validity 180 days, one entry, decided within ten working days; the visa ' +
    'is a travel authorisation to arrive and claim the status, not the status. Fracción III accepts: ' +
    'solvencia económica, being an average monthly balance of 11,460 DÍAS UMA over the last twelve months ' +
    'or employment or pension income free of encumbrances GREATER THAN 680 DÍAS UMA monthly over the last ' +
    'six months (a); scientific research in Mexican jurisdictional waters (b); an invitation, where a ' +
    'private inviting body shows 22,920 DÍAS UMA over twelve months and, where the host does not cover ' +
    'maintenance, the applicant shows 11,460 DÍAS UMA over twelve months or 450 DÍAS UMA of monthly income ' +
    'over six months (c); an international mobility instrument (d); family unity (e); real property in ' +
    'Mexico of a value EXCEEDING 91,710 DÍAS UMA (f); and investment, being participation in the share ' +
    'capital of a Mexican company EXCEEDING 45,850 DÍAS UMA, or fixed assets of the same value, or ' +
    'documented business activity including an IMSS certificate of at least three employees (g). Ground ' +
    'h., high-specialisation technical assistance, was added by the Acuerdo of DOF 2026-05-15.',
};

const visasT6 = {
  id: 'mx-lineamientos-visas-2025-t6',
  kind: 'policy' as const,
  instrument: VISAS_2025,
  provision: 'Trámite 6 (Visa de Residente Temporal Estudiante)',
  url: VISAS_2025_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'An acceptance or invitation letter from an institution belonging to the sistema educativo nacional, ' +
    'plus solvency to cover tuition, lodging and maintenance for the duration of the studies. The solvency ' +
    'may be evidenced by the applicant, by their parents, or by whoever holds patria potestad over them, ' +
    'which is why the applicants own figures may be beside the point on this route.',
};

const visasT7 = {
  id: 'mx-lineamientos-visas-2025-t7',
  kind: 'policy' as const,
  instrument: VISAS_2025,
  provision: 'Trámite 7 (Visa de Residencia Permanente)',
  url: VISAS_2025_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Maximum visa validity 180 days, one entry, decided within ten working days. Ground a., retired or ' +
    'pensioned: an average monthly balance of 45,850 DÍAS UMA over the last twelve months, or pension ' +
    'income free of encumbrances GREATER THAN 1,140 DÍAS UMA monthly over the last six months. Ground b., ' +
    'family unity, requires proof of the relationship and, for the family of a foreign permanent resident, ' +
    'solvency for the maintenance of EACH relative of 220 DÍAS UMA of average monthly balance over twelve ' +
    'months or 220 DÍAS UMA of monthly income over six months. The closing notes state in terms that the ' +
    'foreign spouse or partner of a Mexican or of a residente permanente "en ningún caso podrá ser ' +
    'documentado con la visa de residente permanente" — the two-year residente temporal step is not ' +
    'avoidable by applying at a consulate.',
};

const visasT10 = {
  id: 'mx-lineamientos-visas-2025-t10',
  kind: 'policy' as const,
  instrument: VISAS_2025,
  provision: 'Trámite 10 (visa solicitada al Instituto por oferta de empleo), reformado por Acuerdo DOF 2026-05-15',
  url: VISAS_2026_ACUERDO_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The job-offer route is filed at INM, not at a consulate: INM authorises the visa and the consular ' +
    'office then issues it after an interview. As amended by the Acuerdo of DOF 2026-05-15 the offer must ' +
    'state the occupation according to the Sistema Nacional de Clasificación de Ocupaciones, the work ' +
    'modality (in person, remote or mixed), every address at which the work will be performed, and the ' +
    'amount and periodicity of the remuneration; for strategic projects it must also carry the ' +
    'knowledge-transfer programme and evidence of the foreigners qualifications. The employer must hold a ' +
    'constancia de inscripción del empleador issued by INM.',
};

const visasAcuerdo2026 = {
  id: 'mx-acuerdo-visas-2026',
  kind: 'policy' as const,
  instrument:
    'Acuerdo por el que se reforman y adicionan los Lineamientos Generales para la expedición de visas que emiten las secretarías de Gobernación y de Relaciones Exteriores',
  provision: 'DOF 2026-05-15 (edición vespertina)',
  url: VISAS_2026_ACUERDO_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Signed 2026-05-13, published DOF 2026-05-15, in force the day after publication. It adds ground h. to ' +
    'Trámite 5 — asistencia técnica de alta especialidad y transferencia de conocimientos en proyectos ' +
    'estratégicos — WITH NO MONETARY THRESHOLD AT ALL, requiring instead a carta responsiva from a Mexican ' +
    'legal person describing the strategic project, an express commitment to run a knowledge-transfer and ' +
    'training programme for Mexican staff, a sworn statement that the arrangement is not subordinate ' +
    'employment, does not displace national talent and carries no Mexican-source remuneration, and joint ' +
    'and several responsibility for maintenance and return, plus documents evidencing the specialisation. ' +
    'It also rewrites Trámites 10 and 11 and adds to art. DÉCIMO NOVENO(B) that a consular authority may ' +
    'not require anything beyond the Ley, the Reglamento and the Lineamientos. Transitional art. Tercero ' +
    'is worth carrying: the Mexican state may suspend the Acuerdo temporarily or permanently for reasons ' +
    'of national security, public order or public health. A route that can be switched off by ' +
    'administrative decision is not a stable route.',
};

// ---------------------------------------------------------------------------
// Lineamientos para trámites y procedimientos migratorios — DOF 2012-11-08
//
// The INM counter instrument, and the other half of the channel split. Its
// figures are still denominated in `días de salario mínimo general vigente en el
// Distrito Federal`, a unit whose name has not existed since 2016. The
// constitutional transitional article converts the reference to UMA as a matter
// of law; INM own public page still prints the old unit; which number an officer
// actually applies could not be established, which is why every one of these is
// `discretionary: true` and why no criterion here converts a multiple into pesos.
// ---------------------------------------------------------------------------

const tramitesArt26 = {
  id: 'mx-lineamientos-tramites-2012-art-26',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'art. 26',
  url: TRAMITES_2012_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The ficha for admission of persons who do not require a visa. "Vigencia de la autorización: 180 días ' +
    'naturales" is the standard authorisation at the port of entry, and the officer may grant less. ' +
    'Requisito 3 records the facilitation that matters most in practice: a person who is not otherwise ' +
    'visa-exempt may be admitted on a document evidencing PERMANENT RESIDENCE IN CANADA, THE UNITED ' +
    'STATES, JAPAN, THE UNITED KINGDOM OR ANY SCHENGEN STATE; a VALID UNITED STATES VISA; a ' +
    'Mexico-approved APEC Business Travel Card; or air or sea crew documentation. The officer may also ' +
    'ask the traveller to evidence the purpose of the trip.',
};

const tramitesArt32 = {
  id: 'mx-lineamientos-tramites-2012-art-32',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'arts. 32 y 34',
  url: TRAMITES_2012_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Art. 32, the canje of the entry FMM for a card after arriving on a residence visa: "1 año para ' +
    'tarjeta de residente temporal o para tarjeta de visitante con fines de adopción, CONTADO A PARTIR DE ' +
    'SU INTERNACIÓN"; indefinite for the residente permanente card. Art. 34, renewal: one year for the ' +
    'residente temporal card, or two or three years where there is continuidad laboral for the same ' +
    'period; one year for the residente temporal estudiante, visitante con fines de adopción and visitante ' +
    'por razones humanitarias cards. Both are administrative practice within the ceiling Reglamento ' +
    'art. 156 fixes, not a statutory entitlement to any particular term.',
};

const tramitesArt44 = {
  id: 'mx-lineamientos-tramites-2012-art-44',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'art. 44',
  url: TRAMITES_2012_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The ficha for changing from residente temporal to residente permanente at an INM counter. Resolution ' +
    'within twenty working days; authorisation of indefinite validity. Requisito 5, for pensioners: an ' +
    'average monthly balance of 25,000 DÍAS de salario mínimo general vigente en el Distrito Federal over ' +
    'the last twelve months, or income or pension free of encumbrances of 500 DÍAS monthly over the last ' +
    'six months. THESE ARE NOT THE CONSULAR FIGURES: Trámite 7 of the 2025 Lineamientos sets 45,850 and ' +
    '1,140 días UMA for the same-sounding test. Requisito 6: where the ground is that four years have ' +
    'elapsed as residente temporal, the applicant MUST STATE THAT EXPRESSLY IN THE APPLICATION. Requisito ' +
    '4 still refers the points system to "el acuerdo que al efecto se publique en el Diario Oficial de la ' +
    'Federación".',
};

const tramitesArt45 = {
  id: 'mx-lineamientos-tramites-2012-art-45',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'art. 45',
  url: TRAMITES_2012_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The operational teeth on art. 132 of the Ley: "Para salvaguardar el derecho de la persona extranjera ' +
    'a solicitar la regularización de su situación migratoria, la autoridad migratoria DEBERÁ RECIBIR ' +
    'TODAS LAS SOLICITUDES DE REGULARIZACIÓN QUE SE PRESENTEN." Receipt is not the same as grant, but an ' +
    'office may not refuse to take the application.',
};

const tramitesArt50 = {
  id: 'mx-lineamientos-tramites-2012-art-50',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'art. 50, reformado por Acuerdo DOF 2016-09-30',
  url: TRAMITES_2016_ACUERDO_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The ficha for regularisation on humanitarian grounds, resolved within thirty natural days. The ' +
    'visitante por razones humanitarias is exempt from the fee under art. 16 of the Ley Federal de ' +
    'Derechos.',
};

const tramitesArt51 = {
  id: 'mx-lineamientos-tramites-2012-art-51',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'art. 51, reformado por Acuerdo DOF 2016-09-30',
  url: TRAMITES_2016_ACUERDO_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The ficha for regularización por vínculo familiar, and THE ASYMMETRY IS THE WHOLE POINT OF THE ROUTE. ' +
    'The requirements are: passport or an official identity document from the country of origin; proof of ' +
    'payment of the fee; the migratory document if the person ever held one; proof of payment of the fine ' +
    'determined under art. 145 of the Ley, unless expressly exempt; and, for a spouse or partner, a signed ' +
    'statement of the conjugal domicile plus the Mexican or residents identification and the marriage or ' +
    'concubinato document, or, for a parent, child, guardian or custodian, the corresponding birth ' +
    'certificate or court document. THERE IS NO SOLVENCY REQUIREMENT — compare art. 52, which has one. ' +
    'Resolution within thirty natural days; authorisation up to four years for a residente temporal and ' +
    'indefinite for a residente permanente.',
};

const tramitesArt52 = {
  id: 'mx-lineamientos-tramites-2012-art-52',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'art. 52, reformado por Acuerdo DOF 2016-09-30',
  url: TRAMITES_2016_ACUERDO_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'The ficha for regularisation on an expired document or unauthorised activities, and the source of the ' +
    'INM-counter economic thresholds, all in DÍAS DE SALARIO MÍNIMO GENERAL VIGENTE EN EL DISTRITO ' +
    'FEDERAL. Job offer: an offer on letterhead from a person or company formally established in Mexico ' +
    'stating the occupation, the period required, the place of work and the details of the employers ' +
    'constancia de inscripción. Solvencia económica: an average monthly balance of 20,000 DÍAS over twelve ' +
    'months, or 500 DÍAS over six months where the outcome sought is visitante sin permiso; or income or ' +
    'pension free of encumbrances of 400 DÍAS monthly over six months, or 150 DÍAS for the visitante ' +
    'outcome. Real property: a value of 40,000 DÍAS. Investor: 20,000 DÍAS in share capital or movable ' +
    'assets, or documented business activity with an IMSS certificate of at least five workers. Student: ' +
    '20,000 DÍAS of balance over twelve months, or 300 DÍAS for the visitante outcome. Resolution within ' +
    'thirty natural days; authorisation up to four years for a residente temporal, one year for a ' +
    'residente temporal estudiante, 180 days for a visitante.',
};

const tramitesArt72 = {
  id: 'mx-lineamientos-tramites-2012-art-72',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'arts. 72 a 74, reformados por Acuerdo DOF 2019-04-23',
  url: TRAMITES_2019_ACUERDO_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Art. 72 as reformed: the visitante regional condition may be obtained by NATIONALS OF GUATEMALA, ' +
    'BELIZE, EL SALVADOR AND HONDURAS and by foreigners permanently resident in those countries. El ' +
    'Salvador and Honduras do not border Mexico; SEGOB justified the extension by reference to the ' +
    'Mexico-Central America free trade agreement and a 2018 four-state declaration, so the list is ' +
    'administrative and must not be generalised to any other state. Art. 73: the región fronteriza is all ' +
    'cities and municipalities of CAMPECHE, CHIAPAS, TABASCO, QUINTANA ROO AND YUCATÁN. Art. 74: the card ' +
    'is applied for in person at a land port of entry or an INM-enabled location, decided immediately, and ' +
    'valid for five years.',
};

const tramitesArt75 = {
  id: 'mx-lineamientos-tramites-2012-art-75',
  kind: 'policy' as const,
  instrument: TRAMITES_2012,
  provision: 'arts. 75 y 76',
  url: TRAMITES_2012_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Art. 75: the visitante trabajador fronterizo condition may be obtained by GUATEMALAN AND BELIZEAN ' +
    'nationals AGED 16 OR OVER who hold a job offer. Note that this article was NOT touched by the 2019 ' +
    'acuerdo that extended the visitante regional list to El Salvador and Honduras, so the ' +
    'frontier-worker list is still two countries; whether that was deliberate could not be established. ' +
    'Art. 76: the condition permits entry, transit and paid work in CAMPECHE, CHIAPAS, QUINTANA ROO AND ' +
    'TABASCO, and is subject to any quotas set jointly with the Secretaría de Trabajo y Previsión Social ' +
    'and published in the DOF.',
};

// ---------------------------------------------------------------------------
// The UMA
// ---------------------------------------------------------------------------

const ldvuma = {
  id: 'mx-ldvuma-arts-4-5',
  kind: 'statute' as const,
  instrument: 'Ley para Determinar el Valor de la Unidad de Medida y Actualización',
  provision: 'arts. 4 y 5',
  url: LDVUMA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 4: the daily value is the previous years daily value multiplied by one plus the year-on-year ' +
    'change in the Índice Nacional de Precios al Consumidor for December of the previous year; the monthly ' +
    'value is the daily value times 30.4; the annual value is the monthly value times twelve. Art. 5: ' +
    'INEGI publishes the daily, monthly and annual values in the DOF within the first ten days of January, ' +
    'AND THEY TAKE EFFECT ON 1 FEBRUARY. So every threshold in this file changes in peso terms on a fixed ' +
    'annual cadence, by an amount nobody can predict in advance. That is the mechanism; the multiple is ' +
    'the rule, and the peso figure is arithmetic performed at the moment of the question.',
};

const uma2026 = {
  id: 'mx-uma-2026',
  kind: 'statistics' as const,
  instrument: 'Unidad de Medida y Actualización (Instituto Nacional de Estadística y Geografía)',
  provision: 'DOF 2026-01-09',
  url: UMA_2026_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Values in force from 2026-02-01: daily 117.31 MXN, monthly 3,566.22 MXN, annual 42,794.64 MXN. ' +
    'RECORDED AS A REFERENCE, NEVER MULTIPLIED INTO A THRESHOLD ANYWHERE IN THIS CATALOG. INEGI will ' +
    'publish a new set in the first ten days of January 2027 and it will take effect on 2027-02-01, at ' +
    'which point these three numbers describe a past year. A threshold is N días UMA; converting it to ' +
    'pesos is the callers arithmetic at the moment of the question, exactly as ReferenceIndices already ' +
    'handles IPREM and SMI for Spain.',
};

// ---------------------------------------------------------------------------
// Ley de Nacionalidad and its Reglamento
// ---------------------------------------------------------------------------

const lnacArt19 = {
  id: 'mx-lnac-art-19',
  kind: 'statute' as const,
  instrument: LNAC,
  provision: 'art. 19',
  url: LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'A foreigner seeking to naturalise must file an application with the Secretaría de Relaciones ' +
    'Exteriores (I); make the renunciations and protest of art. 17, which the Secretaría "no podrá exigir" ' +
    'until it has decided to grant, so they are a condition of issue and not of application (II); PROVE ' +
    'THEY SPEAK SPANISH, KNOW THE COUNTRYS HISTORY AND ARE INTEGRATED INTO THE NATIONAL CULTURE (III); and ' +
    'evidence residence for the period corresponding under art. 20 (IV). Texto vigente, última reforma ' +
    'DOF 2012-04-23.',
};

const lnacArt20 = {
  id: 'mx-lnac-art-20',
  kind: 'statute' as const,
  instrument: LNAC,
  provision: 'art. 20',
  url: LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'The general period is FIVE YEARS of residence in national territory "cuando menos durante los últimos ' +
    'cinco años inmediatos anteriores a la fecha de su solicitud". TWO YEARS suffices where the applicant ' +
    'is a direct-line descendant of a Mexican by birth (I.a); has Mexican children by birth (I.b); "sea ' +
    'originario de un país latinoamericano o de la Península Ibérica" (I.c); or has rendered outstanding ' +
    'services or works in cultural, social, scientific, technical, artistic, sporting or business matters ' +
    'benefiting the Nation, in the Secretarías judgement (I.d) — with no residence at all in exceptional ' +
    'cases at the discretion of the Executive. A second paragraph to I.a exempts from residence entirely a ' +
    'direct-line descendant in the SECOND degree of a Mexican by birth who holds no other nationality at ' +
    'the time of application or is not recognised the rights acquired at birth. Fr. II: two years for the ' +
    'spouse of a Mexican, who must have "residido y vivido de consuno en el domicilio conyugal establecido ' +
    'en territorio nacional" for the two years immediately preceding the application, with the conjugal ' +
    'domicile excused where the Mexican spouse is abroad on a Mexican government posting, and with the ' +
    'fraction available to the other spouse where two foreigners are married and one later naturalises. ' +
    'Fr. III: ONE YEAR, uninterrupted, for adoptees and for minor descendants to the second degree under ' +
    'the patria potestad of Mexicans, who may themselves apply within the year following majority if those ' +
    'holding patria potestad did not. Final paragraph: the Carta de Naturalización takes effect the day ' +
    'after it is issued.',
};

const lnacArt21 = {
  id: 'mx-lnac-art-21',
  kind: 'statute' as const,
  instrument: LNAC,
  provision: 'art. 21',
  url: LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'In full: "Las ausencias temporales del país no interrumpirán la residencia, salvo que éstas se ' +
    'presenten durante los dos años anteriores a la presentación de la solicitud y excedan en total seis ' +
    'meses. La residencia a que se refiere la fracción III del artículo anterior, deberá ser ' +
    'ininterrumpida." Read it precisely: absences BEFORE the final two years do not count at all; absences ' +
    'WITHIN the final two years break residence only if they total more than six months; and for the ' +
    'one-year route of art. 20.III the residence must be unbroken outright. Reglamento art. 16.VI requires ' +
    'a statement under oath listing every entry and exit in the relevant period so the computation can be ' +
    'made.',
};

const lnacArt22 = {
  id: 'mx-lnac-art-22',
  kind: 'statute' as const,
  instrument: LNAC,
  provision: 'art. 22',
  url: LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Nationality acquired under art. 20 fraction II survives dissolution of the marriage, except on ' +
    'annulment attributable to the naturalised spouse.',
};

const lnacArt25 = {
  id: 'mx-lnac-art-25',
  kind: 'statute' as const,
  instrument: LNAC,
  provision: 'arts. 23, 24 y 25',
  url: LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'AN OPEN-ENDED DISCRETION WITH ONLY A REASONS REQUIREMENT ATTACHED. Art. 23: in every case the ' +
    'Secretaría must first obtain the opinion of the Secretaría de Gobernación. Art. 24: the procedure is ' +
    'suspended where the applicant is committed for trial in Mexico or its foreign equivalent. Art. 25: no ' +
    'carta de naturalización is issued where the applicant fails the statutory requirements (I), is ' +
    'serving a custodial sentence for an intentional offence in Mexico or abroad (II), or "cuando no sea ' +
    'conveniente a juicio de la Secretaría, en cuyo caso deberá fundar y motivar su decisión" (III). ' +
    'Because of fraction III no Mexican naturalisation criterion in this catalog may ever produce a ' +
    'confident eligible verdict.',
};

const regLnacArt14 = {
  id: 'mx-reg-lnac-art-14',
  kind: 'regulation' as const,
  instrument: REG_LNAC,
  provision: 'art. 14',
  url: REG_LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Decisive and short. "Para efectos de lo dispuesto en los artículos 20 y 21 de la Ley, el interesado ' +
    'deberá acreditar la residencia en territorio nacional con cualquiera de los siguientes documentos: ' +
    'I. Con la tarjeta expedida por la Secretaría de Gobernación que acredite la condición de estancia de ' +
    'residente temporal, o II. … de residente permanente." TIME AS A VISITANTE PROVES NOTHING, including ' +
    '180-day tourist stays repeated for years, and neither does irregular presence. Artículo reformado ' +
    'DOF 2013-11-25.',
};

const regLnacArt15 = {
  id: 'mx-reg-lnac-art-15',
  kind: 'regulation' as const,
  instrument: REG_LNAC,
  provision: 'art. 15',
  url: REG_LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Every applicant must show they speak Spanish, know the countrys history and are integrated into the ' +
    'national culture, "para lo cual deberá presentar y aprobar los exámenes de acuerdo con los contenidos ' +
    'aprobados por el Instituto Matías Romero de la Secretaría". Persons the Secretaría de Gobernación ' +
    'considers refugees, minors, AND PERSONS OVER SIXTY need only show that they speak Spanish. THE PASS ' +
    'MECHANICS ARE NOT ENCODED ANYWHERE IN THIS CATALOG: two inconsistent official statements were found ' +
    'and neither is cited. Only the existence of the examination and the source of its contents are ' +
    'recorded here.',
};

const regLnacArt16 = {
  id: 'mx-reg-lnac-art-16',
  kind: 'regulation' as const,
  instrument: REG_LNAC,
  provision: 'arts. 16, 17 y 18',
  url: REG_LNAC_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 16, the documentary requirements for the five-year route: majority of age and full civil ' +
    'capacity (I); the completed application (II); the current migratory document evidencing legal stay ' +
    'and therefore residence for the relevant period, WHICH MUST HAVE AT LEAST SIX MONTHS OF VALIDITY ' +
    'REMAINING after the application is filed and must carry the CURP (III); a certified copy of the ' +
    'foreign birth certificate, legalised or apostilled and translated, waivable for a person SEGOB ' +
    'considers a refugee (IV); a valid foreign passport or travel and identity document (V); a statement ' +
    'under oath listing every entry and exit in the relevant period, for the art. 21 absence computation ' +
    '(VI); A FEDERAL AND LOCAL CRIMINAL-RECORD CERTIFICATE (VII); photographs (VIII); a statement that the ' +
    'information is correct (IX); and the fee (X). Arts. 17 and 18 apply the same list to the two-year ' +
    'routes, substituting a two-year migratory document for the five-year one, and art. 18.I adds for the ' +
    'spousal route that the marriage certificate must show a DATE OF CELEBRATION AT LEAST TWO YEARS ' +
    'BEFORE the application, with art. 18.IV requiring the Mexican spouse to declare in person that they ' +
    'live together and have established the conjugal domicile in national territory for at least those ' +
    'two years.',
};

// ---------------------------------------------------------------------------
// Protection — cited only to name what is out of scope and where to send it
// ---------------------------------------------------------------------------

const lrpcap = {
  id: 'mx-lrpcap-art-13-18',
  kind: 'statute' as const,
  instrument: 'Ley sobre Refugiados, Protección Complementaria y Asilo Político',
  provision: 'arts. 13 y 18',
  url: LRPCAP_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'CITED HERE ONLY TO MARK A BOUNDARY. Art. 13 sets the three grounds on which refugee status is ' +
    'recognised. Art. 18 sets the filing deadline: the application must be made in writing to the ' +
    'Secretaría "dentro del término de 30 DÍAS HÁBILES contados a partir del día hábil siguiente al que ' +
    'haya ingresado al país o, en su caso, a aquél en que le haya sido materialmente posible presentarla", ' +
    'and may be made verbally where writing is not possible. This catalog does not assess protection ' +
    'claims. It records that the deadline exists, that it is short, and that missing it is not ' +
    'recoverable by anything in this file. Texto vigente, última reforma DOF 2022-02-18.',
};

const comar = {
  id: 'mx-comar',
  kind: 'official_guidance' as const,
  instrument: 'Comisión Mexicana de Ayuda a Refugiados (COMAR)',
  url: COMAR_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'COMAR is the competent body for recognition of refugee status and for complementary protection; the ' +
    'Secretaría de Relaciones Exteriores decides political asylum. A person with a protection claim, or ' +
    'who thinks they may have one, should take it to COMAR or to a specialised organisation and not to ' +
    'this engine. Meridian assesses no part of a protection claim and states no likelihood of recognition.',
};

const regLmigraArt140 = {
  id: 'mx-reg-lmigra-art-140',
  kind: 'regulation' as const,
  instrument: REG_LMIGRA,
  provision: 'art. 140',
  url: REG_LMIGRA_URL,
  jurisdiction: 'MX',
  verifiedOn: VERIFIED_ON,
  note:
    'A migration work permission is not a professional licence. "Las visas y documentos que acrediten una ' +
    'condición de estancia no otorgan autorización para el ejercicio de actividades o profesiones que ' +
    'requieren de certificaciones, licencias, títulos, permisos, anuencias u otros similares", and it is ' +
    'for the foreigner to obtain those and for the employer to verify or arrange them. A regulated ' +
    'occupation still needs its own authorisation from the competent Mexican authority, and this engine ' +
    'assesses none of that.',
};

// ---------------------------------------------------------------------------
// Visitante — art. 52 fractions I to VI
// ---------------------------------------------------------------------------

export const mxVisitanteSinPermiso: Pathway = {
  id: 'mx-visitante-sin-permiso',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'Visitor without permission to carry out paid activities',
    es: 'Visitante sin permiso para realizar actividades remuneradas',
  },
  summary: {
    en:
      'Up to 180 uninterrupted days in Mexico from the date of entry, with no permission to carry out ' +
      'activities for remuneration in the country. A visa is required unless a visa-suppression agreement ' +
      'or a unilateral decision applies; separately, INM admits without a Mexican visa anyone holding ' +
      'permanent residence in Canada, the United States, Japan, the United Kingdom or a Schengen state, a ' +
      'valid United States visa, or a Mexico-approved APEC Business Travel Card.',
    es:
      'Hasta 180 días ininterrumpidos en México contados desde la fecha de entrada, sin permiso para ' +
      'realizar actividades sujetas a una remuneración en el país. Se requiere visa salvo que exista ' +
      'acuerdo de supresión de visado o una decisión unilateral; con independencia de ello, el INM admite ' +
      'sin visa mexicana a quien acredite residencia permanente en Canadá, Estados Unidos, Japón, el Reino ' +
      'Unido o un Estado del Espacio Schengen, una visa estadounidense válida y vigente, o una Tarjeta de ' +
      'Viajero de Negocios de APEC aprobada por México.',
  },
  citations: [
    lmigraArt52,
    lmigraArt40,
    lmigraArt53,
    lmigraArt132,
    regLmigraArt129,
    visasT1,
    tramitesArt26,
    regLnacArt14,
    uma2026,
    ldvuma,
  ],
  criteria: [
    {
      id: 'mx-vis-sp-no-remunerated-activity',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-52', 'mx-lmigra-art-40'],
      label: {
        en: 'No activity subject to remuneration in Mexico will be carried out',
        es: 'No se realizarán actividades sujetas a una remuneración en México',
      },
      evaluator: { op: 'is_true', path: 'intent.noEconomicActivityInTargetState' },
      guidance: {
        en:
          'Art. 40 states it for every visa, not only this one: no visa carries permission to work for ' +
          'remuneration unless the document says so expressly. Paid work on this condition is an activity ' +
          'other than the one authorised, which puts the person into art. 134.II and the regularisation ' +
          'chapter. If the stay involves paid work, the route is the visitor condition of art. 52.II or a ' +
          'residence condition, not this one.',
        es:
          'El art. 40 lo dice para toda visa, no solo para esta: ninguna otorga permiso para trabajar a ' +
          'cambio de una remuneración salvo que el documento lo señale expresamente. Trabajar de forma ' +
          'remunerada con esta condición es realizar una actividad distinta a la autorizada, lo que sitúa ' +
          'a la persona en el art. 134.II y en el capítulo de regularización. Si la estancia implica ' +
          'trabajo remunerado, la vía es el visitante del art. 52.II o una condición de residencia, no esta.',
      },
    },
    {
      id: 'mx-vis-sp-solvency',
      kind: 'economic',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: [
        'mx-reg-lmigra-art-129',
        'mx-lineamientos-visas-2025-t1',
        'mx-uma-2026',
        'mx-ldvuma-arts-4-5',
      ],
      label: {
        en: 'Economic solvency, or an invitation from a body established in Mexico',
        es: 'Solvencia económica, o invitación de una institución establecida en México',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Every figure is a multiple of the UMA, which INEGI republishes each January to take effect on ' +
          '1 February, and Meridian holds no UMA index. Trámite 1 of the 2025 Lineamientos accepts: ' +
          'employment or pension income free of encumbrances greater than 220 días UMA monthly over the ' +
          'last three months, plus a one-year stable-employment certificate; or investments or bank ' +
          'accounts with an average monthly balance of 680 días UMA over the last three months; or, for a ' +
          'person enrolled in higher education, 130 días UMA of monthly income over the last three ' +
          'months; or arraigo, being a registered property deed at least two years old with two years of ' +
          'stable employment or business participation; or an invitation, where a private inviting body ' +
          'shows an average monthly balance of 2,290 días UMA over twelve months and public bodies and ' +
          'Sistema Educativo Nacional institutions are exempt. A reviewer must convert the applicable ' +
          'multiple at the UMA value in force on the day of the application and check it against the ' +
          'evidence.',
        es:
          'Cada cifra es un múltiplo de la UMA, que el INEGI publica cada enero para entrar en vigor el 1 ' +
          'de febrero, y Meridian no dispone de ese índice. El Trámite 1 de los Lineamientos de 2025 ' +
          'admite: empleo o pensión con ingresos mensuales libres de gravámenes mayores a 220 días UMA ' +
          'durante los últimos tres meses, más constancia de empleo estable de al menos un año; o ' +
          'inversiones o cuentas bancarias con saldo promedio mensual de 680 días UMA durante los últimos ' +
          'tres meses; o, para quien cursa educación superior, 130 días UMA de ingresos mensuales durante ' +
          'los últimos tres meses; o arraigo, mediante escritura inscrita con al menos dos años de ' +
          'antigüedad junto con dos años de empleo estable o de participación empresarial; o invitación, ' +
          'en cuyo caso la institución privada que invita acredita un saldo promedio mensual de 2,290 ' +
          'días UMA durante doce meses, quedando exentas las públicas y las del Sistema Educativo ' +
          'Nacional. Corresponde a una persona convertir el múltiplo aplicable al valor de la UMA vigente ' +
          'el día de la solicitud y contrastarlo con las pruebas.',
      },
      guidance: {
        en:
          'Meridian does not state a peso figure for this or any other Mexican threshold, and adding one ' +
          'would be wrong within a year. The rule is the multiple; the conversion belongs to the day the ' +
          'application is made.',
        es:
          'Meridian no fija una cifra en pesos ni para este umbral ni para ningún otro de los mexicanos, ' +
          'y añadirla sería incorrecto en menos de un año. La regla es el múltiplo; la conversión ' +
          'corresponde al día en que se presenta la solicitud.',
      },
    },
    {
      id: 'mx-vis-sp-not-irregular',
      kind: 'status',
      weight: 'material',
      citationIds: ['mx-lmigra-art-132', 'mx-lmigra-art-53'],
      label: {
        en: 'Not already present in Mexico without authorisation',
        es: 'No encontrarse ya en México en situación migratoria irregular',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
      guidance: {
        en:
          'A person already in Mexico without status does not obtain this condition by applying for a ' +
          'visitor visa. Their route is regularisation under arts. 132 to 136 — see the mx-regularizacion ' +
          'records, and note that art. 134.I gives only sixty natural days from the expiry of an ' +
          'authorised stay.',
        es:
          'Quien ya se encuentra en México sin estatus no obtiene esta condición solicitando una visa de ' +
          'visitante. Su vía es la regularización de los arts. 132 a 136 —véanse los registros ' +
          'mx-regularizacion— y conviene recordar que el art. 134.I concede solo sesenta días naturales ' +
          'desde el vencimiento de la estancia autorizada.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: [
      'mx-lmigra-art-52',
      'mx-lineamientos-tramites-2012-art-26',
      'mx-lmigra-art-53',
      'mx-reg-lnac-art-14',
    ],
    note: {
      en:
        'Art. 52.I sets a statutory ceiling of 180 uninterrupted days from entry. The days actually ' +
        'granted are set by the officer at the port of entry; Lineamientos 2012 art. 26 records 180 ' +
        'natural days as the standard authorisation, and the officer may grant less. Reglamento art. 103 ' +
        'allows the visa itself to be issued for up to ten years for frequent travellers and for ' +
        'researchers, artists, athletes and journalists of repute, but the stay per entry stays at 180 ' +
        'days. Two consequences follow that people are routinely surprised by. First, art. 53: a visitor ' +
        'may not change condición de estancia and must leave when the authorised period ends, unless the ' +
        'stay is on humanitarian grounds or there is a family link to a Mexican or to a foreigner with ' +
        'regular residence. Second, Reglamento de la Ley de Nacionalidad art. 14: residence for ' +
        'naturalisation is proved only with a residente temporal or residente permanente card, so ' +
        'repeated 180-day stays build no residence at all, however many years they run for.',
      es:
        'El art. 52.I fija un tope legal de 180 días ininterrumpidos desde la entrada. Los días que ' +
        'efectivamente se autorizan los determina la autoridad migratoria en el punto de internación; el ' +
        'art. 26 de los Lineamientos de 2012 registra 180 días naturales como autorización estándar, y ' +
        'puede concederse menos. El art. 103 del Reglamento permite expedir la visa hasta por diez años a ' +
        'viajeros frecuentes y a investigadores, artistas, deportistas y periodistas de renombre, pero la ' +
        'estancia por entrada sigue siendo de 180 días. De ahí se siguen dos consecuencias que suelen ' +
        'sorprender. Primera, el art. 53: el visitante no puede cambiar de condición de estancia y debe ' +
        'salir al concluir el periodo autorizado, salvo que se trate de razones humanitarias o exista ' +
        'vínculo con mexicano o con extranjero con residencia regular. Segunda, el art. 14 del Reglamento ' +
        'de la Ley de Nacionalidad: la residencia para naturalizarse solo se acredita con tarjeta de ' +
        'residente temporal o permanente, de modo que las estancias de 180 días repetidas no generan ' +
        'residencia alguna, por muchos años que se encadenen.',
    },
  },
  leadsTo: ['mx-regularizacion-documento-vencido'],
  reviewStatus: 'unreviewed',
};

export const mxVisitanteConPermisoRemunerado: Pathway = {
  id: 'mx-visitante-con-permiso-remunerado',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Visitor with permission to carry out paid activities',
    es: 'Visitante con permiso para realizar actividades remuneradas',
  },
  summary: {
    en:
      'Up to 180 uninterrupted days in Mexico with permission to work, for a person holding an offer of ' +
      'employment, an invitation from an authority or an academic, artistic, sporting or cultural ' +
      'institution under which they are paid in Mexico, or seasonal paid work under an inter-institutional ' +
      'agreement. The visa is applied for at INM, which authorises it, and issued by a consular office.',
    es:
      'Hasta 180 días ininterrumpidos en México con permiso para trabajar, para quien cuenta con una ' +
      'oferta de empleo, con una invitación de una autoridad o de una institución académica, artística, ' +
      'deportiva o cultural por la que perciba una remuneración en el país, o con trabajo remunerado por ' +
      'temporada estacional al amparo de acuerdos interinstitucionales. La visa se solicita ante el INM, ' +
      'que la autoriza, y la expide una oficina consular.',
  },
  citations: [lmigraArt52, lmigraArt40, lmigraArt41, lmigraArt53, visasT10, visasAcuerdo2026, regLmigraArt140, regLnacArt14],
  criteria: [
    {
      id: 'mx-vis-cp-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-52', 'mx-lineamientos-visas-2025-t10', 'mx-acuerdo-visas-2026'],
      label: {
        en: 'An offer of employment from an employer established in Mexico',
        es: 'Oferta de empleo de un empleador establecido en México',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'MX' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
        ],
      },
      humanReviewWhen: { op: 'not', of: { op: 'is_present', path: 'jobOffer' } },
      humanReviewReason: {
        en:
          'Art. 52.II has three grounds and only one of them is a job offer. The other two — an invitation ' +
          'from an authority or an academic, artistic, sporting or cultural institution under which the ' +
          'person is paid in Mexico, and seasonal paid work under an inter-institutional agreement with ' +
          'foreign entities — rest on documents Meridian does not model, so where no job offer is on file ' +
          'this criterion cannot be decided. A reviewer must establish which of the three grounds is ' +
          'relied on.',
        es:
          'El art. 52.II contempla tres supuestos y solo uno es la oferta de empleo. Los otros dos —la ' +
          'invitación de una autoridad o de una institución académica, artística, deportiva o cultural por ' +
          'la que se perciba remuneración en el país, y el trabajo remunerado por temporada estacional al ' +
          'amparo de acuerdos interinstitucionales con entidades extranjeras— se acreditan con documentos ' +
          'que Meridian no modela, de modo que si no consta oferta de empleo el criterio no puede ' +
          'resolverse. Corresponde a una persona determinar en cuál de los tres supuestos se ubica.',
      },
      guidance: {
        en:
          'This is one of the routes art. 41 sends to INM rather than to a consulate: INM authorises the ' +
          'visa and the consular office then issues it after an interview. The employer must hold a ' +
          'constancia de inscripción del empleador issued by INM, and since the Acuerdo of 2026-05-15 the ' +
          'offer must state the occupation under the Sistema Nacional de Clasificación de Ocupaciones, ' +
          'the work modality, every address where the work will be done, and the amount and periodicity ' +
          'of the remuneration. Reglamento art. 140: a work permission is not a professional licence and ' +
          'a regulated occupation still needs its own authorisation.',
        es:
          'Esta es una de las vías que el art. 41 remite al INM y no a la oficina consular: el INM ' +
          'autoriza la visa y la oficina consular la expide tras la entrevista. El empleador debe contar ' +
          'con constancia de inscripción del empleador emitida por el INM y, desde el Acuerdo de ' +
          '2026-05-15, la oferta debe indicar la ocupación conforme al Sistema Nacional de Clasificación ' +
          'de Ocupaciones, la modalidad de trabajo, todos los domicilios donde se prestará y el monto y la ' +
          'periodicidad de la remuneración. Art. 140 del Reglamento: el permiso de trabajo no es una ' +
          'licencia profesional y toda ocupación regulada requiere además su propia autorización.',
      },
    },
    {
      id: 'mx-vis-cp-not-irregular',
      kind: 'status',
      weight: 'material',
      citationIds: ['mx-lmigra-art-53'],
      label: {
        en: 'Not already present in Mexico without authorisation',
        es: 'No encontrarse ya en México en situación migratoria irregular',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
      guidance: {
        en:
          'A person already in Mexico without status must use the regularisation chapter, not a visa ' +
          'application. A person in Mexico as a visitante is barred by art. 53 from changing condición de ' +
          'estancia and would have to leave and apply from abroad.',
        es:
          'Quien ya se encuentra en México sin estatus debe acudir al capítulo de regularización, no a ' +
          'una solicitud de visa. Quien se encuentra en México como visitante tiene vedado por el art. 53 ' +
          'el cambio de condición de estancia y tendría que salir y solicitar desde el extranjero.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: [
      'mx-lmigra-art-52',
      'mx-lmigra-art-41',
      'mx-lmigra-art-40',
      'mx-reg-lnac-art-14',
      'mx-reg-lmigra-art-140',
    ],
    note: {
      en:
        'Art. 52.II sets the same 180-day ceiling as the unpaid visitor condition. The work permission is ' +
        'tied to the activity in the offer or invitation. Time on any visitor condition builds no ' +
        'residence for naturalisation: Reglamento de la Ley de Nacionalidad art. 14 accepts only a ' +
        'residente temporal or residente permanente card.',
      es:
        'El art. 52.II fija el mismo tope de 180 días que el visitante sin permiso. El permiso de trabajo ' +
        'queda vinculado a la actividad señalada en la oferta o en la invitación. El tiempo bajo ' +
        'cualquier condición de visitante no genera residencia para la naturalización: el art. 14 del ' +
        'Reglamento de la Ley de Nacionalidad solo admite tarjeta de residente temporal o permanente.',
    },
  },
  leadsTo: ['mx-regularizacion-documento-vencido'],
  reviewStatus: 'unreviewed',
};

export const mxVisitanteRegional: Pathway = {
  id: 'mx-visitante-regional',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'Regional visitor (Tarjeta de Visitante Regional)',
    es: 'Visitante regional (Tarjeta de Visitante Regional)',
  },
  summary: {
    en:
      'A five-year multiple-entry card for nationals of Guatemala, Belize, El Salvador and Honduras, and ' +
      'for foreigners permanently resident in those countries, allowing repeated entry into the frontier ' +
      'region — all cities and municipalities of Campeche, Chiapas, Tabasco, Quintana Roo and Yucatán — ' +
      'with each stay not exceeding seven days and with no permission to receive remuneration in Mexico. ' +
      'Applied for in person at a land port of entry or an INM-enabled location and decided immediately.',
    es:
      'Tarjeta de cinco años y entradas múltiples para nacionales de Guatemala, Belice, El Salvador y ' +
      'Honduras, y para extranjeros con residencia permanente en esos países, que permite entrar ' +
      'repetidamente a la región fronteriza —todas las ciudades y municipios de Campeche, Chiapas, ' +
      'Tabasco, Quintana Roo y Yucatán— sin que cada permanencia exceda de siete días y sin permiso para ' +
      'recibir remuneración en el país. Se solicita de manera personal en un punto de internación ' +
      'terrestre o en lugares habilitados por el INM y se resuelve de inmediato.',
  },
  citations: [lmigraArt52, lmigraArt61, regLmigraArt154, tramitesArt72, regLnacArt14],
  criteria: [
    {
      id: 'mx-vis-reg-qualifying-nationality',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-52', 'mx-lineamientos-tramites-2012-art-72'],
      label: {
        en: 'Nationality of Guatemala, Belize, El Salvador or Honduras',
        es: 'Nacionalidad de Guatemala, Belice, El Salvador u Honduras',
      },
      evaluator: { op: 'one_of', path: 'claimedNationality', values: ['GT', 'BZ', 'SV', 'HN'] },
      humanReviewWhen: {
        op: 'not',
        of: { op: 'one_of', path: 'claimedNationality', values: ['GT', 'BZ', 'SV', 'HN'] },
      },
      humanReviewReason: {
        en:
          'Art. 72 of the 2012 Lineamientos, as reformed on 2019-04-23, extends the condition beyond ' +
          'nationals of those four states to FOREIGNERS PERMANENTLY RESIDENT IN THEM, and Meridian holds ' +
          'no fact recording permanent residence in a third country. A national of any other state may ' +
          'still qualify on that basis, so the criterion escalates rather than refusing.',
        es:
          'El art. 72 de los Lineamientos de 2012, reformado el 2019-04-23, extiende la condición más ' +
          'allá de los nacionales de esos cuatro Estados a los EXTRANJEROS CON RESIDENCIA PERMANENTE EN ' +
          'ELLOS, y Meridian no registra la residencia permanente en un tercer país. Un nacional de otro ' +
          'Estado puede seguir cumpliendo por esa vía, por lo que el criterio se remite a revisión en ' +
          'lugar de rechazar.',
      },
      guidance: {
        en:
          'The statute says "el extranjero nacional o residente de los países vecinos". El Salvador and ' +
          'Honduras do not border Mexico; they were added administratively in 2019 by reference to the ' +
          'Mexico-Central America free trade agreement and a 2018 four-state declaration. The list is ' +
          'therefore administrative practice and must not be generalised to any other state.',
        es:
          'La Ley dice «el extranjero nacional o residente de los países vecinos». El Salvador y Honduras ' +
          'no colindan con México; se añadieron por vía administrativa en 2019 con apoyo en el tratado de ' +
          'libre comercio México-Centroamérica y en una declaración de cuatro Estados de 2018. La lista ' +
          'es, por tanto, práctica administrativa y no debe generalizarse a ningún otro Estado.',
      },
    },
    {
      id: 'mx-vis-reg-no-remuneration',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-52'],
      label: {
        en: 'No remuneration will be received in Mexico',
        es: 'No se recibirá remuneración en México',
      },
      evaluator: { op: 'is_true', path: 'intent.noEconomicActivityInTargetState' },
      guidance: {
        en:
          'Paid work in the frontier region needs the visitante trabajador fronterizo condition instead, ' +
          'which is a different card, a different nationality list and a different set of states.',
        es:
          'El trabajo remunerado en la región fronteriza exige la condición de visitante trabajador ' +
          'fronterizo, que es otra tarjeta, otra lista de nacionalidades y otro conjunto de entidades ' +
          'federativas.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 60,
    countsTowardNaturalisation: false,
    citationIds: ['mx-lmigra-art-52', 'mx-reg-lmigra-art-154', 'mx-lmigra-art-61', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'The card runs for five years from issue with multiple entries; the sixty months above is the ' +
        'card, not the stay. THE PERMITTED STAY PER VISIT IS SEVEN DAYS, and there is a live conflict ' +
        'about it: art. 52.III has said seven days since the reform of DOF 2017-05-19, while Reglamento ' +
        'arts. 133.I.b) and 154 and Lineamientos 2012 art. 27 still say three natural days. The Reglamento ' +
        'has not been amended since DOF 2014-05-23 and the statute has moved since; the later and higher ' +
        'instrument governs, and INM own 2019 acuerdo and its current public page both state seven. Seven ' +
        'is what this record encodes. Art. 61 forbids holding two condiciones de estancia at once: a ' +
        'holder who separately obtains an ordinary visitor permission to travel beyond the frontier ' +
        'region must make each entry, stay and exit under one condition only, and using the other ' +
        'mid-stay cancels both documents.',
      es:
        'La tarjeta tiene una vigencia de hasta cinco años desde su expedición con entradas múltiples; ' +
        'los sesenta meses indicados corresponden a la tarjeta, no a la estancia. LA PERMANENCIA ' +
        'AUTORIZADA POR VISITA ES DE SIETE DÍAS, y hay un conflicto vivo al respecto: el art. 52.III dice ' +
        'siete días desde la reforma del DOF 2017-05-19, mientras que los arts. 133.I.b) y 154 del ' +
        'Reglamento y el art. 27 de los Lineamientos de 2012 siguen diciendo tres días naturales. El ' +
        'Reglamento no se reforma desde el DOF 2014-05-23 y la Ley sí ha cambiado; rige el instrumento ' +
        'posterior y de mayor jerarquía, y tanto el acuerdo del INM de 2019 como su página pública actual ' +
        'señalan siete. Siete es lo que codifica este registro. El art. 61 prohíbe tener dos condiciones ' +
        'de estancia simultáneamente: quien además obtenga un permiso ordinario de visitante para viajar ' +
        'más allá de la región fronteriza debe realizar cada entrada, estancia y salida al amparo de una ' +
        'sola condición, y usar la otra a mitad de la estancia cancela ambos documentos.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const mxVisitanteTrabajadorFronterizo: Pathway = {
  id: 'mx-visitante-trabajador-fronterizo',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Frontier worker visitor (Tarjeta de Visitante Trabajador Fronterizo)',
    es: 'Visitante trabajador fronterizo (Tarjeta de Visitante Trabajador Fronterizo)',
  },
  summary: {
    en:
      'A one-year multiple-entry card carrying permission to work, for Guatemalan and Belizean nationals ' +
      'aged sixteen or over who hold a job offer, valid for entry, transit and paid work in Campeche, ' +
      'Chiapas, Quintana Roo and Tabasco. The work permission is tied to the occupation in the offer.',
    es:
      'Tarjeta de un año y entradas múltiples con permiso para trabajar, para nacionales guatemaltecos y ' +
      'beliceños de dieciséis años o más que cuenten con una oferta de empleo, válida para ingresar, ' +
      'transitar y trabajar a cambio de una remuneración en Campeche, Chiapas, Quintana Roo y Tabasco. El ' +
      'permiso de trabajo queda vinculado a la ocupación señalada en la oferta.',
  },
  citations: [lmigraArt52, regLmigraArt155, tramitesArt75, regLmigraArt140, regLnacArt14],
  criteria: [
    {
      id: 'mx-vis-tf-qualifying-nationality',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-52', 'mx-lineamientos-tramites-2012-art-75'],
      label: {
        en: 'Nationality of Guatemala or Belize',
        es: 'Nacionalidad de Guatemala o Belice',
      },
      evaluator: { op: 'one_of', path: 'claimedNationality', values: ['GT', 'BZ'] },
      guidance: {
        en:
          'Art. 52.IV confers the condition on nationals of countries sharing a land border with Mexico; ' +
          'art. 75 of the 2012 Lineamientos narrows it operationally to Guatemala and Belize. THIS IS NOT ' +
          'THE SAME LIST AS THE VISITANTE REGIONAL: the 2019 acuerdo extended that one to El Salvador and ' +
          'Honduras and did not touch art. 75. Whether that was deliberate or an oversight, and what INM ' +
          'does in practice, could not be established.',
        es:
          'El art. 52.IV concede la condición a los nacionales de los países con los que México comparte ' +
          'límites territoriales; el art. 75 de los Lineamientos de 2012 la acota operativamente a ' +
          'Guatemala y Belice. NO ES LA MISMA LISTA QUE LA DEL VISITANTE REGIONAL: el acuerdo de 2019 ' +
          'amplió aquella a El Salvador y Honduras y no tocó el art. 75. Si fue deliberado o un descuido, ' +
          'y qué hace el INM en la práctica, no pudo establecerse.',
      },
    },
    {
      id: 'mx-vis-tf-minimum-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lineamientos-tramites-2012-art-75'],
      label: {
        en: 'Aged sixteen or over',
        es: 'Tener dieciséis años o más',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 16 },
    },
    {
      id: 'mx-vis-tf-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['mx-lineamientos-tramites-2012-art-75', 'mx-lmigra-art-52'],
      label: {
        en: 'A job offer for work in the authorised states',
        es: 'Oferta de empleo para trabajar en las entidades federativas autorizadas',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_present', path: 'jobOffer' },
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'MX' },
        ],
      },
      guidance: {
        en:
          'The condition permits work only in Campeche, Chiapas, Quintana Roo and Tabasco, and only in ' +
          'the occupation the offer names. Meridian does not hold the state the work will be performed ' +
          'in, so this criterion checks only that an offer from an employer in Mexico is on file. The ' +
          'authorisation is also subject to any quotas set jointly with the Secretaría de Trabajo y ' +
          'Previsión Social and published in the DOF. Reglamento art. 134 additionally permits the entry ' +
          'of a spouse or partner and their minor children.',
        es:
          'La condición permite trabajar únicamente en Campeche, Chiapas, Quintana Roo y Tabasco, y solo ' +
          'en la ocupación que señale la oferta. Meridian no registra la entidad federativa donde se ' +
          'prestará el trabajo, por lo que este criterio solo comprueba que consta una oferta de un ' +
          'empleador en México. La autorización queda además sujeta a las cuotas que en su caso se ' +
          'determinen conjuntamente con la Secretaría de Trabajo y Previsión Social y se publiquen en el ' +
          'DOF. El art. 134 del Reglamento permite además el ingreso del cónyuge o concubino y de sus ' +
          'hijos menores de edad.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    countsTowardNaturalisation: false,
    citationIds: ['mx-lmigra-art-52', 'mx-reg-lmigra-art-155', 'mx-reg-lnac-art-14', 'mx-reg-lmigra-art-140'],
    note: {
      en:
        'Art. 52.IV authorises a stay of up to one year in the states the Secretaría determines, and ' +
        'Reglamento art. 155 gives the card one year from issue with multiple entries. Time on this ' +
        'condition builds no residence for naturalisation. A work permission is not a professional ' +
        'licence: a regulated occupation still needs its own authorisation from the competent Mexican ' +
        'authority.',
      es:
        'El art. 52.IV autoriza permanecer hasta por un año en las entidades federativas que determine la ' +
        'Secretaría, y el art. 155 del Reglamento otorga a la tarjeta una vigencia de un año desde su ' +
        'expedición con entradas múltiples. El tiempo bajo esta condición no genera residencia para la ' +
        'naturalización. El permiso de trabajo no es una licencia profesional: toda ocupación regulada ' +
        'requiere además su propia autorización de la autoridad mexicana competente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const mxVisitanteRazonesHumanitarias: Pathway = {
  id: 'mx-visitante-razones-humanitarias',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Visitor on humanitarian grounds',
    es: 'Visitante por razones humanitarias',
  },
  summary: {
    en:
      'A renewable stay carrying permission to work and multiple entries, for the injured party, victim or ' +
      'witness of a crime committed in Mexico; for a migrant child or adolescent under art. 74, whose ' +
      'authorisation must be immediate and may not be conditioned on any document or fee; and for an ' +
      'applicant for political asylum, refugee recognition or complementary protection while their status ' +
      'is resolved. SEGOB may also authorise it where a humanitarian cause or the public interest makes ' +
      'entry or regularisation necessary. This is a migration status, not a protection status: Meridian ' +
      'assesses no protection claim.',
    es:
      'Estancia renovable con permiso para trabajar y entradas múltiples, para el ofendido, la víctima o ' +
      'el testigo de un delito cometido en territorio nacional; para la niña, niño o adolescente migrante ' +
      'en términos del art. 74, cuya autorización debe ser inmediata y no puede condicionarse a documento ' +
      'alguno ni al pago de derechos; y para quien solicita asilo político, el reconocimiento de la ' +
      'condición de refugiado o protección complementaria, hasta en tanto se resuelva su situación ' +
      'migratoria. La Secretaría puede además autorizarla cuando exista causa humanitaria o de interés ' +
      'público. Es una condición migratoria, no una condición de protección: Meridian no evalúa ninguna ' +
      'solicitud de protección.',
  },
  citations: [lmigraArt52, regLmigraArt141, regLmigraArt153, tramitesArt50, lrpcap, comar, regLnacArt14],
  criteria: [
    {
      id: 'mx-vis-hum-ground',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-52', 'mx-reg-lmigra-art-141'],
      label: {
        en: 'One of the humanitarian grounds in art. 52.V applies',
        es: 'Se actualiza alguno de los supuestos humanitarios del art. 52.V',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Every ground turns on a determination by somebody other than this engine: that a competent ' +
          'authority has identified the person as the injured party, victim or witness of a crime ' +
          'committed in Mexico; that the person is a migrant child or adolescent under art. 74; that a ' +
          'protection procedure is pending; or that SEGOB has found a humanitarian cause or public ' +
          'interest. Meridian holds none of those facts and must not infer any of them. A reviewer must ' +
          'establish which ground is relied on and by whose determination.',
        es:
          'Todos los supuestos dependen de una determinación ajena a este motor: que una autoridad ' +
          'competente identifique a la persona como ofendida, víctima o testigo de un delito cometido en ' +
          'territorio nacional; que se trate de niña, niño o adolescente migrante en términos del art. 74; ' +
          'que exista un procedimiento de protección en trámite; o que la Secretaría aprecie una causa ' +
          'humanitaria o de interés público. Meridian no dispone de ninguno de esos hechos y no debe ' +
          'inferirlos. Corresponde a una persona determinar en qué supuesto se ubica y por decisión de ' +
          'qué autoridad.',
      },
      guidance: {
        en:
          'For the victim or witness ground, art. 52.V(a) authorises the stay until the process concludes ' +
          'with multiple entries and a work permission, after which the person must leave or seek a new ' +
          'condición de estancia, and may apply for residente permanente. Reglamento art. 141.III also ' +
          'permits a person already holding any visitor condition to change to this one on the listed ' +
          'grounds, which is one of the two exceptions art. 53 carves out of the bar on changing status.',
        es:
          'En el supuesto de ofendido, víctima o testigo, el art. 52.V(a) autoriza permanecer hasta que ' +
          'concluya el proceso, con entradas múltiples y permiso para trabajar; al término, la persona ' +
          'debe salir o solicitar una nueva condición de estancia, y podrá solicitar la de residente ' +
          'permanente. El art. 141.III del Reglamento permite además que quien ya tiene cualquier ' +
          'condición de visitante cambie a esta por los supuestos enumerados, que es una de las dos ' +
          'excepciones que el art. 53 abre a la prohibición de cambiar de condición.',
      },
    },
    {
      id: 'mx-vis-hum-protection-claim-out-of-scope',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lrpcap-art-13-18', 'mx-comar'],
      label: {
        en: 'A pending protection claim is assessed by COMAR or the SRE, never here',
        es: 'La solicitud de protección la resuelve la COMAR o la SRE, nunca este motor',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Ground (c) of art. 52.V is entirely parasitic on a procedure that is out of scope for this ' +
          'catalog. Recognition of refugee status and complementary protection are decided by the ' +
          'Comisión Mexicana de Ayuda a Refugiados and political asylum by the Secretaría de Relaciones ' +
          'Exteriores. Meridian does not assess whether a fear is well-founded, does not rank protection ' +
          'against a migration route, and states no likelihood of recognition. Anyone in this position ' +
          'needs qualified help immediately, because Ley sobre Refugiados art. 18 sets a filing deadline ' +
          'of thirty WORKING days from the day after entry, or from the day it first became materially ' +
          'possible to file.',
        es:
          'El supuesto (c) del art. 52.V depende por completo de un procedimiento que queda fuera del ' +
          'alcance de este catálogo. El reconocimiento de la condición de refugiado y la protección ' +
          'complementaria los resuelve la Comisión Mexicana de Ayuda a Refugiados, y el asilo político la ' +
          'Secretaría de Relaciones Exteriores. Meridian no valora si un temor está fundado, no jerarquiza ' +
          'la protección frente a una vía migratoria y no expresa probabilidad alguna de reconocimiento. ' +
          'Quien se encuentre en esta situación necesita ayuda cualificada de inmediato, porque el ' +
          'art. 18 de la Ley sobre Refugiados fija un plazo de treinta días HÁBILES contados desde el día ' +
          'hábil siguiente al ingreso, o desde aquel en que le haya sido materialmente posible presentarla.',
      },
      guidance: {
        en:
          'The competent body is COMAR, https://www.gob.mx/comar. On a positive decision the person ' +
          'receives residente permanente under art. 54.I. Both of those propositions are recorded here; ' +
          'neither the claim nor its prospects is assessed here.',
        es:
          'El órgano competente es la COMAR, https://www.gob.mx/comar. Si la resolución es positiva, la ' +
          'persona obtiene la condición de residente permanente conforme al art. 54.I. Aquí se deja ' +
          'constancia de ambas cosas; ni la solicitud ni sus perspectivas se evalúan aquí.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    countsTowardNaturalisation: false,
    citationIds: [
      'mx-lmigra-art-52',
      'mx-reg-lmigra-art-153',
      'mx-lineamientos-tramites-2012-art-50',
      'mx-reg-lnac-art-14',
    ],
    note: {
      en:
        'Reglamento art. 153 allows as many renewals as are necessary until the process or the cause that ' +
        'gave rise to the condition concludes; the twelve months is the card, not a ceiling on the stay. ' +
        'The trámite is exempt from the fee under art. 16 of the Ley Federal de Derechos. Art. 52.V(a) ' +
        'says that after the process concludes a victim or witness may apply for residente permanente; ' +
        'that bridge has no counterpart fraction in art. 54 and is therefore recorded here rather than as ' +
        'a leadsTo link, because Meridian will not name a target route it cannot cite. Time on this ' +
        'condition builds no residence for naturalisation, which is a consequence of Reglamento de la Ley ' +
        'de Nacionalidad art. 14 rather than of anything about the person.',
      es:
        'El art. 153 del Reglamento permite tantas renovaciones como sean necesarias hasta que concluya ' +
        'el proceso o la causa que originó la condición; los doce meses corresponden a la tarjeta, no a ' +
        'un tope de la estancia. El trámite está exento de pago conforme al art. 16 de la Ley Federal de ' +
        'Derechos. El art. 52.V(a) señala que, al concluir el proceso, el ofendido, víctima o testigo ' +
        'podrá solicitar la condición de residente permanente; ese puente no tiene fracción correlativa ' +
        'en el art. 54, por lo que se deja aquí y no como enlace leadsTo: Meridian no nombra una vía de ' +
        'destino que no pueda citar. El tiempo bajo esta condición no genera residencia para la ' +
        'naturalización, lo que deriva del art. 14 del Reglamento de la Ley de Nacionalidad y no de nada ' +
        'relativo a la persona.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const mxVisitanteAdopcion: Pathway = {
  id: 'mx-visitante-adopcion',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'entry_facilitation',
  status: 'open',
  name: {
    en: 'Visitor for adoption purposes',
    es: 'Visitante con fines de adopción',
  },
  summary: {
    en:
      'Authorises a foreigner engaged in an adoption in Mexico to remain until the judgment is final and, ' +
      'where applicable, the adopted child new birth record is registered, the passport is issued and ' +
      'every step needed to guarantee the child departure is complete. Available only to citizens of ' +
      'countries with which Mexico has signed a convention on the matter.',
    es:
      'Autoriza a la persona extranjera vinculada con un proceso de adopción en México a permanecer hasta ' +
      'que se dicte la resolución ejecutoriada y, en su caso, se inscriba en el registro civil la nueva ' +
      'acta del niño, niña o adolescente adoptado, se expida el pasaporte respectivo y se completen todos ' +
      'los trámites necesarios para garantizar su salida del país. Solo procede respecto de ciudadanos de ' +
      'países con los que México haya suscrito algún convenio en la materia.',
  },
  citations: [lmigraArt52, visasT4, lmigraArt59, tramitesArt32, regLnacArt14],
  criteria: [
    {
      id: 'mx-vis-ado-convention-country',
      kind: 'nationality',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-52'],
      label: {
        en: 'Citizenship of a country with which Mexico has signed a convention on adoption',
        es: 'Ciudadanía de un país con el que México haya suscrito un convenio en materia de adopción',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 52.VI limits this condition to citizens of countries with which Mexico has signed a ' +
          'convention on the matter, and no dated, canonical list of those countries was located. ' +
          'Guessing at one would be inventing the substantive gate of the entire route. A reviewer must ' +
          'confirm the convention position for the specific country before anything is relied on.',
        es:
          'El art. 52.VI limita esta condición a los ciudadanos de países con los que México haya ' +
          'suscrito algún convenio en la materia, y no se localizó una lista canónica y fechada de esos ' +
          'países. Suponerla equivaldría a inventar el requisito sustantivo de toda la vía. Corresponde a ' +
          'una persona confirmar la situación convencional del país concreto antes de fundar nada en ' +
          'ella.',
      },
    },
    {
      id: 'mx-vis-ado-adoption-process',
      kind: 'procedural',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-52', 'mx-lineamientos-visas-2025-t4'],
      label: {
        en: 'A live adoption process in Mexico that the applicant is party to',
        es: 'Proceso de adopción en trámite en México en el que la persona solicitante es parte',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Whether an adoption is under way, and what stage it has reached, are facts held by a Mexican ' +
          'court and by the child-protection authorities. Meridian models nothing about adoption ' +
          'proceedings and must not appear to.',
        es:
          'Si hay una adopción en curso, y en qué etapa se encuentra, son hechos que constan ante un ' +
          'órgano jurisdiccional mexicano y ante las autoridades de protección de la niñez. Meridian no ' +
          'modela nada sobre procedimientos de adopción y no debe aparentar lo contrario.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    countsTowardNaturalisation: false,
    citationIds: [
      'mx-lmigra-art-52',
      'mx-lmigra-art-59',
      'mx-lineamientos-tramites-2012-art-32',
      'mx-reg-lnac-art-14',
    ],
    note: {
      en:
        'The statutory stay runs until the adoption is complete and the child departure is secured, so ' +
        'the twelve months above is the card issued on exchanging the entry FMM, not a ceiling on the ' +
        'stay: Lineamientos 2012 art. 32 gives it one year counted from entry and art. 34 renews it for ' +
        'one year at a time. The card must be applied for within thirty natural days of entry, which is ' +
        'art. 59 and is easy to miss. Time on this condition builds no residence for naturalisation.',
      es:
        'La estancia legal se extiende hasta que la adopción concluya y quede garantizada la salida del ' +
        'niño, niña o adolescente, de modo que los doce meses indicados corresponden a la tarjeta que se ' +
        'expide al canjear la FMM de internación y no a un tope de la estancia: el art. 32 de los ' +
        'Lineamientos de 2012 le da un año contado a partir de la internación y el art. 34 la renueva ' +
        'anualmente. La tarjeta debe solicitarse dentro de los treinta días naturales siguientes al ' +
        'ingreso, que es el art. 59 y se pasa por alto con facilidad. El tiempo bajo esta condición no ' +
        'genera residencia para la naturalización.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residente temporal — art. 52 fractions VII and VIII
// ---------------------------------------------------------------------------

export const mxResidenteTemporalConsular: Pathway = {
  id: 'mx-residente-temporal-consular',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Temporary residence — consular route',
    es: 'Residencia temporal — vía consular',
  },
  summary: {
    en:
      'Residence in Mexico for a period longer than 180 days and no longer than four years, applied for at ' +
      'a Mexican consular office abroad on one of the grounds of Trámite 5 of the 2025 Lineamientos: ' +
      'economic solvency, real property in Mexico, investment, an invitation for an unpaid activity, ' +
      'scientific research in Mexican waters, an international mobility instrument, family unity, or ' +
      'high-specialisation technical assistance. The visa is a 180-day single-entry travel authorisation; ' +
      'the condición de estancia is granted on entry and the card must be obtained from INM within thirty ' +
      'natural days. A residente temporal is NOT automatically allowed to work.',
    es:
      'Residencia en México por un tiempo mayor a 180 días y no mayor a cuatro años, solicitada ante una ' +
      'oficina consular de México en el extranjero por alguno de los supuestos del Trámite 5 de los ' +
      'Lineamientos de 2025: solvencia económica, bienes inmuebles en territorio nacional, inversión, ' +
      'invitación para una actividad no remunerada, investigación científica en aguas jurisdiccionales ' +
      'mexicanas, instrumento internacional de movilidad, unidad familiar o asistencia técnica de alta ' +
      'especialidad. La visa es una autorización de viaje de 180 días y una sola entrada; la condición de ' +
      'estancia se autoriza al ingresar y la tarjeta debe tramitarse ante el INM dentro de los treinta ' +
      'días naturales siguientes. El residente temporal NO tiene permiso automático para trabajar.',
  },
  citations: [
    lmigraArt52,
    lmigraArt53,
    lmigraArt59,
    lmigraArt40,
    regLmigraArt138,
    regLmigraArt156,
    visasT5,
    visasAcuerdo2026,
    tramitesArt32,
    regLnacArt14,
    cpeumArt26b,
    uma2026,
    ldvuma,
  ],
  criteria: [
    {
      id: 'mx-rt-con-art-53-bar',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-53'],
      label: {
        en: 'Not present in Mexico as a visitante seeking to convert',
        es: 'No encontrarse en México como visitante buscando el cambio de condición',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'visitor' } },
      guidance: {
        en:
          'Art. 53 is the rule applicants least expect: a visitante may not change condición de estancia ' +
          'and must leave when the authorised period ends, unless the stay is on humanitarian grounds or ' +
          'there is a family link to a Mexican or to a foreigner with regular residence in Mexico. ' +
          'Arriving as a tourist and converting to residence is barred by statute, not merely difficult ' +
          'in practice. Two things follow. If you hold a Mexican visitor permit today, this route is ' +
          'closed to you until you leave the country — the consular application is made from abroad. And ' +
          'if you do have a qualifying family link, the route is not this one: see ' +
          'mx-residente-temporal-unidad-familiar, or, if you are already in Mexico without status, ' +
          'mx-regularizacion-vinculo-familiar.',
        es:
          'El art. 53 es la regla que menos se espera: el visitante no puede cambiar de condición de ' +
          'estancia y debe salir del país al concluir el periodo autorizado, salvo que se trate de ' +
          'razones humanitarias o exista vínculo con mexicano o con extranjero con residencia regular en ' +
          'México. Entrar como turista y convertirse en residente está prohibido por la Ley, no ' +
          'simplemente es difícil en la práctica. De ahí se siguen dos cosas. Si hoy tiene un permiso ' +
          'mexicano de visitante, esta vía le está cerrada hasta que salga del país: la solicitud ' +
          'consular se presenta desde el extranjero. Y si sí existe un vínculo familiar cualificado, la ' +
          'vía no es esta: véase mx-residente-temporal-unidad-familiar o, si ya se encuentra en México ' +
          'sin estatus, mx-regularizacion-vinculo-familiar.',
      },
    },
    {
      id: 'mx-rt-con-qualifying-ground',
      kind: 'economic',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: [
        'mx-reg-lmigra-art-138',
        'mx-lineamientos-visas-2025-t5',
        'mx-acuerdo-visas-2026',
        'mx-cpeum-art-26b-uma',
        'mx-uma-2026',
        'mx-ldvuma-arts-4-5',
      ],
      label: {
        en: 'One of the grounds of Trámite 5, most of which are multiples of the UMA',
        es: 'Alguno de los supuestos del Trámite 5, la mayoría expresados en múltiplos de la UMA',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Meridian holds no UMA index, and the Mexican thresholds are multiples of the DAILY UMA where ' +
          'ReferenceIndices carries only the Spanish annual IPREM and SMI — reusing one for the other ' +
          'would compare quantities of different shapes. Trámite 5 accepts: solvencia económica, being an ' +
          'average monthly balance of 11,460 días UMA over the last twelve months, or employment or ' +
          'pension income free of encumbrances greater than 680 días UMA monthly over the last six ' +
          'months; real property in Mexico of a value exceeding 91,710 días UMA; investment, being ' +
          'participation in the share capital of a Mexican company exceeding 45,850 días UMA, or fixed ' +
          'assets of the same value, or documented business activity including an IMSS certificate of at ' +
          'least three employees; an invitation, where a private inviting body shows 22,920 días UMA over ' +
          'twelve months and, if the host does not cover maintenance, the applicant shows 11,460 días UMA ' +
          'over twelve months or 450 días UMA of monthly income over six months; scientific research in ' +
          'Mexican jurisdictional waters; an international mobility instrument; family unity; and, since ' +
          'the Acuerdo of 2026-05-15, high-specialisation technical assistance in a strategic project, ' +
          'WHICH CARRIES NO MONETARY THRESHOLD AT ALL and turns instead on a carta responsiva and a ' +
          'knowledge-transfer commitment from a Mexican legal person. A reviewer must identify the ground ' +
          'relied on and, where it is monetary, convert the multiple at the UMA value in force on the day ' +
          'of the application.',
        es:
          'Meridian no dispone del índice UMA, y los umbrales mexicanos son múltiplos de la UMA DIARIA ' +
          'mientras que ReferenceIndices solo lleva el IPREM y el SMI anuales españoles: reutilizar uno ' +
          'por otro compararía magnitudes de distinta naturaleza. El Trámite 5 admite: solvencia ' +
          'económica, mediante saldo promedio mensual de 11,460 días UMA durante los últimos doce meses, ' +
          'o empleo o pensión con ingresos mensuales libres de gravámenes mayores a 680 días UMA durante ' +
          'los últimos seis meses; bienes inmuebles en territorio nacional con valor que exceda de 91,710 ' +
          'días UMA; inversión, mediante participación en el capital social de una persona moral mexicana ' +
          'que exceda de 45,850 días UMA, o bienes muebles o activos fijos por ese mismo valor, o ' +
          'actividad empresarial documentada incluida constancia del IMSS de al menos tres trabajadores; ' +
          'invitación, en la que la institución privada acredita 22,920 días UMA durante doce meses y, si ' +
          'no cubre la manutención, la persona solicitante acredita 11,460 días UMA durante doce meses o ' +
          '450 días UMA de ingresos mensuales durante seis meses; investigación científica en aguas ' +
          'jurisdiccionales mexicanas; instrumento jurídico internacional de movilidad; unidad familiar; ' +
          'y, desde el Acuerdo de 2026-05-15, asistencia técnica de alta especialidad en un proyecto ' +
          'estratégico, QUE NO LLEVA UMBRAL MONETARIO ALGUNO y depende de una carta responsiva y de un ' +
          'compromiso de transferencia de conocimientos de una persona moral mexicana. Corresponde a una ' +
          'persona identificar el supuesto invocado y, cuando sea monetario, convertir el múltiplo al ' +
          'valor de la UMA vigente el día de la solicitud.',
      },
      guidance: {
        en:
          'These are the CONSULAR figures. The same-sounding tests at an INM counter are different ' +
          'numbers from a different instrument — 20,000 días and 400 días for solvency under art. 52 of ' +
          'the 2012 Lineamientos — because the threshold attaches to the application channel and not to ' +
          'the status. Do not carry a figure across from one to the other.',
        es:
          'Estas son las cifras CONSULARES. Las pruebas de nombre semejante ante una ventanilla del INM ' +
          'son otras cifras de otro instrumento —20,000 días y 400 días de solvencia conforme al art. 52 ' +
          'de los Lineamientos de 2012— porque el umbral se adhiere al canal de solicitud y no a la ' +
          'condición de estancia. No traslade una cifra de un instrumento al otro.',
      },
    },
    {
      id: 'mx-rt-con-work-permission-not-automatic',
      kind: 'employment',
      weight: 'informational',
      citationIds: ['mx-lmigra-art-52', 'mx-lmigra-art-40'],
      label: {
        en: 'A work permission would be needed and is tied to a job offer',
        es: 'El permiso para trabajar sería necesario y queda sujeto a una oferta de empleo',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
      guidance: {
        en:
          'Art. 52.VII gives a residente temporal only "la posibilidad de obtener un permiso para ' +
          'trabajar … sujeto a una oferta de empleo", and art. 40 says no visa carries permission to work ' +
          'unless the document says so expressly. Holding this status is not permission to work. This ' +
          'criterion records whether a job offer is on file and affects no verdict; where the plan is to ' +
          'work from the outset, the route is mx-residente-temporal-oferta-empleo, which is filed at INM.',
        es:
          'El art. 52.VII concede al residente temporal solo «la posibilidad de obtener un permiso para ' +
          'trabajar … sujeto a una oferta de empleo», y el art. 40 señala que ninguna visa otorga permiso ' +
          'de trabajo salvo que el documento lo diga expresamente. Tener esta condición no equivale a ' +
          'poder trabajar. Este criterio deja constancia de si consta una oferta de empleo y no incide en ' +
          'el resultado; si el propósito es trabajar desde el inicio, la vía es ' +
          'mx-residente-temporal-oferta-empleo, que se presenta ante el INM.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    countsTowardNaturalisation: true,
    citationIds: [
      'mx-lmigra-art-52',
      'mx-reg-lmigra-art-156',
      'mx-lineamientos-tramites-2012-art-32',
      'mx-lmigra-art-59',
      'mx-reg-lnac-art-14',
    ],
    note: {
      en:
        'Art. 52.VII sets a statutory maximum of four years for the condition as a whole. Reglamento ' +
        'art. 156 allows the card itself to run one, two, three or four years from the grant, allows ' +
        'renewals to be requested in the thirty natural days before expiry "hasta completar cuatro años ' +
        'contados a partir de que obtuvo la condición de estancia", and ties the card to the period of ' +
        'the job offer where a work permission is held. The four years are therefore a ceiling measured ' +
        'from the grant, not a renewable term. The twelve months above is INM practice on the exchange of ' +
        'the entry FMM for a card — Lineamientos 2012 art. 32 gives one year counted from entry, and ' +
        'art. 34 renews for one year, or two or three where there is continuidad laboral for the same ' +
        'period. Separately, art. 59 gives thirty natural days from entry to apply for the card at all. ' +
        'Time on this condition does count toward the residence for naturalisation, because Reglamento de ' +
        'la Ley de Nacionalidad art. 14 accepts a residente temporal card. No processing time is stated ' +
        'here: the ten working days in Trámite 5 is a statutory maximum for the consular decision, not a ' +
        'service standard, and INM publishes none.',
      es:
        'El art. 52.VII fija un máximo legal de cuatro años para la condición en su conjunto. El art. 156 ' +
        'del Reglamento permite que la tarjeta tenga vigencia de uno, dos, tres o cuatro años contados ' +
        'desde la autorización, permite solicitar renovaciones dentro de los treinta días naturales ' +
        'previos al vencimiento «hasta completar cuatro años contados a partir de que obtuvo la condición ' +
        'de estancia», y vincula la vigencia de la tarjeta a la de la oferta de empleo cuando hay permiso ' +
        'de trabajo. Los cuatro años son, por tanto, un tope contado desde la autorización y no un plazo ' +
        'renovable. Los doce meses indicados corresponden a la práctica del INM en el canje de la FMM de ' +
        'internación por tarjeta: el art. 32 de los Lineamientos de 2012 da un año contado a partir de la ' +
        'internación, y el art. 34 renueva por un año, o por dos o tres cuando hay continuidad laboral ' +
        'por igual periodo. Con independencia de ello, el art. 59 concede treinta días naturales desde el ' +
        'ingreso para tramitar la tarjeta. El tiempo bajo esta condición sí computa para la residencia ' +
        'exigida por la naturalización, porque el art. 14 del Reglamento de la Ley de Nacionalidad admite ' +
        'la tarjeta de residente temporal. Aquí no se indica plazo de resolución: los diez días hábiles ' +
        'del Trámite 5 son un máximo legal de la decisión consular, no un estándar de servicio, y el INM ' +
        'no publica ninguno.',
    },
  },
  leadsTo: [
    'mx-residente-permanente-cuatro-anos',
    'mx-naturalizacion-residencia-general',
    'mx-naturalizacion-plazo-reducido',
  ],
  reviewStatus: 'unreviewed',
};

export const mxResidenteTemporalEstudiante: Pathway = {
  id: 'mx-residente-temporal-estudiante',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Temporary residence — student',
    es: 'Residente temporal estudiante',
  },
  summary: {
    en:
      'Residence for the duration of courses, studies, research projects or training at an institution ' +
      'belonging to the sistema educativo nacional, until the certificate, diploma, title or degree is ' +
      'obtained, renewed annually on proof that the conditions for the original authorisation subsist. ' +
      'Paid work is permitted only for higher education, postgraduate study and research, only with a ' +
      'carta de conformidad from the institution, only under a job offer related to the subject of study, ' +
      'and only where INM grants the permission.',
    es:
      'Residencia por el tiempo que duren los cursos, estudios, proyectos de investigación o formación en ' +
      'una institución perteneciente al sistema educativo nacional, hasta la obtención del certificado, ' +
      'constancia, diploma, título o grado académico, renovable anualmente acreditando que subsisten las ' +
      'condiciones de la autorización inicial. El trabajo remunerado solo procede en estudios de nivel ' +
      'superior, posgrado e investigación, solo con carta de conformidad de la institución educativa, ' +
      'solo al amparo de una oferta de trabajo relacionada con la materia de los estudios y solo cuando ' +
      'el INM otorgue el permiso.',
  },
  citations: [
    lmigraArt52,
    lmigraArt53,
    lmigraArt59,
    visasT6,
    tramitesArt32,
    regLmigraArt141,
    regLnacArt14,
    uma2026,
    ldvuma,
  ],
  criteria: [
    {
      id: 'mx-rt-est-art-53-bar',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-53', 'mx-reg-lmigra-art-141'],
      label: {
        en: 'Not present in Mexico as a visitante seeking to convert',
        es: 'No encontrarse en México como visitante buscando el cambio de condición',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'visitor' } },
      guidance: {
        en:
          'Reglamento art. 141 sets out the changes of condición de estancia that are permitted, and a ' +
          'change from any visitante variant to residente temporal estudiante is not among the ones ' +
          'recorded there. A person in Mexico on a visitor permit who is accepted onto a course should ' +
          'expect to leave and apply for the visa at a consular office. Reglamento art. 141.II does allow ' +
          'the reverse direction and one sideways move: a visitante or residente temporal estudiante may ' +
          'change to plain residente temporal by family link.',
        es:
          'El art. 141 del Reglamento enumera los cambios de condición de estancia permitidos, y el ' +
          'cambio de cualquier modalidad de visitante a residente temporal estudiante no figura entre los ' +
          'que allí constan. Quien se encuentre en México con permiso de visitante y sea aceptado en un ' +
          'programa debe prever salir del país y solicitar la visa ante una oficina consular. El ' +
          'art. 141.II sí admite el sentido inverso y un movimiento lateral: el visitante o el residente ' +
          'temporal estudiante puede cambiar a residente temporal por vínculo familiar.',
      },
    },
    {
      id: 'mx-rt-est-acceptance',
      kind: 'qualification',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-52', 'mx-lineamientos-visas-2025-t6'],
      label: {
        en: 'Acceptance by an institution belonging to the sistema educativo nacional',
        es: 'Aceptación por una institución perteneciente al sistema educativo nacional',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'The condition rests on a carta de invitación or de aceptación from a specific Mexican ' +
          'institution, and on that institution belonging to the sistema educativo nacional. Meridian ' +
          'records the applicant own education history but holds no fact about a current offer of a place ' +
          'or about the receiving institution status, so this cannot be decided here. A reviewer must ' +
          'confirm both.',
        es:
          'La condición descansa en una carta de invitación o de aceptación de una institución mexicana ' +
          'determinada y en que esa institución pertenezca al sistema educativo nacional. Meridian ' +
          'registra los antecedentes académicos de la persona solicitante pero no dispone de ningún dato ' +
          'sobre una carta de aceptación vigente ni sobre la situación de la institución receptora, de ' +
          'modo que esto no puede resolverse aquí. Corresponde a una persona confirmar ambos extremos.',
      },
    },
    {
      id: 'mx-rt-est-solvency',
      kind: 'economic',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lineamientos-visas-2025-t6', 'mx-uma-2026', 'mx-ldvuma-arts-4-5'],
      label: {
        en: 'Solvency to cover tuition, lodging and maintenance for the studies',
        es: 'Solvencia para cubrir colegiaturas, alojamiento y manutención durante los estudios',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Trámite 6 requires solvency to cover tuition, lodging and maintenance for the duration of the ' +
          'studies, and Meridian holds no UMA index to measure any multiple against. There is a second ' +
          'reason this cannot be decided from the applicant own facts: the solvency may be evidenced by ' +
          'the applicant, BY THEIR PARENTS, or by whoever holds patria potestad over them, so a student ' +
          'with no income of their own may still satisfy it entirely. A reviewer must establish whose ' +
          'means are being relied on before measuring anything.',
        es:
          'El Trámite 6 exige solvencia para cubrir colegiaturas, alojamiento y manutención durante los ' +
          'estudios, y Meridian no dispone del índice UMA con el que medir múltiplo alguno. Hay una ' +
          'segunda razón por la que esto no puede resolverse con los datos de la persona solicitante: la ' +
          'solvencia puede acreditarla ella, SUS PADRES o quien ejerza la patria potestad, de manera que ' +
          'un estudiante sin ingresos propios puede cumplirla íntegramente. Corresponde a una persona ' +
          'determinar de quién son los medios que se invocan antes de medir nada.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    citationIds: ['mx-lmigra-art-52', 'mx-lineamientos-tramites-2012-art-32', 'mx-lmigra-art-59', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'Art. 52.VIII authorises the stay for as long as the studies last, and requires the authorisation ' +
        'to be RENEWED ANNUALLY on proof that the conditions for the original authorisation subsist; ' +
        'Lineamientos 2012 art. 34 sets the renewal card at one year. The card must be applied for within ' +
        'thirty natural days of entry. WHETHER THIS TIME COUNTS TOWARD NATURALISATION IS DELIBERATELY ' +
        'LEFT UNSTATED. Reglamento de la Ley de Nacionalidad art. 14 accepts a card evidencing the ' +
        'condición de estancia of residente temporal or of residente permanente; residente temporal ' +
        'estudiante is a distinct condition under art. 52.VIII and the card names it as such. No source ' +
        'read settles whether the SRE treats that card as satisfying art. 14.I, so this record asserts ' +
        'nothing either way rather than encouraging a student to count four years that may not count. ' +
        'Reglamento art. 141.VII does allow a change to plain residente temporal at any time, which ' +
        'removes the question.',
      es:
        'El art. 52.VIII autoriza la estancia por el tiempo que duren los estudios y exige RENOVAR LA ' +
        'AUTORIZACIÓN ANUALMENTE acreditando que subsisten las condiciones de la autorización inicial; el ' +
        'art. 34 de los Lineamientos de 2012 fija la tarjeta de renovación en un año. La tarjeta debe ' +
        'solicitarse dentro de los treinta días naturales siguientes al ingreso. SI ESTE TIEMPO COMPUTA ' +
        'PARA LA NATURALIZACIÓN SE DEJA DELIBERADAMENTE SIN AFIRMAR. El art. 14 del Reglamento de la Ley ' +
        'de Nacionalidad admite la tarjeta que acredite la condición de estancia de residente temporal o ' +
        'la de residente permanente; el residente temporal estudiante es una condición distinta del ' +
        'art. 52.VIII y la tarjeta la nombra como tal. Ninguna fuente consultada resuelve si la SRE tiene ' +
        'esa tarjeta por suficiente a efectos del art. 14.I, de modo que este registro no afirma nada en ' +
        'ningún sentido en lugar de animar a un estudiante a contar cuatro años que quizá no cuenten. El ' +
        'art. 141.VII del Reglamento permite cambiar en cualquier momento a residente temporal ordinario, ' +
        'lo que elimina la duda.',
    },
  },
  leadsTo: ['mx-residente-permanente-cuatro-anos'],
  reviewStatus: 'unreviewed',
};

export const mxResidenteTemporalOfertaEmpleo: Pathway = {
  id: 'mx-residente-temporal-oferta-empleo',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Temporary residence with a work permission — job-offer route',
    es: 'Residencia temporal con permiso para trabajar — vía de oferta de empleo',
  },
  summary: {
    en:
      'Temporary residence carrying a work permission tied to the occupation in the offer, applied for by ' +
      'the employer at INM under Trámite 10 rather than at a consulate: INM authorises the visa and a ' +
      'Mexican consular office then issues it after an interview. The employer must hold a constancia de ' +
      'inscripción del empleador issued by INM. Since the Acuerdo of 2026-05-15 the offer must state the ' +
      'occupation under the Sistema Nacional de Clasificación de Ocupaciones, the work modality, every ' +
      'address where the work will be performed, and the amount and periodicity of the remuneration.',
    es:
      'Residencia temporal con permiso para trabajar vinculado a la ocupación señalada en la oferta, ' +
      'solicitada por el empleador ante el INM conforme al Trámite 10 y no ante una oficina consular: el ' +
      'INM autoriza la visa y una oficina consular de México la expide tras la entrevista. El empleador ' +
      'debe contar con constancia de inscripción del empleador emitida por el INM. Desde el Acuerdo de ' +
      '2026-05-15 la oferta debe indicar la ocupación conforme al Sistema Nacional de Clasificación de ' +
      'Ocupaciones, la modalidad de trabajo, todos los domicilios donde se prestará y el monto y la ' +
      'periodicidad de la remuneración.',
  },
  citations: [
    lmigraArt52,
    lmigraArt41,
    lmigraArt53,
    lmigraArt59,
    regLmigraArt138,
    regLmigraArt140,
    regLmigraArt156,
    visasT10,
    visasAcuerdo2026,
    regLnacArt14,
  ],
  criteria: [
    {
      id: 'mx-rt-oe-art-53-bar',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-53'],
      label: {
        en: 'Not present in Mexico as a visitante seeking to convert',
        es: 'No encontrarse en México como visitante buscando el cambio de condición',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'visitor' } },
      guidance: {
        en:
          'A job offer is not one of the exceptions art. 53 carves out. Even though the application is ' +
          'filed by the employer inside Mexico, the visa is collected at a consular office abroad, and a ' +
          'visitante who wanted to convert without leaving would be doing exactly what art. 53 forbids.',
        es:
          'La oferta de empleo no es una de las excepciones que abre el art. 53. Aunque el empleador ' +
          'presente la solicitud dentro de México, la visa se recoge en una oficina consular en el ' +
          'extranjero, y el visitante que pretendiera convertirse sin salir estaría haciendo justamente ' +
          'lo que el art. 53 prohíbe.',
      },
    },
    {
      id: 'mx-rt-oe-job-offer',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['mx-reg-lmigra-art-138', 'mx-lineamientos-visas-2025-t10', 'mx-acuerdo-visas-2026'],
      label: {
        en: 'A written job offer from an employer established in Mexico, not self-employment',
        es: 'Oferta de empleo por escrito de un empleador establecido en México, no trabajo por cuenta propia',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'MX' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
      guidance: {
        en:
          'Reglamento art. 138 separates the job-offer ground in fraction II from paid activity that does ' +
          'not involve an employer, which is fraction III and is evidenced by registration in the ' +
          'Registro Federal de Contribuyentes. Someone intending to work for their own account in Mexico ' +
          'is on that ground, not this one, and this criterion will read as unmet for them.',
        es:
          'El art. 138 del Reglamento separa el supuesto de oferta de empleo de su fracción II del de la ' +
          'actividad remunerada que no implica oferta de empleo, que es la fracción III y se acredita con ' +
          'la inscripción en el Registro Federal de Contribuyentes. Quien pretenda trabajar por cuenta ' +
          'propia en México se ubica en aquel supuesto y no en este, y este criterio le resultará no ' +
          'cumplido.',
      },
    },
    {
      id: 'mx-rt-oe-employer-registration',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-41', 'mx-lineamientos-visas-2025-t10'],
      label: {
        en: 'The employer holds a constancia de inscripción del empleador issued by INM',
        es: 'El empleador cuenta con constancia de inscripción del empleador emitida por el INM',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'The registration belongs to the employer, not to the applicant, and Meridian models no facts ' +
          'about an employer beyond its name and country. Without the constancia the application cannot ' +
          'be filed at all, so it is the first thing to confirm and it is confirmed with the employer, ' +
          'not with the applicant.',
        es:
          'La inscripción corresponde al empleador y no a la persona solicitante, y Meridian no modela ' +
          'datos del empleador más allá de su nombre y su país. Sin la constancia la solicitud ni ' +
          'siquiera puede presentarse, de modo que es lo primero que hay que confirmar y se confirma con ' +
          'el empleador, no con la persona solicitante.',
      },
    },
    {
      id: 'mx-rt-oe-regulated-occupation',
      kind: 'qualification',
      weight: 'informational',
      citationIds: ['mx-reg-lmigra-art-140'],
      label: {
        en: 'A work permission is not a professional licence',
        es: 'El permiso de trabajo no es una licencia profesional',
      },
      evaluator: { op: 'is_present', path: 'professionalCredentials' },
      guidance: {
        en:
          'Reglamento art. 140: a visa or a document evidencing a condición de estancia does not ' +
          'authorise the exercise of activities or professions requiring certifications, licences, ' +
          'titles, permits or similar authorisations. It is for the foreigner to obtain those and for the ' +
          'employer to verify or arrange them. The 2026 Acuerdo repeats the point for the job-offer ' +
          'route: the permission validates the truthfulness of the offer and says nothing about ' +
          'competence. This criterion records whether any credential is on file and affects no verdict.',
        es:
          'Art. 140 del Reglamento: la visa y el documento que acredita una condición de estancia no ' +
          'autorizan el ejercicio de actividades o profesiones que requieren certificaciones, licencias, ' +
          'títulos, permisos o autorizaciones similares. Obtenerlas corresponde a la persona extranjera y ' +
          'verificarlas o gestionarlas al empleador. El Acuerdo de 2026 lo reitera para la vía de oferta ' +
          'de empleo: el permiso valida la veracidad de la oferta y no dice nada sobre la competencia ' +
          'profesional. Este criterio deja constancia de si consta alguna credencial y no incide en el ' +
          'resultado.',
      },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    countsTowardNaturalisation: true,
    citationIds: ['mx-lmigra-art-52', 'mx-reg-lmigra-art-156', 'mx-lmigra-art-59', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'Where the residente temporal holds a work permission, Reglamento art. 156 second paragraph ties ' +
        'the card to the period of the job offer, so the twelve months above is a common case and not a ' +
        'rule. The four-year ceiling of art. 52.VII still runs from the grant of the condition, and ' +
        'Lineamientos 2012 art. 34 allows renewals of two or three years where there is continuidad ' +
        'laboral for the same period. The card must be applied for within thirty natural days of entry.',
      es:
        'Cuando el residente temporal obtiene permiso de trabajo, el segundo párrafo del art. 156 del ' +
        'Reglamento vincula la vigencia de la tarjeta a la de la oferta de empleo, de modo que los doce ' +
        'meses indicados son un caso frecuente y no una regla. El tope de cuatro años del art. 52.VII ' +
        'sigue contándose desde la autorización de la condición, y el art. 34 de los Lineamientos de ' +
        '2012 admite renovaciones de dos o tres años cuando hay continuidad laboral por igual periodo. La ' +
        'tarjeta debe solicitarse dentro de los treinta días naturales siguientes al ingreso.',
    },
  },
  leadsTo: [
    'mx-residente-permanente-cuatro-anos',
    'mx-naturalizacion-residencia-general',
    'mx-naturalizacion-plazo-reducido',
  ],
  reviewStatus: 'unreviewed',
};

export const mxResidenteTemporalUnidadFamiliar: Pathway = {
  id: 'mx-residente-temporal-unidad-familiar',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Temporary residence by family link',
    es: 'Residencia temporal por vínculo familiar',
  },
  summary: {
    en:
      'Two distinct family routes into residente temporal. First, the spouse or partner of a Mexican or ' +
      'of a residente permanente is granted RESIDENTE TEMPORAL FOR TWO YEARS and only then permanent ' +
      'residence, provided the bond subsists — arts. 55.II and 55.III, arts. 56.II and 56.III, and ' +
      'Reglamento art. 139.VII. Second, a residente temporal may bring, or later apply for, their minor ' +
      'unmarried children and those of their spouse or partner, their spouse, their partner, and their ' +
      'father or mother, who all reside as residente temporal for as long as the principal permission ' +
      'lasts — art. 52.VII. This is also one of the two exceptions art. 53 carves out of the bar on ' +
      'changing condición de estancia from inside Mexico.',
    es:
      'Dos vías familiares distintas hacia la residencia temporal. La primera: al cónyuge, concubina o ' +
      'concubinario de mexicano o de residente permanente se le concede la condición de RESIDENTE ' +
      'TEMPORAL POR DOS AÑOS y solo después la de residente permanente, siempre que subsista el vínculo ' +
      '—arts. 55.II y 55.III, 56.II y 56.III, y art. 139.VII del Reglamento—. La segunda: el residente ' +
      'temporal puede ingresar con o solicitar posteriormente la internación de sus hijos y los de su ' +
      'cónyuge o concubino cuando sean menores de edad y no hayan contraído matrimonio, de su cónyuge, de ' +
      'su concubina o concubinario y de su padre o madre, quienes residen como residentes temporales ' +
      'mientras dure el permiso del titular —art. 52.VII—. Esta es además una de las dos excepciones que ' +
      'el art. 53 abre a la prohibición de cambiar de condición de estancia desde dentro de México.',
  },
  citations: [
    lmigraArt52,
    lmigraArt53,
    lmigraArt55,
    lmigraArt56,
    lmigraArt133,
    regLmigraArt138,
    regLmigraArt139,
    regLmigraArt141,
    regLmigraArt156,
    visasT5,
    visasT7,
    regLnacArt14,
  ],
  criteria: [
    {
      id: 'mx-rt-uf-qualifying-relationship',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: [
        'mx-lmigra-art-52',
        'mx-lmigra-art-55',
        'mx-lmigra-art-56',
        'mx-reg-lmigra-art-138',
        'mx-reg-lmigra-art-141',
        'mx-lineamientos-visas-2025-t5',
      ],
      label: {
        en: 'A qualifying family link to a Mexican, a residente permanente or a residente temporal',
        es: 'Vínculo familiar cualificado con mexicano, residente permanente o residente temporal',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Meridian holds no facts about relatives — not the relationship, not the relative status in ' +
          'Mexico, and not the relative nationality. Every branch of this route turns on one of those. A ' +
          'reviewer must establish which relationship is relied on and what status or nationality the ' +
          'relative holds, because the answer changes the route entirely: a spouse of a Mexican starts a ' +
          'two-year residente temporal clock, a parent of a Mexican by birth goes straight to permanent ' +
          'residence under art. 54.VII, and a dependant of a residente temporal holds their status only ' +
          'for as long as the principal does.',
        es:
          'Meridian no dispone de datos sobre familiares: ni del parentesco, ni de la situación ' +
          'migratoria del familiar en México, ni de su nacionalidad. Todas las ramas de esta vía dependen ' +
          'de alguno de esos extremos. Corresponde a una persona determinar qué vínculo se invoca y qué ' +
          'condición o nacionalidad ostenta el familiar, porque la respuesta cambia la vía por completo: ' +
          'el cónyuge de mexicano inicia un cómputo de dos años como residente temporal, el padre o madre ' +
          'de mexicano por nacimiento accede directamente a la residencia permanente del art. 54.VII, y ' +
          'el dependiente de un residente temporal conserva su condición solo mientras la conserve el ' +
          'titular.',
      },
      guidance: {
        en:
          'Reglamento art. 141.I(c) fixes when the two years start, and it is not the wedding: the count ' +
          'runs "a partir de que el cónyuge, concubina o concubinario o figura equivalente adquiere la ' +
          'condición de estancia de residente temporal por el vínculo con el mexicano o con el residente ' +
          'permanente". A couple married for ten years abroad who arrive together start the clock on ' +
          'arrival, not with credit for the marriage.',
        es:
          'El art. 141.I(c) del Reglamento fija cuándo empiezan los dos años, y no es la boda: el cómputo ' +
          'corre «a partir de que el cónyuge, concubina o concubinario o figura equivalente adquiere la ' +
          'condición de estancia de residente temporal por el vínculo con el mexicano o con el residente ' +
          'permanente». Una pareja con diez años de matrimonio en el extranjero que llega junta inicia el ' +
          'cómputo al llegar, sin abono alguno por el tiempo de matrimonio.',
      },
    },
    {
      id: 'mx-rt-uf-spouse-cannot-take-pr-visa',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['mx-lmigra-art-55', 'mx-lmigra-art-56', 'mx-lineamientos-visas-2025-t7'],
      label: {
        en: 'A spouse or partner cannot be documented with a permanent-residence visa',
        es: 'El cónyuge o concubino no puede ser documentado con visa de residente permanente',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'The closing notes to Trámite 7 of the 2025 Lineamientos say it in terms: the foreign spouse or ' +
          'partner of a Mexican or of a residente permanente "en ningún caso podrá ser documentado con la ' +
          'visa de residente permanente". The two-year residente temporal step is not avoidable by ' +
          'applying at a consulate, and it is not a processing delay — it is what arts. 55.II, 55.III, ' +
          '56.II and 56.III grant. This criterion states the rule and affects no verdict.',
        es:
          'Las notas finales del Trámite 7 de los Lineamientos de 2025 lo dicen expresamente: la persona ' +
          'extranjera cónyuge, concubina o concubinario de mexicano o de residente permanente «en ningún ' +
          'caso podrá ser documentada con la visa de residente permanente». El escalón de dos años como ' +
          'residente temporal no se evita solicitando ante una oficina consular, y no es una demora de ' +
          'trámite: es lo que conceden los arts. 55.II, 55.III, 56.II y 56.III. Este criterio enuncia la ' +
          'regla y no incide en el resultado.',
      },
    },
    {
      id: 'mx-rt-uf-not-irregular',
      kind: 'status',
      weight: 'material',
      citationIds: ['mx-lmigra-art-133', 'mx-lmigra-art-53'],
      label: {
        en: 'Not already present in Mexico without authorisation',
        es: 'No encontrarse ya en México en situación migratoria irregular',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'irregular' } },
      guidance: {
        en:
          'A person with a qualifying family link who is already in Mexico without status has a better ' +
          'route than this one: art. 133 second paragraph gives them a RIGHT to regularise, and the INM ' +
          'ficha for it asks for no economic solvency at all. See mx-regularizacion-vinculo-familiar. ' +
          'Note also that a visitante with a family link is expressly outside the art. 53 bar, so being ' +
          'in Mexico is not itself the obstacle here that it is on the other residence routes.',
        es:
          'Quien tiene un vínculo familiar cualificado y ya se encuentra en México sin estatus dispone de ' +
          'una vía mejor que esta: el segundo párrafo del art. 133 le reconoce el DERECHO a regularizarse ' +
          'y la ficha del INM correspondiente no exige solvencia económica alguna. Véase ' +
          'mx-regularizacion-vinculo-familiar. Adviértase además que el visitante con vínculo familiar ' +
          'queda expresamente fuera de la prohibición del art. 53, de modo que encontrarse en México no ' +
          'es aquí el obstáculo que sí supone en las demás vías de residencia.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: [
      'mx-lmigra-art-52',
      'mx-lmigra-art-55',
      'mx-reg-lmigra-art-139',
      'mx-reg-lmigra-art-156',
      'mx-reg-lnac-art-14',
    ],
    note: {
      en:
        'No single grant length is stated here because the two branches differ. For the spouse or partner ' +
        'of a Mexican or of a residente permanente the grant is two years, after which permanent ' +
        'residence follows if the bond subsists — arts. 55.II and 55.III, arts. 56.II and 56.III, and ' +
        'Reglamento art. 139.VII, which requires two CONSECUTIVE years of regular status as residente ' +
        'temporal held by reason of that bond. For a dependant of a residente temporal under art. 52.VII ' +
        'the permission runs for as long as the principal permission does, within the four-year ceiling ' +
        'Reglamento art. 156 measures from the grant. Time on either branch counts toward the residence ' +
        'for naturalisation, and the spouse of a Mexican has a two-year naturalisation route of their own ' +
        'under Ley de Nacionalidad art. 20.II — a different two years, computed differently, and the two ' +
        'should not be conflated.',
      es:
        'Aquí no se indica una duración única porque las dos ramas difieren. Para el cónyuge, concubina o ' +
        'concubinario de mexicano o de residente permanente la concesión es de dos años, tras los cuales ' +
        'procede la residencia permanente si subsiste el vínculo —arts. 55.II y 55.III, 56.II y 56.III, y ' +
        'art. 139.VII del Reglamento, que exige dos años CONSECUTIVOS de situación migratoria regular ' +
        'como residente temporal otorgada por ese vínculo—. Para el dependiente de un residente temporal ' +
        'del art. 52.VII el permiso dura lo que dure el del titular, dentro del tope de cuatro años que ' +
        'el art. 156 del Reglamento cuenta desde la autorización. El tiempo de cualquiera de las dos ' +
        'ramas computa para la residencia exigida por la naturalización, y el cónyuge de mexicano tiene ' +
        'además una vía propia de dos años en el art. 20.II de la Ley de Nacionalidad: unos dos años ' +
        'distintos, que se computan de otro modo, y que no deben confundirse con estos.',
    },
  },
  leadsTo: [
    'mx-residente-permanente-unidad-familiar',
    'mx-residente-permanente-cuatro-anos',
    'mx-naturalizacion-conyuge',
    'mx-naturalizacion-plazo-reducido',
  ],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Residente permanente — art. 54
//
// Seven statutory doors. Fraction I — asylum, refugee recognition, complementary
// protection and statelessness — is deliberately absent from this catalog; see
// the out-of-scope section at the top of this file. Fraction IV, the points
// system, is recorded as `suspended`. The remaining five are here.
// ---------------------------------------------------------------------------

export const mxResidentePermanenteCuatroAnos: Pathway = {
  id: 'mx-residente-permanente-cuatro-anos',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Permanent residence after four years of temporary residence',
    es: 'Residencia permanente tras cuatro años de residencia temporal',
  },
  summary: {
    en:
      'Art. 54.V grants permanent residence once four years have elapsed since the person held a permiso ' +
      'de residencia temporal. Reglamento art. 139.V requires those four years to be regular status held ' +
      'CONSECUTIVELY, which is why this record measures an unbroken run rather than a total. The change ' +
      'is applied for at an INM counter, and Lineamientos 2012 art. 44 requires the applicant to state ' +
      'expressly in the application that they are applying by this route.',
    es:
      'El art. 54.V concede la residencia permanente cuando han transcurrido cuatro años desde que la ' +
      'persona cuenta con un permiso de residencia temporal. El art. 139.V del Reglamento exige que esos ' +
      'cuatro años sean de situación migratoria regular CONSECUTIVA, y por eso este registro mide un ' +
      'periodo ininterrumpido y no una suma. El cambio se solicita ante una ventanilla del INM, y el ' +
      'art. 44 de los Lineamientos de 2012 exige indicar expresamente en la solicitud que se pide el ' +
      'cambio por esta vía.',
  },
  citations: [lmigraArt54, regLmigraArt139, regLmigraArt156, regLmigraArt157, tramitesArt44, regLnacArt14],
  criteria: [
    {
      id: 'mx-rp-4y-four-consecutive-years',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-54', 'mx-reg-lmigra-art-139', 'mx-reg-lmigra-art-156'],
      label: {
        en: 'Four consecutive years of regular status as a residente temporal',
        es: 'Cuatro años consecutivos de situación migratoria regular como residente temporal',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 4 },
      guidance: {
        en:
          'The four years must be one unbroken run reaching the application date. Reglamento art. 139.V ' +
          'says "consecutivos", so four years assembled from separate periods does not qualify, and this ' +
          'engine measures the run rather than the total for that reason. Where only a day count is on ' +
          'file the criterion reports unknown rather than guessing. Two further points bite in practice. ' +
          'Reglamento art. 156 caps renewals at four years from the grant, so the fourth year is also the ' +
          'last one available: this is a deadline as much as a threshold. And Lineamientos 2012 art. 44 ' +
          'requisito 6 requires the application to say expressly that it is made on this ground — a ' +
          'point of form that decides the outcome of a substantively good application.',
        es:
          'Los cuatro años deben formar un periodo ininterrumpido que llegue hasta la fecha de solicitud. ' +
          'El art. 139.V del Reglamento dice «consecutivos», de modo que cuatro años reunidos a partir de ' +
          'periodos separados no cumplen, y por eso este motor mide el periodo continuo y no el total. Si ' +
          'solo consta un número de días, el criterio responde «desconocido» en lugar de suponer. Dos ' +
          'extremos más operan en la práctica. El art. 156 del Reglamento limita las renovaciones a ' +
          'cuatro años contados desde la autorización, por lo que el cuarto año es también el último ' +
          'disponible: esto es tanto un plazo como un umbral. Y el requisito 6 del art. 44 de los ' +
          'Lineamientos de 2012 exige indicar expresamente en la solicitud que se pide por esta vía, una ' +
          'cuestión de forma que decide el resultado de una solicitud sustantivamente correcta.',
      },
    },
    {
      id: 'mx-rp-4y-status-still-alive',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lmigra-art-139', 'mx-lineamientos-tramites-2012-art-44'],
      label: {
        en: 'Currently holding a valid residente temporal card',
        es: 'Ser titular de una tarjeta de residente temporal válida y vigente',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'resident' },
      guidance: {
        en:
          'Art. 44 requisito 2 asks for a "tarjeta de residente temporal, válida y vigente". A residente ' +
          'temporal whose card has lapsed is not in this chapter at all — they are irregular, and their ' +
          'route is regularisation under arts. 132 to 136, with only sixty natural days from expiry if ' +
          'they want art. 134.I. Four otherwise perfect years do not survive an expired card, so this ' +
          'criterion is separate from the residence count on purpose.',
        es:
          'El requisito 2 del art. 44 pide «tarjeta de residente temporal, válida y vigente». El ' +
          'residente temporal cuya tarjeta ha vencido no está en este capítulo: está en situación ' +
          'irregular y su vía es la regularización de los arts. 132 a 136, con solo sesenta días ' +
          'naturales desde el vencimiento si quiere acogerse al art. 134.I. Cuatro años por lo demás ' +
          'impecables no sobreviven a una tarjeta vencida, y por eso este criterio es independiente del ' +
          'cómputo de residencia.',
      },
    },
    {
      id: 'mx-rp-4y-work-permission',
      kind: 'employment',
      weight: 'informational',
      citationIds: ['mx-reg-lmigra-art-157', 'mx-lmigra-art-54'],
      label: {
        en: 'The permanent residence card carries a work permission for adults',
        es: 'La tarjeta de residente permanente implica permiso de trabajo para mayores de edad',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'There is a drafting inconsistency worth knowing about. Art. 52.IX grants residente permanente ' +
          '"con permiso para trabajar" unconditionally, while the closing paragraph of art. 54 says such ' +
          'residents have "la posibilidad de obtener un permiso para trabajar … sujeto a una oferta de ' +
          'empleo", which reads narrower. Reglamento art. 157 settles it operationally: the card ' +
          '"implicará … que cuenta con permiso de trabajo en el caso de ser mayores de edad". The ' +
          'unrestricted reading is the one encoded here; if a matter turns on the point, take it to ' +
          'counsel rather than to this record.',
        es:
          'Hay una discordancia de redacción que conviene conocer. El art. 52.IX concede la residencia ' +
          'permanente «con permiso para trabajar» sin condición, mientras que el párrafo final del ' +
          'art. 54 dice que esos residentes tendrán «la posibilidad de obtener un permiso para trabajar … ' +
          'sujeto a una oferta de empleo», lo que se lee más estrecho. El art. 157 del Reglamento lo ' +
          'resuelve en la práctica: la tarjeta «implicará … que cuenta con permiso de trabajo en el caso ' +
          'de ser mayores de edad». Aquí se codifica la lectura amplia; si un asunto concreto depende de ' +
          'este punto, consúltese con un profesional y no con este registro.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['mx-lmigra-art-54', 'mx-reg-lmigra-art-157', 'mx-lineamientos-tramites-2012-art-44', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'Permanent residence is indefinite: art. 52.IX authorises the holder to remain "de manera ' +
        'indefinida", and Reglamento art. 157 gives the card indefinite validity except for minors, who ' +
        'renew annually until three and every four years thereafter until majority. No renewal period is ' +
        'stated above for that reason. Art. 44 of the 2012 Lineamientos states twenty working days as the ' +
        'maximum for INM to resolve the change of condition; that is a legal ceiling, not a service ' +
        'standard, and no processing estimate is asserted anywhere in this file. Time as a residente ' +
        'permanente counts toward the residence for naturalisation.',
      es:
        'La residencia permanente es indefinida: el art. 52.IX autoriza permanecer «de manera ' +
        'indefinida», y el art. 157 del Reglamento da vigencia indefinida a la tarjeta salvo para ' +
        'menores de edad, que la renuevan cada año hasta los tres y cada cuatro años después hasta la ' +
        'mayoría de edad. Por eso no se indica arriba periodo de renovación. El art. 44 de los ' +
        'Lineamientos de 2012 fija veinte días hábiles como plazo máximo de resolución del cambio de ' +
        'condición; es un tope legal, no un estándar de servicio, y en este archivo no se afirma ninguna ' +
        'estimación de plazos. El tiempo como residente permanente computa para la residencia exigida por ' +
        'la naturalización.',
    },
  },
  leadsTo: ['mx-naturalizacion-residencia-general', 'mx-naturalizacion-plazo-reducido'],
  reviewStatus: 'unreviewed',
};

export const mxResidentePermanenteJubilado: Pathway = {
  id: 'mx-residente-permanente-jubilado',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Permanent residence for a retired or pensioned person',
    es: 'Residencia permanente para persona jubilada o pensionada',
  },
  summary: {
    en:
      'Art. 54.III grants permanent residence directly, with no prior residence at all, to a person who ' +
      'is retired or pensioned and receives from a foreign government, from an international organisation ' +
      'or from private undertakings for services rendered abroad an income allowing them to live in ' +
      'Mexico. The income must be foreign-sourced on the face of the statute. The thresholds are ' +
      'different depending on where the application is made: 45,850 or 1,140 días UMA at a consulate, ' +
      '25,000 or 500 días at an INM counter.',
    es:
      'El art. 54.III concede la residencia permanente de manera directa, sin residencia previa alguna, a ' +
      'quien sea jubilado o pensionado y perciba de un gobierno extranjero, de organismos internacionales ' +
      'o de empresas particulares por servicios prestados en el exterior un ingreso que le permita vivir ' +
      'en el país. Del texto de la Ley resulta que el ingreso debe tener origen extranjero. Los umbrales ' +
      'difieren según dónde se presente la solicitud: 45,850 o 1,140 días UMA ante una oficina consular, ' +
      '25,000 o 500 días ante una ventanilla del INM.',
  },
  citations: [
    lmigraArt54,
    lmigraArt53,
    regLmigraArt139,
    regLmigraArt157,
    visasT7,
    tramitesArt44,
    uma2026,
    ldvuma,
    regLnacArt14,
  ],
  criteria: [
    {
      id: 'mx-rp-jub-foreign-sourced-pension',
      kind: 'economic',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: [
        'mx-lmigra-art-54',
        'mx-reg-lmigra-art-139',
        'mx-lineamientos-visas-2025-t7',
        'mx-lineamientos-tramites-2012-art-44',
        'mx-uma-2026',
        'mx-ldvuma-arts-4-5',
      ],
      label: {
        en: 'A foreign-sourced pension or retirement income at the level the applicable channel requires',
        es: 'Pensión o jubilación de origen extranjero por el importe que exija el canal aplicable',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Two things prevent a decision here, and both matter. First the SOURCE: art. 54.III requires ' +
          'income from a foreign government, from international organisations or from private ' +
          'undertakings for services rendered abroad, and Meridian records the amount and period of ' +
          'passive income but not where it comes from. Mexican-sourced pension income does not satisfy ' +
          'the article on the face of the text. Second the AMOUNT, which depends on the channel: Trámite ' +
          '7 of the 2025 Lineamientos requires an average monthly balance of 45,850 días UMA over the ' +
          'last twelve months or pension income free of encumbrances greater than 1,140 días UMA monthly ' +
          'over the last six months, whereas art. 44 of the 2012 Lineamientos, for a residente temporal ' +
          'changing status at an INM counter, requires 25,000 días of average monthly balance over twelve ' +
          'months or 500 días of monthly income over six months. Neither instrument defers to the other. ' +
          'A reviewer must establish the source, choose the channel, and convert the multiple at the UMA ' +
          'value in force on the day of the application.',
        es:
          'Dos cosas impiden resolver aquí, y ambas importan. Primero el ORIGEN: el art. 54.III exige ' +
          'ingresos de un gobierno extranjero, de organismos internacionales o de empresas particulares ' +
          'por servicios prestados en el exterior, y Meridian registra el importe y la periodicidad de ' +
          'los ingresos pasivos pero no su procedencia. Una pensión de fuente mexicana no satisface el ' +
          'artículo conforme a su texto. Segundo el IMPORTE, que depende del canal: el Trámite 7 de los ' +
          'Lineamientos de 2025 exige saldo promedio mensual de 45,850 días UMA durante los últimos doce ' +
          'meses o pensión con ingresos mensuales libres de gravámenes mayores a 1,140 días UMA durante ' +
          'los últimos seis meses, mientras que el art. 44 de los Lineamientos de 2012, para el residente ' +
          'temporal que cambia de condición ante una ventanilla del INM, exige 25,000 días de saldo ' +
          'promedio mensual durante doce meses o 500 días de ingresos mensuales durante seis meses. ' +
          'Ninguno de los dos instrumentos se remite al otro. Corresponde a una persona determinar el ' +
          'origen, elegir el canal y convertir el múltiplo al valor de la UMA vigente el día de la ' +
          'solicitud.',
      },
      guidance: {
        en:
          'The gap between the two instruments is large and it runs in the direction people do not ' +
          'expect: the consular figures are the higher ones. That is not a mistake to be reconciled away ' +
          '— they are two administrative instruments thirteen years apart, applying to two different ' +
          'counters, and the number attaches to the counter.',
        es:
          'La diferencia entre los dos instrumentos es grande y va en el sentido que no se espera: las ' +
          'cifras consulares son las más altas. No es un error que deba conciliarse: son dos instrumentos ' +
          'administrativos separados por trece años, aplicables a dos ventanillas distintas, y la cifra ' +
          'se adhiere a la ventanilla.',
      },
    },
    {
      id: 'mx-rp-jub-art-53-bar',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-53'],
      label: {
        en: 'Not present in Mexico as a visitante seeking to convert',
        es: 'No encontrarse en México como visitante buscando el cambio de condición',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'visitor' } },
      guidance: {
        en:
          'Being a pensioner is not one of the exceptions art. 53 carves out. A retired person visiting ' +
          'Mexico on a tourist permit cannot convert from inside the country: the application is made at ' +
          'a Mexican consular office abroad under Trámite 7, or at an INM counter by a person who is ' +
          'already a residente temporal under art. 44 of the 2012 Lineamientos.',
        es:
          'Ser pensionado no es una de las excepciones que abre el art. 53. La persona jubilada que ' +
          'visita México con permiso de turista no puede convertirse desde dentro del país: la solicitud ' +
          'se presenta ante una oficina consular de México conforme al Trámite 7, o ante una ventanilla ' +
          'del INM por quien ya es residente temporal conforme al art. 44 de los Lineamientos de 2012.',
      },
    },
    {
      id: 'mx-rp-jub-income-on-file',
      kind: 'economic',
      weight: 'informational',
      citationIds: ['mx-lmigra-art-54'],
      label: {
        en: 'A passive-income figure has been supplied',
        es: 'Se ha aportado una cifra de ingresos pasivos',
      },
      evaluator: { op: 'is_present', path: 'passiveIncome.minorUnits' },
      guidance: {
        en:
          'This records only that a figure exists on file, not that it is sufficient and not that it is ' +
          'foreign-sourced. Meridian does not measure it, because the threshold is a multiple of an index ' +
          'the engine does not hold and the conversion belongs to the day the application is made.',
        es:
          'Esto solo deja constancia de que consta una cifra, no de que sea suficiente ni de que tenga ' +
          'origen extranjero. Meridian no la mide, porque el umbral es un múltiplo de un índice del que ' +
          'el motor no dispone y la conversión corresponde al día en que se presenta la solicitud.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['mx-lmigra-art-54', 'mx-reg-lmigra-art-157', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'Indefinite, as for every residente permanente. Nothing in art. 54.III requires any prior period ' +
        'of residence in Mexico, which is what distinguishes this route from art. 54.V. Time as a ' +
        'residente permanente counts toward the residence for naturalisation.',
      es:
        'Indefinida, como para todo residente permanente. Nada en el art. 54.III exige periodo previo de ' +
        'residencia en México, y eso es lo que distingue esta vía de la del art. 54.V. El tiempo como ' +
        'residente permanente computa para la residencia exigida por la naturalización.',
    },
  },
  leadsTo: ['mx-naturalizacion-residencia-general', 'mx-naturalizacion-plazo-reducido'],
  reviewStatus: 'unreviewed',
};

export const mxResidentePermanenteUnidadFamiliar: Pathway = {
  id: 'mx-residente-permanente-unidad-familiar',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Permanent residence by family unity',
    es: 'Residencia permanente por unidad familiar',
  },
  summary: {
    en:
      'Art. 54.II grants permanent residence on the family-unity cases of art. 55: the father or mother ' +
      'of a residente permanente, their minor unmarried children and those of their spouse or partner, ' +
      'and their minor unmarried siblings all receive permanent residence directly, while the spouse and ' +
      'the partner receive residente temporal for two years first and permanent residence only if the ' +
      'bond subsists. Art. 56 gives Mexicans the equivalent right, on the same two-year step for a spouse ' +
      'or partner.',
    es:
      'El art. 54.II concede la residencia permanente por los supuestos de unidad familiar del art. 55: ' +
      'el padre o la madre del residente permanente, sus hijos y los de su cónyuge o concubino cuando ' +
      'sean menores de edad y no hayan contraído matrimonio, y sus hermanos menores de edad y no casados ' +
      'obtienen la residencia permanente de manera directa, mientras que el cónyuge y el concubino ' +
      'obtienen primero la residencia temporal por dos años y la permanente solo si subsiste el vínculo. ' +
      'El art. 56 reconoce a los mexicanos el derecho equivalente, con el mismo escalón de dos años para ' +
      'el cónyuge o concubino.',
  },
  citations: [
    lmigraArt54,
    lmigraArt55,
    lmigraArt56,
    regLmigraArt139,
    regLmigraArt141,
    regLmigraArt157,
    visasT7,
    uma2026,
    ldvuma,
    regLnacArt14,
  ],
  criteria: [
    {
      id: 'mx-rp-uf-qualifying-relationship',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-54', 'mx-lmigra-art-55', 'mx-lmigra-art-56', 'mx-reg-lmigra-art-141'],
      label: {
        en: 'A family-unity relationship within art. 55 or art. 56',
        es: 'Relación de unidad familiar comprendida en el art. 55 o en el art. 56',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Meridian holds no facts about relatives: not the relationship, not the relative status in ' +
          'Mexico, not the relative nationality. Which fraction applies decides everything, including ' +
          'whether the person goes to permanent residence directly or through two years as a residente ' +
          'temporal. Several fractions also require the relative to be a minor and unmarried, or under ' +
          'the applicant guardianship or legal representation, which are facts about a third person that ' +
          'this engine does not and should not hold.',
        es:
          'Meridian no dispone de datos sobre familiares: ni del parentesco, ni de la situación ' +
          'migratoria del familiar en México, ni de su nacionalidad. Qué fracción resulta aplicable lo ' +
          'decide todo, incluso si la persona accede directamente a la residencia permanente o pasa antes ' +
          'dos años como residente temporal. Varias fracciones exigen además que el familiar sea menor de ' +
          'edad y no haya contraído matrimonio, o esté bajo su tutela, custodia o representación legal, ' +
          'que son hechos relativos a un tercero de los que este motor no dispone ni debe disponer.',
      },
    },
    {
      id: 'mx-rp-uf-two-year-temporary-step',
      kind: 'residence',
      weight: 'material',
      citationIds: ['mx-lmigra-art-55', 'mx-lmigra-art-56', 'mx-reg-lmigra-art-139', 'mx-reg-lmigra-art-141'],
      label: {
        en: 'For a spouse or partner: two consecutive years as a residente temporal held by that bond',
        es: 'Para el cónyuge o concubino: dos años consecutivos como residente temporal por ese vínculo',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 2 },
      guidance: {
        en:
          'THIS CRITERION BITES ONLY ON THE SPOUSE AND PARTNER BRANCHES. A parent, a minor child or a ' +
          'minor sibling under arts. 55.I, 55.IV and 55.V goes to permanent residence with no residence ' +
          'period at all, and for them this criterion is noise — which is why it is weighted material ' +
          'and can never on its own produce an ineligible verdict. Where it does apply, Reglamento ' +
          'art. 139.VII requires two CONSECUTIVE years of regular status as a residente temporal granted ' +
          'by reason of that bond, and art. 141.I(c) starts the count from the day the residente temporal ' +
          'condition was acquired by reason of the bond, not from the wedding. The bond must still ' +
          'subsist when the change is applied for.',
        es:
          'ESTE CRITERIO SOLO OPERA EN LAS RAMAS DE CÓNYUGE Y CONCUBINO. El padre o madre, el hijo menor ' +
          'o el hermano menor de los arts. 55.I, 55.IV y 55.V accede a la residencia permanente sin ' +
          'periodo de residencia alguno, y para ellos este criterio es ruido: por eso tiene peso ' +
          'material y nunca puede por sí solo producir un resultado de no elegibilidad. Cuando sí ' +
          'aplica, el art. 139.VII del Reglamento exige dos años CONSECUTIVOS de situación migratoria ' +
          'regular como residente temporal otorgada por ese vínculo, y el art. 141.I(c) inicia el cómputo ' +
          'el día en que se adquirió la condición de residente temporal por el vínculo y no el día de la ' +
          'boda. El vínculo debe subsistir al solicitar el cambio.',
      },
    },
    {
      id: 'mx-rp-uf-maintenance-solvency',
      kind: 'economic',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lineamientos-visas-2025-t7', 'mx-uma-2026', 'mx-ldvuma-arts-4-5'],
      label: {
        en: 'Where the sponsor is a foreign permanent resident, solvency for each relative',
        es: 'Cuando quien promueve es residente permanente extranjero, solvencia por cada familiar',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Trámite 7 of the 2025 Lineamientos requires, for the family of a FOREIGN residente permanente, ' +
          'solvency for the maintenance of EACH relative during their stay: an average monthly balance of ' +
          '220 días UMA over the last twelve months, or employment or pension income free of encumbrances ' +
          'greater than 220 días UMA monthly over the last six months. Meridian holds no UMA index and no ' +
          'count of accompanying relatives, so the arithmetic cannot be done here. Note that the ' +
          'requirement appears in the branch for the family of a foreign permanent resident and not in ' +
          'the branch for the family of a Mexican, so a reviewer must first settle which branch applies.',
        es:
          'El Trámite 7 de los Lineamientos de 2025 exige, para la familia de un residente permanente ' +
          'EXTRANJERO, acreditar solvencia para la manutención de CADA familiar durante su estancia: ' +
          'saldo promedio mensual de 220 días UMA durante los últimos doce meses, o empleo o pensión con ' +
          'ingresos mensuales libres de gravámenes mayores a 220 días UMA durante los últimos seis meses. ' +
          'Meridian no dispone del índice UMA ni del número de familiares acompañantes, de modo que la ' +
          'operación no puede hacerse aquí. Adviértase que el requisito figura en la rama de la familia ' +
          'del residente permanente extranjero y no en la de la familia de un mexicano, por lo que ' +
          'corresponde a una persona determinar primero qué rama aplica.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['mx-lmigra-art-55', 'mx-reg-lmigra-art-157', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'Indefinite once granted. The relatives listed in art. 55 reside "bajo la misma condición de ' +
        'estancia" as the principal, with the two-year residente temporal step for a spouse or partner as ' +
        'the single exception. Time as a residente permanente counts toward the residence for ' +
        'naturalisation, and a spouse of a Mexican also has a two-year naturalisation route of their own ' +
        'under Ley de Nacionalidad art. 20.II, which is computed from conjugal residence rather than from ' +
        'the migration status and should not be conflated with the two years here.',
      es:
        'Indefinida una vez concedida. Los familiares del art. 55 residen «bajo la misma condición de ' +
        'estancia» que el titular, con el escalón de dos años como residente temporal para el cónyuge o ' +
        'concubino como única excepción. El tiempo como residente permanente computa para la residencia ' +
        'exigida por la naturalización, y el cónyuge de mexicano dispone además de una vía propia de dos ' +
        'años en el art. 20.II de la Ley de Nacionalidad, que se computa a partir de la residencia ' +
        'conyugal y no de la condición migratoria y no debe confundirse con los dos años de aquí.',
    },
  },
  leadsTo: [
    'mx-naturalizacion-residencia-general',
    'mx-naturalizacion-plazo-reducido',
    'mx-naturalizacion-conyuge',
  ],
  reviewStatus: 'unreviewed',
};

export const mxResidentePermanenteVinculoMexicano: Pathway = {
  id: 'mx-residente-permanente-vinculo-mexicano',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'permanent_residence',
  status: 'open',
  name: {
    en: 'Permanent residence through a direct link to a Mexican by birth',
    es: 'Residencia permanente por vínculo directo con mexicano por nacimiento',
  },
  summary: {
    en:
      'Two statutory grounds that are direct and immediate, with no prior residence of any kind. ' +
      'Art. 54.VI: having children of Mexican nationality BY BIRTH. Art. 54.VII: being an ascendant or ' +
      'descendant in the direct line up to the second degree of a Mexican BY BIRTH, which Reglamento ' +
      'art. 141.I(e) reads operationally as grandparent, parent, child or grandchild. Both turn on the ' +
      'relative being Mexican by birth rather than by naturalisation, and that distinction is the whole ' +
      'of the route.',
    es:
      'Dos supuestos legales directos e inmediatos, sin residencia previa de ninguna clase. Art. 54.VI: ' +
      'tener hijos de nacionalidad mexicana POR NACIMIENTO. Art. 54.VII: ser ascendiente o descendiente ' +
      'en línea recta hasta el segundo grado de un mexicano POR NACIMIENTO, que el art. 141.I(e) del ' +
      'Reglamento lee operativamente como abuelo, abuela, padre, madre, hijo, hija, nieto o nieta. Ambos ' +
      'dependen de que el familiar sea mexicano por nacimiento y no por naturalización, y esa distinción ' +
      'es toda la vía.',
  },
  citations: [lmigraArt54, cpeumArt30, regLmigraArt139, regLmigraArt141, regLmigraArt157, visasT7, regLnacArt14],
  criteria: [
    {
      id: 'mx-rp-vm-mexican-relative-by-birth',
      kind: 'nationality',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: [
        'mx-lmigra-art-54',
        'mx-cpeum-art-30',
        'mx-reg-lmigra-art-139',
        'mx-reg-lmigra-art-141',
        'mx-lineamientos-visas-2025-t7',
      ],
      label: {
        en: 'A child, parent, grandparent or grandchild who is Mexican by birth',
        es: 'Hijo, hija, padre, madre, abuelo, abuela, nieto o nieta mexicano por nacimiento',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'THIS IS THE CLEAREST GAP IN THE FACT MODEL. ApplicantFacts carries ' +
          'claimedNationalityAcquisition, which records how the APPLICANT acquired their own nationality. ' +
          'Arts. 54.VI and 54.VII turn on how a RELATIVE acquired theirs, and there is no field for "my ' +
          'daughter is Mexican, and Mexican by birth". The distinction is not a formality: a child or ' +
          'parent who is Mexican by naturalisation does not trigger either fraction. A reviewer must ' +
          'establish the relationship, its degree, and whether the relative nationality falls under ' +
          'Const. art. 30 apartado A — which includes, and people frequently miss this, a child born ' +
          'abroad to a parent who was themselves Mexican only by naturalisation.',
        es:
          'ESTA ES LA LAGUNA MÁS CLARA DEL MODELO DE HECHOS. ApplicantFacts lleva ' +
          'claimedNationalityAcquisition, que registra cómo adquirió su nacionalidad LA PERSONA ' +
          'SOLICITANTE. Los arts. 54.VI y 54.VII dependen de cómo adquirió la suya UN FAMILIAR, y no ' +
          'existe campo para «mi hija es mexicana, y mexicana por nacimiento». La distinción no es una ' +
          'formalidad: el hijo o el progenitor que sea mexicano por naturalización no actualiza ninguna ' +
          'de las dos fracciones. Corresponde a una persona acreditar el parentesco, su grado y si la ' +
          'nacionalidad del familiar encuadra en el apartado A del art. 30 constitucional, que ' +
          'comprende —y esto se pasa por alto con frecuencia— al nacido en el extranjero de padre o madre ' +
          'que a su vez era mexicano solo por naturalización.',
      },
      guidance: {
        en:
          'Const. art. 30 apartado A makes Mexican by birth: anyone born in the territory whatever their ' +
          'parents nationality; anyone born abroad to a Mexican father or mother; anyone born abroad to a ' +
          'parent who is Mexican BY NATURALISATION; and anyone born aboard a Mexican vessel or aircraft. ' +
          'There is no generational limit in the constitutional text. Note the asymmetry with the ' +
          'requirement here: the relative must be Mexican by birth, but their own parent may have been ' +
          'Mexican only by naturalisation.',
        es:
          'El apartado A del art. 30 constitucional atribuye la nacionalidad mexicana por nacimiento a ' +
          'quien nazca en territorio de la República sea cual fuere la nacionalidad de sus padres; a ' +
          'quien nazca en el extranjero de padre o madre mexicanos; a quien nazca en el extranjero de ' +
          'padre o madre mexicanos POR NATURALIZACIÓN; y a quien nazca a bordo de embarcaciones o ' +
          'aeronaves mexicanas. El texto constitucional no fija límite generacional. Adviértase la ' +
          'asimetría con el requisito de aquí: el familiar debe ser mexicano por nacimiento, pero su ' +
          'propio progenitor pudo haber sido mexicano solo por naturalización.',
      },
    },
    {
      id: 'mx-rp-vm-no-prior-residence',
      kind: 'residence',
      weight: 'informational',
      citationIds: ['mx-lmigra-art-54'],
      label: {
        en: 'No prior period of residence in Mexico is required on this ground',
        es: 'Esta vía no exige periodo previo de residencia en México',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Only art. 54.V requires prior residence, and only on that ground do the four years apply. ' +
          'A parent of a Mexican child by birth, and an ascendant or descendant to the second degree of a ' +
          'Mexican by birth, are entitled to permanent residence without having lived in Mexico at all. ' +
          'Anyone in that position who is currently accumulating years as a residente temporal should ' +
          'check this route before waiting out the four.',
        es:
          'Solo el art. 54.V exige residencia previa, y solo en ese supuesto operan los cuatro años. El ' +
          'padre o la madre de un hijo mexicano por nacimiento, y el ascendiente o descendiente hasta el ' +
          'segundo grado de un mexicano por nacimiento, tienen derecho a la residencia permanente sin ' +
          'haber vivido en México en absoluto. Quien se encuentre en esa situación y esté acumulando ' +
          'años como residente temporal debería comprobar esta vía antes de esperar a los cuatro.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['mx-lmigra-art-54', 'mx-reg-lmigra-art-157', 'mx-reg-lnac-art-14'],
    note: {
      en:
        'Indefinite once granted. A person on this route often also has a two-year naturalisation route ' +
        'under Ley de Nacionalidad art. 20.I(a) or (b), and in the narrow case of a direct-line ' +
        'descendant in the second degree of a Mexican by birth who holds no other nationality, art. 20.I ' +
        'second paragraph exempts them from proving residence at all.',
      es:
        'Indefinida una vez concedida. Quien accede por esta vía suele disponer además de una vía de ' +
        'naturalización de dos años por el art. 20.I(a) o (b) de la Ley de Nacionalidad y, en el supuesto ' +
        'estrecho del descendiente en línea recta en segundo grado de un mexicano por nacimiento que no ' +
        'cuente con otra nacionalidad, el segundo párrafo del art. 20.I lo exime de acreditar residencia.',
    },
  },
  leadsTo: ['mx-naturalizacion-plazo-reducido', 'mx-naturalizacion-residencia-general'],
  reviewStatus: 'unreviewed',
};

/**
 * The points system, recorded as unavailable rather than omitted.
 *
 * Art. 57 has been on the statute book since 2011 and makes the system
 * conditional on an *acuerdo* published in the DOF. No such acuerdo was found.
 * Three administrative instruments spanning 2012 to 2025, and INM's own current
 * public page, all still refer to it in the future tense — including the
 * consular Lineamientos published on 2025-07-25, fourteen years after the law
 * and in the course of replacing the entire visa framework.
 *
 * A negative cannot be proved from a search, so this record does not claim the
 * acuerdo does not exist. It claims that no route can be applied for under
 * art. 54.IV on the strength of anything that could be read, which is why the
 * status is `suspended`: `statusOn` returns `suspended` and `evaluate` reports
 * `ineligible` with the reason on the record, rather than presenting a route
 * nobody can file.
 */
export const mxResidentePermanenteSistemaPuntos: Pathway = {
  id: 'mx-residente-permanente-sistema-puntos',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'permanent_residence',
  status: 'suspended',
  closureNote: {
    en:
      'Not suspended by any instrument — never commenced. Art. 57 of the Ley de Migración makes the sistema de ' +
      'puntos conditional on general administrative provisions published in the Diario Oficial de la Federación, ' +
      'and no such acuerdo could be located as at 2026-07-26: the Reglamento, the 2012 INM lineamientos, the 2025 ' +
      'consular lineamientos and INM\u2019s own current guidance all still refer to it in the future tense. That is ' +
      'an absence of evidence rather than proof of absence, so this route is carried as a named, unavailable ' +
      'option instead of being omitted. Omitting it would leave a reader who has been told the points system ' +
      'exists — it is in the statute, and it is widely written about — unable to find out why they cannot use it. ' +
      'If an acuerdo has since been published, this record is the thing to correct.',
    es:
      'No est\u00e1 suspendida por ning\u00fan instrumento: nunca entr\u00f3 en vigor. El art. 57 de la Ley de Migraci\u00f3n ' +
      'condiciona el sistema de puntos a disposiciones administrativas de car\u00e1cter general publicadas en el ' +
      'Diario Oficial de la Federaci\u00f3n, y al 26-07-2026 no se localiz\u00f3 tal acuerdo: el Reglamento, los ' +
      'lineamientos del INM de 2012, los lineamientos consulares de 2025 y la propia gu\u00eda vigente del INM lo ' +
      'siguen mencionando en futuro. Eso es ausencia de evidencia, no prueba de inexistencia, por lo que la v\u00eda ' +
      'se conserva como opci\u00f3n nombrada y no disponible en lugar de omitirse. Omitirla dejar\u00eda sin respuesta a ' +
      'quien ha le\u00eddo que el sistema de puntos existe \u2014 est\u00e1 en la ley y se comenta ampliamente \u2014 sin poder ' +
      'averiguar por qu\u00e9 no puede usarlo. Si ya se public\u00f3 un acuerdo, este registro es lo que hay que corregir.',
  },
  name: {
    en: 'Permanent residence by the points system — no implementing acuerdo found',
    es: 'Residencia permanente por el sistema de puntos — sin acuerdo de implementación localizado',
  },
  summary: {
    en:
      'Art. 54.IV grants permanent residence by decision of INM under the sistema de puntos of art. 57, ' +
      'which would let a foreigner acquire permanent residence WITHOUT the four years of prior residence. ' +
      'Art. 57 makes the system conditional on general administrative provisions published in the Diario ' +
      'Oficial de la Federación, and no such acuerdo could be found as at 2026-07-26. The Reglamento, the ' +
      '2012 INM Lineamientos, the 2025 consular Lineamientos and INM own public page all still describe ' +
      'it in the future tense. This record exists so that somebody who has heard of the points system ' +
      'gets an answer rather than silence; it is not an available route and must not be presented as one.',
    es:
      'El art. 54.IV concede la residencia permanente por decisión del Instituto conforme al sistema de ' +
      'puntos del art. 57, que permitiría adquirirla SIN los cuatro años de residencia previa. El art. 57 ' +
      'condiciona el sistema a disposiciones administrativas de carácter general publicadas en el Diario ' +
      'Oficial de la Federación, y no se localizó tal acuerdo al 2026-07-26. El Reglamento, los ' +
      'Lineamientos del INM de 2012, los Lineamientos consulares de 2025 y la propia página pública del ' +
      'INM siguen describiéndolo en tiempo futuro. Este registro existe para que quien haya oído hablar ' +
      'del sistema de puntos obtenga una respuesta en lugar de silencio; no es una vía disponible y no ' +
      'debe presentarse como tal.',
  },
  citations: [lmigraArt54, lmigraArt57, regLmigraArt139, tramitesArt44],
  criteria: [
    {
      id: 'mx-rp-puntos-acuerdo-published',
      kind: 'procedural',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: [
        'mx-lmigra-art-54',
        'mx-lmigra-art-57',
        'mx-reg-lmigra-art-139',
        'mx-lineamientos-tramites-2012-art-44',
      ],
      label: {
        en: 'An implementing acuerdo has been published in the Diario Oficial de la Federación',
        es: 'Se ha publicado en el Diario Oficial de la Federación el acuerdo de implementación',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'This is not a fact about the applicant. It is a fact about the world, and the answer found on ' +
          '2026-07-26 was that no acuerdo establishing the sistema de puntos could be located, while ' +
          'Reglamento art. 139.IV, art. 44 requisito 4 of the 2012 Lineamientos and Trámite 7.III.c of ' +
          'the 2025 Lineamientos all still refer to it prospectively. A negative cannot be proved from a ' +
          'search, so anybody relying on this record must re-check the DOF before concluding either way. ' +
          'Until then no criteria are encoded, because encoding criteria for a system whose contents have ' +
          'never been published would be inventing them.',
        es:
          'Esto no es un hecho de la persona solicitante. Es un hecho del mundo, y la respuesta hallada ' +
          'el 2026-07-26 fue que no pudo localizarse acuerdo alguno que estableciera el sistema de ' +
          'puntos, mientras que el art. 139.IV del Reglamento, el requisito 4 del art. 44 de los ' +
          'Lineamientos de 2012 y el Trámite 7.III.c de los Lineamientos de 2025 siguen refiriéndose a él ' +
          'de forma prospectiva. Una negación no se demuestra con una búsqueda, de modo que quien se ' +
          'apoye en este registro debe volver a consultar el DOF antes de concluir en un sentido u otro. ' +
          'Entre tanto no se codifica criterio alguno, porque codificar los criterios de un sistema cuyo ' +
          'contenido nunca se ha publicado sería inventarlos.',
      },
    },
  ],
  durations: {
    citationIds: ['mx-lmigra-art-57'],
    note: {
      en:
        'Art. 57 states what such a system would have to contain at minimum: the entry criteria, taking ' +
        'account of the quotas art. 18.II allows; the applicant capacities, including education, work ' +
        'experience, aptitude in science and technology, international recognition and aptitude for ' +
        'activities the country needs; and the procedure for applying. It also says that a person ' +
        'entering by that route would carry a work permission and the right to family unity under ' +
        'art. 55. None of that is operative without the acuerdo.',
      es:
        'El art. 57 señala lo que tal sistema debería contener como mínimo: los criterios de ingreso, ' +
        'atendiendo a las cuotas que permite el art. 18.II; las capacidades del solicitante, incluidos el ' +
        'nivel educativo, la experiencia laboral, las aptitudes en ciencia y tecnología, los ' +
        'reconocimientos internacionales y la aptitud para desarrollar actividades que requiera el país; ' +
        'y el procedimiento para solicitar el ingreso. Añade que quien entrara por esa vía contaría con ' +
        'permiso de trabajo y con el derecho a la unidad familiar del art. 55. Nada de ello es operativo ' +
        'sin el acuerdo.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Regularización — arts. 132 a 136
//
// The chapter that matters most to the population already inside Mexico without
// status, and the Mexican counterpart to Spain's *arraigo*, which this catalog
// encodes at length in `catalog/es-arraigo.ts`. It is unusually generous on
// paper and it turns on a distinction that decides everything: art. 133 has two
// paragraphs and they carry different verbs. The first says the Instituto
// `podrá` regularise — a discretion. The second says certain people `tienen
// derecho` to regularisation — an entitlement. Five records follow that split.
//
// Two things a reader in this position most needs to know, and both are encoded
// rather than left in prose. Art. 136: attending an INM office to ask for
// regularisation cannot itself trigger detention, subject to the two exceptions
// in Reglamento art. 146. And Lineamientos 2012 art. 51: the family route asks
// for no economic solvency at all, unlike every other route in this file.
// ---------------------------------------------------------------------------

export const mxRegularizacionVinculoFamiliar: Pathway = {
  id: 'mx-regularizacion-vinculo-familiar',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Regularisation by family link',
    es: 'Regularización por vínculo familiar',
  },
  summary: {
    en:
      'The second paragraph of art. 133 gives a RIGHT — not a discretion — to regularise, to a foreigner ' +
      'in Mexican territory who is the spouse, concubina or concubinario of a Mexican or of a foreigner ' +
      'with resident status, or who is the parent or child of, or holds the legal representation or ' +
      'custody of, such a person. The INM ficha for this route asks for identity documents, the fee, the ' +
      'migratory document if one was ever held, the fine, and proof of the relationship. IT ASKS FOR NO ' +
      'ECONOMIC SOLVENCY AT ALL, which is what distinguishes it from every other regularisation route.',
    es:
      'El segundo párrafo del art. 133 reconoce un DERECHO —no una facultad discrecional— a regularizar ' +
      'la situación migratoria a la persona extranjera que se ubique en territorio nacional y sea ' +
      'cónyuge, concubina o concubinario de persona mexicana o de persona extranjera con condición de ' +
      'estancia de residente, o sea padre, madre o hijo, o tenga la representación legal o custodia de ' +
      'esa persona. La ficha del INM pide identidad, derechos, el documento migratorio si alguna vez lo ' +
      'tuvo, la multa y la prueba del vínculo. NO PIDE SOLVENCIA ECONÓMICA ALGUNA, y eso es lo que la ' +
      'distingue de las demás vías de regularización.',
  },
  citations: [
    lmigraArt132,
    lmigraArt133,
    lmigraArt135,
    lmigraArt136,
    lmigraArt145,
    lmigraArt53,
    regLmigraArt144,
    regLmigraArt145,
    regLmigraArt146,
    tramitesArt45,
    tramitesArt51,
    regLnacArt14,
  ],
  criteria: [
    {
      id: 'mx-reg-fam-in-mexico-without-status',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-132', 'mx-lmigra-art-133'],
      label: {
        en: 'Present in Mexican territory without regular migration status',
        es: 'Encontrarse en territorio nacional sin situación migratoria regular',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'irregular' },
      guidance: {
        en:
          'Art. 132 opens the chapter to a person who lacks the documentation to evidence regular status, ' +
          'whose documentation has expired, or who has ceased to satisfy the requirements on which a ' +
          'condición de estancia was granted. Art. 133 second paragraph adds that the person must be in ' +
          'Mexican territory. If you still hold valid status you do not need this chapter; if your ' +
          'document has merely expired, art. 134.I may also be open to you and it carries a sixty-day ' +
          'deadline that this route does not — see mx-regularizacion-documento-vencido, and do not let ' +
          'that clock run out while deciding between them.',
        es:
          'El art. 132 abre el capítulo a quien carece de la documentación necesaria para acreditar su ' +
          'situación migratoria regular, a quien la tiene vencida y a quien ha dejado de satisfacer los ' +
          'requisitos en virtud de los cuales se le otorgó una condición de estancia. El segundo párrafo ' +
          'del art. 133 añade que la persona debe ubicarse en territorio nacional. Si conserva estatus ' +
          'vigente no necesita este capítulo; si su documento solo está vencido, puede que también le ' +
          'aplique el art. 134.I, que lleva un plazo de sesenta días que esta vía no tiene —véase ' +
          'mx-regularizacion-documento-vencido— y conviene no dejar correr ese plazo mientras se decide ' +
          'entre ambas.',
      },
    },
    {
      id: 'mx-reg-fam-qualifying-relationship',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-133', 'mx-reg-lmigra-art-144', 'mx-lineamientos-tramites-2012-art-51'],
      label: {
        en: 'Spouse, partner, parent, child, legal representative or custodian of a Mexican or a resident',
        es: 'Cónyuge, concubino, padre, madre, hijo, representante legal o custodio de mexicano o residente',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Meridian holds no facts about relatives — neither the relationship nor the relative status in ' +
          'Mexico — and both are required. Art. 133.I covers the spouse, concubina or concubinario of a ' +
          'Mexican or of a foreigner with the condición de estancia of RESIDENTE, which means residente ' +
          'temporal or residente permanente and not a visitante. Art. 133.II covers the parent, mother or ' +
          'child of such a person, and anyone holding their legal representation or custody. A reviewer ' +
          'must establish which fraction applies and what status the relative holds, and evidence it with ' +
          'the documents art. 51 of the 2012 Lineamientos lists: a signed statement of the conjugal ' +
          'domicile with the relative identification and the marriage or concubinato document, or the ' +
          'relevant birth certificate or court document.',
        es:
          'Meridian no dispone de datos sobre familiares —ni del parentesco ni de la situación migratoria ' +
          'del familiar en México— y ambos son necesarios. El art. 133.I comprende al cónyuge, concubina ' +
          'o concubinario de persona mexicana o de persona extranjera con condición de estancia de ' +
          'RESIDENTE, es decir residente temporal o permanente y no visitante. El art. 133.II comprende ' +
          'al padre, madre o hijo de esa persona y a quien tenga su representación legal o custodia. ' +
          'Corresponde a una persona determinar qué fracción aplica y qué condición ostenta el familiar, ' +
          'y acreditarlo con los documentos que enumera el art. 51 de los Lineamientos de 2012: escrito ' +
          'firmado señalando el domicilio conyugal junto con la identificación del familiar y el acta de ' +
          'matrimonio o el documento de concubinato, o el acta de nacimiento o la resolución judicial que ' +
          'corresponda.',
      },
    },
    {
      id: 'mx-reg-fam-no-solvency-required',
      kind: 'economic',
      weight: 'informational',
      citationIds: ['mx-lineamientos-tramites-2012-art-51', 'mx-lmigra-art-135', 'mx-lmigra-art-145'],
      label: {
        en: 'No economic solvency is required on this route',
        es: 'Esta vía no exige solvencia económica',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'The ficha at art. 51 of the 2012 Lineamientos lists the requirements exhaustively and no ' +
          'solvency figure appears among them — compare art. 52, the ficha for an expired document or ' +
          'unauthorised activities, which requires 20,000 días of average monthly balance or 400 días of ' +
          'monthly income. That asymmetry is deliberate and it is the point of the family route. What is ' +
          'required is a passport or an official identity document from the country of origin, payment of ' +
          'the fee, the migratory document if one was ever held, proof of the relationship, and payment ' +
          'of the fine art. 145 of the Ley sets at twenty to forty días for a fraction I or II case. ' +
          'This criterion states the rule and affects no verdict.',
        es:
          'La ficha del art. 51 de los Lineamientos de 2012 enumera los requisitos de forma exhaustiva y ' +
          'entre ellos no figura cifra alguna de solvencia —compárese con el art. 52, ficha del documento ' +
          'vencido o de las actividades no autorizadas, que exige 20,000 días de saldo promedio mensual o ' +
          '400 días de ingresos mensuales—. Esa asimetría es deliberada y es la razón de ser de la vía ' +
          'familiar. Lo que sí se exige es pasaporte o documento oficial de identidad del país de origen, ' +
          'el pago de derechos, el documento migratorio si alguna vez se tuvo, la prueba del vínculo y el ' +
          'pago de la multa que el art. 145 de la Ley fija en veinte a cuarenta días para los supuestos ' +
          'de las fracciones I y II. Este criterio enuncia la regla y no incide en el resultado.',
      },
    },
    {
      id: 'mx-reg-fam-attendance-protected',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['mx-lmigra-art-136', 'mx-reg-lmigra-art-146', 'mx-lineamientos-tramites-2012-art-45'],
      label: {
        en: 'Attending INM to ask for regularisation cannot itself trigger detention',
        es: 'Acudir al INM a solicitar la regularización no puede por sí mismo motivar la presentación',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Art. 136 first paragraph: "El Instituto no podrá presentar al extranjero que acuda ante el ' +
          'mismo a solicitar la regularización de su situación migratoria." Art. 45 of the 2012 ' +
          'Lineamientos adds that the authority must RECEIVE every regularisation application presented ' +
          'to it — receipt is not grant, but an office may not refuse to take it. Reglamento art. 146 ' +
          'carries two exceptions and they matter: the protection is lost where the person previously ' +
          'failed to comply with an exit order issued by INM, or previously supplied false information or ' +
          'apocryphal, altered or fraudulently obtained documents. A person already in an estación ' +
          'migratoria who falls within arts. 133 or 134 must be issued an oficio de salida within ' +
          'twenty-four hours of proving the requirements. Meridian states the rule; it cannot tell any ' +
          'individual that they are safe, and anyone weighing this should take it to a lawyer or a ' +
          'specialised organisation first.',
        es:
          'Primer párrafo del art. 136: «El Instituto no podrá presentar al extranjero que acuda ante el ' +
          'mismo a solicitar la regularización de su situación migratoria.» El art. 45 de los ' +
          'Lineamientos de 2012 añade que la autoridad DEBE RECIBIR todas las solicitudes de ' +
          'regularización que se presenten: recibir no es conceder, pero una oficina no puede negarse a ' +
          'admitirlas. El art. 146 del Reglamento contiene dos excepciones que importan: la protección se ' +
          'pierde si la persona incumplió antes una orden de salida expedida por el INM, o si presentó ' +
          'antes información falsa o documentación apócrifa, alterada u obtenida de manera fraudulenta. ' +
          'A quien ya se encuentre en una estación migratoria y se ubique en los arts. 133 o 134 debe ' +
          'extendérsele oficio de salida dentro de las veinticuatro horas siguientes a que acredite los ' +
          'requisitos. Meridian enuncia la regla; no puede decirle a nadie que esté a salvo, y quien ' +
          'sopese esta vía debería consultarlo antes con un profesional o con una organización ' +
          'especializada.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: [
      'mx-lmigra-art-136',
      'mx-reg-lmigra-art-146',
      'mx-reg-lmigra-art-145',
      'mx-lmigra-art-53',
      'mx-lineamientos-tramites-2012-art-51',
      'mx-reg-lnac-art-14',
    ],
    note: {
      en:
        'The ficha at art. 51 of the 2012 Lineamientos gives the resulting authorisation up to four years ' +
        'for a residente temporal and indefinite validity for a residente permanente, which is why no ' +
        'single grant length is stated above. Two decision periods are in force in their own instruments ' +
        'and they conflict: art. 136 of the Ley gives INM thirty NATURAL days from filing, and Reglamento ' +
        'art. 146.III gives twenty WORKING days for applications made at trámite offices. The statute ' +
        'governs where they conflict. Both are legal ceilings, not service standards. Reglamento art. 145 ' +
        'is worth knowing before choosing this route: regularisation does not by itself change the ' +
        'condición de estancia, except in the art. 53 cases — and a family link is one of those. A ' +
        'refusal has a cost: the person must leave in the period given and may not apply again for six ' +
        'months from notification.',
      es:
        'La ficha del art. 51 de los Lineamientos de 2012 concede a la autorización resultante hasta ' +
        'cuatro años para el residente temporal y vigencia indefinida para el residente permanente, y por ' +
        'eso arriba no se indica una duración única. Hay dos plazos de resolución vigentes en sus ' +
        'respectivos instrumentos y son incompatibles: el art. 136 de la Ley concede al INM treinta días ' +
        'NATURALES desde la presentación, y el art. 146.III del Reglamento veinte días HÁBILES para las ' +
        'solicitudes presentadas en oficinas de trámites. Prevalece la Ley. Ambos son topes legales, no ' +
        'estándares de servicio. Conviene conocer el art. 145 del Reglamento antes de elegir esta vía: la ' +
        'regularización no implica por sí misma cambio de condición de estancia, salvo en los supuestos ' +
        'del art. 53 —y el vínculo familiar es uno de ellos—. La negativa tiene coste: la persona debe ' +
        'salir en el plazo concedido y no puede volver a solicitar hasta que transcurran seis meses desde ' +
        'la notificación.',
    },
  },
  leadsTo: [
    'mx-residente-permanente-unidad-familiar',
    'mx-residente-permanente-cuatro-anos',
    'mx-naturalizacion-residencia-general',
  ],
  reviewStatus: 'unreviewed',
};

export const mxRegularizacionVulnerabilidad: Pathway = {
  id: 'mx-regularizacion-vulnerabilidad',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Regularisation as a victim, a witness, or a person in a situation of vulnerability',
    es: 'Regularización por víctima, testigo o situación de vulnerabilidad',
  },
  summary: {
    en:
      'The remaining three entitlement grounds of art. 133 second paragraph: being identified by INM or a ' +
      'competent authority as the victim or witness of a serious crime committed in Mexico (III); being ' +
      'of a degree of vulnerability that makes deportation or assisted return difficult or impossible ' +
      '(IV); and being a child or adolescent subject to international child-abduction or restitution ' +
      'proceedings (V). Reglamento art. 144.IV expands the vulnerability ground with a non-exhaustive ' +
      'list. Art. 145 of the Ley imposes NO FINE for any of these three. Every criterion here escalates ' +
      'to a person, because every one of them turns on a determination made by somebody else.',
    es:
      'Los tres supuestos restantes del derecho del segundo párrafo del art. 133: ser identificado por el ' +
      'Instituto o por autoridad competente como víctima o testigo de un delito grave cometido en ' +
      'territorio nacional (III); tener un grado de vulnerabilidad que dificulte o haga imposible la ' +
      'deportación o el retorno asistido (IV); y ser niña, niño o adolescente sujeto al procedimiento de ' +
      'sustracción y restitución internacional (V). El art. 144.IV del Reglamento amplía el supuesto de ' +
      'vulnerabilidad con una lista enunciativa. El art. 145 de la Ley no impone MULTA ALGUNA en ninguno ' +
      'de los tres. Todos los criterios de este registro se remiten a revisión humana, porque todos ' +
      'dependen de una determinación ajena.',
  },
  citations: [
    lmigraArt133,
    lmigraArt135,
    lmigraArt136,
    lmigraArt145,
    regLmigraArt144,
    regLmigraArt146,
    tramitesArt45,
    tramitesArt50,
    lrpcap,
    comar,
  ],
  criteria: [
    {
      id: 'mx-reg-vul-ground',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-133', 'mx-reg-lmigra-art-144'],
      label: {
        en: 'One of the grounds in art. 133 second paragraph, fractions III to V',
        es: 'Alguno de los supuestos de las fracciones III a V del segundo párrafo del art. 133',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'None of these grounds is a fact about the applicant that software can read. Fraction III ' +
          'requires the person to have been IDENTIFIED as a victim or witness of a serious crime by INM ' +
          'or a competent authority — the identification is the ground, not the underlying event. ' +
          'Fraction IV requires a degree of vulnerability that makes deportation or assisted return ' +
          'difficult or impossible, "y esto se acredite fehacientemente"; Reglamento art. 144.IV names ' +
          'unaccompanied migrant children where it serves their best interests, pregnant women, older ' +
          'adults, persons with disabilities and indigenous persons, persons with a grave health ' +
          'condition whose transfer would risk their life, and persons in danger of life or physical ' +
          'integrity from violence or natural disaster. Fraction V concerns children in international ' +
          'abduction and restitution proceedings, which are court proceedings. A reviewer must establish ' +
          'the ground and the determination behind it, and in most of these cases the right next step is ' +
          'a specialised organisation rather than a form.',
        es:
          'Ninguno de estos supuestos es un hecho de la persona solicitante que un programa pueda leer. ' +
          'La fracción III exige que la persona haya sido IDENTIFICADA como víctima o testigo de un ' +
          'delito grave por el Instituto o por autoridad competente: la identificación es el supuesto, no ' +
          'el hecho subyacente. La fracción IV exige un grado de vulnerabilidad que dificulte o haga ' +
          'imposible la deportación o el retorno asistido «y esto se acredite fehacientemente»; el ' +
          'art. 144.IV del Reglamento menciona a niñas, niños y adolescentes migrantes no acompañados ' +
          'cuando convenga a su interés superior, a mujeres embarazadas, adultos mayores, personas con ' +
          'discapacidad e indígenas, a quienes acrediten una alteración grave a la salud cuyo traslado ' +
          'implique riesgo a su vida, y a quienes se encuentren en peligro de vida o integridad por ' +
          'violencia o desastre natural. La fracción V se refiere a niñas, niños y adolescentes en ' +
          'procedimientos de sustracción y restitución internacional, que son procedimientos ' +
          'jurisdiccionales. Corresponde a una persona determinar el supuesto y la resolución que lo ' +
          'sustenta, y en la mayoría de estos casos el siguiente paso adecuado es una organización ' +
          'especializada y no un formulario.',
      },
    },
    {
      id: 'mx-reg-vul-protection-claim-out-of-scope',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-reg-lmigra-art-144', 'mx-lrpcap-art-13-18', 'mx-comar'],
      label: {
        en: 'A pending protection claim is a vulnerability ground, and is assessed by COMAR, never here',
        es: 'La solicitud de protección en trámite es supuesto de vulnerabilidad, y la resuelve la COMAR',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Reglamento art. 144.IV(e) makes an applicant for refugee status, political asylum or a ' +
          'statelessness determination a vulnerability case until that procedure concludes. Meridian ' +
          'encodes the migration consequence and never the protection question: it does not assess ' +
          'whether a fear is well-founded, does not rank protection against a migration route, and states ' +
          'no likelihood of recognition. The competent body is COMAR for refugee status and complementary ' +
          'protection and the SRE for political asylum. THE DEADLINE IS SHORT AND IT IS NOT RECOVERABLE ' +
          'BY ANYTHING IN THIS FILE: Ley sobre Refugiados art. 18 requires the claim to be filed within ' +
          'thirty WORKING days from the day after entry, or from the day it first became materially ' +
          'possible to file. Anyone in this position needs qualified help immediately.',
        es:
          'El art. 144.IV(e) del Reglamento convierte en supuesto de vulnerabilidad a quien solicita el ' +
          'reconocimiento de la condición de refugiado, asilo político o la determinación de apátrida, ' +
          'hasta que concluya el procedimiento. Meridian codifica la consecuencia migratoria y nunca la ' +
          'cuestión de protección: no valora si un temor está fundado, no jerarquiza la protección frente ' +
          'a una vía migratoria y no expresa probabilidad alguna de reconocimiento. El órgano competente ' +
          'es la COMAR para la condición de refugiado y la protección complementaria, y la SRE para el ' +
          'asilo político. EL PLAZO ES BREVE Y NADA EN ESTE ARCHIVO LO RECUPERA: el art. 18 de la Ley ' +
          'sobre Refugiados exige presentar la solicitud dentro de los treinta días HÁBILES contados ' +
          'desde el día hábil siguiente al ingreso, o desde aquel en que haya sido materialmente posible ' +
          'presentarla. Quien se encuentre en esta situación necesita ayuda cualificada de inmediato.',
      },
      guidance: {
        en: 'COMAR: https://www.gob.mx/comar',
        es: 'COMAR: https://www.gob.mx/comar',
      },
    },
    {
      id: 'mx-reg-vul-no-fine',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['mx-lmigra-art-145', 'mx-lineamientos-tramites-2012-art-50'],
      label: {
        en: 'No fine is payable on these grounds',
        es: 'Estos supuestos no causan multa',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Art. 145 second paragraph: "Los extranjeros que se encuentren en los supuestos de las ' +
          'fracciones III, IV y V del artículo 133 de esta Ley no serán acreedores a ninguna multa." The ' +
          'humanitarian visitor trámite is separately exempt from the fee under art. 16 of the Ley ' +
          'Federal de Derechos. This criterion states the rule and affects no verdict.',
        es:
          'Segundo párrafo del art. 145: «Los extranjeros que se encuentren en los supuestos de las ' +
          'fracciones III, IV y V del artículo 133 de esta Ley no serán acreedores a ninguna multa.» El ' +
          'trámite del visitante por razones humanitarias está además exento del pago de derechos ' +
          'conforme al art. 16 de la Ley Federal de Derechos. Este criterio enuncia la regla y no incide ' +
          'en el resultado.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: [
      'mx-lmigra-art-136',
      'mx-reg-lmigra-art-146',
      'mx-lmigra-art-135',
      'mx-lineamientos-tramites-2012-art-45',
    ],
    note: {
      en:
        'Art. 133 lets the regularisation be granted "concediendo al extranjero la condición de estancia ' +
        'que corresponda conforme a esta Ley", so the resulting status — and therefore its length and ' +
        'whether it builds residence for naturalisation — depends on which condition is granted. No ' +
        'single figure is stated for that reason. INM has thirty natural days to decide under art. 136 ' +
        'and twenty working days under Reglamento art. 146.III; the statute governs. Art. 45 of the 2012 ' +
        'Lineamientos requires the authority to receive every regularisation application presented to it. ' +
        'A person refused must leave in the period given and may not apply again for six months.',
      es:
        'El art. 133 permite otorgar la regularización «concediendo al extranjero la condición de ' +
        'estancia que corresponda conforme a esta Ley», de modo que el estatus resultante —y con él su ' +
        'duración y si genera residencia para la naturalización— depende de qué condición se conceda. Por ' +
        'eso no se indica una cifra única. El INM dispone de treinta días naturales conforme al art. 136 ' +
        'y de veinte días hábiles conforme al art. 146.III del Reglamento; prevalece la Ley. El art. 45 de ' +
        'los Lineamientos de 2012 obliga a la autoridad a recibir todas las solicitudes de regularización ' +
        'que se presenten. Quien reciba una negativa debe salir en el plazo concedido y no puede volver a ' +
        'solicitar durante seis meses.',
    },
  },
  leadsTo: ['mx-residente-permanente-cuatro-anos'],
  reviewStatus: 'unreviewed',
};

export const mxRegularizacionDocumentoVencido: Pathway = {
  id: 'mx-regularizacion-documento-vencido',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Regularisation after exceeding the authorised stay — the sixty-day window',
    es: 'Regularización por haber excedido la estancia autorizada — la ventana de sesenta días',
  },
  summary: {
    en:
      'Art. 134.I lets a person who was regularly admitted and has exceeded the stay initially granted ' +
      'apply to regularise, PROVIDED THE APPLICATION IS MADE WITHIN SIXTY NATURAL DAYS OF THE EXPIRY of ' +
      'the authorised period. The sixty days run from the expiry of the stay, not from entry, and ' +
      'Reglamento art. 144.V restates the same limit as holding a migratory document expired by no more ' +
      'than sixty natural days. This is the hardest deadline in the chapter and the cleanest number in ' +
      'it. Art. 134 is expressly subject to art. 43.',
    es:
      'El art. 134.I permite solicitar la regularización a quien, habiendo obtenido autorización para ' +
      'internarse de forma regular, haya excedido el periodo de estancia inicialmente otorgado, SIEMPRE ' +
      'QUE PRESENTE LA SOLICITUD DENTRO DE LOS SESENTA DÍAS NATURALES SIGUIENTES AL VENCIMIENTO del ' +
      'periodo autorizado. Los sesenta días corren desde el vencimiento de la estancia, no desde la ' +
      'entrada, y el art. 144.V del Reglamento reitera el mismo límite como tener documento migratorio ' +
      'con vencimiento no mayor a sesenta días naturales. Es el plazo más rígido del capítulo y la cifra ' +
      'más nítida de todo él. El art. 134 queda expresamente sujeto al art. 43.',
  },
  citations: [
    lmigraArt132,
    lmigraArt134,
    lmigraArt135,
    lmigraArt136,
    lmigraArt43,
    lmigraArt145,
    regLmigraArt144,
    regLmigraArt146,
    tramitesArt45,
    tramitesArt52,
    cpeumArt26b,
    uma2026,
    ldvuma,
  ],
  criteria: [
    {
      id: 'mx-reg-dv-sixty-day-window',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-134', 'mx-reg-lmigra-art-144'],
      label: {
        en: 'The application is made within sixty natural days of the expiry of the authorised stay',
        es: 'La solicitud se presenta dentro de los sesenta días naturales siguientes al vencimiento',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_present', path: 'statusExpiresOn' },
          {
            op: 'not',
            of: { op: 'duration_since_at_least', path: 'statusExpiresOn', days: 62 },
          },
        ],
      },
      humanReviewWhen: { op: 'duration_since_at_least', path: 'statusExpiresOn', days: 46 },
      humanReviewReason: {
        en:
          'AN ENGINE SAFEGUARD, NOT A LEGAL THRESHOLD. Art. 134.I measures the sixty days to the day the ' +
          'application is FILED; this engine measures them to the date the assessment is run, because ' +
          'the declarative rule language cannot compare one recorded date against another. For most of ' +
          'the window the difference does not matter. Once forty-five days have already elapsed it ' +
          'decides the case: an assessment run on day 50 that says the window is open is silent about a ' +
          'filing on day 65. From that point a person must confirm the exact expiry date on the ' +
          'migratory document and the exact filing date, and treat the remaining days as fewer than they ' +
          'look.',
        es:
          'ES UNA SALVAGUARDA DEL MOTOR, NO UN UMBRAL LEGAL. El art. 134.I cuenta los sesenta días hasta ' +
          'el día en que se PRESENTA la solicitud; este motor los cuenta hasta la fecha en que se ejecuta ' +
          'la evaluación, porque el lenguaje declarativo de reglas no puede comparar una fecha ' +
          'registrada con otra. Durante casi toda la ventana la diferencia es irrelevante. A partir de ' +
          'los cuarenta y cinco días transcurridos decide el caso: una evaluación hecha el día 50 que ' +
          'diga que la ventana sigue abierta nada dice de una presentación el día 65. Desde ese momento ' +
          'hay que confirmar la fecha exacta de vencimiento en el documento migratorio y la fecha exacta ' +
          'de presentación, y tratar los días restantes como menos de los que parecen.',
      },
      guidance: {
        en:
          'The arithmetic, stated so it can be checked. The window is the sixty natural days FOLLOWING ' +
          'the expiry, so the last day inside it is the expiry date plus sixty. The engine operator ' +
          '"duration_since_at_least" is true once a period that begins on the start date has completed, ' +
          'and a period of N days completes on the start date plus N minus one; the rule therefore asks ' +
          'whether sixty-two days have NOT completed, which is true up to and including the expiry date ' +
          'plus sixty and false from plus sixty-one. An off-by-one here would tell somebody who filed on ' +
          'the last day that they filed late, which is why it is spelled out rather than left to a ' +
          'reader to re-derive. Where no expiry date is on file the criterion reports unknown rather ' +
          'than assuming the window is open.',
        es:
          'La aritmética, enunciada para que pueda comprobarse. La ventana son los sesenta días naturales ' +
          'SIGUIENTES al vencimiento, de modo que el último día dentro de ella es la fecha de vencimiento ' +
          'más sesenta. El operador «duration_since_at_least» del motor resulta verdadero cuando un ' +
          'periodo iniciado en la fecha de partida ha concluido, y un periodo de N días concluye en la ' +
          'fecha de partida más N menos uno; la regla pregunta por tanto si NO han concluido sesenta y ' +
          'dos días, lo que es cierto hasta la fecha de vencimiento más sesenta inclusive y falso desde ' +
          'más sesenta y uno. Un error de un día aquí le diría a quien presentó el último día que ' +
          'presentó tarde, y por eso se explica en lugar de dejar que quien lea lo vuelva a deducir. Si ' +
          'no consta fecha de vencimiento, el criterio responde «desconocido» en lugar de suponer que la ' +
          'ventana sigue abierta.',
      },
    },
    {
      id: 'mx-reg-dv-was-regularly-admitted',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-134', 'mx-lmigra-art-132'],
      label: {
        en: 'Was admitted to Mexico with authorisation and has since exceeded the stay',
        es: 'Fue admitido en México con autorización y después excedió la estancia',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'irregular' },
      guidance: {
        en:
          'Art. 134.I opens only to somebody who "habiendo obtenido autorización para internarse de ' +
          'forma regular al país" then exceeded the stay. A person who entered without authorisation at ' +
          'all is not in this fraction; their routes are art. 133 second paragraph if a family link or a ' +
          'vulnerability ground applies, or the general discretion of art. 133 first paragraph. A person ' +
          'whose document is still valid does not need the chapter yet — but should note the sixty days ' +
          'begin the moment it expires.',
        es:
          'El art. 134.I se abre solo a quien, «habiendo obtenido autorización para internarse de forma ' +
          'regular al país», después excedió la estancia. Quien entró sin autorización alguna no está en ' +
          'esta fracción; sus vías son el segundo párrafo del art. 133 si concurre un vínculo familiar o ' +
          'un supuesto de vulnerabilidad, o la facultad general del primer párrafo del art. 133. Quien ' +
          'aún tiene documento vigente todavía no necesita el capítulo, pero conviene que sepa que los ' +
          'sesenta días empiezan en el instante en que venza.',
      },
    },
    {
      id: 'mx-reg-dv-art-43-screening',
      kind: 'character',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-43', 'mx-lmigra-art-134'],
      label: {
        en: 'Not within any of the refusal grounds of art. 43',
        es: 'No ubicarse en ninguno de los supuestos de negativa del art. 43',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 134 opens with "salvo lo dispuesto en el artículo 43 de esta Ley", so this whole route is ' +
          'expressly subject to the refusal grounds. Those grounds are an open-ended officer judgement ' +
          'with no threshold: a record in Mexico or abroad that compromises national or public security; ' +
          'failure to meet the requirements of the Ley, its Reglamento or other applicable provisions; ' +
          'documents or elements verified as inauthentic; an express prohibition by a competent ' +
          'authority; or anything other legal provisions supply. Nothing here is arithmetic and none of ' +
          'it is something software should decide. A reviewer must consider it, and a green tick next to ' +
          'it would be the most damaging output this catalog could produce.',
        es:
          'El art. 134 comienza con «salvo lo dispuesto en el artículo 43 de esta Ley», de modo que toda ' +
          'esta vía queda expresamente sujeta a los supuestos de negativa. Esos supuestos son un juicio ' +
          'abierto de la autoridad, sin umbral: antecedentes en México o en el extranjero que comprometan ' +
          'la seguridad nacional o la pública; no cumplir los requisitos de la Ley, su Reglamento u otras ' +
          'disposiciones aplicables; que se verifique que los documentos o elementos aportados no son ' +
          'auténticos; estar sujeto a prohibiciones expresas de autoridad competente; o lo que prevean ' +
          'otras disposiciones jurídicas. Nada de esto es aritmética ni es algo que deba resolver un ' +
          'programa. Corresponde valorarlo a una persona, y una marca verde junto a este criterio sería ' +
          'el resultado más dañino que este catálogo podría producir.',
      },
    },
    {
      id: 'mx-reg-dv-solvency-or-other-ground',
      kind: 'economic',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: [
        'mx-lineamientos-tramites-2012-art-52',
        'mx-cpeum-art-26b-uma',
        'mx-uma-2026',
        'mx-ldvuma-arts-4-5',
        'mx-lmigra-art-135',
      ],
      label: {
        en: 'The requirements of the condición de estancia sought, at the INM-counter figures',
        es: 'Los requisitos de la condición de estancia que se pretende, con las cifras de ventanilla del INM',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 135.VI requires the applicant to meet the requirements for the condición de estancia they ' +
          'are seeking, and art. 52 of the 2012 Lineamientos sets those at an INM counter in DÍAS DE ' +
          'SALARIO MÍNIMO GENERAL VIGENTE EN EL DISTRITO FEDERAL — a unit whose name has not existed ' +
          'since 2016 and which the constitutional transitional article of DOF 2016-01-27 converts to ' +
          'UMA by operation of law, although INM own published material still prints the old wording. ' +
          'The figures are: solvency, 20,000 días of average monthly balance over twelve months or 400 ' +
          'días of monthly income over six months, reduced to 500 and 150 días where the outcome sought ' +
          'is visitante sin permiso; real property of 40,000 días; investor, 20,000 días plus an IMSS ' +
          'certificate of at least five workers; student, 20,000 días of balance over twelve months or ' +
          '300 días for the visitante outcome. A job offer is an alternative ground and carries no figure ' +
          'at all. Meridian holds no index, and WHICH NUMBER AN INM OFFICER ACTUALLY APPLIES TO THE OLD ' +
          'UNIT COULD NOT BE ESTABLISHED, so a reviewer must settle both the ground and the conversion.',
        es:
          'El art. 135.VI exige cumplir los requisitos de la condición de estancia que se pretende ' +
          'adquirir, y el art. 52 de los Lineamientos de 2012 los fija, en ventanilla del INM, en DÍAS DE ' +
          'SALARIO MÍNIMO GENERAL VIGENTE EN EL DISTRITO FEDERAL: una unidad cuyo nombre no existe desde ' +
          '2016 y que el artículo transitorio constitucional del DOF 2016-01-27 convierte en UMA por ' +
          'ministerio de ley, aunque el propio material publicado del INM siga imprimiendo la redacción ' +
          'antigua. Las cifras son: solvencia, 20,000 días de saldo promedio mensual durante doce meses o ' +
          '400 días de ingresos mensuales durante seis meses, reducidos a 500 y 150 días cuando la ' +
          'condición pretendida es la de visitante sin permiso; bienes inmuebles por 40,000 días; ' +
          'inversionista, 20,000 días más constancia del IMSS de al menos cinco trabajadores; estudiante, ' +
          '20,000 días de saldo durante doce meses o 300 días para el resultado de visitante. La oferta ' +
          'de empleo es un supuesto alternativo y no lleva cifra alguna. Meridian no dispone del índice ' +
          'y NO PUDO ESTABLECERSE QUÉ CIFRA APLICA EN LA PRÁCTICA UNA AUTORIDAD DEL INM A LA UNIDAD ' +
          'ANTIGUA, de modo que corresponde a una persona resolver tanto el supuesto como la conversión.',
      },
    },
  ],
  durations: {
    citationIds: [
      'mx-lineamientos-tramites-2012-art-52',
      'mx-lmigra-art-136',
      'mx-reg-lmigra-art-146',
      'mx-lmigra-art-145',
      'mx-lineamientos-tramites-2012-art-45',
    ],
    note: {
      en:
        'The ficha at art. 52 of the 2012 Lineamientos gives the resulting authorisation 180 days for a ' +
        'visitante with or without a work permission, up to four years for a residente temporal and one ' +
        'year for a residente temporal estudiante, so no single grant length is stated above. Art. 146 of ' +
        'the Ley sets the fine for an art. 134 regularisation at twenty to one hundred días, against ' +
        'twenty to forty for the art. 133 family cases. INM has thirty natural days to decide under ' +
        'art. 136 and twenty working days under Reglamento art. 146.III; the statute governs, and both ' +
        'are legal ceilings rather than service standards. Art. 45 of the 2012 Lineamientos requires the ' +
        'authority to receive every regularisation application presented to it, which matters here more ' +
        'than anywhere: the sixty days do not pause while an office decides whether to take the papers. A ' +
        'refusal carries a six-month bar on applying again.',
      es:
        'La ficha del art. 52 de los Lineamientos de 2012 concede a la autorización resultante 180 días ' +
        'para el visitante con o sin permiso para realizar actividades remuneradas, hasta cuatro años ' +
        'para el residente temporal y un año para el residente temporal estudiante, por lo que arriba no ' +
        'se indica una duración única. El art. 146 de la Ley fija la multa de la regularización del ' +
        'art. 134 en veinte a cien días, frente a veinte a cuarenta de los supuestos familiares del ' +
        'art. 133. El INM dispone de treinta días naturales conforme al art. 136 y de veinte días ' +
        'hábiles conforme al art. 146.III del Reglamento; prevalece la Ley, y ambos son topes legales y ' +
        'no estándares de servicio. El art. 45 de los Lineamientos de 2012 obliga a la autoridad a ' +
        'recibir todas las solicitudes de regularización que se presenten, lo que aquí importa más que en ' +
        'ninguna otra vía: los sesenta días no se detienen mientras una oficina decide si admite los ' +
        'documentos. La negativa conlleva la imposibilidad de volver a solicitar durante seis meses.',
    },
  },
  leadsTo: ['mx-residente-permanente-cuatro-anos'],
  reviewStatus: 'unreviewed',
};

export const mxRegularizacionActividadesNoAutorizadas: Pathway = {
  id: 'mx-regularizacion-actividades-no-autorizadas',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Regularisation after carrying out activities other than those authorised',
    es: 'Regularización por realizar actividades distintas a las autorizadas',
  },
  summary: {
    en:
      'Art. 134.II lets a person who carries out activities other than those their condición de estancia ' +
      'permits apply to regularise. Unlike fraction I there is NO SIXTY-DAY DEADLINE on this ground, ' +
      'because the irregularity is not the passage of time. The commonest case is paid work on a visitor ' +
      'condition, which art. 40 forbids unless the document says otherwise. Like fraction I, this route ' +
      'is expressly subject to art. 43. Reglamento art. 145 adds a consequence worth knowing before ' +
      'filing: where the person still held a valid migratory document when the irregularity arose, the ' +
      'regularised authorisation runs only for the remainder of that document.',
    es:
      'El art. 134.II permite solicitar la regularización a quien realice actividades distintas a las ' +
      'que le permite su condición de estancia. A diferencia de la fracción I, este supuesto NO LLEVA ' +
      'PLAZO DE SESENTA DÍAS, porque la irregularidad no consiste en el transcurso del tiempo. El caso ' +
      'más frecuente es el trabajo remunerado con una condición de visitante, que el art. 40 prohíbe ' +
      'salvo mención expresa en el documento. Como la fracción I, esta vía queda expresamente sujeta al ' +
      'art. 43. El art. 145 del Reglamento añade una consecuencia que conviene conocer antes de ' +
      'presentar: si la persona aún tenía documento migratorio vigente cuando incurrió en la ' +
      'irregularidad, la autorización que se le regularice durará solo lo que reste a ese documento.',
  },
  citations: [
    lmigraArt132,
    lmigraArt134,
    lmigraArt135,
    lmigraArt136,
    lmigraArt40,
    lmigraArt43,
    lmigraArt145,
    regLmigraArt144,
    regLmigraArt145,
    regLmigraArt146,
    tramitesArt45,
    tramitesArt52,
    uma2026,
    ldvuma,
  ],
  criteria: [
    {
      id: 'mx-reg-ana-ground',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-132', 'mx-lmigra-art-134', 'mx-reg-lmigra-art-144', 'mx-lmigra-art-40'],
      label: {
        en: 'Activities other than those the condición de estancia permits have been carried out',
        es: 'Se han realizado actividades distintas a las que permite la condición de estancia',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Meridian records an applicant status and their intentions, but not what they have actually ' +
          'been doing in Mexico, and this ground is entirely about the latter. Reglamento art. 144.VI ' +
          'phrases it as carrying out activities other than those authorised "y con ello haya dejado de ' +
          'satisfacer los requisitos por los cuales se le otorgó determinada condición de estancia". A ' +
          'reviewer must establish what was done, under which condition, and from when. The single ' +
          'commonest case is paid work on a visitor condition: art. 40 says no visa carries permission to ' +
          'work unless the document says so expressly.',
        es:
          'Meridian registra la condición migratoria de la persona y sus intenciones, pero no lo que ' +
          'efectivamente ha estado haciendo en México, y este supuesto trata exclusivamente de lo ' +
          'segundo. El art. 144.VI del Reglamento lo formula como realizar actividades distintas a las ' +
          'autorizadas «y con ello haya dejado de satisfacer los requisitos por los cuales se le otorgó ' +
          'determinada condición de estancia». Corresponde a una persona determinar qué se hizo, bajo qué ' +
          'condición y desde cuándo. El caso más frecuente con diferencia es el trabajo remunerado con ' +
          'una condición de visitante: el art. 40 señala que ninguna visa otorga permiso para trabajar ' +
          'salvo que el documento lo diga expresamente.',
      },
    },
    {
      id: 'mx-reg-ana-art-43-screening',
      kind: 'character',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-43', 'mx-lmigra-art-134'],
      label: {
        en: 'Not within any of the refusal grounds of art. 43',
        es: 'No ubicarse en ninguno de los supuestos de negativa del art. 43',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 134 is expressly subject to art. 43, whose grounds are an open-ended officer judgement ' +
          'with no threshold — national or public security, non-compliance with the Ley or its ' +
          'Reglamento, inauthentic documents, an express prohibition by a competent authority, or ' +
          'anything other legal provisions supply. Note the interaction that bites on this particular ' +
          'route: art. 43.II is failure to meet the requirements of the Ley, and the ground being ' +
          'regularised here is precisely a failure to comply. A reviewer must weigh that, and a green ' +
          'tick from software would be worse than no answer.',
        es:
          'El art. 134 queda expresamente sujeto al art. 43, cuyos supuestos son un juicio abierto de la ' +
          'autoridad sin umbral alguno: seguridad nacional o pública, incumplimiento de la Ley o de su ' +
          'Reglamento, documentos no auténticos, prohibición expresa de autoridad competente, o lo que ' +
          'prevean otras disposiciones jurídicas. Adviértase la interacción que opera en esta vía en ' +
          'concreto: el art. 43.II es no cumplir los requisitos de la Ley, y el supuesto que aquí se ' +
          'regulariza es justamente un incumplimiento. Corresponde ponderarlo a una persona, y una marca ' +
          'verde emitida por un programa sería peor que ninguna respuesta.',
      },
    },
    {
      id: 'mx-reg-ana-requirements',
      kind: 'economic',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: [
        'mx-lmigra-art-135',
        'mx-lineamientos-tramites-2012-art-52',
        'mx-uma-2026',
        'mx-ldvuma-arts-4-5',
      ],
      label: {
        en: 'The requirements of the condición de estancia sought, at the INM-counter figures',
        es: 'Los requisitos de la condición de estancia que se pretende, con las cifras de ventanilla del INM',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 135.VI requires the applicant to meet the requirements for the condición de estancia they ' +
          'seek, and the same ficha governs this route as the expired-document one: art. 52 of the 2012 ' +
          'Lineamientos, whose figures are in días de salario mínimo general vigente en el Distrito ' +
          'Federal — solvency of 20,000 días of average monthly balance over twelve months or 400 días of ' +
          'monthly income over six months, reduced to 500 and 150 días for a visitante sin permiso ' +
          'outcome, or real property of 40,000 días, or investor at 20,000 días with an IMSS certificate ' +
          'of at least five workers, or a job offer, which carries no figure. Meridian holds no index, ' +
          'and which peso value INM applies to the pre-2016 unit could not be established. On this route ' +
          'in particular the ficha outcome is often a visitor condition rather than residence, so the ' +
          'lower figures may be the applicable ones; a reviewer must settle which condition is being ' +
          'sought before measuring anything.',
        es:
          'El art. 135.VI exige cumplir los requisitos de la condición de estancia que se pretende ' +
          'adquirir, y esta vía se rige por la misma ficha que la del documento vencido: el art. 52 de ' +
          'los Lineamientos de 2012, cuyas cifras están en días de salario mínimo general vigente en el ' +
          'Distrito Federal —solvencia de 20,000 días de saldo promedio mensual durante doce meses o 400 ' +
          'días de ingresos mensuales durante seis meses, reducidos a 500 y 150 días para un resultado de ' +
          'visitante sin permiso; o bienes inmuebles por 40,000 días; o inversionista por 20,000 días con ' +
          'constancia del IMSS de al menos cinco trabajadores; o una oferta de empleo, que no lleva ' +
          'cifra—. Meridian no dispone del índice, y no pudo establecerse qué valor en pesos aplica el ' +
          'INM a la unidad anterior a 2016. En esta vía en particular el resultado de la ficha suele ser ' +
          'una condición de visitante y no de residencia, por lo que pueden ser aplicables las cifras ' +
          'menores; corresponde a una persona determinar qué condición se pretende antes de medir nada.',
      },
    },
    {
      id: 'mx-reg-ana-remaining-term',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['mx-reg-lmigra-art-145'],
      label: {
        en: 'The regularised authorisation may run only for the remainder of the existing document',
        es: 'La autorización regularizada puede durar solo lo que reste al documento existente',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Reglamento art. 145 second paragraph: for a person who still held a valid migratory document ' +
          'at the moment they became irregular by carrying out unauthorised activities, "la temporalidad ' +
          'de la condición de estancia que se autorice por regularización será la que resta al documento ' +
          'migratorio para su vencimiento". Regularising does not restart the clock. The same article ' +
          'also confirms that regularisation does not by itself change the condición de estancia except ' +
          'in the art. 53 cases — so somebody working on a visitor permit generally regularises back ' +
          'into a visitor condition matching the activity, not into residence. This criterion states the ' +
          'rule and affects no verdict.',
        es:
          'Segundo párrafo del art. 145 del Reglamento: para quien aún tenía documento migratorio vigente ' +
          'al incurrir en irregularidad por realizar actividades distintas a las autorizadas, «la ' +
          'temporalidad de la condición de estancia que se autorice por regularización será la que resta ' +
          'al documento migratorio para su vencimiento». Regularizarse no reinicia el cómputo. El mismo ' +
          'artículo confirma además que la regularización no implica por sí misma cambio de condición de ' +
          'estancia salvo en los supuestos del art. 53, de modo que quien trabaja con un permiso de ' +
          'visitante suele regularizarse hacia una condición de visitante acorde con la actividad y no ' +
          'hacia una de residencia. Este criterio enuncia la regla y no incide en el resultado.',
      },
    },
  ],
  durations: {
    citationIds: [
      'mx-reg-lmigra-art-145',
      'mx-lineamientos-tramites-2012-art-52',
      'mx-lineamientos-tramites-2012-art-45',
      'mx-lmigra-art-145',
      'mx-lmigra-art-136',
      'mx-reg-lmigra-art-146',
    ],
    note: {
      en:
        'No grant length is stated because Reglamento art. 145 makes it depend on the remaining validity ' +
        'of the document the person held. Where no document was held the ficha at art. 52 of the 2012 ' +
        'Lineamientos applies: 180 days for a visitante, up to four years for a residente temporal, one ' +
        'year for a residente temporal estudiante. The fine under art. 146 of the Ley is twenty to one ' +
        'hundred días. INM decides within thirty natural days under art. 136 of the Ley, or twenty ' +
        'working days under Reglamento art. 146.III; both are legal ceilings. Art. 45 of the 2012 ' +
        'Lineamientos requires the authority to receive every regularisation application presented to ' +
        'it, and Reglamento art. 146 adds that a refusal carries a six-month bar on applying again.',
      es:
        'No se indica duración porque el art. 145 del Reglamento la hace depender de la vigencia que ' +
        'reste al documento que la persona tenía. Si no tenía documento alguno se aplica la ficha del ' +
        'art. 52 de los Lineamientos de 2012: 180 días para el visitante, hasta cuatro años para el ' +
        'residente temporal, un año para el residente temporal estudiante. La multa del art. 146 de la ' +
        'Ley es de veinte a cien días. El INM resuelve en treinta días naturales conforme al art. 136 de ' +
        'la Ley, o en veinte días hábiles conforme al art. 146.III del Reglamento; ambos son topes ' +
        'legales. El art. 45 de los Lineamientos de 2012 obliga a la autoridad a recibir todas las ' +
        'solicitudes de regularización que se presenten, y el art. 146 del Reglamento añade que la ' +
        'negativa conlleva la imposibilidad de volver a solicitar durante seis meses.',
    },
  },
  leadsTo: ['mx-residente-permanente-cuatro-anos'],
  reviewStatus: 'unreviewed',
};

export const mxRegularizacionSolvencia: Pathway = {
  id: 'mx-regularizacion-solvencia',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Regularisation under the general power of art. 133, first paragraph',
    es: 'Regularización por la facultad general del primer párrafo del art. 133',
  },
  summary: {
    en:
      'The first paragraph of art. 133 is a DISCRETION, not an entitlement: the Instituto "podrá ' +
      'regularizar" the status of a foreigner in Mexican territory who expresses an interest in residing ' +
      'temporarily or permanently, provided they meet the requirements, and may grant whichever condición ' +
      'de estancia corresponds. In practice the requirements are those in art. 52 of the 2012 ' +
      'Lineamientos, and they are the INM-counter figures — 20,000 días of average monthly balance or 400 ' +
      'días of monthly income for a resident outcome — which are different numbers from the consular ones ' +
      'for the same-sounding test. A job offer is an alternative ground and carries no monetary figure.',
    es:
      'El primer párrafo del art. 133 es una FACULTAD DISCRECIONAL, no un derecho: el Instituto «podrá ' +
      'regularizar» la situación de la persona extranjera que se ubique en territorio nacional y ' +
      'manifieste su interés de residir de forma temporal o permanente, siempre que cumpla los ' +
      'requisitos, y puede conceder la condición de estancia que corresponda. En la práctica los ' +
      'requisitos son los del art. 52 de los Lineamientos de 2012, que son las cifras de ventanilla del ' +
      'INM —20,000 días de saldo promedio mensual o 400 días de ingresos mensuales para un resultado de ' +
      'residencia— distintas de las consulares para una prueba de nombre semejante. La oferta de empleo ' +
      'es un supuesto alternativo y no lleva cifra monetaria.',
  },
  citations: [
    lmigraArt132,
    lmigraArt133,
    lmigraArt135,
    lmigraArt136,
    regLmigraArt143,
    regLmigraArt144,
    regLmigraArt146,
    tramitesArt45,
    tramitesArt52,
    cpeumArt26b,
    uma2026,
    ldvuma,
  ],
  criteria: [
    {
      id: 'mx-reg-sol-in-mexico-without-status',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-lmigra-art-132', 'mx-lmigra-art-133', 'mx-reg-lmigra-art-144'],
      label: {
        en: 'Present in Mexican territory without regular migration status',
        es: 'Encontrarse en territorio nacional sin situación migratoria regular',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'irregular' },
    },
    {
      id: 'mx-reg-sol-discretionary-power',
      kind: 'procedural',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lmigra-art-133', 'mx-lineamientos-tramites-2012-art-45'],
      label: {
        en: 'The Instituto exercises its discretion favourably',
        es: 'El Instituto ejerce favorablemente su facultad discrecional',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'This is the difference between the two paragraphs of art. 133 and it is the whole character of ' +
          'this route. The second paragraph says certain people "tienen derecho" to regularisation; the ' +
          'first says the Instituto "PODRÁ regularizar". Meeting every requirement of this route ' +
          'therefore does not entitle anybody to anything, and no software output should suggest ' +
          'otherwise. What art. 45 of the 2012 Lineamientos does guarantee is that the authority must ' +
          'receive the application. If a family link or a vulnerability ground applies, the entitlement ' +
          'routes are better and should be checked first: see mx-regularizacion-vinculo-familiar and ' +
          'mx-regularizacion-vulnerabilidad.',
        es:
          'Esta es la diferencia entre los dos párrafos del art. 133 y define el carácter de toda la vía. ' +
          'El segundo párrafo dice que ciertas personas «tienen derecho» a la regularización; el primero ' +
          'dice que el Instituto «PODRÁ regularizar». Cumplir todos los requisitos de esta vía no otorga, ' +
          'por tanto, derecho a nada, y ningún resultado emitido por un programa debería sugerir lo ' +
          'contrario. Lo que sí garantiza el art. 45 de los Lineamientos de 2012 es que la autoridad debe ' +
          'recibir la solicitud. Si concurre un vínculo familiar o un supuesto de vulnerabilidad, las ' +
          'vías de derecho son mejores y deben comprobarse primero: véanse ' +
          'mx-regularizacion-vinculo-familiar y mx-regularizacion-vulnerabilidad.',
      },
    },
    {
      id: 'mx-reg-sol-requirements',
      kind: 'economic',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: [
        'mx-lineamientos-tramites-2012-art-52',
        'mx-lmigra-art-135',
        'mx-cpeum-art-26b-uma',
        'mx-uma-2026',
        'mx-ldvuma-arts-4-5',
      ],
      label: {
        en: 'The requirements of the condición de estancia sought, at the INM-counter figures',
        es: 'Los requisitos de la condición de estancia que se pretende, con las cifras de ventanilla del INM',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'The figures are those of art. 52 of the 2012 Lineamientos, stated in días de salario mínimo ' +
          'general vigente en el Distrito Federal: solvency, 20,000 días of average monthly balance over ' +
          'twelve months or 400 días of monthly income over six months, reduced to 500 and 150 días for a ' +
          'visitante sin permiso outcome; real property of 40,000 días; investor, 20,000 días plus an ' +
          'IMSS certificate of at least five workers; student, 20,000 días of balance over twelve months ' +
          'or 300 días for a visitante outcome. A job offer from a person or company formally established ' +
          'in Mexico, naming the occupation, the period, the place of work and the employer constancia de ' +
          'inscripción, is an alternative ground with no figure attached. THESE ARE NOT THE CONSULAR ' +
          'NUMBERS — Trámite 5 of the 2025 Lineamientos sets 11,460 and 680 días UMA for the ' +
          'same-sounding test, because the threshold attaches to the channel and not to the status. ' +
          'Meridian holds no index and, separately, could not establish which peso value INM applies to ' +
          'the pre-2016 unit. A reviewer must settle the ground, the channel and the conversion.',
        es:
          'Las cifras son las del art. 52 de los Lineamientos de 2012, expresadas en días de salario ' +
          'mínimo general vigente en el Distrito Federal: solvencia, 20,000 días de saldo promedio ' +
          'mensual durante doce meses o 400 días de ingresos mensuales durante seis meses, reducidos a ' +
          '500 y 150 días para un resultado de visitante sin permiso; bienes inmuebles por 40,000 días; ' +
          'inversionista, 20,000 días más constancia del IMSS de al menos cinco trabajadores; estudiante, ' +
          '20,000 días de saldo durante doce meses o 300 días para el resultado de visitante. La oferta ' +
          'de empleo de una persona física o moral formalmente establecida en territorio nacional, que ' +
          'indique la ocupación, la temporalidad, el lugar de trabajo y los datos de la constancia de ' +
          'inscripción del empleador, es un supuesto alternativo sin cifra. ESTAS NO SON LAS CIFRAS ' +
          'CONSULARES: el Trámite 5 de los Lineamientos de 2025 fija 11,460 y 680 días UMA para la prueba ' +
          'de nombre semejante, porque el umbral se adhiere al canal y no a la condición de estancia. ' +
          'Meridian no dispone del índice y, con independencia de ello, no pudo establecerse qué valor en ' +
          'pesos aplica el INM a la unidad anterior a 2016. Corresponde a una persona resolver el ' +
          'supuesto, el canal y la conversión.',
      },
    },
    {
      id: 'mx-reg-sol-no-temporary-programme',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['mx-reg-lmigra-art-143'],
      label: {
        en: 'No temporary regularisation programme was found open',
        es: 'No se localizó ningún programa temporal de regularización vigente',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Reglamento art. 143 lets SEGOB publish temporary programmes in the DOF to operate the general ' +
          'power of art. 133 first paragraph, and two were published — one in 2015 and the Programa ' +
          'Temporal de Regularización Migratoria of DOF 2016-10-11, whose transitional article gave it ' +
          'effect from 2017-01-09 to 2017-12-19. Both are expired by their own terms and no successor ' +
          'could be found as at 2026-07-26. A new one could be published at any time and would appear in ' +
          'the DOF, so this is worth re-checking rather than assuming. This criterion records the state ' +
          'of the search and affects no verdict.',
        es:
          'El art. 143 del Reglamento permite a la Secretaría publicar en el DOF programas temporales ' +
          'para operar la facultad general del primer párrafo del art. 133, y se publicaron dos: uno en ' +
          '2015 y el Programa Temporal de Regularización Migratoria del DOF 2016-10-11, cuyo artículo ' +
          'transitorio lo hizo regir del 2017-01-09 al 2017-12-19. Ambos están vencidos por sus propios ' +
          'términos y no se localizó sucesor alguno al 2026-07-26. Podría publicarse uno nuevo en ' +
          'cualquier momento y aparecería en el DOF, de modo que conviene volver a comprobarlo en lugar ' +
          'de darlo por sentado. Este criterio deja constancia del estado de la búsqueda y no incide en ' +
          'el resultado.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: true,
    citationIds: ['mx-lineamientos-tramites-2012-art-52', 'mx-lmigra-art-136', 'mx-reg-lmigra-art-146'],
    note: {
      en:
        'The ficha at art. 52 of the 2012 Lineamientos gives up to four years for a residente temporal, ' +
        'one year for a residente temporal estudiante and 180 days for a visitante, so the length depends ' +
        'on which condition is granted and no single figure is stated. Whether the time counts toward ' +
        'naturalisation depends on the same choice: Reglamento de la Ley de Nacionalidad art. 14 accepts ' +
        'a residente temporal or residente permanente card and nothing else. INM decides within thirty ' +
        'natural days under art. 136 of the Ley or twenty working days under Reglamento art. 146.III, ' +
        'both legal ceilings; a refusal carries a six-month bar on applying again.',
      es:
        'La ficha del art. 52 de los Lineamientos de 2012 concede hasta cuatro años para el residente ' +
        'temporal, un año para el residente temporal estudiante y 180 días para el visitante, de modo que ' +
        'la duración depende de qué condición se conceda y no se indica una cifra única. Que el tiempo ' +
        'compute para la naturalización depende de esa misma elección: el art. 14 del Reglamento de la ' +
        'Ley de Nacionalidad admite la tarjeta de residente temporal o la de residente permanente y nada ' +
        'más. El INM resuelve en treinta días naturales conforme al art. 136 de la Ley o en veinte días ' +
        'hábiles conforme al art. 146.III del Reglamento, ambos topes legales; la negativa conlleva la ' +
        'imposibilidad de volver a solicitar durante seis meses.',
    },
  },
  leadsTo: ['mx-residente-permanente-cuatro-anos', 'mx-naturalizacion-residencia-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Naturalización — Ley de Nacionalidad
//
// A different statute, a different regulation and a different ministry from
// everything above: the Secretaría de Relaciones Exteriores, not SEGOB or INM.
// Conflating the two systems will mislead on every route.
//
// Every record here reports `requires_human_review`, and that is the accurate
// answer rather than a limitation of the engine. Art. 25.III lets the SRE refuse
// a carta de naturalización "cuando no sea conveniente a juicio de la
// Secretaría", subject only to a duty to give reasons. An open-ended discretion
// at the end of the process means no Mexican naturalisation criterion may ever
// produce a confident `eligible`. The parts that CAN be checked — the residence
// run, the card, majority of age, the criminal-record certificates — are still
// checked and still shown.
// ---------------------------------------------------------------------------

export const mxNaturalizacionResidenciaGeneral: Pathway = {
  id: 'mx-naturalizacion-residencia-general',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Mexican nationality by naturalisation — general five-year period',
    es: 'Nacionalidad mexicana por naturalización — plazo general de cinco años',
  },
  summary: {
    en:
      'The default route: five years of residence in Mexican territory during the five years immediately ' +
      'preceding the application, proved ONLY with a residente temporal or residente permanente card, ' +
      'plus proof of speaking Spanish, knowing the country history and being integrated into the national ' +
      'culture, federal and local criminal-record certificates, and the renunciations and protest of ' +
      'art. 17 — which the SRE may not require until it has decided to grant. The Secretaría must obtain ' +
      'the opinion of SEGOB in every case.',
    es:
      'La vía ordinaria: cinco años de residencia en territorio nacional durante los cinco años ' +
      'inmediatos anteriores a la solicitud, acreditada ÚNICAMENTE con tarjeta de residente temporal o ' +
      'de residente permanente, además de probar que se habla español, se conoce la historia del país y ' +
      'se está integrado a la cultura nacional, los certificados de no antecedentes penales federal y ' +
      'local, y las renuncias y protesta del art. 17, que la Secretaría no puede exigir hasta haber ' +
      'decidido otorgar la nacionalidad. La Secretaría debe recabar en todos los casos la opinión de la ' +
      'Secretaría de Gobernación.',
  },
  citations: [lnacArt19, lnacArt20, lnacArt21, lnacArt25, regLnacArt14, regLnacArt15, regLnacArt16, cpeumArt37],
  criteria: [
    {
      id: 'mx-nat-gen-five-years-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['mx-lnac-art-20'],
      label: {
        en: 'Five years of residence during the five years immediately preceding the application',
        es: 'Cinco años de residencia durante los cinco años inmediatos anteriores a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 5 },
      guidance: {
        en:
          'Art. 20 requires residence "cuando menos durante los últimos cinco años inmediatos anteriores ' +
          'a la fecha de su solicitud", so this is an unbroken run reaching the application and not a ' +
          'lifetime total. Where only a day count is on file the criterion reports unknown rather than ' +
          'guessing. Temporary absences are dealt with separately by art. 21 and are not netted off here.',
        es:
          'El art. 20 exige residencia «cuando menos durante los últimos cinco años inmediatos anteriores ' +
          'a la fecha de su solicitud», de modo que se trata de un periodo ininterrumpido que llega hasta ' +
          'la solicitud y no de un total acumulado. Si solo consta un número de días, el criterio ' +
          'responde «desconocido» en lugar de suponer. Las ausencias temporales las trata por separado el ' +
          'art. 21 y no se descuentan aquí.',
      },
    },
    {
      id: 'mx-nat-gen-residence-card',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-14', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Residence held under a residente temporal or residente permanente card',
        es: 'Residencia acreditada con tarjeta de residente temporal o de residente permanente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
      guidance: {
        en:
          'Reglamento de la Ley de Nacionalidad art. 14 is short and decisive: residence for arts. 20 and ' +
          '21 is proved with a residente temporal card OR a residente permanente card, and with nothing ' +
          'else. TIME AS A VISITANTE PROVES NOTHING — 180-day stays repeated for a decade build no ' +
          'residence at all — and neither does irregular presence. Art. 16.III adds that the card must ' +
          'have at least six months of validity remaining after the application is filed and must carry ' +
          'the CURP, so renewing before filing is often the first practical step.',
        es:
          'El art. 14 del Reglamento de la Ley de Nacionalidad es breve y decisivo: la residencia de los ' +
          'arts. 20 y 21 se acredita con tarjeta de residente temporal O con tarjeta de residente ' +
          'permanente, y con nada más. EL TIEMPO COMO VISITANTE NO ACREDITA NADA —estancias de 180 días ' +
          'repetidas durante una década no generan residencia alguna— y tampoco lo hace la presencia ' +
          'irregular. El art. 16.III añade que la tarjeta debe tener al menos seis meses de vigencia ' +
          'posteriores a la presentación de la solicitud y contener la CURP, por lo que renovar antes de ' +
          'presentar suele ser el primer paso práctico.',
      },
    },
    {
      id: 'mx-nat-gen-majority-and-capacity',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-16'],
      label: {
        en: 'Of full age and in the exercise of civil rights',
        es: 'Ser mayor de edad y estar en uso de los derechos civiles',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
      guidance: {
        en:
          'Reglamento art. 16.I. Minors are not without a route: art. 20.III gives a one-year ' +
          'uninterrupted residence period to adoptees and to minor descendants to the second degree under ' +
          'the patria potestad of Mexicans, and a person who was a minor when their parents did not apply ' +
          'may apply themselves within the year following majority. See ' +
          'mx-naturalizacion-menores-adoptados.',
        es:
          'Art. 16.I del Reglamento. Los menores de edad no quedan sin vía: el art. 20.III concede un ' +
          'plazo de residencia de un año ininterrumpido a los adoptados y a los menores descendientes ' +
          'hasta segundo grado sujetos a la patria potestad de mexicanos, y quien era menor cuando ' +
          'quienes ejercían la patria potestad no solicitaron puede hacerlo por sí dentro del año ' +
          'siguiente a su mayoría de edad. Véase mx-naturalizacion-menores-adoptados.',
      },
    },
    {
      id: 'mx-nat-gen-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-16'],
      label: {
        en: 'Federal and local criminal-record certificates showing no convictions',
        es: 'Certificados de no antecedentes penales federal y local sin condenas',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'jurisdiction', value: 'MX' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
      guidance: {
        en:
          'Reglamento art. 16.VII requires a certificate or constancia of no criminal record issued by ' +
          'the competent authority at BOTH federal and local level, the local one depending on where the ' +
          'applicant resides. Meridian models a certificate by jurisdiction and cannot distinguish the ' +
          'two levels within Mexico, so this criterion is satisfied by any clear Mexican certificate on ' +
          'file and both must still be obtained. Art. 25.II separately bars a carta where the applicant ' +
          'is serving a custodial sentence for an intentional offence in Mexico or abroad, and art. 24 ' +
          'suspends the procedure where they are committed for trial.',
        es:
          'El art. 16.VII del Reglamento exige constancia o certificado de no antecedentes penales ' +
          'expedido por autoridad competente a nivel federal Y local, este último según el lugar de ' +
          'residencia. Meridian modela los certificados por jurisdicción y no puede distinguir los dos ' +
          'niveles dentro de México, de modo que este criterio se satisface con cualquier certificado ' +
          'mexicano sin antecedentes que conste, y aun así deben obtenerse ambos. El art. 25.II impide ' +
          'además expedir la carta a quien esté extinguiendo una sentencia privativa de la libertad por ' +
          'delito doloso en México o en el extranjero, y el art. 24 suspende el procedimiento a quien ' +
          'esté sujeto a proceso.',
      },
    },
    {
      id: 'mx-nat-gen-absences',
      kind: 'residence',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-21', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Absences within the final two years total no more than six months',
        es: 'Las ausencias de los dos últimos años no exceden en total de seis meses',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 21 is narrower than it looks and the engine cannot compute it today. Temporary absences ' +
          'do NOT interrupt residence unless they fall WITHIN THE TWO YEARS BEFORE THE APPLICATION AND ' +
          'TOTAL MORE THAN SIX MONTHS. Absences before that window do not count at all. DerivedFacts ' +
          'carries absenceDaysTotal and longestAbsenceDays, and both are lifetime figures across every ' +
          'absence on file — measuring the art. 21 rule against either would be wrong in both directions, ' +
          'refusing somebody whose long absences were years ago and passing somebody whose recent ones ' +
          'were decisive. The computation needed is the intersection of each absence with a two-year ' +
          'lookback ending on the application date, summed. A reviewer must do it from the statement ' +
          'under oath of every entry and exit that Reglamento art. 16.VI requires.',
        es:
          'El art. 21 es más estrecho de lo que parece y el motor no puede calcularlo hoy. Las ausencias ' +
          'temporales NO interrumpen la residencia salvo que se presenten DENTRO DE LOS DOS AÑOS ' +
          'ANTERIORES A LA SOLICITUD Y EXCEDAN EN TOTAL DE SEIS MESES. Las ausencias anteriores a esa ' +
          'ventana no cuentan en absoluto. DerivedFacts lleva absenceDaysTotal y longestAbsenceDays, y ' +
          'ambos son totales de toda la vida sobre todas las ausencias registradas: medir la regla del ' +
          'art. 21 con cualquiera de ellos erraría en los dos sentidos, rechazando a quien tuvo ausencias ' +
          'largas hace años y admitiendo a quien las tuvo recientes y decisivas. El cálculo necesario es ' +
          'la intersección de cada ausencia con una ventana de dos años que termina en la fecha de ' +
          'solicitud, sumada. Corresponde a una persona hacerlo a partir de la carta bajo protesta de ' +
          'decir verdad con todas las entradas y salidas que exige el art. 16.VI del Reglamento.',
      },
    },
    {
      id: 'mx-nat-gen-examination',
      kind: 'integration',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-19', 'mx-reg-lnac-art-15'],
      label: {
        en: 'Spanish, history and national culture, evidenced by the SRE examinations',
        es: 'Español, historia y cultura nacional, acreditados mediante los exámenes de la SRE',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 19.III of the Ley and art. 15 of the Reglamento require the applicant to prove they speak ' +
          'Spanish, know the country history and are integrated into the national culture, by sitting and ' +
          'passing examinations whose contents are approved by the Instituto Matías Romero. Persons SEGOB ' +
          'considers refugees, minors and PERSONS OVER SIXTY need only show that they speak Spanish. ' +
          'MERIDIAN ENCODES NO PASS MECHANICS AT ALL: two inconsistent official statements of the number ' +
          'of questions, the pass mark, the time allowed and the retake rules were found, and encoding ' +
          'either would be asserting a rule that may not exist. A reviewer must obtain the current guía ' +
          'de estudios and the current procedure from the SRE.',
        es:
          'El art. 19.III de la Ley y el art. 15 del Reglamento exigen probar que se habla español, se ' +
          'conoce la historia del país y se está integrado a la cultura nacional, presentando y aprobando ' +
          'los exámenes cuyos contenidos aprueba el Instituto Matías Romero. A quien la Secretaría de ' +
          'Gobernación considere refugiado, a los menores de edad y a las PERSONAS MAYORES DE SESENTA ' +
          'AÑOS les basta acreditar que hablan español. MERIDIAN NO CODIFICA MECÁNICA DE APROBACIÓN ' +
          'ALGUNA: se encontraron dos declaraciones oficiales incompatibles sobre el número de preguntas, ' +
          'la calificación aprobatoria, el tiempo concedido y las reglas de repetición, y codificar ' +
          'cualquiera de ellas sería afirmar una regla que quizá no exista. Corresponde a una persona ' +
          'obtener de la SRE la guía de estudios y el procedimiento vigentes.',
      },
    },
    {
      id: 'mx-nat-gen-sre-discretion',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-25'],
      label: {
        en: 'The SRE has an open discretion to refuse, and must first obtain the opinion of SEGOB',
        es: 'La SRE tiene facultad abierta para negar y debe recabar previamente la opinión de la SEGOB',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 25.III: no carta de naturalización is issued "cuando no sea conveniente a juicio de la ' +
          'Secretaría, en cuyo caso deberá fundar y motivar su decisión". That is an open-ended ' +
          'discretion with only a reasons requirement attached, and art. 23 additionally requires the ' +
          'SRE to obtain the opinion of SEGOB in every case. NO SOFTWARE OUTPUT MAY PRESENT A MEXICAN ' +
          'NATURALISATION AS ASSURED, however clean the arithmetic. This criterion exists so that the ' +
          'report says so out loud rather than leaving a reader to infer it.',
        es:
          'Art. 25.III: no se expide carta de naturalización «cuando no sea conveniente a juicio de la ' +
          'Secretaría, en cuyo caso deberá fundar y motivar su decisión». Es una facultad abierta con ' +
          'solo un deber de fundar y motivar, y el art. 23 exige además que la Secretaría recabe ' +
          'previamente la opinión de la Secretaría de Gobernación en todos los casos. NINGÚN RESULTADO ' +
          'EMITIDO POR UN PROGRAMA PUEDE PRESENTAR UNA NATURALIZACIÓN MEXICANA COMO SEGURA, por impecable ' +
          'que sea la aritmética. Este criterio existe para que el informe lo diga en voz alta en lugar ' +
          'de dejar que quien lea lo deduzca.',
      },
    },
    {
      id: 'mx-nat-gen-dual-nationality-warning',
      kind: 'nationality',
      weight: 'informational',
      citationIds: ['mx-cpeum-art-37'],
      label: {
        en: 'Mexican nationality acquired by naturalisation can be lost; nationality by birth cannot',
        es: 'La nacionalidad mexicana por naturalización puede perderse; la de nacimiento no',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Const. art. 37 is asymmetric and the asymmetry matters to anyone holding or planning a second ' +
          'nationality. Apartado A: no Mexican BY BIRTH may be deprived of Mexican nationality, without ' +
          'exception. Apartado B fraction I: Mexican nationality BY NATURALISATION — which is what this ' +
          'route confers — is LOST on voluntarily acquiring a foreign nationality, on holding oneself out ' +
          'as a foreigner in a public instrument, on using a foreign passport, or on accepting titles of ' +
          'nobility implying submission to a foreign state; fraction II adds five continuous years of ' +
          'residence abroad. Ley de Nacionalidad arts. 27 and 32 make the loss subject to a hearing, and ' +
          'art. 28 obliges authorities and fedatarios públicos to report such cases to the SRE within ' +
          'forty working days, so it is not theoretical. This bears directly on the Spanish records in ' +
          'this catalog: a Mexican by birth who naturalises in Spain under Código Civil art. 22.1 keeps ' +
          'Mexican nationality, while a Mexican by naturalisation who does the same loses it. Take that ' +
          'to counsel; this criterion affects no verdict.',
        es:
          'El art. 37 constitucional es asimétrico y la asimetría importa a quien tiene o proyecta una ' +
          'segunda nacionalidad. Apartado A: ningún mexicano POR NACIMIENTO puede ser privado de la ' +
          'nacionalidad mexicana, sin excepción. Apartado B fracción I: la nacionalidad mexicana POR ' +
          'NATURALIZACIÓN —que es la que confiere esta vía— SE PIERDE por adquisición voluntaria de una ' +
          'nacionalidad extranjera, por hacerse pasar como extranjero en cualquier instrumento público, ' +
          'por usar un pasaporte extranjero o por aceptar o usar títulos nobiliarios que impliquen ' +
          'sumisión a un Estado extranjero; la fracción II añade residir cinco años continuos en el ' +
          'extranjero. Los arts. 27 y 32 de la Ley de Nacionalidad someten la pérdida a audiencia previa, ' +
          'y el art. 28 obliga a autoridades y fedatarios públicos a comunicar esos casos a la SRE dentro ' +
          'de los cuarenta días hábiles siguientes, de modo que no es teórico. Esto incide directamente ' +
          'en los registros españoles de este catálogo: un mexicano por nacimiento que se naturalice ' +
          'español al amparo del art. 22.1 del Código Civil conserva la nacionalidad mexicana, mientras ' +
          'que un mexicano por naturalización que haga lo mismo la pierde. Consúltese con un profesional; ' +
          'este criterio no incide en el resultado.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['mx-lnac-art-20', 'mx-lnac-art-25'],
    note: {
      en:
        'The Carta de Naturalización takes effect the day after it is issued (art. 20, final paragraph). ' +
        'The renunciations and protest of art. 17 are a condition of ISSUE, not of application: art. 19.II ' +
        'says the SRE "no podrá exigir" them until it has decided to grant. Art. 26 lets the SRE declare ' +
        'the carta null, after a hearing, where it was issued without the requirements being met or in ' +
        'violation of the Ley, fixing the date from which it is void while preserving situations created ' +
        'in favour of third parties in good faith. No processing time is stated anywhere in this file.',
      es:
        'La Carta de Naturalización produce sus efectos al día siguiente de su expedición (art. 20, ' +
        'párrafo final). Las renuncias y protesta del art. 17 son condición de EXPEDICIÓN y no de ' +
        'solicitud: el art. 19.II dispone que la Secretaría «no podrá exigir» que se formulen hasta que ' +
        'se haya tomado la decisión de otorgar la nacionalidad. El art. 26 permite a la Secretaría ' +
        'declarar, previa audiencia, la nulidad de la carta expedida sin cumplir los requisitos o con ' +
        'violación de la Ley, fijando la fecha desde la cual es nula y dejando a salvo las situaciones ' +
        'creadas en favor de terceros de buena fe. En este archivo no se indica plazo de resolución ' +
        'alguno.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const mxNaturalizacionPlazoReducido: Pathway = {
  id: 'mx-naturalizacion-plazo-reducido',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Mexican nationality by naturalisation — two-year reduced period',
    es: 'Nacionalidad mexicana por naturalización — plazo reducido de dos años',
  },
  summary: {
    en:
      'Art. 20.I reduces the residence period to two years for a direct-line descendant of a Mexican by ' +
      'birth (a); a person with Mexican children by birth (b); a person "originario de un país ' +
      'latinoamericano o de la Península Ibérica" (c); and a person who has rendered outstanding services ' +
      'or works in cultural, social, scientific, technical, artistic, sporting or business matters ' +
      'benefiting the Nation, in the SRE judgement (d) — with the residence excused altogether in ' +
      'exceptional cases at the discretion of the Executive. A second paragraph to (a) exempts from ' +
      'residence entirely a direct-line descendant in the SECOND degree of a Mexican by birth who holds ' +
      'no other nationality at the time of application, or is not recognised the rights acquired at birth.',
    es:
      'El art. 20.I reduce el plazo de residencia a dos años para el descendiente en línea recta de un ' +
      'mexicano por nacimiento (a); para quien tenga hijos mexicanos por nacimiento (b); para quien sea ' +
      '«originario de un país latinoamericano o de la Península Ibérica» (c); y para quien, a juicio de ' +
      'la Secretaría, haya prestado servicios o realizado obras destacadas en materia cultural, social, ' +
      'científica, técnica, artística, deportiva o empresarial que beneficien a la Nación (d), con ' +
      'dispensa total de la residencia en casos excepcionales a juicio del Titular del Ejecutivo Federal. ' +
      'Un segundo párrafo del inciso (a) exime por completo de acreditar residencia al descendiente en ' +
      'línea recta en SEGUNDO grado de un mexicano por nacimiento que no cuente con otra nacionalidad al ' +
      'momento de la solicitud, o al que no le sean reconocidos los derechos adquiridos a partir de su ' +
      'nacimiento.',
  },
  citations: [
    lnacArt19,
    lnacArt20,
    lnacArt21,
    lnacArt25,
    regLnacArt14,
    regLnacArt15,
    regLnacArt16,
    cpeumArt30,
    cpeumArt37,
  ],
  criteria: [
    {
      id: 'mx-nat-red-qualifying-ground',
      kind: 'nationality',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-20', 'mx-cpeum-art-30', 'mx-reg-lnac-art-16'],
      label: {
        en: 'One of the four grounds in art. 20.I applies',
        es: 'Se actualiza alguno de los cuatro supuestos del art. 20.I',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'None of the four grounds can be decided from the facts this engine holds, and for different ' +
          'reasons. Grounds (a) and (b) turn on a RELATIVE being Mexican BY BIRTH: ApplicantFacts carries ' +
          'claimedNationalityAcquisition, which describes the applicant own nationality, and there is no ' +
          'field for a relative nationality or how they acquired it. Ground (c) turns on being ' +
          '"originario de un país latinoamericano o de la Península Ibérica", and NEITHER THE STATUTE, ' +
          'THE REGLAMENTO NOR THE SRE TRÁMITE PAGE ENUMERATES THOSE COUNTRIES — the list is also visibly ' +
          'not the same as the Ibero-American list Spain uses in Código Civil art. 24.1, which this ' +
          'catalog encodes elsewhere, because Mexico wording reads as including Spain and Portugal while ' +
          'excluding the Philippines and Equatorial Guinea. Guessing at a list would be inventing the ' +
          'route. Ground (d) is expressly "a juicio de la Secretaría". A reviewer must settle which ' +
          'ground is relied on and evidence it under Reglamento art. 17.',
        es:
          'Ninguno de los cuatro supuestos puede resolverse con los datos de que dispone este motor, y ' +
          'por razones distintas. Los incisos (a) y (b) dependen de que UN FAMILIAR sea mexicano POR ' +
          'NACIMIENTO: ApplicantFacts lleva claimedNationalityAcquisition, que describe la nacionalidad ' +
          'de la propia persona solicitante, y no existe campo para la nacionalidad de un familiar ni ' +
          'para su modo de adquisición. El inciso (c) depende de ser «originario de un país ' +
          'latinoamericano o de la Península Ibérica», y NI LA LEY, NI EL REGLAMENTO, NI LA PÁGINA DEL ' +
          'TRÁMITE DE LA SRE ENUMERAN ESOS PAÍSES; además la lista visiblemente no coincide con la ' +
          'iberoamericana del art. 24.1 del Código Civil español que este catálogo codifica en otro ' +
          'lugar, porque la redacción mexicana se lee como incluyendo a España y Portugal y excluyendo a ' +
          'Filipinas y Guinea Ecuatorial. Suponer una lista sería inventar la vía. El inciso (d) es ' +
          'expresamente «a juicio de la Secretaría». Corresponde a una persona determinar qué supuesto se ' +
          'invoca y acreditarlo conforme al art. 17 del Reglamento.',
      },
      guidance: {
        en:
          'One case in art. 20.I is worth checking before assuming any residence at all is needed. The ' +
          'second paragraph of (a) exempts from residence entirely a direct-line descendant in the second ' +
          'degree of a Mexican by birth, provided they hold no other nationality at the time of ' +
          'application or are not recognised the rights acquired at birth. Reglamento art. 17.I requires ' +
          'them to evidence, with a legalised or apostilled and translated certificate, that the state of ' +
          'their birth does not consider them a national and that no other state does either.',
        es:
          'Un supuesto del art. 20.I merece comprobarse antes de dar por hecho que hace falta residencia ' +
          'alguna. El segundo párrafo del inciso (a) exime por completo de acreditar residencia al ' +
          'descendiente en línea recta en segundo grado de un mexicano por nacimiento, siempre que no ' +
          'cuente con otra nacionalidad al momento de la solicitud o no le sean reconocidos los derechos ' +
          'adquiridos a partir de su nacimiento. El art. 17.I del Reglamento le exige acreditar, mediante ' +
          'constancia legalizada o apostillada y traducida, que el Estado en que nació no lo considera su ' +
          'nacional ni cualquier otro del que pudiera inferirse que lo considera tal.',
      },
    },
    {
      id: 'mx-nat-red-two-years-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['mx-lnac-art-20', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Two years of residence immediately preceding the application',
        es: 'Dos años de residencia inmediatos anteriores a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 2 },
      guidance: {
        en:
          'Reglamento art. 17 substitutes a two-year migratory document for the five-year one in the ' +
          'general list of requirements, keeping everything else. The card must still have at least six ' +
          'months of validity remaining after filing. The one case where this criterion does not apply at ' +
          'all is the second-degree descendant exemption in the second paragraph of art. 20.I(a).',
        es:
          'El art. 17 del Reglamento sustituye el documento migratorio de cinco años por uno de dos en la ' +
          'lista general de requisitos y conserva lo demás. La tarjeta debe seguir teniendo al menos seis ' +
          'meses de vigencia posteriores a la presentación. El único supuesto en que este criterio no ' +
          'aplica es la dispensa del descendiente en segundo grado del segundo párrafo del art. 20.I(a).',
      },
    },
    {
      id: 'mx-nat-red-residence-card',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-14', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Residence held under a residente temporal or residente permanente card',
        es: 'Residencia acreditada con tarjeta de residente temporal o de residente permanente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
      guidance: {
        en:
          'The reduced period changes the length of the residence, not what proves it. Reglamento art. 14 ' +
          'accepts only a residente temporal or residente permanente card; time as a visitante proves ' +
          'nothing on this route either.',
        es:
          'El plazo reducido cambia la duración de la residencia, no lo que la acredita. El art. 14 del ' +
          'Reglamento solo admite la tarjeta de residente temporal o la de residente permanente; el ' +
          'tiempo como visitante tampoco acredita nada en esta vía.',
      },
    },
    {
      id: 'mx-nat-red-majority-and-capacity',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-16'],
      label: {
        en: 'Of full age and in the exercise of civil rights',
        es: 'Ser mayor de edad y estar en uso de los derechos civiles',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
    },
    {
      id: 'mx-nat-red-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-16'],
      label: {
        en: 'Federal and local criminal-record certificates showing no convictions',
        es: 'Certificados de no antecedentes penales federal y local sin condenas',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'jurisdiction', value: 'MX' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'mx-nat-red-absences',
      kind: 'residence',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-21', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Absences within the final two years total no more than six months',
        es: 'Las ausencias de los dos últimos años no exceden en total de seis meses',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'On a two-year route the whole qualifying period sits inside the art. 21 window, so the ' +
          'six-month cap applies to ALL of it — which makes this rule considerably tighter here than on ' +
          'the five-year route, where only the last two years are tested. The engine cannot compute it: ' +
          'DerivedFacts carries only lifetime absence totals, and what art. 21 needs is the intersection ' +
          'of each absence with the two years before the application, summed. A reviewer must do it from ' +
          'the statement of every entry and exit that Reglamento art. 16.VI requires.',
        es:
          'En una vía de dos años todo el periodo cualificante cae dentro de la ventana del art. 21, de ' +
          'modo que el tope de seis meses se aplica a TODO él, lo que hace esta regla bastante más ' +
          'estricta aquí que en la vía de cinco años, donde solo se examinan los dos últimos. El motor no ' +
          'puede calcularlo: DerivedFacts solo lleva totales de ausencia de toda la vida, y lo que el ' +
          'art. 21 necesita es la intersección de cada ausencia con los dos años anteriores a la ' +
          'solicitud, sumada. Corresponde a una persona hacerlo a partir de la relación de entradas y ' +
          'salidas que exige el art. 16.VI del Reglamento.',
      },
    },
    {
      id: 'mx-nat-red-examination',
      kind: 'integration',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-19', 'mx-reg-lnac-art-15'],
      label: {
        en: 'Spanish, history and national culture, evidenced by the SRE examinations',
        es: 'Español, historia y cultura nacional, acreditados mediante los exámenes de la SRE',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'The examination requirement does not fall away on a reduced-period route: Reglamento art. 15 ' +
          'applies to "todo extranjero que pretenda naturalizarse mexicano". Persons SEGOB considers ' +
          'refugees, minors and persons over sixty need only show that they speak Spanish. Meridian ' +
          'encodes no pass mechanics, because two inconsistent official statements of them were found. A ' +
          'reviewer must obtain the current guía de estudios and procedure from the SRE.',
        es:
          'El requisito del examen no desaparece en una vía de plazo reducido: el art. 15 del Reglamento ' +
          'se aplica a «todo extranjero que pretenda naturalizarse mexicano». A quien la Secretaría de ' +
          'Gobernación considere refugiado, a los menores de edad y a las personas mayores de sesenta ' +
          'años les basta acreditar que hablan español. Meridian no codifica mecánica de aprobación ' +
          'alguna, porque se encontraron dos declaraciones oficiales incompatibles al respecto. ' +
          'Corresponde a una persona obtener de la SRE la guía de estudios y el procedimiento vigentes.',
      },
    },
    {
      id: 'mx-nat-red-sre-discretion',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-25'],
      label: {
        en: 'The SRE has an open discretion to refuse, and must first obtain the opinion of SEGOB',
        es: 'La SRE tiene facultad abierta para negar y debe recabar previamente la opinión de la SEGOB',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 25.III lets the SRE refuse "cuando no sea conveniente a juicio de la Secretaría", subject ' +
          'only to a duty to give reasons, and art. 23 requires the opinion of SEGOB in every case. No ' +
          'output of this engine may present a Mexican naturalisation as assured.',
        es:
          'El art. 25.III permite a la Secretaría negar «cuando no sea conveniente a juicio de la ' +
          'Secretaría», con el solo deber de fundar y motivar, y el art. 23 exige la opinión de la ' +
          'Secretaría de Gobernación en todos los casos. Ningún resultado de este motor puede presentar ' +
          'una naturalización mexicana como segura.',
      },
    },
    {
      id: 'mx-nat-red-dual-nationality-warning',
      kind: 'nationality',
      weight: 'informational',
      citationIds: ['mx-cpeum-art-37'],
      label: {
        en: 'Mexican nationality acquired by naturalisation can be lost; nationality by birth cannot',
        es: 'La nacionalidad mexicana por naturalización puede perderse; la de nacimiento no',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'This route is the one most likely to be taken by somebody who already holds a Latin American ' +
          'or Iberian nationality, which makes the warning especially live. Const. art. 37 apartado B ' +
          'fraction I: Mexican nationality acquired by naturalisation is lost on voluntarily acquiring ' +
          'ANOTHER foreign nationality, on holding oneself out as a foreigner in a public instrument, on ' +
          'using a foreign passport, or on accepting titles of nobility implying submission to a foreign ' +
          'state; fraction II adds five continuous years of residence abroad. Apartado A protects only ' +
          'Mexicans by birth, and it protects them absolutely. Ley de Nacionalidad art. 28 obliges ' +
          'officials to report such cases within forty working days. Anyone naturalising here who may ' +
          'later seek a further nationality — including Spanish nationality under Código Civil art. 22.1, ' +
          'which this catalog encodes — should take that to counsel first.',
        es:
          'Esta es la vía que con más probabilidad seguirá quien ya tiene una nacionalidad latinoamericana ' +
          'o ibérica, lo que hace la advertencia especialmente pertinente. Art. 37 constitucional, ' +
          'apartado B fracción I: la nacionalidad mexicana por naturalización se pierde por adquisición ' +
          'voluntaria de OTRA nacionalidad extranjera, por hacerse pasar como extranjero en cualquier ' +
          'instrumento público, por usar un pasaporte extranjero o por aceptar o usar títulos nobiliarios ' +
          'que impliquen sumisión a un Estado extranjero; la fracción II añade residir cinco años ' +
          'continuos en el extranjero. El apartado A protege solo a los mexicanos por nacimiento, y los ' +
          'protege de forma absoluta. El art. 28 de la Ley de Nacionalidad obliga a las autoridades a ' +
          'comunicar esos casos dentro de los cuarenta días hábiles siguientes. Quien se naturalice por ' +
          'esta vía y pueda buscar después otra nacionalidad —incluida la española del art. 22.1 del ' +
          'Código Civil, que este catálogo codifica— debería consultarlo antes con un profesional.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['mx-lnac-art-20', 'mx-lnac-art-25'],
    note: {
      en:
        'The Carta de Naturalización takes effect the day after it is issued. The reduced period changes ' +
        'only the length of the residence: every other requirement of Reglamento art. 16 continues to ' +
        'apply, and art. 17 sets out what each ground of art. 20.I must additionally evidence.',
      es:
        'La Carta de Naturalización produce sus efectos al día siguiente de su expedición. El plazo ' +
        'reducido cambia únicamente la duración de la residencia: los demás requisitos del art. 16 del ' +
        'Reglamento siguen aplicándose, y el art. 17 detalla lo que cada supuesto del art. 20.I debe ' +
        'acreditar adicionalmente.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const mxNaturalizacionConyuge: Pathway = {
  id: 'mx-naturalizacion-conyuge',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Mexican nationality by naturalisation — spouse of a Mexican',
    es: 'Nacionalidad mexicana por naturalización — cónyuge de persona mexicana',
  },
  summary: {
    en:
      'Art. 20.II reduces the period to two years for the foreign spouse of a Mexican, who must evidence ' +
      'that they have "residido y vivido de consuno en el domicilio conyugal establecido en territorio ' +
      'nacional" during the two years immediately preceding the application. Reglamento art. 18 adds that ' +
      'the marriage certificate must show a date of celebration at least two years before the ' +
      'application, and that the Mexican spouse must declare in person before the SRE that they live ' +
      'together and have established the conjugal domicile in national territory. The conjugal domicile ' +
      'need not be in Mexico where the Mexican spouse is abroad on a Mexican government posting.',
    es:
      'El art. 20.II reduce el plazo a dos años para el cónyuge extranjero de persona mexicana, que debe ' +
      'acreditar haber «residido y vivido de consuno en el domicilio conyugal establecido en territorio ' +
      'nacional» durante los dos años inmediatos anteriores a la solicitud. El art. 18 del Reglamento ' +
      'añade que el acta de matrimonio debe tener fecha de celebración de al menos dos años antes de la ' +
      'presentación, y que el cónyuge mexicano debe declarar personalmente ante la Secretaría que viven ' +
      'de consuno y han establecido el domicilio conyugal en territorio nacional. No es necesario que el ' +
      'domicilio conyugal esté en México cuando el cónyuge mexicano radique en el extranjero por encargo ' +
      'o comisión del Gobierno Mexicano.',
  },
  citations: [lnacArt19, lnacArt20, lnacArt21, lnacArt22, lnacArt25, regLnacArt14, regLnacArt15, regLnacArt16, cpeumArt37],
  criteria: [
    {
      id: 'mx-nat-con-marriage-and-conjugal-domicile',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-20', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Married to a Mexican for at least two years, living together in the conjugal domicile',
        es: 'Matrimonio con persona mexicana de al menos dos años, viviendo de consuno en el domicilio conyugal',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'THE TWO YEARS ARE OF MARRIAGE AND OF CONJUGAL RESIDENCE, NOT EITHER. Art. 20.II requires the ' +
          'applicant to have resided and lived together with the Mexican spouse in a conjugal domicile ' +
          'established in national territory for the two years immediately preceding the application, and ' +
          'Reglamento art. 18.I separately requires the marriage certificate to show a date of ' +
          'celebration at least two years before it. Meridian models neither a marriage nor a spouse ' +
          'nationality, so nothing here can be decided by software. Two riders are worth checking: the ' +
          'conjugal domicile need not be in Mexico where the Mexican spouse is abroad on a Mexican ' +
          'government posting, and where two foreigners are married and one later naturalises, the other ' +
          'may use this fraction. Art. 18.IV requires the Mexican spouse to make the declaration in ' +
          'person before the SRE.',
        es:
          'LOS DOS AÑOS SON DE MATRIMONIO Y DE RESIDENCIA CONYUGAL, NO DE UNO U OTRA. El art. 20.II exige ' +
          'haber residido y vivido de consuno con el cónyuge mexicano en un domicilio conyugal ' +
          'establecido en territorio nacional durante los dos años inmediatos anteriores a la solicitud, ' +
          'y el art. 18.I del Reglamento exige además que el acta de matrimonio tenga fecha de ' +
          'celebración de al menos dos años antes de esta. Meridian no modela ni el matrimonio ni la ' +
          'nacionalidad del cónyuge, de modo que nada de esto puede resolverlo un programa. Conviene ' +
          'comprobar dos salvedades: no hace falta que el domicilio conyugal esté en México cuando el ' +
          'cónyuge mexicano radique en el extranjero por encargo o comisión del Gobierno Mexicano, y ' +
          'cuando dos extranjeros están casados y uno se naturaliza después, el otro puede acogerse a ' +
          'esta fracción. El art. 18.IV exige que el cónyuge mexicano formule la declaración ' +
          'personalmente ante la Secretaría.',
      },
      guidance: {
        en:
          'These two years are NOT the same two years as the residente temporal step for the spouse of a ' +
          'Mexican under Ley de Migración arts. 56.II and 56.III. Those run from the day the residente ' +
          'temporal condition was acquired by reason of the bond and lead to permanent residence; these ' +
          'run from conjugal residence and marriage and lead to nationality. They frequently overlap, ' +
          'but they are computed differently and one does not evidence the other. Art. 22 adds that ' +
          'nationality acquired under this fraction survives dissolution of the marriage, except on ' +
          'annulment attributable to the naturalised spouse.',
        es:
          'Estos dos años NO son los mismos que el escalón de residente temporal del cónyuge de mexicano ' +
          'de los arts. 56.II y 56.III de la Ley de Migración. Aquellos corren desde el día en que se ' +
          'adquirió la condición de residente temporal por el vínculo y conducen a la residencia ' +
          'permanente; estos corren desde la residencia conyugal y el matrimonio y conducen a la ' +
          'nacionalidad. Coinciden con frecuencia, pero se computan de otro modo y uno no acredita el ' +
          'otro. El art. 22 añade que la nacionalidad adquirida por esta fracción se conserva aun después ' +
          'de disuelto el vínculo matrimonial, salvo en el caso de nulidad del matrimonio imputable al ' +
          'naturalizado.',
      },
    },
    {
      id: 'mx-nat-con-two-years-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['mx-lnac-art-20', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Two years of residence immediately preceding the application',
        es: 'Dos años de residencia inmediatos anteriores a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 2 },
    },
    {
      id: 'mx-nat-con-residence-card',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-14', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Residence held under a residente temporal or residente permanente card',
        es: 'Residencia acreditada con tarjeta de residente temporal o de residente permanente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
    },
    {
      id: 'mx-nat-con-majority-and-capacity',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-16'],
      label: {
        en: 'Of full age and in the exercise of civil rights',
        es: 'Ser mayor de edad y estar en uso de los derechos civiles',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
    },
    {
      id: 'mx-nat-con-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-16'],
      label: {
        en: 'Federal and local criminal-record certificates showing no convictions',
        es: 'Certificados de no antecedentes penales federal y local sin condenas',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'jurisdiction', value: 'MX' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'mx-nat-con-absences',
      kind: 'residence',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-21', 'mx-reg-lnac-art-16'],
      label: {
        en: 'Absences within the final two years total no more than six months',
        es: 'Las ausencias de los dos últimos años no exceden en total de seis meses',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'The art. 21 window and the qualifying period coincide exactly on this route, so the six-month ' +
          'cap applies to the whole of it. The engine cannot compute it: DerivedFacts carries only ' +
          'lifetime absence totals, and what is needed is the intersection of each absence with the two ' +
          'years before the application. There is a second reason a reviewer is needed here: art. 20.II ' +
          'is about living together in the conjugal domicile, so an absence may bear on that requirement ' +
          'as well as on the residence count.',
        es:
          'En esta vía la ventana del art. 21 y el periodo cualificante coinciden exactamente, de modo ' +
          'que el tope de seis meses se aplica a todo él. El motor no puede calcularlo: DerivedFacts solo ' +
          'lleva totales de ausencia de toda la vida, y lo que hace falta es la intersección de cada ' +
          'ausencia con los dos años anteriores a la solicitud. Hay una segunda razón para que intervenga ' +
          'una persona: el art. 20.II trata de vivir de consuno en el domicilio conyugal, de modo que una ' +
          'ausencia puede afectar a ese requisito además de al cómputo de residencia.',
      },
    },
    {
      id: 'mx-nat-con-examination',
      kind: 'integration',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-19', 'mx-reg-lnac-art-15'],
      label: {
        en: 'Spanish, history and national culture, evidenced by the SRE examinations',
        es: 'Español, historia y cultura nacional, acreditados mediante los exámenes de la SRE',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Reglamento art. 15 applies to every applicant, including the spouse of a Mexican. Persons ' +
          'SEGOB considers refugees, minors and persons over sixty need only show that they speak ' +
          'Spanish. Meridian encodes no pass mechanics: two inconsistent official statements of them were ' +
          'found and neither is relied on here.',
        es:
          'El art. 15 del Reglamento se aplica a toda persona solicitante, incluido el cónyuge de ' +
          'mexicano. A quien la Secretaría de Gobernación considere refugiado, a los menores de edad y a ' +
          'las personas mayores de sesenta años les basta acreditar que hablan español. Meridian no ' +
          'codifica mecánica de aprobación alguna: se encontraron dos declaraciones oficiales ' +
          'incompatibles y aquí no se invoca ninguna.',
      },
    },
    {
      id: 'mx-nat-con-sre-discretion',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-25'],
      label: {
        en: 'The SRE has an open discretion to refuse, and must first obtain the opinion of SEGOB',
        es: 'La SRE tiene facultad abierta para negar y debe recabar previamente la opinión de la SEGOB',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 25.III permits refusal "cuando no sea conveniente a juicio de la Secretaría" with only a ' +
          'duty to give reasons, and art. 23 requires the opinion of SEGOB in every case. Marriage to a ' +
          'Mexican shortens the residence period; it does not remove the discretion.',
        es:
          'El art. 25.III permite negar «cuando no sea conveniente a juicio de la Secretaría» con el solo ' +
          'deber de fundar y motivar, y el art. 23 exige la opinión de la Secretaría de Gobernación en ' +
          'todos los casos. El matrimonio con persona mexicana acorta el plazo de residencia; no suprime ' +
          'la facultad discrecional.',
      },
    },
    {
      id: 'mx-nat-con-dual-nationality-warning',
      kind: 'nationality',
      weight: 'informational',
      citationIds: ['mx-cpeum-art-37', 'mx-lnac-art-22'],
      label: {
        en: 'Nationality acquired here survives divorce, but can be lost by acquiring another nationality',
        es: 'La nacionalidad así adquirida sobrevive al divorcio, pero puede perderse al adquirir otra',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'MX' },
      guidance: {
        en:
          'Two different rules, often confused. Ley de Nacionalidad art. 22: nationality acquired under ' +
          'art. 20.II is KEPT after the marriage is dissolved, except on annulment attributable to the ' +
          'naturalised spouse — divorce does not undo it. Const. art. 37 apartado B fraction I: that same ' +
          'nationality, being by naturalisation, is LOST on voluntarily acquiring a foreign nationality, ' +
          'on using a foreign passport, on holding oneself out as a foreigner in a public instrument, or ' +
          'on accepting titles of nobility implying submission to a foreign state, and under fraction II ' +
          'on five continuous years of residence abroad. This criterion affects no verdict.',
        es:
          'Dos reglas distintas que suelen confundirse. Art. 22 de la Ley de Nacionalidad: la ' +
          'nacionalidad adquirida por el art. 20.II SE CONSERVA aun después de disuelto el vínculo ' +
          'matrimonial, salvo nulidad del matrimonio imputable al naturalizado: el divorcio no la ' +
          'deshace. Art. 37 constitucional, apartado B fracción I: esa misma nacionalidad, por ser por ' +
          'naturalización, SE PIERDE por adquisición voluntaria de una nacionalidad extranjera, por usar ' +
          'un pasaporte extranjero, por hacerse pasar como extranjero en cualquier instrumento público o ' +
          'por aceptar títulos nobiliarios que impliquen sumisión a un Estado extranjero, y conforme a la ' +
          'fracción II por residir cinco años continuos en el extranjero. Este criterio no incide en el ' +
          'resultado.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['mx-lnac-art-20', 'mx-lnac-art-22'],
    note: {
      en:
        'The Carta de Naturalización takes effect the day after it is issued. Art. 22 preserves the ' +
        'nationality after the marriage ends, except on annulment attributable to the naturalised spouse.',
      es:
        'La Carta de Naturalización produce sus efectos al día siguiente de su expedición. El art. 22 ' +
        'conserva la nacionalidad tras la disolución del matrimonio, salvo nulidad imputable al ' +
        'naturalizado.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const mxNaturalizacionMenoresAdoptados: Pathway = {
  id: 'mx-naturalizacion-menores-adoptados',
  version: '1.0.0',
  jurisdiction: MX,
  kind: 'naturalization',
  status: 'open',
  name: {
    en: 'Mexican nationality by naturalisation — adoptees and minor descendants',
    es: 'Nacionalidad mexicana por naturalización — adoptados y menores descendientes',
  },
  summary: {
    en:
      'Art. 20.III reduces the period to ONE YEAR, and requires that year to be UNINTERRUPTED, for ' +
      'adoptees and for minor descendants to the second degree under the patria potestad of Mexicans. ' +
      'Where those holding patria potestad did not apply, the person may apply themselves within the year ' +
      'following their majority. Art. 21 second sentence is explicit that the residence for this fraction ' +
      'must be unbroken, which is a stricter test than the six-month absence cap that governs the other ' +
      'routes.',
    es:
      'El art. 20.III reduce el plazo a UN AÑO, y exige que ese año sea ININTERRUMPIDO, para los ' +
      'adoptados y para los menores descendientes hasta segundo grado sujetos a la patria potestad de ' +
      'mexicanos. Si quienes ejercen la patria potestad no solicitaron la naturalización, la persona ' +
      'puede hacerlo por sí dentro del año siguiente contado a partir de su mayoría de edad. La segunda ' +
      'oración del art. 21 es explícita en que la residencia de esta fracción debe ser ininterrumpida, ' +
      'lo que es más estricto que el tope de seis meses de ausencias que rige las demás vías.',
  },
  citations: [lnacArt19, lnacArt20, lnacArt21, lnacArt25, regLnacArt14, regLnacArt15, regLnacArt16],
  criteria: [
    {
      id: 'mx-nat-men-qualifying-link',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-20'],
      label: {
        en: 'An adoptee, or a minor descendant to the second degree under the patria potestad of Mexicans',
        es: 'Adoptado, o menor descendiente hasta segundo grado sujeto a la patria potestad de mexicanos',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Adoption, patria potestad and the degree of descent are all facts about a family relationship ' +
          'and about somebody other than the applicant, and Meridian models none of them. A reviewer must ' +
          'establish the link and the nationality of the Mexicans exercising patria potestad. Note the ' +
          'second paragraph of art. 20.III: where those holding patria potestad did not apply for the ' +
          'minor, the person may apply on their own behalf within the YEAR FOLLOWING THEIR MAJORITY, and ' +
          'that year is a deadline that is easy to lose.',
        es:
          'La adopción, la patria potestad y el grado de descendencia son hechos de una relación ' +
          'familiar y relativos a persona distinta de la solicitante, y Meridian no modela ninguno. ' +
          'Corresponde a una persona acreditar el vínculo y la nacionalidad de quienes ejercen la patria ' +
          'potestad. Adviértase el segundo párrafo del art. 20.III: si quienes ejercen la patria potestad ' +
          'no solicitaron la naturalización del menor, este puede solicitarla por sí dentro del AÑO ' +
          'SIGUIENTE A SU MAYORÍA DE EDAD, y ese año es un plazo que se pierde con facilidad.',
      },
    },
    {
      id: 'mx-nat-men-one-year-residence',
      kind: 'residence',
      weight: 'blocking',
      citationIds: ['mx-lnac-art-20', 'mx-lnac-art-21'],
      label: {
        en: 'One year of residence immediately preceding the application',
        es: 'Un año de residencia inmediato anterior a la solicitud',
      },
      evaluator: { op: 'duration_since_at_least', path: 'derived.continuousLegalResidenceSince', years: 1 },
      guidance: {
        en:
          'Art. 21 second sentence: "La residencia a que se refiere la fracción III del artículo ' +
          'anterior, deberá ser ininterrumpida." This is stricter than the general rule — no six-month ' +
          'allowance applies, and the engine measures an unbroken run reaching the application date, ' +
          'which is the right shape for this fraction. See the separate absences criterion for what the ' +
          'engine still cannot check.',
        es:
          'Segunda oración del art. 21: «La residencia a que se refiere la fracción III del artículo ' +
          'anterior, deberá ser ininterrumpida.» Es más estricto que la regla general: no opera margen ' +
          'alguno de seis meses, y el motor mide un periodo ininterrumpido que llega hasta la fecha de ' +
          'solicitud, que es la forma correcta para esta fracción. Véase el criterio separado de ' +
          'ausencias para lo que el motor sigue sin poder comprobar.',
      },
    },
    {
      id: 'mx-nat-men-residence-card',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['mx-reg-lnac-art-14'],
      label: {
        en: 'Residence held under a residente temporal or residente permanente card',
        es: 'Residencia acreditada con tarjeta de residente temporal o de residente permanente',
      },
      evaluator: { op: 'one_of', path: 'currentStatus', values: ['resident', 'permanent_resident'] },
      guidance: {
        en:
          'Reglamento art. 14 applies to arts. 20 and 21 as a whole and makes no exception for minors: ' +
          'the residence must be evidenced by a residente temporal or residente permanente card. A child ' +
          'admitted as a dependant of a resident under Ley de Migración art. 52.VII or art. 55.IV will ' +
          'hold one; a child present on a visitor permit will not.',
        es:
          'El art. 14 del Reglamento se aplica a los arts. 20 y 21 en su conjunto y no exceptúa a los ' +
          'menores: la residencia debe acreditarse con tarjeta de residente temporal o de residente ' +
          'permanente. El menor admitido como dependiente de un residente conforme al art. 52.VII o al ' +
          'art. 55.IV de la Ley de Migración la tendrá; el que se encuentre con permiso de visitante, no.',
      },
    },
    {
      id: 'mx-nat-men-uninterrupted-residence',
      kind: 'residence',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-21', 'mx-reg-lnac-art-16'],
      label: {
        en: 'The year of residence was uninterrupted',
        es: 'El año de residencia fue ininterrumpido',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'The residence criterion above measures an unbroken run of RECORDED RESIDENCE PERIODS. Art. 21 ' +
          'requires the residence for this fraction to be uninterrupted in fact, which is a statement ' +
          'about absences and not about permits, and the engine holds only lifetime absence totals. ' +
          'Reglamento art. 16.VI requires a statement under oath listing every entry and exit in the ' +
          'relevant period; a reviewer must read it against this requirement, and should note that the ' +
          'six-month allowance available on the other routes does not apply here at all.',
        es:
          'El criterio de residencia anterior mide un periodo ininterrumpido de PERIODOS DE RESIDENCIA ' +
          'REGISTRADOS. El art. 21 exige que la residencia de esta fracción sea ininterrumpida de hecho, ' +
          'lo que es una afirmación sobre ausencias y no sobre permisos, y el motor solo dispone de ' +
          'totales de ausencia de toda la vida. El art. 16.VI del Reglamento exige una carta bajo ' +
          'protesta de decir verdad con todas las entradas y salidas del periodo correspondiente; ' +
          'corresponde a una persona contrastarla con este requisito, teniendo presente que el margen de ' +
          'seis meses disponible en las demás vías aquí no opera en absoluto.',
      },
    },
    {
      id: 'mx-nat-men-examination',
      kind: 'integration',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-19', 'mx-reg-lnac-art-15'],
      label: {
        en: 'Spanish, with minors exempt from the history and culture element',
        es: 'Español, con los menores de edad exentos de la parte de historia y cultura',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Reglamento art. 15 second paragraph: for a person SEGOB considers a refugee, for MINORS, and ' +
          'for persons over sixty, it is enough to show that they speak Spanish — the history and ' +
          'national culture element does not apply. Whether the applicant is a minor at the moment of ' +
          'application decides which version of the requirement they face, and on this route a person may ' +
          'be applying as a minor through those holding patria potestad or on their own behalf in the ' +
          'year after majority, which are different answers. Meridian encodes no pass mechanics in either ' +
          'case.',
        es:
          'Segundo párrafo del art. 15 del Reglamento: a quien la Secretaría de Gobernación considere ' +
          'refugiado, a los MENORES DE EDAD y a las personas mayores de sesenta años les basta acreditar ' +
          'que hablan español; la parte de historia y cultura nacional no les aplica. Que la persona sea ' +
          'menor al momento de solicitar decide qué versión del requisito enfrenta, y en esta vía puede ' +
          'solicitarse siendo menor a través de quienes ejercen la patria potestad o por sí en el año ' +
          'posterior a la mayoría de edad, que son respuestas distintas. Meridian no codifica mecánica de ' +
          'aprobación alguna en ninguno de los dos casos.',
      },
    },
    {
      id: 'mx-nat-men-sre-discretion',
      kind: 'procedural',
      weight: 'material',
      requiresHumanReview: true,
      citationIds: ['mx-lnac-art-25'],
      label: {
        en: 'The SRE has an open discretion to refuse, and must first obtain the opinion of SEGOB',
        es: 'La SRE tiene facultad abierta para negar y debe recabar previamente la opinión de la SEGOB',
      },
      evaluator: NO_ENCODABLE_FACT,
      humanReviewReason: {
        en:
          'Art. 25.III permits refusal "cuando no sea conveniente a juicio de la Secretaría" with only a ' +
          'duty to give reasons, and art. 23 requires the opinion of SEGOB in every case. That applies to ' +
          'this route as to every other.',
        es:
          'El art. 25.III permite negar «cuando no sea conveniente a juicio de la Secretaría» con el solo ' +
          'deber de fundar y motivar, y el art. 23 exige la opinión de la Secretaría de Gobernación en ' +
          'todos los casos. Se aplica a esta vía como a todas las demás.',
      },
    },
  ],
  durations: {
    countsTowardNaturalisation: false,
    citationIds: ['mx-lnac-art-20', 'mx-lnac-art-21'],
    note: {
      en:
        'The Carta de Naturalización takes effect the day after it is issued. The one-year period is the ' +
        'shortest in the statute and the only one whose residence must be uninterrupted outright; the ' +
        'six-month absence allowance of art. 21 does not reach it.',
      es:
        'La Carta de Naturalización produce sus efectos al día siguiente de su expedición. El plazo de un ' +
        'año es el más breve de la Ley y el único cuya residencia debe ser ininterrumpida sin matices: el ' +
        'margen de seis meses de ausencias del art. 21 no lo alcanza.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------

/**
 * Mexico as a destination: twenty-four records.
 *
 * Ordered by the structure of the Ley de Migración and then of the Ley de
 * Nacionalidad — the six visitor conditions of art. 52 fractions I to VI, the
 * two residence conditions of fractions VII and VIII, the permanent-residence
 * grounds of art. 54, the regularisation chapter of arts. 132 to 136, and
 * naturalisation. The order says nothing about merit or likelihood; ordering by
 * anything about an applicant would be a ranking, and a ranking is advice.
 *
 * Not here, and each absence is deliberate: refugee status, complementary
 * protection, political asylum and statelessness determination (out of scope —
 * COMAR and the SRE, see the header of this file); and any temporary
 * regularisation programme under Reglamento art. 143 (none found open as at
 * 2026-07-26).
 */
export const MX_INBOUND_PATHWAYS: readonly Pathway[] = [
  mxVisitanteSinPermiso,
  mxVisitanteConPermisoRemunerado,
  mxVisitanteRegional,
  mxVisitanteTrabajadorFronterizo,
  mxVisitanteRazonesHumanitarias,
  mxVisitanteAdopcion,
  mxResidenteTemporalConsular,
  mxResidenteTemporalEstudiante,
  mxResidenteTemporalOfertaEmpleo,
  mxResidenteTemporalUnidadFamiliar,
  mxResidentePermanenteCuatroAnos,
  mxResidentePermanenteJubilado,
  mxResidentePermanenteUnidadFamiliar,
  mxResidentePermanenteVinculoMexicano,
  mxResidentePermanenteSistemaPuntos,
  mxRegularizacionVinculoFamiliar,
  mxRegularizacionVulnerabilidad,
  mxRegularizacionDocumentoVencido,
  mxRegularizacionActividadesNoAutorizadas,
  mxRegularizacionSolvencia,
  mxNaturalizacionResidenciaGeneral,
  mxNaturalizacionPlazoReducido,
  mxNaturalizacionConyuge,
  mxNaturalizacionMenoresAdoptados,
];
